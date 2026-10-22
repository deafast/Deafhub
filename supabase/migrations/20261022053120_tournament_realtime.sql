-- Only existing authenticated engine readers receive invalidations.
-- No changes to RLS, grants, auth configuration or user data.
begin;
do $$begin
 if not exists(select 1 from pg_publication where pubname='supabase_realtime') then raise exception 'Realtime publication missing';end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='hub_engines') then
  alter publication supabase_realtime add table public.hub_engines;
 end if;
end $$;
commit;
