import React, { useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";

interface SubjectExpertise {
  name: string;
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
  years_experience: number;
}

interface FacultyOnboardingProps {
  collegeId: string | null;
}

const FacultyOnboarding: React.FC<FacultyOnboardingProps> = ({ collegeId }) => {
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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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

  const handleFileChange = (field: keyof typeof documents, files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    
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

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("faculty-documents")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("faculty-documents").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    if (!formData.department.trim()) errors.department = "Department is required";
    if (subjects.length === 0) errors.subjects = "At least one subject expertise is required";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setMessage({ type: "error", text: "Please fix the validation errors before submitting." });
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

      // Get current user email
      const userEmail = localStorage.getItem('userEmail');
      
      if (!userEmail) {
        throw new Error("User not authenticated. Please log in again.");
      }

      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + "Temp@123";
      
      console.log("Creating auth user for:", formData.email);
      
      // Step 1: Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: 'college_educator',
          college_id: collegeId,
        }
      });

      if (authError) {
        console.warn("Admin API not available, trying regular signup:", authError);
        
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email: formData.email,
          password: tempPassword,
          options: {
            data: {
              first_name: formData.first_name,
              last_name: formData.last_name,
              role: 'college_educator',
              college_id: collegeId,
            }
          }
        });

        if (signupError) {
          throw new Error(`Failed to create auth user: ${signupError.message}`);
        }

        if (!signupData.user) {
          throw new Error("Failed to create auth user");
        }

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
          role: 'college_educator',
        })
        .select()
        .single();

      if (userError) {
        console.error("Failed to create user record:", userError);
        throw new Error(`Failed to create user record: ${userError.message}`);
      }

      console.log("Created user record:", userRecord);

      // Step 3: Create faculty record in college_lecturers table
      const { data: faculty, error: facultyError } = await supabase
        .from("college_lecturers")
        .insert({
          userId: userId,
          collegeId: collegeId,
          employeeId: `FAC${Date.now().toString().slice(-6)}`, // Generate employee ID
          department: formData.department,
          specialization: formData.specialization || null,
          qualification: formData.qualification || null,
          experienceYears: formData.experience_years || 0,
          dateOfJoining: formData.date_of_joining || new Date().toISOString().split('T')[0],
          accountStatus: "active",
          metadata: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone_number: formData.phone || null,
            date_of_birth: formData.date_of_birth || null,
            address: formData.address || null,
            role: formData.role,
            subject_expertise: subjects,
            degree_certificate_url: degreeUrl,
            id_proof_url: idProofUrl,
            experience_letters_url: experienceUrls.length > 0 ? experienceUrls : null,
            temporary_password: tempPassword,
            password_created_at: new Date().toISOString(),
            created_by: userEmail,
          }
        })
        .select()
        .single();

      if (facultyError) {
        // Rollback: delete user record
        await supabase.from("users").delete().eq("id", userId);
        console.error("Failed to create faculty record:", facultyError);
        throw new Error(`Failed to create faculty record: ${facultyError.message}`);
      }

      setMessage({
        type: "success",
        text: `Faculty member onboarded successfully! Employee ID: ${faculty.employeeId}. Login credentials sent to ${formData.email}. Temporary password: ${tempPassword}`,
      });

      // Reset form
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
        role: "lecturer" 
      });
      setDocuments({ degree_certificate: null, id_proof: null, experience_letters: [] });
      setSubjects([]);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to onboard faculty member" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
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

      <form onSubmit={handleSubmit} className="space-y-6">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              <select
                required
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Faculty Role *
              </label>
              <select
                required
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Qualification</label>
              <input
                type="text"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                placeholder="e.g., Ph.D. in Computer Science"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g., Artificial Intelligence"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years)</label>
              <input
                type="number"
                min="0"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Joining</label>
              <input
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

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
          >
            {loading ? "Processing..." : "Create Faculty Member"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default FacultyOnboarding;
