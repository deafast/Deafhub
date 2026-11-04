'use client';
import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useLanguageStore } from '@/store/useLanguageStore';
import styles from './BrandPreview.module.css';

const games = [
 {id:'lol',name:'League of Legends',logo:'league-of-legends.svg',width:736,height:287,x:'6%',active:false},
 {id:'valorant',name:'Valorant',logo:'valorant.webp',width:736,height:138,x:'24%',active:false},
 {id:'dota2',name:'Dota 2',logo:'dota2.png',width:386,height:76,x:'44%',active:true},
 {id:'fc',name:'EA Sports FC 27',logo:'ea-sports-fc.svg',width:512,height:254,x:'64%',active:true},
 {id:'cs2',name:'Counter-Strike 2',logo:'cs2.svg',width:801,height:165,x:'86%',active:true},
] as const;

export default function BrandPreview() {
 const ru=useLanguageStore(state=>state.language==='ru');
 return <div className={styles.page} data-home="five-games">
  <section className={styles.hero} aria-labelledby="home-title">
   <div className={styles.games} role="group" aria-label={ru?'Игровые дисциплины':'Game disciplines'}>
    {games.map((game,index)=>{
     const art=<><span className={styles.art} aria-hidden="true"/>
      {game.id==='fc'?<span className={styles.footballPortrait} aria-hidden="true"/>:null}
      <span className={styles.gameLogo}><Image src={'/branding/game-logos/'+game.logo} width={game.width} height={game.height} alt={game.name} unoptimized/></span></>;
     const style={'--game-index':index,'--logo-x':game.x} as CSSProperties;
     return game.active?
      <Link key={game.id} href={'/tournaments?game='+game.id} prefetch={false} className={styles.game} style={style} data-game={game.id} aria-label={ru?'Турниры '+game.name:game.name+' tournaments'}>{art}</Link>:
      <div key={game.id} className={styles.game} style={style} data-game={game.id} data-decorative="true">{art}</div>;
    })}
   </div>
   <div className={styles.brand}>
    <h1 id="home-title" className={styles.title}><Image src="/branding/approved-2026-10-28/wordmark-tagline.png" alt="DEAFHUB Esports Organization" width={610} height={115} preload className={styles.wordmark}/></h1>
    <p className={styles.description}>{ru?'Турниры и сообщество игроков.':'Tournaments and a community of players.'}</p>
    <div className={styles.actions}>
     <Link href="/tournaments" className={styles.primary}>{ru?'Найти турнир':'Find a tournament'}</Link>
     <Link href="/team" className={styles.secondary}>{ru?'Найти команду':'Find a team'}</Link>
    </div>
   </div>
  </section>
  <footer className={styles.footer}><nav aria-label={ru?'Информация о проекте':'Project information'}>
   <Link href="/about">{ru?'О проекте':'About'}</Link><Link href="/rules">{ru?'Правила':'Rules'}</Link><Link href="/contact">{ru?'Контакты':'Contact'}</Link>
  </nav></footer>
 </div>;
}
