/**
 * Moduł 8 (Sondereinsätze): wózek z podestem roboczym (znajdź błędy) i jazda z przyczepą (punkt sprzęgu, uciąg).
 */
import { useEffect, useMemo, useReducer, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { FL, Forklift3D, MAT, Pallet } from "./Forklift3D";
import { Stage3D, Stage3DHandle, View } from "./Stage3D";
import { Person } from "./scenes6";

const useTick = () => useReducer((n: number) => n + 1, 0)[1];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (k: number) => 1 - Math.pow(1 - clamp01(k), 3);

function Marks({ zones, pos, marks, onPick }: { zones: { id: string; label: string }[]; pos: Record<string, [number, number, number]>; marks: Record<string, string>; onPick: (id: string) => void }) {
    return <>{zones.map(z => <Html key={z.id} position={pos[z.id]} center zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
        <div className={`m3 ${marks[z.id] ?? ""}`}>
            <button type="button" aria-label={z.label} onClick={() => onPick(z.id)} style={{ pointerEvents: "auto" }}><i /></button>
            {(marks[z.id] === "ok" || marks[z.id] === "no" || marks[z.id] === "cur") && <span className="m3-tag">{z.label}</span>}
        </div>
    </Html>)}</>;
}
/** Łuk z rurki między dwoma punktami (łańcuch/lina zwisające). */
function Sag({ a, b, sag, r = 0.012, mat }: { a: [number, number, number]; b: [number, number, number]; sag: number; r?: number; mat: THREE.Material }) {
    const geo = useMemo(() => {
        const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), M = A.clone().lerp(B, 0.5); M.y -= sag;
        return new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(A, M, B), 24, r, 6, false);
    }, [a, b, sag, r]);
    useEffect(() => () => geo.dispose(), [geo]);
    return <mesh geometry={geo} material={mat} castShadow />;
}

