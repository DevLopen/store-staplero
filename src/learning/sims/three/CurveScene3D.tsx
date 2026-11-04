/**
 * Scena 3D do lekcji 4.2: wózek jedzie po zakręcie w hali, przy zbyt dużej prędkości przewraca się na zewnątrz łuku.
 * Na posadzce pod wózkiem rysujemy trójkąt stateczności i rzut środka ciężkości.
 */
import { useEffect, useMemo, useReducer, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { FL, Forklift3D, Pallet } from "./Forklift3D";

export type CurveRun = { id: number; kmh: number; radius: number; load: "empty" | "low" | "high"; ratio: number; tips: boolean } | null;
export type CurveView = "chase" | "top";
type Props = {
    radius: number; load: "empty" | "low" | "high"; run: CurveRun; view: CurveView; restTipped: { s: number } | null;
    onLive: (ratio: number) => void; onDone: (tipped: boolean, s: number) => void;
};

const L1 = 7, L2 = 9, LANE = 3.4, TIP_END = Math.PI / 2;
/** Tor: prosto wzdłuż +z, łuk w stronę +x o promieniu R, prosto wzdłuż +x. s = droga w metrach. */
export function pathAt(R: number, s: number) {
    const A = Math.PI / 2 * R;
    if (s <= L1) return { x: 0, z: s - L1, yaw: 0, inArc: 0, arc: 0 };
    if (s <= L1 + A) { const t = (s - L1) / R; return { x: R - R * Math.cos(t), z: R * Math.sin(t), yaw: t, inArc: (s - L1) / A, arc: 1 }; }
    return { x: R + (s - L1 - A), z: R, yaw: Math.PI / 2, inArc: 1, arc: 0 };
}
export const pathLen = (R: number) => L1 + Math.PI / 2 * R + L2;

/* ───────── posadzka hali ───────── */
function useConcrete() {
    return useMemo(() => {
        const c = document.createElement("canvas"); c.width = c.height = 512;
        const g = c.getContext("2d")!;
        g.fillStyle = "#c4c0b8"; g.fillRect(0, 0, 512, 512);
        const img = g.getImageData(0, 0, 512, 512);
        for (let i = 0; i < img.data.length; i += 4) { const n = (Math.random() - 0.5) * 18; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n; }
        g.putImageData(img, 0, 0);
        for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(90,85,78,${Math.random() * 0.05})`; g.beginPath(); g.ellipse(Math.random() * 512, Math.random() * 512, 20 + Math.random() * 80, 10 + Math.random() * 50, Math.random() * 3, 0, Math.PI * 2); g.fill(); }
        g.strokeStyle = "rgba(70,66,60,.35)"; g.lineWidth = 2; g.strokeRect(1, 1, 510, 510);
        const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(16, 16); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
        return t;
    }, []);
}

/** Płaski pas wzdłuż toru przesunięty o `off` metrów w bok (dodatnio = na zewnątrz łuku = lokalne -x). */
function stripGeometry(R: number, off: number, width: number, from = -2, to?: number, dash = 0) {
    const end = to ?? pathLen(R) + 6, pos: number[] = [], idx: number[] = [];
    const step = 0.12; let n = 0;
    for (let s = from; s <= end; s += step) {
        if (dash && Math.floor(s / dash) % 2 === 1) { n = -1; continue; }
        const p = pathAt(R, Math.min(Math.max(s, -10), pathLen(R) + 20));
        const x = p.x, z = p.z;
        const nx = -Math.cos(p.yaw), nz = Math.sin(p.yaw);           // normalna na zewnątrz
        const a = off - width / 2, b = off + width / 2;
        pos.push(x + nx * a, 0, z + nz * a, x + nx * b, 0, z + nz * b);
        const i = pos.length / 3 - 2;
        if (n >= 0 && i >= 2) idx.push(i - 2, i - 1, i, i - 1, i + 1, i);
        n = 0;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
}

function Lanes({ R }: { R: number }) {
    const geos = useMemo(() => ({
        a: stripGeometry(R, LANE / 2, 0.12), b: stripGeometry(R, -LANE / 2, 0.12), mid: stripGeometry(R, 0, 0.06, -2, undefined, 0.9),
        lane: stripGeometry(R, 0, LANE),
    }), [R]);
    useEffect(() => () => Object.values(geos).forEach(g => g.dispose()), [geos]);
    return <group position={[0, 0.004, 0]}>
        <mesh geometry={geos.lane} receiveShadow><meshStandardMaterial color="#bdb9b2" roughness={0.9} transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} /></mesh>
        <mesh geometry={geos.a} position={[0, 0.002, 0]}><meshStandardMaterial color="#f2b705" roughness={0.6} side={THREE.DoubleSide} /></mesh>
        <mesh geometry={geos.b} position={[0, 0.002, 0]}><meshStandardMaterial color="#f2b705" roughness={0.6} side={THREE.DoubleSide} /></mesh>
        <mesh geometry={geos.mid} position={[0, 0.002, 0]}><meshStandardMaterial color="#ffffff" roughness={0.6} transparent opacity={0.8} side={THREE.DoubleSide} /></mesh>
    </group>;
}

/* ───────── regały (kontekst i skala) ───────── */
function Rack({ position, rotation = 0, bays = 3 }: { position: [number, number, number]; rotation?: number; bays?: number }) {
    const up = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1f4f8f", roughness: 0.5, metalness: 0.4 }), []);
    const beam = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f47a0b", roughness: 0.45, metalness: 0.3 }), []);
    const W = 2.8, D = 1.1, levels = [0.05, 1.6, 3.15];
    return <group position={position} rotation={[0, rotation, 0]}>
        {Array.from({ length: bays + 1 }, (_, i) => [-D / 2, D / 2].map(z => <mesh key={`${i}${z}`} position={[i * W, 2.3, z]} castShadow receiveShadow material={up}><boxGeometry args={[0.09, 4.6, 0.09]} /></mesh>))}
        {Array.from({ length: bays }, (_, i) => levels.map((y, l) => <group key={`${i}${l}`}>
            {[-D / 2, D / 2].map(z => <mesh key={z} position={[i * W + W / 2, y + 0.08, z]} castShadow material={beam}><boxGeometry args={[W - 0.09, 0.12, 0.06]} /></mesh>)}
            {(i + l) % 3 !== 1 && [0.7, 2.1].map(px => <group key={px} position={[i * W + px, y + 0.14, 0]} rotation={[0, Math.PI / 2, 0]}><Pallet withLoad={(i * 3 + l + px) % 2 > 0.5} /></group>)}
        </group>))}
    </group>;
}

/* ───────── znaczniki fizyki (aktualizowane w useFrame, bez renderu Reacta) ───────── */
type OverlayState = { cog: THREE.Vector3; arrow: number; bad: boolean; show: boolean };
function Overlay({ tri, state }: { tri: THREE.BufferGeometry; state: React.MutableRefObject<OverlayState> }) {
    const g = useRef<THREE.Group>(null!), dot = useRef<THREE.Group>(null!), arr = useRef<THREE.Group>(null!), shaft = useRef<THREE.Mesh>(null!), head = useRef<THREE.Mesh>(null!);
    const mats = useMemo(() => ({
        // rysowane „przez” wózek, żeby trójkąt i punkt były widoczne także z kamery za wózkiem
        fill: new THREE.MeshBasicMaterial({ color: "#f47a0b", transparent: true, opacity: 0.3, depthWrite: false, depthTest: false, side: THREE.DoubleSide }),
        line: new THREE.LineBasicMaterial({ color: "#f47a0b", transparent: true, depthTest: false }),
        solid: new THREE.MeshBasicMaterial({ color: "#f47a0b", transparent: true, depthTest: false, side: THREE.DoubleSide }),
        ring: new THREE.MeshBasicMaterial({ color: "#f47a0b", transparent: true, opacity: 0.75, depthTest: false, side: THREE.DoubleSide }),
    }), []);
    useFrame(() => {
        const s = state.current;
        g.current.visible = s.show;
        const col = s.bad ? "#e5372a" : "#f47a0b";
        Object.values(mats).forEach(m => m.color.set(col));
        dot.current.position.set(s.cog.x, 0.016, s.cog.z);
        arr.current.visible = s.arrow > 0.05;
        arr.current.position.set(s.cog.x - 0.16, 0.03, s.cog.z);
        shaft.current.scale.set(1, Math.max(0.01, s.arrow), 1); shaft.current.position.x = -s.arrow / 2;
        head.current.position.x = -s.arrow - 0.1;
    });
    useEffect(() => { g.current.traverse(o => { o.renderOrder = 10; }); }, []);
    return <group ref={g}>
        <mesh geometry={tri} position={[0, 0.012, 0]} material={mats.fill} />
        <lineLoop geometry={tri} position={[0, 0.014, 0]} material={mats.line} />
        <group ref={dot}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} material={mats.solid}><circleGeometry args={[0.07, 24]} /></mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} material={mats.ring}><ringGeometry args={[0.1, 0.13, 32]} /></mesh>
        </group>
        <group ref={arr}>
            <mesh ref={shaft} rotation={[-Math.PI / 2, 0, Math.PI / 2]} material={mats.solid}><planeGeometry args={[0.06, 1]} /></mesh>
            <mesh ref={head} rotation={[-Math.PI / 2, 0, Math.PI / 2]} material={mats.solid}><circleGeometry args={[0.15, 3]} /></mesh>
        </group>
    </group>;
}

/* ───────── kamera ───────── */
function CameraRig({ target, view, shake }: { target: React.MutableRefObject<{ x: number; z: number; yaw: number }>; view: CurveView; shake: React.MutableRefObject<number> }) {
    const { camera } = useThree();
    const look = useRef(new THREE.Vector3());
    const first = useRef(true);
    useFrame((_, dt) => {
        const t = target.current;
        const want = new THREE.Vector3(), lookAt = new THREE.Vector3(t.x + Math.sin(t.yaw) * 1.2, 1.3, t.z + Math.cos(t.yaw) * 1.2);
        if (view === "chase") {
            // za wózkiem, nieco z boku po zewnętrznej stronie łuku, żeby było widać przechył
            // za wózkiem, lekko od wewnętrznej strony łuku: wywrotka na zewnątrz jest wtedy dobrze widoczna
            const back = 6.6, side = -1.3, up = 3.9;
            want.set(t.x - Math.sin(t.yaw) * back - Math.cos(t.yaw) * side, up, t.z - Math.cos(t.yaw) * back + Math.sin(t.yaw) * side);
        } else {
            want.set(t.x - 4.5, 14, t.z - 7.5); lookAt.set(t.x, 0, t.z);
        }
        const k = first.current ? 1 : 1 - Math.exp(-dt * 3.2);
        first.current = false;
        camera.position.lerp(want, k);
        look.current.lerp(lookAt, k);
        if (shake.current > 0) { camera.position.x += (Math.random() - 0.5) * shake.current; camera.position.y += (Math.random() - 0.5) * shake.current; shake.current *= 0.86; if (shake.current < 0.002) shake.current = 0; }
        camera.lookAt(look.current);
    });
    return null;
}

/* ───────── kurz przy uderzeniu ───────── */
function Dust({ trigger }: { trigger: React.MutableRefObject<{ t: number; p: THREE.Vector3 } | null> }) {
    const ref = useRef<THREE.InstancedMesh>(null!);
    const seeds = useMemo(() => Array.from({ length: 26 }, () => ({ a: Math.random() * Math.PI * 2, v: 0.6 + Math.random() * 1.6, up: 0.3 + Math.random() * 0.8, s: 0.12 + Math.random() * 0.22 })), []);
    const m = useMemo(() => new THREE.Matrix4(), []);
    useFrame(({ clock }) => {
        const tr = trigger.current, mesh = ref.current;
        if (!tr) { mesh.visible = false; return; }
        const e = clock.elapsedTime - tr.t;
        if (e > 1.6) { mesh.visible = false; return; }
        mesh.visible = true;
        seeds.forEach((sd, i) => {
            const r = sd.v * (1 - Math.exp(-e * 2.5)), sc = sd.s * (0.6 + e * 1.4);
            m.makeScale(sc, sc, sc).setPosition(tr.p.x + Math.cos(sd.a) * r, 0.1 + sd.up * (1 - Math.exp(-e * 2)) * 0.6, tr.p.z + Math.sin(sd.a) * r);
            mesh.setMatrixAt(i, m);
        });
        mesh.instanceMatrix.needsUpdate = true;
        (mesh.material as THREE.MeshBasicMaterial).opacity = 0.45 * Math.max(0, 1 - e / 1.6);
    });
    return <instancedMesh ref={ref} args={[undefined, undefined, seeds.length]} frustumCulled={false}><sphereGeometry args={[1, 10, 8]} /><meshBasicMaterial color="#d8d2c6" transparent depthWrite={false} /></instancedMesh>;
}

/* ───────── wózek w ruchu ───────── */
function Truck({ radius, load, run, restTipped, onLive, onDone, target, shake, dust }: Omit<Props, "view"> & {
    target: React.MutableRefObject<{ x: number; z: number; yaw: number }>; shake: React.MutableRefObject<number>; dust: React.MutableRefObject<{ t: number; p: THREE.Vector3 } | null>;
}) {
    const root = useRef<THREE.Group>(null!), rollG = useRef<THREE.Group>(null!), body = useRef<THREE.Group>(null!);
    const palletAnchor = useRef<THREE.Group>(null!), fall = useRef<THREE.Group>(null!);
    const spin = useRef(0);
    const loaded = load !== "empty", lift = load === "high" ? 1.85 : 0.15;
    const st = useRef({ s: 0, roll: 0, rollV: 0, tipping: false, tipS: 0, done: true, slide: 0, dropT: 0, fallV: new THREE.Vector3(), fallW: 0, fell: false, live: 0, cogOff: 0 });
    // trójkąt stateczności i środek ciężkości w lokalnym układzie wózka
    const cogZ = loaded ? (load === "high" ? 0.05 : -0.05) : -0.47;
    const half = (z: number) => FL.frontX * (z - FL.rearZ) / (FL.frontZ - FL.rearZ);
    const tri = useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(FL.frontX, 0, FL.frontZ), new THREE.Vector3(-FL.frontX, 0, FL.frontZ), new THREE.Vector3(0, 0, FL.rearZ)]).setIndex([0, 1, 2]), []);
    const overlay = useRef<OverlayState>({ cog: new THREE.Vector3(0, 0, cogZ), arrow: 0, bad: false, show: true });
    const [, force] = useForce();

    // nowy przejazd lub reset
    useEffect(() => {
        const S = st.current;
        Object.assign(S, { roll: 0, rollV: 0, tipping: false, slide: 0, fell: false, live: 0, cogOff: 0 });
        dust.current = null;
        if (run) { S.s = 0; S.done = false; }
        else if (restTipped) { S.s = restTipped.s; S.done = true; S.roll = TIP_END; S.tipping = false; S.fell = false; }
        else { S.s = 0; S.done = true; }
        overlay.current = { cog: new THREE.Vector3(0, 0, cogZ), arrow: 0, bad: false, show: !restTipped || !!run };
        force();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [run?.id, radius, load, restTipped?.s]);

    useFrame(({ clock }, dtRaw) => {
        const dt = Math.min(dtRaw, 1 / 30), S = st.current, R = radius;
        const scale = 1.5;                                             // lekko przyspieszony czas
        if (run && !S.done && !S.tipping) {
            const v = run.kmh / 3.6 * scale;
            S.s += v * dt; spin.current += v * dt;
            const p = pathAt(R, S.s);
            const env = p.arc ? Math.min(1, p.inArc * 6, (1 - p.inArc) * 6) : 0;
            S.live = run.ratio * env;
            S.cogOff = Math.min(S.live, 1.25);
            const targetRoll = Math.min(run.ratio, 1) * 0.07 * env;      // lekkie wychylenie na amortyzacji opon
            S.roll += (targetRoll - S.roll) * Math.min(1, dt * 8);
            if (run.tips && p.arc && p.inArc >= 0.35) { S.tipping = true; S.tipS = S.s; S.rollV = 0.6; S.slide = v * 0.6; }
            if (S.s >= pathLen(R)) { S.done = true; S.live = 0; onDone(false, 0); }
            onLive(S.live);
        } else if (S.tipping) {
            // obrót wokół zewnętrznej krawędzi: przyspieszenie rośnie z kątem (wahadło odwrócone), do leżenia na boku
            S.rollV += (4.5 + 9 * Math.sin(Math.min(S.roll, 1.2))) * dt;
            S.roll += S.rollV * dt;
            S.slide *= Math.exp(-dt * 2.2);
            S.s += S.slide * dt; spin.current += S.slide * dt;
            S.cogOff = Math.min(1.6, S.cogOff + dt * 2);
            if (loaded && !S.fell && S.roll > 0.35) {
                // paleta ześlizguje się z wideł
                S.fell = true;
                const w = new THREE.Vector3(); palletAnchor.current.getWorldPosition(w);
                const q = new THREE.Quaternion(); palletAnchor.current.getWorldQuaternion(q);
                fall.current.position.copy(w); fall.current.quaternion.copy(q);
                const p = pathAt(R, S.s), out = new THREE.Vector3(-Math.cos(p.yaw), 0, Math.sin(p.yaw));
                S.fallV.copy(out).multiplyScalar(2.6).add(new THREE.Vector3(Math.sin(p.yaw), 0.8, Math.cos(p.yaw)).multiplyScalar(S.slide * 0.6));
                S.fallW = 3.2;
                force();
            }
            if (S.roll >= TIP_END) {
                S.roll = TIP_END; S.tipping = false; S.done = true; shake.current = 0.16;
                const p = pathAt(R, S.s); dust.current = { t: clock.elapsedTime, p: new THREE.Vector3(p.x - Math.cos(p.yaw) * 1.6, 0, p.z + Math.sin(p.yaw) * 1.6) };
                onLive(run?.ratio ?? 0);
                window.setTimeout(() => onDone(true, S.s), 900);
            } else onLive(run?.ratio ?? 0);
        }
        // spadająca paleta
        if (S.fell && fall.current) {
            const f = fall.current;
            if (f.position.y > 0.02 || S.fallV.y > 0) {
                S.fallV.y -= 9.81 * dt;
                f.position.addScaledVector(S.fallV, dt);
                f.rotateOnWorldAxis(new THREE.Vector3(Math.cos(target.current.yaw), 0, -Math.sin(target.current.yaw)), -S.fallW * dt);
                if (f.position.y <= 0.02) { f.position.y = 0.02; S.fallV.set(0, 0, 0); S.fallW = 0; const e = new THREE.Euler().setFromQuaternion(f.quaternion); f.rotation.set(0, e.y, 0); }
            }
        }
        // pozycja
        const p = pathAt(R, S.s);
        root.current.position.set(p.x, 0, p.z);
        root.current.rotation.y = p.yaw;
        target.current = { x: p.x, z: p.z, yaw: p.yaw };
        // przechył wokół zewnętrznych kół (lokalne -x)
        const piv = -FL.frontX - 0.12;
        rollG.current.position.set(piv, 0, 0);
        body.current.position.set(-piv, 0, 0);
        rollG.current.rotation.z = S.roll;
        // znaczniki
        const O = overlay.current;
        O.cog.set(-S.cogOff * half(cogZ), 0, cogZ);
        O.arrow = Math.min(S.live, 1.4) * 1.1;
        O.bad = S.cogOff >= 1;
        O.show = S.roll < 0.35;
    });

    return <>
        <group ref={root}>
            <group ref={rollG}>
                <group ref={body}>
                    <Forklift3D lift={lift} tilt={load === "high" ? -2 : -4} load={loaded && !st.current.fell ? "pallet" : "none"} spin={spin}>
                        <group ref={palletAnchor} position={[0, 0.045, 0.64]} />
                    </Forklift3D>
                </group>
            </group>
            <Overlay tri={tri} state={overlay} />
        </group>
        <group ref={fall} visible={loaded && st.current.fell}><Pallet /></group>
    </>;
}

function useForce() { return useReducer((x: number) => x + 1, 0); }

/* ───────── całość ───────── */
export default function CurveScene3D(props: Props) {
    const target = useRef({ x: 0, z: -L1, yaw: 0 });
    const shake = useRef(0);
    const dust = useRef<{ t: number; p: THREE.Vector3 } | null>(null);
    const tex = useConcrete();
    const R = props.radius;
    return <Canvas shadows dpr={[1, 2]} camera={{ fov: 40, near: 0.1, far: 140, position: [-3, 4, -14] }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => { gl.shadowMap.type = THREE.PCFSoftShadowMap; }}>
        <color attach="background" args={["#dedad3"]} />
        <fog attach="fog" args={["#dedad3", 16, 42]} />
        <hemisphereLight args={["#ffffff", "#b9b2a6", 0.75]} />
        <directionalLight position={[8, 16, -6]} intensity={2.1} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03}>
            <orthographicCamera attach="shadow-camera" args={[-16, 16, 16, -16, 1, 50]} />
        </directionalLight>
        <Environment resolution={128}>
            <Lightformer intensity={2.2} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[12, 12, 1]} />
            <Lightformer intensity={1.2} position={[-8, 3, 4]} rotation={[0, Math.PI / 2, 0]} scale={[10, 3, 1]} />
            <Lightformer intensity={0.9} position={[8, 3, -4]} rotation={[0, -Math.PI / 2, 0]} scale={[10, 3, 1]} />
        </Environment>
        <group position={[0, 0, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[R / 2, 0, R / 2]} receiveShadow><planeGeometry args={[90, 90]} /><meshStandardMaterial map={tex} roughness={0.85} /></mesh>
            <Lanes R={R} />
            {/* regały po zewnętrznej stronie łuku i wzdłuż prostych */}
            <Rack position={[-LANE / 2 - 2.4, 0, -L1 - 1]} rotation={-Math.PI / 2} bays={2} />
            <Rack position={[R + 1.6, 0, R + LANE / 2 + 2.2]} rotation={0} bays={3} />
            <Rack position={[LANE / 2 + 3.2, 0, -L1 - 2]} rotation={-Math.PI / 2} bays={1} />
            {/* słupek odbojowy przy narożniku */}
            <group position={[-LANE / 2 - 0.5, 0, R + LANE / 2 + 0.5]}>
                <mesh position={[0, 0.6, 0]} castShadow><cylinderGeometry args={[0.1, 0.1, 1.2, 20]} /><meshStandardMaterial color="#f2b705" roughness={0.5} /></mesh>
                {[0.3, 0.7, 1.05].map(y => <mesh key={y} position={[0, y, 0]}><cylinderGeometry args={[0.102, 0.102, 0.12, 20]} /><meshStandardMaterial color="#1b1d20" /></mesh>)}
            </group>
            <RoundedBox args={[0.8, 0.9, 0.6]} radius={0.04} position={[R + 4, 0.45, R - LANE / 2 - 1.2]} castShadow><meshStandardMaterial color="#2f6e3b" roughness={0.6} /></RoundedBox>
            <Truck {...props} target={target} shake={shake} dust={dust} />
            <Dust trigger={dust} />
        </group>
        <CameraRig target={target} view={props.view} shake={shake} />
    </Canvas>;
}
