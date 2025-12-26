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
 * КРАСНАЯ ЗОНА: Решена проблема черных прямоугольников из фото пользователя.
 * Исправлено: Удален "Internal Flipping Backdrop" (который создавал коробку) 
 * и применен режим экрана для букв.
 */
export default function PreloaderV8() {
    const [isLoading, setIsLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    const [isFlipping, setIsFlipping] = useState(true);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [bgReady, setBgReady] = useState(false);

    const exitDelayMs = 2600;     // общий выход
    const stopFlipMs = 2200;      // стоп-кадр

    useEffect(() => {
        setIsMounted(true);
        if (sessionStorage.getItem('dh_intro_seen')) {
            setIsLoading(false);
            return;
        }

        if (!isLoading) return;

        // Предзагрузка первого кадра для плавного входа (как просил юзер)
        const img = new Image();
        img.src = "/preloader/1.jpg";
        img.onload = () => setBgReady(true);
        img.onerror = () => setBgReady(true);

        const interval = setInterval(() => {
            if (!isFlipping) return;
            setCurrentFrame((prev) => (prev + 1) % FLIP_IMAGES.length);
        }, 40);

        const stopTimer = setTimeout(() => setIsFlipping(false), stopFlipMs);

        const exitTimer = setTimeout(() => {
            setIsLoading(false);
            sessionStorage.setItem('dh_intro_seen', 'true');
        }, exitDelayMs);

        return () => {
            clearInterval(interval);
            clearTimeout(stopTimer);
            clearTimeout(exitTimer);
        };
    }, [isFlipping, isLoading]);

    if (!isLoading) return null;

    return (
        <AnimatePresence mode="wait">
            {isLoading && (
                <motion.div
                    key="dh-preloader"
                    id="dh-preloader-container"
                    initial={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        scale: 1.05,
                        filter: 'brightness(1.25)',
                        transition: { duration: 0.55, ease: [0.76, 0, 0.24, 1] },
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
                                scale: isFlipping ? 1 : 1.03,
                                opacity: 1,
                            }}
                            transition={{ duration: 0.7, ease: 'circOut' }}
                            className="relative p-8 flex items-center justify-center overflow-visible bg-transparent"
                            style={{ mixBlendMode: 'screen' }} // ВАЖНО: Удаляет любые черные артефакты клиппинга
                        >
                            {/* Internal Flipping Backdrop УДАЛЕН - он создавал черный прямоугольник на фото */}

                            <div className="relative z-10 flex items-center gap-4 md:gap-8 bg-transparent">
                                <motion.h1
                                    animate={{
                                        color: isFlipping ? 'transparent' : '#EAFBFF',
                                        backgroundImage: isFlipping ? FLIP_IMAGES[currentFrame] : 'none',
                                    }}
                                    className="text-5xl md:text-8xl font-[1000] italic tracking-tight uppercase leading-none bg-transparent"
                                    style={{
                                        WebkitBackgroundClip: isFlipping ? 'text' : 'unset',
                                        backgroundClip: isFlipping ? 'text' : 'unset',
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
                                        height: isFlipping ? '60px' : '120px',
                                        backgroundColor: '#22D3EE',
                                        boxShadow: isFlipping ? '0 0 18px #22D3EE' : '0 0 44px rgba(34,211,238,0.9)',
                                    }}
                                    transition={{ duration: 0.45, type: 'spring', stiffness: 120, damping: 18 }}
                                    className="w-[4px] md:w-[8px] z-20 rounded-sm skew-x-[-20deg]"
                                />

                                <motion.h1
                                    animate={{
                                        color: isFlipping ? 'transparent' : '#22D3EE',
                                        backgroundImage: isFlipping ? FLIP_IMAGES[currentFrame] : 'none',
                                    }}
                                    className="text-5xl md:text-8xl font-[1000] italic tracking-tight uppercase leading-none bg-transparent"
                                    style={{
                                        WebkitBackgroundClip: isFlipping ? 'text' : 'unset',
                                        backgroundClip: isFlipping ? 'text' : 'unset',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        filter: isFlipping ? 'brightness(3.2) contrast(2)' : 'none',
                                        backgroundColor: 'transparent'
                                    }}
                                >
                                    HUB
                                </motion.h1>
                            </div>

                            {/* Final Neon Flare (без blur) */}
                            {!isFlipping && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        boxShadow: '0 0 80px rgba(34,211,238,0.22)',
                                    }}
                                />
                            )}
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

                    {/* Cinematic Stripes */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        {Array.from({ length: 30 }).map((_, i) => (
                            <div key={i} className="h-px w-full bg-white/10 mb-4" />
                        ))}
                    </div>
                </motion.div >
            )}
        </AnimatePresence >
    );
}
