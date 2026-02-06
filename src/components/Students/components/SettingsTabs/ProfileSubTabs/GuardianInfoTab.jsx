import React from "react";
import { Shield, Save } from "lucide-react";
import { Button } from "../../ui/button";

const GuardianInfoTab = ({ profileData, handleProfileChange, handleSaveProfile, isSaving }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-blue-600" />
        Guardian Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Guardian Name */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Guardian Name
          </label>
          <input
            type="text"
            value={profileData.guardianName}
            onChange={(e) =>
              handleProfileChange("guardianName", e.target.value)
            }
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            placeholder="Enter guardian name"
          />
        </div>

        {/* Guardian Relation */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Relation
          </label>
          <select
            value={profileData.guardianRelation}
            onChange={(e) =>
              handleProfileChange("guardianRelation", e.target.value)
            }
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
          >
            <option value="">Select Relation</option>
            <option value="Father">Father</option>
            <option value="Mother">Mother</option>
            <option value="Guardian">Guardian</option>
            <option value="Uncle">Uncle</option>
            <option value="Aunt">Aunt</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Guardian Phone */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Guardian Phone
          </label>
          <input
            type="tel"
            value={profileData.guardianPhone}
            onChange={(e) =>
              handleProfileChange("guardianPhone", e.target.value)
            }
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            placeholder="Enter guardian phone"
          />
        </div>

        {/* Guardian Email */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Guardian Email
          </label>
          <input
            type="email"
            value={profileData.guardianEmail}
            onChange={(e) =>
              handleProfileChange("guardianEmail", e.target.value)
            }
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            placeholder="Enter guardian email"
          />
        </div>
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

export default GuardianInfoTab;