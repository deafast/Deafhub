import {notFound} from 'next/navigation';
import Preview from './Preview';
export const dynamic='force-dynamic';
export default function Page(){
 if(process.env.VERCEL_ENV!=='preview'&&process.env.NODE_ENV!=='development')notFound();
 return <Preview/>;
}
