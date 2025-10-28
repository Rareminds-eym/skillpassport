import { useState, useEffect, useMemo } from 'react';
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  PlusIcon,
  EyeIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  XMarkIcon,
  BanknotesIcon,
  HandRaisedIcon,
  ExclamationTriangleIcon,
  UserIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  DocumentCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useOffers, Offer } from '../../hooks/useOffers.ts';
import OfferAdvancedFilters, { OfferFilters, OfferSortOptions } from '../../components/Recruiter/filters/OfferAdvancedFilters';
import OfferSortButton from '../../components/Recruiter/filters/OfferSortButton';
const Toast = ({
  show,
  message,
  type = 'success',
  onClose
}: {
  show: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}) => {
  if (!show) return null;

  const getToastStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-400" />;
      case 'info':
        return <ExclamationCircleIcon className="h-5 w-5 text-blue-400" />;
      default:
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className={`rounded-lg border p-4 shadow-lg ${getToastStyles()}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onClose}
              className="inline-flex text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


const OfferDetailsDrawer = ({
  isOpen,
  onClose,
  offer,
}: {
  isOpen: boolean;
  onClose: () => void;
  offer: Offer | null;
}) => {
  if (!isOpen || !offer) return null;

  const isExpiring = () => {
    const expiryDate = new Date(offer.expiry_date);
    const now = new Date();
    const diffDays = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 2 && diffDays > 0;
  };

  const isExpired = () => new Date(offer.expiry_date) < new Date();

  const getStatusClasses = () => {
    switch (offer.status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-gray-200 text-gray-800";
      case "withdrawn":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-40"
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className="relative ml-auto w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col rounded-l-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Offer Details
            </h2>
            <p className="text-sm text-gray-500">
              Full details for {offer.candidate_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Candidate & Job */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-3">
                <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="font-medium text-gray-900 text-sm">
                  Candidate Name
                </h3>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {offer.candidate_name}
              </p>
              {offer.candidate_id && (
                <p className="text-sm text-gray-600 mt-1">
                  ID: {offer.candidate_id}
                </p>
              )}
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-3">
                <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="font-medium text-gray-900 text-sm">Job</h3>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {offer.job_title}
              </p>
              {offer.job_id && (
                <p className="text-sm text-gray-600 mt-1">Job ID: {offer.job_id}</p>
              )}
              {offer.template && (
                <p className="text-xs text-gray-500 mt-1">
                  Template: {offer.template}
                </p>
              )}
            </div>
          </div>

          {/* Compensation */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-3">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="font-medium text-gray-900 text-sm">Compensation</h3>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">CTC Band</p>
              <span className="text-sm font-medium">{offer.ctc_band}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-600">Offered CTC</p>
              <span className="text-lg font-bold text-green-600">
                {offer.offered_ctc}
              </span>
            </div>
          </div>

          {/* Status & Timeline */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="flex items-center mb-3">
              <DocumentCheckIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="font-medium text-gray-900 text-sm">
                Status & Timeline
              </h3>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClasses()}`}
              >
                {offer.status}
              </span>
            </div>

            {offer.offer_date && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Offer Date</span>
                <span>
                  {new Date(offer.offer_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Expiry</span>
              <span
                className={`${
                  isExpired()
                    ? "text-red-600 font-medium"
                    : isExpiring()
                    ? "text-yellow-700 font-medium"
                    : "text-gray-900"
                }`}
              >
                {new Date(offer.expiry_date).toLocaleDateString()}
              </span>
            </div>

            {isExpiring() && (
              <p className="text-xs bg-yellow-100 text-yellow-800 px-3 py-2 rounded-md">
                ⚠️ This offer will expire soon
              </p>
            )}
            {isExpired() && (
              <p className="text-xs bg-red-100 text-red-800 px-3 py-2 rounded-md">
                ❌ This offer has expired
              </p>
            )}
          </div>

          {/* Benefits */}
          {offer.benefits && offer.benefits.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-3">
                <CheckCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="font-medium text-gray-900 text-sm">Benefits</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {offer.benefits.map((b, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {offer.notes && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-3">
                <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="font-medium text-gray-900 text-sm">Notes</h3>
              </div>
              <p className="text-sm text-gray-700">{offer.notes}</p>
            </div>
          )}

          {/* Acceptance Notes */}
          {offer.acceptance_notes && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-900 text-sm mb-2">
                Acceptance Notes
              </h3>
              <p className="text-sm text-green-800">{offer.acceptance_notes}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 text-sm mb-2">Metadata</h3>
            <p className="text-xs text-gray-500">
              Created: {new Date(offer.inserted_at).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Updated: {new Date(offer.updated_at).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">ID: {offer.id}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning"
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "warning" | "danger" | "info";
}) => {
  if (!isOpen) return null;

  const getIconAndColors = () => {
    switch (type) {
      case "danger":
        return {
          icon: <XCircleIcon className="h-6 w-6 text-red-600" />,
          confirmBg: "bg-red-600 hover:bg-red-700",
          iconBg: "bg-red-100"
        };
      case "info":
        return {
          icon: <ExclamationCircleIcon className="h-6 w-6 text-blue-600" />,
          confirmBg: "bg-blue-600 hover:bg-blue-700",
          iconBg: "bg-blue-100"
        };
      default:
        return {
          icon: <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />,
          confirmBg: "bg-yellow-600 hover:bg-yellow-700",
          iconBg: "bg-yellow-100"
        };
    }
  };

  const { icon, confirmBg, iconBg } = getIconAndColors();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
              {icon}
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {message}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${confirmBg} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


const Calendar = ({
  selectedDate,
  onDateSelect,
  minDate,
  rangeStart
}: {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  minDate: Date;
  rangeStart?: Date | null;
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const isDateDisabled = (date: Date) => {

    return startOfDay(date).getTime() < startOfDay(minDate).getTime();
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };


  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [selectedDate]);

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];


    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-8 w-8"></div>
      );
    }


    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isDisabled = isDateDisabled(date);
      const isSelected = isDateSelected(date);
      const isTodayDate = isToday(date);

      let isInRange = false;
      if (rangeStart && selectedDate) {
        const s = startOfDay(rangeStart).getTime();
        const e = startOfDay(selectedDate).getTime();
        const t = startOfDay(date).getTime();
        const from = Math.min(s, e);
        const to = Math.max(s, e);
        isInRange = t >= from && t <= to;
      }

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => !isDisabled && onDateSelect(date)}
          disabled={isDisabled}
          className={`
            h-8 w-8 rounded-full text-sm font-medium transition-all
            ${isDisabled
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 cursor-pointer'
            }
            ${isInRange && !isSelected ? 'bg-blue-100 text-blue-800' : ''}
            ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
            ${isTodayDate && !isSelected && !isInRange ? 'bg-gray-100 text-gray-900 font-semibold' : ''}
            ${!isDisabled && !isSelected ? 'hover:bg-blue-100' : ''}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => navigateMonth('prev')}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
        </button>

        <h3 className="text-lg font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>

        <button
          type="button"
          onClick={() => navigateMonth('next')}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRightIcon className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {renderCalendar()}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-600 rounded-full mr-1"></div>
            Selected
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-100 rounded-full mr-1"></div>
            Today
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-200 rounded-full mr-1"></div>
            Available
          </div>
        </div>
      </div>
    </div>
  );
};


const ExtendOfferModal = ({
  isOpen,
  onClose,
  onConfirm,
  candidateName,
  currentExpiryDate,
  currentOfferDate
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (days: number) => void;
  candidateName: string;
  currentExpiryDate?: string;
  currentOfferDate?: string | null;
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(7);
  const [useCalendar, setUseCalendar] = useState(false);

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = startOfDay(new Date());
  const providedExpiry = currentExpiryDate ? startOfDay(new Date(currentExpiryDate)) : null;
  const minDate = today;

  useEffect(() => {
    if (!isOpen) return;
    const startOfDayLocal = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const todayLocal = startOfDayLocal(new Date());
    const providedExpiryLocal = currentExpiryDate ? startOfDayLocal(new Date(currentExpiryDate)) : null;
    if (providedExpiryLocal) {
      setSelectedDate(providedExpiryLocal);
    } else {
      setSelectedDate(todayLocal);
    }
    setSelectedPreset(null);
    setUseCalendar(true);
  }, [isOpen, currentExpiryDate]);

  const presetOptions = [
    { days: 3, label: "3 days", description: "Quick extension" },
    { days: 7, label: "1 week", description: "Standard extension" },
    { days: 14, label: "2 weeks", description: "Extended period" },
    { days: 30, label: "1 month", description: "Long extension" }
  ];

  const handlePresetSelect = (presetDays: number) => {

    const base = providedExpiry && providedExpiry.getTime() > today.getTime() ? providedExpiry : today;
    const newDate = new Date(base);
    newDate.setDate(base.getDate() + presetDays);
    setSelectedDate(newDate);
    setSelectedPreset(presetDays);

    setUseCalendar(true);
  };

  const handleCalendarDateSelect = (date: Date) => {

    const picked = startOfDay(date);
    if (picked.getTime() < minDate.getTime()) return;
    setSelectedDate(picked);
    setSelectedPreset(null);
    setUseCalendar(true);
  };

  const getDaysDifference = () => {
    if (!selectedDate) return 0;

    const displayBase = providedExpiry ? providedExpiry : today;
    const diffTime = selectedDate.getTime() - displayBase.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleConfirm = () => {
    const daysForConfirm = getDaysForConfirm();
    if (daysForConfirm !== 0) {
      onConfirm(daysForConfirm);
      onClose();
    }
  };

  const getNewExpiryDate = () => {
    if (!selectedDate) return 'Select a date';
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };


  const getDaysForConfirm = () => {
    if (!selectedDate) return 0;
    const presetBase = providedExpiry && providedExpiry.getTime() > today.getTime() ? providedExpiry : today;
    const diffTime = selectedDate.getTime() - presetBase.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDaysForDisplay = (days: number) => {
    if (days === 0) return '0 days';
    return (days > 0 ? `+${days} ${days === 1 ? 'day' : 'days'}` : `${days} ${Math.abs(days) === 1 ? 'day' : 'days'}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600">
                <CalendarDaysIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Extend Offer Expiry
                </h3>
                <p className="text-sm text-gray-500">
                  For <span className="font-medium text-gray-900">{candidateName}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Selection Options */}
            <div className="space-y-6">
              {/* Quick Presets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quick Extensions
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {presetOptions.map((preset) => (
                    <button
                      key={preset.days}
                      onClick={() => handlePresetSelect(preset.days)}
                      className={`p-3 rounded-lg border-2 transition-all ${selectedPreset === preset.days
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                    >
                      <div className="text-center">
                        <div className="font-semibold text-sm">{preset.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{preset.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendar Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Custom Date Selection
                </label>
                <button
                  onClick={() => setUseCalendar(!useCalendar)}
                  className={`w-full p-3 rounded-lg border-2 transition-all ${useCalendar
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                >
                  <div className="flex items-center justify-center">
                    <CalendarDaysIcon className="h-5 w-5 mr-2" />
                    <span className="font-medium">
                      {useCalendar ? 'Hide Calendar' : 'Show Calendar'}
                    </span>
                  </div>
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Select a specific date for the new expiry
                </p>
              </div>

              {/* Preview */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="space-y-3">
                  {currentExpiryDate && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Current Expiry</p>
                      <p className="text-sm text-gray-600">
                        {new Date(currentExpiryDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700">New Expiry Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedDate ? getNewExpiryDate() : 'Select extension period'}
                    </p>
                  </div>
                  {selectedDate && (
                    <div>
                      <p className="text-sm text-gray-500">Extension Period</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {formatDaysForDisplay(getDaysDifference())}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Positive means new expiry is later than current expiry; negative means it's earlier.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Calendar */}
            {useCalendar && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select New Expiry Date
                </label>
                <Calendar
                  selectedDate={selectedDate}
                  onDateSelect={handleCalendarDateSelect}
                  minDate={minDate}
                  rangeStart={currentOfferDate ? new Date(currentOfferDate) : null}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              type="button"
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              onClick={handleConfirm}
              disabled={!selectedDate || getDaysForConfirm() === 0}
            >
              <div className="flex items-center">
                <CalendarDaysIcon className="h-4 w-4 mr-2" />
                Extend Offer
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'accepted':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'expired':
      return 'bg-gray-100 text-gray-800';
    case 'withdrawn':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <ClockIcon className="h-4 w-4" />;
    case 'accepted':
      return <CheckCircleIcon className="h-4 w-4" />;
    case 'rejected':
      return <XCircleIcon className="h-4 w-4" />;
    case 'expired':
      return <ExclamationCircleIcon className="h-4 w-4" />;
    case 'withdrawn':
      return <HandRaisedIcon className="h-4 w-4" />;
    default:
      return <DocumentTextIcon className="h-4 w-4" />;
  }
};

const CreateOfferModal = ({ isOpen, onClose, onCreate }: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (offerData: Partial<Offer>) => Promise<{ success: boolean; data?: Offer; error?: string }>;
}) => {
  const [formData, setFormData] = useState({
    candidate_id: '',
    candidate_name: '',
    job_title: '',
    template: 'Full-time Offer - Standard',
    ctc_band: '4.0-6.0 LPA',
    offered_ctc: '',
    expiry_days: 7,
    benefits: ['Health Insurance'],
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!formData.candidate_name || !formData.job_title || !formData.offered_ctc) {
      return;
    }

    setIsSubmitting(true);
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + formData.expiry_days);

      const newOfferData = {
        candidate_name: formData.candidate_name,
        job_title: formData.job_title,
        template: formData.template,
        ctc_band: formData.ctc_band,
        offered_ctc: formData.offered_ctc,
        offer_date: new Date().toISOString(),
        expiry_date: expiryDate.toISOString(),
        status: 'pending' as const,
        sent_via: 'email',
        response_deadline: expiryDate.toISOString(),
        benefits: formData.benefits,
        notes: formData.notes
      };

      const result = await onCreate(newOfferData);

      if (result.success) {
        setFormData({
          candidate_id: '',
          candidate_name: '',
          job_title: '',
          template: 'Full-time Offer - Standard',
          ctc_band: '4.0-6.0 LPA',
          offered_ctc: '',
          expiry_days: 7,
          benefits: ['Health Insurance'],
          notes: ''
        });
        onClose();
      } else {
        console.error('Error creating offer:', result.error);
      }
    } catch (error) {
      console.error('Error creating offer:', error);

    } finally {
      setIsSubmitting(false);
    }
  };

  const benefitOptions = [
    'Health Insurance',
    'Flexible Hours',
    'Learning Budget',
    'Gym Membership',
    'Food Safety Certification',
    'Transport Allowance',
    'Performance Bonus'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Create New Offer</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Candidate Name</label>
              <input
                type="text"
                value={formData.candidate_name}
                onChange={(e) => setFormData({ ...formData, candidate_name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Enter candidate name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
              <input
                type="text"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="e.g., Software Developer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Offer Template</label>
              <select
                value={formData.template}
                onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option>Full-time Offer - Standard</option>
                <option>Intern Offer - Tech</option>
                <option>Full-time Offer - Quality</option>
                <option>Contract Offer - Consultant</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CTC Band</label>
              <select
                value={formData.ctc_band}
                onChange={(e) => setFormData({ ...formData, ctc_band: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option>3.6-4.2 LPA</option>
                <option>4.0-6.0 LPA</option>
                <option>4.5-6.0 LPA</option>
                <option>6.0-8.0 LPA</option>
                <option>8.0-12.0 LPA</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Offered CTC</label>
              <input
                type="text"
                value={formData.offered_ctc}
                onChange={(e) => setFormData({ ...formData, offered_ctc: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="e.g., 5.2 LPA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expiry (Days)</label>
              <select
                value={formData.expiry_days}
                onChange={(e) => setFormData({ ...formData, expiry_days: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Benefits</label>
            <div className="grid grid-cols-2 gap-2">
              {benefitOptions.map(benefit => (
                <label key={benefit} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.benefits.includes(benefit)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, benefits: [...formData.benefits, benefit] });
                      } else {
                        setFormData({ ...formData, benefits: formData.benefits.filter(b => b !== benefit) });
                      }
                    }}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{benefit}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Additional notes about this offer..."
            />
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!formData.candidate_name || !formData.job_title || !formData.offered_ctc || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Offer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const OfferCard = ({
  offer,
  onViewDetails,
  onWithdraw,
  onExtend,
}: {
  offer: Offer;
  onViewDetails: (offer: Offer) => void;
  onWithdraw: (offer: Offer) => void;
  onExtend: (offer: Offer) => void;
}) => {
  const isExpiring = () => {
    const expiryDate = new Date(offer.expiry_date);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 2 && diffDays > 0;
  };

  const isExpired = () => new Date(offer.expiry_date) < new Date();

  const getDaysUntilExpiry = () => {
    const expiryDate = new Date(offer.expiry_date);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div
      className={`
        flex flex-col justify-between h-full
        bg-white rounded-xl border shadow-sm 
        hover:shadow-lg transition-shadow duration-200
        ${isExpiring() ? "border-yellow-300 bg-yellow-50" : ""}
        ${isExpired() ? "border-gray-300 bg-gray-50" : ""}
      `}
    >
      {/* Header */}
      <div className="p-5 border-b flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg truncate">
            {offer.candidate_name}
          </h3>
          <p className="text-sm text-gray-600">{offer.job_title}</p>
          <p className="text-xs text-gray-500 mt-1">{offer.template}</p>
        </div>

        <div className="flex flex-col items-end">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shadow-sm ${getStatusColor(
              offer.status
            )}`}
          >
            {getStatusIcon(offer.status)}
            <span className="ml-1 capitalize">{offer.status}</span>
          </span>
          {isExpiring() && (
            <span className="mt-1 text-xs text-yellow-700 font-medium">
              Expires in {getDaysUntilExpiry()} day(s)
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">CTC Band:</span>
          <span className="font-medium text-gray-900">{offer.ctc_band}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Offered:</span>
          <span className="font-bold text-green-600">{offer.offered_ctc}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Offer Date:</span>
          <span className="text-gray-900">
            {offer.offer_date
              ? new Date(offer.offer_date).toLocaleDateString()
              : "N/A"}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Expires:</span>
          <span
            className={`${isExpiring() ? "text-yellow-700 font-medium" : "text-gray-900"
              }`}
          >
            {new Date(offer.expiry_date).toLocaleDateString()}
          </span>
        </div>

        {/* Benefits */}
        {offer.benefits && offer.benefits.length > 0 && (
          <div>
            <p className="text-xs text-gray-600 mb-2">Benefits</p>
            <div className="flex flex-wrap gap-2">
              {offer.benefits.slice(0, 3).map((benefit, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                >
                  {benefit}
                </span>
              ))}
              {offer.benefits.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{offer.benefits.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Acceptance Notes */}
        {offer.status === "accepted" && offer.acceptance_notes && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-800">
              <strong>Acceptance Note:</strong> {offer.acceptance_notes}
            </p>
            {offer.response_date && (
              <p className="text-xs text-green-600 mt-1">
                Accepted on {new Date(offer.response_date).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      <div className="p-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onViewDetails(offer)}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
          >
            <EyeIcon className="h-3.5 w-3.5 mr-1" />
            View
          </button>

          {offer.status === "pending" && !isExpired() && (
            <button
              onClick={() => onExtend(offer)}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition"
            >
              <CalendarDaysIcon className="h-3.5 w-3.5 mr-1" />
              Extend
            </button>
          )}

          {offer.status === "pending" && (
            <button
              onClick={() => onWithdraw(offer)}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 transition"
            >
              <XCircleIcon className="h-3.5 w-3.5 mr-1" />
              Withdraw
            </button>
          )}
        </div>

        <div className="text-xs text-gray-500">Sent via {offer.sent_via}</div>
      </div>
    </div>
  );
};


const OffersDecisions = () => {
  // Filter and sort state
  const [filters, setFilters] = useState<OfferFilters>({});
  const [sort, setSort] = useState<OfferSortOptions>({
    field: 'inserted_at',
    direction: 'desc'
  });

  const {
    offers,
    loading,
    error,
    stats,
    createOffer,
    withdrawOffer,
    extendOfferExpiry,
    refreshOffers
  } = useOffers(filters, sort);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'success' });

  // Extract available filter options from offers
  const availableTemplates = useMemo(() => 
    [...new Set(offers.map(o => o.template).filter(Boolean))].sort() as string[],
    [offers]
  );

  const availableSentVia = useMemo(() => 
    [...new Set(offers.map(o => o.sent_via).filter(Boolean))].sort() as string[],
    [offers]
  );

  const availableBenefits = useMemo(() => {
    const benefits = new Set<string>();
    offers.forEach(o => {
      if (o.benefits) o.benefits.forEach(b => benefits.add(b));
    });
    return Array.from(benefits).sort();
  }, [offers]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleCreateOffer = async (newOfferData: Partial<Offer>) => {
    const result = await createOffer(newOfferData);
    if (result.success) {
      showToast('Offer created successfully!', 'success');
    } else {
      showToast(`Error creating offer: ${result.error}`, 'error');
    }
    return result;
  };

  const handleWithdrawOffer = (offer: Offer) => {
    setSelectedOffer(offer);
    setShowWithdrawModal(true);
  };

  const confirmWithdraw = async () => {
    if (selectedOffer) {
      const result = await withdrawOffer(selectedOffer.id);
      if (result.success) {
        showToast(`Offer withdrawn for ${selectedOffer.candidate_name}`, 'success');
      } else {
        showToast(`Error withdrawing offer: ${result.error}`, 'error');
      }
      setShowWithdrawModal(false);
      setSelectedOffer(null);
    }
  };

  const handleExtendOffer = (offer: Offer) => {
    setSelectedOffer(offer);
    setShowExtendModal(true);
  };

  // Accept/Reject functionality removed — use Withdraw/Extend instead

  const confirmExtend = async (days: number) => {
    if (selectedOffer) {
      const result = await extendOfferExpiry(selectedOffer.id, days);
      if (result.success) {
        showToast(`Offer extended by ${days} days for ${selectedOffer.candidate_name}`, 'success');
      } else {
        showToast(`Error extending offer: ${result.error}`, 'error');
      }
      setShowExtendModal(false);
      setSelectedOffer(null);
    }
  };

  const filteredOffers = filterStatus === 'all'
    ? offers
    : offers.filter(offer => offer.status === filterStatus);
  // Pagination calculations
const totalPages = Math.ceil(filteredOffers.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const currentOffers = filteredOffers.slice(startIndex, endIndex);

useEffect(() => {
  setCurrentPage(1);
}, [filterStatus]);

const handlePageChange = (page: number) => {
  setCurrentPage(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleItemsPerPageChange = (value: number) => {
  setItemsPerPage(value);
  setCurrentPage(1);
};

  const acceptanceRate = stats.acceptanceRate;
  const avgTimeToOffer = offers.filter(o => o.status === 'accepted').length > 0
    ? 5.2
    : 0;

  if (loading) {
    return (
      <div className="p-6 pb-20 md:pb-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 pb-20 md:pb-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading offers</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={refreshOffers}
                className="mt-2 text-sm text-red-600 hover:text-red-500"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offers & Decisions</h1>
          <p className="text-gray-600 mt-1">Manage job offers and candidate responses</p>
        </div>
        <div className="flex items-center gap-3">
          <OfferAdvancedFilters
            filters={filters}
            sort={sort}
            onFiltersChange={setFilters}
            onSortChange={setSort}
            onReset={() => {
              setFilters({});
              setSort({ field: 'inserted_at', direction: 'desc' });
            }}
            availableTemplates={availableTemplates}
            availableSentVia={availableSentVia}
            availableBenefits={availableBenefits}
          />
          <OfferSortButton
            sort={sort}
            onSortChange={setSort}
            onReset={() => setSort({ field: 'inserted_at', direction: 'desc' })}
          />
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Offer
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <DocumentTextIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600">Total Offers</p>
              <p className="text-xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600">Pending</p>
              <p className="text-xl font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600">Accepted</p>
              <p className="text-xl font-semibold text-gray-900">{stats.accepted}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircleIcon className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600">Rejected</p>
              <p className="text-xl font-semibold text-gray-900">{stats.rejected}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ExclamationCircleIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600">Expiring Soon</p>
              <p className="text-xl font-semibold text-gray-900">{stats.expiring_soon}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <ChartBarIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600">Accept Rate</p>
              <p className="text-xl font-semibold text-gray-900">{stats.acceptanceRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Acceptance Rate</p>
              <p className="text-3xl font-bold text-green-900">{acceptanceRate}%</p>
              <p className="text-xs text-green-600 mt-1">
                {stats.accepted} accepted of {stats.accepted + stats.rejected} responded
              </p>
            </div>
            <CheckCircleIcon className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Avg Time-to-Offer</p>
              <p className="text-3xl font-bold text-blue-900">{avgTimeToOffer} days</p>
              <p className="text-xs text-blue-600 mt-1">From interview to offer</p>
            </div>
            <ClockIcon className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Avg CTC Offered</p>
              <p className="text-3xl font-bold text-purple-900">
                {stats.avgCTC} L
              </p>
              <p className="text-xs text-purple-600 mt-1">Across all offers</p>
            </div>
            <BanknotesIcon className="h-12 w-12 text-purple-600" />
          </div>
        </div>
      </div>

     {/* Filters */}
<div className="mb-6">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="flex items-center flex-wrap gap-2">
      <span className="text-sm font-medium text-gray-700">Filter by status:</span>
      {[
        { key: 'all', label: 'All Offers' },
        { key: 'pending', label: 'Pending' },
        { key: 'accepted', label: 'Accepted' },
        { key: 'rejected', label: 'Rejected' },
        { key: 'expired', label: 'Expired' },
        { key: 'withdrawn', label: 'Withdrawn' }
      ].map(filter => (
        <button
          key={filter.key}
          onClick={() => setFilterStatus(filter.key)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filterStatus === filter.key
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
    
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-700">Show:</span>
      <select
        value={itemsPerPage}
        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value={3}>3 per page</option>
        <option value={6}>6 per page</option>
        <option value={12}>12 per page</option>
        <option value={24}>24 per page</option>
      </select>
    </div>
  </div>
</div>

{/* Offers Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {currentOffers.map(offer => (
    <OfferCard
      key={offer.id}
      offer={offer}
      onViewDetails={(offer: Offer) => {
        setSelectedOffer(offer);
        setShowDetailsDrawer(true);
      }}
      onWithdraw={handleWithdrawOffer}
      onExtend={handleExtendOffer}
    />
  ))}
</div>

{/* Pagination */}
{filteredOffers.length > 0 && totalPages > 1 && (
  <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-gray-200">
    <div className="text-sm text-gray-700">
      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
      <span className="font-medium">{Math.min(endIndex, filteredOffers.length)}</span> of{' '}
      <span className="font-medium">{filteredOffers.length}</span> offers
    </div>

    <div className="flex items-center gap-2">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          const showPage =
            page === 1 ||
            page === totalPages ||
            (page >= currentPage - 1 && page <= currentPage + 1);

          const showEllipsis =
            (page === 2 && currentPage > 3) ||
            (page === totalPages - 1 && currentPage < totalPages - 2);

          if (showEllipsis) {
            return (
              <span key={page} className="px-2 text-gray-500">
                ...
              </span>
            );
          }

          if (!showPage) return null;

          return (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`min-w-[40px] h-10 rounded-lg text-sm font-medium transition-colors ${
                currentPage === page
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  </div>
)}
      {/* Create Offer Modal */}
      <CreateOfferModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateOffer}
      />

      {/* Withdraw Confirmation Modal */}
      <ConfirmationModal
        isOpen={showWithdrawModal}
        onClose={() => {
          setShowWithdrawModal(false);
          setSelectedOffer(null);
        }}
        onConfirm={confirmWithdraw}
        title="Withdraw Offer"
        message={`Are you sure you want to withdraw the offer for ${selectedOffer?.candidate_name}? This action cannot be undone.`}
        confirmText="Withdraw Offer"
        type="danger"
      />

      {/* Extend Offer Modal */}
      <ExtendOfferModal
        isOpen={showExtendModal}
        onClose={() => {
          setShowExtendModal(false);
          setSelectedOffer(null);
        }}
        onConfirm={confirmExtend}
        candidateName={selectedOffer?.candidate_name || ''}
        currentExpiryDate={selectedOffer?.expiry_date}
        currentOfferDate={selectedOffer?.offer_date}
      />

      {/* Offer Details Drawer */}
      <OfferDetailsDrawer
        isOpen={showDetailsDrawer}
        onClose={() => {
          setShowDetailsDrawer(false);
          setSelectedOffer(null);
        }}
        offer={selectedOffer}
      />

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
};

export default OffersDecisions;