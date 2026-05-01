import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('analytics-service');

export type FunnelRangePreset = '7d' | '30d' | '90d' | 'ytd' | 'custom';

export interface GeographicLocation {
  city: string;
  count: number;
  percentage: number;
}

export interface TopHiringCollege {
  name: string;
  count: number;
  percentage: number;
}

// Helper: build ISO date range from preset
export const buildDateRange = (preset: FunnelRangePreset, start?: string, end?: string) => {
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

// Get geographic distribution from database
export const getGeographicDistribution = async (
  preset: FunnelRangePreset,
  start?: string,
  end?: string,
  limit: number = 4
): Promise<{ data: GeographicLocation[] | null; error: any }> => {
  try {
    const { startDate, endDate } = buildDateRange(preset, start, end);

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

    const locationCounts: Record<string, number> = {};
    let totalCount = 0;

    results.forEach((row: any) => {
      const state = row.students?.state || 'Unknown';
      locationCounts[state] = (locationCounts[state] || 0) + 1;
      totalCount += 1;
    });

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
    logger.error('Geographic distribution fetch failed', error instanceof Error ? error : new Error(String(error)), {
      preset
    });
    return { data: null, error };
  }
};

// Get top hiring colleges from database
export const getTopHiringColleges = async (
  preset: FunnelRangePreset,
  start?: string,
  end?: string,
  limit: number = 4
): Promise<{ data: TopHiringCollege[] | null; error: any }> => {
  try {
    const { startDate, endDate } = buildDateRange(preset, start, end);

    const { data: pipelineCandidates, error: pipelineErr } = await supabase
      .from('pipeline_candidates')
      .select(`
        student_id,
        students!inner(
          college_school_name
        )
      `)
      .gte('added_at', startDate)
      .lte('added_at', endDate);

    if (pipelineErr) throw pipelineErr;

    if (!pipelineCandidates || pipelineCandidates.length === 0) {
      return { data: [], error: null };
    }

    const collegeCounts: Record<string, number> = {};
    let totalCount = 0;

    pipelineCandidates.forEach((row: any) => {
      const collegeName = row.students?.college_school_name || 'Unknown';
      collegeCounts[collegeName] = (collegeCounts[collegeName] || 0) + 1;
      totalCount += 1;
    });

    const collegesArray: TopHiringCollege[] = Object.entries(collegeCounts)
      .map(([name, count]) => ({
        name,
        count: count as number,
        percentage: totalCount > 0 ? parseFloat(((count as number / totalCount) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return { data: collegesArray, error: null };
  } catch (error) {
    logger.error('Top hiring colleges fetch failed', error instanceof Error ? error : new Error(String(error)), {
      preset
    });
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

    let totalCgpa = 0;
    let cgpaCount = 0;
    let maleCount = 0;
    let femaleCount = 0;
    let otherCount = 0;

    let totalAge = 0;
    let ageCount = 0;
    const ageRanges = {
      '18-21': 0,
      '22-25': 0,
      '26-30': 0,
      '30+': 0
    };

    const courseCounts: Record<string, number> = {};

    hiredCandidates.forEach((row: any) => {
      const student = row.students;

      if (student?.currentCgpa && student.currentCgpa > 0) {
        totalCgpa += student.currentCgpa;
        cgpaCount++;
      }

      const gender = (student?.gender || '').toLowerCase();
      if (gender === 'male' || gender === 'm') {
        maleCount++;
      } else if (gender === 'female' || gender === 'f') {
        femaleCount++;
      } else if (gender) {
        otherCount++;
      }

      if (student?.age && student.age > 0) {
        totalAge += student.age;
        ageCount++;

        if (student.age <= 21) ageRanges['18-21']++;
        else if (student.age <= 25) ageRanges['22-25']++;
        else if (student.age <= 30) ageRanges['26-30']++;
        else ageRanges['30+']++;
      }

      const course = student?.branch_field || 'Unknown';
      courseCounts[course] = (courseCounts[course] || 0) + 1;
    });

    const totalHired = hiredCandidates.length;
    const avgCgpa = cgpaCount > 0 ? parseFloat((totalCgpa / cgpaCount).toFixed(2)) : 0;

    const genderTotal = maleCount + femaleCount + otherCount;
    const malePercent = genderTotal > 0 ? parseFloat(((maleCount / genderTotal) * 100).toFixed(1)) : 0;
    const femalePercent = genderTotal > 0 ? parseFloat(((femaleCount / genderTotal) * 100).toFixed(1)) : 0;
    const otherPercent = genderTotal > 0 ? parseFloat(((otherCount / genderTotal) * 100).toFixed(1)) : 0;

    const avgAge = ageCount > 0 ? parseFloat((totalAge / ageCount).toFixed(1)) : 0;
    const processedAgeRanges = Object.entries(ageRanges).map(([range, count]) => ({
      range,
      count,
      percentage: ageCount > 0 ? parseFloat(((count / ageCount) * 100).toFixed(1)) : 0
    }));

    const processedCourses = Object.entries(courseCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: parseFloat(((count / totalHired) * 100).toFixed(1))
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const data: QualityMetrics = {
      totalHired,
      avgAiScore: 0,
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
    logger.error('Quality metrics fetch failed', error instanceof Error ? error : new Error(String(error)), {
      preset
    });
    return { data: null, error };
  }
};
