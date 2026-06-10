import { useState, useEffect } from 'react';
import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('useInstitutions');

export const useInstitutions = () => {
  const [schools, setSchools] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [universityColleges, setUniversityColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [programSections, setProgramSections] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiPost<any>('/learner-profile/actions', { action: 'get-institutions' });

      if (result?.data) {
        setSchools(result.data.schools || []);
        setColleges(result.data.colleges || []);
        setUniversities(result.data.universities || []);
        setUniversityColleges(result.data.universityColleges || []);
        setDepartments(result.data.departments || []);
        setPrograms(result.data.programs || []);
        setSchoolClasses(result.data.schoolClasses || []);
        setProgramSections(result.data.programSections || []);
      }
    } catch (err) {
      logger.error('Error fetching institutions', err as Error);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { schools, colleges, universities, universityColleges, departments, programs, schoolClasses, programSections, loading, error };
};
