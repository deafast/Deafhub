const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{create,act}=require('react-test-renderer');global.IS_REACT_ACT_ENVIRONMENT=true;
function component(){const scope={exports:{},FormData:class{constructor(values){this.values=values;}get(key){return this.values[key]??null;}},require};vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/hub/MatchSchedule.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,scope);return scope.exports.default;}
for(const ru of [true,false])test(`schedule form rejects invalid UTC dates without throwing and accepts a corrected time RU=${ru}`,async()=>{
 const saved=[];let view;await act(async()=>{view=create(React.createElement(component(),{match:{id:'U1.0',status:'ready'},owner:true,busy:false,ru,onSave:async command=>saved.push(command)}));});
 const submit=async value=>act(async()=>view.root.findByType('form').props.onSubmit({preventDefault(){},currentTarget:{scheduledAt:value,reason:'Organizer correction'}}));
 for(const value of ['not-a-date','10000-01-01T12:00','2026-02-30T12:00','2026-11-01T25:00']){
  await assert.doesNotReject(submit(value),value);assert.equal(saved.length,0,value);assert.equal(view.root.findAll(n=>n.props.role==='alert').length,1);
 }
 await submit('2026-11-01T18:30');assert.equal(saved.length,1);assert.equal(saved[0].scheduledAt,'2026-11-01T18:30:00.000Z');assert.equal(view.root.findAll(n=>n.props.role==='alert').length,0);
 await submit('');assert.equal(saved.length,2);assert.equal(saved[1].scheduledAt,null);
 await act(async()=>view.unmount());
});
