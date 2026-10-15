# DeafHub authentication

Owner: nagatodeaf@gmail.com. Organization: DeafHub (iessmykfieoitnyqdrpv).
Supabase: DeafHub (hvxvwgnnmazpptuenidv). Never use another project's credentials.

The requested sign-in methods are Google and Steam only. The email form and magic-link requests have been removed. VK is out of scope.

Preview variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true only after Google is configured and tested

Google Cloud project DeafHub: caramel-limiter-511716-u1. Setup is blocked by Google's mandatory two-step verification on the owner's account. The owner must complete MFA before OAuth setup can continue.
Create a Web OAuth client with the stable Preview origin and callback https://hvxvwgnnmazpptuenidv.supabase.co/auth/v1/callback. Configure its ID and secret in the correct Supabase project's Google provider. Keep secrets out of browser bundles and Git. The app's PKCE callback is /auth/callback.

Steam is not implemented yet: the disabled button explicitly says it is being configured. Steam uses OpenID 2.0, which cannot be passed as provider 'steam' to Supabase's OAuth API. A verified server-side OpenID integration and session bridge are still required. Do not enable the button until that flow has been implemented and tested.

The profile schema is already installed. Do not rerun db/profiles.sql: its policies already exist. RLS restricts every user to their own profile. The application currently needs no service-role key.

Site URL and exact allowed redirect use the stable Preview branch URL. Production is unchanged.

Validation remaining: Google and Steam successful sign-in, profile save/reload, sign out, and a second account unable to access the first account's profile. Contacts are unverified and private; do not infer tournament payment or eligibility from them.
