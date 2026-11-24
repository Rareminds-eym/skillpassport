import { useEffect, useRef, useState } from 'react';
import { Download, RotateCw, Search, File, FileImage, FileSpreadsheet, FileText, FileVideo, Paperclip } from 'lucide-react';
import { ssoClient } from '@/shared/api/ssoClient';
import { LessonPresentationViewer } from './LessonPresentationViewer';
import type { LessonPlanContent } from '../model/types';

type Resource = LessonPlanContent['resource_files'][number];
type Sheet = { name: string; rows: string[][] };
type Block = { text: string; style?: string } | { rows: string[][] };
const action = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600';
function fileKind(file: Resource) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension || '')) return 'image';
  if (['xlsx', 'xls', 'csv'].includes(extension || '')) return 'sheet';
  if (extension === 'pdf') return 'pdf';
  if (extension === 'docx') return 'docx';
  if (extension === 'pptx') return 'slides';
  if (['mp4', 'webm', 'ogg'].includes(extension || '')) return 'video';
  if (extension === 'txt') return 'text';
  return 'other';
}
function icon(file: Resource) {
  const kind = fileKind(file);
  return kind === 'image' ? FileImage : kind === 'sheet' ? FileSpreadsheet : kind === 'video' ? FileVideo : ['pdf', 'docx', 'text', 'slides'].includes(kind) ? FileText : File;
}
function fileSize(size: number) {
  if (!size) return '';
  return size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(size / 1024))} KB`;
}

function ResourcePreview({ planId, file, player = false }: { planId: string; file: Resource; player?: boolean }) {
  const [state, setState] = useState<{ url: string; sheets: Sheet[]; blocks: Block[]; text: string } | null>(null);
  const [error, setError] = useState('');
  const [previewError, setPreviewError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [sheetIndex, setSheetIndex] = useState(0);
  const kind = fileKind(file);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let objectUrl = '';
    setState(null); setError(''); setPreviewError(''); setSheetIndex(0);
    void (async () => {
      try {
        const params = new URLSearchParams({ planId, resourceId: file.id });
        const response = await ssoClient.fetch(`/api/college-courses/resource?${params}`, { signal: controller.signal });
        if (!response.ok) {
          const messages: Record<number, string> = {
            401: 'Your session has expired. Sign in again to view this material.',
            403: 'This material is not available for your current course access.',
            404: 'This file is currently unavailable. Please ask your educator to upload it again.',
          };
          throw new Error(messages[response.status] || 'We could not open this material. Please try again in a moment.');
        }
        const blob = await response.blob();
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        const next = { url: objectUrl, sheets: [] as Sheet[], blocks: [] as Block[], text: '' };
        try {
          if (kind === 'sheet') {
            const XLSX = await import('xlsx');
            const workbook = XLSX.read(await blob.arrayBuffer(), { type: 'array', sheetRows: 201, cellHTML: false, cellFormula: false });
            next.sheets = workbook.SheetNames.slice(0, 20).map(name => ({ name,
              rows: XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(workbook.Sheets[name], { header: 1, defval: '', blankrows: false })
                .slice(0, 200).map(row => row.slice(0, 26).map(cell => cell == null ? '' : String(cell))),
            }));
          } else if (kind === 'docx') {
            const { default: JSZip } = await import('jszip');
            const zip = await JSZip.loadAsync(await blob.arrayBuffer());
            const xml = await zip.file('word/document.xml')?.async('string');
            if (!xml || xml.length > 10000000) throw new Error('Document preview is unavailable.');
            const document = new DOMParser().parseFromString(xml, 'application/xml');
            if (document.querySelector('parsererror')) throw new Error('Invalid document.');
            const body = document.getElementsByTagNameNS('*', 'body')[0];
            if (!body) throw new Error('Empty document.');
            const text = (element: Element) => Array.from(element.getElementsByTagNameNS('*', 't')).map(item => item.textContent || '').join('');
            next.blocks = Array.from(body.children).slice(0, 1500).flatMap<Block>(element => {
              if (element.localName === 'p') {
                const style = element.getElementsByTagNameNS('*', 'pStyle')[0]?.getAttributeNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'val') || '';
                return [{ text: text(element), style }];
              }
              if (element.localName === 'tbl') return [{ rows: Array.from(element.getElementsByTagNameNS('*', 'tr')).slice(0, 200).map(row => Array.from(row.getElementsByTagNameNS('*', 'tc')).slice(0, 26).map(text)) }];
              return [];
            });
          } else if (kind === 'text') next.text = (await blob.text()).slice(0, 200000);
        } catch { if (active) setPreviewError('A preview could not be prepared. Use Download above to open the original file.'); }
        if (active) setState(next);
      } catch (error) {
        if (active && !controller.signal.aborted) setError(error instanceof TypeError ? 'The connection was interrupted. Check your connection and try again.' : error instanceof Error ? error.message : 'Unable to load resource.');
      }
    })();
    return () => { active = false; controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [planId, file.id, file.url, kind, attempt]);
  const sheet = state?.sheets[sheetIndex];
  const table = (rows: string[][]) => <div className="max-h-[32rem] overflow-auto overscroll-contain"><table className="w-full border-collapse text-left text-sm"><tbody>{rows.map((row, i) => <tr key={i} className="even:bg-gray-50">{row.map((cell, j) => <td key={j} className="min-w-24 max-w-xs whitespace-pre-wrap break-words border border-gray-200 px-3 py-2 align-top text-gray-700">{cell}</td>)}</tr>)}</tbody></table></div>;
  return <div className={player ? "overflow-hidden rounded-lg border border-gray-200 bg-white" : "overflow-hidden rounded-xl border border-gray-200 bg-white"}>
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3"><h5 className="min-w-0 break-words !text-sm !font-semibold text-gray-900">{file.name}</h5>{state && <a className={`${action} text-gray-600 hover:bg-gray-100`} href={state.url} download={file.name}><Download className="h-4 w-4" aria-hidden="true" />Download</a>}</div>
    {!state && !error && <div role="status" className="flex min-h-48 items-center justify-center gap-3 p-6 text-sm text-gray-500"><span className="h-4 w-4 rounded-full border-2 border-gray-200 border-t-gray-500 motion-safe:animate-spin" aria-hidden="true" />Opening material...</div>}
    {error && <div role="alert" className="flex min-h-48 flex-col items-center justify-center px-5 py-8 text-center"><File className="mb-3 h-7 w-7 text-gray-400" aria-hidden="true" /><h4 className="!text-sm !font-semibold text-gray-900">Unable to open this material</h4><p className="mt-2 max-w-md !text-sm !leading-6 text-gray-500">{error}</p><button className={`${action} mt-4 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50`} type="button" onClick={() => setAttempt(value => value + 1)}><RotateCw className="h-4 w-4" aria-hidden="true" />Try again</button></div>}
    {state && (previewError ? <p role="status" className="p-6 text-sm text-gray-600">{previewError}</p> : <>
      {kind === 'image' && <div className="flex min-h-60 items-center justify-center bg-gray-50 p-4"><img src={state.url} alt={file.name} className="max-h-[36rem] max-w-full object-contain" onError={() => setPreviewError('Image preview is unavailable. Download the original image instead.')} /></div>}
      {kind === 'pdf' && <iframe src={state.url} title={`PDF: ${file.name}`} className="h-[min(65vh,44rem)] min-h-80 w-full border-0" />}
      {kind === 'video' && <video controls preload="metadata" src={state.url} className="max-h-[36rem] w-full bg-gray-950" onError={() => setPreviewError('Your browser cannot preview this video format. Download the original instead.')} />}
      {kind === 'sheet' && <>{state.sheets.length > 1 && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3"><label className="flex items-center gap-2 text-sm text-gray-700">Worksheet<select className="min-h-11 max-w-52 rounded-lg border border-gray-300 px-3" value={sheetIndex} onChange={event => setSheetIndex(Number(event.target.value))}>{state.sheets.map((item, index) => <option key={item.name} value={index}>{item.name}</option>)}</select></label><p className="text-xs text-gray-500">Preview: up to 200 rows and 26 columns per sheet</p></div>}{sheet?.rows.length ? table(sheet.rows) : <p className="p-6 text-sm text-gray-500">This worksheet has no data.</p>}</>}
      {kind === 'slides' && <LessonPresentationViewer url={state.url} title={file.name} />}
      {kind === 'docx' && <><div role="region" aria-label={`Document preview: ${file.name}`} tabIndex={0} className={`max-h-[min(65dvh,44rem)] min-h-72 overflow-auto overscroll-contain focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600 ${player ? 'bg-gray-100/70 p-3 sm:p-5' : 'p-5 sm:p-8'}`}><div className={player ? 'mx-auto max-w-[54rem] space-y-4 border border-gray-200 bg-white px-4 py-6 shadow-sm sm:px-7 sm:py-8' : 'space-y-3'}>{state.blocks.map((block, index) => 'text' in block ? block.style === 'Title' ? <h3 key={index} className="whitespace-pre-wrap break-words !text-xl !font-semibold !leading-8 text-gray-900">{block.text}</h3> : /^Heading/i.test(block.style || '') ? <h4 key={index} className="whitespace-pre-wrap break-words !text-base !font-semibold !leading-7 text-gray-900">{block.text}</h4> : <p key={index} className="whitespace-pre-wrap break-words !text-sm !leading-7 text-gray-700">{block.text || '\u00a0'}</p> : <div key={index}>{table(block.rows)}</div>)}</div></div><p className="border-t border-gray-200 px-4 py-3 !text-xs !leading-5 text-gray-500">Text and table preview. Download for the original formatting.</p></>}
      {kind === 'text' && <pre className="max-h-[36rem] overflow-auto whitespace-pre-wrap break-words p-5 text-sm text-gray-700">{state.text}</pre>}
      {kind === 'other' && <div className="p-8 text-center"><File className="mx-auto h-10 w-10 text-gray-400" aria-hidden="true" /><p className="mt-3 text-sm text-gray-600">Preview is not available for this format. Download the file to open it in its application.</p></div>}
    </>)}
  </div>;
}

export function LessonResourceFiles({ planId, files, activeResourceId, onSelectResource, player = false }: {
  planId: string; files: Resource[]; activeResourceId?: string;
  onSelectResource?: (id: string) => void; player?: boolean;
}) {
  const [resourceId, setResourceId] = useState('');
  const [search, setSearch] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const resource = files.find(item => item.id === (activeResourceId || resourceId)) || files[0];
  const choose = (id: string) => { setResourceId(id); onSelectResource?.(id); };
  const visibleFiles = files.filter(file => file.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  useEffect(() => { setSearch(''); }, [planId]);
  useEffect(() => {
    const list = listRef.current, selected = selectedRef.current;
    if (!list || !selected) return;
    // Keep deep-linked and keyboard-selected materials visible inside the list,
    // without moving the page or changing the material currently being read.
    const top = selected.offsetTop, bottom = top + selected.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }, [resource?.id, search]);
  if (player) return <section aria-label="Lesson resource viewer" className="min-w-0 space-y-4">
    {files.length > 1 && <div className="space-y-3">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="!text-xs !leading-5 text-gray-500">{files.length} learning materials</p>
        {files.length > 6 && <label className="relative block w-full sm:max-w-xs"><span className="sr-only">Search lesson materials</span><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gray-400" /><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search materials" className="min-h-11 w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600" /></label>}
      </div>
      <div ref={listRef} role="group" aria-label="Choose learning material" className={`relative grid gap-2 sm:grid-cols-2 ${files.length > 4 ? 'max-h-60 overflow-y-auto overscroll-contain p-1 [scrollbar-gutter:stable]' : ''}`}>
        {visibleFiles.map(file => { const Icon = icon(file); return <button ref={resource?.id === file.id ? selectedRef : undefined} type="button" key={file.id} aria-pressed={resource?.id === file.id} onClick={() => choose(file.id)} className={`flex min-h-12 min-w-0 items-start gap-2 rounded-md border bg-white px-3 py-2.5 text-left text-sm leading-6 ${resource?.id === file.id ? 'border-blue-500 font-medium text-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600`}><Icon className="mt-1 h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" /><span className="min-w-0 whitespace-normal break-words [overflow-wrap:anywhere]">{file.name}</span></button>; })}
      </div>
      {search && <p role="status" className="!text-xs !leading-5 text-gray-500">{visibleFiles.length} of {files.length} materials match your search.</p>}
      {!visibleFiles.length && <div className="rounded-md border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">No materials match your search.<button type="button" onClick={() => setSearch('')} className={`${action} ml-1 text-gray-700 underline`}>Clear search</button></div>}
      {search && resource && !visibleFiles.some(file => file.id === resource.id) && <p className="break-words !text-xs !leading-5 text-gray-500">Currently viewing: {resource.name}</p>}
    </div>}
    {resource && <ResourcePreview key={`${planId}-${resource.id}`} planId={planId} file={resource} player />}
  </section>;
  return <div className="space-y-3"><h5 className="flex items-center gap-2 !text-sm !font-semibold text-gray-900"><Paperclip className="h-4 w-4" aria-hidden="true" />Learning materials ({files.length})</h5>
    <div className="grid gap-2 sm:grid-cols-2">{files.map(file => { const Icon = icon(file); return <button key={file.id} type="button" aria-pressed={resource?.id === file.id} onClick={() => choose(file.id)} className={`flex min-h-20 min-w-0 items-center gap-3 rounded-xl border p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 ${resource?.id === file.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}><Icon className="h-6 w-6 shrink-0 text-blue-600" aria-hidden="true" /><span className="min-w-0"><span className="block break-words text-sm font-medium text-gray-800">{file.name}</span><span className="mt-1 block text-xs text-gray-500">{file.name.split('.').pop()?.toUpperCase()}{file.size ? ` Ã‚Â· ${fileSize(file.size)}` : ''}</span></span></button>; })}</div>
    {resource && <ResourcePreview key={`${planId}-${resource.id}`} planId={planId} file={resource} />}
  </div>;
}

