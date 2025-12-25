'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function PreloaderV2() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 3200); // Slightly longer for cinematic effect

        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, ease: [0.43, 0.13, 0.23, 0.96] }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#09090B] overflow-hidden"
                >
                    {/* Subtle Ambient Light Pulse */}
                    <motion.div
                        animate={{
                            opacity: [0.1, 0.2, 0.1],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#22D3EE1A_0%,transparent_60%)]"
                    />

                    {/* Logo Assembly Animation */}
                    <div className="relative flex flex-col items-center">
                        {/* Background Glow */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            className="absolute inset-0 blur-[60px] bg-[#22D3EE22] rounded-full scale-150"
                        />

                        <div className="relative w-40 h-40 mb-12">
                            {/* Logo Main */}
                            <motion.div
                                initial={{ opacity: 0, scale: 1.2, filter: 'brightness(2) blur(20px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'brightness(1) blur(0px)' }}
                                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                                className="relative w-full h-full"
                            >
                                <Image
                                    src="/brand/dh.png"
                                    alt="DEAF HUB"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </motion.div>

                            {/* Shimmer Light Path */}
                            <motion.div
                                initial={{ left: '-150%', skewX: -45 }}
                                animate={{ left: '150%' }}
                                transition={{ delay: 1, duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
                                className="absolute inset-0 w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent z-10"
                            />
                        </div>

                        {/* Typography Reveal */}
                        <div className="relative text-center overflow-hidden">
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                                className="text-4xl md:text-6xl font-black tracking-widest text-white flex items-center gap-4"
                            >
                                <span>DEAF</span>
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "1.2em", opacity: 1 }}
                                    transition={{ delay: 1, duration: 0.8 }}
                                    className="w-[2px] bg-[#22D3EE]"
                                />
                                <span className="text-[#22D3EE]">HUB</span>
                            </motion.div>

                            <motion.p
                                initial={{ opacity: 0, letterSpacing: "0.2em" }}
                                animate={{ opacity: 1, letterSpacing: "0.5em" }}
                                transition={{ delay: 1.2, duration: 1.2 }}
                                className="mt-4 text-[10px] md:text-xs font-medium text-white/40 uppercase"
                            >
                                Ascending to Excellence
                            </motion.p>
                        </div>
                    </div>

                    {/* Side Lines Decoration */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 1.5, duration: 1 }}
                        className="absolute bottom-10 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-[#22D3EE44] to-transparent"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
