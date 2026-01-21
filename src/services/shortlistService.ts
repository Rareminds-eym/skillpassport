import { supabase } from '../lib/supabaseClient';

// ==================== SHORTLIST CRUD OPERATIONS ====================

/**
 * Get all shortlists with candidate counts
 */
export const getShortlists = async () => {
  try {
    const { data, error } = await supabase
      .from('shortlists')
      .select(
        `
        *,
        shortlist_candidates(count)
      `
      )
      .order('created_date', { ascending: false });

    if (error) throw error;

    // Format the data to include candidate count
    const formattedData = data?.map((item) => ({
      ...item,
      candidate_count: item.shortlist_candidates?.[0]?.count || 0,
    }));

    return { data: formattedData, error: null };
  } catch (error) {
    console.error('Error fetching shortlists:', error);
    return { data: null, error };
  }
};

/**
 * Get a single shortlist by ID
 */
export const getShortlistById = async (shortlistId: string) => {
  try {
    const { data, error } = await supabase
      .from('shortlists')
      .select('*')
      .eq('id', shortlistId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching shortlist:', error);
    return { data: null, error };
  }
};

/**
 * Create a new shortlist
 */
export const createShortlist = async (shortlistData: {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  created_by?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('shortlists')
      .insert([shortlistData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating shortlist:', error);
    return { data: null, error };
  }
};

/**
 * Update a shortlist
 */
export const updateShortlist = async (
  shortlistId: string,
  updates: Partial<{
    name: string;
    description: string;
    status: string;
    shared: boolean;
    share_link: string;
    share_expiry: string;
    watermark: boolean;
    include_pii: boolean;
    notify_on_access: boolean;
    tags: string[];
  }>
) => {
  try {
    const { data, error } = await supabase
      .from('shortlists')
      .update(updates)
      .eq('id', shortlistId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating shortlist:', error);
    return { data: null, error };
  }
};

/**
 * Delete a shortlist
 */
export const deleteShortlist = async (shortlistId: string) => {
  try {
    const { error } = await supabase.from('shortlists').delete().eq('id', shortlistId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting shortlist:', error);
    return { error };
  }
};

// ==================== SHORTLIST CANDIDATES OPERATIONS ====================

/**
 * Get all candidates in a shortlist with full student details
 */
export const getShortlistCandidates = async (shortlistId: string) => {
  try {
    // First, check if the shortlist exists
    const { data: shortlistCheck, error: shortlistError } = await supabase
      .from('shortlists')
      .select('id, name, candidate_count')
      .eq('id', shortlistId)
      .single();

    if (shortlistError) {
      console.error('Error checking shortlist:', shortlistError);
    }

    // Query the shortlist_candidates junction table
    const { data, error } = await supabase
      .from('shortlist_candidates')
      .select(
        `
        id,
        added_at,
        notes,
        student_id,
        shortlist_id
      `
      )
      .eq('shortlist_id', shortlistId);

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // If there are candidates, fetch their student details
    if (data && data.length > 0) {
      const studentIds = data.map((item) => item.student_id);

      // Query students table with profile JSONB column
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, profile')
        .in('id', studentIds);

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        throw studentsError;
      }

      // Merge student data with junction table metadata
      // Extract data from profile JSONB column
      const formattedCandidates = data
        .map((item) => {
          const student = students?.find((s) => s.id === item.student_id);
          if (!student) {
            return null;
          }

          // Extract data from profile JSONB
          // Handle case where profile might be a string that needs parsing
          let profile = student.profile;
          if (typeof profile === 'string') {
            try {
              profile = JSON.parse(profile);
            } catch (e) {
              console.error('Error parsing profile JSON:', e);
              profile = {};
            }
          }
          profile = profile || {};

          // Get education data - try to find the most recent or relevant entry
          const educationArray = profile.education || [];
          const education =
            educationArray.find((edu) => edu.status === 'ongoing') || educationArray[0] || {};

          // Extract CGPA - check multiple possible fields
          let cgpa = 'N/A';
          if (education.cgpa) {
            cgpa = education.cgpa;
          } else if (profile.cgpa) {
            cgpa = profile.cgpa;
          } else {
            // Try to find any education entry with CGPA
            const eduWithCgpa = educationArray.find((edu) => edu.cgpa);
            if (eduWithCgpa) cgpa = eduWithCgpa.cgpa;
          }

          const formattedCandidate = {
            id: student.id,
            name: profile.name || profile.nm_id || 'Unknown',
            email:
              profile.email || (profile.contact_number ? String(profile.contact_number) : 'N/A'),
            phone: profile.contact_number
              ? String(profile.contact_number)
              : profile.alternate_number
                ? String(profile.alternate_number)
                : 'N/A',
            university:
              education.university || profile.university || profile.college_school_name || 'N/A',
            department: education.department || profile.branch_field || 'N/A',
            cgpa: cgpa,
            year_of_passing: education.yearOfPassing || education.year_of_passing || 'N/A',
            employability_score: profile._ || profile.score || null,
            photo: profile.photo || null,
            verified: profile.verified || false,
            added_at: item.added_at,
            notes: item.notes,
            junction_id: item.id,
          };

          return formattedCandidate;
        })
        .filter(Boolean); // Filter out null entries

      return { data: formattedCandidates, error: null };
    }

    return { data: [], error: null };
  } catch (error) {
    console.error('Error fetching shortlist candidates:', error);
    return { data: null, error };
  }
};

/**
 * Add a candidate to a shortlist
 */
export const addCandidateToShortlist = async (
  shortlistId: string,
  studentId: string,
  addedBy?: string,
  notes?: string
) => {
  try {
    const { data, error } = await supabase
      .from('shortlist_candidates')
      .insert([
        {
          shortlist_id: shortlistId,
          student_id: studentId,
          added_by: addedBy,
          notes: notes,
        },
      ])
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate entry error
      if (error.code === '23505') {
        return {
          data: null,
          error: {
            ...error,
            message: 'Candidate is already in this shortlist',
          },
        };
      }
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error adding candidate to shortlist:', error);
    return { data: null, error };
  }
};

/**
 * Remove a candidate from a shortlist
 */
export const removeCandidateFromShortlist = async (shortlistId: string, studentId: string) => {
  try {
    const { error } = await supabase
      .from('shortlist_candidates')
      .delete()
      .eq('shortlist_id', shortlistId)
      .eq('student_id', studentId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error removing candidate from shortlist:', error);
    return { error };
  }
};

/**
 * Check if a candidate is in a specific shortlist
 */
export const isStudentInShortlist = async (shortlistId: string, studentId: string) => {
  try {
    const { data, error } = await supabase
      .from('shortlist_candidates')
      .select('id')
      .eq('shortlist_id', shortlistId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) throw error;
    return { data: !!data, error: null };
  } catch (error) {
    console.error('Error checking candidate in shortlist:', error);
    return { data: false, error };
  }
};

/**
 * Get all shortlists that contain a specific student
 */
export const getShortlistsForStudent = async (studentId: string) => {
  try {
    const { data, error } = await supabase
      .from('shortlist_candidates')
      .select(
        `
        *,
        shortlists (
          id,
          name,
          description,
          created_date,
          status
        )
      `
      )
      .eq('student_id', studentId);

    if (error) throw error;

    const formattedData = data?.map((item) => item.shortlists) || [];
    return { data: formattedData, error: null };
  } catch (error) {
    console.error('Error fetching shortlists for student:', error);
    return { data: null, error };
  }
};

/**
 * Update notes for a candidate in a shortlist
 */
export const updateCandidateNotes = async (
  shortlistId: string,
  studentId: string,
  notes: string
) => {
  try {
    const { data, error } = await supabase
      .from('shortlist_candidates')
      .update({ notes })
      .eq('shortlist_id', shortlistId)
      .eq('student_id', studentId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating candidate notes:', error);
    return { data: null, error };
  }
};

// ==================== EXPORT OPERATIONS ====================

/**
 * Log an export activity
 */
export const logExportActivity = async (exportData: {
  shortlist_id: string;
  export_format: string;
  export_type: string;
  exported_by?: string;
  include_pii?: boolean;
}) => {
  try {
    const { data, error } = await supabase
      .from('export_activities')
      .insert([exportData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error logging export activity:', error);
    return { data: null, error };
  }
};

/**
 * Get export history for a shortlist
 */
export const getExportHistory = async (shortlistId: string) => {
  try {
    const { data, error } = await supabase
      .from('export_activities')
      .select('*')
      .eq('shortlist_id', shortlistId)
      .order('exported_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching export history:', error);
    return { data: null, error };
  }
};
