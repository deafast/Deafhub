const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),React=require('react'),{create,act}=require('react-test-renderer'),test=require('node:test'),assert=require('node:assert/strict');
global.IS_REACT_ACT_ENVIRONMENT=true;
const css={default:new Proxy({},{get:(_,key)=>key})};
const data={userId:'me',teams:[{id:'team',name:'Owned team',game:'dota2'}],members:[{team_id:'team',user_id:'me'}],tournaments:[{id:'finished',title:'Hosted completed event',status:'finished',organizer_id:'me',starts_at:'2026-10-20T10:00:00Z'},{id:'open',title:'Not yet completed',status:'open',organizer_id:'me',starts_at:'2026-10-21T10:00:00Z'},{id:'other',title:'Another organizer',status:'finished',organizer_id:'other',starts_at:'2026-10-21T10:00:00Z'}]};
const award={id:'award',place:1,game:'dota2',tournament_title:'Awarded event',team_name:'Owned team',created_at:'2026-10-22T23:50:00Z',hub_award_batches:{status:'issued'}};
function component(fetch){const scope={exports:{},AbortController,fetch,require:name=>name.endsWith('.css')?css:name==='next/link'?{default:p=>React.createElement('a',p,p.children)}:require(name)};vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/hub/ProfileHonors.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,scope);return scope.exports.default;}
const text=view=>JSON.stringify(view.toJSON());
for(const ru of [true,false]){
 test(`profile honors use issued records and distinguish hosted events from wins RU=${ru}`,async()=>{
  let calls=0;const C=component(async()=>{calls++;return Response.json({awards:[award]});});let view;
  await act(async()=>{view=create(React.createElement(C,{data,ru}));});try{assert.equal(view.root.findAllByType('article').length,1);assert.match(text(view),/Awarded event/);assert.match(text(view),/Hosted completed event/);assert.doesNotMatch(text(view),/Not yet completed|Another organizer/);assert.match(text(view),/Owned team/);assert.equal(view.root.findByType('time').props.dateTime,award.created_at);const time=view.root.findByType('time').children.join('');assert.match(time,ru?/Выдана 22.10.2026/:/Awarded 22\/10\/2026/);await act(async()=>view.update(React.createElement(C,{data,ru:!ru})));assert.equal(calls,1);}finally{await act(async()=>view.unmount());}
 });
 test(`empty honors do not invent trophies and revoked awards remain clearly marked RU=${ru}`,async()=>{
  let revoked=false;const C=component(async()=>Response.json({awards:revoked?[{...award,hub_award_batches:{status:'revoked'}}]:[]}));let view;await act(async()=>{view=create(React.createElement(C,{data,ru}));});try{assert.equal(view.root.findAllByType('article').length,0);assert.match(text(view),ru?/Подтверждённых титулов пока нет/:/No confirmed titles yet/);revoked=true;await act(async()=>view.root.findByType('button').props.onClick());assert.match(text(view),ru?/Отозвана/:/Revoked/);assert.equal(view.root.findByType('article').props['data-revoked'],true);}finally{await act(async()=>view.unmount());}
 });
 test(`expired awards hide previous titles and cancel requests on close RU=${ru}`,async()=>{
  let expired=false,lastSignal;const C=component(async(_url,options)=>{lastSignal=options.signal;return expired?new Response('',{status:401}):Response.json({awards:[award]});});let view;await act(async()=>{view=create(React.createElement(C,{data,ru}));});assert.equal(view.root.findAllByType('article').length,1);expired=true;await act(async()=>view.root.findByType('button').props.onClick());assert.equal(view.root.findAllByType('article').length,0);assert.match(text(view),ru?/Войдите снова/:/Sign in again/);await act(async()=>view.unmount());assert.equal(lastSignal.aborted,true);
 });
}
