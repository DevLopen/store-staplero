/**
 * Moduł 3.2: stacja ładowania akumulatorów (znajdź zagrożenia). Ładowarka, akumulator trakcyjny, wózek,
 * znaki, wentylacja, butelka do płukania oczu oraz błędy: papieros, klucz na biegunach, dolewanie w trakcie, regał z kartonami.
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { Forklift3D, MAT, Pallet } from "./Forklift3D";
import { Stage3D, Stage3DHandle, View } from "./Stage3D";
import { Person } from "./scenes6";

const CH_DEF: View = { pos: [-6.2, 4.4, 6.4], target: [0.2, 1.0, -0.6] };
const CH_POS: Record<string, [number, number, number]> = {
    smoke: [-2.25, 1.9, 0.9], tool: [0.25, 1.2, -0.6], water: [1.15, 1.55, 0.1], shelf: [2.9, 1.9, -1.4],
    sign: [-0.9, 2.55, -2.0], vent: [-2.6, 2.75, -2.0], eyewash: [-1.9, 1.55, -1.95],
};
const CH_VIEW: Record<string, View> = {
    smoke: { pos: [-4.6, 2.2, 3.4], target: [-2.2, 1.4, 0.8] },
    tool: { pos: [-1.4, 2.6, 1.6], target: [0.2, 0.9, -0.6] },
    water: { pos: [3.4, 2.2, 1.9], target: [0.9, 1.0, 0.0] },
    shelf: { pos: [0.2, 2.4, 2.8], target: [2.8, 1.2, -1.4] },
    sign: { pos: [-1.4, 2.2, 1.6], target: [-0.9, 2.2, -2.0] },
    vent: { pos: [-3.2, 2.4, 1.6], target: [-2.6, 2.6, -2.0] },
    eyewash: { pos: [-2.6, 1.8, 0.8], target: [-1.9, 1.5, -2.0] },
};
function signTex(kind: "warn" | "ban") {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d")!;
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, 128, 128);
    if (kind === "warn") {
        g.fillStyle = "#f2b705"; g.strokeStyle = "#111"; g.lineWidth = 7;
        g.beginPath(); g.moveTo(64, 12); g.lineTo(118, 112); g.lineTo(10, 112); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = "#111"; g.fillRect(44, 62, 40, 30); g.fillRect(50, 54, 8, 8); g.fillRect(70, 54, 8, 8);
    } else {
        g.strokeStyle = "#d42a1e"; g.lineWidth = 12; g.beginPath(); g.arc(64, 64, 50, 0, Math.PI * 2); g.stroke();
        g.fillStyle = "#111"; g.fillRect(30, 60, 58, 10); g.fillStyle = "#f05a1a"; g.fillRect(88, 60, 10, 10);
        g.beginPath(); g.moveTo(28, 28); g.lineTo(100, 100); g.stroke();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function ChargeScene({ zones, marks, focus, onPick, label, hint, resetLabel }: {
    zones: { id: string; label: string }[]; marks: Record<string, string>; focus: string | null; onPick: (id: string) => void; label: string; hint: string; resetLabel: string;
}) {
    const stage = useRef<Stage3DHandle>(null);
    useEffect(() => { stage.current?.setView(focus ? CH_VIEW[focus] ?? CH_DEF : CH_DEF); }, [focus]);
    return <Stage3D ref={stage} view={CH_DEF} hint={hint} resetLabel={resetLabel} label={label} className="s3d-people" maxDist={14} minDist={1.5} shadowSize={7}>
        <ChargeWorld />
        {zones.map(z => <Html key={z.id} position={CH_POS[z.id]} center zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
            <div className={`m3 ${marks[z.id] ?? ""}`}>
                <button type="button" aria-label={z.label} onClick={() => onPick(z.id)} style={{ pointerEvents: "auto" }}><i /></button>
                {(marks[z.id] === "ok" || marks[z.id] === "no" || marks[z.id] === "cur") && <span className="m3-tag">{z.label}</span>}
            </div>
        </Html>)}
    </Stage3D>;
}
function ChargeWorld() {
    const warn = useMemo(() => signTex("warn"), []), ban = useMemo(() => signTex("ban"), []);
    const wall = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d7d3cb", roughness: 0.9 }), []);
    const grey = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8a929c", roughness: 0.5, metalness: 0.5 }), []);
    const cell = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2b3440", roughness: 0.5 }), []);
    const red = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c62828", roughness: 0.5 }), []);
    const ember = useRef<THREE.MeshStandardMaterial>(null!), smokeRef = useRef<THREE.Group>(null!);
    useFrame(({ clock }) => {
        const t = clock.elapsedTime;
        if (ember.current) ember.current.emissiveIntensity = 1.5 + Math.sin(t * 6) * 0.8;
        smokeRef.current.children.forEach((m, i) => { const k = ((t * 0.4 + i / 3) % 1); m.position.set(Math.sin(k * 6 + i) * 0.05, k * 0.6, 0); (m as THREE.Mesh).scale.setScalar(0.4 + k); ((m as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = 0.35 * (1 - k); });
    });
    return <>
        {/* ściana z ładowarką, znakami, wentylacją i płuczką do oczu */}
        <mesh position={[0, 1.75, -2.15]} receiveShadow material={wall}><boxGeometry args={[8, 3.5, 0.2]} /></mesh>
        <mesh position={[-0.9, 2.3, -2.04]}><planeGeometry args={[0.36, 0.36]} /><meshBasicMaterial map={warn} /></mesh>
        <mesh position={[-0.45, 2.3, -2.04]}><planeGeometry args={[0.36, 0.36]} /><meshBasicMaterial map={ban} /></mesh>
        <group position={[-2.6, 2.75, -2.04]}>
            <mesh material={grey}><boxGeometry args={[0.7, 0.4, 0.04]} /></mesh>
            {Array.from({ length: 6 }, (_, i) => <mesh key={i} position={[0, -0.15 + i * 0.06, 0.025]} material={cell}><boxGeometry args={[0.62, 0.02, 0.01]} /></mesh>)}
        </group>
        <group position={[-1.9, 1.4, -2.0]}>
            <mesh material={new THREE.MeshStandardMaterial({ color: "#178a45" })}><boxGeometry args={[0.32, 0.4, 0.08]} /></mesh>
            {[-0.07, 0.07].map(x => <mesh key={x} position={[x, -0.02, 0.08]}><cylinderGeometry args={[0.045, 0.045, 0.22, 14]} /><meshStandardMaterial color="#e8f4ff" roughness={0.2} /></mesh>)}
        </group>
        {/* ładowarka na ścianie z kablem */}
        <RoundedBox args={[0.6, 0.8, 0.3]} radius={0.04} position={[0.6, 1.5, -1.9]} castShadow material={grey} />
        <mesh position={[0.6, 1.6, -1.74]}><planeGeometry args={[0.3, 0.12]} /><meshStandardMaterial color="#1b5e20" emissive="#2e7d32" emissiveIntensity={0.8} /></mesh>
        <mesh position={[0.45, 0.9, -1.2]} rotation={[0.7, 0, 0]} castShadow material={MAT.hose}><cylinderGeometry args={[0.025, 0.025, 1.4, 8]} /></mesh>
        {/* akumulator trakcyjny na stanowisku, z kluczem na biegunach */}
        <group position={[0.2, 0, -0.6]}>
            <mesh position={[0, 0.35, 0]} castShadow material={MAT.dark}><boxGeometry args={[1.0, 0.7, 0.8]} /></mesh>
            {Array.from({ length: 4 }, (_, i) => Array.from({ length: 3 }, (_, j) => <mesh key={`${i}${j}`} position={[-0.36 + i * 0.24, 0.71, -0.26 + j * 0.26]} material={cell}><boxGeometry args={[0.2, 0.02, 0.22]} /></mesh>))}
            {Array.from({ length: 4 }, (_, i) => <mesh key={i} position={[-0.36 + i * 0.24, 0.74, 0.1]} material={i % 2 ? red : MAT.dark}><cylinderGeometry args={[0.03, 0.03, 0.05, 10]} /></mesh>)}
            <group position={[0, 0.78, 0.1]} rotation={[0, 0.05, 0]}>
                <mesh castShadow material={MAT.steel}><boxGeometry args={[0.32, 0.02, 0.04]} /></mesh>
                <mesh position={[-0.17, 0, 0]} material={MAT.steel}><cylinderGeometry args={[0.035, 0.035, 0.02, 12]} /></mesh>
            </group>
        </group>
        {/* wózek na miejscu ładowania */}
        <group position={[-0.3, 0, 1.9]} rotation={[0, Math.PI, 0]}><Forklift3D lift={0} tilt={2} load="none" keyIn={false} beacon={false} brake /></group>
        {/* pracownik pali papierosa */}
        <group position={[-2.3, 0, 0.9]} rotation={[0, 0.6, 0]}>
            <Person pose="phone" />
            <mesh position={[0.18, 1.56, 0.2]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.008, 0.008, 0.08, 8]} /><meshStandardMaterial color="#f5f5f2" /></mesh>
            <mesh position={[0.23, 1.56, 0.2]}><sphereGeometry args={[0.012, 8, 8]} /><meshStandardMaterial ref={ember} color="#ff6a00" emissive="#ff4500" emissiveIntensity={2} /></mesh>
            <group ref={smokeRef} position={[0.23, 1.6, 0.2]}>{[0, 1, 2].map(i => <mesh key={i}><sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial color="#d9dde2" transparent opacity={0.3} depthWrite={false} /></mesh>)}</group>
        </group>
        {/* pracownik dolewa wodę w trakcie ładowania */}
        <group position={[1.1, 0, 0.15]} rotation={[0, -2.4, 0]}>
            <Person pose="wave" />
            <group position={[-0.1, 0.95, 0.45]} rotation={[0.5, 0, 0]}>
                <mesh castShadow><cylinderGeometry args={[0.1, 0.12, 0.22, 16]} /><meshStandardMaterial color="#3d7fbf" roughness={0.5} /></mesh>
                <mesh position={[0, 0.02, 0.17]} rotation={[1.1, 0, 0]}><cylinderGeometry args={[0.015, 0.02, 0.22, 8]} /><meshStandardMaterial color="#3d7fbf" /></mesh>
            </group>
        </group>
        {/* regał z kartonami tuż przy miejscu ładowania */}
        <group position={[2.9, 0, -1.4]}>
            {[-0.5, 0.5].flatMap(x => [-0.45, 0.45].map(z => <mesh key={`${x}${z}`} position={[x, 1.1, z]} castShadow><boxGeometry args={[0.06, 2.2, 0.06]} /><meshStandardMaterial color="#1f4f8f" metalness={0.4} roughness={0.5} /></mesh>))}
            {[0.05, 1.05].map(y => <group key={y}>
                <mesh position={[0, y + 0.04, 0]} castShadow><boxGeometry args={[1.1, 0.06, 1.0]} /><meshStandardMaterial color="#f47a0b" roughness={0.45} /></mesh>
                <group position={[0, y + 0.07, 0]} rotation={[0, Math.PI / 2, 0]} scale={[0.8, 1, 0.8]}><Pallet /></group>
            </group>)}
        </group>
    </>;
}
