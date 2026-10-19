import type { Result } from './engine';

export function readMatchResult(values: FormData): Result {
    const loser = String(values.get('forfeit') || '');
    if (loser) return { kind: 'forfeit', loser };
    const a = Number(values.get('a')), b = Number(values.get('b'));
    const penaltyA = values.get('penalties_a'), penaltyB = values.get('penalties_b');
    const hasA = penaltyA !== null && penaltyA !== '', hasB = penaltyB !== null && penaltyB !== '';
    if (hasA !== hasB) throw new Error('Enter both penalty scores');
    return { kind: 'played', a, b, ...(hasA && hasB ? { penalties: { a: Number(penaltyA), b: Number(penaltyB) } } : {}) };
}
