import { useState } from "react";
import { X } from "lucide-react";

interface Point {
    id: string;
    x: number;
    y: number;
    label: string;
    description: string;
}

interface Props {
    data?: Record<string, any>;
}

export default function AnnotatedImageExercise({ data }: Props) {
    const title: string = data?.title ?? "";
    const imageUrl: string = data?.imageUrl ?? "";
    const imageScale: number = data?.imageScale ?? 100;
    const points: Point[] = data?.points ?? [];
    const [active, setActive] = useState<string | null>(null);

    if (!imageUrl) {
        return <div className="text-center text-gray-400 py-8">Brak zdjęcia do wyświetlenia</div>;
    }

    const activePoint = points.find(p => p.id === active);

    return (
        <div className="space-y-3">
            {title && <h3 className="font-semibold text-gray-800">{title}</h3>}
            <p className="text-sm text-gray-500">Kliknij w numerowane punkty aby dowiedzieć się więcej</p>

            {/* Image with points */}
            <div className="flex justify-center">
                <div className="relative" style={{ width: `${imageScale}%` }}>
                    <img src={imageUrl} alt={title} className="w-full rounded-xl border border-gray-200 shadow-sm block" />
                    {points.map((pt, idx) => (
                        <button
                            key={pt.id}
                            onClick={() => setActive(active === pt.id ? null : pt.id)}
                            className={`absolute w-9 h-9 rounded-full border-3 border-white flex items-center justify-center text-sm font-black shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 active:scale-95 ${
                                active === pt.id
                                    ? "bg-amber-500 text-white scale-110 ring-4 ring-amber-200"
                                    : "bg-indigo-500 text-white hover:bg-indigo-400"
                            }`}
                            style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                            title={pt.label}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
            </div>

            {/* Info panel */}
            {activePoint && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 animate-in fade-in duration-200 relative">
                    <button onClick={() => setActive(null)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                    <div className="flex items-start gap-3 pr-6">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-black flex-shrink-0">
                            {points.findIndex(p => p.id === activePoint.id) + 1}
                        </div>
                        <div>
                            <h4 className="font-bold text-indigo-900 text-sm">{activePoint.label}</h4>
                            {activePoint.description && (
                                <p className="text-indigo-800 text-sm mt-1 leading-relaxed">{activePoint.description}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Points legend */}
            {points.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                    {points.map((pt, idx) => (
                        <button key={pt.id} onClick={() => setActive(active === pt.id ? null : pt.id)}
                                className={`flex items-center gap-2 p-2 rounded-xl text-left text-sm transition-all border ${
                                    active === pt.id ? "border-indigo-400 bg-indigo-50" : "border-gray-100 hover:border-indigo-200 hover:bg-gray-50"
                                }`}>
                            <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {idx + 1}
                            </div>
                            <span className="text-gray-700 font-medium truncate">{pt.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}