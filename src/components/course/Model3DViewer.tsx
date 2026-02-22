import { useRef, useState, Suspense } from "react";
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html, Environment, Stage } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { RotateCcw, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { ModelAnnotation } from "@/types/course.types";

// ─── 3D Model with annotation hotspots ───────────────────────────────────────

function Model({
  url,
  annotations = [],
  onAnnotationClick,
}: {
  url: string;
  annotations?: ModelAnnotation[];
  onAnnotationClick: (a: ModelAnnotation | null) => void;
}) {
  const { scene } = useGLTF(url);
  const ref = useRef<THREE.Group>(null!);

  return (
    <group ref={ref}>
      <primitive object={scene} dispose={null} />

      {annotations.map(ann => (
        <Html
          key={ann.id}
          position={ann.position as [number, number, number]}
          distanceFactor={5}
          style={{ pointerEvents: "auto" }}
        >
          <button
            className="w-7 h-7 rounded-full bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center text-slate-950 text-xs font-bold hover:scale-110 transition-transform"
            onClick={() => onAnnotationClick(ann)}
            title={ann.label}
          >
            i
          </button>
        </Html>
      ))}
    </group>
  );
}

// ─── Annotation Tooltip ───────────────────────────────────────────────────────

function AnnotationTooltip({
  annotation,
  onClose,
}: {
  annotation: ModelAnnotation;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 border border-amber-500/40 rounded-xl p-4 backdrop-blur-sm z-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-amber-400 font-semibold mb-1">{annotation.label}</p>
          <p className="text-slate-300 text-sm leading-relaxed">{annotation.description}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white flex-shrink-0 mt-0.5"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Model3DViewerProps {
  url: string;
  label?: string;
  annotations?: ModelAnnotation[];
}

export default function Model3DViewer({ url, label, annotations = [] }: Model3DViewerProps) {
  const [activeAnnotation, setActiveAnnotation] = useState<ModelAnnotation | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsRef = useRef<any>(null);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className={`relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-xl ${
      isFullscreen ? "fixed inset-0 z-[90] rounded-none" : "h-[420px] sm:h-[500px]"
    }`}>
      {/* Label */}
      {label && (
        <div className="absolute top-3 left-3 z-10 bg-slate-950/80 px-3 py-1 rounded-lg backdrop-blur-sm">
          <p className="text-slate-300 text-xs font-medium">{label}</p>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <Button
          size="icon"
          variant="outline"
          className="w-8 h-8 bg-slate-950/80 border-slate-700 text-slate-400 hover:text-white"
          onClick={resetCamera}
          title="Resetuj widok"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="w-8 h-8 bg-slate-950/80 border-slate-700 text-slate-400 hover:text-white"
          onClick={() => setIsFullscreen(f => !f)}
          title="Pełny ekran"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Hint */}
      <div className="absolute bottom-3 right-3 z-10 bg-slate-950/60 px-2 py-1 rounded text-slate-500 text-xs pointer-events-none">
        Przeciągnij, aby obracać · Scroll = zoom
      </div>

      {/* Canvas */}
      <Canvas
        camera={{ position: [0, 1, 4], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#0f172a" }}
      >
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5} adjustCamera={false}>
            <Model
              url={url}
              annotations={annotations}
              onAnnotationClick={setActiveAnnotation}
            />
          </Stage>
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.05}
            minDistance={1}
            maxDistance={15}
            maxPolarAngle={Math.PI / 1.5}
          />
        </Suspense>
      </Canvas>

      {/* Annotation tooltip */}
      {activeAnnotation && (
        <AnnotationTooltip
          annotation={activeAnnotation}
          onClose={() => setActiveAnnotation(null)}
        />
      )}

      {/* Fullscreen close */}
      {isFullscreen && (
        <button
          className="absolute top-3 left-3 z-20 bg-slate-950/80 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-sm backdrop-blur-sm"
          onClick={() => setIsFullscreen(false)}
        >
          ✕ Zamknij
        </button>
      )}
    </div>
  );
}
