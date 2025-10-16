import React, { useState, useEffect } from 'react';
import {
  CalendarDaysIcon,
  VideoCameraIcon,
  ClockIcon,
  UserIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  PlusIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabaseClient';
import { createInterview, sendReminder } from '../../services/interviewService';

// Define TypeScript interfaces
interface Scorecard {
  technical_skills: number | null;
  communication: number | null;
  problem_solving: number | null;
  cultural_fit: number | null;
  overall_rating: number | null;
  notes: string;
  recommendation: 'proceed' | 'maybe' | 'reject' | null;
}

interface Interview {
  id: string;
  candidate_name: string;
  job_title: string;
  interviewer: string;
  date: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'pending';
  type: string;
  meeting_type: string | null;
  meeting_link: string | null;
  reminders_sent: number;
  scorecard: Scorecard | null;
  completed_date: string | null;
  created_at: string;
  updated_at: string;
}

const getStatusColor = (status) => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800';
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-gray-100 text-gray-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getMeetingTypeIcon = (type) => {
  switch (type) {
    case 'teams':
      return '👥';
    case 'meet':
      return '📹';
    case 'zoom':
      return '🎥';
    default:
      return '📞';
  }
};

const getRecommendationColor = (recommendation) => {
  switch (recommendation) {
    case 'proceed':
      return 'text-green-600';
    case 'maybe':
      return 'text-yellow-600';
    case 'reject':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

const ScorecardModal = ({ interview, isOpen, onClose, onSave }) => {
  const [scorecard, setScorecard] = useState<Scorecard>(interview?.scorecard || {
    technical_skills: null,
    communication: null,
    problem_solving: null,
    cultural_fit: null,
    overall_rating: null,
    notes: '',
    recommendation: null
  });

  const handleSave = async () => {
    try {
      const overallRating = calculateOverallRating();
      const updatedScorecard = {
        ...scorecard,
        overall_rating: overallRating ? parseFloat(overallRating) : null
      };

      // Update interview in Supabase
      const { error } = await supabase
        .from('interviews')
        .update({
          scorecard: updatedScorecard,
          status: 'completed',
          completed_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', interview.id);

      if (error) throw error;

      const updatedInterview = {
        ...interview,
        scorecard: updatedScorecard,
        status: 'completed',
        completed_date: new Date().toISOString()
      };
      
      onSave(updatedInterview);
      onClose();
    } catch (error) {
      console.error('Error saving scorecard:', error);
      alert('Failed to save scorecard. Please try again.');
    }
  };

  const calculateOverallRating = () => {
    const scores = [
      scorecard.technical_skills,
      scorecard.communication,
      scorecard.problem_solving,
      scorecard.cultural_fit
    ].filter(score => score !== null);
    
    if (scores.length === 0) return null;
    return (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2);
  };

  const overallRating = calculateOverallRating();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Interview Scorecard</h3>
              <p className="text-sm text-gray-500">{interview?.candidate_name} • {interview?.job_title}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Rating Criteria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'technical_skills', label: 'Technical Skills' },
                { key: 'communication', label: 'Communication' },
                { key: 'problem_solving', label: 'Problem Solving' },
                { key: 'cultural_fit', label: 'Cultural Fit' }
              ].map(criteria => (
                <div key={criteria.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {criteria.label}
                  </label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setScorecard({...scorecard, [criteria.key]: rating})}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                          scorecard[criteria.key] === rating
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-primary-300'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Rating Display */}
            {overallRating && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Calculated Overall Rating</span>
                  <div className="flex items-center">
                    <StarIcon className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                    <span className="text-lg font-bold text-gray-900">{overallRating}/5.0</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Notes
              </label>
              <textarea
                value={scorecard.notes}
                onChange={(e) => setScorecard({...scorecard, notes: e.target.value})}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Add detailed notes about the candidate's performance, strengths, areas for improvement..."
              />
            </div>

            {/* Recommendation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recommendation
              </label>
              <div className="space-x-4">
                {[
                  { value: 'proceed', label: 'Proceed', color: 'text-green-600 border-green-300 bg-green-50' },
                  { value: 'maybe', label: 'Maybe', color: 'text-yellow-600 border-yellow-300 bg-yellow-50' },
                  { value: 'reject', label: 'Reject', color: 'text-red-600 border-red-300 bg-red-50' }
                ].map(rec => (
                  <label key={rec.value} className="inline-flex items-center">
                    <input
                      type="radio"
                      name="recommendation"
                      value={rec.value}
                      checked={scorecard.recommendation === rec.value}
                      onChange={(e) => setScorecard({...scorecard, recommendation: e.target.value})}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium border ${rec.color}`}>
                      {rec.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
            >
              Save Scorecard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InterviewCard = ({ interview, onViewScorecard, onEditScorecard, onJoinMeeting, onSendReminder }) => {
  const isCompleted = interview.status === 'completed';
  const hasScorecard = interview.scorecard?.overall_rating !== null;
  
  const getCardColor = () => {
    if (interview.status === 'completed') {
      const recommendation = interview.scorecard?.recommendation;
      switch (recommendation) {
        case 'proceed':
          return 'border-l-4 border-l-green-500 bg-green-50';
        case 'maybe':
          return 'border-l-4 border-l-yellow-500 bg-yellow-50';
        case 'reject':
          return 'border-l-4 border-l-red-500 bg-red-50';
        default:
          return 'border-l-4 border-l-gray-500 bg-gray-50';
      }
    }
    return 'bg-white border border-gray-200';
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const { date, time } = formatDateTime(interview.date);
  
  return (
    <div className={`rounded-lg p-4 hover:shadow-md transition-shadow ${getCardColor()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{interview.candidate_name}</h3>
          <p className="text-sm text-gray-600">{interview.job_title}</p>
          <p className="text-xs text-gray-500">{interview.type}</p>
        </div>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
          {interview.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <CalendarDaysIcon className="h-4 w-4 mr-2" />
          <span>{date} at {time}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <ClockIcon className="h-4 w-4 mr-2" />
          <span>{interview.duration} minutes</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <UserIcon className="h-4 w-4 mr-2" />
          <span>{interview.interviewer}</span>
        </div>
        {interview.meeting_link && (
          <div className="flex items-center text-sm text-gray-600">
            <VideoCameraIcon className="h-4 w-4 mr-2" />
            <span className="mr-1">{getMeetingTypeIcon(interview.meeting_type)}</span>
            <span className="capitalize">{interview.meeting_type} Meeting</span>
          </div>
        )}
      </div>

      {/* Scorecard Summary for Completed Interviews */}
      {isCompleted && hasScorecard && (
        <div className="mb-4 p-3 bg-white rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Interview Results</span>
            <div className="flex items-center">
              <StarIcon className="h-4 w-4 text-yellow-400 fill-current mr-1" />
              <span className="font-medium">{interview.scorecard.overall_rating}/5.0</span>
            </div>
          </div>
          <div className={`text-sm font-medium ${getRecommendationColor(interview.scorecard.recommendation)}`}>
            {interview.scorecard.recommendation && (
              <span className="capitalize">{interview.scorecard.recommendation}</span>
            )}
          </div>
          {interview.scorecard.notes && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {interview.scorecard.notes}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {!isCompleted && interview.meeting_link && (
            <button
              onClick={() => onJoinMeeting(interview)}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-primary-700 bg-primary-100 rounded-md hover:bg-primary-200"
            >
              <VideoCameraIcon className="h-3 w-3 mr-1" />
              Join Meeting
            </button>
          )}
          
          {isCompleted && hasScorecard ? (
            <button
              onClick={() => onViewScorecard(interview)}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <EyeIcon className="h-3 w-3 mr-1" />
              View Results
            </button>
          ) : isCompleted ? (
            <button
              onClick={() => onEditScorecard(interview)}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
            >
              <PencilIcon className="h-3 w-3 mr-1" />
              Add Scorecard
            </button>
          ) : null}
          
          {!isCompleted && (
            <button
              onClick={() => onSendReminder(interview)}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
            >
              <PaperAirplaneIcon className="h-3 w-3 mr-1" />
              Remind
            </button>
          )}
        </div>

        <div className="text-xs text-gray-500">
          {interview.reminders_sent > 0 && `${interview.reminders_sent} reminder(s) sent`}
        </div>
      </div>
    </div>
  );
};

const CalendarView = ({ interviews, selectedDate, onDateSelect }) => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const calendar = [];
  const current = new Date(startDate);
  
  while (current <= lastDay || current.getDay() !== 0) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(current);
      const dayInterviews = interviews.filter(interview => {
        const interviewDate = new Date(interview.date);
        return interviewDate.toDateString() === date.toDateString();
      });
      
      week.push({
        date: new Date(date),
        interviews: dayInterviews,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === new Date().toDateString(),
        isSelected: selectedDate && date.toDateString() === selectedDate.toDateString()
      });
      
      current.setDate(current.getDate() + 1);
    }
    calendar.push(week);
    
    if (current.getMonth() !== month && current.getDay() === 0) break;
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {monthNames[month]} {year}
        </h3>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {calendar.map((week, weekIndex) =>
          week.map((day, dayIndex) => (
            <button
              key={`${weekIndex}-${dayIndex}`}
              onClick={() => onDateSelect(day.date)}
              className={`p-2 text-sm rounded-lg hover:bg-gray-50 ${
                !day.isCurrentMonth ? 'text-gray-300' : 'text-gray-900'
              } ${
                day.isToday ? 'bg-primary-100 text-primary-900 font-semibold' : ''
              } ${
                day.isSelected ? 'bg-primary-600 text-white' : ''
              }`}
            >
              <div className="w-full">
                <div className="text-center">{day.date.getDate()}</div>
                {day.interviews.length > 0 && (
                  <div className="flex justify-center mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

const Interviews = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showScorecardModal, setShowScorecardModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch interviews from Supabase
  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      // Ensure scorecard is always an object
      const formattedData = data?.map(item => ({
        ...item,
        scorecard: item.scorecard || null
      })) || [];

      setInterviews(formattedData);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      alert('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleSaveScorecard = async (updatedInterview: Interview) => {
    try {
      setInterviews(prev => prev.map(interview =>
        interview.id === updatedInterview.id ? updatedInterview : interview
      ));
    } catch (error) {
      console.error('Error updating interview:', error);
    }
  };

  const handleJoinMeeting = (interview: Interview) => {
    if (interview.meeting_link) {
      window.open(interview.meeting_link, '_blank');
    }
  };

  const handleSendReminder = async (interview: Interview) => {
    try {
      // Send reminder via Edge Function
      const { data, error } = await sendReminder(interview.id);

      if (error) throw error;

      // Update local state
      setInterviews(prev => prev.map(int =>
        int.id === interview.id 
          ? { ...int, reminders_sent: int.reminders_sent + 1 }
          : int
      ));

      alert(`Interview reminder sent successfully to ${interview.candidate_name}!`);
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Failed to send reminder. Please try again.');
    }
  };

  const filteredInterviews = selectedDate 
    ? interviews.filter(interview => {
        const interviewDate = new Date(interview.date);
        return interviewDate.toDateString() === selectedDate.toDateString();
      })
    : interviews;

  const upcomingInterviews = interviews.filter(interview => 
    new Date(interview.date) > new Date() && interview.status !== 'completed'
  );

  const completedInterviews = interviews.filter(interview => 
    interview.status === 'completed'
  );

  const pendingScoreCards = completedInterviews.filter(interview =>
    !interview.scorecard?.overall_rating
  );

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading interviews...</div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
          <p className="text-gray-600 mt-1">Manage interview scheduling and feedback</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex rounded-lg border border-gray-300 p-1 bg-white">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'list' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'calendar' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Calendar
            </button>
          </div>
          <button 
            onClick={() => setShowScheduleModal(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Schedule Interview
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-2xl font-semibold text-gray-900">{upcomingInterviews.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{completedInterviews.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Pending Scorecards</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingScoreCards.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <StarIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Avg. Rating</p>
              <p className="text-2xl font-semibold text-gray-900">
                {completedInterviews.filter(i => i.scorecard?.overall_rating).length > 0
                  ? (completedInterviews
                      .filter(i => i.scorecard?.overall_rating)
                      .reduce((sum, i) => sum + i.scorecard.overall_rating, 0) / 
                    completedInterviews.filter(i => i.scorecard?.overall_rating).length
                    ).toFixed(1)
                  : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CalendarView 
              interviews={interviews}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedDate ? `Interviews on ${selectedDate?.toLocaleDateString()}` : 'All Upcoming Interviews'}
            </h3>
            <div className="space-y-4">
              {(selectedDate ? filteredInterviews : upcomingInterviews).map(interview => (
                <InterviewCard
                  key={interview.id}
                  interview={interview}
                  onViewScorecard={(int) => {
                    setSelectedInterview(int);
                    setShowScorecardModal(true);
                  }}
                  onEditScorecard={(int) => {
                    setSelectedInterview(int);
                    setShowScorecardModal(true);
                  }}
                  onJoinMeeting={handleJoinMeeting}
                  onSendReminder={handleSendReminder}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {interviews.map(interview => (
            <InterviewCard
              key={interview.id}
              interview={interview}
              onViewScorecard={(int) => {
                setSelectedInterview(int);
                setShowScorecardModal(true);
              }}
              onEditScorecard={(int) => {
                setSelectedInterview(int);
                setShowScorecardModal(true);
              }}
              onJoinMeeting={handleJoinMeeting}
              onSendReminder={handleSendReminder}
            />
          ))}
        </div>
      )}

      {/* Scorecard Modal */}
      <ScorecardModal
        interview={selectedInterview}
        isOpen={showScorecardModal}
        onClose={() => {
          setShowScorecardModal(false);
          setSelectedInterview(null);
        }}
        onSave={handleSaveScorecard}
      />

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSuccess={() => {
          setShowScheduleModal(false);
          fetchInterviews(); // Refresh interviews list
        }}
      />
    </div>
  );
};

const ScheduleInterviewModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    candidate_name: '',
    candidate_email: '',
    candidate_phone: '',
    job_title: '',
    interviewer: '',
    interviewer_email: '',
    date: '',
    time: '',
    duration: 60,
    type: 'Technical',
    meeting_type: 'meet',
    meeting_link: '',
    meeting_notes: ''
  });

  const handleSchedule = async () => {
    if (!formData.candidate_name || !formData.job_title || !formData.interviewer || !formData.date || !formData.time) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Combine date and time
      const interviewDateTime = new Date(`${formData.date}T${formData.time}`);

      const interviewData = {
        id: `int_${Date.now()}`,
        candidate_name: formData.candidate_name,
        candidate_email: formData.candidate_email || null,
        candidate_phone: formData.candidate_phone || null,
        job_title: formData.job_title,
        interviewer: formData.interviewer,
        interviewer_email: formData.interviewer_email || null,
        date: interviewDateTime.toISOString(),
        duration: formData.duration,
        status: 'scheduled',
        type: formData.type,
        meeting_type: formData.meeting_type,
        meeting_link: formData.meeting_link || null,
        meeting_notes: formData.meeting_notes || null
      };

      const { error } = await createInterview(interviewData);

      if (error) {
        throw new Error(error.message || 'Failed to schedule interview');
      }

      alert(`Interview scheduled for ${formData.candidate_name}!`);
      onSuccess?.();
      
      // Reset form
      setFormData({
        candidate_name: '',
        candidate_email: '',
        candidate_phone: '',
        job_title: '',
        interviewer: '',
        interviewer_email: '',
        date: '',
        time: '',
        duration: 60,
        type: 'Technical',
        meeting_type: 'meet',
        meeting_link: '',
        meeting_notes: ''
      });
    } catch (err) {
      console.error('Error scheduling interview:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Get tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Schedule New Interview</h3>
              <p className="text-sm text-gray-500">Create a new interview appointment</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Candidate Details */}
            <div className="border-b pb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Candidate Information</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Candidate Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.candidate_name}
                    onChange={(e) => setFormData({...formData, candidate_name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.candidate_email}
                    onChange={(e) => setFormData({...formData, candidate_email: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="jane@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.candidate_phone}
                    onChange={(e) => setFormData({...formData, candidate_phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.job_title}
                    onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Software Engineer"
                  />
                </div>
              </div>
            </div>

            {/* Interviewer Details */}
            <div className="border-b pb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Interviewer Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interviewer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.interviewer}
                    onChange={(e) => setFormData({...formData, interviewer: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interviewer Email
                  </label>
                  <input
                    type="email"
                    value={formData.interviewer_email}
                    onChange={(e) => setFormData({...formData, interviewer_email: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="john@company.com"
                  />
                </div>
              </div>
            </div>

            {/* Schedule Details */}
            <div className="border-b pb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Schedule Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    min={minDate}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interview Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Technical">Technical</option>
                    <option value="HR">HR Round</option>
                    <option value="Behavioral">Behavioral</option>
                    <option value="Final">Final Round</option>
                    <option value="Screening">Screening</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Meeting Details */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Meeting Details</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Platform
                  </label>
                  <select
                    value={formData.meeting_type}
                    onChange={(e) => setFormData({...formData, meeting_type: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="meet">Google Meet</option>
                    <option value="teams">MS Teams</option>
                    <option value="zoom">Zoom</option>
                    <option value="phone">Phone Call</option>
                    <option value="in-person">In-Person</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    value={formData.meeting_link}
                    onChange={(e) => setFormData({...formData, meeting_link: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="https://meet.google.com/abc-defg-hij"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.meeting_notes}
                    onChange={(e) => setFormData({...formData, meeting_notes: e.target.value})}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Scheduling...
                </>
              ) : (
                <>
                  <CalendarDaysIcon className="h-4 w-4 mr-1" />
                  Schedule Interview
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interviews;
