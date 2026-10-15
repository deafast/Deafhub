import { redirect } from 'next/navigation';
import PlayerDashboard from '@/components/auth/PlayerDashboard';
import { createClient } from '@/lib/supabase/server';

import { profileSchema } from '@/lib/profile';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
    const client = await createClient();
    if (!client) redirect('/sign-in');
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) redirect('/sign-in');
    const { data, error: profileError } = await client.from('profiles').select('nickname,region,telegram,vk').eq('id', user.id).maybeSingle();
    if (profileError) return <section className="mx-auto max-w-xl p-8"><h1 className="text-3xl font-bold">DEAF|HUB</h1><p role="alert" className="mt-4 text-red-300">Your profile could not be loaded. Please try again later.</p></section>;
    const parsed = profileSchema.safeParse(data);
    const initial = parsed.success ? parsed.data : { nickname: '', region: 'europe' as const, telegram: '', vk: '' };
    const { data: steam } = await client.from('steam_accounts').select('steam_id').eq('user_id', user.id).maybeSingle();
    return <PlayerDashboard steamId={steam?.steam_id || null} profile={initial} googleConnected={Boolean(user.identities?.some((identity) => identity.provider === 'google'))} />;
}

