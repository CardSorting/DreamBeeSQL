import chalk from 'chalk'
import { NOORMME } from '../../noormme.js'

export async function analyze(options: {
  database?: string
  slowQueries?: boolean
  indexes?: boolean
  patterns?: boolean
  report?: boolean
}) {
  console.log(chalk.blue.bold('\n🔍 NOORMME Query Analysis - Intelligent Performance Insights\n'))

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
        enableQueryOptimization: true,
        enableQueryAnalysis: true
      }
    })
    await db.initialize()

    console.log(chalk.gray(`📁 Database: ${databasePath}\n`))

    // Get query analyzer
    const analyzer = db.getQueryAnalyzer()
    if (!analyzer) {
      console.error(chalk.red('❌ Query analyzer not available'))
      await db.close()
      return
    }

    // Analyze query patterns
    if (options.patterns !== false) {
      console.log(chalk.blue('📊 Analyzing Query Patterns...'))
      try {
        const patterns = analyzer.getQueryPatterns()
        
        console.log(chalk.green(`\n📈 Query Pattern Analysis:`))
        console.log(chalk.gray(`  Total queries analyzed: ${patterns.totalQueries}`))
        console.log(chalk.gray(`  Unique query patterns: ${patterns.uniquePatterns}`))
        console.log(chalk.gray(`  Average execution time: ${patterns.averageExecutionTime.toFixed(2)}ms`))

        if (patterns.frequentQueries.length > 0) {
          console.log(chalk.yellow(`\n🔥 Most Frequent Queries:`))
          patterns.frequentQueries.slice(0, 5).forEach((query, index) => {
            console.log(chalk.gray(`  ${index + 1}. ${query.sql.substring(0, 60)}... (${query.count} times, ${query.avgTime.toFixed(2)}ms avg)`))
          })
        }

        if (patterns.slowQueries.length > 0) {
          console.log(chalk.red(`\n🐌 Slow Queries (>1000ms):`))
          patterns.slowQueries.slice(0, 5).forEach((query, index) => {
            console.log(chalk.gray(`  ${index + 1}. ${query.sql.substring(0, 60)}... (${query.maxTime}ms max, ${query.avgTime.toFixed(2)}ms avg)`))
          })
        }

        if (patterns.nPlusOneQueries.length > 0) {
          console.log(chalk.yellow(`\n⚠️ N+1 Query Patterns Detected:`))
          patterns.nPlusOneQueries.forEach((pattern, index) => {
            console.log(chalk.gray(`  ${index + 1}. ${pattern.description} (${pattern.occurrences} occurrences)`))
          })
        }

      } catch (error) {
        console.error(chalk.red('❌ Query pattern analysis failed:'), error instanceof Error ? error.message : error)
      }
    }

    // Analyze slow queries specifically
    if (options.slowQueries) {
      console.log(chalk.blue('\n🐌 Analyzing Slow Queries...'))
      try {
        const slowQueries = await db.getSlowQueries()
        
        if (slowQueries.length > 0) {
          console.log(chalk.red(`Found ${slowQueries.length} slow queries:`))
          slowQueries.forEach((query, index) => {
            console.log(chalk.gray(`\n${index + 1}. Execution time: ${query.executionTime}ms`))
            console.log(chalk.gray(`   SQL: ${query.sql}`))
            if (query.suggestions.length > 0) {
              console.log(chalk.yellow(`   Suggestions:`))
              query.suggestions.forEach(suggestion => {
                console.log(chalk.gray(`     • ${suggestion}`))
              })
            }
          })
        } else {
          console.log(chalk.green('✅ No slow queries detected'))
        }
      } catch (error) {
        console.error(chalk.red('❌ Slow query analysis failed:'), error instanceof Error ? error.message : error)
      }
    }

    // Generate index recommendations
    if (options.indexes !== false) {
      console.log(chalk.blue('\n📊 Generating Index Recommendations...'))
      try {
        const indexRecs = await db.getSQLiteIndexRecommendations()
        
        if (indexRecs.recommendations.length > 0) {
          console.log(chalk.green(`\n💡 Index Recommendations:`))
          indexRecs.recommendations.forEach((rec, index) => {
            console.log(chalk.gray(`  ${index + 1}. Table: ${rec.table}`))
            console.log(chalk.gray(`     Column: ${rec.column}`))
            console.log(chalk.gray(`     Reason: ${rec.reason}`))
            console.log(chalk.gray(`     Impact: ${rec.impact}`))
            console.log(chalk.gray(`     SQL: CREATE INDEX idx_${rec.table}_${rec.column} ON ${rec.table}(${rec.column});`))
            console.log('')
          })
        } else {
          console.log(chalk.gray('No index recommendations at this time'))
        }
      } catch (error) {
        console.error(chalk.red('❌ Index recommendation analysis failed:'), error instanceof Error ? error.message : error)
      }
    }

    // Generate detailed performance report
    if (options.report) {
      console.log(chalk.blue('\n📋 Generating Detailed Performance Report...'))
      try {
        const metrics = await db.getSQLitePerformanceMetrics()
        const schemaInfo = await db.getSchemaInfo()
        
        console.log(chalk.green.bold(`\n📊 Performance Report for ${databasePath}`))
        console.log(chalk.gray('=' .repeat(60)))
        
        console.log(chalk.blue('\n🗄️ Database Information:'))
        console.log(chalk.gray(`  Tables: ${schemaInfo.tables.length}`))
        console.log(chalk.gray(`  Relationships: ${schemaInfo.relationships.length}`))
        console.log(chalk.gray(`  Database size: ${(metrics.databaseSize / 1024 / 1024).toFixed(2)}MB`))
        console.log(chalk.gray(`  Page count: ${metrics.pageCount.toLocaleString()}`))
        console.log(chalk.gray(`  Free pages: ${metrics.freePages.toLocaleString()}`))
        
        console.log(chalk.blue('\n⚡ Performance Metrics:'))
        console.log(chalk.gray(`  Cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`))
        console.log(chalk.gray(`  Average query time: ${metrics.averageQueryTime.toFixed(2)}ms`))
        console.log(chalk.gray(`  Total queries executed: ${metrics.totalQueries}`))
        console.log(chalk.gray(`  Slow queries (>1000ms): ${metrics.slowQueries}`))
        
        console.log(chalk.blue('\n🔧 Optimization Status:'))
        console.log(chalk.gray(`  WAL mode: ${metrics.walMode ? 'Enabled' : 'Disabled'}`))
        console.log(chalk.gray(`  Foreign keys: ${metrics.foreignKeys ? 'Enabled' : 'Disabled'}`))
        console.log(chalk.gray(`  Auto vacuum: ${metrics.autoVacuum}`))
        console.log(chalk.gray(`  Journal mode: ${metrics.journalMode}`))
        console.log(chalk.gray(`  Synchronous: ${metrics.synchronous}`))
        
        // Performance score
        let score = 0
        if (metrics.cacheHitRate > 0.8) score += 25
        if (metrics.averageQueryTime < 100) score += 25
        if (metrics.walMode) score += 25
        if (metrics.foreignKeys) score += 25
        
        const scoreColor = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red'
        console.log(chalk.blue('\n🎯 Overall Performance Score:'))
        console.log(chalk[scoreColor](`  ${score}/100 ${score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Improvement'}`))
        
      } catch (error) {
        console.error(chalk.red('❌ Performance report generation failed:'), error instanceof Error ? error.message : error)
      }
    }

    // Recommendations
    console.log(chalk.blue('\n💡 Recommendations:'))
    console.log(chalk.gray('• Run "npx noormme optimize" to apply performance optimizations'))
    console.log(chalk.gray('• Use "npx noormme watch" for continuous monitoring'))
    console.log(chalk.gray('• Check "npx noormme status" regularly to track improvements'))
    console.log(chalk.gray('• Consider adding indexes for frequently queried columns'))

    await db.close()

  } catch (error) {
    console.error(chalk.red('❌ Analysis failed:'), error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
