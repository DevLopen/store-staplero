import { ContentBlock } from '@/types/course.types';
import ReactPlayer from 'react-player';
import { AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { lazy, Suspense } from 'react';

const Model3DViewer = lazy(() => import('./Model3DViewer'));
const StabilitySimulator = lazy(() => import('./interactive/StabilitySimulator'));
const DragOrderExercise = lazy(() => import('./interactive/DragOrderExercise'));
const HotspotExercise = lazy(() => import('./interactive/HotspotExercise'));

interface BlockRendererProps {
    blocks: ContentBlock[];
}

// Grupuj bloki według width
function groupBlocksByLayout(blocks: ContentBlock[]): (ContentBlock | ContentBlock[])[] {
    const result: (ContentBlock | ContentBlock[])[] = [];
    let i = 0;

    while (i < blocks.length) {
        const current = blocks[i];

        // Jeśli current jest half i next też half - grupuj
        if (current.width === 'half' && blocks[i + 1]?.width === 'half') {
            result.push([current, blocks[i + 1]]);
            i += 2;
        } else {
            result.push(current);
            i += 1;
        }
    }

    return result;
}

export default function BlockRenderer({ blocks }: BlockRendererProps) {
    if (!blocks || blocks.length === 0) {
        return <p className="text-muted-foreground">Brak treści</p>;
    }

    const grouped = groupBlocksByLayout(blocks);

    return (
        <div className="space-y-6">
            {grouped.map((item, idx) => {
                // Jeśli to para bloków half
                if (Array.isArray(item)) {
                    return (
                        <div key={`group-${idx}`} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {item.map(block => (
                                <div key={block.id}>
                                    <SingleBlock block={block} />
                                </div>
                            ))}
                        </div>
                    );
                }

                // Pojedynczy blok
                return <SingleBlock key={item.id} block={item} />;
            })}
        </div>
    );
}

function SingleBlock({ block }: { block: ContentBlock }) {
    switch (block.type) {
        case 'richtext':
            return <RichTextBlock data={block.richtextData || ''} />;

        case 'video':
            return <VideoBlock url={block.videoUrl || ''} />;

        case 'image':
            return <ImageBlock url={block.imageUrl || ''} caption={block.imageCaption} />;

        case 'model3d':
            return (
                <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
                    <Model3DViewer
                        modelUrl={block.modelUrl || ''}
                        annotations={block.modelAnnotations}
                    />
                </Suspense>
            );

        case 'embed':
            return <EmbedBlock url={block.embedUrl || ''} height={block.embedHeight} />;

        case 'callout':
            return (
                <CalloutBlock
                    style={block.calloutStyle || 'info'}
                    title={block.calloutTitle}
                    content={block.calloutContent || ''}
                />
            );

        case 'divider':
            return <hr className="my-8 border-t-2" />;

        case 'interactive':
            return <InteractiveBlock
                subtype={block.interactiveSubtype}
                config={block.interactiveData || block.interactiveConfig}  // ← próbuj oba
            />;

        default:
            return null;
    }
}

function RichTextBlock({ data }: { data: string }) {
    return (
        <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: data }}
        />
    );
}

function VideoBlock({ url }: { url: string }) {
    if (!url) return null;

    if (ReactPlayer.canPlay(url)) {
        return (
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <ReactPlayer url={url} width="100%" height="100%" controls />
            </div>
        );
    }

    return <video src={url} controls className="w-full rounded-lg" />;
}

function ImageBlock({ url, caption }: { url: string; caption?: string }) {
    if (!url) return null;

    return (
        <figure className="space-y-2">
            <img
                src={url}
                alt={caption || 'Obraz'}
                className="w-full rounded-lg"
            />
            {caption && (
                <figcaption className="text-sm text-muted-foreground text-center">
                    {caption}
                </figcaption>
            )}
        </figure>
    );
}

function EmbedBlock({ url, height }: { url: string; height?: number }) {
    if (!url) return null;

    return (
        <iframe
            src={url}
            className="w-full rounded-lg border"
            style={{ height: `${height || 400}px` }}
            title="Embed"
        />
    );
}

function CalloutBlock({
                          style,
                          title,
                          content
                      }: {
    style: 'info' | 'warning' | 'danger' | 'success';
    title?: string;
    content: string;
}) {
    const styles = {
        info: {
            bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900',
            icon: <Info className="w-5 h-5 text-blue-600" />
        },
        warning: {
            bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900',
            icon: <AlertTriangle className="w-5 h-5 text-amber-600" />
        },
        danger: {
            bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900',
            icon: <AlertCircle className="w-5 h-5 text-red-600" />
        },
        success: {
            bg: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900',
            icon: <CheckCircle className="w-5 h-5 text-green-600" />
        }
    };

    const current = styles[style];

    return (
        <div className={`border rounded-lg p-4 ${current.bg}`}>
            <div className="flex gap-3">
                <div className="flex-shrink-0">{current.icon}</div>
                <div className="flex-1">
                    {title && <h4 className="font-semibold mb-1">{title}</h4>}
                    <div className="text-sm">{content}</div>
                </div>
            </div>
        </div>
    );
}

function InteractiveBlock({ subtype, config }: { subtype?: string; config?: any }) {
    if (!subtype) return null;

    return (
        <Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded-lg" />}>
            {subtype === 'stability-sim' && <StabilitySimulator />}
            {subtype === 'drag-order' && <DragOrderExercise data={config} />}
            {subtype === 'hotspot' && <HotspotExercise data={config} />}
        </Suspense>
    );
}