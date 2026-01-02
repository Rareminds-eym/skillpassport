/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import {
    PlusCircleIcon,
    XMarkIcon,
    BookOpenIcon,
    CheckCircleIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    InformationCircleIcon,
    AcademicCapIcon,
    CheckIcon,
    XCircleIcon,
    PencilIcon,
} from "@heroicons/react/24/outline";
import SearchBar from "../../../components/common/SearchBar";

interface Course {
    id: number;
    code: string;
    name: string;
    credits: number;
    semester: number;
    type: 'core' | 'dept_elective' | 'open_elective';
    facultyId?: number;
    capacity?: number; // For electives only
}

interface Department {
    id: number;
    name: string;
    code: string;
    courses?: Course[];
}

interface Program {
    id: number;
    name: string;
    code: string;
    departmentId: number;
}

interface Faculty {
    id: number;
    name: string;
    email: string;
    maxWorkload: number; // Maximum credits they can handle
    currentWorkload: number; // Current assigned credits
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
    const [facultyId, setFacultyId] = useState<number | "">(editingCourse?.facultyId || "");
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

        // Check faculty workload
        const selectedFaculty = faculties.find(f => f.id === Number(facultyId));
        if (selectedFaculty && (selectedFaculty.currentWorkload + Number(credits)) > selectedFaculty.maxWorkload) {
            setError(`Faculty workload limit exceeded. Available capacity: ${selectedFaculty.maxWorkload - selectedFaculty.currentWorkload} credits.`);
            return;
        }

        setError(null);
        setSubmitting(true);

