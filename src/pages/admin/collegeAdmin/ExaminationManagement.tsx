import React, { useState } from "react";
import {
  FileText,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Download,
} from "lucide-react";

const ExaminationManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState("syllabus");

  const tabs = [
    { id: "syllabus", label: "Syllabus & Curriculum" },
    { id: "internal", label: "Internal Assessments" },
    { id: "exams", label: "Examinations" },
    { id: "transcripts", label: "Transcripts" },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Examination Management
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Manage syllabus, assessments, exams, and transcripts
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {activeTab === "syllabus" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Syllabus & Curriculum Builder</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Plus className="h-4 w-4" />
                Create Syllabus
              </button>
            </div>
            <p className="text-gray-600">Manage year/class/semester mapping, chapters, units, learning outcomes, and CO-PO mapping.</p>
          </div>
        )}

        {activeTab === "internal" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Internal Assessments</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Plus className="h-4 w-4" />
                Create IA
              </button>
            </div>
            <p className="text-gray-600">Create IA, schedule timetable, enter marks, moderate, and publish results.</p>
          </div>
        )}

        {activeTab === "exams" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Examinations & Results</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Plus className="h-4 w-4" />
                Create Exam
              </button>
            </div>
            <p className="text-gray-600">Manage exam creation, timetable, invigilation, mark entry, moderation, and result publishing.</p>
          </div>
        )}

        {activeTab === "transcripts" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Transcript Generation</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Download className="h-4 w-4" />
                Generate Transcript
              </button>
            </div>
            <p className="text-gray-600">Generate provisional/consolidated transcripts with QR verification and batch generation.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExaminationManagement;
