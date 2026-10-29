import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { worksheetAction, type AssignedWorksheet, type WorksheetContext, type WorksheetDelivery, type WorksheetVariant } from '../api/worksheetService';

export const worksheetKeys = {
  user: (userId: string) => ['ai-worksheets', userId] as const,
  context: (userId: string) => [...worksheetKeys.user(userId), 'context'] as const,
  source: (userId: string, conversationId: string, messageId: string) => [...worksheetKeys.user(userId), 'source', conversationId, messageId] as const,
  status: (userId: string, conversationId: string, messageId: string) => [...worksheetKeys.user(userId), 'status', conversationId, messageId] as const,
  deliveries: (userId: string, courseId: string, page: number) => [...worksheetKeys.user(userId), 'deliveries', courseId, page] as const,
};
export interface WorksheetSource { variants: WorksheetVariant[]; assignmentReady?: boolean; readinessMessage?: string }
export interface WorksheetStatus { published: boolean; learnerCount: number }
export function useWorksheetStatus(userId: string, conversationId: string, messageId: string) {
  return useQuery({
    queryKey: worksheetKeys.status(userId, conversationId, messageId),
    queryFn: () => worksheetAction<WorksheetStatus>('status', { conversationId, messageId }),
    enabled: !!userId && !!conversationId && !!messageId,
    staleTime: 0, retry: false, refetchOnMount: true,
  });
}
interface Publication {
  conversationId: string; messageId: string; groupId: string; title: string;
  instructions: string; dueAt: string | null; reviewed: true;
}

export function useWorksheetContext(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: worksheetKeys.context(userId),
    queryFn: () => worksheetAction<WorksheetContext>('context'),
    enabled: !!userId && enabled, staleTime: 30000, retry: false, refetchOnMount: true,
  });
}
export function useWorksheetSource(userId: string, conversationId: string, messageId: string, enabled: boolean) {
  return useQuery({
    queryKey: worksheetKeys.source(userId, conversationId, messageId),
    queryFn: () => worksheetAction<WorksheetSource>('source', { conversationId, messageId }),
    enabled: !!userId && !!conversationId && !!messageId && enabled,
    staleTime: 30000, retry: false, refetchOnMount: true,
  });
}
export function usePublishWorksheet(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: [...worksheetKeys.user(userId), 'publish'],
    mutationFn: (publication: Publication) => {
      if (!userId) throw new Error('Please log in before assigning a worksheet.');
      return worksheetAction<{ learnerCount: number }>('publish-all', { ...publication });
    },
    retry: false,
    onSuccess: (result, publication) => {
      client.setQueryData(worksheetKeys.status(userId, publication.conversationId, publication.messageId), { published: true, learnerCount: result.learnerCount });
      void client.invalidateQueries({ queryKey: worksheetKeys.user(userId) });
    },
  });
}
export function useAssignedWorksheets(userId: string, courseId: string, page: number) {
  return useQuery({
    queryKey: worksheetKeys.deliveries(userId, courseId, page),
    queryFn: () => worksheetAction<WorksheetDelivery[]>('list', { page, courseId }),
    enabled: !!userId && !!courseId, staleTime: 0, retry: false, refetchOnMount: true,
  });
}
/** Opening records server-side activity, so always authorize it through a mutation. */
export function useOpenWorksheet(userId: string, courseId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: [...worksheetKeys.user(userId), 'open', courseId],
    mutationFn: (recipientId: string) => {
      if (!userId) throw new Error('Please log in before opening a worksheet.');
      return worksheetAction<AssignedWorksheet>('open', { recipientId, courseId });
    },
    retry: false,
    onSuccess: () => { void client.invalidateQueries({ queryKey: [...worksheetKeys.user(userId), 'deliveries', courseId] }); },
  });
}
