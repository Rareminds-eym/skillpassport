// Main drawer component
export { default as LearnerProfileDrawer } from './LearnerProfileDrawer/LearnerProfileDrawer';

// Sub-components (re-exported from their new locations)
export { default as Badge } from './Badge';
export { default as StatusBadge } from '@/shared/ui/StatusBadge';
export { default as TabButton } from './TabButton';
export { default as LessonSection } from './LearnerProfileDrawer/components/LessonSection';
export { default as ProjectCard } from '@/entities/learner/ui/ProjectCard';
export { default as CertificateCard } from '@/entities/learner/ui/CertificateCard';

// Tabs
export * from './tabs';

// Modals
export * from './modals';

// Hooks
export * from './hooks';
