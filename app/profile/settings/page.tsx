import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ProfileForm from '@/components/auth/ProfileForm';
import { profileSchema } from '@/lib/profile';
import LocalizedText from '@/components/shared/LocalizedText';

export const dynamic = 'force-dynamic';

export default async function ProfileSettingsPage() {
    const client = await createClient();
    if (!client) redirect('/sign-in');
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) redirect('/sign-in');
    const { data, error: profileError } = await client.from('profiles').select('nickname,region,telegram,vk').eq('id', user.id).maybeSingle();
    if (profileError) return <section className="mx-auto max-w-xl p-8"><h1 className="text-3xl font-bold">DEAF|HUB</h1><p role="alert" className="mt-4 text-red-300"><LocalizedText ru="Не удалось загрузить профиль. Попробуйте позже." en="Your profile could not be loaded. Please try again later." /></p></section>;
    const parsed = profileSchema.safeParse(data);
    const initial = parsed.success ? parsed.data : { nickname: '', region: 'europe' as const, telegram: '', vk: '' };
    return <section className="mx-auto w-full max-w-3xl px-4 py-12">
        <p className="text-xs font-bold tracking-[0.3em] text-[#22D3EE]"><LocalizedText ru="НАСТРОЙКИ ПРОФИЛЯ" en="PROFILE SETTINGS" /></p>
        <h1 className="mt-3 text-3xl font-black sm:text-5xl"><LocalizedText ru="Настройки профиля" en="Profile settings" /></h1>
        <div className="mt-8 rounded-3xl border border-white/10 bg-[#0D131A] p-6 sm:p-8"><ProfileForm initial={initial} /></div>
        <Link href="/profile" className="mt-6 inline-block text-sm text-[#22D3EE]">← <LocalizedText ru="Личный кабинет" en="Player account" /></Link>
    </section>;
}

