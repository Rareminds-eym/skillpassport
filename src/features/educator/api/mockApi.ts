import { mocklearners, Learner } from '@/features/educator/model/mocklearners';
import { mockActivities, Activity } from '@/features/educator/model/mockActivities';
import { mockMediaAssets, MediaAsset } from '@/features/educator/model/mockMedia';
import { mockClasses, Class } from '@/features/educator/model/mockClasses';
import { mockApiCall } from '@/features/hooks/educator/useMockApi';

/**
 * Mock API service for educator module
 * This service provides all the mock data access methods
 * Can be easily replaced with real API calls later
 */

// Learner APIs
export const educatorApi = {
  // Learners
  learners: {
    getAll: async (filters?: {
      class?: string;
      section?: string;
      status?: string;
      search?: string;
    }): Promise<Learner[]> => {
      let filtered = [...mocklearners];

      if (filters) {
        if (filters.class) {
          filtered = filtered.filter((s) => s.class === filters.class);
        }
        if (filters.section) {
          filtered = filtered.filter((s) => s.section === filters.section);
        }
        if (filters.status) {
          filtered = filtered.filter((s) => s.status === filters.status);
        }
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filtered = filtered.filter(
            (s) =>
              s.name.toLowerCase().includes(searchLower) ||
              s.email.toLowerCase().includes(searchLower)
          );
        }
      }

      return mockApiCall(filtered);
    },

    getById: async (id: string): Promise<Learner | null> => {
      const learner = mocklearners.find((s) => s.id === id);
      return mockApiCall(learner || null);
    },

    create: async (learnerData: Partial<Learner>): Promise<Learner> => {
      const newLearner: Learner = {
        id: `std-${Date.now()}`,
        name: learnerData.name || '',
        email: learnerData.email || '',
        class: learnerData.class || '',
        section: learnerData.section || '',
        skills: learnerData.skills || [],
        progress: 0,
        status: 'active',
        joinedDate: new Date().toISOString(),
        activitiesCount: 0,
        verifiedActivitiesCount: 0,
        portfolioComplete: false,
      };
      return mockApiCall(newLearner);
    },

    update: async (id: string, updates: Partial<Learner>): Promise<Learner> => {
      const learner = mocklearners.find((s) => s.id === id);
      if (!learner) throw new Error('Learner not found');
      const updated = { ...learner, ...updates };
      return mockApiCall(updated);
    },

    delete: async (id: string): Promise<void> => {
      return mockApiCall(undefined);
    },
  },

  // Activities
  activities: {
    getAll: async (filters?: {
      status?: string;
      category?: string;
      learnerId?: string;
    }): Promise<Activity[]> => {
      let filtered = [...mockActivities];

      if (filters) {
        if (filters.status) {
          filtered = filtered.filter((a) => a.status === filters.status);
        }
        if (filters.category) {
          filtered = filtered.filter((a) => a.category === filters.category);
        }
        if (filters.learnerId) {
          filtered = filtered.filter((a) => a.learnerId === filters.learnerId);
        }
      }

      return mockApiCall(filtered);
    },

    getById: async (id: string): Promise<Activity | null> => {
      const activity = mockActivities.find((a) => a.id === id);
      return mockApiCall(activity || null);
    },

    verify: async (id: string, verifiedBy: string): Promise<Activity> => {
      const activity = mockActivities.find((a) => a.id === id);
      if (!activity) throw new Error('Activity not found');
      const updated = {
        ...activity,
        status: 'verified' as const,
        verifiedDate: new Date().toISOString(),
        verifiedBy,
      };
      return mockApiCall(updated);
    },

    reject: async (id: string, reason: string): Promise<Activity> => {
      const activity = mockActivities.find((a) => a.id === id);
      if (!activity) throw new Error('Activity not found');
      const updated = {
        ...activity,
        status: 'rejected' as const,
        rejectionReason: reason,
      };
      return mockApiCall(updated);
    },

    create: async (activityData: Partial<Activity>): Promise<Activity> => {
      const newActivity: Activity = {
        id: `act-${Date.now()}`,
        learnerId: activityData.learnerId || '',
        learnerName: activityData.learnerName || '',
        title: activityData.title || '',
        description: activityData.description || '',
        category: activityData.category || 'project',
        status: 'pending',
        submittedDate: new Date().toISOString(),
        media: activityData.media || [],
        skills: activityData.skills || [],
      };
      return mockApiCall(newActivity);
    },
  },

  // Media
  media: {
    getAll: async (filters?: {
      type?: string;
      category?: string;
      search?: string;
    }): Promise<MediaAsset[]> => {
      let filtered = [...mockMediaAssets];

      if (filters) {
        if (filters.type) {
          filtered = filtered.filter((m) => m.type === filters.type);
        }
        if (filters.category) {
          filtered = filtered.filter((m) => m.category === filters.category);
        }
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filtered = filtered.filter(
            (m) =>
              m.name.toLowerCase().includes(searchLower) ||
              m.tags.some((tag) => tag.toLowerCase().includes(searchLower))
          );
        }
      }

      return mockApiCall(filtered);
    },

    upload: async (file: File): Promise<MediaAsset> => {
      const newMedia: MediaAsset = {
        id: `med-${Date.now()}`,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        url: URL.createObjectURL(file),
        size: file.size,
        uploadedBy: 'Current User',
        uploadedDate: new Date().toISOString(),
        category: 'General',
        tags: [],
        usedIn: [],
      };
      return mockApiCall(newMedia, { latency: 1000 });
    },

    delete: async (id: string): Promise<void> => {
      return mockApiCall(undefined);
    },
  },

  // Classes
  classes: {
    getAll: async (): Promise<Class[]> => {
      return mockApiCall(mockClasses);
    },

    getById: async (id: string): Promise<Class | null> => {
      const classItem = mockClasses.find((c) => c.id === id);
      return mockApiCall(classItem || null);
    },

    create: async (classData: Partial<Class>): Promise<Class> => {
      const newClass: Class = {
        id: `cls-${Date.now()}`,
        name: classData.name || '',
        section: classData.section || '',
        grade: classData.grade || '',
        teacher: classData.teacher || '',
        learnerCount: classData.learnerCount || 0,
        schedule: classData.schedule || '',
        room: classData.room || '',
        subject: classData.subject,
      };
      return mockApiCall(newClass);
    },

    update: async (id: string, updates: Partial<Class>): Promise<Class> => {
      const classItem = mockClasses.find((c) => c.id === id);
      if (!classItem) throw new Error('Class not found');
      const updated = { ...classItem, ...updates };
      return mockApiCall(updated);
    },

    delete: async (id: string): Promise<void> => {
      return mockApiCall(undefined);
    },
  },

  // Dashboard KPIs
  dashboard: {
    getKPIs: async () => {
      const totallearners = mocklearners.length;
      const activelearners = mocklearners.filter((s) => s.status === 'active').length;
      const pendingActivities = mockActivities.filter((a) => a.status === 'pending').length;
      const verifiedActivities = mockActivities.filter((a) => a.status === 'verified').length;
      const totalActivities = mockActivities.length;
      const verificationRate = totalActivities > 0 ? (verifiedActivities / totalActivities) * 100 : 0;

      return mockApiCall({
        totallearners,
        activelearners,
        pendingActivities,
        verifiedActivities,
        totalActivities,
        verificationRate: Math.round(verificationRate),
        recentActivitiesCount: mockActivities.filter(
          (a) =>
            new Date(a.submittedDate) >
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
      });
    },

    getSkillAnalytics: async () => {
      // Count skill participation (activities per skill)
      const skillCounts: { [key: string]: number } = {};
      mockActivities.forEach(activity => {
        activity.skills.forEach(skill => {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        });
      });

      // Count skill distribution by category
      const categoryCounts: { [key: string]: number } = {};
      mockActivities.forEach(activity => {
        categoryCounts[activity.category] = (categoryCounts[activity.category] || 0) + 1;
      });

      return mockApiCall({
        skillParticipation: Object.entries(skillCounts).map(([skill, count]) => ({
          skill,
          count,
        })),
        skillDistribution: Object.entries(categoryCounts).map(([category, count]) => ({
          category,
          count,
        })),
      });
    },
  },
};
