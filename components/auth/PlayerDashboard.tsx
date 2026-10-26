'use client';
import {useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
 return <section className="font-sans mx-auto max-w-6xl px-5 py-12"><header className="flex flex-wrap items-center justify-between gap-5"><div className="flex w-full min-w-0 items-center gap-4 sm:w-auto sm:flex-1 sm:gap-6"><div role="img" aria-label={ru?'Аватар игрока':'Player avatar'} className="h-20 w-20 shrink-0 overflow-hidden rounded-full sm:h-28 sm:w-28"><AvatarView className="h-full w-full !rounded-full pointer-events-none"/></div><div className="min-w-0"><p className="text-xs tracking-widest text-[#22D3EE]">{ru?'ЛИЧНЫЙ КАБИНЕТ':'PLAYER ACCOUNT'}</p><h1 className="mt-3 break-words text-2xl font-black sm:text-4xl" translate="no">{profile.nickname||(ru?'Игрок':'Player')}</h1><p className="mt-2 text-sm text-white/60">{region}</p></div></div><Link href="/profile/settings" className="rounded-2xl border border-white/15 px-5 py-3">{ru?'Настройки профиля':'Profile settings'}</Link></header><nav aria-label={ru?'Разделы кабинета':'Account sections'} className="my-8 flex flex-wrap gap-2">{sections.map((s,i)=><button key={s} onClick={()=>setActive(s)} aria-current={active===s?'page':undefined} className={'rounded-xl px-4 py-3 text-sm '+(active===s?'bg-[#22D3EE] font-bold text-[#0A0F14]':'bg-white/5 text-white/60')}>{labels[i]}</button>)}</nav>
 {active==='overview'?<div className="space-y-6"><div className="rounded-3xl border border-white/10 bg-[#0D131A] p-6"><h2 className="text-xl font-bold">{ru?'Игровые аккаунты':'Gaming accounts'}</h2><div className="mt-5 flex flex-wrap items-center gap-3">{steamId?<SteamProfile key={steamId} steamId={steamId} ru={ru}/>:<AuthPanel steamOnly/>}<span role="img" aria-label={ru?'FACEIT — подключение пока недоступно':'FACEIT — linking is not available yet'} title={ru?'FACEIT — подключение пока недоступно':'FACEIT — linking is not available yet'} className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]"><Image src="/auth/faceit.svg" width={34} height={34} alt="" className="opacity-35"/></span>{googleConnected?<span role="img" aria-label={ru?'Google — подключён':'Google — connected'} title={ru?'Google — подключён':'Google — connected'} className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04]"><Image src="/auth/google.svg" width={30} height={30} alt=""/></span>:null}</div></div><HubPanel section="stats" own/></div>:null}
 {active==='stats'?<HubPanel section="stats" own/>:null}
 {active==='history'?<MatchHistory/>:null}
 {active==='team'?<HubPanel section="teams" own/>:null}
 {active==='tournaments'?<HubPanel section="tournaments" own/>:null}
 {active==='wallet'?<div className="rounded-3xl border border-white/10 p-8"><h2 className="text-2xl font-bold">{ru?'Кошелёк':'Wallet'}</h2><p className="mt-4 text-white/50">{ru?'Платежи подключим последними. Баланс, взносы и вывод пока недоступны.':'Payments will be connected last. Balance, fees and withdrawals are unavailable.'}</p></div>:null}
 </section>;
}
