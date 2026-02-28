/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import {
    PlusCircleIcon,
    XMarkIcon,
    BookOpenIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    InformationCircleIcon,
    AcademicCapIcon,
    CheckIcon,
    XCircleIcon,
    PencilIcon,
    LockClosedIcon,
    LockOpenIcon,
    ExclamationTriangleIcon,
    UserGroupIcon,
    ClipboardDocumentListIcon,
    ChevronDownIcon,
} from "@heroicons/react/24/outline";
import toast from 'react-hot-toast';
import SearchBar from "../../../components/common/SearchBar";
import KPICard from "../../../components/admin/KPICard";
import Pagination from "../../../components/admin/Pagination";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import {
    getDepartments,
    getPrograms,
    getCourses,
    getFaculty,
    getCourseMappings,
    mapCourse,
    updateCourseMapping,
    deleteCourseMapping,
    lockSemester,
    unlockSemester,
    isSemesterLocked,
    cloneSemesterStructure,
    type Department,
    type Program,
    type Course,
    type Faculty,
    type CourseMapping,
} from "../../../services/college/courseMappingService";

interface CourseMappingFormData {
    courseId?: string;
    courseCode: string;
    courseName: string;
    credits: number;
    offeringType: 'core' | 'dept_elective' | 'open_elective';
    facultyId?: string;
    capacity?: number;
}

interface ElectiveSetupData {
    mappingId: string;
    facultyId?: string;
    capacity?: number | "";
}



/* ==============================
   MODAL WRAPPER
   ============================== */
