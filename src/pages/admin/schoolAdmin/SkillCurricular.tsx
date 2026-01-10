
import {
    Calendar,
    CheckCircle,
    ChevronDown,
    Clock,
    Download,
    Edit,
    Eye,
    FileDown,
    Info,
    MapPin,
    Plus,
    Search,
    Trash2,
    Trophy,
    User,
    UserPlus,
    Users,
    X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from 'xlsx';
import { supabase } from "../../../lib/supabaseClient";
import * as clubsService from "../../../services/clubsService";
import * as competitionsService from "../../../services/competitionsService";

import 'react-datepicker/dist/react-datepicker.css';

// Helper function to get school_id from logged-in user (uses organizations table)
async function getSchoolId() {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) return null;
    
    const { data } = await supabase
        .from('organizations')
        .select('id')
        .eq('organization_type', 'school')
        .eq('email', userEmail)
        .maybeSingle();
    
    return data?.id || null;
}

const categories = [
    { id: "all", label: "All" },
    { id: "arts", label: "Arts" },
    { id: "sports", label: "Sports" },
    { id: "robotics", label: "Robotics" },
    { id: "science", label: "Science" },
    { id: "literature", label: "Literature" },
];

function formatDate(d) {
    if (!d) return 'TBD';
    try {
        const dd = new Date(d);
        if (isNaN(dd.getTime())) return 'TBD';
        return dd.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return 'TBD';
    }
}

