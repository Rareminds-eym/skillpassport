import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Users,
  Building2,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  IndianRupee,
  Receipt,
  PieChart
} from 'lucide-react';
import FeeStructureModal from '../../../components/admin/universityAdmin/FeeStructureModal';

interface FeeStructure {
  id: string;
  college_id: string;
  college_name: string;
  program_id: string;
  program_name: string;
  fee_type: 'tuition' | 'admission' | 'examination' | 'library' | 'laboratory' | 'hostel' | 'transport' | 'development' | 'sports' | 'other';
  fee_name: string;
  amount: number;
  currency: string;
  academic_year: string;
  semester: number;
  due_date: string;
  late_fee_amount: number;
  late_fee_percentage: number;
  grace_period_days: number;
  is_mandatory: boolean;
  is_refundable: boolean;
  installment_allowed: boolean;
  max_installments: number;
  status: 'active' | 'inactive' | 'archived';
  description?: string;
  created_at: string;
  updated_at: string;
}

interface PaymentRecord {
  id: string;
  student_id: string;
  student_name: string;
  college_id: string;
  college_name: string;
  fee_structure_id: string;
  amount_due: number;
  amount_paid: number;
  late_fee_applied: number;
  discount_applied: number;
  net_amount: number;
  payment_method: 'online' | 'cash' | 'cheque' | 'dd' | 'neft' | 'rtgs' | 'upi';
  transaction_id?: string;
  payment_date?: string;
  due_date: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'partially_paid';
  academic_year: string;
  semester?: number;
  created_at: string;
}

interface FinanceStats {
  totalRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  overduePayments: number;
  totalColleges: number;
  totalStudents: number;
  collectionRate: number;
  averagePaymentTime: number;
}

interface College {
  id: string;
  name: string;
}

interface Program {
  id: string;
  name: string;
  college_id: string;
}

// Mock Data
const mockColleges: College[] = [
  { id: '1', name: 'Anna University College of Engineering' },
  { id: '2', name: 'PSG College of Technology' },
  { id: '3', name: 'Coimbatore Institute of Technology' },
  { id: '4', name: 'Thiagarajar College of Engineering' },
  { id: '5', name: 'Madras Institute of Technology' }
];

const mockPrograms: Program[] = [
  { id: '1', name: 'Computer Science Engineering', college_id: '1' },
  { id: '2', name: 'Mechanical Engineering', college_id: '1' },
  { id: '3', name: 'Electrical Engineering', college_id: '2' },
  { id: '4', name: 'Civil Engineering', college_id: '2' },
  { id: '5', name: 'Information Technology', college_id: '3' }
];

const mockFeeStructures: FeeStructure[] = [
  {
    id: '1',
    college_id: '1',
    college_name: 'Anna University College of Engineering',
    program_id: '1',
    program_name: 'Computer Science Engineering',
    fee_type: 'tuition',
    fee_name: 'Semester Tuition Fee',
    amount: 75000,
    currency: 'INR',
    academic_year: '2024-25',
    semester: 1,
    due_date: '2024-08-15',
    late_fee_amount: 0,
    late_fee_percentage: 5,
    grace_period_days: 7,
    is_mandatory: true,
    is_refundable: false,
    installment_allowed: true,
    max_installments: 3,
    status: 'active',
    description: 'Regular semester tuition fee for CSE program',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    college_id: '2',
    college_name: 'PSG College of Technology',
    program_id: '3',
    program_name: 'Electrical Engineering',
    fee_type: 'examination',
    fee_name: 'Semester Examination Fee',
    amount: 3500,
    currency: 'INR',
    academic_year: '2024-25',
    semester: 1,
    due_date: '2024-11-30',
    late_fee_amount: 500,
    late_fee_percentage: 0,
    grace_period_days: 3,
    is_mandatory: true,
    is_refundable: false,
    installment_allowed: false,
    max_installments: 1,
    status: 'active',
    description: 'End semester examination fee',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '3',
    college_id: '3',
    college_name: 'Coimbatore Institute of Technology',
    program_id: '5',
    program_name: 'Information Technology',
    fee_type: 'library',
    fee_name: 'Library and Digital Resources Fee',
    amount: 2500,
    currency: 'INR',
    academic_year: '2024-25',
    semester: 1,
    due_date: '2024-08-15',
    late_fee_amount: 0,
    late_fee_percentage: 2,
    grace_period_days: 10,
    is_mandatory: true,
    is_refundable: true,
    installment_allowed: false,
    max_installments: 1,
    status: 'active',
    description: 'Access to library books and digital resources',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  }
];

