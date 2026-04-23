// Main drawer component
export { default as StudentProfileDrawer } from './StudentProfileDrawer/StudentProfileDrawer';

// Sub-components (re-exported from their new locations)
export { default as Badge } from './Badge';
export { default as StatusBadge } from '@/shared/ui/StatusBadge';
export { default as TabButton } from './TabButton';
export { default as LessonSection } from './StudentProfileDrawer/components/LessonSection';
export { default as ProjectCard } from '@/entities/student/ui/ProjectCard';
export { default as CertificateCard } from '@/entities/student/ui/CertificateCard';

// Tabs
export * from './tabs';

// Modals
export * from './modals';

// Hooks
export * from './hooks';
