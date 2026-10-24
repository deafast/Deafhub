const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0'),tid=uuid(1),actor=uuid(2),entryIds=[uuid(3),uuid(4),uuid(5)];
function fixture({count=1205,cap=1000,guest=false,failTable=null,repeat=false,profile=false,empty=false}={}){
 const batches=empty?[]:Array.from({length:count},(_,i)=>({id:uuid(100+i),tournament_id:tid,status:i===count-1?'issued':'revoked',created_at:new Date(1792800000000+i*1000).toISOString()}));
 const awards=batches.flatMap((b,i)=>entryIds.map((entry_id,j)=>({id:uuid(10000+i*3+j),batch_id:b.id,entry_id,recipient_id:actor,place:j+1,created_at:b.created_at})));
 const calls=[],reads={};
 const client={auth:{getUser:async()=>({data:{user:guest?null:{id:actor}},error:null})},from:table=>{
  const f={table,orders:[],offset:0,size:1000};calls.push(f);
  const q={select(){return q;},eq(key,value){f.eq=[key,value];return q;},in(key,value){f.in=[key,value];return q;},order(key,options){f.orders.push([key,options?.ascending!==false]);return q;},limit(value){f.size=value;return q;},range(a,b){f.offset=a;f.size=b-a+1;return q;},maybeSingle:async()=>({data:null,error:null}),then(resolve,reject){return Promise.resolve().then(()=>{
   reads[table]=(reads[table]??0)+1;if(table===failTable&&reads[table]===2)return {data:null,error:{message:'PRIVATE AWARD READ ERROR'}};
   let rows=table==='hub_entries'?(empty?[]:entryIds.map(id=>({id,tournament_id:tid}))):table==='hub_award_batches'?batches:table==='hub_awards'?awards:[];
   if(f.eq)rows=rows.filter(row=>row[f.eq[0]]===f.eq[1]);if(f.in)rows=rows.filter(row=>f.in[1].includes(row[f.in[0]]));
   rows=[...rows].sort((a,b)=>{for(const [key,asc] of f.orders){const cmp=String(a[key]).localeCompare(String(b[key]));if(cmp)return asc?cmp:-cmp;}return 0;});
   const offset=repeat&&table==='hub_award_batches'?0:f.offset;return {data:rows.slice(offset,offset+Math.min(cap,f.size)),error:null};
  }).then(resolve,reject);}};return q;
 }};
 const scope={exports:{},require:name=>name==='next/server'?{NextResponse:{json:(value,options)=>Response.json(value,options)}}:name==='@/lib/supabase/server'?{createClient:async()=>client}:require(name)};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/api/tournament-operations/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,scope);
 return {calls,get:()=>scope.exports.GET({nextUrl:new URL('https://preview.example/api/tournament-operations?'+(profile?'profile=me':'id='+tid))})};
}
test('tournament award history includes 1205 batches and all 3615 snapshots',async()=>{const f=fixture(),r=await f.get();assert.equal(r.status,200);const body=await r.json();assert.equal(body.batches.length,1205);assert.equal(body.awards.length,3615);assert.equal(new Set(body.awards.map(a=>a.id)).size,3615);assert.equal(body.batches[0].status,'issued');assert.equal(body.batches.filter(b=>b.status==='revoked').length,1204);assert.ok(f.calls.filter(c=>c.table==='hub_award_batches').every(c=>c.eq[0]==='tournament_id'&&c.eq[1]===tid));assert.ok(f.calls.filter(c=>c.table==='hub_awards').every(c=>c.in[0]==='entry_id'&&c.in[1].length<=80));});
test('short REST pages keep all historical snapshots and deterministic batch order',async()=>{const r=await fixture({count:80,cap:37}).get();assert.equal(r.status,200);const body=await r.json();assert.equal(body.batches.length,80);assert.equal(body.awards.length,240);assert.ok(body.batches.every((b,i)=>!i||body.batches[i-1].created_at>=b.created_at));});
for(const table of ['hub_award_batches','hub_awards'])test(`late ${table} error does not return partial award history`,async()=>{const r=await fixture({failTable:table}).get();assert.equal(r.status,503);const body=await r.json();assert.equal(body.batches,undefined);assert.equal(body.awards,undefined);assert.doesNotMatch(JSON.stringify(body),/PRIVATE AWARD READ ERROR/);});
test('repeated batch pages fail without looping',async()=>{const f=fixture({count:5,repeat:true});assert.equal((await f.get()).status,503);assert.ok(f.calls.filter(c=>c.table==='hub_award_batches').length<5);});
test('award snapshots above the response bound fail explicitly',async()=>{const r=await fixture({count:1667}).get();assert.equal(r.status,503);assert.equal((await r.json()).awards,undefined);});
test('guest performs no reads; empty tournament does not load global awards',async()=>{const guest=fixture({guest:true});assert.equal((await guest.get()).status,401);assert.equal(guest.calls.length,0);const f=fixture({empty:true}),r=await f.get();assert.equal(r.status,200);const body=await r.json();assert.deepEqual(body.batches,[]);assert.deepEqual(body.awards,[]);assert.equal(f.calls.filter(c=>c.table==='hub_awards').length,0);});
test('profile keeps its separate 100-award recipient-scoped query',async()=>{const f=fixture({profile:true}),r=await f.get();assert.equal(r.status,200);assert.equal((await r.json()).awards.length,100);assert.equal(f.calls.length,1);assert.deepEqual(f.calls[0].eq,['recipient_id',actor]);assert.equal(f.calls[0].size,100);});
