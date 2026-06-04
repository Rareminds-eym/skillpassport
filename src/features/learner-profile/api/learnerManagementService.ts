import { apiPost } from '@/shared/api/apiClient';
import type {
  AdmissionApplication,
  LearnerProfile,
  AttendanceRecord,
  LearnerReport,
  ValidationError
} from '@/features/school-admin';
import { validateFileSize } from '@/shared/lib/utils';
import { getFileSizeLimit } from '@/shared/config';

// ============= ADMISSION WORKFLOW =============

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => { const result = reader.result as string; resolve(result.split(',')[1] || result); };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export const admissionService = {
  // US-SM-03: Create new admission application
  async createApplication(data: Partial<AdmissionApplication>, schoolId: string): Promise<{ data: AdmissionApplication | null; error: string | null }> {
    // Validate all required fields
    const validationErrors = validationUtils.validateAdmissionData(data);
    if (validationErrors.length > 0) {
      return { data: null, error: 'Validation failed: ' + validationErrors.map(e => e.message).join(', ') };
    }

    // Check for duplicate learner
    const isDuplicate = await validationUtils.checkDuplicateLearner(
      data.learnerName!,
      data.dateOfBirth!,
      data.phone!
    );

    if (isDuplicate) {
      return { data: null, error: 'A learner with the same name, date of birth, and parent phone already exists.' };
    }

    // Validate age vs class
    const ageValidation = this.validateAgeForClass(data.dateOfBirth!, data.appliedFor!);
    if (!ageValidation.valid) {
      return { data: null, error: ageValidation.message || 'Age validation failed' };
    }

    const result: any = await apiPost('/learners/management', {
      action: 'create-application', schoolId, data: {
        ...data,
        learnerName: data.learnerName,
        dateOfBirth: data.dateOfBirth,
        aadharNumber: data.aadharNumber,
        passportNumber: data.passportNumber,
        fatherName: data.fatherName,
        fatherOccupation: data.fatherOccupation,
        fatherPhone: data.fatherPhone,
        fatherEmail: data.fatherEmail,
        motherName: data.motherName,
        motherOccupation: data.motherOccupation,
        motherPhone: data.motherPhone,
        guardianName: data.guardianName,
        guardianRelation: data.guardianRelation,
        guardianPhone: data.guardianPhone,
        previousSchool: data.previousSchool,
        previousClass: data.previousClass,
        previousBoard: data.previousBoard,
        documents: data.documents || {},
        appliedFor: data.appliedFor,
        feeAmount: data.feeAmount,
      }
    });
    if (result?.error) return { data: null, error: result.error.message || result.error };
    const application = result.data?.application;

    return { data: application, error: null };
  },

  // Validate age for class
  validateAgeForClass(dateOfBirth: string, appliedFor: string): { valid: boolean; message?: string } {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate()) ? age - 1 : age;

    // Extract class number from appliedFor (e.g., "Class 5" -> 5)
    const classMatch = appliedFor.match(/\d+/);
    const classNumber = classMatch ? parseInt(classMatch[0]) : 0;

    // General rule: age should be approximately class + 5
    const expectedMinAge = classNumber + 4;
    const expectedMaxAge = classNumber + 7;

    if (actualAge < expectedMinAge || actualAge > expectedMaxAge) {
      return {
        valid: false,
        message: `Age ${actualAge} is not suitable for ${appliedFor}. Expected age range: ${expectedMinAge}-${expectedMaxAge} years.`
      };
    }

    return { valid: true };
  },

  // Generate admission receipt
  async generateAdmissionReceipt(application: AdmissionApplication): Promise<string> {
    const result: any = await apiPost('/learners/management', { action: 'generate-admission-receipt', applicationId: application.id });
    return result?.data?.receiptUrl || `/receipts/admission/${application.id}`;
  },

  // Generate unique application number
  async generateApplicationNumber(schoolId: string): Promise<string> {
    const result: any = await apiPost('/learners/management', { action: 'generate-application-number', schoolId });
    return result?.data?.applicationNumber || '';
  },

  // Get all applications for a school
  async getApplications(schoolId: string, filters?: { status?: string; appliedFor?: string }) {
    const result: any = await apiPost('/learners/management', { action: 'get-applications', schoolId, status: filters?.status, appliedFor: filters?.appliedFor });
    return { data: result?.data?.applications ?? null, error: result?.error ?? null };
  },

  // Update application status
  async updateApplicationStatus(applicationId: string, status: string, verifiedBy?: string, remarks?: string) {
    const result: any = await apiPost('/learners/management', { action: 'update-application-status', applicationId, status, verifiedBy, remarks });
    return { data: result?.data?.application ?? null, error: result?.error ?? null };
  },

  // Upload documents
  async uploadDocument(file: File, applicationId: string, documentType: string) {
    const fileName = `${applicationId}/${documentType}/${Date.now()}_${file.name}`;
    
    const base64 = await fileToBase64(file);
    const result: any = await apiPost('/college-admin/storage', {
      action: 'upload', bucket: 'admission-documents', path: fileName, file_base64: base64, content_type: file.type || 'application/octet-stream',
    });

    if (!result?.data?.publicUrl) return { data: null, error: result?.error };

    return { data: { url: result.data.publicUrl, path: fileName }, error: null };
  },

  // Approve and generate enrollment
  async approveAndEnroll(applicationId: string, academicYear: string, schoolId: string) {
    const result: any = await apiPost('/learners/management', { action: 'approve-and-enroll', applicationId, academicYear, schoolId });
    if (result?.error) return { data: null, error: result.error };
    return { data: { enrollmentNumber: result.data?.enrollmentNumber }, error: null };
  },

  // Record fee payment
  async recordFeePayment(applicationId: string, amount: number) {
    const result: any = await apiPost('/learners/management', { action: 'record-fee-payment', applicationId, amount });
    return { data: result?.data?.application ?? null, error: result?.error ?? null };
  }
};

