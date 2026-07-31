/**
 * Icon resolution maps for the Course Analytics Dashboard (presentation helper).
 *
 * The data layer references icons by string key (keeping it free of React deps).
 * These maps resolve those keys to concrete lucide-react components in one place,
 * so adding a metric only requires registering its icon key here.
 *
 * Lives in `ui/` because it is a presentation concern (returns React components).
 * In this codebase `lib/` is reserved for domain business logic (e.g.
 * entities/learner/lib/learnerType.ts) and `model/` for data/types, so neither
 * fits an icon-component map.
 */

import {
  Activity,
  AlertTriangle,
  Award,
  BookOpen,
  Building2,
  CheckCircle2,
  Coins,
  Cpu,
  GraduationCap,
  HelpCircle,
  type LucideIcon,
  PlayCircle,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';

/** Fallback icon when a key is not registered (defensive, avoids crashes). */
const FALLBACK_ICON: LucideIcon = Activity;

/** Icon keys used by KPI metrics. */
const kpiIconMap: Record<string, LucideIcon> = {
  users: Users,
  book: BookOpen,
  activity: Activity,
  'trending-up': TrendingUp,
  award: Award,
};

/** Icon keys used by learner-status segments. */
const statusIconMap: Record<string, LucideIcon> = {
  'check-circle': CheckCircle2,
  'play-circle': PlayCircle,
  'help-circle': HelpCircle,
  'alert-triangle': AlertTriangle,
};

/**
 * Resolve a KPI icon key to a component.
 * @param key - Icon key from a KpiMetric.
 */
export function resolveKpiIcon(key: string): LucideIcon {
  return kpiIconMap[key] ?? FALLBACK_ICON;
}

/**
 * Resolve a learner-status icon key to a component.
 * @param key - Icon key from a LearnerStatusSegment.
 */
export function resolveStatusIcon(key: string): LucideIcon {
  return statusIconMap[key] ?? FALLBACK_ICON;
}

/** Icon keys used by directory tree nodes (departments, years, sections). */
const directoryIconMap: Record<string, LucideIcon> = {
  cpu: Cpu,
  wrench: Wrench,
  building: Building2,
  coins: Coins,
  'graduation-cap': GraduationCap,
  users: Users,
  book: BookOpen,
};

/**
 * Resolve a directory-node icon key to a component.
 * @param key - Icon key from a DirectoryNode.
 */
export function resolveDirectoryIcon(key: string | undefined): LucideIcon {
  return (key && directoryIconMap[key]) || FALLBACK_ICON;
}
