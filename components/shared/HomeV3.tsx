'use client';

import { motion } from 'framer-motion';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Button } from '@/components/ui/button';

export default function HomeV3() {
    const { t } = useLanguageStore();

    return (
        <div className="min-h-screen bg-[#0A0F14] text-white overflow-hidden flex flex-col items-center justify-center p-4">
            {/* SOFT AMBIENT GLOWS */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#22D3EE]/10 blur-[180px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#22D3EE]/5 blur-[150px] rounded-full" />
            </div>

            <div className="relative z-10 text-center space-y-16 max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, ease: "circOut" }}
                    className="space-y-6"
                >
                    <h4 className="text-sm font-bold tracking-[0.8em] text-[#22D3EE] uppercase opacity-60">The Platinum Standard</h4>
                    <h1 className="text-7xl md:text-[14rem] font-[1000] tracking-tighter leading-[0.8] uppercase select-none">
                        DEAF<br />
                        <span className="text-[#22D3EE] block mt-[-0.1em]">HUB</span>
                    </h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="space-y-12"
                >
                    <p className="text-2xl md:text-3xl text-white/40 max-w-3xl mx-auto font-light leading-relaxed tracking-tight">
                        {t.hero.subtitle}
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                        <Button size="lg" className="h-16 px-16 rounded-full bg-white text-black hover:bg-[#22D3EE] hover:text-black transition-all duration-500 font-black text-xl tracking-tighter">
                            {t.hero.joinNow}
                        </Button>
                        <Button variant="link" className="text-white/40 hover:text-[#22D3EE] transition-colors font-bold text-lg decoration-2 underline-offset-8 uppercase tracking-widest">
                            Explore History
                        </Button>
                    </div>
                </motion.div>

                {/* MINIMAL DISTINCTION LINE */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100px' }}
                    transition={{ delay: 1.5, duration: 1 }}
                    className="h-[2px] bg-[#22D3EE]/40 mx-auto"
                />
            </div>

            {/* SIDEBAR NAVIGATION STYLE DECOR */}
            <div className="fixed left-12 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-8 opacity-20">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-4 group cursor-pointer hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold tracking-widest">0{i}</span>
                        <div className="w-4 h-[1px] bg-white group-hover:w-12 transition-all" />
                    </div>
                ))}
            </div>
        </div>
    );
}
