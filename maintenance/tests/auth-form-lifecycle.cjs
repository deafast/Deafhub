const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{create,act}=require('react-test-renderer');global.IS_REACT_ACT_ENVIRONMENT=true;
function load(file,imports,extra={}){const scope={exports:{},AbortController,Event,...extra,require:name=>imports[name]??require(name)};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,scope);return scope.exports.default;}
const ui={Button:props=>React.createElement('button',props),Input:props=>React.createElement('input',props)};
for(const ru of [true,false])for(const mode of ['login','signup'])for(const unmount of [true,false])test(`email ${mode} completion respects mounted=${!unmount} RU=${ru}`,async()=>{
 let finish;const routes=[],events=[],router={replace:path=>routes.push(path),refresh(){}};
 const send=()=>new Promise(resolve=>{finish=resolve;});
 const Component=load('components/auth/EmailAuth.tsx',{
  'next/navigation':{useRouter:()=>router},'lucide-react':{Eye:()=>null,EyeOff:()=>null,Mail:()=>null,LockKeyhole:()=>null},
  '@/lib/supabase/client':{createClient:()=>({auth:{signInWithPassword:send,signUp:send}})},
  '@/store/useLanguageStore':{useLanguageStore:select=>select({language:ru?'ru':'en'})},'@/components/ui/input':ui,'@/components/ui/button':ui,
  './EmailConfirmationPending':{__esModule:true,default:()=>null},'@/lib/auth/email-confirmation':{confirmationCallback:origin=>origin+'/auth/callback'},
 },{window:{location:{origin:'https://preview.example'},dispatchEvent:event=>events.push(event.type)}});
 let view,pending;await act(async()=>{view=create(React.createElement(Component));});
 if(mode==='signup')await act(async()=>view.root.findAllByType('button').find(n=>n.children.join('')===(ru?'Регистрация':'Sign up')).props.onClick());
 await act(async()=>{for(const input of view.root.findAllByType('input'))input.props.onChange({target:{value:input.props.name==='email'?'player@example.test':'LongPassword123!'}});});
 await act(async()=>{pending=view.root.findByType('form').props.onSubmit({preventDefault(){}});});if(unmount)await act(async()=>view.unmount());
 await act(async()=>{finish({data:{session:{user:{id:'player'}}},error:null});await pending;});assert.deepEqual(routes,unmount?[]:['/profile']);assert.deepEqual(events,unmount?[]:['deafhub:auth-complete']);
 if(!unmount)await act(async()=>view.unmount());
});
for(const ru of [true,false])for(const failure of ['response','network'])test(`password reset reports sign-out ${failure} failure without retrying password update RU=${ru}`,async()=>{
 let updates=0,signouts=0;const router={replace(){},refresh(){}};
 const Component=load('components/auth/EmailAuth.tsx',{
  'next/navigation':{useRouter:()=>router},'lucide-react':{Eye:()=>null,EyeOff:()=>null,Mail:()=>null,LockKeyhole:()=>null},
  '@/lib/supabase/client':{createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'player'}},error:null}),updateUser:async()=>{updates++;return {error:null};},signOut:async()=>{signouts++;if(failure==='network')throw Error('PRIVATE CONNECTION DETAIL');return {error:{code:'unavailable'}};}}})},
  '@/store/useLanguageStore':{useLanguageStore:select=>select({language:ru?'ru':'en'})},'@/components/ui/input':ui,'@/components/ui/button':ui,
  './EmailConfirmationPending':{__esModule:true,default:()=>null},'@/lib/auth/email-confirmation':{},
 },{window:{location:{origin:'https://preview.example'}}});
 let view;await act(async()=>{view=create(React.createElement(Component,{reset:true}));});
 await act(async()=>{for(const input of view.root.findAllByType('input'))input.props.onChange({target:{value:'LongPassword123!'}});});
 await act(async()=>view.root.findByType('form').props.onSubmit({preventDefault(){}}));
 assert.equal(updates,1);assert.equal(signouts,1);assert.equal(view.root.findAllByType('form').length,0);
 const alert=view.root.findAll(n=>n.props.role==='alert');assert.equal(alert.length,1);assert.match(alert[0].children.join(''),ru?/не удалось выйти/:/sign-out failed/);
 assert.doesNotMatch(JSON.stringify(view.toJSON()),/PRIVATE CONNECTION DETAIL/);await act(async()=>view.unmount());
});
for(const ru of [true,false])for(const ending of ['cancel','unmount','complete'])for(const phase of ['response','json'])test(`Steam ${ending} handles delayed ${phase} with correct navigation RU=${ru}`,async()=>{
 let poll,finish,calls=0,closed=0;const routes=[],events=[],timers=new Set();
 const popup={sessionStorage:{setItem(){}},location:{href:''},close:()=>closed++};
 const client={auth:{getUser:async()=>({data:{user:{id:'player'}}})}},router={replace:path=>routes.push(path),refresh(){}};
 const Component=load('components/auth/AuthPanel.tsx',{
  'next/navigation':{useRouter:()=>router},'next/image':{__esModule:true,default:()=>null},'./EmailAuth':{__esModule:true,default:()=>null},
  '@/lib/supabase/client':{createClient:()=>client},'@/store/useLanguageStore':{useLanguageStore:select=>select({language:ru?'ru':'en'})},'@/components/ui/button':ui,
 },{window:{open:()=>popup,dispatchEvent:event=>events.push(event.type)},fetch:async()=>{
  if(++calls===1)return Response.json({enabled:true});
  if(phase==='response')return new Promise(resolve=>{finish=()=>resolve(Response.json({linked:true}));});
  return {ok:true,json:()=>new Promise(resolve=>{finish=()=>resolve({linked:true});})};
 },setInterval:callback=>{poll=callback;timers.add(callback);return callback;},clearInterval:timer=>timers.delete(timer)});
 let view,pending;await act(async()=>{view=create(React.createElement(Component,{steamOnly:true}));});
 await act(async()=>view.root.findAllByType('button')[0].props.onClick());
 await act(async()=>{pending=poll();});
 await act(async()=>{if(ending==='unmount')view.unmount();else if(ending==='cancel')view.root.findAllByType('button').find(n=>n.children.join('')===(ru?'Отменить':'Cancel')).props.onClick();});
 await act(async()=>{finish();await pending;});
 assert.deepEqual(routes,ending==='complete'?['/profile']:[]);assert.deepEqual(events,ending==='complete'?['deafhub:auth-complete']:[]);assert.equal(timers.size,0);assert.ok(closed>=1);
 if(ending!=='unmount'){assert.equal(view.root.findAllByType('button')[0].props.disabled,false);await act(async()=>view.unmount());}
});
for(const ru of [true,false])for(const mode of ['login','signup','forgot','reset'])test(`email ${mode} suppresses duplicate submits and permits retry after rejection RU=${ru}`,async()=>{
 let requests=0,finish;const pending=[];
 const send=()=>{requests++;return new Promise(resolve=>{finish=resolve;});};
 const router={replace(){},refresh(){}};
 const Component=load('components/auth/EmailAuth.tsx',{
  'next/navigation':{useRouter:()=>router},'lucide-react':{Eye:()=>null,EyeOff:()=>null,Mail:()=>null,LockKeyhole:()=>null},
  '@/lib/supabase/client':{createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'player'}},error:null}),signInWithPassword:send,signUp:send,resetPasswordForEmail:send,updateUser:send,signOut:async()=>({error:null})}})},
  '@/store/useLanguageStore':{useLanguageStore:select=>select({language:ru?'ru':'en'})},'@/components/ui/input':ui,'@/components/ui/button':ui,
  './EmailConfirmationPending':{__esModule:true,default:()=>null},'@/lib/auth/email-confirmation':{confirmationCallback:origin=>origin+'/auth/callback',startConfirmationCooldown:()=>160000},
 },{window:{location:{origin:'https://preview.example'},dispatchEvent(){}},sessionStorage:{setItem(){}}});
 let view;await act(async()=>{view=create(React.createElement(Component,{reset:mode==='reset',onPendingChange:value=>pending.push(value)}));});
 if(mode==='signup'||mode==='forgot')await act(async()=>view.root.findAllByType('button').find(n=>n.children.join('')===(mode==='signup'?(ru?'Регистрация':'Sign up'):(ru?'Забыли пароль?':'Forgot password?'))).props.onClick());
 await act(async()=>{for(const input of view.root.findAllByType('input'))if(input.props.onChange)input.props.onChange({target:{value:input.props.name==='email'?'player@example.test':'LongPassword123!'}});});
 const event={preventDefault(){}};let first,second;
 await act(async()=>{const submit=view.root.findByType('form').props.onSubmit;first=submit(event);second=submit(event);});
 assert.equal(requests,1,'duplicate email operation before React updates pending state');
 await act(async()=>{finish({data:{},error:{code:'over_request_rate_limit'}});await Promise.all([first,second]);});
 assert.equal(view.root.findAll(n=>n.props.role==='alert').length,1);
 let retry;await act(async()=>{retry=view.root.findByType('form').props.onSubmit(event);});assert.equal(requests,2);
 await act(async()=>{finish({data:{session:null},error:null});await retry;});assert.deepEqual(pending,[true,false,true,false]);
 await act(async()=>view.unmount());
});

