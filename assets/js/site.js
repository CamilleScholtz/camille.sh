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
