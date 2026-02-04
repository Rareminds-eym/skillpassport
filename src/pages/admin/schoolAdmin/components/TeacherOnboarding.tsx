import { AlertCircle, CheckCircle, FileText, Shield, Upload, X } from "lucide-react";
import React, { useState } from "react";
import RoleDebugger from "../../../../components/debug/RoleDebugger";
import { useUserRole } from "../../../../hooks/useUserRole";
import { supabase } from "../../../../lib/supabaseClient";
import storageService from "../../../../services/storageService";
// @ts-ignore - userApiService is a .js file
import { createTeacher } from "../../../../services/userApiService";
import { validateDocument } from "../../../../utils/teacherValidation";

interface SubjectExpertise {
  name: string;
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
  years_experience: number;
}

interface DocumentUploadProgress {
  file: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

const TeacherOnboardingPage: React.FC = () => {
  const { role, canAddTeacher, canApproveTeacher, isPrincipal, isSchoolAdmin, loading: roleLoading } = useUserRole();
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    designation: "",
    department: "",
    qualification: "",
    specialization: "",
    experience_years: 0,
    role: "subject_teacher" as "school_admin" | "principal" | "it_admin" | "class_teacher" | "subject_teacher",
    // Additional personal information
    employee_id: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    dob: "",
    country: "",
    pincode: "",
  });

  const [documents, setDocuments] = useState({
    degree_certificate: null as File | null,
    id_proof: null as File | null,
    experience_letters: [] as File[],
  });

  const [subjects, setSubjects] = useState<SubjectExpertise[]>([]);
  
  const [currentSubject, setCurrentSubject] = useState<SubjectExpertise>({
    name: "",
    proficiency: "intermediate",
    years_experience: 0,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [documentUploadProgress, setDocumentUploadProgress] = useState<DocumentUploadProgress[]>([]);
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);

  // Helper function to format phone number
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters except +
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // If it starts with +, keep it
    if (cleaned.startsWith('+')) {
      const digits = cleaned.slice(1);
      if (digits.length <= 2) return `+${digits}`;
      if (digits.length <= 5) return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
      return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7, 12)}`;
    }
    
    // For regular numbers, format as groups
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    if (cleaned.length <= 10) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
  };

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
      setMessage({
        type: "error",
        text: errors.join("; ")
      });
      return;
    }

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

  // Upload documents after teacher creation
  const uploadDocumentsAfterTeacherCreation = async (teacherId: string): Promise<{
    degreeUrl: string | null;
    idProofUrl: string | null;
    experienceUrls: string[];
  }> => {
    const allFiles: File[] = [];
    const fileTypes: string[] = [];

    // Collect all files with their types
    if (documents.degree_certificate) {
      allFiles.push(documents.degree_certificate);
      fileTypes.push('degree');
    }
    if (documents.id_proof) {
      allFiles.push(documents.id_proof);
      fileTypes.push('id-proof');
    }
    documents.experience_letters.forEach(file => {
      allFiles.push(file);
      fileTypes.push('experience');
    });

    if (allFiles.length === 0) {
      return { degreeUrl: null, idProofUrl: null, experienceUrls: [] };
    }

    setIsUploadingDocuments(true);
    
    // Initialize progress tracking
    const progressTracking: DocumentUploadProgress[] = allFiles.map(file => ({
      file: file.name,
      progress: 0,
      status: 'uploading'
    }));
    setDocumentUploadProgress(progressTracking);

    const results = {
      degreeUrl: null as string | null,
      idProofUrl: null as string | null,
      experienceUrls: [] as string[]
    };

    try {
      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];
        const fileType = fileTypes[i];
        
        // Update progress
        setDocumentUploadProgress(prev => 
          prev.map((item, idx) => 
            idx === i ? { ...item, progress: 10, status: 'uploading' } : item
          )
        );

        try {
          // Upload to storage service with real teacher ID
          const result = await storageService.uploadTeacherDocument(file, teacherId, fileType);
          
          if (result.success && result.url) {
            // Store URL based on file type
            if (fileType === 'degree') {
              results.degreeUrl = result.url;
            } else if (fileType === 'id-proof') {
              results.idProofUrl = result.url;
            } else if (fileType === 'experience') {
              results.experienceUrls.push(result.url);
            }

            // Update progress to completed
            setDocumentUploadProgress(prev => 
              prev.map((item, idx) => 
                idx === i ? { ...item, progress: 100, status: 'completed' } : item
              )
            );
          } else {
            // Update progress to error
            setDocumentUploadProgress(prev => 
              prev.map((item, idx) => 
                idx === i ? { 
                  ...item, 
                  progress: 0, 
                  status: 'error', 
                  error: result.error || 'Upload failed' 
                } : item
              )
            );
          }
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          setDocumentUploadProgress(prev => 
            prev.map((item, idx) => 
              idx === i ? { 
                ...item, 
                progress: 0, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Upload failed' 
              } : item
            )
          );
        }
      }
    } finally {
      setIsUploadingDocuments(false);
    }

    return results;
  };

  const handleSubmit = async (e: React.FormEvent, action: "draft" | "submit" | "approve" | "reject") => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Basic validation
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone_number || !formData.designation || !formData.department || !formData.qualification || !formData.dob) {
      const missingFields = [];
      if (!formData.first_name) missingFields.push("First Name");
      if (!formData.last_name) missingFields.push("Last Name");
      if (!formData.email) missingFields.push("Email");
      if (!formData.phone_number) missingFields.push("Phone Number");
      if (!formData.designation) missingFields.push("Designation");
      if (!formData.department) missingFields.push("Department");
      if (!formData.qualification) missingFields.push("Qualification");
      if (!formData.dob) missingFields.push("Date of Birth");
      
      setMessage({
        type: "error",
        text: `Please fill in the following required fields: ${missingFields.join(", ")}`
      });
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage({
        type: "error",
        text: "Please enter a valid email address."
      });
      setLoading(false);
      return;
    }

    // Phone number validation
    const phoneDigitsOnly = formData.phone_number.replace(/[^\d]/g, ''); // Extract only digits
    if (phoneDigitsOnly.length < 10 || phoneDigitsOnly.length > 15) {
      setMessage({
        type: "error",
        text: "Please enter a valid phone number with 10-15 digits."
      });
      setLoading(false);
      return;
    }

    // Check if phone number has valid format
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,15}$/;
    if (!phoneRegex.test(formData.phone_number)) {
      setMessage({
        type: "error",
        text: "Please enter a valid phone number format."
      });
      setLoading(false);
      return;
    }

    // Date of birth validation
    const today = new Date();
    const birthDate = new Date(formData.dob);
    const age = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    
    if (birthDate >= today) {
      setMessage({
        type: "error",
        text: "Date of birth must be in the past."
      });
      setLoading(false);
      return;
    }

    if (age < 18) {
      setMessage({
        type: "error",
        text: "Teacher must be at least 18 years old."
      });
      setLoading(false);
      return;
    }

    if (age > 100) {
      setMessage({
        type: "error",
        text: "Please enter a valid date of birth."
      });
      setLoading(false);
      return;
    }

    // Pincode validation (if provided)
    if (formData.pincode && !/^\d{5,6}$/.test(formData.pincode)) {
      setMessage({
        type: "error",
        text: "Please enter a valid pincode (5-6 digits)."
      });
      setLoading(false);
      return;
    }

    // Employee ID validation (if provided)
    if (formData.employee_id && formData.employee_id.length < 3) {
      setMessage({
        type: "error",
        text: "Employee ID must be at least 3 characters long."
      });
      setLoading(false);
      return;
    }

    // Experience years validation
    if (formData.experience_years < 0 || formData.experience_years > 50) {
      setMessage({
        type: "error",
        text: "Experience years must be between 0 and 50."
      });
      setLoading(false);
      return;
    }

    // Age vs Experience validation
    if (formData.experience_years > (age - 18)) {
      setMessage({
        type: "error",
        text: "Experience years cannot exceed working age (current age - 18)."
      });
      setLoading(false);
      return;
    }

    if (subjects.length === 0) {
      setMessage({
        type: "error",
        text: "Please add at least one subject expertise."
      });
      setLoading(false);
      return;
    }

    // Document validation
    if (!documents.degree_certificate) {
      setMessage({
        type: "error",
        text: "Please upload degree certificate."
      });
      setLoading(false);
      return;
    }

    if (!documents.id_proof) {
      setMessage({
        type: "error",
        text: "Please upload ID proof."
      });
      setLoading(false);
      return;
    }

    // Experience letters validation - only required if teacher has experience
    if (formData.experience_years > 0 && documents.experience_letters.length === 0) {
      setMessage({
        type: "error",
        text: "Please upload at least one experience letter since you have indicated work experience."
      });
      setLoading(false);
      return;
    }

    try {
      // Get current user from localStorage (custom auth) - MUST BE FIRST
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

      // If not found in school_educators, check organizations table
      if (!schoolId) {
        console.log("Not found in school_educators, checking organizations table...");
        const { data: { user } } = await supabase.auth.getUser();
        const { data: schoolData } = await supabase
          .from("organizations")
          .select("id")
          .eq("organization_type", "school")
          .or(`admin_id.eq.${user?.id},email.eq.${userEmail}`)
          .maybeSingle();

        if (schoolData?.id) {
          schoolId = schoolData.id;
          console.log("Found school_id from organizations table:", schoolId);
        }
      }

      if (!schoolId) {
        console.error(`No school found for email: ${userEmail}`);
        throw new Error("School ID not found. Please ensure you're logged in as a school admin.");
      }

      console.log("Using school_id:", schoolId);

      // Get auth token for worker API
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated. Please log in again.");
      }

      // Use Worker API to create teacher with proper rollback
      // Note: Worker expects data wrapped in a 'teacher' object
      const teacherData = {
        teacher: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone_number: formData.phone_number,
          qualification: formData.qualification,
          role: formData.role,
          designation: formData.designation,
          department: formData.department,
          specialization: formData.specialization,
          experience_years: formData.experience_years,
          date_of_joining: new Date().toISOString().split('T')[0], // Set current date as joining date
          subject_expertise: subjects, // Pass full subject expertise objects
          subjects_handled: subjects.map(s => s.name), // Also pass simple subject names for compatibility
          // Additional personal information
          employee_id: formData.employee_id,
          gender: formData.gender,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          dob: formData.dob,
          country: formData.country,
          pincode: formData.pincode,
        }
      };

      console.log('📤 Sending teacher data to API:', teacherData);

      const teacherResult = await createTeacher(teacherData, session.access_token);

      if (!teacherResult.success) {
        throw new Error(teacherResult.error || "Failed to create teacher");
      }

      const userId = teacherResult.data.authUserId;
      const teacherId = teacherResult.data.teacherId;
      const tempPassword = teacherResult.data.password;

      console.log("Created teacher via Worker API:", { userId, teacherId });

      // Step 2: Upload documents if any exist
      let documentUrls: {
        degreeUrl: string | null;
        idProofUrl: string | null;
        experienceUrls: string[];
      } = { degreeUrl: null, idProofUrl: null, experienceUrls: [] };
      const hasDocuments = documents.degree_certificate || documents.id_proof || documents.experience_letters.length > 0;
      
      if (hasDocuments) {
        console.log(`📁 Uploading documents for teacher ${teacherId}...`);
        
        try {
          documentUrls = await uploadDocumentsAfterTeacherCreation(teacherId);
          console.log('✅ Documents uploaded:', documentUrls);
        } catch (uploadError) {
          console.warn('⚠️ Document upload failed:', uploadError);
          // Don't fail the entire operation if document upload fails
          setMessage({
            type: "error",
            text: `Teacher created successfully, but some documents failed to upload: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`
          });
        }
      }

      // Step 3: Update teacher record with document URLs (if any were uploaded)
      if (documentUrls.degreeUrl || documentUrls.idProofUrl || documentUrls.experienceUrls.length > 0) {
        try {
          const { error: updateError } = await supabase
            .from("school_educators")
            .update({
              degree_certificate_url: documentUrls.degreeUrl,
              id_proof_url: documentUrls.idProofUrl,
              experience_letters_url: documentUrls.experienceUrls.length > 0 ? documentUrls.experienceUrls : null,
            })
            .eq('id', teacherId);

          if (updateError) {
            console.warn('⚠️ Failed to update teacher record with document URLs:', updateError);
            // Don't fail the operation, documents are uploaded but not linked
          } else {
            console.log('✅ Teacher record updated with document URLs');
          }
        } catch (updateError) {
          console.warn('⚠️ Failed to update teacher record with document URLs:', updateError);
        }
      }

      const documentCount = (documentUrls.degreeUrl ? 1 : 0) + (documentUrls.idProofUrl ? 1 : 0) + documentUrls.experienceUrls.length;
      const successMsg = documentCount > 0 
        ? `Teacher ${action === "draft" ? "saved as draft" : action === "approve" ? "approved" : action === "reject" ? "rejected" : "onboarded"} successfully with ${documentCount} document${documentCount > 1 ? 's' : ''}! Login credentials sent to ${formData.email}. Temporary password: ${tempPassword}`
        : `Teacher ${action === "draft" ? "saved as draft" : action === "approve" ? "approved" : action === "reject" ? "rejected" : "onboarded"} successfully! Login credentials sent to ${formData.email}. Temporary password: ${tempPassword}`;

      setMessage({
        type: "success",
        text: successMsg,
      });

      // Reset form
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        designation: "",
        department: "",
        qualification: "",
        specialization: "",
        experience_years: 0,
        role: "subject_teacher",
        // Additional personal information
        employee_id: "",
        gender: "",
        address: "",
        city: "",
        state: "",
        dob: "",
        country: "",
        pincode: "",
      });
      setDocuments({ degree_certificate: null, id_proof: null, experience_letters: [] });
      setSubjects([]);
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

      {/* Document Upload Progress (shown during upload after teacher creation) */}
      {isUploadingDocuments && documentUploadProgress.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900 mb-2">Uploading Documents...</p>
          <div className="space-y-2">
            {documentUploadProgress.map((progress, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-700 truncate max-w-xs">{progress.file}</span>
                    <span className="text-xs text-gray-500">
                      {progress.status === 'completed' ? '✓' : 
                       progress.status === 'error' ? '✗' : 
                       `${progress.progress}%`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        progress.status === 'completed' ? 'bg-green-500' :
                        progress.status === 'error' ? 'bg-red-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${progress.progress}%` }}
                    ></div>
                  </div>
                  {progress.error && (
                    <p className="text-xs text-red-600 mt-1">{progress.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                First Name <span className="text-red-500">*</span>
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
                Last Name <span className="text-red-500">*</span>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., teacher@school.com"
                title="Please enter a valid email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone_number}
                onChange={(e) => {
                  // Only allow digits, +, spaces, hyphens, and parentheses
                  let value = e.target.value.replace(/[^+\d\s\-\(\)]/g, '');
                  
                  // Count only digits for length validation
                  const digitsOnly = value.replace(/[^\d]/g, '');
                  
                  // Limit to 15 digits maximum
                  if (digitsOnly.length <= 15) {
                    setFormData({ ...formData, phone_number: value });
                  }
                }}
                onBlur={(e) => {
                  // Format the phone number when user leaves the field
                  const formatted = formatPhoneNumber(e.target.value);
                  setFormData({ ...formData, phone_number: formatted });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., +91 9876543210"
                maxLength={18} // Allow for formatting characters
                title="Please enter a valid phone number (10-15 digits)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Designation <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Senior Teacher"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Science"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qualification <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., M.Sc. Mathematics"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialization
              </label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Applied Mathematics, Theoretical Physics"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Experience (Years) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="50"
                required
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                title="Please enter experience between 0 and 50 years"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID
              </label>
              <input
                type="text"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., EMP001"
                minLength={3}
                title="Employee ID must be at least 3 characters long"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Full address"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Mumbai"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Maharashtra"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., India"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode
              </label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., 400001"
                pattern="\d{5,6}"
                title="Please enter a valid pincode (5-6 digits)"
                maxLength={6}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teacher Role <span className="text-red-500">*</span>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
          <div className="space-y-4">
            {/* Degree Certificate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Degree Certificate <span className="text-red-500">*</span>
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
                    required
                    onChange={(e) => handleFileChange("degree_certificate", e.target.files)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* ID Proof */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Proof <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 cursor-pointer transition">
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {documents.id_proof?.name || "Upload ID proof"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                    onChange={(e) => handleFileChange("id_proof", e.target.files)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Experience Letters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Letters {formData.experience_years > 0 && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <div className="space-y-2">
                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 cursor-pointer transition">
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {formData.experience_years > 0 ? 'Upload experience letters' : 'Upload experience letters (optional)'}
                  </span>
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
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Subject Expertise <span className="text-red-500">*</span></h3>
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
