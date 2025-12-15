import React, { useState, useEffect, useMemo } from "react";
import {
  X, Plus, Trash2, ChevronLeft, ChevronRight, Check, GraduationCap,
  Tag, IndianRupee, Calendar, CheckCircle, AlertCircle, Sparkles
} from "lucide-react";
import {
  FeeStructure, FeeHead, DueSchedule, Program, Department,
  FEE_CATEGORIES, FEE_QUOTAS, DEFAULT_FEE_HEADS, PU_STREAMS, PU_YEARS
} from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<FeeStructure>) => Promise<boolean>;
  structure?: FeeStructure | null;
  programs: Program[];
  departments: Department[];
}

interface FormData extends Partial<FeeStructure> {
  department_id?: string;
}

const STEPS = [
  { id: 1, title: "Program", icon: GraduationCap },
  { id: 2, title: "Category", icon: Tag },
  { id: 3, title: "Fee Heads", icon: IndianRupee },
  { id: 4, title: "Schedule", icon: Calendar },
  { id: 5, title: "Review", icon: CheckCircle },
];

const getDefaultFormData = (): FormData => ({
  department_id: "",
  program_id: "",
  program_name: "",
  semester: 1,
  academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  category: "General",
  quota: "Merit",
  fee_heads: [{ name: "Tuition Fee", amount: 0, is_mandatory: true }],
  due_schedule: [],
  scholarship_applicable: false,
  scholarship_amount: 0,
  discount_percentage: 0,
  is_active: true,
  effective_from: new Date().toISOString().split("T")[0],
  effective_to: "",
});

