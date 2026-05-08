import React, { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('LearnerSelectionModal');

interface Learner {
    id: string;
    name: string;
    email: string;
    university: string;
    branch_field: string;
    college_school_name: string;
    registration_number: string;
    approval_status: string;
}

interface LearnerSelectionModalProps {
    assignmentId: string;
    isOpen: boolean;
    onClose: () => void;
    onAssign: (learnerIds: string[]) => Promise<void>;
    schoolId?: string;
    classIds?: string[];
}

const LearnerSelectionModal: React.FC<LearnerSelectionModalProps> = ({
    assignmentId,
    isOpen,
    onClose,
    onAssign,
    schoolId,
    classIds = []
}) => {
    const [learners, setlearners] = useState<Learner[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [initiallyAssignedIds, setInitiallyAssignedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [classNames, setClassNames] = useState<string[]>([]);
    const [filters, setFilters] = useState({
        department: 'all',
        year: 'all',
        search: ''
    });

    // Fetch class names if classIds are provided
    useEffect(() => {
        if (isOpen && classIds && classIds.length > 0) {
            fetchClassNames();
        }
    }, [isOpen, classIds]);

    const fetchClassNames = async () => {
        if (!classIds || classIds.length === 0) return;
        
        try {
            const { data, error } = await supabase
                .from('school_classes')
                .select('name, grade, section')
                .in('id', classIds);

            if (!error && data) {
                const names = data.map(cls => cls.name || `Grade ${cls.grade} - ${cls.section || 'General'}`);
                setClassNames(names);
            }
        } catch (error) {
            logger.error('Failed to fetch class names', error as Error);
        }
    };

    // Fetch already assigned learners when modal opens
    useEffect(() => {
        if (isOpen && assignmentId) {
            fetchAssignedlearners();
        }
    }, [isOpen, assignmentId]);

    // Fetch learners based on filters
    useEffect(() => {
        if (isOpen) {
            fetchlearners();
        }
    }, [isOpen, filters, schoolId, classIds]);

    // Fetch learners already assigned to this assignment
    const fetchAssignedlearners = async () => {
        try {
            const { data: assignedlearners, error } = await supabase
                .from('learner_assignments')
                .select('learner_id')
                .eq('assignment_id', assignmentId)
                .eq('is_deleted', false);

            if (error) {
                logger.error('Failed to fetch assigned learners', error as Error);
                return;
            }

            // Pre-select already assigned learners
            const assignedIds = (assignedlearners || []).map(sa => sa.learner_id);
            setSelectedIds(assignedIds);
            setInitiallyAssignedIds(assignedIds);
        } catch (error) {
            logger.error('Failed to fetch assigned learners', error as Error);
        }
    };

const fetchlearners = async () => {
    try {
        setLoading(true);
        
        let query = supabase
            .from('learners')
            .select('*')
            .eq('is_deleted', false);

        // Filter by classes if classIds are provided (priority filter)
        if (classIds && classIds.length > 0) {
            query = query.in('school_class_id', classIds);
        } else if (schoolId) {
            // Filter by school if schoolId is provided and no classIds
            query = query.eq('school_id', schoolId);
        }

        // Apply filters
        if (filters.department !== 'all') {
            query = query.eq('branch_field', filters.department);
        }
        if (filters.year !== 'all') {
            // Year filtering might need adjustment based on your schema
            query = query.eq('grade', filters.year);
        }
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            query = query.or(
                `name.ilike.%${searchTerm}%,` +
                `email.ilike.%${searchTerm}%,` +
                `learner_id.ilike.%${searchTerm}%,` +
                `registration_number.ilike.%${searchTerm}%`
            );
        }

        const { data, error } = await query;

        if (error) {
            logger.error('Supabase query error', error as Error);
            throw error;
        }

        // Transform data
        const transformedlearners = (data || []).map(learner => {
            return {
                id: learner.id || learner.user_id,
                user_id: learner.user_id,
                learner_id: learner.learner_id,
                name: learner.name || 'Unknown',
                email: learner.email || '',
                university: learner.university || learner.university_main || '',
                branch_field: learner.branch_field || '',
                college_school_name: learner.college_school_name || '',
                registration_number: learner.registration_number || learner.learner_id || '',
                approval_status: learner.approval_status || 'pending',
                contact_number: learner.contact_number || learner.contactNumber || '',
                city: learner.city || '',
                gender: learner.gender || '',
                age: learner.age || null,
                bio: learner.bio || ''
            };
        });
        
        setlearners(transformedlearners);
    } catch (error) {
        logger.error('Failed to fetch learners', error as Error);
        alert('Failed to load learners');
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
            // Get learners from school to extract unique departments and years from profile JSONB
            let query = supabase
                .from('learners')
                .select('profile')
                .eq('is_deleted', false);
            
            if (schoolId) {
                query = query.eq('school_id', schoolId);
            }
            
            const { data: learnersData } = await query;
            
            const depts = learnersData?.map(s => s.profile?.department).filter(Boolean) || [];
            const uniqueDepts = [...new Set(depts)];
            setDepartments(uniqueDepts as string[]);

            const years = learnersData?.map(s => s.profile?.yearOfPassing).filter(Boolean) || [];
            const uniqueYears = [...new Set(years)];
            setYears(uniqueYears as string[]);

        } catch (error) {
            logger.error('Failed to fetch filter data', error as Error);
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.length === learners.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(learners.map(s => s.id));
        }
    };

    const handleToggleLearner = (learnerId: string) => {
        if (selectedIds.includes(learnerId)) {
            setSelectedIds(selectedIds.filter(id => id !== learnerId));
        } else {
            setSelectedIds([...selectedIds, learnerId]);
        }
    };

    const handleAssign = async () => {
        if (selectedIds.length === 0) {
            alert('Please select at least one learner');
            return;
        }

        try {
            setAssigning(true);
            await onAssign(selectedIds);
            onClose();
            setSelectedIds([]);
        } catch (error) {
            logger.error('Failed to assign learners', error as Error);
            alert('Failed to assign learners');
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
                            <h2 className="text-xl font-bold text-gray-900">Assign to Learners</h2>
                            <p className="text-sm text-gray-600">
                                {classIds && classIds.length > 0 && classNames.length > 0 ? (
                                    <>
                                        Select learners from <span className="font-semibold text-emerald-600">
                                            {classNames.length === 1 
                                                ? classNames[0] 
                                                : `${classNames.length} classes (${classNames.join(', ')})`}
                                        </span>
                                    </>
                                ) : (
                                    'Select learners to assign this assignment'
                                )}
                                {initiallyAssignedIds.length > 0 && (
                                    <span className="ml-2 text-emerald-600 font-medium">
                                        • {initiallyAssignedIds.length} already assigned
                                    </span>
                                )}
                            </p>
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
                                checked={learners.length > 0 && selectedIds.length === learners.length}
                                onChange={handleSelectAll}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Select All</span>
                        </label>
                        <span className="text-sm text-gray-600">
                            ({learners.length} learners found)
                        </span>
                    </div>
                    <div className="text-sm font-medium text-emerald-600">
                        {selectedIds.length} selected
                    </div>
                </div>

                {/* Learner List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                                <p className="mt-2 text-gray-600">Loading learners...</p>
                            </div>
                        </div>
                    ) : learners.length === 0 ? (
                        <div className="text-center py-12">
                            <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No learners found</h3>
                            <p className="text-gray-600">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {learners.map(learner => {
                                const isAlreadyAssigned = initiallyAssignedIds.includes(learner.id);
                                return (
                                    <label
                                        key={learner.id}
                                        className={`flex items-center p-4 bg-white border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                                            isAlreadyAssigned 
                                                ? 'border-emerald-300 bg-emerald-50/30' 
                                                : 'border-gray-200'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(learner.id)}
                                            onChange={() => handleToggleLearner(learner.id)}
                                            className="rounded text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <div className="ml-4 flex-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-gray-900">{learner.name}</p>
                                                    {isAlreadyAssigned && (
                                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full border border-emerald-300">
                                                            Already Assigned
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-500">{learner.id.substring(0, 8)}</span>
                                            </div>
                                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                                            <p className="text-sm text-gray-600">{learner.email}</p>
                                            {learner.registration_number && (
                                                <>
                                                    <span className="text-gray-400">•</span>
                                                    <p className="text-sm text-gray-600">{learner.registration_number}</p>
                                                </>
                                            )}
                                            {learner.branch_field && (
                                                <>
                                                    <span className="text-gray-400">•</span>
                                                    <p className="text-sm text-gray-600">{learner.branch_field}</p>
                                                </>
                                            )}
                                            {learner.university && (
                                                <>
                                                    <span className="text-gray-400">•</span>
                                                    <p className="text-sm text-gray-600 truncate max-w-[200px]">{learner.university}</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </label>
                                );
                            })}
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
                            <span>Assign to {selectedIds.length} {selectedIds.length === 1 ? 'Learner' : 'Learners'}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LearnerSelectionModal;

