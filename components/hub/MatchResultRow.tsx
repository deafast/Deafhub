'use client';
import {Dialog,DialogTrigger,DialogContent,DialogTitle,DialogDescription,DialogClose} from '@/components/ui/dialog';
type Props={game:string;tournament:string;playerA:string;playerB:string;score:string;date:string;label:string;outcome?:string;ru:boolean};
export default function MatchResultRow({game,tournament,playerA,playerB,score,date,label,outcome='neutral',ru}:Props){
 const text=(r:string,e:string)=>ru?r:e;
 const gameName=game==='dota2'?'Dota 2':game==='fc'?'EA Sports FC':game==='cs2'?'CS2':text('Игра','Game');
 return <article><Dialog><DialogTrigger asChild><button type="button" data-match-row="" data-outcome={outcome} aria-label={text('Итоги матча: ','Match results: ')+playerA+' — '+playerB+', '+score}>
  <span data-match-logo="" data-game={game} role="img" aria-label={gameName}/><span data-match-outcome="">{label}</span><span data-match-identity=""><span data-match-title="">{playerA} — {playerB}</span><span data-match-subtitle="">{tournament}</span></span><strong data-match-score="">{score}</strong><span data-match-date="" title={date}>{date}</span>
 </button></DialogTrigger><DialogContent className="!w-[calc(100%-2rem)] !max-w-3xl max-h-[85dvh] overflow-y-auto border-[#294451] bg-[#0c1720] text-[#eafbff]" showCloseButton={false}>
  <header className="flex items-start justify-between gap-4"><div><DialogTitle>{text('Итоги матча','Match results')}</DialogTitle><DialogDescription className="mt-2 text-[#9bb6c3]">{gameName} · {tournament}</DialogDescription></div><DialogClose asChild><button type="button" className="min-h-11 min-w-11 rounded-lg border border-white/15 px-3 text-lg" aria-label={text('Закрыть итоги матча','Close match results')}>×</button></DialogClose></header>
  <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 py-5 text-center"><strong className="break-words text-base sm:text-xl">{playerA}</strong><strong className="whitespace-nowrap text-3xl text-[#22d3ee] sm:text-4xl">{score}</strong><strong className="break-words text-base sm:text-xl">{playerB}</strong></div>
  <p className="text-sm text-[#9bb6c3]">{date}</p><p className="text-sm text-[#9bb6c3]">{text('Результат подтверждён на DeafHub.','Result confirmed on DeafHub.')}</p>
  <div className="border-t border-white/10 pt-4 text-sm leading-6 text-[#9bb6c3]">{text('Сохранён счёт встречи. Герои, K/D/A, длительность и предметы из игры пока не импортируются.','The match score is recorded. Heroes, K/D/A, duration and in-game items are not imported yet.')}</div>
 </DialogContent></Dialog></article>;
}
