-- Preview: own registered-roster history, keyset pagination and honest confirmation times.
alter table public.hub_matches add column confirmed_at timestamptz;
create function public.hub_manual_confirmation_time() returns trigger language plpgsql set search_path='' as $$
begin
 if new.status='finished' then
  if tg_op='INSERT' then new.confirmed_at:=statement_timestamp();
  elsif old.status is distinct from new.status or old.score_a is distinct from new.score_a or old.score_b is distinct from new.score_b then new.confirmed_at:=statement_timestamp();
  else new.confirmed_at:=old.confirmed_at;end if;
 else new.confirmed_at:=null;end if;
 return new;
end $$;
revoke all on function public.hub_manual_confirmation_time() from public,anon,authenticated;
create trigger manual_confirmation_time before insert or update on public.hub_matches for each row execute function public.hub_manual_confirmation_time();
-- Existing finished rows intentionally stay NULL: no invented historical timestamp.
create index hub_engine_audit_match_revision on public.hub_engine_audit(tournament_id,(command->>'match'),revision desc) where command->>'type'='result';

create function public.hub_player_match_history(before_at timestamptz default null,before_key text default null,page_size integer default 20)
returns table(match_id text,tournament_id uuid,tournament_title text,game text,player_a text,player_b text,score_a integer,score_b integer,result_kind text,penalties jsonb,confirmed_at timestamptz,tournament_starts_at timestamptz,scheduled_at timestamptz,source text,sort_at timestamptz,sort_key text)
language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Sign in required';end if;
 if page_size is null or page_size<1 or page_size>50 or (before_at is null)<>(before_key is null) or length(before_key)>160 then raise exception 'Invalid history page';end if;
 -- SECURITY DEFINER is required only to read minimal confirmation timestamps from
 -- organizer-only audit rows. Never expose audit commands, actors or another user's history.
 return query
 with own_entries as materialized (select ep.entry_id from public.hub_entry_players ep where ep.user_id=uid),
 own_tournaments as materialized (select distinct e.tournament_id from public.hub_entries e join own_entries oe on oe.entry_id=e.id),
 manual_results as (
  select m.id::text as match_id,m.tournament_id,t.title as tournament_title,t.game,
   coalesce(ea.player_nickname,ta.name,'—') as player_a,coalesce(eb.player_nickname,tb.name,'—') as player_b,
   m.score_a,m.score_b,'played'::text as result_kind,null::jsonb as penalties,m.confirmed_at,t.starts_at as tournament_starts_at,m.starts_at as scheduled_at,'manual'::text as source,
   coalesce(m.confirmed_at,m.starts_at) as sort_at,'manual:'||m.id::text as sort_key
  from public.hub_matches m join public.hub_tournaments t on t.id=m.tournament_id
  join public.hub_entries ea on ea.id=m.entry_a and ea.tournament_id=m.tournament_id
  join public.hub_entries eb on eb.id=m.entry_b and eb.tournament_id=m.tournament_id
  left join public.hub_teams ta on ta.id=ea.team_id left join public.hub_teams tb on tb.id=eb.team_id
  where m.status='finished' and (m.entry_a in(select oe.entry_id from own_entries oe) or m.entry_b in(select oe.entry_id from own_entries oe))
 ),engine_results as (
  select en.tournament_id::text||'/'||(m->>'id') as match_id,en.tournament_id,t.title as tournament_title,t.game,
   coalesce(ea.player_nickname,ta.name,'—') as player_a,coalesce(eb.player_nickname,tb.name,'—') as player_b,
   case when m#>>'{result,kind}'='played' and m#>>'{result,a}' ~ '^\d{1,4}$' then (m#>>'{result,a}')::integer else null end as score_a,
   case when m#>>'{result,kind}'='played' and m#>>'{result,b}' ~ '^\d{1,4}$' then (m#>>'{result,b}')::integer else null end as score_b,
   coalesce(m#>>'{result,kind}','unknown') as result_kind,m#>'{result,penalties}' as penalties,
   a.created_at as confirmed_at,t.starts_at as tournament_starts_at,null::timestamptz as scheduled_at,'engine'::text as source,
   coalesce(a.created_at,t.starts_at) as sort_at,'engine:'||en.tournament_id::text||':'||(m->>'id') as sort_key
  from own_tournaments ot join public.hub_engines en on en.tournament_id=ot.tournament_id
  join public.hub_tournaments t on t.id=en.tournament_id
  cross join lateral jsonb_array_elements(en.state->'matches') m
  join public.hub_entries ea on ea.id::text=m->>'a' and ea.tournament_id=en.tournament_id
  join public.hub_entries eb on eb.id::text=m->>'b' and eb.tournament_id=en.tournament_id
  left join public.hub_teams ta on ta.id=ea.team_id left join public.hub_teams tb on tb.id=eb.team_id
  left join lateral (select audit.created_at from public.hub_engine_audit audit where audit.tournament_id=en.tournament_id and audit.command->>'type'='result' and audit.command->>'match'=m->>'id' order by audit.revision desc limit 1) a on true
  where m->>'status'='finished' and (ea.id in(select oe.entry_id from own_entries oe) or eb.id in(select oe.entry_id from own_entries oe))
 ),results as (select * from manual_results union all select * from engine_results)
 select r.* from results r where before_at is null or (r.sort_at,r.sort_key)<(before_at,before_key)
 order by r.sort_at desc,r.sort_key desc limit (page_size+1);
end $$;
revoke all on function public.hub_player_match_history(timestamptz,text,integer) from public,anon;
grant execute on function public.hub_player_match_history(timestamptz,text,integer) to authenticated;
notify pgrst,'reload schema';
