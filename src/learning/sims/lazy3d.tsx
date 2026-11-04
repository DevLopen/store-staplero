/** Leniwe wczytywanie scen 3D: three.js ładuje się dopiero w kroku, który go potrzebuje. */
import { lazy, Suspense } from "react";

const load = () => import("./three/scenes");
export const AnatomyScene = lazy(() => load().then(m => ({ default: m.AnatomyScene })));
export const MastScene = lazy(() => load().then(m => ({ default: m.MastScene })));
export const AttachScene = lazy(() => load().then(m => ({ default: m.AttachScene })));
export const CogScene = lazy(() => load().then(m => ({ default: m.CogScene })));
export const DiagramScene = lazy(() => load().then(m => ({ default: m.DiagramScene })));
export const CoverScene = lazy(() => load().then(m => ({ default: m.CoverScene })));
export const TruckStage = lazy(() => import("./three/Trucks3D").then(m => ({ default: m.TruckStage })));

export function S3({ children, cls = "", fallback }: { children: React.ReactNode; cls?: string; fallback?: React.ReactNode }) {
    return <Suspense fallback={<div className={`s3d s3d-wait ${cls}`}>{fallback}</div>}>{children}</Suspense>;
}

import { usePlayer } from "../LessonPlayer";
const UI3 = {
    hint: { de: "Ziehen zum Drehen", en: "Drag to rotate", pl: "Przeciągnij, aby obrócić", uk: "Потягни, щоб обернути" },
    reset: { de: "Ansicht zurücksetzen", en: "Reset view", pl: "Widok startowy", uk: "Скинути вигляд" },
    loading: { de: "3D-Modell wird geladen", en: "Loading 3D model", pl: "Wczytuję model 3D", uk: "Завантаження 3D-моделі" },
};
/** Wspólne teksty sterowania widokiem 3D we wszystkich językach kursu. */
export function use3dUi() {
    const { lang } = usePlayer();
    return { hint: UI3.hint[lang], resetLabel: UI3.reset[lang], loading: UI3.loading[lang] };
}
