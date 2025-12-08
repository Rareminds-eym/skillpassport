// import { useState, useRef, useEffect } from "react";
// import { Pencil, Trash2, Plus, AlertCircle, DollarSign, Calendar, Percent, Save, X, GraduationCap, Search, ChevronDown } from "lucide-react";

// interface FeeStructure {
//   id: number;
//   classId: string;
//   className: string;
//   academicYear: string;
//   feeHead: string;
//   customFeeHead: string;
//   amount: number; // 🔥 changed from string → number
//   frequency: string;
//   lateFee: string;
// }

// interface FormData {
//   classId: string;
//   className: string;
//   academicYear: string;
//   feeHead: string;
//   customFeeHead: string;
//   amount: number; // 🔥 changed from string → number
//   frequency: string;
//   lateFee: string;
// }

// interface Errors {
//   classId?: string;
//   academicYear?: string;
//   feeHead?: string;
//   customFeeHead?: string;
//   amount?: string;
//   lateFee?: string;
// }

// // Mock class data - Replace with actual API call
// const CLASSES = [
//   { id: "class-1", name: "Class 1" },
//   { id: "class-2", name: "Class 2" },
//   { id: "class-3", name: "Class 3" },
//   { id: "class-4", name: "Class 4" },
//   { id: "class-5", name: "Class 5" },
//   { id: "class-6", name: "Class 6" },
//   { id: "class-7", name: "Class 7" },
//   { id: "class-8", name: "Class 8" },
//   { id: "class-9", name: "Class 9" },
//   { id: "class-10", name: "Class 10" },
//   { id: "class-11", name: "Class 11" },
//   { id: "class-12", name: "Class 12" },
// ];

// // Generate academic years (current year - 1 to current year + 2)
// const generateAcademicYears = () => {
//   const currentYear = new Date().getFullYear();
//   const years = [];
//   for (let i = -1; i <= 2; i++) {
//     const startYear = currentYear + i;
//     const endYear = startYear + 1;
//     years.push({
//       value: `${startYear}-${endYear}`,
//       label: `${startYear}-${endYear}`
//     });
//   }
//   return years;
// };

// const ACADEMIC_YEARS = generateAcademicYears();

// // Predefined fee heads
// const FEE_HEADS = [
//   "Tuition Fee",
//   "Admission Fee",
//   "Registration Fee",
//   "Term Fee",
//   "Exam Fee",
//   "Development Fee",
//   "Library Fee",
//   "Laboratory Fee",
//   "Smart Class Fee",
//   "Activity Fee",
//   "Annual Day Fee",
//   "Sports Fee",
//   "Maintenance Fee",
//   "Electricity/Utility Fee",
//   "Books & Stationery Fee",
//   "Uniform Fee",
//   "Study Material Fee",
//   "ID Card Fee",
//   "School Diary Fee",
//   "Transport Fee",
//   "Bus Fee",
//   "Vehicle Maintenance Fee",
//   "Hostel Fee",
//   "Mess Fee",
//   "Laundry Fee",
//   "Bedding Fee",
//   "Late Fee",
//   "Re-Admission Fee",
//   "Transfer Certificate Fee",
//   "Duplicate ID Card Fee",
//   "Document Verification Fee",
//   "Caution Deposit",
//   "Security Fund",
//   "Others",
// ];

// export default function FeeStructureSetup() {
//   const [form, setForm] = useState<FormData>({
//     classId: "",
//     className: "",
//     academicYear: ACADEMIC_YEARS[1].value, // Default to current academic year
//     feeHead: "",
//     customFeeHead: "",
//     amount: 0, // 🔥 updated
//     frequency: "monthly",
//     lateFee: "",
//   });

//   const [errors, setErrors] = useState<Errors>({});
//   const [feeList, setFeeList] = useState<FeeStructure[]>([]);
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [alertMessage, setAlertMessage] = useState<string>("");
//   const [alertType, setAlertType] = useState<"success" | "error" | "">("");
//   const [searchTerm, setSearchTerm] = useState<string>("");
//   const [showDropdown, setShowDropdown] = useState<boolean>(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   const frequencyOptions = [
//     { value: "monthly", label: "Monthly" },
//     { value: "term", label: "Term-wise" },
//     { value: "annual", label: "Annual/Yearly" },
//   ];

