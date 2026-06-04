import { AlertCircle, FileText, IndianRupee, TrendingUp } from "lucide-react";
import React, { useEffect, useState } from "react";
import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';
import { DepartmentBudgetsTab } from "./components/DepartmentBudgetsTab";
import { ExpenditureReportsTab } from "./components/ExpenditureReportsTab";
import { FeeStructureFormModal } from "./components/FeeStructureFormModal";
import { FeeStructureTab } from "./components/FeeStructureTab";
import { FeeTrackingTab } from "./components/FeeTrackingTab";
import { PaymentFormModal } from "./components/PaymentFormModal";
import { LearnerLedgerModal } from "./components/LearnerLedgerModal";
import { useDepartmentBudgets } from "./hooks/useDepartmentBudgets";
import { useFeeStructures } from "./hooks/useFeeStructures";
import { useFeeTracking } from "./hooks/useFeeTracking";
import { usePrograms } from "./hooks/usePrograms";
import { FeeStructure, LearnerFeeSummary } from '@/features/learner-profile/model';


const logger = getLogger('finance-module');

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
  const [selectedLearner, setSelectedLearner] = useState<LearnerFeeSummary | null>(null);

  // Fetch college ID for fee structures and programs (still needed for those hooks)
  useEffect(() => {
    const fetchCollegeId = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);

            if (userData.role === 'college_admin' && userData.collegeId) {
              setCollegeId(userData.collegeId);
              return;
            }
          } catch (e) {
            logger.error('Error parsing stored user', e instanceof Error ? e : new Error(String(e)));
          }
        }

        const user = useAuthStore.getState().user;
        if (user) {
          const result = await apiPost('/college-admin/faculty', {
            action: 'resolve-user-college',
            user_id: user.id,
            email: user.email,
          });

          if (result.data?.college_id) {
            setCollegeId(result.data.college_id);
            return;
          }

          if (user.user_metadata?.college_id) {
            setCollegeId(user.user_metadata.college_id);
          }
        }
      } catch (error) {
        logger.error("Error fetching college ID", error instanceof Error ? error : new Error(String(error)));
      }
    };
    fetchCollegeId();
  }, []);

  // Hooks
  const feeStructuresHook = useFeeStructures(collegeId);
  const feeTrackingHook = useFeeTracking();
  const departmentBudgetsHook = useDepartmentBudgets();
  const { programs, departments } = usePrograms(collegeId);

  // Stats for display
  const financeStats = [
    { label: "Total Fee Structures", value: feeStructuresHook.stats.total.toString(), icon: IndianRupee, color: "bg-green-500" },
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
  const handleViewLedger = (learner: LearnerFeeSummary) => {
    setSelectedLearner(learner);
    setIsLedgerModalOpen(true);
  };
  const handleRecordPayment = (learner: LearnerFeeSummary) => {
    setSelectedLearner(learner);
    setIsPaymentModalOpen(true);
  };
  const handlePaymentSave = async (ledgerId: string, learnerId: string, data: any) => {
    const success = await feeTrackingHook.recordPayment(ledgerId, learnerId, data);
    if (success) {
      setIsPaymentModalOpen(false);
      setSelectedLearner(null);
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
            learnerSummaries={feeTrackingHook.learnerSummaries}
            loading={feeTrackingHook.loading}
            stats={feeTrackingHook.stats}
            onViewLedger={handleViewLedger}
            onRecordPayment={handleRecordPayment}
          />
        )}

        {activeTab === "budgets" && (
          <DepartmentBudgetsTab
            budgets={departmentBudgetsHook.budgets}
            loading={departmentBudgetsHook.loading}
            stats={departmentBudgetsHook.stats}
          />
        )}

        {activeTab === "expenditure" && (
          <ExpenditureReportsTab />
        )}
      </div>

      {/* Fee Structure Form Modal */}
      <FeeStructureFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        structure={selectedStructure}
        programs={programs}
        departments={departments}
      />

      {/* Payment Form Modal */}
      <PaymentFormModal
        isOpen={isPaymentModalOpen}
        onClose={() => { setIsPaymentModalOpen(false); setSelectedLearner(null); }}
        onSave={handlePaymentSave}
        learner={selectedLearner}
      />

      {/* Learner Ledger Modal */}
      <LearnerLedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => { setIsLedgerModalOpen(false); setSelectedLearner(null); }}
        learner={selectedLearner}
      />
    </div>
  );
};

export default FinanceModule;
