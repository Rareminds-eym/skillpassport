import React, { useState } from 'react';
import {
  CreditCardIcon,
  DocumentTextIcon,
  CalculatorIcon,
  ChartBarIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface DeductionRule {
  id: string;
  name: string;
  type: 'PF' | 'ESI' | 'TDS' | 'Professional Tax' | 'Other';
  employeeRate: number;
  employerRate?: number;
  maxLimit?: number;
  minSalary?: number;
  maxSalary?: number;
  isActive: boolean;
}

const StatutoryDeductions: React.FC = () => {
  const [activeTab, setActiveTab] = useState('rules');
  const [showAddModal, setShowAddModal] = useState(false);

  // Mock data
  const deductionStats = {
    totalDeductions: 2850000,
    pfContribution: 1200000,
    esiContribution: 450000,
    tdsDeduction: 800000,
    professionalTax: 400000,
  };

  const deductionRules: DeductionRule[] = [
    {
      id: '1',
      name: 'Provident Fund (PF)',
      type: 'PF',
      employeeRate: 12,
      employerRate: 12,
      maxLimit: 1800,
      minSalary: 15000,
      isActive: true,
    },
    {
      id: '2',
      name: 'Employee State Insurance (ESI)',
      type: 'ESI',
      employeeRate: 0.75,
      employerRate: 3.25,
      maxSalary: 21000,
      isActive: true,
    },
    {
      id: '3',
      name: 'Tax Deducted at Source (TDS)',
      type: 'TDS',
      employeeRate: 10,
      minSalary: 250000,
      isActive: true,
    },
    {
      id: '4',
      name: 'Professional Tax',
      type: 'Professional Tax',
      employeeRate: 200,
      minSalary: 15000,
      isActive: true,
    },
  ];

  const tabs = [
    { id: 'rules', name: 'Deduction Rules', icon: DocumentTextIcon },
    { id: 'calculator', name: 'Calculator', icon: CalculatorIcon },
    { id: 'reports', name: 'Reports', icon: ChartBarIcon },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PF':
        return 'bg-blue-100 text-blue-800';
      case 'ESI':
        return 'bg-green-100 text-green-800';
      case 'TDS':
        return 'bg-red-100 text-red-800';
      case 'Professional Tax':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderRules = () => (
    <div className="space-y-6">
      {/* Add Rule Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add Deduction Rule
        </button>
      </div>

      {/* Deduction Rules Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Statutory Deduction Rules</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deduction Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employer Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salary Range
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
              {deductionRules.map((rule) => (
                <tr key={rule.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(rule.type)}`}
                    >
                      {rule.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rule.employeeRate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rule.employerRate ? `${rule.employerRate}%` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rule.minSalary && rule.maxSalary
                      ? `₹${rule.minSalary.toLocaleString()} - ₹${rule.maxSalary.toLocaleString()}`
                      : rule.minSalary
                        ? `Above ₹${rule.minSalary.toLocaleString()}`
                        : rule.maxSalary
                          ? `Below ₹${rule.maxSalary.toLocaleString()}`
                          : 'All'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        rule.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <PencilIcon className="h-4 w-4" />
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

  const renderCalculator = () => (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Deduction Calculator</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Basic Salary</label>
            <input
              type="number"
              placeholder="Enter basic salary"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gross Salary</label>
            <input
              type="number"
              placeholder="Enter gross salary"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="mt-6">
          <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
            <CalculatorIcon className="-ml-1 mr-2 h-5 w-5" />
            Calculate Deductions
          </button>
        </div>

        {/* Results */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-blue-600">PF Deduction</div>
            <div className="text-lg font-semibold text-blue-900">₹1,800</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-green-600">ESI Deduction</div>
            <div className="text-lg font-semibold text-green-900">₹157</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-red-600">TDS Deduction</div>
            <div className="text-lg font-semibold text-red-900">₹2,500</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-purple-600">Professional Tax</div>
            <div className="text-lg font-semibold text-purple-900">₹200</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Deduction Reports</h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50">
              <div className="font-medium text-gray-900">PF Contribution Report</div>
              <div className="text-sm text-gray-500">Employee and employer PF contributions</div>
            </button>
            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50">
              <div className="font-medium text-gray-900">ESI Contribution Report</div>
              <div className="text-sm text-gray-500">ESI deductions and employer contributions</div>
            </button>
            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50">
              <div className="font-medium text-gray-900">TDS Deduction Report</div>
              <div className="text-sm text-gray-500">Tax deducted at source summary</div>
            </button>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Reports</h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50">
              <div className="font-medium text-gray-900">Form 12A (PF)</div>
              <div className="text-sm text-gray-500">Annual PF contribution statement</div>
            </button>
            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50">
              <div className="font-medium text-gray-900">Form 16 (TDS)</div>
              <div className="text-sm text-gray-500">Annual TDS certificate</div>
            </button>
            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50">
              <div className="font-medium text-gray-900">ESI Challan</div>
              <div className="text-sm text-gray-500">Monthly ESI payment challan</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'rules':
        return renderRules();
      case 'calculator':
        return renderCalculator();
      case 'reports':
        return renderReports();
      default:
        return renderRules();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Statutory Deductions</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage statutory deductions including PF, ESI, TDS, and Professional Tax.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCardIcon className="h-8 w-8 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Deductions</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₹{(deductionStats.totalDeductions / 100000).toFixed(1)}L
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCardIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">PF Contribution</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₹{(deductionStats.pfContribution / 100000).toFixed(1)}L
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCardIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">ESI Contribution</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₹{(deductionStats.esiContribution / 100000).toFixed(1)}L
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCardIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">TDS Deduction</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₹{(deductionStats.tdsDeduction / 100000).toFixed(1)}L
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCardIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Professional Tax</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₹{(deductionStats.professionalTax / 100000).toFixed(1)}L
              </p>
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

export default StatutoryDeductions;
