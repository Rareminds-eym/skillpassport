// Field configurations for each profile type
import { BookOpen, Briefcase, Award, FolderGit2, CheckCircle, User, GraduationCap } from "lucide-react";

export const FIELD_CONFIGS = {
  education: {
    title: "Education",
    icon: GraduationCap,
    listKey: "educationList",
    emptyMessage: "No education records yet",
    addButtonText: "Add Education",
    fields: [
      { name: "degree", label: "Degree *", type: "text", required: true, placeholder: "e.g., Bachelor of Science" },
      { name: "university", label: "University *", type: "text", required: true, placeholder: "e.g., MIT" },
      { name: "department", label: "Department", type: "text", placeholder: "e.g., Computer Science" },
      { name: "yearOfPassing", label: "Year of Passing", type: "text", placeholder: "e.g., 2024" },
      { name: "cgpa", label: "CGPA/Grade", type: "text", placeholder: "e.g., 3.8" },
      { 
        name: "level", 
        label: "Level", 
        type: "select", 
        options: ["High School", "Associate", "Bachelor's", "Master's", "PhD", "Certificate", "Diploma"],
        defaultValue: "Bachelor's"
      },
      { 
        name: "status", 
        label: "Status", 
        type: "select", 
        options: ["ongoing", "completed"],
        defaultValue: "ongoing"
      },
    ],
    getDefaultValues: () => ({
      degree: "",
      department: "",
      university: "",
      yearOfPassing: "",
      cgpa: "",
      level: "Bachelor's",
      status: "ongoing",
    }),
    getDisplayTitle: (item) => item.degree || "Untitled",
    getDisplaySubtitle: (item) => item.university || "",
  },

  training: {
    title: "Training & Courses",
    icon: BookOpen,
    listKey: "courses",
    emptyMessage: "No training records yet",
    addButtonText: "Add Training Course",
    fields: [
      { name: "course", label: "Course Name *", type: "text", required: true, placeholder: "e.g., Advanced React" },
      { name: "provider", label: "Provider *", type: "text", required: true, placeholder: "e.g., Coursera, Udemy, Rareminds" },
      { name: "startDate", label: "Start Date", type: "date" },
      { name: "endDate", label: "End Date", type: "date", dependsOn: { field: "status", value: "completed" } },
      { 
        name: "status", 
        label: "Status", 
        type: "select", 
        options: ["ongoing", "completed"],
        defaultValue: "ongoing"
      },
      { name: "completedModules", label: "Modules Completed", type: "number", placeholder: "10" },
      { name: "totalModules", label: "Total Modules", type: "number", placeholder: "12" },
      { name: "hoursSpent", label: "Hours Spent", type: "number", placeholder: "24" },
      { name: "skills", label: "Skills Covered", type: "skills_manager", placeholder: "Add skills developed in this course" },
      { name: "description", label: "Description", type: "textarea", placeholder: "Brief description..." },
    ],
    getDefaultValues: () => ({
      course: "",
      provider: "",
      startDate: "",
      endDate: "",
      status: "ongoing",
      completedModules: "",
      totalModules: "",
      hoursSpent: "",
      skills: "",
      skillsList: [],
      newSkillName: "",
      newSkillType: "soft",
      newSkillLevel: "3",
      newSkillDescription: "",
      description: "",
      duration: "",
    }),
    getDisplayTitle: (item) => item.course || "Untitled",
    getDisplaySubtitle: (item) => item.provider || "",
    hasProgress: true,
    calculateDuration: true,
  },

  experience: {
    title: "Experience",
    icon: Briefcase,
    listKey: "experiences",
    emptyMessage: "No experience records yet",
    addButtonText: "Add Experience",
    fields: [
      { name: "role", label: "Role/Position *", type: "text", required: true, placeholder: "e.g., Software Engineer" },
      { name: "organization", label: "Organization *", type: "text", required: true, placeholder: "e.g., Google" },
      { name: "start_date", label: "Start Date", type: "date" },
      { name: "end_date", label: "End Date", type: "date" },
      { name: "description", label: "Description", type: "textarea", placeholder: "Describe your responsibilities..." },
    ],
    getDefaultValues: () => ({
      role: "",
      organization: "",
      start_date: "",
      end_date: "",
      description: "",
    }),
    getDisplayTitle: (item) => item.role || "Untitled",
    getDisplaySubtitle: (item) => item.organization || "",
    calculateDuration: true,
  },

  projects: {
    title: "Projects",
    icon: FolderGit2,
    listKey: "projectsList",
    emptyMessage: "No projects yet",
    addButtonText: "Add Project",
    fields: [
      { name: "title", label: "Project Title *", type: "text", required: true, placeholder: "e.g., E-commerce Platform" },
      { name: "description", label: "Description", type: "textarea", placeholder: "Describe your project..." },
      { name: "technologies", label: "Technologies Used", type: "tags", placeholder: "React, Node.js, MongoDB" },
      { name: "role", label: "Your Role", type: "text", placeholder: "e.g., Lead Developer" },
      { name: "startDate", label: "Start Date", type: "date" },
      { name: "endDate", label: "End Date", type: "date" },
      { name: "githubUrl", label: "GitHub URL", type: "url", placeholder: "https://github.com/..." },
      { name: "demoUrl", label: "Demo URL", type: "url", placeholder: "https://..." },
    ],
    getDefaultValues: () => ({
      title: "",
      description: "",
      technologies: "",
      role: "",
      startDate: "",
      endDate: "",
      githubUrl: "",
      demoUrl: "",
    }),
    getDisplayTitle: (item) => item.title || "Untitled",
    getDisplaySubtitle: (item) => item.role || "",
    calculateDuration: true,  // Enable duration calculation
  },

  certificates: {
    title: "Certificates",
    icon: Award,
    listKey: "certificates",
    emptyMessage: "No certificates yet",
    addButtonText: "Add Certificate",
    fields: [
      { name: "title", label: "Certificate Name *", type: "text", required: true, placeholder: "e.g., AWS Solutions Architect" },
      { name: "issuer", label: "Issuing Organization *", type: "text", required: true, placeholder: "e.g., Amazon Web Services" },
      { name: "credentialId", label: "Credential ID", type: "text", placeholder: "e.g., ABC123XYZ" },
      { name: "issuedOn", label: "Issue Date", type: "date" },
      { name: "expiryDate", label: "Expiry Date", type: "date" },
      { name: "link", label: "Credential URL", type: "url", placeholder: "https://..." },
      { name: "description", label: "Description", type: "textarea", placeholder: "Describe what you learned or achieved..." },
      { name: "category", label: "Category", type: "text", placeholder: "e.g., Cloud Computing, Programming" },
      { name: "level", label: "Level", type: "text", placeholder: "e.g., Beginner, Intermediate, Advanced" },
      { name: "platform", label: "Platform", type: "text", placeholder: "e.g., Coursera, Udemy, AWS" },
      { name: "instructor", label: "Instructor", type: "text", placeholder: "e.g., John Doe" },
    ],
    getDefaultValues: () => ({
      title: "",
      issuer: "",
      issuedOn: "",
      expiryDate: "",
      credentialId: "",
      link: "",
      description: "",
      category: "",
      level: "",
      platform: "",
      instructor: "",
    }),
    getDisplayTitle: (item) => item.title || item.name || "Untitled",
    getDisplaySubtitle: (item) => item.issuer || "",
  },

  skills: {
    title: "Skills",
    icon: CheckCircle,
    listKey: "skillsList",
    emptyMessage: "No skills added yet",
    addButtonText: "Add Skill",
    fields: [
      { name: "name", label: "Skill Name *", type: "text", required: true, placeholder: "e.g., JavaScript" },
      { 
        name: "level", 
        label: "Proficiency Level", 
        type: "select", 
        options: ["Beginner", "Intermediate", "Advanced", "Expert"],
        defaultValue: "Intermediate"
      },
      { 
        name: "rating", 
        label: "Rate your Skill level (1–5)", 
        type: "select", 
        options: ["1", "2", "3", "4", "5"],
        defaultValue: "3"
      },
      // { 
      //   name: "category", 
      //   label: "Category", 
      //   type: "select", 
      //   options: ["Technical", "Soft Skills", "Tools", "Languages", "Other"],
      //   defaultValue: "Technical"
      // },
      { name: "description", label: "Description", type: "textarea", placeholder: "Describe your experience with this skill..." },
    ],
    getDefaultValues: () => ({
      name: "",
      type: "technical",
      level: "Intermediate",
      rating: "3",
      // category: "Technical",
      description: "",
    }),
    getDisplayTitle: (item) => item.name || "Untitled",
    getDisplaySubtitle: (item) => "", // Remove level display to hide numbers
  },

  softSkills: {
    title: "Soft Skills",
    icon: CheckCircle,
    listKey: "softSkillsList",
    emptyMessage: "No soft skills added yet",
    addButtonText: "Add Soft Skill",
    fields: [
      { name: "name", label: "Skill Name *", type: "text", required: true, placeholder: "e.g., Leadership, Communication" },
      { 
        name: "level", 
        label: "Proficiency Level", 
        type: "select", 
        options: ["Beginner", "Intermediate", "Advanced", "Expert"],
        defaultValue: "Intermediate"
      },
      { 
        name: "rating", 
        label: "Rate your Skill level (1–5)", 
        type: "select", 
        options: ["1", "2", "3", "4", "5"],
        defaultValue: "3"
      },
      { name: "description", label: "Description", type: "textarea", placeholder: "Describe how you've developed and applied this skill..." },
      { name: "examples", label: "Examples/Evidence", type: "textarea", placeholder: "Provide specific examples or situations where you demonstrated this skill..." },
    ],
    getDefaultValues: () => ({
      name: "",
      type: "soft",
      level: "Intermediate",
      rating: "3",
      description: "",
      examples: "",
    }),
    getDisplayTitle: (item) => item.name || "Untitled",
    getDisplaySubtitle: (item) => "", // Remove level display to hide numbers
  },

  technicalSkills: {
    title: "Technical Skills",
    icon: CheckCircle,
    listKey: "technicalSkillsList",
    emptyMessage: "No technical skills added yet",
    addButtonText: "Add Technical Skill",
    fields: [
      { name: "name", label: "Skill Name *", type: "text", required: true, placeholder: "e.g., React, Python, AWS" },
      { 
        name: "level", 
        label: "Proficiency Level", 
        type: "select", 
        options: ["Beginner", "Intermediate", "Advanced", "Expert"],
        defaultValue: "Intermediate"
      },
      { 
        name: "rating", 
        label: "Rate your Skill level (1–5)", 
        type: "select", 
        options: ["1", "2", "3", "4", "5"],
        defaultValue: "3"
      },
      // { 
      //   name: "category", 
      //   label: "Category", 
      //   type: "select", 
      //   options: ["Programming", "Framework", "Database", "Tools", "Cloud", "Other"],
      //   defaultValue: "Programming"
      // },
      { name: "yearsOfExperience", label: "Years of Experience", type: "number", placeholder: "2" },
      { name: "description", label: "Description", type: "textarea", placeholder: "Describe your experience and projects with this technology..." },
      { name: "certifications", label: "Related Certifications", type: "text", placeholder: "Any certifications related to this skill..." },
    ],
    getDefaultValues: () => ({
      name: "",
      type: "technical",
      level: "Intermediate",
      rating: "3",
      // category: "Programming",
      yearsOfExperience: "",
      description: "",
      certifications: "",
    }),
    getDisplayTitle: (item) => item.name || "Untitled",
    getDisplaySubtitle: (item) => "", // Remove level display to hide numbers
  },

  personalInfo: {
    title: "Personal Information",
    icon: User,
    listKey: null, // Single object, not a list
    isSingleItem: true,
    fields: [
      { name: "name", label: "Full Name *", type: "text", required: true, placeholder: "John Doe" },
      { name: "email", label: "Email", type: "text", placeholder: "john@example.com", disabled: true },
      { name: "phone", label: "Phone", type: "text", placeholder: "+1 234 567 8900" },
      { name: "location", label: "Location", type: "text", placeholder: "New York, USA" },
      { name: "bio", label: "Bio", type: "textarea", placeholder: "Tell us about yourself..." },
      { name: "linkedinUrl", label: "LinkedIn URL", type: "url", placeholder: "https://linkedin.com/in/..." },
      { name: "githubUrl", label: "GitHub URL", type: "url", placeholder: "https://github.com/..." },
      { name: "portfolioUrl", label: "Portfolio URL", type: "url", placeholder: "https://..." },
    ],
    getDefaultValues: () => ({
      name: "",
      email: "",
      phone: "",
      location: "",
      bio: "",
      linkedinUrl: "",
      githubUrl: "",
      portfolioUrl: "",
    }),
    getDisplayTitle: (item) => item.name || "Personal Information",
    getDisplaySubtitle: (item) => item.email || "",
  },
};

export default FIELD_CONFIGS;
