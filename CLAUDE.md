# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # start dev server on :3000
pnpm build        # production build
pnpm typecheck    # tsc --noEmit
pnpm check        # biome check --write (lint + format, auto-fixes)
pnpm lint         # biome lint (check only)
pnpm test         # vitest run (all tests)
```

## Testing

**Runner:** Vitest. Test files live next to the code they test: `foo.test.ts` beside `foo.ts`.

**Style:** BDD — `describe` blocks state the context, `it` blocks state the expected behavior:
```ts
describe('getMonthRange', () => {
  describe('when the start day exceeds February length', () => {
    it('should clamp day 31 to Feb 28 in a non-leap year', () => { ... })
  })
})
```

Use `describe('when <condition>')` for grouping and `it('should <behaviour>')` for individual assertions. Never use imperative phrasing like `it('returns X')` or `it('clamps the day')`.

## Import paths

Always use the `@/` alias (mapped to `./src/`):

```ts
import { cn } from '@/lib/utils'
```

## Stack

TanStack Start (SSR) + TanStack Router (file-based) + TanStack Query · React 19 · Tailwind CSS 4 · shadcn/ui (`@base-ui/react` primitives) · Biome · react-hook-form + Zod v4 · Recharts

## Data model

- `Expense` — signed `amount` (negative = expense, positive = income), `categoryId`, optional `recurringId`
- `Category` — `{ id, name, color }`
- `Config` — `{ categories, currency, startDate }` (fiscal month start day)
- `RecurringExpense` — template for auto-generated expenses

IDs follow `<prefix>_<ULID>` convention (`exp_`, `cat_`, `rec_`).

## Architecture rules

- **Storage** — access data only through the `StorageAdapter` interface; never read JSON files directly
- **Server functions** — use `createServerFn` wrappers as the RPC layer; validate with Zod schemas
- **Schemas** — two per domain: storage schema (signed amounts) and form schema (positive amount + `isIncome` toggle). Derive the form schema from the storage schema via `.omit().extend()` — don't duplicate fields
- **Routes** — each route pre-fetches data in its `loader` via `queryClient.ensureQueryData`
- **Client state** — use TanStack Query for server state; mutations must invalidate relevant query keys
- **Shared types** — enum types go in `src/lib/shared/types/`

## UI conventions

- `src/components/ui/` — shadcn/ui primitives, **not linted by Biome**. Don't modify them.
- `Select.Value` requires a render-function to display programmatically set values (items register lazily via portal): `<SelectValue>{(value) => lookup(value)}</SelectValue>`
- Use `cn()` for conditional Tailwind classes; `randomColor()` for random hex colors — don't duplicate these utilities.
- Array type syntax: `Array<T>` not `T[]` (Biome `useConsistentArrayType` rule)
- Tailwind classes must be sorted (Biome `useSortedClasses`, auto-fixed by `pnpm check`)

## Zod rules

- Use `z.enum(...)` — `z.nativeEnum` is deprecated in Zod v4. To use a TypeScript enum with Zod: `z.enum(Object.values(MyEnum) as [MyEnum, ...Array<MyEnum>])`

## Known workarounds

- `zodResolver(schema as any)` — required due to hookform/resolvers#842 (Zod v4 minor version mismatch)
