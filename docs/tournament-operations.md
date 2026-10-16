# Participation, awards and organizer panel — Preview

Scope: planned items 3, 6 and 7. Telegram/VK (1), visual accessibility additions (2),
external game metrics (4) and MVP (5) are deferred together. No financial module.

## Participation

An organizer publishes criteria, whether each registered player must confirm them,
and the third-place rule before launching the bracket. The default copy explains
self-declaration, no medical documents and no exclusion solely by country. No diagnosis,
hearing category, medical document or country-based permission field is stored.

Only the registered player can save their own confirmation. The exact policy version
is recorded. When personal confirmations are required, every roster member must
confirm and the organizer must review the entry before admission or bracket launch.
Updating a policy makes old confirmations/reviews stale. Repeating an identical policy
save does not change its version. Policies freeze at launch. Old API calls are subject
to the same database checks; hiding a button is not the authorization boundary.

## Digital awards

Awards are derived from the finished persisted bracket, never entered as arbitrary
placements. The organizer publishes one rule: no third place; shared bronze for Single
semifinal losers; or bronze for the Double lower-final loser. With fewer than three
ranked entrants, no fictional third place is generated. A separate bronze match is not
implemented or inferred.

Every registered roster member receives an individual award linked to their account.
The snapshot stores the tournament title, game, team name, profile nickname (registered
nickname fallback) and a provider avatar URL if one exists. Avatar hosts are allowlisted;
no placeholder person or invented avatar is saved. Names and avatars do not change
retroactively. Repeat issuance is idempotent per tournament revision.

An issued batch blocks score corrections. Revoke it with a reason first; snapshots and
revocation history remain. A corrected tournament revision may receive a new batch.
Both tournament participants and the player's own dashboard can see digital awards.
These are medals/placements, with no balance, entry fees or payout functions.

## Organizer interface and privacy

Existing Hub cards contain criteria, entry counts, registered rosters, per-player
confirmation progress, review forms, award controls and a timestamped activity log.
Layouts stack on narrow screens; overflow tables stay scrollable. Existing colors,
animations, global styles and Claude design examples are untouched.

Raw confirmations are visible only to that player and the tournament owner. Entry
review reasons are visible to the organizer and that entry's registered roster. Audit
logs are owner-only. Award snapshots and published criteria are readable to signed-in
users. Direct table writes are revoked. `hub_ops_action` checks the authenticated UID,
entry membership and organizer ownership in one transaction with a tournament lock.
No real user is automatically granted organizer privileges.

## Verification

- `db/tournament-operations-check.sql`: transactional rollback checks of policy
  versions, personal-only confirmations, owner review, admission guards, three award
  formats (Single shared bronze, Double bronze, two-player final), duplicate issuance,
  avatar filtering, profile snapshots, immutable history, RLS and correction guards.
- `db/competition-check.sql` and `db/tournament-engine-check.sql`: legacy regression.
- `node --test lib/tournament/engine.test.mjs`: 33 engine tests.
- `node scripts/tournament-operations-smoke.mjs`: six credential-free HTTP checks.
- TypeScript and ESLint on changed files; Vercel Preview build.

The new operations' authenticated browser click-through has not been verified. SQL
integration checks run against real Supabase; HTTP boundary checks use no secrets.
Full Google/Steam and whole-site mobile QA remain separate unfinished work.
