// Übungsbibliothek. Jede Übung: Texte + animierte Grafik (anim).
// Neue Übung: Objekt in DRILLS ergänzen, id muss eindeutig sein.
import { COL, el, lerp, kf, k1, spline, ospline, ballOf, mv, seq, at, once, cone, gate, zone, line, ballIcon, txt, arrow, curve, trail } from './engine.js';

export const CATS = {
  'Aufwärmen': COL.green,
  'Technik': COL.violet,
  '1 gegen 1': COL.red,
  'Passspiel': COL.blue,
  'Spielform': '#4FC3E8',
  'Torschuss': COL.orange,
  'Spiel': COL.yellow
};

/* ================= Animationen ================= */

function A_ampel() {
  const loop = 8;
  const prog = t => t < 3 ? t : t < 4 ? 3 : t < 7 ? 3 - (t - 4) : 0;
  const sgn = t => t < 4 ? 1 : -1;
  const ph = t => t < 3 ? 'g' : t < 4 ? 'r' : t < 7 ? 'y' : 'r';
  const cc = { g: COL.green, r: COL.red, y: COL.yellow };
  const kids = [[150, 62, 24, 1, 0], [252, 62, 24, -1, 1.2], [200, 100, 18, 1, 2.4], [150, 140, 24, -1, 3.1], [252, 140, 24, 1, 4.2], [200, 42, 13, -1, 5], [200, 158, 13, 1, .6], [128, 100, 12, -1, 2]];
  const actors = [];
  kids.forEach(([cx, cy, r, dir, p0], i) => actors.push({ kind: 'p', color: 'blue', label: String(i + 1), pos: t => { const a = p0 + dir * prog(t) * 1.05; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; } }));
  actors.push({ kind: 'coach', label: 'T', pos: at([200, 192]) });
  actors.push({ kind: 'card', pos: at([213, 185]), fill: t => cc[ph(t)] });
  kids.forEach(([cx, cy, r, dir, p0]) => actors.push({ kind: 'ball', pos: t => { const a = p0 + dir * prog(t) * 1.05, s = dir * sgn(t); const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a); return [x - Math.sin(a) * s * 5.5, y + Math.cos(a) * s * 5.5]; } }));
  return {
    loop, vb: '96 -14 208 216', hall: true,
    statics: g => { zone(g, 110, 20, 180, 160); [[110, 20], [290, 20], [110, 180], [290, 180]].forEach(p => cone(g, p[0], p[1])); txt(g, 286, 176, '20 × 20 m', 6, 'end'); },
    hud: t => { const p = ph(t); return { txt: { g: 'GRÜN · Dribbeln mit Tempo', r: 'ROT · Stopp, Sohle auf den Ball', y: 'GELB · Richtungswechsel' }[p], col: cc[p] }; },
    actors
  };
}

function A_tore() {
  const loop = 12;
  const P1 = [[120, 55], [145, 55], [172, 58], [200, 78], [200, 100], [200, 122], [228, 142], [255, 145], [282, 145], [283, 110], [276, 66], [255, 55], [228, 48], [200, 35], [160, 32], [125, 40]];
  const P2 = P1.map(([x, y]) => [x, 200 - y]);
  const P3 = P1.map(([x, y]) => [400 - x, y]);
  const f = [spline(P1, loop, 0), spline(P2, loop, .34), spline(P3, loop, .67)];
  const actors = f.map((fn, i) => ({ kind: 'p', color: 'blue', label: String(i + 1), pos: fn }));
  f.forEach(fn => actors.push({ kind: 'ball', pos: ballOf(fn, 5) }));
  return {
    loop, vb: '96 -14 208 216', hall: true,
    statics: g => {
      zone(g, 110, 20, 180, 160); [[110, 20], [290, 20], [110, 180], [290, 180]].forEach(p => cone(g, p[0], p[1]));
      f.forEach(fn => trail(g, fn, loop));
      [[145, 55, 'v'], [255, 55, 'v'], [200, 100, 'h'], [145, 145, 'v'], [255, 145, 'v'], [200, 165, 'v']].forEach(([x, y, o]) => gate(g, x, y, o, 7.5));
      txt(g, 286, 176, '6 Tore à 1,5 m', 6, 'end');
    },
    hud: t => { const rem = Math.max(0, Math.ceil(45 * (1 - t / loop))); return { txt: 'Runde 3 · Finte vor jedem Tor · 0:' + String(rem).padStart(2, '0'), col: COL.violet }; },
    actors
  };
}

function A_duell() {
  const loop = 8;
  const R1 = kf([[0, 26, 70], [.2, 26, 70], [1.5, 92, 64], [2.6, 114, 63], [3.0, 118, 76], [3.3, 128, 58], [4.4, 170, 63], [6.2, 174, 63], [6.21, 26, 70], [8, 26, 70]]);
  const B1 = kf([[0, 174, 70], [.2, 174, 70], [1.5, 126, 70], [2.6, 128, 66], [3.0, 127, 77], [3.3, 125, 79], [4.4, 152, 72], [6.2, 150, 72], [6.21, 174, 70], [8, 174, 70]]);
  const op = k1([[0, 1], [5.6, 1], [6.2, 0], [7.4, 0], [8, 1]]);
  const bR = ballOf(R1, 5.5);
  const ball = seq([[.9, mv([100, 14], [100, 62], 0, .9)], [1.5, at([100, 62])], [4.4, bR], [6.2, once(() => bR(4.38))], [99, at([100, 14])]]);
  const bop = k1([[0, 1], [5.6, 1], [6.2, 0], [7.3, 0], [7.7, 1], [8, 1]]);
  return {
    loop, vb: '-12 -16 224 166',
    statics: g => {
      zone(g, 40, 20, 120, 100); [[40, 20], [160, 20], [40, 120], [160, 120]].forEach(p => cone(g, p[0], p[1]));
      line(g, 40, 55, 40, 85); line(g, 160, 55, 160, 85);
      [[40, 55], [40, 85], [160, 55], [160, 85]].forEach(p => cone(g, p[0], p[1]));
      arrow(g, 'pass', [[100, 20], [100, 55]]); arrow(g, 'run', [[34, 70], [85, 65]]); arrow(g, 'drib', [[99, 64], [114, 63], [119, 73], [128, 60], [166, 63]]);
      [[90, 6], [85, 10], [93, 11]].forEach(p => ballIcon(g, p[0], p[1]));
      txt(g, 8, 90, 'TEAM ROT', 6); txt(g, 192, 90, 'TEAM BLAU', 6); txt(g, 100, 134, '12 × 10 m · Feld 2 identisch daneben', 6);
    },
    hud: t => t < 1.5 ? { txt: 'Pass vom Trainer · beide starten', col: COL.orange } : t < 2.6 ? { txt: 'Rot hat den Ball und dribbelt an', col: COL.red } : t < 3.3 ? { txt: 'Finte!', col: COL.yellow } : t < 5.4 ? { txt: 'Durchs Hütchentor = Punkt für Rot', col: COL.green } : { txt: 'Nächstes Paar', col: COL.blue },
    actors: [
      { kind: 'p', color: 'red', label: '2', pos: at([12, 70]) }, { kind: 'p', color: 'red', label: '3', pos: at([-2, 70]) },
      { kind: 'p', color: 'blue', label: '2', pos: at([188, 70]) }, { kind: 'p', color: 'blue', label: '3', pos: at([202, 70]) },
      { kind: 'coach', label: 'T', pos: at([100, 8]) },
      { kind: 'p', color: 'blue', label: '1', pos: B1, op }, { kind: 'p', color: 'red', label: '1', pos: R1, op },
      { kind: 'ball', pos: ball, op: bop }]
  };
}

