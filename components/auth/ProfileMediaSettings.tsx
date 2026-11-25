'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import ProfileMediaImage from './ProfileMediaImage';
import { useLanguageStore } from '@/store/useLanguageStore';
import {
    maxProfileMediaBytes, profileMediaKinds, profileMediaTypes, profileMediaUrl, type ProfileMediaKind,
} from '@/lib/profile-media';

type Notice = 'size' | 'type' | 'invalid' | 'failed' | 'saved' | 'removed';
const uploadErrors: Partial<Record<number, Notice>> = { 413: 'size', 415: 'type', 422: 'invalid' };

function MediaField({ kind, ru }: { kind: ProfileMediaKind; ru: boolean }) {
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState<Notice>();
    const [loaded, setLoaded] = useState(false);
    const [revision, setRevision] = useState(0);
    const changing = useRef(false);
    const t = (r: string, e: string) => ru ? r : e;
    const label = kind === 'avatar' ? t('Аватар', 'Avatar') : t('Баннер', 'Banner');
    const url = profileMediaUrl(kind);

    async function change(file?: File) {
        if (changing.current) return;
        if (file && file.size > maxProfileMediaBytes) return setNotice('size');
        if (file && !profileMediaTypes.some(type => type === file.type)) return setNotice('type');
        changing.current = true;
        setBusy(true);
        setNotice(undefined);
        try {
            const result = file
                ? await fetch(url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
                : await fetch(url, { method: 'DELETE' });
            if (result.ok) {
                setLoaded(false);
                setRevision(value => value + 1);
                setNotice(file ? 'saved' : 'removed');
            } else {
                setNotice(uploadErrors[result.status] ?? 'failed');
            }
        } catch {
            setNotice('failed');
        } finally {
            changing.current = false;
            setBusy(false);
        }
    }

    function pick(event: ChangeEvent<HTMLInputElement>) {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = '';
        if (file) void change(file);
    }

    const messages: Record<Notice, string> = {
        size: t('Размер файла должен быть не больше 3 МБ.', 'Choose a file that is 3 MB or smaller.'),
        type: t('Выберите статичное изображение JPG, PNG или WebP.', 'Choose a still JPG, PNG or WebP image.'),
        invalid: t('Не удалось прочитать изображение. Выберите другой файл.', 'Could not read the image. Choose another file.'),
        failed: t('Не удалось обновить изображение. Попробуйте позже.', 'Could not update the image. Try again later.'),
        saved: t('Изображение сохранено.', 'Image saved.'),
        removed: t('Изображение удалено.', 'Image removed.'),
    };
    const success = notice === 'saved' || notice === 'removed';

    return <fieldset disabled={busy} className="min-w-0 space-y-2" aria-busy={busy}>
        <legend className="font-medium">{label}</legend>
        <div className={`relative overflow-hidden bg-white/5 ${kind === 'avatar' ? 'size-16 rounded-full' : 'h-24 rounded-2xl'}`}>
            <ProfileMediaImage kind={kind} revision={revision} loaded={loaded} onLoaded={setLoaded} className="absolute inset-0 size-full object-cover" />
        </div>
        <input type="file" accept={profileMediaTypes.join(',')} aria-label={label} onChange={pick}
            className="block w-full text-sm file:mr-2 file:min-h-11 file:max-w-full file:rounded-2xl file:border-0 file:bg-white/10 file:px-3 file:text-foreground" />
        {loaded ? <Button type="button" variant="outline" className="min-h-11 rounded-2xl"
            aria-label={kind === 'avatar' ? t('Удалить аватар', 'Remove avatar') : t('Удалить баннер', 'Remove banner')}
            onClick={() => void change()}>{t('Удалить', 'Remove')}</Button> : null}
        {busy ? <p role="status" className="text-sm">{t('Сохранение…', 'Saving…')}</p> : null}
        {notice ? <p role={success ? 'status' : 'alert'} className={success ? 'text-sm text-primary' : 'text-sm text-red-300'}>{messages[notice]}</p> : null}
    </fieldset>;
}

export default function ProfileMediaSettings() {
    const ru = useLanguageStore(state => state.language === 'ru');
    return <section className="mt-6 rounded-3xl border border-white/10 bg-popover p-6 sm:p-8" aria-labelledby="profile-media-heading">
        <h2 id="profile-media-heading" className="text-lg font-semibold">{ru ? 'Изображения профиля' : 'Profile images'}</h2>
        <p className="mb-4 mt-1 text-sm text-white/60">{ru ? 'JPG, PNG или WebP до 3 МБ. Изображения видны только вам.' : 'JPG, PNG or WebP up to 3 MB. Only you can see these images.'}</p>
        <div className="grid gap-6 sm:grid-cols-2">
            {profileMediaKinds.map(kind => <MediaField key={kind} kind={kind} ru={ru} />)}
        </div>
    </section>;
}
