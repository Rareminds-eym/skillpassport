import { supabase } from '../utils/api';
import {
  studentData,
  educationData,
  trainingData,
  experienceData,
  technicalSkills,
  softSkills,
  opportunities,
  recentUpdates,
  suggestions
} from '../components/Students/data/mockData';

/**
 * Utility to migrate mock data to existing Supabase students table
 * Adapted for JSONB profile structure
 */

export const migrateMockDataToSupabaseAdapted = async (userId, universityId = null) => {
  try {
    console.log('🚀 Starting data migration to JSONB profile...');

    // Check if student already exists
    const { data: existing, error: checkError } = await supabase
      .from('students')
      .select('id, userId')
      .eq('userId', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking student:', checkError);
      throw checkError;
    }

    // Prepare complete profile JSONB
    const profileData = {
      // Basic info
      name: studentData.name,
      university: studentData.university,
      department: studentData.department,
      photo: studentData.photo,
      verified: studentData.verified,
      employabilityScore: studentData.employabilityScore,
      cgpa: studentData.cgpa,
      yearOfPassing: studentData.yearOfPassing,
      passportId: studentData.passportId,
      
      // Arrays with IDs
      education: educationData.map((edu, idx) => ({
        id: idx + 1,
        degree: edu.degree,
        department: edu.department,
        university: edu.university,
        yearOfPassing: edu.yearOfPassing,
        cgpa: edu.cgpa,
        level: edu.level,
        status: edu.status,
        createdAt: new Date().toISOString()
      })),
      
      training: trainingData.map((training, idx) => ({
        id: idx + 1,
        course: training.course,
        progress: training.progress,
        status: training.status,
        createdAt: new Date().toISOString()
      })),
      
      experience: experienceData.map((exp, idx) => ({
        id: idx + 1,
        role: exp.role,
        organization: exp.organization,
        duration: exp.duration,
        verified: exp.verified,
        createdAt: new Date().toISOString()
      })),
      
      technicalSkills: technicalSkills.map((skill, idx) => ({
        id: idx + 1,
        name: skill.name,
        level: skill.level,
        verified: skill.verified,
        icon: skill.icon,
        createdAt: new Date().toISOString()
      })),
      
      softSkills: softSkills.map((skill, idx) => ({
        id: idx + 1,
        name: skill.name,
        level: skill.level,
        type: skill.type,
        createdAt: new Date().toISOString()
      })),
      
      opportunities: opportunities.map((opp, idx) => ({
        id: idx + 1,
        title: opp.title,
        company: opp.company,
        type: opp.type,
        deadline: opp.deadline,
        createdAt: new Date().toISOString()
      })),
      
      recentUpdates: recentUpdates.map((update, idx) => ({
        id: idx + 1,
        message: update.message,
        type: update.type,
        timestamp: new Date(Date.now() - parseTimestamp(update.timestamp)).toISOString(),
        isRead: false
      })),
      
      suggestions: suggestions.map((suggestion, idx) => ({
        id: idx + 1,
        message: suggestion,
        priority: suggestions.length - idx,
        isActive: true,
        createdAt: new Date().toISOString()
      }))
    };

    let result;

    if (existing) {
      // Update existing student
      console.log('📝 Updating existing student profile...');
      const { data, error } = await supabase
        .from('students')
        .update({
          universityId: universityId,
          profile: profileData
        })
        .eq('userId', userId)
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log('✅ Student profile updated successfully');
    } else {
      // Insert new student
      console.log('📝 Creating new student profile...');
      const { data, error } = await supabase
        .from('students')
        .insert([{
          userId: userId,
          universityId: universityId,
          profile: profileData
        }])
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log('✅ Student profile created successfully');
    }

    console.log('🎉 Data migration completed successfully!');
    console.log('📊 Migrated data:');
    console.log(`  - Profile: 1 record`);
    console.log(`  - Education: ${profileData.education.length} records`);
    console.log(`  - Training: ${profileData.training.length} records`);
    console.log(`  - Experience: ${profileData.experience.length} records`);
    console.log(`  - Technical Skills: ${profileData.technicalSkills.length} records`);
    console.log(`  - Soft Skills: ${profileData.softSkills.length} records`);
    console.log(`  - Opportunities: ${profileData.opportunities.length} records`);
    console.log(`  - Recent Updates: ${profileData.recentUpdates.length} records`);
    console.log(`  - Suggestions: ${profileData.suggestions.length} records`);

    return { success: true, studentId: result.id, userId: userId };

  } catch (error) {
    console.error('💥 Migration failed:', error);
    return { success: false, error };
  }
};

/**
 * Helper function to parse timestamp strings like "2 hours ago", "1 day ago"
 */
const parseTimestamp = (timeString) => {
  const parts = timeString.split(' ');
  const value = parseInt(parts[0]);
  const unit = parts[1];

  const multipliers = {
    'hour': 60 * 60 * 1000,
    'hours': 60 * 60 * 1000,
    'day': 24 * 60 * 60 * 1000,
    'days': 24 * 60 * 60 * 1000,
    'week': 7 * 24 * 60 * 60 * 1000,
    'weeks': 7 * 24 * 60 * 60 * 1000
  };

  return value * (multipliers[unit] || 0);
};

/**
 * Clear all data for a specific student
 */
export const clearStudentDataAdapted = async (userId) => {
  try {
    console.log('🗑️ Clearing student data...');

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('userId', userId);

    if (error) throw error;

    console.log('✅ Student data cleared successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error clearing student data:', error);
    return { success: false, error };
  }
};

/**
 * Check if student data exists
 */
export const checkStudentExistsAdapted = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('id, userId')
      .eq('userId', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return { exists: false };
      }
      throw error;
    }

    return { exists: !!data, data };
  } catch (error) {
    console.error('Error checking student existence:', error);
    return { exists: false, error };
  }
};

/**
 * Main migration function with checks
 */
export const runMigrationAdapted = async (userId, universityId = null) => {
  try {
    console.log(`🔍 Checking if student ${userId} exists...`);
    const { exists, data } = await checkStudentExistsAdapted(userId);

    if (exists) {
      console.log('⚠️ Student already exists. Data will be overwritten...');
      console.log('Existing data:', data);
    } else {
      console.log('✨ Creating new student profile...');
    }

    const result = await migrateMockDataToSupabaseAdapted(userId, universityId);
    return result;
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, error };
  }
};

/**
 * Get current authenticated user ID
 */
export const getCurrentUserId = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { userId: user?.id, user, error: null };
  } catch (error) {
    console.error('Error getting current user:', error);
    return { userId: null, user: null, error };
  }
};

/**
 * Migrate current authenticated user's data
 */
export const migrateCurrentUserData = async (universityId = null) => {
  try {
    const { userId, error } = await getCurrentUserId();
    
    if (error || !userId) {
      throw new Error('No authenticated user found. Please log in first.');
    }

    console.log(`📋 Migrating data for authenticated user: ${userId}`);
    return await runMigrationAdapted(userId, universityId);
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, error };
  }
};
