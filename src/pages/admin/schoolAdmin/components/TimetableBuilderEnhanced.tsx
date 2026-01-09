import React, { useState, useEffect } from "react";
import { Sparkles, Save, Send, AlertTriangle, Edit2, Trash2, Search, Filter, Grid3X3, List } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { validateTimetableSlot, getAllTimetableConflicts, ValidationConflict } from "../../../../utils/timetableValidation";

interface Teacher {
  id: string;
  teacher_id: string;
  first_name: string;
  last_name: string;
}

interface SchoolClass {
  id: string;
  name: string;
  grade: string;
  section: string;
  room_no?: string;
}

interface Subject {
  id: string;
  name: string;
  description?: string;
}

interface TimetableSlot {
  id?: string;
  educator_id: string;
  teacher_id: string;
  teacher_name?: string;
  class_id?: string;
  class_name: string;
  day_of_week: number;
  period_number: number;
  start_time: string;
  end_time: string;
  subject_name: string;
  room_number: string;
}

const TimetableBuilderEnhanced: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [timetableId, setTimetableId] = useState<string>("");
  const [allSlots, setAllSlots] = useState<TimetableSlot[]>([]);
  const [draggedSlot, setDraggedSlot] = useState<TimetableSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"draft" | "published">("draft");
  const [conflicts, setConflicts] = useState<Map<string, ValidationConflict[]>>(new Map());
  const [showConflicts, setShowConflicts] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTeacherClassModal, setShowTeacherClassModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ day: number; period: number } | null>(null);
  const [newSlot, setNewSlot] = useState({
    teacher_id: "",
    class_id: "",
    subject_name: "",
    room_number: "",
  });
  const [editSlot, setEditSlot] = useState({
    teacher_id: "",
    class_id: "",
    subject_name: "",
    room_number: "",
  });
  
  // Filter states
  const [filterTeacher, setFilterTeacher] = useState<string>("");
  const [filterClass, setFilterClass] = useState<string>("");
  const [filterDay, setFilterDay] = useState<string>("");
  const [filterSubject, setFilterSubject] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  
  // Search and view states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"slots-filters" | "teacher-load">("slots-filters");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const periods = Array.from({ length: 10 }, (_, i) => i + 1);
  const timeSlots = [
    "09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00",
    "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00",
    "17:00-18:00", "18:00-19:00"
  ];

  useEffect(() => {
    loadTeachers();
    loadClasses();
    loadOrCreateTimetable();
  }, []);

  useEffect(() => {
    if (timetableId) {
      loadAllSlots();
    }
  }, [timetableId]);

  const getSchoolId = async (): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        return null;
      }

      // Get user role first
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      // For school_admin: lookup school by created_by
      if (userData?.role === "school_admin") {
        const { data: schoolData } = await supabase
          .from("schools")
          .select("id")
          .eq("created_by", user.id)
          .maybeSingle();

        if (schoolData?.id) {
          return schoolData.id;
        }
      }

      // For school_educator: lookup from school_educators table
      if (userData?.role === "school_educator") {
        const { data: educatorData } = await supabase
          .from("school_educators")
          .select("school_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (educatorData?.school_id) {
          return educatorData.school_id;
        }
      }

      return null;
    } catch (error) {
      console.error("Error fetching school ID:", error);
      return null;
    }
  };

  const loadTeachers = async () => {
    const schoolId = await getSchoolId();
    if (!schoolId) {
      console.error('No school_id found');
      return;
    }

    // Load teachers from school_educators
    const { data } = await supabase
      .from("school_educators")
      .select("id, teacher_id, first_name, last_name")
      .eq("school_id", schoolId)
      .eq("account_status", "active")
      .order("first_name");
    
    if (data) setTeachers(data);
  };

  // const loadClasses = async () => {
  //   const schoolId = await getSchoolId();
  //   if (!schoolId) {
  //     console.error('No school_id found for classes');
  //     return;
  //   }

  //   // Load classes
  //   const { data } = await supabase
  //     .from("school_classes")
  //     .select("id, name, grade, section")
  //     .eq("school_id", schoolId)
  //     .eq("account_status", "active")
  //     .order("grade")
  //     .order("section");
    
  //   console.log('Loaded classes:', data);
  //   if (data) setClasses(data);
  // };
