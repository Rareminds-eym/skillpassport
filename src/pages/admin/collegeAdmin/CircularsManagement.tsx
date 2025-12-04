import React, { useState } from "react";
import {
  BellIcon,
  PlusCircleIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface Circular {
  id: number;
  title: string;
  audience: string;
  priority: "normal" | "high";
  publishDate: string;
  expiryDate: string;
  status: "published" | "draft";
}

const CircularsManagement: React.FC = () => {
  const [circulars] = useState<Circular[]>([
    {
      id: 1,
      title: "Academic Calendar Update",
      audience: "All Students",
      priority: "high",
      publishDate: "2025-12-01",
      expiryDate: "2025-12-31",
      status: "published",
    },
  ]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Notifications & Circulars
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Manage institutional communication
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Circulars</h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <PlusCircleIcon className="h-5 w-5" />
            Create Circular
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search circulars..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-3">
          {circulars.map((circular) => (
            <div
              key={circular.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{circular.title}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        circular.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {circular.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Audience: {circular.audience}
                  </p>
                  <p className="text-sm text-gray-500">
                    Published: {circular.publishDate} • Expires: {circular.expiryDate}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-green-600 hover:bg-green-50 rounded">
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
      </div>
    </div>
  );
};

export default CircularsManagement;
