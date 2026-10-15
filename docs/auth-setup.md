# DeafHub authentication

Account: nagatodeaf@gmail.com. Organization: DeafHub (iessmykfieoitnyqdrpv).
Project: DeafHub (hvxvwgnnmazpptuenidv). Do not use another project's credentials.

Required Vercel Preview variables:

- NEXT_PUBLIC_SUPABASE_URL: https://hvxvwgnnmazpptuenidv.supabase.co
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: the project's publishable key
- NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: true only after configuring and testing Google

Apply db/profiles.sql to this new project once. RLS restricts each user to their own profile. No service-role key is needed by the application.

Email sign-in uses Supabase's default magic-link email, with a PKCE callback at /auth/callback. Open the link in the same browser that requested it. On the Free plan, custom templates require custom SMTP or a Send Email hook. Default sending is restricted to authorized team addresses; configure and verify custom SMTP before public launch. Do not disable email confirmation to work around delivery.

Set Site URL to the stable Preview branch URL and allow its exact /auth/callback redirect. No production credentials are configured in this setup.

For Google, register an OAuth web client, add the Supabase callback URL, enable the provider, allow the stable Preview /auth/callback URL, and only then enable the Google button. VK ID needs a separately configured provider; it is not presented as operational.

Validation: signed-out /profile redirects to /sign-in; an email link creates a session; save/reload profile; sign out; second account cannot read/write the first profile. Contacts are unverified and private. Tournament payment/eligibility and captain-group access must not be inferred from these fields.
