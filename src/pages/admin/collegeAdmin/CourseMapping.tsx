import React, { useEffect, useMemo, useState } from "react";
import {
    FunnelIcon,
    PlusCircleIcon,
    PencilSquareIcon,
    TrashIcon,
    CheckCircleIcon,
    XMarkIcon,
    ChevronDownIcon,
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


const FilterSection = ({ title, children, defaultOpen = false }: any) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
                <span className="text-sm font-semibold text-gray-800">{title}</span>
                <ChevronDownIcon
                    className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""
                        }`}
                />
            </button>
            {open && <div className="border-t border-gray-100 px-4 py-3">{children}</div>}
        </div>
    );
};

/* ==============================
   ADD / EDIT MODAL WRAPPER
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-6">{children}</div>
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

    const handleSubmit = () => {
        if (!code || !name || credits === "" || semester === "") {
            setError("Please fill in all required fields.");
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
            onClose();
            setCode("");
            setName("");
            setCredits("");
            setSemester("");
        }, 400);
    };

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            title="Add New Course"
            subtitle="Fill in the details below to create a course."
        >
            {error && (
                <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className="text-xs font-medium text-gray-700">Course Code *</label>
                    <input
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        placeholder="CS101"
                    />
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-700">Credits *</label>
                    <input
                        type="number"
                        value={credits}
                        onChange={(e) =>
                            setCredits(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        placeholder="4"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-gray-700">Course Name *</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        placeholder="Introduction to Programming"
                    />
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-700">Semester *</label>
                    <select
                        value={semester as any}
                        onChange={(e) =>
                            setSemester(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Select</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                            <option key={s} value={s}>
                                Semester {s}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
                <button
                    onClick={onClose}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-gray-400"
                >
                    {submitting ? "Adding..." : "Add Course"}
                </button>
            </div>
        </ModalWrapper>
    );
};

/* ==============================
   MAIN PAGE
   ============================== */
const CourseMapping: React.FC = () => {
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
            courses: [{ id: 3, code: "EC101", name: "Circuit Theory", credits: 4, semester: 1 }],
        },
    ]);

    const [allCourses, setAllCourses] = useState<Course[]>([
        { id: 1, code: "CS101", name: "Intro to Programming", credits: 4, semester: 1 },
        { id: 2, code: "CS102", name: "Data Structures", credits: 4, semester: 2 },
        { id: 3, code: "EC101", name: "Circuit Theory", credits: 4, semester: 1 },
    ]);

    const [selectedDeptId, setSelectedDeptId] = useState(1);
    const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [semesterFilter, setSemesterFilter] = useState<number | "">("");
    const [showAddModal, setShowAddModal] = useState(false);

    const selectedDept = useMemo(
        () => departments.find((d) => d.id === selectedDeptId) || null,
        [departments, selectedDeptId]
    );

    useEffect(() => {
        if (selectedDept) setSelectedCourses(selectedDept.courses?.map((c) => c.id) || []);
    }, [selectedDeptId]);

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

    const toggleCourse = (id: number) =>
        setSelectedCourses((prev) =>
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
        );

    const handleSaveMapping = () => {
        if (!selectedDept) return;
        const mapped = allCourses.filter((c) => selectedCourses.includes(c.id));
        setDepartments((prev) =>
            prev.map((d) => (d.id === selectedDept.id ? { ...d, courses: mapped } : d))
        );
    };

    const handleCreateCourse = (course: Course) =>
        setAllCourses((prev) => [...prev, course]);

    /* ==============================
       UI
       ============================== */
    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* HEADER */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between shadow-sm">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Course Mapping</h1>
                    <p className="text-sm text-gray-500">
                        Manage, filter, and assign courses to departments.
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-3 sm:mt-0 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 transition-all"
                >
                    <PlusCircleIcon className="h-4 w-4" />
                    Add Course
                </button>
            </header>

            <main className="flex flex-1 flex-col lg:flex-row gap-6 p-6">
                {/* Sidebar */}
                <aside className="w-full lg:w-80 space-y-5">
                    <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4">
                        <label className="text-xs font-semibold text-gray-700">Department</label>
                        <select
                            value={selectedDeptId}
                            onChange={(e) => setSelectedDeptId(parseInt(e.target.value))}
                            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            {departments.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name} ({d.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    <FilterSection title="Filters" defaultOpen>
                        <div className="space-y-3">
                            <select
                                value={semesterFilter as any}
                                onChange={(e) =>
                                    setSemesterFilter(e.target.value === "" ? "" : parseInt(e.target.value))
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">All Semesters</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                    <option key={s} value={s}>
                                        Semester {s}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => setSemesterFilter("")}
                                className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <FunnelIcon className="h-4 w-4" />
                                Clear Filter
                            </button>
                        </div>
                    </FilterSection>

                    {selectedDept && (
                        <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-sm text-indigo-800">
                            <p>
                                <span className="font-semibold">Mapped:</span>{" "}
                                {selectedDept.courses?.length || 0}
                            </p>
                            <p>
                                <span className="font-semibold">Selected:</span>{" "}
                                {selectedCourses.length}
                            </p>
                        </div>
                    )}
                </aside>

                {/* Main Section */}
                <section className="flex-1 rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search by code or name..."
                        />
                        <div className="flex gap-3 text-sm">
                            <button
                                onClick={() => setSelectedCourses(allCourses.map((c) => c.id))}
                                className="text-indigo-600 hover:underline"
                            >
                                Select all
                            </button>
                            <button
                                onClick={() => setSelectedCourses([])}
                                className="text-gray-600 hover:underline"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
                        {filteredCourses.length === 0 ? (
                            <div className="p-10 text-center text-gray-500">No courses found.</div>
                        ) : (
                            filteredCourses.map((course) => {
                                const checked = selectedCourses.includes(course.id);
                                return (
                                    <div
                                        key={course.id}
                                        className={`flex items-center justify-between px-6 py-3 transition ${checked ? "bg-indigo-50" : "hover:bg-gray-50"
                                            }`}
                                    >
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleCourse(course.id)}
                                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {course.code} — {course.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {course.credits} Credits • Semester {course.semester}
                                                </p>
                                            </div>
                                        </label>
                                        {checked && <CheckCircleIcon className="h-5 w-5 text-indigo-600" />}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
                        <button
                            onClick={() =>
                                setSelectedCourses(selectedDept?.courses?.map((c) => c.id) || [])
                            }
                            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleSaveMapping}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            Save Mapping
                        </button>
                    </div>
                </section>
            </main>

            <AddCourseModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCreated={handleCreateCourse}
            />
        </div>
    );
};

export default CourseMapping;
