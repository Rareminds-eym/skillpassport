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
  batch: string;
  mentorId?: number;
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
  allocationPeriod?: {
    startDate: string;
    endDate: string;
  };
}

interface MentorNote {
  id: number;
  mentorId: number;
  studentId: number;
  note: string;
  date: string;
  outcome: string;
  isPrivate: boolean;
  interventionType: 'academic' | 'personal' | 'career' | 'attendance' | 'other';
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
      allocationPeriod: {
        startDate: "2024-01-01",
        endDate: "2024-06-30",
      },
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
      allocationPeriod: {
        startDate: "2024-01-01",
        endDate: "2024-06-30",
      },
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
      batch: "2021-2025",
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
      batch: "2021-2025",
    },
    {
      id: 3,
      name: "Rahul Singh",
      rollNo: "CS2022001",
      department: "Computer Science",
      semester: 3,
      cgpa: 6.8,
      atRisk: true,
      email: "rahul.singh@student.edu",
      batch: "2022-2026",
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
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [studentToReassign, setStudentToReassign] = useState<Student | null>(null);
  const [interventionType, setInterventionType] = useState<'academic' | 'personal' | 'career' | 'attendance' | 'other'>('academic');
  const [isPrivateNote, setIsPrivateNote] = useState(false);

  const filteredMentors = useMemo(() => {
    return mentors.filter(
      (m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [mentors, searchQuery]);

  const filteredStudents = useMemo(() => {
    return availableStudents.filter(student => 
      selectedBatch === "all" || student.batch === selectedBatch
    );
  }, [availableStudents, selectedBatch]);

  const uniqueBatches = useMemo(() => {
    return Array.from(new Set(availableStudents.map(s => s.batch)));
  }, [availableStudents]);

  const handleAllocateStudents = (mentorId: number, studentIds: number[]) => {
    const mentor = mentors.find(m => m.id === mentorId);
    if (!mentor) return;

    const newStudentsCount = studentIds.length;
    if (mentor.currentLoad + newStudentsCount > mentor.capacity) {
      alert(`Cannot allocate ${newStudentsCount} students. Mentor capacity exceeded. Available slots: ${mentor.capacity - mentor.currentLoad}`);
      return;
    }

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
      isPrivate: isPrivateNote,
      interventionType: interventionType,
    };

    setNotes([...notes, newNote]);
    setNoteText("");
    setNoteOutcome("");
    setInterventionType('academic');
    setIsPrivateNote(false);
    setShowNoteModal(false);
  };

  const handleReassignStudent = (newMentorId: number) => {
    if (!studentToReassign) return;

    setMentors(prev => prev.map(mentor => {
      // Remove student from current mentor
      if (mentor.students.some(s => s.id === studentToReassign.id)) {
        return {
          ...mentor,
          students: mentor.students.filter(s => s.id !== studentToReassign.id),
          currentLoad: mentor.currentLoad - 1
        };
      }
      // Add student to new mentor
      if (mentor.id === newMentorId) {
        return {
          ...mentor,
          students: [...mentor.students, studentToReassign],
          currentLoad: mentor.currentLoad + 1
        };
      }
      return mentor;
    }));

    setShowReassignModal(false);
    setStudentToReassign(null);
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
          <div className="flex gap-3">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Batches</option>
              {uniqueBatches.map(batch => (
                <option key={batch} value={batch}>{batch}</option>
              ))}
            </select>
            <button
              onClick={() => setShowAllocationModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <PlusCircleIcon className="h-5 w-5" />
              Allocate Students
            </button>
          </div>
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
                  {mentor.allocationPeriod && (
                    <p className="text-xs text-blue-600 mt-1">
                      Period: {new Date(mentor.allocationPeriod.startDate).toLocaleDateString()} - {new Date(mentor.allocationPeriod.endDate).toLocaleDateString()}
                    </p>
                  )}
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
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {student.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {student.rollNo} • {student.batch}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {student.atRisk && (
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                        )}
                        <button
                          onClick={() => {
                            setSelectedMentor(mentor);
                            setSelectedStudent(student);
                            setShowNoteModal(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Add Note"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setStudentToReassign(student);
                            setShowReassignModal(true);
                          }}
                          className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                          title="Reassign"
                        >
                          <UserGroupIcon className="h-4 w-4" />
                        </button>
                      </div>
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
          availableStudents={filteredStudents}
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
          interventionType={interventionType}
          isPrivateNote={isPrivateNote}
          onNoteChange={setNoteText}
          onOutcomeChange={setNoteOutcome}
          onInterventionTypeChange={setInterventionType}
          onPrivateChange={setIsPrivateNote}
          onClose={() => {
            setShowNoteModal(false);
            setSelectedMentor(null);
            setSelectedStudent(null);
          }}
          onSave={handleAddNote}
        />
      )}

      {/* Reassign Modal */}
      {showReassignModal && studentToReassign && (
        <ReassignModal
          student={studentToReassign}
          mentors={mentors}
          onClose={() => {
            setShowReassignModal(false);
            setStudentToReassign(null);
          }}
          onReassign={handleReassignStudent}
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
                    {student.rollNo} • {student.department} • {student.batch} • CGPA: {student.cgpa}
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
  interventionType,
  isPrivateNote,
  onNoteChange,
  onOutcomeChange,
  onInterventionTypeChange,
  onPrivateChange,
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
            <p className="text-gray-900 font-medium">{student?.name}</p>
            <p className="text-sm text-gray-600">{student?.rollNo} • {student?.batch}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Intervention Type
            </label>
            <select
              value={interventionType}
              onChange={(e) => onInterventionTypeChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="academic">Academic Support</option>
              <option value="personal">Personal Counseling</option>
              <option value="career">Career Guidance</option>
              <option value="attendance">Attendance Issues</option>
              <option value="other">Other</option>
            </select>
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
              placeholder="Enter detailed mentoring notes..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Outcome/Action Taken
            </label>
            <input
              type="text"
              value={noteOutcome}
              onChange={(e) => onOutcomeChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Improved attendance, Career guidance provided"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="privateNote"
              checked={isPrivateNote}
              onChange={(e) => onPrivateChange(e.target.checked)}
              className="h-4 w-4 text-purple-600 rounded"
            />
            <label htmlFor="privateNote" className="text-sm text-gray-700">
              Mark as private note (visible only to mentor and admin)
            </label>
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

// Reassign Modal Component
const ReassignModal = ({ student, mentors, onClose, onReassign }: any) => {
  const [selectedMentorId, setSelectedMentorId] = useState<number | null>(null);

  const availableMentors = mentors.filter((m: Mentor) => 
    m.currentLoad < m.capacity && !m.students.some(s => s.id === student.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Reassign Student</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student to Reassign
            </label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{student.name}</p>
              <p className="text-sm text-gray-600">{student.rollNo} • {student.batch}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select New Mentor
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableMentors.length === 0 ? (
                <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                  No mentors available with capacity
                </p>
              ) : (
                availableMentors.map((mentor: Mentor) => (
                  <label
                    key={mentor.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="mentor"
                        value={mentor.id}
                        checked={selectedMentorId === mentor.id}
                        onChange={() => setSelectedMentorId(mentor.id)}
                        className="h-4 w-4 text-purple-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{mentor.name}</p>
                        <p className="text-sm text-gray-600">{mentor.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {mentor.currentLoad}/{mentor.capacity}
                      </p>
                      <p className="text-xs text-gray-500">Capacity</p>
                    </div>
                  </label>
                ))
              )}
            </div>
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
            onClick={() => selectedMentorId && onReassign(selectedMentorId)}
            disabled={!selectedMentorId}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            Reassign
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentorAllocation;