//   // Filter fee heads based on search
//   const filteredFeeHeads = FEE_HEADS.filter(head =>
//     head.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setShowDropdown(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const showAlert = (message: string, type: "success" | "error") => {
//     setAlertMessage(message);
//     setAlertType(type);
//     setTimeout(() => {
//       setAlertMessage("");
//       setAlertType("");
//     }, 3000);
//   };

//   const validate = (): Errors => {
//     const err: Errors = {};

//     if (!form.classId) {
//       err.classId = "Please select a class.";
//     }

//     if (!form.academicYear) {
//       err.academicYear = "Please select an academic year.";
//     }

//     if (!form.feeHead.trim()) {
//       err.feeHead = "Fee head is required.";
//     }

//     if (form.feeHead === "Others" && !form.customFeeHead.trim()) {
//       err.customFeeHead = "Please specify custom fee head.";
//     }

//     const amountNum = parseFloat(form.amount);
//     if (!form.amount || isNaN(amountNum) || amountNum <= 0) {
//       err.amount = "Amount must be greater than 0.";
//     }

//     const lateFeeNum = parseFloat(form.lateFee);
//     if (form.lateFee && (!isNaN(lateFeeNum) && lateFeeNum > 50)) {
//       err.lateFee = "Late fee cannot exceed 50%.";
//     }

//     if (form.lateFee && (!isNaN(lateFeeNum) && lateFeeNum < 0)) {
//       err.lateFee = "Late fee cannot be negative.";
//     }

//     return err;
//   };

//   const handleAdd = () => {
//     const err = validate();
//     setErrors(err);
    
//     if (Object.keys(err).length !== 0) {
//       showAlert("Please fix the validation errors.", "error");
//       return;
//     }

//     if (editingId !== null) {
//       // Update existing
//       setFeeList(feeList.map((f) => 
//         f.id === editingId ? { ...form, id: editingId } : f
//       ));
//       setEditingId(null);
//       showAlert("Fee structure updated successfully!", "success");
//     } else {
//       // Add new
//       setFeeList([...feeList, { ...form, id: Date.now() }]);
//       showAlert("Fee structure added successfully!", "success");
//     }

//     resetForm();
//   };

//   const handleEdit = (item: FeeStructure) => {
//     setForm({
//       classId: item.classId,
//       className: item.className,
//       academicYear: item.academicYear,
//       feeHead: item.feeHead,
//       customFeeHead: item.customFeeHead,
//       amount: item.amount,
//       frequency: item.frequency,
//       lateFee: item.lateFee,
//     });
//     setSearchTerm(item.feeHead === "Others" ? "Others" : item.feeHead);
//     setEditingId(item.id);
//     setErrors({});
//   };

//   const handleCancelEdit = () => {
//     resetForm();
//     setEditingId(null);
//   };

//   const handleDelete = (id: number) => {
//     if (window.confirm("Are you sure you want to delete this fee structure?")) {
//       setFeeList(feeList.filter((f) => f.id !== id));
//       showAlert("Fee structure deleted successfully!", "success");
//     }
//   };

//   const resetForm = () => {
//     setForm({
//       classId: "",
//       className: "",
//       academicYear: ACADEMIC_YEARS[1].value,
//       feeHead: "",
//       customFeeHead: "",
//       amount: "",
//       frequency: "monthly",
//       lateFee: "",
//     });
//     setErrors({});
//     setSearchTerm("");
//   };

//   const handleFeeHeadSelect = (feeHead: string) => {
//     setForm({ ...form, feeHead, customFeeHead: "" });
//     setSearchTerm(feeHead);
//     setShowDropdown(false);
//     if (errors.feeHead) {
//       setErrors({ ...errors, feeHead: undefined });
//     }
//   };

//   const getFinalFeeHead = (item: FeeStructure) => {
//     return item.feeHead === "Others" ? item.customFeeHead : item.feeHead;
//   };

//   const handleClassChange = (classId: string) => {
//     const selectedClass = CLASSES.find(c => c.id === classId);
//     setForm({ 
//       ...form, 
//       classId, 
//       className: selectedClass?.name || "" 
//     });
//     if (errors.classId) {
//       setErrors({ ...errors, classId: undefined });
//     }
//   };

