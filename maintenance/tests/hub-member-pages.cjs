const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0'),tid=uuid(1),team=uuid(2);
function fixture(count,{cap=1000,guest=false,failAt=Infinity,repeat=false,selected=false,emptySelected=false}={}){
 const members=Array.from({length:count},(_,i)=>({team_id:uuid(2+Math.floor(i/10)),user_id:uuid(10000+i),nickname:'Player '+i}));
 const calls=[];let memberQueries=0;
 const client={auth:{getUser:async()=>({data:{user:guest?null:{id:uuid(9000)}},error:null})},from:table=>{
  const f={table,orders:[],offset:0,size:1000};calls.push(f);
  const q={select(){return q;},order(key){f.orders.push(key);return q;},eq(key,value){f.eq=[key,value];return q;},in(key,value){f.in=[key,value];return q;},limit(value){f.size=value;return q;},range(a,b){f.offset=a;f.size=b-a+1;return q;},maybeSingle:async()=>({data:null,error:null}),then(resolve,reject){
   return Promise.resolve().then(()=>{
    if(table==='hub_members'){
     if(++memberQueries>=failAt)return {data:null,error:{message:'PRIVATE DATABASE DETAIL'}};
     const rows=f.in?members.filter(m=>f.in[1].includes(m.team_id)):members;
     const offset=repeat?0:f.offset;return {data:rows.slice(offset,offset+Math.min(f.size,cap)),error:null};
    }
    return {data:table==='hub_entries'&&selected&&!emptySelected?[{id:uuid(3),team_id:team,tournament_id:tid}]:[],error:null};
   }).then(resolve,reject);
  }};return q;
 }};
 const scope={exports:{},require:name=>name==='@/lib/request-body'?require('../test-support/request-body.cjs'):name==='next/server'?{NextResponse:{json:(value,init)=>Response.json(value,init)}}:name==='@/lib/supabase/server'?{createClient:async()=>client}:require(name)};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/api/hub/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,scope);
 return {calls,get:()=>scope.exports.GET({nextUrl:new URL('https://preview.example/api/hub'+(selected?'?tournament='+tid:''))})};
}
test('catalog reads 2000 roster memberships beyond a server response cap with stable ordering',async()=>{
 const f=fixture(2000),response=await f.get();assert.equal(response.status,200);const body=await response.json();assert.equal(body.members.length,2000);assert.equal(new Set(body.members.map(m=>m.team_id+'/'+m.user_id)).size,2000);assert.ok(f.calls.filter(c=>c.table==='hub_members').every(c=>c.orders.join(',')==='team_id,user_id'));assert.match(response.headers.get('cache-control'),/no-store/);
});
test('short membership pages do not truncate remaining rosters',async()=>{const response=await fixture(223,{cap:37}).get();assert.equal(response.status,200);assert.equal((await response.json()).members.length,223);});
test('selected history tournament keeps its team filter on every membership page',async()=>{const f=fixture(200,{cap:3,selected:true});const response=await f.get();assert.equal(response.status,200);const rows=(await response.json()).members;assert.equal(rows.length,10);assert.ok(rows.every(m=>m.team_id===team));assert.ok(f.calls.filter(c=>c.table==='hub_members').every(c=>c.in?.[0]==='team_id'&&c.in[1].length===1&&c.in[1][0]===team));});
test('empty selected tournament does not request global memberships',async()=>{const f=fixture(200,{selected:true,emptySelected:true}),response=await f.get();assert.equal(response.status,200);assert.deepEqual((await response.json()).members,[]);assert.equal(f.calls.filter(c=>c.table==='hub_members').length,0);});
test('later membership read failure never returns a partial successful catalog',async()=>{const response=await fixture(250,{cap:100,failAt:2}).get();assert.equal(response.status,503);const body=await response.json();assert.equal(body.members,undefined);assert.ok(!JSON.stringify(body).includes('PRIVATE DATABASE DETAIL'));});
test('repeated membership pages fail rather than looping or duplicating rosters',async()=>{const f=fixture(10,{repeat:true}),response=await f.get();assert.equal(response.status,503);assert.ok(f.calls.filter(c=>c.table==='hub_members').length<5);});
test('more than the catalog membership bound is an explicit error instead of silent truncation',async()=>{assert.equal((await fixture(5001).get()).status,503);});
test('guest has no data queries and an empty authorized catalog has no memberships',async()=>{const guest=fixture(200,{guest:true});assert.equal((await guest.get()).status,401);assert.equal(guest.calls.length,0);const response=await fixture(0).get();assert.equal(response.status,200);assert.deepEqual((await response.json()).members,[]);});
