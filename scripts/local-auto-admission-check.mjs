// Isolated PostgreSQL; no hosted test identities or results.
import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import {createTestDatabase} from './lib/local-postgres.mjs';import {createTournament} from '../lib/tournament/engine.ts';
const db=await createTestDatabase();let checks=0;
try{
 for(const path of ['20261022062526_tournament_checkin','20261022062542_match_confirmations','20261022104233_auto_admission'])await db.exec(await readFile(`supabase/migrations/${path}.sql`,'utf8'));
 await db.exec((await readFile('db/player-match-history-check.sql','utf8')).split('-- MIGRATE_HISTORY')[0]);const {rows:[f]}=await db.query('select * from history_fixture');
 const actor=id=>db.query("select set_config('request.jwt.claim.sub',$1,true)",[id]);
 const reject=async(fn,error)=>{await db.exec('savepoint rejected');await assert.rejects(fn,new RegExp(error));await db.exec('rollback to savepoint rejected');checks++;};
 const ops=(action,p)=>db.query('select public.hub_ops_action($1,$2::jsonb)',[action,JSON.stringify(p)]);
 const set=enabled=>db.query('select public.hub_set_auto_admission($1,$2,$3) result',[f.engine_tid,enabled,'Isolated admission test']);
 const status=async id=>(await db.query('select status from public.hub_entries where id=$1',[id])).rows[0].status;
 const policy=async()=> (await db.query('select version from public.hub_participation_policies where tournament_id=$1',[f.engine_tid])).rows[0].version;
 const review=async(id,approved=true)=>ops('review_eligibility',{entry_id:id,policy_version:await policy(),approved,reason:'Verified current tournament criteria'});
 const attest=async(id,accepted=true)=>ops('attest',{entry_id:id,policy_version:await policy(),accepted});
 await db.query("update public.hub_entries set status='pending' where tournament_id=$1",[f.engine_tid]);
 await actor(f.foe);await ops('set_policy',{tournament_id:f.engine_tid,body:'Isolated personal admission regulation',require_acceptance:true,bronze:'none'});
 await review(f.engine_me);await actor(f.me);await attest(f.engine_me);
 assert.equal(await status(f.engine_me),'pending','Existing tournaments must remain manual by default');checks++;
 await reject(()=>set(true),'Organizer required');await actor('');await reject(()=>set(true),'Sign in required');
 await actor(f.foe);assert.equal((await set(true)).rows[0].result.admitted,1);assert.equal(await status(f.engine_me),'approved');checks++;
 assert.equal((await set(true)).rows[0].result.admitted,0);assert.equal((await db.query("select count(*)::int n from public.hub_ops_audit where action='auto_admit'")).rows[0].n,1);checks++;
 // Future entry: confirmation alone cannot bypass organizer review.
 await attest(f.engine_foe);assert.equal(await status(f.engine_foe),'pending');checks++;
 await review(f.engine_foe,false);assert.equal(await status(f.engine_foe),'pending');checks++;
 // Stale personal confirmation does not authorize the newly published policy.
 await ops('set_policy',{tournament_id:f.engine_tid,body:'Changed personal admission regulation',require_acceptance:true,bronze:'none'});
 await review(f.engine_foe);assert.equal(await status(f.engine_foe),'pending');checks++;
 await attest(f.engine_foe);assert.equal(await status(f.engine_foe),'approved');checks++;
 await actor(f.me);await attest(f.engine_me); // make the first entry current for launch
 await actor(f.foe);await review(f.engine_me);
 // An organizer-rejected entry never reopens through personal confirmation.
 await db.query("update public.hub_entries set status='rejected' where id=$1",[f.engine_foe]);await attest(f.engine_foe);await review(f.engine_foe);assert.equal(await status(f.engine_foe),'rejected');checks++;
 await db.query("update public.hub_entries set status='pending' where id=$1",[f.engine_foe]);
 await db.query('update public.hub_tournaments set roster_size=2 where id=$1',[f.engine_tid]);await review(f.engine_foe);assert.equal(await status(f.engine_foe),'pending');checks++;
 await db.query('update public.hub_tournaments set roster_size=1 where id=$1',[f.engine_tid]);
 const oldRules=(await db.query('select rules_version from public.hub_entries where id=$1',[f.engine_foe])).rows[0].rules_version;
 await db.query('update public.hub_entries set rules_version=gen_random_uuid() where id=$1',[f.engine_foe]);await review(f.engine_foe);assert.equal(await status(f.engine_foe),'pending');checks++;
 await db.query('update public.hub_entries set rules_version=$2 where id=$1',[f.engine_foe,oldRules]);
 // Disable means later confirmations stay manual; enabling processes existing ready entries.
 await set(false);await attest(f.engine_foe);assert.equal(await status(f.engine_foe),'pending');checks++;
 assert.equal((await set(true)).rows[0].result.admitted,1);checks++;
 // Complete two-player roster: the last player's own confirmation is required.
 await db.query("update public.hub_entries set status='pending' where id=$1",[f.engine_foe]);
 await db.query('update public.hub_tournaments set roster_size=2 where id=$1',[f.engine_tid]);
 await db.query('insert into public.hub_entry_players values($1,$2,$3)',[f.engine_foe,f.other_user,'Second registered player']);
 await review(f.engine_foe);assert.equal(await status(f.engine_foe),'pending');checks++;
 await actor(f.other_user);await attest(f.engine_foe);assert.equal(await status(f.engine_foe),'approved');checks++;
 await db.query('delete from public.hub_entry_attestations where entry_id=$1 and user_id=$2',[f.engine_foe,f.other_user]);
 await db.query('delete from public.hub_entry_players where entry_id=$1 and user_id=$2',[f.engine_foe,f.other_user]);
 await db.query('update public.hub_tournaments set roster_size=1 where id=$1',[f.engine_tid]);
 await actor(f.foe);
 // Optional personal acceptance never skips the mandatory positive organizer review.
 await db.query("update public.hub_entries set status='pending' where id=$1",[f.engine_foe]);
 await ops('set_policy',{tournament_id:f.engine_tid,body:'Current optional personal confirmation regulation',require_acceptance:false,bronze:'none'});
 assert.equal(await status(f.engine_foe),'pending');checks++;
 await review(f.engine_foe);assert.equal(await status(f.engine_foe),'approved');checks++;
 await db.exec('set local role authenticated');await reject(()=>db.query('update public.hub_admission_rules set enabled=true'),'permission denied');
 assert.equal((await db.query("select has_function_privilege('authenticated','public.hub_try_auto_admit(uuid)','execute') allowed")).rows[0].allowed,false);checks++;await db.exec('reset role');
 const initial=createTournament('cs2',[f.engine_me,f.engine_foe],{format:'single',grandFinal:'single',bestOf:1,groups:[],qualify:2,points:{win:3,draw:1,loss:0}});
 await db.query('select public.hub_engine_commit($1,$2,0,$3,$4::jsonb,$5::jsonb)',[f.engine_tid,f.foe,randomUUID(),JSON.stringify({type:'launch'}),JSON.stringify(initial)]);
 await reject(()=>set(false),'Admission rules are locked');
 const {rows:[a]}=await db.query("select details from public.hub_ops_audit where action='auto_admit' order by id desc limit 1");assert.equal(a.details.review_actor,f.foe);assert.ok(a.details.policy_version);checks++;
 assert.equal((await db.query("select has_function_privilege('anon','public.hub_set_auto_admission(uuid,boolean,text)','execute') allowed")).rows[0].allowed,false);checks++;
 await db.exec('rollback');assert.equal((await db.query('select count(*)::int n from auth.users')).rows[0].n,0);checks++;
 console.log(`PASS ${checks} auto-admission SQL checks: opt-in, exact roster, personal acceptance, owner review, stale/rejected entries, idempotency, disable, launch lock, audit, RLS/ACL and rollback`);
}catch(e){console.error(e.message,e.detail||'');process.exitCode=1;}finally{await db.close();}
