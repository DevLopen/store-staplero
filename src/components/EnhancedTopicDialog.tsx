import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import BlockEditor from "@/components/admin/BlockEditor";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Wand2, Save, Eye, FileText, Timer, CheckCircle, XCircle, Loader2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

interface EnhancedTopicDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    topicForm: any;
    setTopicForm: (form: any) => void;
    onSave: () => void;
    editingTopic: any;
}

// ─── Block type metadata ────────────────────────────────────────────────────

const BLOCK_COLORS: Record<string, { bg: string; border: string; label: string; icon: string }> = {
    richtext:    { bg: "bg-blue-500/8",   border: "border-blue-400/40",   label: "Textblock",         icon: "📝" },
    callout:     { bg: "bg-amber-500/8",  border: "border-amber-400/40",  label: "Hinweis",           icon: "⚠️" },
    image:       { bg: "bg-green-500/8",  border: "border-green-400/40",  label: "Bild-Platzhalter",  icon: "🖼️" },
    video:       { bg: "bg-purple-500/8", border: "border-purple-400/40", label: "Video-Platzhalter", icon: "🎬" },
    divider:     { bg: "bg-slate-500/8",  border: "border-slate-400/40",  label: "Trenner",           icon: "─" },
    interactive: { bg: "bg-pink-500/8",   border: "border-pink-400/40",   label: "Interaktiv",        icon: "🎮" },
    default:     { bg: "bg-slate-500/8",  border: "border-slate-400/40",  label: "Block",             icon: "▪" },
};

const CALLOUT_STYLE_LABELS: Record<string, { label: string; color: string }> = {
    warning: { label: "Warnung",  color: "text-amber-600" },
    danger:  { label: "Gefahr",   color: "text-red-600" },
    info:    { label: "Info",     color: "text-blue-600" },
    success: { label: "Tipp",     color: "text-green-600" },
};

// ─── Single block preview card ───────────────────────────────────────────────

