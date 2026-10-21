-- Preview integration check. Uncommitted fixtures, always rollback.
begin;
create temp table fc_fixture(actor uuid,other_user uuid,tournament uuid,other_game uuid);
insert into fc_fixture values(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid());
insert into auth.users(id,email,aud,role) select id,id::text||'@deafhub-test.invalid','authenticated','authenticated' from (select actor id from fc_fixture union all select other_user from fc_fixture) u;
insert into public.profiles(id,nickname,region) select id,'FC rollback player','europe' from (select actor id from fc_fixture union all select other_user from fc_fixture) u;
insert into public.hub_organizers(user_id) select actor from fc_fixture;
insert into public.hub_tournaments(id,title,game,organizer_id,starts_at,rules,roster_size) select tournament,'FC rollback QA','fc',actor,now()+interval '1 day','Rollback-only FC registration regulation',1 from fc_fixture;
insert into public.hub_tournaments(id,title,game,organizer_id,starts_at,rules,roster_size) select other_game,'CS rollback QA','cs2',actor,now()+interval '1 day','Rollback-only CS registration regulation',5 from fc_fixture;
grant select on fc_fixture to authenticated;
set local role authenticated;
do $$declare f record;v uuid;eid uuid;repeat_id uuid;state_json jsonb;begin
 select * into f from fc_fixture;
 begin perform public.hub_register_fc(f.tournament,gen_random_uuid(),'strong');raise exception 'FAIL guest accepted';exception when raise_exception then if SQLERRM<>'Sign in required' then raise;end if;end;
 perform set_config('request.jwt.claim.sub',f.actor::text,true);
 select rules_version into v from public.hub_tournaments where id=f.tournament;
 begin perform public.hub_register_fc(f.tournament,v,'fake-rating');raise exception 'FAIL invalid level';exception when raise_exception then if SQLERRM<>'Choose your playing level' then raise;end if;end;
 begin perform public.hub_register_fc(f.tournament,gen_random_uuid(),'strong');raise exception 'FAIL stale rules';exception when raise_exception then if SQLERRM<>'Read and accept current rules' then raise;end if;end;
 begin perform public.hub_register_fc(f.other_game,v,'strong');raise exception 'FAIL non-FC';exception when raise_exception then if SQLERRM<>'FC individual tournament required' then raise;end if;end;
 eid:=(public.hub_register_fc(f.tournament,v,'strong')->>'id')::uuid;
 repeat_id:=(public.hub_register_fc(f.tournament,v,'strong')->>'id')::uuid;
 if repeat_id<>eid then raise exception 'FAIL duplicate';end if;
 if not exists(select 1 from public.hub_entries where id=eid and team_id is null and player_id=f.actor and skill_level='strong' and status='pending' and player_nickname='FC rollback player') then raise exception 'FAIL own individual snapshot';end if;
 if not exists(select 1 from public.hub_entry_players where entry_id=eid and user_id=f.actor) then raise exception 'FAIL roster snapshot';end if;
 if (select count(*) from public.hub_teams where captain_id=f.actor)<>0 then raise exception 'FAIL artificial team';end if;
 begin perform public.hub_register_fc(f.tournament,v,'amateur');raise exception 'FAIL changing level through duplicate';exception when raise_exception then if SQLERRM<>'A player is already registered' then raise;end if;end;
 perform set_config('request.jwt.claim.sub',f.other_user::text,true);
 repeat_id:=(public.hub_register_fc(f.tournament,v,'intermediate')->>'id')::uuid;
 if repeat_id=eid or not exists(select 1 from public.hub_entries where id=repeat_id and player_id=f.other_user) then raise exception 'FAIL user isolation';end if;
 begin update public.hub_entries set skill_level='strong' where id=eid;raise exception 'FAIL direct write';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claim.sub',f.actor::text,true);
 perform public.hub_ops_action('set_policy',jsonb_build_object('tournament_id',f.tournament,'body','Individual FC rollback award regulation','require_acceptance',false,'bronze','none'));
 perform public.hub_action('review_entry',jsonb_build_object('entry_id',eid,'status','approved'));
 perform public.hub_action('review_entry',jsonb_build_object('entry_id',repeat_id,'status','approved'));
 state_json:=jsonb_build_object('schema',1,'game','fc','entries',jsonb_build_array(eid,repeat_id),'config',jsonb_build_object('format','single','grandFinal','reset','bestOf',1,'fcScore','goals','groups','[]'::jsonb,'qualify',2,'points',jsonb_build_object('win',3,'draw',1,'loss',0)),'phase','playoffs','matches',jsonb_build_array(jsonb_build_object('id','U1.0','stage','upper','status','ready','sources',jsonb_build_array(jsonb_build_object('entry',eid),jsonb_build_object('entry',repeat_id)),'a',eid,'b',repeat_id)),'seeds',jsonb_build_array(eid,repeat_id),'champion',null);
 -- hub_engine_commit is service-only; validate using the test database owner below.
 perform set_config('deafhub.qa.state',state_json::text,true);
 perform set_config('deafhub.qa.entry_a',eid::text,true);
 perform set_config('deafhub.qa.entry_b',repeat_id::text,true);

end $$;
reset role;
do $$declare f record;s jsonb;eid uuid;other_id uuid;begin
 select * into f from fc_fixture;s:=current_setting('deafhub.qa.state')::jsonb;eid:=current_setting('deafhub.qa.entry_a')::uuid;other_id:=current_setting('deafhub.qa.entry_b')::uuid;
 perform public.hub_engine_commit(f.tournament,f.actor,0,gen_random_uuid(),'{"type":"launch"}',s);
 s:=jsonb_set(jsonb_set(s,'{phase}','"finished"'),'{champion}',to_jsonb(eid::text));
 s:=jsonb_set(s,'{matches,0}',(s#>'{matches,0}')||jsonb_build_object('status','finished','result',jsonb_build_object('kind','played','a',2,'b',1),'winner',eid,'loser',other_id));
 perform public.hub_engine_commit(f.tournament,f.actor,1,gen_random_uuid(),'{"type":"result"}',s);
 perform set_config('request.jwt.claim.sub',f.actor::text,true);
 perform public.hub_ops_action('issue_awards',jsonb_build_object('tournament_id',f.tournament));
 perform public.hub_ops_action('issue_awards',jsonb_build_object('tournament_id',f.tournament));
 if (select count(*) from public.hub_awards a join public.hub_award_batches b on b.id=a.batch_id where b.tournament_id=f.tournament)<>2 then raise exception 'FAIL solo award recipients or duplicate awards';end if;
 if exists(select 1 from public.hub_awards a join public.hub_award_batches b on b.id=a.batch_id where b.tournament_id=f.tournament and (a.team_name<>'' or a.recipient_id not in(f.actor,f.other_user))) then raise exception 'FAIL solo award identity or fictional team';end if;
end $$;
do $$begin if has_function_privilege('anon','public.hub_register_fc(uuid,uuid,text)','EXECUTE') or not has_function_privilege('authenticated','public.hub_register_fc(uuid,uuid,text)','EXECUTE') then raise exception 'FAIL function grants';end if;end $$;
rollback;
select 'PASS: auth, rules, game, levels, own snapshots, no fake teams, repeat, isolation, RLS, solo awards, no duplicate awards; rollback' as fc_registration_qa;
