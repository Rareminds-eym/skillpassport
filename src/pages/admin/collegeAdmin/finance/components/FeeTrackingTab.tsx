import React, { useState } from "react";
import { Search, Eye, CreditCard, AlertTriangle, CheckCircle, Clock, Users } from "lucide-react";
import { StudentFeeSummary, PaymentStatus } from "../types";

interface Props {
  studentSummaries: StudentFeeSummary[];
  loading: boolean;
  stats: {
    totalDue: number;
    totalCollected: number;
    totalPending: number;
    totalStudents: number;
    paidCount: number;
    partialCount: number;
    pendingCount: number;
    overdueCount: number;
  };
  onViewLedger: (student: StudentFeeSummary) => void;
  onRecordPayment: (student: StudentFeeSummary) => void;
}

const statusConfig: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  paid: { label: "Paid", color: "text-green-700", bg: "bg-green-100" },
  partial: { label: "Partial", color: "text-yellow-700", bg: "bg-yellow-100" },
  pending: { label: "Pending", color: "text-gray-700", bg: "bg-gray-100" },
  overdue: { label: "Overdue", color: "text-red-700", bg: "bg-red-100" },
  waived: { label: "Waived", color: "text-blue-700", bg: "bg-blue-100" },
};

export const FeeTrackingTab: React.FC<Props> = ({
  studentSummaries,
  loading,
  stats,
  onViewLedger,
  onRecordPayment,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | "all">("all");

  const filteredStudents = studentSummaries.filter((s) => {
    const matchesSearch =
      s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }


  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Fee Tracking</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-blue-600">Total Students</p>
              <p className="text-xl font-bold text-blue-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg text-white">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-green-600">Collected</p>
              <p className="text-xl font-bold text-green-900">₹{(stats.totalCollected / 1000).toFixed(1)}K</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500 rounded-lg text-white">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-yellow-600">Pending</p>
              <p className="text-xl font-bold text-yellow-900">₹{(stats.totalPending / 1000).toFixed(1)}K</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500 rounded-lg text-white">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-red-600">Defaulters</p>
              <p className="text-xl font-bold text-red-900">{stats.overdueCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as PaymentStatus | "all")}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>


      {/* Student List */}
      {filteredStudents.length === 0 ? (
        <div className="p-8 bg-gray-50 border border-gray-200 rounded-xl text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-900 font-medium mb-1">
            {studentSummaries.length === 0 ? "No student fee records found" : "No matching students"}
          </p>
          <p className="text-sm text-gray-600">
            {studentSummaries.length === 0
              ? "Student fee ledgers will appear here once fee structures are assigned to students"
              : "Try adjusting your search or filters"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Student</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Roll No</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Due</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Paid</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Balance</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const config = statusConfig[student.status] || statusConfig.pending;
                return (
                  <tr key={student.student_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{student.student_name}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{student.roll_number}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      ₹{student.total_due.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-green-600 font-medium">
                      ₹{student.total_paid.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-red-600">
                      ₹{student.balance.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onViewLedger(student)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View Ledger"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {student.balance > 0 && (
                          <button
                            onClick={() => onRecordPayment(student)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Record Payment"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
