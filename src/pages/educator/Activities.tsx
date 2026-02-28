import { useState, useEffect, useMemo } from 'react';
import {
  FunnelIcon,
  TableCellsIcon,
  Squares2X2Icon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  CalendarIcon,
  DocumentIcon,
  VideoCameraIcon,
  LinkIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { createClient } from '@supabase/supabase-js';
import { useEducatorSchool } from '../../hooks/useEducatorSchool';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

// Add animation styles
const modalAnimationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes scaleIn {
    from { 
      opacity: 0;
      transform: scale(0.9);
    }
    to { 
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }
  
  .animate-scaleIn {
    animation: scaleIn 0.3s ease-out;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = modalAnimationStyles;
  document.head.appendChild(styleSheet);
}

interface Activity {
  id: string;
  student_id: string;
  student: string;
  title: string;
  type: 'Project' | 'Training' | 'Certificate';
  status: 'pending' | 'sent_to_admin' | 'approved' | 'rejected';
  date: string;
  description: string;
  approval_notes?: string;
  tech_stack?: string[];
  demo_link?: string;
  github_link?: string;
  start_date?: string;
  end_date?: string;
  duration?: string;
  organization?: string;
  certificate_url?: string;
  video_url?: string;
  ppt_url?: string;
  issuer?: string;
  level?: string;
  credential_id?: string;
  link?: string;
  issued_on?: string;
  document_url?: string;
}

const FilterSection = ({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
};

const CheckboxGroup = ({ options, selectedValues, onChange }: { options: any[]; selectedValues: string[]; onChange: (values: string[]) => void }) => {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label key={option.value} className="flex items-center">
          <input
            type="checkbox"
            checked={selectedValues.includes(option.value)}
            onChange={(e) => {
              if (e.target.checked) {
                onChange([...selectedValues, option.value]);
              } else {
                onChange(selectedValues.filter(v => v !== option.value));
              }
            }}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">{option.label}</span>
          {option.count && (
            <span className="ml-auto text-xs text-gray-500">({option.count})</span>
          )}
        </label>
      ))}
    </div>
  );
};

