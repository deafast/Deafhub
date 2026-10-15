'use client';
import Link from 'next/link';
import { useLanguageStore } from '@/store/useLanguageStore';
export default function LivePage() {
 const ru = useLanguageStore(s => s.language === 'ru');
 return <section className="mx-auto max-w-5xl px-5 py-14"><p className="text-xs tracking-widest text-[#22D3EE]">LIVE HUB</p><h1 className="mt-4 text-4xl font-black">{ru ? 'Матчи и трансляции' : 'Matches and streams'}</h1><div className="mt-8 rounded-3xl border border-white/10 bg-[#0D131A] p-8"><h2 className="text-xl font-bold">{ru ? 'Подтверждённых трансляций пока нет' : 'No confirmed streams yet'}</h2><p className="mt-4 leading-7 text-white/60">{ru ? 'Здесь появятся реальные матчи DeafHub: участники, время, результаты и ссылки на эфир. Расписание пока не объявлено.' : 'Real DeafHub matches, participants, times, results and stream links will appear here. The schedule has not been announced.'}</p><Link href="/tournaments" className="mt-6 inline-block text-[#22D3EE]">{ru ? 'Смотреть турниры →' : 'Browse tournaments →'}</Link></div></section>;
}
