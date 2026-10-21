import { Step } from "../types";
import { Nav, usePlayer } from "../LessonPlayer";
import { IntroStep, LearnStep, SummaryStep, VideoStep } from "./content";
import { ChoiceStep, QuestionStep, SortStep } from "./quiz";
import { GapStep } from "./gap";
import { SelfStep } from "./self";
import { CasesStep } from "./cases";
import { SimStep } from "../sims";

export interface StepProps<D> { data: D; last: boolean; finishLabel?: string }

function Unsupported({ last, finishLabel }: { last: boolean; finishLabel?: string }) {
    const { t } = usePlayer();
    return <><p className="txt">{t("unsupported")}</p><Nav label={last ? finishLabel : undefined} /></>;
}

export function StepView({ step, last, finishLabel }: { step: Step; last: boolean; finishLabel?: string }) {
    const p = { last, finishLabel };
    switch (step.type) {
        case "intro": return <IntroStep data={step.data} {...p} />;
        case "learn": return <LearnStep data={step.data} {...p} />;
        case "video": return <VideoStep data={step.data} {...p} />;
        case "summary": return <SummaryStep data={step.data} {...p} />;
        case "question": return <QuestionStep data={step.data} {...p} />;
        case "choice": return <ChoiceStep data={step.data} {...p} />;
        case "sort": return <SortStep data={step.data} {...p} />;
        case "gap": return <GapStep data={step.data} {...p} />;
        case "self": return <SelfStep data={step.data} {...p} />;
        case "cases": return <CasesStep data={step.data} {...p} />;
        case "sim": return <SimStep data={step.data} {...p} />;
        default: return <Unsupported {...p} />;
    }
}
