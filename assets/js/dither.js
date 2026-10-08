/*
 * The wordmark, as one WebGL module: the same wave and Bayer 8×8 matrix as the
 * griffie.ai field, drawn one texel per cell through a mask of `text`, `tail`
 * and an optional `cursor`, and scaled up with `image-rendering: pixelated`.
 * The returned api: `at(x, y)` and `pointer.on` lift and stir the wave within
 * `reach` of the pointer; `paint(color, accent)` recolours it.
 */
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const VERT = 'attribute vec2 aPosition; void main(){ gl_Position = vec4(aPosition, 0.0, 1.0); }';

/* The dither itself: the same wave and matrix as the griffie.ai field. */
const CHUNK = `
uniform float uTime;
uniform float uSpeed;
uniform float uFrequency;
uniform float uAmplitude;
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec2 fade(vec2 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }
float cnoise(vec2 P) {
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod289(Pi);
  vec4 ix = Pi.xzxz; vec4 iy = Pi.yyww; vec4 fx = Pf.xzxz; vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0;
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x, gy.x); vec2 g10 = vec2(gx.y, gy.y); vec2 g01 = vec2(gx.z, gy.z); vec2 g11 = vec2(gx.w, gy.w);
  vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
  g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x)); float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z)); float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
}
const int OCTAVES = 4;
float fbm(vec2 p) {
  float value = 0.0; float amp = 1.0;
  for (int i = 0; i < OCTAVES; i++) { value += amp * abs(cnoise(p)); p *= uFrequency; amp *= uAmplitude; }
  return value;
}
float pattern(vec2 p) { return fbm(p + fbm(p - uTime * uSpeed)); }
float bayer2(vec2 a) { a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(a) + bayer2(a * 0.5) * 0.25; }
float bayer8(vec2 a) { return bayer4(a) + bayer2(a * 0.25) * 0.0625; }
const float GAIN = 1.1;
const float BIAS = 0.2;
float kwantiseer(float value, vec2 cell, float levels) {
  float stap = 1.0 / (levels - 1.0);
  value += (bayer8(mod(cell, 8.0)) - 0.25) * stap;
  value = clamp(value - BIAS, 0.0, 1.0);
  return floor(value * (levels - 1.0) + 0.5) / (levels - 1.0);
}`;

const FRAG = `
precision highp float;
uniform vec2 uGrid;
uniform vec3 uColor;
uniform vec3 uAccent;
uniform float uLevels;
uniform vec2 uSeed;
uniform float uZoom;
uniform float uBody;
uniform sampler2D uMask;
uniform float uBlink;
uniform vec2 uPointer;
uniform float uReach;
uniform float uPull;
${CHUNK}

void main() {
  vec2 texel = vec2(floor(gl_FragCoord.x), uGrid.y - 1.0 - floor(gl_FragCoord.y));
  vec2 unit = (texel + 0.5) / uGrid;
  vec2 uv = (texel - 0.5 * uGrid) / uGrid.y;

  vec4 m = texture2D(uMask, unit);
  if (m.b > 0.5) { gl_FragColor = vec4(uAccent * uBlink, uBlink); return; }
  float mask = step(0.5, m.a);
  float warmOk = m.r;

  /* The pointer: within reach the wave is lifted and locally stirred, so the
     cells crowd in and the core blooms where the pointer is. */
  float near = uPull * (1.0 - smoothstep(0.0, uReach, length(uv - uPointer)));
  vec2 stir = near * 0.12 * vec2(sin(uTime * 1.7), cos(uTime * 1.3));
  float golf = pattern(uv * uZoom + uSeed + stir) * GAIN + near * 0.55;
  float value = kwantiseer((golf + uBody) * mask, texel, uLevels);
  float warm = clamp((golf - 0.35) / 0.4, 0.0, 1.0) * warmOk;
  vec3 kleur = warm > bayer8(mod(texel + vec2(3.0, 5.0), 8.0)) ? uAccent : uColor;
  gl_FragColor = vec4(kleur * value, value);
}`;

