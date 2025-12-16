export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
}

export interface Quiz {
  id: string;
  chapterId?: string; // optional - if not set, it's a course final quiz
  title: string;
  description: string;
  passingScore: number; // percentage needed to pass (e.g., 70)
  questions: QuizQuestion[];
  isFinalQuiz?: boolean; // marks this as a course final quiz
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  order: number;
  topics: Topic[];
  quiz?: Quiz;
}

export interface Topic {
  id: string;
  chapterId: string;
  title: string;
  content: string;
  order: number;
  duration: string;
  videoUrl?: string;
  minDurationSeconds?: number; // minimum time required to spend on topic (in seconds)
  requireMinDuration?: boolean; // if true, user cannot proceed until time has passed
}

export interface UserProgress {
  oderId: string;
  topicId: string;
  completed: boolean;
  completedAt?: Date;
}

export interface QuizResult {
  chapterId?: string;
  quizId?: string;
  passed: boolean;
  score: number;
  completedAt: Date;
  isFinalQuiz?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  chapters: Chapter[];
  finalQuiz?: Quiz; // optional final course quiz for certification
}

// Mock course data
export const mockCourse: Course = {
  id: "1",
  title: "Staplerschein Theorie",
  description: "Kompletter theoretischer Kurs für Gabelstaplerfahrer",
  chapters: [
    {
      id: "ch1",
      title: "Grundlagen der Gabelstapler",
      description: "Einführung in die Welt der Flurförderzeuge",
      order: 1,
      topics: [
        {
          id: "t1",
          chapterId: "ch1",
          title: "Was ist ein Gabelstapler?",
          content: `
# Was ist ein Gabelstapler?

Ein Gabelstapler, auch Hubstapler oder Flurförderzeug genannt, ist ein Transportgerät, das in der Logistik und im Lagerwesen unverzichtbar ist.

## Hauptkomponenten

- **Hubmast**: Der vertikale Rahmen, der das Anheben und Senken der Last ermöglicht
- **Gabel**: Die horizontalen Zinken zum Aufnehmen von Paletten
- **Gegengewicht**: Gewicht am Heck zur Stabilisierung
- **Fahrerkabine**: Der Arbeitsplatz des Fahrers

## Arten von Gabelstaplern

1. Frontstapler
2. Schubmaststapler
3. Hochregalstapler
4. Containerstapler

## Wichtige Sicherheitshinweise

Bevor Sie einen Gabelstapler bedienen, müssen Sie:
- Eine gültige Ausbildung absolvieren
- Die Betriebsanleitung kennen
- Tägliche Sicherheitschecks durchführen
          `,
          order: 1,
          duration: "15 min",
          minDurationSeconds: 900,
          requireMinDuration: false,
        },
        {
          id: "t2",
          chapterId: "ch1",
          title: "Typen und Klassifizierung",
          content: `
# Typen und Klassifizierung von Gabelstaplern

## Klassifizierung nach Antriebsart

### Elektrische Gabelstapler
- Umweltfreundlich
- Leise
- Ideal für Innenräume
- Geringere Wartungskosten

### Dieselstapler
- Hohe Leistung
- Für den Außeneinsatz
- Längere Betriebszeiten
- Höhere Tragfähigkeit

### Gasstapler (LPG)
- Emissionsarm
- Flexibel einsetzbar
- Schnelles Tanken

## Klassifizierung nach Einsatzgebiet

| Typ | Einsatzbereich | Max. Hubhöhe |
|-----|----------------|--------------|
| Frontstapler | Allgemein | bis 6m |
| Schubmaststapler | Lager | bis 12m |
| Seitenstapler | Langgut | bis 8m |
          `,
          order: 2,
          duration: "20 min",
          minDurationSeconds: 1200,
          requireMinDuration: false,
        },
        {
          id: "t3",
          chapterId: "ch1",
          title: "Aufbau und Funktionsweise",
          content: `
# Aufbau und Funktionsweise

## Das Hydrauliksystem

Das Hydrauliksystem ist das Herzstück eines jeden Gabelstaplers. Es ermöglicht:
- Heben und Senken der Gabel
- Neigen des Hubmastes
- Seitliches Verschieben der Gabel

## Der Antriebsstrang

Je nach Staplertyp unterscheidet sich der Antrieb:

### Bei Elektrostaplern
- Batterie (meist 48V oder 80V)
- Elektromotor
- Steuerungselektronik

### Bei Verbrennungsstaplern
- Motor (Diesel/Gas)
- Getriebe
- Hydraulikpumpe
          `,
          order: 3,
          duration: "25 min",
          minDurationSeconds: 1500,
          requireMinDuration: false,
        },
      ],
      quiz: {
        id: "quiz1",
        chapterId: "ch1",
        title: "Test: Grundlagen der Gabelstapler",
        description: "Überprüfen Sie Ihr Wissen über die Grundlagen",
        passingScore: 70,
        questions: [
          {
            id: "q1",
            question: "Was ist das Gegengewicht bei einem Gabelstapler?",
            options: [
              "Ein Gewicht zum Heben der Last",
              "Ein Gewicht am Heck zur Stabilisierung",
              "Das Gewicht der Gabel",
              "Das Gewicht des Motors"
            ],
            correctAnswer: 1
          },
          {
            id: "q2",
            question: "Welcher Staplertyp ist für Innenräume am besten geeignet?",
            options: [
              "Dieselstapler",
              "Gasstapler",
              "Elektrischer Gabelstapler",
              "Containerstapler"
            ],
            correctAnswer: 2
          },
          {
            id: "q3",
            question: "Was ermöglicht das Hydrauliksystem?",
            options: [
              "Nur das Fahren",
              "Heben, Senken und Neigen",
              "Nur die Beleuchtung",
              "Nur die Bremsung"
            ],
            correctAnswer: 1
          }
        ]
      }
    },
    {
      id: "ch2",
      title: "Sicherheitsvorschriften",
      description: "Wichtige Regeln und Vorschriften für den sicheren Betrieb",
      order: 2,
      topics: [
        {
          id: "t4",
          chapterId: "ch2",
          title: "Gesetzliche Grundlagen",
          content: `
# Gesetzliche Grundlagen

## Relevante Vorschriften

### DGUV Vorschrift 68
Die wichtigste Vorschrift für den Betrieb von Flurförderzeugen in Deutschland.

**Kernpunkte:**
- Nur ausgebildete und beauftragte Personen dürfen fahren
- Regelmäßige Prüfungen sind Pflicht
- Schriftliche Beauftragung erforderlich

### Betriebssicherheitsverordnung (BetrSichV)
Regelt die sichere Verwendung von Arbeitsmitteln.

## Pflichten des Arbeitgebers
1. Bereitstellung sicherer Arbeitsmittel
2. Unterweisung der Mitarbeiter
3. Regelmäßige Prüfungen veranlassen

## Pflichten des Fahrers
1. Tägliche Sichtprüfung
2. Melden von Mängeln
3. Bestimmungsgemäße Verwendung
          `,
          order: 1,
          duration: "30 min",
          minDurationSeconds: 1800,
          requireMinDuration: false,
        },
        {
          id: "t5",
          chapterId: "ch2",
          title: "Persönliche Schutzausrüstung",
          content: `
# Persönliche Schutzausrüstung (PSA)

## Erforderliche Ausrüstung

### Sicherheitsschuhe
- Stahlkappe zum Schutz der Zehen
- Rutschfeste Sohle
- S3-Klassifizierung empfohlen

### Warnweste
- Hohe Sichtbarkeit
- Besonders wichtig in verkehrsreichen Bereichen

### Handschuhe
- Schutz beim Umgang mit Lasten
- Griffsicherheit verbessern

## Optionale Ausrüstung

- Schutzhelm (bei Gefahr herabfallender Gegenstände)
- Gehörschutz (bei lauten Arbeitsumgebungen)
- Schutzbrille (bei Staubentwicklung)
          `,
          order: 2,
          duration: "15 min",
          minDurationSeconds: 900,
          requireMinDuration: false,
        },
      ],
      quiz: {
        id: "quiz2",
        chapterId: "ch2",
        title: "Test: Sicherheitsvorschriften",
        description: "Prüfen Sie Ihr Wissen über Sicherheitsregeln",
        passingScore: 70,
        questions: [
          {
            id: "q4",
            question: "Welche Vorschrift ist die wichtigste für Flurförderzeuge in Deutschland?",
            options: [
              "DIN 1234",
              "DGUV Vorschrift 68",
              "ISO 9001",
              "VDE 100"
            ],
            correctAnswer: 1
          },
          {
            id: "q5",
            question: "Was müssen Sicherheitsschuhe beim Staplerfahren haben?",
            options: [
              "Hohe Absätze",
              "Stahlkappe und rutschfeste Sohle",
              "Schnürsenkel",
              "Weiße Farbe"
            ],
            correctAnswer: 1
          },
          {
            id: "q6",
            question: "Wer darf einen Gabelstapler bedienen?",
            options: [
              "Jeder Mitarbeiter",
              "Nur der Lagerleiter",
              "Nur ausgebildete und beauftragte Personen",
              "Nur Personen über 25 Jahre"
            ],
            correctAnswer: 2
          }
        ]
      }
    },
    {
      id: "ch3",
      title: "Praktische Fahrhinweise",
      description: "Techniken und Tipps für den Fahrbetrieb",
      order: 3,
      topics: [
        {
          id: "t6",
          chapterId: "ch3",
          title: "Vor der Fahrt",
          content: `
# Vor der Fahrt - Tägliche Kontrollen

## Checkliste vor Fahrtantritt

### 1. Sichtprüfung
- [ ] Reifenzustand
- [ ] Hydraulikleitungen
- [ ] Gabelzinken
- [ ] Ketten und Schläuche

### 2. Funktionsprüfung
- [ ] Bremsen
- [ ] Lenkung
- [ ] Hupe
- [ ] Beleuchtung
- [ ] Hydraulik

### 3. Batterie/Kraftstoff
- Ladestand prüfen
- Tankinhalt kontrollieren
- Keine Leckagen

## Bei Mängeln

**WICHTIG:** Bei sicherheitsrelevanten Mängeln:
1. Sofort Vorgesetzten informieren
2. Stapler nicht benutzen
3. Mängel dokumentieren
          `,
          order: 1,
          duration: "20 min",
          minDurationSeconds: 1200,
          requireMinDuration: false,
        },
        {
          id: "t7",
          chapterId: "ch3",
          title: "Sichere Fahrtechniken",
          content: `
# Sichere Fahrtechniken

## Grundregeln beim Fahren

### Geschwindigkeit
- Angepasste Geschwindigkeit
- Schrittgeschwindigkeit in Hallenbereichen
- Bei schlechter Sicht langsamer fahren

### Sicht
- Immer in Fahrtrichtung schauen
- Bei Sichtbehinderung rückwärts fahren
- Einweiser nutzen wenn nötig

## Kurvenfahrt

⚠️ **Achtung Kippgefahr!**
- Vor der Kurve abbremsen
- Langsam durch die Kurve
- Niemals mit gehobener Last kurven

## Gefälle und Steigungen

| Situation | Lastposition |
|-----------|-------------|
| Bergauf mit Last | Last bergauf |
| Bergab mit Last | Last bergauf |
| Bergauf ohne Last | Normal |
| Bergab ohne Last | Normal |
          `,
          order: 2,
          duration: "25 min",
          minDurationSeconds: 1500,
          requireMinDuration: false,
        },
      ],
      quiz: {
        id: "quiz3",
        chapterId: "ch3",
        title: "Test: Praktische Fahrhinweise",
        description: "Testen Sie Ihr Wissen über Fahrtechniken",
        passingScore: 70,
        questions: [
          {
            id: "q7",
            question: "Was sollte man vor jeder Fahrt prüfen?",
            options: [
              "Nur den Kraftstoff",
              "Reifen, Bremsen, Lenkung, Hydraulik",
              "Nur die Beleuchtung",
              "Nichts, das macht die Wartung"
            ],
            correctAnswer: 1
          },
          {
            id: "q8",
            question: "Wie verhält man sich bei sicherheitsrelevanten Mängeln?",
            options: [
              "Weiterfahren und später melden",
              "Ignorieren",
              "Sofort Vorgesetzten informieren und Stapler nicht benutzen",
              "Selbst reparieren"
            ],
            correctAnswer: 2
          },
          {
            id: "q9",
            question: "Warum ist Kurvenfahrt mit gehobener Last gefährlich?",
            options: [
              "Es verbraucht mehr Kraftstoff",
              "Es gibt Kippgefahr",
              "Es ist lauter",
              "Es ist langsamer"
            ],
            correctAnswer: 1
          }
        ]
      }
    },
  ],
  finalQuiz: {
    id: "final-quiz",
    title: "Abschlusstest - Zertifizierung",
    description: "Bestehen Sie diesen Test, um Ihr Zertifikat zu erhalten",
    passingScore: 80,
    isFinalQuiz: true,
    questions: [
      {
        id: "fq1",
        question: "Welche PSA ist beim Staplerfahren immer erforderlich?",
        options: [
          "Nur Helm",
          "Sicherheitsschuhe und Warnweste",
          "Nur Handschuhe",
          "Keine PSA erforderlich"
        ],
        correctAnswer: 1
      },
      {
        id: "fq2",
        question: "Was ist bei der täglichen Kontrolle zu prüfen?",
        options: [
          "Nur der Kraftstoffstand",
          "Reifen, Bremsen, Hydraulik, Beleuchtung",
          "Nur das Radio",
          "Nichts, der Chef macht das"
        ],
        correctAnswer: 1
      },
      {
        id: "fq3",
        question: "Wie verhält man sich bei Kurvenfahrt?",
        options: [
          "Schnell durchfahren",
          "Vor der Kurve abbremsen, niemals mit gehobener Last",
          "Mit Vollgas",
          "Hupen und durchfahren"
        ],
        correctAnswer: 1
      }
    ]
  }
};

