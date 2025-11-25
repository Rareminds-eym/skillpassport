// import { useState, useEffect } from 'react';
// import { supabase } from '../lib/supabaseClient';

// export const useStudentTraining = (studentId, enabled = true) => {
//   const [training, setTraining] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const fetchTraining = async () => {
//     if (!studentId || !enabled) return;

//     try {
//       setLoading(true);
//       setError(null);

//       const { data, error: fetchError } = await supabase
//         .from('trainings')
//         .select('*')
//         .eq('student_id', studentId)
//         .order('created_at', { ascending: false });

//       if (fetchError) {
//         throw fetchError;
//       }

//       // Transform data to match UI expectations
//       const transformedData = data.map(item => ({
//         id: item.id,
//         course: item.course_name || item.title || item.name,
//         provider: item.provider || item.organization,
//         duration: item.duration,
//         status: item.status || 'completed',
//         progress: item.progress || 100,
//         skills: item.skills_covered || [],
//         startDate: item.start_date,
//         endDate: item.end_date,
//         certificateUrl: item.certificate_url,
//         description: item.description,
//         enabled: item.enabled !== false,
//         verified: item.approval_status === 'approved',
//         processing: item.approval_status === 'pending',
//         createdAt: item.created_at,
//         updatedAt: item.updated_at
//       }));

//       setTraining(transformedData);
//     } catch (err) {
//       console.error('Error fetching training:', err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchTraining();
//   }, [studentId, enabled]);

//   const refresh = () => {
//     fetchTraining();
//   };

//   return {
//     training,
//     loading,
//     error,
//     refresh
//   };
// };

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
// Helper to clamp progress between 0 and 100
const clampProgress = (value) => Math.max(0, Math.min(100, value));

// Calculate progress based on completed/total modules
const calculateProgress = (completedModules, totalModules) => {
  if (!totalModules || totalModules === 0) return 0;
  const completed = Math.min(completedModules, totalModules);
  return clampProgress((completed / totalModules) * 100);
};
export const useStudentTraining = (studentId, enabled = true) => {
  const [training, setTraining] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTraining = async () => {
    if (!studentId || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Fetch trainings
      const { data: trainings, error: fetchError } = await supabase
        .from('trainings')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

        

      if (fetchError) throw fetchError;

      let result = [];

      for (const item of trainings) {
        const trainingId = item.id;

        // 2. Fetch related skills
        const { data: skillRows } = await supabase
          .from('skills')
          .select('name')
          .eq('training_id', trainingId)
          .eq('enabled', true);

        // 3. Fetch related certificate
        const { data: certificateRows } = await supabase
          .from('certificates')
          .select('link')
          .eq('training_id', trainingId)
          .eq('enabled', true)
          .limit(1);
          
          let progressValue = 0;
          const statusLower = (item.status || '').toLowerCase();
          if (statusLower === 'completed') {
            progressValue = 100;
          } else if (item.total_modules > 0) {
            progressValue = calculateProgress(item.completed_modules, item.total_modules);
          }
        result.push({
          id: item.id,
          course: item.title,
          provider: item.organization,
          duration: item.duration,
          description: item.description,
          startDate: item.start_date,
          endDate: item.end_date,
          // NEW → add module + hours details
   // NEW — modules & hours values added
          total_modules: item.total_modules,
          completed_modules: item.completed_modules,
          hours_spent: item.hours_spent,
          // skills list from skills table
          skills: skillRows?.map(s => s.name) || [],

          // certificate URL from certificates table
          certificateUrl: certificateRows?.[0]?.link || null,
          progress: progressValue,
        
          status: item.status,
          verified: item.approval_status === 'approved',
          processing: item.approval_status === 'pending',
          createdAt: item.created_at,
          updatedAt: item.updated_at
        });
      }

      setTraining(result);
    } catch (err) {
      console.error('Error fetching training:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraining();
  }, [studentId, enabled]);

  return { training, loading, error, refresh: fetchTraining };
};
  // progress,
          // progress: item.progress || 100,

// Calculate progress based on completed_modules / total_modules
          // let progress = 0;
          // if (item.total_modules && item.total_modules > 0) {
          //   progress = Math.round((item.completed_modules / item.total_modules) * 100);
          // }
           // Calculate progress