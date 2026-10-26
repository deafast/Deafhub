const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{create,act}=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
const ui={Button:props=>React.createElement('button',props),Input:props=>React.createElement('input',props)};
function load(file,imports,extra={}){const scope={exports:{},AbortController,URL,Event,...extra,require:name=>imports[name]??require(name)};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,scope);return scope.exports.default;}

for(const ru of [true,false])for(const ending of ['blocked','start','callback','timeout','verify'])for(const during of ['blocked','start'].includes(ending)?[false]:[true,false])test(`Steam ${ending} message follows language changes ${during?'during':'after'} waiting RU=${ru}`,async t=>{
 let language=ru?'ru':'en',poll,now=0,requests=0;const timers=new Set(),routes=[];
 const popup={location:{href:''},sessionStorage:{setItem(){if(ending==='start')throw Error('PRIVATE STORAGE DETAIL');}},close(){}};
 const Component=load('components/auth/AuthPanel.tsx',{
  'next/navigation':{useRouter:()=>({replace:path=>routes.push(path),refresh(){}})},
  'next/image':{__esModule:true,default:()=>null},'./EmailAuth':{__esModule:true,default:()=>null},
  '@/lib/supabase/client':{createClient:()=>({auth:{getUser:async()=>{if(ending==='verify')throw Error('PRIVATE AUTH DETAIL');return {data:{user:null}};}}})},
  '@/store/useLanguageStore':{useLanguageStore:selector=>selector({language})},'@/components/ui/button':ui,
 },{
  Date:{now:()=>now},window:{location:{origin:'https://preview.example'},open:()=>ending==='blocked'?null:popup},
  fetch:async()=>{requests++;return Response.json({enabled:true});},
  setInterval:callback=>{poll=callback;timers.add(callback);return callback;},clearInterval:callback=>timers.delete(callback),
 });
 let view;await act(async()=>{view=create(React.createElement(Component,{steamOnly:true}));});t.after(async()=>act(async()=>view.unmount()));
 await act(async()=>view.root.findAllByType('button')[0].props.onClick());
 const switchLanguage=async()=>act(async()=>{language=ru?'en':'ru';view.update(React.createElement(Component,{steamOnly:true}));});
 if(during)await switchLanguage();
 if(poll){popup.location.href=ending==='callback'?'https://preview.example/sign-in?error=steam':'https://steamcommunity.com/openid/login';now=180001;await act(async()=>poll());}
 if(!during)await switchLanguage();
 const expected={
  blocked:ru?'Allow the sign-in popup and try again.':'Разрешите всплывающее окно для входа и нажмите ещё раз.',
  start:ru?'Could not start sign-in. Please try again.':'Не удалось начать вход. Попробуйте ещё раз.',
  callback:ru?'Sign-in was not completed. Please try again.':'Вход не завершён. Попробуйте ещё раз.',
  timeout:ru?'Sign-in was not completed. Please try again.':'Вход не завершён. Попробуйте ещё раз.',
  verify:ru?'Could not verify sign-in. Please try again.':'Не удалось проверить вход. Попробуйте ещё раз.',
 };
 assert.equal(view.root.find(n=>n.props.role==='alert').children.join(''),expected[ending]);
 assert.equal(requests,1);assert.equal(timers.size,0);assert.deepEqual(routes,[]);assert.equal(view.root.findAllByType('button')[0].props.disabled,false);
 assert.doesNotMatch(JSON.stringify(view.toJSON()),/PRIVATE (AUTH|STORAGE) DETAIL/);
});

