import React, { useState, useMemo } from "react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { FileDown, TrendingUp, Users, Trophy, Calendar } from "lucide-react";

// Sample data matching the main app structure
const sampleClubs = [
    {
        club_id: "c1",
        name: "Robotics Club",
        category: "robotics",
        members: ["s1", "s2", "s3", "s4", "s5"],
        capacity: 30,
        avgAttendance: 85,
        topPerformers: ["Alice Johnson", "Bob Smith"],
    },
    {
        club_id: "c2",
        name: "Literature Circle",
        category: "literature",
        members: ["s2", "s6", "s7"],
        capacity: 20,
        avgAttendance: 92,
        topPerformers: ["Diana Prince"],
    },
    {
        club_id: "c3",
        name: "Coding Club",
        category: "science",
        members: ["s1", "s3", "s5", "s8", "s9", "s10"],
        capacity: 50,
        avgAttendance: 78,
        topPerformers: ["Alice Johnson", "Charlie Brown"],
    },
    {
        club_id: "c4",
        name: "Football Team",
        category: "sports",
        members: ["s1", "s4", "s5", "s11", "s12", "s13", "s14", "s15"],
        capacity: 25,
        avgAttendance: 95,
        topPerformers: ["Ethan Hunt", "George Wilson"],
    },
    {
        club_id: "c5",
        name: "Drama Society",
        category: "arts",
        members: ["s2", "s7", "s9"],
        capacity: 25,
        avgAttendance: 88,
        topPerformers: ["Hannah Lee"],
    },
];

