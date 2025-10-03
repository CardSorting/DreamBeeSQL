import inquirer from 'inquirer'
import { promises as fs } from 'fs'
import * as path from 'path'
import chalk from 'chalk'
import { NOORMConfig } from '../../types/index.js'

export async function init(options: {
  dialect?: string
  connection?: string
  output?: string
  force?: boolean
}) {
  console.log(chalk.blue.bold('\n🎯 NOORMME Initialization\n'))
  console.log(chalk.gray('Setting up NOORMME in your project...\n'))

  try {
    let config: Partial<NOORMConfig> = {}

    // Interactive prompts if not provided via options
    if (!options.dialect) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'dialect',
          message: 'Which database are you using?',
          choices: [
            { name: 'PostgreSQL', value: 'postgresql' },
            { name: 'MySQL', value: 'mysql' },
            { name: 'SQLite', value: 'sqlite' },
            { name: 'Microsoft SQL Server', value: 'mssql' },
          ],
        },
      ])
      config.dialect = answers.dialect
    } else {
      config.dialect = options.dialect as NOORMConfig['dialect']
    }

    // Get connection string
    let connectionString = options.connection
    if (!connectionString) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'connection',
          message: 'Database connection string:',
          default: getDefaultConnectionString(config.dialect!),
          when: config.dialect !== 'sqlite',
        },
        {
          type: 'input',
          name: 'connection',
          message: 'SQLite database file path:',
          default: './database.sqlite',
          when: config.dialect === 'sqlite',
        },
      ])
      connectionString = answers.connection || getDefaultConnectionString(config.dialect!)
    }

    // Confirm setup
    const confirmation = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: `Ready to initialize NOORMME with ${config.dialect}?`,
        default: true,
      },
    ])

    if (!confirmation.proceed) {
      console.log(chalk.yellow('Initialization cancelled.'))
      return
    }

    // Generate files
    const outputDir = options.output || 'lib'
    await generateDbFile(config.dialect!, connectionString || '', outputDir, options.force)
    await generateEnvExample(connectionString || '')
    await generateReadme(config.dialect!)
    await generatePackageScripts()

    console.log(chalk.green.bold('\n✅ NOORMME initialized successfully!\n'))
    console.log(chalk.blue('Next steps:'))
    console.log(chalk.gray('1. Review the generated files'))
    console.log(chalk.gray('2. Update your .env file with the correct DATABASE_URL'))
    console.log(chalk.gray('3. Run: npm run dev (or your development command)\n'))

    console.log(chalk.yellow('Pro tip: Use "npx noormme inspect" to explore your database schema!'))

  } catch (error) {
    console.error(chalk.red('❌ Initialization failed:'), error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

function getDefaultConnectionString(dialect: string): string {
  switch (dialect) {
    case 'postgresql':
      return 'postgresql://username:password@localhost:5432/database_name'
    case 'mysql':
      return 'mysql://username:password@localhost:3306/database_name'
    case 'mssql':
      return 'mssql://username:password@localhost:1433/database_name'
    default:
      return 'postgresql://username:password@localhost:5432/database_name'
  }
}

async function generateDbFile(
  dialect: string,
  connectionString: string,
  outputDir: string,
  force?: boolean
): Promise<void> {
  const dbFilePath = path.join(outputDir, 'db.ts')

  // Check if file exists and force is not set
  try {
    await fs.access(dbFilePath)
    if (!force) {
      const overwrite = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `File ${dbFilePath} already exists. Overwrite?`,
          default: false,
        },
      ])
      if (!overwrite.overwrite) {
        console.log(chalk.yellow(`Skipped: ${dbFilePath}`))
        return
      }
    }
  } catch {
    // File doesn't exist, safe to create
  }

  const dbFileContent = `import { NOORMME } from 'noorm'

// Initialize NOORMME with auto-loading from .env
// Make sure to set DATABASE_URL in your .env file
export const db = new NOORMME()

// Alternative: Pass connection string directly
// export const db = new NOORMME('${connectionString}')

// Alternative: Use full config object
// export const db = new NOORMME({
//   dialect: '${dialect}',
//   connection: {
//     host: 'localhost',
//     port: ${getDefaultPort(dialect)},
//     database: 'your_database',
//     username: 'your_username',
//     password: 'your_password',
//   },
//   logging: {
//     enabled: true,
//     level: 'info'
//   },
//   cache: {
//     ttl: 300000, // 5 minutes
//     maxSize: 1000
//   }
// })

// Initialize the database connection
export async function initializeDatabase() {
  await db.initialize()
  console.log('✅ Database initialized with NOORMME')
}

// Get a repository for any table
export function getRepository<T>(tableName: string) {
  return db.getRepository<T>(tableName)
}

// Close database connections
export async function closeDatabase() {
  await db.close()
}
`

  // Ensure directory exists
  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(dbFilePath, dbFileContent)
  console.log(chalk.green(`✓ Created: ${dbFilePath}`))
}

