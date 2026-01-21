/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import {
  PlusCircleIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  TrashIcon,
  StarIcon,
  ChatBubbleLeftIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import SearchBar from '../../../components/common/SearchBar';

/* ==============================
   TYPES & INTERFACES
   ============================== */
interface Circular {
  id: string;
  title: string;
  content: string;
  category: 'academic' | 'event' | 'fee' | 'general' | 'urgent';
  targetAudience: 'all' | 'class-specific' | 'student-specific';
  targetClasses?: string[];
  targetStudents?: string[];
  createdAt: string;
  createdBy: string;
  status: 'draft' | 'sent' | 'scheduled';
  scheduledFor?: string;
  totalRecipients: number;
  readBy: number;
  acknowledgedBy: number;
  priority: 'low' | 'medium' | 'high';
}

interface Feedback {
  id: string;
  parentName: string;
  studentName: string;
  studentClass: string;
  category: 'academic' | 'infrastructure' | 'transport' | 'staff' | 'other';
  subject: string;
  message: string;
  rating: number;
  status: 'new' | 'in-review' | 'resolved' | 'closed';
  submittedAt: string;
  respondedAt?: string;
  response?: string;
}

interface Grievance {
  id: string;
  ticketNumber: string;
  parentName: string;
  studentName: string;
  studentClass: string;
  category:
    | 'academic'
    | 'discipline'
    | 'infrastructure'
    | 'transport'
    | 'staff'
    | 'safety'
    | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  subject: string;
  description: string;
  status: 'new' | 'in-progress' | 'resolved' | 'closed' | 'escalated';
  submittedAt: string;
  assignedTo?: string;
  resolvedAt?: string;
  responseTime?: string;
  resolution?: string;
  satisfactionRating?: number;
  attachments?: string[];
  comments: GrievanceComment[];
}

interface GrievanceComment {
  id: string;
  author: string;
  role: 'parent' | 'admin' | 'teacher';
  message: string;
  timestamp: string;
}

/* ==============================
   STATS CARD COMPONENT
   ============================== */
const StatsCard = ({
  label,
  value,
  icon: Icon,
  color = 'blue',
  trend,
}: {
  label: string;
  value: number | string;
  icon: any;
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'red';
  trend?: { value: string; isPositive: boolean };
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p
              className={`text-xs font-medium mt-1 ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl border ${colorClasses[color]} transition-colors`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

/* ==============================
   CREATE CIRCULAR MODAL
   ============================== */
const CreateCircularModal = ({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (circular: any) => void;
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('general');
  const [targetAudience, setTargetAudience] = useState<string>('all');
  const [priority, setPriority] = useState<string>('medium');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const classes = ['9-A', '9-B', '10-A', '10-B', '11-A', '11-B', '12-A', '12-B'];

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!content.trim()) {
      setError('Content is required');
      return;
    }
    if (targetAudience === 'class-specific' && selectedClasses.length === 0) {
      setError('Please select at least one class');
      return;
    }

    setError(null);
    setSubmitting(true);

    setTimeout(() => {
      onCreated({
        title,
        content,
        category,
        targetAudience,
        targetClasses: targetAudience === 'class-specific' ? selectedClasses : undefined,
        priority,
      });
      setSubmitting(false);
      handleClose();
    }, 500);
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setCategory('general');
    setTargetAudience('all');
    setPriority('medium');
    setSelectedClasses([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
          aria-hidden="true"
        />
        <div className="relative w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">Create New Circular</h2>
              <p className="mt-1 text-sm text-gray-500">Broadcast announcement to parents</p>
            </div>
            <button
              onClick={handleClose}
              className="ml-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                  placeholder="e.g., Parent-Teacher Meeting Schedule"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                  >
                    <option value="general">General</option>
                    <option value="academic">Academic</option>
                    <option value="event">Event</option>
                    <option value="fee">Fee</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                  >
                    <option value="all">All Parents</option>
                    <option value="class-specific">Specific Classes</option>
                  </select>
                </div>
              </div>

              {targetAudience === 'class-specific' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Classes <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {classes.map((cls) => (
                      <label key={cls} className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedClasses.includes(cls)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedClasses([...selectedClasses, cls]);
                            } else {
                              setSelectedClasses(selectedClasses.filter((c) => c !== cls));
                            }
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">{cls}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
                  placeholder="Enter the circular content here..."
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
            <button
              onClick={handleClose}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4" />
                  Send Circular
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==============================
   CIRCULAR CARD
   ============================== */
const CircularCard = ({
  circular,
  onView,
  onDelete,
}: {
  circular: Circular;
  onView: () => void;
  onDelete: () => void;
}) => {
  const categoryColors = {
    academic: 'bg-blue-100 text-blue-700',
    event: 'bg-purple-100 text-purple-700',
    fee: 'bg-amber-100 text-amber-700',
    general: 'bg-gray-100 text-gray-700',
    urgent: 'bg-red-100 text-red-700',
  };

  const priorityColors = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
  };

  const readPercentage = Math.round((circular.readBy / circular.totalRecipients) * 100);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-1 rounded-md text-xs font-semibold ${
                categoryColors[circular.category]
              }`}
            >
              {circular.category}
            </span>
            <span
              className={`px-2 py-1 rounded-md text-xs font-semibold ${
                priorityColors[circular.priority]
              }`}
            >
              {circular.priority}
            </span>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">{circular.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{circular.content}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Recipients</p>
          <p className="text-lg font-bold text-gray-900">{circular.totalRecipients}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-green-600 mb-1">Read</p>
          <p className="text-lg font-bold text-green-700">{circular.readBy}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600 mb-1">Acknowledged</p>
          <p className="text-lg font-bold text-blue-700">{circular.acknowledgedBy}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Read Rate</span>
          <span className="font-semibold">{readPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all"
            style={{ width: `${readPercentage}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <span>Created: {circular.createdAt}</span>
        <span>By: {circular.createdBy}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onView}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <EyeIcon className="h-4 w-4" />
          View Details
        </button>
        <button
          onClick={onDelete}
          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

/* ==============================
   FEEDBACK CARD
   ============================== */
const FeedbackCard = ({ feedback, onRespond }: { feedback: Feedback; onRespond: () => void }) => {
  const statusColors = {
    new: 'bg-blue-100 text-blue-700',
    'in-review': 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-1 rounded-md text-xs font-semibold ${
                statusColors[feedback.status]
              }`}
            >
              {feedback.status}
            </span>
            <span className="text-xs text-gray-500">{feedback.category}</span>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">{feedback.subject}</h3>
          <p className="text-sm text-gray-600 mb-2">
            {feedback.parentName} • {feedback.studentName} ({feedback.studentClass})
          </p>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={`h-4 w-4 ${
                i < feedback.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-4 line-clamp-3">{feedback.message}</p>

      {feedback.response && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-xs font-semibold text-green-800 mb-1">Response:</p>
          <p className="text-sm text-green-900">{feedback.response}</p>
          <p className="text-xs text-green-600 mt-2">Responded: {feedback.respondedAt}</p>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <span>Submitted: {feedback.submittedAt}</span>
      </div>

      {feedback.status !== 'resolved' && feedback.status !== 'closed' && (
        <button
          onClick={onRespond}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          <ChatBubbleLeftIcon className="h-4 w-4" />
          Respond to Feedback
        </button>
      )}
    </div>
  );
};

/* ==============================
   GRIEVANCE CARD
   ============================== */
const GrievanceCard = ({ grievance, onView }: { grievance: Grievance; onView: () => void }) => {
  const statusColors = {
    new: 'bg-blue-100 text-blue-700 border-blue-200',
    'in-progress': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    resolved: 'bg-green-100 text-green-700 border-green-200',
    closed: 'bg-gray-100 text-gray-700 border-gray-200',
    escalated: 'bg-red-100 text-red-700 border-red-200',
  };

  const priorityColors = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };

  const categoryIcons = {
    academic: '📚',
    discipline: '⚖️',
    infrastructure: '🏫',
    transport: '🚌',
    staff: '👥',
    safety: '🛡️',
    other: '📋',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-2xl">{categoryIcons[grievance.category]}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-mono font-semibold text-gray-600">
                #{grievance.ticketNumber}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                  priorityColors[grievance.priority]
                }`}
              >
                {grievance.priority}
              </span>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">{grievance.subject}</h3>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
            statusColors[grievance.status]
          }`}
        >
          {grievance.status}
        </span>
      </div>

      {/* Parent & Student Info */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-gray-600">Parent</p>
            <p className="font-medium text-gray-900">{grievance.parentName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Student</p>
            <p className="font-medium text-gray-900">
              {grievance.studentName} ({grievance.studentClass})
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{grievance.description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <CalendarDaysIcon className="h-4 w-4" />
            {grievance.submittedAt}
          </span>
          {grievance.assignedTo && (
            <span className="flex items-center gap-1">
              <UserCircleIcon className="h-4 w-4" />
              {grievance.assignedTo}
            </span>
          )}
        </div>

        <button
          onClick={onView}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <EyeIcon className="h-4 w-4" />
          View
        </button>
      </div>
    </div>
  );
};

/* ==============================
   GRIEVANCE DETAILS MODAL
   ============================== */
const GrievanceDetailsModal = ({
  grievance,
  isOpen,
  onClose,
}: {
  grievance: Grievance | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [newComment, setNewComment] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [resolution, setResolution] = useState('');

  if (!isOpen || !grievance) return null;

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    console.log('New comment:', newComment);
    setNewComment('');
  };

  const handleResolve = () => {
    if (!resolution.trim() && selectedAction === 'resolve') {
      alert('Please provide resolution details');
      return;
    }
    console.log('Resolving grievance:', { grievanceId: grievance.id, resolution });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold text-gray-900">Grievance Details</h2>
                <span className="text-sm font-mono font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
                  #{grievance.ticketNumber}
                </span>
              </div>
              <p className="text-sm text-gray-500">{grievance.subject}</p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {/* Status & Priority */}
            <div className="flex items-center gap-3 mb-6">
              <span
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  grievance.status === 'new'
                    ? 'bg-blue-100 text-blue-700'
                    : grievance.status === 'in-progress'
                      ? 'bg-yellow-100 text-yellow-700'
                      : grievance.status === 'resolved'
                        ? 'bg-green-100 text-green-700'
                        : grievance.status === 'escalated'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                }`}
              >
                Status: {grievance.status}
              </span>
              <span
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  grievance.priority === 'critical'
                    ? 'bg-red-100 text-red-700'
                    : grievance.priority === 'high'
                      ? 'bg-orange-100 text-orange-700'
                      : grievance.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                }`}
              >
                Priority: {grievance.priority}
              </span>
              <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-purple-100 text-purple-700">
                Category: {grievance.category}
              </span>
            </div>

            {/* Complainant Info */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 mb-6 border border-indigo-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Complainant Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Parent Name</p>
                  <p className="font-semibold text-gray-900">{grievance.parentName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Student Name</p>
                  <p className="font-semibold text-gray-900">{grievance.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Class</p>
                  <p className="font-semibold text-gray-900">{grievance.studentClass}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Submitted On</p>
                  <p className="font-semibold text-gray-900">{grievance.submittedAt}</p>
                </div>
                {grievance.assignedTo && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Assigned To</p>
                    <p className="font-semibold text-gray-900">{grievance.assignedTo}</p>
                  </div>
                )}
                {grievance.responseTime && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Response Time</p>
                    <p className="font-semibold text-gray-900">{grievance.responseTime}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-800 leading-relaxed">{grievance.description}</p>
              </div>
            </div>

            {/* Resolution (if resolved) */}
            {grievance.resolution && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Resolution</h3>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-green-900 leading-relaxed">{grievance.resolution}</p>
                  {grievance.resolvedAt && (
                    <p className="text-xs text-green-600 mt-2">
                      Resolved on: {grievance.resolvedAt}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Comments ({grievance.comments.length})
              </h3>
              <div className="space-y-3 mb-4">
                {grievance.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`rounded-lg p-4 ${
                      comment.role === 'parent'
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {comment.author}{' '}
                        <span className="text-xs text-gray-600">({comment.role})</span>
                      </span>
                      <span className="text-xs text-gray-500">{comment.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.message}</p>
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              {grievance.status !== 'closed' && (
                <div className="flex gap-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
                  />
                  <button
                    onClick={handleSubmitComment}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            {grievance.status !== 'resolved' && grievance.status !== 'closed' && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Take Action</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                    <select
                      value={selectedAction}
                      onChange={(e) => setSelectedAction(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                    >
                      <option value="">Select an action</option>
                      <option value="in-progress">Mark as In Progress</option>
                      <option value="resolve">Resolve Grievance</option>
                      <option value="escalate">Escalate</option>
                      <option value="close">Close Without Resolution</option>
                    </select>
                  </div>

                  {selectedAction === 'resolve' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resolution Details
                      </label>
                      <textarea
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        rows={4}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
                        placeholder="Describe how this grievance was resolved..."
                      />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleResolve}
                      disabled={!selectedAction}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      Submit Action
                    </button>
                    <button
                      onClick={onClose}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==============================
   MAIN COMPONENT
   ============================== */
const CircularsFeedback: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'circulars' | 'feedback' | 'grievances'>('circulars');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [showGrievanceModal, setShowGrievanceModal] = useState(false);

  // Sample data
  const [circulars] = useState<Circular[]>([
    {
      id: '1',
      title: 'Parent-Teacher Meeting Scheduled',
      content:
        'We are pleased to inform you that the parent-teacher meeting for this semester is scheduled for January 15, 2025. Please mark your calendars.',
      category: 'event',
      targetAudience: 'all',
      createdAt: 'Jan 5, 2025',
      createdBy: 'Admin',
      status: 'sent',
      totalRecipients: 450,
      readBy: 380,
      acknowledgedBy: 320,
      priority: 'high',
    },
    {
      id: '2',
      title: 'Fee Payment Reminder',
      content:
        'This is a reminder to pay the second installment of school fees by January 20, 2025. Late payments will incur a fine.',
      category: 'fee',
      targetAudience: 'all',
      createdAt: 'Jan 3, 2025',
      createdBy: 'Finance Dept',
      status: 'sent',
      totalRecipients: 450,
      readBy: 425,
      acknowledgedBy: 410,
      priority: 'medium',
    },
  ]);

  const [feedback] = useState<Feedback[]>([
    {
      id: '1',
      parentName: 'Rajesh Kumar',
      studentName: 'Ananya Kumar',
      studentClass: '10-A',
      category: 'academic',
      subject: 'Request for Extra Classes',
      message:
        'My daughter is struggling with Mathematics. Could we arrange extra coaching sessions?',
      rating: 4,
      status: 'new',
      submittedAt: 'Jan 6, 2025',
    },
    {
      id: '2',
      parentName: 'Priya Sharma',
      studentName: 'Rohan Sharma',
      studentClass: '9-B',
      category: 'infrastructure',
      subject: 'Library Facilities',
      message:
        'The school library has limited books on Science. Please consider adding more reference books.',
      rating: 3,
      status: 'in-review',
      submittedAt: 'Jan 5, 2025',
    },
  ]);

  const [grievances] = useState<Grievance[]>([
    {
      id: '1',
      ticketNumber: 'GRV-2025-001',
      parentName: 'Rajesh Kumar',
      studentName: 'Ananya Kumar',
      studentClass: '10-A',
      category: 'academic',
      priority: 'high',
      subject: 'Excessive Homework Load',
      description:
        'My daughter is receiving too much homework daily which is affecting her health. She stays up late every night to complete assignments. Request to review the homework policy.',
      status: 'new',
      submittedAt: 'Jan 6, 2025 10:30 AM',
      comments: [],
    },
    {
      id: '2',
      ticketNumber: 'GRV-2025-002',
      parentName: 'Priya Sharma',
      studentName: 'Rohan Sharma',
      studentClass: '9-B',
      category: 'discipline',
      priority: 'critical',
      subject: 'Bullying Incident',
      description:
        'My son has been subjected to bullying by senior students for the past week. This is affecting his mental health and he is scared to come to school. Immediate action required.',
      status: 'in-progress',
      submittedAt: 'Jan 5, 2025 2:15 PM',
      assignedTo: 'Principal',
      responseTime: '2 hours',
      comments: [
        {
          id: '1',
          author: 'Principal',
          role: 'admin',
          message:
            'We have taken this matter seriously. Investigation is underway and counseling has been arranged for your son.',
          timestamp: 'Jan 5, 2025 4:30 PM',
        },
      ],
    },
    {
      id: '3',
      ticketNumber: 'GRV-2025-003',
      parentName: 'Amit Patel',
      studentName: 'Diya Patel',
      studentClass: '11-C',
      category: 'infrastructure',
      priority: 'medium',
      subject: 'Laboratory Equipment Issues',
      description:
        'The chemistry lab lacks proper equipment for practical sessions. Students are not getting hands-on experience which is crucial for board exams.',
      status: 'resolved',
      submittedAt: 'Jan 3, 2025 11:00 AM',
      assignedTo: 'Lab Coordinator',
      resolvedAt: 'Jan 5, 2025',
      responseTime: '4 hours',
      resolution:
        'New equipment has been ordered and will be installed by Jan 15, 2025. Temporary arrangements have been made with nearby school for practical sessions.',
      satisfactionRating: 4,
      comments: [
        {
          id: '1',
          author: 'Lab Coordinator',
          role: 'admin',
          message: 'Thank you for bringing this to our attention. We are procuring new equipment.',
          timestamp: 'Jan 3, 2025 3:00 PM',
        },
      ],
    },
  ]);

  // Filtered grievances
  const filteredGrievances = useMemo(() => {
    return grievances.filter((grievance) => {
      const matchesSearch =
        grievance.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grievance.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grievance.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grievance.studentName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus === 'all' || grievance.status === filterStatus;

      const matchesPriority = filterPriority === 'all' || grievance.priority === filterPriority;

      const matchesCategory = filterCategory === 'all' || grievance.category === filterCategory;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [grievances, searchQuery, filterStatus, filterPriority, filterCategory]);

  const stats = {
    totalCirculars: circulars.length,
    totalFeedback: feedback.length,
    newFeedback: feedback.filter((f) => f.status === 'new').length,
    avgRating: feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length || 0,
    totalGrievances: grievances.length,
    newGrievances: grievances.filter((g) => g.status === 'new').length,
    inProgressGrievances: grievances.filter((g) => g.status === 'in-progress').length,
    resolvedGrievances: grievances.filter((g) => g.status === 'resolved').length,
  };

  const handleViewGrievance = (grievance: Grievance) => {
    setSelectedGrievance(grievance);
    setShowGrievanceModal(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="flex items-center justify-center h-12 w-12 bg-indigo-100 rounded-xl shrink-0">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                Parent Communication
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage circulars, feedback, and grievances
              </p>
            </div>
          </div>

          {activeTab === 'circulars' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md"
            >
              <PlusCircleIcon className="h-5 w-5" />
              Create Circular
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {activeTab === 'circulars' && (
          <>
            <StatsCard
              label="Total Circulars"
              value={stats.totalCirculars}
              icon={DocumentTextIcon}
              color="blue"
            />
            <StatsCard
              label="Sent This Month"
              value={stats.totalCirculars}
              icon={PaperAirplaneIcon}
              color="green"
            />
            <StatsCard label="Avg Read Rate" value="85%" icon={EyeIcon} color="purple" />
            <StatsCard label="Acknowledged" value="72%" icon={CheckCircleIcon} color="amber" />
          </>
        )}
        {activeTab === 'feedback' && (
          <>
            <StatsCard
              label="Total Feedback"
              value={stats.totalFeedback}
              icon={ChatBubbleLeftIcon}
              color="blue"
            />
            <StatsCard
              label="New Feedback"
              value={stats.newFeedback}
              icon={ClockIcon}
              color="amber"
            />
            <StatsCard
              label="Avg Rating"
              value={stats.avgRating.toFixed(1)}
              icon={StarIcon}
              color="green"
            />
            <StatsCard label="Response Rate" value="90%" icon={CheckCircleIcon} color="purple" />
          </>
        )}
        {activeTab === 'grievances' && (
          <>
            <StatsCard
              label="Total Grievances"
              value={stats.totalGrievances}
              icon={ExclamationTriangleIcon}
              color="blue"
            />
            <StatsCard label="New" value={stats.newGrievances} icon={ClockIcon} color="amber" />
            <StatsCard
              label="In Progress"
              value={stats.inProgressGrievances}
              icon={ArrowPathIcon}
              color="purple"
            />
            <StatsCard
              label="Resolved"
              value={stats.resolvedGrievances}
              icon={CheckCircleIcon}
              color="green"
            />
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('circulars')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                activeTab === 'circulars'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Circulars ({circulars.length})
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                activeTab === 'feedback'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Feedback ({feedback.length})
            </button>
            <button
              onClick={() => setActiveTab('grievances')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                activeTab === 'grievances'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Grievances ({grievances.length})
            </button>
          </div>
        </div>

        <div className="p-5">
          {/* Filters */}
          {activeTab === 'grievances' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search grievances..."
              />

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="escalated">Escalated</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              >
                <option value="all">All Categories</option>
                <option value="academic">Academic</option>
                <option value="discipline">Discipline</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="transport">Transport</option>
                <option value="staff">Staff</option>
                <option value="safety">Safety</option>
                <option value="other">Other</option>
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={`Search ${activeTab}...`}
              />

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              >
                <option value="all">All Categories</option>
                <option value="academic">Academic</option>
                {activeTab === 'circulars' && (
                  <>
                    <option value="event">Event</option>
                    <option value="fee">Fee</option>
                    <option value="general">General</option>
                    <option value="urgent">Urgent</option>
                  </>
                )}
                {activeTab === 'feedback' && (
                  <>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="transport">Transport</option>
                    <option value="staff">Staff</option>
                    <option value="other">Other</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Content */}
          {activeTab === 'circulars' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {circulars.map((circular) => (
                <CircularCard
                  key={circular.id}
                  circular={circular}
                  onView={() => alert(`View circular: ${circular.title}`)}
                  onDelete={() => alert(`Delete circular: ${circular.id}`)}
                />
              ))}
            </div>
          ) : activeTab === 'feedback' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {feedback.map((fb) => (
                <FeedbackCard
                  key={fb.id}
                  feedback={fb}
                  onRespond={() => alert(`Respond to: ${fb.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredGrievances.length === 0 ? (
                <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <ExclamationTriangleIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No grievances found</h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              ) : (
                filteredGrievances.map((grievance) => (
                  <GrievanceCard
                    key={grievance.id}
                    grievance={grievance}
                    onView={() => handleViewGrievance(grievance)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Circular Modal */}
      <CreateCircularModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(circular) => {
          console.log('New circular:', circular);
          setShowCreateModal(false);
        }}
      />

      {/* Grievance Details Modal */}
      <GrievanceDetailsModal
        grievance={selectedGrievance}
        isOpen={showGrievanceModal}
        onClose={() => {
          setShowGrievanceModal(false);
          setSelectedGrievance(null);
        }}
      />
    </div>
  );
};

export default CircularsFeedback;
