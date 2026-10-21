import type { QuizFigure as QuizFigureKey } from "@/seo/staplerQuiz.seo";
import { useLanguage } from "@/contexts/LanguageContext";
import { FIGURE_TEXT } from "@/i18n/staplerQuiz.i18n";
import plaketteImage from "@/assets/quiz-plakette.jpg";
import rampeImage from "@/assets/quiz-rampe.jpg";

// Rysunki przeniesione z quizu klienta; kolory z motywu strony (foreground / primary / border).

type FigureText = (typeof FIGURE_TEXT)["de"];

const Forklift = ({ x, y, loaded }: { x: number; y: number; loaded: boolean }) => (
    <g transform={`translate(${x},${y})`}>
        <rect className="fill-foreground" x="0" y="-46" width="34" height="34" rx="6" />
        <rect className="fill-primary" x="20" y="-34" width="62" height="22" rx="3" />
        <rect className="fill-foreground" x="40" y="-48" width="6" height="18" />
        <path className="stroke-foreground fill-none" strokeWidth="4" d="M28 -34 V-96 H84 V-34" />
        <rect className="fill-foreground" x="84" y="-110" width="7" height="102" />
        <rect className="fill-foreground" x="91" y="-14" width="52" height="5" />
        <rect className="fill-foreground" x="91" y="-40" width="5" height="30" />
        {loaded && (
            <>
                <rect className="fill-muted stroke-foreground" x="98" y="-48" width="46" height="34" strokeWidth="2" />
                <rect className="fill-foreground" x="98" y="-14" width="46" height="5" />
            </>
        )}
        <circle className="fill-foreground" cx="18" cy="-8" r="13" />
        <circle className="fill-background" cx="18" cy="-8" r="5" />
        <circle className="fill-foreground" cx="72" cy="-10" r="15" />
        <circle className="fill-background" cx="72" cy="-10" r="6" />
    </g>
);

const Ramp = ({ loaded, t }: { loaded: boolean; t: FigureText }) => (
    <svg viewBox="0 0 560 210" className="block h-auto w-full max-w-xl" role="img"
        aria-label={t.rampAlt(loaded)}>
        <path className="fill-muted" d="M260 190 L520 120 L520 190 Z" />
        <path className="stroke-foreground fill-none" strokeWidth="3" d="M10 190 H260 L520 120 H550" />
        <Forklift x={40} y={188} loaded={loaded} />
        <path className="stroke-primary fill-none" strokeWidth="4" strokeLinecap="round" d="M300 150 L470 104" />
        <path className="fill-primary" d="M478 102 L462 98 L466 112 Z" />
        <text className="fill-foreground font-mono" x="360" y="96" fontSize="15" fontWeight="500">{t.uphill}</text>
        <text className="fill-muted-foreground font-mono" x="290" y="178" fontSize="12">{t.slope}</text>
        <text className="fill-muted-foreground font-mono" x="40" y="24" fontSize="12">{loaded ? t.loaded : t.empty}</text>
    </svg>
);

const CAPACITY = { c: [500, 600, 700, 800, 900], q: [2000, 1700, 1450, 1250, 1100] };

const Diagramm = ({ t }: { t: FigureText }) => {
    const X = (v: number) => 70 + ((v - 450) / 500) * 440;
    const Y = (v: number) => 210 - ((v - 1000) / 1200) * 170;
    const points = CAPACITY.c.map((v, k) => `${X(v)},${Y(CAPACITY.q[k])}`).join(" ");
    return (
        <svg viewBox="0 0 540 268" className="block h-auto w-full max-w-xl" role="img"
            aria-label={t.chartAlt}>
            <text className="fill-foreground font-mono" x="70" y="18" fontSize="12" fontWeight="500">
                {t.chartTitle}
            </text>
            {[1000, 1400, 1800, 2200].map((v) => (
                <g key={v}>
                    <line className="stroke-border" x1="70" x2="510" y1={Y(v)} y2={Y(v)} />
                    <text className="fill-muted-foreground font-mono" x="62" y={Y(v) + 4} fontSize="11" textAnchor="end">{v}</text>
                </g>
            ))}
            <polyline className="stroke-primary fill-none" strokeWidth="3.5" points={points} />
            {CAPACITY.c.map((v, k) => (
                <g key={v}>
                    <text className="fill-muted-foreground font-mono" x={X(v)} y="230" fontSize="11" textAnchor="middle">{v}</text>
                    <circle className="fill-foreground" cx={X(v)} cy={Y(CAPACITY.q[k])} r="5" />
                    <text className="fill-foreground font-mono" x={X(v)} y={Y(CAPACITY.q[k]) - 11} fontSize="12" textAnchor="middle" fontWeight="500">
                        {CAPACITY.q[k]} kg
                    </text>
                </g>
            ))}
            <line className="stroke-foreground" strokeWidth="1.5" x1="70" x2="510" y1="210" y2="210" />
            <text className="fill-muted-foreground font-mono" x="290" y="256" fontSize="11" textAnchor="middle">
                {t.chartAxis}
            </text>
        </svg>
    );
};

const Photo = ({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) => (
    <img src={src} alt={alt} width={width} height={height} loading="lazy"
        className="block h-auto max-h-[360px] w-auto max-w-full rounded-md border border-border bg-muted object-contain" />
);

const QuizFigure = ({ figure }: { figure: QuizFigureKey }) => {
    const { language } = useLanguage();
    const t = FIGURE_TEXT[language] ?? FIGURE_TEXT.de;
    switch (figure) {
        case "plakette":
            return <Photo src={plaketteImage} width={733} height={1100} alt={t.plaketteAlt} />;
        case "rampe":
            return <Photo src={rampeImage} width={1018} height={820} alt={t.rampePhotoAlt} />;
        case "rampe-leer":
            return <Ramp loaded={false} t={t} />;
        case "diagramm":
            return <Diagramm t={t} />;
    }
};

export default QuizFigure;
