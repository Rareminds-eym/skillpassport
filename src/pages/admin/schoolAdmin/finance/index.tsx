import React, { useState, useEffect } from "react";
import { IndianRupee, AlertCircle, FileText, TrendingUp } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { FeeStructure, StudentFeeSummary } from "./types";
import { useFeeStructures } from "./hooks/useFeeStructures";
import { useFeeTracking } from "./hooks/useFeeTracking";
import { FeeStructureTab } from "./components/FeeStructureTab";
import { FeeStructureFormModal } from "./components/FeeStructureFormModal";
import { FeeTrackingTab } from "./components/FeeTrackingTab";
import { PaymentFormModal } from "./components/PaymentFormModal";
import { StudentLedgerModal } from "./components/StudentLedgerModal";

const tabs = [
  { id: "structure", label: "Fee Structure Setup" },
  { id: "tracking", label: "Fee Tracking" },
];

const SchoolFinanceModule: React.FC = () => {
  console.log('🚀 SchoolFinanceModule component loaded');
  const [activeTab, setActiveTab] = useState("tracking");
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<FeeStructure | null>(null);
  
  // Fee Tracking state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentFeeSummary | null>(null);

  // Fetch school ID for school admin
  useEffect(() => {
    const fetchSchoolId = async () => {
      try {
        console.log('🚀 [School Finance] Fetching school ID...');
        
        // First, check if user is logged in via AuthContext (for school admins)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            console.log('📦 Found user in localStorage:', userData.email, 'role:', userData.role);
            
            if (userData.role === 'school_admin' && userData.schoolId) {
              console.log('✅ School admin detected, using schoolId from localStorage:', userData.schoolId);
              setSchoolId(userData.schoolId);
              return;
            }
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
        }
        
        // If not found in localStorage, try Supabase Auth
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('🔍 Checking Supabase auth user:', user.email);
          
          // Check for school admin by matching adminEmail
          const { data: school } = await supabase
            .from('schools')
            .select('id, name, adminEmail')
            .ilike('adminEmail', user.email || '')
            .single();
          
          if (school?.id) {
            console.log('✅ Found school_id for school admin:', school.id, 'School:', school.name);
            setSchoolId(school.id);
            return;
          }
          
          // Fallback methods
          const { data: createdSchool } = await supabase
            .from("schools")
            .select("id")
            .eq("created_by", user.id)
            .single();
          
          if (createdSchool?.id) { 
            console.log('✅ Found school via created_by:', createdSchool.id);
            setSchoolId(createdSchool.id); 
            return; 
          }
          
          if (user.user_metadata?.school_id) {
            console.log('✅ Found school in user metadata:', user.user_metadata.school_id);
            setSchoolId(user.user_metadata.school_id);
          }
        }
      } catch (error) { 
        console.error("Error fetching school ID:", error); 
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
      label: "Total Students", 
      value: feeTrackingHook.stats.totalStudents.toString(), 
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
          Manage fee structure and track student fee payments
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
            studentSummaries={feeTrackingHook.studentSummaries}
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
          setSelectedStudent(null); 
        }}
        onSave={handlePaymentSave}
        student={selectedStudent}
      />

      {/* Student Ledger Modal */}
      <StudentLedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => { 
          setIsLedgerModalOpen(false); 
          setSelectedStudent(null); 
        }}
        student={selectedStudent}
      />
    </div>
  );
};

export default SchoolFinanceModule;