const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{create,act}=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
const id='00000000-0000-4000-8000-000000000001';
const messages={
 admission:count=>[`Сохранено. Допущено проверенных заявок: ${count}.`,`Saved. Reviewed entries admitted: ${count}.`],
 checkin:()=>['Готовность обновлена.','Check-in updated.'],
 results:()=>['Сохранено. Результат в сетке публикует организатор.','Saved. The organizer publishes the result to the bracket.'],
 operations:()=>['Сохранено.','Saved.'],
};
async function fixture(kind,ru,{pending=false,expired=false}={}){
 let gets=0,posts=0,finish,saved=0;
 const admitted=ru?0:2;
 const data=kind==='admission'?{enabled:false}:kind==='operations'?{userId:id,policy:{version:id,body:'QA participation requirements',require_acceptance:true,bronze:'none'},players:[],attestations:[],reviews:[],batches:[],awards:[],audit:[],engineAudit:[]}:kind==='checkin'?{window:null,checkins:[],rulesVersion:id}:{rules:{require_confirmation:false},referees:[],reports:[],confirmations:[],captainEntries:[],userId:id};
 const response=()=>expired?new Response('',{status:401}):Response.json({saved:true,admitted});
 const scope={exports:{},AbortController,FormData:class{constructor(values){this.values=values;}get(key){return this.values[key]??null;}},fetch:async(url,options={})=>{
  if(options.method==='POST'){posts++;return pending?new Promise(resolve=>{finish=()=>resolve(response());}):response();}
  gets++;return Response.json(url.includes('tournament-engine')?{state:null}:data);
 },require:name=>['./TournamentCheckin','./TournamentResults','./TournamentAutoAdmission'].includes(name)?{__esModule:true,default:()=>null}:require(name)};
 const file='components/hub/'+({admission:'TournamentAutoAdmission',checkin:'TournamentCheckin',results:'TournamentResults',operations:'TournamentOperations'}[kind])+'.tsx';
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,scope);
 const Component=scope.exports.default,props={id,ru,owner:true,locked:false,status:'open',entries:[],players:[],userId:id,policyVersion:null,name:()=> 'QA team',onSaved:async()=>{saved++;}};
 let view;await act(async()=>{view=create(React.createElement(Component,props));});
 if(kind==='operations')await act(async()=>view.root.findAllByType('button').find(n=>n.children.join('')===(ru?'Обновить':'Refresh')).props.onClick());
 return {view,admitted,requests:()=>gets+posts,posts:()=>posts,saved:()=>saved,
  submit:async()=>{await act(async()=>{
   if(kind==='results')view.root.findAllByType('input').find(n=>n.props.type==='checkbox').props.onChange({target:{checked:true}});
   else void view.root.findAllByType('form')[0].props.onSubmit({preventDefault(){},currentTarget:{enabled:kind==='admission'?'on':'',reason:'QA settings',body:'QA participation requirements',bronze:'none',require_acceptance:'on'}});
  });},
  language:async value=>{await act(async()=>view.update(React.createElement(Component,{...props,ru:value})));},
  finish:async()=>{await act(async()=>{finish();await new Promise(resolve=>setImmediate(resolve));});},
  close:async()=>{await act(async()=>view.unmount());},
 };
}
for(const ru of [true,false])for(const kind of Object.keys(messages))for(const phase of ['after-save','pending-save'])test(`${kind} saved feedback follows current language without another request ${phase} RU=${ru}`,async t=>{
 const f=await fixture(kind,ru,{pending:phase==='pending-save'});t.after(f.close);
 await f.submit();const before=f.requests();
 await f.language(!ru);assert.equal(f.requests(),before,'language change repeated a request');
 if(phase==='pending-save')await f.finish();
 const statuses=f.view.root.findAll(n=>n.props.role==='status').map(n=>n.children.join(''));
 assert.ok(statuses.includes(messages[kind](f.admitted)[ru?1:0]),'saved notice retained the previous language');
 assert.equal(f.posts(),1);
 if(kind==='operations'||kind==='admission')assert.equal(f.saved(),1);
});
for(const ru of [true,false])for(const phase of ['after-save','pending-save'])test(`organizer session-expiry message follows current language ${phase} RU=${ru}`,async t=>{
 const f=await fixture('operations',ru,{pending:phase==='pending-save',expired:true});t.after(f.close);
 await f.submit();const before=f.requests();await f.language(!ru);assert.equal(f.requests(),before);
 if(phase==='pending-save')await f.finish();
 const alert=f.view.root.find(n=>n.props.role==='alert').children.join('');
 assert.equal(alert,ru?'Sign in again to view rules and awards.':'Войдите снова, чтобы открыть условия и награды.');
 assert.equal(f.view.root.findAllByType('form').length,0);assert.equal(f.saved(),0);
});
