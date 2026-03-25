# Bugfix Requirements Document

## Introduction

Two bugs exist in the `@sdkforge/core` code generation package:

1. **DTO file naming inconsistency**: The `DTOGenerator` hardcodes `.dto.ts` as the file suffix regardless of the `config.naming.dtoSuffix` value. This means DTO files always get a `.dto` segment in their filename even when the suffix is empty or unconfigured — breaking naming consistency for users who invoke the engine directly without a CLI-generated config file.

2. **Missing `forceAny` option in mappers**: The mapper template unconditionally emits `undefined as any` and `} as any` type casts. There is no configuration option to control this behavior, so users who want strict typing cannot opt out of the forced `any` casts, and users who want explicit `any` everywhere have no documented way to enable it intentionally.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the engine is invoked with `config.naming.dtoSuffix` set to `""` (empty string) THEN the system generates DTO files named `<entity>.dto.ts` instead of `<entity>.ts`

1.2 WHEN the engine is invoked without a CLI-generated config file (i.e. `dtoSuffix` defaults to `""`) THEN the system appends `.dto` to every DTO filename unconditionally

1.3 WHEN a mapper file is generated THEN the system always emits `undefined as any` for optional field fallbacks regardless of any configuration

1.4 WHEN a mapper file is generated THEN the system always emits `} as any` on the return object cast regardless of any configuration

1.5 WHEN `config.naming.forceAny` is not defined in `EngineConfig` THEN the system provides no mechanism to control `any` type casting in mapper output

### Expected Behavior (Correct)

2.1 WHEN `config.naming.dtoSuffix` is `""` (empty string) THEN the system SHALL generate DTO files named `<entity>.ts` without any `.dto` segment in the filename

2.2 WHEN `config.naming.dtoSuffix` is `"DTO"` THEN the system SHALL generate DTO files named `<entity>.dto.ts` (preserving existing CLI-configured behavior)

2.3 WHEN `config.naming.dtoSuffix` is any non-empty string THEN the system SHALL derive the file suffix from that value (lowercased and dot-separated) rather than using a hardcoded `.dto`

2.4 WHEN `config.naming.forceAny` is `true` THEN the system SHALL emit `undefined as any` for optional field fallbacks and `} as any` on the mapper return object

2.5 WHEN `config.naming.forceAny` is `false` or not set THEN the system SHALL emit `undefined` for optional field fallbacks and omit the `as any` cast on the mapper return object

2.6 WHEN `EngineConfig` is defined THEN the system SHALL expose an optional `forceAny` property under `config.naming` to allow callers to control type casting behavior

### Unchanged Behavior (Regression Prevention)

3.1 WHEN `config.naming.dtoSuffix` is `"DTO"` (as set by `sdkforge init`) THEN the system SHALL CONTINUE TO generate DTO files with the `.dto.ts` extension

3.2 WHEN the DTO template renders interface or type names THEN the system SHALL CONTINUE TO append `config.naming.dtoSuffix` to the TypeScript type name (e.g. `UserDTO`)

3.3 WHEN the mapper template imports from the DTO directory THEN the system SHALL CONTINUE TO use the correct filename that matches the generated DTO file

3.4 WHEN `config.naming.forceAny` is `true` THEN the system SHALL CONTINUE TO produce compilable TypeScript mapper files with `any` casts as before

3.5 WHEN fields with `ref` or `Date` types are mapped THEN the system SHALL CONTINUE TO generate the correct mapping logic regardless of the `forceAny` setting
