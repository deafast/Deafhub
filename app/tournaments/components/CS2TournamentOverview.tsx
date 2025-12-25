'use client';

import type { ReactNode } from 'react';

import { Target, Shield, Zap, Crosshair, Terminal } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";

import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/useLanguageStore";

import CS2MVPShowcase from './CS2MVPShowcase';

type StepStatus = 'done' | 'active' | 'pending';

export function CS2TournamentOverview() {
    const { t, language } = useLanguageStore();

    const csSteps: { label: string; status: StepStatus }[] = [
        { label: t.tournamentsPage.overview.steps.checkin, status: 'done' },
        { label: t.tournamentsPage.overview.steps.mapVeto, status: 'done' },
        { label: t.tournamentsPage.overview.steps.liveMatch, status: 'active' },
        { label: t.tournamentsPage.overview.steps.debrief, status: 'pending' },
    ];

    const formatter = new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US');
    const prizePool = 25_000;
    const currency = '₽';

    const title = `${t.tournamentsPage.games.cs2.name} — ${t.tournamentsPage.games.cs2.desc}`.toUpperCase();

    return (
        <div className="w-full space-y-12 animate-in fade-in duration-700 relative">
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%]" />

            {/* Header with MVP Button */}
            <div className="flex justify-between items-center mb-8 border-b border-cyan-900/20 pb-6">
                <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter flex items-center gap-2">
                    <span className="text-[#22D3EE]">::</span> {title}
                </h2>
                <Dialog>
                    <DialogTrigger asChild>
                        <button className="flex items-center gap-3 px-6 py-2 bg-neutral-900 border border-cyan-500/50 rounded-md text-[#22D3EE] font-black uppercase text-[10px] tracking-widest hover:bg-cyan-500/10 transition-all">
                            <Terminal size={14} /> {t.tournamentsPage.mvp}
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-screen-lg !bg-transparent !border-none !shadow-none p-0 flex items-center justify-center">
                        <DialogTitle className="sr-only">CS2 Combat Report</DialogTitle>
                        <CS2MVPShowcase />
                    </DialogContent>
                </Dialog>
            </div>

            {/* TIMELINE */}
            <div className="relative flex justify-between items-center w-full px-8 py-10 bg-black/60 rounded-xl border border-cyan-500/10">
                <div className="absolute inset-x-12 top-1/2 h-[1px] bg-cyan-500/20 -z-10" />

                {csSteps.map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 flex items-center justify-center border transition-all duration-300",
                            step.status === 'active'
                                ? "border-[#22D3EE] bg-[#22D3EE]/20 shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                                : step.status === 'done'
                                    ? "border-cyan-500 text-cyan-500 bg-neutral-900"
                                    : "border-white/10 bg-neutral-950 text-white/20"
                        )}>
                            <div className="relative">
                                {step.status === 'active' && <div className="absolute inset-[-4px] border border-cyan-400 opacity-50 animate-ping" />}
                                <Target size={18} />
                            </div>
                        </div>
                        <p className={cn(
                            "text-[9px] font-mono font-bold uppercase tracking-widest",
                            step.status === 'active' ? "text-[#22D3EE]" : "text-white/20"
                        )}>
                            {step.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* INFO GRID */}
            <div className="space-y-6">
                <h3 className="text-lg font-black italic text-white uppercase tracking-widest flex items-center gap-2 leading-none font-mono">
                    {">"} {t.tournamentsPage.overview.generalInfo}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <CSCard label={t.tournamentsPage.overview.format} value="MR12" icon={<Shield className="text-cyan-400" />} />
                    <CSCard label={t.tournamentsPage.overview.server} value="Sub-Tick" icon={<Zap className="text-cyan-400" />} />
                    <CSCard label={t.tournamentsPage.overview.mode} value="5 VS 5" icon={<Crosshair className="text-cyan-400" />} />
                    <div className="p-5 border-l-4 border-cyan-500 bg-cyan-500/5 flex flex-col justify-between h-32">
                        <span className="text-white/20 text-[9px] font-mono uppercase tracking-widest">{t.tournamentsPage.prizePool}</span>
                        <div className="text-2xl font-black italic text-white leading-none">{formatter.format(prizePool)} {currency}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CSCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
    return (
        <div className="p-5 border border-white/5 bg-white/[0.01] flex flex-col justify-between h-32 group hover:border-cyan-500/30 transition-all">
            <div className="flex justify-between items-start">
                <span className="text-white/20 text-[9px] font-mono uppercase tracking-widest">{label}</span>
                {icon}
            </div>
            <div className="text-xl font-black italic text-white uppercase tracking-tighter leading-none group-hover:text-cyan-400 transition-colors">{value}</div>
        </div>
    );
}
