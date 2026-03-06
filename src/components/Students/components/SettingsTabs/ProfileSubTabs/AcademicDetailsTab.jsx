import { Briefcase, GraduationCap, Plus, Edit, Eye, EyeOff, Trash2, CheckCircle, Clock, Save } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { useFormValidation } from "../../../../../hooks/useFormValidation";
import { isLearner } from "../../../../../utils/studentType";
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
  studentData,
}) => {
  const { validateSingleField, touchField, getFieldError } = useFormValidation();
  const isLearnerUser = isLearner(studentData);

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
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
          {isLearnerUser ? <GraduationCap className="w-5 h-5 text-blue-600" /> : <Briefcase className="w-5 h-5 text-blue-600" />}
          {isLearnerUser ? "Education History" : "Academic Details"}
        </h3>
        <p className="text-sm text-slate-500">
          {isLearnerUser 
            ? "Your educational qualifications and degrees" 
            : "Your educational qualifications and academic information"}
        </p>
      </div>

      {/* Only show academic fields for school/college students, not learners */}
      {!isLearnerUser && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-slate-700 mb-2 font-medium">
              What to fill here:
            </p>
            <ul className="text-sm text-slate-600 space-y-1.5 ml-4 list-disc">
              <li><span className="font-medium">Educational Level:</span> Your current academic year (e.g., Grade 10, UG Year 2)</li>
              <li><span className="font-medium">Registration/Enrollment Numbers:</span> Your official student ID numbers</li>
              <li><span className="font-medium">Current CGPA:</span> Your current grade point average</li>
            </ul>
            <p className="text-xs text-slate-500 mt-3">
              Note: Your institution name and class section (like "10-A") are set in the Institution Details tab.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Registration Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Registration Number
              </label>
              <input
                type="text"
                value={profileData.registrationNumber}
                onChange={(e) =>
                  handleProfileChange("registrationNumber", e.target.value)
                }
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all input-focus-ring text-sm"
                placeholder="Enter registration number"
              />
            </div>

            {/* Enrollment Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Enrollment Number
              </label>
              <input
                type="text"
                value={profileData.enrollmentNumber}
                onChange={(e) =>
                  handleProfileChange("enrollmentNumber", e.target.value)
                }
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all input-focus-ring text-sm"
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

            {/* Grade - Read Only (controlled by School Class or Program/Semester) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Grade/Class <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={profileData.grade || ""}
                readOnly
                disabled
                className="w-full px-4 py-2.5 bg-gray-50 border border-slate-200 rounded-xl text-sm text-gray-600 cursor-not-allowed"
                placeholder="Auto-set based on School Class or Program/Semester"
              />
              <p className="text-xs text-gray-500">
                {(profileData.schoolId || profileData.schoolClassId) && !profileData.universityId && !profileData.universityCollegeId
                  ? 'Change this by selecting School Class in Institution Details tab'
                  : 'Change this by selecting Program and Semester in Institution Details tab'}
              </p>
            </div>

            {/* Grade Start Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Grade Start Date
              </label>
              <input
                type="date"
                value={profileData.gradeStartDate}
                onChange={(e) =>
                  handleProfileChange("gradeStartDate", e.target.value)
                }
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all input-focus-ring text-sm"
              />
            </div>
          </div>
        </>
      )}

      {/* Education Section */}
      <div className={!isLearnerUser ? "pt-6 border-t border-slate-200" : ""}>
        <div className="flex items-center justify-between mb-6">
          <div>
            {!isLearnerUser && (
              <>
                <h4 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-1">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  Education History
                </h4>
                <p className="text-sm text-slate-500">Your educational qualifications and degrees</p>
              </>
            )}
          </div>
          <Button
            onClick={() => setShowEducationModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all button-press"
          >
            <Plus className="w-4 h-4" />
            Add Education
          </Button>
        </div>

        {educationData.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 text-base font-medium">
              No education added yet
            </p>
            <p className="text-slate-500 text-sm mt-1">
              Add your educational qualifications to showcase your academic background
            </p>
          </div>
        ) : (
          <div className="space-y-3">
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
                  className="p-5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="text-base font-semibold text-slate-900">
                          {education.degree || "N/A"}
                        </h4>
                        
                        {/* Verified Badge */}
                        {(education.approval_status === "verified" || education.approval_status === "approved") && !education._hasPendingEdit && (
                          <Badge className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 text-xs">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </Badge>
                        )}

                        {/* Pending Verification Badge - Show when has_pending_edit is true */}
                        {education._hasPendingEdit && (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 text-xs">
                            <Clock className="w-3 h-3" />
                            Pending Verification
                          </Badge>
                        )}

                        {/* Pending Verification Badge - Show for new pending records */}
                        {(!education.approval_status || education.approval_status === 'pending') && !education._hasPendingEdit && (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 text-xs">
                            <Clock className="w-3 h-3" />
                            Pending Verification
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-slate-600 font-medium mb-1">
                        {education.university || education.institution || "N/A"}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        {education.yearOfPassing && (
                          <span>{education.yearOfPassing}</span>
                        )}
                        {education.cgpa && (
                          <>
                            {education.yearOfPassing && <span>•</span>}
                            <span className="font-medium">CGPA: {education.cgpa}</span>
                          </>
                        )}
                        {education.status && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{education.status}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEducationModal(true)}
                        className="p-2 h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      {/* Eye icon - only show for verified/approved education */}
                      {(education.approval_status === 'verified' || education.approval_status === 'approved') && !education._hasPendingEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleEducationEnabled && onToggleEducationEnabled(idx)}
                          className="p-2 h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={education.enabled ? "Hide from profile" : "Show on profile"}
                        >
                          {education.enabled !== false ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      
                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteEducation && onDeleteEducation(idx)}
                        className="p-2 h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete education"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6">
        <Button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 button-press disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default AcademicDetailsTab;