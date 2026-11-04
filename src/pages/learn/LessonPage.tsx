import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import LessonPlayer from "@/learning/LessonPlayer";
import Denied from "@/learning/Denied";
import LearnShell, { useLearnLang } from "@/learning/LearnShell";
import { submitCheck, useCourseOutline, useLesson, useSaveProgress } from "@/learning/api";
import CourseNav from "@/learning/CourseNav";
import { useState } from "react";
import { tx } from "@/learning/types";
import { ui } from "@/learning/ui";

const testsLabel = { de: "Zurück zu den Tests", en: "Back to tests", pl: "Wróć do testów", uk: "Назад до тестів" } as const;

// Temat kursu v2 w odtwarzaczu kroków: /lernen/:courseId/:lessonId (?draft=1 podgląd dla admina)
export default function LessonPage() {
    const { courseId = "", lessonId = "" } = useParams();
    const [sp] = useSearchParams();
    const nav = useNavigate();
    const lang = useLearnLang();
    const draft = sp.get("draft") === "1";
    const { data, error, isLoading } = useLesson(courseId, lessonId, draft);
    const save = useSaveProgress(courseId, lessonId);
    const outline = useCourseOutline(courseId, draft);
    const [step, setStep] = useState(0);
    const q = draft ? "?draft=1" : "";
    // wejście z widoku „Tests”: start od razu od pytań, po zakończeniu powrót do listy testów
    const testMode = sp.get("test") === "1";

    if (isLoading) return <LearnShell courseId={courseId}><p className="small" style={{ padding: 24 }}>…</p></LearnShell>;
    if (error || !data) {
        const status = (error as any)?.status;
        if (status === 423) {
            const chapters = outline.data?.chapters ?? [];
            const gate = chapters.slice(0, chapters.findIndex(c => c.id === (error as any)?.body?.chapterId)).reverse().find(c => c.gateLessonId && !outline.data?.progress[c.gateLessonId!]?.passed)?.gateLessonId;
            return <LearnShell courseId={courseId}><div className="lp" style={{ padding: 24, display: "grid", gap: 12, maxWidth: 520 }}>
                <h2 className="q">{ui("locked", lang)}</h2>
                <p className="txt">{ui("lockedText", lang)}</p>
                {gate && <Link to={`/lernen/${courseId}/${gate}`} className="btn btn-p" style={{ textDecoration: "none" }}>{ui("toCheck", lang)}</Link>}
                <Link to={`/lernen/${courseId}`} className="btn btn-o" style={{ textDecoration: "none" }}>{ui("overview", lang)}</Link>
            </div></LearnShell>;
        }
        if ((error as any)?.body?.expired) return <LearnShell courseId={courseId} scroll><Denied error={error} lang={lang} /></LearnShell>;
        return <LearnShell courseId={courseId}><div style={{ padding: 24, display: "grid", gap: 12, maxWidth: 520 }}>
            <h2 className="q">{status === 403 ? "Kein Zugriff auf diesen Kurs" : "Thema nicht gefunden"}</h2>
            <Link to="/dashboard" className="btn btn-p" style={{ textDecoration: "none" }}>{ui("dashboard", lang)}</Link>
        </div></LearnShell>;
    }

    const finish = () => {
        if (!draft) save.mutate({ step: data.lesson.steps.length - 1, completed: true }, { onSuccess: () => outline.refetch() });
        nav(testMode ? `/lernen/${courseId}/tests` : data.nextLessonId ? `/lernen/${courseId}/${data.nextLessonId}${q}` : `/lernen/${courseId}${q}`);
    };
    const testStep = data.lesson.steps.findIndex(st => (st.type === "choice" && (st.data as any)?.gate) || (st.type === "sim" && (st.data as any)?.sim === "final"));

    return (
        <LearnShell courseId={courseId} courseTitle={tx(data.courseTitle, lang)}
            sidebar={outline.data ? close => <CourseNav outline={outline.data!} lessonId={lessonId} lang={lang} step={step} draft={draft} onPick={close} /> : undefined}>
            <LessonPlayer
                key={data.lesson.id}
                lesson={data.lesson}
                lang={lang}
                startStep={testMode && testStep >= 0 ? testStep : draft && sp.get("step") ? Math.min(Number(sp.get("step")) || 0, data.lesson.steps.length - 1) : data.progress.completed ? 0 : data.progress.step}
                onStep={i => { setStep(i); if (!draft && i > data.progress.step) save.mutate({ step: i }); }}
                onFinish={finish}
                onCheck={draft ? undefined : async answers => { const r = await submitCheck(courseId, lessonId, answers); outline.refetch(); return r; }}
                finishLabel={testMode ? testsLabel[lang] : data.nextLessonId ? ui("nextTopic", lang) : ui("finish", lang)}
            />
        </LearnShell>
    );
}
