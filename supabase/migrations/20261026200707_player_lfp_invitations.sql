-- Player-owned listings and private, recipient-controlled team invitations.
create table public.hub_lfp_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game text not null check (game in ('dota2','cs2')),
  nickname text not null check (char_length(nickname) between 2 and 30),
  position text not null check (char_length(position) between 1 and 40),
  note text not null default '' check (char_length(note) <= 180),
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (user_id,game)
);
create index hub_lfp_active_order on public.hub_lfp_listings(game,updated_at desc,id desc) where active;
create index hub_lfp_global_order on public.hub_lfp_listings(updated_at desc,id desc) where active;

create table public.hub_lfp_invitations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.hub_lfp_listings(id) on delete cascade,
  team_id uuid not null references public.hub_teams(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  game text not null check (game in ('dota2','cs2')),
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (sender_id <> recipient_id)
);
create unique index hub_lfp_one_pending on public.hub_lfp_invitations(team_id,recipient_id) where status='pending';
create index hub_lfp_inbox on public.hub_lfp_invitations(recipient_id,status,created_at desc);
create index hub_lfp_outbox on public.hub_lfp_invitations(sender_id,status,created_at desc);
alter table public.hub_lfp_listings enable row level security;
alter table public.hub_lfp_invitations enable row level security;
revoke all on public.hub_lfp_listings,public.hub_lfp_invitations from public,anon,authenticated;

create function public.hub_lfp_board(p_game text default null,p_before timestamptz default null,p_before_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); board jsonb; mine jsonb; incoming jsonb; outgoing jsonb; captain_teams jsonb;
begin
 if uid is null then raise exception 'Sign in required'; end if;
 if p_game is not null and p_game not in ('dota2','cs2') then raise exception 'Invalid game'; end if;
 if (p_before is null) <> (p_before_id is null) then raise exception 'Invalid cursor'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'game',x.game,'nickname',x.nickname,'position',x.position,'note',x.note,'updatedAt',x.updated_at,'mine',x.user_id=uid) order by x.updated_at desc,x.id desc),'[]'::jsonb)
 into board from (select l.* from public.hub_lfp_listings l where l.active and (p_game is null or l.game=p_game)
  and (p_before is null or (l.updated_at,l.id)<(p_before,p_before_id))
  and not exists(select 1 from public.hub_members m where m.user_id=l.user_id and m.game=l.game)
  order by l.updated_at desc,l.id desc limit 21) x;
 select coalesce(jsonb_agg(jsonb_build_object('id',l.id,'game',l.game,'position',l.position,'note',l.note)),'[]'::jsonb)
 into mine from public.hub_lfp_listings l where l.user_id=uid and l.active
  and not exists(select 1 from public.hub_members m where m.user_id=uid and m.game=l.game);
 select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'teamId',i.team_id,'teamName',t.name,'game',i.game,'createdAt',i.created_at) order by i.created_at desc),'[]'::jsonb)
 into incoming from public.hub_lfp_invitations i join public.hub_teams t on t.id=i.team_id
 where i.recipient_id=uid and i.status='pending' and i.created_at>now()-interval '7 days';
 select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'listingId',i.listing_id,'teamId',i.team_id,'game',i.game) order by i.created_at desc),'[]'::jsonb)
 into outgoing from public.hub_lfp_invitations i where i.sender_id=uid and i.status='pending' and i.created_at>now()-interval '7 days';
 select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'game',x.game,'name',x.name,'canInvite',x.can_invite) order by x.created_at desc,x.id desc),'[]'::jsonb)
 into captain_teams from (select t.id,t.game,t.name,t.created_at,
  (select count(*) from public.hub_members m where m.team_id=t.id)<10 and not exists(select 1 from public.hub_entries e join public.hub_tournaments tour on tour.id=e.tournament_id where e.team_id=t.id and e.status<>'rejected' and tour.status<>'finished') as can_invite
  from public.hub_teams t where t.captain_id=uid and t.game in ('dota2','cs2') order by t.created_at desc,t.id desc limit 51) x;
 return jsonb_build_object('listings',board,'mine',mine,'incoming',incoming,'outgoing',outgoing,'teams',captain_teams);
end $$;
revoke all on function public.hub_lfp_board(text,timestamptz,uuid) from public,anon;
grant execute on function public.hub_lfp_board(text,timestamptz,uuid) to authenticated;

