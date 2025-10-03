import {
  DatabaseIntrospector,
  DatabaseMetadata,
  DatabaseMetadataOptions,
  SchemaMetadata,
  TableMetadata,
} from '../database-introspector.js'
import {
  DEFAULT_MIGRATION_LOCK_TABLE,
  DEFAULT_MIGRATION_TABLE,
} from '../../migration/migrator.js'
import { Kysely } from '../../kysely.js'
import { freeze } from '../../util/object-utils.js'
import { sql } from '../../raw-builder/sql.js'

export class PostgresIntrospector extends DatabaseIntrospector {
  readonly #db: Kysely<any>

  constructor(db: Kysely<any>) {
    super(db)
    this.#db = db
  }

  async getSchemas(): Promise<SchemaMetadata[]> {
    let rawSchemas = await this.#db
      .selectFrom('pg_catalog.pg_namespace')
      .select('nspname')
      .$castTo<RawSchemaMetadata>()
      .execute()

    return rawSchemas.map((it) => ({ name: it.nspname }))
  }

  async getTables(
    options: DatabaseMetadataOptions = { withInternalKyselyTables: false },
  ): Promise<TableMetadata[]> {
    let query = this.#db
      // column
      .selectFrom('pg_catalog.pg_attribute as a')
      // table
      .innerJoin('pg_catalog.pg_class as c', 'a.attrelid', 'c.oid')
      // table schema
      .innerJoin('pg_catalog.pg_namespace as ns', 'c.relnamespace', 'ns.oid')
      // column data type
      .innerJoin('pg_catalog.pg_type as typ', 'a.atttypid', 'typ.oid')
      // column data type schema
      .innerJoin(
        'pg_catalog.pg_namespace as dtns',
        'typ.typnamespace',
        'dtns.oid',
      )
      .select([
        'a.attname as column',
        'a.attnotnull as not_null',
        'a.atthasdef as has_default',
        'c.relname as table',
        'c.relkind as table_type',
        'ns.nspname as schema',
        'typ.typname as type',
        'dtns.nspname as type_schema',
        sql<string | null>`col_description(a.attrelid, a.attnum)`.as(
          'column_description',
        ),
        sql<
          string | null
        >`pg_get_serial_sequence(quote_ident(ns.nspname) || '.' || quote_ident(c.relname), a.attname)`.as(
          'auto_incrementing',
        ),
      ])
      .where('c.relkind', 'in', [
        'r' /*regular table*/,
        'v' /*view*/,
        'p' /*partitioned table*/,
      ])
      .where('ns.nspname', '!~', '^pg_')
      .where('ns.nspname', '!=', 'information_schema')
      // Filter out internal cockroachdb schema
      .where('ns.nspname', '!=', 'crdb_internal')
      // Only schemas where we are allowed access
      .where(sql<boolean>`has_schema_privilege(ns.nspname, 'USAGE')`)
      // No system columns
      .where('a.attnum', '>=', 0)
      .where('a.attisdropped', '!=', true)
      .orderBy('ns.nspname')
      .orderBy('c.relname')
      .orderBy('a.attnum')
      .$castTo<RawColumnMetadata>()

    if (!options.withInternalKyselyTables) {
      query = query
        .where('c.relname', '!=', DEFAULT_MIGRATION_TABLE)
        .where('c.relname', '!=', DEFAULT_MIGRATION_LOCK_TABLE)
    }

    const rawColumns = await query.execute()

    return this.#parseTableMetadata(rawColumns)
  }

  async getColumns(tableName: string): Promise<any[]> {
    // Get columns for a specific table
    const columns = await this.#db
      .selectFrom('pg_catalog.pg_attribute as a')
      .innerJoin('pg_catalog.pg_class as c', 'a.attrelid', 'c.oid')
      .innerJoin('pg_catalog.pg_namespace as ns', 'c.relnamespace', 'ns.oid')
      .innerJoin('pg_catalog.pg_type as typ', 'a.atttypid', 'typ.oid')
      .leftJoin('pg_catalog.pg_index as i', (join) => 
        join.onRef('i.indrelid', '=', 'c.oid')
            .on('i.indisprimary', '=', true)
            .on('a.attnum', '=', sql`ANY(i.indkey)`)
      )
      .select([
        'a.attname as name',
        'typ.typname as type',
        sql<boolean>`NOT a.attnotnull`.as('nullable'),
        'a.atthasdef as hasDefaultValue',
        sql<boolean>`i.indexrelid IS NOT NULL`.as('isPrimaryKey'),
        sql<boolean>`pg_get_serial_sequence(quote_ident(ns.nspname) || '.' || quote_ident(c.relname), a.attname) IS NOT NULL`.as('isAutoIncrement')
      ])
      .where('c.relname', '=', tableName)
      .where('a.attnum', '>=', 0)
      .where('a.attisdropped', '!=', true)
      .execute()

    return columns
  }

