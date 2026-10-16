import test from 'node:test';
import assert from 'node:assert/strict';
import { createTournament, transition, standings } from './engine.ts';
const rules=(extra={})=>({format:'double',grandFinal:'reset',bestOf:1,groups:[],qualify:2,points:{win:3,draw:1,loss:0},...extra});
const result=(s,id,a=1,b=0,invalidate=false)=>transition(s,{type:'result',match:id,result:{kind:'played',a,b},invalidate,reason:'Organizer verified'});
for(const count of [2,3,4,5,7,8,9,16,31,32,63,64]) for(const side of [0,1]) test(`DE ${count} entries, winner side ${side}`,()=>{
 let s=createTournament('cs2',Array.from({length:count},(_,i)=>`e${i}`),rules());
 let played=0;
 while(!s.champion) {
  const m=s.matches.find(m=>m.status==='ready'); assert.ok(m,'unfinished bracket has a ready match');
  s=result(s,m.id,side===0?1:0,side===0?0:1); assert.ok(++played<=2*count-1);
 }
 const losses=new Map(s.entries.map(e=>[e,0]));
 for(const m of s.matches.filter(m=>m.status==='finished')) if(m.loser) losses.set(m.loser,losses.get(m.loser)+1);
 for(const e of s.entries) assert.equal(losses.get(e),e===s.champion?(side===0?0:1):2,`losses of ${e}`);
 assert.ok([2*count-2,2*count-1].includes(played));
});
test('SE BYE is not a played match and no phantom entrant',()=>{
 let s=createTournament('dota2',['a','b','c'],rules({format:'single'}));
 assert.equal(s.matches.filter(m=>m.status==='bye').length,1);
 while(!s.champion) s=result(s,s.matches.find(m=>m.status==='ready').id);
 assert.equal(s.matches.filter(m=>m.status==='finished').length,2);
});
test('grand final policy is explicit; single final can end with one loss',()=>{
 let s=createTournament('cs2',['a','b'],rules({grandFinal:'single'}));
 s=result(s,'U1.0');s=result(s,'GF1',0,1);assert.equal(s.champion,'b');assert.equal(s.matches.length,2);
});
test('forfeit advances a real opponent without invented scores',()=>{
 let s=createTournament('cs2',['a','b'],rules({format:'single'}));
 s=transition(s,{type:'result',match:'U1.0',result:{kind:'forfeit',loser:'a'},invalidate:false,reason:'No show'});
 assert.equal(s.champion,'b');assert.equal(s.matches[0].result.a,undefined);
});
test('reject foreign forfeit, tied playoffs, invalid BO3, waiting result',()=>{
 const s=createTournament('cs2',['a','b','c','d'],rules({bestOf:3}));
 assert.throws(()=>result(s,'U1.0',1,0),/best-of/);
 assert.throws(()=>result(s,'U1.0',2,2),/Draw/);
 assert.throws(()=>result(s,'U2.0',2,1),/not ready/);
 assert.throws(()=>transition(s,{type:'result',match:'U1.0',result:{kind:'forfeit',loser:'x'},invalidate:false,reason:'test'}),/participant/);
});
test('correction blocks dependent result or atomically invalidates it',()=>{
 let s=createTournament('cs2',['a','b','c','d'],rules({format:'single'}));
 s=result(s,'U1.0');s=result(s,'U1.1');s=result(s,'U2.0');
 assert.throws(()=>result(s,'U1.0',0,1),/Dependent/);
 const corrected=result(s,'U1.0',0,1,true);
 assert.equal(corrected.champion,null);assert.equal(corrected.matches.at(-1).status,'ready');
 assert.equal(corrected.matches.at(-1).result,undefined);assert.ok(s.champion,'input immutable');
});
test('round robin, FC draw, qualification and cross group seeding',()=>{
 let s=createTournament('fc',['a','b','c','d'],rules({format:'single',groups:[{id:'A',entries:['a','b']},{id:'B',entries:['c','d']}]}));
 assert.throws(()=>transition(s,{type:'qualify',ties:{}}),/Finish/);
 s=result(s,'GA.0.1',4,1);s=result(s,'GB.0.1',2,0);
 s=transition(s,{type:'qualify',ties:{}});
 const semis=s.matches.filter(m=>m.id.startsWith('U1'));
 assert.deepEqual(semis.map(m=>[m.a,m.b]),[['a','d'],['c','b']]);
 assert.equal(standings(s,'A')[0].points,3);
 assert.throws(()=>result(s,'GA.0.1',0,1),/Qualification/);
 const reset=result(s,'GA.0.1',0,1,true);assert.equal(reset.phase,'groups');assert.equal(reset.seeds.length,0);
});
test('tie resolution required even when both qualify; only tied ranks can move',()=>{
 let s=createTournament('fc',['a','b'],rules({format:'single',groups:[{id:'A',entries:['a','b']}]}));
 s=result(s,'GA.0.1',0,0);assert.equal(standings(s,'A')[0].draws,1);
 assert.throws(()=>transition(s,{type:'qualify',ties:{}}),/tied/);
 assert.throws(()=>transition(s,{type:'qualify',ties:{A:['b','b']}}),/every entry/);
 // A single group would immediately rematch, and requires a different configuration.
 assert.throws(()=>transition(s,{type:'qualify',ties:{A:['b','a']}}),/rematch/);
});
test('reject duplicate/missing group entries and unsupported configs',()=>{
 assert.throws(()=>createTournament('cs2',['a','a'],rules()),/unique/);
 assert.throws(()=>createTournament('cs2',['a','b','c'],rules({groups:[{id:'A',entries:['a','b']}]})),/exactly one/);
 assert.throws(()=>createTournament('cs2',['a','b'],rules({bestOf:7})),/rules/);
});
test('mixed wins and forfeits across every bracket size 2–64',()=>{
 let random=19321;
 for(let count=2;count<=64;count++) {
  let s=createTournament('dota2',Array.from({length:count},(_,i)=>`e${i}`),rules());
  let played=0;
  while(!s.champion) {
   const ready=s.matches.filter(m=>m.status==='ready');assert.ok(ready.length);
   random=(random*1664525+1013904223)>>>0;
   const m=ready[random%ready.length], side=(random>>>8)%2;assert.notEqual(m.a,m.b);
   s=transition(s,{type:'result',match:m.id,result:random%5===0?{kind:'forfeit',loser:side===0?m.b:m.a}:{kind:'played',a:side===0?1:0,b:side===0?0:1},invalidate:false,reason:'Seeded test'});
   assert.ok(++played<=2*count-1);
  }
  for(const e of s.entries) {
   const losses=s.matches.filter(m=>m.status==='finished'&&m.loser===e).length;
   assert.ok(e===s.champion?losses<2:losses===2);
  }
 }
});
