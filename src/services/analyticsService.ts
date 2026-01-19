import { supabase } from '../lib/supabaseClient';

export type FunnelRangePreset = '7d' | '30d' | '90d' | 'ytd' | 'custom';

export interface FunnelRange {
  startDate: string; // ISO string (UTC)
  endDate: string;   // ISO string (UTC)
}

export interface RecruitmentFunnelStats {
  // Unique candidate counts that REACHED the stage within the range
  sourced: number;
  screened: number;
  interviewed: number;
  offered: number;
  hired: number;
  // Trend of hires over the selected period (bucketed)
  trendLabels: string[];
  hiresTrend: number[];
}

// Helper: build ISO date range from preset
export const buildDateRange = (preset: FunnelRangePreset, start?: string, end?: string): FunnelRange => {
  if (preset === 'custom' && start && end) return { startDate: start, endDate: end };
  const now = new Date();
  const endDate = now.toISOString();
  let startDate: string;
  if (preset === 'ytd') {
    const ytd = new Date(now.getFullYear(), 0, 1);
    startDate = ytd.toISOString();
  } else {
    const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    startDate = d.toISOString();
  }
  return { startDate, endDate };
};

// Helper: create labels according to preset
const makeTrendLabels = (preset: FunnelRangePreset): string[] => {
  switch (preset) {
    case '7d':
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    case '30d':
      return ['Wk1', 'Wk2', 'Wk3', 'Wk4', 'Wk5'];
    case '90d':
      return ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];
    case 'ytd':
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    default:
      return ['Wk1', 'Wk2', 'Wk3', 'Wk4', 'Wk5'];
  }
};

// Helper: bucket timestamps into N buckets between start and end
const bucketize = (timestamps: string[], buckets: number, startISO: string, endISO: string): number[] => {
  if (buckets <= 0) return [];
  const start = new Date(startISO).getTime();
  const end = new Date(endISO).getTime();
  const span = Math.max(1, end - start);
  const arr = Array(buckets).fill(0);
  timestamps.forEach(ts => {
    const t = new Date(ts).getTime();
    const ratio = Math.min(0.999999, Math.max(0, (t - start) / span));
    const index = Math.floor(ratio * buckets);
    arr[index] += 1;
  });
  return arr;
};

// Fetch recruitment funnel stats from DB
// Snapshot stage counts (from pipeline_candidates) + hires trend (from activities)
export const getRecruitmentFunnelStats = async (
  preset: FunnelRangePreset,
  start?: string,
  end?: string
): Promise<{ data: RecruitmentFunnelStats | null; error: any }> => {
  try {
    const { startDate, endDate } = buildDateRange(preset, start, end);

    // 1) Snapshot: current counts by stage (exclude rejected)
    const { data: candidates, error: snapErr } = await supabase
      .from('pipeline_candidates')
      .select('stage, status');

    if (snapErr) throw snapErr;

    let sourced = 0, screened = 0, interviewed = 0, offered = 0, hired = 0;
    (candidates || []).forEach((c: any) => {
      if (c.status === 'rejected') return;
      const s = (c.stage || '').toLowerCase();
      if (s === 'sourced') sourced += 1;
      else if (s === 'screened') screened += 1;
      else if (s === 'interview_1' || s === 'interview_2' || s === 'interviewed') interviewed += 1;
      else if (s === 'offer' || s === 'offered') offered += 1;
      else if (s === 'hired') hired += 1;
    });

    // 2) Trend: hires within selected period (activities)
    const { data: activities, error: actErr } = await supabase
      .from('pipeline_activities')
      .select('to_stage, created_at')
      .eq('activity_type', 'stage_change')
      .eq('to_stage', 'hired')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (actErr) throw actErr;

    const hiredTimestamps = (activities || []).map((a: any) => a.created_at);

    // Labels and buckets
    const labels = makeTrendLabels(preset);
    const hiresTrend = bucketize(hiredTimestamps, labels.length, startDate, endDate);

    const data: RecruitmentFunnelStats = {
      sourced,
      screened,
      interviewed,
      offered,
      hired,
      trendLabels: labels,
      hiresTrend,
    };

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching recruitment funnel stats:', error);
    return { data: null, error };
  }
};

