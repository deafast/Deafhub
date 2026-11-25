import { approvedScene } from '@/components/shared/approved-home-scene';
import BrandPreview from '@/components/shared/BrandPreview';

export default function HomePage(){return <><link rel="preload" as="image" href={approvedScene.src} fetchPriority="high"/><BrandPreview/></>;}
