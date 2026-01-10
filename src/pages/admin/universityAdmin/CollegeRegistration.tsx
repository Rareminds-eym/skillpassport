import {
    ChevronDownIcon,
    EnvelopeIcon,
    EyeIcon,
    FunnelIcon,
    PencilSquareIcon,
    PhoneIcon,
    Squares2X2Icon,
    StarIcon,
    TableCellsIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';
import Pagination from '../../../components/admin/Pagination';
import SearchBar from '../../../components/common/SearchBar';
// @ts-ignore - AuthContext is a .jsx file
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium border-b-2 ${active
      ? 'border-primary-500 text-primary-600'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
  >
    {children}
  </button>
);

const MessageModal = ({ isOpen, onClose, college }) => {
  if (!isOpen) return null;

  const handleEmail = () => {
    const subject = encodeURIComponent('College Registration Update');
    const body = encodeURIComponent(`Dear ${college.name},\n\nI wanted to reach out regarding your college registration.\n\nBest regards`);
    window.location.href = `mailto:${college.contact_email || 'admin@college.edu'}?subject=${subject}&body=${body}`;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Contact {college.name}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleEmail}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-red-50 hover:border-red-300 transition-colors"
            >
              <EnvelopeIcon className="h-5 w-5 mr-3 text-red-600" />
              Send Email
            </button>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center">
                <PhoneIcon className="h-3 w-3 mr-1" />
                <span>{college.contact_phone || 'Not available'}</span>
              </div>
              <div className="flex items-center">
                <EnvelopeIcon className="h-3 w-3 mr-1" />
                <span>{college.contact_email || 'Not available'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CollegeProfileModal = ({ college, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showMessageModal, setShowMessageModal] = useState(false);

  if (!isOpen || !college) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{college.name}</h3>
              <p className="text-sm text-gray-500">{college.code}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
                Overview
              </TabButton>
              <TabButton active={activeTab === 'programs'} onClick={() => setActiveTab('programs')}>
                Programs
              </TabButton>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
            {activeTab === 'overview' && (
              <div className="px-6 py-4 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">College Code</label>
                    <p className="text-gray-900">{college.code}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-gray-900">{college.location || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Students</label>
                    <p className="text-gray-900 font-semibold">{college.students || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Faculty</label>
                    <p className="text-gray-900">{college.faculty || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Rating</label>
                    <p className="text-gray-900">⭐ {college.rating || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registration Status</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      college.status === 'registered' ? 'bg-green-100 text-green-800' :
                      college.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      college.status === 'renewal' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {college.status?.charAt(0).toUpperCase() + college.status?.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registered Date</label>
                    <p className="text-gray-900">{college.registration_date ? new Date(college.registration_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="text-gray-900">{college.updated_date ? new Date(college.updated_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'programs' && (
              <div className="px-6 py-4">
                {college.programs && college.programs.length > 0 ? (
                  <div className="space-y-2">
                    {college.programs.map((program, idx) => (
                      <div key={idx} className="flex items-center px-3 py-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-800">{program}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No programs listed</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FilterSection = ({ title, children, defaultOpen = false }: any) => {
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

const CheckboxGroup = ({ options, selectedValues, onChange }: any) => {
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

const RegistrationNoteModal = ({ isOpen, onClose, college, onSuccess }: any) => {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setNote('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!note.trim()) {
      setError('Please enter a note');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Error saving note:', err);
      setError(err.message || 'Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Add Registration Note</h3>
              <p className="text-sm text-gray-500 mt-1">
                Add feedback or observation for <span className="font-medium">{college?.name}</span>
              </p>
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

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note <span className="text-red-500">*</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={6}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter registration notes, compliance feedback, or observations..."
            />
            <p className="text-xs text-gray-500 mt-1">
              This note will be attached to the college's registration file for future reference.
            </p>
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
              onClick={handleSubmit}
              disabled={loading || !note.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <PencilSquareIcon className="h-4 w-4 mr-1" />
                  Save Note
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RegistrationStatusBadge = ({ status }) => {
  const statusConfig = {
    registered: { color: 'bg-green-100 text-green-800', label: 'Registered' },
    pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    renewal: { color: 'bg-blue-100 text-blue-800', label: 'Renewal' },
    suspended: { color: 'bg-red-100 text-red-800', label: 'Suspended' }
  };

  const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

const CollegeCard = ({ college, onViewProfile, onAddNote }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{college.name}</h3>
          <p className="text-sm text-gray-500">{college.code}</p>
          <p className="text-xs text-gray-400">{college.location}</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center mb-1">
            <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium text-gray-700 ml-1">{college.rating || 'N/A'}</span>
          </div>
          <RegistrationStatusBadge status={college.status || 'pending'} />
        </div>
      </div>

      <div className="mb-3">
        <div className="flex flex-wrap gap-1">
          {college.programs && college.programs.slice(0, 5).map((program, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
            >
              {program}
            </span>
          ))}
          {college.programs && college.programs.length > 5 && (
            <span className="text-xs text-gray-500">+{college.programs.length - 5} more</span>
          )}
        </div>
      </div>

      <div className="mb-4 space-y-1">
        {college.students && (
          <p className="text-xs text-gray-600">
            👥 Students: {college.students}
          </p>
        )}
        {college.faculty && (
          <p className="text-xs text-gray-600">
            👨‍🏫 Faculty: {college.faculty}
          </p>
        )}
        {college.registration_date && (
          <p className="text-xs text-gray-600">
            📅 Registered: {new Date(college.registration_date).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Updated {college.updated_date ? new Date(college.updated_date).toLocaleDateString() : 'N/A'}
        </span>
        <div className="flex space-x-2">
          <button
            onClick={() => onViewProfile(college)}
            className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <EyeIcon className="h-3 w-3 mr-1" />
            View Profile
          </button>
          <button
            onClick={() => onAddNote(college)}
            className="inline-flex items-center px-2 py-1 border border-primary-300 rounded text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100"
          >
            <PencilSquareIcon className="h-3 w-3 mr-1" />
            Add Note
          </button>
        </div>
      </div>
    </div>
  );
};

const CollegeRegistration = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [filters, setFilters] = useState({
    programs: [],
    location: [],
    status: [],
    minRating: 0,
    maxRating: 5
  });

  const [colleges, setColleges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch colleges linked to this university
  useEffect(() => {
    const fetchColleges = async () => {
      // Get user ID from session - check multiple possible fields
      const userId = user?.user_id || user?.id;
      
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // First, fetch the user's organizationId from the database (fresh data)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('organizationId')
          .eq('id', userId)
          .single();

        if (userError) {
          console.error('Error fetching user:', userError);
          throw userError;
        }

        const organizationId = userData?.organizationId;
        
        if (!organizationId) {
          console.log('No organizationId found for user');
          setColleges([]);
          setLoading(false);
          return;
        }

        console.log('Fetching colleges for universityId:', organizationId);

        // Fetch colleges linked to this university from organizations table
        // Note: For university-college hierarchy, you may need to add a parent_organization_id column
        const { data, error: fetchError } = await supabase
          .from('organizations')
          .select('*')
          .eq('organization_type', 'college')
          .order('name', { ascending: true });

        if (fetchError) throw fetchError;
        
        console.log('Colleges found:', data?.length || 0);
        
        // Map database fields to component expected format
        const mappedColleges = (data || []).map(org => ({
          id: org.id,
          name: org.name,
          code: org.code,
          location: [org.city, org.state].filter(Boolean).join(', ') || 'N/A',
          programs: [], // Can be extended to fetch programs if needed
          students: 0,
          faculty: 0,
          rating: null,
          status: org.approval_status === 'approved' ? 'registered' : (org.approval_status || 'pending'),
          registration_date: org.created_at,
          updated_date: org.updated_at,
          contact_email: org.email,
          contact_phone: org.phone
        }));

        setColleges(mappedColleges);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching colleges:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchColleges();
  }, [user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortBy]);

  const programOptions = useMemo(() => {
    const programCounts: any = {};
    colleges.forEach(college => {
      if (college.programs && Array.isArray(college.programs)) {
        college.programs.forEach(program => {
          const normalizedProgram = program.toLowerCase();
          programCounts[normalizedProgram] = (programCounts[normalizedProgram] || 0) + 1;
        });
      }
    });
    return Object.entries(programCounts)
      .map(([program, count]) => ({
        value: program,
        label: program.charAt(0).toUpperCase() + program.slice(1),
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [colleges]);

  const locationOptions = useMemo(() => {
    const locationCounts: any = {};
    colleges.forEach(college => {
      if (college.location) {
        const normalizedLocation = college.location.toLowerCase();
        locationCounts[normalizedLocation] = (locationCounts[normalizedLocation] || 0) + 1;
      }
    });
    return Object.entries(locationCounts)
      .map(([location, count]) => ({
        value: location,
        label: location.charAt(0).toUpperCase() + location.slice(1),
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [colleges]);

  const statusOptions = useMemo(() => {
    const statusCounts: any = {};
    colleges.forEach(college => {
      if (college.status) {
        const status = college.status.toLowerCase();
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }
    });
    return Object.entries(statusCounts)
      .map(([status, count]) => ({
        value: status,
        label: status.charAt(0).toUpperCase() + status.slice(1),
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [colleges]);

  const filteredAndSortedColleges = useMemo(() => {
    let result = colleges;

    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();

      result = result.filter(college => {
        return (
          (college.name && college.name.toLowerCase().includes(query)) ||
          (college.code && college.code.toLowerCase().includes(query)) ||
          (college.location && college.location.toLowerCase().includes(query)) ||
          (college.programs && college.programs.some((p: any) => p.toLowerCase().includes(query)))
        );
      });
    }

    if (filters.programs.length > 0) {
      result = result.filter(college =>
        college.programs?.some((program: any) =>
          filters.programs.includes(program.toLowerCase())
        )
      );
    }

    if (filters.location.length > 0) {
      result = result.filter(college =>
        college.location && filters.location.includes(college.location.toLowerCase())
      );
    }

    if (filters.status.length > 0) {
      result = result.filter(college =>
        college.status && filters.status.includes(college.status.toLowerCase())
      );
    }

    result = result.filter(college => {
      const rating = college.rating || 0;
      return rating >= filters.minRating && rating <= filters.maxRating;
    });

    if (!searchQuery || searchQuery.trim() === '') {
      const sortedResult = [...result];
      switch (sortBy) {
        case 'rating':
          sortedResult.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'name':
          sortedResult.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          break;
        case 'date':
          sortedResult.sort((a, b) =>
            new Date(b.registration_date || 0).getTime() - new Date(a.registration_date || 0).getTime()
          );
          break;
        case 'relevance':
        default:
          break;
      }
      return sortedResult;
    }

    return result;
  }, [colleges, searchQuery, filters, sortBy]);

  const totalItems = filteredAndSortedColleges.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedColleges = filteredAndSortedColleges.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setFilters({
      programs: [],
      location: [],
      status: [],
      minRating: 0,
      maxRating: 5
    });
  };

  const handleViewProfile = (college) => {
    setSelectedCollege(college);
    setShowProfileModal(true);
  };

  const handleAddNoteClick = (college) => {
    setSelectedCollege(college);
    setShowNoteModal(true);
  };

  const handleNoteSuccess = () => {
    alert(`Note added for ${selectedCollege?.name}!`);
    setShowNoteModal(false);
    setSelectedCollege(null);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 sm:p-6 lg:p-8 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">College Registration</h1>
          <p className="text-base md:text-lg mt-2 text-gray-600">Manage affiliated colleges and their registrations.</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 hidden lg:flex items-center p-4 bg-white border-b border-gray-200">
        <div className="w-80 flex-shrink-0 pr-4 text-left">
          <div className="inline-flex items-baseline">
            <h1 className="text-xl font-semibold text-gray-900">Colleges</h1>
            <span className="ml-2 text-sm text-gray-500">
              ({totalItems} {searchQuery || filters.location.length > 0 ? 'matching' : ''} colleges)
            </span>
          </div>
        </div>

        <div className="flex-1 px-4">
          <div className="max-w-xl mx-auto">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name, code, location, programs..."
              size="md"
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
            {(filters.programs.length + filters.location.length + filters.status.length) > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">
                {filters.programs.length + filters.location.length + filters.status.length}
              </span>
            )}
          </button>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${viewMode === 'grid'
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${viewMode === 'table'
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              <TableCellsIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="lg:hidden p-4 bg-white border-b border-gray-200 space-y-4">
        <div className="text-left">
          <h1 className="text-xl font-semibold text-gray-900">Colleges</h1>
          <span className="text-sm text-gray-500">
            {totalItems} {searchQuery || filters.location.length > 0 ? 'matching' : ''} colleges
          </span>
        </div>

        <div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search colleges..."
            size="md"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 relative"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {(filters.programs.length + filters.location.length + filters.status.length) > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">
                {filters.programs.length + filters.location.length + filters.status.length}
              </span>
            )}
          </button>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${viewMode === 'grid'
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${viewMode === 'table'
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              <TableCellsIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
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
                <FilterSection title="Programs" defaultOpen>
                  <CheckboxGroup
                    options={programOptions}
                    selectedValues={filters.programs}
                    onChange={(values) => setFilters({ ...filters, programs: values })}
                  />
                </FilterSection>

                <FilterSection title="Location">
                  <CheckboxGroup
                    options={locationOptions}
                    selectedValues={filters.location}
                    onChange={(values) => setFilters({ ...filters, location: values })}
                  />
                </FilterSection>

                <FilterSection title="Registration Status">
                  <CheckboxGroup
                    options={statusOptions}
                    selectedValues={filters.status}
                    onChange={(values) => setFilters({ ...filters, status: values })}
                  />
                </FilterSection>

                <FilterSection title="College Rating">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Min Rating: {filters.minRating}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.1"
                        value={filters.minRating}
                        onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Max Rating: {filters.maxRating}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.1"
                        value={filters.maxRating}
                        onChange={(e) => setFilters({ ...filters, maxRating: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </FilterSection>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(endIndex, totalItems)}</span> of{' '}
                <span className="font-medium">{totalItems}</span> result{totalItems !== 1 ? 's' : ''}
                {searchQuery && <span className="text-gray-500"> for "{searchQuery}"</span>}
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="relevance">Sort by: Relevance</option>
                <option value="rating">Sort by: Rating</option>
                <option value="date">Sort by: Registration Date</option>
                <option value="name">Sort by: Name</option>
              </select>
            </div>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 flex-1 overflow-y-auto p-4">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {loading && <div className="text-sm text-gray-500">Loading colleges...</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}
                {!loading && paginatedColleges.map((college) => (
                  <CollegeCard
                    key={college.id}
                    college={college}
                    onViewProfile={handleViewProfile}
                    onAddNote={handleAddNoteClick}
                  />
                ))}
                {!loading && paginatedColleges.length === 0 && !error && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-sm text-gray-500">
                      {searchQuery || filters.location.length > 0
                        ? 'No colleges match your current filters'
                        : 'No colleges found.'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedColleges.map((college) => (
                      <tr key={college.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {college.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {college.code}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-800">{college.location}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <StarIcon className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="text-sm font-medium text-gray-900">
                              {college.rating}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <RegistrationStatusBadge status={college.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                          <button
                            onClick={() => handleViewProfile(college)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleAddNoteClick(college)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Add Note
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!loading && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>

      <CollegeProfileModal
        college={selectedCollege}
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedCollege(null);
        }}
      />

      <RegistrationNoteModal
        isOpen={showNoteModal}
        onClose={() => {
          setShowNoteModal(false);
          setSelectedCollege(null);
        }}
        college={selectedCollege}
        onSuccess={handleNoteSuccess}
      />
    </div>
  );
};

export default CollegeRegistration;