function downloadCSV(filename, rows) {
    if (!rows || !rows.length) return;
    const header = Object.keys(rows[0]);
    const csv = [header.join("\t")]
        .concat(
            rows.map((r) => header.map((h) => `"${(r[h] ?? "").toString().replace(/"/g, '""')}"`).join("\t"))
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/tab-separated-values;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function exportTableAsPrint(htmlString, title = "Report") {
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return alert("Unable to open export window. Please allow popups.");
    w.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; padding: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background: #f4f4f4; }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        ${htmlString}
      </body>
    </html>
  `);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
}

function ClubCard({ club, isJoined, onJoin, onLeave, onOpenDetails, onEdit, onDelete }) {
    const memberCount = club.members?.length ?? 0;
    const full = memberCount >= club.capacity;

    return (
        <div className="group bg-white rounded-xl hover:shadow-lg transition-all duration-300 overflow-hidden shadow-sm">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white rounded-lg p-2 shadow-sm">
                            <Users size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 text-lg">{club.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                                    {club.category}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">{memberCount}/{club.capacity}</div>
                        <div className="text-xs text-gray-500">Members</div>
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" 
                                style={{ width: `${Math.min((memberCount / club.capacity) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{club.description}</p>

                {/* Meeting Info */}
                {(club.meeting_day || club.meeting_time || club.location) && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
                        <div className="text-xs font-medium text-gray-700 mb-2">Meeting Details</div>
                        {club.meeting_day && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Calendar size={12} />
                                <span>{club.meeting_day}</span>
                            </div>
                        )}
                        {club.meeting_time && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Clock size={12} />
                                <span>{club.meeting_time}</span>
                            </div>
                        )}
                        {club.location && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <MapPin size={12} />
                                <span>{club.location}</span>
                            </div>
                        )}
                    </div>
                )}

                {club.upcomingCompetitions?.length ? (
                    <div className="mb-4">
                        <span className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
                            <Trophy size={12} /> 
                            {club.upcomingCompetitions.length} Upcoming
                        </span>
                    </div>
                ) : null}

                {/* Action Buttons */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onOpenDetails(club)}
                            className="flex items-center justify-center gap-2 flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                        >
                            <Eye size={14} />
                            View Details
                        </button>

                        {!isJoined ? (
                            <button
                                disabled={full}
                                onClick={() => onJoin(club)}
                                className={`flex items-center justify-center gap-2 flex-1 text-sm px-3 py-2 rounded-lg transition-colors ${
                                    full 
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                        : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                            >
                                <UserPlus size={14} />
                                {full ? 'Full' : 'Manage'}
                            </button>
                        ) : (
                            <button
                                onClick={() => onLeave(club)}
                                className="flex items-center justify-center gap-2 flex-1 text-sm px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors"
                            >
                                <X size={14} />
                                Leave
                            </button>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onEdit(club)}
                            className="flex-1 flex items-center justify-center gap-1 text-sm px-3 py-2 border border-blue-200 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                            <Edit size={14} />
                            Edit
                        </button>
                        <button
                            onClick={() => onDelete(club)}
                            className="flex-1 flex items-center justify-center gap-1 text-sm px-3 py-2 border border-red-200 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                        >
                            <Trash2 size={14} />
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Modal({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden z-10">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">{children}</div>
            </div>
        </div>
    );
}

export default function ClubsActivitiesPage() {
    const currentStudent = useMemo(() => ({ id: "s_new", name: "You" }), []);

    const [clubs, setClubs] = useState([]);
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("clubs"); // Add tab state

    // Enhanced tab switching with keyboard support
    const handleTabSwitch = (tab) => {
        setActiveTab(tab);
        // Reset pagination when switching tabs
        if (tab === "clubs") {
            setCurrentPage(1);
        } else if (tab === "competitions") {
            setCurrentCompetitionPage(1);
        }
    };

    // Keyboard navigation for tabs
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === '1') {
                    e.preventDefault();
                    handleTabSwitch("clubs");
                } else if (e.key === '2') {
                    e.preventDefault();
                    handleTabSwitch("competitions");
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    // Add CSS animation styles
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .animate-fadeIn {
                animation: fadeIn 0.3s ease-out;
            }
        `;
        document.head.appendChild(style);
        
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Fetch clubs and competitions from Supabase on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [clubsData, competitionsData] = await Promise.all([
                    clubsService.fetchClubs(),
                    competitionsService.fetchCompetitions()
                ]);
                setClubs(clubsData);
                setCompetitions(competitionsData);
            } catch (error) {
                console.error('Error fetching data:', error);
                // Silently handle initial load errors - data will show as empty
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const [q, setQ] = useState("");
    const [competitionSearchQuery, setCompetitionSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [showMine, setShowMine] = useState(false);
    const [selectedClub, setSelectedClub] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [viewComp, setViewComp] = useState(null);
    const [notice, setNotice] = useState(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [registerCompModal, setRegisterCompModal] = useState(null);
    const [addClubModal, setAddClubModal] = useState(false);
    const [addCompModal, setAddCompModal] = useState(false);
    const [editClubModal, setEditClubModal] = useState(null);
    const [editClubForm, setEditClubForm] = useState({
        name: "",
        category: "arts",
        description: "",
        capacity: 30,
        meeting_day: null,
        meeting_time: null,
        location: ""
    });
    const [studentDrawer, setStudentDrawer] = useState({ open: false, club: null });
    const [allStudents, setAllStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [studentSearchQuery, setStudentSearchQuery] = useState("");
    const [attendanceModal, setAttendanceModal] = useState({ open: false, club: null });
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceTopic, setAttendanceTopic] = useState("");
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [currentCompetitionPage, setCurrentCompetitionPage] = useState(1);

    // Fetch real students from Supabase (only from the same school)
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoadingStudents(true);
                
                // Get logged-in user's email
                const userEmail = localStorage.getItem('userEmail');
                console.log('🔍 [SkillCurricular] Fetching students for user:', userEmail);
                
                if (!userEmail) {
                    console.warn('❌ [SkillCurricular] No user email found in localStorage');
                    setAllStudents([]);
                    setLoadingStudents(false);
                    return;
                }
                
                // Try multiple approaches to get school_id
                let schoolId = null;
                
                // 1. Check localStorage for school admin
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    try {
                        const userData = JSON.parse(storedUser);
                        if (userData.role === 'school_admin' && userData.schoolId) {
                            schoolId = userData.schoolId;
                            console.log('✅ [SkillCurricular] Found school_id from localStorage:', schoolId);
                        }
                    } catch (e) {
                        console.error('Error parsing stored user:', e);
                    }
                }
                
                // 2. Check school_educators table
                if (!schoolId) {
                    const { data: educatorData, error: educatorError } = await supabase
                        .from('school_educators')
                        .select('school_id')
                        .eq('email', userEmail)
                        .maybeSingle();

                    if (educatorError) {
                        console.error('❌ [SkillCurricular] Error fetching educator data:', educatorError);
                    } else if (educatorData?.school_id) {
                        schoolId = educatorData.school_id;
                        console.log('✅ [SkillCurricular] Found school_id from school_educators:', schoolId);
                    }
                }
                
                // 3. Check organizations table (for principal/admin)
                if (!schoolId) {
                    const { data: orgData, error: orgError } = await supabase
                        .from('organizations')
                        .select('id')
                        .eq('organization_type', 'school')
                        .eq('email', userEmail)
                        .maybeSingle();

                    if (orgError) {
                        console.error('❌ [SkillCurricular] Error fetching organization data:', orgError);
                    } else if (orgData?.id) {
                        schoolId = orgData.id;
                        console.log('✅ [SkillCurricular] Found school_id from organizations table:', schoolId);
                    }
                }

                if (!schoolId) {
                    console.warn('❌ [SkillCurricular] No school_id found for user:', userEmail);
                    setAllStudents([]);
                    setLoadingStudents(false);
                    return;
                }

                console.log('📡 [SkillCurricular] Fetching students for school_id:', schoolId);

                // Fetch students from this school only
                const { data, error } = await supabase
                    .from('students')
                    .select('id, email, name, grade, section, roll_number, school_id')
                    .eq('school_id', schoolId)
                    .eq('is_deleted', false)
                    .order('name');

                if (error) {
                    console.error('❌ [SkillCurricular] Error fetching students:', error);
                    setAllStudents([]);
                    setLoadingStudents(false);
                    return;
                }

                if (!data || data.length === 0) {
                    console.log('⚠️ [SkillCurricular] No students found for school_id:', schoolId);
                    setAllStudents([]);
                    setLoadingStudents(false);
                    return;
                }

                // Map students to the format we need (using email as ID)
                const mappedStudents = data.map(student => ({
                    id: student.email,
                    email: student.email,
                    name: student.name || student.email,
                    grade: student.grade || 'N/A',
                    section: student.section,
                    rollNumber: student.roll_number,
                    school_id: student.school_id
                }));
                
                console.log(`✅ [SkillCurricular] Loaded ${mappedStudents.length} students from school ${schoolId}`);
                console.log('📋 [SkillCurricular] Sample student:', mappedStudents[0]);
                setAllStudents(mappedStudents);
                
            } catch (err) {
                console.error('❌ [SkillCurricular] Error loading students:', err);
                setAllStudents([]);
            } finally {
                setLoadingStudents(false);
            }
        };

        fetchStudents();
    }, []);
    const [newCompForm, setNewCompForm] = useState({
        name: "",
        level: "district",
        date: "",
        description: "",
        category: "",
        status: "upcoming",
        results: [],
        participatingClubs: []
    });

    const [newClubForm, setNewClubForm] = useState({
        name: "",
        category: "arts",
        description: "",
        capacity: 30,
        meeting_day: null,
        meeting_time: null,
        location: ""
    });
    const [registrationForm, setRegistrationForm] = useState({
        studentEmail: "",
        teamMembers: "",
        notes: "",
        status: "upcoming"
    });
    
    const [editCompModal, setEditCompModal] = useState(null);
    const [editCompForm, setEditCompForm] = useState({
        name: "",
        level: "district",
        date: "",
        description: "",
        category: "",
        status: "upcoming",
        participatingClubs: []
    });
    const [competitionRegistrations, setCompetitionRegistrations] = useState([]);
    const [loadingRegistrations, setLoadingRegistrations] = useState(false);
    const [editingRegistration, setEditingRegistration] = useState(null);
    const [registrationTab, setRegistrationTab] = useState("individual"); // "individual" or "bulk"
    const [bulkUploadFile, setBulkUploadFile] = useState(null);
    const [bulkUploadProgress, setBulkUploadProgress] = useState(null);

    const joinedClubIds = useMemo(() => {
        return new Set(clubs.filter((c) => c.members.includes(currentStudent.id)).map((c) => c.club_id));
    }, [clubs, currentStudent]);

    const filteredClubs = useMemo(() => {
        return clubs.filter((c) => {
            if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
            if (showMine && !c.members.includes(currentStudent.id)) return false;
            if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
            return true;
        });
    }, [clubs, q, categoryFilter, showMine, currentStudent]);

    const filteredCompetitions = useMemo(() => {
        return competitions.filter((comp) => {
            if (competitionSearchQuery && !comp.name.toLowerCase().includes(competitionSearchQuery.toLowerCase())) return false;
            return true;
        });
    }, [competitions, competitionSearchQuery]);

    const ITEMS_PER_PAGE = 6;
    const totalPages = Math.ceil(filteredClubs.length / ITEMS_PER_PAGE);
    const paginatedClubs = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredClubs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredClubs, currentPage]);

    // Competition pagination
    const COMPETITIONS_PER_PAGE = 6;
    const totalCompetitionPages = Math.ceil(filteredCompetitions.length / COMPETITIONS_PER_PAGE);
    const paginatedCompetitions = useMemo(() => {
        const startIndex = (currentCompetitionPage - 1) * COMPETITIONS_PER_PAGE;
        return filteredCompetitions.slice(startIndex, startIndex + COMPETITIONS_PER_PAGE);
    }, [filteredCompetitions, currentCompetitionPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [q, categoryFilter, showMine]);

    // Reset competition pagination when competitions change or search changes
    useEffect(() => {
        setCurrentCompetitionPage(1);
    }, [competitions, competitionSearchQuery]);

    const enrollStudent = (club) => {
        setStudentDrawer({ open: true, club: club });
    };

    const leaveClub = async (club) => {
        if (!club.members.includes(currentStudent.id)) {
            setNotice({ type: "warning", text: "You are not a member of this club." });
            return;
        }

        try {
            await clubsService.removeStudent(club.club_id, currentStudent.id);
            
            const updated = clubs.map((c) => (c.club_id === club.club_id ? { ...c, members: c.members.filter((m) => m !== currentStudent.id) } : c));
            setClubs(updated);
            setNotice({ type: "info", text: `Left ${club.name}` });
        } catch (error) {
            console.error('Error leaving club:', error);
            setNotice({ type: "error", text: "Failed to leave club. Please try again." });
        }
    };

    const openDetails = (club) => {
        setSelectedClub(club);
        setDetailsOpen(true);
    };

    const openAttendanceModal = (club) => {
        setAttendanceModal({ open: true, club });
        setAttendanceDate(new Date().toISOString().split('T')[0]);
        setAttendanceTopic("");
        // Initialize attendance records for all club members
        const records = {};
        club.members.forEach(memberId => {
            records[memberId] = 'present'; // Default to present
        });
        setAttendanceRecords(records);
    };

    const handleAttendanceStatusChange = (studentId, status) => {
        setAttendanceRecords(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const handleSaveAttendance = async () => {
        if (!attendanceTopic.trim()) {
            setNotice({ type: "error", text: "Please enter a session topic" });
            return;
        }

        try {
            const attendanceRecordsArray = Object.entries(attendanceRecords).map(([studentEmail, status]) => ({
                student_email: studentEmail,
                status: status
            }));

            await clubsService.markAttendance(
                attendanceModal.club?.club_id,
                attendanceDate,
                attendanceTopic,
                attendanceRecordsArray
            );

            const presentCount = Object.values(attendanceRecords).filter(status => status === 'present' || status === 'late').length;
            const totalCount = Object.keys(attendanceRecords).length;

            setNotice({ 
                type: "success", 
                text: `Attendance saved for ${attendanceModal.club?.name}! ${presentCount}/${totalCount} present` 
            });
            
            setAttendanceModal({ open: false, club: null });
            setAttendanceRecords({});
        } catch (error) {
            console.error('Error saving attendance:', error);
            setNotice({ type: "error", text: "Failed to save attendance. Please try again." });
        }
    };
   const handleStudentEnroll = async (studentId, club) => {
    if (club.members.includes(studentId)) {
        setNotice({ type: "warning", text: "Student is already enrolled in this club." });
        return;
    }

    if ((club.members.length ?? 0) >= club.capacity) {
        setNotice({ type: "error", text: "Club is full. Cannot join." });
        return;
    }

    try {
        await clubsService.enrollStudent(club.club_id, studentId);
        
        const updated = clubs.map((c) => 
            c.club_id === club.club_id 
                ? { ...c, members: [...c.members, studentId] } 
                : c
        );
        setClubs(updated);
        setStudentDrawer({ open: true, club: updated.find(c => c.club_id === club.club_id) });
        setNotice({ type: "success", text: `Student enrolled in ${club.name}` });
    } catch (error) {
        console.error('Error enrolling student:', error);
        setNotice({ type: "error", text: "Failed to enroll student. Please try again." });
    }
};

const handleStudentLeave = async (studentId, club) => {
    if (!club.members.includes(studentId)) {
        setNotice({ type: "warning", text: "Student is not a member of this club." });
        return;
    }

    try {
        await clubsService.removeStudent(club.club_id, studentId);
        
        const updated = clubs.map((c) => 
            c.club_id === club.club_id 
                ? { ...c, members: c.members.filter((m) => m !== studentId) } 
                : c
        );
        setClubs(updated);
        setStudentDrawer({ open: true, club: updated.find(c => c.club_id === club.club_id) });
        setNotice({ type: "info", text: `Student removed from ${club.name}` });
    } catch (error) {
        console.error('Error removing student:', error);
        setNotice({ type: "error", text: "Failed to remove student. Please try again." });
    }
};

    const buildClubParticipationRows = async () => {
        try {
            // Fetch from Supabase using the club_participation_report view
            const { data, error } = await supabase
                .from('club_participation_report')
                .select('*');
            
            if (error) {
                console.error('Error fetching club report:', error);
                // Fallback to localStorage data
                return clubs.map((c) => ({
                    "Club Name": c.name,
                    "Student Count": c.members.length,
                    "Average attendance": c.avgAttendance ? c.avgAttendance + '%' : '--',
                    "Top performers": '--',
                    "Participation score": Math.round((c.members.length / c.capacity) * 100) + '%',
                }));
            }
            
            return data.map(row => ({
                "Club Name": row.club_name,
                "Student Count": row.student_count,
                "Average attendance": row.avg_attendance ? row.avg_attendance + '%' : '--',
                "Top performers": row.top_performers || 'N/A',
                "Participation score": row.participation_score ? row.participation_score + '%' : '--'
            }));
        } catch (err) {
            console.error('Error building club report:', err);
            // Fallback to localStorage data
            return clubs.map((c) => ({
                "Club Name": c.name,
                "Student Count": c.members.length,
                "Average attendance": c.avgAttendance ? c.avgAttendance + '%' : '--',
                "Top performers": '--',
                "Participation score": Math.round((c.members.length / c.capacity) * 100) + '%',
            }));
        }
    };

    const buildCompetitionPerformanceRows = async () => {
        try {
            // Fetch from Supabase using the competition_performance_report view
            const { data, error } = await supabase
                .from('competition_performance_report')
                .select('*');
            
            if (error) {
                console.error('Error fetching competition report:', error);
                // Fallback to localStorage data
                return competitions.map((t) => ({
                    "Competition Name": t.name,
                    "Level": t.level,
                    "Student Results": t.results?.length ? JSON.stringify(t.results) : '--',
                    "Awards": '--',
                }));
            }
            
            return data.map(row => ({
                "Competition Name": row.competition_name,
                "Level": row.level,
                "Date": row.competition_date,
                "Total Participants": row.total_participants || 0,
                "Student Results": row.student_results || '--',
                "Awards": row.awards_won || '--',
                "Average Score": row.avg_score || '--'
            }));
        } catch (err) {
            console.error('Error building competition report:', err);
            // Fallback to localStorage data
            return competitions.map((t) => ({
                "Competition Name": t.name,
                "Level": t.level,
                "Student Results": t.results?.length ? JSON.stringify(t.results) : '--',
                "Awards": '--',
            }));
        }
    };

    const exportClubsCSV = async () => {
        const rows = await buildClubParticipationRows();
        if (rows && rows.length > 0) {
            downloadCSV("club_participation.tsv", rows);
        } else {
            setNotice({ type: "error", text: "No data available to export" });
        }
        setShowExportMenu(false);
    };

    const exportCompetitionsCSV = async () => {
        const rows = await buildCompetitionPerformanceRows();
        if (rows && rows.length > 0) {
            downloadCSV("competition_performance.tsv", rows);
        } else {
            setNotice({ type: "error", text: "No data available to export" });
        }
        setShowExportMenu(false);
    };

    const exportClubsPDF = async () => {
        const rows = await buildClubParticipationRows();
        if (rows && rows.length > 0) {
            const html = `<table><thead><tr>${Object.keys(rows[0]).map((k) => `<th>${k}</th>`).join("")}</tr></thead><tbody>${rows
                .map((r) => `<tr>${Object.keys(r).map((k) => `<td>${r[k]}</td>`).join("")}</tr>`)
                .join("")}</tbody></table>`;
            exportTableAsPrint(html, "Club Participation Report");
        } else {
            setNotice({ type: "error", text: "No data available to export" });
        }
        setShowExportMenu(false);
    };

    const exportCompetitionsPDF = async () => {
        const rows = await buildCompetitionPerformanceRows();
        if (rows && rows.length > 0) {
            const html = `<table><thead><tr>${Object.keys(rows[0]).map((k) => `<th>${k}</th>`).join("")}</tr></thead><tbody>${rows
                .map((r) => `<tr>${Object.keys(r).map((k) => `<td>${r[k]}</td>`).join("")}</tr>`)
                .join("")}</tbody></table>`;
            exportTableAsPrint(html, "Competition Performance Report");
        } else {
            setNotice({ type: "error", text: "No data available to export" });
        }
        setShowExportMenu(false);
    };

    const exportClubsExcel = async () => {
        const rows = await buildClubParticipationRows();
        if (rows && rows.length > 0) {
            const worksheet = XLSX.utils.json_to_sheet(rows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Club Participation");
            
            // Auto-size columns
            const maxWidth = rows.reduce((w, r) => {
                return Object.keys(r).reduce((acc, key) => {
                    const value = r[key]?.toString() || '';
                    acc[key] = Math.max(acc[key] || 10, value.length);
                    return acc;
                }, w);
            }, {});
            
            worksheet['!cols'] = Object.keys(maxWidth).map(key => ({ wch: Math.min(maxWidth[key] + 2, 50) }));
            
            XLSX.writeFile(workbook, "club_participation_report.xlsx");
            setNotice({ type: "success", text: "Excel file downloaded successfully!" });
        } else {
            setNotice({ type: "error", text: "No data available to export" });
        }
        setShowExportMenu(false);
    };

    const exportCompetitionsExcel = async () => {
        const rows = await buildCompetitionPerformanceRows();
        if (rows && rows.length > 0) {
            const worksheet = XLSX.utils.json_to_sheet(rows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Competition Performance");
            
            // Auto-size columns
            const maxWidth = rows.reduce((w, r) => {
                return Object.keys(r).reduce((acc, key) => {
                    const value = r[key]?.toString() || '';
                    acc[key] = Math.max(acc[key] || 10, value.length);
                    return acc;
                }, w);
            }, {});
            
            worksheet['!cols'] = Object.keys(maxWidth).map(key => ({ wch: Math.min(maxWidth[key] + 2, 50) }));
            
            XLSX.writeFile(workbook, "competition_performance_report.xlsx");
            setNotice({ type: "success", text: "Excel file downloaded successfully!" });
        } else {
            setNotice({ type: "error", text: "No data available to export" });
        }
        setShowExportMenu(false);
    };

    const handleAddClub = async () => {
        if (!newClubForm.name.trim()) {
            setNotice({ type: "error", text: "Club name is required" });
            return;
        }

        if (!newClubForm.description.trim()) {
            setNotice({ type: "error", text: "Club description is required" });
            return;
        }

        if (newClubForm.capacity < 1) {
            setNotice({ type: "error", text: "Capacity must be at least 1" });
            return;
        }

        try {
            const createdClub = await clubsService.createClub({
                name: newClubForm.name,
                category: newClubForm.category,
                description: newClubForm.description,
                capacity: parseInt(newClubForm.capacity),
                meeting_day: newClubForm.meeting_day || null,
                meeting_time: newClubForm.meeting_time || null,
                location: newClubForm.location || null
            });

            setClubs([...clubs, createdClub]);
            setNotice({ type: "success", text: `${createdClub.name} has been created successfully!` });
            setAddClubModal(false);
            setNewClubForm({ name: "", category: "arts", description: "", capacity: 30, meeting_day: "", meeting_time: "", location: "" });
        } catch (error) {
            console.error('Error creating club:', error);
            setNotice({ type: "error", text: "Failed to create club. Please try again." });
        }
    };

    const handleEditClub = (club) => {
        setEditClubForm({
            name: club.name,
            category: club.category,
            description: club.description,
            capacity: club.capacity,
            meeting_day: club.meeting_day || "",
            meeting_time: club.meeting_time || "",
            location: club.location || ""
        });
        setEditClubModal(club);
    };

    const handleUpdateClub = async () => {
        if (!editClubForm.name.trim()) {
            setNotice({ type: "error", text: "Club name is required" });
            return;
        }

        if (!editClubForm.description.trim()) {
            setNotice({ type: "error", text: "Club description is required" });
            return;
        }

        if (editClubForm.capacity < 1) {
            setNotice({ type: "error", text: "Capacity must be at least 1" });
            return;
        }

        try {
            await clubsService.updateClub(editClubModal.club_id, {
                name: editClubForm.name,
                category: editClubForm.category,
                description: editClubForm.description,
                capacity: parseInt(editClubForm.capacity),
                meeting_day: editClubForm.meeting_day || null,
                meeting_time: editClubForm.meeting_time || null,
                location: editClubForm.location || null
            });

            const updatedClubs = clubs.map(c => 
                c.club_id === editClubModal.club_id 
                    ? { ...c, ...editClubForm, capacity: parseInt(editClubForm.capacity) }
                    : c
            );
            setClubs(updatedClubs);
            
            setNotice({ type: "success", text: `${editClubForm.name} has been updated successfully!` });
            setEditClubModal(null);
            setEditClubForm({ name: "", category: "arts", description: "", capacity: 30, meeting_day: "", meeting_time: "", location: "" });
        } catch (error) {
            console.error('Error updating club:', error);
            setNotice({ type: "error", text: "Failed to update club. Please try again." });
        }
    };

    const handleDeleteClub = async (club) => {
        if (!confirm(`Are you sure you want to delete "${club.name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await clubsService.deleteClub(club.club_id);
            
            const updatedClubs = clubs.filter(c => c.club_id !== club.club_id);
            setClubs(updatedClubs);
            
            setNotice({ type: "success", text: `${club.name} has been deleted successfully!` });
        } catch (error) {
            console.error('Error deleting club:', error);
            setNotice({ type: "error", text: "Failed to delete club. Please try again." });
        }
    };

    // Load registrations when modal opens
    useEffect(() => {
        if (registerCompModal) {
            loadCompetitionRegistrations(registerCompModal.comp_id);
        }
    }, [registerCompModal]);

    // Load registrations when viewing competition details
    useEffect(() => {
        if (viewComp) {
            loadCompetitionRegistrations(viewComp.comp_id);
        }
    }, [viewComp]);

    const loadCompetitionRegistrations = async (compId) => {
        try {
            setLoadingRegistrations(true);
            const registrations = await competitionsService.getCompetitionRegistrations(compId);
            setCompetitionRegistrations(registrations);
        } catch (error) {
            console.error('Error loading registrations:', error);
        } finally {
            setLoadingRegistrations(false);
        }
    };

    const handleRegisterCompetition = async () => {
        if (!registrationForm.studentEmail) {
            setNotice({ type: "error", text: "Please select a student" });
            return;
        }

        // Get student details from allStudents
        const student = allStudents.find(s => s.email === registrationForm.studentEmail);
        if (!student) {
            setNotice({ type: "error", text: "Student not found" });
            return;
        }

        try {
            if (editingRegistration) {
                // Update existing registration
                await competitionsService.updateCompetitionRegistration(
                    editingRegistration.registration_id,
                    {
                        teamMembers: registrationForm.teamMembers,
                        notes: registrationForm.notes
                    }
                );
                setNotice({
                    type: "success",
                    text: `Registration updated successfully!`
                });
            } else {
                // Create new registration
                await competitionsService.registerForCompetition(
                    registerCompModal?.comp_id,
                    registrationForm.studentEmail,
                    {
                        studentName: student.name,
                        studentId: student.email,
                        grade: student.grade,
                        teamMembers: registrationForm.teamMembers,
                        notes: registrationForm.notes
                    }
                );
                setNotice({
                    type: "success",
                    text: `${student.name} registered for ${registerCompModal?.name}!`
                });
            }

            // Update competition status if changed
            if (registrationForm.status && registrationForm.status !== registerCompModal?.status) {
                try {
                    await competitionsService.updateCompetition(registerCompModal.comp_id, {
                        status: registrationForm.status
                    });
                    
                    // Update local state
                    const updatedCompetitions = competitions.map(c => 
                        c.comp_id === registerCompModal.comp_id 
                            ? { ...c, status: registrationForm.status }
                            : c
                    );
                    setCompetitions(updatedCompetitions);
                } catch (statusError) {
                    console.warn('Failed to update competition status:', statusError);
                    // Don't fail the whole registration if status update fails
                }
            }

            // Reload registrations
            await loadCompetitionRegistrations(registerCompModal.comp_id);
            
            // Reset form
            setRegistrationForm({ studentEmail: "", teamMembers: "", notes: "", status: "upcoming" });
            setEditingRegistration(null);
        } catch (error) {
            console.error('Error registering for competition:', error);
            setNotice({ type: "error", text: error.message || "Failed to register. Please try again." });
        }
    };

    const handleEditRegistration = (registration) => {
        setEditingRegistration(registration);
        setRegistrationForm({
            studentEmail: registration.student_email,
            teamMembers: registration.team_members?.members?.join(', ') || '',
            notes: registration.notes || '',
            status: registration.status || 'upcoming'
        });
    };

    const handleDeleteRegistration = async (registrationId) => {
        if (!confirm('Are you sure you want to delete this registration?')) {
            return;
        }

        try {
            await competitionsService.deleteCompetitionRegistration(registrationId);
            setNotice({ type: "success", text: "Registration deleted successfully" });
            await loadCompetitionRegistrations(registerCompModal.comp_id);
        } catch (error) {
            console.error('Error deleting registration:', error);
            setNotice({ type: "error", text: "Failed to delete registration" });
        }
    };

    const handleCancelEdit = () => {
        setEditingRegistration(null);
        setRegistrationForm({ studentEmail: "", teamMembers: "", notes: "", status: "upcoming" });
    };

    // Bulk upload functionality
    const handleBulkUpload = async () => {
        if (!bulkUploadFile) {
            setNotice({ type: "error", text: "Please select a file to upload" });
            return;
        }

        if (!registerCompModal) {
            setNotice({ type: "error", text: "No competition selected" });
            return;
        }

        try {
            setBulkUploadProgress("Reading file...");
            
            const data = await bulkUploadFile.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                setNotice({ type: "error", text: "The uploaded file is empty" });
                setBulkUploadProgress(null);
                return;
            }

            setBulkUploadProgress("Processing registrations...");
            
            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            for (let i = 0; i < jsonData.length; i++) {
                const row = jsonData[i];
                
                try {
                    // Validate required fields
                    if (!row.student_email) {
                        errors.push(`Row ${i + 2}: Student email is required`);
                        errorCount++;
                        continue;
                    }

                    // Find student in our system
                    const student = allStudents.find(s => 
                        s.email.toLowerCase() === row.student_email.toLowerCase()
                    );

                    if (!student) {
                        errors.push(`Row ${i + 2}: Student ${row.student_email} not found in system`);
                        errorCount++;
                        continue;
                    }

                    // Check if already registered
                    const existingRegistration = competitionRegistrations.find(reg => 
                        reg.student_email.toLowerCase() === row.student_email.toLowerCase()
                    );

                    if (existingRegistration) {
                        errors.push(`Row ${i + 2}: Student ${row.student_email} is already registered`);
                        errorCount++;
                        continue;
                    }

                    // Process team members if provided
                    let teamMembers = [];
                    if (row.team_members && typeof row.team_members === 'string') {
                        teamMembers = row.team_members.split(',').map(name => name.trim()).filter(name => name);
                    }

                    // Register the student
                    await competitionsService.registerForCompetition(
                        registerCompModal.comp_id,
                        row.student_email,
                        {
                            studentName: student.name,
                            studentId: student.email,
                            grade: student.grade,
                            teamMembers: teamMembers.join(', '),
                            notes: row.notes || ''
                        }
                    );

                    successCount++;
                    setBulkUploadProgress(`Processed ${i + 1}/${jsonData.length} registrations...`);
                    
                } catch (error) {
                    console.error(`Error processing row ${i + 2}:`, error);
                    errors.push(`Row ${i + 2}: ${error.message || 'Registration failed'}`);
                    errorCount++;
                }
            }

            // Show results
            if (successCount > 0) {
                setNotice({ 
                    type: "success", 
                    text: `Bulk upload completed! ${successCount} students registered successfully${errorCount > 0 ? `, ${errorCount} errors` : ''}` 
                });
                
                // Reload registrations
                await loadCompetitionRegistrations(registerCompModal.comp_id);
            } else {
                setNotice({ 
                    type: "error", 
                    text: `Bulk upload failed. ${errorCount} errors occurred.` 
                });
            }

            // Show detailed errors if any
            if (errors.length > 0 && errors.length <= 5) {
                console.log("Upload errors:", errors);
                setTimeout(() => {
                    alert("Upload errors:\n" + errors.join('\n'));
                }, 1000);
            }

            // Reset form
            setBulkUploadFile(null);
            setBulkUploadProgress(null);
            
        } catch (error) {
            console.error('Bulk upload error:', error);
            setNotice({ type: "error", text: "Failed to process bulk upload. Please check file format." });
            setBulkUploadProgress(null);
        }
    };

    const downloadBulkTemplate = () => {
        const templateData = [
            {
                student_email: "student1@example.com",
                team_members: "John Doe, Jane Smith",
                notes: "Special requirements or notes"
            },
            {
                student_email: "student2@example.com", 
                team_members: "",
                notes: "Individual participation"
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Competition Registration");
        
        // Add column headers with descriptions
        const headerDescriptions = [
            "Student Email (Required) - Must match student email in system",
            "Team Members (Optional) - Comma-separated names for team events", 
            "Notes (Optional) - Any special requirements or notes"
        ];
        
        // Auto-size columns
        worksheet['!cols'] = [
            { wch: 30 }, // student_email
            { wch: 40 }, // team_members  
            { wch: 50 }  // notes
        ];
        
        XLSX.writeFile(workbook, `${registerCompModal?.name || 'competition'}_registration_template.xlsx`);
        setNotice({ type: "success", text: "Template downloaded successfully!" });
    };
    const handleAddCompetition = async () => {
        if (!newCompForm.name.trim()) {
            setNotice({ type: "error", text: "Competition name is required" });
            return;
        }

        if (!newCompForm.date) {
            setNotice({ type: "error", text: "Competition date is required" });
            return;
        }

        try {
            const createdCompetition = await competitionsService.createCompetition({
                name: newCompForm.name,
                level: newCompForm.level,
                date: newCompForm.date,
                description: newCompForm.description,
                category: newCompForm.category,
                status: newCompForm.status,
                participatingClubs: newCompForm.participatingClubs
            });

            setCompetitions([...competitions, createdCompetition]);

            setNotice({ type: "success", text: `${createdCompetition.name} added successfully!` });
            setAddCompModal(false);
            setNewCompForm({
                name: "",
                level: "district",
                date: "",
                description: "",
                category: "",
                status: "upcoming",
                participatingClubs: []
            });
        } catch (error) {
            console.error('Error creating competition:', error);
            setNotice({ type: "error", text: "Failed to create competition. Please try again." });
        }
    };

    const handleEditCompetition = (comp) => {
        setEditCompForm({
            name: comp.name,
            level: comp.level,
            date: comp.competition_date || comp.date,
            description: comp.description || "",
            category: comp.category || "",
            status: comp.status || "upcoming",
            participatingClubs: comp.participatingClubs || []
        });
        setEditCompModal(comp);
    };

    const handleUpdateCompetition = async () => {
        if (!editCompForm.name.trim()) {
            setNotice({ type: "error", text: "Competition name is required" });
            return;
        }

        if (!editCompForm.date) {
            setNotice({ type: "error", text: "Competition date is required" });
            return;
        }

        try {
            await competitionsService.updateCompetition(editCompModal.comp_id, {
                name: editCompForm.name,
                level: editCompForm.level,
                date: editCompForm.date,
                description: editCompForm.description,
                category: editCompForm.category,
                status: editCompForm.status,
                participatingClubs: editCompForm.participatingClubs
            });

            const updatedCompetitions = competitions.map(c => 
                c.comp_id === editCompModal.comp_id 
                    ? { ...c, ...editCompForm, competition_date: editCompForm.date }
                    : c
            );
            setCompetitions(updatedCompetitions);
            
            setNotice({ type: "success", text: `${editCompForm.name} has been updated successfully!` });
            setEditCompModal(null);
            setEditCompForm({
                name: "",
                level: "district",
                date: "",
                description: "",
                category: "",
                status: "upcoming",
                participatingClubs: []
            });
        } catch (error) {
            console.error('Error updating competition:', error);
            setNotice({ type: "error", text: "Failed to update competition. Please try again." });
        }
    };

    const handleDeleteCompetition = async (comp) => {
        if (!confirm(`Are you sure you want to delete "${comp.name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await competitionsService.deleteCompetition(comp.comp_id);
            
            const updatedCompetitions = competitions.filter(c => c.comp_id !== comp.comp_id);
            setCompetitions(updatedCompetitions);
            
            setNotice({ type: "success", text: `${comp.name} has been deleted successfully!` });
        } catch (error) {
            console.error('Error deleting competition:', error);
            setNotice({ type: "error", text: "Failed to delete competition. Please try again." });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
            <div className="max-w-7xl mx-auto p-6">
                {/* Modern Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Skills & Co-Curricular</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-blue-600" />
                                    <span>{clubs.length} Clubs</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Trophy size={16} className="text-amber-600" />
                                    <span>{competitions.length} Competitions</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-green-600" />
                                    <span>{clubs.reduce((acc, club) => acc + club.members.length, 0)} Total Members</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <button
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                                >
                                    <FileDown size={16} />
                                    <span>Export Reports</span>
                                    <ChevronDown size={16} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                                </button>

                                {showExportMenu && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                                        <div className="p-2">
                                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">Clubs Reports</div>
                                            <button
                                                onClick={exportClubsCSV}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-2"
                                            >
                                                <FileDown size={14} className="text-green-600" />
                                                Export Clubs (CSV)
                                            </button>
                                            <button
                                                onClick={exportClubsExcel}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-2"
                                            >
                                                <FileDown size={14} className="text-blue-600" />
                                                Export Clubs (Excel)
                                            </button>
                                            <button
                                                onClick={exportClubsPDF}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-2"
                                            >
                                                <FileDown size={14} className="text-red-600" />
                                                Export Clubs (PDF)
                                            </button>

                                            <div className="border-t border-gray-100 my-2"></div>

                                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Competitions Reports</div>
                                            <button
                                                onClick={exportCompetitionsCSV}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-2"
                                            >
                                                <FileDown size={14} className="text-green-600" />
                                                Export Competitions (CSV)
                                            </button>
                                            <button
                                                onClick={exportCompetitionsExcel}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-2"
                                            >
                                                <FileDown size={14} className="text-blue-600" />
                                                Export Competitions (Excel)
                                            </button>
                                            <button
                                                onClick={exportCompetitionsPDF}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-2"
                                            >
                                                <FileDown size={14} className="text-red-600" />
                                                Export Competitions (PDF)
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Tab Navigation */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        {/* Tab Buttons with Enhanced Design */}
                        <div className="relative flex items-center bg-gray-100 rounded-lg p-2 gap-2 min-w-fit">
                            {/* Sliding Background Indicator */}
                            <div 
                                className={`absolute top-2 bottom-2 rounded-md transition-all duration-500 ease-in-out shadow-lg ${
                                    activeTab === "clubs" 
                                        ? "bg-blue-600" 
                                        : "bg-blue-600"
                                }`}
                                style={{ 
                                    width: 'calc(50% - 6px)',
                                    left: activeTab === "clubs" ? '8px' : 'calc(50% + 2px)',
                                }}
                            />
                            
                            <button
                                onClick={() => handleTabSwitch("clubs")}
                                className={`relative z-10 px-8 py-3 rounded-md font-medium transition-all duration-300 min-w-fit ${
                                    activeTab === "clubs"
                                        ? "text-white"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                                title="Switch to Clubs (Ctrl+1)"
                            >
                                <div className="flex items-center gap-3">
                                    <Users size={18} className={`transition-all duration-300 ${
                                        activeTab === "clubs" ? "scale-110" : ""
                                    }`} />
                                    <span className="whitespace-nowrap font-semibold">Clubs</span>
                                    <span className={`text-xs px-2.5 py-1 rounded-full transition-all duration-300 font-medium ${
                                        activeTab === "clubs" 
                                            ? "bg-white/20 text-white" 
                                            : "bg-blue-100 text-blue-700"
                                    }`}>
                                        {clubs.length}
                                    </span>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => handleTabSwitch("competitions")}
                                className={`relative z-10 px-8 py-3 rounded-md font-medium transition-all duration-300 min-w-fit ${
                                    activeTab === "competitions"
                                        ? "text-white"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                                title="Switch to Competitions (Ctrl+2)"
                            >
                                <div className="flex items-center gap-3">
                                    <Trophy size={18} className={`transition-all duration-300 ${
                                        activeTab === "competitions" ? "scale-110" : ""
                                    }`} />
                                    <span className="whitespace-nowrap font-semibold">Competitions</span>
                                    <span className={`text-xs px-2.5 py-1 rounded-full transition-all duration-300 font-medium ${
                                        activeTab === "competitions" 
                                            ? "bg-white/20 text-white" 
                                            : "bg-blue-100 text-blue-700"
                                    }`}>
                                        {competitions.length}
                                    </span>
                                </div>
                            </button>
                        </div>
                        
                        {/* Enhanced Add Button with Animation */}
                        <button
                            onClick={() => activeTab === "clubs" ? setAddClubModal(true) : setAddCompModal(true)}
                            className={`group flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                                activeTab === "clubs"
                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                        >
                            <Plus size={16} className="transition-transform duration-300 group-hover:rotate-90" />
                            <span>Add {activeTab === "clubs" ? "Club" : "Competition"}</span>
                        </button>
                    </div>

                    {/* Tab Content Indicator */}
                    <div className={`h-1 transition-all duration-500 ${
                        activeTab === "clubs" ? "bg-blue-600" : "bg-blue-600"
                    }`} />
                </div>

                {/* Enhanced Search and Filter Bar - Only show for clubs tab */}
                {activeTab === "clubs" && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                            {/* Search */}
                            <div className="lg:col-span-6 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Search clubs by name..."
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Category Filter */}
                            <div className="lg:col-span-3">
                                <div className="relative">
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                                    >
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* My Clubs Toggle */}
                            <div className="lg:col-span-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={showMine} 
                                        onChange={(e) => setShowMine(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">My Clubs Only</span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Enhanced Search and Filter Bar - Only show for competitions tab */}
                {activeTab === "competitions" && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                            {/* Search */}
                            <div className="lg:col-span-8 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    value={competitionSearchQuery}
                                    onChange={(e) => setCompetitionSearchQuery(e.target.value)}
                                    placeholder="Search competitions by name..."
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Clear Search Button */}
                            <div className="lg:col-span-4">
                                {competitionSearchQuery && (
                                    <button
                                        onClick={() => setCompetitionSearchQuery("")}
                                        className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        <X size={16} />
                                        Clear Search
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Enhanced Notice */}
                {notice && (
                    <div className={`mb-6 p-4 rounded-xl border-l-4 ${
                        notice.type === "error" 
                            ? "bg-red-50 border-red-400 text-red-700" 
                            : notice.type === "success" 
                            ? "bg-green-50 border-green-400 text-green-700" 
                            : "bg-blue-50 border-blue-400 text-blue-700"
                    }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{notice.text}</span>
                            </div>
                            <button 
                                onClick={() => setNotice(null)} 
                                className="text-sm underline hover:no-underline"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                {/* Tab Content */}
                <div className="transition-all duration-300 ease-in-out">
                    {activeTab === "clubs" && (
                        <section className="mb-10 animate-fadeIn">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Active Clubs</h2>
                                    <p className="text-gray-600 mt-1">Manage and monitor club activities</p>
                                </div>
                                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                    {filteredClubs.length} of {clubs.length} clubs
                                </div>
                            </div>

                            {filteredClubs.length === 0 ? (
                                <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                                    <Users size={48} className="text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No clubs found</h3>
                                    <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
                                    <button
                                        onClick={() => setAddClubModal(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Plus size={16} />
                                        Create First Club
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {paginatedClubs.map((club) => (
                                            <ClubCard
                                                key={club.club_id}
                                                club={club}
                                                isJoined={joinedClubIds.has(club.club_id)}
                                                onJoin={enrollStudent}
                                                onLeave={leaveClub}
                                                onOpenDetails={openDetails}
                                                onEdit={handleEditClub}
                                                onDelete={handleDeleteClub}
                                            />
                                        ))}
                                    </div>

                                    {/* Enhanced Pagination */}
                                    {totalPages > 1 && (
                                        <div className="mt-8 flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
                                            <button
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                            >
                                                ← Previous
                                            </button>
                                            
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-gray-600">
                                                    Page {currentPage} of {totalPages}
                                                </span>
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                    {filteredClubs.length} total clubs
                                                </span>
                                            </div>
                                            
                                            <button
                                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                disabled={currentPage === totalPages}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Next →
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    )}

                    {/* Competitions Tab Content */}
                    {activeTab === "competitions" && (
                        <section className="animate-fadeIn">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Competitions</h2>
                                    <p className="text-gray-600 mt-1">Track and manage competitive events</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                        {filteredCompetitions.length} of {competitions.length} competitions
                                    </div>
                                </div>
                            </div>

                            {filteredCompetitions.length === 0 ? (
                                <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                                    <Trophy size={48} className="text-gray-300 mx-auto mb-4" />
                                    {competitionSearchQuery ? (
                                        <>
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No competitions found</h3>
                                            <p className="text-gray-500 mb-4">No competitions match your search "{competitionSearchQuery}"</p>
                                            <button
                                                onClick={() => setCompetitionSearchQuery("")}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                            >
                                                <X size={16} />
                                                Clear Search
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No competitions yet</h3>
                                            <p className="text-gray-500 mb-4">Create your first competition to get started</p>
                                            <button
                                                onClick={() => setAddCompModal(true)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <Plus size={16} />
                                                Create Competition
                                            </button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {paginatedCompetitions.map((comp) => (
                                            <div key={comp.comp_id} className="bg-white rounded-xl hover:shadow-lg transition-all duration-300 overflow-hidden shadow-sm">
                                                {/* Competition Header */}
                                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-white rounded-lg p-2 shadow-sm">
                                                                <Trophy size={20} className="text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold text-gray-900">{comp.name}</h3>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-xs text-gray-500 capitalize">{comp.level}</span>
                                                                    <span className="text-xs text-gray-400">•</span>
                                                                    <span className="text-xs text-gray-500">{formatDate(comp.competition_date || comp.date)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Competition Content */}
                                                <div className="p-4">
                                                    <div className="mb-4">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                            comp.status === 'upcoming' ? 'bg-gray-100 text-blue-700' :
                                                            comp.status === 'ongoing' ? 'bg-blue-100 text-green-700' :
                                                            comp.status === 'completed' ? 'bg-green-100 text-gray-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                            {comp.status === 'upcoming' ? 'Upcoming' :
                                                             comp.status === 'ongoing' ? 'Ongoing' :
                                                             comp.status === 'completed' ? 'Completed' :
                                                             '❌ Cancelled'}
                                                        </span>
                                                    </div>

                                                    {comp.category && (
                                                        <div className="mb-3">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 capitalize">
                                                                {comp.category}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-xs text-gray-600">Participating Clubs</div>
                                                            <div className="text-sm font-semibold text-gray-900">
                                                                {comp.participatingClubs?.length ?? 0}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                className="flex items-center justify-center gap-2 flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                                                                onClick={() => setViewComp(comp)}
                                                            >
                                                                View Details
                                                            </button>
                                                            <button
                                                                onClick={() => setRegisterCompModal(comp)}
                                                                className="flex items-center justify-center gap-2 flex-1 text-sm px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                                            >
                                                                Register
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleEditCompetition(comp)}
                                                                className="flex-1 flex items-center justify-center gap-1 text-sm px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                                                            >
                                                                <Edit size={14} />
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteCompetition(comp)}
                                                                className="flex-1 flex items-center justify-center gap-1 text-sm px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Competition Pagination */}
                                    {totalCompetitionPages > 1 && (
                                        <div className="mt-8 flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
                                            <button
                                                onClick={() => setCurrentCompetitionPage(Math.max(1, currentCompetitionPage - 1))}
                                                disabled={currentCompetitionPage === 1}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                            >
                                                ← Previous
                                            </button>
                                            
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-gray-600">
                                                    Page {currentCompetitionPage} of {totalCompetitionPages}
                                                </span>
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                    {filteredCompetitions.length} total competitions
                                                </span>
                                            </div>
                                            
                                            <button
                                                onClick={() => setCurrentCompetitionPage(Math.min(totalCompetitionPages, currentCompetitionPage + 1))}
                                                disabled={currentCompetitionPage === totalCompetitionPages}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Next →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    )}
                </div>

                <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)} title={selectedClub?.name ?? "Details"}>
                    {selectedClub ? (
                        <div>
                            <div className="mb-3 text-sm text-slate-600">Category: {selectedClub.category}</div>
                            <div className="mb-3 text-sm">{selectedClub.description}</div>

                            <div className="mb-4">
                                <div className="text-xs text-slate-500 mb-2">Members ({selectedClub.members.length}/{selectedClub.capacity})</div>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {selectedClub.members.length > 0 ? (
                                        selectedClub.members.map((m) => (
                                            <div key={m} className="px-2 py-1 bg-gray-100 rounded-full text-xs">{m}</div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-slate-500">No members yet</div>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                <div className="text-sm font-medium text-blue-900 mb-2">Meeting Details</div>
                                <div className="text-xs text-blue-700 space-y-1">
                                    <div>📅 {selectedClub.meeting_day || 'TBD'}</div>
                                    <div>🕐 {selectedClub.meeting_time || 'TBD'}</div>
                                    <div>📍 {selectedClub.location || 'TBD'}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                                <button 
                                    onClick={() => { 
                                        enrollStudent(selectedClub); 
                                        setDetailsOpen(false); 
                                    }} 
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                                >
                                    Manage Members
                                </button>

                                <button 
                                    onClick={() => { 
                                        openAttendanceModal(selectedClub); 
                                        setDetailsOpen(false); 
                                    }} 
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                    disabled={selectedClub.members.length === 0}
                                >
                                    Mark Attendance
                                </button>

                                <button onClick={() => setDetailsOpen(false)} className="px-3 py-2 border rounded-md text-sm">Close</button>
                            </div>
                        </div>
                    ) : null}
                </Modal>

                <Modal open={addClubModal} onClose={() => setAddClubModal(false)} title="Add New Club">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Club Name *</label>
                            <input
                                type="text"
                                value={newClubForm.name}
                                onChange={(e) => setNewClubForm({ ...newClubForm, name: e.target.value })}
                                placeholder="Enter club name"
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Category *</label>
                            <select
                                value={newClubForm.category}
                                onChange={(e) => setNewClubForm({ ...newClubForm, category: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="arts">Arts</option>
                                <option value="sports">Sports</option>
                                <option value="robotics">Robotics</option>
                                <option value="science">Science</option>
                                <option value="literature">Literature</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Description *</label>
                            <textarea
                                value={newClubForm.description}
                                onChange={(e) => setNewClubForm({ ...newClubForm, description: e.target.value })}
                                placeholder="Enter club description"
                                rows={3}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Capacity *</label>
                            <input
                                type="number"
                                value={newClubForm.capacity}
                                onChange={(e) => setNewClubForm({ ...newClubForm, capacity: e.target.value })}
                                min="1"
                                placeholder="Maximum members"
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <div className="text-sm font-medium text-blue-900 mb-3">Meeting Details</div>
                            
                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1">📅 Meeting Day</label>
                                <select
                                    value={newClubForm.meeting_day}
                                    onChange={(e) => setNewClubForm({ ...newClubForm, meeting_day: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a day</option>
                                    <option value="Monday">Monday</option>
                                    <option value="Tuesday">Tuesday</option>
                                    <option value="Wednesday">Wednesday</option>
                                    <option value="Thursday">Thursday</option>
                                    <option value="Friday">Friday</option>
                                    <option value="Saturday">Saturday</option>
                                    <option value="Sunday">Sunday</option>
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1">🕐 Meeting Time</label>
                                <input
                                    type="time"
                                    value={newClubForm.meeting_time}
                                    onChange={(e) => setNewClubForm({ ...newClubForm, meeting_time: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1">📍 Location</label>
                                <input
                                    type="text"
                                    value={newClubForm.location}
                                    onChange={(e) => setNewClubForm({ ...newClubForm, location: e.target.value })}
                                    placeholder="e.g., Room 101, Auditorium"
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                            <button
                                onClick={handleAddClub}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Create Club
                            </button>
                            <button
                                onClick={() => setAddClubModal(false)}
                                className="px-4 py-2 border rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Edit Club Modal */}
                <Modal open={!!editClubModal} onClose={() => setEditClubModal(null)} title="Edit Club">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Club Name *</label>
                            <input
                                type="text"
                                value={editClubForm.name}
                                onChange={(e) => setEditClubForm({ ...editClubForm, name: e.target.value })}
                                placeholder="Enter club name"
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Category *</label>
                            <select
                                value={editClubForm.category}
                                onChange={(e) => setEditClubForm({ ...editClubForm, category: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="arts">Arts</option>
                                <option value="sports">Sports</option>
                                <option value="robotics">Robotics</option>
                                <option value="science">Science</option>
                                <option value="literature">Literature</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Description *</label>
                            <textarea
                                value={editClubForm.description}
                                onChange={(e) => setEditClubForm({ ...editClubForm, description: e.target.value })}
                                placeholder="Enter club description"
                                rows={3}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Capacity *</label>
                            <input
                                type="number"
                                value={editClubForm.capacity}
                                onChange={(e) => setEditClubForm({ ...editClubForm, capacity: e.target.value })}
                                min="1"
                                placeholder="Maximum members"
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <div className="text-sm font-medium text-blue-900 mb-3">Meeting Details</div>
                            
                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1">Meeting Day</label>
                                <select
                                    value={editClubForm.meeting_day}
                                    onChange={(e) => setEditClubForm({ ...editClubForm, meeting_day: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a day</option>
                                    <option value="Monday">Monday</option>
                                    <option value="Tuesday">Tuesday</option>
                                    <option value="Wednesday">Wednesday</option>
                                    <option value="Thursday">Thursday</option>
                                    <option value="Friday">Friday</option>
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1">Meeting Time</label>
                                <input
                                    type="time"
                                    value={editClubForm.meeting_time}
                                    onChange={(e) => setEditClubForm({ ...editClubForm, meeting_time: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1"> Location</label>
                                <input
                                    type="text"
                                    value={editClubForm.location}
                                    onChange={(e) => setEditClubForm({ ...editClubForm, location: e.target.value })}
                                    placeholder="e.g., Room 101, Auditorium"
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                        </div>

                        <div className="flex items-center gap-3 pt-4">
                            <button
                                onClick={handleUpdateClub}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Update Club
                            </button>
                            <button
                                onClick={() => setEditClubModal(null)}
                                className="px-4 py-2 border rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>

                <Modal
                    open={!!registerCompModal}
                    onClose={() => {
                        setRegisterCompModal(null);
                        setEditingRegistration(null);
                        setRegistrationForm({ studentEmail: "", teamMembers: "", notes: "", status: "upcoming" });
                        setRegistrationTab("individual");
                        setBulkUploadFile(null);
                        setBulkUploadProgress(null);
                    }}
                    title={`${editingRegistration ? 'Edit' : 'Register for'} ${registerCompModal?.name ?? ""}`}
                >
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-3 rounded-md text-sm">
                            <div className="flex items-center justify-between">
                                <div className="font-medium">{registerCompModal?.name}</div>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    registerCompModal?.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                                    registerCompModal?.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                                    registerCompModal?.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                    {registerCompModal?.status === 'upcoming' ? ' Upcoming' :
                                     registerCompModal?.status === 'ongoing' ? 'Ongoing' :
                                     registerCompModal?.status === 'completed' ? 'Completed' :
                                     '❌ Cancelled'}
                                </span>
                            </div>
                            <div className="text-xs text-slate-600 mt-1">
                                {registerCompModal?.level} • {formatDate(registerCompModal?.competition_date || registerCompModal?.date)}
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                            <button
                                onClick={() => setRegistrationTab("individual")}
                                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                    registrationTab === "individual"
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <User size={16} />
                                    Individual Registration
                                </div>
                            </button>
                            <button
                                onClick={() => setRegistrationTab("bulk")}
                                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                    registrationTab === "bulk"
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Users size={16} />
                                    Bulk Upload
                                </div>
                            </button>
                        </div>

                        {/* Individual Registration Tab */}
                        {registrationTab === "individual" && (
                            <div className="space-y-4">
                                {/* Existing Registrations */}
                                {!editingRegistration && competitionRegistrations.length > 0 && (
                                    <div className="border rounded-lg p-3 bg-gray-50">
                                        <h4 className="text-sm font-semibold mb-2">Registered Students ({competitionRegistrations.length})</h4>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {competitionRegistrations.map((reg) => {
                                                const student = allStudents.find(s => s.email === reg.student_email);
                                                return (
                                                    <div key={reg.registration_id} className="flex items-center justify-between p-2 bg-white rounded border">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm">{student?.name || reg.student_email}</div>
                                                            <div className="text-xs text-slate-500">{student?.grade || 'N/A'} • {reg.student_email}</div>
                                                            {reg.team_members?.members && (
                                                                <div className="text-xs text-blue-600 mt-1">Team: {reg.team_members.members.join(', ')}</div>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => handleEditRegistration(reg)}
                                                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteRegistration(reg.registration_id)}
                                                                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Registration Form */}
                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-semibold mb-3">{editingRegistration ? 'Edit Registration' : 'Add New Registration'}</h4>
                                    
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Student Email *</label>
                                            <select
                                                value={registrationForm.studentEmail}
                                                onChange={(e) => setRegistrationForm({ ...registrationForm, studentEmail: e.target.value })}
                                                disabled={!!editingRegistration}
                                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                            >
                                                <option value="">Select a student</option>
                                                {allStudents.map((student) => (
                                                    <option key={student.email} value={student.email}>
                                                        {student.name} - {student.grade} ({student.email})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {registrationForm.studentEmail && (() => {
                                            const selectedStudent = allStudents.find(s => s.email === registrationForm.studentEmail);
                                            return selectedStudent ? (
                                                <div className="bg-green-50 p-3 rounded-lg text-sm">
                                                    <div className="font-medium text-green-900">Selected Student:</div>
                                                    <div className="text-green-700 mt-1">
                                                        <div>Name: {selectedStudent.name}</div>
                                                        <div>Grade/Class: {selectedStudent.grade}</div>
                                                        <div>Email: {selectedStudent.email}</div>
                                                    </div>
                                                </div>
                                            ) : null;
                                        })()}

                                        <div>
                                            <label className="block text-sm font-medium mb-1">Team Members (if applicable)</label>
                                            <input
                                                type="text"
                                                value={registrationForm.teamMembers}
                                                onChange={(e) => setRegistrationForm({ ...registrationForm, teamMembers: e.target.value })}
                                                placeholder="Comma-separated names (e.g., John Doe, Jane Smith)"
                                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">Leave empty for individual participation</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">Competition Status</label>
                                            <select
                                                value={registrationForm.status || registerCompModal?.status || 'upcoming'}
                                                onChange={(e) => setRegistrationForm({ ...registrationForm, status: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="upcoming">Upcoming</option>
                                                <option value="ongoing">Ongoing</option>
                                                <option value="completed">Completed</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                            <p className="text-xs text-slate-500 mt-1">Current status of the competition</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">Additional Notes</label>
                                            <textarea
                                                value={registrationForm.notes}
                                                onChange={(e) => setRegistrationForm({ ...registrationForm, notes: e.target.value })}
                                                placeholder="Any special requirements or notes"
                                                rows={2}
                                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-4 border-t">
                                    <button
                                        onClick={handleRegisterCompetition}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        {editingRegistration ? 'Update Registration' : 'Submit Registration'}
                                    </button>
                                    {editingRegistration && (
                                        <button
                                            onClick={handleCancelEdit}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                        >
                                            Cancel Edit
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            setRegisterCompModal(null);
                                            setEditingRegistration(null);
                                            setRegistrationForm({ studentEmail: "", teamMembers: "", notes: "", status: "upcoming" });
                                        }}
                                        className="px-4 py-2 border rounded-md hover:bg-gray-50"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Bulk Upload Tab */}
                        {registrationTab === "bulk" && (
                            <div className="space-y-4">
                                {/* Existing Registrations Summary */}
                                {competitionRegistrations.length > 0 && (
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-medium text-blue-900">
                                                Current Registrations: {competitionRegistrations.length} students
                                            </div>
                                            <button
                                                onClick={() => setRegistrationTab("individual")}
                                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Instructions */}
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Info size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-semibold text-amber-900 mb-2">Bulk Upload Instructions</h4>
                                            <ul className="text-xs text-amber-800 space-y-1">
                                                <li>• Download the template file and fill in student details</li>
                                                <li>• Student emails must match exactly with students in your system</li>
                                                <li>• Team members should be comma-separated (optional)</li>
                                                <li>• Save as Excel (.xlsx) or CSV format</li>
                                                <li>• Maximum 100 students per upload</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Template Download */}
                                <div className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900">Step 1: Download Template</h4>
                                            <p className="text-xs text-gray-600 mt-1">Get the Excel template with proper format</p>
                                        </div>
                                        <button
                                            onClick={downloadBulkTemplate}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <Download size={16} />
                                            Download Template
                                        </button>
                                    </div>
                                </div>

                                {/* File Upload */}
                                <div className="border rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Step 2: Upload Completed File</h4>
                                    
                                    <div className="space-y-3">
                                        <div>
                                            <input
                                                type="file"
                                                accept=".xlsx,.xls,.csv"
                                                onChange={(e) => setBulkUploadFile(e.target.files[0])}
                                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Supported formats: Excel (.xlsx, .xls) or CSV</p>
                                        </div>

                                        {bulkUploadFile && (
                                            <div className="bg-green-50 p-3 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle size={16} className="text-green-600" />
                                                    <span className="text-sm text-green-900">
                                                        File selected: {bulkUploadFile.name}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {bulkUploadProgress && (
                                            <div className="bg-blue-50 p-3 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                    <span className="text-sm text-blue-900">{bulkUploadProgress}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Upload Actions */}
                                <div className="flex items-center gap-3 pt-4 border-t">
                                    <button
                                        onClick={handleBulkUpload}
                                        disabled={!bulkUploadFile || !!bulkUploadProgress}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {bulkUploadProgress ? 'Processing...' : 'Upload & Register Students'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setBulkUploadFile(null);
                                            setBulkUploadProgress(null);
                                        }}
                                        disabled={!!bulkUploadProgress}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        Clear File
                                    </button>
                                    <button
                                        onClick={() => {
                                            setRegisterCompModal(null);
                                            setRegistrationTab("individual");
                                            setBulkUploadFile(null);
                                            setBulkUploadProgress(null);
                                        }}
                                        disabled={!!bulkUploadProgress}
                                        className="px-4 py-2 border rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>

                {/* Edit Competition Modal */}
                <Modal
                    open={!!editCompModal}
                    onClose={() => setEditCompModal(null)}
                    title="Edit Competition"
                >
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium">Competition Name *</label>
                            <input
                                value={editCompForm.name}
                                onChange={(e) => setEditCompForm({ ...editCompForm, name: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border mt-1"
                                placeholder="Enter Competition Name"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                                value={editCompForm.description}
                                onChange={(e) => setEditCompForm({ ...editCompForm, description: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border mt-1"
                                placeholder="Enter competition description"
                                rows={2}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Category</label>
                            <input
                                value={editCompForm.category}
                                onChange={(e) => setEditCompForm({ ...editCompForm, category: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border mt-1"
                                placeholder="e.g., Science, Sports, Arts"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Level *</label>
                            <select
                                value={editCompForm.level}
                                onChange={(e) => setEditCompForm({ ...editCompForm, level: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border mt-1"
                            >
                                <option value="intraschool">Intra-School</option>
                                <option value="interschool">Inter-School</option>
                                <option value="district">District</option>
                                <option value="state">State</option>
                                <option value="national">National</option>
                                <option value="international">International</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Date *</label>
                            <input
                                type="date"
                                value={editCompForm.date}
                                onChange={(e) => setEditCompForm({ ...editCompForm, date: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border mt-1"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Participating Clubs</label>
                            <select
                                multiple
                                className="w-full px-3 py-2 rounded-md border mt-1 h-32"
                                value={editCompForm.participatingClubs}
                                onChange={(e) =>
                                    setEditCompForm({
                                        ...editCompForm,
                                        participatingClubs: Array.from(
                                            e.target.selectedOptions,
                                            (option) => option.value
                                        ),
                                    })
                                }
                            >
                                {clubs.map((c) => (
                                    <option key={c.club_id} value={c.club_id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-500 mt-1">Hold CTRL (Windows) or CMD (Mac) to select multiple clubs</p>
                        </div>

                        <div className="flex gap-3 pt-3">
                            <button
                                onClick={handleUpdateCompetition}
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                            >
                                Update Competition
                            </button>
                            <button
                                onClick={() => setEditCompModal(null)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Competition View Modal */}
                <Modal
                    open={!!viewComp}
                    onClose={() => setViewComp(null)}
                    title="Competition Details"
                >
                    {viewComp && (
                        <div className="space-y-4">
                            <div className="flex items-start justify-between">
                                <h2 className="text-xl font-semibold">{viewComp.name}</h2>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                    viewComp.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                                    viewComp.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                                    viewComp.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                    {viewComp.status === 'upcoming' ? ' Upcoming' :
                                     viewComp.status === 'ongoing' ? 'Ongoing' :
                                     viewComp.status === 'completed' ? 'Completed' :
                                     'Cancelled'}
                                </span>
                            </div>

                            {viewComp.category && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-600">Category:</span>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 capitalize">
                                        {viewComp.category}
                                    </span>
                                </div>
                            )}

                            {viewComp.description && (
                                <div className="bg-slate-50 p-3 rounded-lg">
                                    <p className="text-sm text-slate-700">{viewComp.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <div className="text-xs text-blue-600 font-medium mb-1">Competition Level</div>
                                    <div className="text-sm font-semibold text-blue-900 capitalize">{viewComp.level}</div>
                                </div>
                                
                                <div className="bg-green-50 p-3 rounded-lg">
                                    <div className="text-xs text-green-600 font-medium mb-1">Competition Date</div>
                                    <div className="text-sm font-semibold text-green-900">
                                        {formatDate(viewComp.competition_date || viewComp.date)}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-orange-50 p-3 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-xs text-orange-600 font-medium mb-1">Participating Clubs</div>
                                        <div className="text-sm font-semibold text-orange-900">
                                            {viewComp.participatingClubs?.length ?? 0} {viewComp.participatingClubs?.length === 1 ? 'Club' : 'Clubs'}
                                        </div>
                                    </div>
                                    <div className="text-2xl">🏆</div>
                                </div>
                            </div>

                            

                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    onClick={() => {
                                        setRegisterCompModal(viewComp);
                                        setViewComp(null);
                                    }}
                                    className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                                >
                                    Register Students
                                </button>
                                <button
                                    onClick={() => setViewComp(null)}
                                    className="px-6 py-2 border rounded-md hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>
                <Modal
                    open={addCompModal}
                    onClose={() => setAddCompModal(false)}
                    title="Add New Competition"
                >
                    <div className="space-y-3">
                        <div className="bg-green-50 p-3 rounded-lg mb-4 text-sm">
                            <div className="flex items-center gap-2 text-green-900">
                                <span className="font-semibold">Note:</span>
                                <span>This competition will be created for your school only.</span>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Competition Name *</label>
                            <input
                                value={newCompForm.name}
                                onChange={(e) => setNewCompForm({ ...newCompForm, name: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border mt-1"
                                placeholder="Enter Competition Name"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                                value={newCompForm.description}
                                onChange={(e) => setNewCompForm({ ...newCompForm, description: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border mt-1"
                                placeholder="Enter competition description"
                                rows={2}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Category</label>
                            <input
                                value={newCompForm.category}
                                onChange={(e) => setNewCompForm({ ...newCompForm, category: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border mt-1"
                                placeholder="e.g., Science, Sports, Arts"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Level *</label>
                            <select
                                value={newCompForm.level}
                                onChange={(e) => setNewCompForm({ ...newCompForm, level: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border mt-1"
                            >
                                <option value="intraschool">Intra-School</option>
                                <option value="interschool">Inter-School</option>
                                <option value="district">District</option>
                                <option value="state">State</option>
                                <option value="national">National</option>
                                <option value="international">International</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Date *</label>
                            <input
                                type="date"
                                value={newCompForm.date}
                                onChange={(e) => setNewCompForm({ ...newCompForm, date: e.target.value })}
                                className="w-full px-3 py-2 rounded-md border mt-1"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Participating Clubs</label>
                            <select
                                multiple
                                className="w-full px-3 py-2 rounded-md border mt-1 h-32"
                                value={newCompForm.participatingClubs}
                                onChange={(e) =>
                                    setNewCompForm({
                                        ...newCompForm,
                                        participatingClubs: Array.from(
                                            e.target.selectedOptions,
                                            (option) => option.value
                                        ),
                                    })
                                }
                            >
                                {clubs.map((c) => (
                                    <option key={c.club_id} value={c.club_id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-500 mt-1">Hold CTRL (Windows) or CMD (Mac) to select multiple clubs</p>
                        </div>

                        <div className="flex gap-3 pt-3">
                            <button
                                onClick={handleAddCompetition}
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                            >
                                Create Competition
                            </button>
                            <button
                                onClick={() => setAddCompModal(false)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>
                {/* Attendance Marking Modal */}
                <Modal
                    open={attendanceModal.open}
                    onClose={() => {
                        setAttendanceModal({ open: false, club: null });
                        setAttendanceRecords({});
                    }}
                    title={`Mark Attendance - ${attendanceModal.club?.name ?? ""}`}
                >
                    {attendanceModal.club && (
                        <div className="space-y-4">
                            {/* Session Details */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-blue-900 mb-1">Session Date *</label>
                                        <input
                                            type="date"
                                            value={attendanceDate}
                                            onChange={(e) => setAttendanceDate(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-blue-900 mb-1">Total Members</label>
                                        <div className="px-3 py-2 bg-white border rounded-md text-sm font-semibold">
                                            {attendanceModal.club.members.length}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-3">
                                    <label className="block text-xs font-medium text-blue-900 mb-1">Session Topic *</label>
                                    <input
                                        type="text"
                                        value={attendanceTopic}
                                        onChange={(e) => setAttendanceTopic(e.target.value)}
                                        placeholder="e.g., Robot Assembly Workshop"
                                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Attendance Summary */}
                            <div className="grid grid-cols-4 gap-2 text-center">
                                <div className="bg-green-50 p-2 rounded-lg">
                                    <div className="text-xs text-green-600 font-medium">Present</div>
                                    <div className="text-lg font-bold text-green-700">
                                        {Object.values(attendanceRecords).filter(s => s === 'present').length}
                                    </div>
                                </div>
                                <div className="bg-yellow-50 p-2 rounded-lg">
                                    <div className="text-xs text-yellow-600 font-medium">Late</div>
                                    <div className="text-lg font-bold text-yellow-700">
                                        {Object.values(attendanceRecords).filter(s => s === 'late').length}
                                    </div>
                                </div>
                                <div className="bg-red-50 p-2 rounded-lg">
                                    <div className="text-xs text-red-600 font-medium">Absent</div>
                                    <div className="text-lg font-bold text-red-700">
                                        {Object.values(attendanceRecords).filter(s => s === 'absent').length}
                                    </div>
                                </div>
                                <div className="bg-blue-50 p-2 rounded-lg">
                                    <div className="text-xs text-blue-600 font-medium">Excused</div>
                                    <div className="text-lg font-bold text-blue-700">
                                        {Object.values(attendanceRecords).filter(s => s === 'excused').length}
                                    </div>
                                </div>
                            </div>

                            {/* Student List */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-gray-900">Mark Attendance</h4>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                const records = {};
                                                attendanceModal.club.members.forEach(m => records[m] = 'present');
                                                setAttendanceRecords(records);
                                            }}
                                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                        >
                                            All Present
                                        </button>
                                        <button
                                            onClick={() => {
                                                const records = {};
                                                attendanceModal.club.members.forEach(m => records[m] = 'absent');
                                                setAttendanceRecords(records);
                                            }}
                                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                        >
                                            All Absent
                                        </button>
                                    </div>
                                </div>

                                <div className="max-h-80 overflow-y-auto space-y-2 border rounded-lg p-3 bg-gray-50">
                                    {attendanceModal.club.members.length > 0 ? (
                                        attendanceModal.club.members.map((memberId) => {
                                            const student = allStudents.find(s => s.id === memberId);
                                            const studentName = student?.name || memberId;
                                            const studentGrade = student?.grade || 'N/A';
                                            
                                            return (
                                                <div
                                                    key={memberId}
                                                    className="flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-sm"
                                                >
                                                    <div className="flex-1">
                                                        <div className="font-medium text-sm">{studentName}</div>
                                                        <div className="text-xs text-slate-500">{studentGrade}</div>
                                                    </div>

                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => handleAttendanceStatusChange(memberId, 'present')}
                                                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                                                attendanceRecords[memberId] === 'present'
                                                                    ? 'bg-green-600 text-white'
                                                                    : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                                                            }`}
                                                        >
                                                            Present
                                                        </button>
                                                        <button
                                                            onClick={() => handleAttendanceStatusChange(memberId, 'late')}
                                                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                                                attendanceRecords[memberId] === 'late'
                                                                    ? 'bg-yellow-600 text-white'
                                                                    : 'bg-gray-100 text-gray-600 hover:bg-yellow-100'
                                                            }`}
                                                        >
                                                            Late
                                                        </button>
                                                        <button
                                                            onClick={() => handleAttendanceStatusChange(memberId, 'absent')}
                                                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                                                attendanceRecords[memberId] === 'absent'
                                                                    ? 'bg-red-600 text-white'
                                                                    : 'bg-gray-100 text-gray-600 hover:bg-red-100'
                                                            }`}
                                                        >
                                                            Absent
                                                        </button>
                                                        <button
                                                            onClick={() => handleAttendanceStatusChange(memberId, 'excused')}
                                                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                                                attendanceRecords[memberId] === 'excused'
                                                                    ? 'bg-blue-600 text-white'
                                                                    : 'bg-gray-100 text-gray-600 hover:bg-blue-100'
                                                            }`}
                                                        >
                                                            Excused
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-8 text-slate-500">
                                            No members in this club yet
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 pt-4 border-t">
                                <button
                                    onClick={handleSaveAttendance}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                                >
                                    Save Attendance
                                </button>
                                <button
                                    onClick={() => {
                                        setAttendanceModal({ open: false, club: null });
                                        setAttendanceRecords({});
                                    }}
                                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>

                <Modal
    open={studentDrawer.open}
    onClose={() => {
        setStudentDrawer({ open: false, club: null });
        setStudentSearchQuery("");
    }}
    title={`Manage Students - ${studentDrawer.club?.name ?? ""}`}
>
    {studentDrawer.club && (
        <div className="space-y-3">
            <div className="text-sm text-slate-600 mb-4">
                Current Members: {studentDrawer.club.members.length} / {studentDrawer.club.capacity}
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="Search by name, email, or grade..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {studentSearchQuery && (
                    <button
                        onClick={() => setStudentSearchQuery("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {loadingStudents ? (
                <div className="text-center py-8 text-slate-500">
                    Loading students...
                </div>
            ) : allStudents.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    No students found. Students will appear here once they register.
                </div>
            ) : (() => {
                const filteredStudents = allStudents.filter((student) => {
                    if (!studentSearchQuery) return true;
                    const query = studentSearchQuery.toLowerCase();
                    return (
                        student.name.toLowerCase().includes(query) ||
                        student.email.toLowerCase().includes(query) ||
                        student.grade.toLowerCase().includes(query)
                    );
                });

                if (filteredStudents.length === 0) {
                    return (
                        <div className="text-center py-8 text-slate-500">
                            {studentSearchQuery ? (
                                <>
                                    No students found matching "{studentSearchQuery}"
                                    <button
                                        onClick={() => setStudentSearchQuery("")}
                                        className="block mx-auto mt-2 text-blue-600 hover:underline text-sm"
                                    >
                                        Clear search
                                    </button>
                                </>
                            ) : (
                                "No students available"
                            )}
                        </div>
                    );
                }

                return (
                    <div className="max-h-96 overflow-y-auto space-y-2">
                        {filteredStudents.map((student) => {
                            const isEnrolled = studentDrawer.club.members.includes(student.id);
                            const isFull = studentDrawer.club.members.length >= studentDrawer.club.capacity;

                            return (
                                <div
                                    key={student.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                                >
                                    <div>
                                        <div className="font-medium text-sm">{student.name}</div>
                                        <div className="text-xs text-slate-500">{student.grade} • {student.email}</div>
                                    </div>

                                    {isEnrolled ? (
                                        <button
                                            onClick={() => handleStudentLeave(student.id, studentDrawer.club)}
                                            className="flex items-center gap-1 px-3 py-1 text-sm bg-red-50 text-red-600 rounded-md border border-red-100 hover:bg-red-100"
                                        >
                                            <X size={14} />
                                            Remove
                                        </button>
                                    ) : (
                                        <button
                                            disabled={isFull}
                                            onClick={() => handleStudentEnroll(student.id, studentDrawer.club)}
                                            className={`flex items-center gap-1 px-3 py-1 text-sm rounded-md ${
                                                isFull
                                                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                            }`}
                                        >
                                            <Plus size={14} />
                                            Add
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })()}

            <div className="pt-4 border-t">
                <button
                    onClick={() => {
                        setStudentDrawer({ open: false, club: null });
                        setStudentSearchQuery("");
                    }}
                    className="w-full px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                    Close
                </button>
            </div>
        </div>
    )}
</Modal>

            </div>
        </div>
        
    );
}