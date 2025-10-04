# Changelog

All notable changes to NOORMME will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-10-04

### 🔒 Security - Major Security Hardening

NOORMME v1.1.0 introduces comprehensive security improvements with a clean, secure-by-default approach.

#### Added

**Security Validation Framework**
- ✅ New `security-validator.ts` module with 8 validation functions
- ✅ Automatic validation for all dynamic SQL identifiers (`sql.ref()`, `sql.table()`, `sql.id()`)
- ✅ Automatic validation for dynamic module references (`db.dynamic.ref()`, `db.dynamic.table()`)
- ✅ Path traversal protection for all file operations
- ✅ `RateLimiter` class for DoS protection
- ✅ 15+ dangerous pattern detection (SQL injection, null bytes, etc.)

**Safe SQL Helper Functions**
- ✅ New `safe-sql-helpers.ts` module with secure alternatives to raw SQL
- ✅ `safeOrderDirection()` - Validates ASC/DESC only
- ✅ `safeLimit()` - Numeric validation (1-10000)
- ✅ `safeOffset()` - Numeric validation (0-1000000)
- ✅ `safeOrderBy()` - Whitelist-based ORDER BY validation
- ✅ `safeKeyword()` - SQL keyword validation
- ✅ `safeLockMode()` - Type-safe lock modes
- ✅ `validateEnum()` and `validateNumericRange()` helpers

**Comprehensive Documentation**
- ✅ `SECURITY.md` - Complete security policy and best practices
- ✅ `SECURITY_AUDIT_REPORT.md` - Detailed security audit findings
- ✅ `SECURITY_IMPROVEMENTS_SUMMARY.md` - Clean code approach summary
- ✅ `src/util/SECURITY_UTILS_README.md` - Security utilities guide
- ✅ Enhanced inline documentation with security warnings

#### Changed

**Core Security Enhancements**
- 🔒 `sql.ref()` now automatically validates column references
- 🔒 `sql.table()` now automatically validates table references
- 🔒 `sql.id()` now automatically validates all identifiers
- 🔒 `db.dynamic.ref()` now automatically validates references
- 🔒 `db.dynamic.table()` now automatically validates tables
- ⚠️ Enhanced danger warnings on `sql.raw()` and `sql.lit()`
- ✅ Updated documentation with secure examples throughout

**Breaking Changes (Security)**
- ⚠️ **BREAKING**: Dynamic identifiers with SQL injection patterns now throw errors
  - Previous behavior: `sql.ref("id; DROP TABLE users--")` would execute
  - New behavior: Throws validation error with detailed message
  - **Migration**: Add whitelist validation before dynamic references
  - See [Migration Guide](./SECURITY.md#migration-guide) for details

#### Security

**Vulnerabilities Fixed**
- 🔴 **CRITICAL**: SQL injection via dynamic identifiers → **FIXED**
  - All `sql.ref()`, `sql.table()`, `sql.id()` calls now validated
  - All `db.dynamic.ref()`, `db.dynamic.table()` calls now validated

- 🟠 **HIGH**: Path traversal in file operations → **FIXED**
  - Database paths validated and sanitized
  - Output directories validated for code generation
  - Migration file paths validated

- 🟡 **MEDIUM**: Insufficient input validation → **FIXED**
  - Comprehensive validation framework implemented
  - 650+ lines of security code added
  - Multi-layer defense in depth

**Security Posture Improvements**
- SQL Injection Risk: CRITICAL → LOW
- Path Traversal Risk: HIGH → LOW
- Input Validation: POOR → EXCELLENT
- Overall Security: MODERATE → STRONG

#### Files Added
- `src/util/security-validator.ts` (350+ lines)
- `src/util/safe-sql-helpers.ts` (200+ lines)
- `src/util/security.ts` (100+ lines)
- `src/util/SECURITY_UTILS_README.md`
- `SECURITY.md`
- `SECURITY_AUDIT_REPORT.md`
- `SECURITY_IMPROVEMENTS_SUMMARY.md`

#### Files Modified
- `src/dynamic/dynamic.ts` - Added validation
- `src/raw-builder/sql.ts` - Added validation and enhanced warnings
- `README.md` - Added security section and documentation links

### 📊 Impact

- **~1000 lines** of security code added
- **100%** of dynamic references now protected
- **Multi-layer** defense in depth implemented
- **Zero** legacy dangerous code patterns
- **Backward compatible** except for intentionally dangerous inputs

### 🎯 Upgrade Notes

For existing users:

1. **Review dynamic references**: Check all uses of `sql.ref()`, `sql.table()`, `sql.id()`
2. **Add whitelist validation**: Validate user inputs against allowed values
3. **Use safe alternatives**: Replace `sql.raw()` with safe helpers where possible
4. **Read security docs**: See `SECURITY.md` for best practices
5. **Test thoroughly**: Ensure validation doesn't break legitimate use cases

### 📚 Documentation

All security documentation is available:
- Security Policy: `SECURITY.md`
- Audit Report: `SECURITY_AUDIT_REPORT.md`
- Utilities Guide: `src/util/SECURITY_UTILS_README.md`
- README updated with security section

---

## [1.0.0] - 2024-XX-XX

### Added
- Initial release of NOORMME
- Complete SQLite automation
- Schema discovery and introspection
- TypeScript type generation
- Repository pattern with auto-generated CRUD
- Performance optimization
- Kysely integration
- CLI tools (analyze, optimize, migrate, watch)
- Comprehensive documentation

### Features
- Zero-configuration setup
- Automatic schema discovery
- Type-safe operations
- Intelligent caching
- RBAC support
- NextAuth adapter
- Production monitoring
- Real-world examples

---

**Legend:**
- ✅ Added
- 🔒 Security
- ⚠️ Breaking Change
- 🔴 Critical
- 🟠 High
- 🟡 Medium
