/**
 * Proceduralne modele bauart wózków (moduł 2.2): reach, wózek wysokiego podnoszenia z dyszlem, „Ameise”,
 * wózek do wąskich alejek z kabiną, ładowarka teleskopowa. Każdy pokazuje ruch, który go wyróżnia.
 * Czołowy = Forklift3D. Bez zewnętrznych plików.
 */
import { useReducer, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { Forklift3D, MAT, Pallet } from "./Forklift3D";
import { Stage3D, View } from "./Stage3D";
import type { TruckType } from "../forklift";

const wave = (t: number, period: number) => 0.5 - 0.5 * Math.cos((t % period) / period * Math.PI * 2);

function Wheel({ r, w, pos }: { r: number; w: number; pos: [number, number, number] }) {
    return <group position={pos}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={MAT.tire}><cylinderGeometry args={[r, r, w, 28]} /></mesh>
        <mesh position={[Math.sign(pos[0] || 1) * (w / 2 + 0.005), 0, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT.rim}><cylinderGeometry args={[r * 0.55, r * 0.55, 0.01, 20]} /></mesh>
    </group>;
}
function Tiller({ pos, angle }: { pos: [number, number, number]; angle: number }) {
    return <group position={pos} rotation={[-angle, 0, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow material={MAT.dark}><cylinderGeometry args={[0.025, 0.025, 1.0, 10]} /></mesh>
        <RoundedBox args={[0.34, 0.08, 0.12]} radius={0.03} position={[0, 1.02, 0]} castShadow material={MAT.dark} />
        {[-0.19, 0.19].map(x => <mesh key={x} position={[x, 1.02, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT.body}><cylinderGeometry args={[0.03, 0.03, 0.08, 10]} /></mesh>)}
    </group>;
}

/* ───────── modele ───────── */
function Reach() {
    const mast = useRef<THREE.Group>(null!), lift = useRef(0);
    useFrame(({ clock }) => {
        const t = clock.elapsedTime, k = wave(t, 6);
        mast.current.position.z = 0.25 + 0.75 * Math.min(1, k * 1.6);        // maszt wysuwa się do przodu po ramionach
        lift.current = 0.15 + 1.4 * Math.max(0, k * 1.6 - 0.6);
    });
    return <group>
        <RoundedBox args={[1.1, 1.1, 0.95]} radius={0.08} position={[0, 0.65, -0.45]} castShadow material={MAT.body} />
        <RoundedBox args={[1.12, 0.3, 1.0]} radius={0.06} position={[0, 0.25, -0.45]} castShadow material={MAT.dark} />
        {/* stanowisko boczne i dach */}
        <RoundedBox args={[0.5, 0.1, 0.45]} radius={0.04} position={[0.2, 1.05, -0.35]} castShadow material={MAT.seat} />
        {[[-0.5, -0.85], [0.5, -0.85], [-0.5, 0.0], [0.5, 0.0]].map(([x, z], i) => <mesh key={i} position={[x, 1.55, z]} castShadow material={MAT.dark}><boxGeometry args={[0.05, 0.9, 0.05]} /></mesh>)}
        <mesh position={[0, 2.02, -0.42]} castShadow material={MAT.dark}><boxGeometry args={[1.08, 0.05, 0.95]} /></mesh>
        {/* ramiona z kołami nośnymi */}
        {[-0.48, 0.48].map(x => <group key={x}>
            <mesh position={[x, 0.12, 0.55]} castShadow material={MAT.dark}><boxGeometry args={[0.14, 0.16, 1.3]} /></mesh>
            <Wheel r={0.1} w={0.1} pos={[x, 0.1, 1.1]} />
        </group>)}
        <Wheel r={0.17} w={0.16} pos={[0, 0.17, -0.7]} />
        <group ref={mast} position={[0, 0.18, 0.25]}>
            <MastLift lift={lift} />
        </group>
    </group>;
}
/** Maszt czytający wysokość z refa (bez ponownego renderu Reacta). */
function MastLift({ lift, height = 2.1, forkLen = 1.1, load = true }: { lift: React.MutableRefObject<number>; height?: number; forkLen?: number; load?: boolean }) {
    const car = useRef<THREE.Group>(null!), inner = useRef<THREE.Group>(null!);
    useFrame(() => { car.current.position.y = lift.current; inner.current.position.y = Math.max(0, lift.current + 0.6 - height); });
    const width = 0.7;
    return <group>
        {[-1, 1].map(s => <mesh key={s} position={[s * width / 2, height / 2, 0]} castShadow material={MAT.steel}><boxGeometry args={[0.07, height, 0.11]} /></mesh>)}
        <mesh position={[0, height - 0.04, -0.02]} castShadow material={MAT.steel}><boxGeometry args={[width + 0.06, 0.07, 0.07]} /></mesh>
        <group ref={inner} position={[0, 0, 0.07]}>
            {[-1, 1].map(s => <mesh key={s} position={[s * (width / 2 - 0.07), height / 2, 0]} castShadow material={MAT.steel}><boxGeometry args={[0.06, height, 0.09]} /></mesh>)}
            <mesh position={[0, height - 0.04, 0]} castShadow material={MAT.steel}><boxGeometry args={[width - 0.1, 0.06, 0.06]} /></mesh>
        </group>
        <group ref={car} position={[0, 0, 0.16]}>
            <mesh position={[0, 0.22, 0]} castShadow material={MAT.fork}><boxGeometry args={[width + 0.1, 0.4, 0.05]} /></mesh>
            {[-0.22, 0.22].map(x => <group key={x} position={[x, 0, 0.03]}>
                <mesh position={[0, 0.22, 0]} castShadow material={MAT.fork}><boxGeometry args={[0.09, 0.44, 0.04]} /></mesh>
                <mesh position={[0, 0.02, forkLen / 2]} castShadow material={MAT.fork}><boxGeometry args={[0.09, 0.04, forkLen]} /></mesh>
            </group>)}
            {load && <group position={[0, 0.045, 0.62]}><Pallet /></group>}
        </group>
    </group>;
}
function HighLift() {
    const lift = useRef(0.1);
    useFrame(({ clock }) => { lift.current = 0.1 + 1.3 * wave(clock.elapsedTime, 5); });
    return <group>
        <RoundedBox args={[0.8, 1.0, 0.6]} radius={0.06} position={[0, 0.58, -0.45]} castShadow material={MAT.body} />
        <RoundedBox args={[0.82, 0.2, 0.62]} radius={0.05} position={[0, 0.12, -0.45]} castShadow material={MAT.dark} />
        <Tiller pos={[0, 1.05, -0.78]} angle={0.55} />
        {[-0.3, 0.3].map(x => <group key={x}>
            <mesh position={[x, 0.07, 0.55]} castShadow material={MAT.dark}><boxGeometry args={[0.12, 0.1, 1.2]} /></mesh>
            <Wheel r={0.06} w={0.08} pos={[x, 0.06, 1.05]} />
        </group>)}
        <Wheel r={0.12} w={0.1} pos={[0, 0.12, -0.55]} />
        <group position={[0, 0.1, -0.08]}><MastLift lift={lift} height={1.9} forkLen={1.15} /></group>
    </group>;
}
function LowLift() {
    const tiller = useRef<THREE.Group>(null!), forks = useRef<THREE.Group>(null!), body = useRef<THREE.Group>(null!);
    useFrame(({ clock }) => {
        const t = clock.elapsedTime;
        forks.current.position.y = 0.04 + 0.08 * wave(t, 3);            // niski skok: tylko odrywa paletę od podłoża
        tiller.current.rotation.x = -0.75 + 0.35 * Math.sin(t * 0.9);
        body.current.position.z = Math.sin(t * 0.5) * 0.4;
    });
    return <group ref={body}>
        <RoundedBox args={[0.7, 0.75, 0.45]} radius={0.06} position={[0, 0.45, -0.3]} castShadow material={MAT.body} />
        <RoundedBox args={[0.72, 0.18, 0.47]} radius={0.05} position={[0, 0.1, -0.3]} castShadow material={MAT.dark} />
        <group ref={tiller} position={[0, 0.82, -0.48]}>
            <mesh position={[0, 0.5, 0]} castShadow material={MAT.dark}><cylinderGeometry args={[0.025, 0.025, 1.0, 10]} /></mesh>
            <RoundedBox args={[0.34, 0.08, 0.12]} radius={0.03} position={[0, 1.02, 0]} castShadow material={MAT.dark} />
        </group>
        <Wheel r={0.11} w={0.09} pos={[0, 0.11, -0.38]} />
        <group ref={forks} position={[0, 0.04, -0.06]}>
            {[-0.25, 0.25].map(x => <group key={x}>
                <mesh position={[x, 0.03, 0.6]} castShadow material={MAT.fork}><boxGeometry args={[0.16, 0.06, 1.2]} /></mesh>
                <Wheel r={0.04} w={0.07} pos={[x, -0.0, 1.1]} />
            </group>)}
            <group position={[0, 0.06, 0.65]}><Pallet /></group>
        </group>
    </group>;
}
function NarrowAisle() {
    const cab = useRef<THREE.Group>(null!), head = useRef<THREE.Group>(null!), inner = useRef<THREE.Group>(null!);
    useFrame(({ clock }) => {
        const t = clock.elapsedTime, k = wave(t, 8);
        const h = 2.6 * Math.min(1, k * 1.5);
        cab.current.position.y = 0.35 + h;                              // kabina jedzie w górę razem z ładunkiem
        inner.current.position.y = Math.max(0, h - 0.6);
        head.current.rotation.y = Math.PI / 2 * Math.max(0, Math.min(1, k * 2.4 - 1.4)); // głowica obraca widły w bok
    });
    return <group>
        <RoundedBox args={[1.2, 0.7, 2.0]} radius={0.08} position={[0, 0.42, -0.4]} castShadow material={MAT.body} />
        <RoundedBox args={[1.22, 0.24, 2.02]} radius={0.05} position={[0, 0.14, -0.4]} castShadow material={MAT.dark} />
        {[-0.55, 0.55].flatMap(x => [-1.1, 0.5].map(z => <Wheel key={`${x}${z}`} r={0.16} w={0.14} pos={[x, 0.16, z]} />))}
        {/* wysoki maszt */}
        <group position={[0, 0.7, 0.5]}>
            {[-0.4, 0.4].map(x => <mesh key={x} position={[x, 1.6, 0]} castShadow material={MAT.steel}><boxGeometry args={[0.1, 3.2, 0.14]} /></mesh>)}
            <group ref={inner}>{[-0.32, 0.32].map(x => <mesh key={x} position={[x, 1.6, 0.1]} castShadow material={MAT.steel}><boxGeometry args={[0.08, 3.2, 0.1]} /></mesh>)}</group>
        </group>
        <group ref={cab} position={[0, 0.35, 0.75]}>
            {/* kabina operatora */}
            <RoundedBox args={[1.0, 0.12, 0.9]} radius={0.03} position={[0, 0.06, 0.2]} castShadow material={MAT.dark} />
            {[[-0.48, -0.2], [0.48, -0.2], [-0.48, 0.62], [0.48, 0.62]].map(([x, z], i) => <mesh key={i} position={[x, 1.0, z]} castShadow material={MAT.dark}><boxGeometry args={[0.04, 1.9, 0.04]} /></mesh>)}
            <mesh position={[0, 1.95, 0.2]} castShadow material={MAT.dark}><boxGeometry args={[1.0, 0.05, 0.9]} /></mesh>
            {[0.5, 0.95].map(y => <mesh key={y} position={[0, y, 0.62]} material={MAT.belt}><boxGeometry args={[0.98, 0.04, 0.04]} /></mesh>)}
            <group position={[0, 0.12, 0.25]}><HumanStub /></group>
            {/* głowica obrotowa z widłami */}
            <group position={[0, 0.0, 0.85]}>
                <mesh position={[0, 0.3, 0]} castShadow material={MAT.steel2}><boxGeometry args={[0.5, 0.5, 0.15]} /></mesh>
                <group ref={head} position={[0, 0, 0.1]}>
                    <mesh position={[0, 0.25, 0.04]} castShadow material={MAT.fork}><boxGeometry args={[0.8, 0.4, 0.05]} /></mesh>
                    {[-0.22, 0.22].map(x => <mesh key={x} position={[x, 0.04, 0.6]} castShadow material={MAT.fork}><boxGeometry args={[0.09, 0.04, 1.1]} /></mesh>)}
                    <group position={[0, 0.06, 0.65]}><Pallet /></group>
                </group>
            </group>
        </group>
    </group>;
}
function HumanStub() {
    const skin = MAT.plate;
    return <group>
        <mesh position={[0, 0.9, 0]} castShadow material={MAT.dark}><capsuleGeometry args={[0.16, 0.5, 6, 12]} /></mesh>
        <mesh position={[0, 0.45, 0]} castShadow material={MAT.dark}><capsuleGeometry args={[0.12, 0.5, 6, 12]} /></mesh>
        <mesh position={[0, 1.42, 0]} castShadow material={skin}><sphereGeometry args={[0.12, 16, 12]} /></mesh>
        <mesh position={[0, 1.47, 0]} material={MAT.belt}><sphereGeometry args={[0.13, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
    </group>;
}
function Telehandler() {
    const boom = useRef<THREE.Group>(null!), ext = useRef<THREE.Group>(null!), head = useRef<THREE.Group>(null!);
    useFrame(({ clock }) => {
        const k = wave(clock.elapsedTime, 7);
        const a = 0.05 + 0.65 * k;                                       // ramię podnosi się i wysuwa
        boom.current.rotation.x = -a;
        ext.current.position.z = 1.4 * k;
        head.current.rotation.x = a;                                     // widły zostają poziomo
    });
    return <group>
        <RoundedBox args={[1.9, 0.7, 4.0]} radius={0.1} position={[0, 0.85, 0]} castShadow material={MAT.body} />
        {[-0.95, 0.95].flatMap(x => [-1.3, 1.3].map(z => <Wheel key={`${x}${z}`} r={0.55} w={0.42} pos={[x, 0.55, z]} />))}
        {/* kabina z lewej */}
        <RoundedBox args={[0.9, 1.5, 1.4]} radius={0.06} position={[-0.6, 1.95, -0.1]} castShadow material={MAT.dark} />
        <mesh position={[-0.6, 2.0, 0.61]}><boxGeometry args={[0.8, 1.1, 0.02]} /><meshStandardMaterial color="#9fc3d9" roughness={0.1} metalness={0.3} transparent opacity={0.55} /></mesh>
        {/* ramię teleskopowe z tyłu po prawej */}
        <group ref={boom} position={[0.35, 1.45, -1.6]}>
            <mesh position={[0, 0, 1.8]} castShadow material={MAT.body}><boxGeometry args={[0.45, 0.45, 3.6]} /></mesh>
            <group ref={ext}>
                <mesh position={[0, 0, 3.0]} castShadow material={MAT.steel2}><boxGeometry args={[0.34, 0.34, 2.6]} /></mesh>
                <group ref={head} position={[0, -0.1, 4.3]}>
                    <mesh position={[0, 0, 0]} castShadow material={MAT.fork}><boxGeometry args={[1.0, 0.5, 0.06]} /></mesh>
                    {[-0.3, 0.3].map(x => <mesh key={x} position={[x, -0.23, 0.6]} castShadow material={MAT.fork}><boxGeometry args={[0.1, 0.05, 1.2]} /></mesh>)}
                    <group position={[0, -0.2, 0.65]}><Pallet /></group>
                </group>
            </group>
        </group>
    </group>;
}
function Front() {
    const v = useRef(0.15);
    const [, set] = useStateTick();
    useFrame(({ clock }) => { const l = 0.15 + 1.4 * wave(clock.elapsedTime, 6); if (Math.abs(v.current - l) > 0.01) { v.current = l; set(); } });
    return <Forklift3D lift={v.current} tilt={-2} load="pallet" mast="duplex" />;
}
function useStateTick() { return useReducer((n: number) => n + 1, 0); }

const MODELS: Record<TruckType, () => JSX.Element> = { front: Front, reach: Reach, highlift: HighLift, lowlift: LowLift, vna: NarrowAisle, picker: NarrowAisle, tele: Telehandler };
const VIEWS: Record<TruckType, View> = {
    front: { pos: [-4.6, 2.4, 3.4], target: [0, 1.1, 0.4] },
    reach: { pos: [-4.4, 2.4, 3.6], target: [0, 1.0, 0.3] },
    highlift: { pos: [-3.8, 2.0, 3.2], target: [0, 0.8, 0.3] },
    lowlift: { pos: [-3.0, 1.6, 2.6], target: [0, 0.4, 0.3] },
    vna: { pos: [-8.2, 4.4, 6.6], target: [0, 2.2, 0.5] },
    picker: { pos: [-8.2, 4.4, 6.6], target: [0, 2.2, 0.5] },
    tele: { pos: [-7.2, 3.8, 6.2], target: [0, 1.5, 0.9] },
};
export function TruckStage({ type, label, hint, className = "" }: { type: TruckType; label: string; hint?: string; className?: string }) {
    const M = MODELS[type];
    return <Stage3D view={VIEWS[type]} label={label} hint={hint} className={`s3d-truck ${className}`} zoom={false} autoRotate maxDist={20} minDist={2}>
        <M />
    </Stage3D>;
}
