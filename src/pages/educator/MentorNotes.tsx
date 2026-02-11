import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Edit3,
    Eye,
    MessageCircle,
    MoreVertical,
    Trash2,
    User,
    X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FeatureGate } from "../../components/Subscription/FeatureGate";
import { useEducatorSchool } from "../../hooks/useEducatorSchool";
import { supabase } from "../../lib/supabaseClient";
import {
    saveMentorNote,
} from "../../services/educator/mentorNotes";

// Add animation styles
const modalAnimationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes scaleIn {
    from { 
      opacity: 0;
      transform: scale(0.9);
    }
    to { 
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }
  
  .animate-scaleIn {
    animation: scaleIn 0.3s ease-out;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = modalAnimationStyles;
  document.head.appendChild(styleSheet);
}

interface Student {
  id: string;
  name: string;
  user_id: string;
  grade?: string;
  section?: string;
  school_class_id?: string;
}

interface MentorNote {
  id: string;
  student_id: string;
  feedback: string;
  action_points: string;
  quick_notes: string[];
  note_date: string;
  students: { name: string } | { name: string }[];
}

const MentorNotesContent = () => {
  // Get educator's school information with class assignments
  const { school: educatorSchool, college: educatorCollege, educatorType, educatorRole, assignedClassIds, loading: schoolLoading } = useEducatorSchool();

  // main data
  const [students, setStudents] = useState<Student[]>([]);
  const [notes, setNotes] = useState<MentorNote[]>([]);

  // form state for adding new note
  const [loading, setLoading] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedQuickNotes, setSelectedQuickNotes] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [actionPoints, setActionPoints] = useState("");
  const [otherNote, setOtherNote] = useState("");
  const [isOtherSelected, setIsOtherSelected] = useState(false);

  const quickNoteOptions = [
    "Excellent Progress",
    "Needs Improvement",
    "Strong Communication Skills",
    "Great Technical Knowledge",
    "Consistent Performance",
    "Slow but Improving",
    "Good Leadership Quality",
    "Teamwork is Improving",
    "Needs Extra Practice",
    "Outstanding Creativity",
    "Others",
  ];

  // chip colors
  const chipColors = [
    "bg-blue-100 text-blue-700 border-blue-300",
    "bg-green-100 text-green-700 border-green-300",
    "bg-purple-100 text-purple-700 border-purple-300",
    "bg-pink-100 text-pink-700 border-pink-300",
    "bg-yellow-100 text-yellow-700 border-yellow-300",
    "bg-indigo-100 text-indigo-700 border-indigo-300",
  ];

  // Student dropdown search
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Quick-notes dropdown
  const [quickDropdownOpen, setQuickDropdownOpen] = useState(false);
  const quickDropdownRef = useRef<HTMLDivElement>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 6; // cards per page

  // View/Edit modal state
  const [viewingNote, setViewingNote] = useState<MentorNote | null>(null);
  const [editingNote, setEditingNote] = useState<MentorNote | null>(null);
  const [editQuickNotes, setEditQuickNotes] = useState<string[]>([]);
  const [editFeedback, setEditFeedback] = useState("");
  const [editActionPoints, setEditActionPoints] = useState("");
  const [editOther, setEditOther] = useState("");

  // Modal states for notifications and confirmations
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Three-dot menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (quickDropdownRef.current && !quickDropdownRef.current.contains(event.target as Node)) {
        setQuickDropdownOpen(false);
      }
      // Close three-dot menu when clicking outside
      if (openMenuId) {
        const menuRef = menuRefs.current[openMenuId];
        if (menuRef && !menuRef.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  // filtered students for dropdown search
  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const displayStudents =
    searchTerm.trim() === "" ? filteredStudents.slice(0, 8) : filteredStudents;

  // Load students and notes filtered by educator's assigned classes
  useEffect(() => {
    const loadData = async () => {
      // Wait for educator school data to be loaded
      if (schoolLoading || (!educatorSchool && !educatorCollege)) {
        return;
      }

      try {
        setLoading(true);
        console.log('🔍 [MentorNotes] Loading students for educator type:', educatorType);

        let students: Student[] = [];
        
        if (educatorType === 'school' && educatorSchool) {
          // For school educators, check role and class assignments
          if (educatorRole === 'admin' || educatorRole === 'school_admin') {
            // School admins can see all students in their school
            console.log('👨‍💼 [MentorNotes] Fetching all school students (admin)');
            const { data: schoolStudents, error: studentsError } = await supabase
              .from("students")
              .select("id, name, user_id, grade, section, school_class_id")
              .eq("school_id", educatorSchool.id)
              .eq("is_deleted", false)
              .order("name", { ascending: true });

            if (studentsError) throw studentsError;
            students = schoolStudents || [];
          } else if (assignedClassIds && assignedClassIds.length > 0) {
            // Regular educators can only see students in their assigned classes
            console.log('📚 [MentorNotes] Fetching students for assigned classes:', assignedClassIds);
            const { data: schoolStudents, error: studentsError } = await supabase
              .from("students")
              .select("id, name, user_id, grade, section, school_class_id")
              .eq("school_id", educatorSchool.id)
              .in("school_class_id", assignedClassIds)
              .eq("is_deleted", false)
              .order("name", { ascending: true });

            if (studentsError) throw studentsError;
            students = schoolStudents || [];
          } else {
            // Educators with no class assignments should see no students
            console.log('❌ [MentorNotes] Educator has no class assignments');
            students = [];
          }
        } else if (educatorType === 'college' && educatorCollege) {
          // For college educators, filter by college
          console.log('🎓 [MentorNotes] Fetching college students for college:', educatorCollege.id);
          const { data: collegeStudents, error: studentsError } = await supabase
            .from("students")
            .select("id, name, user_id, grade, section")
            .eq("college_id", educatorCollege.id)
            .eq("is_deleted", false)
            .order("name", { ascending: true });

          if (studentsError) throw studentsError;
          students = collegeStudents || [];
        }

        console.log(`✅ [MentorNotes] Loaded ${students.length} students for ${educatorType} educator`);
        setStudents(students);

        // Get student user_ids for filtering notes
        const studentUserIds = students.map(s => s.user_id).filter(Boolean);

        if (studentUserIds.length === 0) {
          console.log('⚠️ [MentorNotes] No students found, clearing notes');
          setNotes([]);
          return;
        }

        // Fetch notes only for students in educator's assigned classes/college
        console.log('📝 [MentorNotes] Fetching notes for', studentUserIds.length, 'students');
        const { data: filteredNotes, error: notesError } = await supabase
          .from("mentor_notes")
          .select(`
            id,
            student_id,
            feedback,
            action_points,
            quick_notes,
            note_date,
            students(name)
          `)
          .in("student_id", studentUserIds)
          .order("note_date", { ascending: false });

        if (notesError) throw notesError;
        console.log(`✅ [MentorNotes] Loaded ${filteredNotes?.length || 0} notes`);
        setNotes(filteredNotes || []);

      } catch (err) {
        console.error("❌ [MentorNotes] Error loading mentor data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [educatorSchool?.id, educatorCollege?.id, educatorType, assignedClassIds, schoolLoading]);


  // -------------------------
  // helper: refresh notes (filtered by educator's assigned classes/college)
  // -------------------------
  const refreshNotes = async () => {
    if ((!educatorSchool && !educatorCollege) || students.length === 0) {
      setNotes([]);
      return;
    }

    try {
      // Get student user_ids from current filtered students
      const studentUserIds = students.map(s => s.user_id).filter(Boolean);
      
      if (studentUserIds.length === 0) {
        setNotes([]);
        return;
      }

      // Fetch notes only for students in educator's assigned classes/college
      const { data: filteredNotes, error } = await supabase
        .from("mentor_notes")
        .select(`
          id,
          student_id,
          feedback,
          action_points,
          quick_notes,
          note_date,
          students(name)
        `)
        .in("student_id", studentUserIds)
        .order("note_date", { ascending: false });

      if (error) throw error;
      setNotes(filteredNotes || []);

      // if current page has no items after refresh, go back a page
      const lastPage = Math.max(1, Math.ceil((filteredNotes?.length || 0) / pageSize));
      if (page > lastPage) setPage(lastPage);
    } catch (err) {
      console.error("Error refreshing notes:", err);
    }
  };

  // -------------------------
  // Add new note
  // -------------------------
  // const handleSave = async () => {
  //   if (!selectedStudent) {
  //     alert("Please select a student");
  //     return;
  //   }
  //   if (!mentorInfo) {
  //     alert("Mentor profile not found!");
  //     return;
  //   }

  //   const payload = {
  //     student_id: selectedStudent,
  //     mentor_type: mentorInfo.mentor_type,
  //     school_educator_id:
  //       mentorInfo.mentor_type === "school" ? mentorInfo.mentor_id : null,
  //     college_lecturer_id:
  //       mentorInfo.mentor_type === "college" ? mentorInfo.mentor_id : null,
  //     quick_notes: selectedQuickNotes,
  //     feedback,
  //     action_points: actionPoints,
  //   };

  //   try {
  //     await saveMentorNote(payload);
  //     await refreshNotes();
  //     // reset form
  //     setSelectedQuickNotes([]);
  //     setFeedback("");
  //     setActionPoints("");
  //     setOtherNote("");
  //     setIsOtherSelected(false);
  //     alert("Saved successfully!");
  //   } catch (err) {
  //     console.error(err);
  //     alert("Failed to save note.");
  //   }
  // };
  const handleSaveNote = async () => {
    try {
      if (!educatorSchool?.id && !educatorCollege?.id) {
        setErrorMessage("School/College information not found!");
        setShowErrorModal(true);
        return;
      }

      if (!selectedStudent) {
        setErrorMessage("Please select a student!");
        setShowErrorModal(true);
        return;
      }

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrorMessage("User not authenticated!");
        setShowErrorModal(true);
        return;
      }

      let payload;

      if (educatorType === 'school') {
        // Get the educator ID from school_educators table
        const { data: educator, error: educatorError } = await supabase
          .from("school_educators")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (educatorError || !educator) {
          setErrorMessage("School educator profile not found!");
          setShowErrorModal(true);
          return;
        }

        payload = {
          student_id: selectedStudent,
          mentor_type: "school",
          school_educator_id: educator.id,
          college_lecturer_id: null,
          quick_notes: selectedQuickNotes || [],
          feedback: feedback || "",
          action_points: actionPoints || "",
        };
      } else if (educatorType === 'college') {
        // Get the lecturer ID from college_lecturers table
        const { data: lecturer, error: lecturerError } = await supabase
          .from("college_lecturers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (lecturerError || !lecturer) {
          setErrorMessage("College lecturer profile not found!");
          setShowErrorModal(true);
          return;
        }

        payload = {
          student_id: selectedStudent,
          mentor_type: "college",
          school_educator_id: null,
          college_lecturer_id: lecturer.id,
          quick_notes: selectedQuickNotes || [],
          feedback: feedback || "",
          action_points: actionPoints || "",
        };
      } else {
        setErrorMessage("Educator type not recognized!");
        setShowErrorModal(true);
        return;
      }

      await saveMentorNote(payload);

      setSuccessMessage("Note saved successfully!");
      setShowSuccessModal(true);
      await refreshNotes();
      
      // Reset form
      setSelectedStudent("");
      setSelectedQuickNotes([]);
      setFeedback("");
      setActionPoints("");
      setOtherNote("");
      setIsOtherSelected(false);
    } catch (err) {
      console.error("Save note failed:", err);
      setErrorMessage("Failed to save note. Please try again.");
      setShowErrorModal(true);
    }
  };

  // -------------------------
  // update & delete helpers
  // -------------------------
  const updateMentorNote = async (id: string, updates: Partial<MentorNote>) => {
    const { data, error } = await supabase
      .from("mentor_notes")
      .update(updates)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data;
  };

  const deleteMentorNote = async (id: string) => {
    const { data, error } = await supabase.from("mentor_notes").delete().eq("id", id);
    if (error) throw error;
    return data;
  };

  // open view modal
  const handleView = (note: MentorNote) => {
    setViewingNote(note);
  };

  // open edit modal and populate state
  const handleEditOpen = (note: MentorNote) => {
    setEditingNote(note);
    setEditQuickNotes(Array.isArray(note.quick_notes) ? [...note.quick_notes] : []);
    setEditFeedback(note.feedback || "");
    setEditActionPoints(note.action_points || "");
    // if a custom note exists in quick_notes that is not in quickNoteOptions, set editOther
    const custom = (note.quick_notes || []).find((n) => !quickNoteOptions.includes(n));
    setEditOther(custom || "");
    // scroll modal into view on small screens
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditToggle = (opt: string) => {
    setEditQuickNotes((prev) => {
      if (prev.includes(opt)) return prev.filter((p) => p !== opt);
      return [...prev, opt];
    });
  };

  const handleEditSave = async () => {
    if (!editingNote) return;
    const updates = {
      quick_notes: editQuickNotes,
      feedback: editFeedback,
      action_points: editActionPoints,
    };
    try {
      await updateMentorNote(editingNote.id, updates);
      await refreshNotes();
      setEditingNote(null);
      setShowUpdateSuccess(true);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to update note. Please try again.");
      setShowErrorModal(true);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteNoteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteNoteId) return;
    try {
      await deleteMentorNote(deleteNoteId);
      await refreshNotes();
      setShowDeleteConfirm(false);
      setDeleteNoteId(null);
      setSuccessMessage("Note deleted successfully!");
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      setShowDeleteConfirm(false);
      setDeleteNoteId(null);
      setErrorMessage("Failed to delete note. Please try again.");
      setShowErrorModal(true);
    }
  };

  // -------------------------
  // quick notes add/remove for new note form
  // -------------------------
  const toggleQuickNote = (note: string) => {
    if (note === "Others") {
      setIsOtherSelected(true);
      setQuickDropdownOpen(true);
      return;
    }
    setIsOtherSelected(false);
    setSelectedQuickNotes((prev) => (prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note]));
  };

  const handleOtherNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOtherNote(value);

    if (value.trim() === "") {
      setSelectedQuickNotes((prev) => prev.filter((n) => quickNoteOptions.includes(n)));
      return;
    }

    setSelectedQuickNotes((prev) => {
      const filtered = prev.filter((n) => quickNoteOptions.includes(n));
      if (!filtered.includes(value)) return [...filtered, value];
      return filtered;
    });
  };

  const removeQuickNote = (note: string) => {
    setSelectedQuickNotes((prev) => prev.filter((n) => n !== note));
    if (note === otherNote) {
      setOtherNote("");
      setIsOtherSelected(false);
    }
  };

  // -------------------------
  // Pagination derived data
  // -------------------------
  const totalNotes = notes.length;
  const totalPages = Math.max(1, Math.ceil(totalNotes / pageSize));
  const paginatedNotes = notes.slice((page - 1) * pageSize, page * pageSize);

  // small helper to ensure page in range
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  // small util to get chip color by text (so same text maps same color in component lifetime)
  const colorForText = (text: string) => {
    if (!text) return chipColors[0];
    const idx = [...text].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % chipColors.length;
    return chipColors[idx];
  };

  // Show loading state
  if (loading || schoolLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading mentor notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <MessageCircle className="text-blue-600" size={22} />
            Mentor Notes
          </h1>
          <p className="text-gray-600 mt-1">Track and record qualitative feedback for your students.</p>
        </div>

        <button
          onClick={() => setShowTaskModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
        >
          <Edit3 size={18} strokeWidth={2.5} />
          Add New Note
        </button>
      </div>

      {/* Add New Note Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit3 className="text-blue-600" size={22} />
                Add New Note
              </h2>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  setSelectedStudent("");
                  setSelectedQuickNotes([]);
                  setFeedback("");
                  setActionPoints("");
                  setOtherNote("");
                  setIsOtherSelected(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-5">
                {/* Student Dropdown (searchable) */}
                <div className="relative" ref={dropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Student *</label>

                  <div
                    onClick={() => students.length > 0 && setDropdownOpen((v) => !v)}
                    className={`w-full border border-gray-300 bg-white rounded-lg px-4 py-3 flex justify-between items-center transition-colors ${
                      students.length > 0 
                        ? 'cursor-pointer hover:border-gray-400' 
                        : 'cursor-not-allowed bg-gray-50 text-gray-400'
                    }`}
                    role="button"
                    tabIndex={students.length > 0 ? 0 : -1}
                    onKeyDown={(e) => students.length > 0 && e.key === "Enter" && setDropdownOpen((v) => !v)}
                  >
                    <span className={students.length > 0 ? "text-gray-700" : "text-gray-400"}>
                      {selectedStudent ? students.find((s) => s.id === selectedStudent)?.name : 
                       students.length === 0 ? "No students available" : "Select Student"}
                    </span>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {dropdownOpen && students.length > 0 && (
                    <div className="absolute z-30 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl">
                      <input
                        type="text"
                        placeholder="Search student..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border-b border-gray-200 rounded-t-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <div className="max-h-56 overflow-y-auto p-2">
                        {displayStudents.length > 0 ? (
                          displayStudents.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => {
                                setSelectedStudent(s.id);
                                setDropdownOpen(false);
                              }}
                             className="px-3 py-2 rounded-md cursor-pointer hover:bg-green-50 text-gray-800 text-sm transition-colors"
                            >
                              {s.name}
                            </div>
                          ))
                        ) : students.length === 0 ? (
                          <div className="px-3 py-4 text-center">
                            <p className="text-sm text-gray-500 mb-1">No students available</p>
                            <p className="text-xs text-gray-400">
                              {educatorType === 'school' && educatorRole !== 'admin' && assignedClassIds.length === 0
                                ? 'You have not been assigned to any classes yet'
                                : 'No students found in your assigned classes'}
                            </p>
                          </div>
                        ) : (
                           <p className="text-sm text-gray-500 px-3 py-2 text-center">No matching students</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Add Notes */}
                <div className="relative" ref={quickDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quick Add Notes</label>
                  <div
                    onClick={() => setQuickDropdownOpen((v) => !v)}
                    className="w-full border border-gray-300 bg-white rounded-lg px-4 py-3 cursor-pointer flex justify-between items-center hover:border-gray-400 transition-colors"
                  >
                    <span className="text-gray-700">
                      {selectedQuickNotes.length > 0 ? `${selectedQuickNotes.length} selected` : "Select Quick Notes"}
                    </span>
                    <svg className={`w-5 h-5 text-gray-500 transition-transform ${quickDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {quickDropdownOpen && (
                    <div className="absolute z-30 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-3">
                      <div className="max-h-56 overflow-y-auto">
                        {quickNoteOptions.map((note, idx) => {
                          const checked = selectedQuickNotes.includes(note);
                          return (
                            <label
                              key={idx}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-green-50 transition-colors"
                              onClick={(e) => {
                                e.preventDefault();
                                toggleQuickNote(note);
                              }}
                            >
                              <input type="checkbox" checked={checked} readOnly className="cursor-pointer w-4 h-4 text-green-600 focus:ring-green-500 rounded" />
                              <span className="text-gray-800 text-sm">{note}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* selected chips */}
                {selectedQuickNotes.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedQuickNotes.map((note, idx) => {
                      const colorClass = chipColors[idx % chipColors.length];
                      return (
                        <span key={idx} className={`px-3 py-1.5 rounded-full border text-sm flex items-center gap-2 ${colorClass} font-medium`}>
                          <span className="whitespace-nowrap">{note}</span>
                          <button onClick={() => removeQuickNote(note)} className="text-gray-700 hover:text-red-600 ml-1 transition-colors" type="button" aria-label={`Remove ${note}`}>
                            ✕
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {isOtherSelected && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Enter Custom Note</label>
                    <input
                      type="text"
                      value={otherNote}
                      onChange={handleOtherNoteChange}
                      placeholder="Type custom note and it will be added as a chip"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Feedback */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Enter detailed feedback for the student..."
                  />
                </div>

                {/* Action Points */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action Points</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    value={actionPoints}
                    onChange={(e) => setActionPoints(e.target.value)}
                    placeholder="Enter specific action points or recommendations..."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowTaskModal(false);
                    setSelectedStudent("");
                    setSelectedQuickNotes([]);
                    setFeedback("");
                    setActionPoints("");
                    setOtherNote("");
                    setIsOtherSelected(false);
                  }}
                  className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveNote} 
                  disabled={students.length === 0 || !selectedStudent}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <MessageCircle size={18} strokeWidth={2.5} />
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedNotes.map((note) => (
            <article
              key={note.id}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative hover:shadow-md transition"
            >
              <header className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <User size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {Array.isArray(note.students) ? note.students[0]?.name : note.students?.name}
                    </h3>
                  </div>
                </div>
                
                {/* Three-dot menu */}
                <div className="relative" ref={(el) => (menuRefs.current[note.id] = el)}>
                  <button
                    onClick={() => setOpenMenuId(openMenuId === note.id ? null : note.id)}
                    className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                    title="More options"
                  >
                    <MoreVertical size={16} className="text-gray-600" />
                  </button>
                  
                  {openMenuId === note.id && (
                    <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px] z-10 animate-scaleIn">
                      <button
                        onClick={() => {
                          handleView(note);
                          setOpenMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                      >
                        <Eye size={14} className="text-gray-600" />
                        <span className="text-xs text-gray-700 font-medium">View</span>
                      </button>
                      <button
                        onClick={() => {
                          handleEditOpen(note);
                          setOpenMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                      >
                        <Edit3 size={14} className="text-blue-600" />
                        <span className="text-xs text-gray-700 font-medium">Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(note.id);
                          setOpenMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-red-50 transition-colors text-left"
                      >
                        <Trash2 size={14} className="text-red-600" />
                        <span className="text-xs text-red-600 font-medium">Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </header>

              <div className="space-y-3">
                {/* Feedback section */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-xs font-semibold text-gray-700">Feedback:</span>
                  </div>
                  <p className="text-gray-800 text-sm leading-relaxed line-clamp-2">
                    {note.feedback || <span className="text-gray-400 text-xs italic">No feedback</span>}
                  </p>
                </div>

                {/* Action Points section */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-xs font-semibold text-gray-700">Action Points:</span>
                  </div>
                  <p className="text-gray-800 text-sm leading-relaxed line-clamp-2">
                    {note.action_points || <span className="text-gray-400 text-xs italic">No action points</span>}
                  </p>
                </div>
              </div>

              {/* action buttons (labelled) */}

            </article>
          ))}

          {paginatedNotes.length === 0 && (
            <div className="col-span-full bg-white p-6 rounded-2xl border border-gray-100 text-center">
              <div className="text-gray-500 mb-2">No notes found.</div>
              {students.length === 0 && (
                <div className="text-sm text-gray-400">
                  {educatorType === 'school' && educatorRole !== 'admin' && assignedClassIds.length === 0
                    ? 'You need to be assigned to classes before you can add mentor notes.'
                    : 'Start by adding a note for one of your students above.'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom pagination for mobile (visible) */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <strong>{Math.min((page - 1) * pageSize + 1, totalNotes || 0)}</strong> - <strong>{Math.min(page * pageSize, totalNotes || 0)}</strong> of <strong>{totalNotes}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className={`px-3 py-1 rounded-md border ${page === 1 ? "text-gray-300 border-gray-200" : "text-gray-700 border-gray-200 hover:bg-gray-50"}`} aria-label="Previous">
              Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                return (
                  <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded-md border ${p === page ? "bg-blue-600 text-white border-blue-600" : "text-gray-700 border-gray-200 hover:bg-gray-50"}`} aria-label={`Page ${p}`}>
                    {p}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={`px-3 py-1 rounded-md border ${page === totalPages ? "text-gray-300 border-gray-200" : "text-gray-700 border-gray-200 hover:bg-gray-50"}`} aria-label="Next">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* View modal */}
      {viewingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scaleIn">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <User size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {Array.isArray(viewingNote.students) ? viewingNote.students[0]?.name : viewingNote.students?.name}
                  </h3>
                  <div className="flex items-center gap-2 text-blue-100 text-sm mt-1">
                    <Calendar size={14} />
                    <span>{new Date(viewingNote.note_date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setViewingNote(null)} 
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X size={22} className="text-white" />
              </button>
            </div>

            {/* Content area with scroll */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left Column */}
                <div className="space-y-5">
                  {/* Quick Notes Section */}
                  {Array.isArray(viewingNote.quick_notes) && viewingNote.quick_notes.length > 0 && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
                          <MessageCircle size={14} className="text-white" />
                        </div>
                        <h4 className="font-semibold text-gray-800 text-sm">Quick Notes</h4>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {viewingNote.quick_notes.map((qn, i) => (
                          <span 
                            key={i} 
                            className="px-3 py-1 rounded-lg text-xs border bg-blue-50 text-blue-700 border-blue-200 font-medium shadow-sm"
                          >
                            {qn}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback Section */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
                        <MessageCircle size={14} className="text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-800 text-sm">Feedback</h4>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {viewingNote.feedback || <span className="text-gray-400 italic">No feedback provided</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  {/* Action Points Section */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
                        <Edit3 size={14} className="text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-800 text-sm">Action Points</h4>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {viewingNote.action_points || <span className="text-gray-400 italic">No action points provided</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button 
                onClick={() => setViewingNote(null)} 
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4 sm:pt-20 bg-black/40">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-lg overflow-auto max-h-[85vh]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-blue-50 p-2">
                  <Edit3 size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Edit Note</h3>
                  <div className="text-sm text-gray-500">
                    {Array.isArray(editingNote.students) ? editingNote.students[0]?.name : editingNote.students?.name}
                  </div>
                </div>
              </div>
              <button onClick={() => setEditingNote(null)} className="p-2 rounded-md hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-2">Quick Notes</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {quickNoteOptions.map((opt, i) => {
                    const checked = editQuickNotes.includes(opt);
                    return (
                      <label key={i} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={checked} onChange={() => handleEditToggle(opt)} readOnly />
                        <span className="text-sm">{opt}</span>
                      </label>
                    );
                  })}
                </div>

                {/* custom edit other */}
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Custom quick note (optional)"
                    value={editOther}
                    onChange={(e) => {
                      setEditOther(e.target.value);
                      // ensure editQuickNotes contains the custom text
                      const v = e.target.value;
                      setEditQuickNotes((prev) => {
                        const predefined = prev.filter((p) => quickNoteOptions.includes(p));
                        if (!v.trim()) return predefined;
                        if (!predefined.includes(v)) return [...predefined, v];
                        return predefined;
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg p-2 mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Feedback</label>
                <textarea value={editFeedback} onChange={(e) => setEditFeedback(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 mt-1" rows={3} />
              </div>

              <div>
                <label className="text-sm text-gray-600">Action Points</label>
                <textarea value={editActionPoints} onChange={(e) => setEditActionPoints(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 mt-1" rows={2} />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditingNote(null)} className="px-4 py-2 rounded-md border text-sm">Cancel</button>
              <button onClick={handleEditSave} className="px-4 py-2 rounded-md bg-blue-600 text-white">Save</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform animate-scaleIn">
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Success!</h3>
                <p className="text-gray-600 mb-6">{successMessage}</p>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Success Modal */}
      {showUpdateSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform animate-scaleIn">
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-4 shadow-lg">
                  <Edit3 className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Updated!</h3>
                <p className="text-gray-600 mb-6">Note has been updated successfully.</p>
              </div>
              <button
                onClick={() => setShowUpdateSuccess(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform animate-scaleIn">
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Oops!</h3>
                <p className="text-gray-600 mb-6">{errorMessage}</p>
              </div>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform animate-scaleIn">
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-4 shadow-lg">
                  <Trash2 className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Note?</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this note? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteNoteId(null);
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Wrapped MentorNotes with FeatureGate for mentor_notes add-on
 */
const MentorNotes = () => (
  <FeatureGate featureKey="mentor_notes" showUpgradePrompt={true}>
    <MentorNotesContent />
  </FeatureGate>
);

export default MentorNotes;
 