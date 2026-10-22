# Check-in, captain reports and referees — Preview

22 October 2026. Additive, optional rules; existing tournaments keep their behavior.

## Implemented

- Organizer sets an optional UTC check-in window before launch. Every approved roster
  member checks in personally. Window changes invalidate old confirmations; identical
  retries do not. Withdrawal is possible before launch even after the window closes.
- Engine and manual-match launch require current check-in from the exact registered
  roster when enabled. Current tournament/participation rule versions are checked.
  No check-in causes neither automatic forfeits nor automatic rejection.
- Organizer can require captain confirmation before engine launch. Captains (or FC
  individual entrants) submit played scores and plain-text evidence/links. The other
  side confirms or disputes the report with a reason. Both confirmations refer to the
  same report and match fingerprint. Schedule changes alone do not invalidate them.
- Reports remain historical; a new score needs fresh confirmations. Corrected results
  cannot reuse the old match's confirmations. A rejected protocol blocks publication.
- Organizer can appoint/revoke tournament-scoped referees from registered participants.
  A referee cannot adjudicate their own match; they cannot change rosters, settings,
  awards or commit bracket results. A reasoned ruling accepts a particular report.
  A later captain objection invalidates that ruling.
- Final publication still uses the existing organizer API, engine validation,
  idempotency, version checks and audit. A deferred SQL constraint trigger verifies
  both confirmations or the referee decision in the same transaction. Explicit,
  reasoned forfeits remain organizer rulings; played scores are never invented.
- Issued awards still block correction. Revoke awards first. No external ratings,
  payment features, demo results or medical-document checks were added.
- Private evidence/votes are readable only by match participants, organizer and scoped
  referees. Tables have RLS and no end-user writes; authenticated RPCs check identities
  from auth.uid(), not submitted user IDs. SECURITY DEFINER search_path is empty.
- Forms live inside existing TournamentOperations cards, RU/EN, responsive grids,
  labeled controls, 44px buttons. Existing brand/design samples were not changed.

## Actual checks

- 179 automated tests passed, including 9 new route/component tests.
- Isolated PostgreSQL: 23 check-in assertions and 17 report/referee assertions passed.
  These include privacy, ownership, direct-write denial, disputed scores, stale
  confirmations, independent adjudication, role revocation and rollback. No fixture
  identity or result was inserted into hosted Supabase.
- TypeScript, ESLint changed TS/TSX, Next webpack build and diff check passed.
- Hosted migration versions: 20261022062526 and 20261022062542. Six new tables have RLS;
  anon SELECT and authenticated direct writes are denied. Internal triggers are not
  executable by users. 311 structural records match isolated migration replay.
- The previous security advisor warnings (rls_auto_enable RPC, leaked-password option,
  intentionally locked steam_nonces) were recorded before this change. Global Auth and
  unrelated security settings were not changed.

## Still not claimed

A complete authenticated browser player/captain/organizer/referee scenario has not yet
been executed. Local fixtures test real SQL with simulated identities, not Supabase
Auth itself. Auto-admission is not enabled: eligibility review and approval remain
organizer decisions. Mandatory captain confirmation covers engine matches; legacy
manual result reporting remains the existing organizer flow. Standalone protest case
management, uploaded evidence storage and appeals are not implemented by this change.
See the main status registry; do not interpret this document as full tournament QA.

Reproduce:

```
node scripts/local-checkin-sql-check.mjs
node scripts/local-results-sql-check.mjs
node scripts/local-schema-snapshot.mjs
node scripts/compare-hub-schema.mjs
node --test lib/tournament/*.test.mjs lib/tournament-filters.test.mjs maintenance/tests/*.cjs maintenance/tests/steam-openid.mjs
npx tsc --noEmit
npx next build --webpack
```

PGlite dependency is isolated at /tmp/deafhub-sql-qa; it is not an app dependency.
