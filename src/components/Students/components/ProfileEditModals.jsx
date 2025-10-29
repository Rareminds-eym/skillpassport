import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Plus, Trash2, Edit3, Clock, CheckCircle, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [courses, setCourses] = useState(data || []);
  const [newCourse, setNewCourse] = useState({
    course: "",
    progress: 0,
    status: "ongoing",
  });
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  // Update internal state when data prop changes (Supabase data updates)
  useEffect(() => {
    setCourses(data || []);
  }, [data]);

  const addCourse = () => {
    if (newCourse.course.trim()) {
      setCourses([
        ...courses,
        { ...newCourse, id: Date.now(), verified: false, processing: true },
      ]);
      setNewCourse({ course: "", progress: 0, status: "ongoing" });
      setIsAdding(false);
    }
  };

  const deleteCourse = (id) => {
    setCourses(courses.filter((course) => course.id !== id));
  };

  const handleSubmit = () => {
    onSave(courses);
    toast({
      title: "Training Updated",
      description:
        "Your training details are being processed for verification.",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
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
              className={`p-4 border rounded-lg space-y-2 ${
                course.enabled === false ? "opacity-50" : "opacity-100"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium" style={{ color: "#6A0DAD" }}>
                    {course.course}
                  </h4>
                  <p className="text-sm" style={{ color: "#6A0DAD" }}>
                    Progress: {course.progress}%
                  </p>
                  <Badge
                    variant={
                      course.status === "completed" ? "default" : "secondary"
                    }
                  >
                    {course.status}
                  </Badge>
                  {course.processing && (
                    <Badge className="ml-2 bg-orange-100 text-orange-800">
                      <Clock className="w-3 h-3 mr-1" />
                      Processing
                    </Badge>
                  )}
                </div>
                <Button
                  variant={course.enabled === false ? "outline" : "default"}
                  size="sm"
                  onClick={() =>
                    setCourses(
                      courses.map((c, i) =>
                        (c.id !== undefined ? c.id : i) ===
                        (course.id !== undefined ? course.id : index)
                          ? {
                              ...c,
                              enabled: c.enabled === false ? true : false,
                            }
                          : c
                      )
                    )
                  }
                  className={
                    course.enabled === false
                      ? "text-gray-500 border-gray-400"
                      : "bg-emerald-500 text-white"
                  }
                >
                  {course.enabled === undefined || course.enabled
                    ? "Disable"
                    : "Enable"}
                </Button>
              </div>
            </div>
          ))}

          {isAdding ? (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg space-y-3">
              <Input
                placeholder="Course name"
                value={newCourse.course}
                onChange={(e) =>
                  setNewCourse((prev) => ({ ...prev, course: e.target.value }))
                }
              />
              <div className="flex gap-2">
                <Button
                  onClick={addCourse}
                  size="sm"
                  className="bg-blue-400 hover:bg-blue-600"
                >
                  Add Course
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
              Add New Course
            </Button>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-blue-400 hover:bg-blue-600"
            >
              Save Changes
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
      link:
        project.link ||
        project.demoLink ||
        project.demo ||
        project.github ||
        project.url ||
        "",
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
    const normalizedLink =
      typeof trimmed.link === "string" ? trimmed.link : "";
    return {
      ...existing,
      ...trimmed,
      title: trimmed.title || existing.title || "",
      organization: trimmed.organization || existing.organization || "",
      duration: trimmed.duration || existing.duration || "",
      status: trimmed.status || existing.status || "",
      description: trimmed.description || existing.description || "",
      link: normalizedLink,
      demoLink: normalizedLink,
      demo: normalizedLink,
      github: normalizedLink,
      url: normalizedLink,
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
              }
            : proj
        )
      );
    } else {
      setProjectsList((prev) => [
        ...prev,
        {
          ...newProject,
          id: Date.now(),
          enabled: true,
          processing: true,
        },
      ]);
    }

    toast({
      title: editingIndex !== null ? "Project Updated" : "Project Added",
      description: "Your project details are being processed for verification.",
    });

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

    const formatted = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value,
      ])
    );

    if (editingIndex !== null) {
      setCertificates((prev) =>
        prev.map((cert, idx) =>
          idx === editingIndex
            ? {
                ...(cert || {}),
                ...formatted,
                status: cert?.status || "pending",
                enabled: cert?.enabled === false ? false : true,
              }
            : cert
        )
      );
    } else {
      setCertificates((prev) => [
        ...prev,
        {
          ...formatted,
          status: "pending",
          id: Date.now(),
          enabled: true,
          processing: true,
        },
      ]);
    }

    toast({
      title:
        editingIndex !== null ? "Certificate Updated" : "Certificate Added",
      description:
        "Your certificate details are being processed for verification.",
    });

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
      console.log("📝 PersonalInfoEditModal: Initializing with data:", data);
      console.log("📝 Data keys:", Object.keys(data));

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
        console.log("📝 NM ID extracted:", nmId);
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

      console.log("📝 Form values extracted:", formValues);
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
    console.log("💾 PersonalInfoEditModal: Saving personal info:", formData);

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
                  onChange={(e) => handleInputChange("github_link", e.target.value)}
                  placeholder="https://github.com/yourusername"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolio_link">Portfolio Website</Label>
                <Input
                  id="portfolio_link"
                  type="url"
                  value={formData.portfolio_link}
                  onChange={(e) => handleInputChange("portfolio_link", e.target.value)}
                  placeholder="https://yourportfolio.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin_link">LinkedIn Profile</Label>
                <Input
                  id="linkedin_link"
                  type="url"
                  value={formData.linkedin_link}
                  onChange={(e) => handleInputChange("linkedin_link", e.target.value)}
                  placeholder="https://linkedin.com/in/yourusername"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter_link">Twitter/X Profile</Label>
                <Input
                  id="twitter_link"
                  type="url"
                  value={formData.twitter_link}
                  onChange={(e) => handleInputChange("twitter_link", e.target.value)}
                  placeholder="https://twitter.com/yourusername"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram_link">Instagram Profile</Label>
                <Input
                  id="instagram_link"
                  type="url"
                  value={formData.instagram_link}
                  onChange={(e) => handleInputChange("instagram_link", e.target.value)}
                  placeholder="https://instagram.com/yourusername"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook_link">Facebook Profile</Label>
                <Input
                  id="facebook_link"
                  type="url"
                  value={formData.facebook_link}
                  onChange={(e) => handleInputChange("facebook_link", e.target.value)}
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
