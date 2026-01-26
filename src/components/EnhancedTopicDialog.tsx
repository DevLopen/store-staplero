import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Upload, Wand2, Save, Eye, FileText, Timer } from "lucide-react";

interface EnhancedTopicDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    topicForm: {
        title: string;
        content: string;
        duration: string;
        videoUrl: string;
        minDurationSeconds: string;
        requireMinDuration: boolean;
    };
    setTopicForm: (form: any) => void;
    onSave: () => void;
    editingTopic: any;
}

// Simple Markdown to HTML converter
function markdownToHTML(markdown: string): string {
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // Lists
    html = html.replace(/^\- (.*$)/gim, '<li class="ml-4">$1</li>');
    html = html.replace(/(<li.*<\/li>)/s, '<ul class="list-disc ml-6 my-2">$1</ul>');

    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-muted p-4 rounded-lg my-4 overflow-x-auto"><code>$2</code></pre>');

    // Inline code
    html = html.replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>');

    // Blockquotes
    html = html.replace(/^&gt; (.*$)/gim, '<blockquote class="border-l-4 border-primary pl-4 italic my-4">$1</blockquote>');

    // Line breaks
    html = html.replace(/\n\n/g, '<br/><br/>');

    return html;
}

export default function EnhancedTopicDialog({
                                                open,
                                                onOpenChange,
                                                topicForm,
                                                setTopicForm,
                                                onSave,
                                                editingTopic
                                            }: EnhancedTopicDialogProps) {
    const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiGenerating, setAiGenerating] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setUploadedFiles(prev => [...prev, ...files]);
        }
    };

    const handleAIGenerate = async () => {
        if (!aiPrompt.trim() && uploadedFiles.length === 0) {
            alert("Bitte geben Sie einen Prompt ein oder laden Sie Dateien hoch");
            return;
        }

        if (!topicForm.title.trim()) {
            alert("Bitte geben Sie zuerst einen Titel ein");
            return;
        }

        setAiGenerating(true);

        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();

            formData.append('title', topicForm.title);
            formData.append('prompt', aiPrompt);

            uploadedFiles.forEach(file => {
                formData.append('files', file);
            });

            const response = await fetch(`${API_URL}/ai/generate-content`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Fehler bei der Anfrage');
            }

            const data = await response.json();

            if (data.success && data.content) {
                setTopicForm(prev => ({
                    ...prev,
                    content: prev.content ? `${prev.content}\n\n${data.content}` : data.content
                }));

                setAiPrompt("");
                setUploadedFiles([]);
                alert(`Inhalt wurde erfolgreich generiert! ${data.filesProcessed} Datei(en) verarbeitet.`);
            } else {
                throw new Error('Keine Inhalte erhalten');
            }

        } catch (error: any) {
            console.error("AI generation error:", error);
            alert(`Fehler bei der AI-Generierung: ${error.message}`);
        } finally {
            setAiGenerating(false);
        }
    };

    const insertMarkdownTemplate = (type: string) => {
        const templates: Record<string, string> = {
            heading: "\n## Neue Überschrift\n",
            list: "\n- Element 1\n- Element 2\n- Element 3\n",
            code: "\n```javascript\n// Ihr Code hier\n```\n",
            quote: "\n> Wichtiger Hinweis\n",
            table: "\n| Spalte 1 | Spalte 2 |\n|----------|----------|\n| Wert 1   | Wert 2   |\n",
            bold: "**Fettgedruckter Text**",
            italic: "*Kursiver Text*",
        };

        const template = templates[type] || "";
        setTopicForm(prev => ({
            ...prev,
            content: prev.content + template
        }));
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
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="topic-title">Titel *</Label>
                            <Input
                                id="topic-title"
                                value={topicForm.title}
                                onChange={(e) => setTopicForm(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="z.B. Grundlagen der Staplerfahrt"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="topic-duration">Geschätzte Dauer</Label>
                            <Input
                                id="topic-duration"
                                value={topicForm.duration}
                                onChange={(e) => setTopicForm(prev => ({ ...prev, duration: e.target.value }))}
                                placeholder="z.B. 15 min"
                            />
                        </div>
                    </div>

                    {/* Video URL */}
                    <div className="space-y-2">
                        <Label htmlFor="topic-video">Video URL (optional)</Label>
                        <Input
                            id="topic-video"
                            value={topicForm.videoUrl}
                            onChange={(e) => setTopicForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                            placeholder="https://youtube.com/watch?v=..."
                        />
                    </div>

                    {/* Time Requirements */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="topic-min-duration" className="flex items-center gap-2">
                                <Timer className="w-4 h-4" />
                                Mindestzeit (Sekunden)
                            </Label>
                            <Input
                                id="topic-min-duration"
                                type="number"
                                value={topicForm.minDurationSeconds}
                                onChange={(e) => setTopicForm(prev => ({ ...prev, minDurationSeconds: e.target.value }))}
                                placeholder="z.B. 900 (15 Minuten)"
                            />
                        </div>
                        <div className="space-y-2 flex items-end">
                            <div className="flex items-center space-x-2 pb-2">
                                <Switch
                                    id="require-duration"
                                    checked={topicForm.requireMinDuration}
                                    onCheckedChange={(checked) => setTopicForm(prev => ({ ...prev, requireMinDuration: checked }))}
                                />
                                <Label htmlFor="require-duration">Weiter-Button erst nach Ablauf aktivieren</Label>
                            </div>
                        </div>
                    </div>

                    {/* AI Assistant */}
                    <div className="border rounded-lg p-4 bg-primary/5">
                        <div className="flex items-center gap-2 mb-3">
                            <Wand2 className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">AI-Assistent</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="ai-prompt">Beschreiben Sie den gewünschten Inhalt</Label>
                                <Textarea
                                    id="ai-prompt"
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="z.B. 'Erstelle eine Einführung in die Sicherheitsvorschriften beim Staplerfahren mit 3 Hauptpunkten'"
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Dateien hochladen (PDF, DOCX, TXT)</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="file"
                                        onChange={handleFileUpload}
                                        multiple
                                        accept=".pdf,.docx,.txt"
                                        className="flex-1"
                                    />
                                    <Button variant="outline" size="sm" onClick={() => setUploadedFiles([])}>
                                        Zurücksetzen
                                    </Button>
                                </div>
                                {uploadedFiles.length > 0 && (
                                    <div className="text-sm text-muted-foreground">
                                        {uploadedFiles.length} Datei(en) ausgewählt
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={handleAIGenerate}
                                disabled={aiGenerating}
                                className="w-full"
                                variant="outline"
                            >
                                {aiGenerating ? (
                                    <>Generiere Inhalt...</>
                                ) : (
                                    <>
                                        <Wand2 className="w-4 h-4 mr-2" />
                                        Inhalt mit AI generieren
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Content Editor */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Inhalt (Markdown)</Label>
                            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-auto">
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
                            <>
                                <div className="flex gap-2 mb-2 flex-wrap">
                                    <Button variant="outline" size="sm" onClick={() => insertMarkdownTemplate("heading")}>
                                        ## Überschrift
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => insertMarkdownTemplate("bold")}>
                                        **Fett**
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => insertMarkdownTemplate("italic")}>
                                        *Kursiv*
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => insertMarkdownTemplate("list")}>
                                        Liste
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => insertMarkdownTemplate("code")}>
                                        Code
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => insertMarkdownTemplate("quote")}>
                                        Zitat
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => insertMarkdownTemplate("table")}>
                                        Tabelle
                                    </Button>
                                </div>
                                <Textarea
                                    value={topicForm.content}
                                    onChange={(e) => setTopicForm(prev => ({ ...prev, content: e.target.value }))}
                                    placeholder="# Überschrift&#10;&#10;Ihr Inhalt hier...&#10;&#10;## Unterüberschrift&#10;&#10;- Punkt 1&#10;- Punkt 2"
                                    rows={20}
                                    className="font-mono text-sm"
                                />
                            </>
                        ) : (
                            <div className="border rounded-lg p-4 min-h-[400px] overflow-auto">
                                {topicForm.content ? (
                                    <div
                                        className="prose prose-slate max-w-none"
                                        dangerouslySetInnerHTML={{ __html: markdownToHTML(topicForm.content) }}
                                    />
                                ) : (
                                    <p className="text-muted-foreground">Keine Vorschau verfügbar. Fügen Sie Inhalt hinzu.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Abbrechen
                    </Button>
                    <Button onClick={onSave} disabled={!topicForm.title.trim()}>
                        <Save className="w-4 h-4 mr-2" />
                        Speichern
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}