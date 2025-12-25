'use client';

import AvatarView from '@/components/r3f/AvatarView';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RoleBadge, { RoleType } from '@/components/shared/RoleBadge';
import { Trophy, Medal } from 'lucide-react';

export default function ProfilePage() {
    const history = [
        { game: 'Dota 2', role: 'MID' as RoleType, hero: 'Void Spirit', kda: '12/2/8', result: 'WIN' },
        { game: 'Dota 2', role: 'SUPPORT' as RoleType, hero: 'Lion', kda: '3/10/24', result: 'LOSS' },
        { game: 'Dota 2', role: 'MID' as RoleType, hero: 'Storm Spirit', kda: '8/4/12', result: 'WIN' },
    ];

    return (
        <div className="container mx-auto px-4 py-8 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <Card className="lg:col-span-1 p-8 border-white/10 bg-white/5 space-y-6">
                    <AvatarView className="aspect-square w-full" />
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">DH_Warrior</h1>
                        <Badge variant="outline" className="rounded-lg border-[#22D3EE]/20 bg-[#22D3EE]/5 text-[#22D3EE] font-bold">
                            DOTA 2 PRO
                        </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold">124</div>
                            <div className="text-[10px] text-foreground/40 uppercase">Wins</div>
                        </div>
                        <div className="text-center border-x border-white/5">
                            <div className="text-2xl font-bold">58%</div>
                            <div className="text-[10px] text-foreground/40 uppercase">Winrate</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">4.2</div>
                            <div className="text-[10px] text-foreground/40 uppercase">KDA</div>
                        </div>
                    </div>
                </Card>

                <div className="lg:col-span-2 space-y-8">
                    {/* Trophies */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">Tournament Achievements</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Card className="p-4 border-yellow-500/20 bg-yellow-500/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-yellow-500 rounded-lg"><Trophy className="w-5 h-5 text-black" /></div>
                                    <div className="font-bold">CHAMPION</div>
                                </div>
                                <div className="text-sm text-foreground/60">DH Winter Blast 2025</div>
                            </Card>
                            <Card className="p-4 border-gray-400/20 bg-gray-400/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-gray-400 rounded-lg"><Medal className="w-5 h-5 text-black" /></div>
                                    <div className="font-bold">FINALIST</div>
                                </div>
                                <div className="text-sm text-foreground/60">Arena Master #12</div>
                            </Card>
                        </div>
                    </div>

                    {/* Match History */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">Match History</h2>
                        <div className="space-y-3">
                            {history.map((match, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-8">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-[10px]">
                                            {match.hero[0]}
                                        </div>
                                        <div className="w-32">
                                            <RoleBadge role={match.role} />
                                            <div className="text-sm font-medium">{match.hero}</div>
                                        </div>
                                        <div className="text-sm font-bold tabular-nums w-16">{match.kda}</div>
                                    </div>
                                    <Badge className={match.result === 'WIN' ? 'bg-green-500' : 'bg-red-500'}>
                                        {match.result}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
