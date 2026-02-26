import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  FunnelIcon,
  TableCellsIcon,
  Squares2X2Icon,
  EyeIcon,
  ChevronDownIcon,
  StarIcon,
  PencilSquareIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { useStudents, UICandidate } from '../../hooks/useStudents';
import { useEducatorSchool } from '../../hooks/useEducatorSchool';
import { useSearch } from '../../context/SearchContext';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/educator/Pagination';
import AddStudentModal from '../../components/educator/modals/Addstudentmodal';
import EditStudentModal from '../../components/educator/modals/EditStudentModal';
import DeleteStudentModal from '../../components/educator/modals/DeleteStudentModal';
import BulkDeleteStudentsModal from '../../components/educator/modals/BulkDeleteStudentsModal';
import { UserPlusIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const FilterSection = ({ title, children, defaultOpen = false }: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
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

const CheckboxGroup = ({ options, selectedValues, onChange }: {
  options: Array<{ value: string; label: string; count?: number }>;
  selectedValues: string[];
  onChange: (values: string[]) => void;
}) => {
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

const BadgeComponent = ({ badges }: { badges: string[] }) => {
  const badgeConfig: Record<string, { color: string; label: string }> = {
    self_verified: { color: 'bg-gray-100 text-gray-800', label: 'Self' },
    institution_verified: { color: 'bg-blue-100 text-blue-800', label: 'Institution' },
    external_audited: { color: 'bg-yellow-100 text-yellow-800 border border-yellow-300', label: 'External' }
  };

  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((badge, index) => {
        const config = badgeConfig[badge] || { color: 'bg-gray-100 text-gray-800', label: badge };
        return (
          <span
            key={index}
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color}`}
          >
            {config.label}
          </span>
        );
      })}
    </div>
  );
};

const StudentCard = ({ student, onViewProfile, onEdit, onDelete, onMessage, isSelected, onToggleSelect, educatorType }: {
  student: UICandidate;
  onViewProfile: (student: UICandidate) => void;
  onEdit: (student: UICandidate) => void;
  onDelete: (student: UICandidate) => void;
  onMessage: (student: UICandidate) => void;
  isSelected?: boolean;
  onToggleSelect?: (studentId: string) => void;
  educatorType?: 'school' | 'college' | null;
}) => {

  return (
    <div 
      className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all duration-200 flex flex-col h-full relative group ${
        isSelected ? 'border-primary-500 ring-2 ring-primary-200 bg-primary-50/30' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Professional Checkbox - Top Right Corner - Hidden for college lecturers */}
      {onToggleSelect && educatorType !== 'college' && (
        <div className="absolute top-3 right-3 z-10">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(student.id)}
              className="sr-only peer"
            />
            <div className={`
              w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center
              ${isSelected 
                ? 'bg-primary-600 border-primary-600' 
                : 'bg-white border-gray-300 hover:border-primary-400 group-hover:border-gray-400'
              }
            `}>
              {isSelected && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </label>
        </div>
      )}
      
      {/* Content that can grow */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 pr-8">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{student.name}</h3>
            <p className="text-sm text-gray-500 truncate">{student.dept}</p>
            <p className="text-xs text-gray-400 truncate">{student.college} • {student.location}</p>
          </div>
          <div className="flex flex-col items-end ml-3 flex-shrink-0">
            <div className="flex items-center mb-1">
              <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium text-gray-700 ml-1">{student.ai_score_overall}</span>
            </div>
            <BadgeComponent badges={student.badges} />
          </div>
        </div>

        {/* Skills */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {student.skills.slice(0, 5).map((skill, index: number) => {
              const label = typeof skill === 'string' ? skill : (skill && typeof skill === 'object' && 'name' in skill) ? skill.name : undefined;
              if (!label) return null;
              return (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {label}
                </span>
              );
            })}
            {student.skills.length > 5 && (
              <span className="text-xs text-gray-500">+{student.skills.length - 5} more</span>
            )}
          </div>
        </div>

        {/* Evidence snippets */}
        <div className="mb-4 space-y-1">
          {student.projects && student.projects.length > 0 && (
            <p className="text-xs text-gray-600">
              🔬 {student.projects[0].title}
            </p>
          )}
        </div>
      </div>

      {/* Actions - Always at bottom */}
      <div className="flex items-center justify-end mt-auto pt-2 border-t border-gray-100">
        <div className="flex gap-2 flex-nowrap">
          <button
            onClick={() => onViewProfile(student)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors whitespace-nowrap"
            disabled={!onViewProfile}
          >
            <EyeIcon className="h-3 w-3 mr-1.5" />
            View
          </button>
          
          <button
            onClick={() => onMessage(student)}
            className="inline-flex items-center px-3 py-1.5 border border-green-300 rounded-md text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 hover:border-green-400 transition-colors whitespace-nowrap"
          >
            <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1.5" />
            Message
          </button>
          
          <button
            onClick={() => onEdit(student)}
            className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-colors whitespace-nowrap"
          >
            <PencilSquareIcon className="h-3 w-3 mr-1.5" />
            Edit
          </button>
          
          {/* Delete button - Hidden for college lecturers */}
          {educatorType !== 'college' && (
            <button
              onClick={() => onDelete(student)}
              className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 hover:border-red-400 transition-colors whitespace-nowrap"
            >
              <TrashIcon className="h-3 w-3 mr-1.5" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

type EducatorOutletContext = {
  onViewProfile: (student: UICandidate) => void
}

const StudentsPage = () => {
  const { onViewProfile } = useOutletContext<EducatorOutletContext>()
  const { searchQuery, setSearchQuery } = useSearch();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<UICandidate | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<UICandidate | null>(null);
  
  // Bulk selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

  // Get educator's school/college information
  const { school: educatorSchool, college: educatorCollege, educatorType, educatorRole, assignedClassIds, loading: schoolLoading } = useEducatorSchool();

  // Get auth context for user ID
  const { user } = useAuth();

  const [filters, setFilters] = useState({
    skills: [] as string[],
    courses: [] as string[],
    grades: [] as string[],
    sections: [] as string[],
    badges: [] as string[],
    locations: [] as string[],
    years: [] as string[],
    minScore: 0,
    maxScore: 100
  });

  // Fetch students filtered by educator's assigned classes or institution
  const { students, loading, error, refetch } = useStudents({ 
    schoolId: educatorSchool?.id,
    collegeId: educatorCollege?.id,
    classIds: (educatorType === 'school' && educatorRole !== 'admin') || (educatorType === 'college' && educatorRole !== 'admin') ? assignedClassIds : undefined,
    educatorType: educatorType,
    userId: educatorType === 'college' ? (user as any)?.id : undefined
  });

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortBy]);

  // Dynamically generate filter options from actual data
  const skillOptions = useMemo(() => {
    const skillCounts: Record<string, number> = {};
    
    // Apply search filter and other active filters (except skills) to get base filtered students
    let baseFilteredStudents = [...students];
    
    // Apply search query
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      baseFilteredStudents = baseFilteredStudents.filter(student => {
        if (student.name?.toLowerCase().includes(query)) return true;
        if (student.email?.toLowerCase().includes(query)) return true;
        if (student.dept?.toLowerCase().includes(query)) return true;
        if (student.college?.toLowerCase().includes(query)) return true;
        if (student.location?.toLowerCase().includes(query)) return true;
        if (student.skills?.some(skill => {
          const skillName = typeof skill === 'string' ? skill : (skill && typeof skill === 'object' && 'name' in skill) ? skill.name : undefined;
          return skillName?.toLowerCase().includes(query);
        })) return true;
        return false;
      });
    }
    
    // Apply AI score filter
    baseFilteredStudents = baseFilteredStudents.filter(student => {
      const score = student.ai_score_overall || 0;
      return score >= filters.minScore && score <= filters.maxScore;
    });
    
    // Count how many students would match each skill filter
    const skillStudentSets: Record<string, Set<string>> = {};
    
    baseFilteredStudents.forEach(student => {
      const skillsToCheck = student.skills;
      if (skillsToCheck && Array.isArray(skillsToCheck)) {
        skillsToCheck.forEach(skill => {
          const skillName = typeof skill === 'string' ? skill : (skill && typeof skill === 'object' && 'name' in skill) ? skill.name : undefined;
          if (skillName) {
            const normalizedSkill = skillName.toLowerCase();
            if (!skillStudentSets[normalizedSkill]) {
              skillStudentSets[normalizedSkill] = new Set();
            }
            skillStudentSets[normalizedSkill].add(student.id);
          }
        });
      }
    });
    
    // Convert to counts
    Object.entries(skillStudentSets).forEach(([skill, studentIds]) => {
      skillCounts[skill] = studentIds.size;
    });
    
    return Object.entries(skillCounts)
      .map(([skill, count]) => ({
        value: skill,
        label: skill.charAt(0).toUpperCase() + skill.slice(1),
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [students, searchQuery, filters.minScore, filters.maxScore]);

  // Enhanced filter and sort with comprehensive search
  const filteredAndSortedStudents = useMemo(() => {
    let result = [...students];

    // Apply comprehensive search query filter
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      
      result = result.filter(student => {
        // Check basic fields
        if (student.name?.toLowerCase().includes(query)) return true;
        if (student.email?.toLowerCase().includes(query)) return true;
        if (student.dept?.toLowerCase().includes(query)) return true;
        if (student.college?.toLowerCase().includes(query)) return true;
        if (student.location?.toLowerCase().includes(query)) return true;

        // Check skills
        if (student.skills?.some(skill => {
          const skillName = typeof skill === 'string' ? skill : (skill && typeof skill === 'object' && 'name' in skill) ? skill.name : undefined;
          return skillName?.toLowerCase().includes(query);
        })) return true;

        return false;
      });
    }

    // Apply filters
    result = result.filter(student => {
      // Skill filters - OR logic: student must have at least ONE of the selected skills
      if (filters.skills.length > 0) {
        const studentSkills = student.skills?.map(s => (typeof s === 'string' ? s : s.name)?.toLowerCase()) ?? [];
        const hasAnySkill = filters.skills.some(fs => studentSkills.includes(fs.toLowerCase()));
        if (!hasAnySkill) {
          return false;
        }
      }

      // AI score range filter
      const score = student.ai_score_overall || 0;
      if (score < filters.minScore || score > filters.maxScore) {
        return false;
      }
      
      return true;
    });

    // Apply sorting
    if (!searchQuery || searchQuery.trim() === '') {
      const sortedResult = [...result];
      switch (sortBy) {
        case 'ai_score':
          sortedResult.sort((a, b) => (b.ai_score_overall || 0) - (a.ai_score_overall || 0));
          break;
        case 'name':
          sortedResult.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          break;
        case 'last_updated':
          sortedResult.sort((a, b) =>
            new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime()
          );
          break;
        case 'relevance':
        default:
          break;
      }
      return sortedResult;
    }

    return result;
  }, [students, searchQuery, filters, sortBy]);

  // Calculate pagination
  const totalItems = filteredAndSortedStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredAndSortedStudents.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      skills: [],
      courses: [],
      grades: [],
      sections: [],
      badges: [],
      locations: [],
      years: [],
      minScore: 0,
      maxScore: 100
    });
  };

  const handleEditClick = (student: UICandidate) => {
    setStudentToEdit(student);
    setShowEditModal(true);
  };

  const handleEditSuccess = async () => {
    // Reload students list
    await refetch();
  };

  const handleDeleteClick = (student: UICandidate) => {
    // Disable delete functionality for college lecturers
    if (educatorType === 'college') {
      console.log('Delete functionality disabled for college lecturers');
      return;
    }
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const handleDeleteSuccess = async () => {
    // Reload students list
    await refetch();
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    // Disable selection functionality for college lecturers (since they can't delete)
    if (educatorType === 'college') {
      return;
    }
    const allIds = new Set(paginatedStudents.map(s => s.id));
    setSelectedStudentIds(allIds);
  };

  const handleDeselectAll = () => {
    // Allow deselect for all educator types
    setSelectedStudentIds(new Set());
  };

  const handleToggleStudent = (studentId: string) => {
    // Disable selection functionality for college lecturers (since they can't delete)
    if (educatorType === 'college') {
      return;
    }
    const newSelected = new Set(selectedStudentIds);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudentIds(newSelected);
  };

  const handleBulkDelete = () => {
    // Disable bulk delete functionality for college lecturers
    if (educatorType === 'college') {
      console.log('Bulk delete functionality disabled for college lecturers');
      return;
    }
    setShowBulkDeleteModal(true);
  };

  const handleBulkDeleteSuccess = async () => {
    setSelectedStudentIds(new Set());
    await refetch();
  };

  // Handle message student
  const handleMessageStudent = async (student: UICandidate) => {
    try {
      // Navigate based on educator type
      const navigationPath = educatorType === 'college' ? '/educator/messages' : '/educator/communication';
      
      navigate(navigationPath, {
        state: {
          targetStudentId: student.id,
          targetStudentName: student.name,
          targetStudentEmail: student.email
        }
      });
    } catch (error) {
      console.error('Error initiating message:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  // Handle add student button click
  const handleAddStudentClick = () => {
    setShowAddStudentModal(true);
  };

  const selectedStudents = students.filter(s => selectedStudentIds.has(s.id));
  const allOnPageSelected = paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudentIds.has(s.id));

  return (
    <div className="flex flex-col h-screen">
      {/* Header - responsive layout */}
      <div className="p-4 sm:p-6 lg:p-8 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Students Management</h1>
          <p className="text-base md:text-lg mt-2 text-gray-600">Manage your students and their profiles.</p>
        </div>
        <button
          onClick={handleAddStudentClick}
          className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors"
        >
          <UserPlusIcon className="h-5 w-5 mr-2" />
          Add Student
        </button>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 hidden lg:flex items-center p-4 bg-white border-b border-gray-200">
        <div className="w-80 flex-shrink-0 pr-4 text-left">
          <div className="inline-flex items-baseline">
            <h1 className="text-xl font-semibold text-gray-900">Students</h1>
            <span className="ml-2 text-sm text-gray-500">
              ({totalItems} {searchQuery || filters.skills.length > 0 ? 'matching' : ''} students)
            </span>
          </div>
        </div>

        <div className="flex-1 px-4">
          <div className="max-w-xl mx-auto">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name, email, skills, projects, certificates, experience..."
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
            {(filters.skills.length + filters.courses.length + filters.grades.length + filters.sections.length + filters.badges.length + filters.locations.length + filters.years.length) > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">
                {filters.skills.length + filters.courses.length + filters.grades.length + filters.sections.length + filters.badges.length + filters.locations.length + filters.years.length}
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
                <FilterSection title="Skills" defaultOpen>
                  <CheckboxGroup
                    options={skillOptions}
                    selectedValues={filters.skills}
                    onChange={(values) => setFilters({ ...filters, skills: values })}
                  />
                </FilterSection>

                <FilterSection title="AI Score Range">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Min Score: {filters.minScore}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={filters.minScore}
                        onChange={(e) => setFilters({ ...filters, minScore: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
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
          {/* Bulk Actions Bar - Hidden for college lecturers */}
          {selectedStudentIds.size > 0 && educatorType !== 'college' && (
            <div className="px-4 sm:px-6 lg:px-8 py-3 bg-primary-50 border-b border-primary-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-primary-900">
                    {selectedStudentIds.size} selected
                  </span>
                  <button
                    onClick={handleDeselectAll}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Deselect All
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete {selectedStudentIds.size} Student{selectedStudentIds.size > 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results header */}
          <div className="px-4 sm:px-6 lg:px-8 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Select All checkbox - Hidden for college lecturers */}
                {educatorType !== 'college' && (
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={allOnPageSelected ? handleDeselectAll : handleSelectAll}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Select All on Page</span>
                  </label>
                )}
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, totalItems)}</span> of{' '}
                  <span className="font-medium">{totalItems}</span> result{totalItems !== 1 ? 's' : ''}
                  {searchQuery && <span className="text-gray-500"> for "{searchQuery}"</span>}
                </p>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="relevance">Sort by: Relevance</option>
                <option value="ai_score">Sort by: AI Score</option>
                <option value="last_updated">Sort by: Last Updated</option>
                <option value="name">Sort by: Name</option>
              </select>
            </div>
          </div>

          {/* Results */}
          <div className="px-4 sm:px-6 lg:px-8 flex-1 overflow-y-auto p-4">
            {viewMode === 'grid' ? (
              <div className={`grid grid-cols-1 gap-4 items-stretch ${
                showFilters 
                  ? 'md:grid-cols-1 lg:grid-cols-2' // 2 columns when filters are open
                  : 'md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' // 3 columns when filters are closed
              }`}>
                {(loading || schoolLoading) && <div className="text-sm text-gray-500">Loading students...</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}
                {!loading && !schoolLoading && paginatedStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onViewProfile={onViewProfile}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                    onMessage={handleMessageStudent}
                    isSelected={selectedStudentIds.has(student.id)}
                    onToggleSelect={handleToggleStudent}
                    educatorType={educatorType}
                  />
                ))}
                {!loading && !schoolLoading && paginatedStudents.length === 0 && !error && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-sm text-gray-500">
                      {searchQuery || filters.skills.length > 0
                        ? 'No students match your current filters'
                        : 'No students found.'}
                    </p>
                    {filters.skills.length > 0 && (
                      <button
                        onClick={handleClearFilters}
                        className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Clear all filters
                      </button>
                    )}
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
                        Skills
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        AI Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.dept}
                              </div>
                              <BadgeComponent badges={student.badges} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {student.skills.slice(0, 3).map((skill: any, index: number) => {
                              const label = typeof skill === 'string' ? skill : skill?.name;
                              if (!label) return null;
                              return (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {label}
                                </span>
                              );
                            })}
                            {student.skills && student.skills.length > 3 && (
                              <span className="text-xs text-gray-500">+{student.skills.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <StarIcon className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="text-sm font-medium text-gray-900">
                              {student.ai_score_overall}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => onViewProfile(student)}
                              className="text-blue-600 hover:text-blue-900"
                              disabled={!onViewProfile}
                              title="View Profile"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleMessageStudent(student)}
                              className="text-green-600 hover:text-green-900 transition-colors"
                              title="Message Student"
                            >
                              Message
                            </button>
                            <button
                              onClick={() => handleEditClick(student)}
                              className="text-orange-600 hover:text-orange-900 transition-colors"
                              title="Edit Student"
                            >
                              Edit
                            </button>
                            {/* Delete button - Hidden for college lecturers */}
                            {educatorType !== 'college' && (
                              <button
                                onClick={() => handleDeleteClick(student)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Delete Student"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
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

      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        onSuccess={() => {
          setShowAddStudentModal(false);
        }}
      />

      {/* Edit Student Modal */}
      <EditStudentModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setStudentToEdit(null);
        }}
        student={studentToEdit}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Student Modal - Hidden for college lecturers */}
      {educatorType !== 'college' && (
        <DeleteStudentModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setStudentToDelete(null);
          }}
          student={studentToDelete}
          onSuccess={handleDeleteSuccess}
        />
      )}

      {/* Bulk Delete Students Modal - Hidden for college lecturers */}
      {educatorType !== 'college' && (
        <BulkDeleteStudentsModal
          isOpen={showBulkDeleteModal}
          onClose={() => setShowBulkDeleteModal(false)}
          students={selectedStudents}
          onSuccess={handleBulkDeleteSuccess}
        />
      )}
    </div>
  );
};

export default StudentsPage;