import { useQuery } from '@tanstack/react-query';
import { worksheetAction, type WorksheetContext } from '../api/worksheetService';

export function useWorksheetContext(userId:string,enabled:boolean) {
  return useQuery({
    queryKey:['ai-teaching-context',userId],
    queryFn:()=>worksheetAction<WorksheetContext>('context'),
    enabled:!!userId&&enabled,staleTime:30000,retry:false,refetchOnMount:true,
  });
}
