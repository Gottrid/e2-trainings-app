// E2 Training – App-Logik: Routing, Ansichten, Trainingsmodus, Hallen-Liga, Kader, Feedback
import { Diagram, live, injectDefs, COL } from './engine.js';
import { DRILLS, drillById, CATS } from './drills.js';
import { SESSIONS } from './sessions.js';
import * as K from './kotc.js';

injectDefs();
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const view = $('view');

/* ---------- Speicher (nur auf diesem Gerät) ---------- */
const KEY = 'e2app-v1';
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* privat-Modus */ } }
const S = Object.assign({ kader: [], att: {}, liga: {}, checks: {}, notes: {}, rate: {}, kotc: {} }, load());

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
    else { const d = drillById(p.d); if (!d) throw new Error('Übung fehlt: ' + p.d); it = Object.assign({}, d, { min: p.min || d.min, c: CATS[d.cat], no: ++no }); if (p.regel) it.regel = p.regel; }
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
    ? `<a class="back" href="${back[0]}">${I.back}${esc(back[1])}</a><a class="brand" href="#start" style="margin-right:0" aria-label="Zur Startseite"><img src="icons/icon-192.png" alt=""></a>`
    : `<a class="brand" href="#start"><img src="icons/icon-192.png" alt=""><b>E2 <span>Training</span></b></a>`;
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
    <footer class="foot"><span>E2 Training · Version 1.3</span><span>Jede Woche eine neue Einheit</span></footer>`;
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
    <section class="box" aria-labelledby="fbH" id="feedback"><h2 id="fbH">Wie lief's?</h2><p>Nach dem Training kurz bewerten. Die Rückmeldung fließt in die Planung der nächsten Einheit ein.</p>
      <div class="stars" id="stars" role="group" aria-label="Bewertung">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-n="${n}" aria-label="${n} von 5 Sternen">${I.star}</button>`).join('')}</div>
      <label for="note" style="display:block;color:var(--muted);font-size:14px;margin-bottom:6px">Notizen (Was hat geklappt? Wer ist aufgefallen?)</label>
      <textarea id="note" placeholder="z. B. Duell-Arena super, Pass-Jagd zu wild …"></textarea>
      <div class="row" style="margin-top:10px"><a class="smallbtn" id="ghFb" href="https://github.com/Gottrid/e2-trainings-app/issues/new" target="_blank" rel="noopener" style="text-decoration:none">An Claude senden</a><button type="button" class="smallbtn alt" id="copyFb">Text kopieren</button></div>
      <p style="margin:10px 0 0;color:var(--muted);font-size:13px">„An Claude senden“ öffnet GitHub mit fertigem Text. Dort nur noch auf „Create“ tippen, dann fließt die Rückmeldung in die Planung der nächsten Woche ein.</p>
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
    if (it.liga) mountKotc(card.querySelector('.liga-mount'), s);
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
  const fbText = () => {
    const r = S.rate[s.id] || {};
    const good = its.filter(i => r[i.idx] === 'up').map(i => i.title), bad = its.filter(i => r[i.idx] === 'down').map(i => i.title);
    const present = Object.values(S.att[s.id] || {}).filter(Boolean).length;
    const txt = [`Rückmeldung Training ${fmtDate(s.date, { day: '2-digit', month: '2-digit', year: 'numeric' })} – ${s.title}`,
      fb.stars ? `Bewertung: ${'★'.repeat(fb.stars)}${'☆'.repeat(5 - fb.stars)} (${fb.stars}/5)` : 'Bewertung: –',
      present ? `Anwesend: ${present} Kinder` : null,
      good.length ? `Gut: ${good.join(', ')}` : null,
      bad.length ? `Nicht so gut: ${bad.join(', ')}` : null,
      fb.text ? `Notiz: ${fb.text}` : null].filter(Boolean).join('\n');
    return txt;
  };
  $('copyFb').addEventListener('click', async () => { toast((await copy(fbText())) ? 'Rückmeldung kopiert' : 'Kopieren nicht möglich'); });
  $('ghFb').addEventListener('click', () => {
    $('ghFb').href = 'https://github.com/Gottrid/e2-trainings-app/issues/new?labels=' + encodeURIComponent('Rückmeldung') + '&title=' + encodeURIComponent('Rückmeldung ' + fmtDate(s.date, { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' – ' + s.title) + '&body=' + encodeURIComponent(fbText());
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
        ${it.regel ? `<div class="tip" style="border-style:solid;background:rgba(255,200,61,.07)"><b>Sonderregel heute</b>${esc(it.regel)}</div>` : ''}
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
  box.querySelector('.names').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; a[b.dataset.k] = !a[b.dataset.k]; save(); renderAtt(s); if (kotcRefresh) kotcRefresh(); });
  $('attAll').addEventListener('click', () => { S.kader.forEach(k => { a[k] = true; }); save(); renderAtt(s); if (kotcRefresh) kotcRefresh(); });
}

/* ---------- King of the Court (jedes Spiel neue Teams) ---------- */
const dateOf = sid => (sessionById(sid) || { date: sid }).date;
const SIDE = K.SIDES;
function kotcPool(s) { const a = S.att[s.id] || {}; return S.kader.filter(k => a[k]); }
let kotcRefresh = null;
function strengthMap(exceptId) {
  const t = K.totals(K.weeks(S.kotc, dateOf).filter(w => w.sid !== exceptId));
  const m = {}; Object.values(t).forEach(r => { m[r.name] = r.pts / Math.max(1, r.sp); }); return m;
}
const GT = { len: 240, rem: 240, run: false, t0: 0, base: 240, iv: null, out: null, go: null };
function mountKotc(mount, s) {
  const div = document.createElement('div'); div.className = 'liga'; div.id = 'kotc';
  mount.replaceWith(div);
  const day = (S.kotc[s.id] = K.migrate(S.kotc[s.id] || { games: [], next: null, cur: { goals: [] }, len: 240 }));
  if (!day.cur) day.cur = { goals: [] };
  if (!day.games) day.games = [];
  if (!day.len) day.len = 240;
  let pend = null, swap = false, pick = null;
  const perOf = () => day.per || (kotcPool(s).length <= 9 ? 3 : 4);
  const newGame = () => { const r = K.makeGame(kotcPool(s), day, S.kotc, strengthMap(s.id), 3000, perOf()); day.next = { teams: r.teams, bench: r.bench, per: perOf() }; save(); };
  kotcRefresh = () => { if (div.isConnected && !day.cur.goals.length) { day.next = null; render(); } };
  function render() {
    if (!S.kader.length) {
      div.innerHTML = `<div class="liga-head"><div><h3>King of the Court</h3><p>Für die Wertung jedes Kindes braucht die App deinen Kader.</p></div></div><div class="row"><a class="smallbtn" href="#kader" style="text-decoration:none">Kader anlegen</a></div>`;
      return;
    }
    const pool = kotcPool(s);
    if (pool.length < 2) { div.innerHTML = `<div class="liga-head"><div><h3>King of the Court</h3><p>Es spielen nur die Kinder, die oben bei der Anwesenheit abgehakt sind.</p></div></div><div class="k-info warn">Hake zuerst oben bei <b>Anwesenheit</b> ab, wer heute da ist (mindestens 2 Kinder).</div><div class="row"><button type="button" class="smallbtn" data-act="toAtt">Zur Anwesenheit</button></div>`; return; }
    if (!day.next || (!day.cur.goals.length && day.next.per !== perOf()) || (!day.cur.goals.length && day.next.teams.flat().concat(day.next.bench).some(n => !pool.includes(n))) || (!day.cur.goals.length && pool.some(n => !day.next.teams.flat().concat(day.next.bench).includes(n)))) newGame();
    const nx = day.next, [ta, tb] = nx.teams;
    const [sa, sb] = K.score(day.cur.goals);
    const sug = sa > sb ? 'a' : sb > sa ? 'b' : 'd';
    const sc = K.scoreSplit(nx.teams, K.playedTeams(S.kotc), day.games.flatMap(g => g.teams), null);
    const ranking = K.rank(K.dayStats(day));
    const nameBtn = (nm, where, ti, i) => swap
      ? `<button type="button" data-act="pick" data-w="${where}" data-t="${ti}" data-i="${i}" aria-pressed="${!!(pick && pick.w === where && pick.t === ti && pick.i === i)}">${esc(nm)}</button>`
      : where === 'team' ? `<button type="button" data-act="goal" data-t="${ti}" data-n="${esc(nm)}">${esc(nm)}</button>` : `<span>${esc(nm)}</span>`;
    const side = ti => `<div class="mside" style="--tc:${SIDE[ti].c}"><div class="nm"><b>${SIDE[ti].n}</b><span>${swap ? 'Tauschen' : 'Tippen = Tor'}</span></div><div class="sc">${ti ? sb : sa}</div>
      <div class="kids">${nx.teams[ti].map((nm, i) => nameBtn(nm, 'team', ti, i)).join('')}</div></div>`;
    div.innerHTML = `<div class="liga-head"><div><h3>King of the Court</h3><p>Spiel ${day.games.length + 1} · ${perOf()} gegen ${perOf()} · jedes Spiel neue Teams</p></div>
        <div class="gt" aria-label="Spieluhr"><output class="gtOut">4:00</output><button type="button" class="go gtGo">Anpfiff</button><button type="button" class="gtReset" aria-label="Spieluhr zurücksetzen">${I.restart}</button></div></div>
      <div class="row" style="justify-content:space-between"><div class="lens" role="group" aria-label="Spielform">${[3, 4].map(p => `<button type="button" data-act="per" data-p="${p}" aria-pressed="${perOf() === p}" ${day.cur.goals.length ? 'disabled' : ''}>${p} gegen ${p}</button>`).join('')}</div>
      <div class="lens" role="group" aria-label="Spielzeit">${[180, 240, 300].map(l => `<button type="button" data-act="len" data-l="${l}" aria-pressed="${day.len === l}">${l / 60} Min</button>`).join('')}</div></div>
      <p class="hint">${pool.length} Kinder anwesend · ${perOf() * 2} spielen, ${Math.max(0, pool.length - perOf() * 2)} Pause</p>
      <div class="match">${side(0)}${side(1)}</div>
      ${nx.bench.length ? `<div class="bench"><b>Pause · Jonglier-Rekord</b><div class="kids">${nx.bench.map((nm, i) => nameBtn(nm, 'bench', -1, i)).join('')}</div></div>` : ''}
      ${!day.cur.goals.length ? `<div class="k-info ${sc.repeats ? 'warn' : 'ok'}">${sc.repeats ? 'Ein Team gab es schon, eine neue Kombination ist nicht mehr möglich.' : 'Beide Teams sind neue Kombinationen.'}</div>
        <div class="row"><button type="button" class="tgl" data-act="swap" aria-pressed="${swap}">${swap ? 'Tauschen beenden' : 'Aufstellung ändern'}</button>${swap ? '' : '<button type="button" class="tgl" data-act="shuffle">Neu mischen</button>'}</div>
        ${swap ? '<p class="hint">Tippe zwei Namen an, um sie zu tauschen. Auch mit Kindern aus der Pause.</p>' : ''}` : ''}
      ${pend ? `<div class="picker" style="--tc:${SIDE[pend.t].c}"><b>Tor von ${esc(pend.n)}. Vorlage von?</b>
        <div class="kids">${nx.teams[pend.t].filter(x => x !== pend.n).map(x => `<button type="button" data-act="ast" data-n="${esc(x)}">${esc(x)}</button>`).join('')}<button type="button" data-act="ast" data-n="">Ohne Vorlage</button></div>
        <div class="row"><button type="button" class="tgl" data-act="dbl" aria-pressed="${!!pend.double}">Sonderregel: zählt doppelt</button><button type="button" class="smallbtn alt" data-act="cancel">Abbrechen</button></div></div>` : ''}
      ${day.cur.goals.length ? `<ul class="glist">${day.cur.goals.map(g => `<li><i style="background:${SIDE[g.team].c}"></i>${esc(g.by)}${g.double ? ' ×2' : ''}${g.ast ? ` <span>Vorlage ${esc(g.ast)}</span>` : ''}</li>`).join('')}</ul><div class="row"><button type="button" class="smallbtn alt" data-act="undo">Letztes Tor löschen</button></div>` : ''}
      <div class="results"><button type="button" data-act="res" data-r="a" class="${sug === 'a' ? 'sug' : ''}">Rot gewinnt</button><button type="button" data-act="res" data-r="d" class="${sug === 'd' ? 'sug' : ''}">Unentschieden</button><button type="button" data-act="res" data-r="b" class="${sug === 'b' ? 'sug' : ''}">Blau gewinnt</button></div>
      ${day.games.length ? `<div><h4 class="h4">Spiele</h4><ol class="glog">${day.games.map((g, i) => gameRow(g, i, i === day.games.length - 1)).reverse().join('')}</ol></div>` : ''}
      <div><h4 class="h4">Tageswertung</h4>${rankTable(ranking, {})}<p class="hint" style="margin-top:8px">Sp zeigt, wie oft jedes Kind gespielt hat. Die App wählt immer die Kinder mit den wenigsten Spielen.</p></div>
      <div class="row">${day.games.length ? '<button type="button" class="smallbtn" data-act="sync">In GitHub sichern</button>' : ''}<a class="smallbtn alt" href="#rangliste" style="text-decoration:none">Zur Rangliste</a></div>`;
    GT.out = div.querySelector('.gtOut'); GT.go = div.querySelector('.gtGo');
    if (!GT.run && GT.len !== day.len) { GT.len = day.len; GT.rem = day.len; }
    gtPaint();
  }
  div.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('gtGo')) { audio(); if (GT.rem <= 0 && !GT.run) GT.rem = GT.len; if (GT.run) { GT.rem = GT.base - (Date.now() - GT.t0) / 1000; GT.run = false; clearInterval(GT.iv); } else { GT.base = GT.rem; GT.t0 = Date.now(); GT.run = true; clearInterval(GT.iv); GT.iv = setInterval(gtTick, 250); } gtPaint(); return; }
    if (b.classList.contains('gtReset')) { GT.run = false; clearInterval(GT.iv); GT.rem = GT.len; gtPaint(); return; }
    const act = b.dataset.act; if (!act) return;
    const nx = day.next;
    if (act === 'swap') { swap = !swap; pick = null; }
    else if (act === 'shuffle') { newGame(); toast('Neu gemischt'); }
    else if (act === 'pick') {
      const p = { w: b.dataset.w, t: +b.dataset.t, i: +b.dataset.i };
      const ref = q => (q.w === 'team' ? nx.teams[q.t] : nx.bench);
      if (!pick) pick = p;
      else if (pick.w === p.w && pick.t === p.t && pick.i === p.i) pick = null;
      else { const A = ref(pick), B = ref(p); [A[pick.i], B[p.i]] = [B[p.i], A[pick.i]]; pick = null; save(); }
    }
    else if (act === 'per') { day.per = +b.dataset.p; day.next = null; save(); }
    else if (act === 'toAtt') { const a = $('att'); if (a) a.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    else if (act === 'len') { day.len = +b.dataset.l; GT.run = false; clearInterval(GT.iv); GT.len = day.len; GT.rem = day.len; save(); }
    else if (act === 'goal') { pend = { t: +b.dataset.t, n: b.dataset.n, double: false }; swap = false; }
    else if (act === 'dbl') { pend.double = !pend.double; }
    else if (act === 'cancel') { pend = null; }
    else if (act === 'ast') { day.cur.goals.push({ team: pend.t, by: pend.n, ast: b.dataset.n || null, double: !!pend.double }); pend = null; save(); }
    else if (act === 'undo') { day.cur.goals.pop(); save(); }
    else if (act === 'res') {
      day.games.push({ teams: nx.teams, bench: nx.bench, result: b.dataset.r, goals: day.cur.goals });
      day.cur = { goals: [] }; day.next = null; pend = null; swap = false;
      GT.run = false; clearInterval(GT.iv); GT.rem = GT.len;
      newGame(); toast('Spiel ' + day.games.length + ' gespeichert, neue Teams');
    } else if (act === 'undoGame') { const g = day.games.pop(); day.next = { teams: g.teams, bench: g.bench || [] }; day.cur = { goals: g.goals || [] }; save(); toast('Spiel zurückgenommen'); }
    else if (act === 'sync') { syncToGitHub(s.id); return; }
    render();
  });
  render();
}
function gameRow(g, i, last) {
  const [x, y] = K.score(g.goals);
  const res = g.result === 'd' ? 'Unentschieden' : (g.result === 'a' ? 'Rot' : 'Blau') + ' gewinnt';
  return `<li><div><b>${i + 1}.</b> <span style="color:${SIDE[0].c}">Rot</span> ${x}:${y} <span style="color:${SIDE[1].c}">Blau</span> · ${res}
    <small><span style="color:${SIDE[0].c}">●</span> ${g.teams[0].map(esc).join(', ')}<br><span style="color:${SIDE[1].c}">●</span> ${g.teams[1].map(esc).join(', ')}</small>
    ${g.goals.length ? `<small>Tore: ${g.goals.map(q => esc(q.by) + (q.double ? ' ×2' : '') + (q.ast ? ' (' + esc(q.ast) + ')' : '')).join(', ')}</small>` : ''}</div>${last ? '<button type="button" data-act="undoGame">Zurücknehmen</button>' : ''}</li>`;
}
function gtTick() { if (!GT.run) return; const r = GT.base - (Date.now() - GT.t0) / 1000; if (r <= 0) { GT.run = false; GT.rem = 0; clearInterval(GT.iv); beep(3); } gtPaint(); }
function gtPaint() {
  if (!GT.out || !GT.out.isConnected) return;
  const r = GT.run ? GT.base - (Date.now() - GT.t0) / 1000 : GT.rem;
  GT.out.textContent = mmss(Math.ceil(r)); GT.out.classList.toggle('end', r <= 0);
  GT.go.textContent = GT.run ? 'Pause' : r <= 0 ? 'Abpfiff!' : r < GT.len ? 'Weiter' : 'Anpfiff';
}

