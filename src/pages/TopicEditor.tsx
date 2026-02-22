import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Save,
  Eye,
  Wand2,
  Upload,
  X,
  Loader2,
  FileText,
  Video,
  Image as ImageIcon,
  Box,
  Code,
  AlertCircle,
  Minus,
  Gamepad2
} from "lucide-react";
import { ContentBlock } from "@/types/course.types";
import BlockEditor from "@/components/admin/BlockEditor";
import BlockRenderer from "@/components/course/BlockRenderer";
import { BlocksRenderer } from "@/components/course/BlockRenderer";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function TopicEditor() {
  const { courseId, chapterId, topicId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "ai">("edit");

  // Topic form
  const [form, setForm] = useState({
    title: "",
    duration: "15 min",
    videoUrl: "",
    minDurationSeconds: "",
    requireMinDuration: false,
    blocks: [] as ContentBlock[],
    content: "" // Backward compatibility
  });

  // AI state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Load existing topic
  useEffect(() => {
    if (!topicId) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    fetch(`${API_URL}/courses/admin/${courseId}/chapters/${chapterId}/topics/${topicId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(topic => {
          setForm({
            title: topic.title || "",
            duration: topic.duration || "15 min",
            videoUrl: topic.videoUrl || "",
            minDurationSeconds: topic.minDurationSeconds?.toString() || "",
            requireMinDuration: topic.requireMinDuration || false,
            blocks: topic.blocks || [],
            content: topic.content || ""
          });
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          toast({
            title: "Fehler",
            description: "Thema konnte nicht geladen werden",
            variant: "destructive"
          });
          setLoading(false);
        });
  }, [topicId, courseId, chapterId]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Titel ein",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      const payload = {
        title: form.title,
        duration: form.duration,
        videoUrl: form.videoUrl || null,
        minDurationSeconds: form.minDurationSeconds ? parseInt(form.minDurationSeconds) : null,
        requireMinDuration: form.requireMinDuration,
        blocks: form.blocks,
        content: form.content // Backward compatibility
      };

      const url = topicId
          ? `${API_URL}/courses/admin/${courseId}/chapters/${chapterId}/topics/${topicId}`
          : `${API_URL}/courses/admin/${courseId}/chapters/${chapterId}/topics`;

      const method = topicId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }

      toast({
        title: "Erfolg",
        description: topicId ? "Thema aktualisiert" : "Neues Thema erstellt"
      });

      navigate(`/admin`);

    } catch (err: any) {
      toast({
        title: "Fehler",
        description: err.message || "Serverfehler",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAIGenerate = async () => {
    if (!form.title.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie zuerst einen Titel ein",
        variant: "destructive"
      });
      return;
    }

    setAiGenerating(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      formData.append('title', form.title);
      formData.append('prompt', aiPrompt);
      formData.append('outputFormat', 'blocks'); // Request blocks format

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

      if (data.success && data.blocks) {
        // Append new blocks
        setForm(prev => ({
          ...prev,
          blocks: [...prev.blocks, ...data.blocks]
        }));

        setAiPrompt("");
        setUploadedFiles([]);

        toast({
          title: "Erfolg",
          description: `KI-Inhalt generiert! ${data.blocksGenerated} Block(e) hinzugefügt.`
        });

        // Switch to edit tab to see results
        setActiveTab("edit");
      } else {
        throw new Error('Keine Inhalte erhalten');
      }

    } catch (error: any) {
      console.error("AI generation error:", error);
      toast({
        title: "Fehler",
        description: `KI-Generierung fehlgeschlagen: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setAiGenerating(false);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/admin")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Zurück
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">
                    {topicId ? "Thema bearbeiten" : "Neues Thema erstellen"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Erstellen Sie ansprechende Inhalte mit Blöcken oder KI
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    onClick={() => setActiveTab("preview")}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Vorschau
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                      <Save className="w-4 h-4 mr-2" />
                  )}
                  Speichern
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="mb-6">
              <TabsTrigger value="edit">
                <FileText className="w-4 h-4 mr-2" />
                Bearbeiten
              </TabsTrigger>
              <TabsTrigger value="ai">
                <Wand2 className="w-4 h-4 mr-2" />
                KI-Assistent
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="w-4 h-4 mr-2" />
                Vorschau
              </TabsTrigger>
            </TabsList>

            {/* Basic Info (always visible) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-2">
                <Label>Titel *</Label>
                <Input
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="z.B. Grundlagen der Staplerfahrt"
                    className="mt-2"
                />
              </div>
              <div>
                <Label>Geschätzte Dauer</Label>
                <Input
                    value={form.duration}
                    onChange={(e) => setForm(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="z.B. 15 min"
                    className="mt-2"
                />
              </div>
            </div>

            {/* Advanced Settings */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-sm">Erweiterte Einstellungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Video URL (optional)</Label>
                  <Input
                      value={form.videoUrl}
                      onChange={(e) => setForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    YouTube, Vimeo oder direkter Link
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <Switch
                      checked={form.requireMinDuration}
                      onCheckedChange={(checked) =>
                          setForm(prev => ({ ...prev, requireMinDuration: checked }))
                      }
                  />
                  <div className="flex-1">
                    <Label>Mindestdauer erzwingen</Label>
                    <p className="text-xs text-muted-foreground">
                      Benutzer müssen mindestens X Sekunden auf dieser Seite verbringen
                    </p>
                  </div>
                  {form.requireMinDuration && (
                      <Input
                          type="number"
                          value={form.minDurationSeconds}
                          onChange={(e) => setForm(prev => ({ ...prev, minDurationSeconds: e.target.value }))}
                          placeholder="120"
                          className="w-24"
                      />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Edit Tab */}
            <TabsContent value="edit" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Inhaltsblöcke</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Fügen Sie Texte, Bilder, Videos, 3D-Modelle und interaktive Elemente hinzu
                  </p>
                </CardHeader>
                <CardContent>
                  <BlockEditor
                      blocks={form.blocks}
                      onChange={(blocks) => setForm(prev => ({ ...prev, blocks }))}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Tab */}
            <TabsContent value="ai" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5" />
                    KI-gestützte Inhaltserstellung
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Laden Sie Dokumente hoch und beschreiben Sie, welche Inhalte erstellt werden sollen
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* File Upload */}
                  <div>
                    <Label>Dateien hochladen (PDF, DOCX, Bilder)</Label>
                    <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                      <input
                          type="file"
                          multiple
                          accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Klicken oder Dateien hierher ziehen
                        </p>
                      </label>
                    </div>

                    {uploadedFiles.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {uploadedFiles.map((file, index) => (
                              <div
                                  key={index}
                                  className="flex items-center justify-between bg-muted p-2 rounded"
                              >
                                <span className="text-sm truncate flex-1">{file.name}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(index)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                          ))}
                        </div>
                    )}
                  </div>

                  {/* AI Prompt */}
                  <div>
                    <Label>Was soll die KI erstellen?</Label>
                    <Textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Beispiel: Erstelle eine Einführung zum Thema Staplerfahrt mit Sicherheitshinweisen und häufigen Fehlern"
                        className="mt-2 min-h-[120px]"
                    />
                  </div>

                  {/* Suggested Prompts */}
                  <div>
                    <Label className="mb-2 block">Vorschläge:</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Erstelle eine Schritt-für-Schritt-Anleitung",
                        "Füge Sicherheitshinweise hinzu",
                        "Erkläre häufige Fehler",
                        "Erstelle eine Checkliste",
                        "Füge interaktive Übungen hinzu"
                      ].map(suggestion => (
                          <Button
                              key={suggestion}
                              variant="outline"
                              size="sm"
                              onClick={() => setAiPrompt(prev => prev ? `${prev}\n\n${suggestion}` : suggestion)}
                          >
                            {suggestion}
                          </Button>
                      ))}
                    </div>
                  </div>

                  {/* Generate Button */}
                  <Button
                      onClick={handleAIGenerate}
                      disabled={aiGenerating || (!aiPrompt.trim() && uploadedFiles.length === 0)}
                      className="w-full"
                      size="lg"
                  >
                    {aiGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generiere Inhalt...
                        </>
                    ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Mit KI erstellen
                        </>
                    )}
                  </Button>

                  {/* Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950/30 dark:border-blue-900">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-900 dark:text-blue-100">
                        <p className="font-medium mb-1">So funktioniert's:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                          <li>Laden Sie relevante Dokumente hoch (PDF, DOCX, Bilder)</li>
                          <li>Beschreiben Sie, welche Inhalte erstellt werden sollen</li>
                          <li>Die KI analysiert die Dateien und erstellt passende Blöcke</li>
                          <li>Die generierten Blöcke werden automatisch hinzugefügt</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle>Vorschau</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    So sehen Ihre Kursteilnehmer den Inhalt
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <h1 className="text-3xl font-bold mb-2">{form.title || "Unbenanntes Thema"}</h1>
                    {form.duration && (
                        <p className="text-muted-foreground mb-6">⏱️ {form.duration}</p>
                    )}

                    {form.blocks.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>Brak bloków</p>
                          <p className="text-sm">Dodaj bloki lub użyj AI</p>
                        </div>
                    ) : (
                        <BlocksRenderer blocks={form.blocks} />
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
  );
}