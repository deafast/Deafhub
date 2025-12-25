'use client';

import { motion } from 'framer-motion';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Button } from '@/components/ui/button';
import { MousePointer2, Layers, Box } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function HomeV5() {
    const { t } = useLanguageStore();
    const [boxes, setBoxes] = useState<{ width: number, height: number, left: string, top: string, z: number, duration: number, delay: number }[]>([]);

    useEffect(() => {
        const initialBoxes = [...Array(20)].map(() => ({
            width: 100 + Math.random() * 200,
            height: 100 + Math.random() * 200,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            z: Math.random() * -500,
            duration: 5 + Math.random() * 5,
            delay: Math.random() * 5
        }));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBoxes(initialBoxes);
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white overflow-hidden perspective-1000">
            {/* 3D FLOATING BACKGROUND DECOR */}
            <div className="absolute inset-0 z-0">
                {boxes.map((box, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -40, 0],
                            rotateZ: [0, 10, 0],
                            opacity: [0.1, 0.3, 0.1]
                        }}
                        transition={{
                            duration: box.duration,
                            repeat: Infinity,
                            delay: box.delay
                        }}
                        className="absolute bg-[#22D3EE]/10 border border-[#22D3EE]/20 backdrop-blur-3xl rounded-3xl"
                        style={{
                            width: box.width,
                            height: box.height,
                            left: box.left,
                            top: box.top,
                            transform: `translateZ(${box.z}px)`
                        }}
                    />
                ))}
            </div>

            <main className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
                <motion.div
                    initial={{ rotateX: 45, opacity: 0, scale: 0.8 }}
                    animate={{ rotateX: 0, opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="text-center space-y-12"
                >
                    <div className="inline-block p-4 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-xl mb-8">
                        <div className="flex items-center gap-4 px-6 text-sm font-bold tracking-[0.4em] uppercase text-[#22D3EE]">
                            <Box className="w-4 h-4" /> 3D Spatial Interface
                        </div>
                    </div>

                    <h1 className="text-8xl md:text-[12rem] font-black italic tracking-tightest leading-none uppercase drop-shadow-[0_20px_50px_rgba(34,211,238,0.4)]">
                        FUTURE <br />
                        <span className="text-[#22D3EE]">DH-CORE</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-white/40 max-w-2xl mx-auto font-medium leading-relaxed">
                        {t.hero.subtitle}
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 pt-12">
                        <Button size="lg" className="h-16 px-16 rounded-[2rem] bg-[#22D3EE] text-black hover:scale-110 transition-transform duration-500 font-black text-xl shadow-[0_10px_40px_rgba(34,211,238,0.5)]">
                            {t.hero.joinNow}
                        </Button>
                        <Button variant="outline" size="lg" className="h-16 px-16 rounded-[2rem] border-white/10 bg-white/5 hover:bg-white/10 transition-all font-black text-xl">
                            Virtual View
                        </Button>
                    </div>
                </motion.div>

                {/* INTERACTIVE HINT */}
                <div className="mt-32 flex items-center gap-4 opacity-30 text-xs font-bold tracking-[0.5em] uppercase">
                    <MousePointer2 className="w-4 h-4" /> Move mouse to explore
                </div>
            </main>

            {/* FLOAT CARDS AT BOTTOM */}
            <div className="fixed bottom-12 left-0 w-full flex justify-center gap-8 hidden xl:flex">
                {[
                    { label: 'Layer Alpha', icon: Layers },
                    { label: 'Spatial Node', icon: Box },
                    { label: 'User Data', icon: MousePointer2 },
                ].map((card, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -20, scale: 1.05 }}
                        className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl w-64 space-y-4 cursor-pointer"
                    >
                        <card.icon className="text-[#22D3EE] w-6 h-6" />
                        <div className="text-xs font-black uppercase tracking-widest">{card.label}</div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
