import { AlertCircle, FileText, IndianRupee, TrendingUp } from "lucide-react";
import React, { useEffect, useState } from "react";
import { apiPost } from '@/shared/api/apiClient';
import { FeeStructureFormModal } from "./components/FeeStructureFormModal";
import { FeeStructureTab } from "./components/FeeStructureTab";
import { FeeTrackingTab } from "./components/FeeTrackingTab";
import { PaymentFormModal } from "./components/PaymentFormModal";
import { LearnerLedgerModal } from "./components/LearnerLedgerModal";
import { useFeeStructures } from "./hooks/useFeeStructures";
import { useFeeTracking } from "./hooks/useFeeTracking";
import { FeeStructure, LearnerFeeSummary } from '@/features/learner-profile/model';

import { getLogger } from '@/shared/config/logging';

const logger = getLogger('SchoolFinanceModule');

const tabs = [
  { id: "structure", label: "Fee Structure Setup" },
  { id: "tracking", label: "Fee Tracking" },
];

const SchoolFinanceModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState("tracking");
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<FeeStructure | null>(null);
  
  // Fee Tracking state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<LearnerFeeSummary | null>(null);

  // Fetch school ID for school admin
  useEffect(() => {
    const fetchSchoolId = async () => {
      try {
        // First, check if user is logged in via AuthContext (for school admins)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            
            if (userData.role === 'school_admin' && userData.schoolId) {
              setSchoolId(userData.schoolId);
              return;
            }
          } catch (e) {
            logger.error('Failed to parse stored user', e as Error);
          }
        }
        
        // If not found in localStorage, try API
        const user = useAuthStore.getState().user;
        if (user) {
          const schoolResult = await apiPost('/college-admin/school-admin', { action: 'get-school-id', email: user.email, user_id: user.id }) as any;
          if (schoolResult?.school_id) {
            setSchoolId(schoolResult.school_id);
            return;
          }
          if (user.user_metadata?.school_id) {
            setSchoolId(user.user_metadata.school_id);
          }
        }
      } catch (error) { 
        logger.error('Failed to fetch school ID', error as Error); 
      }
    };
    fetchSchoolId();
  }, []);

  // Hooks
  const feeStructuresHook = useFeeStructures(schoolId);
  const feeTrackingHook = useFeeTracking(schoolId);

  // Stats for display
  const financeStats = [
    { 
      label: "Total Fee Structures", 
      value: feeStructuresHook.stats.total.toString(), 
      icon: IndianRupee, 
      color: "bg-green-500" 
    },
    { 
      label: "Active Structures", 
      value: feeStructuresHook.stats.active.toString(), 
      icon: FileText, 
      color: "bg-blue-500" 
    },
    { 
      label: "Total Learners", 
      value: feeTrackingHook.stats.totallearners.toString(), 
      icon: AlertCircle, 
      color: "bg-yellow-500" 
    },
    { 
      label: "Total Fee Value", 
      value: `₹${(feeStructuresHook.stats.totalValue / 100000).toFixed(1)}L`, 
      icon: TrendingUp, 
      color: "bg-purple-500" 
    },
  ];

  // Handlers - Fee Structure
  const handleCreate = () => { 
    setSelectedStructure(null); 
    setIsModalOpen(true); 
  };
  
  const handleEdit = (structure: FeeStructure) => { 
    setSelectedStructure(structure); 
    setIsModalOpen(true); 
  };
  
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
          Manage fee structure and track learner fee payments
        </p>
        <div className="mt-2 px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full inline-block">
          ✅ Updated Version - {new Date().toLocaleTimeString()}
        </div>
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

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {activeTab === "structure" && (
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
      </div>

      {/* Fee Structure Form Modal */}
      <FeeStructureFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        structure={selectedStructure}
        schoolId={schoolId}
      />

      {/* Payment Form Modal */}
      <PaymentFormModal
        isOpen={isPaymentModalOpen}
        onClose={() => { 
          setIsPaymentModalOpen(false); 
          setSelectedLearner(null); 
        }}
        onSave={handlePaymentSave}
        learner={selectedLearner}
      />

      {/* Learner Ledger Modal */}
      <LearnerLedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => { 
          setIsLedgerModalOpen(false); 
          setSelectedLearner(null); 
        }}
        learner={selectedLearner}
      />
    </div>
  );
};

export default SchoolFinanceModule;