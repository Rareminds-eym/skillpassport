import React from "react";
import { X, FileDown, Calendar, Tag, Users, Percent, IndianRupee } from "lucide-react";
import { FeeStructure } from "../types";
import { exportFeeStructurePDF } from "../utils/exportFeeStructurePDF";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  structure: FeeStructure | null;
}

const getYearLabel = (semester: number) => {
  if (semester === 1) return "1st Year";
  if (semester === 2) return "2nd Year";
  if (semester === 3) return "3rd Year";
  return `${semester}th Year`;
};

export const FeeStructureViewModal: React.FC<Props> = ({ isOpen, onClose, structure }) => {
  if (!isOpen || !structure) return null;

  const handleExportPDF = () => {
    exportFeeStructurePDF(structure);
  };

  const totalAmount = (structure.fee_heads || []).reduce((sum, h) => sum + (h.amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 z-10 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{structure.program_name}</h3>
                <p className="text-blue-100 text-sm mt-1">
                  {getYearLabel(structure.semester)} • {structure.academic_year}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
                >
                  <FileDown className="h-4 w-4" />
                  Export PDF
                </button>
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Status & Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Tag className="h-4 w-4" />
                  Category
                </div>
                <p className="font-semibold text-gray-900">{structure.category}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Users className="h-4 w-4" />
                  Quota
                </div>
                <p className="font-semibold text-gray-900">{structure.quota}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Calendar className="h-4 w-4" />
                  Effective From
                </div>
                <p className="font-semibold text-gray-900">
                  {structure.effective_from ? new Date(structure.effective_from).toLocaleDateString() : "-"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Calendar className="h-4 w-4" />
                  Effective To
                </div>
                <p className="font-semibold text-gray-900">
                  {structure.effective_to ? new Date(structure.effective_to).toLocaleDateString() : "Ongoing"}
                </p>
              </div>
            </div>

            {/* Fee Heads Table */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-green-600" />
                Fee Heads Breakdown
              </h4>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Fee Head</th>
                      <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Type</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(structure.fee_heads || []).map((head, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{head.name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 text-xs rounded-full ${head.is_mandatory ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                            {head.is_mandatory ? "Mandatory" : "Optional"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">₹{(head.amount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-blue-50">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 font-semibold text-blue-900">Total Amount</td>
                      <td className="px-4 py-3 text-right font-bold text-blue-600 text-lg">₹{totalAmount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Due Schedule */}
            {(structure.due_schedule || []).length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Payment Schedule
                </h4>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Installment</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Due Date</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(structure.due_schedule || []).map((schedule, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">Installment {schedule.installment}</td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            {schedule.due_date ? new Date(schedule.due_date).toLocaleDateString() : "-"}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">₹{(schedule.amount || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Scholarship & Discount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Scholarship</h4>
                </div>
                {structure.scholarship_applicable ? (
                  <p className="text-2xl font-bold text-green-600">₹{(structure.scholarship_amount || 0).toLocaleString()}</p>
                ) : (
                  <p className="text-gray-500">Not Applicable</p>
                )}
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-900">Discount</h4>
                </div>
                <p className="text-2xl font-bold text-purple-600">{structure.discount_percentage || 0}%</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center pt-4">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${structure.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                {structure.is_active ? "✓ Active Fee Structure" : "Inactive Fee Structure"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
