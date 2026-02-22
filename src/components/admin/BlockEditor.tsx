import { useState } from "react";
import {
    DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { nanoid } from "nanoid";
import { ContentBlock, BlockType, CalloutStyle } from "@/types/course.types";
import { apiUpload } from "@/api/http";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
    GripVertical, Trash2, Plus, Type, Video, Image, Box, Globe,
    AlertCircle, Minus, Zap, Upload, Loader2, Columns2, Square, Shuffle,
} from "lucide-react";
import TipTapEditor from "./TipTapEditor";

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.FC<{ className?: string }>; color: string }[] = [
    { type: "richtext",    label: "Tekst",      icon: Type,         color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
    { type: "video",       label: "Wideo",      icon: Video,        color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" },
    { type: "image",       label: "Zdjęcie",    icon: Image,        color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" },
    { type: "model3d",     label: "Model 3D",   icon: Box,          color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" },
    { type: "embed",       label: "Embed",      icon: Globe,        color: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100" },
    { type: "callout",     label: "Ramka info", icon: AlertCircle,  color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
    { type: "divider",     label: "Separator",  icon: Minus,        color: "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100" },
    { type: "interactive", label: "Interakcja", icon: Zap,          color: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100" },
];

const BLOCK_HEADER_COLOR: Record<BlockType, string> = {
    richtext:    "bg-blue-50 border-blue-100 text-blue-700",
    video:       "bg-red-50 border-red-100 text-red-700",
    image:       "bg-green-50 border-green-100 text-green-700",
    model3d:     "bg-purple-50 border-purple-100 text-purple-700",
    embed:       "bg-teal-50 border-teal-100 text-teal-700",
    callout:     "bg-amber-50 border-amber-100 text-amber-700",
    divider:     "bg-gray-50 border-gray-100 text-gray-600",
    interactive: "bg-violet-50 border-violet-100 text-violet-700",
};

function createBlock(type: BlockType): ContentBlock {
    return { id: `b_${nanoid(8)}`, type, order: 0 };
}

function SortableBlock({ block, children, onDelete, onWidthToggle }: {
    block: ContentBlock; children: React.ReactNode; onDelete: () => void; onWidthToggle: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    const headerColor = BLOCK_HEADER_COLOR[block.type] ?? "bg-gray-50 border-gray-100 text-gray-600";
    const label = BLOCK_TYPES.find(bt => bt.type === block.type)?.label ?? block.type;

    return (
        <div
            ref={setNodeRef} style={style}
            className={`group rounded-xl border bg-white shadow-sm transition-all overflow-hidden
        ${isDragging ? "opacity-50 shadow-lg border-amber-400" : "border-gray-200 hover:border-gray-300 hover:shadow-md"}
        ${block.width === "half" ? "w-[calc(50%-6px)]" : "w-full"}`}
        >
            <div className={`flex items-center justify-between px-3 py-2 border-b ${headerColor}`}>
                <div className="flex items-center gap-2">
                    <button {...attributes} {...listeners} className="opacity-40 hover:opacity-80 cursor-grab active:cursor-grabbing p-0.5 transition-opacity" title="Przeciągnij">
                        <GripVertical className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
                    {block.width === "half" && <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 border-current opacity-70">½</Badge>}
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={onWidthToggle} className="p-1 rounded hover:bg-black/10 transition-colors opacity-50 hover:opacity-100" title={block.width === "half" ? "Pełna szerokość" : "Pół szerokości"}>
                        {block.width === "half" ? <Square className="h-3.5 w-3.5" /> : <Columns2 className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={onDelete} className="p-1 rounded hover:bg-red-100 text-current opacity-50 hover:opacity-100 hover:text-red-600 transition-colors" title="Usuń blok">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
}

const inputCls = "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:ring-amber-500";
const labelCls = "text-gray-600 text-xs font-medium";

function RichTextBlockEditor({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) {
    return (
        <div>
            <Label className={`${labelCls} mb-2 block`}>Tekst sformatowany</Label>
            <TipTapEditor content={block.richtextData ?? ""} onChange={html => onChange({ ...block, richtextData: html })} />
        </div>
    );
}

function VideoBlockEditor({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) {
    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <Label className={labelCls}>URL wideo</Label>
                <Input value={block.videoUrl ?? ""} onChange={e => onChange({ ...block, videoUrl: e.target.value })} placeholder="YouTube, Vimeo lub bezpośredni link do pliku..." className={inputCls} />
            </div>
        </div>
    );
}

// ── IMAGE BLOCK — z skalowaniem ───────────────────────────────────────────────
function ImageBlockEditor({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) {
    const [uploading, setUploading] = useState(false);
    const imageScale: number = (block as any).imageScale ?? 100;
    const imageAlign: string = (block as any).imageAlign ?? "center";

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        setUploading(true);
        try { const res = await apiUpload(file); onChange({ ...block, imageUrl: res.url } as any); }
        catch { console.error("Upload failed"); } finally { setUploading(false); }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <Label className={labelCls}>URL zdjęcia</Label>
                <Input value={block.imageUrl ?? ""} onChange={e => onChange({ ...block, imageUrl: e.target.value } as any)} placeholder="https://..." className={inputCls} />
            </div>
            <Label className="flex items-center gap-2 cursor-pointer text-amber-600 text-sm font-medium hover:text-amber-700 transition-colors border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg w-fit">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Wgraj plik
                <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </Label>

            {block.imageUrl && (
                <div className="space-y-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className={labelCls}>Rozmiar: {imageScale}%</Label>
                            <span className="text-xs text-gray-400">{imageScale === 100 ? "Pełna szerokość" : imageScale <= 30 ? "Miniatury" : "Niestandardowy"}</span>
                        </div>
                        <Slider
                            value={[imageScale]}
                            onValueChange={([v]) => onChange({ ...block, imageScale: v } as any)}
                            min={10} max={100} step={5}
                            className="w-full"
                        />
                        <div className="flex gap-2 mt-1">
                            {[25, 50, 75, 100].map(v => (
                                <button key={v} onClick={() => onChange({ ...block, imageScale: v } as any)}
                                        className={`text-xs px-2 py-1 rounded border transition-all ${imageScale === v ? "bg-amber-500 text-white border-amber-500" : "border-gray-300 text-gray-600 hover:border-amber-300"}`}>
                                    {v}%
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className={labelCls}>Wyrównanie</Label>
                        <div className="flex gap-2">
                            {[["left", "Lewo"], ["center", "Środek"], ["right", "Prawo"]].map(([val, lbl]) => (
                                <button key={val} onClick={() => onChange({ ...block, imageAlign: val } as any)}
                                        className={`flex-1 text-xs py-1.5 rounded-lg border transition-all ${imageAlign === val ? "bg-amber-500 text-white border-amber-500" : "border-gray-300 text-gray-600 hover:border-amber-300"}`}>
                                    {lbl}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-lg overflow-hidden border border-gray-200 bg-white p-2 flex" style={{ justifyContent: imageAlign }}>
                        <img src={block.imageUrl} alt="podgląd" style={{ width: `${imageScale}%`, display: "block" }} className="rounded" />
                    </div>
                </div>
            )}

            <div className="space-y-1.5">
                <Label className={labelCls}>Podpis (opcjonalny)</Label>
                <Input value={block.imageCaption ?? ""} onChange={e => onChange({ ...block, imageCaption: e.target.value } as any)} placeholder="Opis zdjęcia widoczny pod spodem..." className={inputCls} />
            </div>
        </div>
    );
}

function Model3DBlockEditor({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) {
    const [uploading, setUploading] = useState(false);
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        setUploading(true);
        try { const res = await apiUpload(file); onChange({ ...block, modelUrl: res.url }); }
        catch { console.error("Upload failed"); } finally { setUploading(false); }
    };
    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <Label className={labelCls}>URL modelu 3D (.glb / .gltf) lub Sketchfab</Label>
                <Input value={block.modelUrl ?? ""} onChange={e => onChange({ ...block, modelUrl: e.target.value })} placeholder="https://... lub /uploads/model.glb" className={inputCls} />
            </div>
            <Label className="flex items-center gap-2 cursor-pointer text-amber-600 text-sm font-medium hover:text-amber-700 transition-colors border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg w-fit">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Wgraj plik .glb / .gltf
                <input type="file" accept=".glb,.gltf" onChange={handleUpload} className="hidden" />
            </Label>
            <div className="space-y-1.5">
                <Label className={labelCls}>Etykieta modelu</Label>
                <Input value={block.modelLabel ?? ""} onChange={e => onChange({ ...block, modelLabel: e.target.value })} placeholder='np. "Budowa wózka widłowego"' className={inputCls} />
            </div>
        </div>
    );
}

function EmbedBlockEditor({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) {
    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <Label className={labelCls}>URL do osadzenia</Label>
                <Input value={block.embedUrl ?? ""} onChange={e => onChange({ ...block, embedUrl: e.target.value })} placeholder="https://sketchfab.com/... lub inny URL" className={inputCls} />
            </div>
            <div className="space-y-1.5">
                <Label className={labelCls}>Wysokość (px)</Label>
                <Input type="number" value={block.embedHeight ?? 400} onChange={e => onChange({ ...block, embedHeight: parseInt(e.target.value) })} className={inputCls} />
            </div>
        </div>
    );
}

function CalloutBlockEditor({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) {
    const style: CalloutStyle = block.calloutStyle ?? "info";
    const styleOptions: { value: CalloutStyle; label: string; color: string }[] = [
        { value: "info",    label: "ℹ Info",     color: "bg-blue-50 border-blue-300 text-blue-700" },
        { value: "warning", label: "⚠ Uwaga",    color: "bg-amber-50 border-amber-300 text-amber-700" },
        { value: "danger",  label: "🚨 Danger",  color: "bg-red-50 border-red-300 text-red-700" },
        { value: "success", label: "✅ Sukces",  color: "bg-green-50 border-green-300 text-green-700" },
    ];
    const current = styleOptions.find(s => s.value === style)!;
    return (
        <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
                {styleOptions.map(opt => (
                    <button key={opt.value} onClick={() => onChange({ ...block, calloutStyle: opt.value })}
                            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${style === opt.value ? opt.color + " font-bold" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                        {opt.label}
                    </button>
                ))}
            </div>
            <div className="space-y-1.5">
                <Label className={labelCls}>Tytuł ramki</Label>
                <Input value={block.calloutTitle ?? ""} onChange={e => onChange({ ...block, calloutTitle: e.target.value })} placeholder="np. Ważna informacja" className={inputCls} />
            </div>
            <div className="space-y-1.5">
                <Label className={labelCls}>Treść</Label>
                <Textarea value={block.calloutText ?? ""} onChange={e => onChange({ ...block, calloutText: e.target.value })} placeholder="Treść ramki informacyjnej..." className={inputCls} rows={3} />
            </div>
        </div>
    );
}

// ── DRAG ORDER — z shuffle ────────────────────────────────────────────────────
function DragOrderEditor({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) {
    const data = (block.interactiveData ?? {}) as Record<string, any>;
    const title: string = data.title ?? "";
    const items: { id: string; label: string }[] = data.items ?? [];
    const correctOrder: string[] = data.correctOrder ?? items.map(i => i.id);

    const save = (patch: Partial<typeof data>) => onChange({ ...block, interactiveData: { ...data, ...patch } });
    const addItem = () => { const id = `item_${Date.now()}`; save({ items: [...items, { id, label: "" }], correctOrder: [...correctOrder, id] }); };
    const updateLabel = (id: string, label: string) => save({ items: items.map(i => i.id === id ? { ...i, label } : i) });
    const removeItem = (id: string) => save({ items: items.filter(i => i.id !== id), correctOrder: correctOrder.filter(oid => oid !== id) });
    const moveItem = (idx: number, dir: -1 | 1) => {
        const newOrder = [...correctOrder]; const to = idx + dir;
        if (to < 0 || to >= newOrder.length) return;
        [newOrder[idx], newOrder[to]] = [newOrder[to], newOrder[idx]]; save({ correctOrder: newOrder });
    };
    const orderedItems = correctOrder.map(id => items.find(i => i.id === id)).filter(Boolean) as { id: string; label: string }[];

    return (
        <div className="space-y-3">
            <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
                <p className="text-violet-800 text-xs font-semibold mb-1">↕ Jak działa ćwiczenie?</p>
                <p className="text-violet-700 text-xs">Kursant dostaje elementy <strong>pomieszane losowo</strong> i przeciąga aby ułożyć poprawnie. <strong>Wpisz elementy poniżej w POPRAWNEJ kolejności</strong>.</p>
            </div>
            <div className="space-y-1.5">
                <Label className={labelCls}>Tytuł ćwiczenia</Label>
                <Input value={title} onChange={e => save({ title: e.target.value })} placeholder="np. Ułóż kroki kontroli wózka przed jazdą" className={inputCls} />
            </div>
            <div className="space-y-1.5">
                <Label className={labelCls}>Kolejność poprawna ({orderedItems.length} kroków)</Label>
                <div className="space-y-2">
                    {orderedItems.map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-2 group/item">
                            <div className="w-6 h-6 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center text-xs font-bold text-violet-600 flex-shrink-0">{idx + 1}</div>
                            <Input value={item.label} onChange={e => updateLabel(item.id, e.target.value)} placeholder={`Krok ${idx + 1}…`} className={`${inputCls} flex-1`} />
                            <div className="flex gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0">
                                <button disabled={idx === 0} onClick={() => moveItem(idx, -1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-20 text-gray-500 hover:text-gray-800 text-xs">▲</button>
                                <button disabled={idx === orderedItems.length - 1} onClick={() => moveItem(idx, 1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-20 text-gray-500 hover:text-gray-800 text-xs">▼</button>
                                <button onClick={() => removeItem(item.id)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="h-3 w-3" /></button>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={addItem} className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-medium mt-1 px-2 py-1 rounded hover:bg-violet-50 transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Dodaj krok
                </button>
            </div>
        </div>
    );
}

// ── HOTSPOT — z skalowaniem zdjęcia ─────────────────────────────────────────
function HotspotEditor({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) {
    const data = (block.interactiveData ?? {}) as Record<string, any>;
    const title: string = data.title ?? "";
    const instruction: string = data.instruction ?? "";
    const imageUrl: string = data.imageUrl ?? "";
    const imageScale: number = data.imageScale ?? 100;
    const hotspots: { id: string; x: number; y: number; label: string; isHazard?: boolean }[] = data.hotspots ?? [];
    const [uploading, setUploading] = useState(false);
    const [placingMode, setPlacingMode] = useState<"hazard" | "safe" | null>(null);
    const save = (patch: Partial<typeof data>) => onChange({ ...block, interactiveData: { ...data, ...patch } });

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        setUploading(true);
        try { const res = await apiUpload(file); save({ imageUrl: res.url }); }
        catch { console.error("Upload failed"); } finally { setUploading(false); }
    };

    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!placingMode || !imageUrl) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
        const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
        save({ hotspots: [...hotspots, { id: `hs_${Date.now()}`, x, y, label: placingMode === "hazard" ? "Zagrożenie" : "Bezpieczny obszar", isHazard: placingMode === "hazard" }] });
        setPlacingMode(null);
    };

    return (
        <div className="space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-xs font-semibold mb-1">🔍 Znajdź zagrożenia na zdjęciu</p>
                <p className="text-red-700 text-xs">Wgraj zdjęcie, ustaw rozmiar, potem kliknij "Dodaj zagrożenie" i kliknij w miejscu na obrazku.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className={labelCls}>Tytuł</Label>
                    <Input value={title} onChange={e => save({ title: e.target.value })} placeholder="Znajdź zagrożenia na zdjęciu" className={inputCls} />
                </div>
                <div className="space-y-1.5">
                    <Label className={labelCls}>Instrukcja</Label>
                    <Input value={instruction} onChange={e => save({ instruction: e.target.value })} placeholder="Kliknij na wszystkie zagrożenia" className={inputCls} />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label className={labelCls}>Zdjęcie</Label>
                <div className="flex gap-2">
                    <Input value={imageUrl} onChange={e => save({ imageUrl: e.target.value })} placeholder="https://..." className={`${inputCls} flex-1`} />
                    <Label className="flex items-center gap-1.5 cursor-pointer text-amber-600 text-sm font-medium hover:text-amber-700 border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors">
                        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        Wgraj
                        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                    </Label>
                </div>
            </div>
            {imageUrl && (
                <>
                    <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between">
                            <Label className={labelCls}>Rozmiar zdjęcia: {imageScale}%</Label>
                        </div>
                        <Slider value={[imageScale]} onValueChange={([v]) => save({ imageScale: v })} min={20} max={100} step={5} />
                        <div className="flex gap-2">
                            {[50, 75, 100].map(v => (
                                <button key={v} onClick={() => save({ imageScale: v })}
                                        className={`text-xs px-2 py-1 rounded border transition-all ${imageScale === v ? "bg-amber-500 text-white border-amber-500" : "border-gray-300 text-gray-600 hover:border-amber-300"}`}>
                                    {v}%
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setPlacingMode(placingMode === "hazard" ? null : "hazard")}
                                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${placingMode === "hazard" ? "bg-red-500 border-red-500 text-white" : "border-red-300 text-red-600 hover:bg-red-50"}`}>
                            {placingMode === "hazard" ? "🎯 Kliknij na zdjęciu…" : "➕ Dodaj zagrożenie"}
                        </button>
                        <button onClick={() => setPlacingMode(placingMode === "safe" ? null : "safe")}
                                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${placingMode === "safe" ? "bg-green-500 border-green-500 text-white" : "border-green-300 text-green-600 hover:bg-green-50"}`}>
                            {placingMode === "safe" ? "🎯 Kliknij na zdjęciu…" : "➕ Dodaj bezpieczny obszar"}
                        </button>
                        {placingMode && <button onClick={() => setPlacingMode(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2">✕ Anuluj</button>}
                    </div>
                    <div className={`relative select-none rounded-xl overflow-hidden border-2 transition-all ${placingMode ? "border-amber-400 cursor-crosshair shadow-lg" : "border-gray-200"}`}
                         style={{ maxWidth: `${imageScale}%` }}
                         onClick={handleImageClick}>
                        <img src={imageUrl} alt="" className="w-full block" draggable={false} />
                        {placingMode && (
                            <div className="absolute inset-0 bg-amber-500/10 flex items-center justify-center pointer-events-none">
                                <div className="bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                                    Kliknij aby dodać {placingMode === "hazard" ? "zagrożenie" : "bezpieczny obszar"}
                                </div>
                            </div>
                        )}
                        {hotspots.map(hs => (
                            <div key={hs.id} className={`absolute w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-sm font-bold shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none ${hs.isHazard ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}
                                 style={{ left: `${hs.x}%`, top: `${hs.y}%` }} title={hs.label}>
                                {hs.isHazard ? "!" : "✓"}
                            </div>
                        ))}
                    </div>
                    {hotspots.length > 0 && (
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Punkty na zdjęciu ({hotspots.length})</Label>
                            {hotspots.map(hs => (
                                <div key={hs.id} className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${hs.isHazard ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                                        {hs.isHazard ? "⚠" : "✓"} {hs.isHazard ? "Zagrożenie" : "Bezpieczny"}
                                    </span>
                                    <Input value={hs.label} onChange={e => save({ hotspots: hotspots.map(h => h.id === hs.id ? { ...h, label: e.target.value } : h) })} className={`${inputCls} flex-1 h-7 text-xs`} />
                                    <button onClick={() => save({ hotspots: hotspots.filter(h => h.id !== hs.id) })} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ── TRUE/FALSE SWIPE ──────────────────────────────────────────────────────────
function TrueFalseEditor({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) {
    const data = (block.interactiveData ?? {}) as Record<string, any>;
    const title: string = data.title ?? "";
    const cards: { id: string; statement: string; isTrue: boolean }[] = data.cards ?? [];
    const save = (patch: Partial<typeof data>) => onChange({ ...block, interactiveData: { ...data, ...patch } });

    const addCard = () => save({ cards: [...cards, { id: `tf_${Date.now()}`, statement: "", isTrue: true }] });
    const updateCard = (id: string, patch: Partial<{ statement: string; isTrue: boolean }>) =>
        save({ cards: cards.map(c => c.id === id ? { ...c, ...patch } : c) });
    const removeCard = (id: string) => save({ cards: cards.filter(c => c.id !== id) });

    return (
        <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-xs font-semibold mb-1">👆 Jak działa ćwiczenie?</p>
                <p className="text-blue-700 text-xs">Kursant widzi stwierdzenie i przesuwa kartę w prawo (PRAWDA) lub w lewo (FAŁSZ). Wpisz stwierdzenia i zaznacz czy są prawdziwe.</p>
            </div>
            <div className="space-y-1.5">
                <Label className={labelCls}>Tytuł ćwiczenia</Label>
                <Input value={title} onChange={e => save({ title: e.target.value })} placeholder="np. Oceń stwierdzenia o bezpieczeństwie" className={inputCls} />
            </div>
            <div className="space-y-2">
                <Label className={labelCls}>Stwierdzenia ({cards.length})</Label>
                {cards.map((card, idx) => (
                    <div key={card.id} className={`flex items-center gap-2 p-2 rounded-lg border ${card.isTrue ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                        <span className="text-xs font-bold text-gray-400 w-5 flex-shrink-0">{idx + 1}</span>
                        <Input value={card.statement} onChange={e => updateCard(card.id, { statement: e.target.value })} placeholder="Wpisz stwierdzenie..." className={`${inputCls} flex-1 bg-white`} />
                        <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => updateCard(card.id, { isTrue: true })}
                                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${card.isTrue ? "bg-green-500 text-white border-green-500" : "border-gray-300 text-gray-500 hover:border-green-300"}`}>
                                ✓ Prawda
                            </button>
                            <button onClick={() => updateCard(card.id, { isTrue: false })}
                                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${!card.isTrue ? "bg-red-500 text-white border-red-500" : "border-gray-300 text-gray-500 hover:border-red-300"}`}>
                                ✗ Fałsz
                            </button>
                        </div>
                        <button onClick={() => removeCard(card.id)} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                ))}
                <button onClick={addCard} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Dodaj stwierdzenie
                </button>
            </div>
        </div>
    );
}

// ── ANNOTATED IMAGE — kliknij punkt, zobacz opis ─────────────────────────────
function AnnotatedImageEditor({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) {
    const data = (block.interactiveData ?? {}) as Record<string, any>;
    const title: string = data.title ?? "";
    const imageUrl: string = data.imageUrl ?? "";
    const imageScale: number = data.imageScale ?? 100;
    const points: { id: string; x: number; y: number; label: string; description: string }[] = data.points ?? [];
    const [uploading, setUploading] = useState(false);
    const [placing, setPlacing] = useState(false);
    const save = (patch: Partial<typeof data>) => onChange({ ...block, interactiveData: { ...data, ...patch } });

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        setUploading(true);
        try { const res = await apiUpload(file); save({ imageUrl: res.url }); }
        catch { console.error("Upload failed"); } finally { setUploading(false); }
    };

    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!placing || !imageUrl) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
        const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
        save({ points: [...points, { id: `pt_${Date.now()}`, x, y, label: `Punkt ${points.length + 1}`, description: "" }] });
        setPlacing(false);
    };

    return (
        <div className="space-y-3">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-indigo-800 text-xs font-semibold mb-1">📍 Jak działa ćwiczenie?</p>
                <p className="text-indigo-700 text-xs">Wgraj zdjęcie (np. wózka widłowego), dodaj punkty i wpisz opisy. Kursant klika w punkty i czyta opisy elementów.</p>
            </div>
            <div className="space-y-1.5">
                <Label className={labelCls}>Tytuł</Label>
                <Input value={title} onChange={e => save({ title: e.target.value })} placeholder="np. Poznaj budowę wózka widłowego" className={inputCls} />
            </div>
            <div className="space-y-1.5">
                <Label className={labelCls}>Zdjęcie</Label>
                <div className="flex gap-2">
                    <Input value={imageUrl} onChange={e => save({ imageUrl: e.target.value })} placeholder="https://..." className={`${inputCls} flex-1`} />
                    <Label className="flex items-center gap-1.5 cursor-pointer text-amber-600 text-sm font-medium hover:text-amber-700 border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors">
                        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        Wgraj
                        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                    </Label>
                </div>
            </div>
            {imageUrl && (
                <>
                    <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between">
                            <Label className={labelCls}>Rozmiar zdjęcia: {imageScale}%</Label>
                        </div>
                        <Slider value={[imageScale]} onValueChange={([v]) => save({ imageScale: v })} min={20} max={100} step={5} />
                        <div className="flex gap-2">
                            {[50, 75, 100].map(v => (
                                <button key={v} onClick={() => save({ imageScale: v })}
                                        className={`text-xs px-2 py-1 rounded border transition-all ${imageScale === v ? "bg-amber-500 text-white border-amber-500" : "border-gray-300 text-gray-600 hover:border-amber-300"}`}>
                                    {v}%
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={() => setPlacing(p => !p)}
                            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${placing ? "bg-indigo-500 border-indigo-500 text-white" : "border-indigo-300 text-indigo-600 hover:bg-indigo-50"}`}>
                        {placing ? "🎯 Kliknij na zdjęciu aby dodać punkt…" : "📍 Dodaj punkt na zdjęciu"}
                    </button>
                    <div className={`relative select-none rounded-xl overflow-hidden border-2 transition-all ${placing ? "border-indigo-400 cursor-crosshair shadow-lg" : "border-gray-200"}`}
                         style={{ maxWidth: `${imageScale}%` }}
                         onClick={handleImageClick}>
                        <img src={imageUrl} alt="" className="w-full block" draggable={false} />
                        {points.map((pt, idx) => (
                            <div key={pt.id}
                                 className="absolute w-8 h-8 rounded-full bg-indigo-500 border-2 border-white text-white flex items-center justify-center text-xs font-bold shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                 style={{ left: `${pt.x}%`, top: `${pt.y}%` }}>
                                {idx + 1}
                            </div>
                        ))}
                    </div>
                    {points.length > 0 && (
                        <div className="space-y-2">
                            <Label className={labelCls}>Punkty i opisy ({points.length})</Label>
                            {points.map((pt, idx) => (
                                <div key={pt.id} className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</div>
                                        <Input value={pt.label} onChange={e => save({ points: points.map(p => p.id === pt.id ? { ...p, label: e.target.value } : p) })}
                                               placeholder="Nazwa elementu (np. Kierownica)" className={`${inputCls} flex-1 font-medium`} />
                                        <button onClick={() => save({ points: points.filter(p => p.id !== pt.id) })} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
                                    </div>
                                    <Textarea value={pt.description} onChange={e => save({ points: points.map(p => p.id === pt.id ? { ...p, description: e.target.value } : p) })}
                                              placeholder="Opis który zobaczy kursant po kliknięciu w ten punkt..." className={`${inputCls} bg-white`} rows={2} />
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function StabilitySimEditor({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) {
    return (
        <div className="p-3 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-500 text-xs">Symulator stateczności wózka — brak dodatkowych ustawień.</p>
            <p className="text-gray-400 text-xs mt-1">Ćwiczenie jest w pełni wbudowane i działa automatycznie.</p>
        </div>
    );
}

function InteractiveBlockEditor({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) {
    const subtype = block.interactiveSubtype ?? "stability-sim";
    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <Label className={labelCls}>Typ ćwiczenia interaktywnego</Label>
                <Select value={subtype} onValueChange={val => onChange({ ...block, interactiveSubtype: val as any, interactiveData: {} })}>
                    <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="stability-sim">⚖ Symulator stateczności wózka</SelectItem>
                        <SelectItem value="drag-order">↕ Ułóż kolejność kroków</SelectItem>
                        <SelectItem value="hotspot">🔍 Znajdź zagrożenia na zdjęciu</SelectItem>
                        <SelectItem value="truefalse">👆 Prawda / Fałsz (przesuń kartę)</SelectItem>
                        <SelectItem value="annotated-image">📍 Kliknij i dowiedz się więcej</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                {subtype === "stability-sim"   && <StabilitySimEditor block={block} onChange={onChange} />}
                {subtype === "drag-order"      && <DragOrderEditor block={block} onChange={onChange} />}
                {subtype === "hotspot"         && <HotspotEditor block={block} onChange={onChange} />}
                {subtype === "truefalse"       && <TrueFalseEditor block={block} onChange={onChange} />}
                {subtype === "annotated-image" && <AnnotatedImageEditor block={block} onChange={onChange} />}
            </div>
        </div>
    );
}

function BlockEditorSwitch({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) {
    switch (block.type) {
        case "richtext":    return <RichTextBlockEditor block={block} onChange={onChange} />;
        case "video":       return <VideoBlockEditor block={block} onChange={onChange} />;
        case "image":       return <ImageBlockEditor block={block} onChange={onChange} />;
        case "model3d":     return <Model3DBlockEditor block={block} onChange={onChange} />;
        case "embed":       return <EmbedBlockEditor block={block} onChange={onChange} />;
        case "callout":     return <CalloutBlockEditor block={block} onChange={onChange} />;
        case "interactive": return <InteractiveBlockEditor block={block} onChange={onChange} />;
        default:            return null;
    }
}

interface BlockEditorProps {
    blocks: ContentBlock[];
    onChange: (blocks: ContentBlock[]) => void;
}

export default function BlockEditor({ blocks, onChange }: BlockEditorProps) {
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIdx = blocks.findIndex(b => b.id === active.id);
            const newIdx = blocks.findIndex(b => b.id === over.id);
            onChange(arrayMove(blocks, oldIdx, newIdx).map((b, i) => ({ ...b, order: i })));
        }
    };

    const addBlock = (type: BlockType) => onChange([...blocks, { ...createBlock(type), order: blocks.length }]);
    const deleteBlock = (id: string) => onChange(blocks.filter(b => b.id !== id));
    const updateBlock = (updated: ContentBlock) => onChange(blocks.map(b => b.id === updated.id ? updated : b));
    const toggleWidth = (id: string) => onChange(blocks.map(b => b.id === id ? { ...b, width: b.width === "half" ? "full" : "half" } : b));
    const sorted = blocks.slice().sort((a, b) => a.order - b.order);

    return (
        <div className="space-y-5">
            <div className="space-y-2">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Dodaj blok</p>
                <div className="flex flex-wrap gap-2">
                    {BLOCK_TYPES.map(({ type, label, icon: Icon, color }) => (
                        <button key={type} onClick={() => addBlock(type)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border font-medium transition-all ${color}`}>
                            <Icon className="h-3.5 w-3.5" />{label}
                        </button>
                    ))}
                </div>
                <p className="text-gray-400 text-xs flex items-center gap-1">
                    Ikona <Columns2 className="h-3 w-3 inline mx-0.5" /> na bloku zmienia szerokość na ½ — dwa bloki ½ wyświetlają się obok siebie.
                </p>
            </div>

            {blocks.length === 0 && (
                <div className="text-center py-14 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <Plus className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-gray-400 text-sm">Brak bloków. Kliknij przycisk powyżej aby dodać treść.</p>
                </div>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sorted.map(b => b.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-wrap gap-3">
                        {sorted.map(block => (
                            <SortableBlock key={block.id} block={block} onDelete={() => deleteBlock(block.id)} onWidthToggle={() => toggleWidth(block.id)}>
                                <BlockEditorSwitch block={block} onChange={updateBlock} />
                            </SortableBlock>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}