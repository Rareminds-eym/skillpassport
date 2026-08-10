// learner entity public API
export * from './api';
export * from './model';

// Model exports
export { useLearnerTrainings } from './model/useLearnerTrainings';
export { useLearnerSkills } from './model/useLearnerSkills';
export { useLearnerSettings } from './model/useLearnerSettings';
export { useLearners } from './model/useLearners';
export { useLearnerRecentUpdatesById } from './model/useLearnerRecentUpdatesById';
export { useLearnerRecentUpdates } from './model/useLearnerRecentUpdates';
export { useLearnerProjects } from './model/useLearnerProjects';
export { useLearnerMessages, useLearnerUnreadCount, useLearnerConversations } from './model/useLearnerMessages';
export { useLearnerMessageNotifications } from './model/useLearnerMessageNotifications';
export { useLearnerLearning } from './model/useLearnerLearning';
export { useLearnerExperience } from './model/useLearnerExperience';
export { useLearnerEducatorMessages, useLearnerEducatorConversations, useCreateLearnerEducatorConversation } from './model/useLearnerEducatorMessages';
export { useLearnerEducation } from './model/useLearnerEducation';
export { useLearnerDataById } from './model/useLearnerDataById';
export { useLearnerDataByEmail } from './model/useLearnerDataByEmail';
export { useLearnerDataAdapted } from './model/useLearnerDataAdapted';
export { useLearnerData } from './model/useLearnerData';
export { useLearnerCollegeLecturerMessages } from './model/useLearnerCollegeLecturerMessages';
export { useLearnerCollegeAdminMessages, useLearnerCollegeAdminConversations, useCreateLearnerCollegeAdminConversation } from './model/useLearnerCollegeAdminMessages';
export { useLearnerCertificates } from './model/useLearnerCertificates';
export { useLearnerAdminMessages, useLearnerAdminConversations, useCreateLearnerAdminConversation } from './model/useLearnerAdminMessages';
export { useLearnerAchievements } from './model/useLearnerAchievements';
export { useConversationLearners } from './model/useConversationLearners';
export { useAuthenticatedLearner } from './model/useAuthenticatedLearner';
export { useAdminLearners } from './model/useAdminLearners';

export { useLearnerTechnicalSkills, useLearnerSoftSkills } from './model/useLearnerSkills';
export { useLearnerRealtimeActivities } from './model/useLearnerRealtimeActivities';

export { default as LearnerProfileDrawer } from './ui/LearnerProfileDrawer';
export * from './lib';

// Core types
export type { Learner } from './model/types';
export type { UICandidate } from './model/useAdminLearners';

// Dashboard Redesign Types (Task 1.1)
export type {
    LearnerProfile,
    EnrollabilityScore,
    AggregatedLearningMetrics,
    SkillData,
    SkillDataExtended,
    SkillDataDashboard,
    LearningPath,
    SkillHealthBreakdown,
    SkillMetric,
    CourseProgress as LearnerCourseProgress,
} from './model/types';

// Additional learner data types
export type {
    EducationData,
    TrainingData,
    ExperienceData,
    ProjectData,
    CertificateData,
    PersonalInfoData,
    LearnerUpdateData,
    TrainingUpdateData,
    UserCreateData,
    ServiceResponse,
    LearnerData,
    RegistrationData,
    UserRecord,
    EducationRecord,
    TrainingRecord,
    ExperienceRecord,
    ProjectRecord,
    CertificateRecord,
    SkillRecord,
    ProfileData,
    AssessmentResult,
    IAAssessmentResult,
    EndSemesterAssessmentResult,
    PracticalAssessmentResult,
    VivaAssessmentResult,
    ArrearsAssessmentResult,
    CareerReadinessAssessmentResult,
    AptitudeAssessmentResult,
    SkillPassport,
    ProfileObject,
    EducationUpdateData,
    TrainingUpdateDataFull,
    ExperienceUpdateData,
    ProjectUpdateData,
    CertificateUpdateData,
    SkillUpdateData,
    LearnerApiResponse,
} from './model/types';
