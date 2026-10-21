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
        ["Rechtliche Grundlagen", 10, 15, ["DGUV Vorschrift 68 und 1", "Betriebssicherheitsverordnung", "Arbeitsschutzgesetz", "Maschinenverordnung, CE-Zeichen", "StVO, StVZO, FZV, FeV"], true],
        ["Unfallgeschehen", 5, 5, ["Unfallstatistiken", "Ausgewählte Unfälle"]],
        ["Aufbau und Funktion", 5, 10, ["Aufbau des Gabelstaplers", "Andere Flurförderzeuge", "Lenkung im Vergleich zum Auto", "Anbaugeräte, Rückhaltesysteme"]],
        ["Antriebsarten", 5, 10, ["Elektro: Blei-Säure, Blei-Gel, Lithium-Ionen", "Diesel, Flüssiggas, Erdgas", "Laden, Tanken, Abgase"]],
        ["Standsicherheit", 10, 15, ["Hebelgesetz, Lastschwerpunktdiagramm", "Kippdreieck", "Kurvenfahrt und Bremsen", "Boden, Bereifung, Achsen"]],
        ["Betrieb allgemein", 15, 20, ["Betriebsanleitung und -anweisung", "Geschwindigkeit", "Abstellen und Sichern", "Gefährdung anderer Personen"]],
        ["Regelmäßige Prüfung", 5, 5, ["Tägliche Einsatzprüfung", "Prüfung durch befähigte Person", "Prüfplakette"]],
        ["Umgang mit Last", 10, 15, ["Lastaufnahme", "Regale und Stapel", "Be- und Entladen", "Hängende Lasten, Gefahrstoffe"]],
        ["Sondereinsätze", 10, 15, ["Arbeitsbühnen", "Öffentlicher Verkehr", "Anhänger und Waggons", "Tiefkühl- und Ex-Bereich"]],
        ["Verkehrsregeln", 5, 5, ["Innerbetriebliche Regeln", "Rampen, Tore, Regalgänge", "Gleisanlagen"]],
        ["Abschlussprüfung", 5, 5, ["Ca. 50 Fragen, Multiple Choice", "Bestanden ab 70 %"]],
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
        sim("exam", "Die Prüfung am Ende", { questions: 50, passPercent: 70 }),
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
            "<b>Darum Pflicht:</b> Fahren darf nur, wer mindestens 18, geeignet, ausgebildet und schriftlich beauftragt ist. Auf der Straße kommt der Führerschein dazu.",
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
    const T4 = (de: string, en: string, pl: string, uk: string) => ({ de, en, pl, uk });
    const draft = {
        title: L("Staplerschein Theorie"),
        description: { de: "Allgemeine Ausbildung nach DGUV Grundsatz 308-001, Stufe 1.", en: "General training under DGUV Principle 308-001, level 1.", pl: "Szkolenie ogólne według DGUV Grundsatz 308-001, stopień 1.", uk: "Загальне навчання за DGUV Grundsatz 308-001, ступінь 1." },
        chapters: [{
            id: "ch_grundlagen", title: deHtml(L("Grundlagen &amp; Vorschriften")),
            lessons: [
                { id: "ls_lz", title: L("Lernziele"), durationMin: 5, steps: lz },
                { id: "ls_1_1", title: L("1.1 Warum eine Ausbildung vorgeschrieben ist"), durationMin: 15, steps: l11 },
                { id: "ls_1_2", title: L("1.2 DGUV Vorschrift 68: Pflichten"), durationMin: 15, steps: steps12 },
                { id: "ls_1_3", title: T4("1.3 Rechtliche Grundlagen", "1.3 Legal basis", "1.3 Podstawy prawne", "1.3 Правові основи"), durationMin: 12, steps: l13 },
                { id: "ls_1_4", title: T4("1.4 Folgen von Fehlverhalten", "1.4 Consequences of misconduct", "1.4 Skutki złego zachowania", "1.4 Наслідки порушень"), durationMin: 12, steps: l14 },
                { id: "ls_1_5", title: T4("1.5 Aufbau des Staplerscheins", "1.5 The forklift licence", "1.5 Budowa Staplerscheinu", "1.5 Будова Staplerschein"), durationMin: 8, steps: l15 },
                { id: "ls_1_6", title: T4("1.6 Das Stufensystem", "1.6 The level system", "1.6 System stopni", "1.6 Система ступенів"), durationMin: 8, steps: l16 },
            ],
        }],
    };
    await mongoose.connect(process.env.MONGO_URI!);
    const existing = await LearningCourse.findOne({ slug: SLUG });
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
    console.log(`${existing ? "Zaktualizowano" : "Utworzono"} ${SLUG} (${doc._id}), kroki Lernziele ${lz.length}, 1.1 ${l11.length}, 1.2 ${steps12.length}, 1.3 ${l13.length}, 1.4 ${l14.length}, 1.5 ${l15.length}, 1.6 ${l16.length}${process.argv.includes("--publish") ? ", opublikowano" : ""}`);
    if (missing.size) console.log(`Brak tłumaczeń (${missing.size}):\n  ` + [...missing].slice(0, 30).join("\n  "));
    await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
