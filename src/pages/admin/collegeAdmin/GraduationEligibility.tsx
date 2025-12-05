import React, { useState } from "react";
import {
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

interface Student {
  id: number;
  name: string;
  rollNo: string;
  department: string;
  program: string;
  creditsRequired: number;
  creditsEarned: number;
  backlogs: number;
  cgpa: number;
  eligible: boolean;
}

const GraduationEligibility: React.FC = () => {
  const [students] = useState<Student[]>([
    {
      id: 1,
      name: "Rahul Sharma",
      rollNo: "CS2020001",
      department: "Computer Science",
      program: "B.Tech",
      creditsRequired: 160,
      creditsEarned: 160,
      backlogs: 0,
      cgpa: 8.5,
      eligible: true,
    },
    {
      id: 2,
      name: "Priya Patel",
      rollNo: "EC2020015",
      department: "Electronics",
      program: "B.Tech",
      creditsRequired: 160,
      creditsEarned: 155,
      backlogs: 1,
      cgpa: 7.8,
      eligible: false,
    },
  ]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Graduation Eligibility
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Certify graduation readiness and manage alumni
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <p className="text-gray-600 text-sm mb-1">Not Eligible</p>
              <p className="text-2xl font-bold text-gray-900">
                {students.filter((s) => !s.eligible).length}
              </p>
            </div>
            <XCircleIcon className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
            <AcademicCapIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Student List</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
              Generate Eligibility List
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
              Mark Graduated
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Roll No
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Credits
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Backlogs
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  CGPA
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {student.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {student.rollNo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {student.department}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {student.creditsEarned}/{student.creditsRequired}
                  </td>
                  <td className="px-4 py-3">
                    {student.backlogs > 0 ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                        {student.backlogs}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        0
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {student.cgpa}
                  </td>
                  <td className="px-4 py-3">
                    {student.eligible ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircleIcon className="h-5 w-5" />
                        Eligible
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 text-sm">
                        <XCircleIcon className="h-5 w-5" />
                        Not Eligible
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GraduationEligibility;
