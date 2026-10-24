const {readFileSync}=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{create,act}=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
function fixture(ru){
 const pending=[],listeners=new Map(),routes=[];let authChange,unsubscribed=false;
 const client={auth:{getUser:()=>new Promise(resolve=>pending.push(resolve)),onAuthStateChange:callback=>{authChange=callback;return {data:{subscription:{unsubscribe:()=>{unsubscribed=true;}}}};},signOut:async()=>({error:null})}};
 const router={replace:path=>routes.push(path),refresh:()=>{}};
 const dialog={};for(const name of ['Dialog','DialogContent','DialogHeader','DialogTitle','DialogTrigger','DialogDescription'])dialog[name]=props=>React.createElement(name,props,props.children);
 const imports={
  'next/navigation':{useRouter:()=>router},'next/link':{__esModule:true,default:props=>React.createElement('a',props,props.children)},
  '@/lib/supabase/client':{createClient:()=>client},'@/store/useLanguageStore':{useLanguageStore:select=>select({language:ru?'ru':'en'})},
  '@/components/ui/button':{Button:props=>React.createElement('button',props,props.children)},'@/components/ui/dialog':dialog,
  './AuthPanel':{__esModule:true,default:()=>null},
 };
 const scope={exports:{},window:{addEventListener:(name,callback)=>listeners.set(name,callback),removeEventListener:name=>listeners.delete(name)},require:name=>imports[name]??require(name)};
 vm.runInNewContext(ts.transpileModule(readFileSync('components/auth/AccountButton.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,scope);
 return {Component:scope.exports.default,pending,listeners,routes,emit:(event,user)=>authChange(event,user?{user}:null),unsubscribed:()=>unsubscribed};
}
const user={id:'registered-player'};
const profileLinks=view=>view.root.findAll(n=>n.type==='a'&&n.props.href==='/profile');
for(const ru of [true,false]){
 for(const signedIn of [true,false])test(`auth event wins over a late initial user response: signedIn=${signedIn}, RU=${ru}`,async()=>{
  const f=fixture(ru);let view;await act(async()=>{view=create(React.createElement(f.Component));});
  await act(async()=>f.emit(signedIn?'SIGNED_IN':'SIGNED_OUT',signedIn?user:null));
  await act(async()=>f.pending[0]({data:{user:signedIn?null:user}}));
  assert.equal(profileLinks(view).length,signedIn?1:0);
  await act(async()=>view.unmount());assert.equal(f.listeners.size,0);assert.equal(f.unsubscribed(),true);
 });
 test(`latest auth-complete query wins over older query RU=${ru}`,async()=>{
  const f=fixture(ru);let view;await act(async()=>{view=create(React.createElement(f.Component));});
  await act(async()=>f.listeners.get('deafhub:auth-complete')());
  await act(async()=>f.pending[1]({data:{user}}));
  await act(async()=>f.pending[0]({data:{user:null}}));
  assert.equal(profileLinks(view).length,1);
  await act(async()=>view.unmount());
 });
 test(`repeated auth events close the dialog and navigate only once RU=${ru}`,async()=>{
  const f=fixture(ru);let view;await act(async()=>{view=create(React.createElement(f.Component));});
  await act(async()=>view.root.findByType('Dialog').props.onOpenChange(true));
  await act(async()=>{f.emit('SIGNED_IN',user);f.emit('TOKEN_REFRESHED',user);});
  assert.equal(profileLinks(view).length,1);assert.deepEqual(f.routes,['/profile']);
  await act(async()=>view.unmount());
 });
 test(`late user response after sign-out cannot reopen account or navigate to profile RU=${ru}`,async()=>{
  const f=fixture(ru);let view;await act(async()=>{view=create(React.createElement(f.Component));});
  await act(async()=>f.pending[0]({data:{user}}));
  await act(async()=>f.listeners.get('deafhub:auth-complete')());
  await act(async()=>view.root.findAllByType('button').find(n=>n.children.join('')===(ru?'Выйти':'Sign out')).props.onClick());
  await act(async()=>view.root.findByType('Dialog').props.onOpenChange(true));
  await act(async()=>f.pending[1]({data:{user}}));
  assert.equal(profileLinks(view).length,0);assert.deepEqual(f.routes,['/']);
  await act(async()=>view.unmount());
 });
}
