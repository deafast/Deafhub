# Automatic admission — Preview

22 October 2026. This completes the automatic admission subtask; it does not claim
the complete authenticated tournament acceptance test.

## Behavior

- Off by default. No existing tournament is enabled by this migration.
- Before launch, only the tournament's current organizer with the organizer role
  can enable or disable it. A reason and an audit record are required.
- Enabling processes existing pending entries. Later eligibility reviews and personal
  confirmations recheck the corresponding entry in the same transaction.
- Admission requires a complete registered snapshot roster, current tournament and
  participation rule versions, a positive review by the current organizer, and every
  personal confirmation required by the policy. A player's confirmation never
  replaces the human review. Rejected entries are never reopened automatically.
- Disabling stops future automatic approvals; it does not revoke existing approvals.
  Check-in remains a separate launch condition. No automatic forfeits are added.
- Settings freeze when an engine or legacy manual match exists, or the event finishes.

## Implementation and security

- `app/api/tournament-admission/route.ts`: verified Supabase user, UUID/body validation,
  same-origin mutation, private/no-store responses, narrow RPC and safe errors.
- `components/hub/TournamentAutoAdmission.tsx`: existing Operations section, RU/EN,
  owner-only settings form, loading/error/401 states, 44px controls and parent refresh.
- `supabase/migrations/20261022104233_auto_admission.sql`: RLS table, authenticated
  SELECT only, organizer-checked RPC, internal helpers without user EXECUTE grants,
  empty search_path, tournament lock, version checks and auditable decisions.
- The auto-admission audit records the actual action actor and the organizer who
  reviewed eligibility. No client-submitted identity is trusted.

## Checks actually performed

- 215 automated tests, including 5 new API/component cases: PASS.
- 24 isolated PostgreSQL assertions: opt-in, ownership, personal confirmations, exact
  roster, current versions, negative/stale reviews, rejected entries, disable/re-enable,
  idempotency, launch lock, audit, RLS/ACL and fixture rollback: PASS.
- TypeScript, ESLint changed TS/TSX, Next webpack build and diff check: PASS.
- Migration applied to Preview project `hvxvwgnnmazpptuenidv`; no settings enabled,
  no participant or result fixtures inserted. Internal helpers cannot be executed by
  anon/authenticated; authenticated direct table writes and anon reads are denied.
- 322 structural metadata records match isolated replay. Snapshot:
  `docs/checks/2026-10-22-auto-admission-schema.json`.

Reproduce SQL locally with an isolated PGlite installation:

```sh
DEAFHUB_PGLITE_PATH=/path/to/node_modules/@electric-sql/pglite node scripts/local-auto-admission-check.mjs
node scripts/local-schema-snapshot.mjs
node scripts/compare-hub-schema.mjs
```

Actual Supabase Auth and a complete organizer/player browser scenario remain unverified.
Local simulated identities are not a substitute for that test. Main, production,
financial features, global Auth settings and the approved design were not changed.


## Publication verified

- Runtime `fa8fab4d5d854ac9bf2907e4c5e52187346adbfb`: Vercel Preview Ready.
- Sources, tests and schema through `ac3f570d43fdb13deff05a2a62fd0e126f3a5255`: nine files byte-identical to GitHub.
- Browser: https://deafhub-h3hzp45dt-ionas-projects-019510f8.vercel.app/tournaments opens the signed-out state; the admission GET API returns Sign in required. Authenticated form interaction is not claimed.
