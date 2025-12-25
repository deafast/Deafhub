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
        <div className="w-full space-y-12 animate-in fade-in duration-700 relative">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#10B981 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            {/* Header with MVP Button */}
            <div className="flex justify-between items-center mb-8 border-b border-emerald-900/20 pb-6">
                <h2 className="text-2xl font-[1000] italic text-white uppercase tracking-tighter flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-emerald-500" /> {title}
                </h2>
                <Dialog>
                    <DialogTrigger asChild>
                        <button className="px-6 py-2 bg-emerald-500 rounded-md text-black font-black uppercase text-[10px] tracking-widest hover:bg-emerald-400 transition-all shadow-[0_5px_15px_rgba(16,185,129,0.3)]">
                            {t.tournamentsPage.mvp}
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md !bg-transparent !border-none !shadow-none p-0 flex items-center justify-center">
                        <DialogTitle className="sr-only">FC 25 MOTM Reveal</DialogTitle>
                        <FC25MVPShowcase />
                    </DialogContent>
                </Dialog>
            </div>

            {/* TIMELINE */}
            <div className="relative flex justify-around items-center w-full px-8 py-10 bg-emerald-950/10 rounded-2xl border border-emerald-500/10">
                <div className="absolute inset-x-20 top-1/2 h-1 bg-emerald-500/5 -z-10" />

                {fcSteps.map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-4">
                        <div className={cn(
                            "w-24 h-12 flex flex-col items-center justify-center border transition-all duration-500",
                            step.status === 'active'
                                ? "border-[#10B981] bg-[#10B981] text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                : step.status === 'done'
                                    ? "border-emerald-500/50 text-emerald-500 bg-black/40"
                                    : "border-white/10 bg-neutral-900 text-white/20"
                        )}>
                            <span className="text-[10px] font-black">{step.label}</span>
                            <span className="text-[9px] opacity-70 font-mono">{step.time}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* MATCH FACTS GRID */}
            <div className="space-y-6">
                <h3 className="text-lg font-black italic text-white uppercase tracking-widest flex items-center gap-3 leading-none">
                    <Activity className="text-emerald-500 w-5 h-5" /> {t.tournamentsPage.overview.generalInfo}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FCCard label={labels.difficulty} value="Ultimate" icon={<Goal className="text-emerald-500" />} />
                    <FCCard label={labels.teamSize} value="11 VS 11" icon={<Users className="text-emerald-500" />} />
                    <FCCard label={labels.matchType} value="Pro Clubs" icon={<Play className="text-emerald-500" />} />
                    <div className="p-6 bg-emerald-500 rounded-xl flex flex-col justify-between h-32">
                        <span className="text-black/40 text-[9px] font-black uppercase tracking-widest">{t.tournamentsPage.prizePool}</span>
                        <div className="text-2xl font-[1000] italic text-black leading-none whitespace-nowrap">{formatter.format(prizePool)} {currency}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FCCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
    return (
        <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col justify-between h-32 hover:border-emerald-500/30 transition-all">
            <div className="flex justify-between items-start">
                <span className="text-white/20 text-[10px] font-black uppercase tracking-widest">{label}</span>
                {icon}
            </div>
            <div className="text-xl font-[1000] italic text-white uppercase leading-none">{value}</div>
        </div>
    );
}
