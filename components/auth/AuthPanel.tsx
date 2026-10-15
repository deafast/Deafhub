'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Button } from '@/components/ui/button';

export default function AuthPanel() {
    const ru = useLanguageStore((state) => state.language === 'ru');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true';

    async function googleSignIn() {
        setError('');
        const supabase = createClient();
        if (!supabase || !googleEnabled) return;
        setBusy(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${window.location.origin}/auth/callback` },
            });
            if (error) throw error;
        } catch {
            setError(ru ? 'Не удалось начать вход. Попробуйте ещё раз.' : 'Could not start sign-in. Please try again.');
            setBusy(false);
        }
    }

    return <div className="grid gap-4">
        <p className="text-sm text-white/60">{ru ? 'Войдите, чтобы создать профиль и управлять участием в турнирах.' : 'Sign in to create your profile and manage tournament entries.'}</p>
        <Button type="button" disabled={busy || !googleEnabled} onClick={googleSignIn} className="h-12 w-full rounded-2xl bg-white text-black hover:bg-white/90">
            {busy ? (ru ? 'Переход…' : 'Redirecting…') : (ru ? 'Продолжить с Google' : 'Continue with Google')}
        </Button>
        {!googleEnabled ? <p className="text-xs text-white/50">{ru ? 'Вход через Google скоро станет доступен.' : 'Google sign-in will be available soon.'}</p> : null}
        <Button type="button" disabled className="h-12 w-full rounded-2xl border border-white/15 bg-white/5 text-white">
            {ru ? 'Продолжить со Steam' : 'Continue with Steam'}
        </Button>
        <p className="text-xs text-white/50">{ru ? 'Вход через Steam пока настраивается.' : 'Steam sign-in is being configured.'}</p>
        {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
    </div>;
}