// Initial progress - all topics incomplete
export const getInitialProgress = (): Record<string, boolean> => {
  const progress: Record<string, boolean> = {};
  mockCourse.chapters.forEach((chapter) => {
    chapter.topics.forEach((topic) => {
      progress[topic.id] = false;
    });
  });
  return progress;
};

// Check if topic is accessible (considering quiz requirements)
export const isTopicAccessible = (
  topicId: string,
  progress: Record<string, boolean>,
  quizResults?: Record<string, QuizResult>
): boolean => {
  const allTopics = mockCourse.chapters.flatMap((ch) => ch.topics);
  const topicIndex = allTopics.findIndex((t) => t.id === topicId);
  
  if (topicIndex === 0) return true;
  
  // Find the topic and its chapter
  const topic = allTopics[topicIndex];
  const currentChapter = mockCourse.chapters.find(ch => ch.id === topic.chapterId);
  const previousTopic = allTopics[topicIndex - 1];
  
  // If previous topic is in a different chapter, check if that chapter's quiz was passed
  if (previousTopic.chapterId !== topic.chapterId && quizResults) {
    const previousChapter = mockCourse.chapters.find(ch => ch.id === previousTopic.chapterId);
    if (previousChapter?.quiz) {
      const quizResult = quizResults[previousChapter.id];
      if (!quizResult?.passed) return false;
    }
  }
  
  return progress[previousTopic.id] === true;
};

