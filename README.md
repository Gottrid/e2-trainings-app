# E2 Training

Trainings-App für die E2-Jugend. Jede Woche eine neue Trainingseinheit mit animierten Übungsgrafiken, Trainingsmodus mit Stoppuhr, Hallen-Liga für das Abschlussspiel, Kader mit Anwesenheit und Feedback nach dem Training.

Die App ist eine reine Web-App (HTML, CSS, JavaScript ohne Build-Schritt). Sie läuft im Browser, lässt sich aufs Handy installieren und funktioniert danach auch offline in der Halle.

## Funktionen

| Bereich | Was es kann |
|---|---|
| **Training** (Start) | Nächste Einheit mit Animation, Liste aller Einheiten |
| **Einheit** | Zeitleiste, eine Karte pro Station mit animierter Taktiktafel, Coaching-Punkte, Varianten, Trainer-Kniff, Anwesenheit, Materialcheck |
| **Trainingsmodus** | Große Stoppuhr pro Station, Ton und Vibration 1 Minute vor Ende und bei Zeitablauf, Bildschirm bleibt an |
| **King of the Court** | Teams aus den Anwesenden, ohne bereits gespielte Konstellationen (erst wenn alle Kombinationen durch sind, wiederholt sich ein Team). Sieger bleibt drin. Tore und Vorlagen pro Kind antippen, Spieluhr 3/4/5 Minuten |
| **Rangliste** | Wertung pro Kind je Woche und gesamt: Sieg 3, Unentschieden 1, Tor 1, Vorlage 1. Podium, Trend, bisherige Teams, Sicherung (Datei oder Text) |
| **Feedback** | Sterne, Daumen pro Übung, Notizen. „An Claude senden“ legt ein GitHub-Issue mit Label *Rückmeldung* an, das in die Planung der nächsten Woche einfließt |
| **Übungen** | Bibliothek aller Übungen mit Filter nach Kategorie |
| **Kader** | Namen der Kinder (bleiben nur auf dem Gerät gespeichert) |

## Aufs Handy holen

1. Repository → **Settings → Pages → Source: GitHub Actions** auswählen (einmalig).
2. Nach dem nächsten Push ist die App unter `https://gottrid.github.io/e2-trainings-app/` erreichbar.
3. Auf dem iPhone in Safari öffnen → Teilen → **Zum Home-Bildschirm**.

Hinweis: GitHub Pages ist für private Repositories nur mit einem bezahlten GitHub-Plan verfügbar. Mit einem kostenlosen Konto das Repository auf öffentlich stellen (die Kindernamen liegen nicht im Repo, nur lokal auf dem Handy).

Lokal testen: `python3 -m http.server` im Ordner starten und `http://localhost:8000` öffnen.

## Wochenplanung

Jeden Freitagabend plant Claude automatisch die Einheit für den folgenden Montag: offene Issues mit Label *Rückmeldung* werden ausgewertet, die neue Einheit kommt in `js/sessions.js`, bei Bedarf neue Übungen in `js/drills.js`. Danach wird gepusht und GitHub Pages aktualisiert die App.

## Neue Woche anlegen

In `js/sessions.js` oben im Array eine neue Einheit einfügen:

```js
{
  id: '2026-11-23',              // eindeutig, am besten das Datum
  date: '2026-11-23',
  title: 'Passkönige',
  h1: ['Pass', 'könige'],        // optional: zweiter Teil wird orange
  cover: 'passjagd',             // optional: Übung für die Startseite
  theme: 'Passen und Freilaufen',
  ort: 'Halle',                  // oder 'Platz'
  kinder: 12,
  intro: 'Kurzbeschreibung der Einheit.',
  ansage: '„Satz für die Kinder zum Start.“',
  plan: [
    { d: 'ampel', min: 10 },     // d = Übungs-id aus js/drills.js
    { d: 'liga', min: 30, regel: 'Sonderregel der Woche' },
    { pause: 3, notes: ['Trinken', 'Umbau …'] },
    { d: 'liga', min: 30 }
  ],
  material: [['14', 'Bälle'], ['16', 'Hütchen']]
}
```

Danach in `sw.js` die `VERSION` hochzählen, damit installierte Apps die neuen Daten holen.

## Neue Übung anlegen

In `js/drills.js` ein Objekt in `DRILLS` ergänzen (Texte) und eine Animationsfunktion schreiben. Koordinaten: 10 Einheiten = 1 Meter, die Halle ist 400 × 200 (40 × 20 m). Bausteine stehen in `js/engine.js`:

- `kf([[t, x, y], …])` Keyframes für Spieler
- `ballOf(spieler)` Ball am Fuß, `mv(a, b, t0, t1)` Pass von a nach b, `seq(...)` Abschnitte
- `cone`, `gate`, `zone`, `arrow('pass'|'run'|'drib'|'shot', punkte)` für die feste Grafik
- `hud: t => ({ txt, col, score, big })` für die Textzeile oben in der Grafik

## Aufbau

```
index.html            App-Hülle, Tab-Leiste, Trainingsmodus
css/app.css           Gestaltung
js/engine.js          Animations-Engine (SVG)
js/drills.js          Übungsbibliothek mit Animationen
js/sessions.js        Wöchentliche Einheiten
js/app.js             Ansichten, Routing, Liga, Kader, Feedback
sw.js                 Offline-Cache
manifest.webmanifest  Installierbare App
```
