const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{create,act}=require('react-test-renderer');global.IS_REACT_ACT_ENVIRONMENT=true;
const uid='00000000-0000-4000-8000-000000000001',entry='00000000-0000-4000-8000-000000000002';
for(const ru of [true,false])for(const expired of ['reports','engine'])test(`report refresh handles ${expired} 401 before the other request finishes RU=${ru}`,async()=>{
 let refresh=false,finish,signal;
 const report={rules:{require_confirmation:true},referees:[],reports:[{id:uid,match_id:'U1.0',is_current:true,result:{kind:'played',a:1,b:0},evidence:'PRIVATE CAPTAIN EVIDENCE',decided_by:null}],confirmations:[],captainEntries:[entry],userId:uid};
 const state={state:{game:'cs2',matches:[{id:'U1.0',a:entry,b:uid,status:'ready'}]}};
 const scope={exports:{},AbortController,fetch:async(url,options)=>{
  const engine=url.includes('tournament-engine');
  if(!refresh)return Response.json(engine?state:report);
  if(engine===(expired==='engine'))return new Response('Session expired',{status:401});
  signal=options.signal;return new Promise(resolve=>{finish=()=>resolve(Response.json(engine?state:report));});
 },require};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/hub/TournamentResults.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,scope);
 let view;await act(async()=>{view=create(React.createElement(scope.exports.default,{id:uid,owner:false,ru,locked:true,name:()=> 'PRIVATE ENTRY',players:[]}));});
 assert.match(JSON.stringify(view.toJSON()),/PRIVATE CAPTAIN EVIDENCE/);refresh=true;
 await act(async()=>view.root.findAllByType('button').find(n=>n.children.join('')===(ru?'Обновить протоколы':'Refresh reports')).props.onClick());
 assert.equal(view.root.findAllByType('form').length,0,'401 waited for an unrelated pending request');
 assert.doesNotMatch(JSON.stringify(view.toJSON()),/PRIVATE CAPTAIN EVIDENCE/);assert.equal(signal.aborted,true);
 await act(async()=>finish());assert.equal(view.root.findAllByType('form').length,0);
 assert.equal(view.root.findAll(n=>n.props.role==='alert').length,1);await act(async()=>view.unmount());
});
