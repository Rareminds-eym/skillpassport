import { supabase } from '@/shared/api/supabaseClient';
import { buildDateRange, type FunnelRangePreset } from '@/features/analytics';

export interface CoursePerformance {
    name: string;
    totalCandidates: number;
    hiredCandidates: number;
    successRate: number;
}

export const getCoursePerformance = async (
    preset: FunnelRangePreset,
    start?: string,
    end?: string,
    limit: number = 4
): Promise<{ data: CoursePerformance[] | null; error: any }> => {
    try {
        const { startDate, endDate } = buildDateRange(preset, start, end);

        const { data: results, error: queryErr } = await supabase
            .from('pipeline_candidates')
            .select(`id, student_id, stage, status, students!inner(profile)`)
            .gte('added_at', startDate)
            .lte('added_at', endDate);

        if (queryErr) throw queryErr;
        if (!results || results.length === 0) return { data: [], error: null };

        const courseStats: Record<string, { total: number; hired: number }> = {};

        results.forEach((row: any) => {
            const course = row.students?.profile?.course || row.students?.profile?.program || 'Unknown';
            if (course && course !== 'Unknown') {
                if (!courseStats[course]) courseStats[course] = { total: 0, hired: 0 };
                courseStats[course].total += 1;
                const stage = (row.stage || '').toLowerCase();
                if (stage === 'hired' && row.status !== 'rejected') courseStats[course].hired += 1;
            }
        });

        const data: CoursePerformance[] = Object.entries(courseStats)
            .map(([name, stats]) => ({
                name,
                totalCandidates: stats.total,
                hiredCandidates: stats.hired,
                successRate: stats.total > 0 ? parseFloat(((stats.hired / stats.total) * 100).toFixed(1)) : 0,
            }))
            .sort((a, b) => b.totalCandidates - a.totalCandidates)
            .slice(0, limit);

        return { data, error: null };
    } catch (error) {
        console.error('Error fetching course performance:', error);
        return { data: null, error };
    }
};
