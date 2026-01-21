import React, { useState } from 'react';
import {
  BanknotesIcon,
  CalendarDaysIcon,
  DocumentArrowDownIcon,
  PlayIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface PayrollCycle {
  id: string;
  month: string;
  year: number;
  status: 'Draft' | 'Processing' | 'Completed' | 'Approved';
  totalEmployees: number;
  totalAmount: number;
  processedDate?: string;
}

const PayrollProcessing: React.FC = () => {
  const [activeTab, setActiveTab] = useState('current');
  const [selectedCycle, setSelectedCycle] = useState<string | null>(null);

  // Mock data
  const payrollStats = {
    totalEmployees: 425,
    totalSalary: 12500000,
    pendingApprovals: 3,
    completedCycles: 8,
  };

  const payrollCycles: PayrollCycle[] = [
    {
      id: '1',
      month: 'January',
      year: 2025,
      status: 'Processing',
      totalEmployees: 425,
      totalAmount: 12500000,
    },
    {
      id: '2',
      month: 'December',
      year: 2024,
      status: 'Completed',
      totalEmployees: 420,
      totalAmount: 12300000,
      processedDate: '2024-12-31',
    },
    {
      id: '3',
      month: 'November',
      year: 2024,
      status: 'Completed',
      totalEmployees: 418,
      totalAmount: 12200000,
      processedDate: '2024-11-30',
    },
  ];

  const tabs = [
    { id: 'current', name: 'Current Cycle', icon: CalendarDaysIcon },
    { id: 'history', name: 'Payroll History', icon: DocumentArrowDownIcon },
    { id: 'reports', name: 'Reports', icon: BanknotesIcon },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft':
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
      case 'Processing':
        return <PlayIcon className="h-5 w-5 text-blue-500" />;
      case 'Completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'Approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const renderCurrentCycle = () => (
    <div className="space-y-6">
      {/* Current Payroll Status */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">January 2025 Payroll</h3>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <PlayIcon className="h-4 w-4 mr-1" />
            Processing
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">425</div>
            <div className="text-sm text-gray-500">Total Employees</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">₹1,25,00,000</div>
            <div className="text-sm text-gray-500">Total Salary</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">75%</div>
            <div className="text-sm text-gray-500">Processing Complete</div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
            <PlayIcon className="h-4 w-4 mr-2" />
            Continue Processing
          </button>
          <button className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Generate Preview
          </button>
        </div>
      </div>

      {/* Processing Steps */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Processing Steps</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
            <span className="text-sm text-gray-900">Attendance Data Imported</span>
          </div>
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
            <span className="text-sm text-gray-900">Leave Deductions Calculated</span>
          </div>
          <div className="flex items-center">
            <PlayIcon className="h-5 w-5 text-blue-500 mr-3" />
            <span className="text-sm text-gray-900">Statutory Deductions Processing</span>
          </div>
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
            <span className="text-sm text-gray-500">Final Salary Calculation</span>
          </div>
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
            <span className="text-sm text-gray-500">Payslip Generation</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Payroll History</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Period
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employees
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Processed Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payrollCycles.map((cycle) => (
              <tr key={cycle.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {cycle.month} {cycle.year}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {cycle.totalEmployees}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹{cycle.totalAmount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cycle.status)}`}
                  >
                    {getStatusIcon(cycle.status)}
                    <span className="ml-1">{cycle.status}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {cycle.processedDate ? new Date(cycle.processedDate).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                    View Details
                  </button>
                  <button className="text-green-600 hover:text-green-900">Download</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Reports</h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50">
              <div className="font-medium text-gray-900">Salary Summary Report</div>
              <div className="text-sm text-gray-500">Department-wise salary breakdown</div>
            </button>
            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50">
              <div className="font-medium text-gray-900">Deduction Report</div>
              <div className="text-sm text-gray-500">All statutory and voluntary deductions</div>
            </button>
            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50">
              <div className="font-medium text-gray-900">Bank Transfer Report</div>
              <div className="text-sm text-gray-500">Bank-wise salary transfer details</div>
            </button>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Reports</h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50">
              <div className="font-medium text-gray-900">PF Contribution Report</div>
              <div className="text-sm text-gray-500">Employee and employer PF contributions</div>
            </button>
            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50">
              <div className="font-medium text-gray-900">ESI Report</div>
              <div className="text-sm text-gray-500">ESI deductions and contributions</div>
            </button>
            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50">
              <div className="font-medium text-gray-900">TDS Report</div>
              <div className="text-sm text-gray-500">Tax deducted at source details</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'current':
        return renderCurrentCycle();
      case 'history':
        return renderHistory();
      case 'reports':
        return renderReports();
      default:
        return renderCurrentCycle();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payroll Processing</h1>
        <p className="mt-1 text-sm text-gray-600">
          Process monthly payroll for faculty and staff members.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BanknotesIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Employees</p>
              <p className="text-2xl font-semibold text-gray-900">{payrollStats.totalEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BanknotesIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Monthly Salary</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₹{(payrollStats.totalSalary / 100000).toFixed(1)}L
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
              <p className="text-2xl font-semibold text-gray-900">
                {payrollStats.pendingApprovals}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed Cycles</p>
              <p className="text-2xl font-semibold text-gray-900">{payrollStats.completedCycles}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default PayrollProcessing;
