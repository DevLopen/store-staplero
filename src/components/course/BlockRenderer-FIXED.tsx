import { lazy, Suspense } from 'react';
import { ContentBlock } from '@/types/course.types';
import ReactPlayer from 'react-player';
import { AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';

// Lazy load heavy components
const Model3DViewer = lazy(() => import('./Model3DViewer'));
const StabilitySimulator = lazy(() => import('./interactive/StabilitySimulator'));
const DragOrderExercise = lazy(() => import('./interactive/DragOrderExercise'));
const HotspotExercise = lazy(() => import('./interactive/HotspotExercise'));

interface BlockRendererProps {
  blocks: ContentBlock[];
}

// Helper do grupowania bloków według width
function groupBlocksByLayout(blocks: ContentBlock[]): (ContentBlock | ContentBlock[])[] {
  const result: (ContentBlock | ContentBlock[])[] = [];
  let i = 0;

  while (i < blocks.length) {
    const currentBlock = blocks[i];

    // Jeśli blok jest half i następny też half, grupuj je
    if (currentBlock.width === 'half' && i + 1 < blocks.length && blocks[i + 1].width === 'half') {
      result.push([currentBlock, blocks[i + 1]]);
      i += 2;
    } else {
      result.push(currentBlock);
      i += 1;
    }
  }

  return result;
}

export default function BlockRenderer({ blocks }: BlockRendererProps) {
  const groupedBlocks = groupBlocksByLayout(blocks);

  return (
    <div className="space-y-6">
      {groupedBlocks.map((item, index) => {
        // Jeśli to tablica (2 bloki obok siebie)
        if (Array.isArray(item)) {
          return (
            <div key={`group-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {item.map(block => (
                <div key={block.id}>
                  <SingleBlock block={block} />
                </div>
              ))}
            </div>
          );
        }

        // Pojedynczy blok
        return (
          <div key={item.id}>
            <SingleBlock block={item} />
          </div>
        );
      })}
    </div>
  );
}

// Komponent renderujący pojedynczy blok
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
      return <hr className="my-8 border-t-2 border-muted" />;
    
    case 'interactive':
      return <InteractiveBlock subtype={block.interactiveSubtype} config={block.interactiveConfig} />;
    
    default:
      return null;
  }
}

// ─── Komponenty bloków ────────────────────────────────────────────────────────

function RichTextBlock({ data }: { data: string }) {
  return (
    <div 
      className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-bold prose-p:text-foreground prose-li:text-foreground"
      dangerouslySetInnerHTML={{ __html: data }}
    />
  );
}

function VideoBlock({ url }: { url: string }) {
  if (!url) return null;

  // Check if it's YouTube/Vimeo
  if (ReactPlayer.canPlay(url)) {
    return (
      <div className="aspect-video rounded-lg overflow-hidden bg-black">
        <ReactPlayer 
          url={url}
          width="100%"
          height="100%"
          controls
          config={{
            youtube: {
              playerVars: { modestbranding: 1 }
            }
          }}
        />
      </div>
    );
  }

  // Native video
  return (
    <video 
      src={url} 
      controls 
      className="w-full rounded-lg"
    >
      Ihr Browser unterstützt dieses Video-Format nicht.
    </video>
  );
}

function ImageBlock({ url, caption }: { url: string; caption?: string }) {
  if (!url) return null;

  return (
    <figure className="space-y-2">
      <img 
        src={url} 
        alt={caption || 'Bild'} 
        className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => window.open(url, '_blank')}
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
      sandbox="allow-scripts allow-same-origin"
      title="Eingebetteter Inhalt"
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
      container: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900',
      icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: 'text-blue-900 dark:text-blue-100',
      content: 'text-blue-800 dark:text-blue-200'
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      title: 'text-amber-900 dark:text-amber-100',
      content: 'text-amber-800 dark:text-amber-200'
    },
    danger: {
      container: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900',
      icon: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
      title: 'text-red-900 dark:text-red-100',
      content: 'text-red-800 dark:text-red-200'
    },
    success: {
      container: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900',
      icon: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />,
      title: 'text-green-900 dark:text-green-100',
      content: 'text-green-800 dark:text-green-200'
    }
  };

  const currentStyle = styles[style];

  return (
    <div className={`border rounded-lg p-4 ${currentStyle.container}`}>
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {currentStyle.icon}
        </div>
        <div className="flex-1">
          {title && (
            <h4 className={`font-semibold mb-1 ${currentStyle.title}`}>
              {title}
            </h4>
          )}
          <div className={`text-sm ${currentStyle.content}`}>
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}

function InteractiveBlock({ 
  subtype, 
  config 
}: { 
  subtype?: string; 
  config?: any;
}) {
  if (!subtype) return null;

  return (
    <Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded-lg" />}>
      {subtype === 'stability-sim' && <StabilitySimulator />}
      {subtype === 'drag-order' && <DragOrderExercise config={config} />}
      {subtype === 'hotspot' && <HotspotExercise config={config} />}
    </Suspense>
  );
}
