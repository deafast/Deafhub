const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0'),tid=uuid(1),actor=uuid(2);
function fixture({count=2000,rosterSize=10,cap=1000,guest=false,failTable=null,repeat=false,empty=false}={}){
 const entries=empty?[]:Array.from({length:Math.ceil(count/rosterSize)},(_,i)=>({id:uuid(100+i)}));
 const players=entries.flatMap((entry,i)=>Array.from({length:rosterSize},(_,j)=>({entry_id:entry.id,user_id:uuid(10000+i*rosterSize+j),nickname:'Registered player'}))).slice(0,count);
 const attestations=players.map((p,i)=>({...p,accepted:true,policy_version:i%3?uuid(3):uuid(4)}));
 const reviews=entries.map(entry=>({entry_id:entry.id,policy_version:uuid(3),approved:true,reason:'Verified criteria'}));
 const calls=[],reads={};
 const client={auth:{getUser:async()=>({data:{user:guest?null:{id:actor}},error:null})},from:table=>{
  const f={table,orders:[],offset:0,size:1000};calls.push(f);
  const q={select(){return q;},eq(key,value){f.eq=[key,value];return q;},in(key,value){f.in=[key,value];return q;},order(key){f.orders.push(key);return q;},limit(value){f.size=value;return q;},range(a,b){f.offset=a;f.size=b-a+1;return q;},maybeSingle:async()=>({data:{version:uuid(3)},error:null}),then(resolve,reject){return Promise.resolve().then(()=>{
   reads[table]=(reads[table]??0)+1;if(table===failTable&&reads[table]===2)return {data:null,error:{message:'PRIVATE READ DETAIL'}};
   let rows=table==='hub_entries'?entries:table==='hub_entry_players'?players:table==='hub_entry_attestations'?attestations:table==='hub_eligibility_reviews'?reviews:[];
   if(f.in)rows=rows.filter(row=>f.in[1].includes(row.entry_id));
   if(f.eq&&table==='hub_entries'&&f.eq[1]!==tid)rows=[];
   const offset=repeat&&table==='hub_entry_attestations'?0:f.offset;
   return {data:rows.slice(offset,offset+Math.min(cap,f.size)),error:null};
  }).then(resolve,reject);}};return q;
 }};
 const scope={exports:{},require:name=>name==='@/lib/request-body'?require('../test-support/request-body.cjs'):name==='next/server'?{NextResponse:{json:(value,options)=>Response.json(value,options)}}:name==='@/lib/supabase/server'?{createClient:async()=>client}:require(name)};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/api/tournament-operations/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,scope);
 return {calls,get:()=>scope.exports.GET({nextUrl:new URL('https://preview.example/api/tournament-operations?id='+tid)})};
}
test('organizer receives all 2000 registered players and confirmations before admission selection',async()=>{
 const f=fixture(),response=await f.get();assert.equal(response.status,200);const body=await response.json();assert.equal(body.players.length,2000);assert.equal(body.attestations.length,2000);assert.equal(new Set(body.attestations.map(a=>a.entry_id+'/'+a.user_id)).size,2000);assert.equal(body.attestations.filter(a=>a.policy_version===uuid(3)).length,1333);
 assert.ok(f.calls.filter(c=>['hub_entry_players','hub_entry_attestations'].includes(c.table)).every(c=>c.in?.[0]==='entry_id'&&c.in[1].length<=80&&c.orders.join(',')==='entry_id,user_id'));assert.match(response.headers.get('cache-control'),/no-store/);
});
test('short server-limited pages preserve every player and confirmation',async()=>{const response=await fixture({cap:37}).get();assert.equal(response.status,200);const body=await response.json();assert.equal(body.players.length,2000);assert.equal(body.attestations.length,2000);});
for(const table of ['hub_entries','hub_entry_players','hub_entry_attestations','hub_eligibility_reviews'])test(`late ${table} failure returns no partial successful panel`,async()=>{const response=await fixture({failTable:table}).get();assert.equal(response.status,503);const body=await response.json();assert.equal(body.players,undefined);assert.equal(body.attestations,undefined);assert.doesNotMatch(JSON.stringify(body),/PRIVATE READ DETAIL/);});
test('entry selection and reviews are complete beyond the first 1000 submitted entries',async()=>{const response=await fixture({count:1205,rosterSize:1}).get();assert.equal(response.status,200);const body=await response.json();assert.equal(body.players.length,1205);assert.equal(body.attestations.length,1205);assert.equal(body.reviews.length,1205);});
test('operation graph above 5000 player rows is rejected without a partial successful response',async()=>{const response=await fixture({count:5001}).get();assert.equal(response.status,503);assert.equal((await response.json()).players,undefined);});
test('non-progressing confirmation pages fail within a bounded number of reads',async()=>{const f=fixture({repeat:true}),response=await f.get();assert.equal(response.status,503);assert.ok(f.calls.filter(c=>c.table==='hub_entry_attestations').length<5);});
test('guest performs no reads and an event without entries requests no global player data',async()=>{
 const guest=fixture({guest:true});assert.equal((await guest.get()).status,401);assert.equal(guest.calls.length,0);
 const f=fixture({empty:true}),response=await f.get();assert.equal(response.status,200);const body=await response.json();assert.deepEqual(body.players,[]);assert.deepEqual(body.attestations,[]);assert.equal(f.calls.filter(c=>['hub_entry_players','hub_entry_attestations'].includes(c.table)).length,0);
});
