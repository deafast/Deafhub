'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

// Локальные кадры: public/preloader/1.jpg ... 6.jpg
const FLIP_IMAGES = [
    'url("/preloader/1.jpg")',
    'url("/preloader/2.jpg")',
    'url("/preloader/3.jpg")',
    'url("/preloader/4.jpg")',
    'url("/preloader/5.jpg")',
    'url("/preloader/6.jpg")',
];

/**
 * PreloaderV8 - Sharp Edge / Marvel Edition.
 * Background frames stay clipped to glyphs through the final color reveal.
 * Swap backgroundImage directly, never animate it independently from clipping.
 */
export default function PreloaderV8() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSkipped, setIsSkipped] = useState(false);

    const [isFlipping, setIsFlipping] = useState(true);
    const [currentFrame, setCurrentFrame] = useState(0);
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
        try {
            if (sessionStorage.getItem('dh_intro_seen')) {
                setIsSkipped(true);
                setIsLoading(false);
                return;
            }
        } catch {
            // The intro also works with storage disabled.
        }

        // Предзагрузка первого кадра для плавного входа (как просил юзер)
        const img = new Image();
        img.src = "/preloader/1.jpg";
        img.onload = () => setBgReady(true);
        img.onerror = () => setBgReady(true);

        const interval = setInterval(() => {
            setCurrentFrame((prev) => (prev + 1) % FLIP_IMAGES.length);
        }, 40);

        const stopTimer = setTimeout(() => {
            clearInterval(interval);
            setIsFlipping(false);
        }, stopFlipMs);

        const exitTimer = setTimeout(() => {
            setIsLoading(false);
            try { sessionStorage.setItem('dh_intro_seen', 'true'); } catch {}
        }, exitDelayMs);

        return () => {
            clearInterval(interval);
            clearTimeout(stopTimer);
            clearTimeout(exitTimer);
        };
    }, []);

    if (isSkipped) return null;

    return (
        <AnimatePresence mode="wait">
            {isLoading && (
                <motion.div
                    key="dh-preloader"
                    id="dh-preloader-container"
                    initial={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] },
                    }}
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-black overflow-hidden"
                    style={{ width: '100vw', height: '100vh' }}
                >
                    {/* ФИКС F5: Скрипт защиты от мерцания */}
                    <script dangerouslySetInnerHTML={{
                        __html: `
            if (sessionStorage.getItem('dh_intro_seen')) {
              document.getElementById('dh-preloader-container').style.display = 'none';
            }
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
                            backgroundImage: bgReady ? FLIP_IMAGES[currentFrame] : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />

                    {/* CENTRAL LOGO REVEAL */}
                    <div className="relative flex flex-col items-center pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{
                                scale: 1,
                                opacity: 1,
                            }}
                            transition={{ scale: { duration: 2, ease: [0.23, 1, 0.32, 1] }, opacity: { duration: 0.6 } }}
                            className="relative p-8 flex items-center justify-center overflow-visible bg-transparent"
                        >
                            <div className="relative z-10 flex items-center gap-4 md:gap-8 bg-transparent">
                                <motion.h1
                                    animate={{
                                        color: isFlipping ? 'transparent' : '#EAFBFF',
                                    }}
                                    className="text-5xl md:text-8xl font-[1000] italic tracking-tight uppercase leading-none bg-transparent"
                                    style={{
                                        WebkitBackgroundClip: 'text',
                                        backgroundClip: 'text',
                                        backgroundImage: isFlipping ? FLIP_IMAGES[currentFrame] : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        filter: isFlipping ? 'brightness(3.2) contrast(2)' : 'none',
                                        backgroundColor: 'transparent'
                                    }}
                                >
                                    DEAF
                                </motion.h1>

                                {/* THE CENTRAL BAR | */}
                                <motion.div
                                    animate={{
                                        scaleY: isFlipping ? 0.5 : 1,
                                        skewX: -20,
                                        backgroundColor: '#22D3EE',
                                        boxShadow: isFlipping ? '0 0 18px #22D3EE' : '0 0 44px rgba(34,211,238,0.9)',
                                    }}
                                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                    className="h-[120px] w-[4px] md:w-[8px] z-20 rounded-sm skew-x-[-20deg]"
                                />

                                <motion.h1
                                    animate={{
                                        color: isFlipping ? 'transparent' : '#22D3EE',
                                    }}
                                    className="text-5xl md:text-8xl font-[1000] italic tracking-tight uppercase leading-none bg-transparent"
                                    style={{
                                        WebkitBackgroundClip: 'text',
                                        backgroundClip: 'text',
                                        backgroundImage: isFlipping ? FLIP_IMAGES[currentFrame] : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        filter: isFlipping ? 'brightness(3.2) contrast(2)' : 'none',
                                        backgroundColor: 'transparent'
                                    }}
                                >
                                    HUB
                                </motion.h1>
                            </div>

                        </motion.div>

                        {/* Bottom Slogan */}
                        <div className="mt-8 text-center px-4 bg-transparent">
                            <div className="flex items-center justify-center gap-4 bg-transparent">
                                <motion.div
                                    animate={{ width: isFlipping ? 16 : 60, opacity: isFlipping ? 0.25 : 0.7 }}
                                    className="h-[2px] bg-[#22D3EE]"
                                />
                                <span className="text-sm md:text-2xl font-black italic tracking-[0.35em] text-white/90 uppercase">
                                    PLATFORM
                                </span>
                                <motion.div
                                    animate={{ width: isFlipping ? 16 : 60, opacity: isFlipping ? 0.25 : 0.7 }}
                                    className="h-[2px] bg-[#22D3EE]"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={skipIntro}
                        className="absolute bottom-6 right-6 z-30 min-h-11 min-w-11 rounded-md border border-white/30 bg-black/60 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-cyan-300 hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300 motion-reduce:transition-none"
                    >
                        Пропустить заставку
                    </button>
                </motion.div >
            )}
        </AnimatePresence >
    );
}
