const {readFileSync}=require('node:fs');const vm=require('node:vm');const ts=require('typescript');const test=require('node:test');const assert=require('node:assert/strict');const React=require('react'),Renderer=require('react-test-renderer');global.IS_REACT_ACT_ENVIRONMENT=true;
const uid='00000000-0000-4000-8000-000000000001',entry='00000000-0000-4000-8000-000000000002';
function load(){const file='components/hub/TournamentResults.tsx';const code=ts.transpileModule(readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;const scope={exports:{},AbortController,FormData:class{constructor(values){this.values=values}get(key){return key in this.values?this.values[key]:null}},fetch:(...a)=>global.fetch(...a),require};vm.runInNewContext(code,scope);return scope.exports.default;}
for(const ru of [true,false])for(const scenario of ['dota2','cs2','fc-empty','fc-complete','fc-only-a','fc-only-b'])test(`score form ${scenario} RU=${ru}`,async t=>{
 const previous=global.fetch;t.after(()=>{global.fetch=previous;});const game=scenario.startsWith('fc')?'fc':scenario;const posts=[];
 global.fetch=async(url,init={})=>{if(init.method==='POST'){posts.push(JSON.parse(init.body));return Response.json({saved:true});}return Response.json(url.includes('tournament-engine')?{state:{game,matches:[{id:'U1.0',a:entry,b:uid,status:'ready'}]}}:{rules:null,referees:[],reports:[],confirmations:[],captainEntries:[entry],userId:uid});};
 let view;await Renderer.act(async()=>{view=Renderer.create(React.createElement(load(),{id:uid,owner:false,ru,locked:true,name:id=>id,players:[]}));});
 const values={a:game==='fc'?'2':'1',b:game==='fc'?'2':'0',evidence:'Registered captain report'};
 if(game==='fc'){values.pa=scenario==='fc-complete'||scenario==='fc-only-a'?'4':'';values.pb=scenario==='fc-complete'||scenario==='fc-only-b'?'3':'';}
 await Renderer.act(async()=>{view.root.findByType('form').props.onSubmit({preventDefault(){},currentTarget:values});await new Promise(resolve=>setImmediate(resolve));});
 if(scenario==='fc-only-a'||scenario==='fc-only-b'){
  assert.equal(posts.length,0,'Partial shootout was silently discarded and submitted');const alerts=view.root.findAll(n=>n.props.role==='alert');assert.equal(alerts.length,1);assert.match(alerts[0].children.join(''),ru?/оба значения/:/both shootout scores/);
 }else{
  assert.equal(posts.length,1);assert.equal(posts[0].result.kind,'played');assert.equal(posts[0].result.a,game==='fc'?2:1);assert.equal(posts[0].result.b,game==='fc'?2:0);
  if(scenario==='fc-complete')assert.deepEqual(posts[0].result.penalties,{a:4,b:3});else assert.equal(posts[0].result.penalties,undefined,'Unentered penalty data was fabricated');
 }
 await Renderer.act(async()=>view.unmount());
});