        setTimeout(() => {
            const courseData = {
                id: isEditing ? editingCourse!.id : Date.now(),
                code: code.trim().toUpperCase(),
                name: name.trim(),
                credits: Number(credits),
                semester: Number(semester),
                type,
                facultyId: Number(facultyId),
                capacity: (type === 'dept_elective' || type === 'open_elective') ? Number(capacity) : undefined,
            };

            if (isEditing) {
                onUpdated(courseData);
            } else {
                onCreated(courseData);
            }
            
            setSubmitting(false);
            handleClose();
        }, 400);
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
                        onChange={(e) => setFacultyId(e.target.value === "" ? "" : Number(e.target.value))}
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
const CourseCard = ({
    course,
    isSelected,
    onToggle,
    onEdit,
    faculties,
}: {
    course: Course;
    isSelected: boolean;
    onToggle: () => void;
    onEdit: (course: Course) => void;
    faculties: Faculty[];
}) => {
    const faculty = faculties.find(f => f.id === course.facultyId);
    
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
    return (
        <div
            className={`group relative rounded-lg border-2 p-4 transition-all duration-200 ${isSelected
                ? "border-indigo-500 bg-indigo-50 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
        >
            {/* Edit Button - Top Right Corner, Always Visible */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit(course);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors z-10"
                title="Edit course"
            >
                <PencilIcon className="h-4 w-4" />
            </button>

            {/* Main Card Content - Clickable for Selection */}
            <div onClick={onToggle} className="cursor-pointer">
                <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 mt-0.5">
                        <div
                            className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected
                                ? "border-indigo-600 bg-indigo-600"
                                : "border-gray-300 group-hover:border-gray-400"
                                }`}
                        >
                            {isSelected && <CheckIcon className="h-3.5 w-3.5 text-white" />}
                        </div>
                    </div>

                    {/* Course Info */}
                    <div className="flex-1 min-w-0 pr-8">
                        <div className="flex items-center gap-2 mb-2">
                            <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${isSelected
                                    ? "bg-indigo-600 text-white"
                                    : "bg-gray-100 text-gray-700"
                                    }`}
                            >
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
            </div>

            {/* Selected Badge - Bottom Right Corner */}
            {isSelected && (
                <div className="absolute bottom-2 right-2">
                    <CheckCircleIcon className="h-5 w-5 text-indigo-600" />
                </div>
            )}
        </div>
    );
};

/* ==============================
   STATS CARD
   ============================== */
const StatsCard = ({
    label,
    value,
    icon: Icon,
    color = "blue",
}: {
    label: string;
    value: number;
    icon: any;
    color?: "blue" | "green" | "purple" | "amber";
}) => {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600 border-blue-200",
        green: "bg-green-50 text-green-600 border-green-200",
        purple: "bg-purple-50 text-purple-600 border-purple-200",
        amber: "bg-amber-50 text-amber-600 border-amber-200",
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        {label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
                <div
                    className={`p-3 rounded-xl border ${colorClasses[color]} transition-colors`}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </div>
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
    const [tempFacultyId, setTempFacultyId] = useState<number | "">("");
    
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
                facultyId: Number(tempFacultyId)
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
    
    const getAvailableCapacity = (facultyId: number, excludeCourseId?: number) => {
        const faculty = faculties.find(f => f.id === facultyId);
        if (!faculty) return 0;
        
        const currentWorkload = courses
            .filter(c => c.facultyId === facultyId && c.id !== excludeCourseId)
            .reduce((sum, c) => sum + c.credits, 0);
            
        return faculty.maxWorkload - currentWorkload;
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
                                                    onChange={(e) => setTempFacultyId(e.target.value === "" ? "" : Number(e.target.value))}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                                >
                                                    <option value="">Select faculty</option>
                                                    {faculties.map((f) => (
                                                        <option key={f.id} value={f.id}>
                                                            {f.name} ({getAvailableCapacity(f.id, course.id)} credits available)
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
    // Sample data
    const [departments, setDepartments] = useState<Department[]>([
        {
            id: 1,
            name: "Computer Science & Engineering",
            code: "CSE",
            courses: [
                { id: 1, code: "CS101", name: "Intro to Programming", credits: 4, semester: 1, type: 'core', facultyId: 1 },
                { id: 2, code: "CS102", name: "Data Structures", credits: 4, semester: 2, type: 'core', facultyId: 2 },
            ],
        },
        {
            id: 2,
            name: "Electronics & Communication",
            code: "ECE",
            courses: [
                { id: 3, code: "EC101", name: "Circuit Theory", credits: 4, semester: 1, type: 'core', facultyId: 3 },
            ],
        },
        {
            id: 3,
            name: "Mechanical Engineering",
            code: "MECH",
            courses: [],
        },
    ]);

    const [programs] = useState<Program[]>([
        { id: 1, name: "Bachelor of Technology", code: "B.Tech", departmentId: 1 },
        { id: 2, name: "Master of Technology", code: "M.Tech", departmentId: 1 },
        { id: 3, name: "Bachelor of Technology", code: "B.Tech", departmentId: 2 },
        { id: 4, name: "Bachelor of Technology", code: "B.Tech", departmentId: 3 },
    ]);

    const [faculties, setFaculties] = useState<Faculty[]>([
        { id: 1, name: "Dr. John Smith", email: "john@college.edu", maxWorkload: 16, currentWorkload: 8 },
        { id: 2, name: "Dr. Sarah Johnson", email: "sarah@college.edu", maxWorkload: 18, currentWorkload: 12 },
        { id: 3, name: "Dr. Mike Wilson", email: "mike@college.edu", maxWorkload: 16, currentWorkload: 4 },
        { id: 4, name: "Dr. Emily Brown", email: "emily@college.edu", maxWorkload: 20, currentWorkload: 16 },
    ]);

    const [allCourses, setAllCourses] = useState<Course[]>([
        { id: 1, code: "CS101", name: "Intro to Programming", credits: 4, semester: 1, type: 'core', facultyId: 1 },
        { id: 2, code: "CS102", name: "Data Structures", credits: 4, semester: 2, type: 'core', facultyId: 2 },
        { id: 3, code: "EC101", name: "Circuit Theory", credits: 4, semester: 1, type: 'core', facultyId: 3 },
        { id: 4, code: "CS201", name: "Algorithms", credits: 4, semester: 3, type: 'core', facultyId: 1 },
        { id: 5, code: "CS202", name: "Database Systems", credits: 4, semester: 3, type: 'dept_elective', facultyId: 2, capacity: 60 },
        { id: 6, code: "EC201", name: "Digital Electronics", credits: 4, semester: 2, type: 'core', facultyId: 3 },
        { id: 7, code: "ME101", name: "Engineering Mechanics", credits: 4, semester: 1, type: 'core', facultyId: 4 },
        { id: 8, code: "ME102", name: "Thermodynamics", credits: 4, semester: 2, type: 'open_elective', facultyId: 4, capacity: 40 },
    ]);

    const [selectedDeptId, setSelectedDeptId] = useState(1);
    const [selectedProgramId, setSelectedProgramId] = useState(1);
    const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [semesterFilter, setSemesterFilter] = useState<number | "">("");
    const [typeFilter, setTypeFilter] = useState<'core' | 'dept_elective' | 'open_elective' | "">("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCloneModal, setShowCloneModal] = useState(false);
    const [showElectiveBasketModal, setShowElectiveBasketModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isLocked, setIsLocked] = useState(false); // Lock mapping after semester start

    const selectedDept = useMemo(
        () => departments.find((d) => d.id === selectedDeptId) || null,
        [departments, selectedDeptId]
    );

    // Sync selected courses when department changes
    useEffect(() => {
        if (selectedDept) {
            const currentCourses = selectedDept.courses?.map((c) => c.id) || [];
            setSelectedCourses(currentCourses);
            setHasUnsavedChanges(false);
        }
    }, [selectedDeptId, selectedDept]);

    // Track changes
    useEffect(() => {
        if (selectedDept) {
            const originalCourses = selectedDept.courses?.map((c) => c.id) || [];
            const hasChanges =
                JSON.stringify([...selectedCourses].sort()) !==
                JSON.stringify([...originalCourses].sort());
            setHasUnsavedChanges(hasChanges);

        }
    }, [selectedCourses, selectedDept]);

    const availablePrograms = useMemo(() => {
        return programs.filter(p => p.departmentId === selectedDeptId);
    }, [programs, selectedDeptId]);

    const filteredCourses = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return allCourses.filter(
            (course) =>
                (q === "" ||
                    course.name.toLowerCase().includes(q) ||
                    course.code.toLowerCase().includes(q)) &&
                (semesterFilter === "" || course.semester === semesterFilter) &&
                (typeFilter === "" || course.type === typeFilter)
        );
    }, [allCourses, searchQuery, semesterFilter, typeFilter]);

    const toggleCourse = (id: number) => {
        setSelectedCourses((prev) =>
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
        );
    };

    const handleSaveMapping = () => {
        if (!selectedDept) return;

        const mapped = allCourses.filter((c) => selectedCourses.includes(c.id));
        setDepartments((prev) =>
            prev.map((d) => (d.id === selectedDept.id ? { ...d, courses: mapped } : d))
        );
        setHasUnsavedChanges(false);
    };

    const handleReset = () => {
        if (selectedDept) {
            setSelectedCourses(selectedDept.courses?.map((c) => c.id) || []);
            setHasUnsavedChanges(false);
        }
    };

    const handleCreateCourse = (course: Course) => {
        setAllCourses((prev) => [...prev, course]);
        // Update faculty workload
        setFaculties(prev => prev.map(f => 
            f.id === course.facultyId 
                ? { ...f, currentWorkload: f.currentWorkload + course.credits }
                : f
        ));
    };

    const handleUpdateCourse = (updatedCourse: Course) => {
        const originalCourse = allCourses.find(c => c.id === updatedCourse.id);
        
        setAllCourses((prev) => prev.map(c => 
            c.id === updatedCourse.id ? updatedCourse : c
        ));
        
        // Update faculty workload
        if (originalCourse && originalCourse.facultyId !== updatedCourse.facultyId) {
            setFaculties(prev => prev.map(f => {
                // Remove credits from old faculty
                if (f.id === originalCourse.facultyId) {
                    return { ...f, currentWorkload: f.currentWorkload - originalCourse.credits };
                }
                // Add credits to new faculty
                if (f.id === updatedCourse.facultyId) {
                    return { ...f, currentWorkload: f.currentWorkload + updatedCourse.credits };
                }
                return f;
            }));
        } else if (originalCourse && originalCourse.credits !== updatedCourse.credits) {
            // Same faculty, different credits
            const creditDiff = updatedCourse.credits - originalCourse.credits;
            setFaculties(prev => prev.map(f => 
                f.id === updatedCourse.facultyId 
                    ? { ...f, currentWorkload: f.currentWorkload + creditDiff }
                    : f
            ));
        }
        
        setEditingCourse(null);
    };

    const handleEditCourse = (course: Course) => {
        setEditingCourse(course);
        setShowAddModal(true);
    };

    const handleCloneSemester = (fromSemester: number, toSemester: number) => {
        if (!selectedDept) return;
        
        const semesterCourses = selectedDept.courses?.filter(c => c.semester === fromSemester) || [];
        const clonedCourses = semesterCourses.map(course => ({
            ...course,
            id: Date.now() + Math.random(),
            semester: toSemester,
            code: course.code.replace(/\d+/, toSemester.toString().padStart(2, '0'))
        }));
        
        setAllCourses(prev => [...prev, ...clonedCourses]);
        setShowCloneModal(false);
    };

    const handleToggleLock = () => {
        setIsLocked(!isLocked);
    };

    const handleSelectAll = () => {
        const allIds = filteredCourses.map((c) => c.id);
        setSelectedCourses((prev) => {
            const newSet = new Set([...prev, ...allIds]);
            return Array.from(newSet);
        });
    };

    const handleClearAll = () => {
        const filteredIds = filteredCourses.map((c) => c.id);
        setSelectedCourses((prev) => prev.filter((id) => !filteredIds.includes(id)));
    };

    // Stats
    const totalAvailableCourses = allCourses.length;
    const totalMappedCourses = selectedCourses.length;
    // const unmappedCourses = filteredCourses.filter(
    //     (c) => !selectedCourses.includes(c.id)
    // ).length;

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
                            disabled={isLocked}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <PlusCircleIcon className="h-5 w-5" />
                            Add Course
                        </button>
                        
                        <button
                            onClick={() => setShowCloneModal(true)}
                            disabled={isLocked}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <ArrowPathIcon className="h-5 w-5" />
                            Clone Semester
                        </button>
                        
                        <button
                            onClick={() => setShowElectiveBasketModal(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
                        >
                            <BookOpenIcon className="h-5 w-5" />
                            Elective Basket
                        </button>
                        
                        <button
                            onClick={handleToggleLock}
                            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition-all ${
                                isLocked 
                                    ? 'bg-red-600 text-white hover:bg-red-700' 
                                    : 'border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                            }`}
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
                                Select Department
                            </label>
                            <select
                                value={selectedDeptId}
                                onChange={(e) => {
                                    setSelectedDeptId(parseInt(e.target.value));
                                    setSelectedProgramId(programs.find(p => p.departmentId === parseInt(e.target.value))?.id || 1);
                                }}
                                disabled={isLocked}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                {departments.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name} ({d.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-3">
                                Select Program
                            </label>
                            <select
                                value={selectedProgramId}
                                onChange={(e) => setSelectedProgramId(parseInt(e.target.value))}
                                disabled={isLocked}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                {availablePrograms.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} ({p.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3">
                        <StatsCard
                            label="Available Courses"
                            value={totalAvailableCourses}
                            icon={BookOpenIcon}
                            color="blue"
                        />
                        <StatsCard
                            label="Mapped Courses"
                            value={totalMappedCourses}
                            icon={CheckCircleIcon}
                            color="green"
                        />
                        <StatsCard
                            label="Showing"
                            value={filteredCourses.length}
                            icon={MagnifyingGlassIcon}
                            color="amber"
                        />
                    </div>



                    {/* Status Card */}
                    {selectedDept && (
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
                                        {selectedDept.name}
                                    </h3>
                                    <p className={`text-xs ${
                                        isLocked ? 'text-red-700' : 'text-indigo-700'
                                    }`}>
                                        Department Code: {selectedDept.code}
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
                                {isLocked ? (
                                    <p className="text-xs font-medium text-red-800 flex items-center gap-2">
                                        🔒 Mapping is locked - semester has started
                                    </p>
                                ) : hasUnsavedChanges ? (
                                    <p className="text-xs font-medium text-indigo-800">
                                        ⚠️ You have unsaved changes
                                    </p>
                                ) : (
                                    <p className="text-xs font-medium text-indigo-800">
                                        ✅ All changes saved
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </aside>

                {/* MAIN CONTENT */}
                <section className="flex-1 rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    {/* Search & Filters Bar */}
                    <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 space-y-4">
                        {/* Search and Filters Row */}
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search Bar */}
                            <div className="flex-1">
                                <SearchBar
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    placeholder="Search courses by name or code..."
                                />
                            </div>
                            
                            {/* Filters */}
                            <div className="flex flex-col sm:flex-row gap-3 lg:w-auto">
                                <div className="min-w-0 sm:w-40">
                                    <select
                                        value={semesterFilter as any}
                                        onChange={(e) =>
                                            setSemesterFilter(
                                                e.target.value === "" ? "" : parseInt(e.target.value)
                                            )
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                                    >
                                        <option value="">All Semesters</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                            <option key={s} value={s}>
                                                Semester {s}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="min-w-0 sm:w-44">
                                    <select
                                        value={typeFilter as any}
                                        onChange={(e) => setTypeFilter(e.target.value as any)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                                    >
                                        <option value="">All Types</option>
                                        <option value="core">Core</option>
                                        <option value="dept_elective">Department Elective</option>
                                        <option value="open_elective">Open Elective</option>
                                    </select>
                                </div>
                                
                                {(semesterFilter !== "" || typeFilter !== "") && (
                                    <div className="flex items-center">
                                        <button
                                            onClick={() => {
                                                setSemesterFilter("");
                                                setTypeFilter("");
                                            }}
                                            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors h-[38px]"
                                        >
                                            <XMarkIcon className="h-4 w-4" />
                                            Clear
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions Row */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="font-medium">
                                    {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""}
                                </span>
                                {(searchQuery || semesterFilter !== "" || typeFilter !== "") && <span className="text-gray-400">• filtered</span>}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={handleSelectAll}
                                    disabled={isLocked}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    <CheckIcon className="h-3.5 w-3.5" />
                                    Select All
                                </button>
                                <button
                                    onClick={handleClearAll}
                                    disabled={isLocked}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    <XMarkIcon className="h-3.5 w-3.5" />
                                    Clear All
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Courses Grid */}
                    <div className="flex-1 overflow-y-auto p-5">
                        {filteredCourses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="p-4 bg-gray-100 rounded-full mb-4">
                                    <BookOpenIcon className="h-12 w-12 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    No courses found
                                </h3>
                                <p className="text-sm text-gray-500 max-w-sm">
                                    {searchQuery || semesterFilter !== ""
                                        ? "Try adjusting your search or filter criteria"
                                        : "Get started by adding your first course"}
                                </p>
                                {!searchQuery && semesterFilter === "" && (
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
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {filteredCourses.map((course) => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        isSelected={selectedCourses.includes(course.id)}
                                        onToggle={() => !isLocked && toggleCourse(course.id)}
                                        onEdit={handleEditCourse}
                                        faculties={faculties}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions Footer */}
                    <div className="border-t border-gray-200 px-5 py-4 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold text-gray-900">
                                {selectedCourses.length}
                            </span>{" "}
                            course{selectedCourses.length !== 1 ? "s" : ""} selected
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={handleReset}
                                disabled={!hasUnsavedChanges || isLocked}
                                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Reset
                            </button>
                            <button
                                onClick={handleSaveMapping}
                                disabled={!hasUnsavedChanges || isLocked}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                <CheckCircleIcon className="h-5 w-5" />
                                Save Mapping
                            </button>
                        </div>
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
        </div>
    );
};

export default CourseMapping;