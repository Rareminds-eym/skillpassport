import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Copy, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';
import { FeeStructure } from '../types';

interface Props {
  feeStructures: FeeStructure[];
  loading: boolean;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (structure: FeeStructure) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export const FeeStructureTab: React.FC<Props> = ({
  feeStructures,
  loading,
  onRefresh,
  onCreate,
  onEdit,
  onDelete,
  onToggleActive,
  onDuplicate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Filter fee structures
  const filteredStructures = feeStructures.filter((structure) => {
    const matchesSearch =
      structure.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      structure.fee_head.toLowerCase().includes(searchTerm.toLowerCase()) ||
      structure.academic_year.includes(searchTerm);

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && structure.is_active) ||
      (filterStatus === 'inactive' && !structure.is_active);

    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string, className: string, feeHead: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete the fee structure for ${className} - ${feeHead}?`
      )
    ) {
      onDelete(id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fee Structure Setup</h2>
          <p className="text-gray-600 text-sm">
            Create and manage fee structures for different classes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={onCreate}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Fee Structure
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by class, fee head, or academic year..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fee Structures List */}
      {filteredStructures.length === 0 ? (
        <div className="p-8 bg-gray-50 border border-gray-200 rounded-xl text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-900 font-medium mb-1">
            {feeStructures.length === 0
              ? 'No fee structures created yet'
              : 'No matching fee structures'}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            {feeStructures.length === 0
              ? 'Create your first fee structure to get started'
              : 'Try adjusting your search or filters'}
          </p>
          {feeStructures.length === 0 && (
            <button
              onClick={onCreate}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Fee Structure
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Academic Year
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Class</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Fee Head
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  Frequency
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  Late Fee %
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStructures.map((structure) => (
                <tr key={structure.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                      {structure.academic_year}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {structure.class_name}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {structure.fee_head === 'Others'
                      ? structure.custom_fee_head
                      : structure.fee_head}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-green-600">
                    ₹{structure.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium capitalize">
                      {structure.frequency}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {structure.late_fee_percentage ? (
                      <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        {structure.late_fee_percentage}%
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onToggleActive(structure.id)}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        structure.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {structure.is_active ? (
                        <>
                          <ToggleRight className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEdit(structure)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDuplicate(structure.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(structure.id, structure.class_name, structure.fee_head)
                        }
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
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

      {/* Summary */}
      {filteredStructures.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Structures:</span>
              <span className="ml-2 font-semibold text-gray-900">{filteredStructures.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Active:</span>
              <span className="ml-2 font-semibold text-green-600">
                {filteredStructures.filter((s) => s.is_active).length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Total Value:</span>
              <span className="ml-2 font-semibold text-blue-600">
                ₹
                {filteredStructures
                  .filter((s) => s.is_active)
                  .reduce((sum, s) => sum + s.amount, 0)
                  .toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
