const {readFileSync}=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict'),React=require('react'),Renderer=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
function load(file,imports={}){const code=ts.transpileModule(readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;const scope={exports:{},AbortController,window:global.window,fetch:(...a)=>global.fetch(...a),FormData:class{constructor(v){this.v=v}get(k){return this.v[k]??null}},require:n=>imports[n]||require(n)};vm.runInNewContext(code,scope);return scope.exports.default;}
for(const ru of [true,false])for(const action of ['refresh','save'])test(`admission clears text HTTP401 and can retry: ${action} RU=${ru}`,async t=>{
 const original=global.fetch;t.after(()=>{global.fetch=original;});let expired=false;
 global.fetch=async()=>expired?new Response('Session expired',{status:401}):Response.json({enabled:false,saved:true,admitted:0});
 const Component=load('components/hub/TournamentAutoAdmission.tsx');let view;
 await Renderer.act(async()=>{view=Renderer.create(React.createElement(Component,{id:'event',owner:true,locked:false,ru,onSaved:async()=>{}}));});
 const refresh=()=>view.root.findAllByType('button').find(b=>b.children.join('')===(ru?'Обновить настройку допуска':'Refresh admission setting')).props.onClick();
 assert.equal(view.root.findAllByType('form').length,1);expired=true;
 await Renderer.act(async()=>{if(action==='refresh')refresh();else await view.root.findByType('form').props.onSubmit({preventDefault(){},currentTarget:{enabled:'on',reason:'Reviewed rules'}});});
 assert.equal(view.root.findAllByType('form').length,0);assert.match(JSON.stringify(view.toJSON()),ru?/Войдите в аккаунт/:/Sign in to continue/);
 expired=false;await Renderer.act(async()=>{refresh();});assert.equal(view.root.findAllByType('form').length,1);assert.equal(view.root.findAll(n=>n.props.role==='alert').length,0);
 await Renderer.act(async()=>view.unmount());
});
for(const ru of [true,false])test(`admission visibly identifies an in-flight refresh RU=${ru}`,async t=>{
 const original=global.fetch;t.after(()=>{global.fetch=original;});let finish,calls=0;
 global.fetch=async()=>++calls===1?Response.json({enabled:false}):new Promise(resolve=>{finish=resolve;});
 const Component=load('components/hub/TournamentAutoAdmission.tsx');let view;
 await Renderer.act(async()=>{view=Renderer.create(React.createElement(Component,{id:'event',owner:true,locked:false,ru,onSaved:async()=>{}}));});
 await Renderer.act(async()=>{view.root.findAllByType('button').find(b=>b.children.join('')===(ru?'Обновить настройку допуска':'Refresh admission setting')).props.onClick();});
 assert.equal(view.root.findByType('section').props['aria-busy'],true);assert.match(JSON.stringify(view.toJSON()),ru?/Обработка…/:/Processing…/);
 await Renderer.act(async()=>{finish(Response.json({enabled:false}));});assert.equal(view.root.findByType('section').props['aria-busy'],false);
 await Renderer.act(async()=>view.unmount());
});
for(const ru of [true,false])test(`admission initial response cannot restore a form after refresh401 RU=${ru}`,async t=>{
 const original=global.fetch;t.after(()=>{global.fetch=original;});let finish,calls=0;
 global.fetch=async()=>++calls===1?new Promise(resolve=>{finish=resolve;}):new Response('Session expired',{status:401});
 const Component=load('components/hub/TournamentAutoAdmission.tsx');let view;
 await Renderer.act(async()=>{view=Renderer.create(React.createElement(Component,{id:'event',owner:true,locked:false,ru,onSaved:async()=>{}}));});
 await Renderer.act(async()=>{view.root.findAllByType('button').find(b=>b.children.join('')===(ru?'Обновить настройку допуска':'Refresh admission setting')).props.onClick();});
 await Renderer.act(async()=>{finish(Response.json({enabled:true}));});
 assert.equal(view.root.findAllByType('form').length,0);assert.match(JSON.stringify(view.toJSON()),ru?/Войдите в аккаунт/:/Sign in to continue/);
 await Renderer.act(async()=>view.unmount());
});
for(const initial of [true,false])test(`smooth scroll follows live reduced-motion and preserves child state, initially ${initial}`,async t=>{
 const original=global.window;t.after(()=>{global.window=original;});let reduced=initial;const listeners=new Set();
 const media={get matches(){return reduced;},addEventListener:(name,fn)=>listeners.add(fn),removeEventListener:(name,fn)=>listeners.delete(fn)};
 global.window={matchMedia:query=>{assert.equal(query,'(prefers-reduced-motion: reduce)');return media;}};
 const Lenis=props=>props.children??null;
 const Component=load('components/shared/SmoothScroll.tsx',{'lenis/react':{ReactLenis:Lenis},'framer-motion':{useReducedMotion:()=>initial}});
 function Child(){const [value,setValue]=React.useState(0);return React.createElement('button',{onClick:()=>setValue(v=>v+1)},value);}
 let view;await Renderer.act(async()=>{view=Renderer.create(React.createElement(Component,null,React.createElement(Child)));});
 assert.equal(view.root.findAllByType(Lenis).length,initial?0:1);
 await Renderer.act(async()=>{view.root.findByType('button').props.onClick();});
 for(const next of [!initial,initial]){await Renderer.act(async()=>{reduced=next;listeners.forEach(fn=>fn());});assert.equal(view.root.findAllByType(Lenis).length,next?0:1);assert.equal(view.root.findByType('button').children.join(''),'1');}
 assert.equal(listeners.size,1);await Renderer.act(async()=>view.unmount());assert.equal(listeners.size,0);
});
