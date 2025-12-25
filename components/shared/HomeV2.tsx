'use client';

import { motion } from 'framer-motion';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Button } from '@/components/ui/button';
import { Activity, Shield, Cpu, ExternalLink } from 'lucide-react';

export default function HomeV2() {
    const { t } = useLanguageStore();

    return (
        <div className="min-h-screen bg-[#05070A] text-[#EAFBFF] font-mono selection:bg-[#22D3EE]/30 overflow-hidden">
            {/* HUD OVERLAY LAYER */}
            <div className="fixed inset-0 pointer-events-none z-50">
                <div className="absolute top-0 left-0 w-full h-24 border-b border-[#22D3EE]/10 bg-gradient-to-b from-[#22D3EE]/5 to-transparent" />
                <div className="absolute top-8 left-8 flex gap-4 text-[10px] tracking-widest text-[#22D3EE]/40 uppercase">
                    <span>System: Active</span>
                    <span>{"//"}</span>
                    <span>Link: Established</span>
                    <span>{"//"}</span>
                    <span>Latency: 12ms</span>
                </div>
                {/* Corner Brackets */}
                <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#22D3EE]/30" />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#22D3EE]/30" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#22D3EE]/30" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#22D3EE]/30" />
            </div>

            <div className="relative z-10 container mx-auto px-4 pt-48">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* LEFT CONTENT */}
                    <div className="lg:col-span-7 space-y-12">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-3 px-4 py-2 bg-[#22D3EE]/5 border border-[#22D3EE]/20 rounded-full"
                        >
                            <div className="w-2 h-2 rounded-full bg-[#22D3EE] animate-pulse shadow-[0_0_10px_#22D3EE]" />
                            <span className="text-xs font-bold tracking-[0.2em] text-[#22D3EE] uppercase">DH | Tactical Interface Loaded</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-6xl md:text-8xl font-black tracking-tight leading-none uppercase"
                        >
                            Superior <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22D3EE] to-white">Performance</span>
                        </motion.h1>

                        <p className="text-lg text-[#22D3EE]/60 max-w-xl font-medium border-l-2 border-[#22D3EE]/30 pl-6">
                            {t.hero.subtitle}
                        </p>

                        <div className="flex gap-4">
                            <Button className="h-14 px-10 rounded-none bg-[#22D3EE] text-black hover:shadow-[0_0_30px_#22D3EE] transition-all font-black uppercase text-sm tracking-widest">
                                {t.hero.joinNow}
                            </Button>
                            <Button variant="outline" className="h-14 px-10 rounded-none border-[#22D3EE]/30 bg-white/5 hover:bg-[#22D3EE]/10 transition-all font-black uppercase text-sm tracking-widest">
                                Data Stream
                            </Button>
                        </div>
                    </div>

                    {/* RIGHT TECH SPECS */}
                    <div className="lg:col-span-5 hidden lg:block">
                        <div className="relative border border-[#22D3EE]/10 bg-[#22D3EE]/5 p-8 backdrop-blur-md">
                            <div className="flex justify-between items-center mb-8 border-b border-[#22D3EE]/10 pb-4">
                                <h4 className="text-sm font-bold tracking-widest uppercase">Live Metrics</h4>
                                <Activity className="w-4 h-4 text-[#22D3EE]" />
                            </div>
                            <div className="space-y-6">
                                {[
                                    { label: 'Network Uptime', val: '99.9%' },
                                    { label: 'Active Nodes', val: '4,208' },
                                    { label: 'Security Layer', val: 'Vanguard' },
                                    { label: 'Data Encryption', val: 'AES-256' },
                                ].map((stat, i) => (
                                    <div key={i} className="flex flex-col gap-2">
                                        <div className="flex justify-between text-[10px] text-[#22D3EE]/40 uppercase tracking-widest">
                                            <span>{stat.label}</span>
                                            <span>{stat.val}</span>
                                        </div>
                                        <div className="h-1 bg-[#22D3EE]/10 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: 2, delay: i * 0.2 }}
                                                className="h-full bg-[#22D3EE]"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM QUICK STATS */}
                <section className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#22D3EE]/10">
                    {[
                        { label: 'Verified Pros', val: '1.2k', icon: Shield },
                        { label: 'API Requests', val: '8.4M', icon: Cpu },
                        { label: 'Global Nodes', val: '142', icon: ExternalLink },
                    ].map((item, i) => (
                        <div key={i} className="p-8 border-r last:border-r-0 border-[#22D3EE]/10 hover:bg-[#22D3EE]/5 transition-colors group">
                            <item.icon className="w-8 h-8 text-[#22D3EE]/40 mb-4 group-hover:text-[#22D3EE] transition-colors" />
                            <div className="text-4xl font-black mb-1">{item.val}</div>
                            <div className="text-[10px] uppercase tracking-[0.3em] text-[#22D3EE]/30">{item.label}</div>
                        </div>
                    ))}
                </section>
            </div>
        </div>
    );
}
