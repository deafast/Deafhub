const {readFileSync}=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{create,act}=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
function load(file,extra={}){
 const scope={exports:{},AbortController,FormData:class{constructor(values){this.values=values;}get(key){return this.values[key]??null;}[Symbol.iterator](){return Object.entries(this.values)[Symbol.iterator]();}},...extra};
 scope.require=extra.require??require;
 vm.runInNewContext(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,scope);
 return scope.exports;
}
for(const ru of [true,false])for(const delayedJson of [true,false])test(`admission ignores previous tournament refresh, delayed JSON=${delayedJson}, RU=${ru}`,async()=>{
 let calls=0,finish,signal;
 const Component=load('components/hub/TournamentAutoAdmission.tsx',{fetch:async(url,options)=>{
  calls++;
  if(calls!==2)return Response.json({enabled:false});
  signal=options.signal;
  if(delayedJson)return {ok:true,status:200,json:()=>new Promise(resolve=>{finish=()=>resolve({enabled:true});})};
  return new Promise(resolve=>{finish=()=>resolve(Response.json({enabled:true}));});
 }}).default;
 const props={id:'first',owner:true,locked:false,ru,onSaved:async()=>{}};let view;
 await act(async()=>{view=create(React.createElement(Component,props));});
 await act(async()=>{view.root.findAllByType('button')[0].props.onClick();});
 await act(async()=>{view.update(React.createElement(Component,{...props,id:'second'}));});
 await act(async()=>finish());
 assert.equal(view.root.findAllByType('input').find(n=>n.props.type==='checkbox').props.defaultChecked,false,'old tournament replaced current admission settings');
 assert.equal(signal?.aborted,true,'obsolete refresh was not cancelled');
 assert.equal(view.root.findByType('section').props['aria-busy'],false);
 await act(async()=>view.unmount());
});
for(const ru of [true,false])test(`profile contact save ignores duplicate submit and retries after failure RU=${ru}`,async()=>{
 let calls=0,finish,refreshes=0;
 const schema=load('lib/profile.ts').profileSchema;
 const Component=load('components/auth/ProfileForm.tsx',{
  fetch:()=>{calls++;return new Promise(resolve=>{finish=resolve;});},
  require:name=>({'next/navigation':{useRouter:()=>({refresh:()=>refreshes++})},'@/store/useLanguageStore':{useLanguageStore:select=>select({language:ru?'ru':'en'})},'@/lib/profile':{profileSchema:schema},'@/components/ui/button':{Button:props=>React.createElement('button',props)}}[name]??require(name)),
 }).default;
 const initial={nickname:'Player',region:'europe',telegram:'@valid_name',vk:'player'};let view;
 await act(async()=>{view=create(React.createElement(Component,{initial}));});
 const event={preventDefault(){},currentTarget:initial};let first,second;
 await act(async()=>{const submit=view.root.findByType('form').props.onSubmit;first=submit(event);second=submit(event);});
 assert.equal(calls,1,'duplicate PUT for the same contact form');
 await act(async()=>{finish(new Response('',{status:503}));await Promise.all([first,second]);});
 assert.equal(refreshes,0);
 let retry;await act(async()=>{retry=view.root.findByType('form').props.onSubmit(event);});
 assert.equal(calls,2);
 await act(async()=>{finish(Response.json({saved:true}));await retry;});
 assert.equal(refreshes,1);
 assert.equal(view.root.findAll(n=>n.props.role==='alert').length,0);
 await act(async()=>view.unmount());
});
for(const response of ['unauthorized','failure'])test(`obsolete admission refresh ${response} cannot replace the new tournament state`,async()=>{
 let calls=0,finish;
 const Component=load('components/hub/TournamentAutoAdmission.tsx',{fetch:async()=>++calls===2?new Promise(resolve=>{finish=resolve;}):Response.json({enabled:false})}).default;
 const props={id:'first',owner:true,locked:false,ru:false,onSaved:async()=>{}};let view;
 await act(async()=>{view=create(React.createElement(Component,props));});
 await act(async()=>view.root.findAllByType('button')[0].props.onClick());
 await act(async()=>view.update(React.createElement(Component,{...props,id:'second'})));
 await act(async()=>finish(response==='unauthorized'?new Response('Expired',{status:401}):Response.json({error:'Unavailable'},{status:503})));
 assert.equal(view.root.findAllByType('form').length,1);
 assert.equal(view.root.findAll(n=>n.props.role==='alert').length,0);
 await act(async()=>view.unmount());
});
test('admission save completing after a tournament switch does not refresh or announce the old tournament',async()=>{
 let finish,saved=0,signal;
 const Component=load('components/hub/TournamentAutoAdmission.tsx',{fetch:async(url,options)=>{
  if(options.method==='POST'){signal=options.signal;return new Promise(resolve=>{finish=resolve;});}
  return Response.json({enabled:false});
 }}).default;
 const props={id:'first',owner:true,locked:false,ru:false,onSaved:async()=>saved++};let view,pending;
 await act(async()=>{view=create(React.createElement(Component,props));});
 await act(async()=>{pending=view.root.findByType('form').props.onSubmit({preventDefault(){},currentTarget:{enabled:'on',reason:'Reviewed'}});});
 await act(async()=>view.update(React.createElement(Component,{...props,id:'second'})));
 await act(async()=>{finish(Response.json({saved:true,admitted:2}));await pending;});
 assert.equal(saved,0);
 assert.equal(signal.aborted,true);
 assert.equal(view.root.findAll(n=>n.props.role==='status').length,0);
 assert.equal(view.root.findAllByType('input').find(n=>n.props.type==='checkbox').props.defaultChecked,false);
 await act(async()=>view.unmount());
});
