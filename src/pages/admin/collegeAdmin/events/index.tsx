import { CalendarIcon, ChartBarIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { AnalyticsTab } from "./components/AnalyticsTab";
import { CalendarTab } from "./components/CalendarTab";
import { ConfirmModal } from "./components/ConfirmModal";
import { EventFormModal } from "./components/EventFormModal";
import { EventStatsCards } from "./components/EventStatsCards";
import { EventsTab } from "./components/EventsTab";
import { RegistrationsTab } from "./components/RegistrationsTab";
import { TodayEventsWidget } from "./components/TodayEventsWidget";
import { useCalendar } from "./hooks/useCalendar";
import { useEventAnalytics } from "./hooks/useEventAnalytics";
import { useEvents } from "./hooks/useEvents";
import { useRegistrations } from "./hooks/useRegistrations";
import { CollegeEvent } from "./types";

const tabs = [
  { id: "events", label: "Event Scheduling", icon: CalendarIcon },
  { id: "calendar", label: "Event Calendar", icon: CalendarIcon },
  { id: "registrations", label: "Registrations", icon: ClipboardDocumentListIcon },
  { id: "analytics", label: "Analytics", icon: ChartBarIcon },
];

const EventManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState("events");
  const [collegeId, setCollegeId] = useState<string | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CollegeEvent | null>(null);
  const [quickAddDate, setQuickAddDate] = useState<Date | null>(null);
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<CollegeEvent | null>(null);
  const [selectedEventForReg, setSelectedEventForReg] = useState<CollegeEvent | null>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Fetch college ID from organizations table
  useEffect(() => {
    const fetchCollegeId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // First check organizations table for college admin
          const { data: org } = await supabase.from("organizations").select("id").eq("organization_type", "college").or(`admin_id.eq.${user.id},email.eq.${user.email}`).maybeSingle();
          if (org?.id) { setCollegeId(org.id); return; }
          // Check college_lecturers table
          const { data: lecturer } = await supabase.from("college_lecturers").select("collegeId").or(`userId.eq.${user.id},user_id.eq.${user.id}`).single();
          if (lecturer?.collegeId) { setCollegeId(lecturer.collegeId); return; }
          // Check user metadata
          if (user.user_metadata?.college_id) setCollegeId(user.user_metadata.college_id);
        }
      } catch (error) { console.error("Error fetching college ID:", error); }
    };
    fetchCollegeId();
  }, []);

  // Hooks
  const eventsHook = useEvents(collegeId);
  const calendarHook = useCalendar(eventsHook.events);
  const registrationsHook = useRegistrations(eventsHook.loadRegistrationCounts);
  const analytics = useEventAnalytics(eventsHook.events, eventsHook.eventRegCounts);


  // Event handlers
  const handleCreateEvent = () => { setSelectedEvent(null); setQuickAddDate(null); setIsEventModalOpen(true); };
  const handleQuickAdd = (date: Date) => { setSelectedEvent(null); setQuickAddDate(date); setIsEventModalOpen(true); };
  const handleEditEvent = (event: CollegeEvent) => { setSelectedEvent(event); setQuickAddDate(null); setIsEventModalOpen(true); };
  const handleSaveEvent = async (data: Partial<CollegeEvent>) => {
    const success = await eventsHook.saveEvent(data, selectedEvent);
    if (success) setIsEventModalOpen(false);
    return success;
  };

  const handleTodayEventClick = (event: CollegeEvent) => {
    setSelectedCalendarEvent(event);
    setActiveTab("calendar");
  };

  const handleSelectEventForReg = (event: CollegeEvent) => {
    setSelectedEventForReg(event);
    registrationsHook.loadRegistrations(event.id);
  };

  // Confirmation handlers
  const handleDeleteEvent = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Event",
      message: "Are you sure you want to delete this event? This action cannot be undone.",
      variant: "danger",
      onConfirm: () => eventsHook.deleteEvent(id),
    });
  };

  const handleCancelEvent = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Cancel Event",
      message: "Are you sure you want to cancel this event? Registered students will be notified.",
      variant: "warning",
      onConfirm: () => eventsHook.cancelEvent(id),
    });
  };

  const handleRemoveRegistration = (regId: string, eventId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Remove Registration",
      message: "Are you sure you want to remove this student's registration?",
      variant: "warning",
      onConfirm: () => registrationsHook.removeRegistration(regId, eventId),
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Event Management</h1>
        <p className="text-gray-600 text-sm sm:text-base">Schedule events, view calendar, and track registrations</p>
      </div>

      {/* Today's Events Widget */}
      <TodayEventsWidget events={eventsHook.todayEvents} onEventClick={handleTodayEventClick} />

      {/* Stats */}
      <EventStatsCards {...eventsHook.stats} />

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${activeTab === tab.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              <tab.icon className="h-4 w-4" />{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "events" && (
        <EventsTab
          events={eventsHook.events}
          loading={eventsHook.loading}
          eventRegCounts={eventsHook.eventRegCounts}
          onRefresh={eventsHook.loadEvents}
          onCreate={handleCreateEvent}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
          onPublish={eventsHook.publishEvent}
          onCancel={handleCancelEvent}
        />
      )}

      {activeTab === "calendar" && (
        <CalendarTab
          calendarDate={calendarHook.calendarDate}
          calendarView={calendarHook.calendarView}
          setCalendarView={calendarHook.setCalendarView}
          weeks={calendarHook.getCalendarWeeks}
          weekDays={calendarHook.getWeekDays}
          getWeekEvents={calendarHook.getWeekEvents}
          eventRegCounts={eventsHook.eventRegCounts}
          selectedEvent={selectedCalendarEvent}
          onSelectEvent={setSelectedCalendarEvent}
          onQuickAdd={handleQuickAdd}
          onEditEvent={handleEditEvent}
          onDragStart={eventsHook.handleDragStart}
          onDrop={eventsHook.handleDrop}
          draggedEvent={eventsHook.draggedEvent}
          prevMonth={calendarHook.prevMonth}
          nextMonth={calendarHook.nextMonth}
          prevWeek={calendarHook.prevWeek}
          nextWeek={calendarHook.nextWeek}
          prevDay={calendarHook.prevDay}
          nextDay={calendarHook.nextDay}
          goToToday={calendarHook.goToToday}
          isToday={calendarHook.isToday}
          events={eventsHook.events}
        />
      )}


      {activeTab === "registrations" && (
        <RegistrationsTab
          events={eventsHook.events}
          registrations={registrationsHook.registrations}
          loading={registrationsHook.loading}
          collegeId={collegeId}
          selectedEvent={selectedEventForReg}
          eventRegCounts={eventsHook.eventRegCounts}
          onSelectEvent={handleSelectEventForReg}
          onAddRegistration={registrationsHook.addRegistration}
          onRemoveRegistration={handleRemoveRegistration}
          onMarkAttendance={registrationsHook.markAttendance}
          onExportCSV={registrationsHook.exportAttendeesCSV}
        />
      )}

      {activeTab === "analytics" && (
        <AnalyticsTab analytics={analytics} />
      )}

      {/* Event Form Modal */}
      <EventFormModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        event={selectedEvent}
        quickAddDate={quickAddDate}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
      />
    </div>
  );
};

export default EventManagement;
