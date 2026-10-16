import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get('code');
    const supabase = await createClient();
    if (code && supabase) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            const target = request.nextUrl.searchParams.get('flow') === 'recovery' ? '/auth/reset-password' : '/auth/complete';
            const response = NextResponse.redirect(new URL(target, request.url));
            response.headers.set('Cache-Control', 'private, no-store');
            response.headers.set('Referrer-Policy', 'no-referrer');
            return response;
        }
    }
    return NextResponse.redirect(new URL('/sign-in?error=callback', request.url));
}
