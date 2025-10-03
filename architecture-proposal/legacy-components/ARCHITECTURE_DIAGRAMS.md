# DreamBeeSQL Architecture Diagrams

## 🎯 System Overview

```mermaid
graph TB
    subgraph "User Application"
        APP[Application Code]
        CONFIG[Configuration]
    end
    
    subgraph "DreamBeeSQL Core"
        DBS[DreamBeeSQL]
        DISCOVERY[Schema Discovery Engine]
        GENERATOR[Type & Entity Generator]
        RUNTIME[Runtime Manager]
        CONFIG_MGR[Configuration Manager]
    end
    
    subgraph "Database Layer"
        PG[(PostgreSQL)]
        MYSQL[(MySQL)]
        SQLITE[(SQLite)]
        MSSQL[(MSSQL)]
    end
    
    subgraph "Generated Output"
        TYPES[TypeScript Types]
        ENTITIES[Entity Classes]
        REPOS[Repository Classes]
    end
    
    APP --> DBS
    CONFIG --> CONFIG_MGR
    DBS --> DISCOVERY
    DBS --> GENERATOR
    DBS --> RUNTIME
    CONFIG_MGR --> DBS
    
    DISCOVERY --> PG
    DISCOVERY --> MYSQL
    DISCOVERY --> SQLITE
    DISCOVERY --> MSSQL
    
    GENERATOR --> TYPES
    GENERATOR --> ENTITIES
    GENERATOR --> REPOS
    
    RUNTIME --> TYPES
    RUNTIME --> ENTITIES
    RUNTIME --> REPOS
```

## 🔍 Component Architecture

```mermaid
graph LR
    subgraph "DreamBeeSQL Core"
        DBS[DreamBeeSQL<br/>Main Entry Point]
    end
    
    subgraph "Discovery Layer"
        DISCOVERY[Schema Discovery Engine]
        PG_STRAT[PostgreSQL Strategy]
        MYSQL_STRAT[MySQL Strategy]
        SQLITE_STRAT[SQLite Strategy]
        MSSQL_STRAT[MSSQL Strategy]
    end
    
    subgraph "Generation Layer"
        GENERATOR[Type & Entity Generator]
        TYPE_MAPPER[Database Type Mapper]
        ENTITY_GEN[Entity Generator]
        REPO_GEN[Repository Generator]
    end
    
    subgraph "Runtime Layer"
        RUNTIME[Runtime Manager]
        ENTITY_MGR[Entity Manager]
        REPO_REG[Repository Registry]
        CACHE[Cache Manager]
    end
    
    subgraph "Support Layer"
        CONFIG[Configuration Manager]
        ERROR[Error Handler]
        LOG[Logger]
    end
    
    DBS --> DISCOVERY
    DBS --> GENERATOR
    DBS --> RUNTIME
    DBS --> CONFIG
    
    DISCOVERY --> PG_STRAT
    DISCOVERY --> MYSQL_STRAT
    DISCOVERY --> SQLITE_STRAT
    DISCOVERY --> MSSQL_STRAT
    
    GENERATOR --> TYPE_MAPPER
    GENERATOR --> ENTITY_GEN
    GENERATOR --> REPO_GEN
    
    RUNTIME --> ENTITY_MGR
    RUNTIME --> REPO_REG
    RUNTIME --> CACHE
    
    CONFIG --> ERROR
    CONFIG --> LOG
```

## 🔄 Data Flow Diagrams

### Initialization Flow

```mermaid
sequenceDiagram
    participant User
    participant DBS as DreamBeeSQL
    participant Discovery as Schema Discovery
    participant Generator as Type Generator
    participant Runtime as Runtime Manager
    participant DB as Database
    
    User->>DBS: new DreamBeeSQL(config)
    User->>DBS: initialize()
    
    DBS->>Discovery: discoverDatabase(db)
    Discovery->>DB: Query schema metadata
    DB-->>Discovery: Return tables, columns, relationships
    Discovery-->>DBS: DiscoveryResult
    
    DBS->>Generator: generateTypes(schemas)
    Generator-->>DBS: GeneratedTypes
    
    DBS->>Generator: generateEntities(schemas)
    Generator-->>DBS: GeneratedEntities
    
    DBS->>Generator: generateRepositories(schemas)
    Generator-->>DBS: GeneratedRepositories
    
    DBS->>Runtime: registerTypes(types)
    DBS->>Runtime: registerEntities(entities)
    DBS->>Runtime: registerRepositories(repos)
    
    DBS-->>User: Initialization complete
```

