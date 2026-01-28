import React from "react";
import { FileText } from "lucide-react";

const AdditionalInfoTab = ({ profileData, handleProfileChange }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-600" />
        Additional Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aadhar Number */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Aadhar Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={profileData.aadharNumber}
            onChange={(e) => {
              // Only allow digits and limit to 12 characters
              const value = e.target.value.replace(/\D/g, '').slice(0, 12);
              handleProfileChange("aadharNumber", value);
            }}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            placeholder="Enter 12-digit Aadhar number"
            maxLength="12"
          />
          {profileData.aadharNumber && profileData.aadharNumber.length !== 12 && (
            <p className="text-xs text-red-500">Aadhar number must be exactly 12 digits</p>
          )}
        </div>

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
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
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
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
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
    </div>
  );
};

export default AdditionalInfoTab;