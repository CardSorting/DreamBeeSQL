import chalk from 'chalk'
import { NOORMME } from '../../noormme.js'
import { TableInfo, RelationshipInfo } from '../../types/index.js'

export async function inspect(tableName?: string, options: {
  connection?: string
  all?: boolean
  relationships?: boolean
} = {}) {
  console.log(chalk.blue.bold('\n🔍 Database Schema Inspection\n'))

  try {
    // Initialize NOORMME
    const db = options.connection ? new NOORMME(options.connection) : new NOORMME()
    await db.initialize()

    const schemaInfo = await db.getSchemaInfo()

    if (tableName) {
      // Show specific table
      const table = schemaInfo.tables.find(t => t.name === tableName)
      if (!table) {
        console.error(chalk.red(`❌ Table '${tableName}' not found`))
        console.log(chalk.gray('Available tables:'))
        schemaInfo.tables.forEach(t => console.log(chalk.gray(`  - ${t.name}`)))
        process.exit(1)
      }

      showTableDetails(table, schemaInfo.relationships)
    } else {
      // Show all tables
      console.log(chalk.green(`Found ${schemaInfo.tables.length} tables:\n`))

      showTablesList(schemaInfo.tables)

      if (options.relationships) {
        console.log('\n' + chalk.blue.bold('Relationships:\n'))
        showRelationships(schemaInfo.relationships)
      }
    }

    await db.close()

  } catch (error) {
    console.error(chalk.red('❌ Inspection failed:'), error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

function showTablesList(tables: TableInfo[]): void {
  const tableData = tables.map(table => ({
    name: table.name,
    columns: table.columns.length,
    primaryKey: table.primaryKey?.join(', ') || 'None',
    foreignKeys: table.foreignKeys.length,
    indexes: table.indexes.length
  }))

  // Simple table formatting
  console.log(chalk.gray('┌─' + '─'.repeat(20) + '┬─' + '─'.repeat(8) + '┬─' + '─'.repeat(15) + '┬─' + '─'.repeat(5) + '┬─' + '─'.repeat(8) + '┐'))
  console.log(chalk.gray('│ ') + chalk.bold('Table Name'.padEnd(19)) + chalk.gray('│ ') + chalk.bold('Columns'.padEnd(7)) + chalk.gray('│ ') + chalk.bold('Primary Key'.padEnd(14)) + chalk.gray('│ ') + chalk.bold('FKs'.padEnd(4)) + chalk.gray('│ ') + chalk.bold('Indexes'.padEnd(7)) + chalk.gray('│'))
  console.log(chalk.gray('├─' + '─'.repeat(20) + '┼─' + '─'.repeat(8) + '┼─' + '─'.repeat(15) + '┼─' + '─'.repeat(5) + '┼─' + '─'.repeat(8) + '┤'))

  tableData.forEach(table => {
    console.log(
      chalk.gray('│ ') + chalk.cyan(table.name.padEnd(19)) +
      chalk.gray('│ ') + String(table.columns).padEnd(7) +
      chalk.gray('│ ') + table.primaryKey.padEnd(14) +
      chalk.gray('│ ') + String(table.foreignKeys).padEnd(4) +
      chalk.gray('│ ') + String(table.indexes).padEnd(7) +
      chalk.gray('│')
    )
  })

  console.log(chalk.gray('└─' + '─'.repeat(20) + '┴─' + '─'.repeat(8) + '┴─' + '─'.repeat(15) + '┴─' + '─'.repeat(5) + '┴─' + '─'.repeat(8) + '┘'))
}

function showTableDetails(table: TableInfo, relationships: RelationshipInfo[]): void {
  console.log(chalk.green.bold(`Table: ${table.name}`))
  if (table.schema) {
    console.log(chalk.gray(`Schema: ${table.schema}`))
  }
  console.log()

  // Columns
  console.log(chalk.blue.bold('Columns:'))
  console.log(chalk.gray('┌─' + '─'.repeat(25) + '┬─' + '─'.repeat(15) + '┬─' + '─'.repeat(8) + '┬─' + '─'.repeat(10) + '┐'))
  console.log(chalk.gray('│ ') + chalk.bold('Name'.padEnd(24)) + chalk.gray('│ ') + chalk.bold('Type'.padEnd(14)) + chalk.gray('│ ') + chalk.bold('Nullable'.padEnd(7)) + chalk.gray('│ ') + chalk.bold('Default'.padEnd(9)) + chalk.gray('│'))
  console.log(chalk.gray('├─' + '─'.repeat(25) + '┼─' + '─'.repeat(15) + '┼─' + '─'.repeat(8) + '┼─' + '─'.repeat(10) + '┤'))

  table.columns.forEach(col => {
    const name = col.isPrimaryKey ? chalk.yellow(`${col.name} (PK)`) : col.name
    const nullable = col.nullable ? chalk.green('YES') : chalk.red('NO')
    const defaultValue = col.defaultValue ? String(col.defaultValue) : ''

    console.log(
      chalk.gray('│ ') + name.padEnd(24) +
      chalk.gray('│ ') + col.type.padEnd(14) +
      chalk.gray('│ ') + nullable.padEnd(7) +
      chalk.gray('│ ') + defaultValue.padEnd(9) +
      chalk.gray('│')
    )
  })

  console.log(chalk.gray('└─' + '─'.repeat(25) + '┴─' + '─'.repeat(15) + '┴─' + '─'.repeat(8) + '┴─' + '─'.repeat(10) + '┘'))

  // Primary Key
  if (table.primaryKey && table.primaryKey.length > 0) {
    console.log()
    console.log(chalk.blue.bold('Primary Key:'))
    console.log(chalk.gray(`  ${table.primaryKey.join(', ')}`))
  }

  // Foreign Keys
  if (table.foreignKeys.length > 0) {
    console.log()
    console.log(chalk.blue.bold('Foreign Keys:'))
    table.foreignKeys.forEach(fk => {
      console.log(chalk.gray(`  ${fk.column} → ${fk.referencedTable}.${fk.referencedColumn}`))
      if (fk.onDelete) console.log(chalk.gray(`    ON DELETE ${fk.onDelete}`))
      if (fk.onUpdate) console.log(chalk.gray(`    ON UPDATE ${fk.onUpdate}`))
    })
  }

  // Indexes
  if (table.indexes.length > 0) {
    console.log()
    console.log(chalk.blue.bold('Indexes:'))
    table.indexes.forEach(idx => {
      const type = idx.unique ? chalk.yellow('UNIQUE') : 'INDEX'
      console.log(chalk.gray(`  ${idx.name} (${type}): ${idx.columns.join(', ')}`))
    })
  }

  // Relationships for this table
  const tableRelationships = relationships.filter(r =>
    r.fromTable === table.name || r.toTable === table.name
  )

  if (tableRelationships.length > 0) {
    console.log()
    console.log(chalk.blue.bold('Relationships:'))
    tableRelationships.forEach(rel => {
      const direction = rel.fromTable === table.name ? '→' : '←'
      const otherTable = rel.fromTable === table.name ? rel.toTable : rel.fromTable
      const type = rel.type.toUpperCase().replace('-', ' ')

      console.log(chalk.gray(`  ${rel.name} (${type}) ${direction} ${otherTable}`))
    })
  }

  // Usage example
  console.log()
  console.log(chalk.blue.bold('Usage Example:'))
  console.log(chalk.gray('```typescript'))
  console.log(chalk.gray(`const ${table.name}Repo = db.getRepository('${table.name}')`))
  console.log(chalk.gray(`const records = await ${table.name}Repo.findAll()`))
  console.log(chalk.gray(`const record = await ${table.name}Repo.findById(1)`))

  if (tableRelationships.length > 0) {
    const relationshipNames = tableRelationships.map(r => `'${r.name}'`).join(', ')
    console.log(chalk.gray(`const withRelations = await ${table.name}Repo.findWithRelations(1, [${relationshipNames}])`))
  }

  console.log(chalk.gray('```'))
}

function showRelationships(relationships: RelationshipInfo[]): void {
  if (relationships.length === 0) {
    console.log(chalk.gray('No relationships found.'))
    return
  }

  relationships.forEach(rel => {
    const type = rel.type.toUpperCase().replace('-', ' ')
    console.log(chalk.cyan(`${rel.name} (${type})`))
    console.log(chalk.gray(`  ${rel.fromTable}.${rel.fromColumn} → ${rel.toTable}.${rel.toColumn}`))

    if (rel.throughTable) {
      console.log(chalk.gray(`  Through: ${rel.throughTable}`))
    }
    console.log()
  })
}