import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { profileSchema } from '@/lib/profile';

export async function PUT(request: NextRequest) {
    const origin = request.headers.get('origin');
    if (!origin || origin !== request.nextUrl.origin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const client = await createClient();
    if (!client) return NextResponse.json({ error: 'Unavailable' }, { status: 503 });
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const parsed = profileSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid profile' }, { status: 400 });
    const { error } = await client.from('profiles').upsert({ id: user.id, ...parsed.data });
    if (error) return NextResponse.json({ error: 'Could not save profile' }, { status: 500 });
    return NextResponse.json({ saved: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}
