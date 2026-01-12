/**
 * Shared Utilities Barrel Export
 * Single entry point for all shared utilities
 * Requirements: 3.1, 3.2, 3.3, 3.4 - Shared utilities module
 */

// Styles
export { printStyles, default as styles } from './styles';

// Utility functions
export {
  safeRender,
  safeJoin,
  getScoreStyle,
  defaultRiasecNames,
  defaultTraitNames,
  riasecDescriptions,
  getSafeStudentInfo,
} from './utils';

// Components
export { default as RiasecIcon } from './RiasecIcon';
export { default as PrintStyles } from './PrintStyles';
export { default as PrintPage } from './PrintPage';
export {
  default as Watermarks,
  PrintFooter,
  DataPrivacyNotice,
  ReportDisclaimer,
} from './Watermarks';
