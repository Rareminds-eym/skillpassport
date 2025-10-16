import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  FunnelIcon,
  ViewColumnsIcon,
  TableCellsIcon,
  Squares2X2Icon,
  EyeIcon,
  BookmarkIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  StarIcon,
  XMarkIcon,
  CheckIcon,
  CalendarIcon,
  VideoCameraIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { useStudents } from '../../hooks/useStudents';
import { getShortlists, addCandidateToShortlist } from '../../services/shortlistService';
import { createInterview } from '../../services/interviewService';
import { useSearch } from '../../context/SearchContext';

const FilterSection = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
};

const CheckboxGroup = ({ options, selectedValues, onChange }) => {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label key={option.value} className="flex items-center">
          <input
            type="checkbox"
            checked={selectedValues.includes(option.value)}
            onChange={(e) => {
              if (e.target.checked) {
                onChange([...selectedValues, option.value]);
              } else {
                onChange(selectedValues.filter(v => v !== option.value));
              }
            }}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">{option.label}</span>
          {option.count && (
            <span className="ml-auto text-xs text-gray-500">({option.count})</span>
          )}
        </label>
      ))}
    </div>
  );
};

const AddToShortlistModal = ({ isOpen, onClose, candidate, onSuccess }) => {
  const [shortlists, setShortlists] = useState([]);
  const [selectedShortlistId, setSelectedShortlistId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingShortlists, setLoadingShortlists] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchShortlists();
    }
  }, [isOpen]);

  const fetchShortlists = async () => {
    setLoadingShortlists(true);
    try {
      const { data, error } = await getShortlists();
      if (error) throw error;
      setShortlists(data || []);
    } catch (err) {
      console.error('Error fetching shortlists:', err);
      setError('Failed to load shortlists');
    } finally {
      setLoadingShortlists(false);
    }
  };

  const handleAddToShortlist = async () => {
    if (!selectedShortlistId) {
      setError('Please select a shortlist');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await addCandidateToShortlist(
        selectedShortlistId,
        candidate.id
      );

      if (error) {
        throw new Error(error.message || 'Failed to add candidate to shortlist');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error adding to shortlist:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add to Shortlist</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Add <span className="font-medium">{candidate?.name}</span> to a shortlist
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Shortlist
            </label>
            {loadingShortlists ? (
              <div className="text-sm text-gray-500">Loading shortlists...</div>
            ) : shortlists.length === 0 ? (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-sm text-gray-600">No shortlists available. Create one first.</p>
              </div>
            ) : (
              <select
                value={selectedShortlistId}
                onChange={(e) => setSelectedShortlistId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Select a shortlist --</option>
                {shortlists.map((shortlist) => (
                  <option key={shortlist.id} value={shortlist.id}>
                    {shortlist.name} ({shortlist.candidate_count || 0} candidates)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleAddToShortlist}
              disabled={loading || !selectedShortlistId || loadingShortlists}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Add to Shortlist
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ScheduleInterviewModal = ({ isOpen, onClose, candidate, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
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
    if (!formData.job_title || !formData.interviewer || !formData.date || !formData.time) {
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
        student_id: candidate.id,
        candidate_name: candidate.name,
        candidate_email: candidate.email,
        candidate_phone: candidate.phone,
        job_title: formData.job_title,
        interviewer: formData.interviewer,
        interviewer_email: formData.interviewer_email,
        date: interviewDateTime.toISOString(),
        duration: formData.duration,
        status: 'scheduled',
        type: formData.type,
        meeting_type: formData.meeting_type,
        meeting_link: formData.meeting_link,
        meeting_notes: formData.meeting_notes
      };

      const { error } = await createInterview(interviewData);

      if (error) {
        throw new Error(error.message || 'Failed to schedule interview');
      }

      onSuccess?.();
      onClose();
      
      // Reset form
      setFormData({
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
              <h3 className="text-lg font-medium text-gray-900">Schedule Interview</h3>
              <p className="text-sm text-gray-500">Schedule an interview with {candidate?.name}</p>
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
            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.job_title}
                onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Software Engineer, Data Analyst"
              />
            </div>

            {/* Interviewer Details */}
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

            {/* Date and Time */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Date <span className="text-red-500">*</span>
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
            </div>

            {/* Duration and Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
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

            {/* Meeting Type and Link */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Platform
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
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={formData.meeting_notes}
                onChange={(e) => setFormData({...formData, meeting_notes: e.target.value})}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Any additional notes or instructions for the interview..."
              />
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
                  <CalendarIcon className="h-4 w-4 mr-1" />
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

const BadgeComponent = ({ badges }) => {
  const badgeConfig = {
    self_verified: { color: 'bg-gray-100 text-gray-800', label: 'Self' },
    institution_verified: { color: 'bg-blue-100 text-blue-800', label: 'Institution' },
    external_audited: { color: 'bg-yellow-100 text-yellow-800 border border-yellow-300', label: 'External' }
  };

  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((badge, index) => {
        const config = badgeConfig[badge] || { color: 'bg-gray-100 text-gray-800', label: badge };
        return (
          <span
            key={index}
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color}`}
          >
            {config.label}
          </span>
        );
      })}
    </div>
  );
};

const CandidateCard = ({ candidate, onViewProfile, onShortlist, onScheduleInterview }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{candidate.name}</h3>
          <p className="text-sm text-gray-500">{candidate.dept}</p>
          <p className="text-xs text-gray-400">{candidate.college} • {candidate.location}</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center mb-1">
            <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium text-gray-700 ml-1">{candidate.ai_score_overall}</span>
          </div>
          <BadgeComponent badges={candidate.badges} />
        </div>
      </div>

      {/* Skills */}
      <div className="mb-3">
        <div className="flex flex-wrap gap-1">
          {candidate.skills.slice(0, 5).map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
            >
              {skill}
            </span>
          ))}
          {candidate.skills.length > 5 && (
            <span className="text-xs text-gray-500">+{candidate.skills.length - 5} more</span>
          )}
        </div>
      </div>

      {/* Evidence snippets */}
      <div className="mb-4 space-y-1">
        {candidate.hackathon && (
          <p className="text-xs text-gray-600">
            🏆 Rank #{candidate.hackathon.rank} in {candidate.hackathon.event_id}
          </p>
        )}
        {candidate.internship && (
          <p className="text-xs text-gray-600">
            💼 {candidate.internship.org} ({candidate.internship.rating}⭐)
          </p>
        )}
        {candidate.projects && candidate.projects.length > 0 && (
          <p className="text-xs text-gray-600">
            🔬 {candidate.projects[0].title}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Updated {new Date(candidate.last_updated).toLocaleDateString()}
        </span>
        <div className="flex space-x-2">
          <button
            onClick={() => onViewProfile(candidate)}
            className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <EyeIcon className="h-3 w-3 mr-1" />
            Preview
          </button>
          <button 
            onClick={() => onShortlist(candidate)}
            className="inline-flex items-center px-2 py-1 border border-primary-300 rounded text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100"
          >
            <BookmarkIcon className="h-3 w-3 mr-1" />
            Shortlist
          </button>
          <button 
            onClick={() => onScheduleInterview(candidate)}
            className="inline-flex items-center px-2 py-1 border border-green-300 rounded text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100"
          >
            <CalendarIcon className="h-3 w-3 mr-1" />
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

type RecruiterOutletContext = {
  onViewProfile: (candidate: any) => void
}

const TalentPool = () => {
  const { onViewProfile } = useOutletContext<RecruiterOutletContext>()
  const { searchQuery } = useSearch();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [showFilters, setShowFilters] = useState(true);
  const [showShortlistModal, setShowShortlistModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [filters, setFilters] = useState({
    skills: [],
    courses: [],
    badges: [],
    locations: [],
    years: [],
    minScore: 0,
    maxScore: 100
  });

  const { students, loading, error } = useStudents();

  // Dynamically generate filter options from actual data
  const skillOptions = useMemo(() => {
    const skillCounts = {};
    students.forEach(student => {
      if (student.skills && Array.isArray(student.skills)) {
        student.skills.forEach(skill => {
          const normalizedSkill = skill.toLowerCase();
          skillCounts[normalizedSkill] = (skillCounts[normalizedSkill] || 0) + 1;
        });
      }
    });
    return Object.entries(skillCounts)
      .map(([skill, count]) => ({
        value: skill,
        label: skill.charAt(0).toUpperCase() + skill.slice(1),
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Show top 20 skills
  }, [students]);

  const courseOptions = useMemo(() => {
    const courseCounts = {};
    students.forEach(student => {
      if (student.dept) {
        const normalizedCourse = student.dept.toLowerCase();
        courseCounts[normalizedCourse] = (courseCounts[normalizedCourse] || 0) + 1;
      }
    });
    return Object.entries(courseCounts)
      .map(([course, count]) => ({
        value: course,
        label: course,
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [students]);

  const badgeOptions = useMemo(() => {
    const badgeCounts = {};
    students.forEach(student => {
      if (student.badges && Array.isArray(student.badges)) {
        student.badges.forEach(badge => {
          badgeCounts[badge] = (badgeCounts[badge] || 0) + 1;
        });
      }
    });
    return Object.entries(badgeCounts)
      .map(([badge, count]) => ({
        value: badge,
        label: badge.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [students]);

  const locationOptions = useMemo(() => {
    const locationCounts = {};
    students.forEach(student => {
      if (student.location) {
        const normalizedLocation = student.location.toLowerCase();
        locationCounts[normalizedLocation] = (locationCounts[normalizedLocation] || 0) + 1;
      }
    });
    return Object.entries(locationCounts)
      .map(([location, count]) => ({
        value: location,
        label: location.charAt(0).toUpperCase() + location.slice(1),
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [students]);

  const yearOptions = useMemo(() => {
    const yearCounts = {};
    students.forEach(student => {
      if (student.year) {
        yearCounts[student.year] = (yearCounts[student.year] || 0) + 1;
      }
    });
    return Object.entries(yearCounts)
      .map(([year, count]) => ({
        value: year,
        label: year,
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [students]);

  // Filter and sort students based on search query and filters
  const filteredAndSortedStudents = useMemo(() => {
    let result = students;

    // Apply search query filter
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(student => {
        if (student.name?.toLowerCase().includes(query)) return true;
        if (student.dept?.toLowerCase().includes(query)) return true;
        if (student.college?.toLowerCase().includes(query)) return true;
        if (student.location?.toLowerCase().includes(query)) return true;
        if (student.skills?.some(skill => skill.toLowerCase().includes(query))) return true;
        if (student.email?.toLowerCase().includes(query)) return true;
        return false;
      });
    }

    // Apply skill filters
    if (filters.skills.length > 0) {
      result = result.filter(student =>
        student.skills?.some(skill =>
          filters.skills.includes(skill.toLowerCase())
        )
      );
    }

    // Apply course/department filters
    if (filters.courses.length > 0) {
      result = result.filter(student =>
        filters.courses.includes(student.dept?.toLowerCase())
      );
    }

    // Apply badge filters
    if (filters.badges.length > 0) {
      result = result.filter(student =>
        student.badges?.some(badge =>
          filters.badges.includes(badge)
        )
      );
    }

    // Apply location filters
    if (filters.locations.length > 0) {
      result = result.filter(student =>
        filters.locations.includes(student.location?.toLowerCase())
      );
    }

    // Apply year filters
    if (filters.years.length > 0) {
      result = result.filter(student =>
        filters.years.includes(student.year)
      );
    }

    // Apply AI score range filter
    result = result.filter(student => {
      const score = student.ai_score_overall || 0;
      return score >= filters.minScore && score <= filters.maxScore;
    });

    // Apply sorting
    const sortedResult = [...result];
    switch (sortBy) {
      case 'ai_score':
        sortedResult.sort((a, b) => (b.ai_score_overall || 0) - (a.ai_score_overall || 0));
        break;
      case 'name':
        sortedResult.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'last_updated':
        sortedResult.sort((a, b) => 
          new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime()
        );
        break;
      case 'relevance':
      default:
        // Keep original order for relevance (or could implement custom relevance scoring)
        break;
    }

    return sortedResult;
  }, [students, searchQuery, filters, sortBy]);

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      skills: [],
      courses: [],
      badges: [],
      locations: [],
      years: [],
      minScore: 0,
      maxScore: 100
    });
  };

  const handleShortlistClick = (candidate) => {
    setSelectedCandidate(candidate);
    setShowShortlistModal(true);
  };

  const handleShortlistSuccess = () => {
    alert(`${selectedCandidate?.name} has been added to the shortlist!`);
    setShowShortlistModal(false);
    setSelectedCandidate(null);
  };

  const handleScheduleInterviewClick = (candidate) => {
    setSelectedCandidate(candidate);
    setShowInterviewModal(true);
  };

  const handleInterviewSuccess = () => {
    alert(`Interview scheduled for ${selectedCandidate?.name}!`);
    setShowInterviewModal(false);
    setSelectedCandidate(null);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">Talent Pool</h1>
          <span className="ml-2 text-sm text-gray-500">
            ({filteredAndSortedStudents.length} {searchQuery || filters.skills.length > 0 || filters.locations.length > 0 ? 'matching' : ''} candidates
            {(searchQuery || filters.skills.length > 0) && students.length !== filteredAndSortedStudents.length && ` of ${students.length} total`})
          </span>
          {searchQuery && (
            <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
              Searching: "{searchQuery}"
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 relative"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {(filters.skills.length + filters.courses.length + filters.badges.length + filters.locations.length + filters.years.length) > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">
                {filters.skills.length + filters.courses.length + filters.badges.length + filters.locations.length + filters.years.length}
              </span>
            )}
          </button>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                viewMode === 'grid'
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                viewMode === 'table'
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <TableCellsIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium text-gray-900">Filters</h2>
                <button 
                  onClick={handleClearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-0">
                <FilterSection title="Skills" defaultOpen>
                  <CheckboxGroup
                    options={skillOptions}
                    selectedValues={filters.skills}
                    onChange={(values) => setFilters({...filters, skills: values})}
                  />
                </FilterSection>

                <FilterSection title="Course/Track">
                  <CheckboxGroup
                    options={courseOptions}
                    selectedValues={filters.courses}
                    onChange={(values) => setFilters({...filters, courses: values})}
                  />
                </FilterSection>

                <FilterSection title="Verification Badge">
                  <CheckboxGroup
                    options={badgeOptions}
                    selectedValues={filters.badges}
                    onChange={(values) => setFilters({...filters, badges: values})}
                  />
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm font-medium text-yellow-800">
                        Only External-audited (Premium)
                      </span>
                    </label>
                  </div>
                </FilterSection>

                <FilterSection title="Location">
                  <CheckboxGroup
                    options={locationOptions}
                    selectedValues={filters.locations}
                    onChange={(values) => setFilters({...filters, locations: values})}
                  />
                </FilterSection>

                <FilterSection title="Academic Year">
                  <CheckboxGroup
                    options={yearOptions}
                    selectedValues={filters.years}
                    onChange={(values) => setFilters({...filters, years: values})}
                  />
                </FilterSection>

                <FilterSection title="AI Score Range">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Min Score: {filters.minScore}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={filters.minScore}
                        onChange={(e) => setFilters({...filters, minScore: parseInt(e.target.value)})}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Max Score: {filters.maxScore}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={filters.maxScore}
                        onChange={(e) => setFilters({...filters, maxScore: parseInt(e.target.value)})}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </FilterSection>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Results header */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{filteredAndSortedStudents.length}</span> result{filteredAndSortedStudents.length !== 1 ? 's' : ''}
                {searchQuery && <span className="text-gray-500"> for "{searchQuery}"</span>}
              </p>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="relevance">Sort by: Relevance</option>
                <option value="ai_score">Sort by: AI Score</option>
                <option value="last_updated">Sort by: Last Updated</option>
                <option value="name">Sort by: Name</option>
              </select>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-4">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading && <div className="text-sm text-gray-500">Loading students...</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}
                {!loading && filteredAndSortedStudents.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate as any}
                    onViewProfile={onViewProfile}
                    onShortlist={handleShortlistClick}
                    onScheduleInterview={handleScheduleInterviewClick}
                  />
                ))}
                {!loading && filteredAndSortedStudents.length === 0 && !error && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-sm text-gray-500">
                      {searchQuery || filters.skills.length > 0 || filters.locations.length > 0 
                        ? 'No candidates match your current filters' 
                        : 'No students found.'}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Try adjusting your search terms or filters.
                    </p>
                    {(filters.skills.length > 0 || filters.locations.length > 0 || filters.courses.length > 0) && (
                      <button
                        onClick={handleClearFilters}
                        className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Skills
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        AI Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedStudents.map((candidate) => (
                      <tr key={candidate.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {candidate.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {candidate.dept}
                              </div>
                              <BadgeComponent badges={candidate.badges} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {candidate.skills.slice(0, 3).map((skill, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {skill}
                              </span>
                            ))}
                              {candidate.skills && candidate.skills.length > 3 && (
                              <span className="text-xs text-gray-500">+{candidate.skills.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <StarIcon className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="text-sm font-medium text-gray-900">
                              {candidate.ai_score_overall}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {candidate.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => onViewProfile(candidate)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              View
                            </button>
                            <button 
                              onClick={() => handleShortlistClick(candidate)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              Shortlist
                            </button>
                            <button 
                              onClick={() => handleScheduleInterviewClick(candidate)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Schedule
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add to Shortlist Modal */}
      <AddToShortlistModal
        isOpen={showShortlistModal}
        onClose={() => {
          setShowShortlistModal(false);
          setSelectedCandidate(null);
        }}
        candidate={selectedCandidate}
        onSuccess={handleShortlistSuccess}
      />

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={showInterviewModal}
        onClose={() => {
          setShowInterviewModal(false);
          setSelectedCandidate(null);
        }}
        candidate={selectedCandidate}
        onSuccess={handleInterviewSuccess}
      />
    </div>
  );
};

export default TalentPool;
