// Run with Node 24: node --env-file=.env.local scripts/tournament-e2e.mjs
// Creates disposable QA accounts and removes only IDs created by this run.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFileSync,readFileSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
const origin=process.env.QA_ORIGIN||'http://localhost:3000';
if(!origin.includes('localhost')&&!origin.includes('preview-deafhub-setup'))throw new Error('Preview/local only');
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const admin=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const users=[],teams=[],entries=[],tournaments=[]; const run=randomUUID().slice(0,8);
const checked=async(p)=>{const r=await p;if(r.error)throw new Error(r.error.message);return r.data;};
async function account(label){
 const email=`qa-engine-${run}-${label}@deafhub-test.invalid`;
 const {user}=await checked(admin.auth.admin.createUser({email,email_confirm:true}));users.push(user.id);
 const {properties}=await checked(admin.auth.admin.generateLink({type:'magiclink',email}));
 const jar=new Map();
 const client=createServerClient(url,key,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:values=>values.forEach(v=>jar.set(v.name,v.value))}});
 await checked(client.auth.verifyOtp({token_hash:properties.hashed_token,type:'magiclink'}));
 return {id:user.id,client,cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; ')};
}
async function api(path,actor,body,expected=200,headers={}){
 const response=await fetch(origin+path,{method:body?'POST':'GET',headers:{...(actor?{cookie:actor.cookie}:{}),...(body?{'Content-Type':'application/json',Origin:origin}:{}),...headers},body:body?JSON.stringify(body):undefined});
 const data=await response.json();assert.equal(response.status,expected,JSON.stringify(data));return data;
}
const qaDir=process.env.QA_DIR||join(tmpdir(),'deafhub-qa');mkdirSync(qaDir,{recursive:true,mode:0o700});
const fixturePath=process.env.QA_FIXTURE||join(qaDir,'private.json');
if(process.argv[2]==='prepare') {
 const owner=await account('owner'),outsider=await account('outsider'),player2=await account('player2'),player3=await account('player3');
 const actors=[owner,outsider,player2,player3].map(a=>({id:a.id,cookie:a.cookie}));
 const tid=randomUUID();tournaments.push(tid);
 for(let i=0;i<4;i++){teams.push(randomUUID());entries.push(randomUUID());}
 writeFileSync(fixturePath,JSON.stringify({owner:{id:owner.id,cookie:owner.cookie},outsider:{id:outsider.id,cookie:outsider.cookie},tid,teams,entries,users,run,actors}),{mode:0o600});
 let sql=`begin;\ninsert into public.hub_organizers values ('${owner.id}');\ninsert into public.hub_tournaments(id,title,game,organizer_id,starts_at,rules,roster_size) values ('${tid}','QA engine ${run}','fc','${owner.id}',now()+interval '1 day','Disposable automated QA tournament; not a real competition.',1);\n`;
 for(let i=0;i<4;i++)sql+=`insert into public.hub_teams(id,name,game,captain_id) values ('${teams[i]}','QA ${run} ${i}','fc','${owner.id}');\ninsert into public.hub_entries(id,tournament_id,team_id,status,rules_version) select '${entries[i]}',id,'${teams[i]}','approved',rules_version from public.hub_tournaments where id='${tid}';\n`;
 sql+=`insert into public.hub_participation_policies(tournament_id,body,require_acceptance,bronze) values ('${tid}','QA self-declaration regulations; no medical documents',false,'lower_final');\n`;
 for(let i=0;i<4;i++)sql+=`insert into public.hub_entry_players values ('${entries[i]}','${actors[i].id}','QA player ${i}');\n`;
 sql+=`commit;\nselect 'QA fixture ready' as result;`;
 writeFileSync(join(qaDir,'setup.sql'),sql);
 const cleanup=`begin;\ndelete from public.hub_ops_audit where tournament_id='${tid}';\ndelete from public.hub_awards where batch_id in(select id from public.hub_award_batches where tournament_id='${tid}');\ndelete from public.hub_award_batches where tournament_id='${tid}';\ndelete from public.hub_entry_attestations where entry_id in (${entries.map(e=>`'${e}'`).join(',')});\ndelete from public.hub_eligibility_reviews where entry_id in (${entries.map(e=>`'${e}'`).join(',')});\ndelete from public.hub_participation_policies where tournament_id='${tid}';\ndelete from public.hub_engine_audit where tournament_id='${tid}';\ndelete from public.hub_engines where tournament_id='${tid}';\ndelete from public.hub_entry_players where entry_id in (${entries.map(e=>`'${e}'`).join(',')});\ndelete from public.hub_entries where tournament_id='${tid}';\ndelete from public.hub_tournaments where id='${tid}';\ndelete from public.hub_teams where id in (${teams.map(e=>`'${e}'`).join(',')});\ndelete from public.hub_organizers where user_id='${owner.id}';\ncommit;\nselect 'QA fixture removed' as result;`;
 writeFileSync(join(qaDir,'cleanup.sql'),cleanup);
 console.log(`QA accounts prepared in ${qaDir}. Apply setup.sql, run test, then cleanup.sql and cleanup-auth.`);
 process.exit(0);
}
const fixture=JSON.parse(readFileSync(fixturePath,'utf8'));
if(process.argv[2]==='cleanup-auth'){
 for(const id of fixture.users)await checked(admin.auth.admin.deleteUser(id));
 console.log('PASS disposable QA accounts removed');process.exit(0);
}
const {tid}=fixture;entries.push(...fixture.entries);
const owner=fixture.owner,outsider={...fixture.outsider,client:createServerClient(url,key,{cookies:{getAll:()=>fixture.outsider.cookie.split('; ').map(c=>{const i=c.indexOf('=');return {name:c.slice(0,i),value:c.slice(i+1)};}),setAll:()=>{}}})};
try{
 await api(`/api/tournament-engine?id=${tid}`,null,null,401);
 const body={tournament_id:tid,revision:0,request_id:randomUUID(),command:{type:'launch',entries,config:{format:'double',grandFinal:'reset',bestOf:1,groups:[{id:'A',entries:entries.slice(0,2)},{id:'B',entries:entries.slice(2)}],qualify:2,points:{win:3,draw:1,loss:0}}}};
 await api('/api/tournament-engine',owner,body,403,{Origin:'https://wrong.invalid'});
 await api('/api/tournament-engine',outsider,body,403);
 let stored=await api('/api/tournament-engine',owner,body);
 const retry=await api('/api/tournament-engine',owner,body);assert.equal(retry.revision,1);
 await api('/api/tournament-engine',owner,{...body,command:{...body.command,config:{...body.command.config,format:'single'}}},409);
 const send=async(command,expected=200)=>{const d=await api('/api/tournament-engine',owner,{tournament_id:tid,revision:stored.revision,request_id:randomUUID(),command},expected);if(expected===200)stored=d;return d;};
 await send({type:'qualify',ties:{}},400);
 await send({type:'result',match:'GA.0.1',result:{kind:'played',a:-1,b:0},invalidate:false,reason:'QA'},400);
 const race=await Promise.all([1,2].map(a=>fetch(origin+'/api/tournament-engine',{method:'POST',headers:{cookie:owner.cookie,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({tournament_id:tid,revision:stored.revision,request_id:randomUUID(),command:{type:'result',match:'GA.0.1',result:{kind:'played',a,b:0},invalidate:false,reason:'QA race'}})})));
 assert.deepEqual(race.map(r=>r.status).sort(),[200,409]);
 stored=await api(`/api/tournament-engine?id=${tid}`,owner);
 await send({type:'result',match:'GB.0.1',result:{kind:'played',a:2,b:0},invalidate:false,reason:'QA verified'});
 await send({type:'qualify',ties:{}});
 assert.deepEqual(stored.state.matches.filter(m=>m.id.startsWith('U1.')).map(m=>[m.a,m.b]),[[entries[0],entries[3]],[entries[2],entries[1]]]);
 while(!stored.state.champion){
  const m=stored.state.matches.find(m=>m.status==='ready');assert.ok(m);
  const result=m.id==='GF1'?{kind:'played',a:0,b:1}:m.id==='L1.0'?{kind:'forfeit',loser:m.b}:{kind:'played',a:1,b:0};
  await send({type:'result',match:m.id,result,invalidate:false,reason:'QA referee verified'});
 }
 assert.equal(stored.state.matches.find(m=>m.id==='GF2').status,'finished');
 const hub=await api('/api/hub',owner);assert.ok(hub.engineIds.includes(tid));assert.ok(hub.stats.matches>0);
 const finalTournament=await checked(outsider.client.from('hub_tournaments').select('status').eq('id',tid).single());assert.equal(finalTournament.status,'finished');
 await send({type:'result',match:'GA.0.1',result:{kind:'played',a:0,b:2},invalidate:false,reason:'QA correction'},400);
 await send({type:'result',match:'GA.0.1',result:{kind:'played',a:0,b:2},invalidate:true,reason:'QA correction'});
 assert.equal(stored.state.phase,'groups');assert.equal(stored.state.champion,null);
 assert.ok(stored.revision>8);
 const denied=await outsider.client.rpc('hub_engine_commit',{tid,actor:owner.id,expected:stored.revision,request_id:randomUUID(),command:{},next_state:stored.state});assert.ok(denied.error);
 const privateAudit=await checked(outsider.client.from('hub_engine_audit').select('*').eq('tournament_id',tid));assert.equal(privateAudit.length,0);
 writeFileSync(join(qaDir,'http-result.json'),JSON.stringify({passed:true,origin,revision:stored.revision,checks:['authentication','origin','ownership','idempotency','CAS race','groups','cross seeding','DE','forfeit','grand final reset','statistics','correction invalidation','audit','RPC ACL','audit RLS']},null,2));
 console.log('PASS HTTP → Next API → Supabase → result: 15 integrated checks');
}finally{console.log('Run generated cleanup SQL, then cleanup-auth.');}
