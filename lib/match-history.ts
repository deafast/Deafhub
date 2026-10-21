export type HistoryMatch={match_id:string;tournament_id:string;tournament_title:string;game:string;player_a:string;player_b:string;score_a:number|null;score_b:number|null;result_kind:string;penalties:{a:number;b:number}|null;confirmed_at:string|null;tournament_starts_at:string;scheduled_at:string|null;source:'manual'|'engine'};
export type HistoryPage={items:HistoryMatch[];nextCursor:string|null};
export function historyDate(match:HistoryMatch,ru:boolean){
 const value=match.confirmed_at||match.scheduled_at||match.tournament_starts_at;
 const time=Date.parse(value);
 if(!Number.isFinite(time))return ru?'Дата не указана':'Date unavailable';
 const label=match.confirmed_at?(ru?'Результат подтверждён: ':'Result confirmed: '):match.scheduled_at?(ru?'Запланированное время: ':'Scheduled time: '):(ru?'Начало турнира: ':'Tournament start: ');
 return label+new Date(time).toLocaleString(ru?'ru-RU':'en-GB');
}
export function historyScore(match:HistoryMatch,ru:boolean){
 if(match.result_kind==='forfeit')return ru?'Технический результат':'Forfeit result';
 if(match.score_a===null||match.score_b===null)return ru?'Счёт не указан':'Score unavailable';
 return `${match.score_a} : ${match.score_b}`+(match.penalties?` (${ru?'пен.':'pens'} ${match.penalties.a}:${match.penalties.b})`:'');
}
export const historyTournamentUrl=(id:string)=>`/tournaments?tournament=${encodeURIComponent(id)}#tournament-${encodeURIComponent(id)}`;
