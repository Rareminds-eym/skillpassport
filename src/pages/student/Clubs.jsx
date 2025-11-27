import React, { useState, useMemo } from "react";
import {
    Users,
    Calendar,
    Trophy,
    TrendingUp,
    Activity,
    Award,
    Clock,
    MapPin,
} from "lucide-react";

// Sample data - in real app, this would come from your database
const sampleClubs = [
    {
        club_id: "c1",
        name: "Robotics Club",
        category: "robotics",
        members: ["s1", "s2", "s3", "s4", "s5"],
        capacity: 30,
        avgAttendance: 85,
        description: "Build and program robots for competitions",
        meetingDay: "Monday & Thursday",
        meetingTime: "4:00 PM - 6:00 PM",
        location: "Lab 101",
        mentor: "Dr. Sarah Johnson",
        upcomingActivities: [
            { title: "Robot Assembly Workshop", date: "2025-12-01" },
            { title: "State Competition Prep", date: "2025-12-10" },
        ],
    },
    {
        club_id: "c2",
        name: "Literature Circle",
        category: "literature",
        members: ["s2", "s6", "s7"],
        capacity: 20,
        avgAttendance: 92,
        description: "Explore classic and contemporary literature",
        meetingDay: "Wednesday",
        meetingTime: "3:30 PM - 5:00 PM",
        location: "Library Room 2",
        mentor: "Prof. Emily Watson",
        upcomingActivities: [
            { title: "Book Discussion: 1984", date: "2025-11-28" },
            { title: "Poetry Writing Workshop", date: "2025-12-05" },
        ],
    },
    {
        club_id: "c3",
        name: "Coding Club",
        category: "science",
        members: ["s1", "s3", "s5", "s8", "s9", "s10"],
        capacity: 50,
        avgAttendance: 78,
        description: "Learn programming and software development",
        meetingDay: "Tuesday & Friday",
        meetingTime: "3:00 PM - 5:00 PM",
        location: "Computer Lab A",
        mentor: "Mr. David Chen",
        upcomingActivities: [
            { title: "Hackathon Preparation", date: "2025-12-02" },
            { title: "Web Development Workshop", date: "2025-12-08" },
        ],
    },
    {
        club_id: "c4",
        name: "Football Team",
        category: "sports",
        members: ["s1", "s4", "s5", "s11", "s12", "s13", "s14", "s15"],
        capacity: 25,
        avgAttendance: 95,
        description: "Competitive football training and matches",
        meetingDay: "Monday, Wednesday, Friday",
        meetingTime: "5:00 PM - 7:00 PM",
        location: "Main Field",
        mentor: "Coach Mike Thompson",
        upcomingActivities: [
            { title: "Practice Match vs St. Mary's", date: "2025-11-30" },
            { title: "Championship Semi-Finals", date: "2025-12-15" },
        ],
    },
    {
        club_id: "c5",
        name: "Drama Society",
        category: "arts",
        members: ["s2", "s7", "s9"],
        capacity: 25,
        avgAttendance: 88,
        description: "Theater performances and acting workshops",
        meetingDay: "Thursday",
        meetingTime: "4:00 PM - 6:30 PM",
        location: "Auditorium",
        mentor: "Ms. Rachel Green",
        upcomingActivities: [
            { title: "Annual Play Rehearsal", date: "2025-12-03" },
            { title: "Improv Night", date: "2025-12-12" },
        ],
    },
];

const sampleCompetitions = [
    {
        comp_id: "comp1",
        name: "State Robotics Challenge",
        level: "state",
        date: "2026-01-15",
        club_id: "c1",
        studentResults: [
            { student_id: "s1", rank: 1, award: "Gold Medal" },
            { student_id: "s2", rank: 3, award: "Bronze Medal" },
        ],
    },
    {
        comp_id: "comp2",
        name: "Inter-school Hackathon",
        level: "district",
        date: "2025-12-05",
        club_id: "c3",
        studentResults: [
            { student_id: "s1", rank: 1, award: "Gold Medal" },
            { student_id: "s3", rank: 4, award: "Certificate" },
        ],
    },
    {
        comp_id: "comp3",
        name: "National Football Championship",
        level: "national",
        date: "2025-12-20",
        club_id: "c4",
        studentResults: [
            { student_id: "s1", rank: 1, award: "MVP Trophy" },
        ],
    },
];

export default function StudentDashboard() {
    // Current logged-in student ID (in real app, this comes from auth)
    const [currentStudentId] = useState("s1");
    const [selectedClub, setSelectedClub] = useState(null);

    // Get clubs the student is enrolled in
    const myClubs = useMemo(() => {
        return sampleClubs.filter((club) =>
            club.members.includes(currentStudentId)
        );
    }, [currentStudentId]);

    // Get student's competition achievements
    const myAchievements = useMemo(() => {
        const achievements = [];
        sampleCompetitions.forEach((comp) => {
            const studentResult = comp.studentResults.find(
                (r) => r.student_id === currentStudentId
            );
            if (studentResult) {
                achievements.push({
                    ...comp,
                    ...studentResult,
                });
            }
        });
        return achievements;
    }, [currentStudentId]);

    // Get upcoming activities across all clubs
    const upcomingActivities = useMemo(() => {
        const activities = [];
        myClubs.forEach((club) => {
            club.upcomingActivities.forEach((activity) => {
                activities.push({
                    ...activity,
                    clubName: club.name,
                    club_id: club.club_id,
                });
            });
        });
        return activities.sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [myClubs]);

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
                                    {myClubs.length > 0
                                        ? Math.round(
                                              myClubs.reduce((sum, c) => sum + c.avgAttendance, 0) /
                                                  myClubs.length
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
                                                <span>{club.meetingDay}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Clock size={16} className="text-green-500" />
                                                <span>{club.meetingTime}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <MapPin size={16} className="text-red-500" />
                                                <span>{club.location}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Users size={16} className="text-purple-500" />
                                                <span>
                                                    {club.members.length}/{club.capacity} members
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                            <div className="text-sm">
                                                <span className="text-gray-600">Mentor: </span>
                                                <span className="font-semibold text-gray-900">
                                                    {club.mentor}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <TrendingUp size={16} className="text-green-500" />
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {club.avgAttendance}% attendance
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