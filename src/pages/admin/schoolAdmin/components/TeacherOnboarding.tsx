import React, { useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";

interface SubjectExpertise {
  name: string;
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
  years_experience: number;
}

const TeacherOnboardingPage: React.FC = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
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

  const handleFileChange = (field: keyof typeof documents, files: FileList | null) => {
    if (!files) return;

    if (field === "experience_letters") {
      setDocuments((prev) => ({
        ...prev,
        experience_letters: [...prev.experience_letters, ...Array.from(files)],
      }));
    } else {
      setDocuments((prev) => ({ ...prev, [field]: files[0] }));
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
      .from("teacher-documents")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("teacher-documents").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Upload documents
      const degreeUrl = documents.degree_certificate
        ? await uploadFile(documents.degree_certificate, "degrees")
        : null;

      const idProofUrl = documents.id_proof
        ? await uploadFile(documents.id_proof, "id-proofs")
        : null;

      const experienceUrls = await Promise.all(
        documents.experience_letters.map((file) => uploadFile(file, "experience-letters"))
      );

      // Get current user's school_id (you'll need to implement this based on your auth)
      const { data: userData } = await supabase.auth.getUser();
      
      // Insert teacher record
      const { data: teacher, error } = await supabase
        .from("teachers")
        .insert({
          ...formData,
          degree_certificate_url: degreeUrl,
          id_proof_url: idProofUrl,
          experience_letters_url: experienceUrls,
          subject_expertise: subjects,
          onboarding_status: "documents_uploaded",
          school_id: userData?.user?.user_metadata?.school_id, // Adjust based on your auth structure
        })
        .select()
        .single();

      if (error) throw error;

      setMessage({
        type: "success",
        text: `Teacher onboarded successfully! Teacher ID: ${teacher.teacher_id}`,
      });

      // Reset form
      setFormData({ first_name: "", last_name: "", email: "", phone: "" });
      setDocuments({ degree_certificate: null, id_proof: null, experience_letters: [] });
      setSubjects([]);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to onboard teacher" });
    } finally {
      setLoading(false);
    }
  };

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
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
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
          </div>
        </div>

        {/* Document Upload */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Documents</h3>
          <div className="space-y-4">
            {/* Degree Certificate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Degree Certificate *
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
              <label className="block text-sm font-medium text-gray-700 mb-2">ID Proof *</label>
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
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Expertise</h3>
          
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
            {loading ? "Onboarding..." : "Onboard Teacher"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default TeacherOnboardingPage;
