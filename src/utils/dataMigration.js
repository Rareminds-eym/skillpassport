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
 * Utility to migrate mock data to Supabase
 * Run this once to populate your database with initial data
 */

export const migrateMockDataToSupabase = async (studentId) => {
  try {

    // 1. Insert/Update Student Profile
    const { data: student, error: studentError } = await supabase
      .from('students')
      .upsert({
        id: studentId || studentData.id,
        name: studentData.name,
        university: studentData.university,
        department: studentData.department,
        photo: studentData.photo,
        verified: studentData.verified,
        employability_score: studentData.employabilityScore,
        cgpa: studentData.cgpa,
        year_of_passing: studentData.yearOfPassing,
        passport_id: studentData.passportId
      })
      .select()
      .single();

    if (studentError) {
      console.error('❌ Error migrating student profile:', studentError);
      throw studentError;
    }

    const finalStudentId = student.id;

    // 2. Insert Education Data
    const educationRecords = educationData.map(edu => ({
      student_id: finalStudentId,
      degree: edu.degree,
      department: edu.department,
      university: edu.university,
      year_of_passing: edu.yearOfPassing,
      cgpa: edu.cgpa,
      level: edu.level,
      status: edu.status
    }));

    const { error: educationError } = await supabase
      .from('education')
      .upsert(educationRecords);

    if (educationError) {
      console.error('❌ Error migrating education:', educationError);
    } else {
    }

    // 3. Insert Training Data
    const trainingRecords = trainingData.map(training => ({
      student_id: finalStudentId,
      course: training.course,
      progress: training.progress,
      status: training.status
    }));

    const { error: trainingError } = await supabase
      .from('training')
      .upsert(trainingRecords);

    if (trainingError) {
      console.error('❌ Error migrating training:', trainingError);
    } else {
    }

    // 4. Insert Experience Data
    const experienceRecords = experienceData.map(exp => ({
      student_id: finalStudentId,
      role: exp.role,
      organization: exp.organization,
      duration: exp.duration,
      verified: exp.verified
    }));

    const { error: experienceError } = await supabase
      .from('experience')
      .upsert(experienceRecords);

    if (experienceError) {
      console.error('❌ Error migrating experience:', experienceError);
    } else {
    }

    // 5. Insert Technical Skills
    const technicalSkillRecords = technicalSkills.map(skill => ({
      student_id: finalStudentId,
      name: skill.name,
      level: skill.level,
      verified: skill.verified,
      icon: skill.icon
    }));

    const { error: techSkillsError } = await supabase
      .from('technical_skills')
      .upsert(technicalSkillRecords, { onConflict: 'student_id,name' });

    if (techSkillsError) {
      console.error('❌ Error migrating technical skills:', techSkillsError);
    } else {
    }

    // 6. Insert Soft Skills
    const softSkillRecords = softSkills.map(skill => ({
      student_id: finalStudentId,
      name: skill.name,
      level: skill.level,
      type: skill.type
    }));

    const { error: softSkillsError } = await supabase
      .from('soft_skills')
      .upsert(softSkillRecords, { onConflict: 'student_id,name' });

    if (softSkillsError) {
      console.error('❌ Error migrating soft skills:', softSkillsError);
    } else {
    }

    // 7. Insert Opportunities
    const opportunityRecords = opportunities.map(opp => ({
      title: opp.title,
      company: opp.company,
      type: opp.type,
      deadline: opp.deadline
    }));

    const { error: opportunitiesError } = await supabase
      .from('opportunities')
      .upsert(opportunityRecords);

    if (opportunitiesError) {
      console.error('❌ Error migrating opportunities:', opportunitiesError);
    } else {
    }

    // 8. Insert Recent Updates
    const updateRecords = recentUpdates.map(update => ({
      student_id: finalStudentId,
      message: update.message,
      type: update.type,
      timestamp: new Date(Date.now() - parseTimestamp(update.timestamp))
    }));

    const { error: updatesError } = await supabase
      .from('recent_updates')
      .upsert(updateRecords);

    if (updatesError) {
      console.error('❌ Error migrating recent updates:', updatesError);
    } else {
    }

    // 9. Insert Suggestions
    const suggestionRecords = suggestions.map((suggestion, index) => ({
      student_id: finalStudentId,
      message: suggestion,
      priority: suggestions.length - index,
      is_active: true
    }));

    const { error: suggestionsError } = await supabase
      .from('suggestions')
      .upsert(suggestionRecords);

    if (suggestionsError) {
      console.error('❌ Error migrating suggestions:', suggestionsError);
    } else {
    }

    return { success: true, studentId: finalStudentId };

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
 * Clear all data for a specific student (use with caution!)
 */
export const clearStudentData = async (studentId) => {
  try {

    // Delete in reverse order of dependencies
    await supabase.from('suggestions').delete().eq('student_id', studentId);
    await supabase.from('recent_updates').delete().eq('student_id', studentId);
    await supabase.from('soft_skills').delete().eq('student_id', studentId);
    await supabase.from('technical_skills').delete().eq('student_id', studentId);
    await supabase.from('experience').delete().eq('student_id', studentId);
    await supabase.from('training').delete().eq('student_id', studentId);
    await supabase.from('education').delete().eq('student_id', studentId);
    await supabase.from('students').delete().eq('id', studentId);

    return { success: true };
  } catch (error) {
    console.error('❌ Error clearing student data:', error);
    return { success: false, error };
  }
};

/**
 * Check if student data exists
 */
export const checkStudentExists = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('id', studentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return { exists: false };
      }
      throw error;
    }

    return { exists: !!data };
  } catch (error) {
    console.error('Error checking student existence:', error);
    return { exists: false, error };
  }
};

/**
 * Main migration function with checks
 */
export const runMigration = async (studentId = null) => {
  try {
    const targetStudentId = studentId || studentData.id;

    const { exists } = await checkStudentExists(targetStudentId);

    if (exists) {
      // In a real scenario, you'd wait for user confirmation
      // For now, we'll proceed with upsert which will update existing records
    }

    const result = await migrateMockDataToSupabase(targetStudentId);
    return result;
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, error };
  }
};
