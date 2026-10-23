import type {HubMatch} from './hub-types';
// History membership comes from registered roster snapshots, never current team membership.
export function ownMatchHistory(matches:HubMatch[],entryIds:string[]){
 const own=new Set(entryIds);
 return matches.filter(m=>m.status==='finished'&&(own.has(m.entry_a)||own.has(m.entry_b))).sort((a,b)=>{
  const first=Date.parse(a.starts_at),second=Date.parse(b.starts_at);
  return (Number.isFinite(second)?second:0)-(Number.isFinite(first)?first:0)||a.id.localeCompare(b.id);
 });
}
export function matchDateLabel(match:HubMatch,ru:boolean){
 const value=Date.parse(match.engine_match&&match.scheduled_at?match.scheduled_at:match.starts_at);
 if(!Number.isFinite(value))return ru?'Дата не указана':'Date unavailable';
 const label=new Date(value).toLocaleString(ru?'ru-RU':'en-GB',{timeZone:'UTC'})+' UTC';
 return (match.engine_match&&!match.scheduled_at?(ru?'Начало турнира: ':'Tournament start: '):(ru?'Запланированное время: ':'Scheduled time: '))+label;
}
