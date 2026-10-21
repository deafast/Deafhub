import test from 'node:test';import assert from 'node:assert/strict';
import {drawFcGroups} from './fc-groups.ts';
import {createTournament} from './engine.ts';
const players=(strong,medium,amateur)=>[...Array.from({length:strong},(_,i)=>({id:`s${i}`,level:'strong'})),...Array.from({length:medium},(_,i)=>({id:`m${i}`,level:'intermediate'})),...Array.from({length:amateur},(_,i)=>({id:`a${i}`,level:'amateur'}))];
const ids=n=>Array.from({length:n},(_,i)=>String.fromCharCode(65+i));
for(const count of [2,4,8,16])test(`FC ${count} groups: one strong, two medium, rest random`,()=>{
 const input=players(count,count*2,count*2),before=JSON.stringify(input);
 for(let draw=0;draw<20;draw++){
  const groups=drawFcGroups(input,ids(count));assert.equal(groups.length,count);
  for(const group of groups){assert.equal(group.entries.length,5);assert.equal(group.entries.filter(x=>x.startsWith('s')).length,1);assert.equal(group.entries.filter(x=>x.startsWith('m')).length,2);}
  assert.equal(new Set(groups.flatMap(g=>g.entries)).size,input.length);
 }
 assert.equal(JSON.stringify(input),before);
});
for(const [strong,medium,amateur,count]of [[0,0,17,4],[2,3,18,4],[12,8,4,4],[0,20,1,4],[4,0,8,4],[3,4,0,3]])test(`imbalanced levels ${strong}/${medium}/${amateur} into ${count}`,()=>{
 const input=players(strong,medium,amateur),groups=drawFcGroups(input,ids(count));
 assert.equal(new Set(groups.flatMap(g=>g.entries)).size,input.length);assert.ok(Math.max(...groups.map(g=>g.entries.length))-Math.min(...groups.map(g=>g.entries.length))<=1);assert.ok(groups.every(g=>g.entries.length>=2));
});
test('draw rejects duplicates, unfillable groups and invalid random source',()=>{
 for(const [input,groups]of [[players(1,2,0),ids(2)],[[{id:'a',level:null},{id:'a',level:null},{id:'b',level:null},{id:'c',level:null}],ids(2)],[players(2,4,2),['A','A']],[players(1,2,1),ids(3)]])assert.throws(()=>drawFcGroups(input,groups));
 assert.throws(()=>drawFcGroups(players(2,4,2),ids(2),n=>n),/source/);
});
test('legacy entries with unknown level are random without inventing a rating',()=>{
 const input=Array.from({length:8},(_,i)=>({id:`legacy${i}`,level:null}));const groups=drawFcGroups(input,ids(2));assert.equal(groups.flatMap(g=>g.entries).length,8);assert.equal(input.every(e=>e.level===null),true);
});
test('seeded groups integrate with existing FC engine without changing capacity',()=>{
 const input=players(4,8,4),groups=drawFcGroups(input,ids(4));const state=createTournament('fc',input.map(p=>p.id),{format:'double',grandFinal:'reset',bestOf:1,groups,qualify:2,points:{win:3,draw:1,loss:0}});
 assert.equal(state.phase,'groups');assert.equal(state.matches.length,24);assert.deepEqual(state.config.groups,groups);
 assert.throws(()=>createTournament('fc',Array.from({length:65},(_,i)=>`p${i}`),state.config),/2–64/);
});
