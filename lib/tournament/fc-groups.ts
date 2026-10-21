import {randomInt} from 'node:crypto';
import type {FcLevel} from './fc-levels';
type Entrant={id:string;level:FcLevel|null};
// Server-side Fisher-Yates. The caller persists the draw once in engine state.
export function drawFcGroups(entrants:Entrant[],groupIds:string[],random:(upper:number)=>number=randomInt){
 if(entrants.length<4||entrants.length>100||new Set(entrants.map(e=>e.id)).size!==entrants.length)throw Error('Invalid FC entries');
 if(groupIds.length<2||groupIds.length>32||groupIds.length>Math.floor(entrants.length/2)||new Set(groupIds).size!==groupIds.length)throw Error('Invalid FC groups');
 const shuffle=<T>(values:T[])=>{const out=[...values];for(let i=out.length-1;i>0;i--){const j=random(i+1);if(!Number.isInteger(j)||j<0||j>i)throw Error('Invalid draw source');[out[i],out[j]]=[out[j],out[i]];}return out;};
 const order=shuffle(groupIds),sizes=order.map((_,i)=>Math.floor(entrants.length/order.length)+(i<entrants.length%order.length?1:0));
 const groups=order.map((id,i)=>({id,entries:[] as string[],capacity:sizes[i],strong:0,intermediate:0}));
 const strong=shuffle(entrants.filter(e=>e.level==='strong')),medium=shuffle(entrants.filter(e=>e.level==='intermediate'));
 const place=(entry:Entrant,level:'strong'|'intermediate'|null)=>{
  const available=groups.filter(g=>g.entries.length<g.capacity);
  if(!available.length)throw Error('FC draw has no free place');
  const minLevel=level?Math.min(...available.map(g=>g[level])):0;
  const balanced=level?available.filter(g=>g[level]===minLevel):available;
  const minSize=Math.min(...balanced.map(g=>g.entries.length));
  const target=shuffle(balanced.filter(g=>g.entries.length===minSize))[0];target.entries.push(entry.id);if(level)target[level]++;
 };
 strong.forEach(e=>place(e,'strong'));
 // Reserving two medium places per group is a target; shortages/excess are balanced.
 medium.forEach(e=>place(e,'intermediate'));
 shuffle(entrants.filter(e=>e.level!=='strong'&&e.level!=='intermediate')).forEach(e=>place(e,null));
 return groups.map(g=>({id:g.id,entries:shuffle(g.entries)})).sort((a,b)=>groupIds.indexOf(a.id)-groupIds.indexOf(b.id));
}
