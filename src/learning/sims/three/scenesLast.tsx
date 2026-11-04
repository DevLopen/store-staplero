/**
 * Moduł 7 (Umgang mit Last): podjęcie palety i jazda w pozycji transportowej, odkładanie na regał
 * z tabliczką obciążenia oraz rampa z naczepą (znajdź zagrożenia przy załadunku).
 */
import { useEffect, useMemo, useReducer, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { FL, Forklift3D, MAT, Pallet } from "./Forklift3D";
import { Stage3D, Stage3DHandle, View, useConcrete } from "./Stage3D";
import { Person } from "./scenes6";

const useTick = () => useReducer((n: number) => n + 1, 0)[1];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (k: number) => 1 - Math.pow(1 - clamp01(k), 3);
/** Środek palety względem początku wózka (maszt pionowo, paleta dosunięta do grzbietu wideł). */
const PAL_Z = FL.mastZ + 0.2 + 0.64;
/** Spód palety leży na posadzce, gdy widły są na tej wysokości (widły w otworach palety). */
const PAL_LIFT0 = 0.03;

function stripe(x: number, z: number, w: number, d: number, color: string, key?: string, y = 0.004) {
    return <mesh key={key} position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[w, d]} /><meshStandardMaterial color={color} roughness={0.6} /></mesh>;
}
function Tag({ position, text, cls = "" }: { position: [number, number, number]; text: string; cls?: string }) {
    return <Html position={position} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}><span className={`t3 ${cls}`}>{text}</span></Html>;
}

