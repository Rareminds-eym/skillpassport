/**
 * Centralized Organization Service
 * 
 * DEPRECATED: This service is maintained for backward compatibility.
 * New code should import from @/entities/organization instead.
 * 
 * @deprecated Use @/entities/organization
 */

// Re-export from entity layer for backward compatibility
export type { Organization, OrganizationType, OrganizationFilters } from '@/entities/organization';

export {
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
} from '@/entities/organization';

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
