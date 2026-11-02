'use client';
import {useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {openProviderWindow} from '@/lib/provider-window';
import {LayoutDashboard,ChartNoAxesCombined,History,Users,Trophy,Wallet,Pencil,ArrowUpRight,UserRound} from 'lucide-react';
import MatchHistory from '@/components/hub/MatchHistory';
import HubPanel from '@/components/hub/HubPanel';
import SteamProfile from './SteamProfile';
import {useLanguageStore} from '@/store/useLanguageStore';
import type {PlayerProfile} from '@/lib/profile';
import shared from '@/components/shared/CompetitionSurface.module.css';
import styles from './PlayerDashboard.module.css';
const sections=['overview','stats','history','team','tournaments','wallet'] as const;
const icons=[LayoutDashboard,ChartNoAxesCombined,History,Users,Trophy,Wallet];
export default function PlayerDashboard({profile,googleConnected,steamId}:{profile:PlayerProfile;googleConnected:boolean;steamId:string|null}){
 const ru=useLanguageStore(s=>s.language==='ru');
 const [active,setActive]=useState<typeof sections[number]>('overview');
 const t=(r:string,e:string)=>ru?r:e;
 const labels=ru?['Обзор','Статистика','История игр','Команда','Турниры','Кошелёк']:['Overview','Statistics','Match history','Team','Tournaments','Wallet'];
 return <section className={styles.profile} data-player-profile="">
 <div className={styles.backdrop} aria-hidden="true"/>
 <div className={styles.inner}>
 <header className={styles.profileBanner}>
  <div className={styles.identity}>
   <div role="img" aria-label={t('Аватар игрока','Player avatar')} className={styles.coverAvatar}>{profile.nickname.trim()?<span aria-hidden="true">{Array.from(profile.nickname.trim())[0].toLocaleUpperCase(ru?'ru':'en')}</span>:<UserRound size={38} aria-hidden="true"/>}</div>
   <div className={styles.identityDetails}>
    <div className={styles.nameRow}>
     <h1 translate="no">{profile.nickname||t('Игрок','Player')}</h1>
     <Link href="/profile/settings" className={styles.edit} aria-label={t('Редактировать профиль','Edit profile')} title={t('Редактировать профиль','Edit profile')}><Pencil size={19} aria-hidden="true"/></Link>
    </div>
    <p className={styles.subtitle}>{t('Профиль игрока','Player profile')}</p>
  <div className={styles.accountStrip} role="group" aria-label={t('Аккаунты и контакты','Accounts and contacts')}>
   {steamId?<div className={styles.stripProvider}><SteamProfile key={steamId} steamId={steamId} ru={ru}/></div>:<Link href="/profile/settings#steam-account" className={styles.stripProvider} aria-label={t('Steam — не привязан. Настроить подключение.','Steam — not connected. Set up connection.')} title={t('Привязать Steam','Link Steam')}><Image src="/auth/steam-mark.svg" width={32} height={32} alt=""/></Link>}
   {googleConnected?<div className={styles.stripProvider} role="img" aria-label={t('Google — подключён','Google — connected')}><Image src="/auth/google.svg" width={28} height={28} alt=""/></div>:null}
   <a href={profile.vk?'https://vk.com/'+profile.vk:'https://vk.com/'} target="_blank" rel="noopener noreferrer" onClick={openProviderWindow} className={styles.stripProvider} aria-label={profile.vk?t('VK — контакт, владение не подтверждено. Открыть в отдельном окне.','VK — contact, ownership not verified. Open in a separate window.'):t('VK — контакт не указан. Открыть сайт в отдельном окне.','VK — no contact provided. Open website in a separate window.')} title={profile.vk?t('VK — контакт','VK — contact'):t('VK — не подключён','VK — not connected')}><Image src="/auth/vk.svg" width={32} height={32} alt=""/></a>
   <a href="https://www.faceit.com/" target="_blank" rel="noopener noreferrer" onClick={openProviderWindow} className={styles.stripProvider} aria-label={t('FACEIT — подключение пока недоступно. Открыть сайт в отдельном окне.','FACEIT — linking is not available yet. Open website in a separate window.')} title={t('FACEIT — не подключён','FACEIT — not connected')}><Image src="/auth/faceit.svg" width={32} height={32} alt=""/></a>
  </div>
   </div>
  </div>
 </header>
 <div className={styles.profileGrid}>
  <div className={styles.sidebar}>
   <nav aria-label={t('Разделы кабинета','Account sections')}>{sections.map((section,i)=>{const Icon=icons[i];return <button key={section} type="button" onClick={()=>setActive(section)} aria-controls="player-content" aria-current={active===section?'page':undefined}><Icon size={20} aria-hidden="true"/>{labels[i]}</button>;})}</nav>
  </div>
  <div className={shared.main+' '+styles.content} id="player-content" role="region" aria-label={labels[sections.indexOf(active)]}>
  {active==='overview'?<div className={styles.overviewGrid}>
   <section className={styles.about}>
    <h2>{t('Об игроке','About player')}</h2>
    <dl className={styles.details}>
     <div><dt>{t('Игровой ник','Player nickname')}</dt><dd translate="no">{profile.nickname||'—'}</dd></div>
     <div><dt>{t('Регион','Region')}</dt><dd>{profile.region==='europe'?t('Европа','Europe'):profile.region==='cis'?t('СНГ','CIS'):t('Другой','Other')}</dd></div>
    </dl>
   </section>
   <section className={styles.team}>
    <h2>{t('Команда','Team')}</h2>
    <Link href="/team"><Users size={23} aria-hidden="true"/><span>{t('Состав и приглашения','Roster and invitations')}</span><ArrowUpRight size={17} aria-hidden="true"/></Link>
   </section>
  </div>:null}
  {active==='stats'?<HubPanel section="stats" own profileShowcase/>:null}
  {active==='history'?<MatchHistory/>:null}
  {active==='team'?<HubPanel section="teams" own/>:null}
  {active==='tournaments'?<HubPanel section="tournaments" own/>:null}
  {active==='wallet'?<div className="rounded-3xl border border-white/10 p-8"><h2 className="text-2xl font-bold">{t('Кошелёк','Wallet')}</h2><p className="mt-4 text-white/50">{t('Платежи подключим последними. Баланс, взносы и вывод пока недоступны.','Payments will be connected last. Balance, fees and withdrawals are unavailable.')}</p></div>:null}
  </div>
 </div>
 </div>
 </section>;
}
