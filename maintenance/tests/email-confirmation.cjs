const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const test=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript');
const vm=require('node:vm');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
function load(file,imports={}) {
 const source=readFileSync(resolve(__dirname,'../..',file),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;
 const scope={exports:{},URL,process:{cwd:()=>process.cwd(),env:{VERCEL_ENV:'preview',NODE_ENV:'test'}},Response,require:name=>imports[name]||require(name)};
 vm.runInNewContext(compiled,scope);return scope.exports;
}
const helpers=load('lib/auth/email-confirmation.ts');
for(const [email,provider] of [['user@gmail.com','Gmail'],['user@googlemail.com','Gmail'],['user@mail.ru','Mail.ru'],['user@bk.ru','Mail.ru'],['user@inbox.ru','Mail.ru'],['user@outlook.com','Outlook'],['user@hotmail.com','Outlook'],['user@yandex.ru','Яндекс Почта'],['user@ya.ru','Яндекс Почта']])test(`provider ${email}`,()=>assert.equal(helpers.emailProvider(email).name,provider));
test('unknown and spoofed providers never become arbitrary links',()=>{for(const value of ['user@company.test','user@gmail.com.evil.test','a@gmail.com@evil.test','javascript:alert(1)'])assert.equal(helpers.emailProvider(value),null);});
test('cooldown boundaries and callback preserve origin without redirect injection',()=>{
 assert.equal(helpers.remainingConfirmationSeconds(61000,1000),60);assert.equal(helpers.remainingConfirmationSeconds(2000,1500),1);assert.equal(helpers.remainingConfirmationSeconds(1000,2000),0);assert.equal(helpers.remainingConfirmationSeconds(NaN,2000),0);
 const callback=new URL(helpers.confirmationCallback('https://preview.example'));assert.equal(callback.origin,'https://preview.example');assert.equal(callback.pathname,'/auth/callback');assert.equal(callback.search,'');
});
const Pending=load('components/auth/EmailConfirmationPending.tsx',{'@/lib/supabase/client':{createClient:()=>null},'@/lib/auth/email-confirmation':helpers}).default;
for(const ru of [true,false])for(const email of ['player@gmail.com','player@mail.ru','player@unknown.test'])test(`pending screen ${email} RU=${ru}`,()=>{
 const html=renderToStaticMarkup(React.createElement(Pending,{email,ru,deadline:60000,onBack:()=>{}}));assert.ok(html.includes(email));assert.match(html,ru?/Проверьте вашу почту/:/Check your email/);assert.match(html,/disabled=""/);
 const provider=helpers.emailProvider(email);if(provider){assert.ok(html.includes(provider.url));assert.match(html,/noopener noreferrer/);}else assert.match(html,ru?/вашего почтового сервиса/:/provider website/);
 assert.ok(!html.includes('mailto:'));assert.match(html,/break-all/);
});
let codeError=null,clientThrow=false,emailIdentity=false;
const callback=load('app/auth/callback/route.ts',{'next/server':{NextResponse:{redirect:url=>({url:String(url),headers:new Headers()})}},'@/lib/supabase/server':{createClient:async()=>{if(clientThrow)throw Error('network');return {auth:{exchangeCodeForSession:async()=>({error:codeError,data:{user:{app_metadata:{provider:emailIdentity?'email':'steam'}}}})}};}}});
for(const [flow,target] of [['recovery','/auth/reset-password'],['','/auth/complete']])test(`callback preserves ${flow||'existing'} flow`,async()=>{
 const url='https://preview.example/auth/callback?code=test-code&flow='+flow;const response=await callback.GET({url,nextUrl:new URL(url)});assert.equal(new URL(response.url).pathname,target);assert.equal(response.headers.get('Referrer-Policy'),'no-referrer');assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.ok(!response.url.includes('test-code'));
});
test('expired invalid missing and unavailable callbacks show error without tokens',async()=>{
 for(const kind of ['expired','missing','network']){codeError=kind==='expired'?{code:'otp_expired'}:null;clientThrow=kind==='network';const url='https://preview.example/auth/callback'+(kind==='missing'?'':'?code=private-code');const response=await callback.GET({url,nextUrl:new URL(url)});assert.equal(response.url,'https://preview.example/sign-in?error=callback');assert.equal(response.headers.get('Cache-Control'),'private, no-store');}
 clientThrow=false;codeError=null;
});
test('confirmation template keeps real logo and unchanged Supabase verification URLs',()=>{
 const html=readFileSync(resolve(__dirname,'../../supabase/templates/confirm-signup.html'),'utf8');assert.equal((html.match(/href="\{\{ .ConfirmationURL \}\}"/g)||[]).length,4);assert.match(html,/if eq .Data.locale "ru"/);assert.ok(html.includes('Добро пожаловать в DEAF|HUB!'));assert.ok(html.includes('Welcome to DEAF|HUB!'));assert.match(html,/https:\/\/raw.githubusercontent.com\/deafast\/Deafhub\/0d032de\/public\/branding\/deafhub-wordmark-no-glints.png/);assert.ok(!/<script|<form|<video|@import|javascript:/i.test(html));assert.match(html,/mso-padding-alt/);assert.match(html,/width="100%"/);
});
const emailPreview=load('app/auth/email-preview/route.ts');
test('email preview renders RU EN and constrained 360 width without real links',async()=>{
 for(const suffix of ['?lang=ru','?lang=en','?lang=ru&width=360']){const response=await emailPreview.GET({nextUrl:new URL('https://preview.example/auth/email-preview'+suffix)});assert.equal(response.status,200);const html=await response.text();assert.ok(!html.includes('{{'));assert.match(html,/#demo-confirmation/);assert.ok(!html.includes('token='));if(suffix.includes('360'))assert.ok(html.includes('max-width:328px'));}
});

test('email signup confirmation works on existing allowed callback without new query',async()=>{emailIdentity=true;const url='https://preview.example/auth/callback?code=example';try{const response=await callback.GET({url,nextUrl:new URL(url)});assert.equal(new URL(response.url).pathname,'/auth/email-confirmed');}finally{emailIdentity=false;}});

let verifiedUser=null;
const confirmed=load('app/auth/email-confirmed/page.tsx',{'next/navigation':{redirect:url=>{throw Error('REDIRECT '+url)}},'next/link':{__esModule:true,default:({children,...p})=>React.createElement('a',p,children)},'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:verifiedUser},error:null})}})},'@/components/shared/LocalizedText':{__esModule:true,default:p=>p.ru}});
test('confirmation success page requires server-verified confirmed user',async()=>{
 for(const user of [null,{email:'demo@example.com',email_confirmed_at:null}]){verifiedUser=user;await assert.rejects(()=>confirmed.default(),/REDIRECT \/sign-in\?error=callback/);}
 verifiedUser={email:'demo@example.com',email_confirmed_at:'2026-10-19T07:00:00Z'};
 const html=renderToStaticMarkup(await confirmed.default());assert.match(html,/Почта подтверждена/);assert.match(html,/demo@example.com/);
});
