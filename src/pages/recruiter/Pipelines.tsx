import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  EllipsisVerticalIcon,
  UserIcon,
  StarIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  PhoneIcon,
  XMarkIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  BellIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useStudents } from '../../hooks/useStudents';
import { useRequisitions } from '../../hooks/useRequisitions';
import { useNotifications } from '../../hooks/useNotifications';
import {
  getRequisitions,
  getPipelineCandidatesByStage,
  getPipelineCandidatesWithFilters,
  addCandidateToPipeline,
  moveCandidateToStage,
  updateNextAction
} from '../../services/pipelineService';
import { createNotification } from "../../services/notificationService";
import PipelineAdvancedFilters from '../../components/Recruiter/components/PipelineAdvancedFilters';
import PipelineSortMenu from '../../components/Recruiter/components/PipelineSortMenu';
import { PipelineFilters, PipelineSortOptions } from '../../types/recruiter';

// Add from Talent Pool Modal
const AddFromTalentPoolModal = ({ isOpen, onClose, requisitionId, targetStage, onSuccess }) => {
  const { students, loading: studentsLoading } = useStudents();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.dept?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.college?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCandidates = async () => {
    if (selectedStudents.length === 0) {
      setError('Please select at least one candidate');
      return;
    }

    setAdding(true);
    setError(null);

    try {
      const results = await Promise.all(
        selectedStudents.map(student =>
          addCandidateToPipeline({
            requisition_id: requisitionId,
            student_id: student.id,
            candidate_name: student.name,
            candidate_email: student.email,
            candidate_phone: student.phone,
            stage: targetStage,
            source: 'talent_pool'
          })
        )
      );

      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        const duplicates = errors.filter(e => e.error.message.includes('already'));
        if (duplicates.length > 0) {
          setError(`${duplicates.length} candidate(s) already in pipeline`);
        } else {
          throw new Error(errors[0].error.message);
        }
      }

      const successCount = results.filter(r => !r.error).length;

      let currentRecruiterId = null;
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          currentRecruiterId = user.id || user.recruiter_id;
        }
      } catch (e) {
        console.warn('Failed to parse user from localStorage:', e);
      }

      if (successCount > 0 && currentRecruiterId) {
        alert(`✅ Successfully added ${successCount} candidate(s) to pipeline!`);

        const notifResult = await createNotification(
          currentRecruiterId,
          targetStage === "sourced" ? "candidate_sourced" : "candidate_shortlisted", // ✅
          "Candidate(s) Added to Pipeline",
          `${successCount} candidate(s) were added to the ${targetStage} stage.`
        );

        if (!notifResult.success) {
          console.warn('Notification failed:', notifResult.error);
        }

        onSuccess?.();
        onClose();
        setSelectedStudents([]);
      }
    } catch (err) {
      console.error('Error adding candidates:', err);
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const toggleStudent = (student) => {
    setSelectedStudents(prev => {
      const exists = prev.find(s => s.id === student.id);
      if (exists) {
        return prev.filter(s => s.id !== student.id);
      }
      return [...prev, student];
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Add Candidates from Talent Pool</h3>
              <p className="text-sm text-gray-500">Select candidates to add to {targetStage} stage</p>
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

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, department, or college..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Selected Count */}
          {selectedStudents.length > 0 && (
            <div className="mb-3 text-sm text-gray-600">
              {selectedStudents.length} candidate(s) selected
            </div>
          )}

          {/* Student List */}
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
            {studentsLoading ? (
              <div className="p-8 text-center text-gray-500">Loading candidates...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No candidates found</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredStudents.map(student => {
                  const isSelected = selectedStudents.find(s => s.id === student.id);
                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleStudent(student)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''
                        }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={() => { }} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{student.name}</h4>
                              <p className="text-xs text-gray-500">{student.dept} • {student.college}</p>
                            </div>
                            <div className="flex items-center">
                              <StarIcon className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                              <span className="text-sm font-medium">{student.ai_score_overall}</span>
                            </div>
                          </div>
                          {student.skills && student.skills.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {student.skills.slice(0, 3).map((skill, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                  {skill}
                                </span>
                              ))}
                              {student.skills.length > 3 && (
                                <span className="text-xs text-gray-500">+{student.skills.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={adding}
            >
              Cancel
            </button>
            <button
              onClick={handleAddCandidates}
              disabled={adding || selectedStudents.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center"
            >
              {adding ? (
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
                  Add {selectedStudents.length} Candidate{selectedStudents.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Next Action Modal
const NextActionModal = ({ isOpen, onClose, candidate, onSuccess }) => {
  const [action, setAction] = useState('send_email');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const actions = [
    { value: 'send_email', label: 'Send Follow-up Email' },
    { value: 'schedule_interview', label: 'Schedule Interview' },
    { value: 'make_offer', label: 'Prepare Offer' },
    { value: 'follow_up', label: 'General Follow-up' },
    { value: 'review_application', label: 'Review Application' }
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateNextAction(
        candidate.id,
        action,
        date || null,
        notes || null
      );

      alert(`✅ Next action set: ${actions.find(a => a.value === action)?.label}`);

      const notifResult = await createNotification(
        candidate.requisition_id || candidate.id, // Make sure requisition_id is available
        "pipeline_stage_changed",
        "Next Action Updated",
        `Next action for ${candidate.candidate_name} set to ${actions.find(a => a.value === action)?.label}`
      );

      if (!notifResult.success) {
        console.warn('Notification failed:', notifResult.error);
      }

      onSuccess?.();
      onClose();

      setAction('send_email');
      setDate('');
      setNotes('');
    } catch (error) {
      console.error('Error setting next action:', error);
      alert('Failed to set next action. Please try again.');
    } finally {
      setSaving(false);
    }
  };


  if (!isOpen) return null;

  // Get tomorrow as minimum date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Set Next Action</h3>
              <p className="text-sm text-gray-500">{candidate?.candidate_name || candidate?.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Action Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Type
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {actions.map(act => (
                  <option key={act.value} value={act.value}>{act.label}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Date (Optional)
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={minDate}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Add any notes about this action..."
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Action'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const KanbanColumn = ({ title, count, color, candidates, onCandidateMove, onCandidateView, selectedCandidates, onToggleSelect, onSendEmail, onAddClick, onNextAction }) => {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="bg-gray-50 rounded-lg p-4 min-w-80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full ${color} mr-2`}></div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <span className="ml-2 bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {(candidates || []).map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            onMove={onCandidateMove}
            onView={onCandidateView}
            isSelected={selectedCandidates.includes(candidate.id)}
            onToggleSelect={onToggleSelect}
            onSendEmail={onSendEmail}
            onNextAction={onNextAction}
          />
        ))}

        {showAddForm && (
          <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Add candidate</span>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={onAddClick}
              className="w-full text-left text-sm text-primary-600 hover:text-primary-700"
            >
              + Add from talent pool
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const CandidateCard = ({ candidate, onMove, onView, isSelected, onToggleSelect, onSendEmail, onNextAction }) => {
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const stages = [
    'sourced',
    'screened',
    'interview_1',
    'interview_2',
    'offer',
    'hired'
  ];

  const stageLabels = {
    sourced: 'Sourced',
    screened: 'Screened',
    interview_1: 'Interview 1',
    interview_2: 'Interview 2',
    offer: 'Offer',
    hired: 'Hired'
  };

  return (
    <div className={`bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
      }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(candidate.id)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1 mr-2"
          />
          <div>
            <h4 className="font-medium text-gray-900 text-sm">{candidate.name}</h4>
            <p className="text-xs text-gray-500">{candidate.dept}</p>
            <p className="text-xs text-gray-400">{candidate.college}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <StarIcon className="h-3 w-3 text-yellow-400 fill-current" />
          <span className="text-xs font-medium">{candidate.ai_score_overall}</span>
          <div className="relative">
            <button
              onClick={() => setShowMoveMenu(!showMoveMenu)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <EllipsisVerticalIcon className="h-4 w-4" />
            </button>

            {showMoveMenu && (
              <div className="absolute right-0 top-6 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => onView(candidate)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => onSendEmail(candidate)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Send Email
                  </button>
                  <button
                    onClick={() => alert(`📞 Scheduling call with ${candidate.name}...\n\nThis would open a calendar interface to schedule a phone/video call.`)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Schedule Call
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  {stages.map(stage => (
                    <button
                      key={stage}
                      onClick={() => onMove(candidate.id, stage)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Move to {stageLabels[stage]}
                    </button>
                  ))}
                  <div className="border-t border-gray-100 my-1"></div>
                  <button className="w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-50">
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="mb-2">
        <div className="flex flex-wrap gap-1">
          {candidate.skills && candidate.skills.length > 0 ? (
            <>
              {candidate.skills.slice(0, 2).map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {skill}
                </span>
              ))}
              {candidate.skills.length > 2 && (
                <span className="text-xs text-gray-500">+{candidate.skills.length - 2}</span>
              )}
            </>
          ) : (
            <span className="text-xs text-gray-400 italic">No skills listed</span>
          )}
        </div>
      </div>

      {/* Next Action */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">
          {candidate.last_updated && `Updated ${new Date(candidate.last_updated).toLocaleDateString()}`}
        </span>
        <button
          onClick={() => onNextAction?.(candidate)}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Next Action
        </button>
      </div>
    </div>
  );
};

const Pipelines = ({ onViewProfile }) => {
  // Fetch requisitions from Supabase
  const { requisitions, loading: requisitionsLoading, error: requisitionsError } = useRequisitions();

  const [selectedJob, setSelectedJob] = useState(null);
  const { students, loading, error } = useStudents();
  const [pipelineData, setPipelineData] = useState({
    sourced: [],
    screened: [],
    interview_1: [],
    interview_2: [],
    offer: [],
    hired: []
  });

  let currentRecruiterId = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      currentRecruiterId = user.id || user.recruiter_id;
    }
  } catch (e) {
    console.warn('Failed to parse user from localStorage:', e);
  }

  const {
    items: notifications,
    unreadCount,
    markRead: markNotificationRead,
    remove: removeNotification
  } = useNotifications(currentRecruiterId);

  // Modal states
  const [showAddFromTalentPool, setShowAddFromTalentPool] = useState(false);
  const [addToStage, setAddToStage] = useState(null);
  const [showNextActionModal, setShowNextActionModal] = useState(false);
  const [selectedCandidateForAction, setSelectedCandidateForAction] = useState(null);

  // Filter states
  const [filters, setFilters] = useState<PipelineFilters>({
    stages: [],
    skills: [],
    departments: [],
    locations: [],
    sources: [],
    aiScoreRange: {},
    nextActionTypes: [],
    hasNextAction: null,
    assignedTo: [],
    dateAdded: { preset: undefined, startDate: undefined, endDate: undefined },
    lastUpdated: { preset: undefined, startDate: undefined, endDate: undefined }
  });

  // Sort states
  const [sortOptions, setSortOptions] = useState<PipelineSortOptions>({
    field: 'updated_at',
    direction: 'desc'
  });

  // Set initial selected job when requisitions load
  React.useEffect(() => {
    if (!requisitionsLoading && requisitions.length > 0 && !selectedJob) {
      setSelectedJob(requisitions[0].id);
    }
  }, [requisitionsLoading, requisitions, selectedJob]);

  // Fetch pipeline candidates when job, filters, or sort changes
  React.useEffect(() => {
    if (selectedJob) {
      loadPipelineCandidates();
    }
  }, [selectedJob, filters, sortOptions]);

  const loadPipelineCandidates = async () => {
    if (!selectedJob) return;

    console.log('Loading pipeline candidates for job:', selectedJob, 'with filters:', filters, 'and sort:', sortOptions);
    
    // Check if any filters are active
    const hasActiveFilters = 
      filters.stages.length > 0 ||
      filters.skills.length > 0 ||
      filters.departments.length > 0 ||
      filters.locations.length > 0 ||
      filters.sources.length > 0 ||
      filters.aiScoreRange.min !== undefined ||
      filters.aiScoreRange.max !== undefined ||
      filters.nextActionTypes.length > 0 ||
      filters.hasNextAction !== null ||
      filters.assignedTo.length > 0;

    if (hasActiveFilters) {
      // Use filtered query with sorting
      const { data, error } = await getPipelineCandidatesWithFilters(selectedJob, filters, sortOptions);
      
      if (!error && data) {
        // Group by stage
        const stages = ['sourced', 'screened', 'interview_1', 'interview_2', 'offer', 'hired'];
        const newData = {};
        
        stages.forEach(stage => {
          newData[stage] = data
            .filter(pc => pc.stage === stage)
            .map(pc => ({
              id: pc.id,
              name: pc.candidate_name || 'N/A',
              email: pc.candidate_email || '',
              phone: pc.candidate_phone || '',
              dept: pc.students?.dept || 'N/A',
              college: pc.students?.college || 'N/A',
              location: pc.students?.location || 'N/A',
              skills: Array.isArray(pc.students?.skills) ? pc.students.skills : [],
              ai_score_overall: pc.students?.ai_score_overall || 0,
              last_updated: pc.updated_at || pc.created_at,
              student_id: pc.student_id
            }));
        });
        
        console.log('Filtered pipeline data:', newData);
        setPipelineData(newData);
      } else {
        console.error('Error loading filtered candidates:', error);
      }
    } else {
      // Use original stage-by-stage query (no filters, but apply sorting)
      const stages = ['sourced', 'screened', 'interview_1', 'interview_2', 'offer', 'hired'];
      const newData = {};

      // If custom sort is applied, fetch all and sort
      if (sortOptions.field !== 'updated_at' || sortOptions.direction !== 'desc') {
        const { data: allData, error: allError } = await getPipelineCandidatesWithFilters(
          selectedJob, 
          { stages: [], skills: [], departments: [], locations: [], sources: [], aiScoreRange: {}, nextActionTypes: [], hasNextAction: null, assignedTo: [], dateAdded: {}, lastUpdated: {} },
          sortOptions
        );

        if (!allError && allData) {
          stages.forEach(stage => {
            newData[stage] = allData
              .filter(pc => pc.stage === stage)
              .map(pc => ({
                id: pc.id,
                name: pc.candidate_name || 'N/A',
                email: pc.candidate_email || '',
                phone: pc.candidate_phone || '',
                dept: pc.students?.dept || 'N/A',
                college: pc.students?.college || 'N/A',
                location: pc.students?.location || 'N/A',
                skills: Array.isArray(pc.students?.skills) ? pc.students.skills : [],
                ai_score_overall: pc.students?.ai_score_overall || 0,
                last_updated: pc.updated_at || pc.created_at,
                student_id: pc.student_id
              }));
          });
        }

        console.log('Sorted pipeline data:', newData);
        setPipelineData(newData);
        return;
      }

      // Default behavior - stage by stage
      for (const stage of stages) {
        const { data, error } = await getPipelineCandidatesByStage(selectedJob, stage);
        console.log(`Stage ${stage}:`, { data, error });

        if (!error && data) {
          // Map pipeline_candidates to match expected format
          newData[stage] = data.map(pc => {
            const mappedCandidate = {
              id: pc.id,
              name: pc.candidate_name || 'N/A',
              email: pc.candidate_email || '',
              phone: pc.candidate_phone || '',
              dept: pc.students?.dept || 'N/A',
              college: pc.students?.college || 'N/A',
              location: pc.students?.location || 'N/A',
              skills: Array.isArray(pc.students?.skills) ? pc.students.skills : [],
              ai_score_overall: pc.students?.ai_score_overall || 0,
              last_updated: pc.updated_at || pc.created_at,
              student_id: pc.student_id
            };
            console.log('Mapped candidate:', mappedCandidate);
            return mappedCandidate;
          });
        } else {
          newData[stage] = [];
          if (error) {
            console.error(`Error loading ${stage} candidates:`, error);
          }
        }
      }

      console.log('Final pipeline data:', newData);
      setPipelineData(newData);
    }
  };

  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const selectedJobDetails = requisitions.find(job => job.id === selectedJob);

  const stages = [
    { key: 'sourced', label: 'Sourced', color: 'bg-gray-400' },
    { key: 'screened', label: 'Screened', color: 'bg-blue-400' },
    { key: 'interview_1', label: 'Interview 1', color: 'bg-yellow-400' },
    { key: 'interview_2', label: 'Interview 2', color: 'bg-orange-400' },
    { key: 'offer', label: 'Offer', color: 'bg-green-400' },
    { key: 'hired', label: 'Hired', color: 'bg-emerald-400' }
  ];

  const handleCandidateMove = async (candidateId, newStage) => {
    try {
      const result = await moveCandidateToStage(candidateId, newStage);

      if (result.error) {
        alert('Failed to move candidate: ' + result.error.message);
        return;
      }

      let movedCandidate = null;

      // Update local state
      setPipelineData(prev => {
        const newData = { ...prev };

        Object.keys(newData).forEach(stage => {
          newData[stage] = newData[stage].filter(candidate => {
            if (candidate.id === candidateId) {
              movedCandidate = candidate;
              return false;
            }
            return true;
          });
        });

        if (movedCandidate && newData[newStage]) {
          newData[newStage].push({
            ...movedCandidate,
            last_updated: new Date().toISOString(),
          });
        }

        return newData;
      });

      alert('✅ Candidate moved successfully!');

      // Create notification with proper error handling
      if (movedCandidate && selectedJob) {
        // Extract recruiter ID from the user object stored in localStorage
        let notificationRecruiterId = null;
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            notificationRecruiterId = user.id || user.recruiter_id;
          }
        } catch (e) {
          console.warn('Failed to parse user from localStorage:', e);
        }


        const notifResult = await createNotification(
          notificationRecruiterId,
          "pipeline_stage_changed",
          `Candidate moved to ${newStage}`,
          `${movedCandidate.name} has been moved to the "${newStage}" stage.`
        );

        if (!notifResult.success) {
          console.warn('Notification failed:', notifResult.error);
        }
      }

    } catch (error) {
      console.error('Error moving candidate:', error);
      alert('Failed to move candidate. Please try again.');
    }
  };


  const getTotalCandidates = () => {
    return Object.values(pipelineData).reduce((total, stage) => total + stage.length, 0);
  };

  const getConversionRate = (fromStage, toStage) => {
    const fromCount = pipelineData[fromStage]?.length || 0;
    const toCount = pipelineData[toStage]?.length || 0;
    if (fromCount === 0) return 0;
    return Math.round((toCount / fromCount) * 100);
  };

  const handleBulkEmail = () => {
    const candidateNames = selectedCandidates.map(id => {
      const candidate = Object.values(pipelineData)
        .flat()
        .find(c => c.id === id);
      return candidate?.name;
    }).filter(Boolean);

    if (candidateNames.length === 0) {
      alert('Please select candidates first');
      return;
    }

    const emailSubject = `Update regarding ${selectedJobDetails?.title || 'Job Application'}`;
    const emailBody = `Dear Candidate,\n\nWe would like to update you on your application status for the position of ${selectedJobDetails?.title || 'the role'}.\n\nBest regards,\nRecruitment Team`;

    // Simulate sending emails
    alert(`📧 Bulk Email Sent!\n\nRecipients: ${candidateNames.join(', ')}\nSubject: ${emailSubject}\n\nEmails have been queued for delivery.`);

    setSelectedCandidates([]);
    setShowBulkActions(false);
  };

  const handleBulkWhatsApp = () => {
    const candidateNames = selectedCandidates.map(id => {
      const candidate = Object.values(pipelineData)
        .flat()
        .find(c => c.id === id);
      return candidate?.name;
    }).filter(Boolean);

    if (candidateNames.length === 0) {
      alert('Please select candidates first');
      return;
    }

    const message = `Hi! This is an update regarding your application for ${selectedJobDetails?.title || 'the position'}. We will be in touch soon with next steps.`;

    // Simulate sending WhatsApp messages
    alert(`📱 WhatsApp Messages Sent!\n\nRecipients: ${candidateNames.join(', ')}\nMessage: "${message}"\n\nMessages have been delivered.`);

    setSelectedCandidates([]);
    setShowBulkActions(false);
  };

  const handleAssignInterviewer = () => {
    const candidateNames = selectedCandidates.map(id => {
      const candidate = Object.values(pipelineData)
        .flat()
        .find(c => c.id === id);
      return candidate?.name;
    }).filter(Boolean);

    if (candidateNames.length === 0) {
      alert('Please select candidates first');
      return;
    }

    const interviewer = prompt('Enter interviewer name:', 'Sarah Johnson');
    if (interviewer) {
      alert(`👤 Interviewer Assigned!\n\nCandidates: ${candidateNames.join(', ')}\nAssigned to: ${interviewer}\n\nInterview invitations will be sent shortly.`);

      setSelectedCandidates([]);
      setShowBulkActions(false);
    }
  };

  const handleBulkReject = async () => {
    const candidateNames = selectedCandidates.map(id => {
      const candidate = Object.values(pipelineData)
        .flat()
        .find(c => c.id === id);
      return candidate?.name;
    }).filter(Boolean);

    if (candidateNames.length === 0) {
      alert('Please select candidates first');
      return;
    }

    const confirmed = confirm(
      `⚠️ Bulk Reject Confirmation\n\nAre you sure you want to reject ${candidateNames.length} candidate(s)?\n\n${candidateNames.join(', ')}\n\nThis action cannot be undone.`
    );

    if (confirmed) {
      const reason = prompt(
        'Enter rejection reason (optional):',
        'Thank you for your interest. We have decided to move forward with other candidates.'
      );

      setPipelineData(prev => {
        const newData = { ...prev };
        selectedCandidates.forEach(candidateId => {
          Object.keys(newData).forEach(stage => {
            newData[stage] = newData[stage].filter(candidate => candidate.id !== candidateId);
          });
        });
        return newData;
      });

      alert(
        `❌ Candidates Rejected\n\n${candidateNames.join(', ')} have been removed from the pipeline.\n\nRejection notifications will be sent.`
      );

      const notifResult = await createNotification(
        selectedJob ,
        "candidate_rejected",
        "Candidates Rejected",
        `${candidateNames.length} candidate(s) were rejected from ${selectedJobDetails?.title || "pipeline"}.`
      );

      if (!notifResult.success) {
        console.warn('Notification failed:', notifResult.error);
      }

      setSelectedCandidates([]);
      setShowBulkActions(false);
    }
  };

  const handleExportPipeline = () => {
    const allCandidates = Object.entries(pipelineData).flatMap(([stage, candidates]) =>
      candidates.map(candidate => ({ ...candidate, stage }))
    );

    if (allCandidates.length === 0) {
      alert('No candidates in pipeline to export');
      return;
    }

    const csvContent = [
      // CSV Header
      'Name,Department,College,Location,Stage,AI Score,Skills,Last Updated',
      // CSV Data
      ...allCandidates.map(candidate =>
        `"${candidate.name}","${candidate.dept}","${candidate.college}","${candidate.location}","${candidate.stage}",${candidate.ai_score_overall},"${candidate.skills.join('; ')}","${new Date(candidate.last_updated).toLocaleDateString()}"`
      )
    ].join('\n');

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pipeline_${selectedJobDetails?.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`📊 Pipeline Exported!\n\nFile: pipeline_${selectedJobDetails?.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv\n\n${allCandidates.length} candidates exported successfully.`);
  };

  const handleAddCandidates = () => {
    alert(`👥 Add Candidates\n\nThis would open a modal to:\n• Search and select from talent pool\n• Import candidates from other jobs\n• Add new candidates directly\n\nFeature coming soon!`);
  };

  const toggleCandidateSelection = (candidateId) => {
    setSelectedCandidates(prev => {
      const newSelection = prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId];

      setShowBulkActions(newSelection.length > 0);
      return newSelection;
    });
  };

  const handleSendEmail = (candidate) => {
    const subject = `Update regarding ${selectedJobDetails?.title || 'your application'}`;
    const message = `Dear ${candidate.name},\n\nWe wanted to provide you with an update on your application for the ${selectedJobDetails?.title || 'position'}.\n\nYour application is currently in the review process and we will be in touch with next steps soon.\n\nBest regards,\nRecruitment Team`;

    alert(`📧 Email Sent to ${candidate.name}!\n\nSubject: ${subject}\n\nMessage: "${message}"\n\nEmail has been delivered successfully.`);
  };

  const handleAddFromTalentPool = (stage) => {
    setAddToStage(stage);
    setShowAddFromTalentPool(true);
  };

  const handleNextAction = (candidate) => {
    setSelectedCandidateForAction(candidate);
    setShowNextActionModal(true);
  };

  const handleResetFilters = () => {
    setFilters({
      stages: [],
      skills: [],
      departments: [],
      locations: [],
      sources: [],
      aiScoreRange: {},
      nextActionTypes: [],
      hasNextAction: null,
      assignedTo: [],
      dateAdded: { preset: undefined, startDate: undefined, endDate: undefined },
      lastUpdated: { preset: undefined, startDate: undefined, endDate: undefined }
    });
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Pipeline Management</h1>
              {selectedJobDetails && (
                <p className="text-sm text-gray-500 mt-1">
                  {selectedJobDetails.title} • {selectedJobDetails.location} • {selectedJobDetails.openings} openings
                </p>
              )}
            </div>
            <select
              value={selectedJob || ''}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {requisitions.map(job => (
                <option key={job.id} value={job.id}>
                  {job.title} ({job.location})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">{getTotalCandidates()}</span> candidates in pipeline
            </div>
            <div>
              <span className="font-medium">{selectedJobDetails?.owner || 'Unassigned'}</span> owner
            </div>
            <div>
              <span className="font-medium">
                {selectedJobDetails?.created_date ?
                  Math.floor((new Date() - new Date(selectedJobDetails.created_date)) / (1000 * 60 * 60 * 24))
                  : 0
                } days
              </span> aging
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Stats & Filters */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center">
            <span className="text-gray-600">Conversion:</span>
            <span className="ml-2 font-medium">
              Sourced → Screened ({getConversionRate('sourced', 'screened')}%)
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-medium">
              Interview → Offer ({getConversionRate('interview_1', 'offer')}%)
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-medium">
              Offer → Hired ({getConversionRate('offer', 'hired')}%)
            </span>
          </div>
          </div>
          <div className="flex items-center gap-3">
            <PipelineSortMenu
              sortOptions={sortOptions}
              onSortChange={setSortOptions}
            />
            <PipelineAdvancedFilters
              filters={filters}
              onFiltersChange={setFilters}
              onReset={handleResetFilters}
            />
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex space-x-6 h-full">
          {stages.map(stage => (
            <KanbanColumn
              key={stage.key}
              title={stage.label}
              count={pipelineData[stage.key]?.length || 0}
              color={stage.color}
              candidates={pipelineData[stage.key] || []}
              onCandidateMove={handleCandidateMove}
              onCandidateView={onViewProfile}
              selectedCandidates={selectedCandidates}
              onToggleSelect={toggleCandidateSelection}
              onSendEmail={handleSendEmail}
              onAddClick={() => handleAddFromTalentPool(stage.key)}
              onNextAction={handleNextAction}
            />
          ))}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {showBulkActions ? (
              <>
                <span className="text-sm text-gray-600">
                  {selectedCandidates.length} selected - Bulk Actions:
                </span>
                <button
                  onClick={handleBulkEmail}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Send Email
                </button>
                <button
                  onClick={handleBulkWhatsApp}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  WhatsApp Message
                </button>
                <button
                  onClick={handleAssignInterviewer}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Assign Interviewer
                </button>
                <button
                  onClick={handleBulkReject}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Bulk Reject
                </button>
                <button
                  onClick={() => {
                    setSelectedCandidates([]);
                    setShowBulkActions(false);
                  }}
                  className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                >
                  Clear Selection
                </button>
              </>
            ) : (
              <span className="text-sm text-gray-600">
                Select candidates to enable bulk actions
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleAddCandidates}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <UserIcon className="h-4 w-4 mr-2" />
              Add Candidates
            </button>
            <button
              onClick={handleExportPipeline}
              className="inline-flex items-center px-3 py-2 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100"
            >
              Export Pipeline
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddFromTalentPoolModal
        isOpen={showAddFromTalentPool}
        onClose={() => setShowAddFromTalentPool(false)}
        requisitionId={selectedJob}
        targetStage={addToStage}
        onSuccess={loadPipelineCandidates}
      />

      <NextActionModal
        isOpen={showNextActionModal}
        onClose={() => setShowNextActionModal(false)}
        candidate={selectedCandidateForAction}
        onSuccess={loadPipelineCandidates}
      />
    </div>
  );
};

export default Pipelines;