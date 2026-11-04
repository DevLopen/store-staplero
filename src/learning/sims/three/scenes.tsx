/**
 * Sceny 3D do ćwiczeń z wózkiem: budowa (eksploracja i test), maszt pod stropem, osprzęt, środek ciężkości, okładka.
 * Ładowane leniwie (React.lazy), żeby three.js nie trafiał do głównej paczki.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Forklift3D, FL, LSG_H } from "./Forklift3D";
import { Stage3D, Stage3DHandle, View } from "./Stage3D";
import type { Attachment, MastKind, PartId } from "../forklift";
import { COG3, cog3 } from "../stability";

/* ───────── znaczniki części ───────── */
type MarkState = { seen?: Record<string, boolean>; cur?: string | null; right?: Record<string, boolean>; wrong?: string | null };
function Marker({ id, st, onPick, tag }: { id: PartId; st: MarkState; onPick?: (id: PartId) => void; tag?: string }) {
    const cls = st.right?.[id] ? "ok" : st.wrong === id ? "no" : st.cur === id ? "cur" : st.seen?.[id] ? "seen" : "";
    return <Html center zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
        <div className={`m3 ${cls}`}>
            <button type="button" aria-label={tag ?? id} onClick={e => { e.stopPropagation(); onPick?.(id); }} style={{ pointerEvents: "auto" }}><i /></button>
            {tag && <span className="m3-tag">{tag}</span>}
        </div>
    </Html>;
}

const A_DEF: View = { pos: [-3.9, 2.3, 3.7], target: [0, 1.05, 0.25] };
const A_VIEWS: Partial<Record<PartId, View>> = {
    cw: { pos: [-3.4, 2.0, -3.3], target: [0, 0.8, -0.5] },
    steer: { pos: [-3.2, 1.3, -3.0], target: [0, 0.4, -0.7] },
    restraint: { pos: [-2.9, 2.6, 0.6], target: [0, 1.2, -0.3] },
    guard: { pos: [-3.0, 3.9, 1.6], target: [0, 1.7, -0.1] },
    plate: { pos: [-2.6, 1.6, 1.6], target: [-0.3, 1.0, 0.4] },
    front: { pos: [-3.2, 1.0, 2.6], target: [0, 0.4, 0.5] },
    tilt: { pos: [-2.8, 1.6, 2.4], target: [0, 1.0, 0.7] },
    chain: { pos: [-2.2, 2.0, 3.6], target: [0, 1.4, 0.9] },
};

export function AnatomyScene({ ids, st, onPick, names, fly, lift, label, hint, resetLabel }: {
    ids: PartId[]; st: MarkState & { hi?: PartId | null }; onPick: (id: PartId) => void; names: Record<string, string>;
    fly: PartId | null; lift: number; label: string; hint: string; resetLabel: string;
}) {
    const stage = useRef<Stage3DHandle>(null);
    useEffect(() => { stage.current?.setView(fly ? A_VIEWS[fly] ?? A_DEF : A_DEF); }, [fly]);
    const show = new Set(ids);
    return <Stage3D ref={stage} view={A_DEF} hint={hint} resetLabel={resetLabel} label={label} className="s3d-anat" maxDist={9}>
        <Forklift3D lift={lift} tilt={-2} load="none" hi={st.hi ?? null} onPick={id => show.has(id) && onPick(id)}
            marker={id => show.has(id) ? <Marker id={id} st={st} onPick={onPick} tag={st.cur === id || st.right?.[id] ? names[id] : undefined} /> : null} />
    </Stage3D>;
}

