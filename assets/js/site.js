import { dither } from './dither.js';

/* The colours come from the stylesheet, so the accent is set in one place. */
const css = getComputedStyle(document.documentElement);
const token = (name, fallback) => css.getPropertyValue(name).trim() || fallback;

/* The wordmark: `camille.sh` in cells, a cursor after it. On a narrow screen
   the name breaks into two lines so each letter keeps enough cells to read. */
const wordmark = document.querySelector('[data-wordmark]');
if (wordmark) {
  const mark = dither(wordmark, {
    mode: 0,
    cols: (width) => (width < 640 ? Math.round(width / 3.2) : 236),
    color: token('--ink', '#111111'),
    accent: token('--geel', '#E9B02E'),
    zoom: 2.6,
    body: 0.55,
    speed: 0.035,
    text: 'camille',
    tail: '.sh',
    cursor: true,
    kern: 0.16,
    reach: 0.55,
    font: '"Martian Mono", ui-monospace, monospace',
    weight: 800,
  });

  /* Weather under the pointer: where it is, the cells crowd in and the core
     blooms; it settles when the pointer leaves. A finger counts while it is
     down. Reduced motion leaves the weather alone. */
  if (mark) {
    const hero = wordmark.parentElement;
    const move = (e) => { mark.at(e.clientX, e.clientY); mark.pointer.on = true; };
    hero.addEventListener('pointermove', move, { passive: true });
    hero.addEventListener('pointerdown', move, { passive: true });
    hero.addEventListener('pointerleave', () => { mark.pointer.on = false; });
    hero.addEventListener('pointerup', () => { if (matchMedia('(hover: none)').matches) mark.pointer.on = false; });
  }
}

/* The tab is a job. While the page is in front the favicon blinks in step
   with the cursor (same clock, same 1.1 s, same 0.6 on), drawn from the same
   8×8 grid as static/favicon.svg. When the visitor switches away the title
   says what a shell says about a process you left, and the favicon holds. */
const icon = document.querySelector('link[rel="icon"]');
if (icon) {
  const size = 32, cell = 4;
  const fav = document.createElement('canvas'); fav.width = size; fav.height = size;
  const fx = fav.getContext('2d');
  const cells = [[0,0],[1,1],[0,2],[1,3],[0,4],[1,5],[0,6],[1,7],[2,0],[2,2],[2,4],[2,6],[3,1],[3,5]];
  const frames = [false, true].map((on) => {
    fx.fillStyle = token('--paper', '#ffffff'); fx.fillRect(0, 0, size, size);
    fx.fillStyle = token('--ink', '#111111'); cells.forEach(([x, y]) => fx.fillRect(x * cell, y * cell, cell, cell));
    if (on) { fx.fillStyle = token('--geel', '#E9B02E'); fx.fillRect(5 * cell, 1 * cell, 2 * cell, 6 * cell); }
    return fav.toDataURL('image/png');
  });
  const title = document.title;
  const stopped = '[1]+ Stopped   ./camille.sh';
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let shown = -1;
  const show = (on) => { const i = on ? 1 : 0; if (i === shown) return; shown = i; icon.type = 'image/png'; icon.href = frames[i]; };
  (function tick(now) { requestAnimationFrame(tick); if (!document.hidden) show(still || (now / 1000) % 1.1 < 0.6); })(0);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { document.title = stopped; show(true); } else { document.title = title; }
  });
}