  async getIndexes(tableName: string): Promise<any[]> {
    // Get indexes for a specific table
    const indexes = await this.#db
      .selectFrom('pg_catalog.pg_index as i')
      .innerJoin('pg_catalog.pg_class as c', 'i.indrelid', 'c.oid')
      .innerJoin('pg_catalog.pg_class as ic', 'i.indexrelid', 'ic.oid')
      .select([
        'ic.relname as name',
        sql<boolean>`i.indisunique`.as('unique'),
        sql<string[]>`array_agg(a.attname ORDER BY array_position(i.indkey, a.attnum))`.as('columns')
      ])
      .innerJoin('pg_catalog.pg_attribute as a', (join) => 
        join.onRef('a.attrelid', '=', 'c.oid')
            .on('a.attnum', '=', sql`ANY(i.indkey)`)
      )
      .where('c.relname', '=', tableName)
      .groupBy(['ic.relname', 'i.indisunique'])
      .execute()

    return indexes
  }

  async getForeignKeys(tableName: string): Promise<any[]> {
    // Get foreign keys for a specific table
    const foreignKeys = await this.#db
      .selectFrom('pg_catalog.pg_constraint as con')
      .innerJoin('pg_catalog.pg_class as c', 'con.conrelid', 'c.oid')
      .innerJoin('pg_catalog.pg_class as f', 'con.confrelid', 'f.oid')
      .innerJoin('pg_catalog.pg_namespace as ns', 'f.relnamespace', 'ns.oid')
      .select([
        'con.conname as name',
        sql<string>`a.attname`.as('column'),
        sql<string>`f.relname`.as('referencedTable'),
        sql<string>`fa.attname`.as('referencedColumn'),
        sql<string>`CASE con.confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END`.as('onDelete'),
        sql<string>`CASE con.confupdtype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END`.as('onUpdate')
      ])
      .innerJoin('pg_catalog.pg_attribute as a', (join) =>
        join.onRef('a.attrelid', '=', 'c.oid')
            .on('a.attnum', '=', sql`con.conkey[1]`)
      )
      .innerJoin('pg_catalog.pg_attribute as fa', (join) =>
        join.onRef('fa.attrelid', '=', 'f.oid')
            .on('fa.attnum', '=', sql`con.confkey[1]`)
      )
      .where('c.relname', '=', tableName)
      .where('con.contype', '=', 'f')
      .execute()

    return foreignKeys
  }

  async getMetadata(
    options?: DatabaseMetadataOptions,
  ): Promise<DatabaseMetadata> {
    return {
      tables: await this.getTables(options),
    }
  }

  #parseTableMetadata(columns: RawColumnMetadata[]): TableMetadata[] {
    return columns.reduce<TableMetadata[]>((tables, it) => {
      let table = tables.find(
        (tbl) => tbl.name === it.table && tbl.schema === it.schema,
      )

      if (!table) {
        table = freeze({
          name: it.table,
          isView: it.table_type === 'v',
          schema: it.schema,
          columns: [],
        })

        tables.push(table)
      }

      // TypeScript error fix: TableMetadata may not have 'columns' property at this point.
      // Ensure 'columns' property exists on table before pushing.
      if (!('columns' in table)) {
        (table as any).columns = []
      }

      (table as any).columns.push(
        freeze({
          name: it.column,
          dataType: it.type,
          dataTypeSchema: it.type_schema,
          isNullable: !it.not_null,
          isAutoIncrementing: it.auto_incrementing !== null,
          hasDefaultValue: it.has_default,
          comment: it.column_description ?? undefined,
        }),
      )

      return tables
    }, [])
  }
}

interface RawSchemaMetadata {
  nspname: string
}

interface RawColumnMetadata {
  column: string
  table: string
  table_type: string
  schema: string
  not_null: boolean
  has_default: boolean
  type: string
  type_schema: string
  auto_incrementing: string | null
  column_description: string | null
}
