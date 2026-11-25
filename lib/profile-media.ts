export const profileMediaKinds = ['avatar', 'banner'] as const;
export type ProfileMediaKind = typeof profileMediaKinds[number];

export const maxProfileMediaBytes = 3 * 1024 * 1024;
export const profileMediaTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;

export function profileMediaUrl(kind: ProfileMediaKind) {
    return `/api/profile/media/${kind}`;
}
