import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../../../../../lib/supabaseClient";

// Types
import { CollegeClass, ScheduleSlot, Break, TimePeriod, SlotFormData, BreakFormData, SelectedCell } from "./types";

// Constants
import { DAYS } from "./constants";

// Hooks
import { useTimetableData } from "./hooks/useTimetableData";

// Utils
import { getWeekStart, getWeekDates, getSlotForCell, checkDateOverlap } from "./utils";

// Components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import CalendarGrid from "./components/CalendarGrid";
import SlotModal from "./components/modals/SlotModal";
import BreakModal from "./components/modals/BreakModal";
import PeriodsModal from "./components/modals/PeriodsModal";
import ExportModal from "./components/modals/ExportModal";

interface CalendarTimetableProps {
  collegeId: string | null;
}

const CalendarTimetable: React.FC<CalendarTimetableProps> = ({ collegeId }) => {
  // Data hook
  const {
    departments,
    faculty,
    classes,
    slots,
    breaks,
    periods,
    substitutions,
    timetableId,
    publishStatus,
    loading,
    setLoading,
    setPublishStatus,
    loadSlots,
    loadBreaks,
    loadSubstitutions,
    loadFacultyClasses,
    savePeriods,
  } = useTimetableData({ collegeId });

  // Week navigation state
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getWeekStart());

  // Filters
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>("");
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState<string>("");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("");
  const [facultyClasses, setFacultyClasses] = useState<CollegeClass[]>([]);

  // Modals
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [showPeriodsModal, setShowPeriodsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);

  // Form states
  const [slotForm, setSlotForm] = useState<SlotFormData>({
    faculty_id: "",
    subject_name: "",
    room_number: "",
    is_recurring: true,
  });

  const [breakForm, setBreakForm] = useState<BreakFormData>({
    break_type: "holiday",
    name: "",
    start_date: "",
    end_date: "",
    is_recurring: false,
  });

  const [overlapWarning, setOverlapWarning] = useState<string>("");
  const [editingBreakId, setEditingBreakId] = useState<string | null>(null);

  // Week dates
  const weekDates = useMemo(() => getWeekDates(currentWeekStart, DAYS), [currentWeekStart]);

  // Reload substitutions when week changes
  useEffect(() => {
    if (collegeId && weekDates.length > 0) {
      const startDate = weekDates[0].toISOString().split('T')[0];
      const endDate = weekDates[weekDates.length - 1].toISOString().split('T')[0];
      loadSubstitutions(startDate, endDate);
    }
  }, [currentWeekStart, collegeId]);

  // Load faculty classes when filter changes
  useEffect(() => {
    if (selectedFacultyFilter && collegeId) {
      loadFacultyClasses(selectedFacultyFilter).then(setFacultyClasses);
    } else {
      setFacultyClasses([]);
      setSelectedClassFilter("");
    }
  }, [selectedFacultyFilter, collegeId]);

  // Navigation handlers
  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    setCurrentWeekStart(getWeekStart());
  };

  // Cell click handler
  const handleCellClick = (dayIndex: number, period: TimePeriod, date: Date) => {
    if (period.is_break) return;

    const existingSlot = getSlotForCell(
      dayIndex,
      period.period_number,
      date,
      slots,
      selectedClassFilter,
      selectedFacultyFilter
    );

    const slotMatchesFilters =
      existingSlot &&
      (!selectedFacultyFilter || existingSlot.educator_id === selectedFacultyFilter) &&
      (!selectedClassFilter || existingSlot.class_id === selectedClassFilter);

    if (existingSlot && slotMatchesFilters) {
      setEditingSlot(existingSlot);
      setSlotForm({
        faculty_id: existingSlot.educator_id,
        subject_name: existingSlot.subject_name,
        room_number: existingSlot.room_number,
        is_recurring: existingSlot.is_recurring,
      });
    } else {
      setEditingSlot(null);
      setSlotForm({
        faculty_id: selectedFacultyFilter || "",
        subject_name: "",
        room_number: "",
        is_recurring: true,
      });
    }
    setSelectedCell({ day: dayIndex, period });
    setShowAddSlotModal(true);
  };

  // Save slot
  const handleSaveSlot = async () => {
    const classId = editingSlot?.class_id || selectedClassFilter;

    if (!selectedCell || !slotForm.faculty_id || !classId || !slotForm.subject_name) {
      alert("Please fill all required fields. Make sure a class is selected in the filter.");
      return;
    }

    setLoading(true);
    try {
      const slotData = {
        timetable_id: timetableId,
        educator_id: slotForm.faculty_id,
        class_id: classId,
        day_of_week: selectedCell.day + 1,
        period_number: selectedCell.period.period_number,
        start_time: selectedCell.period.start_time,
        end_time: selectedCell.period.end_time,
        subject_name: slotForm.subject_name,
        room_number: slotForm.room_number || `R${selectedCell.period.period_number}`,
        is_recurring: slotForm.is_recurring,
        schedule_date: slotForm.is_recurring
          ? null
          : weekDates[selectedCell.day].toISOString().split("T")[0],
      };

      if (editingSlot?.id) {
        await supabase.from("college_timetable_slots").update(slotData).eq("id", editingSlot.id);
      } else {
        await supabase.from("college_timetable_slots").insert(slotData);
      }

      await loadSlots();
      setShowAddSlotModal(false);
      setSelectedCell(null);
      setEditingSlot(null);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete slot
  const handleDeleteSlot = async () => {
    if (!editingSlot?.id || !confirm("Delete this schedule?")) return;

    setLoading(true);
    try {
      await supabase.from("college_timetable_slots").delete().eq("id", editingSlot.id);
      await loadSlots();
      setShowAddSlotModal(false);
      setEditingSlot(null);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Break handlers
  const handleAddBreak = () => {
    setEditingBreakId(null);
    setBreakForm({
      break_type: "holiday",
      name: "",
      start_date: "",
      end_date: "",
      is_recurring: false,
    });
    setOverlapWarning("");
    setShowBreakModal(true);
  };

  const handleEditBreak = (breakItem: Break) => {
    setEditingBreakId(breakItem.id || null);
    setBreakForm({
      break_type: breakItem.break_type,
      name: breakItem.name,
      start_date: breakItem.start_date || "",
      end_date: breakItem.end_date || "",
      description: breakItem.description || "",
      is_recurring: breakItem.is_recurring,
    });
    setOverlapWarning("");
    setShowBreakModal(true);
  };

  const handleSaveBreak = async () => {
    if (!breakForm.name || !breakForm.break_type) {
      alert("Please fill required fields");
      return;
    }

    if (overlapWarning) {
      alert("Cannot save: " + overlapWarning);
      return;
    }

    setLoading(true);
    try {
      if (editingBreakId) {
        await supabase
          .from("college_breaks")
          .update({
            break_type: breakForm.break_type,
            name: breakForm.name,
            start_date: breakForm.start_date,
            end_date: breakForm.end_date,
            description: breakForm.description,
            is_recurring: breakForm.is_recurring,
          })
          .eq("id", editingBreakId);
      } else {
        await supabase.from("college_breaks").insert({
          college_id: collegeId,
          timetable_id: timetableId,
          ...breakForm,
        });
      }
      await loadBreaks();
      setShowBreakModal(false);
      setBreakForm({
        break_type: "holiday",
        name: "",
        start_date: "",
        end_date: "",
        is_recurring: false,
      });
      setOverlapWarning("");
      setEditingBreakId(null);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBreak = async (breakId: string) => {
    if (!confirm("Delete this break/holiday?")) return;
    await supabase.from("college_breaks").delete().eq("id", breakId);
    await loadBreaks();
  };

  const handleDateOverlapCheck = (startDate: string, endDate: string) => {
    const warning = checkDateOverlap(startDate, endDate, breaks, editingBreakId);
    setOverlapWarning(warning);
  };

  // Publish timetable
  const publishTimetable = async () => {
    if (!confirm("Publish this timetable? It will be visible to all faculty.")) return;

    setLoading(true);
    try {
      await supabase.from("college_timetables").update({ status: "published" }).eq("id", timetableId);
      setPublishStatus("published");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Sidebar */}
      <Sidebar
        departments={departments}
        faculty={faculty}
        classes={classes}
        facultyClasses={facultyClasses}
        breaks={breaks}
        selectedDepartmentFilter={selectedDepartmentFilter}
        selectedFacultyFilter={selectedFacultyFilter}
        selectedClassFilter={selectedClassFilter}
        onDepartmentFilterChange={(value) => {
          setSelectedDepartmentFilter(value);
          // Reset faculty and class filters when department changes
          setSelectedFacultyFilter("");
          setSelectedClassFilter("");
          setFacultyClasses([]);
        }}
        onFacultyFilterChange={setSelectedFacultyFilter}
        onClassFilterChange={setSelectedClassFilter}
        onAddBreak={handleAddBreak}
        onEditBreak={handleEditBreak}
        onDeleteBreak={handleDeleteBreak}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          publishStatus={publishStatus}
          weekDates={weekDates}
          loading={loading}
          onNavigateWeek={navigateWeek}
          onGoToToday={goToToday}
          onOpenPeriodsModal={() => setShowPeriodsModal(true)}
          onOpenExportModal={() => setShowExportModal(true)}
          onPublish={publishTimetable}
        />

        <CalendarGrid
          weekDates={weekDates}
          periods={periods}
          slots={slots}
          breaks={breaks}
          substitutions={substitutions}
          faculty={faculty}
          classes={classes}
          selectedFacultyFilter={selectedFacultyFilter}
          selectedClassFilter={selectedClassFilter}
          onCellClick={handleCellClick}
        />
      </div>

      {/* Modals */}
      <SlotModal
        isOpen={showAddSlotModal}
        selectedCell={selectedCell}
        weekDates={weekDates}
        editingSlot={editingSlot}
        slotForm={slotForm}
        faculty={faculty}
        classes={classes}
        slots={slots}
        selectedClassFilter={selectedClassFilter}
        loading={loading}
        onClose={() => {
          setShowAddSlotModal(false);
          setEditingSlot(null);
        }}
        onSave={handleSaveSlot}
        onDelete={handleDeleteSlot}
        onFormChange={setSlotForm}
      />

      <BreakModal
        isOpen={showBreakModal}
        editingBreakId={editingBreakId}
        breakForm={breakForm}
        overlapWarning={overlapWarning}
        loading={loading}
        onClose={() => {
          setShowBreakModal(false);
          setEditingBreakId(null);
          setOverlapWarning("");
        }}
        onSave={handleSaveBreak}
        onFormChange={setBreakForm}
        onDateChange={handleDateOverlapCheck}
      />

      <PeriodsModal
        isOpen={showPeriodsModal}
        periods={periods}
        loading={loading}
        onClose={() => setShowPeriodsModal(false)}
        onSave={async (newPeriods) => {
          try {
            await savePeriods(newPeriods);
            setShowPeriodsModal(false);
          } catch (error: any) {
            alert(error.message || "Failed to save periods");
          }
        }}
      />

      <ExportModal
        isOpen={showExportModal}
        weekDates={weekDates}
        periods={periods}
        slots={slots}
        breaks={breaks}
        faculty={faculty}
        classes={classes}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
};

export default CalendarTimetable;
