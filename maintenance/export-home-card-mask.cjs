// Deterministic local display mask. Original artwork RGB is never rewritten.
const fs=require('node:fs'),sharp=require('sharp');(async()=>{
 const region={left:680,top:125,width:965,height:620};
 const source=await sharp('docs/design/home-restored-card-background.png').extract(region).ensureAlpha().raw().toBuffer();
 const model=await sharp('docs/design/cards-subject-alpha.png').greyscale().raw().toBuffer();
 const paths='M861 202 L1068 195 L985 648 L767 619 Z M1084 170 L1361 145 L1284 676 L1004 652 Z M1382 191 L1627 234 L1562 666 L1310 640 Z';
 const svg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="965" height="620"><rect width="965" height="620" fill="black"/><defs><filter id="edge"><feGaussianBlur stdDeviation="1.5"/></filter></defs><g transform="translate(-680 -125)"><path d="'+paths+'" fill="white" stroke="white" stroke-width="12" stroke-linejoin="round" filter="url(#edge)"/><path d="'+paths+'" fill="white" stroke="white" stroke-width="5" stroke-linejoin="round"/></g></svg>');
 const frame=await sharp(svg).removeAlpha().greyscale().raw().toBuffer();const mask=Buffer.alloc(965*620);let extra=0;
 for(let y=0;y<620;y++)for(let x=0;x<965;x++){
  const i=y*965+x,gx=x+680,gy=y+125,r=source[i*4],g=source[i*4+1],b=source[i*4+2];
  let sf=0;
  if(gx>=680&&gx<=1080&&gy>=150&&gy<=660){
   sf=Math.max(0,Math.min(255,Math.round((model[i]-40)*255/160)));
   if(g>r*1.3&&b>r*1.3&&(g-r>25||b-r>25))sf=0; // exclude the separate cyan wave, not the red character
  }
  mask[i]=Math.max(frame[i],sf);if(mask[i]>frame[i]+50)extra++;
 }
 // Keep only components connected to complete card interiors; remove isolated wave remnants.
 const seen=new Uint8Array(mask.length),queue=new Int32Array(mask.length);
 for(let seed=0;seed<mask.length;seed++)if(mask[seed]>12&&!seen[seed]){
  let head=0,tail=1,connected=false;queue[0]=seed;seen[seed]=1;
  while(head<tail){const i=queue[head++];if(frame[i]>240)connected=true;const x=i%965,y=Math.floor(i/965);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=965||ny>=620)continue;const n=ny*965+nx;if(!seen[n]&&mask[n]>12){seen[n]=1;queue[tail++]=n;}}
  }
  if(!connected)for(let n=0;n<tail;n++)mask[queue[n]]=0;
 }
 for(let i=0;i<mask.length;i++)if(mask[i]<=12)mask[i]=0;

 // Retain the full antialiased rims of both horns; do not cut by a polygon.
 const before=Buffer.from(mask);
 for(const [x0,y0,x1,y1] of [[810,160,885,270],[995,160,1040,270]])for(let gy=y0;gy<=y1;gy++)for(let gx=x0;gx<=x1;gx++){
  const x=gx-680,y=gy-125,i=y*965+x;let value=before[i];
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)value=Math.max(value,before[(y+dy)*965+x+dx]||0);
  mask[i]=value;
 }
 const output=process.argv[2]||'public/branding/home-approved/cards-silhouette-mask.png';
 await sharp(mask,{raw:{width:965,height:620,channels:1}}).png().toFile(output);
 console.log(JSON.stringify({output,canvas:{x:680,y:125,width:965,height:620},subjectOutsideFrames:extra,sourceRgbChanged:false}));
})().catch(e=>{console.error(e);process.exitCode=1;});
