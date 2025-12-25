'use client';

import { motion } from 'framer-motion';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Fan, Power, Radio } from 'lucide-react';

export default function HomeV4() {
    const { t } = useLanguageStore();

    return (
        <div className="min-h-screen bg-black text-[#FF0055] selection:bg-[#00F3FF]/30 overflow-hidden relative">
            {/* Glitch Overlay */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-screen bg-[url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHlxYnVyeWJ4ZWZ4OHlxYnVyeWJ4ZWZ4OHlxYnVyeWJ4ZWZ4OHlxYnVyeWJ4ZWZ4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/oEI9uWUqW9ZUM/giphy.gif')] bg-cover" />

            {/* Background Noise & Static */}
            <div className="absolute inset-0 opacity-10 blur-[1px] pointer-events-none">
                <div className="w-full h-full bg-[repeating-linear-gradient(rgba(0,0,0,0)_0px,rgba(0,0,0,1)_2px,rgba(0,0,0,0)_4px)]" />
            </div>

            <main className="relative z-10 container mx-auto px-4 py-24">
                <header className="flex justify-between items-start mb-32">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[#00F3FF] font-bold text-xs uppercase italic tracking-tighter">
                            <Radio className="w-3 h-3 animate-pulse" /> Signal Active
                        </div>
                        <h2 className="text-xl font-black italic tracking-tighter text-white">DEAF|HUB // SYSTEM-X</h2>
                    </div>
                    <div className="p-4 border border-[#FF0055]/30">
                        <AlertTriangle className="text-[#FF0055] animate-bounce" />
                    </div>
                </header>

                <section className="space-y-8 relative">
                    <motion.div
                        initial={{ skewX: 20, opacity: 0 }}
                        animate={{ skewX: 0, opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="relative"
                    >
                        <h1 className="text-[12rem] md:text-[18rem] font-black italic tracking-tightest leading-none text-white uppercase mix-blend-difference">
                            ELITE<br />
                            <span className="text-[#00F3FF] drop-shadow-[4px_4px_0_#FF0055]">CHAMPS</span>
                        </h1>
                    </motion.div>

                    <p className="text-2xl text-[#00F3FF] font-black italic uppercase tracking-tighter max-w-xl">
                        &gt; {t.hero.subtitle}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6">
                        <Button size="lg" className="h-16 px-12 rounded-none bg-[#FF0055] text-white hover:bg-[#00F3FF] hover:text-black transition-all font-black italic text-2xl uppercase border-4 border-white">
                            GET ACCESS
                        </Button>
                        <Button variant="outline" size="lg" className="h-16 px-12 rounded-none border-4 border-[#00F3FF] bg-black text-[#00F3FF] hover:bg-[#00F3FF] hover:text-black transition-all font-black italic text-2xl uppercase">
                            COMM-LINK
                        </Button>
                    </div>
                </section>

                {/* BOTTOM DECORATIVE GRID */}
                <section className="mt-48 grid grid-cols-2 md:grid-cols-4 gap-1 border-t border-[#FF0055]/30 pt-4">
                    {[Fan, Power, Radio, Cpu].map((Icon, i) => (
                        <div key={i} className="p-12 border border-[#FF0055]/10 flex flex-col items-center justify-center gap-4 hover:bg-[#FF0055]/5 transition-colors">
                            <Icon className="w-12 h-12 text-[#FF0055]/40" />
                            <span className="text-[10px] uppercase font-black tracking-widest text-[#FF0055]/20">Module {i + 1}</span>
                        </div>
                    ))}
                </section>
            </main>
        </div>
    );
}

// Minimal placeholder so I can write other files without error
const Cpu = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m19-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
