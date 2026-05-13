import { UsersIcon } from "@heroicons/react/24/outline";
import React, { RefObject } from 'react';

interface LearnerSearchProps {
  learnerSearch: string;
  setlearnerSearch: (value: string) => void;
  showlearnerDropdown: boolean;
  learnerSearchResults: any[];
  searchLoading: boolean;
  selectLearner: (learner: any) => void;
  learnerSearchRef: RefObject<HTMLDivElement>;
}

export const LearnerSearch: React.FC<LearnerSearchProps> = ({
  learnerSearch,
  setlearnerSearch,
  showlearnerDropdown,
  learnerSearchResults,
  searchLoading,
  selectLearner,
  learnerSearchRef,
}) => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h3 className="flex items-center gap-3 font-bold text-blue-900 mb-3">
        <div className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center">
          <UsersIcon className="w-6 h-6 text-blue-600" />
        </div>
        Select Learner
      </h3>
      <div className="relative" ref={learnerSearchRef}>
        <label className="block mb-2 font-medium text-gray-700">Search Learner</label>
        <div className="relative">
          <input 
            className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Type learner name, roll number, enrollment number, or email..."
            value={learnerSearch}
            onChange={(e) => setlearnerSearch(e.target.value)}
            onFocus={() => {
              if (learnerSearchResults.length > 0 && learnerSearch.length >= 2) {
                // Show dropdown on focus if there are results
              }
            }}
          />
          {/* Search Icon or Loading Spinner */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {searchLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            ) : (
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
        </div>
        
        {/* Learner Search Dropdown */}
        {showlearnerDropdown && learnerSearchResults.length > 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {learnerSearchResults.map((learner) => (
              <div
                key={learner.id}
                className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                onClick={() => selectLearner(learner)}
              >
                <div className="font-semibold text-gray-800">{learner.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {learner.roll_number && `Roll: ${learner.roll_number}`}
                  {learner.enrollmentNumber && ` | Enrollment: ${learner.enrollmentNumber}`}
                  {learner.admission_number && ` | Admission: ${learner.admission_number}`}
                </div>
                <div className="text-sm text-gray-600">
                  {learner.grade && `Grade: ${learner.grade}`}
                  {learner.section && ` Section: ${learner.section}`}
                  {learner.course_name && ` | Course: ${learner.course_name}`}
                  {learner.semester && ` | Semester: ${learner.semester}`}
                </div>
                {learner.email && (
                  <div className="text-xs text-gray-500 mt-1">{learner.email}</div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Loading State */}
        {searchLoading && learnerSearch.length >= 2 && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
            <div className="flex items-center justify-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Searching learners...
            </div>
          </div>
        )}
        
        {/* No Results Message */}
        {!searchLoading && learnerSearch.length >= 2 && learnerSearchResults.length === 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
            <p className="text-sm text-gray-500 text-center">No learners found</p>
          </div>
        )}
      </div>
    </div>
  );
};
