import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return null;
    const jar = await cookies();
    return createServerClient(url, key, {
        cookies: {
            getAll: () => jar.getAll(),
            setAll(values) {
                try {
                    values.forEach(({ name, value, options }) => jar.set(name, value, options));
                } catch {
                    // Server Components cannot write cookies; proxy handles refresh.
                }
            },
        },
    });
}
