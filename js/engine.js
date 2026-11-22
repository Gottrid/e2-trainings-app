// Animations-Engine für die Taktiktafeln (SVG, ohne Bibliotheken)
// Koordinaten: 10 Einheiten = 1 Meter. Halle = 40 × 20 m = 400 × 200.

export const NS = 'http://www.w3.org/2000/svg';
export const COL = {
  red: '#EC4452', blue: '#3A82FF', yellow: '#FFC83D', green: '#2CC46E',
  violet: '#9B7BFF', orange: '#FF7A1A'
};
export const DARK = '#14213a';

export function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

/* ---------- Bewegung ---------- */
export const lerp = (a, b, k) => a + (b - a) * k;
const EASE = {
  ease: u => (u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2),
  lin: u => u,
  out: u => 1 - (1 - u) * (1 - u)
};

/** Keyframes [[t,x,y],…] → Funktion t → [x,y] */
export function kf(pts, mode) {
  const f = EASE[mode || 'ease'];
  return t => {
    if (t <= pts[0][0]) return [pts[0][1], pts[0][2]];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      if (t <= b[0]) {
        const u = b[0] === a[0] ? 1 : (t - a[0]) / (b[0] - a[0]);
        const k = f(u);
        return [lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
      }
    }
    const l = pts[pts.length - 1];
    return [l[1], l[2]];
  };
}
/** Eindimensionale Keyframes [[t,v],…] (z. B. Deckkraft) */
export function k1(pts) {
  return t => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      if (t <= b[0]) {
        const u = b[0] === a[0] ? 1 : (t - a[0]) / (b[0] - a[0]);
        return lerp(a[1], b[1], u);
      }
    }
    return pts[pts.length - 1][1];
  };
}
const cr = (a, b, c, d, t) => .5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
/** Geschlossene Catmull-Rom-Kurve als Endlosschleife */
export function spline(pts, loop, off) {
  const n = pts.length;
  return t => {
    const u = ((((t / loop) + (off || 0)) % 1) + 1) % 1 * n;
    const i = Math.floor(u), f = u - i;
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i % n], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    return [cr(p0[0], p1[0], p2[0], p3[0], f), cr(p0[1], p1[1], p2[1], p3[1], f)];
  };
}
/** Offene Kurve durch Punkte, zeitlich zwischen t0 und t1 */
export function ospline(pts, t0, t1) {
  const n = pts.length - 1;
  return t => {
    const u = Math.max(0, Math.min(1, (t - t0) / (t1 - t0))) * n;
    const i = Math.min(n - 1, Math.floor(u)), f = u - i;
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
    return [cr(p0[0], p1[0], p2[0], p3[0], f), cr(p0[1], p1[1], p2[1], p3[1], f)];
  };
}
/** Ball klebt vor dem Fuß eines Spielers, in Laufrichtung */
export function ballOf(fn, dist) {
  dist = dist || 5;
  return t => {
    const p = fn(t);
    let q = fn(t + .12), dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy);
    if (L < .3) { const r = fn(t - .12); dx = p[0] - r[0]; dy = p[1] - r[1]; L = Math.hypot(dx, dy); }
    if (L < .3) return [p[0] + dist * .7, p[1] + dist * .7];
    return [p[0] + dx / L * dist, p[1] + dy / L * dist];
  };
}
/** Bewegung von a nach b zwischen t0 und t1 (a darf eine Funktion sein, wird einmal ausgewertet) */
export function mv(a, b, t0, t1, mode) {
  const f = EASE[mode || 'out'];
  let A = null;
  return t => {
    if (!A) A = typeof a === 'function' ? a() : a;
    const u = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
    const k = f(u);
    return [lerp(A[0], b[0], k), lerp(A[1], b[1], k)];
  };
}
/** Abschnitte: [[tEnde, fn], …] */
export function seq(parts) {
  return t => {
    for (const p of parts) if (t < p[0]) return p[1](t);
    return parts[parts.length - 1][1](t);
  };
}
export const at = p => () => p;
/** Erstellt eine Funktion, die einen konstanten Punkt einmalig berechnet */
export const once = f => { let v = null; return () => v || (v = f()); };

