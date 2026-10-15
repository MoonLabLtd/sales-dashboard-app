# AGENTS.md

Guidance for any coding agent (Claude Code, Codex, Cursor, Gemini CLI, Aider, …) working from this repository.

## Project Overview

**Ledgerline** is a local-first, single-user sales dashboard: a Next.js 16 (App Router) full-stack app on SQLite via
Drizzle + better-sqlite3. One person records sales, products and customers on their own machine and gets KPIs,
charts, insights, analytics and CSV exports. There is no authentication, no cloud, no FX conversion and no inventory
tracking.

This repository holds the **specification and build plan**. The app is built in a separate, empty directory by
following [`TODO.md`](TODO.md).

## Authoritative Sources

Read in this order before doing any work:

1. **`TODO.md`**: the ordered build plan with gates. This is what you execute.
2. **`docs/spec/07-Testing.md`**: the test plan. Every listed case must exist and pass; the tests are the executable
   acceptance spec.
3. **`docs/spec/01–06, 08`**: the binding specification (product, stack, domain rules, data model, API, frontend,
   operations).
4. **`docs/spec/09-Gotchas.md`**: pitfalls of this stack. Read before coding.
5. **`docs/spec/10-Requirements-Traceability.md`**: requirement → module → proof. Use it as the final checklist.
6. Root `ARCHITECTURE.md` (architecture and decisions) and `README.md` (blueprint, prerequisites).

To look up a specific fact (a route, a table, a token, a test case), use [`docs/spec/README.md`](docs/spec/README.md).

**Conflict rule:** test plan (07) → domain rules (03) → data model (04) → backend/API (05) → frontend (06) → product
spec (01) → `ARCHITECTURE.md` → `README.md`. The more specific, lower-level document wins. Record any conflict you
resolve in your final report.

## Current State

- Greenfield. No code exists yet; the app directory starts empty.
- All architecture decisions are closed (see `ARCHITECTURE.md`, Appendix A). Do not reopen them.
- Your job is implementation and verification against the specs, not product design.

## Technology Direction

| Layer | Choice (exact versions in `docs/spec/02-Environment-and-Stack.md`) |
| --- | --- |
| Runtime | Node.js **24 LTS**, pnpm **11** (`packageManager: pnpm@11.22.0`) |
| Framework | Next.js **16.4.0** App Router, Turbopack, `cacheComponents: true`, Node runtime only |
| UI | React 19.3, Tailwind CSS 4 (CSS-first), shadcn/ui 4 (`radix-nova` preset), lucide-react, Recharts 3, Geist font |
| Client state | TanStack Query 5 (server state); Zustand 5 (UI preferences and sale-sheet state only) |
| Forms & validation | React Hook Form 7 + Zod 4; schemas shared by client and server |
| Tables | TanStack Table **9** (new `useTable` API), server-side paging/sorting/filtering |
| Data | SQLite (WAL) via **better-sqlite3 13** + **Drizzle ORM 0.45**; SQL migrations in `drizzle/` |
| Testing | Vitest 5 (unit + integration on temporary DBs), Playwright 1.64 (Chromium e2e) |
| Quality | TypeScript 6 strict, ESLint 9 (eslint-config-next), Prettier 3 |

## Design Principles

- **The server is the source of truth.** Every rule is enforced in services and route handlers. Client validation is
  a convenience only.
- **Money is integer minor units** everywhere, formatted only at the edge with `Intl.NumberFormat`.
- **History is immutable.** Sale lines snapshot product name, category, price and cost. Nothing that would erase
  history cascades.
- **Status drives metrics.** Revenue counts completed sales only, net of discounts, excluding tax. A refund is a full
  status change, so refunds can never be double counted.
- **Zero config, local first.** The DB path resolves from the project root, and the DB is created and migrated on
  the first request, never at build time.
- **Demo data is explicit and tagged** (`is_demo`, `DEMO-` refs) and is never loaded silently.

## Standards

- CSV: UTF-8 with BOM, CRLF, RFC 4180 quoting, formula-injection escaping, amounts in major units.
- Dates: half-open `[from, to)` epoch-ms ranges, local-time day buckets, weeks starting Monday.
- Accessibility: WCAG 2.2 AA intent. Labelled controls, keyboard operable, one `main` and one `h1` per page, skip
  link, `prefers-reduced-motion` respected.

## Key External Dependencies

| Dependency | Needed for | Failure mode |
| --- | --- | --- |
| npm registry | `pnpm install`, `pnpm dlx` scaffolding | no network: install fails |
| better-sqlite3 prebuilt binaries | native SQLite driver | no matching prebuild: a C/C++ toolchain is needed (README §6) |
| Playwright Chromium download (~200 MB) | e2e tests only | run `pnpm test:e2e:install` once |

## Working Conventions

- Follow `TODO.md` in order. **Never skip a gate.** A gate passes only when the actual output matches the expected
  result.
- Read the specs a phase points to **before** writing its code, and re-check the phase's requirements afterwards.
- Pin exact versions as specified. Run each scaffolding command (create-next-app, shadcn) once, as specified, and
  then edit the result as the specs require.
- Write tests together with the code they cover, never after the gate.
- Use Node 24 for every command. If the shell defaults to another major, put Node 24 first on `PATH` in every shell.
- Use temporary DBs (`SALES_DB_PATH=.tmp/<name>/sales.db`) for every gate and delete them afterwards. `data/` is the
  user's real data.
- Stop every background server you start before finishing.
- Never commit or push unless the user asks.
- In the final report, separate **verified** (command run, output seen) from **not verified**.
