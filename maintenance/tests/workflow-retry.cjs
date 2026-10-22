const {readFileSync}=require('node:fs');const vm=require('node:vm');const ts=require('typescript');const test=require('node:test');const assert=require('node:assert/strict');const React=require('react'),Renderer=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
function load(file){const code=ts.transpileModule(readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;const scope={exports:{},AbortController,fetch:(...a)=>global.fetch(...a),require};vm.runInNewContext(code,scope);return scope.exports.default;}
const uid='00000000-0000-4000-8000-000000000001',entry='00000000-0000-4000-8000-000000000002';
for(const ru of [true,false])for(const kind of ['checkin','results'])for(const scenario of ['retry','notice'])test(`${kind}: ${scenario} after failed refresh RU=${ru}`,async t=>{
 const original=global.fetch;t.after(()=>{global.fetch=original;});let failed=false;
 const data=kind==='checkin'?{window:{version:uid,enabled:true,opens_at:'2026-10-01T10:00:00.000Z',closes_at:'2026-11-01T10:00:00.000Z'},checkins:[],rulesVersion:uid}:{rules:{require_confirmation:true},referees:[],reports:[],confirmations:[],captainEntries:[entry],userId:uid};
 global.fetch=async(url,init={})=>failed?Response.json({error:'Unavailable'},{status:503}):Response.json(init.method==='POST'?{saved:true}:url.includes('tournament-engine')?{state:{game:'cs2',matches:[{id:'U1.0',a:entry,b:uid,status:'ready'}]}}:data);
 const component=load(kind==='checkin'?'components/hub/TournamentCheckin.tsx':'components/hub/TournamentResults.tsx');const props={id:uid,owner:true,ru,locked:false,userId:uid,players:[{entry_id:entry,user_id:uid,nickname:'Registered player'}],entries:[{id:entry,status:'approved'}],policyVersion:null,name:()=> 'Registered entry'};
 let view;await Renderer.act(async()=>{view=Renderer.create(React.createElement(component,props));});
 // Produce a real success notice through an existing action, not by setting component state.
 if(scenario==='notice')await Renderer.act(async()=>{
  if(kind==='checkin'){const label=ru?'Я готов к турниру':'Check in';view.root.findAllByType('button').find(n=>n.children.join('')===label).props.onClick();}
  else view.root.findAllByType('input').find(n=>n.props.type==='checkbox').props.onChange({target:{checked:true}});
  await new Promise(resolve=>setImmediate(resolve));
 });
 assert.equal(view.root.findAll(n=>n.props.role==='status').length,scenario==='notice'?1:0,'Unexpected action notice');
 const refreshLabel=kind==='checkin'?(ru?'Обновить готовность':'Refresh check-in'):(ru?'Обновить протоколы':'Refresh reports');
 const click=async()=>Renderer.act(async()=>{view.root.findAllByType('button').find(n=>n.children.join('')===refreshLabel).props.onClick();await new Promise(resolve=>setImmediate(resolve));});
 failed=true;await click();assert.equal(view.root.findAll(n=>n.props.role==='alert').length,1);assert.equal(view.root.findAll(n=>n.props.role==='status').length,0,'Old Saved notice remained alongside failed refresh');
 failed=false;await click();assert.equal(view.root.findAll(n=>n.props.role==='alert').length,0,'Old load error remained after successful retry');assert.ok(view.root.findAllByType('form').length>0);
 await Renderer.act(async()=>view.unmount());
});
