'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { UserRoundPlus, Users } from 'lucide-react';

type Game='dota2'|'cs2';
type Listing={id:string;game:Game;nickname:string;position:string;note:string;updatedAt:string;mine:boolean};
type Board={listings:Listing[];mine:{id:string;game:Game;position:string;note:string}[];incoming:{id:string;teamId:string;teamName:string;game:Game;createdAt:string}[];outgoing:{id:string;listingId:string;teamId:string;game:Game}[];teams:{id:string;game:Game;name:string;canInvite:boolean}[];nextCursor:string|null};
type Action='publish'|'withdraw'|'invite'|'accept'|'decline';
type Props={game:string;ru:boolean;headingLevel:2|3;onJoined:()=>Promise<void>;onExpired:()=>void};
const field='mt-2 block min-h-11 w-full rounded-xl border border-white/20 bg-[#0A0F14] p-3 text-sm text-[#EAFBFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22D3EE]';
const button='inline-flex min-h-11 items-center justify-center rounded-xl bg-[#22D3EE] px-4 py-2 text-sm font-bold text-[#0A0F14] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22D3EE]';
const errors:Record<string,[string,string]>={
 'Sign in required':['Войдите снова, чтобы пользоваться поиском игроков.','Sign in again to use player search.'],
 'Save your player nickname first':['Сначала сохраните игровой ник в профиле.','Save your player nickname in your profile first.'],
 'Already on a team':['Вы уже состоите в команде этой игры.','You already belong to a team in this game.'],
 'Listing unavailable':['Объявление больше недоступно.','This listing is no longer available.'],
 'Captain and matching game required':['Приглашать может капитан команды этой игры.','Only a captain of a team in this game can invite.'],
 'Roster locked during tournament participation':['Состав заблокирован на время турнира.','The roster is locked during tournament participation.'],
 'Roster full':['В команде больше нет мест.','The team has no open places.'],
 'Invitation already pending':['Приглашение уже ожидает ответа.','An invitation is already pending.'],
 'Invitation limit reached':['Достигнут лимит приглашений. Попробуйте позже.','Invitation limit reached. Please try later.'],
 'Invitation unavailable':['Приглашение больше недоступно.','This invitation is no longer available.'],
 'Check all fields':['Проверьте поля объявления.','Check the listing fields.'],
 'Refresh failed':['Данные пока не обновились. Нажмите «Повторить».','The list could not refresh. Select Retry.'],
};
const notices:Record<Action,[string,string]>={publish:['Объявление опубликовано.','Listing published.'],withdraw:['Объявление снято.','Listing withdrawn.'],invite:['Приглашение отправлено игроку.','Invitation sent to the player.'],accept:['Приглашение принято. Вы вступили в команду.','Invitation accepted. You joined the team.'],decline:['Приглашение отклонено.','Invitation declined.']};

