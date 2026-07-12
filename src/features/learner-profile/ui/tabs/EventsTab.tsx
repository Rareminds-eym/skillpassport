import React, { useState, useEffect } from 'react';
import { CalendarIcon, MapPinIcon, UserGroupIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { apiPost } from '@/shared/api/apiClient';

interface Event {
  id: string;
  title: string;
  description?: string;
  event_type?: string;
  start_date?: string;
  end_date?: string;
  venue?: string; // college_events uses 'venue' not 'location'
  status?: string;
  capacity?: number;
  is_registered?: boolean;
  attended?: boolean; // college_event_registrations has 'attended' field
  registered_at?: string;
  created_at?: string;
}

interface EventsTabProps {
  learner: any;
  loading?: boolean;
}

const EventsTab: React.FC<EventsTabProps> = ({ learner, loading: externalLoading }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    const fetchlearnerEvents = async () => {
      if (!learner?.id) return;
      
      setLoading(true);
      try {
        const res = await apiPost('/learner-profile/actions', {
          action: 'fetch-learner-club-event-data',
          learnerId: learner.id,
        });
        const registrations: any[] = res?.data?.events ?? [];
        const learnerEvents = registrations
          .filter((r: any) => r.college_events)
          .map((r: any) => ({
            ...r.college_events,
            is_registered: true,
            attended: r.attended,
            registered_at: r.registered_at,
          }))
          .sort((a: any, b: any) => {
            const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
            const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
            return dateB - dateA;
          });
        setEvents(learnerEvents);
      } catch (err) {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchlearnerEvents();
  }, [learner?.id]);

  const filteredEvents = events.filter(event => {
    const now = new Date();
    const eventDate = event.start_date ? new Date(event.start_date) : null;
    
    switch (filter) {
      case 'upcoming':
        return eventDate && eventDate >= now;
      case 'past':
        return eventDate && eventDate < now;
      default:
        return true;
    }
  });

  const getEventTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'workshop': return 'bg-blue-100 text-blue-800';
      case 'seminar': return 'bg-purple-100 text-purple-800';
      case 'competition': return 'bg-orange-100 text-orange-800';
      case 'cultural': return 'bg-pink-100 text-pink-800';
      case 'sports': return 'bg-green-100 text-green-800';
      case 'technical': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading || externalLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Registered Events</h3>
          <p className="text-sm text-gray-500">
            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} {filter !== 'all' ? `(${filter})` : ''}
          </p>
        </div>
        
        <div className="flex gap-2">
          {(['all', 'upcoming', 'past'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No registered events</p>
          <p className="text-sm text-gray-400 mt-1">
            Learner has not registered for any {filter !== 'all' ? filter : ''} events yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map(event => (
            <div
              key={event.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    {event.is_registered && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Registered
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {event.event_type && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                        {event.event_type}
                      </span>
                    )}
                    {event.status && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    )}
                  </div>
                  
                  {event.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {formatDate(event.start_date)}
                      {event.end_date && event.end_date !== event.start_date && (
                        <span> - {formatDate(event.end_date)}</span>
                      )}
                    </div>
                    
                    {event.venue && (
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {event.venue}
                      </div>
                    )}
                    
                    {event.capacity && (
                      <div className="flex items-center">
                        <UserGroupIcon className="h-4 w-4 mr-1" />
                        {event.capacity} capacity
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="ml-4 text-right">
                  <div className="text-2xl font-bold text-primary-600">
                    {event.start_date ? new Date(event.start_date).getDate() : '--'}
                  </div>
                  <div className="text-xs text-gray-500 uppercase">
                    {event.start_date 
                      ? new Date(event.start_date).toLocaleDateString('en-US', { month: 'short' })
                      : '---'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsTab;
