import { supabase } from '@/lib/supabaseClient';

// Search universities only (using unified organizations table)
export const searchUniversities = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('name, state, city')
      .eq('organization_type', 'university')
      .ilike('name', `%${searchTerm}%`)
      .limit(10);

    if (error) {
      console.error('Error searching universities:', error);
      return [];
    }

    // Add type field for consistency
    return (data || []).map(item => ({ ...item, type: 'University' }));
  } catch (error) {
    console.error('Error in searchUniversities:', error);
    return [];
  }
};

// Search colleges only (using unified organizations table)
export const searchColleges = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('name, city, state')
      .eq('organization_type', 'college')
      .ilike('name', `%${searchTerm}%`)
      .limit(10);

    if (error) {
      console.error('Error searching colleges:', error);
      return [];
    }

    // Add type field for consistency
    return (data || []).map(item => ({ ...item, type: 'College' }));
  } catch (error) {
    console.error('Error in searchColleges:', error);
    return [];
  }
};

// Search schools only (using unified organizations table)
export const searchSchools = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('name, city, state')
      .eq('organization_type', 'school')
      .ilike('name', `%${searchTerm}%`)
      .limit(10);

    if (error) {
      console.error('Error searching schools:', error);
      return [];
    }

    // Add type field for consistency
    return (data || []).map(item => ({ ...item, type: 'School' }));
  } catch (error) {
    console.error('Error in searchSchools:', error);
    return [];
  }
};

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