'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle } from 'lucide-react';

export default function LivePage() {
    const matches = [
        { id: 1, time: '18:00', game: 'Dota 2', title: 'Team Secret vs Team Spirit', status: 'live' },
        { id: 2, time: '19:30', game: 'CS2', title: 'NAVI vs FaZe Clan', status: 'upcoming' },
        { id: 3, time: '21:00', game: 'FC25', title: 'Champions League DH Finals', status: 'upcoming' },
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Live Hub</h1>

            <Tabs defaultValue="matches" className="w-full">
                <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl mb-8">
                    <TabsTrigger value="tournaments" className="rounded-lg px-8">Tournaments</TabsTrigger>
                    <TabsTrigger value="matches" className="rounded-lg px-8">Matches</TabsTrigger>
                </TabsList>

                <TabsContent value="matches" className="space-y-4">
                    {matches.map((match) => (
                        <Card key={match.id} className="p-4 border-white/10 bg-white/5 flex items-center justify-between hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${match.status === 'live' ? 'bg-red-500 animate-pulse' : 'bg-foreground/20'}`} />
                                    <span className="text-sm font-bold tabular-nums text-foreground/60">{match.time}</span>
                                </div>
                                <Badge variant="outline" className="rounded-lg border-[#22D3EE]/20 bg-[#22D3EE]/5 text-[#22D3EE] font-bold">
                                    {match.game}
                                </Badge>
                                <span className="font-semibold text-lg">{match.title}</span>
                            </div>
                            <Button size="sm" className="rounded-xl bg-[#22D3EE] text-[#0A0F14] hover:bg-[#22D3EE]/90">
                                Open
                            </Button>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="tournaments">
                    <div className="flex flex-col items-center justify-center py-24 text-foreground/30">
                        <PlayCircle className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-sm uppercase tracking-widest font-medium">No live tournaments right now</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
