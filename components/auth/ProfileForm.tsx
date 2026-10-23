'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguageStore } from '@/store/useLanguageStore';
import { profileSchema, type PlayerProfile } from '@/lib/profile';
import { Button } from '@/components/ui/button';

export default function ProfileForm({ initial }: { initial: PlayerProfile }) {
    const ru = useLanguageStore((state) => state.language === 'ru');
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [failed, setFailed] = useState(false);

    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const parsed = profileSchema.safeParse(Object.fromEntries(form));
        setMessage('');
        setFailed(false);
        if (!parsed.success) {
            setFailed(true);
            setMessage(ru ? 'Проверьте ник и контакты. Telegram — имя без ссылки, VK — короткий адрес страницы.' : 'Check your nickname and contacts. Enter Telegram and VK usernames, without links.');
            return;
        }
        setBusy(true);
        try {
            const result = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data) });
            if (!result.ok) throw new Error('Save failed');
            setMessage(ru ? 'Профиль сохранён.' : 'Profile saved.');
            router.refresh();
        } catch {
            setFailed(true);
            setMessage(ru ? 'Не удалось сохранить профиль. Попробуйте ещё раз.' : 'Could not save your profile. Please try again.');
        } finally { setBusy(false); }
    }

    const field = 'mt-2 block h-12 w-full rounded-2xl border border-white/15 bg-white/5 px-4 text-white outline-none focus:border-[#22D3EE]';
    return <form onSubmit={save} className="grid gap-6">
        <label className="text-sm">{ru ? 'Игровой ник' : 'Player nickname'}<input className={field} name="nickname" defaultValue={initial.nickname} minLength={2} maxLength={30} required autoComplete="nickname" /></label>
        <label className="text-sm">{ru ? 'Регион' : 'Region'}<select className={field} name="region" defaultValue={initial.region}>
            <option className="bg-[#0D131A]" value="europe">{ru ? 'Европа' : 'Europe'}</option>
            <option className="bg-[#0D131A]" value="cis">{ru ? 'СНГ' : 'CIS'}</option>
            <option className="bg-[#0D131A]" value="other">{ru ? 'Другой' : 'Other'}</option>
        </select></label>
        <label className="text-sm">Telegram<input className={field} name="telegram" defaultValue={initial.telegram} maxLength={33} placeholder="@username" autoComplete="off" /></label>
        <label className="text-sm">VK<input className={field} name="vk" defaultValue={initial.vk} maxLength={64} placeholder="username" autoComplete="off" /></label>
        <p className="text-xs leading-relaxed text-white/50">{ru ? 'Контакты видны только вам. Указание имени не подтверждает владение аккаунтом и не открывает доступ в группы капитанов.' : 'Contacts are private. Entering a username does not verify account ownership or grant access to captain groups.'}</p>
        <Button type="submit" disabled={busy} className="h-12 rounded-2xl bg-[#22D3EE] text-[#0A0F14]">{busy ? (ru ? 'Сохранение…' : 'Saving…') : (ru ? 'Сохранить профиль' : 'Save profile')}</Button>
        {message ? <p role={failed ? 'alert' : 'status'} className={failed ? 'text-sm text-red-300' : 'text-sm text-[#22D3EE]'}>{message}</p> : null}
    </form>;
}
