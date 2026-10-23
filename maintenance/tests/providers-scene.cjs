const {readFileSync}=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{create,act}=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
function load(pathname){
 const pass=({children})=>children,scene=()=>React.createElement('canvas');
 const imports={
  '@tanstack/react-query':{QueryClient:class{},QueryClientProvider:pass},
  'next/navigation':{usePathname:()=>pathname},
  'next/dynamic':{__esModule:true,default:()=>scene},
  '@/components/r3f/GlobalCanvas':{__esModule:true,default:scene},
  './SmoothScroll':{__esModule:true,default:pass},
  '@/store/useLanguageStore':{useLanguageStore:select=>select({language:'ru'})},
 };
 const scope={exports:{},document:{documentElement:{}},require:name=>imports[name]||require(name)};
 vm.runInNewContext(ts.transpileModule(readFileSync('components/shared/Providers.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,scope);
 return scope.exports.default;
}
for(const pathname of ['/','/sign-in','/tournaments','/profile/settings','/profile'])test(`3D canvas is mounted only on the player dashboard: ${pathname}`,async()=>{
 let tree;await act(async()=>{tree=create(React.createElement(load(pathname),{},React.createElement('input',{defaultValue:'Unsaved form value'})));});
 assert.equal(tree.root.findAllByType('canvas').length,pathname==='/profile'?1:0);
 assert.equal(tree.root.findByType('input').props.defaultValue,'Unsaved form value');
 await act(async()=>tree.unmount());
});