/* ───────── podjęcie palety i jazda ───────── */
export type PickOutcome = "ok" | "drop" | "low" | "high" | "slide";
const PALLET_Z = 3.0;          // środek palety na posadzce
const BUMP_Z = 8.3;            // próg w posadzce na trasie
const PK_DEF: View = { pos: [-6.3, 2.5, 1.0], target: [0, 0.6, 1.0] };
export function PickupScene({ insert, clear, tilt, run, outcome, tags, label, hint, resetLabel }: {
    insert: "half" | "full" | null; clear: number; tilt: number; run: number; outcome: PickOutcome | null;
    tags: { clear: string; bump: string }; label: string; hint: string; resetLabel: string;
}) {
    return <Stage3D view={PK_DEF} hint={hint} resetLabel={resetLabel} label={label} className="s3d-pick" maxDist={14} minDist={2.5} shadowSize={9}>
        {stripe(-1.05, 6, 0.1, 14, "#f2b705", "l")}{stripe(1.05, 6, 0.1, 14, "#f2b705", "r")}
        {/* próg w posadzce (np. szyna bramy) */}
        <group position={[0, 0, BUMP_Z]}>
            <mesh position={[0, 0.025, 0]} castShadow><boxGeometry args={[2.0, 0.05, 0.12]} /><meshStandardMaterial color="#2b3440" roughness={0.6} metalness={0.4} /></mesh>
            {[-0.8, -0.4, 0, 0.4, 0.8].map(x => <mesh key={x} position={[x, 0.051, 0]}><boxGeometry args={[0.2, 0.004, 0.121]} /><meshStandardMaterial color="#f2b705" roughness={0.5} /></mesh>)}
            <Tag position={[-1.35, 0.3, 0]} text={tags.bump} cls="k" />
        </group>
        <PickTruck insert={insert} clear={clear} tilt={tilt} run={run} outcome={outcome} clearTag={tags.clear} />
    </Stage3D>;
}
function PickTruck({ insert, clear, tilt, run, outcome, clearTag }: { insert: "half" | "full" | null; clear: number; tilt: number; run: number; outcome: PickOutcome | null; clearTag: string }) {
    const truck = useRef<THREE.Group>(null!), pitch = useRef<THREE.Group>(null!), loose = useRef<THREE.Group>(null!);
    const spin = useRef(0);
    const force = useTick();
    const off = insert === "half" ? 0.45 : 0;
    const zIn = PALLET_Z - PAL_Z - off, zStart = zIn - 1.8;
    const S = useRef({ z: zStart, lift: 0.1, tilt: 0, attached: false, runT: -1, run: 0, loadZ: 0, loadPitch: 0, dropK: 0, pitch: 0, tb: -1 });
    useEffect(() => { const s = S.current; if (!insert) { s.attached = false; s.z = zStart; } }, [insert]); // eslint-disable-line react-hooks/exhaustive-deps
    useFrame((state, dtRaw) => {
        const dt = Math.min(dtRaw, 0.05), s = S.current;
        let changed = false;
        // kamera jedzie za wózkiem (zachowuje obrót ustawiony palcem)
        const ctl = state.controls as unknown as { target: THREE.Vector3; update: () => void } | null;
        if (ctl) {
            const want = s.z + (s.runT < 0 && !s.attached ? 1.6 : 1.2), d = (want - ctl.target.z) * Math.min(1, dt * 3);
            if (Math.abs(d) > 1e-4) { ctl.target.z += d; state.camera.position.z += d; ctl.update(); }
        }
        if (run !== s.run) { s.run = run; s.runT = run > 0 ? 0 : -1; s.loadZ = 0; s.loadPitch = 0; s.dropK = 0; s.pitch = 0; s.tb = -1; s.z = zIn; changed = true; }
        // podjazd pod paletę
        if (s.runT < 0) {
            const tz = insert ? zIn : zStart;
            const dz = tz - s.z;
            if (Math.abs(dz) > 0.002) { const st = Math.sign(dz) * Math.min(Math.abs(dz), dt * 1.2); s.z += st; spin.current += st; changed = true; }
            if (insert && Math.abs(tz - s.z) <= 0.002 && !s.attached) { s.attached = true; changed = true; }
            const wantLift = s.attached ? PAL_LIFT0 + clear / 1000 : 0.1, wantTilt = s.attached ? tilt : 0;
            const nl = s.lift + (wantLift - s.lift) * Math.min(1, dt * 4), nt = s.tilt + (wantTilt - s.tilt) * Math.min(1, dt * 4);
            if (Math.abs(nl - s.lift) > 0.0004 || Math.abs(nt - s.tilt) > 0.01) { s.lift = nl; s.tilt = nt; changed = true; }
        } else {
            // jazda: rozpędzenie, jazda, hamowanie (albo uderzenie w próg)
            s.runT += dt; changed = true;
            const t = s.runT, v = 1.9;
            const stopAt = outcome === "low" ? BUMP_Z - (PAL_Z + off + 0.6) - 0.02 : zIn + 6.0;
            const prevZ = s.z;
            if (t < 0.8) s.z = zIn + 0.5 * (v / 0.8) * t * t;
            else s.z = Math.min(stopAt, zIn + 0.5 * v * 0.8 + v * (t - 0.8));
            spin.current += s.z - prevZ;
            const stopped = s.z >= stopAt - 1e-4;
            if (stopped) {
                if (s.tb < 0) s.tb = t;
                const kb = t - s.tb;
                if (outcome === "drop") { s.dropK = clamp01(kb / 1.1); }
                if (outcome === "slide") { s.loadZ = 0.28 * ease(kb / 0.5); }
                if (outcome === "low") { s.loadZ = -0.0; s.loadPitch = -0.12 * Math.sin(Math.min(1, kb / 0.35) * Math.PI); s.pitch = 0.035 * Math.sin(Math.min(1, kb / 0.5) * Math.PI); }
                if (outcome === "high") { s.pitch = 0.07 * Math.sin(Math.min(1, kb / 1.1) * Math.PI); s.loadZ = 0.12 * ease(kb / 0.6); }
                if (outcome === "ok") { s.pitch = 0.012 * Math.sin(Math.min(1, kb / 0.5) * Math.PI); }
            }
        }
        if (changed) {
            truck.current.position.z = s.z;
            pitch.current.rotation.x = s.pitch;
            force();
        }
    });
    const s = S.current;
    const carried = s.attached && !(outcome === "drop" && s.dropK > 0);
    // luźna paleta: na posadzce przed podjęciem albo spadająca z końców wideł
    const looseVisible = !s.attached || (outcome === "drop" && s.dropK > 0);
    let lp: [number, number, number] = [0, 0, PALLET_Z], lr = 0;
    if (s.attached && outcome === "drop") {
        const k = s.dropK, baseZ = s.z + PAL_Z + off, baseY = s.lift - PAL_LIFT0;
        lr = 0.38 * ease(k);
        lp = [0, Math.max(0, baseY * (1 - k * k)) + 0.6 * Math.sin(lr) * 0.5, baseZ + 0.75 * ease(k)];
    }
    return <>
        <group ref={truck} position={[0, 0, s.z]}>
            <group position={[0, 0, FL.frontZ]}><group ref={pitch}><group position={[0, 0, -FL.frontZ]}>
                <Forklift3D lift={s.lift} tilt={s.tilt} load={carried ? "pallet" : "none"} loadY={-PAL_LIFT0} loadZ={off + s.loadZ} loadPitch={s.loadPitch} spin={spin} beacon={s.runT >= 0} />
            </group></group></group>
            {s.attached && s.runT < 0 && <Tag position={[-0.9, Math.max(0.35, s.lift + 0.2), PAL_Z + off]} text={clearTag} cls="a" />}
        </group>
        {looseVisible && <group ref={loose} position={lp} rotation={[lr, 0, 0]}><Pallet /></group>}
    </>;
}

