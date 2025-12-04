import React, { useState } from "react";
import {
  BookOpenIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  AcademicCapIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface Outcome {
  id: number;
  text: string;
  bloomLevel?: string;
}

interface Unit {
  id: number;
  title: string;
  credits: number;
  hours: number;
  outcomes: Outcome[];
}

interface Curriculum {
  id: number;
  academicYear: string;
  department: string;
  program: string;
  semester: number;
  course: string;
  units: Unit[];
  status: "draft" | "submitted" | "approved" | "published";
}

const CurriculumBuilder: React.FC = () => {
  const [curricula, setCurricula] = useState<Curriculum[]>([
    {
      id: 1,
      academicYear: "2024-25",
      department: "Computer Science",
      program: "B.Tech",
      semester: 5,
      course: "Data Structures",
      units: [],
      status: "draft",
    },
  ]);

  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(
    curricula[0] || null
  );

  const statusColors = {
    draft: "bg-gray-100 text-gray-700",
    submitted: "bg-blue-100 text-blue-700",
    approved: "bg-green-100 text-green-700",
    published: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Curriculum / Syllabus Builder
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Define academic structure, outcomes, and assessment mapping
        </p>
      </div>

      {/* Context Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Context Selector</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Year
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option>2024-25</option>
              <option>2025-26</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option>Computer Science</option>
              <option>Electronics</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semester
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s}>Semester {s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Curriculum List */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Curriculum List</h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <PlusCircleIcon className="h-5 w-5" />
            Create New
          </button>
        </div>

        <div className="space-y-3">
          {curricula.map((curr) => (
            <div
              key={curr.id}
              onClick={() => setSelectedCurriculum(curr)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                selectedCurriculum?.id === curr.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{curr.course}</h3>
                  <p className="text-sm text-gray-600">
                    {curr.department} • {curr.program} • Semester {curr.semester}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusColors[curr.status]
                  }`}
                >
                  {curr.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Units/Modules Section */}
      {selectedCurriculum && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Units/Modules ({selectedCurriculum.units.length})
            </h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              <PlusCircleIcon className="h-5 w-5" />
              Add Unit
            </button>
          </div>

          {selectedCurriculum.units.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No units added yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Click "Add Unit" to create your first unit
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedCurriculum.units.map((unit) => (
                <div
                  key={unit.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{unit.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {unit.credits} Credits • {unit.hours} Hours
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {unit.outcomes.length} Learning Outcomes
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {selectedCurriculum && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              Save Draft
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Submit for Approval
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              <CheckCircleIcon className="h-5 w-5" />
              Approve
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
              Publish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurriculumBuilder;
