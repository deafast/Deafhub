'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const FLIP_IMAGES = [
    'url("https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1920&auto=format&fit=crop")',
    'url("https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1920&auto=format&fit=crop")',
    'url("https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1920&auto=format&fit=crop")',
    'url("https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=1920&auto=format&fit=crop")',
    'url("https://images.unsplash.com/photo-1542332213-31f87348057f?q=80&w=1920&auto=format&fit=crop")',
    'url("https://images.unsplash.com/photo-1560253023-3ee5d647fbba?q=80&w=1920&auto=format&fit=crop")',
    'url("https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?q=80&w=1920&auto=format&fit=crop")',
];

export default function PreloaderV8() {
    const [isLoading, setIsLoading] = useState(true);
    const [isFlipping, setIsFlipping] = useState(true);
    const [currentFrame, setCurrentFrame] = useState(0);

    useEffect(() => {
        // Phase 1: Rapid flipping
        const interval = setInterval(() => {
            if (isFlipping) {
                setCurrentFrame((prev) => (prev + 1) % FLIP_IMAGES.length);
            }
        }, 50); // Balanced cinematic flicker (50ms)

        // Phase 2: Stop flipping and show stable logo
        const stopTimer = setTimeout(() => {
            setIsFlipping(false);
        }, 2200);

        // Phase 3: Total Exit (30ms after flipping stops)
        const exitTimer = setTimeout(() => {
            setIsLoading(false);
        }, 2230);

        return () => {
            clearInterval(interval);
            clearTimeout(stopTimer);
            clearTimeout(exitTimer);
        };
    }, [isFlipping]);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1, filter: 'brightness(2) blur(30px)' }}
                    transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-black overflow-hidden"
                    style={{ width: '100vw', height: '100vh' }}
                >
                    {/* FULL SCREEN FLIPPING BACKGROUND */}
                    <motion.div
                        animate={{
                            opacity: isFlipping ? 0.35 : 0.05,
                            filter: isFlipping ? 'grayscale(0.8) brightness(0.6)' : 'grayscale(1) brightness(0.1)'
                        }}
                        className="absolute inset-0 transition-all duration-700"
                        style={{
                            backgroundImage: FLIP_IMAGES[currentFrame],
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />

                    {/* CENTRAL LOGO REVEAL */}
                    <div className="relative flex flex-col items-center">

                        {/* The Logo Container - ZERO BORDERS */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{
                                scale: isFlipping ? 1 : 1.05, // Subtle scale up on stop
                                opacity: 1,
                            }}
                            transition={{ duration: 0.8, ease: "circOut" }}
                            className="relative p-8 flex items-center justify-center overflow-visible"
                        >
                            {/* Internal Flipping Backdrop */}
                            <motion.div
                                animate={{ opacity: isFlipping ? 1 : 0 }}
                                className="absolute inset-0 z-0"
                                style={{
                                    backgroundImage: FLIP_IMAGES[currentFrame],
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    filter: 'brightness(2.5) contrast(1.5)'
                                }}
                            />

                            {/* Text Mask (The Core) - REDUCED SIZE */}
                            <div className="relative z-10 flex items-center gap-4 md:gap-8">
                                <motion.h1
                                    animate={{
                                        color: isFlipping ? 'transparent' : '#EAFBFF',
                                        backgroundImage: isFlipping ? FLIP_IMAGES[currentFrame] : 'none',
                                    }}
                                    className="text-5xl md:text-8xl font-[1000] italic tracking-tightest uppercase leading-none"
                                    style={{
                                        WebkitBackgroundClip: isFlipping ? 'text' : 'none',
                                        backgroundClip: isFlipping ? 'text' : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        filter: isFlipping ? 'brightness(4) contrast(2)' : 'none',
                                    }}
                                >
                                    DEAF
                                </motion.h1>

                                {/* THE CENTRAL BAR | (Slanted as requested) - ADAPTED SIZE */}
                                <motion.div
                                    animate={{
                                        height: isFlipping ? "60px" : "120px",
                                        backgroundColor: "#22D3EE",
                                        boxShadow: isFlipping
                                            ? "0 0 20px #22D3EE"
                                            : "0 0 60px rgba(34,211,238,1)",
                                    }}
                                    transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                                    className="w-[4px] md:w-[8px] z-20 rounded-sm skew-x-[-20deg]"
                                />

                                <motion.h1
                                    animate={{
                                        color: isFlipping ? 'transparent' : '#22D3EE',
                                        backgroundImage: isFlipping ? FLIP_IMAGES[currentFrame] : 'none',
                                    }}
                                    className="text-5xl md:text-8xl font-[1000] italic tracking-tightest uppercase leading-none"
                                    style={{
                                        WebkitBackgroundClip: isFlipping ? 'text' : 'none',
                                        backgroundClip: isFlipping ? 'text' : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        filter: isFlipping ? 'brightness(4) contrast(2)' : 'none',
                                    }}
                                >
                                    HUB
                                </motion.h1>
                            </div>

                            {/* Final Neon Flare when flipping stops */}
                            {!isFlipping && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 2 }}
                                    className="absolute inset-0 bg-[#22D3EE]/10 blur-[100px] pointer-events-none"
                                />
                            )}
                        </motion.div>

                        {/* Bottom Slogan - COMPACT SIZE */}
                        <div className="mt-8 text-center px-4">
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-center gap-4">
                                    <motion.div
                                        animate={{ width: isFlipping ? 16 : 60, opacity: isFlipping ? 0.2 : 0.6 }}
                                        className="h-[2px] bg-[#22D3EE]"
                                    />
                                    <span className="text-sm md:text-2xl font-black italic tracking-[0.4em] text-white/90 uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                        PLATFORM
                                    </span>
                                    <motion.div
                                        animate={{ width: isFlipping ? 16 : 60, opacity: isFlipping ? 0.2 : 0.6 }}
                                        className="h-[2px] bg-[#22D3EE]"
                                    />
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Cinematic Stripes */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        {[...Array(30)].map((_, i) => (
                            <div key={i} className="h-px w-full bg-white/10 mb-4" />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
