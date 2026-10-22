// Isolated PostgreSQL only. No hosted identities, matches or settings are changed.
import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {createTestDatabase} from './lib/local-postgres.mjs';
const db=await createTestDatabase();let checks=0;
try{
 for(const path of ['20261022062526_tournament_checkin','20261022062542_match_confirmations','20261022104233_auto_admission'])await db.exec(await readFile(`supabase/migrations/${path}.sql`,'utf8'));
 if(!process.env.DEAFHUB_SKIP_LEGACY_GUARD)await db.exec(await readFile('supabase/migrations/20261022105700_require_engine_for_confirmed_results.sql','utf8'));
 await db.exec((await readFile('db/player-match-history-check.sql','utf8')).split('-- MIGRATE_HISTORY')[0]);const {rows:[f]}=await db.query('select * from history_fixture');
 const actor=id=>db.query("select set_config('request.jwt.claim.sub',$1,true)",[id]);
 const reject=async(fn,message)=>{await db.exec('savepoint rejected');await assert.rejects(fn,new RegExp(message));await db.exec('rollback to savepoint rejected');checks++;};
 const action=(action,p)=>db.query('select public.hub_action($1,$2::jsonb)',[action,JSON.stringify(p)]);
 const configure=required=>db.query("select public.hub_result_action('configure',$1::jsonb)",[JSON.stringify({tournament_id:f.engine_tid,required})]);
 const payload={tournament_id:f.engine_tid,entry_a:f.engine_me,entry_b:f.engine_foe,starts_at:'2027-01-01T12:00:00Z'};
 await actor(f.foe);await configure(true);
 await reject(()=>action('create_match',payload),'Captain confirmations require tournament engine');
 await reject(()=>db.query('insert into public.hub_matches(tournament_id,entry_a,entry_b,starts_at) values($1,$2,$3,$4)',Object.values(payload)),'Captain confirmations require tournament engine');
 assert.equal((await db.query('select count(*)::int n from public.hub_matches where tournament_id=$1',[f.engine_tid])).rows[0].n,0);checks++;
 await actor(f.me);await reject(()=>action('create_match',payload),'Organizer required');await actor(f.foe);
 await configure(false);await action('create_match',payload);checks++;
 const mid=(await db.query('select id from public.hub_matches where tournament_id=$1',[f.engine_tid])).rows[0].id;
 await reject(()=>configure(true),'Result rules are locked');
 await action('finish_match',{match_id:mid,score_a:1,score_b:0});assert.equal((await db.query('select status from public.hub_matches where id=$1',[mid])).rows[0].status,'finished');checks++;
 // Simulate a legacy event already carrying the required flag before this fix.
 // This setup is local SQL, never a way to enable flags in a live event.
 await actor(f.me);await action('create_match',{...payload,tournament_id:f.tid,entry_a:f.e_me,entry_b:f.e_foe});
 const oldMid=(await db.query("select id from public.hub_matches where tournament_id=$1 and status='scheduled'",[f.tid])).rows[0].id;
 await db.query('insert into public.hub_result_rules values($1,true)',[f.tid]);
 await reject(()=>action('create_match',{...payload,tournament_id:f.tid,entry_a:f.e_me,entry_b:f.e_foe}),'Captain confirmations require tournament engine');
 await reject(()=>action('finish_match',{match_id:oldMid,score_a:1,score_b:0}),'Captain confirmations require tournament engine');
 await reject(()=>db.query("update public.hub_matches set score_a=0,score_b=1 where tournament_id=$1",[f.tid]),'Captain confirmations require tournament engine');
 assert.equal((await db.query("select score_a from public.hub_matches where tournament_id=$1 and status='finished'",[f.tid])).rows[0].score_a,1);checks++;
 assert.equal((await db.query("select has_function_privilege('anon','public.hub_legacy_confirmation_guard()','execute') a,has_function_privilege('authenticated','public.hub_legacy_confirmation_guard()','execute') u")).rows[0].a,false);checks++;
 assert.equal((await db.query("select has_function_privilege('authenticated','public.hub_legacy_confirmation_guard()','execute') u")).rows[0].u,false);checks++;
 await db.exec('set local role authenticated');await reject(()=>db.query('update public.hub_matches set score_a=9'),'permission denied');await db.exec('reset role');
 await db.exec('rollback');assert.equal((await db.query('select count(*)::int n from auth.users')).rows[0].n,0);checks++;
 console.log(`PASS ${checks} legacy confirmation boundary checks: RPC/direct bypass blocked, manual opt-out preserved, launch lock, unchanged historical score, internal ACL, RLS and rollback`);
}catch(e){console.error(e.message,e.detail||'');process.exitCode=1;}finally{await db.close();}
