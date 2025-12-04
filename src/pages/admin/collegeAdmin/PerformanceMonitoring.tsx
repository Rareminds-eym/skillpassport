import React from "react";
import { ChartBarIcon, ArrowTrendingUpIcon, AcademicCapIcon } from "@heroicons/react/24/outline";

const PerformanceMonitoring: React.FC = () => {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Performance Monitoring</h1>
        <p className="text-gray-600 text-sm sm:text-base">Track student academic performance and progress</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Average CGPA</p>
              <p className="text-2xl font-bold text-gray-900">7.8</p>
            </div>
            <AcademicCapIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Pass Rate</p>
              <p className="text-2xl font-bold text-gray-900">92%</p>
            </div>
            <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">At Risk Students</p>
              <p className="text-2xl font-bold text-gray-900">45</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Analytics</h2>
        <p className="text-gray-600">Detailed performance metrics and analytics will be displayed here.</p>
      </div>
    </div>
  );
};

export default PerformanceMonitoring;