/* ───────── podest roboczy ───────── */
const PF_DEF: View = { pos: [-7.2, 4.6, 6.4], target: [0, 2.2, 0.8] };
const PF_POS: Record<string, [number, number, number]> = {
    chain: [-0.62, 3.95, 1.75], boost: [0.15, 4.2, 1.6], driver: [-1.9, 1.95, 0.2], back: [0.3, 5.0, 1.1], cones: [1.9, 0.7, 2.6],
};
const PF_VIEW: Record<string, View> = {
    chain: { pos: [-3.6, 4.6, 3.6], target: [-0.3, 3.8, 1.6] },
    boost: { pos: [-2.8, 5.0, 4.0], target: [0, 4.0, 1.6] },
    driver: { pos: [-4.6, 2.4, 2.6], target: [-1.2, 1.2, 0.2] },
    back: { pos: [2.6, 5.2, -1.2], target: [0, 4.4, 1.1] },
    cones: { pos: [4.4, 2.6, 5.4], target: [1.2, 0.3, 2.2] },
};
export function PlatformScene({ zones, marks, focus, onPick, label, hint, resetLabel }: {
    zones: { id: string; label: string }[]; marks: Record<string, string>; focus: string | null; onPick: (id: string) => void; label: string; hint: string; resetLabel: string;
}) {
    const stage = useRef<Stage3DHandle>(null);
    useEffect(() => { stage.current?.setView(focus ? PF_VIEW[focus] ?? PF_DEF : PF_DEF); }, [focus]);
    return <Stage3D ref={stage} view={PF_DEF} hint={hint} resetLabel={resetLabel} label={label} className="s3d-people" maxDist={16} minDist={2.5} shadowSize={8}>
        <PlatformWorld />
        <Marks zones={zones} pos={PF_POS} marks={marks} onPick={onPick} />
    </Stage3D>;
}
function PlatformWorld() {
    const yellow = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f2b705", roughness: 0.5, metalness: 0.2 }), []);
    const grid = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3a3f46", roughness: 0.5, metalness: 0.6, transparent: true, opacity: 0.55 }), []);
    const chain = useMemo(() => new THREE.MeshStandardMaterial({ color: "#9aa3ad", roughness: 0.35, metalness: 0.8 }), []);
    const cone = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f05a1a", roughness: 0.6 }), []);
    const LIFT = 3.3;
    // podest w układzie karetki: podłoga 1,2 × 0,8, nad widłami
    const W = 0.8, D = 1.2, z0 = 0.06, H = 1.1;
    const post = (x: number, z: number, h = H) => <mesh key={`${x}${z}${h}`} position={[x, 0.08 + h / 2, z]} castShadow material={yellow}><boxGeometry args={[0.04, h, 0.04]} /></mesh>;
    return <>
        {/* sufit z oprawą, przy której ktoś pracuje */}
        <mesh position={[0, 6.0, 1.6]} castShadow><boxGeometry args={[6, 0.25, 0.3]} /><meshStandardMaterial color="#8a929c" roughness={0.5} metalness={0.5} /></mesh>
        <mesh position={[0, 5.75, 1.6]}><boxGeometry args={[1.2, 0.08, 0.25]} /><meshStandardMaterial color="#f5f5f2" emissive="#fff6d0" emissiveIntensity={0.6} /></mesh>
        <Forklift3D lift={LIFT} tilt={0} mast="triplex" load="none" beacon keyIn>
            <group position={[0, 0.045, z0]}>
                {/* podłoga */}
                <mesh position={[0, 0.04, D / 2]} castShadow receiveShadow material={yellow}><boxGeometry args={[W, 0.06, D]} /></mesh>
                {/* tylna osłona 1,8 m (siatka) */}
                <mesh position={[0, 0.08 + 0.9, 0.02]} material={grid}><boxGeometry args={[W, 1.8, 0.02]} /></mesh>
                {[-W / 2, W / 2].map(x => post(x, 0.02, 1.8))}
                <mesh position={[0, 1.88, 0.02]} material={yellow}><boxGeometry args={[W, 0.04, 0.04]} /></mesh>
                {/* prawa strona i przód: sztywna barierka z poręczą, listwą kolanową i krawężnikiem */}
                {[[W / 2, D * 0.5], [W / 2, D], [0, D], [-W / 2, D]].map(([x, z]) => post(x, z))}
                {[1.15, 0.6].map(y => <group key={y}>
                    <mesh position={[W / 2, y, D / 2 + 0.02]} material={yellow}><boxGeometry args={[0.04, 0.04, D - 0.04]} /></mesh>
                    <mesh position={[0, y, D]} material={yellow}><boxGeometry args={[W, 0.04, 0.04]} /></mesh>
                </group>)}
                <mesh position={[W / 2, 0.15, D / 2]} material={yellow}><boxGeometry args={[0.02, 0.12, D]} /></mesh>
                <mesh position={[0, 0.15, D]} material={yellow}><boxGeometry args={[W, 0.12, 0.02]} /></mesh>
                {/* lewa strona: tylko łańcuchy zamiast barierki */}
                {post(-W / 2, D * 0.5)}
                <Sag a={[-W / 2, 1.15, 0.04]} b={[-W / 2, 1.15, D * 0.5]} sag={0.12} mat={chain} />
                <Sag a={[-W / 2, 1.15, D * 0.5]} b={[-W / 2, 1.15, D]} sag={0.12} mat={chain} />
                {/* skrzynka podłożona, żeby sięgnąć wyżej */}
                <mesh position={[0.1, 0.25, D * 0.6]} castShadow><boxGeometry args={[0.4, 0.34, 0.3]} /><meshStandardMaterial color="#3d6fb5" roughness={0.6} /></mesh>
                <group position={[0.1, 0.42, D * 0.6]} rotation={[0, Math.PI, 0]}><Person pose="wave" /></group>
            </group>
        </Forklift3D>
        {/* kierowca stoi obok wózka zamiast na swoim miejscu */}
        <group position={[-1.7, 0, 0.0]} rotation={[0, Math.PI / 2, 0]}><Person pose="phone" /></group>
        {/* strefa pod podestem odgrodzona pachołkami (dobrze) */}
        {[[1.3, 2.4], [1.3, 3.2], [-1.3, 3.2], [0, 3.6]].map(([x, z], i) => <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 0.25, 0]} castShadow material={cone}><coneGeometry args={[0.14, 0.5, 18]} /></mesh>
            <mesh position={[0, 0.28, 0]}><cylinderGeometry args={[0.085, 0.1, 0.07, 18]} /><meshStandardMaterial color="#f5f5f2" /></mesh>
        </group>)}
        <Sag a={[1.3, 0.45, 2.4]} b={[1.3, 0.45, 3.2]} sag={0.05} r={0.008} mat={yellow} />
        <Sag a={[1.3, 0.45, 3.2]} b={[0, 0.45, 3.6]} sag={0.05} r={0.008} mat={yellow} />
        <Sag a={[0, 0.45, 3.6]} b={[-1.3, 0.45, 3.2]} sag={0.05} r={0.008} mat={yellow} />
    </>;
}

