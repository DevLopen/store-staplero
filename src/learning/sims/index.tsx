import { SimData } from "../types";
import { Nav, usePlayer } from "../LessonPlayer";
import type { StepProps } from "../steps";
import { CheckSim, LicenceSim, ParkSim, RampSim } from "./sim12";
import { CapacitySim, LeverSim, PedsSim, PositionSim, RoadSim, TurnSim } from "./sim11";
import { ExamSim, PlanSim, ProfileSim } from "./simLz";

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
        default: return <Missing {...props} />;
    }
}
function Missing({ last, finishLabel }: StepProps<SimData>) {
    const { t } = usePlayer();
    return <><p className="txt">{t("unsupported")}</p><Nav label={last ? finishLabel : undefined} /></>;
}
