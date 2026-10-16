'use client';
import { useCallback, useState, type FormEvent } from 'react';
import { standings, type Command, type Config, type State } from '@/lib/tournament/engine';
type Props={id:string;owner:boolean;ru:boolean;approved:string[];name:(id:string)=>string;onSaved:()=>Promise<void>;initial:{revision:number;state:State}|null};
const field='mt-2 block w-full rounded-xl border border-white/15 bg-[#0A0F14] p-3 text-white';
const button='rounded-xl bg-[#22D3EE] px-4 py-3 font-bold text-[#0A0F14] disabled:opacity-40';
export default function TournamentEngine({id,owner,ru,approved,name,onSaved,initial}:Props) {
 const [state,setState]=useState<State|null>(initial?.state||null),[revision,setRevision]=useState(initial?.revision||0),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const text=(r:string,e:string)=>ru?r:e;
 const load=useCallback(async()=>{
  const response=await fetch(`/api/tournament-engine?id=${id}`,{cache:'no-store'});
  if(!response.ok)throw new Error('Tournament engine unavailable');
  const data=await response.json();setState(data.state);setRevision(data.revision);
 },[id]);
 async function save(command:Command|{type:'launch';config:Config;entries:string[]}) {
  setBusy(true);setError('');
  try {
   const response=await fetch('/api/tournament-engine',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tournament_id:id,revision,request_id:crypto.randomUUID(),command})});
   const data=await response.json();if(!response.ok)throw new Error(data.error);
   setState(data.state);setRevision(data.revision);await onSaved();
  }catch(e){setError(e instanceof Error?e.message:'Could not save');await load().catch(()=>{});}finally{setBusy(false);}
 }
 function launch(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();const values=new FormData(event.currentTarget),count=Number(values.get('groups'));
  const entries=[...approved].sort((a,b)=>name(a).localeCompare(name(b))||a.localeCompare(b));
  const groups=Array.from({length:count},(_,i)=>({id:String.fromCharCode(65+i),entries:entries.filter((_,n)=>n%count===i)}));
  void save({type:'launch',entries,config:{format:values.get('format') as Config['format'],grandFinal:values.get('grandFinal') as Config['grandFinal'],bestOf:Number(values.get('bestOf')) as Config['bestOf'],groups,qualify:Number(values.get('qualify')),points:{win:Number(values.get('win')),draw:Number(values.get('draw')),loss:Number(values.get('loss'))}}});
 }
 function qualify(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();const values=new FormData(event.currentTarget),ties:Record<string,string[]>={};
  for(const g of state!.config.groups) {
   const order=g.entries.map((_,i)=>String(values.get(`${g.id}.${i}`)||''));
   if(order.some(Boolean))ties[g.id]=order;
  }
  void save({type:'qualify',ties});
 }
 return <details className="border-t border-white/10 pt-4"><summary className="cursor-pointer text-[#22D3EE]">{text('Этапы и турнирная сетка','Stages and bracket')}</summary>
 {error?<p role="alert" className="mt-3 text-red-300">{error}</p>:null}
 <button disabled={busy} type="button" className="mt-3 text-sm text-[#22D3EE]" onClick={()=>void load().catch(e=>setError(e.message))}>{text('Обновить этапы','Refresh stages')}</button>
 {!state?(owner?<form onSubmit={launch} className="mt-4 grid gap-4 sm:grid-cols-2">
  <p className="text-sm text-white/60 sm:col-span-2">{text('Запуск закрывает регистрацию и фиксирует допущенные команды. Сначала рассмотрите все заявки. Группы распределяются по очереди из списка команд по названию. Очки и порядок тай-брейков должны соответствовать опубликованному регламенту: очки → победы → разница → забито; оставшееся равенство решает организатор.','Launching closes registration and locks approved entries. Review every entry first. Groups alternate through entries sorted by name. Publish matching rules: points → wins → difference → scored; the organizer resolves remaining ties.')}</p>
  <label>{text('Плей-офф','Playoffs')}<select name="format" className={field}><option value="single">Single Elimination</option><option value="double">Double Elimination</option></select></label>
  <label>{text('Гранд-финал Double','Double grand final')}<select name="grandFinal" className={field}><option value="reset">{text('Повторный финал при победе нижней сетки','Reset if lower bracket wins')}</option><option value="single">{text('Один финал','One final')}</option></select></label>
  <label>{text('Формат серии (FC: плей-офф)','Series format (FC: playoffs)')}<select name="bestOf" className={field}>{[1,3,5].map(n=><option key={n} value={n}>BO{n}</option>)}</select></label>
  <label>{text('Групповой этап','Group stage')}<select name="groups" className={field}><option value="0">{text('Без групп','No groups')}</option>{[2,4,8].map(n=><option key={n} value={n}>{n} {text('группы','groups')}</option>)}</select></label>
  <label>{text('Выходят из каждой группы','Qualifiers per group')}<input name="qualify" type="number" min="1" max="32" defaultValue="2" className={field} required/></label>
  {[['win',text('Очки за победу','Win points'),3],['draw',text('Очки за ничью FC','FC draw points'),1],['loss',text('Очки за поражение','Loss points'),0]].map(([key,label,value])=><label key={key}>{label}<input name={String(key)} type="number" min="0" max="100" defaultValue={value} className={field} required/></label>)}
  <p className="text-sm text-white/60 sm:col-span-2">{text('Посев:','Seeding:')} {approved.length? [...approved].sort((a,b)=>name(a).localeCompare(name(b))||a.localeCompare(b)).map(name).join(' → '):text('Нет допущенных команд','No approved entries')}. {text('Отдельный матч за третье место не создаётся.','No separate third-place match is created.')}</p>
  <button disabled={busy||approved.length<2} className={button}>{text('Запустить этапы','Launch stages')}</button>
 </form>:<p className="mt-3 text-white/60">{text('Сетка ещё не опубликована.','Bracket not published yet.')}</p>):null}
 {state?<div className="mt-4 space-y-5"><p className="text-sm text-[#22D3EE]">{state.config.format==='double'?'Double Elimination':'Single Elimination'} · BO{state.config.bestOf} · {text('Версия','Revision')} {revision}{state.champion?` · ${text('Победитель','Champion')}: ${name(state.champion)}`:''}</p>
 {state.config.groups.map(g=><div key={g.id} className="overflow-x-auto"><h4 className="font-bold">{text('Группа','Group')} {g.id}</h4><table className="mt-3 w-full text-left text-sm"><thead><tr>{[text('Команда','Team'),text('Матчи','Played'),text('Победы','Wins'),text('Ничьи','Draws'),text('Очки','Points'),'+/−'].map(h=><th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{standings(state,g.id).map(r=><tr key={r.entry}><td className="p-2">{name(r.entry)}</td><td className="p-2">{r.played}</td><td className="p-2">{r.wins}</td><td className="p-2">{r.draws}</td><td className="p-2">{r.points}</td><td className="p-2">{r.scored-r.conceded}</td></tr>)}</tbody></table></div>)}
 {owner&&state.phase==='groups'?<form onSubmit={qualify} className="space-y-4"><p className="text-sm text-white/60">{text('При равенстве укажите итоговый порядок всей группы по решению судьи. Неравные позиции не меняются.','For ties, select the complete group order approved by the referee. Unequal ranks stay unchanged.')}</p>{state.config.groups.map(g=><fieldset key={g.id}><legend>{text('Группа','Group')} {g.id}</legend>{g.entries.map((_,i)=><label key={i} className="mt-2 block">{i+1}<select name={`${g.id}.${i}`} className={field} defaultValue=""><option value="">{text('Без решения тай-брейка','No tie decision')}</option>{g.entries.map(e=><option key={e} value={e}>{name(e)}</option>)}</select></label>)}</fieldset>)}<button disabled={busy||state.matches.some(m=>m.status!=='finished')} className={button}>{text('Опубликовать квалификацию и плей-офф','Publish qualification and playoffs')}</button></form>:null}
 <div className="grid gap-4 sm:grid-cols-2">{state.matches.map(m=><article key={m.id} className="rounded-2xl border border-white/10 p-4"><p className="text-xs text-[#22D3EE]">{m.stage} · {m.id} · {({waiting:text('Ожидает участников','Waiting'),ready:text('Готов','Ready'),finished:text('Завершён','Finished'),bye:'BYE',skipped:text('Повторный финал не нужен','Reset not needed')})[m.status]}</p><p className="mt-3 font-bold">{m.a?name(m.a):'—'} — {m.b?name(m.b):'—'}</p>{m.result?<p className="mt-2 text-sm">{m.result.kind==='played'?`${m.result.a} : ${m.result.b}`:`Forfeit · ${name(m.result.loser)}`}</p>:null}
 {owner&&['ready','finished'].includes(m.status)?<details className="mt-3"><summary className="cursor-pointer text-sm text-[#22D3EE]">{m.result?text('Исправить результат','Correct result'):text('Внести результат','Record result')}</summary><form className="mt-3 space-y-3" onSubmit={event=>{event.preventDefault();const v=new FormData(event.currentTarget);void save({type:'result',match:m.id,result:v.get('forfeit')?{kind:'forfeit',loser:String(v.get('forfeit'))}:{kind:'played',a:Number(v.get('a')),b:Number(v.get('b'))},invalidate:v.get('invalidate')==='on',reason:String(v.get('reason'))});}}>
 <div className="flex gap-3"><label>A<input className={field} name="a" aria-label={text('Счёт A','Score A')} type="number" min="0" max="1000" defaultValue={m.result?.kind==='played'?m.result.a:0}/></label><label>B<input className={field} name="b" aria-label={text('Счёт B','Score B')} type="number" min="0" max="1000" defaultValue={m.result?.kind==='played'?m.result.b:0}/></label></div>
 <label className="block">{text('Техническое поражение','Forfeit')}<select name="forfeit" className={field}><option value="">{text('Нет — использовать счёт','None — use score')}</option>{[m.a,m.b].filter(Boolean).map(e=><option key={e!} value={e!}>{name(e!)}</option>)}</select></label>
 <label className="block">{text('Основание / решение судьи','Evidence / referee decision')}<input name="reason" className={field} minLength={3} maxLength={500} required/></label>
 {m.result?<label className="flex gap-2 text-sm"><input name="invalidate" type="checkbox"/>{text('Разрешаю сброс зависимых результатов; исправление группы отменит весь плей-офф.','Allow dependent results to reset; correcting a group cancels the playoffs.')}</label>:null}
 <button className={button} disabled={busy}>{text('Сохранить решение','Save decision')}</button></form></details>:null}</article>)}</div>
 </div>:null}</details>;
}
