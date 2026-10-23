'use client';

import { ReactLenis } from 'lenis/react';
import { useSyncExternalStore } from 'react';

const motionQuery = '(prefers-reduced-motion: reduce)';
function subscribe(callback: () => void) {
    const media = window.matchMedia(motionQuery);
    media.addEventListener('change', callback);
    return () => media.removeEventListener('change', callback);
}
const snapshot = () => window.matchMedia(motionQuery).matches;
const serverSnapshot = () => true;

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
    const reducedMotion = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
    return <>
        {!reducedMotion ? <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }} /> : null}
        {children}
    </>;
}
