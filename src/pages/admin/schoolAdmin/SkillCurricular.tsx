
import {
    AlertTriangle,
    BookOpen,
    Calendar,
    CalendarCheck,
    CheckCircle,
    ChevronDown,
    Clock,
    Cpu,
    Download,
    Dumbbell,
    Edit,
    Eye,
    FileDown,
    FlaskConical,
    Info,
    MapPin,
    MoreVertical,
    Palette,
    Plus,
    Search,
    Trash2,
    Trophy,
    User,
    UserMinus,
    UserPlus,
    Users,
    X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import * as clubsService from "@/features/college-admin";
import * as competitionsService from "@/features/college-admin";
import { getLogger } from '@/shared/config/logging';
import { useAuthStore } from '@/shared/model/authStore';
import { apiPost } from '@/shared/api/apiClient';


const logger = getLogger('school-admin-skill-curricular');

import 'react-datepicker/dist/react-datepicker.css';

// Helper function to get school_id from logged-in user via API
async function getSchoolId() {
    try {
        const response = await apiPost<{ schoolId: string }>('/school-admin/actions', {
            action: 'fetchCommunicationSchoolData'
        });
        return response?.schoolId || null;
    } catch (error) {
        logger.error('Error getting school ID', error);
        return null;
    }
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

// Local YYYY-MM-DD for today, used as the <input type="date"> min bound and for past-date checks.
function getTodayDateStr() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function isPastDateStr(dateStr) {
    if (!dateStr) return false;
    return String(dateStr).slice(0, 10) < getTodayDateStr();
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
    if (!w) return toast.error("Unable to open export window. Please allow popups.");
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

const CLUB_CATEGORY_ICON_STYLE = {
    all: "bg-slate-100 text-slate-700",
    arts: "bg-blue-50/90 text-blue-700",
    sports: "bg-emerald-50/90 text-emerald-700",
    robotics: "bg-slate-100 text-slate-700",
    science: "bg-indigo-50/90 text-indigo-700",
    literature: "bg-amber-50/90 text-amber-700",
};

const CLUB_CATEGORY_BADGE_STYLE = {
    all: "bg-slate-100 text-slate-700",
    arts: "bg-purple-100 text-purple-700",
    sports: "bg-emerald-100 text-emerald-700",
    robotics: "bg-slate-200 text-slate-700",
    science: "bg-indigo-100 text-indigo-700",
    literature: "bg-amber-100 text-amber-700",
};

const CLUB_CATEGORY_BADGE_ICON = {
    all: Users,
    arts: Palette,
    sports: Dumbbell,
    robotics: Cpu,
    science: FlaskConical,
    literature: BookOpen,
};

function ClubCard({ club, isJoined, onJoin, onLeave, onOpenDetails, onEdit, onDelete }) {
    const memberCount = club.members?.length ?? 0;
    const full = memberCount >= club.capacity;
    const iconStyle = CLUB_CATEGORY_ICON_STYLE[club.category] || CLUB_CATEGORY_ICON_STYLE.all;
    const badgeStyle = CLUB_CATEGORY_BADGE_STYLE[club.category] || CLUB_CATEGORY_BADGE_STYLE.all;

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!menuOpen) return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    return (
        <article className="group relative flex flex-col bg-white rounded-xl border border-slate-200/85 hover:border-slate-300/90 shadow-[0_1px_2px_rgba(15,23,42,0.025)] hover:shadow-[0_6px_20px_-8px_rgba(15,23,42,0.08)] transition-all duration-150">
            {/* Main content */}
            <div className="p-6 flex-1 flex flex-col">
                {/* Header: icon + title + capacity */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${iconStyle}`}>
                            <Users size={18} />
                        </div>
                        <div className="min-w-0 pt-0.5">
                            <h3 className="text-[15.5px] font-semibold text-slate-900 leading-snug truncate">{club.name}</h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" ref={menuRef}>
                        <span className={`text-[11px] font-medium px-2 py-1 rounded-full capitalize whitespace-nowrap ${badgeStyle}`}>
                            {club.category}
                        </span>
                        <div className="relative">
                            <button
                                onClick={() => setMenuOpen((v) => !v)}
                                className="h-7 w-7 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                aria-label="Club actions"
                            >
                                <MoreVertical size={16} />
                            </button>

                            {menuOpen && (
                                <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
                                    <button
                                        onClick={() => { setMenuOpen(false); onEdit(club); }}
                                        className="w-full text-left px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                        <Edit size={14} className="text-slate-400" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => { setMenuOpen(false); onDelete(club); }}
                                        className="w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <p className="mt-4 text-[13.5px] leading-relaxed text-slate-600 line-clamp-2">
                    {club.description || "No description added yet."}
                </p>

                {/* Meeting info + member count strip */}
                <div className="mt-auto pt-5">
                    <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-3 min-w-0 text-[13px] text-slate-800 truncate">
                            {club.meeting_day && (
                                <span className="flex items-center gap-1 shrink-0">
                                    <Calendar size={14} className="text-slate-400" />
                                    {club.meeting_day}
                                </span>
                            )}
                            {club.meeting_time && (
                                <span className="flex items-center gap-1 shrink-0">
                                    <Clock size={14} className="text-slate-400" />
                                    {club.meeting_time}
                                </span>
                            )}
                            {club.location && (
                                <span className="flex items-center gap-1 min-w-0 truncate">
                                    <MapPin size={14} className="text-slate-400 shrink-0" />
                                    <span className="truncate">{club.location}</span>
                                </span>
                            )}
                        </div>

                        {club.upcomingCompetitions?.length ? (
                            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 whitespace-nowrap">
                                <Trophy size={12} />
                                {club.upcomingCompetitions.length} Upcoming
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[12px] font-medium text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
                                <Users size={12} />
                                {memberCount}/{club.capacity} Members
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Action footer */}
            <div className="px-6 pb-5 pt-1 space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                    <button
                        onClick={() => onOpenDetails(club)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap"
                    >
                        <Eye size={14} className="text-slate-400" />
                        View Details
                    </button>

                    {!isJoined ? (
                        <button
                            disabled={full}
                            onClick={() => onJoin(club)}
                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-lg transition-colors whitespace-nowrap ${
                                full ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                        >
                            <UserPlus size={14} />
                            {full ? "Full" : "Manage"}
                        </button>
                    ) : (
                        <button
                            onClick={() => onLeave(club)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors whitespace-nowrap"
                        >
                            <X size={14} />
                            Leave
                        </button>
                    )}
                </div>
            </div>
        </article>
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

function ConfirmDeleteModal({ open, itemLabel, itemName, onCancel, onConfirm }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="alertdialog" aria-modal="true">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onCancel} aria-hidden="true" />
            <div className="relative z-10 w-full max-w-[420px] bg-white rounded-lg border border-slate-200 shadow-xl p-6">
                <div className="flex items-start gap-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-600">
                        <AlertTriangle size={18} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-[16px] font-semibold text-slate-900">Delete {itemLabel}?</h3>
                        <p className="mt-1.5 text-[13.5px] text-slate-600 leading-relaxed">
                            You are about to remove <span className="font-medium text-slate-900">{itemName}</span>. This action cannot be undone.
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-3.5 py-2 text-[13px] font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="px-3.5 py-2 text-[13px] font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                    >
                        Delete {itemLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ClubsActivitiesPage() {
    const currentLearner = useMemo(() => ({ id: "s_new", name: "You" }), []);

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
                logger.error('Error fetching data', error);
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
    const setNotice = (n: { type: "success" | "error" | "warning" | "info"; text: string } | null) => {
        if (!n) return;
        if (n.type === "success") toast.success(n.text);
        else if (n.type === "error") toast.error(n.text);
        else toast(n.text, { icon: "ℹ️", duration: 4000 });
    };
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [openCompMenuId, setOpenCompMenuId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
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
    const [learnerDrawer, setlearnerDrawer] = useState({ open: false, club: null });
    const [alllearners, setAlllearners] = useState([]);
    const [loadinglearners, setLoadinglearners] = useState(true);
    const [learnerSearchQuery, setlearnerSearchQuery] = useState("");
    const [attendanceModal, setAttendanceModal] = useState({ open: false, club: null });
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceTopic, setAttendanceTopic] = useState("");
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [currentCompetitionPage, setCurrentCompetitionPage] = useState(1);

    // Fetch real learners from Supabase (only from the same school)
    useEffect(() => {
        const fetchlearners = async () => {
            try {
                setLoadinglearners(true);
                
                // Get logged-in user's email
                const userEmail = (useAuthStore.getState().user?.email || localStorage.getItem("userEmail"));
                logger.info('Fetching learners for user', { userEmail });
                
                if (!userEmail) {
                    logger.warn('No user email found in localStorage');
                    setAlllearners([]);
                    setLoadinglearners(false);
                    return;
                }
                
                // Resolve school_id the same way ClassManagement.tsx does (the known-working path)
                let schoolId = null;
                try {
                    const schoolResp: any = await apiPost('/school-admin/actions', { action: 'fetchSchoolId' });
                    schoolId = schoolResp?.data?.schoolId || null;
                    if (schoolId) {
                        logger.info('Found school_id from fetchSchoolId', { schoolId });
                    }
                } catch (apiErr) {
                    logger.error('Error fetching school_id via fetchSchoolId', apiErr);
                }

                if (!schoolId) {
                    logger.warn('No school_id found for user', { userEmail });
                    setAlllearners([]);
                    setLoadinglearners(false);
                    return;
                }

                logger.info('Fetching learners for school_id', { schoolId });

                // Fetch learners from API
                const learnersResp: any = await apiPost('/school-admin/actions', {
                    action: 'getCurricularLearners',
                    schoolId
                });
                const data = learnersResp?.data || [];

                if (!data || data.length === 0) {
                    logger.info('No learners found for school_id', { schoolId });
                    setAlllearners([]);
                    setLoadinglearners(false);
                    return;
                }

                // Map learners to the format we need (using email as ID)
                const mappedlearners = data.map((learner: any) => ({
                    id: learner.email,
                    email: learner.email,
                    name: learner.name || learner.email,
                    grade: learner.grade || 'N/A',
                    section: learner.section,
                    rollNumber: learner.roll_number,
                    school_id: learner.school_id
                }));
                
                logger.info('Loaded learners from school', { count: mappedlearners.length, schoolId });
                setAlllearners(mappedlearners);
                
            } catch (err) {
                logger.error('Error loading learners', err);
                setAlllearners([]);
            } finally {
                setLoadinglearners(false);
            }
        };

        fetchlearners();
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
        learnerEmail: "",
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
        return new Set(clubs.filter((c) => c.members.includes(currentLearner.id)).map((c) => c.club_id));
    }, [clubs, currentLearner]);

    const filteredClubs = useMemo(() => {
        return clubs.filter((c) => {
            if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
            if (showMine && !c.members.includes(currentLearner.id)) return false;
            if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
            return true;
        });
    }, [clubs, q, categoryFilter, showMine, currentLearner]);

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

    const enrollLearner = (club) => {
        setlearnerDrawer({ open: true, club: club });
    };

    const leaveClub = async (club) => {
        if (!club.members.includes(currentLearner.id)) {
            setNotice({ type: "warning", text: "You are not a member of this club." });
            return;
        }

        try {
            await clubsService.removeLearner(club.club_id, currentLearner.id);
            
            const updated = clubs.map((c) => (c.club_id === club.club_id ? { ...c, members: c.members.filter((m) => m !== currentLearner.id) } : c));
            setClubs(updated);
            setNotice({ type: "info", text: `Left ${club.name}` });
        } catch (error) {
            logger.error('Error leaving club', error);
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

    const handleAttendanceStatusChange = (learnerId, status) => {
        setAttendanceRecords(prev => ({
            ...prev,
            [learnerId]: status
        }));
    };

    const handleSaveAttendance = async () => {
        if (!attendanceTopic.trim()) {
            setNotice({ type: "error", text: "Please enter a session topic" });
            return;
        }

        try {
            const attendanceRecordsArray = Object.entries(attendanceRecords).map(([learnerEmail, status]) => ({
                learner_email: learnerEmail,
                status: status
            }));

            await clubsService.markClubAttendance(
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
            logger.error('Error saving attendance', error);
            setNotice({ type: "error", text: "Failed to save attendance. Please try again." });
        }
    };
   const handlelearnerEnroll = async (learnerId, club) => {
    if (club.members.includes(learnerId)) {
        setNotice({ type: "error", text: "Learner is already enrolled in this club." });
        return;
    }

    if ((club.members.length ?? 0) >= club.capacity) {
        setNotice({ type: "error", text: "Club is full. Cannot join." });
        return;
    }

    try {
        await clubsService.enrollLearner(club.club_id, learnerId);
        
        const updated = clubs.map((c) => 
            c.club_id === club.club_id 
                ? { ...c, members: [...c.members, learnerId] } 
                : c
        );
        setClubs(updated);
        setlearnerDrawer({ open: true, club: updated.find(c => c.club_id === club.club_id) });
        setNotice({ type: "success", text: `Learner enrolled in ${club.name}` });
    } catch (error) {
        logger.error('Error enrolling learner', error);
        setNotice({ type: "error", text: "Failed to enroll learner. Please try again." });
    }
};

const handlelearnerLeave = async (learnerId, club) => {
    if (!club.members.includes(learnerId)) {
        setNotice({ type: "error", text: "Learner is not a member of this club." });
        return;
    }

    try {
        await clubsService.removeLearner(club.club_id, learnerId);
        
        const updated = clubs.map((c) => 
            c.club_id === club.club_id 
                ? { ...c, members: c.members.filter((m) => m !== learnerId) } 
                : c
        );
        setClubs(updated);
        setlearnerDrawer({ open: true, club: updated.find(c => c.club_id === club.club_id) });
        toast("Learner removed successfully", {
            icon: <UserMinus size={18} className="text-gray-500" />,
            duration: 5000,
        });
    } catch (error) {
        logger.error('Error removing learner', error);
        setNotice({ type: "error", text: "Failed to remove learner. Please try again." });
    }
};

    const buildClubParticipationRows = async () => {
        try {
            // Fetch club report from API
            const data = await apiPost<any[]>('/school-admin/actions', {
                action: 'get-club-participation-report'
            });

            if (!data || data.length === 0) {
                logger.info('No club report data from API, using local data');
                // Fallback to localStorage data
                return clubs.map((c) => ({
                    "Club Name": c.name,
                    "Learner Count": c.members.length,
                    "Average attendance": c.avgAttendance ? c.avgAttendance + '%' : '--',
                    "Top performers": '--',
                    "Participation score": Math.round((c.members.length / c.capacity) * 100) + '%',
                }));
            }

            return data.map((row: any) => ({
                "Club Name": row.club_name,
                "Learner Count": row.learner_count,
                "Average attendance": row.avg_attendance ? row.avg_attendance + '%' : '--',
                "Top performers": row.top_performers || 'N/A',
                "Participation score": row.participation_score ? row.participation_score + '%' : '--'
            }));
        } catch (err) {
            logger.error('Error building club report', err);
            // Fallback to localStorage data
            return clubs.map((c) => ({
                "Club Name": c.name,
                "Learner Count": c.members.length,
                "Average attendance": c.avgAttendance ? c.avgAttendance + '%' : '--',
                "Top performers": '--',
                "Participation score": Math.round((c.members.length / c.capacity) * 100) + '%',
            }));
        }
    };

    const buildCompetitionPerformanceRows = async () => {
        try {
            // Fetch competition report from API
            const data = await apiPost<any[]>('/school-admin/actions', {
                action: 'get-competition-performance-report'
            });

            if (!data || data.length === 0) {
                logger.info('No competition report data from API, using local data');
                // Fallback to localStorage data
                return competitions.map((t) => ({
                    "Competition Name": t.name,
                    "Level": t.level,
                    "Learner Results": t.results?.length ? JSON.stringify(t.results) : '--',
                    "Awards": '--',
                }));
            }

            return data.map((row: any) => ({
                "Competition Name": row.competition_name,
                "Level": row.level,
                "Date": row.competition_date,
                "Total Participants": row.total_participants || 0,
                "Learner Results": row.learner_results || '--',
                "Awards": row.awards_won || '--',
                "Average Score": row.avg_score || '--'
            }));
        } catch (err) {
            logger.error('Error building competition report', err);
            // Fallback to localStorage data
            return competitions.map((t) => ({
                "Competition Name": t.name,
                "Level": t.level,
                "Learner Results": t.results?.length ? JSON.stringify(t.results) : '--',
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
            logger.error('Error creating club', error);
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
            logger.error('Error updating club', error);
            setNotice({ type: "error", text: "Failed to update club. Please try again." });
        }
    };

    const handleDeleteClub = (club) => {
        setDeleteConfirm({
            itemLabel: "Club",
            itemName: club.name,
            onConfirm: () => performDeleteClub(club),
        });
    };

    const performDeleteClub = async (club) => {
        setDeleteConfirm(null);
        try {
            await clubsService.deleteClub(club.club_id);

            const updatedClubs = clubs.filter(c => c.club_id !== club.club_id);
            setClubs(updatedClubs);

            setNotice({ type: "success", text: `${club.name} has been deleted successfully!` });
        } catch (error) {
            logger.error('Error deleting club', error);
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

    // Close the per-card competition action menu when clicking outside it
    useEffect(() => {
        if (!openCompMenuId) return;
        const handleClickOutside = (e) => {
            if (!(e.target).closest('[data-comp-menu]')) {
                setOpenCompMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openCompMenuId]);

    const categoryBadgeStyles = (category) => {
        const key = (category || '').trim().toLowerCase();
        const map = {
            arts: 'bg-purple-50 text-purple-700',
            sports: 'bg-green-50 text-green-700',
            science: 'bg-blue-50 text-blue-700',
            music: 'bg-pink-50 text-pink-700',
            technology: 'bg-cyan-50 text-cyan-700',
            academic: 'bg-indigo-50 text-indigo-700',
            debate: 'bg-amber-50 text-amber-700',
        };
        return map[key] || 'bg-slate-100 text-slate-600';
    };

    const loadCompetitionRegistrations = async (compId) => {
        try {
            setLoadingRegistrations(true);
            const registrations = await competitionsService.getCompetitionRegistrations(compId);
            setCompetitionRegistrations(registrations);
        } catch (error) {
            logger.error('Error loading registrations', error);
        } finally {
            setLoadingRegistrations(false);
        }
    };

    const handleRegisterCompetition = async () => {
        if (!registrationForm.learnerEmail) {
            setNotice({ type: "error", text: "Please select a learner" });
            return;
        }

        // Get learner details from alllearners
        const learner = alllearners.find(s => s.email === registrationForm.learnerEmail);
        if (!learner) {
            setNotice({ type: "error", text: "Learner not found" });
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
                    registrationForm.learnerEmail,
                    {
                        learnerName: learner.name,
                        learnerId: learner.email,
                        grade: learner.grade,
                        teamMembers: registrationForm.teamMembers,
                        notes: registrationForm.notes
                    }
                );
                setNotice({
                    type: "success",
                    text: `${learner.name} registered for ${registerCompModal?.name}!`
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
                    logger.warn('Failed to update competition status', statusError);
                    // Don't fail the whole registration if status update fails
                }
            }

            // Reload registrations
            await loadCompetitionRegistrations(registerCompModal.comp_id);
            
            // Reset form
            setRegistrationForm({ learnerEmail: "", teamMembers: "", notes: "", status: "upcoming" });
            setEditingRegistration(null);
        } catch (error) {
            logger.error('Error registering for competition', error);
            setNotice({ type: "error", text: error.message || "Failed to register. Please try again." });
        }
    };

    const handleEditRegistration = (registration) => {
        setEditingRegistration(registration);
        setRegistrationForm({
            learnerEmail: registration.learner_email,
            teamMembers: registration.team_members?.members?.join(', ') || '',
            notes: registration.notes || '',
            status: registration.status || 'upcoming'
        });
    };

    const handleDeleteRegistration = (registrationId, displayName) => {
        setDeleteConfirm({
            itemLabel: "Registration",
            itemName: displayName || "this registration",
            onConfirm: () => performDeleteRegistration(registrationId),
        });
    };

    const performDeleteRegistration = async (registrationId) => {
        setDeleteConfirm(null);
        try {
            await competitionsService.deleteCompetitionRegistration(registrationId);
            setNotice({ type: "success", text: "Registration deleted successfully" });
            await loadCompetitionRegistrations(registerCompModal.comp_id);
        } catch (error) {
            logger.error('Error deleting registration', error);
            setNotice({ type: "error", text: "Failed to delete registration" });
        }
    };

    const handleCancelEdit = () => {
        setEditingRegistration(null);
        setRegistrationForm({ learnerEmail: "", teamMembers: "", notes: "", status: "upcoming" });
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
                    if (!row.learner_email) {
                        errors.push(`Row ${i + 2}: Learner email is required`);
                        errorCount++;
                        continue;
                    }

                    // Find learner in our system
                    const learner = alllearners.find(s => 
                        s.email.toLowerCase() === row.learner_email.toLowerCase()
                    );

                    if (!learner) {
                        errors.push(`Row ${i + 2}: Learner ${row.learner_email} not found in system`);
                        errorCount++;
                        continue;
                    }

                    // Check if already registered
                    const existingRegistration = competitionRegistrations.find(reg => 
                        reg.learner_email.toLowerCase() === row.learner_email.toLowerCase()
                    );

                    if (existingRegistration) {
                        errors.push(`Row ${i + 2}: Learner ${row.learner_email} is already registered`);
                        errorCount++;
                        continue;
                    }

                    // Process team members if provided
                    let teamMembers = [];
                    if (row.team_members && typeof row.team_members === 'string') {
                        teamMembers = row.team_members.split(',').map(name => name.trim()).filter(name => name);
                    }

                    // Register the learner
                    await competitionsService.registerForCompetition(
                        registerCompModal.comp_id,
                        row.learner_email,
                        {
                            learnerName: learner.name,
                            learnerId: learner.email,
                            grade: learner.grade,
                            teamMembers: teamMembers.join(', '),
                            notes: row.notes || ''
                        }
                    );

                    successCount++;
                    setBulkUploadProgress(`Processed ${i + 1}/${jsonData.length} registrations...`);
                    
                } catch (error) {
                    logger.error('Error processing row', error, { row: i + 2 });
                    errors.push(`Row ${i + 2}: ${error.message || 'Registration failed'}`);
                    errorCount++;
                }
            }

            // Show results
            if (successCount > 0) {
                setNotice({ 
                    type: "success", 
                    text: `Bulk upload completed! ${successCount} learners registered successfully${errorCount > 0 ? `, ${errorCount} errors` : ''}` 
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
                logger.info('Upload errors', { errors });
                setTimeout(() => {
                    toast.error("Upload errors:\n" + errors.join('\n'));
                }, 1000);
            }

            // Reset form
            setBulkUploadFile(null);
            setBulkUploadProgress(null);
            
        } catch (error) {
            logger.error('Bulk upload error', error);
            setNotice({ type: "error", text: "Failed to process bulk upload. Please check file format." });
            setBulkUploadProgress(null);
        }
    };

    const downloadBulkTemplate = () => {
        const templateData = [
            {
                learner_email: "learner1@example.com",
                team_members: "John Doe, Jane Smith",
                notes: "Special requirements or notes"
            },
            {
                learner_email: "learner2@example.com", 
                team_members: "",
                notes: "Individual participation"
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Competition Registration");
        
        // Add column headers with descriptions
        const headerDescriptions = [
            "Learner Email (Required) - Must match learner email in system",
            "Team Members (Optional) - Comma-separated names for team events", 
            "Notes (Optional) - Any special requirements or notes"
        ];
        
        // Auto-size columns
        worksheet['!cols'] = [
            { wch: 30 }, // learner_email
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

        if (isPastDateStr(newCompForm.date)) {
            setNotice({ type: "error", text: "Competition date cannot be in the past" });
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
            logger.error('Error creating competition', error);
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

        const originalDate = editCompModal?.competition_date || editCompModal?.date;
        if (editCompForm.date !== originalDate && isPastDateStr(editCompForm.date)) {
            setNotice({ type: "error", text: "Competition date cannot be changed to a past date" });
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
            logger.error('Error updating competition', error);
            setNotice({ type: "error", text: "Failed to update competition. Please try again." });
        }
    };

    const handleDeleteCompetition = (comp) => {
        setDeleteConfirm({
            itemLabel: "Competition",
            itemName: comp.name,
            onConfirm: () => performDeleteCompetition(comp),
        });
    };

    const performDeleteCompetition = async (comp) => {
        setDeleteConfirm(null);
        try {
            await competitionsService.deleteCompetition(comp.comp_id);

            const updatedCompetitions = competitions.filter(c => c.comp_id !== comp.comp_id);
            setCompetitions(updatedCompetitions);

            setNotice({ type: "success", text: `${comp.name} has been deleted successfully!` });
        } catch (error) {
            logger.error('Error deleting competition', error);
            setNotice({ type: "error", text: "Failed to delete competition. Please try again." });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
            <div className="max-w-7xl mx-auto p-6">
                {/* Clean Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6">
                    <h1 className="text-[22px] font-semibold tracking-tight text-gray-900">Clubs &amp; Competitions</h1>
                </div>

                {/* Primary Mode Header Card: tabs + export + add */}
                <div className="bg-white rounded-xl border border-gray-200 border-b-2 border-b-blue-600 px-5 py-3.5 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div role="tablist" className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                        <button
                            onClick={() => handleTabSwitch("clubs")}
                            role="tab"
                            aria-selected={activeTab === "clubs"}
                            className={`inline-flex items-center gap-2 px-4 py-2 text-[13.5px] font-medium rounded-md transition-colors whitespace-nowrap ${
                                activeTab === "clubs" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-900"
                            }`}
                            title="Switch to Clubs (Ctrl+1)"
                        >
                            <Users size={16} />
                            <span>Clubs</span>
                            <span className={`text-xs ${activeTab === "clubs" ? "text-blue-100" : "text-gray-400"}`}>{clubs.length}</span>
                        </button>

                        <button
                            onClick={() => handleTabSwitch("competitions")}
                            role="tab"
                            aria-selected={activeTab === "competitions"}
                            className={`inline-flex items-center gap-2 px-4 py-2 text-[13.5px] font-medium rounded-md transition-colors whitespace-nowrap ${
                                activeTab === "competitions" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-900"
                            }`}
                            title="Switch to Competitions (Ctrl+2)"
                        >
                            <Trophy size={16} />
                            <span>Competitions</span>
                            <span className={`text-xs ${activeTab === "competitions" ? "text-blue-100" : "text-gray-400"}`}>{competitions.length}</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-[13.5px] font-medium text-gray-700"
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

                        <button
                            onClick={() => activeTab === "clubs" ? setAddClubModal(true) : setAddCompModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-[13.5px] font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                        >
                            <Plus size={16} />
                            Add {activeTab === "clubs" ? "Club" : "Competition"}
                        </button>
                    </div>
                </div>

                {/* Single-Row Search & Filter Bar - Only show for clubs tab */}
                {activeTab === "clubs" && (
                    <div className="bg-white rounded-xl border border-gray-200 px-5 py-3.5 shadow-sm mb-6 flex flex-col md:flex-row md:items-center gap-3.5">
                        <div className="relative flex-1 min-w-0">
                            <Search className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search clubs by name..."
                                className="w-full pl-10 pr-3.5 py-2 text-[13.5px] bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-600"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="min-w-[168px] px-3.5 py-2 text-[13.5px] bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-blue-600"
                            >
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>

                            <label className="inline-flex items-center gap-2 px-1.5 py-2 text-[13.5px] text-gray-700 cursor-pointer select-none whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={showMine}
                                    onChange={(e) => setShowMine(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>My Clubs Only</span>
                            </label>

                            {(q.trim() !== "" || categoryFilter !== "all" || showMine) && (
                                <button
                                    onClick={() => { setQ(""); setCategoryFilter("all"); setShowMine(false); }}
                                    className="px-2 py-1.5 text-[13px] font-medium text-blue-600 hover:underline whitespace-nowrap"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Single-Row Search & Filter Bar - Only show for competitions tab */}
                {activeTab === "competitions" && (
                    <div className="bg-white rounded-xl border border-gray-200 px-5 py-3.5 shadow-sm mb-6 flex flex-col md:flex-row md:items-center gap-3.5">
                        <div className="relative flex-1 min-w-0">
                            <Search className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                value={competitionSearchQuery}
                                onChange={(e) => setCompetitionSearchQuery(e.target.value)}
                                placeholder="Search competitions by name..."
                                className="w-full pl-10 pr-3.5 py-2 text-[13.5px] bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-600"
                            />
                        </div>

                        {competitionSearchQuery && (
                            <button
                                onClick={() => setCompetitionSearchQuery("")}
                                className="px-2 py-1.5 text-[13px] font-medium text-blue-600 hover:underline whitespace-nowrap shrink-0"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                )}

                {/* Tab Content */}
                <div className="transition-all duration-300 ease-in-out">
                    {activeTab === "clubs" && (
                        <section className="mb-10 animate-fadeIn">
                            <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
                                <div>
                                    <h2 className="text-[19px] font-semibold text-gray-900 tracking-tight">Active Clubs</h2>
                                    <p className="text-[13.5px] text-gray-500 mt-1">Manage and monitor club activities</p>
                                </div>
                                <span className="text-[13px] text-gray-500">
                                    {filteredClubs.length} of {clubs.length} clubs
                                </span>
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
                                                onJoin={enrollLearner}
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
                            <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
                                <div>
                                    <h2 className="text-[19px] font-semibold text-gray-900 tracking-tight">Active Competitions</h2>
                                    <p className="text-[13.5px] text-gray-500 mt-1">Track delegations, schedules, and competition certificates</p>
                                </div>
                                <span className="text-[13px] text-gray-500">
                                    {filteredCompetitions.length} of {competitions.length} competitions
                                </span>
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
                                        {paginatedCompetitions.map((comp) => {
                                            const isPastUpcoming = comp.status === 'upcoming' && isPastDateStr(comp.competition_date || comp.date);
                                            const statusTone =
                                                comp.status === 'ongoing' ? 'text-amber-700' :
                                                comp.status === 'completed' ? 'text-gray-500' :
                                                comp.status === 'cancelled' ? 'text-red-600' :
                                                isPastUpcoming ? 'text-gray-500' :
                                                'text-blue-700';
                                            const statusLabel =
                                                isPastUpcoming ? 'Past' :
                                                comp.status === 'upcoming' ? 'Upcoming' :
                                                comp.status === 'ongoing' ? 'Ongoing' :
                                                comp.status === 'completed' ? 'Completed' :
                                                'Cancelled';
                                            const clubCount = comp.participatingClubs?.length ?? 0;

                                            return (
                                                <article
                                                    key={comp.comp_id}
                                                    className="group relative flex flex-col bg-white rounded-xl border border-slate-200/85 hover:border-slate-300/90 shadow-[0_1px_2px_rgba(15,23,42,0.025)] hover:shadow-[0_6px_20px_-8px_rgba(15,23,42,0.08)] transition-all duration-150"
                                                >
                                                    <div className="p-6 flex-1 flex flex-col">
                                                        {/* Header: icon + title + status */}
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex items-start gap-3.5 min-w-0">
                                                                <div className="h-10 w-10 rounded-lg bg-amber-50/90 text-amber-700 flex items-center justify-center shrink-0">
                                                                    <Trophy size={18} />
                                                                </div>
                                                                <div className="min-w-0 pt-0.5">
                                                                    <h3 className="text-[15.5px] font-semibold text-slate-900 leading-snug truncate">{comp.name}</h3>
                                                                    <p className="mt-1 text-[12.5px] text-slate-500 truncate capitalize">
                                                                        <span>{comp.level}</span>
                                                                        <span className="mx-1.5 text-slate-300">&middot;</span>
                                                                        <span className={`font-medium ${statusTone}`}>{statusLabel}</span>
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-1.5 shrink-0" data-comp-menu>
                                                                {comp.category && (
                                                                    <span className={`text-[11px] font-medium px-2 py-1 rounded-full capitalize whitespace-nowrap ${categoryBadgeStyles(comp.category)}`}>
                                                                        {comp.category}
                                                                    </span>
                                                                )}
                                                                <div className="relative">
                                                                    <button
                                                                        onClick={() => setOpenCompMenuId(openCompMenuId === comp.comp_id ? null : comp.comp_id)}
                                                                        className="h-7 w-7 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                                                        aria-label="Competition actions"
                                                                    >
                                                                        <MoreVertical size={16} />
                                                                    </button>

                                                                    {openCompMenuId === comp.comp_id && (
                                                                        <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
                                                                            <button
                                                                                onClick={() => { setOpenCompMenuId(null); handleEditCompetition(comp); }}
                                                                                className="w-full text-left px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                                            >
                                                                                <Edit size={14} className="text-slate-400" />
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                onClick={() => { setOpenCompMenuId(null); handleDeleteCompetition(comp); }}
                                                                                className="w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                                Delete
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Description */}
                                                        <p className="mt-4 text-[13.5px] leading-relaxed text-slate-600 line-clamp-2">
                                                            {comp.description || "No description added yet."}
                                                        </p>

                                                        {/* Date + participating clubs */}
                                                        <div className="mt-auto pt-5">
                                                            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                                                                <div className="flex items-center gap-1.5 text-[13px] font-medium text-slate-800">
                                                                    <Calendar size={14} className="text-slate-400 shrink-0" />
                                                                    <span className="font-mono tabular-nums">{formatDate(comp.competition_date || comp.date)}</span>
                                                                </div>
                                                                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full shrink-0">
                                                                    <Users size={12} />
                                                                    {clubCount} {clubCount === 1 ? 'Club' : 'Clubs'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action footer */}
                                                    <div className="px-6 pb-5 pt-1">
                                                        <div className="grid grid-cols-2 gap-2.5">
                                                            <button
                                                                onClick={() => setViewComp(comp)}
                                                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap"
                                                            >
                                                                <Eye size={14} className="text-slate-400" />
                                                                View Details
                                                            </button>
                                                            <button
                                                                onClick={() => setRegisterCompModal(comp)}
                                                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
                                                            >
                                                                <UserPlus size={14} />
                                                                Register
                                                            </button>
                                                        </div>
                                                    </div>
                                                </article>
                                            );
                                        })}
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

                {detailsOpen && selectedClub && (() => {
                    const CategoryBadgeIcon = CLUB_CATEGORY_BADGE_ICON[selectedClub.category] || Users;
                    const badgeStyle = CLUB_CATEGORY_BADGE_STYLE[selectedClub.category] || CLUB_CATEGORY_BADGE_STYLE.all;
                    const memberCount = selectedClub.members?.length ?? 0;
                    const noMembers = memberCount === 0;
                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDetailsOpen(false)}></div>
                            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden z-10 flex flex-col">
                                {/* Header with gradient */}
                                <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/60 to-indigo-100 px-8 pt-6 pb-7 shrink-0">
                                    <button
                                        onClick={() => setDetailsOpen(false)}
                                        className="absolute top-4 right-4 p-2 bg-white rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
                                    >
                                        <X size={20} className="text-gray-500" />
                                    </button>

                                    <div className="flex items-start gap-3.5">
                                        <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                            <Users size={22} />
                                        </div>
                                        <div className="min-w-0 pt-0.5">
                                            <h2 className="text-3xl font-bold text-slate-900 truncate">{selectedClub.name}</h2>
                                            <span className={`mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium capitalize ${badgeStyle}`}>
                                                <CategoryBadgeIcon size={14} />
                                                {selectedClub.category}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="px-8 py-5 overflow-y-auto">
                                    <div className="text-sm font-medium text-slate-500 mb-1.5">Description</div>
                                    <p className="text-[15px] text-slate-900 leading-relaxed mb-5">
                                        {selectedClub.description || "No description added yet."}
                                    </p>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3.5">
                                            <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-2.5">
                                                <Users size={16} />
                                            </div>
                                            <div className="text-sm text-slate-500">Members</div>
                                            <div className="text-lg font-bold text-slate-900">{memberCount} / {selectedClub.capacity}</div>
                                        </div>

                                        <div className="rounded-xl border border-gray-200 p-3.5">
                                            <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-2.5">
                                                <Calendar size={16} />
                                            </div>
                                            <div className="text-sm text-slate-500">Meeting Day</div>
                                            <div className="text-lg font-bold text-slate-900">{selectedClub.meeting_day || "TBD"}</div>
                                        </div>

                                        <div className="rounded-xl border border-gray-200 p-3.5">
                                            <div className="h-8 w-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mb-2.5">
                                                <Clock size={16} />
                                            </div>
                                            <div className="text-sm text-slate-500">Time Slot</div>
                                            <div className="text-lg font-bold text-slate-900">{selectedClub.meeting_time || "TBD"}</div>
                                        </div>

                                        <div className="rounded-xl border border-gray-200 p-3.5">
                                            <div className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mb-2.5">
                                                <MapPin size={16} />
                                            </div>
                                            <div className="text-sm text-slate-500">Venue</div>
                                            <div className="text-lg font-bold text-slate-900">{selectedClub.location || "TBD"}</div>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100 pt-4 flex items-center gap-3 flex-wrap">
                                        <button
                                            onClick={() => {
                                                enrollLearner(selectedClub);
                                                setDetailsOpen(false);
                                            }}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition-colors"
                                        >
                                            <Users size={18} />
                                            Manage Members
                                        </button>

                                        <button
                                            onClick={() => {
                                                openAttendanceModal(selectedClub);
                                                setDetailsOpen(false);
                                            }}
                                            disabled={noMembers}
                                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-colors ${
                                                noMembers
                                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                            }`}
                                        >
                                            <CalendarCheck size={18} />
                                            Mark Attendance
                                        </button>

                                        <button
                                            onClick={() => setDetailsOpen(false)}
                                            className="px-5 py-2.5 border border-gray-200 rounded-xl font-semibold text-slate-700 hover:bg-gray-50 transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

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
                        setRegistrationForm({ learnerEmail: "", teamMembers: "", notes: "", status: "upcoming" });
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
                                {(() => {
                                    const isPastUpcoming = registerCompModal?.status === 'upcoming' && isPastDateStr(registerCompModal?.competition_date || registerCompModal?.date);
                                    return (
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            isPastUpcoming ? 'bg-gray-100 text-gray-700' :
                                            registerCompModal?.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                                            registerCompModal?.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                                            registerCompModal?.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {isPastUpcoming ? 'Past' :
                                             registerCompModal?.status === 'upcoming' ? ' Upcoming' :
                                             registerCompModal?.status === 'ongoing' ? 'Ongoing' :
                                             registerCompModal?.status === 'completed' ? 'Completed' :
                                             '❌ Cancelled'}
                                        </span>
                                    );
                                })()}
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
                                        <h4 className="text-sm font-semibold mb-2">Registered Learners ({competitionRegistrations.length})</h4>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {competitionRegistrations.map((reg) => {
                                                const learner = alllearners.find(s => s.email === reg.learner_email);
                                                return (
                                                    <div key={reg.registration_id} className="flex items-center justify-between p-2 bg-white rounded border">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm">{learner?.name || reg.learner_email}</div>
                                                            <div className="text-xs text-slate-500">{learner?.grade || 'N/A'} • {reg.learner_email}</div>
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
                                                                onClick={() => handleDeleteRegistration(reg.registration_id, learner?.name || reg.learner_email)}
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
                                            <label className="block text-sm font-medium mb-1">Learner Email *</label>
                                            <select
                                                value={registrationForm.learnerEmail}
                                                onChange={(e) => setRegistrationForm({ ...registrationForm, learnerEmail: e.target.value })}
                                                disabled={!!editingRegistration}
                                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                            >
                                                <option value="">Select a learner</option>
                                                {alllearners.map((learner) => (
                                                    <option key={learner.email} value={learner.email}>
                                                        {learner.name} - {learner.grade} ({learner.email})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {registrationForm.learnerEmail && (() => {
                                            const selectedLearner = alllearners.find(s => s.email === registrationForm.learnerEmail);
                                            return selectedLearner ? (
                                                <div className="bg-green-50 p-3 rounded-lg text-sm">
                                                    <div className="font-medium text-green-900">Selected Learner:</div>
                                                    <div className="text-green-700 mt-1">
                                                        <div>Name: {selectedLearner.name}</div>
                                                        <div>Grade/Class: {selectedLearner.grade}</div>
                                                        <div>Email: {selectedLearner.email}</div>
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
                                            setRegistrationForm({ learnerEmail: "", teamMembers: "", notes: "", status: "upcoming" });
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
                                                Current Registrations: {competitionRegistrations.length} learners
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
                                                <li>• Download the template file and fill in learner details</li>
                                                <li>• Learner emails must match exactly with learners in your system</li>
                                                <li>• Team members should be comma-separated (optional)</li>
                                                <li>• Save as Excel (.xlsx) or CSV format</li>
                                                <li>• Maximum 100 learners per upload</li>
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
                                        {bulkUploadProgress ? 'Processing...' : 'Upload & Register Learners'}
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
                                min={getTodayDateStr()}
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
                                {(() => {
                                    const isPastUpcoming = viewComp.status === 'upcoming' && isPastDateStr(viewComp.competition_date || viewComp.date);
                                    return (
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                            isPastUpcoming ? 'bg-gray-100 text-gray-700' :
                                            viewComp.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                                            viewComp.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                                            viewComp.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {isPastUpcoming ? 'Past' :
                                             viewComp.status === 'upcoming' ? ' Upcoming' :
                                             viewComp.status === 'ongoing' ? 'Ongoing' :
                                             viewComp.status === 'completed' ? 'Completed' :
                                             'Cancelled'}
                                        </span>
                                    );
                                })()}
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
                                    Register Learners
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
                                min={getTodayDateStr()}
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

                            {/* Learner List */}
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
                                            const learner = alllearners.find(s => s.id === memberId);
                                            const learnerName = learner?.name || memberId;
                                            const learnerGrade = learner?.grade || 'N/A';
                                            
                                            return (
                                                <div
                                                    key={memberId}
                                                    className="flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-sm"
                                                >
                                                    <div className="flex-1">
                                                        <div className="font-medium text-sm">{learnerName}</div>
                                                        <div className="text-xs text-slate-500">{learnerGrade}</div>
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
    open={learnerDrawer.open}
    onClose={() => {
        setlearnerDrawer({ open: false, club: null });
        setlearnerSearchQuery("");
    }}
    title={`Manage Learners - ${learnerDrawer.club?.name ?? ""}`}
>
    {learnerDrawer.club && (
        <div className="space-y-3">
            <div className="text-sm text-slate-600 mb-4">
                Current Members: {learnerDrawer.club.members.length} / {learnerDrawer.club.capacity}
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    value={learnerSearchQuery}
                    onChange={(e) => setlearnerSearchQuery(e.target.value)}
                    placeholder="Search by name, email, or grade..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {learnerSearchQuery && (
                    <button
                        onClick={() => setlearnerSearchQuery("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {loadinglearners ? (
                <div className="text-center py-8 text-slate-500">
                    Loading learners...
                </div>
            ) : alllearners.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    No learners found. Learners will appear here once they register.
                </div>
            ) : (() => {
                const filteredlearners = alllearners.filter((learner) => {
                    if (!learnerSearchQuery) return true;
                    const query = learnerSearchQuery.toLowerCase();
                    return (
                        learner.name.toLowerCase().includes(query) ||
                        learner.email.toLowerCase().includes(query) ||
                        learner.grade.toLowerCase().includes(query)
                    );
                });

                if (filteredlearners.length === 0) {
                    return (
                        <div className="text-center py-8 text-slate-500">
                            {learnerSearchQuery ? (
                                <>
                                    No learners found matching "{learnerSearchQuery}"
                                    <button
                                        onClick={() => setlearnerSearchQuery("")}
                                        className="block mx-auto mt-2 text-blue-600 hover:underline text-sm"
                                    >
                                        Clear search
                                    </button>
                                </>
                            ) : (
                                "No learners available"
                            )}
                        </div>
                    );
                }

                return (
                    <div className="max-h-96 overflow-y-auto space-y-2">
                        {filteredlearners.map((learner) => {
                            const isEnrolled = learnerDrawer.club.members.includes(learner.id);
                            const isFull = learnerDrawer.club.members.length >= learnerDrawer.club.capacity;

                            return (
                                <div
                                    key={learner.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                                >
                                    <div>
                                        <div className="font-medium text-sm">{learner.name}</div>
                                        <div className="text-xs text-slate-500">{learner.grade} • {learner.email}</div>
                                    </div>

                                    {isEnrolled ? (
                                        <button
                                            onClick={() => handlelearnerLeave(learner.id, learnerDrawer.club)}
                                            className="flex items-center gap-1 px-3 py-1 text-sm bg-red-50 text-red-600 rounded-md border border-red-100 hover:bg-red-100"
                                        >
                                            <X size={14} />
                                            Remove
                                        </button>
                                    ) : (
                                        <button
                                            disabled={isFull}
                                            onClick={() => handlelearnerEnroll(learner.id, learnerDrawer.club)}
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
                        setlearnerDrawer({ open: false, club: null });
                        setlearnerSearchQuery("");
                    }}
                    className="w-full px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                    Close
                </button>
            </div>
        </div>
    )}
</Modal>

                <ConfirmDeleteModal
                    open={!!deleteConfirm}
                    itemLabel={deleteConfirm?.itemLabel}
                    itemName={deleteConfirm?.itemName}
                    onCancel={() => setDeleteConfirm(null)}
                    onConfirm={() => deleteConfirm?.onConfirm()}
                />
            </div>
        </div>

    );
}