create function public.hub_lfp_action(action text,p jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); target uuid; listing public.hub_lfp_listings; invitation public.hub_lfp_invitations; team public.hub_teams; nickname_value text; game_value text; position_value text; note_value text; invite_code uuid; lock_a bigint; lock_b bigint;
begin
 if uid is null then raise exception 'Sign in required'; end if;
 -- Acquire locks in a stable order when two players are involved.
 if action='invite' then
  select user_id into target from public.hub_lfp_listings where id=(p->>'listing_id')::uuid;
  if target is null then raise exception 'Listing unavailable'; end if;
  lock_a:=hashtextextended('lfp-user:'||uid::text,0); lock_b:=hashtextextended('lfp-user:'||target::text,0);
  perform pg_advisory_xact_lock(least(lock_a,lock_b));
  if lock_a<>lock_b then perform pg_advisory_xact_lock(greatest(lock_a,lock_b)); end if;
 else
  perform pg_advisory_xact_lock(hashtextextended('lfp-user:'||uid::text,0));
 end if;
 if action='publish' then
  game_value:=p->>'game'; position_value:=trim(coalesce(p->>'position','')); note_value:=trim(coalesce(p->>'note',''));
  if game_value is null or game_value not in ('dota2','cs2') or char_length(position_value) not between 1 and 40 or char_length(note_value)>180 then raise exception 'Check all fields'; end if;
  select nickname into nickname_value from public.profiles where id=uid;
  if nickname_value is null then raise exception 'Save your player nickname first'; end if;
  if exists(select 1 from public.hub_members where user_id=uid and game=game_value) then raise exception 'Already on a team'; end if;
  insert into public.hub_lfp_listings(user_id,game,nickname,position,note,active,updated_at)
   values(uid,game_value,nickname_value,position_value,note_value,true,now())
   on conflict(user_id,game) do update set nickname=excluded.nickname,position=excluded.position,note=excluded.note,active=true,updated_at=now();
 elsif action='withdraw' then
  update public.hub_lfp_listings set active=false,updated_at=now() where id=(p->>'listing_id')::uuid and user_id=uid and active returning * into listing;
  if listing.id is null then raise exception 'Listing unavailable'; end if;
  update public.hub_lfp_invitations set status='cancelled',responded_at=now() where listing_id=listing.id and status='pending';
 elsif action='invite' then
  select * into listing from public.hub_lfp_listings where id=(p->>'listing_id')::uuid and active;
  select * into team from public.hub_teams where id=(p->>'team_id')::uuid for update;
  if listing.id is null or listing.user_id=uid then raise exception 'Listing unavailable'; end if;
  if team.id is null or team.captain_id<>uid or team.game<>listing.game then raise exception 'Captain and matching game required'; end if;
  if exists(select 1 from public.hub_members where user_id=listing.user_id and game=listing.game) then raise exception 'Listing unavailable'; end if;
  if exists(select 1 from public.hub_entries e join public.hub_tournaments t on t.id=e.tournament_id where e.team_id=team.id and e.status<>'rejected' and t.status<>'finished') then raise exception 'Roster locked during tournament participation'; end if;
  if (select count(*) from public.hub_members where team_id=team.id)>=10 then raise exception 'Roster full'; end if;
  update public.hub_lfp_invitations set status='cancelled',responded_at=now() where team_id=team.id and recipient_id=listing.user_id and status='pending' and created_at<=now()-interval '7 days';
  if exists(select 1 from public.hub_lfp_invitations where team_id=team.id and recipient_id=listing.user_id and status='pending') then raise exception 'Invitation already pending'; end if;
  if (select count(*) from public.hub_lfp_invitations where sender_id=uid and created_at>now()-interval '1 day')>=20
    or (select count(*) from public.hub_lfp_invitations where sender_id=uid and status='pending' and created_at>now()-interval '7 days')>=50
    or (select count(*) from public.hub_lfp_invitations where recipient_id=listing.user_id and status='pending' and created_at>now()-interval '7 days')>=30 then raise exception 'Invitation limit reached'; end if;
  insert into public.hub_lfp_invitations(listing_id,team_id,sender_id,recipient_id,game) values(listing.id,team.id,uid,listing.user_id,listing.game);
 elsif action in ('accept','decline') then
  select * into invitation from public.hub_lfp_invitations where id=(p->>'invitation_id')::uuid and recipient_id=uid for update;
  if invitation.id is null or invitation.status<>'pending' or invitation.created_at<=now()-interval '7 days' then raise exception 'Invitation unavailable'; end if;
  if action='decline' then
   update public.hub_lfp_invitations set status='declined',responded_at=now() where id=invitation.id;
  else
   select * into listing from public.hub_lfp_listings where id=invitation.listing_id and user_id=uid and active;
   select * into team from public.hub_teams where id=invitation.team_id and captain_id=invitation.sender_id and game=invitation.game;
   if listing.id is null or team.id is null then raise exception 'Invitation unavailable'; end if;
   select code into invite_code from public.hub_invites where team_id=team.id;
   if invite_code is null then raise exception 'Invitation unavailable'; end if;
   perform public.hub_action('join_team',jsonb_build_object('code',invite_code));
   update public.hub_lfp_invitations set status='accepted',responded_at=now() where id=invitation.id;
   update public.hub_lfp_listings set active=false,updated_at=now() where user_id=uid and game=invitation.game;
   update public.hub_lfp_invitations set status='cancelled',responded_at=now() where recipient_id=uid and game=invitation.game and status='pending';
  end if;
 else raise exception 'Unknown action'; end if;
 return jsonb_build_object('saved',true);
end $$;
revoke all on function public.hub_lfp_action(text,jsonb) from public,anon;
grant execute on function public.hub_lfp_action(text,jsonb) to authenticated;