// Check if chapter is accessible (previous chapter quiz must be passed)
export const isChapterAccessible = (
  chapterId: string,
  progress: Record<string, boolean>,
  quizResults: Record<string, QuizResult>
): boolean => {
  const chapterIndex = mockCourse.chapters.findIndex(ch => ch.id === chapterId);
  
  if (chapterIndex === 0) return true;
  
  const previousChapter = mockCourse.chapters[chapterIndex - 1];
  
  // Check if all topics in previous chapter are complete
  const allTopicsComplete = previousChapter.topics.every(t => progress[t.id]);
  if (!allTopicsComplete) return false;
  
  // Check if previous chapter's quiz was passed (if it has one)
  if (previousChapter.quiz) {
    const quizResult = quizResults[previousChapter.id];
    return quizResult?.passed === true;
  }
  
  return true;
};

// Check if final quiz is accessible (all chapters must be completed)
export const isFinalQuizAccessible = (
  progress: Record<string, boolean>,
  quizResults: Record<string, QuizResult>
): boolean => {
  // Check if all topics are completed
  const allTopicsComplete = mockCourse.chapters.every(chapter =>
    chapter.topics.every(topic => progress[topic.id])
  );
  
  if (!allTopicsComplete) return false;
  
  // Check if all chapter quizzes are passed
  const allQuizzesPassed = mockCourse.chapters.every(chapter => {
    if (!chapter.quiz) return true;
    const quizResult = quizResults[chapter.id];
    return quizResult?.passed === true;
  });
  
  return allQuizzesPassed;
};

// Get course progress percentage
export const getCourseProgress = (progress: Record<string, boolean>): number => {
  const allTopics = mockCourse.chapters.flatMap((ch) => ch.topics);
  const completed = allTopics.filter((t) => progress[t.id]).length;
  return Math.round((completed / allTopics.length) * 100);
};
