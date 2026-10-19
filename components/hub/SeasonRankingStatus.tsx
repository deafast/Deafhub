'use client';

export default function SeasonRankingStatus({ ru }: { ru: boolean }) {
    return <details className="rounded-2xl border border-white/10 bg-[#0D131A] p-5">
        <summary className="cursor-pointer font-bold focus-visible:outline-2 focus-visible:outline-[#22D3EE]">
            {ru ? 'Сезонный рейтинг' : 'Season rankings'}
        </summary>
        <p role="status" className="mt-4 text-sm leading-6 text-white/70">
            {ru
                ? 'Рейтинг пока не рассчитывается: формула сезона ещё не утверждена. Групповые очки и призовые места отдельных турниров не являются сезонным рейтингом.'
                : 'Season rankings are not calculated yet: the season formula has not been approved. Group points and individual tournament placements are not season rankings.'}
        </p>
    </details>;
}
