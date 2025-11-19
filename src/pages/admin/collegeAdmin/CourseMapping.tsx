/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import {
    PlusCircleIcon,
    XMarkIcon,
    ChevronDownIcon,
    BookOpenIcon,
    CheckCircleIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    InformationCircleIcon,
    AcademicCapIcon,
    CheckIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import SearchBar from "../../../components/common/SearchBar";

interface Course {
    id: number;
    code: string;
    name: string;
    credits: number;
    semester: number;
}

interface Department {
    id: number;
    name: string;
    code: string;
    courses?: Course[];
}

/* ==============================
   FILTER SECTION COMPONENT
   ============================== */
const FilterSection = ({ title, children, defaultOpen = false }: any) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
                <span className="text-sm font-semibold text-gray-900">{title}</span>
                <ChevronDownIcon
                    className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""
                        }`}
                />
            </button>
            {open && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                    {children}
                </div>
            )}
        </div>
    );
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
   ADD COURSE MODAL
   ============================== */
const AddCourseModal = ({
    isOpen,
    onClose,
    onCreated,
}: {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (course: Course) => void;
}) => {
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [credits, setCredits] = useState<number | "">("");
    const [semester, setSemester] = useState<number | "">("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const resetForm = () => {
        setCode("");
        setName("");
        setCredits("");
        setSemester("");
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = () => {
        if (!code || !name || credits === "" || semester === "") {
            setError("Please fill in all required fields.");
            return;
        }

        if (Number(credits) <= 0 || Number(credits) > 20) {
            setError("Credits must be between 1 and 20.");
            return;
        }

        setError(null);
        setSubmitting(true);

        setTimeout(() => {
            onCreated({
                id: Date.now(),
                code: code.trim().toUpperCase(),
                name: name.trim(),
                credits: Number(credits),
                semester: Number(semester),
            });
            setSubmitting(false);
            handleClose();
        }, 400);
    };

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={handleClose}
            title="Add New Course"
            subtitle="Create a new course to add to your course library"
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
                            Adding...
                        </>
                    ) : (
                        <>
                            <CheckIcon className="h-4 w-4" />
                            Add Course
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
}: {
    course: Course;
    isSelected: boolean;
    onToggle: () => void;
}) => {
    return (
        <div
            onClick={onToggle}
            className={`group relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${isSelected
                ? "border-indigo-500 bg-indigo-50 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
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
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${isSelected
                                    ? "bg-indigo-600 text-white"
                                    : "bg-gray-100 text-gray-700"
                                    }`}
                            >
                                {course.code}
                            </span>
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                            {course.name}
                        </h4>
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
                    </div>
                </div>

                {/* Selected Badge */}
                {isSelected && (
                    <div className="flex-shrink-0">
                        <CheckCircleIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                )}
            </div>
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
                { id: 1, code: "CS101", name: "Intro to Programming", credits: 4, semester: 1 },
                { id: 2, code: "CS102", name: "Data Structures", credits: 4, semester: 2 },
            ],
        },
        {
            id: 2,
            name: "Electronics & Communication",
            code: "ECE",
            courses: [
                { id: 3, code: "EC101", name: "Circuit Theory", credits: 4, semester: 1 },
            ],
        },
        {
            id: 3,
            name: "Mechanical Engineering",
            code: "MECH",
            courses: [],
        },
    ]);

    const [allCourses, setAllCourses] = useState<Course[]>([
        { id: 1, code: "CS101", name: "Intro to Programming", credits: 4, semester: 1 },
        { id: 2, code: "CS102", name: "Data Structures", credits: 4, semester: 2 },
        { id: 3, code: "EC101", name: "Circuit Theory", credits: 4, semester: 1 },
        { id: 4, code: "CS201", name: "Algorithms", credits: 4, semester: 3 },
        { id: 5, code: "CS202", name: "Database Systems", credits: 4, semester: 3 },
        { id: 6, code: "EC201", name: "Digital Electronics", credits: 4, semester: 2 },
        { id: 7, code: "ME101", name: "Engineering Mechanics", credits: 4, semester: 1 },
        { id: 8, code: "ME102", name: "Thermodynamics", credits: 4, semester: 2 },
    ]);

    const [selectedDeptId, setSelectedDeptId] = useState(1);
    const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [semesterFilter, setSemesterFilter] = useState<number | "">("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

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
            setSaveSuccess(false);
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
            if (hasChanges) setSaveSuccess(false);
        }
    }, [selectedCourses, selectedDept]);

    const filteredCourses = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return allCourses.filter(
            (course) =>
                (q === "" ||
                    course.name.toLowerCase().includes(q) ||
                    course.code.toLowerCase().includes(q)) &&
                (semesterFilter === "" || course.semester === semesterFilter)
        );
    }, [allCourses, searchQuery, semesterFilter]);

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
        setSaveSuccess(true);

        setTimeout(() => setSaveSuccess(false), 3000);
    };

    const handleReset = () => {
        if (selectedDept) {
            setSelectedCourses(selectedDept.courses?.map((c) => c.id) || []);
            setHasUnsavedChanges(false);
        }
    };

    const handleCreateCourse = (course: Course) => {
        setAllCourses((prev) => [...prev, course]);
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
        <div className="flex flex-col h-screen p-4 sm:p-6 lg:p-8">
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

                    {/* Add Course Button */}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                        <PlusCircleIcon className="h-5 w-5" />
                        Add Course
                    </button>
                </div>
            </div>


            <main className="flex flex-1 flex-col lg:flex-row gap-6 py-4 sm:py-6 lg:py-8">
                {/* LEFT SIDEBAR */}
                <aside className="w-full lg:w-80 space-y-5 flex-shrink-0">
                    {/* Department Selector */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Select Department
                        </label>
                        <select
                            value={selectedDeptId}
                            onChange={(e) => setSelectedDeptId(parseInt(e.target.value))}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                        >
                            {departments.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name} ({d.code})
                                </option>
                            ))}
                        </select>
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

                    {/* Filters */}
                    <FilterSection title="Filter by Semester" defaultOpen>
                        <div className="space-y-2">
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
                            {semesterFilter !== "" && (
                                <button
                                    onClick={() => setSemesterFilter("")}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                    Clear Filter
                                </button>
                            )}
                        </div>
                    </FilterSection>

                    {/* Info Card */}
                    {selectedDept && (
                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200 p-5">
                            <div className="flex items-start gap-3 mb-3">
                                <InformationCircleIcon className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-semibold text-indigo-900 mb-1">
                                        {selectedDept.name}
                                    </h3>
                                    <p className="text-xs text-indigo-700">
                                        Department Code: {selectedDept.code}
                                    </p>
                                </div>
                            </div>
                            {hasUnsavedChanges && (
                                <div className="mt-3 pt-3 border-t border-indigo-200">
                                    <p className="text-xs font-medium text-indigo-800">
                                        ⚠️ You have unsaved changes
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </aside>

                {/* MAIN CONTENT */}
                <section className="flex-1 rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    {/* Search & Actions Bar */}
                    <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 space-y-4">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search courses by name or code..."
                        />

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="font-medium">
                                    {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""}
                                </span>
                                {searchQuery && <span className="text-gray-400">• filtered</span>}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={handleSelectAll}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <CheckIcon className="h-3.5 w-3.5" />
                                    Select All
                                </button>
                                <button
                                    onClick={handleClearAll}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredCourses.map((course) => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        isSelected={selectedCourses.includes(course.id)}
                                        onToggle={() => toggleCourse(course.id)}
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
                                disabled={!hasUnsavedChanges}
                                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Reset
                            </button>
                            <button
                                onClick={handleSaveMapping}
                                disabled={!hasUnsavedChanges}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                <CheckCircleIcon className="h-5 w-5" />
                                Save Mapping
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Add Course Modal */}
            <AddCourseModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCreated={handleCreateCourse}
            />
        </div>
    );
};

export default CourseMapping;