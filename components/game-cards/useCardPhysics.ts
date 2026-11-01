"use client";

import { useEffect, useRef } from "react";

/**
 * Пружинная физика карточки без сторонних библиотек.
 * Пишет CSS-переменные прямо в DOM-узел (без ре-рендеров React):
 *   --rx --ry   наклон, deg
 *   --tx --ty   смещение при перетаскивании, px
 *   --s         масштаб
 *   --gx --gy   позиция блика, %
 *   --go        прозрачность блика
 * И data-атрибуты: data-state="idle|hover|drag", data-returning.
 */

export interface CardPhysicsOptions {
  /** Максимальный наклон, градусы. */
  maxTilt?: number;
  /** Масштаб при наведении / перетаскивании. */
  hoverScale?: number;
  dragScale?: number;
  /** Задержка удержания пальца перед перетаскиванием на тач-устройствах, мс. */
  touchHoldMs?: number;
  disabled?: boolean;
}

interface Spring {
  v: number; // value
  vel: number;
  t: number; // target
}

const spring = (v = 0): Spring => ({ v, vel: 0, t: v });

function step(s: Spring, k: number, c: number, dt: number) {
  const a = -k * (s.v - s.t) - c * s.vel;
  s.vel += a * dt;
  s.v += s.vel * dt;
}

const rubber = (d: number, max: number) =>
  Math.sign(d) * max * (1 - Math.exp(-Math.abs(d) / max));

const settled = (s: Spring, eps = 0.01) =>
  Math.abs(s.v - s.t) < eps && Math.abs(s.vel) < eps;

