-- Preview: individual FC entry + declared playing level. Existing teams/entries preserved.
alter table public.hub_entries alter column team_id drop not null;
alter table public.hub_entries add column player_id uuid references auth.users(id);
alter table public.hub_entries add column player_nickname text;
alter table public.hub_entries add column skill_level text;
alter table public.hub_entries add constraint hub_entries_participant_kind check (
 (team_id is not null and player_id is null and player_nickname is null and skill_level is null)
 or (team_id is null and player_id is not null and nullif(btrim(player_nickname),'') is not null and skill_level in ('strong','intermediate','amateur') and skill_level is not null)
);
create unique index hub_entries_individual_unique on public.hub_entries(tournament_id,player_id) where player_id is not null;

create function public.hub_register_fc(tid uuid,accepted_rules uuid,level text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();tour public.hub_tournaments;nickname_value text;eid uuid;existing public.hub_entries;
begin
 if uid is null then raise exception 'Sign in required';end if;
 if level is null or level not in ('strong','intermediate','amateur') then raise exception 'Choose your playing level';end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 select * into tour from public.hub_tournaments where id=tid for update;
 if tour.id is null or tour.game<>'fc' or tour.roster_size<>1 then raise exception 'FC individual tournament required';end if;
 if tour.status<>'open' or tour.starts_at<=now() or exists(select 1 from public.hub_engines where tournament_id=tid) then raise exception 'Registration closed';end if;
 if accepted_rules is null or accepted_rules is distinct from tour.rules_version then raise exception 'Read and accept current rules';end if;
 select nickname into nickname_value from public.profiles where id=uid;
 if nullif(btrim(nickname_value),'') is null then raise exception 'Save your player nickname first';end if;
 select * into existing from public.hub_entries where tournament_id=tid and player_id=uid;
 if existing.id is not null then
  if existing.status<>'rejected' and existing.skill_level=level and existing.rules_version=accepted_rules then return jsonb_build_object('id',existing.id);end if;
  raise exception 'A player is already registered';
 end if;
 if exists(select 1 from public.hub_entry_players ep join public.hub_entries e on e.id=ep.entry_id where ep.user_id=uid and e.tournament_id=tid and e.status<>'rejected') then raise exception 'A player is already registered';end if;
 insert into public.hub_entries(tournament_id,team_id,player_id,player_nickname,skill_level,rules_version) values(tid,null,uid,nickname_value,level,tour.rules_version) returning id into eid;
 insert into public.hub_entry_players(entry_id,user_id,nickname) values(eid,uid,nickname_value);
 return jsonb_build_object('id',eid);
end $$;
revoke all on function public.hub_register_fc(uuid,uuid,text) from public,anon;
grant execute on function public.hub_register_fc(uuid,uuid,text) to authenticated;
-- Existing table RLS and narrow mutation grants remain unchanged.
notify pgrst,'reload schema';
