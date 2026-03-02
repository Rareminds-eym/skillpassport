/**
 * Hook to fetch schools, colleges, universities, programs, and classes
 */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

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

      // Fetch schools from organizations table
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('organizations')
        .select('id, name, city, state, code')
        .eq('organization_type', 'school')
        .in('account_status', ['active', 'pending'])
        .order('name');

      if (schoolsError) {
        console.error('❌ Error fetching schools:', schoolsError);
        setSchools([]);
      } else {
        setSchools(schoolsData || []);
      }

      // Fetch colleges from organizations table
      const { data: collegesData, error: collegesError } = await supabase
        .from('organizations')
        .select('id, name, city, state, code')
        .eq('organization_type', 'college')
        .in('account_status', ['active', 'pending'])
        .order('name');

      if (collegesError) {
        console.error('❌ Error fetching colleges:', collegesError);
        setColleges([]);
      } else {
        setColleges(collegesData || []);
      }

      // Fetch universities from organizations table
      const { data: universitiesData, error: universitiesError } = await supabase
        .from('organizations')
        .select('id, name, city, state, code')
        .eq('organization_type', 'university')
        .in('account_status', ['active', 'pending'])
        .order('name');

      if (universitiesError) {
        console.error('❌ Error fetching universities:', universitiesError);
        setUniversities([]);
      } else {
        setUniversities(universitiesData || []);
      }

      // Fetch university colleges from university_colleges table (not organizations)
      const { data: universityCollegesData, error: universityCollegesError } = await supabase
        .from('university_colleges')
        .select('id, name, code, university_id')
        .order('name');

      if (universityCollegesError) {
        console.error('❌ Error fetching university colleges:', universityCollegesError);
        setUniversityColleges([]);
      } else {
        setUniversityColleges(universityCollegesData || []);
      }

      // Fetch departments
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('id, name, code, college_id')
        .order('name');

      if (departmentsError) {
        console.error('❌ Error fetching departments:', departmentsError);
        setDepartments([]);
      } else {
        setDepartments(departmentsData || []);
      }

      // Fetch programs
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('id, name, code, degree_level, department_id')
        .order('name');

      if (programsError) {
        console.error('❌ Error fetching programs:', programsError);
        setPrograms([]);
      } else {
        setPrograms(programsData || []);
      }

      // Fetch school classes
      const { data: schoolClassesData, error: schoolClassesError } = await supabase
        .from('school_classes')
        .select('id, name, grade, section, school_id')
        .order('grade')
        .order('section');

      if (schoolClassesError) {
        console.error('❌ Error fetching school classes:', schoolClassesError);
        setSchoolClasses([]);
      } else {
        setSchoolClasses(schoolClassesData || []);
      }

      // Fetch program sections
      const { data: programSectionsData, error: programSectionsError } = await supabase
        .from('program_sections')
        .select('id, program_id, semester, section')
        .order('semester')
        .order('section');

      if (programSectionsError) {
        console.error('❌ Error fetching program sections:', programSectionsError);
        setProgramSections([]);
      } else {
        setProgramSections(programSectionsData || []);
      }
      
    } catch (err) {
      console.error('💥 Error fetching institutions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshInstitutions = () => {
    fetchInstitutions();
  };

  return {
    schools,
    colleges,
    universities,
    universityColleges,
    departments,
    programs,
    programSections,
    schoolClasses,
    loading,
    error,
    refreshInstitutions,
  };
};