async function steamReturnFixture(ru,phase='ready'){
 let poll,finish,closed=0,requests=0;const routes=[],events=[],timers=new Set(),signals=[];
 const popup={sessionStorage:{setItem(){}},location:{href:''},close:()=>closed++};
 const user={data:{user:{id:'current-player'}}};
 const client={auth:{getUser:()=>phase==='user'?new Promise(resolve=>{finish=()=>resolve(user);}):Promise.resolve(user)}};
 const Component=load('components/auth/AuthPanel.tsx',{
  'next/navigation':{useRouter:()=>({replace:path=>routes.push(path),refresh(){}})},
  'next/image':{__esModule:true,default:()=>null},'./EmailAuth':{__esModule:true,default:()=>null},
  '@/lib/supabase/client':{createClient:()=>client},'@/store/useLanguageStore':{useLanguageStore:select=>select({language:ru?'ru':'en'})},'@/components/ui/button':ui,
 },{URL,window:{location:{origin:'https://preview.example'},open:()=>popup,dispatchEvent:event=>events.push(event.type)},fetch:async(_url,init)=>{
  if(++requests===1)return Response.json({enabled:true});
  signals.push(init.signal);
  if(phase==='response')return new Promise(resolve=>{finish=()=>resolve(Response.json({linked:true}));});
  if(phase==='json')return {ok:true,json:()=>new Promise(resolve=>{finish=()=>resolve({linked:true});})};
  return Response.json({linked:false});
 },setInterval:callback=>{poll=callback;timers.add(callback);return callback;},clearInterval:timer=>timers.delete(timer)});
 let view;await act(async()=>{view=create(React.createElement(Component,{steamOnly:true}));});
 const start=()=>view.root.findAllByType('button')[0].props.onClick();await act(async()=>start());
 popup.location.href='https://steamcommunity.com/openid/login';
 return {view,popup,routes,events,timers,signals,start,tick:()=>poll(),finish:()=>finish(),closed:()=>closed};
}
for(const ru of [true,false])for(const phase of ['ready','user','response','json'])test(`Steam callback return failure stops waiting and ignores delayed ${phase} RU=${ru}`,async()=>{
 const f=await steamReturnFixture(ru,phase);let pending;
 if(phase!=='ready')await act(async()=>{pending=f.tick();});
 f.popup.location.href='https://preview.example/sign-in?error=steam';
 await act(async()=>{await f.tick();});
 assert.equal(f.view.root.findAllByType('button')[0].props.disabled,false,'callback rejection must release the form before the three-minute timeout');
 assert.equal(f.timers.size,0);assert.ok(f.closed()>0);assert.ok(f.signals.every(signal=>signal.aborted));
 const alert=f.view.root.findAll(n=>n.props.role==='alert');assert.equal(alert.length,1);
 assert.match(alert[0].children.join(''),ru?/Вход не завершён/:/Sign-in was not completed/);
 if(pending)await act(async()=>{f.finish();await pending;});
 assert.deepEqual(f.routes,[]);assert.deepEqual(f.events,[]);
 if(phase==='ready'){
  await act(async()=>f.start());
  assert.equal(f.view.root.findAll(n=>n.props.role==='alert').length,0);assert.equal(f.timers.size,1);
  assert.equal(f.view.root.findAllByType('button')[0].props.disabled,true);
 }
 await act(async()=>f.view.unmount());
});
for(const ru of [true,false])for(const page of ['foreign-origin','different-path','different-error','cross-origin-access'])test(`Steam callback return ignores ${page} RU=${ru}`,async()=>{
 const f=await steamReturnFixture(ru);
 if(page==='cross-origin-access')Object.defineProperty(f.popup,'location',{get(){throw new DOMException('Cross-origin access','SecurityError');}});
 else f.popup.location.href=page==='foreign-origin'?'https://untrusted.example/sign-in?error=steam':page==='different-path'?'https://preview.example/other?error=steam':'https://preview.example/sign-in?error=callback';
 await act(async()=>{await f.tick();});
 assert.equal(f.view.root.findAllByType('button')[0].props.disabled,true);assert.equal(f.timers.size,1);
 assert.equal(f.closed(),0);assert.equal(f.view.root.findAll(n=>n.props.role==='alert').length,0);
 assert.deepEqual(f.routes,[]);assert.deepEqual(f.events,[]);await act(async()=>f.view.unmount());
});