//   const handleInputChange = (field: keyof FormData, value: string) => {
//     setForm({ ...form, [field]: value });
//     // Clear error for this field when user starts typing
//     if (errors[field as keyof Errors]) {
//       setErrors({ ...errors, [field]: undefined });
//     }
//   };

//   return (
//     <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
//       {/* Header */}
//       <div className="mb-6">
//         <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
//           <DollarSign className="text-blue-600" size={32} />
//           Fee Structure Setup
//         </h2>
//         <p className="text-gray-600 mt-2">Create and manage fee templates for your school</p>
//       </div>

//       {/* Alert Message */}
//       {alertMessage && (
//         <div
//           className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
//             alertType === "success"
//               ? "bg-green-50 border border-green-200 text-green-800"
//               : "bg-red-50 border border-red-200 text-red-800"
//           }`}
//         >
//           <AlertCircle size={20} />
//           <span className="font-medium">{alertMessage}</span>
//         </div>
//       )}

//       {/* Form */}
//       <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border border-gray-200">
//         <h3 className="text-lg font-semibold mb-4 text-gray-700">
//           {editingId ? "Edit Fee Structure" : "Add New Fee Structure"}
//         </h3>
        
//         <div className="space-y-4">
//           {/* Academic Year & Class - Side by Side */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {/* Academic Year */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
//                 <Calendar size={16} />
//                 Academic Year <span className="text-red-500">*</span>
//               </label>
//               <select
//                 value={form.academicYear}
//                 onChange={(e) => handleInputChange("academicYear", e.target.value)}
//                 className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
//                   errors.academicYear ? "border-red-500" : "border-gray-300"
//                 }`}
//               >
//                 {ACADEMIC_YEARS.map((year) => (
//                   <option key={year.value} value={year.value}>
//                     {year.label}
//                   </option>
//                 ))}
//               </select>
//               {errors.academicYear && (
//                 <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
//                   <AlertCircle size={12} />
//                   {errors.academicYear}
//                 </p>
//               )}
//             </div>

//             {/* Class Selection */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
//                 <GraduationCap size={16} />
//                 Class <span className="text-red-500">*</span>
//               </label>
//               <select
//                 value={form.classId}
//                 onChange={(e) => handleClassChange(e.target.value)}
//                 className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
//                   errors.classId ? "border-red-500" : "border-gray-300"
//                 }`}
//               >
//                 <option value="">Select Class</option>
//                 {CLASSES.map((cls) => (
//                   <option key={cls.id} value={cls.id}>
//                     {cls.name}
//                   </option>
//                 ))}
//               </select>
//               {errors.classId && (
//                 <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
//                   <AlertCircle size={12} />
//                   {errors.classId}
//                 </p>
//               )}
//             </div>
//           </div>

//           {/* Fee Head with Search */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
//               <DollarSign size={16} />
//               Fee Head <span className="text-red-500">*</span>
//             </label>
//             <div className="relative" ref={dropdownRef}>
//               <div className="relative">
//                 <Search className="absolute left-3 top-3 text-gray-400" size={18} />
//                 <input
//                   type="text"
//                   placeholder="Search or select fee head..."
//                   value={searchTerm}
//                   onChange={(e) => {
//                     setSearchTerm(e.target.value);
//                     setShowDropdown(true);
//                   }}
//                   onFocus={() => setShowDropdown(true)}
//                   className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
//                     errors.feeHead ? "border-red-500" : "border-gray-300"
//                   }`}
//                 />
//                 <ChevronDown className="absolute right-3 top-3 text-gray-400" size={18} />
//               </div>
              
//               {showDropdown && (
//                 <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
//                   {filteredFeeHeads.length > 0 ? (
//                     filteredFeeHeads.map((head) => (
//                       <div
//                         key={head}
//                         onClick={() => handleFeeHeadSelect(head)}
//                         className={`px-4 py-2.5 cursor-pointer hover:bg-blue-50 transition ${
//                           form.feeHead === head ? "bg-blue-100 font-medium" : ""
//                         } ${head === "Others" ? "border-t-2 border-gray-200 font-semibold text-blue-600" : ""}`}
//                       >
//                         {head}
//                       </div>
//                     ))
//                   ) : (
//                     <div className="px-4 py-3 text-gray-500 text-sm">No matching fee heads found</div>
//                   )}
//                 </div>
//               )}
//             </div>
//             {errors.feeHead && (
//               <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
//                 <AlertCircle size={12} />
//                 {errors.feeHead}
//               </p>
//             )}
//           </div>

