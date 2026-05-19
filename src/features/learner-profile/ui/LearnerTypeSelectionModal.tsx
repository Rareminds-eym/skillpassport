import React, { useState } from 'react';
import Modal from '@/shared/ui/Modal';
import { AcademicCapIcon, BuildingLibraryIcon, UserIcon } from '@heroicons/react/24/outline';
import { updateLearner } from '@/entities/learner';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learner-type-selection-modal');

interface LearnerTypeSelectionModalProps {
  isOpen: boolean;
  learnerId: string;
  onSuccess: () => void;
}

const learnerTypes = [
  {
    id: 'school_student',
    label: 'School Student',
    description: 'For students currently enrolled in school',
    icon: AcademicCapIcon,
    color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    iconColor: 'text-blue-600',
  },
  {
    id: 'college_student',
    label: 'College Student',
    description: 'For students pursuing higher education',
    icon: BuildingLibraryIcon,
    color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
    iconColor: 'text-purple-600',
  },
  {
    id: 'teacher',
    label: 'Teacher',
    description: 'For educators and teaching professionals',
    icon: UserIcon,
    color: 'bg-green-50 hover:bg-green-100 border-green-200',
    iconColor: 'text-green-600',
  },
];

export const LearnerTypeSelectionModal: React.FC<LearnerTypeSelectionModalProps> = ({
  isOpen,
  learnerId,
  onSuccess,
}) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedType) {
      setError('Please select a learner type');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await updateLearner(learnerId, {
        learner_type: selectedType,
      });

      if (result.success) {
        logger.info('Learner type updated successfully', { learnerId, learnerType: selectedType });
        onSuccess();
      } else {
        throw new Error(result.error || 'Failed to update learner type');
      }
    } catch (err: any) {
      logger.error('Error updating learner type', err);
      setError(err.message || 'Failed to update learner type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Prevent closing by clicking backdrop
      title="Welcome! Tell us about yourself"
      size="lg"
      showCloseButton={false}
    >
      <div className="space-y-6">
        <p className="text-gray-600 text-center">
          Please select your role to personalize your experience
        </p>

        {/* Learner Type Options */}
        <div className="grid grid-cols-1 gap-4">
          {learnerTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;

            return (
              <button
                key={type.id}
                onClick={() => {
                  setSelectedType(type.id);
                  setError(null);
                }}
                className={`
                  relative p-6 rounded-lg border-2 transition-all duration-200
                  ${isSelected 
                    ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                    : `${type.color} border-gray-200`
                  }
                  ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                disabled={loading}
              >
                <div className="flex items-start gap-4">
                  <div className={`
                    flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center
                    ${isSelected ? 'bg-indigo-100' : 'bg-white'}
                  `}>
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-indigo-600' : type.iconColor}`} />
                  </div>
                  
                  <div className="flex-1 text-left">
                    <h3 className={`text-lg font-semibold mb-1 ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                      {type.label}
                    </h3>
                    <p className={`text-sm ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>
                      {type.description}
                    </p>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSubmit}
            disabled={!selectedType || loading}
            className={`
              px-6 py-3 rounded-lg font-medium transition-all duration-200
              ${selectedType && !loading
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
