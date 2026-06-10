import { isSchoolLearner as checkIsSchoolLearner, isCollegeLearner as checkIsCollegeLearner } from '@/entities/learner/lib/learnerType';
import { apiPost } from '@/shared/api/apiClient';

type LearnerType = 'school' | 'university' | 'unknown';

interface FieldStatus {
  totalFields: number;
  completedFields: number;
  missingFields: string[];
}

export class ProfileValidationService {
  static async validateProfileForJobApplication(learnerId: string) {
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
      // Reduced threshold from 80% to 70% to allow learners with basic info to apply
      const isComplete = completionPercentage >= 70;

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

  static getRequiredFields(learnerType: LearnerType): string[] {
    // Core fields that are truly required
    const baseFields = ['name', 'email', 'phone'];
    
    // Location fields - important but can be optional for initial applications
    const locationFields = ['city', 'state'];
    
    // School-specific required fields
    const schoolFields = [...baseFields, ...locationFields, 'school_id', 'grade', 'section'];
    
    // University-specific required fields - allow flexible field names
    // Accept either college_school_name OR university_college_id for college
    // Accept branch_field for program
    // Accept section for semester info
    const universityFields = [...baseFields, ...locationFields, 'branch_field'];

    // Note: university_college_id, semester, cgpa are now optional since college info might be in college_school_name
    // and semester might be in section field

    switch (learnerType) {
      case 'school': return schoolFields;
      case 'university': return universityFields;
      default: return baseFields; // For unknown types, only require basic fields
    }
  }

  static checkFieldCompletion(learner: any, requiredFields: string[]): FieldStatus {
    const missingFields: string[] = [];
    let completedFields = 0;

    requiredFields.forEach((field: string) => {
      let value = learner[field];
      
      // Special handling for flexible college fields
      if (field === 'university_college_id' && (!value || value === '')) {
        // Check alternative field: college_school_name
        value = learner['college_school_name'] || learner['college'];
      }
      
      // Special handling for semester - can be in section field
      if (field === 'semester' && (!value || value === '')) {
        value = learner['section'];
      }
      
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
      missingFields: missingFields.map((field: string) => this.getFieldDisplayName(field))
    };
  }

  static getFieldDisplayName(field: string): string {
    const fieldNames: Record<string, string> = {
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
