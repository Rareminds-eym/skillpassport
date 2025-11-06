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

    // 3️⃣ Update existing certificate
    if (editingIndex !== null) {
      setCertificates((prev) =>
        prev.map((cert, idx) =>
          idx === editingIndex
            ? {
                ...(cert || {}),
                ...formatted,
                enabled: cert?.enabled === false ? false : true,

                // 🔁 Re-verification reset logic:
                verified: false,
                verifiedAt: null,
                processing: true,
                status: "pending",

                // ⏱ Update timestamp
                updatedAt: new Date().toISOString(),
              }
            : cert
        )
      );

      toast({
        title: "Certificate Updated",
        description:
          "Changes detected — verification will be reprocessed by the system.",
      });
    }

    // 4️⃣ Add new certificate
    else {
      setCertificates((prev) => [
        ...prev,
        {
          ...formatted,
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
                    <h4 className="font-semibold" style={{ color: "#6A0DAD" }}>
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
                      style={{ color: "#6A0DAD" }}
                    >
                      {cert.issuer || cert.organization || cert.institution}
                    </p>
                  )}
                  {(cert.year ||
                    cert.date ||
                    cert.issueDate ||
                    cert.issuedOn) && (
                    <p className="text-xs" style={{ color: "#6A0DAD" }}>
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
                  {cert.link && (
                    <a
                      href={cert.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      View Credential
                    </a>
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

  const handleSubmit = () => {
    onSave(skills);
    toast({
      title: `${title} Updated`,
      description: "Your skills are being processed for verification.",
    });
    onClose();
  };

  const renderStars = (level, skillId, editable = false) => {
    return [...Array(5)].map((_, i) => (
      <button
        key={i}
        type="button"
        disabled={!editable}
        onClick={() => editable && updateSkillLevel(skillId, i + 1)}
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
                  {renderStars(newSkill.level, "new", true)}
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
