import { apiPost } from '@/shared/api/apiClient';

export interface WorksheetContext { organization: { id: string; name: string }; gradeLevel: string; learnerCount: number }
/** Only teaching context remains on this endpoint; assignments use materialService. */
export async function worksheetAction<T>(action:'context',params:Record<string,unknown>={}):Promise<T> {
  return (await apiPost<{data:T}>('/ai-tutor/worksheets',{action,...params})).data;
}
