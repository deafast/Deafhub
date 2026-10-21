import { notFound } from 'next/navigation';
import {drawFcGroups} from '@/lib/tournament/fc-groups';
import type {FcLevel} from '@/lib/tournament/fc-levels';
import TournamentDemo from './TournamentDemo';
export const dynamic = 'force-dynamic';
export default function Page() {
 if(process.env.VERCEL_ENV !== 'preview' && process.env.NODE_ENV !== 'development') notFound();
 const fcPlayers=Array.from({length:16},(_,i)=>({id:`demo-fc-${i+1}`,level:(i<4?'strong':i<12?'intermediate':'amateur') as FcLevel}));
 return <TournamentDemo fcPlayers={fcPlayers} fcGroups={drawFcGroups(fcPlayers,['A','B','C','D'])}/>;
}
