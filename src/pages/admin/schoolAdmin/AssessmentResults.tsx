import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardDocumentListIcon,
  EyeIcon,
  ChevronDownIcon,
  Squares2X2Icon,
  TableCellsIcon,
  FunnelIcon,
  AcademicCapIcon,
  ChartBarIcon,
  XMarkIcon,
  UserIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../../lib/supabaseClient';
import SearchBar from '../../../components/common/SearchBar';
import { useAuth } from '../../../context/AuthContext';

// Types
interface AssessmentResult {
  id: string;
  student_id: string;
  stream_id: string;
  riasec_code: string | null;
  aptitude_overall: number | null;
  employability_readiness: string | null;
  knowledge_score: number | null;
  status: string;
  created_at: string;
  student_name: string | null;
  student_email: string | null;
  school_id: string | null;
  school_name: string | null;
  career_fit: any;
  skill_gap: any;
  gemini_results: any;
}

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
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
};

// Checkbox Group Component
const CheckboxGroup = ({ options, selectedValues, onChange }: any) => {
  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
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

// Score Badge Component
const ScoreBadge = ({ score, label }: { score: number | null; label: string }) => {
  const getScoreColor = (s: number | null) => {
    if (s === null) return 'bg-gray-100 text-gray-600';
    if (s >= 80) return 'bg-green-100 text-green-700';
    if (s >= 60) return 'bg-blue-100 text-blue-700';
    if (s >= 40) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="flex flex-col items-center">
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${getScoreColor(score)}`}
      >
        {score !== null ? `${score}%` : 'N/A'}
      </span>
      <span className="text-xs text-gray-500 mt-1">{label}</span>
    </div>
  );
};

// Readiness Badge Component
const ReadinessBadge = ({ readiness }: { readiness: string | null }) => {
  const getReadinessStyle = (r: string | null) => {
    switch (r?.toLowerCase()) {
      case 'high':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium border ${getReadinessStyle(readiness)}`}
    >
      {readiness || 'N/A'}
    </span>
  );
};


