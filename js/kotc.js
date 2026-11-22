// King of the Court: Rotation, Punkte pro Kind, Rangliste und Team-Generator mit Konstellations-Gedächtnis.
// Reine Logik ohne Oberfläche.

export const TEAM_COLORS = [
  { n: 'Rot', c: '#EC4452' },
  { n: 'Blau', c: '#3A82FF' },
  { n: 'Gelb', c: '#FFC83D' },
  { n: 'Grün', c: '#2CC46E' }
];

export const POINTS = { win: 3, draw: 1, goal: 1, assist: 1 };

/** Eindeutiger Schlüssel einer Teamzusammensetzung (Reihenfolge egal) */
export const teamKey = team => [...team].sort((a, b) => a.localeCompare(b, 'de')).join('|');
const pairKey = (a, b) => (a < b ? a + '|' + b : b + '|' + a);

/** Anzahl Teams: möglichst Viererteams, mindestens 2 */
export const teamCount = n => Math.max(2, Math.min(4, Math.round(n / 4)));

function sizes(n, k) {
  const base = Math.floor(n / k), extra = n % k;
  return Array.from({ length: k }, (_, i) => base + (i < extra ? 1 : 0));
}

/** Alle festgelegten Teams aus früheren Spieltagen */
export function pastTeams(kotc, exceptId) {
  const out = [];
  for (const [sid, d] of Object.entries(kotc || {})) {
    if (sid === exceptId || !d || !d.locked || !d.teams) continue;
    d.teams.forEach(t => out.push(t));
  }
  return out;
}

/** Bewertet eine Aufteilung: Wiederholungen ganzer Teams, wiederholte Paare, Stärke-Unterschiede */
export function scoreTeams(teams, past, strength) {
  const used = new Set(past.map(teamKey));
  const pairs = {};
  past.forEach(t => { for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) { const k = pairKey(t[i], t[j]); pairs[k] = (pairs[k] || 0) + 1; } });
  let repeats = 0, pairSum = 0;
  teams.forEach(t => {
    if (used.has(teamKey(t))) repeats++;
    for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) pairSum += pairs[pairKey(t[i], t[j])] || 0;
  });
  let spread = 0;
  if (strength) {
    const avgs = teams.map(t => t.reduce((a, n) => a + (strength[n] || 0), 0) / Math.max(1, t.length));
    spread = Math.max(...avgs) - Math.min(...avgs);
  }
  return { repeats, pairSum, spread, cost: repeats * 1000 + pairSum * 4 + spread * 1.5 };
}

/**
 * Teams bilden: keine bereits gespielte Konstellation, so wenig wiederholte Paare wie möglich,
 * dazu möglichst ausgeglichen nach bisherigen Punkten. Erst wenn es nicht anders geht, wiederholt sich ein Team.
 */
export function makeTeams(players, past, strength, iters) {
  const list = [...players];
  const k = teamCount(list.length), sz = sizes(list.length, k);
  let best = null;
  const N = iters || 6000;
  for (let it = 0; it < N; it++) {
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    const teams = []; let p = 0;
    sz.forEach(s => { teams.push(list.slice(p, p + s)); p += s; });
    const sc = scoreTeams(teams, past, strength);
    if (!best || sc.cost < best.score.cost) best = { teams: teams.map(t => [...t]), score: sc };
  }
  return best;
}

/** Spielverlauf nachrechnen: wer ist gerade auf dem Feld, wer wartet */
export function replay(day) {
  const n = day.teams ? day.teams.length : 0;
  let on = [0, 1], queue = Array.from({ length: Math.max(0, n - 2) }, (_, i) => i + 2);
  const streak = Array(n).fill(0);
  for (const g of day.games || []) {
    let loser;
    if (g.result === 'a') loser = g.b;
    else if (g.result === 'b') loser = g.a;
    else loser = streak[g.a] >= streak[g.b] ? g.a : g.b; // Unentschieden: wer länger drin ist, geht raus
    const stay = loser === g.a ? g.b : g.a;
    streak[stay]++; streak[loser] = 0;
    queue.push(loser);
    const next = queue.shift();
    streak[next] = 0;
    on = [stay, next];
  }
  return { on, queue, streak };
}

export const goalValue = g => (g.double ? 2 : 1);
export function score(goals, a, b) {
  let sa = 0, sb = 0;
  (goals || []).forEach(g => { if (g.team === a) sa += goalValue(g); else if (g.team === b) sb += goalValue(g); });
  return [sa, sb];
}

/** Punkte jedes Kindes an einem Spieltag */
export function dayStats(day) {
  const st = {};
  const row = n => (st[n] = st[n] || { name: n, pts: 0, s: 0, u: 0, n: 0, g: 0, a: 0, sp: 0 });
  (day.teams || []).flat().forEach(row);
  for (const g of day.games || []) {
    const ta = day.teams[g.a] || [], tb = day.teams[g.b] || [];
    ta.concat(tb).forEach(n => row(n).sp++);
    if (g.result === 'a') { ta.forEach(n => { row(n).s++; row(n).pts += POINTS.win; }); tb.forEach(n => row(n).n++); }
    else if (g.result === 'b') { tb.forEach(n => { row(n).s++; row(n).pts += POINTS.win; }); ta.forEach(n => row(n).n++); }
    else { ta.concat(tb).forEach(n => { row(n).u++; row(n).pts += POINTS.draw; }); }
    (g.goals || []).forEach(x => {
      const v = goalValue(x);
      row(x.by).g += v; row(x.by).pts += v * POINTS.goal;
      if (x.ast) { row(x.ast).a++; row(x.ast).pts += POINTS.assist; }
    });
  }
  return st;
}

/** Sortieren und Plätze vergeben (bei Gleichstand gleicher Platz) */
export function rank(statsObj) {
  const rows = Object.values(statsObj).filter(r => r.sp > 0 || r.pts > 0);
  rows.sort((x, y) => y.pts - x.pts || y.g - x.g || y.s - x.s || y.a - x.a || x.name.localeCompare(y.name, 'de'));
  let place = 0, prev = null;
  rows.forEach((r, i) => {
    const same = prev && prev.pts === r.pts && prev.g === r.g && prev.s === r.s && prev.a === r.a;
    if (!same) place = i + 1;
    r.place = place; prev = r;
  });
  return rows;
}

/** Alle Spieltage mit mindestens einem Spiel, nach Datum */
export function weeks(kotc, dateOf) {
  return Object.entries(kotc || {})
    .filter(([, d]) => d && d.locked && d.games && d.games.length)
    .map(([sid, d]) => ({ sid, date: dateOf(sid), day: d }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Gesamtwertung über mehrere Spieltage */
export function totals(weekList) {
  const st = {};
  weekList.forEach(w => {
    Object.values(dayStats(w.day)).forEach(r => {
      if (!r.sp && !r.pts) return;
      const t = (st[r.name] = st[r.name] || { name: r.name, pts: 0, s: 0, u: 0, n: 0, g: 0, a: 0, sp: 0, wo: 0 });
      ['pts', 's', 'u', 'n', 'g', 'a', 'sp'].forEach(k => { t[k] += r[k]; });
      t.wo++;
    });
  });
  return st;
}
