// Isolated in-memory PostgreSQL checks. Never connects to Supabase.
import {readFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {PGlite} from '@electric-sql/pglite';
const pg=await PGlite.create();
let stage='bootstrap';
try {
 await pg.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;grant usage on schema public,auth to anon,authenticated,service_role;
 create table auth.users(id uuid primary key,email text,aud text,role text,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
 for(const name of ['profiles','competition','tournament-engine','tournament-operations']) {
  stage='base '+name;await pg.exec(readFileSync(`db/${name}.sql`,'utf8'));
 }
 stage='migration';
 const migration='supabase/migrations/'+readdirSync('supabase/migrations').find(n=>n.endsWith('_bronze_match_awards.sql'));
 await pg.exec(readFileSync(migration,'utf8'));
 stage='legacy awards regression';await pg.exec(readFileSync('db/tournament-operations-check.sql','utf8'));
 stage='bronze rollback regression';
 const original=readFileSync('db/tournament-operations-check.sql','utf8').replace(/^begin;\s*/,'').replace(/rollback;\s*$/,'');
 const bronze=execFileSync(process.execPath,['scripts/bronze-sql-check.mjs'],{encoding:'utf8'});
 await pg.exec('begin;\n'+original+'\n'+bronze+'\nrollback;');
 const count=await pg.query('select count(*)::int n from public.hub_tournaments');
 if(count.rows[0].n!==0)throw Error('Rollback did not remove QA tournaments');
 console.log('PASS isolated PostgreSQL: baseline migrations, bronze migration, legacy awards, separate bronze awards, pending bronze guard, organizer policy mismatch, placements 1/2/3, duplicate issuance, correction guard, rollback');
} catch(error){console.error('FAIL '+stage+': '+error.message);process.exitCode=1;}
finally{await pg.close();}
