import { useState, useEffect, useCallback, useRef } from "react";
import { Upload, Trash2, Copy, Check, Search, Film, Image, FileText, Box, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiUpload } from "@/api/http";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type Category = "all" | "video" | "image" | "document" | "model3d" | "other";

interface MediaFile {
    filename: string;
    url: string;
    size: number;
    category: string;
    mimetype: string;
    createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
    all: "Wszystkie",
    video: "Wideo",
    image: "Zdjęcia",
    document: "Dokumenty",
    model3d: "Modele 3D",
    other: "Inne",
};

const CategoryIcon = ({ cat, className }: { cat: string; className?: string }) => {
    if (cat === "video")    return <Film className={className} />;
    if (cat === "image")    return <Image className={className} />;
    if (cat === "document") return <FileText className={className} />;
    if (cat === "model3d")  return <Box className={className} />;
    return <FileText className={className} />;
};

function fmtSize(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

interface Props {
    /** If set, clicking a file calls this instead of just copying */
    onSelect?: (url: string, filename: string) => void;
    /** If set, show only this category by default */
    defaultCategory?: Category;
}

export default function MediaLibrary({ onSelect, defaultCategory = "all" }: Props) {
    const [files, setFiles]         = useState<MediaFile[]>([]);
    const [loading, setLoading]     = useState(true);
    const [category, setCategory]   = useState<Category>(defaultCategory);
    const [search, setSearch]       = useState("");
    const [uploading, setUploading] = useState(false);
    const [copied, setCopied]       = useState<string | null>(null);
    const [deleting, setDeleting]   = useState<string | null>(null);
    const [preview, setPreview]     = useState<MediaFile | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = category !== "all" ? `?category=${category}` : "";
            const res = await fetch(`${API}/upload${params}`, { headers: authH() });
            const data = await res.json();
            setFiles(data.files || []);
        } catch {
            setFiles([]);
        } finally {
            setLoading(false);
        }
    }, [category]);

    useEffect(() => { load(); }, [load]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";
        setUploading(true);
        try {
            await apiUpload(file);
            await load();
        } catch (err: any) {
            alert("Błąd uploadu: " + (err?.message || "nieznany błąd"));
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (filename: string) => {
        if (!confirm(`Usunąć plik ${filename}?\n\nUwaga: jeśli jest używany w jakimś temacie, przestanie działać.`)) return;
        setDeleting(filename);
        try {
            await fetch(`${API}/upload/${encodeURIComponent(filename)}`, {
                method: "DELETE",
                headers: authH(),
            });
            setFiles(prev => prev.filter(f => f.filename !== filename));
            if (preview?.filename === filename) setPreview(null);
        } catch {
            alert("Błąd usuwania pliku");
        } finally {
            setDeleting(null);
        }
    };

    const handleCopy = (url: string) => {
        navigator.clipboard.writeText(url).then(() => {
            setCopied(url);
            setTimeout(() => setCopied(null), 2000);
        });
    };

    const filtered = files.filter(f =>
        !search || f.filename.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Szukaj pliku..."
                        className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
                <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                    Odśwież
                </Button>
                <Button
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    className="bg-amber-500 hover:bg-amber-400 text-white"
                >
                    {uploading
                        ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Wysyłanie...</>
                        : <><Upload className="w-3.5 h-3.5 mr-1.5" />Wgraj plik</>}
                </Button>
                <input ref={fileRef} type="file" className="hidden" onChange={handleUpload}
                       accept="video/*,image/*,.pdf,.glb,.gltf" />
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 mb-4 flex-wrap">
                {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                            category === cat
                                ? "bg-amber-500 text-white"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                    >
                        {CATEGORY_LABELS[cat]}
                        {cat === "all" ? ` (${files.length})` : ` (${files.filter(f => f.category === cat).length})`}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-7 h-7 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Upload className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm">Brak plików{search ? ` pasujących do "${search}"` : ""}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto">
                    {filtered.map(f => (
                        <div
                            key={f.filename}
                            className="group relative rounded-xl border border-border bg-muted/30 overflow-hidden hover:border-amber-400 transition-all"
                        >
                            {/* Thumbnail */}
                            <div
                                className="aspect-video bg-black/10 flex items-center justify-center cursor-pointer overflow-hidden"
                                onClick={() => onSelect ? onSelect(f.url, f.filename) : setPreview(f)}
                            >
                                {f.category === "image" ? (
                                    <img src={f.url} alt={f.filename} className="w-full h-full object-cover" />
                                ) : f.category === "video" ? (
                                    <video src={f.url} className="w-full h-full object-cover" muted preload="metadata" />
                                ) : (
                                    <CategoryIcon cat={f.category} className="w-10 h-10 text-muted-foreground/40" />
                                )}
                                {onSelect && (
                                    <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-semibold">Wybierz</span>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-2">
                                <p className="text-xs font-medium truncate" title={f.filename}>{f.filename}</p>
                                <p className="text-xs text-muted-foreground">{fmtSize(f.size)}</p>
                            </div>

                            {/* Action buttons */}
                            <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={e => { e.stopPropagation(); handleCopy(f.url); }}
                                    className="w-6 h-6 rounded-md bg-white/90 shadow flex items-center justify-center hover:bg-amber-50"
                                    title="Kopiuj URL"
                                >
                                    {copied === f.url
                                        ? <Check className="w-3 h-3 text-green-500" />
                                        : <Copy className="w-3 h-3 text-gray-600" />}
                                </button>
                                <button
                                    onClick={e => { e.stopPropagation(); handleDelete(f.filename); }}
                                    disabled={deleting === f.filename}
                                    className="w-6 h-6 rounded-md bg-white/90 shadow flex items-center justify-center hover:bg-red-50"
                                    title="Usuń plik"
                                >
                                    {deleting === f.filename
                                        ? <RefreshCw className="w-3 h-3 animate-spin text-gray-400" />
                                        : <Trash2 className="w-3 h-3 text-red-500" />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Preview modal */}
            {preview && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
                    onClick={() => setPreview(null)}
                >
                    <div
                        className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                            <p className="font-semibold text-sm truncate max-w-md">{preview.filename}</p>
                            <button onClick={() => setPreview(null)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="bg-black/10 flex items-center justify-center min-h-[200px]">
                            {preview.category === "image" ? (
                                <img src={preview.url} alt={preview.filename} className="max-h-[70vh] max-w-full object-contain" />
                            ) : preview.category === "video" ? (
                                <video src={preview.url} controls autoPlay className="max-h-[70vh] max-w-full w-full" />
                            ) : (
                                <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
                                    <CategoryIcon cat={preview.category} className="w-16 h-16 opacity-30" />
                                    <p className="text-sm">{preview.filename}</p>
                                </div>
                            )}
                        </div>
                        <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                            <div className="text-xs text-muted-foreground space-y-0.5">
                                <p>{fmtSize(preview.size)} · {preview.mimetype}</p>
                                <p className="font-mono truncate max-w-xs">{preview.url}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleCopy(preview.url)}>
                                    {copied === preview.url ? <Check className="w-3.5 h-3.5 mr-1.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                                    Kopiuj URL
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => { handleDelete(preview.filename); setPreview(null); }}>
                                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                    Usuń
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}