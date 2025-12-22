import { supabase } from '../../lib/supabaseClient';

// Shared function to get authenticated educator data with class assignments
async function getAuthenticatedEducator() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('No authenticated user');
  
  const user = session.user;

  // First check if they are a school educator
  const { data: schoolEducatorData, error: schoolEducatorError } = await supabase
    .from('school_educators')
    .select('id, school_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (schoolEducatorError && schoolEducatorError.code !== 'PGRST116') {
    throw schoolEducatorError;
  }

  if (schoolEducatorData?.school_id) {
    // Get assigned class IDs for this educator (if not admin)
    let assignedClassIds: string[] = [];
    
    if (schoolEducatorData.role !== 'admin') {
      const { data: classAssignments, error: classError } = await supabase
        .from('school_educator_class_assignments')
        .select('class_id')
        .eq('educator_id', schoolEducatorData.id);

      if (!classError && classAssignments) {
        assignedClassIds = classAssignments.map(assignment => assignment.class_id);
      }
    }

    return { 
      user, 
      educatorData: schoolEducatorData, 
      educatorType: 'school' as const,
      assignedClassIds 
    };
  }

  // Check if they are a college lecturer
  const { data: collegeLecturerData, error: collegeLecturerError } = await supabase
    .from('college_lecturers')
    .select('id, collegeId')
    .eq('user_id', user.id)
    .maybeSingle();

  if (collegeLecturerError && collegeLecturerError.code !== 'PGRST116') {
    throw collegeLecturerError;
  }

  if (collegeLecturerData?.collegeId) {
    return { 
      user, 
      educatorData: { 
        id: collegeLecturerData.id, 
        school_id: collegeLecturerData.collegeId,
        role: 'lecturer'
      }, 
      educatorType: 'college' as const,
      assignedClassIds: [] // College lecturers see all college students
    };
  }

  // Check if they are an educator in the users table (college_educator, school_educator, etc.)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!userError && userData && userData.role) {
    const userRole = userData.role as string;
    
    // Handle college_educator role
    if (userRole === 'college_educator') {
      return { 
        user, 
        educatorData: { 
          id: userData.id, 
          school_id: userData.organizationId, // Use organizationId as college/school ID
          role: 'educator'
        }, 
        educatorType: 'college' as const,
        assignedClassIds: [] // College educators see all college students
      };
    }
    
    // Handle school_educator role
    if (userRole === 'school_educator') {
      return { 
        user, 
        educatorData: { 
          id: userData.id, 
          school_id: userData.organizationId, // Use organizationId as school ID
          role: 'educator'
        }, 
        educatorType: 'school' as const,
        assignedClassIds: [] // For now, let them see all school students
      };
    }
  }

  throw new Error('Educator not registered with any school or college. Please contact your administrator.');
}

export interface DashboardKPIs {
  totalStudents: number;
  activeStudents: number;
  pendingActivities: number;
  verifiedActivities: number;
  totalActivities: number;
  verificationRate: number;
  recentActivitiesCount: number;
  totalMentorNotes: number;
}

export interface RecentActivity {
  id: string;
  title: string;
  description: string;
  studentName: string;
  category: string;
  status: 'pending' | 'sent_to_admin' | 'approved' | 'rejected';
  submittedDate: string;
}

export interface SkillAnalytics {
  skillParticipation: { skill: string; count: number }[];
  skillDistribution: { category: string; count: number }[];
}

export interface Announcement {
  id: string;
  message: string;
  createdAt: string;
}

