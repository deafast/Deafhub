'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function PreloaderV4() {
    const [isLoading, setIsLoading] = useState(true);
    const [paths, setPaths] = useState<string[]>([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 4000); // 4s for an epic build-up

        // Generate random paths once on mount
        const initialPaths = [...Array(6)].map(() =>
            `M ${Math.random() * 100}% ${Math.random() * 100}% L ${Math.random() * 100}% ${Math.random() * 100}% L ${Math.random() * 100}% ${Math.random() * 100}%`
        );
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPaths(initialPaths);

        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.5, filter: 'brightness(5) saturate(2)' }}
                    transition={{ duration: 1.2, ease: [0.85, 0, 0.15, 1] }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#020406] overflow-hidden"
                >
                    {/* Fractal Lightning Grid Background */}
                    <div className="absolute inset-0 opacity-10">
                        <svg width="100%" height="100%" className="w-full h-full">
                            <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#22D3EE" strokeWidth="0.5" />
                            </pattern>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                    </div>

                    {/* Electric Arcs (Randomly flashing SVG paths) */}
                    {paths.map((path, i) => (
                        <motion.svg
                            key={i}
                            className="absolute w-full h-full pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: [0, 1, 0, 0.8, 0],
                                transition: { delay: i * 0.4, duration: 0.3, repeat: Infinity, repeatDelay: 2 }
                            }}
                        >
                            <motion.path
                                d={path}
                                fill="none"
                                stroke="#22D3EE"
                                strokeWidth="2"
                                strokeDasharray="10 20"
                                className="opacity-40"
                            />
                        </motion.svg>
                    ))}

                    {/* Central Energy Sphere */}
                    <div className="relative">
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                                scale: [0, 1.2, 1],
                                opacity: 1,
                                boxShadow: [
                                    "0 0 0px #22D3EE00",
                                    "0 0 100px #22D3EE44",
                                    "0 0 40px #22D3EE22"
                                ]
                            }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                            className="relative z-20 w-56 h-56 flex items-center justify-center rounded-full bg-gradient-to-tr from-[#22D3EE11] to-transparent border border-[#22D3EE22]"
                        >
                            <motion.div
                                initial={{ rotate: 0 }}
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-[-20px] border border-dashed border-[#22D3EE33] rounded-full"
                            />

                            {/* Logo with Impact Flash */}
                            <motion.div
                                animate={{
                                    scale: [1, 1.05, 1],
                                    filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)']
                                }}
                                transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 2 }}
                                className="relative w-40 h-40"
                            >
                                <Image
                                    src="/brand/dh.png"
                                    alt="DEAF HUB"
                                    fill
                                    className="object-contain drop-shadow-[0_0_30px_#22D3EE66]"
                                    priority
                                />
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Heavy Brand Reveal */}
                    <div className="mt-16 text-center space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1, duration: 1 }}
                            className="flex items-baseline gap-6"
                        >
                            <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter text-white uppercase group">
                                DEAF
                                <motion.span
                                    animate={{ opacity: [1, 0, 1] }}
                                    transition={{ duration: 0.05, repeat: 10, repeatDelay: 1 }}
                                    className="text-[#22D3EE] mx-2"
                                >
                                    |
                                </motion.span>
                                <span className="text-[#22D3EE] relative">
                                    HUB
                                    {/* Ghost text for depth */}
                                    <span className="absolute inset-0 translate-x-1 translate-y-1 opacity-10 text-white">HUB</span>
                                </span>
                            </h2>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scaleX: 0 }}
                            animate={{ opacity: 1, scaleX: 1 }}
                            transition={{ delay: 2, duration: 0.8 }}
                            className="h-1 w-full bg-gradient-to-r from-transparent via-[#22D3EE] to-transparent"
                        />

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2.5 }}
                            className="text-sm font-bold tracking-[1em] text-[#22D3EE] uppercase"
                        >
                            The Next Evolution
                        </motion.p>
                    </div>

                    {/* Flash Frame Overlay (Occasional bright flashes) */}
                    <motion.div
                        animate={{
                            opacity: [0, 0.1, 0, 0.05, 0],
                        }}
                        transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 1.5 }}
                        className="absolute inset-0 bg-white pointer-events-none"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
