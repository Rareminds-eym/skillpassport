/**
 * Centralized Organization Service
 * 
 * DEPRECATED: This service is maintained for backward compatibility.
 * New code should import from @/entities/organization instead.
 * 
 * @deprecated Use @/entities/organization
 */

// Import for default export
import {
  getOrganizationByAdminId,
  getOrganizationById,
  getOrganizations,
  getSchools,
  getColleges,
  getUniversities,
  getOrganizationByEmail,
} from './queries';

import {
  createOrganization,
  updateOrganization,
  deleteOrganization,
  checkOrganizationNameExists,
} from './mutations';

// Re-export types
export type { Organization, OrganizationType, OrganizationFilters } from '../model/types';

// Re-export query functions
export {
  getOrganizationByAdminId,
  getOrganizationById,
  getOrganizations,
  getSchools,
  getColleges,
  getUniversities,
  getOrganizationByEmail,
};

// Re-export mutation functions
export {
  createOrganization,
  updateOrganization,
  deleteOrganization,
  checkOrganizationNameExists,
};

// Default export for backward compatibility
export default {
  getOrganizationByAdminId,
  getOrganizationById,
  getOrganizations,
  getSchools,
  getColleges,
  getUniversities,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  checkOrganizationNameExists,
  getOrganizationByEmail,
};