// ============= LEARNER PROFILE MANAGEMENT =============

export const learnerProfileService = {
  // Create extended profile after admission
  async createExtendedProfile(learnerId: string, schoolId: string, data: Partial<LearnerProfile>): Promise<{ data: LearnerProfile | null; error: string | null }> {
    const result: any = await apiPost('/learners/management', {
      action: 'create-extended-profile', learnerId, schoolId, data: {
        enrollment_number: data.enrollmentNumber, class: data.class,
        section: data.section, roll_number: data.rollNumber,
        admission_date: data.admissionDate, academic_year: data.academicYear,
        blood_group: data.medicalInfo?.bloodGroup, allergies: data.medicalInfo?.allergies,
        chronic_conditions: data.medicalInfo?.chronicConditions, medications: data.medicalInfo?.medications,
        emergency_contact: data.medicalInfo?.emergencyContact, emergency_phone: data.medicalInfo?.emergencyPhone,
        primary_interest: data.careerInterests?.primaryInterest,
        secondary_interest: data.careerInterests?.secondaryInterest,
        career_skills: data.careerInterests?.skills, aspirations: data.careerInterests?.aspirations,
        total_fee: data.feeStatus?.totalFee, paid_amount: data.feeStatus?.paidAmount,
        pending_amount: data.feeStatus?.pendingAmount, photo_url: data.photo,
      },
    });
    if (result?.error) return { data: null, error: result.error };
    return { data: result.data as LearnerProfile, error: null };
  },

  // Get learner profile with extended data
  async getlearnerProfile(learnerId: string): Promise<{ data: LearnerProfile | null; error: string | null }> {
    const result: any = await apiPost('/learners/management', {
      action: 'get-learner-profile', learnerId,
    });
    if (result?.error) return { data: null, error: result.error.message || result.error };

    const profile = result.data;
    const attendanceRecords = profile?.attendance || [];
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter((r: any) => r.status === 'present').length;
    const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return {
      data: { ...profile, attendanceTrend: { totalDays, presentDays, absentDays: totalDays - presentDays, percentage, isAtRisk: percentage < 75 } } as LearnerProfile,
      error: null
    };
  },

  // Update learner profile
  async updateProfile(learnerId: string, updates: Partial<LearnerProfile>): Promise<{ data: LearnerProfile | null; error: string | null }> {
    const result: any = await apiPost('/learners/management', {
      action: 'update-profile', learnerId, updates: {
        blood_group: updates.medicalInfo?.bloodGroup,
        allergies: updates.medicalInfo?.allergies,
        chronic_conditions: updates.medicalInfo?.chronicConditions,
        medications: updates.medicalInfo?.medications,
        emergency_contact: updates.medicalInfo?.emergencyContact,
        emergency_phone: updates.medicalInfo?.emergencyPhone,
        primary_interest: updates.careerInterests?.primaryInterest,
        secondary_interest: updates.careerInterests?.secondaryInterest,
        career_skills: updates.careerInterests?.skills,
        aspirations: updates.careerInterests?.aspirations,
        photo_url: updates.photo,
        status: updates.status,
      },
    });
    if (result?.error) return { data: null, error: result.error.message || result.error };
    return { data: result.data as LearnerProfile, error: null };
  },

  // Get all learners for a school
  async getSchoollearners(schoolId: string, filters?: { class?: string; section?: string; status?: string }): Promise<{ data: LearnerProfile[] | null; error: string | null }> {
    const result: any = await apiPost('/learners/management', {
      action: 'get-school-learners', schoolId, class: filters?.class, section: filters?.section, status: filters?.status,
    });
    if (result?.error) return { data: null, error: result.error.message || result.error };
    return { data: result.data as LearnerProfile[], error: null };
  }
};

