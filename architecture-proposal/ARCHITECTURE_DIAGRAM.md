# NOORMME Architecture Diagram

> **Visual guide to NOORMME's system architecture**

This document provides visual diagrams and explanations of how NOORMME works internally.

## 📚 Navigation

- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - 5-minute setup guide
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Comprehensive documentation
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Common operations
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Migration from other ORMs
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[examples/](./examples/)** - Real-world usage patterns

## 🏗️ System Architecture Overview

```mermaid
graph TB
    subgraph "Application Layer"
        APP[Application Code]
        API[API Layer]
    end
    
    subgraph "NOORMME Core"
        NOORM[NOORMME Instance]
        REPO[Repository Factory]
        REL[Relationship Engine]
        QB[Query Builder]
    end
    
    subgraph "Schema & Types"
        SD[Schema Discovery]
        TG[Type Generation]
        CACHE[Schema Cache]
    end
    
    subgraph "Database Layer"
        DB[(Database)]
        POOL[Connection Pool]
    end
    
    subgraph "Generated Code"
        TYPES[TypeScript Types]
        ENTITIES[Entity Classes]
        REPOS[Repository Classes]
    end
    
    APP --> API
    API --> NOORM
    NOORM --> REPO
    NOORM --> REL
    NOORM --> QB
    NOORM --> SD
    SD --> TG
    TG --> TYPES
    TG --> ENTITIES
    REPO --> REPOS
    QB --> POOL
    POOL --> DB
    SD --> CACHE
    CACHE --> SD
```

## 🔄 Data Flow Diagram

```mermaid
sequenceDiagram
    participant App as Application
    participant NOORM as NOORMME Instance
    participant SD as Schema Discovery
    participant TG as Type Generation
    participant REPO as Repository
    participant DB as Database
    
    App->>NOORM: new NOORMME(config)
    NOORM->>SD: discoverSchema()
    SD->>DB: introspect tables
    DB-->>SD: schema metadata
    SD-->>NOORM: schema info
    NOORM->>TG: generateTypes(schema)
    TG-->>NOORM: TypeScript types
    NOORM-->>App: initialized
    
    App->>NOORM: getRepository('users')
    NOORM->>REPO: create repository
    REPO-->>App: UserRepository
    
    App->>REPO: findAll()
    REPO->>DB: SELECT * FROM users
    DB-->>REPO: user data
    REPO-->>App: User[]
```

## 🎯 Component Interaction Diagram

```mermaid
graph LR
    subgraph "Core Components"
        SD[Schema Discovery]
        TG[Type Generation]
        RF[Repository Factory]
        RE[Relationship Engine]
        QB[Query Builder]
    end
    
    subgraph "Supporting Systems"
        CACHE[Schema Cache]
        POOL[Connection Pool]
        LOG[Logging System]
        ERR[Error Handler]
    end
    
    SD --> TG
    TG --> RF
    RF --> RE
    RE --> QB
    QB --> POOL
    SD --> CACHE
    QB --> LOG
    QB --> ERR
```

## 📊 Repository Pattern Diagram

```mermaid
classDiagram
    class BaseRepository {
        +findById(id): Promise~T~
        +findAll(): Promise~T[]~
        +create(data): Promise~T~
        +update(entity): Promise~T~
        +delete(id): Promise~boolean~
        +findWithRelations(id, relations): Promise~T~
        +loadRelationships(entities, relations): Promise~void~
    }
    
    class UserRepository {
        +findByEmail(email): Promise~User~
        +findActiveUsers(): Promise~User[]~
    }
    
    class PostRepository {
        +findByUserId(userId): Promise~Post[]~
        +findRecentPosts(limit): Promise~Post[]~
    }
    
    class CommentRepository {
        +findByPostId(postId): Promise~Comment[]~
        +findByUserId(userId): Promise~Comment[]~
    }
    
    BaseRepository <|-- UserRepository
    BaseRepository <|-- PostRepository
    BaseRepository <|-- CommentRepository
```

## 🔗 Relationship Loading Diagram

```mermaid
graph TD
    subgraph "User Request"
        REQ[findWithRelations(userId, ['posts.comments'])]
    end
    
    subgraph "Relationship Engine"
        PARSE[Parse relationship path]
        LOAD1[Load user posts]
        LOAD2[Load post comments]
        MERGE[Merge relationships]
    end
    
    subgraph "Database Queries"
        Q1[SELECT * FROM posts WHERE user_id = ?]
        Q2[SELECT * FROM comments WHERE post_id IN ?]
    end
    
    REQ --> PARSE
    PARSE --> LOAD1
    LOAD1 --> Q1
    Q1 --> LOAD2
    LOAD2 --> Q2
    Q2 --> MERGE
    MERGE --> REQ
```

## 🎨 Type Generation Flow

```mermaid
flowchart TD
    subgraph "Schema Input"
        SCHEMA[Database Schema]
        TABLES[Table Definitions]
        COLUMNS[Column Metadata]
        RELS[Relationships]
    end
    
    subgraph "Type Generation"
        PARSE[Parse Schema]
        GENERATE[Generate Types]
        VALIDATE[Validate Types]
        OUTPUT[Output Types]
    end
    
    subgraph "Generated Output"
        ENTITY[Entity Types]
        ROW[Row Types]
        INSERT[Insertable Types]
        UPDATE[Updateable Types]
    end
    
    SCHEMA --> PARSE
    TABLES --> PARSE
    COLUMNS --> PARSE
    RELS --> PARSE
    PARSE --> GENERATE
    GENERATE --> VALIDATE
    VALIDATE --> OUTPUT
    OUTPUT --> ENTITY
    OUTPUT --> ROW
    OUTPUT --> INSERT
    OUTPUT --> UPDATE
```

