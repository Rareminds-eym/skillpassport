/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
import {
  UserGroupIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  TrashIcon,
  UserIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import SearchBar from "../../../components/common/SearchBar";

interface Student {
  id: number;
  name: string;
  rollNo: string;
  department: string;
  semester: number;
  cgpa: number;
  atRisk: boolean;
  email: string;
}

interface Mentor {
  id: number;
  name: string;
  email: string;
  department: string;
  designation: string;
  capacity: number;
  currentLoad: number;
  students: Student[];
}

interface MentorNote {
  id: number;
  mentorId: number;
  studentId: number;
  note: string;
  date: string;
  outcome: string;
}

const MentorAllocation: React.FC = () => {
  const [mentors, setMentors] = useState<Mentor[]>([
    {
      id: 1,
      name: "Dr. Rajesh Kumar",
      email: "rajesh.kumar@college.edu",
      department: "Computer Science",
      designation: "Associate Professor",
      capacity: 15,
      currentLoad: 12,
      students: [],
    },
    {
      id: 2,
      name: "Prof. Priya Sharma",
      email: "priya.sharma@college.edu",
      department: "Electronics",
      designation: "Assistant Professor",
      capacity: 12,
      currentLoad: 8,
      students: [],
    },
  ]);

  const [availableStudents] = useState<Student[]>([
    {
      id: 1,
      name: "Amit Patel",
      rollNo: "CS2021001",
      department: "Computer Science",
      semester: 5,
      cgpa: 7.2,
      atRisk: true,
      email: "amit.patel@student.edu",
    },
    {
      id: 2,
      name: "Sneha Reddy",
      rollNo: "CS2021002",
      department: "Computer Science",
      semester: 5,
      cgpa: 8.5,
      atRisk: false,
      email: "sneha.reddy@student.edu",
    },
  ]);

  const [notes, setNotes] = useState<MentorNote[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteOutcome, setNoteOutcome] = useState("");

  const filteredMentors = useMemo(() => {
    return mentors.filter(
      (m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [mentors, searchQuery]);

  const handleAllocateStudents = (mentorId: number, studentIds: number[]) => {
    setMentors((prev) =>
      prev.map((m) => {
        if (m.id === mentorId) {
          const newStudents = availableStudents.filter((s) =>
            studentIds.includes(s.id)
          );
          return {
            ...m,
            students: [...m.students, ...newStudents],
            currentLoad: m.currentLoad + newStudents.length,
          };
        }
        return m;
      })
    );
    setShowAllocationModal(false);
  };

  const handleAddNote = () => {
    if (!selectedMentor || !selectedStudent || !noteText) return;

    const newNote: MentorNote = {
      id: Date.now(),
      mentorId: selectedMentor.id,
      studentId: selectedStudent.id,
      note: noteText,
      date: new Date().toISOString().split("T")[0],
      outcome: noteOutcome,
    };

    setNotes([...notes, newNote]);
    setNoteText("");
    setNoteOutcome("");
    setShowNoteModal(false);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Mentor Allocation
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Assign mentors to students and track mentoring interventions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Mentors</p>
              <p className="text-2xl font-bold text-gray-900">{mentors.length}</p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Students Allocated</p>
              <p className="text-2xl font-bold text-gray-900">
                {mentors.reduce((sum, m) => sum + m.currentLoad, 0)}
              </p>
            </div>
            <AcademicCapIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">At-Risk Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {availableStudents.filter((s) => s.atRisk).length}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Notes</p>
              <p className="text-2xl font-bold text-gray-900">{notes.length}</p>
            </div>
            <PencilSquareIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search mentors..."
            />
          </div>
          <button
            onClick={() => setShowAllocationModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Allocate Students
          </button>
        </div>
      </div>

      {/* Mentors List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMentors.map((mentor) => (
          <div
            key={mentor.id}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{mentor.name}</h3>
                  <p className="text-sm text-gray-600">{mentor.designation}</p>
                  <p className="text-xs text-gray-500">{mentor.department}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {mentor.currentLoad}/{mentor.capacity}
                </p>
                <p className="text-xs text-gray-500">Capacity</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    mentor.currentLoad >= mentor.capacity
                      ? "bg-red-500"
                      : mentor.currentLoad >= mentor.capacity * 0.8
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{
                    width: `${(mentor.currentLoad / mentor.capacity) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
                Allocated Students ({mentor.students.length})
              </h4>
              {mentor.students.length === 0 ? (
                <p className="text-sm text-gray-500">No students allocated yet</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {mentor.students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {student.name}
                        </p>
                        <p className="text-xs text-gray-500">{student.rollNo}</p>
                      </div>
                      {student.atRisk && (
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setSelectedMentor(mentor);
                  setShowAllocationModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition text-sm"
              >
                <PlusCircleIcon className="h-4 w-4" />
                Add Students
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Allocation Modal */}
      {showAllocationModal && (
        <AllocationModal
          mentor={selectedMentor}
          availableStudents={availableStudents}
          onClose={() => {
            setShowAllocationModal(false);
            setSelectedMentor(null);
          }}
          onAllocate={handleAllocateStudents}
        />
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <NoteModal
          mentor={selectedMentor}
          student={selectedStudent}
          noteText={noteText}
          noteOutcome={noteOutcome}
          onNoteChange={setNoteText}
          onOutcomeChange={setNoteOutcome}
          onClose={() => {
            setShowNoteModal(false);
            setSelectedMentor(null);
            setSelectedStudent(null);
          }}
          onSave={handleAddNote}
        />
      )}
    </div>
  );
};

// Allocation Modal Component
const AllocationModal = ({ mentor, availableStudents, onClose, onAllocate }: any) => {
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStudents = availableStudents.filter(
    (s: Student) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = (id: number) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Allocate Students {mentor ? `to ${mentor.name}` : ""}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search students..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2 mb-4">
          {filteredStudents.map((student: Student) => (
            <label
              key={student.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(student.id)}
                  onChange={() => handleToggle(student.id)}
                  className="h-4 w-4 text-purple-600 rounded"
                />
                <div>
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-sm text-gray-600">
                    {student.rollNo} • {student.department} • CGPA: {student.cgpa}
                  </p>
                </div>
              </div>
              {student.atRisk && (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                  At Risk
                </span>
              )}
            </label>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {selectedStudents.length} student(s) selected
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (mentor) {
                  onAllocate(mentor.id, selectedStudents);
                }
              }}
              disabled={selectedStudents.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              Allocate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Note Modal Component
const NoteModal = ({
  mentor,
  student,
  noteText,
  noteOutcome,
  onNoteChange,
  onOutcomeChange,
  onClose,
  onSave,
}: any) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Add Mentoring Note</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student
            </label>
            <p className="text-gray-900">{student?.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note
            </label>
            <textarea
              value={noteText}
              onChange={(e) => onNoteChange(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Enter mentoring notes..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Outcome
            </label>
            <input
              type="text"
              value={noteOutcome}
              onChange={(e) => onOutcomeChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Improved attendance, Career guidance provided"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!noteText}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentorAllocation;
