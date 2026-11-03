export type AnalyticsRange = '7d' | '30d' | '90d' | 'ytd' | 'custom';
export type ChartType = 'line' | 'area' | 'column';
export type ExportRow = { Section: string; Metric: string; Value: string | number; Unit: string; Period: string };

export const rangeLabels: Record<Exclude<AnalyticsRange, 'custom'>, string> = {
  '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days', ytd: 'Year to date',
};

export function localDate(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validCustomRange(start: string, end: string) {
  return validDate(start) && validDate(end) && start <= end && end <= localDate();
}

export function parseAnalyticsParams(params: URLSearchParams) {
  const requestedRange = params.get('range') || '30d';
  const start = params.get('start') || '';
  const end = params.get('end') || '';
  const range: AnalyticsRange = requestedRange === 'custom'
    ? validCustomRange(start, end) ? 'custom' : '30d'
    : Object.prototype.hasOwnProperty.call(rangeLabels, requestedRange) ? requestedRange as Exclude<AnalyticsRange, 'custom'> : '30d';
  const requestedChart = params.get('chart');
  const chart: ChartType = requestedChart === 'area' || requestedChart === 'column' ? requestedChart : 'line';
  return { range, chart, start: range === 'custom' ? start : '', end: range === 'custom' ? end : '' };
}

export function getQueryRange(state: ReturnType<typeof parseAnalyticsParams>) {
  return {
    preset: state.range,
    startDate: state.range === 'custom' ? new Date(`${state.start}T00:00:00`).toISOString() : undefined,
    endDate: state.range === 'custom' ? new Date(`${state.end}T23:59:59.999`).toISOString() : undefined,
  };
}

export function periodLabel(state: ReturnType<typeof parseAnalyticsParams>) {
  if (state.range !== 'custom') return rangeLabels[state.range];
  const format = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  return `${format(state.start)} – ${format(state.end)}`;
}

export const formatNumber = (value: number | null | undefined) => typeof value === 'number' && Number.isFinite(value)
  ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '—';

export function toCSV(rows: ExportRow[]) {
  const headers: (keyof ExportRow)[] = ['Section', 'Metric', 'Value', 'Unit', 'Period'];
  const escape = (value: string | number) => {
    const text = String(value);
    const safe = typeof value === 'string' && /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return [headers.map(escape).join(','), ...rows.map(row => headers.map(key => escape(row[key])).join(','))].join('\r\n');
}

export function downloadCSV(rows: ExportRow[], filename: string) {
  if (!rows.length) return;
  const url = URL.createObjectURL(new Blob(['\uFEFF', toCSV(rows)], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
