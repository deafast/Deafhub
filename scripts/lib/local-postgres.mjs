// Isolated PostgreSQL scaffold for application SQL tests; not Supabase Auth itself.
import {createRequire} from 'node:module';import {readFile} from 'node:fs/promises';import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
export async function createTestDatabase(){
 const {PGlite}=require(process.env.DEAFHUB_PGLITE_PATH||'/tmp/deafhub-sql-qa/node_modules/@electric-sql/pglite');const db=new PGlite();
 try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,aud text,role text,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';grant usage on schema auth to authenticated,anon,service_role;grant execute on function auth.uid() to authenticated,anon,service_role;create table public.profiles(id uuid primary key references auth.users(id),nickname text,region text);grant select on public.profiles to authenticated;`);
 for(const path of ['db/competition.sql','db/tournament-engine.sql','db/tournament-operations.sql','supabase/migrations/20261019042909_bronze_match_awards.sql','supabase/migrations/20261021094215_fc_individual_skill_groups.sql','supabase/migrations/20261021094734_fc_individual_award_recipients.sql'])await db.exec(await readFile(resolve(path),'utf8'));
 return db;
 }catch(error){await db.close();throw error;}
}
