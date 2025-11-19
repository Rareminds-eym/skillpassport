import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  FunnelIcon,
  TableCellsIcon,
  Squares2X2Icon,
  EyeIcon,
  ChevronDownIcon,
  StarIcon,
  XMarkIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { useStudents } from '../../hooks/useStudents';
import { useSearch } from '../../context/SearchContext';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/educator/Pagination';
import AddStudentModal from '../../components/educator/modals/Addstudentmodal';
import { UserPlusIcon } from 'lucide-react';

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

const MentorNoteModal = ({ isOpen, onClose, student, onSuccess }: any) => {
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
      // TODO: Replace with actual API call to save mentor note
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
              <h3 className="text-lg font-medium text-gray-900">Add Mentor Note</h3>
              <p className="text-sm text-gray-500 mt-1">
                Add feedback or observation for <span className="font-medium">{student?.name}</span>
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
              placeholder="Enter your feedback, observations, or recommendations..."
            />
            <p className="text-xs text-gray-500 mt-1">
              This note will be attached to the student's profile for future reference.
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

const BadgeComponent = ({ badges }) => {
  const badgeConfig = {
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

const StudentCard = ({ student, onViewProfile, onAddNote }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{student.name}</h3>
          <p className="text-sm text-gray-500">{student.dept}</p>
          <p className="text-xs text-gray-400">{student.college} • {student.location}</p>
        </div>
        <div className="flex flex-col items-end">
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
          {student.skills.slice(0, 5).map((skill: any, index: number) => {
            const label = typeof skill === 'string' ? skill : skill?.name;
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
        {student.hackathon && (
          <p className="text-xs text-gray-600">
            🏆 Rank #{student.hackathon.rank} in {student.hackathon.event_id}
          </p>
        )}
        {student.internship && (
          <p className="text-xs text-gray-600">
            💼 {student.internship.org} ({student.internship.rating}⭐)
          </p>
        )}
        {student.projects && student.projects.length > 0 && (
          <p className="text-xs text-gray-600">
            🔬 {student.projects[0].title}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Updated {new Date(student.last_updated).toLocaleDateString()}
        </span>
        <div className="flex space-x-2">
          <button
            onClick={() => onViewProfile(student)}
            className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={!onViewProfile}
          >
            <EyeIcon className="h-3 w-3 mr-1" />
            View Profile
          </button>
          <button
            onClick={() => onAddNote(student)}
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

type EducatorOutletContext = {
  onViewProfile: (student: any) => void
}

const StudentsPage = () => {
  const { onViewProfile } = useOutletContext<EducatorOutletContext>()
  const { searchQuery, setSearchQuery } = useSearch();
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [filters, setFilters] = useState({
    skills: [],
    courses: [],
    badges: [],
    locations: [],
    years: [],
    minScore: 0,
    maxScore: 100
  });

  const { students, loading, error } = useStudents();

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortBy]);

  // Dynamically generate filter options from actual data
  const skillOptions = useMemo(() => {
    const skillCounts = {};
    students.forEach(student => {
      const profile = (student as any).profile || student;
      const skillsToCheck = student.skills || profile.skills;
      if (skillsToCheck && Array.isArray(skillsToCheck)) {
        skillsToCheck.forEach(skill => {
          const skillName = typeof skill === 'string' ? skill : skill?.name;
          if (skillName) {
            const normalizedSkill = skillName.toLowerCase();
            skillCounts[normalizedSkill] = (skillCounts[normalizedSkill] || 0) + 1;
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
      .slice(0, 20);
  }, [students]);

  const courseOptions = useMemo(() => {
    const courseCounts = {};
    students.forEach(student => {
      const profile = (student as any).profile || student;
      const dept = student.dept || profile.dept || profile.department;
      if (dept) {
        const normalizedCourse = dept.toLowerCase();
        courseCounts[normalizedCourse] = (courseCounts[normalizedCourse] || 0) + 1;
      }
    });
    return Object.entries(courseCounts)
      .map(([course, count]) => ({
        value: course,
        label: course,
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [students]);

  const badgeOptions = useMemo(() => {
    const badgeCounts = {};
    students.forEach(student => {
      if (student.badges && Array.isArray(student.badges)) {
        student.badges.forEach(badge => {
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

  const locationOptions = useMemo(() => {
    const locationCounts = {};
    students.forEach(student => {
      const profile = (student as any).profile || student;
      const location = student.location || profile.location;
      if (location) {
        const normalizedLocation = location.toLowerCase();
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
  }, [students]);

  const yearOptions = useMemo(() => {
    const yearCounts = {};
    students.forEach(student => {
      const profile = (student as any).profile || student;
      const year = student.year || profile.year;
      if (year) {
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      }
    });
    return Object.entries(yearCounts)
      .map(([year, count]) => ({
        value: year,
        label: year,
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [students]);

  // Enhanced filter and sort with comprehensive search - WITH LEXICOGRAPHICAL ORDERING
  const filteredAndSortedStudents = useMemo(() => {
    let result = students;

    // Apply comprehensive search query filter with lexicographical sorting
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();

      // Store match results with the matched field for sorting
      const resultsWithScores = students.map(student => {
        const profile = (student as any).profile || student;
        let matchedField = '';
        let isMatch = false;

        const matchesField = (field: any, fieldName: string = ''): boolean => {
          if (!field) return false;
          const fieldStr = field.toString().toLowerCase();
          if (fieldStr.includes(query)) {
            if (!isMatch) matchedField = fieldName || fieldStr;
            isMatch = true;
            return true;
          }
          return false;
        };

        const searchInArray = (arr: any[], fields: string[], arrayName: string = ''): boolean => {
          if (!arr || !Array.isArray(arr)) return false;
          return arr.some((item: any) => {
            if (!item) return false;
            return fields.some(field => {
              const value = item[field];
              if (value && value.toString().toLowerCase().includes(query)) {
                if (!isMatch) matchedField = arrayName || field;
                isMatch = true;
                return true;
              }
              return false;
            });
          });
        };

        // Basic fields
        if (matchesField(student.name, 'name') || matchesField(profile.name, 'name')) return { student, matchedField: matchedField || student.name?.toLowerCase() || '' };
        if (matchesField(student.email, 'email') || matchesField(profile.email, 'email')) return { student, matchedField: matchedField || student.email?.toLowerCase() || '' };
        if (matchesField(profile.age, 'age')) return { student, matchedField };
        if (matchesField(profile.skill, 'skill')) return { student, matchedField };
        if (matchesField(profile.course, 'course')) return { student, matchedField };
        if (matchesField(student.dept, 'dept') || matchesField(profile.dept, 'dept')) return { student, matchedField };
        if (matchesField(profile.department, 'department')) return { student, matchedField };
        if (matchesField(student.college, 'college') || matchesField(profile.college_school_name, 'college')) return { student, matchedField };
        if (matchesField(student.location, 'location') || matchesField(profile.location, 'location')) return { student, matchedField };
        if (matchesField(profile.university, 'university')) return { student, matchedField };
        if (matchesField(profile.registration_number, 'registration')) return { student, matchedField };

        // Skills array
        const skillsToCheck = student.skills || profile.skills;
        if (skillsToCheck && Array.isArray(skillsToCheck)) {
          const skillMatch = skillsToCheck.some((skill: any) => {
            if (typeof skill === 'string') {
              if (skill.toLowerCase().includes(query)) {
                if (!isMatch) matchedField = skill.toLowerCase();
                isMatch = true;
                return true;
              }
            } else if (skill && skill.name) {
              if (skill.name.toLowerCase().includes(query)) {
                if (!isMatch) matchedField = skill.name.toLowerCase();
                isMatch = true;
                return true;
              }
            }
            return false;
          });
          if (skillMatch) return { student, matchedField };
        }

        // Projects
        if (searchInArray(profile.projects, ['title', 'id', 'link', 'tech', 'techStack', 'technologies', 'organization', 'description', 'skills', 'status'], 'projects')) {
          return { student, matchedField };
        }

        // Education
        if (searchInArray(profile.education, ['yearOfPassing', 'university', 'degree', 'department', 'college_school_name', 'level', 'cgpa', 'status'], 'education')) {
          return { student, matchedField };
        }

        // Experience
        if (profile.experience && Array.isArray(profile.experience)) {
          const expMatch = profile.experience.some((exp: any) => {
            if (!exp) return false;
            if (matchesField(exp.duration, 'experience')) return true;
            if (matchesField(exp.role, 'experience')) return true;
            if (matchesField(exp.organization, 'experience')) return true;
            if (exp.verified === true && (query.includes('verified') || query === 'true')) {
              if (!isMatch) matchedField = 'verified experience';
              isMatch = true;
              return true;
            }
            if (exp.verified === false && (query.includes('unverified') || query.includes('not verified') || query === 'false')) {
              if (!isMatch) matchedField = 'unverified experience';
              isMatch = true;
              return true;
            }
            return false;
          });
          if (expMatch) return { student, matchedField };
        }

        // Soft Skills
        if (profile.softSkills && Array.isArray(profile.softSkills)) {
          const softSkillMatch = profile.softSkills.some((skill: any) => {
            if (!skill) return false;
            if (matchesField(skill.name, 'soft skill')) return true;
            if (matchesField(skill.description, 'soft skill')) return true;
            if (matchesField(skill.type, 'soft skill')) return true;
            if (matchesField(skill.level, 'soft skill')) return true;
            return false;
          });
          if (softSkillMatch) return { student, matchedField };
        }

        // Certificates
        if (profile.certificates && Array.isArray(profile.certificates)) {
          const certMatch = profile.certificates.some((cert: any) => {
            if (!cert) return false;
            if (matchesField(cert.level, 'certificate')) return true;
            if (matchesField(cert.title, 'certificate')) return true;
            if (matchesField(cert.issuedOn, 'certificate')) return true;
            if (matchesField(cert.issuer, 'certificate')) return true;
            if (matchesField(cert.description, 'certificate')) return true;
            if (matchesField(cert.credentialId, 'certificate')) return true;
            if (matchesField(cert.status, 'certificate')) return true;
            return false;
          });
          if (certMatch) return { student, matchedField };
        }

        // Technical Skills
        if (profile.technicalSkills && Array.isArray(profile.technicalSkills)) {
          const techMatch = profile.technicalSkills.some((skill: any) => {
            if (!skill) return false;
            if (matchesField(skill.name, 'technical skill')) return true;
            if (matchesField(skill.level, 'technical skill')) return true;
            if (matchesField(skill.category, 'technical skill')) return true;
            if (skill.verified === true && query.includes('verified')) {
              if (!isMatch) matchedField = 'verified technical skill';
              isMatch = true;
              return true;
            }
            return false;
          });
          if (techMatch) return { student, matchedField };
        }

        // Training
        if (profile.training && Array.isArray(profile.training)) {
          const trainingMatch = profile.training.some((training: any) => {
            if (!training) return false;
            if (matchesField(training.name, 'training')) return true;
            if (matchesField(training.title, 'training')) return true;
            if (matchesField(training.organization, 'training')) return true;
            if (matchesField(training.description, 'training')) return true;
            return false;
          });
          if (trainingMatch) return { student, matchedField };
        }

        return null;
      }).filter(item => item !== null);

      // Sort results lexicographically by matched field
      resultsWithScores.sort((a, b) => {
        return a.matchedField.localeCompare(b.matchedField);
      });

      result = resultsWithScores.map(item => item.student);
    }

    // Apply skill filters
    if (filters.skills.length > 0) {
      result = result.filter(student => {
        const profile = (student as any).profile || student;
        const skillsToCheck = student.skills || profile.skills;
        return skillsToCheck?.some((skill: any) => {
          const skillName = typeof skill === 'string' ? skill : skill?.name;
          return skillName && filters.skills.includes(skillName.toLowerCase());
        });
      });
    }

    // Apply course/department filters
    if (filters.courses.length > 0) {
      result = result.filter(student => {
        const profile = (student as any).profile || student;
        const dept = student.dept || profile.dept || profile.department;
        return dept && filters.courses.includes(dept.toLowerCase());
      });
    }

    // Apply badge filters
    if (filters.badges.length > 0) {
      result = result.filter(student =>
        student.badges?.some(badge =>
          filters.badges.includes(badge)
        )
      );
    }

    // Apply location filters
    if (filters.locations.length > 0) {
      result = result.filter(student => {
        const profile = (student as any).profile || student;
        const location = student.location || profile.location;
        return location && filters.locations.includes(location.toLowerCase());
      });
    }

    // Apply year filters
    if (filters.years.length > 0) {
      result = result.filter(student =>
        filters.years.includes(student.year)
      );
    }

    // Apply AI score range filter
    result = result.filter(student => {
      const score = student.ai_score_overall || 0;
      return score >= filters.minScore && score <= filters.maxScore;
    });

    // Apply sorting (only if not already sorted by search relevance)
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

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      skills: [],
      courses: [],
      badges: [],
      locations: [],
      years: [],
      minScore: 0,
      maxScore: 100
    });
  };

  const handleAddNoteClick = (student) => {
    setSelectedStudent(student);
    setShowNoteModal(true);
  };

  const handleNoteSuccess = () => {
    alert(`Note added for ${selectedStudent?.name}!`);
    setShowNoteModal(false);
    setSelectedStudent(null);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header - responsive layout */}
      <div className="p-4 sm:p-6 lg:p-8 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Students Management</h1>
          <p className="text-base md:text-lg mt-2 text-gray-600">Manage your students and their profiles.</p>
        </div>
        <button
          onClick={() => setShowAddStudentModal(true)}
          className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
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
              ({totalItems} {searchQuery || filters.skills.length > 0 || filters.locations.length > 0 ? 'matching' : ''} students)
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
            {(filters.skills.length + filters.courses.length + filters.badges.length + filters.locations.length + filters.years.length) > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">
                {filters.skills.length + filters.courses.length + filters.badges.length + filters.locations.length + filters.years.length}
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

      {/* Mobile/Tablet: stacked layout */}
      <div className="lg:hidden p-4 bg-white border-b border-gray-200 space-y-4">
        <div className="text-left">
          <h1 className="text-xl font-semibold text-gray-900">Students</h1>
          <span className="text-sm text-gray-500">
            {totalItems} {searchQuery || filters.skills.length > 0 || filters.locations.length > 0 ? 'matching' : ''} students
          </span>
        </div>

        <div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search students..."
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
            {(filters.skills.length + filters.courses.length + filters.badges.length + filters.locations.length + filters.years.length) > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">
                {filters.skills.length + filters.courses.length + filters.badges.length + filters.locations.length + filters.years.length}
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

                <FilterSection title="Course/Track">
                  <CheckboxGroup
                    options={courseOptions}
                    selectedValues={filters.courses}
                    onChange={(values) => setFilters({ ...filters, courses: values })}
                  />
                </FilterSection>

                <FilterSection title="Verification Badge">
                  <CheckboxGroup
                    options={badgeOptions}
                    selectedValues={filters.badges}
                    onChange={(values) => setFilters({ ...filters, badges: values })}
                  />
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-800">
                      <strong>Institution:</strong> Verified by your institution<br />
                      <strong>External:</strong> Third-party audited credentials
                    </p>
                  </div>
                </FilterSection>

                <FilterSection title="Location">
                  <CheckboxGroup
                    options={locationOptions}
                    selectedValues={filters.locations}
                    onChange={(values) => setFilters({ ...filters, locations: values })}
                  />
                </FilterSection>

                <FilterSection title="Academic Year">
                  <CheckboxGroup
                    options={yearOptions}
                    selectedValues={filters.years}
                    onChange={(values) => setFilters({ ...filters, years: values })}
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
          {/* Results header */}
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
                <option value="ai_score">Sort by: AI Score</option>
                <option value="last_updated">Sort by: Last Updated</option>
                <option value="name">Sort by: Name</option>
              </select>
            </div>
          </div>

          {/* Results */}
          <div className="px-4 sm:px-6 lg:px-8 flex-1 overflow-y-auto p-4">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {loading && <div className="text-sm text-gray-500">Loading students...</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}
                {!loading && paginatedStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student as any}
                    onViewProfile={onViewProfile}
                    onAddNote={handleAddNoteClick}
                  />
                ))}
                {!loading && paginatedStudents.length === 0 && !error && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-sm text-gray-500">
                      {searchQuery || filters.skills.length > 0 || filters.locations.length > 0
                        ? 'No students match your current filters'
                        : 'No students found.'}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Try adjusting your search terms or filters.
                    </p>
                    {(filters.skills.length > 0 || filters.locations.length > 0 || filters.courses.length > 0) && (
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                          <div className="flex space-x-2">
                            <button
                              onClick={() => onViewProfile(student)}
                              className="text-primary-600 hover:text-primary-900"
                              disabled={!onViewProfile}
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleAddNoteClick(student)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              Add Note
                            </button>
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
              // onItemsPerPageChange={handleItemsPerPageChange}
              // itemsPerPageOptions={[10, 25, 50, 100]}
            />
          )}
        </div>
      </div>

      {/* Mentor Note Modal */}
      <MentorNoteModal
        isOpen={showNoteModal}
        onClose={() => {
          setShowNoteModal(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onSuccess={handleNoteSuccess}
      />

       <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        onSuccess={() => {
          setShowAddStudentModal(false);
        }}
      />
    </div>
  );
};

export default StudentsPage;