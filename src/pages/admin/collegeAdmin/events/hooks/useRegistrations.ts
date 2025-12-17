import { useState, useCallback } from "react";
import { supabase } from "../../../../../lib/supabaseClient";
import toast from "react-hot-toast";
import { EventRegistration, CollegeEvent } from "../types";

export const useRegistrations = (onCountsChange: () => void) => {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRegistrations = useCallback(async (eventId: string) => {
    try {
      setLoading(true);
      // First get registrations
      const { data: regs, error: regError } = await supabase
        .from("college_event_registrations")
        .select("*")
        .eq("event_id", eventId)
        .order("registered_at", { ascending: false });
      if (regError) throw regError;
      
      // Then fetch student details separately to avoid 406 errors
      const studentIds = [...new Set((regs || []).map(r => r.student_id))];
      let studentMap: Record<string, { name: string; email: string }> = {};
      
      if (studentIds.length > 0) {
        const { data: students } = await supabase
          .from("students")
          .select("id, name, email")
          .in("id", studentIds);
        studentMap = (students || []).reduce((acc, s) => ({ ...acc, [s.id]: s }), {});
      }
      
      // Combine data
      const combined = (regs || []).map(r => ({
        ...r,
        student: studentMap[r.student_id] || null
      }));
      setRegistrations(combined);
    } catch { toast.error("Failed to load registrations"); }
    finally { setLoading(false); }
  }, []);

  const addRegistration = async (eventId: string, studentId: string) => {
    try {
      const { error } = await supabase.from("college_event_registrations").insert({ event_id: eventId, student_id: studentId });
      if (error) throw error;
      toast.success("Registered");
      loadRegistrations(eventId);
      onCountsChange();
    } catch (error: unknown) {
      const err = error as { code?: string };
      toast.error(err.code === "23505" ? "Already registered" : "Failed");
    }
  };

  const removeRegistration = async (regId: string, _eventId: string) => {
    if (!confirm("Remove registration?")) return;
    try {
      const { error } = await supabase.from("college_event_registrations").delete().eq("id", regId);
      if (error) throw error;
      setRegistrations((prev) => prev.filter((r) => r.id !== regId));
      onCountsChange();
      toast.success("Removed");
    } catch { toast.error("Failed"); }
  };


  const markAttendance = async (regId: string, attended: boolean) => {
    try {
      const { error } = await supabase.from("college_event_registrations").update({ attended }).eq("id", regId);
      if (error) throw error;
      setRegistrations((prev) => prev.map((r) => (r.id === regId ? { ...r, attended } : r)));
      toast.success(attended ? "Marked attended" : "Unmarked");
    } catch { toast.error("Failed"); }
  };

  const exportAttendeesCSV = useCallback((event: CollegeEvent) => {
    if (registrations.length === 0) {
      toast.error("No registrations to export");
      return;
    }
    const headers = ["Name", "Email", "Registered Date", "Attended"];
    const rows = registrations.map((r) => [
      r.student?.name || "",
      r.student?.email || "",
      new Date(r.registered_at).toLocaleDateString(),
      r.attended ? "Yes" : "No",
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, "_")}_attendees.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported successfully");
  }, [registrations]);

  return {
    registrations, loading,
    loadRegistrations, addRegistration, removeRegistration, markAttendance, exportAttendeesCSV,
  };
};
