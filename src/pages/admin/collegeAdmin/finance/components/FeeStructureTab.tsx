import React, { useState } from "react";
import { Plus, Search, Pencil, Trash2, Copy, ToggleLeft, ToggleRight, IndianRupee, ChevronDown, ChevronUp, Eye, FileDown } from "lucide-react";
import { FeeStructure } from "../types";
import { FeeStructureViewModal } from "./FeeStructureViewModal";
import { exportFeeStructurePDF } from "../utils/exportFeeStructurePDF";

interface Props {
  feeStructures: FeeStructure[];
  loading: boolean;
  onRefresh?: () => void;
  onCreate: () => void;
  onEdit: (structure: FeeStructure) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, currentStatus: boolean) => void;
  onDuplicate: (structure: FeeStructure) => void;
}

export const FeeStructureTab: React.FC<Props> = ({
  feeStructures,
  loading,
  onCreate,
  onEdit,
  onDelete,
  onToggleActive,
  onDuplicate,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<FeeStructure | null>(null);

  const handleView = (structure: FeeStructure) => {
    setSelectedStructure(structure);
    setViewModalOpen(true);
  };

  const handleExportPDF = (structure: FeeStructure) => {
    exportFeeStructurePDF(structure);
  };

  const filteredStructures = feeStructures.filter((fs) => {
    const matchesSearch = fs.program_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fs.academic_year.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || fs.category === filterCategory;
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "active" && fs.is_active) || 
      (filterStatus === "inactive" && !fs.is_active);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold text-gray-900">Fee Structure Setup</h2>
        <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Plus className="h-4 w-4" />
          Add Fee Structure
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by program or academic year..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          <option value="General">General</option>
          <option value="OBC">OBC</option>
          <option value="SC">SC</option>
          <option value="ST">ST</option>
          <option value="EWS">EWS</option>
          <option value="Management">Management</option>
          <option value="NRI">NRI</option>
          <option value="Foreign">Foreign</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>


      {filteredStructures.length === 0 ? (
        <div className="p-8 bg-blue-50 border border-blue-200 rounded-xl text-center">
          <IndianRupee className="h-12 w-12 text-blue-400 mx-auto mb-3" />
          <p className="text-blue-900 font-medium mb-1">
            {feeStructures.length === 0 ? "No fee structures added yet" : "No matching fee structures"}
          </p>
          <p className="text-sm text-blue-700">
            {feeStructures.length === 0 
              ? 'Click "Add Fee Structure" to create your first fee structure'
              : "Try adjusting your search or filters"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStructures.map((fs) => (
            <div key={fs.id} className={`border rounded-xl overflow-hidden ${fs.is_active ? "border-gray-200" : "border-gray-300 bg-gray-50"}`}>
              {/* Header Row */}
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setExpandedId(expandedId === fs.id ? null : fs.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {expandedId === fs.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{fs.program_name}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${fs.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                        {fs.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {fs.semester === 1 ? "1st Year" : fs.semester === 2 ? "2nd Year" : fs.semester === 3 ? "3rd Year" : `${fs.semester}th Year`} • {fs.academic_year} • {fs.category} • {fs.quota}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-green-600">₹{(fs.total_amount || 0).toLocaleString()}</span>
                  <div className="flex gap-1 ml-4">
                    <button onClick={() => handleView(fs)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="View Details">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleExportPDF(fs)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Export PDF">
                      <FileDown className="h-4 w-4" />
                    </button>
                    <button onClick={() => onEdit(fs)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => onDuplicate(fs)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg" title="Duplicate">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button onClick={() => onToggleActive(fs.id, fs.is_active)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title={fs.is_active ? "Deactivate" : "Activate"}>
                      {fs.is_active ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>
                    <button onClick={() => onDelete(fs.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === fs.id && (
                <div className="border-t bg-gray-50 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Fee Heads */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Fee Heads</h4>
                      <div className="space-y-2">
                        {(fs.fee_heads || []).map((head, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border">
                            <span className="text-sm text-gray-700">
                              {head.name}
                              {head.is_mandatory && <span className="ml-1 text-xs text-red-500">*</span>}
                            </span>
                            <span className="text-sm font-medium">₹{(head.amount || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Due Schedule */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Due Schedule</h4>
                      {(fs.due_schedule || []).length > 0 ? (
                        <div className="space-y-2">
                          {(fs.due_schedule || []).map((schedule, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border">
                              <span className="text-sm text-gray-700">Installment {schedule.installment}</span>
                              <div className="text-right">
                                <span className="text-sm font-medium">₹{(schedule.amount || 0).toLocaleString()}</span>
                                {schedule.due_date && (
                                  <p className="text-xs text-gray-500">{new Date(schedule.due_date).toLocaleDateString()}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No installment schedule defined</p>
                      )}
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Scholarship:</span>
                      <span className="ml-2 font-medium">{fs.scholarship_applicable ? `₹${(fs.scholarship_amount || 0).toLocaleString()}` : "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Discount:</span>
                      <span className="ml-2 font-medium">{fs.discount_percentage || 0}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Effective From:</span>
                      <span className="ml-2 font-medium">{fs.effective_from ? new Date(fs.effective_from).toLocaleDateString() : "-"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Effective To:</span>
                      <span className="ml-2 font-medium">{fs.effective_to ? new Date(fs.effective_to).toLocaleDateString() : "Ongoing"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      <FeeStructureViewModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedStructure(null);
        }}
        structure={selectedStructure}
      />
    </div>
  );
};
