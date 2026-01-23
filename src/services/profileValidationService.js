import { supabase } from '../lib/supabaseClient';

/**
 * Service for validating student profile completeness before job applications
 */
export class ProfileValidationService {
  /**
   * Check if student profile is complete enough for job applications
   * @param {string} studentId - Student's ID
   * @returns {Promise<Object>} Validation result with completeness status and missing fields
   */
  static async validateProfileForJobApplication(studentId) {
    try {
      // Fetch student data from database
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch student data: ${error.message}`);
      }

      if (!student) {
        throw new Error('Student not found');
      }

      // Determine student type
      const isSchoolStudent = student.school_id || student.school_class_id;
      const isUniversityStudent = student.university_college_id || student.universityId;
      const studentType = isSchoolStudent ? 'school' : isUniversityStudent ? 'university' : 'unknown';

      // Define required fields based on student type
      const requiredFields = this.getRequiredFields(studentType);
      
      // Check field completion
      const fieldStatus = this.checkFieldCompletion(student, requiredFields);
      
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
        studentType,
        studentData: student,
        message: isComplete 
          ? 'Profile is complete for job applications' 
          : `Profile is ${completionPercentage}% complete. Please complete the missing fields to apply for jobs.`
      };

    } catch (error) {
      console.error('Profile validation error:', error);
      throw error;
    }
  }

  /**
   * Get required fields based on student type
   */
  static getRequiredFields(studentType) {
    const baseFields = [
      'name',
      'email',
      'phone',
      'city',
      'state'
    ];

    const schoolFields = [
      ...baseFields,
      'school_id',
      'grade',
      'section'
    ];

    const universityFields = [
      ...baseFields,
      'university_college_id',
      'branch_field',
      'semester',
      'cgpa'
    ];

    switch (studentType) {
      case 'school':
        return schoolFields;
      case 'university':
        return universityFields;
      default:
        return baseFields;
    }
  }

  /**
   * Check completion status of required fields
   */
  static checkFieldCompletion(student, requiredFields) {
    const missingFields = [];
    let completedFields = 0;

    requiredFields.forEach(field => {
      const value = student[field];
      
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
      'cgpa': 'CGPA/Percentage'
    };

    return fieldNames[field] || field;
  }
}

export default ProfileValidationService;