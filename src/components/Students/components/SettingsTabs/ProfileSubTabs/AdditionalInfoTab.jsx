import React, { useState } from "react";
import { FileText, Save, AlertCircle } from "lucide-react";
import { Button } from "../../ui/button";
import { useFormValidation } from "../../../../../hooks/useFormValidation";
import FormField from "../FormField";
import DemoModal from "../../../../common/DemoModal";

const AdditionalInfoTab = ({ profileData, handleProfileChange, handleSaveProfile, isSaving }) => {
  const [showDemoModal, setShowDemoModal] = useState(false);
  const {
    validateSingleField,
    touchField,
    getFieldError,
    hasErrors,
  } = useFormValidation();

  const handleFieldChange = (field, value) => {
    handleProfileChange(field, value);
    validateSingleField(field, value);
  };

  const handleFieldBlur = (field, value) => {
    touchField(field);
    validateSingleField(field, value);
  };

  const handleSaveWithValidation = async () => {
    // Touch all fields to show errors
    touchField('aadhar');
    
    // Validate before saving
    if (hasErrors()) {
      return;
    }
    
    await handleSaveProfile();
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-600" />
        Additional Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aadhar Number with FormField */}
        <FormField
          label="Aadhar Number"
          name="aadhar"
          type="text"
          value={profileData.aadharNumber}
          onChange={(name, value) => {
            const cleanValue = value.replace(/\D/g, '').slice(0, 12);
            handleFieldChange("aadharNumber", cleanValue);
          }}
          onBlur={handleFieldBlur}
          error={getFieldError('aadhar')}
          placeholder="Enter 12-digit Aadhar number"
          maxLength={12}
          required
          helpText="Aadhar number must be 12 digits and cannot start with 0 or 1"
        />

        {/* Gap in Studies */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Gap in Studies <span className="text-red-500">*</span>
          </label>
          <select
            value={profileData.gapInStudies}
            onChange={(e) => {
              const hasGap = e.target.value === 'true';
              handleProfileChange("gapInStudies", hasGap);
              // Reset gap years and reason if no gap
              if (!hasGap) {
                handleProfileChange("gapYears", 0);
                handleProfileChange("gapReason", "");
              }
            }}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
          >
            <option value={false}>No Gap</option>
            <option value={true}>Yes, I have gap years</option>
          </select>
        </div>

        {/* Gap Years - Only show if gap in studies is true */}
        {profileData.gapInStudies && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Number of Gap Years
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={profileData.gapYears}
              onChange={(e) =>
                handleProfileChange("gapYears", parseInt(e.target.value) || 0)
              }
              className="w-full px-4 py-2.5  text-black  bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              placeholder="Enter number of gap years"
            />
          </div>
        )}

        {/* Gap Reason - Only show if gap in studies is true */}
        {profileData.gapInStudies && (
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">
              Reason for Gap
            </label>
            <textarea
              value={profileData.gapReason}
              onChange={(e) =>
                handleProfileChange("gapReason", e.target.value)
              }
              rows={3}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
              placeholder="Explain the reason for gap in studies (e.g., health issues, family reasons, preparation for competitive exams, etc.)"
            />
          </div>
        )}

        {/* Work Experience */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-gray-700">
            Work Experience
          </label>
          <textarea
            value={profileData.workExperience}
            onChange={(e) =>
              handleProfileChange("workExperience", e.target.value)
            }
            rows={4}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
            placeholder="Describe your work experience, internships, part-time jobs, or any professional experience (include company names, roles, duration, and key responsibilities)"
          />
        </div>

        {/* Current Backlogs */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Current Backlogs <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            max="50"
            value={profileData.currentBacklogs}
            onChange={(e) =>
              handleProfileChange("currentBacklogs", parseInt(e.target.value) || 0)
            }
            className="w-full px-4 py-2.5 text-black  bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            placeholder="Number of current pending backlogs"
          />
        </div>

        {/* Backlogs History */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Backlogs History
          </label>
          <textarea
            value={profileData.backlogsHistory}
            onChange={(e) =>
              handleProfileChange("backlogsHistory", e.target.value)
            }
            rows={3}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
            placeholder="Describe your academic backlogs history, subjects, reasons, and how you cleared them (if applicable)"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-slate-100 mt-6">
        {hasErrors() && (
          <div className="flex items-center gap-2 text-amber-600 text-sm mr-4">
            <AlertCircle className="w-4 h-4" />
            <span>Please fix validation errors before saving</span>
          </div>
        )}
        <Button
          onClick={() => setShowDemoModal(true)}
          disabled={isSaving || hasErrors()}
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
      <DemoModal 
        isOpen={showDemoModal} 
        onClose={() => setShowDemoModal(false)}
        message="This feature is available in the full version. You are currently viewing the demo. Please contact us to get complete access."
      />
    </div>
  );
};

export default AdditionalInfoTab;