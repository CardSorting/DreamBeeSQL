# NOORM - No ORM, Just Magic! ✨

[![NPM Version](https://img.shields.io/npm/v/noorm?style=flat&label=latest)](https://github.com/your-org/noorm/releases/latest)
[![Tests](https://github.com/your-org/noorm/actions/workflows/test.yml/badge.svg)](https://github.com/your-org/noorm)
[![License](https://img.shields.io/github/license/your-org/noorm?style=flat)](https://github.com/your-org/noorm/blob/master/LICENSE)

###### Join the discussion ⠀⠀⠀⠀⠀⠀⠀ 
[![Discord](https://img.shields.io/badge/Discord-%235865F2.svg?style=flat&logo=discord&logoColor=white)](https://discord.gg/noorm)
[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=flat&logo=twitter&logoColor=white)](https://twitter.com/noorm_dev)

###### Get started
[![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=flat&logo=postgresql&logoColor=white)](https://noorm.dev/docs/getting-started?dialect=postgresql)
[![MySQL](https://img.shields.io/badge/mysql-4479A1.svg?style=flat&logo=mysql&logoColor=white)](https://noorm.dev/docs/getting-started?dialect=mysql)
[![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=flat&logo=sqlite&logoColor=white)](https://noorm.dev/docs/getting-started?dialect=sqlite)
& more!

# NOORM - Zero Configuration, Maximum Magic 🎯

NOORM (pronounced "No-ORM") is a **zero-configuration pseudo-ORM** built on Kysely that automatically discovers your database schema and generates everything you need. No manual entity definitions, no complex setup - just pure magic!

## ✨ Why NOORM?

### 🚀 **Zero Configuration**
- Works with any existing database
- No manual entity definitions required
- Automatic schema discovery
- Just connect and go!

### 🎯 **Type-Safe Magic**
- Full TypeScript support with auto-generated types
- IntelliSense for everything
- Compile-time checking
- No runtime surprises

### ⚡ **Built for Performance**
- Smart caching and query optimization
- Lazy loading relationships
- Built on Kysely for optimal SQL generation
- Production-ready from day one

### 🎨 **Developer Experience**
- Clear, actionable error messages
- Comprehensive documentation
- Simple, intuitive API
- Works exactly how you'd expect

## 🚀 Quick Start (30 seconds)

```typescript
import { NOORM } from 'noorm'

// 1. Connect to your database
const db = new NOORM({
  dialect: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    username: 'user',
    password: 'password'
  }
})

// 2. Initialize (discovers everything automatically)
await db.initialize()

// 3. Use auto-generated repositories
const userRepo = db.getRepository('users')
const users = await userRepo.findAll()

// That's it! 🎉
```

**NOORM automatically:**
- ✅ Discovers all tables and relationships
- ✅ Generates TypeScript types
- ✅ Creates entity classes
- ✅ Builds repository classes with CRUD operations
- ✅ Provides full IntelliSense support

# Core team

## Project leads

Responsible for project direction, API design, maintenance, code reviews, community support, documentation, and working on some of the most 
impactful/challenging things.

<table>
    <tbody>
        <tr>
            <td align="center">
                <a href="https://github.com/koskimas">
                    <img src="https://avatars.githubusercontent.com/u/846508?v=4?s=100" width="100px;" alt=""/>
                    <br />
                    Sami Koskimäki
                </a>
                <br />
                (the <a href="https://web.archive.org/web/20211203210043/https://www.jakso.me/blog/kysely-a-type-safe-sql-query-builder-for-typescript">author</a>)
            </td>
            <td align="center">
                <a href="https://github.com/igalklebanov">
                    <img src="https://avatars.githubusercontent.com/u/14938291?v=4&s=100" width="100px;" alt=""/>
                    <br />
                    Igal Klebanov
                </a>
                <br />
                (the <a href="https://github.com/kysely-org/kysely/pull/1414#issuecomment-2781281996">dynamo</a>)
            </td>
        </tr>
    </tbody>
</table>

## Honorable mentions

People who had special impact on the project and its growth.

<table>
    <tbody>
        <tr>
            <td align="center">
                <a href="https://github.com/fhur">
                    <img src="https://avatars.githubusercontent.com/u/6452323?v=4&s=100" width="100px;" alt=""/>
                    <br />
                    Fernando Hurtado
                </a>
                <br />
                (1st <a href="https://kysely.dev">docs</a>)
            </td>
            <td align="center">
                <a href="https://github.com/wirekang">
                    <img src="https://avatars.githubusercontent.com/u/43294688?v=4&s=100" width="100px;" alt=""/>
                    <br />
                    Wirekang
                </a>
                <br />
                (<a href="https://kyse.link">playground</a>)
            </td>
            <td align="center">
                <a href="https://github.com/tgriesser">
                    <img src="https://avatars.githubusercontent.com/u/154748?v=4&s=100" width="100px;" alt=""/>
                    <br />
                    Tim Griesser
                </a>
                <br />
                (<a href="https://knexjs.org/">Knex</a>)
            </td>
        </tr>
        <tr>
            <td align="center">
                <a href="https://github.com/RobinBlomberg">
                    <img src="https://avatars.githubusercontent.com/u/20827397?v=4&s=100" width="100px;" alt=""/>
                    <br />
                    Robin Blomberg
                </a>
                <br />
                (<a href="https://github.com/RobinBlomberg/kysely-codegen">codegen</a>)
            </td>
                        <td align="center">
                <a href="https://github.com/nexxeln">
                    <img src="https://avatars.githubusercontent.com/u/95541290?v=4&s=100" width="100px" alt="" />
                    <br />
                    Shoubhit Dash
                </a>
                <br />
                (prisma <a href="https://www.nexxel.dev/blog/typesafe-database">idea</a>)
            </td>
            <td align="center">
                <a href="https://github.com/nexxeln">
                    <img src="https://avatars.githubusercontent.com/u/3050355?v=4&s=100" width="100px" alt="" />
                    <br />
                    Valtýr Örn Kjartansson
                </a>
                <br />
                (prisma <a href="https://github.com/valtyr/prisma-kysely">impl</a>)
            </td>
        </tr>
        <tr>
            <td align="center">
                <a href="https://github.com/thdxr">
                    <img src="https://avatars.githubusercontent.com/u/826656?v=4&s=100" width="100px;" alt=""/>
                    <br />
                    Dax Raad
                </a>
                <br />
                (early <a href="https://thdxr.com/post/serverless-relational-showdown">adopter</a>)
            </td>
            <td align="center">
                <a href="https://github.com/t3dotgg">
                    <img src="https://avatars.githubusercontent.com/u/6751787?v=4&s=100" width="100px;" alt=""/>
                    <br />
                    Theo Browne
                </a>
                <br />
                (early <a href="https://discord.com/channels/966627436387266600/988912020558602331/993220628154961930">promoter</a>)
            </td>
            <td align="center">
                <a href="https://github.com/leerob">
                    <img src="https://avatars.githubusercontent.com/u/9113740?v=4&s=100" width="100px;" alt="" />
                    <br />
                    Lee Robinson
                </a>
                <br />
                (early <a href="https://x.com/leerob/status/1576929372811849730">promoter</a>)
            </td>
        </tr>
        <tr>
            <td align="center">
                <a href="https://github.com/ethanresnick">
                    <img src="https://avatars.githubusercontent.com/u/471894?v=4&s=100" width="100px" alt="" />
                    <br />
                    Ethan Resnick
                </a>
                <br />
                (timely <a href="https://github.com/kysely-org/kysely/issues/494">feedback</a>)
            </td>
            <td align="center">
                <a href="https://github.com/thetutlage">
                    <img src="https://avatars.githubusercontent.com/u/1706381?v=4&s=100" width="100px;" alt="" />
                    <br />
                    Harminder Virk
                </a>
                <br />
                (dope <a href="https://github.com/thetutlage/meta/discussions/8">writeup</a>)
            </td>
            <td align="center">
                <a href="https://github.com/elitan">
                    <img src="https://avatars.githubusercontent.com/u/331818?v=4&s=100" width="100px;" alt="" />
                    <br />
                    Johan Eliasson
                </a>
                <br />
                (<a href="https://eliasson.me/articles/crafting-the-perfect-t3-stack-my-journey-with-kysely-atlas-and-clerk">promoter</a>/<a href="https://www.youtube.com/watch?v=u2s39dRIpCM">educator</a>)
            </td>
        </tr>
        <!-- <tr>
            <td align="center">
                <a href="">
                    <img src="" width="100px;" alt="" />
                    <br />
                    Name
                </a>
                <br />
                (contribution)
            </td>
        </tr> -->
    </tbody>
</table>

## All contributors

<p align="center">
    <a href="https://github.com/kysely-org/kysely/graphs/contributors">
        <img src="https://contrib.rocks/image?repo=kysely-org/kysely" />
    </a>
    </br>
    <span>Want to contribute? Check out our <a href="./CONTRIBUTING.md" >contribution guidelines</a>.</span>
</p>

<p align="center">
    <a href="https://vercel.com/?utm_source=kysely&utm_campaign=oss">
        <img src="https://kysely.dev/img/powered-by-vercel.svg" alt="Powered by Vercel" />
    </a>
</p>
