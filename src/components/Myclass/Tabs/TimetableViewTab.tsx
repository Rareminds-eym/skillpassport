import React, { useMemo } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';

export interface SchoolTimetableSlot {
  id: string;
  day_of_week: number;
  period_number: number;
  start_time: string;
  end_time: string;
  subject_name: string;
  room_number?: string;
  educator_name?: string;
}

interface SchoolTimetableViewTabProps {
  timetable: SchoolTimetableSlot[];
  viewType: 'week' | 'day';
  selectedDay?: number;
  loading?: boolean;
}

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT_DAYS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

// Subject color mapping for the grid view
const getSubjectColor = (subject: string): { bg: string; text: string; border: string } => {
  const subjectLower = subject?.toLowerCase() || '';
  
  if (subjectLower.includes('math')) {
    return { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-200' };
  }
  if (subjectLower.includes('biology') || subjectLower.includes('bio')) {
    return { bg: 'bg-green-100', text: 'text-green-900', border: 'border-green-200' };
  }
  if (subjectLower.includes('history')) {
    return { bg: 'bg-violet-100', text: 'text-violet-900', border: 'border-violet-200' };
  }
  if (subjectLower.includes('geo') || subjectLower.includes('geography')) {
    return { bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-200' };
  }
  if (subjectLower.includes('art')) {
    return { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-200' };
  }
  if (subjectLower.includes('science') || subjectLower.includes('physics') || subjectLower.includes('chemistry')) {
    return { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-200' };
  }
  if (subjectLower.includes('english') || subjectLower.includes('language')) {
    return { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-200' };
  }
  if (subjectLower.includes('music')) {
    return { bg: 'bg-pink-100', text: 'text-pink-900', border: 'border-pink-200' };
  }
  if (subjectLower.includes('sport') || subjectLower.includes('pe') || subjectLower.includes('physical')) {
    return { bg: 'bg-orange-100', text: 'text-orange-900', border: 'border-orange-200' };
  }
  return { bg: 'bg-gray-100', text: 'text-gray-900', border: 'border-gray-200' };
};

const TimetableViewTab: React.FC<SchoolTimetableViewTabProps> = ({ 
  timetable, 
  viewType, 
  selectedDay = 1,
  loading = false 
}) => {
  // Group timetable by day
  const timetableByDay = useMemo(() => {
    const grouped: Record<number, SchoolTimetableSlot[]> = {};
    timetable.forEach(slot => {
      if (!grouped[slot.day_of_week]) {
        grouped[slot.day_of_week] = [];
      }
      grouped[slot.day_of_week].push(slot);
    });
    return grouped;
  }, [timetable]);

  // Get slot for a specific day and time
  const getSlotForDayAndTime = (day: number, timeSlot: string): SchoolTimetableSlot | undefined => {
    const daySlots = timetableByDay[day] || [];
    return daySlots.find(slot => {
      const slotStartHour = parseInt(slot.start_time?.split(':')[0] || '0');
      const timeSlotHour = parseInt(timeSlot.split(':')[0]);
      return slotStartHour === timeSlotHour;
    });
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (viewType === 'day') {
    const daySlots = timetableByDay[selectedDay] || [];
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">
            {DAYS[selectedDay]} Schedule
          </h3>
        </div>
        
        {daySlots.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No classes scheduled for {DAYS[selectedDay]}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {daySlots
              .sort((a, b) => a.period_number - b.period_number)
              .map(slot => {
                const colors = getSubjectColor(slot.subject_name);
                return (
                  <div 
                    key={slot.id} 
                    className={`rounded-xl border p-4 ${colors.bg} ${colors.border} hover:shadow-md transition-shadow duration-200`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                            Period {slot.period_number}
                          </span>
                          <h4 className={`font-semibold ${colors.text}`}>
                            {slot.subject_name}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-3 h-3" />
                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                          </span>
                          
                          {slot.educator_name && (
                            <span className="text-gray-600">
                              {slot.educator_name}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {slot.room_number && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-600 text-sm font-medium rounded-full border border-gray-200">
                          <MapPin className="w-3.5 h-3.5 text-blue-500" />
                          Room {slot.room_number}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    );
  }

  // Week view - Grid layout
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">Weekly Timetable</h3>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid grid-cols-8 gap-2 mb-4">
            <div className="p-3 text-center font-medium text-gray-700 bg-gray-50 rounded-lg">
              Time
            </div>
            {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <div key={day} className="p-3 text-center font-medium text-gray-700 bg-gray-50 rounded-lg">
                {SHORT_DAYS[day]}
              </div>
            ))}
          </div>
          
          {/* Time slots */}
          <div className="space-y-2">
            {TIME_SLOTS.map(timeSlot => (
              <div key={timeSlot} className="grid grid-cols-8 gap-2">
                <div className="p-3 text-center text-sm font-medium text-gray-600 bg-gray-50 rounded-lg">
                  {timeSlot}
                </div>
                {[1, 2, 3, 4, 5, 6, 7].map(day => {
                  const slot = getSlotForDayAndTime(day, timeSlot);
                  if (!slot) {
                    return (
                      <div key={day} className="p-3 bg-gray-50 rounded-lg border border-gray-100 min-h-[60px]">
                      </div>
                    );
                  }
                  
                  const colors = getSubjectColor(slot.subject_name);
                  return (
                    <div 
                      key={day} 
                      className={`p-3 rounded-lg border ${colors.bg} ${colors.border} min-h-[60px] hover:shadow-md transition-shadow duration-200`}
                    >
                      <div className="text-xs font-semibold mb-1 truncate" title={slot.subject_name}>
                        {slot.subject_name}
                      </div>
                      {slot.educator_name && (
                        <div className="text-xs text-gray-600 truncate" title={slot.educator_name}>
                          {slot.educator_name}
                        </div>
                      )}
                      {slot.room_number && (
                        <div className="text-xs text-gray-500 mt-1">
                          Room {slot.room_number}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableViewTab;