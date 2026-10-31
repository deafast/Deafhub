const fs=require('node:fs'),sharp=require('sharp'),test=require('node:test'),assert=require('node:assert/strict');
const base='public/branding/game-cards-transparent/';
test('three separate cutouts have transparent safety margins and preserve every exported group pixel exactly once',async()=>{
 const m=JSON.parse(fs.readFileSync(base+'manifest.json','utf8'));assert.equal(m.cards.length,3);
 const group=await sharp(base+'all-cards.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(group.info.width,965);assert.equal(group.info.height,620);
 const expected=await sharp('public/branding/home-approved/cards-silhouette-mask.png').greyscale().raw().toBuffer();const reconstructed=Buffer.alloc(965*620*4);
 for(const card of m.cards){const {data,info}=await sharp(base+card.file).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,card.width);assert.equal(info.height,card.height);
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const at=(y*info.width+x)*4;if(x<16||y<16||x>=info.width-16||y>=info.height-16)assert.equal(data[at+3],0,'safety margin lost');if(!data[at+3]){assert.equal(data[at]+data[at+1]+data[at+2],0,'hidden background RGB retained');continue;}
   const gx=x+card.sourceOffset.x-680,gy=y+card.sourceOffset.y-125,i=(gy*965+gx)*4;assert.equal(reconstructed[i+3],0,'duplicated card pixel');data.copy(reconstructed,i,at,at+4);
  }
 }
 const pixel=(x,y)=>group.data[((y-125)*965+x-680)*4+3];assert.equal(pixel(745,505),255);assert.equal(pixel(760,480),255);assert.ok(pixel(780,400)>100);
 assert.deepEqual(reconstructed,group.data,'a subject pixel was cut or moved between exported cards');for(let i=0;i<expected.length;i++)assert.ok(group.data[i*4+3]<=expected[i],'new pixels were introduced outside the accepted silhouette');
});
test('exported visible artwork retains approved source RGB without a background replacement',async()=>{
 const source=await sharp('public/branding/home-approved/artwork.webp').extract({left:680,top:125,width:965,height:620}).ensureAlpha().raw().toBuffer();const image=await sharp(base+'all-cards.png').ensureAlpha().raw().toBuffer();for(let i=0;i<image.length;i+=4)if(image[i+3])for(let c=0;c<3;c++)assert.equal(image[i+c],source[i+c]);
});

test('stray stroke above Dota right corner is transparent while the frame remains intact',async()=>{
 const data=await sharp(base+'all-cards.png').ensureAlpha().raw().toBuffer();
 const alpha=(x,y)=>data[((y-125)*965+x-680)*4+3];
 for(let y=169;y<190;y++)for(let x=1022;x<=1075;x++)assert.equal(alpha(x,y),0,'stray stroke remains');
 assert.equal(alpha(1060,200),255,'top frame was clipped');
});
