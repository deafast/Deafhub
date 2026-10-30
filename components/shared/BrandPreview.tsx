'use client';
import Link from 'next/link';
import {useId} from 'react';
import Image from 'next/image';
import {ArrowRight,Users,Gamepad2,TrendingUp,ShieldCheck} from 'lucide-react';
import {useLanguageStore} from '@/store/useLanguageStore';
import styles from './BrandPreview.module.css';
import LivingWaves from './LivingWaves';

const artwork='/branding/home-approved/artwork.webp';
const games=[
 {id:'dota2',name:'Dota 2',logo:'/branding/game-logos/dota2.png',width:386,height:76,className:'dota',ru:['Стратегия','Командная игра','Большие возможности'],en:['Strategy','Team play','More opportunities']},
 {id:'cs2',name:'CS2',logo:'/branding/game-logos/cs2.svg',width:801,height:165,className:'cs2',ru:['Тактика','Реакция','Командный дух'],en:['Tactics','Reaction','Team spirit']},
 {id:'fc',name:'EA Sports FC',logo:'/branding/game-logos/ea-sports-fc.svg',width:512,height:254,className:'fc',ru:['Футбол','Сообщество','Игра для каждого'],en:['Football','Community','A game for everyone']},
];

export default function BrandPreview(){
 const ru=useLanguageStore(s=>s.language==='ru');
 const sceneId=useId();
 const text=(r:string,e:string)=>ru?r:e;
 const features=[
  {icon:Users,title:text('Инклюзивное сообщество','Inclusive community'),body:text('Играем. Общаемся. Развиваемся вместе.','Play, connect and grow together.')},
  {icon:Gamepad2,title:text('Любимые игры','Favourite games'),body:text('Популярные дисциплины и комфортная среда.','Popular games and a welcoming environment.')},
  {icon:TrendingUp,title:text('Развитие и возможности','Growth and opportunities'),body:text('Навыки, опыт, новые горизонты в киберспорте.','Skills, experience and new esports opportunities.')},
  {icon:ShieldCheck,title:text('Уважение и равные условия','Respect and equal opportunities'),body:text('Талант не зависит от слуха.','Talent does not depend on hearing.')},
 ];
 return <div className={styles.page}>
  <div className={styles.waves}/><LivingWaves/>
  <div className={styles.content}>
   <section className={styles.hero} aria-labelledby="home-title">
    <div className={styles.intro}>
     <p className={styles.eyebrow}>{text('Игры · Люди · Без барьеров','Games · People · Without barriers')}</p>
     <h1 id="home-title" className={styles.title}>{text('Киберспорт','Esports')}<br/><span>{text('без барьеров','without barriers')}</span></h1>
     <p className={styles.description}>{text('DEAFHUB — платформа, которая объединяет игроков с нарушением слуха и всех, кто верит, что киберспорт доступен каждому.','DEAFHUB brings together Deaf and hard of hearing players and everyone who believes esports is for all.')}</p>
     <div className={styles.actions}>
      <Link href="/profile" className={styles.primary}>{text('Присоединиться','Join us')}<ArrowRight size={18} aria-hidden="true"/></Link>
      <Link href="/about" className={styles.secondary}>{text('Узнать больше','Learn more')}</Link>
     </div>
    </div>
    <div className={styles.desktopGames}>
     <svg viewBox="760 125 885 620" aria-hidden="true" className={styles.scene}>
      <defs>
       <mask id={sceneId+'-mask'} maskUnits="userSpaceOnUse" x="760" y="125" width="885" height="620">
        <path d="M861 202 L1068 195 L991 654 L761 625 Z M871 166 L858 200 L840 240 L857 227 L867 198 Z M1001 165 L1007 204 L1019 242 L1014 221 L1012 190 Z M1078 165 L1368 140 L1292 682 L998 658 Z M1376 185 L1635 230 L1568 672 L1304 646 Z" fill="white"/>
       </mask>
      </defs>
      <image href={artwork} width="1672" height="941" mask={'url(#'+sceneId+'-mask)'}/>
     </svg>
     <nav aria-label={text('Игры','Games')} className={styles.desktopLinks}>
      {games.map(game=><Link key={game.id} href={`/tournaments?game=${game.id}`} className={`${styles.gameLink} ${styles[game.className]}`} aria-label={game.name}>
       <span className={styles.srOnly} lang="en">{game.name}</span>
       <span className={styles.cardCopy}>{(ru?game.ru:game.en).map(line=><span key={line}>{line}</span>)}</span>
      </Link>)}
     </nav>
    </div>
   </section>
   <nav aria-label={text('Игры','Games')} className={styles.mobileGames}>
    {games.map(game=><Link key={game.id} href={`/tournaments?game=${game.id}`} className={styles.mobileGame} aria-label={game.name}>
     <Image src={game.logo} width={game.width} height={game.height} alt="" unoptimized className={styles.mobileArt}/>
    </Link>)}
   </nav>
   <section className={styles.features} aria-label={text('О сообществе','Our community')}>
    {features.map(({icon:Icon,title,body})=><article key={title} className={styles.feature}><Icon size={34} aria-hidden="true"/><div><h2>{title}</h2><p>{body}</p></div></article>)}
   </section>
   <details className={styles.projectStatus}><summary>{text('Что уже работает','Available now')}</summary><p>{text('Вход по почте и Steam, личный кабинет, команды, заявки и учёт результатов матчей. Подтверждённых турниров и трансляций пока нет.','Email and Steam sign-in, player accounts, teams, entries and match results. No confirmed tournaments or streams yet.')}</p><p>{text('Визуальные уведомления, субтитры трансляций и материалы на жестовом языке остаются в плане развития.','Visual notifications, stream captions and sign language materials remain on the roadmap.')}</p></details>
   <nav className={styles.footer} aria-label={text('О проекте','Project information')}><Link href="/about">{text('О проекте','About')}</Link><Link href="/rules">{text('Правила и участие','Rules and participation')}</Link><Link href="/contact">{text('Контакты и спонсоры','Contact and sponsors')}</Link></nav>
  </div>
 </div>;
}
