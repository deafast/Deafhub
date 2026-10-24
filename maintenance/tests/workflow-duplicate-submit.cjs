const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{create,act}=require('react-test-renderer');global.IS_REACT_ACT_ENVIRONMENT=true;
const uid='00000000-0000-4000-8000-000000000001';
for(const ru of [true,false])for(const kind of ['operations','checkin','results'])test(`${kind} sends one mutation for rapid duplicate submissions and permits retry RU=${ru}`,async()=>{
 let posts=0,finish;
 const data=kind==='operations'?{userId:uid,policy:{version:uid,body:'Published participation requirements',require_acceptance:true,bronze:'none'},players:[],attestations:[],reviews:[],batches:[],awards:[],audit:[],engineAudit:[]}:kind==='checkin'?{window:null,checkins:[],rulesVersion:uid}:{rules:{require_confirmation:false},referees:[],reports:[],confirmations:[],captainEntries:[],userId:uid};
 const files={operations:'TournamentOperations',checkin:'TournamentCheckin',results:'TournamentResults'};
 const child={__esModule:true,default:()=>null},imports={'./TournamentCheckin':child,'./TournamentResults':child,'./TournamentAutoAdmission':child};
 const scope={exports:{},AbortController,FormData:class{constructor(values){this.values=values;}get(key){return this.values[key]??null;}},fetch:async(url,options={})=>{
  if(options.method==='POST')return ++posts===1?new Promise(resolve=>{finish=resolve;}):Response.json({saved:true});
  return Response.json(url.includes('tournament-engine')?{state:null}:data);
 },require:name=>imports[name]??require(name)};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/hub/'+files[kind]+'.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,scope);
 let view;await act(async()=>{view=create(React.createElement(scope.exports.default,{id:uid,owner:true,ru,status:'open',locked:false,entries:[],players:[],userId:uid,policyVersion:null,name:()=> 'Team',onSaved:async()=>{}}));});
 if(kind==='operations')await act(async()=>view.root.findAllByType('button').find(n=>n.children.join('')===(ru?'Обновить':'Refresh')).props.onClick());
 const action=()=>kind==='results'?()=>view.root.findAllByType('input').find(n=>n.props.type==='checkbox').props.onChange({target:{checked:true}}):()=>view.root.findAllByType('form')[0].props.onSubmit({preventDefault(){},currentTarget:{body:'Published participation requirements',bronze:'none',reason:'Organizer review'}});
 await act(async()=>{const submit=action();submit();submit();});assert.equal(posts,1,'duplicate POST was sent before the busy state changed');
 await act(async()=>{finish(Response.json({error:'Unavailable'},{status:503}));await new Promise(resolve=>setImmediate(resolve));});assert.equal(view.root.findAll(n=>n.props.role==='alert').length,1);
 await act(async()=>{action()();await new Promise(resolve=>setImmediate(resolve));});assert.equal(posts,2);assert.equal(view.root.findAll(n=>n.props.role==='alert').length,0);assert.match(JSON.stringify(view.toJSON()),ru?/Сохранено|Готовность обновлена/:/Saved|Check-in updated/);
 await act(async()=>view.unmount());
});