/* ───────── regał z tabliczką obciążenia ───────── */
export type RackSlot = { id: string; level: number; side: -1 | 1; kg?: number; label: string };
const LEVEL_Y = [0, 1.2, 2.4, 3.6];
const RACK_Z = 4.2, BAY_W = 2.7, RACK_D = 1.1;
const RK_DEF: View = { pos: [-6.4, 3.6, -1.6], target: [0.2, 1.7, 3.2] };
export function RackScene({ slots, chosen, overload, plate, carryKg, label, hint, resetLabel }: {
    slots: RackSlot[]; chosen: string | null; overload: boolean; plate: [string, string]; carryKg: string; label: string; hint: string; resetLabel: string;
}) {
    return <Stage3D view={RK_DEF} hint={hint} resetLabel={resetLabel} label={label} className="s3d-rack" maxDist={14} minDist={3} shadowSize={9}>
        <RackWorld slots={slots} chosen={chosen} overload={overload} plate={plate} carryKg={carryKg} />
    </Stage3D>;
}
function slotPos(s: RackSlot): [number, number, number] { return [s.side * BAY_W / 4, LEVEL_Y[s.level] + (s.level ? 0.14 : 0), RACK_Z]; }
function RackWorld({ slots, chosen, overload, plate, carryKg }: { slots: RackSlot[]; chosen: string | null; overload: boolean; plate: [string, string]; carryKg: string }) {
    const up = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1f4f8f", roughness: 0.5, metalness: 0.4 }), []);
    const beam = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f47a0b", roughness: 0.45, metalness: 0.3 }), []);
    const red = useMemo(() => new THREE.MeshStandardMaterial({ color: "#dc2626", roughness: 0.45, metalness: 0.2, emissive: "#7f1010", emissiveIntensity: 0.4 }), []);
    const truck = useRef<THREE.Group>(null!);
    const force = useTick();
    const target = slots.find(s => s.id === chosen);
    // fazy: 0 dojazd, 1 podnoszenie, 2 wjazd, 3 opuszczenie, 4 wycofanie, 5 widły w dół
    const A = useRef({ t: 0, id: null as string | null, x: 0, z: 0.4, lift: 0.15, tilt: -3, placed: false, sag: 0 });
    useEffect(() => { A.current.t = 0; A.current.id = chosen; A.current.placed = false; A.current.sag = 0; }, [chosen]);
    useFrame((_, dtRaw) => {
        const dt = Math.min(dtRaw, 0.05), a = A.current;
        if (!target) { if (a.z !== 0.4 || a.x !== 0) { a.x += (0 - a.x) * Math.min(1, dt * 3); a.z += (0.4 - a.z) * Math.min(1, dt * 3); a.lift += (0.15 - a.lift) * Math.min(1, dt * 3); truck.current.position.set(a.x, 0, a.z); force(); } return; }
        a.t += dt;
        const [sx, sy] = slotPos(target);
        const frontZ = RACK_Z - RACK_D / 2 - 0.15 - PAL_Z - 0.6;      // przód palety tuż przed belką
        const inZ = RACK_Z - PAL_Z;                                     // paleta na środku głębokości regału
        const T = [1.6, 1.8, 1.2, 0.6, 1.2, 1.4];
        let t = a.t, ph = 0;
        while (ph < T.length && t > T[ph]) { t -= T[ph]; ph++; }
        const k = ph < T.length ? ease(t / T[ph]) : 1;
        const liftHi = sy + 0.12 + PAL_LIFT0 + 0.06, liftSet = sy + PAL_LIFT0;
        if (ph === 0) { a.x = sx * k; a.z = 0.4 + (frontZ - 0.4) * k; a.tilt = -3 + 3 * k; }
        else if (ph === 1) { a.x = sx; a.z = frontZ; a.lift = 0.15 + (liftHi - 0.15) * k; a.tilt = 0; }
        else if (ph === 2) { a.z = frontZ + (inZ - frontZ) * k; }
        else if (ph === 3) { a.lift = liftHi + (liftSet - 0.04 - liftHi) * k; if (k > 0.5) a.placed = true; }
        else if (ph === 4) { a.placed = true; a.z = inZ + (frontZ - 1.5 - inZ) * k; }
        else if (ph === 5) { a.z = frontZ - 1.5; a.lift = liftSet - 0.04 + (0.15 - (liftSet - 0.04)) * k; a.tilt = -3 * k; }
        if (overload && a.placed) a.sag = Math.min(1, a.sag + dt * 2.5);
        truck.current.position.set(a.x, 0, a.z);
        force();
    });
    const a = A.current;
    const loads = slots.filter(s => s.kg);
    return <>
        {stripe(0, 1.6, 6, 0.1, "#f2b705", "w")}
        {/* regał: trzy ramy po głębokości, dwa pola */}
        {[-BAY_W / 2, BAY_W / 2, BAY_W * 1.5].map(x => [-RACK_D / 2, RACK_D / 2].map(z => <mesh key={`${x}${z}`} position={[x, 2.3, RACK_Z + z]} castShadow material={up}><boxGeometry args={[0.09, 4.6, 0.09]} /></mesh>))}
        {[-BAY_W / 2, BAY_W / 2, BAY_W * 1.5].map(x => [0.5, 1.6, 2.7, 3.8].map(y => <mesh key={`${x}${y}`} position={[x, y, RACK_Z]} material={up}><boxGeometry args={[0.04, 0.04, RACK_D]} /></mesh>))}
        {[1, 2, 3].map(lv => [-RACK_D / 2, RACK_D / 2].map(z => {
            const hit = overload && target?.level === lv;
            return <Beam key={`${lv}${z}`} x={0} y={LEVEL_Y[lv] + 0.07} z={RACK_Z + z} w={BAY_W - 0.09} sag={hit ? a.sag * 0.12 : 0} mat={hit && a.sag > 0 ? red : beam} />;
        }))}
        {[1, 2, 3].map(lv => [-RACK_D / 2, RACK_D / 2].map(z => <mesh key={`b${lv}${z}`} position={[BAY_W, LEVEL_Y[lv] + 0.07, RACK_Z + z]} castShadow material={beam}><boxGeometry args={[BAY_W - 0.09, 0.12, 0.06]} /></mesh>))}
        {/* sąsiednie pole z towarem */}
        {[0, 1, 2, 3].map(lv => [-1, 1].map(sd => <group key={`n${lv}${sd}`} position={[BAY_W + sd * BAY_W / 4, LEVEL_Y[lv] + (lv ? 0.14 : 0), RACK_Z]}><Pallet /></group>))}
        {/* tabliczka obciążenia na słupie */}
        <group position={[-BAY_W / 2 - 0.06, 1.4, RACK_Z - RACK_D / 2]}>
            <mesh rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[0.32, 0.22]} /><meshStandardMaterial color="#f5f5f2" roughness={0.6} /></mesh>
            <Html position={[-0.05, 0, 0]} center zIndexRange={[25, 0]} style={{ pointerEvents: "none" }}><div className="rk-plate"><span>{plate[0]}</span><span>{plate[1]}</span></div></Html>
        </group>
        {loads.map(s => <group key={s.id} position={slotPos(s)}><Pallet /><Tag position={[0, 1.05, -0.62]} text={`${s.kg} kg`} cls="k" /></group>)}
        {target && a.placed && <group position={slotPos(target)}><Pallet /><Tag position={[0, 1.05, -0.62]} text={carryKg} cls={overload ? "no" : "ok"} /></group>}
        <group ref={truck} position={[0, 0, 0.4]}>
            <Forklift3D mast="triplex" lift={a.lift} tilt={a.tilt} load={target && !a.placed ? "pallet" : (!target ? "pallet" : "none")} loadY={-PAL_LIFT0}
                loadSlot={!a.placed ? <Tag position={[0, 1.05, 0]} text={carryKg} cls="a" /> : undefined} />
        </group>
    </>;
}
function Beam({ x, y, z, w, sag, mat }: { x: number; y: number; z: number; w: number; sag: number; mat: THREE.Material }) {
    if (sag < 0.002) return <mesh position={[x, y, z]} castShadow material={mat}><boxGeometry args={[w, 0.12, 0.06]} /></mesh>;
    const n = 8;
    return <group position={[x, y, z]}>{Array.from({ length: n }, (_, i) => {
        const u0 = i / n, u1 = (i + 1) / n, f = (u: number) => -sag * Math.sin(u * Math.PI);
        const x0 = -w / 2 + u0 * w, x1 = -w / 2 + u1 * w, y0 = f(u0), y1 = f(u1);
        return <mesh key={i} position={[(x0 + x1) / 2, (y0 + y1) / 2, 0]} rotation={[0, 0, Math.atan2(y1 - y0, x1 - x0)]} castShadow material={mat}><boxGeometry args={[Math.hypot(x1 - x0, y1 - y0) + 0.005, 0.12, 0.06]} /></mesh>;
    })}</group>;
}

