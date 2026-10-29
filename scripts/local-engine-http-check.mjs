// Actual API handler + HTTP concurrency + isolated PostgreSQL RPC.
// Auth transport is a local fixture, not a hosted Supabase sign-in test.
import {createServer} from 'node:http';import {createRequire} from 'node:module';import {readFile} from 'node:fs/promises';import vm from 'node:vm';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import {createTestDatabase} from './lib/local-postgres.mjs';import {createTournament} from '../lib/tournament/engine.ts';
const require=createRequire(import.meta.url),ts=require('typescript'),{NextRequest}=require('next/server');const db=await createTestDatabase();let server;
try{
 await db.exec((await readFile('db/player-match-history-check.sql','utf8')).split('-- MIGRATE_HISTORY')[0]);
 const {rows:[f]}=await db.query('select * from history_fixture');
 await db.query("select set_config('request.jwt.claim.sub',$1,true)",[f.foe]);
 await db.query("select public.hub_ops_action('set_policy',jsonb_build_object('tournament_id',$1::uuid,'body','Isolated concurrency regulation','require_acceptance',false,'bronze','none'))",[f.engine_tid]);
 const config={format:'double',grandFinal:'reset',bestOf:1,groups:[],qualify:2,points:{win:3,draw:1,loss:0}},state=createTournament('cs2',[f.engine_me,f.engine_foe],config);
 await db.query('select public.hub_engine_commit($1::uuid,$2::uuid,0,$3::uuid,$4::jsonb,$5::jsonb)',[f.engine_tid,f.foe,randomUUID(),JSON.stringify({type:'launch'}),JSON.stringify(state)]);
 await db.exec(`create function pg_temp.qa_commit(tid uuid,actor uuid,expected integer,rid uuid,command jsonb,state jsonb) returns jsonb language plpgsql as $$ begin return jsonb_build_object('data',public.hub_engine_commit(tid,actor,expected,rid,command,state));exception when others then return jsonb_build_object('error',jsonb_build_object('message',sqlerrm));end $$;`);
 let actor=f.foe,arrivals=0,target=0,release,barrier=Promise.resolve();
 function gate(n){arrivals=0;target=n;barrier=new Promise(resolve=>{release=resolve;});}
 const client={auth:{getUser:async()=>({data:{user:{id:actor}},error:null})},from(table){let fields='*';const filters=[];return {select(value){fields=value;return this},eq(k,v){filters.push([k,v]);return this},async maybeSingle(){const allowed={hub_tournaments:['game','organizer_id'],hub_organizers:['user_id'],hub_engines:['revision','state'],hub_engine_audit:['command','actor_id']};assert.equal(fields,allowed[table].join(','));const allowedFields=['id','user_id','tournament_id','request_id'];for(const [k]of filters)assert.ok(allowedFields.includes(k));const rows=await db.query(`select ${fields} from public.${table} where ${filters.map(([k],i)=>`${k}=$${i+1}`).join(' and ')}`,filters.map(([,v])=>v));return {data:rows.rows[0]||null,error:null};}};}};
 const admin={async rpc(name,args){assert.equal(name,'hub_engine_commit');arrivals++;if(arrivals===target)release();await barrier;const {rows:[row]}=await db.query('select pg_temp.qa_commit($1::uuid,$2::uuid,$3::integer,$4::uuid,$5::jsonb,$6::jsonb) body',[args.tid,args.actor,args.expected,args.request_id,JSON.stringify(args.command),JSON.stringify(args.next_state)]);return row.body;}};
 const scope={exports:{},structuredClone,require:name=>name==='@/lib/supabase/server'?{createClient:async()=>client}:name==='@/lib/supabase/admin'?{createAdminClient:()=>admin}:name==='@/lib/request-body'?require('../maintenance/test-support/request-body.cjs'):name==='@/lib/tournament/engine'?engine:name==='@/lib/tournament/fc-groups'?draw:require(name)};
 function compile(path){return ts.transpileModule(require('node:fs').readFileSync(path,'utf8'),{fileName:path,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;}
 const engineScope={exports:{},structuredClone};vm.runInNewContext(compile('lib/tournament/engine.ts'),engineScope);const engine=engineScope.exports;
 const drawScope={exports:{},require};vm.runInNewContext(compile('lib/tournament/fc-groups.ts'),drawScope);const draw=drawScope.exports;
 vm.runInNewContext(compile('app/api/tournament-engine/route.ts'),scope);let origin;
 server=createServer(async(req,res)=>{try{let body='';for await(const chunk of req)body+=chunk;const request=new NextRequest(origin+req.url,{method:req.method,headers:req.headers,body});const response=await scope.exports.POST(request);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());}catch(error){console.error('Local handler',error.message);res.writeHead(500);res.end('Local harness failure');}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin=new NextRequest('http://127.0.0.1:'+server.address().port).nextUrl.origin;
 const base={tournament_id:f.engine_tid,revision:1,command:{type:'schedule',match:'U1.0',scheduledAt:'2026-11-01T18:30:00.000Z',reason:'Published concurrency test'}};
 const post=body=>fetch(origin+'/api/tournament-engine',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
 gate(12);const responses=await Promise.all(Array.from({length:12},()=>post({...base,request_id:randomUUID()})));
 if(!responses.some(r=>r.status===200))console.error('HTTP statuses',responses.map(r=>r.status),'first body',await responses[0].clone().text());
 assert.equal(responses.filter(r=>r.status===200).length,1);assert.equal(responses.filter(r=>r.status===409).length,11);
 let {rows:[counts]}=await db.query('select (select revision from public.hub_engines where tournament_id=$1) revision,(select count(*)::int from public.hub_engine_audit where tournament_id=$1) audit',[f.engine_tid]);assert.deepEqual(counts,{revision:2,audit:2});
 gate(12);const duplicate={...base,revision:2,request_id:randomUUID(),command:{...base.command,scheduledAt:'2026-11-02T18:30:00.000Z'}};
 const repeats=await Promise.all(Array.from({length:12},()=>post(duplicate)));assert.ok(repeats.every(r=>r.status===200));
 ({rows:[counts]}=await db.query('select (select revision from public.hub_engines where tournament_id=$1) revision,(select count(*)::int from public.hub_engine_audit where tournament_id=$1) audit',[f.engine_tid]));assert.deepEqual(counts,{revision:3,audit:3});
 const reused=await post({...duplicate,command:{...duplicate.command,reason:'Different payload'}});assert.equal(reused.status,409);
 actor=f.me;const foreign=await post({...base,revision:3,request_id:randomUUID()});assert.equal(foreign.status,403);
 await db.exec('rollback');assert.equal((await db.query('select count(*)::int n from auth.users')).rows[0].n,0);
 console.log('PASS: 12 concurrent unique requests -> 1 success / 11 conflicts; 12 same-key requests -> one revision/audit; reused payload409; foreign organizer403; isolated rollback');
}catch(error){console.error(error.message);process.exitCode=1;}finally{if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}await db.close();}
