// Isolated in-memory PostgreSQL. No network, Supabase credentials or real users.
// npm install --prefix /tmp/deafhub-sql-qa @electric-sql/pglite@0.5.10
import {readFile} from 'node:fs/promises';import {resolve} from 'node:path';import assert from 'node:assert/strict';
import {createTestDatabase} from './lib/local-postgres.mjs';
const db=await createTestDatabase();
try{
 const results=await db.exec(await readFile(resolve('db/fc-registration-check.sql'),'utf8'));console.log(results.at(-1).rows);
 const after=await db.query('select (select count(*) from auth.users) users,(select count(*) from public.hub_entries) entries,(select count(*) from public.hub_tournaments) tournaments');assert.deepEqual(after.rows[0],{users:0,entries:0,tournaments:0});console.log('PASS: isolated PostgreSQL fixtures rolled back; no remote database used');
}finally{await db.close();}
