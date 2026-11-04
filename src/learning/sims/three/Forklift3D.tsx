/**
 * Proceduralny model wózka czołowego (metry, y w górę, przód = +z, środek między osiami na posadzce).
 * Bez zewnętrznych plików: tylko bryły three.js, żeby nic nie pobierać z sieci.
 * Części są oznaczone (userData.part), więc da się je podświetlić, kliknąć i podpiąć do nich znaczniki.
 */
import { forwardRef, useEffect, useMemo, useRef } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { mastState, type Attachment, type MastKind, type PartId } from "../forklift";

export const FL = {
    frontZ: 0.55, rearZ: -0.85,          // osie
    frontX: 0.48, rearX: 0.46,           // połowa rozstawu kół
    frontR: 0.31, rearR: 0.24,
    mastZ: 0.86, mastY: 0.28,            // dolne mocowanie masztu (oś pochylenia)
    forkLen: 1.15,
};
/** Wysokość od wideł do górnej krawędzi kraty oporowej (m). */
export const LSG_H = 1.07;

const std = (color: string, roughness: number, metalness = 0, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
export const MAT = {
    body: std("#f47a0b", 0.38, 0.15),
    dark: std("#2a3038", 0.55, 0.35),
    steel: std("#8a929c", 0.35, 0.85),
    steel2: std("#6f7781", 0.4, 0.8),
    fork: std("#3a3f46", 0.5, 0.7),
    tire: std("#1b1d20", 0.92),
    rim: std("#c9ced4", 0.3, 0.8),
    seat: std("#16181b", 0.8),
    belt: std("#c2410c", 0.7),
    glass: std("#ffe9b0", 0.2, 0, { emissive: "#ffd27a", emissiveIntensity: 0.6 }),
    beacon: std("#ff8a00", 0.3, 0, { emissive: "#ff7a00", emissiveIntensity: 1.5 }),
    beaconOff: std("#b8732e", 0.35, 0, { transparent: true, opacity: 0.85 }),
    tail: std("#b3261e", 0.4, 0, { emissive: "#a01810", emissiveIntensity: 0.6 }),
    plate: std("#e8eaed", 0.35, 0.6),
    plateInk: std("#30363d", 0.6),
    wood: std("#c79a62", 0.85),
    woodDark: std("#a87c48", 0.9),
    box: std("#c8a47a", 0.9),
    tape: std("#e9d9bf", 0.7),
    stripe: std("#1b1d20", 0.6),
    hose: std("#111316", 0.7),
    lumber: std("#d9b98a", 0.8),
    bin: std("#3f6f9e", 0.5, 0.4),
};
/** Podświetlenie wybranej części (pulsuje w useFrame). */
const LIGHT_ON = std("#fffbe8", 0.1, 0, { emissive: "#fff3c4", emissiveIntensity: 3 });
const HALO = new THREE.MeshBasicMaterial({ color: "#fff2c0", transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending });
/** Plamy światła reflektorów na posadzce przed wózkiem. */
function LightPools() {
    const mat = useMemo(() => {
        const c = document.createElement("canvas"); c.width = c.height = 128;
        const g = c.getContext("2d")!, gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
        gr.addColorStop(0, "rgba(255,240,190,.85)"); gr.addColorStop(0.5, "rgba(255,236,170,.35)"); gr.addColorStop(1, "rgba(255,236,170,0)");
        g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
        return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    }, []);
    return <>{[-0.5, 0.5].map(x => <mesh key={x} position={[x, 0.006, 2.6]} rotation={[-Math.PI / 2, 0, 0]} material={mat}><planeGeometry args={[1.3, 2.4]} /></mesh>)}</>;
}
export const HI_MAT = std("#ff9433", 0.35, 0.1, { emissive: "#f97706", emissiveIntensity: 0.6 });

const DMG = {
    carcass: std("#8f7e63", 0.95),
    oil: std("#120d06", 0.06, 0.35, { transparent: true, opacity: 0.92 }),
    crack: std("#0b0b0c", 0.9),
    rust: std("#7a4a22", 0.9),
};
/** Usterki do codziennej kontroli (widoczne na modelu). */
export type Defects = { fork?: boolean; tyre?: boolean; chain?: boolean; leak?: boolean };

function Wheel({ r, w, x, z, spin, damaged }: { r: number; w: number; x: number; z: number; spin?: React.MutableRefObject<number>; damaged?: boolean }) {
    const ref = useRef<THREE.Group>(null!);
    useFrame(() => { if (spin) ref.current.rotation.x = spin.current / r; });
    const side = Math.sign(x);
    return <group position={[x, r, z]}>
        <group ref={ref}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow material={MAT.tire}><cylinderGeometry args={[r, r, w, 40]} /></mesh>
            {Array.from({ length: 14 }, (_, i) => {
                const a = i / 14 * Math.PI * 2;
                return <mesh key={i} position={[0, Math.cos(a) * r, Math.sin(a) * r]} rotation={[a, 0, 0]} material={MAT.tire}><boxGeometry args={[w * 0.96, 0.025, 0.05]} /></mesh>;
            })}
            <mesh position={[side * w * 0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT.rim}><cylinderGeometry args={[r * 0.58, r * 0.62, 0.02, 32]} /></mesh>
            <mesh position={[side * (w * 0.5 + 0.015), 0, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT.dark}><cylinderGeometry args={[r * 0.18, r * 0.18, 0.03, 16]} /></mesh>
            {[0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * Math.PI * 2; return <mesh key={i} position={[side * (w * 0.5 + 0.012), Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36]} rotation={[0, 0, Math.PI / 2]} material={MAT.dark}><cylinderGeometry args={[0.018, 0.018, 0.02, 8]} /></mesh>; })}
            {damaged && <group rotation={[1.72, 0, 0]}>
                {/* wyrwany kawałek bieżnika z odsłoniętą osnową i pęknięcia na boku opony */}
                <mesh position={[side * 0.03, r + 0.004, 0]} rotation={[0, 0.12, 0]} material={DMG.carcass}><boxGeometry args={[w * 0.62, 0.006, 0.15]} /></mesh>
                <mesh position={[side * 0.05, r + 0.012, 0.078]} rotation={[0.35, 0, 0.25]} material={MAT.tire}><boxGeometry args={[w * 0.4, 0.02, 0.05]} /></mesh>
                <mesh position={[-side * 0.04, r + 0.01, -0.08]} rotation={[-0.3, 0, -0.2]} material={MAT.tire}><boxGeometry args={[w * 0.32, 0.018, 0.045]} /></mesh>
                {[-0.04, 0.01, 0.05].map((d, i) => <mesh key={i} position={[side * (0.03 - i * 0.03), r + 0.008, d]} rotation={[0, 0.5 * (i - 1), 0]} material={DMG.crack}><boxGeometry args={[0.006, 0.004, 0.08]} /></mesh>)}
                {[-0.05, 0.0, 0.05].map((d, i) => <mesh key={i} position={[side * (w * 0.5 + 0.002), r * 0.82, d]} rotation={[0.4 * (i - 1), 0, 0]} material={DMG.crack}><boxGeometry args={[0.004, 0.006, 0.07]} /></mesh>)}
            </group>}
        </group>
    </group>;
}

/** Europaleta 1200 × 800 (długość wzdłuż wideł), wysokość 144 mm; środek palety, spód na y = 0. Ładunek 0,68 m. */
export function Pallet({ withLoad = true }: { withLoad?: boolean }) {
    const top = [-0.35, -0.175, 0, 0.175, 0.35];
    return <group>
        {top.map(x => <mesh key={x} position={[x, 0.133, 0]} castShadow receiveShadow material={MAT.wood}><boxGeometry args={[x === 0 || Math.abs(x) > 0.3 ? 0.145 : 0.1, 0.022, 1.2]} /></mesh>)}
        {[-0.36, 0, 0.36].map(x => <mesh key={x} position={[x, 0.111, 0]} castShadow material={MAT.woodDark}><boxGeometry args={[0.145, 0.022, 1.2]} /></mesh>)}
        {[-0.36, 0, 0.36].flatMap(x => [-0.52, 0, 0.52].map(z => <mesh key={`${x}${z}`} position={[x, 0.061, z]} castShadow material={MAT.wood}><boxGeometry args={[0.145, 0.078, z === 0 ? 0.145 : 0.1]} /></mesh>))}
        {[-0.52, 0, 0.52].map(z => <mesh key={z} position={[0, 0.011, z]} castShadow material={MAT.woodDark}><boxGeometry args={[0.8, 0.022, z === 0 ? 0.145 : 0.1]} /></mesh>)}
        {withLoad && <group position={[0, 0.144, 0]}><Cartons /></group>}
    </group>;
}
function Cartons({ w = 0.8, d = 1.2, rows = 2 }: { w?: number; d?: number; rows?: number }) {
    const bw = w / 2, bd = d / 2, bh = 0.34;
    return <>{Array.from({ length: rows }, (_, row) => [-bw / 2, bw / 2].flatMap(x => [-bd / 2, bd / 2].map(z => (
        <group key={`${row}${x}${z}`} position={[x, bh / 2 + row * bh, z]}>
            <mesh castShadow receiveShadow material={MAT.box}><boxGeometry args={[bw - 0.01, bh - 0.01, bd - 0.01]} /></mesh>
            <mesh position={[0, bh / 2 - 0.004, 0]} material={MAT.tape}><boxGeometry args={[0.07, 0.004, bd - 0.008]} /></mesh>
        </group>
    ))))}</>;
}
function Lumber() {
    // paczka desek 2,4 m na przedłużkach wideł
    return <group>
        {[0, 1, 2, 3].flatMap(r => [-0.3, -0.15, 0, 0.15, 0.3].map(x => <mesh key={`${r}${x}`} position={[x, 0.05 + r * 0.07, 0]} castShadow receiveShadow material={MAT.lumber}><boxGeometry args={[0.14, 0.065, 2.4]} /></mesh>))}
        {[-0.8, 0.8].map(z => <mesh key={z} position={[0, 0.17, z]} material={MAT.stripe}><boxGeometry args={[0.78, 0.3, 0.025]} /></mesh>)}
    </group>;
}

/** Luźny łańcuch: wygięty łuk do przodu i do środka zamiast prostej linii. */
function SlackChain({ x, top, bot, bow }: { x: number; top: number; bot: number; bow: number }) {
    const geo = useMemo(() => {
        const h = top - bot, z = 0.17;
        const c = new THREE.CatmullRomCurve3([
            new THREE.Vector3(x, top, z), new THREE.Vector3(x + 0.03, bot + h * 0.72, z + bow * 0.55),
            new THREE.Vector3(x + 0.06, bot + h * 0.45, z + bow), new THREE.Vector3(x + 0.03, bot + h * 0.18, z + bow * 0.5), new THREE.Vector3(x, bot, z),
        ]);
        return new THREE.TubeGeometry(c, 48, 0.014, 8, false);
    }, [x, top, bot, bow]);
    useEffect(() => () => geo.dispose(), [geo]);
    return <mesh geometry={geo} material={MAT.steel2} castShadow />;
}

export type LoadKind = "pallet" | "long" | "none";
export type ForkliftProps = {
    lift?: number; tilt?: number; mast?: MastKind; load?: LoadKind; attach?: Attachment; shift?: number;
    spin?: React.MutableRefObject<number>; beacon?: boolean; hi?: PartId | null; keyIn?: boolean; brake?: boolean;
    defects?: Defects; lights?: boolean;
    /** Położenie palety na widłach: y względem karetki (domyślnie leży na widłach), z = przesunięcie w stronę końców wideł. */
    loadY?: number; loadZ?: number; loadPitch?: number;
    onPick?: (p: PartId) => void;
    /** Znaczniki w miejscu części (dziedziczą podnoszenie i pochylenie masztu). */
    marker?: (p: PartId) => React.ReactNode;
    /** Dodatkowa zawartość przy palecie (np. znacznik środka ciężkości ładunku). */
    loadSlot?: React.ReactNode;
    children?: React.ReactNode;
};

const Part = ({ id, children }: { id: PartId; children: React.ReactNode }) => <group userData={{ part: id }}>{children}</group>;

/**
 * lift = wysokość wideł nad posadzką (m), tilt = pochylenie masztu w stopniach (+ do przodu, − do tyłu),
 * mast = rodzaj masztu (stopnie wysuwają się jak w mastState), attach = osprzęt.
 */
export const Forklift3D = forwardRef<THREE.Group, ForkliftProps>(function Forklift3D(p, ref) {
    const { lift = 0.15, tilt = 0, mast = "duplex", load = "none", attach = "none", shift = 0, spin, beacon = true, hi = null, onPick, marker, loadSlot, children, keyIn = true, brake = false, defects = {}, lights = false, loadY = 0.045, loadZ = 0, loadPitch = 0 } = p;
    const root = useRef<THREE.Group>(null!);
    const beaconRef = useRef<THREE.Mesh>(null!);
    const beaconMat = useMemo(() => MAT.beacon.clone(), []);
    useFrame(({ clock }) => {
        beaconMat.emissiveIntensity = beacon && Math.sin(clock.elapsedTime * 7) > 0 ? 2.4 : 0.3;
        if (hi) HI_MAT.emissiveIntensity = 0.45 + 0.35 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 4));
    });
    // podświetlenie: podmiana materiału w siatkach wybranej części
    useEffect(() => {
        root.current.traverse(o => {
            const m = o as THREE.Mesh;
            if (!m.isMesh) return;
            let a: THREE.Object3D | null = m, part: string | undefined;
            while (a && !part) { part = a.userData?.part; a = a.parent; }
            if (!m.userData.orig) m.userData.orig = m.material;
            m.material = hi && part === hi ? HI_MAT : m.userData.orig;
        });
    });
    const ms = mastState(mast, lift * 1000);
    const e1 = ms.ext[1] / 1000, e2 = ms.ext[2] / 1000;
    const carY = lift - FL.mastY;                                   // karetka względem mocowania masztu
    const mk = (id: PartId, pos: [number, number, number]) => marker ? <group position={pos}>{marker(id)}</group> : null;
    const click = onPick ? (e: ThreeEvent<MouseEvent>) => {
        if (e.delta > 6) return;
        let a: THREE.Object3D | null = e.object, part: PartId | undefined;
        while (a && !part) { part = a.userData?.part; a = a.parent; }
        if (part) { e.stopPropagation(); onPick(part); }
    } : undefined;
    const guardPosts = [[-0.46, 0.42], [0.46, 0.42], [-0.46, -0.72], [0.46, -0.72]] as const;
    const clamp = attach === "clamp", ext = attach === "extension", bin = attach === "bin", side = attach === "sideshift";
    const shiftX = side ? shift : 0;
    const stageW = [0.34, 0.27, 0.205];
    return <group ref={(g) => { root.current = g!; if (typeof ref === "function") ref(g); else if (ref) ref.current = g; }} onClick={click}>
        {/* podwozie */}
        <RoundedBox args={[1.06, 0.42, 1.78]} radius={0.06} smoothness={3} position={[0, 0.4, -0.18]} castShadow receiveShadow material={MAT.dark} />
        <RoundedBox args={[1.1, 0.34, 1.2]} radius={0.08} smoothness={4} position={[0, 0.72, -0.05]} castShadow receiveShadow material={MAT.body} />
        {[0.556, -0.556].map(x => <mesh key={x} position={[x, 0.62, 0.1]} material={MAT.stripe}><boxGeometry args={[0.005, 0.05, 0.9]} /></mesh>)}
        {/* przeciwwaga */}
        <Part id="cw">
            <RoundedBox args={[1.12, 0.78, 0.5]} radius={0.16} smoothness={5} position={[0, 0.66, -0.92]} castShadow receiveShadow material={MAT.dark} />
            <RoundedBox args={[1.08, 0.12, 0.46]} radius={0.05} smoothness={3} position={[0, 1.08, -0.9]} castShadow material={MAT.body} />
            {[-0.4, 0.4].map(x => <mesh key={x} position={[x, 0.86, -1.172]} material={MAT.tail}><boxGeometry args={[0.12, 0.06, 0.01]} /></mesh>)}
        </Part>
        {mk("cw", [-0.58, 0.72, -0.95])}
        {/* pokrywa, fotel z pasem */}
        <RoundedBox args={[0.9, 0.12, 0.7]} radius={0.05} smoothness={3} position={[0, 0.95, -0.35]} castShadow material={MAT.body} />
        <RoundedBox args={[0.5, 0.12, 0.46]} radius={0.05} smoothness={3} position={[0, 1.07, -0.38]} castShadow material={MAT.seat} />
        <RoundedBox args={[0.5, 0.5, 0.12]} radius={0.05} smoothness={3} position={[0, 1.33, -0.6]} rotation={[-0.18, 0, 0]} castShadow material={MAT.seat} />
        {[-0.27, 0.27].map(x => <RoundedBox key={x} args={[0.06, 0.16, 0.4]} radius={0.025} smoothness={2} position={[x, 1.2, -0.4]} castShadow material={MAT.seat} />)}
        <Part id="restraint">
            <mesh position={[0, 1.15, -0.17]} rotation={[0, 0, 0]} castShadow material={MAT.belt}><boxGeometry args={[0.46, 0.05, 0.015]} /></mesh>
            <mesh position={[0.25, 1.2, -0.22]} material={MAT.dark}><boxGeometry args={[0.05, 0.08, 0.06]} /></mesh>
            {/* pałąk/drzwiczki boczne systemu przytrzymującego */}
            {[-0.33, 0.33].map(x => <mesh key={x} position={[x, 1.3, -0.25]} castShadow material={MAT.belt}><torusGeometry args={[0.12, 0.016, 8, 20, Math.PI]} /></mesh>)}
        </Part>
        {mk("restraint", [-0.36, 1.32, -0.25])}
        {/* deska, kierownica, tabliczka znamionowa */}
        <RoundedBox args={[0.8, 0.36, 0.22]} radius={0.06} smoothness={3} position={[0, 0.98, 0.38]} castShadow material={MAT.body} />
        <group>
            <mesh position={[0, 1.25, 0.24]} rotation={[-0.75, 0, 0]} material={MAT.dark}><cylinderGeometry args={[0.025, 0.025, 0.36, 10]} /></mesh>
            <mesh position={[0, 1.38, 0.13]} rotation={[0.8, 0, 0]} castShadow material={MAT.seat}><torusGeometry args={[0.15, 0.018, 10, 32]} /></mesh>
            <mesh position={[0.11, 1.42, 0.09]} material={MAT.dark}><sphereGeometry args={[0.025, 10, 8]} /></mesh>
        </group>
        {/* stacyjka z kluczykiem i dźwignia hamulca postojowego */}
        <mesh position={[0.3, 1.17, 0.29]} rotation={[-0.5, 0, 0]} material={MAT.dark}><cylinderGeometry args={[0.025, 0.025, 0.02, 16]} /></mesh>
        {keyIn && <group position={[0.3, 1.18, 0.275]} rotation={[-0.5, 0, 0]}>
            <mesh position={[0, 0.03, 0]} material={MAT.steel}><boxGeometry args={[0.012, 0.05, 0.004]} /></mesh>
            <mesh position={[0, 0.07, 0]} material={MAT.beacon}><boxGeometry args={[0.035, 0.04, 0.012]} /></mesh>
        </group>}
        <group position={[-0.33, 0.98, 0.1]} rotation={[brake ? -0.2 : -1.1, 0, 0]}>
            <mesh position={[0, 0.12, 0]} material={MAT.dark}><cylinderGeometry args={[0.012, 0.012, 0.24, 8]} /></mesh>
            <mesh position={[0, 0.25, 0]} material={brake ? MAT.belt : MAT.seat}><sphereGeometry args={[0.028, 12, 10]} /></mesh>
        </group>
        <Part id="plate">
            <mesh position={[-0.401, 1.0, 0.4]} castShadow material={MAT.plate}><boxGeometry args={[0.006, 0.12, 0.17]} /></mesh>
            {[0.03, 0, -0.03].map(y => <mesh key={y} position={[-0.405, 1.0 + y, 0.4]} material={MAT.plateInk}><boxGeometry args={[0.002, 0.008, 0.13]} /></mesh>)}
        </Part>
        {mk("plate", [-0.46, 1.0, 0.4])}
        {/* dach ochronny */}
        <Part id="guard">
            {guardPosts.map(([x, z], i) => <mesh key={i} position={[x, 1.45, z]} rotation={[z > 0 ? -0.08 : 0, 0, 0]} castShadow material={MAT.dark}><boxGeometry args={[0.06, 1.3, 0.06]} /></mesh>)}
            <RoundedBox args={[1.0, 0.06, 1.3]} radius={0.025} smoothness={2} position={[0, 2.12, -0.12]} castShadow material={MAT.dark} />
            {[-0.48, -0.24, 0, 0.24, 0.48].map(z => <mesh key={z} position={[0, 2.16, z - 0.12]} castShadow material={MAT.dark}><boxGeometry args={[0.92, 0.03, 0.05]} /></mesh>)}
        </Part>
        {mk("guard", [-0.5, 2.2, -0.2])}
        {[-0.46, 0.46].map(x => <group key={x} position={[x, 1.98, 0.48]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={lights ? LIGHT_ON : MAT.glass}><cylinderGeometry args={[0.05, 0.05, 0.06, 16]} /></mesh>
            {lights && <mesh position={[0, 0, 0.05]} material={HALO}><sphereGeometry args={[0.13, 20, 14]} /></mesh>}
        </group>)}
        {<group position={[0.34, 2.17, -0.66]} visible>
            <mesh position={[0, 0.02, 0]} material={MAT.dark}><cylinderGeometry args={[0.06, 0.06, 0.03, 16]} /></mesh>
            <mesh ref={beaconRef} position={[0, 0.09, 0]} material={beacon ? beaconMat : MAT.beaconOff}><cylinderGeometry args={[0.045, 0.05, 0.11, 16]} /></mesh>
        </group>}
        {lights && <LightPools />}
        {/* koła */}
        <Part id="front">
            <Wheel r={FL.frontR} w={0.24} x={FL.frontX} z={FL.frontZ} spin={spin} />
            <Wheel r={FL.frontR} w={0.24} x={-FL.frontX} z={FL.frontZ} spin={spin} damaged={defects.tyre} />
            {[-FL.frontX, FL.frontX].map(x => <mesh key={x} position={[x, FL.frontR + 0.02, FL.frontZ]} rotation={[0, 0, Math.PI / 2]} castShadow material={MAT.dark}><cylinderGeometry args={[FL.frontR + 0.05, FL.frontR + 0.05, 0.26, 24, 1, true, Math.PI * 0.05, Math.PI * 0.9]} /></mesh>)}
        </Part>
        {mk("front", [-0.64, FL.frontR, FL.frontZ])}
        <Part id="steer">
            <Wheel r={FL.rearR} w={0.2} x={FL.rearX} z={FL.rearZ} spin={spin} />
            <Wheel r={FL.rearR} w={0.2} x={-FL.rearX} z={FL.rearZ} spin={spin} />
            <mesh position={[0, FL.rearR, FL.rearZ]} rotation={[0, 0, Math.PI / 2]} castShadow material={MAT.steel2}><cylinderGeometry args={[0.05, 0.05, 0.74, 12]} /></mesh>
            <mesh position={[0, FL.rearR + 0.02, FL.rearZ]} castShadow material={MAT.dark}><boxGeometry args={[0.3, 0.12, 0.16]} /></mesh>
        </Part>
        {mk("steer", [-0.6, FL.rearR, FL.rearZ])}
        {/* siłowniki pochylania */}
        <Part id="tilt">
            {[-0.4, 0.4].map(x => <group key={x}>
                <mesh position={[x, 0.95, 0.66]} rotation={[0.9 - tilt * 0.02, 0, 0]} castShadow material={MAT.steel2}><cylinderGeometry args={[0.038, 0.038, 0.3, 14]} /></mesh>
                <mesh position={[x, 1.04, 0.78]} rotation={[0.9 - tilt * 0.02, 0, 0]} castShadow material={MAT.steel}><cylinderGeometry args={[0.02, 0.02, 0.22, 10]} /></mesh>
            </group>)}
        </Part>
        {mk("tilt", [-0.46, 1.0, 0.7])}
        {defects.leak && <group>
            {([[0.1, 0.95, 0.26], [0.28, 0.82, 0.16], [-0.05, 1.08, 0.13], [0.2, 1.12, 0.1], [-0.3, 0.78, 0.09]] as const).map(([x, z, r], i) => (
                <mesh key={i} position={[x, 0.003 + i * 0.0004, z]} rotation={[-Math.PI / 2, 0, 0]} material={DMG.oil}><circleGeometry args={[r, 28]} /></mesh>))}
            <mesh position={[-0.4, 0.86, 0.6]} rotation={[0.9, 0, 0]} material={DMG.oil}><cylinderGeometry args={[0.041, 0.041, 0.2, 14, 1, true, Math.PI, Math.PI]} /></mesh>
            <mesh position={[-0.4, 0.5, 0.56]} material={DMG.oil}><boxGeometry args={[0.012, 0.5, 0.012]} /></mesh>
        </group>}
        {/* maszt: obrót wokół dolnego mocowania */}
        <group position={[0, FL.mastY, FL.mastZ]} rotation={[tilt * Math.PI / 180, 0, 0]}>
            <Part id="mast">
                {/* stopień 1 (zewnętrzny) */}
                {[-1, 1].map(s => <group key={s} position={[s * stageW[0], 1.02, 0]}>
                    <mesh castShadow material={MAT.steel}><boxGeometry args={[0.07, 2.08, 0.13]} /></mesh>
                    <mesh position={[-s * 0.045, 0, 0]} material={MAT.dark}><boxGeometry args={[0.02, 2.06, 0.1]} /></mesh>
                </group>)}
                {[0.12, 1.2, 2.04].map(y => <mesh key={y} position={[0, y, -0.03]} castShadow material={MAT.steel}><boxGeometry args={[stageW[0] * 2 + 0.06, 0.08, 0.07]} /></mesh>)}
                <mesh position={[0, 0.9, -0.06]} castShadow material={MAT.steel2}><cylinderGeometry args={[0.045, 0.045, 1.6, 16]} /></mesh>
                <mesh position={[0, 1.55 + e1 * 0.5, -0.06]} castShadow material={MAT.steel}><cylinderGeometry args={[0.028, 0.028, 0.9 + e1, 12]} /></mesh>
                {/* stopień 2 */}
                {mast !== "simplex" && <group position={[0, e1, 0.06]}>
                    {[-1, 1].map(s => <mesh key={s} position={[s * stageW[1], 1.06, 0]} castShadow material={MAT.steel}><boxGeometry args={[0.06, 2.0, 0.1]} /></mesh>)}
                    <mesh position={[0, 2.03, 0]} castShadow material={MAT.steel}><boxGeometry args={[stageW[1] * 2 + 0.05, 0.07, 0.08]} /></mesh>
                    {[0.2].map(y => <mesh key={y} position={[0, y, 0]} castShadow material={MAT.steel}><boxGeometry args={[stageW[1] * 2 + 0.05, 0.06, 0.06]} /></mesh>)}
                </group>}
                {/* stopień 3 */}
                {mast === "triplex" && <group position={[0, e2, 0.11]}>
                    {[-1, 1].map(s => <mesh key={s} position={[s * stageW[2], 1.06, 0]} castShadow material={MAT.steel}><boxGeometry args={[0.05, 2.0, 0.08]} /></mesh>)}
                    <mesh position={[0, 2.03, 0]} castShadow material={MAT.steel}><boxGeometry args={[stageW[2] * 2 + 0.04, 0.06, 0.07]} /></mesh>
                </group>}
            </Part>
            {mk("mast", [-stageW[0] - 0.08, 1.75, 0])}
            {/* łańcuchy: od górnej belki najwyższego stopnia do karetki */}
            <Part id="chain">
                {[-0.12, 0.12].map(x => {
                    const topY = (mast === "triplex" ? e2 : mast === "duplex" ? e1 : 0) + 2.0, botY = carY + 0.3, h = Math.max(0.05, topY - botY);
                    // luźny łańcuch: wybrzuszony do przodu zamiast napiętego w linii
                    const slack = defects.chain && x < 0, bow = 0.2;
                    return <group key={x}>
                        {slack ? <SlackChain x={x} top={topY} bot={botY} bow={bow} /> : <mesh position={[x, botY + h / 2, 0.17]} material={MAT.fork}><boxGeometry args={[0.035, h, 0.016]} /></mesh>}
                        <mesh position={[x, topY + 0.02, 0.15]} rotation={[0, 0, Math.PI / 2]} material={MAT.steel}><cylinderGeometry args={[0.045, 0.045, 0.04, 16]} /></mesh>
                    </group>;
                })}
            </Part>
            {mk("chain", [0.12, Math.max(carY + 0.6, 1.3), 0.2])}
            {/* karetka, krata oporowa i widły */}
            <group position={[shiftX, carY, 0.2]}>
                <Part id="carriage">
                    <mesh position={[0, 0.25, 0]} castShadow material={MAT.fork}><boxGeometry args={[0.92, 0.42, 0.06]} /></mesh>
                    {[0.08, 0.42].map(y => <mesh key={y} position={[0, y, 0.035]} castShadow material={MAT.dark}><boxGeometry args={[0.96, 0.07, 0.02]} /></mesh>)}
                    {side && <>
                        <mesh position={[0, 0.25, -0.05]} castShadow material={MAT.steel2}><boxGeometry args={[0.98, 0.36, 0.04]} /></mesh>
                        <mesh position={[0, 0.14, 0.07]} rotation={[0, 0, Math.PI / 2]} castShadow material={MAT.steel}><cylinderGeometry args={[0.035, 0.035, 0.7, 14]} /></mesh>
                    </>}
                </Part>
                {mk("carriage", [-0.5, 0.25, 0.04])}
                {!clamp && <Part id="lsg">
                    {[-0.42, -0.21, 0, 0.21, 0.42].map(x => <mesh key={x} position={[x, 0.75, 0]} castShadow material={MAT.fork}><boxGeometry args={[0.03, 0.6, 0.03]} /></mesh>)}
                    <mesh position={[0, 1.05, 0]} castShadow material={MAT.fork}><boxGeometry args={[0.92, 0.04, 0.04]} /></mesh>
                    <mesh position={[0, 0.78, 0]} castShadow material={MAT.fork}><boxGeometry args={[0.92, 0.025, 0.025]} /></mesh>
                </Part>}
                {!clamp && mk("lsg", [0.3, 0.92, 0.04])}
                {!clamp && !bin && <Part id="forks">
                    {[-0.25, 0.25].map(x => {
                        const bent = defects.fork && x < 0;
                        return <group key={x} position={[x, 0, 0.04]}>
                            <mesh position={[0, 0.24, 0]} castShadow material={MAT.fork}><boxGeometry args={[0.1, 0.5, 0.045]} /></mesh>
                            {/* zgięta widła: ostrze opada od nasady, rysa w kolanie */}
                            <group position={[0, 0.02, 0]} rotation={[bent ? 0.09 : 0, 0, 0]}>
                                <mesh position={[0, 0, FL.forkLen / 2]} castShadow material={MAT.fork}><boxGeometry args={[0.1, 0.045, FL.forkLen]} /></mesh>
                                <mesh position={[0, 0, FL.forkLen + 0.01]} rotation={[Math.PI / 2, 0, 0]} material={MAT.fork}><cylinderGeometry args={[0.05, 0.05, 0.02, 4, 1, false, Math.PI / 4]} /></mesh>
                                {ext && <mesh position={[0, 0.015, 1.0]} castShadow material={MAT.steel2}><boxGeometry args={[0.12, 0.07, 1.8]} /></mesh>}
                                {bent && <mesh position={[0, 0, 0.5]} material={DMG.rust}><boxGeometry args={[0.102, 0.047, 0.22]} /></mesh>}
                            </group>
                            {bent && <>
                                <mesh position={[0, 0.03, 0.045]} rotation={[0.6, 0, 0]} material={DMG.crack}><boxGeometry args={[0.104, 0.006, 0.05]} /></mesh>
                                <mesh position={[-0.0525, 0.06, 0.03]} rotation={[0.3, 0, 0]} material={DMG.crack}><boxGeometry args={[0.004, 0.09, 0.006]} /></mesh>
                            </>}
                        </group>;
                    })}
                </Part>}
                {!clamp && !bin && mk("forks", [0.25, 0.08, ext ? 1.6 : 1.0])}
                {clamp && <Part id="carriage">
                    {[-1, 1].map(s => <group key={s} position={[s * 0.62, 0.55, 0.62]}>
                        <mesh castShadow material={MAT.steel2}><boxGeometry args={[0.04, 1.1, 1.15]} /></mesh>
                        <mesh position={[-s * 0.03, 0, 0]} castShadow material={MAT.hose}><boxGeometry args={[0.02, 1.05, 1.1]} /></mesh>
                        <mesh position={[0, 0.15, -0.6]} castShadow material={MAT.steel}><boxGeometry args={[0.08, 0.12, 0.12]} /></mesh>
                    </group>)}
                    <mesh position={[0, 0.7, 0.03]} rotation={[0, 0, Math.PI / 2]} castShadow material={MAT.steel}><cylinderGeometry args={[0.04, 0.04, 1.2, 14]} /></mesh>
                </Part>}
                {clamp && <group position={[0, 0.02, 0.62]}><Cartons w={1.18} d={1.1} rows={3} /></group>}
                {bin && <group position={[0, 0.02, 0.7]}>
                    <mesh position={[0, 0.06, 0]} castShadow material={MAT.bin}><boxGeometry args={[1.0, 0.06, 1.1]} /></mesh>
                    {[-0.5, 0.5].map(x => <mesh key={x} position={[x, 0.36, 0]} castShadow material={MAT.bin}><boxGeometry args={[0.04, 0.6, 1.1]} /></mesh>)}
                    <mesh position={[0, 0.36, -0.55]} castShadow material={MAT.bin}><boxGeometry args={[1.0, 0.6, 0.04]} /></mesh>
                    <mesh position={[0, 0.25, 0.6]} rotation={[0.5, 0, 0]} castShadow material={MAT.bin}><boxGeometry args={[1.0, 0.04, 0.5]} /></mesh>
                    <mesh position={[0, 0.66, -0.48]} material={MAT.dark}><boxGeometry args={[0.6, 0.04, 0.06]} /></mesh>
                </group>}
                {!clamp && !bin && load === "pallet" && <group position={[0, loadY, 0.64 + loadZ]} rotation={[loadPitch, 0, 0]}><Pallet />{loadSlot}</group>}
                {!clamp && !bin && load === "long" && <group position={[0, 0.07, ext ? 1.0 : 0.64]}><Lumber />{loadSlot}</group>}
                {children}
            </group>
        </group>
    </group>;
});
