import EmailAuth from '@/components/auth/EmailAuth';

export default function ResetPasswordPage() {
    return <section className="mx-auto my-12 w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-white/10 bg-popover p-6 sm:p-8">
        <h1 className="mb-6 text-2xl font-bold">DEAF<span className="text-primary">|</span>HUB</h1>
        <EmailAuth reset />
    </section>;
}
