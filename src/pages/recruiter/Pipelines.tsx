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
  XCircleIcon,
  FunnelIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { useStudents } from '../../hooks/useStudents';
import { useOpportunities } from '../../hooks/useOpportunities';
import { useNotifications } from '../../hooks/useNotifications';
import {
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
import { supabase } from '../../lib/supabaseClient';
import AppliedJobsService from '../../services/AppliedJobsService';
import { useToast } from '../../components/Recruiter/components/Toast';
import { PipelineEmptyState } from '../../components/Recruiter/components/EmptyState';
import { CandidateCardSkeleton, ColumnLoadingSkeleton } from '../../components/Recruiter/components/LoadingSkeleton';
import { CandidateQuickView } from '../../components/Recruiter/components/CandidateQuickView';
import { PipelineStats, QuickStats } from '../../components/Recruiter/components/PipelineStats';
import { ActivityIndicators } from '../../components/Recruiter/components/ActivityIndicators';

// Add from Talent Pool Modal
const AddFromTalentPoolModal = ({ isOpen, onClose, requisitionId, targetStage, onSuccess }) => {
  const { students, loading: studentsLoading } = useStudents();
  const { addToast } = useToast();
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
            opportunity_id: requisitionId,
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
          // Still refresh the pipeline to show existing candidates
          setTimeout(() => {
            onSuccess?.();
            onClose();
            setSelectedStudents([]);
          }, 2000); // Show error for 2 seconds then close
          return; // Don't process further
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
      }

      if (successCount > 0 && currentRecruiterId) {
        addToast(
          'success',
          'Candidates Added!',
          `Successfully added ${successCount} candidate(s) to ${targetStage} stage`
        );

        const notifResult = await createNotification(
          currentRecruiterId,
          targetStage === "sourced" ? "candidate_sourced" : "candidate_shortlisted",
          "Candidate(s) Added to Pipeline",
          `${successCount} candidate(s) were added to the ${targetStage} stage.`
        );

        if (!notifResult.success) {
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
  const { addToast } = useToast();
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

      addToast(
        'success',
        'Next Action Set',
        actions.find(a => a.value === action)?.label || 'Action updated successfully'
      );

      const notifResult = await createNotification(
        candidate.requisition_id || candidate.id, // Make sure requisition_id is available
        "pipeline_stage_changed",
        "Next Action Updated",
        `Next action for ${candidate.candidate_name} set to ${actions.find(a => a.value === action)?.label}`
      );

      if (!notifResult.success) {
      }

      onSuccess?.();
      onClose();

      setAction('send_email');
      setDate('');
      setNotes('');
    } catch (error) {
      console.error('Error setting next action:', error);
      addToast('error', 'Error', 'Failed to set next action. Please try again.');
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

const KanbanColumn = ({ title, count, color, candidates, onCandidateMove, onCandidateView, selectedCandidates, onToggleSelect, onSendEmail, onAddClick, onNextAction, stageKey, movingCandidates }) => {
  const [showAddForm, setShowAddForm] = useState(false);

  const getBorderColor = (color) => {
    const colorMap = {
      'bg-gray-400': 'border-l-gray-400',
      'bg-blue-400': 'border-l-blue-400',
      'bg-yellow-400': 'border-l-yellow-400',
      'bg-orange-400': 'border-l-orange-400',
      'bg-green-400': 'border-l-green-400',
      'bg-emerald-400': 'border-l-emerald-400',
    };
    return colorMap[color] || 'border-l-gray-400';
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 min-w-80 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${color} shadow-sm`}></div>
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          <span className="bg-white text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm border border-gray-200 tabular-nums">
            {count}
          </span>
        </div>
        <button
          onClick={() => onAddClick()}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
          title="Add candidate"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3 overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 400px)' }}>
        {(candidates || []).length === 0 ? (
          <PipelineEmptyState stage={stageKey} onAddClick={onAddClick} />
        ) : (
          (candidates || []).map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onMove={onCandidateMove}
              onView={onCandidateView}
              isSelected={selectedCandidates.includes(candidate.id)}
              onToggleSelect={onToggleSelect}
              onSendEmail={onSendEmail}
              onNextAction={onNextAction}
              stageColor={getBorderColor(color)}
              isMoving={movingCandidates?.includes(candidate.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

const CandidateCard = ({ candidate, onMove, onView, isSelected, onToggleSelect, onSendEmail, onNextAction, stageColor, isMoving }) => {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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

  // Get initials for avatar
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get source badge color
  const getSourceBadge = (source) => {
    const badges = {
      talent_pool: { label: 'Talent Pool', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      direct: { label: 'Direct', color: 'bg-green-100 text-green-700 border-green-200' },
      referral: { label: 'Referral', color: 'bg-purple-100 text-purple-700 border-purple-200' },
      application: { label: 'Applied', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    };
    return badges[source] || { label: source, color: 'bg-gray-100 text-gray-700 border-gray-200' };
  };

  const sourceBadge = candidate.source ? getSourceBadge(candidate.source) : null;

  return (
    <div 
      className={`group relative bg-white border-l-4 rounded-lg p-4 shadow-sm transition-all duration-200 cursor-pointer ${
        isSelected 
          ? `border-l-primary-500 bg-primary-50 shadow-md ring-2 ring-primary-200` 
          : `${stageColor} hover:shadow-lg hover:-translate-y-0.5`
      } ${isMoving ? 'opacity-60' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onView(candidate)}
    >
      {/* Loading Overlay */}
      {isMoving && (
        <div className="absolute inset-0 bg-white bg-opacity-50 rounded-lg flex items-center justify-center z-10">
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium text-gray-700">Moving...</span>
          </div>
        </div>
      )}
      <div className="flex items-start space-x-3 mb-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
            {getInitials(candidate.name || 'NA')}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm truncate">{candidate.name}</h4>
              <p className="text-xs text-gray-600 mt-0.5">{candidate.dept}</p>
              <p className="text-xs text-gray-500">{candidate.college}</p>
            </div>
            
            {/* Score Badge */}
            <div className="flex items-center space-x-2 ml-2">
              <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-200">
                <StarIcon className="h-3.5 w-3.5 text-yellow-500 fill-current" />
                <span className="text-xs font-bold text-yellow-700 tabular-nums">{candidate.ai_score_overall || 0}</span>
              </div>
            </div>
          </div>
          
          {/* Source Badge & Activity Indicator */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {sourceBadge && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${sourceBadge.color}`}>
                {sourceBadge.label}
              </span>
            )}
            <ActivityIndicators 
              lastUpdated={candidate.last_updated}
              createdAt={candidate.created_at}
            />
          </div>
        </div>

        {/* Checkbox - visible on hover or when selected */}
        <div className={`flex-shrink-0 transition-opacity ${
          isSelected || isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect(candidate.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
        </div>

        {/* Menu Button */}
        <div className="flex-shrink-0 relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMoveMenu(!showMoveMenu);
            }}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <EllipsisVerticalIcon className="h-5 w-5" />
          </button>

          {showMoveMenu && (
            <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-20">
              <div className="py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(candidate);
                    setShowMoveMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  View Profile
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendEmail(candidate);
                    setShowMoveMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Send Email
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNextAction?.(candidate);
                    setShowMoveMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <ClockIcon className="h-4 w-4 mr-2" />
                  Set Next Action
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <div className="px-2 py-1 text-xs font-semibold text-gray-500">Move to:</div>
                {stages.map(stage => (
                  <button
                    key={stage}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMove(candidate.id, stage);
                      setShowMoveMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {stageLabels[stage]}
                  </button>
                ))}
                <div className="border-t border-gray-100 my-1"></div>
                <button 
                  onClick={(e) => e.stopPropagation()}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Skills */}
      <div className="mb-3">
        <div className="flex flex-wrap gap-1.5">
          {candidate.skills && candidate.skills.length > 0 ? (
            <>
              {candidate.skills.slice(0, 3).map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors"
                  title={skill}
                >
                  {skill}
                </span>
              ))}
              {candidate.skills.length > 3 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                  +{candidate.skills.length - 3} more
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-gray-400 italic">No skills listed</span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          {candidate.last_updated && (
            <span title={new Date(candidate.last_updated).toLocaleString()}>
              {new Date(candidate.last_updated).toLocaleDateString()}
            </span>
          )}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNextAction?.(candidate);
          }}
          className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
        >
          Next Action →
        </button>
      </div>
    </div>
  );
};

const Pipelines = ({ onViewProfile }) => {
  // Hooks
  const { opportunities, loading: opportunitiesLoading, error: opportunitiesError } = useOpportunities();
  const { students, loading, error } = useStudents();
  const { addToast } = useToast();

  // State
  const [selectedJob, setSelectedJob] = useState(null);
  const [pipelineData, setPipelineData] = useState({
    sourced: [],
    screened: [],
    interview_1: [],
    interview_2: [],
    offer: [],
    hired: []
  });
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [movingCandidates, setMovingCandidates] = useState<number[]>([]);

  let currentRecruiterId = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      currentRecruiterId = user.id || user.recruiter_id;
    }
  } catch (e) {
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

  // Set initial selected job when opportunities load (prefer most recently updated)
  React.useEffect(() => {
    if (!opportunitiesLoading && opportunities.length > 0 && !selectedJob) {
      // Sort opportunities by most recently updated first
      const sortedOpportunities = [...opportunities].sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at || '');
        const dateB = new Date(b.updated_at || b.created_at || '');
        return dateB.getTime() - dateA.getTime();
      });
      setSelectedJob(sortedOpportunities[0].id);
    }
  }, [opportunitiesLoading, opportunities, selectedJob]);

  // Fetch pipeline candidates when job, filters, or sort changes
  React.useEffect(() => {
    if (selectedJob) {
      loadPipelineCandidates();
    } else {
    }
  }, [selectedJob, filters, sortOptions]);

  const loadPipelineCandidates = async () => {
    
    if (!selectedJob) {
      return;
    }

    
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
        const newData: any = {
          sourced: [],
          screened: [],
          interview_1: [],
          interview_2: [],
          offer: [],
          hired: []
        };
        
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
        
        setPipelineData(newData);
      } else {
        console.error('[Pipelines] Error loading filtered candidates:', error);
      }
    } else {
      // Use original stage-by-stage query (no filters, but apply sorting)
      const stages = ['sourced', 'screened', 'interview_1', 'interview_2', 'offer', 'hired'];
      const newData: any = {
        sourced: [],
        screened: [],
        interview_1: [],
        interview_2: [],
        offer: [],
        hired: []
      };

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

        setPipelineData(newData);
        return;
      }

      // Default behavior - stage by stage
      for (const stage of stages) {
        const { data, error } = await getPipelineCandidatesByStage(selectedJob, stage);

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
            return mappedCandidate;
          });
        } else {
          newData[stage] = [];
          if (error) {
            console.error(`[Pipelines] Error loading ${stage} candidates:`, error);
          } else {
          }
        }
      }

      setPipelineData(newData);
    }
  };

  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const selectedJobDetails = opportunities.find(job => job.id === selectedJob);
  const jobTitle = selectedJobDetails?.job_title || selectedJobDetails?.title || 'Job';

  const stages = [
    { key: 'sourced', label: 'Sourced', color: 'bg-gray-400' },
    { key: 'screened', label: 'Screened', color: 'bg-blue-400' },
    { key: 'interview_1', label: 'Interview 1', color: 'bg-yellow-400' },
    { key: 'interview_2', label: 'Interview 2', color: 'bg-orange-400' },
    { key: 'offer', label: 'Offer', color: 'bg-green-400' },
    { key: 'hired', label: 'Hired', color: 'bg-emerald-400' }
  ];

  const handleCandidateMove = async (candidateId, newStage) => {
    let movedCandidate = null;
    let oldStage = null;

    // Find current stage
    Object.keys(pipelineData).forEach(stage => {
      const candidate = pipelineData[stage].find(c => c.id === candidateId);
      if (candidate) {
        movedCandidate = candidate;
        oldStage = stage;
      }
    });

    if (!movedCandidate) return;

    // Show loading state immediately
    setMovingCandidates(prev => [...prev, candidateId]);

    // Optimistic UI update
    setPipelineData(prev => {
      const newData = { ...prev };

      Object.keys(newData).forEach(stage => {
        newData[stage] = newData[stage].filter(candidate => candidate.id !== candidateId);
      });

      if (newData[newStage]) {
        newData[newStage].push({
          ...movedCandidate,
          last_updated: new Date().toISOString(),
        });
      }

      return newData;
    });

    try {
      const result = await moveCandidateToStage(candidateId, newStage);

      if (result.error) {
        // Revert optimistic update on error
        setPipelineData(prev => {
          const newData = { ...prev };
          newData[newStage] = newData[newStage].filter(c => c.id !== candidateId);
          if (oldStage && newData[oldStage]) {
            newData[oldStage].push(movedCandidate);
          }
          return newData;
        });
        
        addToast('error', 'Move Failed', result.error.message);
        setMovingCandidates(prev => prev.filter(id => id !== candidateId));
        return;
      }

      addToast('success', 'Candidate Moved!', `Successfully moved to ${newStage.replace('_', ' ')}`);

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
        }


        const notifResult = await createNotification(
          notificationRecruiterId,
          "pipeline_stage_changed",
          `Candidate moved to ${newStage}`,
          `${movedCandidate.name} has been moved to the "${newStage}" stage.`
        );

        if (!notifResult.success) {
        }
      }

    } catch (error) {
      console.error('Error moving candidate:', error);
      
      // Revert optimistic update on error
      setPipelineData(prev => {
        const newData = { ...prev };
        newData[newStage] = newData[newStage].filter(c => c.id !== candidateId);
        if (oldStage && newData[oldStage]) {
          newData[oldStage].push(movedCandidate);
        }
        return newData;
      });
      
      addToast('error', 'Error', 'Failed to move candidate. Please try again.');
    } finally {
      // Always remove loading state
      setMovingCandidates(prev => prev.filter(id => id !== candidateId));
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
      addToast('warning', 'No Selection', 'Please select candidates first');
      return;
    }

    const emailSubject = `Update regarding ${jobTitle}`;
    const emailBody = `Dear Candidate,\n\nWe would like to update you on your application status for the position of ${jobTitle}.\n\nBest regards,\nRecruitment Team`;

    // Simulate sending emails
    addToast(
      'success',
      'Bulk Email Sent!',
      `Emails queued for ${candidateNames.length} candidate(s)`
    );

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
      addToast('warning', 'No Selection', 'Please select candidates first');
      return;
    }

    const message = `Hi! This is an update regarding your application for ${jobTitle}. We will be in touch soon with next steps.`;

    // Simulate sending WhatsApp messages
    addToast(
      'success',
      'WhatsApp Messages Sent!',
      `Messages delivered to ${candidateNames.length} candidate(s)`
    );

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
      addToast('warning', 'No Selection', 'Please select candidates first');
      return;
    }

    // Note: In production, this would open a modal to select interviewer
    addToast(
      'success',
      'Interviewer Assignment',
      `Ready to assign interviewer to ${candidateNames.length} candidate(s)`
    );

    setSelectedCandidates([]);
    setShowBulkActions(false);
  };

  const handleBulkReject = async () => {
    const candidateNames = selectedCandidates.map(id => {
      const candidate = Object.values(pipelineData)
        .flat()
        .find(c => c.id === id);
      return candidate?.name;
    }).filter(Boolean);

    if (candidateNames.length === 0) {
      addToast('warning', 'No Selection', 'Please select candidates first');
      return;
    }

    // Note: In production, this would show a confirmation modal
    const confirmed = window.confirm(
      `Are you sure you want to reject ${candidateNames.length} candidate(s)?\n\nThis action cannot be undone.`
    );

    if (confirmed) {
      setPipelineData(prev => {
        const newData = { ...prev };
        selectedCandidates.forEach(candidateId => {
          Object.keys(newData).forEach(stage => {
            newData[stage] = newData[stage].filter(candidate => candidate.id !== candidateId);
          });
        });
        return newData;
      });

      addToast(
        'success',
        'Candidates Rejected',
        `${candidateNames.length} candidate(s) removed from pipeline`
      );

      const notifResult = await createNotification(
        selectedJob ,
        "candidate_rejected",
        "Candidates Rejected",
        `${candidateNames.length} candidate(s) were rejected from ${jobTitle}.`
      );

      if (!notifResult.success) {
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
      addToast('warning', 'No Data', 'No candidates in pipeline to export');
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
    link.setAttribute('download', `pipeline_${jobTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast(
      'success',
      'Pipeline Exported!',
      `${allCandidates.length} candidates exported successfully`
    );
  };

  const handleAddCandidates = () => {
    addToast('info', 'Feature Coming Soon', 'Add candidates modal will be available shortly');
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
    const subject = `Update regarding ${jobTitle}`;
    const message = `Dear ${candidate.name},\n\nWe wanted to provide you with an update on your application for ${jobTitle}.\n\nYour application is currently in the review process and we will be in touch with next steps soon.\n\nBest regards,\nRecruitment Team`;

    addToast('success', 'Email Sent', `Email sent to ${candidate.name}`);
  };

  const handleCandidateView = (candidate) => {
    setSelectedCandidate(candidate);
    setShowQuickView(true);
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

  // Filtered pipeline data based on global search
  const getFilteredPipelineData = () => {
    if (!globalSearch.trim()) return pipelineData;
    
    const searchLower = globalSearch.toLowerCase();
    const filtered = {};
    
    Object.keys(pipelineData).forEach(stage => {
      filtered[stage] = pipelineData[stage].filter(candidate => 
        candidate.name?.toLowerCase().includes(searchLower) ||
        candidate.email?.toLowerCase().includes(searchLower) ||
        candidate.dept?.toLowerCase().includes(searchLower) ||
        candidate.college?.toLowerCase().includes(searchLower) ||
        candidate.skills?.some(skill => skill.toLowerCase().includes(searchLower))
      );
    });
    
    return filtered;
  };

  const filteredPipelineData = getFilteredPipelineData();

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Pipeline Management</h1>
          
          <div className="flex items-center gap-3">
            {/* Global Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search candidates..."
                className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleAddCandidates}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <UserIcon className="h-4 w-4 mr-2" />
              Add Candidates
            </button>
            <button
              onClick={handleExportPipeline}
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => {
                loadPipelineCandidates();
                addToast('info', 'Refreshing', 'Loading latest candidate data...');
              }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Job Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {opportunities.slice(0, 5).map(job => (
            <button
              key={job.id}
              onClick={() => setSelectedJob(job.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedJob === job.id
                  ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>{job.job_title || job.title}</span>
                {selectedJob === job.id && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-200 text-primary-800 tabular-nums">
                    {getTotalCandidates()}
                  </span>
                )}
              </div>
            </button>
          ))}
          {opportunities.length > 5 && (
            <select
              value={selectedJob || ''}
              onChange={(e) => setSelectedJob(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">More jobs...</option>
              {opportunities.slice(5).map(job => (
                <option key={job.id} value={job.id}>
                  {job.job_title || job.title}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Quick Stats & Filters Row */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          {/* Quick Stats */}
          <QuickStats
            total={getTotalCandidates()}
            company={selectedJobDetails?.company_name || 'Unassigned'}
            daysAging={
              selectedJobDetails?.created_at
                ? Math.floor((new Date() - new Date(selectedJobDetails.created_at)) / (1000 * 60 * 60 * 24))
                : 0
            }
            activeStages={Object.values(pipelineData).filter(stage => stage.length > 0).length}
          />

          {/* Filters & Sort */}
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

        {/* Conversion Stats */}
        <PipelineStats
          metrics={[
            {
              label: 'Sourced → Screened',
              from: 'sourced',
              to: 'screened',
              rate: getConversionRate('sourced', 'screened'),
              fromCount: pipelineData.sourced?.length || 0,
              toCount: pipelineData.screened?.length || 0
            },
            {
              label: 'Interview → Offer',
              from: 'interview_1',
              to: 'offer',
              rate: getConversionRate('interview_1', 'offer'),
              fromCount: pipelineData.interview_1?.length || 0,
              toCount: pipelineData.offer?.length || 0
            },
            {
              label: 'Offer → Hired',
              from: 'offer',
              to: 'hired',
              rate: getConversionRate('offer', 'hired'),
              fromCount: pipelineData.offer?.length || 0,
              toCount: pipelineData.hired?.length || 0
            }
          ]}
        />
      </div>

      {/* Quick Filters Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quick Filters:</span>
          <button
            onClick={() => addToast('info', 'Filter', 'Showing all candidates')}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 border border-primary-200 hover:bg-primary-200 transition-colors"
          >
            <CheckIcon className="h-3 w-3 mr-1" />
            All Candidates ({getTotalCandidates()})
          </button>
          <button
            onClick={() => addToast('info', 'Coming Soon', 'Overdue actions filter will be available soon')}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <ClockIcon className="h-3 w-3 mr-1 text-orange-500" />
            Overdue Actions
          </button>
          <button
            onClick={() => addToast('info', 'Coming Soon', 'Needs attention filter will be available soon')}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <ExclamationTriangleIcon className="h-3 w-3 mr-1 text-yellow-500" />
            Needs Attention
          </button>
          <button
            onClick={() => addToast('info', 'Coming Soon', 'High priority filter will be available soon')}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <StarIcon className="h-3 w-3 mr-1 text-red-500" />
            High Priority
          </button>
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
            >
              <MagnifyingGlassIcon className="h-3 w-3 mr-1" />
              Search: "{globalSearch}"
              <XMarkIcon className="h-3 w-3 ml-1" />
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex space-x-6 h-full">
          {stages.map(stage => (
            <KanbanColumn
              key={stage.key}
              stageKey={stage.key}
              title={stage.label}
              count={filteredPipelineData[stage.key]?.length || 0}
              color={stage.color}
              candidates={filteredPipelineData[stage.key] || []}
              onCandidateMove={handleCandidateMove}
              onCandidateView={handleCandidateView}
              selectedCandidates={selectedCandidates}
              onToggleSelect={toggleCandidateSelection}
              onSendEmail={handleSendEmail}
              onAddClick={() => handleAddFromTalentPool(stage.key)}
              onNextAction={handleNextAction}
              movingCandidates={movingCandidates}
            />
          ))}
        </div>
      </div>

      {/* Persistent Bulk Actions Bar */}
      <div className={`bg-white border-t-2 px-6 py-3 transition-colors ${
        selectedCandidates.length > 0 
          ? 'border-primary-500 bg-primary-50' 
          : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className={`text-sm font-medium ${
              selectedCandidates.length > 0 ? 'text-primary-700' : 'text-gray-500'
            }`}>
              {selectedCandidates.length > 0 
                ? `${selectedCandidates.length} selected` 
                : 'No candidates selected'
              }
            </span>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkEmail}
                disabled={selectedCandidates.length === 0}
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedCandidates.length > 0
                    ? 'text-primary-700 hover:bg-primary-100 bg-white border border-primary-200'
                    : 'text-gray-400 bg-gray-100 cursor-not-allowed border border-gray-200'
                }`}
              >
                <EnvelopeIcon className="h-4 w-4 mr-1.5" />
                Email
              </button>
              <button
                onClick={handleBulkWhatsApp}
                disabled={selectedCandidates.length === 0}
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedCandidates.length > 0
                    ? 'text-primary-700 hover:bg-primary-100 bg-white border border-primary-200'
                    : 'text-gray-400 bg-gray-100 cursor-not-allowed border border-gray-200'
                }`}
              >
                <PhoneIcon className="h-4 w-4 mr-1.5" />
                WhatsApp
              </button>
              <button
                onClick={handleAssignInterviewer}
                disabled={selectedCandidates.length === 0}
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedCandidates.length > 0
                    ? 'text-primary-700 hover:bg-primary-100 bg-white border border-primary-200'
                    : 'text-gray-400 bg-gray-100 cursor-not-allowed border border-gray-200'
                }`}
              >
                <UserIcon className="h-4 w-4 mr-1.5" />
                Assign
              </button>
              <button
                onClick={handleBulkReject}
                disabled={selectedCandidates.length === 0}
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedCandidates.length > 0
                    ? 'text-red-700 hover:bg-red-50 bg-white border border-red-200'
                    : 'text-gray-400 bg-gray-100 cursor-not-allowed border border-gray-200'
                }`}
              >
                <XCircleIcon className="h-4 w-4 mr-1.5" />
                Reject
              </button>
              {selectedCandidates.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedCandidates([]);
                    setShowBulkActions(false);
                  }}
                  className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 bg-white border border-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4 mr-1.5" />
                  Clear
                </button>
              )}
            </div>
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

      <CandidateQuickView
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
        candidate={selectedCandidate}
        onFullView={() => {
          setShowQuickView(false);
          onViewProfile(selectedCandidate);
        }}
        onSendEmail={handleSendEmail}
        onScheduleCall={(candidate) => addToast('info', 'Schedule Call', `Opening calendar for ${candidate.name}`)}
        onNextAction={(candidate) => {
          setShowQuickView(false);
          handleNextAction(candidate);
        }}
      />
    </div>
  );
};

export default Pipelines;