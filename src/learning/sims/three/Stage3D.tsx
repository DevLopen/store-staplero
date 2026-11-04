/**
 * Wspólna scena 3D dla ćwiczeń z wózkiem: posadzka hali, światło, cienie i obracanie widoku palcem lub myszą.
 * Bez zewnętrznych plików (oświetlenie otoczenia z Lightformerów).
 */
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitImpl } from "three-stdlib";
import * as THREE from "three";

export function useConcrete(repeat = 16) {
    return useMemo(() => {
        const c = document.createElement("canvas"); c.width = c.height = 512;
        const g = c.getContext("2d")!;
        g.fillStyle = "#c4c0b8"; g.fillRect(0, 0, 512, 512);
        const img = g.getImageData(0, 0, 512, 512);
        for (let i = 0; i < img.data.length; i += 4) { const n = (Math.random() - 0.5) * 18; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n; }
        g.putImageData(img, 0, 0);
        for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(90,85,78,${Math.random() * 0.05})`; g.beginPath(); g.ellipse(Math.random() * 512, Math.random() * 512, 20 + Math.random() * 80, 10 + Math.random() * 50, Math.random() * 3, 0, Math.PI * 2); g.fill(); }
        g.strokeStyle = "rgba(70,66,60,.35)"; g.lineWidth = 2; g.strokeRect(1, 1, 510, 510);
        const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
        return t;
    }, [repeat]);
}

/** Światła i otoczenie wspólne dla wszystkich scen. */
export function StudioLights({ shadowSize = 8 }: { shadowSize?: number }) {
    return <>
        <hemisphereLight args={["#ffffff", "#b9b2a6", 0.75]} />
        <directionalLight position={[6, 12, 5]} intensity={2.1} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03}>
            <orthographicCamera attach="shadow-camera" args={[-shadowSize, shadowSize, shadowSize, -shadowSize, 1, 40]} />
        </directionalLight>
        <Environment resolution={128}>
            <Lightformer intensity={2.2} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[12, 12, 1]} />
            <Lightformer intensity={1.2} position={[-8, 3, 4]} rotation={[0, Math.PI / 2, 0]} scale={[10, 3, 1]} />
            <Lightformer intensity={0.9} position={[8, 3, -4]} rotation={[0, -Math.PI / 2, 0]} scale={[10, 3, 1]} />
        </Environment>
    </>;
}

export function Floor({ size = 40 }: { size?: number }) {
    const tex = useConcrete(size / 5);
    return <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[size, size]} /><meshStandardMaterial map={tex} roughness={0.85} /></mesh>;
}

export type View = { pos: [number, number, number]; target: [number, number, number] };
export type Stage3DHandle = { reset: () => void; setView: (v: View, smooth?: boolean) => void };

function Controls({ view, ctrl, orbit, autoRotate, minDist, maxDist, zoom, onStart }: { view: View; ctrl: React.MutableRefObject<OrbitImpl | null>; orbit: boolean; autoRotate: boolean; minDist: number; maxDist: number; zoom: boolean; onStart: () => void }) {
    const { camera } = useThree();
    useEffect(() => { camera.position.set(...view.pos); ctrl.current?.target.set(...view.target); ctrl.current?.update(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return <OrbitControls ref={ctrl as never} makeDefault enabled={orbit} enablePan={false} enableZoom={zoom} enableDamping dampingFactor={0.09} target={view.target}
        minDistance={minDist} maxDistance={maxDist} minPolarAngle={0.15} maxPolarAngle={Math.PI / 2 - 0.04} rotateSpeed={0.7}
        autoRotate={autoRotate} autoRotateSpeed={0.8} onStart={onStart} />;
}

/** Płynne przejście kamery do nowego widoku. */
function Fly({ fly, ctrl }: { fly: React.MutableRefObject<{ from: View; to: View; t: number } | null>; ctrl: React.MutableRefObject<OrbitImpl | null> }) {
    const { camera } = useThree();
    useFrameSafe(dt => {
        const f = fly.current; if (!f) return;
        f.t = Math.min(1, f.t + dt / 0.7);
        const k = 1 - Math.pow(1 - f.t, 3);
        camera.position.set(...lerp3(f.from.pos, f.to.pos, k));
        ctrl.current?.target.set(...lerp3(f.from.target, f.to.target, k));
        ctrl.current?.update();
        if (f.t >= 1) fly.current = null;
    });
    return null;
}
function useFrameSafe(cb: (dt: number) => void) { useFrame((_, dt) => cb(Math.min(dt, 0.05))); }
const lerp3 = (a: number[], b: number[], k: number) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k] as [number, number, number];

type Props = {
    view: View; children: React.ReactNode; orbit?: boolean; autoRotate?: boolean; minDist?: number; maxDist?: number;
    hint?: string; resetLabel?: string; className?: string; zoom?: boolean; fov?: number; overlay?: React.ReactNode; floor?: boolean; shadowSize?: number; label?: string;
};

export const Stage3D = forwardRef<Stage3DHandle, Props>(function Stage3D({ view, children, orbit = true, autoRotate = false, minDist = 2.5, maxDist = 12, hint, resetLabel, className = "", zoom = true, fov = 38, overlay, floor = true, shadowSize, label }, ref) {
    const ctrl = useRef<OrbitImpl | null>(null);
    const fly = useRef<{ from: View; to: View; t: number } | null>(null);
    const [moved, setMoved] = useState(false);
    const current = (): View => {
        const c = ctrl.current; if (!c) return view;
        const p = c.object.position, t = c.target;
        return { pos: [p.x, p.y, p.z], target: [t.x, t.y, t.z] };
    };
    const setView = (v: View, smooth = true) => {
        if (!smooth || !ctrl.current) { ctrl.current?.object.position.set(...v.pos); ctrl.current?.target.set(...v.target); ctrl.current?.update(); return; }
        fly.current = { from: current(), to: v, t: 0 };
    };
    useImperativeHandle(ref, () => ({ reset: () => { setView(view); setMoved(false); }, setView }));
    return <div className={`s3d ${className}`} role="img" aria-label={label}>
        <Canvas shadows dpr={[1, 2]} camera={{ fov, near: 0.05, far: 120, position: view.pos }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, preserveDrawingBuffer: true }}
            onCreated={({ gl }) => { gl.shadowMap.type = THREE.PCFSoftShadowMap; }}>
            <color attach="background" args={["#e4e1db"]} />
            <fog attach="fog" args={["#e4e1db", 12, 30]} />
            <StudioLights shadowSize={shadowSize} />
            {floor && <Floor />}
            {children}
            <Controls view={view} ctrl={ctrl} orbit={orbit} autoRotate={autoRotate && !moved} minDist={minDist} maxDist={maxDist} zoom={zoom} onStart={() => { fly.current = null; setMoved(true); }} />
            <Fly fly={fly} ctrl={ctrl} />
        </Canvas>
        {overlay}
        {orbit && (hint || resetLabel) && <div className="s3d-tools">
            {!moved && hint && <span className="s3d-hint"><RotateIc />{hint}</span>}
            {moved && resetLabel && <button type="button" className="s3d-reset" onClick={() => { setView(view); setMoved(false); }}><ResetIc />{resetLabel}</button>}
        </div>}
    </div>;
});

const RotateIc = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 4 0 0 0 16 0M20 12a8 4 0 0 0-11-3.7" /><path d="M8 6l1.2 2.6L6.6 10" /></svg>;
const ResetIc = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12a7 7 0 1 0 2-5" /><path d="M5 4v4h4" /></svg>;
