import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  AlertCircle,
  X,
  Pencil,
  Trash2,
  Calendar,
  GraduationCap,
} from "lucide-react";

interface FeeStructure {
  id: number;
  program: string;
  semester: number;
  feeHead: string;
  amount: number;
  frequency: string;
}

const FinanceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState("fees");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feeList, setFeeList] = useState<FeeStructure[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    program: "",
    semester: 1,
    feeHead: "",
    amount: "",
    frequency: "semester",
  });
  
  // Fee Tracking state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    studentName: "",
    rollNumber: "",
    program: "",
    semester: 1,
    feeHead: "",
    amount: "",
    paymentMode: "cash",
  });
  
  // Budget state
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetData, setBudgetData] = useState({
    department: "",
    budgetHead: "",
    amount: "",
    period: "annual",
  });

  const tabs = [
    { id: "fees", label: "Fee Structure Setup" },
    { id: "tracking", label: "Fee Tracking" },
    { id: "budgets", label: "Department Budgets" },
    { id: "expenditure", label: "Expenditure Reports" },
  ];

  const financeStats = [
    { label: "Total Fee Collection", value: "₹2.4Cr", icon: DollarSign, color: "bg-green-500" },
    { label: "Pending Fees", value: "₹45L", icon: AlertCircle, color: "bg-red-500" },
    { label: "Department Budgets", value: "₹1.8Cr", icon: FileText, color: "bg-blue-500" },
    { label: "Expenditure", value: "₹1.2Cr", icon: TrendingUp, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Finance & Accounts</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Manage fee structure, tracking, department budgets, and expenditure reports
        </p>
      </div>

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

      <div className="bg-white rounded-xl border border-gray-200 p-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                activeTab === tab.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {activeTab === "fees" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Fee Structure Setup</h2>
              <button 
                onClick={() => {
                  setEditingId(null);
                  setFormData({ program: "", semester: 1, feeHead: "", amount: "", frequency: "semester" });
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4" />
                Add Fee Structure
              </button>
            </div>
            <p className="text-gray-600 mb-4">Create and manage fee structures for programs, semesters, and fee heads.</p>
            
            {feeList.length === 0 ? (
              <div className="mt-6 p-8 bg-blue-50 border border-blue-200 rounded-xl text-center">
                <DollarSign className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                <p className="text-blue-900 font-medium mb-1">No fee structures added yet</p>
                <p className="text-sm text-blue-700">
                  Click "Add Fee Structure" to create your first fee structure
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Program</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Semester</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Fee Head</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Frequency</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {feeList.map((fee) => (
                      <tr key={fee.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{fee.program}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Semester {fee.semester}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{fee.feeHead}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">₹{fee.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 capitalize">{fee.frequency}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingId(fee.id);
                                setFormData({
                                  program: fee.program,
                                  semester: fee.semester,
                                  feeHead: fee.feeHead,
                                  amount: fee.amount.toString(),
                                  frequency: fee.frequency,
                                });
                                setIsModalOpen(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Delete this fee structure?")) {
                                  setFeeList(feeList.filter(f => f.id !== fee.id));
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
              <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingId ? "Edit Fee Structure" : "Add Fee Structure"}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editingId) {
                      setFeeList(feeList.map(f => f.id === editingId ? {
                        ...f,
                        program: formData.program,
                        semester: formData.semester,
                        feeHead: formData.feeHead,
                        amount: parseFloat(formData.amount),
                        frequency: formData.frequency,
                      } : f));
                    } else {
                      setFeeList([...feeList, {
                        id: Date.now(),
                        program: formData.program,
                        semester: formData.semester,
                        feeHead: formData.feeHead,
                        amount: parseFloat(formData.amount),
                        frequency: formData.frequency,
                      }]);
                    }
                    setIsModalOpen(false);
                  }}
                  className="p-6 space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program *</label>
                    <select
                      value={formData.program}
                      onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Program</option>
                      <option value="B.Tech CSE">B.Tech CSE</option>
                      <option value="B.Tech Mechanical">B.Tech Mechanical</option>
                      <option value="B.Tech Electrical">B.Tech Electrical</option>
                      <option value="M.Tech">M.Tech</option>
                      <option value="MBA">MBA</option>
                      <option value="MCA">MCA</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {[1,2,3,4,5,6,7,8].map(sem => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fee Head *</label>
                    <select
                      value={formData.feeHead}
                      onChange={(e) => setFormData({ ...formData, feeHead: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Fee Head</option>
                      <option value="Tuition Fee">Tuition Fee</option>
                      <option value="Lab Fee">Lab Fee</option>
                      <option value="Library Fee">Library Fee</option>
                      <option value="Hostel Fee">Hostel Fee</option>
                      <option value="Mess Fee">Mess Fee</option>
                      <option value="Transport Fee">Transport Fee</option>
                      <option value="Exam Fee">Exam Fee</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="semester">Per Semester</option>
                      <option value="annual">Annual</option>
                      <option value="one-time">One Time</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      {editingId ? "Update" : "Add"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tracking" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Fee Tracking</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => alert("Export functionality - Coming soon!")}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
                <button 
                  onClick={() => {
                    setPaymentData({
                      studentName: "",
                      rollNumber: "",
                      program: "",
                      semester: 1,
                      feeHead: "",
                      amount: "",
                      paymentMode: "cash",
                    });
                    setIsPaymentModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="h-4 w-4" />
                  Add Payment
                </button>
              </div>
            </div>
            <p className="text-gray-600 mb-4">Manage student ledger, payment posting, receipt generation, and defaulter reports.</p>
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Search students..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
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
                  <p className="text-sm text-yellow-700 mt-1">127 students have pending fee payments. Click to view defaulter list.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "budgets" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Department Budgets</h2>
              <button 
                onClick={() => {
                  setBudgetData({
                    department: "",
                    budgetHead: "",
                    amount: "",
                    period: "annual",
                  });
                  setIsBudgetModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4" />
                Allocate Budget
              </button>
            </div>
            <p className="text-gray-600 mb-4">Manage budget allocation, approval, and usage tracking for departments.</p>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-700">
                Budget allocation allows you to define and track departmental budgets for various expense categories.
              </p>
            </div>
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

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">Record Payment</h3>
                <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert(`Payment recorded: ₹${paymentData.amount} for ${paymentData.studentName}`);
                  setIsPaymentModalOpen(false);
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
                  <input
                    type="text"
                    value={paymentData.studentName}
                    onChange={(e) => setPaymentData({ ...paymentData, studentName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter student name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number *</label>
                  <input
                    type="text"
                    value={paymentData.rollNumber}
                    onChange={(e) => setPaymentData({ ...paymentData, rollNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter roll number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee Head *</label>
                  <select
                    value={paymentData.feeHead}
                    onChange={(e) => setPaymentData({ ...paymentData, feeHead: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Fee Head</option>
                    <option value="Tuition Fee">Tuition Fee</option>
                    <option value="Lab Fee">Lab Fee</option>
                    <option value="Hostel Fee">Hostel Fee</option>
                    <option value="Mess Fee">Mess Fee</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                  <select
                    value={paymentData.paymentMode}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentMode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="cheque">Cheque</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Record Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsBudgetModalOpen(false)} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">Allocate Budget</h3>
                <button onClick={() => setIsBudgetModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert(`Budget allocated: ₹${budgetData.amount} for ${budgetData.department} - ${budgetData.budgetHead}`);
                  setIsBudgetModalOpen(false);
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <select
                    value={budgetData.department}
                    onChange={(e) => setBudgetData({ ...budgetData, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mechanical">Mechanical Engineering</option>
                    <option value="Electrical">Electrical Engineering</option>
                    <option value="Civil">Civil Engineering</option>
                    <option value="MBA">MBA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget Head *</label>
                  <select
                    value={budgetData.budgetHead}
                    onChange={(e) => setBudgetData({ ...budgetData, budgetHead: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Budget Head</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Software">Software & Licenses</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Events">Events & Activities</option>
                    <option value="Training">Faculty Training</option>
                    <option value="Research">Research & Development</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    value={budgetData.amount}
                    onChange={(e) => setBudgetData({ ...budgetData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period *</label>
                  <select
                    value={budgetData.period}
                    onChange={(e) => setBudgetData({ ...budgetData, period: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="annual">Annual</option>
                    <option value="semester">Per Semester</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsBudgetModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Allocate
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceManagement;
