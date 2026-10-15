# DeafHub authentication

Owner: nagatodeaf@gmail.com. Organization: DeafHub (iessmykfieoitnyqdrpv).
Supabase: DeafHub (hvxvwgnnmazpptuenidv). Never use another project's credentials.

The requested sign-in methods are Google and Steam only. The email form and magic-link requests have been removed. VK is out of scope.

Preview variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true only after Google is configured and tested

Google Cloud project DeafHub: caramel-limiter-511716-u1. The owner completed MFA. Web OAuth client DeafHub Preview has been created, its credentials saved in the correct Supabase Google provider, and Google enabled. Audience remains External / Testing with nagatodeaf@gmail.com added as a test user. NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true is configured for Preview only. A successful complete login still needs verification.
Create a Web OAuth client with the stable Preview origin and callback https://hvxvwgnnmazpptuenidv.supabase.co/auth/v1/callback. Configure its ID and secret in the correct Supabase project's Google provider. Keep secrets out of browser bundles and Git. The app's PKCE callback is /auth/callback.

Steam is not implemented yet: the disabled button explicitly says it is being configured. Steam uses OpenID 2.0, which cannot be passed as provider 'steam' to Supabase's OAuth API. A verified server-side OpenID integration and session bridge are still required. Do not enable the button until that flow has been implemented and tested.

The profile schema is already installed. Do not rerun db/profiles.sql: its policies already exist. RLS restricts every user to their own profile. The application currently needs no service-role key.

Site URL and exact allowed redirect use the stable Preview branch URL. Production is unchanged.

Validation remaining: Google and Steam successful sign-in, profile save/reload, sign out, and a second account unable to access the first account's profile. Contacts are unverified and private; do not infer tournament payment or eligibility from them.

Google sign-in opens a 500x680 popup. The existing PKCE callback exchanges the code server-side, then /auth/complete closes the popup. The parent verifies the shared session with getUser before opening /profile; no tokens are sent through postMessage. Popup blockers show a retry instruction; cancel and a three-minute timeout clean up waiting. /profile is the account dashboard; profile editing is at /profile/settings. Match, team, tournament-entry and wallet data are explicitly unavailable until integrations exist.

## Steam and competition update
Steam OpenID 2.0 is implemented at /auth/steam and /auth/steam/callback. It validates state, Steam's signed return URL and identity, timestamp, provider verification and one-time nonce. Linked accounts live in private steam_accounts; steam_nonces is server-only. The browser never receives a service key or generated sign-in token. Native Steam sign-in establishes a Supabase session only after Steam verification. Existing Google users can link Steam from their account. Conflicting links are rejected, with no automatic account merge.
Activation still requires the owner to authorize SUPABASE_SERVICE_ROLE_KEY in the Vercel project's Preview environment. The key grants server-side Auth admin access and must never be NEXT_PUBLIC, logged, written to Git or shared in chat. Until configured, the Steam button stays disabled. Real Steam login/linking must then be tested by the owner.

competition.sql has been applied once to DeafHub hvxvwgnnmazpptuenidv; do not rerun it. competition-check.sql runs a transaction with temporary users, teams and a tournament, then rolls back. Checks passed for captain/organizer permissions, stale rules, private profiles and invitations, roster snapshots, result immutability and winner/loser statistics. No test fixtures persist.

Hub features: teams by game, captain-only invitation codes and code rotation, join/leave (captain cannot leave), roster lock during active entries, rule-version acceptance, organizer approval/rejection, match scheduling, one-time result confirmation, tournament completion and statistics from registered rosters. Payments are excluded. Roster nicknames are visible to authenticated players; contacts remain private. Server checks identity and database functions enforce every write.

hub_organizers starts empty. Only a trusted database administrator can grant this role. The owner nagatodeaf@gmail.com has not yet been granted organizer permissions; request exact confirmation before doing so. Never infer organizer permissions from email, nickname, user_metadata or a UI flag.

External Dota/CS2/Steam game-history imports, automatic brackets, disputes, team ownership transfer and payment handling are not implemented in this update. Match scheduling is manual, and confirmed scores cannot yet be corrected through the UI. Do not advertise automatic external history import.
