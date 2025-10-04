#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import { init } from './commands/init.js'
import { inspect } from './commands/inspect.js'
import { generateTypes } from './commands/generate.js'

const program = new Command()

program
  .name('noormme')
  .description('NOORMME CLI - No ORM, just magic!')
  .version('1.0.0')

// Init command
program
  .command('init')
  .description('Initialize NOORMME in current directory')
  .option('-d, --dialect <dialect>', 'Database dialect (sqlite)')
  .option('-c, --connection <connection>', 'Database connection string')
  .option('-o, --output <output>', 'Output directory for generated files', 'lib')
  .option('-f, --force', 'Overwrite existing files')
  .action(init)

// Inspect command
program
  .command('inspect [table]')
  .description('Inspect database schema')
  .option('-c, --connection <connection>', 'Database connection string')
  .option('-a, --all', 'Show all tables (default)')
  .option('-r, --relationships', 'Show relationships')
  .action(inspect)

// Generate command
program
  .command('generate')
  .description('Generate TypeScript types and other files')
  .option('-c, --connection <connection>', 'Database connection string')
  .option('-o, --output <output>', 'Output file path', './types/database.d.ts')
  .option('-f, --format <format>', 'Output format (typescript, json)', 'typescript')
  .action(generateTypes)

// Help command
program.addHelpText('after', `

Examples:
  $ noormme init                          # Interactive setup
  $ noormme init -d sqlite                # Init with SQLite
  $ noormme inspect users                 # Inspect users table
  $ noormme inspect --relationships       # Show all relationships
  $ noormme generate -o ./types/db.d.ts   # Generate types

Environment Variables:
  DATABASE_URL    Database connection string

Config File:
  NOORMME will look for .env file in current directory for DATABASE_URL
`)

// Error handling
program.configureOutput({
  writeErr: (str) => process.stderr.write(chalk.red(str))
})

// Handle unknown commands
program.on('command:*', function (operands) {
  console.error(chalk.red(`Unknown command: ${operands[0]}`))
  console.error('See --help for a list of available commands.')
  process.exit(1)
})

// Parse command line arguments
program.parse()

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp()
}