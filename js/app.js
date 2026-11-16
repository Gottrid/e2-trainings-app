// E2 Training – App-Logik: Routing, Ansichten, Trainingsmodus, Hallen-Liga, Kader, Feedback
import { Diagram, live, injectDefs, COL } from './engine.js';
import { DRILLS, drillById, CATS } from './drills.js';
import { SESSIONS } from './sessions.js';

injectDefs();
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const view = $('view');

/* ---------- Speicher (nur auf diesem Gerät) ---------- */
const KEY = 'e2app-v1';
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* privat-Modus */ } }
const S = Object.assign({ kader: [], att: {}, liga: {}, checks: {}, notes: {}, rate: {} }, load());

/* ---------- Icons ---------- */
const I = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>',
  restart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4"/></svg>',
  drop: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5S5 10.2 5 14.6A7 7 0 0 0 19 14.6C19 10.2 12 2.5 12 2.5z"/></svg>',
  crown: '<svg class="crown" viewBox="0 0 16 12" fill="#FFC83D"><path d="M0 3l4 3 4-6 4 6 4-3-2 9H2z"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  go: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.5 5v14L19 12z"/><rect x="4.5" y="5" width="2.5" height="14"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11v9H4v-9zM7 11l4-7c1.5 0 2.5 1 2.2 2.6L12.6 10H19a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 17.8 20H7"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 13V4h3v9zM17 13l-4 7c-1.5 0-2.5-1-2.2-2.6l.6-3.4H5a2 2 0 0 1-2-2.3l1.2-6A2 2 0 0 1 6.2 4H17"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};
const LEG = {
  dot: '<span><i class="lg-dot" style="background:#3A82FF"></i>Spieler mit Nummer</span>',
  pass: '<span><i class="lg-line"></i>Pass</span>', run: '<span><i class="lg-dash"></i>Laufweg</span>',
  drib: '<span><i class="lg-wave"></i>Dribbling</span>', shot: '<span><i class="lg-shot"></i>Torschuss</span>',
  trail: '<span><i class="lg-dash"></i>Dribbel-Spur</span>'
};

/* ---------- Hilfen ---------- */
const fmtMin = m => m + "'";
const mmss = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const dObj = d => new Date(d + 'T12:00:00');
const fmtDate = (d, o) => dObj(d).toLocaleDateString('de-DE', o || { weekday: 'short', day: 'numeric', month: 'long' });
const todayStr = () => { const n = new Date(); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0'); };
const sessionById = id => SESSIONS.find(s => s.id === id);
const sorted = () => [...SESSIONS].sort((a, b) => b.date.localeCompare(a.date));
function nextSession() {
  const t = todayStr();
  const up = [...SESSIONS].filter(s => s.date >= t).sort((a, b) => a.date.localeCompare(b.date));
  return up[0] || sorted()[0];
}
function items(s) {
  let t = 0, no = 0;
  return s.plan.map((p, i) => {
    let it;
    if (p.pause) it = { pause: true, min: p.pause, notes: p.notes || [], c: COL.blue, title: 'Trinkpause', cat: 'Pause' };
    else { const d = drillById(p.d); if (!d) throw new Error('Übung fehlt: ' + p.d); it = Object.assign({}, d, { min: p.min || d.min, c: CATS[d.cat], no: ++no }); }
    it.start = t; it.idx = i; t += it.min;
    return it;
  });
}
const total = s => s.plan.reduce((a, p) => a + (p.pause || p.min || drillById(p.d).min), 0);
let toastT = null;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { ok = false; } ta.remove(); return ok;
  }
}

/* ---------- Ton ---------- */
let AC = null;
function audio() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; } return AC; }
function beep(n) {
  n = n || 1; const ac = audio();
  if (ac) for (let i = 0; i < n; i++) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = 'square'; o.frequency.value = (n > 1 && i === n - 1) ? 1320 : 880;
    const t0 = ac.currentTime + i * .3; g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.22, t0 + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + .24);
    o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + .26);
  }
  try { if (navigator.vibrate) navigator.vibrate(n > 1 ? [200, 100, 200, 100, 400] : [150]); } catch (e) { /* egal */ }
}

/* ---------- Diagramme in der Ansicht ---------- */
let viewDiagrams = [], io = null;
function mountDiagram(svg, anim, opts) {
  const d = new Diagram(svg, anim);
  d.visible = false; live.add(d); viewDiagrams.push(d);
  if (opts && opts.paused) d.playing = false;
  if (io) io.observe(svg); else d.visible = true;
  svg._d = d;
  return d;
}
function cleanupView() {
  viewDiagrams.forEach(d => live.delete(d)); viewDiagrams = [];
  if (io) io.disconnect();
  io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.target._d) e.target._d.visible = e.isIntersecting; }), { threshold: .05 }) : null;
}

