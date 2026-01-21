import React, { useState } from 'react';
import {
  DocumentTextIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import SearchBar from '../../../components/common/SearchBar';

interface Student {
  id: number;
  name: string;
  rollNo: string;
  department: string;
  program: string;
  cgpa: number;
  creditsEarned: number;
  creditsRequired: number;
  backlogs: number;
  eligible: boolean;
}

interface Transcript {
  id: number;
  studentId: number;
  type: 'provisional' | 'final';
  generatedDate: string;
  status: 'pending' | 'approved' | 'published';
  verificationId: string;
}

const TranscriptGeneration: React.FC = () => {
  const [students] = useState<Student[]>([
    {
      id: 1,
      name: 'Rahul Sharma',
      rollNo: 'CS2020001',
      department: 'Computer Science',
      program: 'B.Tech',
      cgpa: 8.5,
      creditsEarned: 160,
      creditsRequired: 160,
      backlogs: 0,
      eligible: true,
    },
    {
      id: 2,
      name: 'Priya Patel',
      rollNo: 'EC2020015',
      department: 'Electronics',
      program: 'B.Tech',
      cgpa: 7.8,
      creditsEarned: 155,
      creditsRequired: 160,
      backlogs: 1,
      eligible: false,
    },
  ]);

  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'provisional' | 'final'>('provisional');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);

  const handleGenerateTranscript = (studentId: number) => {
    const newTranscript: Transcript = {
      id: Date.now(),
      studentId,
      type: selectedType,
      generatedDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      verificationId: `VER${Date.now()}`,
    };
    setTranscripts([...transcripts, newTranscript]);
  };

  const handleBatchGenerate = () => {
    const newTranscripts = selectedStudents.map((studentId) => ({
      id: Date.now() + studentId,
      studentId,
      type: selectedType,
      generatedDate: new Date().toISOString().split('T')[0],
      status: 'pending' as const,
      verificationId: `VER${Date.now() + studentId}`,
    }));
    setTranscripts([...transcripts, ...newTranscripts]);
    setSelectedStudents([]);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Transcript Generation</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Generate official transcripts for students
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Eligible Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {students.filter((s) => s.eligible).length}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Generated</p>
              <p className="text-2xl font-bold text-gray-900">{transcripts.length}</p>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-900">
                {transcripts.filter((t) => t.status === 'pending').length}
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Published</p>
              <p className="text-2xl font-bold text-gray-900">
                {transcripts.filter((t) => t.status === 'published').length}
              </p>
            </div>
            <AcademicCapIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search students..."
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="provisional">Provisional</option>
            <option value="final">Final</option>
          </select>
        </div>

        {selectedStudents.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">{selectedStudents.length} student(s) selected</p>
            <button
              onClick={handleBatchGenerate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              Generate Batch
            </button>
          </div>
        )}
      </div>

      {/* Students List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudents(students.map((s) => s.id));
                      } else {
                        setSelectedStudents([]);
                      }
                    }}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Roll No</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">CGPA</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Credits</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents([...selectedStudents, student.id]);
                        } else {
                          setSelectedStudents(selectedStudents.filter((id) => id !== student.id));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{student.name}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{student.rollNo}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{student.department}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{student.cgpa}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {student.creditsEarned}/{student.creditsRequired}
                  </td>
                  <td className="px-4 py-3">
                    {student.eligible ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Eligible
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                        Not Eligible
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setPreviewStudent(student);
                          setShowPreview(true);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Preview"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleGenerateTranscript(student.id)}
                        disabled={!student.eligible}
                        className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                        title="Generate"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Transcript Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">College Name</h3>
                <p className="text-gray-600">Official Transcript</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Student Name</p>
                    <p className="font-medium text-gray-900">{previewStudent.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Roll Number</p>
                    <p className="font-medium text-gray-900">{previewStudent.rollNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-medium text-gray-900">{previewStudent.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Program</p>
                    <p className="font-medium text-gray-900">{previewStudent.program}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">CGPA</p>
                    <p className="font-medium text-gray-900">{previewStudent.cgpa}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Credits</p>
                    <p className="font-medium text-gray-900">
                      {previewStudent.creditsEarned}/{previewStudent.creditsRequired}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleGenerateTranscript(previewStudent.id);
                  setShowPreview(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Generate PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptGeneration;
