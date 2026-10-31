const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
for(const ru of [true,false])test(`home uses the agreed game composition and game filters RU=${ru}`,()=>{
 const imports={
  'next/image':{__esModule:true,default:({unoptimized,...props})=>React.createElement('img',props)},
  'next/link':{__esModule:true,default:({children,...p})=>React.createElement('a',p,children)},
  '@/store/useLanguageStore':{useLanguageStore:select=>select({language:ru?'ru':'en'})},
  './BrandPreview.module.css':{__esModule:true,default:new Proxy({},{get:(_,key)=>key})},
  './LivingWaves':{__esModule:true,default:()=>React.createElement('svg',{'data-unchanged-waves':true})},
 };
 const scope={exports:{},require:name=>imports[name]||require(name)};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/shared/BrandPreview.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,scope);
 const html=renderToStaticMarkup(React.createElement(scope.exports.default));
 assert.match(html,/href="\/branding\/home-approved\/artwork.webp"/);
 assert.match(html,/width="1672" height="941"/);
 assert.doesNotMatch(html,/ESPORTS PLATFORM|deafhub-dh-no-glints|<foreignObject/);
 assert.match(html,/data-unchanged-waves/);
 for(const label of ['Dota 2','CS2','EA Sports FC'])assert.ok(html.includes(label));
 for(const game of ['dota2','cs2','fc'])assert.equal(html.split(`href="/tournaments?game=${game}"`).length-1,2);
 assert.ok(html.includes(ru?'Присоединиться':'Join us'));
 for(const phrase of ru?['Стратегия','Командный дух','Игра для каждого']:['Strategy','Team spirit','A game for everyone'])assert.ok(html.includes(phrase));
 assert.ok(!html.includes('/branding/approved-2026-10-28/logo.png'));
 assert.match(html,/<details/);
 const mobile=html.split('class="mobileGames"')[1].split('</nav>')[0];
 assert.ok(!mobile.includes('artwork.webp'));
 assert.ok(!mobile.includes('<svg'));
 assert.ok(!mobile.includes('<span'), 'mobile links contain only the original logo, without duplicate captions');
 for(const logo of ['dota2.png','cs2.svg','ea-sports-fc.svg'])assert.ok(mobile.includes(`/branding/game-logos/${logo}`));
});

test('desktop artwork uses a silhouette mask and only gentle motion with reduced-motion opt-out',()=>{
 const source=fs.readFileSync('components/shared/BrandPreview.tsx','utf8'),css=fs.readFileSync('components/shared/BrandPreview.module.css','utf8');
 assert.match(source,/<mask[^>]*maskUnits="userSpaceOnUse"/);assert.match(source,/<image[^>]*mask=/);assert.match(source,/useId\(/);
 assert.match(css,/@media\(min-width:1101px\) and \(prefers-reduced-motion:no-preference\)/);
 assert.match(css,/animation:sceneFloat 12s ease-in-out infinite/);assert.match(css,/translateY\(-3px\)/);assert.doesNotMatch(css,/mix-blend-mode:lighten/);
});

const sharp=require('sharp'),crypto=require('node:crypto');
test('full subject mask preserves SF hand and every original card corner with transparent outer margins',async()=>{
 const {data,info}=await sharp('public/branding/home-approved/cards-silhouette-mask.png').greyscale().raw().toBuffer({resolveWithObject:true});
 assert.equal(info.width,965);assert.equal(info.height,620);assert.equal(info.channels,1);
 const alpha=(x,y)=>data[(y-125)*965+x-680];
 for(const [x,y] of [[861,202],[1068,195],[985,648],[767,619],[1084,170],[1361,145],[1284,676],[1004,652],[1382,191],[1627,234],[1562,666],[1310,640]])assert.equal(alpha(x,y),255,'frame corner clipped: '+x+','+y);
 assert.equal(alpha(745,505),255,'SF outer hand was cut off');assert.equal(alpha(760,480),255,'SF wrist was cut off');assert.ok(alpha(780,400)>100,'SF outside the card was removed');
 assert.equal(alpha(900,140),0,'external cyan wave retained');
 for(let x=0;x<965;x++){assert.equal(data[x],0);assert.equal(data[619*965+x],0);}for(let y=0;y<620;y++){assert.equal(data[y*965],0);assert.equal(data[y*965+964],0);}
});
test('approved artwork remains byte-identical and wider mask canvas does not shrink the three cards',()=>{
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync('public/branding/home-approved/artwork.webp')).digest('hex'),'786bf662eca17f72aa2e7f185a52ca526ae3c23fed9ae6e96fa38d83f3a327f7');
 const css=fs.readFileSync('components/shared/BrandPreview.module.css','utf8');assert.match(css,/width:calc\(100% \* 965 \/ 885\)/);assert.match(css,/margin-left:calc\(-100% \* 80 \/ 885\)/);
});
