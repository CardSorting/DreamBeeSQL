#!/usr/bin/env node

import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'

interface TestConfig {
  database: {
    host: string
    port: number
    database: string
    username: string
    password: string
  }
  cleanup: boolean
  verbose: boolean
  parallel: boolean
  timeout: number
}

class PostgreSQLTestRunner {
  private config: TestConfig

  constructor(config: TestConfig) {
    this.config = config
  }

  /**
   * Run all PostgreSQL tests with proper setup and teardown
   */
  async runTests(): Promise<void> {
    console.log('🚀 Starting PostgreSQL Test Suite')
    console.log('=====================================')

    try {
      // Setup environment
      await this.setupEnvironment()
      
      // Verify database connection
      await this.verifyConnection()
      
      // Run tests
      await this.runTestSuites()
      
      // Generate report
      await this.generateReport()
      
    } catch (error) {
      console.error('❌ Test suite failed:', error)
      process.exit(1)
    } finally {
      // Cleanup
      if (this.config.cleanup) {
        await this.cleanup()
      }
    }

    console.log('✅ PostgreSQL Test Suite completed successfully')
  }

  /**
   * Setup test environment
   */
  private async setupEnvironment(): Promise<void> {
    console.log('🔧 Setting up test environment...')
    
    // Set environment variables
    process.env.TEST_POSTGRESQL = 'true'
    process.env.POSTGRES_HOST = this.config.database.host
    process.env.POSTGRES_PORT = this.config.database.port.toString()
    process.env.POSTGRES_DB = this.config.database.database
    process.env.POSTGRES_USER = this.config.database.username
    process.env.POSTGRES_PASSWORD = this.config.database.password

    console.log(`📊 Database: ${this.config.database.host}:${this.config.database.port}/${this.config.database.database}`)
  }

