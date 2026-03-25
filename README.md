# SDKForge 🛠️

[![npm version](https://badge.fury.io/js/@sdkforge%2Fcli.svg)](https://www.npmjs.com/package/@sdkforge/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Generate production-ready Clean Architecture SDKs from OpenAPI & Postman contracts.**

sdkforge automatically generates:
- DTO layer
- Domain layer
- Zod validators
- Mappers
- Repository layer
- Service layer
- HTTP client
- Error handling
- Shared types
- React / Angular / Vue / Nest adapters

*Zero Dependencies. Framework Agnostic. Pure Clean Architecture.*

## Why SDKForge?
Modern frontends often suffer from tightly coupled API layers, loose typings, and scattered fetch logic. **SDKForge** acts as a compiler that reads your backend contracts (`openapi.yaml`, `postman.json`) and instantly scaffolds a hyper-modular, robust SDK utilizing the **Clean Architecture** pattern.

- ✅ **Strict Separation of Concerns**: Isolates DTOs from Domain models strictly.
- ✅ **Runtime Safety**: Generates exact `Zod` validators enforcing API payload compliance before business logic mappings.
- ✅ **Result Pattern Execution**: Safely catches native HTTP errors, translating them into strongly typed `DomainError` bounds returning unified `Result<T>` records. No more raw `try/catch` UI clutter.
- ✅ **Plugin Extractor Ecosystem**: Natively generates React-Query, SWR, Vue, Angular, and Nest caching logic mapped gracefully against the structured Services leveraging isolated NPM workspaces!

## Installation
The tooling is split into a massively scalable Monorepo. You only need to install the CLI and the specific framework plugins you actually use in your project.

```bash
npm install -D @sdkforge/cli @sdkforge/react
# or execute directly
npx @sdkforge/cli init
```

## Quick Start
1. **Initialize Configuration**:
```bash
npx @sdkforge/cli init
```

2. **Generate your SDK Compiler**:
```bash
# Generate SDK from OpenAPI mapped directly to React-Query Hooks natively
npx @sdkforge/cli generate -i ./openapi.yaml -o ./src/api --plugin react

# Generate SDK from Postman Collection with SWR hooks alongside Watch-Mode
npx @sdkforge/cli generate -i ./postman.json -o ./src/api --plugin swr --watch
```

## The Abstract Architecture Output
Running the compiler against a standard `openapi.yaml` parses structural endpoints natively routing dependencies cleanly:

```text
src/api/
├── index.ts                     ← Top-level barrel export!
├── adapters/
│   └── react/
│       ├── useProductsQuery.ts  ← Framework injected UI bindings
│       └── useUsersQuery.ts     
└── core/
    ├── client/                  ← Axios/Fetch HTTP abstractions
    ├── domain/                  ← Immutable camelCase models (native JS Dates)
    ├── dto/                     ← Exact snake_case JSON interface definitions
    ├── errors/                  ← Standardized DomainError dictionary translators
    ├── mappers/                 ← Logic parsing primitives securely evaluating undefined fallback
    ├── repository/              ← Pure abstraction network API requests
    ├── services/                ← Extracted logic calling Validators & safely mapping Result patterns
    ├── types/                   
    └── validators/              ← Native Zod boundary schema constraints mapped natively
```

## Seamless Implementation
Because of the deep recursive nested barrel files (`index.ts`), building upon the compiled SDK is remarkably clean directly replacing scattered hooks natively:

```tsx
import { useUsersQuery } from "@/api";

export function UsersList() {
  const { data: result, isLoading } = useUsersQuery();

  if (isLoading) return <Spinner />;

  // The native Service Layer gracefully intercepted the network exceptions wrapping them exactly
  if (!result.success) {
     return <ErrorAlert message={result.error.message} />;
  }

  // Strict Domain array definitions mapped purely!
  return (
    <ul>
      {result.data.map(user => (
         <li key={user.id}>{user.profile.firstName} joined at {user.createdAt.getFullYear()}</li>
      ))}
    </ul>
  );
}
```

## Configuration (`sdkforge.config.json`)
Gain isolated CLI configuration rules dictating global suffix scopes cleanly bridging codebase conventions:

```json
{
  "input": "openapi.yaml",
  "output": "src/api",
  "client": "axios",
  "naming": {
    "dtoSuffix": "DTO",
    "serviceSuffix": "ApiService",
    "repositorySuffix": "Repository"
  },
  "wrapResponse": true,
  "adapters": ["react", "swr"]
}
```
- **`wrapResponse`**: Set to `true` if your APIs wrap endpoints completely inside `{ data: T, meta: ... }` parameters.
- **`naming`**: Forces EJS abstractions defining types accurately (`UserDTO`, `UserApiService`).

## Plugin Organization Architecture
SDKForge operates internally as a pure mono-repository natively tracking completely decoupled plugins. When you pass `--plugin react`, your CLI safely dynamically imports `@sdkforge/react` from your `node_modules`.

Available officially maintained packages:
- `@sdkforge/cli` *(Core runtime)*
- `@sdkforge/core` *(Parser Engine bounds)*
- `@sdkforge/react`
- `@sdkforge/swr`
- `@sdkforge/vue`
- `@sdkforge/angular`
- `@sdkforge/nest`

## Compiler Commands Reference

- `npx @sdkforge/cli init` - Scaffolds the runtime framework structure.
- `npx @sdkforge/cli clean` - Tears down the mapped `.src/api` outputs safely.
- `npx @sdkforge/cli generate [options]`:
  - `-i, --input <path>` (Evaluates OpenAPI / Postman arrays)
  - `-o, --output <dir>` (Native root output target)
  - `--plugin <name...>` (Inject adapter variables natively evaluating `react`, `vue`, or `swr`)
  - `--watch` (Monitors local API abstractions constantly forcing SDK parity regenerations)
  - `--dry-run` (Spits isolated cache IO outputs predicting pipeline generation behavior securely)
