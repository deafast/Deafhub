'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function Preloader() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate initial loading or just a fixed delay for the intro
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2800); // 2.8s total duration

        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0A0F14] overflow-hidden"
                >
                    {/* Cyberpunk grid overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.1)_0%,transparent_70%)] pointer-events-none" />
                    <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

                    {/* Logo Animation */}
                    <div className="relative">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, filter: 'blur(10px)' }}
                            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="relative w-32 h-32 md:w-48 md:h-48"
                        >
                            <Image
                                src="/brand/dh.png"
                                alt="DEAF HUB"
                                fill
                                className="object-contain"
                                priority
                            />
                        </motion.div>

                        {/* Glitch circles */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: [0, 0.5, 0], scale: [1, 1.5, 2] }}
                            transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1] }}
                            className="absolute inset-0 rounded-full border border-[#22D3EE]/30"
                        />
                    </div>

                    {/* Text reveal */}
                    <div className="mt-8 flex flex-col items-center gap-2 overflow-hidden">
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="text-3xl md:text-5xl font-black tracking-tighter"
                        >
                            DEAF <span className="text-[#22D3EE]">|</span> <span className="text-[#22D3EE]">HUB</span>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0.5, 1] }}
                            transition={{ delay: 1.2, duration: 0.5 }}
                            className="text-[10px] md:text-xs font-bold tracking-[0.4em] text-[#22D3EE]/60 uppercase ml-2"
                        >
                            Initializing Protocol...
                        </motion.div>
                    </div>

                    {/* Animated progress line */}
                    <div className="absolute bottom-20 w-48 h-[2px] bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ left: '-100%' }}
                            animate={{ left: '100%' }}
                            transition={{ duration: 2, ease: 'easeInOut' }}
                            className="absolute inset-0 bg-[#22D3EE] shadow-[0_0_15px_#22D3EE]"
                        />
                    </div>

                    {/* Scanning line effect */}
                    <motion.div
                        initial={{ top: '-10%' }}
                        animate={{ top: '110%' }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        className="absolute left-0 right-0 h-[100px] bg-gradient-to-b from-transparent via-[#22D3EE]/5 to-transparent pointer-events-none"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
