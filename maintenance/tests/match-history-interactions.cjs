const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const test=require('node:test');
const assert=require('node:assert/strict');
const React=require('react');
const {create,act}=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
function component(fetch,ru=true){
 const code=ts.transpileModule(readFileSync(resolve(__dirname,'../../components/hub/MatchHistory.tsx'),'utf8'),{fileName:'MatchHistory.tsx',compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const scope={exports:{},AbortController,fetch,require:name=>({
  'next/link':{__esModule:true,default:props=>React.createElement('a',props)},
  '@/store/useLanguageStore':{useLanguageStore:select=>select({language:ru?'ru':'en'})},
  '@/lib/match-history':{historyDate:()=>'',historyScore:()=>'',historyTournamentUrl:id=>'/tournaments?tournament='+id},
 }[name]||require(name))};
 vm.runInNewContext(code,scope);return scope.exports.default;
}
const match=id=>({match_id:id,tournament_id:'t',tournament_title:'Test fixture only',game:'cs2',player_a:'A',player_b:'B'});
const ok=(items,nextCursor=null)=>({ok:true,json:async()=>({items,nextCursor})});
function button(tree,label){return tree.root.findAllByType('button').find(node=>node.props.children===label);}
for(const ru of [true,false])test(`history clears cached matches and pagination after session expires RU=${ru}`,async()=>{
 let call=0;const Component=component(async()=>++call===1?ok([match('m1')],'next'):{ok:false,status:401},ru);let tree;
 await act(async()=>{tree=create(React.createElement(Component));});
 assert.equal(tree.root.findAllByType('article').length,1);
 await act(async()=>{await button(tree,ru?'Обновить':'Refresh').props.onClick();});
 assert.equal(tree.root.findAllByType('article').length,0);
 assert.equal(button(tree,ru?'Загрузить ещё':'Load more'),undefined);
 assert.equal(tree.root.findAllByType('a').find(a=>a.props.href==='/sign-in').props.children,ru?'Войти':'Sign in');
 await act(async()=>tree.unmount());
});
test('retry after next-page failure keeps previous matches and requests the failed cursor',async()=>{
 const urls=[];const responses=[ok([match('m1')],'next/A'),{ok:false,status:503},ok([match('m1'),match('m2')])];
 const Component=component(async url=>{urls.push(url);return responses.shift();});let tree;
 await act(async()=>{tree=create(React.createElement(Component));});
 await act(async()=>{await button(tree,'Загрузить ещё').props.onClick();});
 assert.equal(tree.root.findAllByType('article').length,1);
 assert.equal(tree.root.findAll(node=>node.props.role==='alert').length,1);
 await act(async()=>{await button(tree,'Повторить').props.onClick();});
 assert.deepEqual(urls,['/api/match-history','/api/match-history?cursor=next%2FA','/api/match-history?cursor=next%2FA']);
 assert.equal(tree.root.findAllByType('article').length,2);
 assert.equal(tree.root.findAll(node=>node.props.role==='alert').length,0);
 assert.equal(button(tree,'Загрузить ещё'),undefined);
 await act(async()=>tree.unmount());
});
test('unmounted history ignores a late response and aborts its request',async()=>{
 let resolveResponse,signal;const Component=component((url,options)=>{signal=options.signal;return new Promise(resolve=>{resolveResponse=resolve;});});let tree;
 await act(async()=>{tree=create(React.createElement(Component));});
 await act(async()=>tree.unmount());assert.equal(signal.aborted,true);
 await act(async()=>resolveResponse(ok([match('late')],'next')));
 assert.equal(tree.toJSON(),null);
});
