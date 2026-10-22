-- Preview-only, optional personal check-in. No change to existing tournaments by default.
begin;
alter table public.hub_ops_audit add column details jsonb not null default '{}';
create table public.hub_checkin_windows (
 tournament_id uuid primary key references public.hub_tournaments(id),
 version uuid not null default gen_random_uuid(), enabled boolean not null,
 opens_at timestamptz, closes_at timestamptz,
 check(not enabled or (opens_at is not null and closes_at is not null and opens_at<closes_at))
);
create table public.hub_player_checkins (
 entry_id uuid not null, user_id uuid not null,
 window_version uuid not null, rules_version uuid not null, policy_version uuid,
 ready boolean not null, updated_at timestamptz not null default now(),
 primary key(entry_id,user_id),
 foreign key(entry_id,user_id) references public.hub_entry_players(entry_id,user_id)
);
alter table public.hub_checkin_windows enable row level security;
alter table public.hub_player_checkins enable row level security;
revoke all on public.hub_checkin_windows,public.hub_player_checkins from public,anon,authenticated;
grant select on public.hub_checkin_windows,public.hub_player_checkins to authenticated;
create policy checkin_window_read on public.hub_checkin_windows for select to authenticated using(true);
create policy checkin_private on public.hub_player_checkins for select to authenticated using(
 user_id=(select auth.uid()) or exists(select 1 from public.hub_entries e join public.hub_tournaments t on t.id=e.tournament_id where e.id=entry_id and t.organizer_id=(select auth.uid()))
);
create function public.hub_checkin_action(action text,p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();tid uuid;eid uuid;t public.hub_tournaments;w public.hub_checkin_windows;policy public.hub_participation_policies;opening timestamptz;closing timestamptz;active boolean;ready_value boolean;
begin
 if uid is null then raise exception 'Sign in required';end if;
 if action='check_in' then
  eid:=(p->>'entry_id')::uuid;select tournament_id into tid from public.hub_entries where id=eid;
 elsif action='configure' then tid:=(p->>'tournament_id')::uuid;
 else raise exception 'Unknown action';end if;
 select * into t from public.hub_tournaments where id=tid for update;
 if t.id is null then raise exception 'Tournament not found';end if;
 if t.status='finished' or exists(select 1 from public.hub_engines where tournament_id=tid) or exists(select 1 from public.hub_matches where tournament_id=tid) then raise exception 'Check-in is locked after launch';end if;
 select * into w from public.hub_checkin_windows where tournament_id=tid;
 select * into policy from public.hub_participation_policies where tournament_id=tid;
 if action='configure' then
  if t.organizer_id<>uid or not exists(select 1 from public.hub_organizers where user_id=uid) then raise exception 'Organizer required';end if;
  if coalesce(length(trim(p->>'reason')),0) not between 3 and 500 then raise exception 'Reason required';end if;
  active:=(p->>'enabled')::boolean;
  if active is null then raise exception 'Invalid check-in window';end if;
  if active then
   opening:=(p->>'opens_at')::timestamptz;closing:=(p->>'closes_at')::timestamptz;
   if opening is null or closing is null or not isfinite(opening) or not isfinite(closing) or opening>=closing or closing<=now() then raise exception 'Invalid check-in window';end if;
  end if;
  if w.enabled=active and w.opens_at is not distinct from opening and w.closes_at is not distinct from closing then return jsonb_build_object('saved',true);end if;
  insert into public.hub_checkin_windows(tournament_id,enabled,opens_at,closes_at) values(tid,active,opening,closing)
  on conflict(tournament_id) do update set enabled=excluded.enabled,opens_at=excluded.opens_at,closes_at=excluded.closes_at,version=gen_random_uuid();
 else
  if not exists(select 1 from public.hub_entries e join public.hub_entry_players ep on ep.entry_id=e.id where e.id=eid and e.status='approved' and ep.user_id=uid) then raise exception 'Approved registered player required';end if;
  if w.enabled is distinct from true or (p->>'window_version')::uuid is distinct from w.version then raise exception 'Refresh the check-in window';end if;
  ready_value:=(p->>'ready')::boolean;
  if ready_value is null then raise exception 'Invalid check-in';end if;
  if ready_value then
   if now()<w.opens_at or now()>=w.closes_at then raise exception 'Check-in window is closed';end if;
   if (select count(*) from public.hub_entry_players where entry_id=eid)<>t.roster_size then raise exception 'Registered roster is incomplete';end if;
   if policy.require_acceptance and not exists(select 1 from public.hub_entry_attestations where entry_id=eid and user_id=uid and policy_version=policy.version and accepted) then raise exception 'Confirm current participation rules first';end if;
  end if;
  if exists(select 1 from public.hub_player_checkins where entry_id=eid and user_id=uid and window_version=w.version and rules_version=t.rules_version and policy_version is not distinct from policy.version and ready=ready_value) then return jsonb_build_object('saved',true);end if;
  insert into public.hub_player_checkins(entry_id,user_id,window_version,rules_version,policy_version,ready) values(eid,uid,w.version,t.rules_version,policy.version,ready_value)
  on conflict(entry_id,user_id) do update set window_version=excluded.window_version,rules_version=excluded.rules_version,policy_version=excluded.policy_version,ready=excluded.ready,updated_at=now();
 end if;
 insert into public.hub_ops_audit(tournament_id,actor_id,action,entry_id,details) values(tid,uid,'checkin_'||action,eid,case when action='configure' then jsonb_build_object('reason',trim(p->>'reason'),'previous',to_jsonb(w),'enabled',active,'opens_at',opening,'closes_at',closing) else jsonb_build_object('ready',ready_value,'window_version',w.version) end);
 return jsonb_build_object('saved',true);
end $$;
revoke all on function public.hub_checkin_action(text,jsonb) from public,anon;
grant execute on function public.hub_checkin_action(text,jsonb) to authenticated;
create function public.hub_checkin_launch_guard() returns trigger
language plpgsql security definer set search_path='' as $$
declare t public.hub_tournaments;w public.hub_checkin_windows;pv uuid;
begin
 select * into t from public.hub_tournaments where id=new.tournament_id for update;
 select * into w from public.hub_checkin_windows where tournament_id=t.id;
 if w.enabled is distinct from true then return new;end if;
 select version into pv from public.hub_participation_policies where tournament_id=t.id;
 if now()<w.opens_at or exists(
  select 1 from public.hub_entries e where e.tournament_id=t.id and e.status='approved' and (
   e.rules_version<>t.rules_version or (select count(*) from public.hub_entry_players where entry_id=e.id)<>t.roster_size or exists(
    select 1 from public.hub_entry_players ep where ep.entry_id=e.id and not exists(
     select 1 from public.hub_player_checkins c where c.entry_id=e.id and c.user_id=ep.user_id and c.ready and c.window_version=w.version and c.rules_version=t.rules_version and c.policy_version is not distinct from pv
    )
   )
  )
 ) then raise exception 'Complete personal check-in before launch';end if;
 return new;
end $$;
revoke all on function public.hub_checkin_launch_guard() from public,anon,authenticated;
create trigger checkin_engine_launch before insert on public.hub_engines for each row execute function public.hub_checkin_launch_guard();
create trigger checkin_manual_launch before insert on public.hub_matches for each row execute function public.hub_checkin_launch_guard();
notify pgrst,'reload schema';
commit;
