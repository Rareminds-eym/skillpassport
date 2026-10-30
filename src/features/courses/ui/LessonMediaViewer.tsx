import { lazy, Suspense, useState, type ReactNode } from 'react';
import { BookOpen, Download, FileText, Image, Link as LinkIcon, Video } from 'lucide-react';
import { ssoClient } from '@/shared/api/ssoClient';

const PptxContentViewer = lazy(() => import('./PptxContentViewer').then(m => ({ default: m.PptxContentViewer })));

type Resource = { title: string; url: string; originalUrl?: string; type?: string; mimeType?: string; size?: string; order?: number | null };

function getResourceIcon(type?: string) {
  switch (type?.toLowerCase()) {
    case 'pdf':
    case 'document': return FileText;
    case 'video':
    case 'youtube': return Video;
    case 'image': return Image;
    case 'link':
    case 'drive': return LinkIcon;
    default: return BookOpen;
  }
}

function resourceKind(resource: Resource) {
  const source = resource.originalUrl || resource.url;
  let path = source.split('?')[0];
  try {
    const parsed = new URL(source, 'https://local.invalid');
    if (parsed.pathname === '/api/courses/assets') path = parsed.searchParams.get('key') || parsed.pathname;
  } catch { /* Fall back to the URL path. */ }
  const name = `${resource.title} ${path} ${resource.mimeType || ''}`.toLowerCase();
  if (/\.pptx\b|presentationml/.test(name)) return 'pptx';
  if (/\.ppt\b|ms-powerpoint/.test(name)) return 'ppt';
  if (/\.pdf\b|application\/pdf/.test(name)) return 'pdf';
  return resource.type || 'document';
}

export function LessonMediaViewer({ videoUrl, videoLoading, videoOrder, resources, children, onLeaveVideo }: {
  videoUrl?: string; videoLoading: boolean; videoOrder?: number | null; resources: Resource[]; children: ReactNode; onLeaveVideo: () => void;
}) {
  const [selected, setSelected] = useState(0);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const classified = resources.map(resource => ({ ...resource, kind: resourceKind(resource) }));
  const attachments = classified.filter(resource => resource.kind !== 'pptx');
  const download = async (resource: Resource) => {
    setDownloading(resource.url);
    setDownloadError(null);
    try {
      const response = resource.url.startsWith('/api/storage/course-resource?')
        ? await ssoClient.fetch(resource.url) : await fetch(resource.url);
      if (!response.ok) throw new Error('Download failed');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      const name = resource.title || 'Lesson resource';
      link.download = resourceKind(resource) === 'ppt' && !/\.ppt$/i.test(name) ? `${name}.ppt` : name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setDownloadError('Could not download this resource. Please try again.');
    } finally { setDownloading(null); }
  };
  const hasVideo = Boolean(videoUrl || videoLoading);
  const items = [
    ...(hasVideo ? [{ title: 'Lesson video', url: videoUrl || '', type: 'video', kind: 'video', order: videoOrder }] : []),
    ...classified.filter(resource => resource.kind === 'pptx'),
  ].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const activeIndex = Math.min(selected, Math.max(items.length - 1, 0));
  const active = items[activeIndex];
  if (!active && attachments.length === 0) return null;

  const select = (index: number) => {
    if (active?.kind === 'video' && index !== activeIndex) onLeaveVideo();
    setSelected(index);
  };

  return (
    <>
    {active && <section aria-label="Lesson content" className="mb-8 flex min-w-0 flex-row overflow-hidden rounded-xl border border-gray-200 bg-white">
      <nav aria-label="Lesson content order" className="flex w-20 shrink-0 flex-col justify-between border-r border-gray-200 bg-gray-50/50 py-2 sm:w-28">
        <ol className="flex w-full min-w-0 flex-col gap-1">
          {items.map((item, index) => {
            const Icon = item.kind === 'video' ? Video : FileText;
            return <li key={`${index}-${item.url}`} className="shrink-0">
              <button type="button" onClick={() => select(index)} aria-label={`${index + 1}. ${item.title || "Lesson resource"}`} aria-current={activeIndex === index ? 'step' : undefined}
                title={item.title}
                className={`flex w-full flex-col items-center gap-1 border-l-2 px-2 py-3 text-center text-xs sm:flex-row sm:gap-2 sm:px-3 sm:text-left sm:text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 ${activeIndex === index ? 'border-indigo-600 bg-indigo-50/70 font-medium text-indigo-700' : 'border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                <span className="hidden text-[10px] font-normal tabular-nums text-gray-400 sm:inline">{index + 1}</span>
                <Icon size={16} className="shrink-0" />
                <span>{item.kind.startsWith('ppt') ? 'PPT' : item.kind === 'video' ? 'Video' : item.kind === 'pdf' ? 'PDF' : `File ${index + 1}`}</span>
              </button>
            </li>;
          })}
        </ol>

      </nav>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          <div hidden={active.kind !== 'video'} className="min-h-0 flex-1 [&>div]:mb-0 [&_video]:rounded-none">{children}</div>
          {active.kind !== 'video' && <div className="relative min-h-[240px] flex-1 aspect-[4/3] sm:aspect-video">
            {active.kind === 'pptx' ? <Suspense fallback={<p role="status" className="p-6 text-sm text-gray-600">Loading presentation preview…</p>}>
              <PptxContentViewer key={active.url} title={active.title} url={active.url} />
            </Suspense> : active.kind === 'pdf' ? <iframe title={active.title} src={active.url} className="h-full w-full border-0" /> :
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-gray-600">
                <FileText size={32} />
                <p>A preview is not available for this resource.</p>
                {downloadError && <p role="alert" className="text-red-600">{downloadError}</p>}
                {!['ppt', 'pptx'].includes(active.kind) && <a href={active.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Open resource</a>}
              </div>}
          </div>}
        </div>

      </div>
    </section>}
    {attachments.length > 0 && <section aria-label="Course resources" className="mb-8">
      <h3 className="mb-3 text-lg font-semibold text-gray-900">📚 Course Resources</h3>
      <ul className="space-y-2">
        {attachments.map((resource, index) => {
          const ResourceIcon = getResourceIcon(resource.type);
          const isLink = ['link', 'drive', 'youtube'].includes(resource.type?.toLowerCase() || '');
          const contents = <>
            <span className="rounded-lg bg-white p-2 transition-colors group-hover:bg-indigo-100">
              <ResourceIcon className="h-5 w-5 text-indigo-600" />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-medium text-gray-900">{resource.title || 'Lesson resource'}</span>
              <span className="block text-xs capitalize text-gray-500">{resource.type || 'document'}{resource.size && ` • ${resource.size}`}</span>
            </span>
            <span className="ml-3 shrink-0 text-gray-400 group-hover:text-indigo-600">
              {downloading === resource.url ? <span className="text-xs">Downloading...</span> : isLink ? <LinkIcon className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            </span>
          </>;
          const className = 'group flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-indigo-300 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50';
          return <li key={`${index}-${resource.url}`}>
            {isLink ? <a href={resource.url} target="_blank" rel="noopener noreferrer" className={className}>{contents}</a> :
              <button type="button" disabled={downloading !== null} onClick={() => void download(resource)} aria-label={`Download ${resource.title || 'Lesson resource'}`} className={className}>{contents}</button>}
          </li>;
        })}
      </ul>
      {downloadError && <p role="alert" className="mt-2 text-sm text-red-600">{downloadError}</p>}
    </section>}
    </>
  );
}
