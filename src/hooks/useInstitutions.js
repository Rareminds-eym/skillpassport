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
    console.log('🔄 useInstitutions: Starting fetch...');
    try {
      setLoading(true);
      setError(null);

      // Fetch schools from organizations table
      console.log('📚 Fetching schools from organizations...');
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
        console.log('✅ Schools fetched:', schoolsData?.length || 0, schoolsData);
        setSchools(schoolsData || []);
      }

      // Fetch colleges from organizations table
      console.log('🏫 Fetching colleges from organizations...');
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
        console.log('✅ Colleges fetched:', collegesData?.length || 0, collegesData);
        setColleges(collegesData || []);
      }

      // Fetch universities from organizations table
      console.log('🎓 Fetching universities from organizations...');
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
        console.log('✅ Universities fetched:', universitiesData?.length || 0, universitiesData);
        setUniversities(universitiesData || []);
      }

      // Fetch university colleges from university_colleges table (not organizations)
      console.log('🏛️ Fetching university colleges...');
      const { data: universityCollegesData, error: universityCollegesError } = await supabase
        .from('university_colleges')
        .select('id, name, code, university_id')
        .order('name');

      if (universityCollegesError) {
        console.error('❌ Error fetching university colleges:', universityCollegesError);
        setUniversityColleges([]);
      } else {
        console.log(
          '✅ University Colleges fetched:',
          universityCollegesData?.length || 0,
          universityCollegesData
        );
        setUniversityColleges(universityCollegesData || []);
      }

      // Fetch departments
      console.log('🏢 Fetching departments...');
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('id, name, code, college_id')
        .order('name');

      if (departmentsError) {
        console.error('❌ Error fetching departments:', departmentsError);
        setDepartments([]);
      } else {
        console.log('✅ Departments fetched:', departmentsData?.length || 0, departmentsData);
        setDepartments(departmentsData || []);
      }

      // Fetch programs
      console.log('📖 Fetching programs...');
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('id, name, code, degree_level, department_id')
        .order('name');

      if (programsError) {
        console.error('❌ Error fetching programs:', programsError);
        setPrograms([]);
      } else {
        console.log('✅ Programs fetched:', programsData?.length || 0, programsData);
        setPrograms(programsData || []);
      }

      // Fetch school classes
      console.log('🏛️ Fetching school_classes...');
      const { data: schoolClassesData, error: schoolClassesError } = await supabase
        .from('school_classes')
        .select('id, name, grade, section, school_id')
        .order('grade')
        .order('section');

      if (schoolClassesError) {
        console.error('❌ Error fetching school classes:', schoolClassesError);
        setSchoolClasses([]);
      } else {
        console.log(
          '✅ School Classes fetched:',
          schoolClassesData?.length || 0,
          schoolClassesData
        );
        setSchoolClasses(schoolClassesData || []);
      }

      // Fetch program sections
      console.log('📚 Fetching program_sections...');
      const { data: programSectionsData, error: programSectionsError } = await supabase
        .from('program_sections')
        .select('id, program_id, semester, section')
        .order('semester')
        .order('section');

      if (programSectionsError) {
        console.error('❌ Error fetching program sections:', programSectionsError);
        setProgramSections([]);
      } else {
        console.log(
          '✅ Program Sections fetched:',
          programSectionsData?.length || 0,
          programSectionsData
        );
        setProgramSections(programSectionsData || []);
      }

      console.log('✨ useInstitutions: Fetch complete!');
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
