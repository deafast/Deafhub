import { notFound } from 'next/navigation';
import TournamentDemo from './TournamentDemo';
export const dynamic = 'force-dynamic';
export default function Page() {
 if(process.env.VERCEL_ENV !== 'preview' && process.env.NODE_ENV !== 'development') notFound();
 return <TournamentDemo/>;
}
