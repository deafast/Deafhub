-- Additive migration. Existing manual tournaments are unchanged.
begin;
create table public.hub_engines (
 tournament_id uuid primary key references public.hub_tournaments(id),
 revision integer not null check(revision>0),
 state jsonb not null check(state->>'schema'='1'),
 updated_at timestamptz not null default now()
);
create table public.hub_engine_audit (
 tournament_id uuid not null references public.hub_engines(tournament_id),
 request_id uuid not null,
 actor_id uuid not null references auth.users(id),
 revision integer not null,
 command jsonb not null,
 created_at timestamptz not null default now(),
 primary key(tournament_id,request_id), unique(tournament_id,revision)
);
alter table public.hub_engines enable row level security;
alter table public.hub_engine_audit enable row level security;
revoke all on public.hub_engines, public.hub_engine_audit from public,anon,authenticated;
grant select on public.hub_engines,public.hub_engine_audit to authenticated;
grant all on public.hub_engines,public.hub_engine_audit to service_role;
create policy engine_read on public.hub_engines for select to authenticated using(true);
create policy engine_audit_owner on public.hub_engine_audit for select to authenticated using(exists(select 1 from public.hub_tournaments t where t.id=tournament_id and t.organizer_id=(select auth.uid())));

-- Trusted server computes the graph. This RPC cannot be called with an end-user JWT.
-- It independently enforces ownership, immutable entrants/config and optimistic locking.
create function public.hub_engine_commit(tid uuid, actor uuid, expected integer, request_id uuid, command jsonb, next_state jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t public.hub_tournaments; e public.hub_engines; prior public.hub_engine_audit; ids jsonb; n integer;
begin
 select * into t from public.hub_tournaments where id=tid for update;
 if t.id is null or t.organizer_id<>actor or not exists(select 1 from public.hub_organizers where user_id=actor) then raise exception 'Organizer required';end if;
 select * into prior from public.hub_engine_audit a where a.tournament_id=tid and a.request_id=hub_engine_commit.request_id;
 if prior.request_id is not null then
  if prior.actor_id<>actor or prior.command<>command then raise exception 'Idempotency key reused';end if;
  return (select jsonb_build_object('revision',revision,'state',state) from public.hub_engines where tournament_id=tid);
 end if;
 select * into e from public.hub_engines where tournament_id=tid;
 if coalesce(e.revision,0)<>expected then raise exception 'Revision conflict';end if;
 if jsonb_typeof(next_state)<>'object' or next_state->>'schema'<>'1' or next_state->>'game'<>t.game or octet_length(next_state::text)>2000000 then raise exception 'Invalid engine state';end if;
 if e.tournament_id is null then
  if command->>'type'<>'launch' or t.status='finished' or exists(select 1 from public.hub_matches where tournament_id=tid) or exists(select 1 from public.hub_entries where tournament_id=tid and status='pending') then raise exception 'Review entries and remove manual scheduling before launch';end if;
  select jsonb_agg(id::text order by id::text),count(*) into ids,n from public.hub_entries where tournament_id=tid and status='approved';
  if n<2 or n>64 or ids is distinct from (select jsonb_agg(value order by value) from jsonb_array_elements_text(next_state->'entries')) then raise exception 'Approved entries changed';end if;
 else
  if next_state->'entries'<>e.state->'entries' or next_state->'config'<>e.state->'config' then raise exception 'Tournament rules are locked';end if;
 end if;
 insert into public.hub_engines(tournament_id,revision,state) values(tid,expected+1,next_state)
 on conflict(tournament_id) do update set revision=excluded.revision,state=excluded.state,updated_at=now();
 insert into public.hub_engine_audit(tournament_id,request_id,actor_id,revision,command) values(tid,request_id,actor,expected+1,command);
 update public.hub_tournaments set status=case when next_state->>'phase'='finished' then 'finished' else 'closed' end where id=tid;
 return jsonb_build_object('revision',expected+1,'state',next_state);
end $$;
revoke all on function public.hub_engine_commit(uuid,uuid,integer,uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.hub_engine_commit(uuid,uuid,integer,uuid,jsonb,jsonb) to service_role;

-- Legacy hub_action remains usable for manual tournaments, but cannot change
-- engine entrants/results or finish an unfinished graph behind the engine's back.
create function public.hub_engine_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare tid uuid; s jsonb;
begin
 if tg_table_name='hub_tournaments' then
  select state into s from public.hub_engines where tournament_id=new.id;
  if s is not null and (new.status='open' or (new.status='finished' and s->>'phase'<>'finished') or new.rules<>old.rules or new.rules_version<>old.rules_version or new.game<>old.game or new.roster_size<>old.roster_size or new.organizer_id<>old.organizer_id) then raise exception 'Use tournament engine';end if;
 else
  tid=case when tg_op='DELETE' then old.tournament_id else new.tournament_id end;
  perform 1 from public.hub_tournaments where id=tid for update;
  if exists(select 1 from public.hub_engines where tournament_id=tid) then raise exception 'Use tournament engine';end if;
 end if;
 if tg_op='DELETE' then return old;end if;return new;
end $$;
revoke all on function public.hub_engine_guard() from public,anon,authenticated;
create trigger engine_entries_guard before insert or update or delete on public.hub_entries for each row execute function public.hub_engine_guard();
create trigger engine_matches_guard before insert or update or delete on public.hub_matches for each row execute function public.hub_engine_guard();
create trigger engine_tournament_guard before update on public.hub_tournaments for each row execute function public.hub_engine_guard();
-- BYE/skipped nodes are excluded; forfeits never invent score statistics.
create view public.hub_all_player_stats with(security_invoker=true) as
 with results as (
  select ep.user_id,case when (m.entry_a=ep.entry_id and m.score_a>m.score_b) or (m.entry_b=ep.entry_id and m.score_b>m.score_a) then 1 else 0 end win,0 draw
  from public.hub_entry_players ep join public.hub_matches m on ep.entry_id in(m.entry_a,m.entry_b) where m.status='finished'
  union all
  select ep.user_id,case when m->>'winner'=ep.entry_id::text then 1 else 0 end,case when m->>'winner' is null then 1 else 0 end
  from public.hub_engines e cross join lateral jsonb_array_elements(e.state->'matches') m
  join public.hub_entry_players ep on ep.entry_id::text in(m->>'a',m->>'b') where m->>'status'='finished'
 ) select user_id,count(*)::integer matches,sum(win)::integer wins,sum(draw)::integer draws from results group by user_id;
revoke all on public.hub_all_player_stats from public,anon;
grant select on public.hub_all_player_stats to authenticated;
notify pgrst,'reload schema';
commit;
