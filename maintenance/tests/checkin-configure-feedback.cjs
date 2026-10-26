const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{create,act}=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
for(const ru of [true,false])test(`invalid check-in window replaces earlier saved feedback RU=${ru}`,async t=>{
 let posts=0;
 const scope={exports:{},Error,AbortController,FormData:class{constructor(values){this.values=values;}get(key){return this.values[key]??null;}},fetch:async(_url,options={})=>{
  if(options.method==='POST'){posts++;return Response.json({saved:true});}
  return Response.json({window:null,checkins:[],rulesVersion:'rules'});
 },require};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/hub/TournamentCheckin.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,scope);
 let view;await act(async()=>{view=create(React.createElement(scope.exports.default,{id:'tournament',owner:true,ru,locked:false,userId:'user',players:[],entries:[],policyVersion:null,name:()=>''}));});
 t.after(async()=>act(async()=>view.unmount()));
 const submit=async fields=>act(async()=>view.root.findByType('form').props.onSubmit({preventDefault(){},currentTarget:{reason:'QA configuration',...fields}}));
 const notices=()=>view.root.findAll(n=>n.props.role==='status').map(n=>n.children.join(''));
 await submit({enabled:''});assert.ok(notices().includes(ru?'Готовность обновлена.':'Check-in updated.'));
 await submit({enabled:'on',opens_at:'',closes_at:''});
 assert.equal(posts,1,'invalid dates reached the API');
 assert.equal(view.root.find(n=>n.props.role==='alert').children.join(''),ru?'Укажите время начала и окончания. Окончание должно быть в будущем.':'Enter a valid opening and future closing time.');
 assert.equal(notices().length,0,'previous saved feedback remained beside the validation error');
 await submit({enabled:'on',opens_at:'2026-10-26T12:00',closes_at:'2026-11-01T12:00'});
 assert.equal(posts,2);assert.equal(view.root.findAll(n=>n.props.role==='alert').length,0);
 assert.ok(notices().includes(ru?'Готовность обновлена.':'Check-in updated.'));
});
