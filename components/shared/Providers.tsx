'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

import SmoothScroll from './SmoothScroll';
import { useLanguageStore } from '@/store/useLanguageStore';

const GlobalCanvas = dynamic(() => import('@/components/r3f/GlobalCanvas'), { ssr: false });

export default function Providers({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const language = useLanguageStore(state => state.language);
    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <SmoothScroll>
                <div id="main-root" className="relative h-full w-full">
                    {children}
                    {pathname === '/profile' ? <GlobalCanvas /> : null}
                </div>
            </SmoothScroll>
        </QueryClientProvider>
    );
}