### Runtime Operation Flow

```mermaid
sequenceDiagram
    participant User
    participant DBS as DreamBeeSQL
    participant Runtime as Runtime Manager
    participant Repo as Repository
    participant DB as Database
    
    User->>DBS: getRepository('users')
    DBS->>Runtime: getRepository('users')
    Runtime-->>DBS: UserRepository instance
    DBS-->>User: UserRepository
    
    User->>Repo: findAll()
    Repo->>DB: SELECT * FROM users
    DB-->>Repo: Raw rows
    Repo->>Repo: Convert to entities
    Repo-->>User: User entities
```

### Schema Evolution Flow

```mermaid
sequenceDiagram
    participant Monitor as Schema Monitor
    participant Discovery as Schema Discovery
    participant Generator as Type Generator
    participant Runtime as Runtime Manager
    participant DB as Database
    
    Monitor->>Discovery: detectSchemaChanges()
    Discovery->>DB: Query current schema
    DB-->>Discovery: Current schema
    Discovery->>Discovery: Compare with cached schema
    Discovery-->>Monitor: Schema changes detected
    
    Monitor->>Generator: updateForSchemaChange(changes)
    Generator->>Generator: Regenerate affected types
    Generator->>Generator: Regenerate affected entities
    Generator->>Generator: Regenerate affected repositories
    Generator-->>Monitor: Updated components
    
    Monitor->>Runtime: updateEntities(updated)
    Runtime->>Runtime: Update entity registry
    Runtime->>Runtime: Invalidate cache
    Runtime-->>Monitor: Update complete
```

## 🏗️ Database Schema Discovery

```mermaid
graph TD
    subgraph "Database"
        TABLES[Tables]
        COLUMNS[Columns]
        INDEXES[Indexes]
        FKS[Foreign Keys]
        CONSTRAINTS[Constraints]
    end
    
    subgraph "Discovery Process"
        INTROSPECT[Schema Introspection]
        ANALYZE[Relationship Analysis]
        VALIDATE[Schema Validation]
    end
    
    subgraph "Discovery Result"
        SCHEMAS[Table Schemas]
        RELATIONSHIPS[Relationship Info]
        METADATA[Discovery Metadata]
    end
    
    TABLES --> INTROSPECT
    COLUMNS --> INTROSPECT
    INDEXES --> INTROSPECT
    FKS --> INTROSPECT
    CONSTRAINTS --> INTROSPECT
    
    INTROSPECT --> ANALYZE
    ANALYZE --> VALIDATE
    
    VALIDATE --> SCHEMAS
    VALIDATE --> RELATIONSHIPS
    VALIDATE --> METADATA
```

## 🎨 Type Generation Process

```mermaid
graph LR
    subgraph "Input"
        SCHEMA[Database Schema]
        RELATIONS[Relationships]
    end
    
    subgraph "Generation"
        TYPE_MAP[Type Mapping]
        ENTITY_GEN[Entity Generation]
        REPO_GEN[Repository Generation]
        VALIDATION_GEN[Validation Generation]
    end
    
    subgraph "Output"
        TYPES[TypeScript Types]
        ENTITIES[Entity Classes]
        REPOS[Repository Classes]
        VALIDATIONS[Validation Rules]
    end
    
    SCHEMA --> TYPE_MAP
    RELATIONS --> TYPE_MAP
    
    TYPE_MAP --> ENTITY_GEN
    TYPE_MAP --> REPO_GEN
    TYPE_MAP --> VALIDATION_GEN
    
    ENTITY_GEN --> ENTITIES
    REPO_GEN --> REPOS
    VALIDATION_GEN --> VALIDATIONS
    
    TYPE_MAP --> TYPES
```