export default function PlayerLfp({game,ru,headingLevel,onJoined,onExpired}:Props){
 const Heading=headingLevel===2?'h2':'h3',Subheading=headingLevel===2?'h3':'h4';
 const [board,setBoard]=useState<Board|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState<Action|null>(null);
 const [listingGame,setListingGame]=useState<Game>(game==='cs2'?'cs2':'dota2'),[position,setPosition]=useState(''),[note,setNote]=useState('');
 const active=useRef(false),generation=useRef(0),session=useRef(0),reading=useRef<AbortController|null>(null),posting=useRef<AbortController|null>(null),saving=useRef(false);
 const onJoinedRef=useRef(onJoined);useEffect(()=>{onJoinedRef.current=onJoined;},[onJoined]);
 const onExpiredRef=useRef(onExpired);useEffect(()=>{onExpiredRef.current=onExpired;},[onExpired]);
 const gameParam=game==='dota2'||game==='cs2'?game:'';
 const load=useCallback(async(cursor:string|null=null)=>{
  reading.current?.abort();const controller=new AbortController();reading.current=controller;const currentGeneration=++generation.current;
  const current=()=>active.current&&!controller.signal.aborted&&generation.current===currentGeneration;
  setLoading(true);setError('');
  try{
   const params=new URLSearchParams();if(gameParam)params.set('game',gameParam);if(cursor)params.set('cursor',cursor);
   const response=await fetch('/api/lfp'+(params.size?'?'+params.toString():''),{cache:'no-store',signal:controller.signal});
   if(!current())return false;
   if(response.status===401){session.current++;setBoard(null);setNotice(null);setError('Sign in required');onExpiredRef.current();return false;}
   if(!response.ok)throw Error('Unavailable');const value:Board=await response.json();if(!current())return false;
   setBoard(previous=>cursor&&previous?{...value,listings:[...previous.listings,...value.listings.filter(item=>!previous.listings.some(old=>old.id===item.id))]}:value);
   return true;
  }catch{if(current())setError('Unavailable');return false;}finally{if(current())setLoading(false);}
 },[gameParam]);
 const loadRef=useRef(load);useEffect(()=>{loadRef.current=load;},[load]);
 const cancelRead=useCallback(()=>{generation.current++;reading.current?.abort();},[]);
 useEffect(()=>{active.current=true;return()=>{active.current=false;cancelRead();posting.current?.abort();};},[cancelRead]);
 useEffect(()=>{let current=true;void Promise.resolve().then(()=>{if(current){setBoard(null);setNotice(null);void load();}});return()=>{current=false;cancelRead();};},[load,cancelRead]);
 async function mutate(action:Action,payload:Record<string,string>){
  if(!active.current||saving.current)return;
  saving.current=true;setBusy(true);setError('');setNotice(null);const currentSession=session.current;const controller=new AbortController();posting.current=controller;
  const current=()=>active.current&&!controller.signal.aborted&&session.current===currentSession;
  try{
   const response=await fetch('/api/lfp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...payload}),signal:controller.signal});
   if(!current())return;
   if(response.status===401){session.current++;generation.current++;reading.current?.abort();setLoading(false);setBoard(null);setError('Sign in required');onExpiredRef.current();return;}
   const result=await response.json();if(!current())return;if(!response.ok)throw Error(typeof result.error==='string'?result.error:'Unavailable');
   const beforeRefresh=generation.current;const refreshed=await loadRef.current();if(!current())return;setNotice(action);
   if(!refreshed&&generation.current===beforeRefresh+1)setError('Refresh failed');
   if(action==='accept')void onJoinedRef.current().catch(()=>{});
  }catch(e){if(current())setError(e instanceof Error?e.message:'Unavailable');}finally{saving.current=false;if(active.current)setBusy(false);}
 }
 function publish(event:FormEvent<HTMLFormElement>){event.preventDefault();void mutate('publish',{game:listingGame,position,note});}
 const text=(r:string,e:string)=>ru?r:e;
 const errorText=errors[error]?.[ru?0:1]||text('Не удалось загрузить или сохранить объявления. Попробуйте ещё раз.','Could not load or save listings. Please try again.');
 const visible=game==='fc'?[]:board?.listings||[];
 return <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
  <div className="flex items-center gap-3"><Users size={20} aria-hidden="true" className="text-[#22D3EE]"/><Heading className="text-lg font-black uppercase italic">{text('Свободные игроки','Free agents')}</Heading></div>
  <p className="mt-3 text-sm leading-6 text-slate-400">{text('Только игроки, которые сами опубликовали объявление.','Only players who chose to publish a listing.')}</p>
  {error?<div role="alert" className="mt-4 text-sm text-red-300">{errorText}{error==='Sign in required'?<Link href="/sign-in" className="ml-2 text-[#22D3EE] underline">{text('Войти','Sign in')}</Link>:error==='Save your player nickname first'?<Link href="/profile/settings" className="ml-2 text-[#22D3EE] underline">{text('Открыть профиль','Open profile')}</Link>:null}</div>:null}
  {notice?<p role="status" className="mt-4 text-sm text-[#22D3EE]">{notices[notice][ru?0:1]}</p>:null}
  {loading?<p role="status" className="mt-4 text-sm text-slate-400">{text('Загрузка…','Loading…')}</p>:null}
  {!loading&&error?<button type="button" className="mt-3 min-h-11 text-sm text-[#22D3EE] underline" onClick={()=>void load()}>{text('Повторить','Retry')}</button>:null}
  {board?.incoming.length?<div className="mt-5 space-y-3"><Subheading className="font-bold">{text('Приглашения вам','Your invitations')}</Subheading>{board.incoming.map(invite=><article key={invite.id} className="rounded-xl border border-[#22D3EE]/25 p-3"><p className="break-words font-bold">{invite.teamName}</p><p className="mt-1 text-xs uppercase text-slate-400">{invite.game==='dota2'?'Dota 2':'CS2'}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busy} className={button} onClick={()=>void mutate('accept',{invitation_id:invite.id})}>{text('Принять','Accept')}</button><button type="button" disabled={busy} className="min-h-11 px-3 text-sm text-slate-300 underline disabled:opacity-40" onClick={()=>void mutate('decline',{invitation_id:invite.id})}>{text('Отклонить','Decline')}</button></div></article>)}</div>:null}
  {board&&!loading&&game==='fc'?<p className="mt-5 text-sm text-slate-400">{text('Для FC доступны индивидуальные турниры.','FC tournaments are individual.')}</p>:null}
  {board&&!loading&&game!=='fc'&&!visible.length?<p role="status" className="mt-5 text-sm text-slate-400">{text('Объявлений пока нет.','No listings yet.')}</p>:null}
  {visible.length?<div className="mt-5 space-y-3">{visible.map(player=>{
   const team=board?.teams.find(item=>item.game===player.game&&item.canInvite)||board?.teams.find(item=>item.game===player.game);
   const pending=team&&board?.outgoing.some(item=>item.listingId===player.id&&item.teamId===team.id);
   return <article key={player.id} className="rounded-xl border border-white/10 p-3"><div className="flex items-start gap-3"><span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 font-bold">{Array.from(player.nickname.trim())[0]?.toLocaleUpperCase()}</span><div className="min-w-0 flex-1"><p className="break-words font-bold">{player.nickname}</p><p className="mt-1 break-words text-xs text-[#22D3EE]">{player.game==='dota2'?'Dota 2':'CS2'} · {player.position}</p>{player.note?<p className="mt-2 break-words text-sm text-slate-400">{player.note}</p>:null}</div>{player.mine?<span className="text-xs text-slate-400">{text('Вы','You')}</span>:team?<button type="button" disabled={busy||Boolean(pending)||!team.canInvite} aria-label={pending?text('Приглашение ожидает ответа','Invitation pending'):text(`Пригласить ${player.nickname}`,`Invite ${player.nickname}`)} title={pending?text('Ожидает ответа','Pending'):!team.canInvite?text('Состав закрыт или заполнен','Roster is locked or full'):text(`Пригласить в ${team.name}`,`Invite to ${team.name}`)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 text-[#22D3EE] disabled:opacity-40" onClick={()=>void mutate('invite',{listing_id:player.id,team_id:team.id})}><UserRoundPlus size={18} aria-hidden="true"/></button>:null}</div></article>;
  })}</div>:null}
  {board?.nextCursor&&game!=='fc'?<button type="button" disabled={loading} className="mt-4 min-h-11 text-sm text-[#22D3EE] underline disabled:opacity-40" onClick={()=>void load(board.nextCursor)}>{text('Показать ещё','Show more')}</button>:null}
  {board?.mine.length?<div className="mt-5 space-y-2"><Subheading className="font-bold">{text('Мои объявления','My listings')}</Subheading>{board.mine.map(item=><div key={item.id} className="flex flex-wrap items-center justify-between gap-2 text-sm"><span>{item.game==='dota2'?'Dota 2':'CS2'} · {item.position}</span><button type="button" disabled={busy} className="min-h-11 text-slate-300 underline disabled:opacity-40" onClick={()=>void mutate('withdraw',{listing_id:item.id})}>{text('Снять','Withdraw')}</button></div>)}</div>:null}
  {board?<details className="mt-5 rounded-xl border border-dashed border-white/25 p-3"><summary className="min-h-11 cursor-pointer py-3 text-center text-sm font-bold text-[#22D3EE]">{text('Опубликовать LFP','Publish LFP')}</summary><form onSubmit={publish} className="mt-3 space-y-3 border-t border-white/10 pt-4"><label className="block text-sm">{text('Игра','Game')}<select className={field} value={listingGame} onChange={e=>setListingGame(e.target.value as Game)}><option value="dota2">Dota 2</option><option value="cs2">CS2</option></select></label><label className="block text-sm">{text('Позиция или роль','Position or role')}<input className={field} value={position} onChange={e=>setPosition(e.target.value)} required maxLength={40}/></label><label className="block text-sm">{text('Коротко о себе','Short note')}<textarea className={field} value={note} onChange={e=>setNote(e.target.value)} maxLength={180}/></label><p className="text-xs leading-5 text-slate-400">{text('Ваш ник, роль и текст будут видны другим вошедшим игрокам. Контакты из профиля не публикуются.','Your nickname, role and note will be visible to other signed-in players. Profile contacts are not published.')}</p><button className={button} disabled={busy}>{text('Опубликовать','Publish')}</button></form></details>:null}
 </section>;
}
