'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/useLanguageStore";

import { DotaTournamentOverview } from './components/DotaTournamentOverview';
import { CS2TournamentOverview } from './components/CS2TournamentOverview';
import { FC25TournamentOverview } from './components/FC25TournamentOverview';

type GameCategory = 'dota' | 'cs2' | 'fc25';

export default function TournamentHub() {
    const { t } = useLanguageStore();
    const [activeGame, setActiveGame] = useState<GameCategory>('dota');

    const navItems: { id: GameCategory; label: string; color: string }[] = [
        { id: 'dota', label: t.tournamentsPage.games.dota2.name.toUpperCase(), color: 'bg-[#DC2626]' },
        { id: 'cs2', label: t.tournamentsPage.games.cs2.name.toUpperCase(), color: 'bg-[#22D3EE]' },
        { id: 'fc25', label: t.tournamentsPage.games.fc25.name.toUpperCase(), color: 'bg-[#10B981]' },
    ];

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-white selection:text-black py-6 sm:py-10 px-4 sm:px-6">
            <div className="container mx-auto max-w-7xl">

                {/* Header */}
                <header className="mb-6 sm:mb-8 flex flex-col lg:flex-row lg:items-center justify-between border-l-4 border-white pl-4 sm:pl-6 gap-4 sm:gap-6">
                    <div className="flex flex-col">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none">
                            {t.tournamentsPage.selectArena}
                        </h1>
                        <p className="mt-2 text-[9px] sm:text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">
                            {t.tournamentsPage.chooseField}
                        </p>
                    </div>

                    {/* Navigation moved to header for compactness */}
                    <nav className="flex items-center relative z-30">
                        <div className="inline-flex bg-white/[0.02] border border-white/10 p-1 rounded-xl relative backdrop-blur-sm">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setActiveGame(item.id)}
                                    className={cn(
                                        "relative px-4 sm:px-8 py-2.5 sm:py-3 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all duration-300 cursor-pointer overflow-hidden",
                                        activeGame === item.id ? "text-white" : "text-white/30 hover:text-white/60"
                                    )}
                                >
                                    {activeGame === item.id && (
                                        <motion.div
                                            layoutId="hubActiveTab"
                                            className={cn("absolute inset-0 rounded-lg opacity-20 -z-10", item.color)}
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10 pointer-events-none">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </nav>
                </header>

                {/* Content */}
                <main className="relative min-h-[500px] border border-white/5 rounded-2xl sm:rounded-3xl bg-neutral-900/20 overflow-hidden p-4 sm:p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeGame}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            {activeGame === 'dota' && <DotaTournamentOverview />}
                            {activeGame === 'cs2' && <CS2TournamentOverview />}
                            {activeGame === 'fc25' && <FC25TournamentOverview />}
                        </motion.div>
                    </AnimatePresence>
                </main>

            </div>
        </div>
    );
}
