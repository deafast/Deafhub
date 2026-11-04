const fs=require('node:fs'),crypto=require('node:crypto'),test=require('node:test'),assert=require('node:assert/strict'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),{load}=require('../test-support/ui-module.cjs');
for(const language of ['ru','en'])test('five-game home exposes only supported disciplines and working actions: '+language,()=>{
 const C=load('components/shared/BrandPreview.tsx',{state:{language}}).default;
 const html=renderToStaticMarkup(React.createElement(C));
 for(const id of ['dota2','cs2','fc'])assert.equal(html.split('href="/tournaments?game='+id+'"').length-1,1);
 for(const id of ['lol','valorant']){assert.doesNotMatch(html,new RegExp('href="[^"]*game='+id));assert.match(html,new RegExp('data-game="'+id+'" data-decorative="true"'));}
 assert.equal((html.match(/data-game="/g)||[]).length,5);
 assert.match(html,/href="\/tournaments"/);assert.match(html,/href="\/team"/);
 for(const route of ['about','rules','contact'])assert.match(html,new RegExp('href="/'+route+'"'));
 assert.match(html,/wordmark-tagline.png/);
 assert.ok(html.includes(language==='ru'?'Найти турнир':'Find a tournament'));
 assert.ok(html.includes(language==='ru'?'Найти команду':'Find a team'));
 assert.doesNotMatch(html,/LivingWaves|canvas|video|Инклюзивное сообщество|без барьеров|data-card-root/);
 for(const image of html.matchAll(/src="([^"]+)"/g))assert.ok(fs.existsSync('public'+image[1]),'missing local asset '+image[1]);
});
test('original artwork remains available and unchanged',()=>assert.equal(crypto.createHash('sha256').update(fs.readFileSync('public/branding/home-approved/artwork.webp')).digest('hex'),'786bf662eca17f72aa2e7f185a52ca526ae3c23fed9ae6e96fa38d83f3a327f7'));
test('home art stays within transfer budget and Mbappe comes from recorded official source',()=>{
 for(const file of ['scene.webp','mbappe.webp'])assert.ok(fs.statSync('public/branding/home-five-games/'+file).size<500000);
 const source=JSON.parse(fs.readFileSync('public/branding/home-five-games/sources.json','utf8'));
 assert.match(source.mbappe.url,/^https:\/\/publish.realmadrid.com\//);
 assert.match(source.mbappe.originalSha256,/^[a-f0-9]{64}$/);
 assert.equal(source.mbappe.processedSha256,crypto.createHash('sha256').update(fs.readFileSync('public/branding/home-five-games/mbappe.webp')).digest('hex'));
});
