import React, { useState, useMemo, useEffect } from "react";
import {
    Users,
    Calendar,
    Trophy,
    TrendingUp,
    Activity,
    Award,
    Clock,
    MapPin,
    AlertCircle,
    CheckCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import * as clubsService from "../../services/clubsService";
import * as competitionsService from "../../services/competitionsService";

export default function StudentDashboard() {
    // Get logged-in student's email from localStorage
    const userEmail = localStorage.getItem("userEmail");
    const [currentStudentId] = useState(userEmail); // Use email as student ID
    const [selectedClub, setSelectedClub] = useState(null);
    const [clubs, setClubs] = useState([]);
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myMemberships, setMyMemberships] = useState([]);
    const [attendanceData, setAttendanceData] = useState({});

    // Fetch clubs, competitions, and student's memberships from Supabase
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                console.log('🔍 [Student Clubs] Fetching data for student:', userEmail);
                
                if (!userEmail) {
                    console.warn('❌ [Student Clubs] No user email found');
                    setLoading(false);
                    return;
                }

                // Fetch student's school_id first
                const { data: studentData, error: studentError } = await supabase
                    .from('students')
                    .select('school_id')
                    .eq('email', userEmail)
                    .maybeSingle();

                if (studentError) {
                    console.error('❌ [Student Clubs] Error fetching student data:', studentError);
                }

                const schoolId = studentData?.school_id;
                console.log('🏫 [Student Clubs] Student school_id:', schoolId);

                // Fetch all clubs from the student's school
                const { data: clubsData, error: clubsError } = await supabase
                    .from('clubs')
                    .select('*')
                    .eq('school_id', schoolId)
                    .eq('is_active', true)
                    .order('name');

                if (clubsError) {
                    console.error('❌ [Student Clubs] Error fetching clubs:', clubsError);
                } else {
                    console.log('✅ [Student Clubs] Loaded', clubsData?.length || 0, 'clubs');
                }

                // Fetch student's memberships
                const { data: membershipsData, error: membershipsError } = await supabase
                    .from('club_memberships')
                    .select('*')
                    .eq('student_email', userEmail)
                    .eq('status', 'active');

                if (membershipsError) {
                    console.error('❌ [Student Clubs] Error fetching memberships:', membershipsError);
                } else {
                    console.log('✅ [Student Clubs] Student is member of', membershipsData?.length || 0, 'clubs');
                    setMyMemberships(membershipsData || []);
                }

                // Fetch competitions
                const { data: competitionsData, error: competitionsError } = await supabase
                    .from('competitions')
                    .select('*')
                    .eq('school_id', schoolId)
                    .order('competition_date', { ascending: true });

                if (competitionsError) {
                    console.error('❌ [Student Clubs] Error fetching competitions:', competitionsError);
                } else {
                    console.log('✅ [Student Clubs] Loaded', competitionsData?.length || 0, 'competitions');
                }

                // Fetch attendance data for each membership
                const attendanceMap = {};
                if (membershipsData && membershipsData.length > 0) {
                    for (const membership of membershipsData) {
                        const { data: attendanceRecords } = await supabase
                            .from('club_attendance_records')
                            .select(`
                                *,
                                club_attendance (
                                    session_date,
                                    session_topic
                                )
                            `)
                            .eq('student_email', userEmail)
                            .in('attendance_id', 
                                await supabase
                                    .from('club_attendance')
                                    .select('attendance_id')
                                    .eq('club_id', membership.club_id)
                                    .then(res => res.data?.map(a => a.attendance_id) || [])
                            );

                        attendanceMap[membership.club_id] = attendanceRecords || [];
                    }
                }
                setAttendanceData(attendanceMap);

                // Add members array to clubs
                const clubsWithMembers = await Promise.all(
                    (clubsData || []).map(async (club) => {
                        const { data: memberships } = await supabase
                            .from('club_memberships')
                            .select('student_email')
                            .eq('club_id', club.club_id)
                            .eq('status', 'active');

                        return {
                            ...club,
                            members: memberships?.map(m => m.student_email) || []
                        };
                    })
                );

                setClubs(clubsWithMembers);
                setCompetitions(competitionsData || []);
                
            } catch (error) {
                console.error('❌ [Student Clubs] Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (userEmail) {
            fetchData();
            
            // Refresh data every 30 seconds to stay in sync
            const interval = setInterval(fetchData, 30000);
            
            return () => clearInterval(interval);
        }
    }, [userEmail]);

    // Get clubs the student is enrolled in with enhanced data
    const myClubs = useMemo(() => {
        const memberClubIds = new Set(myMemberships.map(m => m.club_id));
        return clubs.filter((club) => memberClubIds.has(club.club_id)).map(club => {
            const membership = myMemberships.find(m => m.club_id === club.club_id);
            const attendance = attendanceData[club.club_id] || [];
            const attendancePercentage = membership?.attendance_percentage || 0;
            
            return {
                ...club,
                avgAttendance: Math.round(attendancePercentage),
                upcomingActivities: [], // Will be populated from activities table if needed
                meetingDay: club.meeting_day || 'TBD',
                meetingTime: club.meeting_time || 'TBD',
            };
        });
    }, [clubs, myMemberships, attendanceData]);

    // Get student's competition registrations
    const myCompetitions = useMemo(() => {
        // Filter competitions where student is registered
        return competitions.filter(comp => {
            // This would check competition_registrations table
            return false; // Placeholder
        });
    }, [competitions]);

    // Get upcoming activities from all clubs
    const upcomingActivities = useMemo(() => {
        const activities = [];
        myClubs.forEach(club => {
            // Add club meetings as activities
            if (club.meeting_day && club.meeting_time) {
                activities.push({
                    title: `${club.name} Meeting`,
                    clubName: club.name,
                    date: new Date(), // Would calculate next meeting date
                    type: 'meeting'
                });
            }
        });
        return activities.sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [myClubs]);

    // Get student achievements from competitions
    const myAchievements = useMemo(() => {
        return competitions
            .filter(comp => comp.student_email === userEmail && comp.rank)
            .map(comp => ({
                name: comp.competition_name,
                rank: comp.rank,
                award: comp.award || 'Participant',
                level: comp.level || 'School',
                date: comp.competition_date
            }));
    }, [competitions, userEmail]);

    const categoryColors = {
        robotics: "bg-blue-100 text-blue-700 border-blue-200",
        literature: "bg-purple-100 text-purple-700 border-purple-200",
        science: "bg-green-100 text-green-700 border-green-200",
        sports: "bg-red-100 text-red-700 border-red-200",
        arts: "bg-pink-100 text-pink-700 border-pink-200",
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        My Club Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Welcome back! Here's your club activity overview
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">My Clubs</p>
                                <p className="text-3xl font-bold text-blue-600">
                                    {myClubs.length}
                                </p>
                            </div>
                            <div className="bg-blue-100 rounded-full p-3">
                                <Users className="text-blue-600" size={28} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Upcoming Events</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {upcomingActivities.length}
                                </p>
                            </div>
                            <div className="bg-green-100 rounded-full p-3">
                                <Calendar className="text-green-600" size={28} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-yellow-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Achievements</p>
                                <p className="text-3xl font-bold text-yellow-600">
                                    {myAchievements.length}
                                </p>
                            </div>
                            <div className="bg-yellow-100 rounded-full p-3">
                                <Trophy className="text-yellow-600" size={28} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Avg Attendance</p>
                                <p className="text-3xl font-bold text-purple-600">
                                    {myMemberships.length > 0
                                        ? Math.round(
                                              myMemberships.reduce((sum, m) => sum + (m.attendance_percentage || 0), 0) /
                                                  myMemberships.length
                                          )
                                        : 0}
                                    %
                                </p>
                            </div>
                            <div className="bg-purple-100 rounded-full p-3">
                                <TrendingUp className="text-purple-600" size={28} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* My Clubs Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">My Clubs</h2>
                            <Activity className="text-gray-400" size={24} />
                        </div>

                        {myClubs.length === 0 ? (
                            <div className="bg-white rounded-xl p-12 text-center shadow-lg">
                                <Users className="mx-auto text-gray-300 mb-4" size={64} />
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                    No Clubs Yet
                                </h3>
                                <p className="text-gray-500">
                                    You haven't joined any clubs. Explore available clubs to get started!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myClubs.map((club) => (
                                    <div
                                        key={club.club_id}
                                        className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100 hover:border-blue-300 transition-all cursor-pointer"
                                        onClick={() => setSelectedClub(club)}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-bold text-gray-900">
                                                        {club.name}
                                                    </h3>
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                                            categoryColors[club.category]
                                                        }`}
                                                    >
                                                        {club.category}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 text-sm mb-3">
                                                    {club.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar size={16} className="text-blue-500" />
                                                <span>{club.meeting_day || 'TBD'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Clock size={16} className="text-green-500" />
                                                <span>{club.meeting_time || 'TBD'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <MapPin size={16} className="text-red-500" />
                                                <span>{club.location || 'TBD'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Users size={16} className="text-purple-500" />
                                                <span>
                                                    {club.members?.length || 0}/{club.capacity} members
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                            <div className="text-sm">
                                                <span className="text-gray-600">Mentor: </span>
                                                <span className="font-semibold text-gray-900">
                                                    {club.mentor_type === 'educator' ? 'Educator' : 'School Admin'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <TrendingUp size={16} className="text-green-500" />
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {club.avgAttendance || 0}% attendance
                                                </span>
                                            </div>
                                        </div>

                                        {/* Upcoming Activities for this club */}
                                        {club.upcomingActivities.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                                    Next Activities
                                                </p>
                                                <div className="space-y-2">
                                                    {club.upcomingActivities.map((activity, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center justify-between bg-blue-50 rounded-lg p-2"
                                                        >
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {activity.title}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(activity.date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Upcoming Activities */}
                        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100">
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar className="text-green-600" size={24} />
                                <h3 className="text-lg font-bold text-gray-900">
                                    Upcoming Activities
                                </h3>
                            </div>
                            {upcomingActivities.length === 0 ? (
                                <p className="text-gray-500 text-sm">No upcoming activities</p>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingActivities.slice(0, 5).map((activity, idx) => (
                                        <div
                                            key={idx}
                                            className="border-l-4 border-blue-500 pl-3 py-2 bg-blue-50 rounded-r"
                                        >
                                            <p className="font-semibold text-gray-900 text-sm">
                                                {activity.title}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {activity.clubName}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
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

                        {/* My Achievements */}
                        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100">
                            <div className="flex items-center gap-2 mb-4">
                                <Trophy className="text-yellow-600" size={24} />
                                <h3 className="text-lg font-bold text-gray-900">My Achievements</h3>
                            </div>
                            {myAchievements.length === 0 ? (
                                <p className="text-gray-500 text-sm">
                                    No achievements yet. Keep participating!
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {myAchievements.map((achievement, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border-2 border-yellow-200"
                                        >
                                            <div className="flex items-start gap-3">
                                                <Award className="text-yellow-600 flex-shrink-0" size={20} />
                                                <div className="flex-1">
                                                    <p className="font-bold text-gray-900 text-sm">
                                                        {achievement.name}
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        Rank {achievement.rank} • {achievement.award}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                                            {achievement.level}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(achievement.date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}