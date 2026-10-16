# Tournament engine (Preview only)

The existing Hub now has an organizer-controlled path from approved entries through
round-robin groups, qualification and Single or Double Elimination. It uses the
existing visual classes; Claude examples and global design assets are untouched.

## Rules

- 2–64 unique approved entries; review every pending application before launch.
- Entrants and configuration freeze at launch, registration closes atomically.
- Groups contain each entrant exactly once; a single round robin is generated.
- Publish the points and tie-break rules in the tournament regulations. Ranking:
  points, wins, score difference, scored. Remaining tied qualification/seed positions
  require an explicit organizer decision; an ID is never a qualification tie-break.
- Two groups / two qualifiers use A1–B2 and B1–A2. Configurations producing a
  same-group opening playoff match are rejected rather than silently reseeded.
- BO1/3/5 scores are series wins for elimination matches and Dota/CS2 groups.
  FC group scores are goals and may draw. A tied elimination series is rejected.
- BYE is automatic, has no fictional score and does not count as a played match.
  Forfeit records the real losing entry and awards victory/points without fake goals.
- Double Elimination includes upper/lower brackets. The organizer explicitly chooses
  one grand final or a reset if the lower-bracket finalist wins the first final.
  No separate third-place game is inferred.
- Correcting an upstream match cannot silently rewrite dependent played matches.
  Explicit invalidation is required. Correcting a published group resets the playoffs
  and requires qualification to be published again.

## Persistence and access

Apply `db/tournament-engine.sql` once, after the existing `competition.sql` migration.
The migration adds `hub_engines`, `hub_engine_audit`, a combined statistics view and
selective guards on engine-owned tournaments. Manual tournaments remain supported.

`/api/tournament-engine` verifies the user with `auth.getUser()`, checks same Origin,
validates the command and checks both tournament ownership and `hub_organizers`.
The server computes the state; clients never submit a replacement graph.

`hub_engine_commit` is callable only with the server service role. It independently
checks the actor/organizer, locks the tournament row, verifies the approved entrants,
freezes configuration, compares revision and commits state, audit and tournament
status together. Idempotency keys are bound to actor and command. End-user writes
are revoked; RLS exposes tournament state to authenticated users and audit only to
its organizer. No new role is granted to the owner's real account.

The Hub response includes current engine matches and statistics, so Live and profile
history use the same persisted results. BYE/skipped nodes are excluded. The existing
manual `hub_action` cannot change an engine's entrants/results or bypass completion.

## Verification

- Node 24: `node --test lib/tournament/engine.test.mjs` (33 tests).
- `npx tsc --noEmit` and ESLint on changed TS/TSX files.
- `db/competition-check.sql` and `db/tournament-engine-check.sql` run transactionally
  and roll back all fixtures. The latter verifies ownership, CAS, idempotency, audit,
  legacy guards, statistics, RLS and service-only RPC privileges.
- HTTP integration runner (15 checks passed against local Next + the real Supabase project): `scripts/tournament-e2e.mjs`, with a local Next server
  started by `scripts/run-tournament-e2e.mjs`. It uses disposable QA accounts and a
  clearly labelled QA tournament. Setup/cleanup SQL is required because the service
  role intentionally does not receive direct writes to legacy competition tables.

No payment, wallet, entry-fee or payout code is added. Remaining product work includes
captain confirmation/disputes/evidence workflow, referee delegation, check-in,
realtime subscriptions, per-match scheduling and a separately regulated third place.

### Reproduce HTTP tests

With a private `.env.local` containing the public Supabase URL/key and server key:

```sh
node --env-file=.env.local scripts/tournament-e2e.mjs prepare
# Apply setup.sql from the QA directory in the SQL Editor.
node --env-file=.env.local scripts/run-tournament-e2e.mjs
# Apply cleanup.sql from the same directory.
node --env-file=.env.local scripts/tournament-e2e.mjs cleanup-auth
```

The default QA directory is the OS temporary directory / `deafhub-qa`; override with
`QA_DIR`. It contains a private session fixture, setup/cleanup SQL and a result report.
Never upload its private fixture or `.env.local`. Cleanup targets only IDs created by
that run. To test a deployed Preview, set `QA_ORIGIN` to the verified Preview URL and
run `tournament-e2e.mjs` directly after preparing a fresh database fixture.
