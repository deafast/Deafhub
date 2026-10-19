'use client';
import {useState} from 'react';
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
export default function TournamentDemo(){
 const ru=useLanguageStore(s=>s.language==='ru');const [double,setDouble]=useState(true);
 return <main className="mx-auto min-h-screen max-w-5xl px-5 pb-28 pt-32 text-white">
 <h1 className="text-3xl font-bold">{ru?'Демонстрация таблиц и сетки':'Tables and bracket preview'}</h1>
 <p className="my-5 rounded-xl border border-[#22D3EE]/30 p-4">{ru?'ДЕМО. Временные вымышленные команды и результаты только для просмотра. В базу, реальные награды и статистику не записываются.':'DEMO. Temporary fictional teams and scores for visual review only. Nothing is saved to the database, real awards or statistics.'}</p>
 <div className="mb-6 flex flex-wrap gap-3">{[false,true].map(value=><button key={String(value)} aria-pressed={double===value} onClick={()=>setDouble(value)} className={`min-h-11 rounded-xl border px-4 py-3 ${double===value?'border-[#22D3EE] text-[#22D3EE]':'border-white/20'}`}>{value?'Double Elimination':'Single + Bronze'}</button>)}</div>
 <TournamentEngine demo key={String(double)} id="demo-read-only" game="dota2" owner={false} ru={ru} approved={entries} name={name} onSaved={async()=>{}} initial={{revision:1,state:sample(double)}}/>
 </main>;
}
