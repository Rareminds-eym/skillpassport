import { isSchoolLearner as checkIsSchoolLearner, isCollegeLearner as checkIsCollegeLearner } from '@/entities/learner/lib/learnerType';
import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('ProfileValidationService');

export class ProfileValidationService {
  static async validateProfileForJobApplication(learnerId) {
    try {
      const result = await apiPost<any>('/learner-profile/actions', { action: 'fetch-learner-by-id', learnerId });
      const learner = result?.data;

      if (!learner) {
        throw new Error('Learner not found');
      }

      const isSchoolLearner = checkIsSchoolLearner(learner);
      const isUniversityLearner = checkIsCollegeLearner(learner);
      const learnerType = isSchoolLearner ? 'school' : isUniversityLearner ? 'university' : 'unknown';

      const requiredFields = this.getRequiredFields(learnerType);
      const fieldStatus = this.checkFieldCompletion(learner, requiredFields);
      const completionPercentage = Math.round(
        (fieldStatus.completedFields / fieldStatus.totalFields) * 100
      );
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

  static getRequiredFields(learnerType) {
    const baseFields = ['name', 'email', 'phone', 'city', 'state'];
    const additionalFields = ['aadhar_number', 'gap_in_studies', 'current_backlogs'];
    const schoolFields = [...baseFields, ...additionalFields, 'school_id', 'grade', 'section'];
    const universityFields = [...baseFields, ...additionalFields, 'university_college_id', 'branch_field', 'semester', 'cgpa'];

    switch (learnerType) {
      case 'school': return schoolFields;
      case 'university': return universityFields;
      default: return [...baseFields, ...additionalFields];
    }
  }

  static checkFieldCompletion(learner, requiredFields) {
    const missingFields = [];
    let completedFields = 0;

    requiredFields.forEach(field => {
      const value = learner[field];
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

  static getFieldDisplayName(field) {
    const fieldNames = {
      'name': 'Full Name', 'email': 'Email Address', 'phone': 'Phone Number',
      'city': 'City', 'state': 'State', 'school_id': 'School', 'grade': 'Grade/Class',
      'section': 'Section', 'university_college_id': 'University/College',
      'branch_field': 'Branch/Field of Study', 'semester': 'Semester',
      'cgpa': 'CGPA/Percentage', 'gap_in_studies': 'Gap in Studies',
      'gap_years': 'Gap Years', 'gap_reason': 'Gap Reason',
      'work_experience': 'Work Experience', 'aadhar_number': 'Aadhar Number',
      'backlogs_history': 'Backlogs History', 'current_backlogs': 'Current Backlogs'
    };
    return fieldNames[field] || field;
  }
}

export default ProfileValidationService;
