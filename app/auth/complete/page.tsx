'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthCompletePage() {
    const router = useRouter();
    useEffect(() => {
        const popup = sessionStorage.getItem('deafhub-auth-popup') === '1';
        sessionStorage.removeItem('deafhub-auth-popup');
        if (popup) window.close();
        router.replace('/profile');
        router.refresh();
    }, [router]);
    return <section className="mx-auto max-w-lg p-8 text-center"><h1 className="text-2xl font-bold">DEAF|HUB</h1><p className="mt-4">Вход выполнен / Signed in</p><Link href="/profile" className="mt-6 inline-block text-[#22D3EE]">Открыть кабинет / Open account →</Link></section>;
}
