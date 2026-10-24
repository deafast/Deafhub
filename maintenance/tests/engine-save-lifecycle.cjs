const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{create,act}=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
function load(file,imports={},globals={}){
 const scope={exports:{},Error,AbortController,crypto,structuredClone,document:{visibilityState:'visible',addEventListener(){},removeEventListener(){}},FormData:class{constructor(values){this.values=values;}get(key){return this.values[key]??null;}},require:name=>imports[name]??require(name),...globals};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,scope);return scope.exports;
}
const engine=load('lib/tournament/engine.ts'),resultForm=load('lib/tournament/result-form.ts'),Schedule=load('components/hub/MatchSchedule.tsx').default;
const entries=['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002'];
async function mount(t,{ru=true,game='cs2',fetch,onSaved=async()=>{}}){
 const state=engine.createTournament(game,entries,{format:'single',grandFinal:'single',bestOf:1,groups:[],qualify:2,points:{win:3,draw:1,loss:0}});
 const Component=load('components/hub/TournamentEngine.tsx',{
  './TournamentBracket':{default:()=>null},'./MatchSchedule':{default:Schedule},'@/lib/tournament/engine':engine,'@/lib/tournament/result-form':resultForm,
  '@/lib/supabase/client':{createClient:()=>game==='dota2'?null:{}},'@/lib/tournament/updates':{startTournamentUpdates:()=>({stop(){},refresh(){}})},
 },{fetch:(url,options={})=>fetch(options,{revision:1,state})}).default;
 let view;await act(async()=>{view=create(React.createElement(Component,{id:'event',game,owner:true,ru,approved:entries,name:id=>'PRIVATE ENTRY '+id,onSaved,initial:{revision:1,state}}));});
 t.after(async()=>{await act(async()=>view.unmount());});
 const submit=kind=>view.root.findAllByType('form').find(form=>form.findAllByType('input').some(input=>input.props.name===(kind==='schedule'?'scheduledAt':'a'))).props.onSubmit;
 const event=kind=>({preventDefault(){},currentTarget:kind==='schedule'?{scheduledAt:'2026-11-01T18:30',reason:'Checked schedule'}:{a:'0',b:'1',reason:'Checked result'}});
 return {view,submit,event};
}
for(const ru of [true,false])for(const game of ['dota2','cs2'])test(`engine serializes result/schedule actions and retries after failure ${game} RU=${ru}`,async t=>{
 const posts=[];let finish,saved=0;
 const f=await mount(t,{ru,game,onSaved:async()=>{saved++;},fetch:async(options,current)=>{
  if(options.method!=='POST')return Response.json(current);
  posts.push(JSON.parse(options.body));return posts.length===1?new Promise(resolve=>{finish=resolve;}):Response.json({...current,revision:2});
 }});
 await act(async()=>{const result=f.submit('result'),schedule=f.submit('schedule');result(f.event('result'));schedule(f.event('schedule'));});
 assert.equal(posts.length,1,'a second command was sent before React updated busy');
 await act(async()=>{finish(Response.json({error:'Revision conflict; reload tournament'},{status:409}));await new Promise(resolve=>setImmediate(resolve));});
 assert.equal(saved,0);
 await act(async()=>{f.submit('result')(f.event('result'));await new Promise(resolve=>setImmediate(resolve));});
 assert.equal(posts.length,2);assert.equal(saved,1);assert.equal(posts[1].revision,1);
 assert.equal(f.view.root.findAll(node=>node.props.role==='alert').length,0);
});
for(const ru of [true,false])for(const phase of ['response','json','http-error','network-error'])test(`closed engine ignores late save ${phase} RU=${ru}`,async t=>{
 let finish,saved=0,gets=0;
 const f=await mount(t,{ru,onSaved:async()=>{saved++;},fetch:async(options,current)=>{
  if(options.method!=='POST'){gets++;return Response.json(current);}
  if(phase==='json')return {ok:true,status:200,json:()=>new Promise(resolve=>{finish=()=>resolve({...current,revision:2});})};
  return new Promise((resolve,reject)=>{finish=()=>phase==='network-error'?reject(new Error('Connection lost')):resolve(phase==='http-error'?Response.json({error:'Unavailable'},{status:503}):Response.json({...current,revision:2}));});
 }});
 await act(async()=>{f.submit('result')(f.event('result'));});
 await act(async()=>f.view.unmount());
 await act(async()=>{finish();await new Promise(resolve=>setImmediate(resolve));});
 assert.equal(saved,0,'save refreshed the parent after its page closed');
 assert.equal(gets,0,'failed save reloaded a closed engine');
});
for(const ru of [true,false])test(`engine save HTTP401 clears private state before another response RU=${ru}`,async t=>{
 let saved=0,finishParent,finishGet;
 const f=await mount(t,{ru,onSaved:()=>{saved++;return new Promise(resolve=>{finishParent=resolve;});},fetch:async options=>options.method==='POST'?new Response('Session expired',{status:401}):new Promise(resolve=>{finishGet=resolve;})});
 await act(async()=>{f.submit('result')(f.event('result'));await new Promise(resolve=>setImmediate(resolve));});
 assert.doesNotMatch(JSON.stringify(f.view.toJSON()),/PRIVATE ENTRY/,'POST401 kept the private bracket until a later GET');
 assert.equal(f.view.root.findAllByType('form').length,0);
 assert.equal(saved,1,'parent catalog did not recheck the expired session');
 await act(async()=>{finishParent?.();finishGet?.(new Response('Session expired',{status:401}));await new Promise(resolve=>setImmediate(resolve));});
});
for(const ru of [true,false])test(`engine POST401 invalidates an older successful GET RU=${ru}`,async t=>{
 let finishGet,signal,current;
 const f=await mount(t,{ru,fetch:async(options,snapshot)=>{
  current=snapshot;if(options.method==='POST')return new Response('Session expired',{status:401});
  signal=options.signal;return new Promise(resolve=>{finishGet=resolve;});
 }});
 await act(async()=>{f.view.root.findAllByType('button').find(node=>node.children.join('')===(ru?'Обновить этапы':'Refresh stages')).props.onClick();});
 await act(async()=>{f.submit('result')(f.event('result'));});
 await act(async()=>{finishGet(Response.json(current));});
 assert.equal(signal.aborted,true,'expired session did not cancel an older engine read');
 assert.doesNotMatch(JSON.stringify(f.view.toJSON()),/PRIVATE ENTRY/);
 assert.equal(f.view.root.findAllByType('form').length,0);
});
for(const ru of [true,false])for(const phase of ['response','json'])test(`engine GET401 invalidates an older successful POST ${phase} RU=${ru}`,async t=>{
 let finishPost,saved=0;
 const f=await mount(t,{ru,onSaved:async()=>{saved++;},fetch:async(options,current)=>{
  if(options.method!=='POST')return new Response('Session expired',{status:401});
  return phase==='response'?new Promise(resolve=>{finishPost=()=>resolve(Response.json({...current,revision:2}));}):{ok:true,status:200,json:()=>new Promise(resolve=>{finishPost=()=>resolve({...current,revision:2});})};
 }});
 await act(async()=>{f.submit('result')(f.event('result'));});
 await act(async()=>{f.view.root.findAllByType('button').find(node=>node.children.join('')===(ru?'Обновить этапы':'Refresh stages')).props.onClick();});
 assert.equal(saved,1);
 await act(async()=>{finishPost();await new Promise(resolve=>setImmediate(resolve));});
 assert.doesNotMatch(JSON.stringify(f.view.toJSON()),/PRIVATE ENTRY/,'late save restored a signed-out bracket');
 assert.equal(f.view.root.findAllByType('form').length,0);assert.equal(saved,1);
});
