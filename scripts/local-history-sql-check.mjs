import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {createTestDatabase} from './lib/local-postgres.mjs';
import {createTournament,transition} from '../lib/tournament/engine.ts';
const db=await createTestDatabase();
try{
 const sql=await readFile('db/player-match-history-check.sql','utf8'),[before,rest]=sql.split('-- MIGRATE_HISTORY'),[middle,after]=rest.split('-- BUILD_ENGINE');
 await db.exec(before);await db.exec(await readFile('supabase/migrations/20261021111817_player_match_history.sql','utf8'));await db.exec(middle);
 const {rows:[f]}=await db.query('select * from history_fixture');
 await db.query("select set_config('request.jwt.claim.sub',$1,true)",[f.foe]);
 await db.query("select public.hub_ops_action('set_policy',jsonb_build_object('tournament_id',$1::uuid,'body','Isolated history engine regulation','require_acceptance',false,'bronze','none'))",[f.engine_tid]);
 const config={format:'double',grandFinal:'reset',bestOf:1,groups:[],qualify:2,points:{win:3,draw:1,loss:0}};let state=createTournament('cs2',[f.engine_me,f.engine_foe],config),revision=0;
 const commit=async command=>{await db.query('select public.hub_engine_commit($1::uuid,$2::uuid,$3::integer,gen_random_uuid(),$4::jsonb,$5::jsonb)',[f.engine_tid,f.foe,revision,JSON.stringify(command),JSON.stringify(state)]);revision++;};
 await commit({type:'launch'});
 for(const command of [{type:'result',match:'U1.0',result:{kind:'played',a:1,b:0},invalidate:false,reason:'QA history'},{type:'result',match:'GF1',result:{kind:'forfeit',loser:f.engine_foe},invalidate:false,reason:'QA history'}]){state=transition(state,command);await commit(command);}
 const correction={type:'result',match:'U1.0',result:{kind:'played',a:1,b:0},invalidate:false,reason:'QA result reconfirmation'};state=transition(state,correction);await commit(correction);
 await db.query("update public.hub_engine_audit set created_at=case when revision=2 then '2029-01-01'::timestamptz when revision=4 then '2025-01-01'::timestamptz else created_at end where tournament_id=$1::uuid",[f.engine_tid]);
 const {rows:[original]}=await db.query('select request_id,command from public.hub_engine_audit where tournament_id=$1::uuid and revision=1',[f.engine_tid]);
 const retry=await db.query('select public.hub_engine_commit($1::uuid,$2::uuid,0,$3::uuid,$4::jsonb,$5::jsonb) result',[f.engine_tid,f.foe,original.request_id,JSON.stringify(original.command),JSON.stringify(state)]);assert.equal(retry.rows[0].result.revision,4);
 for(const [actor,expected,id,command,message]of [[f.foe,0,original.request_id,{type:'result'},'Idempotency key reused'],[f.foe,0,null,{type:'result'},'Revision conflict'],[f.me,4,null,{type:'result'},'Organizer required']]){
  await db.exec('savepoint expected_rejection');
  await assert.rejects(()=>db.query('select public.hub_engine_commit($1::uuid,$2::uuid,$3::integer,coalesce($4::uuid,gen_random_uuid()),$5::jsonb,$6::jsonb)',[f.engine_tid,actor,expected,id,JSON.stringify(command),JSON.stringify(state)]),new RegExp(message));
  await db.exec('rollback to savepoint expected_rejection');
 }
 console.log('PASS: CAS stale revision, same-request replay, reused-key payload and foreign organizer rejected');
 const results=await db.exec(after);console.log(results.at(-1).rows);
 assert.equal((await db.query('select count(*)::int n from auth.users')).rows[0].n,0);console.log('PASS: no fixtures persist; only isolated PostgreSQL used');
}catch(error){console.error(error.message,error.detail||'',error.where||'');process.exitCode=1;}finally{await db.close();}
