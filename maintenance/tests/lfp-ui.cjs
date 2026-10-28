const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{create,act}=require('react-test-renderer');global.IS_REACT_ACT_ENVIRONMENT=true;
const blank=()=>({listings:[],mine:[],incoming:[],outgoing:[],teams:[{id:'team',game:'cs2',name:'Team',canInvite:true}],nextCursor:null});
const listing={id:'player-one',game:'cs2',nickname:'Player',position:'Support',note:'Evenings',updatedAt:'2026-10-26T10:00:00Z',mine:false};
const data={userId:'captain',teams:[{id:'team',game:'cs2',captain_id:'captain',name:'Team'}],members:[],entries:[],tournaments:[],invites:[]};
function fixture(initial=blank(),customFetch){
 let board=initial,calls=[],joined=0,expired=0,finish;
 const fetch=customFetch||((url,options)=>{calls.push({url,options});if(options.method==='POST')return new Promise(resolve=>{finish=resolve;});return Promise.resolve(Response.json(board));});
 const scope={exports:{},AbortController,URLSearchParams,fetch,require:name=>name==='next/link'?{__esModule:true,default:p=>React.createElement('a',p)}:name==='@/lib/team-directory'?{indexTeamDirectory:()=>({availability:()=>({canJoin:true})})}:require(name)};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/hub/PlayerLfp.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,scope);
 return {Component:scope.exports.default,calls,get joined(){return joined},get expired(){return expired},setBoard:value=>{board=value;},finish:value=>finish(value),props:{data,game:'cs2',ru:true,headingLevel:2,onJoined:async()=>{joined++;},onExpired:()=>{expired++;}}};
}
for(const ru of [true,false])test(`LFP publishes only after the player submits the visible disclosure RU=${ru}`,async t=>{
 const f=fixture();let view;const props={...f.props,ru};await act(async()=>{view=create(React.createElement(f.Component,props));});t.after(async()=>act(async()=>view.unmount()));
 assert.match(JSON.stringify(view.toJSON()),ru?/Контакты из профиля не публикуются/:/Profile contacts are not published/);
 const input=view.root.findAllByType('input')[0],textarea=view.root.findByType('textarea');
 await act(async()=>{input.props.onChange({target:{value:'Support'}});textarea.props.onChange({target:{value:'Evenings'}});});assert.equal(f.calls.filter(c=>c.options.method==='POST').length,0);
 await act(async()=>{const submit=view.root.findByType('form').props.onSubmit;submit({preventDefault(){}});submit({preventDefault(){}});});
 const requests=f.calls.filter(c=>c.options.method==='POST');assert.equal(requests.length,1);assert.deepEqual(JSON.parse(requests[0].options.body),{action:'publish',game:'cs2',position:'Support',note:'Evenings'});
 await act(async()=>{f.finish(Response.json({saved:true}));});assert.ok(view.root.findAll(n=>n.props.role==='status').some(n=>n.children.join('').includes(ru?'Объявление опубликовано.':'Listing published.')));
});
for(const ru of [true,false])test(`captain can invite and duplicate clicks send only one request RU=${ru}`,async t=>{
 const f=fixture({...blank(),listings:[listing]});let view;await act(async()=>{view=create(React.createElement(f.Component,{...f.props,ru}));});t.after(async()=>act(async()=>view.unmount()));
 const label=ru?'Пригласить Player':'Invite Player',click=view.root.findByProps({'aria-label':label}).props.onClick;
 await act(async()=>{click();click();});let requests=f.calls.filter(c=>c.options.method==='POST');assert.equal(requests.length,1);assert.deepEqual(JSON.parse(requests[0].options.body),{action:'invite',listing_id:'player-one',team_id:'team'});
 f.setBoard({...blank(),listings:[listing],outgoing:[{id:'inv',listingId:'player-one',teamId:'team',game:'cs2'}]});await act(async()=>{f.finish(Response.json({saved:true}));});
 assert.equal(view.root.findByProps({'aria-label':ru?'Приглашение ожидает ответа':'Invitation pending'}).props.disabled,true);
});
test('only the captain of a matching team receives an invite action',async t=>{const f=fixture({...blank(),listings:[listing],teams:[]});let view;await act(async()=>{view=create(React.createElement(f.Component,f.props));});t.after(async()=>act(async()=>view.unmount()));assert.equal(view.root.findAll(n=>String(n.props['aria-label']).includes('Пригласить Player')).length,0);});
for(const action of ['accept','decline'])test(`recipient ${action} uses invitation identity and refreshes the catalog only on acceptance`,async t=>{
 const f=fixture({...blank(),incoming:[{id:'inv',teamId:'team',teamName:'Team',game:'cs2',createdAt:'2026-10-26T10:00:00Z'}]});let view;await act(async()=>{view=create(React.createElement(f.Component,f.props));});t.after(async()=>act(async()=>view.unmount()));
 const label=action==='accept'?'Принять':'Отклонить';await act(async()=>view.root.findAllByType('button').find(n=>n.children.join('')===label).props.onClick());
 assert.deepEqual(JSON.parse(f.calls.find(c=>c.options.method==='POST').options.body),{action,invitation_id:'inv'});f.setBoard(blank());await act(async()=>{f.finish(Response.json({saved:true}));});assert.equal(f.joined,action==='accept'?1:0);
});
test('expired session clears listings and incoming invitations and informs the parent',async t=>{const f=fixture({...blank(),listings:[listing],incoming:[{id:'inv',teamId:'team',teamName:'Team',game:'cs2',createdAt:'now'}]});let view;await act(async()=>{view=create(React.createElement(f.Component,f.props));});t.after(async()=>act(async()=>view.unmount()));await act(async()=>view.root.findAllByType('button').find(n=>n.children.join('')==='Отклонить').props.onClick());await act(async()=>{f.finish(Response.json({error:'Sign in required'},{status:401}));});assert.equal(view.root.findAllByType('article').length,0);assert.equal(f.expired,1);assert.match(view.root.findByProps({role:'alert'}).children.join(''),/Войдите снова/);});
test('expired session on initial listing read informs the parent and shows no private data',async t=>{const f=fixture(blank(),()=>Promise.resolve(Response.json({error:'Sign in required'},{status:401})));let view;await act(async()=>{view=create(React.createElement(f.Component,f.props));});t.after(async()=>act(async()=>view.unmount()));assert.equal(f.expired,1);assert.equal(view.root.findAllByType('article').length,0);assert.equal(view.root.findAllByType('form').length,0);});
test('a player without a nickname gets a link to profile settings without publication',async t=>{const f=fixture();let view;await act(async()=>{view=create(React.createElement(f.Component,f.props));});t.after(async()=>act(async()=>view.unmount()));await act(async()=>view.root.findAllByType('input')[0].props.onChange({target:{value:'Support'}}));await act(async()=>view.root.findByType('form').props.onSubmit({preventDefault(){}}));await act(async()=>{f.finish(Response.json({error:'Save your player nickname first'},{status:400}));});assert.ok(view.root.findAllByType('a').some(n=>n.props.href==='/profile/settings'));assert.equal(f.calls.filter(c=>c.options.method==='POST').length,1);});
test('late response for the previous game cannot replace the current listings',async t=>{let first,second;const requests=[];const f=fixture(blank(),(url,options)=>{requests.push({url,options});return new Promise(resolve=>{if(requests.length===1)first=resolve;else second=resolve;});});let view;await act(async()=>{view=create(React.createElement(f.Component,{...f.props,game:'dota2'}));});t.after(async()=>act(async()=>view.unmount()));await act(async()=>view.update(React.createElement(f.Component,{...f.props,game:'cs2'})));await act(async()=>{second(Response.json({...blank(),listings:[listing]}));});await act(async()=>{first(Response.json({...blank(),listings:[{...listing,id:'old',nickname:'Old player',game:'dota2'}]}));});assert.match(JSON.stringify(view.toJSON()),/Player/);assert.doesNotMatch(JSON.stringify(view.toJSON()),/Old player/);assert.equal(requests[0].options.signal.aborted,true);});
test('a successful invitation remains successful if the follow-up refresh fails',async t=>{let reads=0,posts=0;const f=fixture(blank(),(_url,options)=>{if(options.method==='POST'){posts++;return Promise.resolve(Response.json({saved:true}));}reads++;return Promise.resolve(reads===1?Response.json({...blank(),listings:[listing]}):Response.json({error:'Unavailable'},{status:503}));});let view;await act(async()=>{view=create(React.createElement(f.Component,f.props));});t.after(async()=>act(async()=>view.unmount()));await act(async()=>view.root.findByProps({'aria-label':'Пригласить Player'}).props.onClick());assert.equal(posts,1);assert.match(JSON.stringify(view.toJSON()),/Приглашение отправлено игроку/);assert.match(JSON.stringify(view.toJSON()),/Данные пока не обновились/);});
test('an unavailable service does not display fake players or a publish form',async t=>{const f=fixture(blank(),()=>Promise.resolve(Response.json({error:'Unavailable'},{status:503})));let view;await act(async()=>{view=create(React.createElement(f.Component,f.props));});t.after(async()=>act(async()=>view.unmount()));assert.equal(view.root.findAllByType('article').length,0);assert.equal(view.root.findAllByType('form').length,0);assert.ok(view.root.findAllByType('button').some(n=>n.children.join('')==='Повторить'));});
test('more pages append unique listings and preserve the cursor',async t=>{let reads=0;const next={...listing,id:'player-two',nickname:'Second'};const f=fixture(blank(),(_url,options)=>{if(options.method==='POST')throw Error('unexpected mutation');reads++;return Promise.resolve(Response.json(reads===1?{...blank(),listings:[listing],nextCursor:'cursor-one'}:{...blank(),listings:[listing,next]}));});let view;await act(async()=>{view=create(React.createElement(f.Component,f.props));});t.after(async()=>act(async()=>view.unmount()));await act(async()=>view.root.findAllByType('button').find(n=>n.children.join('')==='Показать ещё').props.onClick());assert.equal(view.root.findAllByType('article').length,2);assert.equal(reads,2);});

