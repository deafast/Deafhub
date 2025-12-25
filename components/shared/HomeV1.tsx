'use client';

import { motion } from 'framer-motion';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Button } from '@/components/ui/button';
import { Trophy, Target, Zap, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function HomeV1() {
    const { t } = useLanguageStore();
    const [isFirstMount, setIsFirstMount] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsFirstMount(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    // Spring configuration for "Oily" smoothness
    const springConfig = { type: 'spring' as const, stiffness: 300, damping: 30 };

    return (
        <div className="relative min-h-screen bg-[#0A0C10] text-white overflow-hidden font-sans">

            {/* TACTICAL STEALTH BACKGROUND LAYER */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* 1. Base Matte Charcoal Surface */}
                <div className="absolute inset-0 bg-[#0A0C10]" />

                {/* 2. Brushed Metal Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]" />

                {/* 3. Tactical Subtle Glows (Deep Blue/Cyan) */}
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#22D3EE]/5 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#22D3EE]/5 blur-[150px] rounded-full" />

                {/* 4. Glass Panel Reflections */}
                <div className="absolute inset-0 z-1 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/[0.02] via-transparent to-white/[0.01]" />
                    <div className="absolute top-[20%] right-[-10%] w-[40%] h-[150%] bg-gradient-to-l from-[#22D3EE]/5 to-transparent rotate-[25deg] blur-3xl opacity-50" />
                </div>

                {/* 5. Minimal Technical Markers */}
                <div className="absolute top-10 left-10 w-20 h-20 border-t border-l border-white/10" />
                <div className="absolute bottom-10 right-10 w-20 h-20 border-b border-r border-white/10" />
            </div>

            <div className="relative z-10 container mx-auto px-4 pt-48 pb-24">
                {/* HERO SECTION */}
                <section className="flex flex-col items-start space-y-12 max-w-5xl">
                    <motion.div
                        initial={isFirstMount ? { x: -100, opacity: 0 } : false}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                        className="space-y-4"
                    >
                        <div className="flex items-center gap-4">
                            <motion.div
                                animate={{ width: [0, 96] }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-[2px] bg-[#22D3EE] shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                            />
                            <span className="text-[#22D3EE] font-black tracking-[0.5em] uppercase text-sm">
                                {t.hero.evolution}
                            </span>
                        </div>
                        <h1 className="text-5xl md:text-8xl font-[1000] italic tracking-tightest leading-[0.85] uppercase">
                            DEAF<span className="text-[#22D3EE]">|</span>HUB <br />
                            <span className="text-white/20">ESPORTS</span>
                        </h1>
                    </motion.div>

                    <motion.p
                        initial={isFirstMount ? { y: 20, opacity: 0 } : false}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="text-xl md:text-2xl text-white/40 max-w-2xl font-medium leading-relaxed"
                    >
                        {t.hero.subtitle}
                    </motion.p>

                    <motion.div
                        initial={isFirstMount ? { scale: 0.8, opacity: 0 } : false}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        className="flex flex-wrap gap-6"
                    >
                        <Button size="lg" className="h-16 px-12 rounded-none bg-[#22D3EE] text-black hover:bg-white transition-all duration-300 font-[1000] italic text-xl uppercase skew-x-[-15deg] group overflow-hidden relative shadow-[0_10px_30px_rgba(34,211,238,0.3)]">
                            <motion.div
                                whileHover={{ x: 10 }}
                                transition={springConfig}
                                className="skew-x-[15deg] flex items-center gap-2 relative z-10"
                            >
                                {t.hero.joinNow} <ChevronRight className="w-6 h-6" />
                            </motion.div>
                        </Button>
                        <Button variant="outline" size="lg" className="h-16 px-12 rounded-none border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300 font-[1000] italic text-xl uppercase skew-x-[-15deg]">
                            <span className="skew-x-[15deg]">{t.hero.viewTournaments}</span>
                        </Button>
                    </motion.div>
                </section>

                {/* FEATURE GRID */}
                <section className="mt-48 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { title: t.features?.pro?.title || 'PRO LEAGUES', icon: Trophy, color: '#22D3EE', desc: t.features?.pro?.desc || 'Compete at the highest level.' },
                        { title: t.features?.teams?.title || 'ELITE TEAMS', icon: Target, color: '#FFFFFF', desc: t.features?.teams?.desc || 'Join the world class rosters.' },
                        { title: t.features?.pay?.title || 'INSTANT PAY', icon: Zap, color: '#22D3EE', desc: t.features?.pay?.desc || 'Fastest withdrawals in esports.' },
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={isFirstMount ? { y: 50, opacity: 0 } : false}
                            whileInView={{ y: 0, opacity: 1 }}
                            whileHover={{ y: -10 }}
                            viewport={{ once: true }}
                            transition={{ ...(springConfig as import('framer-motion').Transition), delay: isFirstMount ? i * 0.2 : 0 }}
                            className="relative p-10 bg-[#12161D] border border-white/5 shadow-2xl transition-all cursor-pointer group overflow-hidden"
                        >
                            {/* Technical Metal Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-50" />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]" />

                            <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-all duration-700">
                                <feature.icon size={130} />
                            </div>

                            <div className="relative z-10 flex flex-col gap-10">
                                <div className="p-5 bg-black/40 w-fit rounded-lg border border-white/10 group-hover:border-[#22D3EE]/50 transition-colors shadow-inner">
                                    <feature.icon className="w-8 h-8" style={{ color: feature.color }} />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-3xl font-[1000] italic uppercase tracking-tighter leading-none">{feature.title}</h3>
                                    <p className="text-white/30 font-medium leading-relaxed uppercase text-xs tracking-widest">{feature.desc}</p>
                                </div>
                            </div>

                            {/* Tactical Corner Accent */}
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#22D3EE]/0 group-hover:border-[#22D3EE]/50 transition-all duration-300" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#22D3EE]/0 group-hover:border-[#22D3EE]/50 transition-all duration-300" />
                        </motion.div>
                    ))}
                </section>
            </div>
        </div>
    );
}
