// Trainingseinheiten. Jede Woche kommt oben eine neue dazu.
// plan: { d: '<Übungs-id aus drills.js>', min: Minuten, regel?: 'Sonderregel (nur Liga)' } oder { pause: Minuten, notes: [...] }

export const SESSIONS = [
  {
    id: '2026-11-23',
    date: '2026-11-23',
    title: 'Torjäger',
    h1: ['Tor', 'jäger'],
    cover: 'konter',
    theme: 'Schießen und Abschließen',
    ort: 'Halle',
    kinder: 12,
    intro: 'Letzte Woche war Dribbling dran, jetzt geht es um den Abschluss: Aufwärmen mit Hütchen-Kegeln, dann Schuss-Duelle zu zweit und Abschluss unter Druck im 1 gegen 1 und 2 gegen 1. Im Spiel zählen Direktschüsse doppelt.',
    ansage: '„Heute suchen wir den Torjäger der Woche. Merkt euch: Wer nicht schießt, kann nicht treffen!“',
    plan: [
      { d: 'kegeln', min: 12 },
      { d: 'schussduell', min: 10 },
      { pause: 3, notes: ['Trinken und durchatmen.', 'Umbau: Langbänke an die Wand, Hütchen vom Schuss-Duell zur Seite.', 'Rot und Blau einteilen, jedes Kind bekommt eine Nummer für das Wettrennen.'] },
      { d: 'rennen', min: 12 },
      { d: 'konter', min: 15 },
      { d: 'bande', min: 8 },
      { d: 'liga', min: 30, regel: 'Tor per Direktschuss (ohne vorherige Ballannahme) = 2 Punkte. Du rufst „Doppelt!“.' }
    ],
    material: [
      ['14', 'Bälle (12 + 2 Reserve)'],
      ['16', 'Hütchen (zum Kegeln, dann 4 Schuss-Duell-Tore)'],
      ['2', 'Langbänke (in der Halle)'],
      ['12', 'Leibchen: 4 Rot, 4 Blau, 4 Gelb'],
      ['2', 'Handballtore (in der Halle)'],
      ['1', 'Pfeife'],
      ['12', 'Trinkflaschen, Kinder bringen eigene mit']
    ]
  },
  {
    id: '2026-11-16',
    date: '2026-11-16',
    title: 'Dribbelkönige',
    h1: ['Dribbel', 'könige'],
    cover: 'duell',
    theme: 'Mut im 1 gegen 1',
    ort: 'Halle',
    kinder: 12,
    intro: 'Sechs Stationen bauen aufeinander auf: Ball am Fuß, Finte, Duell, Passspiel, Abschluss. Am Ende wird alles im 4 gegen 4 angewendet.',
    ansage: '„Heute werden wir Dribbelkönige. Wer traut sich, seinen Gegenspieler auszuspielen? Fehler sind erlaubt. Nur Nicht-Probieren ist verboten.“',
    plan: [
      { d: 'ampel', min: 10 },
      { d: 'tore', min: 12 },
      { pause: 3, notes: ['Trinken und durchatmen.', 'Umbau: Die 12 Tor-Hütchen werden zu 2 Duell-Feldern à 12 × 10 m.', 'Je Feld 3 Rot und 3 Blau einteilen, Leibchen verteilen.'] },
      { d: 'duell', min: 15 },
      { d: 'passjagd', min: 12 },
      { d: 'bande', min: 8 },
      { d: 'liga', min: 30 }
    ],
    material: [
      ['14', 'Bälle (12 + 2 Reserve)'],
      ['16', 'Hütchen, wandern von Station zu Station'],
      ['12', 'Leibchen: 4 Rot, 4 Blau, 4 Gelb'],
      ['1', 'grünes Leibchen extra fürs Ampel-Signal'],
      ['2', 'Handballtore (in der Halle)'],
      ['1', 'Pfeife'],
      ['12', 'Trinkflaschen, Kinder bringen eigene mit']
    ]
  }
];
