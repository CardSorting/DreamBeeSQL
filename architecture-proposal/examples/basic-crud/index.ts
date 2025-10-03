import { NOORM } from 'noorm'

async function main() {
  // Initialize NOORM
  const db = new NOORM({
    dialect: 'postgresql', // Change to 'mysql' or 'sqlite' as needed
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'example_db',
      username: process.env.DB_USER || 'user',
      password: process.env.DB_PASSWORD || 'password'
    },
    logging: {
      level: 'info',
      enabled: true
    }
  })

  try {
    // Initialize and discover schema
    await db.initialize()
    console.log('✅ NOORM initialized successfully!')

    // Get repository for users table
    const userRepo = db.getRepository('users')

    // CREATE - Add a new user
    console.log('\n📝 Creating a new user...')
    const newUser = await userRepo.create({
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe'
    })
    console.log('Created user:', newUser)

    // READ - Find user by ID
    console.log('\n🔍 Finding user by ID...')
    const foundUser = await userRepo.findById(newUser.id)
    console.log('Found user:', foundUser)

    // READ - Find all users
    console.log('\n📋 Finding all users...')
    const allUsers = await userRepo.findAll()
    console.log('All users:', allUsers)

    // UPDATE - Modify the user
    console.log('\n✏️ Updating user...')
    if (foundUser) {
      foundUser.firstName = 'Johnny'
      const updatedUser = await userRepo.update(foundUser)
      console.log('Updated user:', updatedUser)

      // DELETE - Remove the user
      console.log('\n🗑️ Deleting user...')
      const deleted = await userRepo.delete(updatedUser.id)
      console.log('User deleted:', deleted)

      // Verify deletion
      const deletedUser = await userRepo.findById(updatedUser.id)
      console.log('User after deletion:', deletedUser) // Should be null
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    // Clean up
    await db.close()
  }
}

// Run the example
main().catch(console.error)