function A_rondo() {
  const loop = 6;
  const ball = kf([[0, 30, 62], [.7, 60, 30], [1.4, 66, 30], [2.1, 90, 58], [2.8, 90, 66], [3.5, 30, 72], [4.2, 30, 64], [4.9, 58, 30], [5.4, 54, 30], [6, 30, 62]], 'out');
  const A = kf([[0, 24, 62], [3.3, 24, 72], [3.5, 24, 72], [4.2, 24, 64], [6, 24, 62]]);
  const B = kf([[0, 60, 24], [.7, 60, 24], [1.4, 66, 24], [4.2, 62, 24], [4.9, 58, 24], [5.4, 54, 24], [6, 60, 24]]);
  const C = kf([[0, 96, 60], [2.1, 96, 58], [2.8, 96, 66], [6, 96, 60]]);
  const D = t => { const b = ball(((t - .4) % loop + loop) % loop); return [60 + .62 * (b[0] - 60), 60 + .62 * (b[1] - 60)]; };
  const arr = [.7, 2.1, 3.5, 4.9];
  return {
    loop, vb: '0 -14 120 132',
    statics: g => { zone(g, 25, 25, 70, 70); [[25, 25], [95, 25], [25, 95], [95, 95]].forEach(p => cone(g, p[0], p[1])); txt(g, 60, 104, '7 × 7 m · 3 Quadrate parallel', 4.6); },
    hud: t => { if (t > 5.6) return { txt: '5 Pässe = 1 Punkt!', col: COL.green }; const n = arr.filter(a => t >= a).length; return { txt: 'Pässe am Stück: ' + n, col: COL.blue }; },
    actors: [{ kind: 'p', color: 'blue', label: '1', pos: A }, { kind: 'p', color: 'blue', label: '2', pos: B }, { kind: 'p', color: 'blue', label: '3', pos: C }, { kind: 'p', color: 'red', label: 'K', pos: D }, { kind: 'ball', pos: ball }]
  };
}

function A_funino() {
  const loop = 9;
  const R1 = kf([[0, 70, 90], [1.6, 118, 64], [2.0, 121, 60], [4, 130, 72], [6, 130, 80], [9, 70, 90]]);
  const R2 = kf([[0, 95, 42], [1.6, 150, 38], [4, 160, 42], [6, 150, 50], [9, 95, 42]]);
  const R3 = kf([[0, 90, 135], [1.6, 122, 140], [2.6, 140, 138], [3.2, 156, 128], [4.4, 190, 148], [5, 206, 150], [6.5, 206, 150], [9, 90, 135]]);
  const B1 = kf([[0, 150, 80], [1.6, 146, 64], [2.6, 150, 82], [4, 165, 95], [6, 165, 95], [9, 150, 80]]);
  const B2 = kf([[0, 172, 45], [1.6, 166, 40], [4, 176, 46], [9, 172, 45]]);
  const B3 = kf([[0, 170, 125], [1.6, 168, 104], [2.6, 162, 120], [3.2, 170, 122], [4.4, 178, 134], [6, 182, 140], [9, 170, 125]]);
  const b1 = ballOf(R1, 5.5), b3 = ballOf(R3, 5.5);
  const ball = seq([[1.7, b1], [2.6, mv(() => b1(1.69), [145, 137], 1.7, 2.6)], [5, b3], [6.5, once(() => b3(4.98))], [99, once(() => b1(.02))]]);
  const bop = k1([[0, 1], [6, 1], [6.5, 0], [8.4, 0], [9, 1]]);
  return {
    loop, vb: '-4 -14 228 196',
    statics: g => {
      zone(g, 20, 20, 180, 140);
      [[20, 20], [20, 40], [20, 140], [20, 160], [200, 20], [200, 40], [200, 140], [200, 160]].forEach(p => cone(g, p[0], p[1]));
      [[20, 20, 40], [20, 140, 160], [200, 20, 40], [200, 140, 160]].forEach(([x, y1, y2]) => line(g, x, y1, x, y2));
      arrow(g, 'drib', [[76, 88], [116, 66]]); arrow(g, 'pass', [[122, 66], [141, 132]]); arrow(g, 'drib', [[146, 136], [156, 129], [192, 147]]);
      txt(g, 110, 174, '18 × 14 m · Feld 2 daneben · Rot spielt nach rechts', 6);
    },
    hud: t => { const h = t < 1.6 ? { txt: 'Rot greift an, Blau verschiebt', col: COL.red } : t < 2.6 ? { txt: 'Seitenwechsel aufs freie Tor', col: '#fff' } : t < 3.4 ? { txt: '1 gegen 1!', col: COL.yellow } : t < 6 ? { txt: 'Durchs Tor gedribbelt = Punkt', col: COL.green } : { txt: 'Blau startet an der Grundlinie', col: COL.blue }; h.score = t >= 4.8 ? 'ROT 1 : 0 BLAU' : 'ROT 0 : 0 BLAU'; return h; },
    actors: [{ kind: 'p', color: 'blue', label: '1', pos: B1 }, { kind: 'p', color: 'blue', label: '2', pos: B2 }, { kind: 'p', color: 'blue', label: '3', pos: B3 },
    { kind: 'p', color: 'red', label: '1', pos: R1 }, { kind: 'p', color: 'red', label: '2', pos: R2 }, { kind: 'p', color: 'red', label: '3', pos: R3 }, { kind: 'ball', pos: ball, op: bop }]
  };
}

function pairActors(P, off, loop, col, label) {
  const [A0, B0, A2, B2] = P;
  const u = (p, q, d) => { const L = Math.hypot(q[0] - p[0], q[1] - p[1]); return [p[0] + (q[0] - p[0]) / L * d, p[1] + (q[1] - p[1]) / L * d]; };
  const Ak = kf([[0, A0[0], A0[1]], [.6, A0[0], A0[1]], [2.0, A2[0], A2[1]], [2.6, A2[0], A2[1]], [4.4, A0[0], A0[1]], [loop, A0[0], A0[1]]]);
  const Bk = kf([[0, B0[0], B0[1]], [.6, B0[0], B0[1]], [2.0, B2[0], B2[1]], [2.6, B2[0], B2[1]], [4.4, B0[0], B0[1]], [loop, B0[0], B0[1]]]);
  const bB = ballOf(Bk, 5), bA = ballOf(Ak, 5);
  const ball = seq([[.6, mv(u(A0, B0, 6), u(B0, A0, 5.5), 0, .6)], [2.0, bB], [2.6, mv(() => bB(1.99), u(A2, B2, 5.5), 2.0, 2.6)], [4.3, bA], [99, mv(() => bA(4.29), u(A0, B0, 6), 4.3, loop)]]);
  const w = t => ((t + off) % loop + loop) % loop;
  return [{ kind: 'p', color: col, label, pos: t => Ak(w(t)) }, { kind: 'p', color: col, label, pos: t => Bk(w(t)) }, { kind: 'ball', pos: t => ball(w(t)) }];
}
function A_passjagd() {
  const loop = 4.8;
  const P1 = [[60, 50], [100, 50], [140, 76], [140, 124]];
  const P2 = P1.map(([x, y]) => [400 - x, 200 - y]);
  const P3 = [[180, 172], [220, 172], [200, 103], [200, 147]];
  const pr = [pairActors(P1, 0, loop, 'blue', '1'), pairActors(P2, 1.6, loop, 'red', '2'), pairActors(P3, 3.2, loop, 'yellow', '3')];
  const actors = []; pr.forEach(p => actors.push(p[0], p[1])); pr.forEach(p => actors.push(p[2]));
  return {
    loop, vb: '-14 -12 428 216', hall: true, scale: 1.35,
    statics: g => {
      [[80, 50, 'v'], [140, 100, 'h'], [320, 150, 'v'], [260, 100, 'h'], [200, 172, 'v'], [200, 125, 'h'], [80, 150, 'v'], [320, 50, 'v']].forEach(([x, y, o]) => gate(g, x, y, o, 8));
      arrow(g, 'pass', [[70, 50], [92, 50]]); arrow(g, 'drib', [[104, 56], [136, 118]]); arrow(g, 'run', [[64, 56], [134, 76]]); arrow(g, 'pass', [[140, 116], [140, 84]]);
    },
    hud: t => t < 2.4 ? { txt: 'Pass durchs Tor = 1 Punkt', col: COL.blue } : { txt: 'Annehmen, nächstes freies Tor suchen', col: COL.yellow },
    actors
  };
}

