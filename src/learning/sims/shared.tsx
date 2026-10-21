import { useMemo } from "react";
import { LText, SimData } from "../types";
import { usePlayer } from "../LessonPlayer";
import type { Tx } from "./art";

/** Teksty symulacji: klucz = niemiecki tekst z demo, wartość LText w `data.texts` (edytowalne w kreatorze). */
export function useSimText(data: SimData): Tx {
    const { lang } = usePlayer();
    const texts = (data.texts ?? {}) as Record<string, LText>;
    return useMemo(() => (key, vars) => {
        const t = texts[key];
        const s = (t?.[lang]?.trim() ? t[lang] : t?.de) || key;
        return vars ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? "")) : s;
    }, [texts, lang]);
}

export const useNum = () => {
    const { lang } = usePlayer();
    const loc = { de: "de-DE", en: "en-GB", pl: "pl-PL", uk: "uk-UA" }[lang];
    return (n: number) => n.toLocaleString(loc);
};

/** Rysunek SVG z modułu art (kod generowany przez nas). */
export const Svg = ({ html, className = "sim", onClick }: { html: string; className?: string; onClick?: (e: React.MouseEvent<HTMLDivElement>) => void }) =>
    <div className={className} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;

/** Przełącznik segmentowy (np. Auto / Gabelstapler). */
export function Toggle<V extends string>({ value, options, onChange, label, disabled }: { value: V | null; options: [V, string][]; onChange: (v: V) => void; label: string; disabled?: boolean }) {
    return (
        <div className="toggle" role="group" aria-label={label}>
            {options.map(([v, l]) => <button key={v} type="button" disabled={disabled} aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>)}
        </div>
    );
}
