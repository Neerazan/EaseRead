# EaseRead Monorepo - Complete Documentation Guide

> A comprehensive guide explaining the monorepo setup, configuration files, and development workflow.

---

## Table of Contents

1. [What is a Monorepo?](#what-is-a-monorepo)
2. [Project Architecture](#project-architecture)
3. [Configuration Files Explained](#configuration-files-explained)
4. [Package.json Files Explained](#packagejson-files-explained)
5. [Yarn Workspaces](#yarn-workspaces)
   - [Understanding node_modules Structure](#understanding-node_modules-structure)
6. [Development Workflow](#development-workflow)
7. [Dependency Management](#dependency-management)
8. [Sharing Code Between Apps](#sharing-code-between-apps)
9. [Common Tasks & Commands](#common-tasks--commands)
10. [Docker & Database](#docker--database)
11. [Quality Control (Prettier & Husky)](#quality-control-prettier--husky)
12. [Best Practices](#best-practices)
13. [Troubleshooting](#troubleshooting)

---

## What is a Monorepo?

A **monorepo** (monolithic repository) is a software development strategy where code for multiple projects is stored in the same repository. In this project, we have:

- **Frontend** (`@easeread/web`) - A Next.js application
- **Backend** (`@easeread/api`) - A NestJS application  
- **Shared** (`@easeread/shared`) - Common code used by both

### Benefits of This Approach

| Benefit | Description |
|---------|-------------|
| **Code Sharing** | Share types, utilities, and components across apps |
| **Single Source of Truth** | One repo with consistent tooling and configs |
| **Atomic Changes** | Update frontend and backend in a single commit |
| **Simplified Dependency Management** | Yarn hoists common dependencies to reduce duplication |
| **Consistent Tooling** | Same linting, formatting, and build processes |

---

## Project Architecture

```
EaseRead/
│
├── 📁 apps/                          # Application packages
│   ├── 📁 web/                       # Next.js frontend application
│   │   ├── 📁 src/                   # Source code
│   │   │   ├── 📁 app/               # Next.js App Router pages
│   │   │   └── ...
│   │   ├── 📁 public/                # Static assets
│   │   ├── 📄 package.json           # Web app dependencies
│   │   ├── 📄 next.config.ts         # Next.js configuration
│   │   ├── 📄 tsconfig.json          # TypeScript config for web
│   │   └── 📄 eslint.config.mjs      # ESLint config for web
│   │
│   └── 📁 api/                       # NestJS backend application
│       ├── 📁 src/                   # Source code
│       │   ├── 📄 main.ts            # Application entry point
│       │   ├── 📄 app.module.ts      # Root module
│       │   ├── 📄 app.controller.ts  # Root controller
│       │   └── 📄 app.service.ts     # Root service
│       ├── 📁 test/                  # E2E tests
│       ├── 📄 package.json           # API dependencies
│       ├── 📄 nest-cli.json          # NestJS CLI config
│       ├── 📄 tsconfig.json          # TypeScript config for API
│       └── 📄 eslint.config.mjs      # ESLint config for API
│
├── 📁 packages/                      # Shared packages
│   └── 📁 shared/                    # Shared types and utilities
│       ├── 📁 src/                   # Source code
│       │   └── 📄 index.ts           # Package entry point
│       ├── 📄 package.json           # Shared package config
│       └── 📄 tsconfig.json          # TypeScript config
│
├── 📁 node_modules/                  # Hoisted dependencies (root)
├── 📁 .yarn/                         # Yarn cache and releases
│
├── 📄 package.json                   # Root workspace configuration
├── 📄 yarn.lock                      # Dependency lock file
├── 📄 .yarnrc.yml                    # Yarn configuration
├── 📄 .gitignore                     # Git ignore rules
└── 📄 README.md                      # Project overview
```

---

## Configuration Files Explained

### Root Level Configuration

#### 📄 `.yarnrc.yml` - Yarn Configuration

```yaml
nodeLinker: node-modules    # Use traditional node_modules (not PnP)
enableGlobalCache: true     # Cache packages globally for faster installs
nmHoistingLimits: workspaces  # Hoist dependencies at workspace level
```

**What it does:**
- Tells Yarn to use the traditional `node_modules` folder structure instead of Plug'n'Play (PnP)
- This ensures compatibility with Next.js and NestJS which work better with node_modules
- Enables global caching to speed up installations across projects
- `nmHoistingLimits: workspaces` ensures each workspace gets its own node_modules for dependencies that can't be hoisted

#### 📄 `.gitignore` - Git Ignore Rules

**What it does:**
- Excludes `node_modules/` directories from version control
- Ignores build outputs (`.next/`, `dist/`, `build/`)
- Ignores environment files (`.env`, `.env.local`, etc.)
- Excludes IDE-specific files and OS artifacts

#### 📄 `yarn.lock` - Dependency Lock File

**What it does:**
- Records exact versions of all installed dependencies
- Ensures everyone on the team gets identical dependencies
- **Never edit manually** - Yarn manages this file automatically
- **Always commit this file** to version control

---

### App-Specific Configuration

#### 📄 `apps/web/next.config.ts` - Next.js Configuration

**What it does:**
- Configures Next.js build behavior
- Enables/disables experimental features
- Sets up redirects, rewrites, and headers
- Configures image optimization

#### 📄 `apps/web/tsconfig.json` - TypeScript Config (Frontend)

**What it does:**
- Defines TypeScript compiler options for the web app
- Sets up path aliases (e.g., `@/*` → `./src/*`)
- Configures JSX handling for React
- Includes/excludes specific files from compilation

#### 📄 `apps/api/nest-cli.json` - NestJS CLI Configuration

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

**What it does:**
- Configures the NestJS CLI behavior
- Sets the source root directory
- Configures schematics for code generation
- `deleteOutDir: true` cleans `dist/` before each build

#### 📄 `apps/api/tsconfig.json` - TypeScript Config (Backend)

**What it does:**
- Defines TypeScript compiler options for the API
- Sets up decorator metadata (required for NestJS dependency injection)
- Configures module resolution
- Enables strict mode for better type safety

---

## Package.json Files Explained

### 📄 Root `package.json`

```json
{
  "name": "easeread",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "yarn workspaces foreach -Ap --include '@easeread/web' --include '@easeread/api' run dev",
    "dev:web": "yarn workspace @easeread/web dev",
    "dev:api": "yarn workspace @easeread/api start:dev",
    "build": "yarn workspaces foreach -Ap run build",
    "build:web": "yarn workspace @easeread/web build",
    "build:api": "yarn workspace @easeread/api build",
    "lint": "yarn workspaces foreach -Ap run lint",
    "test": "yarn workspaces foreach -Ap run test",
    "clean": "yarn workspaces foreach -Ap run clean && rm -rf node_modules"
  },
  "packageManager": "yarn@4.6.0",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### Key Properties Explained:

| Property | Purpose |
|----------|---------|
| `name` | Project identifier (lowercase, no spaces) |
| `version` | Semantic version of the monorepo |
| `private: true` | Prevents accidental publishing to npm |
| `workspaces` | Defines which directories are Yarn workspaces |
| `scripts` | Commands runnable via `yarn <script-name>` |
| `packageManager` | Ensures correct Yarn version via Corepack |
| `engines` | Specifies required Node.js version |

#### Scripts Breakdown:

| Script | Command | What It Does |
|--------|---------|--------------|
| `dev` | `yarn dev` | Runs both web and API in parallel |
| `dev:web` | `yarn dev:web` | Runs only the Next.js dev server |
| `dev:api` | `yarn dev:api` | Runs only the NestJS dev server |
| `build` | `yarn build` | Builds all workspaces for production |
| `build:web` | `yarn build:web` | Builds only the Next.js app |
| `build:api` | `yarn build:api` | Builds only the NestJS app |
| `lint` | `yarn lint` | Runs linting in all workspaces |
| `test` | `yarn test` | Runs tests in all workspaces |
| `clean` | `yarn clean` | Removes all build artifacts and node_modules |

---

### 📄 `apps/web/package.json` - Frontend

```json
{
  "name": "@easeread/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "clean": "rm -rf .next node_modules"
  },
  "dependencies": {
    "@easeread/shared": "workspace:*",
    "next": "16.1.1",
    "react": "19.2.3",
    "react-dom": "19.2.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.1",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

#### Key Points:

| Property | Description |
|----------|-------------|
| `name: "@easeread/web"` | Scoped package name following `@org/package` convention |
| `"@easeread/shared": "workspace:*"` | Links to the shared package in this monorepo |
| `dependencies` | Runtime dependencies (included in production build) |
| `devDependencies` | Development-only dependencies (not in production) |

---

### 📄 `apps/api/package.json` - Backend

```json
{
  "name": "@easeread/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "@easeread/shared": "workspace:*",
    "@nestjs/common": "^11.0.1",
    "@nestjs/core": "^11.0.1",
    "@nestjs/platform-express": "^11.0.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/testing": "^11.0.1",
    "jest": "^30.0.0",
    "typescript": "^5.7.3",
    // ... more dev dependencies
  }
}
```

#### NestJS Scripts Explained:

| Script | What It Does |
|--------|--------------|
| `start:dev` | Development mode with hot-reload (watch mode) |
| `start:debug` | Development with Node.js debugger attached |
| `start:prod` | Production mode (runs compiled JavaScript) |
| `test:e2e` | End-to-end tests using a separate Jest config |

---

### 📄 `packages/shared/package.json` - Shared Package

```json
{
  "name": "@easeread/shared",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint src/",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

#### Key Points:

| Property | Description |
|----------|-------------|
| `main` | Entry point for the package (CommonJS) |
| `types` | TypeScript types entry point |
| `private: true` | Not published to npm registry |

---

## Yarn Workspaces

### How Workspaces Work

Yarn Workspaces allow you to set up multiple packages in a single repository. They work by:

1. **Symlinking** - Creating symbolic links between packages
2. **Hoisting** - Moving common dependencies to the root `node_modules`
3. **Resolving** - Using `workspace:*` protocol for internal dependencies

### The `workspace:*` Protocol

```json
"dependencies": {
  "@easeread/shared": "workspace:*"
}
```

This tells Yarn:
- "Use the local `@easeread/shared` package from this monorepo"
- The `*` means "accept any version"
- Yarn creates a symlink instead of downloading from npm

### Workspace Commands

```bash
# Run a command in a specific workspace
yarn workspace @easeread/web <command>

# Run a command in all workspaces
yarn workspaces foreach <command>

# Run parallel (-p) with prefix (-A) showing package names
yarn workspaces foreach -Ap run build

# Run only in workspaces that have a specific script
yarn workspaces foreach --include '@easeread/*' run test
```

### Understanding `node_modules` Structure

In this monorepo, **node_modules is partially shared** through a mechanism called **hoisting**.

#### Multiple `node_modules` Folders

```
EaseRead/
├── node_modules/              ← 🔵 ROOT (hoisted/shared dependencies)
├── apps/
│   ├── web/node_modules/      ← 🟡 Web-specific dependencies
│   └── api/node_modules/      ← 🟡 API-specific dependencies
└── packages/
    └── shared/node_modules/   ← 🟡 Shared package dependencies
```

#### How Hoisting Works

| Location | What's Inside |
|----------|---------------|
| **Root `node_modules/`** | Common dependencies shared by multiple workspaces (e.g., `typescript`, `eslint`) |
| **Workspace `node_modules/`** | Dependencies unique to that workspace OR symlinks to the shared package |

#### Why Multiple `node_modules`?

Due to the `.yarnrc.yml` setting:

```yaml
nmHoistingLimits: workspaces
```

This means:
1. **Common dependencies** (used by multiple apps) → Hoisted to root `node_modules/`
2. **Unique dependencies** (only used by one app) → Stay in that app's `node_modules/`
3. **Conflicting versions** → Each workspace gets its own version

#### Example of Hoisting in Action

```
Root node_modules/
├── typescript/          ← Shared by all (hoisted)
├── eslint/              ← Shared by all (hoisted)
└── @easeread/shared/    ← Symlink to packages/shared

apps/web/node_modules/
├── next/                ← Only web needs this
├── react/               ← Only web needs this
└── @easeread/shared/    ← Symlink to packages/shared

apps/api/node_modules/
├── @nestjs/core/        ← Only api needs this
├── @nestjs/common/      ← Only api needs this
└── @easeread/shared/    ← Symlink to packages/shared
```

#### Benefits of This Approach

| Benefit | Description |
|---------|-------------|
| **Disk space savings** | Common packages stored once at root |
| **Faster installs** | Less to download when dependencies are shared |
| **Proper isolation** | Each app can have different versions if needed |
| **Compatibility** | Works well with Next.js and NestJS |

---

## Development Workflow

### Starting Development

```bash
# Terminal 1: Start both apps
yarn dev

# OR in separate terminals:
# Terminal 1: Start frontend
yarn dev:web

# Terminal 2: Start backend
yarn dev:api
```

### Access Points

| App | URL |
|-----|-----|
| Frontend (Next.js) | http://localhost:3000 |
| Backend (NestJS) | http://localhost:4000 |

### Making Changes

1. **Frontend changes** → Auto-reload via Next.js Fast Refresh
2. **Backend changes** → Auto-reload via NestJS watch mode
3. **Shared package changes** → May require restart of consuming apps

---

## Dependency Management

### Adding Dependencies

```bash
# Add to a specific workspace
yarn workspace @easeread/web add axios
yarn workspace @easeread/api add @nestjs/typeorm typeorm pg

# Add as dev dependency
yarn workspace @easeread/web add -D @types/lodash

# Add to root (shared dev tools)
yarn add -D prettier eslint -W
```

### Removing Dependencies

```bash
yarn workspace @easeread/web remove axios
```

### Updating Dependencies

```bash
# Update all dependencies
yarn up

# Update a specific package
yarn workspace @easeread/web up next

# Interactive upgrade
yarn upgrade-interactive
```

---

## Sharing Code Between Apps

### Using the Shared Package

The `@easeread/shared` package is designed for code reuse:

```typescript
// In apps/web or apps/api
import { User, formatDate } from '@easeread/shared';

const user: User = {
  id: '1',
  email: 'test@example.com',
  name: 'John Doe',
  createdAt: new Date(),
  updatedAt: new Date()
};

console.log(formatDate(user.createdAt));
```

### What to Put in Shared

| ✅ Good Candidates | ❌ Avoid |
|-------------------|----------|
| TypeScript interfaces/types | React components (frontend-only) |
| Utility functions | NestJS decorators (backend-only) |
| Constants and enums | Framework-specific code |
| Validation schemas | Heavy dependencies |
| API response types | Business logic |

### Adding to Shared Package

1. Add your code to `packages/shared/src/`
2. Export from `packages/shared/src/index.ts`
3. Use in any app with `import { ... } from '@easeread/shared'`

---

---

## Docker & Database

We use Docker to manage our local development database. This ensures consistency and avoids the need to install PostgreSQL directly on your machine.

### 1. Configuration

- **File**: `docker-compose.yml` (at root)
- **Environment**: `.env` (at root)

### 2. Available Scripts

Run these from the root directory:

| Script | Command | Description |
|--------|---------|-------------|
| `yarn db:up` | `docker compose up -d` | Start database in background |
| `yarn db:down` | `docker compose down` | Stop and remove containers |
| `yarn db:logs` | `docker compose logs -f`| View live database logs |

### 3. Services

#### PostgreSQL
- **Default Port**: `5432`
- **Hostname**: `localhost` (from your machine) or `db` (between containers)

#### pgAdmin (GUI)
- **Port**: `5050`
- **URL**: [http://localhost:5050](http://localhost:5050)
- **Credentials**: See `.env` (`admin@admin.com` / `admin`)

---


### Quick Reference

| Task | Command |
|------|---------|
| Install all dependencies | `yarn install` |
| Start development | `yarn dev` |
| Build all apps | `yarn build` |
| Run all tests | `yarn test` |
| Lint all code | `yarn lint` |
| Clean everything | `yarn clean` |
| Add package to web | `yarn workspace @easeread/web add <pkg>` |
| Add package to api | `yarn workspace @easeread/api add <pkg>` |

### Generating NestJS Code

```bash
# Generate a new module
yarn workspace @easeread/api exec nest g module users

# Generate a controller
yarn workspace @easeread/api exec nest g controller users

# Generate a service
yarn workspace @easeread/api exec nest g service users

# Generate a complete CRUD resource
yarn workspace @easeread/api exec nest g resource users
```

---

---

## Quality Control (Prettier & Husky)

To maintain a consistent coding style and prevent bad code from being committed, we use **Prettier**, **Husky**, and **lint-staged**.

### 1. Prettier (Code Formatter)

Prettier is configured at the root to ensure every file in the monorepo follows the same style.

| Command | Description |
|---------|-------------|
| `yarn format:check` | Check if any files need formatting |
| `yarn format:fix` | Automatically fix formatting in all files |

- **Config**: `.prettierrc`
- **Ignored Files**: `.prettierignore`

### 2. Husky & lint-staged (Git Hooks)

Husky manages Git hooks, and we use the `pre-commit` hook to run `lint-staged`.

- **How it works**: When you run `git commit`, Husky triggers `lint-staged`.
- **lint-staged**: This tool identifies exactly which files were changed and runs Prettier only on those files. This makes the process extremely fast.

**Workflow:**
1. You change `apps/web/src/app/page.tsx`.
2. You run `git add .`.
3. You run `git commit -m "update page"`.
4. **Prettier** automatically formats your file.
5. If the formatting changes, those changes are added to your commit automatically.
6. The commit completes.

---


### 1. Dependency Management

- ✅ Add dependencies to the workspace that needs them
- ✅ Keep shared dev tools (prettier, eslint) at root
- ❌ Don't add the same dependency to multiple workspaces

### 2. Code Organization

- ✅ Put shared types in `@easeread/shared`
- ✅ Keep app-specific code in respective apps
- ❌ Don't import from one app to another directly

### 3. Version Control

- ✅ Always commit `yarn.lock`
- ✅ Keep commits atomic (update related apps together)
- ❌ Don't commit `node_modules` or build artifacts

### 4. Environment Variables

Create `.env` files for each app:

```bash
# apps/web/.env.local (Next.js)
NEXT_PUBLIC_API_URL=http://localhost:4000

# apps/api/.env (NestJS)
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_SECRET=your-secret-key
```

---

## Troubleshooting

### Common Issues

#### "Cannot find module '@easeread/shared'"

```bash
# Rebuild the symlinks
yarn install
```

#### Dependency conflicts

```bash
# Clear cache and reinstall
yarn clean
yarn install
```

#### TypeScript errors in shared package

Make sure you're exporting from `packages/shared/src/index.ts`:

```typescript
// packages/shared/src/index.ts
export * from './types';
export * from './utils';
```

#### Port already in use

```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>

# Or use different ports
PORT=3001 yarn dev:web
PORT=4001 yarn dev:api
```

### Getting Help

1. Check this guide first
2. Review error messages carefully
3. Search the NestJS/Next.js documentation
4. Check the Yarn Berry documentation for workspace issues

---

## Further Reading

- [Yarn Workspaces Documentation](https://yarnpkg.com/features/workspaces)
- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

*Last updated: January 2026*