/* ---------- Kopfzeile ---------- */
function setTop(back) {
  $('topIn').innerHTML = back
    ? `<a class="back" href="${back[0]}">${I.back}${esc(back[1])}</a><a class="brand" href="#start" style="margin-right:0" aria-label="Zur Startseite"><img src="icons/icon.svg" alt=""></a>`
    : `<a class="brand" href="#start"><img src="icons/icon.svg" alt=""><b>E2 <span>Training</span></b></a>`;
}
function setTab(tab) { document.querySelectorAll('.tabs a').forEach(a => { if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }); }

/* ================= Startseite ================= */
function viewHome() {
  setTop(); setTab('start');
  const s = nextSession();
  if (!s) { view.innerHTML = '<div class="empty" style="margin-top:24px">Noch keine Einheit angelegt.</div>'; return; }
  const its = items(s);
  const cover = (s.cover && drillById(s.cover)) || its.find(i => !i.pause && i.cat !== 'Aufwärmen') || its.find(i => !i.pause);
  const isToday = s.date === todayStr();
  const counts = {}; DRILLS.forEach(d => { counts[d.cat] = (counts[d.cat] || 0) + 1; });
  view.innerHTML = `
    <section class="hero" style="padding-bottom:0">
      <div class="eyebrow">${isToday ? 'Heute' : s.date > todayStr() ? 'Nächstes Training' : 'Letztes Training'} <i class="dot"></i> ${esc(fmtDate(s.date, { weekday: 'long', day: 'numeric', month: 'long' }))}</div>
    </section>
    <article class="next">
      <div class="next-art"><svg role="img" aria-label="Animierte Grafik: ${esc(cover.title)}"></svg><span class="badge">${esc(s.ort)}</span></div>
      <div class="next-body">
        <div class="cat" style="--c:var(--accent)">Thema: ${esc(s.theme)}</div>
        <h2>${esc(s.title)}</h2>
        <p>${esc(s.intro)}</p>
        <div class="facts"><div class="fact"><b>${total(s)}</b><span>Minuten</span></div><div class="fact"><b>${its.filter(i => !i.pause).length}</b><span>Stationen</span></div><div class="fact"><b>${s.kinder}</b><span>Kinder</span></div></div>
        <div class="cta-row"><a class="btn btn-primary" href="#einheit-${s.id}">Einheit öffnen</a><button class="btn btn-ghost" type="button" id="homeStart">${I.play}Trainingsmodus</button></div>
      </div>
    </article>
    <div class="sec-title"><h2>Alle Einheiten</h2><span>${SESSIONS.length} ${SESSIONS.length === 1 ? 'Einheit' : 'Einheiten'}</span></div>
    <div class="list">${sorted().map(x => sessionRow(x)).join('')}</div>
    <div class="sec-title"><h2>Übungsbibliothek</h2><a href="#uebungen">Alle ${DRILLS.length} ansehen</a></div>
    <div class="catgrid">${Object.keys(CATS).filter(c => counts[c]).map(c => `<a class="catcard" href="#uebungen" data-cat="${esc(c)}" style="--c:${CATS[c]}"><span>${esc(c)}</span><b>${counts[c]}</b></a>`).join('')}</div>
    <footer class="foot"><span>E2 Training · Version 1.0</span><span>Jede Woche eine neue Einheit</span></footer>`;
  mountDiagram(view.querySelector('.next-art svg'), cover.anim);
  $('homeStart').addEventListener('click', () => tmOpen(s.id));
  view.querySelectorAll('.catcard').forEach(a => a.addEventListener('click', () => { libFilter = a.dataset.cat; }));
}
function sessionRow(s) {
  const its = items(s), sum = total(s);
  const d = dObj(s.date);
  return `<a class="srow" href="#einheit-${s.id}">
    <div class="sdate"><b>${d.getDate()}</b><span>${esc(d.toLocaleDateString('de-DE', { month: 'short' }).replace('.', ''))}</span></div>
    <div><h3>${esc(s.title)}</h3><p>${esc(s.theme)} · ${esc(s.ort)} · ${sum} Min${S.notes[s.id] && S.notes[s.id].stars ? ' · ' + '★'.repeat(S.notes[s.id].stars) : ''}</p>
      <div class="mini">${its.map(i => `<i style="--d:${i.min};--c:${i.pause ? '#2a4068' : i.c}"></i>`).join('')}</div></div>
    <span class="go">${I.go}</span></a>`;
}

