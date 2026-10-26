'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LogOut, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import AuthPanel from './AuthPanel';

const accountControlClass = 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent p-0 text-[#22D3EE] shadow-none transition-colors hover:bg-[#22D3EE]/10 hover:text-[#22D3EE] dark:bg-transparent dark:hover:bg-[#22D3EE]/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#22D3EE] motion-reduce:transition-none';

export default function AccountButton() {
    const ru = useLanguageStore((state) => state.language === 'ru');
    const router = useRouter();
    const [signedIn, setSignedIn] = useState(false);
    const [open, setOpen] = useState(false);
    const dialogOpen = useRef(false);
    const authGeneration = useRef(0);
    useEffect(() => { dialogOpen.current = open; }, [open]);
    const [busy, setBusy] = useState(false);
    const [signOutFailed, setSignOutFailed] = useState(false);
    const mounted = useRef(false);
    const signingOut = useRef(false);
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    useEffect(() => {
        const client = createClient();
        if (!client) return;
        let active = true;
        const syncUser = () => {
            const generation = ++authGeneration.current;
            void client.auth.getUser().then(({ data }) => {
                if (!active || generation !== authGeneration.current) return;
                setSignedIn(Boolean(data.user));
                if (data.user && dialogOpen.current) {
                    dialogOpen.current = false;
                    setOpen(false);
                    router.replace('/profile');
                    router.refresh();
                }
            }).catch(() => {});
        };
        syncUser();
        window.addEventListener('deafhub:auth-complete', syncUser);
        const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
            if (!active) return;
            authGeneration.current++;
            setSignedIn(Boolean(session?.user));
            if (session?.user) {
                if (dialogOpen.current) { dialogOpen.current = false; router.replace('/profile'); router.refresh(); }
                setOpen(false);
            }
        });
        return () => { active = false; subscription.unsubscribe(); window.removeEventListener('deafhub:auth-complete', syncUser); };
    }, [router]);

    async function signOut() {
        if (!mounted.current || signingOut.current) return;
        signingOut.current = true;
        setBusy(true);
        setSignOutFailed(false);
        try {
            const client = createClient();
            if (!client) throw new Error('Unavailable');
            const { error } = await client.auth.signOut();
            if (!mounted.current) return;
            if (error) throw error;
            authGeneration.current++;
            setSignedIn(false);
            router.replace('/');
            router.refresh();
        } catch {
            if (!mounted.current) return;
            setSignOutFailed(true);
        } finally { signingOut.current = false; if (mounted.current) setBusy(false); }
    }

    if (signedIn) return <div className="relative shrink-0">
        <div role="group" aria-label={ru ? 'Аккаунт' : 'Account'} className="inline-flex items-center rounded-xl border border-[#22D3EE]/30 bg-[#22D3EE]/5 p-0.5">
            <Link href="/profile" aria-label={ru ? 'Мой профиль' : 'My profile'} title={ru ? 'Мой профиль' : 'My profile'} className={accountControlClass}>
                <UserRound className="size-5" aria-hidden="true" />
            </Link>
            <span aria-hidden="true" className="h-5 w-px shrink-0 bg-[#22D3EE]/20" />
            <Button type="button" variant="outline" size="icon" className={accountControlClass} disabled={busy} aria-busy={busy} aria-label={ru ? 'Выйти' : 'Sign out'} title={ru ? 'Выйти' : 'Sign out'} onClick={signOut}>
                <LogOut className="size-5" aria-hidden="true" />
            </Button>
        </div>
        {signOutFailed ? <p role="alert" className="absolute right-0 top-full z-10 mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-xl border border-white/10 bg-[#0D131A] p-3 text-xs text-red-300">{ru ? 'Не удалось выйти. Повторите попытку.' : 'Could not sign out. Please try again.'}</p> : null}
    </div>;

    return <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><Button variant="outline" className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl border-[#22D3EE]/30 bg-[#22D3EE]/5 text-[#22D3EE] hover:bg-[#22D3EE] hover:text-[#0A0F14] text-xs sm:text-sm">{ru ? 'Войти' : 'Sign In'}</Button></DialogTrigger>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[400px] rounded-3xl border-white/10 bg-[#0D131A] p-6 sm:p-7">
            <DialogHeader><DialogTitle className="text-center text-2xl font-bold">{ru ? 'Вход в ' : 'Sign in to '}<span className="text-[#22D3EE]">DeafHub</span></DialogTitle><DialogDescription className="sr-only">{ru ? 'Вход через Steam или почту. Регистрация и восстановление пароля.' : 'Sign in with Steam or email. Create an account or reset your password.'}</DialogDescription></DialogHeader>
            <AuthPanel />
        </DialogContent>
    </Dialog>;
}


