'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const FLIP_IMAGES = [
    // Specific Dota 2 Hero Artwork (High Contrast)
    'url("https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop")', // Base Esports
    'url("https://images2.alphacoders.com/474/474206.jpg")', // Dota 2 Juggernaut
    'url("https://images3.alphacoders.com/105/1053075.jpg")', // CS:GO/CS2 Agent
    'url("https://images.alphacoders.com/270/270241.jpg")', // Dota 2 Crystal Maiden
    'url("https://images2.alphacoders.com/133/1330368.png")', // CS2 Gameplay/Agent
    'url("https://images7.alphacoders.com/613/613941.jpg")', // Dota 2 Anti-Mage
    'url("https://images5.alphacoders.com/133/1333703.jpeg")', // CS2 Counter-Terrorists
];

export default function PreloaderV7() {
    const [isLoading, setIsLoading] = useState(true);
    const [currentFrame, setCurrentFrame] = useState(0);

    useEffect(() => {
        // Rapid image flipping for the Marvel effect
        const interval = setInterval(() => {
            setCurrentFrame((prev) => (prev + 1) % FLIP_IMAGES.length);
        }, 70);

        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 4500);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, []);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.2, filter: 'blur(30px)' }}
                    transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#020406] overflow-hidden"
                >
                    {/* Subtle Grain Overlay */}
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                    {/* Marvel Main Container */}
                    <div className="relative flex flex-col items-center">

                        {/* The Cinematic Reveal Box */}
                        <motion.div
                            initial={{ scaleY: 0, opacity: 0 }}
                            animate={{ scaleY: 1, opacity: 1 }}
                            transition={{ duration: 0.8, ease: "circOut" }}
                            className="relative p-6 md:p-12 border-2 border-[#22D3EE]/40 flex items-center justify-center overflow-hidden bg-[#0A0F14]"
                        >
                            {/* Internal Flipping Background (Subtle) */}
                            <div
                                className="absolute inset-0 transition-opacity duration-300 opacity-20 pointer-events-none"
                                style={{
                                    backgroundImage: FLIP_IMAGES[currentFrame],
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    filter: 'grayscale(0.5) brightness(0.4)'
                                }}
                            />

                            {/* Text Mask - EXTREME Contrast & Brightness for Character Visibility */}
                            <h1
                                className="relative text-7xl md:text-9xl font-[1000] italic tracking-tighter uppercase leading-none"
                                style={{
                                    color: 'transparent',
                                    WebkitBackgroundClip: 'text',
                                    backgroundClip: 'text',
                                    backgroundImage: FLIP_IMAGES[currentFrame],
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    filter: 'brightness(2.8) contrast(1.8) saturate(1.8)', // Boosted significantly
                                    transition: 'background-image 0s' // Instant flip like actual film
                                }}
                            >
                                DEAF|HUB
                            </h1>

                            {/* Flash Frame effect (Simulates projector flicker) */}
                            <motion.div
                                animate={{ opacity: [0, 0.1, 0] }}
                                transition={{ duration: 0.05, repeat: Infinity, repeatDelay: 0.1 }}
                                className="absolute inset-0 bg-[#22D3EE]/10 pointer-events-none"
                            />
                        </motion.div>

                        {/* Bottom Slogan */}
                        <div className="mt-12 overflow-hidden text-center">
                            <motion.div
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
                                className="flex flex-col items-center gap-4"
                            >
                                <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-[#22D3EE] to-transparent" />
                                <span className="text-sm md:text-lg font-black tracking-[1.2em] text-[#22D3EE] uppercase drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]">
                                    ESPORT PLATFORM
                                </span>
                                <div className="h-[1px] w-64 bg-white/10" />
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