/* ================= Einheit ================= */
function viewSession(id) {
  const s = sessionById(id);
  if (!s) { location.hash = '#start'; return; }
  setTop(['#start', 'Übersicht']); setTab('start');
  const its = items(s), sum = total(s);
  const h1 = s.h1 ? `${esc(s.h1[0])}<em>${esc(s.h1[1])}</em>` : esc(s.title);
  const ticks = []; for (let m = 0; m <= sum; m += 15) ticks.push(m);
  view.innerHTML = `
    <section class="hero">
      <div><div class="eyebrow">${esc(s.ort)}training <i class="dot"></i> ${esc(fmtDate(s.date))}</div><h1>${h1}</h1></div>
      <p class="sub">Thema: <b>${esc(s.theme)}.</b> ${esc(s.intro)}</p>
      <div class="facts"><div class="fact"><b>${sum}</b><span>Minuten</span></div><div class="fact"><b>${s.kinder}</b><span>Kinder</span></div><div class="fact"><b>${its.filter(i => !i.pause).length}</b><span>Stationen</span></div></div>
      <div class="cta-row"><button class="btn btn-primary" type="button" id="startTM">${I.play}Training starten</button></div>
      ${s.ansage ? `<blockquote class="speech"><small>Ansage zum Start</small>${esc(s.ansage)}</blockquote>` : ''}
    </section>
    <section class="tl-wrap" aria-label="Ablauf">
      <div class="tl-title"><h3>Ablauf</h3><span>Tippen springt zur Station</span></div>
      <nav class="tl">${its.map(it => it.pause
    ? `<a class="pause" href="#" data-jump="st-${it.idx}" style="--d:${it.min}" aria-label="Trinkpause, ${it.min} Minuten"></a>`
    : `<a href="#" data-jump="st-${it.idx}" style="--d:${it.min};--c:${it.c}" aria-label="Station ${it.no}: ${esc(it.title)}, ${it.min} Minuten"><b>${it.no}</b><span>${it.min}'</span></a>`).join('')}</nav>
      <div class="ticks">${ticks.map(m => `<span>${m}'</span>`).join('')}</div>
    </section>
    <section class="att" id="att"></section>
    <div id="stations"></div>
    ${s.material ? `<section class="box" aria-labelledby="matH"><h2 id="matH">Materialcheck</h2><p>Abhaken beim Packen.</p><div class="checks" id="checks"></div></section>` : ''}
    <section class="box" aria-labelledby="fbH" id="feedback"><h2 id="fbH">Wie lief's?</h2><p>Nach dem Training kurz bewerten. Die Rückmeldung kannst du kopieren und mir schicken, dann passe ich die nächste Einheit an.</p>
      <div class="stars" id="stars" role="group" aria-label="Bewertung">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-n="${n}" aria-label="${n} von 5 Sternen">${I.star}</button>`).join('')}</div>
      <label for="note" style="display:block;color:var(--muted);font-size:14px;margin-bottom:6px">Notizen (Was hat geklappt? Wer ist aufgefallen?)</label>
      <textarea id="note" placeholder="z. B. Duell-Arena super, Pass-Jagd zu wild …"></textarea>
      <div class="row" style="margin-top:10px"><button type="button" class="smallbtn" id="copyFb">Rückmeldung kopieren</button></div>
    </section>`;
  // Stationen
  const st = $('stations');
  its.forEach(it => {
    if (it.pause) {
      st.insertAdjacentHTML('beforeend', `<section class="pause-band" id="st-${it.idx}">${I.drop}<div><h2>Trinkpause · ${it.min} Min</h2><p>${it.notes.slice(1).map(esc).join(' ')}</p></div><div class="dur"><span>${fmtMin(it.start)}–${fmtMin(it.start + it.min)}</span></div></section>`);
      return;
    }
    st.insertAdjacentHTML('beforeend', drillCard(it, { no: it.no, time: [it.start, it.start + it.min], id: 'st-' + it.idx, rate: s.id }));
    const card = $('st-' + it.idx);
    wireCard(card, it);
    if (it.liga) mountLiga(card.querySelector('.liga-mount'), s);
    const r = card.querySelector('.rate');
    r.addEventListener('click', e => {
      const b = e.target.closest('button[data-v]'); if (!b) return;
      S.rate[s.id] = S.rate[s.id] || {};
      S.rate[s.id][it.idx] = S.rate[s.id][it.idx] === b.dataset.v ? null : b.dataset.v; save();
      r.querySelectorAll('button[data-v]').forEach(x => x.setAttribute('aria-pressed', S.rate[s.id][it.idx] === x.dataset.v));
    });
  });
  view.querySelectorAll('[data-jump]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); const t = $(a.dataset.jump); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  $('startTM').addEventListener('click', () => tmOpen(s.id));
  renderAtt(s);
  // Material
  if (s.material) {
    const ch = (S.checks[s.id] = S.checks[s.id] || {});
    const box = $('checks');
    box.innerHTML = s.material.map((m, i) => `<label class="check${ch[i] ? ' on' : ''}" for="mc${i}"><input type="checkbox" id="mc${i}" ${ch[i] ? 'checked' : ''}><span><b>${esc(m[0])}×</b>${esc(m[1])}</span></label>`).join('');
    box.addEventListener('change', e => { const i = +e.target.id.slice(2); ch[i] = e.target.checked; e.target.closest('.check').classList.toggle('on', e.target.checked); save(); });
  }
  // Feedback
  const fb = (S.notes[s.id] = S.notes[s.id] || { stars: 0, text: '' });
  const stars = $('stars'), note = $('note');
  const paint = () => stars.querySelectorAll('button').forEach(b => { b.classList.toggle('on', +b.dataset.n <= fb.stars); b.setAttribute('aria-pressed', +b.dataset.n === fb.stars); });
  paint(); note.value = fb.text || '';
  stars.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; fb.stars = fb.stars === +b.dataset.n ? 0 : +b.dataset.n; save(); paint(); });
  note.addEventListener('input', () => { fb.text = note.value; save(); });
  $('copyFb').addEventListener('click', async () => {
    const r = S.rate[s.id] || {};
    const good = its.filter(i => r[i.idx] === 'up').map(i => i.title), bad = its.filter(i => r[i.idx] === 'down').map(i => i.title);
    const present = Object.values(S.att[s.id] || {}).filter(Boolean).length;
    const txt = [`Rückmeldung Training ${fmtDate(s.date, { day: '2-digit', month: '2-digit', year: 'numeric' })} – ${s.title}`,
      fb.stars ? `Bewertung: ${'★'.repeat(fb.stars)}${'☆'.repeat(5 - fb.stars)} (${fb.stars}/5)` : 'Bewertung: –',
      present ? `Anwesend: ${present} Kinder` : null,
      good.length ? `Gut: ${good.join(', ')}` : null,
      bad.length ? `Nicht so gut: ${bad.join(', ')}` : null,
      fb.text ? `Notiz: ${fb.text}` : null].filter(Boolean).join('\n');
    toast((await copy(txt)) ? 'Rückmeldung kopiert' : 'Kopieren nicht möglich');
  });
}

function drillCard(it, o) {
  const r = o.rate ? ((S.rate[o.rate] || {})[it.idx] || null) : null;
  return `<article class="drill" id="${o.id}" style="--c:${it.c}">
    <div class="dh">${o.no ? `<div class="no">${o.no}</div>` : '<div></div>'}<div><div class="cat">${esc(it.cat)}${it.sub ? ' · ' + esc(it.sub) : ''}</div><h2>${esc(it.title)}</h2><p class="goal">${esc(it.goal)}</p></div>
      <div class="dur"><b>${it.min}'</b>${o.time ? `<span>${fmtMin(o.time[0])}–${fmtMin(o.time[1])}</span>` : `<span>${esc(it.ort.join(' · '))}</span>`}</div></div>
    <div class="stage"><svg role="img" aria-label="Animierte Grafik: ${esc(it.title)}"></svg></div>
    <div class="legend">${it.legend.map(k => LEG[k]).join('')}<div class="ctrl"><button type="button" class="b-restart" aria-label="Animation neu starten">${I.restart}</button><button type="button" class="b-speed" aria-label="Geschwindigkeit umschalten">1×</button><button type="button" class="b-play" aria-label="Animation pausieren">${I.pause}</button></div></div>
    <div class="db">
      <div class="main">
        <dl class="org">${it.org.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        <div class="blk"><h3>So geht's</h3><ol class="steps">${it.steps.map(x => `<li><span>${esc(x)}</span></li>`).join('')}</ol>
          ${it.rounds ? `<div class="rounds">${it.rounds.map(x => `<span><b>${esc(x[0])}</b>${esc(x[1])}</span>`).join('')}</div>` : ''}</div>
      </div>
      <div class="side">
        <div class="blk"><h3>Coaching-Punkte</h3><ul class="coach">${it.coaching.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="blk"><h3>Varianten</h3><div class="vars">${it.vars.map(v => `<div><b>${esc(v[0])}</b><span>${esc(v[1])}</span></div>`).join('')}</div></div>
        ${it.tip ? `<div class="tip"><b>Trainer-Kniff</b>${esc(it.tip)}</div>` : ''}
      </div>
    </div>
    ${it.liga && o.rate ? '<div class="liga-mount"></div>' : ''}
    ${o.rate ? `<div class="rate"><span>Hat die Übung funktioniert?</span><button type="button" class="up" data-v="up" aria-pressed="${r === 'up'}">${I.up}Gut</button><button type="button" class="down" data-v="down" aria-pressed="${r === 'down'}">${I.down}Nicht so</button></div>` : ''}
  </article>`;
}
function wireCard(card, it) {
  const d = mountDiagram(card.querySelector('.stage svg'), it.anim);
  const bp = card.querySelector('.b-play'), bs = card.querySelector('.b-speed'), br = card.querySelector('.b-restart');
  const sync = () => { bp.innerHTML = d.playing ? I.pause : I.play; bp.setAttribute('aria-label', d.playing ? 'Animation pausieren' : 'Animation abspielen'); };
  sync();
  bp.addEventListener('click', () => { d.playing = !d.playing; sync(); });
  bs.addEventListener('click', () => { d.speed = d.speed === 1 ? .5 : 1; bs.textContent = d.speed === 1 ? '1×' : '½×'; });
  br.addEventListener('click', () => { d.render(0); if (!d.playing) { d.playing = true; sync(); } });
}

