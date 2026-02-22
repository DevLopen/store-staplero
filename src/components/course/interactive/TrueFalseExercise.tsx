import { useState, useCallback } from "react";
import { CheckCircle, XCircle, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Card {
  id: string;
  statement: string;
  isTrue: boolean;
}

interface Props {
  data?: Record<string, any>;
}

export default function TrueFalseExercise({ data }: Props) {
  const title: string = data?.title ?? "Prawda czy Fałsz?";
  const cards: Card[] = data?.cards ?? [];

  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<Record<string, "correct" | "wrong" | null>>({});
  const [answered, setAnswered] = useState(false);
  const [done, setDone] = useState(false);

  if (cards.length === 0) {
    return <div className="text-center text-gray-400 py-8">Brak kart do wyświetlenia</div>;
  }

  const card = cards[current];
  const cardResult = results[card.id];

  const answer = (choice: boolean) => {
    if (answered) return;
    const correct = choice === card.isTrue;
    setResults(r => ({ ...r, [card.id]: correct ? "correct" : "wrong" }));
    setAnswered(true);
  };

  const next = () => {
    if (current < cards.length - 1) {
      setCurrent(c => c + 1);
      setAnswered(false);
    } else {
      setDone(true);
    }
  };

  const reset = () => {
    setCurrent(0);
    setResults({});
    setAnswered(false);
    setDone(false);
  };

  const correctCount = Object.values(results).filter(r => r === "correct").length;

  if (done) {
    const pct = Math.round((correctCount / cards.length) * 100);
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-3xl font-black ${pct >= 70 ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>
            {pct}%
          </div>
          <h3 className="text-xl font-bold text-gray-900">{pct >= 70 ? "Świetnie!" : "Spróbuj jeszcze raz"}</h3>
          <p className="text-gray-500">{correctCount} z {cards.length} odpowiedzi poprawnych</p>
          <Button onClick={reset} className="bg-amber-500 hover:bg-amber-400 text-white gap-2">
            <RotateCcw className="h-4 w-4" /> Zacznij od nowa
          </Button>
        </div>
    );
  }

  return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <span className="text-sm text-gray-400">{current + 1} / {cards.length}</span>
        </div>

        {/* Progress */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full transition-all duration-500"
               style={{ width: `${((current) / cards.length) * 100}%` }} />
        </div>

        {/* Card */}
        <div className={`relative rounded-2xl border-2 p-8 text-center transition-all min-h-[180px] flex flex-col items-center justify-center gap-4 ${
            !answered ? "border-gray-200 bg-gray-50" :
                cardResult === "correct" ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"
        }`}>
          <p className="text-lg font-semibold text-gray-800 leading-relaxed">{card.statement}</p>

          {answered && (
              <div className={`flex items-center gap-2 text-sm font-bold ${cardResult === "correct" ? "text-green-600" : "text-red-600"}`}>
                {cardResult === "correct" ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                {cardResult === "correct" ? "Poprawnie!" : `Błąd — odpowiedź: ${card.isTrue ? "PRAWDA" : "FAŁSZ"}`}
              </div>
          )}
        </div>

        {/* Buttons */}
        {!answered ? (
            <div className="flex gap-3">
              <button onClick={() => answer(false)}
                      className="flex-1 py-4 rounded-2xl border-2 border-red-300 bg-red-50 text-red-700 font-bold text-lg hover:bg-red-100 hover:border-red-400 transition-all active:scale-95 flex items-center justify-center gap-2">
                <ChevronLeft className="h-6 w-6" /> FAŁSZ
              </button>
              <button onClick={() => answer(true)}
                      className="flex-1 py-4 rounded-2xl border-2 border-green-300 bg-green-50 text-green-700 font-bold text-lg hover:bg-green-100 hover:border-green-400 transition-all active:scale-95 flex items-center justify-center gap-2">
                PRAWDA <ChevronRight className="h-6 w-6" />
              </button>
            </div>
        ) : (
            <Button onClick={next} className="w-full bg-amber-500 hover:bg-amber-400 text-white font-semibold py-3 rounded-xl">
              {current < cards.length - 1 ? "Następna karta →" : "Zobacz wynik"}
            </Button>
        )}
      </div>
  );
}