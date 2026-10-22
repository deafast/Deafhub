const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const test=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript');
const vm=require('node:vm');
function load(file,imports={},env={}){
 const source=readFileSync(resolve(__dirname,'../..',file),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;
 const scope={exports:{},URL,AbortSignal,fetch,Response,process:{env},require:name=>imports[name]||require(name)};
 vm.runInNewContext(compiled,scope);return scope.exports;
}
const sharedProfile=load('lib/steam/profile.ts');
const profile={...sharedProfile,...load('lib/steam/profile.server.ts',{'server-only':{},'./profile':sharedProfile})};
const id='76561198000000001';
const player={steamid:id,communityvisibilitystate:3,personaname:' Player ',avatarfull:'https://avatars.steamstatic.com/example_full.jpg',realname:'PRIVATE',loccountrycode:'XX'};
const response=p=>async()=>Response.json({response:{players:p}});
test('missing key and invalid ID never call Steam',async()=>{
 let calls=0;const send=async()=>{calls++;throw Error('must not fetch')};
 assert.equal((await profile.getSteamPublicProfile(id,undefined,send)).status,'unconfigured');
 assert.equal((await profile.getSteamPublicProfile('https://evil.test','secret',send)).status,'unavailable');assert.equal(calls,0);
});
test('official endpoint, exact requested SteamID and minimal public fields',async()=>{
 const data=await profile.getSteamPublicProfile(id,'secret',async(url,options)=>{
 assert.equal(url.origin,'https://api.steampowered.com');assert.equal(url.pathname,'/ISteamUser/GetPlayerSummaries/v2/');assert.equal(url.searchParams.get('steamids'),id);assert.equal(options.cache,'no-store');assert.equal(options.redirect,'error');return response([player])();
 });
 assert.equal(data.status,'available');assert.equal(data.profile.name,'Player');assert.equal(data.profile.url,'https://steamcommunity.com/profiles/'+id);
 assert.ok(!JSON.stringify(data).includes('PRIVATE'));assert.ok(!JSON.stringify(data).includes('secret'));assert.ok(!JSON.stringify(data).includes('loccountrycode'));assert.ok(Number.isFinite(Date.parse(data.checkedAt)));
});

test('Web API credential is sent only in a header, never in the request URL',async()=>{
 const credential='test-only-api-credential';
 let request;
 const data=await profile.getSteamPublicProfile(id,credential,async(url,options)=>{
  request={url,options};
  return response([player])();
 });
 assert.equal(data.status,'available');
 assert.equal(request.url.searchParams.has('key'),false);
 assert.ok(!request.url.href.includes(credential));
 assert.equal(new Headers(request.options.headers).get('x-webapi-key'),credential);
});

test('current Steam Fastly avatar host is supported while lookalike hosts remain blocked',async()=>{
 const avatarfull='https://avatars.fastly.steamstatic.com/test_full.jpg';
 const data=await profile.getSteamPublicProfile(id,'test-only-api-credential',response([{...player,avatarfull}]));
 assert.equal(data.status,'available');assert.equal(data.profile.avatar,avatarfull);
 const other=await profile.getSteamPublicProfile(id,'test-only-api-credential',response([{...player,avatarfull:'https://avatars.fastly.steamstatic.com.attacker.invalid/test.jpg'}]));
 assert.equal(other.profile.avatar,null);
});

test('empty or whitespace-only credential is unconfigured without any external request',async()=>{
 for(const key of ['', '  \n'])assert.equal((await profile.getSteamPublicProfile(id,key,async()=>{throw Error('must not fetch');})).status,'unconfigured');
});
test('private profile does not expose name avatar or other fields',async()=>{
 const data=await profile.getSteamPublicProfile(id,'secret',response([{...player,communityvisibilitystate:1}]));assert.equal(JSON.stringify(data),'{"status":"private"}');
});
test('different SteamID, malformed payload, HTTP errors and timeouts fail closed',async()=>{
 for(const send of [response([{...player,steamid:'76561198000000002'}]),async()=>Response.json({response:{players:{}}}),async()=>new Response('',{status:403}),async()=>{throw Error('secret timeout')}])assert.equal((await profile.getSteamPublicProfile(id,'secret',send)).status,'unavailable');
});
test('untrusted avatar URLs never reach image markup; invalid avatar keeps public name',async()=>{
 for(const avatarfull of ['https://evil.test/a.jpg','http://avatars.steamstatic.com/a.jpg','https://avatars.steamstatic.com.evil.test/a','https://user:pass@avatars.steamstatic.com/a','not a url','javascript:alert(1)']){
 const data=await profile.getSteamPublicProfile(id,'secret',response([{...player,avatarfull}]));assert.equal(data.status,'available');assert.equal(data.profile.avatar,null);
 }
});
const {claimSteamAccount}=load('lib/steam/link.ts');
test('simultaneous owners cannot transfer a Steam link',async()=>{
 let owner=null;const store={insert:async(_,user)=>{if(owner)return {error:{code:'23505'}};owner=user;return {error:null}},owner:async()=>({userId:owner,error:null})};
 const result=await Promise.allSettled([claimSteamAccount(id,'first',store),claimSteamAccount(id,'second',store)]);
 assert.equal(owner,'first');assert.equal(result[0].status,'fulfilled');assert.equal(result[1].status,'rejected');
 await claimSteamAccount(id,'first',store);assert.equal(owner,'first');
});
test('duplicate other SteamID and failed owner lookup are rejected',async()=>{
 for(const result of [{userId:null,error:null},{userId:'other',error:null},{userId:'me',error:{code:'network'}}])await assert.rejects(()=>claimSteamAccount(id,'me',{insert:async()=>({error:{code:'23505'}}),owner:async()=>result}));
 await assert.rejects(()=>claimSteamAccount(id,'me',{insert:async()=>({error:{code:'500'}}),owner:async()=>{throw Error('must not read')}}));
});
const history=load('lib/hub-history.ts');
const match=(mid,entry,status='finished',date='2026-10-19T10:00:00Z')=>({id:mid,tournament_id:'t',entry_a:entry,entry_b:'other',status,starts_at:date,score_a:1,score_b:0});
test('history contains only completed own roster snapshots, sorted without mutating input',()=>{
 const input=[match('old','registered','finished','2026-10-18T10:00:00Z'),match('new','registered'),match('future','registered','scheduled'),match('foreign','not-mine'),match('bad','registered','finished','')];
 const output=history.ownMatchHistory(input,['registered']);assert.equal(output.map(x=>x.id).join(','),'new,old,bad');assert.equal(input[0].id,'old');assert.equal(history.ownMatchHistory(input,[]).length,0);
});
test('engine tournament start is not represented as match completion; invalid dates localized',()=>{
 for(const ru of [true,false]){assert.match(history.matchDateLabel({...match('m','a'),engine_match:true},ru),ru?/Начало турнира:/:/Tournament start:/);assert.match(history.matchDateLabel(match('m','a','finished','invalid'),ru),ru?/Дата не указана/:/Date unavailable/);}
});
let user=null,link=null,dbError=null,calls=0;
const route=load('app/api/steam-profile/route.ts',{'next/server':{NextResponse:{json:(body,init)=>Response.json(body,init)}},'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user},error:null})},from:table=>{assert.equal(table,'steam_accounts');return {select:()=>({eq:(field,value)=>{assert.equal(field,'user_id');assert.equal(value,user.id);return {maybeSingle:async()=>({data:link,error:dbError})}}})}}})},'@/lib/steam/profile':sharedProfile,'@/lib/steam/profile.server':{getSteamPublicProfile:async steamId=>{calls++;assert.equal(steamId,id);return {status:'unconfigured'}}}});
test('profile API requires auth, queries own link and never accepts arbitrary SteamID',async()=>{
 let result=await route.GET(new Request('https://preview.example/api/steam-profile?steamId=foreign'));assert.equal(result.status,401);assert.equal(calls,0);
 user={id:'current-user'};result=await route.GET();assert.equal((await result.json()).linked,false);assert.equal(calls,0);
 link={steam_id:id,linked_at:'2026-10-19T10:00:00Z'};result=await route.GET();const body=await result.json();assert.equal(body.steamId,id);assert.equal(body.status,'unconfigured');assert.equal(result.headers.get('cache-control'),'private, no-store');assert.equal(calls,1);
 dbError={code:'unavailable'};assert.equal((await route.GET()).status,503);assert.equal(calls,1);
});
const React=require('react');const {renderToStaticMarkup}=require('react-dom/server');
const SteamProfile=load('components/auth/SteamProfile.tsx',{'@/lib/steam/profile':profile}).default;
for(const ru of [true,false])test(`Steam profile initial screen RU=${ru}`,()=>{
 const html=renderToStaticMarkup(React.createElement(SteamProfile,{steamId:id,ru}));assert.match(html,ru?/SteamID подтверждён/:/SteamID verified/);assert.match(html,/role="status"/);assert.match(html,/noopener noreferrer/);assert.ok(!html.includes('MMR'));
});
