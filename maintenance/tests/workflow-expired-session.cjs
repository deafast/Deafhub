const {readFileSync}=require('node:fs');const vm=require('node:vm');const ts=require('typescript');const test=require('node:test');const assert=require('node:assert/strict');const React=require('react'),Renderer=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
function load(file,imports={},exportName='default'){const code=ts.transpileModule(readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;const scope={exports:{},AbortController,fetch:(...a)=>global.fetch(...a),require:name=>imports[name]||require(name)};vm.runInNewContext(code,scope);return scope.exports[exportName];}
const uid='00000000-0000-4000-8000-000000000001',entry='00000000-0000-4000-8000-000000000002';
for(const ru of [true,false])for(const kind of ['checkin','results'])for(const json of [true,false])test(`${kind}: refresh after 401 removes private data and mutation controls RU=${ru} JSON=${json}`,async t=>{
 const original=global.fetch;t.after(()=>{global.fetch=original;});let expired=false;
 const data=kind==='checkin'?{window:{version:uid,enabled:true,opens_at:'2026-10-01T10:00:00.000Z',closes_at:'2026-11-01T10:00:00.000Z'},checkins:[],rulesVersion:uid}:{rules:{require_confirmation:true},referees:[],reports:[{id:uid,match_id:'U1.0',is_current:true,result:{kind:'played',a:1,b:0},evidence:'PRIVATE MATCH EVIDENCE',decided_by:null}],confirmations:[],captainEntries:[entry],userId:uid};
 global.fetch=async url=>expired?(json?Response.json({error:'Sign in required'},{status:401}):new Response('Session expired',{status:401})):Response.json(url.includes('tournament-engine')?{state:{game:'cs2',matches:[{id:'U1.0',a:entry,b:uid,status:'ready'}]}}:data);
 const component=load(kind==='checkin'?'components/hub/TournamentCheckin.tsx':'components/hub/TournamentResults.tsx');
 const props={id:uid,owner:kind==='checkin',ru,locked:false,userId:uid,players:[{entry_id:entry,user_id:uid,nickname:'PRIVATE REGISTERED PLAYER'}],entries:[{id:entry,status:'approved'}],policyVersion:null,name:()=> 'PRIVATE ENTRY NAME'};
 let view;await Renderer.act(async()=>{view=Renderer.create(React.createElement(component,props));});
 assert.ok(view.root.findAllByType('form').length>0);const before=JSON.stringify(view.toJSON());assert.match(before,kind==='checkin'?/PRIVATE ENTRY NAME/:/PRIVATE MATCH EVIDENCE/);
 expired=true;const label=kind==='checkin'?(ru?'Обновить готовность':'Refresh check-in'):(ru?'Обновить протоколы':'Refresh reports');
 const refresh=view.root.findAllByType('button').find(n=>n.children.join('')===label);assert.ok(refresh);
 await Renderer.act(async()=>{refresh.props.onClick();await new Promise(resolve=>setImmediate(resolve));});
 assert.equal(view.root.findAllByType('form').length,0,'Stale mutation controls remained after sign-out');const after=JSON.stringify(view.toJSON());assert.ok(!after.includes('PRIVATE ENTRY NAME'));assert.ok(!after.includes('PRIVATE MATCH EVIDENCE'));assert.equal(view.root.findAll(n=>n.props.role==='alert').length,1);
 await Renderer.act(async()=>view.unmount());
});

const child={__esModule:true,default:()=>null};
const operationImports={'./TournamentCheckin':child,'./TournamentAutoAdmission':child,'./TournamentResults':child};
const award={id:'award',batch_id:'batch',entry_id:entry,recipient_id:uid,place:1,game:'cs2',tournament_title:'PRIVATE TOURNAMENT',team_name:'PRIVATE TEAM',nickname:'PRIVATE WINNER',avatar_url:null,created_at:'2026-10-22T10:00:00Z'};
const operationData={userId:uid,policy:{version:uid,body:'PRIVATE PARTICIPATION RULES',require_acceptance:true,bronze:'none'},players:[{entry_id:entry,user_id:uid,nickname:'PRIVATE PLAYER'}],attestations:[],reviews:[],batches:[],awards:[],audit:[],engineAudit:[]};
const operationProps=ru=>({id:uid,owner:true,ru,status:'open',locked:false,entries:[{id:entry,status:'approved'}],name:()=> 'PRIVATE TEAM',onSaved:async()=>{}});
const click=async(view,label)=>Renderer.act(async()=>{view.root.findAllByType('button').find(n=>n.children.join('')===label).props.onClick();});
for(const ru of [true,false])for(const kind of ['awards','operations'])for(const json of [true,false])test(`${kind}: 401 clears previous snapshot and retry recovers RU=${ru} JSON=${json}`,async t=>{
 const original=global.fetch;t.after(()=>{global.fetch=original;});let expired=false;
 global.fetch=async()=>expired?(json?Response.json({error:'Sign in required'},{status:401}):new Response('Session expired',{status:401})):Response.json(kind==='awards'?{awards:[award]}:operationData);
 const component=load('components/hub/TournamentOperations.tsx',operationImports,kind==='awards'?'ProfileAwards':'default');
 let view;await Renderer.act(async()=>{view=Renderer.create(React.createElement(component,operationProps(ru)));});
 const refresh=kind==='awards'?(ru?'Обновить награды':'Refresh awards'):(ru?'Обновить':'Refresh');
 await click(view,refresh);assert.match(JSON.stringify(view.toJSON()),kind==='awards'?/PRIVATE WINNER/:/PRIVATE PARTICIPATION RULES/);
 expired=true;await click(view,refresh);
 assert.doesNotMatch(JSON.stringify(view.toJSON()),/PRIVATE WINNER|PRIVATE TEAM|PRIVATE PLAYER|PRIVATE PARTICIPATION RULES/);
 assert.equal(view.root.findAllByType('form').length,0);assert.equal(view.root.findAllByType('article').length,0);
 assert.match(JSON.stringify(view.toJSON()),ru?/Войдите снова/:/Sign in again/);
 expired=false;await click(view,refresh);
 assert.equal(view.root.findAll(n=>n.props.role==='alert').length,0);assert.match(JSON.stringify(view.toJSON()),kind==='awards'?/PRIVATE WINNER/:/PRIVATE PARTICIPATION RULES/);
 await Renderer.act(async()=>view.unmount());
});
for(const ru of [true,false])for(const json of [true,false])test(`operations POST 401 cannot be undone by a pending GET RU=${ru} JSON=${json}`,async t=>{
 const original=global.fetch;t.after(()=>{global.fetch=original;});let gets=0,finishGet;
 global.fetch=async(url,init={})=>init.method==='POST'?(json?Response.json({error:'Sign in required'},{status:401}):new Response('Session expired',{status:401})):++gets===1?Response.json(operationData):new Promise(resolve=>{finishGet=resolve;});
 const component=load('components/hub/TournamentOperations.tsx',operationImports);let view;
 await Renderer.act(async()=>{view=Renderer.create(React.createElement(component,{...operationProps(ru),status:'finished',locked:true}));});
 const refresh=ru?'Обновить':'Refresh';await click(view,refresh);await click(view,refresh);
 await click(view,ru?'Выдать награды по результатам':'Issue result-based awards');
 assert.doesNotMatch(JSON.stringify(view.toJSON()),/PRIVATE PARTICIPATION RULES|PRIVATE PLAYER/);
 await Renderer.act(async()=>{finishGet(Response.json(operationData));});
 assert.doesNotMatch(JSON.stringify(view.toJSON()),/PRIVATE PARTICIPATION RULES|PRIVATE PLAYER/);assert.equal(view.root.findAllByType('form').length,0);
 await Renderer.act(async()=>view.unmount());
});

for(const ru of [true,false])for(const kind of ['checkin','results'])for(const late of ['initial','refresh','json','failure'])test(`${kind}: obsolete ${late} cannot restore data after current401 RU=${ru}`,async t=>{
 const original=global.fetch;t.after(()=>{global.fetch=original;});let calls=0,finish;
 const snapshot=kind==='checkin'?{window:{version:uid,enabled:true,opens_at:'2026-10-01T10:00:00Z',closes_at:'2027-01-01T10:00:00Z'},checkins:[],rulesVersion:uid}:{rules:{require_confirmation:true},referees:[],reports:[{id:uid,match_id:'U1.0',is_current:true,result:{kind:'played',a:1,b:0},evidence:'PRIVATE LATE EVIDENCE',decided_by:null}],confirmations:[],captainEntries:[entry],userId:uid};
 global.fetch=async url=>{if(url.includes('tournament-engine'))return Response.json({state:{game:'cs2',matches:[{id:'U1.0',a:entry,b:uid,status:'ready'}]}});calls++;if(late==='initial'&&calls===1)return new Promise(resolve=>{finish=resolve;});if(late!=='initial'&&calls===1)return Response.json(snapshot);if(calls===2&&late==='json')return {ok:true,status:200,json:()=>new Promise(resolve=>{finish=resolve;})};if(calls===2&&late!=='initial')return new Promise(resolve=>{finish=resolve;});return new Response('Session expired',{status:401});};
 const Component=load(kind==='checkin'?'components/hub/TournamentCheckin.tsx':'components/hub/TournamentResults.tsx');let view;
 await Renderer.act(async()=>{view=Renderer.create(React.createElement(Component,{id:uid,owner:kind==='checkin',ru,locked:false,userId:uid,players:[{entry_id:entry,user_id:uid,nickname:'PRIVATE PLAYER'}],entries:[{id:entry,status:'approved'}],policyVersion:null,name:()=> 'PRIVATE ENTRY'}));});
 const refresh=()=>view.root.findAllByType('button').find(b=>b.children.join('')===(kind==='checkin'?(ru?'Обновить готовность':'Refresh check-in'):(ru?'Обновить протоколы':'Refresh reports'))).props.onClick();
 if(late!=='initial')await Renderer.act(async()=>{refresh();});
 await Renderer.act(async()=>{refresh();});
 await Renderer.act(async()=>{finish(late==='json'?snapshot:late==='failure'?new Response('Old error',{status:503}):Response.json(snapshot));});
 assert.equal(view.root.findAllByType('form').length,0);const output=JSON.stringify(view.toJSON());assert.doesNotMatch(output,/PRIVATE ENTRY|PRIVATE PLAYER|PRIVATE LATE EVIDENCE/);assert.match(output,ru?/Войдите в аккаунт/:/Sign in to continue/);
 await Renderer.act(async()=>view.unmount());
});

for(const ru of [true,false])test(`operations save reloads fresh state despite an older pending refresh RU=${ru}`,async t=>{
 const original=global.fetch;t.after(()=>{global.fetch=original;});let gets=0,finish,updated=false;
 global.fetch=async(url,init={})=>{if(init.method==='POST'){updated=true;return Response.json({saved:true});}if(++gets===2)return new Promise(resolve=>{finish=resolve;});return Response.json(updated?{...operationData,policy:{...operationData.policy,body:'FRESH PARTICIPATION RULES'}}:operationData);};
 const Component=load('components/hub/TournamentOperations.tsx',operationImports);let view;
 await Renderer.act(async()=>{view=Renderer.create(React.createElement(Component,{...operationProps(ru),status:'finished',locked:true}));});
 await click(view,ru?'Обновить':'Refresh');await click(view,ru?'Обновить':'Refresh');
 await click(view,ru?'Выдать награды по результатам':'Issue result-based awards');
 assert.match(JSON.stringify(view.toJSON()),/FRESH PARTICIPATION RULES/);assert.equal(gets,3);
 await Renderer.act(async()=>{finish(Response.json(operationData));});
 assert.match(JSON.stringify(view.toJSON()),/FRESH PARTICIPATION RULES/);assert.doesNotMatch(JSON.stringify(view.toJSON()),/PRIVATE PARTICIPATION RULES/);
 await Renderer.act(async()=>view.unmount());
});
