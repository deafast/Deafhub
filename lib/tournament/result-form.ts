import type { Result } from './engine';

function isScore(value: FormDataEntryValue | null): value is string {
    return typeof value === 'string' && value.trim() !== ''
        && Number.isSafeInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 1000;
}

export function readMatchResult(values: FormData): Result {
    const loser = String(values.get('forfeit') || '');
    if (loser) return { kind: 'forfeit', loser };
    const scoreA = values.get('a'), scoreB = values.get('b');
    if (!isScore(scoreA) || !isScore(scoreB)) throw new Error('Invalid score');
    const a = Number(scoreA), b = Number(scoreB);
    const penaltyA = values.get('penalties_a'), penaltyB = values.get('penalties_b');
    const hasA = penaltyA !== null && (typeof penaltyA !== 'string' || penaltyA.trim() !== ''), hasB = penaltyB !== null && (typeof penaltyB !== 'string' || penaltyB.trim() !== '');
    if (hasA !== hasB) throw new Error('Enter both penalty scores');
    if (hasA && hasB && (!isScore(penaltyA) || !isScore(penaltyB))) throw new Error('Invalid penalty shootout');
    return { kind: 'played', a, b, ...(hasA && hasB ? { penalties: { a: Number(penaltyA), b: Number(penaltyB) } } : {}) };
}
