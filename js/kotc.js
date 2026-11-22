// King of the Court mit wechselnden Teams: jedes Spiel neue Viererteams,
// alle Kinder bekommen möglichst gleich viel Spielzeit, keine Viererkombination
// wiederholt sich, bevor alle anderen durch sind. Reine Logik ohne Oberfläche.

export const SIDES = [
  { n: 'Rot', c: '#EC4452' },
  { n: 'Blau', c: '#3A82FF' }
];
export const POINTS = { win: 3, draw: 1, goal: 1, assist: 1 };
export const PER_TEAM = 4;

export const teamKey = team => [...team].sort((a, b) => a.localeCompare(b, 'de')).join('|');
const pairKey = (a, b) => (a < b ? a + '|' + b : b + '|' + a);

/** Alte Speicherform (feste Tagesteams) in die neue umwandeln */
export function migrate(day) {
  if (!day || !day.teams || !Array.isArray(day.games)) return day;
  day.games = day.games.map(g => (g.teams ? g : {
    teams: [day.teams[g.a] || [], day.teams[g.b] || []],
    bench: [], result: g.result,
    goals: (g.goals || []).map(x => Object.assign({}, x, { team: x.team === g.a ? 0 : 1 }))
  }));
  delete day.teams; delete day.locked;
  day.cur = { goals: [] };
  return day;
}

/** Alle bisher gespielten Viererteams (alle Wochen) */
export function playedTeams(kotc) {
  const out = [];
  Object.values(kotc || {}).forEach(d => (d && d.games || []).forEach(g => (g.teams || []).forEach(t => out.push(t))));
  return out;
}

/** Wer spielt als Nächstes: die Kinder mit den wenigsten Spielen heute, bei Gleichstand wer am längsten wartet */
export function pickPlayers(pool, day) {
  const cnt = {}, last = {};
  pool.forEach(n => { cnt[n] = 0; last[n] = -1; });
  (day.games || []).forEach((g, i) => g.teams.flat().forEach(n => { if (n in cnt) { cnt[n]++; last[n] = i; } }));
  const order = pool.map(n => ({ n, c: cnt[n], l: last[n], r: Math.random() }))
    .sort((a, b) => a.c - b.c || a.l - b.l || a.r - b.r);
  const k = Math.min(pool.length, PER_TEAM * 2);
  return { play: order.slice(0, k).map(o => o.n), bench: order.slice(k).map(o => o.n) };
}

/** Bewertung einer Aufteilung: ganze Teams schon gespielt, Paare schon zusammen, Stärke-Unterschied */
export function scoreSplit(teams, history, today, strength) {
  const used = new Set(history.map(teamKey));
  const pairs = {};
  const addPairs = (t, w) => { for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) { const k = pairKey(t[i], t[j]); pairs[k] = (pairs[k] || 0) + w; } };
  history.forEach(t => addPairs(t, 1));
  today.forEach(t => addPairs(t, 3)); // heute schon zusammen gespielt zählt stärker
  let repeats = 0, pairSum = 0;
  teams.forEach(t => {
    if (used.has(teamKey(t))) repeats++;
    for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) pairSum += pairs[pairKey(t[i], t[j])] || 0;
  });
  let spread = 0;
  if (strength) {
    const avg = t => t.reduce((a, n) => a + (strength[n] || 0), 0) / Math.max(1, t.length);
    spread = Math.abs(avg(teams[0]) - avg(teams[1]));
  }
  return { repeats, pairSum, spread, cost: repeats * 1000 + pairSum * 2 + spread * 1.5 };
}

/** Nächstes Spiel zusammenstellen */
export function makeGame(pool, day, kotc, strength, iters) {
  const { play, bench } = pickPlayers(pool, day);
  const history = playedTeams(kotc);
  const today = (day.games || []).flatMap(g => g.teams);
  const list = [...play], half = Math.ceil(list.length / 2);
  let best = null;
  for (let it = 0; it < (iters || 3000); it++) {
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    const teams = [list.slice(0, half), list.slice(half)];
    const sc = scoreSplit(teams, history, today, strength);
    if (!best || sc.cost < best.score.cost) best = { teams: teams.map(t => [...t]), bench: [...bench], score: sc };
  }
  return best;
}

export const goalValue = g => (g.double ? 2 : 1);
export function score(goals) {
  const s = [0, 0];
  (goals || []).forEach(g => { s[g.team] += goalValue(g); });
  return s;
}

/** Punkte jedes Kindes an einem Spieltag */
export function dayStats(day) {
  const st = {};
  const row = n => (st[n] = st[n] || { name: n, pts: 0, s: 0, u: 0, n: 0, g: 0, a: 0, sp: 0 });
  for (const g of day.games || []) {
    const [ta, tb] = g.teams;
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
    .filter(([, d]) => d && d.games && d.games.length)
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
