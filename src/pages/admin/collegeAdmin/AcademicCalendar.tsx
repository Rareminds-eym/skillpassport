/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  CalendarIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  LockClosedIcon,
  LockOpenIcon,
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../../../lib/supabaseClient";
import toast from "react-hot-toast";

interface CalendarEvent {
  id: string;
  title: string;
  type: "academic_year" | "semester" | "holiday" | "exam_window" | "ia_window" | "event";
  start_date: string;
  end_date: string;
  description?: string;
  status: "draft" | "published" | "locked";
  created_at: string;
  updated_at: string;
}

const AcademicCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "academic_year" | "semester" | "holiday" | "exam_window" | "ia_window">("all");

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - replace with actual Supabase query
      const mockEvents: CalendarEvent[] = [
        {
          id: "1",
          title: "Academic Year 2024-25",
          type: "academic_year",
          start_date: "2024-08-01",
          end_date: "2025-07-31",
          description: "Full academic year",
          status: "published",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "2",
          title: "Semester 1 (Odd Semester)",
          type: "semester",
          start_date: "2024-08-01",
          end_date: "2024-12-31",
          description: "First semester of academic year",
          status: "published",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "3",
          title: "Semester 2 (Even Semester)",
          type: "semester",
          start_date: "2025-01-01",
          end_date: "2025-05-31",
          description: "Second semester of academic year",
          status: "published",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "4",
          title: "Diwali Break",
          type: "holiday",
          start_date: "2024-11-01",
          end_date: "2024-11-05",
          description: "Diwali festival holidays",
          status: "published",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "5",
          title: "End Semester Exams - Sem 1",
          type: "exam_window",
          start_date: "2024-12-01",
          end_date: "2024-12-20",
          description: "End semester examination window",
          status: "published",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "6",
          title: "Internal Assessment 1 - Sem 1",
          type: "ia_window",
          start_date: "2024-09-15",
          end_date: "2024-09-25",
          description: "First internal assessment window",
          status: "published",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setEvents(mockEvents);
    } catch (error: any) {
      console.error("Error loading events:", error);
      toast.error("Failed to load calendar events");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    if (event.status === "locked") {
      toast.error("Cannot edit locked event. Please unlock first.");
      return;
    }
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (id: string) => {
    const event = events.find((e) => e.id === id);
    if (event?.status === "locked") {
      toast.error("Cannot delete locked event. Please unlock first.");
      return;
    }

    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      // Mock implementation - replace with actual Supabase delete
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success("Event deleted successfully");
    } catch (error: any) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  const handlePublishEvent = async (id: string) => {
    try {
      // Mock implementation - replace with actual Supabase update
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: "published" as const } : e))
      );
      toast.success("Event published successfully. Notifications sent to all users.");
    } catch (error: any) {
      console.error("Error publishing event:", error);
      toast.error("Failed to publish event");
    }
  };

  const handleLockEvent = async (id: string) => {
    try {
      // Mock implementation - replace with actual Supabase update
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: "locked" as const } : e))
      );
      toast.success("Event locked. Modifications prevented.");
    } catch (error: any) {
      console.error("Error locking event:", error);
      toast.error("Failed to lock event");
    }
  };

  const handleUnlockEvent = async (id: string) => {
    if (!confirm("Are you sure you want to unlock this event? This requires admin override.")) return;

    try {
      // Mock implementation - replace with actual Supabase update
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: "published" as const } : e))
      );
      toast.success("Event unlocked. Modifications allowed.");
    } catch (error: any) {
      console.error("Error unlocking event:", error);
      toast.error("Failed to unlock event");
    }
  };

  const handleSaveEvent = async (data: Partial<CalendarEvent>) => {
    try {
      if (selectedEvent) {
        // Update existing event
        setEvents((prev) =>
          prev.map((e) => (e.id === selectedEvent.id ? { ...e, ...data, updated_at: new Date().toISOString() } : e))
        );
        toast.success("Event updated successfully");
      } else {
        // Create new event
        const newEvent: CalendarEvent = {
          ...data,
          id: `event-${Date.now()}`,
          status: "draft",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as CalendarEvent;
        setEvents((prev) => [...prev, newEvent]);
        toast.success("Event created successfully");
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error saving event:", error);
      toast.error("Failed to save event");
    }
  };

  const filteredEvents = activeTab === "all" 
    ? events 
    : events.filter((e) => e.type === activeTab);

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "academic_year":
        return <CalendarIcon className="h-5 w-5" />;
      case "semester":
        return <AcademicCapIcon className="h-5 w-5" />;
      case "holiday":
        return <ClockIcon className="h-5 w-5" />;
      case "exam_window":
        return <ClipboardDocumentListIcon className="h-5 w-5" />;
      case "ia_window":
        return <ClipboardDocumentListIcon className="h-5 w-5" />;
      default:
        return <CalendarIcon className="h-5 w-5" />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "academic_year":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "semester":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "holiday":
        return "bg-green-100 text-green-700 border-green-200";
      case "exam_window":
        return "bg-red-100 text-red-700 border-red-200";
      case "ia_window":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Draft</span>;
      case "published":
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Published</span>;
      case "locked":
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Locked</span>;
      default:
        return null;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const tabs = [
    { id: "all", label: "All Events" },
    { id: "academic_year", label: "Academic Year" },
    { id: "semester", label: "Semesters" },
    { id: "holiday", label: "Holidays" },
    { id: "exam_window", label: "Exam Windows" },
    { id: "ia_window", label: "IA Windows" },
  ];

  // Calculate stats
  const totalEvents = events.length;
  const publishedEvents = events.filter((e) => e.status === "published").length;
  const upcomingEvents = events.filter((e) => new Date(e.start_date) > new Date()).length;
  const lockedEvents = events.filter((e) => e.status === "locked").length;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Academic Calendar
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage academic year, semesters, holidays, exam windows, and IA windows
            </p>
          </div>
          <button
            onClick={handleCreateEvent}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Add Event
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Total Events
              </p>
              <p className="text-2xl font-bold text-gray-900">{totalEvents}</p>
            </div>
            <div className="p-3 rounded-xl border bg-blue-50 text-blue-600 border-blue-200">
              <CalendarIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Published
              </p>
              <p className="text-2xl font-bold text-gray-900">{publishedEvents}</p>
            </div>
            <div className="p-3 rounded-xl border bg-green-50 text-green-600 border-green-200">
              <CheckCircleIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Upcoming
              </p>
              <p className="text-2xl font-bold text-gray-900">{upcomingEvents}</p>
            </div>
            <div className="p-3 rounded-xl border bg-purple-50 text-purple-600 border-purple-200">
              <ClockIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Locked
              </p>
              <p className="text-2xl font-bold text-gray-900">{lockedEvents}</p>
            </div>
            <div className="p-3 rounded-xl border bg-red-50 text-red-600 border-red-200">
              <LockClosedIcon className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Calendar Events ({filteredEvents.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No events found</p>
            <button
              onClick={handleCreateEvent}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first event
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-3">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className={`p-4 border rounded-lg hover:border-gray-300 transition ${
                  event.status === "locked" ? "bg-gray-50" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg border ${getEventTypeColor(event.type)}`}>
                        {getEventTypeIcon(event.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{event.title}</h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {event.type.replace("_", " ")}
                        </p>
                      </div>
                      {getStatusBadge(event.status)}
                    </div>
                    <div className="ml-14">
                      <p className="text-sm text-gray-700 mb-1">
                        {formatDate(event.start_date)} - {formatDate(event.end_date)}
                      </p>
                      {event.description && (
                        <p className="text-sm text-gray-500">{event.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {event.status === "draft" && (
                      <button
                        onClick={() => handlePublishEvent(event.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Publish event"
                      >
                        <BellIcon className="h-5 w-5" />
                      </button>
                    )}
                    {event.status === "published" && (
                      <button
                        onClick={() => handleLockEvent(event.id)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                        title="Lock event"
                      >
                        <LockClosedIcon className="h-5 w-5" />
                      </button>
                    )}
                    {event.status === "locked" && (
                      <button
                        onClick={() => handleUnlockEvent(event.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Unlock event (Admin override)"
                      >
                        <LockOpenIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEditEvent(event)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit event"
                      disabled={event.status === "locked"}
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Delete event"
                      disabled={event.status === "locked"}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Form Modal */}
      {isModalOpen && (
        <EventFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveEvent}
          event={selectedEvent}
        />
      )}
    </div>
  );
};

// Event Form Modal Component
const EventFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<CalendarEvent>) => void;
  event: CalendarEvent | null;
}> = ({ isOpen, onClose, onSave, event }) => {
  const [formData, setFormData] = useState({
    title: event?.title || "",
    type: event?.type || "semester",
    start_date: event?.start_date || "",
    end_date: event?.end_date || "",
    description: event?.description || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-900">
              {event ? "Edit Event" : "Create New Event"}
            </h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Semester 1, Diwali Break"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="academic_year">Academic Year</option>
                <option value="semester">Semester</option>
                <option value="holiday">Holiday</option>
                <option value="exam_window">Exam Window</option>
                <option value="ia_window">IA Window</option>
                <option value="event">Other Event</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Add any additional details..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {event ? "Update Event" : "Create Event"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AcademicCalendar;
