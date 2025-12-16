import React, { useState, useEffect, useMemo } from "react";
import { X, Plus, Trash2, ChevronLeft, ChevronRight, Check, GraduationCap, Tag, IndianRupee, Calendar, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { FeeStructure, FeeHead, DueSchedule, Program, Department, FEE_CATEGORIES, FEE_QUOTAS, DEFAULT_FEE_HEADS, PU_STREAMS, PU_YEARS } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<FeeStructure>) => Promise<boolean>;
  structure?: FeeStructure | null;
  programs: Program[];
  departments: Department[];
}

interface FormData extends Partial<FeeStructure> { department_id?: string; }

const STEPS = [
  { id: 1, title: "Program", icon: GraduationCap },
  { id: 2, title: "Category", icon: Tag },
  { id: 3, title: "Fee Heads", icon: IndianRupee },
  { id: 4, title: "Schedule", icon: Calendar },
  { id: 5, title: "Review", icon: CheckCircle },
];

const getDefaultFormData = (): FormData => ({
  department_id: "", program_id: "", program_name: "", semester: 1,
  academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  category: "General", quota: "Merit",
  fee_heads: [{ name: "Tuition Fee", amount: 0, is_mandatory: true }],
  due_schedule: [], scholarship_applicable: false, scholarship_amount: 0,
  discount_percentage: 0, is_active: true,
  effective_from: new Date().toISOString().split("T")[0], effective_to: "",
});

