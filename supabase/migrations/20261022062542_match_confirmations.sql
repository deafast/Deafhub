-- Optional dual-captain confirmation, private evidence and tournament-scoped judges.
begin;
create table public.hub_result_rules(tournament_id uuid primary key references public.hub_tournaments(id),require_confirmation boolean not null);
create table public.hub_referees(tournament_id uuid not null references public.hub_tournaments(id),user_id uuid not null references auth.users(id),primary key(tournament_id,user_id));
create table public.hub_result_reports(
 id uuid primary key default gen_random_uuid(),sequence bigint generated always as identity unique,
 tournament_id uuid not null references public.hub_tournaments(id),match_id text not null check(length(match_id) between 1 and 64),
 fingerprint text not null,result jsonb not null,author_id uuid not null references auth.users(id),
 evidence text not null default '' check(length(evidence)<=2000),created_at timestamptz not null default now(),
 decided_by uuid references auth.users(id),decision_reason text,decided_at timestamptz
);
create index hub_result_reports_match on public.hub_result_reports(tournament_id,match_id,sequence desc);
create table public.hub_result_confirmations(
 report_id uuid not null references public.hub_result_reports(id),entry_id uuid not null references public.hub_entries(id),
 actor_id uuid not null references auth.users(id),accepted boolean not null,reason text not null default '' check(length(reason)<=2000),
 updated_at timestamptz not null default now(),primary key(report_id,entry_id)
);
-- Narrow authorization helper; it never grants writes or exposes arbitrary user records.
create function public.hub_match_reader(tid uuid,mid text) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (
  exists(select 1 from public.hub_tournaments where id=tid and organizer_id=auth.uid()) or
  exists(select 1 from public.hub_referees where tournament_id=tid and user_id=auth.uid()) or
  exists(select 1 from public.hub_engines e cross join lateral jsonb_array_elements(e.state->'matches') m join public.hub_entry_players ep on ep.entry_id::text in(m->>'a',m->>'b') where e.tournament_id=tid and m->>'id'=mid and ep.user_id=auth.uid())
 );
$$;
revoke all on function public.hub_match_reader(uuid,text) from public,anon;
grant execute on function public.hub_match_reader(uuid,text) to authenticated;
do $$declare n text;begin foreach n in array array['hub_result_rules','hub_referees','hub_result_reports','hub_result_confirmations'] loop
 execute format('alter table public.%I enable row level security',n);execute format('revoke all on public.%I from public,anon,authenticated',n);execute format('grant select on public.%I to authenticated',n);
