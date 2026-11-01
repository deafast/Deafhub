export type CardTheme = "dota" | "cs" | "fc";

export interface GameCardLogo {
  /** Путь к официальному логотипу игры (SVG/PNG/WebP с прозрачностью). */
  src: string;
  alt: string;
  /** Ширина логотипа в процентах от ширины карточки (по умолчанию 78). */
  widthPct?: number;
}

export interface GameCardArt {
  /** Изображение персонажа с прозрачным фоном. */
  src: string;
  /** Запасной PNG для старых браузеров (необязательно). */
  fallbackSrc?: string;
  alt: string;
  /** Ширина персонажа в % от ширины карточки. */
  widthPct: number;
  /** Отступ нижнего края персонажа от низа карточки, % высоты карточки. */
  bottomPct: number;
  /** Горизонтальный сдвиг центра персонажа, % ширины карточки (0 = по центру). */
  offsetXPct?: number;
}

export interface GameCardData {
  id: string;
  theme: CardTheme;
  /** Текстовое название — показывается, если logo не задан, и используется как aria-label. */
  title: string;
  /** Вторая строка названия (например «2» или «FC»). */
  titleAccent?: string;
  /** Маленькая надпись над названием (например «EA SPORTS»). */
  kicker?: string;
  logo?: GameCardLogo;
  art: GameCardArt;
  /** Три строки-тезиса внизу карточки. */
  tags: string[];
  /** Ссылка при клике (клик после перетаскивания не срабатывает). */
  href?: string;
  /** Неоновый цвет акцентной полосы и подсветки. */
  accent?: string;
  /** Поворот карточки в покое, градусы (веер как в оригинале). */
  restRotate?: number;
}
