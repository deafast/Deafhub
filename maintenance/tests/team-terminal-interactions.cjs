const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{create,act}=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
function load(file,imports={}){const scope={exports:{},require:name=>imports[name]||require(name)};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,scope);return scope.exports;}
const directory=load('lib/team-directory.ts');
const Component=load('components/hub/TeamsDirectory.tsx',{'@/lib/team-directory':directory,'next/link':{__esModule:true,default:p=>React.createElement('a',p)}}).default;
const data={userId:'viewer',teams:[{id:'a',game:'dota2',name:'Alpha',captain_id:'captain-a'},{id:'b',game:'cs2',name:'Beta',captain_id:'captain-b'}],members:[],invites:[],entries:[{team_id:'b',tournament_id:'cup',status:'pending'}],tournaments:[{id:'cup',status:'open'}]};
for(const ru of [true,false])test(`terminal game, search, availability and reset keep real filtering RU=${ru}`,async t=>{
 let view;await act(async()=>{view=create(React.createElement(Component,{data,ru,own:false,busy:false,onSubmit:async()=>{},onAction:async()=>{throw Error('filters must not mutate data');}}));});t.after(async()=>act(async()=>view.unmount()));
 assert.equal(view.root.findAllByType('article').length,2);
 await act(async()=>view.root.findAllByType('button').find(n=>n.children.join('')==='CS2').props.onClick());assert.equal(view.root.findAllByType('article').length,1);
 await act(async()=>view.root.findAllByType('input').find(n=>n.props.type==='search').props.onChange({target:{value:'Missing'}}));assert.equal(view.root.findAllByType('article').length,0);
 await act(async()=>view.root.findAllByType('button').find(n=>n.children.join('')===(ru?'Сбросить фильтры':'Reset filters')).props.onClick());assert.equal(view.root.findAllByType('article').length,2);
 await act(async()=>view.root.findAllByType('input').find(n=>n.props.type==='checkbox').props.onChange({target:{checked:true}}));assert.equal(view.root.findAllByType('article').length,1);
 assert.ok(JSON.stringify(view.toJSON()).includes('Alpha'));
 const radios=view.root.findAllByType('input').filter(n=>n.props.type==='radio');assert.deepEqual(radios.map(n=>n.props.value),['dota2','cs2']);assert.equal(radios.filter(n=>n.props.defaultChecked).length,1);
 assert.equal(view.root.findAllByType('select').length,0);
});
for(const ru of [true,false])test(`invitation action opens the collapsed form before focusing its field RU=${ru}`,async t=>{
 let focus=0,scroll=0;const panel={open:false};let view;
 await act(async()=>{view=create(React.createElement(Component,{data:{...data,teams:[data.teams[0]]},ru,own:false,busy:false,onSubmit:async()=>{},onAction:async()=>{}}),{createNodeMock:element=>element.type==='details'?panel:element.type==='input'?{focus(){assert.equal(panel.open,true);focus++;},scrollIntoView(){scroll++;}}:null});});t.after(async()=>act(async()=>view.unmount()));
 const invite=view.root.findAllByType('button').find(n=>n.children.join('')===(ru?'Вступить по приглашению':'Join by invitation'));
 await act(async()=>invite.props.onClick());assert.equal(panel.open,true);assert.equal(focus,1);assert.equal(scroll,1);
 assert.ok(view.root.findAll(n=>n.props.role==='status').some(n=>n.children.join('').includes('Alpha')));
});
for(const ru of [true,false])test(`my teams explains missing membership when other players have teams RU=${ru}`,async t=>{
 let view;await act(async()=>{view=create(React.createElement(Component,{data,ru,own:true,busy:false,onSubmit:async()=>{},onAction:async()=>{}}));});t.after(async()=>act(async()=>view.unmount()));
 assert.equal(view.root.findAllByType('article').length,0);
 const statuses=view.root.findAll(n=>n.props.role==='status').map(n=>n.children.join(''));
 assert.ok(statuses.some(value=>value.includes(ru?'У вас пока нет команд. Создайте команду или вступите по приглашению.':'You have no teams yet. Create a team or join by invitation.')));
 assert.equal(view.root.findAllByType('button').some(n=>n.children.join('')===(ru?'Сбросить фильтры':'Reset filters')),false);
});
for(const ru of [true,false])test(`filtering existing own teams offers reset and restores only own teams RU=${ru}`,async t=>{
 const ownData={...data,members:[{team_id:'a',user_id:'viewer',nickname:'Viewer'}]};let view;
 await act(async()=>{view=create(React.createElement(Component,{data:ownData,ru,own:true,busy:false,onSubmit:async()=>{},onAction:async()=>{}}));});t.after(async()=>act(async()=>view.unmount()));
 assert.equal(view.root.findAllByType('article').length,1);
 await act(async()=>view.root.findAllByType('button').find(n=>n.children.join('')==='CS2').props.onClick());
 assert.equal(view.root.findAllByType('article').length,0);
 assert.ok(view.root.findAll(n=>n.props.role==='status').some(n=>n.children.join('').includes(ru?'По выбранным условиям команд нет. Измените или сбросьте фильтры.':'No teams match. Change or reset the filters.')));
 await act(async()=>view.root.findAllByType('button').find(n=>n.children.join('')===(ru?'Сбросить фильтры':'Reset filters')).props.onClick());
 const articles=view.root.findAllByType('article');assert.equal(articles.length,1);assert.ok(JSON.stringify(view.toJSON()).includes('Alpha'));assert.equal(articles[0].findAllByType('h4')[0].children.join(''),'Alpha');
});
