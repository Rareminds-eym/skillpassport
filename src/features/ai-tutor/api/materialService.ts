import { apiPost } from '@/shared/api/apiClient';
import { ssoClient } from '@/shared/api/ssoClient';
import { getApiUrl } from '@/shared/api/apiUtils';

export async function materialAction<T = any>(action: string, data: Record<string, unknown> = {}): Promise<T> {
  return (await apiPost<{ data: T }>('/ai-tutor/materials', { action, ...data })).data;
}
export async function submitMaterialDocument(recipientId: string, file: File) {
  const form = new FormData(); form.set('recipientId', recipientId); form.set('file', file);
  const response = await ssoClient.fetch(`${getApiUrl('ai-tutor')}/assignment-submission`, { method: 'POST', body: form });
  if (!response.ok) throw new Error('Submission could not complete. Refresh status before retrying.');
  return response.json();
}
export async function downloadMaterialDocument(submissionId: string, filename: string) {
  const response = await ssoClient.fetch(`${getApiUrl('ai-tutor')}/assignment-submission?submissionId=${encodeURIComponent(submissionId)}`);
  if (!response.ok) throw new Error('Document access denied');
  const url = URL.createObjectURL(await response.blob());
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
/** Lets existing school/college upload screens submit through the same protected AI flow. */
export async function submitLinkedMaterial(allocationId: string, files: File[]): Promise<boolean> {
  if (!(await materialAction<{ enabled: boolean }>('capabilities')).enabled) return false;
  const linked = await materialAction<{ id: string } | null>('resolve-task', { allocationId });
  if (!linked) return false;
  if (files.length !== 1) throw new Error('This AI assignment requires one completed document.');
  await submitMaterialDocument(linked.id, files[0]);
  return true;
}
