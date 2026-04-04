// Phase 1: Minimal shared types structure
// Most type migrations deferred to feature-specific phases
export type * from './common';
export type { CourseModule } from './educator/course';
export type { Resource } from './educator/course';
export type { Lesson } from './educator/course';
export type { Question } from './adaptiveAptitude';
export type { Course } from './educator/course';
export type { FileUpload } from './educator/course';

// Student-related types (used across entities and features)
export type {
    Student,
    StudentProfile,
    SocialLink,
    Skill,
    TechnicalSkill,
    Project,
    Education,
    Experience,
    Certification,
    Language,
    Achievement,
    Training,
    PortfolioLayout,
    AnimationType,
    DisplayPreferences,
    PortfolioSettings,
    Certificate,
    CourseExtended,
    AssessmentResult,
    CurriculumData,
    LessonPlan,
    AdmissionNote,
    StudentProfileDrawerProps,
    TabConfig,
    ActionConfig
} from './student';

export * from './analytics';
