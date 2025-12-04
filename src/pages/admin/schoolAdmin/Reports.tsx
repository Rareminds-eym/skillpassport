// import React, { useState, useMemo, useEffect } from "react";
// import {
//     BarChart,
//     Bar,
//     LineChart,
//     Line,
//     PieChart,
//     Pie,
//     Cell,
//     XAxis,
//     YAxis,
//     CartesianGrid,
//     Tooltip,
//     Legend,
//     ResponsiveContainer,
// } from "recharts";
// import { FileDown, TrendingUp, Users, Trophy, Calendar } from "lucide-react";
// import { supabase } from "../../../lib/supabaseClient";
// import * as XLSX from 'xlsx';

// const sampleCompetitions = [
//     {
//         comp_id: "comp1",
//         name: "State Robotics Challenge",
//         level: "state",
//         date: "2026-01-15",
//         participatingClubs: ["c1"],
//         results: [
//             { student: "Alice Johnson", rank: 1, award: "Gold Medal" },
//             { student: "Bob Smith", rank: 3, award: "Bronze Medal" },
//         ],
//     },
//     {
//         comp_id: "comp2",
//         name: "Inter-school Hackathon",
//         level: "district",
//         date: "2025-12-05",
//         participatingClubs: ["c3"],
//         results: [
//             { student: "Charlie Brown", rank: 2, award: "Silver Medal" },
//             { student: "Alice Johnson", rank: 1, award: "Gold Medal" },
//         ],
//     },
//     {
//         comp_id: "comp3",
//         name: "National Football Championship",
//         level: "national",
//         date: "2025-12-20",
//         participatingClubs: ["c4"],
//         results: [
//             { student: "Ethan Hunt", rank: 1, award: "MVP Trophy" },
//         ],
//     },
//     {
//         comp_id: "comp4",
//         name: "School Literary Fest",
//         level: "intraschool",
//         date: "2025-11-28",
//         participatingClubs: ["c2"],
//         results: [
//             { student: "Diana Prince", rank: 1, award: "Best Writer" },
//         ],
//     },
// ];

// const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

// function downloadCSV(filename, rows) {
//     if (!rows || !rows.length) return;
//     const header = Object.keys(rows[0]);
//     const csv = [header.join(",")]
//         .concat(
//             rows.map((r) =>
//                 header
//                     .map((h) => `"${(r[h] ?? "").toString().replace(/"/g, '""')}"`)
//                     .join(",")
//             )
//         )
//         .join("\n");

//     const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//     const link = document.createElement("a");
//     link.href = URL.createObjectURL(blob);
//     link.download = filename;
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
// }

// export default function ClubReportsAnalytics() {
//     const [clubs, setClubs] = useState([]);
//     const [competitions] = useState(sampleCompetitions);
//     const [activeTab, setActiveTab] = useState("clubs");
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);

//     // Fetch club participation data from Supabase
//     useEffect(() => {
//         const fetchClubData = async () => {
//             try {
//                 setLoading(true);
//                 setError(null);
                
//                 console.log('📊 [Reports] Fetching club participation data...');
                
//                 // Get logged-in user's school_id
//                 const userEmail = localStorage.getItem('userEmail');
//                 if (!userEmail) {
//                     console.warn('❌ [Reports] No user email found');
//                     setLoading(false);
//                     return;
//                 }

//                 // Get school_id from multiple sources
//                 let schoolId = null;
                
//                 // Try localStorage first
//                 const storedUser = localStorage.getItem('user');
//                 if (storedUser) {
//                     try {
//                         const userData = JSON.parse(storedUser);
//                         if (userData.schoolId) {
//                             schoolId = userData.schoolId;
//                         }
//                     } catch (e) {
//                         console.error('Error parsing stored user:', e);
//                     }
//                 }
                
//                 // Try school_educators table
//                 if (!schoolId) {
//                     const { data: educatorData } = await supabase
//                         .from('school_educators')
//                         .select('school_id')
//                         .eq('email', userEmail)
//                         .maybeSingle();
                    
//                     if (educatorData?.school_id) {
//                         schoolId = educatorData.school_id;
//                     }
//                 }
                
//                 // Try schools table
//                 if (!schoolId) {
//                     const { data: schoolData } = await supabase
//                         .from('schools')
//                         .select('id')
//                         .eq('email', userEmail)
//                         .maybeSingle();
                    
//                     if (schoolData?.id) {
//                         schoolId = schoolData.id;
//                     }
//                 }

//                 if (!schoolId) {
//                     console.warn('❌ [Reports] No school_id found for user');
//                     setLoading(false);
//                     return;
//                 }

//                 console.log('🏫 [Reports] Fetching data for school_id:', schoolId);

