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
 const scope={exports:{},structuredClone,require:name=>imports[name]||require(name)};
 vm.runInNewContext(compiled,scope);return scope.exports;
}
const engine=load('lib/tournament/engine.ts');
const Bracket=load('components/hub/TournamentBracket.tsx').default;
for(const ru of [true,false])for(const count of [4,8,12,32])test(`bracket real transitions ${count} RU=${ru}`,()=>{
 const entries=Array.from({length:count},(_,i)=>`entry-${i}`);
 const state=engine.createTournament('dota2',entries,{format:'double',grandFinal:'reset',bestOf:3,groups:[],qualify:2,points:{win:3,draw:1,loss:0}});
 const before=JSON.stringify(state);
 const html=renderToStaticMarkup(React.createElement(Bracket,{state,ru,name:id=>id}));
 assert.match(html,ru?/Верхняя сетка/:/Upper bracket/);assert.match(html,ru?/Нижняя сетка/:/Lower bracket/);
 assert.match(html,ru?/Гранд-финал/:/Grand final/);assert.match(html,/overflow-x-auto/);assert.match(html,/tabindex="0"/);
 assert.equal((html.match(/<article /g)||[]).length,state.matches.length);
 for(const m of state.matches)assert.ok(html.includes(m.id));
 assert.equal(JSON.stringify(state),before);
});
test('group phase never invents a playoff bracket',()=>{
 const s={matches:[{stage:'group:A'}]};const html=renderToStaticMarkup(React.createElement(Bracket,{state:s,ru:true,name:id=>id}));assert.match(html,/после завершения групп/);assert.ok(!html.includes('<article'));
});