const sampleCompetitions = [
    {
        comp_id: "comp1",
        name: "State Robotics Challenge",
        level: "state",
        date: "2026-01-15",
        participatingClubs: ["c1"],
        results: [
            { student: "Alice Johnson", rank: 1, award: "Gold Medal" },
            { student: "Bob Smith", rank: 3, award: "Bronze Medal" },
        ],
    },
    {
        comp_id: "comp2",
        name: "Inter-school Hackathon",
        level: "district",
        date: "2025-12-05",
        participatingClubs: ["c3"],
        results: [
            { student: "Charlie Brown", rank: 2, award: "Silver Medal" },
            { student: "Alice Johnson", rank: 1, award: "Gold Medal" },
        ],
    },
    {
        comp_id: "comp3",
        name: "National Football Championship",
        level: "national",
        date: "2025-12-20",
        participatingClubs: ["c4"],
        results: [
            { student: "Ethan Hunt", rank: 1, award: "MVP Trophy" },
        ],
    },
    {
        comp_id: "comp4",
        name: "School Literary Fest",
        level: "intraschool",
        date: "2025-11-28",
        participatingClubs: ["c2"],
        results: [
            { student: "Diana Prince", rank: 1, award: "Best Writer" },
        ],
    },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function downloadCSV(filename, rows) {
    if (!rows || !rows.length) return;
    const header = Object.keys(rows[0]);
    const csv = [header.join(",")]
        .concat(
            rows.map((r) =>
                header
                    .map((h) => `"${(r[h] ?? "").toString().replace(/"/g, '""')}"`)
                    .join(",")
            )
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
}

export default function ClubReportsAnalytics() {
    const [clubs] = useState(sampleClubs);
    const [competitions] = useState(sampleCompetitions);
    const [activeTab, setActiveTab] = useState("clubs");

    // Club Participation Data
    const clubParticipationData = useMemo(() => {
        return clubs.map((club) => ({
            name: club.name,
            students: club.members.length,
            capacity: club.capacity,
            attendance: club.avgAttendance,
            participationScore: Math.round((club.members.length / club.capacity) * 100),
        }));
    }, [clubs]);

    // Category Distribution
    const categoryData = useMemo(() => {
        const categories = {};
        clubs.forEach((club) => {
            categories[club.category] = (categories[club.category] || 0) + club.members.length;
        });
        return Object.entries(categories).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
        }));
    }, [clubs]);

    // Competition Performance Data
    const competitionData = useMemo(() => {
        return competitions.map((comp) => ({
            name: comp.name,
            level: comp.level,
            participants: comp.participatingClubs.length,
            awards: comp.results.length,
        }));
    }, [competitions]);

    // Awards by Level
    const awardsByLevel = useMemo(() => {
        const levels = { intraschool: 0, district: 0, state: 0, national: 0 };
        competitions.forEach((comp) => {
            levels[comp.level] = (levels[comp.level] || 0) + comp.results.length;
        });
        return Object.entries(levels).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            awards: value,
        }));
    }, [competitions]);

    // Build CSV data
    const buildClubParticipationRows = () => {
        return clubs.map((c) => ({
            "Club Name": c.name,
            "Student Count": c.members.length,
            "Average Attendance": `${c.avgAttendance}%`,
            "Top Performers": c.topPerformers.join(", "),
            "Participation Score": Math.round((c.members.length / c.capacity) * 100),
        }));
    };

    const buildCompetitionPerformanceRows = () => {
        return competitions.map((comp) => ({
            "Competition Name": comp.name,
            "Level": comp.level,
            "Student Results": comp.results.map((r) => `${r.student} (Rank ${r.rank})`).join("; "),
            "Awards": comp.results.map((r) => r.award).join(", "),
        }));
    };

    const exportClubsCSV = () => {
        const rows = buildClubParticipationRows();
        downloadCSV("club_participation_report.csv", rows);
    };

    const exportCompetitionsCSV = () => {
        const rows = buildCompetitionPerformanceRows();
        downloadCSV("competition_performance_report.csv", rows);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Reports & Analytics Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Comprehensive insights into club participation and competition performance
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Clubs</p>
                                <p className="text-2xl font-bold text-gray-900">{clubs.length}</p>
                            </div>
                            <div className="bg-blue-100 rounded-full p-3">
                                <Users className="text-blue-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Active Members</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {clubs.reduce((sum, club) => sum + club.members.length, 0)}
                                </p>
                            </div>
                            <div className="bg-green-100 rounded-full p-3">
                                <TrendingUp className="text-green-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Competitions</p>
                                <p className="text-2xl font-bold text-gray-900">{competitions.length}</p>
                            </div>
                            <div className="bg-purple-100 rounded-full p-3">
                                <Trophy className="text-purple-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Awards</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {competitions.reduce((sum, comp) => sum + comp.results.length, 0)}
                                </p>
                            </div>
                            <div className="bg-yellow-100 rounded-full p-3">
                                <Calendar className="text-yellow-600" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab("clubs")}
                            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                                activeTab === "clubs"
                                    ? "text-blue-600 border-b-2 border-blue-600"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            Club Participation Report
                        </button>
                        <button
                            onClick={() => setActiveTab("competitions")}
                            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                                activeTab === "competitions"
                                    ? "text-blue-600 border-b-2 border-blue-600"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            Competition Performance Report
                        </button>
                    </div>
                </div>

                {/* Club Participation Report */}
                {activeTab === "clubs" && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Club Participation Analysis
                            </h2>
                            <button
                                onClick={exportClubsCSV}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <FileDown size={18} />
                                Export CSV
                            </button>
                        </div>

                        {/* Club Membership Chart */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold mb-4">Student Enrollment by Club</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={clubParticipationData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="students" fill="#3b82f6" name="Current Members" />
                                    <Bar dataKey="capacity" fill="#e5e7eb" name="Capacity" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Attendance & Participation Score */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-semibold mb-4">Average Attendance (%)</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={clubParticipationData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip />
                                        <Bar dataKey="attendance" fill="#10b981" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-semibold mb-4">Participation Score (%)</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={clubParticipationData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip />
                                        <Bar dataKey="participationScore" fill="#f59e0b" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Category Distribution */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold mb-4">Student Distribution by Category</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value, percent }) =>
                                            `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                                        }
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Detailed Table */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold mb-4">Detailed Club Report</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-gray-700">Club Name</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-700">Student Count</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-700">Avg Attendance</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-700">Top Performers</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-700">Participation Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {clubs.map((club) => (
                                            <tr key={club.club_id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium">{club.name}</td>
                                                <td className="px-4 py-3">
                                                    {club.members.length} / {club.capacity}
                                                </td>
                                                <td className="px-4 py-3">{club.avgAttendance}%</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {club.topPerformers.join(", ")}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        Math.round((club.members.length / club.capacity) * 100) >= 70
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-yellow-100 text-yellow-700"
                                                    }`}>
                                                        {Math.round((club.members.length / club.capacity) * 100)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Competition Performance Report */}
                {activeTab === "competitions" && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Competition Performance Analysis
                            </h2>
                            <button
                                onClick={exportCompetitionsCSV}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <FileDown size={18} />
                                Export CSV
                            </button>
                        </div>

                        {/* Awards by Level */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold mb-4">Awards by Competition Level</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={awardsByLevel}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="awards" fill="#8b5cf6" name="Total Awards" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Competition Participation */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold mb-4">Competition Participation Overview</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={competitionData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="participants" fill="#3b82f6" name="Participating Clubs" />
                                    <Bar dataKey="awards" fill="#f59e0b" name="Awards Won" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Detailed Competition Table */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold mb-4">Detailed Competition Report</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-gray-700">Competition Name</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-700">Level</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-700">Student Results</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-700">Awards</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {competitions.map((comp) => (
                                            <tr key={comp.comp_id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium">{comp.name}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                                                        {comp.level}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    {new Date(comp.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="space-y-1">
                                                        {comp.results.map((result, idx) => (
                                                            <div key={idx} className="text-xs">
                                                                <span className="font-medium">{result.student}</span>
                                                                <span className="text-gray-500"> - Rank {result.rank}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="space-y-1">
                                                        {comp.results.map((result, idx) => (
                                                            <div key={idx} className="text-xs text-gray-600">
                                                                {result.award}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}