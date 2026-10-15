# Prompt to give your coding agent

Copy everything below the line into your agent, started in an **empty directory** that will become the app. Replace
`<PLAN>` with the path to this guide (for example `../ledgerline-guide`).

---

You are building **Ledgerline**, a production-quality, local-first sales dashboard, from scratch in the current empty
directory. The product specification, architecture, build plan and test plan are in the guide at `<PLAN>`. No code is
provided: you design and write every file yourself, meeting the specs exactly.

Run this once in every shell you use: `export PLAN=<PLAN>` (an absolute path is best).

Rules:

1. Read these first, in order: `$PLAN/AGENTS.md`, `$PLAN/TODO.md`, `$PLAN/ARCHITECTURE.md`,
   `$PLAN/docs/spec/09-Gotchas.md`. Read each spec in full when `TODO.md` points to it, before you write that
   phase's code.
2. Execute `TODO.md` phase by phase. After each phase, run its **Gate** and compare the results with the expected
   values. Do not start the next phase until the gate passes. On failure, find and fix the root cause. Never weaken,
   skip or delete tests or gate checks to make them pass.
3. The specs are binding: names of routes, tables, columns, scripts, environment variables, JSON fields, UI copy,
   error messages, limits and formulas must match them exactly. Where a spec does not decide something, choose the
   simplest option that satisfies every requirement and test, and note the choice in your final report.
4. Use the exact versions in `docs/spec/02-Environment-and-Stack.md` and Node **24** LTS with pnpm **11**. If
   `node -v` is not v24, stop and tell the user.
5. This is Next.js **16** with Cache Components. It differs from older Next.js (async params, `connection()`,
   prerendered client components). When unsure, read `node_modules/next/dist/docs/` in the app instead of relying on
   memory. The same applies to TanStack Table v9 (`node_modules/@tanstack/react-table/skills/`), Zod 4 and
   Tailwind 4.
6. Write the tests listed in `docs/spec/07-Testing.md` in the phase that introduces the code they cover. They are the
   acceptance spec.
7. Never write demo data into a database implicitly. Never commit a database. Tests and gates use temporary
   databases only (`SALES_DB_PATH=.tmp/...`).
8. Add no features, abstractions or dependencies beyond the specs.
9. Redirect long command output (tests, builds) to a log file under `.tmp/` and read the summary lines.
10. When finished, run the **Final acceptance** checklist at the end of `TODO.md` and report: what you built, every
    command you ran with its result, and every decision or deviation with the reason.
