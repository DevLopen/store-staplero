/**
 * Odpowiedź na pytanie testu (moduł i egzamin): jeden wybór, wielokrotny wybór albo liczba do wpisania.
 * Odpowiedź zawsze jest jedną liczbą całkowitą ≥ 0, żeby serwer oceniał ją tak samo jak dotąd:
 * jeden wybór = indeks odpowiedzi, wielokrotny wybór = maska bitowa wybranych indeksów, liczba = wpisana wartość.
 */
import { permOf } from "../shuffle";
import type { ChoiceItem } from "../types";
import { usePlayer } from "../LessonPlayer";

export const isMulti = (it: ChoiceItem) => Array.isArray(it.correct);
export const isNumeric = (it: ChoiceItem) => !!it.unit;
const maskOf = (ks: number[]) => ks.reduce((m, k) => m | (1 << k), 0);
export function isRight(it: ChoiceItem, a: number | undefined) {
    if (a === undefined || a < 0) return false;
    return Array.isArray(it.correct) ? a === maskOf(it.correct) : a === it.correct;
}
/** Czy można przejść dalej: wielokrotny wybór wymaga zaznaczenia tylu odpowiedzi, ile jest poprawnych. */
export function isAnswered(it: ChoiceItem, a: number | undefined) {
    if (a === undefined || a < 0) return false;
    if (Array.isArray(it.correct)) { let n = 0; for (let m = a; m; m &= m - 1) n++; return n === it.correct.length; }
    return true;
}

export function AnswerInput({ it, value, onChange, seed }: { it: ChoiceItem; value: number | undefined; onChange: (a: number | undefined) => void; seed: string }) {
    const { x, t } = usePlayer();
    const img = it.img && <img className="q-img" src={it.img} alt="" loading="lazy" />;
    if (isNumeric(it)) return <>
        {img}
        <label className="num-in">
            <span>{t("numLabel")}</span>
            <span className="num-box">
                <input type="text" inputMode="numeric" autoComplete="off" value={value === undefined ? "" : String(value)}
                    onChange={e => { const d = e.target.value.replace(/\D/g, "").slice(0, 7); onChange(d ? Number(d) : undefined); }} />
                <b>{it.unit}</b>
            </span>
        </label>
    </>;
    const multi = Array.isArray(it.correct);
    const order = permOf(it.options.length, `${it.q.de ?? ""}|${seed}`);
    return <>
        {img}
        {multi && <p className="small multi-hint">{t("pickN", { n: (it.correct as number[]).length })}</p>}
        <div className="opts">{order.map(j => {
            const on = multi ? !!((value ?? 0) & (1 << j)) : value === j;
            return <button key={j} type="button" role={multi ? "checkbox" : undefined} aria-checked={multi ? on : undefined} aria-pressed={multi ? undefined : on}
                className={`opt ${on ? "sel" : ""} ${multi ? "multi" : ""}`}
                onClick={() => onChange(multi ? ((value ?? 0) ^ (1 << j)) || undefined : j)}>
                {multi && <i className="box" aria-hidden="true" />}{x(it.options[j])}
            </button>;
        })}</div>
    </>;
}