/* ---------- Sicherung in GitHub ---------- */
const REPO = 'https://github.com/Gottrid/e2-trainings-app';
function syncToGitHub(sid) {
  const day = S.kotc[sid];
  const payload = { kader: S.kader, sid, day: { games: day.games, len: day.len } };
  const body = 'Liga-Daten aus der App. Claude trägt sie ins Repo ein (data/team.json).\n\n```json\n' + JSON.stringify(payload) + '\n```';
  const url = REPO + '/issues/new?labels=' + encodeURIComponent('Liga-Daten') + '&title=' + encodeURIComponent('Liga-Daten ' + fmtDate(dateOf(sid), { day: '2-digit', month: '2-digit', year: 'numeric' })) + '&body=' + encodeURIComponent(body);
  window.open(url, '_blank', 'noopener');
}
/** Kader und Ergebnisse aus dem Repo laden und mit dem Handy zusammenführen */
async function loadRepoData() {
  try {
    const r = await fetch('data/team.json', { cache: 'no-store' }); if (!r.ok) return;
    const d = await r.json(); let changed = false;
    (d.kader || []).forEach(n => { if (!S.kader.includes(n)) { S.kader.push(n); changed = true; } });
    Object.entries(d.kotc || {}).forEach(([sid, day]) => {
      const mine = S.kotc[sid];
      if (!mine || !mine.games || mine.games.length < (day.games || []).length) { S.kotc[sid] = Object.assign({ cur: { goals: [] }, next: null, len: 240 }, day); changed = true; }
    });
    if (changed) { save(); route(); }
  } catch (e) { /* offline */ }
}