/* ───────── przyczepa ───────── */
export type TowHitch = "hitch" | "guard" | "axle";
export type TowOutcome = "ok" | "wrong" | "over";
const TW_DEF: View = { pos: [-6.0, 3.0, -1.0], target: [0, 0.6, -1.4] };
const HITCH_Z = -1.19;
const HITCH: Record<TowHitch, [number, number, number]> = { hitch: [0, 0.5, HITCH_Z], guard: [0.46, 1.9, -0.72], axle: [0, FL.rearR, FL.rearZ - 0.05] };
export function TowScene({ hitch, heavy, run, outcome, labels, plate, label, hint, resetLabel, onPick }: {
    hitch: TowHitch | null; heavy: boolean; run: number; outcome: TowOutcome | null;
    labels: Record<TowHitch, string>; plate: string; label: string; hint: string; resetLabel: string; onPick: (h: TowHitch) => void;
}) {
    return <Stage3D view={TW_DEF} hint={hint} resetLabel={resetLabel} label={label} className="s3d-pick" maxDist={14} minDist={2.5} shadowSize={9}>
        <TowWorld hitch={hitch} heavy={heavy} run={run} outcome={outcome} labels={labels} plate={plate} onPick={onPick} />
    </Stage3D>;
}
function TowWorld({ hitch, heavy, run, outcome, labels, plate, onPick }: { hitch: TowHitch | null; heavy: boolean; run: number; outcome: TowOutcome | null; labels: Record<TowHitch, string>; plate: string; onPick: (h: TowHitch) => void }) {
    const truck = useRef<THREE.Group>(null!), trailer = useRef<THREE.Group>(null!);
    const spin = useRef(0);
    const force = useTick();
    const red = useMemo(() => new THREE.MeshStandardMaterial({ color: "#dc2626", roughness: 0.5, emissive: "#7f1010", emissiveIntensity: 0.5 }), []);
    const rope = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d9b98a", roughness: 0.8 }), []);
    const steel = MAT.steel2;
    const TR_GAP = 1.5;                       // od sprzęgu do przodu przyczepy
    const S = useRef({ t: -1, run: 0, z: 0, trZ: 0, yaw: 0, snap: 0, tb: -1 });
    useFrame((state, dtRaw) => {
        const dt = Math.min(dtRaw, 0.05), s = S.current;
        if (run !== s.run) { s.run = run; s.t = run > 0 ? 0 : -1; s.z = 0; s.trZ = 0; s.yaw = 0; s.snap = 0; s.tb = -1; }
        if (s.t >= 0) {
            s.t += dt;
            const t = s.t, prev = s.z;
            if (outcome === "wrong") {
                // szarpnięcie: wózek rusza, połączenie nie wytrzymuje
                s.z = Math.min(0.6, 0.5 * 1.2 * t * t); s.snap = clamp01((t - 0.7) / 0.3); if (s.snap <= 0) s.trZ = Math.min(s.z, 0.25);
            } else {
                const v = 1.6, run = t < 0.9 ? 0.5 * (v / 0.9) * t * t : 0.5 * v * 0.9 + v * (t - 0.9);
                const stop = 5.0;
                if (run < stop) { s.z = run; s.trZ = run; }
                else {
                    if (s.tb < 0) s.tb = t;
                    const kb = t - s.tb;
                    s.z = stop + (outcome === "over" ? 1.1 * ease(kb / 1.0) : 0.05 * ease(kb / 0.4));
                    s.trZ = s.z + (outcome === "over" ? 0.15 * Math.sin(Math.min(1, kb / 1.0) * Math.PI) : 0);
                    s.yaw = outcome === "over" ? 0.32 * ease(kb / 1.2) : 0;
                }
            }
            spin.current += s.z - prev;
            const ctl = state.controls as unknown as { target: THREE.Vector3; update: () => void } | null;
            if (ctl) { const d = (s.z - 1.4 - ctl.target.z) * Math.min(1, dt * 3); ctl.target.z += d; state.camera.position.z += d; ctl.update(); }
            force();
        }
        truck.current.position.z = s.z;
        trailer.current.position.z = s.trZ;
        trailer.current.rotation.y = s.yaw;
    });
    const s = S.current;
    const broken = outcome === "wrong" && s.snap > 0;
    const hp = hitch ? HITCH[hitch] : null;
    const trFront = HITCH_Z - TR_GAP;
    return <>
        {[-1.05, 1.05].map(x => <mesh key={x} position={[x, 0.004, 1]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.1, 16]} /><meshStandardMaterial color="#f2b705" roughness={0.6} /></mesh>)}
        <group ref={truck}>
            <Forklift3D lift={0.15} tilt={-3} load="none" spin={spin} beacon={s.t >= 0} />
            {/* sprzęg w przeciwwadze z tabliczką uciągu */}
            <mesh position={[0, 0.5, HITCH_Z + 0.02]} castShadow material={steel}><boxGeometry args={[0.22, 0.12, 0.08]} /></mesh>
            <Html position={[0, 1.38, HITCH_Z + 0.1]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}><span className="t3 k">{plate}</span></Html>
            {!hitch && run === 0 && (Object.keys(HITCH) as TowHitch[]).map(h => <Html key={h} position={HITCH[h]} center zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
                <div className="m3"><button type="button" aria-label={labels[h]} onClick={() => onPick(h)} style={{ pointerEvents: "auto" }}><i /></button><span className="m3-tag">{labels[h]}</span></div>
            </Html>)}
        </group>
        <group ref={trailer}>
            <group position={[0, 0, trFront]}>
                {/* platforma przyczepy z kołami i dyszlem */}
                <mesh position={[0, 0.42, -1.1]} castShadow receiveShadow material={MAT.dark}><boxGeometry args={[1.3, 0.08, 2.2]} /></mesh>
                {[-0.3, -1.9].flatMap(z => [-0.55, 0.55].map(x => <group key={`${x}${z}`} position={[x, 0.19, z]}>
                    <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={MAT.tire}><cylinderGeometry args={[0.19, 0.19, 0.12, 20]} /></mesh>
                    <mesh position={[Math.sign(x) * 0.065, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT.rim}><cylinderGeometry args={[0.1, 0.1, 0.01, 14]} /></mesh>
                </group>))}
                {/* ładunek: dwie palety albo ciężkie kraty z wsadem stalowym */}
                {!heavy ? [-0.55, -1.65].map(z => <group key={z} position={[0, 0.46, z]} scale={[1, 0.8, 0.85]}><Pallet /></group>)
                    : [-0.45, -1.15, -1.85].map(z => <group key={z} position={[0, 0.46, z]}>
                        <mesh position={[0, 0.4, 0]} castShadow><boxGeometry args={[1.2, 0.8, 0.62]} /><meshStandardMaterial color="#5b6470" roughness={0.5} metalness={0.6} wireframe /></mesh>
                        <mesh position={[0, 0.3, 0]} castShadow><boxGeometry args={[1.1, 0.55, 0.55]} /><meshStandardMaterial color="#7a4a22" roughness={0.8} metalness={0.4} /></mesh>
                    </group>)}
            </group>
        </group>
        {/* połączenie: dyszel do sprzęgu albo lina do złego punktu */}
        {hp && !broken && (hitch === "hitch"
            ? <TowBar from={[0, 0.45, trFront]} to={[0, hp[1], HITCH_Z]} truckZ={s.z} trZ={s.trZ} yaw={s.yaw} mat={steel} />
            : <RopeLine from={[0, 0.5, trFront]} to={hp} truckZ={s.z} trZ={s.trZ} mat={outcome === "wrong" && s.t > 0.3 ? red : rope} />)}
        {broken && <Html position={[hp![0], hp![1] + 0.3, hp![2] + s.z]} center zIndexRange={[25, 0]} style={{ pointerEvents: "none" }}><span className="t3 no">!</span></Html>}
    </>;
}
function TowBar({ from, to, truckZ, trZ, yaw, mat }: { from: [number, number, number]; to: [number, number, number]; truckZ: number; trZ: number; yaw: number; mat: THREE.Material }) {
    const A = new THREE.Vector3(from[0] + Math.sin(yaw) * 0, from[1], from[2] + trZ), B = new THREE.Vector3(to[0], to[1], to[2] + truckZ);
    const mid = A.clone().lerp(B, 0.5), len = A.distanceTo(B);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    return <mesh position={mid} quaternion={q} castShadow material={mat}><cylinderGeometry args={[0.035, 0.035, len, 10]} /></mesh>;
}
function RopeLine({ from, to, truckZ, trZ, mat }: { from: [number, number, number]; to: [number, number, number]; truckZ: number; trZ: number; mat: THREE.Material }) {
    const a: [number, number, number] = [from[0], from[1], from[2] + trZ], b: [number, number, number] = [to[0], to[1], to[2] + truckZ];
    return <Sag a={a} b={b} sag={0.02} r={0.015} mat={mat} />;
}
