const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{create,act}=require('react-test-renderer');global.IS_REACT_ACT_ENVIRONMENT=true;
const uid='00000000-0000-4000-8000-000000000001';
const data={userId:uid,policy:{version:uid,body:'CURRENT PARTICIPATION RULES',require_acceptance:true,bronze:'none'},players:[],attestations:[],reviews:[],batches:[],awards:[],audit:[],engineAudit:[]};
async function mount(ru,fetch,onSaved=async()=>{}){
 const child={__esModule:true,default:()=>null},scope={exports:{},Error,AbortController,fetch,require:name=>['./TournamentCheckin','./TournamentResults','./TournamentAutoAdmission'].includes(name)?child:require(name)};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/hub/TournamentOperations.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,scope);
 let view;await act(async()=>{view=create(React.createElement(scope.exports.default,{id:uid,owner:true,ru,status:'finished',locked:true,entries:[],name:()=> 'Team',onSaved}));});
 return {view,refresh:()=>view.root.findAllByType('button').find(n=>n.children.join('')===(ru?'Обновить':'Refresh')).props.onClick(),save:()=>view.root.findAllByType('button').find(n=>n.children.join('')===(ru?'Выдать награды по результатам':'Issue result-based awards')).props.onClick()};
}
for(const ru of [true,false])for(const phase of ['response','json'])test(`operations cancels pending read ${phase} when its page closes RU=${ru}`,async()=>{
 let signal,finish;
 const f=await mount(ru,async(_url,options)=>{
  signal=options.signal;
  return phase==='response'?new Promise(resolve=>{finish=()=>resolve(Response.json(data));}):{ok:true,status:200,json:()=>new Promise(resolve=>{finish=()=>resolve(data);})};
 });
 await act(async()=>f.refresh());await act(async()=>f.view.unmount());
 assert.equal(signal?.aborted,true,'GET remains active after its panel unmounts');
 await act(async()=>{finish();await new Promise(resolve=>setImmediate(resolve));});
 assert.equal(f.view.toJSON(),null);
});
for(const ru of [true,false])test(`operations replaces an obsolete GET after save and keeps the current snapshot RU=${ru}`,async()=>{
 let gets=0,signal,finish,postSignal,saved=0;
 const f=await mount(ru,async(_url,options={})=>{
  if(options.method==='POST'){postSignal=options.signal;return Response.json({saved:true});}
  if(++gets===2){signal=options.signal;return new Promise(resolve=>{finish=resolve;});}
  return Response.json(gets===1?data:{...data,policy:{...data.policy,body:'UPDATED PARTICIPATION RULES'}});
 },async()=>{saved++;});
 await act(async()=>f.refresh());await act(async()=>f.refresh());await act(async()=>f.save());
 assert.equal(signal?.aborted,true,'superseded GET continued after a save-triggered refresh');
 assert.equal(postSignal,undefined,'server mutation must not be cancelled with a read');assert.equal(saved,1);
 await act(async()=>{finish(Response.json({error:'Obsolete request failure'},{status:503}));});
 assert.match(JSON.stringify(f.view.toJSON()),/UPDATED PARTICIPATION RULES/);
 assert.doesNotMatch(JSON.stringify(f.view.toJSON()),/Obsolete request failure|CURRENT PARTICIPATION RULES/);
 await act(async()=>f.view.unmount());
});
for(const ru of [true,false])test(`operations ignores an actual AbortError while replacing a GET RU=${ru}`,async()=>{
 let gets=0;
 const f=await mount(ru,async(_url,options={})=>{
  if(options.method==='POST')return Response.json({saved:true});
  if(++gets===2)return new Promise((_resolve,reject)=>options.signal?.addEventListener('abort',()=>reject(new DOMException('Superseded read','AbortError')),{once:true}));
  return Response.json(gets===1?data:{...data,policy:{...data.policy,body:'UPDATED PARTICIPATION RULES'}});
 });
 await act(async()=>f.refresh());await act(async()=>f.refresh());await act(async()=>f.save());
 assert.equal(gets,3);assert.match(JSON.stringify(f.view.toJSON()),/UPDATED PARTICIPATION RULES/);
 assert.equal(f.view.root.findAll(node=>node.props.role==='alert').length,0,'a cancelled GET became a visible save failure');
 await act(async()=>f.view.unmount());
});
