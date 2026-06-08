import type { QueryKey, ArchiveStatus } from './types';

export const collegeKeys = {
    // Base key for all college queries
    all: ['college'] as const,

    // Lecturer conversations
    lecturer: {
        all: ['college', 'lecturer'] as const,
        conversations: (lecturerId: string, status?: ArchiveStatus): QueryKey =>
            status
                ? ['college', 'lecturer', 'conversations', lecturerId, status] as const
                : ['college', 'lecturer', 'conversations', lecturerId] as const,
        messages: (conversationId: string): QueryKey =>
            ['college', 'lecturer', 'messages', conversationId] as const,
        details: (userId: string): QueryKey =>
            ['college', 'lecturer', 'details', userId] as const,
    },

    // Admin
    admin: {
        all: ['college', 'admin'] as const,
        id: (collegeId: string): QueryKey =>
            ['college', 'admin', 'id', collegeId] as const,
        messages: (conversationId: string): QueryKey =>
            ['college', 'admin', 'messages', conversationId] as const,
        school: (schoolAdminId: string): QueryKey =>
            ['college', 'admin', 'school', schoolAdminId] as const,
        // Conversations can be called as a function OR access nested methods
        conversations: Object.assign(
            // Main function: conversations(collegeId, status)
            (collegeId?: string, status?: string): QueryKey => {
                if (!collegeId && !status) {
                    return ['college', 'admin', 'conversations'] as const;
                }
                if (!status) {
                    return ['college', 'admin', 'conversations', collegeId] as const;
                }
                return ['college', 'admin', 'conversations', collegeId, status] as const;
            },
            {
                all: ['college', 'admin', 'conversations'] as const,
                byEducator: (educatorId: string, collegeId: string, status?: string): QueryKey =>
                    status
                        ? ['college', 'admin', 'conversations', 'educator', educatorId, collegeId, status] as const
                        : ['college', 'admin', 'conversations', 'educator', educatorId, collegeId] as const,
            }
        ),
    },

    // Departments
    departments: {
        all: ['college', 'departments'] as const,
        byCollege: (collegeId: string): QueryKey =>
            ['college', 'departments', collegeId] as const,
    },

    // Programs
    programs: {
        all: ['college', 'programs'] as const,
        byCollege: (collegeId: string): QueryKey =>
            ['college', 'programs', collegeId] as const,
    },
} as const;
