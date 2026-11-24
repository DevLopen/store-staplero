import { Fragment, ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * Prosty format opisów produktów (wpisywany w panelu):
 *   **tekst**      → pogrubienie
 *   [tekst](/schulungen/slug) → link wewnętrzny
 *   - punkt / • punkt → lista punktowana
 *   ## Nagłówek    → śródtytuł
 *   pusta linia    → nowy akapit
 */
const renderBold = (text: string, key: string): ReactNode =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4
      ? <strong key={`${key}-${i}`} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
      : <Fragment key={`${key}-${i}`}>{part}</Fragment>
  );

/** **pogrubienie** oraz [tekst](/link) (tylko linki wewnętrzne, zaczynające się od „/”) */
export const renderInline = (text: string): ReactNode =>
  text.split(/(\[[^\]]+\]\(\/[^)\s]*\))/g).map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\((\/[^)\s]*)\)$/);
    return m
      ? <Link key={i} to={m[2]} className="font-semibold text-primary underline underline-offset-2 hover:no-underline">{renderBold(m[1], `l${i}`)}</Link>
      : <Fragment key={i}>{renderBold(part, `t${i}`)}</Fragment>;
  });

type Block = { kind: "p" | "h" | "ul"; lines: string[] };

const BULLET = /^\s*(?:[-•*]|–)\s+/;

const parse = (text: string): Block[] => {
  const blocks: Block[] = [];
  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    const last = blocks[blocks.length - 1];
    if (!line.trim()) { blocks.push({ kind: "p", lines: [] }); continue; }
    if (/^#{1,3}\s+/.test(line)) { blocks.push({ kind: "h", lines: [line.replace(/^#{1,3}\s+/, "")] }); continue; }
    if (BULLET.test(line)) {
      if (last?.kind === "ul") last.lines.push(line.replace(BULLET, ""));
      else blocks.push({ kind: "ul", lines: [line.replace(BULLET, "")] });
      continue;
    }
    if (last?.kind === "p") last.lines.push(line);
    else blocks.push({ kind: "p", lines: [line] });
  }
  return blocks.filter((b) => b.lines.length > 0);
};

const RichText = ({ text, className }: { text: string; className?: string }) => (
  <div className={cn("space-y-3", className)}>
    {parse(text).map((b, i) => {
      if (b.kind === "h") return <h3 key={i} className="pt-1 font-display text-lg font-bold text-foreground">{renderInline(b.lines[0])}</h3>;
      if (b.kind === "ul") return (
        <ul key={i} className="list-disc space-y-1 pl-5 marker:text-primary">
          {b.lines.map((l, j) => <li key={j}>{renderInline(l)}</li>)}
        </ul>
      );
      return <p key={i}>{b.lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{renderInline(l)}</Fragment>)}</p>;
    })}
  </div>
);

export default RichText;
