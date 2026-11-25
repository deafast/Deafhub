import { type NextRequest } from 'next/server';
import sharp from 'sharp';
import { createClient } from '@/lib/supabase/server';
import { declaredBodyTooLarge, readBoundedBytes } from '@/lib/request-body';
import { maxProfileMediaBytes, profileMediaKinds, profileMediaTypes } from '@/lib/profile-media';

const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
const bucket = 'profile-media';
const formats = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' } as const;

function failure(status: number) {
    return new Response(null, { status, headers });
}

async function handle(request: NextRequest, context: RouteContext<'/api/profile/media/[kind]'>) {
    const { kind } = await context.params;
    if (kind !== profileMediaKinds[0] && kind !== profileMediaKinds[1]) return failure(404);
    if (request.method !== 'GET' && request.headers.get('origin') !== request.nextUrl.origin) return failure(403);
    if (request.method === 'PUT' && declaredBodyTooLarge(request, maxProfileMediaBytes)) return failure(413);

    const client = await createClient();
    if (!client) return failure(503);
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return failure(401);

    const path = `${user.id}/${kind}.webp`;
    const storage = client.storage.from(bucket);
    if (request.method === 'GET') {
        const { data, error } = await storage.download(path);
        if (error) {
            const code = 'statusCode' in error ? error.statusCode : undefined;
            return failure(String(code) === '404' ? 404 : 503);
        }
        return new Response(data, { headers: { ...headers, 'Content-Type': 'image/webp' } });
    }
    if (request.method === 'DELETE') {
        const { error } = await storage.remove([path]);
        return failure(error ? 503 : 204);
    }

    const type = profileMediaTypes.find(value => value === request.headers.get('content-type'));
    if (!type) return failure(415);
    const body = await readBoundedBytes(request, maxProfileMediaBytes);
    if (body.tooLarge) return failure(413);
    if (!body.value?.byteLength) return failure(400);

    let output: Buffer;
    try {
        const image = sharp(body.value, { limitInputPixels: 16_000_000, failOn: 'warning' });
        const metadata = await image.metadata();
        if (metadata.format !== formats[type] || (metadata.pages ?? 1) > 1) return failure(415);
        const size = kind === 'avatar' ? 512 : 1920;
        output = await image.autoOrient().resize(size, kind === 'avatar' ? size : 900, {
            fit: 'inside',
            withoutEnlargement: true,
        }).webp({ quality: 85 }).toBuffer();
    } catch {
        return failure(422);
    }

    const { error } = await storage.upload(path, output, { contentType: 'image/webp', upsert: true });
    return failure(error ? 503 : 204);
}

export const GET = handle;
export const PUT = handle;
export const DELETE = handle;
