// Isolated database only: fixture identities never leave this process.
import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {createTestDatabase} from './lib/local-postgres.mjs';import {createTournament} from '../lib/tournament/engine.ts';
const db=await createTestDatabase();let assertions=0;
try{
 await db.exec(await readFile('supabase/migrations/20261022062526_tournament_checkin.sql','utf8'));
 await db.exec((await readFile('db/player-match-history-check.sql','utf8')).split('-- MIGRATE_HISTORY')[0]);
 const {rows:[f]}=await db.query('select * from history_fixture');
 const actor=uid=>db.query("select set_config('request.jwt.claim.sub',$1,true)",[uid]);
 const action=(type,p)=>db.query('select public.hub_checkin_action($1,$2::jsonb) result',[type,JSON.stringify(p)]);
 const rejects=async(fn,error)=>{await db.exec('savepoint reject');await assert.rejects(fn,new RegExp(error));await db.exec('rollback to savepoint reject');assertions++;};
 await actor(f.foe);
 await db.query("select public.hub_ops_action('set_policy',jsonb_build_object('tournament_id',$1::uuid,'body','Isolated check-in regulation','require_acceptance',false,'bronze','none'))",[f.engine_tid]);
 const times=(await db.query("select now()-interval '1 hour' opening, now()+interval '1 hour' closing")).rows[0];
 const config={tournament_id:f.engine_tid,enabled:true,opens_at:times.opening.toISOString(),closes_at:times.closing.toISOString(),reason:'Local QA setup'};
 const window=async()=> (await db.query('select * from public.hub_checkin_windows where tournament_id=$1',[f.engine_tid])).rows[0];
 const checked=(eid,version,ready=true)=>action('check_in',{entry_id:eid,window_version:version,ready});
 const state=createTournament('cs2',[f.engine_me,f.engine_foe],{format:'double',grandFinal:'reset',bestOf:1,groups:[],qualify:2,points:{win:3,draw:1,loss:0}});
 const launch=()=>db.query('select public.hub_engine_commit($1::uuid,$2::uuid,0,$3::uuid,$4::jsonb,$5::jsonb)',[f.engine_tid,f.foe,randomUUID(),JSON.stringify({type:'launch'}),JSON.stringify(state)]);
 await actor('');await rejects(()=>action('configure',config),'Sign in required');await actor(f.foe);
 await rejects(()=>action('configure',{...config,opens_at:config.closes_at}),'Invalid check-in window');
 await action('configure',{...config,opens_at:new Date(times.closing.getTime()-1000).toISOString()});
 await rejects(async()=>checked(f.engine_foe,(await window()).version),'Check-in window is closed');
 await action('configure',config);const w=await window();
 await action('configure',config);assert.equal((await window()).version,w.version);assertions++;
 await rejects(launch,'Complete personal check-in');
 await actor(f.me);await rejects(()=>action('configure',config),'Organizer required');
 await rejects(()=>checked(f.engine_foe,w.version),'Approved registered player');
 await checked(f.engine_me,w.version);await checked(f.engine_me,w.version);
 assert.equal((await db.query("select count(*)::int n from public.hub_ops_audit where action='checkin_check_in'")).rows[0].n,1);assertions++;
 await db.exec('set local role authenticated');assert.equal((await db.query('select count(*)::int n from public.hub_player_checkins')).rows[0].n,1);assertions++;
 await rejects(()=>db.query('update public.hub_player_checkins set ready=true'),'permission denied');await db.exec('reset role');
 await actor(f.other_user);await db.exec('set local role authenticated');assert.equal((await db.query('select count(*)::int n from public.hub_player_checkins')).rows[0].n,0);assertions++;await db.exec('reset role');
 await actor(f.foe);await checked(f.engine_foe,w.version);
 // Window change invalidates all previous confirmations; stale version is rejected.
 await action('configure',{...config,closes_at:new Date(times.closing.getTime()+60000).toISOString(),reason:'Changed window'});const next=await window();assert.notEqual(next.version,w.version);assertions++;
 await rejects(()=>checked(f.engine_foe,w.version),'Refresh the check-in');await rejects(launch,'Complete personal check-in');
 await checked(f.engine_foe,next.version);await actor(f.me);await checked(f.engine_me,next.version);
 // Withdrawal remains possible and blocks launch until personally restored.
 await checked(f.engine_me,next.version,false);await rejects(launch,'Complete personal check-in');await checked(f.engine_me,next.version);
 await actor(f.foe);
 await db.query("select public.hub_ops_action('set_policy',jsonb_build_object('tournament_id',$1::uuid,'body','Changed check-in participation criteria','require_acceptance',false,'bronze','none'))",[f.engine_tid]);
 await rejects(launch,'Complete personal check-in');await checked(f.engine_foe,next.version);await actor(f.me);await checked(f.engine_me,next.version);
 // Exact roster and current rule versions are enforced independently of the UI.
 await db.query('update public.hub_tournaments set roster_size=2 where id=$1',[f.engine_tid]);await rejects(launch,'Complete personal check-in');
 await db.query('update public.hub_tournaments set roster_size=1 where id=$1',[f.engine_tid]);
 await actor(f.foe);await launch();assertions++;
 await rejects(()=>checked(f.engine_foe,next.version,false),'Check-in is locked');await rejects(()=>action('configure',config),'Check-in is locked');
 assert.equal((await db.query("select details->>'reason' reason from public.hub_ops_audit where action='checkin_configure' order by id desc limit 1")).rows[0].reason,'Changed window');assertions++;
 assert.equal((await db.query("select has_function_privilege('anon','public.hub_checkin_action(text,jsonb)','execute') allowed")).rows[0].allowed,false);assertions++;
 await db.exec('rollback');assert.equal((await db.query('select count(*)::int n from auth.users')).rows[0].n,0);assertions++;
 console.log(`PASS ${assertions} check-in SQL assertions: ownership, personal-only, RLS, no direct writes, idempotency, version invalidation, roster gate, withdrawal, launch lock, audit, rollback`);
}catch(e){console.error(e.message,e.detail||'');process.exitCode=1;}finally{await db.close();}