export function useCardPhysics<T extends HTMLElement>(
  options: CardPhysicsOptions = {}
) {
  const ref = useRef<T | null>(null);
  const optsRef = useRef(options);
  optsRef.current = options;
  /** true, если последний жест был перетаскиванием — чтобы подавить клик. */
  const draggedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const S = {
      rx: spring(),
      ry: spring(),
      tx: spring(),
      ty: spring(),
      s: spring(1),
      gx: spring(50),
      gy: spring(30),
      go: spring(0),
    };

    let raf = 0;
    let last = 0;
    let state: "idle" | "hover" | "drag" = "idle";
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let lastMoveX = 0;
    let lastMoveT = 0;
    let velX = 0;
    let holdTimer: number | undefined;
    let touchArmed = false; // палец удерживается, перетаскивание разрешено
    let pendingTouch = false; // палец опущен, ждём удержания
    let rect = el.getBoundingClientRect();

    const o = () => ({
      maxTilt: reduceMotion ? 4 : optsRef.current.maxTilt ?? 14,
      hoverScale: reduceMotion ? 1.01 : optsRef.current.hoverScale ?? 1.035,
      dragScale: optsRef.current.dragScale ?? 1.06,
      touchHoldMs: optsRef.current.touchHoldMs ?? 220,
    });

    const write = () => {
      const st = el.style;
      st.setProperty("--rx", `${S.rx.v.toFixed(3)}deg`);
      st.setProperty("--ry", `${S.ry.v.toFixed(3)}deg`);
      st.setProperty("--tx", `${S.tx.v.toFixed(2)}px`);
      st.setProperty("--ty", `${S.ty.v.toFixed(2)}px`);
      st.setProperty("--s", S.s.v.toFixed(4));
      st.setProperty("--gx", `${S.gx.v.toFixed(2)}%`);
      st.setProperty("--gy", `${S.gy.v.toFixed(2)}%`);
      st.setProperty("--go", Math.max(0, Math.min(1, S.go.v)).toFixed(3));
    };

    const loop = (now: number) => {
      const frame = Math.min(0.05, (now - (last || now)) / 1000 || 1 / 60);
      last = now;
      const dragging = state === "drag";
      // Перетаскивание: жёсткая пружина (следует за курсором),
      // возврат: мягкая пружина с лёгким «перелётом».
      const kT = dragging ? 900 : 140;
      const cT = dragging ? 60 : 15;
      // Фиксированные подшаги 1/240 c — стабильно при любом FPS.
      const n = Math.max(1, Math.ceil(frame * 240));
      const dt = frame / n;
      for (let i = 0; i < n; i++) {
        step(S.tx, kT, cT, dt);
        step(S.ty, kT, cT, dt);
        step(S.rx, 210, 22, dt);
        step(S.ry, 210, 22, dt);
        step(S.s, 260, 24, dt);
        step(S.gx, 240, 30, dt);
        step(S.gy, 240, 30, dt);
        step(S.go, 160, 26, dt);
      }
      write();

      const done = Object.values(S).every((s) => settled(s));
      if (done && state !== "drag") {
        el.removeAttribute("data-returning");
        raf = 0;
        last = 0;
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const setState = (next: typeof state) => {
      state = next;
      el.dataset.state = next;
    };

    /** Наклон к точке под курсором. */
    const aimAt = (clientX: number, clientY: number) => {
      const { maxTilt } = o();
      const px = (clientX - rect.left) / rect.width;
      const py = (clientY - rect.top) / rect.height;
      const cx = Math.max(-0.5, Math.min(0.5, px - 0.5));
      const cy = Math.max(-0.5, Math.min(0.5, py - 0.5));
      S.ry.t = cx * 2 * maxTilt;
      S.rx.t = -cy * 2 * maxTilt;
      S.gx.t = Math.max(0, Math.min(100, px * 100));
      S.gy.t = Math.max(0, Math.min(100, py * 100));
    };

    const toRest = () => {
      S.rx.t = 0;
      S.ry.t = 0;
      S.tx.t = 0;
      S.ty.t = 0;
      S.s.t = 1;
      S.go.t = 0;
      S.gx.t = 50;
      S.gy.t = 30;
    };

    const refreshRect = () => {
      // rect без учёта текущего смещения, чтобы наклон не «плыл» при drag
      const r = el.getBoundingClientRect();
      rect = new DOMRect(r.left - S.tx.v, r.top - S.ty.v, r.width, r.height);
    };

    const beginDrag = () => {
      setState("drag");
      el.removeAttribute("data-returning");
      S.s.t = o().dragScale;
      S.go.t = 1;
      kick();
    };

    const onEnter = (e: PointerEvent) => {
      if (optsRef.current.disabled || reduceMotion || e.pointerType === "touch") return;
      refreshRect();
      if (state === "idle") setState("hover");
      S.s.t = o().hoverScale;
      S.go.t = 0.85;
      aimAt(e.clientX, e.clientY);
      kick();
    };

    const onMove = (e: PointerEvent) => {
      if (optsRef.current.disabled || reduceMotion) return;
      if (state === "drag" && e.pointerId === pointerId) {
        const now = performance.now();
        const dtm = Math.max(1, now - lastMoveT);
        velX = velX * 0.6 + ((e.clientX - lastMoveX) / dtm) * 0.4;
        lastMoveX = e.clientX;
        lastMoveT = now;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        // На тач-экранах карточка в ленте: «резиновое» ограничение смещения.
        S.tx.t = e.pointerType === "touch" ? rubber(dx, 70) : dx;
        S.ty.t = e.pointerType === "touch" ? rubber(dy, 36) : dy;
        // При перетаскивании карточка «тянется» за рукой: наклон по скорости.
        const { maxTilt } = o();
        S.ry.t = Math.max(-maxTilt, Math.min(maxTilt, velX * 9));
        S.rx.t = Math.max(-maxTilt, Math.min(maxTilt, -(e.clientY - startY) * 0.04));
        S.gx.t = 50 + Math.max(-40, Math.min(40, velX * 30));
        kick();
        return;
      }
      if (pendingTouch && e.pointerId === pointerId) {
        // Палец двигается до удержания — это прокрутка страницы, не drag.
        if (Math.hypot(e.clientX - startX, e.clientY - startY) > 8) cancelTouchHold();
        else aimAt(e.clientX, e.clientY);
        kick();
        return;
      }
      if (pointerId !== null && e.pointerId === pointerId && state !== "drag") {
        // Мышь зажата: начинаем drag после порога 3px.
        if (Math.hypot(e.clientX - startX, e.clientY - startY) > 3) {
          draggedRef.current = true;
          beginDrag();
          onMove(e);
        }
        return;
      }
      if (e.pointerType !== "touch" && state === "hover") {
        aimAt(e.clientX, e.clientY);
        kick();
      }
    };

    const cancelTouchHold = () => {
      window.clearTimeout(holdTimer);
      pendingTouch = false;
      touchArmed = false;
      pointerId = null;
      setState("idle");
      toRest();
      kick();
    };

    const onDown = (e: PointerEvent) => {
      if (optsRef.current.disabled || reduceMotion) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      refreshRect();
      draggedRef.current = false;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      lastMoveX = e.clientX;
      lastMoveT = performance.now();
      velX = 0;

      if (e.pointerType === "touch") {
        pendingTouch = true;
        setState("hover");
        S.s.t = 1.02;
        S.go.t = 0.7;
        aimAt(e.clientX, e.clientY);
        kick();
        holdTimer = window.setTimeout(() => {
          if (!pendingTouch) return;
          pendingTouch = false;
          touchArmed = true;
          draggedRef.current = true;
          try {
            el.setPointerCapture(e.pointerId);
          } catch {}
          navigator.vibrate?.(8);
          beginDrag();
        }, o().touchHoldMs);
        return;
      }
      try {
        el.setPointerCapture(e.pointerId);
      } catch {}
    };

    const release = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      window.clearTimeout(holdTimer);
      pendingTouch = false;
      touchArmed = false;
      pointerId = null;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {}
      const wasDrag = state === "drag";
      if (wasDrag) el.dataset.returning = "true";
      // Если мышь ещё над карточкой — остаёмся в hover.
      const over =
        e.pointerType !== "touch" &&
        e.type !== "pointercancel" &&
        document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-card-root]") === el;
      if (over) {
        setState("hover");
        S.tx.t = 0;
        S.ty.t = 0;
        S.s.t = o().hoverScale;
        S.go.t = 0.85;
        // после возврата наклон пересчитается от исходного rect
        aimAt(e.clientX, e.clientY);
      } else {
        setState("idle");
        toRest();
      }
      kick();
    };

    const onLeave = (e: PointerEvent) => {
      if (state === "drag" || e.pointerType === "touch") return;
      setState("idle");
      toRest();
      kick();
    };

    // На тач-устройствах после удержания блокируем прокрутку,
    // пока палец тянет карточку.
    const onTouchMove = (e: TouchEvent) => {
      if (touchArmed || state === "drag") e.preventDefault();
    };
    const onContext = (e: Event) => {
      if (pendingTouch || touchArmed) e.preventDefault();
    };
    const onResize = () => refreshRect();

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("contextmenu", onContext);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, { passive: true });
    setState("idle");
    write();

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(holdTimer);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", release);
      el.removeEventListener("pointercancel", release);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("contextmenu", onContext);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize);
    };
  }, []);

  return { ref, draggedRef };
}
