// import { useState, useEffect } from 'react';
// import { supabase } from '../lib/supabaseClient';
// // @ts-ignore - AuthContext is a .jsx file
// import { useAuth } from '../context/AuthContext';

// interface School {
//   id: string;
//   name: string;
//   code: string;
//   city?: string;
//   state?: string;
//   country?: string;
// }

// interface College {
//   id: string;
//   name: string;
//   code?: string;
//   city?: string;
//   state?: string;
//   country?: string;
// }

// interface EducatorSchoolData {
//   school: School | null;
//   college: College | null;
//   educatorType: 'school' | 'college' | null;
//   educatorRole: string | null; // Add educator role
//   assignedClassIds: string[]; // Add assigned class IDs
//   loading: boolean;
//   error: string | null;
// }

// /**
//  * Hook to fetch the school information for the currently logged-in educator
//  */
// export function useEducatorSchool(): EducatorSchoolData {
//   const { user } = useAuth();
//   const [school, setSchool] = useState<School | null>(null);
//   const [college, setCollege] = useState<College | null>(null);
//   const [educatorType, setEducatorType] = useState<'school' | 'college' | null>(null);
//   const [educatorRole, setEducatorRole] = useState<string | null>(null);
//   const [assignedClassIds, setAssignedClassIds] = useState<string[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchEducatorInfo = async () => {
//       if (!user?.email) {
//         setLoading(false);
//         return;
//       }

//       try {
//         setLoading(true);
//         setError(null);

//         // First, check if they are a school educator
//         // Note: schools table doesn't exist - fetch school info from organizations separately
//         const { data: schoolEducatorData, error: schoolEducatorError } = await supabase
//           .from('school_educators')
//           .select(`
//             id,
//             school_id,
// <<<<<<< SettingsDynamicAdmin
//             role,
//             organizations!school_educators_school_id_fkey (
//               id,
//               name,
//               code,
//               city,
//               state,
//               country
//             )
// =======
//             role
// >>>>>>> testing
//           `)
//           .eq('email', user.email)
//           .maybeSingle();

//         if (schoolEducatorError && schoolEducatorError.code !== 'PGRST116') {
//           throw schoolEducatorError;
//         }

// <<<<<<< SettingsDynamicAdmin
//         if (schoolEducatorData && schoolEducatorData.organizations) {
//           // They are a school educator
//           const schoolData = Array.isArray(schoolEducatorData.organizations) 
//             ? schoolEducatorData.organizations[0] 
//             : schoolEducatorData.organizations;
// =======
//         if (schoolEducatorData && schoolEducatorData.school_id) {
//           // Fetch school info from organizations table
//           const { data: schoolData } = await supabase
//             .from('organizations')
//             .select('id, name, code, city, state, country')
//             .eq('id', schoolEducatorData.school_id)
//             .maybeSingle();
// >>>>>>> testing
          
//           if (schoolData) {
//             // They are a school educator
//             setSchool(schoolData as School);
//             setCollege(null);
//             setEducatorType('school');
//             setEducatorRole(schoolEducatorData.role || null);

//             // Fetch assigned class IDs for this educator (only if not admin)
//             if (schoolEducatorData.role !== 'admin') {
//               const { data: classAssignments, error: classError } = await supabase
//                 .from('school_educator_class_assignments')
//                 .select('class_id')
//                 .eq('educator_id', schoolEducatorData.id);

//               if (classError) {
//                 console.warn('Failed to fetch class assignments:', classError);
//                 setAssignedClassIds([]);
//               } else {
//                 const classIds = classAssignments?.map(assignment => assignment.class_id) || [];
//                 setAssignedClassIds(classIds);
//               }
//             } else {
//               // Admins don't need class assignments - they see all students
//               setAssignedClassIds([]);
//             }
            
//             return;
//           }
//         }

//         // If not a school educator, check if they are a college lecturer
//         // Note: colleges table doesn't exist - fetch college info from organizations separately
//         const { data: collegeLecturerData, error: collegeLecturerError } = await supabase
//           .from('college_lecturers')
// <<<<<<< SettingsDynamicAdmin
//           .select('id, collegeId')
// =======
//           .select(`
//             id,
//             collegeId
//           `)
// >>>>>>> testing
//           .eq('user_id', user.id)
//           .maybeSingle();

//         console.log('📊 College lecturer query result:', {
//           data: collegeLecturerData,
//           error: collegeLecturerError
//         });

//         if (collegeLecturerError && collegeLecturerError.code !== 'PGRST116') {
//           console.log('❌ College lecturer error:', collegeLecturerError);
//           throw collegeLecturerError;
//         }

//         if (collegeLecturerData && collegeLecturerData.collegeId) {
// <<<<<<< SettingsDynamicAdmin
//           // Fetch college details from organizations table
//           const { data: collegeData, error: collegeError } = await supabase
//             .from('organizations')
//             .select('id, name, code, city, state, country')
//             .eq('id', collegeLecturerData.collegeId)
//             .eq('organization_type', 'college')
//             .single();

//           console.log('🏫 College data fetch result:', { collegeData, collegeError });

//           if (collegeError) {
//             console.warn('Failed to fetch college details:', collegeError);
//           }

