import test from 'node:test';
import assert from 'node:assert/strict';
import {readMatchResult} from './result-form.ts';
function values(data){const form=new FormData();for(const [key,value] of Object.entries(data))form.set(key,String(value));return form;}
test('empty shootout fields never invent a 0:0 shootout',()=>{
 assert.deepEqual(readMatchResult(values({a:3,b:2,penalties_a:'',penalties_b:''})),{kind:'played',a:3,b:2});
});
test('a missing penalty score cannot silently become zero',()=>{
 for(const data of [{penalties_a:5},{penalties_b:4},{penalties_a:5,penalties_b:''}])assert.throws(()=>readMatchResult(values({a:2,b:2,...data})),/both/);
});
test('explicit shootout scores remain separate from match goals',()=>{
 assert.deepEqual(readMatchResult(values({a:2,b:2,penalties_a:4,penalties_b:5})),{kind:'played',a:2,b:2,penalties:{a:4,b:5}});
});
test('forfeit does not invent goals or penalties',()=>{
 assert.deepEqual(readMatchResult(values({forfeit:'entry',a:0,b:0,penalties_a:5})),{kind:'forfeit',loser:'entry'});
});
test('missing or cleared match scores cannot become real zero scores',()=>{
 for(const data of [{},{a:1},{b:0},{a:'',b:2},{a:2,b:''},{a:'  ',b:0}])assert.throws(()=>readMatchResult(values(data)),/Invalid score/);
});
test('explicit zero scores remain valid',()=>{
 assert.deepEqual(readMatchResult(values({a:'0',b:'1'})),{kind:'played',a:0,b:1});
});
test('score parsing rejects non-integer, negative, oversized and non-numeric input',()=>{
 for(const value of ['-1','1.5','1001','NaN','Infinity','not a score'])for(const side of ['a','b'])assert.throws(()=>readMatchResult(values({a:1,b:0,[side]:value})),/Invalid score/);
});
test('whitespace-only optional penalties are absent',()=>{
 assert.deepEqual(readMatchResult(values({a:2,b:1,penalties_a:' ',penalties_b:'  '})),{kind:'played',a:2,b:1});
});
test('invalid complete penalty scores are rejected before submission',()=>{
 for(const value of ['-1','1.5','1001','NaN','Infinity','invalid'])assert.throws(()=>readMatchResult(values({a:2,b:2,penalties_a:value,penalties_b:3})),/Invalid penalty shootout/);
});
test('forfeit does not require or parse score fields',()=>{
 assert.deepEqual(readMatchResult(values({forfeit:'entry',a:'',b:'invalid'})),{kind:'forfeit',loser:'entry'});
});
