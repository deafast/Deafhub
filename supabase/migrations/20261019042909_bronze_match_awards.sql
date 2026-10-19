-- Preview additive upgrade. No tournaments, users, grants or policies are created.
-- Baseline hashes prevent overwriting an independently modified function.
do $$begin
 if md5(pg_get_functiondef('public.hub_ops_action(text,jsonb)'::regprocedure))<>'56d655d1a1144bb701284f1767406b72' or md5(pg_get_functiondef('public.hub_participation_guard()'::regprocedure))<>'70381380ab12c5607f785ab127df675d' then raise exception 'Tournament operations changed; review migration baseline';end if;
end $$;
alter table public.hub_participation_policies drop constraint hub_participation_policies_bronze_check;
alter table public.hub_participation_policies add constraint hub_participation_policies_bronze_check check(bronze in ('none','shared_semifinal','lower_final','bronze_match'));

create or replace function public.hub_ops_action(action text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();tid uuid;eid uuid; t public.hub_tournaments;policy public.hub_participation_policies;engine public.hub_engines;bid uuid;ranked record;player record;avatar text;last_match jsonb;placements jsonb:='[]';bronze_entry text;
begin
 if uid is null then raise exception 'Sign in required';end if;
 if p ? 'entry_id' then eid:=(p->>'entry_id')::uuid;select tournament_id into tid from public.hub_entries where id=eid;else tid:=(p->>'tournament_id')::uuid;end if;
 select * into t from public.hub_tournaments where id=tid for update;
 if t.id is null then raise exception 'Tournament not found';end if;
 select * into policy from public.hub_participation_policies where tournament_id=tid;
 select * into engine from public.hub_engines where tournament_id=tid;
 if action in ('set_policy','review_eligibility','issue_awards','revoke_awards') and (t.organizer_id<>uid or not exists(select 1 from public.hub_organizers where user_id=uid)) then raise exception 'Organizer required';end if;
 if action='set_policy' then
  if engine.tournament_id is not null or t.status='finished' then raise exception 'Participation rules are locked';end if;
  if policy.body=p->>'body' and policy.require_acceptance=(p->>'require_acceptance')::boolean and policy.bronze=p->>'bronze' then return jsonb_build_object('saved',true);end if;
  insert into public.hub_participation_policies(tournament_id,body,require_acceptance,bronze) values(tid,p->>'body',(p->>'require_acceptance')::boolean,p->>'bronze')
  on conflict(tournament_id) do update set body=excluded.body,require_acceptance=excluded.require_acceptance,bronze=excluded.bronze,version=gen_random_uuid(),updated_at=now();
 elsif action='attest' then
  if engine.tournament_id is not null or t.status='finished' then raise exception 'Participation rules are locked';end if;
  if not exists(select 1 from public.hub_entry_players where entry_id=eid and user_id=uid) then raise exception 'Registered player required';end if;
  if policy.tournament_id is null or (p->>'policy_version')::uuid is distinct from policy.version then raise exception 'Read the current participation rules';end if;
  insert into public.hub_entry_attestations(entry_id,user_id,policy_version,accepted) values(eid,uid,policy.version,(p->>'accepted')::boolean)
  on conflict(entry_id,user_id) do update set policy_version=excluded.policy_version,accepted=excluded.accepted,updated_at=now();
 elsif action='review_eligibility' then
  if engine.tournament_id is not null or t.status='finished' then raise exception 'Participation rules are locked';end if;
  if policy.tournament_id is null or (p->>'policy_version')::uuid is distinct from policy.version then raise exception 'Read the current participation rules';end if;
  insert into public.hub_eligibility_reviews(entry_id,policy_version,approved,reason,actor_id) values(eid,policy.version,(p->>'approved')::boolean,p->>'reason',uid)
  on conflict(entry_id) do update set policy_version=excluded.policy_version,approved=excluded.approved,reason=excluded.reason,actor_id=uid,updated_at=now();
 elsif action='issue_awards' then
  if t.status<>'finished' or engine.state->>'phase' is distinct from 'finished' or engine.state->>'champion' is null then raise exception 'Finish the tournament first';end if;
  if policy.tournament_id is null then raise exception 'Publish award rules before launch';end if;
  select id into bid from public.hub_award_batches where tournament_id=tid and engine_revision=engine.revision;
  if bid is not null then return jsonb_build_object('batch_id',bid);end if;
  select m into last_match from jsonb_array_elements(engine.state->'matches') with ordinality x(m,n) where m->>'stage' in ('upper','final','reset') order by n desc limit 1;
  placements:=jsonb_build_array(jsonb_build_object('entry',engine.state->>'champion','place',1),jsonb_build_object('entry',last_match->>'loser','place',2));
  if policy.bronze='shared_semifinal' then
   if engine.state->'config'->>'format'<>'single' then raise exception 'Third-place rule does not match the format';end if;
   for ranked in select m from jsonb_array_elements(engine.state->'matches') m where m->>'id' in(select s->>'match' from jsonb_array_elements(last_match->'sources') s where s ? 'match') loop
    if ranked.m->>'loser' is not null then placements:=placements||jsonb_build_array(jsonb_build_object('entry',ranked.m->>'loser','place',3));end if;
   end loop;
  elsif policy.bronze='bronze_match' then
   if engine.state->'config'->>'format'<>'single' or coalesce(engine.state->'config'->>'bronzeMatch','false')<>'true' then raise exception 'Third-place rule does not match the format';end if;
   select m->>'winner' into bronze_entry from jsonb_array_elements(engine.state->'matches') m where m->>'id'='BR1' and m->>'stage'='bronze' and m->>'status'='finished';
   if bronze_entry is null then raise exception 'Finish the bronze match first';end if;
   placements:=placements||jsonb_build_array(jsonb_build_object('entry',bronze_entry,'place',3));
  elsif policy.bronze='lower_final' then
   if engine.state->'config'->>'format'<>'double' then raise exception 'Third-place rule does not match the format';end if;
   select m->>'loser' into bronze_entry from jsonb_array_elements(engine.state->'matches') with ordinality x(m,n) where m->>'stage'='lower' and m->>'loser' is not null order by n desc limit 1;
   if bronze_entry is not null then placements:=placements||jsonb_build_array(jsonb_build_object('entry',bronze_entry,'place',3));end if;
  end if;
  if exists(select 1 from jsonb_array_elements(placements) r group by r->>'entry' having count(*)>1) or exists(select 1 from jsonb_array_elements(placements) r where r->>'entry' is null) then raise exception 'Placements are incomplete';end if;
  insert into public.hub_award_batches(tournament_id,engine_revision,issued_by) values(tid,engine.revision,uid) returning id into bid;
  for ranked in select (r->>'entry')::uuid entry_id,(r->>'place')::int place from jsonb_array_elements(placements) r loop
   if not exists(select 1 from public.hub_entries where id=ranked.entry_id and tournament_id=tid and status='approved') then raise exception 'Invalid award entry';end if;
   if (select count(*) from public.hub_entry_players where entry_id=ranked.entry_id)<>t.roster_size then raise exception 'Registered roster is incomplete';end if;
   for player in select ep.user_id,coalesce(pr.nickname,ep.nickname) nickname,team.name,u.raw_user_meta_data->>'avatar_url' avatar from public.hub_entry_players ep join public.hub_entries e on e.id=ep.entry_id join public.hub_teams team on team.id=e.team_id join auth.users u on u.id=ep.user_id left join public.profiles pr on pr.id=ep.user_id where ep.entry_id=ranked.entry_id loop
    avatar:=case when player.avatar ~ '^https://(lh[3-6]\.googleusercontent\.com|avatars\.steamstatic\.com|avatars\.akamai\.steamstatic\.com|avatars\.githubusercontent\.com)/[^[:space:]]+$' then player.avatar else null end;
    insert into public.hub_awards(batch_id,entry_id,recipient_id,place,game,tournament_title,team_name,nickname,avatar_url) values(bid,ranked.entry_id,player.user_id,ranked.place,t.game,t.title,player.name,player.nickname,avatar);
   end loop;
  end loop;
 elsif action='revoke_awards' then
  if coalesce(char_length(trim(p->>'reason')),0) not between 3 and 500 then raise exception 'Reason required';end if;
  update public.hub_award_batches set status='revoked',revoked_at=now(),revoke_reason=p->>'reason' where tournament_id=tid and status='issued';
 else raise exception 'Unknown action';end if;
 insert into public.hub_ops_audit(tournament_id,actor_id,action,entry_id) values(tid,uid,action,eid);
 return jsonb_build_object('saved',true,'batch_id',bid);
end $$;
revoke all on function public.hub_ops_action(text,jsonb) from public,anon;
grant execute on function public.hub_ops_action(text,jsonb) to authenticated;

create or replace function public.hub_participation_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare tid uuid;entry_target uuid;policy public.hub_participation_policies; e record;
begin
 if tg_table_name='hub_engines' then
  tid:=new.tournament_id;
  if tg_op='UPDATE' and exists(select 1 from public.hub_award_batches where tournament_id=tid and status='issued') then raise exception 'Revoke awards before correcting results';end if;
  if tg_op='UPDATE' then return new;end if;
  select * into policy from public.hub_participation_policies where tournament_id=tid;
  if policy.tournament_id is null then raise exception 'Publish participation and award rules before launch';end if;
  if (policy.bronze='shared_semifinal' and new.state->'config'->>'format'<>'single') or (policy.bronze='lower_final' and new.state->'config'->>'format'<>'double') then raise exception 'Third-place rule does not match the format';end if;
  if policy.bronze='bronze_match' then
   if new.state->'config'->>'format'<>'single' or coalesce(new.state->'config'->>'bronzeMatch','false')<>'true' or (new.state->>'phase'<>'groups' and not exists(select 1 from jsonb_array_elements(new.state->'matches') m where m->>'id'='BR1' and m->>'stage'='bronze')) then raise exception 'Third-place rule does not match the format';end if;
  elsif coalesce(new.state->'config'->>'bronzeMatch','false')='true' or exists(select 1 from jsonb_array_elements(new.state->'matches') m where m->>'stage'='bronze') then raise exception 'Third-place rule does not match the format';end if;
 else
  if new.status<>'approved' then return new;end if;
  tid:=new.tournament_id;entry_target:=new.id;select * into policy from public.hub_participation_policies where tournament_id=tid;
 end if;
 if policy.require_acceptance then
  for e in select id from public.hub_entries where tournament_id=tid and ((tg_table_name='hub_engines' and status='approved') or (tg_table_name='hub_entries' and id=entry_target)) loop
   if not exists(select 1 from public.hub_eligibility_reviews where entry_id=e.id and policy_version=policy.version and approved) or not exists(select 1 from public.hub_entry_players where entry_id=e.id) or exists(select 1 from public.hub_entry_players ep where ep.entry_id=e.id and not exists(select 1 from public.hub_entry_attestations a where a.entry_id=ep.entry_id and a.user_id=ep.user_id and a.policy_version=policy.version and a.accepted)) then raise exception 'Complete player confirmations and organizer review first';end if;
  end loop;
 end if;
 return new;
end $$;
revoke all on function public.hub_participation_guard() from public,anon,authenticated;

notify pgrst,'reload schema';
