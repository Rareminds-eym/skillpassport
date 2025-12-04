import React, { useState } from "react";
import {
  ClipboardDocumentListIcon,
  PlusCircleIcon,
  EyeIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface LessonPlan {
  id: number;
  faculty: string;
  course: string;
  unit: string;
  objectives: string;
  methodology: string;
  duration: string;
  status: "draft" | "published";
}

const LessonPlanManagement: React.FC = () => {
  const [lessonPlans] = useState<LessonPlan[]>([
    {
      id: 1,
      faculty: "Dr. Rajesh Kumar",
      course: "Data Structures",
      unit: "Unit 1: Arrays and Linked Lists",
      objectives: "Understand array operations and linked list implementation",
      methodology: "Lecture + Lab Session",
      duration: "3 hours",
      status: "published",
    },
  ]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Lesson Plan Management
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Plan instruction aligned to curriculum
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Plans</p>
              <p className="text-2xl font-bold text-gray-900">{lessonPlans.length}</p>
            </div>
            <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Published</p>
              <p className="text-2xl font-bold text-gray-900">
                {lessonPlans.filter((p) => p.status === "published").length}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Draft</p>
              <p className="text-2xl font-bold text-gray-900">
                {lessonPlans.filter((p) => p.status === "draft").length}
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Lesson Plans</h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <PlusCircleIcon className="h-5 w-5" />
            Create Lesson Plan
          </button>
        </div>

        <div className="space-y-3">
          {lessonPlans.map((plan) => (
            <div
              key={plan.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{plan.course}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        plan.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {plan.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{plan.unit}</p>
                  <p className="text-sm text-gray-600 mb-1">
                    Faculty: {plan.faculty}
                  </p>
                  <p className="text-sm text-gray-500">Duration: {plan.duration}</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-green-600 hover:bg-green-50 rounded">
                    <PencilSquareIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LessonPlanManagement;