//           // They are a college lecturer
//           setCollege(collegeData as College);
//           setSchool(null);
//           setEducatorType('college');
//           setEducatorRole('lecturer');

//           // Fetch assigned college class IDs for this lecturer
//           const { data: collegeClassAssignments, error: collegeClassError } = await supabase
//             .from('college_faculty_class_assignments')
//             .select('class_id')
//             .eq('faculty_id', collegeLecturerData.id);

//           if (collegeClassError) {
//             console.warn('Failed to fetch college class assignments:', collegeClassError);
//             setAssignedClassIds([]);
//           } else {
//             const classIds = collegeClassAssignments?.map(assignment => assignment.class_id) || [];
//             setAssignedClassIds(classIds);
// =======
//           // Fetch college info from organizations table
//           const { data: collegeData } = await supabase
//             .from('organizations')
//             .select('id, name, code, city, state, country')
//             .eq('id', collegeLecturerData.collegeId)
//             .maybeSingle();
          
//           if (collegeData) {
//             // They are a college lecturer
//             setCollege(collegeData as College);
//             setSchool(null);
//             setEducatorType('college');
//             setEducatorRole('lecturer');

//             // Fetch assigned college class IDs for this lecturer
//             const { data: collegeClassAssignments, error: collegeClassError } = await supabase
//               .from('college_faculty_class_assignments')
//               .select('class_id')
//               .eq('faculty_id', collegeLecturerData.id);

//             if (collegeClassError) {
//               console.warn('Failed to fetch college class assignments:', collegeClassError);
//               setAssignedClassIds([]);
//             } else {
//               const classIds = collegeClassAssignments?.map(assignment => assignment.class_id) || [];
//               setAssignedClassIds(classIds);
//             }
            
//             return;
// >>>>>>> testing
//           }
//         }

//         // If neither, set everything to null
//         setSchool(null);
//         setCollege(null);
//         setEducatorType(null);
//         setEducatorRole(null);
//         setAssignedClassIds([]);

//       } catch (err) {
//         setError(err instanceof Error ? err.message : 'Failed to fetch educator information');
//         setSchool(null);
//         setCollege(null);
//         setEducatorType(null);
//         setEducatorRole(null);
//         setAssignedClassIds([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchEducatorInfo();
//   }, [user?.email, user?.id]);

//   return { school, college, educatorType, educatorRole, assignedClassIds, loading, error };
// }
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
  educatorRole: string | null;
  assignedClassIds: string[];
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

        // First, check if they are a school educator
        const { data: schoolEducatorData, error: schoolEducatorError } = await supabase
          .from('school_educators')
          .select(`
            id,
            school_id,
            role,
            organizations!school_educators_school_id_fkey (
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

        if (schoolEducatorData && schoolEducatorData.organizations) {
          // They are a school educator
          const schoolData = Array.isArray(schoolEducatorData.organizations) 
            ? schoolEducatorData.organizations[0] 
            : schoolEducatorData.organizations;
          
          if (schoolData) {
            setSchool(schoolData as School);
            setCollege(null);
            setEducatorType('school');
            setEducatorRole(schoolEducatorData.role || null);

            // Fetch assigned class IDs for this educator (only if not admin)
            if (schoolEducatorData.role !== 'admin') {
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
            } else {
              // Admins don't need class assignments - they see all students
              setAssignedClassIds([]);
            }
            
            setLoading(false);
            return;
          }
        }

        // If not a school educator, check if they are a college lecturer
        const { data: collegeLecturerData, error: collegeLecturerError } = await supabase
          .from('college_lecturers')
          .select(`
            id,
            collegeId
          `)
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('📊 College lecturer query result:', {
          data: collegeLecturerData,
          error: collegeLecturerError
        });

        if (collegeLecturerError && collegeLecturerError.code !== 'PGRST116') {
          console.log('❌ College lecturer error:', collegeLecturerError);
          throw collegeLecturerError;
        }

        if (collegeLecturerData && collegeLecturerData.collegeId) {
          // Fetch college details from organizations table
          const { data: collegeData, error: collegeError } = await supabase
            .from('organizations')
            .select('id, name, code, city, state, country')
            .eq('id', collegeLecturerData.collegeId)
            .eq('organization_type', 'college')
            .maybeSingle();

          console.log('🏫 College data fetch result:', { collegeData, collegeError });

          if (collegeError) {
            console.warn('Failed to fetch college details:', collegeError);
          }

          if (collegeData) {
            // They are a college lecturer
            setCollege(collegeData as College);
            setSchool(null);
            setEducatorType('college');
            setEducatorRole('lecturer');

            // Fetch assigned college class IDs for this lecturer
            const { data: collegeClassAssignments, error: collegeClassError } = await supabase
              .from('college_faculty_class_assignments')
              .select('class_id')
              .eq('faculty_id', collegeLecturerData.id);

            if (collegeClassError) {
              console.warn('Failed to fetch college class assignments:', collegeClassError);
              setAssignedClassIds([]);
            } else {
              const classIds = collegeClassAssignments?.map(assignment => assignment.class_id) || [];
              setAssignedClassIds(classIds);
            }
            
            setLoading(false);
            return;
          }
        }

        // If neither, set everything to null
        setSchool(null);
        setCollege(null);
        setEducatorType(null);
        setEducatorRole(null);
        setAssignedClassIds([]);

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