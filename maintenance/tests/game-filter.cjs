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
 const scope={exports:{},AbortController,URLSearchParams,window:{location:{search:''}},fetch:(...args)=>global.fetch(...args),require:name=>imports[name]||require(name)};
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
const Renderer=require('react-test-renderer');global.IS_REACT_ACT_ENVIRONMENT=true;
const none={default:()=>null};
function panel(ru){return load('components/hub/HubPanel.tsx',{
 'next/link':{default:props=>React.createElement('a',props)},'./TournamentEngine':none,'./TeamsDirectory':none,'./FcRegistrationForm':none,'./SeasonRankingStatus':none,
 './TournamentOperations':{default:props=>React.createElement('button',{onClick:()=>void props.onSaved()},'QA refresh'),ProfileAwards:()=>null},
 './GameFilter':{default:GameFilter,useGameFilter:()=>React.useState('all')},'@/lib/tournament-filters':filters,
 '@/lib/tournament/fc-levels':{fcLevelLabel:value=>value},'@/lib/hub-history':load('lib/hub-history.ts'),
 '@/store/useLanguageStore':{useLanguageStore:selector=>selector({language:ru?'ru':'en'})},
 }).default;}
function hubFixture(){return {userId:'me',organizer:true,engineIds:[],engines:[],matches:[],stats:{matches:0,wins:0,draws:0},steamId:null,invites:[],ownEntryIds:['entry'],
 teams:[{id:'team',name:'PRIVATE REGISTERED TEAM',game:'cs2',captain_id:'me'}],members:[{team_id:'team',user_id:'me',nickname:'PRIVATE PLAYER'}],
 entries:[{id:'entry',team_id:'team',tournament_id:'event',status:'pending'}],
 tournaments:[{id:'event',game:'cs2',title:'PRIVATE TOURNAMENT',organizer_id:'me',starts_at:'2027-01-01T12:00:00Z',status:'open',rules:'Published tournament regulation',rules_version:'rules',roster_size:5}]};}
for(const ru of [true,false])for(const path of ['refresh','mutation'])test(`tournament catalog clears private data and actions after ${path} 401 RU=${ru}`,async t=>{
 const before=global.fetch;t.after(()=>{global.fetch=before;});let expired=false;
 global.fetch=async()=>expired?Response.json({error:'Sign in required'},{status:401}):Response.json(hubFixture());
 let view;await Renderer.act(async()=>{view=Renderer.create(React.createElement(panel(ru),{section:'tournaments'}));});
 assert.match(JSON.stringify(view.toJSON()),/PRIVATE TOURNAMENT/);assert.ok(view.root.findAllByType('form').length);
 expired=true;const label=path==='refresh'?'QA refresh':ru?'Допустить':'Approve';
 await Renderer.act(async()=>{view.root.findAllByType('button').find(b=>b.children.join('')===label).props.onClick();await new Promise(resolve=>setImmediate(resolve));});
 assert.doesNotMatch(JSON.stringify(view.toJSON()),/PRIVATE TOURNAMENT|PRIVATE REGISTERED TEAM|PRIVATE PLAYER/);
 assert.equal(view.root.findAllByType('form').length,0);assert.match(JSON.stringify(view.toJSON()),ru?/Войдите, чтобы видеть/:/Sign in to view/);
 await Renderer.act(async()=>view.unmount());
});
