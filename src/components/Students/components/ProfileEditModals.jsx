// import React, { useState, useEffect } from "react";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
// import { Button } from "./ui/button";
// import { Input } from "./ui/input";
// import { Progress } from "./ui/progress";
// import { Label } from "./ui/label";
// import { Textarea } from "./ui/textarea";
// import { Badge } from "./ui/badge";
// import {
//   Plus,
//   Trash2,
//   Edit3,
//   Clock,
//   CheckCircle,
//   User,
//   PenSquare,
//   BookOpen,
//   Timer,
//   Award,
//   Calendar,
//   Eye,
//   EyeOff,
//   Presentation,
//   FileText,
//   Video,
//   Upload,
//   Link,
//   X,
//   CalendarDays,
//   LinkIcon,
//   Github,
//   Building2,
// } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import { motion, AnimatePresence } from "framer-motion";

// // const VersionStatusBadge = ({ version, type }) => {
// //   if (!version) return null;

// //   const getStatusConfig = (status) => {
// //     switch (status) {
// //       case "verified":
// //         return {
// //           className: "bg-green-100 text-green-700",
// //           icon: CheckCircle,
// //           label: "Verified",
// //         };
// //       case "pending":
// //         return {
// //           className: "bg-orange-100 text-orange-700",
// //           icon: Clock,
// //           label: "Pending Review",
// //         };
// //       case "rejected":
// //         return {
// //           className: "bg-red-100 text-red-700",
// //           icon: XCircle,
// //           label: "Rejected",
// //         };
// //       case "changes_requested":
// //         return {
// //           className: "bg-yellow-100 text-yellow-700",
// //           icon: AlertCircle,
// //           label: "Changes Requested",
// //         };
// //       default:
// //         return {
// //           className: "bg-gray-100 text-gray-700",
// //           icon: Clock,
// //           label: "Unknown",
// //         };
// //     }
// //   };

// //   const config = getStatusConfig(version.status);
// //   const Icon = config.icon;

// //   return (
// //     <div className="flex items-center gap-2">
// //       <Badge className={`${config.className} flex items-center gap-1`}>
// //         <Icon className="w-3 h-3" />
// //         {config.label}
// //       </Badge>
// //       {version.message && (
// //         <span className="text-xs text-gray-500 italic">{version.message}</span>
// //       )}
// //     </div>
// //   );
// // };

// // // Version history display component
// // const VersionHistory = ({ item }) => {
// //   if (!item._versions) return null;

// //   const { verified, pending, rejected } = item._versions;

// //   return (
// //     <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
// //       <div className="text-xs font-semibold text-gray-600">
// //         Version History:
// //       </div>

// //       {verified && (
// //         <div className="flex items-start gap-2">
// //           <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
// //           <div className="flex-1">
// //             <div className="text-xs font-medium text-green-700">
// //               Verified Version
// //             </div>
// //             <div className="text-xs text-gray-600">
// //               Verified on {new Date(verified.verified_at).toLocaleDateString()}
// //               {verified.verified_by && ` by admin`}
// //             </div>
// //             {verified.message && (
// //               <div className="text-xs text-gray-500 italic mt-1">
// //                 "{verified.message}"
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       )}

// //       {pending && (
// //         <div className="flex items-start gap-2">
// //           <Clock className="w-4 h-4 text-orange-600 mt-0.5" />
// //           <div className="flex-1">
// //             <div className="text-xs font-medium text-orange-700">
// //               Pending Version
// //             </div>
// //             <div className="text-xs text-gray-600">
// //               Submitted on{" "}
// //               {new Date(
// //                 pending.submitted_at || pending.created_at
// //               ).toLocaleDateString()}
// //             </div>
// //             <div className="text-xs text-gray-500 mt-1">
// //               Awaiting admin review
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {rejected && (
// //         <div className="flex items-start gap-2">
// //           <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
// //           <div className="flex-1">
// //             <div className="text-xs font-medium text-red-700">
// //               Rejected Version
// //             </div>
// //             <div className="text-xs text-gray-600">
// //               Rejected on {new Date(rejected.rejected_at).toLocaleDateString()}
// //             </div>
// //             {rejected.message && (
// //               <div className="text-xs text-red-600 italic mt-1">
// //                 Reason: "{rejected.message}"
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// export const EducationEditModal = ({ isOpen, onClose, data, onSave }) => {
//   const [educationList, setEducationList] = useState(data || []);

//   // Update internal state when data prop changes (Supabase data updates)
//   useEffect(() => {
//     setEducationList(data || []);
//   }, [data]);
//   const [editingItem, setEditingItem] = useState(null);
//   const [isAdding, setIsAdding] = useState(false);
//   const [formData, setFormData] = useState({
//     degree: "",
//     department: "",
//     university: "",
//     yearOfPassing: "",
//     cgpa: "",
//     level: "Bachelor's",
//     status: "ongoing",
//   });
//   const { toast } = useToast();

//   const levelOptions = [
//     "High School",
//     "Associate",
//     "Bachelor's",
//     "Master's",
//     "PhD",
//     "Certificate",
//     "Diploma",
//   ];

//   const statusOptions = ["ongoing", "completed"];

//   const resetForm = () => {
//     setFormData({
//       degree: "",
//       department: "",
//       university: "",
//       yearOfPassing: "",
//       cgpa: "",
//       level: "Bachelor's",
//       status: "ongoing",
//     });
//   };

//   const startEditing = (education) => {
//     setFormData(education);
//     setEditingItem(education.id);
//     setIsAdding(true);
//   };

//   const startAdding = () => {
//     resetForm();
//     setEditingItem(null);
//     setIsAdding(true);
//   };

//   const cancelEdit = () => {
//     setIsAdding(false);
//     setEditingItem(null);
//     resetForm();
//   };

//   const saveEducation = () => {
//     if (!formData.degree.trim() || !formData.university.trim()) {
//       toast({
//         title: "Error",
//         description: "Please fill in at least degree and university fields.",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (editingItem) {
//       // Update existing education
//       setEducationList(
//         educationList.map((edu) =>
//           edu.id === editingItem ? { ...formData, id: editingItem } : edu
//         )
//       );
//     } else {
//       // Add new education
//       const newEducation = {
//         ...formData,
//         id: Date.now(),
//         processing: true,
//       };
//       setEducationList([...educationList, newEducation]);
//     }

//     setIsAdding(false);
//     setEditingItem(null);
//     resetForm();

//     toast({
//       title: "Education Updated",
//       description:
//         "Your education details are being processed for verification.",
//     });
//   };

//   const deleteEducation = (id) => {
//     setEducationList(educationList.filter((edu) => edu.id !== id));
//     if (editingItem === id) {
//       cancelEdit();
//     }
//   };

//   const handleSubmit = async () => {
//     try {
//       await onSave(educationList);
//       onClose();
//     } catch (error) {
//       console.error('Error saving education:', error);
//       toast({
//         title: "Error",
//         description: "Failed to save education details. Please try again.",
//         variant: "destructive",
//       });
//     }
//   };

//   const getLevelColor = (level) => {
//     switch (level) {
//       case "Bachelor's":
//         return "bg-emerald-100 text-emerald-700";
//       case "Master's":
//         return "bg-blue-100 text-blue-700";
//       case "PhD":
//         return "bg-purple-100 text-purple-700";
//       case "Certificate":
//         return "bg-amber-100 text-amber-700";
//       case "High School":
//         return "bg-gray-100 text-gray-700";
//       default:
//         return "bg-gray-100 text-gray-700";
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             <Edit3 className="w-5 h-5" />
//             Manage Education Details
//           </DialogTitle>
//         </DialogHeader>

//         <div className="space-y-4">
//           {/* Existing Education List */}
//           {educationList.map((education) => (
//             <div
//               key={education.id}
//               className={`p-4 border-l-4 rounded-lg ${
//                 education.status === "ongoing"
//                   ? "border-l-blue-500 bg-blue-50"
//                   : education.level === "Bachelor's"
//                   ? "border-l-emerald-500 bg-emerald-50"
//                   : education.level === "Certificate"
//                   ? "border-l-amber-500 bg-amber-50"
//                   : "border-l-gray-500 bg-gray-50"
//               } hover:shadow-md transition-shadow ${
//                 education.enabled === false ? "opacity-50" : "opacity-100"
//               }`}
//             >
//               <div className="flex items-start justify-between">
//                 <div className="flex-1">
//                   <div className="flex items-center gap-2 mb-2">
//                     <h4 className="font-semibold">
//                       {education.degree}
//                     </h4>
//                     <Badge className={getLevelColor(education.level)}>
//                       {education.level}
//                     </Badge>
//                     <Badge
//                       className={
//                         education.status === "ongoing"
//                           ? "bg-blue-500 hover:bg-blue-500 text-white"
//                           : "bg-emerald-500 hover:bg-emerald-500 text-white"
//                       }
//                     >
//                       {education.status}
//                     </Badge>
//                     {education.processing && (
//                       <Badge className="bg-orange-100 text-orange-800">
//                         <Clock className="w-3 h-3 mr-1" />
//                         Processing
//                       </Badge>
//                     )}
//                   </div>
//                   <p
//                     className="text-sm font-medium"
//                   >
//                     {education.university}
//                   </p>
//                   <div className="grid grid-cols-3 gap-2 text-xs mt-2">
//                     <div>
//                       <span>Department:</span>
//                       <p className="font-medium">
//                         {education.department}
//                       </p>
//                     </div>
//                     <div>
//                       <span>Year:</span>
//                       <p className="font-medium">
//                         {education.yearOfPassing}
//                       </p>
//                     </div>
//                     <div>
//                       <span>Grade:</span>
//                       <p className="font-medium">
//                         {education.cgpa}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="flex gap-1 items-center">
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => startEditing(education)}
//                     className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
//                   >
//                     <Edit3 className="w-4 h-4" />
//                   </Button>
//                   <Button
//                     variant={
//                       education.enabled === false ? "outline" : "default"
//                     }
//                     size="sm"
//                     onClick={() =>
//                       setEducationList(
//                         educationList.map((edu) =>
//                           edu.id === education.id
//                             ? {
//                                 ...edu,
//                                 enabled: edu.enabled === false ? true : false,
//                               }
//                             : edu
//                         )
//                       )
//                     }
//                     className={
//                       education.enabled === false
//                         ? "text-gray-500 border-gray-400"
//                         : "bg-emerald-500 text-white"
//                     }
//                   >
//                     {education.enabled === undefined || education.enabled
//                       ? "Disable"
//                       : "Enable"}
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           ))}

//           {/* Add/Edit Form */}
//           {isAdding ? (
//             <div className="p-4 border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg space-y-4">
//               <h4 className="font-semibold text-blue-700">
//                 {editingItem ? "Edit Education" : "Add New Education"}
//               </h4>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="degree">Degree/Qualification *</Label>
//                   <Input
//                     id="degree"
//                     value={formData.degree}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         degree: e.target.value,
//                       }))
//                     }
//                     placeholder="e.g., B.Tech Computer Science"
//                     className="bg-white"
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="university">Institution *</Label>
//                   <Input
//                     id="university"
//                     value={formData.university}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         university: e.target.value,
//                       }))
//                     }
//                     placeholder="e.g., Stanford University"
//                     className="bg-white"
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="department">Department/Field</Label>
//                   <Input
//                     id="department"
//                     value={formData.department}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         department: e.target.value,
//                       }))
//                     }
//                     placeholder="e.g., Computer Science"
//                     className="bg-white"
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="level">Level</Label>
//                   <select
//                     id="level"
//                     value={formData.level}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         level: e.target.value,
//                       }))
//                     }
//                     className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
//                   >
//                     {levelOptions.map((level) => (
//                       <option key={level} value={level}>
//                         {level}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div>
//                   <Label htmlFor="year">Year of Passing</Label>
//                   <Input
//                     id="year"
//                     value={formData.yearOfPassing}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         yearOfPassing: e.target.value,
//                       }))
//                     }
//                     placeholder="2025"
//                     className="bg-white"
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="cgpa">Grade/CGPA</Label>
//                   <Input
//                     id="cgpa"
//                     value={formData.cgpa}
//                     onChange={(e) =>
//                       setFormData((prev) => ({ ...prev, cgpa: e.target.value }))
//                     }
//                     placeholder="8.9/10.0 or A+"
//                     className="bg-white"
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="status">Status</Label>
//                   <select
//                     id="status"
//                     value={formData.status}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         status: e.target.value,
//                       }))
//                     }
//                     className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
//                   >
//                     {statusOptions.map((status) => (
//                       <option key={status} value={status}>
//                         {status.charAt(0).toUpperCase() + status.slice(1)}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               <div className="flex gap-2">
//                 <Button
//                   onClick={saveEducation}
//                   className="bg-blue-400 hover:bg-blue-500 text-white"
//                 >
//                   {editingItem ? "Update" : "Add"} Education
//                 </Button>
//                 <Button onClick={cancelEdit} variant="outline">
//                   Cancel
//                 </Button>
//               </div>
//             </div>
//           ) : (
//             <Button
//               onClick={startAdding}
//               variant="outline"
//               className="w-full border-dashed bg-blue-400 hover:bg-blue-50"
//             >
//               <Plus className="w-4 h-4 mr-2" />
//               Add New Education
//             </Button>
//           )}

//           <div className="flex justify-end gap-2 pt-4 border-t">
//             <Button variant="outline" onClick={onClose}>
//               Cancel
//             </Button>
//             <Button
//               onClick={handleSubmit}
//               className="bg-blue-400 hover:bg-blue-500 text-white"
//             >
//               Save All Changes
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export const TrainingEditModal = ({ isOpen, onClose, data, onSave }) => {
//   const emptyCourse = {
//     course: "",
//     provider: "",
//     startDate: "",
//     endDate: "",
//     status: "ongoing",
//     completedModules: "",
//     totalModules: "",
//     hoursSpent: "",
//     skills: "",
//     certificateUrl: "",
//     description: ""
//   };

//   const statusOptions = ["ongoing", "completed"];

//   const [courses, setCourses] = useState([]);
//   const [formCourse, setFormCourse] = useState(emptyCourse);
//   const [isFormOpen, setIsFormOpen] = useState(false);
//   const [editingIndex, setEditingIndex] = useState(null);
//   const { toast } = useToast();

//   // Helper function to clamp progress between 0-100
//   const clampProgress = (value) => {
//     const num = Number(value);
//     if (Number.isNaN(num)) return 0;
//     return Math.max(0, Math.min(100, Math.round(num)));
//   };

//   // Helper function to parse positive numbers
//   const parsePositiveNumber = (value) => {
//     const num = Number(value);
//     if (Number.isNaN(num) || num < 0) return 0;
//     return Math.round(num);
//   };

//   const normalizeStatusValue = (value) => {
//     const normalized = (value || "ongoing").toLowerCase();
//     if (normalized === "completed") return "completed";
//     return "ongoing";
//   };

//   // Calculate progress based on completed/total modules
//   const calculateProgress = (completedModules, totalModules) => {
//     if (!totalModules || totalModules === 0) return 0;
//     const completed = Math.min(completedModules, totalModules);
//     return clampProgress((completed / totalModules) * 100);
//   };

//   const toDate = (value) => {
//     if (!value) return null;
//     const date = new Date(value);
//     if (Number.isNaN(date.getTime())) return null;
//     return date;
//   };

//   const formatDateLabel = (value) => {
//     const date = toDate(value);
//     if (!date) return "";
//     return date.toLocaleDateString();
//   };

//   const describeDuration = (startDate, endDate, status) => {
//     const start = toDate(startDate);
//     if (!start) return "";
//     const statusValue = (status || "ongoing").toLowerCase();
//     const end = toDate(endDate);
//     const effectiveEnd =
//       end || (statusValue === "completed" ? start : new Date());
//     let diff = effectiveEnd.getTime() - start.getTime();
//     if (diff < 0) diff = 0;

//     const dayMs = 86_400_000;
//     let days = Math.floor(diff / dayMs);
//     if (days < 1) days = 1;
//     const months = Math.floor(days / 30);
//     const weeks = Math.floor((days % 30) / 7);
//     const remainingDays = days % 7;

//     const parts = [];
//     if (months) {
//       parts.push(`${months} month${months !== 1 ? "s" : ""}`);
//     } else if (weeks) {
//       parts.push(`${weeks} week${weeks !== 1 ? "s" : ""}`);
//     } else if (remainingDays) {
//       parts.push(`${remainingDays} day${remainingDays !== 1 ? "s" : ""}`);
//     } else {
//       parts.push("Less than a day");
//     }

//     if (!end && statusValue !== "completed") {
//       return `${parts.join(" ")} so far`;
//     }
//     return parts.join(" ");
//   };

//   const buildTimelineLabel = (startDate, endDate, status) => {
//     const startLabel = formatDateLabel(startDate);
//     if (!startLabel) return "";
//     const statusValue = (status || "ongoing").toLowerCase();
//     const endLabel =
//       formatDateLabel(endDate) ||
//       (statusValue === "completed" ? startLabel : "Present");
//     const durationText = describeDuration(startDate, endDate, statusValue);
//     return durationText
//       ? `${startLabel} - ${endLabel} (${durationText})`
//       : `${startLabel} - ${endLabel}`;
//   };

//   // Parse skills from string or array
//   const parseSkills = (value) => {
//     if (Array.isArray(value)) return value;
//     if (typeof value === "string" && value.trim()) {
//       return value
//         .split(",")
//         .map((skill) => skill.trim())
//         .filter(Boolean);
//     }
//     return [];
//   };

//   // Normalize course data structure
//   const normalizeCourse = (course = {}) => {
//     // Parse skills
//     const skillsArray = parseSkills(course.skills);

//     const completedModules = parsePositiveNumber(course.completedModules);
//     const totalModules = parsePositiveNumber(course.totalModules);
//     const hoursSpent = parsePositiveNumber(course.hoursSpent);

//     let progressValue = 0;
//     const statusLower = normalizeStatusValue(course.status);
//     const approvalStatus = (course.approval_status || "").toLowerCase();

//     // If approval status is approved, set progress to 100%
//     if (approvalStatus === "approved") {
//       progressValue = 100;
//     } else if (statusLower === "completed") {
//       progressValue = 100;
//     } else if (totalModules > 0) {
//       progressValue = calculateProgress(completedModules, totalModules);
//     }

//     const startDateRaw = (course.startDate || course.start_date || "")
//       .toString()
//       .trim();
//     const rawEndDate = (course.endDate || course.end_date || "")
//       .toString()
//       .trim();
//     const endDateRaw = statusLower === "completed" ? rawEndDate : "";
//     const durationLabel = describeDuration(
//       startDateRaw,
//       endDateRaw,
//       statusLower
//     );
//     const timelineLabel = buildTimelineLabel(
//       startDateRaw,
//       endDateRaw,
//       statusLower
//     );

//     const updatedTimestamp =
//       course.updated_at ||
//       course.updatedAt ||
//       course.created_at ||
//       course.createdAt ||
//       new Date().toISOString();

//     return {
//       id: course.id || Date.now(),
//       course: (course.course || "").trim(),
//       provider: (course.provider || "").trim(),
//       startDate: startDateRaw,
//       endDate: endDateRaw,
//       duration: timelineLabel,
//       durationLabel,
//       status: statusLower,
//       progress: progressValue,
//       completedModules,
//       totalModules,
//       hoursSpent,
//       skills: skillsArray,
//       certificateUrl: (course.certificateUrl || "").trim(),
//       description: (course.description || "").trim(), 
//       enabled: course.enabled !== false,
//       verified: course.verified || false,
//       processing: course.processing || false,
//       approval_status: course.approval_status || "pending",
//       updated_at: updatedTimestamp,
//     };
//   };

//   // Initialize courses when data changes
//   useEffect(() => {
//     if (data) {
//       const normalizedCourses = (Array.isArray(data) ? data : []).map(
//         (course) => normalizeCourse(course)
//       );
//       setCourses(normalizedCourses);
//     } else {
//       setCourses([]);
//     }
//     setFormCourse(emptyCourse);
//     setIsFormOpen(false);
//     setEditingIndex(null);
//   }, [data, isOpen]);

//   // Open form for new course
//   const openNewCourseForm = () => {
//     setFormCourse({ ...emptyCourse });
//     setEditingIndex(null);
//     setIsFormOpen(true);
//   };

//   // Close form
//   const closeForm = () => {
//     setFormCourse({ ...emptyCourse });
//     setEditingIndex(null);
//     setIsFormOpen(false);
//   };

//   // Edit existing course
//   const handleEditCourse = (index) => {
//     const course = courses[index];
//     if (!course) return;

//     const statusValue = normalizeStatusValue(course.status);

//     setFormCourse({
//       course: course.course || "",
//       provider: course.provider || "",
//       startDate: course.startDate || "",
//       endDate: statusValue === "completed" ? course.endDate || "" : "",
//       status: statusValue,
//       completedModules: course.completedModules?.toString() || "",
//       totalModules: course.totalModules?.toString() || "",
//       hoursSpent: course.hoursSpent?.toString() || "",
//       skills: Array.isArray(course.skills) ? course.skills.join(", ") : "",
//       certificateUrl: course.certificateUrl || "",
//       description: course.description || "", 
//     });
//     setEditingIndex(index);
//     setIsFormOpen(true);
//   };

//   // Handle input changes
//   const handleInputChange = (field) => (event) => {
//     const { value } = event.target;
//     setFormCourse((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleStatusChange = (event) => {
//     const { value } = event.target;
//     const normalized = normalizeStatusValue(value);
//     setFormCourse((prev) => ({
//       ...prev,
//       status: normalized,
//       endDate: normalized === "ongoing" ? "" : prev.endDate,
//     }));
//   };

//   // Submit form (add or update course)
//   const handleFormSubmit = () => {
//     // Validation
//     if (!formCourse.course.trim()) {
//       toast({
//         title: "Course name required",
//         description: "Please enter a course name before saving.",
//         variant: "destructive",
//       });
//       return;
//     }

//     // Parse numeric values
//     const completedModules = parsePositiveNumber(formCourse.completedModules);
//     const totalModules = parsePositiveNumber(formCourse.totalModules);
//     const hoursSpent = parsePositiveNumber(formCourse.hoursSpent);

//     // Validate modules
//     const validatedCompleted =
//       totalModules > 0
//         ? Math.min(completedModules, totalModules)
//         : completedModules;

//     const statusValue = normalizeStatusValue(formCourse.status);
//     let autoProgress = 0;

//     if (statusValue === "completed") {
//       autoProgress = 100;
//     } else if (totalModules > 0) {
//       autoProgress = calculateProgress(validatedCompleted, totalModules);
//     }

//     const skillsArray = parseSkills(formCourse.skills);
//     const startDate = formCourse.startDate?.trim() || "";
//     let endDate = formCourse.endDate?.trim() || "";

//     if (statusValue === "ongoing") {
//       endDate = "";
//     }

//     if (statusValue === "completed") {
//       const startDateObj = toDate(startDate);
//       const endDateObj = toDate(endDate);

//       if (!startDateObj) {
//         toast({
//           title: "Start date required",
//           description: "Please enter a valid start date for completed courses.",
//           variant: "destructive",
//         });
//         return;
//       }

//       if (!endDateObj) {
//         toast({
//           title: "End date required",
//           description:
//             "Please enter an end date when marking a course completed.",
//           variant: "destructive",
//         });
//         return;
//       }

//       if (endDateObj.getTime() < startDateObj.getTime()) {
//         toast({
//           title: "Invalid date range",
//           description: "End date cannot be earlier than start date.",
//           variant: "destructive",
//         });
//         return;
//       }
//     }

//     const durationLabel = describeDuration(startDate, endDate, statusValue);
//     const timelineLabel = buildTimelineLabel(startDate, endDate, statusValue);

//     const baseCourse = editingIndex !== null ? courses[editingIndex] || {} : {};
//     const normalizedCourse = {
//       id: editingIndex !== null ? baseCourse.id : Date.now(),
//       course: formCourse.course.trim(),
//       provider: formCourse.provider.trim(),
//       startDate,
//       endDate,
//       duration: timelineLabel,
//       durationLabel,
//       status: statusValue,
//       progress: autoProgress,
//       completedModules: validatedCompleted,
//       totalModules,
//       hoursSpent,
//       skills: skillsArray,
//       certificateUrl: formCourse.certificateUrl.trim(),
//       description: formCourse.description.trim(),
//       enabled: editingIndex !== null ? baseCourse.enabled !== false : true,
//       verified: editingIndex !== null ? baseCourse.verified : false,
//       processing: true,
//       approval_status: editingIndex !== null ? baseCourse.approval_status : "pending",
//       updated_at: new Date().toISOString(),
//     };

//     // Update or add course
//     if (editingIndex !== null) {
//       setCourses((prev) =>
//         prev.map((course, index) =>
//           index === editingIndex ? normalizedCourse : course
//         )
//       );
//       toast({
//         title: "Course Updated",
//         description: "Your changes will be processed for verification.",
//       });
//     } else {
//       setCourses((prev) => [...prev, normalizedCourse]);
//       toast({
//         title: "Course Added",
//         description:
//           "Your training course has been submitted for verification.",
//       });
//     }

//     closeForm();
//   };

//   // Toggle course enabled/disabled
//   const toggleCourseEnabled = (index) => {
//     setCourses((prev) =>
//       prev.map((item, idx) =>
//         idx === index
//           ? { ...item, enabled: item.enabled === false ? true : false }
//           : item
//       )
//     );
//   };

//   // Delete course
//   const deleteCourse = (index) => {
//     setCourses((prev) => prev.filter((_, idx) => idx !== index));
//     toast({
//       title: "Course Removed",
//       description: "The training course has been removed.",
//     });
//   };

//   // Save all changes
//   const handleSubmit = async () => {
//     try {
//       await onSave(courses);
//       toast({
//         title: "Training Updated",
//         description: "Your training details have been saved successfully.",
//       });
//       onClose();
//     } catch (error) {
//       console.error('Error saving training:', error);
//       toast({
//         title: "Error",
//         description: "Failed to save training details. Please try again.",
//         variant: "destructive",
//       });
//     }
//   };

//   // Render form
//   const renderForm = () => {
//     if (!isFormOpen) {
//       return (
//         <Button
//           onClick={openNewCourseForm}
//           variant="outline"
//           className="w-full border-dashed bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
//         >
//           <Plus className="w-4 h-4 mr-2" />
//           Add Training Course
//         </Button>
//       );
//     }

//     const completedValue = parsePositiveNumber(formCourse.completedModules);
//     const totalValue = parsePositiveNumber(formCourse.totalModules);
//     const statusValue = normalizeStatusValue(formCourse.status);
//     const validatedCompleted =
//       totalValue > 0 ? Math.min(completedValue, totalValue) : completedValue;
//     const autoProgress =
//       statusValue === "completed"
//         ? 100
//         : totalValue > 0
//         ? calculateProgress(validatedCompleted, totalValue)
//         : 0;

//     return (
//       <div className="p-4 border-2 border-dashed border-indigo-200 bg-indigo-50 rounded-lg space-y-4">
//         <h4 className="font-semibold text-indigo-700">
//           {editingIndex !== null
//             ? "Edit Training Course"
//             : "Add Training Course"}
//         </h4>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <Label htmlFor="training-course">Course Name *</Label>
//             <Input
//               id="training-course"
//               value={formCourse.course}
//               onChange={handleInputChange("course")}
//               placeholder="e.g., Advanced React Development"
//               className="bg-white"
//             />
//           </div>
//           <div>
//             <Label htmlFor="training-provider">Provider</Label>
//             <Input
//               id="training-provider"
//               value={formCourse.provider}
//               onChange={handleInputChange("provider")}
//               placeholder="e.g., Coursera, Udemy"
//               className="bg-white"
//             />
//           </div>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <Label htmlFor="training-start">Start Date</Label>
//             <Input
//               id="training-start"
//               type="date"
//               value={formCourse.startDate}
//               onChange={handleInputChange("startDate")}
//               className="bg-white"
//             />
//           </div>
//           <div>
//             <Label htmlFor="training-end">End Date</Label>
//             <Input
//               id="training-end"
//               type="date"
//               value={formCourse.endDate}
//               onChange={handleInputChange("endDate")}
//               disabled={normalizeStatusValue(formCourse.status) !== "completed"}
//               className="bg-white"
//             />
//           </div>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <Label htmlFor="training-status">Status</Label>
//             <select
//               id="training-status"
//               value={formCourse.status}
//               onChange={handleStatusChange}
//               className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
//             >
//               {statusOptions.map((status) => (
//                 <option key={status} value={status}>
//                   {status.charAt(0).toUpperCase() + status.slice(1)}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div>
//             <Label htmlFor="training-completed">Modules Completed</Label>
//             <Input
//               id="training-completed"
//               type="number"
//               min="0"
//               value={formCourse.completedModules}
//               onChange={handleInputChange("completedModules")}
//               placeholder="10"
//               className="bg-white"
//             />
//           </div>
//           <div>
//             <Label htmlFor="training-total">Total Modules</Label>
//             <Input
//               id="training-total"
//               type="number"
//               min="0"
//               value={formCourse.totalModules}
//               onChange={handleInputChange("totalModules")}
//               placeholder="12"
//               className="bg-white"
//             />
//           </div>
//           <div>
//             <Label htmlFor="training-hours">Hours Spent</Label>
//             <Input
//               id="training-hours"
//               type="number"
//               min="0"
//               value={formCourse.hoursSpent}
//               onChange={handleInputChange("hoursSpent")}
//               placeholder="24"
//               className="bg-white"
//             />
//           </div>
//         </div>
//         <div>
//           <Label htmlFor="training-certificate">Certificate URL</Label>
//           <Input
//             id="training-certificate"
//             type="url"
//             value={formCourse.certificateUrl}
//             onChange={handleInputChange("certificateUrl")}
//             placeholder="https://..."
//             className="bg-white"
//           />
//         </div>
//         <div>
//           <Label htmlFor="training-skills">
//             Skills Covered (comma separated)
//           </Label>
//           <Textarea
//             id="training-skills"
//             value={formCourse.skills}
//             onChange={handleInputChange("skills")}
//             placeholder="React, TypeScript, Testing, Node.js"
//             className="bg-white"
//             rows={2}
//           />
//         </div>
//         <div>
//   <Label htmlFor="training-description">Description</Label>
//   <Textarea
//     id="training-description"
//     value={formCourse.description}
//     onChange={handleInputChange("description")}
//     placeholder="Brief description of what you learned in this training..."
//     className="bg-white"
//     rows={3}
//   />
// </div>
//         <div className="space-y-1">
//           {/* <div className="flex items-center justify-between text-xs font-medium text-indigo-700">
//             <span>Calculated Progress</span>
//             <span>{autoProgress}%</span>
//           </div> */}
//           <Progress value={autoProgress} className="h-2" />
//           <p className="text-xs text-gray-500 mt-1">
//             {statusValue === "completed"
//               ? "Completed courses automatically show 100% progress"
//               : totalValue > 0
//               ? `Progress calculated from ${validatedCompleted}/${totalValue} modules`
//               : "Add total modules to calculate progress automatically"}
//           </p>
//         </div>
//         <div className="flex gap-2">
//           <Button
//             onClick={handleFormSubmit}
//             className="bg-indigo-500 hover:bg-indigo-600 text-white"
//           >
//             {editingIndex !== null ? "Update Course" : "Add Course"}
//           </Button>
//           <Button variant="outline" onClick={closeForm}>
//             Cancel
//           </Button>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             <Edit3 className="w-5 h-5" />
//             Edit Training & Courses
//           </DialogTitle>
//         </DialogHeader>
//         <div className="space-y-4">
//           {courses.map((course, index) => (
//             <div
//               key={course.id || index}
//               className={`p-5 border rounded-xl shadow-sm hover:shadow-md transition-shadow ${
//                 course.enabled === false ? "opacity-50 bg-gray-50" : "bg-white"
//               }`}
//             >
//               <div className="flex justify-between items-start gap-4">
//                 {/* Left Side - Main Content */}
//                 <div className="flex-1 space-y-3">
//                   {/* Title and Badges */}
//                   <div className="flex items-start justify-between gap-3">
//                     <h4 className="font-semibold text-lg text-gray-900">
//                       {course.course}
//                     </h4>
//                     <div className="flex flex-wrap gap-2 items-center">
//                       <Badge
//                         className={
//                           course.status === "completed"
//                             ? "bg-emerald-100 text-emerald-700 rounded-full px-3 py-1"
//                             : "bg-blue-100 text-blue-700 rounded-full px-3 py-1"
//                         }
//                       >
//                         {course.status === "completed"
//                           ? "Completed"
//                           : "Ongoing"}
//                       </Badge>
//                       {course.processing && (
//                         <Badge className="bg-orange-100 text-orange-700 rounded-full px-3 py-1 flex items-center gap-1">
//                           <Clock className="w-3 h-3" />
//                           Processing
//                         </Badge>
//                       )}
//                     </div>
//                   </div>

//                   {/* Info Row - Provider, Duration, Hours */}
//                   <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
//                     {course.provider && (
//                       <span className="flex items-center gap-1.5">
//                         <BookOpen className="w-4 h-4 text-gray-500" />
//                         {course.provider}
//                       </span>
//                     )}
//                     {course.duration && (
//                       <span className="flex items-center gap-1.5">
//                         <Calendar className="w-4 h-4 text-gray-500" />
//                         {course.duration}
//                       </span>
//                     )}
//                     {course.hoursSpent > 0 && (
//                       <span className="flex items-center gap-1.5">
//                         <Timer className="w-4 h-4 text-gray-500" />
//                         {course.hoursSpent} hours
//                       </span>
//                     )}
//                   </div>
//                   {/* Description */}
// {course.description && (
//   <p className="text-sm text-gray-600 leading-relaxed">
//     {course.description}
//   </p>
// )}
//                   {/* Modules Completed */}
//                   {(course.completedModules > 0 || course.totalModules > 0) && (
//                     <div className="flex items-center gap-2 text-sm text-gray-700">
//                       <CheckCircle className="w-4 h-4 text-indigo-600" />
//                       <span>
//                         {course.completedModules} of {course.totalModules}{" "}
//                         modules completed
//                       </span>
//                     </div>
//                   )}
//                 </div>

//                 {/* Right Side - Action Buttons */}
//                 <div className="flex flex-col gap-2 items-end">
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => handleEditCourse(index)}
//                     className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
//                   >
//                     <PenSquare className="w-4 h-4" />
//                   </Button>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => deleteCourse(index)}
//                     className="text-red-500 hover:text-red-600 hover:bg-red-50"
//                   >
//                     <Trash2 className="w-4 h-4" />
//                   </Button>
//                   <Button
//                     size="sm"
//                     onClick={() => toggleCourseEnabled(index)}
//                     variant="ghost"
//                     className={
//                       course.enabled === false
//                         ? "text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
//                         : "text-emerald-600 hover:text-gray-500 hover:bg-gray-50"
//                     }
//                     title={
//                       course.enabled === false
//                         ? "Enable course"
//                         : "Disable course"
//                     }
//                   >
//                     {course.enabled === false ? (
//                       <EyeOff className="w-4 h-4" />
//                     ) : (
//                       <Eye className="w-4 h-4" />
//                     )}
//                   </Button>
//                 </div>
//               </div>
//               <div className="flex flex-col mt-4">
//                 {/* Skills */}

