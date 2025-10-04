#!/usr/bin/env node

/**
 * Schema Strategy Test Runner
 * 
 * This script runs the schema strategy tests with proper Jest configuration
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Running Schema Strategy Tests...\n');

try {
  // Run Jest with the schema test pattern
  const command = `npx jest --testPathPattern="src/schema/test" --verbose --no-cache`;
  
  console.log(`Executing: ${command}\n`);
  
  execSync(command, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname),
    env: { ...process.env, NODE_ENV: 'test' }
  });
  
  console.log('\n✅ Schema Strategy Tests Completed Successfully!');
  console.log('🎯 All tests for the new factory/dialect-based architecture have passed');
  
} catch (error) {
  console.error('\n❌ Schema Strategy Tests Failed');
  console.error('Error:', error.message);
  process.exit(1);
}
