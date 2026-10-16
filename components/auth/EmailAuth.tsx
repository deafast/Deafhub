'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Mode = 'login' | 'signup' | 'forgot' | 'reset';

export default function EmailAuth({ reset = false, disabled = false, onPendingChange }: {
    reset?: boolean;
    disabled?: boolean;
    onPendingChange?: (pending: boolean) => void;
}) {
    const ru = useLanguageStore(s => s.language === 'ru');
    const router = useRouter();
    const id = useId();
    const [mode, setMode] = useState<Mode>(reset ? 'reset' : 'login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [visible, setVisible] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [canReset, setCanReset] = useState(false);
    const [resetDone, setResetDone] = useState(false);
    const locked = disabled || pending;

    useEffect(() => {
        if (!reset) return;
        let active = true;
        const client = createClient();
        if (client) void client.auth.getUser().then(({ data, error }) => {
            if (active) setCanReset(!error && Boolean(data.user));
        }).catch(() => {});
        return () => { active = false; };
    }, [reset]);

    function changeMode(next: Mode) {
        setMode(next);
        setPassword('');
        setConfirmation('');
        setVisible(false);
        setError('');
        setMessage('');
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (locked || (mode === 'reset' && (!canReset || resetDone))) return;
        setError('');
        setMessage('');
        if ((mode === 'signup' || mode === 'reset') && password !== confirmation) {
            setError(ru ? 'Пароли не совпадают.' : 'Passwords do not match.');
            return;
        }
        const client = createClient();
        if (!client) {
            setError(ru ? 'Вход временно недоступен.' : 'Sign-in is temporarily unavailable.');
            return;
        }
        setPending(true);
        onPendingChange?.(true);
        try {
            const callback = `${window.location.origin}/auth/callback`;
            if (mode === 'forgot') {
                const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${callback}?flow=recovery` });
                if (error) throw error;
                setMessage(ru ? 'Если для этой почты доступно восстановление, вы получите письмо со ссылкой. Проверьте также папку «Спам».' : 'If password recovery is available for this email, you will receive a link. Please also check spam.');
            } else if (mode === 'signup') {
                const { data, error } = await client.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: callback } });
                if (error) throw error;
                setPassword('');
                setConfirmation('');
                if (data.session) finishSignIn();
                else setMessage(ru ? 'Проверьте почту и подтвердите адрес по ссылке из письма. Если аккаунт уже существует, войдите или восстановите пароль.' : 'Check your email to confirm your address. If you already have an account, sign in or reset your password.');
            } else if (mode === 'reset') {
                const { error } = await client.auth.updateUser({ password });
                if (error) throw error;
                setPassword('');
                setConfirmation('');
                setResetDone(true);
                setMessage(ru ? 'Пароль изменён. Теперь можно войти с новым паролем.' : 'Password updated. You can now sign in with your new password.');
                await client.auth.signOut();
            } else {
                const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
                if (error) throw error;
                setPassword('');
                finishSignIn();
            }
        } catch (caught) {
            const code = typeof caught === 'object' && caught !== null && 'code' in caught ? String(caught.code) : '';
            if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') setError(ru ? 'Слишком много попыток. Повторите позже.' : 'Too many attempts. Please try again later.');
            else if (code === 'email_address_not_authorized') setError(ru ? 'Отправка писем на этот адрес пока недоступна в тестовой версии.' : 'Email delivery to this address is not available in this preview yet.');
            else if (code === 'weak_password') setError(ru ? 'Выберите более надёжный пароль.' : 'Please choose a stronger password.');
            else if (mode === 'login') setError(ru ? 'Не удалось войти. Проверьте почту, пароль и подтверждение адреса.' : 'Could not sign in. Check your email, password and email confirmation.');
            else setError(ru ? 'Не удалось выполнить запрос. Повторите попытку позже.' : 'Could not complete the request. Please try again later.');
        } finally {
            setPending(false);
            onPendingChange?.(false);
        }
    }

    function finishSignIn() {
        window.dispatchEvent(new Event('deafhub:auth-complete'));
        router.replace('/profile');
        router.refresh();
    }

    const newPassword = mode === 'signup' || mode === 'reset';
    const label = mode === 'signup' ? (ru ? 'Создать аккаунт' : 'Create account') : mode === 'forgot' ? (ru ? 'Отправить ссылку' : 'Send reset link') : mode === 'reset' ? (ru ? 'Сохранить пароль' : 'Save password') : (ru ? 'Войти' : 'Sign in');
    return <div className="grid gap-4">
        {mode === 'forgot' ? <p className="text-sm leading-6 text-white/60">{ru ? 'Укажите почту аккаунта DeafHub. Отправим ссылку для создания нового пароля.' : 'Enter your DeafHub account email. We will send a password reset link.'}</p> : null}
        {(mode === 'signup' || mode === 'forgot') ? <p className="text-xs leading-5 text-white/45">{ru ? 'Тестовая версия: отправка писем доступна только разрешённым адресам.' : 'Preview: emails can only be sent to approved addresses.'}</p> : null}
        {mode === 'signup' ? <p className="text-sm text-white/60">{ru ? 'Создайте аккаунт DeafHub по электронной почте.' : 'Create your DeafHub account with email.'}</p> : null}
        {reset && !canReset && !resetDone ? <p role="status" className="text-sm leading-6 text-white/60">{ru ? 'Для смены пароля откройте действующую ссылку из письма в браузере, где запросили восстановление.' : 'To reset your password, open a valid email link in the browser where you requested it.'}</p> : null}
        {!resetDone ? <form onSubmit={submit} className="grid gap-4" aria-label={label}>
            {mode !== 'reset' ? <div className="grid gap-2">
                <label htmlFor={`${id}-email`} className="text-sm text-white/75">{ru ? 'Электронная почта' : 'Email'}</label>
                <div className="relative"><Mail aria-hidden="true" className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-white/40" /><Input id={`${id}-email`} name="email" type="email" autoComplete="email" required maxLength={254} placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={locked} className="h-11 rounded-[10px] bg-transparent pl-10" /></div>
            </div> : null}
            {mode !== 'forgot' ? <div className="grid gap-2">
                <label htmlFor={`${id}-password`} className="text-sm text-white/75">{newPassword ? (ru ? 'Новый пароль' : 'New password') : (ru ? 'Пароль' : 'Password')}</label>
                <div className="relative"><LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-white/40" /><Input id={`${id}-password`} name="password" type={visible ? 'text' : 'password'} autoComplete={newPassword ? 'new-password' : 'current-password'} required minLength={newPassword ? 12 : undefined} maxLength={128} placeholder={ru ? (newPassword ? 'Не менее 12 символов' : 'Введите пароль') : (newPassword ? 'At least 12 characters' : 'Enter password')} value={password} onChange={e => setPassword(e.target.value)} disabled={locked} className="h-11 rounded-[10px] bg-transparent pl-10 pr-11" /><button type="button" disabled={locked} onClick={() => setVisible(v => !v)} aria-label={visible ? (ru ? 'Скрыть пароль' : 'Hide password') : (ru ? 'Показать пароль' : 'Show password')} aria-pressed={visible} className="absolute right-1 top-0 flex size-11 items-center justify-center rounded-lg text-white/45 hover:text-white focus-visible:outline-2 focus-visible:outline-[#22D3EE]">{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>
            </div> : null}
            {newPassword ? <div className="grid gap-2"><label htmlFor={`${id}-confirmation`} className="text-sm text-white/75">{ru ? 'Повторите пароль' : 'Confirm password'}</label><Input id={`${id}-confirmation`} name="password-confirmation" type={visible ? 'text' : 'password'} autoComplete="new-password" required minLength={12} maxLength={128} value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={locked} className="h-11 rounded-[10px] bg-transparent" /></div> : null}
            {mode === 'login' ? <button type="button" onClick={() => changeMode('forgot')} disabled={locked} className="justify-self-end text-xs text-[#22D3EE] hover:underline disabled:opacity-50">{ru ? 'Забыли пароль?' : 'Forgot password?'}</button> : null}
            <Button type="submit" disabled={locked || (reset && !canReset)} className="h-11 w-full rounded-[10px] bg-[#22D3EE] font-semibold text-[#0A0F14] hover:bg-[#67E8F9]">{pending ? (ru ? 'Подождите…' : 'Please wait…') : label}</Button>
        </form> : null}
        {error ? <p role="alert" className="text-sm leading-5 text-red-300">{error}</p> : null}
        {message ? <p role="status" className="text-sm leading-6 text-[#A5F3FC]">{message}</p> : null}
        {!reset ? <p className="text-center text-xs text-white/50">{mode === 'login' ? (ru ? 'Нет аккаунта? ' : 'No account? ') : mode === 'signup' ? (ru ? 'Уже есть аккаунт? ' : 'Already registered? ') : ''}<button type="button" onClick={() => changeMode(mode === 'login' ? 'signup' : 'login')} disabled={locked} className="text-[#22D3EE] hover:underline disabled:opacity-50">{mode === 'login' ? (ru ? 'Регистрация' : 'Sign up') : (ru ? 'Вернуться ко входу' : 'Back to sign in')}</button></p> : <a href="/sign-in" className="text-center text-sm text-[#22D3EE] hover:underline">{ru ? 'Вернуться ко входу' : 'Back to sign in'}</a>}
    </div>;
}
