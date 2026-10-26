const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{create,act}=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
function load(file,imports={}){const scope={exports:{},AbortController,fetch:async()=>Response.json({linked:true,steamId:'76561198000000001',status:'private'}),require:name=>imports[name]||require(name)};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,scope);return scope.exports;}
const empty={__esModule:true,default:()=>null},image={__esModule:true,default:p=>React.createElement('img',p)};
const Steam=load('components/auth/SteamProfile.tsx',{'next/image':image,'@/lib/steam/profile':{steamProfileUrl:id=>'https://steamcommunity.com/profiles/'+id}});
const visibleText=node=>typeof node==='string'?node:!node?'':Array.isArray(node)?node.map(visibleText).join(''):node.props?.className==='sr-only'?'':visibleText(node.children);
for(const ru of [true,false])for(const state of ['steam','steam-and-google','unlinked'])test(`account logos expose truthful provider states without public profile clutter ${state} RU=${ru}`,async t=>{
 const Component=load('components/auth/PlayerDashboard.tsx',{
  'next/image':image,'next/link':{__esModule:true,default:p=>React.createElement('a',p)},
  '@/components/hub/MatchHistory':empty,'@/components/hub/HubPanel':empty,'@/components/r3f/AvatarView':empty,
  './SteamProfile':Steam,'./AuthPanel':{__esModule:true,default:()=>React.createElement('button',null,'Link Steam')},
  '@/store/useLanguageStore':{useLanguageStore:selector=>selector({language:ru?'ru':'en'})},
 }).default;
 let view;await act(async()=>{view=create(React.createElement(Component,{profile:{nickname:'Local player',region:'europe'},googleConnected:state==='steam-and-google',steamId:state==='unlinked'?null:'76561198000000001'}));});t.after(async()=>act(async()=>view.unmount()));
 const images=view.root.findAllByType('img').map(n=>n.props.src);
 assert.equal(images.filter(src=>src==='/auth/steam-mark.svg').length,state==='unlinked'?0:1);
 assert.equal(images.filter(src=>src==='/auth/faceit.svg').length,1);
 assert.equal(images.filter(src=>src==='/auth/google.svg').length,state==='steam-and-google'?1:0);
 const faceit=view.root.find(n=>n.props.role==='img'&&String(n.props['aria-label']).startsWith('FACEIT'));
 assert.match(faceit.props['aria-label'],ru?/недоступно/:/not available/);
 assert.equal(view.root.findAllByType('a').filter(n=>String(n.props.href).includes('faceit')).length,0);
 assert.doesNotMatch(visibleText(view.toJSON()),/7656119|SteamID|Источник: Steam|Source: Steam|Проверено:|Checked:/);
 assert.equal(view.root.findAllByType('time').length,0);
});