async function generateEnvExample(connectionString: string): Promise<void> {
  const envContent = `# Database Configuration
DATABASE_URL="${connectionString}"

# Optional: Enable debug logging
# LOG_LEVEL=debug

# Optional: Cache configuration
# CACHE_TTL=300000
# CACHE_MAX_SIZE=1000
`

  await fs.writeFile('.env.example', envContent)
  console.log(chalk.green('✓ Created: .env.example'))

  // Also create .env if it doesn't exist
  try {
    await fs.access('.env')
    console.log(chalk.yellow('Note: .env already exists, please update it manually'))
  } catch {
    await fs.writeFile('.env', envContent)
    console.log(chalk.green('✓ Created: .env'))
  }
}

async function generateReadme(dialect: string): Promise<void> {
  const readmeContent = `# NOORMME Setup

This project uses NOORMME (No ORM, just magic!) for database access.

## Quick Start

\`\`\`typescript
import { db, initializeDatabase } from './lib/db'

// Initialize the database
await initializeDatabase()

// Get a repository for any table
const userRepo = db.getRepository('users')

// Use the repository
const users = await userRepo.findAll()
const user = await userRepo.findById(1)

// Create new records
const newUser = await userRepo.create({
  name: 'John Doe',
  email: 'john@example.com'
})

// Pagination
const result = await userRepo.paginate({
  page: 1,
  limit: 10,
  where: { active: true },
  orderBy: { column: 'created_at', direction: 'desc' }
})

// Count relationships
const userWithCounts = await userRepo.withCount(1, ['posts', 'comments'])
// Returns: { id: 1, name: '...', postsCount: 5, commentsCount: 12 }
\`\`\`

## CLI Commands

\`\`\`bash
# Inspect database schema
npx noormme inspect

# Inspect specific table
npx noormme inspect users

# Generate TypeScript types
npx noormme generate --output ./types/database.d.ts
\`\`\`

## Configuration

Update your \`.env\` file with the correct database connection:

\`\`\`
DATABASE_URL="${getDefaultConnectionString(dialect)}"
\`\`\`

## Available Methods

Every repository automatically includes:

- \`findById(id)\` - Find by primary key
- \`findAll()\` - Get all records
- \`create(data)\` - Create new record
- \`update(entity)\` - Update existing record
- \`delete(id)\` - Delete by primary key
- \`count()\` - Count total records
- \`exists(id)\` - Check if record exists
- \`paginate(options)\` - Paginated results
- \`withCount(id, relations)\` - Count related records
- Dynamic finders: \`findByColumnName(value)\`
- Dynamic list finders: \`findManyByColumnName(value)\`

## Error Handling

NOORMME provides enhanced error messages with context:

\`\`\`typescript
try {
  await userRepo.findByInvalidColumn('test')
} catch (error) {
  // NoormError with helpful suggestions
  console.log(error.getFormattedMessage())
}
\`\`\`
`

  await fs.writeFile('NOORMME_README.md', readmeContent)
  console.log(chalk.green('✓ Created: NOORMME_README.md'))
}

async function generatePackageScripts(): Promise<void> {
  // Try to read existing package.json
  try {
    const packageJsonPath = 'package.json'
    const packageContent = await fs.readFile(packageJsonPath, 'utf8')
    const packageJson = JSON.parse(packageContent)

    // Add NOORMME scripts if not present
    if (!packageJson.scripts) {
      packageJson.scripts = {}
    }

    const noormmeScripts = {
      'db:inspect': 'noormme inspect',
      'db:generate-types': 'noormme generate',
    }

    let hasChanges = false
    for (const [key, value] of Object.entries(noormmeScripts)) {
      if (!packageJson.scripts[key]) {
        packageJson.scripts[key] = value
        hasChanges = true
      }
    }

    if (hasChanges) {
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
      console.log(chalk.green('✓ Updated: package.json (added NOORMME scripts)'))
    }
  } catch {
    console.log(chalk.yellow('Note: Could not update package.json scripts automatically'))
  }
}

function getDefaultPort(dialect: string): number {
  switch (dialect) {
    case 'postgresql': return 5432
    case 'mysql': return 3306
    case 'mssql': return 1433
    case 'sqlite': return 0
    default: return 5432
  }
}