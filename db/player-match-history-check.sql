-- Isolated test only. Executed by scripts/local-history-sql-check.mjs.
begin;
create temp table history_fixture(me uuid,foe uuid,other_user uuid,tid uuid,engine_tid uuid,e_me uuid,e_foe uuid,e_other uuid,engine_me uuid,engine_foe uuid,team_me uuid,team_foe uuid,team_other uuid);
insert into history_fixture select gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid();
insert into auth.users(id,email,aud,role) select id,id::text||'@deafhub-test.invalid','authenticated','authenticated' from (select me id from history_fixture union all select foe from history_fixture union all select other_user from history_fixture) u;
insert into public.profiles(id,nickname,region) select id,'History QA','europe' from (select me id from history_fixture union all select foe from history_fixture union all select other_user from history_fixture) u;
insert into public.hub_organizers select me from history_fixture union all select foe from history_fixture;
insert into public.hub_teams(id,name,game,captain_id) select team_me,'History QA Me','cs2',me from history_fixture union all select team_foe,'History QA Foe','cs2',foe from history_fixture union all select team_other,'History QA Other','cs2',other_user from history_fixture;
insert into public.hub_tournaments(id,title,game,organizer_id,starts_at,rules,roster_size) select tid,'Manual history QA','cs2',me,'2020-01-01'::timestamptz,'Isolated history test only regulation',1 from history_fixture union all select engine_tid,'Engine history QA','cs2',foe,'2020-01-01'::timestamptz,'Isolated history test only regulation',1 from history_fixture;
insert into public.hub_entries(id,tournament_id,team_id,rules_version,status) select e_me,f.tid,team_me,t.rules_version,'approved' from history_fixture f join public.hub_tournaments t on t.id=f.tid union all select e_foe,f.tid,team_foe,t.rules_version,'approved' from history_fixture f join public.hub_tournaments t on t.id=f.tid union all select e_other,f.tid,team_other,t.rules_version,'approved' from history_fixture f join public.hub_tournaments t on t.id=f.tid union all select engine_me,f.engine_tid,team_me,t.rules_version,'approved' from history_fixture f join public.hub_tournaments t on t.id=f.engine_tid union all select engine_foe,f.engine_tid,team_foe,t.rules_version,'approved' from history_fixture f join public.hub_tournaments t on t.id=f.engine_tid;
insert into public.hub_entry_players(entry_id,user_id,nickname) select e_me,me,'Registered me' from history_fixture union all select e_foe,foe,'Registered foe' from history_fixture union all select e_other,other_user,'Registered other' from history_fixture union all select engine_me,me,'Registered me' from history_fixture union all select engine_foe,foe,'Registered foe' from history_fixture;
-- A real old row before the new column/trigger exists. Migration must not date it now.
insert into public.hub_matches(id,tournament_id,entry_a,entry_b,starts_at,score_a,score_b,status) select '20000000-0000-4000-8000-000000000001',tid,e_me,e_foe,'2020-02-01',1,0,'finished' from history_fixture;
-- MIGRATE_HISTORY
insert into public.hub_matches(tournament_id,entry_a,entry_b,starts_at,score_a,score_b,status) select tid,e_me,e_foe,'2021-01-01'::timestamptz+make_interval(secs=>n),1,0,'finished' from history_fixture cross join generate_series(1,520) n;
insert into public.hub_matches(tournament_id,entry_a,entry_b,starts_at,score_a,score_b,status) select tid,e_foe,e_other,'2022-01-01'::timestamptz+make_interval(secs=>n),1,0,'finished' from history_fixture cross join generate_series(1,600) n;
insert into public.hub_matches(tournament_id,entry_a,entry_b,starts_at) select tid,e_me,e_foe,'2026-01-01' from history_fixture;
-- BUILD_ENGINE
create temp table history_seen(match_id text primary key);
grant select on history_fixture to authenticated;
grant select,insert on history_seen to authenticated;
set local role authenticated;
do $$declare f record;r record;n integer;last_at timestamptz;last_key text;page_count integer:=0;begin
 select * into f from history_fixture;
 perform set_config('request.jwt.claim.sub','',true);
 begin perform public.hub_player_match_history();raise exception 'FAIL guest';exception when raise_exception then if SQLERRM<>'Sign in required' then raise;end if;end;
 perform set_config('request.jwt.claim.sub',f.me::text,true);
 begin perform public.hub_player_match_history(null,null,1000);raise exception 'FAIL unbounded page';exception when raise_exception then if SQLERRM<>'Invalid history page' then raise;end if;end;
 begin perform public.hub_player_match_history(now(),null,20);raise exception 'FAIL partial cursor';exception when raise_exception then if SQLERRM<>'Invalid history page' then raise;end if;end;
 if (select count(*) from public.hub_engine_audit)<>0 then raise exception 'FAIL audit should remain organizer-only';end if;
 loop
  n:=0;
  for r in select * from public.hub_player_match_history(last_at,last_key,20) limit 20 loop
   insert into history_seen values(r.match_id);last_at:=r.sort_at;last_key:=r.sort_key;n:=n+1;
   if r.match_id=f.engine_tid::text||'/U1.0' and r.confirmed_at is distinct from '2025-01-01'::timestamptz then raise exception 'FAIL correction did not use latest audit revision';end if;
   if r.source='engine' and r.confirmed_at is null then raise exception 'FAIL player cannot see minimal confirmation time';end if;
   if r.result_kind='forfeit' and (r.score_a is not null or r.score_b is not null) then raise exception 'FAIL invented forfeit score';end if;
  end loop;
  page_count:=page_count+1;exit when n=0;
  if page_count>40 then raise exception 'FAIL cursor does not progress';end if;
 end loop;
 if (select count(*) from history_seen)<>523 then raise exception 'FAIL full archive count: %',(select count(*) from history_seen);end if;
 if (select count(*) from public.hub_player_match_history(null,null,50))<>51 then raise exception 'FAIL lookahead bound';end if;
 if exists(select 1 from public.hub_player_match_history(null,null,50) h where h.player_a='History QA Other' or h.player_b='History QA Other') then raise exception 'FAIL foreign matches';end if;
 perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 if exists(select 1 from public.hub_player_match_history()) then raise exception 'FAIL outsider history leaked';end if;
end $$;
reset role;
do $$declare known timestamptz;mid uuid;begin
 if (select confirmed_at from public.hub_matches where id='20000000-0000-4000-8000-000000000001') is not null then raise exception 'FAIL invented legacy confirmation';end if;
 select id,confirmed_at into mid,known from public.hub_matches where status='finished' and id<>'20000000-0000-4000-8000-000000000001' limit 1;
 if known is null then raise exception 'FAIL missing new confirmation';end if;
 update public.hub_matches set confirmed_at='1999-01-01' where id=mid;
 if (select confirmed_at from public.hub_matches where id=mid) is distinct from known then raise exception 'FAIL confirmation timestamp overwritten';end if;
 if has_function_privilege('anon','public.hub_player_match_history(timestamptz,text,integer)','execute') then raise exception 'FAIL anon execute';end if;
end $$;
rollback;
select 'PASS: 523 own matches across pages, foreign/scheduled excluded, audit private, confirmation dates, no invented old dates, ACL, rollback' as history_qa;