const mockPaymentRecords: PaymentRecord[] = [
  {
    id: '1',
    student_id: '1',
    student_name: 'Rajesh Kumar',
    college_id: '1',
    college_name: 'Anna University College of Engineering',
    fee_structure_id: '1',
    amount_due: 75000,
    amount_paid: 75000,
    late_fee_applied: 0,
    discount_applied: 0,
    net_amount: 75000,
    payment_method: 'online',
    transaction_id: 'TXN123456789',
    payment_date: '2024-08-10T14:30:00Z',
    due_date: '2024-08-15',
    status: 'completed',
    academic_year: '2024-25',
    semester: 1,
    created_at: '2024-08-10T14:30:00Z'
  },
  {
    id: '2',
    student_id: '2',
    student_name: 'Priya Sharma',
    college_id: '2',
    college_name: 'PSG College of Technology',
    fee_structure_id: '2',
    amount_due: 3500,
    amount_paid: 0,
    late_fee_applied: 0,
    discount_applied: 0,
    net_amount: 3500,
    payment_method: 'online',
    due_date: '2024-11-30',
    status: 'pending',
    academic_year: '2024-25',
    semester: 1,
    created_at: '2024-11-01T10:00:00Z'
  },
  {
    id: '3',
    student_id: '3',
    student_name: 'Arun Krishnan',
    college_id: '1',
    college_name: 'Anna University College of Engineering',
    fee_structure_id: '1',
    amount_due: 75000,
    amount_paid: 25000,
    late_fee_applied: 3750,
    discount_applied: 0,
    net_amount: 78750,
    payment_method: 'online',
    payment_date: '2024-08-20T16:45:00Z',
    due_date: '2024-08-15',
    status: 'partially_paid',
    academic_year: '2024-25',
    semester: 1,
    created_at: '2024-08-20T16:45:00Z'
  }
];

