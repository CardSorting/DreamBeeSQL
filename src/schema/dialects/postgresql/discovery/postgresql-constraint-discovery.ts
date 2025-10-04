import type { Kysely } from '../../../../kysely.js'
import { sql } from '../../../../raw-builder/sql.js'

/**
 * PostgreSQL-specific constraint discovery
 */
export class PostgreSQLConstraintDiscovery {
  private static instance: PostgreSQLConstraintDiscovery

  static getInstance(): PostgreSQLConstraintDiscovery {
    if (!PostgreSQLConstraintDiscovery.instance) {
      PostgreSQLConstraintDiscovery.instance = new PostgreSQLConstraintDiscovery()
    }
    return PostgreSQLConstraintDiscovery.instance
  }

  /**
   * Discover all constraints for a table in PostgreSQL
   */
  async discoverTableConstraints(db: Kysely<any>, tableName: string): Promise<any[]> {
    try {
      const constraints = await db
        .selectFrom('pg_constraint as con')
        .innerJoin('pg_class as c', 'con.conrelid', 'c.oid')
        .innerJoin('pg_namespace as ns', 'c.relnamespace', 'ns.oid')
        .select([
          'con.conname as name',
          sql<string>`con.contype`.as('type'),
          sql<string[]>`array_agg(a.attname ORDER BY array_position(con.conkey, a.attnum))`.as('columns'),
          sql<string>`pg_get_constraintdef(con.oid)`.as('definition'),
          sql<boolean>`con.condeferrable`.as('deferrable'),
          sql<boolean>`con.condeferred`.as('deferred'),
          sql<string>`obj_description(con.oid, 'pg_constraint')`.as('comment')
        ])
        .innerJoin('pg_attribute as a', (join: any) =>
          join.onRef('a.attrelid', '=', 'c.oid')
              .on('a.attnum', '=', sql`ANY(con.conkey)`)
        )
        .where('c.relname', '=', tableName)
        .where('ns.nspname', '=', 'public')
        .groupBy(['con.conname', 'con.contype', 'con.oid', 'con.condeferrable', 'con.condeferred'])
        .execute()

      return constraints
    } catch (error) {
      console.warn(`Failed to discover constraints for PostgreSQL table ${tableName}:`, error)
      return []
    }
  }

  /**
   * Discover foreign key constraints specifically
   */
  async discoverForeignKeyConstraints(db: Kysely<any>, tableName: string): Promise<any[]> {
    try {
      const foreignKeys = await db
        .selectFrom('pg_constraint as con')
        .innerJoin('pg_class as c', 'con.conrelid', 'c.oid')
        .innerJoin('pg_class as f', 'con.confrelid', 'f.oid')
        .innerJoin('pg_namespace as ns', 'f.relnamespace', 'ns.oid')
        .select([
          'con.conname as name',
          sql<string>`a.attname`.as('column'),
          sql<string>`f.relname`.as('referencedTable'),
          sql<string>`fa.attname`.as('referencedColumn'),
          sql<string>`CASE con.confdeltype 
            WHEN 'a' THEN 'NO ACTION' 
            WHEN 'r' THEN 'RESTRICT' 
            WHEN 'c' THEN 'CASCADE' 
            WHEN 'n' THEN 'SET NULL' 
            WHEN 'd' THEN 'SET DEFAULT' 
          END`.as('onDelete'),
          sql<string>`CASE con.confupdtype 
            WHEN 'a' THEN 'NO ACTION' 
            WHEN 'r' THEN 'RESTRICT' 
            WHEN 'c' THEN 'CASCADE' 
            WHEN 'n' THEN 'SET NULL' 
            WHEN 'd' THEN 'SET DEFAULT' 
          END`.as('onUpdate'),
          sql<boolean>`con.condeferrable`.as('deferrable'),
          sql<boolean>`con.condeferred`.as('deferred')
        ])
        .innerJoin('pg_attribute as a', (join: any) =>
          join.onRef('a.attrelid', '=', 'c.oid')
              .on('a.attnum', '=', sql`con.conkey[1]`)
        )
        .innerJoin('pg_attribute as fa', (join: any) =>
          join.onRef('fa.attrelid', '=', 'f.oid')
              .on('fa.attnum', '=', sql`con.confkey[1]`)
        )
        .where('c.relname', '=', tableName)
        .where('con.contype', '=', 'f')
        .execute()

      return foreignKeys
    } catch (error) {
      console.warn(`Failed to discover foreign key constraints for PostgreSQL table ${tableName}:`, error)
      return []
    }
  }

  /**
   * Discover check constraints
   */
  async discoverCheckConstraints(db: Kysely<any>, tableName: string): Promise<any[]> {
    try {
      const checkConstraints = await db
        .selectFrom('pg_constraint as con')
        .innerJoin('pg_class as c', 'con.conrelid', 'c.oid')
        .select([
          'con.conname as name',
          sql<string>`pg_get_constraintdef(con.oid)`.as('definition'),
          sql<boolean>`con.condeferrable`.as('deferrable'),
          sql<boolean>`con.condeferred`.as('deferred')
        ])
        .where('c.relname', '=', tableName)
        .where('con.contype', '=', 'c')
        .execute()

      return checkConstraints
    } catch (error) {
      console.warn(`Failed to discover check constraints for PostgreSQL table ${tableName}:`, error)
      return []
    }
  }

  /**
   * Validate constraint definitions
   */
  validateConstraints(constraints: any[]): { isValid: boolean; issues: string[] } {
    const issues: string[] = []

    for (const constraint of constraints) {
      if (!constraint.name) {
        issues.push('Constraint name is required')
      }

      if (!constraint.type) {
        issues.push(`Constraint type is required for ${constraint.name}`)
      }

      if (constraint.type === 'f' && !constraint.referencedTable) {
        issues.push(`Foreign key constraint ${constraint.name} missing referenced table`)
      }

      if (constraint.type === 'c' && !constraint.definition) {
        issues.push(`Check constraint ${constraint.name} missing definition`)
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    }
  }

  /**
   * Analyze constraint performance impact
   */
  analyzeConstraintPerformance(constraints: any[]): {
    recommendations: string[]
    deferredConstraints: string[]
    immediateConstraints: string[]
  } {
    const recommendations: string[] = []
    const deferredConstraints: string[] = []
    const immediateConstraints: string[] = []

    for (const constraint of constraints) {
      if (constraint.deferrable && constraint.deferred) {
        deferredConstraints.push(constraint.name)
        recommendations.push(`Deferred constraint ${constraint.name} may impact performance during bulk operations`)
      } else {
        immediateConstraints.push(constraint.name)
      }

      // Check for complex check constraints
      if (constraint.type === 'c' && constraint.definition) {
        const definition = constraint.definition.toLowerCase()
        if (definition.includes('subquery') || definition.includes('join')) {
          recommendations.push(`Complex check constraint ${constraint.name} may impact performance`)
        }
      }
    }

    return {
      recommendations,
      deferredConstraints,
      immediateConstraints
    }
  }
}