function A_abschluss() {
  const loop = 5.5;
  const P = kf([[0, 240, 160], [.8, 262, 148], [2.0, 326, 118], [2.3, 332, 114], [3.2, 340, 110], [3.6, 340, 110], [3.61, 240, 160], [5.5, 240, 160]]);
  const bP = ballOf(P, 5);
  const ball = seq([[.8, bP], [1.3, mv(() => bP(.79), [304, 163], .8, 1.3)], [1.5, at([304, 163])], [2.0, mv([304, 163], [329, 117], 1.5, 2.0)], [2.2, mv([329, 117], [334, 112], 2.0, 2.2, 'lin')], [2.6, mv([334, 112], [398, 93], 2.2, 2.6, 'lin')], [2.75, mv([398, 93], [405, 95], 2.6, 2.75)], [3.6, at([405, 95])], [99, once(() => bP(0))]]);
  const op = k1([[0, 1], [3.3, 1], [3.6, 0], [4.8, 0], [5.5, 1]]);
  const GK = kf([[0, 391, 100], [2.2, 391, 100], [2.6, 393, 110], [3.6, 393, 110], [5.5, 391, 100]]);
  return {
    loop, vb: '196 -14 222 222', hall: true,
    statics: g => { arrow(g, 'drib', [[246, 157], [260, 149]]); arrow(g, 'pass', [[266, 150], [300, 162]]); arrow(g, 'run', [[266, 145], [322, 120]]); arrow(g, 'pass', [[306, 160], [327, 121]]); arrow(g, 'shot', [[336, 111], [396, 94]]); txt(g, 212, 206, 'Zweite Gruppe spiegelverkehrt am anderen Tor', 6, 'start'); },
    hud: t => t < .8 ? { txt: 'Andribbeln', col: COL.blue } : t < 1.5 ? { txt: 'Pass auf den Wandspieler', col: '#fff' } : t < 2.2 ? { txt: 'Steil gehen, Rückpass in den Lauf', col: COL.yellow } : t < 3.4 ? { txt: 'Abschluss: flach ins Eck!', col: COL.orange } : { txt: 'Rollen tauschen, hinten anstellen', col: COL.blue },
    actors: [{ kind: 'p', color: 'blue', label: '3', pos: at([226, 171]) }, { kind: 'p', color: 'blue', label: '4', pos: at([214, 182]) }, { kind: 'p', color: 'blue', label: '5', pos: at([202, 193]) },
    { kind: 'p', color: 'blue', label: 'W', pos: at([310, 167]) }, { kind: 'p', color: 'yellow', label: 'TW', pos: GK },
    { kind: 'p', color: 'blue', label: '1', pos: P, op }, { kind: 'ball', pos: ball, op }]
  };
}

function A_rennen() {
  const loop = 6.2;
  const R1 = kf([[0, 214, 78], [.3, 214, 78], [1.4, 292, 94], [2.2, 320, 100], [2.6, 330, 104], [4, 336, 104], [4.5, 336, 104], [4.51, 214, 78], [6.2, 214, 78]]);
  const B1 = kf([[0, 214, 122], [.3, 214, 122], [1.4, 284, 110], [2.2, 312, 110], [2.6, 322, 114], [4, 328, 112], [4.5, 328, 112], [4.51, 214, 122], [6.2, 214, 122]]);
  const op = k1([[0, 1], [4, 1], [4.5, 0], [5.6, 0], [6.2, 1]]);
  const bR = ballOf(R1, 5.5);
  const ball = seq([[1.4, mv([210, 100], [296, 100], 0, 1.4)], [2.6, bR], [3.0, mv(() => bR(2.59), [397, 92], 2.6, 3.0, 'lin')], [3.15, mv([397, 92], [405, 94], 3.0, 3.15)], [4.5, at([405, 94])], [99, at([210, 100])]]);
  const GK = kf([[0, 391, 100], [2.6, 391, 100], [3.0, 393, 110], [4, 393, 110], [6.2, 391, 100]]);
  return {
    loop, vb: '192 -14 226 222', hall: true,
    statics: g => {
      arrow(g, 'pass', [[216, 100], [290, 100]]); arrow(g, 'run', [[221, 80], [284, 92]]); arrow(g, 'run', [[221, 120], [278, 108]]); arrow(g, 'drib', [[299, 97], [326, 103]]); arrow(g, 'shot', [[334, 103], [396, 93]]);
      [[200, 108], [196, 114]].forEach(p => ballIcon(g, p[0], p[1]));
      txt(g, 210, 206, 'Zweite Gruppe spiegelverkehrt am anderen Tor', 6, 'start');
    },
    hud: t => t < .3 ? { txt: 'Trainer rollt den Ball: Los!', col: COL.orange } : t < 1.4 ? { txt: 'Wettrennen zum Ball', col: '#fff' } : t < 2.6 ? { txt: 'Rot schirmt ab und zieht zum Tor', col: COL.red } : t < 4 ? { txt: 'Abschluss flach ins Eck!', col: COL.orange } : { txt: 'Nächstes Paar', col: COL.blue },
    actors: [{ kind: 'p', color: 'red', label: '2', pos: at([214, 64]) }, { kind: 'p', color: 'red', label: '3', pos: at([214, 50]) }, { kind: 'p', color: 'blue', label: '2', pos: at([214, 136]) },
    { kind: 'coach', label: 'T', pos: at([202, 100]) }, { kind: 'p', color: 'yellow', label: 'TW', pos: GK },
    { kind: 'p', color: 'blue', label: '1', pos: B1, op }, { kind: 'p', color: 'red', label: '1', pos: R1, op }, { kind: 'ball', pos: ball, op }]
  };
}

function A_bande() {
  const loop = 7;
  const W = [[268, 32], [279.5, 48.3], [305.5, 41.7], [309.5, 68.3], [335.5, 61.7], [346, 84]];
  const P = seq([[1.4, kf([[0, 220, 36], [.3, 220, 36], [1.4, 268, 32]])], [3.6, ospline(W, 1.4, 3.6)], [99, kf([[3.6, 346, 84], [4.2, 350, 90], [4.8, 350, 90], [4.81, 220, 36], [7, 220, 36]])]]);
  const bP = ballOf(P, 5);
  const ball = seq([[.3, at([225, 34])], [.8, mv([225, 34], [252, -1], .3, .8, 'lin')], [1.4, mv([252, -1], [270, 36], .8, 1.4)], [3.6, bP], [4.0, mv(() => bP(3.59), [398, 108], 3.6, 4.0, 'lin')], [4.15, mv([398, 108], [405, 109], 4.0, 4.15)], [4.8, at([405, 109])], [99, at([225, 34])]]);
  const op = k1([[0, 1], [4.6, 1], [5.0, 0], [6.4, 0], [7, 1]]);
  const GK = kf([[0, 391, 100], [3.6, 391, 100], [4.0, 392, 91], [4.8, 392, 91], [7, 391, 100]]);
  return {
    loop, vb: '192 -14 226 222', hall: true,
    statics: g => {
      el('rect', { x: 192, y: -11, width: 226, height: 7, fill: '#3a3f4b' }, g); txt(g, 412, -5.6, 'BANDE / HALLENWAND', 4.6, 'end', 'rgba(255,255,255,.85)');
      [[285, 40], [300, 50], [315, 60], [330, 70]].forEach(c => cone(g, c[0], c[1]));
      arrow(g, 'pass', [[227, 31], [250, 3]]); arrow(g, 'pass', [[255, 3], [268, 30]]); arrow(g, 'run', [[221, 44], [262, 38]]);
      curve(g, ospline(W, 0, 1));
      arrow(g, 'shot', [[350, 90], [396, 107]]);
      txt(g, 210, 206, 'Zweiter Parcours spiegelverkehrt am anderen Tor', 6, 'start');
    },
    hud: t => t < .8 ? { txt: 'Pass an die Bande', col: '#fff' } : t < 1.4 ? { txt: 'Abpraller in den Lauf mitnehmen', col: COL.yellow } : t < 3.6 ? { txt: 'Slalom: Ball eng am Fuß', col: COL.blue } : t < 4.8 ? { txt: 'Abschluss flach ins Eck!', col: COL.orange } : { txt: 'Nächster startet', col: COL.blue },
    actors: [{ kind: 'p', color: 'blue', label: '2', pos: at([220, 54]) }, { kind: 'p', color: 'blue', label: '3', pos: at([220, 70]) }, { kind: 'p', color: 'blue', label: '4', pos: at([220, 86]) },
    { kind: 'p', color: 'yellow', label: 'TW', pos: GK }, { kind: 'p', color: 'blue', label: '1', pos: P, op }, { kind: 'ball', pos: ball, op }]
  };
}

