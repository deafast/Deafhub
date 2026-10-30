// Browser-specific presentation of the unchanged approved DH; no tracing or retyping.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp');
async function main(){
 const source='public/branding/approved-2026-10-28/dh.png',output='public/branding/browser-2026-10-30';fs.mkdirSync(output,{recursive:true});
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let left=info.width,top=info.height,right=-1,bottom=-1;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>128){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
 if(right<left)throw Error('Approved DH is empty');
 const crop={left,top,width:right-left+1,height:bottom-top+1},frames=[];
 for(const size of [16,32,48,180,192,512]){
  const margin=size<=48?0:Math.max(1,Math.round(size*.02));
  const mark=await sharp(source).extract(crop).resize(size-margin*2,size-margin*2,{fit:'inside',kernel:'lanczos3'}).png().toBuffer();
  const m=await sharp(mark).metadata();
  const badge=Buffer.from('<svg width="'+size+'" height="'+size+'"><rect width="'+size+'" height="'+size+'" rx="'+(size*.18)+'" fill="#0A0F14"/></svg>');
  const png=await sharp(badge).composite([{input:mark,left:Math.floor((size-m.width)/2),top:Math.floor((size-m.height)/2)}]).png().toBuffer();
  fs.writeFileSync(path.join(output,'icon-'+size+'.png'),png);if(size<=48)frames.push({size,data:png});
 }
 const header=Buffer.alloc(6+16*frames.length);header.writeUInt16LE(1,2);header.writeUInt16LE(frames.length,4);let offset=header.length;
 frames.forEach(({size,data},i)=>{const at=6+i*16;header[at]=size;header[at+1]=size;header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(data.length,at+8);header.writeUInt32LE(offset,at+12);offset+=data.length;});
 fs.writeFileSync(path.join(output,'favicon.ico'),Buffer.concat([header,...frames.map(x=>x.data)]));
 fs.writeFileSync(path.join(output,'provenance.json'),JSON.stringify({source,sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),crop,method:'Approved raster DH, trim only outer alpha margin, proportionate resize, dark rounded badge for contrast. No new logo or vector claim.',sizes:[16,32,48,180,192,512]},null,2)+'\n');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
