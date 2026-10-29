const {readFileSync}=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{create,act}=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
function fixture(reduced,language='ru'){
 const listeners=new Set(),timers=new Set(),delays=new Map();let images=0,frames=0;
 const media={matches:reduced,addEventListener:(event,callback)=>listeners.add(callback),removeEventListener:(event,callback)=>listeners.delete(callback)};
 const scope={exports:{},queueMicrotask,window:{matchMedia:()=>media},sessionStorage:{getItem:()=>null,setItem:()=>{}},Image:class{constructor(){images++;}decode(){return new Promise(()=>{});}},setTimeout:(callback,delay)=>{timers.add(callback);delays.set(callback,delay);return callback;},clearTimeout:timer=>timers.delete(timer),requestAnimationFrame:()=>++frames,cancelAnimationFrame:()=>{},performance:{now:()=>0},require:name=>name==='next/image'?{__esModule:true,default:props=>React.createElement('img',props)}:name==='@/store/useLanguageStore'?{useLanguageStore:select=>select({language})}:name==='framer-motion'?{motion:new Proxy({},{get:(_,tag)=>tag}),AnimatePresence:({children})=>children}:require(name)};
 vm.runInNewContext(ts.transpileModule(readFileSync('components/shared/PreloaderV8.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,scope);
 return {Component:scope.exports.default,listeners,timers,delays,images:()=>images,frames:()=>frames,change:matches=>{media.matches=matches;for(const callback of listeners)callback();}};
}
test('reduced motion skips the intro without loading animation frames or images',async()=>{
 const f=fixture(true);let tree;await act(async()=>{tree=create(React.createElement(f.Component));});
 assert.equal(tree.toJSON(),null);assert.equal(f.images(),0);assert.equal(f.frames(),0);assert.equal(f.timers.size,0);
 await act(async()=>tree.unmount());assert.equal(f.listeners.size,0);
});
test('enabling reduced motion during the intro closes it and cleans pending work',async()=>{
 const f=fixture(false);let tree;await act(async()=>{tree=create(React.createElement(f.Component));});
 assert.notEqual(tree.toJSON(),null);assert.equal(f.images(),6);assert.equal(f.timers.size,1);
 await act(async()=>f.change(true));assert.equal(tree.toJSON(),null);assert.equal(f.timers.size,0);assert.equal(f.listeners.size,0);
 await act(async()=>f.change(false));assert.equal(tree.toJSON(),null);
 await act(async()=>tree.unmount());
});
test('natural intro completion releases media listeners and timers without unmounting the page',async()=>{
 const f=fixture(false);let tree;await act(async()=>{tree=create(React.createElement(f.Component));});
 await act(async()=>{for(const timer of [...f.timers])timer();});
 await act(async()=>{for(const timer of [...f.timers])timer();});
 assert.equal(tree.root.findAllByType('button').length,0);
 assert.equal(f.listeners.size,0);
 assert.equal(f.timers.size,0);
 await act(async()=>tree.unmount());
});

test('early intro script tolerates blocked sessionStorage',async()=>{
 const f=fixture(false);let tree;await act(async()=>{tree=create(React.createElement(f.Component));});
 const script=tree.root.findByType('script').props.dangerouslySetInnerHTML.__html;
 assert.doesNotThrow(()=>vm.runInNewContext(script,{sessionStorage:{getItem(){throw Error('Storage denied');}},document:{getElementById(){return {style:{}};}}}));
 await act(async()=>tree.unmount());
});
test('early intro script tolerates a missing target and still hides an existing seen intro',async()=>{
 const f=fixture(false);let tree;await act(async()=>{tree=create(React.createElement(f.Component));});
 const script=tree.root.findByType('script').props.dangerouslySetInnerHTML.__html;
 assert.doesNotThrow(()=>vm.runInNewContext(script,{sessionStorage:{getItem:()=> 'true'},document:{getElementById:()=>null}}));
 const element={style:{}};vm.runInNewContext(script,{sessionStorage:{getItem:()=> 'true'},document:{getElementById:()=>element}});assert.equal(element.style.display,'none');
 await act(async()=>tree.unmount());
});

for(const language of ['ru','en'])test(`intro reveals the approved complete brand and localizes skip ${language}`,async()=>{
 const f=fixture(false,language);let tree;await act(async()=>{tree=create(React.createElement(f.Component));});
 const image=tree.root.findByType('img');
 assert.equal(image.props.src,'/branding/approved-2026-10-28/logo.png');
 assert.equal(image.props.width,610);assert.equal(image.props.height,445);
 assert.equal(image.props.alt,'DEAFHUB — ESPORTS ORGANIZATION');
 assert.equal(tree.root.findByType('button').children.join(''),language==='ru'?'Пропустить заставку':'Skip intro');
 assert.equal(tree.root.findAllByType('h1').length,0);
 assert.ok(!JSON.stringify(tree.toJSON()).includes('PLATFORM'));
 const frame=tree.root.findAllByType('div').find(element=>element.props.style?.maskImage);
 assert.equal(frame.props.style.maskImage,'url("/branding/approved-2026-10-28/logo.png")');
 await act(async()=>tree.unmount());
});
test('intro final reveal restores source colors before automatic exit',async()=>{
 const f=fixture(false);let tree;await act(async()=>{tree=create(React.createElement(f.Component));});
 await act(async()=>{for(const callback of [...f.timers])if(f.delays.get(callback)===900)callback();});
 await act(async()=>{for(const callback of [...f.timers])if(f.delays.get(callback)===2000)callback();});
 assert.equal(tree.root.findByType('img').props.style.opacity,1);
 const mask=tree.root.findAllByType('div').find(element=>element.props.style?.maskImage);
 assert.equal(mask.props.style.opacity,0);
 assert.equal(tree.root.findAllByType('button').length,1);
 await act(async()=>tree.unmount());
});