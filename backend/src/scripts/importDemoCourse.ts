/**
 * Import treści z zaakceptowanego demo (public/demo/kurs-demo.html + kurs-demo.{en,pl,uk}.js)
 * do nowego modelu LearningCourse jako wersja robocza kursu „staplerschein-theorie”.
 *
 *   npx ts-node --transpile-only src/scripts/importDemoCourse.ts [--publish]
 *
 * Karty, quizy i wideo są wyciągane z kodu demo automatycznie (te same niemieckie teksty = te same klucze tłumaczeń),
 * kroki niestandardowe (pytanie startowe, decyzje, symulacje) są opisane niżej.
 */
import fs from "fs";
import path from "path";
import vm from "vm";
import dotenv from "dotenv";
import mongoose from "mongoose";
import LearningCourse, { Lang, LText } from "../models/LearningCourse";
import { lesson13, lesson14, lesson15, lesson16 } from "./content/kapitel1Rest";
import { lesson21, lesson22, lesson23, lesson2Check, lesson2Lz } from "./content/modul2Aufbau";
import { lesson31, lesson32, lesson33, lesson3Check, lesson3Lz } from "./content/modul3Antrieb";
import { lesson41, lesson42, lesson43, lesson4Check, lesson4Lz } from "./content/modul4Stand";
import { lesson51, lesson52, lesson53, lesson5Check, lesson5Lz } from "./content/modul5Betrieb";
import { lesson61, lesson62, lesson63, lesson6Check, lesson6Lz } from "./content/modul6Pruefung";
import { lesson71, lesson72, lesson73, lesson7Check, lesson7Lz } from "./content/modul7Last";
import { lesson81, lesson82, lesson83, lesson8Check, lesson8Lz } from "./content/modul8Sonder";
import { lesson91, lesson92, lesson93, lesson9Check, lesson9Lz } from "./content/modul9Verkehr";
import { lessonU1, lessonU2 } from "./content/unfall";
import { lessonExam } from "./content/examFinal";
import { CHOICES4 } from "./content/choices4";
import { QUESTIONS4 } from "./content/questions4";
import { EXAM_EXTRA } from "./content/examExtra";
import { lessonU3, lesson44, lesson54, lesson55, lesson74, lesson84 } from "./content/erweiterung";
import { KLIENT_FRAGEN } from "./content/klientFragen";

dotenv.config({ path: path.join(__dirname, "../../.env") });
const DEMO = path.join(__dirname, "../../../public/demo");
const SLUG = "staplerschein-theorie";

/* ───────── tłumaczenia z demo ───────── */
const dict: Partial<Record<Lang, Record<string, string>>> = {};
for (const l of ["en", "pl", "uk"] as const) {
    const sandbox = { window: {} as any };
    vm.runInNewContext(fs.readFileSync(path.join(DEMO, `kurs-demo.${l}.js`), "utf8"), sandbox);
    dict[l] = sandbox.window.KURS_I18N[l];
}
const missing = new Set<string>();
/** Niemiecki tekst → LText ze wszystkimi tłumaczeniami z demo. */
const L = (de: string): LText => {
    const out: LText = { de };
    for (const l of ["en", "pl", "uk"] as const) {
        const v = dict[l]![de];
        if (v) out[l] = v; else missing.add(de);
    }
    return out;
};
/** "<b>Stichwort</b> Rest" → { k, v } w każdym języku osobno. */
const point = (html: string) => {
    const k: LText = {}, v: LText = {};
    const full = L(html);
    for (const [l, s] of Object.entries(full) as [Lang, string][]) {
        const m = s.match(/^<b>(.*?)<\/b>\s*(.*)$/s);
        k[l] = m ? m[1] : "";
        v[l] = m ? m[2] : s;
    }
    return { k, v };
};

/* ───────── wyciąganie definicji z kodu demo ───────── */
const html = fs.readFileSync(path.join(DEMO, "kurs-demo.html"), "utf8");
const js = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>"));
function callSource(name: string): string {
    const m = new RegExp(`const ${name} = (learn|seqQuiz|vid)\\(`).exec(js);
    if (!m) throw new Error(`Brak definicji ${name} w demo`);
    let i = m.index + m[0].length, depth = 1, q: string | null = null;
    for (; i < js.length && depth; i++) {
        const c = js[i];
        if (q) { if (c === "\\") i++; else if (c === q) q = null; continue; }
        if (c === "'" || c === '"' || c === "`") q = c;
        else if (c === "(") depth++;
        else if (c === ")") depth--;
    }
    return js.slice(m.index + `const ${name} = `.length, i);
}
const stubs = {
    t: (s: string) => s,
    learn: (title: string, lead: string, points: string[], merke: string, src: string) => ({ kind: "learn", title, lead, points, merke, src }),
    seqQuiz: (cfg: any) => ({ kind: "quiz", ...cfg }),
    vid: (title: string, what: string, len: string) => ({ kind: "vid", title, what, len }),
};
const raw = (name: string) => vm.runInNewContext(callSource(name), { ...stubs });

let n = 0, prefix = "st";
const sid = () => `${prefix}_${(++n).toString(36).padStart(2, "0")}`;
const startLesson = (p: string) => { n = 0; prefix = p; };
const step = (type: string, data: Record<string, unknown>) => ({ id: sid(), type, data });

function fromDemo(name: string, extra: Record<string, unknown> = {}) {
    const r = raw(name);
    if (r.kind === "learn") return step("learn", {
        title: L(r.title), lead: L(r.lead), points: r.points.map(point),
        ...(r.merke ? { merke: L(r.merke) } : {}), ...(r.src ? { src: L(r.src) } : {}), ...extra,
    });
    if (r.kind === "vid") return step("video", { title: L(r.title), brief: L(r.what), length: L(r.len) });
    const base = { title: L(r.title), ...(r.lead ? { lead: L(r.lead) } : {}), allRight: L(r.allRight), someWrong: L(r.someWrong) };
    if (r.list) return step("choice", { ...base, items: r.items.map((it: any) => ({ q: L(it.q), options: it.o.map(L), correct: it.a, why: L(it.why) })) });
    return step("sort", { ...base, labels: r.labels.map(L), items: r.items.map((it: any) => ({ t: L(it.t), a: it.a, why: L(it.why) })) });
}


