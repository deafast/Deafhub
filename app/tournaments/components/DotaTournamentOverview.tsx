'use client';

import React from 'react';
import Image from 'next/image';
import {
    Trophy, TrendingUp, Medal, Flame, Crown, Clock, Target, Star, Zap, Terminal
} from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/useLanguageStore";
import DotaMVPShowcase from './DotaMVPShowcase';

/**
 * DotaTournamentOverview - God Tier Dota 2 Ladder UI
 * High Visibility Version: Brighter panels, better contrast, glass effects.
 */
export function DotaTournamentOverview() {
    const { t } = useLanguageStore();

    return (
        <div className="w-full space-y-6 text-zinc-100 font-sans selection:bg-red-500/30 animate-in fade-in duration-700">
            {/* HEADER WITH MVP BUTTON */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <span className="text-red-500 font-bold">::</span>
                    <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">
                        {t.tournamentsPage.games.dota2.name} <span className="text-white/20">/</span> {t.tournamentsPage.games.dota2.desc}
                    </h2>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-black uppercase text-[9px] tracking-widest hover:bg-white/10 transition-all group">
                            <Terminal size={12} className="text-red-500" />
                            {t.tournamentsPage.mvpSeason1}
                        </button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-[95vw] lg:max-w-screen-lg !bg-transparent !border-none !shadow-none p-2 sm:p-6 md:p-10 flex items-center justify-center overflow-y-auto max-h-[90vh] outline-none">
                        <DialogTitle className="sr-only">Dota 2 Combat Report</DialogTitle>
                        <DotaMVPShowcase />
                    </DialogContent>
                </Dialog>
            </div>

            {/* TOP ROW: ACTIVE MODE & USER SUMMARY */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ModeCard
                    title={t.dotaLadder.play_5x5}
                    image="/images/games/dota2.png"
                    stats={{
                        games: 50,
                        winPoints: 100,
                        losePoints: 20
                    }}
                    buttonText={t.dotaLadder.play_5x5}
                    accentColor="from-blue-600 to-blue-400"
                />

                {/* Brighter: User Stats Summary Card */}
                <div className="relative h-60 rounded-2xl overflow-hidden border border-white/10 group bg-zinc-900/30 backdrop-blur-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-blue-500/5 opacity-70" />
                    <div className="absolute top-0 right-0 p-6 text-white/5 group-hover:text-white/10 transition-colors">
                        <Star size={80} strokeWidth={1} />
                    </div>

                    <div className="relative h-full p-6 flex flex-col justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative h-14 w-14 flex-shrink-0">
                                <div className="absolute inset-0 rounded-full border border-dashed border-red-500/50 animate-spin-slow" />
                                <div className="absolute inset-1 rounded-full overflow-hidden border border-white/10 bg-zinc-800">
                                    <Image src="https://i.pravatar.cc/150?u=alex" alt="User" fill className="object-cover" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-red-500 text-[9px] font-black h-5 w-5 rounded-full flex items-center justify-center border border-zinc-900 shadow-xl text-white">1</div>
                            </div>
                            <div className="flex flex-col">
                                <h4 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none mb-1">AlexSkywalker</h4>
                                <div className="flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 bg-red-500 text-[8px] font-black text-white rounded uppercase tracking-widest leading-none">DEAF|HUB</span>
                                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{t.dotaLadder.rank}: 1</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 bg-white/[0.03] border border-white/5 rounded-xl p-4 backdrop-blur-md">
                            <LargeMiniStat label={t.dotaLadder.points} value="3,100" color="text-blue-300" icon={<Zap size={12} />} />
                            <LargeMiniStat label={t.dotaLadder.wins} value="31" color="text-green-400" icon={<TrendingUp size={12} />} />
                            <LargeMiniStat label={t.dotaLadder.loses} value="0" color="text-red-400" icon={<Target size={12} />} />
                            <LargeMiniStat label={t.dotaLadder.winrate} value="100%" color="text-yellow-400" icon={<Flame size={12} />} />
                        </div>
                    </div>
                </div>
            </div>

            {/* LOWER BAR: TIMER, PRIZE, FUTURE PLAN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status & Timer */}
                <div className="bg-zinc-800/20 border border-white/10 rounded-2xl p-4 flex items-center gap-4 backdrop-blur-xl relative overflow-hidden group">
                    <div className="relative h-14 w-14 flex-shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="2" className="opacity-10" />
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#EF4444" strokeWidth="6" strokeDasharray="210 283" className="drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                            <span className="text-[10px] font-black text-white uppercase">5 {t.dotaLadder.days}</span>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/60">{t.dotaLadder.weekly_ladder}</h4>
                        <div className="text-sm font-black text-red-500 uppercase">10H : 26M</div>
                    </div>
                </div>

                {/* Prize Pool Summary */}
                <div className="bg-zinc-800/20 border border-white/10 rounded-2xl p-4 flex items-center justify-between backdrop-blur-xl relative group">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black tracking-widest text-white/40 uppercase mb-1">{t.dotaLadder.prize_pool}</span>
                        <div className="text-2xl font-[1000] italic text-white leading-none">TBD</div>
                    </div>
                    <div className="flex gap-2">
                        <PrizeIcon rank={1} value="TBD" color="bg-yellow-500/20 text-yellow-500 border-yellow-500/30" />
                        <PrizeIcon rank={2} value="TBD" color="bg-zinc-300/20 text-zinc-300 border-zinc-300/30" />
                    </div>
                </div>

                {/* Future Plan */}
                <div className="bg-zinc-800/20 border border-white/10 border-dashed rounded-2xl p-4 flex items-center justify-between backdrop-blur-xl relative group">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">{t.dotaLadder.future_plan}</span>
                        <h4 className="text-[10px] font-black text-white uppercase italic">5x5 CAPTAIN'S MODE</h4>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <Clock size={14} className="text-red-500" />
                    </div>
                </div>
            </div>

            {/* LEADERBOARD TABLE - High Contrast */}
            <div className="bg-zinc-800/40 border border-white/20 rounded-3xl overflow-hidden backdrop-blur-3xl shadow-2xl">
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <h3 className="text-xl font-black italic tracking-tighter text-white uppercase flex items-center gap-3">
                        <TrendingUp size={24} className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                        {t.dotaLadder.standing}
                    </h3>
                    <div className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] bg-white/10 px-3 py-1 rounded-full">
                        {t.dotaLadder.updated} 2m {t.dotaLadder.ago}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-[10px] font-black uppercase text-white/60 tracking-widest bg-zinc-900/40">
                                <th className="px-3 sm:px-6 py-5">{t.dotaLadder.rank}</th>
                                <th className="px-3 sm:px-6 py-5">{t.dotaLadder.player}</th>
                                <th className="px-3 sm:px-6 py-5">{t.dotaLadder.country}</th>
                                <th className="px-3 sm:px-6 py-5 text-center">{t.dotaLadder.points}</th>
                                <th className="px-3 sm:px-6 py-5 text-center hidden sm:table-cell">{t.dotaLadder.wins}</th>
                                <th className="px-3 sm:px-6 py-5 text-center hidden sm:table-cell">{t.dotaLadder.loses}</th>
                                <th className="px-3 sm:px-6 py-5 text-right pr-4 sm:pr-12 whitespace-nowrap">{t.dotaLadder.winrate}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                            {LEADERBOARD_DATA.map((player, i) => (
                                <tr key={i} className="group hover:bg-white/[0.08] transition-all cursor-default">
                                    <td className="px-3 sm:px-6 py-4">
                                        <div className={cn(
                                            "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black shadow-lg",
                                            player.rank === 1 ? "bg-yellow-500 text-yellow-950 shadow-yellow-400/40 border border-yellow-300" :
                                                player.rank === 2 ? "bg-zinc-300 text-zinc-900 shadow-white/30 border border-white/40" :
                                                    player.rank === 3 ? "bg-orange-600 text-white shadow-orange-500/30 border border-orange-400" :
                                                        "text-white/40 bg-white/10 border border-white/10"
                                        )}>
                                            {player.rank}
                                        </div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-4">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg bg-zinc-800 border-2 border-white/10 overflow-hidden relative shadow-md">
                                                <Image src={`https://i.pravatar.cc/150?u=${player.name}`} alt={player.name} fill className="object-cover" />
                                            </div>
                                            <span className="text-[12px] sm:text-sm font-black text-white group-hover:text-red-400 transition-colors uppercase italic tracking-tight drop-shadow-sm truncate max-w-[80px] sm:max-w-none">{player.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-4">
                                        <div className="h-3 w-5 sm:h-4 sm:w-6 relative overflow-hidden rounded-[2px] border border-white/20 shadow-sm">
                                            <Image src={`https://flagcdn.com/w40/${player.flag.split('/').pop()?.replace('.png', '') || 'ru'}.png`} alt="Country" fill className="object-cover" />
                                        </div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-4 text-center font-black text-white tabular-nums text-[12px] sm:text-sm">{player.points}</td>
                                    <td className="px-3 sm:px-6 py-4 text-center font-black text-green-400 tabular-nums text-sm hidden sm:table-cell">{player.wins}</td>
                                    <td className="px-3 sm:px-6 py-4 text-center font-black text-red-400 tabular-nums text-sm hidden sm:table-cell">{player.loses}</td>
                                    <td className="px-3 sm:px-6 py-4 text-right pr-4 sm:pr-12">
                                        <div className="flex items-center justify-end gap-2 sm:gap-3">
                                            <span className="text-[10px] sm:text-xs font-black italic text-white/90 tabular-nums">{player.winrate}%</span>
                                            <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border border-zinc-700 relative bg-zinc-900 shadow-inner">
                                                <div
                                                    className="absolute inset-0 rounded-full border border-red-500 border-t-transparent -rotate-45 transition-transform shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                                                    style={{ clipPath: `inset(0 ${100 - player.winrate}% 0 0)` }}
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
function ModeCard({ title, image, stats, buttonText, accentColor }: any) {
    const { t } = useLanguageStore();

    return (
        <div className="relative h-60 rounded-2xl overflow-hidden border border-white/10 group bg-zinc-900 shadow-xl transition-all">
            <Image
                src={image}
                alt={title}
                fill
                className="object-cover opacity-60 group-hover:scale-105 transition-all duration-1000 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/40 to-transparent" />

            <div className="relative h-full p-6 flex flex-col justify-end gap-4">
                <div className="space-y-1">
                    <h3 className="text-2xl font-[1000] italic tracking-tight text-white uppercase group-hover:text-red-500 transition-colors leading-none">
                        {title}
                    </h3>
                    <p className="text-[9px] text-white/50 font-black uppercase tracking-wider leading-tight">
                        {t.dotaLadder.desc}
                    </p>
                </div>

                <div className="flex items-center gap-6">
                    <StatIcon icon={<Flame size={12} />} label={t.dotaLadder.games_limit} value={stats.games} color="text-red-500" />
                    <StatIcon icon={<Crown size={12} />} label={t.dotaLadder.win_points} value={stats.winPoints} color="text-yellow-400" />
                </div>

                <div className="flex items-center gap-4 pt-1">
                    <button className={cn(
                        "px-8 py-3 bg-gradient-to-r rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all border border-white/10",
                        accentColor
                    )}>
                        {buttonText}
                    </button>
                    <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">
                        {t.dotaLadder.free}
                    </span>
                </div>
            </div>
        </div>
    );
}

function StatIcon({ icon, label, value, color }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className={cn("h-8 w-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center shadow-xl", color)}>
                {icon}
            </div>
            <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">{label}</span>
                <span className="text-sm font-black text-white tabular-nums drop-shadow-md">{value}</span>
            </div>
        </div>
    );
}

function PrizeIcon({ rank, value, color }: any) {
    return (
        <div className={cn("flex items-center gap-2 p-1.5 px-3 border border-white/10 rounded-lg hover:scale-105 transition-all cursor-default shadow-md", color)}>
            <Trophy size={12} />
            <span className="text-[11px] font-black italic tracking-tighter tabular-nums">{value}</span>
        </div>
    );
}

function LargeMiniStat({ label, value, color, icon }: any) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
                <span className={cn(color, "drop-shadow-[0_0_5px_currentColor]")}>{icon}</span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 leading-none">{label}</span>
            </div>
            <span className={cn("text-xl font-black tabular-nums tracking-tighter leading-none drop-shadow-md", color)}>{value}</span>
        </div>
    );
}

const LEADERBOARD_DATA = [
    { rank: 1, name: 'AlexSkywalker', avatar: '/brand/dota_user_avatar.png', flag: '/brand/ru.png', points: 3100, wins: 31, loses: 0, winrate: 100 },
    { rank: 2, name: 'inverseroche', avatar: '/brand/dota_user_avatar.png', flag: '/brand/ru.png', points: 900, wins: 98, loses: 6, winrate: 95 },
    { rank: 3, name: 'backbonemagnifier', avatar: '/brand/dota_user_avatar.png', flag: '/brand/ru.png', points: 870, wins: 50, loses: 9, winrate: 80 },
    { rank: 4, name: 'trapsatlantic', avatar: '/brand/dota_user_avatar.png', flag: '/brand/ru.png', points: 840, wins: 29, loses: 6, winrate: 78 },
    { rank: 5, name: 'introducerasping', avatar: '/brand/dota_user_avatar.png', flag: '/brand/ru.png', points: 810, wins: 25, loses: 4, winrate: 69 },
    { rank: 6, name: 'unleveleduniquely', avatar: '/brand/dota_user_avatar.png', flag: '/brand/ru.png', points: 690, wins: 50, loses: 16, winrate: 65 },
    { rank: 7, name: 'introducerasping', avatar: '/brand/dota_user_avatar.png', flag: '/brand/ru.png', points: 810, wins: 25, loses: 4, winrate: 53 },
    { rank: 8, name: 'unleveleduniquely', avatar: '/brand/dota_user_avatar.png', flag: '/brand/ru.png', points: 690, wins: 50, loses: 16, winrate: 65 },
];
