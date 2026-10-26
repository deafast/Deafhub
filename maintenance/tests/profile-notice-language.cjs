const {readFileSync}=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{create,act}=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
function load(file,extra={}){const scope={exports:{},require,...extra};vm.runInNewContext(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,scope);return scope.exports;}
const profileSchema=load('lib/profile.ts').profileSchema;
const initial={nickname:'Player',region:'europe',telegram:'valid_name',vk:'player'};
for(const ru of [true,false])for(const state of ['invalid','saved','failed'])for(const during of state==='invalid'?[false]:[true,false])test(`profile ${state} notice follows language changes ${during?'during':'after'} saving RU=${ru}`,async t=>{
 let language=ru?'ru':'en',finish,calls=0,refreshes=0;
 const Component=load('components/auth/ProfileForm.tsx',{
  FormData:class{constructor(values){this.values=values;}[Symbol.iterator](){return Object.entries(this.values)[Symbol.iterator]();}},
  fetch:()=>{calls++;return new Promise(resolve=>{finish=resolve;});},
  require:name=>({
   'next/navigation':{useRouter:()=>({refresh:()=>refreshes++})},
   '@/store/useLanguageStore':{useLanguageStore:selector=>selector({language})},
   '@/lib/profile':{profileSchema},'@/components/ui/button':{Button:props=>React.createElement('button',props)},
  }[name]??require(name)),
 }).default;
 let view,pending;await act(async()=>{view=create(React.createElement(Component,{initial}));});t.after(async()=>act(async()=>view.unmount()));
 await act(async()=>{pending=view.root.findByType('form').props.onSubmit({preventDefault(){},currentTarget:state==='invalid'?{...initial,nickname:'!'}:initial});});
 const switchLanguage=async()=>act(async()=>{language=ru?'en':'ru';view.update(React.createElement(Component,{initial}));});
 if(during)await switchLanguage();
 if(state!=='invalid')await act(async()=>{finish({ok:state==='saved'});await pending;});
 if(!during)await switchLanguage();
 const expected={
  invalid:ru?'Check your nickname and contacts. Enter Telegram and VK usernames, without links.':'Проверьте ник и контакты. Telegram — имя без ссылки, VK — короткий адрес страницы.',
  saved:ru?'Profile saved.':'Профиль сохранён.',
  failed:ru?'Could not save your profile. Please try again.':'Не удалось сохранить профиль. Попробуйте ещё раз.',
 };
 const notice=view.root.find(n=>n.props.role===(state==='saved'?'status':'alert'));
 assert.equal(notice.children.join(''),expected[state]);assert.equal(calls,state==='invalid'?0:1);assert.equal(refreshes,state==='saved'?1:0);
 if(state==='invalid')assert.equal(view.root.findAllByType('input').find(n=>n.props.name==='nickname').props['aria-describedby'],notice.props.id);
});
