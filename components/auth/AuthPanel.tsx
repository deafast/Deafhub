'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Button } from '@/components/ui/button';

export default function AuthPanel() {
    const ru = useLanguageStore((state) => state.language === 'ru');
    const router = useRouter();
    const stopWaiting = useRef<(() => void) | null>(null);
    useEffect(() => () => stopWaiting.current?.(), []);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true';

    async function googleSignIn() {
        setError('');
        const supabase = createClient();
        if (!supabase || !googleEnabled) return;
        // Open synchronously from the click so popup blockers can recognise the gesture.
        const popup = window.open('about:blank', 'deafhub-google-login', 'popup=yes,width=500,height=680');
        if (!popup) {
            setError(ru ? 'Разрешите всплывающее окно для входа через Google и нажмите ещё раз.' : 'Allow the Google sign-in popup and try again.');
            return;
        }
        setBusy(true);
        stopWaiting.current?.();
        let cancelled = false;
        let timer: ReturnType<typeof setInterval> | undefined;
        const stop = () => { cancelled = true; if (timer) clearInterval(timer); popup.close(); };
        stopWaiting.current = stop;
        try {
            popup.sessionStorage.setItem('deafhub-auth-popup', '1');
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${window.location.origin}/auth/callback`, skipBrowserRedirect: true },
            });
            if (cancelled) return;
            if (error || !data.url) throw error || new Error('Missing URL');
            popup.location.href = data.url;
            const started = Date.now();
            let checking = false;
            timer = setInterval(async () => {
                if (checking || cancelled) return;
                checking = true;
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (cancelled) return;
                    if (user) {
                        stop();
                        setBusy(false);
                        router.replace('/profile');
                        router.refresh();
                    } else if (Date.now() - started > 180000) {
                        stop();
                        setBusy(false);
                        setError(ru ? 'Вход не завершён. Попробуйте ещё раз.' : 'Sign-in was not completed. Please try again.');
                    }
                } catch {
                    if (Date.now() - started > 180000 && !cancelled) {
                        stop();
                        setBusy(false);
                        setError(ru ? 'Не удалось проверить вход. Попробуйте ещё раз.' : 'Could not verify sign-in. Please try again.');
                    }
                } finally { checking = false; }
            }, 2000);
        } catch {
            stop();
            setError(ru ? 'Не удалось начать вход. Попробуйте ещё раз.' : 'Could not start sign-in. Please try again.');
            setBusy(false);
        }
    }
    return <div className="grid gap-4">
        <p className="text-sm text-white/60">{ru ? 'Войдите, чтобы создать профиль и управлять участием в турнирах.' : 'Sign in to create your profile and manage tournament entries.'}</p>
        <Button type="button" disabled={busy || !googleEnabled} onClick={googleSignIn} className="h-12 w-full rounded-2xl bg-white text-black hover:bg-white/90">
            {busy ? (ru ? 'Ожидание входа…' : 'Waiting for sign-in…') : (ru ? 'Продолжить с Google' : 'Continue with Google')}
        </Button>
        {busy ? <button type="button" onClick={() => { stopWaiting.current?.(); setBusy(false); }} className="text-sm text-white/60 underline">{ru ? 'Отменить вход' : 'Cancel sign-in'}</button> : null}
        {!googleEnabled ? <p className="text-xs text-white/50">{ru ? 'Вход через Google скоро станет доступен.' : 'Google sign-in will be available soon.'}</p> : null}
        <Button type="button" disabled className="h-12 w-full rounded-2xl border border-white/15 bg-white/5 text-white">
            {ru ? 'Продолжить со Steam' : 'Continue with Steam'}
        </Button>
        <p className="text-xs text-white/50">{ru ? 'Вход через Steam пока настраивается.' : 'Steam sign-in is being configured.'}</p>
        {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
    </div>;
}
