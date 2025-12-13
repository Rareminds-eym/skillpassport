import React, { useState, useEffect } from "react";
import { DollarSign, AlertCircle, FileText, TrendingUp } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { FeeStructure, StudentFeeSummary } from "./types";
import { useFeeStructures } from "./hooks/useFeeStructures";
import { useFeeTracking } from "./hooks/useFeeTracking";
import { usePrograms } from "./hooks/usePrograms";
import { FeeStructureTab } from "./components/FeeStructureTab";
import { FeeStructureFormModal } from "./components/FeeStructureFormModal";
import { FeeTrackingTab } from "./components/FeeTrackingTab";
import { PaymentFormModal } from "./components/PaymentFormModal";
import { StudentLedgerModal } from "./components/StudentLedgerModal";

const tabs = [
  { id: "fees", label: "Fee Structure Setup" },
  { id: "tracking", label: "Fee Tracking" },
  { id: "budgets", label: "Department Budgets" },
  { id: "expenditure", label: "Expenditure Reports" },
];

const FinanceModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState("fees");
  const [collegeId, setCollegeId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<FeeStructure | null>(null);
  // Fee Tracking state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentFeeSummary | null>(null);

  // Fetch college ID
  useEffect(() => {
    const fetchCollegeId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: college } = await supabase.from("colleges").select("id").eq("created_by", user.id).single();
          if (college?.id) { setCollegeId(college.id); return; }
          const { data: lecturer } = await supabase.from("college_lecturers").select("collegeId").or(`userId.eq.${user.id},user_id.eq.${user.id}`).single();
          if (lecturer?.collegeId) { setCollegeId(lecturer.collegeId); return; }
          if (user.user_metadata?.college_id) setCollegeId(user.user_metadata.college_id);
        }
      } catch (error) { console.error("Error fetching college ID:", error); }
    };
    fetchCollegeId();
  }, []);

  // Hooks
  const feeStructuresHook = useFeeStructures(collegeId);
  const feeTrackingHook = useFeeTracking(collegeId);
  const { programs } = usePrograms(collegeId);

  // Stats for display
  const financeStats = [
    { label: "Total Fee Structures", value: feeStructuresHook.stats.total.toString(), icon: DollarSign, color: "bg-green-500" },
    { label: "Active Structures", value: feeStructuresHook.stats.active.toString(), icon: FileText, color: "bg-blue-500" },
    { label: "Inactive Structures", value: feeStructuresHook.stats.inactive.toString(), icon: AlertCircle, color: "bg-yellow-500" },
    { label: "Total Fee Value", value: `₹${(feeStructuresHook.stats.totalValue / 100000).toFixed(1)}L`, icon: TrendingUp, color: "bg-purple-500" },
  ];

  // Handlers - Fee Structure
  const handleCreate = () => { setSelectedStructure(null); setIsModalOpen(true); };
  const handleEdit = (structure: FeeStructure) => { setSelectedStructure(structure); setIsModalOpen(true); };
  const handleSave = async (data: Partial<FeeStructure>) => {
    const success = await feeStructuresHook.saveFeeStructure(data, selectedStructure);
    if (success) setIsModalOpen(false);
    return success;
  };

  // Handlers - Fee Tracking
  const handleViewLedger = (student: StudentFeeSummary) => {
    setSelectedStudent(student);
    setIsLedgerModalOpen(true);
  };
  const handleRecordPayment = (student: StudentFeeSummary) => {
    setSelectedStudent(student);
    setIsPaymentModalOpen(true);
  };
  const handlePaymentSave = async (ledgerId: string, studentId: string, data: any) => {
    const success = await feeTrackingHook.recordPayment(ledgerId, studentId, data);
    if (success) {
      setIsPaymentModalOpen(false);
      setSelectedStudent(null);
    }
    return success;
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Finance & Accounts</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Manage fee structure, tracking, department budgets, and expenditure reports
        </p>
      </div>

      {/* Stats */}
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
                activeTab === tab.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>


      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {activeTab === "fees" && (
          <FeeStructureTab
            feeStructures={feeStructuresHook.feeStructures}
            loading={feeStructuresHook.loading}
            onRefresh={feeStructuresHook.loadFeeStructures}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onDelete={feeStructuresHook.deleteFeeStructure}
            onToggleActive={feeStructuresHook.toggleActive}
            onDuplicate={feeStructuresHook.duplicateFeeStructure}
          />
        )}

        {activeTab === "tracking" && (
          <FeeTrackingTab
            studentSummaries={feeTrackingHook.studentSummaries}
            loading={feeTrackingHook.loading}
            stats={feeTrackingHook.stats}
            onViewLedger={handleViewLedger}
            onRecordPayment={handleRecordPayment}
          />
        )}

        {activeTab === "budgets" && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Department Budgets</h2>
            <p className="text-gray-600 mb-4">Manage budget allocation, approval, and usage tracking for departments.</p>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-700">
                Budget allocation allows you to define and track departmental budgets for various expense categories.
              </p>
            </div>
          </div>
        )}

        {activeTab === "expenditure" && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Expenditure Reports</h2>
            <p className="text-gray-600">Track vendor details, amounts, invoice uploads, and planned vs actual expenditure.</p>
          </div>
        )}
      </div>

      {/* Fee Structure Form Modal */}
      <FeeStructureFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        structure={selectedStructure}
        programs={programs}
      />

      {/* Payment Form Modal */}
      <PaymentFormModal
        isOpen={isPaymentModalOpen}
        onClose={() => { setIsPaymentModalOpen(false); setSelectedStudent(null); }}
        onSave={handlePaymentSave}
        student={selectedStudent}
      />

      {/* Student Ledger Modal */}
      <StudentLedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => { setIsLedgerModalOpen(false); setSelectedStudent(null); }}
        student={selectedStudent}
      />
    </div>
  );
};

export default FinanceModule;
