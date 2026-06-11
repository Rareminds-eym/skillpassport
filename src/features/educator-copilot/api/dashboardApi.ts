import { apiGet } from '@/shared/api/apiClient';

export interface DashboardKPIs {
  totallearners: number;
  activelearners: number;
  pendingActivities: number;
  verifiedActivities: number;
  totalActivities: number;
  verificationRate: number;
  recentActivitiesCount: number;
  totalMentorNotes: number;
}

export interface RecentActivity {
  id: string;
  title: string;
  description: string;
  learnerName: string;
  category: string;
  status: 'pending' | 'sent_to_admin' | 'approved' | 'rejected';
  submittedDate: string;
}

export interface SkillAnalytics {
  skillParticipation: { skill: string; count: number }[];
  skillDistribution: { category: string; count: number }[];
}

export interface Announcement {
  id: string;
  message: string;
  createdAt: string;
}

export const dashboardApi = {
  async getKPIs(): Promise<DashboardKPIs> {
    try {
      const response: any = await apiGet('/educator/dashboard/kpis');
      return response.data;
    } catch {
      return { totallearners: 0, activelearners: 0, pendingActivities: 0, verifiedActivities: 0, totalActivities: 0, verificationRate: 0, recentActivitiesCount: 0, totalMentorNotes: 0 };
    }
  },

  async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    try {
      const response: any = await apiGet(`/educator/dashboard/recent-activities?limit=${limit}`);
      return response.data;
    } catch {
      return [];
    }
  },

  async getSkillAnalytics(): Promise<SkillAnalytics> {
    try {
      const response: any = await apiGet('/educator/dashboard/skill-analytics');
      return response.data;
    } catch {
      return { skillParticipation: [], skillDistribution: [] };
    }
  },

  async getAnnouncements(): Promise<Announcement[]> {
    return [
      { id: '1', message: 'Submit project by Friday', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: '2', message: 'School event on Monday', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    ];
  },

  async addAnnouncement(_message: string): Promise<boolean> {
    return true;
  },
};
