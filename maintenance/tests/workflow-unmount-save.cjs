const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{create,act}=require('react-test-renderer');global.IS_REACT_ACT_ENVIRONMENT=true;
const uid='00000000-0000-4000-8000-000000000001';
for(const ru of [true,false])for(const kind of ['checkin','results','operations'])for(const phase of ['response','json'])test(`${kind} ignores saved ${phase} after unmount without extra GET RU=${ru}`,async()=>{
 let gets=0,finish;
 const data=kind==='operations'?{userId:uid,policy:{version:uid,body:'Participation requirements',require_acceptance:true,bronze:'none'},players:[],attestations:[],reviews:[],batches:[],awards:[],audit:[],engineAudit:[]}:kind==='checkin'?{window:null,checkins:[],rulesVersion:uid}:{rules:{require_confirmation:false},referees:[],reports:[],confirmations:[],captainEntries:[],userId:uid};
 const scope={exports:{},AbortController,FormData:class{constructor(values){this.values=values;}get(key){return this.values[key]??null;}},fetch:async(url,options={})=>{
  if(options.method==='POST')return phase==='response'?new Promise(resolve=>{finish=()=>resolve(Response.json({saved:true}));}):{ok:true,status:200,json:()=>new Promise(resolve=>{finish=()=>resolve({saved:true});})};
  gets++;return Response.json(url.includes('tournament-engine')?{state:null}:data);
 },require:name=>['./TournamentCheckin','./TournamentResults','./TournamentAutoAdmission'].includes(name)?{__esModule:true,default:()=>null}:require(name)};
 const file='components/hub/'+({checkin:'TournamentCheckin',results:'TournamentResults',operations:'TournamentOperations'}[kind])+'.tsx';
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,scope);
 let view;await act(async()=>{view=create(React.createElement(scope.exports.default,{id:uid,owner:true,ru,status:'open',locked:false,entries:[],players:[],userId:uid,policyVersion:null,name:()=> 'Team',onSaved:async()=>{}}));});
 if(kind==='operations')await act(async()=>view.root.findAllByType('button').find(n=>n.children.join('')===(ru?'Обновить':'Refresh')).props.onClick());
 const initialGets=gets;
 await act(async()=>{if(kind==='results')view.root.findAllByType('input').find(n=>n.props.type==='checkbox').props.onChange({target:{checked:true}});else view.root.findAllByType('form')[0].props.onSubmit({preventDefault(){},currentTarget:{reason:'Organizer review'}});});
 await act(async()=>view.unmount());
 await act(async()=>{finish();await new Promise(resolve=>setImmediate(resolve));});
 assert.equal(gets,initialGets,'completed save restarted loading a closed panel');
});
for(const ru of [true,false])for(const phase of ['response','json'])test(`profile awards aborts pending ${phase} on unmount RU=${ru}`,async()=>{
 let signal,finish;
 const child={__esModule:true,default:()=>null};
 const scope={exports:{},AbortController,fetch:async(url,options)=>{signal=options.signal;return phase==='response'?new Promise(resolve=>{finish=()=>resolve(Response.json({awards:[]}));}):{ok:true,status:200,json:()=>new Promise(resolve=>{finish=()=>resolve({awards:[]});})};},require:name=>['./TournamentCheckin','./TournamentResults','./TournamentAutoAdmission'].includes(name)?child:require(name)};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/hub/TournamentOperations.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,scope);
 let view;await act(async()=>{view=create(React.createElement(scope.exports.ProfileAwards,{ru}));});
 await act(async()=>view.root.findAllByType('button')[0].props.onClick());await act(async()=>view.unmount());
 assert.equal(signal?.aborted,true);await act(async()=>{finish();await new Promise(resolve=>setImmediate(resolve));});
});
for(const ru of [true,false])for(const kind of ['checkin','results'])test(`${kind} old tournament POST401 cannot clear new tournament or unlock its pending save RU=${ru}`,async()=>{
 const posts=[];
 const data=kind==='checkin'?{window:null,checkins:[],rulesVersion:uid}:{rules:{require_confirmation:false},referees:[],reports:[],confirmations:[],captainEntries:[],userId:uid};
 const scope={exports:{},AbortController,FormData:class{constructor(values){this.values=values;}get(key){return this.values[key]??null;}},fetch:async(url,options={})=>options.method==='POST'?new Promise(resolve=>posts.push(resolve)):Response.json(url.includes('tournament-engine')?{state:null}:data),require};
 const file='components/hub/'+(kind==='checkin'?'TournamentCheckin':'TournamentResults')+'.tsx';
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,scope);
 const props={id:uid,owner:true,ru,locked:false,entries:[],players:[],userId:uid,policyVersion:null,name:()=> 'Team'};let view;
 await act(async()=>{view=create(React.createElement(scope.exports.default,props));});
 const submit=()=>kind==='results'?view.root.findAllByType('input').find(n=>n.props.type==='checkbox').props.onChange({target:{checked:true}}):view.root.findAllByType('form')[0].props.onSubmit({preventDefault(){},currentTarget:{reason:'Organizer review'}});
 await act(async()=>submit());
 await act(async()=>view.update(React.createElement(scope.exports.default,{...props,id:'00000000-0000-4000-8000-000000000003'})));
 await act(async()=>submit());assert.equal(posts.length,2);
 await act(async()=>{posts[0](new Response('Expired old session',{status:401}));await new Promise(resolve=>setImmediate(resolve));});
 assert.ok(view.root.findAllByType('form').length>0);assert.equal(view.root.findAll(n=>n.props.role==='alert').length,0);
 const saveControl=kind==='results'?view.root.findAllByType('input').find(n=>n.props.type==='checkbox'):view.root.findAllByType('button').find(n=>n.children.join('')===(ru?'Сохранить окно check-in':'Save check-in window'));
 assert.ok(saveControl);assert.equal(saveControl.props.disabled,true);
 await act(async()=>{posts[1](Response.json({saved:true}));await new Promise(resolve=>setImmediate(resolve));});
 assert.equal(view.root.findAll(n=>n.props.role==='alert').length,0);await act(async()=>view.unmount());
});
