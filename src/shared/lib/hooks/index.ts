// Toast notifications
export { useToast, toast } from './use-toast';

// Responsive design
export { useResponsive } from './useresponsive';

// Assessment & Testing
export { useAdaptiveAptitude } from '@/features/assessment/model/useAdaptiveAptitude';
export { useAntiCheating } from './useAntiCheating';

// Subscription & Add-ons
export { useAddOnCatalog } from '@/features/subscription/model/useAddOnCatalog';
export { useUsageStatistics } from '@/features/analytics/model/useUsageStatistics';

// Promotional & Events
export { useCurrentPromotional } from './useCurrentPromotional';
export { usePromotionalEvent } from './usePromotionalEvent';
export { useAssessmentPromotional } from '@/stores';

// Form & Validation
export { useFormValidation } from './useFormValidation';

// Curriculum & Education
export { useLessonPlans } from '@/features/educator-copilot/model/useLessonPlans';
export { useMentorAllocation } from '@/features/college-admin';
export { useProgramSections } from '@/features/college-admin';

// API & Development
export { useMockApi, mockApiCall } from './useMockApi';

// Recruitment & Offers
export { useOffers } from '@/features/recruiter/model/useOffers';
export type { Offer, OfferStats, OfferFilters, OfferSortOptions } from '@/features/recruiter/model/useOffers';

// Session & State
export { useSessionRestore } from '@/features/courses/model/useSessionRestore';

// Offline & Sync
export { useOfflineSync } from '@/features/courses/model/useOfflineSync';

// Permissions
export { usePermissions, usePermission } from './usePermissions';

// Profile & User
export { useProfileCompletionPrompt } from '@/features/student-profile';

// Realtime Features
export { useRealtimeActivities } from '@/features/analytics/model/useRealtimeActivities';
export { useRealtimePresence } from './useRealtimePresence';
export { useRealtimeProgress } from './useRealtimeProgress';
export { useStudentRealtimeActivities } from './useStudentRealtimeActivities';
export { useTypingIndicator } from './useTypingIndicator';

// Session & State
// AI & Tutoring
export { useTutorChat } from '@/features/ai-tutor/model/useTutorChat';
export { useVideoSummarizer } from '@/features/ai-tutor/model/useVideoSummarizer';
export { useCurriculum } from '@/features/educator-copilot/model/useLessonPlans';
export { useSubjectsAndClasses } from '@/features/educator-copilot/model/useLessonPlans';
export { useAntiCheatingMonitor } from './useAntiCheating';
