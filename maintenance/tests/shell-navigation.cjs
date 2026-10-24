const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
for(const ru of [true,false])for(const file of ['Header','BottomNav'])test(`${file} identifies the current page and its parent section RU=${ru}`,()=>{
 let pathname='/';
 const imports={
  'next/link':{__esModule:true,default:({children,...props})=>React.createElement('a',props,children)},
  'next/image':{__esModule:true,default:()=>null},'next/navigation':{usePathname:()=>pathname},'@/components/auth/AccountButton':{__esModule:true,default:()=>null},
  '@/store/useLanguageStore':{useLanguageStore:()=>({language:ru?'ru':'en',setLanguage(){},t:{nav:{home:'Home',live:'Live',tournaments:'Tournaments',team:'Teams',profile:'Profile'}}})},
 };
 const scope={exports:{},require:name=>imports[name]??require(name)};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/shell/'+file+'.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,scope);
 for(const [path,href,current] of [['/','/','page'],['/profile','/profile','page'],['/profile/settings','/profile','location'],['/tournaments/demo','/tournaments','location'],['/team','/team','page'],['/teamwork',null,null]]){
  pathname=path;const html=renderToStaticMarkup(React.createElement(scope.exports.default));
  const links=html.match(/<a\b[^>]*>/g)??[],marked=links.filter(link=>link.includes('aria-current='));
  assert.equal(marked.length,href?1:0,`${path}: wrong number of current navigation links`);
  if(href){assert.ok(marked[0].includes(`href="${href}"`),`${path}: wrong section marked current`);assert.ok(marked[0].includes(`aria-current="${current}"`));}
  assert.match(html,ru?/aria-label="Основная навигация"/:/aria-label="Main navigation"/);
 }
});
