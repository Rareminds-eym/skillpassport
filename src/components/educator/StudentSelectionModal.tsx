import React, { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabaseClient';

interface Student {
    id: string;
    name: string;
    email: string;
    university: string;
    branch_field: string;
    college_school_name: string;
    registration_number: string;
    approval_status: string;
}

interface StudentSelectionModalProps {
    assignmentId: string;
    isOpen: boolean;
    onClose: () => void;
    onAssign: (studentIds: string[]) => Promise<void>;
}

const StudentSelectionModal: React.FC<StudentSelectionModalProps> = ({
    assignmentId,
    isOpen,
    onClose,
    onAssign
}) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [filters, setFilters] = useState({
        department: 'all',
        year: 'all',
        search: ''
    });

    // Fetch students based on filters
    useEffect(() => {
        if (isOpen) {
            fetchStudents();
        }
    }, [isOpen, filters]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            
            let query = supabase
                .from('students')
                .select('id, profile');

            // Apply filters using JSONB operators
            if (filters.department !== 'all') {
                query = query.eq('profile->>department', filters.department);
            }
            if (filters.year !== 'all') {
                query = query.eq('profile->>yearOfPassing', filters.year);
            }
            if (filters.search) {
                query = query.or(
                    `profile->>name.ilike.%${filters.search}%,` +
                    `profile->>email.ilike.%${filters.search}%,` +
                    `profile->>passportId.ilike.%${filters.search}%`
                );
            }

            const { data, error } = await query;

            if (error) {
                console.error('Supabase query error:', error);
                throw error;
            }

            console.log('Fetched students data:', data);
            
            // Transform data to extract from profile JSONB
            const transformedStudents = (data || []).map(student => {
                const profile = student.profile || {};
                return {
                    id: student.id,
                    name: profile.name || 'Unknown',
                    email: profile.email || '',
                    university: profile.university || '',
                    branch_field: profile.department || '',
                    college_school_name: profile.collegeName || profile.college_school_name || '',
                    registration_number: profile.passportId || profile.registrationNumber || '',
                    approval_status: profile.verified ? 'verified' : 'pending'
                };
            });
            
            setStudents(transformedStudents);
        } catch (error) {
            console.error('Error fetching students:', error);
            alert('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    // Get unique departments and years for filters
    const [departments, setDepartments] = useState<string[]>([]);
    const [years, setYears] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchFiltersData();
        }
    }, [isOpen]);

    const fetchFiltersData = async () => {
        try {
            // Get all students to extract unique departments and years from profile JSONB
            const { data: studentsData } = await supabase
                .from('students')
                .select('profile');
            
            const depts = studentsData?.map(s => s.profile?.department).filter(Boolean) || [];
            const uniqueDepts = [...new Set(depts)];
            setDepartments(uniqueDepts as string[]);

            const years = studentsData?.map(s => s.profile?.yearOfPassing).filter(Boolean) || [];
            const uniqueYears = [...new Set(years)];
            setYears(uniqueYears as string[]);
            
            console.log('Available departments:', uniqueDepts);
            console.log('Available years:', uniqueYears);
        } catch (error) {
            console.error('Error fetching filter data:', error);
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.length === students.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(students.map(s => s.id));
        }
    };

    const handleToggleStudent = (studentId: string) => {
        if (selectedIds.includes(studentId)) {
            setSelectedIds(selectedIds.filter(id => id !== studentId));
        } else {
            setSelectedIds([...selectedIds, studentId]);
        }
    };

    const handleAssign = async () => {
        if (selectedIds.length === 0) {
            alert('Please select at least one student');
            return;
        }

        try {
            setAssigning(true);
            await onAssign(selectedIds);
            onClose();
            setSelectedIds([]);
        } catch (error) {
            console.error('Error assigning students:', error);
            alert('Failed to assign students');
        } finally {
            setAssigning(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <UserGroupIcon className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Assign to Students</h2>
                            <p className="text-sm text-gray-600">Select students to assign this assignment</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <XMarkIcon className="h-6 w-6 text-gray-400" />
                    </button>
                </div>

                {/* Filters */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>

                        <select
                            value={filters.department}
                            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="all">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>

                        <select
                            value={filters.year}
                            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="all">All Universities</option>
                            {years.map(univ => (
                                <option key={univ} value={univ}>{univ}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Selection Info & Select All */}
                <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={students.length > 0 && selectedIds.length === students.length}
                                onChange={handleSelectAll}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Select All</span>
                        </label>
                        <span className="text-sm text-gray-600">
                            ({students.length} students found)
                        </span>
                    </div>
                    <div className="text-sm font-medium text-emerald-600">
                        {selectedIds.length} selected
                    </div>
                </div>

                {/* Student List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                                <p className="mt-2 text-gray-600">Loading students...</p>
                            </div>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="text-center py-12">
                            <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                            <p className="text-gray-600">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {students.map(student => (
                                <label
                                    key={student.id}
                                    className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(student.id)}
                                        onChange={() => handleToggleStudent(student.id)}
                                        className="rounded text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <div className="ml-4 flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-gray-900">{student.name}</p>
                                            <span className="text-xs text-gray-500">{student.id.substring(0, 8)}</span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                                            <p className="text-sm text-gray-600">{student.email}</p>
                                            {student.registration_number && (
                                                <>
                                                    <span className="text-gray-400">•</span>
                                                    <p className="text-sm text-gray-600">{student.registration_number}</p>
                                                </>
                                            )}
                                            {student.branch_field && (
                                                <>
                                                    <span className="text-gray-400">•</span>
                                                    <p className="text-sm text-gray-600">{student.branch_field}</p>
                                                </>
                                            )}
                                            {student.university && (
                                                <>
                                                    <span className="text-gray-400">•</span>
                                                    <p className="text-sm text-gray-600 truncate max-w-[200px]">{student.university}</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={selectedIds.length === 0 || assigning}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                    >
                        {assigning ? (
                            <>
                                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Assigning...</span>
                            </>
                        ) : (
                            <span>Assign to {selectedIds.length} {selectedIds.length === 1 ? 'Student' : 'Students'}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentSelectionModal;

