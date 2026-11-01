'use client';
import {useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {LayoutDashboard,ChartNoAxesCombined,History,Users,Trophy,Wallet,Settings,ArrowUpRight,UserRound} from 'lucide-react';
import MatchHistory from '@/components/hub/MatchHistory';
import HubPanel from '@/components/hub/HubPanel';
import AuthPanel from './AuthPanel';
import SteamProfile from './SteamProfile';
import {useLanguageStore} from '@/store/useLanguageStore';
import type {PlayerProfile} from '@/lib/profile';
import styles from '@/components/shared/CompetitionSurface.module.css';
const sections=['overview','stats','history','team','tournaments','wallet'] as const;
const icons=[LayoutDashboard,ChartNoAxesCombined,History,Users,Trophy,Wallet];
export default function PlayerDashboard({profile,googleConnected,steamId}:{profile:PlayerProfile;googleConnected:boolean;steamId:string|null}){
 const ru=useLanguageStore(s=>s.language==='ru');
 const [active,setActive]=useState<typeof sections[number]>('overview');
 const t=(r:string,e:string)=>ru?r:e;
 const region=ru?{europe:'Европа',cis:'СНГ',other:'Другой регион'}[profile.region]:{europe:'Europe',cis:'CIS',other:'Other region'}[profile.region];
 const labels=ru?['Обзор','Статистика','История игр','Команда','Турниры','Кошелёк']:['Overview','Statistics','Match history','Team','Tournaments','Wallet'];
 return <section className={styles.surface}>
 <p className={styles.kicker}>DEAFHUB / PLAYER SPACE</p>
 <header className={styles.profileHero}>
  <div className={styles.identity}>
   <div role="img" aria-label={t('Аватар игрока','Player avatar')} className={styles.avatar}>{profile.nickname.trim()?<span aria-hidden="true">{Array.from(profile.nickname.trim())[0].toLocaleUpperCase(ru?'ru':'en')}</span>:<UserRound size={34} aria-hidden="true"/>}</div>
   <div><p className={styles.kicker}>{t('Личный кабинет','Player account')}</p><div className={styles.playerName}><h1 translate="no">{profile.nickname||t('Игрок','Player')}</h1><div className={styles.connections} role="group" aria-label={t('Игровые сервисы','Gaming services')}>
    {steamId?<SteamProfile key={steamId} steamId={steamId} ru={ru}/>:null}
    <span role="img" aria-label={t('FACEIT — подключение пока недоступно','FACEIT — linking is not available yet')} title={t('FACEIT — подключение пока недоступно','FACEIT — linking is not available yet')} className={styles.providerMark}><Image src="/auth/faceit.svg" width={34} height={34} alt=""/></span>
    {googleConnected?<span role="img" aria-label={t('Google — подключён','Google — connected')} title={t('Google — подключён','Google — connected')} className={styles.providerMark}><Image src="/auth/google.svg" width={30} height={30} alt=""/></span>:null}
   </div></div><p>{region}</p></div>
  </div>
  <Link href="/profile/settings" className={styles.settings}><Settings size={16} aria-hidden="true"/>{t('Настройки','Settings')}</Link>
 </header>
 <div className={styles.profileGrid}>
  <aside className={styles.sidebar}>
   <nav aria-label={t('Разделы кабинета','Account sections')}>{sections.map((section,i)=>{const Icon=icons[i];return <button key={section} type="button" onClick={()=>setActive(section)} aria-controls="player-content" aria-current={active===section?'page':undefined}><Icon size={18} aria-hidden="true"/>{labels[i]}</button>;})}</nav>
   <div className={styles.shortcuts}><p>{t('Турниры по играм','Browse competitions')}</p>{[['dota2','Dota 2'],['cs2','CS2'],['fc','EA Sports FC']].map(([id,name])=><Link key={id} href={'/tournaments?game='+id}><span translate="no">{name}</span><ArrowUpRight size={13} aria-hidden="true"/></Link>)}</div>
  </aside>
  <div className={styles.main} id="player-content" role="region" aria-label={labels[sections.indexOf(active)]}>
  {active==='overview'?<div className={styles.overviewGrid}>
   {!steamId?<AuthPanel steamOnly/>:null}<HubPanel section="stats" own/>
  </div>:null}
  {active==='stats'?<HubPanel section="stats" own/>:null}
  {active==='history'?<MatchHistory/>:null}
  {active==='team'?<HubPanel section="teams" own/>:null}
  {active==='tournaments'?<HubPanel section="tournaments" own/>:null}
  {active==='wallet'?<div className="rounded-3xl border border-white/10 p-8"><h2 className="text-2xl font-bold">{t('Кошелёк','Wallet')}</h2><p className="mt-4 text-white/50">{t('Платежи подключим последними. Баланс, взносы и вывод пока недоступны.','Payments will be connected last. Balance, fees and withdrawals are unavailable.')}</p></div>:null}
  </div>
 </div>
 </section>;
}
