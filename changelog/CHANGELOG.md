# Changelog

All notable changes to NOORMME will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive TypeScript type safety improvements
- New `AutomationConfig` interface for automation settings
- New `OptimizationConfig` interface for SQLite optimization settings
- Enhanced `PerformanceConfig` with additional properties
- Proper type definitions for all database operations

### Changed
- Eliminated all `any` types from core functionality
- Improved type safety for Repository interface methods
- Enhanced type generation with proper interfaces
- Better type safety for CLI commands
- Cleaner architecture without backward compatibility workarounds

### Fixed
- TypeScript compilation errors
- Type assertion issues in NOORMME class
- Missing interface imports
- Inconsistent type usage patterns

### Removed
- `NOORMME.Config` namespace for backward compatibility
- Unsafe type assertions and `any` types
- Backward compatibility workarounds

## [Previous Versions]

For detailed information about previous versions and changes, please refer to the individual changelog files in the `changelog/` directory.

---

**Note:** This is a high-level changelog. For detailed technical information about specific changes, please refer to the individual changelog files in the `changelog/` directory.
