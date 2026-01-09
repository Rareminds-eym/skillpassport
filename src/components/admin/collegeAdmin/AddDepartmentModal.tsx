import { useAuth } from '@/context/AuthContext';
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useState } from "react";
import { supabase } from '../../../lib/supabaseClient';
import { departmentService } from '../../../services/college/departmentService';

interface Faculty {
  id: string;
  name: string;
  email: string;
  designation: string;
  specialization: string;
}

interface AddDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  allFaculty?: Faculty[];
  facultyLoading?: boolean;
}

const AddDepartmentModal: React.FC<AddDepartmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  allFaculty = [],
  facultyLoading = false,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [facultySearchTerm, setFacultySearchTerm] = useState("");
  const [showFacultyDropdown, setShowFacultyDropdown] = useState(false);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");
  const [error, setError] = useState<string | null>(null);
  const [codeValidation, setCodeValidation] = useState<{ isValid: boolean; message?: string } | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [collegeId, setCollegeId] = useState<string | null>(null);

  // Filter faculty based on search term
  const filteredFaculty = allFaculty.filter(faculty =>
    faculty.name.toLowerCase().includes(facultySearchTerm.toLowerCase()) ||
    faculty.email.toLowerCase().includes(facultySearchTerm.toLowerCase()) ||
    faculty.designation.toLowerCase().includes(facultySearchTerm.toLowerCase())
  );

  // Get college ID when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      const fetchCollegeId = async () => {
        const { data, error } = await supabase
          .from('organizations')
          .select('id')
          .eq('organization_type', 'college')
          .or(`admin_id.eq.${user.id},email.eq.${user.email}`)
          .maybeSingle();
        
        if (!error && data) {
          setCollegeId(data.id);
        }
      };
      
      fetchCollegeId();
    }
  }, [isOpen, user]);

  // Validate department code with debouncing
  useEffect(() => {
    if (!code.trim() || !collegeId) {
      setCodeValidation(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsValidatingCode(true);
      try {
        const validation = await departmentService.validateDepartmentCode(collegeId, code.trim());
        setCodeValidation(validation);
      } catch (error) {
        console.error('Error validating code:', error);
        setCodeValidation({ isValid: false, message: 'Error validating code. Please try again.' });
      } finally {
        setIsValidatingCode(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [code, collegeId]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setName("");
      setCode("");
      setSelectedFaculty(null);
      setFacultySearchTerm("");
      setShowFacultyDropdown(false);
      setDescription("");
      setStatus("Active");
      setError(null);
      setCodeValidation(null);
      setIsValidatingCode(false);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.faculty-dropdown-container')) {
        setShowFacultyDropdown(false);
      }
    };

    if (showFacultyDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showFacultyDropdown]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim() || !code.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    // Check code validation
    if (codeValidation && !codeValidation.isValid) {
      setError(codeValidation.message || "Department code is not valid");
      return;
    }

    // Don't submit if still validating
    if (isValidatingCode) {
      setError("Please wait while we validate the department code");
      return;
    }

    setError(null);
    onSubmit({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      // Convert UI status (capitalized) to database format (lowercase)
      status: status.toLowerCase(),
      metadata: {
        hod: selectedFaculty?.name || '',
        hod_id: selectedFaculty?.id || '',
        email: selectedFaculty?.email || '',
      }
    });
  };

  const handleFacultySelect = (faculty: Faculty) => {
    setSelectedFaculty(faculty);
    setFacultySearchTerm(faculty.name);
    setShowFacultyDropdown(false);
  };

  const handleFacultyInputChange = (value: string) => {
    setFacultySearchTerm(value);
    setShowFacultyDropdown(true);
    
    // Clear selected faculty if input doesn't match
    if (selectedFaculty && !selectedFaculty.name.toLowerCase().includes(value.toLowerCase())) {
      setSelectedFaculty(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center px-4 py-8 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900/50 transition-opacity" onClick={onClose} />
        <div className="inline-block w-full max-w-2xl transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-middle shadow-xl transition-all sm:my-8 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Add New Department
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Enter department details to add it to your institution.
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

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Department Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Computer Science & Engineering"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Department Code *
              </label>
              <div className="relative">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  type="text"
                  className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    codeValidation === null 
                      ? 'border-gray-300 focus:ring-indigo-500'
                      : codeValidation.isValid
                      ? 'border-green-300 focus:ring-green-500'
                      : 'border-red-300 focus:ring-red-500'
                  }`}
                  placeholder="CSE"
                  maxLength={10}
                />
                {isValidatingCode && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  </div>
                )}
              </div>
              {codeValidation && !codeValidation.isValid && (
                <p className="mt-1 text-xs text-red-600">{codeValidation.message}</p>
              )}
              {codeValidation && codeValidation.isValid && (
                <p className="mt-1 text-xs text-green-600">✓ Department code is available</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Head of Department
              </label>
              <div className="relative faculty-dropdown-container">
                <input
                  value={facultySearchTerm}
                  onChange={(e) => handleFacultyInputChange(e.target.value)}
                  onFocus={() => setShowFacultyDropdown(true)}
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={facultyLoading ? "Loading faculty..." : "Search and select faculty..."}
                  disabled={facultyLoading}
                />
                <ChevronDownIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                
                {/* Dropdown */}
                {showFacultyDropdown && !facultyLoading && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredFaculty.length > 0 ? (
                      filteredFaculty.map((faculty) => (
                        <button
                          key={faculty.id}
                          onClick={() => handleFacultySelect(faculty)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                          type="button"
                        >
                          <div className="text-sm font-medium text-gray-900">{faculty.name}</div>
                          <div className="text-xs text-gray-500">{faculty.designation} • {faculty.email}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        {facultySearchTerm ? 'No faculty found' : 'Start typing to search faculty'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Email
              </label>
              <input
                value={selectedFaculty?.email || ''}
                type="email"
                readOnly
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                placeholder="Email will be auto-filled when HOD is selected"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Brief description of the department..."
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              disabled={isSubmitting}
              type="button"
            >
              {isSubmitting ? "Adding..." : "Add Department"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDepartmentModal;