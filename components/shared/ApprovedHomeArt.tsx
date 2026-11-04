import { approvedScene as scene } from './approved-home-scene';
import styles from './BrandPreview.module.css';

/** Only native SVG cropping/masking; source faces, outfits and poses are not redrawn. */
export default function ApprovedHomeArt({ id }: { id: string }) {
 const topFade = 'approved-top-'+id;
 const sideFade = 'approved-side-'+id;
 const mask = 'approved-art-'+id;
 return <svg className={styles.art} viewBox={'0 '+scene.top+' '+scene.width+' '+(scene.bottom-scene.top)} preserveAspectRatio="xMidYMin meet" aria-hidden="true">
  <defs>
   <linearGradient id={topFade} x1="0" y1="55" x2="0" y2="510" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="white"/><stop offset=".86" stopColor="white"/><stop offset="1" stopColor="black"/></linearGradient>
   <linearGradient id={sideFade} x1="0" y1="55" x2="0" y2="780" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="white"/><stop offset=".8" stopColor="white"/><stop offset="1" stopColor="black"/></linearGradient>
   <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="55" width={scene.width} height={scene.bottom-scene.top}>
    <rect x="0" y="55" width={scene.width} height={scene.bottom-scene.top} fill={'url(#'+topFade+')'}/>
    <rect x="0" y="55" width="410" height="725" fill={'url(#'+sideFade+')'}/>
    <rect x="1160" y="55" width="426" height="725" fill={'url(#'+sideFade+')'}/>
   </mask>
  </defs>
  <image href={scene.src} width={scene.width} height={scene.height} mask={'url(#'+mask+')'}/>
 </svg>;
}