// Assessment Card Component
const AssessmentCard = ({
  result,
  onView,
}: {
  result: AssessmentResult;
  onView: () => void;
}) => {
  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={onView}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-lg">
              {result.student_name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
              {result.student_name || 'Unknown Student'}
            </h3>
            <p className="text-sm text-gray-600 truncate">{result.student_email}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1 ml-3">
          <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
            {result.stream_id?.toUpperCase() || 'N/A'}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              result.status === 'completed'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {result.status}
          </span>
        </div>
      </div>

      {/* RIASEC Code */}
      {result.riasec_code && (
        <div className="mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-medium text-gray-700">RIASEC Code</span>
          </div>
          <div className="flex gap-1">
            {result.riasec_code
              .split('')
              .slice(0, 6)
              .map((letter, idx) => (
                <span
                  key={idx}
                  className="w-7 h-7 flex items-center justify-center bg-indigo-50 text-indigo-700 font-bold text-sm rounded"
                >
                  {letter}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Scores */}
      <div className="flex justify-between items-center mb-4">
        <ScoreBadge score={result.aptitude_overall} label="Aptitude" />
        <ScoreBadge score={result.knowledge_score} label="Knowledge" />
        <div className="flex flex-col items-center">
          <ReadinessBadge readiness={result.employability_readiness} />
          <span className="text-xs text-gray-500 mt-1">Employability</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          {new Date(result.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors text-xs font-medium"
        >
          <EyeIcon className="h-3.5 w-3.5 mr-1.5" />
          View Details
        </button>
      </div>
    </div>
  );
};


// Detail Modal Component
const AssessmentDetailModal = ({
  result,
  isOpen,
  onClose,
  navigate,
}: {
  result: AssessmentResult | null;
  isOpen: boolean;
  onClose: () => void;
  navigate: any;
}) => {
  if (!isOpen || !result) return null;

  const gemini = result.gemini_results || {};
  const careerFit = result.career_fit || gemini.careerFit || {};
  const skillGap = result.skill_gap || gemini.skillGap || {};

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <div className="relative bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <UserIcon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {result.student_name || 'Unknown Student'}
                  </h3>
                  <p className="text-indigo-100 text-sm">{result.student_email}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            {/* Assessment Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Stream</p>
                <p className="font-semibold text-indigo-600">
                  {result.stream_id?.toUpperCase() || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    result.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {result.status}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Date</p>
                <p className="font-semibold text-gray-700">
                  {new Date(result.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">RIASEC Code</p>
                <p className="font-bold text-indigo-600 tracking-wider">
                  {result.riasec_code || 'N/A'}
                </p>
              </div>
            </div>

            {/* Scores Section */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-indigo-500" />
                Assessment Scores
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {result.aptitude_overall !== null
                      ? `${result.aptitude_overall}%`
                      : 'N/A'}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">Aptitude Score</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-purple-600">
                    {result.knowledge_score !== null
                      ? `${result.knowledge_score}%`
                      : 'N/A'}
                  </p>
                  <p className="text-sm text-purple-700 mt-1">Knowledge Score</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {result.employability_readiness || 'N/A'}
                  </p>
                  <p className="text-sm text-green-700 mt-1">Employability</p>
                </div>
              </div>
            </div>

            {/* Career Fit Section */}
            {careerFit.clusters && careerFit.clusters.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AcademicCapIcon className="h-5 w-5 text-indigo-500" />
                  Top Career Clusters
                </h4>
                <div className="space-y-3">
                  {careerFit.clusters.slice(0, 3).map((cluster: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{cluster.title}</span>
                        <span className="text-sm font-semibold text-indigo-600">
                          {cluster.matchScore}% Match
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-500 h-2 rounded-full"
                          style={{ width: `${cluster.matchScore}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skill Gap Section */}
            {skillGap.priorityA && skillGap.priorityA.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-indigo-500" />
                  Priority Skills to Develop
                </h4>
                <div className="flex flex-wrap gap-2">
                  {skillGap.priorityA.slice(0, 6).map((item: any, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-sm font-medium"
                    >
                      {item.skill || item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Overall Summary */}
            {gemini.overallSummary && (
              <div className="bg-slate-800 rounded-xl p-5 text-white mb-6">
                <h4 className="font-semibold mb-2">Overall Career Direction</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {gemini.overallSummary}
                </p>
              </div>
            )}

            {/* Recommended Courses by Type */}
            {gemini.coursesByType && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AcademicCapIcon className="h-5 w-5 text-indigo-500" />
                  Recommended Courses
                </h4>

                {/* Technical Courses */}
                {gemini.coursesByType.technical &&
                  gemini.coursesByType.technical.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Technical Skills ({gemini.coursesByType.technical.length})
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {gemini.coursesByType.technical
                          .slice(0, 4)
                          .map((course: any, idx: number) => (
                            <div
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/school-admin/academics/browse-courses?search=${encodeURIComponent(course.title)}`);
                              }}
                              className="bg-blue-50 border border-blue-100 rounded-lg p-3 cursor-pointer hover:shadow-md hover:border-blue-200 hover:bg-blue-100 transition-all duration-200"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm truncate">
                                    {course.title}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {course.code} • {course.duration}
                                  </p>
                                </div>
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                  {course.relevance_score}%
                                </span>
                              </div>
                              {course.skills && course.skills.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {course.skills
                                    .slice(0, 3)
                                    .map((skill: string, sIdx: number) => (
                                      <span
                                        key={sIdx}
                                        className="px-1.5 py-0.5 bg-white text-gray-600 text-xs rounded"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                {/* Soft Skills Courses */}
                {gemini.coursesByType.soft && gemini.coursesByType.soft.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Soft Skills ({gemini.coursesByType.soft.length})
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {gemini.coursesByType.soft
                        .slice(0, 4)
                        .map((course: any, idx: number) => (
                          <div
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/school-admin/academics/browse-courses?search=${encodeURIComponent(course.title)}`);
                            }}
                            className="bg-green-50 border border-green-100 rounded-lg p-3 cursor-pointer hover:shadow-md hover:border-green-200 hover:bg-green-100 transition-all duration-200"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">
                                  {course.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {course.code} • {course.duration}
                                </p>
                              </div>
                              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                {course.relevance_score}%
                              </span>
                            </div>
                            {course.skills && course.skills.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {course.skills
                                  .slice(0, 3)
                                  .map((skill: string, sIdx: number) => (
                                    <span
                                      key={sIdx}
                                      className="px-1.5 py-0.5 bg-white text-gray-600 text-xs rounded"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// Main Component
const SchoolAdminAssessmentResults: React.FC = () => {
  const navigate = useNavigate();
  // @ts-ignore - AuthContext is a .jsx file
  const { user } = useAuth();

  // State
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(24);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('date');

  const [selectedResult, setSelectedResult] = useState<AssessmentResult | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [filters, setFilters] = useState({
    streams: [] as string[],
    statuses: [] as string[],
    readiness: [] as string[],
  });

  // Fetch assessment results for this school only
  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user's email
      const userEmail = user?.email;
      if (!userEmail) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      // Find school by matching email (case-insensitive)
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('id, name, email')
        .ilike('email', userEmail)
        .single();

      if (schoolError || !school?.id) {
        console.error('Error fetching school:', schoolError, 'for email:', userEmail);
        setError('No school associated with your account');
        setLoading(false);
        return;
      }

      const schoolId = school.id;
      
      // Set school name from the already fetched school data
      setSchoolName(school.name);

      // Get students from this school
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('user_id, name, email')
        .eq('school_id', schoolId);

      if (studentsError) throw studentsError;

      if (!studentsData || studentsData.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      // Filter out students with null user_id to avoid UUID parsing errors
      const validStudents = studentsData.filter((s) => s.user_id != null);
      
      if (validStudents.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      const studentIds = validStudents.map((s) => s.user_id);
      const studentMap = new Map(validStudents.map((s) => [s.user_id, s]));

      // Fetch assessment results for these students
      const { data, error: fetchError } = await supabase
        .from('personal_assessment_results')
        .select(`
          id,
          student_id,
          stream_id,
          riasec_code,
          aptitude_overall,
          employability_readiness,
          knowledge_score,
          status,
          created_at,
          career_fit,
          skill_gap,
          gemini_results
        `)
        .in('student_id', studentIds)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const enrichedResults = (data || []).map((r) => {
        const student = studentMap.get(r.student_id);
        return {
          ...r,
          student_name: student?.name || null,
          student_email: student?.email || null,
          school_id: schoolId,
          school_name: school.name || null,
        };
      });

      setResults(enrichedResults);
    } catch (err: any) {
      console.error('Error fetching assessment results:', err);
      setError(err?.message || 'Failed to load assessment results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchResults();
    }
  }, [user?.email]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortBy]);

  // Generate filter options from data
  const streamOptions = useMemo(() => {
    const streamCounts: Record<string, number> = {};
    results.forEach((r) => {
      if (r.stream_id) {
        const normalized = r.stream_id.toLowerCase();
        streamCounts[normalized] = (streamCounts[normalized] || 0) + 1;
      }
    });
    return Object.entries(streamCounts)
      .map(([stream, count]) => ({
        value: stream,
        label: stream.toUpperCase(),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [results]);

  const statusOptions = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    results.forEach((r) => {
      if (r.status) {
        statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
      }
    });
    return Object.entries(statusCounts).map(([status, count]) => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1),
      count,
    }));
  }, [results]);

  const readinessOptions = useMemo(() => {
    const readinessCounts: Record<string, number> = {};
    results.forEach((r) => {
      if (r.employability_readiness) {
        readinessCounts[r.employability_readiness] =
          (readinessCounts[r.employability_readiness] || 0) + 1;
      }
    });
    return Object.entries(readinessCounts).map(([readiness, count]) => ({
      value: readiness,
      label: readiness,
      count,
    }));
  }, [results]);

  // Apply filters and sorting
  const filteredResults = useMemo(() => {
    let filtered = results;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.student_name?.toLowerCase().includes(query) ||
          r.student_email?.toLowerCase().includes(query) ||
          r.stream_id?.toLowerCase().includes(query) ||
          r.riasec_code?.toLowerCase().includes(query)
      );
    }

    // Stream filter
    if (filters.streams.length > 0) {
      filtered = filtered.filter(
        (r) => r.stream_id && filters.streams.includes(r.stream_id.toLowerCase())
      );
    }

    // Status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(
        (r) => r.status && filters.statuses.includes(r.status)
      );
    }

    // Readiness filter
    if (filters.readiness.length > 0) {
      filtered = filtered.filter(
        (r) =>
          r.employability_readiness &&
          filters.readiness.includes(r.employability_readiness)
      );
    }

    // Sorting
    const sorted = [...filtered];
    switch (sortBy) {
      case 'date':
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case 'name':
        sorted.sort((a, b) =>
          (a.student_name || '').localeCompare(b.student_name || '')
        );
        break;
      case 'aptitude':
        sorted.sort(
          (a, b) => (b.aptitude_overall || 0) - (a.aptitude_overall || 0)
        );
        break;
      case 'knowledge':
        sorted.sort(
          (a, b) => (b.knowledge_score || 0) - (a.knowledge_score || 0)
        );
        break;
      default:
        break;
    }

    return sorted;
  }, [results, searchQuery, filters, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

  const handleViewResult = (result: AssessmentResult) => {
    setSelectedResult(result);
    setShowDetailModal(true);
  };

  const handleClearFilters = () => {
    setFilters({
      streams: [],
      statuses: [],
      readiness: [],
    });
  };

  const activeFilterCount =
    filters.streams.length + filters.statuses.length + filters.readiness.length;

  // Stats
  const stats = useMemo(() => {
    const completed = results.filter((r) => r.status === 'completed').length;
    const avgAptitude =
      results.length > 0
        ? Math.round(
            results.reduce((sum, r) => sum + (r.aptitude_overall || 0), 0) /
              results.length
          )
        : 0;
    const avgKnowledge =
      results.length > 0
        ? Math.round(
            results.reduce((sum, r) => sum + (r.knowledge_score || 0), 0) /
              results.length
          )
        : 0;
    return { total: results.length, completed, avgAptitude, avgKnowledge };
  }, [results]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment results...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">
              Student Assessment Results
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              View personal assessment results for {schoolName || 'your school'}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-sm text-indigo-600 font-medium">Total Assessments</p>
            <p className="text-2xl font-bold text-indigo-700">{stats.total}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Completed</p>
            <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Avg Aptitude</p>
            <p className="text-2xl font-bold text-blue-700">{stats.avgAptitude}%</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">Avg Knowledge</p>
            <p className="text-2xl font-bold text-purple-700">{stats.avgKnowledge}%</p>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-xl">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name, email, stream, RIASEC code..."
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
            <option value="date">Sort: Latest</option>
            <option value="name">Sort: Name</option>
            <option value="aptitude">Sort: Aptitude Score</option>
            <option value="knowledge">Sort: Knowledge Score</option>
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

              <FilterSection title="Stream" defaultOpen>
                <CheckboxGroup
                  options={streamOptions}
                  selectedValues={filters.streams}
                  onChange={(values: string[]) =>
                    setFilters({ ...filters, streams: values })
                  }
                />
              </FilterSection>

              <FilterSection title="Status">
                <CheckboxGroup
                  options={statusOptions}
                  selectedValues={filters.statuses}
                  onChange={(values: string[]) =>
                    setFilters({ ...filters, statuses: values })
                  }
                />
              </FilterSection>

              <FilterSection title="Employability Readiness">
                <CheckboxGroup
                  options={readinessOptions}
                  selectedValues={filters.readiness}
                  onChange={(values: string[]) =>
                    setFilters({ ...filters, readiness: values })
                  }
                />
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
          ) : paginatedResults.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No assessment results found
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchQuery || activeFilterCount > 0
                  ? 'Try adjusting your search or filters'
                  : 'No student assessments available yet'}
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
                Showing {startIndex + 1}-
                {Math.min(endIndex, filteredResults.length)} of{' '}
                {filteredResults.length} results
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedResults.map((result) => (
                    <AssessmentCard
                      key={result.id}
                      result={result}
                      onView={() => handleViewResult(result)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Stream
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          RIASEC
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Aptitude
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Knowledge
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Readiness
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedResults.map((result) => (
                        <tr key={result.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {result.student_name?.charAt(0)?.toUpperCase() ||
                                    '?'}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {result.student_name || 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {result.student_email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
                              {result.stream_id?.toUpperCase() || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-indigo-600">
                            {result.riasec_code || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {result.aptitude_overall !== null
                              ? `${result.aptitude_overall}%`
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {result.knowledge_score !== null
                              ? `${result.knowledge_score}%`
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <ReadinessBadge
                              readiness={result.employability_readiness}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(result.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleViewResult(result)}
                              className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                            >
                              View
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
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
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

      {/* Detail Modal */}
      <AssessmentDetailModal
        result={selectedResult}
        isOpen={showDetailModal}
        navigate={navigate}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedResult(null);
        }}
      />
    </div>
  );
};

export default SchoolAdminAssessmentResults;