/* ---------- Anwesenheit ---------- */
function renderAtt(s) {
  const box = $('att');
  if (!S.kader.length) {
    box.innerHTML = `<div class="att-head"><h2>Anwesenheit</h2></div><p style="margin:0;color:var(--muted)">Trag einmal deinen Kader ein, dann kannst du hier abhaken, wer da ist. Die Teams für das Spiel werden aus den Anwesenden gelost.</p><div class="row" style="margin-top:12px"><a class="smallbtn" href="#kader" style="text-decoration:none">Kader anlegen</a></div>`;
    return;
  }
  const a = (S.att[s.id] = S.att[s.id] || {});
  const n = S.kader.filter(k => a[k]).length;
  box.innerHTML = `<div class="att-head"><h2>Anwesenheit</h2><span><b>${n}</b> / ${S.kader.length} da</span></div>
    <div class="names">${S.kader.map(k => `<button type="button" aria-pressed="${!!a[k]}" data-k="${esc(k)}">${esc(k)}</button>`).join('')}</div>
    <div class="row" style="margin-top:10px"><button type="button" class="smallbtn alt" id="attAll">Alle da</button></div>`;
  box.querySelector('.names').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; a[b.dataset.k] = !a[b.dataset.k]; save(); renderAtt(s); });
  $('attAll').addEventListener('click', () => { S.kader.forEach(k => { a[k] = true; }); save(); renderAtt(s); });
}

