import { apiPost } from '@/shared/api/apiClient';
export async function teaching(action:string,payload:Record<string,unknown>={}):Promise<any>{
  const result=await apiPost<{data:any}>('/teaching/actions',{action,payload});return result.data;
}
