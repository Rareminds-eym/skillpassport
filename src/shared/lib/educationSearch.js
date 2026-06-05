import { apiGet } from '@/shared/api/apiClient';

const orgTypeMap = {
  university: 'University',
  college: 'College',
  school: 'School',
};

const searchOrganizations = async (searchTerm, orgType, typeLabel) => {
  try {
    const resp = await apiGet(
      `/organization/handler?action=searchOrganizations&searchTerm=${encodeURIComponent(searchTerm)}&orgType=${orgType}`
    );
    // resp is { success, data, ... } from apiSuccess
    const data = resp.data || [];
    return data.map(item => ({ ...item, type: typeLabel }));
  } catch (error) {
    console.error(`Error searching ${orgType}s:`, error);
    return [];
  }
};

export const searchUniversities = (searchTerm) =>
  searchOrganizations(searchTerm, 'university', 'University');

export const searchColleges = (searchTerm) =>
  searchOrganizations(searchTerm, 'college', 'College');

export const searchSchools = (searchTerm) =>
  searchOrganizations(searchTerm, 'school', 'School');

// Search colleges and schools (not universities)
export const searchCollegesAndSchools = async (searchTerm) => {
  try {
    const [colleges, schools] = await Promise.all([
      searchColleges(searchTerm),
      searchSchools(searchTerm)
    ]);

    // Combine results (colleges and schools already have type field)
    const allResults = [...colleges, ...schools];

    // Remove duplicates based on name
    const uniqueResults = allResults.filter((item, index, self) => 
      index === self.findIndex(t => t.name.toLowerCase() === item.name.toLowerCase())
    );

    return uniqueResults.slice(0, 10);
  } catch (error) {
    console.error('Error in searchCollegesAndSchools:', error);
    return [];
  }
};

// Combined search for all educational institutions (for backward compatibility)
export const searchEducationalInstitutions = async (searchTerm) => {
  try {
    const [universities, colleges, schools] = await Promise.all([
      searchUniversities(searchTerm),
      searchColleges(searchTerm),
      searchSchools(searchTerm)
    ]);

    // Combine results (all functions now return items with type field)
    const allResults = [...universities, ...colleges, ...schools];

    // Remove duplicates based on name
    const uniqueResults = allResults.filter((item, index, self) => 
      index === self.findIndex(t => t.name.toLowerCase() === item.name.toLowerCase())
    );

    return uniqueResults.slice(0, 10);
  } catch (error) {
    console.error('Error in searchEducationalInstitutions:', error);
    return [];
  }
};