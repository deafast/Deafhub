import {spawn} from 'node:child_process';
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--webpack','--port','3100','--hostname','127.0.0.1'],{stdio:['ignore','pipe','pipe'],env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});
let started=false;
const run=()=>{if(started)return;started=true;const test=spawn(process.execPath,['scripts/tournament-e2e.mjs'],{stdio:'inherit',env:{...process.env,QA_ORIGIN:'http://localhost:3100'}});test.on('exit',code=>{server.kill('SIGTERM');process.exitCode=code??1;});};
server.stdout.on('data',b=>{process.stdout.write(b);if(b.toString().includes('Ready in'))run();});server.stderr.on('data',b=>process.stderr.write(b));
setTimeout(()=>{if(!started){server.kill();process.exitCode=1;console.error('Startup timeout');}},45000).unref();
