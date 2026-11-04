const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),React=require('react');
exports.load=function load(relative,{state,pathname='/',imports={}}={},cache=new Map()){
 const file=path.resolve(relative);if(cache.has(file))return cache.get(file);
 const mocks={
  'next/image':{__esModule:true,default:({unoptimized,preload,priority,fill,...props})=>React.createElement('img',props)},
  'next/link':{__esModule:true,default:({prefetch,...props})=>React.createElement('a',props,props.children)},
  'next/navigation':{usePathname:()=>pathname},
  '@/store/useLanguageStore':{useLanguageStore:select=>select?select(state):state},
  '@/components/auth/AccountButton':{__esModule:true,default:()=>null},
  ...imports
 };
 const scope={exports:{},require:name=>{
  if(mocks[name])return mocks[name];
  if(name.endsWith('.css'))return {__esModule:true,default:new Proxy({},{get:(_,key)=>key})};
  if(name.startsWith('.')){const base=path.resolve(path.dirname(file),name),target=[base+'.tsx',base+'.ts'].find(fs.existsSync);return load(target,{state,pathname,imports},cache);}
  return require(name);
 }};
 cache.set(file,scope.exports);
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,scope);
 return scope.exports;
};
