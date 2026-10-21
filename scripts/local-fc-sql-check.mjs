// Isolated in-memory PostgreSQL. No network, Supabase credentials or real users.
// npm install --prefix /tmp/deafhub-sql-qa @electric-sql/pglite@0.5.10
import {createRequire} from 'node:module';import {readFile} from 'node:fs/promises';import {resolve} from 'node:path';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);const {PGlite}=require(process.env.DEAFHUB_PGLITE_PATH||'/tmp/deafhub-sql-qa/node_modules/@electric-sql/pglite');
const db=new PGlite();
try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,aud text,role text,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';grant usage on schema auth to authenticated,anon,service_role;grant execute on function auth.uid() to authenticated,anon,service_role;create table public.profiles(id uuid primary key references auth.users(id),nickname text,region text);grant select on public.profiles to authenticated;`);
 for(const path of ['db/competition.sql','db/tournament-engine.sql','db/tournament-operations.sql','supabase/migrations/20261019042909_bronze_match_awards.sql','supabase/migrations/20261021094215_fc_individual_skill_groups.sql','supabase/migrations/20261021094734_fc_individual_award_recipients.sql'])await db.exec(await readFile(resolve(path),'utf8'));
 const results=await db.exec(await readFile(resolve('db/fc-registration-check.sql'),'utf8'));console.log(results.at(-1).rows);
 const after=await db.query('select (select count(*) from auth.users) users,(select count(*) from public.hub_entries) entries,(select count(*) from public.hub_tournaments) tournaments');assert.deepEqual(after.rows[0],{users:0,entries:0,tournaments:0});console.log('PASS: isolated PostgreSQL fixtures rolled back; no remote database used');
}finally{await db.close();}
