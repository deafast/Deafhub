'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Button } from '@/components/ui/button';

export default function AuthPanel() {
    const ru = useLanguageStore((state) => state.language === 'ru');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [sentTo, setSentTo] = useState('');

    async function emailSignIn(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        const supabase = createClient();
        if (!supabase) {
            setError(ru ? 'Вход временно недоступен. Попробуйте позже.' : 'Sign-in is temporarily unavailable. Please try again later.');
            return;
        }
        setBusy(true);
        try {
            const normalized = email.trim().toLowerCase();
            const { error } = await supabase.auth.signInWithOtp({
                email: normalized,
                options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
            });
            if (error) throw error;
            setSentTo(normalized);
        } catch {
            setError(ru ? 'Не удалось войти. Проверьте данные и попробуйте ещё раз.' : 'Could not sign in. Check your details and try again.');
        } finally { setBusy(false); }
    }

    async function signIn() {
        setError('');
        const supabase = createClient();
        if (!supabase) {
            setError(ru ? 'Вход временно недоступен. Попробуйте позже.' : 'Sign-in is temporarily unavailable. Please try again later.');
            return;
        }
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
        {sentTo ? <div className="grid gap-3">
            <p role="status" className="text-sm text-white/70">{ru ? 'Ссылка для входа отправлена на' : 'A sign-in link was sent to'} {sentTo}. {ru ? 'Откройте её в этом же браузере. Проверьте также папку «Спам».' : 'Open it in this same browser. Also check your spam folder.'}</p>
            <Button type="button" variant="ghost" onClick={() => { setSentTo(''); setError(''); }}>{ru ? 'Отправить снова / другой адрес' : 'Send again / different email'}</Button>
        </div> : <form onSubmit={emailSignIn} className="grid gap-3">
            <label className="text-sm">Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required maxLength={254} className="mt-2 h-12 w-full rounded-2xl border border-white/15 bg-white/5 px-4" /></label>
            <Button disabled={busy} type="submit" className="h-12 rounded-2xl bg-[#22D3EE] text-[#0A0F14]">{busy ? (ru ? 'Подождите…' : 'Please wait…') : (ru ? 'Получить ссылку для входа' : 'Send sign-in link')}</Button>
        </form>}
        {process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true' ? <Button disabled={busy} onClick={signIn} className="h-12 w-full rounded-2xl bg-white text-black hover:bg-white/90">
            {busy ? (ru ? 'Переход…' : 'Redirecting…') : (ru ? 'Продолжить с Google' : 'Continue with Google')}
        </Button> : null}
        {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
    </div>;
}