//                 // Fetch club participation report from view
//                 const { data: reportData, error: reportError } = await supabase
//                     .from('club_participation_report')
//                     .select('*')
//                     .eq('school_id', schoolId)
//                     .eq('is_active', true);

//                 if (reportError) {
//                     console.error('❌ [Reports] Error fetching club report:', reportError);
//                     setError('Failed to load club data');
//                     setLoading(false);
//                     return;
//                 }

//                 console.log('✅ [Reports] Loaded', reportData?.length || 0, 'clubs');

//                 // Transform data to match component structure
//                 const transformedClubs = (reportData || []).map(club => ({
//                     club_id: club.club_id,
//                     name: club.club_name,
//                     category: club.category,
//                     members: Array(club.student_count || 0).fill(''), // Placeholder for member count
//                     capacity: club.capacity || 30,
//                     avgAttendance: club.avg_attendance || 0,
//                     topPerformers: club.top_performers ? club.top_performers.split(', ') : [],
//                     participationScore: club.participation_score || 0,
//                     meeting_day: club.meeting_day,
//                     meeting_time: club.meeting_time,
//                     location: club.location
//                 }));

//                 setClubs(transformedClubs);
                
//             } catch (err) {
//                 console.error('❌ [Reports] Error loading club data:', err);
//                 setError('An error occurred while loading data');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchClubData();
//     }, []);

//     // Club Participation Data
//     const clubParticipationData = useMemo(() => {
//         return clubs.map((club) => ({
//             name: club.name,
//             students: club.members.length,
//             capacity: club.capacity,
//             attendance: club.avgAttendance,
//             participationScore: Math.round((club.members.length / club.capacity) * 100),
//         }));
//     }, [clubs]);

//     // Category Distribution
//     const categoryData = useMemo(() => {
//         const categories = {};
//         clubs.forEach((club) => {
//             categories[club.category] = (categories[club.category] || 0) + club.members.length;
//         });
//         return Object.entries(categories).map(([name, value]) => ({
//             name: name.charAt(0).toUpperCase() + name.slice(1),
//             value,
//         }));
//     }, [clubs]);

//     // Competition Performance Data
//     const competitionData = useMemo(() => {
//         return competitions.map((comp) => ({
//             name: comp.name,
//             level: comp.level,
//             participants: comp.participatingClubs.length,
//             awards: comp.results.length,
//         }));
//     }, [competitions]);

//     // Awards by Level
//     const awardsByLevel = useMemo(() => {
//         const levels = { intraschool: 0, district: 0, state: 0, national: 0 };
//         competitions.forEach((comp) => {
//             levels[comp.level] = (levels[comp.level] || 0) + comp.results.length;
//         });
//         return Object.entries(levels).map(([name, value]) => ({
//             name: name.charAt(0).toUpperCase() + name.slice(1),
//             awards: value,
//         }));
//     }, [competitions]);

//     // Build CSV data
//     const buildClubParticipationRows = () => {
//         return clubs.map((c) => ({
//             "Club Name": c.name,
//             "Student Count": c.members.length,
//             "Average Attendance": `${c.avgAttendance}%`,
//             "Top Performers": c.topPerformers.join(", "),
//             "Participation Score": Math.round((c.members.length / c.capacity) * 100),
//         }));
//     };

//     const buildCompetitionPerformanceRows = () => {
//         return competitions.map((comp) => ({
//             "Competition Name": comp.name,
//             "Level": comp.level,
//             "Student Results": comp.results.map((r) => `${r.student} (Rank ${r.rank})`).join("; "),
//             "Awards": comp.results.map((r) => r.award).join(", "),
//         }));
//     };

//     const exportClubsCSV = () => {
//         const rows = buildClubParticipationRows();
//         downloadCSV("club_participation_report.csv", rows);
//     };

//     const exportCompetitionsCSV = () => {
//         const rows = buildCompetitionPerformanceRows();
//         downloadCSV("competition_performance_report.csv", rows);
//     };

//     const exportClubsExcel = () => {
//         const rows = buildClubParticipationRows();
//         if (rows && rows.length > 0) {
//             const worksheet = XLSX.utils.json_to_sheet(rows);
//             const workbook = XLSX.utils.book_new();
//             XLSX.utils.book_append_sheet(workbook, worksheet, "Club Participation");
            
//             // Auto-size columns
//             const maxWidth = rows.reduce((w, r) => {
//                 return Object.keys(r).reduce((acc, key) => {
//                     const value = r[key]?.toString() || '';
//                     acc[key] = Math.max(acc[key] || 10, value.length);
//                     return acc;
//                 }, w);
//             }, {});
            
//             worksheet['!cols'] = Object.keys(maxWidth).map(key => ({ wch: Math.min(maxWidth[key] + 2, 50) }));
            
