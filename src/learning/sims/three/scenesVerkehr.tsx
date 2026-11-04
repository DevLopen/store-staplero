/**
 * Moduł 9 (Verkehrsregelung/Verkehrswege): skrzyżowanie w hali (kto ma pierwszeństwo) i trasa z usterkami nawierzchni.
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Forklift3D, Pallet } from "./Forklift3D";
import { Stage3D, Stage3DHandle, View } from "./Stage3D";
import { Person } from "./scenes6";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (k: number) => { const x = clamp01(k); return x * x * (3 - 2 * x); };
function stripe(x: number, z: number, w: number, d: number, color: string, key?: string, y = 0.004) {
    return <mesh key={key} position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[w, d]} /><meshStandardMaterial color={color} roughness={0.6} /></mesh>;
}

/* ───────── skrzyżowanie: pierwszeństwo ───────── */
export type RowRound = "right" | "left" | "zebra" | "rail";
export type RowChoice = "go" | "wait";
const FRONT = 2.3;                          // przód palety względem środka wózka
const Z_STOP = 3.3 - FRONT;                 // wózek staje przed linią
const Z_START = Z_STOP - 3.5;
const CONF: Record<RowRound, number> = { zebra: 4.1, rail: 5.6, right: 7.8, left: 7.8 };
type Actor = { x0: number; dir: 1 | -1; v: number; clearX: number; prio: boolean };
const ACT: Record<RowRound, Actor> = {
    right: { x0: -4.6, dir: 1, v: 1.7, clearX: 3.2, prio: true },
    left: { x0: 4.6, dir: -1, v: 1.7, clearX: -3.2, prio: false },
    zebra: { x0: 2.6, dir: -1, v: 1.0, clearX: -1.8, prio: true },
    rail: { x0: 6.5, dir: -1, v: 2.2, clearX: -4.2, prio: true },
};
const RW_DEF: View = { pos: [2.6, 5.4, -5.2], target: [0, 0, 5.4] };
export function RowScene({ round, choice, label, hint, resetLabel }: { round: RowRound; choice: RowChoice | null; label: string; hint: string; resetLabel: string }) {
    return <Stage3D view={RW_DEF} hint={hint} resetLabel={resetLabel} label={label} className="s3d-pick" maxDist={16} minDist={3} shadowSize={11}>
        <RowWorld round={round} choice={choice} />
    </Stage3D>;
}
function RowWorld({ round, choice }: { round: RowRound; choice: RowChoice | null }) {
    const me = useRef<THREE.Group>(null!), other = useRef<THREE.Group>(null!), warn = useRef<HTMLSpanElement>(null);
    const spinMe = useRef(0), spinOther = useRef(0);
    const T = useRef({ t0: 0, start: 0, c0: -1, key: "" });
    const a = ACT[round], conf = CONF[round];
    const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8a929c", roughness: 0.35, metalness: 0.85 }), []);
    useFrame(({ clock }) => {
        const now = clock.elapsedTime, s = T.current;
        const key = `${round}`;
        if (s.key !== key) { s.key = key; s.start = now; s.c0 = -1; }
        if (choice && s.c0 < 0) s.c0 = now;
        if (!choice) s.c0 = -1;
        const ta = now - s.start, tc = s.c0 < 0 ? -1 : now - s.c0;
        // podjazd do linii zatrzymania
        let z = Z_START + (Z_STOP - Z_START) * ease(ta / 1.8);
        let ox = a.x0 - a.dir * 1.2 * (1 - ease(ta / 1.8));      // drugi uczestnik też dojeżdża do swojego miejsca
        let near = false;
        const myGo = (t: number) => Z_STOP + 0.5 * 1.4 * Math.min(t, 1.3) ** 2 + (t > 1.3 ? 1.82 * (t - 1.3) : 0);
        const actorGo = (t: number) => a.x0 + a.dir * (t < 0.8 ? 0.5 * (a.v / 0.8) * t * t : 0.5 * a.v * 0.8 + a.v * (t - 0.8));
        if (tc >= 0) {
            const clearT = Math.abs(a.clearX - a.x0) / a.v + 0.6;
            if (choice === "wait") {
                ox = actorGo(tc);
                z = tc > clearT + 0.3 ? myGo(tc - clearT - 0.3) : Z_STOP;
            } else if (!a.prio) {
                // mam pierwszeństwo: jadę, drugi czeka i rusza po mnie
                z = myGo(tc);
                ox = tc > 3.4 ? actorGo(tc - 3.4) : a.x0;
            } else {
                // wymuszone pierwszeństwo: obaj ruszają, gwałtowne hamowanie tuż przed zderzeniem
                const zLim = conf - 0.75 - FRONT;
                z = Math.min(myGo(tc), zLim);
                const xLim = a.dir > 0 ? -1.75 - 1.2 : 1.75 + (round === "zebra" ? 0 : 1.2);
                ox = a.dir > 0 ? Math.min(actorGo(tc), xLim) : Math.max(actorGo(tc), xLim);
                near = z >= zLim - 1e-3;
            }
            spinMe.current = z;
            spinOther.current = ox * a.dir;
        }
        me.current.position.z = z;
        other.current.position.x = Math.max(-12, Math.min(12, ox));
        if (warn.current) warn.current.style.display = near ? "inline-block" : "none";
    });
    const isTruck = round === "right" || round === "left";
    return <>
        {/* nasz pas i pas poprzeczny */}
        {stripe(-1.6, 4, 0.1, 18, "#f2b705", "l")}{stripe(1.6, 4, 0.1, 18, "#f2b705", "r")}
        {stripe(0, 3.3, 3.1, 0.14, "#ffffff", "stop")}
        {[6.6, 9.0].map(z => stripe(-6.5, z, 9.8, 0.1, "#f2b705", `a${z}`))}
        {[6.6, 9.0].map(z => stripe(6.5, z, 9.8, 0.1, "#f2b705", `b${z}`))}
        {/* przejście dla pieszych */}
        {Array.from({ length: 6 }, (_, i) => stripe(-1.25 + i * 0.5, 4.1, 0.3, 1.0, "#ffffff", `zb${i}`))}
        {/* tory bocznicy */}
        {[5.32, 5.88].map(z => <mesh key={z} position={[0, 0.03, z]} castShadow material={steel}><boxGeometry args={[24, 0.06, 0.07]} /></mesh>)}
        {Array.from({ length: 16 }, (_, i) => <mesh key={i} position={[-11.25 + i * 1.5, 0.01, 5.6]}><boxGeometry args={[0.22, 0.02, 1.0]} /><meshStandardMaterial color="#6b5a46" roughness={0.9} /></mesh>)}
        {/* lustro sferyczne na rogu */}
        <group position={[-2.3, 0, 6.3]}>
            <mesh position={[0, 1.2, 0]} castShadow><cylinderGeometry args={[0.04, 0.04, 2.4, 10]} /><meshStandardMaterial color="#c9ced4" metalness={0.7} roughness={0.3} /></mesh>
            <mesh position={[0.12, 2.4, 0.1]} rotation={[0, -0.8, 0]}><sphereGeometry args={[0.32, 24, 16, 0, Math.PI]} /><meshStandardMaterial color="#dfe6ee" metalness={0.95} roughness={0.08} /></mesh>
            <mesh position={[0.1, 2.4, 0.08]} rotation={[0, -0.8, 0]}><torusGeometry args={[0.32, 0.03, 8, 30]} /><meshStandardMaterial color="#f05a1a" /></mesh>
        </group>
        <group ref={me} position={[0, 0, Z_START]}><Forklift3D lift={0.2} tilt={-4} load="pallet" spin={spinMe} /></group>
        <group ref={other} position={[a.x0, 0, conf]} rotation={[0, a.dir > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
            {isTruck && <Forklift3D lift={0.2} tilt={-4} load="pallet" spin={spinOther} />}
            {round === "zebra" && <Person pose="walk" />}
            {round === "rail" && <group position={[0, 0, -1.6]}>
                <mesh position={[0, 1.15, 0]} castShadow><boxGeometry args={[2.3, 1.7, 4.4]} /><meshStandardMaterial color="#9e2a1f" roughness={0.7} /></mesh>
                <mesh position={[0, 0.25, 0]} castShadow><boxGeometry args={[1.8, 0.3, 4.6]} /><meshStandardMaterial color="#2b3440" roughness={0.6} /></mesh>
                {[-1.4, 1.4].flatMap(z => [-0.28, 0.28].map(x => <mesh key={`${x}${z}`} position={[x * 1, 0.22, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.22, 0.22, 0.1, 18]} /><meshStandardMaterial color="#3a3f46" metalness={0.6} roughness={0.4} /></mesh>))}
                {[-0.6, 0.6].map(x => <mesh key={x} position={[x, 1.2, 2.21]}><boxGeometry args={[0.35, 0.35, 0.02]} /><meshStandardMaterial color="#fff6d0" emissive="#ffe08a" emissiveIntensity={1.2} /></mesh>)}
            </group>}
        </group>
        <Html position={[0, 2.6, CONF[round] - 1.2]} center zIndexRange={[25, 0]} style={{ pointerEvents: "none" }}><span ref={warn} className="t3 no" style={{ display: "none" }}>!</span></Html>
    </>;
}

/* ───────── trasa: stan dróg komunikacyjnych ───────── */
const RT_DEF: View = { pos: [-11.5, 11.0, -3.2], target: [0.6, 0, 3.0] };
const RT_POS: Record<string, [number, number, number]> = {
    hole: [0.5, 0.35, 0.4], oil: [-0.6, 0.3, 3.4], blocked: [0.9, 1.4, 6.0], shaft: [-0.7, 0.4, 8.4], mirror: [2.3, 2.7, 9.6], zebra: [0, 0.3, -2.6],
};
const RT_VIEW: Record<string, View> = {
    hole: { pos: [-3.0, 2.4, -1.6], target: [0.4, 0, 0.4] },
    oil: { pos: [-3.4, 2.4, 1.4], target: [-0.5, 0, 3.4] },
    blocked: { pos: [-3.8, 2.8, 3.8], target: [0.8, 0.6, 6.0] },
    shaft: { pos: [-3.4, 2.6, 6.4], target: [-0.6, 0, 8.4] },
    mirror: { pos: [-2.6, 3.0, 6.8], target: [2.2, 2.2, 9.6] },
    zebra: { pos: [-3.6, 3.0, -5.0], target: [0, 0, -2.6] },
};
export function RouteScene({ zones, marks, focus, onPick, label, hint, resetLabel }: {
    zones: { id: string; label: string }[]; marks: Record<string, string>; focus: string | null; onPick: (id: string) => void; label: string; hint: string; resetLabel: string;
}) {
    const stage = useRef<Stage3DHandle>(null);
    useEffect(() => { stage.current?.setView(focus ? RT_VIEW[focus] ?? RT_DEF : RT_DEF); }, [focus]);
    return <Stage3D ref={stage} view={RT_DEF} hint={hint} resetLabel={resetLabel} label={label} className="s3d-people" maxDist={18} minDist={2.5} shadowSize={11}>
        <RouteWorld />
        {zones.map(z => <Html key={z.id} position={RT_POS[z.id]} center zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
            <div className={`m3 ${marks[z.id] ?? ""}`}>
                <button type="button" aria-label={z.label} onClick={() => onPick(z.id)} style={{ pointerEvents: "auto" }}><i /></button>
                {(marks[z.id] === "ok" || marks[z.id] === "no" || marks[z.id] === "cur") && <span className="m3-tag">{z.label}</span>}
            </div>
        </Html>)}
    </Stage3D>;
}
function RouteWorld() {
    const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3a3631", roughness: 0.95 }), []);
    const oil = useMemo(() => new THREE.MeshStandardMaterial({ color: "#120d06", roughness: 0.05, metalness: 0.35, transparent: true, opacity: 0.92 }), []);
    const iron = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3a3f46", roughness: 0.5, metalness: 0.7 }), []);
    return <>
        {stripe(-1.7, 4, 0.1, 18, "#f2b705", "l")}{stripe(1.7, 4, 0.1, 18, "#f2b705", "r")}
        {/* przejście dla pieszych (dobrze) */}
        {Array.from({ length: 6 }, (_, i) => stripe(-1.35 + i * 0.54, -2.6, 0.32, 1.1, "#ffffff", `zb${i}`))}
        {/* dziura w posadzce */}
        <group position={[0.5, 0, 0.4]}>
            <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.42, 9]} /><meshStandardMaterial color="#5b544b" roughness={1} /></mesh>
            <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0.4]} material={dark}><circleGeometry args={[0.3, 7]} /></mesh>
            {[0, 1, 2, 3, 4].map(i => <mesh key={i} position={[Math.cos(i * 1.3) * 0.5, 0.02, Math.sin(i * 1.3) * 0.5]} rotation={[i, i * 2, 0]} castShadow material={dark}><boxGeometry args={[0.08, 0.04, 0.06]} /></mesh>)}
        </group>
        {/* plama oleju */}
        {([[-0.6, 3.4, 0.55], [-0.2, 3.7, 0.3], [-0.9, 3.0, 0.25]] as const).map(([x, z, r], i) => <mesh key={i} position={[x, 0.004 + i * 0.0005, z]} rotation={[-Math.PI / 2, 0, 0]} material={oil}><circleGeometry args={[r, 26]} /></mesh>)}
        {/* puste palety odstawione na drodze */}
        {[0, 1, 2, 3, 4].map(i => <group key={i} position={[0.9, i * 0.145, 6.0]} rotation={[0, 0.05 * i, 0]}><Pallet withLoad={false} /></group>)}
        {/* otwarta studzienka, pokrywa obok */}
        <group position={[-0.7, 0, 8.4]}>
            <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.36, 24]} /><meshBasicMaterial color="#0b0b0c" /></mesh>
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={iron}><ringGeometry args={[0.36, 0.44, 28]} /></mesh>
            <mesh position={[0.75, 0.02, 0.35]} rotation={[0, 0.4, 0]} castShadow material={iron}><cylinderGeometry args={[0.38, 0.38, 0.04, 24]} /></mesh>
        </group>
        {/* ślepy róg ze ścianą i lustrem (dobrze) */}
        <mesh position={[3.4, 1.6, 9.0]} castShadow receiveShadow><boxGeometry args={[3.0, 3.2, 0.25]} /><meshStandardMaterial color="#d7d3cb" roughness={0.9} /></mesh>
        <group position={[2.3, 0, 9.6]}>
            <mesh position={[0, 1.2, 0]} castShadow><cylinderGeometry args={[0.04, 0.04, 2.4, 10]} /><meshStandardMaterial color="#c9ced4" metalness={0.7} roughness={0.3} /></mesh>
            <mesh position={[0, 2.45, -0.1]} rotation={[0, Math.PI + 0.5, 0]}><sphereGeometry args={[0.32, 24, 16, 0, Math.PI]} /><meshStandardMaterial color="#dfe6ee" metalness={0.95} roughness={0.08} /></mesh>
            <mesh position={[0, 2.45, -0.1]} rotation={[0, Math.PI + 0.5, 0]}><torusGeometry args={[0.32, 0.03, 8, 30]} /><meshStandardMaterial color="#f05a1a" /></mesh>
        </group>
        <group position={[0, 0, -5.2]}><Forklift3D lift={0.2} tilt={-4} load="pallet" /></group>
    </>;
}
