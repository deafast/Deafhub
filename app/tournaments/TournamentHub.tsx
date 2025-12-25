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
        <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-white selection:text-black py-20 px-6">
            <div className="container mx-auto max-w-5xl">

                {/* Header */}
                <header className="mb-12 text-center md:text-left">
                    <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none border-l-8 border-white pl-6">
                        {t.tournamentsPage.selectArena}
                    </h1>
                    <p className="mt-4 text-sm md:text-base text-white/40 max-w-2xl pl-6">
                        {t.tournamentsPage.chooseField}
                    </p>
                </header>

                {/* Navigation */}
                <nav className="mb-12 flex justify-center md:justify-start relative z-30">
                    <div className="inline-flex bg-white/[0.03] border border-white/5 p-1 rounded-2xl relative">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    setActiveGame(item.id);
                                }}
                                className={cn(
                                    "relative px-10 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 cursor-pointer overflow-hidden",
                                    activeGame === item.id ? "text-white" : "text-white/30 hover:text-white/60"
                                )}
                            >
                                {activeGame === item.id && (
                                    <motion.div
                                        layoutId="hubActiveTab"
                                        className={cn("absolute inset-0 rounded-xl opacity-20 -z-10", item.color)}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10 pointer-events-none">{item.label}</span>
                                {activeGame === item.id && (
                                    <motion.div
                                        layoutId="hubActiveGlow"
                                        className={cn("absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full pointer-events-none", item.color)}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Content */}
                <main className="relative min-h-[500px] border border-white/5 rounded-3xl bg-neutral-900/20 overflow-hidden p-8">
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