//             XLSX.writeFile(workbook, "club_participation_report.xlsx");
//         }
//     };

//     const exportCompetitionsExcel = () => {
//         const rows = buildCompetitionPerformanceRows();
//         if (rows && rows.length > 0) {
//             const worksheet = XLSX.utils.json_to_sheet(rows);
//             const workbook = XLSX.utils.book_new();
//             XLSX.utils.book_append_sheet(workbook, worksheet, "Competition Performance");
            
//             // Auto-size columns
//             const maxWidth = rows.reduce((w, r) => {
//                 return Object.keys(r).reduce((acc, key) => {
//                     const value = r[key]?.toString() || '';
//                     acc[key] = Math.max(acc[key] || 10, value.length);
//                     return acc;
//                 }, w);
//             }, {});
            
//             worksheet['!cols'] = Object.keys(maxWidth).map(key => ({ wch: Math.min(maxWidth[key] + 2, 50) }));
            
//             XLSX.writeFile(workbook, "competition_performance_report.xlsx");
//         }
//     };

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
//             <div className="max-w-7xl mx-auto">
//                 {/* Header */}
//                 <div className="mb-8">
//                     <h1 className="text-3xl font-bold text-gray-900 mb-2">
//                         Reports & Analytics Dashboard
//                     </h1>
//                     <p className="text-gray-600">
//                         Comprehensive insights into club participation and competition performance
//                     </p>
//                 </div>

//                 {/* Summary Cards */}
//                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
//                     <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//                         <div className="flex items-center justify-between">
//                             <div>
//                                 <p className="text-sm text-gray-600 mb-1">Total Clubs</p>
//                                 <p className="text-2xl font-bold text-gray-900">{clubs.length}</p>
//                             </div>
//                             <div className="bg-blue-100 rounded-full p-3">
//                                 <Users className="text-blue-600" size={24} />
//                             </div>
//                         </div>
//                     </div>

//                     <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//                         <div className="flex items-center justify-between">
//                             <div>
//                                 <p className="text-sm text-gray-600 mb-1">Active Members</p>
//                                 <p className="text-2xl font-bold text-gray-900">
//                                     {clubs.reduce((sum, club) => sum + club.members.length, 0)}
//                                 </p>
//                             </div>
//                             <div className="bg-green-100 rounded-full p-3">
//                                 <TrendingUp className="text-green-600" size={24} />
//                             </div>
//                         </div>
//                     </div>

//                     <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//                         <div className="flex items-center justify-between">
//                             <div>
//                                 <p className="text-sm text-gray-600 mb-1">Competitions</p>
//                                 <p className="text-2xl font-bold text-gray-900">{competitions.length}</p>
//                             </div>
//                             <div className="bg-purple-100 rounded-full p-3">
//                                 <Trophy className="text-purple-600" size={24} />
//                             </div>
//                         </div>
//                     </div>

//                     <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//                         <div className="flex items-center justify-between">
//                             <div>
//                                 <p className="text-sm text-gray-600 mb-1">Total Awards</p>
//                                 <p className="text-2xl font-bold text-gray-900">
//                                     {competitions.reduce((sum, comp) => sum + comp.results.length, 0)}
//                                 </p>
//                             </div>
//                             <div className="bg-yellow-100 rounded-full p-3">
//                                 <Calendar className="text-yellow-600" size={24} />
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Tabs */}
//                 <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
//                     <div className="flex border-b">
//                         <button
//                             onClick={() => setActiveTab("clubs")}
//                             className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
//                                 activeTab === "clubs"
//                                     ? "text-blue-600 border-b-2 border-blue-600"
//                                     : "text-gray-600 hover:text-gray-900"
//                             }`}
//                         >
//                             Club Participation Report
//                         </button>
//                         <button
//                             onClick={() => setActiveTab("competitions")}
//                             className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
//                                 activeTab === "competitions"
//                                     ? "text-blue-600 border-b-2 border-blue-600"
//                                     : "text-gray-600 hover:text-gray-900"
//                             }`}
//                         >
//                             Competition Performance Report
//                         </button>
//                     </div>
//                 </div>

//                 {/* Loading State */}
//                 {loading && (
//                     <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
//                         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//                         <p className="text-gray-600">Loading club data...</p>
//                     </div>
//                 )}

//                 {/* Error State */}
//                 {error && !loading && (
//                     <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
//                         <p className="text-red-700 font-medium">{error}</p>
//                         <button
//                             onClick={() => window.location.reload()}
//                             className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
//                         >
//                             Retry
//                         </button>
//                     </div>
//                 )}