//           {/* Custom Fee Head (shown when "Others" is selected) */}
//           {form.feeHead === "Others" && (
//             <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Custom Fee Head <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 placeholder="Enter custom fee head name"
//                 value={form.customFeeHead}
//                 onChange={(e) => handleInputChange("customFeeHead", e.target.value)}
//                 className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
//                   errors.customFeeHead ? "border-red-500" : "border-gray-300"
//                 }`}
//               />
//               {errors.customFeeHead && (
//                 <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
//                   <AlertCircle size={12} />
//                   {errors.customFeeHead}
//                 </p>
//               )}
//             </div>
//           )}



//           {/* Amount & Frequency - Side by Side */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {/* Amount */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Amount (₹) <span className="text-red-500">*</span>
//               </label>
//               <div className="relative">
//                 <span className="absolute left-4 top-3 text-gray-500 font-semibold">₹</span>
//                 <input
//                   type="number"
//                   placeholder="0.00"
//                   value={form.amount}
//                   onChange={(e) => handleInputChange("amount", e.target.value)}
//                   className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
//                     errors.amount ? "border-red-500" : "border-gray-300"
//                   }`}
//                   min="0"
//                   step="0.01"
//                 />
//               </div>
//               {errors.amount && (
//                 <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
//                   <AlertCircle size={12} />
//                   {errors.amount}
//                 </p>
//               )}
//             </div>

//             {/* Frequency */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
//                 <Calendar size={16} />
//                 Frequency <span className="text-red-500">*</span>
//               </label>
//               <select
//                 value={form.frequency}
//                 onChange={(e) => handleInputChange("frequency", e.target.value)}
//                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
//               >
//                 {frequencyOptions.map((option) => (
//                   <option key={option.value} value={option.value}>
//                     {option.label}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           {/* Late Fee */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
//               <Percent size={16} />
//               Late Fee Percentage (Optional)
//             </label>
//             <input
//               type="number"
//               placeholder="0"
//               value={form.lateFee}
//               onChange={(e) => handleInputChange("lateFee", e.target.value)}
//               className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
//                 errors.lateFee ? "border-red-500" : "border-gray-300"
//               }`}
//               min="0"
//               max="50"
//               step="0.1"
//             />
//             {errors.lateFee && (
//               <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
//                 <AlertCircle size={12} />
//                 {errors.lateFee}
//               </p>
//             )}
//             <p className="text-xs text-gray-500 mt-1">Maximum allowed: 50%</p>
//           </div>
//         </div>

//         <div className="flex gap-3 mt-6 pt-4 border-t">
//           <button
//             onClick={handleAdd}
//             className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
//           >
//             {editingId ? (
//               <>
//                 <Save size={20} />
//                 Update Fee Structure
//               </>
//             ) : (
//               <>
//                 <Plus size={20} />
//                 Add Fee Structure
//               </>
//             )}
//           </button>
          
//           {editingId && (
//             <button
//               onClick={handleCancelEdit}
//               className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 transition flex items-center gap-2 font-medium"
//             >
//               <X size={20} />
//               Cancel
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Table */}
//       <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
//         <h3 className="text-xl font-semibold mb-4 text-gray-800">Created Fee Structures</h3>

