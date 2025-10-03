# Legacy Components and Documentation

This directory contains the original architecture documentation and implementation examples that have been moved here to simplify the main documentation structure.

## 📁 Contents

### Original Architecture Documentation
- **[ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md)** - Complete system overview and vision
- **[SIMPLIFIED_ARCHITECTURE.md](./SIMPLIFIED_ARCHITECTURE.md)** - Simplified 5-component architecture
- **[ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md)** - Visual diagrams and flow charts
- **[COMPONENT_MAPPING.md](./COMPONENT_MAPPING.md)** - Mapping from old to new architecture

### Implementation Documentation
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Step-by-step implementation guide
- **[QUICK_START.md](./QUICK_START.md)** - Original quick start guide
- **[USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md)** - Comprehensive usage examples

### Code Examples
- **[implementation-examples/](./implementation-examples/)** - Working code examples and patterns
  - `entity-example.ts` - Entity usage examples
  - `repository-example.ts` - Repository usage examples
  - `relationship-example.ts` - Relationship loading examples
  - `configuration-example.ts` - Configuration examples

### Original 18 Components
- **[01-entity-manager.md](./01-entity-manager.md)** - Entity Manager
- **[02-repository-registry.md](./02-repository-registry.md)** - Repository Registry
- **[03-relationship-engine.md](./03-relationship-engine.md)** - Relationship Engine
- **[04-validation-core.md](./04-validation-core.md)** - Validation Core
- **[05-schema-registry.md](./05-schema-registry.md)** - Schema Registry
- **[06-query-optimizer.md](./06-query-optimizer.md)** - Query Optimizer
- **[07-configuration-manager.md](./07-configuration-manager.md)** - Configuration Manager
- **[08-type-system.md](./08-type-system.md)** - Type System
- **[09-migration-integration.md](./09-migration-integration.md)** - Migration Integration
- **[10-error-handling.md](./10-error-handling.md)** - Error Handling
- **[11-lifecycle-hooks.md](./11-lifecycle-hooks.md)** - Lifecycle Hooks
- **[12-schema-introspection-engine.md](./12-schema-introspection-engine.md)** - Schema Introspection Engine
- **[13-dynamic-type-system.md](./13-dynamic-type-system.md)** - Dynamic Type System
- **[14-schema-change-detector.md](./14-schema-change-detector.md)** - Schema Change Detector
- **[15-type-regenerator.md](./15-type-regenerator.md)** - Type Regenerator
- **[16-entity-updater.md](./16-entity-updater.md)** - Entity Updater
- **[17-repository-updater.md](./17-repository-updater.md)** - Repository Updater
- **[18-fallback-system.md](./18-fallback-system.md)** - Fallback System

## 🎯 Why These Files Were Moved

These files were moved to the `legacy-components/` directory to:

1. **Simplify the main documentation structure** - Reduce cognitive load for new users
2. **Improve navigation** - Make it easier to find relevant information
3. **Maintain reference value** - Keep detailed implementation information available
4. **Support different user types** - Allow experienced developers to access detailed specs

## 📚 How to Use These Files

### For New Developers
Start with the main documentation in the parent directory:
- **[DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md)** - Complete developer guide
- **[QUICK_REFERENCE.md](../QUICK_REFERENCE.md)** - Quick reference card
- **[MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md)** - Migration from other ORMs

### For Experienced Developers
Use these legacy files for detailed implementation information:
- **[ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md)** - System design details
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Step-by-step implementation
- **[implementation-examples/](./implementation-examples/)** - Working code examples

### For Implementation Teams
Reference the original 18 components for comprehensive specifications:
- **[01-entity-manager.md](./01-entity-manager.md)** through **[18-fallback-system.md](./18-fallback-system.md)**

## 🔄 Migration Notes

The original 18-component architecture has been simplified into 5 core components:

1. **DreamBeeSQL Core** - Main entry point and coordination
2. **Schema Discovery Engine** - Database introspection
3. **Type & Entity Generator** - TypeScript generation
4. **Runtime Manager** - Entity and repository management
5. **Configuration & Utilities** - Configuration and error handling

See **[COMPONENT_MAPPING.md](./COMPONENT_MAPPING.md)** for detailed mapping information.

## 📖 Related Documentation

### Main Documentation (Parent Directory)
- **[DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md)** - Complete developer guide
- **[QUICK_REFERENCE.md](../QUICK_REFERENCE.md)** - Quick reference card
- **[MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md)** - Migration from other ORMs
- **[TYPESCRIPT_CHEAT_SHEET.md](../TYPESCRIPT_CHEAT_SHEET.md)** - TypeScript patterns
- **[TROUBLESHOOTING.md](../TROUBLESHOOTING.md)** - Common issues and solutions

### Legacy Documentation (This Directory)
- **[README.md](./README.md)** - Original legacy components overview
- **[README_ORIGINAL.md](./README_ORIGINAL.md)** - Original README content

---

**Note**: These files are maintained for reference purposes. For the most up-to-date and user-friendly documentation, please refer to the main documentation in the parent directory.
