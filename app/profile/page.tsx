'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { create } from 'zustand';
import { Trophy, Activity, Zap, Target, Shield, ArrowUpRight } from 'lucide-react';
import AvatarView from '@/components/r3f/AvatarView';
import { Badge } from '@/components/ui/badge';
import RoleBadge, { RoleType } from '@/components/shared/RoleBadge';
import { cn } from "@/lib/utils";

// --- 1. BRAIN (Zustand Store) ---
const useProfileStore = create(() => ({
    user: {
        nickname: "DH_WARRIOR",
        rank: "PRO_OPERATIVE",
        stats: { wins: 124, winrate: "58%", kda: "4.2" },
        achievements: [
            { id: 1, type: 'CHAMPION', tournament: 'DH Winter Blast 2025', status: 'VERIFIED' },
            { id: 2, type: 'FINALIST', tournament: 'Arena Master #12', status: 'OFFICIAL' }
        ],
        history: [
            { id: '01', role: 'MID' as RoleType, hero: 'Void Spirit', kda: '12/2/8', res: 'W' },
            { id: '02', role: 'SUPPORT' as RoleType, hero: 'Lion', kda: '3/10/24', res: 'L' },
            { id: '03', role: 'MID' as RoleType, hero: 'Storm Spirit', kda: '8/4/12', res: 'W' }
        ]
    }
}));

// --- 2. UI ELEMENTS ---

const MiniStat = ({ label, value }: { label: string, value: string | number }) => (
    <div className="flex flex-col gap-1 border-l border-zinc-600 pl-4 group transition-colors hover:border-cyan-500/50 bg-white/[0.03] py-3 pr-6 rounded-r-xl border-y border-r border-transparent hover:border-white/5 shadow-sm">
        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest group-hover:text-zinc-200 transition-colors font-bold">{label}</span>
        <span className="text-xl sm:text-3xl font-black text-white italic tracking-tighter drop-shadow-sm">{value}</span>
    </div>
);