function rankTable(rows, o) {
  if (!rows.length) return '<div class="empty">Noch keine Spiele erfasst.</div>';
  return `<div class="tabwrap"><table class="tab rk"><thead><tr><th>Pl.</th><th>Name</th>${o.total ? '<th>Wo</th>' : ''}<th>Sp</th><th>S-U-N</th><th>T</th><th>V</th><th>Pkt</th></tr></thead><tbody>${rows.map(r => {
    const tr = o.trend ? o.trend(r) : '';
    return `<tr class="p${r.place <= 3 ? r.place : ''}"><td><span class="pl">${r.place}</span></td><td class="nmc">${esc(r.name)}${tr}</td>${o.total ? `<td>${r.wo}</td>` : ''}<td>${r.sp}</td><td>${r.s}-${r.u}-${r.n}</td><td>${r.g}</td><td>${r.a}</td><td class="pts">${r.pts}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}

/* ================= Rangliste ================= */
let rkSel = 'gesamt';
function viewRangliste() {
  setTop(); setTab('rangliste');
  Object.values(S.kotc).forEach(K.migrate);
  const ws = K.weeks(S.kotc, dateOf);
  if (rkSel !== 'gesamt' && !ws.some(w => w.sid === rkSel)) rkSel = 'gesamt';
  const short = d => fmtDate(d, { day: '2-digit', month: '2-digit' });
  let rows, sub, gamesHtml = '', o = {};
  if (rkSel === 'gesamt') {
    rows = K.rank(K.totals(ws));
    const prev = ws.length > 1 ? K.rank(K.totals(ws.slice(0, -1))) : null;
    const prevPlace = {}; (prev || []).forEach(r => { prevPlace[r.name] = r.place; });
    o = { total: true, trend: r => { if (!prev) return ''; const p = prevPlace[r.name]; if (!p) return ' <span class="trend new">neu</span>'; const d = p - r.place; return d > 0 ? ` <span class="trend up">▲${d}</span>` : d < 0 ? ` <span class="trend down">▼${-d}</span>` : ''; } };
    sub = ws.length ? `Gesamtwertung nach ${ws.length} ${ws.length === 1 ? 'Woche' : 'Wochen'}` : '';
  } else {
    const wi = ws.findIndex(w => w.sid === rkSel), w = ws[wi];
    rows = K.rank(K.dayStats(w.day));
    sub = `Woche ${wi + 1} · ${fmtDate(w.date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${w.day.games.length} Spiele`;
    gamesHtml = `<div class="sec-title"><h2>Spiele dieser Woche</h2></div><ol class="glog">${w.day.games.map((g, i) => gameRow(g, i, false)).join('')}</ol>`;
  }
  const pod = rows.filter(r => r.place <= 3).slice(0, 3);
  const podOrder = [pod[1], pod[0], pod[2]].filter(Boolean);
  const played = K.playedTeams(S.kotc), uniq = new Set(played.map(K.teamKey)).size;
  view.innerHTML = `<section class="hero" style="padding-bottom:0"><div><div class="eyebrow">King of the Court</div><h1 style="font-size:clamp(46px,11vw,80px)">Rangliste</h1></div>
      <p class="sub">Punkte pro Kind: <b>Sieg 3 · Unentschieden 1 · Tor 1 · Vorlage 1</b></p></section>
    ${ws.length ? `<div class="filters" role="group" aria-label="Woche wählen"><button type="button" data-w="gesamt" aria-pressed="${rkSel === 'gesamt'}">Gesamt</button>${ws.map((w, i) => `<button type="button" data-w="${w.sid}" aria-pressed="${rkSel === w.sid}">Woche ${i + 1} · ${short(w.date)}</button>`).join('')}</div>
    <p class="rk-sub">${esc(sub)}</p>
    ${podOrder.length ? `<div class="podium">${podOrder.map(r => `<div class="pod p${r.place}"><span class="medal">${r.place}</span><b>${esc(r.name)}</b><em>${r.pts} Pkt</em></div>`).join('')}</div>` : ''}
    ${rankTable(rows, o)}
    <p class="hint">Wo = Wochen dabei, Sp = Spiele, S-U-N = Siege, Unentschieden, Niederlagen, T = Tore, V = Vorlagen. Bei Punktgleichheit entscheiden Tore, dann Siege.</p>
    <div class="k-info ${played.length === uniq ? 'ok' : 'warn'}" style="margin-top:14px">${played.length} Viererteams gespielt, ${played.length === uniq ? 'keins doppelt' : (played.length - uniq) + ' doppelt, weil keine neue Kombination mehr möglich war'}.</div>
    ${gamesHtml}` : `<div class="empty" style="margin-top:18px">Noch keine Spiele erfasst. Trag in der Einheit beim King of the Court die Spiele ein, dann erscheint hier die Rangliste.</div>`}
    <section class="box"><h2>Sicherung</h2><p>Nach dem Training in der Einheit auf „In GitHub sichern“ tippen und auf GitHub „Create“ drücken. Ich übertrage die Daten dann ins Repo, von dort lädt die App sie auf jedem Gerät. Zusätzlich kannst du hier eine Datei speichern.</p>
      <div class="row"><button type="button" class="smallbtn" id="bkDown">Sicherung speichern</button><button type="button" class="smallbtn alt" id="bkCopy">Als Text kopieren</button></div>
      <details style="margin-top:14px"><summary style="cursor:pointer;color:var(--muted)">Sicherung einspielen</summary>
        <div style="display:grid;gap:8px;margin-top:10px"><input type="file" id="bkFile" accept="application/json,.json,.txt"><textarea id="bkText" placeholder="Oder den kopierten Sicherungstext hier einfügen"></textarea>
        <div class="row"><button type="button" class="smallbtn" id="bkLoad">Einspielen</button><span id="bkMsg" class="hint" style="margin:0"></span></div></div></details></section>`;
  view.querySelectorAll('.filters button').forEach(b => b.addEventListener('click', () => { rkSel = b.dataset.w; viewRangliste(); }));
  const json = () => JSON.stringify(Object.assign({ app: 'e2-training', saved: new Date().toISOString() }, S));
  $('bkDown').addEventListener('click', () => {
    const blob = new Blob([json()], { type: 'application/json' }); const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'e2-training-sicherung-' + todayStr() + '.json'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Sicherung erstellt');
  });
  $('bkCopy').addEventListener('click', async () => toast((await copy(json())) ? 'Sicherung kopiert' : 'Kopieren nicht möglich'));
  let armed = false;
  $('bkLoad').addEventListener('click', async () => {
    let txt = $('bkText').value.trim();
    const f = $('bkFile').files[0]; if (f) txt = await f.text();
    let data; try { data = JSON.parse(txt); } catch (e) { $('bkMsg').textContent = 'Das ist keine gültige Sicherung.'; return; }
    if (!data || data.app !== 'e2-training') { $('bkMsg').textContent = 'Das ist keine Sicherung dieser App.'; return; }
    if (!armed) { armed = true; $('bkLoad').textContent = 'Wirklich überschreiben?'; $('bkMsg').textContent = 'Die aktuellen Daten auf diesem Handy werden ersetzt.'; return; }
    ['kader', 'att', 'liga', 'checks', 'notes', 'rate', 'kotc'].forEach(k => { if (data[k]) S[k] = data[k]; });
    save(); toast('Sicherung eingespielt'); viewRangliste();
  });
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
  const pts = it.pause ? it.notes : (it.regel ? ['Sonderregel: ' + it.regel] : []).concat(it.coaching);
  $('tmPts').innerHTML = `<h3>${it.pause ? 'Jetzt erledigen' : 'Darauf achten'}</h3><ul class="coach" style="--c:${it.c}">${pts.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  if (it.liga) { $('tmPts').insertAdjacentHTML('beforeend', '<div class="row" style="margin-top:12px"><button type="button" class="smallbtn" id="tmKotc">Spiele erfassen</button></div>'); $('tmKotc').addEventListener('click', () => { tmClose(); const k = $('kotc'); if (k) k.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); }
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
  else if (h === 'rangliste') viewRangliste();
  else viewHome();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
route();
loadRepoData();

/* ---------- Offline ---------- */
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* ohne Offline weiter */ }));
}
