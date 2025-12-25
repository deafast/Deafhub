'use client';

import { Canvas } from '@react-three/fiber';
import { Preload, View } from '@react-three/drei';
import { Suspense } from 'react';

export default function GlobalCanvas() {
    return (
        <Canvas
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: -1,
            }}
            eventSource={typeof document !== 'undefined' ? document.getElementById('main-root')! : undefined}
            frameloop="demand"
            dpr={[1, 2]}
            gl={{ alpha: true, antialias: true }}
        >
            <Suspense fallback={null}>
                <View.Port />
                <Preload all />
            </Suspense>
        </Canvas>
    );
}
