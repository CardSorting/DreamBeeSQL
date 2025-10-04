import chalk from 'chalk'
import { NOORMME } from '../../noormme.js'
import { promises as fs } from 'fs'
import * as path from 'path'

export async function migrate(options: {
  database?: string
  to?: string
  latest?: boolean
  rollback?: boolean
  status?: boolean
  generate?: string
}) {
  console.log(chalk.blue.bold('\n🔄 NOORMME Migration Management - Automated Schema Evolution\n'))

  try {
    // Initialize NOORMME with database path
    const databasePath = options.database || process.env.DATABASE_PATH || './database.sqlite'
    const db = new NOORMME({
      dialect: 'sqlite',
      connection: { 
        database: databasePath,
        host: 'localhost',
        port: 0,
        username: '',
        password: ''
      }
    })
    await db.initialize()

    console.log(chalk.gray(`📁 Database: ${databasePath}\n`))

    const migrationManager = db.getMigrationManager()

    // Generate new migration
    if (options.generate) {
      console.log(chalk.blue(`📝 Generating migration: ${options.generate}`))
      try {
        const migration = await migrationManager.generateMigration(options.generate)
        console.log(chalk.green(`✅ Migration generated: ${migration.fileName}`))
        console.log(chalk.gray(`📁 Location: ${migration.filePath}`))
        console.log(chalk.gray(`📋 Description: ${migration.description}`))
        
        // Show migration content
        if (migration.content) {
          console.log(chalk.blue('\n📄 Migration Content:'))
          console.log(chalk.gray(migration.content))
        }
        
        console.log(chalk.blue('\n💡 Next steps:'))
        console.log(chalk.gray('• Review and modify the generated migration if needed'))
        console.log(chalk.gray('• Run "npx noormme migrate --latest" to apply the migration'))
        
      } catch (error) {
        console.error(chalk.red('❌ Migration generation failed:'), error instanceof Error ? error.message : error)
      }
      await db.close()
      return
    }

    // Show migration status
    if (options.status || (!options.to && !options.latest && !options.rollback)) {
      console.log(chalk.blue('📊 Migration Status:'))
      try {
        const status = await migrationManager.getMigrationStatus()
        
        console.log(chalk.green(`\n📈 Migration Summary:`))
        console.log(chalk.gray(`  Current version: ${status.currentVersion || 'None'}`))
        console.log(chalk.gray(`  Available migrations: ${status.availableMigrations.length}`))
        console.log(chalk.gray(`  Pending migrations: ${status.pendingMigrations.length}`))
        console.log(chalk.gray(`  Applied migrations: ${status.appliedMigrations.length}`))

        if (status.appliedMigrations.length > 0) {
          console.log(chalk.green(`\n✅ Applied Migrations:`))
          status.appliedMigrations.forEach((migration, index) => {
            console.log(chalk.gray(`  ${index + 1}. ${migration.version} - ${migration.name} (${migration.appliedAt})`))
          })
        }

        if (status.pendingMigrations.length > 0) {
          console.log(chalk.yellow(`\n⏳ Pending Migrations:`))
          status.pendingMigrations.forEach((migration, index) => {
            console.log(chalk.gray(`  ${index + 1}. ${migration.version} - ${migration.name}`))
          })
        }

        if (status.availableMigrations.length === 0) {
          console.log(chalk.gray('\n📝 No migrations found. Create your first migration with:'))
          console.log(chalk.gray('npx noormme migrate --generate "initial_schema"'))
        }

      } catch (error) {
        console.error(chalk.red('❌ Failed to get migration status:'), error instanceof Error ? error.message : error)
      }
    }

    // Migrate to latest version
    if (options.latest) {
      console.log(chalk.blue('🚀 Migrating to latest version...'))
      try {
        const result = await migrationManager.migrateToLatest()
        
        if (result.migrationsApplied.length > 0) {
          console.log(chalk.green(`\n✅ Applied ${result.migrationsApplied.length} migrations:`))
          result.migrationsApplied.forEach((migration, index) => {
            console.log(chalk.gray(`  ${index + 1}. ${migration.version} - ${migration.name}`))
          })
        } else {
          console.log(chalk.gray('No migrations to apply - database is up to date'))
        }

        if (result.warnings.length > 0) {
          console.log(chalk.yellow(`\n⚠️ ${result.warnings.length} warnings:`))
          result.warnings.forEach(warning => {
            console.log(chalk.gray(`  • ${warning}`))
          })
        }

        console.log(chalk.green(`\n🎉 Migration completed successfully!`))
        console.log(chalk.gray(`Current version: ${result.currentVersion}`))

      } catch (error) {
        console.error(chalk.red('❌ Migration failed:'), error instanceof Error ? error.message : error)
        console.log(chalk.yellow('\n💡 Troubleshooting:'))
        console.log(chalk.gray('• Check the migration files for syntax errors'))
        console.log(chalk.gray('• Ensure the database is not locked by another process'))
        console.log(chalk.gray('• Use --rollback to undo the last migration if needed'))
      }
    }

    // Migrate to specific version
    if (options.to) {
      console.log(chalk.blue(`🎯 Migrating to version: ${options.to}`))
      try {
        const result = await migrationManager.migrateToVersion(options.to)
        
        console.log(chalk.green(`\n✅ Migration to version ${options.to} completed!`))
        
        if (result.migrationsApplied.length > 0) {
          console.log(chalk.green(`Applied ${result.migrationsApplied.length} migrations:`))
          result.migrationsApplied.forEach((migration, index) => {
            console.log(chalk.gray(`  ${index + 1}. ${migration.version} - ${migration.name}`))
          })
        }

        if (result.migrationsRolledBack.length > 0) {
          console.log(chalk.yellow(`Rolled back ${result.migrationsRolledBack.length} migrations:`))
          result.migrationsRolledBack.forEach((migration, index) => {
            console.log(chalk.gray(`  ${index + 1}. ${migration.version} - ${migration.name}`))
          })
        }

      } catch (error) {
        console.error(chalk.red('❌ Migration to version failed:'), error instanceof Error ? error.message : error)
      }
    }

    // Rollback last migration
    if (options.rollback) {
      console.log(chalk.blue('⏪ Rolling back last migration...'))
      try {
        const result = await migrationManager.rollbackLastMigration()
        
        if (result.success) {
          console.log(chalk.green(`\n✅ Rollback completed successfully!`))
          console.log(chalk.gray(`Rolled back: ${result.migration.version} - ${result.migration.name}`))
          console.log(chalk.gray(`Current version: ${result.currentVersion}`))
        } else {
          console.log(chalk.yellow('No migrations to rollback'))
        }

      } catch (error) {
        console.error(chalk.red('❌ Rollback failed:'), error instanceof Error ? error.message : error)
      }
    }

    // Show migration directory info
    console.log(chalk.blue('\n📁 Migration Directory:'))
    try {
      const migrationsDir = path.join(process.cwd(), 'migrations')
      const exists = await fs.access(migrationsDir).then(() => true).catch(() => false)
      
      if (exists) {
        const files = await fs.readdir(migrationsDir)
        const migrationFiles = files.filter(f => f.endsWith('.ts') || f.endsWith('.js'))
        console.log(chalk.gray(`  Location: ${migrationsDir}`))
        console.log(chalk.gray(`  Files: ${migrationFiles.length} migration files`))
      } else {
        console.log(chalk.gray(`  Location: ${migrationsDir} (will be created)`))
        console.log(chalk.gray(`  Status: Directory does not exist yet`))
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to check migration directory:'), error instanceof Error ? error.message : error)
    }

    // Recommendations
    console.log(chalk.blue('\n💡 Migration Tips:'))
    console.log(chalk.gray('• Always backup your database before running migrations'))
    console.log(chalk.gray('• Test migrations on a copy of production data first'))
    console.log(chalk.gray('• Use descriptive migration names (e.g., "add_user_email_index")'))
    console.log(chalk.gray('• Keep migrations small and focused on single changes'))
    console.log(chalk.gray('• Use --dry-run to preview changes before applying'))

    await db.close()

  } catch (error) {
    console.error(chalk.red('❌ Migration command failed:'), error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
