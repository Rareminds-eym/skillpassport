import {
    BuildingOffice2Icon,
    ChevronDownIcon,
    EyeIcon,
    FolderIcon,
    FunnelIcon,
    Squares2X2Icon,
    StarIcon,
    TableCellsIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../../../components/common/SearchBar';
import { supabase } from '../../../lib/supabaseClient';

// Filter Section Component
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

// Checkbox Group Component
const CheckboxGroup = ({ options, selectedValues, onChange }: any) => {
  return (
    <div className="space-y-2">
      {options.map((option: any) => (
        <label key={option.value} className="flex items-center">
          <input
            type="checkbox"
            checked={selectedValues.includes(option.value)}
            onChange={(e) => {
              if (e.target.checked) {
                onChange([...selectedValues, option.value]);
              } else {
                onChange(selectedValues.filter((v: string) => v !== option.value));
              }
            }}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">{option.label}</span>
          {option.count !== undefined && (
            <span className="ml-auto text-xs text-gray-500">({option.count})</span>
          )}
        </label>
      ))}
    </div>
  );
};

// Badge Component
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

// Portfolio Card Component
const PortfolioCard = ({ student, onViewPortfolio }: any) => {
  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={() => onViewPortfolio(student)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-lg">
              {student.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
              {student.name}
            </h3>
            <p className="text-sm text-gray-600 truncate">{student.dept}</p>
            <p className="text-xs text-gray-500 truncate">{student.college}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1 ml-3">
          <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-full">
            <StarIcon className="h-3.5 w-3.5 text-yellow-400 fill-current mr-1" />
            <span className="text-xs font-medium text-yellow-700">{student.ai_score_overall || 'N/A'}</span>
          </div>
          <BadgeComponent badges={student.badges || []} />
        </div>
      </div>

      <div className="mb-4 pb-4 border-b border-gray-100">
        <div className="flex items-center space-x-2 mb-3">
          <FolderIcon className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Portfolio Highlights</span>
        </div>
        <div className="space-y-2">
          {student.skills && student.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {student.skills.slice(0, 4).map((skill: any, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {typeof skill === 'string' ? skill : skill?.name}
                </span>
              ))}
              {student.skills.length > 4 && (
                <span className="text-xs text-gray-500 self-center">+{student.skills.length - 4} more</span>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            {student.projects && student.projects.length > 0 && (
              <div className="flex items-center space-x-1">
                <span className="font-medium">📁 Projects:</span>
                <span>{student.projects.length}</span>
              </div>
            )}
            {student.internship && (
              <div className="flex items-center space-x-1 col-span-2 truncate">
                <span className="font-medium">💼 Internship:</span>
                <span className="truncate">{student.internship.org}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Updated {student.last_updated ? new Date(student.last_updated).toLocaleDateString() : 'N/A'}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewPortfolio(student);
          }}
          className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors text-xs font-medium"
        >
          <EyeIcon className="h-3.5 w-3.5 mr-1.5" />
          View Portfolio
        </button>
      </div>
    </div>
  );
};

const UniversityAdminDigitalPortfolio: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [students, setStudents] = useState<any[]>([]);
  const [colleges, setColleges] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(24);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  
  const [filters, setFilters] = useState({
    skills: [] as string[],
    departments: [] as string[],
    badges: [] as string[],
    colleges: [] as string[],
    minScore: 0,
    maxScore: 100
  });

  // Fetch students for this university
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get university admin's universityId
      let universityId: string | null = null;
      
      // Check localStorage first
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          if (userData.role === 'university_admin') {
            universityId = userData.universityId || userData.organizationId;
          }
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
      
      // If not in localStorage, check Supabase auth
      if (!universityId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: dbUser } = await supabase
            .from('users')
            .select('organizationId')
            .eq('id', user.id)
            .single();
          
          universityId = dbUser?.organizationId || null;
        }
      }

      let query = supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by universityId if available
      if (universityId) {
        console.log('✅ Filtering portfolios by universityId:', universityId);
        query = query.eq('universityId', universityId);
      } else {
        console.warn('⚠️ No universityId found for university admin');
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setStudents(data || []);
    } catch (err: any) {
      console.error('Error fetching students:', err);
      setError(err?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  // Fetch colleges for filter (only colleges under this university)
  const fetchColleges = async () => {
    try {
      // Get university admin's universityId
      let universityId: string | null = null;
      
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          if (userData.role === 'university_admin') {
            universityId = userData.universityId || userData.organizationId;
          }
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
      
      if (!universityId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: dbUser } = await supabase
            .from('users')
            .select('organizationId')
            .eq('id', user.id)
            .single();
          
          universityId = dbUser?.organizationId || null;
        }
      }

      // Query organizations table for colleges under this university
      let query = supabase
        .from('organizations')
        .select('id, name')
        .eq('organization_type', 'college')
        .order('name');

      // Note: If you need to filter by university, you'll need to add a parent_organization_id column
      // For now, we'll fetch all colleges

      const { data, error } = await query;
      
      if (!error && data) {
        setColleges(data);
      }
    } catch (err) {
      console.error('Error fetching colleges:', err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchColleges();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortBy]);

  // Generate filter options from data
  const skillOptions = useMemo(() => {
    const skillCounts: Record<string, number> = {};
    students.forEach(student => {
      if (student.skills && Array.isArray(student.skills)) {
        student.skills.forEach((skill: any) => {
          const skillName = typeof skill === 'string' ? skill : skill?.name;
          if (skillName) {
            const normalized = skillName.toLowerCase();
            skillCounts[normalized] = (skillCounts[normalized] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(skillCounts)
      .map(([skill, count]) => ({
        value: skill,
        label: skill.charAt(0).toUpperCase() + skill.slice(1),
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [students]);

  const departmentOptions = useMemo(() => {
    const deptCounts: Record<string, number> = {};
    students.forEach(student => {
      if (student.dept) {
        const normalized = student.dept.toLowerCase();
        deptCounts[normalized] = (deptCounts[normalized] || 0) + 1;
      }
    });
    return Object.entries(deptCounts)
      .map(([dept, count]) => ({
        value: dept,
        label: dept,
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [students]);

  const badgeOptions = useMemo(() => {
    const badgeCounts: Record<string, number> = {};
    students.forEach(student => {
      if (student.badges && Array.isArray(student.badges)) {
        student.badges.forEach((badge: string) => {
          badgeCounts[badge] = (badgeCounts[badge] || 0) + 1;
        });
      }
    });
    return Object.entries(badgeCounts)
      .map(([badge, count]) => ({
        value: badge,
        label: badge.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [students]);

  const collegeOptions = useMemo(() => {
    const collegeCounts: Record<string, number> = {};
    students.forEach(student => {
      if (student.college) {
        const normalized = student.college.toLowerCase();
        collegeCounts[normalized] = (collegeCounts[normalized] || 0) + 1;
      }
    });
    return Object.entries(collegeCounts)
      .map(([college, count]) => ({
        value: college,
        label: college,
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [students]);

  // Apply filters and sorting
  const filteredStudents = useMemo(() => {
    let result = students;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(student =>
        student.name?.toLowerCase().includes(query) ||
        student.dept?.toLowerCase().includes(query) ||
        student.college?.toLowerCase().includes(query) ||
        student.skills?.some((skill: any) => {
          const skillName = typeof skill === 'string' ? skill : skill?.name;
          return skillName?.toLowerCase().includes(query);
        })
      );
    }

    // Skills filter
    if (filters.skills.length > 0) {
      result = result.filter(student =>
        student.skills?.some((skill: any) => {
          const skillName = typeof skill === 'string' ? skill : skill?.name;
          return skillName && filters.skills.includes(skillName.toLowerCase());
        })
      );
    }

    // Department filter
    if (filters.departments.length > 0) {
      result = result.filter(student =>
        student.dept && filters.departments.includes(student.dept.toLowerCase())
      );
    }

    // Badge filter
    if (filters.badges.length > 0) {
      result = result.filter(student =>
        student.badges?.some((badge: string) => filters.badges.includes(badge))
      );
    }

    // College filter
    if (filters.colleges.length > 0) {
      result = result.filter(student =>
        student.college && filters.colleges.includes(student.college.toLowerCase())
      );
    }

    // AI score filter
    result = result.filter(student => {
      const score = student.ai_score_overall || 0;
      return score >= filters.minScore && score <= filters.maxScore;
    });

    // Sorting
    const sorted = [...result];
    switch (sortBy) {
      case 'ai_score':
        sorted.sort((a, b) => (b.ai_score_overall || 0) - (a.ai_score_overall || 0));
        break;
      case 'name':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'last_updated':
        sorted.sort((a, b) =>
          new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime()
        );
        break;
      default:
        break;
    }

    return sorted;
  }, [students, searchQuery, filters, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  const handleViewPortfolio = (student: any) => {
    navigate('/digital-pp/homepage', { state: { candidate: student } });
  };

  const handleClearFilters = () => {
    setFilters({
      skills: [],
      departments: [],
      badges: [],
      colleges: [],
      minScore: 0,
      maxScore: 100
    });
  };

  const activeFilterCount = filters.skills.length + filters.departments.length + 
    filters.badges.length + filters.colleges.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading portfolios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="p-6 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Digital Portfolios</h1>
            <p className="text-sm text-gray-600 mt-1">
              Browse student portfolios across all affiliated colleges
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <BuildingOffice2Icon className="h-5 w-5" />
            <span>{colleges.length} Colleges</span>
            <span className="mx-2">•</span>
            <span>{students.length} Students</span>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-xl">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name, skills, department, college..."
              size="md"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-indigo-600 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="flex rounded-lg shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium rounded-l-lg border ${
                viewMode === 'grid'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium rounded-r-lg border-t border-r border-b ${
                viewMode === 'table'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <TableCellsIcon className="h-4 w-4" />
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="ai_score">Sort: AI Score</option>
            <option value="last_updated">Sort: Last Updated</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium text-gray-900">Filters</h2>
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Clear all
                </button>
              </div>

              <FilterSection title="College" defaultOpen>
                <CheckboxGroup
                  options={collegeOptions}
                  selectedValues={filters.colleges}
                  onChange={(values: string[]) => setFilters({ ...filters, colleges: values })}
                />
              </FilterSection>

              <FilterSection title="Skills" defaultOpen>
                <CheckboxGroup
                  options={skillOptions}
                  selectedValues={filters.skills}
                  onChange={(values: string[]) => setFilters({ ...filters, skills: values })}
                />
              </FilterSection>

              <FilterSection title="Department">
                <CheckboxGroup
                  options={departmentOptions}
                  selectedValues={filters.departments}
                  onChange={(values: string[]) => setFilters({ ...filters, departments: values })}
                />
              </FilterSection>

              <FilterSection title="Verification Badge">
                <CheckboxGroup
                  options={badgeOptions}
                  selectedValues={filters.badges}
                  onChange={(values: string[]) => setFilters({ ...filters, badges: values })}
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
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">Error: {error}</p>
            </div>
          ) : paginatedStudents.length === 0 ? (
            <div className="text-center py-12">
              <FolderIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No portfolios found</h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchQuery || activeFilterCount > 0
                  ? 'Try adjusting your search or filters'
                  : 'No student portfolios available'}
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredStudents.length)} of {filteredStudents.length} portfolios
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedStudents.map((student) => (
                    <PortfolioCard
                      key={student.id}
                      student={student}
                      onViewPortfolio={handleViewPortfolio}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">College</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skills</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {student.name?.charAt(0)?.toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                <div className="text-sm text-gray-500">{student.dept}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.college}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {student.skills?.slice(0, 3).map((skill: any, index: number) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {typeof skill === 'string' ? skill : skill?.name}
                                </span>
                              ))}
                              {student.skills && student.skills.length > 3 && (
                                <span className="text-xs text-gray-500">+{student.skills.length - 3}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <StarIcon className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                              <span className="text-sm font-medium">{student.ai_score_overall || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleViewPortfolio(student)}
                              className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                            >
                              View Portfolio
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UniversityAdminDigitalPortfolio;
