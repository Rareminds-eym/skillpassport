import React, { useState } from "react";
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  AlertCircle,
} from "lucide-react";

const FinanceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState("fees");

  const tabs = [
    { id: "fees", label: "Fee Tracking" },
    { id: "budgets", label: "Department Budgets" },
    { id: "expenditure", label: "Expenditure Reports" },
  ];

  // Sample data
  const financeStats = [
    { label: "Total Fee Collection", value: "₹2.4Cr", icon: DollarSign, color: "bg-green-500" },
    { label: "Pending Fees", value: "₹45L", icon: AlertCircle, color: "bg-red-500" },
    { label: "Department Budgets", value: "₹1.8Cr", icon: FileText, color: "bg-blue-500" },
    { label: "Expenditure", value: "₹1.2Cr", icon: TrendingUp, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Finance & Accounts
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Manage fee tracking, department budgets, and expenditure reports
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {financeStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
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
        {activeTab === "fees" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Fee Tracking</h2>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <Download className="h-4 w-4" />
                  Export
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  <Plus className="h-4 w-4" />
                  Add Payment
                </button>
              </div>
            </div>
            <p className="text-gray-600 mb-4">Manage fee structure setup, student ledger, payment posting, receipt generation, and defaulter reports.</p>
            
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900">Fee Defaulters</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    127 students have pending fee payments. Click to view defaulter list.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "budgets" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Department Budgets</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Plus className="h-4 w-4" />
                Allocate Budget
              </button>
            </div>
            <p className="text-gray-600">Manage budget allocation, approval, and usage tracking for departments.</p>
          </div>
        )}

        {activeTab === "expenditure" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Expenditure Reports</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Download className="h-4 w-4" />
                Export Report
              </button>
            </div>
            <p className="text-gray-600">Track vendor details, amounts, invoice uploads, and planned vs actual expenditure.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceManagement;
