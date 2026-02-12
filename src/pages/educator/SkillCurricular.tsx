import React, { useState, useMemo, useEffect, useRef } from "react";
import {
    Search,
    Users,
    Calendar,
    Trophy,
    Plus,
    X,
    ChevronDown,
    FileDown,
    Edit,
    Trash2,
    Filter,
    Download,
    UserPlus,
    Clock,
    MapPin,
    User,
    Eye,
    CheckCircle,
    Info,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useEducatorSchool } from "../../hooks/useEducatorSchool";
import * as clubsService from "../../services/clubsService";
import * as competitionsService from "../../services/competitionsService";
import * as XLSX from 'xlsx';

const categories = [
    { id: "all", label: "All Categories" },
    { id: "arts", label: "Arts" },
    { id: "sports", label: "Sports" },
    { id: "robotics", label: "Robotics" },
    { id: "science", label: "Science" },
    { id: "literature", label: "Literature" },
];

const competitionStatuses = [
    { id: "all", label: "All Statuses" },
    { id: "upcoming", label: "Upcoming" },
    { id: "ongoing", label: "Ongoing" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
];

const competitionLevels = [
    { id: "all", label: "All Levels" },
    { id: "intraschool", label: "Intra-School" },
    { id: "interschool", label: "Inter-School" },
    { id: "district", label: "District" },
    { id: "state", label: "State" },
    { id: "national", label: "National" },
    { id: "international", label: "International" },
];

const competitionCategories = [
    { id: "all", label: "All Categories" },
    { id: "arts", label: "Arts" },
    { id: "sports", label: "Sports" },
    { id: "robotics", label: "Robotics" },
    { id: "science", label: "Science" },
    { id: "literature", label: "Literature" },
];

function formatDate(d: string | Date | null | undefined): string {
    if (!d) return 'TBD';
    try {
        const dd = new Date(d);
        if (isNaN(dd.getTime())) return 'TBD';
        return dd.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return 'TBD';
    }
}

function downloadCSV(filename: string, rows: Record<string, any>[]): void {
    if (!rows || !rows.length) {
        console.warn('No data available for CSV export');
        return;
    }
    
    try {
        const header = Object.keys(rows[0]);
        const csv = [header.join(",")]
            .concat(
                rows.map((r: Record<string, any>) => header.map((h) => {
                    const value = (r[h] ?? "").toString().replace(/"/g, '""');
                    // Wrap in quotes if contains comma, newline, or quote
                    return value.includes(',') || value.includes('\n') || value.includes('"') 
                        ? `"${value}"` 
                        : value;
                }).join(","))
            )
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        console.log(`✅ CSV exported successfully: ${filename}`);
    } catch (error: any) {
        console.error('❌ Error exporting CSV:', error);
        throw new Error('Failed to export CSV file');
    }
}

interface ClubCardProps {
    club: Club;
    isJoined: boolean;
    onJoin: (club: Club) => void;
    onLeave: (club: Club) => void;
    onOpenDetails: (club: Club) => void;
    onEdit: (club: Club) => void;
    onDelete: (club: Club) => void;
}

function ClubCard({ club, isJoined, onJoin, onLeave, onOpenDetails, onEdit, onDelete }: ClubCardProps) {
    const memberCount = club.members?.length ?? 0;
    const full = memberCount >= club.capacity;
    const [showMenu, setShowMenu] = React.useState(false);
    const [showFullDescription, setShowFullDescription] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    // Check if description is long (more than 100 characters)
    const isLongDescription = club.description && club.description.length > 100;
    const displayDescription = showFullDescription || !isLongDescription 
        ? club.description 
        : club.description?.substring(0, 100) + '...';

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showMenu]);

    return (
        <div className="group bg-white rounded-xl hover:shadow-lg transition-all duration-300 overflow-hidden shadow-sm">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="bg-white rounded-lg p-2 shadow-sm">
                            <Users size={22} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-xl">{club.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 capitalize">
                                    {club.category}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Three-dot menu */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                            title="More actions"
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-gray-600">
                                <circle cx="10" cy="4" r="1.5" />
                                <circle cx="10" cy="10" r="1.5" />
                                <circle cx="10" cy="16" r="1.5" />
                            </svg>
                        </button>

                        {/* Dropdown menu */}
                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1">
                                <button
                                    onClick={() => {
                                        onOpenDetails(club);
                                        setShowMenu(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Eye size={14} />
                                    View Details
                                </button>
                                
                                {!isJoined ? (
                                    <button
                                        disabled={full}
                                        onClick={() => {
                                            onJoin(club);
                                            setShowMenu(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                                            full 
                                                ? "text-gray-400 cursor-not-allowed" 
                                                : "text-blue-600 hover:bg-blue-50"
                                        }`}
                                    >
                                        <UserPlus size={14} />
                                        {full ? 'Full' : 'Manage Members'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            onLeave(club);
                                            setShowMenu(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <X size={14} />
                                        Leave Club
                                    </button>
                                )}
                                
                                <div className="border-t border-gray-100 my-1"></div>
                                
                                <button
                                    onClick={() => {
                                        onEdit(club);
                                        setShowMenu(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Edit size={14} />
                                    Edit Club
                                </button>
                                
                                <button
                                    onClick={() => {
                                        onDelete(club);
                                        setShowMenu(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <Trash2 size={14} />
                                    Delete Club
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="mb-3">
                    <p className="text-base text-gray-600 leading-relaxed">
                        {displayDescription}
                    </p>
                    {isLongDescription && (
                        <button
                            onClick={() => setShowFullDescription(!showFullDescription)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1"
                        >
                            {showFullDescription ? 'View less' : 'View more'}
                        </button>
                    )}
                </div>

                {/* Member Count Section */}
                <div className="p-2.5 mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-700">Club Members</span>
                        <span className="text-base font-semibold text-gray-900">{memberCount}/{club.capacity}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min((memberCount / club.capacity) * 100, 100)}%` }}
                        ></div>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                        <span className="text-sm text-gray-500">
                            {memberCount === 0 ? 'No members yet' : `${memberCount} enrolled`}
                        </span>
                        <span className="text-sm text-gray-500">
                            {club.capacity - memberCount} spots left
                        </span>
                    </div>
                </div>

                {/* Meeting Info */}
                {(club.meeting_day || club.meeting_time || club.location) && (
                    <div className="p-2.5 mb-3 space-y-1.5">
                        <div className="text-sm font-medium text-gray-700 mb-1.5">Meeting Details</div>
                        {club.meeting_day && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar size={14} />
                                <span>{club.meeting_day}</span>
                            </div>
                        )}
                        {club.meeting_time && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock size={14} />
                                <span>{club.meeting_time}</span>
                            </div>
                        )}
                        {club.location && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin size={14} />
                                <span>{club.location}</span>
                            </div>
                        )}
                    </div>
                )}

                {club.upcomingCompetitions?.length ? (
                    <div className="mb-2">
                        <span className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
                            <Trophy size={12} /> 
                            {club.upcomingCompetitions.length} Upcoming Competition{club.upcomingCompetitions.length > 1 ? 's' : ''}
                        </span>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    totalItems: number;
    itemType: string;
}

function Pagination({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems, itemType }: PaginationProps) {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }
        
        return pages;
    };

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex items-center justify-between mt-8 px-4 py-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-4">
                <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{' '}
                    <span className="font-medium">{totalItems}</span> {itemType}
                </p>
            </div>
            
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500"
                >
                    <ChevronLeft size={16} />
                    Previous
                </button>
                
                <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => (
                        <button
                            key={index}
                            onClick={() => typeof page === 'number' ? onPageChange(page) : null}
                            disabled={typeof page !== 'number'}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                page === currentPage
                                    ? 'bg-blue-600 text-white'
                                    : typeof page === 'number'
                                    ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                    : 'text-gray-400 cursor-default'
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>
                
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500"
                >
                    Next
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

function Modal({ open, onClose, title, children }: ModalProps) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100">
                        <X />
                    </button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    );
}

interface Club {
    club_id: string;
    name: string;
    category: string;
    description: string;
    capacity: number;
    members?: string[];
    meeting_day?: string;
    meeting_time?: string;
    location?: string;
    upcomingCompetitions?: any[];
    avgAttendance?: number;
    is_active?: boolean;
}

interface Competition {
    comp_id: string;
    name: string;
    level: string;
    date?: string;
    competition_date?: string;
    description?: string;
    category?: string;
    status: string;
    participatingClubs?: string[];
    results?: any[];
    reward?: string;
    skill_level?: string;
    team_size?: string;
}

interface Student {
    id: string;
    user_id?: string;
    email: string;
    name: string;
    grade: string;
    section: string;
    rollNumber: string;
    school_id: string;
    school_class_id?: string;
}

interface Notice {
    type: 'error' | 'success' | 'info' | 'warning';
    text: string;
}

export default function ClubsActivitiesPage() {
    const currentStudent = useMemo(() => ({ id: "s_new", name: "You" }), []);

    const [clubs, setClubs] = useState<Club[]>([]);
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    
    // Tab state
    const [activeTab, setActiveTab] = useState("clubs");
    const [currentPage, setCurrentPage] = useState(1);
    const [currentCompetitionPage, setCurrentCompetitionPage] = useState(1);
    const [competitionSearchQuery, setCompetitionSearchQuery] = useState("");
    
    // Competition filters
    const [competitionStatusFilter, setCompetitionStatusFilter] = useState("all");
    const [competitionCategoryFilter, setCompetitionCategoryFilter] = useState("all");
    const [competitionLevelFilter, setCompetitionLevelFilter] = useState("all");
    const [showCompetitionFilters, setShowCompetitionFilters] = useState(false);
    const [competitionViewMode, setCompetitionViewMode] = useState("grid"); // "grid" or "list"
    const [clubViewMode, setClubViewMode] = useState("grid"); // "grid" or "list"
    
    // Pagination settings
    const ITEMS_PER_PAGE = 6; // 3x3 grid

    // Enhanced tab switching with keyboard support
    const handleTabSwitch = (tab: string) => {
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
        const handleKeyPress = (e: KeyboardEvent) => {
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

    // Close filter dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
                setShowCompetitionFilters(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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
            .line-clamp-1 {
                display: -webkit-box;
                -webkit-line-clamp: 1;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            .line-clamp-2 {
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
        `;
        document.head.appendChild(style);
        
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Get educator's school information with class assignments
    const { school: educatorSchool, college: educatorCollege, educatorType, assignedClassIds, loading: schoolLoading } = useEducatorSchool();
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clubsData, competitionsData] = await Promise.all([
                    clubsService.fetchClubs(),
                    competitionsService.fetchCompetitions()
                ]);
                setClubs(clubsData);
                setCompetitions(competitionsData);
            } catch (error: any) {
                console.error('Error fetching data:', error);
                // Silently handle error - don't show notice to user
            }
        };

        fetchData();
    }, []);

    const [q, setQ] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [selectedClub, setSelectedClub] = useState<Club | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [viewComp, setViewComp] = useState<Competition | null>(null);
    const [notice, setNotice] = useState<Notice | null>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [registerCompModal, setRegisterCompModal] = useState<Competition | null>(null);
    const [addClubModal, setAddClubModal] = useState(false);
    const [addCompModal, setAddCompModal] = useState(false);
    const [editClubModal, setEditClubModal] = useState<Club | null>(null);
    const [editClubForm, setEditClubForm] = useState({
        name: "",
        category: "arts",
        description: "",
        capacity: 30,
        meeting_day: "",
        meeting_time: "",
        location: ""
    });
    const [studentDrawer, setStudentDrawer] = useState<{ open: boolean; club: Club | null }>({ open: false, club: null });
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [studentSearchQuery, setStudentSearchQuery] = useState("");
    const [attendanceModal, setAttendanceModal] = useState<{ open: boolean; club: Club | null }>({ open: false, club: null });
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceTopic, setAttendanceTopic] = useState("");
    const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});

    // Ref for filter dropdown
    const filterDropdownRef = useRef<HTMLDivElement>(null);

    // Fetch real students from Supabase (filtered by educator's assigned classes)
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoadingStudents(true);
                
                // Wait for educator school data to be loaded
                if (schoolLoading || (!educatorSchool && !educatorCollege)) {
                    setAllStudents([]);
                    setLoadingStudents(false);
                    return;
                }

                console.log('🔍 [SkillCurricular] Fetching students for educator type:', educatorType);
                
                let students: Student[] = [];
                
                if (educatorType === 'school' && educatorSchool) {
                    // For school educators, filter by assigned classes
                    if (assignedClassIds && assignedClassIds.length > 0) {
                        console.log('📚 [SkillCurricular] Fetching students for assigned classes:', assignedClassIds);
                        const { data, error } = await supabase
                            .from('students')
                            .select('id, user_id, email, name, grade, section, roll_number, school_id, school_class_id')
                            .eq('school_id', educatorSchool.id)
                            .in('school_class_id', assignedClassIds)
                            .eq('is_deleted', false)
                            .order('name');

                        if (error) {
                            console.error('❌ [SkillCurricular] Error fetching students:', error);
                        } else {
                            students = (data || []) as any[];
                        }
                    } else {
                        // Fallback for admins or educators without class assignments
                        console.log('👨‍💼 [SkillCurricular] Fetching all school students (admin/no assignments)');
                        const { data, error } = await supabase
                            .from('students')
                            .select('id, user_id, email, name, grade, section, roll_number, school_id, school_class_id')
                            .eq('school_id', educatorSchool.id)
                            .eq('is_deleted', false)
                            .order('name');

                        if (error) {
                            console.error('❌ [SkillCurricular] Error fetching students:', error);
                        } else {
                            students = (data || []) as any[];
                        }
                    }
                } else if (educatorType === 'college' && educatorCollege) {
                    // For college educators, filter by college
                    console.log('🎓 [SkillCurricular] Fetching college students for college:', educatorCollege.id);
                    const { data, error } = await supabase
                        .from('students')
                        .select('id, user_id, email, name, grade, section, roll_number, college_id')
                        .eq('college_id', educatorCollege.id)
                        .eq('is_deleted', false)
                        .order('name');

                    if (error) {
                        console.error('❌ [SkillCurricular] Error fetching college students:', error);
                    } else {
                        students = (data || []) as any[];
                    }
                }

                if (students.length === 0) {
                    console.log('⚠️ [SkillCurricular] No students found for educator');
                    setAllStudents([]);
                    setLoadingStudents(false);
                    return;
                }

                // Map students to the format we need (using user_id as primary ID, consistent with other educator pages)
                const mappedStudents: Student[] = students.map((student: any) => ({
                    id: student.user_id || student.id, // Use user_id as primary identifier
                    user_id: student.user_id,
                    email: student.email,
                    name: student.name || student.email,
                    grade: student.grade || 'N/A',
                    section: student.section || '',
                    rollNumber: student.roll_number || '',
                    school_id: student.school_id || student.college_id || '',
                    school_class_id: student.school_class_id
                }));
                
                console.log(`✅ [SkillCurricular] Loaded ${mappedStudents.length} students for ${educatorType || 'unknown'} educator`);
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
    }, [educatorSchool, educatorCollege, educatorType, assignedClassIds, schoolLoading]);
    const [newCompForm, setNewCompForm] = useState({
        name: "",
        level: "district",
        date: "",
        description: "",
        category: "",
        status: "upcoming",
        results: [] as any[],
        participatingClubs: [] as string[]
    });

    const [newClubForm, setNewClubForm] = useState({
        name: "",
        category: "arts",
        description: "",
        capacity: 30,
        meeting_day: "",
        meeting_time: "",
        location: ""
    });
    const [clubFormErrors, setClubFormErrors] = useState<Record<string, string>>({});
    
    const [registrationForm, setRegistrationForm] = useState({
        studentEmail: "",
        teamMembers: "",
        notes: "",
        status: "upcoming"
    });
    
    const [editCompModal, setEditCompModal] = useState<Competition | null>(null);
    const [editCompForm, setEditCompForm] = useState({
        name: "",
        level: "district",
        date: "",
        description: "",
        category: "",
        status: "upcoming",
        results: [] as any[],
        participatingClubs: [] as string[]
    });
    const [compFormErrors, setCompFormErrors] = useState<Record<string, string>>({});
    const [competitionRegistrations, setCompetitionRegistrations] = useState<any[]>([]);
    const [editingRegistration, setEditingRegistration] = useState<any>(null);
    const [registrationTab, setRegistrationTab] = useState("individual"); // "individual" or "bulk"
    const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
    const [bulkUploadProgress, setBulkUploadProgress] = useState<string | null>(null);

    const joinedClubIds = useMemo(() => {
        // Since club members are stored by email, we need to check using email, not ID
        // For educator view, we don't actually need this since educators manage students, not join clubs themselves
        return new Set(); // Return empty set since educators don't join clubs
    }, [clubs, currentStudent]);

    const filteredClubs = useMemo(() => {
        return clubs.filter((c) => {
            if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
            if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
            return true;
        });
    }, [clubs, q, categoryFilter]);

    const filteredCompetitions = useMemo(() => {
        return competitions.filter((comp) => {
            if (competitionSearchQuery && !comp.name.toLowerCase().includes(competitionSearchQuery.toLowerCase())) return false;
            if (competitionStatusFilter !== "all" && comp.status !== competitionStatusFilter) return false;
            if (competitionCategoryFilter !== "all" && comp.category !== competitionCategoryFilter) return false;
            if (competitionLevelFilter !== "all" && comp.level !== competitionLevelFilter) return false;
            return true;
        });
    }, [competitions, competitionSearchQuery, competitionStatusFilter, competitionCategoryFilter, competitionLevelFilter]);

    // Pagination calculations for clubs
    const totalClubPages = Math.ceil(filteredClubs.length / ITEMS_PER_PAGE);
    const paginatedClubs = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredClubs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredClubs, currentPage]);

    // Pagination calculations for competitions
    const totalCompetitionPages = Math.ceil(filteredCompetitions.length / ITEMS_PER_PAGE);
    const paginatedCompetitions = useMemo(() => {
        const startIndex = (currentCompetitionPage - 1) * ITEMS_PER_PAGE;
        return filteredCompetitions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredCompetitions, currentCompetitionPage]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [q, categoryFilter]);

    useEffect(() => {
        setCurrentCompetitionPage(1);
    }, [competitionSearchQuery, competitionStatusFilter, competitionCategoryFilter, competitionLevelFilter]);

    const enrollStudent = (club: Club) => {
        setStudentDrawer({ open: true, club: club });
    };

    const leaveClub = async (_selectedClub: Club) => {
        // This function is not used in educator interface since educators manage students, not join clubs
        // But keeping it for consistency - would need currentStudent.email if used
        setNotice({ type: "info", text: "Educators manage student memberships through the 'Manage' button." });
    };

    const openDetails = (club: Club) => {
        setSelectedClub(club);
        setDetailsOpen(true);
    };

    const openAttendanceModal = (selectedClub: Club) => {
        setAttendanceModal({ open: true, club: selectedClub });
        setAttendanceDate(new Date().toISOString().split('T')[0]);
        setAttendanceTopic("");
        // Initialize attendance records for all club members (using email as key)
        const records: Record<string, string> = {};
        const members = selectedClub.members || [];
        members.forEach((memberEmail: string) => {
            records[memberEmail] = 'present'; // Default to present
        });
        setAttendanceRecords(records);
    };

    const handleAttendanceStatusChange = (studentId: string, status: string) => {
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
                status: status as "present" | "absent" | "late" | "excused"
            }));

            await clubsService.markAttendance(
                attendanceModal.club?.club_id || '',
                attendanceDate,
                attendanceTopic,
                attendanceRecordsArray
            );

            const presentCount = Object.values(attendanceRecords).filter(status => status === 'present' || status === 'late').length;
            const totalCount = Object.keys(attendanceRecords).length;

            setNotice({ 
                type: "success", 
                text: `Attendance saved for ${attendanceModal.club?.name || 'club'}! ${presentCount}/${totalCount} present` 
            });
            
            setAttendanceModal({ open: false, club: null });
            setAttendanceRecords({});
        } catch (error: any) {
            console.error('Error saving attendance:', error);
            
            // Provide specific error messages
            let errorMessage = "Failed to save attendance. Please try again.";
            
            if (error?.code === '23505') {
                errorMessage = "Attendance for this date has already been recorded. The system will update the existing records.";
            } else if (error?.message) {
                errorMessage = error.message;
            }
            
            setNotice({ type: "error", text: errorMessage });
        }
    };
   const handleStudentEnroll = async (studentId: string, club: Club) => {
        // Find the student to get their email first
        const student = allStudents.find(s => s.id === studentId);
        if (!student) {
            setNotice({ type: "error", text: "Student not found." });
            return;
        }

        if ((club.members?.length ?? 0) >= club.capacity) {
            setNotice({ type: "error", text: "Club is full. Cannot join." });
            return;
        }

        try {
            // Double-check enrollment status by fetching fresh data from server
            console.log('🔍 Checking enrollment status for:', student.email, 'in club:', club.club_id);
            const { data: existingMembership } = await supabase
                .from('club_memberships')
                .select('*')
                .eq('club_id', club.club_id)
                .eq('student_email', student.email)
                .eq('status', 'active')
                .single();

            if (existingMembership) {
                console.log('⚠️ Student already enrolled (found in database):', existingMembership);
                setNotice({ type: "warning", text: `${student.name} is already enrolled in this club.` });
                
                // Refresh club data to sync local state
                const refreshedClubs = await clubsService.fetchClubs();
                setClubs(refreshedClubs);
                return;
            }

            // Check if student is already enrolled (using email, not ID) - local check
            if (club.members?.includes(student.email)) {
                console.log('⚠️ Student already enrolled (found in local state)');
                setNotice({ type: "warning", text: `${student.name} is already enrolled in this club.` });
                return;
            }

            // Check how many clubs this student is already enrolled in
            const studentClubCount = clubs.filter(c => (c.members || []).includes(student.email)).length;
            
            if (studentClubCount >= 5) {
                setNotice({ 
                    type: "error", 
                    text: `${student.name} is already enrolled in 5 clubs and cannot join more. Please remove them from another club first.` 
                });
                return;
            }

            console.log('✅ Proceeding with enrollment for:', student.email);
            
            // Enroll student in database first
            await clubsService.enrollStudent(club.club_id, student.email);
            
            console.log('✅ Database enrollment successful, updating local state');
            
            // Only update local state after successful database operation
            const updated = clubs.map((c) => 
                c.club_id === club.club_id 
                    ? { ...c, members: [...(c.members || []), student.email] } 
                    : c
            );
            setClubs(updated);
            
            // Refresh the student drawer with updated club data
            const updatedClub = updated.find(c => c.club_id === club.club_id) || null;
            setStudentDrawer({ open: true, club: updatedClub });
            
            setNotice({ type: "success", text: `${student.name} enrolled in ${club?.name || 'club'}` });
            
        } catch (error: any) {
            console.error('Error enrolling student:', error);
            
            // Check for specific error messages from the backend
            let errorMessage = "Failed to enroll student. Please try again.";
            
            if (error?.message?.includes('5 clubs') || error?.message?.includes('club limit')) {
                errorMessage = `${student.name} is already enrolled in 5 clubs and cannot join more.`;
            } else if (error?.code === '23505') {
                errorMessage = `${student.name} is already enrolled in this club.`;
                
                // Refresh club data from server to ensure we have the latest state
                try {
                    console.log('🔄 Refreshing club data due to duplicate key error');
                    const refreshedClubs = await clubsService.fetchClubs();
                    setClubs(refreshedClubs);
                } catch (refreshError: any) {
                    console.error('Error refreshing club data:', refreshError);
                }
                
            } else if (error?.message?.includes('duplicate key')) {
                errorMessage = `${student.name} is already enrolled in this club.`;
                
                // Refresh club data from server to ensure we have the latest state
                try {
                    console.log('🔄 Refreshing club data due to duplicate key error');
                    const refreshedClubs = await clubsService.fetchClubs();
                    setClubs(refreshedClubs);
                } catch (refreshError: any) {
                    console.error('Error refreshing club data:', refreshError);
                }
                
            } else if (error?.message) {
                errorMessage = error.message;
            }
            
            setNotice({ type: "error", text: errorMessage });
        }
    };

const handleStudentLeave = async (studentId: string, club: Club) => {
    try {
        // Find the student to get their email
        const student = allStudents.find(s => s.id === studentId);
        if (!student) {
            setNotice({ type: "error", text: "Student not found." });
            return;
        }

        // Check if student is actually a member (by email, not ID)
        if (!(club.members || []).includes(student.email)) {
            setNotice({ type: "warning", text: `${student.name} is not a member of this club.` });
            return;
        }

        await clubsService.removeStudent(club.club_id, student.email);
        
        const updated = clubs.map((c) => 
            c.club_id === club.club_id 
                ? { ...c, members: (c.members || []).filter((m) => m !== student.email) } 
                : c
        );
        setClubs(updated);
        setStudentDrawer({ open: true, club: updated.find(c => c.club_id === club.club_id) || null });
        setNotice({ type: "info", text: `${student.name} removed from ${club?.name || 'club'}` });
    } catch (error: any) {
        console.error('Error removing student:', error);
        setNotice({ type: "error", text: "Failed to remove student. Please try again." });
    }
};

    const buildClubParticipationRows = async () => {
        try {
            console.log('📊 Building club participation report...');
            
            // Try to fetch from Supabase views first
            const { data: reportData, error } = await supabase
                .from('club_participation_report')
                .select('*');
            
            if (!error && reportData && reportData.length > 0) {
                console.log('✅ Using database report data:', reportData.length, 'records');
                return reportData.map(row => ({
                    "Club Name": row.club_name || 'N/A',
                    "Category": row.category || 'N/A',
                    "Student Count": row.student_count || 0,
                    "Capacity": row.capacity || 0,
                    "Utilization %": row.capacity ? Math.round((row.student_count / row.capacity) * 100) + '%' : '0%',
                    "Average Attendance": row.avg_attendance ? row.avg_attendance + '%' : 'N/A',
                    "Total Sessions": row.total_sessions || 0,
                    "Active Status": row.is_active ? 'Active' : 'Inactive',
                    "Created Date": row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'
                }));
            }
            
            console.log('⚠️ Database report not available, using local data');
            
            // Fallback to local clubs data with enhanced information
            if (!clubs || clubs.length === 0) {
                console.warn('No clubs data available for export');
                return [];
            }
            
            return clubs.map((club) => {
                const memberCount = club.members?.length || 0;
                const utilizationPercent = club.capacity ? Math.round((memberCount / club.capacity) * 100) : 0;
                
                return {
                    "Club Name": club.name || 'N/A',
                    "Category": club.category || 'N/A',
                    "Student Count": memberCount,
                    "Capacity": club.capacity || 0,
                    "Utilization %": utilizationPercent + '%',
                    "Average Attendance": club.avgAttendance ? club.avgAttendance + '%' : 'N/A',
                    "Meeting Day": club.meeting_day || 'N/A',
                    "Meeting Time": club.meeting_time || 'N/A',
                    "Location": club.location || 'N/A',
                    "Active Status": club.is_active !== false ? 'Active' : 'Inactive'
                };
            });
            
        } catch (err) {
            console.error('❌ Error building club report:', err);
            
            // Final fallback with minimal data
            return clubs?.map((club) => ({
                "Club Name": club.name || 'N/A',
                "Category": club.category || 'N/A',
                "Student Count": club.members?.length || 0,
                "Capacity": club.capacity || 0,
                "Status": 'Active'
            })) || [];
        }
    };

    const buildCompetitionPerformanceRows = async () => {
        try {
            console.log('🏆 Building competition performance report...');
            
            // Try to fetch from Supabase views first
            const { data: reportData, error } = await supabase
                .from('competition_performance_report')
                .select('*');
            
            if (!error && reportData && reportData.length > 0) {
                console.log('✅ Using database competition report:', reportData.length, 'records');
                return reportData.map(row => ({
                    "Competition Name": row.competition_name || 'N/A',
                    "Level": row.level || 'N/A',
                    "Category": row.category || 'N/A',
                    "Date": row.competition_date ? new Date(row.competition_date).toLocaleDateString() : 'N/A',
                    "Status": row.status || 'N/A',
                    "Total Participants": row.total_participants || 0,
                    "Registered Students": row.registered_students || 0,
                    "Results Summary": row.student_results || 'N/A',
                    "Awards Won": row.awards_won || 'N/A',
                    "Average Score": row.avg_score || 'N/A'
                }));
            }
            
            console.log('⚠️ Database competition report not available, using local data');
            
            // Fallback to local competitions data
            if (!competitions || competitions.length === 0) {
                console.warn('No competitions data available for export');
                return [];
            }
            
            return competitions.map((comp) => {
                const competitionDate = comp.competition_date || comp.date;
                const resultsCount = comp.results?.length || 0;
                const participatingClubsCount = comp.participatingClubs?.length || 0;
                
                return {
                    "Competition Name": comp.name || 'N/A',
                    "Level": comp.level || 'N/A',
                    "Category": comp.category || 'N/A',
                    "Date": competitionDate ? new Date(competitionDate).toLocaleDateString() : 'N/A',
                    "Status": comp.status || 'N/A',
                    "Participating Clubs": participatingClubsCount,
                    "Results Count": resultsCount,
                    "Description": comp.description || 'N/A',
                    "Skill Level": comp.skill_level || 'N/A',
                    "Team Size": comp.team_size || 'N/A'
                };
            });
            
        } catch (err) {
            console.error('❌ Error building competition report:', err);
            
            // Final fallback with minimal data
            return competitions?.map((comp) => ({
                "Competition Name": comp.name || 'N/A',
                "Level": comp.level || 'N/A',
                "Date": comp.competition_date || comp.date || 'N/A',
                "Status": comp.status || 'N/A'
            })) || [];
        }
    };

    const exportClubsCSV = async () => {
        try {
            setNotice({ type: "info", text: "Preparing clubs export..." });
            const rows = await buildClubParticipationRows();
            
            if (rows && rows.length > 0) {
                downloadCSV("club_participation_report", rows);
                setNotice({ type: "success", text: `Successfully exported ${rows.length} club records to CSV!` });
            } else {
                setNotice({ type: "error", text: "No club data available to export" });
            }
        } catch (error: any) {
            console.error('❌ Export clubs CSV error:', error);
            setNotice({ type: "error", text: "Failed to export clubs data. Please try again." });
        } finally {
            setShowExportMenu(false);
        }
    };

    const exportCompetitionsCSV = async () => {
        try {
            setNotice({ type: "info", text: "Preparing competitions export..." });
            const rows = await buildCompetitionPerformanceRows();
            
            if (rows && rows.length > 0) {
                downloadCSV("competition_performance_report", rows);
                setNotice({ type: "success", text: `Successfully exported ${rows.length} competition records to CSV!` });
            } else {
                setNotice({ type: "error", text: "No competition data available to export" });
            }
        } catch (error: any) {
            console.error('❌ Export competitions CSV error:', error);
            setNotice({ type: "error", text: "Failed to export competitions data. Please try again." });
        } finally {
            setShowExportMenu(false);
        }
    };

    const exportClubsExcel = async () => {
        try {
            setNotice({ type: "info", text: "Preparing clubs Excel export..." });
            const rows = await buildClubParticipationRows();
            
            if (rows && rows.length > 0) {
                const worksheet = XLSX.utils.json_to_sheet(rows);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Club Participation");
                
                // Auto-size columns
                const maxWidth: Record<string, number> = rows.reduce((w: Record<string, number>, r: any) => {
                    return Object.keys(r).reduce((acc, key) => {
                        const value = (r as any)[key]?.toString() || '';
                        acc[key] = Math.max(acc[key] || 10, Math.min(value.length + 2, 50));
                        return acc;
                    }, w);
                }, {});
                
                worksheet['!cols'] = Object.keys(maxWidth).map(key => ({ wch: (maxWidth as any)[key] }));
                
                // Add header styling
                const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
                for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
                    if (!worksheet[cellAddress]) continue;
                    worksheet[cellAddress].s = {
                        font: { bold: true },
                        fill: { fgColor: { rgb: "E3F2FD" } }
                    };
                }
                
                const timestamp = new Date().toISOString().split('T')[0];
                XLSX.writeFile(workbook, `club_participation_report_${timestamp}.xlsx`);
                setNotice({ type: "success", text: `Successfully exported ${rows.length} club records to Excel!` });
            } else {
                setNotice({ type: "error", text: "No club data available to export" });
            }
        } catch (error: any) {
            console.error('❌ Export clubs Excel error:', error);
            setNotice({ type: "error", text: "Failed to export clubs Excel. Please try again." });
        } finally {
            setShowExportMenu(false);
        }
    };

    const exportCompetitionsExcel = async () => {
        try {
            setNotice({ type: "info", text: "Preparing competitions Excel export..." });
            const rows = await buildCompetitionPerformanceRows();
            
            if (rows && rows.length > 0) {
                const worksheet = XLSX.utils.json_to_sheet(rows);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Competition Performance");
                
                // Auto-size columns
                const maxWidth: Record<string, number> = rows.reduce((w: Record<string, number>, r: any) => {
                    return Object.keys(r).reduce((acc, key) => {
                        const value = (r as any)[key]?.toString() || '';
                        acc[key] = Math.max(acc[key] || 10, Math.min(value.length + 2, 50));
                        return acc;
                    }, w);
                }, {});
                
                worksheet['!cols'] = Object.keys(maxWidth).map(key => ({ wch: (maxWidth as any)[key] }));
                
                // Add header styling
                const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
                for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
                    if (!worksheet[cellAddress]) continue;
                    worksheet[cellAddress].s = {
                        font: { bold: true },
                        fill: { fgColor: { rgb: "FFF3E0" } }
                    };
                }
                
                const timestamp = new Date().toISOString().split('T')[0];
                XLSX.writeFile(workbook, `competition_performance_report_${timestamp}.xlsx`);
                setNotice({ type: "success", text: `Successfully exported ${rows.length} competition records to Excel!` });
            } else {
                setNotice({ type: "error", text: "No competition data available to export" });
            }
        } catch (error: any) {
            console.error('❌ Export competitions Excel error:', error);
            setNotice({ type: "error", text: "Failed to export competitions Excel. Please try again." });
        } finally {
            setShowExportMenu(false);
        }
    };

    const validateClubName = (name: string): string | null => {
        const trimmedName = name.trim();
        
        if (!trimmedName) {
            return "Club name is required";
        }
        
        if (trimmedName.length < 3) {
            return "Club name must be at least 3 characters long";
        }
        
        if (trimmedName.length > 100) {
            return "Club name must not exceed 100 characters";
        }
        
        // Allow only letters, numbers, spaces, hyphens, and apostrophes
        const validNamePattern = /^[a-zA-Z0-9\s\-']+$/;
        if (!validNamePattern.test(trimmedName)) {
            return "Club name can only contain letters, numbers, spaces, hyphens, and apostrophes";
        }
        
        return null;
    };

    const validateClubDescription = (description: string): string | null => {
        const trimmedDesc = description.trim();
        
        if (!trimmedDesc) {
            return "Club description is required";
        }
        
        if (trimmedDesc.length < 10) {
            return "Club description must be at least 10 characters long";
        }
        
        if (trimmedDesc.length > 500) {
            return "Club description must not exceed 500 characters";
        }
        
        return null;
    };

    const validateClubCapacity = (capacity: number, currentMemberCount?: number): string | null => {
        if (!capacity || isNaN(capacity)) {
            return "Capacity is required and must be a number";
        }
        
        if (!Number.isInteger(capacity)) {
            return "Capacity must be a whole number";
        }
        
        if (capacity < 1) {
            return "Capacity must be at least 1";
        }
        
        if (capacity > 200) {
            return "Capacity cannot exceed 200 members";
        }
        
        if (currentMemberCount !== undefined && capacity < currentMemberCount) {
            return `Capacity cannot be less than current member count (${currentMemberCount})`;
        }
        
        return null;
    };

    const validateMeetingDay = (day: string): string | null => {
        if (!day || !day.trim()) {
            return null; // Optional field
        }
        
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const normalizedDay = day.trim().toLowerCase();
        
        if (!validDays.includes(normalizedDay)) {
            return "Meeting day must be a valid day of the week (e.g., Monday, Tuesday)";
        }
        
        return null;
    };

    const validateMeetingTime = (time: string): string | null => {
        if (!time || !time.trim()) {
            return null; // Optional field
        }
        
        // Validate HH:MM format
        const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timePattern.test(time.trim())) {
            return "Meeting time must be in HH:MM format (e.g., 14:30)";
        }
        
        // Check if time is within school hours (7:00 AM - 6:00 PM)
        const [hours, minutes] = time.split(':').map(Number);
        const timeInMinutes = hours * 60 + minutes;
        const schoolStartTime = 7 * 60; // 7:00 AM
        const schoolEndTime = 18 * 60; // 6:00 PM
        
        if (timeInMinutes < schoolStartTime || timeInMinutes > schoolEndTime) {
            return "Meeting time should be within school hours (7:00 AM - 6:00 PM)";
        }
        
        return null;
    };

    const validateLocation = (location: string): string | null => {
        if (!location || !location.trim()) {
            return null; // Optional field
        }
        
        if (location.trim().length > 100) {
            return "Location must not exceed 100 characters";
        }
        
        return null;
    };

    const checkDuplicateClubName = (name: string, excludeClubId?: string): boolean => {
        const trimmedName = name.trim().toLowerCase();
        return clubs.some(club => 
            club.name.toLowerCase() === trimmedName && 
            club.club_id !== excludeClubId
        );
    };

    const handleAddClub = async () => {
        // Clear previous errors
        setClubFormErrors({});
        const errors: Record<string, string> = {};

        // Validate club name
        const nameError = validateClubName(newClubForm.name);
        if (nameError) {
            errors.name = nameError;
        }

        // Check for duplicate name
        if (!nameError && checkDuplicateClubName(newClubForm.name)) {
            errors.name = "A club with this name already exists in your school";
        }

        // Validate description
        const descError = validateClubDescription(newClubForm.description);
        if (descError) {
            errors.description = descError;
        }

        // Validate capacity
        const capacityError = validateClubCapacity(newClubForm.capacity);
        if (capacityError) {
            errors.capacity = capacityError;
        }

        // Validate meeting day
        const dayError = validateMeetingDay(newClubForm.meeting_day);
        if (dayError) {
            errors.meeting_day = dayError;
        }

        // Validate meeting time
        const timeError = validateMeetingTime(newClubForm.meeting_time);
        if (timeError) {
            errors.meeting_time = timeError;
        }

        // Validate location
        const locationError = validateLocation(newClubForm.location);
        if (locationError) {
            errors.location = locationError;
        }

        // If there are any errors, set them and return
        if (Object.keys(errors).length > 0) {
            setClubFormErrors(errors);
            return;
        }

        try {
            const createdClub = await clubsService.createClub({
                name: newClubForm.name.trim(),
                category: newClubForm.category,
                description: newClubForm.description.trim(),
                capacity: Number(newClubForm.capacity),
                meeting_day: newClubForm.meeting_day.trim() || undefined,
                meeting_time: newClubForm.meeting_time.trim() || undefined,
                location: newClubForm.location.trim() || undefined
            });

            setClubs([...clubs, createdClub]);
            setNotice({ type: "success", text: `${createdClub?.name || 'Club'} has been created successfully!` });
            setAddClubModal(false);
            setNewClubForm({ name: "", category: "arts", description: "", capacity: 30, meeting_day: "", meeting_time: "", location: "" });
            setClubFormErrors({});
        } catch (error: any) {
            console.error('Error creating club:', error);
            setClubFormErrors({ submit: "Failed to create club. Please try again." });
        }
    };

    const handleEditClub = (club: Club) => {
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
        if (!editClubModal) {
            setNotice({ type: "error", text: "No club selected for editing" });
            return;
        }

        // Clear previous errors
        setClubFormErrors({});
        const errors: Record<string, string> = {};

        // Validate club name
        const nameError = validateClubName(editClubForm.name);
        if (nameError) {
            errors.name = nameError;
        }

        // Check for duplicate name (excluding current club)
        if (!nameError && checkDuplicateClubName(editClubForm.name, editClubModal.club_id)) {
            errors.name = "A club with this name already exists in your school";
        }

        // Validate description
        const descError = validateClubDescription(editClubForm.description);
        if (descError) {
            errors.description = descError;
        }

        // Get current member count
        const currentMemberCount = editClubModal.members?.length || 0;

        // Validate capacity (with current member count check)
        const capacityError = validateClubCapacity(editClubForm.capacity, currentMemberCount);
        if (capacityError) {
            errors.capacity = capacityError;
        }

        // Validate meeting day
        const dayError = validateMeetingDay(editClubForm.meeting_day);
        if (dayError) {
            errors.meeting_day = dayError;
        }

        // Validate meeting time
        const timeError = validateMeetingTime(editClubForm.meeting_time);
        if (timeError) {
            errors.meeting_time = timeError;
        }

        // Validate location
        const locationError = validateLocation(editClubForm.location);
        if (locationError) {
            errors.location = locationError;
        }

        // If there are any errors, set them and return
        if (Object.keys(errors).length > 0) {
            setClubFormErrors(errors);
            return;
        }

        try {
            await clubsService.updateClub(editClubModal.club_id, {
                name: editClubForm.name.trim(),
                category: editClubForm.category,
                description: editClubForm.description.trim(),
                capacity: Number(editClubForm.capacity),
                meeting_day: editClubForm.meeting_day.trim() || undefined,
                meeting_time: editClubForm.meeting_time.trim() || undefined,
                location: editClubForm.location.trim() || undefined
            });

            const updatedClubs = clubs.map(c => 
                c.club_id === editClubModal.club_id 
                    ? { ...c, ...editClubForm, capacity: Number(editClubForm.capacity) }
                    : c
            );
            setClubs(updatedClubs);
            
            setNotice({ type: "success", text: `${editClubForm?.name || 'Club'} has been updated successfully!` });
            setEditClubModal(null);
            setEditClubForm({ name: "", category: "arts", description: "", capacity: 30, meeting_day: "", meeting_time: "", location: "" });
            setClubFormErrors({});
        } catch (error: any) {
            console.error('Error updating club:', error);
            setClubFormErrors({ submit: "Failed to update club. Please try again." });
        }
    };

    const handleDeleteClub = async (club: Club) => {
        if (!confirm(`Are you sure you want to delete "${club?.name || 'this club'}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await clubsService.deleteClub(club.club_id);
            
            const updatedClubs = clubs.filter(c => c.club_id !== club.club_id);
            setClubs(updatedClubs);
            
            setNotice({ type: "success", text: `${club?.name || 'Club'} has been deleted successfully!` });
        } catch (error: any) {
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

    const loadCompetitionRegistrations = async (compId: string) => {
        try {
            console.log('🔍 [Educator] Loading registrations for competition:', compId);
            const registrations = await competitionsService.getCompetitionRegistrations(compId);
            console.log('📋 [Educator] Loaded registrations:', registrations.length, registrations);
            setCompetitionRegistrations(registrations);
        } catch (error: any) {
            console.error('❌ [Educator] Error loading registrations:', error);
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

        if (!registerCompModal) {
            setNotice({ type: "error", text: "No competition selected" });
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
                    text: `${student?.name || 'Student'} registered for ${registerCompModal?.name || 'competition'}!`
                });
            }

            // Update competition status if changed
            if (registerCompModal && registrationForm.status && registrationForm.status !== registerCompModal?.status) {
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
            }

            // Reload registrations
            await loadCompetitionRegistrations(registerCompModal.comp_id);
            
            // Reset form
            setRegistrationForm({ studentEmail: "", teamMembers: "", notes: "", status: "upcoming" });
            setEditingRegistration(null);
        } catch (error: any) {
            console.error('Error registering for competition:', error);
            setNotice({ type: "error", text: error.message || "Failed to register. Please try again." });
        }
    };

    const handleEditRegistration = (registration: any) => {
        setEditingRegistration(registration);
        setRegistrationForm({
            studentEmail: registration.student_email,
            teamMembers: registration.team_members?.members?.join(', ') || '',
            notes: registration.notes || '',
            status: registration.status || 'upcoming'
        });
    };

    const handleDeleteRegistration = async (registrationId: string) => {
        if (!confirm('Are you sure you want to delete this registration?')) {
            return;
        }

        try {
            await competitionsService.deleteCompetitionRegistration(registrationId);
            setNotice({ type: "success", text: "Registration deleted successfully" });
            await loadCompetitionRegistrations(registerCompModal?.comp_id || '');
        } catch (error: any) {
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
            const errors: string[] = [];

            for (let i = 0; i < jsonData.length; i++) {
                const row = jsonData[i] as any;
                
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
                    let teamMembers: string[] = [];
                    if (row.team_members && typeof row.team_members === 'string') {
                        teamMembers = row.team_members.split(',').map((name: string) => name.trim()).filter((name: string) => name);
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
                    
                } catch (error: any) {
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
        
        // Auto-size columns
        worksheet['!cols'] = [
            { wch: 30 }, // student_email
            { wch: 40 }, // team_members  
            { wch: 50 }  // notes
        ];
        
        XLSX.writeFile(workbook, `${registerCompModal?.name || 'competition'}_registration_template.xlsx`);
        setNotice({ type: "success", text: "Template downloaded successfully!" });
    };
    const validateCompetitionName = (name: string): string | null => {
        const trimmedName = name.trim();
        
        if (!trimmedName) {
            return "Competition name is required";
        }
        
        if (trimmedName.length < 3) {
            return "Competition name must be at least 3 characters long";
        }
        
        if (trimmedName.length > 150) {
            return "Competition name must not exceed 150 characters";
        }
        
        return null;
    };

    const validateCompetitionDate = (date: string, isNewCompetition: boolean = true): string | null => {
        if (!date || !date.trim()) {
            return "Competition date is required";
        }
        
        const competitionDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (isNaN(competitionDate.getTime())) {
            return "Invalid date format";
        }
        
        // For new competitions, date cannot be in the past
        if (isNewCompetition && competitionDate < today) {
            return "Competition date cannot be in the past";
        }
        
        // Check if date is within reasonable future range (2 years)
        const twoYearsFromNow = new Date();
        twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
        
        if (competitionDate > twoYearsFromNow) {
            return "Competition date should be within the next 2 years";
        }
        
        return null;
    };

    const validateCompetitionLevel = (level: string): string | null => {
        if (!level || !level.trim()) {
            return "Competition level is required";
        }
        
        const validLevels = ['intraschool', 'interschool', 'district', 'state', 'national', 'international'];
        if (!validLevels.includes(level.toLowerCase())) {
            return "Invalid competition level selected";
        }
        
        return null;
    };

    const validateCompetitionCategory = (category: string): string | null => {
        if (!category || !category.trim()) {
            return null; // Optional field
        }
        
        const validCategories = ['arts', 'sports', 'robotics', 'science', 'literature'];
        if (!validCategories.includes(category.toLowerCase())) {
            return "Invalid competition category selected";
        }
        
        return null;
    };

    const validateCompetitionStatus = (status: string): string | null => {
        if (!status || !status.trim()) {
            return "Competition status is required";
        }
        
        const validStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled'];
        if (!validStatuses.includes(status.toLowerCase())) {
            return "Invalid competition status. Must be one of: upcoming, ongoing, completed, cancelled";
        }
        
        return null;
    };

    const validateCompetitionDescription = (description: string): string | null => {
        if (!description || !description.trim()) {
            return null; // Optional field
        }
        
        if (description.trim().length > 1000) {
            return "Competition description must not exceed 1000 characters";
        }
        
        return null;
    };

    const checkDuplicateCompetitionName = (name: string, date: string, excludeCompId?: string): boolean => {
        const trimmedName = name.trim().toLowerCase();
        const competitionDate = new Date(date);
        
        // Check for competitions with same name within 7 days of the date
        return competitions.some(comp => {
            if (comp.comp_id === excludeCompId) return false;
            
            const compDate = new Date(comp.competition_date || comp.date || '');
            const daysDifference = Math.abs((competitionDate.getTime() - compDate.getTime()) / (1000 * 60 * 60 * 24));
            
            return comp.name.toLowerCase() === trimmedName && daysDifference <= 7;
        });
    };

    const autoUpdateCompetitionStatus = (date: string, currentStatus: string): string => {
        const competitionDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Don't auto-update if manually set to cancelled
        if (currentStatus === 'cancelled') {
            return currentStatus;
        }
        
        // If competition date has passed, mark as completed
        if (competitionDate < today) {
            return 'completed';
        }
        
        // If competition is today, mark as ongoing
        if (competitionDate.getTime() === today.getTime()) {
            return 'ongoing';
        }
        
        // If competition is in the future, mark as upcoming
        return 'upcoming';
    };

    const handleAddCompetition = async () => {
        // Clear previous errors
        setCompFormErrors({});
        const errors: Record<string, string> = {};

        // Validate competition name
        const nameError = validateCompetitionName(newCompForm.name);
        if (nameError) {
            errors.name = nameError;
        }

        // Validate competition date
        const dateError = validateCompetitionDate(newCompForm.date, true);
        if (dateError) {
            errors.date = dateError;
        }

        // Check for duplicate name within date range
        if (!nameError && !dateError && checkDuplicateCompetitionName(newCompForm.name, newCompForm.date)) {
            errors.name = "A competition with this name already exists around the same date";
        }

        // Validate level
        const levelError = validateCompetitionLevel(newCompForm.level);
        if (levelError) {
            errors.level = levelError;
        }

        // Validate category (optional)
        const categoryError = validateCompetitionCategory(newCompForm.category);
        if (categoryError) {
            errors.category = categoryError;
        }

        // Validate status
        const statusError = validateCompetitionStatus(newCompForm.status);
        if (statusError) {
            errors.status = statusError;
        }

        // Validate description (optional)
        const descError = validateCompetitionDescription(newCompForm.description);
        if (descError) {
            errors.description = descError;
        }

        // If there are any errors, set them and return
        if (Object.keys(errors).length > 0) {
            setCompFormErrors(errors);
            return;
        }

        // Auto-update status based on date
        const autoStatus = autoUpdateCompetitionStatus(newCompForm.date, newCompForm.status);

        try {
            const createdCompetition = await competitionsService.createCompetition({
                name: newCompForm.name.trim(),
                level: newCompForm.level,
                date: newCompForm.date,
                description: newCompForm.description.trim() || undefined,
                category: newCompForm.category.trim() || undefined,
                status: autoStatus,
                participatingClubs: newCompForm.participatingClubs
            });

            setCompetitions([...competitions, createdCompetition]);

            setNotice({ type: "success", text: `${createdCompetition?.name || 'Competition'} added successfully!` });
            setAddCompModal(false);
            setNewCompForm({
                name: "",
                level: "district",
                date: "",
                description: "",
                category: "",
                status: "upcoming",
                results: [],
                participatingClubs: []
            });
            setCompFormErrors({});
        } catch (error: any) {
            console.error('Error creating competition:', error);
            setCompFormErrors({ submit: "Failed to create competition. Please try again." });
        }
    };

    const handleEditCompetition = (comp: Competition) => {
        setEditCompForm({
            name: comp.name,
            level: comp.level,
            date: comp.competition_date || comp.date || '',
            description: comp.description || "",
            category: comp.category || "",
            status: comp.status || "upcoming",
            results: [],
            participatingClubs: comp.participatingClubs || []
        });
        setEditCompModal(comp);
    };

    const handleUpdateCompetition = async () => {
        if (!editCompModal) {
            setNotice({ type: "error", text: "No competition selected for editing" });
            return;
        }

        // Clear previous errors
        setCompFormErrors({});
        const errors: Record<string, string> = {};

        // Validate competition name
        const nameError = validateCompetitionName(editCompForm.name);
        if (nameError) {
            errors.name = nameError;
        }

        // Validate competition date (allow past dates for editing existing competitions)
        const dateError = validateCompetitionDate(editCompForm.date, false);
        if (dateError) {
            errors.date = dateError;
        }

        // Check for duplicate name within date range (excluding current competition)
        if (!nameError && !dateError && checkDuplicateCompetitionName(editCompForm.name, editCompForm.date, editCompModal.comp_id)) {
            errors.name = "A competition with this name already exists around the same date";
        }

        // Validate level
        const levelError = validateCompetitionLevel(editCompForm.level);
        if (levelError) {
            errors.level = levelError;
        }

        // Validate category (optional)
        const categoryError = validateCompetitionCategory(editCompForm.category);
        if (categoryError) {
            errors.category = categoryError;
        }

        // Validate status
        const statusError = validateCompetitionStatus(editCompForm.status);
        if (statusError) {
            errors.status = statusError;
        }

        // Validate description (optional)
        const descError = validateCompetitionDescription(editCompForm.description);
        if (descError) {
            errors.description = descError;
        }

        // If there are any errors, set them and return
        if (Object.keys(errors).length > 0) {
            setCompFormErrors(errors);
            return;
        }

        // Auto-update status based on date (unless manually set to cancelled)
        const autoStatus = autoUpdateCompetitionStatus(editCompForm.date, editCompForm.status);

        try {
            await competitionsService.updateCompetition(editCompModal.comp_id, {
                name: editCompForm.name.trim(),
                level: editCompForm.level,
                date: editCompForm.date,
                description: editCompForm.description.trim() || undefined,
                category: editCompForm.category.trim() || undefined,
                status: autoStatus,
                participatingClubs: editCompForm.participatingClubs
            });

            const updatedCompetitions = competitions.map(c => 
                c.comp_id === editCompModal.comp_id 
                    ? { ...c, ...editCompForm, competition_date: editCompForm.date, status: autoStatus }
                    : c
            );
            setCompetitions(updatedCompetitions);
            
            setNotice({ type: "success", text: `${editCompForm?.name || 'Competition'} has been updated successfully!` });
            setEditCompModal(null);
            setEditCompForm({
                name: "",
                level: "district",
                date: "",
                description: "",
                category: "",
                status: "upcoming",
                results: [],
                participatingClubs: []
            });
            setCompFormErrors({});
        } catch (error: any) {
            console.error('Error updating competition:', error);
            setCompFormErrors({ submit: "Failed to update competition. Please try again." });
        }
    };

    const handleDeleteCompetition = async (comp: Competition) => {
        if (!confirm(`Are you sure you want to delete "${comp?.name || 'this competition'}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await competitionsService.deleteCompetition(comp.comp_id);
            
            const updatedCompetitions = competitions.filter(c => c.comp_id !== comp.comp_id);
            setCompetitions(updatedCompetitions);
            
            setNotice({ type: "success", text: `${comp?.name || 'Competition'} has been deleted successfully!` });
        } catch (error: any) {
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
                                    <span>{clubs.reduce((acc, club) => acc + (club.members?.length || 0), 0)} Total Members</span>
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
                                            {/* <button
                                                onClick={exportClubsPDF}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-2"
                                            >
                                                <FileDown size={14} className="text-red-600" />
                                                Export Clubs (PDF)
                                            </button> */}

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
                                            {/* <button
                                                onClick={exportCompetitionsPDF}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-2"
                                            >
                                                <FileDown size={14} className="text-red-600" />
                                                Export Competitions (PDF)
                                            </button> */}
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
                        {/* <button
                            onClick={() => activeTab === "clubs" ? setAddClubModal(true) : setAddCompModal(true)}
                            className={`group flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                                activeTab === "clubs"
                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                        >
                            <Plus size={16} className="transition-transform duration-300 group-hover:rotate-90" />
                            <span>Add {activeTab === "clubs" ? "Club" : "Competition"}</span>
                        </button> */}
                    </div>

                    {/* Tab Content Indicator */}
                    <div className={`h-1 transition-all duration-500 ${
                        activeTab === "clubs" ? "bg-blue-600" : "bg-blue-600"
                    }`} />
                </div>

                {/* Enhanced Search and Filter Bar - Only show for clubs tab */}
                {activeTab === "clubs" && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex items-center gap-4">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Search clubs by name..."
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Category Filter */}
                            <div className="min-w-[160px]">
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

                            {/* View Toggle */}
                            <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setClubViewMode("grid")}
                                    className={`p-2 rounded-md transition-colors ${
                                        clubViewMode === "grid"
                                            ? "bg-white text-blue-600 shadow-sm"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                    title="Grid View"
                                >
                                    <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                                        <div className="bg-current rounded-sm"></div>
                                        <div className="bg-current rounded-sm"></div>
                                        <div className="bg-current rounded-sm"></div>
                                        <div className="bg-current rounded-sm"></div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setClubViewMode("list")}
                                    className={`p-2 rounded-md transition-colors ${
                                        clubViewMode === "list"
                                            ? "bg-white text-blue-600 shadow-sm"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                    title="List View"
                                >
                                    <div className="w-4 h-4 flex flex-col gap-0.5">
                                        <div className="bg-current h-0.5 rounded-sm"></div>
                                        <div className="bg-current h-0.5 rounded-sm"></div>
                                        <div className="bg-current h-0.5 rounded-sm"></div>
                                        <div className="bg-current h-0.5 rounded-sm"></div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Enhanced Search and Filter Bar - Only show for competitions tab */}
                {activeTab === "competitions" && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex items-center gap-4">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    value={competitionSearchQuery}
                                    onChange={(e) => setCompetitionSearchQuery(e.target.value)}
                                    placeholder="Search competitions..."
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Filter Button */}
                            <div className="relative" ref={filterDropdownRef}>
                                <button
                                    onClick={() => setShowCompetitionFilters(!showCompetitionFilters)}
                                    className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
                                        showCompetitionFilters || competitionStatusFilter !== "all" || competitionCategoryFilter !== "all" || competitionLevelFilter !== "all"
                                            ? "bg-blue-50 border-blue-200 text-blue-700"
                                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    <Filter size={16} />
                                    <span>Filters</span>
                                    {(competitionStatusFilter !== "all" || competitionCategoryFilter !== "all" || competitionLevelFilter !== "all") && (
                                        <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                            {[competitionStatusFilter, competitionCategoryFilter, competitionLevelFilter].filter(f => f !== "all").length}
                                        </span>
                                    )}
                                    <ChevronDown size={16} className={`transition-transform ${showCompetitionFilters ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Filter Dropdown */}
                                {showCompetitionFilters && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                                        <div className="p-4 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-medium text-gray-900">Filter Competitions</h3>
                                                <button
                                                    onClick={() => setShowCompetitionFilters(false)}
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>

                                            {/* Status Filter */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                                <select
                                                    value={competitionStatusFilter}
                                                    onChange={(e) => setCompetitionStatusFilter(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                                                >
                                                    {competitionStatuses.map((status) => (
                                                        <option key={status.id} value={status.id}>
                                                            {status.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Category Filter */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                                <select
                                                    value={competitionCategoryFilter}
                                                    onChange={(e) => setCompetitionCategoryFilter(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                                                >
                                                    {competitionCategories.map((category) => (
                                                        <option key={category.id} value={category.id}>
                                                            {category.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Level Filter */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                                                <select
                                                    value={competitionLevelFilter}
                                                    onChange={(e) => setCompetitionLevelFilter(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                                                >
                                                    {competitionLevels.map((level) => (
                                                        <option key={level.id} value={level.id}>
                                                            {level.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Clear Filters */}
                                            {(competitionStatusFilter !== "all" || competitionCategoryFilter !== "all" || competitionLevelFilter !== "all") && (
                                                <div className="pt-2 border-t border-gray-100">
                                                    <button
                                                        onClick={() => {
                                                            setCompetitionStatusFilter("all");
                                                            setCompetitionCategoryFilter("all");
                                                            setCompetitionLevelFilter("all");
                                                        }}
                                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                                    >
                                                        <X size={16} />
                                                        Clear All Filters
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* View Toggle */}
                            <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setCompetitionViewMode("grid")}
                                    className={`p-2 rounded-md transition-colors ${
                                        competitionViewMode === "grid"
                                            ? "bg-white text-blue-600 shadow-sm"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                    title="Grid View"
                                >
                                    <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                                        <div className="bg-current rounded-sm"></div>
                                        <div className="bg-current rounded-sm"></div>
                                        <div className="bg-current rounded-sm"></div>
                                        <div className="bg-current rounded-sm"></div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setCompetitionViewMode("list")}
                                    className={`p-2 rounded-md transition-colors ${
                                        competitionViewMode === "list"
                                            ? "bg-white text-blue-600 shadow-sm"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                    title="List View"
                                >
                                    <div className="w-4 h-4 flex flex-col gap-0.5">
                                        <div className="bg-current h-0.5 rounded-sm"></div>
                                        <div className="bg-current h-0.5 rounded-sm"></div>
                                        <div className="bg-current h-0.5 rounded-sm"></div>
                                        <div className="bg-current h-0.5 rounded-sm"></div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Active Filters Display */}
                        {(competitionStatusFilter !== "all" || competitionCategoryFilter !== "all" || competitionLevelFilter !== "all" || competitionSearchQuery) && (
                            <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-gray-500">Active filters:</span>
                                    {competitionSearchQuery && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                            Search: "{competitionSearchQuery}"
                                            <button onClick={() => setCompetitionSearchQuery("")} className="hover:bg-blue-200 rounded-full p-0.5">
                                                <X size={10} />
                                            </button>
                                        </span>
                                    )}
                                    {competitionStatusFilter !== "all" && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                            {competitionStatuses.find(s => s.id === competitionStatusFilter)?.label}
                                            <button onClick={() => setCompetitionStatusFilter("all")} className="hover:bg-green-200 rounded-full p-0.5">
                                                <X size={10} />
                                            </button>
                                        </span>
                                    )}
                                    {competitionCategoryFilter !== "all" && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                                            {competitionCategories.find(c => c.id === competitionCategoryFilter)?.label}
                                            <button onClick={() => setCompetitionCategoryFilter("all")} className="hover:bg-purple-200 rounded-full p-0.5">
                                                <X size={10} />
                                            </button>
                                        </span>
                                    )}
                                    {competitionLevelFilter !== "all" && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                                            {competitionLevels.find(l => l.id === competitionLevelFilter)?.label}
                                            <button onClick={() => setCompetitionLevelFilter("all")} className="hover:bg-orange-200 rounded-full p-0.5">
                                                <X size={10} />
                                            </button>
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {filteredCompetitions.length} of {competitions.length} competitions
                                </div>
                            </div>
                        )}
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
                                    <h2 className="text-2xl font-bold text-gray-900">Clubs</h2>
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
                                    {/* Grid View */}
                                    {clubViewMode === "grid" && (
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
                                    )}

                                    {/* List View */}
                                    {clubViewMode === "list" && (
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-gray-50 border-b border-gray-200">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Club</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meeting</th>
                                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {paginatedClubs.map((club) => (
                                                            <tr key={club.club_id} className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="bg-blue-100 rounded-lg p-2">
                                                                            <Users size={16} className="text-blue-600" />
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-semibold text-gray-900">{club.name}</div>
                                                                            {club.description && (
                                                                                <div className="text-sm text-gray-500 line-clamp-1">{club.description}</div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                                                        {club.category}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="text-sm text-gray-900">{club.members?.length || 0}</span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm text-gray-900">{club.capacity}</span>
                                                                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                                                            <div 
                                                                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" 
                                                                                style={{ width: `${Math.min(((club.members?.length || 0) / club.capacity) * 100, 100)}%` }}
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="text-base text-gray-900">
                                                                        {club.meeting_day && club.meeting_time ? (
                                                                            <div>
                                                                                <div>{club.meeting_day}</div>
                                                                                <div className="text-xs text-gray-500">{club.meeting_time}</div>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-gray-400">TBD</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <button
                                                                            onClick={() => openDetails(club)}
                                                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                                            title="View Details"
                                                                        >
                                                                            <Eye size={16} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => enrollStudent(club)}
                                                                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                                                                            title="Manage Students"
                                                                        >
                                                                            <UserPlus size={16} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleEditClub(club)}
                                                                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                                                                            title="Edit Club"
                                                                        >
                                                                            <Edit size={16} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteClub(club)}
                                                                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                                                                            title="Delete Club"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalClubPages}
                                        onPageChange={setCurrentPage}
                                        itemsPerPage={ITEMS_PER_PAGE}
                                        totalItems={filteredClubs.length}
                                        itemType="clubs"
                                    />
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
                                    {competitionSearchQuery || competitionStatusFilter !== "all" || competitionCategoryFilter !== "all" || competitionLevelFilter !== "all" ? (
                                        <>
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No competitions found</h3>
                                            <p className="text-gray-500 mb-4">No competitions match your current filters</p>
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setCompetitionSearchQuery("");
                                                        setCompetitionStatusFilter("all");
                                                        setCompetitionCategoryFilter("all");
                                                        setCompetitionLevelFilter("all");
                                                    }}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                                >
                                                    <X size={16} />
                                                    Clear All Filters
                                                </button>
                                                <button
                                                    onClick={() => setAddCompModal(true)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    <Plus size={16} />
                                                    Add Competition
                                                </button>
                                            </div>
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
                                <>
                                    {/* Grid View */}
                                    {competitionViewMode === "grid" && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {paginatedCompetitions.map((comp) => {
                                                const CompetitionCard = () => {
                                                    const [showCompMenu, setShowCompMenu] = React.useState(false);
                                                    const [showFullDescription, setShowFullDescription] = React.useState(false);
                                                    const compMenuRef = React.useRef<HTMLDivElement>(null);

                                                    // Check if description is long (more than 100 characters)
                                                    const isLongDescription = comp.description && comp.description.length > 100;
                                                    const displayDescription = showFullDescription || !isLongDescription 
                                                        ? comp.description 
                                                        : comp.description?.substring(0, 100) + '...';

                                                    // Close menu when clicking outside
                                                    React.useEffect(() => {
                                                        const handleClickOutside = (event: MouseEvent) => {
                                                            if (compMenuRef.current && !compMenuRef.current.contains(event.target as Node)) {
                                                                setShowCompMenu(false);
                                                            }
                                                        };

                                                        if (showCompMenu) {
                                                            document.addEventListener('mousedown', handleClickOutside);
                                                            return () => document.removeEventListener('mousedown', handleClickOutside);
                                                        }
                                                    }, [showCompMenu]);

                                                    return (
                                                        <div className="bg-white rounded-xl hover:shadow-lg transition-all duration-300 overflow-hidden shadow-sm">
                                                            {/* Competition Header */}
                                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex items-center gap-3 flex-1">
                                                                        <div className="bg-white rounded-lg p-2 shadow-sm">
                                                                            <Trophy size={20} className="text-blue-600" />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <h3 className="font-semibold text-gray-900">{comp.name}</h3>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Three-dot menu */}
                                                                    <div className="relative" ref={compMenuRef}>
                                                                        <button
                                                                            onClick={() => setShowCompMenu(!showCompMenu)}
                                                                            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                                                                            title="More actions"
                                                                        >
                                                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-gray-600">
                                                                                <circle cx="10" cy="4" r="1.5" />
                                                                                <circle cx="10" cy="10" r="1.5" />
                                                                                <circle cx="10" cy="16" r="1.5" />
                                                                            </svg>
                                                                        </button>

                                                                        {/* Dropdown menu */}
                                                                        {showCompMenu && (
                                                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setViewComp(comp);
                                                                                        setShowCompMenu(false);
                                                                                    }}
                                                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                                >
                                                                                    <Eye size={14} />
                                                                                    View Details
                                                                                </button>
                                                                                
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setRegisterCompModal(comp);
                                                                                        setShowCompMenu(false);
                                                                                    }}
                                                                                    className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                                                                >
                                                                                    <UserPlus size={14} />
                                                                                    Register Students
                                                                                </button>
                                                                                
                                                                                <div className="border-t border-gray-100 my-1"></div>
                                                                                
                                                                                <button
                                                                                    onClick={() => {
                                                                                        handleEditCompetition(comp);
                                                                                        setShowCompMenu(false);
                                                                                    }}
                                                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                                >
                                                                                    <Edit size={14} />
                                                                                    Edit Competition
                                                                                </button>
                                                                                
                                                                                <button
                                                                                    onClick={() => {
                                                                                        handleDeleteCompetition(comp);
                                                                                        setShowCompMenu(false);
                                                                                    }}
                                                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                                                >
                                                                                    <Trash2 size={14} />
                                                                                    Delete Competition
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Competition Content */}
                                                            <div className="p-4">
                                                                {/* 2-Column Grid Layout */}
                                                                <div className="grid grid-cols-2 gap-3 mb-4">
                                                                    {/* Status */}
                                                                    <div>
                                                                        <div className="text-xs text-gray-500 mb-1">Status</div>
                                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                                            comp.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                                                                            comp.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                                                                            comp.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                                                            'bg-red-100 text-red-700'
                                                                        }`}>
                                                                            {comp.status === 'upcoming' ? 'Upcoming' :
                                                                             comp.status === 'ongoing' ? 'Ongoing' :
                                                                             comp.status === 'completed' ? 'Completed' :
                                                                             'Cancelled'}
                                                                        </span>
                                                                    </div>

                                                                    {/* Category */}
                                                                    <div>
                                                                        <div className="text-xs text-gray-500 mb-1">Category</div>
                                                                        {comp.category ? (
                                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 capitalize">
                                                                                {comp.category}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-xs text-gray-400">Not specified</span>
                                                                        )}
                                                                    </div>

                                                                    {/* Level */}
                                                                    <div>
                                                                        <div className="text-xs text-gray-500 mb-1">Level</div>
                                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 capitalize">
                                                                            {comp.level}
                                                                        </span>
                                                                    </div>

                                                                    {/* Date */}
                                                                    <div>
                                                                        <div className="text-xs text-gray-500 mb-1">Date</div>
                                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                                            {formatDate(comp.competition_date || comp.date)}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Description */}
                                                                {comp.description && (
                                                                    <div className="mb-3">
                                                                        <p className="text-sm text-gray-600 leading-relaxed">
                                                                            {displayDescription}
                                                                        </p>
                                                                        {isLongDescription && (
                                                                            <button
                                                                                onClick={() => setShowFullDescription(!showFullDescription)}
                                                                                className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1"
                                                                            >
                                                                                {showFullDescription ? 'View less' : 'View more'}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Participating Clubs */}
                                                                <div className="pt-3 border-t border-gray-100">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-xs text-gray-500">Participating Clubs</span>
                                                                        <span className="text-sm font-semibold text-gray-900">{comp.participatingClubs?.length ?? 0}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                };

                                                return <CompetitionCard key={comp.comp_id} />;
                                            })}
                                        </div>
                                    )}

                                    {/* List View */}
                                    {competitionViewMode === "list" && (
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-gray-50 border-b border-gray-200">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Competition</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clubs</th>
                                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {paginatedCompetitions.map((comp) => (
                                                            <tr key={comp.comp_id} className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="bg-blue-100 rounded-lg p-2">
                                                                            <Trophy size={16} className="text-blue-600" />
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-medium text-gray-900">{comp.name}</div>
                                                                            {comp.description && (
                                                                                <div className="text-sm text-gray-500 line-clamp-1">{comp.description}</div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="text-sm text-gray-900 capitalize">{comp.level}</span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="text-sm text-gray-900">{formatDate(comp.competition_date || comp.date)}</span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                        comp.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                                                                        comp.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                                                                        comp.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                                                        'bg-red-100 text-red-800'
                                                                    }`}>
                                                                        {comp.status === 'upcoming' ? 'Upcoming' :
                                                                         comp.status === 'ongoing' ? 'Ongoing' :
                                                                         comp.status === 'completed' ? 'Completed' :
                                                                         'Cancelled'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    {comp.category ? (
                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                                                                            {comp.category}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-sm text-gray-400">-</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="text-sm text-gray-900">{comp.participatingClubs?.length ?? 0}</span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <button
                                                                            onClick={() => setViewComp(comp)}
                                                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                                            title="View Details"
                                                                        >
                                                                            <Eye size={16} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setRegisterCompModal(comp)}
                                                                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                                                                            title="Register Students"
                                                                        >
                                                                            <UserPlus size={16} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleEditCompetition(comp)}
                                                                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                                                                            title="Edit Competition"
                                                                        >
                                                                            <Edit size={16} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteCompetition(comp)}
                                                                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                                                                            title="Delete Competition"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <Pagination
                                        currentPage={currentCompetitionPage}
                                        totalPages={totalCompetitionPages}
                                        onPageChange={setCurrentCompetitionPage}
                                        itemsPerPage={ITEMS_PER_PAGE}
                                        totalItems={filteredCompetitions.length}
                                        itemType="competitions"
                                    />
                                </>
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
                                <div className="text-xs text-slate-500 mb-2">Members ({selectedClub.members?.length || 0}/{selectedClub.capacity})</div>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {(selectedClub.members?.length || 0) > 0 ? (
                                        selectedClub.members?.map((m, index) => (
                                            <div key={typeof m === 'string' ? m : `member-${index}`} className="px-2 py-1 bg-gray-100 rounded-full text-xs">{m}</div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-slate-500">No members yet</div>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                <div className="text-sm font-medium text-blue-900 mb-2">Meeting Details</div>
                                <div className="text-xs text-blue-700 space-y-1">
                                    <div>{selectedClub.meeting_day || 'TBD'}</div>
                                    <div>{selectedClub.meeting_time || 'TBD'}</div>
                                    <div>{selectedClub.location || 'TBD'}</div>
                                    {/* <div>Mentor: {selectedClub.mentor_name || 'TBD'}</div> */}
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
                                    disabled={(selectedClub.members?.length || 0) === 0}
                                >
                                    Mark Attendance
                                </button>

                                <button onClick={() => setDetailsOpen(false)} className="px-3 py-2 border rounded-md text-sm">Close</button>
                            </div>
                        </div>
                    ) : null}
                </Modal>

                <Modal open={addClubModal} onClose={() => { setAddClubModal(false); setClubFormErrors({}); }} title="Add New Club">
                    <div className="space-y-4">
                        {clubFormErrors.submit && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {clubFormErrors.submit}
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Club Name *</label>
                            <input
                                type="text"
                                value={newClubForm.name}
                                onChange={(e) => setNewClubForm({ ...newClubForm, name: e.target.value })}
                                placeholder="Enter club name"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                    clubFormErrors.name 
                                        ? 'border-red-300 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            />
                            {clubFormErrors.name && (
                                <p className="mt-1 text-sm text-red-600">{clubFormErrors.name}</p>
                            )}
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
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                    clubFormErrors.description 
                                        ? 'border-red-300 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            />
                            {clubFormErrors.description && (
                                <p className="mt-1 text-sm text-red-600">{clubFormErrors.description}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Capacity *</label>
                            <input
                                type="number"
                                value={newClubForm.capacity}
                                onChange={(e) => setNewClubForm({ ...newClubForm, capacity: Number(e.target.value) })}
                                min="1"
                                placeholder="Maximum members"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                    clubFormErrors.capacity 
                                        ? 'border-red-300 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            />
                            {clubFormErrors.capacity && (
                                <p className="mt-1 text-sm text-red-600">{clubFormErrors.capacity}</p>
                            )}
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <div className="text-sm font-medium text-blue-900 mb-3">Meeting Details</div>
                            
                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1">📅 Meeting Day</label>
                                <select
                                    value={newClubForm.meeting_day}
                                    onChange={(e) => setNewClubForm({ ...newClubForm, meeting_day: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                        clubFormErrors.meeting_day 
                                            ? 'border-red-300 focus:ring-red-500' 
                                            : 'border-gray-300 focus:ring-blue-500'
                                    }`}
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
                                {clubFormErrors.meeting_day && (
                                    <p className="mt-1 text-sm text-red-600">{clubFormErrors.meeting_day}</p>
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1">🕐 Meeting Time</label>
                                <input
                                    type="time"
                                    value={newClubForm.meeting_time}
                                    onChange={(e) => setNewClubForm({ ...newClubForm, meeting_time: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                        clubFormErrors.meeting_time 
                                            ? 'border-red-300 focus:ring-red-500' 
                                            : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                />
                                {clubFormErrors.meeting_time && (
                                    <p className="mt-1 text-sm text-red-600">{clubFormErrors.meeting_time}</p>
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1">📍 Location</label>
                                <input
                                    type="text"
                                    value={newClubForm.location}
                                    onChange={(e) => setNewClubForm({ ...newClubForm, location: e.target.value })}
                                    placeholder="e.g., Room 101, Auditorium"
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                        clubFormErrors.location 
                                            ? 'border-red-300 focus:ring-red-500' 
                                            : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                />
                                {clubFormErrors.location && (
                                    <p className="mt-1 text-sm text-red-600">{clubFormErrors.location}</p>
                                )}
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
                                onClick={() => { setAddClubModal(false); setClubFormErrors({}); }}
                                className="px-4 py-2 border rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Edit Club Modal */}
                <Modal open={!!editClubModal} onClose={() => { setEditClubModal(null); setClubFormErrors({}); }} title="Edit Club">
                    <div className="space-y-4">
                        {clubFormErrors.submit && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {clubFormErrors.submit}
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Club Name *</label>
                            <input
                                type="text"
                                value={editClubForm.name}
                                onChange={(e) => setEditClubForm({ ...editClubForm, name: e.target.value })}
                                placeholder="Enter club name"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                    clubFormErrors.name 
                                        ? 'border-red-300 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            />
                            {clubFormErrors.name && (
                                <p className="mt-1 text-sm text-red-600">{clubFormErrors.name}</p>
                            )}
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
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                    clubFormErrors.description 
                                        ? 'border-red-300 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            />
                            {clubFormErrors.description && (
                                <p className="mt-1 text-sm text-red-600">{clubFormErrors.description}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Capacity *</label>
                            <input
                                type="number"
                                value={editClubForm.capacity}
                                onChange={(e) => setEditClubForm({ ...editClubForm, capacity: Number(e.target.value) })}
                                min="1"
                                placeholder="Maximum members"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                    clubFormErrors.capacity 
                                        ? 'border-red-300 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            />
                            {clubFormErrors.capacity && (
                                <p className="mt-1 text-sm text-red-600">{clubFormErrors.capacity}</p>
                            )}
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <div className="text-sm font-medium text-blue-900 mb-3">Meeting Details</div>
                            
                             <div className="mb-3">
                                <label className="block text-sm font-medium mb-1">📅 Meeting Day</label>
                                <select
                                    value={editClubForm.meeting_day}
                                    onChange={(e) => setEditClubForm({ ...editClubForm, meeting_day: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                        clubFormErrors.meeting_day 
                                            ? 'border-red-300 focus:ring-red-500' 
                                            : 'border-gray-300 focus:ring-blue-500'
                                    }`}
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
                                {clubFormErrors.meeting_day && (
                                    <p className="mt-1 text-sm text-red-600">{clubFormErrors.meeting_day}</p>
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1">🕐 Meeting Time</label>
                                <input
                                    type="time"
                                    value={editClubForm.meeting_time}
                                    onChange={(e) => setEditClubForm({ ...editClubForm, meeting_time: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                        clubFormErrors.meeting_time 
                                            ? 'border-red-300 focus:ring-red-500' 
                                            : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                />
                                {clubFormErrors.meeting_time && (
                                    <p className="mt-1 text-sm text-red-600">{clubFormErrors.meeting_time}</p>
                                )}
                            </div>
                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1">📍 Location</label>
                                <input
                                    type="text"
                                    value={editClubForm.location}
                                    onChange={(e) => setEditClubForm({ ...editClubForm, location: e.target.value })}
                                    placeholder="e.g., Room 101, Auditorium"
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                        clubFormErrors.location 
                                            ? 'border-red-300 focus:ring-red-500' 
                                            : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                />
                                {clubFormErrors.location && (
                                    <p className="mt-1 text-sm text-red-600">{clubFormErrors.location}</p>
                                )}
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
                                onClick={() => { setEditClubModal(null); setClubFormErrors({}); }}
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
                                    {registerCompModal?.status === 'upcoming' ? 'Upcoming' :
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
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
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
                                                onChange={(e) => setBulkUploadFile(e.target.files?.[0] || null)}
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
                    onClose={() => { setEditCompModal(null); setCompFormErrors({}); }}
                    title="Edit Competition"
                >
                    <div className="space-y-3">
                        {compFormErrors.submit && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {compFormErrors.submit}
                            </div>
                        )}
                        
                        <div>
                            <label className="text-sm font-medium">Competition Name *</label>
                            <input
                                value={editCompForm.name}
                                onChange={(e) => setEditCompForm({ ...editCompForm, name: e.target.value })}
                                className={`w-full px-3 py-2 rounded-md border mt-1 ${
                                    compFormErrors.name 
                                        ? 'border-red-300 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                                placeholder="Enter Competition Name"
                            />
                            {compFormErrors.name && (
                                <p className="mt-1 text-sm text-red-600">{compFormErrors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                                value={editCompForm.description}
                                onChange={(e) => setEditCompForm({ ...editCompForm, description: e.target.value })}
                                className={`w-full px-3 py-2 rounded-md border mt-1 ${
                                    compFormErrors.description 
                                        ? 'border-red-300 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                                placeholder="Enter competition description"
                                rows={2}
                            />
                            {compFormErrors.description && (
                                <p className="mt-1 text-sm text-red-600">{compFormErrors.description}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium">Category</label>
                            <input
                                value={editCompForm.category}
                                onChange={(e) => setEditCompForm({ ...editCompForm, category: e.target.value })}
                                className={`w-full px-3 py-2 rounded-md border mt-1 ${
                                    compFormErrors.category 
                                        ? 'border-red-300 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                                placeholder="e.g., Science, Sports, Arts"
                            />
                            {compFormErrors.category && (
                                <p className="mt-1 text-sm text-red-600">{compFormErrors.category}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium">Level *</label>
                            <select
                                value={editCompForm.level}
                                onChange={(e) => setEditCompForm({ ...editCompForm, level: e.target.value })}
                                className={`w-full px-3 py-2 rounded-md border mt-1 ${
                                    compFormErrors.level 
                                        ? 'border-red-300 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            >
                                <option value="intraschool">Intra-School</option>
                                <option value="interschool">Inter-School</option>
                                <option value="district">District</option>
                                <option value="state">State</option>
                                <option value="national">National</option>
                                <option value="international">International</option>
                            </select>
                            {compFormErrors.level && (
                                <p className="mt-1 text-sm text-red-600">{compFormErrors.level}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium">Date *</label>
                            <input
                                type="date"
                                value={editCompForm.date}
                                onChange={(e) => setEditCompForm({ ...editCompForm, date: e.target.value })}
                                className={`w-full px-3 py-2 rounded-md border mt-1 ${
                                    compFormErrors.date 
                                        ? 'border-red-300 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            />
                            {compFormErrors.date && (
                                <p className="mt-1 text-sm text-red-600">{compFormErrors.date}</p>
                            )}
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
                                onClick={() => { setEditCompModal(null); setCompFormErrors({}); }}
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
                            <h2 className="text-xl font-semibold">{viewComp.name}</h2>

                            <p className="text-sm text-slate-600">
                                Category: <span className="capitalize">{viewComp.category}</span>
                            </p>

                            <p className="text-sm text-slate-700">{viewComp.description}</p>

                            <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                                <p>Reward: {viewComp.reward}</p>
                                <p>Skill Level: {viewComp.skill_level}</p>
                                <p>Team Size: {viewComp.team_size}</p>
                                <p>Status: {viewComp.status}</p>
                            </div>

                            <button
                                onClick={() => {
                                    const comp = competitions.find(c => c.comp_id === viewComp?.comp_id);
                                    if (comp) setRegisterCompModal(comp);
                                    setViewComp(null);
                                }}
                                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Register Now
                            </button>
                        </div>
                    )}
                </Modal>
                <Modal
                    open={addCompModal}
                    onClose={() => { setAddCompModal(false); setCompFormErrors({}); }}
                    title="Add New Competition"
                >
                    <div className="space-y-3">
                        {compFormErrors.submit && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {compFormErrors.submit}
                            </div>
                        )}
                        
                        <div className="bg-green-50 p-3 rounded-lg mb-4 text-sm">
                            <div className="flex items-center gap-2 text-green-900">
                                <span className="font-semibold">ℹ️ Note:</span>
                                <span>This competition will be created for your school only.</span>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Competition Name *</label>
                            <input
                                value={newCompForm.name}
                                onChange={(e) => setNewCompForm({ ...newCompForm, name: e.target.value })}
                                className={`w-full px-3 py-2 rounded-md border mt-1 ${
                                    compFormErrors.name 
                                        ? 'border-red-300 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                                placeholder="Enter Competition Name"
                            />
                            {compFormErrors.name && (
                                <p className="mt-1 text-sm text-red-600">{compFormErrors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                                value={newCompForm.description}
                                onChange={(e) => setNewCompForm({ ...newCompForm, description: e.target.value })}
                                className={`w-full px-3 py-2 rounded-md border mt-1 ${
                                    compFormErrors.description 
                                        ? 'border-red-300 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                                placeholder="Enter competition description"
                                rows={2}
                            />
                            {compFormErrors.description && (
                                <p className="mt-1 text-sm text-red-600">{compFormErrors.description}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium">Category</label>
                            <input
                                value={newCompForm.category}
                                onChange={(e) => setNewCompForm({ ...newCompForm, category: e.target.value })}
                                className={`w-full px-3 py-2 rounded-md border mt-1 ${
                                    compFormErrors.category 
                                        ? 'border-red-300 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                                placeholder="e.g., Science, Sports, Arts"
                            />
                            {compFormErrors.category && (
                                <p className="mt-1 text-sm text-red-600">{compFormErrors.category}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium">Level *</label>
                            <select
                                value={newCompForm.level}
                                onChange={(e) => setNewCompForm({ ...newCompForm, level: e.target.value })}
                                className={`w-full px-3 py-2 rounded-md border mt-1 ${
                                    compFormErrors.level 
                                        ? 'border-red-300 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            >
                                <option value="intraschool">Intra-School</option>
                                <option value="interschool">Inter-School</option>
                                <option value="district">District</option>
                                <option value="state">State</option>
                                <option value="national">National</option>
                                <option value="international">International</option>
                            </select>
                            {compFormErrors.level && (
                                <p className="mt-1 text-sm text-red-600">{compFormErrors.level}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium">Date *</label>
                            <input
                                type="date"
                                value={newCompForm.date}
                                onChange={(e) => setNewCompForm({ ...newCompForm, date: e.target.value })}
                                className={`w-full px-3 py-2 rounded-md border mt-1 ${
                                    compFormErrors.date 
                                        ? 'border-red-300 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            />
                            {compFormErrors.date && (
                                <p className="mt-1 text-sm text-red-600">{compFormErrors.date}</p>
                            )}
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
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium"
                            >
                                Create Competition
                            </button>
                            <button
                                onClick={() => { setAddCompModal(false); setCompFormErrors({}); }}
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
                                            {attendanceModal.club?.members?.length || 0}
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
                                                const records: Record<string, string> = {};
                                                attendanceModal.club?.members?.forEach(memberEmail => records[memberEmail] = 'present');
                                                setAttendanceRecords(records);
                                            }}
                                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                        >
                                            All Present
                                        </button>
                                        <button
                                            onClick={() => {
                                                const records: Record<string, string> = {};
                                                attendanceModal.club?.members?.forEach(memberEmail => records[memberEmail] = 'absent');
                                                setAttendanceRecords(records);
                                            }}
                                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                        >
                                            All Absent
                                        </button>
                                    </div>
                                </div>

                                <div className="max-h-80 overflow-y-auto space-y-2 border rounded-lg p-3 bg-gray-50">
                                    {(attendanceModal.club?.members?.length || 0) > 0 ? (
                                        attendanceModal.club?.members?.map((memberEmail, index) => {
                                            const student = allStudents.find(s => s.email === memberEmail);
                                            const studentName = student?.name || memberEmail;
                                            const studentGrade = student?.grade || 'N/A';
                                            
                                            return (
                                                <div
                                                    key={typeof memberEmail === 'string' ? memberEmail : `member-${index}`}
                                                    className="flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-sm"
                                                >
                                                    <div className="flex-1">
                                                        <div className="font-medium text-sm">{studentName}</div>
                                                        <div className="text-xs text-slate-500">{studentGrade}</div>
                                                    </div>

                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => handleAttendanceStatusChange(memberEmail, 'present')}
                                                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                                                attendanceRecords[memberEmail] === 'present'
                                                                    ? 'bg-green-600 text-white'
                                                                    : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                                                            }`}
                                                        >
                                                            Present
                                                        </button>
                                                        <button
                                                            onClick={() => handleAttendanceStatusChange(memberEmail, 'late')}
                                                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                                                attendanceRecords[memberEmail] === 'late'
                                                                    ? 'bg-yellow-600 text-white'
                                                                    : 'bg-gray-100 text-gray-600 hover:bg-yellow-100'
                                                            }`}
                                                        >
                                                            Late
                                                        </button>
                                                        <button
                                                            onClick={() => handleAttendanceStatusChange(memberEmail, 'absent')}
                                                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                                                attendanceRecords[memberEmail] === 'absent'
                                                                    ? 'bg-red-600 text-white'
                                                                    : 'bg-gray-100 text-gray-600 hover:bg-red-100'
                                                            }`}
                                                        >
                                                            Absent
                                                        </button>
                                                        <button
                                                            onClick={() => handleAttendanceStatusChange(memberEmail, 'excused')}
                                                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                                                attendanceRecords[memberEmail] === 'excused'
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
                Current Members: {studentDrawer.club?.members?.length || 0} / {studentDrawer.club?.capacity || 0}
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
                            const isEnrolled = studentDrawer.club?.members?.includes(student.email) || false;
                            const isFull = (studentDrawer.club?.members?.length || 0) >= (studentDrawer.club?.capacity || 0);

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
                                            onClick={() => studentDrawer.club && handleStudentLeave(student.id, studentDrawer.club)}
                                            className="flex items-center gap-1 px-3 py-1 text-sm bg-red-50 text-red-600 rounded-md border border-red-100 hover:bg-red-100"
                                        >
                                            <X size={14} />
                                            Remove
                                        </button>
                                    ) : (
                                        <button
                                            disabled={isFull}
                                            onClick={() => studentDrawer.club && handleStudentEnroll(student.id, studentDrawer.club)}
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