//         {feeList.length === 0 ? (
//           <div className="text-center py-12">
//             <DollarSign size={48} className="mx-auto text-gray-300 mb-3" />
//             <p className="text-gray-500 text-lg">No fee structures added yet.</p>
//             <p className="text-gray-400 text-sm mt-1">Add your first fee structure using the form above.</p>
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full border-collapse">
//               <thead>
//                 <tr className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
//                   <th className="p-4 text-left font-semibold text-gray-700">Academic Year</th>
//                   <th className="p-4 text-left font-semibold text-gray-700">Class</th>
//                   <th className="p-4 text-left font-semibold text-gray-700">Fee Head</th>
//                   <th className="p-4 text-left font-semibold text-gray-700">Amount</th>
//                   <th className="p-4 text-left font-semibold text-gray-700">Frequency</th>
//                   <th className="p-4 text-left font-semibold text-gray-700">Late Fee %</th>
//                   <th className="p-4 text-center font-semibold text-gray-700">Actions</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {feeList.map((item, index) => (
//                   <tr
//                     key={item.id}
//                     className={`border-b hover:bg-gray-50 transition ${
//                       index % 2 === 0 ? "bg-white" : "bg-gray-50"
//                     }`}
//                   >
//                     <td className="p-4">
//                       <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
//                         <Calendar size={14} />
//                         {item.academicYear}
//                       </span>
//                     </td>
//                     <td className="p-4">
//                       <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
//                         <GraduationCap size={14} />
//                         {item.className}
//                       </span>
//                     </td>
//                     <td className="p-4 font-medium text-gray-800">{getFinalFeeHead(item)}</td>
//                     <td className="p-4 text-gray-700">
//                       <span className="font-semibold text-green-600">₹{parseFloat(item.amount).toLocaleString('en-IN')}</span>
//                     </td>
//                     <td className="p-4">
//                       <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
//                         <Calendar size={14} />
//                         {frequencyOptions.find(f => f.value === item.frequency)?.label || item.frequency}
//                       </span>
//                     </td>
//                     <td className="p-4 text-gray-700">
//                       {item.lateFee ? (
//                         <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
//                           <Percent size={14} />
//                           {item.lateFee}%
//                         </span>
//                       ) : (
//                         <span className="text-gray-400">N/A</span>
//                       )}
//                     </td>
//                     <td className="p-4">
//                       <div className="flex justify-center gap-2">
//                         <button
//                           onClick={() => handleEdit(item)}
//                           className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
//                           title="Edit"
//                         >
//                           <Pencil size={18} />
//                         </button>
//                         <button
//                           onClick={() => handleDelete(item.id)}
//                           className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
//                           title="Delete"
//                         >
//                           <Trash2 size={18} />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {feeList.length > 0 && (
//           <div className="mt-4 text-sm text-gray-600 flex items-center justify-between">
//             <span>Total Fee Structures: <span className="font-semibold">{feeList.length}</span></span>
//             <span>
//               Total Amount: <span className="font-semibold text-green-600">
//                 ₹{feeList.reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0).toLocaleString('en-IN')}
//               </span>
//             </span>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
import { useState, useRef, useEffect } from "react";
import { Pencil, Trash2, Plus, AlertCircle, Calendar, Percent, Save, X, GraduationCap, Search, ChevronDown } from "lucide-react";

interface FeeStructure {
  id: number;
  classId: string;
  className: string;
  academicYear: string;
  feeHead: string;
  customFeeHead: string;
  amount: number; // 🔥 changed from string → number
  frequency: string;
  lateFee: string;
}

interface FormData {
  classId: string;
  className: string;
  academicYear: string;
  feeHead: string;
  customFeeHead: string;
  amount: number; // 🔥 changed from string → number
  frequency: string;
  lateFee: string;
}

interface Errors {
  classId?: string;
  academicYear?: string;
  feeHead?: string;
  customFeeHead?: string;
  amount?: string;
  lateFee?: string;
}

const CLASSES = [
  { id: "class-1", name: "Class 1" },
  { id: "class-2", name: "Class 2" },
  { id: "class-3", name: "Class 3" },
  { id: "class-4", name: "Class 4" },
  { id: "class-5", name: "Class 5" },
  { id: "class-6", name: "Class 6" },
  { id: "class-7", name: "Class 7" },
  { id: "class-8", name: "Class 8" },
  { id: "class-9", name: "Class 9" },
  { id: "class-10", name: "Class 10" },
  { id: "class-11", name: "Class 11" },
  { id: "class-12", name: "Class 12" },
];

// Generate academic years
const generateAcademicYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = -1; i <= 2; i++) {
    const startYear = currentYear + i;
    const endYear = startYear + 1;
    years.push({
      value: `${startYear}-${endYear}`,
      label: `${startYear}-${endYear}`,
    });
  }
  return years;
};

const ACADEMIC_YEARS = generateAcademicYears();

