const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
for(const ru of [true,false])test(`home uses the approved complete brand without redrawn text or glints RU=${ru}`,()=>{
 const imports={
  'next/image':{__esModule:true,default:p=>React.createElement('img',{src:p.src,alt:p.alt,width:p.width,height:p.height,className:p.className})},
  'next/link':{__esModule:true,default:({children,...p})=>React.createElement('a',p,children)},
  '@/store/useLanguageStore':{useLanguageStore:select=>select({language:ru?'ru':'en'})},
  './BrandPreview.module.css':{__esModule:true,default:new Proxy({},{get:(_,key)=>key})},
  './LivingWaves':{__esModule:true,default:()=>React.createElement('svg',{'data-unchanged-waves':true})},
 };
 const scope={exports:{},require:name=>imports[name]||require(name)};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/shared/BrandPreview.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,scope);
 const html=renderToStaticMarkup(React.createElement(scope.exports.default));
 assert.match(html,/src="\/branding\/approved-2026-10-28\/logo.png"/);
 assert.match(html,/width="610" height="445"/);
 assert.doesNotMatch(html,/ESPORTS PLATFORM|deafhub-dh-no-glints|<foreignObject/);
 assert.match(html,/data-unchanged-waves/);
 for(const label of ['Dota 2','CS2','EA Sports FC'])assert.ok(html.includes(label));
 assert.ok(html.includes(ru?'Личный кабинет':'My account'));
});
