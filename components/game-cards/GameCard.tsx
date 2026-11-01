"use client";

import type { CSSProperties, MouseEvent, Ref } from "react";
import { useCardPhysics, type CardPhysicsOptions } from "./useCardPhysics";
import type { GameCardData } from "./types";
import styles from "./GameCards.module.css";

export interface GameCardProps {
  card: GameCardData;
  index?: number;
  physics?: CardPhysicsOptions;
  /** Префикс путей к картинкам (если сайт развёрнут не в корне домена). */
  assetPrefix?: string;
  /** Обработчик клика вместо перехода по href (например, router.push). */
  onSelect?: (card: GameCardData) => void;
}

const PARTICLES = 14;

export function GameCard({
  card,
  index = 0,
  physics,
  assetPrefix = "",
  onSelect,
}: GameCardProps) {
  const { ref, draggedRef } = useCardPhysics<HTMLElement>(physics);
  const { art, logo } = card;

  const slotStyle = {
    "--rest-rotate": `${card.restRotate ?? 0}deg`,
    "--accent": card.accent ?? "#22d3ee",
    "--i": index,
  } as CSSProperties;

  const artStyle = {
    "--art-w": `${art.widthPct}%`,
    "--art-b": `${art.bottomPct}%`,
    "--art-x": `${art.offsetXPct ?? 0}%`,
  } as CSSProperties;

  const handleClick = (e: MouseEvent) => {
    // Клик после перетаскивания не должен открывать ссылку.
    if (draggedRef.current) {
      e.preventDefault();
      draggedRef.current = false;
      return;
    }
    if (onSelect) {
      e.preventDefault();
      onSelect(card);
    }
  };

  const label = [card.kicker, card.title, card.titleAccent]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");

  const inner = (
    <>
      <span className={styles.groundGlow} aria-hidden />
      <span className={styles.frame} aria-hidden>
        <span className={styles.bgLayer} />
        <span className={styles.bgLights} />
        <span className={styles.particles}>
          {Array.from({ length: PARTICLES }, (_, i) => (
            <i key={i} style={{ "--p": i } as CSSProperties} />
          ))}
        </span>
        <span className={styles.vignette} />
      </span>

      <span className={styles.border} aria-hidden />

      {/* Персонаж, логотип и текст — единый слой: двигаются строго вместе. */}
      <span className={styles.art} style={artStyle}>
        <picture className={styles.hero}>
          <source srcSet={assetPrefix + art.src} type="image/webp" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetPrefix + (art.fallbackSrc ?? art.src)}
            alt={art.alt}
            draggable={false}
            decoding="async"
            fetchPriority={index === 0 ? "high" : "auto"}
          />
        </picture>
        <span className={styles.shade} aria-hidden />

        <span className={styles.content}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={styles.logo}
              src={assetPrefix + logo.src}
              alt={logo.alt}
              draggable={false}
              style={{ width: `${logo.widthPct ?? 78}%` }}
            />
          ) : (
            <span className={styles.title} aria-hidden>
              {card.kicker && <span className={styles.kicker}>{card.kicker}</span>}
              <span className={styles.titleMain}>
                {card.title}
                {card.titleAccent && (
                  <span className={styles.titleAccent}>{card.titleAccent}</span>
                )}
              </span>
            </span>
          )}
          <span className={styles.bar} aria-hidden />
          <span className={styles.tags}>
            {card.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </span>
        </span>
      </span>

      <span className={styles.glare} aria-hidden />
    </>
  );

  return (
    <div className={styles.slot} style={slotStyle}>
      {card.href ? (
        <a
          ref={ref as Ref<HTMLAnchorElement>}
          data-card-root=""
          className={`${styles.card} ${styles[`theme_${card.theme}`]}`}
          href={card.href}
          aria-label={label}
          onClick={handleClick}
          draggable={false}
        >
          {inner}
        </a>
      ) : (
        <article
          ref={ref as Ref<HTMLElement>}
          data-card-root=""
          className={`${styles.card} ${styles[`theme_${card.theme}`]}`}
          aria-label={label}
          tabIndex={0}
          onClick={handleClick}
        >
          {inner}
        </article>
      )}
    </div>
  );
}
