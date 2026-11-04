/**
 * Moduł 6 (Regelmäßige Prüfung): codzienna kontrola wózka przed jazdą.
 * Wózek z usterkami (widły, opona, łańcuch, wyciek), znaczniki punktów kontroli i widoki kamery na każdy punkt.
 */
import { useEffect, useReducer, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Forklift3D, type Defects } from "./Forklift3D";
import { Stage3D, Stage3DHandle, View } from "./Stage3D";

export type CheckMark = "" | "cur" | "ok" | "no";
export type CheckPt = { id: string; label: string; look: boolean };

const C_DEF: View = { pos: [-4.4, 2.5, 3.8], target: [0, 0.9, 0.4] };
const DRIVER: View = { pos: [-1.05, 2.3, -1.05], target: [0, 1.3, 0.2] };
/** Pozycje znaczników (świat, wózek w początku układu, przód = +z) i widoki kamery. */
export const CHECK_POS: Record<string, { pos?: [number, number, number]; view: View }> = {
    forks: { pos: [-0.25, 0.24, 1.75], view: { pos: [-1.0, 0.42, 3.4], target: [0.0, 0.1, 1.7] } },
    tyre: { pos: [-0.66, 0.4, 0.55], view: { pos: [-1.6, 0.42, 2.0], target: [-0.5, 0.28, 0.65] } },
    chain: { pos: [-0.12, 1.45, 1.2], view: { pos: [-0.8, 2.1, 2.7], target: [-0.06, 1.45, 1.0] } },
    leak: { pos: [0.15, 0.12, 0.95], view: { pos: [-1.6, 1.7, 2.6], target: [0.0, 0.2, 0.85] } },
    guard: { pos: [-0.5, 2.22, -0.2], view: { pos: [-2.7, 3.2, 1.3], target: [0, 2.0, -0.2] } },
    restraint: { pos: [-0.36, 1.34, -0.25], view: { pos: [-2.0, 1.85, 0.7], target: [-0.15, 1.2, -0.25] } },
    lsg: { pos: [0.3, 1.25, 1.1], view: { pos: [-1.8, 1.7, 3.0], target: [0, 1.0, 1.05] } },
    brake: { view: DRIVER }, steer: { view: DRIVER }, horn: { view: DRIVER },
    light: { view: { pos: [-1.3, 2.0, 3.8], target: [0, 1.5, 0.6] } },
    lift: { view: { pos: [-3.6, 2.2, 3.4], target: [0, 1.3, 0.8] } },
};

export function CheckScene({ points, marks, cur, defects, test, onPick, label, hint, resetLabel }: {
    points: CheckPt[]; marks: Record<string, CheckMark>; cur: string | null; defects: Defects;
    /** Aktywny test funkcji: lights, horn, lift. */
    test: string | null;
    onPick: (id: string) => void; label: string; hint: string; resetLabel: string;
}) {
    const stage = useRef<Stage3DHandle>(null);
    useEffect(() => { stage.current?.setView(cur ? CHECK_POS[cur]?.view ?? C_DEF : C_DEF); }, [cur]);
    return <Stage3D ref={stage} view={C_DEF} hint={hint} resetLabel={resetLabel} label={label} className="s3d-check" maxDist={9} minDist={1.2}>
        <CheckTruck defects={defects} test={test} />
        {!cur && points.filter(p => p.look && CHECK_POS[p.id]?.pos).map(p => <Html key={p.id} position={CHECK_POS[p.id].pos!} center zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
            <div className={`m3 ${marks[p.id] ?? ""}`}>
                <button type="button" aria-label={p.label} onClick={() => onPick(p.id)} style={{ pointerEvents: "auto" }}><i /></button>
                {(marks[p.id] === "cur") && <span className="m3-tag">{p.label}</span>}
            </div>
        </Html>)}
        {test === "horn" && <Html position={[0, 1.55, 0.15]} center zIndexRange={[25, 0]} style={{ pointerEvents: "none" }}><span className="horn3"><i /><i /><i /></span></Html>}
    </Stage3D>;
}

/** Wózek z animacją testu podnoszenia (w górę i z powrotem). */
function CheckTruck({ defects, test }: { defects: Defects; test: string | null }) {
    const g = useRef<THREE.Group>(null!);
    const t0 = useRef<number | null>(null);
    const lift = useRef(0.15);
    const tilt = useRef(-2);
    const truck = useRef<{ lift: number; tilt: number }>({ lift: 0.15, tilt: -2 });
    const [, setTick] = useTickState();
    useFrame(({ clock }) => {
        if (test === "lift") {
            if (t0.current === null) t0.current = clock.elapsedTime;
            const k = Math.min(1, (clock.elapsedTime - t0.current) / 4.5);
            const up = Math.sin(k * Math.PI);                       // w górę i w dół
            lift.current = 0.15 + up * 1.1;
            tilt.current = -2 + Math.sin(k * Math.PI * 2) * 3;      // pochylenie do przodu i do tyłu
        } else { t0.current = null; lift.current += (0.15 - lift.current) * 0.1; tilt.current += (-2 - tilt.current) * 0.1; }
        const T = truck.current;
        if (Math.abs(T.lift - lift.current) > 0.001 || Math.abs(T.tilt - tilt.current) > 0.02) { T.lift = lift.current; T.tilt = tilt.current; setTick(); }
    });
    return <group ref={g}>
        <Forklift3D lift={truck.current.lift} tilt={truck.current.tilt} load="none" defects={defects} lights={test === "light"} beacon={test === "light"} />
    </group>;
}

function useTickState() { return useReducer((n: number) => n + 1, 0); }
