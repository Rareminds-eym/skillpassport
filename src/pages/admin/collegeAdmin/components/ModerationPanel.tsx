import React, { useState } from 'react';
import { XMarkIcon, PencilSquareIcon, ClockIcon } from '@heroicons/react/24/outline';
import { BarChart3, TrendingUp, Users } from 'lucide-react';
import type { MarkEntry } from '../../../../types/college';

interface ModerationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentName: string;
  totalMarks: number;
  markEntries: MarkEntry[];
  onModerate: (entryId: string, newMarks: number, reason: string) => Promise<{ success: boolean; error?: string }>;
  onApprove: () => Promise<{ success: boolean; error?: string }>;
}

interface ModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: MarkEntry;
  totalMarks: number;
  onSubmit: (newMarks: number, reason: string) => Promise<void>;
}

const ModerationModal: React.FC<ModerationModalProps> = ({
  isOpen,
  onClose,
  entry,
  totalMarks,
  onSubmit,
}) => {
  const [newMarks, setNewMarks] = useState(entry.marks_obtained);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Reason is required for mark moderation');
      return;
    }

    setLoading(true);
    await onSubmit(newMarks, reason);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Moderate Marks</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Marks
            </label>
            <input
              type="text"
              value={entry.marks_obtained}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Marks <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max={totalMarks}
              value={newMarks}
              onChange={(e) => setNewMarks(parseFloat(e.target.value))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Change: {newMarks > entry.marks_obtained ? '+' : ''}{(newMarks - entry.marks_obtained).toFixed(2)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Change <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Explain why marks are being changed..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Moderate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ModerationPanel: React.FC<ModerationPanelProps> = ({
  isOpen,
  onClose,
  assessmentName,
  totalMarks,
  markEntries,
  onModerate,
  onApprove,
}) => {
  const [selectedEntry, setSelectedEntry] = useState<MarkEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate statistics
  const validMarks = markEntries.filter(m => !m.is_absent && !m.is_exempt);
  const average = validMarks.length > 0
    ? validMarks.reduce((sum, m) => sum + m.marks_obtained, 0) / validMarks.length
    : 0;
  const highest = validMarks.length > 0
    ? Math.max(...validMarks.map(m => m.marks_obtained))
    : 0;
  const lowest = validMarks.length > 0
    ? Math.min(...validMarks.map(m => m.marks_obtained))
    : 0;
  const passCount = validMarks.filter(m => m.marks_obtained >= (totalMarks * 0.4)).length;
  const passPercentage = validMarks.length > 0
    ? (passCount / validMarks.length) * 100
    : 0;

  // Distribution
  const getDistribution = () => {
    const ranges = [
      { label: '0-20%', min: 0, max: totalMarks * 0.2, count: 0 },
      { label: '21-40%', min: totalMarks * 0.2, max: totalMarks * 0.4, count: 0 },
      { label: '41-60%', min: totalMarks * 0.4, max: totalMarks * 0.6, count: 0 },
      { label: '61-80%', min: totalMarks * 0.6, max: totalMarks * 0.8, count: 0 },
      { label: '81-100%', min: totalMarks * 0.8, max: totalMarks, count: 0 },
    ];

    validMarks.forEach(mark => {
      const range = ranges.find(r => mark.marks_obtained >= r.min && mark.marks_obtained <= r.max);
      if (range) range.count++;
    });

    return ranges;
  };

  const distribution = getDistribution();
  const maxCount = Math.max(...distribution.map(d => d.count), 1);

  const handleModerate = async (newMarks: number, reason: string) => {
    if (!selectedEntry) return;

    setLoading(true);
    setError(null);

    const result = await onModerate(selectedEntry.id, newMarks, reason);

    if (!result.success) {
      setError(result.error || 'Failed to moderate marks');
    }

    setLoading(false);
    setSelectedEntry(null);
  };

  const handleApprove = async () => {
    if (!confirm('Approve and publish these marks? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);

    const result = await onApprove();

    if (result.success) {
      alert('Marks approved and published successfully!');
      onClose();
    } else {
      setError(result.error || 'Failed to approve marks');
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Moderation Panel</h2>
                <p className="text-sm text-gray-600 mt-1">{assessmentName}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Students</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{markEntries.length}</p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Average</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{average.toFixed(2)}</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-purple-600 mb-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm font-medium">Pass %</span>
                </div>
                <p className="text-2xl font-bold text-purple-900">{passPercentage.toFixed(1)}%</p>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-sm font-medium text-orange-600 mb-1">Range</div>
                <p className="text-lg font-bold text-orange-900">
                  {lowest.toFixed(0)} - {highest.toFixed(0)}
                </p>
              </div>
            </div>

            {/* Distribution Chart */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Marks Distribution</h3>
              <div className="space-y-3">
                {distribution.map((range, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-20 text-sm text-gray-600">{range.label}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-8 relative">
                      <div
                        className="bg-blue-500 h-8 rounded-full flex items-center justify-end px-3 text-white text-sm font-medium transition-all"
                        style={{ width: `${(range.count / maxCount) * 100}%` }}
                      >
                        {range.count > 0 && range.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mark Entries Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Student Marks</h3>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Marks</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Moderation</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {markEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">Student #{entry.student_id.slice(0, 8)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-medium text-gray-900">{entry.marks_obtained}</span>
                          <span className="text-gray-500">/{totalMarks}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {entry.is_absent ? (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Absent</span>
                          ) : entry.is_exempt ? (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Exempt</span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Present</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {entry.moderated_by ? (
                            <div className="text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <ClockIcon className="h-3 w-3" />
                                Moderated
                              </div>
                              <div className="text-gray-500">{entry.moderation_reason}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {!entry.is_absent && !entry.is_exempt && (
                            <button
                              onClick={() => setSelectedEntry(entry)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Approving...' : 'Approve & Publish Results'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedEntry && (
        <ModerationModal
          isOpen={!!selectedEntry}
          onClose={() => setSelectedEntry(null)}
          entry={selectedEntry}
          totalMarks={totalMarks}
          onSubmit={handleModerate}
        />
      )}
    </>
  );
};

export default ModerationPanel;
