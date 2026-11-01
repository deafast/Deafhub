import type { GameCardData } from "./types";

/**
 * Данные карточек. Пути — относительно папки /public Next.js.
 * Чтобы показать официальные логотипы, положите файлы в /public/deafhub/logos/
 * и раскомментируйте поле `logo` у нужной карточки.
 */
export const defaultGameCards: GameCardData[] = [
  {
    id: "dota2",
    theme: "dota",
    title: "DOTA",
    titleAccent: "2",
    // logo: { src: "/deafhub/logos/dota2.svg", alt: "Dota 2", widthPct: 80 },
    art: {
      src: "/deafhub/cards/dota2-hero.webp",
      fallbackSrc: "/deafhub/cards/dota2-hero.png",
      alt: "",
      widthPct: 124,
      bottomPct: 22,
      offsetXPct: -2,
    },
    tags: ["Стратегия", "Командная игра", "Большие возможности"],
    href: "/tournaments?game=dota2",
    accent: "#22d3ee",
    restRotate: -5,
  },
  {
    id: "cs2",
    theme: "cs",
    title: "COUNTER\nSTRIKE",
    titleAccent: "2",
    // logo: { src: "/deafhub/logos/cs2.svg", alt: "Counter-Strike 2", widthPct: 84 },
    art: {
      src: "/deafhub/cards/cs2-hero.webp",
      fallbackSrc: "/deafhub/cards/cs2-hero.png",
      alt: "",
      widthPct: 118,
      bottomPct: 23,
      offsetXPct: 4,
    },
    tags: ["Тактика", "Реакция", "Командный дух"],
    href: "/tournaments?game=cs2",
    accent: "#22d3ee",
    restRotate: 0,
  },
  {
    id: "fc",
    theme: "fc",
    kicker: "EA SPORTS",
    title: "FC",
    titleAccent: "27",
    // logo: { src: "/deafhub/logos/ea-fc.svg", alt: "EA SPORTS FC", widthPct: 82 },
    art: {
      src: "/deafhub/cards/fc-hero.webp",
      fallbackSrc: "/deafhub/cards/fc-hero.png",
      alt: "",
      widthPct: 100,
      bottomPct: 25,
      offsetXPct: -3,
    },
    tags: ["Футбол", "Сообщество", "Игра для каждого"],
    href: "/tournaments?game=fc",
    accent: "#22d3ee",
    restRotate: 5,
  },
];
