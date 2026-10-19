import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get('code');
    try {
        const supabase = code ? await createClient() : null;
        if (code && supabase) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error) {
                const flow = request.nextUrl.searchParams.get('flow');
                const target = flow === 'recovery'
                    ? '/auth/reset-password'
                    : data.user?.app_metadata.provider === 'email'
                        ? '/auth/email-confirmed'
                        : '/auth/complete';
                const response = NextResponse.redirect(new URL(target, request.url));
                response.headers.set('Cache-Control', 'private, no-store');
                response.headers.set('Referrer-Policy', 'no-referrer');
                return response;
            }
        }
    } catch {
        // Do not expose auth service failures or callback tokens to the page.
    }
    const response = NextResponse.redirect(new URL('/sign-in?error=callback', request.url));
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
}
