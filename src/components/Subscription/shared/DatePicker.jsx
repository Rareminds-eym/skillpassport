import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DatePicker({ 
  value, 
  onChange, 
  name = 'date',
  label = 'Date',
  required = false,
  error,
  placeholder = 'Select date',
  minDate,
  maxDate,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value);
    return new Date();
  });
  const [viewMode, setViewMode] = useState('days'); // 'days', 'months', 'years'
  const containerRef = useRef(null);

  // Parse the value
  const selectedDate = value ? new Date(value) : null;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setViewMode('days');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Previous month days
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false, isPrev: true });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, isCurrentMonth: false, isNext: true });
    }

    return days;
  };

  // Check if date is disabled
  const isDateDisabled = (year, month, day) => {
    // Normalize month/year for comparison
    let normalizedYear = year;
    let normalizedMonth = month;
    if (month < 0) { normalizedMonth = 11; normalizedYear--; }
    if (month > 11) { normalizedMonth = 0; normalizedYear++; }
    
    // Create date string for comparison (YYYY-MM-DD format)
    const dateStr = `${normalizedYear}-${String(normalizedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  // Check if date is selected
  const isDateSelected = (year, month, day) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    );
  };

  // Check if date is today
  const isToday = (year, month, day) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  // Handle day click
  const handleDayClick = (day, isCurrentMonth, isPrev, isNext) => {
    let year = viewDate.getFullYear();
    let month = viewDate.getMonth();

    if (isPrev) {
      month--;
      if (month < 0) { month = 11; year--; }
    } else if (isNext) {
      month++;
      if (month > 11) { month = 0; year++; }
    }

    if (isDateDisabled(year, month, day)) return;

    // Create date string in YYYY-MM-DD format to avoid timezone issues
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    onChange({ target: { name, value: formattedDate } });
    setIsOpen(false);
    setViewMode('days');
  };

  // Navigate months
  const navigateMonth = (direction) => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  // Navigate years
  const navigateYear = (direction) => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setFullYear(prev.getFullYear() + direction);
      return newDate;
    });
  };

  // Generate years for year picker
  const generateYears = () => {
    const currentYear = viewDate.getFullYear();
    const startYear = Math.floor(currentYear / 12) * 12;
    const years = [];
    for (let i = startYear; i < startYear + 12; i++) {
      years.push(i);
    }
    return years;
  };

  // Format display value
  const formatDisplayValue = () => {
    if (!selectedDate) return '';
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Clear date
  const handleClear = (e) => {
    e.stopPropagation();
    onChange({ target: { name, value: '' } });
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {/* Input Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center w-full pl-4 pr-4 py-3 border rounded-xl cursor-pointer transition-all duration-200 outline-none
          ${isOpen ? 'ring-2 ring-blue-500/20 border-blue-500 bg-white' : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-400'}
          ${error ? 'border-red-500' : ''}
        `}
      >
        <Calendar className={`w-5 h-5 mr-3 transition-colors ${isOpen ? 'text-blue-500' : 'text-gray-400'}`} />
        <span className={`flex-1 ${selectedDate ? 'text-gray-900' : 'text-gray-400'}`}>
          {selectedDate ? formatDisplayValue() : placeholder}
        </span>
        {selectedDate && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
          <span className="w-3 h-3">⚠</span>
          {error}
        </p>
      )}

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full min-w-[320px] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <button
              type="button"
              onClick={() => viewMode === 'years' ? navigateYear(-12) : navigateMonth(-1)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'months' ? 'days' : 'months')}
                className="px-3 py-1 hover:bg-white/20 rounded-lg transition-colors font-medium"
              >
                {MONTHS[viewDate.getMonth()]}
              </button>
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'years' ? 'days' : 'years')}
                className="px-3 py-1 hover:bg-white/20 rounded-lg transition-colors font-medium"
              >
                {viewDate.getFullYear()}
              </button>
            </div>

            <button
              type="button"
              onClick={() => viewMode === 'years' ? navigateYear(12) : navigateMonth(1)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Days View */}
          {viewMode === 'days' && (
            <div className="p-3">
              {/* Day Headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((item, index) => {
                  let year = viewDate.getFullYear();
                  let month = viewDate.getMonth();
                  
                  // Adjust month and year for prev/next month days
                  if (item.isPrev) {
                    month--;
                    if (month < 0) { month = 11; year--; }
                  }
                  if (item.isNext) {
                    month++;
                    if (month > 11) { month = 0; year++; }
                  }

                  const disabled = isDateDisabled(year, month, item.day);
                  const selected = isDateSelected(year, month, item.day);
                  const today = isToday(year, month, item.day);

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleDayClick(item.day, item.isCurrentMonth, item.isPrev, item.isNext)}
                      disabled={disabled}
                      className={`
                        relative w-10 h-10 rounded-xl text-sm font-medium transition-all duration-150
                        ${!item.isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                        ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-blue-50 hover:text-blue-600'}
                        ${selected ? 'bg-blue-500 text-white hover:bg-blue-600 hover:text-white shadow-md' : ''}
                        ${today && !selected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                      `}
                    >
                      {item.day}
                    </button>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = today.getMonth();
                    const day = today.getDate();
                    if (!isDateDisabled(year, month, day)) {
                      const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      onChange({ target: { name, value: formattedDate } });
                      setIsOpen(false);
                    }
                  }}
                  className="flex-1 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); setViewMode('days'); }}
                  className="flex-1 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Months View */}
          {viewMode === 'months' && (
            <div className="p-3">
              <div className="grid grid-cols-3 gap-2">
                {MONTHS.map((month, index) => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => {
                      setViewDate(prev => {
                        const newDate = new Date(prev);
                        newDate.setMonth(index);
                        return newDate;
                      });
                      setViewMode('days');
                    }}
                    className={`
                      py-3 rounded-xl text-sm font-medium transition-all
                      ${viewDate.getMonth() === index ? 'bg-blue-500 text-white' : 'hover:bg-blue-50 text-gray-700'}
                    `}
                  >
                    {month.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Years View */}
          {viewMode === 'years' && (
            <div className="p-3">
              <div className="grid grid-cols-3 gap-2">
                {generateYears().map(year => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => {
                      setViewDate(prev => {
                        const newDate = new Date(prev);
                        newDate.setFullYear(year);
                        return newDate;
                      });
                      setViewMode('months');
                    }}
                    className={`
                      py-3 rounded-xl text-sm font-medium transition-all
                      ${viewDate.getFullYear() === year ? 'bg-blue-500 text-white' : 'hover:bg-blue-50 text-gray-700'}
                    `}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
