'use client';

import {useId,useSyncExternalStore} from 'react';
import styles from './BrandPreview.module.css';

const motionQuery='(prefers-reduced-motion: reduce)';
const lightQuery='(max-width: 767px), (prefers-reduced-motion: reduce)';
function subscribe(callback:()=>void){
 const motion=window.matchMedia(motionQuery);
 const light=window.matchMedia(lightQuery);
 motion.addEventListener('change',callback);
 light.addEventListener('change',callback);
 return ()=>{motion.removeEventListener('change',callback);light.removeEventListener('change',callback);};
}
function snapshot(){
 const device=navigator as Navigator&{deviceMemory?:number;connection?:{saveData?:boolean}};
 if(window.matchMedia(motionQuery).matches)return 'still';
 return window.matchMedia(lightQuery).matches||device.connection?.saveData||(device.deviceMemory&&device.deviceMemory<=4)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4)?'light':'full';
}
const serverSnapshot=()=> 'still';
const curves=[
 ['M -160 240 C 220 -80 480 420 840 190 C 1150 -30 1340 210 1760 100','M -160 170 C 240 420 490 -90 840 240 C 1160 450 1370 -80 1760 220','M -160 330 C 200 60 480 260 840 130 C 1130 -100 1360 360 1760 70'],
 ['M -160 620 C 260 160 470 850 850 430 C 1160 90 1330 650 1760 350','M -160 460 C 250 900 500 150 850 550 C 1170 850 1350 200 1760 500','M -160 700 C 200 400 500 660 850 340 C 1130 110 1360 720 1760 410'],
 ['M -160 900 C 210 540 520 1140 880 770 C 1170 450 1390 950 1760 720','M -160 740 C 260 1120 490 530 880 860 C 1160 1120 1360 490 1760 840','M -160 980 C 200 690 540 930 880 670 C 1150 420 1410 1100 1760 700'],
];

export default function LivingWaves(){
 const mode=useSyncExternalStore(subscribe,snapshot,serverSnapshot);
 const gradient=useId();
 const count=mode==='full'?3:2;
 const moving=mode!=='still';
 return <svg className={styles.flow} viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false" data-motion={mode}>
  <defs><linearGradient id={gradient} x1="0" y1="0" x2="1600" y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="#00b7c9" stopOpacity="0"/><stop offset=".22" stopColor="#00d5e5"/><stop offset=".65" stopColor="#67edfa"/><stop offset="1" stopColor="#00a6bc" stopOpacity="0"/></linearGradient></defs>
  {curves.slice(0,count).map((frames,index)=>{
   const values=[...frames,frames[0]].join(';');
   const duration=(mode==='light'?30:20)+index*5;
   const morph=moving?<animate attributeName="d" values={values} dur={`${duration}s`} repeatCount="indefinite" calcMode="spline" keyTimes="0;.333;.667;1" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1"/>:null;
   return <g key={index} fill="none" stroke={`url(#${gradient})`} strokeLinecap="round">
    <path d={frames[0]} strokeWidth="22" opacity=".045">{morph}</path>
    <path d={frames[0]} strokeWidth="1.6" opacity=".45" data-wave-curve="true">{morph}</path>
    <path d={frames[0]} strokeWidth="2.4" strokeDasharray="90 1500" opacity=".65">{morph}{moving?<animate attributeName="stroke-dashoffset" from="1590" to="-1590" dur={`${12+index*3}s`} repeatCount="indefinite"/>:null}</path>
   </g>;
  })}
 </svg>;
}
