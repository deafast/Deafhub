-- Run only in DeafHub project hvxvwgnnmazpptuenidv.
begin;
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    nickname text not null check (char_length(nickname) between 2 and 30),
    region text not null check (region in ('europe', 'cis', 'other')),
    telegram text not null default '' check (char_length(telegram) <= 32),
    vk text not null default '' check (char_length(vk) <= 64)
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
create policy "Read own profile" on public.profiles for select to authenticated
    using ((select auth.uid()) = id);
create policy "Create own profile" on public.profiles for insert to authenticated
    with check ((select auth.uid()) = id);
create policy "Edit own profile" on public.profiles for update to authenticated
    using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
commit;
