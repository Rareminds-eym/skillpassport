import type { EditRequest } from '../model/types';

const text = (value: unknown) => typeof value === 'string' && value.trim() ? value : '';
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

function AssessmentList({ mappings }: { mappings: unknown }) {
  if (!Array.isArray(mappings) || !mappings.length) return null;
  return <ul className="mt-2 flex flex-wrap gap-2">{mappings.filter(record).map((mapping, index) => <li key={index} className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">{text(mapping.assessmentType)}{typeof mapping.weightage === 'number' && ` (${mapping.weightage}%)`}</li>)}</ul>;
}

export function ReviewProposalDetails({ data, entityType }: { data: EditRequest['before_data'] | EditRequest['proposed_data']; entityType: string }) {
  const fields = entityType === 'unit'
    ? [['Unit code', text(data.code)], ['Unit name', text(data.name)], ['Description', text(data.description)]]
    : [['Learning outcome', text(data.outcome_text)], ["Bloom's level", text(data.bloom_level)]];
  const outcomes = Array.isArray(data.outcomes) ? data.outcomes : [];
  return <div className="space-y-5">
    <dl className="space-y-4">{fields.map(([label, value]) => value && <div key={label}>
      <dt className="!text-xs !font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words !text-sm !leading-6 text-gray-900">{value}</dd>
    </div>)}</dl>
    {entityType !== 'unit' && <AssessmentList mappings={data.assessment_mappings} />}
    {outcomes.length > 0 && <div className="border-t border-gray-100 pt-4">
      <h5 className="!m-0 !text-sm !font-semibold text-gray-900">Learning outcomes <span className="font-normal text-gray-500">({outcomes.length})</span></h5>
      <ol className="mt-3 divide-y divide-gray-100">{outcomes.map((outcome, index) => {
        const details = record(outcome) ? outcome : {};
        return <li key={index} className="flex gap-3 py-3 first:pt-0 last:pb-0">
          <span className="pt-0.5 text-xs font-medium text-gray-400">{index + 1}.</span>
          <div className="min-w-0 flex-1"><p className="whitespace-pre-wrap break-words !text-sm !leading-6 text-gray-900">{typeof outcome === 'string' ? outcome : text(details.text)}</p>
            {text(details.bloomLevel) && <p className="mt-1 !text-xs text-gray-500">Bloom's level: {text(details.bloomLevel)}</p>}
            <AssessmentList mappings={details.assessments} />
          </div>
        </li>;
      })}</ol>
    </div>}
  </div>;
}
