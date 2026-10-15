'use client';
import Link from 'next/link';
import { useLanguageStore } from '@/store/useLanguageStore';
export default function TeamPage() {
 const ru = useLanguageStore(s=>s.language === 'ru');
 return <section className="mx-auto max-w-5xl px-5 py-14"><p className="text-xs tracking-widest text-[#22D3EE]">TEAM HUB</p><h1 className="mt-4 text-4xl font-black">{ru ? 'Команды и игроки' : 'Teams and players'}</h1><div className="mt-8 rounded-3xl border border-white/10 bg-[#0D131A] p-8"><h2 className="text-xl font-bold">{ru ? 'Каталог команд ещё не открыт' : 'The team directory is not open yet'}</h2><p className="mt-4 leading-7 text-white/60">{ru ? 'Регистрация составов, приглашения и поиск игроков пока не подключены. Здесь будут только реальные команды и подтверждённые результаты.' : 'Roster registration, invitations and player search are not connected yet. Only real teams and confirmed results will appear here.'}</p><Link className="mt-6 inline-block text-[#22D3EE]" href="/profile">{ru ? 'Открыть личный кабинет →' : 'Open my account →'}</Link></div></section>;
}
