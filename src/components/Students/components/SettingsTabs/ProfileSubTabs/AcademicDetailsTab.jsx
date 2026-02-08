import React from "react";
import { Briefcase, GraduationCap, Plus, Edit, Eye, EyeOff, Trash2, CheckCircle, Clock, Save } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { useFormValidation } from "../../../../../hooks/useFormValidation";
import FormField from "../FormField";

const AcademicDetailsTab = ({ 
  profileData, 
  handleProfileChange, 
  educationData, 
  setShowEducationModal,
  onToggleEducationEnabled,
  onDeleteEducation,
  handleSaveProfile,
  isSaving, 
}) => {
  const { validateSingleField, touchField, getFieldError } = useFormValidation();

  const handleFieldChange = (field, value) => {
    handleProfileChange(field, value);
    if (field === 'currentCgpa') {
      validateSingleField('cgpa', value);
    }
  };

  const handleFieldBlur = (field, value) => {
    touchField(field);
    if (field === 'currentCgpa') {
      validateSingleField('cgpa', value);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-blue-600" />
        Academic Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Registration Number */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Registration Number
          </label>
          <input
            type="text"
            value={profileData.registrationNumber}
            onChange={(e) =>
              handleProfileChange("registrationNumber", e.target.value)
            }
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            placeholder="Enter registration number"
          />
        </div>

        {/* Enrollment Number */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Enrollment Number
          </label>
          <input
            type="text"
            value={profileData.enrollmentNumber}
            onChange={(e) =>
              handleProfileChange("enrollmentNumber", e.target.value)
            }
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            placeholder="Enter enrollment number"
          />
        </div>

        {/* Current CGPA */}
        <FormField
          label="Current CGPA"
          name="currentCgpa"
          type="number"
          value={profileData.currentCgpa}
          onChange={handleFieldChange}
          onBlur={handleFieldBlur}
          error={getFieldError('cgpa')}
          placeholder="Enter current CGPA (0-10)"
          required
          helpText="CGPA must be between 0 and 10"
          inputClassName="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />

        {/* Grade */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Grade/Class <span className="text-red-500">*</span>
          </label>
          <select
            value={profileData.grade}
            onChange={(e) =>
              handleProfileChange("grade", e.target.value)
            }
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
          >
            <option value="">Select Grade/Class</option>
            <option value="Grade 6">Grade 6</option>
            <option value="Grade 7">Grade 7</option>
            <option value="Grade 8">Grade 8</option>
            <option value="Grade 9">Grade 9</option>
            <option value="Grade 10">Grade 10</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
            <option value="Diploma">Diploma</option>
            <option value="UG Year 1">UG Year 1</option>
            <option value="UG Year 2">UG Year 2</option>
            <option value="UG Year 3">UG Year 3</option>
            <option value="UG Year 4">UG Year 4</option>
            <option value="PG Year 1">PG Year 1</option>
            <option value="PG Year 2">PG Year 2</option>
            <option value="PG">PG</option>
          </select>
        </div>

        {/* Grade Start Date */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Grade Start Date
          </label>
          <input
            type="date"
            value={profileData.gradeStartDate}
            onChange={(e) =>
              handleProfileChange("gradeStartDate", e.target.value)
            }
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
          />
        </div>
      </div>

      {/* Education Section */}
      <div className="pt-8 border-t border-slate-100 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            Education
          </h4>
          <Button
            onClick={() => setShowEducationModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add education
          </Button>
        </div>

        {educationData.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-base font-medium">
              No education added yet
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Add your educational qualifications to showcase your academic background
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
            {educationData
              .filter(edu => edu.enabled !== false) // Only show enabled education
              .map((education) => {
                // VERSIONING: If there's a pending edit, show verified_data in Settings
                let displayData = education;
                if (education.has_pending_edit && education.verified_data) {
                  displayData = {
                    ...education,
                    degree: education.verified_data.degree,
                    department: education.verified_data.department,
                    university: education.verified_data.university,
                    institution: education.verified_data.university,
                    yearOfPassing: education.verified_data.yearOfPassing || education.verified_data.year_of_passing,
                    cgpa: education.verified_data.cgpa,
                    level: education.verified_data.level,
                    status: education.verified_data.status,
                  };
                }
                return displayData;
              })
              .sort((a, b) => {
                const yearA = parseInt(a.yearOfPassing) || 0;
                const yearB = parseInt(b.yearOfPassing) || 0;
                return yearB - yearA; // Descending order
              })
              .map((education, idx) => (
                <div
                  key={education.id || `edu-${idx}`}
                  className="p-5 rounded-xl bg-white border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="text-base font-bold text-gray-900">
                          {education.degree || "N/A"}
                        </h4>
                        
                        {/* Verified Badge */}
                        {(education.approval_status === "verified" || education.approval_status === "approved") && !education._hasPendingEdit && (
                          <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </Badge>
                        )}

                        {/* Pending Verification Badge - Show when has_pending_edit is true */}
                        {education._hasPendingEdit && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Pending Verification
                          </Badge>
                        )}

                        {/* Pending Verification Badge - Show for new pending records */}
                        {(!education.approval_status || education.approval_status === 'pending') && !education._hasPendingEdit && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Pending Verification
                          </Badge>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowEducationModal(true)}
                            className="p-1 h-6 w-6 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          
                          {/* Eye icon - only show for verified/approved education */}
                          {(education.approval_status === 'verified' || education.approval_status === 'approved') && !education._hasPendingEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onToggleEducationEnabled && onToggleEducationEnabled(idx)}
                              className="p-1 h-6 w-6 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                              title={education.enabled ? "Hide from profile" : "Show on profile"}
                            >
                              {education.enabled !== false ? (
                                <Eye className="w-3 h-3" />
                              ) : (
                                <EyeOff className="w-3 h-3" />
                              )}
                            </Button>
                          )}
                          
                          {/* Delete button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteEducation && onDeleteEducation(idx)}
                            className="p-1 h-6 w-6 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            title="Delete education"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 font-medium mb-1">
                        {education.university || education.institution || "N/A"}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {education.yearOfPassing && (
                          <span>{education.yearOfPassing}</span>
                        )}
                        {education.cgpa && (
                          <>
                            {education.yearOfPassing && <span>|</span>}
                            <span className="font-medium">{education.cgpa}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {education.status && (
                      <Badge
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          education.status === "ongoing"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {education.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-slate-100 mt-6">
        <Button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className={`
            inline-flex items-center gap-2
            bg-blue-600 hover:bg-blue-700 active:bg-blue-800
            text-white font-medium
            px-6 py-2.5 rounded-lg
            shadow-[0_2px_6px_rgba(0,0,0,0.05)]
            hover:shadow-[0_3px_8px_rgba(0,0,0,0.08)]
            active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)]
            transition-all duration-200 ease-in-out
            disabled:opacity-60 disabled:cursor-not-allowed
          `}
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default AcademicDetailsTab;