//                 {Array.isArray(course.skills) && course.skills.length > 0 && (
//                   <div className="flex flex-col gap-2">
//                     <span className="text-sm font-medium text-gray-700">
//                       Skills Covered:
//                     </span>
//                     <div className="flex flex-wrap gap-2">
//                       {(course.showAllSkills
//                         ? course.skills
//                         : course.skills.slice(0, 7)
//                       ).map((skill, idx) => (
//                         <span
//                           key={`${course.id}-skill-${idx}`}
//                           className="px-3 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium"
//                         >
//                           {skill}
//                         </span>
//                       ))}
//                     </div>
//                     {course.skills.length > 7 && (
//                       <button
//                         onClick={() =>
//                           setCourses((prev) =>
//                             prev.map((c, i) =>
//                               c.id === course.id
//                                 ? { ...c, showAllSkills: !c.showAllSkills }
//                                 : c
//                             )
//                           )
//                         }
//                         className="text-xs text-indigo-600 hover:text-indigo-800 self-start mt-1"
//                       >
//                         {course.showAllSkills
//                           ? "Show Less"
//                           : `Show All (${course.skills.length})`}
//                       </button>
//                     )}
//                   </div>
//                 )}

//                 {/* Progress Graph - Full Width */}
//                 <div className="space-y-2 pt-3 mt-4">
//                   <div className="flex items-center justify-between text-sm font-semibold">
//                     <span className="flex items-center gap-2 text-gray-700">
//                       <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
//                       Course Progress
//                     </span>
//                     <span className="text-indigo-700">{course.progress}%</span>
//                   </div>
//                   <div className="relative">
//                     {/* <Progress
//                       value={course.progress}
//                       className="h-2 w-full rounded-full bg-gray-200"
//                       style={{ width: `${course.progress}%` }}
//                     /> */}

//                     <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
//                       <div
//                         className="h-2.5 bg-blue-600 rounded-full transition-all duration-300"
//                         style={{ width: `${course.progress}%` }}
//                       />
//                     </div>
//                   </div>
//                 </div>
//                 {/* View Certificate Button */}
//                 {course.certificateUrl   const [editingItem, setEditingItem] = useState(null);
//   const [isAdding, setIsAdding] = useState(false);
//   const [formData, setFormData] = useState({
//     role: "",
//     organization: "",
//     start_date: "",
//     end_date: "",
//   });
//   organization: "",
//     start_date: "",
//     end_date: "",
//   });
//   organization: "",
//     start_date: "",
//     end_date: "",
//   });
//   organization: "",
//     start_date: "",
//     end_date: "",
//   });
// digo-400 hover:text-indigo-700 text-sm mt-4"
//                     onClick={() => window.open(course.certificateUrl, "_blank")}
//                   >
//                     <Award className="w-4 h-4 mr-2" />
//                     View Certificate
//                   </Button>
//                 )}

//                 {/* Last Updated */}
//                 {course.updated_at && (
//                   <div className="text-xs text-gray-500 pt-1">
//                     Last updated:{" "}
//                     {new Date(course.updated_at).toLocaleDateString()}
//                   </div>
//                 )}
//               </div>
//             </div>
//           ))}

//           {renderForm()}

//           <dexport className="flex justify-end gap-2 pt-4 border-t">
//             <Button variant="outline" onClick={onClose}>
//               Cancel
//             </Button>
//             <Button
//               onClick={handleSubmit}
//               className="bg-indigo-500 hover:bg-indigo-600 text-white"
//             >
//               Save All Changes
//             </Button>
//           </dexport const ExperienceEditModal = ({ isOpen, onClose, data, onSave }) => {
//   const [newExp, setNewExp] = useState({
//     role: "",
//     organization: "",
//     start_date: "",
//     end_date: "",
//   });
//   const [isAdding, setIsAdding] = useState(false);
// e);
//   const { toast } = useToast();

//   // Update internal state when data prop changes and recalculate durations
//   useEffect(() => {
//     if (data && Array.isArray(data)) {
//       // Recalculate duration for all experiences on load
//       const experiencesWithDuration = data.map(exp => ({
//         ...exp,
//         duration: exp.start_date 
//           ? calculateDuration(exp.start_date, exp.end_date)
//           : exp.duration || ""
//       }));
//       setExperiences(experiencesWithDuration);
//     } else {
//       setExperiences([]);
//     }
//   }, [data]);

//   // Calculate duration from start and end dates
//   const calculateDuration = (startDate, endDate) => {
//     if (!startDate) return "";
    
//     const start = new Date(startDate);
//     const end = endDate ? new Date(endDate) : new Date(); // Use current date if no end date
    
//     if (isNaN(start.getTime())) return "";
//     if (endDate && isNaN(end.getTime())) return "";
    
//     // Calculate difference in milliseconds
//     const diffMs = Math.abs(end - start);
//     const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
//     // Calculate years, months, and days
//     const years = Math.floor(diffDays / 365);
//     const remainingDays = diffDays % 365;
//     const months = Math.floor(remainingDays / 30);
//     const days = remainingDays % 30;
    
//     // Build duration string
//     const parts = [];
//     if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
//     if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
//     if (days > 0 && years === 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    
//     // Format dates for display
//     const formatDate = (date) => {
//       return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
//     };
    
//     const startLabel = formatDate(start);
//     const endLabel = endDate ? formatDate(end) : 'Present';
    
//     const durationText = parts.length > 0 ? parts.join(' ') : 'Less than a month';
    
//     return `${startLabel} - ${endLabel} (${duratio  const resetForm = () => {
//     setFormData({
//       role: "",
//       organization: "",
//       start_date: "",
//       end_date: "",
//     });
//   };

//   const startEditing = (experience) => {
//     setFormData({
//       role: experience.role || "",
//       organization: experience.organization || "",
//       start_date: experience.start_date || "",
//       end_date: experience.end_date || "",
//     });
//     setEditingItem(experience.id);
//     setIsAdding(true);
//   };

//   const startAdding = () => {
//     resetForm();
//     setEditingItem(null);
//     setIsAdding(true);
//   };

//   const cancelEdit = () => {
//     setIsAdding(false);
//     setEditingItem(null);
//     resetForm();
//   };

//   const saveExperience = () => {
//     if (!formData.role.trim() || !formData.organization.trim()) {
//       toast({
//         title: "Error",
//         description: "Please fill in at least role and organization fields.",
//         variant: "destructive",
//       });
//       return;
//     }

//     const duration = calculateDuration(formData.start_date, formData.end_date);

//     if (editingItem) {
//       // Update existing experience
//       setExperiences(
//         experiences.map((exp) =>
//           exp.id === editingItem
//             ? { ...formData, id: editingItem, duration }
//             : exp
//         )
//       );
//     } else {
//       // Add new experience
//       const newExperience = {
//         ...formData,
//         duration,
//         id: Date.now(), // Temporary ID, will be replaced by UUID on save
//         verified: false,
//         processing: true,
//         approval_status: 'pending'
//       };
//       setExperiences([...experiences, newExperience]);
//     }

//     setIsAdding(false);
//     setEditingItem(null);
//     resetForm();

//     toast({
//       title: "Experience Updated",
//       description: "Your experience details are being processed for verification.",
//     });
//   }
//   }
//   }
//   }
//   };

//   const deleteExperience = (id) => {
//     setExperiences(experiences.filter((exp) => exp.id !== id));
//   };

//   const handleSubmit = async () => {
//     try {
//       await onSave(experiences);
//       toast({
//         title: "Experience Updated",
//         description: "Your experience details are being processed for verification.",
//       });
//       onClose();
//     } catch (error) {
//       console.error('Error saving experience:', error);
//       toast({
//         title: "Error",
//         description: "Failed to save experience details. Please try again.",
//         variant: "destructive",
//       });
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             <Edit3 className="w-5 h-5" />
//             Edit Experience
//           </DialogTitle>
//         </DialogHeader>
//         <div className="space-y-4">
//           {experiences.map((exp, index) => (
//             <div
//               key={exp.id || `${exp.role}-${exp.organization}-${index}`}
//               className={`p-4 border rounded-lg ${
//                 exp.enabled === false ? "opacity-50" : "opacity-100"
//               }`}
//             >
//               <div className="flex justify-between items-start">
//                 <div className="flex-1">
//                   <h4 className="font-medium">{exp.role}</h4>
//                   <p className="text-sm">{exp.organization}</p>
//                   <p className="text-xs">{exp.duration}</p>
//                   {exp.processing ? (
//                     <Badge className="mt-2 bg-orange-100 text-orange-800">
//                       <Clock className="w-3 h-3 mr-1" />
//                       Processing
//                     </Badge>
//                   ) : (
//                     exp.verified && (
//                       <Badge className="mt-2 bg-[#28A745] hover:bg-[#28A745]">
//                         <CheckCircle className="w-3 h-3 mr-1" />
//                         Verified
//                       </Badge>
//                     )
//                   )}
//                 </div>
//                 <div className="flex flex-col gap-2">
//                               variant="ghost"
//                     size="sm"
//                     onClick={() => startEditing(exp)}
//                     className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
//                   >
//                     <Edit3 className="w-4 h-4 mr-1" />
//                     Edit
//                   </But>
//                   <Button
//         <Button
//                     variant={exp.enabled === false ? "outline" : "default"}
//                     size="sm"
//                     onClick={() =>
//                       setExperiences(
//                         experiences.map((e, i) =>
//                           (e.id !== undefined ? e.id : i) ===
//                           (exp.id !== undefined ? exp.id : index)
//                             ? {
//                                 ...e,
//                                 enabled: e.enabled === false ? true : false,
//                               }
//                             : e
//                         )
//                       )
//                     }
//                     className={
//                       exp.enabled === false
//                         ? "text-gray-500 border-gray-400"
//                         : "bg-emerald-500 text-white"
//                     }
//                   >
//                     {exp.enabled === undefined || exp.enabled
//                       ? "Disable"
//                       : "Enable"}
//                   </Button>
//                   <Button
//                     variant="destructive"
//                     size="sm"
//                     onClick={() => deleteExperience(exp.id)}
//                   >
//                     <Trash2 className="w-4 h-4 mr-1" />
//                     Delete
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           ))}

//           {isAdding ? (
//             <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg space-y-3">
//               <Input
//                 placeholder="Role/Position"
//                 value={newExp.role}
//                 onChange={(e) =>
//                   setNewExp((prev) => ({ ...prev, role: e.target.value }))
//                 }
//               />
//               <Input
//                 placeholder="Organization"
//                 value={newExp.organization}
//                 onChange={(e) =>
//                   setNewExp((prev) => ({
//                     ...prev,
//                     organization: e.target.value,
//                   }))
//                 }
//               />
//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <Label htmlFor="start_date">Start Date</Label>
//                   <Input
//                     id="start_date"
//                     type="date"
//                     value={newExp.start_date}
//                     onChange={(e) =>
//                       setNewExp((prev) => ({ ...prev, start_date: e.target.value }))
//                     }
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="end_date">End Date (Optional)</Label>
//                   <Input
//                     id="end_date"
//                     type="date"
//                     value={newExp.end_date}
//                     onChange={(e) =>
//                       setNewExp((prev) => ({ ...prev, end_date: e.target.value }))
//                     }
//                   />
//                 </div>
//               </div>
              
//               {/* Display calculated duration preview */}
//               {newExp.start_date && (
//                 <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
//                   <p className="text-sm text-blue-800 font-medium">
//                     Duration: {calculateDuration(newExp.start_date, newExp.end_date)}
//                   </p>
//                   {!newExp.end_date && (
//                     <p className="text-xs text-blue-600 mt-1">
//                       Leave end date empty for ongoing positions
//                     </p>
//                   )}
//                 </div>
//               )}
              
//               <div className="flex gap-2">
//                 <Button
//                   onClick={addExperience}
//                   size="sm"
//                   className="bg-blue-400 hover:bg-blue-500"
//                 >
//                   Add Experience
//                 </Button>
//                 <Button
//                   onClick={() => setIsAdding(false)}
//                   variant="outline"
//                   size="sm"
//                 >
//                   Cancel
//                 </Button>
//               </div>
//             </div>
//           ) : (
//             <Button
//               onClick={() => setIsAdding(true)}
//               variant="outline"
//               className="w-full border-dashed"
//             >
//               <Plus className="w-4 h-4 mr-2" />
//               Add New Experience
//             </Button>
//           )}

