import { useMemo } from 'react';
import { CollegeEvent } from '../types';

export interface EventAnalytics {
  // Event counts by type
  eventsByType: { type: string; count: number; color: string }[];
  // Event counts by status
  eventsByStatus: { status: string; count: number; color: string }[];
  // Events by month (last 6 months)
  eventsByMonth: { month: string; count: number }[];
  // Registration stats
  registrationStats: {
    eventTitle: string;
    registered: number;
    capacity: number;
    percentage: number;
  }[];
  // Attendance rate
  attendanceRate: number;
  // Total stats
  totalEvents: number;
  totalRegistrations: number;
  avgRegistrationsPerEvent: number;
}

const typeColors: Record<string, string> = {
  seminar: '#3B82F6',
  workshop: '#10B981',
  cultural: '#F59E0B',
  sports: '#EF4444',
  placement: '#8B5CF6',
  guest_lecture: '#EC4899',
  orientation: '#06B6D4',
  other: '#6B7280',
};

const statusColors: Record<string, string> = {
  draft: '#9CA3AF',
  published: '#10B981',
  cancelled: '#EF4444',
  completed: '#3B82F6',
};

export const useEventAnalytics = (
  events: CollegeEvent[],
  eventRegCounts: Record<string, number>
): EventAnalytics => {
  return useMemo(() => {
    // Events by type
    const typeMap = new Map<string, number>();
    events.forEach((e) => {
      typeMap.set(e.event_type, (typeMap.get(e.event_type) || 0) + 1);
    });
    const eventsByType = Array.from(typeMap.entries()).map(([type, count]) => ({
      type: type.replace('_', ' '),
      count,
      color: typeColors[type] || '#6B7280',
    }));

    // Events by status
    const statusMap = new Map<string, number>();
    events.forEach((e) => {
      statusMap.set(e.status, (statusMap.get(e.status) || 0) + 1);
    });
    const eventsByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
      color: statusColors[status] || '#6B7280',
    }));

    // Events by month (last 6 months)
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const now = new Date();
    const monthsData: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const count = events.filter((e) => e.start_date.startsWith(monthKey)).length;
      monthsData.push({ month: monthNames[d.getMonth()], count });
    }

    // Registration stats (top 10 events by registration)
    const registrationStats = events
      .filter((e) => e.status === 'published' || e.status === 'completed')
      .map((e) => ({
        eventTitle: e.title.length > 20 ? e.title.substring(0, 20) + '...' : e.title,
        registered: eventRegCounts[e.id] || 0,
        capacity: e.capacity || 0,
        percentage: e.capacity ? Math.round(((eventRegCounts[e.id] || 0) / e.capacity) * 100) : 0,
      }))
      .sort((a, b) => b.registered - a.registered)
      .slice(0, 10);

    // Total registrations
    const totalRegistrations = Object.values(eventRegCounts).reduce((sum, c) => sum + c, 0);

    // Average registrations per event
    const publishedEvents = events.filter(
      (e) => e.status === 'published' || e.status === 'completed'
    ).length;
    const avgRegistrationsPerEvent =
      publishedEvents > 0 ? Math.round(totalRegistrations / publishedEvents) : 0;

    return {
      eventsByType,
      eventsByStatus,
      eventsByMonth: monthsData,
      registrationStats,
      attendanceRate: 0, // Would need attendance data
      totalEvents: events.length,
      totalRegistrations,
      avgRegistrationsPerEvent,
    };
  }, [events, eventRegCounts]);
};
