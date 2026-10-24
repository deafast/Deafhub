
'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import EmailAuth from './EmailAuth';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Button } from '@/components/ui/button';

export default function AuthPanel({ steamOnly = false }: { steamOnly?: boolean }) {
    const ru = useLanguageStore((state) => state.language === 'ru');
    const router = useRouter();
    const stopWaiting = useRef<(() => void) | null>(null);
    useEffect(() => () => stopWaiting.current?.(), []);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [formBusy, setFormBusy] = useState(false);
    const locked = busy || formBusy;
    const [steamEnabled, setSteamEnabled] = useState(false);
    useEffect(() => { let active = true; void fetch('/auth/steam/status').then(r => r.json()).then(d => { if (active) setSteamEnabled(d.enabled === true); }).catch(() => {}); return () => { active = false; }; }, []);

    async function steamSignIn() {
        setError('');
        const supabase = createClient();
        if (!supabase || !steamEnabled) return;
        // Open synchronously from the click so popup blockers can recognise the gesture.
        const popup = window.open('about:blank', 'deafhub-provider-login', 'popup=yes,width=500,height=680');
        if (!popup) {
            setError(ru ? 'Разрешите всплывающее окно для входа и нажмите ещё раз.' : 'Allow the sign-in popup and try again.');
            return;
        }
        setBusy(true);
        stopWaiting.current?.();
        let cancelled = false;
        const request = new AbortController();
        let timer: ReturnType<typeof setInterval> | undefined;
        const stop = () => { cancelled = true; request.abort(); if (timer) clearInterval(timer); popup.close(); };
        stopWaiting.current = stop;
        try {
            popup.sessionStorage.setItem('deafhub-auth-popup', '1');
            if (cancelled) return;
            popup.location.href = '/auth/steam';
            const started = Date.now();
            let checking = false;
            timer = setInterval(async () => {
                if (checking || cancelled) return;
                checking = true;
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (cancelled) return;
                    let complete = Boolean(user);
                    if (user) {
                        const result = await fetch('/auth/steam/status', { cache: 'no-store', signal: request.signal });
                        complete = result.ok && Boolean((await result.json()).linked);
                    }
                    if (cancelled) return;
                    if (complete) {
                        stop();
                        setBusy(false);
                        window.dispatchEvent(new Event('deafhub:auth-complete'));
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
        {!steamOnly ? <div className="flex items-center gap-3 text-xs text-white/45"><span className="h-px flex-1 bg-white/10" /><span>{ru ? 'Войти через' : 'Sign in with'}</span><span className="h-px flex-1 bg-white/10" /></div> : null}
        <div className={steamOnly ? "flex justify-start" : "grid"}>
            <Button type="button" aria-label={ru ? (steamOnly ? 'Привязать Steam' : 'Войти через Steam') : (steamOnly ? 'Link Steam' : 'Sign in with Steam')} disabled={locked || !steamEnabled} onClick={() => void steamSignIn()} className="h-12 min-w-0 w-fit shrink-0 gap-2 rounded-[10px] border border-[#23456A] bg-[#0C2340] px-3 text-white hover:bg-[#123456]">
                <Image src="/auth/steam.svg" width={88} height={27} alt="Steam" className="h-auto w-[88px] shrink-0" />
                {steamOnly ? <span>{ru ? 'Привязать' : 'Link'}</span> : null}
            </Button>
        </div>
        {busy ? <div role="status" className="flex items-center justify-between gap-2 text-xs text-white/60"><span>{ru ? 'Ожидание входа…' : 'Waiting for sign-in…'}</span><button type="button" onClick={() => { stopWaiting.current?.(); setBusy(false); }} className="text-[#22D3EE] hover:underline">{ru ? 'Отменить' : 'Cancel'}</button></div> : null}
        {!steamEnabled ? <p className="text-xs text-white/50">{ru ? 'Вход через Steam пока настраивается.' : 'Steam sign-in is being configured.'}</p> : null}
        {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
        {!steamOnly ? <>
            <div className="flex items-center gap-3 text-xs text-white/40"><span className="h-px flex-1 bg-white/10" /><span>{ru ? 'или' : 'or'}</span><span className="h-px flex-1 bg-white/10" /></div>
            <EmailAuth disabled={busy} onPendingChange={setFormBusy} />
        </> : null}
    </div>;
}
