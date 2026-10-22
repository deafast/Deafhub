-- Mandatory captain confirmation must not be bypassed through legacy hub_action.
begin;
create function public.hub_legacy_confirmation_guard() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.hub_tournaments where id=new.tournament_id for update;
 if exists(select 1 from public.hub_result_rules where tournament_id=new.tournament_id and require_confirmation) then
  raise exception 'Captain confirmations require tournament engine';
 end if;
 return new;
end $$;
revoke all on function public.hub_legacy_confirmation_guard() from public,anon,authenticated;
create trigger legacy_confirmation_guard before insert or update on public.hub_matches
for each row execute function public.hub_legacy_confirmation_guard();
notify pgrst,'reload schema';
commit;
