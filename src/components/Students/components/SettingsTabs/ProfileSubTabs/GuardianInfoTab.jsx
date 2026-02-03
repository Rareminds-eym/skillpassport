import React from "react";
import { Shield } from "lucide-react";

const GuardianInfoTab = ({ profileData, handleProfileChange }) => {
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
    </div>
  );
};

export default GuardianInfoTab;