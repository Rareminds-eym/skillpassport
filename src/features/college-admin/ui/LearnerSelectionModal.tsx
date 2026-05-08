import React, { useState, useMemo } from 'react';
import { XMarkIcon, AcademicCapIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import SearchBar from '@/shared/ui/SearchBar';
import { Pagination } from '@/shared/ui';

interface Learner {
  id: number;
  name: string;
  rollNo: string;
  department?: string;
  branch_field?: string;
  course_name?: string;
  program_name?: string;
  department_name?: string;
  semester: number;
  cgpa: number;
  atRisk: boolean;
  email: string;
  batch: string;
  riskFactors?: string[];
  lastInteraction?: string;
  interventionCount?: number;
  assignedMentorName?: string; // Added to show which mentor the learner is assigned to
  isAssigned?: boolean; // Added to indicate if learner is already assigned
}

interface LearnerSelectionModalProps {
  availablelearners: Learner[];
  onClose: () => void;
  onNext: (learnerIds: number[]) => void;
  title?: string;
  description?: string;
  buttonText?: string;
  initialSelectedlearners?: number[];
  assignedlearners?: Array<{ learnerId: number; mentorName: string }>; // Added to pass assigned learner info
}

const LearnerSelectionModal: React.FC<LearnerSelectionModalProps> = ({
  availablelearners,
  onClose,
  onNext,
  title,
  description,
  buttonText,
  initialSelectedlearners = [],
  assignedlearners = [], // Added default empty array
}) => {
  const modalTitle = title || "Select Learners for Mentor Allocation";
  const modalDescription = description || "Choose learners who need mentor assignment";
  const modalButtonText = buttonText || "Next: Select Mentor →";
  const [selectedlearners, setSelectedlearners] = useState<number[]>(initialSelectedlearners);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAtRisk, setFilterAtRisk] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Show 10 learners per page

  // Create a map of assigned learners for quick lookup
  const assignedlearnersMap = useMemo(() => {
    const map = new Map<number, string>();
    assignedlearners.forEach(({ learnerId, mentorName }) => {
      map.set(learnerId, mentorName);
    });
    return map;
  }, [assignedlearners]);

  // Enhance learners with assignment info
  const enhancedlearners = useMemo(() => {
    return availablelearners.map(learner => ({
      ...learner,
      isAssigned: assignedlearnersMap.has(learner.id),
      assignedMentorName: assignedlearnersMap.get(learner.id),
    }));
  }, [availablelearners, assignedlearnersMap]);

  // Get unique departments for filtering - handle different field names
  const departments = Array.from(new Set(
    enhancedlearners.map(s => {
      // Try different field names that might contain department info
      const dept = s.department || s.branch_field || s.course_name || s.program_name || s.department_name || '';
      return dept.trim();
    }).filter(dept => dept && dept.length > 0)
  )).sort();
  
  // Get unique years from batch (extract starting year from batch like "2021-2025")
  const years = Array.from(new Set(enhancedlearners.map(s => {
    const batchYear = s.batch.split('-')[0];
    return batchYear;
  }))).sort();

  const filteredlearners = useMemo(() => {
    return enhancedlearners.filter(
      (s: Learner) => {
        const learnerDept = (s.department || s.branch_field || s.course_name || s.program_name || s.department_name || '').trim();
        return (
          (s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.rollNo.toLowerCase().includes(searchTerm.toLowerCase())) &&
          (filterAtRisk === "all" || 
           (filterAtRisk === "at-risk" && s.atRisk) ||
           (filterAtRisk === "not-at-risk" && !s.atRisk)) &&
          (filterDepartment === "all" || learnerDept === filterDepartment) &&
          (filterYear === "all" || s.batch.startsWith(filterYear))
        );
      }
    );
  }, [enhancedlearners, searchTerm, filterAtRisk, filterDepartment, filterYear]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredlearners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedlearners = filteredlearners.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterAtRisk, filterDepartment, filterYear]);

  const handleToggle = (id: number, isAssigned: boolean) => {
    // Prevent selecting already assigned learners
    if (isAssigned) {
      return;
    }
    setSelectedlearners((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    // Only select unassigned learners
    const unassignedlearners = filteredlearners.filter(s => !s.isAssigned);
    if (selectedlearners.length === unassignedlearners.length) {
      setSelectedlearners([]);
    } else {
      setSelectedlearners(unassignedlearners.map((s: Learner) => s.id));
    }
  };

  const handleNext = () => {
    if (selectedlearners.length > 0) {
      onNext(selectedlearners);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {modalTitle}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {modalDescription}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search learners by name or roll number..."
                size="md"
              />
            </div>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm w-auto min-w-[120px] max-w-[160px]"
            >
              <option value="all">All Depts</option>
              {departments.map(dept => (
                <option key={dept} value={dept} title={dept}>
                  {dept.length > 15 ? `${dept.substring(0, 15)}...` : dept}
                </option>
              ))}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm w-auto min-w-[120px]"
            >
              <option value="all">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>Batch {year}</option>
              ))}
            </select>
            <select
              value={filterAtRisk}
              onChange={(e) => setFilterAtRisk(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm w-auto min-w-[120px]"
            >
              <option value="all">All Learners</option>
              <option value="at-risk">At-Risk Only</option>
              <option value="not-at-risk">Not At-Risk</option>
            </select>
          </div>

          {/* Selection Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1.5 text-sm border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                {selectedlearners.length === filteredlearners.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}–{Math.min(endIndex, filteredlearners.length)} of {filteredlearners.length} learners
            </div>
          </div>

          {/* Selection Summary */}
          {selectedlearners.length > 0 && (
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div className="flex items-center gap-2">
                <UserGroupIcon className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-700">
                  {selectedlearners.length} learner(s) selected for mentor allocation
                </span>
              </div>
            </div>
          )}

          {/* Learners List */}
          <div className="space-y-2 mb-4">
            {filteredlearners.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AcademicCapIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No unallocated learners found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              paginatedlearners.map((learner: Learner) => {
                const isAssigned = learner.isAssigned || false;
                const isDisabled = isAssigned;
                
                return (
                <label
                  key={learner.id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    isDisabled 
                      ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed' 
                      : selectedlearners.includes(learner.id) 
                        ? 'border-indigo-300 bg-indigo-50 cursor-pointer hover:bg-indigo-100' 
                        : 'border-gray-200 cursor-pointer hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedlearners.includes(learner.id)}
                      onChange={() => handleToggle(learner.id, isAssigned)}
                      disabled={isDisabled}
                      className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium text-gray-900">{learner.name}</p>
                        {learner.atRisk && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                            At Risk
                          </span>
                        )}
                        {isAssigned && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            Assigned
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {learner.rollNo} • {learner.department || learner.branch_field || learner.course_name || learner.program_name || 'N/A'} • Semester {learner.semester} • CGPA: {learner.cgpa}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {learner.batch} • {learner.email}
                      </p>
                      {isAssigned && learner.assignedMentorName && (
                        <p className="text-xs text-blue-600 mt-1 font-medium">
                          Already assigned to: {learner.assignedMentorName}
                        </p>
                      )}
                      {learner.riskFactors && learner.riskFactors.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {learner.riskFactors.map((factor, index) => (
                            <span key={index} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                              {factor}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {learner.interventionCount !== undefined && (
                      <p>{learner.interventionCount} interventions</p>
                    )}
                    {learner.lastInteraction && (
                      <p>Last: {new Date(learner.lastInteraction).toLocaleDateString()}</p>
                    )}
                  </div>
                </label>
              )})
            )}
          </div>

          {/* Pagination */}
          {filteredlearners.length > itemsPerPage && (
            <div className="mb-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredlearners.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="flex justify-between items-center p-6 pt-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-600">
            {selectedlearners.length > 0 && (
              <span className="font-medium text-indigo-600">
                {selectedlearners.length} learner(s) selected
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleNext}
              disabled={selectedlearners.length === 0}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {modalButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnerSelectionModal;