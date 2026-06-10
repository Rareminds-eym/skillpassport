import { apiGet } from '@/shared/api/apiClient';
import { buildDateRange, type FunnelRangePreset } from '@/features/analytics';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('course-performance-service');

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

        const results = await apiGet<any[]>(`/courses/performance?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);

        if (!results || results.length === 0) return { data: [], error: null };

        const courseStats: Record<string, { total: number; hired: number }> = {};

        (results as any[]).forEach((row: any) => {
            const course = row.learners?.profile?.course || row.learners?.profile?.program || 'Unknown';
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
        logger.error('Error fetching course performance', error instanceof Error ? error : new Error(String(error)));
        return { data: null, error };
    }
};
