import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  Calendar,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  Users,
  Building2,
  TrendingUp,
  ArrowUpDown,
  FileText,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

interface PaymentRecord {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  college_id: string;
  college_name: string;
  fee_structure_id: string;
  fee_name: string;
  fee_type: string;
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

interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  pendingAmount: number;
  completedAmount: number;
  overdueAmount: number;
  todayPayments: number;
  thisWeekPayments: number;
  thisMonthPayments: number;
}

// Mock Data
const mockPaymentRecords: PaymentRecord[] = [
  {
    id: '1',
    student_id: '1',
    student_name: 'Rajesh Kumar',
    student_email: 'rajesh.kumar@student.edu',
    college_id: '1',
    college_name: 'Anna University College of Engineering',
    fee_structure_id: '1',
    fee_name: 'Semester Tuition Fee',
    fee_type: 'tuition',
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
    student_email: 'priya.sharma@student.edu',
    college_id: '2',
    college_name: 'PSG College of Technology',
    fee_structure_id: '2',
    fee_name: 'Semester Examination Fee',
    fee_type: 'examination',
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
    student_email: 'arun.krishnan@student.edu',
    college_id: '1',
    college_name: 'Anna University College of Engineering',
    fee_structure_id: '1',
    fee_name: 'Semester Tuition Fee',
    fee_type: 'tuition',
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
  },
  {
    id: '4',
    student_id: '4',
    student_name: 'Meera Patel',
    student_email: 'meera.patel@student.edu',
    college_id: '3',
    college_name: 'Coimbatore Institute of Technology',
    fee_structure_id: '3',
    fee_name: 'Library Fee',
    fee_type: 'library',
    amount_due: 2500,
    amount_paid: 2500,
    late_fee_applied: 0,
    discount_applied: 250,
    net_amount: 2250,
    payment_method: 'upi',
    transaction_id: 'UPI987654321',
    payment_date: '2024-08-05T09:15:00Z',
    due_date: '2024-08-15',
    status: 'completed',
    academic_year: '2024-25',
    semester: 1,
    created_at: '2024-08-05T09:15:00Z'
  },
  {
    id: '5',
    student_id: '5',
    student_name: 'Vikram Singh',
    student_email: 'vikram.singh@student.edu',
    college_id: '2',
    college_name: 'PSG College of Technology',
    fee_structure_id: '2',
    fee_name: 'Laboratory Fee',
    fee_type: 'laboratory',
    amount_due: 5000,
    amount_paid: 0,
    late_fee_applied: 500,
    discount_applied: 0,
    net_amount: 5500,
    payment_method: 'online',
    due_date: '2024-07-30',
    status: 'failed',
    academic_year: '2024-25',
    semester: 1,
    created_at: '2024-07-25T11:20:00Z'
  }
];

const mockStats: PaymentStats = {
  totalPayments: 1250,
  totalAmount: 15750000,
  pendingAmount: 2340000,
  completedAmount: 13410000,
  overdueAmount: 890000,
  todayPayments: 45,
  thisWeekPayments: 312,
  thisMonthPayments: 1180
};

