// Credential-free HTTP boundary checks. Authenticated rules/awards are tested in SQL.
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const origin='http://localhost:3200';
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--webpack','--port','3200','--hostname','127.0.0.1'],{stdio:['ignore','pipe','pipe'],env:{...process.env,NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:'https://hvxvwgnnmazpptuenidv.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'deafhub-public-smoke'}});
let started=false;
async function check(){if(started)return;started=true;try{
 const tests=[['/api/tournament-operations?profile=me',{},401],['/api/tournament-operations?id=00000000-0000-4000-8000-000000000001',{},401],['/api/tournament-operations',{method:'POST',headers:{Origin:'https://wrong.invalid','Content-Type':'application/json'},body:'{}'},403],['/api/tournament-operations',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'},401],['/api/hub',{},401],['/api/tournament-engine?id=00000000-0000-4000-8000-000000000001',{},401]];
 for(const [path,options,status] of tests){const r=await fetch(origin+path,options);assert.equal(r.status,status,`${path}: ${await r.text()}`);}
 console.log('PASS 6 credential-free HTTP boundaries: operations/profile authentication, Origin, hub and engine');
 }catch(e){console.error(e);process.exitCode=1;}finally{server.kill('SIGTERM');}}
server.stdout.on('data',b=>{if(b.toString().includes('Ready in'))void check();});server.stderr.on('data',b=>process.stderr.write(b));
setTimeout(()=>{if(!started){console.error('Startup timeout');server.kill();process.exitCode=1;}},45000).unref();
