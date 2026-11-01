'use client';
import {useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {openProviderWindow} from '@/lib/provider-window';
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
 const labels=ru?['Обзор','Статистика','История игр','Команда','Турниры','Кошелёк']:['Overview','Statistics','Match history','Team','Tournaments','Wallet'];
 return <section className={styles.surface+' '+styles.bannerLayout}>
 <header className={styles.profileBanner}>
  <div className={styles.profileCover}>
   <div role="img" aria-label={t('Аватар игрока','Player avatar')} className={styles.coverAvatar}>{profile.nickname.trim()?<span aria-hidden="true">{Array.from(profile.nickname.trim())[0].toLocaleUpperCase(ru?'ru':'en')}</span>:<UserRound size={38} aria-hidden="true"/>}</div>
   <h1 translate="no">{profile.nickname||t('Игрок','Player')}</h1>
   <Link href="/profile/settings" className={styles.coverSettings}><Settings size={15} aria-hidden="true"/>{t('Настройки','Settings')}</Link>
  </div>
  <div className={styles.accountStrip} role="group" aria-label={t('Аккаунты и контакты','Accounts and contacts')}>
   {steamId?<div className={styles.stripProvider}><SteamProfile key={steamId} steamId={steamId} ru={ru}/></div>:<a href="https://store.steampowered.com/" target="_blank" rel="noopener noreferrer" onClick={openProviderWindow} className={styles.stripProvider} aria-label={t('Steam — не привязан. Открыть сайт в отдельном окне.','Steam — not connected. Open website in a separate window.')} title={t('Steam — не привязан','Steam — not connected')}><Image src="/auth/steam-mark.svg" width={32} height={32} alt=""/></a>}
   {googleConnected?<div className={styles.stripProvider} role="img" aria-label={t('Google — подключён','Google — connected')}><Image src="/auth/google.svg" width={28} height={28} alt=""/></div>:null}
   <a href={profile.vk?'https://vk.com/'+profile.vk:'https://vk.com/'} target="_blank" rel="noopener noreferrer" onClick={openProviderWindow} className={styles.stripProvider} aria-label={profile.vk?t('VK — контакт, владение не подтверждено. Открыть в отдельном окне.','VK — contact, ownership not verified. Open in a separate window.'):t('VK — контакт не указан. Открыть сайт в отдельном окне.','VK — no contact provided. Open website in a separate window.')} title={profile.vk?t('VK — контакт','VK — contact'):t('VK — не подключён','VK — not connected')}><Image src="/auth/vk.svg" width={32} height={32} alt=""/></a>
   <a href="https://www.faceit.com/" target="_blank" rel="noopener noreferrer" onClick={openProviderWindow} className={styles.stripProvider} aria-label={t('FACEIT — подключение пока недоступно. Открыть сайт в отдельном окне.','FACEIT — linking is not available yet. Open website in a separate window.')} title={t('FACEIT — не подключён','FACEIT — not connected')}><Image src="/auth/faceit.svg" width={32} height={32} alt=""/></a>
  </div>
 </header>
 <div className={styles.profileGrid}>
  <aside className={styles.sidebar}>
   <nav aria-label={t('Разделы кабинета','Account sections')}>{sections.map((section,i)=>{const Icon=icons[i];return <button key={section} type="button" onClick={()=>setActive(section)} aria-controls="player-content" aria-current={active===section?'page':undefined}><Icon size={18} aria-hidden="true"/>{labels[i]}</button>;})}</nav>
   <div className={styles.shortcuts}><p>{t('Турниры по играм','Browse competitions')}</p>{[['dota2','Dota 2'],['cs2','CS2'],['fc','EA Sports FC']].map(([id,name])=><Link key={id} href={'/tournaments?game='+id}><span translate="no">{name}</span><ArrowUpRight size={13} aria-hidden="true"/></Link>)}</div>
  </aside>
  <div className={styles.main} id="player-content" role="region" aria-label={labels[sections.indexOf(active)]}>
  {active==='overview'?<div className={styles.overviewGrid}>
   {!steamId?<AuthPanel steamOnly/>:null}<HubPanel section="stats" own profileShowcase/>
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