const ModalWrapper = ({
    title,
    subtitle,
    children,
    isOpen,
    onClose,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                    aria-hidden="true"
                />

                {/* Modal */}
                <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                            {subtitle && (
                                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="ml-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            aria-label="Close"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="p-6">{children}</div>
                </div>
            </div>
        </div>
    );
};

/* ==============================
   ADD/EDIT COURSE MAPPING MODAL
   ============================== */
const AddEditCourseMappingModal = ({
    isOpen,
    onClose,
    onSave,
    availableCourses,
    faculties,
    editingMapping,
    semester,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CourseMappingFormData) => Promise<void>;
    availableCourses: Course[];
    faculties: Faculty[];
    editingMapping?: CourseMapping | null;
    semester: number;
}) => {
    const isEditing = !!editingMapping;
    const [selectedCourseId, setSelectedCourseId] = useState<string>(editingMapping?.course_id || "");
    const [courseCode, setCourseCode] = useState(editingMapping?.course_code || "");
    const [courseName, setCourseName] = useState(editingMapping?.course_name || "");
    const [credits, setCredits] = useState<number | "">(editingMapping?.credits || "");
    const [offeringType, setOfferingType] = useState<'core' | 'dept_elective' | 'open_elective'>(
        editingMapping?.type || 'core'
    );
    const [facultyId, setFacultyId] = useState<string>(editingMapping?.faculty_id || "");
    const [capacity, setCapacity] = useState<number | "">(editingMapping?.capacity || "");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [isNewCourse, setIsNewCourse] = useState(false);

    // Update form when editingMapping changes
    useEffect(() => {
        if (editingMapping) {
            setSelectedCourseId(editingMapping.course_id || "");
            setCourseCode(editingMapping.course_code || "");
            setCourseName(editingMapping.course_name || "");
            setCredits(editingMapping.credits || "");
            setOfferingType(editingMapping.type || editingMapping.offering_type || 'core');
            setFacultyId(editingMapping.faculty_id || "");
            setCapacity(editingMapping.capacity || "");
            setIsNewCourse(false);
        } else {
            resetForm();
        }
    }, [editingMapping]);

    // Handle course selection
    const handleCourseSelect = (courseId: string) => {
        if (courseId === "new") {
            setIsNewCourse(true);
            setSelectedCourseId("");
            setCourseCode("");
            setCourseName("");
            setCredits("");
        } else if (courseId === "") {
            // No course selected
            setIsNewCourse(false);
            setSelectedCourseId("");
            setCourseCode("");
            setCourseName("");
            setCredits("");
        } else {
            const course = availableCourses.find(c => c.id === courseId);
            if (course) {
                setIsNewCourse(false);
                setSelectedCourseId(courseId);
                setCourseCode(course.course_code);
                setCourseName(course.course_name);
                setCredits(course.credits);
            }
        }
    };

    const resetForm = () => {
        setSelectedCourseId("");
        setCourseCode("");
        setCourseName("");
        setCredits("");
        setOfferingType('core');
        setFacultyId("");
        setCapacity("");
        setError(null);
        setIsNewCourse(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const validateForm = () => {
        if (!courseCode.trim()) return "Course code is required";
        if (!courseName.trim()) return "Course name is required";
        if (credits === "" || Number(credits) <= 0) return "Valid credits are required";
        if (!facultyId) return "Faculty allocation is required";
        if ((offeringType === 'dept_elective' || offeringType === 'open_elective') && (capacity === "" || Number(capacity) <= 0)) {
            return "Capacity is required for elective courses";
        }

        // Check faculty workload
        const selectedFaculty = faculties.find(f => f.id === facultyId);
        if (selectedFaculty) {
            const additionalCredits = Number(credits);
            // In edit mode, subtract the current mapping's credits from faculty's current workload
            const currentMappingCredits = isEditing ? (editingMapping?.credits || 0) : 0;
            const netIncrease = additionalCredits - currentMappingCredits;
            
            if ((selectedFaculty.currentWorkload + netIncrease) > selectedFaculty.maxWorkload) {
                const availableCredits = selectedFaculty.maxWorkload - selectedFaculty.currentWorkload + currentMappingCredits;
                return `Faculty workload limit exceeded. Available: ${availableCredits} credits`;
            }
        }

        return null;
    };

    const handleSubmit = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);
        setSubmitting(true);

        try {
            await onSave({
                courseId: isNewCourse ? undefined : selectedCourseId,
                courseCode: courseCode.trim().toUpperCase(),
                courseName: courseName.trim(),
                credits: Number(credits),
                offeringType,
                facultyId,
                capacity: (offeringType === 'dept_elective' || offeringType === 'open_elective') ? Number(capacity) : undefined,
            });
            
            handleClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save course mapping');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={handleClose}
            title={isEditing ? "Edit Course Mapping" : "Add Course Mapping"}
            subtitle={`${isEditing ? 'Update' : 'Add'} course mapping for Semester ${semester}`}
        >
            {error && (
                <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                    <XCircleIcon className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                </div>
            )}

            {isEditing && (
                <div className="mb-5 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <InformationCircleIcon className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800">
                            Editing Mode: You can change the offering type, faculty allocation, and capacity. Course details cannot be modified.
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-5">
                {/* Course Selection */}
                {!isEditing && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Course <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={isNewCourse ? "new" : selectedCourseId}
                            onChange={(e) => handleCourseSelect(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                        >
                            <option value="">Select existing course</option>
                            {availableCourses.map((course) => (
                                <option key={course.id} value={course.id}>
                                    {course.course_code} - {course.course_name} ({course.credits} credits)
                                </option>
                            ))}
                            <option value="new">+ Create New Course</option>
                        </select>
                        
                        {/* Info message based on selection */}
                        {!selectedCourseId && !isNewCourse && (
                            <div className="mt-2 flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                <InformationCircleIcon className="h-4 w-4 flex-shrink-0 text-gray-600 mt-0.5" />
                                <p className="text-xs text-gray-600">
                                    Please select an existing course or choose "Create New Course" to continue.
                                </p>
                            </div>
                        )}
                        
                        {selectedCourseId && !isNewCourse && (
                            <div className="mt-2 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                                <InformationCircleIcon className="h-4 w-4 flex-shrink-0 text-blue-600 mt-0.5" />
                                <p className="text-xs text-blue-700">
                                    Using existing course. Course details are read-only and will be populated automatically.
                                </p>
                            </div>
                        )}
                        
                        {isNewCourse && (
                            <div className="mt-2 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
                                <InformationCircleIcon className="h-4 w-4 flex-shrink-0 text-green-600 mt-0.5" />
                                <p className="text-xs text-green-700">
                                    Creating new course. Fill in the course details below.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Course Details */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Course Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={courseCode}
                            onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                            disabled={isEditing || (!isNewCourse && !selectedCourseId)} // Disable if editing OR no course selected (including default option)
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="e.g., CS101"
                            maxLength={10}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Credits <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={credits}
                            onChange={(e) => setCredits(e.target.value === "" ? "" : Number(e.target.value))}
                            disabled={isEditing || (!isNewCourse && !selectedCourseId)} // Disable if editing OR no course selected (including default option)
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="4"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Course Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={courseName}
                            onChange={(e) => setCourseName(e.target.value)}
                            disabled={isEditing || (!isNewCourse && !selectedCourseId)} // Disable if editing OR no course selected (including default option)
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="Introduction to Programming"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Offering Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={offeringType}
                            onChange={(e) => setOfferingType(e.target.value as 'core' | 'dept_elective' | 'open_elective')}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                        >
                            <option value="core">Core</option>
                            <option value="dept_elective">Department Elective</option>
                            <option value="open_elective">Open Elective</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Faculty Allocation <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={facultyId}
                            onChange={(e) => setFacultyId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                        >
                            <option value="">Select faculty</option>
                            {faculties.map((faculty) => (
                                <option key={faculty.id} value={faculty.id}>
                                    {faculty.name} ({faculty.maxWorkload - faculty.currentWorkload} credits available)
                                </option>
                            ))}
                        </select>
                    </div>

                    {(offeringType === 'dept_elective' || offeringType === 'open_elective') && (
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Student Capacity <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="200"
                                value={capacity}
                                onChange={(e) => setCapacity(e.target.value === "" ? "" : Number(e.target.value))}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                                placeholder="60"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
                <button
                    onClick={handleClose}
                    disabled={submitting}
                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
                >
                    {submitting ? (
                        <>
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            {isEditing ? 'Updating...' : 'Adding...'}
                        </>
                    ) : (
                        <>
                            <CheckIcon className="h-4 w-4" />
                            {isEditing ? 'Update Mapping' : 'Add Mapping'}
                        </>
                    )}
                </button>
            </div>
        </ModalWrapper>
    );
};

/* ==============================
   COURSE MAPPING CARD COMPONENT
   ============================== */
const CourseMappingCard = ({
    mapping,
    onEdit,
    onDelete,
    faculties,
    isLocked,
}: {
    mapping: CourseMapping;
    onEdit: (mapping: CourseMapping) => void;
    onDelete: (mappingId: string) => void;
    faculties: Faculty[];
    isLocked: boolean;
}) => {
    const faculty = faculties.find(f => f.id === mapping.faculty_id);
    
    const getTypeColor = (type: string) => {
        switch (type) {
            case 'core': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'dept_elective': return 'bg-green-100 text-green-800 border-green-200';
            case 'open_elective': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'core': return 'Core';
            case 'dept_elective': return 'Dept Elective';
            case 'open_elective': return 'Open Elective';
            default: return type;
        }
    };

    return (
        <div className="group relative rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm transition-all duration-200">
            {/* Action Buttons */}
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onEdit(mapping)}
                    disabled={isLocked}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Edit mapping"
                >
                    <PencilIcon className="h-4 w-4" />
                </button>
                <button
                    onClick={() => onDelete(mapping.id)}
                    disabled={isLocked}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove mapping"
                >
                    <XMarkIcon className="h-4 w-4" />
                </button>
            </div>

            {/* Course Info */}
            <div className="pr-16">
                <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
                        {mapping.course_code}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getTypeColor(mapping.type || 'core')}`}>
                        {getTypeLabel(mapping.type || 'core')}
                    </span>
                </div>
                
                <h4 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                    {mapping.course_name}
                </h4>
                
                <div className="space-y-1">
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="inline-flex items-center gap-1">
                            <AcademicCapIcon className="h-4 w-4" />
                            {mapping.credits} Credits
                        </span>
                        {mapping.capacity && (
                            <span className="inline-flex items-center gap-1">
                                <UserGroupIcon className="h-4 w-4" />
                                {mapping.current_enrollment || 0}/{mapping.capacity}
                            </span>
                        )}
                    </div>
                    
                    {faculty && (
                        <div className="text-xs text-gray-500">
                            Faculty: {faculty.name}
                        </div>
                    )}
                    
                    {!faculty && mapping.faculty_id && (
                        <div className="text-xs text-amber-600 flex items-center gap-1">
                            <ExclamationTriangleIcon className="h-3 w-3" />
                            Faculty not found
                        </div>
                    )}
                </div>
            </div>

            {/* Lock Indicator */}
            {isLocked && (
                <div className="absolute bottom-2 right-2">
                    <LockClosedIcon className="h-4 w-4 text-gray-400" />
                </div>
            )}
        </div>
    );
};



/* ==============================
   CLONE SEMESTER MODAL
   ============================== */
const CloneSemesterModal = ({
    isOpen,
    onClose,
    onClone,
    programs,
    selectedProgramId,
}: {
    isOpen: boolean;
    onClose: () => void;
    onClone: (fromProgramId: string, fromSemester: number, toProgramId: string, toSemester: number) => Promise<void>;
    programs: Program[];
    selectedProgramId: string;
}) => {
    const [fromProgramId, setFromProgramId] = useState<string>(selectedProgramId || "");
    const [fromSemester, setFromSemester] = useState<number | "">("");
    const [toProgramId, setToProgramId] = useState<string>(selectedProgramId || "");
    const [toSemester, setToSemester] = useState<number | "">("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (fromProgramId && fromSemester !== "" && toProgramId && toSemester !== "") {
            if (fromProgramId === toProgramId && fromSemester === toSemester) {
                setError("Source and destination cannot be the same");
                return;
            }

            setSubmitting(true);
            setError(null);

            try {
                await onClone(fromProgramId, Number(fromSemester), toProgramId, Number(toSemester));
                setFromSemester("");
                setToSemester("");
                onClose();
            } catch (err: any) {
                setError(err.message || 'Failed to clone semester structure');
            } finally {
                setSubmitting(false);
            }
        }
    };

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            title="Clone Semester Structure"
            subtitle="Copy all course mappings from one semester to another"
        >
            {error && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                    <XCircleIcon className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            From Program
                        </label>
                        <select
                            value={fromProgramId}
                            onChange={(e) => setFromProgramId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                        >
                            <option value="">Select program</option>
                            {programs.map((program) => (
                                <option key={program.id} value={program.id}>
                                    {program.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            From Semester
                        </label>
                        <select
                            value={fromSemester as any}
                            onChange={(e) => setFromSemester(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                        >
                            <option value="">Select semester</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                <option key={s} value={s}>Semester {s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            To Program
                        </label>
                        <select
                            value={toProgramId}
                            onChange={(e) => setToProgramId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                        >
                            <option value="">Select program</option>
                            {programs.map((program) => (
                                <option key={program.id} value={program.id}>
                                    {program.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            To Semester
                        </label>
                        <select
                            value={toSemester as any}
                            onChange={(e) => setToSemester(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                        >
                            <option value="">Select semester</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                <option key={s} value={s}>Semester {s}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
                <button
                    onClick={onClose}
                    disabled={submitting}
                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={submitting || fromSemester === "" || toSemester === "" || !fromProgramId || !toProgramId}
                    className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
                >
                    {submitting ? (
                        <>
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            Cloning...
                        </>
                    ) : (
                        <>
                            <ArrowPathIcon className="h-4 w-4" />
                            Clone Structure
                        </>
                    )}
                </button>
            </div>
        </ModalWrapper>
    );
};

/* ==============================
   ELECTIVE MANAGEMENT MODAL
   ============================== */
const ElectiveManagementModal = ({
    isOpen,
    onClose,
    mappings,
    faculties,
    onUpdateMapping,
}: {
    isOpen: boolean;
    onClose: () => void;
    mappings: CourseMapping[];
    faculties: Faculty[];
    onUpdateMapping: (mappingId: string, updates: Partial<CourseMapping>) => Promise<void>;
}) => {
    const [editingMapping, setEditingMapping] = useState<string | null>(null);
    const [tempData, setTempData] = useState<ElectiveSetupData>({ mappingId: "", facultyId: "", capacity: "" });
    const [submitting, setSubmitting] = useState(false);
    
    const electiveMappings = mappings.filter(m => m.type === 'dept_elective' || m.type === 'open_elective');
    
    const handleEditStart = (mapping: CourseMapping) => {
        setEditingMapping(mapping.id);
        setTempData({
            mappingId: mapping.id,
            facultyId: mapping.faculty_id || "",
            capacity: mapping.capacity || ""
        });
    };
    
    const handleEditSave = async () => {
        if (!tempData.facultyId || tempData.capacity === "" || tempData.capacity === undefined) {
            return;
        }

        setSubmitting(true);
        try {
            await onUpdateMapping(tempData.mappingId, {
                faculty_id: tempData.facultyId,
                capacity: typeof tempData.capacity === "string" && tempData.capacity === "" ? undefined : Number(tempData.capacity)
            });
            setEditingMapping(null);
            setTempData({ mappingId: "", facultyId: "", capacity: "" });
        } catch (error) {
            console.error('Failed to update mapping:', error);
        } finally {
            setSubmitting(false);
        }
    };
    
    const handleEditCancel = () => {
        setEditingMapping(null);
        setTempData({ mappingId: "", facultyId: "", capacity: "" });
    };
    
    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            title="Elective Management"
            subtitle="Manage elective course capacities and faculty assignments"
        >
            <div className="space-y-4 max-h-96 overflow-y-auto">
                {electiveMappings.length === 0 ? (
                    <div className="text-center py-12">
                        <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Elective Courses</h3>
                        <p className="text-sm text-gray-500">
                            Add some department or open elective courses to manage them here.
                        </p>
                    </div>
                ) : (
                    electiveMappings.map(mapping => {
                        const faculty = faculties.find(f => f.id === mapping.faculty_id);
                        const isEditing = editingMapping === mapping.id;
                        
                        return (
                            <div key={mapping.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium text-gray-900">{mapping.course_name}</h4>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                mapping.type === 'dept_elective' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                                            }`}>
                                                {mapping.type === 'dept_elective' ? 'Dept Elective' : 'Open Elective'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">{mapping.course_code} • {mapping.credits} Credits</p>
                                    </div>
                                    
                                    {!isEditing && (
                                        <button
                                            onClick={() => handleEditStart(mapping)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                            title="Edit elective settings"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                
                                {isEditing ? (
                                    <div className="space-y-3 bg-gray-50 rounded-lg p-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Faculty Assignment
                                                </label>
                                                <select
                                                    value={tempData.facultyId}
                                                    onChange={(e) => setTempData(prev => ({ ...prev, facultyId: e.target.value }))}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                                >
                                                    <option value="">Select faculty</option>
                                                    {faculties.map((f) => (
                                                        <option key={f.id} value={f.id}>
                                                            {f.name} ({f.maxWorkload - f.currentWorkload} credits available)
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Student Capacity
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="200"
                                                    value={tempData.capacity}
                                                    onChange={(e) => setTempData(prev => ({ ...prev, capacity: e.target.value === "" ? "" : Number(e.target.value) }))}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                                    placeholder="60"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={handleEditCancel}
                                                disabled={submitting}
                                                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleEditSave}
                                                disabled={submitting || tempData.capacity === "" || tempData.capacity === undefined || !tempData.facultyId}
                                                className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 rounded-lg transition-colors inline-flex items-center gap-1"
                                            >
                                                {submitting ? (
                                                    <>
                                                        <ArrowPathIcon className="h-3 w-3 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    'Save'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Faculty:</span>
                                            <div className="font-medium text-gray-900">{faculty?.name || 'Not assigned'}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Capacity:</span>
                                            <div className="font-medium text-gray-900">
                                                {mapping.capacity ? `${mapping.current_enrollment || 0}/${mapping.capacity}` : 'Not set'}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Status:</span>
                                            <div className={`font-medium ${
                                                mapping.capacity && faculty ? 'text-green-600' : 'text-amber-600'
                                            }`}>
                                                {mapping.capacity && faculty ? 'Ready' : 'Needs Setup'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
            
            {electiveMappings.length > 0 && (
                <div className="mt-6 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">{electiveMappings.length}</span> elective course{electiveMappings.length !== 1 ? 's' : ''} •{' '}
                        <span className="font-medium text-green-600">
                            {electiveMappings.filter(m => m.capacity && m.faculty_id).length}
                        </span> ready •{' '}
                        <span className="font-medium text-amber-600">
                            {electiveMappings.filter(m => !m.capacity || !m.faculty_id).length}
                        </span> need setup
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                        Done
                    </button>
                </div>
            )}
        </ModalWrapper>
    );
};

/* ==============================
   MAIN COMPONENT
   ============================== */
const CourseMapping: React.FC = () => {
    // Dynamic data state
    const [departments, setDepartments] = useState<Department[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const [courseMappings, setCourseMappings] = useState<CourseMapping[]>([]);
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    
    // UI state
    const [selectedDeptId, setSelectedDeptId] = useState<string>("");
    const [selectedProgramId, setSelectedProgramId] = useState<string>("");
    const [selectedSemester, setSelectedSemester] = useState<number>(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<'core' | 'dept_elective' | 'open_elective' | "">("");
    
    // Advanced filters
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [facultyFilter, setFacultyFilter] = useState<string>("");
    const [creditsFilter, setCreditsFilter] = useState<string>("");
    const [sortBy, setSortBy] = useState<'semester' | 'name' | 'code' | 'credits'>('semester');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(12);
    
    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCloneModal, setShowCloneModal] = useState(false);
    const [showElectiveModal, setShowElectiveModal] = useState(false);
    const [editingMapping, setEditingMapping] = useState<CourseMapping | null>(null);
    
    // Confirmation modal state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingMappingId, setDeletingMappingId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    
    // Loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLocked, setIsLocked] = useState(false);

    // Load initial data
    useEffect(() => {
        loadInitialData();
    }, []);

    // Load course mappings when program/semester changes
    useEffect(() => {
        if (selectedProgramId && selectedSemester) {
            loadCourseMappings();
            checkSemesterLock();
        }
    }, [selectedProgramId, selectedSemester]);

    // Load programs when department changes
    useEffect(() => {
        if (selectedDeptId) {
            loadPrograms();
            loadFaculty();
        }
    }, [selectedDeptId]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [deptData, coursesData] = await Promise.all([
                getDepartments(),
                getCourses()
            ]);

            setDepartments(deptData);
            setAvailableCourses(coursesData);

            // Auto-select first department
            if (deptData.length > 0) {
                setSelectedDeptId(deptData[0].id);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load initial data');
        } finally {
            setLoading(false);
        }
    };

    const loadPrograms = async () => {
        try {
            const programData = await getPrograms(selectedDeptId);
            setPrograms(programData);
            
            // Auto-select first program
            if (programData.length > 0) {
                setSelectedProgramId(programData[0].id);
            }
        } catch (err: any) {
            console.error('Failed to load programs:', err);
        }
    };

    const loadFaculty = async () => {
        try {
            const facultyData = await getFaculty(selectedDeptId);
            setFaculties(facultyData);
        } catch (err: any) {
            console.error('Failed to load faculty:', err);
        }
    };

    const loadCourseMappings = async () => {
        try {
            const mappingsData = await getCourseMappings(selectedProgramId, selectedSemester, searchQuery, typeFilter || undefined);
            setCourseMappings(mappingsData);
        } catch (err: any) {
            console.error('Failed to load course mappings:', err);
        }
    };

    const checkSemesterLock = async () => {
        try {
            const locked = await isSemesterLocked(selectedProgramId, selectedSemester);
            setIsLocked(locked);
        } catch (err: any) {
            console.error('Failed to check semester lock:', err);
        }
    };

    const handleSaveCourseMapping = async (data: CourseMappingFormData) => {
        try {
            if (editingMapping) {
                // Update existing mapping - only update the fields that can be changed
                const updates: Partial<CourseMapping> = {
                    faculty_id: data.facultyId,
                    offering_type: data.offeringType,
                };

                // Only add capacity if it's an elective type
                if (data.offeringType === 'dept_elective' || data.offeringType === 'open_elective') {
                    updates.capacity = data.capacity;
                } else {
                    updates.capacity = undefined; // Core courses should have no capacity
                }

                await updateCourseMapping(editingMapping.id, updates);
            } else {
                // Create new mapping
                await mapCourse({
                    course_id: data.courseId,
                    course_code: data.courseCode,
                    course_name: data.courseName,
                    credits: data.credits,
                    program_id: selectedProgramId,
                    semester: selectedSemester,
                    offering_type: data.offeringType,
                    faculty_id: data.facultyId,
                    capacity: data.capacity,
                });
            }

            // Reload data
            await Promise.all([
                loadCourseMappings(),
                loadFaculty(), // Refresh faculty workload
                getCourses().then(setAvailableCourses) // Refresh available courses
            ]);
        } catch (err: any) {
            throw new Error(err.message || 'Failed to save course mapping');
        }
    };

    const handleDeleteMapping = async (mappingId: string) => {
        setDeletingMappingId(mappingId);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteMapping = async () => {
        if (!deletingMappingId) return;

        try {
            setDeleteLoading(true);
            await deleteCourseMapping(deletingMappingId);
            await Promise.all([
                loadCourseMappings(),
                loadFaculty() // Refresh faculty workload
            ]);
            setShowDeleteConfirm(false);
            setDeletingMappingId(null);
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete course mapping');
        } finally {
            setDeleteLoading(false);
        }
    };

    const cancelDeleteMapping = () => {
        setShowDeleteConfirm(false);
        setDeletingMappingId(null);
        setDeleteLoading(false);
    };

    const handleEditMapping = (mapping: CourseMapping) => {
        setEditingMapping(mapping);
        setShowAddModal(true);
    };

    const handleCloneSemester = async (fromProgramId: string, fromSemester: number, toProgramId: string, toSemester: number) => {
        try {
            await cloneSemesterStructure(fromProgramId, fromSemester, toProgramId, toSemester);
            
            // If cloning to current program/semester, reload mappings
            if (toProgramId === selectedProgramId && toSemester === selectedSemester) {
                await loadCourseMappings();
            }
        } catch (err: any) {
            throw new Error(err.message || 'Failed to clone semester structure');
        }
    };

    const handleToggleLock = async () => {
        try {
            if (isLocked) {
                await unlockSemester(selectedProgramId, selectedSemester);
            } else {
                await lockSemester(selectedProgramId, selectedSemester);
            }
            setIsLocked(!isLocked);
        } catch (err: any) {
            toast.error(err.message || 'Failed to toggle semester lock');
        }
    };

    const handleUpdateMapping = async (mappingId: string, updates: Partial<CourseMapping>) => {
        try {
            await updateCourseMapping(mappingId, updates);
            await loadCourseMappings();
        } catch (err: any) {
            throw new Error(err.message || 'Failed to update mapping');
        }
    };

    // Filter and sort mappings based on all criteria
    const filteredMappings = useMemo(() => {
        let filtered = courseMappings;

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(mapping => 
                mapping.course_name?.toLowerCase().includes(query) ||
                mapping.course_code?.toLowerCase().includes(query)
            );
        }

        // Type filter
        if (typeFilter) {
            filtered = filtered.filter(mapping => mapping.type === typeFilter);
        }

        // Faculty filter
        if (facultyFilter) {
            filtered = filtered.filter(mapping => mapping.faculty_id === facultyFilter);
        }

        // Credits filter
        if (creditsFilter) {
            filtered = filtered.filter(mapping => mapping.credits === Number(creditsFilter));
        }

        // Sort
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;
            
            switch (sortBy) {
                case 'name':
                    aValue = a.course_name || '';
                    bValue = b.course_name || '';
                    break;
                case 'code':
                    aValue = a.course_code || '';
                    bValue = b.course_code || '';
                    break;
                case 'credits':
                    aValue = a.credits || 0;
                    bValue = b.credits || 0;
                    break;
                case 'semester':
                default:
                    aValue = selectedSemester;
                    bValue = selectedSemester;
                    // For semester, sort by course code as secondary
                    if (aValue === bValue) {
                        aValue = a.course_code || '';
                        bValue = b.course_code || '';
                    }
                    break;
            }

            if (typeof aValue === 'string') {
                const comparison = aValue.localeCompare(bValue);
                return sortOrder === 'asc' ? comparison : -comparison;
            } else {
                const comparison = aValue - bValue;
                return sortOrder === 'asc' ? comparison : -comparison;
            }
        });

        return filtered;
    }, [courseMappings, searchQuery, typeFilter, facultyFilter, creditsFilter, sortBy, sortOrder, selectedSemester]);

    // Pagination
    const totalPages = Math.ceil(filteredMappings.length / itemsPerPage);
    const paginatedMappings = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredMappings.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredMappings, currentPage, itemsPerPage]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, typeFilter, facultyFilter, creditsFilter, sortBy, sortOrder]);

    // Stats
    const stats = useMemo(() => {
        const totalMappings = courseMappings.length;
        const coreMappings = courseMappings.filter(m => m.type === 'core').length;
        const electiveMappings = courseMappings.filter(m => m.type === 'dept_elective' || m.type === 'open_elective').length;
        const totalCredits = courseMappings.reduce((sum, m) => sum + (m.credits || 0), 0);

        return {
            totalMappings,
            coreMappings,
            electiveMappings,
            totalCredits
        };
    }, [courseMappings]);

    if (loading) {
        return (
            <div className="min-h-full flex items-center justify-center p-8">
                <div className="text-center">
                    <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading course mapping data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-full flex items-center justify-center p-8">
                <div className="text-center">
                    <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Data</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadInitialData}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        <ArrowPathIcon className="h-4 w-4" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full flex flex-col p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-4">
                        <div className="flex items-center justify-center h-12 w-12 bg-indigo-100 rounded-xl shrink-0">
                            <ClipboardDocumentListIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                                Course Mapping
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Map courses to programs and semesters with faculty allocation
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => {
                                setEditingMapping(null);
                                setShowAddModal(true);
                            }}
                            disabled={isLocked || !selectedProgramId}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <PlusCircleIcon className="h-5 w-5" />
                            Add Mapping
                        </button>
                        
                        <button
                            onClick={() => setShowCloneModal(true)}
                            disabled={isLocked}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <ArrowPathIcon className="h-5 w-5" />
                            Clone Structure
                        </button>
                        
                        <button
                            onClick={() => setShowElectiveModal(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
                        >
                            <BookOpenIcon className="h-5 w-5" />
                            Manage Electives
                        </button>
                    </div>
                </div>
            </div>

            <main className="flex flex-1 flex-col lg:flex-row gap-6">
                {/* LEFT SIDEBAR */}
                <aside className="w-full lg:w-80 space-y-5 flex-shrink-0">
                    {/* Department & Program Selector */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-3">
                                Department <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedDeptId}
                                onChange={(e) => setSelectedDeptId(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                            >
                                <option value="">Select Department</option>
                                {departments.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name} ({d.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-3">
                                Program <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedProgramId}
                                onChange={(e) => setSelectedProgramId(e.target.value)}
                                disabled={!selectedDeptId}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100"
                            >
                                <option value="">Select Program</option>
                                {programs.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} ({p.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-3">
                                Semester
                            </label>
                            <select
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                                disabled={!selectedProgramId}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                    <option key={s} value={s}>
                                        Semester {s}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3">
                        <KPICard
                            title="Total Mappings"
                            value={stats.totalMappings}
                            icon={<BookOpenIcon className="h-5 w-5" />}
                            color="blue"
                        />
                        <KPICard
                            title="Core Courses"
                            value={stats.coreMappings}
                            icon={<CheckCircleIcon className="h-5 w-5" />}
                            color="green"
                        />
                        <KPICard
                            title="Electives"
                            value={stats.electiveMappings}
                            icon={<UserGroupIcon className="h-5 w-5" />}
                            color="purple"
                        />
                        <KPICard
                            title="Total Credits"
                            value={stats.totalCredits}
                            icon={<AcademicCapIcon className="h-5 w-5" />}
                            color="yellow"
                        />
                    </div>

                    {/* Status Card */}
                    {selectedProgramId && (
                        <div className={`rounded-xl border p-5 ${
                            isLocked 
                                ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' 
                                : 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200'
                        }`}>
                            <div className="flex items-start gap-3">
                                <InformationCircleIcon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                                    isLocked ? 'text-red-600' : 'text-indigo-600'
                                }`} />
                                <div className="flex-1">
                                    <h3 className={`text-sm font-semibold mb-1 ${
                                        isLocked ? 'text-red-900' : 'text-indigo-900'
                                    }`}>
                                        Semester {selectedSemester} Status
                                    </h3>
                                    <p className={`text-xs ${
                                        isLocked ? 'text-red-700' : 'text-indigo-700'
                                    }`}>
                                        {isLocked 
                                            ? '🔒 Locked - No modifications allowed' 
                                            : '🔓 Unlocked - Ready for editing'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </aside>

                {/* MAIN CONTENT */}
                <section className="flex-1 rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    {/* Search & Filters Bar */}
                    <div className="px-5 py-4 border-b border-gray-200 bg-white">
                        {/* Main Search and Primary Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            {/* Search Bar */}
                            <div className="flex-1 min-w-0">
                                <SearchBar
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    placeholder="Search course mappings by name or code..."
                                />
                            </div>
                            
                            {/* Primary Filters */}
                            <div className="flex gap-3 items-center">
                                {/* Type Filter */}
                                <select
                                    value={typeFilter as any}
                                    onChange={(e) => setTypeFilter(e.target.value as any)}
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white min-w-[140px]"
                                >
                                    <option value="">All Types</option>
                                    <option value="core">Core</option>
                                    <option value="dept_elective">Dept Elective</option>
                                    <option value="open_elective">Open Elective</option>
                                </select>
                                
                                {/* More Filters Toggle */}
                                <button
                                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                        showAdvancedFilters || facultyFilter || creditsFilter || sortBy !== 'semester' || sortOrder !== 'asc'
                                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <span>More</span>
                                    <ChevronDownIcon className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Advanced Filters Panel */}
                        {showAdvancedFilters && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
                                        {/* Faculty Filter */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Faculty</label>
                                            <select
                                                value={facultyFilter}
                                                onChange={(e) => setFacultyFilter(e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                                            >
                                                <option value="">All Faculty</option>
                                                {faculties.map((faculty) => (
                                                    <option key={faculty.id} value={faculty.id}>
                                                        {faculty.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Credits Filter */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Credits</label>
                                            <select
                                                value={creditsFilter}
                                                onChange={(e) => setCreditsFilter(e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                                            >
                                                <option value="">All Credits</option>
                                                {[1, 2, 3, 4, 5, 6].map((credit) => (
                                                    <option key={credit} value={credit}>
                                                        {credit} Credits
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Sort By */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Sort By</label>
                                            <select
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value as any)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                                            >
                                                <option value="semester">Semester</option>
                                                <option value="name">Name</option>
                                                <option value="code">Code</option>
                                                <option value="credits">Credits</option>
                                            </select>
                                        </div>

                                        {/* Sort Order */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Order</label>
                                            <select
                                                value={sortOrder}
                                                onChange={(e) => setSortOrder(e.target.value as any)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                                            >
                                                <option value="asc">A → Z</option>
                                                <option value="desc">Z → A</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Clear Filters */}
                                    {(searchQuery || typeFilter !== "" || facultyFilter || creditsFilter || sortBy !== 'semester' || sortOrder !== 'asc') && (
                                        <button
                                            onClick={() => {
                                                setSearchQuery("");
                                                setTypeFilter("");
                                                setFacultyFilter("");
                                                setCreditsFilter("");
                                                setSortBy('semester');
                                                setSortOrder('asc');
                                            }}
                                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
                                        >
                                            <XMarkIcon className="h-4 w-4" />
                                            Clear All
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Results Summary */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="font-medium">
                                    {filteredMappings.length} mapping{filteredMappings.length !== 1 ? "s" : ""}
                                </span>
                                {(searchQuery || typeFilter !== "" || facultyFilter || creditsFilter) && (
                                    <span className="text-gray-400">• filtered</span>
                                )}
                                {totalPages > 1 && (
                                    <span className="text-gray-400">• Page {currentPage} of {totalPages}</span>
                                )}
                            </div>
                            
                            {selectedProgramId && (
                                <button
                                    onClick={handleToggleLock}
                                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm transition-colors ${
                                        isLocked 
                                            ? 'bg-red-600 text-white hover:bg-red-700' 
                                            : 'border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                    }`}
                                >
                                    {isLocked ? (
                                        <>
                                            <LockOpenIcon className="h-3.5 w-3.5" />
                                            Unlock
                                        </>
                                    ) : (
                                        <>
                                            <LockClosedIcon className="h-3.5 w-3.5" />
                                            Lock
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Course Mappings Grid */}
                    <div className="flex-1 overflow-y-auto p-5">
                        {!selectedDeptId || !selectedProgramId ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="p-4 bg-amber-100 rounded-full mb-4">
                                    <InformationCircleIcon className="h-12 w-12 text-amber-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Select Department & Program
                                </h3>
                                <p className="text-sm text-gray-500 max-w-sm mb-4">
                                    Please select a department and program from the sidebar to view and manage course mappings.
                                </p>
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md">
                                    <div className="flex items-start gap-3">
                                        <InformationCircleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-amber-800 mb-1">Required Steps:</p>
                                            <ol className="text-sm text-amber-700 space-y-1">
                                                <li className="flex items-center gap-2">
                                                    <span className="w-4 h-4 bg-amber-200 text-amber-800 rounded-full text-xs flex items-center justify-center font-medium">1</span>
                                                    Select a Department
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span className="w-4 h-4 bg-amber-200 text-amber-800 rounded-full text-xs flex items-center justify-center font-medium">2</span>
                                                    Choose a Program
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span className="w-4 h-4 bg-amber-200 text-amber-800 rounded-full text-xs flex items-center justify-center font-medium">3</span>
                                                    Start mapping courses
                                                </li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : filteredMappings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="p-4 bg-gray-100 rounded-full mb-4">
                                    <BookOpenIcon className="h-12 w-12 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    No Course Mappings
                                </h3>
                                <p className="text-sm text-gray-500 max-w-sm mb-6">
                                    {searchQuery || typeFilter || facultyFilter || creditsFilter
                                        ? "No mappings match your search criteria"
                                        : "Start by adding course mappings for this semester"}
                                </p>
                                {!isLocked && !searchQuery && !typeFilter && !facultyFilter && !creditsFilter && (
                                    <button
                                        onClick={() => {
                                            setEditingMapping(null);
                                            setShowAddModal(true);
                                        }}
                                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                                    >
                                        <PlusCircleIcon className="h-5 w-5" />
                                        Add First Mapping
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {paginatedMappings.map((mapping) => (
                                        <CourseMappingCard
                                            key={mapping.id}
                                            mapping={mapping}
                                            onEdit={handleEditMapping}
                                            onDelete={handleDeleteMapping}
                                            faculties={faculties}
                                            isLocked={isLocked}
                                        />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="mt-6">
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            totalItems={filteredMappings.length}
                                            itemsPerPage={itemsPerPage}
                                            onPageChange={setCurrentPage}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Info Footer */}
                    <div className="border-t border-gray-200 px-5 py-4 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold text-gray-900">
                                {courseMappings.length}
                            </span>{" "}
                            mapping{courseMappings.length !== 1 ? "s" : ""} total for Semester {selectedSemester}
                            {!selectedDeptId || !selectedProgramId ? (
                                <span className="text-amber-600 ml-2">• Select department & program to manage mappings</span>
                            ) : null}
                        </p>
                        <div className="text-xs text-gray-500">Use Edit/Delete buttons on mapping cards to manage</div>
                    </div>
                </section>
            </main>

            {/* Modals */}
            <AddEditCourseMappingModal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    setEditingMapping(null);
                }}
                onSave={handleSaveCourseMapping}
                availableCourses={availableCourses}
                faculties={faculties}
                editingMapping={editingMapping}
                semester={selectedSemester}
            />

            <CloneSemesterModal
                isOpen={showCloneModal}
                onClose={() => setShowCloneModal(false)}
                onClone={handleCloneSemester}
                programs={programs}
                selectedProgramId={selectedProgramId}
            />

            <ElectiveManagementModal
                isOpen={showElectiveModal}
                onClose={() => setShowElectiveModal(false)}
                mappings={courseMappings}
                faculties={faculties}
                onUpdateMapping={handleUpdateMapping}
            />

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={cancelDeleteMapping}
                onConfirm={confirmDeleteMapping}
                title="Delete Course Mapping"
                message="Are you sure you want to remove this course mapping? This action cannot be undone."
                type="danger"
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={deleteLoading}
            />
        </div>
    );
};

export default CourseMapping;