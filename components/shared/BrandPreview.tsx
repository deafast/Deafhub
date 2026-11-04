'use client';
import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useLanguageStore } from '@/store/useLanguageStore';
import styles from './BrandPreview.module.css';
import ApprovedHomeArt from './ApprovedHomeArt';
import { approvedScene as scene, homeGames as games } from './approved-home-scene';

export default function BrandPreview() {
 const ru=useLanguageStore(state=>state.language==='ru');
 return <div className={styles.page} data-home="five-games">
  <section className={styles.hero} aria-labelledby="home-title">
   <div className={styles.games} role="group" aria-label={ru?'Игровые дисциплины':'Game disciplines'}>
    {games.map((game,index)=>{
     const art=<><ApprovedHomeArt id={game.id}/>
      <span className={styles.gameLogo}>{game.logo?<Image src={'/branding/game-logos/'+game.logo} width={game.width} height={game.height} alt={game.name} unoptimized/>:<svg viewBox="884 802 180 54" role="img" aria-label={game.name}><image href={scene.src} width={scene.width} height={scene.height}/></svg>}</span></>;
     const left=index===0?[0,0]:scene.boundaries[index-1];
     const right=index===games.length-1?[scene.width,scene.width]:scene.boundaries[index];
     const style={'--game-index':index,'--logo-x':game.x,'--left-top':left[0]/scene.width*100+'%','--left-bottom':left[1]/scene.width*100+'%','--right-top':right[0]/scene.width*100+'%','--right-bottom':right[1]/scene.width*100+'%'} as CSSProperties;
     return game.active?
      <Link key={game.id} href={'/tournaments?game='+game.id} prefetch={false} className={styles.game} style={style} data-game={game.id} aria-label={ru?'Турниры '+game.name:game.name+' tournaments'}>{art}</Link>:
      <div key={game.id} className={styles.game} style={style} data-game={game.id} data-decorative="true">{art}</div>;
    })}
    <svg className={styles.dividers} viewBox={'0 '+scene.top+' '+scene.width+' '+(scene.bottom-scene.top)} preserveAspectRatio="none" aria-hidden="true">
     {scene.boundaries.map(([top,bottom],index)=><path key={index} d={'M'+(top+(bottom-top)*(500-scene.top)/(scene.bottom-scene.top))+' 500L'+bottom+' '+scene.bottom} stroke="#00c5da" strokeWidth="1" opacity=".5" vectorEffect="non-scaling-stroke"/>)}
    </svg>
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
