'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {useLanguageStore} from '@/store/useLanguageStore';
import {historyDate,historyScore,historyTournamentUrl,type HistoryPage} from '@/lib/match-history';
async function fetchPage(cursor:string|null,signal:AbortSignal):Promise<HistoryPage>{
 const response=await fetch('/api/match-history'+(cursor?'?cursor='+encodeURIComponent(cursor):''),{cache:'no-store',signal});
 if(!response.ok)throw Error(response.status===401?'auth':'unavailable');
 return response.json();
}
export default function MatchHistory(){
 const ru=useLanguageStore(s=>s.language==='ru'),text=(r:string,e:string)=>ru?r:e;
 const [page,setPage]=useState<HistoryPage>({items:[],nextCursor:null}),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const controller=useRef<AbortController|null>(null);
 useEffect(()=>{const request=new AbortController();controller.current=request;
  void fetchPage(null,request.signal).then(value=>{if(!request.signal.aborted){setPage(value);setError('');setLoading(false);}}).catch(e=>{if(!request.signal.aborted){setError(e.message);setLoading(false);}});
  return()=>controller.current?.abort();
 },[]);
 async function load(cursor:string|null){
  controller.current?.abort();const request=new AbortController();controller.current=request;setLoading(true);setError('');
  try{const value=await fetchPage(cursor,request.signal);if(!request.signal.aborted)setPage(current=>{const seen=new Set(current.items.map(m=>m.match_id));return {items:cursor?[...current.items,...value.items.filter(m=>!seen.has(m.match_id))]:value.items,nextCursor:value.nextCursor};});}
  catch(e){if(!request.signal.aborted)setError(e instanceof Error?e.message:'unavailable');}
  finally{if(!request.signal.aborted)setLoading(false);}
 }
 return <section className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{text('История матчей DEAF|HUB','DEAF|HUB match history')}</h2><button type="button" disabled={loading} onClick={()=>void load(null)} className="min-h-11 rounded-xl border border-white/15 px-4 py-3 text-sm disabled:opacity-40">{text('Обновить','Refresh')}</button></div>
 <p className="text-sm leading-6 text-white/60">{text('Только подтверждённые матчи с вашим составом на момент регистрации. Время подтверждения результата не является точным временем окончания игры. Для старых матчей неизвестная дата не выдумывается.','Only confirmed matches with your registered roster. Result confirmation time is not the exact game end time. Unknown dates for older matches are not invented.')}</p>
 {error?<div role="alert" className="space-y-3 rounded-2xl border border-white/10 p-5"><p>{error==='auth'?text('Войдите, чтобы посмотреть свою историю.','Sign in to view your history.'):text('Не удалось загрузить историю. Попробуйте ещё раз.','Could not load history. Please try again.')}</p>{error==='auth'?<Link href="/sign-in" className="inline-flex min-h-11 items-center text-[#22D3EE]">{text('Войти','Sign in')}</Link>:<button type="button" disabled={loading} onClick={()=>void load(null)} className="min-h-11 text-[#22D3EE]">{text('Повторить','Retry')}</button>}</div>:null}
 {page.items.map(match=><article key={match.match_id} className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5"><p className="text-sm text-[#22D3EE]"><Link href={historyTournamentUrl(match.tournament_id)} className="underline underline-offset-4">{match.tournament_title}</Link> · {match.game==='dota2'?'Dota 2':match.game==='fc'?'EA Sports FC':'CS2'}</p><h3 className="break-words text-xl font-bold">{match.player_a} — {match.player_b}</h3><p className="text-lg font-semibold">{historyScore(match,ru)}</p><p className="text-sm leading-6 text-white/60">{historyDate(match,ru)}</p><p className="text-sm text-white/60">{text('Результат подтверждён','Result confirmed')}</p></article>)}
 {loading?<p role="status" className="text-sm text-white/60">{text('Загрузка истории…','Loading history…')}</p>:!error&&!page.items.length?<p role="status" className="rounded-2xl border border-white/10 p-5 text-white/60">{text('Подтверждённых матчей пока нет.','No confirmed matches yet.')}</p>:null}
 {page.nextCursor?<button type="button" disabled={loading} onClick={()=>void load(page.nextCursor)} className="min-h-11 rounded-xl bg-[#22D3EE] px-4 py-3 font-bold text-[#0A0F14] disabled:opacity-40">{text('Загрузить ещё','Load more')}</button>:null}
 </section>;
}
