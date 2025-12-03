import React, { useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, X, Shield } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { validateTeacherOnboarding, validateDocument } from "../../../../utils/teacherValidation";
import { useUserRole } from "../../../../hooks/useUserRole";
import RoleDebugger from "../../../../components/debug/RoleDebugger";

interface SubjectExpertise {
  name: string;
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
  years_experience: number;
}

interface ClassAssignment {
  class_name: string;
  subject: string;
}

interface Experience {
  organization: string;
  position: string;
  start_date: string;
  end_date: string;
  description: string;
}

const TeacherOnboardingPage: React.FC = () => {
  const { role, canAddTeacher, canApproveTeacher, isPrincipal, isITAdmin, isSchoolAdmin, loading: roleLoading } = useUserRole();
  const [currentSection, setCurrentSection] = useState<"personal" | "subjects" | "experience" | "documents">("personal");
  const [generatedTeacherId, setGeneratedTeacherId] = useState<string>("");
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    address: "",
    qualification: "",
    role: "subject_teacher" as "school_admin" | "principal" | "it_admin" | "class_teacher" | "subject_teacher",
  });

  const [documents, setDocuments] = useState({
    degree_certificate: null as File | null,
    id_proof: null as File | null,
    experience_letters: [] as File[],
  });

  const [subjects, setSubjects] = useState<SubjectExpertise[]>([]);
  const [classes, setClasses] = useState<ClassAssignment[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  
  const [currentSubject, setCurrentSubject] = useState<SubjectExpertise>({
    name: "",
    proficiency: "intermediate",
    years_experience: 0,
  });

  const [currentClass, setCurrentClass] = useState<ClassAssignment>({
    class_name: "",
    subject: "",
  });

  const [currentExperience, setCurrentExperience] = useState<Experience>({
    organization: "",
    position: "",
    start_date: "",
    end_date: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleFileChange = (field: keyof typeof documents, files: FileList | null) => {
    if (!files) return;

    // Validate each file
    const fileArray = Array.from(files);
    const errors: string[] = [];
    
    fileArray.forEach(file => {
      const validation = validateDocument(file, true);
      if (!validation.isValid) {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });
    
    if (errors.length > 0) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: errors.join(", ")
      }));
      setMessage({
        type: "error",
        text: errors.join("; ")
      });
      return;
    }

    // Clear validation error for this field
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });

    if (field === "experience_letters") {
      setDocuments((prev) => ({
        ...prev,
        experience_letters: [...prev.experience_letters, ...fileArray],
      }));
    } else {
      setDocuments((prev) => ({ ...prev, [field]: fileArray[0] }));
    }
  };

  const removeExperienceLetter = (index: number) => {
    setDocuments((prev) => ({
      ...prev,
      experience_letters: prev.experience_letters.filter((_, i) => i !== index),
    }));
  };

  const addSubject = () => {
    if (!currentSubject.name.trim()) return;
    setSubjects([...subjects, currentSubject]);
    setCurrentSubject({ name: "", proficiency: "intermediate", years_experience: 0 });
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const addClass = () => {
    if (!currentClass.class_name.trim() || !currentClass.subject.trim()) return;
    setClasses([...classes, currentClass]);
    setCurrentClass({ class_name: "", subject: "" });
  };

  const removeClass = (index: number) => {
    setClasses(classes.filter((_, i) => i !== index));
  };

  const addExperience = () => {
    if (!currentExperience.organization.trim() || !currentExperience.position.trim()) return;
    setExperiences([...experiences, currentExperience]);
    setCurrentExperience({ organization: "", position: "", start_date: "", end_date: "", description: "" });
  };

  const removeExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("teacher-documents")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("teacher-documents").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent, action: "draft" | "submit" | "approve" | "reject") => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setValidationErrors({});

    // Validate all fields
    const validation = validateTeacherOnboarding({
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      subjects: subjects,
      degree_certificate: documents.degree_certificate,
      id_proof: documents.id_proof,
      // Optional: Add school domain check
      // schoolDomain: "yourschool.edu"
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setMessage({
        type: "error",
        text: "Please fix the validation errors before submitting."
      });
      setLoading(false);
      return;
    }

    try {
      // Upload documents (only if provided)
      const degreeUrl = documents.degree_certificate
        ? await uploadFile(documents.degree_certificate, "degrees")
        : null;

      const idProofUrl = documents.id_proof
        ? await uploadFile(documents.id_proof, "id-proofs")
        : null;

      const experienceUrls = documents.experience_letters.length > 0
        ? await Promise.all(
            documents.experience_letters.map((file) => uploadFile(file, "experience-letters"))
          )
        : [];

      // Get current user from localStorage (custom auth)
      const userStr = localStorage.getItem('user');
      const userEmail = localStorage.getItem('userEmail');
      
      console.log("User from localStorage:", userStr);
      console.log("User email:", userEmail);
      
      if (!userEmail) {
        throw new Error("User not authenticated. Please log in again.");
      }

      // Get school_id from school_educators table using email
      const { data: educatorData, error: educatorError } = await supabase
        .from("school_educators")
        .select("school_id, user_id")
        .eq("email", userEmail)
        .maybeSingle();

      console.log("Educator data:", educatorData);
      console.log("Educator error:", educatorError);

      let schoolId = educatorData?.school_id;

      // If not found in school_educators, check schools table
      if (!schoolId) {
        console.log("Not found in school_educators, checking schools table...");
        const { data: schoolData, error: schoolError } = await supabase
          .from("schools")
          .select("id")
          .eq("email", userEmail)
          .maybeSingle();

        if (schoolData?.id) {
          schoolId = schoolData.id;
          console.log("Found school_id from schools table:", schoolId);
        } else {
          // Also try principal_email
          const { data: schoolByPrincipal } = await supabase
            .from("schools")
            .select("id")
            .eq("principal_email", userEmail)
            .maybeSingle();

          if (schoolByPrincipal?.id) {
            schoolId = schoolByPrincipal.id;
            console.log("Found school_id from principal_email:", schoolId);
          }
        }
      }

      if (!schoolId) {
        console.error(`No school found for email: ${userEmail}`);
        throw new Error("School ID not found. Please ensure you're logged in as a school admin.");
      }

      console.log("Using school_id:", schoolId);

      // Determine status based on action
      let status = "pending";
      if (action === "draft") status = "pending";
      else if (action === "submit") status = "documents_uploaded";
      else if (action === "approve") status = "active";
      else if (action === "reject") status = "inactive";

      // Step 1: Create Supabase Auth user
      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + "Temp@123";
      
      console.log("Creating auth user for:", formData.email);
      
      // Note: This will send a confirmation email to the teacher
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: 'educator',
          school_id: schoolId,
        }
      });

      if (authError) {
        // If admin API is not available, try regular signup
        console.warn("Admin API not available, trying regular signup:", authError);
        
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email: formData.email,
          password: tempPassword,
          options: {
            data: {
              first_name: formData.first_name,
              last_name: formData.last_name,
              role: 'educator',
              school_id: schoolId,
            }
          }
        });

        if (signupError) {
          throw new Error(`Failed to create auth user: ${signupError.message}`);
        }

        if (!signupData.user) {
          throw new Error("Failed to create auth user");
        }

        // Use the signup user
        var userId = signupData.user.id;
      } else {
        if (!authData.user) {
          throw new Error("Failed to create auth user");
        }
        var userId = authData.user.id;
      }

      console.log("Created auth user:", userId);

      // Step 2: Create user record in users table
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .insert({
          id: userId,
          email: formData.email,
          role: 'school_educator',
        })
        .select()
        .single();

      if (userError) {
        console.error("Failed to create user record:", userError);
        // Note: Auth user already created, cannot easily rollback
        throw new Error(`Failed to create user record: ${userError.message}`);
      }

      console.log("Created user record:", userRecord);

      // Step 3: Create educator record in school_educators table
      const { data: teacher, error: teacherError } = await supabase
        .from("school_educators")
        .insert({
          user_id: userId,
          school_id: schoolId,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone_number: formData.phone || null,
          dob: formData.date_of_birth || null,
          address: formData.address || null,
          qualification: formData.qualification || null,
          role: formData.role,
          degree_certificate_url: degreeUrl,
          id_proof_url: idProofUrl,
          experience_letters_url: experienceUrls.length > 0 ? experienceUrls : null,
          subject_expertise: subjects,
          onboarding_status: status,
          metadata: {
            temporary_password: tempPassword,
            password_created_at: new Date().toISOString(),
            created_by: userEmail,
          }
        })
        .select()
        .single();

      if (teacherError) {
        // Rollback: delete user record
        await supabase.from("users").delete().eq("id", userId);
        console.error("Failed to create educator record:", teacherError);
        throw new Error(`Failed to create educator record: ${teacherError.message}`);
      }

      setGeneratedTeacherId(teacher.teacher_id || "N/A");
      setMessage({
        type: "success",
        text: `Teacher ${action === "draft" ? "saved as draft" : action === "approve" ? "approved" : action === "reject" ? "rejected" : "onboarded"} successfully! Teacher ID: ${teacher.teacher_id || "N/A"}. Login credentials sent to ${formData.email}. Temporary password: ${tempPassword}`,
      });

      // Reset form
      setFormData({ first_name: "", last_name: "", email: "", phone: "", date_of_birth: "", address: "", qualification: "", role: "subject_teacher" });
      setDocuments({ degree_certificate: null, id_proof: null, experience_letters: [] });
      setSubjects([]);
      setClasses([]);
      setExperiences([]);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to onboard teacher" });
    } finally {
      setLoading(false);
    }
  };

  // Check permissions
  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!canAddTeacher()) {
    return (
      <>
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Access Denied</h3>
            <p className="text-red-700">
              You don't have permission to add teachers. Only School Admin, Principal, and IT Admin can add teachers.
            </p>
          </div>
        </div>
        <RoleDebugger />
      </>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Teacher Onboarding
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Add new teachers with documents and subject expertise
        </p>
        <div className="mt-2 flex items-center gap-2">
          <Shield className="h-4 w-4 text-indigo-600" />
          <span className="text-sm text-indigo-600 font-medium">
            Your Role: {role === 'school_admin' ? 'School Admin' : role === 'principal' ? 'Principal' : 'IT Admin'} 
            {canApproveTeacher() ? ' (Can Create & Approve)' : ' (Can Create Only)'}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium">{message.text}</p>
              {Object.keys(validationErrors).length > 0 && (
                <ul className="mt-2 space-y-1 text-sm">
                  {Object.entries(validationErrors).map(([field, error]) => (
                    <li key={field} className="flex items-start gap-2">
                      <span className="font-semibold capitalize">{field.replace(/_/g, ' ')}:</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, canApproveTeacher() ? "approve" : "submit")} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teacher Role *
              </label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="subject_teacher">Subject Teacher</option>
                <option value="class_teacher">Class Teacher</option>
                {(isSchoolAdmin || isPrincipal) && <option value="it_admin">IT Admin</option>}
                {(isSchoolAdmin || isPrincipal) && <option value="principal">Principal</option>}
                {(isSchoolAdmin || isPrincipal) && <option value="school_admin">School Admin</option>}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {formData.role === 'school_admin' && 'Full access: Can add teachers, approve classes, and approve timetables'}
                {formData.role === 'principal' && 'Full access: Can add teachers, approve classes, and approve timetables'}
                {formData.role === 'it_admin' && 'Can add teachers, create class assignments, and update timetables'}
                {formData.role === 'class_teacher' && 'Can view timetables only'}
                {formData.role === 'subject_teacher' && 'Can view timetables only'}
              </p>
            </div>
          </div>
        </div>

        {/* Document Upload */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents (Optional)</h3>
          <div className="space-y-4">
            {/* Degree Certificate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Degree Certificate
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 cursor-pointer transition">
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {documents.degree_certificate?.name || "Upload degree certificate"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange("degree_certificate", e.target.files)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* ID Proof */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID Proof</label>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 cursor-pointer transition">
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {documents.id_proof?.name || "Upload ID proof"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange("id_proof", e.target.files)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Experience Letters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Letters
              </label>
              <div className="space-y-2">
                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 cursor-pointer transition">
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Upload experience letters</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange("experience_letters", e.target.files)}
                    className="hidden"
                  />
                </label>
                {documents.experience_letters.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExperienceLetter(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Subject Expertise */}
        <div className={`bg-gray-50 rounded-xl p-6 border ${validationErrors.subjects ? 'border-red-300' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Subject Expertise *</h3>
            {validationErrors.subjects && (
              <span className="text-sm text-red-600 font-medium">{validationErrors.subjects}</span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <input
              type="text"
              placeholder="Subject name"
              value={currentSubject.name}
              onChange={(e) => setCurrentSubject({ ...currentSubject, name: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={currentSubject.proficiency}
              onChange={(e) =>
                setCurrentSubject({
                  ...currentSubject,
                  proficiency: e.target.value as any,
                })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
            <input
              type="number"
              placeholder="Years"
              min="0"
              value={currentSubject.years_experience}
              onChange={(e) =>
                setCurrentSubject({
                  ...currentSubject,
                  years_experience: parseInt(e.target.value) || 0,
                })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={addSubject}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Add Subject
            </button>
          </div>

          <div className="space-y-2">
            {subjects.map((subject, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-4">
                  <span className="font-medium text-gray-900">{subject.name}</span>
                  <span className="text-sm text-gray-600 capitalize">{subject.proficiency}</span>
                  <span className="text-sm text-gray-500">{subject.years_experience} years</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeSubject(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3">
          {!canApproveTeacher() && (
            <button
              type="button"
              onClick={(e) => handleSubmit(e, "draft")}
              disabled={loading}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
            >
              {loading ? "Saving..." : "Save as Draft"}
            </button>
          )}
          <button
            type="button"
            onClick={(e) => handleSubmit(e, canApproveTeacher() ? "approve" : "submit")}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
          >
            {loading ? "Processing..." : canApproveTeacher() ? "Create & Approve" : "Submit for Approval"}
          </button>
        </div>
        
        {!canApproveTeacher() && (
          <p className="text-sm text-gray-600 text-right mt-2">
            Note: Teacher will need Principal approval before becoming active
          </p>
        )}
      </form>
      </div>
    </div>
  );
};

export default TeacherOnboardingPage;
