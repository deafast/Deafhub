const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),{create,act}=require('react-test-renderer'),test=require('node:test'),assert=require('node:assert/strict');
global.IS_REACT_ACT_ENVIRONMENT=true;
const css={default:new Proxy({},{get:(_,key)=>key})};
const link={default:({children,...props})=>React.createElement('a',props,children)};
function load(file,imports={}){const scope={exports:{},require:name=>imports[name]||(name.endsWith('.css')?css:require(name))};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,scope);return scope.exports;}
const Overview=load('components/hub/TournamentOverview.tsx',{'next/link':link}).default;
const filters=load('lib/tournament-filters.ts');
for(const ru of [true,false]){
 test(`competition summary uses only the currently filtered real records RU=${ru}`,()=>{
  const data={userId:'owner',ownEntryIds:[],tournaments:[{id:'a',title:'Test event A',game:'dota2',status:'open',starts_at:'2027-01-01T10:00:00Z'},{id:'b',title:'Test event B',game:'cs2',status:'open',starts_at:'2027-01-02T10:00:00Z'}],entries:[{tournament_id:'a',status:'approved'},{tournament_id:'a',status:'pending'},{tournament_id:'b',status:'approved'}],matches:[{tournament_id:'a',status:'scheduled'},{tournament_id:'b',status:'scheduled'}]};
  const events=filters.filterTournaments(data,'dota2','',false);const original=JSON.stringify(data);
  const html=renderToStaticMarkup(React.createElement(Overview,{game:'dota2',data,tournaments:events,ru}));
  assert.equal((html.match(/<strong>1<\/strong>/g)||[]).length,3);assert.match(html,/<table>/);assert.match(html,/href="#tournament-a"/);assert.ok(!html.includes('Test event B'));assert.equal(JSON.stringify(data),original);assert.doesNotMatch(html,/\$1,?000|AlexSkywalker|100%/);
 });
 test(`unloaded and expired competition view does not fabricate counts or events RU=${ru}`,()=>{
  const html=renderToStaticMarkup(React.createElement(Overview,{game:'fc',data:null,tournaments:[],ru}));assert.equal((html.match(/<strong>—<\/strong>/g)||[]).length,3);assert.doesNotMatch(html,/<table|href="#tournament-/);assert.match(html,/fcLogo/);
 });
 test(`empty authenticated catalog shows zero counts and no imaginary table RU=${ru}`,()=>{
  const html=renderToStaticMarkup(React.createElement(Overview,{game:'all',data:{entries:[],matches:[]},tournaments:[],ru}));assert.equal((html.match(/<strong>0<\/strong>/g)||[]).length,3);assert.doesNotMatch(html,/<table/);
 });
 test(`profile sidebar preserves every existing section and own-only panels RU=${ru}`,async()=>{
  const none={default:()=>null};const C=load('components/auth/PlayerDashboard.tsx',{'next/link':link,'next/image':{default:p=>React.createElement('img',p)},'@/components/r3f/AvatarView':none,'./SteamProfile':none,'./AuthPanel':none,'@/components/hub/HubPanel':{default:p=>React.createElement('hub-test',p)},'@/components/hub/MatchHistory':{default:()=>React.createElement('history-test')},'@/store/useLanguageStore':{useLanguageStore:f=>f({language:ru?'ru':'en'})}}).default;
  let view;await act(async()=>{view=create(React.createElement(C,{profile:{nickname:'<Owner>',region:'europe'},googleConnected:false,steamId:null}));});
  try{const buttons=view.root.findAllByType('button');assert.equal(buttons.length,6);for(const [index,section] of [[1,'stats'],[3,'teams'],[4,'tournaments']]){await act(async()=>buttons[index].props.onClick());const panel=view.root.findByType('hub-test');assert.equal(panel.props.section,section);assert.equal(panel.props.own,true);assert.equal(view.root.findAllByProps({'aria-current':'page'}).length,1);}await act(async()=>buttons[2].props.onClick());assert.equal(view.root.findAllByType('history-test').length,1);await act(async()=>buttons[5].props.onClick());assert.match(JSON.stringify(view.toJSON()),ru?/Баланс, взносы и вывод пока недоступны/:/Balance, fees and withdrawals are unavailable/);await act(async()=>buttons[0].props.onClick());assert.equal(view.root.findByType('hub-test').props.section,'stats');const links=view.root.findAllByType('a').map(n=>n.props.href);for(const game of ['dota2','cs2','fc'])assert.ok(links.includes('/tournaments?game='+game));assert.ok(links.includes('/profile/settings'));}finally{await act(async()=>view.unmount());}
 });
}
