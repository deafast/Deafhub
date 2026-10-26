const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{create,act}=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
const award={id:'award',batch_id:'batch',entry_id:'entry',recipient_id:'user',place:1,game:'cs2',tournament_title:'QA tournament',team_name:'QA team',nickname:'QA winner',avatar_url:null,created_at:'2026-10-22T10:00:00Z'};
async function fixture(ru,pending){
 let gets=0,expired=false,finish;
 const child={__esModule:true,default:()=>null};
 const scope={exports:{},Error,AbortController,fetch:async()=>{
  gets++;
  if(!expired)return Response.json({awards:[award]});
  return pending?new Promise(resolve=>{finish=()=>resolve(new Response('Session expired',{status:401}));}):new Response('Session expired',{status:401});
 },require:name=>['./TournamentCheckin','./TournamentResults','./TournamentAutoAdmission'].includes(name)?child:require(name)};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/hub/TournamentOperations.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,scope);
 const Component=scope.exports.ProfileAwards;
 let view;await act(async()=>{view=create(React.createElement(Component,{ru}));});
 return {view,requests:()=>gets,expire:()=>{expired=true;},recover:()=>{expired=false;},
  refresh:async()=>act(async()=>{view.root.findAllByType('button').find(n=>n.children.join('')==='Обновить награды'||n.children.join('')==='Refresh awards').props.onClick();}),
  language:async value=>act(async()=>view.update(React.createElement(Component,{ru:value}))),
  finish:async()=>act(async()=>{finish();await new Promise(resolve=>setImmediate(resolve));}),
  close:async()=>act(async()=>view.unmount()),
 };
}
for(const ru of [true,false])for(const phase of ['after-response','pending-response'])test(`profile awards session-expiry feedback follows current language ${phase} RU=${ru}`,async t=>{
 const f=await fixture(ru,phase==='pending-response');t.after(f.close);
 await f.refresh();assert.equal(f.view.root.findAllByType('article').length,1);
 f.expire();await f.refresh();const requests=f.requests();
 await f.language(!ru);assert.equal(f.requests(),requests,'language change repeated the awards request');
 if(phase==='pending-response')await f.finish();
 const alert=f.view.root.find(n=>n.props.role==='alert').children.join('');
 assert.equal(alert,ru?'Sign in again to view awards.':'Войдите снова, чтобы посмотреть награды.');
 assert.equal(f.view.root.findAllByType('article').length,0,'expired awards remained visible');
 f.recover();await f.refresh();assert.equal(f.view.root.findAll(n=>n.props.role==='alert').length,0);
 assert.equal(f.view.root.findAllByType('article').length,1);assert.equal(f.requests(),3);
});
