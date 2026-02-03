import React from 'react';
import { 
  Activity, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Trophy, 
  TrendingUp, 
  Award,
  GraduationCap
} from 'lucide-react';

export interface SchoolClub {
  club_id: string;
  name: string;
  category: string;
  description: string;
  meeting_day: string;
  meeting_time: string;
  location: string;
  mentor_type: string;
  mentor_name: string;
  mentor_email?: string;
  mentor_phone?: string;
  is_active: boolean;
  capacity: number;
  memberCount: number;
  membership_id: string;
  enrolled_at: string;
  total_sessions_attended: number;
  total_sessions_held: number;
  attendance_percentage: number;
  performance_score?: number;
  avgAttendance: number;
  upcomingActivities: any[];
  meetingDay: string;
  meetingTime: string;
}

export interface SchoolAchievement {
  result_id: string;
  name: string;
  rank: number;
  score?: number;
  award: string;
  level: string;
  category: string;
  date: string;
  status: string;
  notes?: string;
}

export interface SchoolCertificate {
  certificate_id: string;
  title: string;
  description: string;
  certificate_type: string;
  issued_date: string;
  credential_id?: string;
  metadata?: {
    rank?: number;
    score?: number;
  };
  competitions?: {
    name: string;
    level: string;
    category: string;
  };
}

export interface SchoolActivity {
  title: string;
  clubName: string;
  date: Date;
  type: string;
}

interface SchoolCoCurricularsTabProps {
  clubs: SchoolClub[];
  achievements: SchoolAchievement[];
  certificates: SchoolCertificate[];
  upcomingActivities: SchoolActivity[];
  loading?: boolean;
}

const CoCurricularsTab: React.FC<SchoolCoCurricularsTabProps> = ({
  clubs,
  achievements,
  certificates,
  upcomingActivities,
  loading = false
}) => {
  const categoryColors: Record<string, string> = {
    robotics: "bg-blue-100 text-blue-700",
    literature: "bg-violet-100 text-violet-700",
    science: "bg-emerald-100 text-emerald-700",
    sports: "bg-rose-100 text-rose-700",
    arts: "bg-pink-100 text-pink-700",
    music: "bg-purple-100 text-purple-700",
    debate: "bg-amber-100 text-amber-700",
    drama: "bg-indigo-100 text-indigo-700",
    technology: "bg-cyan-100 text-cyan-700",
    community: "bg-teal-100 text-teal-700",
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Co-Curricular Activities</h2>
        <p className="text-gray-600">Your clubs, achievements, and extracurricular involvement</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Active Clubs</p>
              <p className="text-3xl font-bold text-black">{clubs.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Upcoming Events</p>
              <p className="text-3xl font-bold text-black">{upcomingActivities.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Achievements</p>
              <p className="text-3xl font-bold text-black">{achievements.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Avg Attendance</p>
              <p className="text-3xl font-bold text-black">
                {clubs.length > 0
                  ? Math.round(
                      clubs.reduce((sum, club) => sum + (club.attendance_percentage || 0), 0) /
                        clubs.length
                    )
                  : 0}
                %
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Clubs Section */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-black">My Clubs</h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              {clubs.length} active
            </div>
          </div>

          {clubs.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-black mb-2">No Clubs Joined</h3>
              <p className="text-gray-600 max-w-sm mx-auto">
                You haven't joined any clubs yet. Explore available clubs to start your co-curricular journey.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {clubs.map((club) => (
                <div
                  key={club.club_id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-sm transition-all duration-200"
                >
                  {/* Club Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-bold text-black">
                          {club.name?.charAt(0).toUpperCase() + club.name?.slice(1).toLowerCase() || 'Unnamed Club'}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          categoryColors[club.category?.toLowerCase()] || 'bg-gray-100 text-gray-700'
                        }`}>
                          {club.category?.charAt(0).toUpperCase() + club.category?.slice(1).toLowerCase() || 'General'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {club.description || 'No description available for this club.'}
                      </p>
                    </div>
                  </div>

                  {/* Club Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Meeting Day</p>
                        <p className="text-sm font-semibold text-black">
                          {club.meeting_day?.charAt(0).toUpperCase() + club.meeting_day?.slice(1).toLowerCase() || 'TBD'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Time</p>
                        <p className="text-sm font-semibold text-black">{club.meeting_time || 'TBD'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</p>
                        <p className="text-sm font-semibold text-black">
                          {club.location?.charAt(0).toUpperCase() + club.location?.slice(1).toLowerCase() || 'TBD'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Members</p>
                        <p className="text-sm font-semibold text-black">
                          {club.memberCount || 0} / {club.capacity || 30}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Club Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-600">
                          {club.mentor_name?.charAt(0) || 'M'}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Mentor</p>
                        <p className="text-sm font-semibold text-black">
                          {club.mentor_name || (club.mentor_type === 'educator' ? 'Educator' : 'School Admin')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-bold text-blue-700">
                        {club.avgAttendance || 0}%
                      </span>
                      <span className="text-xs text-gray-600">attendance</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Activities */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-black">Upcoming Activities</h3>
            </div>
            
            {upcomingActivities.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-600 text-sm">No upcoming activities</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingActivities.slice(0, 5).map((activity, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 border border-gray-100 rounded-lg p-4 border-l-4 border-l-blue-500"
                  >
                    <p className="font-semibold text-black text-sm mb-1">
                      {activity.title?.charAt(0).toUpperCase() + activity.title?.slice(1) || 'Activity'}
                    </p>
                    <p className="text-xs text-gray-600 mb-2">
                      {activity.clubName?.charAt(0).toUpperCase() + activity.clubName?.slice(1).toLowerCase() || 'Club'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Achievements & Certificates */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Certificates</h3>
              </div>
              {certificates.length > 0 && (
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                  {certificates.length}
                </span>
              )}
            </div>
            
            {certificates.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-600 text-sm">No certificates earned yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {certificates.map((cert, index) => (
                  <div key={cert.certificate_id}>
                    <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all duration-200 bg-white">
                      {/* Header with icon and title */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Award className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                            {cert.title?.charAt(0).toUpperCase() + cert.title?.slice(1) || 'Certificate'}
                          </h4>
                        </div>
                      </div>
                      
                      {/* Description */}
                      <p className="text-xs text-gray-600 mb-3 pl-10 leading-relaxed line-clamp-2">
                        {cert.description}
                      </p>
                      
                      {/* Tags and metadata */}
                      <div className="pl-10 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium capitalize">
                            {cert.certificate_type?.replace('_', ' ') || 'Competition'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(cert.issued_date).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        
                        {/* Rank and score */}
                        {cert.metadata?.rank && (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">Rank:</span>
                              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                                #{cert.metadata.rank}
                              </span>
                            </div>
                            {cert.metadata?.score && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Score:</span>
                                <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                                  {cert.metadata.score}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Subtle separator between certificates (except last one) */}
                    {index < certificates.length - 1 && (
                      <div className="flex justify-center my-2">
                        <div className="w-8 h-px bg-gray-200"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoCurricularsTab;