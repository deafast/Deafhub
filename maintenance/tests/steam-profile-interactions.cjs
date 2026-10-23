const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const test=require('node:test');
const assert=require('node:assert/strict');
const React=require('react');
const {create,act}=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
const id='76561198000000001';
const linked={linked:true,steamId:id};
const available={...linked,status:'available',profile:{steamId:id,name:'Public Steam nickname',avatar:'https://avatars.steamstatic.com/test_full.jpg',url:'https://steamcommunity.com/profiles/'+id},checkedAt:'2026-10-22T12:00:00Z'};
function component(send){
 const source=readFileSync(resolve(__dirname,'../../components/auth/SteamProfile.tsx'),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const scope={exports:{},AbortController,fetch:send,require:name=>({
  'next/image':{__esModule:true,default:props=>React.createElement('img',props)},
  '@/lib/steam/profile':{steamProfileUrl:value=>'https://steamcommunity.com/profiles/'+value},
 }[name]||require(name))};
 vm.runInNewContext(code,scope);return scope.exports.default;
}
const text=view=>JSON.stringify(view.toJSON());
for(const ru of [true,false]){
 for(const status of ['available','private','unconfigured','unavailable'])test(`public Steam profile renders the ${status} response RU=${ru}`,async()=>{
  let calls=0;const Component=component(async(url,init)=>{calls++;assert.equal(url,'/api/steam-profile');assert.equal(init.cache,'no-store');assert.ok(init.signal);return Response.json(status==='available'?available:{...linked,status});});
  let view;await act(async()=>{view=create(React.createElement(Component,{steamId:id,ru}));});
  assert.equal(calls,1);assert.equal(view.root.findAllByProps({role:'status'}).length,1);
  if(status==='available'){
   assert.ok(text(view).includes(available.profile.name));assert.equal(view.root.findByType('img').props.src,available.profile.avatar);assert.equal(view.root.findByType('time').props.dateTime,available.checkedAt);
   assert.ok(text(view).includes(ru?'Источник: Steam.':'Source: Steam.'));
  }else{
   assert.equal(view.root.findAllByType('img').length,0);assert.equal(view.root.findAllByType('time').length,0);assert.ok(!text(view).includes(available.profile.name));
   const labels={private:ru?'Профиль Steam закрыт.':'Steam profile is private.',unconfigured:ru?'Публичные сведения Steam пока не подключены.':'Public Steam details are not connected yet.',unavailable:ru?'Публичные сведения Steam сейчас недоступны.':'Public Steam details are currently unavailable.'};
   assert.ok(text(view).includes(labels[status]));
  }
  assert.equal(view.root.findByType('a').props.rel,'noopener noreferrer');await act(async()=>view.unmount());
 });
 test(`Steam API failure preserves the verified link and displays a localized error RU=${ru}`,async()=>{
  const Component=component(async()=>new Response('',{status:503}));let view;await act(async()=>{view=create(React.createElement(Component,{steamId:id,ru}));});
  assert.ok(text(view).includes(ru?'Привязка сохранена.':'Your link is preserved.'));assert.equal(view.root.findByType('a').props.href,'https://steamcommunity.com/profiles/'+id);assert.equal(view.root.findAllByType('img').length,0);await act(async()=>view.unmount());
 });
}
test('page remount reloads public profile from the API instead of retaining a cached nickname',async()=>{
 let calls=0;const signals=[];const Component=component(async(_,init)=>{signals.push(init.signal);return Response.json({...available,profile:{...available.profile,name:++calls===1?'Before reload':'After reload'}});});
 let view;await act(async()=>{view=create(React.createElement(Component,{steamId:id,ru:true}));});assert.ok(text(view).includes('Before reload'));
 await act(async()=>view.unmount());assert.equal(signals[0].aborted,true);
 await act(async()=>{view=create(React.createElement(Component,{steamId:id,ru:false}));});assert.ok(text(view).includes('After reload'));assert.ok(!text(view).includes('Before reload'));assert.equal(calls,2);await act(async()=>view.unmount());
});
test('a mismatched linked SteamID cannot display another account nickname or avatar',async()=>{
 const Component=component(async()=>Response.json({...available,steamId:'76561198000000002'}));let view;await act(async()=>{view=create(React.createElement(Component,{steamId:id,ru:true}));});
 assert.ok(!text(view).includes(available.profile.name));assert.equal(view.root.findAllByType('img').length,0);await act(async()=>view.unmount());
});
for(const ru of [true,false]){
 test(`expired Steam profile session hides the previous verified link RU=${ru}`,async()=>{
  const Component=component(async()=>new Response('',{status:401}));let view;
  await act(async()=>{view=create(React.createElement(Component,{steamId:id,ru}));});
  assert.ok(text(view).includes(ru?'Войдите снова, чтобы посмотреть подключённый Steam.':'Sign in again to view your connected Steam account.'));
  assert.ok(!text(view).includes(id));assert.equal(view.root.findAllByType('a').length,0);assert.equal(view.root.findAllByType('img').length,0);assert.equal(view.root.findAllByType('time').length,0);
  await act(async()=>view.unmount());
 });
 for(const [kind,response] of [
  ['unlinked',{linked:false}],
  ['outer ID mismatch',{...available,steamId:'76561198000000002'}],
  ['nested ID mismatch',{...available,profile:{...available.profile,steamId:'76561198000000002'}}],
 ])test(`Steam ${kind} cannot claim a current verified profile RU=${ru}`,async()=>{
  const Component=component(async()=>Response.json(response));let view;
  await act(async()=>{view=create(React.createElement(Component,{steamId:id,ru}));});
  assert.ok(text(view).includes(ru?'Не удалось подтвердить текущую привязку Steam. Обновите страницу.':'Could not verify the current Steam link. Reload the page.'));
  assert.ok(!text(view).includes(id));assert.ok(!text(view).includes(available.profile.name));assert.ok(!text(view).includes(ru?'Источник: Steam.':'Source: Steam.'));
  assert.equal(view.root.findAllByType('a').length,0);assert.equal(view.root.findAllByType('img').length,0);assert.equal(view.root.findAllByType('time').length,0);
  await act(async()=>view.unmount());
 });
}
