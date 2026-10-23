const {readFileSync}=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
const translations={en:{nav:{home:'Home'}},ru:{nav:{home:'Главная'}}};
for(const persisted of [{language:'ru'},{language:'en'},{language:'de'},{language:null},{language:{unexpected:true}},{language:'ru',setLanguage:'invalid saved value',t:null}])test(`stored language recovers to a valid dictionary: ${JSON.stringify(persisted)}`,t=>{
 const language=persisted.language;
 const original=Object.getOwnPropertyDescriptor(global,'localStorage');t.after(()=>{if(original)Object.defineProperty(global,'localStorage',original);else delete global.localStorage;});let saved;
 Object.defineProperty(global,'localStorage',{configurable:true,value:{getItem:()=>JSON.stringify({state:persisted,version:0}),setItem:(key,value)=>{saved=JSON.parse(value);},removeItem(){}}});
 const code=ts.transpileModule(readFileSync('store/useLanguageStore.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const scope={exports:{},require:name=>name==='@/lib/i18n'?{translations}:require(name)};vm.runInNewContext(code,scope);
 const store=scope.exports.useLanguageStore,state=store.getState();const expected=language==='ru'?'ru':'en';
 assert.equal(state.language,expected);assert.equal(state.t,translations[expected]);assert.equal(typeof state.setLanguage,'function');
 state.setLanguage('ru');assert.equal(store.getState().t,translations.ru);assert.deepEqual(saved.state,{language:'ru'});
 state.setLanguage('en');assert.equal(store.getState().t,translations.en);
});
