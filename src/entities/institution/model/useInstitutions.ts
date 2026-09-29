import { useQuery } from '@tanstack/react-query';
import { apiPost } from '@/shared/api/apiClient';
import { useUser } from '@/shared/model/authStore';

const EMPTY_LIST = [];

// Options are shared across forms, but the cache is scoped to the signed-in user.
export const useInstitutions = (enabled = true) => {
  const user = useUser();
  const query = useQuery({
    queryKey: ['institutions', user?.id],
    enabled: enabled && !!user?.id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    queryFn: async () => {
      const result = await apiPost<any>('/learner-profile/actions', { action: 'get-institutions' });
      if (!result?.data) throw new Error('Unable to load institutions');
      return result.data;
    },
  });

  return {
    schools: query.data?.schools || EMPTY_LIST,
    colleges: query.data?.colleges || EMPTY_LIST,
    universities: query.data?.universities || EMPTY_LIST,
    universityColleges: query.data?.universityColleges || EMPTY_LIST,
    departments: query.data?.departments || EMPTY_LIST,
    programs: query.data?.programs || EMPTY_LIST,
    schoolClasses: query.data?.schoolClasses || EMPTY_LIST,
    programSections: query.data?.programSections || EMPTY_LIST,
    loading: enabled && query.isPending,
    error: query.error,
    refresh: query.refetch,
  };
};