/* ---------- Hallen-Liga ---------- */
const TEAMS = { rot: { n: 'Rot', c: COL.red }, blau: { n: 'Blau', c: COL.blue }, gelb: { n: 'Gelb', c: COL.yellow } };
const GAMES = [['rot', 'blau', 'gelb'], ['gelb', 'rot', 'blau'], ['blau', 'gelb', 'rot'], ['rot', 'blau', 'gelb'], ['gelb', 'rot', 'blau'], ['blau', 'gelb', 'rot']];
const GT = { rem: 240, run: false, t0: 0, base: 240, iv: null, out: null, go: null };
function mountLiga(mount, s) {
  const st = (S.liga[s.id] = S.liga[s.id] || { teams: null, scores: [null, null, null, null, null, null] });
  const startMin = items(s).find(i => i.liga).start;
  const div = document.createElement('div'); div.className = 'liga';
  div.innerHTML = `<div class="liga-head"><div><h3>Hallen-Liga</h3><p>Ergebnisse eintippen, die Tabelle rechnet mit. Sieg 3, Unentschieden 1 Punkt.</p></div>
      <div class="gt" aria-label="Spieluhr"><output class="gtOut">4:00</output><button type="button" class="go gtGo">Anpfiff</button><button type="button" class="gtReset" aria-label="Spieluhr zurücksetzen">${I.restart}</button></div></div>
    <div class="teams"></div>
    <div class="row"><button type="button" class="smallbtn drawBtn">Teams auslosen</button><button type="button" class="smallbtn alt resetBtn">Ergebnisse löschen</button></div>
    <div class="lg2"><div><h4>Spielplan</h4><ol class="games"></ol></div><div><h4>Tabelle</h4><table class="tab"></table></div></div>`;
  mount.replaceWith(div);
  const q = c => div.querySelector(c);
  const pool = () => { const a = S.att[s.id] || {}; const pres = S.kader.filter(k => a[k]); return pres.length ? pres : S.kader.length ? S.kader.slice() : Array.from({ length: s.kinder || 12 }, (_, i) => 'Kind ' + (i + 1)); };
  function renderTeams() {
    const ex = !st.teams;
    const t = st.teams || { rot: [], blau: [], gelb: [] };
    if (ex) pool().forEach((n, i) => t[Object.keys(TEAMS)[i % 3]].push(n));
    q('.teams').innerHTML = Object.keys(TEAMS).map(k => `<div class="team" style="--tc:${TEAMS[k].c}"><h4>Team ${TEAMS[k].n}</h4><ul>${t[k].map(n => `<li>${esc(n)}</li>`).join('')}</ul>${ex ? '<div class="example">Vorschlag, „Teams auslosen“ mischt neu</div>' : ''}</div>`).join('');
  }
  function renderGames() {
    q('.games').innerHTML = GAMES.map((g, i) => {
      const sc = st.scores[i];
      return `<li class="game${sc ? ' done' : ''}"><div class="top2"><b>Spiel ${i + 1}</b><span>${fmtMin(startMin + i * 5)}–${fmtMin(startMin + 4 + i * 5)} · Pause: ${TEAMS[g[2]].n}</span></div>
      <div class="score"><span class="tn" style="--tc:${TEAMS[g[0]].c}"><i></i>${TEAMS[g[0]].n}</span>
        <span class="step"><button type="button" data-g="${i}" data-s="0" data-d="-1" aria-label="Tor ${TEAMS[g[0]].n} abziehen">−</button><output>${sc ? sc[0] : '–'}</output><button type="button" data-g="${i}" data-s="0" data-d="1" aria-label="Tor für ${TEAMS[g[0]].n}">+</button></span>
        <span class="colon">:</span>
        <span class="step"><button type="button" data-g="${i}" data-s="1" data-d="-1" aria-label="Tor ${TEAMS[g[1]].n} abziehen">−</button><output>${sc ? sc[1] : '–'}</output><button type="button" data-g="${i}" data-s="1" data-d="1" aria-label="Tor für ${TEAMS[g[1]].n}">+</button></span>
        <span class="tn r" style="--tc:${TEAMS[g[1]].c}">${TEAMS[g[1]].n}<i></i></span></div></li>`;
    }).join('');
    const T = {}; Object.keys(TEAMS).forEach(k => { T[k] = { k, sp: 0, tf: 0, tg: 0, p: 0 }; });
    GAMES.forEach((g, i) => { const sc = st.scores[i]; if (!sc) return; const A = T[g[0]], B = T[g[1]]; A.sp++; B.sp++; A.tf += sc[0]; A.tg += sc[1]; B.tf += sc[1]; B.tg += sc[0]; if (sc[0] > sc[1]) A.p += 3; else if (sc[1] > sc[0]) B.p += 3; else { A.p++; B.p++; } });
    const rows = Object.values(T).sort((x, y) => y.p - x.p || (y.tf - y.tg) - (x.tf - x.tg) || y.tf - x.tf);
    const any = rows.some(r => r.sp > 0);
    q('.tab').innerHTML = '<thead><tr><th>Team</th><th>Sp</th><th>Tore</th><th>Pkt</th></tr></thead><tbody>' + rows.map((r, i) => `<tr class="${any && i === 0 ? 'lead' : ''}"><td><span class="tn" style="--tc:${TEAMS[r.k].c}"><i></i>${TEAMS[r.k].n}${any && i === 0 ? I.crown : ''}</span></td><td>${r.sp}</td><td>${r.tf}:${r.tg}</td><td class="pts">${r.p}</td></tr>`).join('') + '</tbody>';
  }
  q('.games').addEventListener('click', e => { const b = e.target.closest('button[data-g]'); if (!b) return; const i = +b.dataset.g, si = +b.dataset.s, d = +b.dataset.d; const sc = st.scores[i] || [0, 0]; sc[si] = Math.max(0, sc[si] + d); st.scores[i] = sc; save(); renderGames(); });
  q('.drawBtn').addEventListener('click', () => { const list = pool(); for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } const t = { rot: [], blau: [], gelb: [] }; list.forEach((n, i) => t[Object.keys(t)[i % 3]].push(n)); st.teams = t; save(); renderTeams(); toast('Teams ausgelost'); });
  q('.resetBtn').addEventListener('click', () => { st.scores = [null, null, null, null, null, null]; save(); renderGames(); });
  renderTeams(); renderGames();
  // Spieluhr
  GT.out = q('.gtOut'); GT.go = q('.gtGo');
  gtPaint();
  GT.go.addEventListener('click', () => {
    audio();
    if (GT.rem <= 0 && !GT.run) { GT.rem = 240; }
    if (GT.run) { GT.rem = GT.base - (Date.now() - GT.t0) / 1000; GT.run = false; clearInterval(GT.iv); }
    else { GT.base = GT.rem; GT.t0 = Date.now(); GT.run = true; clearInterval(GT.iv); GT.iv = setInterval(gtTick, 250); }
    gtPaint();
  });
  q('.gtReset').addEventListener('click', () => { GT.run = false; clearInterval(GT.iv); GT.rem = 240; gtPaint(); });
}
function gtTick() {
  if (!GT.run) return;
  const r = GT.base - (Date.now() - GT.t0) / 1000;
  if (r <= 0) { GT.run = false; GT.rem = 0; clearInterval(GT.iv); beep(3); }
  gtPaint();
}
function gtPaint() {
  if (!GT.out || !GT.out.isConnected) return;
  const r = GT.run ? GT.base - (Date.now() - GT.t0) / 1000 : GT.rem;
  GT.out.textContent = mmss(Math.ceil(r));
  GT.out.classList.toggle('end', r <= 0);
  GT.go.textContent = GT.run ? 'Pause' : r <= 0 ? 'Abpfiff!' : r < 240 ? 'Weiter' : 'Anpfiff';
}

