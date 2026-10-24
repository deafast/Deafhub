const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const test=require('node:test');
const assert=require('node:assert/strict');
const {NextRequest}=require('next/server');

const origin='https://preview.example',id='00000000-0000-4000-8000-000000000001';
function load(file,imports={}){
 const code=ts.transpileModule(readFileSync(resolve(__dirname,'../..',file),'utf8'),{
  fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 }).outputText;
 const scope={exports:{},require:name=>name==='@/lib/request-body'?require('../test-support/request-body.cjs'):imports[name]||require(name)};
 vm.runInNewContext(code,scope);return scope.exports;
}
const routes=[
 ['tournament-admission',8000,'POST',{tournament_id:id,enabled:true,reason:'Reviewed rules'}],
 ['tournament-checkin',10000,'POST',{action:'check_in',entry_id:id,window_version:id,ready:true}],
 ['tournament-results',12000,'POST',{action:'configure',tournament_id:id,required:true}],
 ['tournament-engine',100000,'POST',{tournament_id:id,revision:1,request_id:id,command:{type:'schedule',match:'U1.0',scheduledAt:null,reason:'Updated time'}}],
 ['hub',100000,'POST',{action:'create_team',name:'QA team',game:'cs2'}],
 ['tournament-operations',50000,'POST',{action:'issue_awards',tournament_id:id}],
 ['profile',4000,'PUT',{nickname:'QA Player',region:'europe',telegram:'',vk:''}],
];
function fixture(name,method,{guest=false,unavailable=false}={}){
 const writes=[];let authReads=0;
 const client={auth:{getUser:async()=>{authReads++;return {data:{user:guest?null:{id}},error:null};}},
  rpc:async(rpc,args)=>{writes.push({rpc,args});return {data:{saved:true},error:null};},
  from:table=>({select(){return this;},eq(){return this;},maybeSingle:async()=>({error:null,data:table==='hub_tournaments'?{organizer_id:id,game:'cs2'}:table==='hub_organizers'?{user_id:id}:table==='hub_engines'?{revision:1,state:{}}:null}),upsert:async row=>{writes.push({row});return {error:null};}}),
 };
 const handler=load('app/api/'+name+'/route.ts',{
  '@/lib/supabase/server':{createClient:async()=>unavailable?null:client},
  '@/lib/supabase/admin':{createAdminClient:()=>client},
  '@/lib/profile':load('lib/profile.ts'),
  '@/lib/tournament/engine':{transition:()=>({matches:[]})},
  '@/lib/tournament/fc-groups':{},
 })[method];
 return {handler,writes,authReads:()=>authReads};
}
function request(name,method,chunks,{length,foreign=false}={}){
 let pulls=0,cancelled=false;
 const body=new ReadableStream({pull(controller){if(pulls===chunks.length){controller.close();return;}controller.enqueue(chunks[pulls++]);},cancel(){cancelled=true;}},{highWaterMark:0});
 const headers={origin:foreign?'https://foreign.example':origin};
 if(length!==undefined)headers['content-length']=String(length);
 const req=new NextRequest(origin+'/api/'+name,{method,headers,body,duplex:'half'});
 return {req,pulls:()=>pulls,cancelled:()=>cancelled};
}
const bytes=value=>new TextEncoder().encode(value);
for(const [name,limit,method,payload] of routes){
 for(const length of [undefined,1])test(`${name} bounds actual stream without a trustworthy Content-Length (${length})`,async()=>{
  const f=fixture(name,method),r=request(name,method,[bytes('{"padding":"'),bytes('x'.repeat(limit)),bytes('"}')],{length});
  const response=await f.handler(r.req);
  assert.equal(response.status,413);assert.equal((await response.json()).error,'Request too large');
  assert.equal(f.writes.length,0);assert.equal(r.pulls(),2);assert.equal(r.cancelled(),true);
 });
 test(`${name} rejects declared overflow before auth or body consumption`,async()=>{
  const f=fixture(name,method),r=request(name,method,[bytes('{}')],{length:limit+1});
  assert.equal((await f.handler(r.req)).status,413);assert.equal(f.authReads(),0);assert.equal(r.pulls(),0);assert.equal(f.writes.length,0);
 });
 test(`${name} keeps origin, availability and auth checks ahead of stream consumption`,async()=>{
  for(const [options,status,foreign] of [[{},403,true],[{guest:true},401,false],[{unavailable:true},503,false]]){
   const f=fixture(name,method,options),r=request(name,method,[bytes('x'.repeat(limit+1))],{foreign});
   assert.equal((await f.handler(r.req)).status,status);assert.equal(r.pulls(),0);assert.equal(f.writes.length,0);
  }
 });
 test(`${name} preserves valid small requests and rejects malformed or empty JSON`,async()=>{
  const f=fixture(name,method),r=request(name,method,[bytes(JSON.stringify(payload))]);
  assert.equal((await f.handler(r.req)).status,200);assert.equal(f.writes.length,1);
  for(const chunks of [[bytes('{"broken":')],[]]){
   assert.equal((await f.handler(request(name,method,chunks).req)).status,400);
   assert.equal(f.writes.length,1);
  }
 });
}
test('new body limits fit the largest escaped policy and tournament rules',async()=>{
 const examples=[
  ['hub','POST',{action:'create_tournament',title:'QA tournament',game:'cs2',starts_at:'2026-11-01T18:00:00Z',rules:'\u0000'.repeat(12000),roster_size:5}],
  ['tournament-operations','POST',{action:'set_policy',tournament_id:id,body:'\u0000'.repeat(6000),require_acceptance:true,bronze:'none'}],
  ['profile','PUT',{nickname:'界'.repeat(30),region:'europe',telegram:'a'.repeat(32),vk:'v'.repeat(64)}],
 ];
 for(const [name,method,payload] of examples){
  const f=fixture(name,method),r=request(name,method,[bytes(JSON.stringify(payload))]);
  assert.equal((await f.handler(r.req)).status,200,name);assert.equal(f.writes.length,1);
 }
});