function A_spiel() {
  const loop = 9;
  const R1 = kf([[0, 120, 140], [1.2, 166, 146], [2.4, 180, 135], [5.5, 200, 130], [9, 120, 140]]);
  const R2 = kf([[0, 170, 60], [1.8, 212, 64], [2.6, 246, 70], [3.6, 262, 78], [5.5, 280, 80], [9, 170, 60]]);
  const R3 = kf([[0, 230, 120], [1.6, 260, 130], [3.3, 298, 124], [3.9, 322, 115], [4.4, 330, 112], [5.5, 336, 106], [9, 230, 120]]);
  const RG = kf([[0, 12, 100], [1.8, 14, 96], [3.8, 14, 104], [9, 12, 100]]);
  const B1 = kf([[0, 195, 125], [1.2, 190, 138], [1.9, 200, 100], [3.3, 240, 95], [5.5, 250, 100], [9, 195, 125]]);
  const B2 = kf([[0, 250, 55], [1.8, 236, 62], [2.6, 244, 58], [3.6, 262, 70], [5.5, 285, 88], [9, 250, 55]]);
  const B3 = kf([[0, 320, 100], [2.6, 312, 108], [3.3, 306, 118], [3.9, 310, 124], [5.5, 330, 115], [9, 320, 100]]);
  const BG = kf([[0, 389, 100], [3, 389, 100], [3.9, 389, 108], [4.3, 391, 110], [5.5, 389, 104], [9, 389, 100]]);
  const b1 = ballOf(R1, 5.5), b2 = ballOf(R2, 5.5), b3 = ballOf(R3, 5.5);
  const ball = seq([[1.2, b1], [1.8, mv(() => b1(1.19), [214, 66], 1.2, 1.8)], [2.6, b2], [3.3, mv(() => b2(2.59), [302, 123], 2.6, 3.3)], [3.9, b3], [4.3, mv(() => b3(3.89), [398, 93], 3.9, 4.3, 'lin')], [4.45, mv([398, 93], [405, 95], 4.3, 4.45)], [6, at([405, 95])], [99, once(() => b1(.02))]]);
  const bop = k1([[0, 1], [5.5, 1], [6, 0], [8.4, 0], [9, 1]]);
  const bench = [150, 176, 202, 228];
  const actors = [{ kind: 'p', color: 'red', label: 'TW', pos: RG }, { kind: 'p', color: 'red', label: '1', pos: R1 }, { kind: 'p', color: 'red', label: '2', pos: R2 }, { kind: 'p', color: 'red', label: '3', pos: R3 },
  { kind: 'p', color: 'blue', label: '1', pos: B1 }, { kind: 'p', color: 'blue', label: '2', pos: B2 }, { kind: 'p', color: 'blue', label: '3', pos: B3 }, { kind: 'p', color: 'blue', label: 'TW', pos: BG }];
  bench.forEach((x, i) => actors.push({ kind: 'p', color: 'yellow', label: String(i + 1), pos: at([x, 226]) }));
  bench.forEach((x, i) => actors.push({ kind: 'ball', pos: t => [x + 6, 218 - Math.abs(Math.sin(t * 2.8 + i * 1.3)) * 7] }));
  actors.push({ kind: 'ball', pos: ball, op: bop });
  return {
    loop, vb: '-14 -12 428 250', hall: true, scale: 1.4,
    statics: g => {
      arrow(g, 'drib', [[126, 140], [164, 145]]); arrow(g, 'pass', [[172, 143], [211, 68]]); arrow(g, 'drib', [[218, 66], [244, 70]]); arrow(g, 'pass', [[251, 73], [297, 121]]); arrow(g, 'drib', [[304, 122], [320, 116]]); arrow(g, 'shot', [[328, 113], [396, 94]]);
      el('rect', { x: 132, y: 210, width: 250, height: 30, rx: 6, fill: 'rgba(20,33,58,.12)', stroke: 'rgba(20,33,58,.35)', 'stroke-width': .7, 'stroke-dasharray': '3 2' }, g);
      txt(g, 250, 229, 'PAUSE · JONGLIER-REKORD', 6.5, 'start');
    },
    hud: t => {
      const h = t < 1.8 ? { txt: 'Rot baut auf', col: COL.red } : t < 3.3 ? { txt: 'Pass in die Tiefe', col: '#fff' } : t < 3.9 ? { txt: '1 gegen 1 gewonnen!', col: COL.yellow } : t < 6 ? { txt: 'Sonderregel erfüllt: Tor zählt doppelt', col: COL.orange } : { txt: 'Nächstes Spiel: neue Teams', col: COL.yellow };
      h.score = t >= 4.4 ? 'ROT 2 : 0 BLAU' : 'ROT 0 : 0 BLAU'; if (t >= 4.4 && t < 5.9) h.big = 'TOR!'; return h;
    },
    actors
  };
}

function A_spiegel() {
  const loop = 8;
  const lines = [60, 100, 140];
  const P = [[28, 10, 1], [-24, 12, -1], [20, -14, 1]];
  const f = (a, b) => t => 200 + a * Math.sin(2 * Math.PI * t / 2.5) + b * Math.sin(2 * Math.PI * t / 1.25);
  const actors = [], balls = [];
  lines.forEach((y, i) => {
    const [a, b, dir] = P[i]; const m = f(a, b); const gx = dir > 0 ? 270 : 130; const fl0 = m(-.25);
    const L = t => t < 5 ? [m(t), y - 10] : t < 6 ? [lerp(200, gx + dir * 10, (t - 5)), y - 10] : [lerp(gx + dir * 10, 200, Math.min(1, (t - 6) / 2)), y - 10];
    const F = t => t < 5 ? [m(t - .25), y + 10] : t < 6.25 ? [lerp(fl0, gx + dir * 10, (t - 5) / 1.25), y + 10] : [lerp(gx + dir * 10, fl0, Math.min(1, (t - 6.25) / 1.75)), y + 10];
    actors.push({ kind: 'p', color: 'blue', label: String(i + 1), pos: L }, { kind: 'p', color: 'red', label: String(i + 1), pos: F });
    balls.push({ kind: 'ball', pos: t => { const p = L(t); return [p[0], p[1] + 6]; } }, { kind: 'ball', pos: t => { const p = F(t); return [p[0], p[1] - 6]; } });
  });
  return {
    loop, vb: '96 -14 208 216', hall: true,
    statics: g => {
      [130, 270].forEach(x => [36, 80, 120, 164].forEach(y => cone(g, x, y)));
      lines.forEach(y => el('line', { x1: 150, y1: y, x2: 250, y2: y, stroke: 'rgba(20,33,58,.55)', 'stroke-width': .9, 'stroke-dasharray': '3 2.5' }, g));
      txt(g, 200, 182, 'Blau führt, Rot spiegelt · Sprinttore links und rechts', 6);
    },
    hud: t => t < 5 ? { txt: 'Spiegeln: Partner macht alles nach', col: COL.blue } : t < 6.3 ? { txt: 'Pfiff! Wer ist zuerst durchs Tor?', col: COL.orange } : { txt: 'Zurück zur Linie, Rollen tauschen', col: COL.green },
    actors: actors.concat(balls)
  };
}

