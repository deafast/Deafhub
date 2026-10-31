(function(){
 'use strict';
 const shapes={sf:[[101,77],[308,70],[225,523],[7,494]],cs2:[[324,45],[601,20],[524,551],[244,527]],fc:[[622,66],[867,109],[802,541],[550,515]]};
 function matrixFor(quad,width=360,height=580){
  const from=[[0,0],[width,0],[width,height],[0,height]],rows=[];
  for(let i=0;i<4;i++){const [x,y]=from[i],[u,v]=quad[i];rows.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);}
  for(let col=0;col<8;col++){let pivot=col;for(let r=col+1;r<8;r++)if(Math.abs(rows[r][col])>Math.abs(rows[pivot][col]))pivot=r;[rows[col],rows[pivot]]=[rows[pivot],rows[col]];const divisor=rows[col][col];if(Math.abs(divisor)<1e-10)throw Error('Degenerate card quad');for(let j=col;j<=8;j++)rows[col][j]/=divisor;for(let r=0;r<8;r++)if(r!==col){const factor=rows[r][col];for(let j=col;j<=8;j++)rows[r][j]-=factor*rows[col][j];}}
  const h=rows.map(r=>r[8]);return [h[0],h[3],0,h[6],h[1],h[4],0,h[7],0,0,1,0,h[2],h[5],0,1];
 }
 if(typeof module==='object'&&module.exports)module.exports={matrixFor,shapes};
 if(typeof document==='undefined')return;
 const scene=document.querySelector('.scene');if(!scene)return;
 function fit(){const scale=scene.clientWidth/885;for(const [name,quad] of Object.entries(shapes)){const card=scene.querySelector('.'+name);if(innerWidth<=600){card.style.removeProperty('transform');continue;}card.style.transform='matrix3d('+matrixFor(quad.map(([x,y])=>[x*scale,y*scale])).join(',')+')';}}
 fit();if(typeof ResizeObserver==='function')new ResizeObserver(fit).observe(scene);else window.addEventListener('resize',fit);
})();
