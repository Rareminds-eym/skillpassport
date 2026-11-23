import { useMemo } from 'react';
import { jobDescriptionBlocks } from '../lib/jobDescription';

export default function JobDescription({ value, fallback = 'The employer has not provided a description.' }) {
  const blocks = useMemo(() => jobDescriptionBlocks(value), [value]);
  return <div className="space-y-4 break-words text-sm leading-7 text-slate-700">
    {blocks.length ? blocks.map((block, index) => block.type === 'heading'
      ? <h4 key={index} className="pt-2 text-sm font-semibold leading-6 text-slate-900">{block.text}</h4>
      : block.type === 'list'
        ? <ul key={index} className="list-disc space-y-2 pl-5 marker:text-slate-400">{block.items.map((item, i) => <li key={i}>{item}</li>)}</ul>
        : <p key={index} className="whitespace-pre-line">{block.text}</p>)
      : <p>{fallback}</p>}
  </div>;
}
