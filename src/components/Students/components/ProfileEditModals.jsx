import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import {
  createCertificate,
  updateCertificate as updateCertificateService,
  deleteCertificate as deleteCertificateService,
  uploadCertificateFile,
} from "../../../services/certificateService";
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
  Upload,
  FileText,
  ExternalLink,
  Shield,
  Download,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    setFormData(education);
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
          edu.id === editingItem ? { ...formData, id: editingItem } : edu
        )
      );
    } else {
      // Add new education
      const newEducation = {
        ...formData,
        id: Date.now(),
        processing: true,
      };
      setEducationList([...educationList, newEducation]);
    }

    setIsAdding(false);
    setEditingItem(null);
    resetForm();

    toast({
      title: "Education Updated",
      description:
        "Your education details are being processed for verification.",
    });
  };

  const deleteEducation = (id) => {
    setEducationList(educationList.filter((edu) => edu.id !== id));
    if (editingItem === id) {
      cancelEdit();
    }
  };

  const handleSubmit = () => {
    onSave(educationList);
    onClose();
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
                    <h4 className="font-semibold" style={{ color: "#6A0DAD" }}>
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
                  </div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#6A0DAD" }}
                  >
                    {education.university}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                    <div>
                      <span style={{ color: "#6A0DAD" }}>Department:</span>
                      <p className="font-medium" style={{ color: "#6A0DAD" }}>
                        {education.department}
                      </p>
                    </div>
                    <div>
                      <span style={{ color: "#6A0DAD" }}>Year:</span>
                      <p className="font-medium" style={{ color: "#6A0DAD" }}>
                        {education.yearOfPassing}
                      </p>
                    </div>
                    <div>
                      <span style={{ color: "#6A0DAD" }}>Grade:</span>
                      <p className="font-medium" style={{ color: "#6A0DAD" }}>
                        {education.cgpa}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing(education)}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    <Edit3 className="w-4 h-4" />
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
                        : "bg-emerald-500 text-white"
                    }
                  >
                    {education.enabled === undefined || education.enabled
                      ? "Disable"
                      : "Enable"}
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
              className="w-full border-dashed bg-blue-400 hover:bg-blue-50"
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

    let progressValue = 0;
    const statusLower = normalizeStatusValue(course.status);

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
      provider: (course.provider || "").trim(),
      startDate: startDateRaw,
      endDate: endDateRaw,
      duration: timelineLabel,
      durationLabel,
      status: statusLower,
      progress: progressValue,
      completedModules,
      totalModules,
      hoursSpent,
      skills: skillsArray,
      certificateUrl: (course.certificateUrl || "").trim(),
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
      provider: course.provider || "",
      startDate: course.startDate || "",
      endDate: statusValue === "completed" ? course.endDate || "" : "",
      status: statusValue,
      completedModules: course.completedModules?.toString() || "",
      totalModules: course.totalModules?.toString() || "",
      hoursSpent: course.hoursSpent?.toString() || "",
      skills: Array.isArray(course.skills) ? course.skills.join(", ") : "",
      certificateUrl: course.certificateUrl || "",
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

    // Validate modules
    const validatedCompleted =
      totalModules > 0
        ? Math.min(completedModules, totalModules)
        : completedModules;

    const statusValue = normalizeStatusValue(formCourse.status);
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
  const handleSubmit = () => {
    onSave(courses);
    toast({
      title: "Training Updated",
      description: "Your training details have been saved successfully.",
    });
    onClose();
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
    duration: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  // Update internal state when data prop changes (Supabase data updates)
  useEffect(() => {
    setExperiences(data || []);
  }, [data]);

  const addExperience = () => {
    if (newExp.role.trim() && newExp.organization.trim()) {
      setExperiences([
        ...experiences,
        { ...newExp, id: Date.now(), verified: false, processing: true },
      ]);
      setNewExp({ role: "", organization: "", duration: "" });
      setIsAdding(false);
    }
  };

  const deleteExperience = (id) => {
    setExperiences(experiences.filter((exp) => exp.id !== id));
  };

  const handleSubmit = () => {
    onSave(experiences);
    toast({
      title: "Experience Updated",
      description:
        "Your experience details are being processed for verification.",
    });
    onClose();
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
              key={exp.id || index}
              className={`p-4 border rounded-lg ${
                exp.enabled === false ? "opacity-50" : "opacity-100"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium" style={{ color: "#6A0DAD" }}>
                    {exp.role}
                  </h4>
                  <p className="text-sm" style={{ color: "#6A0DAD" }}>
                    {exp.organization}
                  </p>
                  <p className="text-xs" style={{ color: "#6A0DAD" }}>
                    {exp.duration}
                  </p>
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
              <Input
                placeholder="Duration (e.g., Jun 2024 - Aug 2024)"
                value={newExp.duration}
                onChange={(e) =>
                  setNewExp((prev) => ({ ...prev, duration: e.target.value }))
                }
              />
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
  const [formData, setFormData] = useState({
    title: "",
    organization: "",
    duration: "",
    status: "",
    description: "",
    link: "",
    techInput: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    setProjectsList(data || []);
  }, [data]);

  const resetForm = () => {
    setFormData({
      title: "",
      organization: "",
      duration: "",
      status: "",
      description: "",
      link: "",
      techInput: "",
    });
    setEditingIndex(null);
  };

  const extractTech = (project) => {
    if (Array.isArray(project.tech) && project.tech.length) return project.tech;
    if (Array.isArray(project.technologies) && project.technologies.length)
      return project.technologies;
    if (Array.isArray(project.techStack) && project.techStack.length)
      return project.techStack;
    if (Array.isArray(project.skills) && project.skills.length)
      return project.skills;
    return [];
  };

  const formatTech = (input) => {
    return (input || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const startEditing = (project, index) => {
    setFormData({
      title: project.title || project.name || "",
      organization:
        project.organization || project.company || project.client || "",
      duration: project.duration || project.timeline || project.period || "",
      status: project.status || "",
      description: project.description || "",
      link: project.link || project.github,
      techInput: extractTech(project).join(", "),
    });
    setEditingIndex(index);
    setIsAdding(true);
  };

  const prepareProject = (base, existing = {}) => {
    const techArray = formatTech(base.techInput);
    const { techInput, ...rest } = base;
    const trimmed = Object.fromEntries(
      Object.entries(rest).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value,
      ])
    );
    const normalizedLink = typeof trimmed.link === "string" ? trimmed.link : "";
    return {
      ...existing,
      ...trimmed,
      title: trimmed.title || existing.title || "",
      organization: trimmed.organization || existing.organization || "",
      duration: trimmed.duration || existing.duration || "",
      status: trimmed.status || existing.status || "",
      description: trimmed.description || existing.description || "",
      link: normalizedLink,
      github: normalizedLink,
      tech: techArray,
      technologies: techArray,
      techStack: techArray,
      skills: techArray.length ? techArray : existing.skills || [],
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
        prev.map((proj, idx) =>
          idx === editingIndex
            ? {
                ...(proj || {}),
                ...prepareProject(formData, proj),
                enabled: proj?.enabled === false ? false : true,

                // 🔁 Verification reset logic
                verified: false,
              processing: true,
                verifiedAt: null,

                updatedAt: new Date().toISOString(),
              }
            : proj
        )
      );

      toast({
        title: "Project Updated",
        description:
          "Changes detected — verification will be reprocessed by the system.",
      });
    } else {
      // 🆕 new project
      setProjectsList((prev) => [
        ...prev,
        {
        ...newProject,
        enabled: true,
          verified: false,
        processing: true,
          verifiedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      toast({
        title: "Project Added",
        description:
          "Your project details are being processed for verification.",
      });
    }

    setIsAdding(false);
    resetForm();
  };

  const toggleProject = (index) => {
    setProjectsList((prev) =>
      prev.map((project, idx) =>
        idx === index
          ? { ...project, enabled: project.enabled === false ? true : false }
          : project
      )
    );
  };

  const deleteProject = (index) => {
    setProjectsList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = () => {
    onSave(
      projectsList.map((project) => ({
        ...project,
        tech: extractTech(project),
        technologies: extractTech(project),
        techStack: extractTech(project),
      }))
    );
    onClose();
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Manage Projects
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {projectsList.map((project, index) => (
            <div
              key={project.id || index}
              className={`p-4 border rounded-lg ${
                project.enabled === false ? "opacity-50" : "opacity-100"
              }`}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold" style={{ color: "#6A0DAD" }}>
                      {project.title || "Untitled Project"}
                    </h4>
                    {project.status && (
                      <Badge className="bg-emerald-100 text-emerald-700">
                        {project.status}
                      </Badge>
                    )}
                    {project.processing && (
                      <Badge className="bg-orange-100 text-orange-700">
                        <Clock className="w-3 h-3 mr-1" />
                        Processing
                      </Badge>
                    )}
                  </div>

                  {(project.organization ||
                    project.company ||
                    project.client) && (
                    <p
                      className="text-sm font-medium"
                      style={{ color: "#6A0DAD" }}
                    >
                      {project.organization ||
                        project.company ||
                        project.client}
                    </p>
                  )}
                  {(project.duration || project.timeline) && (
                    <p className="text-xs" style={{ color: "#6A0DAD" }}>
                      {project.duration || project.timeline}
                    </p>
                  )}
                  {project.description && (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                  {extractTech(project).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {extractTech(project).map((techItem, techIdx) => (
                        <span
                          key={techIdx}
                          className="px-2 py-1 rounded bg-purple-50 text-purple-700 text-xs font-medium"
                        >
                          {techItem}
                        </span>
                      ))}
                    </div>
                  )}
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      View Project
                    </a>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing(project, index)}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant={project.enabled === false ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleProject(index)}
                    className={
                      project.enabled === false
                        ? "text-gray-500 border-gray-400"
                        : "bg-emerald-500 text-white"
                    }
                  >
                    {project.enabled === undefined || project.enabled
                      ? "Disable"
                      : "Enable"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteProject(index)}
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
                  <Label htmlFor="project-title">Project Title *</Label>
                  <Input
                    id="project-title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="e.g., Smart Hiring Platform"
                  />
                </div>
                <div>
                  <Label htmlFor="project-organization">
                    Organization / Client
                  </Label>
                  <Input
                    id="project-organization"
                    value={formData.organization}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        organization: e.target.value,
                      }))
                    }
                    placeholder="e.g., Rareminds"
                  />
                </div>
                <div>
                  <Label htmlFor="project-duration">Duration / Timeline</Label>
                  <Input
                    id="project-duration"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                    placeholder="e.g., Jan 2024 - Mar 2024"
                  />
                </div>
                <div>
                  <Label htmlFor="project-status">Status</Label>
                  <Input
                    id="project-status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    placeholder="e.g., Completed"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe the project, your role, outcomes..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project-tech">
                    Tech Stack (comma separated)
                  </Label>
                  <Input
                    id="project-tech"
                    value={formData.techInput}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        techInput: e.target.value,
                      }))
                    }
                    placeholder="React, Node.js, PostgreSQL"
                  />
                </div>
                <div>
                  <Label htmlFor="project-link">Project Link</Label>
                  <Input
                    id="project-link"
                    value={formData.link}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, link: e.target.value }))
                    }
                    placeholder="https://"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={saveProject}
                  className="bg-blue-400 hover:bg-blue-500 text-white"
                >
                  {editingIndex !== null ? "Update Project" : "Add Project"}
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
              Add New Project
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

export const CertificatesEditModal = ({ isOpen, onClose, data, onSave, studentId, onRefresh }) => {
  const [certificates, setCertificates] = useState(data || []);
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    issuer: "",
    issuedOn: "",
    level: "",
    description: "",
    credentialId: "",
    link: "",
    upload: "",
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
      upload: "",
    });
    setUploadedFile(null);
    setEditingIndex(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF, images)
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or image file (JPG, PNG).",
          variant: "destructive",
        });
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      setUploadedFile(file);
    }
  };

  const startEditing = (certificate, index) => {
    // Handle date formatting for the date input
    let dateValue = certificate.issued_on || certificate.issuedOn || certificate.year || certificate.date || certificate.issueDate || "";
    
    // If it's already in YYYY-MM-DD format, use it
    // Otherwise, try to parse and format it
    if (dateValue && !dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parsedDate = new Date(dateValue);
      if (!isNaN(parsedDate.getTime())) {
        dateValue = parsedDate.toISOString().split('T')[0];
      } else {
        // Can't parse the date, leave empty for user to re-enter
        dateValue = "";
      }
    }

    setFormData({
      title:
        certificate.title || certificate.name || certificate.certificate || "",
      issuer:
        certificate.issuer ||
        certificate.organization ||
        certificate.institution ||
        "",
      issuedOn: dateValue,
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
      upload: certificate.upload || "",
    });
    setEditingIndex(index);
    setIsAdding(true);
  };

  const saveCertificate = async () => {
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

    if (!studentId) {
      toast({
        title: "Error",
        description: "Student ID is missing. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // 2️⃣ Upload file if provided
      let uploadUrl = formData.upload || null;
      if (uploadedFile) {
        const uploadResult = await uploadCertificateFile(uploadedFile, studentId);
        if (uploadResult.success) {
          uploadUrl = uploadResult.url;
        } else {
          toast({
            title: "Upload failed",
            description: uploadResult.error || "Failed to upload file.",
            variant: "destructive",
          });
          setUploading(false);
          return;
        }
      }

      // 3️⃣ Prepare certificate data
      const certificateData = {
        title: formData.title.trim(),
        issuer: formData.issuer.trim(),
        level: formData.level.trim() || null,
        credential_id: formData.credentialId.trim() || null,
        link: formData.link.trim() || null,
        issued_on: formData.issuedOn.trim() || null,
        description: formData.description.trim() || null,
        upload: uploadUrl,
      };

      // Log only in development
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 Saving certificate:', certificateData.title);
      }

      // 4️⃣ Update existing or create new certificate
      if (editingIndex !== null) {
        const certToUpdate = certificates[editingIndex];
        const result = await updateCertificateService(certToUpdate.id, certificateData);

        if (result.success) {
          // Update local state
          setCertificates((prev) =>
            prev.map((cert, idx) =>
              idx === editingIndex ? result.data : cert
            )
          );

          // Refresh parent to show updated data
          if (onRefresh) {
            await onRefresh();
          }

          toast({
            title: "Certificate Updated",
            description: "Your certificate has been updated successfully.",
          });
        } else {
          toast({
            title: "Update failed",
            description: result.error || "Failed to update certificate.",
            variant: "destructive",
          });
        }
      } else {
        // Create new certificate
        const result = await createCertificate({
          ...certificateData,
          student_id: studentId,
        });

        if (result.success) {
          // Add to local state
          setCertificates((prev) => [...prev, result.data]);

          // Refresh parent to show new certificate
          if (onRefresh) {
            await onRefresh();
          }

          toast({
            title: "Certificate Added",
            description: "Your certificate has been added successfully.",
          });
        } else {
          toast({
            title: "Failed to add certificate",
            description: result.error || "An error occurred.",
            variant: "destructive",
          });
        }
      }

      // 5️⃣ Reset UI state
      setIsAdding(false);
      resetForm();
    } catch (err) {
      console.error("Error saving certificate:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteCertificate = async (index) => {
    const certToDelete = certificates[index];
    if (!certToDelete?.id) return;

    try {
      const result = await deleteCertificateService(certToDelete.id);
      
      if (result.success) {
        setCertificates((prev) => prev.filter((_, idx) => idx !== index));
        
        // Refresh parent to update the list
        if (onRefresh) {
          await onRefresh();
        }
        
        toast({
          title: "Certificate Deleted",
          description: "The certificate has been removed successfully.",
        });
      } else {
        toast({
          title: "Delete failed",
          description: result.error || "Failed to delete certificate.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error deleting certificate:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = () => {
    onSave(certificates);
    onClose();
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  My Certificates
                </DialogTitle>
                <p className="text-sm text-gray-500 mt-0.5">
                  {certificates.length} {certificates.length === 1 ? 'certificate' : 'certificates'}
                </p>
              </div>
            </div>
            {!studentId && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                <AlertCircle className="w-3 h-3 mr-1" />
                Loading profile...
              </Badge>
            )}
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {certificates.length === 0 && !isAdding ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Award className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No certificates yet
              </h3>
              <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
                Showcase your achievements by adding certificates from courses, training programs, or professional certifications.
              </p>
              <Button
                onClick={() => setIsAdding(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Certificate
              </Button>
            </div>
          ) : null}

          {certificates.map((cert, index) => (
            <div
              key={cert.id || index}
              className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200"
            >
              <div className="flex gap-4">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                    <Award className="w-7 h-7 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header with title and status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">
                        {cert.title || cert.name || "Certificate"}
                      </h4>
                      {(cert.issuer || cert.organization || cert.institution) && (
                        <p className="text-sm text-blue-600 font-medium">
                          {cert.issuer || cert.organization || cert.institution}
                        </p>
                      )}
                    </div>
                    
                    {/* Status badge */}
                    <div className="flex items-center gap-2">
                      {cert.approval_status && (
                        <div>
                          {cert.approval_status === 'approved' ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 whitespace-nowrap">
                              <Shield className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          ) : cert.approval_status === 'pending' ? (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 whitespace-nowrap">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending Review
                            </Badge>
                          ) : null}
                        </div>
                      )}
                      
                      {/* Action buttons - show on hover */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(cert, index)}
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                          title="Edit certificate"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCertificate(index)}
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          title="Delete certificate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Metadata row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
                    {(cert.issued_on || cert.year || cert.date || cert.issueDate || cert.issuedOn) && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">
                          {(() => {
                            const dateStr = cert.issued_on || cert.year || cert.date || cert.issueDate || cert.issuedOn;
                            const date = new Date(dateStr);
                            if (!isNaN(date.getTime())) {
                              return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
                            }
                            return dateStr;
                          })()}
                        </span>
                      </div>
                    )}
                    {cert.level && (
                      <Badge className="bg-purple-50 text-purple-700 border-purple-200 font-medium">
                        {cert.level}
                      </Badge>
                    )}
                    {(cert.credential_id || cert.credentialId) && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="font-mono text-xs">
                          {cert.credential_id || cert.credentialId}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {cert.description && (
                    <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-2">
                      {cert.description}
                    </p>
                  )}

                  {/* Actions row */}
                  {((cert.link || cert.url || cert.certificateUrl || cert.credentialUrl || cert.viewUrl) || cert.upload) && (
                    <div className="flex items-center gap-2">
                      {(cert.link || cert.url || cert.certificateUrl || cert.credentialUrl || cert.viewUrl) && (
                        <a
                          href={cert.link || cert.url || cert.certificateUrl || cert.credentialUrl || cert.viewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Certificate
                        </a>
                      )}
                      {cert.upload && (
                        <a
                          href={cert.upload}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isAdding ? (
            <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-2 border-blue-200 rounded-xl p-6 space-y-6 animate-in fade-in-50 duration-300">
              {/* Form title */}
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  {editingIndex !== null ? 'Edit Certificate' : 'Add New Certificate'}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="certificate-title" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                    Certificate Title <span className="text-red-500">*</span>
                  </Label>
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
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="certificate-issuer" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                    Issuing Organization <span className="text-red-500">*</span>
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
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="certificate-issued" className="text-sm font-medium text-gray-700 mb-1.5">
                    Issued Date (Optional)
                  </Label>
                  <Input
                    id="certificate-issued"
                    type="date"
                    value={formData.issuedOn}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        issuedOn: e.target.value,
                      }))
                    }
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Select the date when you received this certificate</p>
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

              {/* File Upload Section */}
              <div className="space-y-2">
                <Label htmlFor="certificate-upload" className="text-sm font-medium text-gray-700">
                  Upload Certificate Document (Optional)
                </Label>
                <div className="relative">
                  <Input
                    id="certificate-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                {uploadedFile && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mt-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">{uploadedFile.name}</span>
                    <span className="text-xs text-green-600">({(uploadedFile.size / 1024).toFixed(2)} KB)</span>
                  </div>
                )}
                {formData.upload && !uploadedFile && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg mt-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Current: {formData.upload.split('/').pop()}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 mt-2">
                  <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5" />
                  <p className="text-xs text-gray-500">
                    Accepted formats: PDF, JPG, PNG • Maximum size: 5MB
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    resetForm();
                  }}
                  disabled={uploading}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={saveCertificate}
                  disabled={uploading}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 shadow-md hover:shadow-lg transition-all"
                >
                  {uploading ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      {uploadedFile ? "Uploading..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      {editingIndex !== null ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Update Certificate
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Certificate
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : certificates.length > 0 ? (
            <Button
              onClick={() => setIsAdding(true)}
              className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-dashed border-blue-200 hover:border-blue-400 hover:from-blue-100 hover:to-indigo-100 py-6 rounded-xl transition-all duration-200 group shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 group-hover:bg-blue-600 flex items-center justify-center transition-all duration-200 shadow-sm group-hover:scale-110">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-base text-gray-700 group-hover:text-blue-700 transition-colors">Add Another Certificate</span>
              </div>
            </Button>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-end">
            <Button
              onClick={() => {
                onClose();
                setIsAdding(false);
                resetForm();
              }}
              className="px-8 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              Done
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

  const handleSubmit = () => {
    onSave(skills);
    toast({
      title: `${title} Updated`,
      description: "Your skills are being processed for verification.",
    });
    onClose();
  };

  const renderStars = (level, skillId, editable = false, isNewSkill = false) => {
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
                    <span className="font-medium" style={{ color: "#6A0DAD" }}>
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
      const getPortfolioLink = () => data.portfolio_link || data.portfolioLink || "";
      const getLinkedinLink = () => data.linkedin_link || data.linkedinLink || "";
      const getTwitterLink = () => data.twitter_link || data.twitterLink || "";
      const getInstagramLink = () => data.instagram_link || data.instagramLink || "";
      const getFacebookLink = () => data.facebook_link || data.facebookLink || "";
      const getOtherSocialLinks = () => data.other_social_links || data.otherSocialLinks || [];

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
