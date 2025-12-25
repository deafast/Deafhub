'use client';

import type { ReactNode } from 'react';

import { Swords, Trophy, Users, Check, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";

import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/useLanguageStore";

import DotaMVPShowcase from './DotaMVPShowcase';

type StepStatus = 'done' | 'active' | 'pending';

export function DotaTournamentOverview() {
    const { t, language } = useLanguageStore();

    const dotaSteps: { label: string; status: StepStatus }[] = [
        { label: t.tournamentsPage.overview.steps.reg, status: 'done' },
        { label: t.tournamentsPage.overview.steps.close, status: 'done' },
        { label: t.tournamentsPage.overview.steps.check, status: 'active' },
        { label: t.tournamentsPage.overview.steps.start, status: 'pending' },
        { label: t.tournamentsPage.overview.steps.final, status: 'pending' },
    ];

    const formatter = new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US');
    const entryFee = 500;
    const prizePool = 50_000;
    const currency = '₽';

    const title = `${t.tournamentsPage.games.dota2.name} — ${t.tournamentsPage.games.dota2.desc}`.toUpperCase();

    return (
        <div className="w-full space-y-12 animate-in fade-in duration-700">

            {/* Header with MVP Button */}
            <div className="flex justify-between items-center mb-8 border-b border-red-900/20 pb-6">
                <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter flex items-center gap-2">
                    <span className="text-[#DC2626]">#</span> {title}
                </h2>
                <Dialog>
                    <DialogTrigger asChild>
                        <button className="px-6 py-2 bg-gradient-to-r from-[#DC2626] to-[#F59E0B] rounded-lg text-black font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                            {t.tournamentsPage.mvpSeason1}
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-screen-lg !bg-transparent !border-none !shadow-none p-0 flex items-center justify-center">
                        <DialogTitle className="sr-only">Dota 2 MVP Showcase</DialogTitle>
                        <DotaMVPShowcase />
                    </DialogContent>
                </Dialog>
            </div>

            {/* TOP TIMELINE */}
            <div className="relative flex justify-between items-center w-full px-4 md:px-12 py-10 bg-black/40 rounded-2xl border border-white/5">
                <div className="absolute inset-x-12 top-1/2 h-0.5 bg-white/5 -z-10" />

                {dotaSteps.map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                            step.status === 'active'
                                ? "border-[#DC2626] bg-[#DC2626]/20 shadow-[0_0_20px_rgba(220,38,38,0.6)] scale-110"
                                : step.status === 'done'
                                    ? "border-green-500 bg-green-500/10 text-green-500"
                                    : "border-white/10 bg-neutral-900 text-white/20"
                        )}>
                            {step.status === 'done' ? <Check size={20} /> : <div className={cn("w-3 h-3 rounded-full", step.status === 'active' ? "bg-[#DC2626]" : "bg-white/10")} />}
                        </div>
                        <p className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            step.status === 'active' ? "text-[#DC2626]" : "text-white/30"
                        )}>
                            {step.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* BOTTOM INFO GRID */}
            <div className="space-y-6">
                <h3 className="text-lg font-black italic text-white uppercase tracking-widest flex items-center gap-2 leading-none">
                    <ChevronRight className="text-[#DC2626]" /> {t.tournamentsPage.overview.generalInfo}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <DotaInfoCard label={t.tournamentsPage.overview.discipline} value={t.tournamentsPage.games.dota2.name} icon={<Swords className="text-[#DC2626]" />} />
                    <DotaInfoCard label={t.tournamentsPage.overview.format} value="5 VS 5" icon={<Users className="text-[#DC2626]" />} />
                    <DotaInfoCard label={t.tournamentsPage.overview.mode} value="CAPTAINS MODE" icon={<Trophy className="text-[#DC2626]" />} />
                    <div className="p-5 rounded-xl border border-[#DC2626]/50 bg-gradient-to-br from-[#DC2626]/20 to-transparent flex flex-col justify-between h-32">
                        <span className="text-white/20 text-[9px] font-black uppercase tracking-widest">{t.tournamentsPage.overview.fee}</span>
                        <div>
                            <div className="text-2xl font-black italic text-white leading-none">{formatter.format(entryFee)} {currency}</div>
                            <div className="text-[9px] font-bold text-red-500 mt-1 uppercase">{t.tournamentsPage.prizePool}: {formatter.format(prizePool)} {currency}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DotaInfoCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
    return (
        <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col justify-between h-32 hover:bg-white/5 transition-all">
            <div className="flex justify-between items-start">
                <span className="text-white/20 text-[9px] font-black uppercase tracking-widest">{label}</span>
                {icon}
            </div>
            <div className="text-xl font-black italic text-white uppercase tracking-tighter leading-none">{value}</div>
        </div>
    );
}
