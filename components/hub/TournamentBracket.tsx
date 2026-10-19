import type {State,Match} from '@/lib/tournament/engine';

export default function TournamentBracket({state,ru,name}:{state:State;ru:boolean;name:(id:string)=>string}) {
 const t=(r:string,e:string)=>ru?r:e;
 const matches=state.matches.filter(m=>!m.stage.startsWith('group:'));
 if(!matches.length)return <p className="text-white/70">{t('Плей-офф появится после завершения групп и публикации квалификации.','Playoffs appear after the groups finish and qualification is published.')}</p>;
 const lanes=['upper','lower','final','reset','bronze'].filter(stage=>matches.some(m=>m.stage===stage));
 const titles:Record<string,string>={upper:t('Верхняя сетка','Upper bracket'),lower:t('Нижняя сетка','Lower bracket'),final:t('Гранд-финал','Grand final'),reset:t('Повторный финал','Grand final reset'),bronze:t('Матч за третье место','Bronze match')};
 const positions=new Map<string,{x:number;y:number}>();let height=0,width=300;
 const headings:{title:string;y:number}[]=[];
 for(const lane of lanes){
  const items=matches.filter(m=>m.stage===lane),depths=new Map<string,number>();
  for(const m of items)depths.set(m.id,Math.max(0,...m.sources.map(s=>'match'in s&&depths.has(s.match)?depths.get(s.match)!+1:0)));
  const columns=Array.from(new Set(depths.values())).sort((a,b)=>a-b);
  headings.push({title:titles[lane],y:height});height+=42;
  const count=Math.max(...columns.map(c=>items.filter(m=>depths.get(m.id)===c).length));
  for(const c of columns){const col=items.filter(m=>depths.get(m.id)===c);col.forEach((m,i)=>positions.set(m.id,{x:c*300,y:height+((i+.5)*count/col.length-.5)*148}));}
  width=Math.max(width,columns.length*300);height+=count*148+24;
 }
 const destinations=(m:Match,outcome:'winner'|'loser')=>matches.filter(n=>n.sources.some(s=>'match'in s&&s.match===m.id&&s.outcome===outcome)).map(n=>n.id);
 const participant=(m:Match,index:0|1)=>{
  const id=index===0?m.a:m.b,s=m.sources[index];
  return id?name(id):'match'in s?`${s.outcome==='winner'?t('Победитель','Winner'):t('Проигравший','Loser')} ${s.match}`:t('Свободное место','BYE');
 };
 return <section aria-label={t('Схема плей-офф','Playoff bracket')} className="space-y-3">
 <p className="text-sm text-white/70">{state.config.format==='double'?t('Поражение в верхней сетке → нижняя сетка. Поражение в нижней → выбывание. Победители сеток → гранд-финал.','Upper bracket loss → lower bracket. Lower bracket loss → elimination. Bracket winners → grand final.'):t('Поражение → выбывание из борьбы за чемпионство.','A loss eliminates the entry from championship contention.')}</p>
 <p className="text-sm text-white/70">{t('Линии показывают переходы победителей. Переходы проигравших подписаны в карточках. На узком экране прокрутите схему вправо.','Lines show winner progression. Loser destinations are listed on the cards. Scroll horizontally on narrow screens.')}</p>
 <div tabIndex={0} role="region" aria-label={t('Прокручиваемая турнирная сетка','Scrollable tournament bracket')} className="overflow-x-auto rounded-2xl border border-white/10 p-4 focus-visible:outline-2 focus-visible:outline-[#22D3EE]">
 <div className="relative" style={{width,height}}>
 <svg aria-hidden="true" className="pointer-events-none absolute inset-0" width={width} height={height}>{matches.flatMap(m=>m.sources.flatMap(s=>{
  if(!('match'in s)||s.outcome!=='winner')return [];
  const a=positions.get(s.match),b=positions.get(m.id);if(!a||!b||a.x>=b.x)return [];
  const x=a.x+268,y=a.y+52,end=b.x;
  return [<path key={`${s.match}-${m.id}`} d={`M${x} ${y} H${x+16} V${b.y+52} H${end}`} fill="none" stroke="#22D3EE" strokeOpacity=".45" strokeWidth="1.5"/>];
 }))}</svg>
 {headings.map(h=><h4 key={h.title} className="absolute text-lg font-bold text-[#22D3EE]" style={{top:h.y,left:0}}>{h.title}</h4>)}
 {matches.map(m=>{const pos=positions.get(m.id)!;const win=destinations(m,'winner'),lose=destinations(m,'loser');return <article key={m.id} aria-label={`${titles[m.stage]} ${m.id}`} className="absolute w-[268px] rounded-2xl border border-white/15 bg-[#0A0F14] p-3 text-sm" style={{left:pos.x,top:pos.y}}>
 <p className="mb-2 flex justify-between text-xs text-white/70"><span>{m.id}</span><span>{({waiting:t('Ожидает','Waiting'),ready:t('Готов','Ready'),finished:t('Завершён','Finished'),bye:'BYE',skipped:t('Не требуется','Not required')})[m.status]}</span></p>
 {([0,1]as const).map(i=>{const id=i===0?m.a:m.b;return <div key={i} className={`flex items-center justify-between gap-2 ${id&&m.winner===id?'font-bold text-[#22D3EE]':'text-white'}`}><span className="truncate" title={participant(m,i)}>{participant(m,i)}</span><span>{m.result?.kind==='played'?(i===0?m.result.a:m.result.b):'—'}</span></div>})}
 <p className="mt-2 text-xs text-white/70">{win.length?`${t('Победа','Win')} → ${win.join(', ')}`:m.winner&&state.champion===m.winner?t('Победитель турнира','Tournament winner'):''}{lose.length?` · ${t('Поражение','Loss')} → ${lose.join(', ')}`:m.stage==='lower'?` · ${t('Поражение → выбывание','Loss → eliminated')}`:''}</p>
 </article>})}
 </div></div></section>;
}