// ============= ATTENDANCE MANAGEMENT =============

export const attendanceService = {
  // US-SM-04: Mark attendance (manual)
  async markAttendance(records: Partial<AttendanceRecord>[], markedBy: string): Promise<{ data: AttendanceRecord[] | null; error: string | null }> {
    // Validate each attendance entry
    for (const record of records) {
      const errors = validationUtils.validateAttendanceEntry({
        date: record.date || new Date().toISOString().split('T')[0],
        status: record.status!,
        remarks: record.remarks,
        currentTime: new Date()
      });

      if (errors.length > 0) {
        return { data: null, error: 'Validation failed: ' + errors.map(e => e.message).join(', ') };
      }

      // Check if learner already marked present in another class today
      const isDuplicate = await this.checkDuplicateAttendance(
        record.learnerId!,
        record.date || new Date().toISOString().split('T')[0]
      );

      if (isDuplicate) {
        return { 
          data: null, 
          error: `Learner ${record.learnerId} is already marked present in another class today.` 
        };
      }
    }

    const result: any = await apiPost('/learners/management', {
      action: 'mark-attendance', records: records.map(record => ({
        learner_id: record.learnerId, school_id: record.schoolId,
        date: record.date || new Date().toISOString().split('T')[0],
        status: record.status, mode: 'manual',
        marked_by: markedBy, remarks: record.remarks,
      })),
    });

    if (result?.error) return { data: null, error: result.error.message || result.error };

    const attendanceResult = result.data || [];
    for (const record of attendanceResult) {
      if (record.status === 'absent') {
        await this.notifyParentAbsence(record.learner_id, record.date);
      }
    }

    await apiPost('/learners/management', { action: 'check-attendance-alerts' });

    return { data: attendanceResult, error: null };
  },

  // Check for duplicate attendance (learner present in multiple classes)
  async checkDuplicateAttendance(learnerId: string, date: string): Promise<boolean> {
    const result: any = await apiPost('/learners/management', {
      action: 'check-duplicate-attendance', learnerId, date,
    });
    return result?.data?.isDuplicate || false;
  },

  // Notify parent of absence
  async notifyParentAbsence(learnerId: string, date: string): Promise<void> {
    const result: any = await apiPost('/learner-profile/actions', {
      action: 'fetch-learner', id: learnerId,
    });
    const learner = result?.data;
    if (!learner) return;
    // TODO: Integrate with SMS/Email service
    // await smsService.send(learner.parent_phone, `Your child ${learner.name} was marked absent on ${date}.`);
  },

  // Mark attendance via RFID
  async markAttendanceRFID(_rfidTag: string, _schoolId: string) {
    // In real implementation, you'd look up learner by RFID tag
    // For now, this is a placeholder
    return { data: null, error: { message: 'RFID integration pending' } };
  },

  // Mark attendance via Mobile OTP
  async markAttendanceMobile(learnerId: string, schoolId: string, otp: string) {
    if (!this.verifyOTP(learnerId, otp)) {
      return { data: null, error: { message: 'Invalid OTP' } };
    }

    return await apiPost('/learners/management', {
      action: 'mark-attendance-mobile', learnerId, schoolId,
    });
  },

  // Verify OTP (placeholder)
  async verifyOTP(_learnerId: string, otp: string): Promise<boolean> {
    // Implement actual OTP verification logic
    return otp.length === 6;
  },

  // Get attendance for date range
  async getAttendance(schoolId: string, startDate: string, endDate: string, _filters?: { class?: string; section?: string }) {
    return await apiPost('/learners/management', {
      action: 'get-attendance', schoolId, startDate, endDate,
    });
  },

  // Get attendance alerts
  async getAttendanceAlerts(schoolId: string, unnotifiedOnly: boolean = false) {
    return await apiPost('/learners/management', {
      action: 'get-attendance-alerts', schoolId, unnotifiedOnly,
    });
  },

  // Mark alert as notified
  async markAlertNotified(alertId: string) {
    return await apiPost('/learners/management', {
      action: 'mark-alert-notified', alertId,
    });
  },

  // Get learner attendance summary
  async getlearnerAttendanceSummary(learnerId: string, startDate?: string, endDate?: string) {
    const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    const result: any = await apiPost('/learners/management', {
      action: 'get-learner-attendance-summary', learnerId, startDate: start, endDate: end,
    });
    return result || { data: null, error: null };
  }
};

