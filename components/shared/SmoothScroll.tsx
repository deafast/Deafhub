'use client';

import { ReactLenis } from 'lenis/react';
import { useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
    const prefersReducedMotion = useReducedMotion();
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        if (!prefersReducedMotion) {
            setEnabled(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!enabled) return <>{children}</>;

    return (
        <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
            {children}
        </ReactLenis>
    );
}
