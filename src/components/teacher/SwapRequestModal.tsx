import React, { useState, useMemo } from 'react';
import { X, Search, Calendar, Users, MapPin, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import type { SlotInfo, CreateSwapRequestPayload, SwapRequestType } from '../../types/classSwap';

interface SwapRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlot: SlotInfo & { educator_id?: string };
  availableSlots: (SlotInfo & { educator_id?: string })[];
  onSubmit: (payload: CreateSwapRequestPayload) => Promise<void>;
  facultyId: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SwapRequestModal: React.FC<SwapRequestModalProps> = ({
  isOpen,
  onClose,
  currentSlot,
  availableSlots,
  onSubmit,
  facultyId,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [swapType, setSwapType] = useState<SwapRequestType>('one_time');
  const [swapDate, setSwapDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // Filter available slots based on search
  const filteredSlots = useMemo(() => {
    if (!searchQuery.trim()) return availableSlots;

    const query = searchQuery.toLowerCase();
    return availableSlots.filter(
      (slot) =>
        slot.subject_name.toLowerCase().includes(query) ||
        slot.class_name.toLowerCase().includes(query) ||
        slot.room_number.toLowerCase().includes(query) ||
        DAYS[slot.day_of_week - 1]?.toLowerCase().includes(query)
    );
  }, [availableSlots, searchQuery]);

  // Get minimum date for date picker (today)
  const minDate = useMemo(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, []);

  const handleSubmit = async () => {
    // Validation
    if (!selectedSlot) {
      setError('Please select a target class to swap with');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the swap');
      return;
    }

    if (swapType === 'one_time' && !swapDate) {
      setError('Please select a date for the one-time swap');
      return;
    }

    if (swapType === 'one_time') {
      const selectedDate = new Date(swapDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        setError('Swap date cannot be in the past');
        return;
      }
    }

    setError('');
    setIsSubmitting(true);

    try {
      const targetFacultyId = (selectedSlot as any).educator_id;

      if (!targetFacultyId) {
        setError('Target faculty ID is missing. Please try selecting a different slot.');
        return;
      }

      const payload: CreateSwapRequestPayload = {
        requester_faculty_id: facultyId,
        requester_slot_id: currentSlot.id,
        target_faculty_id: targetFacultyId,
        target_slot_id: selectedSlot.id,
        reason: reason.trim(),
        request_type: swapType,
        swap_date: swapType === 'one_time' ? swapDate : undefined,
        requires_admin_approval: true,
      };

      await onSubmit(payload);

      // Reset form and close
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create swap request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedSlot(null);
    setSwapType('one_time');
    setSwapDate('');
    setReason('');
    setSearchQuery('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-indigo-600" />
              Request Class Swap
            </h2>
            <p className="text-sm text-gray-600 mt-1">Exchange your class with another educator</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white rounded-lg transition"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Current Slot Display */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Time Slot to Swap:
            </label>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="font-semibold text-blue-900 text-lg">
                    {currentSlot.subject_name}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-blue-700">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{DAYS[currentSlot.day_of_week - 1]}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {currentSlot.start_time} - {currentSlot.end_time}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>Room {currentSlot.room_number}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{currentSlot.class_name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> You will continue teaching{' '}
                <strong>{currentSlot.subject_name}</strong> to{' '}
                <strong>{currentSlot.class_name}</strong>. Only the <strong>time slot</strong> will
                be exchanged with another educator.
              </p>
            </div>
          </div>

          {/* Swap Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Swap Type: *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="swapType"
                  value="one_time"
                  checked={swapType === 'one_time'}
                  onChange={(e) => setSwapType(e.target.value as SwapRequestType)}
                  className="w-4 h-4 text-indigo-600"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-700">One-time swap</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="swapType"
                  value="permanent"
                  checked={swapType === 'permanent'}
                  onChange={(e) => setSwapType(e.target.value as SwapRequestType)}
                  className="w-4 h-4 text-indigo-600"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-700">Permanent swap</span>
              </label>
            </div>
          </div>

          {/* Date Picker (for one-time swaps) */}
          {swapType === 'one_time' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Swap Date: *</label>
              <input
                type="date"
                value={swapDate}
                onChange={(e) => setSwapDate(e.target.value)}
                min={minDate}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Target Class Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Target Educator's Time Slot: *
            </label>

            {/* Explanation */}
            <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                <strong>How it works:</strong> You exchange <strong>time slots</strong> with another
                educator teaching the <strong>same class</strong>. Each of you will continue
                teaching your own subject to the same students, just at the swapped time.
              </p>
              <div className="mt-2 text-xs text-amber-700">
                <strong>Example:</strong> If you swap your Thursday 11:45 slot with their Monday
                9:00 slot:
                <ul className="list-disc ml-4 mt-1">
                  <li>
                    You teach <strong>your subject</strong> to{' '}
                    <strong>{currentSlot.class_name}</strong> on Monday 9:00
                  </li>
                  <li>
                    They teach <strong>their subject</strong> to{' '}
                    <strong>{currentSlot.class_name}</strong> on Thursday 11:45
                  </li>
                </ul>
              </div>
              <div className="mt-2 pt-2 border-t border-amber-300">
                <p className="text-xs text-amber-900 font-medium">
                  ⚠️ Only educators teaching <strong>{currentSlot.class_name}</strong> are shown to
                  avoid student schedule conflicts.
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by educator name, day, or time..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>

            {/* Available Classes List */}
            <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
              {filteredSlots.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No available time slots found</p>
                  {searchQuery && <p className="text-xs mt-1">Try adjusting your search</p>}
                </div>
              ) : (
                filteredSlots.map((slot) => (
                  <label
                    key={slot.id}
                    className={`flex items-start gap-3 p-4 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition ${
                      selectedSlot?.id === slot.id
                        ? 'bg-indigo-50 border-l-4 border-l-indigo-500'
                        : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetSlot"
                      checked={selectedSlot?.id === slot.id}
                      onChange={() => setSelectedSlot(slot)}
                      className="mt-1 w-4 h-4 text-indigo-600"
                      disabled={isSubmitting}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">Educator's Time Slot</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        (They teach: {slot.subject_name} to {slot.class_name})
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-600">
                        <span className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-200">
                          <Calendar className="h-3 w-3" />
                          {DAYS[slot.day_of_week - 1]}
                        </span>
                        <span className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-200">
                          <Clock className="h-3 w-3" />
                          {slot.start_time} - {slot.end_time}
                        </span>
                        <span className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-200">
                          <MapPin className="h-3 w-3" />
                          Room {slot.room_number}
                        </span>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reason for Swap: *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a detailed reason for this swap request..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">{reason.length}/500 characters</p>
          </div>

          {/* Admin Approval Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Admin Approval Required</p>
              <p className="mt-1">
                This swap request will require approval from your administrator before it can be
                executed.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !selectedSlot ||
              !reason.trim() ||
              (swapType === 'one_time' && !swapDate)
            }
            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Send Swap Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SwapRequestModal;
