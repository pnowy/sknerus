# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # start dev server on :3000
pnpm build        # production build
pnpm typecheck    # tsc --noEmit (run after every change)
pnpm check        # biome check --write (lint + format, auto-fixes)
pnpm lint         # biome lint (check only)
pnpm test         # vitest run (all tests)
```

Always run `pnpm typecheck && pnpm check` before finishing a task.

## Testing

**Runner:** Vitest with a dedicated `vitest.config.ts` (uses only `vite-tsconfig-paths`, not the full Vite/TanStack Start config). Test files live next to the code they test: `foo.test.ts` beside `foo.ts`.

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

Always use the `@/` alias (mapped to `./src/` via `vite-tsconfig-paths`):

```ts
import { storage } from '@/lib/server/storage'
import type { Expense } from '@/lib/shared/types/expense'
import { cn } from '@/lib/utils'
```

## Architecture

**Stack:** TanStack Start (SSR, Nitro) + TanStack Router (file-based) + TanStack Query · React 19 · Tailwind CSS 4 · shadcn/ui (base-nova, `@base-ui/react` primitives) · Biome linter · react-hook-form + Zod v4 · Recharts

### Data model (`src/lib/shared/types/expense.ts`)

- `Expense` — signed `amount` (negative = expense, positive = income), `categoryId` (FK to `Category.id`), optional `recurringId`
- `Category` — `{ id, name, color }`, IDs are `cat_<ULID>`
- `Config` — `{ categories, currency, startDate }` (fiscal month start day)
- `RecurringExpense` — template for auto-generated expenses; `frequency` + optional day/week/month fields

IDs follow `<prefix>_<ULID>` convention (`exp_`, `cat_`, `rec_`). Generators live in `src/lib/server/ids.server.ts`.

### Storage layer (`src/lib/server/storage/`)

`StorageAdapter` interface in `types.ts` with methods: `getExpenses/saveExpenses`, `getConfig/saveConfig`, `getRecurring/saveRecurring`. `JsonAdapter` implements it with three JSON files under `.data/` (configurable via `DATA_DIR` env var). Factory in `index.ts` selects the adapter via `STORAGE_TYPE` env var (currently only `"json"`).

### Server functions (`src/lib/server/functions/`)

TanStack Start `createServerFn` wrappers — thin RPC layer over `storage`. Each file groups by domain: `expenses.ts`, `config.ts`, `recurring.ts`. Validators use Zod schemas from `src/lib/schemas.ts`.

### Schemas (`src/lib/schemas.ts`)

Two schemas per domain: the **storage schema** (signed amounts, no extra UX fields) and the **form schema** (positive amount + `isIncome` boolean toggle). Form schema is derived from storage schema via `.omit().extend()` — don't duplicate fields.

Known workaround: `zodResolver(schema as any)` — required due to hookform/resolvers#842 (Zod v4 minor version mismatch).

### Routing & data loading (`src/routes/`)

File-based routes: `__root.tsx`, `index.tsx` (dashboard), `table.tsx`, `settings.tsx`. Each route has a `loader` that pre-fetches via `queryClient.ensureQueryData`. Root route loader runs `materializeRecurring()` once per session to auto-generate any due recurring expenses.

### Client state

- **TanStack Query** — server state cache; hooks in `src/hooks/use-expenses.ts` wrap all server functions. Mutations invalidate relevant query keys.
- **MonthNavContext** (`src/contexts/month-nav-context.tsx`) — shared selected month/year across tabs; provided at root level in `__root.tsx`.

### Recurring expenses

`RecurringExpense` records are templates stored in `recurring.json`. `materializeRecurring()` (called in root loader) computes due dates via `computeOccurrences()` in `src/lib/shared/date-utils.ts`, then creates `Expense` rows with `recurringId` set. Deduplication key: `recurringId:date`. Generated expenses appear in the table with a `Repeat` icon.

### UI conventions

- `src/components/ui/` — shadcn/ui primitives, **not linted by Biome** (see `biome.json` excludes). Don't modify them.
- `Select.Value` requires a render-function `children` to display the label of a programmatically set value (items register lazily via portal): `<SelectValue>{(value) => lookup(value)}</SelectValue>`
- `cn()` from `src/lib/utils.ts` for conditional Tailwind classes; `randomColor()` for random hex colors — use these, don't duplicate.
- Array type syntax: `Array<T>` not `T[]` (Biome `useConsistentArrayType` rule).
- Tailwind classes must be sorted (Biome `useSortedClasses` rule, auto-fixed by `pnpm check`).

### Shared utilities (`src/lib/shared/`)

- `date-utils.ts` — `filterExpensesByMonth`, `todayISO`, `toUTC`, `toISO`, `daysInMonth`, `computeOccurrences`
- `format.ts` — `formatCurrency`, `formatDate`
- `csv.ts` — CSV export (resolves `categoryId` → name) and import (matches name → id, creates new categories with `randomColor()`)