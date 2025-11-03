import { mockStudents, Student } from '../../data/educator/mockStudents';
import { mockActivities, Activity } from '../../data/educator/mockActivities';
import { mockMediaAssets, MediaAsset } from '../../data/educator/mockMedia';
import { mockClasses, Class } from '../../data/educator/mockClasses';
import { mockApiCall } from '../../hooks/educator/useMockApi';

/**
 * Mock API service for educator module
 * This service provides all the mock data access methods
 * Can be easily replaced with real API calls later
 */

// Student APIs
export const educatorApi = {
  // Students
  students: {
    getAll: async (filters?: {
      class?: string;
      section?: string;
      status?: string;
      search?: string;
    }): Promise<Student[]> => {
      let filtered = [...mockStudents];

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

    getById: async (id: string): Promise<Student | null> => {
      const student = mockStudents.find((s) => s.id === id);
      return mockApiCall(student || null);
    },

    create: async (studentData: Partial<Student>): Promise<Student> => {
      const newStudent: Student = {
        id: `std-${Date.now()}`,
        name: studentData.name || '',
        email: studentData.email || '',
        class: studentData.class || '',
        section: studentData.section || '',
        skills: studentData.skills || [],
        progress: 0,
        status: 'active',
        joinedDate: new Date().toISOString(),
        activitiesCount: 0,
        verifiedActivitiesCount: 0,
        portfolioComplete: false,
      };
      return mockApiCall(newStudent);
    },

    update: async (id: string, updates: Partial<Student>): Promise<Student> => {
      const student = mockStudents.find((s) => s.id === id);
      if (!student) throw new Error('Student not found');
      const updated = { ...student, ...updates };
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
      studentId?: string;
    }): Promise<Activity[]> => {
      let filtered = [...mockActivities];

      if (filters) {
        if (filters.status) {
          filtered = filtered.filter((a) => a.status === filters.status);
        }
        if (filters.category) {
          filtered = filtered.filter((a) => a.category === filters.category);
        }
        if (filters.studentId) {
          filtered = filtered.filter((a) => a.studentId === filters.studentId);
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
        studentId: activityData.studentId || '',
        studentName: activityData.studentName || '',
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
        studentCount: classData.studentCount || 0,
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
      const totalStudents = mockStudents.length;
      const activeStudents = mockStudents.filter((s) => s.status === 'active').length;
      const pendingActivities = mockActivities.filter((a) => a.status === 'pending').length;
      const verifiedActivities = mockActivities.filter((a) => a.status === 'verified').length;
      const totalActivities = mockActivities.length;
      const verificationRate = totalActivities > 0 ? (verifiedActivities / totalActivities) * 100 : 0;

      return mockApiCall({
        totalStudents,
        activeStudents,
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
  },
};