//           <div className="flex justify-end gap-2">
//             <Button variant="outline" onClick={onClose}>
//               Cancel
//             </Button>
//             <Button
//               onClick={handleSubmit}
//               className="bg-blue-400 hover:bg-blue-500"
//             >
//               Save Changes
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export const ProjectsEditModal = ({ isOpen, onClose, data, onSave }) => {
//   const [projectsList, setProjectsList] = useState(data || []);
//   const [isAdding, setIsAdding] = useState(false);
//   const [editingIndex, setEditingIndex] = useState(null);
//   const [expandedDescriptions, setExpandedDescriptions] = useState({});
//   const { toast } = useToast();

//   const [formData, setFormData] = useState({
//     title: "",
//     duration: "",
//     status: "",
//     description: "",
//     organization: "",
//     link: "",
//     githubLink: "",
//     techInput: "",
//     start_date: "",
//     end_date: "",
//     certificate: null,
//     video: null,
//     ppt: null,
//     certificate_url: "",
//     video_url: "",
//     ppt_url: "",
//     certificateLink: "",
//     videoLink: "",
//     pptLink: "",
//   });

//   useEffect(() => {
//     setProjectsList(data || []);
//   }, [data]);

//   const resetForm = () => {
//     setFormData({
//       title: "",
//       duration: "",
//       status: "",
//       description: "",
//       organization: "",
//       link: "",
//       githubLink: "",
//       techInput: "",
//       start_date: "",
//       end_date: "",
//       certificate: null,
//       video: null,
//       ppt: null,
//       certificate_url: "",
//       video_url: "",
//       ppt_url: "",
//       certificateLink: "",
//       videoLink: "",
//       pptLink: "",
//     });
//     setEditingIndex(null);
//   };

//   const extractTech = (project) =>
//     project.tech ||
//     project.technologies ||
//     project.techStack ||
//     project.tech_stack ||
//     project.skills ||
//     [];

//   const formatTech = (input) =>
//     (input || "")
//       .split(",")
//       .map((item) => item.trim())
//       .filter(Boolean);

//   const startEditing = (project, index) => {
//     setFormData({
//       title: project.title || "",
//       duration: project.duration || "",
//       status: project.status || "",
//       description: project.description || "",
//       organization: project.organization || project.client || "",
//       link: project.link || "",
//       githubLink:
//         project.github_url || project.github_link || project.github || "",
//       techInput: extractTech(project).join(", "),
//       start_date: project.start_date || "",
//       end_date: project.end_date || "",
//       certificate: null,
//       video: null,
//       ppt: null,
//       certificate_url: project.certificate_url || "",
//       video_url: project.video_url || "",
//       ppt_url: project.ppt_url || "",
//       certificateLink: project.certificate_url || "",
//       videoLink: project.video_url || "",
//       pptLink: project.ppt_url || "",
//     });
//     setEditingIndex(index);
//     setIsAdding(true);
//   };

//   const prepareProject = (base, existing = {}) => {
//     const techArray = formatTech(base.techInput);
//     const organizationValue = base.organization?.trim() || null;
//     const enabledValue =
//       typeof base.enabled === "boolean"
//         ? base.enabled
//         : typeof existing.enabled === "boolean"
//         ? existing.enabled
//         : true;
//     let durationText = "";
//     let startLabel = "";
//     let endLabel = "";

//     if (base.start_date && base.end_date) {
//       const start = new Date(base.start_date);
//       const end = new Date(base.end_date);
//       const diffMs = Math.abs(end - start);
//       const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

//       // compute months/weeks/days
//       let duration = "";
//       if (diffDays >= 30) {
//         const diffMonths = Math.floor(diffDays / 30);
//         duration = `${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
//       } else if (diffDays >= 14) {
//         const diffWeeks = Math.floor(diffDays / 7);
//         duration = `${diffWeeks} week${diffWeeks > 1 ? "s" : ""}`;
//       } else if (diffDays > 1) {
//         duration = `${diffDays} days`;
//       } else {
//         duration = "1 day";
//       }

//       // format month-year labels
//       const formatMonthYear = (date) =>
//         date.toLocaleString("default", { month: "short", year: "numeric" });

//       startLabel = formatMonthYear(start);
//       endLabel = formatMonthYear(end);

//       // final display
//       durationText = `${startLabel} – ${endLabel} (${duration})`;
//     }

//     return {
//       ...existing,
//       ...base,
//       start_date: base.start_date || null,
//       end_date: base.end_date || null,
//       duration: durationText, // formatted version
//       status: base.status || "In Progress",
//       enabled: enabledValue,
//       tech: techArray,
//       technologies: techArray,
//       organization: organizationValue,
//       client: organizationValue,
//       certificate_url: base.certificateLink?.trim() || base.certificate_url?.trim() || null,
//       video_url: base.videoLink?.trim() || base.video_url?.trim() || null,
//       ppt_url: base.pptLink?.trim() || base.ppt_url?.trim() || null,
//       github_url: base.githubLink?.trim() || base.github_url?.trim() || null,
//       github_link: base.githubLink?.trim() || base.github_url?.trim() || null,
//       github: base.githubLink?.trim() || base.github_url?.trim() || null,
//       updatedAt: new Date().toISOString(),
//     };
//   };

//   const saveProject = () => {
//     if (!formData.title.trim()) {
//       toast({
//         title: "Missing title",
//         description: "Please provide a project title before saving.",
//         variant: "destructive",
//       });
//       return;
//     }

//     const newProject = prepareProject(formData);
//     if (editingIndex !== null) {
//       setProjectsList((prev) =>
//         prev.map((proj, idx) => (idx === editingIndex ? newProject : proj))
//       );
//       toast({
//         title: "Project Updated",
//         description: "Changes saved successfully.",
//       });
//     } else {
//       setProjectsList((prev) => [
//         ...prev,
//         { ...newProject, createdAt: new Date().toISOString(), enabled: true },
//       ]);
//       toast({
//         title: "Project Added",
//         description: "New project added successfully.",
//       });
//     }
//     setIsAdding(false);
//     resetForm();
//   };

//   const toggleProject = (index) => {
//     setProjectsList((prev) =>
//       prev.map((project, idx) =>
//         idx === index ? { ...project, enabled: !project.enabled } : project
//       )
//     );
//   };

//   const deleteProject = (index) => {
//     setProjectsList((prev) => prev.filter((_, i) => i !== index));
//   };

//   const handleSubmit = async () => {
//     try {
//       await onSave(projectsList);
//       onClose();
//     } catch (error) {
//       console.error('Error saving projects:', error);
//       toast({
//         title: "Error",
//         description: "Failed to save project details. Please try again.",
//         variant: "destructive",
//       });
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={() => onClose()}>
//       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-lg">
//         <DialogHeader>
//           <DialogTitle className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
//             <Edit3 className="w-5 h-5 text-blue-600" /> Manage Projects
//           </DialogTitle>
//         </DialogHeader>

//         <div className="space-y-6 mt-4">
//           {/* Project List */}
//           {projectsList.map((project, index) => (
//             <div
//               key={index}
//               className={`relative border border-gray-200 rounded-xl p-6 shadow-sm transition-opacity ${
//                 project.enabled === false ? "bg-gray-50 opacity-60" : "bg-white"
//               }`}
//             >
//               <div className="absolute top-4 right-4 flex gap-2">
//                 <Button
//                   size="icon"
//                   variant="outline"
//                   className="text-blue-600 bg-white border-blue-200 hover:bg-blue-50"
//                   onClick={() => startEditing(project, index)}
//                 >
//                   <Edit3 className="w-4 h-4" />
//                 </Button>
//                 <Button
//                   size="icon"
//                   variant="outline"
//                   className="text-red-600 bg-red-50 border-red-200 hover:bg-red-50"
//                   onClick={() => deleteProject(index)}
//                 >
//                   <Trash2 className="w-4 h-4" />
//                 </Button>
//                 <Button
//                   size="icon"
//                   variant="outline"
//                   className={
//                     project.enabled
//                       ? "text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
//                       : "text-gray-500 border-gray-300 bg-white hover:bg-gray-100"
//                   }
//                   onClick={() => toggleProject(index)}
//                   title={project.enabled ? "Disable project" : "Enable project"}
//                 >
//                   {project.enabled ? (
//                     <Eye className="w-4 h-4" />
//                   ) : (
//                     <EyeOff className="w-4 h-4" />
//                   )}
//                 </Button>
//               </div>

//               <h2 className="text-xl font-semibold text-black w-[calc(100%-8rem)]">
//                 {project.title}
//               </h2>
//               {(project.organization || project.client) && (
//                 <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
//                   <Building2 className="w-4 h-4 text-gray-500" />
//                   {project.organization || project.client}
//                 </p>
//               )}
//               {project.duration && (
//                 <p className="text-sm text-gray-500 flex items-center gap-1 my-2">
//                   <CalendarDays className="w-4 h-4 text-gray-400" />
//                   {project.duration}
//                 </p>
//               )}

//               {/* Status */}
//               <div className="flex gap-2 mt-4">
//                 {project.status && (
//                   <span className="flex items-center px-3 py-1 text-xs rounded-full bg-green-50 text-green-700 border border-green-200">
//                     <CheckCircle className="w-3 h-3 mr-1" /> {project.status}
//                   </span>
//                 )}
//                 {project.processing && (
//                   <span className="flex items-center px-3 py-1 text-xs rounded-full bg-orange-50 text-orange-700 border border-orange-200">
//                     <Clock className="w-3 h-3 mr-1" /> Processing
//                   </span>
//                 )}
//                 {project.approval_status && (
//                   <span className={`flex items-center px-3 py-1 text-xs rounded-full border ${
//                     project.approval_status === 'approved'
//                       ? 'bg-green-50 text-green-700 border-green-200'
//                       : project.approval_status === 'rejected'
//                       ? 'bg-red-50 text-red-700 border-red-200'
//                       : 'bg-orange-50 text-orange-700 border-orange-200'
//                   }`}>
//                     {project.approval_status === 'approved' ? (
//                       <CheckCircle className="w-3 h-3 mr-1" />
//                     ) : project.approval_status === 'rejected' ? (
//                       <X className="w-3 h-3 mr-1" />
//                     ) : (
//                       <Clock className="w-3 h-3 mr-1" />
//                     )}
//                     {project.approval_status.charAt(0).toUpperCase() + project.approval_status.slice(1)}
//                   </span>
//                 )}
//               </div>

//               {project.description && (
//                 <div className="mt-2">
//                   <p
//                     className={`text-sm text-gray-700 leading-relaxed ${
//                       expandedDescriptions[index]
//                         ? "line-clamp-none"
//                         : "line-clamp-3"
//                     }`}
//                   >
//                     {project.description}
//                   </p>
//                   {project.description.length > 180 && (
//                     <button
//                       onClick={() =>
//                         setExpandedDescriptions((prev) => ({
//                           ...prev,
//                           [index]: !prev[index],
//                         }))
//                       }
//                       className="mt-1 text-xs text-blue-600 hover:underline"
//                     >
//                       {expandedDescriptions[index] ? "Show less" : "Show more"}
//                     </button>
//                   )}

//                   {/* Tech Stack */}
//                   {extractTech(project).length > 0 && (
//                     <div className="flex flex-wrap gap-2 mt-3">
//                       {extractTech(project).map((tech, i) => (
//                         <span
//                           key={i}
//                           className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs border border-purple-100"
//                         >
//                           {tech}
//                         </span>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               )}

//               <div className="flex justify-end items-center gap-2 pt-4 mt-2 border-t border-gray-100 flex-wrap">
//                 {project.link && (
//                   <Button
//                     asChild
//                     variant="outline"
//                     size="sm"
//                     className="text-blue-600 border-blue-200 hover:bg-blue-50"
//                   >
//                     <a
//                       href={project.link}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                     >
//                       <Link className="w-4 h-4 mr-1" /> Demo
//                     </a>
//                   </Button>
//                 )}
//                 {(project.github_url || project.github_link || project.github) && (
//                   <Button
//                     asChild
//                     variant="outline"
//                     size="sm"
//                     className="text-gray-700 border-gray-300 hover:bg-gray-100"
//                   >
//                     <a
//                       href={project.github_url || project.github_link || project.github}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                     >
//                       <Github className="w-4 h-4 mr-1" /> GitHub
//                     </a>
//                   </Button>
//                 )}
//                 {project.certificate_url && (
//                   <Button
//                     asChild
//                     variant="outline"
//                     size="sm"
//                     className="text-green-600 border-green-200 hover:bg-green-50"
//                   >
//                     <a
//                       href={project.certificate_url}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                     >
//                       <FileText className="w-4 h-4 mr-1" /> Certificate
//                     </a>
//                   </Button>
//                 )}
//                 {project.video_url && (
//                   <Button
//                     asChild
//                     variant="outline"
//                     size="sm"
//                     className="text-red-600 border-red-200 hover:bg-red-50"
//                   >
//                     <a
//                       href={project.video_url}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                     >
//                       <Video className="w-4 h-4 mr-1" /> Video
//                     </a>
//                   </Button>
//                 )}
//                 {project.ppt_url && (
//                   <Button
//                     asChild
//                     variant="outline"
//                     size="sm"
//                     className="text-purple-600 border-purple-200 hover:bg-purple-50"
//                   >
//                     <a
//                       href={project.ppt_url}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                     >
//                       <Presentation className="w-4 h-4 mr-1" /> PPT
//                     </a>
//                   </Button>
//                 )}
//               </div>
//             </div>
//           ))}

//           {/* Add Form */}
//           {!isAdding ? (
//             <Button
//               onClick={() => setIsAdding(true)}
//               variant="outline"
//               className="w-full border-dashed border-gray-300 text-gray-600 hover:bg-gray-50"
//             >
//               <Plus className="w-4 h-4 mr-2" />
//               Add New Project
//             </Button>
//           ) : (
//             <div className="p-5 border border-gray-200 rounded-xl bg-gray-50 space-y-4">
//               {/* Basic Info */}
//               <div className="space-y-2">
//                 <Label htmlFor="project-title">Project Title *</Label>
//                 <Input
//                   id="project-title"
//                   value={formData.title}
//                   onChange={(e) =>
//                     setFormData((p) => ({ ...p, title: e.target.value }))
//                   }
//                   placeholder="e.g., Smart Hiring Platform"
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="project-organization">Organization / Client</Label>
//                 <Input
//                   id="project-organization"
//                   value={formData.organization}
//                   onChange={(e) =>
//                     setFormData((p) => ({ ...p, organization: e.target.value }))
//                   }
//                   placeholder="e.g., Acme Corp"
//                 />
//               </div>

//               {/* Timeline Section */}
//               <div className="space-y-2">
//                 <Label className="font-medium text-gray-800">Timeline</Label>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
//                   {/* Start Month */}
//                   <div className="space-y-1">
//                     <Label
//                       htmlFor="project-start"
//                       className="text-sm text-gray-600"
//                     >
//                       Start Date
//                     </Label>
//                     <Input
//                       type="date"
//                       id="project-start"
//                       value={formData.start_date}
//                       onChange={(e) =>
//                         setFormData((p) => ({
//                           ...p,
//                           start_date: e.target.value,
//                         }))
//                       }
//                       className="border-gray-300 text-gray-700"
//                     />
//                   </div>

//                   {/* End Month */}
//                   <div className="space-y-1">
//                     <Label
//                       htmlFor="project-end"
//                       className="text-sm text-gray-600"
//                     >
//                       End Date
//                     </Label>
//                     <Input
//                       type="date"
//                       id="project-end"
//                       value={formData.end_date}
//                       onChange={(e) =>
//                         setFormData((p) => ({ ...p, end_date: e.target.value }))
//                       }
//                       className="border-gray-300 text-gray-700"
//                     />
//                   </div>
//                 </div>

//                 {/* Display computed duration */}
//                 {formData.duration && (
//                   <p className="text-xs text-gray-500 mt-1">
//                     Duration:{" "}
//                     <span className="font-medium text-gray-700">
//                       {formData.duration}
//                     </span>
//                   </p>
//                 )}
//               </div>

//               {/* Status Dropdown */}
//               <div className="space-y-2">
//                 <Label
//                   htmlFor="project-status"
//                   className="font-medium text-gray-800"
//                 >
//                   Project Status
//                 </Label>
//                 <select
//                   id="project-status"
//                   value={formData.status}
//                   onChange={(e) =>
//                     setFormData((p) => ({ ...p, status: e.target.value }))
//                   }
//                   className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white"
//                 >
//                   <option value="">Select status...</option>
//                   <option value="In Progress">In Progress</option>
//                   <option value="Completed">Completed</option>
//                 </select>
//               </div>

//               <div className="gap-4 space-y-2">
//                 <Label>Description</Label>
//                 <Textarea
//                   value={formData.description}
//                   onChange={(e) =>
//                     setFormData((p) => ({ ...p, description: e.target.value }))
//                   }
//                   placeholder="Describe your project..."
//                 />
//               </div>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label>Tech Stack (comma separated)</Label>
//                   <Input
//                     value={formData.techInput}
//                     onChange={(e) =>
//                       setFormData((p) => ({ ...p, techInput: e.target.value }))
//                     }
//                     placeholder="React, Node.js, PostgreSQL"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Demo Link</Label>
//                   <Input
//                     value={formData.link}
//                     onChange={(e) =>
//                       setFormData((p) => ({ ...p, link: e.target.value }))
//                     }
//                     placeholder="https://"
//                   />
//                 </div>
//               </div>
//               <div className="space-y-2">
//                 <Label>GitHub Link (optional)</Label>
//                 <Input
//                   value={formData.githubLink}
//                   onChange={(e) =>
//                     setFormData((p) => ({ ...p, githubLink: e.target.value }))
//                   }
//                   placeholder="https://github.com/..."
//                 />
//               </div>

//               {/* ---- Evidence Section (YOUR UI KEPT EXACTLY AS IS) ---- */}
//               <div className="space-y-8">
//                 {/* Header */}
//                 <div className="flex items-center gap-2 pt-4">
//                   <FileText className="w-5 h-5 text-gray-700" />
//                   <Label className="text-base font-semibold text-gray-800">
//                     Project Evidence
//                     <span className="text-gray-500 font-normal text-sm ml-1">
//                       (Optional)
//                     </span>
//                   </Label>
//                 </div>

//                 {/* Evidence Rows */}
//                 <div className="flex flex-col gap-6">
//                   {/* === CERTIFICATE === */}
//                   <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 hover:bg-gray-100 transition-colors">
//                     <div className="flex items-center gap-2 mb-3">
//                       <FileText className="w-4 h-4 text-blue-600" />
//                       <Label className="text-sm font-medium text-gray-800">
//                         Certificate
//                       </Label>
//                     </div>

//                     <AnimatePresence mode="wait">
//                       {formData.certificate ? (
//                         <motion.div
//                           key="file"
//                           initial={{ opacity: 0, y: -8 }}
//                           animate={{ opacity: 1, y: 0 }}
//                           exit={{ opacity: 0, y: 8 }}
//                           className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-blue-200 bg-blue-50 rounded-lg px-4 py-3 gap-3"
//                         >
//                           <div
//                             className="flex items-center gap-2 text-sm text-blue-700 max-w-full overflow-hidden"
//                             title={formData.certificate.name}
//                           >
//                             <FileText className="w-4 h-4 flex-shrink-0" />
//                             <span className="truncate max-w-[220px] sm:max-w-[300px] md:max-w-[400px]">
//                               {formData.certificate.name}
//                             </span>
//                           </div>
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             className="text-red-500 hover:text-red-700 self-end sm:self-center"
//                             onClick={() =>
//                               setFormData((prev) => ({
//                                 ...prev,
//                                 certificate: null,
//                               }))
//                             }
//                           >
//                             <X className="w-4 h-4" /> Remove
//                           </Button>
//                         </motion.div>
//                       ) : (
//                         <motion.div
//                           key="upload"
//                           initial={{ opacity: 0, y: -8 }}
//                           animate={{ opacity: 1, y: 0 }}
//                           exit={{ opacity: 0, y: 8 }}
//                           className="flex flex-col md:flex-row items-center gap-3"
//                         >
//                           <label
//                             htmlFor="project-certificate"
//                             className="flex items-center justify-center w-full md:w-1/2 border border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-600 cursor-pointer hover:border-blue-400 transition"
//                           >
//                             <Upload className="w-4 h-4 mr-2 text-blue-600" />
//                             Upload file
//                             <input
//                               id="project-certificate"
//                               type="file"
//                               accept=".pdf,.jpg,.jpeg,.png"
//                               className="hidden"
//                               onChange={(e) =>
//                                 setFormData((prev) => ({
//                                   ...prev,
//                                   certificate: e.target.files?.[0] || null,
//                                   certificateLink: "",
//                                 }))
//                               }
//                             />
//                           </label>

//                           <span className="text-xs text-gray-400 text-center md:w-auto w-full">
//                             or
//                           </span>

//                           <div className="relative w-full md:w-1/2">
//                             <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
//                             <Input
//                               id="project-certificate-link"
//                               type="url"
//                               placeholder="Paste certificate link..."
//                               value={formData.certificateLink}
//                               className="pl-8 text-sm border-gray-300 focus:ring-1 focus:ring-blue-300"
//                               onChange={(e) =>
//                                 setFormData((prev) => ({
//                                   ...prev,
//                                   certificateLink: e.target.value,
//                                 }))
//                               }
//                             />
//                           </div>
//                         </motion.div>
//                       )}
//                     </AnimatePresence>
//                   </div>

//                   {/* === VIDEO === */}
//                   <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 hover:bg-gray-100 transition-colors">
//                     <div className="flex items-center gap-2 mb-3">
//                       <Video className="w-4 h-4 text-blue-600" />
//                       <Label className="text-sm font-medium text-gray-800">
//                         Video
//                       </Label>
//                     </div>

//                     <AnimatePresence mode="wait">
//                       {formData.video ? (
//                         <motion.div
//                           key="file"
//                           initial={{ opacity: 0, y: -8 }}
//                           animate={{ opacity: 1, y: 0 }}
//                           exit={{ opacity: 0, y: 8 }}
//                           className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-blue-200 bg-blue-50 rounded-lg px-4 py-3 gap-3"
//                         >
//                           <div
//                             className="flex items-center gap-2 text-sm text-blue-700 max-w-full overflow-hidden"
//                             title={formData.video.name}
//                           >
//                             <Video className="w-4 h-4 flex-shrink-0" />
//                             <span className="truncate max-w-[220px] sm:max-w-[300px] md:max-w-[400px]">
//                               {formData.video.name}
//                             </span>
//                           </div>
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             className="text-red-500 hover:text-red-700 self-end sm:self-center"
//                             onClick={() =>
//                               setFormData((prev) => ({
//                                 ...prev,
//                                 video: null,
//                               }))
//                             }
//                           >
//                             <X className="w-4 h-4" /> Remove
//                           </Button>
//                         </motion.div>
//                       ) : (
//                         <motion.div
//                           key="upload"
//                           initial={{ opacity: 0, y: -8 }}
//                           animate={{ opacity: 1, y: 0 }}
//                           exit={{ opacity: 0, y: 8 }}
//                           className="flex flex-col md:flex-row items-center gap-3"
//                         >
//                           <label
//                             htmlFor="project-video"
//                             className="flex items-center justify-center w-full md:w-1/2 border border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-600 cursor-pointer hover:border-blue-400 transition"
//                           >
//                             <Upload className="w-4 h-4 mr-2 text-blue-600" />
//                             Upload video
//                             <input
//                               id="project-video"
//                               type="file"
//                               accept=".mp4,.avi,.mov,.wmv"
//                               className="hidden"
//                               onChange={(e) =>
//                                 setFormData((prev) => ({
//                                   ...prev,
//                                   video: e.target.files?.[0] || null,
//                                   videoLink: "",
//                                 }))
//                               }
//                             />
//                           </label>

//                           <span className="text-xs text-gray-400 text-center md:w-auto w-full">
//                             or
//                           </span>

//                           <div className="relative w-full md:w-1/2">
//                             <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
//                             <Input
//                               id="project-video-link"
//                               type="url"
//                               placeholder="Paste video link (YouTube, Drive...)"
//                               value={formData.videoLink}
//                               className="pl-8 text-sm border-gray-300 focus:ring-1 focus:ring-blue-300"
//                               onChange={(e) =>
//                                 setFormData((prev) => ({
//                                   ...prev,
//                                   videoLink: e.target.value,
//                                 }))
//                               }
//                             />
//                           </div>
//                         </motion.div>
//                       )}
//                     </AnimatePresence>
//                   </div>

//                   {/* === PRESENTATION === */}
//                   <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 hover:bg-gray-100 transition-colors">
//                     <div className="flex items-center gap-2 mb-3">
//                       <Presentation className="w-4 h-4 text-blue-600" />
//                       <Label className="text-sm font-medium text-gray-800">
//                         Presentation (PPT)
//                       </Label>
//                     </div>

//                     <AnimatePresence mode="wait">
//                       {formData.ppt ? (
//                         <motion.div
//                           key="file"
//                           initial={{ opacity: 0, y: -8 }}
//                           animate={{ opacity: 1, y: 0 }}
//                           exit={{ opacity: 0, y: 8 }}
//                           className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-blue-200 bg-blue-50 rounded-lg px-4 py-3 gap-3"
//                         >
//                           <div
//                             className="flex items-center gap-2 text-sm text-blue-700 max-w-full overflow-hidden"
//                             title={formData.ppt.name}
//                           >
//                             <Presentation className="w-4 h-4 flex-shrink-0" />
//                             <span className="truncate max-w-[220px] sm:max-w-[300px] md:max-w-[400px]">
//                               {formData.ppt.name}
//                             </span>
//                           </div>
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             className="text-red-500 hover:text-red-700 self-end sm:self-center"
//                             onClick={() =>
//                               setFormData((prev) => ({
//                                 ...prev,
//                                 ppt: null,
//                               }))
//                             }
//                           >
//                             <X className="w-4 h-4" /> Remove
//                           </Button>
//                         </motion.div>
//                       ) : (
//                         <motion.div
//                           key="upload"
//                           initial={{ opacity: 0, y: -8 }}
//                           animate={{ opacity: 1, y: 0 }}
//                           exit={{ opacity: 0, y: 8 }}
//                           className="flex flex-col md:flex-row items-center gap-3"
//                         >
//                           <label
//                             htmlFor="project-ppt"
//                             className="flex items-center justify-center w-full md:w-1/2 border border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-600 cursor-pointer hover:border-blue-400 transition"
//                           >
//                             <Upload className="w-4 h-4 mr-2 text-blue-600" />
//                             Upload presentation
//                             <input
//                               id="project-ppt"
//                               type="file"
//                               accept=".ppt,.pptx,.pdf"
//                               className="hidden"
//                               onChange={(e) =>
//                                 setFormData((prev) => ({
//                                   ...prev,
//                                   ppt: e.target.files?.[0] || null,
//                                   pptLink: "",
//                                 }))
//                               }
//                             />
//                           </label>

//                           <span className="text-xs text-gray-400 text-center md:w-auto w-full">
//                             or
//                           </span>

//                           <div className="relative w-full md:w-1/2">
//                             <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
//                             <Input
//                               id="project-ppt-link"
//                               type="url"
//                               placeholder="Paste presentation link..."
//                               value={formData.pptLink}
//                               className="pl-8 text-sm border-gray-300 focus:ring-1 focus:ring-blue-300"
//                               onChange={(e) =>
//                                 setFormData((prev) => ({
//                                   ...prev,
//                                   pptLink: e.target.value,
//                                 }))
//                               }
//                             />
//                           </div>
//                         </motion.div>
//                       )}
//                     </AnimatePresence>
//                   </div>
//                 </div>
//               </div>

//               <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
//                 <Button
//                   variant="outline"
//                   onClick={() => {
//                     setIsAdding(false);
//                     resetForm();
//                   }}
//                 >
//                   Cancel
//                 </Button>
//                 <Button
//                   onClick={saveProject}
//                   className="bg-blue-500 hover:bg-blue-600 text-white"
//                 >
//                   {editingIndex !== null ? "Update Project" : "Add Project"}
//                 </Button>
//               </div>
//             </div>
//           )}

//           {/* Save All */}
//           <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
//             <Button variant="outline" onClick={onClose}>
//               Close
//             </Button>
//             <Button
//               onClick={handleSubmit}
//               className="bg-blue-500 hover:bg-blue-600 text-white"
//             >
//               Save All Changes
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export const CertificatesEditModal = ({ isOpen, onClose, data, onSave }) => {
//   const [certificates, setCertificates] = useState(data || []);
//   const [isAdding, setIsAdding] = useState(false);
//   const [editingIndex, setEditingIndex] = useState(null);
//   const [formData, setFormData] = useState({
//     title: "",
//     issuer: "",
//     issuedOn: "",
//     level: "",
//     description: "",
//     credentialId: "",
//     link: "",
//     document: null,
//     documentLink: "",
//     document_url: "",
//   });
//   const { toast } = useToast();

//   useEffect(() => {
//     setCertificates(data || []);
//   }, [data]);

//   const resetForm = () => {
//     setFormData({
//       title: "",
//       issuer: "",
//       issuedOn: "",
//       level: "",
//       description: "",
//       credentialId: "",
//       link: "",
//       document: null,
//       documentLink: "",
//       document_url: "",
//     });
//     setEditingIndex(null);
//   };

//   const startEditing = (certificate, index) => {
//     setFormData({
//       title:
//         certificate.title || certificate.name || certificate.certificate || "",
//       issuer:
//         certificate.issuer ||
//         certificate.organization ||
//         certificate.institution ||
//         "",
//       issuedOn:
//         certificate.year ||
//         certificate.date ||
//         certificate.issueDate ||
//         certificate.issuedOn ||
//         "",
//       level:
//         certificate.level || certificate.category || certificate.type || "",
//       description: certificate.description || "",
//       credentialId: certificate.credentialId || certificate.credential_id || "",
//       link:
//         certificate.link ||
//         certificate.url ||
//         certificate.certificateUrl ||
//         certificate.credentialUrl ||
//         certificate.viewUrl ||
//         "",
//       document: null,
//       documentLink:
//         certificate.documentLink ||
//         certificate.document_url ||
//         certificate.documentUrl ||
//         "",
//       document_url:
//         certificate.document_url ||
//         certificate.documentUrl ||
//         certificate.documentLink ||
//         "",
//     });
//     setEditingIndex(index);
//     setIsAdding(true);
//   };

//   const saveCertificate = () => {
//     // 1️⃣ Validation
//     if (!formData.title.trim()) {
//       toast({
//         title: "Missing title",
//         description: "Please provide a certificate title before saving.",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!formData.issuer.trim()) {
//       toast({
//         title: "Missing issuer",
//         description:
//           "Please provide the issuing organization for this certificate.",
//         variant: "destructive",
//       });
//       return;
//     }

//     // 2️⃣ Clean up whitespace in all string fields
//     const formatted = Object.fromEntries(
//       Object.entries(formData).map(([key, value]) => [
//         key,
//         typeof value === "string" ? value.trim() : value,
//       ])
//     );

//     const documentUrlInput = formatted.documentLink || formatted.document_url || "";

//     // 3️⃣ Update existing certificate
//     if (editingIndex !== null) {
//       setCertificates((prev) =>
//         prev.map((cert, idx) => {
//           if (idx !== editingIndex) {
//             return cert;
//           }
//           const resolvedDocumentUrl = documentUrlInput;
//           return {
//             ...(cert || {}),
//             ...formatted,
//             document_url: resolvedDocumentUrl || null,
//             documentLink: resolvedDocumentUrl,
//             enabled: cert?.enabled === false ? false : true,

//             // 🔁 Re-verification reset logic:
//             verified: false,
//             verifiedAt: null,
//             processing: true,
//             status: "pending",

//             // ⏱ Update timestamp
//             updatedAt: new Date().toISOString(),
//           };
//         })
//       );

//       toast({
//         title: "Certificate Updated",
//         description:
//           "Changes detected — verification will be reprocessed by the system.",
//       });
//     }

//     // 4️⃣ Add new certificate
//     else {
//       const resolvedDocumentUrl = documentUrlInput;
//       setCertificates((prev) => [
//         ...prev,
//         {
//           ...formatted,
//           document_url: resolvedDocumentUrl || null,
//           documentLink: resolvedDocumentUrl,
//           id: Date.now(),
//           enabled: true,
//           status: "pending",
//           verified: false,
//           verifiedAt: null,
//           processing: true,
//           createdAt: new Date().toISOString(),
//           updatedAt: new Date().toISOString(),
//         },
//       ]);

//       toast({
//         title: "Certificate Added",
//         description:
//           "Your certificate details are being processed for verification.",
//       });
//     }

//     // 5️⃣ Reset UI state
//     setIsAdding(false);
//     resetForm();
//   };

//   const toggleCertificate = (index) => {
//     setCertificates((prev) =>
//       prev.map((cert, idx) =>
//         idx === index
//           ? { ...cert, enabled: cert.enabled === false ? true : false }
//           : cert
//       )
//     );
//   };

//   const deleteCertificate = (index) => {
//     setCertificates((prev) => prev.filter((_, idx) => idx !== index));
//   };

//   const handleSubmit = async () => {
//     try {
//       await onSave(certificates);
//       onClose();
//     } catch (error) {
//       console.error('Error saving certificates:', error);
//       toast({
//         title: "Error",
//         description: "Failed to save certificate details. Please try again.",
//         variant: "destructive",
//       });
//     }
//   };

//   return (
//     <Dialog
//       open={isOpen}
//       onOpenChange={() => {
//         onClose();
//         setIsAdding(false);
//         resetForm();
//       }}
//     >
//       <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             <Edit3 className="w-5 h-5" />
//             Manage Certificates
//           </DialogTitle>
//         </DialogHeader>
//         <div className="space-y-4">
//           {certificates.map((cert, index) => (
//             <div
//               key={cert.id || index}
//               className={`p-4 border rounded-lg ${
//                 cert.enabled === false ? "opacity-50" : "opacity-100"
//               }`}
//             >
//               <div className="flex justify-between items-start gap-3">
//                 <div className="flex-1 space-y-1">
//                   <div className="flex items-center gap-2">
//                     <h4 className="font-semibold">
//                       {cert.title || cert.name || "Certificate"}
//                     </h4>
//                     {cert.processing && (
//                       <Badge className="bg-orange-100 text-orange-700">
//                         <Clock className="w-3 h-3 mr-1" />
//                         Processing
//                       </Badge>
//                     )}
//                   </div>
//                   {(cert.issuer || cert.organization || cert.institution) && (
//                     <p
//                       className="text-sm font-medium"
//                     >
//                       {cert.issuer || cert.organization || cert.institution}
//                     </p>
//                   )}
//                   {(cert.year ||
//                     cert.date ||
//                     cert.issueDate ||
//                     cert.issuedOn) && (
//                     <p className="text-xs">
//                       {cert.year ||
//                         cert.date ||
//                         cert.issueDate ||
//                         cert.issuedOn}
//                     </p>
//                   )}
//                   {cert.description && (
//                     <p className="text-sm text-gray-600 leading-relaxed">
//                       {cert.description}
//                     </p>
//                   )}
//                   {cert.level && (
//                     <span className="inline-flex px-2 py-1 rounded bg-amber-50 text-amber-700 text-xs font-medium">
//                       {cert.level}
//                     </span>
//                   )}
//                   {cert.credentialId && (
//                     <p className="text-xs text-gray-500 font-medium">
//                       Credential ID: {cert.credentialId}
//                     </p>
//                   )}
//                   {(cert.link || cert.document_url) && (
//                     <div className="flex flex-wrap gap-2 pt-2">
//                       {cert.link && (
//                         <Button
//                           asChild
//                           variant="outline"
//                           size="sm"
//                           className="text-blue-600 border-blue-200 hover:bg-blue-50"
//                         >
//                           <a
//                             href={cert.link}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="inline-flex items-center"
//                           >
//                             <LinkIcon className="w-4 h-4 mr-1" />
//                             View Credential
//                           </a>
//                         </Button>
//                       )}
//                       {cert.document_url && (
//                         <Button
//                           asChild
//                           variant="outline"
//                           size="sm"
//                           className="text-green-600 border-green-200 hover:bg-green-50"
//                         >
//                           <a
//                             href={cert.document_url}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="inline-flex items-center"
//                           >
//                             <FileText className="w-4 h-4 mr-1" />
//                             View Document
//                           </a>
//                         </Button>
//                       )}
//                     </div>
//                   )}
//                 </div>
//                 <div className="flex flex-col gap-2">
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => startEditing(cert, index)}
//                     className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
//                   >
//                     <Edit3 className="w-4 h-4 mr-1" />
//                     Edit
//                   </Button>
//                   <Button
//                     variant={cert.enabled === false ? "outline" : "default"}
//                     size="sm"
//                     onClick={() => toggleCertificate(index)}
//                     className={
//                       cert.enabled === false
//                         ? "text-gray-500 border-gray-400"
//                         : "bg-emerald-500 text-white"
//                     }
//                   >
//                     {cert.enabled === undefined || cert.enabled
//                       ? "Disable"
//                       : "Enable"}
//                   </Button>
//                   <Button
//                     variant="destructive"
//                     size="sm"
//                     onClick={() => deleteCertificate(index)}
//                   >
//                     <Trash2 className="w-4 h-4 mr-1" />
//                     Delete
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           ))}