for(const ru of [true,false])test(`LFP POST401 stops a concurrent page-loading indicator RU=${ru}`,async t=>{
 let reads=0;
 const f=fixture(blank(),(_url,options)=>{
  if(options.method==='POST')return Promise.resolve(new Response('expired',{status:401}));
  reads++;
  if(reads===1)return Promise.resolve(Response.json({...blank(),listings:[listing],nextCursor:'next-page'}));
  return new Promise(()=>{});
 });
 let view;await act(async()=>{view=create(React.createElement(f.Component,{...f.props,ru}));});
 t.after(async()=>act(async()=>view.unmount()));
 await act(async()=>view.root.findAllByType('button').find(n=>n.children.join('')===(ru?'Показать ещё':'Show more')).props.onClick());
 assert.ok(view.root.findAll(n=>n.props.role==='status').some(n=>n.children.join('')===(ru?'Загрузка…':'Loading…')));
 await act(async()=>view.root.findByProps({'aria-label':ru?'Пригласить Player':'Invite Player'}).props.onClick());
 assert.equal(f.expired,1);
 assert.equal(view.root.findAllByType('article').length,0);
 assert.equal(view.root.findAllByType('form').length,0);
 assert.equal(view.root.findAll(n=>n.props.role==='status'&&n.children.join('')===(ru?'Загрузка…':'Loading…')).length,0);
});
