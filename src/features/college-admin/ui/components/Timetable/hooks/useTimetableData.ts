import { useState, useEffect } from "react";
import { apiPost } from '@/shared/api/apiClient';
import { Faculty, CollegeClass, ScheduleSlot, Break, TimePeriod, Substitution, Department } from '@/features/learner-profile/model';
import { DEFAULT_PERIODS } from "../constants";

interface UseTimetableDataProps {
  collegeId: string | null;
}

export const useTimetableData = ({ collegeId }: UseTimetableDataProps) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [classes, setClasses] = useState<CollegeClass[]>([]);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [breaks, setBreaks] = useState<Break[]>([]);
  const [periods, setPeriods] = useState<TimePeriod[]>(DEFAULT_PERIODS);
  const [substitutions, setSubstitutions] = useState<Substitution[]>([]);
  const [timetableId, setTimetableId] = useState<string>("");
  const [publishStatus, setPublishStatus] = useState<"draft" | "published">("draft");
  const [loading, setLoading] = useState(false);

  const loadDepartments = async () => {
    if (!collegeId) return;
    try {
      const response = await apiPost('/college-admin/academic', {
        action: 'get-mapping-departments',
        college_id: collegeId,
      });
      if (response.data) setDepartments(response.data);
    } catch {}
  };

  const loadFaculty = async () => {
    if (!collegeId) return;
    try {
      const response = await apiPost('/college-admin/faculty', {
        action: 'get-faculty-with-departments',
        college_id: collegeId,
      });
      if (response.data) setFaculty(response.data);
    } catch {}
  };

  const loadClasses = async () => {
    if (!collegeId) return;
    try {
      const response = await apiPost('/college-admin/classes', {
        action: 'get-college-classes',
        college_id: collegeId,
      });
      if (response.data) setClasses(response.data);
    } catch {}
  };

  const loadFacultyClasses = async (facultyId: string): Promise<CollegeClass[]> => {
    if (!collegeId) return [];

    try {
      const response = await apiPost('/college-admin/classes', {
        action: 'get-faculty-classes',
        college_id: collegeId,
        faculty_id: facultyId,
      });
      return response.data || [];
    } catch {
      return classes;
    }
  };

  const loadOrCreateTimetable = async () => {
    if (!collegeId) return;

    try {
      const response = await apiPost('/college-admin/classes', {
        action: 'get-or-create-timetable',
        college_id: collegeId,
      });

      if (response.data) {
        setTimetableId(response.data.id);
        setPublishStatus(response.data.status);
      }
    } catch {}
  };

  const loadSlots = async () => {
    if (!timetableId) return;
    try {
      const response = await apiPost('/college-admin/classes', {
        action: 'get-timetable-slots',
        timetable_id: timetableId,
      });
      if (response.data) setSlots(response.data);
    } catch {}
  };

  const loadBreaks = async () => {
    if (!collegeId) return;
    try {
      const response = await apiPost('/college-admin/events', {
        action: 'get-breaks',
        college_id: collegeId,
      });
      if (response.data) setBreaks(response.data);
    } catch {}
  };

  const loadSubstitutions = async (startDate?: string, endDate?: string) => {
    if (!collegeId) return;

    try {
      const response = await apiPost('/college-admin/classes', {
        action: 'get-substitutions-with-details',
        college_id: collegeId,
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
      });

      if (response.data) setSubstitutions(response.data);
    } catch {}
  };

  const loadPeriods = async () => {
    if (!timetableId) return;
    try {
      const response = await apiPost('/college-admin/classes', {
        action: 'get-time-periods',
        timetable_id: timetableId,
      });
      if (response.data && response.data.length > 0) {
        setPeriods(response.data);
      }
    } catch {}
  };

  const savePeriods = async (newPeriods: TimePeriod[]) => {
    if (!timetableId || !collegeId) {
      throw new Error("Timetable not initialized");
    }

    setLoading(true);
    try {
      const response = await apiPost('/college-admin/classes', {
        action: 'save-time-periods',
        timetable_id: timetableId,
        college_id: collegeId,
        periods: newPeriods,
      });

      if (response.data) setPeriods(response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collegeId) {
      loadDepartments();
      loadFaculty();
      loadClasses();
      loadOrCreateTimetable();
      loadBreaks();
      loadSubstitutions();
    }
  }, [collegeId]);

  useEffect(() => {
    if (timetableId) {
      loadSlots();
      loadPeriods();
    }
  }, [timetableId]);

  return {
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
  };
};