/* ───────── maszt pod stropem ───────── */
const M_DEF: View = { pos: [-5.4, 2.0, 3.9], target: [0, 1.45, 0.5] };
export function MastScene({ kind, lift, tilt, ceiling, hit, tags, label, hint, resetLabel }: {
    kind: MastKind; lift: number; tilt: number; ceiling: number | null; hit: boolean; tags: { lift: string; top: string; ceil?: string; topMm: number }; label: string; hint: string; resetLabel: string;
}) {
    const ceilMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#9aa3ad", roughness: 0.7, metalness: 0.2, transparent: true, opacity: 0.55 }), []);
    useEffect(() => { ceilMat.color.set(hit ? "#ef4444" : "#9aa3ad"); ceilMat.opacity = hit ? 0.7 : 0.55; }, [hit, ceilMat]);
    const L = lift / 1000, topM = tags.topMm / 1000, cy = ceiling ? ceiling / 1000 : 0;
    return <Stage3D view={M_DEF} hint={hint} resetLabel={resetLabel} label={label} className="s3d-mast" maxDist={10}>
        <Forklift3D lift={L} tilt={tilt} mast={kind} load="pallet" />
        {ceiling && <group position={[0, cy, 0.5]}>
            <mesh position={[0, 0.09, 0]} material={ceilMat} castShadow><boxGeometry args={[3.2, 0.18, 3.6]} /></mesh>
            {[-1.6, 1.6].map(x => <mesh key={x} position={[x, -cy / 2, 1.6]} castShadow><boxGeometry args={[0.16, cy, 0.16]} /><meshStandardMaterial color="#5b6470" roughness={0.6} metalness={0.3} /></mesh>)}
            {tags.ceil && <Html position={[-1.6, 0.3, 1.6]} center zIndexRange={[20, 0]}><span className={`t3 ${hit ? "no" : "k"}`}>{tags.ceil}</span></Html>}
        </group>}
        {/* linie wymiarowe przy boku wózka */}
        <Dim x={-1.0} z={1.6} h={L} tag={tags.lift} accent />
        <Dim x={-1.35} z={0.86} h={topM} tag={tags.top} hit={hit} />
    </Stage3D>;
}
function Dim({ x, z, h, tag, accent, hit }: { x: number; z: number; h: number; tag: string; accent?: boolean; hit?: boolean }) {
    const col = hit ? "#ef4444" : accent ? "#f97706" : "#2b3440";
    const hh = Math.max(0.001, h);
    return <group position={[x, 0, z]}>
        <mesh position={[0, hh / 2, 0]}><boxGeometry args={[0.012, hh, 0.012]} /><meshBasicMaterial color={col} /></mesh>
        <mesh position={[0, 0.003, 0]}><boxGeometry args={[0.18, 0.006, 0.012]} /><meshBasicMaterial color={col} /></mesh>
        <mesh position={[0, hh, 0]}><boxGeometry args={[0.18, 0.012, 0.012]} /><meshBasicMaterial color={col} /></mesh>
        <Html position={[0, hh + 0.12, 0]} center zIndexRange={[20, 0]}><span className={`t3 ${hit ? "no" : accent ? "a" : ""}`}>{tag}</span></Html>
    </group>;
}

/* ───────── osprzęt ───────── */
const AT_DEF: View = { pos: [-3.9, 2.0, 4.0], target: [0, 0.85, 1.0] };
export function AttachScene({ attach, load, label, hint, resetLabel }: { attach: Attachment; load: "pallet" | "long"; label: string; hint: string; resetLabel: string }) {
    return <Stage3D view={AT_DEF} hint={hint} resetLabel={resetLabel} label={label} className="s3d-att" maxDist={10}>
        <AttachTruck attach={attach} load={load} />
    </Stage3D>;
}
function AttachTruck({ attach, load }: { attach: Attachment; load: "pallet" | "long" }) {
    // przesuw boczny: karetka jeździ wahadłowo w lewo i w prawo
    const ref = useRef<THREE.Group>(null!);
    const carriage = useRef<THREE.Object3D | null>(null);
    useEffect(() => { carriage.current = null; }, [attach]);
    useFrame(({ clock }) => {
        if (attach !== "sideshift") return;
        if (!carriage.current) ref.current.traverse(o => { if (!carriage.current && o.userData?.part === "carriage") carriage.current = o.parent; });
        if (carriage.current) carriage.current.position.x = Math.sin(clock.elapsedTime * 1.4) * 0.1;
    });
    return <group ref={ref}><Forklift3D lift={0.3} tilt={-2} attach={attach} load={attach === "clamp" || attach === "bin" ? "none" : load} /></group>;
}

