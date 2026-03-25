# Tasks: DTO Naming and Mapper forceAny Fix

## Task List

- [x] 1. Add `getDtoFileSuffix` helper and fix DTO filename generation
  - [x] 1.1 Add `getDtoFileSuffix(dtoSuffix?: string): string` helper function to `dto.generator.ts` that returns `""` for empty/undefined input and `"." + dtoSuffix.toLowerCase()` for non-empty input
  - [x] 1.2 Replace the hardcoded `fileName` construction in `DTOGenerator.generate()` with `${snakeCase(entity.name)}${getDtoFileSuffix(this.context.config.naming?.dtoSuffix)}.ts`

- [x] 2. Add `forceAny` to `EngineConfig`
  - [x] 2.1 Add `forceAny?: boolean` to the `naming` block of the `EngineConfig` interface in `generator.ts`

- [x] 3. Fix `mapper.ejs` — import path and `as any` casts
  - [x] 3.1 Replace the hardcoded `.dto` segment in the DTO import path with a dynamic expression using `config.naming?.dtoSuffix`
  - [x] 3.2 Wrap `undefined as any` fallbacks for `Date` and `ref` fields in a conditional on `config.naming?.forceAny`
  - [x] 3.3 Wrap the `} as any` return object cast in a conditional on `config.naming?.forceAny`

- [x] 4. Fix DTO import paths in `repository.ejs` and `service.ejs`
  - [x] 4.1 Replace the hardcoded `.dto` segment in the DTO import path in `repository.ejs` with the same dynamic expression
  - [x] 4.2 Replace the hardcoded `.dto` segment in the DTO import path in `service.ejs` with the same dynamic expression

- [x] 5. Write exploratory tests (run against unfixed code to confirm root cause)
  - [x] 5.1 Write a unit test asserting `DTOGenerator` with `dtoSuffix: ""` produces a file named `<entity>.ts` — expect this to FAIL on unfixed code
  - [x] 5.2 Write a unit test asserting `mapper.ejs` rendered with `forceAny: false` does NOT contain `as any` — expect this to FAIL on unfixed code

- [x] 6. Write fix-checking and preservation tests
  - [x] 6.1 Write unit tests for `getDtoFileSuffix` covering `""`, `undefined`, `"DTO"`, and `"Model"` inputs
  - [x] 6.2 Write unit tests verifying `DTOGenerator` filename output for `dtoSuffix: ""`, `"DTO"`, and `"Model"`
  - [x] 6.3 Write unit tests verifying `mapper.ejs` output for `forceAny: true` (casts present) and `forceAny: false`/`undefined` (casts absent)
  - [x] 6.4 Write a property-based test: for any non-empty `dtoSuffix` string, `getDtoFileSuffix(dtoSuffix)` equals `"." + dtoSuffix.toLowerCase()`
  - [x] 6.5 Write a property-based test: for any entity and any `dtoSuffix`, the DTO import path in `mapper.ejs` output matches the filename produced by `DTOGenerator`
  - [x] 6.6 Write a property-based test: for any entity with `Date`/`ref` fields and any `forceAny` value, the mapping expressions (`new Date`, `map*ToDomain`) are always present in `mapper.ejs` output
  - [x] 6.7 Write regression tests verifying `dtoSuffix: "DTO"` still produces `<entity>.dto.ts` (preservation of existing CLI behavior)
  - [x] 6.8 Write regression tests verifying `repository.ejs` and `service.ejs` import paths match the `DTOGenerator` filename for any `dtoSuffix`
