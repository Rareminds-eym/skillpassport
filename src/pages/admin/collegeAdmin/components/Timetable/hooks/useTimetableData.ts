import { useState, useEffect } from "react";
import { supabase } from "../../../../../../lib/supabaseClient";
import { Faculty, CollegeClass, ScheduleSlot, Break, TimePeriod, Substitution } from "../types";
import { DEFAULT_PERIODS } from "../constants";

interface UseTimetableDataProps {
  collegeId: string | null;
}

export const useTimetableData = ({ collegeId }: UseTimetableDataProps) => {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [classes, setClasses] = useState<CollegeClass[]>([]);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [breaks, setBreaks] = useState<Break[]>([]);
  const [periods, setPeriods] = useState<TimePeriod[]>(DEFAULT_PERIODS);
  const [substitutions, setSubstitutions] = useState<Substitution[]>([]);
  const [timetableId, setTimetableId] = useState<string>("");
  const [publishStatus, setPublishStatus] = useState<"draft" | "published">("draft");
  const [loading, setLoading] = useState(false);

  const loadFaculty = async () => {
    if (!collegeId) return;
    const { data } = await supabase
      .from("college_lecturers")
      .select("id, first_name, last_name, employeeId, subject_expertise")
      .eq("collegeId", collegeId)
      .eq("accountStatus", "active")
      .order("first_name");
    if (data) setFaculty(data);
  };

  const loadClasses = async () => {
    if (!collegeId) return;
    const { data } = await supabase
      .from("college_classes")
      .select("id, name, grade, section")
      .eq("college_id", collegeId)
      .eq("status", "active")
      .order("grade");
    if (data) setClasses(data);
  };

  const loadFacultyClasses = async (facultyId: string): Promise<CollegeClass[]> => {
    if (!collegeId) return [];
    
    // First try to get from faculty_class_assignments table
    const { data: assignments } = await supabase
      .from("college_faculty_class_assignments")
      .select("class_id, college_classes(id, name, grade, section)")
      .eq("faculty_id", facultyId)
      .eq("college_id", collegeId);

    if (assignments && assignments.length > 0) {
      const assignedClasses = assignments
        .map((a: any) => a.college_classes)
        .filter(Boolean);
      return assignedClasses;
    }

    // Fallback: Get distinct classes from existing timetable slots
    if (timetableId) {
      const { data: slotClasses } = await supabase
        .from("college_timetable_slots")
        .select("class_id")
        .eq("educator_id", facultyId)
        .eq("timetable_id", timetableId);

      if (slotClasses && slotClasses.length > 0) {
        const classIds = [...new Set(slotClasses.map((s: { class_id: string }) => s.class_id))];
        const { data: classDetails } = await supabase
          .from("college_classes")
          .select("id, name, grade, section")
          .in("id", classIds)
          .eq("status", "active");

        if (classDetails) return classDetails;
      }
    }

    // No assignments yet - return all classes
    return classes;
  };

  const loadOrCreateTimetable = async () => {
    if (!collegeId) return;
    
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;

    const { data: existing, error } = await supabase
      .from("college_timetables")
      .select("id, status")
      .eq("academic_year", academicYear)
      .eq("college_id", collegeId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      setTimetableId(existing.id);
      setPublishStatus(existing.status);
    } else if (!error) {
      const { data: newTimetable, error: insertError } = await supabase
        .from("college_timetables")
        .insert({
          college_id: collegeId,
          academic_year: academicYear,
          term: "Term 1",
          start_date: `${currentYear}-06-01`,
          end_date: `${currentYear + 1}-05-31`,
          status: "draft",
        })
        .select("id")
        .single();

      if (newTimetable && !insertError) {
        setTimetableId(newTimetable.id);
      } else if (insertError?.code === "23505") {
        const { data: retryData } = await supabase
          .from("college_timetables")
          .select("id, status")
          .eq("academic_year", academicYear)
          .eq("college_id", collegeId)
          .limit(1)
          .single();
        if (retryData) {
          setTimetableId(retryData.id);
          setPublishStatus(retryData.status);
        }
      }
    }
  };

  const loadSlots = async () => {
    if (!timetableId) return;
    const { data } = await supabase
      .from("college_timetable_slots")
      .select("*")
      .eq("timetable_id", timetableId)
      .order("day_of_week")
      .order("period_number");
    if (data) setSlots(data);
  };

  const loadBreaks = async () => {
    if (!collegeId) return;
    const { data } = await supabase
      .from("college_breaks")
      .select("*")
      .eq("college_id", collegeId)
      .order("start_date");
    if (data) setBreaks(data);
  };

  const loadSubstitutions = async (startDate?: string, endDate?: string) => {
    if (!collegeId) return;
    
    let query = supabase
      .from("college_faculty_substitutions")
      .select(`
        id,
        substitution_date,
        period_number,
        class_id,
        subject_name,
        original_faculty_id,
        substitute_faculty_id,
        status,
        original:college_lecturers!original_faculty_id(first_name, last_name),
        substitute:college_lecturers!substitute_faculty_id(first_name, last_name)
      `)
      .eq("college_id", collegeId)
      .in("status", ["assigned", "confirmed"]);

    // Filter by date range if provided
    if (startDate) {
      query = query.gte("substitution_date", startDate);
    }
    if (endDate) {
      query = query.lte("substitution_date", endDate);
    }

    const { data } = await query.order("substitution_date");
    
    if (data) {
      const processed: Substitution[] = data.map((s: any) => ({
        id: s.id,
        substitution_date: s.substitution_date,
        period_number: s.period_number,
        class_id: s.class_id,
        subject_name: s.subject_name,
        original_faculty_id: s.original_faculty_id,
        original_faculty_name: s.original ? `${s.original.first_name || ''} ${s.original.last_name || ''}`.trim() : '',
        substitute_faculty_id: s.substitute_faculty_id,
        substitute_faculty_name: s.substitute ? `${s.substitute.first_name || ''} ${s.substitute.last_name || ''}`.trim() : null,
        status: s.status,
      }));
      setSubstitutions(processed);
    }
  };

  const loadPeriods = async () => {
    if (!timetableId) return;
    const { data } = await supabase
      .from("college_time_periods")
      .select("*")
      .eq("timetable_id", timetableId)
      .order("period_number");
    if (data && data.length > 0) {
      setPeriods(data);
    }
  };

  const savePeriods = async (newPeriods: TimePeriod[]) => {
    if (!timetableId || !collegeId) {
      throw new Error("Timetable not initialized");
    }

    setLoading(true);
    try {
      // Delete existing periods for this timetable
      await supabase
        .from("college_time_periods")
        .delete()
        .eq("timetable_id", timetableId);

      // Insert new periods
      const periodsToInsert = newPeriods.map((p, index) => ({
        timetable_id: timetableId,
        college_id: collegeId,
        period_number: index + 1,
        period_name: p.period_name,
        start_time: p.start_time,
        end_time: p.end_time,
        is_break: p.is_break,
        break_type: p.break_type || null,
      }));

      const { error } = await supabase
        .from("college_time_periods")
        .insert(periodsToInsert);

      if (error) throw error;

      // Reload periods from database
      await loadPeriods();
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    if (collegeId) {
      loadFaculty();
      loadClasses();
      loadOrCreateTimetable();
      loadBreaks();
      loadSubstitutions();
    }
  }, [collegeId]);

  // Load slots and periods when timetableId changes
  useEffect(() => {
    if (timetableId) {
      loadSlots();
      loadPeriods();
    }
  }, [timetableId]);

  return {
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
  };
};
