import EmailAuth from '@/components/auth/EmailAuth';

export default function ResetPasswordPage() {
    return <section className="mx-auto my-12 w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-white/10 bg-[#0D131A] p-6 sm:p-8">
        <h1 className="mb-6 text-2xl font-bold">DEAF<span className="text-[#22D3EE]">|</span>HUB</h1>
        <EmailAuth reset />
    </section>;
}
