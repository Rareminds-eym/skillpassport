import { AlertCircle, CheckCircle, FileText, Loader2, Upload, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { apiPost } from '@/shared/api/apiClient';
import { ssoClient } from '@/shared/api/ssoClient';
import { getLogger } from '@/shared/config/logging';
import { uploadFile, uploadMultipleFiles, validateFile } from '@/shared/api';
// @ts-ignore - userApiService is a .js file
import { userApiService } from '@/entities/user';


const logger = getLogger('college-admin:FacultyOnboarding');

interface SubjectExpertise {
  name: string;
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
  years_experience: number;
}

interface FacultyOnboardingProps {
  collegeId: string | null;
  onChanged?: () => void;
}

const FacultyOnboarding: React.FC<FacultyOnboardingProps> = ({ collegeId, onChanged }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    address: "",
    qualification: "",
    department: "",
    specialization: "",
    experience_years: 0,
    date_of_joining: "",
    role: "lecturer" as "college_admin" | "dean" | "hod" | "professor" | "assistant_professor" | "lecturer",
    employee_id: "",
  });

  const [documents, setDocuments] = useState({
    degree_certificate: null as File | null,
    id_proof: null as File | null,
  });

  const [experienceLetters, setExperienceLetters] = useState<Array<{ file: File; url: string }>>([]);
  const formRef = useRef<HTMLFormElement>(null);

  const [uploadStatus, setUploadStatus] = useState({
    degree_certificate: { uploading: false, uploaded: false, url: null as string | null, error: null as string | null },
    id_proof: { uploading: false, uploaded: false, url: null as string | null, error: null as string | null },
    experience_letters: { uploading: false, error: null as string | null },
  });

  const [subjects, setSubjects] = useState<SubjectExpertise[]>([]);

  const [currentSubject, setCurrentSubject] = useState<SubjectExpertise>({
    name: "",
    proficiency: "intermediate",
    years_experience: 0,
  });

  const [createdEmailStatus, setCreatedEmailStatus] = useState<'sent' | 'failed' | null>(null);
  const [createdFacultyId, setCreatedFacultyId] = useState<string | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const uploading = Object.values(uploadStatus).some(status => status.uploading);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (message?.type === 'error') messageRef.current?.focus();
  }, [message]);

  const departments = [
    "Computer Science & Engineering",
    "Electronics & Communication Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Information Technology",
    "Electrical Engineering",
    "Business Administration",
    "Commerce",
    "Arts & Humanities",
    "Science",
    "Other",
  ];

  const handleFileChange = async (field: keyof typeof documents | "experience_letters", files: FileList | null) => {
    if (loading || uploadStatus[field].uploading || !files?.length) return;

    const fileArray = Array.from(files);

    // Validate files
    for (const file of fileArray) {
      const validation = validateFile(file, {
        maxSize: 10, // 10MB
        allowedTypes: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
      });

      if (!validation.valid) {
        setMessage({ type: "error", text: `${file.name}: ${validation.error}` });
        return;
      }
    }

    if (field === "experience_letters") {
      // Upload files immediately
      setUploadStatus(prev => ({
        ...prev,
        experience_letters: { ...prev.experience_letters, uploading: true, error: null }
      }));

      try {
        const results = await uploadMultipleFiles(fileArray, 'teachers/experience-letters');
        // Keep each filename with its URL so a partial failure cannot shift indices.
        const successful = fileArray.flatMap((file, index) => {
          const result = results[index];
          return result?.success && result.url ? [{ file, url: result.url }] : [];
        });
        const failed = fileArray.filter((_, index) => !results[index]?.success || !results[index]?.url);
        setExperienceLetters(previous => [...previous, ...successful]);
        const error = failed.length ? `Could not upload: ${failed.map(file => file.name).join(', ')}. Choose these files again to retry. Successful uploads are kept.` : null;
        setUploadStatus(previous => ({
          ...previous,
          experience_letters: { uploading: false, error },
        }));
        if (successful.length) {
          setValidationErrors(previous => {
            const next = { ...previous };
            delete next.experience_letters;
            return next;
          });
        }
        setMessage(error
          ? { type: 'error', text: error }
          : { type: 'success', text: `Successfully uploaded ${successful.length} experience letters` });
      } catch (error) {
        setUploadStatus(prev => ({
          ...prev,
          experience_letters: { ...prev.experience_letters, uploading: false, error: (error as Error).message }
        }));
        setMessage({ type: "error", text: `Upload failed: ${(error as Error).message}` });
      }
    } else {
      setDocuments((prev) => ({ ...prev, [field]: fileArray[0] }));

      // Upload file immediately
      setUploadStatus(prev => ({
        ...prev,
        [field]: { uploading: true, uploaded: false, url: null, error: null }
      }));

      try {
        const folderMap = {
          degree_certificate: 'teachers/degrees',
          id_proof: 'teachers/id-proofs'
        };

        const result = await uploadFile(fileArray[0], folderMap[field]);

        if (!result.success || !result.url) {
          throw new Error(result.error || 'Upload failed');
        }

        setUploadStatus(prev => ({
          ...prev,
          [field]: {
            uploading: false,
            uploaded: true,
            url: result.url!,
            error: null
          }
        }));

        // Clear validation error for this field
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });

        setMessage({ type: "success", text: `Successfully uploaded ${field.replace('_', ' ')}` });
      } catch (error) {
        setUploadStatus(prev => ({
          ...prev,
          [field]: { uploading: false, uploaded: false, url: null, error: (error as Error).message }
        }));
        setMessage({ type: "error", text: `Upload failed: ${(error as Error).message}` });
      }
    }
  };

  const removeExperienceLetter = (index: number) => {
    if (loading || uploadStatus.experience_letters.uploading) return;
    setExperienceLetters(previous => previous.filter((_, i) => i !== index));
  };

  const addSubject = () => {
    if (!currentSubject.name.trim()) return;
    setSubjects([...subjects, currentSubject]);
    setCurrentSubject({ name: "", proficiency: "intermediate", years_experience: 0 });
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || uploading) return;
    setLoading(true);
    setMessage(null);
    setValidationErrors({});


    if (!collegeId) {
      setMessage({ type: "error", text: "College ID not found. Please ensure you're logged in as a college admin." });
      setLoading(false);
      return;
    }

    // Basic validation
    const errors: Record<string, string> = {};
    if (!formData.first_name.trim()) errors.first_name = "First name is required";
    if (!formData.last_name.trim()) errors.last_name = "Last name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    if (!formData.employee_id.trim()) errors.employee_id = "Employee ID is required";
    if (!formData.department.trim()) errors.department = "Department is required";
    if (subjects.length === 0) errors.subjects = "At least one subject expertise is required";

    // Document validation - mandatory in production, optional in development
    // const isProduction = process.env.NODE_ENV === 'production';

    // if (isProduction) {
      if (!uploadStatus.degree_certificate.uploaded) {
        errors.degree_certificate = "Degree certificate is required";
      }
      if (!uploadStatus.id_proof.uploaded) {
        errors.id_proof = "ID proof is required";
      }
      if (formData.experience_years > 0 && experienceLetters.length === 0) {
        errors.experience_letters = "At least one experience letter is required";
      }
    // }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setMessage({ type: "error", text: "Please fix the validation errors before submitting." });
      setLoading(false);
      return;
    }

    // An already-created account only needs its remaining profile fields saved.
    if (!createdFacultyId) {
      try {
        const duplicateResult = await apiPost<{ data?: { exists?: boolean } }>('/college-admin/faculty', {
          action: 'check-duplicate-employee-id',
          college_id: collegeId,
          employee_id: formData.employee_id.trim(),
        });

        if (duplicateResult.data?.exists) {
          setValidationErrors({ employee_id: "This Employee ID already exists in your college" });
          setMessage({ type: "error", text: "Employee ID already exists. Please choose a different ID." });
          setLoading(false);
          return;
        }
      } catch (error: any) {
        setMessage({ type: "error", text: error.message || "Failed to validate employee ID" });
        setLoading(false);
        return;
      }
    }

    try {
      // Use uploaded file URLs from upload status
      const degreeUrl = uploadStatus.degree_certificate.url;
      const idProofUrl = uploadStatus.id_proof.url;
      const experienceUrls = experienceLetters.map(letter => letter.url);


      // Map role to display format for worker API
      const roleDisplayMap: Record<string, string> = {
        'college_admin': 'College Admin',
        'dean': 'Dean',
        'hod': 'HoD',
        'professor': 'Faculty',
        'assistant_professor': 'Faculty',
        'lecturer': 'Lecturer',
      };

      // Use Worker API to create faculty with proper rollback
      // Note: Worker expects data wrapped in a 'staff' object
      const staffResult = createdFacultyId ? { success: true, data: { staffId: createdFacultyId } } : await userApiService.createCollegeStaff({
        staff: {
          name: `${formData.first_name} ${formData.last_name}`.trim(),
          email: formData.email,
          employee_id: formData.employee_id,
          roles: [roleDisplayMap[formData.role] || 'Faculty'],
          department_id: formData.department,
          phone: formData.phone,
          qualification: formData.qualification,
          specialization: formData.specialization,
          experience_years: formData.experience_years,
        },
        collegeId: collegeId,
      }, ssoClient.getAccessToken() ?? undefined);

      if (!staffResult.success) {
        throw new Error(staffResult.error || "Failed to create faculty member");
      }

      const emailStatus = createdFacultyId ? createdEmailStatus : staffResult.data.emailStatus;
      if (!createdFacultyId) setCreatedEmailStatus(emailStatus ?? null);
      const facultyId = staffResult.data.staffId;
      setCreatedFacultyId(facultyId);
      if (!createdFacultyId) onChanged?.();

      // Step 3: Update faculty record with document URLs and additional fields
      try {
        await apiPost('/college-admin/faculty', {
          action: 'update-lecturer',
          id: facultyId,
          subject_expertise: subjects,
          dateOfJoining: formData.date_of_joining || null,
          degree_certificate_url: degreeUrl,
          id_proof_url: idProofUrl,
          experience_letters_url: experienceUrls,
        });
      } catch (err) {
        logger.warn('Failed to update faculty record with documents', { error: err });
        throw new Error('The faculty account was created, but its documents and profile details could not be saved. Your entries are kept. Select Retry saving details to finish; no new account will be created.');
      }

      setMessage({
        type: emailStatus === 'sent' ? 'success' : 'error',
        text: emailStatus === 'sent'
          ? `Faculty member ${formData.first_name} ${formData.last_name} created successfully. Login credentials were emailed to ${formData.email}.`
          : `Faculty member ${formData.first_name} ${formData.last_name} created successfully, but credential email delivery could not be confirmed. Open Faculty → Resend credentials to generate and email a new password.`,
      });

      setCreatedFacultyId(null);
      setCreatedEmailStatus(null);
      onChanged?.();
      // Clear native file controls as well as React state for the next faculty member.
      formRef.current?.reset();
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        date_of_birth: "",
        address: "",
        qualification: "",
        department: "",
        specialization: "",
        experience_years: 0,
        date_of_joining: "",
        role: "lecturer",
        employee_id: ""
      });
      setDocuments({ degree_certificate: null, id_proof: null });
      setExperienceLetters([]);
      setUploadStatus({
        degree_certificate: { uploading: false, uploaded: false, url: null, error: null },
        id_proof: { uploading: false, uploaded: false, url: null, error: null },
        experience_letters: { uploading: false, error: null },
      });
      setSubjects([]);
      setCurrentSubject({ name: "", proficiency: "intermediate", years_experience: 0 });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to onboard faculty member" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Faculty Onboarding
        </h1>
        <p className="text-gray-600 text-sm">
          Add new faculty members with documents and subject expertise
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">

      {message && (
        <div
          ref={messageRef}
          tabIndex={-1}
          role={message.type === 'error' ? 'alert' : 'status'}
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

      <form ref={formRef} onSubmit={handleSubmit} aria-busy={loading}>
        <fieldset disabled={loading} className="min-w-0 space-y-6">
        <legend className="sr-only">Faculty onboarding details</legend>
        {/* Personal Information */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="faculty-field-0" className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input id="faculty-field-0"
                type="text"
                required
                disabled={!!createdFacultyId}
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="faculty-field-1" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input id="faculty-field-1"
                type="text"
                required
                disabled={!!createdFacultyId}
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="faculty-field-2" className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input id="faculty-field-2"
                type="email"
                required
                disabled={!!createdFacultyId}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="faculty-field-3" className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID *
              </label>
              <input id="faculty-field-3"
                type="text"
                required
                disabled={!!createdFacultyId}
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                placeholder="e.g., FAC001, EMP123"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  validationErrors.employee_id ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.employee_id && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.employee_id}</p>
              )}
            </div>
            <div>
              <label htmlFor="faculty-field-4" className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input id="faculty-field-4"
                type="tel"
                disabled={!!createdFacultyId}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="faculty-field-5" className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              <select id="faculty-field-5"
                required
                disabled={!!createdFacultyId}
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="faculty-field-6" className="block text-sm font-medium text-gray-700 mb-2">
                Faculty Role *
              </label>
              <select id="faculty-field-6"
                required
                disabled={!!createdFacultyId}
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="lecturer">Lecturer</option>
                <option value="assistant_professor">Assistant Professor</option>
                <option value="professor">Professor</option>
                <option value="hod">Head of Department (HOD)</option>
                <option value="dean">Dean</option>
                <option value="college_admin">College Admin</option>
              </select>
            </div>
            <div>
              <label htmlFor="faculty-field-7" className="block text-sm font-medium text-gray-700 mb-2">Qualification</label>
              <input id="faculty-field-7"
                type="text"
                disabled={!!createdFacultyId}
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                placeholder="e.g., Ph.D. in Computer Science"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="faculty-field-8" className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
              <input id="faculty-field-8"
                type="text"
                disabled={!!createdFacultyId}
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g., Artificial Intelligence"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="faculty-field-9" className="block text-sm font-medium text-gray-700 mb-2">Experience (Years)</label>
              <input id="faculty-field-9"
                type="number"
                min="0"
                disabled={!!createdFacultyId}
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="faculty-field-10" className="block text-sm font-medium text-gray-700 mb-2">Date of Joining</label>
              <input id="faculty-field-10"
                type="date"
                value={formData.date_of_joining}
                onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
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
                Degree Certificate *
              </label>
              <div className="flex items-center gap-3">
                <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer focus-within:ring-2 focus-within:ring-indigo-600 transition ${
                  uploadStatus.degree_certificate.uploaded
                    ? 'border-green-300 bg-green-50'
                    : uploadStatus.degree_certificate.uploading
                    ? 'border-blue-300 bg-blue-50'
                    : validationErrors.degree_certificate
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 hover:border-indigo-500'
                }`}
                title={documents.degree_certificate?.name || ""}
                >
                  {uploadStatus.degree_certificate.uploading ? (
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  ) : uploadStatus.degree_certificate.uploaded ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Upload className="h-5 w-5 text-gray-400" />
                  )}
                  <span className={`text-sm ${
                    uploadStatus.degree_certificate.uploaded
                      ? 'text-green-700'
                      : uploadStatus.degree_certificate.uploading
                      ? 'text-blue-700'
                      : 'text-gray-600'
                  }`}>
                    {uploadStatus.degree_certificate.uploading
                      ? "Uploading..."
                      : uploadStatus.degree_certificate.uploaded
                      ? `${documents.degree_certificate?.name ?
                          (documents.degree_certificate.name.length > 25
                            ? `${documents.degree_certificate.name.substring(0, 20)}...${documents.degree_certificate.name.substring(documents.degree_certificate.name.lastIndexOf('.'))}`
                            : documents.degree_certificate.name
                          ) : "Uploaded"}`
                      : "Upload degree certificate"
                    }
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    aria-label="Upload degree certificate"
                    onChange={event => {
                      void handleFileChange("degree_certificate", event.currentTarget.files);
                      event.currentTarget.value = "";
                    }}
                    className="sr-only"
                    disabled={uploadStatus.degree_certificate.uploading}
                  />
                </label>
              </div>
              {uploadStatus.degree_certificate.error && (
                <p className="mt-1 text-sm text-red-600">{uploadStatus.degree_certificate.error}</p>
              )}
              {validationErrors.degree_certificate && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.degree_certificate}</p>
              )}
            </div>

            {/* ID Proof */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID Proof *</label>
              <div className="flex items-center gap-3">
                <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer focus-within:ring-2 focus-within:ring-indigo-600 transition ${
                  uploadStatus.id_proof.uploaded
                    ? 'border-green-300 bg-green-50'
                    : uploadStatus.id_proof.uploading
                    ? 'border-blue-300 bg-blue-50'
                    : validationErrors.id_proof
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 hover:border-indigo-500'
                }`}
                title={documents.id_proof?.name || ""}
                >
                  {uploadStatus.id_proof.uploading ? (
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  ) : uploadStatus.id_proof.uploaded ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Upload className="h-5 w-5 text-gray-400" />
                  )}
                  <span className={`text-sm ${
                    uploadStatus.id_proof.uploaded
                      ? 'text-green-700'
                      : uploadStatus.id_proof.uploading
                      ? 'text-blue-700'
                      : 'text-gray-600'
                  }`}>
                    {uploadStatus.id_proof.uploading
                      ? "Uploading..."
                      : uploadStatus.id_proof.uploaded
                      ? `${documents.id_proof?.name ?
                          (documents.id_proof.name.length > 25
                            ? `${documents.id_proof.name.substring(0, 20)}...${documents.id_proof.name.substring(documents.id_proof.name.lastIndexOf('.'))}`
                            : documents.id_proof.name
                          ) : "Uploaded"}`
                      : "Upload ID proof"
                    }
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    aria-label="Upload ID proof"
                    onChange={event => {
                      void handleFileChange("id_proof", event.currentTarget.files);
                      event.currentTarget.value = "";
                    }}
                    className="sr-only"
                    disabled={uploadStatus.id_proof.uploading}
                  />
                </label>
              </div>
              {uploadStatus.id_proof.error && (
                <p className="mt-1 text-sm text-red-600">{uploadStatus.id_proof.error}</p>
              )}
              {validationErrors.id_proof && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.id_proof}</p>
              )}
            </div>

            {/* Experience Letters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Letters {formData.experience_years > 0 ? '*' : '(optional for new faculty)'}
              </label>
              <div className="space-y-2">
                <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer focus-within:ring-2 focus-within:ring-indigo-600 transition ${
                  uploadStatus.experience_letters.uploading
                    ? 'border-blue-300 bg-blue-50'
                    : validationErrors.experience_letters
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 hover:border-indigo-500'
                }`}>
                  {uploadStatus.experience_letters.uploading ? (
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5 text-gray-400" />
                  )}
                  <span className={`text-sm ${
                    uploadStatus.experience_letters.uploading ? 'text-blue-700' : 'text-gray-600'
                  }`}>
                    {uploadStatus.experience_letters.uploading ? "Uploading..." : "Upload experience letters"}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    aria-label="Upload experience letters"
                    onChange={event => {
                      void handleFileChange("experience_letters", event.currentTarget.files);
                      event.currentTarget.value = "";
                    }}
                    className="sr-only"
                    disabled={uploadStatus.experience_letters.uploading}
                  />
                </label>
                {uploadStatus.experience_letters.error && (
                  <p className="text-sm text-red-600">{uploadStatus.experience_letters.error}</p>
                )}
                {validationErrors.experience_letters && (
                  <p className="text-sm text-red-600">{validationErrors.experience_letters}</p>
                )}
                {experienceLetters.map(({ file }, index) => {
                  // Truncate long filenames for better display
                  const displayName = file.name.length > 40
                    ? `${file.name.substring(0, 20)}...${file.name.substring(file.name.lastIndexOf('.'))}`
                    : file.name;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {experienceLetters[index].url ? (
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span
                            className="text-sm text-gray-700 block truncate"
                            title={file.name}
                          >
                            {displayName}
                          </span>
                          {experienceLetters[index].url && (
                            <span className="text-xs text-green-600">Uploaded</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove experience letter ${file.name}`}
                        onClick={() => removeExperienceLetter(index)}
                        className="text-red-500 hover:text-red-700 flex-shrink-0 ml-2"
                        disabled={uploadStatus.experience_letters.uploading}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
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
              aria-label="Subject name"
              placeholder="Subject name"
              value={currentSubject.name}
              onChange={(e) => setCurrentSubject({ ...currentSubject, name: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <select aria-label="Subject proficiency"
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
              aria-label="Years of subject experience"
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
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-900">{subject.name}</span>
                  <span className="text-sm text-gray-600 capitalize">{subject.proficiency}</span>
                  <span className="text-sm text-gray-500">{subject.years_experience} years</span>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${subject.name}`}
                  onClick={() => removeSubject(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || uploading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
          >
            {loading ? "Saving…" : uploading ? "Waiting for uploads…" : createdFacultyId ? "Retry saving details" : "Create Faculty Member"}
          </button>
        </div>
        </fieldset>
      </form>
      </div>
    </div>
  );
};

export default FacultyOnboarding;