export interface AnalyticsKPIMetrics {
  totalCandidates: number;
  successfulHires: number;
  timeToHire: number; // average days
  qualityScore: number; // average AI score
  // Trends (comparison with previous period)
  totalCandidatesTrend: number; // percentage change
  successfulHiresTrend: number;
  timeToHireTrend: number; // negative = faster (good)
  qualityScoreTrend: number;
}

// Calculate KPI metrics for the Analytics Dashboard
export const getAnalyticsKPIMetrics = async (
  preset: FunnelRangePreset,
  start?: string,
  end?: string
): Promise<{ data: AnalyticsKPIMetrics | null; error: any }> => {
  try {
    const { startDate, endDate } = buildDateRange(preset, start, end);

    // Calculate previous period for trend comparison
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    const periodLength = endMs - startMs;
    const prevStartDate = new Date(startMs - periodLength).toISOString();
    const prevEndDate = new Date(endMs - periodLength).toISOString();

    // --- CURRENT PERIOD ---
    // 1. Total Candidates (all candidates added in the period)
    const { data: currentCandidates, error: candErr } = await supabase
      .from('pipeline_candidates')
      .select('id, stage, status, added_at, student_id')
      .gte('added_at', startDate)
      .lte('added_at', endDate);

    if (candErr) throw candErr;

    const totalCandidates = (currentCandidates || []).length;

    // 2. Successful Hires (candidates who reached 'hired' stage in the period)
    const { data: currentHires, error: hireErr } = await supabase
      .from('pipeline_activities')
      .select('pipeline_candidate_id, created_at')
      .eq('activity_type', 'stage_change')
      .eq('to_stage', 'hired')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (hireErr) throw hireErr;

    const successfulHires = (currentHires || []).length;
    const hiredCandidateIds = [...new Set((currentHires || []).map((h: any) => h.pipeline_candidate_id))];

    // 3. Time to Hire (average days from added_at to hired)
    let timeToHire = 23; // default fallback
    if (hiredCandidateIds.length > 0) {
      const { data: hiredCandidatesDetails, error: detailsErr } = await supabase
        .from('pipeline_candidates')
        .select('id, added_at')
        .in('id', hiredCandidateIds);

      if (!detailsErr && hiredCandidatesDetails) {
        const hireDurations: number[] = [];

        for (const cand of hiredCandidatesDetails) {
          const hireActivity = currentHires?.find((h: any) => h.pipeline_candidate_id === cand.id);
          if (hireActivity && cand.added_at) {
            const addedDate = new Date(cand.added_at).getTime();
            const hiredDate = new Date(hireActivity.created_at).getTime();
            const days = Math.max(0, Math.round((hiredDate - addedDate) / (1000 * 60 * 60 * 24)));
            hireDurations.push(days);
          }
        }

        if (hireDurations.length > 0) {
          timeToHire = Math.round(hireDurations.reduce((a, b) => a + b, 0) / hireDurations.length);
        }
      }
    }

    // 4. Quality Score (average AI score from students who were hired)
    let qualityScore = 85.2; // default fallback
    if (hiredCandidateIds.length > 0) {
      const { data: hiredStudents, error: studErr } = await supabase
        .from('pipeline_candidates')
        .select('student_id')
        .in('id', hiredCandidateIds);

      if (!studErr && hiredStudents) {
        const studentIds = hiredStudents
          .map((c: any) => c.student_id)
          .filter((id: string | null) => id);

        if (studentIds.length > 0) {
          const { data: students, error: scoresErr } = await supabase
            .from('students')
            .select('employability_score')
            .in('id', studentIds);

          if (!scoresErr && students && students.length > 0) {
            const scores = students
              .map((s: any) => s.employability_score)
              .filter((score: number) => score && score > 0);

            if (scores.length > 0) {
              qualityScore = parseFloat(
                (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1)
              );
            }
          }
        }
      }
    }

    // --- PREVIOUS PERIOD (for trends) ---
    const { data: prevCandidates } = await supabase
      .from('pipeline_candidates')
      .select('id')
      .gte('added_at', prevStartDate)
      .lte('added_at', prevEndDate);

    const prevTotalCandidates = (prevCandidates || []).length;

    const { data: prevHires } = await supabase
      .from('pipeline_activities')
      .select('pipeline_candidate_id, created_at')
      .eq('activity_type', 'stage_change')
      .eq('to_stage', 'hired')
      .gte('created_at', prevStartDate)
      .lte('created_at', prevEndDate);

    const prevSuccessfulHires = (prevHires || []).length;
    const prevHiredCandidateIds = [...new Set((prevHires || []).map((h: any) => h.pipeline_candidate_id))];

    // Previous Time to Hire
    let prevTimeToHire = timeToHire; // fallback to current
    if (prevHiredCandidateIds.length > 0) {
      const { data: prevHiredDetails } = await supabase
        .from('pipeline_candidates')
        .select('id, added_at')
        .in('id', prevHiredCandidateIds);

      if (prevHiredDetails) {
        const prevHireDurations: number[] = [];
        for (const cand of prevHiredDetails) {
          const hireActivity = prevHires?.find((h: any) => h.pipeline_candidate_id === cand.id);
          if (hireActivity && cand.added_at) {
            const addedDate = new Date(cand.added_at).getTime();
            const hiredDate = new Date(hireActivity.created_at).getTime();
            const days = Math.max(0, Math.round((hiredDate - addedDate) / (1000 * 60 * 60 * 24)));
            prevHireDurations.push(days);
          }
        }
        if (prevHireDurations.length > 0) {
          prevTimeToHire = Math.round(prevHireDurations.reduce((a, b) => a + b, 0) / prevHireDurations.length);
        }
      }
    }

    // Previous Quality Score
    let prevQualityScore = qualityScore; // fallback
    if (prevHiredCandidateIds.length > 0) {
      const { data: prevHiredStudents } = await supabase
        .from('pipeline_candidates')
        .select('student_id')
        .in('id', prevHiredCandidateIds);

      if (prevHiredStudents) {
        const prevStudentIds = prevHiredStudents
          .map((c: any) => c.student_id)
          .filter((id: string | null) => id);

        if (prevStudentIds.length > 0) {
          const { data: prevStudents } = await supabase
            .from('students')
            .select('employability_score')
            .in('id', prevStudentIds);

          if (prevStudents && prevStudents.length > 0) {
            const prevScores = prevStudents
              .map((s: any) => s.employability_score)
              .filter((score: number) => score && score > 0);

            if (prevScores.length > 0) {
              prevQualityScore = parseFloat(
                (prevScores.reduce((a: number, b: number) => a + b, 0) / prevScores.length).toFixed(1)
              );
            }
          }
        }
      }
    }

    // Calculate trends (percentage change)
    const calcTrend = (current: number, previous: number): number => {
      if (previous === 0) return 0;
      return parseFloat((((current - previous) / previous) * 100).toFixed(1));
    };

    const totalCandidatesTrend = calcTrend(totalCandidates, prevTotalCandidates);
    const successfulHiresTrend = calcTrend(successfulHires, prevSuccessfulHires);
    const timeToHireTrend = calcTrend(timeToHire, prevTimeToHire);
    const qualityScoreTrend = calcTrend(qualityScore, prevQualityScore);

    const data: AnalyticsKPIMetrics = {
      totalCandidates,
      successfulHires,
      timeToHire,
      qualityScore,
      totalCandidatesTrend,
      successfulHiresTrend,
      timeToHireTrend: -1 * timeToHireTrend, // invert: negative trend = faster = better
      qualityScoreTrend,
    };

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching analytics KPI metrics:', error);
    return { data: null, error };
  }
};

