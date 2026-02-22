import { useState } from "react";
import { nanoid } from "nanoid";
import { Quiz, QuizQuestion, QuestionType, DragOrderItem } from "@/types/course.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, GripVertical, CheckCircle } from "lucide-react";

const gen = (p = "") => `${p}${nanoid(8)}`;

function newQuestion(type: QuestionType = "single"): QuizQuestion {
  return {
    id: gen("qn_"),
    type,
    question: "",
    explanation: "",
    options: type === "single" || type === "multi" ? ["", "", "", ""] : undefined,
    items: type === "drag-order" ? [
      { id: gen("i_"), label: "" },
      { id: gen("i_"), label: "" },
    ] : undefined,
    hotspotImageUrl: type === "hotspot" ? "" : undefined,
    hotspots: type === "hotspot" ? [] : undefined,
  };
}

// ─── Single question editor ───────────────────────────────────────────────────

function QuestionEditor({
  question,
  index,
  onChange,
  onDelete,
}: {
  question: QuizQuestion;
  index: number;
  onChange: (q: QuizQuestion) => void;
  onDelete: () => void;
}) {
  const updateOption = (idx: number, val: string) => {
    const opts = [...(question.options ?? [])];
    opts[idx] = val;
    onChange({ ...question, options: opts });
  };

  const addOption = () => onChange({ ...question, options: [...(question.options ?? []), ""] });
  const removeOption = (idx: number) => {
    const opts = (question.options ?? []).filter((_, i) => i !== idx);
    onChange({ ...question, options: opts });
  };

  const updateDragItem = (idx: number, val: string) => {
    const items = [...(question.items ?? [])];
    items[idx] = { ...items[idx], label: val };
    onChange({ ...question, items });
  };

  const addDragItem = () => onChange({ ...question, items: [...(question.items ?? []), { id: gen("i_"), label: "" }] });
  const removeDragItem = (idx: number) => {
    const items = (question.items ?? []).filter((_, i) => i !== idx);
    onChange({ ...question, items });
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-amber-400 font-semibold text-sm">Pytanie {index + 1}</span>
        <div className="flex items-center gap-2">
          <Select
            value={question.type}
            onValueChange={val => onChange({ ...newQuestion(val as QuestionType), id: question.id, question: question.question })}
          >
            <SelectTrigger className="w-44 bg-slate-800 border-slate-700 text-slate-200 text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="single" className="text-slate-200 text-xs">Jednokrotny wybór</SelectItem>
              <SelectItem value="multi" className="text-slate-200 text-xs">Wielokrotny wybór</SelectItem>
              <SelectItem value="truefalse" className="text-slate-200 text-xs">Prawda / Fałsz</SelectItem>
              <SelectItem value="drag-order" className="text-slate-200 text-xs">Kolejność kroków</SelectItem>
              <SelectItem value="hotspot" className="text-slate-200 text-xs">Hotspot (zagrożenia)</SelectItem>
            </SelectContent>
          </Select>
          <Button size="icon" variant="ghost" onClick={onDelete} className="h-8 w-8 text-slate-500 hover:text-red-400">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Question text */}
      <div className="space-y-1.5">
        <Label className="text-slate-400 text-xs">Treść pytania *</Label>
        <Textarea
          value={question.question}
          onChange={e => onChange({ ...question, question: e.target.value })}
          placeholder="Wpisz treść pytania..."
          rows={2}
          className="bg-slate-800 border-slate-700 text-slate-200 resize-none"
        />
      </div>

      {/* Image */}
      <div className="space-y-1.5">
        <Label className="text-slate-400 text-xs">URL zdjęcia przy pytaniu (opcjonalny)</Label>
        <Input
          value={question.imageUrl ?? ""}
          onChange={e => onChange({ ...question, imageUrl: e.target.value })}
          placeholder="https://..."
          className="bg-slate-800 border-slate-700 text-slate-200"
        />
      </div>

      {/* Single / multi options */}
      {(question.type === "single" || question.type === "multi") && (
        <div className="space-y-2">
          <Label className="text-slate-400 text-xs">Opcje odpowiedzi</Label>
          {(question.options ?? []).map((opt, idx) => {
            const isCorrect = question.type === "single"
              ? question.correctAnswer === idx
              : (question.correctAnswers ?? []).includes(idx);

            return (
              <div key={idx} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (question.type === "single") {
                      onChange({ ...question, correctAnswer: idx });
                    } else {
                      const prev = question.correctAnswers ?? [];
                      onChange({
                        ...question,
                        correctAnswers: isCorrect ? prev.filter(i => i !== idx) : [...prev, idx],
                      });
                    }
                  }}
                  className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                    isCorrect ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-600 hover:border-emerald-500/60"
                  }`}
                  title="Zaznacz jako poprawna odpowiedź"
                >
                  {isCorrect && <CheckCircle className="h-3.5 w-3.5" />}
                </button>
                <Input
                  value={opt}
                  onChange={e => updateOption(idx, e.target.value)}
                  placeholder={`Opcja ${String.fromCharCode(65 + idx)}`}
                  className="bg-slate-800 border-slate-700 text-slate-200 flex-1"
                />
                <Button size="icon" variant="ghost" onClick={() => removeOption(idx)} className="h-8 w-8 text-slate-600 hover:text-red-400 flex-shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
          <Button variant="ghost" size="sm" onClick={addOption} className="text-slate-500 hover:text-slate-300 gap-1.5">
            <Plus className="h-3.5 w-3.5" />Dodaj opcję
          </Button>
          <p className="text-xs text-slate-600">Kliknij kwadrat, aby zaznaczyć poprawną odpowiedź</p>
        </div>
      )}

      {/* True / false */}
      {question.type === "truefalse" && (
        <div className="space-y-2">
          <Label className="text-slate-400 text-xs">Poprawna odpowiedź</Label>
          <div className="flex gap-3">
            {[true, false].map(val => (
              <button
                key={String(val)}
                type="button"
                onClick={() => onChange({ ...question, correctBool: val })}
                className={`flex-1 py-3 rounded-lg border font-medium transition-all ${
                  question.correctBool === val
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                {val ? "✅ Prawda" : "❌ Fałsz"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Drag-order */}
      {question.type === "drag-order" && (
        <div className="space-y-2">
          <Label className="text-slate-400 text-xs">Kroki (w poprawnej kolejności od góry)</Label>
          {(question.items ?? []).map((item, idx) => (
            <div key={item.id} className="flex items-center gap-2">
              <span className="text-slate-600 text-xs w-5 text-right">{idx + 1}.</span>
              <Input
                value={item.label}
                onChange={e => updateDragItem(idx, e.target.value)}
                placeholder={`Krok ${idx + 1}`}
                className="bg-slate-800 border-slate-700 text-slate-200 flex-1"
              />
              <Button size="icon" variant="ghost" onClick={() => removeDragItem(idx)} className="h-8 w-8 text-slate-600 hover:text-red-400 flex-shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={addDragItem} className="text-slate-500 hover:text-slate-300 gap-1.5">
            <Plus className="h-3.5 w-3.5" />Dodaj krok
          </Button>
          <p className="text-xs text-slate-600">Kolejność od góry = poprawna kolejność. Kursant będzie je mieszał.</p>
        </div>
      )}

      {/* Hotspot */}
      {question.type === "hotspot" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-slate-400 text-xs">URL zdjęcia (hotspot)</Label>
            <Input
              value={question.hotspotImageUrl ?? ""}
              onChange={e => onChange({ ...question, hotspotImageUrl: e.target.value })}
              placeholder="https://..."
              className="bg-slate-800 border-slate-700 text-slate-200"
            />
          </div>
          <div className="p-3 bg-slate-800 rounded-lg text-xs text-slate-500">
            Hotspoty definiuj w polu JSON konfiguracji bloku interaktywnego. Podaj x/y w % (0-100) oraz isHazard: true/false.
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="space-y-1.5">
        <Label className="text-slate-400 text-xs">Wyjaśnienie po odpowiedzi (opcjonalne)</Label>
        <Textarea
          value={question.explanation ?? ""}
          onChange={e => onChange({ ...question, explanation: e.target.value })}
          placeholder="Dlaczego ta odpowiedź jest poprawna..."
          rows={2}
          className="bg-slate-800 border-slate-700 text-slate-200 resize-none"
        />
      </div>
    </div>
  );
}

// ─── Main QuizBuilder ─────────────────────────────────────────────────────────

interface QuizBuilderProps {
  quiz: Partial<Quiz>;
  onChange: (q: Partial<Quiz>) => void;
  isFinal?: boolean;
}

export default function QuizBuilder({ quiz, onChange, isFinal = false }: QuizBuilderProps) {
  const questions = quiz.questions ?? [];

  const addQ = () => onChange({ ...quiz, questions: [...questions, newQuestion()] });
  const updateQ = (updated: QuizQuestion) =>
    onChange({ ...quiz, questions: questions.map(q => q.id === updated.id ? updated : q) });
  const deleteQ = (id: string) =>
    onChange({ ...quiz, questions: questions.filter(q => q.id !== id) });

  return (
    <div className="space-y-5">
      {/* Quiz settings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
        <div className="space-y-1.5">
          <Label className="text-slate-400 text-xs">Tytuł testu</Label>
          <Input
            value={quiz.title ?? ""}
            onChange={e => onChange({ ...quiz, title: e.target.value })}
            placeholder={isFinal ? "Test końcowy" : "Test rozdziału"}
            className="bg-slate-800 border-slate-700 text-slate-200"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-400 text-xs">Próg zaliczenia (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={quiz.passingScore ?? 70}
            onChange={e => onChange({ ...quiz, passingScore: Number(e.target.value) })}
            className="bg-slate-800 border-slate-700 text-slate-200"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-400 text-xs">Limit czasu (sekundy, 0 = brak)</Label>
          <Input
            type="number"
            min={0}
            value={quiz.timeLimitSeconds ?? 0}
            onChange={e => onChange({ ...quiz, timeLimitSeconds: Number(e.target.value) || undefined })}
            className="bg-slate-800 border-slate-700 text-slate-200"
          />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <QuestionEditor
            key={q.id}
            question={q}
            index={idx}
            onChange={updateQ}
            onDelete={() => deleteQ(q.id)}
          />
        ))}
      </div>

      <Button
        onClick={addQ}
        variant="outline"
        className="w-full border-dashed border-slate-700 text-slate-400 hover:border-amber-500/40 hover:text-amber-400 gap-2"
      >
        <Plus className="h-4 w-4" />
        Dodaj pytanie
      </Button>
    </div>
  );
}
