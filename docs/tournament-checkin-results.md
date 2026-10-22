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
Auth itself. Optional automatic admission has since been implemented and checked; see
[tournament-auto-admission.md](tournament-auto-admission.md). It is off by default and
never replaces a positive human eligibility review. Mandatory captain confirmation
covers engine matches. The legacy manual write path is now blocked whenever mandatory
confirmation is enabled; this prevents bypassing captain reports. Optional manual
events retain the organizer flow. Disputes and reasoned referee decisions are implemented. A separate appeals
system and file uploads are not part of the approved completion criteria.
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

PGlite is an isolated QA dependency, not an app dependency. Set DEAFHUB_PGLITE_PATH
to its installation directory when the default temporary runtime is unavailable.

## Publication verified

- Runtime commit: `989c7ea6a89ce28f34644debf666fd4868300566`; Vercel Preview Ready.
- Tests/docs through `e4cca3bd2231e095bc1905d25a0373041c9adcde`: all 19 files byte-identical to GitHub.
- Browser: https://deafhub-kl5okvyoi-ionas-projects-019510f8.vercel.app/tournaments opens the signed-out state; both new GET APIs return Sign in required. This verifies the guest boundary, not authorized form interaction.
- GitHub deafast browser session and Supabase nagato connector both work. The website itself is signed out.
- Six new tables contain zero rows in hosted Supabase; no fake results/roles/check-ins were inserted.
- main remains `f68ee6d1c70d115be90e6931434c24acbd3f9fd2`.


## Subsequent completion: admission and legacy boundary

Optional automatic admission is implemented and verified separately. The legacy manual
result bypass is fixed by migration20261022105700: mandatory confirmation now requires
the engine/report flow. Current checks:217 automated tests,24 admission SQL checks,
15 legacy boundary SQL checks and17 report SQL checks; TypeScript/ESLint/build PASS.
324 schema records match Preview. See tournament-auto-admission.md and
legacy-result-confirmation-boundary.md. Complete authenticated browser acceptance
remains open.
