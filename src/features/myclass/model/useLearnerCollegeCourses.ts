import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/shared/model/authStore';
import { getLearnerCollegeCourses } from './collegeCourses';

export function useLearnerCollegeCourses() {
  const actor = useUser();
  return useQuery({ queryKey: ['learner-college-courses', actor?.id], queryFn: getLearnerCollegeCourses,
    enabled: Boolean(actor?.id), refetchOnWindowFocus: false, refetchOnReconnect: false });
}
