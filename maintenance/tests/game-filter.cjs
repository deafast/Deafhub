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
function panel(ru,engine=none){return load('components/hub/HubPanel.tsx',{
 'next/link':{default:props=>React.createElement('a',props)},'./TournamentEngine':engine,'./TeamsDirectory':none,'./FcRegistrationForm':none,'./SeasonRankingStatus':none,
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

const caption=node=>node.children.join('');
for(const ru of [true,false])test(`successful action does not report a saved catalog after failed refresh RU=${ru}`,async t=>{
 const original=global.fetch;t.after(()=>{global.fetch=original;});let gets=0;
 global.fetch=async(url,init={})=>init.method==='POST'?Response.json({ok:true}):++gets===1?Response.json(hubFixture()):Response.json({error:'Unavailable'},{status:503});
 let view;await Renderer.act(async()=>{view=Renderer.create(React.createElement(panel(ru),{section:'tournaments'}));});
 await Renderer.act(async()=>{view.root.findAllByType('button').find(b=>caption(b)===(ru?'Допустить':'Approve')).props.onClick();});
 assert.match(JSON.stringify(view.toJSON()),/Competition service unavailable/);
 assert.doesNotMatch(JSON.stringify(view.toJSON()),/Сохранено\.|Saved\./);
 await Renderer.act(async()=>view.unmount());
});
function renamedFixture(title){const data=hubFixture();data.tournaments[0].title=title;return data;}
for(const ru of [true,false])for(const late of ['success','401','503','delayed JSON'])test(`catalog keeps the latest refresh after obsolete ${late} RU=${ru}`,async t=>{
 const original=global.fetch;t.after(()=>{global.fetch=original;});const pending=[];let calls=0,finishBody;
 global.fetch=async()=>++calls===1?Response.json(hubFixture()):new Promise(resolve=>pending.push(resolve));
 let view;await Renderer.act(async()=>{view=Renderer.create(React.createElement(panel(ru),{section:'tournaments'}));});
 const refresh=()=>view.root.findAllByType('button').find(b=>caption(b)==='QA refresh').props.onClick();
 await Renderer.act(async()=>{refresh();});
 if(late==='delayed JSON')await Renderer.act(async()=>{pending[0]({ok:true,status:200,json:()=>new Promise(resolve=>{finishBody=resolve;})});});
 await Renderer.act(async()=>{refresh();});
 await Renderer.act(async()=>{pending[1](Response.json(renamedFixture('LATEST VERIFIED SNAPSHOT')));});
 await Renderer.act(async()=>{
  if(late==='delayed JSON')finishBody(renamedFixture('OBSOLETE SNAPSHOT'));
  else pending[0](late==='success'?Response.json(renamedFixture('OBSOLETE SNAPSHOT')):Response.json({error:'old error'},{status:Number(late)}));
 });
 const html=JSON.stringify(view.toJSON());assert.match(html,/LATEST VERIFIED SNAPSHOT/);assert.doesNotMatch(html,/OBSOLETE SNAPSHOT|Competition service unavailable/);
 assert.ok(view.root.findAllByType('form').length>0);await Renderer.act(async()=>view.unmount());
});
for(const ru of [true,false])test(`latest GET 401 cannot be undone by an earlier successful response RU=${ru}`,async t=>{
 const original=global.fetch;t.after(()=>{global.fetch=original;});const pending=[];let calls=0;
 global.fetch=async()=>++calls===1?Response.json(hubFixture()):new Promise(resolve=>pending.push(resolve));
 let view;await Renderer.act(async()=>{view=Renderer.create(React.createElement(panel(ru),{section:'tournaments'}));});
 const refresh=()=>view.root.findAllByType('button').find(b=>caption(b)==='QA refresh').props.onClick();
 await Renderer.act(async()=>{refresh();refresh();});
 await Renderer.act(async()=>{pending[1](Response.json({error:'Sign in required'},{status:401}));});
 await Renderer.act(async()=>{pending[0](Response.json(hubFixture()));});
 assert.doesNotMatch(JSON.stringify(view.toJSON()),/PRIVATE TOURNAMENT|PRIVATE PLAYER/);
 assert.equal(view.root.findAllByType('form').length,0);assert.equal(view.root.findAllByType('a').filter(a=>a.props.href==='/sign-in').length,1);
 await Renderer.act(async()=>view.unmount());
});
for(const ru of [true,false])for(const json of [true,false])test(`POST 401 clears catalog before parsing and invalidates older GET RU=${ru} JSON=${json}`,async t=>{
 const original=global.fetch;t.after(()=>{global.fetch=original;});let calls=0,finishGet;
 global.fetch=async(url,init={})=>init.method==='POST'?(json?Response.json({error:'Sign in required'},{status:401}):new Response('Session expired',{status:401})):++calls===1?Response.json(hubFixture()):new Promise(resolve=>{finishGet=resolve;});
 let view;await Renderer.act(async()=>{view=Renderer.create(React.createElement(panel(ru),{section:'tournaments'}));});
 await Renderer.act(async()=>{view.root.findAllByType('button').find(b=>caption(b)==='QA refresh').props.onClick();});
 await Renderer.act(async()=>{view.root.findAllByType('button').find(b=>caption(b)===(ru?'Допустить':'Approve')).props.onClick();});
 assert.equal(view.root.findAllByType('form').length,0);
 await Renderer.act(async()=>{finishGet(Response.json(hubFixture()));});
 assert.doesNotMatch(JSON.stringify(view.toJSON()),/PRIVATE TOURNAMENT|PRIVATE PLAYER/);assert.equal(view.root.findAllByType('form').length,0);
 await Renderer.act(async()=>view.unmount());
});
for(const ru of [true,false])test(`realtime catalog callback reports a refresh failure and recovers on retry RU=${ru}`,async t=>{
 const original=global.fetch;t.after(()=>{global.fetch=original;});let failed=false,onSaved;
 global.fetch=async()=>failed?Response.json({error:'Unavailable'},{status:503}):Response.json(renamedFixture('CURRENT CATALOG'));
 const engine={default:props=>{onSaved=props.onSaved;return null;}};let view;
 await Renderer.act(async()=>{view=Renderer.create(React.createElement(panel(ru,engine),{section:'tournaments'}));});
 failed=true;await Renderer.act(async()=>{await assert.rejects(onSaved,/Competition service unavailable/);});
 failed=false;await Renderer.act(async()=>{await onSaved();});
 assert.match(JSON.stringify(view.toJSON()),/CURRENT CATALOG/);assert.doesNotMatch(JSON.stringify(view.toJSON()),/Competition service unavailable/);
 await Renderer.act(async()=>view.unmount());
});
