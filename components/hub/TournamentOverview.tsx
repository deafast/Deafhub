import type {ReactNode} from 'react';
import Link from 'next/link';
import type {HubData,HubTournament} from '@/lib/hub-types';
import type {GameFilter} from '@/lib/tournament-filters';
import styles from '@/components/shared/CompetitionSurface.module.css';
const identities={all:{name:'DEAFHUB',logo:'/branding/approved-2026-10-28/dh.png'},dota2:{name:'Dota 2',logo:'/branding/game-logos/dota2.png'},cs2:{name:'CS2',logo:'/branding/game-logos/cs2.svg'},fc:{name:'EA Sports FC',logo:'/branding/game-logos/ea-sports-fc.svg'}};
export default function TournamentOverview({game,data,tournaments,ru,controls,createAction}:{game:GameFilter;data:HubData|null;tournaments:HubTournament[];ru:boolean;controls?:ReactNode;createAction?:ReactNode}){
 const t=(r:string,e:string)=>ru?r:e,identity=identities[game];
 const ids=new Set(tournaments.map(event=>event.id));
 const open=tournaments.filter(event=>event.status==='open').length;
 const approved=data?.entries.filter(entry=>ids.has(entry.tournament_id)&&entry.status==='approved').length;
 const scheduled=data?.matches.filter(match=>ids.has(match.tournament_id)&&match.status==='scheduled').length;

 return <><section data-game-banner={game==='dota2'?'dota2':undefined} className={game==='dota2'?styles.dotaHeader:undefined}>{game==='dota2'?<><div className={styles.gameBannerTools}>{createAction}{controls}</div>
{/* eslint-disable-next-line @next/next/no-img-element */}
<img className={styles.gameBannerImage} src="/branding/tournaments/dota2-deafhub-header-approved.png" width={2048} height={682} alt="DEAFHUB — Dota 2"/></>:null}<section className={styles.overview} aria-label={t('Обзор соревнований','Competition overview')}>
 <div className={styles.gameIdentity}>
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img src={identity.logo} width={112} height={70} alt="" className={styles.gameLogo+(game==='fc'?' '+styles.fcLogo:'')}/>
 <div><h2 translate="no">{identity.name}</h2><p>{t('Выберите турнир и ознакомьтесь с правилами.','Choose a tournament and read the rules.')}</p></div></div>
 <div className={styles.metrics}>{[[t('Открыта регистрация','Open for entries'),data?open:'—'],[t('Допущено заявок','Approved entries'),approved??'—'],[t('Назначено матчей','Scheduled matches'),scheduled??'—']].map(([label,value])=><div key={label} className={styles.metric}><strong>{value}</strong><span>{label}</span></div>)}</div>
 </section></section>
 {data&&tournaments.length?<div className={styles.eventTable}><table><caption>{t("События по выбранным условиям","Events matching your filters")}</caption><thead><tr>{[t("Турнир","Tournament"),t("Начало, UTC","Start, UTC"),t("Допущено","Approved"),t("Статус","Status")].map(label=><th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{tournaments.map(event=><tr key={event.id}><td><Link href={"#tournament-"+event.id}>{event.title}</Link><small>{identities[event.game as keyof typeof identities]?.name||event.game}</small></td><td>{new Date(event.starts_at).toLocaleString(ru?"ru-RU":"en-GB",{timeZone:"UTC"})}</td><td>{data.entries.filter(entry=>entry.tournament_id===event.id&&entry.status==="approved").length}</td><td><span data-event-status={event.status}>{event.status==="open"?t("Регистрация","Registration"):event.status==="closed"?t("Регистрация закрыта","Registration closed"):event.status==="finished"?t("Завершён","Finished"):event.status}</span></td></tr>)}</tbody></table></div>:null}
 </>;
}