function kegelCycle(ry, by, cA, cB, off, loop) {
  const m1 = (cA + by) / 2, m2 = (cB + ry) / 2;
  const R = kf([[0, 120, ry], [3.6, 120, ry], [4.3, 156, m2], [5.4, 120, ry], [6, 120, ry]]);
  const B = kf([[0, 280, by], [1.0, 280, by], [1.7, 244, m1], [2.6, 282, by], [6, 280, by]]);
  const bR = ballOf(R, 6), bB = ballOf(B, 6);
  const ball = seq([[.3, at([126, ry])], [.75, mv([126, ry], [200, cA], .3, .75, 'lin')], [1.7, mv([200, cA], [238, m1], .75, 1.7)],
    [2.0, mv([238, m1], () => 0, 1.7, 2.0)], [2.6, bB], [2.9, mv(() => bB(2.59), [274, by], 2.6, 2.9)], [3.35, mv([274, by], [200, cB], 2.9, 3.35, 'lin')],
    [4.2, mv([200, cB], [162, m2], 3.35, 4.2)], [4.5, mv([162, m2], () => 0, 4.2, 4.5)], [5.4, bR], [99, mv(() => bR(5.39), [126, ry], 5.4, 6)]]);
  // Übergänge, deren Ziel ein Spielerball ist, nachträglich setzen
  const fix = (t0, t1, from, to) => t => { const u = Math.max(0, Math.min(1, (t - t0) / (t1 - t0))); const b = to(t1); return [lerp(from[0], b[0], u), lerp(from[1], b[1], u)]; };
  const ballFixed = t => t >= 1.7 && t < 2.0 ? fix(1.7, 2.0, [238, m1], bB)(t) : t >= 4.2 && t < 4.5 ? fix(4.2, 4.5, [162, m2], bR)(t) : ball(t);
  const coneA = { pos: kf([[0, 200, cA], [.75, 200, cA], [1.2, 224, cA - 6], [1.4, 226, cA - 7], [1.41, 200, cA], [6, 200, cA]]), op: k1([[0, 1], [1.0, 1], [1.4, 0], [5.4, 0], [6, 1]]) };
  const coneB = { pos: kf([[0, 200, cB], [3.35, 200, cB], [3.8, 176, cB + 6], [4.0, 174, cB + 7], [4.01, 200, cB], [6, 200, cB]]), op: k1([[0, 1], [3.6, 1], [4.0, 0], [5.6, 0], [6, 1]]) };
  const w = t => ((t + off) % loop + loop) % loop;
  return {
    players: [{ kind: 'p', color: 'red', label: off ? '2' : '1', pos: t => R(w(t)) }, { kind: 'p', color: 'blue', label: off ? '2' : '1', pos: t => B(w(t)) }],
    cones: [{ kind: 'cone', pos: t => coneA.pos(w(t)), op: t => coneA.op(w(t)) }, { kind: 'cone', pos: t => coneB.pos(w(t)), op: t => coneB.op(w(t)) }],
    ball: { kind: 'ball', pos: t => ballFixed(w(t)) }
  };
}
function A_kegeln() {
  const loop = 6;
  const c1 = kegelCycle(72, 78, 75, 95, 0, loop), c2 = kegelCycle(128, 122, 125, 105, 3, loop);
  const score = t => { const r = (t >= .75) + (t >= 3.75), b = (t >= .35) + (t >= 3.35); return 'ROT ' + r + ' : ' + b + ' BLAU'; };
  return {
    loop, vb: '96 -14 208 216', hall: true,
    statics: g => {
      el('rect', { x: 194, y: 58, width: 12, height: 84, rx: 2, fill: '#8a5a2b', stroke: '#5e3b1a', 'stroke-width': 1 }, g);
      el('line', { x1: 194, y1: 100, x2: 206, y2: 100, stroke: '#5e3b1a', 'stroke-width': 1 }, g);
      [65, 85, 115, 135].forEach(y => cone(g, 200, y));
      [120, 280].forEach(x => el('line', { x1: x, y1: 40, x2: x, y2: 160, stroke: 'rgba(20,33,58,.55)', 'stroke-width': 1, 'stroke-dasharray': '4 3' }, g));
      txt(g, 120, 172, 'SCHUSSLINIE', 5.5); txt(g, 280, 172, 'SCHUSSLINIE', 5.5); txt(g, 160, 36, '8 m', 5.5); txt(g, 240, 36, '8 m', 5.5); txt(g, 200, 152, 'LANGBÄNKE', 5.5);
      arrow(g, 'shot', [[128, 72], [194, 75]]); arrow(g, 'shot', [[272, 122], [206, 125]]);
    },
    hud: t => ({ txt: (t % 3) < 1.6 ? 'Treffer = 1 Punkt fürs Team' : 'Rübergerollte Bälle zurückschießen', col: COL.orange, score: score(t) }),
    actors: [{ kind: 'p', color: 'red', label: '3', pos: at([106, 100]) }, { kind: 'p', color: 'blue', label: '3', pos: at([294, 100]) },
      ...c1.players, ...c2.players, ...c1.cones, ...c2.cones, c1.ball, c2.ball]
  };
}

function A_konter() {
  const loop = 7;
  const R1 = kf([[0, 205, 70], [.6, 212, 72], [1.6, 262, 84], [1.9, 268, 86], [3.2, 280, 88], [4.7, 282, 88], [4.71, 205, 70], [7, 205, 70]]);
  const R2 = kf([[0, 205, 130], [.6, 215, 134], [1.8, 296, 140], [2.3, 308, 136], [2.8, 330, 128], [4.2, 336, 124], [4.7, 336, 124], [4.71, 205, 130], [7, 205, 130]]);
  const B = kf([[0, 300, 100], [.6, 296, 98], [1.8, 284, 96], [2.3, 292, 110], [2.9, 312, 118], [4.7, 318, 118], [4.71, 300, 100], [7, 300, 100]]);
  const GK = kf([[0, 391, 100], [2.9, 391, 100], [3.25, 392, 91], [4.7, 392, 91], [7, 391, 100]]);
  const b1 = ballOf(R1, 5.5), b2 = ballOf(R2, 5.5);
  const ball = seq([[.6, mv([212, 106], [219, 76], 0, .6)], [1.8, b1], [2.3, mv(() => b1(1.79), [303, 137], 1.8, 2.3)], [2.8, b2], [2.9, once(() => b2(2.78))],
    [3.25, mv(() => b2(2.78), [398, 110], 2.9, 3.25, 'lin')], [3.4, mv([398, 110], [405, 111], 3.25, 3.4)], [4.7, at([405, 111])], [99, at([212, 106])]]);
  const op = k1([[0, 1], [4.2, 1], [4.7, 0], [6.4, 0], [7, 1]]);
  return {
    loop, vb: '192 -14 226 222', hall: true,
    statics: g => {
      arrow(g, 'pass', [[213, 102], [218, 81]]); arrow(g, 'drib', [[224, 75], [258, 83]]); arrow(g, 'run', [[214, 136], [290, 140]]);
      arrow(g, 'pass', [[268, 88], [299, 133]]); arrow(g, 'drib', [[312, 134], [328, 128]]); arrow(g, 'shot', [[334, 126], [396, 110]]);
      txt(g, 210, 206, 'Zweite Gruppe spiegelverkehrt am anderen Tor', 6, 'start');
    },
    hud: t => t < .6 ? { txt: 'Trainer spielt an: 2 gegen 1!', col: COL.orange } : t < 1.8 ? { txt: 'Andribbeln und Verteidiger binden', col: COL.red } : t < 2.3 ? { txt: 'Querpass zum freien Mann', col: '#fff' } : t < 3.4 ? { txt: 'Abschluss!', col: COL.orange } : { txt: 'Rollen tauschen, nächste drei', col: COL.blue },
    actors: [{ kind: 'p', color: 'red', label: '3', pos: at([214, 28]) }, { kind: 'p', color: 'red', label: '4', pos: at([230, 28]) },
      { kind: 'coach', label: 'T', pos: at([204, 114]) }, { kind: 'p', color: 'yellow', label: 'TW', pos: GK },
      { kind: 'p', color: 'blue', label: '1', pos: B, op }, { kind: 'p', color: 'red', label: '1', pos: R1, op }, { kind: 'p', color: 'red', label: '2', pos: R2, op }, { kind: 'ball', pos: ball, op }]
  };
}