const loadClasses = async () => {
    const schoolId = await getSchoolId();
    if (!schoolId) {
      console.error('No school_id found for classes');
      return;
    }

    // Load classes with room_number
    const { data } = await supabase
      .from("school_classes")
      .select("id, name, grade, section, room_no")
      .eq("school_id", schoolId)
      .eq("account_status", "active")
      .order("grade")
      .order("section");
    
    console.log('Loaded classes:', data);
    if (data) setClasses(data);
  };
  const loadOrCreateTimetable = async () => {
    const schoolId = await getSchoolId();
    if (!schoolId) {
      console.error('No school_id found for timetable');
      return;
    }

    const currentYear = new Date().getFullYear();
    const { data: existing } = await supabase
      .from("timetables")
      .select("id, status")
      .eq("school_id", schoolId)
      .eq("academic_year", `${currentYear}-${currentYear + 1}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      console.log('Found existing timetable:', existing.id);
      setTimetableId(existing.id);
      setPublishStatus(existing.status);
    } else {
      console.log('Creating new timetable for school:', schoolId);
      const { data: newTimetable, error } = await supabase
        .from("timetables")
        .insert({
          school_id: schoolId,
          academic_year: `${currentYear}-${currentYear + 1}`,
          term: "Term 1",
          start_date: `${currentYear}-06-01`,
          end_date: `${currentYear}-12-31`,
          status: "draft",
        })
        .select("id")
        .single();
      
      if (error) {
        console.error('Error creating timetable:', error);
        return;
      }
      
      if (newTimetable) {
        console.log('Created new timetable:', newTimetable.id);
        setTimetableId(newTimetable.id);
      }
    }
  };
// Add this function with other load functions
const loadSubjects = async () => {
  const schoolId = await getSchoolId();
  if (!schoolId) {
    console.error('No school_id found for subjects');
    return;
  }

  const { data } = await supabase
    .from("curriculum_subjects")
    .select("id, name, description")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .order("display_order")
    .order("name");
  
  console.log('Loaded subjects:', data);
  if (data) setSubjects(data);
};

// Add loadSubjects to the initial useEffect
useEffect(() => {
  loadTeachers();
  loadClasses();
  loadSubjects(); // Add this line
  loadOrCreateTimetable();
}, []);

const loadRooms = () => {
  // Extract unique room numbers from classes that are already loaded
  const uniqueRooms = [...new Set(
    classes
      .map(c => c.room_no)
      .filter(room => room && room.trim() !== '')
  )].sort();
  
  console.log('Loaded rooms:', uniqueRooms);
  setRooms(uniqueRooms as string[]);
};

useEffect(() => {
  loadTeachers();
  loadClasses();
  loadSubjects();
  loadOrCreateTimetable();
}, []);

// Load rooms AFTER classes are loaded
useEffect(() => {
  if (classes.length > 0) {
    loadRooms();
  }
}, [classes]);
const loadAllSlots = async () => {
    const { data, error } = await supabase
      .from("timetable_slots")
      .select(`
        *,
        school_educators!timetable_slots_educator_id_fkey(first_name, last_name),
        school_classes!timetable_slots_class_id_fkey(name)
      `)
      .eq("timetable_id", timetableId)
      .order("day_of_week")
      .order("period_number");
    
    if (error) {
      console.error("Error loading slots:", error);
      return;
    }
    
    if (data) {
      console.log("Raw slots data:", data);
      const slotsWithNames = data.map((slot: any) => ({
        ...slot,
        // Fix: Ensure both teacher_id and educator_id are properly mapped
        teacher_id: slot.educator_id, // For validation functions
        educator_id: slot.educator_id, // For component logic
        teacher_name: slot.school_educators ? `${slot.school_educators.first_name} ${slot.school_educators.last_name}` : "",
        class_name: slot.school_classes ? slot.school_classes.name : ""
      }));
      console.log("Processed slots:", slotsWithNames);
      setAllSlots(slotsWithNames);
      
      // Fix: Validate all slots with proper field mapping
      const conflictMap = getAllTimetableConflicts(slotsWithNames);
      setConflicts(conflictMap);
    }
  };

  const getSlotForCell = (day: number, period: number) => {
    return allSlots.find(s => s.day_of_week === day && s.period_number === period);
  };

  const getTeacherLoad = (teacherId: string) => {
    return allSlots.filter(s => s.educator_id === teacherId).length;
  };

  const handleDragStart = (slot: TimetableSlot) => {
    setDraggedSlot(slot);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (day: number, period: number) => {
    if (!draggedSlot) return;

    // Create updated slot with proper field mapping
    const updatedSlot = {
      ...draggedSlot,
      day_of_week: day,
      period_number: period,
      teacher_id: draggedSlot.educator_id, // Fix: Ensure teacher_id is set for validation
    };

    // Validate before updating
    const validationConflicts = validateTimetableSlot(allSlots, updatedSlot);
    const hasErrors = validationConflicts.some(c => c.severity === 'error');

    if (hasErrors) {
      const errorMessages = validationConflicts
        .filter(c => c.severity === 'error')
        .map(c => c.message)
        .join('\n');
      
      alert(`Cannot move slot:\n${errorMessages}`);
      setDraggedSlot(null);
      return;
    }

    setLoading(true);
    try {
      // Update slot position
      const { error } = await supabase
        .from("timetable_slots")
        .update({
          day_of_week: day,
          period_number: period,
        })
        .eq("id", draggedSlot.id);

      if (error) throw error;
      
      await loadAllSlots();
      setDraggedSlot(null);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const autoGenerateTimetable = async () => {
    if (!confirm("This will generate a timetable automatically. Continue?")) return;
    
    if (classes.length === 0) {
      alert("No classes found. Please create classes first.");
      return;
    }
    
    setLoading(true);
    try {
      // Simple auto-generation logic
      const newSlots: any[] = [];
      let slotIndex = 0;

      teachers.forEach((teacher, teacherIndex) => {
        // Assign 5 periods per teacher across the week
        for (let i = 0; i < 5; i++) {
          const day = (teacherIndex % 6) + 1; // Distribute across days
          const period = (slotIndex % 10) + 1;
          const classIndex = i % classes.length;
          
          newSlots.push({
            timetable_id: timetableId,
            educator_id: teacher.id,
            class_id: classes[classIndex].id,
            day_of_week: day,
            period_number: period,
            start_time: timeSlots[period - 1].split("-")[0],
            end_time: timeSlots[period - 1].split("-")[1],
            subject_name: "General",
            room_number: `R${period}`,
          });
          
          slotIndex++;
        }
      });

      const { error } = await supabase
        .from("timetable_slots")
        .insert(newSlots);

      if (error) throw error;
      
      await loadAllSlots();
      alert("Timetable generated successfully!");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const publishTimetable = async () => {
    if (!confirm("Publish this timetable? It will be visible to all teachers.")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("timetables")
        .update({ status: "published" })
        .eq("id", timetableId);

      if (error) throw error;
      
      setPublishStatus("published");
      alert("Timetable published successfully!");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (day: number, period: number) => {
    const existingSlot = getSlotForCell(day, period);
    if (existingSlot) return; // Don't open modal if slot exists
    
    // Open teacher/class selection modal first
    setSelectedCell({ day, period });
    // Reset the slot data
    setNewSlot({
      teacher_id: "",
      class_id: "",
      subject_name: "",
      room_number: "",
    });
    setShowTeacherClassModal(true);
  };

  const handleTeacherClassSelection = () => {
    if (!newSlot.teacher_id || !newSlot.class_id) {
      alert("Please select both Teacher and Class");
      return;
    }
    
    // Get room number from selected class
    const selectedClass = classes.find(c => c.id === newSlot.class_id);
    const defaultRoom = selectedClass?.room_no || "";
    
    // Set default room and reset subject
    setNewSlot({
      ...newSlot,
      subject_name: "",
      room_number: defaultRoom,
    });
    
    // Close teacher/class modal and open subject/room modal
    setShowTeacherClassModal(false);
    setShowAddModal(true);
  };

  const handleAddSlot = async () => {
    if (!selectedCell || !newSlot.teacher_id || !newSlot.class_id || !newSlot.subject_name) {
      alert("Please fill all required fields");
      return;
    }
    
    // Get the selected class's default room
    const selectedClass = classes.find(c => c.id === newSlot.class_id);
    const classDefaultRoom = selectedClass?.room_no;

    // Validate room number if class has a default room
    if (classDefaultRoom && newSlot.room_number && newSlot.room_number !== classDefaultRoom) {
      const confirmDifferentRoom = confirm(
        `Warning: The selected room "${newSlot.room_number}" is different from the class's default room "${classDefaultRoom}".\n\nDo you want to continue anyway?`
      );
      
      if (!confirmDifferentRoom) {
        return;
      }
    }

    // Check if room number is provided when class has default room
    if (classDefaultRoom && !newSlot.room_number) {
      alert(`Please select a room number. The default room for this class is: ${classDefaultRoom}`);
      return;
    }

    // Create slot object for validation with proper field mapping
    const [startTime, endTime] = timeSlots[selectedCell.period - 1].split("-");
    const slotToValidate = {
      educator_id: newSlot.teacher_id,
      teacher_id: newSlot.teacher_id, // Fix: Ensure teacher_id is set for validation
      class_id: newSlot.class_id,
      day_of_week: selectedCell.day,
      period_number: selectedCell.period,
      start_time: startTime,
      end_time: endTime,
      subject_name: newSlot.subject_name,
      room_number: newSlot.room_number || `R${selectedCell.period}`,
      class_name: classes.find(c => c.id === newSlot.class_id)?.name || "",
    };

    // Validate before adding
    const validationConflicts = validateTimetableSlot(allSlots, slotToValidate);
    const hasErrors = validationConflicts.some(c => c.severity === 'error');

    if (hasErrors) {
      const errorMessages = validationConflicts
        .filter(c => c.severity === 'error')
        .map(c => c.message)
        .join('\n');
      
      alert(`Cannot add slot:\n${errorMessages}`);
      return;
    }

    // Show warnings if any
    const warnings = validationConflicts.filter(c => c.severity === 'warning');
    if (warnings.length > 0) {
      const warningMessages = warnings.map(c => c.message).join('\n');
      const confirmWithWarnings = confirm(`Warning:\n${warningMessages}\n\nDo you want to continue anyway?`);
      
      if (!confirmWithWarnings) {
        return;
      }
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("timetable_slots")
        .insert({
          timetable_id: timetableId,
          educator_id: newSlot.teacher_id,
          class_id: newSlot.class_id,
          day_of_week: selectedCell.day,
          period_number: selectedCell.period,
          start_time: startTime,
          end_time: endTime,
          subject_name: newSlot.subject_name,
          room_number: newSlot.room_number || `R${selectedCell.period}`,
        });

      if (error) throw error;
      
      await loadAllSlots();
      setShowAddModal(false);
      setSelectedCell(null);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Delete this slot?")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("timetable_slots")
        .delete()
        .eq("id", slotId);

      if (error) throw error;
      
      await loadAllSlots();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSlot = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    // Get the default room for the slot's class
    const selectedClass = classes.find(c => c.id === slot.class_id);
    const defaultRoom = selectedClass?.room_no || "";
    
    setEditSlot({
      teacher_id: slot.educator_id,
      class_id: slot.class_id || "",
      subject_name: slot.subject_name,
      room_number: slot.room_number || defaultRoom,
    });
    setShowEditModal(true);
  };

  const handleUpdateSlot = async () => {
    if (!editingSlot || !editSlot.teacher_id || !editSlot.class_id || !editSlot.subject_name) {
      alert("Please fill all required fields");
      return;
    }

    // Create slot object for validation with proper field mapping
    const slotToValidate = {
      id: editingSlot.id,
      educator_id: editSlot.teacher_id,
      teacher_id: editSlot.teacher_id, // Fix: Ensure teacher_id is set for validation
      class_id: editSlot.class_id,
      day_of_week: editingSlot.day_of_week,
      period_number: editingSlot.period_number,
      start_time: editingSlot.start_time,
      end_time: editingSlot.end_time,
      subject_name: editSlot.subject_name,
      room_number: editSlot.room_number || `R${editingSlot.period_number}`,
      class_name: classes.find(c => c.id === editSlot.class_id)?.name || "",
    };

    // Validate before updating
    const validationConflicts = validateTimetableSlot(allSlots, slotToValidate);
    const hasErrors = validationConflicts.some(c => c.severity === 'error');

    if (hasErrors) {
      const errorMessages = validationConflicts
        .filter(c => c.severity === 'error')
        .map(c => c.message)
        .join('\n');
      
      alert(`Cannot update slot:\n${errorMessages}`);
      return;
    }

    // Show warnings if any
    const warnings = validationConflicts.filter(c => c.severity === 'warning');
    if (warnings.length > 0) {
      const warningMessages = warnings.map(c => c.message).join('\n');
      const confirmWithWarnings = confirm(`Warning:\n${warningMessages}\n\nDo you want to continue anyway?`);
      
      if (!confirmWithWarnings) {
        return;
      }
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("timetable_slots")
        .update({
          educator_id: editSlot.teacher_id,
          class_id: editSlot.class_id,
          subject_name: editSlot.subject_name,
          room_number: editSlot.room_number || `R${editingSlot.period_number}`,
        })
        .eq("id", editingSlot.id);

      if (error) throw error;
      
      await loadAllSlots();
      setShowEditModal(false);
      setEditingSlot(null);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const getFilteredSlots = () => {
    return allSlots.filter(slot => {
      // Search functionality
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = [
          slot.teacher_name || '',
          slot.class_name || '',
          slot.subject_name || '',
          slot.room_number || '',
          days[slot.day_of_week - 1] || '',
          `period ${slot.period_number}`,
          `${slot.start_time} - ${slot.end_time}`
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) return false;
      }
      
      // Existing filters
      if (filterTeacher && slot.educator_id !== filterTeacher) return false;
      if (filterClass && slot.class_id !== filterClass) return false;
      if (filterDay && slot.day_of_week !== parseInt(filterDay)) return false;
      if (filterSubject && !slot.subject_name.toLowerCase().includes(filterSubject.toLowerCase())) return false;
      if (filterStatus) {
        const slotConflicts = slot.id ? conflicts.get(slot.id) || [] : [];
        const hasError = slotConflicts.some(c => c.severity === 'error');
        const hasWarning = slotConflicts.some(c => c.severity === 'warning');
        
        if (filterStatus === 'ok' && (hasError || hasWarning)) return false;
        if (filterStatus === 'warning' && !hasWarning) return false;
        if (filterStatus === 'error' && !hasError) return false;
      }
      return true;
    });
  };

  // Pagination logic
  const getPaginatedSlots = () => {
    const filteredSlots = getFilteredSlots();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredSlots.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filteredSlots = getFilteredSlots();
    return Math.ceil(filteredSlots.length / itemsPerPage);
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterTeacher, filterClass, filterDay, filterSubject, filterStatus]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      {/* <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100"> */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Timetable Builder
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Drag & drop to build timetable with automatic conflict detection
            </p>
          </div>
          <div className="flex gap-2">
            <span className={`px-4 py-2 rounded-lg font-medium ${
              publishStatus === "published" 
                ? "bg-green-100 text-green-800" 
                : "bg-yellow-100 text-yellow-800"
            }`}>
              {publishStatus === "published" ? "Published" : "Draft"}
            </span>
          </div>
        </div>
      {/* </div> */}
      {allSlots.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                      <div className="text-2xl font-bold text-indigo-900">{getFilteredSlots().length}</div>
                      <div className="text-sm text-indigo-700">
                        {getFilteredSlots().length === allSlots.length ? 'Total Slots' : `Filtered (${allSlots.length} total)`}
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="text-2xl font-bold text-green-900">
                        {getFilteredSlots().filter(s => !conflicts.has(s.id || '')).length}
                      </div>
                      <div className="text-sm text-green-700">Valid Slots</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-900">
                        {getFilteredSlots().filter(s => {
                          const slotConflicts = s.id ? conflicts.get(s.id) || [] : [];
                          return slotConflicts.some(c => c.severity === 'warning' && !slotConflicts.some(c2 => c2.severity === 'error'));
                        }).length}
                      </div>
                      <div className="text-sm text-yellow-700">Warnings</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <div className="text-2xl font-bold text-red-900">
                        {getFilteredSlots().filter(s => {
                          const slotConflicts = s.id ? conflicts.get(s.id) || [] : [];
                          return slotConflicts.some(c => c.severity === 'error');
                        }).length}
                      </div>
                      <div className="text-sm text-red-700">Errors</div>
                    </div>
                  </div>
                )}

      {/* Conflicts Alert */}
      {conflicts.size > 0 && showConflicts && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="font-bold text-red-900">
                {conflicts.size} Slot(s) with Conflicts Detected
              </h3>
            </div>
            <button
              onClick={() => setShowConflicts(false)}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {Array.from(conflicts.entries()).map(([slotId, slotConflicts]) => {
              const slot = allSlots.find(s => s.id === slotId);
              if (!slot) return null;
              
              return (
                <div key={slotId} className="bg-white p-3 rounded-lg border border-red-200">
                  <div className="font-medium text-sm text-gray-900 mb-1">
                    {slot.teacher_name} - {days[slot.day_of_week - 1]} Period {slot.period_number}
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {slotConflicts.map((conflict, idx) => (
                      <li key={idx} className={`text-xs ${
                        conflict.severity === 'error' ? 'text-red-700' : 'text-yellow-700'
                      }`}>
                        {conflict.message}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      

      {/* Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
        <button
          onClick={autoGenerateTimetable}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition"
        >
          <Sparkles className="h-4 w-4" />
          Auto-Generate
        </button>
        <button
          onClick={() => loadAllSlots()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
        <button
          onClick={publishTimetable}
          disabled={loading || publishStatus === "published"}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
        >
          <Send className="h-4 w-4" />
          Publish
        </button>
      </div>

      {/* Tab Navigation */}
      
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("teacher-load")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "teacher-load"
                ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
          Add Slots
          </button>
          <button
            onClick={() => setActiveTab("slots-filters")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "slots-filters"
                ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            Timetable Slots
          </button>
          
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "slots-filters" && (
            <div className="space-y-6">
              {/* Timetable Slots Details Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Timetable Slots Details</h3>
                </div>

                {/* Search Bar and Controls */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    {/* Search Bar */}
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search slots..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                      {/* Filters Toggle */}
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          showFilters
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Filter className="h-4 w-4" />
                        Filters
                      </button>

                      {/* View Toggle */}
                      <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => setViewMode("list")}
                          className={`p-1.5 rounded-md transition-colors ${
                            viewMode === "list"
                              ? "bg-white text-indigo-600 shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                          title="List view"
                        >
                          <List className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setViewMode("grid")}
                          className={`p-1.5 rounded-md transition-colors ${
                            viewMode === "grid"
                              ? "bg-white text-indigo-600 shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                          title="Grid view"
                        >
                          <Grid3X3 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Filters */}
                  {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Teacher</label>
                          <select
                            value={filterTeacher}
                            onChange={(e) => setFilterTeacher(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">All Teachers</option>
                            {teachers.map((teacher) => (
                              <option key={teacher.id} value={teacher.id}>
                                {teacher.first_name} {teacher.last_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Class</label>
                          <select
                            value={filterClass}
                            onChange={(e) => setFilterClass(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">All Classes</option>
                            {classes.map((cls) => (
                              <option key={cls.id} value={cls.id}>
                                {cls.grade}{cls.section ? `-${cls.section}` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Day</label>
                          <select
                            value={filterDay}
                            onChange={(e) => setFilterDay(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">All Days</option>
                            {days.map((day, idx) => (
                              <option key={day} value={idx + 1}>
                                {day}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                          <select
                            value={filterSubject}
                            onChange={(e) => setFilterSubject(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">All Subjects</option>
                            {subjects.map((subject) => (
                              <option key={subject.id} value={subject.name}>
                                {subject.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                          <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">All Status</option>
                            <option value="ok">✓ OK</option>
                            <option value="warning">⚠ Warning</option>
                            <option value="error">✕ Error</option>
                          </select>
                        </div>
                      </div>
                      {(filterTeacher || filterClass || filterDay || filterSubject || filterStatus) && (
                        <button
                          onClick={() => {
                            setFilterTeacher("");
                            setFilterClass("");
                            setFilterDay("");
                            setFilterSubject("");
                            setFilterStatus("");
                          }}
                          className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                {allSlots.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No slots added yet. Switch to "Teacher Load & Add Slots" tab to start building your timetable.
                  </div>
                ) : (
                  <>
                    {viewMode === "list" ? (
                      /* List View */
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">Day</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">Period</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">Time</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">Teacher</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">Class</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">Subject</th>
                              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">Room</th>
                              <th className="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                              <th className="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getPaginatedSlots()
                              .sort((a, b) => {
                                if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
                                return a.period_number - b.period_number;
                              })
                              .map((slot) => {
                                const slotConflicts = slot.id ? conflicts.get(slot.id) || [] : [];
                                const hasConflict = slotConflicts.length > 0;
                                const hasError = slotConflicts.some(c => c.severity === 'error');
                                
                                return (
                                  <tr 
                                    key={slot.id} 
                                    className={`hover:bg-gray-50 ${
                                      hasError ? 'bg-red-50' : hasConflict ? 'bg-yellow-50' : ''
                                    }`}
                                  >
                                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                                      {days[slot.day_of_week - 1]}
                                    </td>
                                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                                      Period {slot.period_number}
                                    </td>
                                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
                                      {slot.start_time} - {slot.end_time}
                                    </td>
                                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                                      {slot.teacher_name}
                                    </td>
                                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                                      {slot.class_name}
                                    </td>
                                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                                      {slot.subject_name}
                                    </td>
                                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
                                      {slot.room_number}
                                    </td>
                                    <td className="border border-gray-200 px-4 py-3 text-center">
                                      {hasError ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                          <AlertTriangle className="h-3 w-3" />
                                          Error
                                        </span>
                                      ) : hasConflict ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                          <AlertTriangle className="h-3 w-3" />
                                          Warning
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                          ✓ OK
                                        </span>
                                      )}
                                    </td>
                                    <td className="border border-gray-200 px-4 py-3 text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <button
                                          onClick={() => handleEditSlot(slot)}
                                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                          title="Edit slot"
                                        >
                                          <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => slot.id && handleDeleteSlot(slot.id)}
                                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                          title="Delete slot"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      /* Grid View */
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getPaginatedSlots()
                          .sort((a, b) => {
                            if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
                            return a.period_number - b.period_number;
                          })
                          .map((slot) => {
                            const slotConflicts = slot.id ? conflicts.get(slot.id) || [] : [];
                            const hasConflict = slotConflicts.length > 0;
                            const hasError = slotConflicts.some(c => c.severity === 'error');
                            
                            return (
                              <div
                                key={slot.id}
                                className={`bg-white rounded-lg border-2 p-4 hover:shadow-md transition-shadow ${
                                  hasError
                                    ? "border-red-300 bg-red-50"
                                    : hasConflict
                                    ? "border-yellow-300 bg-yellow-50"
                                    : "border-gray-200 hover:border-indigo-300"
                                }`}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-gray-900">
                                        {days[slot.day_of_week - 1]}
                                      </span>
                                      <span className="text-sm text-gray-500">
                                        Period {slot.period_number}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {slot.start_time} - {slot.end_time}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {hasError ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                        <AlertTriangle className="h-3 w-3" />
                                        Error
                                      </span>
                                    ) : hasConflict ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                        <AlertTriangle className="h-3 w-3" />
                                        Warning
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                        ✓ OK
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500">Teacher:</span>
                                    <span className="text-sm text-gray-900">{slot.teacher_name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500">Class:</span>
                                    <span className="text-sm text-gray-900">{slot.class_name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500">Subject:</span>
                                    <span className="text-sm text-gray-900">{slot.subject_name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500">Room:</span>
                                    <span className="text-sm text-gray-600">{slot.room_number}</span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                                  <button
                                    onClick={() => handleEditSlot(slot)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Edit slot"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => slot.id && handleDeleteSlot(slot.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete slot"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {/* Pagination Controls */}
                    {getFilteredSlots().length > itemsPerPage && (
                      <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, getFilteredSlots().length)} of {getFilteredSlots().length} slots
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          
                          <div className="flex items-center gap-1">
                            {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => {
                              // Show first page, last page, current page, and pages around current page
                              const showPage = page === 1 || 
                                             page === getTotalPages() || 
                                             Math.abs(page - currentPage) <= 1;
                              
                              if (!showPage && page === 2 && currentPage > 4) {
                                return <span key={page} className="px-2 text-gray-400">...</span>;
                              }
                              if (!showPage && page === getTotalPages() - 1 && currentPage < getTotalPages() - 3) {
                                return <span key={page} className="px-2 text-gray-400">...</span>;
                              }
                              if (!showPage) return null;
                              
                              return (
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`px-3 py-2 text-sm font-medium rounded-lg ${
                                    currentPage === page
                                      ? "bg-indigo-600 text-white"
                                      : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                  }`}
                                >
                                  {page}
                                </button>
                              );
                            })}
                          </div>
                          
                          <button
                            onClick={() => setCurrentPage(Math.min(getTotalPages(), currentPage + 1))}
                            disabled={currentPage === getTotalPages()}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Summary Stats */}
                
              </div>
            </div>
          )}

          {activeTab === "teacher-load" && (
            <div className="space-y-6">
              {/* Timetable Grid */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-gray-100 z-10">
                        Period / Day
                      </th>
                      {days.map((day) => (
                        <th key={day} className="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-900 min-w-[150px]">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map((period) => (
                      <tr key={period}>
                        <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                          <div>
                            <div>Period {period}</div>
                            <div className="text-xs text-gray-500">{timeSlots[period - 1]}</div>
                          </div>
                        </td>
                        {days.map((day, dayIndex) => {
                          const slot = getSlotForCell(dayIndex + 1, period);
                          const isFree = !slot;
                          
                          // Apply filters to determine if slot should be visible
                          const isFiltered = slot && !getFilteredSlots().some(s => s.id === slot.id);
                          
                          return (
                            <td
                              key={`${day}-${period}`}
                              className={`border border-gray-200 px-2 py-2 text-sm ${
                                isFree ? "bg-green-50 cursor-pointer hover:bg-green-100" : 
                                isFiltered ? "bg-gray-100" : "bg-white"
                              }`}
                              onDragOver={handleDragOver}
                              onDrop={() => handleDrop(dayIndex + 1, period)}
                              onClick={() => isFree && handleCellClick(dayIndex + 1, period)}
                            >
                              {slot ? (
                                isFiltered ? (
                                  <div className="p-2 text-center text-xs text-gray-400 italic">
                                    Filtered
                                  </div>
                                ) : (
                                  (() => {
                                    const slotConflicts = slot.id ? conflicts.get(slot.id) || [] : [];
                                    const hasConflict = slotConflicts.length > 0;
                                    const hasError = slotConflicts.some(c => c.severity === 'error');
                                    
                                    return (
                                      <div
                                        draggable
                                        onDragStart={() => handleDragStart(slot)}
                                        className={`p-2 border rounded cursor-move transition relative group ${
                                          hasError
                                            ? "bg-red-100 border-red-500 hover:bg-red-200"
                                            : hasConflict
                                            ? "bg-yellow-100 border-yellow-500 hover:bg-yellow-200"
                                            : "bg-indigo-100 border-indigo-300 hover:bg-indigo-200"
                                        }`}
                                        title={hasConflict ? slotConflicts.map(c => c.message).join('\n') : ''}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditSlot(slot);
                                        }}
                                      >
                                        {slot.id && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteSlot(slot.id!);
                                            }}
                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600 transition z-10"
                                            title="Delete slot"
                                          >
                                            ×
                                          </button>
                                        )}
                                        {hasError && (
                                          <div className="flex items-center gap-1 mb-1">
                                            <AlertTriangle className="h-3 w-3 text-red-600" />
                                            <span className="text-xs text-red-600 font-bold">Conflict!</span>
                                          </div>
                                        )}
                                        <div className={`font-medium text-xs truncate ${
                                          hasError ? "text-red-900" : hasConflict ? "text-yellow-900" : "text-indigo-900"
                                        }`}>
                                          {slot.teacher_name}
                                        </div>
                                        <div className={`text-xs truncate ${
                                          hasError ? "text-red-700" : hasConflict ? "text-yellow-700" : "text-indigo-700"
                                        }`}>
                                          {slot.subject_name}
                                        </div>
                                        <div className={`text-xs ${
                                          hasError ? "text-red-600" : hasConflict ? "text-yellow-600" : "text-indigo-600"
                                        }`}>
                                          {slot.class_name} • {slot.room_number}
                                        </div>
                                      </div>
                                    );
                                  })()
                                )
                              ) : (
                                <div className="p-2 text-center text-xs text-green-600 font-medium hover:text-green-700">
                                  + Add Slot
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      
      

      {/* Teacher/Class Selection Modal - Step 1 */}
      {showTeacherClassModal && selectedCell && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Select Teacher & Class - {days[selectedCell.day - 1]} Period {selectedCell.period}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Time: {timeSlots[selectedCell.period - 1]}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Teacher Load - Dropdown */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">Teacher Load</h3>
                <select
                  value={newSlot.teacher_id}
                  onChange={(e) => setNewSlot({ ...newSlot, teacher_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 mb-4"
                  autoFocus
                >
                  <option value="">-- Select Teacher --</option>
                  {teachers.map((teacher) => {
                    const load = getTeacherLoad(teacher.id);
                    return (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name} ({load}/30 periods)
                      </option>
                    );
                  })}
                </select>
                {newSlot.teacher_id && (
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <p className="text-sm font-medium text-indigo-900 mb-2">
                      Selected: {teachers.find(t => t.id === newSlot.teacher_id)?.first_name} {teachers.find(t => t.id === newSlot.teacher_id)?.last_name}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            (getTeacherLoad(newSlot.teacher_id) / 30) * 100 > 100 ? "bg-red-500" :
                            (getTeacherLoad(newSlot.teacher_id) / 30) * 100 > 80 ? "bg-yellow-500" :
                            "bg-green-500"
                          }`}
                          style={{ width: `${Math.min((getTeacherLoad(newSlot.teacher_id) / 30) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        {getTeacherLoad(newSlot.teacher_id)}/30
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-indigo-600">
                      Load: {Math.round((getTeacherLoad(newSlot.teacher_id) / 30) * 100)}%
                    </div>
                  </div>
                )}
              </div>

              {/* Classes in School - Dropdown */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">Classes in School</h3>
                <select
                  value={newSlot.class_id}
                  onChange={(e) => setNewSlot({ ...newSlot, class_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 mb-4"
                >
                  <option value="">-- Select Class --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.grade}{cls.section ? `-${cls.section}` : ''} ({cls.name})
                    </option>
                  ))}
                </select>
                {newSlot.class_id && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-900 mb-1">
                      Selected: {classes.find(c => c.id === newSlot.class_id)?.grade}
                      {classes.find(c => c.id === newSlot.class_id)?.section ? `-${classes.find(c => c.id === newSlot.class_id)?.section}` : ''}
                    </p>
                    <p className="text-xs text-green-600">{classes.find(c => c.id === newSlot.class_id)?.name}</p>
                    {classes.find(c => c.id === newSlot.class_id)?.room_no && (
                      <p className="text-xs text-green-600 mt-1">
                        Default Room: {classes.find(c => c.id === newSlot.class_id)?.room_no}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTeacherClassModal(false);
                  setSelectedCell(null);
                  setNewSlot({
                    teacher_id: "",
                    class_id: "",
                    subject_name: "",
                    room_number: "",
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleTeacherClassSelection}
                disabled={!newSlot.teacher_id || !newSlot.class_id}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
              >
                Next: Select Subject & Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Slot Modal */}
      {showEditModal && editingSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Edit Slot - {days[editingSlot.day_of_week - 1]} Period {editingSlot.period_number}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Time: {editingSlot.start_time} - {editingSlot.end_time}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teacher *
                </label>
                <select
                  value={editSlot.teacher_id}
                  onChange={(e) => setEditSlot({ ...editSlot, teacher_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">-- Select Teacher --</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class *
                </label>
                <select
                  value={editSlot.class_id}
                  onChange={(e) => setEditSlot({ ...editSlot, class_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">-- Select Class --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.grade}{cls.section ? `-${cls.section}` : ''} ({cls.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  value={editSlot.subject_name}
                  onChange={(e) => setEditSlot({ ...editSlot, subject_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.name}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Number
                </label>
                {(() => {
                  const selectedClass = classes.find(c => c.id === editSlot.class_id);
                  const defaultRoom = selectedClass?.room_no;
                  const hasDefaultRoom = defaultRoom && defaultRoom.trim() !== '';
                  
                  return (
                    <>
                      <select
                        value={editSlot.room_number}
                        onChange={(e) => setEditSlot({ ...editSlot, room_number: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        disabled={hasDefaultRoom}
                      >
                        <option value="">-- Select Room --</option>
                        {rooms.map((room) => (
                          <option 
                            key={room} 
                            value={room}
                            disabled={hasDefaultRoom && room !== defaultRoom}
                          >
                            {room}
                          </option>
                        ))}
                      </select>
                      {hasDefaultRoom ? (
                        <p className="text-xs text-indigo-600 mt-1 font-medium">
                          ✓ Default room for this class: {defaultRoom} (locked)
                        </p>
                      ) : rooms.length === 0 ? (
                        <p className="text-xs text-gray-500 mt-1">
                          No rooms found. Please add room numbers to classes first.
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">
                          No default room set for this class
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingSlot(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSlot}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
              >
                {loading ? "Updating..." : "Update Slot"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Slot Modal - Step 2: Subject and Room */}
      {showAddModal && selectedCell && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Select Subject & Room - {days[selectedCell.day - 1]} Period {selectedCell.period}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Time: {timeSlots[selectedCell.period - 1]}
            </p>

            {/* Show selected Teacher and Class */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-indigo-700 font-medium">Teacher:</span>
                <span className="text-indigo-900">
                  {teachers.find(t => t.id === newSlot.teacher_id)?.first_name} {teachers.find(t => t.id === newSlot.teacher_id)?.last_name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm mt-1">
                <span className="text-indigo-700 font-medium">Class:</span>
                <span className="text-indigo-900">
                  {classes.find(c => c.id === newSlot.class_id)?.grade}
                  {classes.find(c => c.id === newSlot.class_id)?.section ? `-${classes.find(c => c.id === newSlot.class_id)?.section}` : ''} ({classes.find(c => c.id === newSlot.class_id)?.name})
                </span>
              </div>
            </div>

            <div className="space-y-4">
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Subject *
  </label>
  <select
    value={newSlot.subject_name}
    onChange={(e) => setNewSlot({ ...newSlot, subject_name: e.target.value })}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
    required
    autoFocus
  >
    <option value="">-- Select Subject --</option>
    {subjects.map((subject) => (
      <option key={subject.id} value={subject.name}>
        {subject.name}
      </option>
    ))}
  </select>
  {subjects.length === 0 && (
    <p className="text-xs text-gray-500 mt-1">
      No subjects found. Please add subjects in curriculum management first.
    </p>
  )}
</div>
             <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Room Number
  </label>
  {(() => {
    const selectedClass = classes.find(c => c.id === newSlot.class_id);
    const defaultRoom = selectedClass?.room_no;
    const hasDefaultRoom = defaultRoom && defaultRoom.trim() !== '';
    
    return (
      <>
        <select
          value={newSlot.room_number}
          onChange={(e) => setNewSlot({ ...newSlot, room_number: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          disabled={hasDefaultRoom}
        >
          <option value="">-- Select Room --</option>
          {rooms.map((room) => (
            <option 
              key={room} 
              value={room}
              disabled={hasDefaultRoom && room !== defaultRoom}
            >
              {room}
            </option>
          ))}
        </select>
        {hasDefaultRoom ? (
          <p className="text-xs text-indigo-600 mt-1 font-medium">
            ✓ Default room for this class: {defaultRoom} (locked)
          </p>
        ) : rooms.length === 0 ? (
          <p className="text-xs text-gray-500 mt-1">
            No rooms found. Please add room numbers to classes first.
          </p>
        ) : (
          <p className="text-xs text-gray-500 mt-1">
            No default room set for this class
          </p>
        )}
      </>
    );
  })()}
</div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowTeacherClassModal(true);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowTeacherClassModal(false);
                  setSelectedCell(null);
                  setNewSlot({
                    teacher_id: "",
                    class_id: "",
                    subject_name: "",
                    room_number: "",
                  });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSlot}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
              >
                {loading ? "Adding..." : "Add Slot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableBuilderEnhanced;
