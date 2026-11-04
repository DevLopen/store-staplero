import { SimData } from "../types";
import { Nav, usePlayer } from "../LessonPlayer";
import type { StepProps } from "../steps";
import { CheckSim, LicenceSim, ParkSim, RampSim } from "./sim12";
import { CapacitySim, LeverSim, PedsSim, PositionSim, RoadSim, TurnSim } from "./sim11";
import { ExamSim, PlanSim, ProfileSim } from "./simLz";
import { AnatomySim, AttachSim, IdentifySim, MastSim, TypesSim } from "./sim2";
import { BatterySim, SceneSim, SequenceSim } from "./sim3";
import { CogSim, CurveSim, DiagramSim, TriangleSim } from "./sim4";
import { AbstellenSim, PeopleSim } from "./sim6";
import { DailyCheckSim, PlaketteSim } from "./sim7";
import { PickupSim, RackSim } from "./sim8";
import { TowSim } from "./sim9";
import { RowSim } from "./sim10";
import { StatsSim } from "./simU";
import { FinalExamSim } from "./simExam";

/** Biblioteka gotowych symulacji. Nowa symulacja = nowy wpis tutaj i w kreatorze. */
export function SimStep(props: StepProps<SimData>) {
    switch (props.data.sim) {
        case "check": return <CheckSim {...props} />;
        case "ramp": return <RampSim {...props} />;
        case "park": return <ParkSim {...props} />;
        case "licence": return <LicenceSim {...props} />;
        case "turn": return <TurnSim {...props} />;
        case "turn-peds": return <PedsSim {...props} />;
        case "lever": return <LeverSim {...props} />;
        case "capacity": return <CapacitySim {...props} />;
        case "position": return <PositionSim {...props} />;
        case "road": return <RoadSim {...props} />;
        case "plan": return <PlanSim {...props} />;
        case "exam": return <ExamSim {...props} />;
        case "profile": return <ProfileSim {...props} />;
        case "anatomy": return <AnatomySim {...props} />;
        case "mast": return <MastSim {...props} />;
        case "types": return <TypesSim {...props} />;
        case "identify": return <IdentifySim {...props} />;
        case "attach": return <AttachSim {...props} />;
        case "battery": return <BatterySim {...props} />;
        case "sequence": return <SequenceSim {...props} />;
        case "scene": return <SceneSim {...props} />;
        case "diagram": return <DiagramSim {...props} />;
        case "cog": return <CogSim {...props} />;
        case "triangle": return <TriangleSim {...props} />;
        case "curve": return <CurveSim {...props} />;
        case "abstellen": return <AbstellenSim {...props} />;
        case "people": return <PeopleSim {...props} />;
        case "daily": return <DailyCheckSim {...props} />;
        case "plakette": return <PlaketteSim {...props} />;
        case "pickup": return <PickupSim {...props} />;
        case "rack": return <RackSim {...props} />;
        case "tow": return <TowSim {...props} />;
        case "row": return <RowSim {...props} />;
        case "stats": return <StatsSim {...props} />;
        case "final": return <FinalExamSim {...props} />;
        default: return <Missing {...props} />;
    }
}
function Missing({ last, finishLabel }: StepProps<SimData>) {
    const { t } = usePlayer();
    return <><p className="txt">{t("unsupported")}</p><Nav label={last ? finishLabel : undefined} /></>;
}
