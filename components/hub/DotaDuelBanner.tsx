import Image from 'next/image';
import styles from '@/components/shared/CompetitionSurface.module.css';
export default function DotaDuelBanner({title,startsAt,ru}:{title:string;startsAt:string;ru:boolean}){
 const date=new Date(startsAt),season=title.match(/Сезон\s+(\d+)/iu)?.[1];
 const day=date.toLocaleDateString(ru?'ru-RU':'en-GB',{day:'2-digit',month:'long',year:'numeric',timeZone:'Europe/Minsk'});
 const time=date.toLocaleTimeString(ru?'ru-RU':'en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Minsk'});
 return <section className={styles.duelBanner} aria-label={ru?'Баннер Dota 2 1×1':'Dota 2 1×1 banner'}>
  <div className={styles.duelBrand}><Image src="/branding/approved-2026-10-28/wordmark-tagline.png" width={610} height={115} alt="DEAFHUB — ESPORTS ORGANIZATION" unoptimized/>{season?<span>{ru?season+' сезон':'Season '+season}</span>:null}</div>
  <h3 translate="no">DOTA 2 <span>1×1</span></h3>
  <time dateTime={startsAt}>{day} · {time} <span>UTC+3</span></time>
  {title.includes('TEST')?<p className={styles.duelTest}>{ru?'TEST · технический тест без призовых':'TEST · technical test, no prizes'}</p>:null}
 </section>;
}
