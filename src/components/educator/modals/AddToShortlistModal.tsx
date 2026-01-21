import React, { useEffect, useState } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { getShortlists, addCandidateToShortlist } from '../../../services/shortlistService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidate: any;
  onSuccess?: () => void;
}

const AddToShortlistModal: React.FC<Props> = ({ isOpen, onClose, candidate, onSuccess }) => {
  const [shortlists, setShortlists] = useState<any[]>([]);
  const [selectedShortlistId, setSelectedShortlistId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingShortlists, setLoadingShortlists] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err: any) {
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
      const { error } = await addCandidateToShortlist(selectedShortlistId, candidate.id);
      if (error) throw new Error(error.message || 'Failed to add candidate to shortlist');

      onSuccess?.();
      onClose();
    } catch (err: any) {
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
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

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
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Shortlist</label>
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
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
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

export default AddToShortlistModal;
