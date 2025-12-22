import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
// @ts-ignore - AuthContext is a .jsx file
import { useAuth } from '../context/AuthContext';

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
  assignedClassIds: string[]; // Add assigned class IDs
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch the school information for the currently logged-in educator
 */
export function useEducatorSchool(): EducatorSchoolData {
  const { user } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [college, setCollege] = useState<College | null>(null);
  const [educatorType, setEducatorType] = useState<'school' | 'college' | null>(null);
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

        // First, check if they are a school educator
        const { data: schoolEducatorData, error: schoolEducatorError } = await supabase
          .from('school_educators')
          .select(`
            id,
            school_id,
            schools!school_educators_school_id_fkey (
              id,
              name,
              code,
              city,
              state,
              country
            )
          `)
          .eq('email', user.email)
          .maybeSingle();

        if (schoolEducatorError && schoolEducatorError.code !== 'PGRST116') {
          throw schoolEducatorError;
        }

        if (schoolEducatorData && schoolEducatorData.schools) {
          // They are a school educator
          const schoolData = Array.isArray(schoolEducatorData.schools) 
            ? schoolEducatorData.schools[0] 
            : schoolEducatorData.schools;
          
          setSchool(schoolData as School);
          setCollege(null);
          setEducatorType('school');

          // Fetch assigned class IDs for this educator
          const { data: classAssignments, error: classError } = await supabase
            .from('school_educator_class_assignments')
            .select('class_id')
            .eq('educator_id', schoolEducatorData.id);

          if (classError) {
            console.warn('Failed to fetch class assignments:', classError);
            setAssignedClassIds([]);
          } else {
            const classIds = classAssignments?.map(assignment => assignment.class_id) || [];
            setAssignedClassIds(classIds);
          }
          
          return;
        }

        // If not a school educator, check if they are a college lecturer
        const { data: collegeLecturerData, error: collegeLecturerError } = await supabase
          .from('college_lecturers')
          .select(`
            id,
            collegeId,
            colleges!college_lecturers_collegeId_fkey (
              id,
              name,
              code,
              city,
              state,
              country
            )
          `)
          .eq('user_id', user.id)
          .maybeSingle();

        if (collegeLecturerError && collegeLecturerError.code !== 'PGRST116') {
          throw collegeLecturerError;
        }

        if (collegeLecturerData && collegeLecturerData.colleges) {
          // They are a college lecturer
          const collegeData = Array.isArray(collegeLecturerData.colleges) 
            ? collegeLecturerData.colleges[0] 
            : collegeLecturerData.colleges;
          
          setCollege(collegeData as College);
          setSchool(null);
          setEducatorType('college');
          return;
        }

        // If neither, set everything to null
        setSchool(null);
        setCollege(null);
        setEducatorType(null);
        setAssignedClassIds([]);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch educator information');
        setSchool(null);
        setCollege(null);
        setEducatorType(null);
        setAssignedClassIds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEducatorInfo();
  }, [user?.email, user?.id]);

  return { school, college, educatorType, assignedClassIds, loading, error };
}
