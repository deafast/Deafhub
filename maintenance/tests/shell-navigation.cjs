const test=require('node:test'),assert=require('node:assert/strict'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),{load}=require('../test-support/ui-module.cjs');
for(const language of ['ru','en'])for(const file of ['Header','BottomNav'])test(file+' marks current route and section: '+language,()=>{
 const state={language,setLanguage(){},t:{nav:{home:'Home',live:'Matches',tournaments:'Tournaments',team:'Teams',profile:'Profile'}}};
 for(const [pathname,href,current] of [['/','/','page'],['/live','/live','page'],['/tournaments/demo','/tournaments','location'],['/team','/team','page'],['/teamwork',null,null],['/profile',file==='Header'?null:'/profile','page']]){
  const C=load('components/shell/'+file+'.tsx',{state,pathname}).default;
  const html=renderToStaticMarkup(React.createElement(C));
  const marked=(html.match(/<a\b[^>]*>/g)||[]).filter(link=>link.includes('aria-current='));
  assert.equal(marked.length,href?1:0,pathname);
  if(href){assert.ok(marked[0].includes('href="'+href+'"'));assert.ok(marked[0].includes('aria-current="'+current+'"'));}
  assert.match(html,language==='ru'?/aria-label="Основная навигация"/:/aria-label="Main navigation"/);
  if(file==='Header'){
   assert.match(html,/approved-2026-10-28\/dh.png/);
   assert.match(html,/aria-haspopup="menu"/);
   assert.match(html,language==='ru'?/aria-label="Язык: Русский"/:/aria-label="Language: English"/);
   assert.doesNotMatch(html,/>РУ<|>EN</);
  }
 }
});
test('language selection accepts supported locales only and keeps accessible labels',()=>{
 let onValueChange;const updates=[],state={language:'ru',setLanguage:value=>updates.push(value)};
 const pass=({children})=>React.createElement('div',null,children);
 const radio={Root:pass,Portal:pass,Content:pass,Trigger:({children,...props})=>React.createElement('button',props,children),RadioGroup:({children,...props})=>{onValueChange=props.onValueChange;return React.createElement('div',null,children);},RadioItem:({children,...props})=>React.createElement('button',props,children)};
 const C=load('components/shell/LanguageMenu.tsx',{state,imports:{'@radix-ui/react-dropdown-menu':radio}}).default;
 const html=renderToStaticMarkup(React.createElement(C));
 assert.match(html,/aria-label="Русский"/);assert.match(html,/aria-label="English"/);assert.doesNotMatch(html,/>Русский<|>English<|>EN<|>РУ</);
 for(const locale of ['en','ru','invalid','de',''])onValueChange(locale);
 assert.deepEqual(updates,['en','ru']);
});