//           {isAdding ? (
//             <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="certificate-title">Certificate Title *</Label>
//                   <Input
//                     id="certificate-title"
//                     value={formData.title}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         title: e.target.value,
//                       }))
//                     }
//                     placeholder="e.g., AWS Certified Solutions Architect"
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="certificate-issuer">
//                     Issuing Organization *
//                   </Label>
//                   <Input
//                     id="certificate-issuer"
//                     value={formData.issuer}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         issuer: e.target.value,
//                       }))
//                     }
//                     placeholder="e.g., Amazon Web Services"
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="certificate-issued">Issued On / Year</Label>
//                   <Input
//                     id="certificate-issued"
//                     value={formData.issuedOn}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         issuedOn: e.target.value,
//                       }))
//                     }
//                     placeholder="e.g., Apr 2024"
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="certificate-level">Level / Category</Label>
//                   <Input
//                     id="certificate-level"
//                     value={formData.level}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         level: e.target.value,
//                       }))
//                     }
//                     placeholder="e.g., Professional"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <Label htmlFor="certificate-description">Description</Label>
//                 <Textarea
//                   id="certificate-description"
//                   value={formData.description}
//                   onChange={(e) =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       description: e.target.value,
//                     }))
//                   }
//                   placeholder="Summary, achievements, or key highlights."
//                 />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="certificate-credential">Credential ID</Label>
//                   <Input
//                     id="certificate-credential"
//                     value={formData.credentialId}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         credentialId: e.target.value,
//                       }))
//                     }
//                     placeholder="e.g., ABCD-1234"
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="certificate-link">Credential Link</Label>
//                   <Input
//                     id="certificate-link"
//                     value={formData.link}
//                     onChange={(e) =>
//                       setFormData((prev) => ({ ...prev, link: e.target.value }))
//                     }
//                     placeholder="https://"
//                   />
//                 </div>
//               </div>

//               <div className="space-y-6">
//                 <div className="flex items-center gap-2 pt-2">
//                   <FileText className="w-5 h-5 text-gray-700" />
//                   <Label className="text-base font-semibold text-gray-800">
//                     Certification Evidence
//                     <span className="text-gray-500 font-normal text-sm ml-1">
//                       (Optional)
//                     </span>
//                   </Label>
//                 </div>

//                 <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 hover:bg-gray-100 transition-colors">
//                   <div className="flex items-center gap-2 mb-3">
//                     <FileText className="w-4 h-4 text-blue-600" />
//                     <Label className="text-sm font-medium text-gray-800">
//                       Certification Document
//                     </Label>
//                   </div>

//                   <AnimatePresence mode="wait">
//                     {formData.document ? (
//                       <motion.div
//                         key="file"
//                         initial={{ opacity: 0, y: -8 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         exit={{ opacity: 0, y: 8 }}
//                         className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-blue-200 bg-blue-50 rounded-lg px-4 py-3 gap-3"
//                       >
//                         <div
//                           className="flex items-center gap-2 text-sm text-blue-700 max-w-full overflow-hidden"
//                           title={formData.document.name}
//                         >
//                           <FileText className="w-4 h-4 flex-shrink-0" />
//                           <span className="truncate max-w-[220px] sm:max-w-[300px] md:max-w-[400px]">
//                             {formData.document.name}
//                           </span>
//                         </div>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           className="text-red-500 hover:text-red-700 self-end sm:self-center"
//                           onClick={() =>
//                             setFormData((prev) => ({
//                               ...prev,
//                               document: null,
//                               documentLink: "",
//                               document_url: "",
//                             }))
//                           }
//                         >
//                           <X className="w-4 h-4" /> Remove
//                         </Button>
//                       </motion.div>
//                     ) : (
//                       <motion.div
//                         key="upload"
//                         initial={{ opacity: 0, y: -8 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         exit={{ opacity: 0, y: 8 }}
//                         className="flex flex-col md:flex-row items-center gap-3"
//                       >
//                         <label
//                           htmlFor="certificate-document"
//                           className="flex items-center justify-center w-full md:w-1/2 border border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-600 cursor-pointer hover:border-blue-400 transition"
//                         >
//                           <Upload className="w-4 h-4 mr-2 text-blue-600" />
//                           Upload file
//                           <input
//                             id="certificate-document"
//                             type="file"
//                             accept=".pdf,.jpg,.jpeg,.png"
//                             className="hidden"
//                             onChange={(e) =>
//                               setFormData((prev) => ({
//                                 ...prev,
//                                 document: e.target.files?.[0] || null,
//                                 documentLink: "",
//                                 document_url: "",
//                               }))
//                             }
//                           />
//                         </label>

//                         <span className="text-xs text-gray-400 text-center md:w-auto w-full">
//                           or
//                         </span>

//                         <div className="relative w-full md:w-1/2">
//                           <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
//                           <Input
//                             id="certificate-document-link"
//                             type="url"
//                             placeholder="Paste document link..."
//                             value={formData.documentLink}
//                             className="pl-8 text-sm border-gray-300 focus:ring-1 focus:ring-blue-300"
//                             onChange={(e) => {
//                               const value = e.target.value;
//                               setFormData((prev) => ({
//                                 ...prev,
//                                 documentLink: value,
//                                 document_url: value,
//                               }));
//                             }}
//                           />
//                         </div>
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </div>
//               </div>

//               <div className="flex gap-2">
//                 <Button
//                   onClick={saveCertificate}
//                   className="bg-blue-400 hover:bg-blue-500 text-white"
//                 >
//                   {editingIndex !== null
//                     ? "Update Certificate"
//                     : "Add Certificate"}
//                 </Button>
//                 <Button
//                   variant="outline"
//                   onClick={() => {
//                     setIsAdding(false);
//                     resetForm();
//                   }}
//                 >
//                   Cancel
//                 </Button>
//               </div>
//             </div>
//           ) : (
//             <Button
//               onClick={() => setIsAdding(true)}
//               variant="outline"
//               className="w-full border-dashed"
//             >
//               <Plus className="w-4 h-4 mr-2" />
//               Add New Certificate
//             </Button>
//           )}

