'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const FLIP_IMAGES = [
    'radial-gradient(circle, #22D3EE 0%, #0A0F14 100%)',
    'linear-gradient(45deg, #0A0F14 0%, #22D3EE 100%)',
    'linear-gradient(to bottom, #22D3EE 0%, #0A0F14 100%)',
    'radial-gradient(circle, #EAFBFF 0%, #22D3EE 100%)',
    'linear-gradient(135deg, #22D3EE 0%, #0A0F14 100%)',
    'linear-gradient(to right, #0A0F14 0%, #22D3EE 100%)',
];

export default function PreloaderV6() {
    const [isLoading, setIsLoading] = useState(true);
    const [currentFrame, setCurrentFrame] = useState(0);

    useEffect(() => {
        // Rapid flickering like Marvel intro
        const interval = setInterval(() => {
            setCurrentFrame((prev) => (prev + 1) % FLIP_IMAGES.length);
        }, 80); // 80ms for that fast flip feel

        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 3500);

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
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0F14] overflow-hidden"
                >
                    {/* Rapid Flip Container */}
                    <div className="relative w-full h-full flex items-center justify-center">
                        {/* The "Marvel" Red Box Style - Background for DH */}
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: '90%', opacity: 1 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="absolute h-48 md:h-72 bg-[#22D3EE] flex items-center justify-center overflow-hidden"
                        >
                            {/* Flickering Background Patterns */}
                            <div
                                className="absolute inset-0 transition-all duration-75"
                                style={{ background: FLIP_IMAGES[currentFrame] }}
                            />

                            {/* Masked Logo Reveal */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 1, duration: 1, ease: "circOut" }}
                                className="relative z-10 w-full h-full flex items-center justify-center bg-[#0A0F14]"
                                style={{ clipPath: 'inset(2% 2% 2% 2%)' }}
                            >
                                <div className="flex items-center gap-2 md:gap-4 px-8 py-4">
                                    <span className="text-4xl md:text-8xl font-[1000] italic tracking-tightest text-white uppercase">
                                        DEAF
                                    </span>
                                    <div className="w-[4px] md:w-[8px] h-[32px] md:h-[64px] bg-[#22D3EE] skew-x-[-15deg]" />
                                    <span className="text-4xl md:text-8xl font-[1000] italic tracking-tightest text-[#22D3EE] uppercase">
                                        HUB
                                    </span>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Flipping Line Overlays */}
                        <motion.div
                            animate={{
                                left: ['-100%', '100%']
                            }}
                            transition={{
                                duration: 0.4,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="absolute top-0 bottom-0 w-[100px] bg-white/10 skew-x-[20deg] pointer-events-none"
                        />
                    </div>

                    {/* Bottom Title Reveal */}
                    <div className="absolute bottom-20 text-center">
                        <motion.div
                            initial={{ opacity: 0, letterSpacing: '2em' }}
                            animate={{ opacity: 1, letterSpacing: '0.8em' }}
                            transition={{ delay: 2, duration: 1 }}
                            className="text-[#22D3EE] font-black text-sm md:text-xl tracking-[0.8em] uppercase"
                        >
                            ESPORT PLATFORM
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