/* ================= Bibliothek ================= */
let libFilter = 'Alle';
function viewLibrary() {
  setTop(); setTab('uebungen');
  const cats = ['Alle', ...Object.keys(CATS).filter(c => DRILLS.some(d => d.cat === c))];
  if (!cats.includes(libFilter)) libFilter = 'Alle';
  view.innerHTML = `<section class="hero" style="padding-bottom:0"><div><div class="eyebrow">Übungsbibliothek</div><h1 style="font-size:clamp(46px,11vw,80px)">Übungen</h1></div>
    <p class="sub">Alle Übungen mit animierter Grafik. Tippe eine an für Ablauf, Coaching-Punkte und Varianten.</p></section>
    <div class="filters" role="group" aria-label="Kategorie">${cats.map(c => `<button type="button" data-c="${esc(c)}" aria-pressed="${c === libFilter}" style="--c:${CATS[c] || '#93A3C0'}">${c === 'Alle' ? '' : '<i></i>'}${esc(c)}</button>`).join('')}</div>
    <div class="lib" id="lib"></div>`;
  const paint = () => {
    cleanupView();
    const list = DRILLS.filter(d => libFilter === 'Alle' || d.cat === libFilter);
    $('lib').innerHTML = list.map(d => `<a class="lcard" href="#uebung-${d.id}" style="--c:${CATS[d.cat]}"><div class="art"><svg role="img" aria-label="Animierte Grafik: ${esc(d.title)}" preserveAspectRatio="xMidYMid slice"></svg></div>
      <div class="body"><div class="cat">${esc(d.cat)}${d.sub ? ' · ' + esc(d.sub) : ''}</div><h3>${esc(d.title)}</h3><p>${esc(d.goal)}</p><div class="meta"><span class="chip">${d.min} Min</span>${d.ort.map(o => `<span class="chip">${esc(o)}</span>`).join('')}</div></div></a>`).join('');
    $('lib').querySelectorAll('svg').forEach((svg, i) => mountDiagram(svg, list[i].anim));
    view.querySelectorAll('.filters button').forEach(b => b.setAttribute('aria-pressed', b.dataset.c === libFilter));
  };
  view.querySelector('.filters').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; libFilter = b.dataset.c; paint(); });
  paint();
}
function viewDrill(id) {
  const d = drillById(id);
  if (!d) { location.hash = '#uebungen'; return; }
  setTop(['#uebungen', 'Übungen']); setTab('uebungen');
  const it = Object.assign({}, d, { c: CATS[d.cat] });
  const used = sorted().filter(s => s.plan.some(p => p.d === id));
  view.innerHTML = `<div style="height:6px"></div>${drillCard(it, { id: 'drill-' + id })}
    <div class="sec-title"><h2>Eingesetzt in</h2></div>
    ${used.length ? `<div class="list">${used.map(sessionRow).join('')}</div>` : '<div class="empty">Noch in keiner Einheit eingeplant.</div>'}`;
  wireCard($('drill-' + id), it);
}

/* ================= Kader ================= */
function viewKader() {
  setTop(); setTab('kader');
  view.innerHTML = `<section class="hero" style="padding-bottom:0"><div><div class="eyebrow">Mannschaft</div><h1 style="font-size:clamp(46px,11vw,80px)">Kader</h1></div>
    <p class="sub">Namen eintragen, dann kannst du bei jeder Einheit die Anwesenheit abhaken und die Teams für das Spiel aus den Anwesenden losen. Gespeichert wird nur auf diesem Gerät.</p></section>
    <section class="box"><form class="kader-add" id="kAdd"><label for="kName" class="sr" style="position:absolute;left:-9999px">Name</label><input type="text" id="kName" placeholder="Vorname" autocomplete="off" enterkeyhint="done"><button type="submit" class="smallbtn">Hinzufügen</button></form>
      <details style="margin-top:12px"><summary style="cursor:pointer;color:var(--muted)">Mehrere Namen auf einmal einfügen</summary><textarea id="kBulk" placeholder="Ben, Mia, Luca …" style="margin-top:8px"></textarea><div class="row" style="margin-top:8px"><button type="button" class="smallbtn alt" id="kBulkBtn">Alle übernehmen</button></div></details>
      <ul class="klist" id="kList"></ul></section>`;
  const paint = () => {
    $('kList').innerHTML = S.kader.length ? S.kader.map((k, i) => `<li><span class="n">${i + 1}</span><span>${esc(k)}</span><button type="button" data-i="${i}" aria-label="${esc(k)} entfernen">${I.x}</button></li>`).join('') : '<li style="color:var(--muted)">Noch keine Namen eingetragen.</li>';
  };
  const add = names => { names.map(n => n.trim()).filter(Boolean).forEach(n => { if (!S.kader.includes(n)) S.kader.push(n); }); save(); paint(); };
  $('kAdd').addEventListener('submit', e => { e.preventDefault(); add([$('kName').value]); $('kName').value = ''; $('kName').focus(); });
  $('kBulkBtn').addEventListener('click', () => { add($('kBulk').value.split(/[\n,;]+/)); $('kBulk').value = ''; toast('Namen übernommen'); });
  $('kList').addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (!b) return; S.kader.splice(+b.dataset.i, 1); save(); paint(); });
  paint();
}

