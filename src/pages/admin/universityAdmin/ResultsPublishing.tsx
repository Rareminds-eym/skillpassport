import React, { useState } from "react";
import {
  Send,
  Users,
  CheckCircle,
  Search,
  Download,
  Eye,
  TrendingUp,
  FileSpreadsheet,
  Bell,
  Clock,
  Globe,
  Mail,
} from "lucide-react";

const ResultsPublishing: React.FC = () => {
  const [activeTab, setActiveTab] = useState("ready");
  const [searchTerm, setSearchTerm] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Mock data for results publishing
  const [resultsData] = useState([
    {
      id: 1,
      examination: "End Semester Examination - December 2024",
      college: "ABC Engineering College",
      department: "Computer Science",
      semester: "5th Semester",
      totalStudents: 120,
      passedStudents: 108,
      failedStudents: 12,
      passPercentage: 90,
      averageGrade: 7.8,
      status: "Ready to Publish",
      calculatedDate: "2025-01-10",
      publishedDate: null,
      approvedBy: null,
      subjects: ["Data Structures", "DBMS", "Computer Networks", "Software Engineering"],
      notifications: {
        students: false,
        parents: false,
        faculty: false
      }
    },
    {
      id: 2,
      examination: "Internal Assessment - November 2024",
      college: "XYZ Arts & Science College",
      department: "Mathematics",
      semester: "3rd Semester",
      totalStudents: 85,
      passedStudents: 82,
      failedStudents: 3,
      passPercentage: 96.5,
      averageGrade: 8.2,
      status: "Published",
      calculatedDate: "2024-11-25",
      publishedDate: "2024-11-30",
      approvedBy: "Dr. John Smith",
      subjects: ["Calculus", "Linear Algebra", "Statistics", "Discrete Mathematics"],
      notifications: {
        students: true,
        parents: true,
        faculty: true
      }
    },
    {
      id: 3,
      examination: "Practical Examination - January 2025",
      college: "PQR Medical College",
      department: "Biochemistry",
      semester: "4th Semester",
      totalStudents: 60,
      passedStudents: 55,
      failedStudents: 5,
      passPercentage: 91.7,
      averageGrade: 7.9,
      status: "Under Review",
      calculatedDate: "2025-01-08",
      publishedDate: null,
      approvedBy: null,
      subjects: ["Clinical Biochemistry", "Molecular Biology", "Enzymology"],
      notifications: {
        students: false,
        parents: false,
        faculty: false
      }
    },
  ]);

  const [publishingSettings] = useState({
    autoNotification: true,
    requireApproval: true,
    publicAccess: false,
    gracePeriodsEnabled: true,
    gracePeriodDays: 7,
    notificationTemplates: {
      students: "Your examination results are now available.",
      parents: "Your ward's examination results have been published.",
      faculty: "Results for your subject have been published."
    }
  });

  // Filter results
  const filteredResults = resultsData.filter((result) => {
    if (searchTerm && !result.examination.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !result.college.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (collegeFilter && !result.college.toLowerCase().includes(collegeFilter.toLowerCase())) return false;
    if (statusFilter && result.status !== statusFilter) return false;
    if (activeTab === "ready" && result.status !== "Ready to Publish") return false;
    if (activeTab === "review" && result.status !== "Under Review") return false;
    if (activeTab === "published" && result.status !== "Published") return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      "Ready to Publish": 'bg-green-100 text-green-700',
      "Under Review": 'bg-yellow-100 text-yellow-700',
      "Published": 'bg-blue-100 text-blue-700',
      "Draft": 'bg-gray-100 text-gray-700',
    };
    return styles[status as keyof typeof styles] || styles.Draft;
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 8.5) return "text-green-600";
    if (grade >= 7.0) return "text-blue-600";
    if (grade >= 6.0) return "text-yellow-600";
    return "text-red-600";
  };

  const handlePublishResults = (id: number) => {
    const result = resultsData.find(r => r.id === id);
    if (result) {
      alert(`Publishing results for: ${result.examination}\nCollege: ${result.college}\nStudents will be notified automatically.`);
    }
  };

  const handleBulkPublish = () => {
    const readyResults = filteredResults.filter(result => result.status === "Ready to Publish");
    if (readyResults.length > 0) {
      alert(`Publishing ${readyResults.length} result sets. All students and parents will be notified.`);
    } else {
      alert("No results ready for publishing");
    }
  };

  const handleSendNotification = (id: number, type: string) => {
    const result = resultsData.find(r => r.id === id);
    if (result) {
      alert(`Sending ${type} notification for: ${result.examination}`);
    }
  };

  const tabs = [
    { id: "ready", label: "Ready to Publish", count: resultsData.filter(r => r.status === "Ready to Publish").length },
    { id: "review", label: "Under Review", count: resultsData.filter(r => r.status === "Under Review").length },
    { id: "published", label: "Published", count: resultsData.filter(r => r.status === "Published").length },
    { id: "settings", label: "Publishing Settings", count: 0 },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 via-blue-50 to-indigo-50 rounded-2xl p-6 border border-green-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Results Publishing System
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Publish examination results and manage notifications across all colleges
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-green-100 text-sm mb-1">Ready to Publish</p>
              <p className="text-3xl font-bold">{resultsData.filter(r => r.status === "Ready to Publish").length}</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <CheckCircle className="h-7 w-7" />
            </div>
          </div>
          <p className="text-sm text-green-100">Awaiting publication</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-yellow-100 text-sm mb-1">Under Review</p>
              <p className="text-3xl font-bold">{resultsData.filter(r => r.status === "Under Review").length}</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <Clock className="h-7 w-7" />
            </div>
          </div>
          <p className="text-sm text-yellow-100">Pending approval</p>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-blue-100 text-sm mb-1">Published</p>
              <p className="text-3xl font-bold">{resultsData.filter(r => r.status === "Published").length}</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <Send className="h-7 w-7" />
            </div>
          </div>
          <p className="text-sm text-blue-100">Live results</p>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-purple-100 text-sm mb-1">Average Pass Rate</p>
              <p className="text-3xl font-bold">
                {Math.round(resultsData.reduce((sum, r) => sum + r.passPercentage, 0) / resultsData.length)}%
              </p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <TrendingUp className="h-7 w-7" />
            </div>
          </div>
          <p className="text-sm text-purple-100">Across all results</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === tab.id ? "bg-white/20" : "bg-gray-300"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {activeTab === "settings" ? (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Publishing Settings & Configuration</h2>
            
            {/* General Settings */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Auto Notification</label>
                    <p className="text-sm text-gray-500">Automatically notify students when results are published</p>
                  </div>
                  <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    publishingSettings.autoNotification ? 'bg-green-600' : 'bg-gray-200'
                  }`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      publishingSettings.autoNotification ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Require Approval</label>
                    <p className="text-sm text-gray-500">Results must be approved before publishing</p>
                  </div>
                  <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    publishingSettings.requireApproval ? 'bg-green-600' : 'bg-gray-200'
                  }`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      publishingSettings.requireApproval ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Public Access</label>
                    <p className="text-sm text-gray-500">Allow public access to published results</p>
                  </div>
                  <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    publishingSettings.publicAccess ? 'bg-green-600' : 'bg-gray-200'
                  }`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      publishingSettings.publicAccess ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Grace Period</label>
                    <p className="text-sm text-gray-500">Enable grace period for result corrections</p>
                  </div>
                  <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    publishingSettings.gracePeriodsEnabled ? 'bg-green-600' : 'bg-gray-200'
                  }`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      publishingSettings.gracePeriodsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grace Period (Days)
                    </label>
                    <input
                      type="number"
                      value={publishingSettings.gracePeriodDays}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Templates */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Templates</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student Notification
                  </label>
                  <textarea
                    rows={3}
                    defaultValue={publishingSettings.notificationTemplates.students}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Notification
                  </label>
                  <textarea
                    rows={3}
                    defaultValue={publishingSettings.notificationTemplates.parents}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Faculty Notification
                  </label>
                  <textarea
                    rows={3}
                    defaultValue={publishingSettings.notificationTemplates.faculty}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                <CheckCircle className="h-4 w-4" />
                Save Settings
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Results Publishing ({filteredResults.length})
              </h2>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <FileSpreadsheet className="h-4 w-4" />
                  Export Report
                </button>
                <button 
                  onClick={handleBulkPublish}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Send className="h-4 w-4" />
                  Bulk Publish
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search results..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <input
                type="text"
                placeholder="Filter by college..."
                value={collegeFilter}
                onChange={(e) => setCollegeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Status</option>
                <option value="Ready to Publish">Ready to Publish</option>
                <option value="Under Review">Under Review</option>
                <option value="Published">Published</option>
              </select>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Examination Details
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      College & Department
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Performance
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Notifications
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredResults.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{result.examination}</p>
                          <p className="text-sm text-gray-600">{result.semester}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.subjects.slice(0, 2).map((subject, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                {subject}
                              </span>
                            ))}
                            {result.subjects.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                +{result.subjects.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{result.college}</p>
                          <p className="text-sm text-gray-600">{result.department}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="text-gray-900">Students: {result.totalStudents}</p>
                          <p className="text-green-600">Passed: {result.passedStudents} ({result.passPercentage}%)</p>
                          <p className={`font-medium ${getGradeColor(result.averageGrade)}`}>
                            Avg Grade: {result.averageGrade}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(result.status)}`}>
                            {result.status}
                          </span>
                          {result.publishedDate && (
                            <p className="text-xs text-gray-500">Published: {result.publishedDate}</p>
                          )}
                          {result.approvedBy && (
                            <p className="text-xs text-gray-500">By: {result.approvedBy}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleSendNotification(result.id, 'student')}
                            className={`p-1 rounded ${result.notifications.students ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                            title="Student Notifications"
                          >
                            <Users className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleSendNotification(result.id, 'parent')}
                            className={`p-1 rounded ${result.notifications.parents ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-50'}`}
                            title="Parent Notifications"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleSendNotification(result.id, 'faculty')}
                            className={`p-1 rounded ${result.notifications.faculty ? 'text-purple-600 bg-purple-50' : 'text-gray-400 hover:bg-gray-50'}`}
                            title="Faculty Notifications"
                          >
                            <Bell className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {result.status === "Ready to Publish" && (
                            <button 
                              onClick={() => handlePublishResults(result.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded" 
                              title="Publish Results"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View Details">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-purple-600 hover:bg-purple-50 rounded" title="Download">
                            <Download className="h-4 w-4" />
                          </button>
                          {result.status === "Published" && (
                            <button className="p-1 text-orange-600 hover:bg-orange-50 rounded" title="Public Link">
                              <Globe className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredResults.length === 0 && (
              <div className="text-center py-12">
                <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No results found</p>
                <p className="text-sm text-gray-400">
                  {activeTab === "ready" ? "No results ready for publishing" :
                   activeTab === "review" ? "No results under review" :
                   "No published results found"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPublishing;