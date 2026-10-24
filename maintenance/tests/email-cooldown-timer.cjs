const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{create,act}=require('react-test-renderer');global.IS_REACT_ACT_ENVIRONMENT=true;
function fixture(ru,seconds){
 let now=100000,sends=0;const timers=new Set(),storage=new Map();
 const helpers={exports:{},URL,Date:class extends Date{static now(){return now;}},sessionStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/auth/email-confirmation.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,helpers);
 const imports={'@/lib/auth/email-confirmation':helpers.exports,'@/lib/supabase/client':{createClient:()=>({auth:{resend:async()=>{sends++;return {error:null};}}})},'lucide-react':{MailCheck:()=>null}};
 const scope={exports:{},Date:class extends Date{static now(){return now;}},queueMicrotask,window:{location:{origin:'https://preview.example'}},sessionStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)},setInterval:callback=>{timers.add(callback);return callback;},clearInterval:timer=>timers.delete(timer),require:name=>imports[name]??require(name)};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/auth/EmailConfirmationPending.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,scope);
 return {Component:scope.exports.default,props:{ru,email:'player@example.test',deadline:now+seconds*1000,onBack:()=>{}},timers,sends:()=>sends,storeDeadline:value=>storage.set(helpers.exports.CONFIRMATION_COOLDOWN_KEY,String(value)),advance:ms=>{now+=ms;for(const callback of [...timers])callback();}};
}
for(const ru of [true,false])for(const seconds of [0,5])test(`email cooldown reflects remaining time, stops at zero and restarts after resend RU=${ru}, seconds=${seconds}`,async()=>{
 const f=fixture(ru,seconds);let view;await act(async()=>{view=create(React.createElement(f.Component,f.props));});
 const resend=()=>view.root.findAllByType('button')[0];
 if(seconds){assert.match(resend().children.join(''),/5/);assert.equal(resend().props.disabled,true);assert.equal(f.timers.size,1);await act(async()=>f.advance(5000));}
 assert.equal(resend().props.disabled,false);assert.equal(f.timers.size,0,'timer kept running after countdown ended');assert.equal(f.sends(),0);
 await act(async()=>resend().props.onClick());assert.equal(f.sends(),1);assert.equal(resend().props.disabled,true);assert.equal(f.timers.size,1);
 await act(async()=>f.advance(60000));assert.equal(resend().props.disabled,false);assert.equal(f.timers.size,0);
 await act(async()=>view.unmount());assert.equal(f.timers.size,0);
});
for(const ru of [true,false])test(`invalid infinite stored cooldown does not silently block resend RU=${ru}`,async()=>{
 const f=fixture(ru,0);f.storeDeadline('Infinity');let view;
 await act(async()=>{view=create(React.createElement(f.Component,f.props));});
 await act(async()=>view.root.findAllByType('button')[0].props.onClick());
 assert.equal(f.sends(),1,'enabled resend button silently ignored an invalid stored deadline');
 assert.equal(view.root.findAllByType('button')[0].props.disabled,true);
 await act(async()=>view.unmount());
});
for(const ru of [true,false])test(`stored cooldown from another form is visible on opening confirmation RU=${ru}`,async()=>{
 const f=fixture(ru,0);f.storeDeadline(105000);let view;
 await act(async()=>{view=create(React.createElement(f.Component,f.props));});
 assert.equal(view.root.findAllByType('button')[0].props.disabled,true,'button ignored the stored active cooldown');
 assert.match(view.root.findAllByType('button')[0].children.join(''),/5/);assert.equal(f.sends(),0);
 await act(async()=>f.advance(5000));assert.equal(view.root.findAllByType('button')[0].props.disabled,false);
 await act(async()=>view.root.findAllByType('button')[0].props.onClick());assert.equal(f.sends(),1);
 await act(async()=>view.unmount());assert.equal(f.timers.size,0);
});
for(const ru of [true,false])test(`resend reflects a cooldown started in another form after its timer stopped RU=${ru}`,async()=>{
 const f=fixture(ru,0);let view;
 await act(async()=>{view=create(React.createElement(f.Component,f.props));});
 assert.equal(f.timers.size,0);f.storeDeadline(105000);
 await act(async()=>view.root.findAllByType('button')[0].props.onClick());
 assert.equal(f.sends(),0);assert.equal(view.root.findAllByType('button')[0].props.disabled,true,'blocked resend did not explain the active cooldown');
 assert.match(view.root.findAllByType('button')[0].children.join(''),/5/);
 await act(async()=>f.advance(5000));assert.equal(view.root.findAllByType('button')[0].props.disabled,false);
 await act(async()=>view.unmount());assert.equal(f.timers.size,0);
});
