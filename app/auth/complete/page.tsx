'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LocalizedText from '@/components/shared/LocalizedText';

export default function AuthCompletePage() {
    const router = useRouter();
    useEffect(() => {
        const popup = sessionStorage.getItem('deafhub-auth-popup') === '1';
        sessionStorage.removeItem('deafhub-auth-popup');
        if (popup) window.close();
        router.replace('/profile');
        router.refresh();
    }, [router]);
    return <section className="mx-auto max-w-lg p-8 text-center"><h1 className="text-2xl font-bold">DEAF|HUB</h1><p className="mt-4"><LocalizedText ru="Вы вошли в аккаунт" en="You are signed in" /></p><Link href="/profile" className="mt-6 inline-block text-[#22D3EE]"><LocalizedText ru="Открыть личный кабинет →" en="Open your account →" /></Link></section>;
}
