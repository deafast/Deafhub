'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AuthPanel from './AuthPanel';

export default function AccountButton() {
    const ru = useLanguageStore((state) => state.language === 'ru');
    const router = useRouter();
    const [signedIn, setSignedIn] = useState(false);
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const client = createClient();
        if (!client) return;
        let active = true;
        void client.auth.getUser().then(({ data }) => {
            if (active) setSignedIn(Boolean(data.user));
        }).catch(() => {});
        const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
            if (!active) return;
            setSignedIn(Boolean(session?.user));
            if (session?.user) setOpen(false);
        });
        return () => { active = false; subscription.unsubscribe(); };
    }, []);

    async function signOut() {
        setBusy(true);
        setError('');
        try {
            const client = createClient();
            if (!client) throw new Error('Unavailable');
            const { error } = await client.auth.signOut();
            if (error) throw error;
            setSignedIn(false);
            router.replace('/');
            router.refresh();
        } catch {
            setError(ru ? 'Не удалось выйти. Повторите попытку.' : 'Could not sign out. Please try again.');
        } finally { setBusy(false); }
    }

    if (signedIn) return <div className="flex flex-wrap items-center gap-2">
        <Link href="/profile" className="text-sm text-[#22D3EE]">{ru ? 'Мой профиль' : 'My profile'}</Link>
        <Button variant="outline" disabled={busy} onClick={signOut}>{ru ? 'Выйти' : 'Sign out'}</Button>
        {error ? <p role="alert" className="text-xs text-red-300">{error}</p> : null}
    </div>;

    return <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><Button variant="outline" className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl border-[#22D3EE]/30 bg-[#22D3EE]/5 text-[#22D3EE] hover:bg-[#22D3EE] hover:text-[#0A0F14] text-xs sm:text-sm">{ru ? 'Войти' : 'Sign In'}</Button></DialogTrigger>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-white/10 bg-[#0D131A] p-8">
            <DialogHeader><DialogTitle className="text-2xl font-bold text-center mb-4">{ru ? 'Вход в DeafHub' : 'Sign in to DeafHub'}</DialogTitle></DialogHeader>
            <AuthPanel />
        </DialogContent>
    </Dialog>;
}