const FEE_HEADS = [
  "Tuition Fee", "Admission Fee", "Registration Fee", "Term Fee", "Exam Fee",
  "Development Fee", "Library Fee", "Laboratory Fee", "Smart Class Fee",
  "Activity Fee", "Annual Day Fee", "Sports Fee", "Maintenance Fee",
  "Electricity/Utility Fee", "Books & Stationery Fee", "Uniform Fee",
  "Study Material Fee", "ID Card Fee", "School Diary Fee", "Transport Fee",
  "Bus Fee", "Vehicle Maintenance Fee", "Hostel Fee", "Mess Fee",
  "Laundry Fee", "Bedding Fee", "Late Fee", "Re-Admission Fee",
  "Transfer Certificate Fee", "Duplicate ID Card Fee", "Document Verification Fee",
  "Caution Deposit", "Security Fund", "Others",
];

export default function FeeStructureSetup() {
  const [form, setForm] = useState<FormData>({
    classId: "",
    className: "",
    academicYear: ACADEMIC_YEARS[1].value,
    feeHead: "",
    customFeeHead: "",
    amount: 0, // 🔥 updated
    frequency: "monthly",
    lateFee: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [feeList, setFeeList] = useState<FeeStructure[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [alertMessage, setAlertMessage] = useState<string>("");
  const [alertType, setAlertType] = useState<"success" | "error" | "">("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const frequencyOptions = [
    { value: "monthly", label: "Monthly" },
    { value: "term", label: "Term-wise" },
    { value: "annual", label: "Annual/Yearly" },
  ];

  const filteredFeeHeads = FEE_HEADS.filter((head) =>
    head.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showAlert = (message: string, type: "success" | "error") => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, 3000);
  };

  const validate = (): Errors => {
    const err: Errors = {};

    if (!form.classId) err.classId = "Please select a class.";

    if (!form.academicYear) err.academicYear = "Please select academic year.";

    if (!form.feeHead.trim()) err.feeHead = "Fee head is required.";

    if (form.feeHead === "Others" && !form.customFeeHead.trim()) {
      err.customFeeHead = "Specify custom fee head.";
    }

    if (!form.amount || form.amount <= 0) {
      err.amount = "Amount must be greater than 0.";
    }

    const lateFeeNum = parseFloat(form.lateFee);
    if (form.lateFee && lateFeeNum > 50) err.lateFee = "Late fee cannot exceed 50%.";

    return err;
  };

  const handleAdd = () => {
    const err = validate();
    setErrors(err);

    if (Object.keys(err).length !== 0) {
      showAlert("Please fix the validation errors.", "error");
      return;
    }

    // 🔥 DUPLICATE CHECK IMPLEMENTED
    const finalFeeHead = form.feeHead === "Others" ? form.customFeeHead : form.feeHead;

    const isDuplicate = feeList.some((item) =>
      item.classId === form.classId &&
      item.academicYear === form.academicYear &&
      (item.feeHead === form.feeHead ||
        (item.feeHead === "Others" && item.customFeeHead === form.customFeeHead)) &&
      item.id !== editingId
    );

    if (isDuplicate) {
      showAlert("This fee head already exists for the selected class & academic year.", "error");
      return;
    }

    if (editingId !== null) {
      // Update
      setFeeList(
        feeList.map((f) => (f.id === editingId ? { ...form, id: editingId } : f))
      );
      setEditingId(null);
      showAlert("Fee structure updated!", "success");
    } else {
      // Add
      setFeeList([...feeList, { ...form, id: Date.now() }]);
      showAlert("Fee structure added!", "success");
    }

    resetForm();
  };

  const handleEdit = (item: FeeStructure) => {
    setForm({
      classId: item.classId,
      className: item.className,
      academicYear: item.academicYear,
      feeHead: item.feeHead,
      customFeeHead: item.customFeeHead,
      amount: item.amount,
      frequency: item.frequency,
      lateFee: item.lateFee,
    });
    setEditingId(item.id);
  };

  const handleCancelEdit = () => {
    resetForm();
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure to delete?")) {
      setFeeList(feeList.filter((f) => f.id !== id));
      showAlert("Deleted successfully!", "success");
    }
  };

  const resetForm = () => {
    setForm({
      classId: "",
      className: "",
      academicYear: ACADEMIC_YEARS[1].value,
      feeHead: "",
      customFeeHead: "",
      amount: 0,
      frequency: "monthly",
      lateFee: "",
    });
    setErrors({});
    setSearchTerm("");
  };

  const handleClassChange = (classId: string) => {
    const selectedClass = CLASSES.find((c) => c.id === classId);
    setForm({ ...form, classId, className: selectedClass?.name || "" });
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setForm({ ...form, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* Header */}
      <h2 className="text-3xl font-bold mb-6">Fee Structure Setup</h2>

      {/* Alert */}
      {alertMessage && (
        <div
          className={`p-4 mb-4 rounded-lg ${
            alertType === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {alertMessage}
        </div>
      )}

      {/* Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">

        <h3 className="text-xl font-semibold mb-4">
          {editingId ? "Edit Fee Structure" : "Add New Fee Structure"}
        </h3>

        {/* Academic Year + Class */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Academic Year */}
          <div>
            <label className="font-medium">Academic Year *</label>
            <select
              value={form.academicYear}
              onChange={(e) => handleInputChange("academicYear", e.target.value)}
              className="w-full border p-2 rounded"
            >
              {ACADEMIC_YEARS.map((year) => (
                <option key={year.value}>{year.label}</option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="font-medium">Class *</label>
            <select
              value={form.classId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">Select Class</option>
              {CLASSES.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fee Head Search Dropdown */}
        <div className="mt-4" ref={dropdownRef}>
          <label className="font-medium">Fee Head *</label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              className="w-full border p-2 rounded"
              placeholder="Search fee head..."
            />

            {showDropdown && (
              <div className="absolute bg-white border w-full rounded shadow mt-1 max-h-52 overflow-y-auto">
                {filteredFeeHeads.map((head) => (
                  <div
                    key={head}
                    onClick={() => {
                      handleInputChange("feeHead", head);
                      setSearchTerm(head);
                      setShowDropdown(false);
                    }}
                    className="p-2 hover:bg-blue-100 cursor-pointer"
                  >
                    {head}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Custom Fee Head */}
        {form.feeHead === "Others" && (
          <div className="mt-4">
            <label className="font-medium">Custom Fee Head *</label>
            <input
              type="text"
              value={form.customFeeHead}
              onChange={(e) => handleInputChange("customFeeHead", e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="Enter custom name"
            />
          </div>
        )}

        {/* Amount + Frequency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

          {/* Amount */}
          <div>
            <label className="font-medium">Amount (₹) *</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => handleInputChange("amount", Number(e.target.value))}
              className="w-full border p-2 rounded"
              min="0"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="font-medium">Frequency *</label>
            <select
              value={form.frequency}
              onChange={(e) => handleInputChange("frequency", e.target.value)}
              className="w-full border p-2 rounded"
            >
              {frequencyOptions.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Late Fee */}
        <div className="mt-4">
          <label className="font-medium">Late Fee (%)</label>
          <input
            type="number"
            value={form.lateFee}
            onChange={(e) => handleInputChange("lateFee", e.target.value)}
            className="w-full border p-2 rounded"
            max="50"
            min="0"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            {editingId ? "Update Fee Structure" : "Add Fee Structure"}
          </button>

          {editingId && (
            <button
              onClick={handleCancelEdit}
              className="bg-gray-300 px-6 py-2 rounded-lg"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Created Fee Structures</h3>

        {feeList.length === 0 ? (
          <p className="text-gray-500">No fee structures added yet.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-50">
                <th className="p-3">Academic Year</th>
                <th className="p-3">Class</th>
                <th className="p-3">Fee Head</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Frequency</th>
                <th className="p-3">Late Fee %</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {feeList.map((item, index) => (
                <tr
                  key={item.id}
                  className={`border-b ${
                    editingId === item.id ? "bg-yellow-100" : index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="p-3">{item.academicYear}</td>
                  <td className="p-3">{item.className}</td>
                  <td className="p-3">
                    {item.feeHead === "Others" ? item.customFeeHead : item.feeHead}
                  </td>
                  <td className="p-3">₹{item.amount.toLocaleString("en-IN")}</td>
                  <td className="p-3">{item.frequency}</td>
                  <td className="p-3">{item.lateFee || "N/A"}</td>

                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600"
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
