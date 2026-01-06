import React, { useCallback, useEffect, useMemo, useState } from "react";
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
    ChevronDownIcon,
} from "@heroicons/react/24/outline";
import SearchBar from "../../../components/common/SearchBar";
import KPICard from "../../../components/admin/KPICard";
import Pagination from "../../../components/admin/Pagination";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import { 
    getDepartments, 
    getPrograms, 
    getFaculty, 
    getCourseMappings,
    mapCourse,
    updateCourseMapping,
    deleteCourseMapping,
    isSemesterLocked,
    lockSemester,
    unlockSemester,
    cloneSemesterStructure,
    type Department,
    type Program,
    type Faculty,
    type CourseMapping
} from "../../../services/college/courseMappingService";

interface Course {
    id: string;
    code: string;
    name: string;
    credits: number;
    semester: number;
    type: 'core' | 'dept_elective' | 'open_elective';
    facultyId?: string;
    capacity?: number;
}

// Utility functions
const getTypeColor = (type: string) => {
    switch (type) {
        case 'core': return 'bg-blue-100 text-blue-800';
        case 'dept_elective': return 'bg-green-100 text-green-800';
        case 'open_elective': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
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

// Custom hooks
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};



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
   ADD/EDIT COURSE MODAL
   ============================== */
const AddEditCourseModal = ({
    isOpen,
    onClose,
    onCreated,
    onUpdated,
    faculties,
    editingCourse,
}: {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (course: Course) => void;
    onUpdated: (course: Course) => void;
    faculties: Faculty[];
    editingCourse?: Course | null;
}) => {
    const isEditing = !!editingCourse;
    const [code, setCode] = useState(editingCourse?.code || "");
    const [name, setName] = useState(editingCourse?.name || "");
    const [credits, setCredits] = useState<number | "">(editingCourse?.credits || "");
    const [semester, setSemester] = useState<number | "">(editingCourse?.semester || "");
    const [type, setType] = useState<'core' | 'dept_elective' | 'open_elective'>(editingCourse?.type || 'core');
    const [facultyId, setFacultyId] = useState<string | "">(editingCourse?.facultyId || "");
    const [capacity, setCapacity] = useState<number | "">(editingCourse?.capacity || "");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Update form when editingCourse changes
    useEffect(() => {
        if (editingCourse) {
            setCode(editingCourse.code);
            setName(editingCourse.name);
            setCredits(editingCourse.credits);
            setSemester(editingCourse.semester);
            setType(editingCourse.type);
            setFacultyId(editingCourse.facultyId || "");
            setCapacity(editingCourse.capacity || "");
        } else {
            resetForm();
        }
    }, [editingCourse]);

    const resetForm = () => {
        setCode("");
        setName("");
        setCredits("");
        setSemester("");
        setType('core');
        setFacultyId("");
        setCapacity("");
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = () => {
        if (!code || !name || credits === "" || semester === "" || facultyId === "") {
            setError("Please fill in all required fields.");
            return;
        }

        if (Number(credits) <= 0 || Number(credits) > 20) {
            setError("Credits must be between 1 and 20.");
            return;
        }

        if ((type === 'dept_elective' || type === 'open_elective') && capacity === "") {
            setError("Capacity is required for elective courses.");
            return;
        }

        setError(null);
        setSubmitting(true);

        try {
            const courseData = {
                id: isEditing ? editingCourse!.id : crypto.randomUUID(),
                code: code.trim().toUpperCase(),
                name: name.trim(),
                credits: Number(credits),
                semester: Number(semester),
                type,
                facultyId: facultyId || undefined,
                capacity: (type === 'dept_elective' || type === 'open_elective') ? Number(capacity) : undefined,
            };

            if (isEditing) {
                onUpdated(courseData);
            } else {
                onCreated(courseData);
            }
            
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={handleClose}
            title={isEditing ? "Edit Course" : "Add New Course"}
            subtitle={isEditing ? "Update course information" : "Create a new course to add to your course library"}
        >
            {error && (
                <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                    <XCircleIcon className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course Code <span className="text-red-500">*</span>
                    </label>
                    <input
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
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
                        onChange={(e) =>
                            setCredits(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                        placeholder="4"
                    />
                </div>

                <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                        placeholder="Introduction to Programming"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Semester <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={semester as any}
                        onChange={(e) =>
                            setSemester(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                    >
                        <option value="">Select semester</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                            <option key={s} value={s}>
                                Semester {s}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course Type <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as 'core' | 'dept_elective' | 'open_elective')}
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
                        value={facultyId as any}
                        onChange={(e) => setFacultyId(e.target.value === "" ? "" : e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                        disabled={faculties.length === 0}
                    >
                        <option value="">
                            {faculties.length === 0 ? "Loading faculty..." : "Select faculty"}
                        </option>
                        {faculties.map((faculty) => (
                            <option key={faculty.id} value={faculty.id}>
                                {faculty.name} ({faculty.currentWorkload}/{faculty.maxWorkload} credits)
                            </option>
                        ))}
                    </select>
                    {faculties.length === 0 && (
                        <p className="mt-1 text-xs text-amber-600">
                            No faculty assigned to this department. Please assign faculty to the department first.
                        </p>
                    )}
                </div>

                {(type === 'dept_elective' || type === 'open_elective') && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Capacity <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="200"
                            value={capacity}
                            onChange={(e) =>
                                setCapacity(e.target.value === "" ? "" : Number(e.target.value))
                            }
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                            placeholder="60"
                        />
                    </div>
                )}
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
                            {isEditing ? 'Update Course' : 'Add Course'}
                        </>
                    )}
                </button>
            </div>
        </ModalWrapper>
    );
};

/* ==============================
   COURSE CARD COMPONENT
   ============================== */
const CourseCard = React.memo(({
    course,
    onEdit,
    onDelete,
    faculties,
}: {
    course: Course;
    onEdit: (course: Course) => void;
    onDelete: (courseId: string) => void;
    faculties: Faculty[];
}) => {
    const faculty = useMemo(() => 
        faculties.find(f => f.id === course.facultyId), 
        [faculties, course.facultyId]
    );

    const handleEdit = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(course);
    }, [onEdit, course]);

    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(course.id);
    }, [onDelete, course.id]);

    return (
        <div className="group relative rounded-lg border-2 border-gray-200 bg-white p-4 transition-all duration-200 hover:border-gray-300 hover:shadow-sm">
            {/* Action Buttons - Top Right Corner */}
            <div className="absolute top-2 right-2 flex gap-1">
                <button
                    onClick={handleEdit}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    title="Edit course"
                >
                    <PencilIcon className="h-4 w-4" />
                </button>
                <button
                    onClick={handleDelete}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete course"
                >
                    <XMarkIcon className="h-4 w-4" />
                </button>
            </div>

            {/* Course Info */}
            <div className="pr-20">
                <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
                        {course.code}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getTypeColor(course.type)}`}>
                        {getTypeLabel(course.type)}
                    </span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                    {course.name}
                </h4>
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                        <span className="inline-flex items-center gap-1">
                            <AcademicCapIcon className="h-4 w-4" />
                            {course.credits} Credits
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <BookOpenIcon className="h-4 w-4" />
                            Semester {course.semester}
                        </span>
                    </div>
                    {faculty && (
                        <div className="text-xs text-gray-500">
                            Faculty: {faculty.name}
                        </div>
                    )}
                    {course.capacity && (
                        <div className="text-xs text-gray-500">
                            Capacity: {course.capacity} students
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

/* ==============================
   CLONE SEMESTER MODAL
   ============================== */
const CloneSemesterModal = ({
    isOpen,
    onClose,
    onClone,
}: {
    isOpen: boolean;
    onClose: () => void;
    onClone: (fromSemester: number, toSemester: number) => void;
}) => {
    const [fromSemester, setFromSemester] = useState<number | "">("");
    const [toSemester, setToSemester] = useState<number | "">("");

    const handleSubmit = () => {
        if (fromSemester !== "" && toSemester !== "" && fromSemester !== toSemester) {
            onClone(Number(fromSemester), Number(toSemester));
            setFromSemester("");
            setToSemester("");
        }
    };

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            title="Clone Semester Structure"
            subtitle="Copy all courses from one semester to another"
        >
            <div className="grid grid-cols-2 gap-4">
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
            <div className="mt-6 flex justify-end gap-3">
                <button
                    onClick={onClose}
                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={fromSemester === "" || toSemester === "" || fromSemester === toSemester}
                    className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                    Clone Semester
                </button>
            </div>
        </ModalWrapper>
    );
};

/* ==============================
   ELECTIVE BASKET MODAL
   ============================== */
const ElectiveBasketModal = ({
    isOpen,
    onClose,
    courses,
    faculties,
    onUpdateCourse,
}: {
    isOpen: boolean;
    onClose: () => void;
    courses: Course[];
    faculties: Faculty[];
    onUpdateCourse: (course: Course) => void;
}) => {
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [tempCapacity, setTempCapacity] = useState<number | "">("");
    const [tempFacultyId, setTempFacultyId] = useState<string | "">("");
    
    const electiveCourses = courses.filter(c => c.type === 'dept_elective' || c.type === 'open_elective');
    
    const handleEditStart = (course: Course) => {
        setEditingCourse(course);
        setTempCapacity(course.capacity || "");
        setTempFacultyId(course.facultyId || "");
    };
    
    const handleEditSave = () => {
        if (editingCourse && tempCapacity !== "" && tempFacultyId !== "") {
            const updatedCourse = {
                ...editingCourse,
                capacity: Number(tempCapacity),
                facultyId: tempFacultyId as string
            };
            onUpdateCourse(updatedCourse);
            setEditingCourse(null);
            setTempCapacity("");
            setTempFacultyId("");
        }
    };
    
    const handleEditCancel = () => {
        setEditingCourse(null);
        setTempCapacity("");
        setTempFacultyId("");
    };
    
    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            title="Elective Basket Setup"
            subtitle="Manage elective courses, capacities, and faculty assignments"
        >
            <div className="space-y-4 max-h-96 overflow-y-auto">
                {electiveCourses.length === 0 ? (
                    <div className="text-center py-12">
                        <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Elective Courses</h3>
                        <p className="text-sm text-gray-500">
                            Add some department or open elective courses to manage them here.
                        </p>
                    </div>
                ) : (
                    electiveCourses.map(course => {
                        const faculty = faculties.find(f => f.id === course.facultyId);
                        const isEditing = editingCourse?.id === course.id;
                        
                        return (
                            <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium text-gray-900">{course.name}</h4>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                course.type === 'dept_elective' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                                            }`}>
                                                {course.type === 'dept_elective' ? 'Dept Elective' : 'Open Elective'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">{course.code} • {course.credits} Credits • Semester {course.semester}</p>
                                    </div>
                                    
                                    {!isEditing && (
                                        <button
                                            onClick={() => handleEditStart(course)}
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
                                                    value={tempFacultyId}
                                                    onChange={(e) => setTempFacultyId(e.target.value === "" ? "" : e.target.value)}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                                    disabled={faculties.length === 0}
                                                >
                                                    <option value="">
                                                        {faculties.length === 0 ? "Loading faculty..." : "Select faculty"}
                                                    </option>
                                                    {faculties.map((f) => (
                                                        <option key={f.id} value={f.id}>
                                                            {f.name} ({f.currentWorkload}/{f.maxWorkload} credits)
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
                                                    value={tempCapacity}
                                                    onChange={(e) => setTempCapacity(e.target.value === "" ? "" : Number(e.target.value))}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                                    placeholder="60"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={handleEditCancel}
                                                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleEditSave}
                                                disabled={tempCapacity === "" || tempFacultyId === ""}
                                                className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 rounded-lg transition-colors"
                                            >
                                                Save
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
                                            <div className="font-medium text-gray-900">{course.capacity || 'Not set'} students</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Status:</span>
                                            <div className={`font-medium ${
                                                course.capacity && faculty ? 'text-green-600' : 'text-amber-600'
                                            }`}>
                                                {course.capacity && faculty ? 'Ready' : 'Needs Setup'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
            
            {electiveCourses.length > 0 && (
                <div className="mt-6 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">{electiveCourses.length}</span> elective course{electiveCourses.length !== 1 ? 's' : ''} •{' '}
                        <span className="font-medium text-green-600">
                            {electiveCourses.filter(c => c.capacity && c.facultyId).length}
                        </span> ready •{' '}
                        <span className="font-medium text-amber-600">
                            {electiveCourses.filter(c => !c.capacity || !c.facultyId).length}
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
    // State for data
    const [departments, setDepartments] = useState<Department[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    
    // State for UI
    const [selectedDeptId, setSelectedDeptId] = useState<string>("");
    const [selectedProgramId, setSelectedProgramId] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [semesterFilter, setSemesterFilter] = useState<number | "">("");
    const [typeFilter, setTypeFilter] = useState<'core' | 'dept_elective' | 'open_elective' | "">("");
    const [facultyFilter, setFacultyFilter] = useState<string>("");
    const [creditsFilter, setCreditsFilter] = useState<string>("");
    const [sortBy, setSortBy] = useState<'name' | 'code' | 'semester' | 'credits'>('semester');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(6);
    
    // State for modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCloneModal, setShowCloneModal] = useState(false);
    const [showElectiveBasketModal, setShowElectiveBasketModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    
    // State for delete confirmation
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // State for loading and errors
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLocked, setIsLocked] = useState(false);

    // Debounced search query
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // Memoized computed values
    const selectedDept = useMemo(
        () => departments.find((d) => d.id === selectedDeptId) || null,
        [departments, selectedDeptId]
    );

    const availablePrograms = useMemo(() => {
        return programs.filter(p => p.department_id === selectedDeptId);
    }, [programs, selectedDeptId]);

    const filteredCourses = useMemo(() => {
        let courses = [...allCourses];

        // Apply client-side filters for advanced filtering
        if (facultyFilter) {
            courses = courses.filter(c => c.facultyId === facultyFilter);
        }

        if (creditsFilter) {
            courses = courses.filter(c => c.credits.toString() === creditsFilter);
        }

        // Apply sorting
        courses.sort((a, b) => {
            let aValue: any, bValue: any;
            
            switch (sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'code':
                    aValue = a.code.toLowerCase();
                    bValue = b.code.toLowerCase();
                    break;
                case 'semester':
                    aValue = a.semester;
                    bValue = b.semester;
                    break;
                case 'credits':
                    aValue = a.credits;
                    bValue = b.credits;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return courses;
    }, [allCourses, facultyFilter, creditsFilter, sortBy, sortOrder]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCourses = filteredCourses.slice(startIndex, startIndex + itemsPerPage);

    // Load initial data
    const loadInitialData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [depts, progs] = await Promise.all([
                getDepartments(),
                getPrograms()
            ]);
            
            setDepartments(depts);
            setPrograms(progs);
            setSelectedDeptId("");
            setSelectedProgramId("");
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    // Load faculty when department changes
    const loadFaculty = useCallback(async () => {
        if (!selectedDeptId) return;
        
        try {
            const faculty = await getFaculty(selectedDeptId);
            setFaculties(faculty);
        } catch (err) {
            console.error('Failed to load faculty:', err);
            setFaculties([]);
        }
    }, [selectedDeptId]);

    // Load course mappings
    const loadCourseMappings = useCallback(async () => {
        if (!selectedProgramId) return;
        
        try {
            setLoading(true);
            const mappings = await getCourseMappings(
                selectedProgramId,
                semesterFilter === "" ? undefined : semesterFilter,
                debouncedSearchQuery || undefined,
                typeFilter === "" ? undefined : typeFilter
            );
            
            // Convert mappings to courses format for UI
            const courses: Course[] = mappings.map(mapping => ({
                id: mapping.id,
                code: mapping.course_code,
                name: mapping.course_name,
                credits: Number(mapping.credits),
                semester: mapping.semester,
                type: mapping.type,
                facultyId: mapping.faculty_id,
                capacity: mapping.capacity
            }));
            
            setAllCourses(courses);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load course mappings');
        } finally {
            setLoading(false);
        }
    }, [selectedProgramId, debouncedSearchQuery, semesterFilter, typeFilter]);

    // Check semester lock
    const checkSemesterLock = useCallback(async () => {
        if (!selectedProgramId || semesterFilter === "") return;
        
        try {
            const locked = await isSemesterLocked(selectedProgramId, Number(semesterFilter));
            setIsLocked(locked);
        } catch (err) {
            console.error('Failed to check semester lock:', err);
        }
    }, [selectedProgramId, semesterFilter]);

    // Event handlers
    const handleCreateCourse = useCallback(async (course: Course) => {
        if (!selectedProgramId) {
            setError('Please select a department and program first');
            return;
        }
        
        try {
            const mappingData = {
                program_id: selectedProgramId,
                semester: course.semester,
                course_code: course.code,
                course_name: course.name,
                credits: course.credits,
                type: course.type,
                faculty_id: course.facultyId,
                capacity: course.capacity
            };
            
            await mapCourse(mappingData);
            await loadCourseMappings();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create course');
        }
    }, [selectedProgramId, loadCourseMappings]);

    const handleUpdateCourse = useCallback(async (updatedCourse: Course) => {
        try {
            const mappingData = {
                course_code: updatedCourse.code,
                course_name: updatedCourse.name,
                credits: updatedCourse.credits,
                semester: updatedCourse.semester,
                type: updatedCourse.type,
                faculty_id: updatedCourse.facultyId,
                capacity: updatedCourse.capacity
            };
            
            await updateCourseMapping(updatedCourse.id, mappingData);
            await loadCourseMappings();
            
            setEditingCourse(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update course');
        }
    }, [loadCourseMappings]);

    const handleEditCourse = useCallback((course: Course) => {
        setEditingCourse(course);
        setShowAddModal(true);
    }, []);

    const handleDeleteCourse = useCallback(async (courseId: string) => {
        if (isLocked) return;
        
        const course = allCourses.find(c => c.id === courseId);
        if (course) {
            setCourseToDelete(course);
            setShowDeleteModal(true);
        }
    }, [isLocked, allCourses]);

    const confirmDeleteCourse = useCallback(async () => {
        if (!courseToDelete) return;
        
        try {
            setIsDeleting(true);
            await deleteCourseMapping(courseToDelete.id);
            await loadCourseMappings();
            
            setShowDeleteModal(false);
            setCourseToDelete(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete course');
        } finally {
            setIsDeleting(false);
        }
    }, [courseToDelete, loadCourseMappings]);

    const handleCloneSemester = useCallback(async (fromSemester: number, toSemester: number) => {
        if (!selectedProgramId) return;
        
        try {
            await cloneSemesterStructure(selectedProgramId, fromSemester, selectedProgramId, toSemester);
            await loadCourseMappings();
            setShowCloneModal(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to clone semester');
        }
    }, [selectedProgramId, loadCourseMappings]);

    const handleToggleLock = useCallback(async () => {
        if (!selectedProgramId || semesterFilter === "") return;
        
        try {
            if (isLocked) {
                await unlockSemester(selectedProgramId, Number(semesterFilter));
            } else {
                await lockSemester(selectedProgramId, Number(semesterFilter));
            }
            setIsLocked(!isLocked);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to toggle lock');
        }
    }, [selectedProgramId, semesterFilter, isLocked]);

    // Effects
    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    useEffect(() => {
        if (selectedDeptId) {
            loadFaculty();
        }
    }, [selectedDeptId, loadFaculty]);

    useEffect(() => {
        if (selectedProgramId) {
            loadCourseMappings();
            checkSemesterLock();
        }
    }, [selectedProgramId, loadCourseMappings, checkSemesterLock]);

    // Update selected program when department changes
    useEffect(() => {
        if (selectedDeptId && availablePrograms.length > 0) {
            const currentProgram = availablePrograms.find(p => p.id === selectedProgramId);
            if (!currentProgram) {
                setSelectedProgramId("");
            }
        } else if (!selectedDeptId) {
            setSelectedProgramId("");
        }
    }, [selectedDeptId, availablePrograms, selectedProgramId]);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchQuery, semesterFilter, typeFilter, selectedProgramId, facultyFilter, creditsFilter, sortBy, sortOrder]);

    // Show loading state
    if (loading && departments.length === 0) {
        return (
            <div className="min-h-full flex items-center justify-center p-8">
                <div className="text-center">
                    <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading course mapping data...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="min-h-full flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadInitialData}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
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
            <div className=" mb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Title Section */}
                    <div className="flex items-start sm:items-center gap-4">
                        <div className="flex items-center justify-center h-12 w-12 bg-indigo-100 rounded-xl shrink-0">
                            <BookOpenIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                                Course Mapping
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Assign and manage courses for departments
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setShowAddModal(true)}
                            disabled={isLocked || !selectedDeptId || !selectedProgramId}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                            title={!selectedDeptId || !selectedProgramId ? "Please select department and program first" : ""}
                        >
                            <PlusCircleIcon className="h-5 w-5" />
                            Add Course
                        </button>
                        
                        <button
                            onClick={() => setShowCloneModal(true)}
                            disabled={isLocked || !selectedDeptId || !selectedProgramId}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                            title={!selectedDeptId || !selectedProgramId ? "Please select department and program first" : ""}
                        >
                            <ArrowPathIcon className="h-5 w-5" />
                            Clone Semester
                        </button>
                        
                        <button
                            onClick={() => setShowElectiveBasketModal(true)}
                            disabled={!selectedDeptId || !selectedProgramId}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                            title={!selectedDeptId || !selectedProgramId ? "Please select department and program first" : ""}
                        >
                            <BookOpenIcon className="h-5 w-5" />
                            Elective Basket
                        </button>
                        
                        <button
                            onClick={handleToggleLock}
                            disabled={!selectedDeptId || !selectedProgramId}
                            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                isLocked 
                                    ? 'bg-red-600 text-white hover:bg-red-700' 
                                    : 'border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                            }`}
                            title={!selectedDeptId || !selectedProgramId ? "Please select department and program first" : ""}
                        >
                            {isLocked ? (
                                <>
                                    <XCircleIcon className="h-5 w-5" />
                                    Unlock Mapping
                                </>
                            ) : (
                                <>
                                    <CheckCircleIcon className="h-5 w-5" />
                                    Lock Mapping
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>


            <main className="flex flex-1 flex-col lg:flex-row gap-6 py-4 sm:py-6 lg:py-8">
                {/* LEFT SIDEBAR */}
                <aside className="w-full lg:w-80 space-y-5 flex-shrink-0">
                    {/* Department & Program Selector */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-3">
                                Select Department <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedDeptId}
                                onChange={(e) => {
                                    setSelectedDeptId(e.target.value);
                                    setSelectedProgramId(""); // Reset program when department changes
                                    setFaculties([]); // Clear faculty when department changes
                                }}
                                disabled={isLocked || loading}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">Select Department</option>
                                {departments.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name} ({d.code})
                                    </option>
                                ))}
                            </select>
                            {departments.length === 0 && !loading && (
                                <p className="mt-1 text-xs text-red-600">
                                    No departments found. Please contact administrator.
                                </p>
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-3">
                                Select Program <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedProgramId}
                                onChange={(e) => setSelectedProgramId(e.target.value)}
                                disabled={isLocked || loading || !selectedDeptId}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">
                                    {!selectedDeptId ? "Select department first" : "Select Program"}
                                </option>
                                {availablePrograms.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} ({p.code})
                                    </option>
                                ))}
                            </select>
                            {!selectedDeptId && (
                                <p className="mt-1 text-xs text-amber-600">
                                    Please select a department first to view available programs.
                                </p>
                            )}
                            {selectedDeptId && availablePrograms.length === 0 && (
                                <p className="mt-1 text-xs text-red-600">
                                    No programs found for this department.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3">
                        <KPICard
                            title="Total Courses"
                            value={allCourses.length}
                            icon={<BookOpenIcon className="h-5 w-5" />}
                            color="blue"
                        />
                    </div>



                    {/* Status Card */}
                    {selectedDeptId && selectedProgramId && (
                        <div className={`rounded-xl border p-5 ${
                            isLocked 
                                ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' 
                                : 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200'
                        }`}>
                            <div className="flex items-start gap-3 mb-3">
                                <InformationCircleIcon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                                    isLocked ? 'text-red-600' : 'text-indigo-600'
                                }`} />
                                <div className="flex-1">
                                    <h3 className={`text-sm font-semibold mb-1 ${
                                        isLocked ? 'text-red-900' : 'text-indigo-900'
                                    }`}>
                                        {selectedDept?.name}
                                    </h3>
                                    <p className={`text-xs ${
                                        isLocked ? 'text-red-700' : 'text-indigo-700'
                                    }`}>
                                        Department Code: {selectedDept?.code}
                                    </p>
                                    <p className={`text-xs mt-1 ${
                                        isLocked ? 'text-red-700' : 'text-indigo-700'
                                    }`}>
                                        Program: {programs.find(p => p.id === selectedProgramId)?.name}
                                    </p>
                                </div>
                            </div>
                            
                            <div className={`mt-3 pt-3 border-t ${
                                isLocked ? 'border-red-200' : 'border-indigo-200'
                            }`}>
                                {loading ? (
                                    <p className="text-xs font-medium text-gray-600 flex items-center gap-2">
                                        <ArrowPathIcon className="h-3 w-3 animate-spin" />
                                        Loading...
                                    </p>
                                ) : isLocked ? (
                                    <p className="text-xs font-medium text-red-800 flex items-center gap-2">
                                        🔒 Mapping is locked - semester has started
                                    </p>
                                ) : (
                                    <p className="text-xs font-medium text-indigo-800">
                                        ✅ Ready to manage courses
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Selection Required Card */}
                    {(!selectedDeptId || !selectedProgramId) && (
                        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-5">
                            <div className="flex items-start gap-3">
                                <InformationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-600" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-amber-900 mb-2">
                                        Selection Required
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            {selectedDeptId ? (
                                                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <div className="h-4 w-4 rounded-full border-2 border-amber-400" />
                                            )}
                                            <span className={`text-xs ${selectedDeptId ? 'text-green-700' : 'text-amber-700'}`}>
                                                Department {selectedDeptId ? 'Selected' : 'Required'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {selectedProgramId ? (
                                                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <div className="h-4 w-4 rounded-full border-2 border-amber-400" />
                                            )}
                                            <span className={`text-xs ${selectedProgramId ? 'text-green-700' : 'text-amber-700'}`}>
                                                Program {selectedProgramId ? 'Selected' : 'Required'}
                                            </span>
                                        </div>
                                    </div>
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
                                    placeholder="Search courses by name or code..."
                                />
                            </div>
                            
                            {/* Primary Filters */}
                            <div className="flex gap-3 items-center">
                                {/* Semester Filter */}
                                <select
                                    value={semesterFilter as any}
                                    onChange={(e) =>
                                        setSemesterFilter(
                                            e.target.value === "" ? "" : parseInt(e.target.value)
                                        )
                                    }
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white min-w-[120px]"
                                >
                                    <option value="">All Semesters</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                        <option key={s} value={s}>
                                            Semester {s}
                                        </option>
                                    ))}
                                </select>
                                
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
                                    <ChevronDownIcon 
                                        className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} 
                                    />
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
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                Faculty
                                            </label>
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
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                Credits
                                            </label>
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
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                Sort By
                                            </label>
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
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                Order
                                            </label>
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
                                    {(searchQuery || semesterFilter !== "" || typeFilter !== "" || facultyFilter || creditsFilter || sortBy !== 'semester' || sortOrder !== 'asc') && (
                                        <button
                                            onClick={() => {
                                                setSearchQuery("");
                                                setSemesterFilter("");
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
                                    {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""}
                                </span>
                                {(searchQuery || semesterFilter !== "" || typeFilter !== "" || facultyFilter || creditsFilter) && (
                                    <span className="text-gray-400">• filtered</span>
                                )}
                                {totalPages > 1 && (
                                    <span className="text-gray-400">
                                        • Page {currentPage} of {totalPages}
                                    </span>
                                )}
                            </div>

                            <div className="text-xs text-gray-500">
                                Use Edit/Delete buttons on course cards to manage
                            </div>
                        </div>
                    </div>

                    {/* Courses Grid */}
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
                        ) : filteredCourses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="p-4 bg-gray-100 rounded-full mb-4">
                                    <BookOpenIcon className="h-12 w-12 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    No courses found
                                </h3>
                                <p className="text-sm text-gray-500 max-w-sm">
                                    {searchQuery || semesterFilter !== "" || typeFilter !== "" || facultyFilter || creditsFilter
                                        ? "Try adjusting your search or filter criteria"
                                        : "Get started by adding your first course"}
                                </p>
                                {!searchQuery && semesterFilter === "" && !facultyFilter && !creditsFilter && selectedDeptId && selectedProgramId && (
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                                    >
                                        <PlusCircleIcon className="h-5 w-5" />
                                        Add Your First Course
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {paginatedCourses.map((course) => (
                                        <CourseCard
                                            key={course.id}
                                            course={course}
                                            onEdit={handleEditCourse}
                                            onDelete={handleDeleteCourse}
                                            faculties={faculties}
                                        />
                                    ))}
                                </div>
                                
                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="mt-6">
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            totalItems={filteredCourses.length}
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
                                {allCourses.length}
                            </span>{" "}
                            course{allCourses.length !== 1 ? "s" : ""} mapped to this program
                            {!selectedDeptId || !selectedProgramId ? (
                                <span className="text-amber-600 ml-2">• Select department & program to manage courses</span>
                            ) : null}
                        </p>
                    </div>
                </section>
            </main>

            {/* Add/Edit Course Modal */}
            <AddEditCourseModal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    setEditingCourse(null);
                }}
                onCreated={handleCreateCourse}
                onUpdated={handleUpdateCourse}
                faculties={faculties}
                editingCourse={editingCourse}
            />

            {/* Clone Semester Modal */}
            <CloneSemesterModal
                isOpen={showCloneModal}
                onClose={() => setShowCloneModal(false)}
                onClone={handleCloneSemester}
            />

            {/* Elective Basket Modal */}
            <ElectiveBasketModal
                isOpen={showElectiveBasketModal}
                onClose={() => setShowElectiveBasketModal(false)}
                courses={allCourses}
                faculties={faculties}
                onUpdateCourse={handleUpdateCourse}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setCourseToDelete(null);
                    setIsDeleting(false);
                }}
                onConfirm={confirmDeleteCourse}
                title="Delete Course"
                message={`Are you sure you want to delete "${courseToDelete?.name}"? This action cannot be undone.`}
                type="danger"
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isDeleting}
            />
        </div>
    );
};

export default CourseMapping;