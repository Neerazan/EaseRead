# EaseRead

A monorepo for the EaseRead application, built with **Next.js** (frontend) and **NestJS** (backend) using **Yarn Workspaces**.

> 📖 **For detailed documentation**, see the [Complete Monorepo Guide](./docs/GUIDE.md)

## 📁 Project Structure

```
EaseRead/
├── apps/
│   ├── web/                 # Next.js frontend (React 19, TypeScript, Tailwind CSS)
│   └── api/                 # NestJS backend (TypeScript, Node.js)
├── packages/
│   └── shared/              # Shared types, interfaces, and utilities
├── package.json             # Root package.json with workspaces config
├── yarn.lock                # Yarn lockfile
└── .yarnrc.yml              # Yarn configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- Yarn 4.x (enabled via Corepack)

### Installation

```bash
# Enable Corepack (if not already enabled)
corepack enable

# Install all dependencies
yarn install
```

## 📜 Scripts

### Root Level Commands

| Command | Description |
|---------|-------------|
| `yarn dev` | Run both web and api in development mode |
| `yarn dev:web` | Run only the Next.js frontend |
| `yarn dev:api` | Run only the NestJS backend |
| `yarn build` | Build all workspaces |
| `yarn build:web` | Build only the frontend |
| `yarn build:api` | Build only the backend |
| `yarn lint` | Lint all workspaces |
| `yarn test` | Run tests in all workspaces |
| `yarn clean` | Clean all build artifacts and node_modules |

### Workspace-Specific Commands

You can run commands in specific workspaces:

```bash
# Run a command in the web workspace
yarn workspace @easeread/web <command>

# Run a command in the api workspace
yarn workspace @easeread/api <command>

# Run a command in the shared package
yarn workspace @easeread/shared <command>
```

## 🔧 Development

### Frontend (Next.js)

```bash
# Start development server (http://localhost:3000)
yarn dev:web
```

### Backend (NestJS)

```bash
# Start development server with watch mode (http://localhost:3000)
yarn dev:api
```

> **Note:** You may want to change the NestJS port to avoid conflicts with Next.js. Update `apps/api/src/main.ts` to use a different port (e.g., 4000).

### Using Shared Package

The shared package (`@easeread/shared`) is available to both apps. Import shared types and utilities like this:

```typescript
import { User, formatDate } from '@easeread/shared';
```

## 📦 Workspaces

| Workspace | Package Name | Description |
|-----------|--------------|-------------|
| `apps/web` | `@easeread/web` | Next.js frontend application |
| `apps/api` | `@easeread/api` | NestJS backend API |
| `packages/shared` | `@easeread/shared` | Shared types and utilities |

## 🛠️ Adding New Packages

To add a dependency to a specific workspace:

```bash
# Add to web app
yarn workspace @easeread/web add <package-name>

# Add to api app
yarn workspace @easeread/api add <package-name>

# Add to shared package
yarn workspace @easeread/shared add <package-name>

# Add dev dependency
yarn workspace @easeread/web add -D <package-name>
```

To add a dependency to the root (e.g., shared dev tools):

```bash
yarn add -D <package-name> -W
```

## 📝 License

Private project - All rights reserved.
