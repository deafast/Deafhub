// Export unchanged source RGB with the accepted alpha; no model, network or redraw.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp');
async function main(){
 const root='public/branding/game-cards-transparent',canvas={left:680,top:125,width:965,height:620},pad=16;fs.mkdirSync(root,{recursive:true});
 const original=await sharp('public/branding/home-approved/artwork.webp').extract(canvas).ensureAlpha().raw().toBuffer();
 const alpha=await sharp('public/branding/home-approved/cards-silhouette-mask.png').greyscale().raw().toBuffer();
 const frame=[[861,202],[1068,195],[985,648],[767,619]];
 const nearFrame=(x,y)=>frame.every((a,i)=>{const b=frame[(i+1)%4],dx=b[0]-a[0],dy=b[1]-a[1];return dx*(y-a[1])-dy*(x-a[0])>=-8*Math.hypot(dx,dy);});
 let backdropRemoved=0;
 for(let y=0;y<620;y++)for(let x=0;x<965;x++){const i=y*965+x,gx=x+680,gy=y+125;if(alpha[i]&&gx>=1022&&gx<=1075&&gy<190){alpha[i]=0;backdropRemoved++;}if(!alpha[i]||gx>1080||nearFrame(gx,gy))continue;const r=original[i*4],g=original[i*4+1],b=original[i*4+2];
  if((gx>=1022&&gx<=1075&&gy<190)||(gx>885&&gx<995&&gy<192)||(alpha[i]<170&&g>r*1.25&&b>r*1.25)){alpha[i]=0;backdropRemoved++;}
 }
 // Remove isolated exterior specks, retaining the connected character/card silhouette.
 const seen=new Uint8Array(alpha.length);
 for(let seed=0;seed<alpha.length;seed++){
  if(seen[seed]||!alpha[seed])continue;const queue=[seed];seen[seed]=1;
  for(let at=0;at<queue.length;at++){const p=queue[at],x=p%965,y=Math.floor(p/965);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy,n=ny*965+nx;if(nx>=0&&nx<965&&ny>=0&&ny<620&&!seen[n]&&alpha[n]){seen[n]=1;queue.push(n);}}
  }
  if(queue.length<32)for(const i of queue){alpha[i]=0;backdropRemoved++;}
 }
 const group=Buffer.from(original);for(let i=0;i<alpha.length;i++){group[i*4+3]=alpha[i];if(!alpha[i])group.fill(0,i*4,i*4+3);}
 await sharp(group,{raw:{width:965,height:620,channels:4}}).png().toFile(path.join(root,'all-cards.png'));
 const defs=[{id:'dota2',name:'Shadow Fiend · Dota 2',file:'dota2-sf.png'},{id:'cs2',name:'Counter-Strike 2',file:'cs2.png'},{id:'fc',name:'EA SPORTS FC',file:'ea-sports-fc.png'}],records=[];
 const belongs=(x,y)=>x<1107.973-.174598*y?0:x<1397.329-.152683*y?1:2;
 for(let card=0;card<3;card++){
  let x0=965,y0=620,x1=-1,y1=-1;
  for(let y=0;y<620;y++)for(let x=0;x<965;x++)if(alpha[y*965+x]&&belongs(x+680,y+125)===card){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  if(x1<0)throw Error('Empty card');const width=x1-x0+1+pad*2,height=y1-y0+1+pad*2,out=Buffer.alloc(width*height*4);
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(belongs(x+680,y+125)===card){const i=y*965+x;if(!alpha[i])continue;const at=((y-y0+pad)*width+x-x0+pad)*4;group.copy(out,at,i*4,i*4+4);}
  const bytes=await sharp(out,{raw:{width,height,channels:4}}).png().toBuffer();fs.writeFileSync(path.join(root,defs[card].file),bytes);
  records.push({...defs[card],width,height,padding:pad,sourceOffset:{x:x0+680-pad,y:y0+125-pad},sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 }
 fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({source:'../home-approved/artwork.webp',sourceSha256:crypto.createHash('sha256').update(fs.readFileSync('public/branding/home-approved/artwork.webp')).digest('hex'),backdropRemoved,method:'Cool low-confidence exterior backdrop, detached traces between horns, thin stray stroke above the right Dota corner and isolated exterior specks removed only outside the card; original RGB retained wherever alpha>0; transparent outside each card, cleared hidden RGB. No redraw, resize, font/logo replacement or invented detail. Added 16px transparent safety margin. Descriptive phrases remain editable HTML on the site; clean PNGs contain original game logos only.',canvas,cards:records},null,2)+'\n');
 console.log(records.map(x=>({file:x.file,width:x.width,height:x.height})));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
