import { useState, useCallback } from "react";
import { supabase } from '@/shared/api/supabaseClient';
import toast from "react-hot-toast";
import { EventRegistration, CollegeEvent } from '@/features/learner-profile/model';
import { collegeEventRegistrationsService } from "@/features/college-admin";

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
      
      // Then fetch learner details separately to avoid 406 errors
      const learnerIds = [...new Set((regs || []).map(r => r.learner_id))];
      let learnerMap: Record<string, { name: string; email: string }> = {};
      
      if (learnerIds.length > 0) {
        const { data: learners } = await supabase
          .from("learners")
          .select("id, name, email")
          .in("id", learnerIds);
        learnerMap = (learners || []).reduce((acc, s) => ({ ...acc, [s.id]: s }), {});
      }
      
      // Combine data
      const combined = (regs || []).map(r => ({
        ...r,
        learner: learnerMap[r.learner_id] || null
      }));
      setRegistrations(combined);
    } catch { toast.error("Failed to load registrations"); }
    finally { setLoading(false); }
  }, []);

  const addRegistration = async (eventId: string, learnerId: string) => {
    try {
      await collegeEventRegistrationsService.createRegistration(eventId, learnerId);
      toast.success("Registered");
      loadRegistrations(eventId);
      onCountsChange();
    } catch (error: unknown) {
      const err = error as { code?: string };
      toast.error(err.code === "23505" ? "Already registered" : "Failed");
    }
  };

  const removeRegistration = async (regId: string, _eventId: string) => {
    try {
      await collegeEventRegistrationsService.deleteRegistration(regId);
      setRegistrations((prev) => prev.filter((r) => r.id !== regId));
      onCountsChange();
      toast.success("Removed");
      return true;
    } catch { 
      toast.error("Failed"); 
      return false;
    }
  };


  const markAttendance = async (regId: string, attended: boolean) => {
    try {
      await collegeEventRegistrationsService.updateAttendance(regId, attended);
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
      r.learner?.name || "",
      r.learner?.email || "",
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