## 🔗 Relationship Detection

```mermaid
graph TD
    subgraph "Database Tables"
        USERS[Users Table]
        POSTS[Posts Table]
        COMMENTS[Comments Table]
        PROFILES[Profiles Table]
    end
    
    subgraph "Foreign Keys"
        FK1[posts.user_id → users.id]
        FK2[comments.post_id → posts.id]
        FK3[comments.user_id → users.id]
        FK4[profiles.user_id → users.id]
    end
    
    subgraph "Detected Relationships"
        REL1[User hasMany Posts]
        REL2[User hasMany Comments]
        REL3[User hasOne Profile]
        REL4[Post belongsTo User]
        REL5[Post hasMany Comments]
        REL6[Comment belongsTo Post]
        REL7[Comment belongsTo User]
        REL8[Profile belongsTo User]
    end
    
    USERS --> FK1
    USERS --> FK3
    USERS --> FK4
    POSTS --> FK2
    
    FK1 --> REL1
    FK1 --> REL4
    FK2 --> REL5
    FK2 --> REL6
    FK3 --> REL2
    FK3 --> REL7
    FK4 --> REL3
    FK4 --> REL8
```

## 💾 Caching Strategy

```mermaid
graph TB
    subgraph "Cache Layers"
        L1[L1: Memory Cache<br/>Fast access, limited size]
        L2[L2: File Cache<br/>Persistent, larger size]
        L3[L3: Database Cache<br/>Schema metadata]
    end
    
    subgraph "Cache Operations"
        GET[Get]
        SET[Set]
        INVALIDATE[Invalidate]
        REFRESH[Refresh]
    end
    
    subgraph "Cache Policies"
        LRU[LRU Eviction]
        TTL[TTL Expiration]
        SIZE[Size Limits]
    end
    
    GET --> L1
    GET --> L2
    GET --> L3
    
    SET --> L1
    SET --> L2
    SET --> L3
    
    INVALIDATE --> L1
    INVALIDATE --> L2
    INVALIDATE --> L3
    
    L1 --> LRU
    L2 --> TTL
    L3 --> SIZE
```

## 🚨 Error Handling Flow

```mermaid
graph TD
    subgraph "Error Sources"
        DISCOVERY_ERR[Discovery Errors]
        GENERATION_ERR[Generation Errors]
        RUNTIME_ERR[Runtime Errors]
        DB_ERR[Database Errors]
    end
    
    subgraph "Error Handler"
        CATCH[Catch Error]
        CLASSIFY[Classify Error]
        LOG[Log Error]
        FALLBACK[Create Fallback]
    end
    
    subgraph "Error Responses"
        RETRY[Retry Operation]
        FALLBACK_RESP[Fallback Response]
        ERROR_RESP[Error Response]
        NOTIFY[Notify User]
    end
    
    DISCOVERY_ERR --> CATCH
    GENERATION_ERR --> CATCH
    RUNTIME_ERR --> CATCH
    DB_ERR --> CATCH
    
    CATCH --> CLASSIFY
    CLASSIFY --> LOG
    LOG --> FALLBACK
    
    FALLBACK --> RETRY
    FALLBACK --> FALLBACK_RESP
    FALLBACK --> ERROR_RESP
    FALLBACK --> NOTIFY
```

## 📊 Performance Monitoring

```mermaid
graph LR
    subgraph "Performance Metrics"
        DISCOVERY_TIME[Discovery Time]
        GENERATION_TIME[Generation Time]
        QUERY_TIME[Query Time]
        CACHE_HIT[Cache Hit Rate]
    end
    
    subgraph "Monitoring"
        METRICS[Metrics Collector]
        ANALYZER[Performance Analyzer]
        ALERT[Alert System]
    end
    
    subgraph "Optimization"
        CACHE_OPT[Cache Optimization]
        QUERY_OPT[Query Optimization]
        INDEX_OPT[Index Optimization]
    end
    
    DISCOVERY_TIME --> METRICS
    GENERATION_TIME --> METRICS
    QUERY_TIME --> METRICS
    CACHE_HIT --> METRICS
    
    METRICS --> ANALYZER
    ANALYZER --> ALERT
    
    ANALYZER --> CACHE_OPT
    ANALYZER --> QUERY_OPT
    ANALYZER --> INDEX_OPT
```