/* ---------- Zeichnen ---------- */
export function cone(g, x, y) {
  el('ellipse', { cx: x + .8, cy: y + 1.2, rx: 3.6, ry: 3, fill: 'rgba(60,25,0,.3)' }, g);
  el('circle', { cx: x, cy: y, r: 3.4, fill: COL.orange, stroke: '#b84d00', 'stroke-width': .5 }, g);
  el('circle', { cx: x, cy: y, r: 1.2, fill: '#FFE0C4' }, g);
}
export function gate(g, x, y, o, w) {
  w = w || 8;
  if (o === 'v') { cone(g, x, y - w); cone(g, x, y + w); }
  else { cone(g, x - w, y); cone(g, x + w, y); }
}
export function zone(g, x, y, w, h) {
  el('rect', { x, y, width: w, height: h, fill: 'rgba(255,255,255,.07)', stroke: 'rgba(20,33,58,.5)', 'stroke-width': .9, 'stroke-dasharray': '4 3', rx: 1 }, g);
}
export function line(g, x1, y1, x2, y2) {
  el('line', { x1, y1, x2, y2, stroke: '#fff', 'stroke-width': 2, opacity: .85 }, g);
}
export function ballIcon(g, x, y) {
  el('circle', { cx: x, cy: y, r: 3, fill: '#fff', stroke: '#1b1b1b', 'stroke-width': .7 }, g);
}
export function txt(g, x, y, s, size, anchor, fill) {
  const t = el('text', {
    x, y, 'font-size': size || 6, 'text-anchor': anchor || 'middle',
    fill: fill || 'rgba(20,33,58,.78)', 'font-family': 'Barlow Condensed, Arial Narrow, sans-serif',
    'font-weight': 700, 'letter-spacing': '.06em'
  }, g);
  t.textContent = s;
  return t;
}
function wavy(pts) {
  const out = []; let s = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    const L = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / L, ny = (x2 - x1) / L;
    const st = Math.max(2, Math.round(L / 1.1));
    for (let k = (i ? 1 : 0); k <= st; k++) {
      const u = k / st;
      const damp = Math.min(1, (L * (1 - u)) / 5, (L * u + s) / 3);
      const off = Math.sin((s + u * L) / 1.7) * 1.5 * damp;
      out.push([x1 + (x2 - x1) * u + nx * off, y1 + (y2 - y1) * u + ny * off]);
    }
    s += L;
  }
  return 'M' + out.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L');
}
/** Pfeile: pass (weiß), run (gestrichelt), drib (Welle), shot (orange) */
export function arrow(g, type, pts) {
  const d = type === 'drib' ? wavy(pts) : 'M' + pts.map(p => p.join(',')).join(' L');
  const st = {
    pass: { stroke: '#fff', 'stroke-width': 1.1, 'marker-end': 'url(#ahW)' },
    run: { stroke: DARK, 'stroke-width': 1, 'stroke-dasharray': '3 2.4', 'marker-end': 'url(#ahD)', opacity: .75 },
    drib: { stroke: DARK, 'stroke-width': .9, 'marker-end': 'url(#ahD)', opacity: .75 },
    shot: { stroke: COL.orange, 'stroke-width': 1.6, 'marker-end': 'url(#ahA)' }
  }[type];
  el('path', Object.assign({ d, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, st), g);
}
export function curve(g, fn, n) {
  let d = '';
  for (let i = 0; i <= (n || 50); i++) { const q = fn(i / (n || 50)); d += (i ? ' L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1); }
  el('path', { d, fill: 'none', stroke: DARK, 'stroke-width': .9, opacity: .7, 'marker-end': 'url(#ahD)' }, g);
}
export function trail(g, fn, loop, col) {
  let d = '';
  for (let i = 0; i <= 160; i++) { const p = fn(loop * i / 160); d += (i ? ' L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1); }
  el('path', { d, fill: 'none', stroke: col || DARK, 'stroke-width': .8, 'stroke-dasharray': '1.5 2.5', opacity: .45 }, g);
}
export function drawHall(g) {
  const W = 'rgba(255,255,255,.92)';
  el('rect', { x: 0, y: 0, width: 400, height: 200, fill: 'none', stroke: W, 'stroke-width': 1.6 }, g);
  el('line', { x1: 200, y1: 0, x2: 200, y2: 200, stroke: W, 'stroke-width': 1.2 }, g);
  el('circle', { cx: 200, cy: 100, r: 30, fill: 'none', stroke: 'rgba(255,255,255,.55)', 'stroke-width': 1 }, g);
  el('circle', { cx: 200, cy: 100, r: 1.8, fill: W }, g);
  el('path', { d: 'M0,25 A60,60 0 0 1 60,85 L60,115 A60,60 0 0 1 0,175', fill: 'rgba(58,130,255,.13)', stroke: W, 'stroke-width': 1.2 }, g);
  el('path', { d: 'M400,25 A60,60 0 0 0 340,85 L340,115 A60,60 0 0 0 400,175', fill: 'rgba(58,130,255,.13)', stroke: W, 'stroke-width': 1.2 }, g);
  el('path', { d: 'M29.6,0 A90,90 0 0 1 90,85 L90,115 A90,90 0 0 1 29.6,200', fill: 'none', stroke: 'rgba(255,255,255,.6)', 'stroke-width': 1, 'stroke-dasharray': '5 4' }, g);
  el('path', { d: 'M370.4,0 A90,90 0 0 0 310,85 L310,115 A90,90 0 0 0 370.4,200', fill: 'none', stroke: 'rgba(255,255,255,.6)', 'stroke-width': 1, 'stroke-dasharray': '5 4' }, g);
  el('rect', { x: -8, y: 85, width: 8, height: 30, fill: 'url(#net)', stroke: '#fff', 'stroke-width': 1.6 }, g);
  el('rect', { x: 400, y: 85, width: 8, height: 30, fill: 'url(#net)', stroke: '#fff', 'stroke-width': 1.6 }, g);
}

/* ---------- Diagramm ---------- */
export const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
export const live = new Set();

function makeActor(g, a) {
  const n = { a, g: el('g', {}, g) };
  if (a.kind === 'p' || a.kind === 'coach') {
    el('ellipse', { cx: 1.3, cy: 2.4, rx: 7, ry: 6.2, fill: 'rgba(50,22,0,.28)' }, n.g);
    const fill = a.kind === 'coach' ? '#141c2b' : COL[a.color];
    el('circle', { r: 7, fill, stroke: '#fff', 'stroke-width': 1.4 }, n.g);
    const t = el('text', {
      y: 2.6, 'text-anchor': 'middle', 'font-size': a.label && a.label.length > 1 ? 6 : 7.6, 'font-weight': 800,
      'font-family': 'Barlow Condensed, Arial Narrow, sans-serif', fill: a.color === 'yellow' ? '#2a2000' : '#fff'
    }, n.g);
    t.textContent = a.label || '';
  } else if (a.kind === 'ball') {
    el('circle', { cx: .9, cy: 1.1, r: 3.2, fill: 'rgba(50,22,0,.32)' }, n.g);
    el('circle', { r: 3.1, fill: '#fff', stroke: '#1b1b1b', 'stroke-width': .7 }, n.g);
    el('path', { d: 'M0,-1.4 L1.3,-.4 L.8,1.1 L-.8,1.1 L-1.3,-.4Z', fill: '#1b1b1b' }, n.g);
  } else if (a.kind === 'cone') {
    cone(n.g, 0, 0);
  } else if (a.kind === 'card') {
    n.rect = el('rect', { x: -4.5, y: -6.5, width: 9, height: 12, rx: 1.6, stroke: '#fff', 'stroke-width': 1 }, n.g);
  }
  return n;
}

export class Diagram {
  constructor(svg, animFn) {
    this.svg = svg; this.anim = animFn(); this.loop = this.anim.loop; this.sc = this.anim.scale || 1;
    this.t = 0; this.speed = 1; this.playing = !reduceMotion; this.visible = true;
    const A = this.anim;
    svg.innerHTML = '';
    svg.setAttribute('viewBox', A.vb);
    const [vx, vy, vw, vh] = A.vb.split(' ').map(Number);
    this.vb = [vx, vy, vw, vh];
    el('rect', { x: vx, y: vy, width: vw, height: vh, fill: 'url(#wood)' }, svg);
    el('rect', { x: vx, y: vy, width: vw, height: vh, fill: 'url(#vign)' }, svg);
    const gs = el('g', {}, svg);
    if (A.hall) drawHall(gs);
    if (A.statics) A.statics(gs);
    const ga = el('g', {}, svg);
    this.nodes = A.actors.map(a => makeActor(ga, a));
    const fs = vw / 26; this.fs = fs;
    const hud = el('g', {}, svg);
    this.hBg = el('rect', { x: vx + fs * .5, y: vy + fs * .45, height: fs * 1.7, rx: fs * .85, fill: 'rgba(11,20,36,.86)' }, hud);
    this.hDot = el('circle', { cx: vx + fs * 1.35, cy: vy + fs * 1.3, r: fs * .38 }, hud);
    this.hTx = el('text', { x: vx + fs * 2.0, y: vy + fs * 1.6, 'font-size': fs * .85, fill: '#F4F1E8', 'font-family': 'Barlow, system-ui, sans-serif', 'font-weight': 600 }, hud);
    this.sBg = el('rect', { y: vy + fs * .45, height: fs * 1.7, rx: fs * .85, fill: 'rgba(244,241,232,.94)', opacity: 0 }, hud);
    this.sTx = el('text', { y: vy + fs * 1.62, 'font-size': fs * .95, fill: '#0B1424', 'font-family': 'Barlow Condensed, Arial Narrow, sans-serif', 'font-weight': 800, 'text-anchor': 'middle', 'letter-spacing': '.04em' }, hud);
    this.big = el('text', { x: vx + vw / 2, y: vy + vh / 2 + fs * 1.1, 'font-size': fs * 3.4, fill: COL.orange, stroke: '#0B1424', 'stroke-width': fs * .16, 'paint-order': 'stroke', 'font-family': 'Barlow Condensed, Arial Narrow, sans-serif', 'font-weight': 800, 'text-anchor': 'middle', opacity: 0 }, hud);
    this.lastTxt = null; this.lastScore = null;
    this.render(reduceMotion ? this.loop * .4 : 0);
  }
  setHud(h) {
    const fs = this.fs, [vx, , vw] = this.vb;
    if (h.txt !== this.lastTxt) {
      this.hTx.textContent = h.txt;
      let w = 0;
      try { w = this.hTx.getComputedTextLength(); } catch (e) { /* noch nicht sichtbar */ }
      if (!w) w = h.txt.length * fs * .44;
      this.hBg.setAttribute('width', w + fs * 2.5);
      this.lastTxt = w ? h.txt : null;
    }
    this.hDot.setAttribute('fill', h.col || COL.orange);
    const sc = h.score || '';
    if (sc !== this.lastScore) {
      this.sTx.textContent = sc;
      const w = sc ? sc.length * fs * .5 + fs * 1.4 : 0;
      this.sBg.setAttribute('width', w); this.sBg.setAttribute('x', vx + vw - fs * .5 - w);
      this.sTx.setAttribute('x', vx + vw - fs * .5 - w / 2); this.sBg.setAttribute('opacity', sc ? 1 : 0);
      this.lastScore = sc;
    }
    this.big.textContent = h.big || '';
    this.big.setAttribute('opacity', h.big ? 1 : 0);
  }
  render(t) {
    this.t = t;
    const sc = this.sc !== 1 ? ' scale(' + this.sc + ')' : '';
    for (const n of this.nodes) {
      const a = n.a, p = a.pos(t);
      n.g.setAttribute('transform', 'translate(' + p[0].toFixed(2) + ',' + p[1].toFixed(2) + ')' + sc);
      if (a.op) n.g.setAttribute('opacity', Math.max(0, Math.min(1, a.op(t))).toFixed(2));
      if (n.rect) n.rect.setAttribute('fill', a.fill(t));
    }
    if (this.anim.hud) this.setHud(this.anim.hud(t));
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  for (const d of live) if (d.playing && d.visible) d.render((d.t + dt * d.speed) % d.loop);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/** Gemeinsame SVG-Definitionen (Parkett, Netz, Pfeilspitzen) einmal ins Dokument */
export function injectDefs() {
  if (document.getElementById('e2-defs')) return;
  document.body.insertAdjacentHTML('afterbegin', `<svg id="e2-defs" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
    <pattern id="wood" width="64" height="12" patternUnits="userSpaceOnUse">
      <rect width="64" height="6" fill="#D49D63"/><rect y="6" width="64" height="6" fill="#DCA86E"/>
      <rect x="0" y="0" width=".5" height="6" fill="#B07A44"/><rect x="32" y="6" width=".5" height="6" fill="#B07A44"/>
      <rect x="20" y="1.5" width="9" height=".3" fill="#C38A50" opacity=".5"/><rect x="45" y="8.2" width="12" height=".3" fill="#C38A50" opacity=".5"/>
      <rect y="5.8" width="64" height=".3" fill="#B98048" opacity=".7"/><rect y="11.8" width="64" height=".3" fill="#B98048" opacity=".7"/>
    </pattern>
    <pattern id="grass" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="20" height="40" fill="#3E9B4F"/><rect x="20" width="20" height="40" fill="#45A757"/>
    </pattern>
    <radialGradient id="vign" cx="50%" cy="45%" r="75%"><stop offset="55%" stop-color="#3a1d00" stop-opacity="0"/><stop offset="100%" stop-color="#3a1d00" stop-opacity=".38"/></radialGradient>
    <pattern id="net" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="rgba(255,255,255,.14)"/><path d="M0,0 L3,3 M3,0 L0,3" stroke="rgba(255,255,255,.6)" stroke-width=".35"/></pattern>
    <marker id="ahW" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10z" fill="#fff"/></marker>
    <marker id="ahD" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10z" fill="#14213a"/></marker>
    <marker id="ahA" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10z" fill="#FF7A1A"/></marker>
  </defs></svg>`);
}
