import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "../../../../../lib/supabaseClient";
import { CollegeEvent } from "../types";

export const useEvents = (collegeId: string | null) => {
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventRegCounts, setEventRegCounts] = useState<Record<string, number>>({});
  const [draggedEvent, setDraggedEvent] = useState<CollegeEvent | null>(null);

  // Load events
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from("college_events").select("*").order("start_date", { ascending: true });
      if (collegeId) query = query.eq("college_id", collegeId);
      const { data, error } = await query;
      if (error) throw error;
      setEvents(data || []);
    } catch { toast.error("Failed to load events"); }
    finally { setLoading(false); }
  }, [collegeId]);

  // Load registration counts
  const loadRegistrationCounts = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("college_event_registrations").select("event_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((r) => { counts[r.event_id] = (counts[r.event_id] || 0) + 1; });
      setEventRegCounts(counts);
    } catch { console.error("Failed to load registration counts"); }
  }, []);

  useEffect(() => {
    loadEvents();
    loadRegistrationCounts();
  }, [collegeId, loadEvents, loadRegistrationCounts]);

  // CRUD operations
  const saveEvent = async (data: Partial<CollegeEvent>, existingEvent?: CollegeEvent | null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get college_id from organizations table if not already set
      let eventCollegeId = collegeId;
      if (!eventCollegeId && user) {
        const { data: org } = await supabase.from("organizations").select("id").eq("organization_type", "college").or(`admin_id.eq.${user.id},email.eq.${user.email}`).maybeSingle();
        if (org?.id) eventCollegeId = org.id;
      }
      
      if (existingEvent) {
        const { error } = await supabase.from("college_events").update({ ...data, college_id: eventCollegeId, updated_at: new Date().toISOString() }).eq("id", existingEvent.id);
        if (error) throw error;
        toast.success("Event updated");
      } else {
        if (!eventCollegeId) { toast.error("College not found"); return false; }
        const { error } = await supabase.from("college_events").insert({ ...data, college_id: eventCollegeId, created_by: user?.id });
        if (error) throw error;
        toast.success("Event created");
      }
      loadEvents();
      return true;
    } catch { toast.error("Failed to save"); return false; }
  };


  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase.from("college_events").delete().eq("id", id);
      if (error) throw error;
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success("Event deleted");
      return true;
    } catch { 
      toast.error("Failed to delete"); 
      return false;
    }
  };

  const publishEvent = async (id: string) => {
    try {
      const { error } = await supabase.from("college_events").update({ status: "published" }).eq("id", id);
      if (error) throw error;
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: "published" as const } : e)));
      toast.success("Published");
    } catch { toast.error("Failed"); }
  };

  const cancelEvent = async (id: string) => {
    try {
      const { error } = await supabase.from("college_events").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: "cancelled" as const } : e)));
      toast.success("Cancelled");
      return true;
    } catch { 
      toast.error("Failed"); 
      return false;
    }
  };

  // Drag and drop
  const handleDragStart = useCallback((event: CollegeEvent) => { setDraggedEvent(event); }, []);
  
  const handleDrop = useCallback(async (targetDate: Date) => {
    if (!draggedEvent) return;
    try {
      const startDate = new Date(draggedEvent.start_date);
      const endDate = new Date(draggedEvent.end_date);
      const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const newStart = new Date(targetDate);
      newStart.setHours(startDate.getHours(), startDate.getMinutes());
      const newEnd = new Date(targetDate);
      newEnd.setDate(newEnd.getDate() + daysDiff);
      newEnd.setHours(endDate.getHours(), endDate.getMinutes());

      const { error } = await supabase.from("college_events").update({
        start_date: newStart.toISOString(),
        end_date: newEnd.toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", draggedEvent.id);
      
      if (error) throw error;
      toast.success("Event rescheduled");
      loadEvents();
    } catch { toast.error("Failed to reschedule"); }
    finally { setDraggedEvent(null); }
  }, [draggedEvent, loadEvents]);

  // Computed values
  const todayEvents = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return events.filter((e) => e.start_date.split("T")[0] <= today && e.end_date.split("T")[0] >= today && e.status === "published");
  }, [events]);

  const stats = useMemo(() => ({
    total: events.length,
    upcoming: events.filter((e) => new Date(e.start_date) > new Date() && e.status === "published").length,
    completed: events.filter((e) => e.status === "completed").length,
    today: todayEvents.length,
  }), [events, todayEvents]);

  return {
    events, loading, eventRegCounts, draggedEvent, todayEvents, stats,
    loadEvents, loadRegistrationCounts, saveEvent, deleteEvent, publishEvent, cancelEvent,
    handleDragStart, handleDrop,
  };
};
