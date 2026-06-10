import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { apiPost } from '@/shared/api/apiClient';
import { useAuthStore } from '@/shared/model/authStore';
import { getLogger } from '@/shared/config/logging';
import { CollegeEvent } from '@/features/learner-profile/model';
import { collegeEventsService, organizationsService } from "@/features/college-admin";

const logger = getLogger('college-admin:useEvents');

export const useEvents = (collegeId: string | null) => {
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventRegCounts, setEventRegCounts] = useState<Record<string, number>>({});
  const [draggedEvent, setDraggedEvent] = useState<CollegeEvent | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await collegeEventsService.getCollegeEvents(collegeId || undefined);
      setEvents(data || []);
    } catch { toast.error("Failed to load events"); }
    finally { setLoading(false); }
  }, [collegeId]);

  const loadRegistrationCounts = useCallback(async () => {
    try {
      if (!collegeId) {
        setEventRegCounts({});
        return;
      }

      const response = await apiPost('/college-admin/events', {
        action: 'get-event-registration-counts',
        college_id: collegeId,
      });

      setEventRegCounts(response.data || {});
    } catch { 
      logger.error('Failed to load registration counts', new Error('Failed to load registration counts'));
      toast.error("Failed to load registration counts"); 
    }
  }, [collegeId]);

  useEffect(() => {
    loadEvents();
    loadRegistrationCounts();
  }, [collegeId, loadEvents, loadRegistrationCounts]);

  const saveEvent = async (data: Partial<CollegeEvent>, existingEvent?: CollegeEvent | null) => {
    try {
      if (data.start_date || data.end_date) {
        const now = new Date();
        const currentDateTime = now.toISOString();
        
        if (data.start_date && data.start_date < currentDateTime) {
          toast.error("Start date and time cannot be in the past");
          return false;
        }
        
        if (data.end_date && data.end_date < currentDateTime) {
          toast.error("End date and time cannot be in the past");
          return false;
        }
        
        if (data.start_date && data.end_date && data.end_date <= data.start_date) {
          toast.error("End date must be after start date");
          return false;
        }
      }

      const user = useAuthStore.getState().user;
      
      let eventCollegeId = collegeId;
      if (!eventCollegeId && user) {
        const org = await organizationsService.getCollegeOrganization(user.id, user.email || '');
        if (org?.id) eventCollegeId = org.id;
      }
      
      if (existingEvent) {
        await collegeEventsService.updateCollegeEvent(existingEvent.id, { ...data, college_id: eventCollegeId, updated_at: new Date().toISOString() });
        toast.success("Event updated");
      } else {
        if (!eventCollegeId) { toast.error("College not found"); return false; }
        await collegeEventsService.createCollegeEvent(data, eventCollegeId, user?.id);
        toast.success("Event created");
      }
      loadEvents();
      return true;
    } catch { toast.error("Failed to save"); return false; }
  };


  const deleteEvent = async (id: string) => {
    try {
      await collegeEventsService.deleteCollegeEvent(id);
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
      await collegeEventsService.publishCollegeEvent(id);
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: "published" as const } : e)));
      toast.success("Published");
    } catch { toast.error("Failed"); }
  };

  const cancelEvent = async (id: string) => {
    try {
      await collegeEventsService.cancelCollegeEvent(id);
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: "cancelled" as const } : e)));
      toast.success("Cancelled");
      return true;
    } catch { 
      toast.error("Failed"); 
      return false;
    }
  };

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

      await collegeEventsService.rescheduleCollegeEvent(
        draggedEvent.id,
        newStart.toISOString(),
        newEnd.toISOString()
      );
      
      toast.success("Event rescheduled");
      loadEvents();
    } catch { toast.error("Failed to reschedule"); }
    finally { setDraggedEvent(null); }
  }, [draggedEvent, loadEvents]);

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
