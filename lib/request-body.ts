type BoundedBody<T> = { tooLarge: true } | { tooLarge: false; value: T | null };

export function declaredBodyTooLarge(request: Pick<Request, 'headers'>, maxBytes: number) {
    return Number(request.headers.get('content-length')) > maxBytes;
}

// Content-Length is only an early hint. Bound the actual bytes before decoding or parsing.
export async function readBoundedBytes(request: Request, maxBytes: number): Promise<BoundedBody<Uint8Array<ArrayBuffer>>> {
    if (declaredBodyTooLarge(request, maxBytes)) return { tooLarge: true };
    const reader = request.body?.getReader();
    if (!reader) return { tooLarge: false, value: null };
    try {
        const bytes = new Uint8Array(maxBytes);
        let length = 0;
        for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value.byteLength > maxBytes - length) {
                // A sender must not delay the 413 response by keeping cancellation pending.
                void reader.cancel().catch(() => {});
                return { tooLarge: true };
            }
            bytes.set(value, length);
            length += value.byteLength;
        }
        return { tooLarge: false, value: bytes.subarray(0, length) };
    } catch {
        return { tooLarge: false, value: null };
    } finally {
        reader.releaseLock();
    }
}

export async function readBoundedJson(request: Request, maxBytes: number): Promise<BoundedBody<unknown>> {
    const body = await readBoundedBytes(request, maxBytes);
    if (body.tooLarge || !body.value) return body;
    try {
        return { tooLarge: false, value: JSON.parse(new TextDecoder().decode(body.value)) };
    } catch {
        return { tooLarge: false, value: null };
    }
}