end loop;end $$;
create policy result_rules_read on public.hub_result_rules for select to authenticated using(true);
create policy referee_read on public.hub_referees for select to authenticated using(user_id=(select auth.uid()) or exists(select 1 from public.hub_tournaments where id=tournament_id and organizer_id=(select auth.uid())));
create policy reports_private on public.hub_result_reports for select to authenticated using(public.hub_match_reader(tournament_id,match_id));
create policy confirmations_private on public.hub_result_confirmations for select to authenticated using(exists(select 1 from public.hub_result_reports r where r.id=report_id and public.hub_match_reader(r.tournament_id,r.match_id)));
create view public.hub_current_result_reports with(security_invoker=true) as select distinct on(r.tournament_id,r.match_id) r.*,r.fingerprint=md5((m-'scheduledAt')::text) is_current from public.hub_result_reports r join public.hub_engines e on e.tournament_id=r.tournament_id cross join lateral jsonb_array_elements(e.state->'matches') m where m->>'id'=r.match_id order by r.tournament_id,r.match_id,r.sequence desc;
revoke all on public.hub_current_result_reports from public,anon;
grant select on public.hub_current_result_reports to authenticated;
create function public.hub_result_action(action text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();tid uuid;t public.hub_tournaments;engine public.hub_engines;m jsonb;report public.hub_result_reports;eid uuid;is_owner boolean;is_captain boolean;fingerprint_value text;rid uuid;target uuid;
begin
 if uid is null then raise exception 'Sign in required';end if;
 tid:=(p->>'tournament_id')::uuid;
 select * into t from public.hub_tournaments where id=tid for update;
 if t.id is null then raise exception 'Tournament not found';end if;
 is_owner:=t.organizer_id=uid and exists(select 1 from public.hub_organizers where user_id=uid);
 select * into engine from public.hub_engines where tournament_id=tid;
 if action='configure' then
  if not is_owner then raise exception 'Organizer required';end if;
  if engine.tournament_id is not null or exists(select 1 from public.hub_matches where tournament_id=tid) or t.status='finished' then raise exception 'Result rules are locked';end if;
  insert into public.hub_result_rules values(tid,(p->>'required')::boolean) on conflict(tournament_id) do update set require_confirmation=excluded.require_confirmation;
 elsif action='assign_referee' then
  if not is_owner then raise exception 'Organizer required';end if;
  target:=(p->>'user_id')::uuid;
  -- Only already registered participants can be selected; no global organizer grant.
  if (p->>'enabled')::boolean and not exists(select 1 from public.hub_entry_players ep join public.hub_entries e on e.id=ep.entry_id where e.tournament_id=tid and ep.user_id=target) then raise exception 'Registered participant required';end if;
  if (p->>'enabled')::boolean then insert into public.hub_referees values(tid,target) on conflict do nothing;
  else delete from public.hub_referees where tournament_id=tid and user_id=target;end if;
 else
  select item into m from jsonb_array_elements(engine.state->'matches') item where item->>'id'=p->>'match_id';
  if m is null or m->>'a' is null or m->>'b' is null or m->>'status' not in('ready','finished') then raise exception 'Playable match required';end if;
  if exists(select 1 from public.hub_award_batches where tournament_id=tid and status='issued') then raise exception 'Revoke awards before correcting results';end if;
  fingerprint_value:=md5((m-'scheduledAt')::text);
  eid:=(p->>'entry_id')::uuid;
  is_captain:=eid::text in(m->>'a',m->>'b') and exists(
   select 1 from public.hub_entries e join public.hub_entry_players ep on ep.entry_id=e.id left join public.hub_teams team on team.id=e.team_id
   where e.id=eid and ep.user_id=uid and (e.player_id=uid or team.captain_id=uid)
  );
  select * into report from public.hub_result_reports where tournament_id=tid and match_id=p->>'match_id' order by sequence desc limit 1;
  if action='submit' then
   if not coalesce(is_captain,false) then raise exception 'Match captain required';end if;
   if p->'result'->>'kind' is distinct from 'played' or jsonb_typeof(p->'result'->'a') is distinct from 'number' or jsonb_typeof(p->'result'->'b') is distinct from 'number' or (p->'result'->>'a')::numeric not between 0 and 1000 or (p->'result'->>'b')::numeric not between 0 and 1000 or (p->'result'->>'a')::numeric<>trunc((p->'result'->>'a')::numeric) or (p->'result'->>'b')::numeric<>trunc((p->'result'->>'b')::numeric) then raise exception 'Invalid result report';end if;
   if coalesce(length(p->>'evidence'),0)>2000 then raise exception 'Evidence is too long';end if;
   -- Identical retransmission preserves the existing report and second captain's vote.
   if report.id is not null and report.fingerprint=fingerprint_value and report.result=p->'result' and report.author_id=uid and report.evidence=coalesce(p->>'evidence','') then return jsonb_build_object('saved',true,'report_id',report.id);end if;
   insert into public.hub_result_reports(tournament_id,match_id,fingerprint,result,author_id,evidence) values(tid,p->>'match_id',fingerprint_value,p->'result',uid,coalesce(p->>'evidence','')) returning id into rid;
   insert into public.hub_result_confirmations(report_id,entry_id,actor_id,accepted) values(rid,eid,uid,true);
  elsif action in('confirm','decide') then
   if report.id is null or report.id is distinct from (p->>'report_id')::uuid or report.fingerprint<>fingerprint_value then raise exception 'Report changed; refresh the match';end if;
   rid:=report.id;
   if action='confirm' then
    if not coalesce(is_captain,false) then raise exception 'Match captain required';end if;
    if not (p->>'accepted')::boolean and coalesce(length(trim(p->>'reason')),0)<3 then raise exception 'Explain the dispute';end if;
    insert into public.hub_result_confirmations(report_id,entry_id,actor_id,accepted,reason) values(rid,eid,uid,(p->>'accepted')::boolean,coalesce(p->>'reason',''))
    on conflict(report_id,entry_id) do update set actor_id=excluded.actor_id,accepted=excluded.accepted,reason=excluded.reason,updated_at=now();
    -- A new objection invalidates an earlier ruling, requiring a new decision.
    if not (p->>'accepted')::boolean then update public.hub_result_reports set decided_by=null,decision_reason=null,decided_at=null where id=rid;end if;
   else
    if not is_owner and not exists(select 1 from public.hub_referees where tournament_id=tid and user_id=uid) then raise exception 'Referee required';end if;
    if exists(select 1 from public.hub_entry_players where entry_id::text in(m->>'a',m->>'b') and user_id=uid) then raise exception 'A participant cannot adjudicate their match';end if;
    if coalesce(length(trim(p->>'reason')),0) not between 3 and 2000 then raise exception 'Explain the decision';end if;
    update public.hub_result_reports set decided_by=uid,decision_reason=trim(p->>'reason'),decided_at=now() where id=rid;
   end if;
  else raise exception 'Unknown action';end if;
 end if;
 insert into public.hub_ops_audit(tournament_id,actor_id,action,entry_id,details) values(tid,uid,'result_'||action,eid,jsonb_build_object('match_id',p->>'match_id','report_id',rid,'reason',p->>'reason','required',p->'required','referee_id',target,'enabled',p->'enabled','accepted',p->'accepted'));
 return jsonb_build_object('saved',true,'report_id',rid);
end $$;
revoke all on function public.hub_result_action(text,jsonb) from public,anon;
grant execute on function public.hub_result_action(text,jsonb) to authenticated;
-- Same transaction and tournament lock as CAS. Legacy tournaments remain unchanged.
create function public.hub_result_commit_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare command jsonb;m jsonb;report public.hub_result_reports;
begin
 select a.command into command from public.hub_engine_audit a where a.tournament_id=new.tournament_id and a.revision=new.revision;
 -- Audit is inserted after the engine UPDATE, so use a deferred constraint trigger.
 if command->>'type' is distinct from 'result' then return new;end if;
 if not exists(select 1 from public.hub_result_rules where tournament_id=new.tournament_id and require_confirmation) then return new;end if;
 -- Forfeit is an explicit, reasoned organizer ruling, never an invented played score.
 if command->'result'->>'kind'='forfeit' and length(trim(command->>'reason'))>=3 then return new;end if;
 select x into m from jsonb_array_elements(old.state->'matches') x where x->>'id'=command->>'match';
 select * into report from public.hub_result_reports where tournament_id=new.tournament_id and match_id=command->>'match' order by sequence desc limit 1;
 if report.id is null or report.fingerprint<>md5((m-'scheduledAt')::text) or report.result is distinct from command->'result' or (
  report.decided_by is null and (select count(*) from public.hub_result_confirmations c where c.report_id=report.id and c.accepted and c.entry_id::text in(m->>'a',m->>'b'))<>2
 ) then raise exception 'Both captains must confirm the current result or a referee must decide';end if;
 return new;
end $$;
revoke all on function public.hub_result_commit_guard() from public,anon,authenticated;
create constraint trigger result_confirmation_guard after update on public.hub_engines deferrable initially deferred for each row execute function public.hub_result_commit_guard();
notify pgrst,'reload schema';
commit;
