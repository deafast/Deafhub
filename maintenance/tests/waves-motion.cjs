const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{create,act}=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
test('waves adapt to live motion/device preferences without animated path geometry',async()=>{
 let reduced=false,small=false;const subscriptions=new Map();
 const media=query=>({get matches(){return query.includes('max-width')?small||reduced:reduced;},addEventListener:(_,fn)=>{if(!subscriptions.has(query))subscriptions.set(query,new Set());subscriptions.get(query).add(fn);},removeEventListener:(_,fn)=>subscriptions.get(query).delete(fn)});
 const scope={exports:{},window:{matchMedia:media},navigator:{hardwareConcurrency:8,deviceMemory:8},require:name=>name.endsWith('.css')?{__esModule:true,default:{flow:'flow'}}:require(name)};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/shared/LivingWaves.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,scope);
 let view;await act(async()=>{view=create(React.createElement(scope.exports.default));});
 const check=(mode,count)=>{assert.equal(view.root.findByType('svg').props['data-motion'],mode);assert.equal(view.root.findAll(n=>n.props['data-wave-curve']==='true').length,count);assert.equal(view.root.findAllByType('animate').length,0);};
 check('full',3);
 for(const state of [{small:true,reduced:false,mode:'light',count:2},{small:false,reduced:true,mode:'still',count:2},{small:false,reduced:false,mode:'full',count:3}]){
  await act(async()=>{small=state.small;reduced=state.reduced;for(const listeners of subscriptions.values())for(const callback of listeners)callback();});check(state.mode,state.count);
 }
 await act(async()=>view.unmount());for(const listeners of subscriptions.values())assert.equal(listeners.size,0);
});
