import { Suspense, lazy, useState, useRef } from "react";
import ReactPlayer from "react-player";
import { ContentBlock, CalloutStyle } from "@/types/course.types";
import { AlertCircle, Info, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

// Lazy-load 3D viewer to avoid initial bundle bloat
const Model3DViewer = lazy(() => import("./Model3DViewer"));
const StabilitySimulator = lazy(() => import("./interactive/StabilitySimulator"));
const DragOrderExercise = lazy(() => import("./interactive/DragOrderExercise"));
const HotspotExercise = lazy(() => import("./interactive/HotspotExercise"));
const TrueFalseExercise = lazy(() => import("./interactive/TrueFalseExercise"));
const AnnotatedImageExercise = lazy(() => import("./interactive/AnnotatedImageExercise"));

// ─── Callout ──────────────────────────────────────────────────────────────────

const CALLOUT_CONFIG: Record<CalloutStyle, { bg: string; border: string; icon: React.FC<{ className?: string }> }> = {
    info: { bg: "bg-blue-500/10", border: "border-blue-500/40", icon: Info },
    warning: { bg: "bg-amber-500/10", border: "border-amber-500/40", icon: AlertTriangle },
    danger: { bg: "bg-red-500/10", border: "border-red-500/40", icon: AlertCircle },
    success: { bg: "bg-emerald-500/10", border: "border-emerald-500/40", icon: CheckCircle2 },
};

// ─── Rich Text ────────────────────────────────────────────────────────────────

function RichTextBlock({ data }: { data: string }) {
    // TipTap outputs HTML via renderToHTML or JSON. We store HTML string.
    return (
        <div
            className="prose prose-invert prose-slate max-w-none
        prose-headings:text-white prose-headings:font-bold
        prose-p:text-slate-300 prose-p:leading-relaxed prose-p:text-lg
        prose-strong:text-white
        prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline
        prose-code:text-amber-300 prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
        prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700
        prose-blockquote:border-l-amber-500 prose-blockquote:text-slate-400
        prose-ul:text-slate-300 prose-ol:text-slate-300
        prose-li:marker:text-amber-500
        prose-img:rounded-xl prose-img:shadow-lg prose-img:border prose-img:border-slate-700
        prose-table:text-slate-300
        prose-th:text-white prose-th:bg-slate-800
        prose-td:border-slate-700"
            dangerouslySetInnerHTML={{ __html: data }}
        />
    );
}

// ─── Video Block ──────────────────────────────────────────────────────────────

function VideoBlock({ url }: { url: string }) {
    const isExternal = url.includes("youtube") || url.includes("youtu.be") || url.includes("vimeo");

    if (isExternal) {
        return (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shadow-xl">
                <ReactPlayer
                    url={url}
                    width="100%"
                    height="100%"
                    controls
                    config={{
                        youtube: { playerVars: { rel: 0 } },
                    }}
                />
            </div>
        );
    }

    return (
        <div className="rounded-xl overflow-hidden border border-slate-700 shadow-xl">
            <video
                src={url}
                controls
                className="w-full max-h-[480px] bg-black"
                preload="metadata"
            />
        </div>
    );
}

// ─── Image Block ──────────────────────────────────────────────────────────────

function ImageBlock({ url, caption, scale, align }: { url: string; caption?: string; scale?: number; align?: string }) {
    const [lightbox, setLightbox] = useState(false);
    const imgStyle: React.CSSProperties = {
        width: scale && scale < 100 ? `${scale}%` : "100%",
        display: "block",
    };
    const wrapAlign = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";

    return (
        <>
            <figure className="space-y-2">
                <div style={{ display: "flex", justifyContent: wrapAlign }}>
                    <img
                        src={url}
                        alt={caption ?? ""}
                        style={imgStyle}
                        className="rounded-xl border border-slate-700 shadow-xl cursor-zoom-in hover:brightness-110 transition-all"
                        onClick={() => setLightbox(true)}
                        loading="lazy"
                    />
                </div>
                {caption && (
                    <figcaption className="text-center text-sm text-slate-500 italic">{caption}</figcaption>
                )}
            </figure>

            {lightbox && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
                    onClick={() => setLightbox(false)}
                >
                    <img
                        src={url}
                        alt={caption ?? ""}
                        className="max-w-full max-h-full object-contain rounded-xl"
                    />
                </div>
            )}
        </>
    );
}

// ─── Embed Block ──────────────────────────────────────────────────────────────

function EmbedBlock({ url, height = 450 }: { url: string; height?: number }) {
    return (
        <div
            className="rounded-xl overflow-hidden border border-slate-700 shadow-xl"
            style={{ height }}
        >
            <iframe
                src={url}
                title="Embedded content"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups"
            />
        </div>
    );
}

// ─── Callout Block ────────────────────────────────────────────────────────────

function CalloutBlock({
                          style = "info",
                          title,
                          text,
                      }: {
    style?: CalloutStyle;
    title?: string;
    text: string;
}) {
    const cfg = CALLOUT_CONFIG[style];
    const Icon = cfg.icon;

    return (
        <div className={`flex gap-4 p-5 rounded-xl border ${cfg.bg} ${cfg.border}`}>
            <Icon className="h-5 w-5 flex-shrink-0 mt-0.5 text-current opacity-80" />
            <div>
                {title && <p className="font-semibold text-white mb-1">{title}</p>}
                <p className="text-slate-300 text-base leading-relaxed">{text}</p>
            </div>
        </div>
    );
}

