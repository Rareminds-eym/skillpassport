import { useState, useEffect } from 'react';
import { apiPost } from '@/shared/api/apiClient';
import { useUser } from '@/shared/model/authStore';

interface School {
  id: string;
  name: string;
  code: string;
  city?: string;
  state?: string;
  country?: string;
}

interface College {
  id: string;
  name: string;
  code?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface EducatorSchoolData {
  school: School | null;
  college: College | null;
  educatorType: 'school' | 'college' | null;
  educatorRole: string | null;
  assignedClassIds: string[];
  loading: boolean;
  error: string | null;
}

export function useEducatorSchool(): EducatorSchoolData {
  const user = useUser();
  const [school, setSchool] = useState<School | null>(null);
  const [college, setCollege] = useState<College | null>(null);
  const [educatorType, setEducatorType] = useState<'school' | 'college' | null>(null);
  const [educatorRole, setEducatorRole] = useState<string | null>(null);
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEducatorInfo = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await apiPost('/educator/actions', {
          action: 'fetch-educator-school-info',
          email: user.email,
          userId: user.id,
        });

        if (res?.data) {
          const info = res.data;
          if (info.type === 'school') {
            setSchool(info.school as School);
            setCollege(null);
            setEducatorType('school');
            setEducatorRole(info.educatorRole);
            setAssignedClassIds(info.assignedClassIds || []);
          } else if (info.type === 'college') {
            setCollege(info.college as College);
            setSchool(null);
            setEducatorType('college');
            setEducatorRole(info.educatorRole);
            setAssignedClassIds(info.assignedClassIds || []);
          } else {
            setSchool(null);
            setCollege(null);
            setEducatorType(null);
            setEducatorRole(null);
            setAssignedClassIds([]);
          }
        } else {
          setSchool(null);
          setCollege(null);
          setEducatorType(null);
          setEducatorRole(null);
          setAssignedClassIds([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch educator information');
        setSchool(null);
        setCollege(null);
        setEducatorType(null);
        setEducatorRole(null);
        setAssignedClassIds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEducatorInfo();
  }, [user?.email, user?.id]);

  return { school, college, educatorType, educatorRole, assignedClassIds, loading, error };
}