/* ───────── teksty symulacji: niemieckie klucze użyte w komponentach src/learning/sims ───────── */
const SIM_SRC = path.join(__dirname, "../../../src/learning/sims");
const SIM_COMPONENT: Record<string, string> = {
    check: "CheckSim", ramp: "RampSim", park: "ParkSim", turn: "TurnSim", "turn-peds": "PedsSim", lever: "LeverSim",
    capacity: "CapacitySim", position: "PositionSim", road: "RoadSim", plan: "PlanSim", exam: "ExamSim", profile: "ProfileSim",
};
const simSources = fs.readdirSync(SIM_SRC).filter(f => /^sim.*\.tsx$/.test(f)).map(f => fs.readFileSync(path.join(SIM_SRC, f), "utf8"));
const literals = (code: string) => [...code.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(m => m[1]).filter(k => k in dict.en!);
function simTexts(kind: string): Record<string, LText> {
    const name = SIM_COMPONENT[kind];
    const file = simSources.find(src => src.includes(`export function ${name}(`))!;
    const start = file.indexOf(`export function ${name}(`);
    const next = /\n(?:export )?(?:function|const|type|interface) /g;
    next.lastIndex = start + 10;
    const end = next.exec(file)?.index;
    const body = file.slice(start, end);
    // stałe z poziomu modułu, z których korzysta komponent (np. PARK, PARK_ERR)
    const consts = [...file.matchAll(/^const (\w+)[^=\n]*=([\s\S]*?);\n(?=\S|$)/gm)].filter(m => new RegExp(`\\b${m[1]}\\b`).test(body)).map(m => m[2]);
    const keys = [...new Set([...literals(body), ...consts.flatMap(literals)])];
    return Object.fromEntries(keys.map(k => [k, L(k)]));
}
const sim = (kind: string, title: string, extra: Record<string, unknown> = {}) => step("sim", { sim: kind, title: L(title), texts: simTexts(kind), ...extra });
/** Dwa teksty z demo połączone w jeden (np. dwa akapity wyjaśnienia). */
const Lcat = (...parts: string[]): LText => {
    const ls = parts.map(L), out: LText = {};
    for (const l of ["de", "en", "pl", "uk"] as const) out[l] = ls.map(x => x[l] ?? x.de).join(" ");
    return out;
};
const deHtml = (t: LText): LText => Object.fromEntries(Object.entries(t).map(([k, v]) => [k, String(v).replace(/&amp;/g, "&")])) as LText;

/* ───────── Lernziele ───────── */
function lessonLz() {
    startLesson("slz");
    const look = (skin: string, hair: string, top: string, o: Record<string, boolean> = {}) => ({ skin, hair, top, ...o });
    const fact = (k: string, v: string) => ({ k: L(k), v: /^\d+$/.test(v) ? { de: v } : L(v) });
    const kase = (name: string, lk: any, role: string, f: [string, string][], say: string, ok: boolean, why: string, rule: string, src: string, topic: string) =>
        ({ name, look: lk, role: L(role), facts: f.map(([k, v]) => fact(k, v)), say: L(say), ok, why: L(why), rule: L(rule), src: L(src), topic });
    const goals = ([
        ["1.1", "Ich kann erklären, warum für den Stapler eine eigene Ausbildung Pflicht ist.", "Warum Ausbildung"],
        ["1.2", "Ich kenne die Pflichten von Unternehmer und Fahrer nach DGUV Vorschrift 68.", "Pflichten V68"],
        ["1.3", "Ich weiß, welche Gesetze und Verordnungen für mich gelten.", "Rechtsgrundlagen"],
        ["1.4", "Ich kenne die Folgen von Fehlverhalten: Haftung, Strafen, Personenschäden.", "Folgen"],
        ["1.5", "Ich erkenne einen gültigen Staplerschein, als Karte und im Wallet.", "Staplerschein"],
        ["1.6", "Ich kenne die drei Ausbildungsstufen nach DGUV G 308-001.", "Stufensystem"],
    ] as const).map(([code, text, short]) => ({ code, text: L(text), short: L(short) }));
    const plan: [string, number, number, string[], boolean?][] = [
        ["Unfallgeschehen", 5, 5, ["Unfallstatistiken", "Ausgewählte Unfälle"]],
        ["Rechtliche Grundlagen", 10, 15, ["DGUV Vorschrift 68 und 1", "Betriebssicherheitsverordnung", "Arbeitsschutzgesetz", "Maschinenverordnung, CE-Zeichen", "StVO, StVZO, FZV, FeV"], true],
        ["Aufbau und Funktion", 5, 10, ["Aufbau des Gabelstaplers", "Andere Flurförderzeuge", "Lenkung im Vergleich zum Auto", "Anbaugeräte, Rückhaltesysteme"]],
        ["Antriebsarten", 5, 10, ["Elektro: Blei-Säure, Blei-Gel, Lithium-Ionen", "Diesel, Flüssiggas, Erdgas", "Laden, Tanken, Abgase"]],
        ["Standsicherheit", 10, 15, ["Hebelgesetz, Lastschwerpunktdiagramm", "Kippdreieck", "Kurvenfahrt und Bremsen", "Boden, Bereifung, Achsen"]],
        ["Betrieb allgemein", 15, 20, ["Betriebsanleitung und -anweisung", "Geschwindigkeit", "Abstellen und Sichern", "Gefährdung anderer Personen"]],
        ["Regelmäßige Prüfung", 5, 5, ["Tägliche Einsatzprüfung", "Prüfung durch befähigte Person", "Prüfplakette"]],
        ["Umgang mit Last", 10, 15, ["Lastaufnahme", "Regale und Stapel", "Be- und Entladen", "Hängende Lasten, Gefahrstoffe"]],
        ["Sondereinsätze", 10, 15, ["Arbeitsbühnen", "Öffentlicher Verkehr", "Anhänger und Waggons", "Tiefkühl- und Ex-Bereich"]],
        ["Verkehrsregeln", 5, 5, ["Innerbetriebliche Regeln", "Rampen, Tore, Regalgänge", "Gleisanlagen"]],
        ["Abschlussprüfung", 5, 5, ["Ca. 50 Fragen, Multiple Choice", "Bestanden ab 80 %"]],
    ];
    return [
        step("intro", { title: deHtml(L("Grundlagen &amp; Vorschriften")), image: "blueprint",
            text: L("Bevor du einen Stapler bewegst, klären wir, wer überhaupt fahren darf und warum. Kurz, praktisch und mit ein paar Überraschungen."),
            meta: [L("ca. 5 Minuten"), L("5 Fälle"), { de: "DGUV V68, G 308-001" }] }),
        step("cases", {
            title: L("Wer darf heute Stapler fahren?"),
            text: L("Diese fünf Personen wollen heute auf den Stapler. Entscheide bei jeder: darf sie fahren oder nicht?"),
            note: L("Die Regeln musst du noch nicht kennen. Nach jeder Entscheidung bekommst du die Begründung."),
            cases: [
                kase("Marco", look("#d9a07a", "#3b2a1e", "#2563eb", { beard: true }), "Berufskraftfahrer, neu im Lager", [["Alter", "35"], ["Führerschein", "PKW + LKW"], ["Staplerausbildung", "keine"], ["Schriftlicher Auftrag", "nein"]],
                    "„Ich fahre seit 15 Jahren LKW. Ein Stapler ist kein Problem.“", false, "Ein Führerschein befähigt nicht zum Staplerfahren. Die Lenkachse liegt hinten, die Last liegt frei auf den Gabeln und der Stapler kippt anders als ein LKW.", "Führerschein ersetzt keine Ausbildung", "DGUV G 308-001, Vorbemerkung", "1.1"),
                kase("Lena", look("#f3c9a8", "#b45309", "#facc15", { vest: true, long: true }), "Azubi Fachkraft für Lagerlogistik", [["Alter", "17"], ["Führerschein", "keiner"], ["Staplerausbildung", "läuft in der Berufsausbildung"], ["Schriftlicher Auftrag", "nein"]],
                    "Ihr Ausbilder ist in der Pause. Sie will allein zwei Paletten umsetzen.", false, "Unter 18 darf sie nur im Rahmen der Berufsausbildung und nur unter fachlicher Aufsicht fahren. Allein ist es nicht erlaubt.", "Unter 18 nur unter Aufsicht", "DGUV V68 §7, G 308-001 Abschn. 2.1", "1.2"),
                kase("Aylin", look("#b9825a", "#1f1a17", "#f97706", { vest: true, long: true }), "Lagermitarbeiterin, seit einer Woche im Betrieb", [["Alter", "24"], ["Führerschein", "PKW"], ["Staplerausbildung", "Staplerschein bestanden"], ["Schriftlicher Auftrag", "nur mündlich"]],
                    "Die Schichtleiterin ruft: „Fahr mal die Palette an Tor 3.“", false, "Die Ausbildung hat sie. Der Auftrag zum selbstständigen Fahren muss aber schriftlich vom Unternehmer kommen. Ein Zuruf reicht nicht.", "Fahrauftrag nur schriftlich", "DGUV V68 §7 Abs. 1", "1.2"),
                kase("Tomasz", look("#e8b48e", "#9ca3af", "#0f766e"), "Staplerfahrer, erster Arbeitstag", [["Alter", "41"], ["Führerschein", "PKW"], ["Staplerausbildung", "Staplerschein, 10 Jahre Praxis"], ["Schriftlicher Auftrag", "vom früheren Arbeitgeber"]],
                    "Er legt der neuen Firma seinen bisherigen Fahrauftrag vor.", false, "Der Fahrauftrag gilt nur in der Firma, die ihn erteilt hat, und erlischt beim Ausscheiden. Der neue Arbeitgeber muss selbst schriftlich beauftragen.", "Auftrag erlischt beim Firmenwechsel", "DGUV G 308-001, Abschn. 4", "1.2"),
                kase("Sven", look("#f0c29e", "#d6a24a", "#facc15", { vest: true }), "Staplerfahrer im Wareneingang", [["Alter", "29"], ["Führerschein", "PKW"], ["Staplerausbildung", "Staplerschein + Einweisung im Betrieb"], ["Schriftlicher Auftrag", "vom jetzigen Arbeitgeber"]],
                    "Vor Schichtbeginn macht er die Einsatzprüfung und fährt los.", true, "Alles erfüllt: Alter, Eignung, Ausbildung, nachgewiesene Befähigung, schriftlicher Auftrag und Einweisung auf das Gerät im Betrieb.", "Alle Voraussetzungen erfüllt", "DGUV V68 §7, G 308-001 Abschn. 3.4", "1.6"),
            ],
        }),
        step("self", { title: L("Wie sicher bist du heute?"), lead: L("Das sind deine Lernziele für Kapitel 1. 1 = unbekannt, 5 = sicher. Falsch gibt es hier nicht."), goals: goals.slice(0, 3) }),
        step("self", { title: L("Noch drei Ziele"), lead: L("Gleiche Skala: 1 = unbekannt, 5 = sicher."), goals: goals.slice(3) }),
        sim("profile", "Dein Startprofil", { goals: goals.map(g => ({ code: g.code, short: g.short })) }),
        sim("plan", "So ist die Theorie aufgebaut", { rows: plan.map(([t, min, max, items, cur]) => ({ title: L(t), min, max, items: items.map(L), ...(cur ? { current: true } : {}) })) }),
        sim("exam", "Die Prüfung am Ende", { questions: 50, passPercent: 80 }),
        step("summary", { title: L("Das nimmst du mit"), ordered: false, points: [
            "<b>Führerschein reicht nicht.</b> Der Stapler lenkt hinten, die Last liegt frei vorne und er kippt anders als ein Auto.",
            "<b>Selbstständig fahren</b> darfst du ab 18, geeignet, ausgebildet, mit bestandener Prüfung und schriftlichem Auftrag deines jetzigen Arbeitgebers.",
            "<b>Drei Stufen:</b> Dieser Kurs ist Stufe 1. Zusatzausbildung für spezielle Geräte und die Einweisung im Betrieb folgen.",
        ].map(point) }),
    ];
}

/* ───────── temat 1.1 ───────── */
function lesson11() {
    startLesson("s11");
    const chips = ["schriftlich", "16", "Befähigung", "geeignet", "mündlich", "ausgebildet", "18", "Führerschein"];
    return [
        step("question", {
            title: L("Du fährst seit Jahren Auto. Reicht das für den Stapler?"), illustration: "car-forklift",
            text: L("Bevor wir starten: Was meinst du?"),
            options: [L("Ja, reicht"), L("Nein")], correct: 1,
            resultTitle: { right: L("Richtig"), wrong: L("Leider nein") },
            quote: L("„Wer einen Kraftfahrzeug-Führerschein besitzt, ist nicht allein deshalb schon befähigt, Gabelstapler zu führen.“"),
            body: L("In den nächsten Minuten erlebst du selbst, warum."), src: L("DGUV G 308-001, Vorbemerkung"), button: L("Los geht’s"),
        }),
        fromDemo("L1"), fromDemo("L2"),
        sim("turn", "Lenkung: Auto und Stapler im Vergleich"),
        sim("turn-peds", "Wo wird es für deinen Kollegen gefährlich?"),
        step("video", { title: L("Im echten Leben"), brief: L("Ein Stapler biegt auf eurem Übungsplatz eng ab, gefilmt von oben oder von der Seite. Pylone markieren den Weg des Hecks."), length: L("15 bis 30 Sekunden") }),
        fromDemo("L3", { formula: [L("Lastmoment"), L("Gewicht der Last"), L("Abstand zur Vorderachse")] }),
        sim("lever", "Die Wippe: Wann kippt der Stapler?"),
        sim("capacity", "Darfst du diese Palette heben?"),
        fromDemo("L4"),
        sim("position", "Stell die richtige Fahrstellung ein"),
        fromDemo("q11a"), fromDemo("L5"),
        step("gap", {
            title: L("Was steht in DGUV Vorschrift 68 §7?"),
            sentence: L("Der Unternehmer darf mit dem selbstständigen Steuern von Flurförderzeugen mit Fahrersitz oder Fahrerstand nur Personen beauftragen, die mindestens {1} Jahre alt sind, für diese Tätigkeit {2} und {3} sind und ihre {4} nachgewiesen haben. Der Auftrag muss {5} erteilt werden."),
            chips: chips.map(c => ({ id: c, text: /^\d+$/.test(c) ? { de: c } : L(c) })),
            answer: ["18", "geeignet", "ausgebildet", "Befähigung", "schriftlich"], interchangeable: [[1, 2]],
            success: { title: L("Genau so steht es in §7"), body: Lcat("Fünf Voraussetzungen: mindestens 18 Jahre, geeignet, ausgebildet, Befähigung nachgewiesen und ein schriftlicher Auftrag.", "Was das für dich und deinen Arbeitgeber genau bedeutet, lernst du in Thema 1.2."), src: { de: "DGUV V68 §7 Abs. 1" } },
        }),
        fromDemo("L6"), fromDemo("q11b"), fromDemo("L7"), fromDemo("q11c"),
        sim("road", "Im Betrieb oder auf der Straße?"),
        fromDemo("q11d"),
        step("summary", { title: L("Das nimmst du mit"), points: [
            "<b>Hinterradlenkung:</b> Das Heck schwenkt aus. Achte vor dem Lenken auf Personen neben und hinter dir.",
            "<b>Wippe:</b> Gewicht und Lastschwerpunkt entscheiden zusammen, ob der Stapler stehen bleibt. Das Lastschwerpunktdiagramm zeigt die Grenze.",
            "<b>Fahrstellung:</b> Last bodenfrei, Hubmast zurückgeneigt.",
            "<b>Darum ist die Ausbildung Pflicht:</b> Fahren darf nur, wer mindestens 18, geeignet, ausgebildet und schriftlich beauftragt ist. Auf der Straße kommt der Führerschein dazu.",
        ].map(point) }),
    ];
}

/* ───────── temat 1.2 ───────── */
function lesson12() {
    startLesson("s12");
    return [
        step("question", {
            title: L("Wer sorgt dafür, dass im Lager sicher Stapler gefahren wird?"),
            text: L("Bevor wir starten: Was meinst du?"),
            illustration: "employer-driver",
            options: [L("Unternehmer"), L("Fahrer"), L("Beide")], correct: 2,
            resultTitle: { right: L("Richtig, beide"), wrong: L("Nicht nur") },
            quote: L("„Soweit nichts anderes bestimmt ist, richten sich die Bestimmungen dieses Abschnittes an Unternehmer und Versicherte.“"),
            body: L("Versicherte sind alle Beschäftigten, also auch du. Welche Pflichten auf welcher Seite liegen, lernst du jetzt."),
            src: { de: "DGUV V68 §4" }, button: L("Los geht’s"),
        }),
        fromDemo("L12a"), fromDemo("L12b"), fromDemo("L12c"), fromDemo("q12a"),
        fromDemo("L12d", { compare: [
            { label: L("vom Hersteller"), title: L("Betriebsanleitung"), text: L("Gehört zum Gerät: Bedienung, Wartung, bestimmungsgemäße Verwendung.") },
            { label: L("vom Unternehmer"), title: L("Betriebsanweisung"), text: L("Gilt für deinen Betrieb, aufgebaut auf der Anleitung und den Gegebenheiten vor Ort.") },
        ] }),
        fromDemo("q12b"), fromDemo("L12e"), fromDemo("V12a"),
        sim("check", "Deine Einsatzprüfung", { points: [
            { id: "gabel", label: L("Gabelzinken"), finding: L("Feiner Riss am Übergang zum Gabelrücken der linken Zinke"), bad: true },
            { id: "kette", label: L("Hubketten"), finding: L("Beide Ketten gleichmäßig gespannt") },
            { id: "hydr", label: L("Hydraulik"), finding: L("Schläuche trocken, kein Öl am Boden") },
            { id: "reifen", label: L("Reifen"), finding: L("Profil in Ordnung, keine Schnitte") },
            { id: "bremse", label: L("Bremsen"), finding: L("Betriebs- und Feststellbremse greifen") },
            { id: "licht", label: L("Hupe und Licht"), finding: L("Hupe und Beleuchtung funktionieren") },
        ] }),
        step("question", {
            title: L("Riss an der Gabelzinke. Was tust du?"), layout: "list",
            text: L("Bei deiner Einsatzprüfung hast du einen feinen Riss an der linken Gabelzinke gefunden. Die Schicht beginnt in fünf Minuten."),
            options: [L("Vorsichtig fahren, nur mit leichten Lasten"), L("Nicht fahren und den Mangel sofort melden"), L("Den Riss selbst zuschweißen und losfahren")], correct: 1,
            resultTitle: { right: L("Richtig"), wrong: L("Nein, das ist gefährlich") },
            quote: L("„Er darf Flurförderzeuge, an denen Mängel, die die Sicherheit beeinträchtigen, erkannt worden sind, nicht in Betrieb setzen oder weiter benutzen. Er hat erkannte Mängel dem Unternehmer umgehend zu melden.“"),
            body: L("Eine gerissene Gabelzinke kann unter Last brechen. Reparieren darf nur eine fachkundige Person, zum Beispiel der Kundendienst des Herstellers."),
            src: L("DGUV V68 §9 Abs. 1, §10 Abs. 1 mit DA"),
        }),
        fromDemo("L12f"), fromDemo("V12b"),
        sim("ramp", "Mit Last auf der Rampe"),
        fromDemo("L12g", { ordered: true }), fromDemo("V12c"),
        sim("park", "Feierabend: Stell den Stapler ab"),
        fromDemo("L12h"), fromDemo("q12c"), fromDemo("q12d"),
        step("summary", { title: L("Das nimmst du mit"), points: [
            "<b>Beide Seiten tragen Pflichten.</b> Der Unternehmer beauftragt schriftlich, schreibt die Betriebsanweisung, lässt jährlich prüfen und Mängel beheben.",
            "<b>Du prüfst jeden Tag</b> vor Schichtbeginn. Mit einem Sicherheitsmangel fährst du nicht und meldest ihn sofort.",
            "<b>Beim Fahren:</b> Sicht auf die Fahrbahn, angepasstes Tempo, Last bodenfrei, Mast zurückgeneigt, auf Rampen die Last bergseitig.",
            "<b>Beim Verlassen:</b> freier Platz, Feststellbremse, Gabel unten und geneigt, Motor aus, Schlüssel mitnehmen.",
        ].map(point) }),
    ];
}

async function main() {
    const lz = lessonLz(), l11 = lesson11(), steps12 = lesson12();
    const rest = (p: string, f: typeof lesson13) => { startLesson(p); return f(step); };
    const l13 = rest("s13", lesson13), l14 = rest("s14", lesson14), l15 = rest("s15", lesson15), l16 = rest("s16", lesson16);
    const m2 = { lz: rest("s2lz", lesson2Lz), l21: rest("s21", lesson21), l22: rest("s22", lesson22), l23: rest("s23", lesson23), chk: rest("s2ck", lesson2Check) };
    const m3 = { lz: rest("s3lz", lesson3Lz), l31: rest("s31", lesson31), l32: rest("s32", lesson32), l33: rest("s33", lesson33), chk: rest("s3ck", lesson3Check) };
    const m4 = { lz: rest("s4lz", lesson4Lz), l41: rest("s41", lesson41), l42: rest("s42", lesson42), l43: rest("s43", lesson43), chk: rest("s4ck", lesson4Check) };
    const m5 = { lz: rest("s5lz", lesson5Lz), l51: rest("s51", lesson51), l52: rest("s52", lesson52), l53: rest("s53", lesson53), chk: rest("s5ck", lesson5Check) };
    const m6 = { lz: rest("s6lz", lesson6Lz), l61: rest("s61", lesson61), l62: rest("s62", lesson62), l63: rest("s63", lesson63), chk: rest("s6ck", lesson6Check) };
    const m7 = { lz: rest("s7lz", lesson7Lz), l71: rest("s71", lesson71), l72: rest("s72", lesson72), l73: rest("s73", lesson73), chk: rest("s7ck", lesson7Check) };
    const m8 = { lz: rest("s8lz", lesson8Lz), l81: rest("s81", lesson81), l82: rest("s82", lesson82), l83: rest("s83", lesson83), chk: rest("s8ck", lesson8Check) };
    const mu = { u1: rest("su1", lessonU1), u2: rest("su2", lessonU2), u3: rest("su3", lessonU3) };
    const mx = { l44: rest("s44", lesson44), l54: rest("s54", lesson54), l55: rest("s55", lesson55), l74: rest("s74", lesson74), l84: rest("s84", lesson84) };
    const m9 = { lz: rest("s9lz", lesson9Lz), l91: rest("s91", lesson91), l92: rest("s92", lesson92), l93: rest("s93", lesson93), chk: rest("s9ck", lesson9Check) };
    const T4 = (de: string, en: string, pl: string, uk: string) => ({ de, en, pl, uk });
    const draft = {
        title: L("Staplerschein Theorie"),
        description: { de: "Allgemeine Ausbildung nach DGUV Grundsatz 308-001, Stufe 1.", en: "General training under DGUV Principle 308-001, level 1.", pl: "Szkolenie ogólne według DGUV Grundsatz 308-001, stopień 1.", uk: "Загальне навчання за DGUV Grundsatz 308-001, ступінь 1." },
        chapters: [{
            id: "ch_unfall", title: T4("Unfallgeschehen", "Accident statistics", "Wypadki z wózkami", "Нещасні випадки"),
            description: T4("Unfallzahlen mit Flurförderzeugen in Deutschland und zwei echte Unfälle, aus denen du lernst.", "Accident figures for industrial trucks in Germany and two real accidents to learn from.", "Liczby wypadków z wózkami w Niemczech i dwa prawdziwe wypadki, z których się uczysz.", "Статистика нещасних випадків з навантажувачами в Німеччині й два реальні випадки для навчання."),
            lessons: [
                { id: "ls_u_1", title: T4("Zahlen und Fakten", "Facts and figures", "Liczby i fakty", "Цифри й факти"), durationMin: 7, steps: mu.u1 },
                { id: "ls_u_2", title: T4("Aus Unfällen lernen", "Learning from accidents", "Nauka z wypadków", "Уроки з нещасних випадків"), durationMin: 8, steps: mu.u2 },
                { id: "ls_u_3", title: T4("Warum Unfälle passieren", "Why accidents happen", "Dlaczego dochodzi do wypadków", "Чому стаються нещасні випадки"), durationMin: 8, steps: mu.u3 },
            ],
        }, {
            id: "ch_grundlagen", title: deHtml(L("Grundlagen &amp; Vorschriften")),
            lessons: [
                { id: "ls_lz", title: L("Lernziele"), durationMin: 5, steps: lz },
                { id: "ls_1_1", title: L("1.1 Warum eine Ausbildung vorgeschrieben ist"), durationMin: 15, steps: l11 },
                { id: "ls_1_2", title: L("1.2 DGUV Vorschrift 68: Pflichten"), durationMin: 15, steps: steps12 },
                { id: "ls_1_3", title: T4("1.3 Rechtliche Grundlagen", "1.3 Legal basis", "1.3 Podstawy prawne", "1.3 Правові основи"), durationMin: 12, steps: l13 },
                { id: "ls_1_4", title: T4("1.4 Folgen von Fehlverhalten", "1.4 Consequences of misconduct", "1.4 Skutki naruszania zasad", "1.4 Наслідки порушень"), durationMin: 12, steps: l14 },
                { id: "ls_1_5", title: T4("1.5 Aufbau des Staplerscheins", "1.5 The forklift licence", "1.5 Jak wygląda Staplerschein", "1.5 Як виглядає Staplerschein"), durationMin: 8, steps: l15 },
                { id: "ls_1_6", title: T4("1.6 Das Stufensystem", "1.6 The level system", "1.6 System stopni", "1.6 Система ступенів"), durationMin: 8, steps: l16 },
            ],
        }, {
            id: "ch_aufbau", title: T4("Aufbau, Funktion & Typen", "Design, function & types", "Budowa, działanie i typy", "Будова, принцип роботи і типи"),
            description: T4("Bauteile des Frontstaplers, Sonderbauformen und Anbaugeräte.", "Components of the front forklift, special types and attachments.", "Części wózka czołowego, typy specjalne i osprzęt.", "Деталі фронтального навантажувача, спецтипи та навісне обладнання."),
            lessons: [
                { id: "ls_2_lz", title: T4("Lernziele", "Learning goals", "Cele nauki", "Цілі навчання"), durationMin: 3, steps: m2.lz },
                { id: "ls_2_1", title: T4("2.1 Der klassische Frontstapler", "2.1 The classic front forklift", "2.1 Klasyczny wózek czołowy", "2.1 Класичний фронтальний навантажувач"), durationMin: 10, steps: m2.l21 },
                { id: "ls_2_2", title: T4("2.2 Sonderbauformen im Überblick", "2.2 Special types at a glance", "2.2 Typy specjalne w skrócie", "2.2 Спеціальні типи: огляд"), durationMin: 8, steps: m2.l22 },
                { id: "ls_2_3", title: T4("2.3 Anbaugeräte", "2.3 Attachments", "2.3 Osprzęt", "2.3 Навісне обладнання"), durationMin: 8, steps: m2.l23 },
                { id: "ls_2_check", title: T4("Modul-Check", "Module check", "Test modułu", "Перевірка модуля"), durationMin: 5, steps: m2.chk },
            ],
        }, {
            id: "ch_antrieb", title: T4("Antriebsarten", "Drive types", "Rodzaje napędu", "Типи приводу"),
            description: T4("Elektroantrieb und Batterien, Laden und Wechseln, Verbrennungsmotor und Treibgas.", "Electric drive and batteries, charging and changing, combustion engine and LPG.", "Napęd elektryczny i akumulatory, ładowanie i wymiana, silnik spalinowy i gaz.", "Електропривід і батареї, зарядка й заміна, ДВЗ і газ."),
            lessons: [
                { id: "ls_3_lz", title: T4("Lernziele", "Learning goals", "Cele nauki", "Цілі навчання"), durationMin: 3, steps: m3.lz },
                { id: "ls_3_1", title: T4("3.1 Elektroantrieb und Batterien", "3.1 Electric drive and batteries", "3.1 Napęd elektryczny i akumulatory", "3.1 Електропривід і батареї"), durationMin: 8, steps: m3.l31 },
                { id: "ls_3_2", title: T4("3.2 Batterie laden und wechseln", "3.2 Charging and changing the battery", "3.2 Ładowanie i wymiana akumulatora", "3.2 Зарядка й заміна батареї"), durationMin: 7, steps: m3.l32 },
                { id: "ls_3_3", title: T4("3.3 Verbrennungsmotor und Treibgas", "3.3 Combustion engine and LPG", "3.3 Silnik spalinowy i gaz płynny", "3.3 Двигун внутрішнього згоряння і зріджений газ"), durationMin: 8, steps: m3.l33 },
                { id: "ls_3_check", title: T4("Modul-Check", "Module check", "Test modułu", "Перевірка модуля"), durationMin: 4, steps: m3.chk },
            ],
        }, {
            id: "ch_stand", title: T4("Standsicherheit", "Stability", "Stateczność", "Стійкість"),
            description: T4("Schwerpunkt und Lastschwerpunktdiagramm, Kippdreieck und Kurvenfahrt, Boden, Reifen und Gefälle.", "Centre of gravity and load centre diagram, stability triangle and cornering, floor, tyres and slopes.", "Środek ciężkości i wykres udźwigu, trójkąt stateczności i łuki, podłoże, opony i spadki.", "Центр ваги й діаграма, трикутник стійкості й повороти, підлога, шини й схили."),
            lessons: [
                { id: "ls_4_lz", title: T4("Lernziele", "Learning goals", "Cele nauki", "Цілі навчання"), durationMin: 3, steps: m4.lz },
                { id: "ls_4_1", title: T4("4.1 Schwerpunkt und Lastschwerpunktdiagramm", "4.1 Centre of gravity and load centre diagram", "4.1 Środek ciężkości i wykres udźwigu", "4.1 Центр ваги й діаграма вантажопідйомності"), durationMin: 10, steps: m4.l41 },
                { id: "ls_4_2", title: T4("4.2 Kippdreieck und Kurvenfahrt", "4.2 Stability triangle and cornering", "4.2 Trójkąt stateczności i łuki", "4.2 Трикутник стійкості й повороти"), durationMin: 8, steps: m4.l42 },
                { id: "ls_4_3", title: T4("4.3 Boden, Reifen und Gefälle", "4.3 Floor, tyres and slopes", "4.3 Podłoże, opony i spadki", "4.3 Підлога, шини й схили"), durationMin: 6, steps: m4.l43 },
                { id: "ls_4_4", title: T4("4.4 Bremsen, Anhalteweg und Gewicht", "4.4 Braking, stopping distance and weight", "4.4 Hamowanie, droga zatrzymania i masa", "4.4 Гальмування, шлях зупинки й маса"), durationMin: 14, steps: mx.l44 },
                { id: "ls_4_check", title: T4("Modul-Check", "Module check", "Test modułu", "Перевірка модуля"), durationMin: 4, steps: m4.chk },
            ],
        }, {
            id: "ch_betrieb", title: T4("Betrieb allgemein", "General operation", "Eksploatacja ogólna", "Загальна експлуатація"),
            description: T4("Betriebsanleitung, Betriebsanweisung und Fahrauftrag, Abstellen und Sichern, andere Personen schützen.", "Operating manual, operating instructions and driving authorisation, parking and securing, protecting other people.", "Instrukcja obsługi, instrukcja stanowiskowa i upoważnienie do jazdy, odstawianie i zabezpieczanie, ochrona innych osób.", "Посібник, робоча інструкція й доручення, стоянка й убезпечення, захист інших людей."),
            lessons: [
                { id: "ls_5_lz", title: T4("Lernziele", "Learning goals", "Cele nauki", "Цілі навчання"), durationMin: 3, steps: m5.lz },
                { id: "ls_5_1", title: T4("5.1 Betriebsanleitung, Betriebsanweisung und Fahrauftrag", "5.1 Operating manual, operating instructions and driving authorisation", "5.1 Instrukcja obsługi, instrukcja stanowiskowa i upoważnienie do jazdy", "5.1 Інструкція з експлуатації, робоча інструкція й доручення"), durationMin: 8, steps: m5.l51 },
                { id: "ls_5_2", title: T4("5.2 Abstellen und Sichern", "5.2 Parking and securing", "5.2 Odstawianie i zabezpieczanie", "5.2 Стоянка й убезпечення"), durationMin: 6, steps: m5.l52 },
                { id: "ls_5_3", title: T4("5.3 Andere Personen schützen", "5.3 Protecting other people", "5.3 Ochrona innych osób", "5.3 Захист інших людей"), durationMin: 8, steps: m5.l53 },
                { id: "ls_5_4", title: T4("5.4 Recht, Eignung und Pflichten", "5.4 Law, fitness and duties", "5.4 Prawo, predyspozycje i obowiązki", "5.4 Право, придатність і обов’язки"), durationMin: 20, steps: mx.l54 },
                { id: "ls_5_5", title: T4("5.5 Rückwärtsfahren, Tore und Mitgänger-Geräte", "5.5 Reversing, gates and pedestrian trucks", "5.5 Jazda tyłem, bramy i wózki prowadzone", "5.5 Задній хід, ворота й візки із супроводом"), durationMin: 20, steps: mx.l55 },
                { id: "ls_5_check", title: T4("Modul-Check", "Module check", "Test modułu", "Перевірка модуля"), durationMin: 4, steps: m5.chk },
            ],
        }, {
            id: "ch_pruefung", title: T4("Regelmäßige Prüfung", "Regular inspection", "Regularne kontrole", "Регулярні перевірки"),
            description: T4("Tägliche Sicht- und Funktionsprüfung, Mängel melden und Stapler sichern, Prüfung durch die befähigte Person mit Prüfnachweis und Plakette.", "Daily visual and function check, reporting defects and securing the forklift, inspection by the competent person with record and sticker.", "Codzienna kontrola wzrokowa i działania, zgłaszanie usterek i zabezpieczanie wózka, kontrola przez osobę uprawnioną z protokołem i plakietką.", "Щоденна візуальна перевірка й перевірка функцій, повідомлення про дефекти й убезпечення, перевірка компетентною особою з протоколом і наклейкою."),
            lessons: [
                { id: "ls_6_lz", title: T4("Lernziele", "Learning goals", "Cele nauki", "Цілі навчання"), durationMin: 3, steps: m6.lz },
                { id: "ls_6_1", title: T4("6.1 Tägliche Sicht- und Funktionsprüfung", "6.1 Daily visual and function check", "6.1 Codzienna kontrola wzrokowa i kontrola działania", "6.1 Щоденна візуальна перевірка й перевірка функцій"), durationMin: 10, steps: m6.l61 },
                { id: "ls_6_2", title: T4("6.2 Mängel melden und Stapler sichern", "6.2 Reporting defects and securing the forklift", "6.2 Zgłaszanie usterek i zabezpieczanie wózka", "6.2 Повідомлення про дефекти й убезпечення навантажувача"), durationMin: 6, steps: m6.l62 },
                { id: "ls_6_3", title: T4("6.3 Prüfung durch die befähigte Person", "6.3 Inspection by the competent person", "6.3 Przegląd przez osobę uprawnioną", "6.3 Перевірка компетентною особою"), durationMin: 7, steps: m6.l63 },
                { id: "ls_6_check", title: T4("Modul-Check", "Module check", "Test modułu", "Перевірка модуля"), durationMin: 4, steps: m6.chk },
            ],
        }, {
            id: "ch_last", title: T4("Umgang mit Last", "Handling loads", "Praca z ładunkiem", "Робота з вантажем"),
            description: T4("Last aufnehmen und in Fahrstellung fahren, absetzen, stapeln und Regale, Sicht, Lkw beladen, hängende Lasten und Gefahrstoffe.", "Picking up loads and driving in travel position, setting down, stacking and racks, visibility, loading lorries, suspended loads and hazardous substances.", "Podejmowanie ładunku i jazda w pozycji transportowej, odkładanie, piętrowanie i regały, widoczność, załadunek ciężarówek, ładunki podwieszone i substancje niebezpieczne.", "Підйом вантажу й їзда в транспортному положенні, опускання, штабелювання й стелажі, огляд, навантаження вантажівок, підвішені вантажі й небезпечні речовини."),
            lessons: [
                { id: "ls_7_lz", title: T4("Lernziele", "Learning goals", "Cele nauki", "Цілі навчання"), durationMin: 3, steps: m7.lz },
                { id: "ls_7_1", title: T4("7.1 Last aufnehmen und fahren", "7.1 Picking up and driving with a load", "7.1 Podejmowanie ładunku i jazda", "7.1 Підйом вантажу та їзда"), durationMin: 10, steps: m7.l71 },
                { id: "ls_7_2", title: T4("7.2 Absetzen, Stapeln und Regale", "7.2 Setting down, stacking and racks", "7.2 Odkładanie, piętrowanie i regały", "7.2 Опускання, штабелювання й стелажі"), durationMin: 9, steps: m7.l72 },
                { id: "ls_7_3", title: T4("7.3 Sicht, Lkw und besondere Lasten", "7.3 Visibility, lorries and special loads", "7.3 Widoczność, ciężarówki i ładunki szczególne", "7.3 Огляд, вантажівки й особливі вантажі"), durationMin: 9, steps: m7.l73 },
                { id: "ls_7_4", title: T4("7.4 Stapeln im Blocklager", "7.4 Stacking in the block store", "7.4 Piętrowanie w magazynie blokowym", "7.4 Штабелювання на блоковому складі"), durationMin: 12, steps: mx.l74 },
                { id: "ls_7_check", title: T4("Modul-Check", "Module check", "Test modułu", "Перевірка модуля"), durationMin: 4, steps: m7.chk },
            ],
        }, {
            id: "ch_sonder", title: T4("Sondereinsätze", "Special operations", "Zastosowania specjalne", "Особливі види робіт"),
            description: T4("Arbeitsbühnen und Mitnahme, öffentliche Straßen, Anhänger und Eisenbahnwaggons, Ex-Bereiche, Tiefkühllager und feuerflüssige Massen.", "Work platforms and passengers, public roads, trailers and railway wagons, explosive areas, freezer stores and molten masses.", "Podesty robocze i przewóz osób, drogi publiczne, przyczepy i wagony, strefy Ex, mroźnie i ciekły metal.", "Робочі платформи й пасажири, дороги, причепи й вагони, Ex-зони, морозильні склади й розплав."),
            lessons: [
                { id: "ls_8_lz", title: T4("Lernziele", "Learning goals", "Cele nauki", "Цілі навчання"), durationMin: 3, steps: m8.lz },
                { id: "ls_8_1", title: T4("8.1 Arbeitsbühnen und Mitnahme von Personen", "8.1 Work platforms and carrying people", "8.1 Podesty robocze i przewóz osób", "8.1 Робочі платформи й перевезення людей"), durationMin: 9, steps: m8.l81 },
                { id: "ls_8_2", title: T4("8.2 Straße, Anhänger und Eisenbahnwaggons", "8.2 Road, trailers and railway wagons", "8.2 Droga, przyczepy i wagony", "8.2 Дорога, причепи й вагони"), durationMin: 9, steps: m8.l82 },
                { id: "ls_8_3", title: T4("8.3 Ex-Bereich, Kälte und feuerflüssige Massen", "8.3 Explosive areas, cold and molten masses", "8.3 Strefa Ex, zimno i ciekły metal", "8.3 Ex-зона, холод і розплав"), durationMin: 8, steps: m8.l83 },
                { id: "ls_8_4", title: T4("8.4 Freileitungen und Strom", "8.4 Overhead lines and electricity", "8.4 Linie napowietrzne i prąd", "8.4 Повітряні лінії та струм"), durationMin: 12, steps: mx.l84 },
                { id: "ls_8_check", title: T4("Modul-Check", "Module check", "Test modułu", "Перевірка модуля"), durationMin: 4, steps: m8.chk },
            ],
        }, {
            id: "ch_verkehr", title: T4("Verkehrsregelung und Verkehrswege", "Traffic rules and traffic routes", "Zasady ruchu i drogi komunikacyjne", "Правила руху й транспортні шляхи"),
            description: T4("Vorfahrt, Tempo und Zeichen im Betrieb, Breite und Zustand der Verkehrswege, Tore, Rampen, Aufzüge, Gleise und Schmalgänge.", "Right of way, speed and signs at work, width and condition of routes, gates, ramps, lifts, tracks and narrow aisles.", "Pierwszeństwo, prędkość i znaki w zakładzie, szerokość i stan dróg, bramy, rampy, windy, tory i wąskie alejki.", "Перевага, швидкість і знаки на підприємстві, ширина й стан шляхів, ворота, рампи, ліфти, колії й вузькі проходи."),
            lessons: [
                { id: "ls_9_lz", title: T4("Lernziele", "Learning goals", "Cele nauki", "Цілі навчання"), durationMin: 3, steps: m9.lz },
                { id: "ls_9_1", title: T4("9.1 Verkehrsregeln im Betrieb", "9.1 Traffic rules at work", "9.1 Zasady ruchu w zakładzie", "9.1 Правила руху на підприємстві"), durationMin: 9, steps: m9.l91 },
                { id: "ls_9_2", title: T4("9.2 Verkehrswege und ihr Zustand", "9.2 Traffic routes and their condition", "9.2 Drogi komunikacyjne i ich stan", "9.2 Шляхи та їхній стан"), durationMin: 8, steps: m9.l92 },
                { id: "ls_9_3", title: T4("9.3 Tore, Rampen, Aufzüge und Schmalgänge", "9.3 Gates, ramps, lifts and narrow aisles", "9.3 Bramy, rampy, windy i wąskie alejki", "9.3 Ворота, рампи, ліфти й вузькі проходи"), durationMin: 7, steps: m9.l93 },
                { id: "ls_9_check", title: T4("Modul-Check", "Module check", "Test modułu", "Перевірка модуля"), durationMin: 4, steps: m9.chk },
            ],
        }],
    };
    // 4 odpowiedzi w każdym pytaniu wyboru (prawidłowa na pozycji 0, kolejność losuje odtwarzacz)
    const noFix: string[] = [];
    for (const ch of draft.chapters as any[]) for (const l of ch.lessons) for (const st of l.steps) if (st.type === "choice") for (const it of st.data.items) {
        let key = it.q.de;
        if (key === "Du fährst mit Last eine Rampe hinunter. Wie?" && it.options[it.correct].de === "Rückwärts") key += "__m4";
        if (it.options.length >= 4) continue;
        const fix = CHOICES4[key];
        if (!fix) { noFix.push(key); continue; }
        it.options = [fix.correct ?? it.options[it.correct], ...fix.d]; it.correct = 0;
        if (fix.q) it.q = fix.q;
        if (fix.why) it.why = fix.why;
        if (fix.noExam) it.noExam = true;
    }
    // pytania-sytuacje w lekcjach: też 4 odpowiedzi, zawsze jako lista
    for (const ch of draft.chapters as any[]) for (const l of ch.lessons) for (const st of l.steps) if (st.type === "question") {
        if (st.data.options.length >= 4) { st.data.layout = "list"; continue; }
        const fix = QUESTIONS4[st.data.title.de];
        if (!fix) { noFix.push(`[question] ${st.data.title.de}`); continue; }
        st.data.options = [fix.correct ?? st.data.options[st.data.correct], ...fix.d]; st.data.correct = 0; st.data.layout = "list";
    }
    if (noFix.length) console.log("Pytania bez 4 odpowiedzi:", noFix);
    // test modułu 1 (Grundlagen) z jego pytań, a potem każdy test modułu blokuje kolejny moduł (próg 80 %)
    const grund = (draft.chapters as any[]).find(ch => ch.id === "ch_grundlagen");
    if (grund && !grund.lessons.some((l: any) => l.id === "ls_1_check")) {
        const items = grund.lessons.flatMap((l: any) => l.steps.filter((st: any) => st.type === "choice").flatMap((st: any) => st.data.items))
            .filter((it: any) => !it.noExam).slice(0, 8).map((it: any) => ({ ...it }));
        startLesson("s1ck");
        grund.lessons.push({ id: "ls_1_check", title: T4("Modul-Check", "Module check", "Test modułu", "Перевірка модуля"), durationMin: 5, steps: [
            step("choice", { title: T4("Modul-Check", "Module check", "Test modułu", "Перевірка модуля"), items,
                allRight: T4("Alles richtig.", "All correct.", "Wszystko dobrze.", "Усе правильно."), someWrong: T4("Schau dir die Erklärungen an.", "Look at the explanations.", "Przejrzyj wyjaśnienia.", "Переглянь пояснення.") }),
        ] });
    }
    // nowe lekcje (erweiterung.ts): pierwsze pytanie z ich „Kurz geprüft” trafia też do testu modułu
    for (const ch of draft.chapters as any[]) {
        const chk = ch.lessons.find((l: any) => l.id.endsWith("_check"))?.steps.find((x: any) => x.type === "choice");
        if (!chk) continue;
        for (const l of ch.lessons) if (/^ls_\d_[45]$/.test(l.id)) {
            const it = l.steps.find((x: any) => x.type === "choice")?.data.items[0];
            if (it && !chk.data.items.some((y: any) => y.q.de === it.q.de)) chk.data.items.push({ ...it });
        }
    }
    // test modułu: pula = wszystkie pytania wyboru z lekcji modułu; przy każdym podejściu losuje się `count` pytań,
    // żeby nie dało się zdać, ucząc się kolejności lub zestawu na pamięć
    for (const ch of draft.chapters as any[]) for (const l of ch.lessons) if (l.id.endsWith("_check")) {
        const st = l.steps.find((x: any) => x.type === "choice");
        if (!st) continue;
        const seen = new Set<string>(st.data.items.map((it: any) => it.q.de));
        const extra = ch.lessons.filter((o: any) => o !== l).flatMap((o: any) => o.steps.filter((x: any) => x.type === "choice").flatMap((x: any) => x.data.items))
            .filter((it: any) => !it.noExam && it.options?.length >= 4 && !seen.has(it.q.de) && seen.add(it.q.de)).map((it: any) => ({ ...it }));
        // pytania klienta (FFZ-001…092) przypisane do tego modułu, bez tych, które czekają na brakujące zdjęcie
        const klient = KLIENT_FRAGEN.filter(f => f.ch === ch.id && !f.wait).map(f => ({
            q: f.q, options: f.o ?? [], correct: f.num ?? (f.c!.length === 1 ? f.c![0] : f.c), why: T4("", "", "", ""), src: f.id,
            ...(f.img ? { img: f.img } : {}), ...(f.unit ? { unit: f.unit } : {}),
        }));
        const count = st.data.items.length;
        Object.assign(st.data, { gate: true, passPercent: 80, count, items: [...st.data.items, ...extra, ...klient] });
        console.log(`Test ${l.id}: pula ${st.data.items.length} (w tym klient ${klient.length}), losowanie ${count}`);
    }
    const czeka = KLIENT_FRAGEN.filter(f => f.wait);
    if (czeka.length) console.log("Pytania klienta czekające na obraz:", czeka.map(f => `${f.id} (${f.wait})`).join("; "));
    // egzamin końcowy: pula = pytania wyboru z testów modułów (i z rozdziału 1), bez duplikatów i pytań oznaczonych noExam
    const seenQ = new Set<string>();
    const pool = (draft.chapters as any[]).flatMap(ch => ch.lessons.filter((l: any) => l.id.endsWith("_check") || /^ls_\d_[45]$/.test(l.id) || ch.id === "ch_grundlagen")
        .flatMap((l: any) => l.steps.filter((st: any) => st.type === "choice").flatMap((st: any) => st.data.items.map((it: any) => ({ ...it, topic: ch.title })))))
        // klucz duplikatu = treść + zdjęcie: pytania klienta „Um welchen Flurförderzeugtyp…” różnią się tylko zdjęciem
        .filter((it: any) => { const key = `${it.q.de}|${it.img ?? ""}`; return !it.noExam && !seenQ.has(key) && !!seenQ.add(key); });
    const chTitle = (id: string) => (draft.chapters as any[]).find(ch => ch.id === id)?.title;
    for (const x of EXAM_EXTRA) pool.push({ q: x.q, options: x.o, correct: 0, why: x.why, topic: chTitle(x.ch) });
    startLesson("sex");
    (draft.chapters as any[]).push({
        id: "ch_exam", title: T4("Abschlussprüfung", "Final exam", "Egzamin końcowy", "Підсумковий іспит"),
        description: T4("Fragen aus allen Modulen, 45 Minuten, bestanden ab 80 %.", "Questions from all modules, 45 minutes, pass mark 80 %.", "Pytania ze wszystkich modułów, 45 minut, zaliczenie od 80 %.", "Питання з усіх модулів, 45 хвилин, складено від 80 %."),
        lessons: [{ id: "ls_exam", title: T4("Abschlussprüfung", "Final exam", "Egzamin końcowy", "Підсумковий іспит"), durationMin: 45, steps: lessonExam(step, pool) }],
    });
    console.log(`Egzamin: ${pool.length} pytań`);
    await mongoose.connect(process.env.MONGO_URI!);
    const existing = await LearningCourse.findOne({ slug: SLUG });
    // Od 2026-11 kurs jest edytowany w panelu admina (Kurse). Import nadpisałby te zmiany, więc bez --force odmawia.
    if (existing && !process.argv.includes("--force")) {
        console.log(`Kurs ${SLUG} istnieje i jest edytowany w panelu admina. Import przerwany, nic nie zmieniono.`);
        console.log("Aby świadomie nadpisać szkic i publikację treścią ze skryptów, uruchom z --force (najpierw kopia bazy).");
        await mongoose.disconnect();
        return;
    }
    const doc = existing ?? new LearningCourse({ slug: SLUG });
    doc.draft = draft as any;
    doc.draftChangedAt = new Date();
    doc.revision = (doc.revision ?? 0) + 1;
    doc.markModified("draft");
    if (process.argv.includes("--publish")) {
        doc.published = { ...JSON.parse(JSON.stringify(draft)), version: (doc.published?.version ?? 0) + 1, publishedAt: new Date() };
        doc.markModified("published");
    }
    await doc.save();
    console.log(`${existing ? "Zaktualizowano" : "Utworzono"} ${SLUG} (${doc._id}), kroki Lernziele ${lz.length}, 1.1 ${l11.length}, 1.2 ${steps12.length}, 1.3 ${l13.length}, 1.4 ${l14.length}, 1.5 ${l15.length}, 1.6 ${l16.length}, moduł 2: ${Object.values(m2).map(a => a.length).join("/")}, moduł 3: ${Object.values(m3).map(a => a.length).join("/")}, moduł 4: ${Object.values(m4).map(a => a.length).join("/")}, moduł 5: ${Object.values(m5).map(a => a.length).join("/")}, moduł 6: ${Object.values(m6).map(a => a.length).join("/")}, moduł 7: ${Object.values(m7).map(a => a.length).join("/")}, moduł 8: ${Object.values(m8).map(a => a.length).join("/")}, moduł 9: ${Object.values(m9).map(a => a.length).join("/")}, Unfall: ${Object.values(mu).map(a => a.length).join("/")}${process.argv.includes("--publish") ? ", opublikowano" : ""}`);
    if (missing.size) console.log(`Brak tłumaczeń (${missing.size}):\n  ` + [...missing].slice(0, 30).join("\n  "));
    await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