export const FeeStructureFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, structure, programs, departments }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(getDefaultFormData());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredPrograms = useMemo(() => formData.department_id ? programs.filter(p => p.department_id === formData.department_id) : [], [programs, formData.department_id]);
  const totalAmount = useMemo(() => (formData.fee_heads || []).reduce((sum, h) => sum + (h.amount || 0), 0), [formData.fee_heads]);
  const scheduleTotal = useMemo(() => (formData.due_schedule || []).reduce((sum, s) => sum + (s.amount || 0), 0), [formData.due_schedule]);

  useEffect(() => {
    if (isOpen) {
      if (structure) {
        const program = programs.find(p => p.id === structure.program_id);
        setFormData({ ...structure, department_id: program?.department_id || "", effective_from: structure.effective_from?.split("T")[0] || "", effective_to: structure.effective_to?.split("T")[0] || "" });
      } else { setFormData(getDefaultFormData()); }
      setCurrentStep(1); setErrors({});
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
    if (step === 3 && (!formData.fee_heads || formData.fee_heads.length === 0 || formData.fee_heads.some(h => !h.name || h.amount <= 0))) newErrors.fee_heads = "All fee heads must have a name and amount > 0";
    if (step === 5 && !formData.effective_from) newErrors.effective_from = "Effective from date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => { if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, 5)); };
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const handleDepartmentChange = (id: string) => { setFormData({ ...formData, department_id: id, program_id: "", program_name: "" }); setErrors({}); };
  const handleProgramChange = (id: string) => { const p = programs.find(x => x.id === id); setFormData({ ...formData, program_id: id, program_name: p?.name || "" }); setErrors({}); };
  const addFeeHead = () => setFormData({ ...formData, fee_heads: [...(formData.fee_heads || []), { name: "", amount: 0, is_mandatory: false }] });
  const updateFeeHead = (i: number, f: keyof FeeHead, v: string | number | boolean) => { const h = [...(formData.fee_heads || [])]; h[i] = { ...h[i], [f]: v }; setFormData({ ...formData, fee_heads: h }); };
  const removeFeeHead = (i: number) => setFormData({ ...formData, fee_heads: (formData.fee_heads || []).filter((_, x) => x !== i) });
  const addQuickFeeHeads = () => setFormData({ ...formData, fee_heads: [{ name: "Tuition Fee", amount: 0, is_mandatory: true }, { name: "Admission Fee", amount: 0, is_mandatory: true }, { name: "Lab Fee", amount: 0, is_mandatory: false }, { name: "Library Fee", amount: 0, is_mandatory: false }, { name: "Examination Fee", amount: 0, is_mandatory: true }] });
  const addDueSchedule = () => { const s = formData.due_schedule || []; setFormData({ ...formData, due_schedule: [...s, { installment: s.length + 1, due_date: "", amount: 0 }] }); };
  const updateDueSchedule = (i: number, f: keyof DueSchedule, v: string | number) => { const s = [...(formData.due_schedule || [])]; s[i] = { ...s[i], [f]: v }; setFormData({ ...formData, due_schedule: s }); };
  const removeDueSchedule = (i: number) => setFormData({ ...formData, due_schedule: (formData.due_schedule || []).filter((_, x) => x !== i).map((s, x) => ({ ...s, installment: x + 1 })) });
  const distributeEvenly = () => { const c = formData.due_schedule?.length || 0; if (c === 0 || totalAmount === 0) return; const p = Math.floor(totalAmount / c); const r = totalAmount - (p * c); setFormData({ ...formData, due_schedule: (formData.due_schedule || []).map((s, i) => ({ ...s, amount: i === 0 ? p + r : p })) }); };
  const handleSubmit = async () => { if (!validateStep(5)) return; setSaving(true); const { department_id, ...saveData } = formData; saveData.total_amount = totalAmount; const success = await onSave(saveData); setSaving(false); if (success) onClose(); };

  if (!isOpen) return null;
  const getYearLabel = (s: number) => s === 1 ? "1st Year" : s === 2 ? "2nd Year" : s === 3 ? "3rd Year" : `${s}th Year`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div><h3 className="text-xl font-bold">{structure ? "Edit Fee Structure" : "Create Fee Structure"}</h3><p className="text-blue-100 text-sm mt-1">Step {currentStep} of 5 - {STEPS[currentStep - 1].title}</p></div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition"><X className="h-5 w-5" /></button>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              {STEPS.map((step, idx) => { const Icon = step.icon; const isActive = currentStep === step.id; const isCompleted = currentStep > step.id; return (
                <React.Fragment key={step.id}>
                  <button onClick={() => isCompleted && setCurrentStep(step.id)} className={`flex flex-col items-center gap-1 ${isCompleted ? "cursor-pointer" : "cursor-default"}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive ? "bg-blue-600 text-white shadow-lg scale-110" : isCompleted ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>{isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}</div>
                    <span className={`text-xs font-medium ${isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-500"}`}>{step.title}</span>
                  </button>
                  {idx < STEPS.length - 1 && <div className={`flex-1 h-1 mx-2 rounded ${currentStep > step.id ? "bg-green-500" : "bg-gray-200"}`} />}
                </React.Fragment>
              ); })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-blue-100 rounded-xl"><GraduationCap className="h-6 w-6 text-blue-600" /></div><div><h4 className="text-lg font-semibold text-gray-900">Program Details</h4><p className="text-sm text-gray-500">Select the program and academic year</p></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {hasDepartments && (<div><label className="block text-sm font-medium text-gray-700 mb-2">Department *</label><select value={formData.department_id || ""} onChange={(e) => handleDepartmentChange(e.target.value)} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${errors.department ? "border-red-300 bg-red-50" : "border-gray-300"}`}><option value="">Select Department</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>{errors.department && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {errors.department}</p>}</div>)}
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">{hasDepartments ? "Program *" : "Stream *"}</label>{hasDepartments ? (<select value={formData.program_id || ""} onChange={(e) => handleProgramChange(e.target.value)} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${errors.program ? "border-red-300 bg-red-50" : "border-gray-300"}`} disabled={!formData.department_id}><option value="">{!formData.department_id ? "Select department first" : hasFilteredPrograms ? "Select Program" : "No programs"}</option>{filteredPrograms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>) : (<select value={formData.program_name || ""} onChange={(e) => setFormData({ ...formData, program_name: e.target.value })} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${errors.program ? "border-red-300 bg-red-50" : "border-gray-300"}`}><option value="">Select Stream</option>{PU_STREAMS.map((s) => <option key={s} value={s}>{s}</option>)}</select>)}{errors.program && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {errors.program}</p>}</div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Year *</label><select value={formData.semester || 1} onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">{PU_YEARS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Academic Year *</label><input type="text" value={formData.academic_year || ""} onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${errors.academic_year ? "border-red-300 bg-red-50" : "border-gray-300"}`} placeholder="2024-2025" />{errors.academic_year && <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {errors.academic_year}</p>}</div>
                </div>
              </div>
            )}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-purple-100 rounded-xl"><Tag className="h-6 w-6 text-purple-600" /></div><div><h4 className="text-lg font-semibold text-gray-900">Fee Category & Quota</h4><p className="text-sm text-gray-500">Define the category and quota</p></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Category *</label><select value={formData.category || "General"} onChange={(e) => setFormData({ ...formData, category: e.target.value as any })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">{FEE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Quota *</label><select value={formData.quota || "Merit"} onChange={(e) => setFormData({ ...formData, quota: e.target.value as any })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">{FEE_QUOTAS.map((q) => <option key={q} value={q}>{q}</option>)}</select></div>
                </div>
                <div className="mt-6 p-4 bg-gray-50 rounded-xl"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={formData.is_active || false} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="h-5 w-5 text-blue-600 rounded" /><div><span className="font-medium text-gray-900">Active Fee Structure</span><p className="text-sm text-gray-500">Enable to make available for use</p></div></label></div>
              </div>
            )}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-3"><div className="p-3 bg-green-100 rounded-xl"><IndianRupee className="h-6 w-6 text-green-600" /></div><div><h4 className="text-lg font-semibold text-gray-900">Fee Components</h4><p className="text-sm text-gray-500">Add fee heads</p></div></div><button type="button" onClick={addQuickFeeHeads} className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium"><Sparkles className="h-4 w-4" /> Quick Add</button></div>
                {errors.fee_heads && <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700"><AlertCircle className="h-5 w-5" />{errors.fee_heads}</div>}
                <div className="space-y-3">{(formData.fee_heads || []).map((h, i) => (<div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200"><select value={h.name} onChange={(e) => updateFeeHead(i, "name", e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="">Select Fee Head</option>{DEFAULT_FEE_HEADS.map((f) => <option key={f} value={f}>{f}</option>)}</select><div className="w-36 relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span><input type="number" value={h.amount || ""} onChange={(e) => updateFeeHead(i, "amount", parseFloat(e.target.value) || 0)} className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm" min="0" /></div><label className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border cursor-pointer"><input type="checkbox" checked={h.is_mandatory} onChange={(e) => updateFeeHead(i, "is_mandatory", e.target.checked)} className="h-4 w-4 text-blue-600 rounded" /><span className="text-sm">Required</span></label><button type="button" onClick={() => removeFeeHead(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-5 w-5" /></button></div>))}</div>
                <button type="button" onClick={addFeeHead} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-2"><Plus className="h-5 w-5" /> Add Fee Head</button>
                <div className="mt-6 p-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white"><div className="flex items-center justify-between"><div><p className="text-blue-100 text-sm">Total Fee Amount</p><p className="text-3xl font-bold">₹{totalAmount.toLocaleString()}</p></div><div className="p-3 bg-white/20 rounded-xl"><IndianRupee className="h-8 w-8" /></div></div></div>
              </div>
            )}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-3"><div className="p-3 bg-orange-100 rounded-xl"><Calendar className="h-6 w-6 text-orange-600" /></div><div><h4 className="text-lg font-semibold text-gray-900">Payment Schedule</h4><p className="text-sm text-gray-500">Define installments (optional)</p></div></div>{(formData.due_schedule?.length || 0) > 0 && <button type="button" onClick={distributeEvenly} className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 text-sm font-medium"><Sparkles className="h-4 w-4" /> Distribute Evenly</button>}</div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4"><div className="flex items-center justify-between"><span className="text-blue-900 font-medium">Total Fee Amount</span><span className="text-xl font-bold text-blue-600">₹{totalAmount.toLocaleString()}</span></div>{(formData.due_schedule?.length || 0) > 0 && scheduleTotal !== totalAmount && <p className="text-sm text-orange-600 mt-2 flex items-center gap-1"><AlertCircle className="h-4 w-4" />Schedule total (₹{scheduleTotal.toLocaleString()}) doesn&apos;t match</p>}</div>
                <div className="space-y-3">{(formData.due_schedule || []).map((s, i) => (<div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200"><div className="w-28 text-center"><span className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-700 rounded-full font-semibold text-sm">{s.installment}</span></div><input type="date" value={s.due_date} onChange={(e) => updateDueSchedule(i, "due_date", e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" /><div className="w-36 relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span><input type="number" value={s.amount || ""} onChange={(e) => updateDueSchedule(i, "amount", parseFloat(e.target.value) || 0)} className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm" min="0" /></div><button type="button" onClick={() => removeDueSchedule(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-5 w-5" /></button></div>))}</div>
                <button type="button" onClick={addDueSchedule} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-orange-400 hover:text-orange-600 flex items-center justify-center gap-2"><Plus className="h-5 w-5" /> Add Installment</button>
                {(formData.due_schedule?.length || 0) === 0 && <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-500"><Calendar className="h-10 w-10 mx-auto mb-2 text-gray-400" /><p>No installments. Students pay full amount at once.</p></div>}
              </div>
            )}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-emerald-100 rounded-xl"><CheckCircle className="h-6 w-6 text-emerald-600" /></div><div><h4 className="text-lg font-semibold text-gray-900">Review & Finalize</h4><p className="text-sm text-gray-500">Review and add final details</p></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl"><h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2"><GraduationCap className="h-4 w-4 text-blue-600" /> Program</h5><div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-gray-500">Program:</span><span className="font-medium">{formData.program_name || "Not selected"}</span></div><div className="flex justify-between"><span className="text-gray-500">Year:</span><span className="font-medium">{getYearLabel(formData.semester || 1)}</span></div><div className="flex justify-between"><span className="text-gray-500">Academic Year:</span><span className="font-medium">{formData.academic_year}</span></div></div></div>
                  <div className="p-4 bg-gray-50 rounded-xl"><h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2"><Tag className="h-4 w-4 text-purple-600" /> Category</h5><div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-gray-500">Category:</span><span className="font-medium">{formData.category}</span></div><div className="flex justify-between"><span className="text-gray-500">Quota:</span><span className="font-medium">{formData.quota}</span></div><div className="flex justify-between"><span className="text-gray-500">Status:</span><span className={`font-medium ${formData.is_active ? "text-green-600" : "text-gray-500"}`}>{formData.is_active ? "Active" : "Inactive"}</span></div></div></div>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl"><h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2"><IndianRupee className="h-4 w-4 text-green-600" /> Fee Breakdown</h5><div className="space-y-2">{(formData.fee_heads || []).map((h, i) => (<div key={i} className="flex justify-between text-sm"><span className="text-gray-600">{h.name} {h.is_mandatory && <span className="text-red-500">*</span>}</span><span className="font-medium">₹{(h.amount || 0).toLocaleString()}</span></div>))}<div className="border-t border-green-200 pt-2 mt-2 flex justify-between"><span className="font-semibold text-gray-900">Total</span><span className="font-bold text-green-600 text-lg">₹{totalAmount.toLocaleString()}</span></div></div></div>
                <div className="p-4 bg-gray-50 rounded-xl"><h5 className="font-medium text-gray-900 mb-4">Scholarship & Discount</h5><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><label className="flex items-center gap-3 p-3 bg-white rounded-lg border cursor-pointer"><input type="checkbox" checked={formData.scholarship_applicable || false} onChange={(e) => setFormData({ ...formData, scholarship_applicable: e.target.checked })} className="h-5 w-5 text-blue-600 rounded" /><span className="text-sm">Scholarship Applicable</span></label><div><label className="block text-sm text-gray-600 mb-1">Scholarship Amount</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span><input type="number" value={formData.scholarship_amount || ""} onChange={(e) => setFormData({ ...formData, scholarship_amount: parseFloat(e.target.value) || 0 })} className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm" disabled={!formData.scholarship_applicable} /></div></div><div><label className="block text-sm text-gray-600 mb-1">Discount %</label><input type="number" value={formData.discount_percentage || ""} onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" min="0" max="100" /></div></div></div>
                <div className="p-4 bg-gray-50 rounded-xl"><h5 className="font-medium text-gray-900 mb-4">Effective Period</h5><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm text-gray-600 mb-1">Effective From *</label><input type="date" value={formData.effective_from || ""} onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })} className={`w-full px-3 py-2 border rounded-lg ${errors.effective_from ? "border-red-300 bg-red-50" : "border-gray-300"}`} />{errors.effective_from && <p className="mt-1 text-sm text-red-500">{errors.effective_from}</p>}</div><div><label className="block text-sm text-gray-600 mb-1">Effective To</label><input type="date" value={formData.effective_to || ""} onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div></div></div>
              </div>
            )}
          </div>
          <div className="border-t bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <button type="button" onClick={currentStep === 1 ? onClose : handleBack} className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100 font-medium text-gray-700"><ChevronLeft className="h-4 w-4" />{currentStep === 1 ? "Cancel" : "Back"}</button>
              <div className="flex items-center gap-3">{currentStep < 5 ? (<button type="button" onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">Next<ChevronRight className="h-4 w-4" /></button>) : (<button type="button" onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium disabled:opacity-50">{saving ? <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : <><Check className="h-4 w-4" />{structure ? "Update" : "Create"}</>}</button>)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
