'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function PreloaderV5() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 4500); // Epic 4.5s build-up

        return () => clearTimeout(timer);
    }, []);

    // Professional Easing
    const epicEase = [0.22, 1, 0.36, 1] as const;

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        scale: 1.05,
                        filter: 'brightness(1.5) blur(30px)'
                    }}
                    transition={{ duration: 1.2, ease: epicEase }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#07090C] overflow-hidden"
                >
                    {/* 1. LAYER: Deep Ambient Aurora */}
                    <motion.div
                        animate={{
                            background: [
                                'radial-gradient(circle at 50% 50%, #22D3EE05 0%, transparent 70%)',
                                'radial-gradient(circle at 60% 40%, #22D3EE10 0%, transparent 60%)',
                                'radial-gradient(circle at 40% 60%, #22D3EE05 0%, transparent 70%)'
                            ]
                        }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 pointer-events-none"
                    />

                    {/* 2. LAYER: Static HUD Elements (Subtle) */}
                    <div className="absolute inset-0 p-8 flex flex-col justify-between opacity-30 pointer-events-none">
                        <div className="flex justify-between">
                            <div className="space-y-2">
                                <motion.div initial={{ width: 0 }} animate={{ width: 60 }} transition={{ delay: 0.5 }} className="h-[1px] bg-[#22D3EE]" />
                                <div className="text-[9px] font-mono tracking-widest text-[#22D3EE]">V5_ESTABLISHED</div>
                            </div>
                            <div className="text-[9px] font-mono tracking-widest text-[#22D3EE] text-right">
                                SCANNING_ASSETS... [OK]<br />
                                FRAME_RATE: 240HZ_READY
                            </div>
                        </div>
                        <div className="flex justify-between items-end">
                            <div className="text-[9px] font-mono tracking-widest text-[#22D3EE]">
                                DH_PRO_LEVEL_ENCRYPTED<br />
                                STABLE_INTRACORE
                            </div>
                            <motion.div initial={{ width: 0 }} animate={{ width: 60 }} transition={{ delay: 0.5 }} className="h-[1px] bg-[#22D3EE]" />
                        </div>
                    </div>

                    {/* 3. LAYER: The Energy Core */}
                    <div className="relative flex flex-col items-center">
                        {/* Outer Orbitals */}
                        <motion.div
                            initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                            animate={{ opacity: 1, rotate: 0, scale: 1 }}
                            transition={{ duration: 2, ease: epicEase }}
                            className="absolute w-[400px] h-[400px]"
                        >
                            <svg viewBox="0 0 100 100" className="w-full h-full opacity-10">
                                <circle cx="50" cy="50" r="48" fill="none" stroke="#22D3EE" strokeWidth="0.2" strokeDasharray="1 3" />
                                <motion.circle
                                    cx="50" cy="50" r="48"
                                    fill="none" stroke="#22D3EE" strokeWidth="0.5"
                                    strokeDasharray="20 80"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                />
                            </svg>
                        </motion.div>

                        {/* Logo Container */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: epicEase }}
                            className="relative w-48 h-48 z-10"
                        >
                            {/* Inner Energy Glow */}
                            <motion.div
                                animate={{
                                    scale: [1, 1.1, 1],
                                    opacity: [0.3, 0.6, 0.3]
                                }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-[-10px] bg-[#22D3EE] rounded-full blur-[40px] opacity-20"
                            />

                            <Image
                                src="/brand/dh.png"
                                alt="DEAF HUB"
                                fill
                                className="object-contain drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                                priority
                            />
                        </motion.div>
                    </div>

                    {/* 4. LAYER: Typography (Clean & Bold) */}
                    <div className="mt-16 text-center space-y-4">
                        <div className="relative overflow-hidden">
                            <motion.h1
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.8, duration: 1, ease: epicEase }}
                                className="text-5xl md:text-7xl font-black italic tracking-tighter"
                            >
                                DEAF <span className="text-[#22D3EE]">| HUB</span>
                            </motion.h1>
                        </div>

                        <motion.div
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ delay: 1.5, duration: 1.2, ease: epicEase }}
                            className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#22D3EE] to-transparent"
                        />

                        <motion.div
                            variants={{
                                show: {
                                    transition: {
                                        staggerChildren: 0.05,
                                        delayChildren: 2
                                    }
                                }
                            }}
                            initial="hidden"
                            animate="show"
                            className="flex items-center justify-center gap-1 md:gap-3"
                        >
                            {"ESPORT PLATFORM".split("").map((char, i) => (
                                <motion.span
                                    key={i}
                                    variants={{
                                        hidden: { opacity: 0, y: 15, filter: 'blur(10px)' },
                                        show: {
                                            opacity: 1,
                                            y: 0,
                                            filter: 'blur(0px)',
                                            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
                                        }
                                    }}
                                    className="text-[10px] md:text-sm font-bold tracking-[0.3em] md:tracking-[0.5em] text-[#22D3EE] drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]"
                                >
                                    {char === " " ? "\u00A0" : char}
                                </motion.span>
                            ))}
                        </motion.div>
                    </div>

                    {/* 5. LAYER: Smooth Power-In Effect (No hard flashing) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.1, 0] }}
                        transition={{ delay: 2.5, duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-[#22D3EE] mix-blend-overlay pointer-events-none"
                    />

                    {/* Scanline Overlay */}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[size:100%_4px,3px_100%] opacity-20" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
