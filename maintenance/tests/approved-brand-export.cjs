const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const test=require('node:test'),assert=require('node:assert/strict'),sharp=require('sharp');
const base=path.resolve(__dirname,'../../public/branding/approved-2026-10-28');
test('approved artwork retains source RGB and placement without tracing or retyping',async()=>{
 const source=fs.readFileSync(path.join(base,'approved-source.png'));
 const provenance=JSON.parse(fs.readFileSync(path.join(base,'provenance.json')));
 assert.equal(crypto.createHash('sha256').update(source).digest('hex'),provenance.sourceSha256);
 const original=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(const [name,region] of Object.entries(provenance.regions)){
  const file=fs.readFileSync(path.join(base,name+'.png'));
  assert.equal(crypto.createHash('sha256').update(file).digest('hex'),region.sha256);
  const exported=await sharp(file).raw().toBuffer({resolveWithObject:true});
  assert.equal(exported.info.width,region.width);assert.equal(exported.info.height,region.height);
  let transparent=0,opaque=0;
  for(let y=0;y<region.height;y++)for(let x=0;x<region.width;x++){
   const a=(y*region.width+x)*4,b=((y+region.top)*original.info.width+x+region.left)*4;
   for(let c=0;c<3;c++)assert.equal(exported.data[a+c],original.data[b+c],`${name}: source RGB changed`);
   const value=Math.max(original.data[b],original.data[b+1],original.data[b+2]);
   assert.equal(exported.data[a+3],value<=24?0:value>=56?255:Math.round((value-24)*255/32));
   if(!exported.data[a+3])transparent++;if(exported.data[a+3]===255)opaque++;
  }
  assert.ok(transparent>0);assert.ok(opaque>0);
  const svg=fs.readFileSync(path.join(base,name+'-raster.svg'),'utf8');
  assert.match(svg,/Not vector paths/);assert.ok(svg.includes(file.toString('base64')));assert.doesNotMatch(svg,/<text\b|<path\b/);
 }
});
test('browser and device icons contain actual alpha and readable artwork within safe margins',async()=>{
 for(const size of [16,32,48,180,192,512]){
  const {data,info}=await sharp(path.join(base,`icon-${size}.png`)).raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,size);assert.equal(info.height,size);assert.equal(info.channels,4);
  assert.equal(data[3],0);assert.equal(data[data.length-1],0);
  let visible=0;for(let i=3;i<data.length;i+=4)if(data[i]>128)visible++;
  assert.ok(visible>size*size*.1);
 }
});