// ============= COLLEGE ATTENDANCE MANAGEMENT =============

export const collegeAttendanceService = {
  // Create college attendance session
  async createAttendanceSession(sessionData: any) {
    const result: any = await apiPost('/learners/management', {
      action: 'create-attendance-session', sessionData,
    });
    return { data: result?.data, error: result?.error };
  },

  // Mark college attendance
  async markCollegeAttendance(records: any[]) {
    const result: any = await apiPost('/learners/management', {
      action: 'mark-college-attendance', records,
    });
    return { data: result?.data, error: result?.error };
  },

  // Get college attendance sessions for faculty
  async getFacultyAttendanceSessions(facultyId: string, collegeId: string, date?: string) {
    return await apiPost('/learners/management', {
      action: 'get-faculty-attendance-sessions', facultyId, collegeId, date,
    });
  },

  // Get college attendance records for session
  async getSessionAttendanceRecords(sessionId: string) {
    return await apiPost('/learners/management', {
      action: 'get-session-attendance-records', sessionId,
    });
  },

  // Get college learner attendance summary
  async getCollegeLearnerAttendanceSummary(learnerId: string, collegeId: string, startDate?: string, endDate?: string) {
    const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    const result: any = await apiPost('/learners/management', {
      action: 'get-college-learner-attendance-summary', learnerId, collegeId, startDate: start, endDate: end,
    });
    return result || { data: null, error: null };
  },

  // Get college attendance analytics
  async getCollegeAttendanceAnalytics(collegeId: string, facultyId?: string, startDate?: string, endDate?: string) {
    const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    const result: any = await apiPost('/learners/management', {
      action: 'get-college-attendance-analytics', collegeId, facultyId, startDate: start, endDate: end,
    });
    return result || { data: null, error: null };
  }
};

