# DTO Naming and Mapper forceAny Fix — Bugfix Design

## Overview

Two bugs exist in `@sdkforge/core`:

1. `DTOGenerator` hardcodes `.dto.ts` as the file suffix regardless of `config.naming.dtoSuffix`, so users who set an empty or custom suffix still get `.dto` in every DTO filename.
2. `mapper.ejs` unconditionally emits `undefined as any` and `} as any` casts with no configuration knob to suppress them, preventing strict-typing users from opting out.

The fix introduces a shared `getDtoFileSuffix` helper to derive the filename segment from `dtoSuffix`, adds `forceAny?: boolean` to `EngineConfig.naming`, and updates all four templates that hardcode the `.dto` import path segment.

---

## Glossary

- **Bug_Condition (C)**: The set of inputs that trigger defective output — either a `dtoSuffix` value that does not produce `.dto` (Bug 1) or a `forceAny` value of `false`/`undefined` (Bug 2).
- **Property (P)**: The desired correct behavior for those inputs — filename matches the derived suffix; `as any` casts are absent when `forceAny` is not `true`.
- **Preservation**: Existing behavior that must not regress — `dtoSuffix: "DTO"` still produces `.dto.ts` files; `forceAny: true` still emits the casts; DTO type names still use `dtoSuffix`; mapping logic for `ref`/`Date` fields is unchanged.
- **`getDtoFileSuffix(dtoSuffix)`**: New shared helper in `dto.generator.ts` that converts a `dtoSuffix` string to the filename segment (e.g. `"DTO"` → `".dto"`, `""` → `""`).
- **`DTOGenerator`**: Class in `packages/core/src/generators/dto/dto.generator.ts` that writes one DTO file per entity.
- **`EngineConfig`**: Interface in `packages/core/src/core/engine/generator.ts` that defines all engine configuration options.
- **`forceAny`**: New optional boolean under `EngineConfig.naming` that controls whether `as any` casts are emitted in mapper output.

---

## Bug Details

### Fault Condition

**Bug 1 — DTO filename:**
The bug manifests when `DTOGenerator.generate()` is called with any `dtoSuffix` value other than `"DTO"`. The `fileName` is constructed with a hardcoded `.dto` segment, so the suffix configuration is silently ignored for the filename (though it is correctly used for the TypeScript type name inside the file).

```
FUNCTION isBugCondition_naming(config)
  INPUT: config of type EngineConfig
  OUTPUT: boolean

  dtoSuffix := config.naming?.dtoSuffix ?? ""
  RETURN getDtoFileSuffix_current(dtoSuffix) !== ("." + dtoSuffix.toLowerCase())
         -- i.e. the current code always returns ".dto" regardless of dtoSuffix
END FUNCTION
```

**Bug 2 — Mapper `as any` casts:**
The bug manifests whenever a mapper file is generated and `config.naming.forceAny` is `false` or `undefined`. The template unconditionally emits `as any` casts with no branch on any config value.

```
FUNCTION isBugCondition_forceAny(config)
  INPUT: config of type EngineConfig
  OUTPUT: boolean

  RETURN (config.naming?.forceAny !== true)
         AND mapperOutputContains("as any")
         -- currently always true because template has no conditional
END FUNCTION
```

### Examples

- `dtoSuffix: ""` → current output: `user.dto.ts` | expected: `user.ts`
- `dtoSuffix: "Model"` → current output: `user.dto.ts` | expected: `user.model.ts`
- `dtoSuffix: "DTO"` → current output: `user.dto.ts` | expected: `user.dto.ts` ✓ (no regression)
- `forceAny: false`, Date field → current output: `createdAt: dto.created_at ? new Date(dto.created_at) : undefined as any,` | expected: `... : undefined,`
- `forceAny: false`, return object → current output: `} as any;` | expected: `};`
- `forceAny: true` → output unchanged from current (preservation)

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- When `dtoSuffix` is `"DTO"`, DTO files must continue to be named `<entity>.dto.ts`
- DTO template type names (e.g. `UserDTO`) must continue to use `config.naming.dtoSuffix` unchanged
- When `forceAny` is `true`, mapper output must continue to include `undefined as any` and `} as any`
- Mapping logic for `ref` and `Date` fields (the `new Date(...)` and `map*ToDomain(...)` calls) must be unaffected by the `forceAny` setting
- All template import paths must continue to resolve to the actual generated DTO filename

**Scope:**
All inputs where `dtoSuffix === "DTO"` and `forceAny === true` are non-buggy and must produce identical output to the current code. Any entity shape, endpoint count, or field type combination must continue to work correctly after the fix.

---

## Hypothesized Root Cause

1. **Hardcoded string literal in `DTOGenerator`**: `dto.generator.ts` line 10 constructs the filename as `` `${snakeCase(entity.name)}.dto.ts` `` — the `.dto` segment is a string literal, not derived from config. The developer likely wrote this before `dtoSuffix` was introduced and never updated it.