const emailCases={
 mismatch:{mode:'signup',sync:true,text:['Пароли не совпадают.','Passwords do not match.']},
 unavailable:{mode:'login',sync:true,text:['Вход временно недоступен.','Sign-in is temporarily unavailable.']},
 rateEmail:{mode:'login',code:'over_email_send_rate_limit',text:['Слишком много попыток. Повторите позже.','Too many attempts. Please try again later.']},
 rateRequest:{mode:'login',code:'over_request_rate_limit',text:['Слишком много попыток. Повторите позже.','Too many attempts. Please try again later.']},
 address:{mode:'forgot',code:'email_address_not_authorized',text:['Отправка писем на этот адрес пока недоступна в тестовой версии.','Email delivery to this address is not available in this preview yet.']},
 weak:{mode:'signup',code:'weak_password',text:['Выберите более надёжный пароль.','Please choose a stronger password.']},
 login:{mode:'login',code:'unknown',text:['Не удалось войти. Проверьте почту, пароль и подтверждение адреса.','Could not sign in. Check your email, password and email confirmation.']},
 request:{mode:'forgot',code:'unknown',text:['Не удалось выполнить запрос. Повторите попытку позже.','Could not complete the request. Please try again later.']},
 recovery:{mode:'forgot',success:true,text:['Если для этой почты доступно восстановление, вы получите письмо со ссылкой. Проверьте также папку «Спам».','If password recovery is available for this email, you will receive a link. Please also check spam.']},
 reset:{mode:'reset',success:true,text:['Пароль изменён. Теперь можно войти с новым паролем.','Password updated. You can now sign in with your new password.']},
 resetSignout:{mode:'reset',text:['Пароль изменён, но не удалось выйти. Повторите выход через меню аккаунта.','Password updated, but sign-out failed. Try signing out from the account menu.']},
};
for(const ru of [true,false])for(const [name,scenario] of Object.entries(emailCases))for(const during of scenario.sync?[false]:[true,false])test(`email ${name} message follows language changes ${during?'during':'after'} submission RU=${ru}`,async t=>{
 let language=ru?'ru':'en',finish,calls=0,signouts=0;const routes=[],events=[];
 const send=()=>{calls++;return new Promise(resolve=>{finish=resolve;});};
 const client={auth:{getUser:async()=>({data:{user:{id:'test-player'}},error:null}),signInWithPassword:send,signUp:send,resetPasswordForEmail:send,updateUser:send,signOut:async()=>{signouts++;return {error:name==='resetSignout'?{code:'unknown'}:null};}}};
 const Component=load('components/auth/EmailAuth.tsx',{
  'next/navigation':{useRouter:()=>({replace:path=>routes.push(path),refresh(){}})},
  'lucide-react':{Eye:()=>null,EyeOff:()=>null,Mail:()=>null,LockKeyhole:()=>null},
  '@/lib/supabase/client':{createClient:()=>name==='unavailable'?null:client},
  '@/store/useLanguageStore':{useLanguageStore:selector=>selector({language})},'@/components/ui/input':ui,'@/components/ui/button':ui,
  './EmailConfirmationPending':{__esModule:true,default:()=>null},'@/lib/auth/email-confirmation':{confirmationCallback:origin=>origin+'/auth/callback'},
 },{window:{location:{origin:'https://preview.example'},dispatchEvent:event=>events.push(event.type)}});
 const props={reset:scenario.mode==='reset'};let view,pending;await act(async()=>{view=create(React.createElement(Component,props));});t.after(async()=>act(async()=>view.unmount()));
 if(['signup','forgot'].includes(scenario.mode))await act(async()=>view.root.findAllByType('button').find(n=>n.children.join('')===(scenario.mode==='signup'?(ru?'Регистрация':'Sign up'):(ru?'Забыли пароль?':'Forgot password?'))).props.onClick());
 await act(async()=>{for(const input of view.root.findAllByType('input'))if(input.props.onChange)input.props.onChange({target:{value:input.props.name==='email'?'notice@example.test':name==='mismatch'&&input.props.name==='password-confirmation'?'DifferentExample123!':'ExamplePassword123!'}});});
 await act(async()=>{pending=view.root.findByType('form').props.onSubmit({preventDefault(){}});});
 const switchLanguage=async()=>act(async()=>{language=ru?'en':'ru';view.update(React.createElement(Component,props));});
 if(during)await switchLanguage();
 if(!scenario.sync)await act(async()=>{finish({data:{session:null},error:scenario.code?{code:scenario.code,message:'PRIVATE PROVIDER DETAIL'}:null});await pending;});
 if(!during)await switchLanguage();
 assert.equal(view.root.find(n=>n.props.role===(scenario.success?'status':'alert')).children.join(''),scenario.text[ru?1:0]);
 assert.equal(calls,scenario.sync?0:1);assert.equal(signouts,scenario.mode==='reset'?1:0);assert.deepEqual(routes,[]);assert.deepEqual(events,[]);
 assert.doesNotMatch(JSON.stringify(view.toJSON()),/PRIVATE PROVIDER DETAIL/);
});
