const {readFileSync}=require('node:fs');const {resolve}=require('node:path');const vm=require('node:vm');const ts=require('typescript');const test=require('node:test');const assert=require('node:assert/strict');
function load(file,imports={}){const code=ts.transpileModule(readFileSync(resolve(__dirname,'../..',file),'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;const scope={exports:{},Error,FormData:class{constructor(values){this.values=values;}get(key){return this.values[key]??null;}},URL,Headers,Response,AbortController,document:{visibilityState:'visible',addEventListener(){},removeEventListener(){}},fetch:(...args)=>global.fetch(...args),structuredClone,crypto,setTimeout,clearTimeout,setInterval,clearInterval,require:name=>imports[name]||require(name)};vm.runInNewContext(code,scope);return scope.exports;}
function fixture(){const handlers=[];let connection,removed=0;const channel={on(type,filter,callback){handlers.push({type,filter,callback});return channel;},subscribe(callback){connection=callback;return channel;}};return {handlers,connect:value=>connection(value),client:{channel:()=>channel,removeChannel:async()=>{removed++;}},removed:()=>removed};}
test('realtime is scoped to tournament; bursts coalesce and cleanup rejects later events',async t=>{t.mock.timers.enable({apis:['setTimeout','setInterval']});const f=fixture();let refresh=0;const status=[];const {startTournamentUpdates}=load('lib/tournament/updates.ts');const watcher=startTournamentUpdates(f.client,'own-event',async()=>{refresh++;},s=>status.push(s),()=>true);assert.ok(f.handlers.every(h=>h.filter.filter==='tournament_id=eq.own-event'&&h.filter.table==='hub_engines'));f.connect('SUBSCRIBED');f.handlers.forEach(h=>h.callback());t.mock.timers.tick(200);assert.equal(refresh,1);assert.equal(status.at(-1),'live');watcher.stop();f.handlers[0].callback();f.connect('CHANNEL_ERROR');t.mock.timers.tick(60000);assert.equal(refresh,1);assert.equal(f.removed(),1);});
test('realtime fallback checks every 30 seconds, pauses hidden pages and stops polling on reconnect',async t=>{t.mock.timers.enable({apis:['setTimeout','setInterval']});const f=fixture();let refresh=0,visible=false;const {startTournamentUpdates}=load('lib/tournament/updates.ts');const watcher=startTournamentUpdates(f.client,'own-event',async()=>{refresh++;},()=>{},()=>visible);f.connect('TIMED_OUT');t.mock.timers.tick(30200);assert.equal(refresh,0);visible=true;t.mock.timers.tick(30000);t.mock.timers.tick(200);assert.equal(refresh,1);f.connect('SUBSCRIBED');t.mock.timers.tick(200);assert.equal(refresh,2);t.mock.timers.tick(60000);assert.equal(refresh,2);watcher.stop();});
const engine=load('lib/tournament/engine.ts'),draw=load('lib/tournament/fc-groups.ts');const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');const entries=[uuid(1),uuid(2)];let owner=true,user={id:uuid(3)},stored={revision:1,state:engine.createTournament('cs2',entries,{format:'single',grandFinal:'single',bestOf:1,groups:[],qualify:2,points:{win:3,draw:1,loss:0}})},saved=[];
const client={auth:{getUser:async()=>({data:{user},error:null})},from:table=>({select(){return this},eq(){return this},maybeSingle:async()=>({error:null,data:table==='hub_tournaments'?{organizer_id:uuid(3),game:'cs2'}:table==='hub_organizers'?(owner?{user_id:uuid(3)}:null):table==='hub_engines'?stored:null})})};
const route=load('app/api/tournament-engine/route.ts',{'next/server':{NextResponse:{json:(v,init)=>Response.json(v,init)}},'@/lib/supabase/server':{createClient:async()=>client},'@/lib/supabase/admin':{createAdminClient:()=>({rpc:async(name,args)=>{saved.push(args);return {data:{revision:2,state:args.next_state},error:null}}})},'@/lib/tournament/engine':engine,'@/lib/tournament/fc-groups':draw});
const payload={tournament_id:uuid(4),request_id:uuid(5),revision:1,command:{type:'schedule',match:'U1.0',scheduledAt:'2026-11-01T18:30:00.000Z',reason:'Published time'}};
const request=(body=payload,origin='https://preview.example')=>({headers:new Headers({origin}),nextUrl:new URL('https://preview.example/api/tournament-engine'),json:async()=>body});
test('schedule API uses verified organizer identity and existing CAS audit RPC',async()=>{saved=[];const response=await route.POST(request({...payload,actor:'forged'}));assert.equal(response.status,200);assert.equal(saved.length,1);assert.equal(saved[0].actor,uuid(3));assert.equal(saved[0].expected,1);assert.equal(saved[0].command.type,'schedule');assert.equal(saved[0].next_state.matches[0].scheduledAt,payload.command.scheduledAt);});
test('schedule rejects guest, non-organizer, foreign origin and stale revision before persistence',async()=>{saved=[];user=null;assert.equal((await route.POST(request())).status,401);user={id:uuid(3)};owner=false;assert.equal((await route.POST(request())).status,403);owner=true;assert.equal((await route.POST(request(payload,'https://foreign.example'))).status,403);assert.equal((await route.POST(request({...payload,revision:0}))).status,409);assert.equal(saved.length,0);});
test('schedule rejects invalid date or short reason without a database write',async()=>{saved=[];for(const command of [{...payload.command,scheduledAt:'not-time'},{...payload.command,reason:'x'},{...payload.command,match:'foreign-match'}])assert.equal((await route.POST(request({...payload,command}))).status,400);assert.equal(saved.length,0);});
const React=require('react');const {renderToStaticMarkup}=require('react-dom/server');const Schedule=load('components/hub/MatchSchedule.tsx').default;
for(const ru of [true,false])test(`schedule screen is UTC, owner-only, and read-only after finish RU=${ru}`,()=>{const match={id:'U1.0',status:'ready',scheduledAt:payload.command.scheduledAt};const render=(owner,status)=>renderToStaticMarkup(React.createElement(Schedule,{match:{...match,status},owner,busy:false,ru,onSave:async()=>{}}));const html=render(true,'ready');assert.match(html,/UTC/);assert.match(html,/type="datetime-local"/);assert.match(html,/<input(?=[^>]*name="reason")(?=[^>]*required)[^>]*>/);assert.ok(!render(false,'ready').includes('<form'));assert.ok(!render(true,'finished').includes('<form'));});
test('hub API forwards confirmed engine schedule and its cancellation to the match list',async()=>{
 const at='2026-11-01T18:30:00.000Z';let scheduledAt=at;
 const hubClient={auth:{getUser:async()=>({data:{user:{id:uuid(3)}},error:null})},from:table=>{
  const data=()=>table==='hub_tournaments'?[{id:uuid(4),starts_at:'2026-10-22T10:00:00.000Z'}]:table==='hub_engines'?[{tournament_id:uuid(4),revision:2,state:{matches:[{id:'U1.0',a:entries[0],b:entries[1],status:'ready',scheduledAt}]}}]:[];
  const q={select(){return q},order(){return q},eq(){return q},limit(){return q},maybeSingle:async()=>({data:null,error:null}),then:resolve=>Promise.resolve({data:data(),error:null}).then(resolve)};return q;
 }};
 const hub=load('app/api/hub/route.ts',{'next/server':{NextResponse:{json:(v,init)=>Response.json(v,init)}},'@/lib/supabase/server':{createClient:async()=>hubClient}});
 const req={nextUrl:new URL('https://preview.example/api/hub')};
 let response=await hub.GET(req);assert.equal(response.status,200);assert.equal((await response.json()).matches[0].scheduled_at,at);
 scheduledAt=undefined;response=await hub.GET(req);const match=(await response.json()).matches[0];assert.equal(match.scheduled_at,null);assert.equal(match.starts_at,'2026-10-22T10:00:00.000Z');
});
const historyLabels=load('lib/hub-history.ts');
for(const ru of [true,false])test(`match list labels use scheduled time without claiming completion RU=${ru}`,()=>{
 const match={engine_match:'U1.0',starts_at:'2026-10-22T10:00:00Z',scheduled_at:payload.command.scheduledAt};
 const label=historyLabels.matchDateLabel(match,ru);assert.match(label,ru?/^Запланированное время:/:/^Scheduled time:/);assert.ok(label.endsWith(new Date(match.scheduled_at).toLocaleString(ru?'ru-RU':'en-GB',{timeZone:'UTC'})+' UTC'));
 assert.match(historyLabels.matchDateLabel({...match,scheduled_at:null},ru),ru?/^Начало турнира:/:/^Tournament start:/);
 assert.equal(historyLabels.matchDateLabel({...match,scheduled_at:'invalid'},ru),ru?'Дата не указана':'Date unavailable');
});
const Renderer=require('react-test-renderer');global.IS_REACT_ACT_ENVIRONMENT=true;
async function mountEngine(t,ru,onSaved){
 const original=global.fetch;let update,view;let response={revision:1,state:stored.state},expired=false;const posts=[];
 global.fetch=async(_url,init={})=>{if(init.method==='POST')posts.push(JSON.parse(init.body));return expired?Response.json({error:'Sign in required'},{status:401}):Response.json(response);};
 const component=load('components/hub/TournamentEngine.tsx',{
  './TournamentBracket':()=>null,'./MatchSchedule':Schedule,'@/lib/supabase/client':{createClient:()=>({})},
  '@/lib/tournament/updates':{startTournamentUpdates:(_client,_id,refresh)=>{update=refresh;return {stop(){},refresh};}},
  '@/lib/tournament/engine':engine,'@/lib/tournament/result-form':load('lib/tournament/result-form.ts'),
 }).default;
 t.after(async()=>{if(view)await Renderer.act(async()=>view.unmount());global.fetch=original;});
 await Renderer.act(async()=>{view=Renderer.create(React.createElement(component,{id:uuid(4),game:'cs2',owner:true,ru,approved:entries,name:id=>'PRIVATE ENTRY '+id,onSaved,initial:{revision:1,state:stored.state}}));});
 return {view,posts,setResponse:value=>{response=value;},expire:()=>{expired=true;},refresh:async()=>{await Renderer.act(async()=>update());}};
}
for(const ru of [true,false])test(`engine updates refresh the parent catalog once per new revision RU=${ru}`,async t=>{
 let refreshes=0;const f=await mountEngine(t,ru,async()=>{refreshes++;});
 const newer={revision:2,state:engine.transition(stored.state,{type:'schedule',match:'U1.0',scheduledAt:payload.command.scheduledAt,reason:'Rescheduled match'})};
 f.setResponse(newer);await f.refresh();assert.equal(refreshes,1,'Parent catalog did not reload its match list');assert.match(JSON.stringify(f.view.toJSON()),/UTC/);
 await f.refresh();assert.equal(refreshes,1,'Unchanged revision should not fetch the full catalog again');
 f.setResponse({revision:1,state:stored.state});await f.refresh();assert.equal(refreshes,1);assert.match(JSON.stringify(f.view.toJSON()),/UTC/);
});
for(const ru of [true,false])test(`engine sign-out refreshes the parent to remove stale private catalog RU=${ru}`,async t=>{
 let refreshes=0;const f=await mountEngine(t,ru,async()=>{refreshes++;});assert.match(JSON.stringify(f.view.toJSON()),/PRIVATE ENTRY/);
 f.expire();await f.refresh();assert.equal(refreshes,1,'Parent must recheck the expired session');assert.equal(f.view.root.findAllByType('form').length,0);assert.doesNotMatch(JSON.stringify(f.view.toJSON()),/PRIVATE ENTRY/);
});
test('engine parent refresh retries a failed callback without a newer server revision',async t=>{
 let refreshes=0;const f=await mountEngine(t,true,async()=>{refreshes++;if(refreshes===1)throw Error('Temporary parent load failure');});
 f.setResponse({revision:2,state:stored.state});await f.refresh();assert.equal(refreshes,1);await f.refresh();assert.equal(refreshes,2);await f.refresh();assert.equal(refreshes,2);
});
test('engine unchanged initial revision does not reload the full catalog',async t=>{let refreshes=0;const f=await mountEngine(t,false,async()=>{refreshes++;});await f.refresh();assert.equal(refreshes,0);});
for(const ru of [true,false])for(const scenario of ['empty-score','invalid-penalties','zero-score','forfeit'])test(`organizer result form ${scenario} RU=${ru}`,async t=>{
 const f=await mountEngine(t,ru,async()=>{});
 const values={a:'0',b:'1',forfeit:'',reason:'Checked result'};
 if(scenario==='empty-score')values.a='';
 if(scenario==='invalid-penalties'){values.penalties_a='1.5';values.penalties_b='2';}
 if(scenario==='forfeit'){values.forfeit=entries[0];values.a='';values.b='';}
 const form=f.view.root.findAllByType('form').find(form=>form.findAllByType('input').some(input=>input.props.name==='a'));
 await Renderer.act(async()=>{form.props.onSubmit({preventDefault(){},currentTarget:values});});
 if(scenario==='empty-score'||scenario==='invalid-penalties'){
  assert.equal(f.posts.length,0);const alert=f.view.root.find(node=>node.props.role==='alert').children.join('');
  assert.match(alert,scenario==='empty-score'?(ru?/Проверьте счёт матча/:/Invalid score/):(ru?/Проверьте счёт пенальти/:/Invalid penalty shootout/));
 }else{
  assert.equal(f.posts.length,1);const result=f.posts[0].command.result;
  assert.equal(result.kind,scenario==='forfeit'?'forfeit':'played');
  if(scenario==='forfeit')assert.equal(result.loser,entries[0]);else assert.equal(result.a,0);
 }
});
for(const ru of [true,false])test(`published match time stays UTC across player time zones RU=${ru}`,()=>{
 const before=process.env.TZ;
 try{
  const match={engine_match:'U1.0',starts_at:'2026-10-22T10:00:00Z',scheduled_at:payload.command.scheduledAt};
  const labels=['Etc/UTC','America/Los_Angeles','Asia/Tokyo','Europe/Minsk'].map(zone=>{process.env.TZ=zone;return historyLabels.matchDateLabel(match,ru);});
  assert.equal(new Set(labels).size,1,'The same published match changed its displayed time');
  assert.ok(labels[0].endsWith('18:30:00 UTC'));
 }finally{if(before===undefined)delete process.env.TZ;else process.env.TZ=before;}
});
