'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function PreloaderV3() {
    const [isLoading, setIsLoading] = useState(true);
    const [particles] = useState<{ x: number, y: number, duration: number }[]>(() =>
        [...Array(20)].map(() => ({
            x: Math.random() * 2000 - 1000,
            y: Math.random() * 2000 - 1000,
            duration: 3 + Math.random() * 2
        }))
    );
    const [barHeights] = useState<number[]>(() =>
        [...Array(15)].map(() => 30 + Math.random() * 40)
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 3500); // Decent time for all phases


        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                    transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#05080A] overflow-hidden"
                >
                    {/* Parallax Dust/Particles Background */}
                    {particles.map((p, i) => (
                        <motion.div
                            key={i}
                            initial={{
                                x: p.x,
                                y: p.y,
                                z: -500,
                                opacity: 0
                            }}
                            animate={{
                                z: 500,
                                opacity: [0, 1, 0],
                                rotate: 360
                            }}
                            transition={{
                                duration: p.duration,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            style={{ perspective: '1000px' }}
                            className="absolute w-1 h-1 bg-[#22D3EE] rounded-full blur-[1px]"
                        />
                    ))}

                    {/* HUD Layout Elements */}
                    <div className="absolute inset-0 p-10 flex flex-col justify-between pointer-events-none opacity-20">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <div className="w-20 h-[1px] bg-[#22D3EE]" />
                                <div className="text-[10px] font-mono text-[#22D3EE]">SYSTEM_BOOT_DH_V2</div>
                            </div>
                            <div className="text-[10px] font-mono text-[#22D3EE] text-right">
                                LATENCY: 0.04ms<br />
                                CORE: UP
                            </div>
                        </div>
                        <div className="flex justify-between items-end">
                            <div className="text-[10px] font-mono text-[#22D3EE]">
                                SECURE_CONNECTION: ACTIVE<br />
                                DH_PRO_LEVEL_ACCESS
                            </div>
                            <div className="w-20 h-[1px] bg-[#22D3EE] ml-auto" />
                        </div>
                    </div>

                    {/* Central Animation Hub */}
                    <div className="relative flex flex-col items-center">
                        {/* Spinning Rings HUD */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            className="absolute w-[300px] h-[300px] border-l-2 border-r-2 border-[#22D3EE]/10 rounded-full"
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                            className="absolute w-[350px] h-[350px] border-t-2 border-b-2 border-[#22D3EE]/5 rounded-full"
                        />

                        {/* Logo with Triple Glitch Layer */}
                        <div className="relative w-48 h-48">
                            {/* Cyan Glitch Shadow */}
                            <motion.div
                                animate={{
                                    x: [-2, 2, -1, 0],
                                    opacity: [0.5, 0.8, 0.5],
                                }}
                                transition={{ duration: 0.2, repeat: Infinity, repeatType: 'reverse' }}
                                className="absolute inset-0 brightness-150 saturate-200"
                            >
                                <Image src="/brand/dh.png" alt="DH" fill className="object-contain opacity-30 mix-blend-screen" />
                            </motion.div>

                            {/* Red Glitch Shadow */}
                            <motion.div
                                animate={{
                                    x: [2, -2, 1, 0],
                                    opacity: [0.3, 0.6, 0.3],
                                }}
                                transition={{ duration: 0.15, repeat: Infinity, repeatType: 'mirror' }}
                                className="absolute inset-0 hue-rotate-[180deg]"
                            >
                                <Image src="/brand/dh.png" alt="DH" fill className="object-contain opacity-20 mix-blend-screen" />
                            </motion.div>

                            {/* Main Logo */}
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                className="relative w-full h-full z-10"
                            >
                                <Image src="/brand/dh.png" alt="DEAF HUB" fill className="object-contain drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]" priority />
                            </motion.div>
                        </div>

                        {/* Powerful Text Reveal */}
                        <div className="mt-12 space-y-4 text-center">
                            <motion.h1
                                initial={{ letterSpacing: "-0.5em", opacity: 0, filter: 'blur(20px)' }}
                                animate={{ letterSpacing: "0.2em", opacity: 1, filter: 'blur(0px)' }}
                                transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
                                className="text-4xl md:text-6xl font-black text-white italic skew-x-[-10deg]"
                            >
                                DEAF <span className="text-[#22D3EE] drop-shadow-[0_0_15px_#22D3EE]">| HUB</span>
                            </motion.h1>

                            <div className="flex items-center justify-center gap-4">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: 100 }}
                                    transition={{ delay: 1, duration: 0.5 }}
                                    className="h-[2px] bg-gradient-to-r from-transparent to-[#22D3EE]"
                                />
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.5 }}
                                    className="text-[10px] md:text-xs font-bold font-mono text-[#22D3EE] tracking-[0.3em] uppercase"
                                >
                                    Elite Platform
                                </motion.span>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: 100 }}
                                    transition={{ delay: 1, duration: 0.5 }}
                                    className="h-[2px] bg-gradient-to-l from-transparent to-[#22D3EE]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Data Stream */}
                    <div className="absolute bottom-10 flex gap-1 items-end min-h-[40px]">
                        {barHeights.map((h, i) => (
                            <motion.div
                                key={i}
                                animate={{
                                    height: [10, h, 10],
                                    opacity: [0.2, 1, 0.2]
                                }}
                                transition={{
                                    duration: 1 + (i % 5) * 0.2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="w-[3px] bg-[#22D3EE]"
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}





