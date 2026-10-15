-- DeafHub hvxvwgnnmazpptuenidv only. Additive competition setup.
begin;
create table public.hub_organizers (user_id uuid primary key references auth.users(id));
alter table public.hub_organizers enable row level security;
revoke all on public.hub_organizers from anon,authenticated;
grant select on public.hub_organizers to authenticated;
create policy organizer_self on public.hub_organizers for select to authenticated using(user_id=(select auth.uid()));
create table public.steam_accounts (steam_id text primary key check(steam_id ~ '^7656119[0-9]{10}$'),user_id uuid not null unique references auth.users(id) on delete cascade,linked_at timestamptz not null default now());
create table public.steam_nonces (nonce_hash text primary key,created_at timestamptz not null default now());
alter table public.steam_accounts enable row level security;
alter table public.steam_nonces enable row level security;
revoke all on public.steam_accounts,public.steam_nonces from anon,authenticated;
grant select on public.steam_accounts to authenticated;
create policy steam_self on public.steam_accounts for select to authenticated using(user_id=(select auth.uid()));
create table public.hub_teams (id uuid primary key default gen_random_uuid(),name text not null check(char_length(name) between 2 and 40),game text not null check(game in ('dota2','cs2','fc')),captain_id uuid not null references auth.users(id),created_at timestamptz not null default now());
create unique index hub_team_name on public.hub_teams(lower(name),game);
create index hub_teams_captain on public.hub_teams(captain_id);
create table public.hub_members (team_id uuid not null references public.hub_teams(id) on delete cascade,user_id uuid not null references auth.users(id),game text not null,nickname text not null,primary key(team_id,user_id),unique(user_id,game));
create table public.hub_invites (team_id uuid primary key references public.hub_teams(id) on delete cascade,code uuid not null unique default gen_random_uuid());
create table public.hub_tournaments (id uuid primary key default gen_random_uuid(),title text not null check(char_length(title) between 3 and 100),game text not null check(game in ('dota2','cs2','fc')),organizer_id uuid not null references auth.users(id),starts_at timestamptz not null,rules text not null check(char_length(rules) between 20 and 12000),rules_version uuid not null default gen_random_uuid(),roster_size int not null check(roster_size between 1 and 10),status text not null default 'open' check(status in ('open','closed','finished')),created_at timestamptz not null default now());
create index hub_tournaments_organizer on public.hub_tournaments(organizer_id);
create table public.hub_entries (id uuid primary key default gen_random_uuid(),tournament_id uuid not null references public.hub_tournaments(id),team_id uuid not null references public.hub_teams(id),status text not null default 'pending' check(status in ('pending','approved','rejected')),rules_version uuid not null,created_at timestamptz not null default now(),unique(tournament_id,team_id));
create index hub_entries_team on public.hub_entries(team_id);
create table public.hub_entry_players (entry_id uuid not null references public.hub_entries(id) on delete cascade,user_id uuid not null references auth.users(id),nickname text not null,primary key(entry_id,user_id));
create index hub_entry_players_user on public.hub_entry_players(user_id);
create table public.hub_matches (id uuid primary key default gen_random_uuid(),tournament_id uuid not null references public.hub_tournaments(id),entry_a uuid not null references public.hub_entries(id),entry_b uuid not null references public.hub_entries(id),starts_at timestamptz not null,score_a int check(score_a between 0 and 1000),score_b int check(score_b between 0 and 1000),status text not null default 'scheduled' check(status in ('scheduled','finished')),created_at timestamptz not null default now(),check(entry_a<>entry_b),check((status='scheduled' and score_a is null and score_b is null) or (status='finished' and score_a is not null and score_b is not null and score_a<>score_b)));
create index hub_matches_tournament on public.hub_matches(tournament_id);
create index hub_matches_entry_a on public.hub_matches(entry_a);
create index hub_matches_entry_b on public.hub_matches(entry_b);
do $$ declare n text; begin foreach n in array array['hub_teams','hub_members','hub_invites','hub_tournaments','hub_entries','hub_entry_players','hub_matches'] loop execute format('alter table public.%I enable row level security',n); execute format('revoke all on public.%I from anon,authenticated',n); end loop; end $$;
grant select on public.hub_teams,public.hub_members,public.hub_tournaments,public.hub_entries,public.hub_entry_players,public.hub_matches,public.hub_invites to authenticated;
create policy teams_read on public.hub_teams for select to authenticated using(true);
create policy members_read on public.hub_members for select to authenticated using(true);
create policy tournaments_read on public.hub_tournaments for select to authenticated using(true);
create policy entries_read on public.hub_entries for select to authenticated using(true);
create policy entry_players_read on public.hub_entry_players for select to authenticated using(true);
create policy matches_read on public.hub_matches for select to authenticated using(true);
create policy invites_captain on public.hub_invites for select to authenticated using(exists(select 1 from public.hub_teams t where t.id=team_id and t.captain_id=(select auth.uid())));
-- Every mutation is a narrow transaction; browser roles cannot write tables directly.
create function public.hub_action(action text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); team public.hub_teams; tour public.hub_tournaments; match public.hub_matches; entry public.hub_entries; pid uuid; nickname_value text; result jsonb:='{}'; a uuid; b uuid; scorea int; scoreb int;
begin
 if uid is null then raise exception 'Sign in required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 select nickname into nickname_value from public.profiles where id=uid;
 if action in ('create_team','join_team') and nickname_value is null then raise exception 'Save your player nickname first'; end if;
 if action='create_team' then
  insert into public.hub_teams(name,game,captain_id) values(trim(p->>'name'),p->>'game',uid) returning * into team;
  insert into public.hub_members values(team.id,uid,team.game,nickname_value);
  insert into public.hub_invites(team_id) values(team.id);
  result:=jsonb_build_object('id',team.id);
 elsif action='join_team' then
  select t.* into team from public.hub_teams t join public.hub_invites i on i.team_id=t.id where i.code=(p->>'code')::uuid for update of t;
  if team.id is null then raise exception 'Invitation not found'; end if;
  if exists(select 1 from public.hub_entries e join public.hub_tournaments t on t.id=e.tournament_id where e.team_id=team.id and e.status<>'rejected' and t.status<>'finished') then raise exception 'Roster locked during tournament participation'; end if;
  if (select count(*) from public.hub_members where team_id=team.id)>=10 then raise exception 'Roster full'; end if;
  insert into public.hub_members values(team.id,uid,team.game,nickname_value);
 elsif action='register' then
  select * into tour from public.hub_tournaments where id=(p->>'tournament_id')::uuid for update;
  select * into team from public.hub_teams where id=(p->>'team_id')::uuid for update;
  if team.captain_id is distinct from uid or tour.id is null or tour.game<>team.game then raise exception 'Captain and matching game required'; end if;
  if tour.status<>'open' or tour.starts_at<=now() then raise exception 'Registration closed'; end if;
  if coalesce((p->>'accepted')::boolean,false) is not true or (p->>'rules_version')::uuid is distinct from tour.rules_version then raise exception 'Read and accept current rules'; end if;
  if (select count(*) from public.hub_members where team_id=team.id)<>tour.roster_size then raise exception 'Roster size does not match tournament'; end if;
  if exists(select 1 from public.hub_entry_players ep join public.hub_entries e on e.id=ep.entry_id join public.hub_members m on m.user_id=ep.user_id where m.team_id=team.id and e.tournament_id=tour.id and e.status<>'rejected') then raise exception 'A player is already registered'; end if;
  insert into public.hub_entries(tournament_id,team_id,rules_version) values(tour.id,team.id,tour.rules_version) returning id into pid;
  insert into public.hub_entry_players(entry_id,user_id,nickname) select pid,user_id,nickname from public.hub_members where team_id=team.id;
 elsif action='create_tournament' then
  if not exists(select 1 from public.hub_organizers where user_id=uid) then raise exception 'Organizer access required'; end if;
  if (p->>'starts_at')::timestamptz<=now() then raise exception 'Choose a future date'; end if;
  insert into public.hub_tournaments(title,game,organizer_id,starts_at,rules,roster_size) values(trim(p->>'title'),p->>'game',uid,(p->>'starts_at')::timestamptz,p->>'rules',(p->>'roster_size')::int);
 elsif action='review_entry' then
  select * into entry from public.hub_entries where id=(p->>'entry_id')::uuid for update;
  if entry.id is null or not exists(select 1 from public.hub_tournaments where id=entry.tournament_id and organizer_id=uid and status<>'finished') then raise exception 'Organizer required'; end if;
  if exists(select 1 from public.hub_matches where entry_a=entry.id or entry_b=entry.id) then raise exception 'Entry is already in a match'; end if;
  if p->>'status' not in ('approved','rejected') then raise exception 'Invalid status'; end if;
  update public.hub_entries set status=p->>'status' where id=entry.id;
 elsif action='create_match' then
  select * into tour from public.hub_tournaments where id=(p->>'tournament_id')::uuid for update;
  if tour.organizer_id is distinct from uid or tour.status='finished' then raise exception 'Organizer required'; end if;
  a:=(p->>'entry_a')::uuid; b:=(p->>'entry_b')::uuid;
  if a=b or (select count(*) from public.hub_entries where id in (a,b) and tournament_id=tour.id and status='approved')<>2 then raise exception 'Two approved entries required'; end if;
  insert into public.hub_matches(tournament_id,entry_a,entry_b,starts_at) values(tour.id,a,b,(p->>'starts_at')::timestamptz);
 elsif action='finish_match' then
  select * into match from public.hub_matches where id=(p->>'match_id')::uuid for update;
  if match.id is null or not exists(select 1 from public.hub_tournaments where id=match.tournament_id and organizer_id=uid) then raise exception 'Organizer required'; end if;
  if match.status='finished' then raise exception 'Result already confirmed'; end if;
  scorea:=(p->>'score_a')::int; scoreb:=(p->>'score_b')::int;
  update public.hub_matches set score_a=scorea,score_b=scoreb,status='finished' where id=match.id;
 elsif action='finish_tournament' then
  select * into tour from public.hub_tournaments where id=(p->>'tournament_id')::uuid for update;
  if tour.organizer_id is distinct from uid then raise exception 'Organizer required'; end if;
  if not exists(select 1 from public.hub_matches where tournament_id=tour.id) or exists(select 1 from public.hub_matches where tournament_id=tour.id and status<>'finished') then raise exception 'Finish all matches first'; end if;
  update public.hub_tournaments set status='finished' where id=tour.id;
 elsif action='leave_team' then
  select * into team from public.hub_teams where id=(p->>'team_id')::uuid for update;
  if team.captain_id=uid then raise exception 'Captain cannot leave the team'; end if;
  if exists(select 1 from public.hub_entries e join public.hub_tournaments t on t.id=e.tournament_id where e.team_id=team.id and e.status<>'rejected' and t.status<>'finished') then raise exception 'Roster locked during tournament participation'; end if;
  delete from public.hub_members where team_id=team.id and user_id=uid;
  if not found then raise exception 'Membership not found'; end if;
 elsif action='rotate_invite' then
  if not exists(select 1 from public.hub_teams where id=(p->>'team_id')::uuid and captain_id=uid) then raise exception 'Captain required'; end if;
  update public.hub_invites set code=gen_random_uuid() where team_id=(p->>'team_id')::uuid;
 elsif action='close_tournament' then
  update public.hub_tournaments set status='closed' where id=(p->>'tournament_id')::uuid and organizer_id=uid and status='open';
  if not found then raise exception 'Cannot close tournament'; end if;
 else raise exception 'Unknown action'; end if;
 return result;
end $$;
revoke all on function public.hub_action(text,jsonb) from public,anon;
grant execute on function public.hub_action(text,jsonb) to authenticated;
grant all on public.steam_accounts, public.steam_nonces to service_role;
create view public.hub_player_stats with(security_invoker=true) as
select ep.user_id,count(*)::int as matches,count(*) filter(where (m.entry_a=ep.entry_id and m.score_a>m.score_b) or (m.entry_b=ep.entry_id and m.score_b>m.score_a))::int as wins
from public.hub_entry_players ep join public.hub_matches m on (m.entry_a=ep.entry_id or m.entry_b=ep.entry_id) and m.status='finished'
group by ep.user_id;
revoke all on public.hub_player_stats from anon;
grant select on public.hub_player_stats to authenticated;
commit;