const MatchRow = ({ match }: { match: any }) => (
    <div className="group flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 border-b border-white/5 hover:bg-white/[0.07] transition-all px-4 rounded-xl mb-1 last:mb-0 gap-4 sm:gap-0">
        <div className="flex items-center gap-6">
            <span className="hidden sm:block text-[10px] font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors uppercase font-bold">{match.id}</span>
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <RoleBadge role={match.role} />
                    <span className={cn(
                        "text-[9px] font-black tracking-tighter uppercase px-2 py-0.5 rounded-sm bg-black/60 border border-white/5",
                        match.role === 'MID' ? 'text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    )}>{match.role}</span>
                </div>
                <span className="text-sm font-black text-white uppercase leading-none mt-2 group-hover:text-cyan-400 transition-colors tracking-tight">
                    {match.hero}
                </span>
            </div>
        </div>
        <div className="flex items-center justify-between w-full sm:w-auto gap-10">
            <span className="text-xs font-mono font-black text-zinc-300 tracking-tighter">{match.kda}</span>
            <span className={cn(
                "w-9 h-9 flex items-center justify-center text-[12px] font-[1000] border-2 transition-all duration-300 rounded-lg shadow-lg",
                match.res === 'W'
                    ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10 group-hover:bg-emerald-500/30 group-hover:border-emerald-500 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                    : 'border-red-500/40 text-red-400 bg-red-500/10 group-hover:bg-red-500/30 group-hover:border-red-500 group-hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]'
            )}>
                {match.res}
            </span>
        </div>
    </div>
);

// --- 3. MAIN LAYOUT ---
export default function ProfilePage() {
    const { user } = useProfileStore();

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 py-6 sm:py-12 px-4 sm:px-6 font-sans selection:bg-cyan-500/30 relative overflow-hidden">
            {/* Background Aesthetic - High Contrast Blooms */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-[-5%] left-[-5%] w-[60%] h-[60%] bg-cyan-500/20 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[60%] h-[60%] bg-purple-500/15 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-emerald-500/10 blur-[120px] rounded-full" />
            </div>

            {/* INTERFACE GRID */}
            <div className="max-w-6xl mx-auto grid grid-cols-12 gap-px bg-white/20 border border-white/20 shadow-[0_0_120px_rgba(0,0,0,1)] relative z-10 rounded-2xl overflow-hidden backdrop-blur-3xl">

                {/* LEFT COLUMN (IDENTITY) */}
                <div className="col-span-12 lg:col-span-4 bg-[#1a1a1a] p-6 sm:p-8 lg:p-12 flex flex-col items-center relative overflow-hidden">
                    {/* Panel highlight */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

                    <div className="w-full aspect-square max-w-[320px] lg:max-w-none bg-[#111111] border border-white/10 relative group mb-8 sm:mb-10 overflow-hidden rounded-[2rem] shadow-2xl border-gradient-to-br from-white/20 to-transparent">
                        {/* 3D AVATAR */}
                        <AvatarView className="w-full h-full pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent pointer-events-none z-10 opacity-80" />

                        {/* Pattern Overlay */}
                        <div className="absolute inset-0 opacity-[0.08] pointer-events-none z-5" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                        <div className="absolute inset-x-0 bottom-8 flex justify-center opacity-80 group-hover:opacity-100 transition-opacity z-20">
                            <div className="flex items-center gap-3 px-5 py-2 bg-black/90 border border-cyan-500/50 rounded-full backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                                <Activity className="text-cyan-400 animate-pulse" size={16} />
                                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-[0.2em] font-black">BIO_LINK: ONLINE</span>
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-[4px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent z-20" />
                    </div>

                    <div className="w-full text-center lg:text-left space-y-4 sm:space-y-5">
                        <motion.h1
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-4xl sm:text-6xl lg:text-7xl font-[1000] italic tracking-tighter text-white uppercase leading-none drop-shadow-[0_8px_20px_rgba(0,0,0,0.8)]"
                        >
                            {user.nickname}
                        </motion.h1>
                        <div className="flex items-center justify-center lg:justify-start gap-3">
                            <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,211,238,1)]" />
                            <span className="text-[12px] font-mono text-cyan-200 tracking-[0.5em] uppercase font-black bg-cyan-500/10 px-4 py-1.5 rounded-md border border-cyan-500/20 shadow-sm">
                                {user.rank}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 w-full gap-4 sm:gap-2 lg:gap-6 mt-10 sm:mt-16 pt-8 sm:pt-12 border-t border-white/20 relative">
                        {/* Corner Accents */}
                        <div className="absolute -top-px left-0 w-16 h-[2px] bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                        <div className="absolute -top-px right-0 w-4 h-[2px] bg-white/40" />

                        <MiniStat label="Wins" value={user.stats.wins} />
                        <MiniStat label="Winrate" value={user.stats.winrate} />
                        <MiniStat label="KDA" value={user.stats.kda} />
                    </div>
                </div>

                {/* RIGHT COLUMN (LOGS & TROPHIES) */}
                <div className="col-span-12 lg:col-span-8 bg-[#141414] p-6 sm:p-10 lg:p-20 relative">
                    {/* Panel highlight */}
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent shadow-[0_1px_30px_rgba(255,255,255,0.08)]" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

                    {/* ACHIEVEMENTS */}
                    <div className="mb-16 sm:mb-24">
                        <div className="flex items-center gap-4 sm:gap-6 mb-8 sm:mb-12">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <Shield size={20} className="text-zinc-300" />
                                <h2 className="text-xs sm:text-sm font-mono text-zinc-300 uppercase tracking-[0.4em] sm:tracking-[0.6em] font-[1000] italic">VAULT_RECORDS</h2>
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-r from-white/30 to-transparent" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                            {user.achievements.map((ach: any) => (
                                <div key={ach.id} className="bg-[#1e1e1e] border border-white/10 p-6 sm:p-10 hover:bg-[#252525] hover:border-white/30 transition-all duration-500 group relative rounded-2xl shadow-2xl overflow-hidden">
                                    <div className="flex justify-between items-start mb-6 sm:mb-8">
                                        <div className={cn(
                                            "p-4 sm:p-5 rounded-2xl transition-all duration-700 group-hover:rotate-[15deg] group-hover:scale-125 shadow-2xl",
                                            ach.type === 'CHAMPION' ? 'bg-yellow-500/30 text-yellow-400 shadow-yellow-500/20' : 'bg-zinc-700 text-zinc-300'
                                        )}>
                                            <Trophy size={28} className="sm:w-8 sm:h-8" />
                                        </div>
                                        <div className="flex flex-col items-end text-right">
                                            <span className="text-[10px] sm:text-[11px] font-mono text-zinc-400 tracking-tighter uppercase mb-2 font-black border-b border-white/10 pb-1">{ach.status}</span>
                                            <Badge variant="outline" className="text-[8px] border-white/5 opacity-40">REF_{ach.id}X</Badge>
                                        </div>
                                    </div>
                                    <div className="text-xl sm:text-2xl font-[1000] text-white uppercase tracking-tight leading-7 sm:leading-8 group-hover:text-cyan-400 transition-colors drop-shadow-md">
                                        {ach.tournament}
                                    </div>
                                    <div className="text-[11px] sm:text-[12px] font-mono text-zinc-300 mt-3 sm:mt-4 uppercase tracking-[0.3em] sm:tracking-[0.4em] font-black bg-white/10 inline-block px-3 py-1 rounded-md border border-white/5">
                                        {ach.type}
                                    </div>

                                    {/* Glass sheen effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* HISTORY */}
                    <div className="relative">
                        <div className="flex items-center gap-4 sm:gap-6 mb-8 sm:mb-12">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <Zap size={20} className="text-zinc-300" />
                                <h2 className="text-xs sm:text-sm font-mono text-zinc-300 uppercase tracking-[0.4em] sm:tracking-[0.6em] font-[1000] italic">TACTICAL_LOGS</h2>
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-r from-white/30 to-transparent" />
                        </div>

                        <div className="flex flex-col bg-[#1c1c1c] border border-white/15 rounded-2xl sm:rounded-3xl overflow-hidden p-4 sm:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-gradient-to-br from-white/20 to-transparent">
                            <div className="hidden sm:grid grid-cols-2 px-6 pb-6 border-b border-white/10 opacity-40">
                                <span className="text-[11px] font-mono uppercase tracking-[0.3em] font-black">DEPLOYMENT_PARAM</span>
                                <div className="flex justify-end gap-12">
                                    <span className="text-[11px] font-mono uppercase tracking-[0.3em] font-black w-20 text-center">RATING</span>
                                    <span className="text-[11px] font-mono uppercase tracking-[0.3em] font-black w-10 text-center">OUT</span>
                                </div>
                            </div>
                            <div className="mt-2 sm:mt-4 space-y-2">
                                {user.history.map((match: any) => (
                                    <MatchRow key={match.id} match={match} />
                                ))}
                            </div>
                        </div>

                        {/* Interactive Footer HUD */}
                        <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row justify-between items-center px-4 gap-6 sm:gap-0">
                            <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                                <span className="text-[9px] font-mono tracking-[0.4em] text-emerald-400 font-black">ENCRYPTED_SIGNAL_STABLE</span>
                            </div>
                            <div className="flex gap-6 opacity-40 hover:opacity-100 transition-opacity cursor-crosshair">
                                <Activity size={18} className="text-zinc-300" />
                                <Target size={18} className="text-zinc-300" />
                                <ArrowUpRight size={18} className="text-zinc-300" />
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Global Overlay Aesthetic */}
            <div className="fixed inset-0 pointer-events-none border-[16px] sm:border-[32px] border-white/5 rounded-[40px] sm:rounded-[60px] opacity-10 z-50 mix-blend-overlay" />
        </div>
    );
}
