'use client';

/* eslint-disable @next/next/no-img-element */

import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Info } from 'lucide-react';
import { useState, useEffect } from 'react';

interface MVPData {
    id: string;
    game: 'dota' | 'cs2' | 'fc25';
    front: {
        name: string;
        team: string;
        rating: string;
        stats: { label: string; value: string }[];
        image: string;
    };
    back: {
        achievements: string[];
        bio: string;
    };
}

export default function MVPFlipCard({ data }: { data: MVPData }) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [streamData, setStreamData] = useState<string[]>([]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStreamData(Array.from({ length: 40 }).map((_, i) =>
            `0x${Math.random().toString(16).slice(2, 8).toUpperCase()} {"//"} ANALYTICS_STREAM_${i} {"//"} STATUS_ACTIVE`
        ));
    }, []);

    const themeColors = {
        dota: {
            accent: "text-red-500",
            border: "border-red-900/30",
            glow: "shadow-[0_0_30px_rgba(220,38,38,0.15)]",
            gradient: "from-red-950/20 to-transparent"
        },
        cs2: {
            accent: "text-cyan-400",
            border: "border-cyan-900/30",
            glow: "shadow-[0_0_30px_rgba(34,211,238,0.15)]",
            gradient: "from-cyan-950/20 to-transparent"
        },
        fc25: {
            accent: "text-emerald-400",
            border: "border-emerald-900/30",
            glow: "shadow-[0_0_30px_rgba(16,185,129,0.15)]",
            gradient: "from-emerald-950/20 to-transparent"
        }
    };

    const theme = themeColors[data.game] || themeColors.dota;

    return (
        <div
            className="relative w-full max-w-[280px] sm:max-w-[340px] perspective-1000 group cursor-pointer mx-auto h-auto min-h-[380px] xs:min-h-[420px] sm:min-h-[480px] min-w-0 flex-shrink"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <motion.div
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="w-full h-full relative preserve-3d"
            >
                {/* FRONT: Visual Identity */}
                <div
                    className={cn(
                        "absolute inset-0 w-full h-full rounded-2xl sm:rounded-[32px] p-1 backface-hidden overflow-hidden bg-[#0A0C10] border",
                        theme.border,
                        theme.glow
                    )}
                >
                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", theme.gradient)} />

                    {/* Character/Icon Container */}
                    <div className="relative h-[120px] xs:h-[180px] sm:h-[240px] w-full overflow-hidden rounded-t-[20px] sm:rounded-t-[28px] bg-neutral-900/50">
                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                            <div className="w-[120px] h-[120px] border-2 border-white/5 rounded-full animate-ping" />
                        </div>
                        <img
                            src={data.front.image}
                            alt={data.front.name}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-125"
                        />
                        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0A0C10] to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="relative p-4 sm:p-6 pt-0 flex flex-col flex-grow justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-1 sm:mb-2">
                                <h3 className="text-sm xs:text-xl sm:text-2xl font-black italic text-white uppercase tracking-tighter leading-none truncate pr-1">
                                    {data.front.name}
                                </h3>
                                <span className={cn("text-xs xs:text-base sm:text-lg font-[1000] italic leading-none whitespace-nowrap", theme.accent)}>
                                    {data.front.rating}
                                </span>
                            </div>
                            <p className="text-[7px] xs:text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.2em] mb-3 sm:mb-6 truncate pr-1">
                                TEAM: {data.front.team}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 xs:gap-3 sm:gap-4 border-t border-white/5 pt-3 sm:pt-6">
                            {data.front.stats.map((stat, i) => (
                                <div key={i} className="flex flex-col gap-0 sm:gap-1">
                                    <span className="text-[6px] xs:text-[8px] font-mono text-white/30 uppercase tracking-[0.1em] sm:tracking-widest truncate">{stat.label}</span>
                                    <span className="text-[10px] xs:text-base sm:text-lg font-black text-white italic leading-none truncate">{stat.value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-1.5 sm:gap-2 mt-2 sm:mt-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                            <div className={cn("w-1.5 h-1.5 rounded-full", theme.accent)} />
                        </div>
                    </div>
                </div>

                {/* BACK: Data & Intel */}
                <div
                    className={cn(
                        "absolute inset-0 w-full h-full rounded-2xl sm:rounded-[32px] p-6 sm:p-8 backface-hidden overflow-hidden bg-[#0D131A] border flex flex-col justify-between",
                        theme.border,
                        theme.glow
                    )}
                    style={{ transform: 'rotateY(180deg)' }}
                >
                    {/* Dossier Background Elements */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none font-mono text-[8px] p-6 leading-relaxed">
                        {streamData.map((stream, i) => (
                            <div key={i}>{stream}</div>
                        ))}
                    </div>

                    <div className="relative z-10 h-full flex flex-col">
                        {/* Header: Analytics Label */}
                        <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                            <div className="flex items-center gap-2">
                                <Info size={14} className={theme.accent} />
                                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-white/60">
                                    ANALYTICS_DOSSIER_v1.0
                                </span>
                            </div>
                            <div className="text-[8px] font-mono text-white/20">
                                SEQ_{data.id}
                            </div>
                        </div>

                        {/* Core Intel */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <span className="text-[9px] font-black italic text-white/40 uppercase tracking-tighter">MISSION_OBJECTIVES</span>
                                <ul className="space-y-2">
                                    {data.back.achievements.map((ach, i) => (
                                        <li key={i} className="flex items-center gap-3 text-[10px] font-mono font-black text-white/80">
                                            <span className={cn("w-1 h-1 rotate-45", theme.accent)} />
                                            {ach.toUpperCase()}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="space-y-2 overflow-hidden">
                                <span className="text-[9px] font-black italic text-white/40 uppercase tracking-tighter">TACTICAL_BIO</span>
                                <p className="text-[10px] font-medium leading-relaxed text-white/40 italic">
                                    {data.back.bio}
                                </p>
                            </div>
                        </div>

                        {/* Footer HUD */}
                        <div className="mt-8 flex justify-between items-end border-t border-white/5 pt-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-mono text-white/20">PLAYER_ID: {data.front.name.toUpperCase()}_0{data.front.name.length}</span>
                                <span className="text-[8px] font-mono text-white/20">TEAM_ID: {data.front.team.toUpperCase()}</span>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-6 h-6 border border-white/10 rounded flex items-center justify-center text-[8px] font-mono text-white/20">
                                    SH
                                </div>
                                <div className="w-6 h-6 border border-white/10 rounded flex items-center justify-center text-[8px] font-mono text-white/20">
                                    QR
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}



