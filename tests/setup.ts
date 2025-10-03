/**
 * Jest setup file for NOORMME tests
 */

import { TestEnvironment } from '../src/testing/test-utils.js'

// Global test setup
beforeAll(async () => {
  await TestEnvironment.setup()
})

// Global test teardown
afterAll(async () => {
  await TestEnvironment.teardown()
})

// Increase timeout for database operations
jest.setTimeout(30000)

// Mock console methods in tests unless explicitly needed
const originalConsole = { ...console }

beforeEach(() => {
  // Reset console mocks before each test
  console.log = jest.fn()
  console.warn = jest.fn()
  console.error = jest.fn()
  console.info = jest.fn()
})

afterEach(() => {
  // Restore console after each test if needed
  // Uncomment if you want to see console output in tests
  // Object.assign(console, originalConsole)
})

// Global error handler for unhandled rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.LOG_LEVEL = 'error' // Reduce noise in tests