//                 {/* Empty State */}
//                 {!loading && !error && clubs.length === 0 && activeTab === "clubs" && (
//                     <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
//                         <Users className="mx-auto text-gray-300 mb-4" size={64} />
//                         <h3 className="text-xl font-semibold text-gray-700 mb-2">
//                             No Clubs Found
//                         </h3>
//                         <p className="text-gray-500">
//                             Create clubs in the Skills & Co-Curricular section to see reports here.
//                         </p>
//                     </div>
//                 )}

//                 {/* Club Participation Report */}
//                 {activeTab === "clubs" && !loading && !error && clubs.length > 0 && (
//                     <div className="space-y-6">
//                         <div className="flex justify-between items-center">
//                             <h2 className="text-xl font-semibold text-gray-900">
//                                 Club Participation Analysis
//                             </h2>
//                             <div className="flex gap-2">
//                                 <button
//                                     onClick={exportClubsCSV}
//                                     className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                                 >
//                                     <FileDown size={18} />
//                                     Export CSV
//                                 </button>
//                                 <button
//                                     onClick={exportClubsExcel}
//                                     className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
//                                 >
//                                     <FileDown size={18} />
//                                     Export Excel
//                                 </button>
//                             </div>
//                         </div>

//                         {/* Club Membership Chart */}
//                         <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//                             <h3 className="text-lg font-semibold mb-4">Student Enrollment by Club</h3>
//                             <ResponsiveContainer width="100%" height={300}>
//                                 <BarChart data={clubParticipationData}>
//                                     <CartesianGrid strokeDasharray="3 3" />
//                                     <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
//                                     <YAxis />
//                                     <Tooltip />
//                                     <Legend />
//                                     <Bar dataKey="students" fill="#3b82f6" name="Current Members" />
//                                     <Bar dataKey="capacity" fill="#e5e7eb" name="Capacity" />
//                                 </BarChart>
//                             </ResponsiveContainer>
//                         </div>

//                         {/* Attendance & Participation Score */}
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                             <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//                                 <h3 className="text-lg font-semibold mb-4">Average Attendance (%)</h3>
//                                 <ResponsiveContainer width="100%" height={250}>
//                                     <BarChart data={clubParticipationData}>
//                                         <CartesianGrid strokeDasharray="3 3" />
//                                         <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
//                                         <YAxis domain={[0, 100]} />
//                                         <Tooltip />
//                                         <Bar dataKey="attendance" fill="#10b981" />
//                                     </BarChart>
//                                 </ResponsiveContainer>
//                             </div>

//                             <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//                                 <h3 className="text-lg font-semibold mb-4">Participation Score (%)</h3>
//                                 <ResponsiveContainer width="100%" height={250}>
//                                     <BarChart data={clubParticipationData}>
//                                         <CartesianGrid strokeDasharray="3 3" />
//                                         <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
//                                         <YAxis domain={[0, 100]} />
//                                         <Tooltip />
//                                         <Bar dataKey="participationScore" fill="#f59e0b" />
//                                     </BarChart>
//                                 </ResponsiveContainer>
//                             </div>
//                         </div>

//                         {/* Category Distribution */}
//                         <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//                             <h3 className="text-lg font-semibold mb-4">Student Distribution by Category</h3>
//                             <ResponsiveContainer width="100%" height={300}>
//                                 <PieChart>
//                                     <Pie
//                                         data={categoryData}
//                                         cx="50%"
//                                         cy="50%"
//                                         labelLine={false}
//                                         label={({ name, value, percent }) =>
//                                             `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
//                                         }
//                                         outerRadius={100}
//                                         fill="#8884d8"
//                                         dataKey="value"
//                                     >
//                                         {categoryData.map((entry, index) => (
//                                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                                         ))}
//                                     </Pie>
//                                     <Tooltip />
//                                 </PieChart>
//                             </ResponsiveContainer>
//                         </div>

