import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useToast } from '../Toast';
import { updateNextAction } from '../../../../services/pipelineService';
import { createNotification } from '../../../../services/notificationService';
import { NEXT_ACTIONS, PipelineCandidate } from './types';

interface NextActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: PipelineCandidate | null;
  onSuccess?: () => void;
}

export const NextActionModal: React.FC<NextActionModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onSuccess
}) => {
  const { addToast } = useToast();
  const [action, setAction] = useState('send_email');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!candidate) return;
    
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
        NEXT_ACTIONS.find(a => a.value === action)?.label || 'Action updated successfully'
      );

      await createNotification(
        candidate.id,
        "pipeline_stage_changed",
        "Next Action Updated",
        `Next action for ${candidate.name} set to ${NEXT_ACTIONS.find(a => a.value === action)?.label}`
      );

      onSuccess?.();
      onClose();

      // Reset form
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
              <p className="text-sm text-gray-500">{candidate?.name}</p>
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
                {NEXT_ACTIONS.map(act => (
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

export default NextActionModal;