function BlockPreviewCard({ block, index }: { block: any; index: number }) {
    const [expanded, setExpanded] = useState(false);
    const meta = BLOCK_COLORS[block.type] ?? BLOCK_COLORS.default;
    const widthLabel = block.width === "half" ? "½ Breite" : "Volle Breite";

    return (
        <div className={`border rounded-xl overflow-hidden transition-all ${meta.border} ${meta.bg}`}>
            {/* Header row */}
            <div
                className="flex items-center justify-between px-3 py-2 cursor-pointer select-none"
                onClick={() => setExpanded(e => !e)}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base leading-none flex-shrink-0">{meta.icon}</span>
                    <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wide flex-shrink-0">
                        {meta.label}
                    </span>
                    {block.calloutStyle && (
                        <span className={`text-xs font-medium ${CALLOUT_STYLE_LABELS[block.calloutStyle]?.color ?? ""}`}>
                            [{CALLOUT_STYLE_LABELS[block.calloutStyle]?.label ?? block.calloutStyle}]
                        </span>
                    )}
                    <span className="text-xs text-muted-foreground/60 flex-shrink-0">· {widthLabel}</span>
                    {/* Preview snippet */}
                    {!expanded && (
                        <span className="text-xs text-muted-foreground truncate ml-1">
                            {block.type === "richtext" && block.richtextData &&
                                block.richtextData.replace(/<[^>]+>/g, " ").slice(0, 80)}
                            {block.type === "callout" && block.calloutTitle}
                            {block.type === "image" && block.imageCaption}
                            {block.type === "video" && block.videoCaption}
                            {block.type === "interactive" && (block.interactiveData?.title ?? block.interactiveSubtype)}
                        </span>
                    )}
                </div>
                <div className="flex-shrink-0 ml-2 text-muted-foreground/50">
                    {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </div>
            </div>

            {/* Expanded content */}
            {expanded && (
                <div className="px-3 pb-3 pt-1 border-t border-current/10 space-y-1.5 text-sm">
                    {block.type === "richtext" && block.richtextData && (
                        <div
                            className="prose prose-sm prose-slate dark:prose-invert max-w-none text-xs leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: block.richtextData }}
                        />
                    )}
                    {block.type === "callout" && (
                        <div>
                            {block.calloutTitle && <p className="font-semibold text-xs">{block.calloutTitle}</p>}
                            {block.calloutText && <p className="text-xs text-muted-foreground">{block.calloutText}</p>}
                        </div>
                    )}
                    {block.type === "image" && (
                        <p className="text-xs text-muted-foreground italic">{block.imageCaption ?? "— kein Caption —"}</p>
                    )}
                    {block.type === "video" && (
                        <p className="text-xs text-muted-foreground italic">{block.videoCaption ?? "— kein Caption —"}</p>
                    )}
                    {block.type === "interactive" && (
                        <div>
                            <p className="text-xs font-medium">Subtyp: <span className="text-primary">{block.interactiveSubtype}</span></p>
                            {block.interactiveData?.description && (
                                <p className="text-xs text-muted-foreground">{block.interactiveData.description}</p>
                            )}
                            {block.interactiveData?.title && (
                                <p className="text-xs text-muted-foreground">Titel: {block.interactiveData.title}</p>
                            )}
                        </div>
                    )}
                    {block.type === "divider" && (
                        <div className="h-px bg-muted-foreground/20 my-1" />
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Preview panel for all generated blocks ──────────────────────────────────

function GeneratedBlocksPreview({
                                    blocks,
                                    onAccept,
                                    onDiscard,
                                    parseError,
                                    rawContent,
                                }: {
    blocks: any[];
    onAccept: () => void;
    onDiscard: () => void;
    parseError?: boolean;
    rawContent?: string;
}) {
    const [showRaw, setShowRaw] = useState(false);

    const typeCounts = blocks.reduce((acc: Record<string, number>, b) => {
        acc[b.type] = (acc[b.type] ?? 0) + 1;
        return acc;
    }, {});

    return (
        <div className="border border-amber-400/50 rounded-xl overflow-hidden bg-amber-50/50 dark:bg-amber-950/20">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-amber-500/10 border-b border-amber-400/30">
                <div className="flex items-center gap-2">
                    <span className="text-amber-600 dark:text-amber-400 text-sm font-bold">
                        ✨ KI hat {blocks.length} Blöcke generiert
                    </span>
                    {parseError && (
                        <span className="flex items-center gap-1 text-xs text-orange-500 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="h-3 w-3" />
                            Fallback-Modus
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {Object.entries(typeCounts).map(([type, count]) => {
                        const meta = BLOCK_COLORS[type] ?? BLOCK_COLORS.default;
                        return (
                            <span key={type} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${meta.border} ${meta.bg}`}>
                                {meta.icon} {type} ×{count}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Block list */}
            <div className="p-3 space-y-1.5 max-h-72 overflow-y-auto">
                {blocks.map((block, idx) => (
                    <BlockPreviewCard key={block.id ?? idx} block={block} index={idx} />
                ))}
            </div>

            {/* Raw content toggle (debug) */}
            {parseError && rawContent && (
                <div className="px-3 pb-2">
                    <button
                        onClick={() => setShowRaw(r => !r)}
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                        {showRaw ? "Raw ausblenden" : "Rohantwort anzeigen (Debug)"}
                    </button>
                    {showRaw && (
                        <pre className="mt-2 text-xs bg-muted rounded p-2 overflow-x-auto max-h-32">
                            {rawContent}
                        </pre>
                    )}
                </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 px-3 pb-3">
                <Button onClick={onAccept} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Alle {blocks.length} Blöcke übernehmen
                </Button>
                <Button onClick={onDiscard} variant="outline" className="flex-1 border-red-400/60 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                    <XCircle className="w-4 h-4 mr-2" />
                    Verwerfen
                </Button>
            </div>
        </div>
    );
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

export default function EnhancedTopicDialog({
                                                open,
                                                onOpenChange,
                                                topicForm,
                                                setTopicForm,
                                                onSave,
                                                editingTopic,
                                            }: EnhancedTopicDialogProps) {
    const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiGenerating, setAiGenerating] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [previewBlocks, setPreviewBlocks] = useState<any[] | null>(null);
    const [previewMeta, setPreviewMeta] = useState<{ parseError?: boolean; rawContent?: string } | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const handleAIGenerate = async () => {
        if (!topicForm.title?.trim()) {
            setAiError("Bitte geben Sie zuerst einen Titel ein.");
            return;
        }

        setAiGenerating(true);
        setPreviewBlocks(null);
        setPreviewMeta(null);
        setAiError(null);

        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("title", topicForm.title);
            formData.append("prompt", aiPrompt);
            formData.append("outputFormat", "blocks");
            uploadedFiles.forEach(f => formData.append("files", f));

            const response = await fetch(`${API_URL}/ai/generate-content`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
                throw new Error(err.message || `Serverfehler ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || "KI hat keinen Erfolg zurückgemeldet.");
            }

            if (!data.blocks || data.blocks.length === 0) {
                setAiError("Die KI hat keine Blöcke generiert. Versuchen Sie es erneut oder fügen Sie mehr Kontext hinzu.");
                return;
            }

            setPreviewBlocks(data.blocks);
            setPreviewMeta({
                parseError: data.parseError ?? false,
                rawContent: data.rawContent,
            });

        } catch (error: any) {
            console.error("AI generation error:", error);
            setAiError(`Fehler bei der KI-Generierung: ${error.message}`);
        } finally {
            setAiGenerating(false);
        }
    };

    const handleAcceptBlocks = () => {
        if (!previewBlocks) return;
        setTopicForm((prev: any) => ({
            ...prev,
            blocks: [...(prev.blocks ?? []), ...previewBlocks],
        }));
        setPreviewBlocks(null);
        setPreviewMeta(null);
        setAiPrompt("");
        setUploadedFiles([]);
        setActiveTab("write");
    };

    const handleDiscardBlocks = () => {
        setPreviewBlocks(null);
        setPreviewMeta(null);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editingTopic ? "Thema bearbeiten" : "Neues Thema erstellen"}
                    </DialogTitle>
                    <DialogDescription>
                        Erstellen Sie Inhalte manuell oder nutzen Sie KI-Unterstützung
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">

                    {/* ── Basic Info ── */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="topic-title">Titel *</Label>
                            <Input
                                id="topic-title"
                                value={topicForm.title ?? ""}
                                onChange={e => setTopicForm((p: any) => ({ ...p, title: e.target.value }))}
                                placeholder="z.B. Grundlagen der Staplerfahrt"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="topic-duration">Geschätzte Dauer</Label>
                            <Input
                                id="topic-duration"
                                value={topicForm.duration ?? ""}
                                onChange={e => setTopicForm((p: any) => ({ ...p, duration: e.target.value }))}
                                placeholder="z.B. 15 min"
                            />
                        </div>
                    </div>


                    {/* ── Time Requirements ── */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="topic-min-duration" className="flex items-center gap-2">
                                <Timer className="w-4 h-4" />
                                Mindestzeit (Sekunden)
                            </Label>
                            <Input
                                id="topic-min-duration"
                                type="number"
                                value={topicForm.minDurationSeconds ?? ""}
                                onChange={e => setTopicForm((p: any) => ({ ...p, minDurationSeconds: e.target.value }))}
                                placeholder="z.B. 900 (15 Minuten)"
                            />
                        </div>
                        <div className="space-y-2 flex items-end">
                            <div className="flex items-center space-x-2 pb-2">
                                <Switch
                                    id="require-duration"
                                    checked={!!topicForm.requireMinDuration}
                                    onCheckedChange={checked => setTopicForm((p: any) => ({ ...p, requireMinDuration: checked }))}
                                />
                                <Label htmlFor="require-duration">Weiter-Button erst nach Ablauf aktivieren</Label>
                            </div>
                        </div>
                    </div>

                    {/* ── AI Assistant ── */}
                    <div className="border rounded-xl p-4 bg-primary/5 space-y-4">
                        <div className="flex items-center gap-2">
                            <Wand2 className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">KI-Assistent</h3>
                            <span className="text-xs text-muted-foreground ml-1">
                                Generiert automatisch 10–14 Blöcke (Text, Bilder-Platzhalter, Callouts, Videos, Übungen)
                            </span>
                        </div>

                        {/* Error message */}
                        {aiError && (
                            <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-950/30 border border-red-300/60 rounded-lg text-sm text-red-700 dark:text-red-400">
                                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold mb-0.5">Fehler bei der KI-Generierung</p>
                                    <p className="text-xs opacity-80">{aiError}</p>
                                </div>
                                <button onClick={() => setAiError(null)} className="ml-auto text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
                            </div>
                        )}

                        {/* Generated blocks preview */}
                        {previewBlocks && (
                            <GeneratedBlocksPreview
                                blocks={previewBlocks}
                                onAccept={handleAcceptBlocks}
                                onDiscard={handleDiscardBlocks}
                                parseError={previewMeta?.parseError}
                                rawContent={previewMeta?.rawContent}
                            />
                        )}

                        {/* Input form */}
                        {!previewBlocks && (
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="ai-prompt">Zusätzliche Anweisungen <span className="text-muted-foreground font-normal">(optional)</span></Label>
                                    <Textarea
                                        id="ai-prompt"
                                        value={aiPrompt}
                                        onChange={e => setAiPrompt(e.target.value)}
                                        placeholder="Lassen Sie das Feld leer — die KI erstellt den Inhalt automatisch anhand des Titels und der hochgeladenen Materialien."
                                        rows={2}
                                        disabled={aiGenerating}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Quelldokumente hochladen <span className="text-muted-foreground font-normal">(PDF, DOCX, TXT, Bilder — optional)</span></Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="file"
                                            onChange={handleFileUpload}
                                            multiple
                                            accept=".pdf,.docx,.txt,image/*"
                                            className="flex-1"
                                            disabled={aiGenerating}
                                        />
                                        {uploadedFiles.length > 0 && (
                                            <Button variant="outline" size="sm" onClick={() => setUploadedFiles([])} disabled={aiGenerating}>
                                                Löschen
                                            </Button>
                                        )}
                                    </div>
                                    {uploadedFiles.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {uploadedFiles.map((f, i) => (
                                                <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full border truncate max-w-[200px]">
                                                    {f.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <Button
                                    onClick={handleAIGenerate}
                                    disabled={aiGenerating || !topicForm.title?.trim()}
                                    className="w-full"
                                    variant="outline"
                                >
                                    {aiGenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            KI generiert Inhalte… (ca. 20–40 Sek.)
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-4 h-4 mr-2" />
                                            Inhalt mit KI generieren
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}

                        {/* Re-generate button when preview shown */}
                        {previewBlocks && (
                            <Button
                                onClick={() => { setPreviewBlocks(null); setPreviewMeta(null); }}
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-foreground w-full"
                            >
                                ↩ Andere Parameter eingeben und neu generieren
                            </Button>
                        )}
                    </div>

                    {/* ── Content Editor ── */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Inhalt <span className="text-muted-foreground font-normal text-xs">({(topicForm.blocks ?? []).length} Blöcke)</span></Label>
                            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="w-auto">
                                <TabsList className="grid w-[200px] grid-cols-2">
                                    <TabsTrigger value="write" className="flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        Bearbeiten
                                    </TabsTrigger>
                                    <TabsTrigger value="preview" className="flex items-center gap-1">
                                        <Eye className="w-3 h-3" />
                                        Vorschau
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        {activeTab === "write" ? (
                            <BlockEditor
                                blocks={topicForm.blocks ?? []}
                                onChange={(newBlocks: any) => setTopicForm((p: any) => ({ ...p, blocks: newBlocks }))}
                            />
                        ) : (
                            <div className="border rounded-xl p-4 min-h-[300px] overflow-auto bg-muted/20">
                                {(topicForm.blocks ?? []).length > 0 ? (
                                    <div className="space-y-2">
                                        {(topicForm.blocks as any[]).map((block: any, idx: number) => (
                                            <BlockPreviewCard key={block.id ?? idx} block={block} index={idx} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm text-center py-10">
                                        Keine Blöcke vorhanden. Fügen Sie Blöcke hinzu oder generieren Sie Inhalt mit der KI.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Abbrechen
                    </Button>
                    <Button onClick={onSave} disabled={!topicForm.title?.trim()}>
                        <Save className="w-4 h-4 mr-2" />
                        Speichern
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}