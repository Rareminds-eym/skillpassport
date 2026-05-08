import React, { useState } from 'react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  StarIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useLearners } from '@/entities/learner/model/useLearners';
import toast from 'react-hot-toast';
import { addCandidateToPipeline } from '@/features/recruiter-pipeline';
import { createNotification } from '@/features/notifications';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('AddFromTalentPoolModal');

interface AddFromTalentPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisitionId: number | null;
  targetStage: string | null;
  onSuccess?: () => void;
}

export const AddFromTalentPoolModal: React.FC<AddFromTalentPoolModalProps> = ({
  isOpen,
  onClose,
  requisitionId,
  targetStage,
  onSuccess
}) => {
  const { learners, loading: learnersLoading } = useLearners();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedlearners, setSelectedlearners] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredlearners = learners.filter(learner =>
    learner.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    learner.dept?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    learner.college?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCandidates = async () => {
    if (selectedlearners.length === 0) {
      setError('Please select at least one candidate');
      return;
    }

    setAdding(true);
    setError(null);

    try {
      const results = await Promise.all(
        selectedlearners.map(learner =>
          addCandidateToPipeline({
            opportunity_id: requisitionId!,
            learner_id: learner.id,
            candidate_name: learner.name,
            candidate_email: learner.email,
            candidate_phone: learner.phone,
            stage: targetStage || 'sourced',
            source: 'talent_pool'
          })
        )
      );

      const errors = results.filter((r: any) => r.error);
      if (errors.length > 0) {
        const duplicates = errors.filter((e: any) => e.error?.message?.includes('already'));
        if (duplicates.length > 0) {
          setError(`${duplicates.length} candidate(s) already in pipeline`);
          setTimeout(() => {
            onSuccess?.();
            onClose();
            setSelectedlearners([]);
          }, 2000);
          return;
        } else {
          throw new Error((errors[0] as any).error?.message || 'Unknown error');
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
        // Ignore parse errors
      }

      if (successCount > 0 && currentRecruiterId) {
        toast.success(`Successfully added ${successCount} candidate(s) to ${targetStage} stage`);

        await createNotification(
          currentRecruiterId,
          targetStage === "sourced" ? "candidate_sourced" : "candidate_shortlisted",
          "Candidate(s) Added to Pipeline",
          `${successCount} candidate(s) were added to the ${targetStage} stage.`
        );

        onSuccess?.();
        onClose();
        setSelectedlearners([]);
      }
    } catch (err: any) {
      logger.error('Failed to add candidates to pipeline', err, { 
        selectedCount: selectedlearners.length,
        requisitionId,
        targetStage 
      });
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const toggleLearner = (learner: any) => {
    setSelectedlearners(prev => {
      const exists = prev.find(s => s.id === learner.id);
      if (exists) {
        return prev.filter(s => s.id !== learner.id);
      }
      return [...prev, learner];
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
          {selectedlearners.length > 0 && (
            <div className="mb-3 text-sm text-gray-600">
              {selectedlearners.length} candidate(s) selected
            </div>
          )}

          {/* Learner List */}
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
            {learnersLoading ? (
              <div className="p-8 text-center text-gray-500">Loading candidates...</div>
            ) : filteredlearners.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No candidates found</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredlearners.map(learner => {
                  const isSelected = selectedlearners.find(s => s.id === learner.id);
                  return (
                    <div
                      key={learner.id}
                      onClick={() => toggleLearner(learner)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 ${
                        isSelected ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={() => {}}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{learner.name}</h4>
                              <p className="text-xs text-gray-500">{learner.dept} • {learner.college}</p>
                            </div>
                            <div className="flex items-center">
                              <StarIcon className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                              <span className="text-sm font-medium">{learner.ai_score_overall}</span>
                            </div>
                          </div>
                          {learner.skills && learner.skills.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {learner.skills.slice(0, 3).map((skill: any, idx: number) => (
                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                  {typeof skill === 'string' ? skill : skill?.name || skill}
                                </span>
                              ))}
                              {learner.skills.length > 3 && (
                                <span className="text-xs text-gray-500">+{learner.skills.length - 3} more</span>
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
              disabled={adding || selectedlearners.length === 0}
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
                  Add {selectedlearners.length} Candidate{selectedlearners.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFromTalentPoolModal;
