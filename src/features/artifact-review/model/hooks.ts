import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/shared/model/authStore";
import {
  fetchReviewQueue,
  fetchReview,
  startReview,
  completeReview,
} from "../api/reviews";

export function useReviewQueue(cursor: string | null = null) {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ["artifact-reviews", user?.id, cursor],
    queryFn: () => fetchReviewQueue(cursor),
    enabled: !!user?.id,
    refetchInterval: 30_000,
  });
}
export function useReviewDetail(id: string) {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ["artifact-review", user?.id, id],
    queryFn: () => fetchReview(id),
    enabled: !!user?.id && !!id,
    retry: false,
  });
}
export function useReviewMutations(id: string) {
  const client = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["artifact-reviews"] }),
      client.invalidateQueries({ queryKey: ["artifact-review"] }),
    ]);
  };
  const start = useMutation({ mutationFn: startReview, onSuccess: refresh });
  const complete = useMutation({
    mutationFn: ({ body, key }: { body: unknown; key: string }) =>
      completeReview(id, body, key),
    onSuccess: refresh,
  });
  return { start, complete };
}
