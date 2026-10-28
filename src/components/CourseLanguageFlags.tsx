import { Flag, FlagCode } from "@/components/FlagIcons";
import { useLanguage } from "@/contexts/LanguageContext";
import { CourseLanguage } from "@/types/product.types";
import { cn } from "@/lib/utils";

const FLAG_SIZE = {
  sm: "h-3 w-[18px]",
  md: "h-4 w-6",
  lg: "h-5 w-[30px]",
};

const FLAG_OF: Record<CourseLanguage, FlagCode> = {
  de: "DE", en: "EN", pl: "PL", uk: "UK", ru: "RU", ro: "RO",
};

interface CourseLanguageFlagsProps {
  languages: CourseLanguage[];
  /** Pokazuje nazwę języka obok flagi, gdy jest tylko jeden */
  withLabel?: boolean;
  /** Ile flag pokazać, reszta jako „+n” */
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** Flagi języków, w których prowadzony jest termin. Nazwy języków są w title/aria-label. */
const CourseLanguageFlags = ({ languages, withLabel, max, size = "sm", className }: CourseLanguageFlagsProps) => {
  const { t } = useLanguage();
  if (languages.length === 0) return null;
  const names = languages.map((code) => t(`courseLang.${code}`)).join(", ");

  return (
    <span className={cn("inline-flex items-center", size === "sm" ? "gap-1" : "gap-1.5", className)} title={names} aria-label={names}>
      {languages.slice(0, max ?? languages.length).map((code) => (
        <Flag key={code} code={FLAG_OF[code]} className={FLAG_SIZE[size]} />
      ))}
      {max != null && languages.length > max && (
        <span className="text-[11px] font-medium text-muted-foreground">+{languages.length - max}</span>
      )}
      {withLabel && languages.length === 1 && (
        <span className="ml-0.5 text-xs text-muted-foreground">{names}</span>
      )}
    </span>
  );
};

export default CourseLanguageFlags;