## 🔧 Configuration Management

```mermaid
graph TD
    subgraph "Configuration Sources"
        ENV[Environment Variables]
        FILE[Config Files]
        CLI[Command Line Args]
        DEFAULT[Default Values]
    end
    
    subgraph "Configuration Manager"
        LOAD[Load Config]
        VALIDATE[Validate Config]
        MERGE[Merge Configs]
        CACHE[Cache Config]
    end
    
    subgraph "Configuration Types"
        DB_CONFIG[Database Config]
        INTROSPECT_CONFIG[Introspection Config]
        CACHE_CONFIG[Cache Config]
        LOG_CONFIG[Logging Config]
    end
    
    ENV --> LOAD
    FILE --> LOAD
    CLI --> LOAD
    DEFAULT --> LOAD
    
    LOAD --> VALIDATE
    VALIDATE --> MERGE
    MERGE --> CACHE
    
    CACHE --> DB_CONFIG
    CACHE --> INTROSPECT_CONFIG
    CACHE --> CACHE_CONFIG
    CACHE --> LOG_CONFIG
```

## 🎯 Usage Patterns

### Basic Usage Pattern

```mermaid
graph LR
    subgraph "Developer Workflow"
        INIT[Initialize DreamBeeSQL]
        DISCOVER[Discover Schema]
        GENERATE[Generate Types]
        USE[Use Generated Code]
    end
    
    subgraph "Generated Code"
        TYPES[TypeScript Types]
        ENTITIES[Entity Classes]
        REPOS[Repository Classes]
    end
    
    INIT --> DISCOVER
    DISCOVER --> GENERATE
    GENERATE --> USE
    
    GENERATE --> TYPES
    GENERATE --> ENTITIES
    GENERATE --> REPOS
    
    USE --> TYPES
    USE --> ENTITIES
    USE --> REPOS
```

### Advanced Usage Pattern

```mermaid
graph TD
    subgraph "Advanced Features"
        SCHEMA_EVOLVE[Schema Evolution]
        RELATIONSHIPS[Relationship Loading]
        CACHING[Smart Caching]
        OPTIMIZATION[Query Optimization]
    end
    
    subgraph "Monitoring"
        CHANGE_DETECT[Change Detection]
        PERFORMANCE[Performance Monitoring]
        ERROR_HANDLING[Error Handling]
    end
    
    subgraph "Production Features"
        SCALING[Horizontal Scaling]
        BACKUP[Backup & Recovery]
        SECURITY[Security Features]
    end
    
    SCHEMA_EVOLVE --> CHANGE_DETECT
    RELATIONSHIPS --> PERFORMANCE
    CACHING --> PERFORMANCE
    OPTIMIZATION --> PERFORMANCE
    
    CHANGE_DETECT --> ERROR_HANDLING
    PERFORMANCE --> ERROR_HANDLING
    
    ERROR_HANDLING --> SCALING
    ERROR_HANDLING --> BACKUP
    ERROR_HANDLING --> SECURITY
```

## 🎨 Visual Summary

These diagrams illustrate the complete DreamBeeSQL architecture, from high-level system overview to detailed component interactions. The visual representation helps developers understand:

1. **System Architecture** - How components interact
2. **Data Flow** - How information moves through the system
3. **Process Flow** - Step-by-step operations
4. **Error Handling** - How errors are managed
5. **Performance** - How the system is optimized
6. **Configuration** - How settings are managed
7. **Usage Patterns** - How developers interact with the system

The diagrams use Mermaid syntax, making them easy to maintain and update as the architecture evolves.
