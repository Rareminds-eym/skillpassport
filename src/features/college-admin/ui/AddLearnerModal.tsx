import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  UserPlusIcon,
  UserMinusIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';
import toast from 'react-hot-toast';

const logger = getLogger('college-admin:AddLearnerModal');

interface Learner {
  id?: string;
  roll_number?: string;
  name?: string;
  email: string;
  contactNumber?: string;
  contact_number?: string;
  semester?: number;
  section?: string;
  course_name?: string;
  branch_field?: string;
  department_id?: string | null;
  college_id?: string | null;
  progress?: number;
  is_deleted?: boolean;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface AddlearnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
  onSave: (deptId: string, learners: Learner[]) => void;
}

const AddLearnerModal: React.FC<AddlearnerModalProps> = ({
  isOpen,
  onClose,
  department,
  onSave,
}) => {
  const [currentlearners, setCurrentlearners] = useState<Learner[]>([]);
  const [availablelearners, setAvailablelearners] = useState<Learner[]>([]);
  const [selectedlearners, setSelectedlearners] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New states for learner assignment details
  const [assignmentDetails, setAssignmentDetails] = useState({
    semester: 1,
    section: '',
    course_name: ''
  });

  useEffect(() => {
    if (isOpen && department) {
      fetchlearners();
    }
  }, [isOpen, department]);

  const fetchlearners = async () => {
    if (!department) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Check if department has college_id
      if (!department.college_id) {
        // Fetch department details to get college_id
        const { data: deptData, error: deptFetchError } = await supabase
          .from('departments')
          .select('college_id')
          .eq('id', department.id)
          .single();
          
        if (deptFetchError || !deptData?.college_id) {
          throw new Error('Department is not associated with a college');
        }
        
        // Update the department object with college_id
        department.college_id = deptData.college_id;
      }
      
      // Fetch current department learners
      const { data: deptlearners, error: deptError } = await supabase
        .from('learners')
        .select('id, name, email, department_id, college_id, roll_number, course_name, branch_field, contactNumber, semester, section')
        .eq('department_id', department.id);

      if (deptError) {
        logger.error('Error fetching department learners', deptError);
        throw deptError;
      }

      // Fetch available learners (not assigned to any department but belong to the same college)
      const { data: availlearners, error: availError } = await supabase
        .from('learners')
        .select('id, name, email, department_id, college_id, roll_number, course_name, branch_field, contactNumber, semester, section')
        .is('department_id', null)
        .eq('college_id', department.college_id);

      if (availError) {
        logger.error('Error fetching available learners', availError);
        throw availError;
      }

      setCurrentlearners(deptlearners || []);
      setAvailablelearners(availlearners || []);
    } catch (error: any) {
      logger.error('Error fetching learners', error);
      setError(`Failed to load learners: ${error.message || 'Unknown error'}`);
      toast.error(`Failed to load learners: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !department) return null;

  const filteredAvailable = availablelearners.filter(learner =>
    learner.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    learner.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    learner.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    learner.course_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    learner.branch_field?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglelearnerSelection = (learnerId: string) => {
    setSelectedlearners((prev) =>
      prev.includes(learnerId) ? prev.filter((id) => id !== learnerId) : [...prev, learnerId]
    );
  };

  const handleAddlearners = async () => {
    if (loading) return;
    if (!selectedlearners.length) {
      toast.error("Choose at least one learner to add");
      return;
    }

    // Validate assignment details
    if (!assignmentDetails.section.trim()) {
      toast.error("Please specify the section");
      return;
    }

    if (!assignmentDetails.course_name.trim()) {
      toast.error("Please specify the course name");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("learners")
        .update({ 
          department_id: department.id,
          semester: assignmentDetails.semester,
          section: assignmentDetails.section.trim(),
          course_name: assignmentDetails.course_name.trim()
        })
        .in("id", selectedlearners);

      if (error) {
        logger.error('Error adding learners', error);
        throw error;
      }

      const addedCount = selectedlearners.length;
      const learnerNames = availablelearners.filter(s => selectedlearners.includes(s.id!));
      
      toast.success(
        addedCount === 1 
          ? `${learnerNames[0]?.name || 'Learner'} added to ${department.name}` 
          : `${addedCount} learners added to ${department.name}`
      );
      
      setSelectedlearners([]);
      // Reset assignment details
      setAssignmentDetails({
        semester: 1,
        section: '',
        course_name: ''
      });
      fetchlearners(); // Refresh the lists
      
    } catch (error: any) {
      logger.error('Error in handleAddlearners', error);
      toast.error(`Failed to add learners: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLearner = async (learnerId: string, learnerName: string) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("learners")
        .update({ department_id: null })
        .eq("id", learnerId);

      if (error) {
        logger.error('Error removing learner', error);
        throw error;
      }

      toast.success(`${learnerName} removed from ${department.name}`);
      fetchlearners(); // Refresh the lists
    } catch (error: any) {
      logger.error('Error in handleRemoveLearner', error);
      toast.error(`Failed to remove learner: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const learnerCount = currentlearners.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center px-4 py-8 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900/50 transition-opacity" onClick={onClose} />
        <div className="inline-block w-full max-w-6xl transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-middle shadow-xl transition-all sm:my-8 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <UserPlusIcon className="h-6 w-6 text-indigo-600" />
                  Manage Department Learners
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                  {learnerCount}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Assign learners to {department.name} ({department.code}) with semester and course details
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              type="button"
            >
              <XMarkIcon className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Learners - Left side (2/3 width) */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Current Learners</h3>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {loading ? (
                  <div className="py-10 px-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading learners...</p>
                  </div>
                ) : learnerCount === 0 ? (
                  <div className="py-10 px-6 text-center text-sm text-gray-500">
                    No learners assigned yet. Add learners to start building your department.
                  </div>
                ) : (
                  currentlearners.map((learner) => (
                    <div key={learner.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {learner.name || 'Unknown Learner'}
                          </p>
                          {learner.roll_number && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {learner.roll_number}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{learner.email}</p>
                        <div className="mt-2 flex items-center gap-4">
                          {learner.semester && (
                            <div>
                              <p className="text-xs text-gray-500">Semester</p>
                              <p className="text-sm font-semibold text-gray-900">{learner.semester}</p>
                            </div>
                          )}
                          {learner.section && (
                            <div>
                              <p className="text-xs text-gray-500">Section</p>
                              <p className="text-sm font-semibold text-gray-900">{learner.section}</p>
                            </div>
                          )}
                          {learner.course_name && (
                            <div>
                              <p className="text-xs text-gray-500">Course</p>
                              <p className="text-sm font-semibold text-gray-900">{learner.course_name}</p>
                            </div>
                          )}
                          {learner.branch_field && (
                            <div>
                              <p className="text-xs text-gray-500">Branch</p>
                              <p className="text-sm font-semibold text-gray-900">{learner.branch_field}</p>
                            </div>
                          )}
                          {(learner.contactNumber || learner.contact_number) && (
                            <div>
                              <p className="text-xs text-gray-500">Phone</p>
                              <p className="text-sm font-semibold text-gray-900">{learner.contactNumber || learner.contact_number}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Progress</p>
                          <p className="text-sm font-semibold text-gray-900">{learner.progress || 0}%</p>
                        </div>
                        <button
                          onClick={() => handleRemoveLearner(learner.id!, learner.name || 'Learner')}
                          disabled={loading}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          type="button"
                        >
                          <UserMinusIcon className="h-4 w-4 mr-1" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add Learners - Right side (1/3 width) */}
            <div className="lg:col-span-1">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-900">Add Learners to Department</h3>
                
                <div className="mt-4 space-y-4">
                  {/* Assignment Details Form */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4">
                    <h4 className="text-sm font-medium text-indigo-900 mb-3">Assignment Details</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Semester *</label>
                        <select
                          value={assignmentDetails.semester}
                          onChange={(e) => setAssignmentDetails(prev => ({ ...prev, semester: parseInt(e.target.value) }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                            <option key={sem} value={sem}>Semester {sem}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Section *</label>
                        <input
                          type="text"
                          value={assignmentDetails.section}
                          onChange={(e) => setAssignmentDetails(prev => ({ ...prev, section: e.target.value }))}
                          placeholder="e.g., A, B, C"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Course Name *</label>
                        <input
                          type="text"
                          value={assignmentDetails.course_name}
                          onChange={(e) => setAssignmentDetails(prev => ({ ...prev, course_name: e.target.value }))}
                          placeholder="e.g., Bachelor of Computer Applications"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Choose Learners</label>
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        type="text"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                        placeholder="Search by name, email, roll number, or course"
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white">
                      {availablelearners.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">No unassigned learners available</div>
                      ) : filteredAvailable.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">No learners match your search</div>
                      ) : (
                        filteredAvailable.map((learner) => (
                          <label
                            key={learner.id}
                            className="flex items-start gap-3 border-b border-gray-100 px-3 py-2 last:border-none hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedlearners.includes(learner.id!)}
                              onChange={() => togglelearnerSelection(learner.id!)}
                              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900">
                                  {learner.name || 'Unknown Learner'}
                                </p>
                                {learner.roll_number && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                    {learner.roll_number}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{learner.email}</p>
                              {(learner.semester || learner.section || learner.course_name || learner.branch_field) && (
                                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                  {learner.semester && <span>Sem {learner.semester}</span>}
                                  {learner.semester && learner.section && <span>•</span>}
                                  {learner.section && <span>Sec {learner.section}</span>}
                                  {(learner.semester || learner.section) && (learner.course_name || learner.branch_field) && <span>•</span>}
                                  {learner.course_name && <span>{learner.course_name}</span>}
                                  {learner.course_name && learner.branch_field && <span>•</span>}
                                  {learner.branch_field && <span>{learner.branch_field}</span>}
                                </div>
                              )}
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                    {selectedlearners.length > 0 && (
                      <p className="mt-2 text-xs text-gray-500">
                        {selectedlearners.length} learner{selectedlearners.length === 1 ? "" : "s"} selected
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleAddlearners}
                  disabled={loading || selectedlearners.length === 0 || !assignmentDetails.section.trim() || !assignmentDetails.course_name.trim()}
                  className="mt-6 w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  type="button"
                >
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  {loading ? "Adding..." : `Add ${selectedlearners.length || ''} Learner${selectedlearners.length !== 1 ? 's' : ''} to Sem ${assignmentDetails.semester}`}
                </button>
                
                {selectedlearners.length > 0 && (!assignmentDetails.section.trim() || !assignmentDetails.course_name.trim()) && (
                  <p className="mt-2 text-xs text-red-600">
                    Please fill in all assignment details above
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLearnerModal;