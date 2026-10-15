import { z } from 'zod';

export const profileSchema = z.object({
    nickname: z.string().trim().min(2).max(30).regex(/^[\p{L}\p{N}_ .-]+$/u),
    region: z.enum(['europe', 'cis', 'other']),
    telegram: z.string().trim().max(32).regex(/^$|^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/),
    vk: z.string().trim().max(64).regex(/^$|^[a-zA-Z0-9_.]+$/),
});

export type PlayerProfile = z.infer<typeof profileSchema>;
