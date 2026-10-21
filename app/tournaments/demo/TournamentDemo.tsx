'use client';
import {useState} from 'react';
import FcRegistrationForm from '@/components/hub/FcRegistrationForm';
import {fcLevelLabel,type FcLevel} from '@/lib/tournament/fc-levels';
import TournamentEngine from '@/components/hub/TournamentEngine';
import {createTournament,transition,type Config,type State} from '@/lib/tournament/engine';
import {useLanguageStore} from '@/store/useLanguageStore';
const entries=Array.from({length:8},(_,i)=>`demo-${i+1}`);
const labels=['Aurora','Vector','Orbit','Pulse','Nova','Vertex','Echo','Zenith'];
const name=(id:string)=>`DEMO · ${labels[entries.indexOf(id)]||id}`;
function sample(double:boolean):State {
 const config:Config={format:double?'double':'single',grandFinal:'reset',bestOf:3,...(!double?{bronzeMatch:true}:{}),groups:[{id:'A',entries:entries.slice(0,4)},{id:'B',entries:entries.slice(4)}],qualify:2,points:{win:3,draw:1,loss:0}};
 let state=createTournament('dota2',entries,config);
 for(const match of [...state.matches]) state=transition(state,{type:'result',match:match.id,result:{kind:'played',a:2,b:0},invalidate:false,reason:'DEMO: synthetic preview only'});
 state=transition(state,{type:'qualify',ties:{}});
 let next=state.matches.find(m=>m.status==='ready');
 while(next){state=transition(state,{type:'result',match:next.id,result:{kind:'played',a:2,b:1},invalidate:false,reason:'DEMO: synthetic preview only'});next=state.matches.find(m=>m.status==='ready');}
 return state;
}
export default function TournamentDemo({fcPlayers,fcGroups}:{fcPlayers:{id:string;level:FcLevel}[];fcGroups:{id:string;entries:string[]}[]}){
 const ru=useLanguageStore(s=>s.language==='ru');const [double,setDouble]=useState(true);
 return <main className="mx-auto min-h-screen max-w-5xl px-5 pb-28 pt-32 text-white">
 <h1 className="text-3xl font-bold">{ru?'Демонстрация таблиц и сетки':'Tables and bracket preview'}</h1>
 <p className="my-5 rounded-xl border border-[#22D3EE]/30 p-4">{ru?'ДЕМО. Временные вымышленные команды и результаты только для просмотра. В базу, реальные награды и статистику не записываются.':'DEMO. Temporary fictional teams and scores for visual review only. Nothing is saved to the database, real awards or statistics.'}</p>
 <section className="mb-8 space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5"><h2 className="text-2xl font-bold">{ru?'FC: заявка и распределение по уровню':'FC: entry and level-based groups'}</h2><p className="text-sm leading-6 text-white/70">{ru?'ДЕМО: 16 вымышленных участников, 4 группы. В каждой — один сильный, два средних и один любитель. Жеребьёвка выполнена тем же серверным алгоритмом. Форма ниже только для просмотра, отправка отключена.':'DEMO: 16 fictional entrants in four groups. Each group has one advanced, two intermediate and one amateur player. The same server algorithm performs the draw. The form is for review only; submission is disabled.'}</p><div className="max-w-lg"><FcRegistrationForm ru={ru} busy tournamentId="demo-fc-read-only" rulesVersion="demo" onSubmit={event=>event.preventDefault()}/></div><div className="grid gap-4 sm:grid-cols-2">{fcGroups.map(group=><article key={group.id} className="rounded-2xl border border-white/10 p-4"><h3 className="font-bold text-[#22D3EE]">{ru?'Группа':'Group'} {group.id}</h3><ul className="mt-3 space-y-3 text-sm">{group.entries.map(id=><li key={id} className="flex flex-wrap justify-between gap-2"><span>{ru?'ДЕМО · Игрок':'DEMO · Player'} {fcPlayers.findIndex(p=>p.id===id)+1}</span><span className="text-white/70">{fcLevelLabel(fcPlayers.find(p=>p.id===id)?.level,ru)}</span></li>)}</ul></article>)}</div></section>
 <div className="mb-6 flex flex-wrap gap-3">{[false,true].map(value=><button key={String(value)} aria-pressed={double===value} onClick={()=>setDouble(value)} className={`min-h-11 rounded-xl border px-4 py-3 ${double===value?'border-[#22D3EE] text-[#22D3EE]':'border-white/20'}`}>{value?'Double Elimination':'Single + Bronze'}</button>)}</div>
 <TournamentEngine demo key={String(double)} id="demo-read-only" game="dota2" owner={false} ru={ru} approved={entries} name={name} onSaved={async()=>{}} initial={{revision:1,state:sample(double)}}/>
 </main>;
}
