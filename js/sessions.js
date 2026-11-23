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
    intro: 'Letzte Woche war Dribbling dran, jetzt geht es um den Abschluss: Aufwärmen mit Hütchen-Kegeln, dann Pass-Jagd zu zweit, die Duell-Arena im 1 gegen 1 und Abschluss unter Druck im 2 gegen 1. Im Spiel zählen Direktschüsse doppelt.',
    ansage: '„Heute suchen wir den Torjäger der Woche. Merkt euch: Wer nicht schießt, kann nicht treffen!“',
    plan: [
      { d: 'kegeln', min: 12 },
      { d: 'passjagd', min: 10 },
      { pause: 3, notes: ['Trinken und durchatmen.', 'Umbau: Langbänke an die Wand, aus den Pass-Jagd-Toren werden 2 Duell-Felder à 12 × 10 m.', 'Bei 9 Kindern: ein Feld mit 5, eins mit 4 Kindern.'] },
      { d: 'duell', min: 12 },
      { d: 'konter', min: 15 },
      { d: 'bande', min: 8 },
      { d: 'liga', min: 30, regel: 'Tor per Direktschuss (ohne vorherige Ballannahme) = 2 Punkte. Du rufst „Doppelt!“.' }
    ],
    material: [
      ['14', 'Bälle (12 + 2 Reserve)'],
      ['16', 'Hütchen (zum Kegeln, dann 8 Pass-Tore, dann 2 Duell-Felder)'],
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
