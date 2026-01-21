import React, { useState } from 'react';
import { Search, TrendingUp, DollarSign, Building, AlertCircle, CheckCircle } from 'lucide-react';
import { DepartmentBudget, BudgetCategory } from '../hooks/useDepartmentBudgets';

interface Props {
  budgets: DepartmentBudget[];
  loading: boolean;
  stats: {
    totalAllocated: number;
    totalSpent: number;
    totalRemaining: number;
    utilizationRate: number;
    departmentCount: number;
  };
}

const statusConfig = {
  draft: { label: 'Draft', color: 'text-gray-700', bg: 'bg-gray-100' },
  approved: { label: 'Approved', color: 'text-blue-700', bg: 'bg-blue-100' },
  active: { label: 'Active', color: 'text-green-700', bg: 'bg-green-100' },
  closed: { label: 'Closed', color: 'text-red-700', bg: 'bg-red-100' },
};

export const DepartmentBudgetsTab: React.FC<Props> = ({ budgets, loading, stats }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBudget, setSelectedBudget] = useState<DepartmentBudget | null>(null);

  const filteredBudgets = budgets.filter(
    (budget) =>
      budget.department_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      budget.budget_year.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Department Budgets</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg text-white">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-blue-600">Departments</p>
              <p className="text-xl font-bold text-blue-900">{stats.departmentCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg text-white">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-green-600">Total Allocated</p>
              <p className="text-xl font-bold text-green-900">
                ₹{(stats.totalAllocated / 100000).toFixed(1)}L
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500 rounded-lg text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-yellow-600">Utilization</p>
              <p className="text-xl font-bold text-yellow-900">
                {stats.utilizationRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg text-white">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-purple-600">Remaining</p>
              <p className="text-xl font-bold text-purple-900">
                ₹{(stats.totalRemaining / 100000).toFixed(1)}L
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by department name or budget year..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Budget List */}
      {filteredBudgets.length === 0 ? (
        <div className="p-8 bg-gray-50 border border-gray-200 rounded-xl text-center">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-900 font-medium mb-1">
            {budgets.length === 0 ? 'No department budgets found' : 'No matching budgets'}
          </p>
          <p className="text-sm text-gray-600">
            {budgets.length === 0
              ? 'Department budgets will appear here once they are created'
              : 'Try adjusting your search terms'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBudgets.map((budget) => {
            const config = statusConfig[budget.status] || statusConfig.draft;
            const utilizationRate =
              budget.allocated_amount > 0
                ? (budget.spent_amount / budget.allocated_amount) * 100
                : 0;

            return (
              <div
                key={budget.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {budget.department_name}
                    </h3>
                    <p className="text-sm text-gray-600">Budget Year: {budget.budget_year}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${config.bg} ${config.color}`}
                  >
                    {config.label}
                  </span>
                </div>

                {/* Budget Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Allocated</p>
                    <p className="text-lg font-bold text-blue-900">
                      ₹{budget.allocated_amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Spent</p>
                    <p className="text-lg font-bold text-green-900">
                      ₹{budget.spent_amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-600">Remaining</p>
                    <p className="text-lg font-bold text-yellow-900">
                      ₹{budget.remaining_amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Utilization Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Budget Utilization</span>
                    <span className="text-sm text-gray-600">{utilizationRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        utilizationRate > 90
                          ? 'bg-red-500'
                          : utilizationRate > 70
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Budget Categories */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Budget Categories</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {budget.budget_categories.map((category, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm text-gray-700">{category.category}</span>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            ₹{category.spent_amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            of ₹{category.allocated_amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end mt-4 space-x-2">
                  <button
                    onClick={() => setSelectedBudget(budget)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    View Details
                  </button>
                  {/* <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">
                    Edit Budget
                  </button> */}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Budget Detail Modal (placeholder) */}
      {selectedBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedBudget.department_name} - Budget Details
              </h3>
              <button
                onClick={() => setSelectedBudget(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Budget Year</p>
                  <p className="font-medium">{selectedBudget.budget_year}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig[selectedBudget.status].bg} ${statusConfig[selectedBudget.status].color}`}
                  >
                    {statusConfig[selectedBudget.status].label}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Category Breakdown</h4>
                <div className="space-y-3">
                  {selectedBudget.budget_categories.map((category, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium">{category.category}</h5>
                        <span className="text-sm text-gray-600">
                          {category.allocated_amount > 0
                            ? ((category.spent_amount / category.allocated_amount) * 100).toFixed(1)
                            : 0}
                          % utilized
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">Allocated</p>
                          <p className="font-medium">
                            ₹{category.allocated_amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Spent</p>
                          <p className="font-medium">₹{category.spent_amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Remaining</p>
                          <p className="font-medium">
                            ₹{category.remaining_amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
