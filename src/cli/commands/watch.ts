import chalk from 'chalk'
import { NOORMME } from '../../noormme.js'

export async function watch(options: {
  database?: string
  interval?: string
  autoOptimize?: boolean
  autoIndex?: boolean
  notify?: boolean
}) {
  console.log(chalk.blue.bold('\n👁️ NOORMME Schema Watcher - Continuous Automation\n'))

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
      },
      performance: {
        enableQueryOptimization: true
      }
    })
    await db.initialize()

    const intervalMs = parseInt(options.interval || '5000')
    const autoOptimize = options.autoOptimize || false
    const autoIndex = options.autoIndex || false
    const notify = options.notify || false

    console.log(chalk.gray(`📁 Database: ${databasePath}`))
    console.log(chalk.gray(`⏱️ Check interval: ${intervalMs}ms`))
    console.log(chalk.gray(`🔧 Auto-optimize: ${autoOptimize ? 'Enabled' : 'Disabled'}`))
    console.log(chalk.gray(`📊 Auto-index: ${autoIndex ? 'Enabled' : 'Disabled'}`))
    console.log(chalk.gray(`🔔 Notifications: ${notify ? 'Enabled' : 'Disabled'}`))
    console.log(chalk.yellow('\n⏳ Starting schema monitoring... (Press Ctrl+C to stop)\n'))

    let lastSchemaHash = ''
    let lastOptimizationTime = Date.now()
    let optimizationInterval = 60000 // Run optimization every minute if auto-optimize is enabled

    const checkSchema = async () => {
      try {
        // Get current schema info
        const schemaInfo = await db.getSchemaInfo()
        const currentHash = JSON.stringify(schemaInfo.tables.map(t => ({
          name: t.name,
          columns: t.columns.length,
          indexes: t.indexes.length,
          foreignKeys: t.foreignKeys.length
        })))

        // Check for schema changes
        if (currentHash !== lastSchemaHash) {
          if (lastSchemaHash !== '') {
            console.log(chalk.blue(`\n🔄 Schema changes detected at ${new Date().toLocaleTimeString()}`))
            
            const changes = analyzeSchemaChanges(lastSchemaHash, currentHash)
            if (changes.length > 0) {
              console.log(chalk.yellow('📊 Changes detected:'))
              changes.forEach(change => {
                console.log(chalk.gray(`  • ${change}`))
              })
            }

            // Auto-optimize if enabled
            if (autoOptimize) {
              console.log(chalk.blue('🔧 Running auto-optimization...'))
              try {
                const result = await db.getSQLiteOptimizations()
                console.log(chalk.green(`✅ Generated ${result.appliedOptimizations.length} optimization recommendations`))
                if (result.warnings.length > 0) {
                  console.log(chalk.yellow(`⚠️ ${result.warnings.length} warnings`))
                }
              } catch (error) {
                console.error(chalk.red('❌ Auto-optimization failed:'), error instanceof Error ? error.message : error)
              }
            }

            // Auto-index if enabled
            if (autoIndex) {
              console.log(chalk.blue('📊 Checking for index recommendations...'))
              try {
                const indexRecs = await db.getSQLiteIndexRecommendations()
                if (indexRecs.recommendations.length > 0) {
                  console.log(chalk.yellow(`💡 ${indexRecs.recommendations.length} index recommendations found`))
                  console.log(chalk.gray('Run optimize command to apply index recommendations'))
                }
              } catch (error) {
                console.error(chalk.red('❌ Auto-indexing failed:'), error instanceof Error ? error.message : error)
              }
            }

            // Show desktop notification if enabled
            if (notify) {
              try {
                // This would require a notification library like node-notifier
                // For now, just log to console
                console.log(chalk.blue('🔔 Notification: Schema changes detected and processed'))
              } catch (error) {
                // Ignore notification errors
              }
            }
          } else {
            console.log(chalk.green(`📊 Initial schema scan completed - monitoring ${schemaInfo.tables.length} tables`))
          }

          lastSchemaHash = currentHash
        }

        // Periodic optimization if auto-optimize is enabled
        if (autoOptimize && Date.now() - lastOptimizationTime > optimizationInterval) {
          console.log(chalk.blue(`\n🔄 Periodic optimization check at ${new Date().toLocaleTimeString()}`))
          
          try {
            const metrics = await db.getSQLitePerformanceMetrics()
            const indexRecs = await db.getSQLiteIndexRecommendations()
            
            if (indexRecs.recommendations.length > 0) {
              console.log(chalk.yellow(`💡 Found ${indexRecs.recommendations.length} new index recommendations`))
              if (autoIndex) {
                console.log(chalk.gray('Run optimize command to apply index recommendations'))
              }
            }

            // Check if optimization is needed
            if (metrics.cacheHitRate < 0.8 || metrics.averageQueryTime > 100) {
              console.log(chalk.yellow('⚠️ Performance degradation detected, running optimization...'))
              const result = await db.getSQLiteOptimizations()
              console.log(chalk.green(`✅ Generated ${result.appliedOptimizations.length} performance optimization recommendations`))
            } else {
              console.log(chalk.green('✅ Performance metrics look good'))
            }

            lastOptimizationTime = Date.now()
          } catch (error) {
            console.error(chalk.red('❌ Periodic optimization failed:'), error instanceof Error ? error.message : error)
          }
        }

        // Show periodic status
        if (Date.now() % (intervalMs * 10) < intervalMs) {
          const timestamp = new Date().toLocaleTimeString()
          console.log(chalk.gray(`[${timestamp}] Monitoring active - ${schemaInfo.tables.length} tables`))
        }

      } catch (error) {
        console.error(chalk.red('❌ Schema check failed:'), error instanceof Error ? error.message : error)
      }
    }

    // Initial check
    await checkSchema()

    // Set up interval
    const interval = setInterval(checkSchema, intervalMs)

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log(chalk.yellow('\n⏹️ Stopping schema watcher...'))
      clearInterval(interval)
      
      try {
        // Final optimization if auto-optimize is enabled
        if (autoOptimize) {
          console.log(chalk.blue('🔧 Running final optimization...'))
          const result = await db.getSQLiteOptimizations()
          console.log(chalk.green(`✅ Final optimization generated ${result.appliedOptimizations.length} recommendations`))
        }

        await db.close()
        console.log(chalk.green('✅ Schema watcher stopped successfully'))
        process.exit(0)
      } catch (error) {
        console.error(chalk.red('❌ Error during shutdown:'), error instanceof Error ? error.message : error)
        process.exit(1)
      }
    }

    // Handle process signals
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)

    // Keep the process alive
    process.stdin.resume()

  } catch (error) {
    console.error(chalk.red('❌ Schema watcher failed to start:'), error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

function analyzeSchemaChanges(oldHash: string, newHash: string): string[] {
  // Simple change detection - in a real implementation, this would be more sophisticated
  const changes: string[] = []
  
  try {
    const oldSchema = JSON.parse(oldHash)
    const newSchema = JSON.parse(newHash)
    
    // Check for new tables
    const oldTables = oldSchema.map((t: any) => t.name)
    const newTables = newSchema.map((t: any) => t.name)
    
    newTables.forEach((tableName: string) => {
      if (!oldTables.includes(tableName)) {
        changes.push(`New table created: ${tableName}`)
      }
    })
    
    // Check for removed tables
    oldTables.forEach((tableName: string) => {
      if (!newTables.includes(tableName)) {
        changes.push(`Table removed: ${tableName}`)
      }
    })
    
    // Check for table structure changes
    oldSchema.forEach((oldTable: any) => {
      const newTable = newSchema.find((t: any) => t.name === oldTable.name)
      if (newTable) {
        if (oldTable.columns !== newTable.columns) {
          changes.push(`Column count changed in ${oldTable.name}: ${oldTable.columns} → ${newTable.columns}`)
        }
        if (oldTable.indexes !== newTable.indexes) {
          changes.push(`Index count changed in ${oldTable.name}: ${oldTable.indexes} → ${newTable.indexes}`)
        }
        if (oldTable.foreignKeys !== newTable.foreignKeys) {
          changes.push(`Foreign key count changed in ${oldTable.name}: ${oldTable.foreignKeys} → ${newTable.foreignKeys}`)
        }
      }
    })
    
  } catch (error) {
    changes.push('Schema structure analysis failed - changes detected but details unavailable')
  }
  
  return changes
}
