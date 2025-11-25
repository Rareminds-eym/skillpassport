/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  BellAlertIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  PhoneIcon,
  EyeIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import SearchBar from "../../../components/common/SearchBar";

/* ==============================
   TYPES & INTERFACES
   ============================== */
interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string;
  studentName: string;
  studentClass: string;
  studentRoll: string;
  relationship: "Father" | "Mother" | "Guardian";
  lastLogin: string;
  accountStatus: "active" | "inactive" | "pending";
  notifications: number;
}

interface StudentSummary {
  attendance: number;
  averageMarks: number;
  careerReadiness: number;
  feeDues: number;
  upcomingEvents: number;
}

/* ==============================
   STATS CARD COMPONENT
   ============================== */
const StatsCard = ({
  label,
  value,
  icon: Icon,
  color = "blue",
  trend,
}: {
  label: string;
  value: number | string;
  icon: any;
  color?: "blue" | "green" | "purple" | "amber" | "red";
  trend?: { value: string; isPositive: boolean };
}) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    red: "bg-red-50 text-red-600 border-red-200",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p
              className={`text-xs font-medium mt-1 ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div
          className={`p-3 rounded-xl border ${colorClasses[color]} transition-colors`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

/* ==============================
   PARENT CARD COMPONENT
   ============================== */
const ParentCard = ({
  parent,
  onViewDetails,
  onSendMessage,
}: {
  parent: Parent;
  onViewDetails: () => void;
  onSendMessage: () => void;
}) => {
  const statusColors = {
    active: "bg-green-100 text-green-700 border-green-200",
    inactive: "bg-gray-100 text-gray-700 border-gray-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
            {parent.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {parent.name}
            </h3>
            <p className="text-sm text-gray-600 mb-1">{parent.relationship}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <EnvelopeIcon className="h-3.5 w-3.5" />
                {parent.email}
              </span>
            </div>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
            statusColors[parent.accountStatus]
          }`}
        >
          {parent.accountStatus.charAt(0).toUpperCase() +
            parent.accountStatus.slice(1)}
        </span>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">
          Student Details
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-gray-500">Name</p>
            <p className="font-medium text-gray-900">{parent.studentName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Class</p>
            <p className="font-medium text-gray-900">{parent.studentClass}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Roll No</p>
            <p className="font-medium text-gray-900">{parent.studentRoll}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Last Login</p>
            <p className="font-medium text-gray-900">{parent.lastLogin}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onViewDetails}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <EyeIcon className="h-4 w-4" />
          View Details
        </button>
        <button
          onClick={onSendMessage}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          <EnvelopeIcon className="h-4 w-4" />
          Message
        </button>
      </div>

      {parent.notifications > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
          <BellAlertIcon className="h-4 w-4 flex-shrink-0" />
          {parent.notifications} unread notification
          {parent.notifications > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
};

/* ==============================
   PARENT DETAILS MODAL
   ============================== */
const ParentDetailsModal = ({
  parent,
  isOpen,
  onClose,
}: {
  parent: Parent | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen || !parent) return null;

  // Mock student summary data
  const studentSummary: StudentSummary = {
    attendance: 92,
    averageMarks: 85,
    careerReadiness: 78,
    feeDues: 5000,
    upcomingEvents: 3,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                Parent Portal Dashboard
              </h2>
              <p className="mt-1 text-sm text-gray-500">{parent.name}</p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {/* Parent Information */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 mb-6 border border-indigo-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Parent Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Full Name</p>
                  <p className="font-semibold text-gray-900">{parent.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Relationship</p>
                  <p className="font-semibold text-gray-900">
                    {parent.relationship}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-semibold text-gray-900">{parent.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  <p className="font-semibold text-gray-900">{parent.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Account Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      parent.accountStatus === "active"
                        ? "bg-green-100 text-green-700"
                        : parent.accountStatus === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {parent.accountStatus}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Last Login</p>
                  <p className="font-semibold text-gray-900">
                    {parent.lastLogin}
                  </p>
                </div>
              </div>
            </div>

            {/* Student Summary */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {parent.studentName}'s Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <ChartBarIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Attendance</p>
                      <p className="text-xl font-bold text-gray-900">
                        {studentSummary.attendance}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <AcademicCapIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Average Marks</p>
                      <p className="text-xl font-bold text-gray-900">
                        {studentSummary.averageMarks}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <ChartBarIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Career Readiness</p>
                      <p className="text-xl font-bold text-gray-900">
                        {studentSummary.careerReadiness}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <BanknotesIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Fee Dues</p>
                      <p className="text-xl font-bold text-gray-900">
                        ₹{studentSummary.feeDues}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-100 rounded-lg">
                      <CalendarDaysIcon className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Upcoming Events</p>
                      <p className="text-xl font-bold text-gray-900">
                        {studentSummary.upcomingEvents}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <BellAlertIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Notifications</p>
                      <p className="text-xl font-bold text-gray-900">
                        {parent.notifications}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Available Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  Download Reports
                </button>
                <button className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                  <EnvelopeIcon className="h-5 w-5" />
                  Contact Teacher
                </button>
                <button className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                  <BellAlertIcon className="h-5 w-5" />
                  View Notifications
                </button>
                <button className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium">
                  <CalendarDaysIcon className="h-5 w-5" />
                  View Timetable
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==============================
   MAIN PARENT PORTAL COMPONENT
   ============================== */
const ParentPortal: React.FC = () => {
  // Sample data
  const [parents] = useState<Parent[]>([
    {
      id: "1",
      name: "Rajesh Kumar",
      email: "rajesh.kumar@email.com",
      phone: "+91 98765 43210",
      studentName: "Ananya Kumar",
      studentClass: "10-A",
      studentRoll: "10A-025",
      relationship: "Father",
      lastLogin: "2 hours ago",
      accountStatus: "active",
      notifications: 3,
    },
    {
      id: "2",
      name: "Priya Sharma",
      email: "priya.sharma@email.com",
      phone: "+91 98765 43211",
      studentName: "Rohan Sharma",
      studentClass: "9-B",
      studentRoll: "9B-018",
      relationship: "Mother",
      lastLogin: "1 day ago",
      accountStatus: "active",
      notifications: 1,
    },
    {
      id: "3",
      name: "Amit Patel",
      email: "amit.patel@email.com",
      phone: "+91 98765 43212",
      studentName: "Diya Patel",
      studentClass: "11-C",
      studentRoll: "11C-032",
      relationship: "Father",
      lastLogin: "3 days ago",
      accountStatus: "inactive",
      notifications: 0,
    },
    {
      id: "4",
      name: "Sneha Reddy",
      email: "sneha.reddy@email.com",
      phone: "+91 98765 43213",
      studentName: "Aarav Reddy",
      studentClass: "12-A",
      studentRoll: "12A-007",
      relationship: "Mother",
      lastLogin: "Never",
      accountStatus: "pending",
      notifications: 5,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Filtered parents
  const filteredParents = useMemo(() => {
    return parents.filter((parent) => {
      const matchesSearch =
        parent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parent.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parent.phone.includes(searchQuery);

      const matchesStatus =
        filterStatus === "all" || parent.accountStatus === filterStatus;

      const matchesClass =
        filterClass === "all" || parent.studentClass.startsWith(filterClass);

      return matchesSearch && matchesStatus && matchesClass;
    });
  }, [parents, searchQuery, filterStatus, filterClass]);

  // Stats
  const stats = useMemo(() => {
    const total = parents.length;
    const active = parents.filter((p) => p.accountStatus === "active").length;
    const pending = parents.filter((p) => p.accountStatus === "pending").length;
    const totalNotifications = parents.reduce(
      (sum, p) => sum + p.notifications,
      0
    );

    return { total, active, pending, totalNotifications };
  }, [parents]);

  const handleViewDetails = (parent: Parent) => {
    setSelectedParent(parent);
    setShowDetailsModal(true);
  };

  const handleSendMessage = (parent: Parent) => {
    alert(`Send message to ${parent.name}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="flex items-center justify-center h-12 w-12 bg-indigo-100 rounded-xl shrink-0">
              <UserGroupIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                Parent Portal
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage parent access and view student information
              </p>
            </div>
          </div>

          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md">
            <DocumentArrowDownIcon className="h-5 w-5" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          label="Total Parents"
          value={stats.total}
          icon={UserGroupIcon}
          color="blue"
        />
        <StatsCard
          label="Active Accounts"
          value={stats.active}
          icon={CheckCircleIcon}
          color="green"
          trend={{ value: "12% from last month", isPositive: true }}
        />
        <StatsCard
          label="Pending Accounts"
          value={stats.pending}
          icon={ClockIcon}
          color="amber"
        />
        <StatsCard
          label="Total Notifications"
          value={stats.totalNotifications}
          icon={BellAlertIcon}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name, email, or phone..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student Class
            </label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            >
              <option value="all">All Classes</option>
              <option value="9">Class 9</option>
              <option value="10">Class 10</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
            </select>
          </div>
        </div>
      </div>

      {/* Parents List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">
            Parents ({filteredParents.length})
          </h2>
        </div>

        <div className="p-5">
          {filteredParents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <UserGroupIcon className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No parents found
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredParents.map((parent) => (
                <ParentCard
                  key={parent.id}
                  parent={parent}
                  onViewDetails={() => handleViewDetails(parent)}
                  onSendMessage={() => handleSendMessage(parent)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Parent Details Modal */}
      <ParentDetailsModal
        parent={selectedParent}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedParent(null);
        }}
      />
    </div>
  );
};

export default ParentPortal;
