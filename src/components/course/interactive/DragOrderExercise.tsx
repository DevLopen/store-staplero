import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Item {
  id: string;
  label: string;
}

// ─── Sortable Item ────────────────────────────────────────────────────────────

function SortableItem({ item, status }: { item: Item; status?: "correct" | "wrong" | null }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 p-3 rounded-lg border select-none transition-all
        ${isDragging ? "opacity-50 shadow-2xl scale-105 border-amber-500/60 bg-slate-700" : ""}
        ${status === "correct" ? "border-emerald-500/60 bg-emerald-500/10" :
          status === "wrong"   ? "border-red-500/60 bg-red-500/10" :
          "border-slate-700 bg-slate-800/60 hover:border-slate-600"}
      `}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <span className="flex-1 text-slate-200 text-sm">{item.label}</span>
      {status === "correct" && <CheckCircle className="h-4 w-4 text-emerald-400" />}
      {status === "wrong" && <XCircle className="h-4 w-4 text-red-400" />}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface DragOrderExerciseProps {
  data?: Record<string, unknown>;
}

export default function DragOrderExercise({ data }: DragOrderExerciseProps) {
  const title = (data?.title as string) ?? "Ułóż czynności we właściwej kolejności";
  const rawItems = (data?.items as Item[]) ?? [
    { id: "1", label: "Sprawdź poziom paliwa / naładowanie baterii" },
    { id: "2", label: "Uruchom wózek i sprawdź sygnały alarmowe" },
    { id: "3", label: "Przeprowadź oględziny zewnętrzne" },
    { id: "4", label: "Sprawdź stan wideł i masztu" },
    { id: "5", label: "Zaciągnij hamulec ręczny i wejdź na stanowisko" },
  ];
  const correctOrder = (data?.correctOrder as string[]) ?? rawItems.map(i => i.id);

  const shuffle = (arr: Item[]) => [...arr].sort(() => Math.random() - 0.5);
  const [items, setItems] = useState(() => shuffle(rawItems));
  const [checked, setChecked] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, "correct" | "wrong">>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems(prev => {
        const oldIdx = prev.findIndex(i => i.id === active.id);
        const newIdx = prev.findIndex(i => i.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
      setChecked(false);
      setStatuses({});
    }
  };

  const checkAnswer = () => {
    const newStatuses: Record<string, "correct" | "wrong"> = {};
    items.forEach((item, idx) => {
      newStatuses[item.id] = item.id === correctOrder[idx] ? "correct" : "wrong";
    });
    setStatuses(newStatuses);
    setChecked(true);
  };

  const reset = () => {
    setItems(shuffle(rawItems));
    setChecked(false);
    setStatuses({});
  };

  const allCorrect = checked && Object.values(statuses).every(s => s === "correct");

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
          <span className="text-purple-400 text-lg">↕</span>
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">{title}</h3>
          <p className="text-slate-500 text-xs">Przeciągnij elementy we właściwej kolejności</p>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map(item => (
                <SortableItem
                  key={item.id}
                  item={item}
                  status={checked ? statuses[item.id] : null}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="flex gap-3 mt-4">
          <Button
            onClick={checkAnswer}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
          >
            Sprawdź odpowiedź
          </Button>
          <Button onClick={reset} variant="outline" className="border-slate-600 text-slate-300">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {checked && (
          <div className={`p-3 rounded-lg text-sm ${
            allCorrect
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border border-red-500/30 text-red-300"
          }`}>
            {allCorrect
              ? "✅ Doskonale! Kolejność jest poprawna."
              : "❌ Kolejność nie jest poprawna. Spróbuj ponownie."}
          </div>
        )}
      </div>
    </div>
  );
}
