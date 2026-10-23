const {readFileSync}=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{create,act}=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
function fixture(reduced){
 const listeners=new Set(),timers=new Set();let images=0,frames=0;
 const media={matches:reduced,addEventListener:(event,callback)=>listeners.add(callback),removeEventListener:(event,callback)=>listeners.delete(callback)};
 const scope={exports:{},queueMicrotask,window:{matchMedia:()=>media},sessionStorage:{getItem:()=>null,setItem:()=>{}},Image:class{constructor(){images++;}decode(){return new Promise(()=>{});}},setTimeout:callback=>{timers.add(callback);return callback;},clearTimeout:timer=>timers.delete(timer),requestAnimationFrame:()=>++frames,cancelAnimationFrame:()=>{},performance:{now:()=>0},require:name=>name==='framer-motion'?{motion:new Proxy({},{get:(_,tag)=>tag}),AnimatePresence:({children})=>children}:require(name)};
 vm.runInNewContext(ts.transpileModule(readFileSync('components/shared/PreloaderV8.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,scope);
 return {Component:scope.exports.default,listeners,timers,images:()=>images,frames:()=>frames,change:matches=>{media.matches=matches;for(const callback of listeners)callback();}};
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
