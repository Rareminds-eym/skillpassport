import { useState, useEffect, useCallback } from "react";
import { apiPost } from '@/shared/api/apiClient';
import { Program, Department } from '@/features/learner-profile/model';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('programs');

export const usePrograms = (collegeId: string | null) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDepartmentsAndPrograms = useCallback(async () => {
    try {
      setLoading(true);

      const deptResponse = await apiPost('/college-admin/academic', {
        action: 'get-mapping-departments',
        ...(collegeId ? { college_id: collegeId } : {}),
      });
      const depts: Department[] = deptResponse.data || [];
      setDepartments(depts);

      const progResponse = await apiPost('/college-admin/academic', {
        action: 'get-mapping-programs',
      });
      const allProgs: Program[] = progResponse.data || [];

      if (depts.length > 0) {
        const deptIds = new Set(depts.map((d: any) => d.id));
        setPrograms(allProgs.filter((p: any) => deptIds.has(p.department_id)));
      } else if (!collegeId) {
        setPrograms(allProgs);
      } else {
        setPrograms([]);
      }
    } catch (err) {
      logger.error("Failed to load departments and programs", err instanceof Error ? err : new Error(String(err)));
      setDepartments([]);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  useEffect(() => {
    loadDepartmentsAndPrograms();
  }, [collegeId, loadDepartmentsAndPrograms]);

  const getProgramsByDepartment = useCallback((departmentId: string) => {
    return programs.filter(p => p.department_id === departmentId);
  }, [programs]);

  return { 
    departments, 
    programs, 
    loading, 
    loadDepartmentsAndPrograms,
    getProgramsByDepartment 
  };
};
