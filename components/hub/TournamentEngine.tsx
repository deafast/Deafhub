'use client';
import TournamentBracket from './TournamentBracket';
import MatchSchedule from './MatchSchedule';
import {createClient} from '@/lib/supabase/client';
import {startTournamentUpdates,type UpdateStatus} from '@/lib/tournament/updates';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { readMatchResult } from '@/lib/tournament/result-form';
import { standings, type Command, type Config, type State } from '@/lib/tournament/engine';
type Props={demo?:boolean;id:string;game:string;owner:boolean;ru:boolean;approved:string[];name:(id:string)=>string;onSaved:()=>Promise<void>;initial:{revision:number;state:State}|null};
const field='mt-2 block w-full rounded-xl border border-white/15 bg-[#0A0F14] p-3 text-white';
const button='rounded-xl bg-[#22D3EE] px-4 py-3 font-bold text-[#0A0F14] disabled:opacity-40';
export default function TournamentEngine({demo=false,id,game,owner,ru,approved,name,onSaved,initial}:Props) {
 const [state,setState]=useState<State|null>(initial?.state||null),[revision,setRevision]=useState(initial?.revision||0),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const text=(r:string,e:string)=>ru?r:e;
 const [updates,setUpdates]=useState<UpdateStatus>('connecting'),[signedOut,setSignedOut]=useState(false);
 const canManage=owner&&!signedOut;
 const latestRevision=useRef(initial?.revision||0),request=useRef<AbortController|null>(null);
 const accept=useCallback((data:{state:State|null;revision:number})=>{if(data.revision<latestRevision.current)return;latestRevision.current=data.revision;setState(data.state);setRevision(data.revision);},[]);
 const load=useCallback(async()=>{
  request.current?.abort();const controller=new AbortController();request.current=controller;
  const response=await fetch(`/api/tournament-engine?id=${id}`,{cache:'no-store',signal:controller.signal});
  if(controller.signal.aborted)return;
  if(response.status===401){setSignedOut(true);setState(null);setRevision(0);latestRevision.current=0;throw new Error('Sign in required');}
  if(!response.ok)throw new Error('Tournament engine unavailable');
  const data=await response.json();if(!controller.signal.aborted){accept(data);setSignedOut(false);setError('');}
 },[id,accept]);
 useEffect(()=>{
  if(demo)return;const client=createClient();if(!client)return;
  const updates=startTournamentUpdates(client,id,()=>load().catch(e=>{if(e.name!=='AbortError')setError('Tournament engine unavailable');}),setUpdates);
  const visible=()=>{if(document.visibilityState==='visible')updates.refresh();};
  document.addEventListener('visibilitychange',visible);
  return()=>{updates.stop();request.current?.abort();document.removeEventListener('visibilitychange',visible);};
 },[id,demo,load]);
 async function save(command:Command|{type:'launch';config:Config;entries:string[]}) {
  setBusy(true);setError('');
  try {
   const response=await fetch('/api/tournament-engine',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tournament_id:id,revision,request_id:crypto.randomUUID(),command})});
   const data=await response.json();if(!response.ok)throw new Error(data.error);
   accept(data);await onSaved();
  }catch(e){setError(e instanceof Error?e.message:'Could not save');await load().catch(()=>{});}finally{setBusy(false);}
 }
 function launch(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();const values=new FormData(event.currentTarget),count=Number(values.get('groups'));
  const entries=[...approved].sort((a,b)=>name(a).localeCompare(name(b))||a.localeCompare(b));
  const groups=Array.from({length:count},(_,i)=>({id:String.fromCharCode(65+i),entries:entries.filter((_,n)=>n%count===i)}));
  void save({type:'launch',entries,config:{format:values.get('format') as Config['format'],grandFinal:values.get('grandFinal') as Config['grandFinal'],...(values.get('bronzeMatch')==='on'?{bronzeMatch:true}:{}),bestOf:game==='fc'?1:Number(values.get('bestOf')) as Config['bestOf'],groups,qualify:Number(values.get('qualify')),points:{win:Number(values.get('win')),draw:Number(values.get('draw')),loss:Number(values.get('loss'))}}});
 }
 function qualify(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();const values=new FormData(event.currentTarget),ties:Record<string,string[]>={};
  for(const g of state!.config.groups) {
   const order=g.entries.map((_,i)=>String(values.get(`${g.id}.${i}`)||''));
   if(order.some(Boolean))ties[g.id]=order;
  }
  void save({type:'qualify',ties});
 }
 return <details open={demo||undefined} className="border-t border-white/10 pt-4"><summary className="cursor-pointer text-[#22D3EE]">{text('Этапы и турнирная сетка','Stages and bracket')}</summary>
 {error?<p role="alert" className="mt-3 text-red-300">{ru?({
 'Schedule reason required':'Укажите причину назначения времени.',
 'Use a valid UTC schedule':'Укажите корректное время UTC.',
 'Only upcoming matches can be scheduled':'Время можно назначить только предстоящему матчу.',
 'Sign in required':'Войдите, чтобы продолжить.',
 'Tournament engine unavailable':'Не удалось обновить турнир. Повторите попытку.',
 'Bronze match requires Single Elimination with at least four playoff entries':'Матч за третье место доступен только в Single при минимум четырёх участниках плей-офф.',
 'Third-place rule does not match the format':'Настройки сетки не совпадают с опубликованным правилом третьего места.',
 'FC uses football goals in a single match; multi-match FC series are not supported':'FC использует голы одного матча. Серии из нескольких футбольных матчей пока не поддерживаются.',
 'Penalties require a tied FC playoff match':'Пенальти допустимы только при ничьей в плей-офф FC.',
 'Invalid penalty shootout':'Проверьте счёт пенальти: нужны неотрицательные целые числа и определённый победитель.',
 'Draw not allowed; record the deciding penalty shootout for FC':'При ничьей в плей-офф FC укажите решающий счёт пенальти.',
 'Draw not allowed':'Ничья в этом матче не допускается.',
 'Invalid score':'Проверьте счёт матча.',
 'Score does not match best-of':'Счёт не соответствует формату серии BO.',
 'Dependent results exist; explicitly invalidate them':'Есть зависимые сыгранные матчи. Для исправления требуется явное разрешение на их сброс.',
 'Both captains must confirm the current result or a referee must decide':'Оба капитана должны подтвердить актуальный результат либо требуется решение судьи.',
 'Complete personal check-in before launch':'Сначала каждый допущенный игрок должен подтвердить готовность к турниру.',
 'Revoke awards before correcting results':'Сначала отзовите действующие награды с указанием причины.',
 'Revision conflict; reload tournament':'Данные изменились. Обновите турнир перед сохранением.',
 }[error]||error):error}</p>:null}
 {!demo?<p role="status" className="mt-3 text-sm text-white/60">{updates==='live'?text('Автообновление подключено','Live updates connected'):updates==='fallback'?text('Связь прервана: проверяем обновления каждые 30 секунд','Connection interrupted: checking updates every 30 seconds'):text('Подключаем автообновление…','Connecting live updates…')}</p>:null}
 {!demo?<button disabled={busy} type="button" className="mt-3 text-sm text-[#22D3EE]" onClick={()=>void load().catch(e=>setError(e.message))}>{text('Обновить этапы','Refresh stages')}</button>:null}
 {!state?(canManage?<form onSubmit={launch} className="mt-4 grid gap-4 sm:grid-cols-2">
  <p className="text-sm text-white/60 sm:col-span-2">{text('Запуск закрывает регистрацию и фиксирует допущенные команды. Сначала рассмотрите все заявки. Группы распределяются по очереди из списка команд по названию. Очки и порядок тай-брейков должны соответствовать опубликованному регламенту: очки → победы → разница → забито; оставшееся равенство решает организатор.','Launching closes registration and locks approved entries. Review every entry first. Groups alternate through entries sorted by name. Publish matching rules: points → wins → difference → scored; the organizer resolves remaining ties.')}</p>
  <label>{text('Плей-офф','Playoffs')}<select name="format" className={field}><option value="single">Single Elimination</option><option value="double">Double Elimination</option></select></label>
  <label>{text('Гранд-финал Double','Double grand final')}<select name="grandFinal" className={field}><option value="reset">{text('Повторный финал при победе нижней сетки','Reset if lower bracket wins')}</option><option value="single">{text('Один финал','One final')}</option></select></label>
  <label>{text('Формат серии','Series format')}<select name="bestOf" className={field} disabled={game==='fc'}>{[1,3,5].map(n=><option key={n} value={n}>BO{n}</option>)}</select></label>
  <label className="flex items-start gap-3 text-sm sm:col-span-2"><input type="checkbox" name="bronzeMatch"/>{text('Отдельный матч за третье место: только Single, минимум 4 участника плей-офф. Должен совпадать с опубликованным правилом наград.','Separate bronze match: Single only, at least 4 playoff entries. Must match the published award rule.')}</label>
  {game==='fc'?<p className="text-sm leading-6 text-white/60">{text('Жеребьёвка групп выполняется сервером по заявленным уровням: цель — один сильный и два средних игрока в каждой группе. Если игроков какого-либо уровня не хватает или их больше, распределение будет максимально равномерным. Остальные места — случайно. После запуска состав групп сохраняется.','The server draws groups using declared levels: the target is one advanced and two intermediate players per group. Shortages or excess players are distributed as evenly as possible. Remaining places are random. The draw is saved at launch.')}</p>:null}
  <label>{text('Групповой этап','Group stage')}<select name="groups" className={field}><option value="0">{text('Без групп','No groups')}</option>{[2,4,8,16].filter(n=>n<=Math.floor(approved.length/2)).map(n=><option key={n} value={n}>{n} {text('группы','groups')}</option>)}</select></label>
  <label>{text('Выходят из каждой группы','Qualifiers per group')}<input name="qualify" type="number" min="1" max="32" defaultValue="2" className={field} required/></label>
  {[['win',text('Очки за победу','Win points'),3],['draw',text('Очки за ничью FC','FC draw points'),1],['loss',text('Очки за поражение','Loss points'),0]].map(([key,label,value])=><label key={key}>{label}<input name={String(key)} type="number" min="0" max="100" defaultValue={value} className={field} required/></label>)}
  <p className="text-sm text-white/60 sm:col-span-2">{game==='fc'?text('FC: счёт в голах; один матч, с дополнительным временем и пенальти по регламенту. ','FC: goals in a single match, with extra time and penalties as specified in the rules. '):''}{text('Посев:','Seeding:')} {approved.length? [...approved].sort((a,b)=>name(a).localeCompare(name(b))||a.localeCompare(b)).map(name).join(' → '):text('Нет допущенных команд','No approved entries')}. {text('Без отмеченной опции отдельный матч за третье место не создаётся.','No separate bronze match is created unless enabled.')}</p>
  <button disabled={busy||approved.length<2} className={button}>{text('Запустить этапы','Launch stages')}</button>
 </form>:<p className="mt-3 text-white/60">{text('Сетка ещё не опубликована.','Bracket not published yet.')}</p>):null}
 {state?<div className="mt-4 space-y-5">{state.game==='fc'&&!state.config.fcScore?<p className="text-sm text-white/60">{text('Архивный формат FC: счёт плей-офф хранится как победы в серии. Автоматического пересчёта в голы нет.','Legacy FC format: playoff scores are stored as series wins. They are not automatically converted to goals.')}</p>:null}<p className="text-sm text-[#22D3EE]">{state.config.format==='double'?'Double Elimination':'Single Elimination'} · {state.config.fcScore==='goals'?text('FC · голы','FC · goals'):`BO${state.config.bestOf}`} · {text('Версия','Revision')} {revision}{state.champion?` · ${text('Победитель','Champion')}: ${name(state.champion)}`:''}</p>
 {state.config.groups.map(g=><div key={g.id} className="overflow-x-auto"><h4 className="font-bold">{text('Группа','Group')} {g.id}</h4><table className="mt-3 w-full text-left text-sm"><thead><tr>{[game==='fc'?text('Игрок','Player'):text('Команда','Team'),text('Матчи','Played'),text('Победы','Wins'),text('Ничьи','Draws'),text('Очки','Points'),'+/−',text('Выход','Qualification')].map(h=><th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{standings(state,g.id).map(r=><tr key={r.entry}><td className="p-2">{name(r.entry)}</td><td className="p-2">{r.played}</td><td className="p-2">{r.wins}</td><td className="p-2">{r.draws}</td><td className="p-2">{r.points}</td><td className="p-2">{r.scored-r.conceded}</td><td className="p-2">{state.phase==='groups'?text('Ещё не определён','Not decided'):state.seeds.includes(r.entry)?text('Прошли в плей-офф','Qualified'):text('Выбыли','Eliminated')}</td></tr>)}</tbody></table></div>)}
 {canManage&&state.phase==='groups'?<form onSubmit={qualify} className="space-y-4"><p className="text-sm text-white/60">{text('При равенстве укажите итоговый порядок всей группы по решению судьи. Неравные позиции не меняются.','For ties, select the complete group order approved by the referee. Unequal ranks stay unchanged.')}</p>{state.config.groups.map(g=><fieldset key={g.id}><legend>{text('Группа','Group')} {g.id}</legend>{g.entries.map((_,i)=><label key={i} className="mt-2 block">{i+1}<select name={`${g.id}.${i}`} className={field} defaultValue=""><option value="">{text('Без решения тай-брейка','No tie decision')}</option>{g.entries.map(e=><option key={e} value={e}>{name(e)}</option>)}</select></label>)}</fieldset>)}<button disabled={busy||state.matches.some(m=>m.status!=='finished')} className={button}>{text('Опубликовать квалификацию и плей-офф','Publish qualification and playoffs')}</button></form>:null}
 <TournamentBracket state={state} ru={ru} name={name}/>
 <details><summary className="cursor-pointer text-[#22D3EE]">{text('Все матчи и результаты','All matches and results')}</summary><div className="mt-4 grid gap-4 sm:grid-cols-2">{state.matches.map(m=><article key={m.id} className="rounded-2xl border border-white/10 p-4"><p className="text-xs text-[#22D3EE]">{m.stage==='bronze'?text('Матч за третье место','Bronze match'):m.stage} · {m.id} · {({waiting:text('Ожидает участников','Waiting'),ready:text('Готов','Ready'),finished:text('Завершён','Finished'),bye:'BYE',skipped:text('Повторный финал не нужен','Reset not needed')})[m.status]}</p><p className="mt-3 font-bold">{m.a?name(m.a):'—'} — {m.b?name(m.b):'—'}</p>{m.result?<p className="mt-2 text-sm">{m.result.kind==='played'?`${m.result.a} : ${m.result.b}${m.result.penalties?` (${text('пен.','pens')} ${m.result.penalties.a}:${m.result.penalties.b})`:''}`:`Forfeit · ${name(m.result.loser)}`}</p>:null}
 <MatchSchedule match={m} owner={canManage&&!demo} busy={busy} ru={ru} onSave={save}/>
 {canManage&&['ready','finished'].includes(m.status)?<details className="mt-3"><summary className="cursor-pointer text-sm text-[#22D3EE]">{m.result?text('Исправить результат','Correct result'):text('Внести результат','Record result')}</summary><form className="mt-3 space-y-3" onSubmit={event=>{event.preventDefault();const v=new FormData(event.currentTarget);try{const result=readMatchResult(v);void save({type:'result',match:m.id,result,invalidate:v.get('invalidate')==='on',reason:String(v.get('reason'))});}catch{setError(text('Укажите оба результата серии пенальти.','Enter both penalty shootout scores.'));}}}>
 <div className="flex gap-3"><label>A<input className={field} name="a" aria-label={text('Счёт A','Score A')} type="number" min="0" max="1000" defaultValue={m.result?.kind==='played'?m.result.a:0}/></label><label>B<input className={field} name="b" aria-label={text('Счёт B','Score B')} type="number" min="0" max="1000" defaultValue={m.result?.kind==='played'?m.result.b:0}/></label></div>
 {state.config.fcScore==='goals'&&!m.stage.startsWith('group:')?<fieldset className="space-y-2"><legend className="text-sm">{text('Пенальти — только при ничьей. Основной счёт включает дополнительное время по регламенту.','Penalties only for a tied match. The match score includes extra time as specified in the rules.')}</legend><div className="flex gap-3"><label>A<input name="penalties_a" aria-label={text('Пенальти A','Penalties A')} className={field} type="number" min="0" max="1000" defaultValue={m.result?.kind==='played'?m.result.penalties?.a:undefined}/></label><label>B<input name="penalties_b" aria-label={text('Пенальти B','Penalties B')} className={field} type="number" min="0" max="1000" defaultValue={m.result?.kind==='played'?m.result.penalties?.b:undefined}/></label></div></fieldset>:null}
 <label className="block">{text('Техническое поражение','Forfeit')}<select name="forfeit" className={field}><option value="">{text('Нет — использовать счёт','None — use score')}</option>{[m.a,m.b].filter(Boolean).map(e=><option key={e!} value={e!}>{name(e!)}</option>)}</select></label>
 <label className="block">{text('Основание / решение судьи','Evidence / referee decision')}<input name="reason" className={field} minLength={3} maxLength={500} required/></label>
 {m.result?<label className="flex gap-2 text-sm"><input name="invalidate" type="checkbox"/>{text('Разрешаю сброс зависимых результатов; исправление группы отменит весь плей-офф.','Allow dependent results to reset; correcting a group cancels the playoffs.')}</label>:null}
 <button className={button} disabled={busy}>{text('Сохранить решение','Save decision')}</button></form></details>:null}</article>)}</div></details>
 </div>:null}</details>;
}
