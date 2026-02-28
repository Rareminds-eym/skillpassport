import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, MapPin, Clock, Award, Star, Target, BookOpen, Activity } from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';
import { isCollegeStudent as checkIsCollegeStudent, isSchoolStudent as checkIsSchoolStudent } from '../../../../utils/studentType';

interface Club {
  club_id: string;
  name: string;
  category: 'arts' | 'sports' | 'robotics' | 'science' | 'literature';
  description: string;
  meeting_day?: string;
  meeting_time?: string;
  location?: string;
  mentor_name?: string;
  is_active: boolean;
  created_at: string;
}

interface ClubMembership {
  membership_id: string;
  club_id: string;
  student_email: string;
  enrolled_at: string;
  status: 'active' | 'withdrawn' | 'suspended';
  total_sessions_attended: number;
  total_sessions_held: number;
  attendance_percentage: number;
  performance_score: number;
}

interface Competition {
  comp_id: string;
  name: string;
  description?: string;
  level: 'intraschool' | 'interschool' | 'district' | 'state' | 'national' | 'international';
  category?: string;
  competition_date: string;
  venue?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
}

interface CompetitionRegistration {
  registration_id: string;
  comp_id: string;
  student_email: string;
  team_name?: string;
  team_members?: any;
  registration_date: string;
  status: 'registered' | 'confirmed' | 'withdrawn' | 'disqualified';
  notes?: string;
}

interface CompetitionResult {
  result_id: string;
  comp_id: string;
  student_email: string;
  rank?: number;
  score?: number;
  award?: string;
  category?: string;
  performance_notes?: string;
  certificate_issued: boolean;
}

interface CollegeEvent {
  id: string;
  college_id: string;
  title: string;
  description?: string;
  event_type: 'seminar' | 'workshop' | 'cultural' | 'sports' | 'placement' | 'guest_lecture' | 'orientation' | 'other';
  start_date: string;
  end_date: string;
  venue?: string;
  capacity?: number;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  created_at: string;
}

interface EventRegistration {
  id: string;
  event_id: string;
  student_id: string;
  registered_at: string;
  attended: boolean;
}

interface ClubsCompetitionsTabProps {
  student: any;
  loading: boolean;
}

