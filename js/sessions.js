// Trainingseinheiten. Jede Woche kommt oben eine neue dazu.
// plan: { d: '<Übungs-id aus drills.js>', min: Minuten } oder { pause: Minuten, notes: [...] }

export const SESSIONS = [
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