/* ───────── środek ciężkości przy hamowaniu ───────── */
const C_DEF: View = { pos: [-7.2, 2.4, 1.7], target: [0, 1.6, 0.9] };
const overlayMat = (c: string, o = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthTest: false, depthWrite: false });
type CogProps = { lift: number; tilt: number; braking: boolean; labels: { total: string; edge: string; truck: string; load: string } };
export function CogScene({ label, hint, resetLabel, ...p }: CogProps & { label: string; hint: string; resetLabel: string }) {
    return <Stage3D view={C_DEF} hint={hint} resetLabel={resetLabel} label={label} className="s3d-cog" maxDist={11}><CogInner {...p} /></Stage3D>;
}
function CogInner({ lift, tilt, braking, labels }: CogProps) {
    const m = cog3(lift, tilt, braking);
    const pitch = useRef<THREE.Group>(null!);
    const anim = useRef({ t: 0, on: false, tips: false });
    useEffect(() => { anim.current = { t: 0, on: braking, tips: braking && m.tips }; }, [braking]); // eslint-disable-line react-hooks/exhaustive-deps
    useFrame((_, dt) => {
        const a = anim.current;
        a.t += Math.min(dt, 0.05);
        let r = 0;
        if (a.on && a.tips) { const k = Math.min(1, a.t / 0.9); r = 0.42 * k * k; }
        else if (a.on) r = 0.035 * Math.sin(Math.min(1, a.t / 0.9) * Math.PI);
        const g = pitch.current; g.rotation.x += (r - g.rotation.x) * Math.min(1, dt * (a.on ? 30 : 4));
    });
    const mats = useMemo(() => ({ truck: overlayMat("#2b3440"), load: overlayMat("#f97706"), total: overlayMat("#ffffff"), ring: overlayMat("#2b3440"), edge: overlayMat("#ef4444"), line: overlayMat("#2b3440", 0.6), drop: overlayMat("#2b3440", 0.8), dropNo: overlayMat("#ef4444"), arrow: overlayMat("#f97706") }), []);
    useEffect(() => { const g = pitch.current; g.traverse(o => { if ((o as THREE.Mesh).material && Object.values(mats).includes((o as THREE.Mesh).material as THREE.MeshBasicMaterial)) o.renderOrder = 10; }); });
    const bad = m.tips && braking;
    const seg = (a: { y: number; z: number }, b: { y: number; z: number }, mat: THREE.Material, w = 0.018) => {
        const dy = b.y - a.y, dz = b.z - a.z, len = Math.hypot(dy, dz);
        return <mesh position={[0, (a.y + b.y) / 2, (a.z + b.z) / 2]} rotation={[Math.atan2(dz, dy), 0, 0]} material={mat} renderOrder={10}><boxGeometry args={[w, len, w]} /></mesh>;
    };
    return <>
        {/* obrót wokół styku kół przednich z posadzką */}
        <group position={[0, 0, COG3.edgeZ]}>
            <group ref={pitch}>
                <group position={[0, 0, -COG3.edgeZ]}>
                    <Forklift3D lift={lift / 1000} tilt={tilt} load="pallet" />
                    <group>
                        {seg(COG3.truck, m.load, mats.line, 0.01)}
                        <mesh position={[0, COG3.truck.y, COG3.truck.z]} material={mats.truck} renderOrder={10}><sphereGeometry args={[0.06, 20, 14]} /></mesh>
                        <mesh position={[0, m.load.y, m.load.z]} material={mats.load} renderOrder={10}><sphereGeometry args={[0.06, 20, 14]} /></mesh>
                        <mesh position={[0, m.cog.y, m.cog.z]} material={mats.ring} renderOrder={10}><sphereGeometry args={[0.1, 24, 16]} /></mesh>
                        <mesh position={[-0.01, m.cog.y, m.cog.z]} material={mats.total} renderOrder={11}><sphereGeometry args={[0.072, 24, 16]} /></mesh>
                        {braking && m.shift > 0.02 && <>
                            {seg({ y: m.cog.y, z: m.cog.z + 0.1 }, { y: m.cog.y, z: m.pz }, mats.arrow, 0.03)}
                            <mesh position={[0, m.cog.y, m.pz + 0.05]} rotation={[Math.PI / 2, 0, 0]} material={mats.arrow} renderOrder={10}><coneGeometry args={[0.06, 0.12, 16]} /></mesh>
                        </>}
                        {seg({ y: m.cog.y, z: m.pz }, { y: 0.01, z: m.pz }, bad ? mats.dropNo : mats.drop, 0.012)}
                        <Html position={[0, m.cog.y + 0.2, m.cog.z]} center zIndexRange={[20, 0]}><span className={`t3 ${bad ? "no" : ""}`}>{labels.total}</span></Html>
                        <Html position={[0, COG3.truck.y - 0.26, COG3.truck.z - 0.1]} center zIndexRange={[20, 0]}><span className="t3 k">{labels.truck}</span></Html>
                        <Html position={[0, m.load.y + 0.17, m.load.z]} center zIndexRange={[20, 0]}><span className="t3 a">{labels.load}</span></Html>
                    </group>
                </group>
            </group>
            {/* krawędź wywrotu: oś kół przednich */}
            <mesh position={[0, 0.006, 0]} material={mats.edge} renderOrder={10}><boxGeometry args={[1.5, 0.008, 0.03]} /></mesh>
            <Html position={[-0.9, 0.02, 0]} center zIndexRange={[20, 0]}><span className="t3 no">{labels.edge}</span></Html>
        </group>
    </>;
}

