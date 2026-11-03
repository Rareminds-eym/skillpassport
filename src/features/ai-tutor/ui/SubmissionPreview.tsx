import { useEffect, useState } from 'react';
import { unzipSync, strFromU8 } from 'fflate';

export function docxPreview(bytes: Uint8Array) {
  let expanded = 0;
  const files = unzipSync(bytes, { filter: file => {
    expanded += file.originalSize;
    if (expanded > 32 * 1024 * 1024) throw new Error('Document exceeds the preview extraction limit.');
    return file.name === 'word/document.xml';
  } });
  if (!files['word/document.xml']) throw new Error('No readable Word document text was found.');
  const xml = new DOMParser().parseFromString(strFromU8(files['word/document.xml']), 'application/xml');
  if (xml.getElementsByTagName('parsererror').length) throw new Error('Word document text could not be read.');
  return Array.from(xml.getElementsByTagNameNS('*', 'p')).map(paragraph =>
    Array.from(paragraph.getElementsByTagNameNS('*','t')).map(text => text.textContent || '').join('')
  ).join('\n').slice(0,100000);
}

/** Preview uses local browser bytes only; choosing/opening a file never submits it. */
export default function SubmissionPreview({ file }: { file: File }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<{ kind: 'image'|'pdf'|'text'; value: string } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    setPreview(null); setError(''); setOpen(false);
    let active = true, url: string | undefined;
    const load = async () => {
      if (file.size > 5*1024*1024) throw new Error('Select a document up to 5 MiB.');
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf' || ['png','jpg','jpeg'].includes(ext || '')) {
        url = URL.createObjectURL(file);
        if (active) setPreview({ kind: ext === 'pdf' ? 'pdf' : 'image', value: url });
      } else if (['txt','csv','docx'].includes(ext || '')) {
        const value = ext === 'docx' ? docxPreview(new Uint8Array(await file.arrayBuffer())) : (await file.text()).slice(0,100000);
        if (active) setPreview({ kind: 'text', value });
      } else throw new Error('Preview supports PDF, DOCX, TXT, CSV, PNG and JPEG.');
    };
    void load().catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Preview unavailable.'); });
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [file]);
  return <div className="space-y-2">
    <button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)} className="text-blue-700 underline">{open ? 'Hide document preview' : 'Preview document'}</button>
    {open && <div className="rounded border border-slate-200 p-2" aria-label="Selected document preview">
      {error ? <p role="alert">{error}</p> : !preview ? <p role="status">Preparing local preview...</p> : preview.kind==='image' ? <img src={preview.value} alt={`Preview of ${file.name}`} className="max-h-80 max-w-full object-contain" /> : preview.kind==='pdf' ? <iframe title={`Preview of ${file.name}`} src={preview.value} sandbox="allow-same-origin" className="h-80 w-full" /> : <><p className="mb-2 text-slate-500">Text preview, up to 100,000 characters. Word images and layout are not shown.</p><pre className="max-h-80 overflow-auto whitespace-pre-wrap">{preview.value || 'No text was found. Open the original file to inspect it.'}</pre></>}
      <p className="mt-2 text-slate-500">This file has not been submitted.</p>
    </div>}
  </div>;
}