//                         {/* Detailed Table */}
//                         <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//                             <h3 className="text-lg font-semibold mb-4">Detailed Club Report</h3>
//                             <div className="overflow-x-auto">
//                                 <table className="w-full text-sm">
//                                     <thead className="bg-gray-50">
//                                         <tr>
//                                             <th className="px-4 py-3 text-left font-medium text-gray-700">Club Name</th>
//                                             <th className="px-4 py-3 text-left font-medium text-gray-700">Student Count</th>
//                                             <th className="px-4 py-3 text-left font-medium text-gray-700">Avg Attendance</th>
//                                             <th className="px-4 py-3 text-left font-medium text-gray-700">Top Performers</th>
//                                             <th className="px-4 py-3 text-left font-medium text-gray-700">Participation Score</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody className="divide-y divide-gray-200">
//                                         {clubs.map((club) => (
//                                             <tr key={club.club_id} className="hover:bg-gray-50">
//                                                 <td className="px-4 py-3 font-medium">{club.name}</td>
//                                                 <td className="px-4 py-3">
//                                                     {club.members.length} / {club.capacity}
//                                                 </td>
//                                                 <td className="px-4 py-3">{club.avgAttendance}%</td>
//                                                 <td className="px-4 py-3 text-sm text-gray-600">
//                                                     {club.topPerformers.join(", ")}
//                                                 </td>
//                                                 <td className="px-4 py-3">
//                                                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                                                         Math.round((club.members.length / club.capacity) * 100) >= 70
//                                                             ? "bg-green-100 text-green-700"
//                                                             : "bg-yellow-100 text-yellow-700"
//                                                     }`}>
//                                                         {Math.round((club.members.length / club.capacity) * 100)}%
//                                                     </span>
//                                                 </td>
//                                             </tr>
//                                         ))}
//                                     </tbody>
//                                 </table>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 {/* Competition Performance Report */}
//                 {activeTab === "competitions" && (
//                     <div className="space-y-6">
//                         <div className="flex justify-between items-center">
//                             <h2 className="text-xl font-semibold text-gray-900">
//                                 Competition Performance Analysis
//                             </h2>
//                             <div className="flex gap-2">
//                                 <button
//                                     onClick={exportCompetitionsCSV}
//                                     className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                                 >
//                                     <FileDown size={18} />
//                                     Export CSV
//                                 </button>
//                                 <button
//                                     onClick={exportCompetitionsExcel}
//                                     className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
//                                 >
//                                     <FileDown size={18} />
//                                     Export Excel
//                                 </button>
//                             </div>
//                         </div>

//                         {/* Awards by Level */}
//                         <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//                             <h3 className="text-lg font-semibold mb-4">Awards by Competition Level</h3>
//                             <ResponsiveContainer width="100%" height={300}>
//                                 <BarChart data={awardsByLevel}>
//                                     <CartesianGrid strokeDasharray="3 3" />
//                                     <XAxis dataKey="name" />
//                                     <YAxis />
//                                     <Tooltip />
//                                     <Legend />
//                                     <Bar dataKey="awards" fill="#8b5cf6" name="Total Awards" />
//                                 </BarChart>
//                             </ResponsiveContainer>
//                         </div>

//                         {/* Competition Participation */}
//                         <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//                             <h3 className="text-lg font-semibold mb-4">Competition Participation Overview</h3>
//                             <ResponsiveContainer width="100%" height={300}>
//                                 <BarChart data={competitionData}>
//                                     <CartesianGrid strokeDasharray="3 3" />
//                                     <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
//                                     <YAxis />
//                                     <Tooltip />
//                                     <Legend />
//                                     <Bar dataKey="participants" fill="#3b82f6" name="Participating Clubs" />
//                                     <Bar dataKey="awards" fill="#f59e0b" name="Awards Won" />
//                                 </BarChart>
//                             </ResponsiveContainer>
//                         </div>

//                         {/* Detailed Competition Table */}
//                         <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//                             <h3 className="text-lg font-semibold mb-4">Detailed Competition Report</h3>
//                             <div className="overflow-x-auto">
//                                 <table className="w-full text-sm">
//                                     <thead className="bg-gray-50">
//                                         <tr>
//                                             <th className="px-4 py-3 text-left font-medium text-gray-700">Competition Name</th>
//                                             <th className="px-4 py-3 text-left font-medium text-gray-700">Level</th>
//                                             <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
//                                             <th className="px-4 py-3 text-left font-medium text-gray-700">Student Results</th>
//                                             <th className="px-4 py-3 text-left font-medium text-gray-700">Awards</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody className="divide-y divide-gray-200">
//                                         {competitions.map((comp) => (
//                                             <tr key={comp.comp_id} className="hover:bg-gray-50">
//                                                 <td className="px-4 py-3 font-medium">{comp.name}</td>
//                                                 <td className="px-4 py-3">
//                                                     <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
//                                                         {comp.level}
//                                                     </span>
//                                                 </td>
//                                                 <td className="px-4 py-3 text-gray-600">
//                                                     {new Date(comp.date).toLocaleDateString()}
//                                                 </td>
//                                                 <td className="px-4 py-3">
//                                                     <div className="space-y-1">
//                                                         {comp.results.map((result, idx) => (
//                                                             <div key={idx} className="text-xs">
//                                                                 <span className="font-medium">{result.student}</span>
//                                                                 <span className="text-gray-500"> - Rank {result.rank}</span>
//                                                             </div>
//                                                         ))}
//                                                     </div>
//                                                 </td>
//                                                 <td className="px-4 py-3">
//                                                     <div className="space-y-1">
//                                                         {comp.results.map((result, idx) => (
//                                                             <div key={idx} className="text-xs text-gray-600">
//                                                                 {result.award}
//                                                             </div>
//                                                         ))}
//                                                     </div>
//                                                 </td>
//                                             </tr>
//                                         ))}
//                                     </tbody>
//                                 </table>
//                             </div>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }
import React, { useState, useMemo, useEffect } from "react";
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
import { supabase } from "../../../lib/supabaseClient";
import * as XLSX from "xlsx";

