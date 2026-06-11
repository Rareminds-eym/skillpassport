
// TODO: Type Import from Feature
// These types are imported from @/features/school-admin
// They should be moved to @/shared/types or @/entities/learner/model/types
// For now, using type-only import to minimize coupling

import { apiPost } from '@/shared/api/apiClient';
// Types moved to @/shared/types for FSD compliance
// TODO: Import types from @/shared/types instead
import { validateFileSize } from '@/shared/lib';
import { getFileSizeLimit } from '@/shared/config';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('LearnerManagementService');

function managementPost(action: string, payload?: Record<string, unknown>) {
  return apiPost<any>('/learners/management', { action, ...payload });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============= ADMISSION WORKFLOW =============

export const admissionService = {
  // US-SM-03: Create new admission application
  async createApplication(data: Partial<AdmissionApplication>, schoolId: string): Promise<{ data: AdmissionApplication | null; error: any }> {
    const validationErrors = validationUtils.validateAdmissionData(data);
    if (validationErrors.length > 0) {
      return { data: null, error: { message: 'Validation failed', errors: validationErrors } };
    }

    const isDuplicate = await validationUtils.checkDuplicateLearner(
      data.learnerName!,
      data.dateOfBirth!,
      data.phone!
    );

    if (isDuplicate) {
      return { data: null, error: { message: 'A learner with the same name, date of birth, and parent phone already exists.' } };
    }

    const ageValidation = this.validateAgeForClass(data.dateOfBirth!, data.appliedFor!);
    if (!ageValidation.valid) {
      return { data: null, error: { message: ageValidation.message } };
    }

    const applicationNumber = await this.generateApplicationNumber(schoolId);

    try {
      const response = await managementPost('create-application', { schoolId, data: {
        school_id: schoolId,
        application_number: applicationNumber,
        learner_name: data.learnerName,
        date_of_birth: data.dateOfBirth,
        gender: data.gender,
        aadhar_number: data.aadharNumber,
        passport_number: data.passportNumber,
        email: data.email,
        phone: data.phone,
        father_name: data.fatherName,
        father_occupation: data.fatherOccupation,
        father_phone: data.fatherPhone,
        father_email: data.fatherEmail,
        mother_name: data.motherName,
        mother_occupation: data.motherOccupation,
        mother_phone: data.motherPhone,
        mother_email: data.motherEmail,
        guardian_name: data.guardianName,
        guardian_relation: data.guardianRelation,
        guardian_phone: data.guardianPhone,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        previous_school: data.previousSchool,
        previous_class: data.previousClass,
        previous_board: data.previousBoard,
        documents: data.documents || {},
        applied_for: data.appliedFor,
        fee_amount: data.feeAmount,
      } });
      const application = response?.data?.application ?? response?.application;
      await this.generateAdmissionReceipt(application);
      await this.sendAdmissionConfirmation(application);
      return { data: application, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Validate age for class
  validateAgeForClass(dateOfBirth: string, appliedFor: string): { valid: boolean; message?: string } {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate()) ? age - 1 : age;

    const classMatch = appliedFor.match(/\d+/);
    const classNumber = classMatch ? parseInt(classMatch[0]) : 0;

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
    const receiptUrl = `/receipts/admission/${application.id}`;
    try {
      await managementPost('update-application-status', {
        applicationId: application.id,
        status: application.status,
        documents: { ...application.documents, admissionReceipt: receiptUrl },
      });
    } catch {
      // non-critical
    }
    return receiptUrl;
  },

  // Send admission confirmation
  async sendAdmissionConfirmation(application: AdmissionApplication): Promise<void> {
    logger.info('Sending admission confirmation', {
      to: application.email,
      phone: application.phone,
      applicationNumber: application.applicationNumber,
      learnerName: application.learnerName
    });
  },

  // Generate unique application number
  async generateApplicationNumber(schoolId: string): Promise<string> {
    try {
      const response = await managementPost('generate-application-number', { schoolId });
      const appData = response?.data ?? response;
      return appData.applicationNumber;
    } catch {
      const year = new Date().getFullYear().toString().slice(-2);
      return `APP${year}00001`;
    }
  },

  // Get all applications for a school
  async getApplications(schoolId: string, filters?: { status?: string; appliedFor?: string }) {
    try {
      const response = await managementPost('get-applications', { schoolId, status: filters?.status, appliedFor: filters?.appliedFor });
      const data = response?.data ?? response;
      return { data: data.applications || [], error: null };
    } catch (error) {
      return { data: [], error };
    }
  },

  // Update application status
  async updateApplicationStatus(
    applicationId: string,
    status: string,
    verifiedBy?: string,
    remarks?: string
  ) {
    try {
      const response = await managementPost('update-application-status', { applicationId, status, verifiedBy, remarks });
      const data = response?.data ?? response;
      return { data: data.application, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Upload documents
  async uploadDocument(file: File, applicationId: string, documentType: string) {
    try {
      const file_base64 = await fileToBase64(file);
      const response = await managementPost('storage-upload', {
        bucket: 'admission-documents',
        path: `${applicationId}/${documentType}/${Date.now()}_${file.name}`,
        file_base64,
        content_type: file.type,
      });
      const data = response?.data ?? response;
      return { data: { url: data.url, path: data.path }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Approve and generate enrollment
  async approveAndEnroll(applicationId: string, academicYear: string, schoolId: string) {
    try {
      const response = await managementPost('approve-and-enroll', { applicationId, academicYear, schoolId });
      const data = response?.data ?? response;
      return { data: { enrollmentNumber: data.enrollmentNumber }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Record fee payment
  async recordFeePayment(applicationId: string, amount: number) {
    try {
      const response = await managementPost('record-fee-payment', { applicationId, amount });
      const data = response?.data ?? response;
      return { data: data.application, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : { message: 'Failed to record payment' } };
    }
  }
};

// ============= LEARNER PROFILE MANAGEMENT =============

export const learnerProfileService = {
  // Create extended profile after admission
  async createExtendedProfile(learnerId: string, schoolId: string, data: Partial<LearnerProfile>) {
    try {
      const response = await managementPost('create-extended-profile', {
        data: {
          learner_id: learnerId,
          school_id: schoolId,
          enrollment_number: data.enrollmentNumber,
          class: data.class,
          section: data.section,
          roll_number: data.rollNumber,
          admission_date: data.admissionDate,
          academic_year: data.academicYear,
          blood_group: data.medicalInfo?.bloodGroup,
          allergies: data.medicalInfo?.allergies,
          chronic_conditions: data.medicalInfo?.chronicConditions,
          medications: data.medicalInfo?.medications,
          emergency_contact: data.medicalInfo?.emergencyContact,
          emergency_phone: data.medicalInfo?.emergencyPhone,
          primary_interest: data.careerInterests?.primaryInterest,
          secondary_interest: data.careerInterests?.secondaryInterest,
          career_skills: data.careerInterests?.skills,
          aspirations: data.careerInterests?.aspirations,
          total_fee: data.feeStatus?.totalFee,
          paid_amount: data.feeStatus?.paidAmount,
          pending_amount: data.feeStatus?.pendingAmount,
          photo_url: data.photo,
        }
      });
      const result = response?.data ?? response;
      return { data: result.record, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get learner profile with extended data
  async getLearnerProfile(learnerId: string) {
    try {
      const response = await managementPost('get-learner-profile', { learnerId });
      const data = response?.data ?? response;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Update learner profile
  async updateProfile(learnerId: string, updates: Partial<LearnerProfile>) {
    try {
      const response = await managementPost('update-profile', {
        learnerId,
        updates: {
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
        }
      });
      const data = response?.data ?? response;
      return { data: data.record, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get all learners for a school
  async getSchoollearners(schoolId: string, filters?: { class?: string; section?: string; status?: string }) {
    try {
      const response = await managementPost('get-school-learners', { schoolId, filters });
      const data = response?.data ?? response;
      return { data: data.learners || [], error: null };
    } catch (error) {
      return { data: [], error };
    }
  }
};

// ============= ATTENDANCE MANAGEMENT =============

export const attendanceService = {
  // US-SM-04: Mark attendance (manual)
  async markAttendance(records: Partial<AttendanceRecord>[], markedBy: string) {
    for (const record of records) {
      const errors = validationUtils.validateAttendanceEntry({
        date: record.date || new Date().toISOString().split('T')[0],
        status: record.status!,
        remarks: record.remarks,
        currentTime: new Date()
      });

      if (errors.length > 0) {
        return { data: null, error: { message: 'Validation failed', errors } };
      }

      const isDuplicate = await this.checkDuplicateAttendance(
        record.learnerId!,
        record.date || new Date().toISOString().split('T')[0]
      );

      if (isDuplicate) {
        return {
          data: null,
          error: { message: `Learner ${record.learnerId} is already marked present in another class today.` }
        };
      }
    }

    try {
      const response = await managementPost('mark-attendance', { records, markedBy });
      const data = response?.data ?? response;
      return { data: data.records, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Check for duplicate attendance (learner present in multiple classes)
  async checkDuplicateAttendance(learnerId: string, date: string): Promise<boolean> {
    try {
      const response = await managementPost('check-duplicate-attendance', { learnerId, date });
      const data = response?.data ?? response;
      return data.isDuplicate || false;
    } catch {
      return false;
    }
  },

  // Notify parent of absence
  async notifyParentAbsence(learnerId: string, date: string): Promise<void> {
    // Kept as-is since notification logic is client-side only
    // In production, this would call a backend notification service
    logger.info('Notifying parent of absence', { learnerId, date });
  },

  // Mark attendance via RFID
  async markAttendanceRFID(_rfidTag: string, _schoolId: string) {
    return { data: null, error: { message: 'RFID integration pending' } };
  },

  // Mark attendance via Mobile OTP
  async markAttendanceMobile(learnerId: string, schoolId: string, otp: string) {
    const isValidOTP = await this.verifyOTP(learnerId, otp);
    if (!isValidOTP) {
      return { data: null, error: { message: 'Invalid OTP' } };
    }
    try {
      const response = await managementPost('mark-attendance-mobile', { learnerId, schoolId, otp_verified: true });
      const data = response?.data ?? response;
      return { data: data.record, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Verify OTP (placeholder)
  async verifyOTP(_learnerId: string, otp: string): Promise<boolean> {
    return otp.length === 4;
  },

  // Get attendance for date range
  async getAttendance(schoolId: string, startDate: string, endDate: string, _filters?: { class?: string; section?: string }) {
    try {
      const response = await managementPost('get-attendance', { schoolId, startDate, endDate });
      const data = response?.data ?? response;
      return { data: data.records || [], error: null };
    } catch (error) {
      return { data: [], error };
    }
  },

  // Get attendance alerts
  async getAttendanceAlerts(schoolId: string, unnotifiedOnly: boolean = false) {
    try {
      const response = await managementPost('get-attendance-alerts', { schoolId, unnotifiedOnly });
      const data = response?.data ?? response;
      return { data: data.alerts || [], error: null };
    } catch (error) {
      return { data: [], error };
    }
  },

  // Mark alert as notified
  async markAlertNotified(alertId: string) {
    try {
      await managementPost('mark-alert-notified', { alertId });
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get learner attendance summary
  async getlearnerAttendanceSummary(learnerId: string, startDate?: string, endDate?: string) {
    try {
      const response = await managementPost('get-learner-attendance-summary', { learnerId, startDate, endDate });
      const data = response?.data ?? response;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
};

// ============= COLLEGE ATTENDANCE MANAGEMENT =============

export const collegeAttendanceService = {
  // Create college attendance session
  async createAttendanceSession(sessionData: {
    date: string;
    startTime: string;
    endTime: string;
    subjectName: string;
    subjectCode?: string;
    courseType?: string;
    facultyId: string;
    facultyName: string;
    departmentName: string;
    programName: string;
    programCode?: string;
    semester: number;
    section: string;
    roomNumber?: string;
    academicYear?: string;
    collegeId: string;
    createdBy: string;
  }) {
    try {
      const response = await managementPost('create-attendance-session', { sessionData });
      const data = response?.data ?? response;
      return { data: data.session, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Mark college attendance
  async markCollegeAttendance(records: {
    sessionId: string;
    learnerId: string;
    learnerName: string;
    rollNumber: string;
    departmentName: string;
    programName: string;
    semester: number;
    section: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    timeIn?: string;
    timeOut?: string;
    subjectName: string;
    subjectCode?: string;
    facultyId: string;
    facultyName: string;
    location?: string;
    remarks?: string;
    markedBy: string;
    collegeId: string;
  }[]) {
    try {
      const response = await managementPost('mark-college-attendance', { records });
      const data = response?.data ?? response;
      return { data: data.records, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get college attendance sessions for faculty
  async getFacultyAttendanceSessions(facultyId: string, collegeId: string, date?: string) {
    try {
      const response = await managementPost('get-faculty-attendance-sessions', { facultyId, collegeId, date });
      const data = response?.data ?? response;
      return { data: data.sessions || [], error: null };
    } catch (error) {
      return { data: [], error };
    }
  },

  // Get college attendance records for session
  async getSessionAttendanceRecords(sessionId: string) {
    try {
      const response = await managementPost('get-session-attendance-records', { sessionId });
      const data = response?.data ?? response;
      return { data: data.records || [], error: null };
    } catch (error) {
      return { data: [], error };
    }
  },

  // Get college learner attendance summary
  async getCollegeLearnerAttendanceSummary(learnerId: string, collegeId: string, startDate?: string, endDate?: string) {
    try {
      const response = await managementPost('get-college-learner-attendance-summary', { learnerId, collegeId, startDate, endDate });
      const data = response?.data ?? response;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get college attendance analytics
  async getCollegeAttendanceAnalytics(collegeId: string, facultyId?: string, startDate?: string, endDate?: string) {
    try {
      const response = await managementPost('get-college-attendance-analytics', { collegeId, facultyId, startDate, endDate });
      const data = response?.data ?? response;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
};

// ============= LEARNER REPORTS =============

export const learnerReportService = {
  // Generate attendance report
  async generateAttendanceReport(learnerId: string, schoolId: string, academicYear: string, term?: string) {
    const { data: attendanceData } = await attendanceService.getlearnerAttendanceSummary(learnerId);

    const reportData = {
      summary: attendanceData,
      monthlyBreakdown: await this.getMonthlyAttendance(learnerId),
      alerts: await this.getlearnerAlerts(learnerId)
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
    let assessments: any[] = [];
    try {
      const response = await managementPost('get-learner-assessments', { learnerId, schoolId });
      const data = response?.data ?? response;
      assessments = data.assessments || [];
    } catch {
      assessments = [];
    }

    const reportData = {
      assessments,
      averageScore: assessments?.reduce((sum, a) => sum + Number(a.score), 0) / (assessments?.length || 1),
      subjectWise: this.groupBySubject(assessments || [])
    };

    return await this.createReport({
      learnerId,
      schoolId,
      reportType: 'academic',
      title: `Academic Performance Report - ${academicYear}${term ? ` (${term})` : ''}`,
      academicYear,
      term,
      data: reportData
    });
  },

  // Generate career readiness report
  async generateCareerReadinessReport(learnerId: string, schoolId: string, academicYear: string) {
    const { data: profile } = await learnerProfileService.getLearnerProfile(learnerId);
    let assessments: any[] = [];
    try {
      const response = await managementPost('get-learner-assessments', { learnerId });
      const data = response?.data ?? response;
      assessments = data.assessments || [];
    } catch {
      assessments = [];
    }

    const reportData = {
      careerInterests: profile?.extended?.primary_interest,
      skills: profile?.extended?.career_skills,
      assessments,
      recommendations: await this.generateCareerRecommendations(learnerId, profile)
    };

    return await this.createReport({
      learnerId,
      schoolId,
      reportType: 'career_readiness',
      title: `Career Readiness Report - ${academicYear}`,
      academicYear,
      data: reportData
    });
  },

  // Create report record
  async createReport(reportData: Partial<LearnerReport>) {
    try {
      const response = await managementPost('create-report', { reportData });
      const data = response?.data ?? response;
      return { data: data.report, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get all reports for a learner
  async getlearnerReports(learnerId: string, reportType?: string) {
    try {
      const response = await managementPost('get-learner-reports', { learnerId, reportType });
      const data = response?.data ?? response;
      return { data: data.reports || [], error: null };
    } catch (error) {
      return { data: [], error };
    }
  },

  // Export report to PDF (placeholder - implement with PDF library)
  async exportToPDF(reportId: string): Promise<{ data: { url: string } | null; error: any }> {
    return {
      data: { url: '/api/reports/pdf/' + reportId },
      error: null
    };
  },

  // Helper: Get monthly attendance
  async getMonthlyAttendance(learnerId: string) {
    try {
      const response = await managementPost('get-monthly-attendance', { learnerId });
      const data = response?.data ?? response;
      return data.monthlyData || {};
    } catch {
      return {};
    }
  },

  // Helper: Get learner alerts
  async getlearnerAlerts(learnerId: string) {
    try {
      const response = await managementPost('get-learner-alerts', { learnerId });
      const data = response?.data ?? response;
      return data.alerts || [];
    } catch {
      return [];
    }
  },

  // Helper: Group assessments by subject
  groupBySubject(assessments: any[]) {
    const grouped: any = {};
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
  async generateCareerRecommendations(_learnerId: string, _profile: any) {
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

    if (!data.gender) {
      errors.push({ field: 'gender', message: 'Please select a gender.' });
    }

    if (!data.appliedFor) {
      errors.push({ field: 'appliedFor', message: 'Please choose a class.' });
    }

    if (!data.phone) {
      errors.push({ field: 'phone', message: 'Parent phone is required' });
    } else if (!/^\d{10}$/.test(data.phone)) {
      errors.push({ field: 'phone', message: 'Invalid mobile number.' });
    }

    if (!data.email) {
      errors.push({ field: 'email', message: 'Parent email is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push({ field: 'email', message: 'Invalid email address.' });
    }

    if (!data.address || data.address.trim().length === 0) {
      errors.push({ field: 'address', message: 'Address cannot be empty.' });
    }

    if (data.previousSchool && !/^[a-zA-Z0-9\s]+$/.test(data.previousSchool)) {
      errors.push({ field: 'previousSchool', message: 'Invalid school name.' });
    }

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

    const sizeValidation = validateFileSize(file, { context: 'document' });
    if (!sizeValidation.valid) {
      const config = getFileSizeLimit('document');
      return { field: documentType, message: `File size exceeds maximum allowed size of ${config.displaySize}.` };
    }

    return null;
  },

  // Total documents size validation (25MB limit)
  validateTotalDocumentsSize(files: File[]): ValidationError | null {
    const maxTotalSize = 25 * 1024 * 1024;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    if (totalSize > maxTotalSize) {
      return { field: 'documents', message: 'Total size of all uploaded documents must be less than 25MB.' };
    }

    return null;
  },

  // 6.1.2 Learner Profile Edit Validation
  validateProfileEdit(field: string, userRole: string): { allowed: boolean; message?: string } {
    if (field === 'email') {
      return { allowed: false, message: 'Email cannot be changed after verification.' };
    }

    if ((field === 'class' || field === 'section') && userRole !== 'principal') {
      return { allowed: false, message: 'Only Principal can change class or section.' };
    }

    return { allowed: true };
  },

  // Learner status transition validation
  validateStatusTransition(currentStatus: string, newStatus: string, hasGraduationWorkflow: boolean): ValidationError | null {
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

    const validStatuses = ['present', 'absent', 'late', 'excused'];
    if (!validStatuses.includes(data.status)) {
      errors.push({ field: 'status', message: 'Status must be one of: present, absent, late, excused.' });
    }

    const attendanceDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    attendanceDate.setHours(0, 0, 0, 0);

    if (attendanceDate > today) {
      errors.push({ field: 'date', message: 'Attendance date cannot be in the future.' });
    }

    if (data.remarks && data.remarks.length > 280) {
      errors.push({ field: 'remarks', message: 'Remarks cannot exceed 280 characters.' });
    }

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
    try {
      const response = await managementPost('check-duplicate-learner', { name, dateOfBirth, parentPhone });
      const data = response?.data ?? response;
      return data.isDuplicate || false;
    } catch {
      return false;
    }
  }
};
