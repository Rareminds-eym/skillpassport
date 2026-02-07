import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { CollegeEvent, EventType, EventStatus } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<CollegeEvent>) => Promise<boolean>;
  event?: CollegeEvent | null;
  quickAddDate?: Date | null;
}

export const EventFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, event, quickAddDate }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "seminar" as EventType,
    start_date: "",
    end_date: "",
    venue: "",
    capacity: "",
    status: "draft" as EventStatus,
  });
  const [saving, setSaving] = useState(false);

  // Get current date and time for validation
  const getCurrentDateTime = () => {
    const now = new Date();
    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const currentDateTime = getCurrentDateTime();

  // Validation functions
  const isDateTimeInPast = (selectedDateTime: string) => {
    if (!selectedDateTime) return false;
    return selectedDateTime < currentDateTime;
  };

  const validateDateTime = () => {
    const errors = [];
    
    if (isDateTimeInPast(formData.start_date)) {
      errors.push("Start date and time cannot be in the past");
    }
    
    if (isDateTimeInPast(formData.end_date)) {
      errors.push("End date and time cannot be in the past");
    }

    if (formData.start_date && formData.end_date) {
      if (formData.end_date <= formData.start_date) {
        errors.push("End date must be after start date");
      }
    }
    
    return errors;
  };

  const validationErrors = validateDateTime();

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || "",
        event_type: event.event_type,
        start_date: event.start_date.slice(0, 16),
        end_date: event.end_date.slice(0, 16),
        venue: event.venue || "",
        capacity: event.capacity?.toString() || "",
        status: event.status,
      });
    } else if (quickAddDate) {
      const dateStr = quickAddDate.toISOString().slice(0, 10);
      setFormData({
        title: "", description: "", event_type: "seminar", venue: "", capacity: "", status: "draft",
        start_date: `${dateStr}T09:00`,
        end_date: `${dateStr}T17:00`,
      });
    } else {
      setFormData({ title: "", description: "", event_type: "seminar", start_date: "", end_date: "", venue: "", capacity: "", status: "draft" });
    }
  }, [event, quickAddDate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.start_date || !formData.end_date) return;
    
    // Validate date and time
    const errors = validateDateTime();
    if (errors.length > 0) {
      alert(`Please fix the following errors:\n${errors.join('\n')}`);
      return;
    }
    
    setSaving(true);
    const success = await onSave({
      ...formData,
      capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
    });
    setSaving(false);
    if (success) onClose();
  };

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{event ? "Edit Event" : "Create Event"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><XMarkIcon className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
              <select value={formData.event_type} onChange={(e) => setFormData({ ...formData, event_type: e.target.value as EventType })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="seminar">Seminar</option>
                <option value="workshop">Workshop</option>
                <option value="cultural">Cultural</option>
                <option value="sports">Sports</option>
                <option value="placement">Placement</option>
                <option value="guest_lecture">Guest Lecture</option>
                <option value="orientation">Orientation</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as EventStatus })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input 
                type="datetime-local" 
                value={formData.start_date} 
                min={currentDateTime} // Prevent selecting past dates/times
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} 
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  isDateTimeInPast(formData.start_date) 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300'
                }`}
                required 
              />
              {isDateTimeInPast(formData.start_date) && (
                <p className="mt-1 text-sm text-red-600">
                  Start date and time cannot be in the past
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
              <input 
                type="datetime-local" 
                value={formData.end_date} 
                min={formData.start_date || currentDateTime} // End date should be after start date or current time
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} 
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  isDateTimeInPast(formData.end_date) || 
                  (formData.start_date && formData.end_date && formData.end_date <= formData.start_date)
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300'
                }`}
                required 
              />
              {isDateTimeInPast(formData.end_date) && (
                <p className="mt-1 text-sm text-red-600">
                  End date and time cannot be in the past
                </p>
              )}
              {formData.start_date && formData.end_date && formData.end_date <= formData.start_date && (
                <p className="mt-1 text-sm text-red-600">
                  End date must be after start date
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <input type="text" value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" min="1" />
            </div>
          </div>
          
          {/* Validation Errors Display */}
          {validationErrors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Please fix the following errors:
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc pl-5 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button 
              type="submit" 
              disabled={saving || validationErrors.length > 0} 
              className={`px-4 py-2 rounded-lg transition-colors ${
                saving || validationErrors.length > 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
