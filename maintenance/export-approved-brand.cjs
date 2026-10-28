const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const [source, destination] = process.argv.slice(2);
if (!source || !destination) throw Error('Usage: node export-approved-brand.cjs source.png output-directory');
async function main() {
 fs.mkdirSync(destination,{recursive:true});
 const input=fs.readFileSync(source);
 fs.writeFileSync(path.join(destination,'approved-source.png'),input);
 const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 // Export source pixels without tracing, retyping, or inventing geometry.
 // Only near-black background pixels become transparent. Opaque RGB is unchanged.
 for(let i=0;i<data.length;i+=4){
  const value=Math.max(data[i],data[i+1],data[i+2]);
  data[i+3]=value<=24?0:value>=56?255:Math.round((value-24)*255/32);
 }
 const rgba=()=>sharp(data,{raw:{width:info.width,height:info.height,channels:4}});
 const regions={
  'logo':{left:544,top:230,width:610,height:445},
  'dh':{left:548,top:230,width:605,height:324},
  'wordmark':{left:544,top:560,width:610,height:75},
  'wordmark-tagline':{left:544,top:560,width:610,height:115},
  'shirt-back':{left:544,top:560,width:610,height:115},
  'tagline':{left:564,top:640,width:568,height:35}
 };
 const records={};
 for(const [name,region] of Object.entries(regions)){
  const png=await rgba().extract(region).png().toBuffer();
  fs.writeFileSync(path.join(destination,name+'.png'),png);
  // SVG is an explicitly labelled lossless raster container, never a vector claim.
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${region.width}" height="${region.height}" viewBox="0 0 ${region.width} ${region.height}"><title>DEAFHUB ${name} - embedded raster artwork</title><desc>Lossless PNG container. Not vector paths. Source glyph shapes preserved; no font file included.</desc><image width="${region.width}" height="${region.height}" href="data:image/png;base64,${png.toString('base64')}"/></svg>\n`;
  fs.writeFileSync(path.join(destination,name+'-raster.svg'),svg);
  records[name]={...region,sha256:crypto.createHash('sha256').update(png).digest('hex')};
 }
 const iconPngs=[];
 for(const size of [16,32,48,180,192,512]){
  const png=await sharp(path.join(destination,'dh.png')).resize(size-2*Math.max(1,Math.round(size*.07)),size-2*Math.max(1,Math.round(size*.07)),{fit:'inside'}).extend({top:0,bottom:0,left:0,right:0}).png().toBuffer();
  const m=await sharp(png).metadata();
  const icon=await sharp({create:{width:size,height:size,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:png,left:Math.floor((size-m.width)/2),top:Math.floor((size-m.height)/2)}]).png().toBuffer();
  fs.writeFileSync(path.join(destination,`icon-${size}.png`),icon);
  if(size<=48)iconPngs.push({size,data:icon});
 }
 const header=Buffer.alloc(6+16*iconPngs.length);header.writeUInt16LE(1,2);header.writeUInt16LE(iconPngs.length,4);
 let offset=header.length;
 iconPngs.forEach(({size,data},i)=>{const p=6+i*16;header[p]=size;header[p+1]=size;header.writeUInt16LE(1,p+4);header.writeUInt16LE(32,p+6);header.writeUInt32LE(data.length,p+8);header.writeUInt32LE(offset,p+12);offset+=data.length;});
 fs.writeFileSync(path.join(destination,'favicon.ico'),Buffer.concat([header,...iconPngs.map(p=>p.data)]));
 const sourceHash=crypto.createHash('sha256').update(input).digest('hex');
 fs.writeFileSync(path.join(destination,'provenance.json'),JSON.stringify({source:'https://chatgpt.com/s/m_6ae24e7321cc81918ff9c3cce5f07a97',sourceSha256:sourceHash,sourceSize:{width:info.width,height:info.height},method:'Original RGB pixels, near-black alpha export (24..56), rectangular separation; no generative outputs used.',svg:'Embedded PNG containers, not vector artwork.',font:'Original raster glyphs preserved. Font family and font files unavailable.',regions:records},null,2)+'\n');
 console.log(JSON.stringify({sourceHash,sourceSize:info,regions:records},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
