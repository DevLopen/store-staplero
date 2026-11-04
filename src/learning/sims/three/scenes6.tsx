/**
 * Moduł 6 (Betrieb allgemein): abstellen i zabezpieczanie wózka w hali oraz scena „kto jest w niebezpieczeństwie”.
 * Ludzie są stylizowanymi manekinami (kask, kamizelka ostrzegawcza), bez zewnętrznych modeli.
 */
import { useEffect, useMemo, useReducer, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { Forklift3D, Pallet } from "./Forklift3D";
import { Stage3D, Stage3DHandle, View } from "./Stage3D";

/* ───────── człowiek ───────── */
const P = {
    skin: new THREE.MeshStandardMaterial({ color: "#d9a983", roughness: 0.7 }),
    pants: new THREE.MeshStandardMaterial({ color: "#2f3a4a", roughness: 0.8 }),
    shirt: new THREE.MeshStandardMaterial({ color: "#5a6b80", roughness: 0.8 }),
    vest: new THREE.MeshStandardMaterial({ color: "#d6ef3a", roughness: 0.6, emissive: "#6b7a10", emissiveIntensity: 0.15 }),
    stripe: new THREE.MeshStandardMaterial({ color: "#d9dde2", roughness: 0.3, metalness: 0.6 }),
    helmet: new THREE.MeshStandardMaterial({ color: "#f5f5f2", roughness: 0.4 }),
    shoe: new THREE.MeshStandardMaterial({ color: "#1b1d20", roughness: 0.8 }),
    customer: new THREE.MeshStandardMaterial({ color: "#3d7fbf", roughness: 0.8 }),
    phone: new THREE.MeshStandardMaterial({ color: "#111", roughness: 0.3, emissive: "#3a6cff", emissiveIntensity: 0.4 }),
};
export type Pose = "stand" | "walk" | "wave" | "phone" | "ride";
/** Manekin ok. 1,78 m; początek układu między stopami, patrzy w +z. */
export function Person({ pose = "stand", vest = true, helmet = true, shirt }: { pose?: Pose; vest?: boolean; helmet?: boolean; shirt?: THREE.Material }) {
    const legA = pose === "walk" ? 0.35 : 0, armL = pose === "wave" ? -2.6 : pose === "walk" ? -0.35 : pose === "ride" ? -1.2 : 0.05;
    const armR = pose === "wave" ? -2.2 : pose === "phone" ? -1.9 : pose === "walk" ? 0.35 : pose === "ride" ? -1.2 : -0.05;
    const top = shirt ?? P.shirt;
    const Leg = ({ x, a }: { x: number; a: number }) => <group position={[x, 0.86, 0]} rotation={[a, 0, 0]}>
        <mesh position={[0, -0.42, 0]} castShadow material={P.pants}><capsuleGeometry args={[0.07, 0.7, 6, 12]} /></mesh>
        <mesh position={[0, -0.83, 0.05]} castShadow material={P.shoe}><boxGeometry args={[0.11, 0.07, 0.25]} /></mesh>
    </group>;
    const Arm = ({ x, a }: { x: number; a: number }) => <group position={[x, 1.42, 0]} rotation={[a, 0, x > 0 ? -0.08 : 0.08]}>
        <mesh position={[0, -0.3, 0]} castShadow material={top}><capsuleGeometry args={[0.055, 0.5, 6, 12]} /></mesh>
        <mesh position={[0, -0.62, 0]} castShadow material={P.skin}><sphereGeometry args={[0.055, 12, 10]} /></mesh>
    </group>;
    return <group>
        <Leg x={-0.1} a={legA} /><Leg x={0.1} a={-legA} />
        <mesh position={[0, 1.18, 0]} castShadow material={top}><capsuleGeometry args={[0.17, 0.42, 8, 16]} /></mesh>
        {vest && <>
            <mesh position={[0, 1.2, 0]} castShadow material={P.vest}><capsuleGeometry args={[0.18, 0.36, 8, 16]} /></mesh>
            {[1.06, 1.2].map(y => <mesh key={y} position={[0, y, 0]} material={P.stripe}><cylinderGeometry args={[0.185, 0.185, 0.035, 20, 1, true]} /></mesh>)}
        </>}
        <Arm x={-0.24} a={armL} /><Arm x={0.24} a={armR} />
        {pose === "phone" && <mesh position={[0.2, 1.5, 0.22]} rotation={[0.6, 0, 0]} material={P.phone}><boxGeometry args={[0.07, 0.13, 0.012]} /></mesh>}
        <mesh position={[0, 1.6, 0]} castShadow material={P.skin}><cylinderGeometry args={[0.05, 0.06, 0.1, 10]} /></mesh>
        <mesh position={[0, 1.72, 0]} castShadow material={P.skin}><sphereGeometry args={[0.12, 20, 16]} /></mesh>
        {helmet && <group position={[0, 1.76, 0]}>
            <mesh castShadow material={P.helmet}><sphereGeometry args={[0.135, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
            <mesh position={[0, 0, 0.07]} rotation={[-0.1, 0, 0]} material={P.helmet}><cylinderGeometry args={[0.15, 0.15, 0.015, 20, 1, false, -Math.PI / 2, Math.PI]} /></mesh>
        </group>}
    </group>;
}
export const CUSTOMER = P.customer;

/* ───────── wspólne elementy hali ───────── */
function stripe(x: number, z: number, w: number, d: number, color = "#f2b705", key?: string) {
    return <mesh key={key} position={[x, 0.004, z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[w, d]} /><meshStandardMaterial color={color} roughness={0.6} /></mesh>;
}
function Wall({ x, z, w, rot = 0, h = 4 }: { x: number; z: number; w: number; rot?: number; h?: number }) {
    return <mesh position={[x, h / 2, z]} rotation={[0, rot, 0]} receiveShadow><boxGeometry args={[w, h, 0.2]} /><meshStandardMaterial color="#d7d3cb" roughness={0.9} /></mesh>;
}
function ExitDoor({ position, rot = 0, label }: { position: [number, number, number]; rot?: number; label?: string }) {
    return <group position={position} rotation={[0, rot, 0]}>
        <mesh position={[0, 1.05, 0.11]}><boxGeometry args={[1.0, 2.1, 0.05]} /><meshStandardMaterial color="#7c8794" roughness={0.5} metalness={0.4} /></mesh>
        <mesh position={[0.36, 1.0, 0.15]}><boxGeometry args={[0.18, 0.04, 0.04]} /><meshStandardMaterial color="#c9ced4" metalness={0.8} roughness={0.3} /></mesh>
        <mesh position={[0, 2.4, 0.12]}><boxGeometry args={[0.6, 0.26, 0.03]} /><meshStandardMaterial color="#178a45" emissive="#0c5a2c" emissiveIntensity={0.6} /></mesh>
        {/* biały piktogram: drzwi i strzałka */}
        <mesh position={[-0.15, 2.4, 0.14]}><boxGeometry args={[0.1, 0.16, 0.005]} /><meshBasicMaterial color="#ffffff" /></mesh>
        <mesh position={[0.08, 2.4, 0.14]}><boxGeometry args={[0.22, 0.04, 0.005]} /><meshBasicMaterial color="#ffffff" /></mesh>
        {label && <Html position={[0, 2.75, 0.2]} center zIndexRange={[20, 0]}><span className="t3 g">{label}</span></Html>}
    </group>;
}
function Extinguisher({ position }: { position: [number, number, number] }) {
    return <group position={position}>
        <mesh position={[0, 0.35, 0]} castShadow><cylinderGeometry args={[0.09, 0.09, 0.55, 16]} /><meshStandardMaterial color="#c62828" roughness={0.4} /></mesh>
        <mesh position={[0, 0.68, 0]}><cylinderGeometry args={[0.03, 0.05, 0.1, 10]} /><meshStandardMaterial color="#222" /></mesh>
        <mesh position={[0, 1.6, -0.02]}><boxGeometry args={[0.3, 0.3, 0.02]} /><meshStandardMaterial color="#c62828" emissive="#7a1010" emissiveIntensity={0.4} /></mesh>
    </group>;
}

/* ───────── abstellen ───────── */
export type ParkSpot = { id: string; label: string; pos: [number, number]; yaw: number; slope?: boolean };
export type ParkState = { forks: boolean; tilt: boolean; brake: boolean; motor: boolean; key: boolean };
const PK_DEF: View = { pos: [0.6, 17.5, 9.5], target: [0.6, 0, 1.0] };
export function ParkScene({ spots, chosen, verdict, state, label, hint, resetLabel, exitLabel }: {
    spots: ParkSpot[]; chosen: string | null; verdict: Record<string, "ok" | "no">; state: ParkState; label: string; hint: string; resetLabel: string; exitLabel: string;
}) {
    const stage = useRef<Stage3DHandle>(null);
    const spot = spots.find(s => s.id === chosen);
    useEffect(() => {
        if (spot) stage.current?.setView({ pos: [spot.pos[0] - 4.6, 2.3, spot.pos[1] - 0.2], target: [spot.pos[0], 0.7, spot.pos[1] - 0.6] });
        else stage.current?.setView(PK_DEF);
    }, [chosen]); // eslint-disable-line react-hooks/exhaustive-deps
    return <Stage3D ref={stage} view={PK_DEF} hint={hint} resetLabel={resetLabel} label={label} className="s3d-park" maxDist={18} minDist={3} shadowSize={10}>
        <ParkWorld spots={spots} chosen={chosen} verdict={verdict} state={state} exitLabel={exitLabel} />
    </Stage3D>;
}
function ParkWorld({ spots, chosen, verdict, state, exitLabel }: { spots: ParkSpot[]; chosen: string | null; verdict: Record<string, "ok" | "no">; state: ParkState; exitLabel: string }) {
    const truck = useRef<THREE.Group>(null!);
    const home = useMemo(() => new THREE.Vector3(-4.6, 0, -2.2), []);
    const anim = useRef({ lift: 0.15, tilt: -3 });
    const lift = useRef<THREE.Group>(null!);
    const spot = spots.find(s => s.id === chosen);
    const [, force] = useForceLocal();
    useFrame((_, dtRaw) => {
        const dt = Math.min(dtRaw, 0.05);
        const g = truck.current;
        const tx = spot ? spot.pos[0] : home.x, tz = spot ? spot.pos[1] : home.z, yaw = spot ? spot.yaw : Math.PI / 2;
        g.position.x += (tx - g.position.x) * Math.min(1, dt * 2.4);
        g.position.z += (tz - g.position.z) * Math.min(1, dt * 2.4);
        let dy = yaw - g.rotation.y; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
        g.rotation.y += dy * Math.min(1, dt * 2.4);
        // pochylenie całego wózka na rampie
        const slopeT = spot?.slope ? -0.1 : 0;
        lift.current.rotation.x += (slopeT - lift.current.rotation.x) * Math.min(1, dt * 2.4);
        const A = anim.current, wantLift = state.forks ? 0 : 0.15, wantTilt = state.tilt ? 2.5 : -3;
        const nl = A.lift + (wantLift - A.lift) * Math.min(1, dt * 3), nt = A.tilt + (wantTilt - A.tilt) * Math.min(1, dt * 3);
        if (Math.abs(nl - A.lift) > 0.0005 || Math.abs(nt - A.tilt) > 0.01) { A.lift = nl; A.tilt = nt; force(); }
    });
    return <>
        {/* ściany hali */}
        <Wall x={0} z={-4.6} w={14} />
        <Wall x={-7} z={0} w={9.4} rot={Math.PI / 2} />
        {/* droga dla wózków */}
        {stripe(0.6, 0.6, 12, 0.12, "#f2b705", "a")}{stripe(0.6, 3.6, 12, 0.12, "#f2b705", "b")}
        {Array.from({ length: 10 }, (_, i) => stripe(-4.4 + i * 1.2, 2.1, 0.6, 0.08, "#ffffff", `m${i}`))}
        {/* wyznaczone miejsce postoju */}
        <group position={[3.6, 0, -2.6]}>
            {stripe(-0.9, 0, 0.1, 3.0, "#ffffff", "l")}{stripe(0.9, 0, 0.1, 3.0, "#ffffff", "r")}{stripe(0, -1.45, 1.9, 0.1, "#ffffff", "t")}
            <mesh position={[0, 0.005, 0.6]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.32, 0.38, 32]} /><meshBasicMaterial color="#ffffff" /></mesh>
        </group>
        {/* wyjście ewakuacyjne i gaśnica */}
        <ExitDoor position={[-1.6, 0, -4.6]} label={exitLabel} />
        {stripe(-1.6, -3.9, 1.6, 1.2, "#d9f2df", "ex")}
        <Extinguisher position={[0.2, 0, -4.35]} />
        {/* rampa */}
        <group position={[4.6, 0, 6.3]}>
            <mesh position={[0, 0.32, 0]} rotation={[0.1, 0, 0]} receiveShadow castShadow><boxGeometry args={[3.2, 0.12, 6.5]} /><meshStandardMaterial color="#9aa1a8" roughness={0.8} metalness={0.2} /></mesh>
            {[-1.6, 1.6].map(x => <mesh key={x} position={[x, 0.75, 0]} rotation={[0.1, 0, 0]}><boxGeometry args={[0.06, 0.06, 6.5]} /><meshStandardMaterial color="#f2b705" /></mesh>)}
        </group>
        {/* paleta i regał dla skali */}
        <group position={[-5.6, 0, 3.2]}><Pallet /></group>
        {/* znaczniki miejsc */}
        {!(spot && verdict[spot.id] === "ok") && spots.map(s => <Html key={s.id} position={[s.pos[0], s.slope ? 0.9 : 0.25, s.pos[1]]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
            <span className={`pin ${verdict[s.id] ?? ""} ${chosen === s.id ? "on" : ""}`}>{s.label}</span>
        </Html>)}
        <group ref={truck} position={[home.x, 0, home.z]} rotation={[0, Math.PI / 2, 0]}>
            <group ref={lift}>
                <Forklift3D lift={anim.current.lift} tilt={anim.current.tilt} load="none" brake={state.brake} beacon={!state.motor} keyIn={!state.key} />
            </group>
        </group>
    </>;
}
function useForceLocal() { return useReducer((x: number) => x + 1, 0); }

/* ───────── kto jest w niebezpieczeństwie ───────── */
export type PeopleZone = { id: string; label: string };
export type ZoneMark = "ok" | "no" | "seen" | "cur" | "";
const PP_DEF: View = { pos: [-9.5, 9.0, 10.5], target: [0.4, 0.6, 0.3] };
const PP_VIEW: Record<string, View> = {
    under: { pos: [-1.2, 2.0, -0.6], target: [-4.2, 1.3, -2.4] },
    forks: { pos: [3.3, 2.6, -0.4], target: [1.4, 1.5, -3.4] },
    reverse: { pos: [-2.8, 2.6, 6.8], target: [-0.6, 0.8, 3.0] },
    ride: { pos: [6.8, 2.2, 5.0], target: [4.0, 1.0, 2.6] },
    walk: { pos: [-5.0, 2.8, 8.5], target: [-5.6, 0.8, 4.6] },
    guide: { pos: [2.0, 2.6, 1.6], target: [4.4, 1.0, -2.9] },
};
const ZPOS: Record<string, [number, number, number]> = {
    under: [-4.2, 2.3, -2.4], forks: [1.6, 2.6, -2.9], reverse: [-1.4, 2.1, 4.4], ride: [3.6, 2.2, 3.0], walk: [-5.6, 2.1, 4.6], guide: [3.2, 2.2, -2.6],
};
export function PeopleScene({ zones, marks, focus, onPick, label, hint, resetLabel }: {
    zones: PeopleZone[]; marks: Record<string, ZoneMark>; focus: string | null; onPick: (id: string) => void; label: string; hint: string; resetLabel: string;
}) {
    const stage = useRef<Stage3DHandle>(null);
    useEffect(() => { stage.current?.setView(focus ? PP_VIEW[focus] ?? PP_DEF : PP_DEF); }, [focus]);
    return <Stage3D ref={stage} view={PP_DEF} hint={hint} resetLabel={resetLabel} label={label} className="s3d-people" maxDist={20} minDist={2.5} shadowSize={12}>
        <PeopleWorld />
        {zones.map(z => <Html key={z.id} position={ZPOS[z.id]} center zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
            <div className={`m3 ${marks[z.id] ?? ""}`}>
                <button type="button" aria-label={z.label} onClick={() => onPick(z.id)} style={{ pointerEvents: "auto" }}><i /></button>
                {(marks[z.id] === "ok" || marks[z.id] === "no" || marks[z.id] === "cur") && <span className="m3-tag">{z.label}</span>}
            </div>
        </Html>)}
    </Stage3D>;
}
function Rack({ position, rot = 0 }: { position: [number, number, number]; rot?: number }) {
    const up = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1f4f8f", roughness: 0.5, metalness: 0.4 }), []);
    const beam = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f47a0b", roughness: 0.45, metalness: 0.3 }), []);
    const W = 2.8, D = 1.1;
    return <group position={position} rotation={[0, rot, 0]}>
        {[0, W, 2 * W].map(x => [-D / 2, D / 2].map(z => <mesh key={`${x}${z}`} position={[x, 2.2, z]} castShadow material={up}><boxGeometry args={[0.09, 4.4, 0.09]} /></mesh>))}
        {[0, 1].flatMap(b => [0.05, 1.6, 3.15].map(y => <group key={`${b}${y}`}>
            {[-D / 2, D / 2].map(z => <mesh key={z} position={[b * W + W / 2, y + 0.08, z]} castShadow material={beam}><boxGeometry args={[W - 0.09, 0.12, 0.06]} /></mesh>)}
            {y > 1 && <group position={[b * W + 0.8, y + 0.14, 0]} rotation={[0, Math.PI / 2, 0]}><Pallet /></group>}
        </group>))}
    </group>;
}
function Rail({ from, to }: { from: [number, number]; to: [number, number] }) {
    const dx = to[0] - from[0], dz = to[1] - from[1], len = Math.hypot(dx, dz), a = Math.atan2(dx, dz);
    const n = Math.max(2, Math.round(len / 1.5) + 1);
    return <group>
        {Array.from({ length: n }, (_, i) => <mesh key={i} position={[from[0] + dx * i / (n - 1), 0.55, from[1] + dz * i / (n - 1)]} castShadow><boxGeometry args={[0.06, 1.1, 0.06]} /><meshStandardMaterial color="#f2b705" roughness={0.5} /></mesh>)}
        {[1.05, 0.55].map(y => <mesh key={y} position={[(from[0] + to[0]) / 2, y, (from[1] + to[1]) / 2]} rotation={[0, a, 0]} castShadow><boxGeometry args={[0.05, 0.05, len]} /><meshStandardMaterial color="#f2b705" roughness={0.5} /></mesh>)}
    </group>;
}
function PeopleWorld() {
    const walker = useRef<THREE.Group>(null!), rev = useRef<THREE.Group>(null!);
    const spin = useRef(0);
    useFrame(({ clock }) => {
        const t = clock.elapsedTime;
        // pieszy na wydzielonym chodniku chodzi tam i z powrotem; wózek cofa się powoli
        walker.current.position.z = 4.4 + Math.sin(t * 0.5) * 1.4;
        walker.current.rotation.y = Math.cos(t * 0.5) > 0 ? 0 : Math.PI;
        const k = (t * 0.25) % 1;
        rev.current.position.z = 1.4 + k * 1.2; spin.current = -k * 1.2;
    });
    return <>
        {/* droga dla wózków i wydzielony chodnik */}
        {stripe(0, 0.4, 16, 0.12, "#f2b705", "a")}{stripe(0, 6.4, 16, 0.12, "#f2b705", "b")}
        <mesh position={[-5.6, 0.004, 3.0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.4, 9]} /><meshStandardMaterial color="#5f9e6e" roughness={0.8} /></mesh>
        {Array.from({ length: 7 }, (_, i) => <mesh key={i} position={[-5.6, 0.006, -0.6 + i * 1.2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.2, 0.35]} /><meshBasicMaterial color="#ffffff" /></mesh>)}
        <Rail from={[-4.8, -1.4]} to={[-4.8, 7.4]} />
        {/* regały */}
        <Rack position={[-6.6, 0, -3.4]} />
        <Rack position={[1.0, 0, -4.4]} />
        {/* 1: osoba pod podniesionym ładunkiem */}
        <group position={[-4.2, 0, -0.4]} rotation={[0, Math.PI, 0]}>
            <Forklift3D lift={2.4} tilt={0} load="pallet" mast="duplex" beacon />
            <group position={[0.15, 0, 2.0]} rotation={[0, Math.PI, 0]}><Person pose="phone" /></group>
        </group>
        {/* 2: osoba stoi na palecie na podniesionych widłach */}
        <group position={[1.6, 0, -0.8]} rotation={[0, Math.PI, 0]}>
            <Forklift3D lift={1.3} tilt={-2} load="none" mast="duplex">
                <group position={[0, 0.045, 0.64]}><Pallet withLoad={false} /><group position={[0, 0.144, 0.1]} rotation={[0, Math.PI, 0]}><Person pose="wave" /></group></group>
            </Forklift3D>
        </group>
        {/* 3: wózek cofa, za nim pieszy z telefonem */}
        <group ref={rev} position={[-0.6, 0, 1.4]} rotation={[0, Math.PI, 0]}>
            <Forklift3D lift={0.2} tilt={-4} load="pallet" spin={spin} />
        </group>
        <group position={[-1.2, 0, 4.4]} rotation={[0, -Math.PI / 2, 0]}><Person pose="phone" /></group>
        {/* 4: współpracownik jedzie na stopniu wózka */}
        <group position={[3.6, 0, 2.6]} rotation={[0, -Math.PI / 2, 0]}>
            <Forklift3D lift={0.15} tilt={-4} load="pallet" />
            <group position={[0.68, 0.22, -0.1]} rotation={[0, Math.PI / 2, 0]}><Person pose="ride" /></group>
        </group>
        {/* 5: pieszy na chodniku za barierką (dobrze) */}
        <group ref={walker} position={[-5.6, 0, 3.0]}><Person pose="walk" /></group>
        {/* 6: sygnalista prowadzi wózek z dużym ładunkiem (dobrze) */}
        <group position={[5.6, 0, -3.2]} rotation={[0, -Math.PI / 2, 0]}>
            <Forklift3D lift={0.3} tilt={-4} load="pallet" />
        </group>
        <group position={[3.2, 0, -2.6]} rotation={[0, Math.PI / 2, 0]}><Person pose="wave" /></group>
        <RoundedBox args={[0.8, 0.9, 0.6]} radius={0.04} position={[7.2, 0.45, 4.4]} castShadow><meshStandardMaterial color="#2f6e3b" roughness={0.6} /></RoundedBox>
    </>;
}
