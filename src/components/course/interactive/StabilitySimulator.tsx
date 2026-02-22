import { useState, useMemo } from "react";

interface StabilitySimulatorProps {
  data?: Record<string, unknown>;
}

export default function StabilitySimulator({ data }: StabilitySimulatorProps) {
  const maxLoad = (data?.maxLoadKg as number) ?? 3000;
  const [loadKg, setLoadKg] = useState(500);
  const [heightCm, setHeightCm] = useState(50);

  const stabilityScore = useMemo(() => {
    // Simplified physics: higher load + higher elevation = less stable
    const loadFactor = loadKg / maxLoad;          // 0–1
    const heightFactor = heightCm / 600;          // 0–1 (max 6m)
    const score = Math.max(0, 1 - loadFactor * 0.6 - heightFactor * 0.4);
    return score;
  }, [loadKg, heightCm, maxLoad]);

  const risk: "safe" | "caution" | "danger" =
    stabilityScore > 0.55 ? "safe" : stabilityScore > 0.3 ? "caution" : "danger";

  const riskConfig = {
    safe:    { label: "BEZPIECZNE", color: "text-emerald-400", bg: "bg-emerald-500", barColor: "bg-emerald-500" },
    caution: { label: "OSTROŻNOŚĆ", color: "text-amber-400",   bg: "bg-amber-500",   barColor: "bg-amber-500"   },
    danger:  { label: "NIEBEZPIECZNE", color: "text-red-400",  bg: "bg-red-500",     barColor: "bg-red-500"     },
  }[risk];

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <span className="text-amber-400 text-lg">⚖</span>
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">Symulator stateczności wózka</h3>
          <p className="text-slate-500 text-xs">Przesuń suwaki i obserwuj zmianę stabilności</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Sliders */}
        <div className="space-y-5">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-slate-300 text-sm font-medium">Masa ładunku</label>
              <span className="text-amber-400 font-mono font-bold">{loadKg} kg</span>
            </div>
            <input
              type="range"
              min={0}
              max={maxLoad}
              step={50}
              value={loadKg}
              onChange={e => setLoadKg(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-500 bg-slate-700"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>0 kg</span>
              <span className="text-amber-600/60">Udźwig nominalny: {maxLoad} kg</span>
              <span>{maxLoad} kg</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-slate-300 text-sm font-medium">Wysokość uniesienia wideł</label>
              <span className="text-amber-400 font-mono font-bold">{heightCm} cm</span>
            </div>
            <input
              type="range"
              min={0}
              max={600}
              step={10}
              value={heightCm}
              onChange={e => setHeightCm(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-500 bg-slate-700"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>Ziemia</span>
              <span>300 cm</span>
              <span>600 cm</span>
            </div>
          </div>
        </div>

        {/* Visual indicator */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Wskaźnik stabilności</span>
            <span className={`font-bold text-sm ${riskConfig.color}`}>{riskConfig.label}</span>
          </div>

          <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${riskConfig.barColor}`}
              style={{ width: `${stabilityScore * 100}%` }}
            />
          </div>

          {/* Forklift visualization */}
          <div className="mt-4 flex items-end gap-4 justify-center">
            {/* Mast + load */}
            <div className="flex flex-col items-center">
              <div
                className={`w-16 border-2 border-dashed flex items-end justify-center transition-all duration-500 ${
                  risk === "danger" ? "border-red-500/60 bg-red-500/10" :
                  risk === "caution" ? "border-amber-500/60 bg-amber-500/10" :
                  "border-emerald-500/60 bg-emerald-500/10"
                } rounded`}
                style={{ height: Math.max(24, heightCm / 8) }}
              >
                {/* Load block */}
                <div
                  className={`w-12 rounded-t transition-colors ${riskConfig.bg} opacity-80`}
                  style={{ height: Math.min(32, 8 + loadKg / 200) }}
                />
              </div>
              {/* Forklift body */}
              <div className="w-20 h-8 bg-slate-600 rounded-t flex items-center justify-center mt-0">
                <span className="text-slate-400 text-xs">🚜</span>
              </div>
              <div className="flex gap-4 mt-1">
                <div className="w-6 h-3 bg-slate-500 rounded-full" />
                <div className="w-6 h-3 bg-slate-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Explanations */}
        {risk === "danger" && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
            ⚠️ Niebezpiecznie! Przy takiej masie i wysokości uniesienia środek ciężkości przekracza trójkąt stabilności.
            Wózek może się przewrócić.
          </div>
        )}
        {risk === "caution" && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-sm">
            🔶 Zachowaj ostrożność. Zbliżasz się do granicy stabilności. Jedź powoli i unikaj ostrych zakrętów.
          </div>
        )}
        {risk === "safe" && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-sm">
            ✅ Parametry są w bezpiecznym zakresie. Pamiętaj o przestrzeganiu procedur BHP.
          </div>
        )}
      </div>
    </div>
  );
}
