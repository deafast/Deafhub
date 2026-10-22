// Isolated DB only; never connects to hosted Supabase.
import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import {createTestDatabase} from './lib/local-postgres.mjs';import {createTournament,transition} from '../lib/tournament/engine.ts';
const db=await createTestDatabase();
try{
 await db.exec((await readFile('db/player-match-history-check.sql','utf8')).split('-- MIGRATE_HISTORY')[0]);
 const {rows:[f]}=await db.query('select * from history_fixture');
 await db.query("select set_config('request.jwt.claim.sub',$1,true)",[f.foe]);
 await db.query("select public.hub_ops_action('set_policy',jsonb_build_object('tournament_id',$1::uuid,'body','Isolated schedule regulation','require_acceptance',false,'bronze','none'))",[f.engine_tid]);
 const config={format:'double',grandFinal:'reset',bestOf:1,groups:[],qualify:2,points:{win:3,draw:1,loss:0}};
 const initial=createTournament('cs2',[f.engine_me,f.engine_foe],config);
 const write=(actor,expected,request,command,state)=>db.query('select public.hub_engine_commit($1::uuid,$2::uuid,$3::integer,$4::uuid,$5::jsonb,$6::jsonb) result',[f.engine_tid,actor,expected,request,JSON.stringify(command),JSON.stringify(state)]);
 await write(f.foe,0,randomUUID(),{type:'launch'},initial);
 const command={type:'schedule',match:'U1.0',scheduledAt:'2026-11-01T18:30:00.000Z',reason:'Published schedule'};
 const state=transition(initial,command),request=randomUUID();
 assert.equal((await write(f.foe,1,request,command,state)).rows[0].result.revision,2);
 assert.equal((await write(f.foe,1,request,command,state)).rows[0].result.revision,2);
 const {rows:[stored]}=await db.query("select revision,state->'matches'->0->>'scheduledAt' time from public.hub_engines where tournament_id=$1",[f.engine_tid]);
 assert.equal(stored.revision,2);assert.equal(stored.time,command.scheduledAt);
 const {rows:[audit]}=await db.query("select count(*)::int n from public.hub_engine_audit where tournament_id=$1 and command->>'type'='schedule'",[f.engine_tid]);assert.equal(audit.n,1);
 for(const [actor,expected,key,body,error]of [[f.me,2,randomUUID(),command,'Organizer required'],[f.foe,1,randomUUID(),command,'Revision conflict'],[f.foe,1,request,{...command,reason:'Different payload'},'Idempotency key reused']]){
  await db.exec('savepoint reject');await assert.rejects(()=>write(actor,expected,key,body,state),new RegExp(error));await db.exec('rollback to savepoint reject');
 }
 assert.equal((await db.query("select has_function_privilege('authenticated','public.hub_engine_commit(uuid,uuid,integer,uuid,jsonb,jsonb)','execute') allowed")).rows[0].allowed,false);
 await db.exec('rollback');assert.equal((await db.query('select count(*)::int n from auth.users')).rows[0].n,0);
 console.log('PASS: schedule persisted, audit once, idempotent retry, stale version, foreign organizer, reused key, direct user RPC forbidden; isolated rollback');
}catch(error){console.error(error.message,error.detail||'');process.exitCode=1;}finally{await db.close();}
