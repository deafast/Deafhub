-- Optional auto-admission, explicitly enabled by the tournament organizer.
begin;
create table public.hub_admission_rules (
 tournament_id uuid primary key references public.hub_tournaments(id),
 enabled boolean not null default false
);
alter table public.hub_admission_rules enable row level security;
revoke all on public.hub_admission_rules from public,anon,authenticated;
grant select on public.hub_admission_rules to authenticated;
create policy admission_rules_read on public.hub_admission_rules for select to authenticated using(true);
create function public.hub_try_auto_admit(eid uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare t public.hub_tournaments;e public.hub_entries;policy public.hub_participation_policies;review public.hub_eligibility_reviews;uid uuid:=auth.uid();
begin
 if uid is null then return false;end if;
 select * into t from public.hub_tournaments where id=(select tournament_id from public.hub_entries where id=eid) for update;
 if t.id is null or t.status='finished' or exists(select 1 from public.hub_engines where tournament_id=t.id) or exists(select 1 from public.hub_matches where tournament_id=t.id) then return false;end if;
 if not exists(select 1 from public.hub_admission_rules where tournament_id=t.id and enabled) or not exists(select 1 from public.hub_organizers where user_id=t.organizer_id) then return false;end if;
 select * into e from public.hub_entries where id=eid;
 if e.status<>'pending' or e.rules_version<>t.rules_version then return false;end if;
 select * into policy from public.hub_participation_policies where tournament_id=t.id;
 select * into review from public.hub_eligibility_reviews where entry_id=eid;
 -- An explicit positive human review is required even when personal acceptance is optional.
 if policy.tournament_id is null or review.approved is distinct from true or review.policy_version is distinct from policy.version or review.actor_id is distinct from t.organizer_id then return false;end if;
 if (select count(*) from public.hub_entry_players where entry_id=eid)<>t.roster_size then return false;end if;
 if policy.require_acceptance and exists(
  select 1 from public.hub_entry_players ep where ep.entry_id=eid and not exists(
   select 1 from public.hub_entry_attestations a where a.entry_id=eid and a.user_id=ep.user_id and a.policy_version=policy.version and a.accepted
  )
 ) then return false;end if;
 update public.hub_entries set status='approved' where id=eid;
 insert into public.hub_ops_audit(tournament_id,actor_id,action,entry_id,details) values(t.id,uid,'auto_admit',eid,jsonb_build_object('policy_version',policy.version,'rules_version',t.rules_version,'review_actor',review.actor_id));
 return true;
end $$;
revoke all on function public.hub_try_auto_admit(uuid) from public,anon,authenticated;
create function public.hub_auto_admit_after_confirmation() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform public.hub_try_auto_admit(new.entry_id);return new;
end $$;
revoke all on function public.hub_auto_admit_after_confirmation() from public,anon,authenticated;
create trigger auto_admit_attestation after insert or update on public.hub_entry_attestations for each row execute function public.hub_auto_admit_after_confirmation();
create trigger auto_admit_review after insert or update on public.hub_eligibility_reviews for each row execute function public.hub_auto_admit_after_confirmation();
create function public.hub_set_auto_admission(tid uuid,enabled_value boolean,reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();t public.hub_tournaments;eid uuid;n integer:=0;previous boolean;
begin
 if uid is null then raise exception 'Sign in required';end if;
 select * into t from public.hub_tournaments where id=tid for update;
 if t.id is null then raise exception 'Tournament not found';end if;
 if t.organizer_id<>uid or not exists(select 1 from public.hub_organizers where user_id=uid) then raise exception 'Organizer required';end if;
 if t.status='finished' or exists(select 1 from public.hub_engines where tournament_id=tid) or exists(select 1 from public.hub_matches where tournament_id=tid) then raise exception 'Admission rules are locked after launch';end if;
 if enabled_value is null or coalesce(length(trim(reason)),0) not between 3 and 500 then raise exception 'Reason required';end if;
 select enabled into previous from public.hub_admission_rules where tournament_id=tid;
 if previous is not distinct from enabled_value then return jsonb_build_object('saved',true,'admitted',0);end if;
 insert into public.hub_admission_rules values(tid,enabled_value) on conflict(tournament_id) do update set enabled=excluded.enabled;
 insert into public.hub_ops_audit(tournament_id,actor_id,action,details) values(tid,uid,'set_auto_admission',jsonb_build_object('enabled',enabled_value,'reason',trim(reason)));
 if enabled_value then
  for eid in select id from public.hub_entries where tournament_id=tid and status='pending' order by id loop
   if public.hub_try_auto_admit(eid) then n:=n+1;end if;
  end loop;
 end if;
 return jsonb_build_object('saved',true,'admitted',n);
end $$;
revoke all on function public.hub_set_auto_admission(uuid,boolean,text) from public,anon;
grant execute on function public.hub_set_auto_admission(uuid,boolean,text) to authenticated;
notify pgrst,'reload schema';
commit;