const PaymentTracking: React.FC = () => {
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>(mockPaymentRecords);
  const [stats, setStats] = useState<PaymentStats>(mockStats);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Filter and sort payments
  const filteredPayments = paymentRecords
    .filter(payment => {
      const matchesSearch = !searchTerm || 
        payment.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.college_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.fee_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !selectedStatus || payment.status === selectedStatus;
      const matchesCollege = !selectedCollege || payment.college_id === selectedCollege;
      const matchesPaymentMethod = !selectedPaymentMethod || payment.payment_method === selectedPaymentMethod;
      
      return matchesSearch && matchesStatus && matchesCollege && matchesPaymentMethod;
    })
    .sort((a, b) => {
      const aValue = a[sortField as keyof PaymentRecord];
      const bValue = b[sortField as keyof PaymentRecord];
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'partially_paid':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, change }: any) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
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

  const PaymentDetailModal = () => {
    if (!selectedPayment) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Payment Details</h2>
            <button
              onClick={() => setShowPaymentModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Student Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Student Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Name:</span>
                  <span className="text-sm font-medium">{selectedPayment.student_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm font-medium">{selectedPayment.student_email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">College:</span>
                  <span className="text-sm font-medium">{selectedPayment.college_name}</span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Fee Type:</span>
                  <p className="text-sm font-medium capitalize">{selectedPayment.fee_type}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Fee Name:</span>
                  <p className="text-sm font-medium">{selectedPayment.fee_name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Amount Due:</span>
                  <p className="text-sm font-medium">{formatCurrency(selectedPayment.amount_due)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Amount Paid:</span>
                  <p className="text-sm font-medium">{formatCurrency(selectedPayment.amount_paid)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Late Fee:</span>
                  <p className="text-sm font-medium">{formatCurrency(selectedPayment.late_fee_applied)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Discount:</span>
                  <p className="text-sm font-medium">{formatCurrency(selectedPayment.discount_applied)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Net Amount:</span>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(selectedPayment.net_amount)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPayment.status)}`}>
                    {getStatusIcon(selectedPayment.status)}
                    {selectedPayment.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Transaction Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Payment Method:</span>
                  <p className="text-sm font-medium capitalize">{selectedPayment.payment_method}</p>
                </div>
                {selectedPayment.transaction_id && (
                  <div>
                    <span className="text-sm text-gray-600">Transaction ID:</span>
                    <p className="text-sm font-medium font-mono">{selectedPayment.transaction_id}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-600">Due Date:</span>
                  <p className="text-sm font-medium">{new Date(selectedPayment.due_date).toLocaleDateString()}</p>
                </div>
                {selectedPayment.payment_date && (
                  <div>
                    <span className="text-sm text-gray-600">Payment Date:</span>
                    <p className="text-sm font-medium">{new Date(selectedPayment.payment_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Receipt
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Payment Tracking
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Monitor and manage all payment transactions across affiliated colleges
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Payments"
          value={stats.totalPayments.toLocaleString()}
          icon={CreditCard}
          color="bg-blue-500"
          change={8.2}
        />
        <StatCard
          title="Total Amount"
          value={formatCurrency(stats.totalAmount)}
          icon={DollarSign}
          color="bg-green-500"
          change={12.5}
        />
        <StatCard
          title="Pending Amount"
          value={formatCurrency(stats.pendingAmount)}
          icon={Clock}
          color="bg-yellow-500"
          change={-5.2}
        />
        <StatCard
          title="Overdue Amount"
          value={formatCurrency(stats.overdueAmount)}
          icon={AlertTriangle}
          color="bg-red-500"
          change={-15.7}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Payments Received</span>
              <span className="text-lg font-bold text-green-600">{stats.todayPayments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">This Week</span>
              <span className="text-sm font-medium">{stats.thisWeekPayments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">This Month</span>
              <span className="text-sm font-medium">{stats.thisMonthPayments}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Online</span>
              <span className="text-sm font-medium">78%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">UPI</span>
              <span className="text-sm font-medium">15%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '15%' }}></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Others</span>
              <span className="text-sm font-medium">7%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gray-400 h-2 rounded-full" style={{ width: '7%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Rate</h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">85.2%</div>
            <p className="text-sm text-gray-600">Overall collection rate</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">+2.3% from last month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="partially_paid">Partially Paid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Colleges</option>
              <option value="1">Anna University College</option>
              <option value="2">PSG College of Technology</option>
              <option value="3">Coimbatore Institute</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Methods</option>
              <option value="online">Online</option>
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <div className="flex items-end">
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('student_name')}
                >
                  <div className="flex items-center gap-1">
                    Student/College
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee Details
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('net_amount')}
                >
                  <div className="flex items-center gap-1">
                    Amount
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('payment_date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
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
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{payment.student_name}</div>
                      <div className="text-sm text-gray-500">{payment.college_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{payment.fee_name}</div>
                      <div className="text-sm text-gray-500 capitalize">{payment.fee_type}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(payment.net_amount)}</div>
                      <div className="text-sm text-gray-500">
                        Paid: {formatCurrency(payment.amount_paid)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                      {payment.payment_method}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">
                        {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Due: {new Date(payment.due_date).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      {payment.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedPayment(payment);
                        setShowPaymentModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Detail Modal */}
      {showPaymentModal && <PaymentDetailModal />}
    </div>
  );
};

export default PaymentTracking;