/* ───────── rampa z naczepą: zagrożenia przy załadunku ───────── */
export type LoadZone = { id: string; label: string };
export type LoadMark = "" | "cur" | "ok" | "no" | "seen";
const LD_DEF: View = { pos: [-10.5, 7.4, 0.4], target: [0, -0.2, 1.3] };
const LPOS: Record<string, [number, number, number]> = {
    chock: [-1.6, -0.45, 6.1], driver: [0.35, 2.1, 3.0], pallet: [-0.5, 1.5, 4.8], bridge: [0.9, 0.35, 0.05], truck: [-0.2, 2.25, -1.9],
};
const LVIEW: Record<string, View> = {
    chock: { pos: [-5.2, 0.5, 8.6], target: [-1.3, -0.8, 6.6] },
    driver: { pos: [-4.2, 2.6, 0.6], target: [0, 1.0, 3.2] },
    pallet: { pos: [-4.4, 2.6, 2.6], target: [-0.4, 0.7, 4.8] },
    bridge: { pos: [-3.6, 2.2, -1.6], target: [0, 0, 0.2] },
    truck: { pos: [-4.2, 2.4, -4.9], target: [0, 0.8, -1.7] },
};
export function LoadingScene({ zones, marks, focus, onPick, label, hint, resetLabel }: {
    zones: LoadZone[]; marks: Record<string, LoadMark>; focus: string | null; onPick: (id: string) => void; label: string; hint: string; resetLabel: string;
}) {
    const stage = useRef<Stage3DHandle>(null);
    useEffect(() => { stage.current?.setView(focus ? LVIEW[focus] ?? LD_DEF : LD_DEF); }, [focus]);
    return <Stage3D ref={stage} view={LD_DEF} hint={hint} resetLabel={resetLabel} label={label} className="s3d-people" maxDist={18} minDist={2.5} shadowSize={11} floor={false}>
        <DockWorld />
        {zones.map(z => <Html key={z.id} position={LPOS[z.id]} center zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
            <div className={`m3 ${marks[z.id] ?? ""}`}>
                <button type="button" aria-label={z.label} onClick={() => onPick(z.id)} style={{ pointerEvents: "auto" }}><i /></button>
                {(marks[z.id] === "ok" || marks[z.id] === "no" || marks[z.id] === "cur") && <span className="m3-tag">{z.label}</span>}
            </div>
        </Html>)}
    </Stage3D>;
}
const DOCK_H = 1.2;
function DockWorld() {
    const conc = useConcrete(6);
    const asph = useMemo(() => new THREE.MeshStandardMaterial({ color: "#4b4f55", roughness: 0.95 }), []);
    const tarp = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2f5f9e", roughness: 0.8, side: THREE.DoubleSide }), []);
    const frame = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c9ced4", roughness: 0.4, metalness: 0.6 }), []);
    const plate = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8a929c", roughness: 0.5, metalness: 0.7 }), []);
    const yellow = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f2b705", roughness: 0.5 }), []);
    const black = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1b1d20", roughness: 0.6 }), []);
    const TR = { x0: -1.25, x1: 1.25, z0: 0.35, z1: 7.75, floor: 0.0 };   // podłoga naczepy na poziomie rampy (y = 0)
    return <group position={[0, 0, 0]}>
        {/* hala na poziomie rampy (y=0) i plac niżej (y=-1,2) */}
        <mesh position={[0, 0, -6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[24, 12]} /><meshStandardMaterial map={conc} roughness={0.85} /></mesh>
        <mesh position={[0, -DOCK_H / 2, 0]} receiveShadow castShadow><boxGeometry args={[24, DOCK_H, 0.02]} /><meshStandardMaterial color="#9aa0a6" roughness={0.9} /></mesh>
        <mesh position={[0, -DOCK_H, 7]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={asph}><planeGeometry args={[24, 14]} /></mesh>
        {/* odbojniki rampy */}
        {[-1.5, 1.5].map(x => <mesh key={x} position={[x, -0.35, 0.1]} castShadow material={black}><boxGeometry args={[0.25, 0.45, 0.18]} /></mesh>)}
        {/* pomost przeładunkowy z żółto-czarną krawędzią */}
        <mesh position={[0, 0.012, 0.15]} castShadow receiveShadow material={plate}><boxGeometry args={[2.0, 0.025, 0.7]} /></mesh>
        {Array.from({ length: 10 }, (_, i) => <mesh key={i} position={[-0.9 + i * 0.2, 0.026, -0.18]} material={i % 2 ? black : yellow}><boxGeometry args={[0.2, 0.004, 0.08]} /></mesh>)}
        {stripe(-1.1, -2.5, 0.08, 5, "#f2b705", "a", 0.005)}{stripe(1.1, -2.5, 0.08, 5, "#f2b705", "b", 0.005)}
        {/* naczepa plandekowa: zwinięta plandeka z lewej, prawa ściana i dach */}
        <group>
            <mesh position={[0, -0.08, (TR.z0 + TR.z1) / 2]} castShadow receiveShadow material={frame}><boxGeometry args={[2.5, 0.16, TR.z1 - TR.z0]} /></mesh>
            <mesh position={[0, -0.35, (TR.z0 + TR.z1) / 2]} castShadow material={black}><boxGeometry args={[1.0, 0.3, TR.z1 - TR.z0]} /></mesh>
            <mesh position={[TR.x1, 1.35, (TR.z0 + TR.z1) / 2]} castShadow material={tarp}><boxGeometry args={[0.03, 2.7, TR.z1 - TR.z0]} /></mesh>
            <mesh position={[0.4, 2.72, (TR.z0 + TR.z1) / 2]} material={tarp}><boxGeometry args={[1.7, 0.04, TR.z1 - TR.z0]} /></mesh>
            {[TR.z0, TR.z1].map(z => [TR.x0, TR.x1].map(x => <mesh key={`${x}${z}`} position={[x, 1.35, z]} castShadow material={frame}><boxGeometry args={[0.08, 2.7, 0.08]} /></mesh>))}
            <mesh position={[TR.x0, 2.7, (TR.z0 + TR.z1) / 2]} material={frame}><boxGeometry args={[0.08, 0.08, TR.z1 - TR.z0]} /></mesh>
            <mesh position={[TR.x0 + 0.05, 1.35, TR.z1 - 0.35]} castShadow material={tarp}><boxGeometry args={[0.12, 2.7, 0.6]} /></mesh>
            {/* koła naczepy (oś tandem z tyłu, od strony rampy) */}
            {[5.6, 6.6].flatMap(z => [-1.05, 1.05].map(x => <group key={`${x}${z}`} position={[x, -DOCK_H + 0.5, z]}>
                <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={MAT.tire}><cylinderGeometry args={[0.5, 0.5, 0.32, 28]} /></mesh>
                <mesh position={[Math.sign(x) * 0.17, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT.rim}><cylinderGeometry args={[0.28, 0.28, 0.02, 20]} /></mesh>
            </group>))}
            {/* klin leży z boku, zamiast pod kołem */}
            <group position={[-1.9, -DOCK_H, 8.1]} rotation={[0, 0.7, 0]}>
                <mesh position={[0, 0.1, 0]} rotation={[0, 0, 0]} castShadow material={yellow}><boxGeometry args={[0.3, 0.2, 0.36]} /></mesh>
            </group>
            {/* ładunek w naczepie */}
            {[1.9, 6.4].flatMap(z => [-0.6, 0.6].map(x => <group key={`${x}${z}`} position={[x, 0, z]}><Pallet /></group>))}
            {/* uszkodzona paleta: złamana deska, przechylone kartony */}
            <group position={[-0.6, 0, 4.8]}>
                <Pallet withLoad={false} />
                <mesh position={[0.18, 0.15, -0.3]} rotation={[0.3, 0, 0.15]} castShadow><boxGeometry args={[0.1, 0.022, 0.6]} /><meshStandardMaterial color="#a87c48" roughness={0.9} /></mesh>
                <group position={[0, 0.144, 0]} rotation={[0, 0, 0.16]}>
                    {[[-0.2, 0.17, -0.3], [0.2, 0.17, -0.3], [-0.2, 0.17, 0.3], [0.2, 0.17, 0.3], [-0.15, 0.5, 0], [0.22, 0.47, 0.2]].map(([x, y, z], i) => (
                        <mesh key={i} position={[x, y, z]} rotation={[0, i * 0.2, i > 3 ? 0.25 : 0]} castShadow><boxGeometry args={[0.39, 0.33, 0.59]} /><meshStandardMaterial color="#c8a47a" roughness={0.9} /></mesh>))}
                </group>
            </group>
            <group position={[0.6, 0, 4.8]}><Pallet /></group>
            {/* kierowca ciężarówki w naczepie, na drodze wózka */}
            <group position={[0.25, 0, 3.0]} rotation={[0, Math.PI, 0]}><Person pose="phone" vest={false} helmet={false} /></group>
        </group>
        {/* wózek czeka przed pomostem z ładunkiem nisko i masztem odchylonym */}
        <group position={[0, 0, -2.75]}><Forklift3D lift={0.2} tilt={-4} load="pallet" /></group>
        <RoundedBox args={[1.2, 1.0, 0.8]} radius={0.04} position={[-4.2, 0.5, -4.0]} castShadow><meshStandardMaterial color="#2f6e3b" roughness={0.6} /></RoundedBox>
    </group>;
}
