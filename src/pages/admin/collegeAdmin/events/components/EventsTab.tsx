import React, { useState, useMemo } from "react";
import {
  MagnifyingGlassIcon, PlusCircleIcon, PencilSquareIcon,
  TrashIcon, CheckCircleIcon, ExclamationTriangleIcon, CalendarIcon, MapPinIcon, UsersIcon,
} from "@heroicons/react/24/outline";
import { CollegeEvent } from "../types";
import { formatDate, getEventTypeColor, getEventTypeIcon, getStatusBadge } from "../helpers";

interface Props {
  events: CollegeEvent[];
  loading: boolean;
  eventRegCounts: Record<string, number>;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (event: CollegeEvent) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  onCancel: (id: string) => void;
}

export const EventsTab: React.FC<Props> = ({
  events, loading, eventRegCounts, onRefresh, onCreate, onEdit, onDelete, onPublish, onCancel,
}) => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredEvents = useMemo(() => events.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || e.event_type === typeFilter;
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  }), [events, search, typeFilter, statusFilter]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
            <option value="all">All Types</option>
            <option value="seminar">Seminar</option>
            <option value="workshop">Workshop</option>
            <option value="cultural">Cultural</option>
            <option value="sports">Sports</option>
            <option value="placement">Placement</option>
            <option value="guest_lecture">Guest Lecture</option>
            <option value="orientation">Orientation</option>
            <option value="other">Other</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm">
          <PlusCircleIcon className="h-5 w-5" />Add Event
        </button>
      </div>


      {/* Events List */}
      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading events...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No events found</div>
        ) : (
          filteredEvents.map((event) => {
            const badge = getStatusBadge(event.status);
            return (
              <div key={event.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${getEventTypeColor(event.event_type)}`}>{getEventTypeIcon(event.event_type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{event.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>{badge.label}</span>
                        {eventRegCounts[event.id] > 0 && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                            {eventRegCounts[event.id]}{event.capacity ? `/${event.capacity}` : ""} registered
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{event.description || "No description"}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><CalendarIcon className="h-3.5 w-3.5" />{formatDate(event.start_date)} - {formatDate(event.end_date)}</span>
                        {event.venue && <span className="flex items-center gap-1"><MapPinIcon className="h-3.5 w-3.5" />{event.venue}</span>}
                        {event.capacity && <span className="flex items-center gap-1"><UsersIcon className="h-3.5 w-3.5" />Capacity: {event.capacity}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {event.status === "draft" && (
                      <button onClick={() => onPublish(event.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Publish"><CheckCircleIcon className="h-5 w-5" /></button>
                    )}
                    {event.status === "published" && (
                      <button onClick={() => onCancel(event.id)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg" title="Cancel"><ExclamationTriangleIcon className="h-5 w-5" /></button>
                    )}
                    <button onClick={() => onEdit(event)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><PencilSquareIcon className="h-5 w-5" /></button>
                    <button onClick={() => onDelete(event.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><TrashIcon className="h-5 w-5" /></button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