// ─── Divider Block ────────────────────────────────────────────────────────────

function DividerBlock() {
    return <hr className="border-slate-700 my-2" />;
}

// ─── Interactive Block ────────────────────────────────────────────────────────

function InteractiveBlock({ block }: { block: ContentBlock }) {
    const { interactiveSubtype, interactiveData } = block;
    const fallback = (
        <div className="h-32 flex items-center justify-center text-slate-500">
            <div className="w-6 h-6 border-2 border-slate-600 border-t-amber-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <Suspense fallback={fallback}>
            {interactiveSubtype === "stability-sim" && (
                <StabilitySimulator data={interactiveData} />
            )}
            {interactiveSubtype === "drag-order" && (
                <DragOrderExercise data={interactiveData} />
            )}
            {interactiveSubtype === "hotspot" && (
                <HotspotExercise data={interactiveData} />
            )}
            {interactiveSubtype === "truefalse" && (
                <TrueFalseExercise data={interactiveData} />
            )}
            {interactiveSubtype === "annotated-image" && (
                <AnnotatedImageExercise data={interactiveData} />
            )}
        </Suspense>
    );
}

// ─── Main BlockRenderer ───────────────────────────────────────────────────────

function BlockContent({ block }: { block: ContentBlock }) {
    switch (block.type) {
        case "richtext":
            return block.richtextData ? <RichTextBlock data={block.richtextData} /> : null;

        case "video":
            return block.videoUrl ? (
                <VideoBlock url={block.videoUrl} />
            ) : (
                <div className="flex flex-col items-center justify-center gap-3 p-8 bg-slate-800/60 border-2 border-dashed border-slate-600 rounded-xl text-center">
                    <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <p className="text-slate-300 font-medium text-sm">Miejsce na wideo</p>
                        {(block as any).videoCaption && (
                            <p className="text-amber-400/80 text-xs mt-1 italic">{(block as any).videoCaption}</p>
                        )}
                    </div>
                </div>
            );

        case "image":
            return block.imageUrl ? (
                <ImageBlock url={block.imageUrl} caption={block.imageCaption} scale={(block as any).imageScale} align={(block as any).imageAlign} />
            ) : (
                <div className="flex flex-col items-center justify-center gap-3 p-8 bg-slate-800/60 border-2 border-dashed border-slate-600 rounded-xl text-center">
                    <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                        <p className="text-slate-300 font-medium text-sm">Miejsce na zdjęcie</p>
                        {block.imageCaption && (
                            <p className="text-amber-400/80 text-xs mt-1 italic">{block.imageCaption}</p>
                        )}
                    </div>
                </div>
            );

        case "model3d":
            return block.modelUrl ? (
                <Suspense fallback={
                    <div className="h-64 flex items-center justify-center bg-slate-900 rounded-xl border border-slate-700 text-slate-500">
                        <div className="text-center space-y-2">
                            <div className="w-8 h-8 border-2 border-slate-600 border-t-amber-500 rounded-full animate-spin mx-auto" />
                            <p className="text-sm">Ładowanie modelu 3D…</p>
                        </div>
                    </div>
                }>
                    <Model3DViewer
                        url={block.modelUrl}
                        label={block.modelLabel}
                        annotations={block.modelAnnotations}
                    />
                </Suspense>
            ) : null;

        case "embed":
            return block.embedUrl ? (
                <EmbedBlock url={block.embedUrl} height={block.embedHeight} />
            ) : null;

        case "callout":
            return block.calloutText ? (
                <CalloutBlock
                    style={block.calloutStyle}
                    title={block.calloutTitle}
                    text={block.calloutText}
                />
            ) : null;

        case "divider":
            return <DividerBlock />;

        case "interactive":
            return <InteractiveBlock block={block} />;

        default:
            return null;
    }
}

export default function BlockRenderer({ block }: { block: ContentBlock }) {
    return <BlockContent block={block} />;
}

// Group blocks by rows for half-width layout
export function BlocksRenderer({ blocks }: { blocks: ContentBlock[] }) {
    const sorted = blocks.slice().sort((a, b) => a.order - b.order);

    const rows: ContentBlock[][] = [];
    let i = 0;
    while (i < sorted.length) {
        const block = sorted[i];
        if (block.width === 'half' && i + 1 < sorted.length && sorted[i + 1].width === 'half') {
            rows.push([block, sorted[i + 1]]);
            i += 2;
        } else {
            rows.push([block]);
            i += 1;
        }
    }

    return (
        <div className="space-y-6">
            {rows.map((row, rowIdx) => (
                <div key={rowIdx} className={`flex gap-6 ${row.length > 1 ? 'flex-col sm:flex-row' : ''}`}>
                    {row.map(block => (
                        <div key={block.id} className={row.length > 1 ? 'flex-1 min-w-0' : 'w-full'}>
                            <BlockContent block={block} />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}