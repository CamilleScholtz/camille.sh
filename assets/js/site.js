import { dither } from './dither.js';

/* One grid for the page: the wordmark picks its cell from the hero's width,
   and the field in the corner takes that same cell, so a block of the
   background is a block of the name. */
const hero = document.querySelector('.hero');
const wordmark = document.querySelector('[data-wordmark]');
const field = document.querySelector('[data-field]');

const colsFor = (width) => (width < 640 ? Math.round(width / 3.2) : 236);
const cellFor = (width) => {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  return Math.max(1, Math.round((width / colsFor(width)) * dpr)) / dpr;
};
const heroWidth = () => hero.getBoundingClientRect().width;

/* Shift the field's canvas so its cells, and its 8×8 Bayer tile, land on
   the wordmark's: a small negative offset, hidden by the field's overflow. */
function align() {
  if (!field || !field.style.width) return;
  const span = cellFor(heroWidth()) * 8;
  const w = wordmark.getBoundingClientRect();
  const box = field.parentElement.getBoundingClientRect();
  const wrap = (d) => (((d % span) + span) % span) - span;
  field.style.left = wrap(w.left - box.left) + 'px';
  field.style.top = wrap(w.top - box.top) + 'px';
}

/* The colours come from the stylesheet, so the accent is set in one place. */
const css = getComputedStyle(document.documentElement);
const token = (name, fallback) => css.getPropertyValue(name).trim() || fallback;

/* The wordmark: `camille.sh` in cells, a cursor after it. On a narrow screen
   the name breaks into two lines so each letter keeps enough cells to read. */
if (wordmark) {
  dither(wordmark, {
    mode: 0,
    cols: colsFor,
    color: token('--ink', '#111111'),
    accent: token('--geel', '#E9B02E'),
    zoom: 2.6,
    body: 0.55,
    speed: 0.035,
    text: 'camille',
    tail: '.sh',
    cursor: true,
    kern: 0.16,
    font: '"Martian Mono", ui-monospace, monospace',
    weight: 800,
    onLayout: align,
  });
}

/* The field: the same weather in the page's yellow, barely there, fading out
   from the top-left corner. Slower and coarser than the name, since a
   background is looked past where a mark is looked at. */
if (field) {
  dither(field, {
    mode: 3,
    cell: () => cellFor(heroWidth()),
    color: token('--geel', '#E9B02E'),
    accent: token('--geel', '#E9B02E'),
    alpha: 0.4,
    zoom: 1.3,
    body: 0,
    speed: 0.012,
    onLayout: (gw, gh, set) => { set([-(gw / gh) / 2, -0.5], 1.0); align(); },
  });
}
