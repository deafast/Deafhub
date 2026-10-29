'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import BrandImage from 'next/image';
import { useLanguageStore } from '@/store/useLanguageStore';

// Локальные кадры: public/preloader/1.jpg ... 6.jpg
const FLIP_IMAGES = [
    'url("/preloader/1.webp")',
    'url("/preloader/2.webp")',
    'url("/preloader/3.webp")',
    'url("/preloader/4.webp")',
    'url("/preloader/5.webp")',
    'url("/preloader/6.webp")',
];

/**
 * PreloaderV8 - Sharp Edge / Marvel Edition.
 * Background frames stay clipped to the approved brand alpha through the final reveal.
 * The final frame uses the approved image pixels without retyped lettering.
 */
export default function PreloaderV8() {
    const language = useLanguageStore((state) => state.language);
    const [isLoading, setIsLoading] = useState(true);
    const [isSkipped, setIsSkipped] = useState(false);

    const [isFlipping, setIsFlipping] = useState(true);
    const introRef = useRef<HTMLDivElement>(null);
    const [bgReady, setBgReady] = useState(false);

    const exitDelayMs = 2750;     // общий выход
    const stopFlipMs = 2000;      // стоп-кадр

    const skipIntro = () => {
        setIsSkipped(true);
        setIsLoading(false);
        try {
            sessionStorage.setItem('dh_intro_seen', 'true');
        } catch {
            // Closing the intro must also work when browser storage is unavailable.
        }
    };

    useEffect(() => {
        if (!isLoading) return;
        try {
            if (sessionStorage.getItem('dh_intro_seen')) {
                queueMicrotask(() => { setIsSkipped(true); setIsLoading(false); });
                return;
            }
        } catch {
            // The intro also works with storage disabled.
        }

        if (isSkipped) return;
        const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
        const skipForReducedMotion = () => {
            if (motionPreference.matches) {
                setIsSkipped(true);
                setIsLoading(false);
            }
        };
        if (motionPreference.matches) {
            queueMicrotask(skipForReducedMotion);
            return;
        }
        motionPreference.addEventListener('change', skipForReducedMotion);
        let cancelled = false;
        let animationFrame = 0;
        let stopTimer: ReturnType<typeof setTimeout> | undefined;
        let exitTimer: ReturnType<typeof setTimeout> | undefined;
        let readinessTimer: ReturnType<typeof setTimeout> | undefined;
        const ready = new Set<number>();
        const decoded = FLIP_IMAGES.map((_, index) => {
            const image = new Image();
            image.src = `/preloader/${index + 1}.webp`;
            return image.decode().then(() => { ready.add(index); }).catch(() => {});
        });
        // Never hold the page indefinitely if an image fails or the network is slow.
        const deadline = new Promise<void>((resolve) => {
            readinessTimer = setTimeout(resolve, 900);
        });
        void Promise.race([Promise.all(decoded), deadline]).then(() => {
            if (cancelled) return;
            clearTimeout(readinessTimer);
            const frames = [...ready].sort((a, b) => a - b);
            setBgReady(frames.length > 0);
            if (frames.length === 0) setIsFlipping(false);
            const started = performance.now();
            let previous = -1;
            const tick = (now: number) => {
                if (cancelled) return;
                const elapsed = now - started;
                if (elapsed >= stopFlipMs || frames.length === 0) return;
                const index = frames[Math.floor(elapsed / 40) % frames.length];
                if (index !== previous) {
                    introRef.current?.style.setProperty('--dh-intro-frame', FLIP_IMAGES[index]);
                    previous = index;
                }
                animationFrame = requestAnimationFrame(tick);
            };
            animationFrame = requestAnimationFrame(tick);
            stopTimer = setTimeout(() => {
                cancelAnimationFrame(animationFrame);
                setIsFlipping(false);
            }, stopFlipMs);
            exitTimer = setTimeout(() => {
                setIsLoading(false);
                try { sessionStorage.setItem('dh_intro_seen', 'true'); } catch {}
            }, exitDelayMs);
        });
        return () => {
            cancelled = true;
            motionPreference.removeEventListener('change', skipForReducedMotion);
            cancelAnimationFrame(animationFrame);
            clearTimeout(readinessTimer);
            clearTimeout(stopTimer);
            clearTimeout(exitTimer);
        };
    }, [isSkipped, isLoading]);

    if (isSkipped) return null;

    return (
        <AnimatePresence mode="wait">
            {isLoading && (
                <motion.div
                    key="dh-preloader"
                    id="dh-preloader-container"
                    ref={introRef}
                    initial={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] },
                    }}
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-black overflow-hidden"
                    style={{ width: '100%', height: '100svh' }}
                >
                    {/* ФИКС F5: Скрипт защиты от мерцания */}
                    <script dangerouslySetInnerHTML={{
                        __html: `
            try {
              if (sessionStorage.getItem('dh_intro_seen')) {
                const intro = document.getElementById('dh-preloader-container');
                if (intro) intro.style.display = 'none';
              }
            } catch {}
          `}} />

                    {/* FULL SCREEN FLIPPING BACKGROUND */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: !bgReady ? 0 : (isFlipping ? 0.35 : 0.08),
                            filter: isFlipping ? 'grayscale(0.85) brightness(0.55)' : 'grayscale(1) brightness(0.12)',
                        }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage: bgReady ? 'var(--dh-intro-frame, url("/preloader/1.webp"))' : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />

                    {/* CENTRAL LOGO REVEAL */}
                    <div className="relative flex flex-col items-center pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{
                                scale: bgReady || !isFlipping ? 1 : 0.9,
                                opacity: bgReady || !isFlipping ? 1 : 0,
                            }}
                            transition={{ scale: { duration: 2, ease: [0.23, 1, 0.32, 1] }, opacity: { duration: 0.6 } }}
                            className="relative p-4 sm:p-6 md:p-8 flex items-center justify-center overflow-visible bg-transparent"
                        >
                            <div className="relative z-10 w-[min(84vw,420px)]" style={{ aspectRatio: '610 / 445' }}>
                                <div
                                    aria-hidden="true"
                                    className="absolute inset-0"
                                    style={{
                                        opacity: isFlipping ? 1 : 0,
                                        backgroundImage: 'var(--dh-intro-frame, url("/preloader/1.webp"))',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        filter: 'brightness(3.2) contrast(2)',
                                        maskImage: 'url("/branding/approved-2026-10-28/logo.png")',
                                        WebkitMaskImage: 'url("/branding/approved-2026-10-28/logo.png")',
                                        maskSize: 'contain',
                                        WebkitMaskSize: 'contain',
                                        maskRepeat: 'no-repeat',
                                        WebkitMaskRepeat: 'no-repeat',
                                    }}
                                />
                                <BrandImage
                                    src="/branding/approved-2026-10-28/logo.png"
                                    alt="DEAFHUB — ESPORTS ORGANIZATION"
                                    width={610}
                                    height={445}
                                    priority
                                    sizes="(max-width: 500px) 84vw, 420px"
                                    className="relative block h-auto w-full"
                                    style={{ opacity: isFlipping ? 0 : 1 }}
                                />
                            </div>
                        </motion.div>
                    </div>
                    <button
                        type="button"
                        onClick={skipIntro}
                        style={{ bottom: 'max(16px, env(safe-area-inset-bottom))', right: 'max(16px, env(safe-area-inset-right))' }}
                        className="absolute z-30 min-h-11 min-w-11 rounded-md border border-white/30 bg-black/60 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-cyan-300 hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300 motion-reduce:transition-none"
                    >
                        {language === 'ru' ? 'Пропустить заставку' : 'Skip intro'}
                    </button>
                </motion.div >
            )}
        </AnimatePresence >
    );
}