/* ================= Übungen ================= */

export const DRILLS = [
  {
    id: 'ampel', cat: 'Aufwärmen', title: 'Ampel-Dribbling', ort: ['Halle', 'Platz'], min: 10, anim: A_ampel,
    goal: 'Viele Ballkontakte und Kopf hoch: Wer nur auf den Ball schaut, verpasst die Farbe.',
    org: [['Feld', '20 × 20 m'], ['Kinder', 'alle, jedes mit Ball'], ['Material', '4 Hütchen, Leibchen als Farbsignal']],
    steps: ['Alle dribbeln frei kreuz und quer durchs Feld, ohne sich zu berühren.', 'Du hältst ein Leibchen hoch, die Kinder reagieren sofort.', 'Grün = Tempo-Dribbling · Gelb = Richtungswechsel mit der Sohle · Rot = Stopp, Sohle auf den Ball, Arme hoch.', 'Ab Minute 5 kommt Blau dazu: zum nächsten Hütchen, umrunden, weiter.'],
    coaching: ['Alle 2–3 Kontakte hochschauen, der Blick löst sich vom Ball.', 'Ball eng führen, nie weiter als einen Schritt weg.', 'Beide Füße benutzen, auch Außenrist und Sohle.'],
    vars: [['Leichter', 'Nur Grün und Rot, langsamer wechseln'], ['Schwerer', 'Zahl rufen: „3!“ = zu dritt zusammen dribbeln'], ['Spaß', 'Letzte 2 Min: 2 Fänger ohne Ball spielen Bälle aus dem Feld']],
    tip: 'Wechsle die Farben unregelmäßig und auch mal zweimal schnell hintereinander. Das trainiert Reaktion und hält die Spannung hoch.',
    legend: ['dot']
  },
  {
    id: 'spiegel', cat: 'Aufwärmen', title: 'Spiegel-Dribbling', ort: ['Halle', 'Platz'], min: 10, anim: A_spiegel,
    goal: 'Ball eng am Fuß, Blick zum Partner und blitzschnelle Reaktion auf den Pfiff.',
    org: [['Feld', 'ca. 20 × 16 m, Linien in der Mitte'], ['Kinder', 'Paare, jedes Kind mit Ball'], ['Material', '8 Hütchen als Sprinttore']],
    steps: ['Die Paare stehen sich mit je einem Ball an einer Linie gegenüber, etwa 2 m Abstand.', 'Der Anführer dribbelt seitlich hin und her und macht Finten, der Partner spiegelt jede Bewegung.', 'Auf Pfiff: Wettrennen mit Ball durch das Hütchentor auf der Seite, in die der Anführer startet. Wer zuerst durch ist, bekommt einen Punkt.', 'Nach jedem Pfiff Rollen tauschen.'],
    coaching: ['Ball mit der Sohle seitlich ziehen, kleine schnelle Schritte.', 'Blick zum Partner, nicht auf den Ball.', 'Auf Pfiff sofort explodieren, die ersten drei Kontakte schnell.'],
    vars: [['Leichter', 'Erst ohne Ball spiegeln, nur laufen'], ['Schwerer', 'Nur mit dem schwachen Fuß'], ['Spaß', 'Du rufst „Tausch!“: Ball liegen lassen, Partnerball nehmen']],
    tip: 'Bei ungleichen Paaren startet der Schnellere einen Schritt weiter weg vom Tor. So bleibt jedes Rennen spannend.',
    legend: ['dot']
  },
  {
    id: 'tore', cat: 'Technik', title: 'Hütchentor-Jagd', sub: 'Finten', ort: ['Halle', 'Platz'], min: 12, anim: A_tore,
    goal: 'Finte vor dem Tor, dann explodieren. Das ist die Vorbereitung fürs 1 gegen 1.',
    org: [['Feld', '20 × 20 m'], ['Kinder', 'alle, jedes mit Ball'], ['Material', '6 Hütchentore, 1,5 m breit']],
    steps: ['Runden à 45 Sekunden, dazwischen 30 Sekunden Pause.', 'Jedes Kind dribbelt durch so viele Tore wie möglich und zählt laut mit.', 'Nicht zweimal hintereinander durch dasselbe Tor.', 'Nach jeder Runde: Wer hat seinen Rekord geknackt?'],
    rounds: [['R1', 'frei'], ['R2', 'nur schwacher Fuß'], ['R3', 'Finte vor jedem Tor'], ['R4', 'Sohle-Wende im Tor'], ['R5', 'Rekordrunde']],
    coaching: ['Finte 1–2 m vor dem Tor, nicht erst im Tor.', 'Nach der Finte Tempo! Erst die Beschleunigung macht die Finte wirksam.', 'Übersteiger und Schere vormachen lassen, dann nachmachen.'],
    vars: [['Schwerer', '2 Torwächter ohne Ball stellen sich in Tore, das Tor ist dann zu'], ['Paare', 'Partner zeigt mit der Hand das nächste Tor an']],
    tip: 'Lass zwei Kinder ihre Lieblingsfinte vormachen. Kinder lernen am meisten voneinander, und die Vorführer sind stolz.',
    legend: ['dot', 'trail']
  },
  {
    id: 'kegeln', cat: 'Torschuss', title: 'Hütchen-Kegeln', sub: 'Schusstechnik', ort: ['Halle'], min: 12, anim: A_kegeln,
    goal: 'Viele Schüsse in kurzer Zeit: sauberer Innenseit- und Spannstoß aufs Ziel.',
    org: [['Feld', 'Hallenmitte, 2 Langbänke'], ['Kinder', '2 Teams à 6, jedes Kind mit Ball'], ['Material', '8–10 Hütchen auf den Bänken']],
    steps: ['Zwei Langbänke stehen in der Hallenmitte hintereinander, darauf 8–10 Hütchen.', 'Rot schießt von der einen Seite, Blau von der anderen, jeweils hinter einer Linie in 8 m Abstand.', 'Jedes abgeschossene Hütchen ist ein Punkt. Bälle, die rüberrollen, schießt das andere Team zurück.', 'Sicherheitsregel: Bälle nur bis zur Bank holen, nie dahinter laufen. Sind alle Hütchen unten, neu aufstellen.'],
    rounds: [['R1', 'Innenseite'], ['R2', 'Spann'], ['R3', 'schwacher Fuß'], ['R4', 'aus dem Dribbling']],
    coaching: ['Standbein neben den Ball, Fußspitze des Standbeins zeigt zum Ziel.', 'Innenseite für Genauigkeit, Spann für Kraft. Erst genau, dann fest.', 'Kopf beim Schuss ruhig über dem Ball halten.'],
    vars: [['Leichter', 'Schusslinie auf 6 m'], ['Schwerer', 'Nur direkt aus der Bewegung schießen'], ['Spaß', 'Ein goldenes Hütchen zählt 3 Punkte']],
    tip: 'Das Verliererteam stellt die Hütchen neu auf. Das geht schnell und gibt allen eine kurze Verschnaufpause.',
    legend: ['dot', 'shot']
  },
  {
    id: 'duell', cat: '1 gegen 1', title: 'Duell-Arena', ort: ['Halle', 'Platz'], min: 15, anim: A_duell,
    goal: 'Mut zum Dribbling und konsequentes Verteidigen.',
    org: [['Feld', '2 Felder à 12 × 10 m'], ['Kinder', 'je Feld 6: 3 Rot gegen 3 Blau'], ['Material', '16 Hütchen, Bälle beim Trainer']],
    steps: ['Rot steht hinter der linken, Blau hinter der rechten Grundlinie. In jeder Linie ein 3-m-Hütchentor.', 'Du passt den Ball ins Feld, die Ersten beider Reihen sprinten los.', 'Wer den Ball hat, greift an: Punkt, wenn man durch das gegnerische Tor dribbelt.', 'Maximal 10 Sekunden pro Duell, dann ist das nächste Paar dran. Teamwertung Rot gegen Blau.'],
    coaching: ['Angreifer: mit Tempo auf den Gegner zu, Finte, dann am Gegner vorbei beschleunigen.', 'Verteidiger: schnell anlaufen, kurz vorher abbremsen, seitlich stellen und auf den Ball schauen.', 'Ball verloren? Sofort zurückerobern wollen!'],
    vars: [['Reaktion', 'Du rufst eine Farbe, nur dieses Kind darf zum Ball, das andere setzt nach'], ['Schwerer', '2 gegen 1 oder 2 gegen 2 für die Starken']],
    tip: 'Lobe den Versuch, nicht nur den Erfolg: „Super, dass du es probiert hast!“ So trauen sich auch die Vorsichtigen.',
    legend: ['dot', 'pass', 'run', 'drib']
  },
  {
    id: 'konter', cat: 'Spielform', title: 'Kontertor 2 gegen 1', sub: 'Überzahl ausspielen', ort: ['Halle', 'Platz'], min: 15, anim: A_konter,
    goal: 'Überzahl clever ausspielen: Verteidiger binden, im richtigen Moment abspielen und abschließen.',
    org: [['Feld', 'je Hallenhälfte ein Tor'], ['Kinder', 'je Tor 6: 2 Angreifer, Verteidiger, Torwart, 2 warten'], ['Material', 'Tore, Bälle beim Trainer']],
    steps: ['Zwei Angreifer starten an der Mittellinie, ein Verteidiger wartet vor dem Tor.', 'Du spielst einen Angreifer an, beide laufen Richtung Tor.', 'Die Angreifer entscheiden: selbst dribbeln oder zum freien Mitspieler passen. Schnell abschließen!', 'Rotation: Angreifer → Verteidiger → Torwart → hinten anstellen.'],
    coaching: ['Der Ballführende dribbelt auf den Verteidiger zu und bindet ihn.', 'Der Mitspieler läuft breit und bleibt auf gleicher Höhe, nicht vor dem Ball.', 'Kommt der Verteidiger, wird abgespielt. Bleibt er weg, selbst schießen.'],
    vars: [['Leichter', 'Verteidiger startet 2 m später'], ['Schwerer', '3 gegen 2'], ['Zeit', 'Abschluss innerhalb von 6 Sekunden, sonst Ball für den Verteidiger']],
    tip: 'Frag nach einer Aktion den Ballführenden: „Wo war der Verteidiger, als du gepasst hast?“ So lernen die Kinder, den richtigen Moment zu sehen.',
    legend: ['dot', 'pass', 'run', 'drib', 'shot']
  },
  {
    id: 'passjagd', cat: 'Passspiel', title: 'Pass-Jagd zu zweit', ort: ['Halle', 'Platz'], min: 12, anim: A_passjagd,
    goal: 'Alle gleichzeitig am Ball: sauberer Pass, Annahme in die Bewegung und Absprache mit dem Partner.',
    org: [['Feld', 'ganze Halle'], ['Kinder', 'Paare, 1 Ball pro Paar'], ['Material', '16 Hütchen = 8 Tore à 2 m']],
    steps: ['8 Hütchentore stehen verteilt in der Halle.', 'Die Paare passen sich den Ball durch ein Tor zu, dann suchen sie zusammen das nächste freie Tor.', 'Runden à 60 Sekunden: Jeder Pass durch ein Tor ist ein Punkt. Laut mitzählen.', 'Kein Tor zweimal hintereinander. 30 Sekunden Pause zwischen den Runden.'],
    rounds: [['R1', 'frei'], ['R2', 'max. 2 Kontakte'], ['R3', 'nur schwacher Fuß'], ['R4', 'Annahme mit Richtungswechsel'], ['R5', 'Rekordrunde']],
    coaching: ['Mit der Innenseite passen, Standbein neben den Ball.', 'Ball in Bewegungsrichtung annehmen, schon zum nächsten Tor hin.', 'Reden! Rufen, zeigen, Blickkontakt: „Hier, das Tor ist frei!“'],
    vars: [['Leichter', 'Tore 3 m breit'], ['Schwerer', 'Pass muss direkt gespielt werden'], ['Spaß', '2 Störer ohne Ball dürfen sich in Tore stellen']],
    tip: 'Bilde gemischte Paare aus stärkeren und schwächeren Kindern und lies nach jeder Runde die Punkte vor. Jedes Paar will seinen Rekord knacken.',
    legend: ['dot', 'pass', 'run', 'drib']
  },
  {
    id: 'bande', cat: 'Torschuss', title: 'Banden-Slalom', sub: 'mit Abschluss', ort: ['Halle'], min: 8, anim: A_bande,
    goal: 'Pass an die Bande, Ball mitnehmen, eng durch den Slalom und flach abschließen. Alles in einem Tempo-Lauf.',
    org: [['Feld', 'je Hallenhälfte ein Parcours'], ['Kinder', 'je Tor 6: Torwart und 5 Schützen'], ['Material', '4 Hütchen je Slalom, Bälle']],
    steps: ['Start an der Mittellinie nahe der Seitenwand, jedes Kind mit Ball.', 'Pass gegen die Bande (Hallenwand oder umgedrehte Langbank), den Abpraller in den Lauf mitnehmen.', 'Slalom durch 4 Hütchen, Ball eng am Fuß.', 'Nach dem letzten Hütchen sofort abschließen, Ball holen, hinten anstellen. Torwart wechselt alle 2 Minuten.'],
    coaching: ['Pass an die Bande fest und flach, dann kommt er sauber zurück.', 'Abpraller mit dem Fuß in Laufrichtung mitnehmen, nicht erst stoppen.', 'Im Slalom kleine Kontakte mit Innen- und Außenseite. Nach dem letzten Hütchen Kopf hoch: Wo steht der Torwart?'],
    vars: [['Wettkampf', 'Beide Tore gegeneinander: Welche Gruppe trifft in 2 Minuten öfter?'], ['Fuß', 'Slalom nur mit dem schwachen Fuß'], ['Schwerer', 'Ein Verteidiger startet beim Pass an die Bande hinterher']],
    tip: 'Der Nächste startet, sobald der Vordermann im Slalom ist. So gibt es kaum Wartezeit und jedes Kind kommt oft zum Abschluss.',
    legend: ['dot', 'pass', 'run', 'shot']
  },
  {
    id: 'liga', cat: 'Spiel', title: 'King of the Court', sub: 'jedes Spiel neue Teams', ort: ['Halle'], min: 30, anim: A_spiel, liga: true,
    goal: 'Jedes Spiel mischt die App neue Viererteams. Wer sammelt über alle Spiele die meisten Punkte für die Rangliste?',
    regel: 'Tor nach gewonnenem 1 gegen 1 = 2 Punkte. Du rufst „Doppelt!“.',
    org: [['Feld', 'ganze Halle, Handballtore'], ['Kinder', '4 gegen 4, der Rest macht Pause'], ['Material', 'Leibchen Rot und Blau, Spieluhr unten']],
    steps: ['Jedes Spiel dauert 4 Minuten, 4 gegen 4. Für jedes Spiel stellt die App zwei neue Teams zusammen.', 'Wer gerade nicht spielt, macht die Pausenaufgabe Jonglier-Rekord. Die App wählt immer die Kinder mit den wenigsten Spielen, so spielen alle fast gleich viel.', 'Keine Viererkombination kommt doppelt vor, auch nicht über die Wochen, bis alle Kombinationen durch sind.', 'Punkte für jedes Kind: Sieg 3, Unentschieden 1, jedes Tor 1, jede Vorlage 1. Tore und Vorlagen tippst du unten ein.', 'Jedes Team stellt einen Torwart, der in jedem Spiel wechselt.'],
    coaching: ['Wenig reinrufen, die Kinder sollen selbst entscheiden.', 'Lob für jedes mutige Dribbling, auch wenn der Ball danach weg ist.', 'Zum Schluss 1 Minute Kreis: Wer steht heute vorn in der Rangliste?'],
    vars: [['Kurz', '3-Minuten-Spiele, dann kommt jedes Kind öfter dran'], ['Schwerer', 'Tor zählt nur nach mindestens einem Pass']],
    legend: ['dot', 'pass', 'drib', 'shot']
  },
  {
    id: 'rennen', cat: '1 gegen 1', title: 'Wettrennen zum Tor', sub: '1 gegen 1 mit Abschluss', ort: ['Halle', 'Platz'], min: 8, anim: A_rennen,
    goal: 'Tempo, Zweikampf und Abschluss in einem: Wer zuerst am Ball ist, wird zum Torjäger.',
    org: [['Feld', 'je Hälfte ein Tor'], ['Kinder', 'je Tor 6: Torwart, Rest in 2 Reihen'], ['Material', 'Tore, Bälle beim Trainer']],
    steps: ['Rot und Blau stehen in zwei Reihen an der Mittellinie, du stehst mit den Bällen dazwischen.', 'Du rollst den Ball Richtung Tor. Auf „Los!“ sprinten die Ersten beider Reihen.', 'Wer zuerst am Ball ist, greift an und schließt ab. Der andere verteidigt sofort.', 'Torwart wechselt alle 2 Minuten. Teamwertung Rot gegen Blau.'],
    coaching: ['Körper zwischen Gegner und Ball bringen, dann ist der Ball sicher.', 'Nicht bis ins Tor dribbeln: früh und flach ins Eck schießen.', 'Verteidiger gibt nie auf und setzt bis zum Schuss nach.'],
    vars: [['Reaktion', 'Start aus Bauch- oder Rückenlage'], ['Schwerer', 'Ball wird hoch zugeworfen, erst kontrollieren'], ['Fuß', 'Tor mit dem schwachen Fuß zählt doppelt']],
    tip: 'Roll den Ball mal kürzer, mal länger. So gewinnt nicht immer der Schnellste, sondern auch der Mutigste im Zweikampf.',
    legend: ['dot', 'pass', 'run', 'drib', 'shot']
  },
  {
    id: 'funino', cat: 'Spielform', title: 'Funiño 3 gegen 3', sub: '4 Dribbeltore', ort: ['Halle', 'Platz'], min: 12, anim: A_funino,
    goal: 'Spielen statt Anstehen: Jedes Kind ist ständig am Ball und muss entscheiden, welches Tor gerade offen ist.',
    org: [['Feld', '2 Felder à 18 × 14 m'], ['Kinder', '4 Teams à 3, je Feld 3 gegen 3'], ['Material', '16 Hütchen']],
    steps: ['Jedes Team verteidigt die zwei 2-m-Tore in den Ecken seiner Grundlinie und greift die zwei gegenüber an.', 'Tor = durchs Hütchentor dribbeln und den Ball dahinter stoppen. Kein Torwart.', 'Nach einem Tor startet das andere Team mit Ball an der eigenen Grundlinie.', '2 Runden à 5 Minuten, dann tauschen die Gegner zwischen den Feldern.'],
    coaching: ['Kopf hoch vor dem Dribbling: Wo ist das freie Tor?', 'Breit machen: einer oben, einer unten. Dann muss der Gegner sich entscheiden.', 'Verteidiger: das Tor auf der Ballseite schließen, nicht alle zum Ball rennen.'],
    vars: [['Leichter', 'Tore 3 m breit'], ['Schwerer', 'Tor zählt nur nach einem Seitenwechsel'], ['Spaß', 'Tor nach Übersteiger zählt doppelt']],
    tip: 'Lass die Kinder selbst entdecken, warum sich ein Seitenwechsel lohnt. Frag nach einem Tor: „Warum war da so viel Platz?“',
    legend: ['dot', 'pass', 'drib']
  },
  {
    id: 'rondo', cat: 'Passspiel', title: 'Katz und Maus', sub: 'Rondo 3 gegen 1', ort: ['Halle', 'Platz'], min: 12, anim: A_rondo,
    goal: 'Freilaufen und Anbieten: Wer ohne Ball clever steht, macht das Spiel leicht.',
    org: [['Feld', 'Quadrate à 7 × 7 m'], ['Kinder', 'je 4: 3 Mäuse außen, 1 Katze innen'], ['Material', '4 Hütchen je Quadrat']],
    steps: ['Drei Mäuse spielen sich auf den Seiten des Quadrats den Ball zu, die Katze in der Mitte jagt ihn.', '5 Pässe am Stück = 1 Punkt.', 'Nach Ballgewinn oder 45 Sekunden wird gewechselt: Wer den Ball verloren hat, wird Katze.'],
    coaching: ['Anbieten: Lauf so, dass zwischen dir und dem Ball keine Katze steht.', 'Ball mit dem Fuß annehmen, der weiter vom Gegner weg ist, offen zum Spiel.', 'Flach und fest passen, mit der Innenseite.'],
    vars: [['Schwerer', 'Maximal 2 Ballkontakte'], ['Fuß', 'Nur mit dem schwachen Fuß passen'], ['Profis', '4 gegen 2 auf 9 × 9 m']],
    tip: 'Frag statt zu sagen: „Wo musst du hinlaufen, damit dein Mitspieler dich sieht?“ Selbst gefundene Lösungen bleiben hängen.',
    legend: ['dot']
  },
  {
    id: 'doppelpass', cat: 'Torschuss', title: 'Doppelpass & Abschluss', ort: ['Halle', 'Platz'], min: 8, anim: A_abschluss,
    goal: 'Pass & Go und flach ins Eck.',
    org: [['Feld', 'beide Tore'], ['Kinder', 'je Tor 6: Torwart, Wandspieler, 4 Schützen'], ['Material', 'Tore, 6 Bälle je Tor']],
    steps: ['Schütze dribbelt an und passt auf den Wandspieler an der Seite.', 'Sofort steil starten, der Wandspieler legt den Ball in den Lauf zurück.', 'Direkt oder nach einem Kontakt flach aufs Tor schießen.', 'Rotation: Schütze wird Wandspieler, Wandspieler stellt sich an. Torwart wechselt alle 2 Minuten.'],
    coaching: ['Nach dem Pass sofort losrennen, nicht stehen bleiben und zuschauen.', 'Schuss mit dem Spann: Fußspitze runter, Oberkörper über den Ball.', 'Flach ins Eck ist schwerer zu halten als hart in die Mitte.'],
    vars: [['Wettkampf', 'Welches Tor trifft in 2 Minuten öfter?'], ['Fuß', 'Wandspieler auf die andere Seite: Abschluss mit dem schwachen Fuß']],
    tip: 'Der Nächste startet, sobald der Ball geschossen ist.',
    legend: ['dot', 'pass', 'run', 'drib', 'shot']
  }
];

export const drillById = id => DRILLS.find(d => d.id === id);
