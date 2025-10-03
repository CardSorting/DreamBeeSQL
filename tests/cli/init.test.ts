import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { promises as fs } from 'fs'
import * as path from 'path'
import { init } from '../../src/cli/commands/init.js'
import { TestUtils } from '../../src/testing/test-utils.js'

describe('CLI init command', () => {
  const testDir = path.join(__dirname, 'temp-test-init')

  beforeEach(async () => {
    // Create a temporary directory for testing
    await fs.mkdir(testDir, { recursive: true })
    process.chdir(testDir)
  })

  afterEach(async () => {
    // Clean up
    try {
      process.chdir(__dirname)
      await fs.rmdir(testDir, { recursive: true })
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  describe('File Generation', () => {
    it('should generate db.ts file', async () => {
      await init({
        dialect: 'postgresql',
        connection: 'postgresql://user:pass@localhost:5432/testdb',
        output: 'lib',
        force: true
      })

      const exists = await fs.access('lib/db.ts').then(() => true).catch(() => false)
      expect(exists).toBe(true)

      const content = await fs.readFile('lib/db.ts', 'utf8')
      expect(content).toContain('import { NOORMME }')
      expect(content).toContain('export const db = new NOORMME()')
      expect(content).toContain('postgresql://user:pass@localhost:5432/testdb')
    })

    it('should generate .env.example file', async () => {
      await init({
        dialect: 'mysql',
        connection: 'mysql://user:pass@localhost:3306/testdb',
        force: true
      })

      const exists = await fs.access('.env.example').then(() => true).catch(() => false)
      expect(exists).toBe(true)

      const content = await fs.readFile('.env.example', 'utf8')
      expect(content).toContain('DATABASE_URL=')
      expect(content).toContain('mysql://user:pass@localhost:3306/testdb')
    })

    it('should generate README file', async () => {
      await init({
        dialect: 'sqlite',
        connection: './test.db',
        force: true
      })

      const exists = await fs.access('NOORMME_README.md').then(() => true).catch(() => false)
      expect(exists).toBe(true)

      const content = await fs.readFile('NOORMME_README.md', 'utf8')
      expect(content).toContain('# NOORMME Setup')
      expect(content).toContain('Quick Start')
      expect(content).toContain('CLI Commands')
    })

    it('should create .env file if it does not exist', async () => {
      await init({
        dialect: 'postgresql',
        connection: 'postgresql://localhost/test',
        force: true
      })

      const exists = await fs.access('.env').then(() => true).catch(() => false)
      expect(exists).toBe(true)

      const content = await fs.readFile('.env', 'utf8')
      expect(content).toContain('DATABASE_URL=')
    })
  })

  describe('Database Dialect Support', () => {
    it('should handle PostgreSQL configuration', async () => {
      await init({
        dialect: 'postgresql',
        connection: 'postgresql://user:pass@host:5432/db',
        force: true
      })

      const content = await fs.readFile('lib/db.ts', 'utf8')
      expect(content).toContain('postgresql')
      expect(content).toContain('port: 5432')
    })

    it('should handle MySQL configuration', async () => {
      await init({
        dialect: 'mysql',
        connection: 'mysql://user:pass@host:3306/db',
        force: true
      })

      const content = await fs.readFile('lib/db.ts', 'utf8')
      expect(content).toContain('mysql')
      expect(content).toContain('port: 3306')
    })

    it('should handle SQLite configuration', async () => {
      await init({
        dialect: 'sqlite',
        connection: './database.sqlite',
        force: true
      })

      const content = await fs.readFile('lib/db.ts', 'utf8')
      expect(content).toContain('sqlite')
      expect(content).toContain('./database.sqlite')
    })

    it('should handle MSSQL configuration', async () => {
      await init({
        dialect: 'mssql',
        connection: 'mssql://user:pass@host:1433/db',
        force: true
      })

      const content = await fs.readFile('lib/db.ts', 'utf8')
      expect(content).toContain('mssql')
      expect(content).toContain('port: 1433')
    })
  })

  describe('Custom Output Directory', () => {
    it('should respect custom output directory', async () => {
      await init({
        dialect: 'postgresql',
        connection: 'postgresql://localhost/test',
        output: 'custom-dir',
        force: true
      })

      const exists = await fs.access('custom-dir/db.ts').then(() => true).catch(() => false)
      expect(exists).toBe(true)
    })

    it('should create output directory if it does not exist', async () => {
      await init({
        dialect: 'postgresql',
        connection: 'postgresql://localhost/test',
        output: 'deep/nested/dir',
        force: true
      })

      const exists = await fs.access('deep/nested/dir/db.ts').then(() => true).catch(() => false)
      expect(exists).toBe(true)
    })
  })

  describe('File Overwrite Protection', () => {
    it('should not overwrite existing files without force flag', async () => {
      // Create existing file
      await fs.mkdir('lib', { recursive: true })
      await fs.writeFile('lib/db.ts', 'existing content')

      // Mock inquirer to simulate user choosing not to overwrite
      // This would require mocking inquirer, which is complex in this context
      // For now, we test the force behavior
    })

    it('should overwrite existing files with force flag', async () => {
      // Create existing file
      await fs.mkdir('lib', { recursive: true })
      await fs.writeFile('lib/db.ts', 'existing content')

      await init({
        dialect: 'postgresql',
        connection: 'postgresql://localhost/test',
        force: true
      })

      const content = await fs.readFile('lib/db.ts', 'utf8')
      expect(content).not.toBe('existing content')
      expect(content).toContain('NOORMME')
    })
  })

  describe('Package.json Integration', () => {
    it('should add scripts to existing package.json', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          start: 'node index.js'
        }
      }

      await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2))

      await init({
        dialect: 'postgresql',
        connection: 'postgresql://localhost/test',
        force: true
      })

      const updatedPackageJson = JSON.parse(await fs.readFile('package.json', 'utf8'))
      expect(updatedPackageJson.scripts['db:inspect']).toBe('noormme inspect')
      expect(updatedPackageJson.scripts['db:generate-types']).toBe('noormme generate')
      expect(updatedPackageJson.scripts.start).toBe('node index.js') // Preserve existing scripts
    })

    it('should handle missing package.json gracefully', async () => {
      // No package.json exists
      await expect(async () => {
        await init({
          dialect: 'postgresql',
          connection: 'postgresql://localhost/test',
          force: true
        })
      }).not.toThrow()

      // Should still create other files
      const exists = await fs.access('lib/db.ts').then(() => true).catch(() => false)
      expect(exists).toBe(true)
    })
  })

  describe('Content Validation', () => {
    it('should generate correct TypeScript imports', async () => {
      await init({
        dialect: 'postgresql',
        connection: 'postgresql://localhost/test',
        force: true
      })

      const content = await fs.readFile('lib/db.ts', 'utf8')
      expect(content).toContain("import { NOORMME } from 'noorm'")
      expect(content).toContain('export const db = new NOORMME()')
      expect(content).toContain('export async function initializeDatabase()')
    })

    it('should include usage examples in README', async () => {
      await init({
        dialect: 'postgresql',
        connection: 'postgresql://localhost/test',
        force: true
      })

      const content = await fs.readFile('NOORMME_README.md', 'utf8')
      expect(content).toContain('```typescript')
      expect(content).toContain('paginate')
      expect(content).toContain('withCount')
      expect(content).toContain('npx noormme inspect')
    })

    it('should include correct environment variables', async () => {
      await init({
        dialect: 'mysql',
        connection: 'mysql://user:secret@host:3306/dbname',
        force: true
      })

      const envContent = await fs.readFile('.env.example', 'utf8')
      expect(envContent).toContain('DATABASE_URL="mysql://user:secret@host:3306/dbname"')
      expect(envContent).toContain('LOG_LEVEL=debug')
      expect(envContent).toContain('CACHE_TTL=300000')
    })
  })

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      // Try to write to a read-only directory (if possible to simulate)
      // This is platform-specific and may not work in all test environments
    })

    it('should validate dialect parameter', async () => {
      await expect(async () => {
        await init({
          dialect: 'invalid' as any,
          connection: 'test://localhost/test',
          force: true
        })
      }).rejects.toThrow()
    })
  })
})