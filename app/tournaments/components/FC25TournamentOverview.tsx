'use client';

import type { ReactNode } from 'react';

import { Activity, Users, Play, Goal } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";

import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/useLanguageStore";

import FC25MVPShowcase from './FC25MVPShowcase';

type StepStatus = 'done' | 'active' | 'pending';

export function FC25TournamentOverview() {
    const { t, language } = useLanguageStore();

    const fcSteps: { label: string; time: string; status: StepStatus }[] = language === 'ru'
        ? [
            { label: 'СТАРТ', time: '00:00', status: 'done' },
            { label: 'ПЕРЕРЫВ', time: '45:00', status: 'active' },
            { label: 'ФИНАЛ', time: '90:00', status: 'pending' },
        ]
        : [
            { label: 'KICK OFF', time: '00:00', status: 'done' },
            { label: 'HALFTIME', time: '45:00', status: 'active' },
            { label: 'FULL TIME', time: '90:00', status: 'pending' },
        ];

    const labels = language === 'ru'
        ? {
            difficulty: 'СЛОЖНОСТЬ',
            teamSize: 'СОСТАВ',
            matchType: 'ТИП МАТЧА',
        }
        : {
            difficulty: 'DIFFICULTY',
            teamSize: 'TEAM SIZE',
            matchType: 'MATCH TYPE',
        };

    const formatter = new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US');
    const prizePool = 15_000;
    const currency = '₽';

    const title = `${t.tournamentsPage.games.fc25.name} — ${t.tournamentsPage.games.fc25.desc}`.toUpperCase();

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-700 relative">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#10B981 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            {/* Header with MVP Button */}
            <div className="flex justify-between items-center mb-4 border-b border-emerald-900/10 pb-4">
                <h2 className="text-xl font-[1000] italic text-white uppercase tracking-tighter flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-emerald-500" /> {title}
                </h2>
                <Dialog>
                    <DialogTrigger asChild>
                        <button className="px-4 py-1.5 bg-emerald-500 rounded text-black font-black uppercase text-[9px] tracking-widest hover:bg-emerald-400 transition-all">
                            {t.tournamentsPage.mvp}
                        </button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-[95vw] lg:max-w-screen-lg !bg-transparent !border-none !shadow-none p-2 sm:p-6 md:p-10 flex items-center justify-center overflow-y-auto max-h-[90vh] outline-none">
                        <DialogTitle className="sr-only">FC 25 MOTM Reveal</DialogTitle>
                        <FC25MVPShowcase />
                    </DialogContent>
                </Dialog>
            </div>

            {/* TIMELINE */}
            <div className="relative flex justify-around items-center w-full px-6 py-6 bg-emerald-950/10 rounded-xl border border-emerald-500/10">
                <div className="absolute inset-x-20 top-1/2 h-0.5 bg-emerald-500/5 -z-10" />

                {fcSteps.map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2">
                        <div className={cn(
                            "w-20 h-10 flex flex-col items-center justify-center border transition-all duration-500",
                            step.status === 'active'
                                ? "border-[#10B981] bg-[#10B981] text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                : step.status === 'done'
                                    ? "border-emerald-500/50 text-emerald-500 bg-black/40"
                                    : "border-white/10 bg-neutral-900 text-white/20"
                        )}>
                            <span className="text-[9px] font-black">{step.label}</span>
                            <span className="text-[8px] opacity-70 font-mono">{step.time}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* MATCH FACTS GRID */}
            <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FCCard label={labels.difficulty} value="Ultimate" icon={<Goal className="text-emerald-500" />} />
                    <FCCard label={labels.teamSize} value="11 VS 11" icon={<Users className="text-emerald-500" />} />
                    <FCCard label={labels.matchType} value="Pro Clubs" icon={<Play className="text-emerald-500" />} />
                    <div className="p-4 bg-emerald-500 rounded-xl flex flex-col justify-between h-24">
                        <span className="text-black/40 text-[9px] font-black uppercase tracking-widest">{t.tournamentsPage.prizePool}</span>
                        <div className="text-xl font-[1000] italic text-black leading-none">{formatter.format(prizePool)} {currency}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FCCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
    return (
        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col justify-between h-24 hover:border-emerald-500/30 transition-all">
            <div className="flex justify-between items-start">
                <span className="text-white/20 text-[9px] font-black uppercase tracking-widest">{label}</span>
                {icon}
            </div>
            <div className="text-lg font-[1000] italic text-white uppercase leading-none">{value}</div>
        </div>
    );
}

