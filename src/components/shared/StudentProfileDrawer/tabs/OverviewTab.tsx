import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { Student } from '../types';
import {
  BriefcaseIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FireIcon,
  TrophyIcon,
  LinkIcon,
  MapPinIcon,
  UserGroupIcon,
  DocumentTextIcon,
  StarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

interface OverviewTabProps {
  student: Student;
}

// Helper component for section headers
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; count?: number }> = ({ icon, title, count }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <span className="text-primary-600">{icon}</span>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
    </div>
    {count !== undefined && (
      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{count} items</span>
    )}
  </div>
);

// Helper component for status badge
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    approved: 'bg-green-100 text-green-800',
    verified: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
    ongoing: 'bg-purple-100 text-purple-800',
    present: 'bg-green-100 text-green-800',
    absent: 'bg-red-100 text-red-800',
    late: 'bg-orange-100 text-orange-800',
    excused: 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
      {status || 'N/A'}
    </span>
  );
};

const OverviewTab: React.FC<OverviewTabProps> = ({ student }) => {
  // State for additional data
  const [experience, setExperience] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [skillPassport, setSkillPassport] = useState<any>(null);
  const [streaks, setStreaks] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  const [internships, setInternships] = useState<any[]>([]);
  const [clubCertificates, setClubCertificates] = useState<any[]>([]);
  const [competitionResults, setCompetitionResults] = useState<any[]>([]);
  const [skillBadges, setSkillBadges] = useState<any[]>([]);
  const [courseProgress, setCourseProgress] = useState<any[]>([]);
  const [quizProgress, setQuizProgress] = useState<any[]>([]);
  const [careerConversations, setCareerConversations] = useState<any[]>([]);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [profileViews, setProfileViews] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [placements, setPlacements] = useState<any[]>([]);
  const [pipelineStatus, setPipelineStatus] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student?.id) {
      fetchAllData();
    }
  }, [student?.id]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch Experience
      const { data: expData } = await supabase
        .from('experience')
        .select('*')
        .eq('student_id', student.id)
        .order('start_date', { ascending: false });
      setExperience(expData || []);

      // Fetch Trainings
      const { data: trainingsData } = await supabase
        .from('trainings')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });
      setTrainings(trainingsData || []);

      // Fetch Applied Jobs
      const { data: appliedData } = await supabase
        .from('applied_jobs')
        .select(`*, opportunity:opportunities (title, company_name, location, employment_type)`)
        .eq('student_id', student.user_id)
        .order('applied_at', { ascending: false })
        .limit(10);
      setAppliedJobs(appliedData || []);

      // Fetch Saved Jobs
      const { data: savedData } = await supabase
        .from('saved_jobs')
        .select(`*, opportunity:opportunities (title, company_name, location)`)
        .eq('student_id', student.user_id)
        .order('saved_at', { ascending: false })
        .limit(10);
      setSavedJobs(savedData || []);

      // Fetch Skill Passport
      const { data: passportData } = await supabase
        .from('skill_passports')
        .select('*')
        .eq('studentId', student.user_id)
        .single();
      setSkillPassport(passportData);

      // Fetch Streaks
      const { data: streakData } = await supabase
        .from('student_streaks')
        .select('*')
        .eq('student_id', student.id)
        .single();
      setStreaks(streakData);

      // Fetch Assignments
      const { data: assignmentsData } = await supabase
        .from('student_assignments')
        .select(`*, assignment:assignments (title, course_name, due_date, total_points)`)
        .eq('student_id', student.user_id)
        .order('assigned_date', { ascending: false })
        .limit(10);
      setAssignments(assignmentsData || []);

      // Fetch Attendance (for school students)
      if (student.school_id) {
        const { data: attendanceData } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('student_id', student.id)
          .order('date', { ascending: false })
          .limit(30);
        setAttendance(attendanceData || []);
      }

      // Fetch College Events
      if (student.college_id) {
        const { data: eventsData } = await supabase
          .from('college_event_registrations')
          .select(`*, event:college_events (title, event_type, start_date, end_date, venue)`)
          .eq('student_id', student.id)
          .order('registered_at', { ascending: false });
        setEvents(eventsData || []);
      }

      // Fetch Skills
      const { data: skillsData } = await supabase
        .from('skills')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });
      setSkills(skillsData || []);

      // Fetch Education
      const { data: educationData } = await supabase
        .from('education')
        .select('*')
        .eq('student_id', student.id)
        .order('year_of_passing', { ascending: false });
      setEducation(educationData || []);

      // Fetch Internships
      const { data: internshipsData } = await supabase
        .from('internships')
        .select('*')
        .eq('student_id', student.user_id)
        .order('start_date', { ascending: false });
      setInternships(internshipsData || []);

      // Fetch Club Certificates
      const { data: clubCertsData } = await supabase
        .from('club_certificates')
        .select('*, club:clubs(name), competition:competitions(name)')
        .eq('student_email', student.email)
        .order('issued_date', { ascending: false });
      setClubCertificates(clubCertsData || []);

      // Fetch Competition Results
      const { data: compResultsData } = await supabase
        .from('competition_results')
        .select('*, competition:competitions(name, level, category, competition_date)')
        .eq('student_email', student.email)
        .order('recorded_at', { ascending: false });
      setCompetitionResults(compResultsData || []);

      // Fetch Skill Badges
      const { data: badgesData } = await supabase
        .from('student_skill_badges')
        .select('*, badge:skill_badges(name, description, icon, category, level)')
        .eq('student_email', student.email)
        .order('earned_at', { ascending: false });
      setSkillBadges(badgesData || []);

      // Fetch Course Progress
      const { data: progressData } = await supabase
        .from('student_course_progress')
        .select('*, course:courses(title, code), lesson:lessons(title)')
        .eq('student_id', student.user_id)
        .order('last_accessed', { ascending: false })
        .limit(20);
      setCourseProgress(progressData || []);

      // Fetch Quiz Progress - Note: No FK relationship exists between student_quiz_progress and quizzes
      // So we need to fetch quiz details separately
      const { data: quizProgressData, error: quizProgressError } = await supabase
        .from('student_quiz_progress')
        .select('*')
        .eq('student_id', student.user_id)
        .order('started_at', { ascending: false })
        .limit(10);

      if (quizProgressError) {
        console.warn('Error fetching quiz progress:', quizProgressError);
        setQuizProgress([]);
      } else if (quizProgressData && quizProgressData.length > 0) {
        // Fetch quiz titles separately
        const quizIds = [...new Set(quizProgressData.map(q => q.quiz_id))];
        const { data: quizzesData } = await supabase
          .from('quizzes')
          .select('id, title')
          .in('id', quizIds);

        // Map quiz titles to progress data
        const quizMap = new Map(quizzesData?.map(q => [q.id, q.title]) || []);
        const enrichedQuizData = quizProgressData.map(progress => ({
          ...progress,
          quiz: { title: quizMap.get(progress.quiz_id) || 'Unknown Quiz' }
        }));
        setQuizProgress(enrichedQuizData);
      } else {
        setQuizProgress([]);
      }

      // Fetch Career AI Conversations
      const { data: careerData } = await supabase
        .from('career_ai_conversations')
        .select('id, title, created_at, updated_at')
        .eq('student_id', student.user_id)
        .order('updated_at', { ascending: false })
        .limit(10);
      setCareerConversations(careerData || []);

      // Fetch Search History
      const { data: searchData } = await supabase
        .from('search_history')
        .select('*')
        .eq('student_id', student.user_id)
        .order('last_searched_at', { ascending: false })
        .limit(10);
      setSearchHistory(searchData || []);

      // Fetch Profile Views
      const { data: viewsData } = await supabase
        .from('profile_views')
        .select('*')
        .eq('student_id', student.user_id)
        .order('viewed_at', { ascending: false })
        .limit(20);
      setProfileViews(viewsData || []);

      // Fetch Notifications
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', student.user_id)
        .order('created_at', { ascending: false })
        .limit(20);
      setNotifications(notifData || []);

      // Fetch Conversations
      const { data: convoData } = await supabase
        .from('conversations')
        .select('*')
        .eq('student_id', student.user_id)
        .order('last_message_at', { ascending: false })
        .limit(10);
      setConversations(convoData || []);

      // Fetch Placements
      const { data: placementsData } = await supabase
        .from('placements')
        .select('*, recruiter:recruiters(name)')
        .eq('studentId', student.user_id)
        .order('hiredDate', { ascending: false });
      setPlacements(placementsData || []);

      // Fetch Pipeline Status
      const { data: pipelineData } = await supabase
        .from('pipeline_candidates')
        .select('*, opportunity:opportunities(title, company_name)')
        .eq('student_id', student.user_id)
        .order('stage_changed_at', { ascending: false });
      setPipelineStatus(pipelineData || []);

      // Fetch Interviews
      const { data: interviewsData } = await supabase
        .from('interviews')
        .select('*')
        .eq('student_id', student.user_id)
        .order('date', { ascending: false });
      setInterviews(interviewsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate attendance stats
  const attendanceStats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    percentage: attendance.length > 0 
      ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100) 
      : 0
  };

  // Social links from student data
  const socialLinks = [
    { name: 'LinkedIn', url: student.linkedin_link || student.profile?.linkedin_link, icon: '🔗' },
    { name: 'GitHub', url: student.github_link, icon: '💻' },
    { name: 'Portfolio', url: student.portfolio_link, icon: '🌐' },
    { name: 'Twitter', url: student.twitter_link, icon: '🐦' },
    { name: 'YouTube', url: student.youtube_link, icon: '📺' },
    { name: 'Instagram', url: student.instagram_link, icon: '📷' },
    { name: 'Facebook', url: student.facebook_link, icon: '👤' },
  ].filter(link => link.url);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Loading student data...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-h-[calc(100vh-300px)] overflow-y-auto">
      {/* Profile Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader icon={<UserGroupIcon className="h-5 w-5" />} title="Profile Summary" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs mb-1">Full Name</span>
            <span className="font-medium text-gray-900">{student.name || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs mb-1">Email</span>
            <span className="font-medium text-gray-900 break-all">{student.email || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs mb-1">Contact</span>
            <span className="font-medium text-gray-900">{student.contact_number || student.contactNumber || student.phone || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs mb-1">{student.school_id ? 'School' : 'College'}</span>
            <span className="font-medium text-gray-900">{student.college_school_name || student.college || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs mb-1">{student.school_id ? 'Grade' : 'Degree'}</span>
            <span className="font-medium text-gray-900">{student.grade || student.branch_field || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs mb-1">Section</span>
            <span className="font-medium text-gray-900">{student.section || 'N/A'}</span>
          </div>
          {student.currentCgpa && (
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs mb-1">CGPA</span>
              <span className="font-medium text-gray-900">{student.currentCgpa}</span>
            </div>
          )}
          {student.date_of_birth && (
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs mb-1">Date of Birth</span>
              <span className="font-medium text-gray-900">{new Date(student.date_of_birth).toLocaleDateString()}</span>
            </div>
          )}
          {student.gender && (
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs mb-1">Gender</span>
              <span className="font-medium text-gray-900">{student.gender}</span>
            </div>
          )}
          {student.category && (
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs mb-1">Category</span>
              <span className="font-medium text-gray-900">{student.category}</span>
            </div>
          )}
          {student.bloodGroup && (
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs mb-1">Blood Group</span>
              <span className="font-medium text-gray-900">{student.bloodGroup}</span>
            </div>
          )}
          {student.roll_number && (
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs mb-1">Roll Number</span>
              <span className="font-medium text-gray-900">{student.roll_number}</span>
            </div>
          )}
        </div>
      </div>

      {/* Learning Streaks */}
      {streaks && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200 p-4">
          <SectionHeader icon={<FireIcon className="h-5 w-5 text-orange-500" />} title="Learning Streaks" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-orange-600">{streaks.current_streak || 0}</div>
              <div className="text-xs text-gray-500">Current Streak</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-yellow-600">{streaks.longest_streak || 0}</div>
              <div className="text-xs text-gray-500">Longest Streak</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-sm font-medium text-gray-700">
                {streaks.last_activity_date ? new Date(streaks.last_activity_date).toLocaleDateString() : 'N/A'}
              </div>
              <div className="text-xs text-gray-500">Last Activity</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              {streaks.streak_completed_today ? (
                <CheckCircleIcon className="h-6 w-6 text-green-500 mx-auto" />
              ) : (
                <XCircleIcon className="h-6 w-6 text-gray-400 mx-auto" />
              )}
              <div className="text-xs text-gray-500">Today's Streak</div>
            </div>
          </div>
        </div>
      )}

      {/* Skill Passport */}
      {skillPassport && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-4">
          <SectionHeader icon={<TrophyIcon className="h-5 w-5 text-purple-500" />} title="Skill Passport" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <StatusBadge status={skillPassport.status || 'pending'} />
              <div className="text-xs text-gray-500 mt-1">Status</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-lg font-bold text-purple-600">{skillPassport.nsqfLevel || 'N/A'}</div>
              <div className="text-xs text-gray-500">NSQF Level</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              {skillPassport.aiVerification ? (
                <CheckCircleIcon className="h-6 w-6 text-green-500 mx-auto" />
              ) : (
                <XCircleIcon className="h-6 w-6 text-gray-400 mx-auto" />
              )}
              <div className="text-xs text-gray-500">AI Verified</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-lg font-bold text-indigo-600">{skillPassport.skills?.length || 0}</div>
              <div className="text-xs text-gray-500">Skills</div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Summary (School Students) */}
      {student.school_id && attendance.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<CalendarIcon className="h-5 w-5" />} title="Attendance Summary" count={attendanceStats.total} />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">{attendanceStats.present}</div>
              <div className="text-xs text-gray-500">Present</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-xl font-bold text-red-600">{attendanceStats.absent}</div>
              <div className="text-xs text-gray-500">Absent</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-xl font-bold text-orange-600">{attendanceStats.late}</div>
              <div className="text-xs text-gray-500">Late</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{attendanceStats.percentage}%</div>
              <div className="text-xs text-gray-500">Attendance %</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-600">{attendanceStats.total}</div>
              <div className="text-xs text-gray-500">Total Days</div>
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-2 py-1 text-left">Date</th>
                  <th className="px-2 py-1 text-left">Status</th>
                  <th className="px-2 py-1 text-left">Time In</th>
                  <th className="px-2 py-1 text-left">Time Out</th>
                </tr>
              </thead>
              <tbody>
                {attendance.slice(0, 10).map((record, idx) => (
                  <tr key={record.id || idx} className="border-t">
                    <td className="px-2 py-1">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="px-2 py-1"><StatusBadge status={record.status} /></td>
                    <td className="px-2 py-1">{record.time_in || '-'}</td>
                    <td className="px-2 py-1">{record.time_out || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<StarIcon className="h-5 w-5" />} title="Skills" count={skills.length} />
          <div className="flex flex-wrap gap-2">
            {skills.filter(s => s.enabled !== false).map((skill, idx) => (
              <span
                key={skill.id || idx}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                  skill.type === 'technical' 
                    ? 'bg-blue-100 text-blue-800 border-blue-200' 
                    : 'bg-purple-100 text-purple-800 border-purple-200'
                }`}
              >
                {skill.name}
                {skill.level && <span className="ml-1 text-xs opacity-75">({skill.level}/5)</span>}
                {skill.verified && <CheckCircleIcon className="h-3 w-3 ml-1 text-green-500" />}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<AcademicCapIcon className="h-5 w-5" />} title="Education" count={education.length} />
          <div className="space-y-3">
            {education.map((edu, idx) => (
              <div key={edu.id || idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{edu.degree || edu.level}</div>
                  <div className="text-sm text-gray-600">{edu.university || edu.department}</div>
                  <div className="text-xs text-gray-500">Year: {edu.year_of_passing} | CGPA: {edu.cgpa || 'N/A'}</div>
                </div>
                <StatusBadge status={edu.approval_status || edu.status || 'pending'} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<BriefcaseIcon className="h-5 w-5" />} title="Experience" count={experience.length} />
          <div className="space-y-3">
            {experience.map((exp, idx) => (
              <div key={exp.id || idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{exp.role}</div>
                  <div className="text-sm text-gray-600">{exp.organization}</div>
                  <div className="text-xs text-gray-500">
                    {exp.start_date && new Date(exp.start_date).toLocaleDateString()} - 
                    {exp.end_date ? new Date(exp.end_date).toLocaleDateString() : 'Present'}
                    {exp.duration && ` (${exp.duration})`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {exp.verified && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
                  <StatusBadge status={exp.approval_status || 'pending'} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trainings */}
      {trainings.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<BookOpenIcon className="h-5 w-5" />} title="Trainings" count={trainings.length} />
          <div className="space-y-3">
            {trainings.map((training, idx) => (
              <div key={training.id || idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{training.title}</div>
                  <div className="text-sm text-gray-600">{training.organization}</div>
                  <div className="text-xs text-gray-500">
                    {training.start_date && new Date(training.start_date).toLocaleDateString()} - 
                    {training.end_date ? new Date(training.end_date).toLocaleDateString() : 'Ongoing'}
                  </div>
                  {training.total_modules > 0 && (
                    <div className="mt-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-primary-600 h-1.5 rounded-full" 
                            style={{ width: `${(training.completed_modules / training.total_modules) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{training.completed_modules}/{training.total_modules}</span>
                      </div>
                    </div>
                  )}
                </div>
                <StatusBadge status={training.status || training.approval_status || 'ongoing'} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events (College Students) */}
      {events.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<CalendarIcon className="h-5 w-5" />} title="Events" count={events.length} />
          <div className="space-y-3">
            {events.map((evt, idx) => (
              <div key={evt.id || idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{evt.event?.title || 'Event'}</div>
                  <div className="text-sm text-gray-600 capitalize">{evt.event?.event_type}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <CalendarIcon className="h-3 w-3" />
                    {evt.event?.start_date && new Date(evt.event.start_date).toLocaleDateString()}
                    {evt.event?.venue && (
                      <>
                        <MapPinIcon className="h-3 w-3 ml-2" />
                        {evt.event.venue}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {evt.attended ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Attended</span>
                  ) : (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Registered</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assignments */}
      {assignments.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<DocumentTextIcon className="h-5 w-5" />} title="Assignments" count={assignments.length} />
          <div className="space-y-3">
            {assignments.slice(0, 5).map((assignment, idx) => (
              <div key={assignment.id || idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{assignment.assignment?.title || 'Assignment'}</div>
                  <div className="text-sm text-gray-600">{assignment.assignment?.course_name}</div>
                  <div className="text-xs text-gray-500">
                    Due: {assignment.assignment?.due_date ? new Date(assignment.assignment.due_date).toLocaleDateString() : 'N/A'}
                    {assignment.grade_received !== null && (
                      <span className="ml-2">| Grade: {assignment.grade_received}/{assignment.assignment?.total_points || 100}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {assignment.is_late && <span className="text-xs text-red-600">Late</span>}
                  <StatusBadge status={assignment.status || 'pending'} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Applied Jobs */}
      {appliedJobs.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<BriefcaseIcon className="h-5 w-5" />} title="Applied Jobs" count={appliedJobs.length} />
          <div className="space-y-3">
            {appliedJobs.slice(0, 5).map((job, idx) => (
              <div key={job.id || idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{job.opportunity?.title || 'Job'}</div>
                  <div className="text-sm text-gray-600">{job.opportunity?.company_name}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <MapPinIcon className="h-3 w-3" />
                    {job.opportunity?.location || 'N/A'}
                    <span className="ml-2">{job.opportunity?.employment_type}</span>
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={job.application_status || 'applied'} />
                  <div className="text-xs text-gray-500 mt-1">
                    {job.applied_at && new Date(job.applied_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Jobs */}
      {savedJobs.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<StarIcon className="h-5 w-5" />} title="Saved Jobs" count={savedJobs.length} />
          <div className="space-y-2">
            {savedJobs.slice(0, 5).map((job, idx) => (
              <div key={job.id || idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <div className="font-medium text-gray-900 text-sm">{job.opportunity?.title || 'Job'}</div>
                  <div className="text-xs text-gray-600">{job.opportunity?.company_name} • {job.opportunity?.location}</div>
                </div>
                <div className="text-xs text-gray-500">
                  {job.saved_at && new Date(job.saved_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Internships */}
      {internships.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<BriefcaseIcon className="h-5 w-5" />} title="Internships" count={internships.length} />
          <div className="space-y-3">
            {internships.map((intern, idx) => (
              <div key={intern.id || idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{intern.role}</div>
                  <div className="text-sm text-gray-600">{intern.company_name}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                    <MapPinIcon className="h-3 w-3" />
                    {intern.location || 'N/A'}
                    <span className="ml-2">{intern.internship_type}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {intern.start_date && new Date(intern.start_date).toLocaleDateString()} - 
                    {intern.end_date ? new Date(intern.end_date).toLocaleDateString() : 'Present'}
                    {intern.duration && ` (${intern.duration})`}
                  </div>
                  {intern.stipend && <div className="text-xs text-green-600 mt-1">Stipend: {intern.stipend}</div>}
                </div>
                <StatusBadge status={intern.approval_status || 'pending'} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Placements */}
      {placements.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4">
          <SectionHeader icon={<TrophyIcon className="h-5 w-5 text-green-600" />} title="Placements" count={placements.length} />
          <div className="space-y-3">
            {placements.map((placement, idx) => (
              <div key={placement.id || idx} className="flex items-start justify-between p-3 bg-white rounded-lg shadow-sm">
                <div>
                  <div className="font-medium text-gray-900">{placement.jobTitle}</div>
                  <div className="text-sm text-gray-600">{placement.recruiter?.name || 'Company'}</div>
                  {placement.salaryOffered && (
                    <div className="text-sm text-green-600 font-medium mt-1">₹{Number(placement.salaryOffered).toLocaleString()} LPA</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    Hired: {placement.hiredDate ? new Date(placement.hiredDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <StatusBadge status={placement.placementStatus || 'hired'} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competition Results */}
      {competitionResults.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 p-4">
          <SectionHeader icon={<TrophyIcon className="h-5 w-5 text-yellow-600" />} title="Competition Results" count={competitionResults.length} />
          <div className="space-y-3">
            {competitionResults.map((result, idx) => (
              <div key={result.result_id || idx} className="flex items-start justify-between p-3 bg-white rounded-lg shadow-sm">
                <div>
                  <div className="font-medium text-gray-900">{result.competition?.name || 'Competition'}</div>
                  <div className="text-sm text-gray-600 capitalize">{result.competition?.level} • {result.competition?.category}</div>
                  <div className="flex items-center gap-2 mt-2">
                    {result.rank && (
                      <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        🏆 Rank #{result.rank}
                      </span>
                    )}
                    {result.award && (
                      <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                        🎖️ {result.award}
                      </span>
                    )}
                    {result.score && (
                      <span className="text-xs text-gray-500">Score: {result.score}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {result.certificate_issued && (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {result.competition?.competition_date && new Date(result.competition.competition_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill Badges */}
      {skillBadges.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-4">
          <SectionHeader icon={<StarIcon className="h-5 w-5 text-indigo-600" />} title="Skill Badges" count={skillBadges.length} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {skillBadges.map((badge, idx) => (
              <div key={badge.id || idx} className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm text-center">
                <div className="text-2xl mb-1">{badge.badge?.icon || '🏅'}</div>
                <div className="font-medium text-gray-900 text-sm">{badge.badge?.name || 'Badge'}</div>
                <div className="text-xs text-gray-500 capitalize">{badge.badge?.level || 'bronze'}</div>
                <div className="mt-2">
                  <StatusBadge status={badge.status || 'in_progress'} />
                </div>
                {badge.earned_at && (
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(badge.earned_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Club Certificates */}
      {clubCertificates.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<AcademicCapIcon className="h-5 w-5" />} title="Club Certificates" count={clubCertificates.length} />
          <div className="space-y-3">
            {clubCertificates.map((cert, idx) => (
              <div key={cert.certificate_id || idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{cert.title}</div>
                  <div className="text-sm text-gray-600">{cert.issuer}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Type: {cert.certificate_type?.replace('_', ' ')} • Issued: {cert.issued_date && new Date(cert.issued_date).toLocaleDateString()}
                  </div>
                  {cert.club?.name && <div className="text-xs text-blue-600 mt-1">Club: {cert.club.name}</div>}
                  {cert.competition?.name && <div className="text-xs text-purple-600 mt-1">Competition: {cert.competition.name}</div>}
                </div>
                <div className="flex items-center gap-2">
                  {cert.is_verified && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
                  {cert.certificate_pdf_url && (
                    <a href={cert.certificate_pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">
                      View
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline Status */}
      {pipelineStatus.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<ChartBarIcon className="h-5 w-5" />} title="Recruitment Pipeline" count={pipelineStatus.length} />
          <div className="space-y-3">
            {pipelineStatus.map((pipeline, idx) => (
              <div key={pipeline.id || idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{pipeline.opportunity?.title || pipeline.candidate_name}</div>
                  <div className="text-sm text-gray-600">{pipeline.opportunity?.company_name}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      pipeline.stage === 'hired' ? 'bg-green-100 text-green-800' :
                      pipeline.stage === 'offer' ? 'bg-blue-100 text-blue-800' :
                      pipeline.stage === 'interview' ? 'bg-purple-100 text-purple-800' :
                      pipeline.stage === 'screening' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      Stage: {pipeline.stage}
                    </span>
                    {pipeline.recruiter_rating && (
                      <span className="text-xs text-gray-500">Rating: {pipeline.recruiter_rating}/5</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={pipeline.status || 'active'} />
                  <div className="text-xs text-gray-500 mt-1">
                    {pipeline.stage_changed_at && new Date(pipeline.stage_changed_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interviews */}
      {interviews.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<CalendarIcon className="h-5 w-5" />} title="Interview History" count={interviews.length} />
          <div className="space-y-3">
            {interviews.map((interview, idx) => (
              <div key={interview.id || idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{interview.job_title}</div>
                  <div className="text-sm text-gray-600">Interviewer: {interview.interviewer}</div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                    <CalendarIcon className="h-3 w-3" />
                    {interview.date && new Date(interview.date).toLocaleString()}
                    <span className="ml-2 capitalize">{interview.type}</span>
                    {interview.meeting_type && <span className="ml-2">({interview.meeting_type})</span>}
                  </div>
                  {interview.duration && <div className="text-xs text-gray-500">Duration: {interview.duration} mins</div>}
                </div>
                <div className="text-right">
                  <StatusBadge status={interview.status || 'scheduled'} />
                  {interview.scorecard?.overall_rating && (
                    <div className="text-xs text-yellow-600 mt-1">⭐ {interview.scorecard.overall_rating}/5</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Progress */}
      {courseProgress.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<BookOpenIcon className="h-5 w-5" />} title="Course Progress" count={courseProgress.length} />
          <div className="space-y-3">
            {courseProgress.slice(0, 5).map((progress, idx) => (
              <div key={progress.id || idx} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{progress.course?.title || 'Course'}</div>
                    <div className="text-xs text-gray-600">{progress.lesson?.title || 'Lesson'}</div>
                  </div>
                  <StatusBadge status={progress.status || 'not_started'} />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-primary-600 h-1.5 rounded-full" 
                      style={{ width: `${progress.video_completed ? 100 : (progress.scroll_position_percent || 0)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {Math.round(progress.time_spent_seconds / 60) || 0} mins
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz Progress */}
      {quizProgress.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<DocumentTextIcon className="h-5 w-5" />} title="Quiz Progress" count={quizProgress.length} />
          <div className="space-y-2">
            {quizProgress.map((quiz, idx) => (
              <div key={quiz.id || idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <div className="font-medium text-gray-900 text-sm">{quiz.quiz?.title || 'Quiz'}</div>
                  <div className="text-xs text-gray-500">
                    Score: {quiz.correct_answers || 0}/{quiz.total_questions || 0} 
                    ({quiz.score_percentage || 0}%)
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {quiz.passed && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
                  <StatusBadge status={quiz.status || 'in_progress'} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Career AI Conversations */}
      {careerConversations.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<ChatBubbleLeftRightIcon className="h-5 w-5" />} title="Career AI Conversations" count={careerConversations.length} />
          <div className="space-y-2">
            {careerConversations.map((convo, idx) => (
              <div key={convo.id || idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <div className="font-medium text-gray-900 text-sm">{convo.title || 'Conversation'}</div>
                  <div className="text-xs text-gray-500">
                    {convo.updated_at && new Date(convo.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages/Conversations */}
      {conversations.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<ChatBubbleLeftRightIcon className="h-5 w-5" />} title="Messages" count={conversations.length} />
          <div className="space-y-2">
            {conversations.slice(0, 5).map((convo, idx) => (
              <div key={convo.id || idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">{convo.subject || 'Conversation'}</div>
                  <div className="text-xs text-gray-500 truncate">{convo.last_message_preview || 'No messages'}</div>
                </div>
                <div className="text-right">
                  {convo.student_unread_count > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs rounded-full">
                      {convo.student_unread_count}
                    </span>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {convo.last_message_at && new Date(convo.last_message_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile Views */}
      {profileViews.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<EyeIcon className="h-5 w-5" />} title="Profile Views" count={profileViews.length} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{profileViews.length}</div>
              <div className="text-xs text-gray-500">Total Views</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">
                {profileViews.filter(v => v.viewer_type === 'recruiter').length}
              </div>
              <div className="text-xs text-gray-500">By Recruiters</div>
            </div>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {profileViews.slice(0, 10).map((view, idx) => (
              <div key={view.id || idx} className="flex items-center justify-between text-xs p-1">
                <span className="capitalize text-gray-600">{view.viewer_type}</span>
                <span className="text-gray-500">{view.viewed_at && new Date(view.viewed_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<MagnifyingGlassIcon className="h-5 w-5" />} title="Job Search History" count={searchHistory.length} />
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((search, idx) => (
              <span key={search.id || idx} className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {search.search_term}
                {search.search_count > 1 && (
                  <span className="ml-1 text-xs text-gray-500">({search.search_count})</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<BellIcon className="h-5 w-5" />} title="Recent Notifications" count={notifications.filter(n => !n.read).length} />
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {notifications.slice(0, 10).map((notif, idx) => (
              <div key={notif.id || idx} className={`p-2 rounded ${notif.read ? 'bg-gray-50' : 'bg-blue-50 border-l-2 border-blue-500'}`}>
                <div className="font-medium text-gray-900 text-sm">{notif.title}</div>
                <div className="text-xs text-gray-600 truncate">{notif.message}</div>
                <div className="text-xs text-gray-400 mt-1">{notif.created_at && new Date(notif.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Links */}
      {socialLinks.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<LinkIcon className="h-5 w-5" />} title="Social Links" count={socialLinks.length} />
          <div className="flex flex-wrap gap-2">
            {socialLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
              >
                <span className="mr-2">{link.icon}</span>
                {link.name}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Hobbies & Interests */}
      {((student.hobbies && student.hobbies.length > 0) || (student.interests && student.interests.length > 0)) && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<StarIcon className="h-5 w-5" />} title="Hobbies & Interests" />
          <div className="space-y-3">
            {student.hobbies && student.hobbies.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-2">Hobbies</div>
                <div className="flex flex-wrap gap-2">
                  {student.hobbies.map((hobby: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
                      {hobby}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {student.interests && student.interests.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-2">Interests</div>
                <div className="flex flex-wrap gap-2">
                  {student.interests.map((interest: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Languages */}
      {student.languages && student.languages.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<UserGroupIcon className="h-5 w-5" />} title="Languages" count={student.languages.length} />
          <div className="flex flex-wrap gap-2">
            {student.languages.map((lang: any, idx: number) => (
              <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                {typeof lang === 'string' ? lang : `${lang.name} (${lang.proficiency || 'Basic'})`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Guardian Information */}
      {(student.guardianName || student.guardianPhone || student.guardianEmail) && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<UserGroupIcon className="h-5 w-5" />} title="Guardian Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {student.guardianName && (
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">Guardian Name</span>
                <span className="font-medium text-gray-900">{student.guardianName}</span>
              </div>
            )}
            {student.guardianPhone && (
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">Guardian Phone</span>
                <span className="font-medium text-gray-900">{student.guardianPhone}</span>
              </div>
            )}
            {student.guardianEmail && (
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">Guardian Email</span>
                <span className="font-medium text-gray-900">{student.guardianEmail}</span>
              </div>
            )}
            {student.guardianRelation && (
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">Relation</span>
                <span className="font-medium text-gray-900">{student.guardianRelation}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Address Information */}
      {(student.address || student.city || student.state) && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<MapPinIcon className="h-5 w-5" />} title="Address Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {student.address && (
              <div className="flex flex-col sm:col-span-2">
                <span className="text-gray-500 text-xs mb-1">Address</span>
                <span className="font-medium text-gray-900">{student.address}</span>
              </div>
            )}
            {student.city && (
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">City</span>
                <span className="font-medium text-gray-900">{student.city}</span>
              </div>
            )}
            {student.state && (
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">State</span>
                <span className="font-medium text-gray-900">{student.state}</span>
              </div>
            )}
            {student.country && (
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">Country</span>
                <span className="font-medium text-gray-900">{student.country}</span>
              </div>
            )}
            {student.pincode && (
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">Pincode</span>
                <span className="font-medium text-gray-900">{student.pincode}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bio */}
      {(student.bio || student.profile?.bio) && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader icon={<DocumentTextIcon className="h-5 w-5" />} title="Bio" />
          <p className="text-sm text-gray-700 leading-relaxed">{student.bio || student.profile?.bio}</p>
        </div>
      )}

      {/* Application Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader icon={<ClockIcon className="h-5 w-5" />} title="Application Timeline" />
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="flex flex-col items-center mr-4">
              <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
              <div className="w-0.5 h-8 bg-gray-200 my-1"></div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Application Submitted</p>
              <p className="text-xs text-gray-500">
                {student.applied_date ? new Date(student.applied_date).toLocaleDateString() : 
                 student.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex flex-col items-center mr-4">
              <div className={`w-3 h-3 ${
                student.approval_status === 'approved' || student.approval_status === 'verified' ? 'bg-green-600' : 
                student.approval_status === 'rejected' ? 'bg-red-600' : 'bg-gray-300'
              } rounded-full`}></div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Application Decision</p>
              <p className="text-xs text-gray-500">
                Status: {(student.approval_status || 'PENDING').toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Career & Employment Data Summary - Always show with empty states */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
        <SectionHeader icon={<BriefcaseIcon className="h-5 w-5 text-blue-600" />} title="Career & Employment Data" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{internships.length}</div>
            <div className="text-xs text-gray-500">Internships</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-green-600">{placements.length}</div>
            <div className="text-xs text-gray-500">Placements</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">{competitionResults.length}</div>
            <div className="text-xs text-gray-500">Competition Results</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{skillBadges.length}</div>
            <div className="text-xs text-gray-500">Skill Badges</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-indigo-600">{clubCertificates.length}</div>
            <div className="text-xs text-gray-500">Club Certificates</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-cyan-600">{courseProgress.length}</div>
            <div className="text-xs text-gray-500">Course Progress</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-teal-600">{quizProgress.length}</div>
            <div className="text-xs text-gray-500">Quiz Progress</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-orange-600">{pipelineStatus.length}</div>
            <div className="text-xs text-gray-500">Pipeline Status</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-pink-600">{interviews.length}</div>
            <div className="text-xs text-gray-500">Interviews</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-violet-600">{careerConversations.length}</div>
            <div className="text-xs text-gray-500">Career AI Chats</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-rose-600">{profileViews.length}</div>
            <div className="text-xs text-gray-500">Profile Views</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-amber-600">{notifications.filter(n => !n.read).length}</div>
            <div className="text-xs text-gray-500">Unread Notifications</div>
          </div>
        </div>
        {internships.length === 0 && placements.length === 0 && competitionResults.length === 0 && 
         skillBadges.length === 0 && pipelineStatus.length === 0 && interviews.length === 0 && (
          <p className="text-sm text-gray-500 italic mt-3 text-center">
            No career data available yet. Data will appear here as the student progresses.
          </p>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;