/* ───────── okładka modułu ───────── */
export function CoverScene({ label }: { label: string }) {
    return <Stage3D view={{ pos: [-4.3, 2.2, 3.9], target: [0, 1.0, 0.3] }} autoRotate zoom={false} label={label} className="s3d-cover">
        <Forklift3D lift={0.35} tilt={-3} load="pallet" />
    </Stage3D>;
}

export { FL, LSG_H };

/* ───────── od której strony podjąć skrzynię (wykres udźwigu) ───────── */
const D_DEF: View = { pos: [-4.4, 2.3, 4.6], target: [0, 0.75, 1.0] };
type DiagProps = { depth: number; across: number; ok: boolean; reveal: boolean; run: number; labels: { c: string; d: string; a: string; cog: string } };
export function DiagramScene({ label, hint, resetLabel, ...p }: DiagProps & { label: string; hint: string; resetLabel: string }) {
    return <Stage3D view={D_DEF} hint={hint} resetLabel={resetLabel} label={label} className="s3d-diag" maxDist={10}><DiagInner {...p} /></Stage3D>;
}
const crateMats = { wood: new THREE.MeshStandardMaterial({ color: "#c99a5e", roughness: 0.85 }), frame: new THREE.MeshStandardMaterial({ color: "#9c6f3c", roughness: 0.9 }), ink: new THREE.MeshStandardMaterial({ color: "#3b2a18", roughness: 0.9 }) };
function Crate({ w, d, h }: { w: number; d: number; h: number }) {
    // skrzynia z desek: korpus, listwy na krawędziach i ukośne wzmocnienia
    const f = 0.06, edges: [number, number, number, number, number, number][] = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) edges.push([sx * (w / 2 - f / 2), h / 2, sz * (d / 2 - f / 2), f + 0.004, h, f + 0.004]);
    for (const sy of [0, 1]) for (const sx of [-1, 1]) edges.push([sx * (w / 2 - f / 2), sy * (h - f) + f / 2, 0, f + 0.004, f, d + 0.004]);
    for (const sy of [0, 1]) for (const sz of [-1, 1]) edges.push([0, sy * (h - f) + f / 2, sz * (d / 2 - f / 2), w + 0.004, f, f + 0.004]);
    return <group>
        <mesh position={[0, h / 2, 0]} castShadow receiveShadow material={crateMats.wood}><boxGeometry args={[w - 0.01, h - 0.01, d - 0.01]} /></mesh>
        {edges.map((e, i) => <mesh key={i} position={[e[0], e[1], e[2]]} castShadow material={crateMats.frame}><boxGeometry args={[e[3], e[4], e[5]]} /></mesh>)}
        {[-1, 1].map(sx => <mesh key={sx} position={[sx * (w / 2 + 0.003), h / 2, 0]} rotation={[Math.atan2(h - 2 * f, d - 2 * f), 0, 0]} material={crateMats.frame}><boxGeometry args={[0.01, 0.07, Math.hypot(h - 2 * f, d - 2 * f)]} /></mesh>)}
        {/* znak „środek ciężkości” na boku skrzyni */}
        <mesh position={[-(w / 2 + 0.008), h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} material={crateMats.ink}><ringGeometry args={[0.07, 0.09, 32]} /></mesh>
        <mesh position={[-(w / 2 + 0.008), h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} material={crateMats.ink}><circleGeometry args={[0.07, 32, 0, Math.PI / 2]} /></mesh>
        <mesh position={[-(w / 2 + 0.008), h / 2, 0]} rotation={[0, -Math.PI / 2, Math.PI]} material={crateMats.ink}><circleGeometry args={[0.07, 32, 0, Math.PI / 2]} /></mesh>
    </group>;
}
function DiagInner({ depth, across, ok, reveal, run, labels }: DiagProps) {
    const H = 0.85, d = depth / 1000, w = across / 1000;
    const pitch = useRef<THREE.Group>(null!), spin = useRef<THREE.Group>(null!);
    const st = useRef({ t: 0, run: 0, lift: 0.1, rot: 0, rotTarget: 0 });
    const [lift, setLift] = useLiftState();
    // obrót skrzyni przy zmianie strony
    const turned = depth < across;
    useEffect(() => { st.current.rotTarget = turned ? 1 : 0; }, [turned]);
    useEffect(() => { st.current.t = 0; st.current.run = run; }, [run]);
    useFrame((_, dtRaw) => {
        const dt = Math.min(dtRaw, 0.05), S = st.current;
        S.rot += (S.rotTarget - S.rot) * Math.min(1, dt * 7);
        spin.current.rotation.y = (S.rotTarget - S.rot) * Math.PI / 2;
        let target = 0.1, p = 0;
        if (S.run) {
            S.t += dt;
            if (ok) target = 0.1 + Math.min(1, S.t / 1.4) * 0.5;
            else { target = 0.1 + Math.min(1, S.t / 0.9) * 0.12; p = Math.min(1, S.t / 0.9) * 0.075 + (S.t > 0.9 ? Math.sin((S.t - 0.9) * 9) * 0.006 * Math.max(0, 1 - (S.t - 0.9)) : 0); }
        }
        S.lift += (target - S.lift) * Math.min(1, dt * 6);
        if (Math.abs(S.lift - lift) > 0.004) setLift(S.lift);
        const g = pitch.current; g.rotation.x += (p - g.rotation.x) * Math.min(1, dt * (S.run ? 12 : 4));
    });
    const col = !reveal ? "#2b3440" : ok ? "#16a34a" : "#dc2626";
    const mats = useMemo(() => ({ cog: overlayMat("#f97706"), dim: overlayMat("#2b3440"), ring: overlayMat("#ffffff") }), []);
    useEffect(() => { mats.dim.color.set(col); }, [col, mats]);
    const z0 = 0.0625;                         // przednia powierzchnia grzbietu wideł (w układzie karetki)
    const zc = z0 + d / 2;
    return <group position={[0, 0, COG3.edgeZ]}>
        <group ref={pitch}>
            <group position={[0, 0, -COG3.edgeZ]}>
                <Forklift3D lift={lift} tilt={-1} load="none">
                    <group ref={spin} position={[0, 0.045, zc]}><Crate w={w} d={d} h={H} /></group>
                    {/* środek ciężkości skrzyni i odległość od grzbietu wideł */}
                    <mesh position={[0, 0.045 + H / 2, zc]} material={mats.ring} renderOrder={10}><sphereGeometry args={[0.075, 20, 14]} /></mesh>
                    <mesh position={[0, 0.045 + H / 2, zc]} material={mats.cog} renderOrder={11}><sphereGeometry args={[0.055, 20, 14]} /></mesh>
                    <mesh position={[0, 0.045 + H / 2, zc]} material={mats.dim} renderOrder={10}><boxGeometry args={[0.012, 0.012, 0.001]} /></mesh>
                    <group position={[-(w / 2 + 0.16), 0.06, 0]}>
                        <mesh position={[0, 0, (z0 + zc) / 2]} material={mats.dim} renderOrder={10}><boxGeometry args={[0.02, 0.02, zc - z0]} /></mesh>
                        {[z0, zc].map(z => <mesh key={z} position={[0, 0.06, z]} material={mats.dim} renderOrder={10}><boxGeometry args={[0.02, 0.16, 0.02]} /></mesh>)}
                        <mesh position={[0.5 * (w / 2 + 0.16), 0.06, zc]} material={mats.dim} renderOrder={10}><boxGeometry args={[w / 2 + 0.16, 0.008, 0.008]} /></mesh>
                        <Html position={[0, 0.2, (z0 + zc) / 2]} center zIndexRange={[20, 0]}><span className={`t3 ${!reveal ? "k" : ok ? "ok" : "no"}`}>{labels.c}</span></Html>
                    </group>
                    <Html position={[0, 0.045 + H / 2 + 0.17, zc]} center zIndexRange={[20, 0]}><span className="t3 a">{labels.cog}</span></Html>
                    <Html position={[-w / 2, 0.045 + H + 0.06, zc]} center zIndexRange={[20, 0]}><span className="t3">{labels.d}</span></Html>
                    <Html position={[0, 0.045 + H + 0.06, zc + d / 2]} center zIndexRange={[20, 0]}><span className="t3">{labels.a}</span></Html>
                </Forklift3D>
            </group>
        </group>
    </group>;
}
function useLiftState() { return useState(0.1); }
