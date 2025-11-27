import { supabase } from '@/lib/supabaseClient';
import type {
  AdmissionApplication,
  StudentProfile,
  AttendanceRecord,
  StudentReport,
  ValidationError
} from '@/types/StudentManagement';

// ============= ADMISSION WORKFLOW =============

export const admissionService = {
  // US-SM-03: Create new admission application
  async createApplication(data: Partial<AdmissionApplication>, schoolId: string): Promise<{ data: AdmissionApplication | null; error: any }> {
    // Validate all required fields
    const validationErrors = validationUtils.validateAdmissionData(data);
    if (validationErrors.length > 0) {
      return { data: null, error: { message: 'Validation failed', errors: validationErrors } };
    }

    // Check for duplicate student
    const isDuplicate = await validationUtils.checkDuplicateStudent(
      data.studentName!,
      data.dateOfBirth!,
      data.phone!
    );

    if (isDuplicate) {
      return { data: null, error: { message: 'A student with the same name, date of birth, and parent phone already exists.' } };
    }

    // Validate age vs class
    const ageValidation = this.validateAgeForClass(data.dateOfBirth!, data.appliedFor!);
    if (!ageValidation.valid) {
      return { data: null, error: { message: ageValidation.message } };
    }

    // Generate application number
    const applicationNumber = await this.generateApplicationNumber(schoolId);

    const { data: application, error } = await supabase
      .from('admission_applications')
      .insert({
        school_id: schoolId,
        application_number: applicationNumber,
        student_name: data.studentName,
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
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    // Generate admission receipt
    await this.generateAdmissionReceipt(application);

    // Send SMS/Email confirmation to parent
    await this.sendAdmissionConfirmation(application);

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
    // In production, this would generate a PDF receipt
    // For now, return a receipt URL
    const receiptUrl = `/receipts/admission/${application.id}`;
    
    // Store receipt reference in documents
    await supabase
      .from('admission_applications')
      .update({
        documents: {
          ...application.documents,
          admissionReceipt: receiptUrl
        }
      })
      .eq('id', application.id);

    return receiptUrl;
  },

  // Send admission confirmation
  async sendAdmissionConfirmation(application: AdmissionApplication): Promise<void> {
    // In production, integrate with SMS/Email service
    // For now, log the notification
    console.log('Sending admission confirmation:', {
      to: application.email,
      phone: application.phone,
      applicationNumber: application.applicationNumber,
      studentName: application.studentName
    });

    // TODO: Integrate with actual SMS/Email service
    // await smsService.send(application.phone, `Your child's admission application ${application.applicationNumber} has been received.`);
    // await emailService.send(application.email, 'Admission Application Received', emailTemplate);
  },

  // Generate unique application number
  async generateApplicationNumber(schoolId: string): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const { count } = await supabase
      .from('admission_applications')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId);

    const sequence = (count || 0) + 1;
    return `APP${year}${sequence.toString().padStart(5, '0')}`;
  },

  // Get all applications for a school
  async getApplications(schoolId: string, filters?: { status?: string; appliedFor?: string }) {
    let query = supabase
      .from('admission_applications')
      .select('*')
      .eq('school_id', schoolId)
      .order('applied_date', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.appliedFor) {
      query = query.eq('applied_for', filters.appliedFor);
    }

    return await query;
  },

  // Update application status
  async updateApplicationStatus(
    applicationId: string,
    status: string,
    verifiedBy?: string,
    remarks?: string
  ) {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'approved') {
      updateData.verified_by = verifiedBy;
      updateData.verified_date = new Date().toISOString();
    }

    if (remarks) {
      updateData.remarks = remarks;
    }

    return await supabase
      .from('admission_applications')
      .update(updateData)
      .eq('id', applicationId)
      .select()
      .single();
  },

  // Upload documents
  async uploadDocument(file: File, applicationId: string, documentType: string) {
    const fileName = `${applicationId}/${documentType}/${Date.now()}_${file.name}`;
    
    const { error } = await supabase.storage
      .from('admission-documents')
      .upload(fileName, file);

    if (error) return { data: null, error };

    const { data: { publicUrl } } = supabase.storage
      .from('admission-documents')
      .getPublicUrl(fileName);

    return { data: { url: publicUrl, path: fileName }, error: null };
  },

  // Approve and generate enrollment
  async approveAndEnroll(applicationId: string, academicYear: string, schoolId: string) {
    // Get application details
    const { data: application, error: appError } = await supabase
      .from('admission_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return { data: null, error: appError || { message: 'Application not found' } };
    }

    // Generate enrollment number using database function
    const { data: enrollmentData, error: enrollError } = await supabase
      .rpc('generate_enrollment_number', {
        p_school_id: schoolId,
        p_academic_year: academicYear
      });

    if (enrollError) return { data: null, error: enrollError };

    const enrollmentNumber = enrollmentData;

    // Update application with enrollment number
    const { error: updateError } = await supabase
      .from('admission_applications')
      .update({
        status: 'approved',
        enrollment_number: enrollmentNumber,
        verified_date: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (updateError) return { data: null, error: updateError };

    return { data: { enrollmentNumber }, error: null };
  },

  // Record fee payment
  async recordFeePayment(applicationId: string, amount: number) {
    const { data: application } = await supabase
      .from('admission_applications')
      .select('fee_amount, fee_paid')
      .eq('id', applicationId)
      .single();

    if (!application) {
      return { data: null, error: { message: 'Application not found' } };
    }

    const newFeePaid = (application.fee_paid || 0) + amount;
    const feeStatus = newFeePaid >= (application.fee_amount || 0) ? 'paid' : 'partial';

    return await supabase
      .from('admission_applications')
      .update({
        fee_paid: newFeePaid,
        fee_status: feeStatus
      })
      .eq('id', applicationId)
      .select()
      .single();
  }
};

// ============= STUDENT PROFILE MANAGEMENT =============

export const studentProfileService = {
  // Create extended profile after admission
  async createExtendedProfile(studentId: string, schoolId: string, data: Partial<StudentProfile>) {
    return await supabase
      .from('student_management_records')
      .insert({
        student_id: studentId,
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
        photo_url: data.photo
      })
      .select()
      .single();
  },

  // Get student profile with extended data
  async getStudentProfile(studentId: string) {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        extended:student_management_records(*),
        attendance:attendance_records(*)
      `)
      .eq('id', studentId)
      .single();

    if (error) return { data: null, error };

    // Calculate attendance trend
    const attendanceRecords = data.attendance || [];
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter((r: any) => r.status === 'present').length;
    const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return {
      data: {
        ...data,
        attendanceTrend: {
          totalDays,
          presentDays,
          absentDays: totalDays - presentDays,
          percentage,
          isAtRisk: percentage < 75
        }
      },
      error: null
    };
  },

  // Update student profile
  async updateProfile(studentId: string, updates: Partial<StudentProfile>) {
    return await supabase
      .from('student_management_records')
      .update({
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
        status: updates.status
      })
      .eq('student_id', studentId)
      .select()
      .single();
  },

  // Get all students for a school
  async getSchoolStudents(schoolId: string, filters?: { class?: string; section?: string; status?: string }) {
    let query = supabase
      .from('student_management_records')
      .select(`
        *,
        student:students(*)
      `)
      .eq('school_id', schoolId);

    if (filters?.class) query = query.eq('class', filters.class);
    if (filters?.section) query = query.eq('section', filters.section);
    if (filters?.status) query = query.eq('status', filters.status);

    return await query.order('enrollment_number', { ascending: true });
  }
};

// ============= ATTENDANCE MANAGEMENT =============

export const attendanceService = {
  // US-SM-04: Mark attendance (manual)
  async markAttendance(records: Partial<AttendanceRecord>[], markedBy: string) {
    // Validate each attendance entry
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

      // Check if student already marked present in another class today
      const isDuplicate = await this.checkDuplicateAttendance(
        record.studentId!,
        record.date || new Date().toISOString().split('T')[0]
      );

      if (isDuplicate) {
        return { 
          data: null, 
          error: { message: `Student ${record.studentId} is already marked present in another class today.` } 
        };
      }
    }

    const attendanceData = records.map(record => ({
      student_id: record.studentId,
      school_id: record.schoolId,
      date: record.date || new Date().toISOString().split('T')[0],
      status: record.status,
      mode: 'manual',
      marked_by: markedBy,
      remarks: record.remarks
    }));

    const { data: attendanceResult, error } = await supabase
      .from('attendance_records')
      .upsert(attendanceData, {
        onConflict: 'student_id,date'
      })
      .select();

    if (error) {
      return { data: null, error };
    }

    // Notify parents if student is absent
    for (const record of attendanceResult || []) {
      if (record.status === 'absent') {
        await this.notifyParentAbsence(record.student_id, record.date);
      }
    }

    // Trigger alert check
    await supabase.rpc('check_attendance_alerts');

    return { data: attendanceResult, error: null };
  },

  // Check for duplicate attendance (student present in multiple classes)
  async checkDuplicateAttendance(studentId: string, date: string): Promise<boolean> {
    const { data } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('student_id', studentId)
      .eq('date', date)
      .eq('status', 'present')
      .limit(1);

    return (data && data.length > 0) || false;
  },

  // Notify parent of absence
  async notifyParentAbsence(studentId: string, date: string): Promise<void> {
    // Get student and parent info
    const { data: student } = await supabase
      .from('students')
      .select('name, parent_phone, parent_email')
      .eq('id', studentId)
      .single();

    if (!student) return;

    console.log('Notifying parent of absence:', {
      student: student.name,
      date,
      phone: student.parent_phone,
      email: student.parent_email
    });

    // TODO: Integrate with SMS/Email service
    // await smsService.send(student.parent_phone, `Your child ${student.name} was marked absent on ${date}.`);
  },

  // Mark attendance via RFID
  async markAttendanceRFID(_rfidTag: string, _schoolId: string) {
    // In real implementation, you'd look up student by RFID tag
    // For now, this is a placeholder
    return { data: null, error: { message: 'RFID integration pending' } };
  },

  // Mark attendance via Mobile OTP
  async markAttendanceMobile(studentId: string, schoolId: string, otp: string) {
    // Verify OTP (implement OTP verification logic)
    const isValidOTP = await this.verifyOTP(studentId, otp);
    
    if (!isValidOTP) {
      return { data: null, error: { message: 'Invalid OTP' } };
    }

    return await supabase
      .from('attendance_records')
      .insert({
        student_id: studentId,
        school_id: schoolId,
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        mode: 'mobile',
        time_in: new Date().toTimeString().split(' ')[0],
        otp_verified: true
      })
      .select()
      .single();
  },

  // Verify OTP (placeholder)
  async verifyOTP(_studentId: string, otp: string): Promise<boolean> {
    // Implement actual OTP verification logic
    return otp.length === 6;
  },

  // Get attendance for date range
  async getAttendance(schoolId: string, startDate: string, endDate: string, _filters?: { class?: string; section?: string }) {
    const query = supabase
      .from('attendance_records')
      .select(`
        *,
        student:students(
          *,
          extended:student_management_records(*)
        )
      `)
      .eq('school_id', schoolId)
      .gte('date', startDate)
      .lte('date', endDate);

    return await query.order('date', { ascending: false });
  },

  // Get attendance alerts
  async getAttendanceAlerts(schoolId: string, unnotifiedOnly: boolean = false) {
    let query = supabase
      .from('attendance_alerts')
      .select(`
        *,
        student:students(
          *,
          extended:student_management_records(*)
        )
      `)
      .eq('school_id', schoolId);

    if (unnotifiedOnly) {
      query = query.eq('parent_notified', false);
    }

    return await query.order('created_at', { ascending: false });
  },

  // Mark alert as notified
  async markAlertNotified(alertId: string) {
    return await supabase
      .from('attendance_alerts')
      .update({
        parent_notified: true,
        notified_date: new Date().toISOString()
      })
      .eq('id', alertId);
  },

  // Get student attendance summary
  async getStudentAttendanceSummary(studentId: string, startDate?: string, endDate?: string) {
    const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('student_id', studentId)
      .gte('date', start)
      .lte('date', end);

    if (error) return { data: null, error };

    const totalDays = data.length;
    const presentDays = data.filter(r => r.status === 'present').length;
    const absentDays = data.filter(r => r.status === 'absent').length;
    const lateDays = data.filter(r => r.status === 'late').length;
    const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return {
      data: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        percentage,
        isAtRisk: percentage < 75,
        records: data
      },
      error: null
    };
  }
};

// ============= STUDENT REPORTS =============

export const studentReportService = {
  // Generate attendance report
  async generateAttendanceReport(studentId: string, schoolId: string, academicYear: string, term?: string) {
    const { data: attendanceData } = await attendanceService.getStudentAttendanceSummary(studentId);
    
    const reportData = {
      summary: attendanceData,
      monthlyBreakdown: await this.getMonthlyAttendance(studentId),
      alerts: await this.getStudentAlerts(studentId)
    };

    return await this.createReport({
      studentId,
      schoolId,
      reportType: 'attendance',
      title: `Attendance Report - ${academicYear}${term ? ` (${term})` : ''}`,
      academicYear,
      term,
      data: reportData
    });
  },

  // Generate academic performance report
  async generateAcademicReport(studentId: string, schoolId: string, academicYear: string, term?: string) {
    // Fetch academic data (grades, assessments, etc.)
    const { data: assessments } = await supabase
      .from('skill_assessments')
      .select('*')
      .eq('student_id', studentId)
      .eq('school_id', schoolId);

    const reportData = {
      assessments,
      averageScore: assessments?.reduce((sum, a) => sum + Number(a.score), 0) / (assessments?.length || 1),
      subjectWise: this.groupBySubject(assessments || [])
    };

    return await this.createReport({
      studentId,
      schoolId,
      reportType: 'academic',
      title: `Academic Performance Report - ${academicYear}${term ? ` (${term})` : ''}`,
      academicYear,
      term,
      data: reportData
    });
  },

  // Generate career readiness report
  async generateCareerReadinessReport(studentId: string, schoolId: string, academicYear: string) {
    const { data: profile } = await studentProfileService.getStudentProfile(studentId);
    const { data: assessments } = await supabase
      .from('skill_assessments')
      .select('*')
      .eq('student_id', studentId);

    const reportData = {
      careerInterests: profile?.extended?.primary_interest,
      skills: profile?.extended?.career_skills,
      assessments,
      recommendations: await this.generateCareerRecommendations(studentId, profile)
    };

    return await this.createReport({
      studentId,
      schoolId,
      reportType: 'career_readiness',
      title: `Career Readiness Report - ${academicYear}`,
      academicYear,
      data: reportData
    });
  },

  // Create report record
  async createReport(reportData: Partial<StudentReport>) {
    const { data: user } = await supabase.auth.getUser();
    
    return await supabase
      .from('student_reports')
      .insert({
        student_id: reportData.studentId,
        school_id: reportData.schoolId,
        report_type: reportData.reportType,
        title: reportData.title,
        academic_year: reportData.academicYear,
        term: reportData.term,
        data: reportData.data,
        generated_by: user?.user?.id,
        has_school_logo: true,
        is_parent_friendly: true
      })
      .select()
      .single();
  },

  // Get all reports for a student
  async getStudentReports(studentId: string, reportType?: string) {
    let query = supabase
      .from('student_reports')
      .select('*')
      .eq('student_id', studentId);

    if (reportType) {
      query = query.eq('report_type', reportType);
    }

    return await query.order('generated_date', { ascending: false });
  },

  // Export report to PDF (placeholder - implement with PDF library)
  async exportToPDF(reportId: string): Promise<{ data: { url: string } | null; error: any }> {
    // This would use a PDF generation library like jsPDF or pdfmake
    // For now, return placeholder
    return {
      data: { url: '/api/reports/pdf/' + reportId },
      error: null
    };
  },

  // Helper: Get monthly attendance
  async getMonthlyAttendance(studentId: string) {
    const { data } = await supabase
      .from('attendance_records')
      .select('date, status')
      .eq('student_id', studentId)
      .gte('date', new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0]);

    // Group by month
    const monthlyData: any = {};
    data?.forEach(record => {
      const month = record.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { present: 0, absent: 0, total: 0 };
      }
      monthlyData[month].total++;
      if (record.status === 'present') monthlyData[month].present++;
      if (record.status === 'absent') monthlyData[month].absent++;
    });

    return monthlyData;
  },

  // Helper: Get student alerts
  async getStudentAlerts(studentId: string) {
    const { data } = await supabase
      .from('attendance_alerts')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(10);

    return data;
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
  async generateCareerRecommendations(_studentId: string, _profile: any) {
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
  // 6.1.1 Student Admission Form Validation
  validateAdmissionData(data: Partial<AdmissionApplication>): ValidationError[] {
    const errors: ValidationError[] = [];

    // First Name - Alphabetic only, min 2 chars
    if (!data.studentName) {
      errors.push({ field: 'studentName', message: 'Student name is required' });
    } else {
      const nameParts = data.studentName.trim().split(' ');
      const firstName = nameParts[0];
      
      if (firstName.length < 2) {
        errors.push({ field: 'studentName', message: 'First name must be at least 2 characters' });
      }
      
      if (!/^[a-zA-Z\s]+$/.test(data.studentName)) {
        errors.push({ field: 'studentName', message: 'First name must contain only letters.' });
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
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return { field: documentType, message: 'Unsupported file type or file too large.' };
    }

    if (file.size > maxSize) {
      return { field: documentType, message: 'Unsupported file type or file too large.' };
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

  // 6.1.2 Student Profile Edit Validation
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

  // Student status transition validation
  validateStatusTransition(currentStatus: string, newStatus: string, hasGraduationWorkflow: boolean): ValidationError | null {
    if (newStatus === 'graduated' && !hasGraduationWorkflow) {
      return { field: 'status', message: 'Student can only be marked as alumni if graduation workflow is completed.' };
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

  // Check for duplicate student
  async checkDuplicateStudent(
    name: string, 
    dateOfBirth: string, 
    parentPhone: string
  ): Promise<boolean> {
    const { data } = await supabase
      .from('admission_applications')
      .select('id')
      .eq('student_name', name)
      .eq('date_of_birth', dateOfBirth)
      .eq('phone', parentPhone)
      .limit(1);

    return (data && data.length > 0) || false;
  }
}