//           <div className="flex justify-end gap-2">
//             <Button
//               variant="outline"
//               onClick={() => {
//                 onClose();
//                 setIsAdding(false);
//                 resetForm();
//               }}
//             >
//               Cancel
//             </Button>
//             <Button
//               onClick={handleSubmit}
//               className="bg-blue-400 hover:bg-blue-500"
//             >
//               Save All Changes
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export const SkillsEditModal = ({
//   isOpen,
//   onClose,
//   data,
//   onSave,
//   title,
//   type,
// }) => {
//   const [skills, setSkills] = useState(data || []);
//   const [newSkill, setNewSkill] = useState({ name: "", level: 1 });
//   const [isAdding, setIsAdding] = useState(false);
//   const { toast } = useToast();

//   // Update internal state when data prop changes (Supabase data updates)
//   useEffect(() => {
//     setSkills(data || []);
//   }, [data]);

//   const addSkill = () => {
//     if (newSkill.name.trim()) {
//       setSkills([
//         ...skills,
//         { ...newSkill, id: Date.now(), verified: false, processing: true },
//       ]);
//       setNewSkill({ name: "", level: 1 });
//       setIsAdding(false);
//     }
//   };

//   const deleteSkill = (id) => {
//     setSkills(skills.filter((skill) => skill.id !== id));
//   };

//   const updateSkillLevel = (id, level) => {
//     setSkills(
//       skills.map((skill) => (skill.id === id ? { ...skill, level } : skill))
//     );
//   };

//   const updateNewSkillLevel = (level) => {
//     setNewSkill((prev) => ({ ...prev, level }));
//   };

//   const handleSubmit = async () => {
//     try {
//       await onSave(skills);
//       toast({
//         title: `${title} Updated`,
//         description: "Your skills are being processed for verification.",
//       });
//       onClose();
//     } catch (error) {
//       console.error('Error saving skills:', error);
//       toast({
//         title: "Error",
//         description: "Failed to save skills. Please try again.",
//         variant: "destructive",
//       });
//     }
//   };

//   const renderStars = (
//     level,
//     skillId,
//     editable = false,
//     isNewSkill = false
//   ) => {
//     return [...Array(5)].map((_, i) => (
//       <button
//         key={i}
//         type="button"
//         disabled={!editable}
//         onClick={() => {
//           if (editable) {
//             if (isNewSkill) {
//               updateNewSkillLevel(i + 1);
//             } else {
//               updateSkillLevel(skillId, i + 1);
//             }
//           }
//         }}
//         className={`w-4 h-4 ${i < level ? "text-[#FFD700]" : "text-gray-300"} ${
//           editable ? "hover:text-[#FFD700] cursor-pointer" : ""
//         }`}
//       >
//         ★
//       </button>
//     ));
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             <Edit3 className="w-5 h-5" />
//             Edit {title}
//           </DialogTitle>
//         </DialogHeader>
//         <div className="space-y-4">
//           {skills.map((skill, index) => (
//             <div
//               key={skill.id || index}
//               className={`p-4 border rounded-lg ${
//                 skill.enabled === false ? "opacity-50" : "opacity-100"
//               }`}
//             >
//               <div className="flex justify-between items-start">
//                 <div className="flex-1">
//                   <div className="flex items-center gap-3 mb-2">
//                     <span className="font-medium">
//                       {skill.name}
//                     </span>
//                     {skill.processing ? (
//                       <Badge className="bg-orange-100 text-orange-800">
//                         <Clock className="w-3 h-3 mr-1" />
//                         Processing
//                       </Badge>
//                     ) : (
//                       skill.verified && (
//                         <Badge className="bg-[#28A745] hover:bg-[#28A745]">
//                           <CheckCircle className="w-3 h-3 mr-1" />
//                           Verified
//                         </Badge>
//                       )
//                     )}
//                   </div>
//                   <div className="flex items-center gap-1">
//                     {renderStars(skill.level, skill.id || index, true)}
//                   </div>
//                 </div>
//                 <Button
//                   variant={skill.enabled === false ? "outline" : "default"}
//                   size="sm"
//                   onClick={() =>
//                     setSkills(
//                       skills.map((s, i) =>
//                         (s.id !== undefined ? s.id : i) ===
//                         (skill.id !== undefined ? skill.id : index)
//                           ? {
//                               ...s,
//                               enabled: s.enabled === false ? true : false,
//                             }
//                           : s
//                       )
//                     )
//                   }
//                   className={
//                     skill.enabled === false
//                       ? "text-gray-500 border-gray-400"
//                       : "bg-emerald-500 text-white"
//                   }
//                 >
//                   {skill.enabled === undefined || skill.enabled
//                     ? "Disable"
//                     : "Enable"}
//                 </Button>
//               </div>
//             </div>
//           ))}

//           {isAdding ? (
//             <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg space-y-3">
//               <Input
//                 placeholder={`${type} name`}
//                 value={newSkill.name}
//                 onChange={(e) =>
//                   setNewSkill((prev) => ({ ...prev, name: e.target.value }))
//                 }
//               />
//               <div className="flex items-center gap-2">
//                 <Label>Level:</Label>
//                 <div className="flex gap-1">
//                   {renderStars(newSkill.level, "new", true, true)}
//                 </div>
//               </div>
//               <div className="flex gap-2">
//                 <Button
//                   onClick={addSkill}
//                   size="sm"
//                   className="bg-blue-400 hover:bg-blue-500"
//                 >
//                   Add {type}
//                 </Button>
//                 <Button
//                   onClick={() => setIsAdding(false)}
//                   variant="outline"
//                   size="sm"
//                 >
//                   Cancel
//                 </Button>
//               </div>
//             </div>
//           ) : (
//             <Button
//               onClick={() => setIsAdding(true)}
//               variant="outline"
//               className="w-full border-dashed"
//             >
//               <Plus className="w-4 h-4 mr-2" />
//               Add New {type}
//             </Button>
//           )}

//           <div className="flex justify-end gap-2">
//             <Button variant="outline" onClick={onClose}>
//               Cancel
//             </Button>
//             <Button
//               onClick={handleSubmit}
//               className="bg-blue-400 hover:bg-blue-500"
//             >
//               Save Changes
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// // Personal Information Edit Modal
// export const PersonalInfoEditModal = ({ isOpen, onClose, data, onSave }) => {
//   const [formData, setFormData] = useState({
//     name: "",
//     age: "",
//     email: "",
//     contact_number: "",
//     alternate_number: "",
//     contact_number_dial_code: "91",
//     date_of_birth: "",
//     district_name: "",
//     university: "",
//     college_school_name: "",
//     branch_field: "",
//     registration_number: "",
//     nm_id: "",
//     github_link: "",
//     portfolio_link: "",
//     linkedin_link: "",
//     twitter_link: "",
//     instagram_link: "",
//     facebook_link: "",
//     other_social_links: [],
//   });
//   const [isSaving, setIsSaving] = useState(false);
//   const { toast } = useToast();

//   // Initialize form data when modal opens
//   useEffect(() => {
//     if (data && isOpen) {
//       // Extract contact number from formatted phone string if needed
//       const extractNumber = (formattedPhone) => {
//         if (!formattedPhone) return "";
//         // Remove +XX prefix and spaces
//         return formattedPhone.replace(/^\+\d+\s*/, "").trim();
//       };

//       // Handle both raw data and transformed data structures
//       const getName = () => data.name || "";
//       const getAge = () => data.age || "";
//       const getEmail = () => data.email || "";
//       const getContactNumber = () => {
//         // Try in order: contact_number (raw), phone (transformed)
//         if (data.contact_number) return String(data.contact_number);
//         if (data.phone) return extractNumber(data.phone);
//         return "";
//       };
//       const getAlternateNumber = () => {
//         // Try in order: alternate_number (raw), alternatePhone (transformed)
//         if (data.alternate_number) return String(data.alternate_number);
//         if (data.alternatePhone) return extractNumber(data.alternatePhone);
//         return "";
//       };
//       const getDialCode = () => data.contact_number_dial_code || "91";
//       const getDateOfBirth = () => {
//         const dob = data.dateOfBirth || data.date_of_birth || "";
//         return dob === "-" ? "" : dob;
//       };
//       const getDistrict = () => data.district || data.district_name || "";
//       const getUniversity = () => data.university || "";
//       const getCollege = () => data.college || data.college_school_name || "";
//       const getBranch = () => data.department || data.branch_field || "";
//       const getRegistration = () => {
//         const reg = data.registrationNumber || data.registration_number || "";
//         return String(reg);
//       };
//       const getNmId = () => {
//         const nmId = data.nm_id || "";
//         return nmId;
//       };

//       const getGithubLink = () => data.github_link || data.githubLink || "";
//       const getPortfolioLink = () =>
//         data.portfolio_link || data.portfolioLink || "";
//       const getLinkedinLink = () =>
//         data.linkedin_link || data.linkedinLink || "";
//       const getTwitterLink = () => data.twitter_link || data.twitterLink || "";
//       const getInstagramLink = () =>
//         data.instagram_link || data.instagramLink || "";
//       const getFacebookLink = () =>
//         data.facebook_link || data.facebookLink || "";
//       const getOtherSocialLinks = () =>
//         data.other_social_links || data.otherSocialLinks || [];

//       const formValues = {
//         name: getName(),
//         age: getAge(),
//         email: getEmail(),
//         contact_number: getContactNumber(),
//         alternate_number: getAlternateNumber(),
//         contact_number_dial_code: getDialCode(),
//         date_of_birth: getDateOfBirth(),
//         district_name: getDistrict(),
//         university: getUniversity(),
//         college_school_name: getCollege(),
//         branch_field: getBranch(),
//         registration_number: getRegistration(),
//         nm_id: getNmId(),
//         github_link: getGithubLink(),
//         portfolio_link: getPortfolioLink(),
//         linkedin_link: getLinkedinLink(),
//         twitter_link: getTwitterLink(),
//         instagram_link: getInstagramLink(),
//         facebook_link: getFacebookLink(),
//         other_social_links: getOtherSocialLinks(),
//       };

//       setFormData(formValues);
//     }
//   }, [data, isOpen]);

//   const handleSubmit = async () => {
//     if (!formData.name.trim() || !formData.email.trim()) {
//       toast({
//         title: "Error",
//         description: "Please fill in at least name and email fields.",
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsSaving(true);

//     try {
//       await onSave(formData);

//       toast({
//         title: "Success! ✅",
//         description: "Your personal information has been saved and updated.",
//       });

//       // Wait a moment for the refresh to complete before closing
//       setTimeout(() => {
//         onClose();
//       }, 500);
//     } catch (error) {
//       console.error("❌ Error saving personal info:", error);
//       toast({
//         title: "Error",
//         description: "Failed to save personal information. Please try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleInputChange = (field, value) => {
//     setFormData((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="text-xl font-bold flex items-center gap-2">
//             <User className="w-5 h-5 text-blue-600" />
//             Edit Personal Information
//           </DialogTitle>
//         </DialogHeader>

//         <div className="space-y-6">
//           {/* Basic Information */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="name">Full Name *</Label>
//               <Input
//                 id="name"
//                 value={formData.name}
//                 onChange={(e) => handleInputChange("name", e.target.value)}
//                 placeholder="Enter your full name"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="age">Age</Label>
//               <Input
//                 id="age"
//                 type="number"
//                 value={formData.age}
//                 onChange={(e) => handleInputChange("age", e.target.value)}
//                 placeholder="Enter your age"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="email">Email Address *</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 value={formData.email}
//                 onChange={(e) => handleInputChange("email", e.target.value)}
//                 placeholder="Enter your email"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="date_of_birth">Date of Birth</Label>
//               <Input
//                 id="date_of_birth"
//                 value={formData.date_of_birth}
//                 onChange={(e) =>
//                   handleInputChange("date_of_birth", e.target.value)
//                 }
//                 placeholder="DD-MM-YYYY or other format"
//               />
//             </div>
//           </div>

//           {/* Contact Information */}
//           <div className="border-t pt-4">
//             <h3 className="text-lg font-semibold mb-3 text-gray-800">
//               Contact Information
//             </h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="contact_number_dial_code">Country Code</Label>
//                 <Input
//                   id="contact_number_dial_code"
//                   value={formData.contact_number_dial_code}
//                   onChange={(e) =>
//                     handleInputChange(
//                       "contact_number_dial_code",
//                       e.target.value
//                     )
//                   }
//                   placeholder="91"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="contact_number">Primary Contact Number</Label>
//                 <Input
//                   id="contact_number"
//                   type="tel"
//                   value={formData.contact_number}
//                   onChange={(e) =>
//                     handleInputChange("contact_number", e.target.value)
//                   }
//                   placeholder="Enter primary contact number"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="alternate_number">
//                   Alternate Contact Number
//                 </Label>
//                 <Input
//                   id="alternate_number"
//                   type="tel"
//                   value={formData.alternate_number}
//                   onChange={(e) =>
//                     handleInputChange("alternate_number", e.target.value)
//                   }
//                   placeholder="Enter alternate contact number"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Location Information */}
//           <div className="border-t pt-4">
//             <h3 className="text-lg font-semibold mb-3 text-gray-800">
//               Location Information
//             </h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="district_name">District</Label>
//                 <Input
//                   id="district_name"
//                   value={formData.district_name}
//                   onChange={(e) =>
//                     handleInputChange("district_name", e.target.value)
//                   }
//                   placeholder="Enter your district"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Educational Information */}
//           <div className="border-t pt-4">
//             <h3 className="text-lg font-semibold mb-3 text-gray-800">
//               Educational Information
//             </h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="university">University</Label>
//                 <Input
//                   id="university"
//                   value={formData.university}
//                   onChange={(e) =>
//                     handleInputChange("university", e.target.value)
//                   }
//                   placeholder="Enter your university"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="college_school_name">College/School Name</Label>
//                 <Input
//                   id="college_school_name"
//                   value={formData.college_school_name}
//                   onChange={(e) =>
//                     handleInputChange("college_school_name", e.target.value)
//                   }
//                   placeholder="Enter your college or school name"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="branch_field">Branch/Field of Study</Label>
//                 <Input
//                   id="branch_field"
//                   value={formData.branch_field}
//                   onChange={(e) =>
//                     handleInputChange("branch_field", e.target.value)
//                   }
//                   placeholder="Enter your branch or field"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="registration_number">Registration Number</Label>
//                 <Input
//                   id="registration_number"
//                   value={formData.registration_number}
//                   onChange={(e) =>
//                     handleInputChange("registration_number", e.target.value)
//                   }
//                   placeholder="Enter your registration number"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* System Information */}
//           <div className="border-t pt-4">
//             <h3 className="text-lg font-semibold mb-3 text-gray-800">
//               System Information
//             </h3>
//             <div className="grid grid-cols-1 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="nm_id">NM ID (System Generated)</Label>
//                 <Input
//                   id="nm_id"
//                   value={formData.nm_id}
//                   onChange={(e) => handleInputChange("nm_id", e.target.value)}
//                   placeholder="System generated ID"
//                   className="bg-gray-100"
//                   readOnly={!!formData.nm_id}
//                   title={
//                     formData.nm_id
//                       ? "This is a system-generated ID and cannot be modified"
//                       : "This field will be auto-generated by the system"
//                   }
//                 />
//                 {formData.nm_id && (
//                   <p className="text-xs text-gray-500">
//                     ℹ️ This is a system-generated ID and cannot be modified
//                   </p>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Social Media Links */}
//           <div className="border-t pt-4">
//             <h3 className="text-lg font-semibold mb-3 text-gray-800">
//               Social Media & Professional Links
//             </h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="github_link">GitHub Profile</Label>
//                 <Input
//                   id="github_link"
//                   type="url"
//                   value={formData.github_link}
//                   onChange={(e) =>
//                     handleInputChange("github_link", e.target.value)
//                   }
//                   placeholder="https://github.com/yourusername"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="portfolio_link">Portfolio Website</Label>
//                 <Input
//                   id="portfolio_link"
//                   type="url"
//                   value={formData.portfolio_link}
//                   onChange={(e) =>
//                     handleInputChange("portfolio_link", e.target.value)
//                   }
//                   placeholder="https://yourportfolio.com"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="linkedin_link">LinkedIn Profile</Label>
//                 <Input
//                   id="linkedin_link"
//                   type="url"
//                   value={formData.linkedin_link}
//                   onChange={(e) =>
//                     handleInputChange("linkedin_link", e.target.value)
//                   }
//                   placeholder="https://linkedin.com/in/yourusername"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="twitter_link">Twitter/X Profile</Label>
//                 <Input
//                   id="twitter_link"
//                   type="url"
//                   value={formData.twitter_link}
//                   onChange={(e) =>
//                     handleInputChange("twitter_link", e.target.value)
//                   }
//                   placeholder="https://twitter.com/yourusername"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="instagram_link">Instagram Profile</Label>
//                 <Input
//                   id="instagram_link"
//                   type="url"
//                   value={formData.instagram_link}
//                   onChange={(e) =>
//                     handleInputChange("instagram_link", e.target.value)
//                   }
//                   placeholder="https://instagram.com/yourusername"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="facebook_link">Facebook Profile</Label>
//                 <Input
//                   id="facebook_link"
//                   type="url"
//                   value={formData.facebook_link}
//                   onChange={(e) =>
//                     handleInputChange("facebook_link", e.target.value)
//                   }
//                   placeholder="https://facebook.com/yourusername"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex justify-end gap-2 border-t pt-4">
//             <Button variant="outline" onClick={onClose} disabled={isSaving}>
//               Cancel
//             </Button>
//             <Button
//               onClick={handleSubmit}
//               className="bg-blue-600 hover:bg-blue-700"
//               disabled={isSaving}
//             >
//               {isSaving ? "Saving..." : "Save Personal Information"}
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import {
  Plus,
  Trash2,
  Edit3,
  Clock,
  CheckCircle,
  User,
  PenSquare,
  BookOpen,
  Timer,
  Award,
  Calendar,
  Eye,
  EyeOff,
  Presentation,
  FileText,
  Video,
  Upload,
  Link,
  X,
  CalendarDays,
  LinkIcon,
  Github,
  Building2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

// const VersionStatusBadge = ({ version, type }) => {
//   if (!version) return null;

//   const getStatusConfig = (status) => {
//     switch (status) {
//       case "verified":
//         return {
//           className: "bg-green-100 text-green-700",
//           icon: CheckCircle,
//           label: "Verified",
//         };
//       case "pending":
//         return {
//           className: "bg-orange-100 text-orange-700",
//           icon: Clock,
//           label: "Pending Review",
//         };
//       case "rejected":
//         return {
//           className: "bg-red-100 text-red-700",
//           icon: XCircle,
//           label: "Rejected",
//         };
//       case "changes_requested":
//         return {
//           className: "bg-yellow-100 text-yellow-700",
//           icon: AlertCircle,
//           label: "Changes Requested",
//         };
//       default:
//         return {
//           className: "bg-gray-100 text-gray-700",
//           icon: Clock,
//           label: "Unknown",
//         };
//     }
//   };

//   const config = getStatusConfig(version.status);
//   const Icon = config.icon;

//   return (
//     <div className="flex items-center gap-2">
//       <Badge className={`${config.className} flex items-center gap-1`}>
//         <Icon className="w-3 h-3" />
//         {config.label}
//       </Badge>
//       {version.message && (
//         <span className="text-xs text-gray-500 italic">{version.message}</span>
//       )}
//     </div>
//   );
// };

// // Version history display component
// const VersionHistory = ({ item }) => {
//   if (!item._versions) return null;

//   const { verified, pending, rejected } = item._versions;

//   return (
//     <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
//       <div className="text-xs font-semibold text-gray-600">
//         Version History:
//       </div>

//       {verified && (
//         <div className="flex items-start gap-2">
//           <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
//           <div className="flex-1">
//             <div className="text-xs font-medium text-green-700">
//               Verified Version
//             </div>
//             <div className="text-xs text-gray-600">
//               Verified on {new Date(verified.verified_at).toLocaleDateString()}
//               {verified.verified_by && ` by admin`}
//             </div>
//             {verified.message && (
//               <div className="text-xs text-gray-500 italic mt-1">
//                 "{verified.message}"
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {pending && (
//         <div className="flex items-start gap-2">
//           <Clock className="w-4 h-4 text-orange-600 mt-0.5" />
//           <div className="flex-1">
//             <div className="text-xs font-medium text-orange-700">
//               Pending Version
//             </div>
//             <div className="text-xs text-gray-600">
//               Submitted on{" "}
//               {new Date(
//                 pending.submitted_at || pending.created_at
//               ).toLocaleDateString()}
//             </div>
//             <div className="text-xs text-gray-500 mt-1">
//               Awaiting admin review
//             </div>
//           </div>
//         </div>
//       )}

//       {rejected && (
//         <div className="flex items-start gap-2">
//           <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
//           <div className="flex-1">
//             <div className="text-xs font-medium text-red-700">
//               Rejected Version
//             </div>
//             <div className="text-xs text-gray-600">
//               Rejected on {new Date(rejected.rejected_at).toLocaleDateString()}
//             </div>
//             {rejected.message && (
//               <div className="text-xs text-red-600 italic mt-1">
//                 Reason: "{rejected.message}"
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export const EducationEditModal = ({ isOpen, onClose, data, onSave }) => {
//   const [educationList, setEducationList] = useState(data || []);

//   // Update internal state when data prop changes (Supabase data updates)
//   useEffect(() => {
//     setEducationList(data || []);
//   }, [data]);
//   const [editingItem, setEditingItem] = useState(null);
//   const [isAdding, setIsAdding] = useState(false);
//   const [formData, setFormData] = useState({
//     degree: "",
//     department: "",
//     university: "",
//     yearOfPassing: "",
//     cgpa: "",
//     level: "Bachelor's",
//     status: "ongoing",
//   });
//   const { toast } = useToast();

//   const levelOptions = [
//     "High School",
//     "Associate",
//     "Bachelor's",
//     "Master's",
//     "PhD",
//     "Certificate",
//     "Diploma",
//   ];

//   const statusOptions = ["ongoing", "completed"];

//   const resetForm = () => {
//     setFormData({
//       degree: "",
//       department: "",
//       university: "",
//       yearOfPassing: "",
//       cgpa: "",
//       level: "Bachelor's",
//       status: "ongoing",
//     });
//   };

//   const startEditing = (education) => {
//     setFormData(education);
//     setEditingItem(education.id);
//     setIsAdding(true);
//   };

//   const startAdding = () => {
//     resetForm();
//     setEditingItem(null);
//     setIsAdding(true);
//   };

//   const cancelEdit = () => {
//     setIsAdding(false);
//     setEditingItem(null);
//     resetForm();
//   };

//   const saveEducation = () => {
//     if (!formData.degree.trim() || !formData.university.trim()) {
//       toast({
//         title: "Error",
//         description: "Please fill in at least degree and university fields.",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (editingItem) {
//       // Update existing education
//       setEducationList(
//         educationList.map((edu) =>
//           edu.id === editingItem ? { ...formData, id: editingItem } : edu
//         )
//       );
//     } else {
//       // Add new education
//       const newEducation = {
//         ...formData,
//         id: Date.now(),
//         processing: true,
//       };
//       setEducationList([...educationList, newEducation]);
//     }

//     setIsAdding(false);
//     setEditingItem(null);
//     resetForm();

//     toast({
//       title: "Education Updated",
//       description:
//         "Your education details are being processed for verification.",
//     });
//   };

//   const deleteEducation = (id) => {
//     setEducationList(educationList.filter((edu) => edu.id !== id));
//     if (editingItem === id) {
//       cancelEdit();
//     }
//   };

//   const handleSubmit = async () => {
//     try {
//       await onSave(educationList);
//       onClose();
//     } catch (error) {
//       console.error('Error saving education:', error);
//       toast({
//         title: "Error",
//         description: "Failed to save education details. Please try again.",
//         variant: "destructive",
//       });
//     }
//   };

//   const getLevelColor = (level) => {
//     switch (level) {
//       case "Bachelor's":
//         return "bg-emerald-100 text-emerald-700";
//       case "Master's":
//         return "bg-blue-100 text-blue-700";
//       case "PhD":
//         return "bg-purple-100 text-purple-700";
//       case "Certificate":
//         return "bg-amber-100 text-amber-700";
//       case "High School":
//         return "bg-gray-100 text-gray-700";
//       default:
//         return "bg-gray-100 text-gray-700";
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             <Edit3 className="w-5 h-5" />
//             Manage Education Details
//           </DialogTitle>
//         </DialogHeader>

//         <div className="space-y-4">
//           {/* Existing Education List */}
//           {educationList.map((education) => (
//             <div
//               key={education.id}
//               className={`p-4 border-l-4 rounded-lg ${
//                 education.status === "ongoing"
//                   ? "border-l-blue-500 bg-blue-50"
//                   : education.level === "Bachelor's"
//                   ? "border-l-emerald-500 bg-emerald-50"
//                   : education.level === "Certificate"
//                   ? "border-l-amber-500 bg-amber-50"
//                   : "border-l-gray-500 bg-gray-50"
//               } hover:shadow-md transition-shadow ${
//                 education.enabled === false ? "opacity-50" : "opacity-100"
//               }`}
//             >
//               <div className="flex items-start justify-between">
//                 <div className="flex-1">
//                   <div className="flex items-center gap-2 mb-2">
//                     <h4 className="font-semibold">
//                       {education.degree}
//                     </h4>
//                     <Badge className={getLevelColor(education.level)}>
//                       {education.level}
//                     </Badge>
//                     <Badge
//                       className={
//                         education.status === "ongoing"
//                           ? "bg-blue-500 hover:bg-blue-500 text-white"
//                           : "bg-emerald-500 hover:bg-emerald-500 text-white"
//                       }
//                     >
//                       {education.status}
//                     </Badge>
//                     {education.processing && (
//                       <Badge className="bg-orange-100 text-orange-800">
//                         <Clock className="w-3 h-3 mr-1" />
//                         Processing
//                       </Badge>
//                     )}
//                   </div>
//                   <p
//                     className="text-sm font-medium"
//                   >
//                     {education.university}
//                   </p>
//                   <div className="grid grid-cols-3 gap-2 text-xs mt-2">
//                     <div>
//                       <span>Department:</span>
//                       <p className="font-medium">
//                         {education.department}
//                       </p>
//                     </div>
//                     <div>
//                       <span>Year:</span>
//                       <p className="font-medium">
//                         {education.yearOfPassing}
//                       </p>
//                     </div>
//                     <div>
//                       <span>Grade:</span>
//                       <p className="font-medium">
//                         {education.cgpa}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="flex gap-1 items-center">
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => startEditing(education)}
//                     className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
//                   >
//                     <Edit3 className="w-4 h-4" />
//                   </Button>
//                   <Button
//                     variant={
//                       education.enabled === false ? "outline" : "default"
//                     }
//                     size="sm"
//                     onClick={() =>
//                       setEducationList(
//                         educationList.map((edu) =>
//                           edu.id === education.id
//                             ? {
//                                 ...edu,
//                                 enabled: edu.enabled === false ? true : false,
//                               }
//                             : edu
//                         )
//                       )
//                     }
//                     className={
//                       education.enabled === false
//                         ? "text-gray-500 border-gray-400"
//                         : "bg-emerald-500 text-white"
//                     }
//                   >
//                     {education.enabled === undefined || education.enabled
//                       ? "Disable"
//                       : "Enable"}
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           ))}

//           {/* Add/Edit Form */}
//           {isAdding ? (
//             <div className="p-4 border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg space-y-4">
//               <h4 className="font-semibold text-blue-700">
//                 {editingItem ? "Edit Education" : "Add New Education"}
//               </h4>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="degree">Degree/Qualification *</Label>
//                   <Input
//                     id="degree"
//                     value={formData.degree}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         degree: e.target.value,
//                       }))
//                     }
//                     placeholder="e.g., B.Tech Computer Science"
//                     className="bg-white"
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="university">Institution *</Label>
//                   <Input
//                     id="university"
//                     value={formData.university}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         university: e.target.value,
//                       }))
//                     }
//                     placeholder="e.g., Stanford University"
//                     className="bg-white"
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="department">Department/Field</Label>
//                   <Input
//                     id="department"
//                     value={formData.department}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         department: e.target.value,
//                       }))
//                     }
//                     placeholder="e.g., Computer Science"
//                     className="bg-white"
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="level">Level</Label>
//                   <select
//                     id="level"
//                     value={formData.level}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         level: e.target.value,
//                       }))
//                     }
//                     className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
//                   >
//                     {levelOptions.map((level) => (
//                       <option key={level} value={level}>
//                         {level}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div>
//                   <Label htmlFor="year">Year of Passing</Label>
//                   <Input
//                     id="year"
//                     value={formData.yearOfPassing}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         yearOfPassing: e.target.value,
//                       }))
//                     }
//                     placeholder="2025"
//                     className="bg-white"
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="cgpa">Grade/CGPA</Label>
//                   <Input
//                     id="cgpa"
//                     value={formData.cgpa}
//                     onChange={(e) =>
//                       setFormData((prev) => ({ ...prev, cgpa: e.target.value }))
//                     }
//                     placeholder="8.9/10.0 or A+"
//                     className="bg-white"
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="status">Status</Label>
//                   <select
//                     id="status"
//                     value={formData.status}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         status: e.target.value,
//                       }))
//                     }
//                     className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
//                   >
//                     {statusOptions.map((status) => (
//                       <option key={status} value={status}>
//                         {status.charAt(0).toUpperCase() + status.slice(1)}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               <div className="flex gap-2">
//                 <Button
//                   onClick={saveEducation}
//                   className="bg-blue-400 hover:bg-blue-500 text-white"
//                 >
//                   {editingItem ? "Update" : "Add"} Education
//                 </Button>
//                 <Button onClick={cancelEdit} variant="outline">
//                   Cancel
//                 </Button>
//               </div>
//             </div>
//           ) : (
//             <Button
//               onClick={startAdding}
//               variant="outline"
//               className="w-full border-dashed bg-blue-400 hover:bg-blue-50"
//             >
//               <Plus className="w-4 h-4 mr-2" />
//               Add New Education
//             </Button>
//           )}

//           <div className="flex justify-end gap-2 pt-4 border-t">
//             <Button variant="outline" onClick={onClose}>
//               Cancel
//             </Button>
//             <Button
//               onClick={handleSubmit}
//               className="bg-blue-400 hover:bg-blue-500 text-white"
//             >
//               Save All Changes
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

export const EducationEditModal = ({ isOpen, onClose, data, onSave }) => {
  const [educationList, setEducationList] = useState(data || []);

  // Update internal state when data prop changes (Supabase data updates)
  useEffect(() => {
    setEducationList(data || []);
  }, [data]);
  
  const [editingItem, setEditingItem] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    degree: "",
    department: "",
    university: "",
    yearOfPassing: "",
    cgpa: "",
    level: "Bachelor's",
    status: "ongoing",
  });
  const { toast } = useToast();

  const levelOptions = [
    "High School",
    "Associate",
    "Bachelor's",
    "Master's",
    "PhD",
    "Certificate",
    "Diploma",
  ];

  const statusOptions = ["ongoing", "completed"];

  // ✅ ADD UUID Generator
  const generateUuid = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    return template.replace(/[xy]/g, (char) => {
      const random = (Math.random() * 16) | 0;
      const value = char === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  };

  const resetForm = () => {
    setFormData({
      degree: "",
      department: "",
      university: "",
      yearOfPassing: "",
      cgpa: "",
      level: "Bachelor's",
      status: "ongoing",
    });
  };

  const startEditing = (education) => {
    setFormData({
      degree: education.degree || "",
      department: education.department || "",
      university: education.university || "",
      yearOfPassing: education.yearOfPassing || "",
      cgpa: education.cgpa || "",
      level: education.level || "Bachelor's",
      status: education.status || "ongoing",
    });
    setEditingItem(education.id);
    setIsAdding(true);
  };

  const startAdding = () => {
    resetForm();
    setEditingItem(null);
    setIsAdding(true);
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingItem(null);
    resetForm();
  };

  const saveEducation = () => {
    if (!formData.degree.trim() || !formData.university.trim()) {
      toast({
        title: "Error",
        description: "Please fill in at least degree and university fields.",
        variant: "destructive",
      });
      return;
    }

    if (editingItem) {
      // Update existing education
      setEducationList(
        educationList.map((edu) =>
          edu.id === editingItem 
            ? { 
                ...edu, // ✅ Preserve existing fields like approval_status, verified
                ...formData, 
                id: editingItem,
                processing: true, // ✅ Mark as processing
              } 
            : edu
        )
      );
      toast({
        title: "Education Updated",
        description: "Your changes will be processed for verification.",
      });
    } else {
      // ✅ Add new education with UUID
      const newEducation = {
        ...formData,
        id: generateUuid(), // ✅ Generate UUID instead of Date.now()
        processing: true,
        verified: false,
        enabled: true,
        approval_status: 'pending', // ✅ Add approval_status
      };
      setEducationList([...educationList, newEducation]);

      console.log("New Education:", newEducation);
      toast({
        title: "Education Added",
        description: "Your education details are being processed for verification.",
      });
    }

    setIsAdding(false);
    setEditingItem(null);
    resetForm();
  };

  const deleteEducation = (id) => {
    setEducationList(educationList.filter((edu) => edu.id !== id));
    if (editingItem === id) {
      cancelEdit();
    }
    toast({
      title: "Education Removed",
      description: "The education record has been removed.",
    });
  };

  const handleSubmit = async () => {
    try {
      // ✅ This will call updateEducationByEmail in parent
      await onSave(educationList);
      toast({
        title: "Education Saved",
        description: "Your education details have been saved successfully.",
      });
      onClose();
    } catch (error) {
      console.error('Error saving education:', error);
      toast({
        title: "Error",
        description: "Failed to save education details. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case "Bachelor's":
        return "bg-emerald-100 text-emerald-700";
      case "Master's":
        return "bg-blue-100 text-blue-700";
      case "PhD":
        return "bg-purple-100 text-purple-700";
      case "Certificate":
        return "bg-amber-100 text-amber-700";
      case "High School":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Manage Education Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing Education List */}
          {educationList.map((education) => (
            <div
              key={education.id}
              className={`p-4 border-l-4 rounded-lg ${
                education.status === "ongoing"
                  ? "border-l-blue-500 bg-blue-50"
                  : education.level === "Bachelor's"
                  ? "border-l-emerald-500 bg-emerald-50"
                  : education.level === "Certificate"
                  ? "border-l-amber-500 bg-amber-50"
                  : "border-l-gray-500 bg-gray-50"
              } hover:shadow-md transition-shadow ${
                education.enabled === false ? "opacity-50" : "opacity-100"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">
                      {education.degree}
                    </h4>
                    <Badge className={getLevelColor(education.level)}>
                      {education.level}
                    </Badge>
                    <Badge
                      className={
                        education.status === "ongoing"
                          ? "bg-blue-500 hover:bg-blue-500 text-white"
                          : "bg-emerald-500 hover:bg-emerald-500 text-white"
                      }
                    >
                      {education.status}
                    </Badge>
                    {education.processing && (
                      <Badge className="bg-orange-100 text-orange-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Processing
                      </Badge>
                    )}
                    {/* ✅ ADD verified badge */}
                    {education.verified && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium">
                    {education.university}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                    <div>
                      <span className="text-gray-600">Department:</span>
                      <p className="font-medium">
                        {education.department || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Year:</span>
                      <p className="font-medium">
                        {education.yearOfPassing || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Grade:</span>
                      <p className="font-medium">
                        {education.cgpa || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 items-center shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing(education)}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  {/* ✅ ADD delete button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteEducation(education.id)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={
                      education.enabled === false ? "outline" : "default"
                    }
                    size="sm"
                    onClick={() =>
                      setEducationList(
                        educationList.map((edu) =>
                          edu.id === education.id
                            ? {
                                ...edu,
                                enabled: edu.enabled === false ? true : false,
                              }
                            : edu
                        )
                      )
                    }
                    className={
                      education.enabled === false
                        ? "text-gray-500 border-gray-400"
                        : "bg-emerald-500 hover:bg-emerald-600 text-white"
                    }
                  >
                    {education.enabled === undefined || education.enabled
                      ? <Eye className="w-4 h-4" />
                      : <EyeOff className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Add/Edit Form */}
          {isAdding ? (
            <div className="p-4 border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg space-y-4">
              <h4 className="font-semibold text-blue-700">
                {editingItem ? "Edit Education" : "Add New Education"}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="degree">Degree/Qualification *</Label>
                  <Input
                    id="degree"
                    value={formData.degree}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        degree: e.target.value,
                      }))
                    }
                    placeholder="e.g., B.Tech Computer Science"
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="university">Institution *</Label>
                  <Input
                    id="university"
                    value={formData.university}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        university: e.target.value,
                      }))
                    }
                    placeholder="e.g., Stanford University"
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department/Field</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        department: e.target.value,
                      }))
                    }
                    placeholder="e.g., Computer Science"
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="level">Level</Label>
                  <select
                    id="level"
                    value={formData.level}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        level: e.target.value,
                      }))
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {levelOptions.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="year">Year of Passing</Label>
                  <Input
                    id="year"
                    value={formData.yearOfPassing}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        yearOfPassing: e.target.value,
                      }))
                    }
                    placeholder="2025"
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="cgpa">Grade/CGPA</Label>
                  <Input
                    id="cgpa"
                    value={formData.cgpa}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, cgpa: e.target.value }))
                    }
                    placeholder="8.9/10.0 or A+"
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={saveEducation}
                  className="bg-blue-400 hover:bg-blue-500 text-white"
                >
                  {editingItem ? "Update" : "Add"} Education
                </Button>
                <Button onClick={cancelEdit} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={startAdding}
              variant="outline"
              className="w-full border-dashed bg-blue-50 text-blue-600 hover:bg-blue-100"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Education
            </Button>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-blue-400 hover:bg-blue-500 text-white"
            >
              Save All Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const TrainingEditModal = ({ isOpen, onClose, data, onSave }) => {
  const emptyCourse = {
    course: "",
    provider: "",
    startDate: "",
    endDate: "",
    status: "ongoing",
    completedModules: "",
    totalModules: "",
    hoursSpent: "",
    skills: "",
    certificateUrl: "",
    description: "",
  };

  const statusOptions = ["ongoing", "completed"];

  const [courses, setCourses] = useState([]);
  const [formCourse, setFormCourse] = useState(emptyCourse);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const { toast } = useToast();

  // Helper function to clamp progress between 0-100
  const clampProgress = (value) => {
    const num = Number(value);
    if (Number.isNaN(num)) return 0;
    return Math.max(0, Math.min(100, Math.round(num)));
  };

  // Helper function to parse positive numbers
  const parsePositiveNumber = (value) => {
    const num = Number(value);
    if (Number.isNaN(num) || num < 0) return 0;
    return Math.round(num);
  };

  const normalizeStatusValue = (value) => {
    const normalized = (value || "ongoing").toLowerCase();
    if (normalized === "completed") return "completed";
    return "ongoing";
  };

  // Calculate progress based on completed/total modules
  const calculateProgress = (completedModules, totalModules) => {
    if (!totalModules || totalModules === 0) return 0;
    const completed = Math.min(completedModules, totalModules);
    return clampProgress((completed / totalModules) * 100);
  };

  const toDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  };

  const formatDateLabel = (value) => {
    const date = toDate(value);
    if (!date) return "";
    return date.toLocaleDateString();
  };

  const describeDuration = (startDate, endDate, status) => {
    const start = toDate(startDate);
    if (!start) return "";
    const statusValue = (status || "ongoing").toLowerCase();
    const end = toDate(endDate);
    const effectiveEnd =
      end || (statusValue === "completed" ? start : new Date());
    let diff = effectiveEnd.getTime() - start.getTime();
    if (diff < 0) diff = 0;

    const dayMs = 86_400_000;
    let days = Math.floor(diff / dayMs);
    if (days < 1) days = 1;
    const months = Math.floor(days / 30);
    const weeks = Math.floor((days % 30) / 7);
    const remainingDays = days % 7;

    const parts = [];
    if (months) {
      parts.push(`${months} month${months !== 1 ? "s" : ""}`);
    } else if (weeks) {
      parts.push(`${weeks} week${weeks !== 1 ? "s" : ""}`);
    } else if (remainingDays) {
      parts.push(`${remainingDays} day${remainingDays !== 1 ? "s" : ""}`);
    } else {
      parts.push("Less than a day");
    }

    if (!end && statusValue !== "completed") {
      return `${parts.join(" ")} so far`;
    }
    return parts.join(" ");
  };

  const buildTimelineLabel = (startDate, endDate, status) => {
    const startLabel = formatDateLabel(startDate);
    if (!startLabel) return "";
    const statusValue = (status || "ongoing").toLowerCase();
    const endLabel =
      formatDateLabel(endDate) ||
      (statusValue === "completed" ? startLabel : "Present");
    const durationText = describeDuration(startDate, endDate, statusValue);
    return durationText
      ? `${startLabel} - ${endLabel} (${durationText})`
      : `${startLabel} - ${endLabel}`;
  };

  // Parse skills from string or array
  const parseSkills = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value.trim()) {
      return value
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);
    }
    return [];
  };

  // Normalize course data structure
  const normalizeCourse = (course = {}) => {
    // Parse skills
    const skillsArray = parseSkills(course.skills);

    const completedModules = parsePositiveNumber(course.completedModules);
    const totalModules = parsePositiveNumber(course.totalModules);
    const hoursSpent = parsePositiveNumber(course.hoursSpent);

    // ✅ HANDLE EDGE CASE: Cap completed modules at total modules
  const validatedCompleted = totalModules > 0 
    ? Math.min(completedModules, totalModules) 
    : completedModules; 

    let statusLower;
  if (totalModules > 0 && completedModules >= totalModules) {
    // If all modules completed, force status to "completed"
    statusLower = "completed";
  } else if (totalModules > 0 && completedModules < totalModules) {
    // If modules incomplete, force status to "ongoing"
    statusLower = "ongoing";
  } else {
    // If no module tracking, use provided status
    statusLower = normalizeStatusValue(course.status);
  }
    let progressValue = 0;

    if (statusLower === "completed") {
      progressValue = 100;
    } else if (totalModules > 0) {
      progressValue = calculateProgress(completedModules, totalModules);
    }

    const startDateRaw = (course.startDate || course.start_date || "")
      .toString()
      .trim();
    const rawEndDate = (course.endDate || course.end_date || "")
      .toString()
      .trim();
    const endDateRaw = statusLower === "completed" ? rawEndDate : "";
    const durationLabel = describeDuration(
      startDateRaw,
      endDateRaw,
      statusLower
    );
    const timelineLabel = buildTimelineLabel(
      startDateRaw,
      endDateRaw,
      statusLower
    );

    const updatedTimestamp =
      course.updated_at ||
      course.updatedAt ||
      course.created_at ||
      course.createdAt ||
      new Date().toISOString();

    return {
      id: course.id || Date.now(),
      course: (course.course || "").trim(),
      // provider: (course.provider || "").trim(),
      provider: (course.provider || course.organization || "").trim(),  // ✅ Map organization to provider
    organization: (course.organization || course.provider || "").trim(),  // ✅ Also keep organization
      startDate: startDateRaw,
      endDate: endDateRaw,
      duration: timelineLabel,
      durationLabel,
      status: statusLower,
      progress: progressValue,
      // completedModules,
      completedModules: validatedCompleted,  // ✅ Use validated value
      totalModules,
      hoursSpent,
      skills: skillsArray,
      certificateUrl: (course.certificateUrl || "").trim(),
      description: (course.description || "").trim(), 
      enabled: course.enabled !== false,
      verified: course.verified || false,
      processing: course.processing || false,
      updated_at: updatedTimestamp,
    };
  };

  // Initialize courses when data changes
  useEffect(() => {
    if (data) {
      const normalizedCourses = (Array.isArray(data) ? data : []).map(
        (course) => normalizeCourse(course)
      );
      setCourses(normalizedCourses);
    } else {
      setCourses([]);
    }
    setFormCourse(emptyCourse);
    setIsFormOpen(false);
    setEditingIndex(null);
  }, [data, isOpen]);

  // Open form for new course
  const openNewCourseForm = () => {
    setFormCourse({ ...emptyCourse });
    setEditingIndex(null);
    setIsFormOpen(true);
  };

  // Close form
  const closeForm = () => {
    setFormCourse({ ...emptyCourse });
    setEditingIndex(null);
    setIsFormOpen(false);
  };

  // Edit existing course
  const handleEditCourse = (index) => {
    const course = courses[index];
    if (!course) return;

    const statusValue = normalizeStatusValue(course.status);

    setFormCourse({
      course: course.course || "",
      provider: course.provider || course.organization || "",
      startDate: course.startDate || "",
      endDate: statusValue === "completed" ? course.endDate || "" : "",
      status: statusValue,
      completedModules: course.completedModules?.toString() || "",
      totalModules: course.totalModules?.toString() || "",
      hoursSpent: course.hoursSpent?.toString() || "",
      skills: Array.isArray(course.skills) ? course.skills.join(", ") : "",
      certificateUrl: course.certificateUrl || "",
      description: course.description || "",
    });
    setEditingIndex(index);
    setIsFormOpen(true);
  };

  // Handle input changes
  const handleInputChange = (field) => (event) => {
    const { value } = event.target;
    setFormCourse((prev) => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = (event) => {
    const { value } = event.target;
    const normalized = normalizeStatusValue(value);
    setFormCourse((prev) => ({
      ...prev,
      status: normalized,
      endDate: normalized === "ongoing" ? "" : prev.endDate,
    }));
  };

  // Submit form (add or update course)
  const handleFormSubmit = () => {
    // Validation
    if (!formCourse.course.trim()) {
      toast({
        title: "Course name required",
        description: "Please enter a course name before saving.",
        variant: "destructive",
      });
      return;
    }

    // Parse numeric values
    const completedModules = parsePositiveNumber(formCourse.completedModules);
    const totalModules = parsePositiveNumber(formCourse.totalModules);
    const hoursSpent = parsePositiveNumber(formCourse.hoursSpent);

// ✅ EDGE CASE VALIDATION: Warn if completed > total
  if (totalModules > 0 && completedModules > totalModules) {
    toast({
      title: "Invalid Module Count",
      description: `Completed modules (${completedModules}) cannot exceed total modules (${totalModules}). Adjusted to ${totalModules}.`,
      variant: "destructive",
    });
    return; 
  }
    // Validate modules
    const validatedCompleted =
      totalModules > 0
        ? Math.min(completedModules, totalModules)
        : completedModules;

// ✅ AUTO-DETERMINE STATUS based on modules
  let statusValue;
  if (totalModules > 0 && validatedCompleted >= totalModules) {
    // All modules completed = completed status
    statusValue = "completed";
  } else if (totalModules > 0 && validatedCompleted < totalModules) {
    // Modules incomplete = ongoing status
    statusValue = "ongoing";
  } else {
    // No module tracking, use manual selection
    statusValue = normalizeStatusValue(formCourse.status);
  }
    // const statusValue = normalizeStatusValue(formCourse.status);
    let autoProgress = 0;

    if (statusValue === "completed") {
      autoProgress = 100;
    } else if (totalModules > 0) {
      autoProgress = calculateProgress(validatedCompleted, totalModules);
    }

    const skillsArray = parseSkills(formCourse.skills);
    const startDate = formCourse.startDate?.trim() || "";
    let endDate = formCourse.endDate?.trim() || "";

    if (statusValue === "ongoing") {
      endDate = "";
    }

    if (statusValue === "completed") {
      const startDateObj = toDate(startDate);
      const endDateObj = toDate(endDate);

      if (!startDateObj) {
        toast({
          title: "Start date required",
          description: "Please enter a valid start date for completed courses.",
          variant: "destructive",
        });
        return;
      }

      if (!endDateObj) {
        toast({
          title: "End date required",
          description:
            "Please enter an end date when marking a course completed.",
          variant: "destructive",
        });
        return;
      }

      if (endDateObj.getTime() < startDateObj.getTime()) {
        toast({
          title: "Invalid date range",
          description: "End date cannot be earlier than start date.",
          variant: "destructive",
        });
        return;
      }
    }

    const durationLabel = describeDuration(startDate, endDate, statusValue);
    const timelineLabel = buildTimelineLabel(startDate, endDate, statusValue);

    const baseCourse = editingIndex !== null ? courses[editingIndex] || {} : {};
    const normalizedCourse = {
      id: editingIndex !== null ? baseCourse.id : Date.now(),
      course: formCourse.course.trim(),
      provider: formCourse.provider.trim(),
      organization: formCourse.provider.trim(),  
      startDate,
      endDate,
      duration: timelineLabel,
      durationLabel,
      status: statusValue,
      progress: autoProgress,
      completedModules: validatedCompleted,
      totalModules,
      hoursSpent,
      skills: skillsArray,
      certificateUrl: formCourse.certificateUrl.trim(),
      description: formCourse.description.trim(),  // ✅ ADD THIS
      enabled: editingIndex !== null ? baseCourse.enabled !== false : true,
      verified: editingIndex !== null ? baseCourse.verified : false,
      processing: true,
      updated_at: new Date().toISOString(),
    };

    // Update or add course
    if (editingIndex !== null) {
      setCourses((prev) =>
        prev.map((course, index) =>
          index === editingIndex ? normalizedCourse : course
        )
      );
      toast({
        title: "Course Updated",
        description: "Your changes will be processed for verification.",
      });
    } else {
      setCourses((prev) => [...prev, normalizedCourse]);
      toast({
        title: "Course Added",
        description:
          "Your training course has been submitted for verification.",
      });
    }

    closeForm();
  };

  // Toggle course enabled/disabled
  const toggleCourseEnabled = (index) => {
    setCourses((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? { ...item, enabled: item.enabled === false ? true : false }
          : item
      )
    );
  };

  // Delete course
  const deleteCourse = (index) => {
    setCourses((prev) => prev.filter((_, idx) => idx !== index));
    toast({
      title: "Course Removed",
      description: "The training course has been removed.",
    });
  };

  // Save all changes
  const handleSubmit = async () => {
    try {
      await onSave(courses);
      toast({
        title: "Training Updated",
        description: "Your training details have been saved successfully.",
      });
      onClose();
    } catch (error) {
      console.error('Error saving training:', error);
      toast({
        title: "Error",
        description: "Failed to save training details. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Render form
  const renderForm = () => {
    if (!isFormOpen) {
      return (
        <Button
          onClick={openNewCourseForm}
          variant="outline"
          className="w-full border-dashed bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Training Course
        </Button>
      );
    }

    const completedValue = parsePositiveNumber(formCourse.completedModules);
    const totalValue = parsePositiveNumber(formCourse.totalModules);
    const statusValue = normalizeStatusValue(formCourse.status);
    const validatedCompleted =
      totalValue > 0 ? Math.min(completedValue, totalValue) : completedValue;
    const autoProgress =
      statusValue === "completed"
        ? 100
        : totalValue > 0
        ? calculateProgress(validatedCompleted, totalValue)
        : 0;

    return (
      <div className="p-4 border-2 border-dashed border-indigo-200 bg-indigo-50 rounded-lg space-y-4">
        <h4 className="font-semibold text-indigo-700">
          {editingIndex !== null
            ? "Edit Training Course"
            : "Add Training Course"}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="training-course">Course Name *</Label>
            <Input
              id="training-course"
              value={formCourse.course}
              onChange={handleInputChange("course")}
              placeholder="e.g., Advanced React Development"
              className="bg-white"
            />
          </div>
          <div>
            <Label htmlFor="training-provider">Provider</Label>
            <Input
              id="training-provider"
              value={formCourse.provider}
              onChange={handleInputChange("provider")}
              placeholder="e.g., Coursera, Udemy"
              className="bg-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="training-start">Start Date</Label>
            <Input
              id="training-start"
              type="date"
              value={formCourse.startDate}
              onChange={handleInputChange("startDate")}
              className="bg-white"
            />
          </div>
          <div>
            <Label htmlFor="training-end">End Date</Label>
            <Input
              id="training-end"
              type="date"
              value={formCourse.endDate}
              onChange={handleInputChange("endDate")}
              disabled={normalizeStatusValue(formCourse.status) !== "completed"}
              className="bg-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="training-status">Status</Label>
            <select
              id="training-status"
              value={formCourse.status}
              onChange={handleStatusChange}
              className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="training-completed">Modules Completed</Label>
            <Input
              id="training-completed"
              type="number"
              min="0"
              value={formCourse.completedModules}
              onChange={handleInputChange("completedModules")}
              placeholder="10"
              className="bg-white"
            />
          </div>
          <div>
            <Label htmlFor="training-total">Total Modules</Label>
            <Input
              id="training-total"
              type="number"
              min="0"
              value={formCourse.totalModules}
              onChange={handleInputChange("totalModules")}
              placeholder="12"
              className="bg-white"
            />
          </div>
          <div>
            <Label htmlFor="training-hours">Hours Spent</Label>
            <Input
              id="training-hours"
              type="number"
              min="0"
              value={formCourse.hoursSpent}
              onChange={handleInputChange("hoursSpent")}
              placeholder="24"
              className="bg-white"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="training-certificate">Certificate URL</Label>
          <Input
            id="training-certificate"
            type="url"
            value={formCourse.certificateUrl}
            onChange={handleInputChange("certificateUrl")}
            placeholder="https://..."
            className="bg-white"
          />
        </div>
        <div>
          <Label htmlFor="training-skills">
            Skills Covered (comma separated)
          </Label>
          <Textarea
            id="training-skills"
            value={formCourse.skills}
            onChange={handleInputChange("skills")}
            placeholder="React, TypeScript, Testing, Node.js"
            className="bg-white"
            rows={2}
          />
        </div>
        <div>
  <Label htmlFor="training-description">Description</Label>
  <Textarea
    id="training-description"
    value={formCourse.description}
    onChange={handleInputChange("description")}
    placeholder="Brief description of what you learned in this training..."
    className="bg-white"
    rows={3}
  />
</div>
        <div className="space-y-1">
          {/* <div className="flex items-center justify-between text-xs font-medium text-indigo-700">
            <span>Calculated Progress</span>
            <span>{autoProgress}%</span>
          </div> */}
          <Progress value={autoProgress} className="h-2" />
          <p className="text-xs text-gray-500 mt-1">
            {statusValue === "completed"
              ? "Completed courses automatically show 100% progress"
              : totalValue > 0
              ? `Progress calculated from ${validatedCompleted}/${totalValue} modules`
              : "Add total modules to calculate progress automatically"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleFormSubmit}
            className="bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            {editingIndex !== null ? "Update Course" : "Add Course"}
          </Button>
          <Button variant="outline" onClick={closeForm}>
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Edit Training & Courses
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {courses.map((course, index) => (
            <div
              key={course.id || index}
              className={`p-5 border rounded-xl shadow-sm hover:shadow-md transition-shadow ${
                course.enabled === false ? "opacity-50 bg-gray-50" : "bg-white"
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                {/* Left Side - Main Content */}
                <div className="flex-1 space-y-3">
                  {/* Title and Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-semibold text-lg text-gray-900">
                      {course.course}
                    </h4>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge
                        className={
                          course.status === "completed"
                            ? "bg-emerald-100 text-emerald-700 rounded-full px-3 py-1"
                            : "bg-blue-100 text-blue-700 rounded-full px-3 py-1"
                        }
                      >
                        {course.status === "completed"
                          ? "Completed"
                          : "Ongoing"}
                      </Badge>
                      {course.processing && (
                        <Badge className="bg-orange-100 text-orange-700 rounded-full px-3 py-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Processing
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Info Row - Provider, Duration, Hours */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    {course.provider && (
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-gray-500" />
                        {course.provider}
                      </span>
                    )}
                    {course.duration && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        {course.duration}
                      </span>
                    )}
                    {course.hoursSpent > 0 && (
                      <span className="flex items-center gap-1.5">
                        <Timer className="w-4 h-4 text-gray-500" />
                        {course.hoursSpent} hours
                      </span>
                    )}
                  </div>
                  {/* Description */}
{course.description && (
  <p className="text-sm text-gray-600 leading-relaxed">
    {course.description}
  </p>
)}
                  {/* Modules Completed */}
                  {(course.completedModules > 0 || course.totalModules > 0) && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-indigo-600" />
                      <span>
                        {course.completedModules} of {course.totalModules}{" "}
                        modules completed
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Side - Action Buttons */}
                <div className="flex flex-col gap-2 items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditCourse(index)}
                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                  >
                    <PenSquare className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCourse(index)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => toggleCourseEnabled(index)}
                    variant="ghost"
                    className={
                      course.enabled === false
                        ? "text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
                        : "text-emerald-600 hover:text-gray-500 hover:bg-gray-50"
                    }
                    title={
                      course.enabled === false
                        ? "Enable course"
                        : "Disable course"
                    }
                  >
                    {course.enabled === false ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex flex-col mt-4">
                {/* Skills */}

                {Array.isArray(course.skills) && course.skills.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      Skills Covered:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(course.showAllSkills
                        ? course.skills
                        : course.skills.slice(0, 7)
                      ).map((skill, idx) => (
                        <span
                          key={`${course.id}-skill-${idx}`}
                          className="px-3 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    {course.skills.length > 7 && (
                      <button
                        onClick={() =>
                          setCourses((prev) =>
                            prev.map((c, i) =>
                              c.id === course.id
                                ? { ...c, showAllSkills: !c.showAllSkills }
                                : c
                            )
                          )
                        }
                        className="text-xs text-indigo-600 hover:text-indigo-800 self-start mt-1"
                      >
                        {course.showAllSkills
                          ? "Show Less"
                          : `Show All (${course.skills.length})`}
                      </button>
                    )}
                  </div>
                )}

                {/* Progress Graph - Full Width */}
                <div className="space-y-2 pt-3 mt-4">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="flex items-center gap-2 text-gray-700">
                      <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                      Course Progress
                    </span>
                    <span className="text-indigo-700">{course.progress}%</span>
                  </div>
                  <div className="relative">
                    {/* <Progress
                      value={course.progress}
                      className="h-2 w-full rounded-full bg-gray-200"
                      style={{ width: `${course.progress}%` }}
                    /> */}

                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-2.5 bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
                {/* View Certificate Button */}
                {course.certificateUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-gray-300 hover:border-indigo-400 hover:text-indigo-700 text-sm mt-4"
                    onClick={() => window.open(course.certificateUrl, "_blank")}
                  >
                    <Award className="w-4 h-4 mr-2" />
                    View Certificate
                  </Button>
                )}

                {/* Last Updated */}
                {course.updated_at && (
                  <div className="text-xs text-gray-500 pt-1">
                    Last updated:{" "}
                    {new Date(course.updated_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}

          {renderForm()}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              Save All Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export const ExperienceEditModal = ({ isOpen, onClose, data, onSave }) => {
  const [experiences, setExperiences] = useState(data || []);
  const [newExp, setNewExp] = useState({
    role: "",
    organization: "",
    start_date: "",
    end_date: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  // Update internal state when data prop changes and recalculate durations
  useEffect(() => {
    if (data && Array.isArray(data)) {
      // Recalculate duration for all experiences on load
      const experiencesWithDuration = data.map(exp => ({
        ...exp,
        duration: exp.start_date 
          ? calculateDuration(exp.start_date, exp.end_date)
          : exp.duration || ""
      }));
      setExperiences(experiencesWithDuration);
    } else {
      setExperiences([]);
    }
  }, [data]);

  // Calculate duration from start and end dates
  const calculateDuration = (startDate, endDate) => {
    if (!startDate) return "";
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(); // Use current date if no end date
    
    if (isNaN(start.getTime())) return "";
    if (endDate && isNaN(end.getTime())) return "";
    
    // Calculate difference in milliseconds
    const diffMs = Math.abs(end - start);
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    // Calculate years, months, and days
    const years = Math.floor(diffDays / 365);
    const remainingDays = diffDays % 365;
    const months = Math.floor(remainingDays / 30);
    const days = remainingDays % 30;
    
    // Build duration string
    const parts = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (days > 0 && years === 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    
    // Format dates for display
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };
    
    const startLabel = formatDate(start);
    const endLabel = endDate ? formatDate(end) : 'Present';
    
    const durationText = parts.length > 0 ? parts.join(' ') : 'Less than a month';
    
    return `${startLabel} - ${endLabel} (${durationText})`;
  };

  const addExperience = () => {
    if (newExp.role.trim() && newExp.organization.trim()) {
      const duration = calculateDuration(newExp.start_date, newExp.end_date);
      
      setExperiences([
        ...experiences,
        { 
          ...newExp,
          duration, // Auto-calculated duration
          id: Date.now(), // Temporary ID, will be replaced by UUID on save
          verified: false, 
          processing: true,
          approval_status: 'pending'
        },
      ]);
      setNewExp({ 
        role: "", 
        organization: "", 
        start_date: "",
        end_date: "",
      });
      setIsAdding(false);
    }
  };

  const deleteExperience = (id) => {
    setExperiences(experiences.filter((exp) => exp.id !== id));
  };

  const handleSubmit = async () => {
    try {
      await onSave(experiences);
      toast({
        title: "Experience Updated",
        description: "Your experience details are being processed for verification.",
      });
      onClose();
    } catch (error) {
      console.error('Error saving experience:', error);
      toast({
        title: "Error",
        description: "Failed to save experience details. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Edit Experience
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {experiences.map((exp, index) => (
            <div
              key={exp.id || `${exp.role}-${exp.organization}-${index}`}
              className={`p-4 border rounded-lg ${
                exp.enabled === false ? "opacity-50" : "opacity-100"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium">{exp.role}</h4>
                  <p className="text-sm">{exp.organization}</p>
                  <p className="text-xs">{exp.duration}</p>
                  {exp.processing ? (
                    <Badge className="mt-2 bg-orange-100 text-orange-800">
                      <Clock className="w-3 h-3 mr-1" />
                      Processing
                    </Badge>
                  ) : (
                    exp.verified && (
                      <Badge className="mt-2 bg-[#28A745] hover:bg-[#28A745]">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant={exp.enabled === false ? "outline" : "default"}
                    size="sm"
                    onClick={() =>
                      setExperiences(
                        experiences.map((e, i) =>
                          (e.id !== undefined ? e.id : i) ===
                          (exp.id !== undefined ? exp.id : index)
                            ? {
                                ...e,
                                enabled: e.enabled === false ? true : false,
                              }
                            : e
                        )
                      )
                    }
                    className={
                      exp.enabled === false
                        ? "text-gray-500 border-gray-400"
                        : "bg-emerald-500 text-white"
                    }
                  >
                    {exp.enabled === undefined || exp.enabled
                      ? "Disable"
                      : "Enable"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteExperience(exp.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {isAdding ? (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg space-y-3">
              <Input
                placeholder="Role/Position"
                value={newExp.role}
                onChange={(e) =>
                  setNewExp((prev) => ({ ...prev, role: e.target.value }))
                }
              />
              <Input
                placeholder="Organization"
                value={newExp.organization}
                onChange={(e) =>
                  setNewExp((prev) => ({
                    ...prev,
                    organization: e.target.value,
                  }))
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newExp.start_date}
                    onChange={(e) =>
                      setNewExp((prev) => ({ ...prev, start_date: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={newExp.end_date}
                    onChange={(e) =>
                      setNewExp((prev) => ({ ...prev, end_date: e.target.value }))
                    }
                  />
                </div>
              </div>
              
              {/* Display calculated duration preview */}
              {newExp.start_date && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800 font-medium">
                    Duration: {calculateDuration(newExp.start_date, newExp.end_date)}
                  </p>
                  {!newExp.end_date && (
                    <p className="text-xs text-blue-600 mt-1">
                      Leave end date empty for ongoing positions
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={addExperience}
                  size="sm"
                  className="bg-blue-400 hover:bg-blue-500"
                >
                  Add Experience
                </Button>
                <Button
                  onClick={() => setIsAdding(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsAdding(true)}
              variant="outline"
              className="w-full border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Experience
            </Button>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-blue-400 hover:bg-blue-500"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ProjectsEditModal = ({ isOpen, onClose, data, onSave }) => {
  const [projectsList, setProjectsList] = useState(data || []);
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    duration: "",
    status: "",
    description: "",
    organization: "",
    link: "",
    githubLink: "",
    techInput: "",
    start_date: "",
    end_date: "",
    certificate: null,
    video: null,
    ppt: null,
    certificate_url: "",
    video_url: "",
    ppt_url: "",
    certificateLink: "",
    videoLink: "",
    pptLink: "",
  });

  useEffect(() => {
    setProjectsList(data || []);
  }, [data]);

  const resetForm = () => {
    setFormData({
      title: "",
      duration: "",
      status: "",
      description: "",
      organization: "",
      link: "",
      githubLink: "",
      techInput: "",
      start_date: "",
      end_date: "",
      certificate: null,
      video: null,
      ppt: null,
      certificate_url: "",
      video_url: "",
      ppt_url: "",
      certificateLink: "",
      videoLink: "",
      pptLink: "",
    });
    setEditingIndex(null);
  };

  const extractTech = (project) =>
    project.tech ||
    project.technologies ||
    project.techStack ||
    project.tech_stack ||
    project.skills ||
    [];

  const formatTech = (input) =>
    (input || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const startEditing = (project, index) => {
    setFormData({
      title: project.title || "",
      duration: project.duration || "",
      status: project.status || "",
      description: project.description || "",
      organization: project.organization || project.client || "",
      link: project.link || "",
      githubLink:
        project.github_url || project.github_link || project.github || "",
      techInput: extractTech(project).join(", "),
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      certificate: null,
      video: null,
      ppt: null,
      certificate_url: project.certificate_url || "",
      video_url: project.video_url || "",
      ppt_url: project.ppt_url || "",
      certificateLink: project.certificate_url || "",
      videoLink: project.video_url || "",
      pptLink: project.ppt_url || "",
    });
    setEditingIndex(index);
    setIsAdding(true);
  };

  const prepareProject = (base, existing = {}) => {
    const techArray = formatTech(base.techInput);
    const organizationValue = base.organization?.trim() || null;
    const enabledValue =
      typeof base.enabled === "boolean"
        ? base.enabled
        : typeof existing.enabled === "boolean"
        ? existing.enabled
        : true;
    let durationText = "";
    let startLabel = "";
    let endLabel = "";

    if (base.start_date && base.end_date) {
      const start = new Date(base.start_date);
      const end = new Date(base.end_date);
      const diffMs = Math.abs(end - start);
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // compute months/weeks/days
      let duration = "";
      if (diffDays >= 30) {
        const diffMonths = Math.floor(diffDays / 30);
        duration = `${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
      } else if (diffDays >= 14) {
        const diffWeeks = Math.floor(diffDays / 7);
        duration = `${diffWeeks} week${diffWeeks > 1 ? "s" : ""}`;
      } else if (diffDays > 1) {
        duration = `${diffDays} days`;
      } else {
        duration = "1 day";
      }

      // format month-year labels
      const formatMonthYear = (date) =>
        date.toLocaleString("default", { month: "short", year: "numeric" });

      startLabel = formatMonthYear(start);
      endLabel = formatMonthYear(end);

      // final display
      durationText = `${startLabel} – ${endLabel} (${duration})`;
    }

    return {
      ...existing,
      ...base,
      start_date: base.start_date || null,
      end_date: base.end_date || null,
      duration: durationText, // formatted version
      status: base.status || "In Progress",
      enabled: enabledValue,
      tech: techArray,
      technologies: techArray,
      organization: organizationValue,
      client: organizationValue,
      certificate_url: base.certificateLink?.trim() || base.certificate_url?.trim() || null,
      video_url: base.videoLink?.trim() || base.video_url?.trim() || null,
      ppt_url: base.pptLink?.trim() || base.ppt_url?.trim() || null,
      github_url: base.githubLink?.trim() || base.github_url?.trim() || null,
      github_link: base.githubLink?.trim() || base.github_url?.trim() || null,
      github: base.githubLink?.trim() || base.github_url?.trim() || null,
      updatedAt: new Date().toISOString(),
    };
  };

  const saveProject = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Missing title",
        description: "Please provide a project title before saving.",
        variant: "destructive",
      });
      return;
    }

    const newProject = prepareProject(formData);
    if (editingIndex !== null) {
      setProjectsList((prev) =>
        prev.map((proj, idx) => (idx === editingIndex ? newProject : proj))
      );
      toast({
        title: "Project Updated",
        description: "Changes saved successfully.",
      });
    } else {
      setProjectsList((prev) => [
        ...prev,
        { ...newProject, createdAt: new Date().toISOString(), enabled: true },
      ]);
      toast({
        title: "Project Added",
        description: "New project added successfully.",
      });
    }
    setIsAdding(false);
    resetForm();
  };

  const toggleProject = (index) => {
    setProjectsList((prev) =>
      prev.map((project, idx) =>
        idx === index ? { ...project, enabled: !project.enabled } : project
      )
    );
  };

  const deleteProject = (index) => {
    setProjectsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      await onSave(projectsList);
      onClose();
    } catch (error) {
      console.error('Error saving projects:', error);
      toast({
        title: "Error",
        description: "Failed to save project details. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-blue-600" /> Manage Projects
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Project List */}
          {projectsList.map((project, index) => (
            <div
              key={index}
              className={`relative border border-gray-200 rounded-xl p-6 shadow-sm transition-opacity ${
                project.enabled === false ? "bg-gray-50 opacity-60" : "bg-white"
              }`}
            >
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="text-blue-600 bg-white border-blue-200 hover:bg-blue-50"
                  onClick={() => startEditing(project, index)}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="text-red-600 bg-red-50 border-red-200 hover:bg-red-50"
                  onClick={() => deleteProject(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className={
                    project.enabled
                      ? "text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                      : "text-gray-500 border-gray-300 bg-white hover:bg-gray-100"
                  }
                  onClick={() => toggleProject(index)}
                  title={project.enabled ? "Disable project" : "Enable project"}
                >
                  {project.enabled ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <h2 className="text-xl font-semibold text-black w-[calc(100%-8rem)]">
                {project.title}
              </h2>
              {(project.organization || project.client) && (
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  {project.organization || project.client}
                </p>
              )}
              {project.duration && (
                <p className="text-sm text-gray-500 flex items-center gap-1 my-2">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  {project.duration}
                </p>
              )}

              {/* Status */}
              <div className="flex gap-2 mt-4">
                {project.status && (
                  <span className="flex items-center px-3 py-1 text-xs rounded-full bg-green-50 text-green-700 border border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" /> {project.status}
                  </span>
                )}
                {project.processing && (
                  <span className="flex items-center px-3 py-1 text-xs rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                    <Clock className="w-3 h-3 mr-1" /> Processing
                  </span>
                )}
                {project.approval_status && (
                  <span className={`flex items-center px-3 py-1 text-xs rounded-full border ${
                    project.approval_status === 'approved'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : project.approval_status === 'rejected'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-orange-50 text-orange-700 border-orange-200'
                  }`}>
                    {project.approval_status === 'approved' ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : project.approval_status === 'rejected' ? (
                      <X className="w-3 h-3 mr-1" />
                    ) : (
                      <Clock className="w-3 h-3 mr-1" />
                    )}
                    {project.approval_status.charAt(0).toUpperCase() + project.approval_status.slice(1)}
                  </span>
                )}
              </div>

              {project.description && (
                <div className="mt-2">
                  <p
                    className={`text-sm text-gray-700 leading-relaxed ${
                      expandedDescriptions[index]
                        ? "line-clamp-none"
                        : "line-clamp-3"
                    }`}
                  >
                    {project.description}
                  </p>
                  {project.description.length > 180 && (
                    <button
                      onClick={() =>
                        setExpandedDescriptions((prev) => ({
                          ...prev,
                          [index]: !prev[index],
                        }))
                      }
                      className="mt-1 text-xs text-blue-600 hover:underline"
                    >
                      {expandedDescriptions[index] ? "Show less" : "Show more"}
                    </button>
                  )}

                  {/* Tech Stack */}
                  {extractTech(project).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {extractTech(project).map((tech, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs border border-purple-100"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end items-center gap-2 pt-4 mt-2 border-t border-gray-100 flex-wrap">
                {project.link && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Link className="w-4 h-4 mr-1" /> Demo
                    </a>
                  </Button>
                )}
                {(project.github_url || project.github_link || project.github) && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="text-gray-700 border-gray-300 hover:bg-gray-100"
                  >
                    <a
                      href={project.github_url || project.github_link || project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="w-4 h-4 mr-1" /> GitHub
                    </a>
                  </Button>
                )}
                {project.certificate_url && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <a
                      href={project.certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="w-4 h-4 mr-1" /> Certificate
                    </a>
                  </Button>
                )}
                {project.video_url && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <a
                      href={project.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Video className="w-4 h-4 mr-1" /> Video
                    </a>
                  </Button>
                )}
                {project.ppt_url && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    <a
                      href={project.ppt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Presentation className="w-4 h-4 mr-1" /> PPT
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Add Form */}
          {!isAdding ? (
            <Button
              onClick={() => setIsAdding(true)}
              variant="outline"
              className="w-full border-dashed border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Project
            </Button>
          ) : (
            <div className="p-5 border border-gray-200 rounded-xl bg-gray-50 space-y-4">
              {/* Basic Info */}
              <div className="space-y-2">
                <Label htmlFor="project-title">Project Title *</Label>
                <Input
                  id="project-title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="e.g., Smart Hiring Platform"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-organization">Organization / Client</Label>
                <Input
                  id="project-organization"
                  value={formData.organization}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, organization: e.target.value }))
                  }
                  placeholder="e.g., Acme Corp"
                />
              </div>

              {/* Timeline Section */}
              <div className="space-y-2">
                <Label className="font-medium text-gray-800">Timeline</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  {/* Start Month */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="project-start"
                      className="text-sm text-gray-600"
                    >
                      Start Date
                    </Label>
                    <Input
                      type="date"
                      id="project-start"
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          start_date: e.target.value,
                        }))
                      }
                      className="border-gray-300 text-gray-700"
                    />
                  </div>

                  {/* End Month */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="project-end"
                      className="text-sm text-gray-600"
                    >
                      End Date
                    </Label>
                    <Input
                      type="date"
                      id="project-end"
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, end_date: e.target.value }))
                      }
                      className="border-gray-300 text-gray-700"
                    />
                  </div>
                </div>

                {/* Display computed duration */}
                {formData.duration && (
                  <p className="text-xs text-gray-500 mt-1">
                    Duration:{" "}
                    <span className="font-medium text-gray-700">
                      {formData.duration}
                    </span>
                  </p>
                )}
              </div>

              {/* Status Dropdown */}
              <div className="space-y-2">
                <Label
                  htmlFor="project-status"
                  className="font-medium text-gray-800"
                >
                  Project Status
                </Label>
                <select
                  id="project-status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, status: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white"
                >
                  <option value="">Select status...</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="gap-4 space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Describe your project..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tech Stack (comma separated)</Label>
                  <Input
                    value={formData.techInput}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, techInput: e.target.value }))
                    }
                    placeholder="React, Node.js, PostgreSQL"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Demo Link</Label>
                  <Input
                    value={formData.link}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, link: e.target.value }))
                    }
                    placeholder="https://"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>GitHub Link (optional)</Label>
                <Input
                  value={formData.githubLink}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, githubLink: e.target.value }))
                  }
                  placeholder="https://github.com/..."
                />
              </div>

              {/* ---- Evidence Section (YOUR UI KEPT EXACTLY AS IS) ---- */}
              <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center gap-2 pt-4">
                  <FileText className="w-5 h-5 text-gray-700" />
                  <Label className="text-base font-semibold text-gray-800">
                    Project Evidence
                    <span className="text-gray-500 font-normal text-sm ml-1">
                      (Optional)
                    </span>
                  </Label>
                </div>

                {/* Evidence Rows */}
                <div className="flex flex-col gap-6">
                  {/* === CERTIFICATE === */}
                  <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <Label className="text-sm font-medium text-gray-800">
                        Certificate
                      </Label>
                    </div>

                    <AnimatePresence mode="wait">
                      {formData.certificate ? (
                        <motion.div
                          key="file"
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-blue-200 bg-blue-50 rounded-lg px-4 py-3 gap-3"
                        >
                          <div
                            className="flex items-center gap-2 text-sm text-blue-700 max-w-full overflow-hidden"
                            title={formData.certificate.name}
                          >
                            <FileText className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate max-w-[220px] sm:max-w-[300px] md:max-w-[400px]">
                              {formData.certificate.name}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 self-end sm:self-center"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                certificate: null,
                              }))
                            }
                          >
                            <X className="w-4 h-4" /> Remove
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="upload"
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="flex flex-col md:flex-row items-center gap-3"
                        >
                          <label
                            htmlFor="project-certificate"
                            className="flex items-center justify-center w-full md:w-1/2 border border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-600 cursor-pointer hover:border-blue-400 transition"
                          >
                            <Upload className="w-4 h-4 mr-2 text-blue-600" />
                            Upload file
                            <input
                              id="project-certificate"
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  certificate: e.target.files?.[0] || null,
                                  certificateLink: "",
                                }))
                              }
                            />
                          </label>

                          <span className="text-xs text-gray-400 text-center md:w-auto w-full">
                            or
                          </span>

                          <div className="relative w-full md:w-1/2">
                            <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <Input
                              id="project-certificate-link"
                              type="url"
                              placeholder="Paste certificate link..."
                              value={formData.certificateLink}
                              className="pl-8 text-sm border-gray-300 focus:ring-1 focus:ring-blue-300"
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  certificateLink: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* === VIDEO === */}
                  <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <Video className="w-4 h-4 text-blue-600" />
                      <Label className="text-sm font-medium text-gray-800">
                        Video
                      </Label>
                    </div>

                    <AnimatePresence mode="wait">
                      {formData.video ? (
                        <motion.div
                          key="file"
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-blue-200 bg-blue-50 rounded-lg px-4 py-3 gap-3"
                        >
                          <div
                            className="flex items-center gap-2 text-sm text-blue-700 max-w-full overflow-hidden"
                            title={formData.video.name}
                          >
                            <Video className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate max-w-[220px] sm:max-w-[300px] md:max-w-[400px]">
                              {formData.video.name}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 self-end sm:self-center"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                video: null,
                              }))
                            }
                          >
                            <X className="w-4 h-4" /> Remove
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="upload"
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="flex flex-col md:flex-row items-center gap-3"
                        >
                          <label
                            htmlFor="project-video"
                            className="flex items-center justify-center w-full md:w-1/2 border border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-600 cursor-pointer hover:border-blue-400 transition"
                          >
                            <Upload className="w-4 h-4 mr-2 text-blue-600" />
                            Upload video
                            <input
                              id="project-video"
                              type="file"
                              accept=".mp4,.avi,.mov,.wmv"
                              className="hidden"
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  video: e.target.files?.[0] || null,
                                  videoLink: "",
                                }))
                              }
                            />
                          </label>

                          <span className="text-xs text-gray-400 text-center md:w-auto w-full">
                            or
                          </span>

                          <div className="relative w-full md:w-1/2">
                            <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <Input
                              id="project-video-link"
                              type="url"
                              placeholder="Paste video link (YouTube, Drive...)"
                              value={formData.videoLink}
                              className="pl-8 text-sm border-gray-300 focus:ring-1 focus:ring-blue-300"
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  videoLink: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* === PRESENTATION === */}
                  <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <Presentation className="w-4 h-4 text-blue-600" />
                      <Label className="text-sm font-medium text-gray-800">
                        Presentation (PPT)
                      </Label>
                    </div>

                    <AnimatePresence mode="wait">
                      {formData.ppt ? (
                        <motion.div
                          key="file"
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-blue-200 bg-blue-50 rounded-lg px-4 py-3 gap-3"
                        >
                          <div
                            className="flex items-center gap-2 text-sm text-blue-700 max-w-full overflow-hidden"
                            title={formData.ppt.name}
                          >
                            <Presentation className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate max-w-[220px] sm:max-w-[300px] md:max-w-[400px]">
                              {formData.ppt.name}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 self-end sm:self-center"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                ppt: null,
                              }))
                            }
                          >
                            <X className="w-4 h-4" /> Remove
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="upload"
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="flex flex-col md:flex-row items-center gap-3"
                        >
                          <label
                            htmlFor="project-ppt"
                            className="flex items-center justify-center w-full md:w-1/2 border border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-600 cursor-pointer hover:border-blue-400 transition"
                          >
                            <Upload className="w-4 h-4 mr-2 text-blue-600" />
                            Upload presentation
                            <input
                              id="project-ppt"
                              type="file"
                              accept=".ppt,.pptx,.pdf"
                              className="hidden"
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  ppt: e.target.files?.[0] || null,
                                  pptLink: "",
                                }))
                              }
                            />
                          </label>

                          <span className="text-xs text-gray-400 text-center md:w-auto w-full">
                            or
                          </span>

                          <div className="relative w-full md:w-1/2">
                            <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <Input
                              id="project-ppt-link"
                              type="url"
                              placeholder="Paste presentation link..."
                              value={formData.pptLink}
                              className="pl-8 text-sm border-gray-300 focus:ring-1 focus:ring-blue-300"
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  pptLink: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveProject}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {editingIndex !== null ? "Update Project" : "Add Project"}
                </Button>
              </div>
            </div>
          )}

          {/* Save All */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Save All Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const CertificatesEditModal = ({ isOpen, onClose, data, onSave }) => {
  const [certificates, setCertificates] = useState(data || []);
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    issuer: "",
    issuedOn: "",
    level: "",
    description: "",
    credentialId: "",
    link: "",
    document: null,
    documentLink: "",
    document_url: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    setCertificates(data || []);
  }, [data]);

  const resetForm = () => {
    setFormData({
      title: "",
      issuer: "",
      issuedOn: "",
      level: "",
      description: "",
      credentialId: "",
      link: "",
      document: null,
      documentLink: "",
      document_url: "",
    });
    setEditingIndex(null);
  };

  const startEditing = (certificate, index) => {
    setFormData({
      title:
        certificate.title || certificate.name || certificate.certificate || "",
      issuer:
        certificate.issuer ||
        certificate.organization ||
        certificate.institution ||
        "",
      issuedOn:
        certificate.year ||
        certificate.date ||
        certificate.issueDate ||
        certificate.issuedOn ||
        "",
      level:
        certificate.level || certificate.category || certificate.type || "",
      description: certificate.description || "",
      credentialId: certificate.credentialId || certificate.credential_id || "",
      link:
        certificate.link ||
        certificate.url ||
        certificate.certificateUrl ||
        certificate.credentialUrl ||
        certificate.viewUrl ||
        "",
      document: null,
      documentLink:
        certificate.documentLink ||
        certificate.document_url ||
        certificate.documentUrl ||
        "",
      document_url:
        certificate.document_url ||
        certificate.documentUrl ||
        certificate.documentLink ||
        "",
    });
    setEditingIndex(index);
    setIsAdding(true);
  };

  const saveCertificate = () => {
    // 1️⃣ Validation
    if (!formData.title.trim()) {
      toast({
        title: "Missing title",
        description: "Please provide a certificate title before saving.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.issuer.trim()) {
      toast({
        title: "Missing issuer",
        description:
          "Please provide the issuing organization for this certificate.",
        variant: "destructive",
      });
      return;
    }

    // 2️⃣ Clean up whitespace in all string fields
    const formatted = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value,
      ])
    );

    const documentUrlInput = formatted.documentLink || formatted.document_url || "";

    // 3️⃣ Update existing certificate
    if (editingIndex !== null) {
      setCertificates((prev) =>
        prev.map((cert, idx) => {
          if (idx !== editingIndex) {
            return cert;
          }
          const resolvedDocumentUrl = documentUrlInput;
          return {
            ...(cert || {}),
            ...formatted,
            document_url: resolvedDocumentUrl || null,
            documentLink: resolvedDocumentUrl,
            enabled: cert?.enabled === false ? false : true,

            // 🔁 Re-verification reset logic:
            verified: false,
            verifiedAt: null,
            processing: true,
            status: "pending",

            // ⏱ Update timestamp
            updatedAt: new Date().toISOString(),
          };
        })
      );

      toast({
        title: "Certificate Updated",
        description:
          "Changes detected — verification will be reprocessed by the system.",
      });
    }

    // 4️⃣ Add new certificate
    else {
      const resolvedDocumentUrl = documentUrlInput;
      setCertificates((prev) => [
        ...prev,
        {
          ...formatted,
          document_url: resolvedDocumentUrl || null,
          documentLink: resolvedDocumentUrl,
          id: Date.now(),
          enabled: true,
          status: "pending",
          verified: false,
          verifiedAt: null,
          processing: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      toast({
        title: "Certificate Added",
        description:
          "Your certificate details are being processed for verification.",
      });
    }

    // 5️⃣ Reset UI state
    setIsAdding(false);
    resetForm();
  };

  const toggleCertificate = (index) => {
    setCertificates((prev) =>
      prev.map((cert, idx) =>
        idx === index
          ? { ...cert, enabled: cert.enabled === false ? true : false }
          : cert
      )
    );
  };

  const deleteCertificate = (index) => {
    setCertificates((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    try {
      await onSave(certificates);
      onClose();
    } catch (error) {
      console.error('Error saving certificates:', error);
      toast({
        title: "Error",
        description: "Failed to save certificate details. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        onClose();
        setIsAdding(false);
        resetForm();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Manage Certificates
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {certificates.map((cert, index) => (
            <div
              key={cert.id || index}
              className={`p-4 border rounded-lg ${
                cert.enabled === false ? "opacity-50" : "opacity-100"
              }`}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">
                      {cert.title || cert.name || "Certificate"}
                    </h4>
                    {cert.processing && (
                      <Badge className="bg-orange-100 text-orange-700">
                        <Clock className="w-3 h-3 mr-1" />
                        Processing
                      </Badge>
                    )}
                  </div>
                  {(cert.issuer || cert.organization || cert.institution) && (
                    <p
                      className="text-sm font-medium"
                    >
                      {cert.issuer || cert.organization || cert.institution}
                    </p>
                  )}
                  {(cert.year ||
                    cert.date ||
                    cert.issueDate ||
                    cert.issuedOn) && (
                    <p className="text-xs">
                      {cert.year ||
                        cert.date ||
                        cert.issueDate ||
                        cert.issuedOn}
                    </p>
                  )}
                  {cert.description && (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {cert.description}
                    </p>
                  )}
                  {cert.level && (
                    <span className="inline-flex px-2 py-1 rounded bg-amber-50 text-amber-700 text-xs font-medium">
                      {cert.level}
                    </span>
                  )}
                  {cert.credentialId && (
                    <p className="text-xs text-gray-500 font-medium">
                      Credential ID: {cert.credentialId}
                    </p>
                  )}
                  {(cert.link || cert.document_url) && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {cert.link && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <a
                            href={cert.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center"
                          >
                            <LinkIcon className="w-4 h-4 mr-1" />
                            View Credential
                          </a>
                        </Button>
                      )}
                      {cert.document_url && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <a
                            href={cert.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center"
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            View Document
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing(cert, index)}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant={cert.enabled === false ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleCertificate(index)}
                    className={
                      cert.enabled === false
                        ? "text-gray-500 border-gray-400"
                        : "bg-emerald-500 text-white"
                    }
                  >
                    {cert.enabled === undefined || cert.enabled
                      ? "Disable"
                      : "Enable"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteCertificate(index)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {isAdding ? (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="certificate-title">Certificate Title *</Label>
                  <Input
                    id="certificate-title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="e.g., AWS Certified Solutions Architect"
                  />
                </div>
                <div>
                  <Label htmlFor="certificate-issuer">
                    Issuing Organization *
                  </Label>
                  <Input
                    id="certificate-issuer"
                    value={formData.issuer}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        issuer: e.target.value,
                      }))
                    }
                    placeholder="e.g., Amazon Web Services"
                  />
                </div>
                <div>
                  <Label htmlFor="certificate-issued">Issued On / Year</Label>
                  <Input
                    id="certificate-issued"
                    value={formData.issuedOn}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        issuedOn: e.target.value,
                      }))
                    }
                    placeholder="e.g., Apr 2024"
                  />
                </div>
                <div>
                  <Label htmlFor="certificate-level">Level / Category</Label>
                  <Input
                    id="certificate-level"
                    value={formData.level}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        level: e.target.value,
                      }))
                    }
                    placeholder="e.g., Professional"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="certificate-description">Description</Label>
                <Textarea
                  id="certificate-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Summary, achievements, or key highlights."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="certificate-credential">Credential ID</Label>
                  <Input
                    id="certificate-credential"
                    value={formData.credentialId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        credentialId: e.target.value,
                      }))
                    }
                    placeholder="e.g., ABCD-1234"
                  />
                </div>
                <div>
                  <Label htmlFor="certificate-link">Credential Link</Label>
                  <Input
                    id="certificate-link"
                    value={formData.link}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, link: e.target.value }))
                    }
                    placeholder="https://"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2 pt-2">
                  <FileText className="w-5 h-5 text-gray-700" />
                  <Label className="text-base font-semibold text-gray-800">
                    Certification Evidence
                    <span className="text-gray-500 font-normal text-sm ml-1">
                      (Optional)
                    </span>
                  </Label>
                </div>

                <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <Label className="text-sm font-medium text-gray-800">
                      Certification Document
                    </Label>
                  </div>

                  <AnimatePresence mode="wait">
                    {formData.document ? (
                      <motion.div
                        key="file"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-blue-200 bg-blue-50 rounded-lg px-4 py-3 gap-3"
                      >
                        <div
                          className="flex items-center gap-2 text-sm text-blue-700 max-w-full overflow-hidden"
                          title={formData.document.name}
                        >
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate max-w-[220px] sm:max-w-[300px] md:max-w-[400px]">
                            {formData.document.name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 self-end sm:self-center"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              document: null,
                              documentLink: "",
                              document_url: "",
                            }))
                          }
                        >
                          <X className="w-4 h-4" /> Remove
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="upload"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="flex flex-col md:flex-row items-center gap-3"
                      >
                        <label
                          htmlFor="certificate-document"
                          className="flex items-center justify-center w-full md:w-1/2 border border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-600 cursor-pointer hover:border-blue-400 transition"
                        >
                          <Upload className="w-4 h-4 mr-2 text-blue-600" />
                          Upload file
                          <input
                            id="certificate-document"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                document: e.target.files?.[0] || null,
                                documentLink: "",
                                document_url: "",
                              }))
                            }
                          />
                        </label>

                        <span className="text-xs text-gray-400 text-center md:w-auto w-full">
                          or
                        </span>

                        <div className="relative w-full md:w-1/2">
                          <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                          <Input
                            id="certificate-document-link"
                            type="url"
                            placeholder="Paste document link..."
                            value={formData.documentLink}
                            className="pl-8 text-sm border-gray-300 focus:ring-1 focus:ring-blue-300"
                            onChange={(e) => {
                              const value = e.target.value;
                              setFormData((prev) => ({
                                ...prev,
                                documentLink: value,
                                document_url: value,
                              }));
                            }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={saveCertificate}
                  className="bg-blue-400 hover:bg-blue-500 text-white"
                >
                  {editingIndex !== null
                    ? "Update Certificate"
                    : "Add Certificate"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsAdding(true)}
              variant="outline"
              className="w-full border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Certificate
            </Button>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                setIsAdding(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-blue-400 hover:bg-blue-500"
            >
              Save All Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const SkillsEditModal = ({
  isOpen,
  onClose,
  data,
  onSave,
  title,
  type,
}) => {
  const [skills, setSkills] = useState(data || []);
  const [newSkill, setNewSkill] = useState({ name: "", level: 1 });
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  // Update internal state when data prop changes (Supabase data updates)
  useEffect(() => {
    setSkills(data || []);
  }, [data]);

  const addSkill = () => {
    if (newSkill.name.trim()) {
      setSkills([
        ...skills,
        { ...newSkill, id: Date.now(), verified: false, processing: true },
      ]);
      setNewSkill({ name: "", level: 1 });
      setIsAdding(false);
    }
  };

  const deleteSkill = (id) => {
    setSkills(skills.filter((skill) => skill.id !== id));
  };

  const updateSkillLevel = (id, level) => {
    setSkills(
      skills.map((skill) => (skill.id === id ? { ...skill, level } : skill))
    );
  };

  const updateNewSkillLevel = (level) => {
    setNewSkill((prev) => ({ ...prev, level }));
  };

  const handleSubmit = async () => {
    try {
      await onSave(skills);
      toast({
        title: `${title} Updated`,
        description: "Your skills are being processed for verification.",
      });
      onClose();
    } catch (error) {
      console.error('Error saving skills:', error);
      toast({
        title: "Error",
        description: "Failed to save skills. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderStars = (
    level,
    skillId,
    editable = false,
    isNewSkill = false
  ) => {
    return [...Array(5)].map((_, i) => (
      <button
        key={i}
        type="button"
        disabled={!editable}
        onClick={() => {
          if (editable) {
            if (isNewSkill) {
              updateNewSkillLevel(i + 1);
            } else {
              updateSkillLevel(skillId, i + 1);
            }
          }
        }}
        className={`w-4 h-4 ${i < level ? "text-[#FFD700]" : "text-gray-300"} ${
          editable ? "hover:text-[#FFD700] cursor-pointer" : ""
        }`}
      >
        ★
      </button>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Edit {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {skills.map((skill, index) => (
            <div
              key={skill.id || index}
              className={`p-4 border rounded-lg ${
                skill.enabled === false ? "opacity-50" : "opacity-100"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium">
                      {skill.name}
                    </span>
                    {skill.processing ? (
                      <Badge className="bg-orange-100 text-orange-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Processing
                      </Badge>
                    ) : (
                      skill.verified && (
                        <Badge className="bg-[#28A745] hover:bg-[#28A745]">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {renderStars(skill.level, skill.id || index, true)}
                  </div>
                </div>
                <Button
                  variant={skill.enabled === false ? "outline" : "default"}
                  size="sm"
                  onClick={() =>
                    setSkills(
                      skills.map((s, i) =>
                        (s.id !== undefined ? s.id : i) ===
                        (skill.id !== undefined ? skill.id : index)
                          ? {
                              ...s,
                              enabled: s.enabled === false ? true : false,
                            }
                          : s
                      )
                    )
                  }
                  className={
                    skill.enabled === false
                      ? "text-gray-500 border-gray-400"
                      : "bg-emerald-500 text-white"
                  }
                >
                  {skill.enabled === undefined || skill.enabled
                    ? "Disable"
                    : "Enable"}
                </Button>
              </div>
            </div>
          ))}

          {isAdding ? (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg space-y-3">
              <Input
                placeholder={`${type} name`}
                value={newSkill.name}
                onChange={(e) =>
                  setNewSkill((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <div className="flex items-center gap-2">
                <Label>Level:</Label>
                <div className="flex gap-1">
                  {renderStars(newSkill.level, "new", true, true)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={addSkill}
                  size="sm"
                  className="bg-blue-400 hover:bg-blue-500"
                >
                  Add {type}
                </Button>
                <Button
                  onClick={() => setIsAdding(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsAdding(true)}
              variant="outline"
              className="w-full border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New {type}
            </Button>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-blue-400 hover:bg-blue-500"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Personal Information Edit Modal
export const PersonalInfoEditModal = ({ isOpen, onClose, data, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    email: "",
    contact_number: "",
    alternate_number: "",
    contact_number_dial_code: "91",
    date_of_birth: "",
    district_name: "",
    university: "",
    college_school_name: "",
    branch_field: "",
    registration_number: "",
    nm_id: "",
    github_link: "",
    portfolio_link: "",
    linkedin_link: "",
    twitter_link: "",
    instagram_link: "",
    facebook_link: "",
    other_social_links: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Initialize form data when modal opens
  useEffect(() => {
    if (data && isOpen) {
      // Extract contact number from formatted phone string if needed
      const extractNumber = (formattedPhone) => {
        if (!formattedPhone) return "";
        // Remove +XX prefix and spaces
        return formattedPhone.replace(/^\+\d+\s*/, "").trim();
      };

      // Handle both raw data and transformed data structures
      const getName = () => data.name || "";
      const getAge = () => data.age || "";
      const getEmail = () => data.email || "";
      const getContactNumber = () => {
        // Try in order: contact_number (raw), phone (transformed)
        if (data.contact_number) return String(data.contact_number);
        if (data.phone) return extractNumber(data.phone);
        return "";
      };
      const getAlternateNumber = () => {
        // Try in order: alternate_number (raw), alternatePhone (transformed)
        if (data.alternate_number) return String(data.alternate_number);
        if (data.alternatePhone) return extractNumber(data.alternatePhone);
        return "";
      };
      const getDialCode = () => data.contact_number_dial_code || "91";
      const getDateOfBirth = () => {
        const dob = data.dateOfBirth || data.date_of_birth || "";
        return dob === "-" ? "" : dob;
      };
      const getDistrict = () => data.district || data.district_name || "";
      const getUniversity = () => data.university || "";
      const getCollege = () => data.college || data.college_school_name || "";
      const getBranch = () => data.department || data.branch_field || "";
      const getRegistration = () => {
        const reg = data.registrationNumber || data.registration_number || "";
        return String(reg);
      };
      const getNmId = () => {
        const nmId = data.nm_id || "";
        return nmId;
      };

      const getGithubLink = () => data.github_link || data.githubLink || "";
      const getPortfolioLink = () =>
        data.portfolio_link || data.portfolioLink || "";
      const getLinkedinLink = () =>
        data.linkedin_link || data.linkedinLink || "";
      const getTwitterLink = () => data.twitter_link || data.twitterLink || "";
      const getInstagramLink = () =>
        data.instagram_link || data.instagramLink || "";
      const getFacebookLink = () =>
        data.facebook_link || data.facebookLink || "";
      const getOtherSocialLinks = () =>
        data.other_social_links || data.otherSocialLinks || [];

      const formValues = {
        name: getName(),
        age: getAge(),
        email: getEmail(),
        contact_number: getContactNumber(),
        alternate_number: getAlternateNumber(),
        contact_number_dial_code: getDialCode(),
        date_of_birth: getDateOfBirth(),
        district_name: getDistrict(),
        university: getUniversity(),
        college_school_name: getCollege(),
        branch_field: getBranch(),
        registration_number: getRegistration(),
        nm_id: getNmId(),
        github_link: getGithubLink(),
        portfolio_link: getPortfolioLink(),
        linkedin_link: getLinkedinLink(),
        twitter_link: getTwitterLink(),
        instagram_link: getInstagramLink(),
        facebook_link: getFacebookLink(),
        other_social_links: getOtherSocialLinks(),
      };

      setFormData(formValues);
    }
  }, [data, isOpen]);

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Error",
        description: "Please fill in at least name and email fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      await onSave(formData);

      toast({
        title: "Success! ✅",
        description: "Your personal information has been saved and updated.",
      });

      // Wait a moment for the refresh to complete before closing
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error("❌ Error saving personal info:", error);
      toast({
        title: "Error",
        description: "Failed to save personal information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Edit Personal Information
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                placeholder="Enter your age"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                value={formData.date_of_birth}
                onChange={(e) =>
                  handleInputChange("date_of_birth", e.target.value)
                }
                placeholder="DD-MM-YYYY or other format"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_number_dial_code">Country Code</Label>
                <Input
                  id="contact_number_dial_code"
                  value={formData.contact_number_dial_code}
                  onChange={(e) =>
                    handleInputChange(
                      "contact_number_dial_code",
                      e.target.value
                    )
                  }
                  placeholder="91"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_number">Primary Contact Number</Label>
                <Input
                  id="contact_number"
                  type="tel"
                  value={formData.contact_number}
                  onChange={(e) =>
                    handleInputChange("contact_number", e.target.value)
                  }
                  placeholder="Enter primary contact number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alternate_number">
                  Alternate Contact Number
                </Label>
                <Input
                  id="alternate_number"
                  type="tel"
                  value={formData.alternate_number}
                  onChange={(e) =>
                    handleInputChange("alternate_number", e.target.value)
                  }
                  placeholder="Enter alternate contact number"
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Location Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="district_name">District</Label>
                <Input
                  id="district_name"
                  value={formData.district_name}
                  onChange={(e) =>
                    handleInputChange("district_name", e.target.value)
                  }
                  placeholder="Enter your district"
                />
              </div>
            </div>
          </div>

          {/* Educational Information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Educational Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <Input
                  id="university"
                  value={formData.university}
                  onChange={(e) =>
                    handleInputChange("university", e.target.value)
                  }
                  placeholder="Enter your university"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="college_school_name">College/School Name</Label>
                <Input
                  id="college_school_name"
                  value={formData.college_school_name}
                  onChange={(e) =>
                    handleInputChange("college_school_name", e.target.value)
                  }
                  placeholder="Enter your college or school name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch_field">Branch/Field of Study</Label>
                <Input
                  id="branch_field"
                  value={formData.branch_field}
                  onChange={(e) =>
                    handleInputChange("branch_field", e.target.value)
                  }
                  placeholder="Enter your branch or field"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration_number">Registration Number</Label>
                <Input
                  id="registration_number"
                  value={formData.registration_number}
                  onChange={(e) =>
                    handleInputChange("registration_number", e.target.value)
                  }
                  placeholder="Enter your registration number"
                />
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              System Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nm_id">NM ID (System Generated)</Label>
                <Input
                  id="nm_id"
                  value={formData.nm_id}
                  onChange={(e) => handleInputChange("nm_id", e.target.value)}
                  placeholder="System generated ID"
                  className="bg-gray-100"
                  readOnly={!!formData.nm_id}
                  title={
                    formData.nm_id
                      ? "This is a system-generated ID and cannot be modified"
                      : "This field will be auto-generated by the system"
                  }
                />
                {formData.nm_id && (
                  <p className="text-xs text-gray-500">
                    ℹ️ This is a system-generated ID and cannot be modified
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Social Media & Professional Links
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="github_link">GitHub Profile</Label>
                <Input
                  id="github_link"
                  type="url"
                  value={formData.github_link}
                  onChange={(e) =>
                    handleInputChange("github_link", e.target.value)
                  }
                  placeholder="https://github.com/yourusername"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolio_link">Portfolio Website</Label>
                <Input
                  id="portfolio_link"
                  type="url"
                  value={formData.portfolio_link}
                  onChange={(e) =>
                    handleInputChange("portfolio_link", e.target.value)
                  }
                  placeholder="https://yourportfolio.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin_link">LinkedIn Profile</Label>
                <Input
                  id="linkedin_link"
                  type="url"
                  value={formData.linkedin_link}
                  onChange={(e) =>
                    handleInputChange("linkedin_link", e.target.value)
                  }
                  placeholder="https://linkedin.com/in/yourusername"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter_link">Twitter/X Profile</Label>
                <Input
                  id="twitter_link"
                  type="url"
                  value={formData.twitter_link}
                  onChange={(e) =>
                    handleInputChange("twitter_link", e.target.value)
                  }
                  placeholder="https://twitter.com/yourusername"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram_link">Instagram Profile</Label>
                <Input
                  id="instagram_link"
                  type="url"
                  value={formData.instagram_link}
                  onChange={(e) =>
                    handleInputChange("instagram_link", e.target.value)
                  }
                  placeholder="https://instagram.com/yourusername"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook_link">Facebook Profile</Label>
                <Input
                  id="facebook_link"
                  type="url"
                  value={formData.facebook_link}
                  onChange={(e) =>
                    handleInputChange("facebook_link", e.target.value)
                  }
                  placeholder="https://facebook.com/yourusername"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Personal Information"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};