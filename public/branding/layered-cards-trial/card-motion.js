(function(root){
 'use strict';
 function motionAt(x,y,rect){
  const unit=(value,start,size)=>size>0&&Number.isFinite(value)?Math.max(-1,Math.min(1,((value-start)/size-.5)*2)):0;
  const nx=unit(x,rect.left,rect.width),ny=unit(y,rect.top,rect.height);
  return {rx:-ny*4||0,ry:nx*5,px:nx*3,py:ny*3,lx:50+nx*45,ly:50+ny*45};
 }
 if(typeof module==='object'&&module.exports)module.exports={motionAt};
 if(typeof document==='undefined')return;
 const allowed=matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
 for(const card of document.querySelectorAll('.card')){
  let frame=0,rect=null,last=null;
  const reset=()=>{if(frame)cancelAnimationFrame(frame);frame=0;last=null;rect=null;card.classList.remove('pointer-live');for(const key of ['--rx','--ry','--px','--py','--lx','--ly'])card.style.removeProperty(key);};
  const paint=()=>{frame=0;if(!last||!rect||!allowed.matches)return;const m=motionAt(last.x,last.y,rect);for(const [key,value] of Object.entries(m))card.style.setProperty('--'+key,value+(['rx','ry'].includes(key)?'deg':['px','py'].includes(key)?'px':'%'));};
  card.addEventListener('pointerenter',event=>{if(!allowed.matches||event.pointerType==='touch')return;rect=card.getBoundingClientRect();card.classList.add('pointer-live');});
  card.addEventListener('pointermove',event=>{if(!allowed.matches||event.pointerType==='touch')return;if(!rect)rect=card.getBoundingClientRect();card.classList.add('pointer-live');last={x:event.clientX,y:event.clientY};if(!frame)frame=requestAnimationFrame(paint);});
  card.addEventListener('pointerleave',reset);card.addEventListener('pointercancel',reset);allowed.addEventListener('change',reset);window.addEventListener('blur',reset);window.addEventListener('resize',reset);
 }
})(typeof globalThis!=='undefined'?globalThis:this);
