'use client';

import React from 'react';
import Image from 'next/image';
import {
    Trophy, TrendingUp, Medal, Flame, Crown, Clock, Target, Star, Zap, Crosshair, Terminal, Shield
} from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/useLanguageStore";
import CS2MVPShowcase from './CS2MVPShowcase';

/**
 * CS2TournamentOverview - Authentic CS2 Tactical Ladder UI
 * Scheme: Amber / Orange / Yellow (Official CS2 vibes)
 * Focus: High Readability and High Contrast
 */
export function CS2TournamentOverview() {
    const { t } = useLanguageStore();

    return (
        <div className="w-full space-y-6 text-zinc-100 font-mono selection:bg-orange-500/30 animate-in fade-in duration-700 relative">
            {/* Tactical Grid Background Overlay - Amber Version */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.08] bg-[linear-gradient(rgba(245,158,11,0)_50%,rgba(0,0,0,0.3)_50%),linear-gradient(90deg,rgba(245,158,11,0.1),transparent,rgba(245,158,11,0.1))] bg-[size:100%_4px,100%_100%]" />

            {/* HEADER WITH MVP BUTTON */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10 border-b border-orange-500/10 pb-4 px-4 py-2 bg-orange-500/5 rounded-t-2xl">
                <div className="flex items-center gap-3">
                    <span className="text-orange-500 font-bold">::</span>
                    <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">
                        {t.tournamentsPage.games.cs2.name} <span className="text-white/20">/</span> {t.tournamentsPage.games.cs2.desc}
                    </h2>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <button className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg text-orange-400 font-black uppercase text-[9px] tracking-widest hover:bg-orange-500/20 transition-all group">
                            <Terminal size={12} className="text-orange-500" />
                            {t.tournamentsPage.mvpSeason1}
                        </button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-[95vw] lg:max-w-screen-lg !bg-transparent !border-none !shadow-none p-2 sm:p-6 md:p-10 flex items-center justify-center overflow-y-auto max-h-[90vh] outline-none">
                        <DialogTitle className="sr-only">CS2 Combat Report</DialogTitle>
                        <CS2MVPShowcase />
                    </DialogContent>
                </Dialog>
            </div>

            {/* TOP ROW: ACTIVE MODE & USER SUMMARY */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative z-10">
                <CSModeCard
                    title={t.cs2Ladder.play_5x5}
                    image="/images/games/cs2.png"
                    stats={{
                        games: 30,
                        winPoints: 25,
                        losePoints: 15
                    }}
                    buttonText={t.cs2Ladder.play_5x5}
                    accentColor="from-orange-600 to-amber-500"
                />

                {/* Brighter: User Stats Summary Card - Amber Style */}
                <div className="relative h-60 rounded-2xl overflow-hidden border border-orange-500/20 group bg-zinc-900/60 backdrop-blur-xl">
                    <div className="absolute top-0 right-0 p-6 text-orange-500/5 group-hover:text-orange-500/10 transition-colors">
                        <Crosshair size={90} strokeWidth={1} />
                    </div>

                    <div className="relative h-full p-6 flex flex-col justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative h-14 w-14 flex-shrink-0">
                                <div className="absolute inset-0 rounded-full border border-orange-500/30 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.2)]" />
                                <div className="absolute inset-1 rounded-full overflow-hidden border border-white/10 bg-zinc-800">
                                    <Image src="https://i.pravatar.cc/150?u=alex" alt="User" fill className="object-cover" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-white text-[9px] font-black h-5 w-5 rounded-full flex items-center justify-center border border-zinc-900 shadow-xl text-orange-600">1</div>
                            </div>
                            <div className="flex flex-col">
                                <h4 className="text-xl font-black text-white uppercase tracking-tighter italic leading-none mb-1">AlexSkywalker</h4>
                                <div className="flex items-center gap-2 text-white/90">
                                    <span className="px-1.5 py-0.5 bg-orange-500 text-[8px] font-black text-black rounded uppercase tracking-widest leading-none">OPERATIVE</span>
                                    <span className="text-[9px] font-bold uppercase tracking-widest">{t.cs2Ladder.rank}: 1</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 bg-orange-950/20 border border-orange-500/10 rounded-xl p-4 backdrop-blur-md">
                            <CSLargeMiniStat label={t.cs2Ladder.rating} value="1.42" color="text-orange-400" icon={<Zap size={12} />} />
                            <CSLargeMiniStat label={t.cs2Ladder.adr} value="94.5" color="text-amber-400" icon={<TrendingUp size={12} />} />
                            <CSLargeMiniStat label={t.cs2Ladder.kd} value="1.58" color="text-yellow-400" icon={<Target size={12} />} />
                            <CSLargeMiniStat label={t.cs2Ladder.hs} value="62%" color="text-orange-300" icon={<Crosshair size={12} />} />
                        </div>
                    </div>
                </div>
            </div>

            {/* LOWER BAR: TIMER, PRIZE, FUTURE PLAN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                {/* Status & Timer - Amber Version */}
                <div className="bg-zinc-900/50 border border-orange-500/20 rounded-2xl p-4 flex items-center gap-4 backdrop-blur-xl relative overflow-hidden group">
                    <div className="relative h-12 w-12 flex-shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500/10" />
                            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="180 300" className="text-orange-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.7)]" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                            <span className="text-[9px] font-black uppercase text-white tracking-tighter">5 {t.cs2Ladder.days}</span>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-400/60">{t.cs2Ladder.weekly_ladder}</h4>
                        <div className="text-sm font-black text-orange-400 uppercase">STABLE</div>
                    </div>
                </div>

                {/* Prize Pool Summary */}
                <div className="bg-zinc-900/70 border border-orange-500/20 rounded-2xl p-4 flex items-center justify-between backdrop-blur-xl relative group">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black tracking-widest text-orange-400/40 uppercase mb-1">{t.cs2Ladder.prize_pool}</span>
                        <div className="text-2xl font-[1000] text-white leading-none">TBD</div>
                    </div>
                    <div className="flex gap-2">
                        <CSPrizeIcon rank={1} value="TBD" color="bg-orange-500/20 text-orange-500 border-orange-500/30" />
                        <CSPrizeIcon rank={2} value="TBD" color="bg-white/5 text-white/60 border border-white/10" />
                    </div>
                </div>

                {/* Future Plan */}
                <div className="bg-zinc-900/80 border border-orange-500/20 border-dashed rounded-2xl p-4 flex items-center justify-between backdrop-blur-xl relative group">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1">{t.cs2Ladder.future_plan}</span>
                        <h4 className="text-[10px] font-black text-white uppercase italic">5v5 PREMIER MODE</h4>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                        <Shield size={14} className="text-orange-500" />
                    </div>
                </div>
            </div>

            {/* LEADERBOARD TABLE - Amber High Visibility */}
            <div className="bg-zinc-950/80 border border-orange-500/20 rounded-3xl overflow-hidden backdrop-blur-3xl shadow-2xl relative z-10">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent" />
                <div className="p-6 border-b border-orange-500/20 flex items-center justify-between bg-orange-500/5">
                    <h3 className="text-xl font-black italic tracking-tighter text-white uppercase flex items-center gap-3">
                        <div className="h-3 w-3 bg-orange-500 rotate-45 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                        {t.cs2Ladder.standing}
                    </h3>
                    <div className="flex items-center gap-4">
                        <span className="text-[9px] font-black text-orange-400 bg-white/10 px-3 py-1 rounded-full uppercase tracking-[0.3em]">SECURE_DATA_STREAM</span>
                        <div className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                            {t.cs2Ladder.updated} 4M {t.cs2Ladder.ago}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-[10px] font-black uppercase text-white/60 tracking-[0.2em] bg-black/40">
                                <th className="px-3 sm:px-6 py-5">{t.cs2Ladder.rank}</th>
                                <th className="px-3 sm:px-6 py-5">{t.cs2Ladder.player}</th>
                                <th className="px-3 sm:px-6 py-5">{t.cs2Ladder.country}</th>
                                <th className="px-3 sm:px-6 py-5 text-center">{t.cs2Ladder.rating}</th>
                                <th className="px-3 sm:px-6 py-5 text-center hidden sm:table-cell">{t.cs2Ladder.adr}</th>
                                <th className="px-3 sm:px-6 py-5 text-center hidden sm:table-cell">K/D</th>
                                <th className="px-3 sm:px-6 py-5 text-center hidden sm:table-cell">{t.cs2Ladder.hs}</th>
                                <th className="px-3 sm:px-6 py-5 text-right pr-4 sm:pr-12 whitespace-nowrap">WIN%</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                            {CS_LEADERBOARD.map((player, i) => (
                                <tr key={i} className="group hover:bg-orange-500/[0.08] transition-all cursor-default">
                                    <td className="px-3 sm:px-6 py-4">
                                        <div className={cn(
                                            "w-7 h-7 sm:w-8 sm:h-8 rounded border-2 flex items-center justify-center text-[10px] sm:text-[11px] font-black tracking-tighter transition-all shadow-md",
                                            player.rank === 1 ? "border-orange-500 bg-orange-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]" :
                                                player.rank === 2 ? "border-zinc-300 bg-zinc-300 text-slate-900" :
                                                    player.rank === 3 ? "border-orange-400 bg-orange-600 text-white" :
                                                        "border-white/10 bg-white/10 text-white/40"
                                        )}>
                                            {String(player.rank).padStart(2, '0')}
                                        </div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-4">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg border-2 border-white/10 bg-zinc-800 overflow-hidden relative shadow-md">
                                                <Image src={`https://i.pravatar.cc/150?u=${player.name}`} alt={player.name} fill className="object-cover group-hover:scale-110 transition-transform" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[12px] sm:text-sm font-black text-white group-hover:text-orange-400 transition-colors uppercase italic tracking-tighter drop-shadow-sm truncate max-w-[70px] sm:max-w-none">{player.name}</span>
                                                <span className="text-[8px] sm:text-[9px] font-black text-white/40 uppercase tracking-widest">{player.matches} {t.cs2Ladder.matches}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-4">
                                        <div className="h-3 w-5 sm:h-4 sm:w-6 relative overflow-hidden rounded-sm border border-white/20 shadow-sm opacity-60 group-hover:opacity-100">
                                            <Image src={`https://flagcdn.com/w40/${player.flag.split('/').pop()?.replace('.png', '') || 'ru'}.png`} alt="Country" fill className="object-cover" />
                                        </div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-4 text-center font-black text-orange-400 tabular-nums text-[12px] sm:text-sm drop-shadow-[0_0_5px_rgba(245,158,11,0.3)]">{player.rating}</td>
                                    <td className="px-3 sm:px-6 py-4 text-center font-black text-white tabular-nums text-sm hidden sm:table-cell">{player.adr}</td>
                                    <td className="px-3 sm:px-6 py-4 text-center font-black text-white/70 tabular-nums text-sm hidden sm:table-cell">{player.kd}</td>
                                    <td className="px-3 sm:px-6 py-4 text-center font-black text-white/70 tabular-nums text-sm hidden sm:table-cell">{player.hs}%</td>
                                    <td className="px-3 sm:px-6 py-4 text-right pr-4 sm:pr-12">
                                        <div className="flex items-center justify-end gap-2 sm:gap-3">
                                            <span className="text-[10px] sm:text-[11px] font-black italic text-white tabular-nums tracking-tighter">{player.winrate}%</span>
                                            <div className="h-2 w-12 sm:w-16 bg-white/10 rounded-full overflow-hidden shadow-inner border border-white/5 hidden xs:block">
                                                <div
                                                    className="h-full bg-orange-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                                                    style={{ width: `${player.winrate}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// SUB-COMPONENTS
function CSModeCard({ title, image, stats, buttonText, accentColor }: any) {
    const { t } = useLanguageStore();

    return (
        <div className="relative h-60 rounded-2xl overflow-hidden border border-orange-500/20 group bg-zinc-900/60 transition-all">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] opacity-10" />
            <Image
                src={image}
                alt={title}
                fill
                className="object-cover opacity-60 group-hover:scale-105 transition-all duration-1000 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/40 to-transparent" />

            <div className="relative h-full p-6 flex flex-col justify-end gap-4">
                <div className="space-y-1">
                    <h3 className="text-2xl font-[1000] italic tracking-tight text-white uppercase group-hover:text-orange-500 transition-colors leading-none">
                        {title}
                    </h3>
                    <p className="text-[9px] text-white/50 font-black uppercase tracking-wider leading-tight">
                        {t.cs2Ladder.desc}
                    </p>
                </div>

                <div className="flex items-center gap-6">
                    <CSStatIcon icon={<Flame size={12} />} label={t.cs2Ladder.games_limit} value={stats.games} color="text-orange-500" />
                    <CSStatIcon icon={<Crown size={12} />} label={t.cs2Ladder.win_points} value={`${stats.winPoints} ELO`} color="text-amber-400" />
                </div>

                <div className="flex items-center gap-4 pt-1">
                    <button className={cn(
                        "px-8 py-3 bg-gradient-to-r rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all border border-white/10",
                        accentColor
                    )}>
                        {buttonText}
                    </button>
                    <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">
                        {t.cs2Ladder.free}
                    </span>
                </div>
            </div>
        </div>
    );
}

function CSStatIcon({ icon, label, value, color }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className={cn("h-8 w-8 rounded-lg border border-white/20 bg-black flex items-center justify-center shadow-xl", color)}>
                {icon}
            </div>
            <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/50 leading-none mb-1">{label}</span>
                <span className="text-sm font-black text-white tabular-nums drop-shadow-md">{value}</span>
            </div>
        </div>
    );
}

function CSPrizeIcon({ rank, value, color }: any) {
    return (
        <div className={cn("flex items-center gap-2 p-1.5 px-3 border border-orange-500/20 rounded-lg hover:scale-105 transition-all cursor-default shadow-md", color)}>
            <Trophy size={12} />
            <span className="text-[11px] font-black italic tracking-tighter tabular-nums">{value}</span>
        </div>
    );
}

function CSLargeMiniStat({ label, value, color, icon }: any) {
    return (
        <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center gap-2">
                <span className={cn(color, "drop-shadow-[0_0_5px_currentColor]")}>{icon}</span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 leading-none">{label}</span>
            </div>
            <span className={cn("text-xl font-black tabular-nums tracking-tighter leading-none italic drop-shadow-md", color)}>{value}</span>
        </div>
    );
}

const CS_LEADERBOARD = [
    { rank: 1, name: 'AlexSkywalker', avatar: '/brand/dota_user_avatar.png', flag: '/brand/ru.png', rating: 1.42, adr: 94.5, kd: 1.58, hs: 62, winrate: 90, matches: 30 },
    { rank: 2, name: 'S1MPLE_FAN', avatar: '/brand/dota_user_avatar.png', flag: '/brand/ru.png', rating: 1.38, adr: 91.2, kd: 1.45, hs: 55, winrate: 85, matches: 45 },
    { rank: 3, name: 'CYBER_WOLF', avatar: '/brand/dota_user_avatar.png', flag: '/brand/ru.png', rating: 1.25, adr: 88.0, kd: 1.32, hs: 48, winrate: 78, matches: 28 },
    { rank: 4, name: 'TECTONIC', avatar: '/brand/dota_user_avatar.png', flag: '/brand/ru.png', rating: 1.18, adr: 85.5, kd: 1.25, hs: 52, winrate: 72, matches: 50 },
    { rank: 5, name: 'VECTOR_OP', avatar: '/brand/dota_user_avatar.png', flag: '/brand/ru.png', rating: 1.12, adr: 82.1, kd: 1.18, hs: 45, winrate: 68, matches: 35 },
    { rank: 6, name: 'PHANTOM', avatar: '/brand/dota_user_avatar.png', flag: '/brand/ru.png', rating: 1.05, adr: 79.8, kd: 1.12, hs: 58, winrate: 65, matches: 22 },
];