// ============= LEARNER REPORTS =============

export const learnerReportService = {
  // Generate attendance report
  async generateAttendanceReport(learnerId: string, schoolId: string, academicYear: string, term?: string) {
    const { data: attendanceData } = await attendanceService.getlearnerAttendanceSummary(learnerId);
    
    const reportData = {
      totalDays: attendanceData?.totalDays || 0,
      presentDays: attendanceData?.presentDays || 0,
      absentDays: attendanceData?.absentDays || 0,
      lateCount: attendanceData?.lateDays || 0,
      excusedCount: 0,
      attendancePercentage: attendanceData?.percentage || 0,
      monthlyBreakdown: Object.entries(await this.getMonthlyAttendance(learnerId)).map(([month, data]) => ({
        month,
        present: data.present,
        absent: data.absent,
        late: 0
      })),
      alertsGenerated: (await this.getlearnerAlerts(learnerId))?.length || 0
    };

    return await this.createReport({
      learnerId,
      schoolId,
      reportType: 'attendance',
      title: `Attendance Report - ${academicYear}${term ? ` (${term})` : ''}`,
      academicYear,
      term,
      data: reportData
    });
  },

  // Generate academic performance report
  async generateAcademicReport(learnerId: string, schoolId: string, academicYear: string, term?: string) {
    const assessmentsResult: any = await apiPost('/learners/management', {
      action: 'get-learner-assessments', learnerId, schoolId,
    });
    const assessments = assessmentsResult?.data || [];

    const reportData = {
      assessments: assessments.map((a: any) => ({
        skillName: a.assessment_type,
        level: 'intermediate' as const,
        score: Number(a.score) || 0,
        maxScore: 100,
        assessmentDate: a.created_at || new Date().toISOString()
      })),
      overallSkillLevel: 'intermediate',
      recommendedSkills: [],
      improvementAreas: []
    };

    return await this.createReport({
      learnerId, schoolId,
      reportType: 'academic',
      title: `Academic Performance Report - ${academicYear}${term ? ` (${term})` : ''}`,
      academicYear, term, data: reportData
    });
  },

  // Generate career readiness report
  async generateCareerReadinessReport(learnerId: string, schoolId: string, academicYear: string) {
    const assessmentsResult: any = await apiPost('/learners/management', {
      action: 'get-learner-assessments', learnerId,
    });
    const assessments = assessmentsResult?.data || [];

    const reportData = {
      assessments: assessments.map((a: any) => ({
        skillName: a.assessment_type,
        level: 'intermediate' as const,
        score: Number(a.score) || 0,
        maxScore: 100,
        assessmentDate: a.created_at || new Date().toISOString()
      })) || [],
      overallSkillLevel: 'intermediate',
      recommendedSkills: [],
      improvementAreas: []
    };

    return await this.createReport({
      learnerId, schoolId,
      reportType: 'career_readiness',
      title: `Career Readiness Report - ${academicYear}`,
      academicYear, data: reportData
    });
  },

  // Create report record
  async createReport(reportData: Partial<LearnerReport>) {
    return await apiPost('/learners/management', {
      action: 'create-report', reportData,
    });
  },

  // Get all reports for a learner
  async getlearnerReports(learnerId: string, reportType?: string) {
    return await apiPost('/learners/management', {
      action: 'get-learner-reports', learnerId, reportType,
    });
  },

  // Export report to PDF (placeholder - implement with PDF library)
  async exportToPDF(reportId: string): Promise<{ data: { url: string } | null; error: string | null }> {
    // This would use a PDF generation library like jsPDF or pdfmake
    // For now, return placeholder
    return {
      data: { url: '/api/reports/pdf/' + reportId },
      error: null
    };
  },

  // Helper: Get monthly attendance
  async getMonthlyAttendance(learnerId: string) {
    const result: any = await apiPost('/learners/management', {
      action: 'get-monthly-attendance', learnerId,
    });
    return result?.data || {};
  },

  // Helper: Get learner alerts
  async getlearnerAlerts(learnerId: string) {
    const result: any = await apiPost('/learners/management', {
      action: 'get-learner-alerts', learnerId,
    });
    return result?.data || [];
  },

  // Helper: Group assessments by subject
  groupBySubject(assessments: { assessment_type: string; [key: string]: string | number | boolean }[]) {
    const grouped: Record<string, { assessment_type: string; [key: string]: string | number | boolean }[]> = {};
    assessments.forEach(assessment => {
      const subject = assessment.assessment_type;
      if (!grouped[subject]) {
        grouped[subject] = [];
      }
      grouped[subject].push(assessment);
    });
    return grouped;
  },

  // Helper: Generate career recommendations
  async generateCareerRecommendations(_learnerId: string, _profile: LearnerProfile | null) {
    // This could integrate with AI service for personalized recommendations
    return {
      suggestedPaths: [],
      skillGaps: [],
      nextSteps: []
    };
  }
};

