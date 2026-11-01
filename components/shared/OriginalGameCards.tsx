'use client';
import {useId,type CSSProperties,type MouseEvent} from 'react';
import {useCardPhysics} from '../game-cards/useCardPhysics';
import styles from './OriginalGameCards.module.css';
import type {OriginalGame as Game} from './original-games';
function OriginalCard({game,ru}:{game:Game;ru:boolean}){
 const layout=game.art;const id=useId();const edge=layout.rim||layout.outline;
 const {ref,draggedRef}=useCardPhysics<HTMLAnchorElement>({maxTilt:8,hoverScale:1.018,dragScale:1.03});
 const css={left:`${(layout.x-760)/885*100}%`,top:`${(layout.y-125)/620*100}%`,width:`${layout.width/885*100}%`,height:`${layout.height/620*100}%`,'--copy-left':`${(layout.copyX-layout.x)/layout.width*100}%`,'--copy-top':`${(layout.copyY-layout.y)/layout.height*100}%`} as CSSProperties;
 const click=(e:MouseEvent)=>{if(draggedRef.current){e.preventDefault();draggedRef.current=false;}};
 return <a ref={ref} href={'/tournaments?game='+game.id} data-card-root="" data-original-card={game.id} className={styles.card} style={css} onClick={click} aria-label={game.name} draggable={false}>
  <svg className={styles.art} viewBox={`${layout.x} ${layout.y} ${layout.width} ${layout.height}`} aria-hidden="true" data-clean-frame="true">
   <defs>
    <clipPath id={id+'-inside'}>
     <path d={layout.outline}/>
     {game.id==='dota2'&&<><path d="M693 153H885L873 208L791 538L772 575H693Z"/><path d="M992 153H1030V235H992Z"/></>}
    </clipPath>
    <linearGradient id={id+'-rim'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b6f5ff"/><stop offset=".3" stopColor="#22d3ee"/><stop offset=".7" stopColor="#1d6071"/><stop offset="1" stopColor="#00d4e9"/></linearGradient>
   </defs>

   <g clipPath={'url(#'+id+'-inside)'}>
    <image href={'/branding/game-cards-transparent/'+layout.file} x={layout.x} y={layout.y} width={layout.width} height={layout.height}/>
   </g>
   <path d={edge} fill="none" stroke={'url(#'+id+'-rim)'} strokeWidth="1.8" strokeLinejoin="round"/>
  </svg>
  <span className={styles.copy}>{(ru?game.ru:game.en).map(line=><span key={line}>{line}</span>)}</span>
 </a>;
}
export default function OriginalGameCards({games,ru}:{games:Game[];ru:boolean}){
 return <nav className={styles.stage} aria-label={ru?'Игры':'Games'}>{games.map(game=><OriginalCard key={game.id} game={game} ru={ru}/>)}</nav>;
}
