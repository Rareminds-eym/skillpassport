import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../../lib/supabaseClient';
import { Program, Department } from '../types';

export const usePrograms = (collegeId: string | null) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDepartmentsAndPrograms = useCallback(async () => {
    try {
      setLoading(true);

      if (collegeId) {
        // Fetch departments for this college
        const { data: depts, error: deptError } = await supabase
          .from('departments')
          .select('id, name, code, college_id')
          .eq('college_id', collegeId)
          .eq('status', 'active')
          .order('name', { ascending: true });

        if (deptError) throw deptError;
        setDepartments(depts || []);

        if (depts && depts.length > 0) {
          const deptIds = depts.map((d) => d.id);
          const { data: progs, error: progError } = await supabase
            .from('programs')
            .select('id, name, code, department_id')
            .in('department_id', deptIds)
            .eq('status', 'active')
            .order('name', { ascending: true });

          if (progError) throw progError;
          setPrograms(progs || []);
        } else {
          setPrograms([]);
        }
      } else {
        // No college ID, fetch all
        const { data: depts } = await supabase
          .from('departments')
          .select('id, name, code, college_id')
          .eq('status', 'active')
          .order('name', { ascending: true });

        setDepartments(depts || []);

        const { data: progs } = await supabase
          .from('programs')
          .select('id, name, code, department_id')
          .eq('status', 'active')
          .order('name', { ascending: true });

        setPrograms(progs || []);
      }
    } catch (err) {
      console.error('Failed to load departments and programs:', err);
      setDepartments([]);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  useEffect(() => {
    loadDepartmentsAndPrograms();
  }, [collegeId, loadDepartmentsAndPrograms]);

  // Helper to filter programs by department
  const getProgramsByDepartment = useCallback(
    (departmentId: string) => {
      return programs.filter((p) => p.department_id === departmentId);
    },
    [programs]
  );

  return {
    departments,
    programs,
    loading,
    loadDepartmentsAndPrograms,
    getProgramsByDepartment,
  };
};