const mockStats: FinanceStats = {
  totalRevenue: 15750000, // ₹1.575 Cr
  pendingPayments: 2340000, // ₹23.4 L
  completedPayments: 13410000, // ₹1.341 Cr
  overduePayments: 890000, // ₹8.9 L
  totalColleges: 45,
  totalStudents: 12500,
  collectionRate: 85.2,
  averagePaymentTime: 12
};
const UniversityFinance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'fee-structures' | 'payments' | 'reports'>('overview');
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(mockFeeStructures);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>(mockPaymentRecords);
  const [stats, setStats] = useState<FinanceStats>(mockStats);
  const [colleges, setColleges] = useState<College[]>(mockColleges);
  const [programs, setPrograms] = useState<Program[]>(mockPrograms);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2024-25');
  const [showFeeStructureModal, setShowFeeStructureModal] = useState(false);
  const [editingFeeStructure, setEditingFeeStructure] = useState<FeeStructure | null>(null);

  // Filter data based on selections
  const filteredFeeStructures = feeStructures.filter(structure => {
    const matchesCollege = !selectedCollege || structure.college_id === selectedCollege;
    const matchesYear = structure.academic_year === selectedAcademicYear;
    const matchesSearch = !searchTerm || 
      structure.fee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      structure.college_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      structure.program_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCollege && matchesYear && matchesSearch;
  });

  const filteredPaymentRecords = paymentRecords.filter(payment => {
    const matchesCollege = !selectedCollege || payment.college_id === selectedCollege;
    const matchesYear = payment.academic_year === selectedAcademicYear;
    
    return matchesCollege && matchesYear;
  });

  const handleSaveFeeStructure = async (data: Partial<FeeStructure>): Promise<boolean> => {
    try {
      setLoading(true);
      
      if (editingFeeStructure) {
        // Update existing structure
        const updatedStructures = feeStructures.map(structure =>
          structure.id === editingFeeStructure.id
            ? { ...structure, ...data, updated_at: new Date().toISOString() }
            : structure
        );
        setFeeStructures(updatedStructures);
      } else {
        // Create new structure
        const newStructure: FeeStructure = {
          id: Date.now().toString(),
          college_name: colleges.find(c => c.id === data.college_id)?.name || 'Unknown College',
          program_name: programs.find(p => p.id === data.program_id)?.name || 'All Programs',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...data
        } as FeeStructure;
        
        setFeeStructures([...feeStructures, newStructure]);
      }
      
      setEditingFeeStructure(null);
      return true;
    } catch (error) {
      console.error('Error saving fee structure:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeeStructure = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee structure?')) return;
    
    try {
      const updatedStructures = feeStructures.filter(structure => structure.id !== id);
      setFeeStructures(updatedStructures);
    } catch (error) {
      console.error('Error deleting fee structure:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)} K`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      refunded: 'bg-purple-100 text-purple-800',
      partially_paid: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const StatCard = ({ title, value, icon: Icon, color, change }: any) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          color="bg-green-500"
          change={12.5}
        />
        <StatCard
          title="Pending Payments"
          value={formatCurrency(stats.pendingPayments)}
          icon={Clock}
          color="bg-yellow-500"
          change={-5.2}
        />
        <StatCard
          title="Completed Payments"
          value={formatCurrency(stats.completedPayments)}
          icon={CheckCircle}
          color="bg-blue-500"
          change={8.3}
        />
        <StatCard
          title="Overdue Payments"
          value={formatCurrency(stats.overduePayments)}
          icon={AlertTriangle}
          color="bg-red-500"
          change={-15.7}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Distribution</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Online Payments</span>
              <span className="text-sm font-medium">78%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Offline Payments</span>
              <span className="text-sm font-medium">22%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gray-400 h-2 rounded-full" style={{ width: '22%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Payment received from ABC College</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Fee structure updated for XYZ Program</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Overdue payment alert sent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const FeeStructuresTab = () => (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Fee Structures</h2>
          <p className="text-sm text-gray-600">Manage fee structures for colleges and programs</p>
        </div>
        <button
          onClick={() => setShowFeeStructureModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Fee Structure
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by college or program..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Colleges</option>
              {colleges.map(college => (
                <option key={college.id} value={college.id}>
                  {college.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="2024-25">2024-25</option>
              <option value="2023-24">2023-24</option>
              <option value="2022-23">2022-23</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fee Structures Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  College/Program
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFeeStructures.map((structure) => (
                <tr key={structure.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{structure.college_name}</div>
                      <div className="text-sm text-gray-500">{structure.program_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {structure.fee_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(structure.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(structure.due_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      structure.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {structure.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingFeeStructure(structure);
                          setShowFeeStructureModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFeeStructure(structure.id)}
                        className="text-red-600 hover:text-red-900"
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
      </div>
    </div>
  );

  const PaymentsTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Payment Records</h2>
          <p className="text-sm text-gray-600">Track and manage all payment transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Payment Records Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student/College
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPaymentRecords.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{payment.student_name}</div>
                      <div className="text-sm text-gray-500">{payment.college_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(payment.amount_paid)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                      {payment.payment_method}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const ReportsTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Financial Reports</h2>
        <p className="text-sm text-gray-600">Generate and download financial reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Revenue Report</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Detailed revenue analysis by college and program</p>
          <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Generate Report
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <PieChart className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Collection Report</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Fee collection status and pending amounts</p>
          <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
            Generate Report
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Overdue Report</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Students with overdue payments and late fees</p>
          <button className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors">
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Finance & Fees Management
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Manage fee structures, track payments, and generate financial reports across all affiliated colleges
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 p-1">
        <nav className="flex space-x-1">
          {[
            { id: 'overview', label: 'Overview', icon: DollarSign },
            { id: 'fee-structures', label: 'Fee Structures', icon: FileText },
            { id: 'payments', label: 'Payments', icon: CreditCard },
            { id: 'reports', label: 'Reports', icon: PieChart }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'fee-structures' && <FeeStructuresTab />}
      {activeTab === 'payments' && <PaymentsTab />}
      {activeTab === 'reports' && <ReportsTab />}

      {/* Fee Structure Modal */}
      <FeeStructureModal
        isOpen={showFeeStructureModal}
        onClose={() => {
          setShowFeeStructureModal(false);
          setEditingFeeStructure(null);
        }}
        onSave={handleSaveFeeStructure}
        editingStructure={editingFeeStructure}
        colleges={colleges}
        programs={programs}
      />
    </div>
  );
};

export default UniversityFinance;