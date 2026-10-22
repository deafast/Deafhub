const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const test=require('node:test');
const assert=require('node:assert/strict');
const {NextRequest,NextResponse}=require('next/server');

function load(file,imports={},env={}){
 const compiled=ts.transpileModule(readFileSync(resolve(__dirname,'../..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const scope={exports:{},URL,URLSearchParams,Buffer,AbortSignal,fetch,process:{env},require:name=>Object.hasOwn(imports,name)?imports[name]:require(name)};
 vm.runInNewContext(compiled,scope);return scope.exports;
}
const openid=load('lib/steam/openid.ts');
const link=load('lib/steam/link.ts');
const origin='https://deafhub-git-preview-deafhub-setup-ionas-projects-019510f8.vercel.app';
const id='76561198000000001';
const state='test-only-state';
for(const user of [null,{id:'hub-user'}])test(`login callback uses the initiating Preview origin and secure session-bound cookies: ${user?'link':'native'}`,async()=>{
 const route=load('app/auth/steam/route.ts',{'next/server':{NextResponse},'@/lib/steam/openid':openid,'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user}})}})}},{SUPABASE_SERVICE_ROLE_KEY:'test-only-service-credential'});
 const response=await route.GET(new NextRequest(origin+'/auth/steam'));
 const destination=new URL(response.headers.get('location'));const callback=new URL(destination.searchParams.get('openid.return_to'));
 assert.equal(destination.origin+destination.pathname,openid.STEAM_ENDPOINT);assert.equal(destination.searchParams.get('openid.realm'),origin);
 assert.equal(callback.origin,origin);assert.equal(callback.pathname,'/auth/steam/callback');assert.match(callback.searchParams.get('state'),/^[a-f0-9]{64}$/);
 const cookie=response.cookies.get('dh-steam-state');assert.equal(cookie.value,callback.searchParams.get('state'));assert.equal(cookie.httpOnly,true);assert.equal(cookie.secure,true);assert.equal(cookie.sameSite,'lax');assert.equal(cookie.path,'/auth/steam');
 assert.equal(response.cookies.get('dh-steam-user').value,user?.id||'new');assert.equal(response.headers.get('cache-control'),'private, no-store');
});
test('missing server Auth configuration returns 503 without starting Steam or creating cookies',async()=>{
 const route=load('app/auth/steam/route.ts',{'next/server':{NextResponse},'@/lib/steam/openid':openid,'@/lib/supabase/server':{createClient:async()=>{throw Error('must not access auth');}}});
 const response=await route.GET(new NextRequest(origin+'/auth/steam'));assert.equal(response.status,503);assert.equal(response.cookies.getAll().length,0);
});
function assertion(){
 return new URLSearchParams({state,'openid.ns':'http://specs.openid.net/auth/2.0','openid.mode':'id_res','openid.op_endpoint':openid.STEAM_ENDPOINT,'openid.return_to':`${origin}/auth/steam/callback?state=${state}`,'openid.claimed_id':`https://steamcommunity.com/openid/id/${id}`,'openid.identity':`https://steamcommunity.com/openid/id/${id}`,'openid.response_nonce':new Date().toISOString().replace(/\.\d{3}Z/,'Z')+'test','openid.assoc_handle':'test','openid.sig':'test','openid.signed':'op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle'});
}
function fixture(options={}){
 const calls={provider:0,nonces:[],claims:[],created:0,deleted:[],generated:[],otp:[]};
 const current=options.current===undefined?{id:'hub-user'}:options.current;
 const admin={
  from(table){
   if(table==='steam_nonces')return {insert:async row=>{calls.nonces.push(row);return {error:options.replay?{code:'23505'}:null};}};
   assert.equal(table,'steam_accounts');
   return {
    select:()=>({eq:(column,value)=>{assert.equal(column,'steam_id');assert.equal(value,id);return {maybeSingle:async()=>({data:options.owner?{user_id:options.owner}:null,error:options.lookupError?{code:'private-db-detail'}:null})};}}),
    insert:async row=>{calls.claims.push(row);return {error:options.claimConflict?{code:'23505'}:null};},
   };
  },
  auth:{admin:{
   createUser:async value=>{calls.created++;assert.equal(value.email,`${id}@steam.deafhub.invalid`);assert.equal(value.email_confirm,true);assert.equal(value.app_metadata.steam_id,id);return {data:{user:{id:'new-user'}},error:null};},
   deleteUser:async userId=>{calls.deleted.push(userId);return {error:null};},
   getUserById:async userId=>{assert.equal(userId,options.owner||'new-user');return {data:{user:{email:'internal-account@example.invalid'}},error:null};},
   generateLink:async value=>{calls.generated.push(value);return {data:{properties:{hashed_token:'test-only-session-token'}},error:null};},
  }},
 };
 const client={auth:{getUser:async()=>({data:{user:current},error:null}),verifyOtp:async value=>{calls.otp.push(value);return {error:options.sessionError?{message:'private-session-error'}:null};}}};
 const provider=async(url,init)=>{
  calls.provider++;assert.equal(url,openid.STEAM_ENDPOINT);assert.equal(init.method,'POST');assert.equal(init.body.get('openid.mode'),'check_authentication');
  if(options.providerError)throw Error('private-provider-error');
  return new Response(options.valid===false?'is_valid:false\n':'is_valid:true\n',{status:options.providerStatus||200});
 };
 const route=load('app/auth/steam/callback/route.ts',{
  'next/server':{NextResponse},'@/lib/supabase/admin':{createAdminClient:()=>options.unconfigured?null:admin},'@/lib/supabase/server':{createClient:async()=>client},
  '@/lib/steam/openid':{...openid,verifySteam:(params,returnTo)=>openid.verifySteam(params,returnTo,provider)},'@/lib/steam/link':link,
 });
 async function run(params=assertion(),cookies={state,user:current?.id||'new'}){
  const request=new NextRequest(`${origin}/auth/steam/callback?${params}`,{headers:{cookie:`dh-steam-state=${cookies.state||''}; dh-steam-user=${cookies.user||''}`}});
  const result=await route.GET(request);
  assert.equal(result.headers.get('cache-control'),'private, no-store');assert.equal(result.headers.get('referrer-policy'),'no-referrer');
  for(const name of ['dh-steam-state','dh-steam-user'])assert.equal(result.cookies.get(name).value,'');
  assert.ok(!result.headers.get('location').includes('test-only-session-token'));
  return new URL(result.headers.get('location'));
 }
 return {calls,run};
}
test('verified assertion links only the current DEAF|HUB account without a Web API key',async()=>{
 const f=fixture();assert.equal((await f.run()).pathname,'/auth/complete');assert.equal(f.calls.provider,1);
 assert.deepEqual(f.calls.claims.map(row=>({...row})),[{steam_id:id,user_id:'hub-user'}]);
 assert.equal(f.calls.created,0);assert.equal(f.calls.generated.length,0);
 assert.match(f.calls.nonces[0].nonce_hash,/^[0-9a-f]{64}$/);assert.equal(Object.keys(f.calls.nonces[0]).join(','),'nonce_hash');
});
test('native Steam sign-in creates the server-owned link and establishes a session internally',async()=>{
 const f=fixture({current:null});assert.equal((await f.run()).pathname,'/auth/complete');assert.equal(f.calls.created,1);
 assert.equal(f.calls.claims[0].user_id,'new-user');assert.equal(f.calls.generated.length,1);assert.equal(f.calls.otp[0].token_hash,'test-only-session-token');
});
test('returning Steam user signs into the linked account without creating or relinking',async()=>{
 const f=fixture({current:null,owner:'existing-owner'});assert.equal((await f.run()).pathname,'/auth/complete');
 assert.equal(f.calls.created,0);assert.equal(f.calls.claims.length,0);assert.equal(f.calls.otp.length,1);
});
for(const kind of ['missing-state','wrong-state','duplicate','forged-id','wrong-return','cancel'])test(`forged or unsuccessful callback fails before account access: ${kind}`,async()=>{
 const f=fixture();const params=assertion();const cookies={state,user:'hub-user'};
 if(kind==='missing-state')params.delete('state');
 if(kind==='wrong-state')cookies.state='different-state';
 if(kind==='duplicate')params.append('openid.identity',params.get('openid.identity'));
 if(kind==='forged-id')params.set('openid.claimed_id','https://attacker.invalid/openid/id/'+id);
 if(kind==='wrong-return')params.set('openid.return_to','https://attacker.invalid/auth/steam/callback');
 if(kind==='cancel')params.set('openid.mode','cancel');
 assert.equal((await f.run(params,cookies)).search,'?error=steam');
 assert.equal(f.calls.provider,0);assert.equal(f.calls.nonces.length,0);assert.equal(f.calls.claims.length,0);assert.equal(f.calls.otp.length,0);
});
for(const options of [{valid:false},{providerStatus:503},{providerError:true}])test(`Steam verification rejection or outage cannot establish a session ${JSON.stringify(options)}`,async()=>{
 const f=fixture(options);assert.equal((await f.run()).search,'?error=steam');assert.equal(f.calls.nonces.length,0);assert.equal(f.calls.otp.length,0);
});
for(const [name,options,cookies] of [
 ['nonce already used',{replay:true},undefined],
 ['changed signed-in account',{}, {state,user:'another-hub-user'}],
 ['guest flow became signed-in',{}, {state,user:'new'}],
 ['missing session binding',{}, {state,user:''}],
 ['SteamID belongs to another account',{owner:'other-owner'},undefined],
 ['second SteamID uniqueness conflict',{claimConflict:true},undefined],
 ['owner lookup unavailable',{lookupError:true},undefined],
 ['server not configured',{unconfigured:true},undefined],
])test(`callback rejects ${name}`,async()=>{
 const f=fixture(options);assert.equal((await f.run(assertion(),cookies)).search,'?error=steam');assert.equal(f.calls.otp.length,0);
});
test('an idempotent repeat of the same account pair does not transfer ownership',async()=>{
 const f=fixture({owner:'hub-user',claimConflict:true});assert.equal((await f.run()).pathname,'/auth/complete');assert.equal(f.calls.otp.length,0);
});
test('new-account insert conflict cleans up only its newly created user',async()=>{
 const f=fixture({current:null,claimConflict:true});assert.equal((await f.run()).search,'?error=steam');assert.deepEqual(f.calls.deleted,['new-user']);assert.equal(f.calls.otp.length,0);
});
test('failed session verification never redirects to successful completion',async()=>{
 const f=fixture({current:null,owner:'existing-owner',sessionError:true});assert.equal((await f.run()).search,'?error=steam');
});