## 🚀 Initialization Process

```mermaid
flowchart TD
    START[Start NOORM Initialization]
    CONFIG[Load Configuration]
    CONNECT[Connect to Database]
    DISCOVER[Discover Schema]
    GENERATE[Generate Types]
    CREATE[Create Repositories]
    READY[Ready for Use]
    
    START --> CONFIG
    CONFIG --> CONNECT
    CONNECT --> DISCOVER
    DISCOVER --> GENERATE
    GENERATE --> CREATE
    CREATE --> READY
    
    subgraph "Error Handling"
        ERR[Handle Errors]
        RETRY[Retry Connection]
        FAIL[Initialization Failed]
    end
    
    CONNECT -.-> ERR
    DISCOVER -.-> ERR
    GENERATE -.-> ERR
    ERR --> RETRY
    RETRY --> CONNECT
    ERR --> FAIL
```

## 🔧 Configuration Architecture

```mermaid
graph TB
    subgraph "Configuration Sources"
        ENV[Environment Variables]
        FILE[Config File]
        DEFAULT[Default Values]
    end
    
    subgraph "Configuration Manager"
        MERGE[Merge Configs]
        VALIDATE[Validate Config]
        APPLY[Apply Configuration]
    end
    
    subgraph "Configuration Types"
        DB[Database Config]
        CACHE[Cache Config]
        LOG[Logging Config]
        PERF[Performance Config]
    end
    
    ENV --> MERGE
    FILE --> MERGE
    DEFAULT --> MERGE
    MERGE --> VALIDATE
    VALIDATE --> APPLY
    APPLY --> DB
    APPLY --> CACHE
    APPLY --> LOG
    APPLY --> PERF
```

## 📈 Performance Monitoring

```mermaid
graph LR
    subgraph "Monitoring Components"
        METRICS[Metrics Collector]
        CACHE_MON[Cache Monitor]
        QUERY_MON[Query Monitor]
        PERF_MON[Performance Monitor]
    end
    
    subgraph "Data Collection"
        QUERY_STATS[Query Statistics]
        CACHE_STATS[Cache Statistics]
        PERF_STATS[Performance Statistics]
    end
    
    subgraph "Reporting"
        DASHBOARD[Dashboard]
        ALERTS[Alerts]
        REPORTS[Reports]
    end
    
    METRICS --> QUERY_STATS
    CACHE_MON --> CACHE_STATS
    PERF_MON --> PERF_STATS
    QUERY_STATS --> DASHBOARD
    CACHE_STATS --> DASHBOARD
    PERF_STATS --> DASHBOARD
    DASHBOARD --> ALERTS
    DASHBOARD --> REPORTS
```

## 🎯 Migration Path

```mermaid
graph TD
    subgraph "Current ORM"
        TYPEORM[TypeORM]
        PRISMA[Prisma]
        SEQUELIZE[Sequelize]
        DRIZZLE[Drizzle]
    end
    
    subgraph "Migration Process"
        ANALYZE[Analyze Current Schema]
        MAP[Map to NOORM]
        CONVERT[Convert Code]
        TEST[Test Migration]
    end
    
    subgraph "NOORM"
        NOORM_SCHEMA[NOORM Schema]
        NOORM_TYPES[NOORM Types]
        NOORM_REPOS[NOORM Repositories]
    end
    
    TYPEORM --> ANALYZE
    PRISMA --> ANALYZE
    SEQUELIZE --> ANALYZE
    DRIZZLE --> ANALYZE
    ANALYZE --> MAP
    MAP --> CONVERT
    CONVERT --> TEST
    TEST --> NOORM_SCHEMA
    TEST --> NOORM_TYPES
    TEST --> NOORM_REPOS
```

## 🔄 Schema Evolution

```mermaid
stateDiagram-v2
    [*] --> Monitoring
    Monitoring --> SchemaChanged: Schema Change Detected
    SchemaChanged --> ValidateChange: Validate Change
    ValidateChange --> ApplyChange: Change Valid
    ValidateChange --> RejectChange: Change Invalid
    ApplyChange --> RegenerateTypes: Types Need Update
    RegenerateTypes --> UpdateRepositories: Update Repositories
    UpdateRepositories --> NotifyApplication: Notify Application
    NotifyApplication --> Monitoring
    RejectChange --> Monitoring
    RejectChange --> [*]: Critical Error
```

## 🎨 Developer Experience Flow

```mermaid
journey
    title NOORM Developer Experience
    section Setup
      Install NOORM: 5: Developer
      Configure Database: 4: Developer
      Initialize NOORM: 5: Developer
    section Development
      Discover Schema: 5: Developer
      Generate Types: 5: Developer
      Use Repositories: 5: Developer
      Load Relationships: 4: Developer
    section Testing
      Write Tests: 5: Developer
      Run Tests: 5: Developer
      Debug Issues: 3: Developer
    section Deployment
      Build Application: 5: Developer
      Deploy to Production: 4: Developer
      Monitor Performance: 4: Developer
```

---

**Note:** These diagrams use Mermaid syntax and can be rendered in GitHub, GitLab, and other Markdown viewers that support Mermaid.