  /**
   * Verify database connection
   */
  private async verifyConnection(): Promise<void> {
    console.log('🔌 Verifying database connection...')
    
    try {
      const { spawn } = await import('child_process')
      
      const psql = spawn('psql', [
        '-h', this.config.database.host,
        '-p', this.config.database.port.toString(),
        '-d', this.config.database.database,
        '-U', this.config.database.username,
        '-c', 'SELECT version();'
      ], {
        env: { ...process.env, PGPASSWORD: this.config.database.password }
      })

      let output = ''
      let error = ''

      psql.stdout.on('data', (data) => {
        output += data.toString()
      })

      psql.stderr.on('data', (data) => {
        error += data.toString()
      })

      await new Promise((resolve, reject) => {
        psql.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Database connection verified')
            resolve(undefined)
          } else {
            reject(new Error(`Connection failed: ${error}`))
          }
        })
      })
    } catch (error) {
      console.warn('⚠️ Could not verify connection with psql, continuing with tests...')
    }
  }

  /**
   * Run test suites
   */
  private async runTestSuites(): Promise<void> {
    console.log('🧪 Running PostgreSQL test suites...')
    
    const testFiles = [
      'postgresql-minimal.test.ts',
      'postgresql-syntax.test.ts',
      'postgresql-constraints.test.ts',
      'postgresql-introspection.test.ts',
      'postgresql-parameter-binding.test.ts',
      'postgresql-advanced.test.ts'
    ]

    const results: { file: string; success: boolean; duration: number; error?: string }[] = []

    for (const testFile of testFiles) {
      console.log(`\n📋 Running ${testFile}...`)
      const startTime = Date.now()
      
      try {
        await this.runSingleTest(testFile)
        const duration = Date.now() - startTime
        results.push({ file: testFile, success: true, duration })
        console.log(`✅ ${testFile} completed in ${duration}ms`)
      } catch (error) {
        const duration = Date.now() - startTime
        const errorMessage = error instanceof Error ? error.message : String(error)
        results.push({ file: testFile, success: false, duration, error: errorMessage })
        console.log(`❌ ${testFile} failed after ${duration}ms: ${errorMessage}`)
      }
    }

    // Print summary
    console.log('\n📊 Test Results Summary')
    console.log('======================')
    
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

    console.log(`Total Tests: ${results.length}`)
    console.log(`Successful: ${successful}`)
    console.log(`Failed: ${failed}`)
    console.log(`Total Duration: ${totalDuration}ms`)

    if (failed > 0) {
      console.log('\n❌ Failed Tests:')
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.file}: ${r.error}`)
      })
      throw new Error(`${failed} test(s) failed`)
    }
  }

  /**
   * Run a single test file
   */
  private async runSingleTest(testFile: string): Promise<void> {
    const mochaArgs = [
      '--timeout', this.config.timeout.toString(),
      '--no-config',
      '--require', 'tsx/esm',
      testFile
    ]

    if (this.config.verbose) {
      mochaArgs.push('--reporter', 'spec')
    } else {
      mochaArgs.push('--reporter', 'dot')
    }

    return new Promise((resolve, reject) => {
      const mocha = spawn('npx', ['mocha', ...mochaArgs], {
        stdio: this.config.verbose ? 'inherit' : 'pipe',
        cwd: process.cwd()
      })

      let output = ''
      let error = ''

      if (!this.config.verbose) {
        mocha.stdout?.on('data', (data) => {
          output += data.toString()
        })

        mocha.stderr?.on('data', (data) => {
          error += data.toString()
        })
      }

      mocha.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Test failed with exit code ${code}: ${error}`))
        }
      })
    })
  }

  /**
   * Generate test report
   */
  private async generateReport(): Promise<void> {
    console.log('\n📝 Generating test report...')
    
    const reportContent = `
# PostgreSQL Test Report
Generated: ${new Date().toISOString()}

## Configuration
- Host: ${this.config.database.host}
- Port: ${this.config.database.port}
- Database: ${this.config.database.database}
- Username: ${this.config.database.username}

## Environment
- Node.js: ${process.version}
- Platform: ${process.platform}
- Architecture: ${process.arch}

## Test Results
All PostgreSQL tests completed successfully.

## Recommendations
1. Run tests regularly in CI/CD pipeline
2. Monitor database performance during tests
3. Keep test data minimal for faster execution
4. Use connection pooling for better performance
`

    const reportPath = path.join(process.cwd(), 'postgresql-test-report.md')
    await fs.writeFile(reportPath, reportContent)
    
    console.log(`📄 Test report saved to: ${reportPath}`)
  }

  /**
   * Cleanup after tests
   */
  private async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up...')
    
    try {
      const { spawn } = await import('child_process')
      
      const psql = spawn('psql', [
        '-h', this.config.database.host,
        '-p', this.config.database.port.toString(),
        '-d', this.config.database.database,
        '-U', this.config.database.username,
        '-c', 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
      ], {
        env: { ...process.env, PGPASSWORD: this.config.database.password }
      })

      await new Promise((resolve, reject) => {
        psql.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Database cleanup completed')
            resolve(undefined)
          } else {
            console.warn('⚠️ Database cleanup failed, but continuing...')
            resolve(undefined)
          }
        })
      })
    } catch (error) {
      console.warn('⚠️ Could not cleanup database:', error)
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  
  const config: TestConfig = {
    database: {
      host: 'localhost',
      port: 5432,
      database: 'noorm_test',
      username: 'postgres',
      password: 'password'
    },
    cleanup: true,
    verbose: false,
    parallel: false,
    timeout: 30000
  }

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--host':
        config.database.host = args[++i]
        break
      case '--port':
        config.database.port = parseInt(args[++i])
        break
      case '--database':
        config.database.database = args[++i]
        break
      case '--username':
        config.database.username = args[++i]
        break
      case '--password':
        config.database.password = args[++i]
        break
      case '--no-cleanup':
        config.cleanup = false
        break
      case '--verbose':
        config.verbose = true
        break
      case '--timeout':
        config.timeout = parseInt(args[++i])
        break
      case '--help':
        console.log(`
PostgreSQL Test Runner

Usage: npx tsx postgresql-test-runner.ts [options]

Options:
  --host HOST         Database host (default: localhost)
  --port PORT         Database port (default: 5432)
  --database DB       Database name (default: noorm_test)
  --username USER     Database username (default: postgres)
  --password PASS     Database password (default: password)
  --no-cleanup        Don't cleanup database after tests
  --verbose           Verbose output
  --timeout MS        Test timeout in milliseconds (default: 30000)
  --help              Show this help message

Examples:
  npx tsx postgresql-test-runner.ts
  npx tsx postgresql-test-runner.ts --verbose --no-cleanup
  npx tsx postgresql-test-runner.ts --host db.example.com --port 5433
`)
        process.exit(0)
    }
  }

  const runner = new PostgreSQLTestRunner(config)
  runner.runTests().catch(error => {
    console.error('Test runner failed:', error)
    process.exit(1)
  })
}

export { PostgreSQLTestRunner }