2. **No config branch in `mapper.ejs`**: The template was written assuming `as any` casts are always needed to satisfy TypeScript when spreading a DTO onto a domain object. No conditional was added because `forceAny` did not exist in `EngineConfig` at the time.

3. **Missing `forceAny` in `EngineConfig`**: The interface was never extended with this property, so even if a caller sets `config.naming.forceAny = false`, the template has no way to read it.

4. **Cascading hardcoded import paths in templates**: `mapper.ejs`, `repository.ejs`, and `service.ejs` all import from `"../dto/<%= snakeCase(entity.name) %>.dto"` — the `.dto` segment is again a literal, not derived from config. These were written in sync with the original generator but were not updated when `dtoSuffix` became configurable.

---

## Correctness Properties

Property 1: Fault Condition — DTO filename derived from dtoSuffix

_For any_ `dtoSuffix` value (including empty string and arbitrary non-empty strings), the fixed `DTOGenerator` SHALL generate a DTO filename whose suffix segment equals `getDtoFileSuffix(dtoSuffix)` — specifically, an empty `dtoSuffix` SHALL produce `<entity>.ts` with no `.dto` segment.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Fault Condition — Mapper omits `as any` when forceAny is not true

_For any_ entity shape where `config.naming.forceAny` is `false` or `undefined`, the fixed `mapper.ejs` SHALL NOT emit `undefined as any` for optional field fallbacks and SHALL NOT emit `} as any` on the return object.

**Validates: Requirements 2.4, 2.5**

Property 3: Preservation — dtoSuffix "DTO" continues to produce .dto.ts files

_For any_ entity where `config.naming.dtoSuffix` is `"DTO"` (the default CLI-generated value), the fixed `DTOGenerator` SHALL continue to produce files named `<entity>.dto.ts`, identical to the current behavior.

**Validates: Requirements 3.1**

Property 4: Preservation — Template import paths match generated DTO filename

_For any_ `dtoSuffix` value, the import paths emitted by `mapper.ejs`, `repository.ejs`, and `service.ejs` SHALL reference `"../dto/<snakeCase(entity)><getDtoFileSuffix(dtoSuffix)>"`, matching the actual filename produced by `DTOGenerator`.

**Validates: Requirements 3.3**

Property 5: Preservation — ref/Date mapping logic unaffected by forceAny

_For any_ entity with `ref` or `Date` fields, the fixed `mapper.ejs` SHALL emit the correct `new Date(...)` and `map*ToDomain(...)` mapping expressions regardless of the `forceAny` setting.

**Validates: Requirements 3.5**

---

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File 1**: `packages/core/src/generators/dto/dto.generator.ts`

**Changes**:
1. Add `getDtoFileSuffix` helper function that converts `dtoSuffix` to a filename segment:
   - `""` or `undefined` → `""`
   - `"DTO"` → `".dto"`
   - `"Model"` → `".model"`
   - General rule: `"." + dtoSuffix.toLowerCase()`
2. Replace the hardcoded `fileName` construction with:
   ```ts
   const suffix = getDtoFileSuffix(this.context.config.naming?.dtoSuffix);
   const fileName = `${snakeCase(entity.name)}${suffix}.ts`;
   ```

---

**File 2**: `packages/core/src/core/engine/generator.ts`

**Changes**:
1. Add `forceAny?: boolean` to the `naming` block of `EngineConfig`:
   ```ts
   naming?: {
     dtoSuffix?: string;
     serviceSuffix?: string;
     repositorySuffix?: string;
     forceAny?: boolean;
   };
   ```

---

**File 3**: `packages/core/src/templates/mapper.ejs`

**Changes**:
1. Fix the DTO import path — replace the hardcoded `.dto` segment with a dynamic expression:
   ```ejs
   import { ... } from "../dto/<%= snakeCase(entity.name) %><%= config.naming?.dtoSuffix ? '.' + config.naming.dtoSuffix.toLowerCase() : '' %>";
   ```
2. Wrap `undefined as any` fallbacks in a conditional:
   ```ejs
   <% if (config.naming?.forceAny) { %>undefined as any<% } else { %>undefined<% } %>
   ```
3. Wrap the return object cast:
   ```ejs
   } <%= config.naming?.forceAny ? 'as any' : '' %>;
   ```

---

**File 4**: `packages/core/src/templates/repository.ejs`

**Changes**:
1. Fix the DTO import path — replace `.dto` literal with dynamic suffix expression (same pattern as mapper.ejs).

---

**File 5**: `packages/core/src/templates/service.ejs`