const ActivityDetailModal = ({ isOpen, onClose, activity, onVerify, onReject, onShowError }: { 
  isOpen: boolean; 
  onClose: () => void; 
  activity: Activity | null; 
  onVerify: (id: string, remark: string) => Promise<void>; 
  onReject: (id: string, remark: string) => Promise<void>;
  onShowError: (msg: string) => void;
}) => {
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activity) {
      setRemark(activity.approval_notes || '');
    }
  }, [isOpen, activity]);

  const handleVerify = async () => {
    if (!activity) return;
    
    if (!remark.trim() && activity.status === 'pending') {
      onShowError('Please provide remarks before taking action');
      return;
    }
    
    setLoading(true);
    try {
      await onVerify(activity.id, remark);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!activity) return;
    
    if (!remark.trim() && activity.status === 'pending') {
      onShowError('Please provide remarks before taking action');
      return;
    }
    
    setLoading(true);
    try {
      await onReject(activity.id, remark);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !activity) return null;

  const getTypeIcon = () => {
    switch (activity.type) {
      case 'Project': return <BriefcaseIcon className="h-5 w-5" />;
      case 'Training': return <AcademicCapIcon className="h-5 w-5" />;
      case 'Certificate': return <ClipboardDocumentCheckIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full animate-scaleIn">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-primary-100 text-primary-600">
                  {getTypeIcon()}
                </div>
                <div>
                  <h1 className="text-lg font-medium text-gray-900">{activity.type} Details</h1>
                  <p className="text-sm text-gray-500">{activity.student}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <p className="text-base text-gray-900">{activity.title}</p>
              </div>

              {activity.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                </div>
              )}

              {activity.type === 'Project' && (
                <>
                  {activity.organization && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                      <p className="text-sm text-gray-900">{activity.organization}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    {activity.start_date && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <p className="text-sm text-gray-900">{new Date(activity.start_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {activity.end_date && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <p className="text-sm text-gray-900">{new Date(activity.end_date).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {activity.tech_stack && activity.tech_stack.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tech Stack</label>
                      <div className="flex flex-wrap gap-2">
                        {activity.tech_stack.map((tech, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(activity.demo_link || activity.github_link) && (
                    <div className="space-y-2">
                      {activity.demo_link && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Demo Link</label>
                          <a href={activity.demo_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                            <LinkIcon className="h-4 w-4" />
                            {activity.demo_link}
                          </a>
                        </div>
                      )}
                      {activity.github_link && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Link</label>
                          <a href={activity.github_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                            <LinkIcon className="h-4 w-4" />
                            {activity.github_link}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {(activity.certificate_url || activity.video_url || activity.ppt_url) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
                      <div className="space-y-2">
                        {activity.certificate_url && (
                          <a href={activity.certificate_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary-600 hover:underline">
                            <DocumentIcon className="h-4 w-4" />
                            Certificate
                          </a>
                        )}
                        {activity.video_url && (
                          <a href={activity.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary-600 hover:underline">
                            <VideoCameraIcon className="h-4 w-4" />
                            Video
                          </a>
                        )}
                        {activity.ppt_url && (
                          <a href={activity.ppt_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary-600 hover:underline">
                            <DocumentIcon className="h-4 w-4" />
                            Presentation
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {activity.type === 'Training' && (
                <>
                  {activity.organization && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                      <p className="text-sm text-gray-900">{activity.organization}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {activity.start_date && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <p className="text-sm text-gray-900">{new Date(activity.start_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {activity.end_date && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <p className="text-sm text-gray-900">{new Date(activity.end_date).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                  {activity.duration && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                      <p className="text-sm text-gray-900">{activity.duration}</p>
                    </div>
                  )}
                </>
              )}

              {activity.type === 'Certificate' && (
                <>
                  {activity.issuer && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Issuer</label>
                      <p className="text-sm text-gray-900">{activity.issuer}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {activity.level && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                        <p className="text-sm text-gray-900">{activity.level}</p>
                      </div>
                    )}
                    {activity.issued_on && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Issued On</label>
                        <p className="text-sm text-gray-900">{new Date(activity.issued_on).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                  {activity.credential_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Credential ID</label>
                      <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">{activity.credential_id}</p>
                    </div>
                  )}
                  {activity.link && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Verification Link</label>
                      <a href={activity.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                        <LinkIcon className="h-4 w-4" />
                        {activity.link}
                      </a>
                    </div>
                  )}
                  {activity.document_url && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Document</label>
                      <a href={activity.document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary-600 hover:underline">
                        <DocumentIcon className="h-4 w-4" />
                        View Certificate Document
                      </a>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Educator Remarks {activity.status === 'pending' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Add your feedback or remarks..."
                  disabled={activity.status !== 'pending'}
                />
              </div>

              {activity.approval_notes && activity.status !== 'pending' && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <label className="block text-sm font-medium text-blue-900 mb-1">Previous Remarks</label>
                  <p className="text-sm text-blue-800">{activity.approval_notes}</p>
                </div>
              )}
            </div>
          </div>

          {activity.status === 'pending' && (
            <div className="bg-gray-50 px-4 py-3 sm:px-6 flex items-center justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Reject
                  </>
                )}
              </button>
              <button
                onClick={handleVerify}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-1" />
                    Verify
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ActivityCard = ({ activity, onViewDetails, isSelected, onSelect }: { 
  activity: Activity; 
  onViewDetails: (activity: Activity) => void; 
  onVerify: (id: string, remark: string) => Promise<void>; 
  onReject: (id: string, remark: string) => Promise<void>;
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
}) => {
  const getTypeColor = () => {
    switch (activity.type) {
      case 'Project': return 'bg-blue-100 text-blue-800';
      case 'Training': return 'bg-purple-100 text-purple-800';
      case 'Certificate': return 'bg-green-100 text-green-800';
    }
  };

  const getStatusColor = () => {
    switch (activity.status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'sent_to_admin': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'approved': return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  const getStatusLabel = () => {
    switch (activity.status) {
      case 'pending': return 'Pending';
      case 'sent_to_admin': return 'Sent to Admin';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          {activity.status === 'pending' && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(activity.id, e.target.checked)}
              className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTypeColor()}`}>
                {activity.type}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getStatusColor()}`}>
                {getStatusLabel()}
              </span>
            </div>
            <p className="font-medium text-gray-900 mb-2">{activity.student}</p>
            <label className="font-semibold text-gray-900 mb-1">{activity.title}</label>
            {activity.description && (
              <p className="text-xs text-gray-600 line-clamp-2">{activity.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <CalendarIcon className="h-3 w-3" />
          {new Date(activity.date).toLocaleDateString()}
        </span>
        <div className="flex space-x-2">
          <button
            onClick={() => onViewDetails(activity)}
            className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <EyeIcon className="h-3 w-3 mr-1" />
            Verify
          </button>
        </div>
      </div>
    </div>
  );
};

const Activities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'sent_to_admin' | 'approved' | 'rejected'>('pending');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [detailModal, setDetailModal] = useState<Activity | null>(null);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{
    types: string[];
    dateRange: { start: string; end: string };
  }>({
    types: [],
    dateRange: { start: '', end: '' }
  });
  const [sortBy, setSortBy] = useState('date_desc');

  // Modal states for notifications and confirmations
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showBulkVerifyConfirm, setShowBulkVerifyConfirm] = useState(false);
  const [showBulkRejectConfirm, setShowBulkRejectConfirm] = useState(false);
  const [bulkRemark, setBulkRemark] = useState('');

  // Get educator's school information with class assignments
  const { school: educatorSchool, college: educatorCollege, educatorType, educatorRole, assignedClassIds, loading: schoolLoading } = useEducatorSchool();

  useEffect(() => {
    // Wait for school data before fetching activities
    if (schoolLoading || (!educatorSchool && !educatorCollege)) return;
    fetchActivities();
  }, [educatorSchool, educatorCollege, assignedClassIds, schoolLoading]);

  const fetchActivities = async () => {
    if (!educatorSchool?.id && !educatorCollege?.id) return;
    
    setLoading(true);
    try {
      let students;
      
      if (educatorType === 'school' && educatorSchool) {
        // For school educators, check role and class assignments
        if (educatorRole === 'admin' || educatorRole === 'school_admin') {
          // School admins can see all students in their school
          const { data } = await supabase
            .from('students')
            .select('id, name, user_id')
            .eq('school_id', educatorSchool.id)
            .eq('is_deleted', false);
          students = data;
        } else if (assignedClassIds.length > 0) {
          // Regular educators can only see students in their assigned classes
          const { data } = await supabase
            .from('students')
            .select('id, name, user_id')
            .eq('school_id', educatorSchool.id)
            .in('school_class_id', assignedClassIds)
            .eq('is_deleted', false);
          students = data;
        } else {
          // Educators with no class assignments should see no students
          students = [];
        }
      } else if (educatorType === 'college' && educatorCollege) {
        // For college educators, filter by college
        const { data } = await supabase
          .from('students')
          .select('id, name, user_id')
          .eq('college_id', educatorCollege.id)
          .eq('is_deleted', false);
        students = data;
      } else {
        students = [];
      }
      
      // Create a mapping of user_id to student name
      const studentMap: Record<string, string> = {};
      const studentIds = new Set<string>();
      students?.forEach((student: any) => {
        studentMap[student.user_id] = student.name || `Student ${student.id.substring(0, 8)}`;
        studentIds.add(student.user_id);
      });

      // Fetch activities only for students in this school
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .in('student_id', Array.from(studentIds));
      
      const { data: trainings } = await supabase
        .from('trainings')
        .select('*')
        .in('student_id', Array.from(studentIds));
      
      const { data: certificates } = await supabase
        .from('certificates')
        .select('*')
        .in('student_id', Array.from(studentIds));

      const allActivities: Activity[] = [
        ...(projects || []).map((p: any) => ({
          id: p.id,
          student_id: p.student_id,
          student: studentMap[p.student_id] || `Student ${p.student_id?.substring(0, 8) || 'Unknown'}`,
          title: p.title,
          type: 'Project' as const,
          status: p.approval_status || 'pending',
          date: p.created_at,
          description: p.description || '',
          tech_stack: p.tech_stack,
          demo_link: p.demo_link,
          github_link: p.github_link,
          start_date: p.start_date,
          end_date: p.end_date,
          duration: p.duration,
          organization: p.organization,
          certificate_url: p.certificate_url,
          video_url: p.video_url,
          ppt_url: p.ppt_url,
          approval_notes: p.approval_notes,
        })),
        ...(trainings || []).map((t: any) => ({
          id: t.id,
          student_id: t.student_id,
          student: studentMap[t.student_id] || `Student ${t.student_id?.substring(0, 8) || 'Unknown'}`,
          title: t.title,
          type: 'Training' as const,
          status: t.approval_status || 'pending',
          date: t.created_at,
          description: t.description || '',
          organization: t.organization,
          start_date: t.start_date,
          end_date: t.end_date,
          duration: t.duration,
          approval_notes: t.approval_notes,
        })),
        ...(certificates || []).map((c: any) => ({
          id: c.id,
          student_id: c.student_id,
          student: studentMap[c.student_id] || `Student ${c.student_id?.substring(0, 8) || 'Unknown'}`,
          title: c.title,
          type: 'Certificate' as const,
          status: c.approval_status || 'pending',
          date: c.created_at,
          description: c.description || '',
          issuer: c.issuer,
          level: c.level,
          credential_id: c.credential_id,
          link: c.link,
          issued_on: c.issued_on,
          document_url: c.document_url,
          approval_notes: c.approval_notes,
        })),
      ];

      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    activities.forEach(activity => {
      typeCounts[activity.type] = (typeCounts[activity.type] || 0) + 1;
    });
    return Object.entries(typeCounts).map(([type, count]) => ({
      value: type,
      label: type,
      count
    }));
  }, [activities]);

  const filteredAndSortedActivities = useMemo(() => {
    let result = activities.filter(activity => activity.status === activeTab);

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(activity =>
        activity.student.toLowerCase().includes(query) ||
        activity.title.toLowerCase().includes(query) ||
        activity.description?.toLowerCase().includes(query)
      );
    }

    if (filters.types.length > 0) {
      result = result.filter(activity => filters.types.includes(activity.type));
    }

    if (filters.dateRange.start) {
      result = result.filter(activity => activity.date >= filters.dateRange.start);
    }
    if (filters.dateRange.end) {
      result = result.filter(activity => activity.date <= filters.dateRange.end);
    }

    const sorted = [...result];
    switch (sortBy) {
      case 'date_desc':
        sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'date_asc':
        sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'type':
        sorted.sort((a, b) => a.type.localeCompare(b.type));
        break;
    }

    return sorted;
  }, [activities, activeTab, searchQuery, filters, sortBy]);

  const handleClearFilters = () => {
    setFilters({
      types: [],
      dateRange: { start: '', end: '' }
    });
    setSearchQuery('');
  };

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedActivities([...selectedActivities, id]);
    } else {
      setSelectedActivities(selectedActivities.filter(sid => sid !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedActivities(filteredAndSortedActivities.map(a => a.id));
    } else {
      setSelectedActivities([]);
    }
  };

  const handleBulkVerify = () => {
    if (selectedActivities.length === 0) return;
    setBulkRemark('');
    setShowBulkVerifyConfirm(true);
  };

  const confirmBulkVerify = async () => {
    console.log('🔵 [BULK VERIFY] Starting bulk verification...');
    console.log('🔵 [BULK VERIFY] Selected activities:', selectedActivities);
    console.log('🔵 [BULK VERIFY] Bulk remark:', bulkRemark);
    
    if (!bulkRemark.trim()) {
      console.warn('⚠️ [BULK VERIFY] Remarks empty!');
      setErrorMessage('Please provide remarks for bulk verification');
      setShowErrorModal(true);
      return;
    }

    try {
      for (const id of selectedActivities) {
        console.log(`🔵 [BULK VERIFY] Processing activity: ${id}`);
        
        const activity = activities.find(a => a.id === id);
        if (!activity) {
          console.warn(`⚠️ [BULK VERIFY] Activity ${id} not found, skipping...`);
          continue;
        }
        
        const table = activity.type === 'Project' ? 'projects' : 
                     activity.type === 'Training' ? 'trainings' : 'certificates';
        
        console.log(`🔵 [BULK VERIFY] Updating ${table} for activity ${id}`);
        
        const { data, error } = await supabase
          .from(table)
          .update({ 
            approval_status: 'sent_to_admin',
            approval_notes: bulkRemark,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) {
          console.error(`❌ [BULK VERIFY] Error updating ${id}:`, error);
          throw error;
        }
        
        console.log(`✅ [BULK VERIFY] Successfully updated ${id}`);
      }
      
      console.log('✅ [BULK VERIFY] All activities verified!');
      await fetchActivities();
      setSelectedActivities([]);
      setShowBulkVerifyConfirm(false);
      setBulkRemark('');
      setSuccessMessage(`${selectedActivities.length} ${selectedActivities.length === 1 ? 'activity' : 'activities'} verified successfully!`);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('❌ [BULK VERIFY] Bulk verification failed:', error);
      setShowBulkVerifyConfirm(false);
      setErrorMessage('Failed to verify activities. Please try again.');
      setShowErrorModal(true);
    }
  };

  const handleBulkReject = () => {
    if (selectedActivities.length === 0) return;
    setBulkRemark('');
    setShowBulkRejectConfirm(true);
  };

  const confirmBulkReject = async () => {
    console.log('🔴 [BULK REJECT] Starting bulk rejection...');
    console.log('🔴 [BULK REJECT] Selected activities:', selectedActivities);
    console.log('🔴 [BULK REJECT] Bulk remark:', bulkRemark);
    
    if (!bulkRemark.trim()) {
      console.warn('⚠️ [BULK REJECT] Remarks empty!');
      setErrorMessage('Please provide remarks for bulk rejection');
      setShowErrorModal(true);
      return;
    }

    try {
      for (const id of selectedActivities) {
        console.log(`🔴 [BULK REJECT] Processing activity: ${id}`);
        
        const activity = activities.find(a => a.id === id);
        if (!activity) {
          console.warn(`⚠️ [BULK REJECT] Activity ${id} not found, skipping...`);
          continue;
        }
        
        const table = activity.type === 'Project' ? 'projects' : 
                     activity.type === 'Training' ? 'trainings' : 'certificates';
        
        console.log(`🔴 [BULK REJECT] Updating ${table} for activity ${id}`);
        
        const { data, error } = await supabase
          .from(table)
          .update({ 
            approval_status: 'rejected',
            approval_notes: bulkRemark,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) {
          console.error(`❌ [BULK REJECT] Error updating ${id}:`, error);
          throw error;
        }
        
        console.log(`✅ [BULK REJECT] Successfully updated ${id}`);
      }
      
      console.log('✅ [BULK REJECT] All activities rejected!');
      await fetchActivities();
      setSelectedActivities([]);
      setShowBulkRejectConfirm(false);
      setBulkRemark('');
      setSuccessMessage(`${selectedActivities.length} ${selectedActivities.length === 1 ? 'activity' : 'activities'} rejected successfully!`);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('❌ [BULK REJECT] Bulk rejection failed:', error);
      setShowBulkRejectConfirm(false);
      setErrorMessage('Failed to reject activities. Please try again.');
      setShowErrorModal(true);
    }
  };

  const handleVerify = async (id: string, remark: string) => {
    console.log('🔵 [VERIFY] Starting verification process...');
    console.log('🔵 [VERIFY] Activity ID:', id);
    console.log('🔵 [VERIFY] Remark:', remark);
    
    try {
      const activity = activities.find(a => a.id === id);
      console.log('🔵 [VERIFY] Found activity:', activity);
      
      if (!activity) {
        console.error('❌ [VERIFY] Activity not found!');
        return;
      }
      
      const table = activity.type === 'Project' ? 'projects' : 
                   activity.type === 'Training' ? 'trainings' : 'certificates';
      
      console.log('🔵 [VERIFY] Table to update:', table);
      console.log('🔵 [VERIFY] Update payload:', {
        approval_status: 'sent_to_admin',
        approval_notes: remark || null,
        updated_at: new Date().toISOString()
      });

      const { data, error } = await supabase
        .from(table)
        .update({ 
          approval_status: 'sent_to_admin',
          approval_notes: remark || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('❌ [VERIFY] Supabase error:', error);
        console.error('❌ [VERIFY] Error code:', error.code);
        console.error('❌ [VERIFY] Error message:', error.message);
        console.error('❌ [VERIFY] Error details:', error.details);
        console.error('❌ [VERIFY] Error hint:', error.hint);
        throw error;
      }

      console.log('✅ [VERIFY] Update successful! Response:', data);

      await fetchActivities();
      setDetailModal(null);
      setSuccessMessage('Activity verified successfully!');
      setShowSuccessModal(true);
      console.log('✅ [VERIFY] Verification complete!');
    } catch (error) {
      console.error('❌ [VERIFY] Catch block error:', error);
      setErrorMessage('Failed to verify activity. Please try again.');
      setShowErrorModal(true);
    }
  };

  const handleReject = async (id: string, remark: string) => {
    console.log('🔴 [REJECT] Starting rejection process...');
    console.log('🔴 [REJECT] Activity ID:', id);
    console.log('🔴 [REJECT] Remark:', remark);
    
    try {
      const activity = activities.find(a => a.id === id);
      console.log('🔴 [REJECT] Found activity:', activity);
      
      if (!activity) {
        console.error('❌ [REJECT] Activity not found!');
        return;
      }
      
      const table = activity.type === 'Project' ? 'projects' : 
                   activity.type === 'Training' ? 'trainings' : 'certificates';
      
      console.log('🔴 [REJECT] Table to update:', table);
      console.log('🔴 [REJECT] Update payload:', {
        approval_status: 'rejected',
        approval_notes: remark || null,
        updated_at: new Date().toISOString()
      });

      const { data, error } = await supabase
        .from(table)
        .update({ 
          approval_status: 'rejected',
          approval_notes: remark || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('❌ [REJECT] Supabase error:', error);
        console.error('❌ [REJECT] Error code:', error.code);
        console.error('❌ [REJECT] Error message:', error.message);
        console.error('❌ [REJECT] Error details:', error.details);
        console.error('❌ [REJECT] Error hint:', error.hint);
        throw error;
      }

      console.log('✅ [REJECT] Update successful! Response:', data);

      await fetchActivities();
      setDetailModal(null);
      setSuccessMessage('Activity rejected successfully!');
      setShowSuccessModal(true);
      console.log('✅ [REJECT] Rejection complete!');
    } catch (error) {
      console.error('❌ [REJECT] Catch block error:', error);
      setErrorMessage('Failed to reject activity. Please try again.');
      setShowErrorModal(true);
    }
  };

  const tabCounts = {
    pending: activities.filter(a => a.status === 'pending').length,
    sent_to_admin: activities.filter(a => a.status === 'sent_to_admin').length,
    approved: activities.filter(a => a.status === 'approved').length,
    rejected: activities.filter(a => a.status === 'rejected').length,
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'pending': return 'Pending';
      case 'sent_to_admin': return 'Sent to Admin';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return tab;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="hidden lg:flex items-center p-4 bg-white border-b border-gray-200">
        <div className="w-80 flex-shrink-0 pr-4 text-left">
          <div className="inline-flex items-baseline">
            <h1 className="text-xl font-semibold text-gray-900">Activity Verification</h1>
            <span className="ml-2 text-sm text-gray-500">
              ({filteredAndSortedActivities.length} activities)
            </span>
          </div>
        </div>

        <div className="flex-1 px-4">
          <div className="max-w-xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student, title, or description..."
              className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="w-80 flex-shrink-0 pl-4 flex items-center justify-end space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 relative"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {(filters.types.length > 0) && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">
                {filters.types.length}
              </span>
            )}
          </button>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                viewMode === 'grid'
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                viewMode === 'table'
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <TableCellsIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden p-4 bg-white border-b border-gray-200 space-y-4">
        <div className="text-left">
          <h1 className="text-xl font-semibold text-gray-900">Activity Verification</h1>
          <span className="text-sm text-gray-500">
            {filteredAndSortedActivities.length} activities
          </span>
        </div>

        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activities..."
            className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 relative"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {(filters.types.length > 0) && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">
                {filters.types.length}
              </span>
            )}
          </button>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                viewMode === 'grid'
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                viewMode === 'table'
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <TableCellsIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex px-4">
          {(['pending', 'sent_to_admin', 'approved', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedActivities([]);
              }}
              className={`px-6 py-3 font-medium text-sm transition-all relative ${
                activeTab === tab
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {getTabLabel(tab)}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                tab === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                tab === 'sent_to_admin' ? 'bg-blue-100 text-blue-800' :
                tab === 'approved' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {tabCounts[tab]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium text-gray-900">Filters</h2>
                <button 
                  onClick={handleClearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-0">
                <FilterSection title="Activity Type" defaultOpen>
                  <CheckboxGroup
                    options={typeOptions}
                    selectedValues={filters.types}
                    onChange={(values: string[]) => setFilters({...filters, types: values})}
                  />
                </FilterSection>

                <FilterSection title="Date Range">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">From</label>
                      <input
                        type="date"
                        value={filters.dateRange.start}
                        onChange={(e) => setFilters({
                          ...filters, 
                          dateRange: {...filters.dateRange, start: e.target.value}
                        })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">To</label>
                      <input
                        type="date"
                        value={filters.dateRange.end}
                        onChange={(e) => setFilters({
                          ...filters, 
                          dateRange: {...filters.dateRange, end: e.target.value}
                        })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </FilterSection>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Bulk Actions Bar */}
          {activeTab === 'pending' && selectedActivities.length > 0 && (
            <div className="px-4 py-3 bg-primary-50 border-b border-primary-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {selectedActivities.length} {selectedActivities.length === 1 ? 'activity' : 'activities'} selected
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={handleBulkVerify}
                    className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                  >
                    <CheckIcon className="h-4 w-4 mr-1" />
                    Verify Selected
                  </button>
                  <button
                    onClick={handleBulkReject}
                    className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Reject Selected
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results header */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{filteredAndSortedActivities.length}</span> result{filteredAndSortedActivities.length !== 1 ? 's' : ''}
                {searchQuery && <span className="text-gray-500"> for "{searchQuery}"</span>}
              </p>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="date_desc">Sort by: Newest First</option>
                <option value="date_asc">Sort by: Oldest First</option>
                <option value="title">Sort by: Title</option>
                <option value="type">Sort by: Type</option>
              </select>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-4">
            {(loading || schoolLoading) ? (
              <div className="text-center py-8">
                <div className="text-sm text-gray-500">Loading activities...</div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className={`grid grid-cols-1 gap-4 ${
                showFilters 
                  ? 'md:grid-cols-2' 
                  : 'md:grid-cols-2 lg:grid-cols-3'
              }`}>
                {filteredAndSortedActivities.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-sm text-gray-500 mb-2">
                      {activities.length === 0 && !searchQuery && filters.types.length === 0
                        ? educatorType === 'school' && educatorRole !== 'admin' && assignedClassIds.length === 0
                          ? 'You have not been assigned to any classes yet'
                          : 'No student activities found'
                        : `No ${getTabLabel(activeTab).toLowerCase()} activities found`}
                    </p>
                    {activities.length === 0 && !searchQuery && filters.types.length === 0 && 
                     educatorType === 'school' && educatorRole !== 'admin' && assignedClassIds.length === 0 && (
                      <p className="text-xs text-gray-400">
                        Please contact your school administrator to assign you to classes.
                      </p>
                    )}
                    {(searchQuery || filters.types.length > 0) && (
                      <button
                        onClick={handleClearFilters}
                        className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                ) : (
                  filteredAndSortedActivities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      onViewDetails={setDetailModal}
                      onVerify={handleVerify}
                      onReject={handleReject}
                      isSelected={selectedActivities.includes(activity.id)}
                      onSelect={handleSelect}
                    />
                  ))
                )}
              </div>
            ) : (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {activeTab === 'pending' && (
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedActivities.length === filteredAndSortedActivities.length && filteredAndSortedActivities.length > 0}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedActivities.length === 0 ? (
                      <tr>
                        <td colSpan={activeTab === 'pending' ? 6 : 5} className="px-6 py-12 text-center">
                          <div className="text-gray-500">
                            <p className="mb-2">
                              {activities.length === 0 && !searchQuery && filters.types.length === 0
                                ? educatorType === 'school' && educatorRole !== 'admin' && assignedClassIds.length === 0
                                  ? 'You have not been assigned to any classes yet'
                                  : 'No student activities found'
                                : `No ${getTabLabel(activeTab).toLowerCase()} activities found`}
                            </p>
                            {activities.length === 0 && !searchQuery && filters.types.length === 0 && 
                             educatorType === 'school' && educatorRole !== 'admin' && assignedClassIds.length === 0 && (
                              <p className="text-xs text-gray-400">
                                Please contact your school administrator to assign you to classes.
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedActivities.map((activity) => (
                        <tr key={activity.id} className="hover:bg-gray-50">
                          {activeTab === 'pending' && (
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedActivities.includes(activity.id)}
                                onChange={(e) => handleSelect(activity.id, e.target.checked)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              />
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{activity.student}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              activity.type === 'Project' ? 'bg-blue-100 text-blue-800' :
                              activity.type === 'Training' ? 'bg-purple-100 text-purple-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {activity.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{activity.title}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500">
                              {new Date(activity.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium">
                            <button
                              onClick={() => setDetailModal(activity)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              Verify
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <ActivityDetailModal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        activity={detailModal}
        onVerify={handleVerify}
        onReject={handleReject}
        onShowError={(msg) => {
          setErrorMessage(msg);
          setShowErrorModal(true);
        }}
      />

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform animate-scaleIn">
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Success!</h3>
                <p className="text-gray-600 mb-6">{successMessage}</p>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform animate-scaleIn">
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Oops!</h3>
                <p className="text-gray-600 mb-6">{errorMessage}</p>
              </div>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Verify Confirmation Modal */}
      {showBulkVerifyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform animate-scaleIn">
            <div className="p-6">
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-4 shadow-lg">
                  <CheckIcon className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Verify Activities?</h3>
                <p className="text-gray-600 mb-4">
                  You are about to verify {selectedActivities.length} {selectedActivities.length === 1 ? 'activity' : 'activities'}. Please provide remarks.
                </p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Remarks *</label>
                <textarea
                  value={bulkRemark}
                  onChange={(e) => setBulkRemark(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your remarks for verification..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBulkVerifyConfirm(false);
                    setBulkRemark('');
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkVerify}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Reject Confirmation Modal */}
      {showBulkRejectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform animate-scaleIn">
            <div className="p-6">
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-4 shadow-lg">
                  <XMarkIcon className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Reject Activities?</h3>
                <p className="text-gray-600 mb-4">
                  You are about to reject {selectedActivities.length} {selectedActivities.length === 1 ? 'activity' : 'activities'}. Please provide remarks.
                </p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Remarks *</label>
                <textarea
                  value={bulkRemark}
                  onChange={(e) => setBulkRemark(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your remarks for rejection..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBulkRejectConfirm(false);
                    setBulkRemark('');
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkReject}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Activities;