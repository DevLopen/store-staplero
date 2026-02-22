import { useState } from "react";
import { CheckCircle, XCircle, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HotspotPoint } from "@/types/course.types";

interface HotspotExerciseProps {
  data?: Record<string, unknown>;
}

export default function HotspotExercise({ data }: HotspotExerciseProps) {
  const title = (data?.title as string) ?? "Znajdź zagrożenia na zdjęciu";
  const instruction = (data?.instruction as string) ?? "Kliknij na wszystkie zagrożenia widoczne na obrazku";
  const imageUrl = (data?.imageUrl as string) ?? "";
  const hotspots = (data?.hotspots as HotspotPoint[]) ?? [];

  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState(false);

  const toggle = (id: string) => {
    if (revealed) return;
    setMarked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const hazards = hotspots.filter(h => h.isHazard);
  const correctlyMarked = hazards.filter(h => marked.has(h.id));
  const wronglyMarked = [...marked].filter(id => !hazards.find(h => h.id === id));

  const check = () => setRevealed(true);
  const reset = () => { setMarked(new Set()); setRevealed(false); };

  const score = revealed
    ? Math.max(0, Math.round(((correctlyMarked.length - wronglyMarked.length) / Math.max(1, hazards.length)) * 100))
    : null;

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
          <span className="text-red-400 text-lg">🔍</span>
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">{title}</h3>
          <p className="text-slate-500 text-xs">{instruction}</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Image with hotspot overlays */}
        {imageUrl ? (
          <div className="relative rounded-lg overflow-hidden select-none">
            <img
              src={imageUrl}
              alt="Scena do analizy"
              className="w-full object-cover"
              draggable={false}
            />

            {/* Hotspot markers */}
            {hotspots.map(spot => {
              const isMarked = marked.has(spot.id);
              const isHazard = spot.isHazard;
              let color = "bg-amber-500/30 border-amber-400";
              if (revealed) {
                color = isHazard
                  ? (isMarked ? "bg-emerald-500/60 border-emerald-400" : "bg-red-500/60 border-red-400")
                  : (isMarked ? "bg-red-500/60 border-red-400" : "bg-slate-500/30 border-slate-500");
              } else if (isMarked) {
                color = "bg-amber-500/60 border-amber-400";
              }

              return (
                <button
                  key={spot.id}
                  className={`absolute w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 ${color}`}
                  style={{ left: `${spot.x}%`, top: `${spot.y}%`, transform: "translate(-50%, -50%)" }}
                  onClick={() => toggle(spot.id)}
                  title={revealed ? spot.label : undefined}
                >
                  {revealed && (
                    isHazard
                      ? (isMarked ? <CheckCircle className="h-4 w-4 text-white" /> : <XCircle className="h-4 w-4 text-white" />)
                      : (isMarked ? <XCircle className="h-4 w-4 text-white" /> : null)
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="h-48 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-sm">
            Brak obrazka — dodaj imageUrl w danych bloku
          </div>
        )}

        {/* Counters */}
        <div className="flex gap-4 text-sm text-slate-400">
          <span>Zaznaczonych: <strong className="text-white">{marked.size}</strong></span>
          <span>Zagrożeń do znalezienia: <strong className="text-white">{hazards.length}</strong></span>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={revealed ? reset : check}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
          >
            {revealed ? <><RotateCcw className="h-4 w-4 mr-2" />Spróbuj ponownie</> : "Sprawdź"}
          </Button>
        </div>

        {/* Result */}
        {revealed && score !== null && (
          <div className={`p-4 rounded-lg border text-sm ${
            score >= 80 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" :
            score >= 50 ? "bg-amber-500/10 border-amber-500/30 text-amber-300" :
            "bg-red-500/10 border-red-500/30 text-red-300"
          }`}>
            <p className="font-semibold mb-1">Wynik: {score}%</p>
            <p>Znaleziono: {correctlyMarked.length}/{hazards.length} zagrożeń.
              {wronglyMarked.length > 0 && ` Fałszywe alarmy: ${wronglyMarked.length}.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
