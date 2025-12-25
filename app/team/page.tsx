'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RoleBadge, { RoleType } from '@/components/shared/RoleBadge';
import { Check, X, Crown } from 'lucide-react';

export default function TeamPage() {
    const requests = [
        { name: 'SilentKiller', role: 'CARRY' as RoleType },
        { name: 'EchoPusher', role: 'SUPPORT' as RoleType },
    ];

    const roster = [
        { name: 'DH_Captain', role: 'MID' as RoleType, isCaptain: true, online: true },
        { name: 'GigaChad', role: 'OFFLANE' as RoleType, isCaptain: false, online: true },
        { name: 'ShadowStep', role: 'CARRY' as RoleType, isCaptain: false, online: false },
        { name: 'CrystalClear', role: 'SUPPORT' as RoleType, isCaptain: false, online: true },
    ];

    return (
        <div className="container mx-auto px-4 py-8 space-y-12">
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Incoming Requests</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {requests.map((req) => (
                        <Card key={req.name} className="p-6 border-white/10 bg-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#22D3EE]/20 flex items-center justify-center font-bold">
                                    {req.name[0]}
                                </div>
                                <div className="space-y-1">
                                    <div className="font-bold">{req.name}</div>
                                    <RoleBadge role={req.role} />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="icon" className="h-9 w-9 rounded-xl bg-green-600 hover:bg-green-500 shadow-[0_0_15px_rgba(22,163,74,0.4)]">
                                    <Check className="w-5 h-5" />
                                </Button>
                                <Button size="icon" variant="outline" className="h-9 w-9 rounded-xl border-red-600/50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Active Roster</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {roster.map((player) => (
                        <Card key={player.name} className="group p-8 border-white/10 bg-white/5 text-center space-y-4 hover:border-[#22D3EE]/30 transition-all">
                            <div className="relative mx-auto w-24 h-24">
                                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#22D3EE]/20 to-black flex items-center justify-center text-3xl font-bold">
                                    {player.name[0]}
                                </div>
                                {player.online && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-background" />
                                )}
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-center gap-2">
                                    <span className="font-bold text-lg">{player.name}</span>
                                    {player.isCaptain && <Crown className="w-4 h-4 text-yellow-500" />}
                                </div>
                                <RoleBadge role={player.role} className="justify-center" />
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
