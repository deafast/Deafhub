const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{create,act}=require('react-test-renderer');global.IS_REACT_ACT_ENVIRONMENT=true;
const uid='00000000-0000-4000-8000-000000000001',entry='00000000-0000-4000-8000-000000000002';
for(const ru of [true,false])for(const kind of ['operations','checkin','results'])for(const phase of ['response','json','failure'])test(`${kind} rejects save completion from before GET401 and permits recovery ${phase} RU=${ru}`,async()=>{
 let gets=0,posts=0,saved=0,finishGet,finishPost;
 const data=kind==='operations'?{userId:uid,policy:{version:uid,body:'PRIVATE PARTICIPATION RULES',require_acceptance:true,bronze:'none'},players:[],attestations:[],reviews:[],batches:[],awards:[],audit:[],engineAudit:[]}:kind==='checkin'?{window:{version:uid,enabled:true,opens_at:'2026-10-01T10:00:00Z',closes_at:'2027-01-01T10:00:00Z'},checkins:[],rulesVersion:uid}:{rules:{require_confirmation:false},referees:[],reports:[],confirmations:[],captainEntries:[],userId:uid};
 const child={__esModule:true,default:()=>null},files={operations:'TournamentOperations',checkin:'TournamentCheckin',results:'TournamentResults'};
 const scope={exports:{},Error,AbortController,fetch:async(url,options={})=>{
  if(options.method==='POST'){
   if(++posts>1)return Response.json({saved:true});
   if(phase==='json')return {ok:true,status:200,json:()=>new Promise(resolve=>{finishPost=()=>resolve({saved:true});})};
   return new Promise(resolve=>{finishPost=()=>resolve(phase==='failure'?Response.json({error:'Late failed save'},{status:503}):Response.json({saved:true}));});
  }
  if(url.includes('tournament-engine'))return Response.json({state:null});
  if(++gets===2)return new Promise(resolve=>{finishGet=resolve;});
  return Response.json(data);
 },require:name=>['./TournamentCheckin','./TournamentResults','./TournamentAutoAdmission'].includes(name)?child:require(name)};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/hub/'+files[kind]+'.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,scope);
 let view;await act(async()=>{view=create(React.createElement(scope.exports.default,{id:uid,owner:kind!=='checkin',ru,status:'finished',locked:kind==='operations',userId:uid,players:[{entry_id:entry,user_id:uid,nickname:'Player'}],entries:[{id:entry,status:'approved'}],policyVersion:null,name:()=> 'PRIVATE ENTRY',onSaved:async()=>{saved++;}}));});
 const labels={operations:ru?'Обновить':'Refresh',checkin:ru?'Обновить готовность':'Refresh check-in',results:ru?'Обновить протоколы':'Refresh reports'};
 const refresh=()=>view.root.findAllByType('button').find(n=>n.children.join('')===labels[kind]).props.onClick();
 const mutate=()=>kind==='results'?view.root.findAllByType('input').find(n=>n.props.type==='checkbox').props.onChange({target:{checked:true}}):view.root.findAllByType('button').find(n=>n.children.join('')===(kind==='operations'?(ru?'Выдать награды по результатам':'Issue result-based awards'):(ru?'Я готов к турниру':'Check in'))).props.onClick();
 if(kind==='operations')await act(async()=>refresh());
 await act(async()=>refresh());await act(async()=>mutate());
 assert.equal(posts,1);await act(async()=>finishGet(new Response('Session expired',{status:401})));
 await act(async()=>{finishPost();await new Promise(resolve=>setImmediate(resolve));});
 assert.equal(gets,2,'old save restarted reading after the current session expired');
 assert.equal(saved,0);assert.doesNotMatch(JSON.stringify(view.toJSON()),/PRIVATE PARTICIPATION RULES|PRIVATE ENTRY|Late failed save|Сохранено\.|Saved\./);
 assert.match(JSON.stringify(view.toJSON()),ru?/Войдите снова|Войдите в аккаунт/:/Sign in again|Sign in to continue/);
 await act(async()=>refresh());await act(async()=>mutate());
 assert.equal(posts,2,'session recovery left the mutation guard locked');
 assert.equal(view.root.findAll(n=>n.props.role==='alert').length,0);
 await act(async()=>view.unmount());
});
