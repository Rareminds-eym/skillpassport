import { supabase } from '@/shared/api/supabaseClient';
import { isSchoolLearner as checkIsSchoolLearner, isCollegeLearner as checkIsCollegeLearner } from '@/entities/learner/lib/learnerType';

/**
 * Service for validating learner profile completeness before job applications
 */
export class ProfileValidationService {
  /**
   * Check if learner profile is complete enough for job applications
   * @param {string} learnerId - Learner's ID
   * @returns {Promise<Object>} Validation result with completeness status and missing fields
   */
  static async validateProfileForJobApplication(learnerId) {
    try {
      // Fetch learner data from database
      const { data: learner, error } = await supabase
        .from('learners')
        .select('*')
        .eq('id', learnerId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch learner data: ${error.message}`);
      }

      if (!learner) {
        throw new Error('Learner not found');
      }

      // Determine learner type using centralized utility
      const isSchoolLearner = checkIsSchoolLearner(learner);
      const isUniversityLearner = checkIsCollegeLearner(learner);
      const learnerType = isSchoolLearner ? 'school' : isUniversityLearner ? 'university' : 'unknown';

      // Define required fields based on learner type
      const requiredFields = this.getRequiredFields(learnerType);

      // Check field completion
      const fieldStatus = this.checkFieldCompletion(learner, requiredFields);

      // Calculate completion percentage
      const completionPercentage = Math.round(
        (fieldStatus.completedFields / fieldStatus.totalFields) * 100
      );

      // Profile is complete if >= 80% completion
      const isComplete = completionPercentage >= 80;

      return {
        isComplete,
        completionPercentage,
        missingFields: fieldStatus.missingFields,
        learnerType,
        learnerData: learner,
        message: isComplete
          ? 'Profile is complete for job applications'
          : `Profile is ${completionPercentage}% complete. Please complete the missing fields to apply for jobs.`
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Get required fields based on learner type
   */
  static getRequiredFields(learnerType) {
    const baseFields = [
      'name',
      'email',
      'phone',
      'city',
      'state'
    ];

    // Additional profile fields that are important for job applications
    const additionalFields = [
      'aadhar_number',
      'gap_in_studies',
      'current_backlogs'
    ];

    const schoolFields = [
      ...baseFields,
      ...additionalFields,
      'school_id',
      'grade',
      'section'
    ];

    const universityFields = [
      ...baseFields,
      ...additionalFields,
      'university_college_id',
      'branch_field',
      'semester',
      'cgpa'
    ];

    switch (learnerType) {
      case 'school':
        return schoolFields;
      case 'university':
        return universityFields;
      default:
        return [...baseFields, ...additionalFields];
    }
  }

  /**
   * Check completion status of required fields
   */
  static checkFieldCompletion(learner, requiredFields) {
    const missingFields = [];
    let completedFields = 0;

    requiredFields.forEach(field => {
      const value = learner[field];

      // Check if field has a meaningful value
      if (value === null || value === undefined || value === '' ||
        (typeof value === 'string' && value.trim() === '')) {
        missingFields.push(field);
      } else {
        completedFields++;
      }
    });

    return {
      totalFields: requiredFields.length,
      completedFields,
      missingFields: missingFields.map(field => this.getFieldDisplayName(field))
    };
  }

  /**
   * Get user-friendly field names
   */
  static getFieldDisplayName(field) {
    const fieldNames = {
      'name': 'Full Name',
      'email': 'Email Address',
      'phone': 'Phone Number',
      'city': 'City',
      'state': 'State',
      'school_id': 'School',
      'grade': 'Grade/Class',
      'section': 'Section',
      'university_college_id': 'University/College',
      'branch_field': 'Branch/Field of Study',
      'semester': 'Semester',
      'cgpa': 'CGPA/Percentage',
      'gap_in_studies': 'Gap in Studies',
      'gap_years': 'Gap Years',
      'gap_reason': 'Gap Reason',
      'work_experience': 'Work Experience',
      'aadhar_number': 'Aadhar Number',
      'backlogs_history': 'Backlogs History',
      'current_backlogs': 'Current Backlogs'
    };

    return fieldNames[field] || field;
  }
}

export default ProfileValidationService;