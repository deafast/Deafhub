const {readFileSync}=require('node:fs');const vm=require('node:vm');const ts=require('typescript');const test=require('node:test');const assert=require('node:assert/strict');const React=require('react'),Renderer=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
function load(file){const code=ts.transpileModule(readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;const scope={exports:{},AbortController,fetch:(...a)=>global.fetch(...a),require};vm.runInNewContext(code,scope);return scope.exports.default;}
const uid='00000000-0000-4000-8000-000000000001',entry='00000000-0000-4000-8000-000000000002';
for(const ru of [true,false])for(const kind of ['checkin','results'])test(`${kind}: refresh after 401 removes private data and mutation controls RU=${ru}`,async t=>{
 const original=global.fetch;t.after(()=>{global.fetch=original;});let expired=false;
 const data=kind==='checkin'?{window:{version:uid,enabled:true,opens_at:'2026-10-01T10:00:00.000Z',closes_at:'2026-11-01T10:00:00.000Z'},checkins:[],rulesVersion:uid}:{rules:{require_confirmation:true},referees:[],reports:[{id:uid,match_id:'U1.0',is_current:true,result:{kind:'played',a:1,b:0},evidence:'PRIVATE MATCH EVIDENCE',decided_by:null}],confirmations:[],captainEntries:[entry],userId:uid};
 global.fetch=async url=>expired?Response.json({error:'Sign in required'},{status:401}):Response.json(url.includes('tournament-engine')?{state:{game:'cs2',matches:[{id:'U1.0',a:entry,b:uid,status:'ready'}]}}:data);
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
