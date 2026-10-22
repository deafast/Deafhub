import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import {createTestDatabase} from './lib/local-postgres.mjs';import {createTournament,transition} from '../lib/tournament/engine.ts';
const db=await createTestDatabase();let n=0;
try{
 for(const path of ['20261022062526_tournament_checkin','20261022062542_match_confirmations','20261022105700_require_engine_for_confirmed_results'])await db.exec(await readFile(`supabase/migrations/${path}.sql`,'utf8'));
 await db.exec((await readFile('db/player-match-history-check.sql','utf8')).split('-- MIGRATE_HISTORY')[0]);const {rows:[f]}=await db.query('select * from history_fixture');
 const actor=uid=>db.query("select set_config('request.jwt.claim.sub',$1,true)",[uid]);
 const action=(type,p={})=>db.query('select public.hub_result_action($1,$2::jsonb) result',[type,JSON.stringify({tournament_id:f.engine_tid,...p})]);
 const reject=async(fn,message)=>{await db.exec('savepoint reject');await assert.rejects(fn,new RegExp(message));await db.exec('rollback to savepoint reject');n++;};
 await actor(f.foe);await db.query("select public.hub_ops_action('set_policy',jsonb_build_object('tournament_id',$1::uuid,'body','Result confirmation test regulation','require_acceptance',false,'bronze','none'))",[f.engine_tid]);
 await action('configure',{required:true});
 // Assign already registered third participant as referee without granting global organizer rights.
 await db.query('insert into public.hub_entry_players values($1,$2,$3)',[f.engine_foe,f.other_user,'Isolated judge']);
 await action('assign_referee',{user_id:f.other_user,enabled:true});
 await db.query('delete from public.hub_entry_players where entry_id=$1 and user_id=$2',[f.engine_foe,f.other_user]);
 const cfg={format:'single',grandFinal:'single',bestOf:1,groups:[],qualify:2,points:{win:3,draw:1,loss:0}};
 const initial=createTournament('cs2',[f.engine_me,f.engine_foe],cfg);
 const commit=async(expected,command,state)=>{await db.query('select public.hub_engine_commit($1::uuid,$2::uuid,$3::int,$4::uuid,$5::jsonb,$6::jsonb)',[f.engine_tid,f.foe,expected,randomUUID(),JSON.stringify(command),JSON.stringify(state)]);await db.exec('set constraints result_confirmation_guard immediate;set constraints result_confirmation_guard deferred;');};
 await commit(0,{type:'launch'},initial);await reject(()=>action('configure',{required:false}),'Result rules are locked');
 const command={type:'result',match:'U1.0',result:{kind:'played',a:1,b:0},invalidate:false,reason:'Verified result'};const next=transition(initial,command);
 await reject(()=>commit(1,command,next),'Both captains');
 await actor(f.me);const report=(await action('submit',{match_id:'U1.0',entry_id:f.engine_me,result:command.result,evidence:'Isolated evidence text'})).rows[0].result.report_id;
 assert.equal((await action('submit',{match_id:'U1.0',entry_id:f.engine_me,result:command.result,evidence:'Isolated evidence text'})).rows[0].result.report_id,report);n++;
 await reject(()=>action('confirm',{match_id:'U1.0',entry_id:f.engine_foe,report_id:report,accepted:true,reason:''}),'Match captain');
 await actor(f.foe);await reject(()=>commit(1,command,next),'Both captains');
 await action('confirm',{match_id:'U1.0',entry_id:f.engine_foe,report_id:report,accepted:false,reason:'Wrong recorded score'});await reject(()=>commit(1,command,next),'Both captains');
 await reject(()=>action('decide',{match_id:'U1.0',report_id:report,reason:'Own match ruling'}),'cannot adjudicate');
 await actor(f.other_user);await action('decide',{match_id:'U1.0',report_id:report,reason:'Reviewed submitted evidence'});
 await actor(f.foe);await commit(1,command,next);n++;
 // Correction has a different fingerprint and cannot reuse approvals from the old result.
 const corrected={...command,result:{kind:'played',a:0,b:1},reason:'Correction after evidence'};await reject(()=>commit(2,corrected,transition(next,corrected)),'Both captains');
 await actor(f.me);const fresh=(await action('submit',{match_id:'U1.0',entry_id:f.engine_me,result:corrected.result,evidence:'Corrected evidence'})).rows[0].result.report_id;
 await reject(()=>action('confirm',{match_id:'U1.0',entry_id:f.engine_me,report_id:report,accepted:true,reason:''}),'Report changed');
 await actor(f.foe);await action('confirm',{match_id:'U1.0',entry_id:f.engine_foe,report_id:fresh,accepted:true,reason:''});await commit(2,corrected,transition(next,corrected));n++;
 // Revoke referee role and verify a fresh correction cannot be adjudicated using stale role access.
 await action('assign_referee',{user_id:f.other_user,enabled:false});n++;
 assert.equal((await db.query('select count(*)::int n from public.hub_result_reports')).rows[0].n,2);n++;
 assert.equal((await db.query("select has_function_privilege('anon','public.hub_result_action(text,jsonb)','execute') allowed")).rows[0].allowed,false);n++;
 await db.exec('set local role authenticated');await actor(f.other_user); // Removed referee must not see reports after revocation.
 assert.equal((await db.query('select count(*)::int n from public.hub_result_reports')).rows[0].n,0);n++;
 await reject(()=>db.query("update public.hub_result_reports set evidence='forged'"),'permission denied');
 await db.exec('reset role');
 await db.exec('rollback');assert.equal((await db.query('select count(*)::int n from auth.users')).rows[0].n,0);n++;
 console.log(`PASS ${n} result SQL assertions: dual confirmation, dispute, scoped referee, self-adjudication denied, correction invalidation, replay, audit, rollback`);
}catch(e){console.error(e.message,e.detail||'');process.exitCode=1;}finally{await db.close();}
