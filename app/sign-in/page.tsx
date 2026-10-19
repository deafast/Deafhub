import LocalizedText from '@/components/shared/LocalizedText';
import AuthPanel from '@/components/auth/AuthPanel';

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const { error } = await searchParams;
    return <section className="mx-auto my-16 w-full max-w-md rounded-3xl border border-white/10 bg-[#0D131A] p-8">
        <h1 className="mb-6 text-3xl font-bold">DEAF<span className="text-[#22D3EE]">|</span>HUB</h1>
        {error ? <p role="alert" className="mb-4 text-sm text-red-300"><LocalizedText ru="Не удалось войти. Попробуйте ещё раз." en="Unable to sign in. Please try again." /></p> : null}
        <AuthPanel />
    </section>;
}