**Changes**:
1. Fix the DTO import path — replace `.dto` literal with dynamic suffix expression (same pattern as mapper.ejs).

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate both bugs BEFORE implementing the fix. Confirm or refute the root cause analysis.

**Test Plan**: Write unit tests that invoke `DTOGenerator` with `dtoSuffix: ""` and render `mapper.ejs` with `forceAny: false`, then assert the expected (correct) output. Run these on the UNFIXED code to observe failures.

**Test Cases**:
1. **Empty dtoSuffix filename test**: Invoke `DTOGenerator` with `dtoSuffix: ""` and assert the output file is named `user.ts` — will fail on unfixed code (produces `user.dto.ts`)
2. **Custom dtoSuffix filename test**: Invoke `DTOGenerator` with `dtoSuffix: "Model"` and assert the output file is named `user.model.ts` — will fail on unfixed code
3. **Mapper no-forceAny test**: Render `mapper.ejs` with `forceAny: false` and assert output does NOT contain `as any` — will fail on unfixed code
4. **Mapper import path test**: Render `mapper.ejs` with `dtoSuffix: ""` and assert the import path ends with `user"` not `user.dto"` — will fail on unfixed code

**Expected Counterexamples**:
- `DTOGenerator` produces `user.dto.ts` instead of `user.ts` when `dtoSuffix` is empty
- `mapper.ejs` output contains `as any` even when `forceAny` is `false`/`undefined`
- Possible causes: hardcoded string literal in generator, missing conditional in template, missing `forceAny` in `EngineConfig`

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed code produces the expected behavior.

**Pseudocode:**
```
FOR ALL config WHERE isBugCondition_naming(config) DO
  result := DTOGenerator_fixed(config)
  ASSERT filename(result) = snakeCase(entity.name) + getDtoFileSuffix(config.naming.dtoSuffix) + ".ts"
END FOR

FOR ALL config WHERE isBugCondition_forceAny(config) DO
  result := renderMapper_fixed(config)
  ASSERT NOT contains(result, "as any")
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed code produces the same result as the original.

**Pseudocode:**
```
FOR ALL config WHERE config.naming.dtoSuffix = "DTO" DO
  ASSERT DTOGenerator_original(config) = DTOGenerator_fixed(config)
END FOR

FOR ALL config WHERE config.naming.forceAny = true DO
  ASSERT renderMapper_original(config) = renderMapper_fixed(config)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because it generates many entity shapes and config combinations automatically, catching edge cases that manual tests miss.

**Test Cases**:
1. **dtoSuffix "DTO" regression**: Verify `DTOGenerator` with `dtoSuffix: "DTO"` still produces `user.dto.ts` after fix
2. **forceAny=true regression**: Verify `mapper.ejs` with `forceAny: true` still emits `undefined as any` and `} as any` after fix
3. **DTO type name regression**: Verify `dto.ejs` still renders `UserDTO` (type name) when `dtoSuffix: "DTO"` after fix
4. **ref/Date mapping regression**: Verify `mapper.ejs` still emits `new Date(...)` and `map*ToDomain(...)` for `Date`/`ref` fields regardless of `forceAny`
5. **Import path consistency**: Verify that for any `dtoSuffix`, the import path in all three templates matches the filename produced by `DTOGenerator`

### Unit Tests

- Test `getDtoFileSuffix("")` returns `""`
- Test `getDtoFileSuffix("DTO")` returns `".dto"`
- Test `getDtoFileSuffix("Model")` returns `".model"`
- Test `getDtoFileSuffix(undefined)` returns `""`
- Test `DTOGenerator` with `dtoSuffix: ""` produces `<entity>.ts`
- Test `DTOGenerator` with `dtoSuffix: "DTO"` produces `<entity>.dto.ts`
- Test `mapper.ejs` render with `forceAny: false` — no `as any` in output
- Test `mapper.ejs` render with `forceAny: true` — `as any` present in output
- Test `repository.ejs` import path matches `getDtoFileSuffix` output
- Test `service.ejs` import path matches `getDtoFileSuffix` output

### Property-Based Tests

- For any non-empty `dtoSuffix` string, `getDtoFileSuffix(dtoSuffix)` equals `"." + dtoSuffix.toLowerCase()`
- For any entity and any `dtoSuffix`, the import path in `mapper.ejs` output matches the filename produced by `DTOGenerator`
- For any entity with `Date`/`ref` fields and any `forceAny` value, the mapping expressions (`new Date`, `map*ToDomain`) are always present in `mapper.ejs` output

### Integration Tests

- Full generation run with `dtoSuffix: ""` — verify all generated files use consistent naming and imports resolve correctly
- Full generation run with `dtoSuffix: "DTO"` — verify no regression from current behavior
- Full generation run with `forceAny: false` — verify generated mapper compiles without `any` casts
- Full generation run with `forceAny: true` — verify generated mapper compiles with `any` casts as before
