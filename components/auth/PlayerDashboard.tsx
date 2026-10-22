'use client';
import {useState} from 'react';
import Link from 'next/link';
import MatchHistory from '@/components/hub/MatchHistory';
import HubPanel from '@/components/hub/HubPanel';
import AuthPanel from './AuthPanel';
import AvatarView from '@/components/r3f/AvatarView';
import SteamProfile from './SteamProfile';
import {useLanguageStore} from '@/store/useLanguageStore';
import type {PlayerProfile} from '@/lib/profile';
const sections=['overview','stats','history','team','tournaments','wallet'] as const;
export default function PlayerDashboard({profile,googleConnected,steamId}:{profile:PlayerProfile;googleConnected:boolean;steamId:string|null}){
 const ru=useLanguageStore(s=>s.language==='ru'); const [active,setActive]=useState<typeof sections[number]>('overview');
 const region=ru?{europe:'Европа',cis:'СНГ',other:'Другой регион'}[profile.region]:{europe:'Europe',cis:'CIS',other:'Other region'}[profile.region];
 const labels=ru?['Обзор','Статистика','История игр','Команда','Турниры','Кошелёк']:['Overview','Statistics','Match history','Team','Tournaments','Wallet'];
 return <section className="mx-auto max-w-6xl px-5 py-12"><header className="flex flex-wrap items-center justify-between gap-5"><div className="flex w-full min-w-0 items-center gap-4 sm:w-auto sm:flex-1 sm:gap-6"><div role="img" aria-label={ru?'Аватар игрока':'Player avatar'} className="h-20 w-20 shrink-0 overflow-hidden rounded-full sm:h-28 sm:w-28"><AvatarView className="h-full w-full !rounded-full pointer-events-none"/></div><div className="min-w-0"><p className="text-xs tracking-widest text-[#22D3EE]">{ru?'ЛИЧНЫЙ КАБИНЕТ':'PLAYER ACCOUNT'}</p><h1 className="mt-3 break-words text-2xl font-black sm:text-4xl" translate="no">{profile.nickname||(ru?'Игрок':'Player')}</h1><p className="mt-2 text-sm text-white/60">{region}</p></div></div><Link href="/profile/settings" className="rounded-2xl border border-white/15 px-5 py-3">{ru?'Настройки профиля':'Profile settings'}</Link></header><nav aria-label={ru?'Разделы кабинета':'Account sections'} className="my-8 flex flex-wrap gap-2">{sections.map((s,i)=><button key={s} onClick={()=>setActive(s)} aria-current={active===s?'page':undefined} className={'rounded-xl px-4 py-3 text-sm '+(active===s?'bg-[#22D3EE] font-bold text-[#0A0F14]':'bg-white/5 text-white/60')}>{labels[i]}</button>)}</nav>
 {active==='overview'?<div className="space-y-6"><div className="rounded-3xl border border-white/10 bg-[#0D131A] p-6"><h2 className="text-xl font-bold">{ru?'Подключённые аккаунты':'Connected accounts'}</h2>{googleConnected?<p className="mt-4" translate="no">Google · {ru?'Подключён ранее':'Previously connected'}</p>:null}<div className={steamId?"mt-4":"mt-4 w-fit max-w-full"}>{steamId?<SteamProfile key={steamId} steamId={steamId} ru={ru}/>:<AuthPanel steamOnly/>}</div><p className="mt-4 text-xs leading-5 text-white/50">{ru?'Привязка аккаунта не подтверждает соответствие критериям участия. Внешняя история игр не импортируется автоматически.':'Connecting an account does not verify Deaf player eligibility. External game history is not imported automatically.'}</p></div><HubPanel section="stats" own/></div>:null}
 {active==='stats'?<HubPanel section="stats" own/>:null}
 {active==='history'?<MatchHistory/>:null}
 {active==='team'?<HubPanel section="teams" own/>:null}
 {active==='tournaments'?<HubPanel section="tournaments" own/>:null}
 {active==='wallet'?<div className="rounded-3xl border border-white/10 p-8"><h2 className="text-2xl font-bold">{ru?'Кошелёк':'Wallet'}</h2><p className="mt-4 text-white/50">{ru?'Платежи подключим последними. Баланс, взносы и вывод пока недоступны.':'Payments will be connected last. Balance, fees and withdrawals are unavailable.'}</p></div>:null}
 </section>;
}