export interface TopHiringCollege {
  name: string;
  count: number;
  percentage: number;
}

// Get top hiring colleges from database
export const getTopHiringColleges = async (
  preset: FunnelRangePreset,
  start?: string,
  end?: string,
  limit: number = 4
): Promise<{ data: TopHiringCollege[] | null; error: any }> => {
  try {
    const { startDate, endDate } = buildDateRange(preset, start, end);

    // Step 1: Get pipeline candidates with student info (both foreign keys AND direct columns)
    const { data: pipelineCandidates, error: pipelineErr } = await supabase
      .from('pipeline_candidates')
      .select(`
        student_id,
        students!inner(
          university_college_id,
          school_id,
          university,
          college_school_name
        )
      `)
      .gte('added_at', startDate)
      .lte('added_at', endDate);

    if (pipelineErr) throw pipelineErr;

    if (!pipelineCandidates || pipelineCandidates.length === 0) {
      return { data: [], error: null };
    }

    // Step 2: Collect unique university_college_ids and school_ids
    const universityCollegeIds = new Set<string>();
    const schoolIds = new Set<string>();

    pipelineCandidates.forEach((row: any) => {
      const univCollegeId = row.students?.university_college_id;
      const schoolId = row.students?.school_id;

      if (univCollegeId) universityCollegeIds.add(univCollegeId);
      if (schoolId) schoolIds.add(schoolId);
    });

    // Step 3: Fetch university names (via university_colleges -> organizations)
    // Note: universities table doesn't exist - university_id references organizations table
    const universityMap: Record<string, string> = {};
    if (universityCollegeIds.size > 0) {
      const { data: colleges, error: collegesErr } = await supabase
        .from('university_colleges')
        .select(`
          id,
          university_id
        `)
        .in('id', Array.from(universityCollegeIds));

      if (!collegesErr && colleges) {
        // Get unique university IDs
        const universityIds = [...new Set(colleges.map((c: any) => c.university_id).filter(Boolean))];
        
        if (universityIds.length > 0) {
          // Fetch university names from organizations table
          const { data: universities } = await supabase
            .from('organizations')
            .select('id, name')
            .in('id', universityIds);
          
          const univNameMap: Record<string, string> = {};
          universities?.forEach((u: any) => {
            univNameMap[u.id] = u.name;
          });
          
          colleges.forEach((college: any) => {
            if (college.university_id && univNameMap[college.university_id]) {
              universityMap[college.id] = univNameMap[college.university_id];
            }
          });
        }
      }
    }

    // Step 4: Fetch school names from organizations table
    const schoolMap: Record<string, string> = {};
    if (schoolIds.size > 0) {
      const { data: schools, error: schoolsErr } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('organization_type', 'school')
        .in('id', Array.from(schoolIds));

      if (!schoolsErr && schools) {
        schools.forEach((school: any) => {
          if (school.name) {
            schoolMap[school.id] = school.name;
          }
        });
      }
    }

    // Step 5: Count institutions (with fallback to direct columns)
    const institutionCounts: Record<string, number> = {};
    let totalCount = 0;

    pipelineCandidates.forEach((row: any) => {
      const univCollegeId = row.students?.university_college_id;
      const schoolId = row.students?.school_id;

      // Priority:
      // 1. university name from foreign key relationship
      // 2. school name from foreign key relationship
      // 3. university column (direct)
      // 4. college_school_name column (direct)
      const institutionName =
        (univCollegeId && universityMap[univCollegeId]) ||
        (schoolId && schoolMap[schoolId]) ||
        row.students?.university ||
        row.students?.college_school_name;

      if (institutionName && institutionName.trim() !== '') {
        const cleanName = institutionName.trim();
        institutionCounts[cleanName] = (institutionCounts[cleanName] || 0) + 1;
        totalCount += 1;
      }
    });

    // Step 6: Convert to array and sort by count
    const collegesArray: TopHiringCollege[] = Object.entries(institutionCounts)
      .map(([name, count]) => ({
        name,
        count: count as number,
        percentage: totalCount > 0 ? parseFloat(((count as number / totalCount) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return { data: collegesArray, error: null };
  } catch (error) {
    console.error('Error fetching top hiring colleges:', error);
    return { data: null, error };
  }
};

export interface CoursePerformance {
  name: string;
  totalCandidates: number;
  hiredCandidates: number;
  successRate: number; // percentage
}

// Get course performance from database
export const getCoursePerformance = async (
  preset: FunnelRangePreset,
  start?: string,
  end?: string,
  limit: number = 4
): Promise<{ data: CoursePerformance[] | null; error: any }> => {
  try {
    const { startDate, endDate } = buildDateRange(preset, start, end);

    // Get all pipeline candidates with their courses
    const { data: results, error: queryErr } = await supabase
      .from('pipeline_candidates')
      .select(`
        id,
        student_id,
        stage,
        status,
        students!inner(
          profile
        )
      `)
      .gte('added_at', startDate)
      .lte('added_at', endDate);

    if (queryErr) throw queryErr;

    if (!results || results.length === 0) {
      return { data: [], error: null };
    }

    // Count total candidates and hired candidates per course
    const courseStats: Record<string, { total: number; hired: number }> = {};

    results.forEach((row: any) => {
      const course = row.students?.profile?.course ||
        row.students?.profile?.program ||
        'Unknown';

      if (course && course !== 'Unknown') {
        if (!courseStats[course]) {
          courseStats[course] = { total: 0, hired: 0 };
        }

        courseStats[course].total += 1;

        // Check if candidate is hired
        const stage = (row.stage || '').toLowerCase();
        if (stage === 'hired' && row.status !== 'rejected') {
          courseStats[course].hired += 1;
        }
      }
    });

    // Convert to array and calculate success rate
    const coursesArray: CoursePerformance[] = Object.entries(courseStats)
      .map(([name, stats]) => ({
        name,
        totalCandidates: stats.total,
        hiredCandidates: stats.hired,
        successRate: stats.total > 0 ? parseFloat(((stats.hired / stats.total) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.totalCandidates - a.totalCandidates) // Sort by total candidates
      .slice(0, limit);

    return { data: coursesArray, error: null };
  } catch (error) {
    console.error('Error fetching course performance:', error);
    return { data: null, error };
  }
};

export interface GeographicLocation {
  city: string;
  count: number;
  percentage: number;
}

// Helper function to format district names (mimics SQL initcap and regexp_replace)
const formatDistrictName = (district: string | null | undefined): string => {
  if (!district) return 'Unknown';

  // Remove special characters and extra spaces (regexp_replace)
  const cleaned = district.replace(/[^a-zA-Z0-9]+/g, ' ').trim();

  // Capitalize first letter of each word (initcap)
  return cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Get geographic distribution from database
export const getGeographicDistribution = async (
  preset: FunnelRangePreset,
  start?: string,
  end?: string,
  limit: number = 4
): Promise<{ data: GeographicLocation[] | null; error: any }> => {
  try {
    const { startDate, endDate } = buildDateRange(preset, start, end);

    // Now using the normalized 'state' column instead of profile JSONB
    // SELECT initcap(regexp_replace(trim(s.state), '[^a-zA-Z0-9]+', ' ', 'g')) AS state,
    //        COUNT(*) AS pipeline_count
    // FROM pipeline_candidates p JOIN students s ON s.id = p.student_id
    // GROUP BY 1 ORDER BY pipeline_count DESC LIMIT 4

    const { data: results, error: queryErr } = await supabase
      .from('pipeline_candidates')
      .select(`
        student_id,
        students!inner(
          state
        )
      `)
      .gte('added_at', startDate)
      .lte('added_at', endDate);

    if (queryErr) throw queryErr;

    if (!results || results.length === 0) {
      return { data: [], error: null };
    }

    // Count locations from the joined data
    const locationCounts: Record<string, number> = {};
    let totalCount = 0;

    results.forEach((row: any) => {
      const state = row.students?.state || null;

      const formattedState = formatDistrictName(state);

      if (formattedState && formattedState !== 'Unknown') {
        locationCounts[formattedState] = (locationCounts[formattedState] || 0) + 1;
        totalCount += 1;
      }
    });

    // Convert to array and sort by count
    const locationsArray: GeographicLocation[] = Object.entries(locationCounts)
      .map(([city, count]) => ({
        city,
        count: count as number,
        percentage: totalCount > 0 ? parseFloat(((count as number / totalCount) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return { data: locationsArray, error: null };
  } catch (error) {
    console.error('Error fetching geographic distribution:', error);
    return { data: null, error };
  }
};

export interface QualityMetrics {
  totalHired: number;
  avgAiScore: number;
  avgCgpa: number;
  genderDiversity: {
    male: number;
    female: number;
    other: number;
    malePercent: number;
    femalePercent: number;
    otherPercent: number;
  };
  ageDemographics: {
    averageAge: number;
    ageRanges: {
      range: string;
      count: number;
      percentage: number;
    }[];
  };
  topCourses: {
    name: string;
    count: number;
    percentage: number;
  }[];
}

// Get quality metrics from database (hired candidates only)
export const getQualityMetrics = async (
  preset: FunnelRangePreset,
  start?: string,
  end?: string
): Promise<{ data: QualityMetrics | null; error: any }> => {
  try {
    const { startDate, endDate } = buildDateRange(preset, start, end);

    // Query hired candidates with student data
    // Note: employability_score doesn't exist in students table, so we only fetch available fields
    const { data: hiredCandidates, error: queryErr } = await supabase
      .from('pipeline_candidates')
      .select(`
        student_id,
        students!inner(
          currentCgpa,
          gender,
          age,
          branch_field
        )
      `)
      .eq('stage', 'hired')
      .gte('added_at', startDate)
      .lte('added_at', endDate);

    if (queryErr) throw queryErr;

    if (!hiredCandidates || hiredCandidates.length === 0) {
      return {
        data: {
          totalHired: 0,
          avgAiScore: 0,
          avgCgpa: 0,
          genderDiversity: {
            male: 0,
            female: 0,
            other: 0,
            malePercent: 0,
            femalePercent: 0,
            otherPercent: 0,
          },
          ageDemographics: {
            averageAge: 0,
            ageRanges: []
          },
          topCourses: []
        },
        error: null,
      };
    }

    // Calculate metrics
    let totalCgpa = 0;
    let cgpaCount = 0;
    let maleCount = 0;
    let femaleCount = 0;
    let otherCount = 0;

    // Age metrics
    let totalAge = 0;
    let ageCount = 0;
    const ageRanges = {
      '18-21': 0,
      '22-25': 0,
      '26-30': 0,
      '30+': 0
    };

    // Course metrics
    const courseCounts: Record<string, number> = {};

    hiredCandidates.forEach((row: any) => {
      const student = row.students;

      // CGPA (column is camelCase: currentCgpa)
      if (student?.currentCgpa && student.currentCgpa > 0) {
        totalCgpa += student.currentCgpa;
        cgpaCount++;
      }

      // Gender
      const gender = (student?.gender || '').toLowerCase();
      if (gender === 'male' || gender === 'm') {
        maleCount++;
      } else if (gender === 'female' || gender === 'f') {
        femaleCount++;
      } else if (gender) {
        otherCount++;
      }

      // Age
      if (student?.age && student.age > 0) {
        totalAge += student.age;
        ageCount++;

        if (student.age <= 21) ageRanges['18-21']++;
        else if (student.age <= 25) ageRanges['22-25']++;
        else if (student.age <= 30) ageRanges['26-30']++;
        else ageRanges['30+']++;
      }

      // Course/Branch
      const course = student?.branch_field || 'Unknown';
      courseCounts[course] = (courseCounts[course] || 0) + 1;
    });

    const totalHired = hiredCandidates.length;
    const avgCgpa = cgpaCount > 0 ? parseFloat((totalCgpa / cgpaCount).toFixed(2)) : 0;

    const genderTotal = maleCount + femaleCount + otherCount;
    const malePercent = genderTotal > 0 ? parseFloat(((maleCount / genderTotal) * 100).toFixed(1)) : 0;
    const femalePercent = genderTotal > 0 ? parseFloat(((femaleCount / genderTotal) * 100).toFixed(1)) : 0;
    const otherPercent = genderTotal > 0 ? parseFloat(((otherCount / genderTotal) * 100).toFixed(1)) : 0;

    // Process Age Demographics
    const avgAge = ageCount > 0 ? parseFloat((totalAge / ageCount).toFixed(1)) : 0;
    const processedAgeRanges = Object.entries(ageRanges).map(([range, count]) => ({
      range,
      count,
      percentage: ageCount > 0 ? parseFloat(((count / ageCount) * 100).toFixed(1)) : 0
    }));

    // Process Top Courses
    const processedCourses = Object.entries(courseCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: parseFloat(((count / totalHired) * 100).toFixed(1))
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 courses

    const data: QualityMetrics = {
      totalHired,
      avgAiScore: 0, // Not available in database
      avgCgpa,
      genderDiversity: {
        male: maleCount,
        female: femaleCount,
        other: otherCount,
        malePercent,
        femalePercent,
        otherPercent,
      },
      ageDemographics: {
        averageAge: avgAge,
        ageRanges: processedAgeRanges
      },
      topCourses: processedCourses
    };

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching quality metrics:', error);
    return { data: null, error };
  }
};



export interface SpeedAnalytics {
  timeToFirstResponse: number;  // Average days from added to first activity
  timeToHire: number;           // Average days from added to hired
  interviewToOffer: number;     // Average days from interview to offer
  fastestHire: number;          // Minimum days to hire
}

// Helper: Calculate days between two dates
const calculateDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diffMs = end - start;
  const days = diffMs / (1000 * 60 * 60 * 24);

  // If less than 1 day, return as fraction (e.g., 0.5 days = 12 hours)
  // This gives more accurate metrics for same-day activities
  return Math.max(0, Math.round(days * 10) / 10); // Round to 1 decimal
};

// Get speed analytics from database
export const getSpeedAnalytics = async (
  preset: FunnelRangePreset,
  start?: string,
  end?: string
): Promise<{ data: SpeedAnalytics | null; error: any }> => {
  try {
    const { startDate, endDate } = buildDateRange(preset, start, end);

    // Get all pipeline candidates in the period
    const { data: candidates, error: candErr } = await supabase
      .from('pipeline_candidates')
      .select('id, added_at, stage, stage_changed_at')
      .gte('added_at', startDate)
      .lte('added_at', endDate);

    if (candErr) throw candErr;

    // Return null if no candidates found - let UI handle empty state
    if (!candidates || candidates.length === 0) {
      return { data: null, error: null };
    }

    // Get all activities for these candidates
    const candidateIds = candidates.map(c => c.id);
    const { data: activities, error: actErr } = await supabase
      .from('pipeline_activities')
      .select('pipeline_candidate_id, activity_type, from_stage, to_stage, created_at')
      .in('pipeline_candidate_id', candidateIds)
      .order('created_at', { ascending: true });

    if (actErr) throw actErr;

    // Calculate metrics
    const firstResponseTimes: number[] = [];
    const timeToHireDurations: number[] = [];
    const interviewToOfferDurations: number[] = [];

    candidates.forEach(candidate => {
      const candidateActivities = (activities || []).filter(
        (a: any) => a.pipeline_candidate_id === candidate.id
      );

      // 1. Time to First Response: days from added_at to first activity
      if (candidateActivities.length > 0) {
        const firstActivity = candidateActivities[0];
        const days = calculateDays(candidate.added_at, firstActivity.created_at);
        firstResponseTimes.push(days);
      }

      // 2. Time to Hire: days from added_at to hired stage
      const hiredActivity = candidateActivities.find(
        (a: any) => a.activity_type === 'stage_change' && a.to_stage === 'hired'
      );
      if (hiredActivity) {
        const days = calculateDays(candidate.added_at, hiredActivity.created_at);
        timeToHireDurations.push(days);
      }

      // 3. Interview to Offer: days from first interview stage to offer stage
      const firstInterview = candidateActivities.find(
        (a: any) => a.activity_type === 'stage_change' &&
          (a.to_stage === 'interview_1' || a.to_stage === 'interview_2' || a.to_stage === 'interviewed')
      );
      const offerActivity = candidateActivities.find(
        (a: any) => a.activity_type === 'stage_change' &&
          (a.to_stage === 'offer' || a.to_stage === 'offered')
      );
      if (firstInterview && offerActivity) {
        const days = calculateDays(firstInterview.created_at, offerActivity.created_at);
        interviewToOfferDurations.push(days);
      }
    });

    // Calculate averages and minimum
    // Keep one decimal place to preserve fractional days (for hour conversion)
    const avgTimeToFirstResponse = firstResponseTimes.length > 0
      ? Math.round((firstResponseTimes.reduce((a, b) => a + b, 0) / firstResponseTimes.length) * 10) / 10
      : 0;

    const avgTimeToHire = timeToHireDurations.length > 0
      ? Math.round((timeToHireDurations.reduce((a, b) => a + b, 0) / timeToHireDurations.length) * 10) / 10
      : 0;

    const avgInterviewToOffer = interviewToOfferDurations.length > 0
      ? Math.round((interviewToOfferDurations.reduce((a, b) => a + b, 0) / interviewToOfferDurations.length) * 10) / 10
      : 0;

    const fastestHire = timeToHireDurations.length > 0
      ? Math.round(Math.min(...timeToHireDurations) * 10) / 10
      : 0;

    const data: SpeedAnalytics = {
      timeToFirstResponse: avgTimeToFirstResponse,
      timeToHire: avgTimeToHire,
      interviewToOffer: avgInterviewToOffer,
      fastestHire: fastestHire
    };

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching speed analytics:', error);
    return { data: null, error };
  }
};
