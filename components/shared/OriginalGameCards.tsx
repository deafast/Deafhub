'use client';
import type {CSSProperties,MouseEvent} from 'react';
import {useCardPhysics} from '../game-cards/useCardPhysics';
import styles from './OriginalGameCards.module.css';
import type {OriginalGame as Game} from './original-games';
function OriginalCard({game,ru}:{game:Game;ru:boolean}){
 const layout=game.art;
 const {ref,draggedRef}=useCardPhysics<HTMLAnchorElement>({maxTilt:8,hoverScale:1.018,dragScale:1.03});
 const css={left:`${(layout.x-760)/885*100}%`,top:`${(layout.y-125)/620*100}%`,width:`${layout.width/885*100}%`,height:`${layout.height/620*100}%`,'--copy-left':`${(layout.copyX-layout.x)/layout.width*100}%`,'--copy-top':`${(layout.copyY-layout.y)/layout.height*100}%`} as CSSProperties;
 const click=(e:MouseEvent)=>{if(draggedRef.current){e.preventDefault();draggedRef.current=false;}};
 return <a ref={ref} href={'/tournaments?game='+game.id} data-card-root="" data-original-card={game.id} className={styles.card} style={css} onClick={click} aria-label={game.name} draggable={false}>
  {/* Approved raster includes the original character, game logo, texture and unique frame. */}
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img src={'/branding/game-cards-transparent/'+layout.file} width={layout.width} height={layout.height} alt="" draggable={false} className={styles.art}/>
  <span className={styles.copy}>{(ru?game.ru:game.en).map(line=><span key={line}>{line}</span>)}</span>
 </a>;
}
export default function OriginalGameCards({games,ru}:{games:Game[];ru:boolean}){
 return <nav className={styles.stage} aria-label={ru?'Игры':'Games'}>{games.map(game=><OriginalCard key={game.id} game={game} ru={ru}/>)}</nav>;
}