function hex(h) { const n = parseInt(h.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }

function dither(canvas, o) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false });
  if (!gl) { return; }
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x);
    if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(x)); return null; } return x; };
  const p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(p)); return; }
  gl.useProgram(p);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(p, 'aPosition'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {};
  ['uGrid','uColor','uAccent','uLevels','uSeed','uZoom','uBody','uMask','uBlink','uTime','uSpeed','uFrequency','uAmplitude','uPointer','uReach','uPull']
    .forEach(n => U[n] = gl.getUniformLocation(p, n));
  gl.uniform1f(U.uLevels, 4); gl.uniform1f(U.uFrequency, 3); gl.uniform1f(U.uAmplitude, 0.3);
  gl.uniform1f(U.uSpeed, o.speed ?? 0.03); gl.uniform1f(U.uZoom, o.zoom ?? 2); gl.uniform1f(U.uBody, o.body ?? 0);
  gl.uniform2f(U.uSeed, Math.random() * 64, Math.random() * 64); gl.uniform1f(U.uBlink, 1);
  gl.uniform2f(U.uPointer, 0, 0); gl.uniform1f(U.uReach, o.reach ?? 0.5); gl.uniform1f(U.uPull, 0);
  const api = { pointer: { x: 0, y: 0, on: false }, pull: 0 };
  /* The colours can change under a running page, when the system theme does. */
  api.paint = (color, accent) => { gl.uniform3fv(U.uColor, hex(color)); gl.uniform3fv(U.uAccent, hex(accent)); draw(performance.now()); };
  gl.uniform3fv(U.uColor, hex(o.color)); gl.uniform3fv(U.uAccent, hex(o.accent));
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(U.uMask, 0);
  gl.clearColor(0, 0, 0, 0);
  let gw = 0, gh = 0;

  /* The wordmark, rasterised at one pixel per cell: alpha is the letter, red
     marks where the accent may appear, blue is the cursor block. A box
     narrower than about three of its heights takes the name on two lines. */
  function mask() {
    const off = document.createElement('canvas'); off.width = gw; off.height = gh;
    const c = off.getContext('2d');
    const pad = Math.max(1, Math.round(gw * 0.025));
    const twoLine = gw / gh < 3.2;
    const gap = 0.18, cur = o.cursor ? 0.72 : 0;
    const font = (s) => { c.font = `${o.weight} ${s}px ${o.font}`; };
    font(100);
    const wText = c.measureText(o.text).width / 100, wTail = c.measureText(o.tail).width / 100;
    const mm = c.measureText(o.text + o.tail);
    const asc = mm.actualBoundingBoxAscent / 100, desc = mm.actualBoundingBoxDescent / 100;
    const widest = twoLine ? Math.max(wText, wTail + cur) : wText + wTail + cur - (o.kern || 0);
    const tall = twoLine ? asc * 2 + gap + desc : asc + desc;
    const size = Math.min((gw - pad * 2) / widest, (gh * 0.9) / tall);
    font(size);
    const A = asc * size;
    const top = (gh - tall * size) / 2, x = pad;
    const y1 = Math.round(top + A);
    const y2 = twoLine ? Math.round(top + A + gap * size + A) : y1;
    c.fillStyle = '#000'; c.fillText(o.text, x, y1);
    /* The mono dot sits centred in a full cell; the tail is kerned in so the name reads as one word. */
    const tx = twoLine ? x : x + (wText - (o.kern || 0)) * size;
    c.fillStyle = '#f00'; c.fillText(o.tail, tx, y2);
    if (o.cursor) {
      c.fillStyle = '#00f';
      c.fillRect(Math.round(tx + wTail * size + size * 0.14), Math.round(y2 - A), Math.max(2, Math.round(size * 0.5)), Math.round(A));
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, off);
  }

  function draw(now) {
    const t = now / 1000;
    gl.uniform1f(U.uTime, reduced ? 7.3 : t);
    gl.uniform1f(U.uBlink, reduced || (t % 1.1) < 0.6 ? 1 : 0);
    api.pull += ((api.pointer.on && !reduced ? 1 : 0) - api.pull) * 0.12;
    gl.uniform1f(U.uPull, api.pull); gl.uniform2f(U.uPointer, api.pointer.x, api.pointer.y);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /* One texel per cell, the cell snapped to whole device pixels, the canvas
     sized to an exact number of cells rather than stretched to its box. */
  function layout() {
    const box = canvas.parentElement.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cell = Math.max(1, Math.round(box.width / o.cols(box.width) * dpr)) / dpr;
    gw = Math.max(8, Math.floor(box.width / cell)); gh = Math.max(8, Math.floor(box.height / cell));
    canvas.width = gw; canvas.height = gh;
    canvas.style.width = (gw * cell) + 'px'; canvas.style.height = (gh * cell) + 'px';
    gl.viewport(0, 0, gw, gh); gl.uniform2f(U.uGrid, gw, gh);
    mask();
    draw(performance.now());
    canvas.parentElement.classList.add('is-drawn');
  }

  /* The pointer in this canvas's own uv: units of the canvas height, centred. */
  api.at = (clientX, clientY) => { const r = canvas.getBoundingClientRect(); api.pointer.x = ((clientX - r.left) / r.width * gw - 0.5 * gw) / gh; api.pointer.y = ((clientY - r.top) / r.height * gh - 0.5 * gh) / gh; };

  let visible = true, last = 0;
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(canvas);
  new ResizeObserver(() => layout()).observe(canvas.parentElement);
  document.fonts.load(`${o.weight} 40px ${o.font}`).then(layout, layout);
  if (!reduced) (function frame(now) { requestAnimationFrame(frame); if (!visible || now - last < 33) return; last = now; draw(now); })(0);
  return api;
}

export { dither };
