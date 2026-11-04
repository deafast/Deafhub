'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useLanguageStore } from '@/store/useLanguageStore';

export default function Providers({ children }: { children: React.ReactNode }) {
    const language = useLanguageStore(state => state.language);
    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <div id="main-root" className="relative h-full w-full">
                {children}
            </div>
        </QueryClientProvider>
    );
}
