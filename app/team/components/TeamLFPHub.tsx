'use client';

import React, { useState } from 'react';
import { Search, Users, Trophy, Star, Shield, Zap, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '../../../components/ui/input';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/store/useLanguageStore';

type GameMode = 'dota2' | 'cs2';

interface TeamData {
    id: string;
    rank: string;
    name: string;
    logo: string;
    slots: string;
    rating: number;
}

interface AgentData {
    id: string;
    nickname: string;
    avatar: string;
    online: boolean;
    rankInfo: string;
    role: string;
}

const PREMIUM_EASING = [0.2, 0.8, 0.2, 1] as any;

export default function TeamLFPHub() {
    const { t } = useLanguageStore();
    const [gameMode, setGameMode] = useState<GameMode>('dota2');

    const accentColor = gameMode === 'dota2' ? '#22D3EE' : '#FF7A18';
    const accentClass = gameMode === 'dota2' ? 'text-cyan-400' : 'text-orange-500';
    const borderAccent = gameMode === 'dota2' ? 'hover:border-cyan-400/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)]' : 'hover:border-orange-500/30 hover:shadow-[0_0_20px_rgba(255,122,24,0.1)]';
    const accentBg = gameMode === 'dota2' ? 'bg-cyan-400' : 'bg-orange-500';

    const teams: TeamData[] = [
        { id: '1', rank: '#01', name: 'SOLARIS ESPORTS', logo: 'S', slots: '4 / 5', rating: 2850 },
        { id: '2', rank: '#02', name: 'CYBER WOLVES', logo: 'W', slots: '3 / 5', rating: 2720 },
        { id: '3', rank: '#03', name: 'DEAF TITANS', logo: 'T', slots: '5 / 5', rating: 2680 },
        { id: '4', rank: '#04', name: 'NIGHT RAIDERS', logo: 'N', slots: '2 / 5', rating: 2540 },
        { id: '5', rank: '#05', name: 'VOID WALKERS', logo: 'V', slots: '4 / 5', rating: 2490 },
    ];

    const agents: AgentData[] = [
        { id: '1', nickname: 'SilentKiller', avatar: 'S', online: true, rankInfo: gameMode === 'dota2' ? 'Immortal 1100' : 'Faceit 10', role: gameMode === 'dota2' ? 'POS 1' : 'Sniper' },
        { id: '2', nickname: 'GhostStep', avatar: 'G', online: true, rankInfo: gameMode === 'dota2' ? 'Divine 5' : 'Faceit 9', role: gameMode === 'dota2' ? 'POS 2' : 'Entry' },
        { id: '3', nickname: 'NeonPanda', avatar: 'N', online: false, rankInfo: gameMode === 'dota2' ? 'Ancient 4' : 'Faceit 8', role: gameMode === 'dota2' ? 'Support' : 'Lurker' },
        { id: '4', nickname: 'EchoKnight', avatar: 'E', online: true, rankInfo: gameMode === 'dota2' ? 'Immortal 300' : 'Faceit 10', role: gameMode === 'dota2' ? 'POS 3' : 'IGL' },
    ];

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 relative z-10">
            {/* Background Image Layers */}
            <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-black">
                <AnimatePresence>
                    <motion.div
                        key={gameMode}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: gameMode === 'dota2' ? 0.35 : 0.65 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{
                            backgroundImage: `url(/images/backgrounds/${gameMode === 'cs2' ? 'cs2-bg-v2.jpg' : 'dota2-bg.png'})`,
                        }}
                    >
                        {/* Dota 2 Specific Overlay: Replace "THE INTERNATIONAL" */}
                        {gameMode === 'dota2' && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-90">
                                <div className="mt-[2.35%] ml-[0.35%] px-32 py-1 bg-[#121010] border-y border-zinc-500/10">
                                    <span className="text-[1.8vw] font-[1000] italic text-white tracking-[0.45em] uppercase">DEAF|HUB</span>
                                </div>
                            </div>
                        )}

                        {/* CS2 Specific Tactical Overlay - ЭТО СОЗДАЕТ ПРЕМИУМ ВИД ТЕРМИНАЛА */}
                        {gameMode === 'cs2' && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {/* Orange Scanlines */}
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.06)_1px,transparent_1px)] bg-[size:100%_3px] opacity-70" />

                                {/* Tactical Border Glow */}
                                <div className="absolute inset-0 border-[30px] border-orange-500/5 blur-2xl" />

                                {/* Radar/Targeting Crosshair (Center) */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] border border-orange-500/10 rounded-full">
                                    <div className="absolute top-1/2 left-0 w-full h-px bg-orange-500/5" />
                                    <div className="absolute left-1/2 top-0 w-px h-full bg-orange-500/5" />
                                </div>

                                {/* Terminal Data Points */}
                                <div className="absolute bottom-12 left-12 space-y-2 font-mono text-[10px] text-orange-500/50 uppercase tracking-widest hidden md:block">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-orange-500 animate-pulse" />
                                        <span>SYSTEM_LINK: ESTABLISHED</span>
                                    </div>
                                    <div>LOC: DE_MIRAGE_CENTER</div>
                                    <div>FREQ: 5.4GHZ_STABLE</div>
                                </div>

                                <div className="absolute top-12 right-12 text-right space-y-2 font-mono text-[10px] text-orange-500/50 uppercase tracking-widest hidden md:block">
                                    <div>PACKET_SCAN: PASS</div>
                                    <div className="text-orange-500/70">THREAT_LEVEL: ZERO</div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
            </div>

            {/* Header with Game Mode Toggle */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-2 border-b border-zinc-800/10">
                <div className="flex flex-col">
                    <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2 mb-1">
                        <span className="w-6 h-px bg-zinc-800" />
                        {t.teamHub.system_status}
                    </div>
                    <h1 className="text-3xl font-[1000] italic uppercase tracking-tighter text-white leading-none">
                        {t.teamHub.hub_main} <span className={accentClass}>{t.teamHub.hub_sub}</span>
                    </h1>
                </div>

                <div className="flex items-center p-1 bg-zinc-900/40 border border-zinc-800/50 rounded-sm">
                    <button
                        onClick={() => setGameMode('dota2')}
                        className={cn(
                            "relative px-4 py-1.5 text-[9px] font-black tracking-[0.15em] transition-all uppercase",
                            gameMode === 'dota2' ? "text-black" : "text-zinc-500 hover:text-white"
                        )}
                    >
                        {gameMode === 'dota2' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10">DOTA 2</span>
                    </button>
                    <button
                        onClick={() => setGameMode('cs2')}
                        className={cn(
                            "relative px-4 py-1.5 text-[9px] font-black tracking-[0.15em] transition-all uppercase",
                            gameMode === 'cs2' ? "text-black" : "text-zinc-500 hover:text-white"
                        )}
                    >
                        {gameMode === 'cs2' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10">CS 2</span>
                    </button>
                </div>
            </div>

            {/* Main Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-0 border border-zinc-800 bg-[#000000]/85 backdrop-blur-md min-h-[750px] relative overflow-hidden">
                {/* Decorative Brackets */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-zinc-700" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-zinc-700" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-zinc-700" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-zinc-700" />

                {/* LEFT SECTION: Team Finder (60%) */}
                <div className="lg:col-span-6 p-4 sm:p-8 border-b lg:border-b-0 lg:border-r border-zinc-800/80 space-y-6 sm:space-y-8 bg-gradient-to-br from-zinc-900/10 to-transparent">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                            <h2 className="text-2xl sm:text-3xl font-[1000] italic uppercase tracking-tighter text-white">
                                {t.teamHub.teams_title}
                            </h2>
                            <div className="text-[9px] sm:text-[10px] font-mono text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                <Search className="w-3 h-3" />
                                {t.teamHub.scanning}
                            </div>
                        </div>

                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <Input
                                placeholder={t.teamHub.search_placeholder}
                                className="bg-zinc-900/40 border-zinc-800/80 backdrop-blur-xl rounded-full pl-11 h-11 text-xs focus:ring-1 focus:ring-zinc-500 transition-all border-white/5 placeholder:text-zinc-400"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {teams.map((team, idx) => (
                                <motion.div
                                    key={`${gameMode}-${team.id}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3, delay: idx * 0.05, ease: PREMIUM_EASING }}
                                    whileHover={{ y: -2, backgroundColor: "rgba(255,255,255,0.02)" }}
                                    whileTap={{ scale: 0.99 }}
                                    className={cn(
                                        "group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border border-zinc-800/40 transition-all cursor-pointer relative overflow-hidden gap-4",
                                        borderAccent
                                    )}
                                >
                                    {/* Scanline Effect on Hover */}
                                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] z-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ backgroundSize: '100% 2px, 3px 100%' }} />

                                    <div className="flex items-center gap-3 sm:gap-6 relative z-10">
                                        <span className="text-2xl sm:text-3xl font-[1000] italic text-zinc-700 group-hover:text-white/30 transition-colors duration-500 font-mono">
                                            {team.rank}
                                        </span>
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-zinc-900 border border-zinc-700 flex items-center justify-center font-black text-lg sm:text-xl group-hover:border-zinc-500 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all">
                                            {team.logo}
                                        </div>
                                        <div className="space-y-1.5">
                                            <h3 className="text-base font-black text-white tracking-wider group-hover:text-cyan-50 transition-colors uppercase">{team.name}</h3>
                                            <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-300">
                                                <div className="flex items-center gap-1.5 bg-zinc-900/90 px-2 py-0.5 rounded-sm border border-zinc-700">
                                                    <Users className="w-3 h-3 text-zinc-400" />
                                                    <span>{team.slots} {t.teamHub.slots_label}</span>
                                                </div>
                                                <span className="text-zinc-600">|</span>
                                                <span className="tracking-[0.2em] text-zinc-400">{t.teamHub.roster_label}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-left sm:text-right relative z-10 flex sm:flex-col justify-between items-end sm:justify-start">
                                        <div className="text-2xl sm:text-3xl font-[1000] italic text-white leading-none font-mono">
                                            {team.rating}
                                        </div>
                                        <div className="text-[9px] sm:text-[10px] font-mono text-zinc-400 uppercase tracking-[0.3em] mt-1 group-hover:text-zinc-200 transition-colors">
                                            {t.teamHub.rating_label}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* RIGHT SECTION: Free Agents (40%) */}
                <div className="lg:col-span-4 p-4 sm:p-8 flex flex-col bg-zinc-900/20 backdrop-blur-sm relative">
                    {/* Background Detail */}
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none uppercase font-mono text-xs text-white vertical-rl tracking-[0.5em]">
                        DEAFHUB_OPERATIONS
                    </div>

                    <div className="flex items-center justify-between mb-6 sm:mb-8">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className={cn("p-1.5 sm:p-2 bg-zinc-800/50 border border-zinc-700 rounded-sm", accentClass)}>
                                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-[1000] italic uppercase tracking-tighter text-white">
                                {t.teamHub.agents_title}
                            </h2>
                        </div>
                        <div className="h-px flex-grow mx-4 bg-zinc-700" />
                    </div>

                    <div className="flex-grow space-y-4">
                        <AnimatePresence mode="popLayout">
                            {agents.map((agent, idx) => (
                                <motion.div
                                    key={`${gameMode}-agent-${agent.id}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                                    whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.03)" }}
                                    className="flex items-center justify-between p-4 bg-[#050505] border border-zinc-800/60 hover:border-zinc-600 transition-all relative group"
                                >
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className="relative">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-white overflow-hidden group-hover:border-zinc-600 transition-colors">
                                                {agent.avatar}
                                            </div>
                                            {agent.online && (
                                                <motion.div
                                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className={cn("absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-black rounded-full shadow-[0_0_10px_currentColor]", accentClass, accentBg)}
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm font-black text-white group-hover:text-white transition-colors uppercase tracking-wide">{agent.nickname}</div>
                                            <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5">
                                                <span className="text-[9px] sm:text-[10px] font-mono text-zinc-300 bg-zinc-900/70 px-1.5 py-0.5 rounded-[1px] border border-zinc-700/50 uppercase whitespace-nowrap">{agent.rankInfo}</span>
                                                <span className={cn("text-[7px] sm:text-[8px] font-black px-1.5 sm:px-2 py-0.5 rounded-[1px] border tracking-wider",
                                                    gameMode === 'dota2' ? "bg-cyan-950/40 border-cyan-700/50 text-cyan-300" : "bg-orange-950/40 border-orange-700/50 text-orange-400"
                                                )}>
                                                    {agent.role}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        size="icon"
                                        variant="outline"
                                        title={t.teamHub.invite_tooltip}
                                        className="h-10 w-10 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-none border-zinc-700 hover:border-zinc-500 active:scale-95 transition-all bg-transparent"
                                    >
                                        <UserPlus className="w-5 h-5" />
                                    </Button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="mt-8 w-full py-5 border-2 border-dashed border-zinc-700 bg-zinc-900/30 text-zinc-300 font-black text-[10px] uppercase tracking-[0.3em] hover:border-zinc-500 hover:text-white hover:bg-zinc-900/50 transition-all flex items-center justify-center gap-3 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
                    >
                        <Zap className="w-4 h-4" />
                        {t.teamHub.publish_lfp}
                    </motion.button>
                </div>
            </div>

            {/* Global UI Details Decor */}
            <div className="flex justify-between items-center text-[9px] font-mono text-zinc-600 uppercase tracking-[0.5em] pt-4">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3" />
                        <span>High_Freq_Link</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Shield className="w-3 h-3" />
                        <span>Prot_Active</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Star className="w-3 h-3" />
                    <span>DeafHub_Elite_v3.0</span>
                </div>
            </div>
        </div>
    );
}
