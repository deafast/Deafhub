const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const test=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript');
const vm=require('node:vm');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
function load(file,imports={}) {
 const source=readFileSync(resolve(__dirname,'../..',file),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const scope={exports:{},require:name=>imports[name]||require(name)};
 vm.runInNewContext(compiled,scope);return scope.exports;
}
const filters=load('lib/tournament-filters.ts');
const GameFilter=load('components/hub/GameFilter.tsx',{'@/lib/tournament-filters':filters}).default;
for(const ru of [true,false])test(`game controls are accessible, all games supported, locale ${ru?'RU':'EN'}`,()=>{
 const html=renderToStaticMarkup(React.createElement(GameFilter,{value:'fc',onChange:()=>{},ru}));
 assert.match(html,/role="group"/);assert.match(html,ru?/Фильтр по игре/:/Filter by game/);
 assert.equal((html.match(/type="button"/g)||[]).length,4);
 assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);
 assert.match(html,/aria-pressed="true"[^>]*>.*EA Sports FC/);
 for(const name of ['Dota 2','CS2','EA Sports FC'])assert.ok(html.includes(name));
 assert.match(html,/focus-visible:outline/);assert.match(html,/flex-wrap/);assert.match(html,/min-h-11/);
});
