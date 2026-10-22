# Mandatory confirmation: legacy write boundary

22 October 2026, Preview only. This fixes a server-side bypass in the existing
captain-confirmation task; it does not introduce another tournament format.

## Defect and behavior

With `require_confirmation=true`, the engine required two captain confirmations or a
reasoned referee decision, but the old `hub_action/create_match` path could still
create a manual match. Manual results do not have the engine's confirmed-report flow.

Migration `20261022105700_require_engine_for_confirmed_results.sql` adds a trigger
blocking manual match inserts/updates whenever mandatory confirmation is enabled.
These events use the existing engine and match reports. The guard also protects
`hub_action/finish_match`; API calls cannot bypass it by choosing the legacy endpoint.
Events with the flag off retain their existing organizer-only manual behavior.
Historical rows are not rewritten. No settings, participants or results were changed.

The trigger takes the existing tournament lock. Its SECURITY DEFINER function has an
empty search_path and no anon/authenticated EXECUTE privilege. Existing RLS is preserved.
The API returns a narrow actionable error; the existing UI explains it in RU/EN.

## Verified

- Before the fix, the isolated SQL test reproduced the missing rejection.
- 15 isolated SQL checks passed: RPC/direct insert and update denial, finished-score
  preservation, manual opt-out behavior, launch lock, internal ACL, RLS and rollback.
- 17 engine/report SQL checks passed with the new guard loaded: dual confirmation,
  dispute, independent referee, corrections, scoped roles and audit remain functional.
- 217 automated tests passed. New route tests: 1 FAIL/1 PASS before, 2 PASS after.
- TypeScript, ESLint changed files, Next webpack build and diff check passed.
- Hosted/local schema: 324 records match the read-only snapshot in
  `docs/checks/2026-10-22-confirmation-boundary-schema.json`.
- No tournaments had the mandatory flag on before application. Security advisor
  counts are unchanged from the preceding auto-admission migration.
- Sources/tests/schema through `9fd6bb3d45e12e863b0bc0f9f775378b3a264591`:
  ten files byte-identical to GitHub; this Preview is Ready in Vercel.
- Browser https://deafhub-9efm4b3y5-ionas-projects-019510f8.vercel.app/tournaments:
  EN/RU guest screen and admission API guest denial checked. Authorized interaction
  with actual player/captain/organizer accounts remains unverified.

```sh
DEAFHUB_PGLITE_PATH=/path/to/node_modules/@electric-sql/pglite node scripts/local-legacy-confirmation-check.mjs
DEAFHUB_PGLITE_PATH=/path/to/node_modules/@electric-sql/pglite node scripts/local-results-sql-check.mjs
```

All fixture writes were confined to isolated PostgreSQL and rolled back. Main,
production, global Auth settings, approved design and finances were not changed.
