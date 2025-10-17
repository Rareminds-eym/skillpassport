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
      return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    case '30d':
      return ['Wk1','Wk2','Wk3','Wk4','Wk5'];
    case '90d':
      return ['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12'];
    case 'ytd':
      return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    default:
      return ['Wk1','Wk2','Wk3','Wk4','Wk5'];
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

    // Use RPC or direct query to get university counts from pipeline_candidates + students
    // This mirrors: SELECT s.profile ->> 'university' AS university, COUNT(*) AS pipeline_count
    //               FROM pipeline_candidates p JOIN students s ON s.id = p.student_id
    //               GROUP BY s.profile ->> 'university' ORDER BY pipeline_count DESC LIMIT 4
    
    const { data: results, error: queryErr } = await supabase
      .from('pipeline_candidates')
      .select(`
        student_id,
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

    // Count universities from the joined data
    const universityCounts: Record<string, number> = {};
    let totalCount = 0;

    results.forEach((row: any) => {
      const university = row.students?.profile?.university || 
                        row.students?.profile?.college || 
                        'Unknown';
      if (university && university !== 'Unknown') {
        universityCounts[university] = (universityCounts[university] || 0) + 1;
        totalCount += 1;
      }
    });

    // Convert to array and sort by count
    const collegesArray: TopHiringCollege[] = Object.entries(universityCounts)
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
