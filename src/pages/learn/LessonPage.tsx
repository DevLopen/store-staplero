import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import LessonPlayer from "@/learning/LessonPlayer";
import LearnShell, { useLearnLang } from "@/learning/LearnShell";
import { useCourseOutline, useLesson, useSaveProgress } from "@/learning/api";
import CourseNav from "@/learning/CourseNav";
import { useState } from "react";
import { tx } from "@/learning/types";
import { ui } from "@/learning/ui";

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

    if (isLoading) return <LearnShell courseId={courseId}><p className="small" style={{ padding: 24 }}>…</p></LearnShell>;
    if (error || !data) {
        const status = (error as any)?.status;
        return <LearnShell courseId={courseId}><div style={{ padding: 24, display: "grid", gap: 12, maxWidth: 520 }}>
            <h2 className="q">{status === 403 ? "Kein Zugriff auf diesen Kurs" : "Thema nicht gefunden"}</h2>
            <Link to="/dashboard" className="btn btn-p" style={{ textDecoration: "none" }}>{ui("dashboard", lang)}</Link>
        </div></LearnShell>;
    }

    const finish = () => {
        if (!draft) save.mutate({ step: data.lesson.steps.length - 1, completed: true }, { onSuccess: () => outline.refetch() });
        nav(data.nextLessonId ? `/lernen/${courseId}/${data.nextLessonId}${q}` : `/lernen/${courseId}${q}`);
    };

    return (
        <LearnShell courseId={courseId} courseTitle={tx(data.courseTitle, lang)}
            sidebar={outline.data ? close => <CourseNav outline={outline.data!} lessonId={lessonId} lang={lang} step={step} draft={draft} onPick={close} /> : undefined}>
            <LessonPlayer
                key={data.lesson.id}
                lesson={data.lesson}
                lang={lang}
                startStep={data.progress.completed ? 0 : data.progress.step}
                onStep={i => { setStep(i); if (!draft && i > data.progress.step) save.mutate({ step: i }); }}
                onFinish={finish}
                finishLabel={data.nextLessonId ? ui("nextTopic", lang) : ui("finish", lang)}
            />
        </LearnShell>
    );
}