const ClubsCompetitionsTab: React.FC<ClubsCompetitionsTabProps> = ({ student, loading }) => {
  // Use centralized student type detection
  const isSchoolStudent = checkIsSchoolStudent(student);
  const isCollegeStudent = checkIsCollegeStudent(student);

  const [activeSection, setActiveSection] = useState<'clubs' | 'competitions' | 'events'>(
    isCollegeStudent ? 'events' : 'clubs'
  );
  const [clubMemberships, setClubMemberships] = useState<(ClubMembership & { club: Club })[]>([]);
  const [competitionRegistrations, setCompetitionRegistrations] = useState<(CompetitionRegistration & { competition: Competition })[]>([]);
  const [competitionResults, setCompetitionResults] = useState<(CompetitionResult & { competition: Competition })[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<(EventRegistration & { event: CollegeEvent })[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (student?.email || student?.id) {
      fetchStudentActivities();
    }
  }, [student?.email, student?.id]);

  const fetchStudentActivities = async () => {
    try {
      setDataLoading(true);

      if (isSchoolStudent) {
        await Promise.all([
          fetchClubMemberships(),
          fetchCompetitionData()
        ]);
      }

      if (isCollegeStudent) {
        await fetchEventRegistrations();
      }
    } catch (error) {
      console.error('Error fetching student activities:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchClubMemberships = async () => {
    try {
      const { data, error } = await supabase
        .from('club_memberships')
        .select(`
          *,
          club:clubs(*)
        `)
        .eq('student_email', student.email)
        .eq('status', 'active');

      if (error) throw error;
      setClubMemberships(data || []);
    } catch (error) {
      console.error('Error fetching club memberships:', error);
    }
  };

  const fetchCompetitionData = async () => {
    try {
      // Fetch registrations
      const { data: registrations, error: regError } = await supabase
        .from('competition_registrations')
        .select(`
          *,
          competition:competitions(*)
        `)
        .eq('student_email', student.email);

      if (regError) throw regError;
      setCompetitionRegistrations(registrations || []);

      // Fetch results
      const { data: results, error: resultError } = await supabase
        .from('competition_results')
        .select(`
          *,
          competition:competitions(*)
        `)
        .eq('student_email', student.email);

      if (resultError) throw resultError;
      setCompetitionResults(results || []);
    } catch (error) {
      console.error('Error fetching competition data:', error);
    }
  };

  const fetchEventRegistrations = async () => {
    try {
      let studentId = student.id;

      // If we don't have student.id but have email, try to find the student ID
      if (!studentId && student.email) {
        // Try students table first
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('id')
          .eq('email', student.email)
          .single();

        if (studentData?.id) {
          studentId = studentData.id;
        } else {
          // If not found in students table, try college_students table
          const { data: collegeStudentData, error: collegeStudentError } = await supabase
            .from('college_students')
            .select('id')
            .eq('email', student.email)
            .single();

          if (collegeStudentData?.id) {
            studentId = collegeStudentData.id;
          }
        }
      }

      if (!studentId) {
        return;
      }

      const { data, error } = await supabase
        .from('college_event_registrations')
        .select(`
          *,
          event:college_events(*)
        `)
        .eq('student_id', studentId);

      if (error) {
        console.error('Error in event registrations query:', error);
        return;
      }

      setEventRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching event registrations:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'arts': return <BookOpen className="h-4 w-4" />;
      case 'sports': return <Trophy className="h-4 w-4" />;
      case 'robotics': return <Activity className="h-4 w-4" />;
      case 'science': return <Target className="h-4 w-4" />;
      case 'literature': return <BookOpen className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'intraschool': return 'bg-blue-100 text-blue-800';
      case 'interschool': return 'bg-green-100 text-green-800';
      case 'district': return 'bg-yellow-100 text-yellow-800';
      case 'state': return 'bg-orange-100 text-orange-800';
      case 'national': return 'bg-red-100 text-red-800';
      case 'international': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'seminar': return <BookOpen className="h-4 w-4" />;
      case 'workshop': return <Activity className="h-4 w-4" />;
      case 'cultural': return <Star className="h-4 w-4" />;
      case 'sports': return <Trophy className="h-4 w-4" />;
      case 'placement': return <Target className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-100 rounded w-1/3"></div>
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-gray-100 rounded-full w-24"></div>
            ))}
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-50 h-24 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const EmptyState = ({ title, description, icon: Icon }: { title: string; description: string; icon: any }) => (
    <div className="text-center py-16">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-50 mb-4">
        <Icon className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 max-w-sm mx-auto">{description}</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <Users className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {isSchoolStudent ? 'Clubs & Competitions' : 'Events & Activities'}
          </h3>
          <p className="text-sm text-gray-500">
            {isSchoolStudent
              ? 'Student participation in school activities'
              : 'Student participation in college events'
            }
          </p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 p-1 bg-gray-50 rounded-lg">
        {isSchoolStudent && (
          <>
            <button
              onClick={() => setActiveSection('clubs')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeSection === 'clubs'
                  ? 'bg-white text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Clubs ({clubMemberships.length})
            </button>
            <button
              onClick={() => setActiveSection('competitions')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeSection === 'competitions'
                  ? 'bg-white text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Competitions ({competitionRegistrations.length + competitionResults.length})
            </button>
          </>
        )}
        {isCollegeStudent && (
          <button
            onClick={() => setActiveSection('events')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeSection === 'events'
                ? 'bg-white text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Events ({eventRegistrations.length})
          </button>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Clubs Section */}
        {activeSection === 'clubs' && isSchoolStudent && (
          <>
            {clubMemberships.length === 0 ? (
              <EmptyState
                title="No club memberships"
                description="This student is not currently enrolled in any clubs."
                icon={Users}
              />
            ) : (
              <div className="space-y-3">
                {clubMemberships.map((membership) => (
                  <div key={membership.membership_id} className="bg-white border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${membership.club.category === 'sports' ? 'bg-green-50' :
                            membership.club.category === 'arts' ? 'bg-purple-50' :
                              membership.club.category === 'science' ? 'bg-blue-50' :
                                membership.club.category === 'robotics' ? 'bg-orange-50' :
                                  'bg-gray-50'
                          }`}>
                          {getCategoryIcon(membership.club.category)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{membership.club.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${membership.club.category === 'sports' ? 'bg-green-100 text-green-700' :
                                membership.club.category === 'arts' ? 'bg-purple-100 text-purple-700' :
                                  membership.club.category === 'science' ? 'bg-blue-100 text-blue-700' :
                                    membership.club.category === 'robotics' ? 'bg-orange-100 text-orange-700' :
                                      'bg-gray-100 text-gray-700'
                              }`}>
                              {membership.club.category}
                            </span>
                            <span className="text-xs text-gray-500">
                              Joined {new Date(membership.enrolled_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${membership.status === 'active' ? 'bg-green-50 text-green-700' :
                          membership.status === 'suspended' ? 'bg-red-50 text-red-700' :
                            'bg-gray-50 text-gray-700'
                        }`}>
                        {membership.status}
                      </span>
                    </div>

                    {membership.club.description && (
                      <p className="text-sm text-gray-600 mb-3">{membership.club.description}</p>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        {membership.club.meeting_day && membership.club.meeting_time && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{membership.club.meeting_day} at {membership.club.meeting_time}</span>
                          </div>
                        )}
                        {membership.club.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{membership.club.location}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Attendance</span>
                          <span className="font-medium text-gray-900">
                            {membership.attendance_percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${membership.attendance_percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {membership.total_sessions_attended}/{membership.total_sessions_held} sessions
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Competitions Section */}
        {activeSection === 'competitions' && isSchoolStudent && (
          <>
            {competitionRegistrations.length === 0 && competitionResults.length === 0 ? (
              <EmptyState
                title="No competition participation"
                description="This student has not participated in any competitions yet."
                icon={Trophy}
              />
            ) : (
              <div className="space-y-6">
                {/* Competition Results */}
                {competitionResults.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Award className="h-4 w-4 text-yellow-600" />
                      <h4 className="font-semibold text-gray-900">Results ({competitionResults.length})</h4>
                    </div>
                    <div className="space-y-3">
                      {competitionResults.map((result) => (
                        <div key={result.result_id} className="bg-white border border-gray-100 rounded-xl p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                                <Trophy className="h-5 w-5 text-yellow-600" />
                              </div>
                              <div>
                                <h5 className="font-semibold text-gray-900">{result.competition.name}</h5>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getLevelBadgeColor(result.competition.level)}`}>
                                    {result.competition.level}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(result.competition.competition_date).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {result.rank && (
                              <div className="text-right">
                                <div className="text-2xl font-bold text-yellow-600">#{result.rank}</div>
                                <div className="text-xs text-gray-500">Rank</div>
                              </div>
                            )}
                          </div>

                          {result.competition.description && (
                            <p className="text-sm text-gray-600 mb-3">{result.competition.description}</p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              {result.competition.venue && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{result.competition.venue}</span>
                                </div>
                              )}
                              {result.score && (
                                <div className="flex items-center gap-1">
                                  <Target className="h-4 w-4" />
                                  <span>Score: {result.score}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {result.award && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
                                  {result.award}
                                </span>
                              )}
                              {result.certificate_issued && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                  Certificate
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Competition Registrations */}
                {competitionRegistrations.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Trophy className="h-4 w-4 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">Registrations ({competitionRegistrations.length})</h4>
                    </div>
                    <div className="space-y-3">
                      {competitionRegistrations.map((registration) => (
                        <div key={registration.registration_id} className="bg-white border border-gray-100 rounded-xl p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Trophy className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h5 className="font-semibold text-gray-900">{registration.competition.name}</h5>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getLevelBadgeColor(registration.competition.level)}`}>
                                    {registration.competition.level}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(registration.competition.competition_date).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${registration.status === 'confirmed' ? 'bg-green-50 text-green-700' :
                                registration.status === 'registered' ? 'bg-blue-50 text-blue-700' :
                                  registration.status === 'withdrawn' ? 'bg-red-50 text-red-700' :
                                    'bg-gray-50 text-gray-700'
                              }`}>
                              {registration.status}
                            </span>
                          </div>

                          {registration.competition.description && (
                            <p className="text-sm text-gray-600 mb-3">{registration.competition.description}</p>
                          )}

                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Registered: {new Date(registration.registration_date).toLocaleDateString()}</span>
                              </div>
                              {registration.competition.venue && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{registration.competition.venue}</span>
                                </div>
                              )}
                            </div>

                            {registration.team_name && (
                              <span className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded-full">
                                Team: {registration.team_name}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Events Section */}
        {activeSection === 'events' && isCollegeStudent && (
          <>
            {eventRegistrations.length === 0 ? (
              <EmptyState
                title="No event registrations"
                description="This student has not registered for any college events yet."
                icon={Calendar}
              />
            ) : (
              <div className="space-y-3">
                {eventRegistrations.map((registration) => (
                  <div key={registration.id} className="bg-white border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${registration.event.event_type === 'seminar' ? 'bg-blue-50' :
                            registration.event.event_type === 'workshop' ? 'bg-green-50' :
                              registration.event.event_type === 'cultural' ? 'bg-purple-50' :
                                registration.event.event_type === 'sports' ? 'bg-orange-50' :
                                  registration.event.event_type === 'placement' ? 'bg-red-50' :
                                    'bg-gray-50'
                          }`}>
                          {getEventTypeIcon(registration.event.event_type)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{registration.event.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${registration.event.event_type === 'seminar' ? 'bg-blue-100 text-blue-700' :
                                registration.event.event_type === 'workshop' ? 'bg-green-100 text-green-700' :
                                  registration.event.event_type === 'cultural' ? 'bg-purple-100 text-purple-700' :
                                    registration.event.event_type === 'sports' ? 'bg-orange-100 text-orange-700' :
                                      registration.event.event_type === 'placement' ? 'bg-red-100 text-red-700' :
                                        'bg-gray-100 text-gray-700'
                              }`}>
                              {registration.event.event_type}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(registration.event.start_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${registration.event.status === 'published' ? 'bg-green-50 text-green-700' :
                            registration.event.status === 'completed' ? 'bg-blue-50 text-blue-700' :
                              registration.event.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                                'bg-gray-50 text-gray-700'
                          }`}>
                          {registration.event.status}
                        </span>

                        {registration.attended && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                            Attended
                          </span>
                        )}
                      </div>
                    </div>

                    {registration.event.description && (
                      <p className="text-sm text-gray-600 mb-3">{registration.event.description}</p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(registration.event.start_date).toLocaleDateString()} - {new Date(registration.event.end_date).toLocaleDateString()}
                          </span>
                        </div>
                        {registration.event.venue && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{registration.event.venue}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Registered</div>
                          <div className="font-medium text-gray-900">
                            {new Date(registration.registered_at).toLocaleDateString()}
                          </div>
                        </div>

                        <div className={`h-2 w-2 rounded-full ${registration.attended ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ClubsCompetitionsTab;