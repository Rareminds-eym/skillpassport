// import { useState, useEffect } from 'react';
// import { supabase } from '../lib/supabaseClient';

// export const useStudentProjects = (studentId, enabled = true) => {
//   const [projects, setProjects] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const fetchProjects = async () => {
//     if (!studentId || !enabled) return;

//     try {
//       setLoading(true);
//       setError(null);

//       const { data, error: fetchError } = await supabase
//         .from('projects')
//         .select('*')
//         .eq('student_id', studentId)
//         .order('created_at', { ascending: false });

//       if (fetchError) {
//         throw fetchError;
//       }

//       // Transform data to match UI expectations
//       const transformedData = data.map(item => ({
//         id: item.id,
//         title: item.title || item.name,
//         description: item.description,
//         status: item.status || 'completed',
//         startDate: item.start_date,
//         endDate: item.end_date,
//         duration: item.duration,
//         organization: item.organization,
//         tech: item.tech_stack || [],
//         techStack: item.tech_stack || [],
//         technologies: item.tech_stack || [],
//         skills: item.skills_used || [],
//         demoLink: item.demo_link,
//         demo_link: item.demo_link,
//         link: item.demo_link,
//         githubLink: item.github_link,
//         github_link: item.github_link,
//         github: item.github_link,
//         github_url: item.github_link,
//         certificateUrl: item.certificate_url,
//         videoUrl: item.video_url,
//         pptUrl: item.ppt_url,
//         approval_status: item.approval_status || 'pending',
//         verified: item.approval_status === 'approved',
//         processing: item.approval_status === 'pending',
//         enabled: item.enabled !== false,
//         createdAt: item.created_at,
//         updatedAt: item.updated_at
//       }));

//       setProjects(transformedData);
//     } catch (err) {
//       console.error('Error fetching projects:', err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchProjects();
//   }, [studentId, enabled]);

//   const refresh = () => {
//     fetchProjects();
//   };

//   return {
//     projects,
//     loading,
//     error,
//     refresh
//   };
// };
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useStudentProjects = (studentId, enabled = true) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjects = async () => {
    if (!studentId || !enabled) {
      console.log('⚠️ useStudentProjects: Skipping fetch', { studentId, enabled });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 useStudentProjects: Fetching projects for student:', studentId);

      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('student_id', studentId)
        // Fetch ALL projects (including hidden and pending) - filtering happens in display components
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      console.log('✅ useStudentProjects: Fetched projects:', {
        count: data?.length || 0,
        projects: data
      });

      // Transform data to match UI expectations
      // Include versioning fields for proper display logic
      const transformedData = data.map(item => ({
        id: item.id,
        title: item.title || item.name,
        description: item.description,
        role: item.role,
        status: item.status || 'completed',
        startDate: item.start_date,
        endDate: item.end_date,
        duration: item.duration,
        organization: item.organization,
        tech: item.tech_stack || [],
        techStack: item.tech_stack || [],
        technologies: item.tech_stack || [],
        skills: item.skills_used || [],
        // Demo Link mappings
        demoLink: item.demo_link,
        demoUrl: item.demo_link,
        demo_link: item.demo_link,
        link: item.demo_link,
        // GitHub Link mappings
        githubLink: item.github_link,
        githubUrl: item.github_link,
        github_link: item.github_link,
        github: item.github_link,
        github_url: item.github_link,
        // Other URLs
        certificateUrl: item.certificate_url,
        videoUrl: item.video_url,
        pptUrl: item.ppt_url,
        // Status and metadata
        approval_status: item.approval_status,
        verified: item.approval_status === 'approved' || item.approval_status === 'verified',
        processing: item.approval_status === 'pending',
        enabled: item.enabled !== false,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        verifiedAt: item.updated_at || item.created_at,
        // Versioning fields - IMPORTANT for pending approval display
        has_pending_edit: item.has_pending_edit || false,
        verified_data: item.verified_data,
        pending_edit_data: item.pending_edit_data,
        // Add flag for easy checking in components
        _hasPendingEdit: item.has_pending_edit === true
      }));

      setProjects(transformedData);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [studentId, enabled]);

  const refresh = () => {
    fetchProjects();
  };

  return {
    projects,
    loading,
    error,
    refresh
  };
};