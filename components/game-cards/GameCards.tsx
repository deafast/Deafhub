"use client";

import { GameCard, type GameCardProps } from "./GameCard";
import { defaultGameCards } from "./cards.data";
import type { GameCardData } from "./types";
import styles from "./GameCards.module.css";

export interface GameCardsProps {
  cards?: GameCardData[];
  className?: string;
  physics?: GameCardProps["physics"];
  assetPrefix?: string;
  onSelect?: GameCardProps["onSelect"];
  /** Подпись для скринридеров. */
  ariaLabel?: string;
}

/**
 * Блок из интерактивных карточек игр DeafHub.
 * Desktop — веер с 3D-наклоном и перетаскиванием мышью.
 * Mobile — горизонтальная лента с прокруткой; удержание пальца ~0.2 c включает перетаскивание.
 */
export function GameCards({
  cards = defaultGameCards,
  className,
  physics,
  assetPrefix,
  onSelect,
  ariaLabel = "Игровые дисциплины DeafHub",
}: GameCardsProps) {
  return (
    <section
      className={[styles.root, className].filter(Boolean).join(" ")}
      aria-label={ariaLabel}
    >
      <div className={styles.track}>
        {cards.map((card, i) => (
          <GameCard
            key={card.id}
            card={card}
            index={i}
            physics={physics}
            assetPrefix={assetPrefix}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}

export default GameCards;