export const FeeStructureFormModal: React.FC<Props> = ({
  isOpen, onClose, onSave, structure, programs, departments
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(getDefaultFormData());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredPrograms = useMemo(() => {
    if (!formData.department_id) return [];
    return programs.filter(p => p.department_id === formData.department_id);
  }, [programs, formData.department_id]);

  const totalAmount = useMemo(() => 
    (formData.fee_heads || []).reduce((sum, h) => sum + (h.amount || 0), 0),
  [formData.fee_heads]);

  const scheduleTotal = useMemo(() =>
    (formData.due_schedule || []).reduce((sum, s) => sum + (s.amount || 0), 0),
  [formData.due_schedule]);

  useEffect(() => {
    if (isOpen) {
      if (structure) {
        const program = programs.find(p => p.id === structure.program_id);
        setFormData({
          ...structure,
          department_id: program?.department_id || "",
          effective_from: structure.effective_from?.split("T")[0] || "",
          effective_to: structure.effective_to?.split("T")[0] || "",
        });
      } else {
        setFormData(getDefaultFormData());
      }
      setCurrentStep(1);
      setErrors({});
    }
  }, [structure, isOpen, programs]);

  const hasDepartments = departments.length > 0;
  const hasFilteredPrograms = filteredPrograms.length > 0;

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (hasDepartments && !formData.department_id) newErrors.department = "Please select a department";
      if (hasDepartments && formData.department_id && hasFilteredPrograms && !formData.program_id) newErrors.program = "Please select a program";
      if (!hasDepartments && !formData.program_name) newErrors.program = "Please select a stream";
      if (!formData.academic_year) newErrors.academic_year = "Academic year is required";
    }
    if (step === 3) {
      if (!formData.fee_heads || formData.fee_heads.length === 0) newErrors.fee_heads = "Add at least one fee head";
      else if (formData.fee_heads.some(h => !h.name || h.amount <= 0)) newErrors.fee_heads = "All fee heads must have a name and amount";
    }
    if (step === 5 && !formData.effective_from) newErrors.effective_from = "Effective from date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => { if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, 5)); };
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleDepartmentChange = (departmentId: string) => {
    setFormData({ ...formData, department_id: departmentId, program_id: "", program_name: "" });
    setErrors({});
  };

  const handleProgramChange = (programId: string) => {
    const program = programs.find(p => p.id === programId);
    setFormData({ ...formData, program_id: programId, program_name: program?.name || "" });
    setErrors({});
  };

  const addFeeHead = () => setFormData({ ...formData, fee_heads: [...(formData.fee_heads || []), { name: "", amount: 0, is_mandatory: false }] });
  const updateFeeHead = (index: number, field: keyof FeeHead, value: string | number | boolean) => {
    const heads = [...(formData.fee_heads || [])];
    heads[index] = { ...heads[index], [field]: value };
    setFormData({ ...formData, fee_heads: heads });
  };
  const removeFeeHead = (index: number) => setFormData({ ...formData, fee_heads: (formData.fee_heads || []).filter((_, i) => i !== index) });

  const addQuickFeeHeads = () => {
    setFormData({ ...formData, fee_heads: [
      { name: "Tuition Fee", amount: 0, is_mandatory: true },
      { name: "Admission Fee", amount: 0, is_mandatory: true },
      { name: "Lab Fee", amount: 0, is_mandatory: false },
      { name: "Library Fee", amount: 0, is_mandatory: false },
      { name: "Examination Fee", amount: 0, is_mandatory: true },
    ]});
  };

  const addDueSchedule = () => {
    const schedules = formData.due_schedule || [];
    setFormData({ ...formData, due_schedule: [...schedules, { installment: schedules.length + 1, due_date: "", amount: 0 }] });
  };
  const updateDueSchedule = (index: number, field: keyof DueSchedule, value: string | number) => {
    const schedules = [...(formData.due_schedule || [])];
    schedules[index] = { ...schedules[index], [field]: value };
    setFormData({ ...formData, due_schedule: schedules });
  };
  const removeDueSchedule = (index: number) => {
    const schedules = (formData.due_schedule || []).filter((_, i) => i !== index).map((s, i) => ({ ...s, installment: i + 1 }));
    setFormData({ ...formData, due_schedule: schedules });
  };
  const distributeEvenly = () => {
    const count = formData.due_schedule?.length || 0;
    if (count === 0 || totalAmount === 0) return;
    const perInstallment = Math.floor(totalAmount / count);
    const remainder = totalAmount - (perInstallment * count);
    setFormData({ ...formData, due_schedule: (formData.due_schedule || []).map((s, i) => ({ ...s, amount: i === 0 ? perInstallment + remainder : perInstallment })) });
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;
    setSaving(true);
    const { department_id, ...saveData } = formData;
    saveData.total_amount = totalAmount;
    const success = await onSave(saveData);
    setSaving(false);
    if (success) onClose();
  };

  if (!isOpen) return null;
  const getYearLabel = (sem: number) => sem === 1 ? "1st Year" : sem === 2 ? "2nd Year" : sem === 3 ? "3rd Year" : `${sem}th Year`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{structure ? "Edit Fee Structure" : "Create Fee Structure"}</h3>
                <p className="text-blue-100 text-sm mt-1">Step {currentStep} of 5 - {STEPS[currentStep - 1].title}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition"><X className="h-5 w-5" /></button>
            </div>
          </div>

          {/* Progress Stepper */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                  <React.Fragment key={step.id}>
                    <button onClick={() => isCompleted && setCurrentStep(step.id)} className={`flex flex-col items-center gap-1 transition-all ${isCompleted ? "cursor-pointer" : "cursor-default"}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive ? "bg-blue-600 text-white shadow-lg scale-110" : isCompleted ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                        {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </div>
                      <span className={`text-xs font-medium ${isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-500"}`}>{step.title}</span>
                    </button>
                    {index < STEPS.length - 1 && <div className={`flex-1 h-1 mx-2 rounded ${currentStep > step.id ? "bg-green-500" : "bg-gray-200"}`} />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>


          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Step 1: Program Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-xl"><GraduationCap className="h-6 w-6 text-blue-600" /></div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Program Details</h4>
                    <p className="text-sm text-gray-500">Select the program and academic year for this fee structure</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {hasDepartments && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                      <select value={formData.department_id || ""} onChange={(e) => handleDepartmentChange(e.target.value)} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 transition ${errors.department ? "border-red-300 bg-red-50" : "border-gray-300"}`}>
                        <option value="">Select Department</option>
                        {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      {errors.department && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {errors.department}</p>}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{hasDepartments ? "Program *" : "Stream *"}</label>
                    {hasDepartments ? (
                      <select value={formData.program_id || ""} onChange={(e) => handleProgramChange(e.target.value)} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 transition ${errors.program ? "border-red-300 bg-red-50" : "border-gray-300"}`} disabled={!formData.department_id}>
                        <option value="">{!formData.department_id ? "Select department first" : hasFilteredPrograms ? "Select Program" : "No programs available"}</option>
                        {filteredPrograms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    ) : (
                      <select value={formData.program_name || ""} onChange={(e) => setFormData({ ...formData, program_name: e.target.value })} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 transition ${errors.program ? "border-red-300 bg-red-50" : "border-gray-300"}`}>
                        <option value="">Select Stream</option>
                        {PU_STREAMS.map((stream) => <option key={stream} value={stream}>{stream}</option>)}
                      </select>
                    )}
                    {errors.program && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {errors.program}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                    <select value={formData.semester || 1} onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition">
                      {PU_YEARS.map((year) => <option key={year.value} value={year.value}>{year.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year *</label>
                    <input type="text" value={formData.academic_year || ""} onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 transition ${errors.academic_year ? "border-red-300 bg-red-50" : "border-gray-300"}`} placeholder="2024-2025" />
                    {errors.academic_year && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {errors.academic_year}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Fee Category */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-purple-100 rounded-xl"><Tag className="h-6 w-6 text-purple-600" /></div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Fee Category & Quota</h4>
                    <p className="text-sm text-gray-500">Define the category and quota for this fee structure</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select value={formData.category || "General"} onChange={(e) => setFormData({ ...formData, category: e.target.value as any })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition">
                      {FEE_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quota *</label>
                    <select value={formData.quota || "Merit"} onChange={(e) => setFormData({ ...formData, quota: e.target.value as any })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition">
                      {FEE_QUOTAS.map((q) => <option key={q} value={q}>{q}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.is_active || false} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500" />
                    <div>
                      <span className="font-medium text-gray-900">Active Fee Structure</span>
                      <p className="text-sm text-gray-500">Enable this to make the fee structure available for use</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Step 3: Fee Heads */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-xl"><IndianRupee className="h-6 w-6 text-green-600" /></div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Fee Components</h4>
                      <p className="text-sm text-gray-500">Add the fee heads that make up this structure</p>
                    </div>
                  </div>
                  <button type="button" onClick={addQuickFeeHeads} className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition text-sm font-medium">
                    <Sparkles className="h-4 w-4" /> Quick Add Common Fees
                  </button>
                </div>
                {errors.fee_heads && <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700"><AlertCircle className="h-5 w-5" />{errors.fee_heads}</div>}
                <div className="space-y-3">
                  {(formData.fee_heads || []).map((head, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition">
                      <select value={head.name} onChange={(e) => updateFeeHead(index, "name", e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                        <option value="">Select Fee Head</option>
                        {DEFAULT_FEE_HEADS.map((fh) => <option key={fh} value={fh}>{fh}</option>)}
                      </select>
                      <div className="w-36 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <input type="number" value={head.amount || ""} onChange={(e) => updateFeeHead(index, "amount", parseFloat(e.target.value) || 0)} className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="0" min="0" />
                      </div>
                      <label className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={head.is_mandatory} onChange={(e) => updateFeeHead(index, "is_mandatory", e.target.checked)} className="h-4 w-4 text-blue-600 rounded" />
                        <span className="text-sm text-gray-700">Required</span>
                      </label>
                      <button type="button" onClick={() => removeFeeHead(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="h-5 w-5" /></button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addFeeHead} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 transition flex items-center justify-center gap-2">
                  <Plus className="h-5 w-5" /> Add Fee Head
                </button>
                <div className="mt-6 p-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white">
                  <div className="flex items-center justify-between">
                    <div><p className="text-blue-100 text-sm">Total Fee Amount</p><p className="text-3xl font-bold">₹{totalAmount.toLocaleString()}</p></div>
                    <div className="p-3 bg-white/20 rounded-xl"><IndianRupee className="h-8 w-8" /></div>
                  </div>
                </div>
              </div>
            )}