// ============= VALIDATION UTILITIES =============

export const validationUtils = {
  // 6.1.1 Learner Admission Form Validation
  validateAdmissionData(data: Partial<AdmissionApplication>): ValidationError[] {
    const errors: ValidationError[] = [];

    // First Name - Alphabetic only, min 2 chars
    if (!data.learnerName) {
      errors.push({ field: 'learnerName', message: 'Learner name is required' });
    } else {
      const nameParts = data.learnerName.trim().split(' ');
      const firstName = nameParts[0];
      
      if (firstName.length < 2) {
        errors.push({ field: 'learnerName', message: 'First name must be at least 2 characters' });
      }
      
      if (!/^[a-zA-Z\s]+$/.test(data.learnerName)) {
        errors.push({ field: 'learnerName', message: 'First name must contain only letters.' });
      }
    }

    // Date of Birth - Must be ≥ 3 years old and ≤ 20 years old
    if (!data.dateOfBirth) {
      errors.push({ field: 'dateOfBirth', message: 'Date of birth is required' });
    } else {
      const dob = new Date(data.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate()) ? age - 1 : age;

      if (actualAge < 3 || actualAge > 20) {
        errors.push({ field: 'dateOfBirth', message: 'Age not suitable for selected class.' });
      }
    }

    // Gender - Mandatory
    if (!data.gender) {
      errors.push({ field: 'gender', message: 'Please select a gender.' });
    }

    // Class Applied - Required
    if (!data.appliedFor) {
      errors.push({ field: 'appliedFor', message: 'Please choose a class.' });
    }

    // Parent Phone - Must be 10 digits
    if (!data.phone) {
      errors.push({ field: 'phone', message: 'Parent phone is required' });
    } else if (!/^\d{10}$/.test(data.phone)) {
      errors.push({ field: 'phone', message: 'Invalid mobile number.' });
    }

    // Parent Email - Valid format
    if (!data.email) {
      errors.push({ field: 'email', message: 'Parent email is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push({ field: 'email', message: 'Invalid email address.' });
    }

    // Address Line 1 - Required
    if (!data.address || data.address.trim().length === 0) {
      errors.push({ field: 'address', message: 'Address cannot be empty.' });
    }

    // Previous School Name - No special chars
    if (data.previousSchool && !/^[a-zA-Z0-9\s]+$/.test(data.previousSchool)) {
      errors.push({ field: 'previousSchool', message: 'Invalid school name.' });
    }

    // Parent details validation
    if (!data.fatherName) {
      errors.push({ field: 'fatherName', message: 'Father name is required' });
    } else if (!/^[a-zA-Z\s]+$/.test(data.fatherName)) {
      errors.push({ field: 'fatherName', message: 'Father name must contain only letters.' });
    }

    if (!data.motherName) {
      errors.push({ field: 'motherName', message: 'Mother name is required' });
    } else if (!/^[a-zA-Z\s]+$/.test(data.motherName)) {
      errors.push({ field: 'motherName', message: 'Mother name must contain only letters.' });
    }

    return errors;
  },

  // 6.1.1 Document Upload Validation
  validateDocument(file: File, documentType: string): ValidationError | null {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];

    if (!allowedTypes.includes(file.type)) {
      return { field: documentType, message: 'Unsupported file type or file too large.' };
    }

    // Use centralized file size validation
    const sizeValidation = validateFileSize(file, { context: 'document' });
    if (!sizeValidation.valid) {
      const config = getFileSizeLimit('document');
      return { field: documentType, message: `File size exceeds maximum allowed size of ${config.displaySize}.` };
    }

    return null;
  },

  // Total documents size validation (25MB limit)
  validateTotalDocumentsSize(files: File[]): ValidationError | null {
    const maxTotalSize = 25 * 1024 * 1024; // 25MB
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    if (totalSize > maxTotalSize) {
      return { field: 'documents', message: 'Total size of all uploaded documents must be less than 25MB.' };
    }

    return null;
  },

  // 6.1.2 Learner Profile Edit Validation
  validateProfileEdit(field: string, userRole: string): { allowed: boolean; message?: string } {
    // Email cannot be changed after verification
    if (field === 'email') {
      return { allowed: false, message: 'Email cannot be changed after verification.' };
    }

    // Class & Section can only be changed by Principal
    if ((field === 'class' || field === 'section') && userRole !== 'principal') {
      return { allowed: false, message: 'Only Principal can change class or section.' };
    }

    return { allowed: true };
  },

  // Learner status transition validation
  validateStatusTransition(_currentStatus: string, newStatus: string, hasGraduationWorkflow: boolean): ValidationError | null {
    if (newStatus === 'graduated' && !hasGraduationWorkflow) {
      return { field: 'status', message: 'Learner can only be marked as alumni if graduation workflow is completed.' };
    }

    return null;
  },

  // 6.1.3 Attendance Entry Validation
  validateAttendanceEntry(data: {
    date: string;
    status: string;
    remarks?: string;
    currentTime?: Date;
    isBulkMarkAll?: boolean;
  }): ValidationError[] {
    const errors: ValidationError[] = [];

    // Status must be valid
    const validStatuses = ['present', 'absent', 'late', 'excused'];
    if (!validStatuses.includes(data.status)) {
      errors.push({ field: 'status', message: 'Status must be one of: present, absent, late, excused.' });
    }

    // Date cannot be future
    const attendanceDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    attendanceDate.setHours(0, 0, 0, 0);

    if (attendanceDate > today) {
      errors.push({ field: 'date', message: 'Attendance date cannot be in the future.' });
    }

    // Remarks max 280 chars
    if (data.remarks && data.remarks.length > 280) {
      errors.push({ field: 'remarks', message: 'Remarks cannot exceed 280 characters.' });
    }

    // Bulk Mark-All-Present only before 10 AM
    if (data.isBulkMarkAll && data.currentTime) {
      const currentHour = data.currentTime.getHours();
      if (currentHour >= 10) {
        errors.push({ field: 'bulkMark', message: 'Bulk mark-all-present is only allowed before 10 AM.' });
      }
    }

    return errors;
  },

  // Check if attendance can be edited (24 hour rule)
  canEditAttendance(attendanceDate: string, userRole: string): { allowed: boolean; message?: string } {
    const attendance = new Date(attendanceDate);
    const now = new Date();
    const hoursDiff = (now.getTime() - attendance.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 24 && userRole !== 'principal') {
      return { 
        allowed: false, 
        message: 'Attendance cannot be edited after 24 hours unless Principal approves.' 
      };
    }

    return { allowed: true };
  },

  // Check for duplicate learner
  async checkDuplicateLearner(
    name: string, 
    dateOfBirth: string, 
    parentPhone: string
  ): Promise<boolean> {
    const result: any = await apiPost('/learner-profile/actions', {
      action: 'check-duplicate-application', name, dateOfBirth, phone: parentPhone,
    });
    return result?.data?.isDuplicate || false;
  }
}