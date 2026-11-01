'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {Trophy,ArrowUpRight} from 'lucide-react';
import type {Award} from './TournamentOperations';
import type {HubData} from '@/lib/hub-types';
import styles from '@/components/shared/CompetitionSurface.module.css';
const games=[{id:'dota2',name:'Dota 2',logo:'/branding/game-logos/dota2.png'},{id:'cs2',name:'CS2',logo:'/branding/game-logos/cs2.svg'},{id:'fc',name:'EA Sports FC',logo:'/branding/game-logos/ea-sports-fc.svg'}];
export default function ProfileHonors({data,ru}:{data:HubData;ru:boolean}){
 const [awards,setAwards]=useState<Award[]|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(true);
 const request=useRef<AbortController|null>(null);
 const load=useCallback(()=>{
  request.current?.abort();const controller=new AbortController();request.current=controller;
  return fetch('/api/tournament-operations?profile=me',{cache:'no-store',signal:controller.signal})
   .then(async response=>{if(controller.signal.aborted)return;if(response.status===401){setAwards(null);setError('auth');return;}if(!response.ok)throw Error('unavailable');const result=await response.json();if(controller.signal.aborted)return;if(!Array.isArray(result.awards))throw Error('unavailable');setAwards(result.awards);})
   .catch(()=>{if(!controller.signal.aborted)setError('unavailable');})
   .finally(()=>{if(!controller.signal.aborted)setBusy(false);});
 },[]);
 useEffect(()=>{void load();return()=>request.current?.abort();},[load]);
 const t=(r:string,e:string)=>ru?r:e;
 const sorted=[...(awards||[])].sort((a,b)=>b.created_at.localeCompare(a.created_at));
 const ownTeams=data.teams.filter(team=>data.members.some(member=>member.team_id===team.id&&member.user_id===data.userId));
 const hosted=data.tournaments.filter(event=>event.organizer_id===data.userId&&event.status==='finished').sort((a,b)=>b.starts_at.localeCompare(a.starts_at));
 const date=(value:string)=>new Date(value).toLocaleDateString(ru?'ru-RU':'en-GB',{timeZone:'UTC'});
 return <div className={styles.honorSections}>
 <section aria-label={t('Титулы и достижения','Titles and achievements')} className={styles.honors}>
  <header><h2>{t('Титулы и достижения','Titles and achievements')}</h2><button type="button" onClick={()=>{setBusy(true);setError('');void load();}} disabled={busy}>{t('Обновить','Refresh')}</button></header>
  {error?<p role="alert">{error==='auth'?t('Войдите снова, чтобы посмотреть награды.','Sign in again to view awards.'):t('Не удалось загрузить награды. Попробуйте ещё раз.','Could not load awards. Please try again.')}</p>:null}
  {busy&&awards===null?<p role="status">{t('Загрузка наград…','Loading awards…')}</p>:null}
  {!busy&&!error&&awards?.length===0?<p className={styles.honorsEmpty} role="status">{t('Подтверждённых титулов пока нет. Здесь появятся награды за результаты турниров.','No confirmed titles yet. Tournament awards will appear here.')}</p>:null}
  {sorted.length?<div className={styles.honorGallery}>{sorted.map(award=>{const game=games.find(item=>item.id===award.game),revoked=award.hub_award_batches?.status==='revoked';return <article key={award.id} className={styles.honorBadge} data-revoked={revoked||undefined}><div>
   <Trophy size={22} aria-hidden="true"/><span className={styles.honorPlace}>{award.place} {t('место','place')}</span>
   {/* eslint-disable-next-line @next/next/no-img-element */}
   {game?<img src={game.logo} alt={game.name} width={76} height={28} className={game.id==='fc'?styles.fcLogo:undefined}/>:<span>{award.game}</span>}
   <h3>{award.tournament_title}</h3><p>{award.team_name}</p><time dateTime={award.created_at}>{t('Выдана','Awarded')} {date(award.created_at)}</time>
   {revoked?<strong className={styles.revoked}>{t('Отозвана','Revoked')}</strong>:null}
  </div></article>;})}</div>:null}
 </section>
 <div className={styles.playerRecords}>
  <section><h2>{t('Игры и команды','Games and teams')}</h2><div className={styles.gameChoices}>{games.map(game=><Link key={game.id} href={'/tournaments?game='+game.id}><span translate="no">{game.name}</span><ArrowUpRight size={12} aria-hidden="true"/></Link>)}</div>{ownTeams.length?<ul>{ownTeams.map(team=><li key={team.id}><Link href="/team">{team.name}</Link><span>{games.find(game=>game.id===team.game)?.name||team.game}</span></li>)}</ul>:<p>{t('Вы пока не состоите в команде.','You are not in a team yet.')}</p>}<Link className={styles.recordLink} href="/team">{t('Центр команд','Team center')} <ArrowUpRight size={13} aria-hidden="true"/></Link></section>
  <section><h2>{t('Проведённые турниры','Hosted tournaments')}</h2>{hosted.length?<ul>{hosted.map(event=><li key={event.id}><Link href={'/tournaments?tournament='+encodeURIComponent(event.id)+'#tournament-'+encodeURIComponent(event.id)}>{event.title}</Link><span>{t('Начало','Started')} {date(event.starts_at)}</span></li>)}</ul>:<p>{t('Завершённых турниров, где вы указаны организатором, пока нет.','No completed tournaments list you as their organizer yet.')}</p>}</section>
 </div>
 </div>;
}