export const dashboardApi = {
  async getKPIs(): Promise<DashboardKPIs> {
    try {
      const { user, educatorData, educatorType, assignedClassIds } = await getAuthenticatedEducator();

      // Check if educator has no class assignments (and is not admin)
      if (educatorType === 'school' && educatorData.role !== 'admin' && assignedClassIds.length === 0) {
        // Educators with no class assignments should see no students
        return {
          totalStudents: 0,
          activeStudents: 0,
          pendingActivities: 0,
          verifiedActivities: 0,
          totalActivities: 0,
          verificationRate: 0,
          recentActivitiesCount: 0,
          totalMentorNotes: 0,
        };
      }

      let studentsQuery = supabase
        .from('students')
        .select('id, user_id')
        .eq('is_deleted', false);

      // Apply filtering based on educator type and role
      if (educatorType === 'school') {
        // For school educators, check if they have class assignments
        if (educatorData.role === 'admin') {
          // School admins can see all students in their school
          studentsQuery = studentsQuery.eq('school_id', educatorData.school_id);
        } else if (assignedClassIds.length > 0) {
          // Regular educators can only see students in their assigned classes
          studentsQuery = studentsQuery
            .eq('school_id', educatorData.school_id)
            .in('school_class_id', assignedClassIds);
        }
      } else if (educatorType === 'college') {
        studentsQuery = studentsQuery.eq('college_id', educatorData.school_id);
      }

      const { data: studentsData, error: studentsError } = await studentsQuery;

      if (studentsError) throw studentsError;

      const studentUserIds = studentsData?.map(s => s.user_id) || [];
      const studentIds = studentsData?.map(s => s.id) || [];
      const totalStudents = studentsData?.length || 0;

      if (studentUserIds.length === 0) {
        return {
          totalStudents: 0,
          activeStudents: 0,
          pendingActivities: 0,
          verifiedActivities: 0,
          totalActivities: 0,
          verificationRate: 0,
          recentActivitiesCount: 0,
          totalMentorNotes: 0,
        };
      }

      // Get activities from all relevant tables
      const [
        projectsData, 
        trainingsData, 
        certificatesData,
        attendanceData,
        assessmentData,
        assignmentData,
        mentorNotesData
      ] = await Promise.all([
        supabase.from('projects').select('approval_status').in('student_id', studentUserIds),
        supabase.from('trainings').select('approval_status').in('student_id', studentUserIds),
        supabase.from('certificates').select('approval_status').in('student_id', studentUserIds),
        supabase.from('attendance_records').select('status').in('student_id', studentIds),
        supabase.from('personal_assessment_results').select('status').in('student_id', studentUserIds).eq('status', 'completed'),
        supabase.from('student_assignments').select('status').in('student_id', studentIds).in('status', ['submitted', 'graded']),
        supabase.from('mentor_notes').select('id').eq('educator_id', user.id).in('student_id', studentIds)
      ]);

      // Combine all activities for verification metrics (excluding assignments - they have separate grading workflow)
      const verifiableActivities = [
        ...(projectsData.data || []).map(p => ({ status: p.approval_status })),
        ...(trainingsData.data || []).map(t => ({ status: t.approval_status })),
        ...(certificatesData.data || []).map(c => ({ status: c.approval_status }))
        // Note: Assignments excluded - they use separate grading system (submitted → graded)
      ];

      // Count all activities including non-verifiable ones
      const totalActivities = verifiableActivities.length + 
                             (attendanceData.data?.length || 0) + 
                             (assessmentData.data?.length || 0) + 
                             (assignmentData.data?.length || 0) + 
                             (mentorNotesData.data?.length || 0);

      const pendingActivities = verifiableActivities.filter(a => a.status === 'pending').length;
      const verifiedActivities = verifiableActivities.filter(a => 
        a.status === 'approved' || a.status === 'sent_to_admin'
      ).length;
      const verificationRate = verifiableActivities.length > 0 ? 
        Math.round((verifiedActivities / verifiableActivities.length) * 100) : 0;

      return {
        totalStudents,
        activeStudents: totalStudents,
        pendingActivities,
        verifiedActivities,
        totalActivities,
        verificationRate,
        recentActivitiesCount: Math.min(totalActivities, 10),
        totalMentorNotes: mentorNotesData.data?.length || 0,
      };
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      return {
        totalStudents: 0,
        activeStudents: 0,
        pendingActivities: 0,
        verifiedActivities: 0,
        totalActivities: 0,
        verificationRate: 0,
        recentActivitiesCount: 0,
        totalMentorNotes: 0,
      };
    }
  },

  async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    try {
      const { user, educatorData, educatorType, assignedClassIds } = await getAuthenticatedEducator();

      // Check if educator has no class assignments (and is not admin)
      if (educatorType === 'school' && educatorData.role !== 'admin' && assignedClassIds.length === 0) {
        // Educators with no class assignments should see no students
        return [];
      }

      let studentsQuery = supabase
        .from('students')
        .select('id, user_id, name')
        .eq('is_deleted', false);

      // Apply filtering based on educator type and role
      if (educatorType === 'school') {
        // For school educators, check if they have class assignments
        if (educatorData.role === 'admin') {
          // School admins can see all students in their school
          studentsQuery = studentsQuery.eq('school_id', educatorData.school_id);
        } else if (assignedClassIds.length > 0) {
          // Regular educators can only see students in their assigned classes
          studentsQuery = studentsQuery
            .eq('school_id', educatorData.school_id)
            .in('school_class_id', assignedClassIds);
        }
      } else if (educatorType === 'college') {
        studentsQuery = studentsQuery.eq('college_id', educatorData.school_id);
      }

      const { data: studentsData } = await studentsQuery;

      const studentUserIds = studentsData?.map(s => s.user_id) || [];
      const studentIds = studentsData?.map(s => s.id) || [];
      const studentMap: { [key: string]: string } = {};
      const studentIdMap: { [key: string]: string } = {};
      
      console.log('🎓 Found students:', studentsData?.length || 0);
      console.log('📋 Student IDs for assignment query:', studentIds);
      
      studentsData?.forEach(student => {
        const studentName = student.name || `Student ${student.id.substring(0, 8)}`;
        studentMap[student.user_id] = studentName;
        studentIdMap[student.id] = studentName;
        console.log(`👤 Student: ${studentName} (ID: ${student.id})`);
      });

      if (studentUserIds.length === 0) {
        return [];
      }

      // Get recent activities from all relevant tables (last 30 days for performance)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateFilter = thirtyDaysAgo.toISOString();

      const [
        projectsData, 
        trainingsData, 
        certificatesData,
        attendanceData,
        assessmentData,
        assignmentData,
        mentorNotesData,
        timetablesData,
        clubsData,
        competitionsData,
        coursesData
      ] = await Promise.all([
        // Projects
        supabase
          .from('projects')
          .select('id, title, description, approval_status, created_at, student_id')
          .in('student_id', studentUserIds)
          .gte('created_at', dateFilter)
          .order('created_at', { ascending: false })
          .limit(Math.ceil(limit / 7)),
        
        // Trainings
        supabase
          .from('trainings')
          .select('id, title, description, approval_status, created_at, student_id')
          .in('student_id', studentUserIds)
          .gte('created_at', dateFilter)
          .order('created_at', { ascending: false })
          .limit(Math.ceil(limit / 7)),
        
        // Certificates
        supabase
          .from('certificates')
          .select('id, title, description, approval_status, created_at, student_id')
          .in('student_id', studentUserIds)
          .gte('created_at', dateFilter)
          .order('created_at', { ascending: false })
          .limit(Math.ceil(limit / 7)),
        
        // Attendance Records with detailed slot information
        supabase
          .from('attendance_records')
          .select(`
            id, date, status, remarks, created_at, student_id, slot_id,
            timetable_slots!inner(
              period_number, subject_name, class_id,
              school_classes!inner(name, grade, section)
            )
          `)
          .in('student_id', studentIds)
          .gte('created_at', dateFilter)
          .order('created_at', { ascending: false })
          .limit(Math.ceil(limit / 7)),
        
        // Personal Assessment Results
        supabase
          .from('personal_assessment_results')
          .select(`
            id, stream_id, status, employability_readiness, knowledge_score, 
            created_at, student_id, grade_level
          `)
          .in('student_id', studentUserIds)
          .eq('status', 'completed')
          .gte('created_at', dateFilter)
          .order('created_at', { ascending: false })
          .limit(Math.ceil(limit / 7)),
        
        // Student Assignments (only submitted ones)
        supabase
          .from('student_assignments')
          .select(`
            student_assignment_id, status, grade_received, submission_date, updated_date, student_id,
            assignments!inner(title, description, assignment_type)
          `)
          .in('student_id', studentIds)
          .in('status', ['submitted', 'graded'])
          .gte('updated_date', dateFilter)
          .order('updated_date', { ascending: false })
          .limit(Math.ceil(limit / 7)),
        
        // Mentor Notes
        supabase
          .from('mentor_notes')
          .select('id, note, category, created_at, student_id')
          .eq('educator_id', user.id)
          .in('student_id', studentIds)
          .gte('created_at', dateFilter)
          .order('created_at', { ascending: false })
          .limit(Math.ceil(limit / 7)),
        
        // Timetable slots (period assignments) for this educator
        supabase
          .from('timetable_slots')
          .select(`
            id, educator_id, day_of_week, period_number, start_time, end_time,
            subject_name, room_number, created_at,
            school_classes!inner(name, grade, section)
          `)
          .eq('educator_id', educatorData.id)
          .gte('created_at', dateFilter)
          .order('created_at', { ascending: false })
          .limit(Math.ceil(limit / 11)),
        
        // Clubs where this educator is mentor or created by them
        supabase
          .from('clubs')
          .select('club_id, name, category, description, is_active, created_at, mentor_educator_id, created_by_educator_id')
          .eq('school_id', educatorData.school_id)
          .or(`mentor_educator_id.eq.${educatorData.id},created_by_educator_id.eq.${educatorData.id}`)
          .eq('is_active', true)
          .gte('created_at', dateFilter)
          .order('created_at', { ascending: false })
          .limit(Math.ceil(limit / 11)),
        
        // Competitions created by this educator or in their school
        supabase
          .from('competitions')
          .select('comp_id, name, description, level, category, competition_date, status, created_at, created_by_educator_id')
          .eq('school_id', educatorData.school_id)
          .in('status', ['active', 'upcoming', 'completed'])
          .gte('created_at', dateFilter)
          .order('created_at', { ascending: false })
          .limit(Math.ceil(limit / 11)),
        
        // Courses created by this educator (exclude drafts)
        supabase
          .from('courses')
          .select('course_id, title, code, description, status, enrollment_count, created_at, educator_id')
          .eq('educator_id', educatorData.id)
          .in('status', ['active', 'published'])
          .gte('created_at', dateFilter)
          .order('created_at', { ascending: false })
          .limit(Math.ceil(limit / 11))
      ]);

      const activities: RecentActivity[] = [];

      // Add projects
      projectsData.data?.forEach((project: any) => {
        activities.push({
          id: `project-${project.id}`,
          title: project.title,
          description: project.description || 'Project submission',
          studentName: studentMap[project.student_id] || 'Unknown Student',
          category: 'Project',
          status: project.approval_status || 'pending',
          submittedDate: project.created_at,
        });
      });

      // Add trainings
      trainingsData.data?.forEach((training: any) => {
        activities.push({
          id: `training-${training.id}`,
          title: training.title,
          description: training.description || 'Training completion',
          studentName: studentMap[training.student_id] || 'Unknown Student',
          category: 'Training',
          status: training.approval_status || 'pending',
          submittedDate: training.created_at,
        });
      });

      // Add certificates
      certificatesData.data?.forEach((certificate: any) => {
        activities.push({
          id: `certificate-${certificate.id}`,
          title: certificate.title,
          description: certificate.description || 'Certificate submission',
          studentName: studentMap[certificate.student_id] || 'Unknown Student',
          category: 'Certificate',
          status: certificate.approval_status || 'pending',
          submittedDate: certificate.created_at,
        });
      });

      // Add attendance records (grouped by date and slot for better detail)
      const attendanceBySlot: { [key: string]: { 
        date: string,
        period_number: number,
        subject_name: string,
        class_name: string,
        grade: string,
        section: string,
        present: number, 
        absent: number, 
        late: number, 
        excused: number,
        total: number,
        created_at: string,
        slot_id: string
      } } = {};
      
      attendanceData.data?.forEach((attendance: any) => {
        // Create unique key for each slot session
        const slotKey = `${attendance.date}-${attendance.slot_id}`;
        
        if (!attendanceBySlot[slotKey]) {
          attendanceBySlot[slotKey] = {
            date: attendance.date,
            period_number: attendance.timetable_slots?.period_number || 0,
            subject_name: attendance.timetable_slots?.subject_name || 'Unknown Subject',
            class_name: attendance.timetable_slots?.school_classes?.name || 'Unknown Class',
            grade: attendance.timetable_slots?.school_classes?.grade || '',
            section: attendance.timetable_slots?.school_classes?.section || '',
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total: 0,
            created_at: attendance.created_at,
            slot_id: attendance.slot_id
          };
        }
        
        // Count attendance status
        if (attendance.status === 'present') {
          attendanceBySlot[slotKey].present++;
        } else if (attendance.status === 'absent') {
          attendanceBySlot[slotKey].absent++;
        } else if (attendance.status === 'late') {
          attendanceBySlot[slotKey].late++;
        } else if (attendance.status === 'excused') {
          attendanceBySlot[slotKey].excused++;
        }
        
        attendanceBySlot[slotKey].total++;
      });
      
      // Convert grouped attendance to activities with detailed information
      Object.values(attendanceBySlot).forEach((slotAttendance) => {
        
        // Format period display
        const periodText = slotAttendance.period_number > 0 ? `Period ${slotAttendance.period_number}` : 'Period';
        
        // Format class display
        const classDisplay = slotAttendance.grade && slotAttendance.section 
          ? `Grade ${slotAttendance.grade} - ${slotAttendance.section}`
          : slotAttendance.class_name;
        
        activities.push({
          id: `attendance-${slotAttendance.slot_id}-${slotAttendance.date}`,
          title: `${periodText} - ${slotAttendance.subject_name}`,
          description: `${classDisplay} • Attendance marked`,
          studentName: `${slotAttendance.date}`,
          category: 'Attendance',
          status: 'sent_to_admin',
          submittedDate: slotAttendance.created_at,
        });
      });

      // Add personal assessment results
      assessmentData.data?.forEach((assessment: any) => {
        const streamName = assessment.stream_id?.toUpperCase() || 'General';
        const readinessLevel = assessment.employability_readiness || 'Not Available';
        const knowledgeScore = assessment.knowledge_score ? `${assessment.knowledge_score}%` : 'Not Available';
        
        activities.push({
          id: `assessment-${assessment.id}`,
          title: `${streamName} Personal Assessment`,
          description: `Employability: ${readinessLevel} • Knowledge Score: ${knowledgeScore}`,
          studentName: studentMap[assessment.student_id] || 'Unknown Student',
          category: 'Assessment',
          status: 'approved',
          submittedDate: assessment.created_at,
        });
      });

      // Add assignments (only submitted ones - already filtered by query)
      console.log('🔍 Assignment data received:', assignmentData.data?.length || 0, 'assignments');
      assignmentData.data?.forEach((assignment: any) => {
        console.log('📝 Processing assignment:', assignment.assignments?.title, 'by student ID:', assignment.student_id);
        
        const statusMap: { [key: string]: 'pending' | 'sent_to_admin' | 'approved' | 'rejected' } = {
          'submitted': 'sent_to_admin', // Keep blue badge but change display text in UI
          'graded': 'approved'
        };
        
        const studentName = studentIdMap[assignment.student_id] || 'Unknown Student';
        console.log('👤 Student name resolved:', studentName);
        
        activities.push({
          id: `assignment-${assignment.student_assignment_id}`,
          title: assignment.assignments?.title || 'Assignment',
          description: assignment.assignments?.description || `${assignment.assignments?.assignment_type || 'Assignment'} submission`,
          studentName: studentName,
          category: 'Assignment',
          status: statusMap[assignment.status] || 'sent_to_admin',
          submittedDate: assignment.submission_date || assignment.updated_date,
        });
      });

      // Add mentor notes
      mentorNotesData.data?.forEach((note: any) => {
        activities.push({
          id: `note-${note.id}`,
          title: `Mentor Note - ${note.category || 'General'}`,
          description: note.note.length > 100 ? `${note.note.substring(0, 100)}...` : note.note,
          studentName: studentIdMap[note.student_id] || 'Unknown Student',
          category: 'Mentor Note',
          status: 'approved', // Mentor notes are always considered complete
          submittedDate: note.created_at,
        });
      });

      // Add timetable slots (period assignments)
      timetablesData.data?.forEach((slot: any) => {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[slot.day_of_week] || 'Unknown Day';
        const timeRange = `${slot.start_time?.slice(0, 5)} - ${slot.end_time?.slice(0, 5)}`;
        const className = slot.school_classes?.name || `Grade ${slot.school_classes?.grade} - ${slot.school_classes?.section}`;
        
        activities.push({
          id: `timetable-slot-${slot.id}`,
          title: `Period ${slot.period_number} - ${slot.subject_name}`,
          description: `${className} • ${dayName} ${timeRange} • Room ${slot.room_number}`,
          studentName: new Date(slot.created_at).toLocaleDateString(),
          category: 'Schedule',
          status: 'sent_to_admin',
          submittedDate: slot.created_at,
        });
      });

      // Add clubs
      clubsData.data?.forEach((club: any) => {
        const isMentor = club.mentor_educator_id === educatorData.id;
        const isCreator = club.created_by_educator_id === educatorData.id;
        const role = isMentor && isCreator ? 'Mentor & Creator' : isMentor ? 'Mentor' : 'Creator';
        
        activities.push({
          id: `club-${club.club_id}`,
          title: `Club: ${club.name}`,
          description: `${club.category} • ${role}`,
          studentName: club.description?.substring(0, 50) || 'No description',
          category: 'Club',
          status: 'approved',
          submittedDate: club.created_at,
        });
      });

      // Add competitions
      competitionsData.data?.forEach((competition: any) => {
        const statusMap: { [key: string]: 'pending' | 'sent_to_admin' | 'approved' | 'rejected' } = {
          'upcoming': 'pending',
          'active': 'sent_to_admin',
          'completed': 'approved'
        };
        
        activities.push({
          id: `competition-${competition.comp_id}`,
          title: `Competition: ${competition.name}`,
          description: `${competition.level} • ${competition.category} • ${new Date(competition.competition_date).toLocaleDateString()}`,
          studentName: competition.description?.substring(0, 50) || 'No description',
          category: 'Competition',
          status: statusMap[competition.status] || 'pending',
          submittedDate: competition.created_at,
        });
      });

      // Add courses
      coursesData.data?.forEach((course: any) => {
        const statusMap: { [key: string]: 'pending' | 'sent_to_admin' | 'approved' | 'rejected' } = {
          'draft': 'pending',
          'active': 'sent_to_admin',
          'published': 'approved'
        };
        
        activities.push({
          id: `course-${course.course_id}`,
          title: `Course: ${course.title}`,
          description: `${course.code} • ${course.enrollment_count || 0} enrolled`,
          studentName: course.description?.substring(0, 50) || 'No description',
          category: 'Course',
          status: statusMap[course.status] || 'pending',
          submittedDate: course.created_at,
        });
      });

      // Sort all activities by date and return requested limit
      return activities
        .sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime())
        .slice(0, limit);

    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  },

  async getSkillAnalytics(): Promise<SkillAnalytics> {
    try {
      const { educatorData, educatorType, assignedClassIds } = await getAuthenticatedEducator();

      // Check if educator has no class assignments (and is not admin)
      if (educatorType === 'school' && educatorData.role !== 'admin' && assignedClassIds.length === 0) {
        // Educators with no class assignments should see no students
        return {
          skillParticipation: [],
          skillDistribution: [],
        };
      }

      let studentsQuery = supabase
        .from('students')
        .select('id, user_id')
        .eq('is_deleted', false);

      // Apply filtering based on educator type and role
      if (educatorType === 'school') {
        // For school educators, check if they have class assignments
        if (educatorData.role === 'admin') {
          // School admins can see all students in their school
          studentsQuery = studentsQuery.eq('school_id', educatorData.school_id);
        } else if (assignedClassIds.length > 0) {
          // Regular educators can only see students in their assigned classes
          studentsQuery = studentsQuery
            .eq('school_id', educatorData.school_id)
            .in('school_class_id', assignedClassIds);
        }
      } else if (educatorType === 'college') {
        studentsQuery = studentsQuery.eq('college_id', educatorData.school_id);
      }

      const { data: studentsData } = await studentsQuery;

      const studentUserIds = studentsData?.map(s => s.user_id) || [];

      if (studentUserIds.length === 0) {
        return {
          skillParticipation: [],
          skillDistribution: [],
        };
      }

      // Get skill data from activities (projects, trainings, certificates) for students in this school
      const [projectsData, trainingsData, certificatesData] = await Promise.all([
        supabase
          .from('projects')
          .select('tech_stack')
          .in('student_id', studentUserIds)
          .not('tech_stack', 'is', null),
        supabase
          .from('trainings')
          .select('title, description')
          .in('student_id', studentUserIds),
        supabase
          .from('certificates')
          .select('title, description')
          .in('student_id', studentUserIds)
      ]);

      // Process skill participation from student activities
      const skillCounts: { [key: string]: number } = {};
      const categoryCounts: { [key: string]: number } = {};

      // Extract skills from project tech stacks
      projectsData.data?.forEach(project => {
        if (project.tech_stack && Array.isArray(project.tech_stack)) {
          project.tech_stack.forEach(tech => {
            if (tech) {
              skillCounts[tech] = (skillCounts[tech] || 0) + 1;
              categoryCounts['Technical Skills'] = (categoryCounts['Technical Skills'] || 0) + 1;
            }
          });
        }
      });

      // Extract skills from training titles
      trainingsData.data?.forEach(training => {
        if (training.title) {
          // Simple skill extraction from training titles
          const commonSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Java', 'C++', 'HTML', 'CSS'];
          commonSkills.forEach(skill => {
            if (training.title.toLowerCase().includes(skill.toLowerCase())) {
              skillCounts[skill] = (skillCounts[skill] || 0) + 1;
              categoryCounts['Technical Skills'] = (categoryCounts['Technical Skills'] || 0) + 1;
            }
          });
        }
      });

      // Extract skills from certificate titles
      certificatesData.data?.forEach(certificate => {
        if (certificate.title) {
          // Simple skill extraction from certificate titles
          const commonSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Java', 'C++', 'HTML', 'CSS'];
          commonSkills.forEach(skill => {
            if (certificate.title.toLowerCase().includes(skill.toLowerCase())) {
              skillCounts[skill] = (skillCounts[skill] || 0) + 1;
              categoryCounts['Technical Skills'] = (categoryCounts['Technical Skills'] || 0) + 1;
            }
          });
        }
      });

      // Add some soft skills based on activity participation
      const totalActivities = (projectsData.data?.length || 0) + (trainingsData.data?.length || 0) + (certificatesData.data?.length || 0);
      if (totalActivities > 0) {
        skillCounts['Communication'] = Math.floor(totalActivities * 0.3);
        skillCounts['Problem Solving'] = Math.floor(totalActivities * 0.4);
        skillCounts['Teamwork'] = Math.floor(totalActivities * 0.2);
        categoryCounts['Soft Skills'] = skillCounts['Communication'] + skillCounts['Problem Solving'] + skillCounts['Teamwork'];
      }

      const skillParticipation = Object.entries(skillCounts)
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const skillDistribution = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      return {
        skillParticipation: skillParticipation.length > 0 ? skillParticipation : [],
        skillDistribution: skillDistribution.length > 0 ? skillDistribution : [],
      };
    } catch (error) {
      console.error('Error fetching skill analytics:', error);
      return {
        skillParticipation: [],
        skillDistribution: [],
      };
    }
  },

  async getAnnouncements(): Promise<Announcement[]> {
    try {
      // For now, return static announcements since we don't have an announcements table
      // In a real implementation, you would fetch from an announcements table
      return [
        {
          id: '1',
          message: 'Submit project by Friday',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          message: 'School event on Monday',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
  },

  async addAnnouncement(message: string): Promise<boolean> {
    try {
      // For now, just return true since we don't have an announcements table
      // In a real implementation, you would insert into an announcements table
      console.log('Adding announcement:', message);
      return true;
    } catch (error) {
      console.error('Error adding announcement:', error);
      return false;
    }
  },
};