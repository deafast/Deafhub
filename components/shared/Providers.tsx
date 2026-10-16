'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import GlobalCanvas from '@/components/r3f/GlobalCanvas';

import SmoothScroll from './SmoothScroll';

export default function Providers({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <SmoothScroll>
                <div id="main-root" className="relative h-full w-full">
                    {children}
                    {pathname === '/' ? null : <GlobalCanvas />}
                </div>
            </SmoothScroll>
        </QueryClientProvider>
    );
}