/* ================= Trainingsmodus ================= */
const tm = $('tm');
const TM = { s: null, its: [], i: 0, run: false, acc: 0, t0: 0, iv: null, d: null, beeped: false, warned: false, wl: null };
function tmElapsed() { return TM.acc + (TM.run ? (Date.now() - TM.t0) / 1000 : 0); }
function tmOpen(sid) {
  const s = sessionById(sid);
  if (TM.s !== s) { TM.s = s; TM.its = items(s); TM.i = 0; TM.run = false; TM.acc = 0; }
  $('tmSum').textContent = total(s) + ':00';
  $('tmDots').innerHTML = TM.its.map(it => `<i style="--d:${it.min};--c:${it.c}"></i>`).join('');
  tm.classList.add('open'); document.body.style.overflow = 'hidden';
  tmShow();
  if (!TM.iv) TM.iv = setInterval(tmTick, 250);
  $('tmPlay').focus();
}
function tmShow() {
  const it = TM.its[TM.i];
  tm.style.setProperty('--c', it.c);
  const n = TM.its.filter(x => !x.pause).length;
  $('tmCat').textContent = it.pause ? 'Pause · ' + fmtMin(it.start) + '–' + fmtMin(it.start + it.min) : 'Station ' + it.no + ' von ' + n + ' · ' + it.cat + ' · ' + fmtMin(it.start) + '–' + fmtMin(it.start + it.min);
  $('tmCat').style.color = it.c; $('tmTitle').textContent = it.title;
  if (TM.d) { live.delete(TM.d); TM.d = null; }
  const vis = $('tmVisual');
  if (it.pause) vis.innerHTML = `<div class="tm-pause">${I.drop}<b>Trinken!</b></div>`;
  else { vis.innerHTML = '<div class="tm-stage"><svg role="img" aria-label="Animierte Grafik"></svg></div>'; TM.d = new Diagram(vis.querySelector('svg'), it.anim); live.add(TM.d); }
  const pts = it.pause ? it.notes : it.coaching;
  $('tmPts').innerHTML = `<h3>${it.pause ? 'Jetzt erledigen' : 'Darauf achten'}</h3><ul class="coach" style="--c:${it.c}">${pts.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  [...$('tmDots').children].forEach((d, i) => { d.className = i < TM.i ? 'done' : i === TM.i ? 'now' : ''; });
  $('tmPrev').disabled = TM.i === 0;
  $('tmNext').innerHTML = TM.i === TM.its.length - 1 ? 'Ende' : 'Weiter' + I.next;
  tmTick();
}
function tmTick() {
  if (!tm.classList.contains('open')) return;
  const it = TM.its[TM.i], tot = it.min * 60, e = tmElapsed(), rem = tot - e;
  const tEl = $('tmTime');
  if (rem >= 0) { tEl.textContent = mmss(Math.ceil(rem)); tEl.classList.remove('over'); $('tmLbl').textContent = TM.run ? 'Restzeit dieser Station' : (e > 0 ? 'Pausiert' : 'Bereit, tippe auf Start'); }
  else { tEl.textContent = '+' + mmss(-rem); tEl.classList.add('over'); $('tmLbl').textContent = 'Zeit um, weiter zur nächsten Station'; }
  $('tmProg').style.width = Math.min(100, e / tot * 100) + '%';
  $('tmTotal').textContent = mmss(it.start * 60 + Math.min(e, tot));
  if (TM.run && !TM.warned && rem <= 60 && tot > 120) { TM.warned = true; beep(1); }
  if (TM.run && !TM.beeped && rem <= 0) { TM.beeped = true; beep(3); }
  $('tmPlay').textContent = TM.run ? 'Pause' : (e > 0 ? 'Weiter' : 'Start');
}
function tmGo(i) { TM.i = Math.max(0, Math.min(TM.its.length - 1, i)); TM.acc = 0; TM.t0 = Date.now(); TM.beeped = false; TM.warned = false; tmShow(); }
async function lockScreen() { try { if ('wakeLock' in navigator && !TM.wl) { TM.wl = await navigator.wakeLock.request('screen'); TM.wl.addEventListener('release', () => { TM.wl = null; }); } } catch (e) { TM.wl = null; } }
function tmClose() { tm.classList.remove('open'); document.body.style.overflow = ''; if (TM.d) { live.delete(TM.d); TM.d = null; } }
$('tmClose').addEventListener('click', tmClose);
$('tmPlay').addEventListener('click', () => { audio(); if (TM.run) { TM.acc = tmElapsed(); TM.run = false; } else { TM.t0 = Date.now(); TM.run = true; lockScreen(); } tmTick(); });
$('tmPrev').addEventListener('click', () => tmGo(TM.i - 1));
$('tmNext').addEventListener('click', () => { if (TM.i === TM.its.length - 1) { TM.run = false; tmClose(); const f = $('feedback'); if (f) f.scrollIntoView({ behavior: 'smooth' }); return; } tmGo(TM.i + 1); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && tm.classList.contains('open')) tmClose(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && TM.run) lockScreen(); });

/* ================= Router ================= */
function route() {
  const h = decodeURIComponent(location.hash.slice(1)) || 'start';
  cleanupView();
  if (h.startsWith('einheit-')) viewSession(h.slice(8));
  else if (h === 'uebungen') viewLibrary();
  else if (h.startsWith('uebung-')) viewDrill(h.slice(7));
  else if (h === 'kader') viewKader();
  else viewHome();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
route();

/* ---------- Offline ---------- */
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* ohne Offline weiter */ }));
}