/* Utilities (unchanged) */
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

/* Component */
export default function ClubReportsAnalytics() {
  const [clubs, setClubs] = useState([]);
  const [competitions, setCompetitions] = useState([]); // Will be loaded from DB
  const [perfView, setPerfView] = useState([]); // rows from competition_performance_report view
  const [activeTab, setActiveTab] = useState("clubs");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch club participation data (keeps original logic)
  useEffect(() => {
    const fetchClubData = async () => {
      try {
        // same logic as your original code for clubs
        setLoading(true);
        setError(null);
        console.log("📊 [Reports] Fetching club participation data...");

        const userEmail = localStorage.getItem("userEmail");
        if (!userEmail) {
          console.warn("❌ [Reports] No user email found");
          setLoading(false);
          return;
        }

        let schoolId = null;
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            if (userData.schoolId) {
              schoolId = userData.schoolId;
            }
          } catch (e) {
            console.error("Error parsing stored user:", e);
          }
        }

        if (!schoolId) {
          const { data: educatorData, error: edErr } = await supabase
            .from("school_educators")
            .select("school_id")
            .eq("email", userEmail)
            .maybeSingle();
          if (edErr) console.warn("educator lookup err", edErr);
          if (educatorData?.school_id) schoolId = educatorData.school_id;
        }

        if (!schoolId) {
          const { data: schoolData, error: scErr } = await supabase
            .from("schools")
            .select("id")
            .eq("email", userEmail)
            .maybeSingle();
          if (scErr) console.warn("school lookup err", scErr);
          if (schoolData?.id) schoolId = schoolData.id;
        }

        if (!schoolId) {
          console.warn("❌ [Reports] No school_id found for user");
          setLoading(false);
          return;
        }

        console.log("🏫 [Reports] Fetching data for school_id:", schoolId);

        // club_participation_report view (as you used earlier)
        const { data: reportData, error: reportError } = await supabase
          .from("club_participation_report")
          .select("*")
          .eq("school_id", schoolId)
          .eq("is_active", true);

        if (reportError) {
          console.error("❌ [Reports] Error fetching club report:", reportError);
          setError("Failed to load club data");
          setLoading(false);
          return;
        }

        const transformedClubs = (reportData || []).map((club) => ({
          club_id: club.club_id,
          name: club.club_name,
          category: club.category,
          members: Array(club.student_count || 0).fill(""),
          capacity: club.capacity || 30,
          avgAttendance: club.avg_attendance || 0,
          topPerformers: club.top_performers ? club.top_performers.split(", ") : [],
          participationScore: club.participation_score || 0,
          meeting_day: club.meeting_day,
          meeting_time: club.meeting_time,
          location: club.location,
        }));

        setClubs(transformedClubs);
      } catch (err) {
        console.error("❌ [Reports] Error loading club data:", err);
        setError("An error occurred while loading club data");
      } finally {
        setLoading(false);
      }
    };

    fetchClubData();
  }, []);

  // Fetch competitions and related aggregated data
  useEffect(() => {
    const fetchCompetitions = async () => {
      setLoading(true);
      setError(null);

      try {
        const userEmail = localStorage.getItem("userEmail");
        if (!userEmail) {
          console.warn("❌ [Reports] No user email found");
          setLoading(false);
          return;
        }

        // Determine schoolId (same method)
        let schoolId = null;
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            if (userData.schoolId) {
              schoolId = userData.schoolId;
            }
          } catch (e) { /* ignore */ }
        }

        if (!schoolId) {
          const { data: educatorData } = await supabase
            .from("school_educators")
            .select("school_id")
            .eq("email", userEmail)
            .maybeSingle();
          if (educatorData?.school_id) schoolId = educatorData.school_id;
        }

        if (!schoolId) {
          const { data: schoolData } = await supabase
            .from("schools")
            .select("id")
            .eq("email", userEmail)
            .maybeSingle();
          if (schoolData?.id) schoolId = schoolData.id;
        }

        if (!schoolId) {
          console.warn("❌ [Reports] No school_id found for user - competitions aborted");
          setLoading(false);
          return;
        }

        // 1) Fetch competitions belonging to the school
        const { data: compsData, error: compsErr } = await supabase
          .from("competitions")
          .select("*")
          .eq("school_id", schoolId)
          .order("competition_date", { ascending: false });

        if (compsErr) {
          console.error("Error fetching competitions:", compsErr);
          setError("Failed to load competitions");
          setLoading(false);
          return;
        }

        // 2) Fetch registrations for these competitions
        //    We fetch all registrations for the school's comps and group them in-memory
        const compIds = (compsData || []).map((c) => c.comp_id);
        let registrations = [];
        if (compIds.length) {
          const { data: regData, error: regErr } = await supabase
            .from("competition_registrations")
            .select("comp_id, student_email, team_name, team_members, status, registration_date")
            .in("comp_id", compIds);

          if (regErr) {
            console.warn("registration fetch error", regErr);
          } else {
            registrations = regData || [];
          }
        }

        // 3) Fetch competition results (detailed)
        let results = [];
        if (compIds.length) {
          const { data: resData, error: resErr } = await supabase
            .from("competition_results")
            .select("*")
            .in("comp_id", compIds)
            .order("rank", { ascending: true });

          if (resErr) {
            console.warn("results fetch error", resErr);
          } else {
            results = resData || [];
          }
        }

        // 4) Fetch aggregated performance from the view (if available)
        const { data: perfData, error: perfErr } = await supabase
          .from("competition_performance_report")
          .select("*")
          .eq("school_id", schoolId);

        if (perfErr) {
          console.warn("perf view fetch error", perfErr);
        }

        // Build a map for registrations count and participating clubs estimate
        const regsByComp = registrations.reduce((acc, r) => {
          acc[r.comp_id] = acc[r.comp_id] || { registrations: [], studentEmails: new Set() };
          acc[r.comp_id].registrations.push(r);
          acc[r.comp_id].studentEmails.add(r.student_email);
          return acc;
        }, {});

        // Build results grouped by comp
        const resultsByComp = results.reduce((acc, r) => {
          acc[r.comp_id] = acc[r.comp_id] || [];
          acc[r.comp_id].push(r);
          return acc;
        }, {});

        // Merge into a shape suitable for the UI
        const mergedCompetitions = (compsData || []).map((comp) => {
          const compRegs = regsByComp[comp.comp_id] || { registrations: [], studentEmails: new Set() };
          const compResults = resultsByComp[comp.comp_id] || [];
          // Try to get aggregated row from perf view for more fields
          const perfRow = (perfData || []).find((p) => String(p.comp_id) === String(comp.comp_id));

          return {
            comp_id: comp.comp_id,
            name: comp.name,
            level: comp.level,
            date: comp.competition_date,
            category: comp.category,
            venue: comp.venue,
            team_size_min: comp.team_size_min,
            team_size_max: comp.team_size_max,
            status: comp.status,
            participatingClubs: compRegs.registrations.length ? [...new Set(compRegs.registrations.map(r => r.team_name || r.student_email))] : [], // rough estimate
            registrations: compRegs.registrations,
            results: compResults.map((r) => ({
              student_email: r.student_email,
              rank: r.rank,
              score: r.score,
              award: r.award,
            })),
            total_participants: perfRow?.total_participants ?? compRegs.studentEmails.size,
            award_winners: perfRow?.award_winners ?? (compResults.filter(r => r.award).length),
            awards_won: perfRow?.awards_won ?? compResults.map(r => r.award).filter(Boolean).join(", "),
            avg_score: perfRow?.avg_score ?? (compResults.length ? (compResults.reduce((s,x)=>s+(x.score||0),0)/compResults.length).toFixed(2) : null),
            student_results: perfRow?.student_results ?? compResults.slice(0, 10).map(r => `${r.student_email} (Rank ${r.rank ?? "N/A"})`).join(", "),
            rawPerfRow: perfRow || null,
          };
        });

        setCompetitions(mergedCompetitions);
        setPerfView(perfData || []);
      } catch (err) {
        console.error("Error loading competitions:", err);
        setError("An error occurred while loading competitions");
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitions();
  }, []); // run once

  /* Derived data for charts (competitions) */
  const competitionData = useMemo(() => {
    return competitions.map((comp) => ({
      name: comp.name,
      level: comp.level,
      participants: comp.total_participants || (comp.registrations?.length || 0),
      awards: comp.award_winners || (comp.results?.filter(r => r.award).length || 0),
    }));
  }, [competitions]);

  const awardsByLevel = useMemo(() => {
    // compute from competitions array so it reflects fetched data
    const levels = {};
    competitions.forEach((c) => {
      const lvl = c.level || "unknown";
      levels[lvl] = (levels[lvl] || 0) + (c.award_winners || 0);
    });
    return Object.entries(levels).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      awards: value,
    }));
  }, [competitions]);

  /* clubParticipationData, categoryData (unchanged from your file) */
  const clubParticipationData = useMemo(() => {
    return clubs.map((club) => ({
      name: club.name,
      students: club.members.length,
      capacity: club.capacity,
      attendance: club.avgAttendance,
      participationScore: Math.round((club.members.length / club.capacity) * 100),
    }));
  }, [clubs]);

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

  /* CSV / Excel builders for competitions use the fetched competitions state */
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
      "Date": comp.date,
      "Total Participants": comp.total_participants ?? (comp.registrations?.length || 0),
      "Awards": comp.awards_won || "",
      "Avg Score": comp.avg_score ?? "",
      "Top Results (sample)": comp.student_results || "",
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

  const exportClubsExcel = () => {
    const rows = buildClubParticipationRows();
    if (rows && rows.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Club Participation");

      // Auto-size columns
      const maxWidth = rows.reduce((w, r) => {
        return Object.keys(r).reduce((acc, key) => {
          const value = r[key]?.toString() || "";
          acc[key] = Math.max(acc[key] || 10, value.length);
          return acc;
        }, w);
      }, {});

      worksheet["!cols"] = Object.keys(maxWidth).map((key) => ({ wch: Math.min(maxWidth[key] + 2, 50) }));

      XLSX.writeFile(workbook, "club_participation_report.xlsx");
    }
  };

  const exportCompetitionsExcel = () => {
    const rows = buildCompetitionPerformanceRows();
    if (rows && rows.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Competition Performance");

      // Auto-size columns
      const maxWidth = rows.reduce((w, r) => {
        return Object.keys(r).reduce((acc, key) => {
          const value = r[key]?.toString() || "";
          acc[key] = Math.max(acc[key] || 10, value.length);
          return acc;
        }, w);
      }, {});

      worksheet["!cols"] = Object.keys(maxWidth).map((key) => ({ wch: Math.min(maxWidth[key] + 2, 50) }));

      XLSX.writeFile(workbook, "competition_performance_report.xlsx");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into club participation and competition performance</p>
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
                <p className="text-2xl font-bold text-gray-900">{clubs.reduce((sum, club) => sum + club.members.length, 0)}</p>
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
                <p className="text-2xl font-bold text-gray-900">{competitions.reduce((sum, comp) => sum + (comp.award_winners || 0), 0)}</p>
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
                activeTab === "clubs" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Club Participation Report
            </button>
            <button
              onClick={() => setActiveTab("competitions")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "competitions" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Competition Performance Report
            </button>
          </div>
        </div>

        {/* Loading / Error / Empty states */}
        {loading && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading data...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-medium">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && clubs.length === 0 && activeTab === "clubs" && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <Users className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Clubs Found</h3>
            <p className="text-gray-500">Create clubs in the Skills & Co-Curricular section to see reports here.</p>
          </div>
        )}

        {/* Club Participation Report */}
        {activeTab === "clubs" && !loading && !error && clubs.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Club Participation Analysis</h2>
              <div className="flex gap-2">
                <button onClick={exportClubsCSV} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <FileDown size={18} />
                  Export CSV
                </button>
                <button onClick={exportClubsExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <FileDown size={18} />
                  Export Excel
                </button>
              </div>
            </div>

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

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">Student Distribution by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
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
                        <td className="px-4 py-3">{club.members.length} / {club.capacity}</td>
                        <td className="px-4 py-3">{club.avgAttendance}%</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{club.topPerformers.join(", ")}</td>
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
              <h2 className="text-xl font-semibold text-gray-900">Competition Performance Analysis</h2>
              <div className="flex gap-2">
                <button onClick={exportCompetitionsCSV} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <FileDown size={18} />
                  Export CSV
                </button>
                <button onClick={exportCompetitionsExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <FileDown size={18} />
                  Export Excel
                </button>
              </div>
            </div>

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

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">Competition Participation Overview</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={competitionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="participants" fill="#3b82f6" name="Participating Students" />
                  <Bar dataKey="awards" fill="#f59e0b" name="Awards Won" />
                </BarChart>
              </ResponsiveContainer>
            </div>

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
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">{comp.level}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{new Date(comp.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {(comp.results && comp.results.length) ? comp.results.map((result, idx) => (
                              <div key={idx} className="text-xs">
                                <span className="font-medium">{result.student_email}</span>
                                <span className="text-gray-500"> - Rank {result.rank ?? "N/A"}</span>
                              </div>
                            )) : (
                              <div className="text-xs text-gray-500">{comp.student_results || "No results yet"}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {(comp.awards_won && comp.awards_won.length) ? comp.awards_won.split(", ").map((a, i) => (
                              <div key={i} className="text-xs text-gray-600">{a}</div>
                            )) : <div className="text-xs text-gray-500">No awards</div>}
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
