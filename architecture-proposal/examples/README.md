# NOORMME Examples

> **Real-world usage patterns and complete applications**

This directory contains practical examples showing how to use NOORMME in various scenarios.

## 📁 Examples Overview

| Example | Description | Complexity | Time |
|---------|-------------|------------|------|
| [basic-crud](./basic-crud/) | Basic CRUD operations | Beginner | 5 min |
| [blog-app](./blog-app/) | Complete blog application | Intermediate | 15 min |
| [ecommerce](./ecommerce/) | E-commerce with orders | Intermediate | 20 min |
| [social-media](./social-media/) | Social media features | Advanced | 25 min |
| [api-server](./api-server/) | Express.js API server | Intermediate | 30 min |
| [performance](./performance/) | Performance optimization | Advanced | 15 min |

## 🚀 Getting Started

1. **Choose an example** that matches your use case
2. **Follow the README** in each example directory
3. **Run the example** to see NOORMME in action
4. **Modify the code** to experiment with different patterns

## 📋 Prerequisites

- Node.js 18+
- TypeScript 5+
- A database (PostgreSQL, MySQL, or SQLite)

## 🎯 Quick Start

```bash
# Navigate to an example
cd examples/basic-crud

# Install dependencies
npm install

# Set up your database
npm run setup:db

# Run the example
npm start
```

## 📚 Learning Path

### For Beginners
1. Start with [basic-crud](./basic-crud/) - Learn fundamental operations
2. Try [blog-app](./blog-app/) - See relationships in action
3. Explore [api-server](./api-server/) - Build a real API

### For Intermediate Developers
1. Check out [ecommerce](./ecommerce/) - Complex business logic
2. Study [performance](./performance/) - Optimization techniques
3. Build [social-media](./social-media/) - Advanced patterns

### For Advanced Developers
1. Review all examples for different patterns
2. Combine patterns from multiple examples
3. Contribute new examples to help others

## 🔧 Common Patterns

### Database Setup
```typescript
// Each example includes database setup scripts
npm run setup:db
```

### Environment Configuration
```typescript
// Examples use environment variables
DB_HOST=localhost
DB_PORT=5432
DB_NAME=example_db
DB_USER=user
DB_PASSWORD=password
```

### Error Handling
```typescript
// Consistent error handling patterns
try {
  const result = await operation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw error
}
```

## 🤝 Contributing

We welcome new examples! Here's how to contribute:

1. **Create a new directory** with a descriptive name
2. **Add a README.md** explaining the example
3. **Include setup instructions** and prerequisites
4. **Add package.json** with necessary dependencies
5. **Follow the existing structure** and patterns

### Example Structure
```
examples/
  your-example/
    README.md          # Explanation and setup
    package.json       # Dependencies
    src/
      index.ts         # Main example code
      setup.ts         # Database setup
    .env.example       # Environment variables
```

## 📞 Need Help?

- **Documentation** - Check the main [README.md](../README.md)
- **Issues** - Open an issue on GitHub
- **Discussions** - Join the community discussions

---

**Ready to explore?** Start with [basic-crud](./basic-crud/) for a gentle introduction!
