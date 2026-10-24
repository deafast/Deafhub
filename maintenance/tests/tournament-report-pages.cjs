const {readFileSync}=require('node:fs');const vm=require('node:vm');const ts=require('typescript');const test=require('node:test');const assert=require('node:assert/strict');
const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');const tid=uuid(1),userId=uuid(2);
function fixture(count,maxRows=1000,{guest=false,failReportsAt=Infinity,repeat=false,failVotes=false}={}){
 const reports=Array.from({length:count},(_,i)=>({id:uuid(i+10),sequence:count-i,tournament_id:tid,match_id:'M'+i}));
 const votes=reports.flatMap(r=>[1,2].map(n=>({report_id:r.id,entry_id:uuid(n+9000),accepted:true})));
 const calls=[];let reportQueries=0;
 const client={auth:{getUser:async()=>({data:{user:guest?null:{id:userId}},error:null})},from:table=>{
  const f={table,eq:{},order:[],limit:1000,offset:0};calls.push(f);
  const q={select(){return q},eq(k,v){f.eq[k]=v;return q},order(k){f.order.push(k);return q},limit(v){f.limit=v;return q},lt(k,v){f.lt=[k,v];return q},in(k,v){f.in=[k,v];return q},range(a,b){f.offset=a;f.limit=b-a+1;return q},maybeSingle:async()=>({data:null,error:null}),then(resolve,reject){return Promise.resolve().then(()=>{
   if(table==='hub_current_result_reports'){
    reportQueries++;if(reportQueries>=failReportsAt)return {data:null,error:{message:'local fixture read failure'}};
    const rows=f.eq.tournament_id===tid?reports.filter(r=>repeat||!f.lt||r.sequence<f.lt[1]):[];return {data:rows.slice(0,Math.min(f.limit,maxRows)),error:null};
   }
   if(table==='hub_result_confirmations'){
    if(failVotes)return {data:null,error:{message:'local vote failure'}};
    const ids=f.in?.[1]||[];const rows=votes.filter(v=>ids.includes(v.report_id)).sort((a,b)=>a.report_id.localeCompare(b.report_id)||a.entry_id.localeCompare(b.entry_id));return {data:rows.slice(f.offset,f.offset+Math.min(f.limit,maxRows)),error:null};
   }
   return {data:[],error:null};
  }).then(resolve,reject)}};return q;
 }};
 const source=readFileSync('app/api/tournament-results/route.ts','utf8');const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const scope={exports:{},require:name=>name==='@/lib/request-body'?require('../test-support/request-body.cjs'):name==='next/server'?{NextResponse:{json:(v,init)=>Response.json(v,init)}}:name==='@/lib/supabase/server'?{createClient:async()=>client}:require(name)};vm.runInNewContext(code,scope);
 return {get:()=>scope.exports.GET({nextUrl:new URL('https://preview.example/api/tournament-results?id='+tid)}),calls};
}
test('report GET reads 1205 reports and 2410 votes beyond one REST response',async()=>{const f=fixture(1205);const r=await f.get();assert.equal(r.status,200);const d=await r.json();assert.equal(d.reports.length,1205);assert.equal(new Set(d.reports.map(x=>x.id)).size,1205);assert.equal(d.confirmations.length,2410);assert.ok(f.calls.filter(c=>c.table==='hub_current_result_reports').every(c=>c.eq.tournament_id===tid));assert.ok(f.calls.filter(c=>c.table==='hub_result_confirmations').every(c=>c.in[1].length<=80));});
test('pagination continues through short server-limited pages with no omissions',async()=>{const f=fixture(223,37);const r=await f.get();assert.equal(r.status,200);const d=await r.json();assert.equal(d.reports.length,223);assert.equal(d.confirmations.length,446);assert.equal(new Set(d.confirmations.map(v=>v.report_id+'/'+v.entry_id)).size,446);});
test('later report failure returns 503 and never claims a partial list is complete',async()=>{const r=await fixture(250,1000,{failReportsAt:2}).get();assert.equal(r.status,503);assert.equal((await r.json()).reports,undefined);});
test('vote failure returns 503 without exposing partial reports',async()=>{const r=await fixture(2,1000,{failVotes:true}).get();assert.equal(r.status,503);assert.equal((await r.json()).reports,undefined);});
test('non-progressing report cursor fails instead of looping',async()=>{const f=fixture(2,1000,{repeat:true});assert.equal((await f.get()).status,503);assert.ok(f.calls.length<15);});
test('response bound returns explicit error rather than truncating a large graph',async()=>{assert.equal((await fixture(4097).get()).status,503);});
test('guest makes no data queries; empty authenticated tournament returns empty arrays',async()=>{const guest=fixture(5,1000,{guest:true});assert.equal((await guest.get()).status,401);assert.equal(guest.calls.length,0);const r=await fixture(0).get();assert.equal(r.status,200);const d=await r.json();assert.deepEqual(d.reports,[]);assert.deepEqual(d.confirmations,[]);assert.match(r.headers.get('cache-control'),/no-store/);});
