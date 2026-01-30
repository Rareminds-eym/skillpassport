import React from "react";
import { Globe } from "lucide-react";

const SocialLinksTab = ({ profileData, handleProfileChange }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Globe className="w-5 h-5 text-blue-600" />
        Social Links
      </h3>

      {/* Bio Section */}
      <div className="mb-8">
        <h4 className="text-md font-semibold text-gray-800 mb-4">
          Bio
        </h4>
        <div className="space-y-2">
          <textarea
            value={profileData.bio}
            onChange={(e) =>
              handleProfileChange("bio", e.target.value)
            }
            rows={4}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
            placeholder="Tell us about yourself..."
          />
        </div>
      </div>

      {/* Social Links */}
      <div className="pt-6 border-t border-slate-100">
        <h4 className="text-md font-semibold text-gray-800 mb-4">
          Social Media & Portfolio Links
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              key: "linkedIn",
              label: "LinkedIn",
              placeholder: "https://linkedin.com/in/yourprofile",
            },
            {
              key: "github",
              label: "GitHub",
              placeholder: "https://github.com/yourusername",
            },
            {
              key: "portfolio",
              label: "Portfolio",
              placeholder: "https://yourportfolio.com",
            },
            {
              key: "twitter",
              label: "Twitter",
              placeholder: "https://twitter.com/yourusername",
            },
            {
              key: "facebook",
              label: "Facebook",
              placeholder: "https://facebook.com/yourprofile",
            },
            {
              key: "instagram",
              label: "Instagram",
              placeholder: "https://instagram.com/yourusername",
            },
          ].map((field) => (
            <div key={field.key} className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                {field.label}
              </label>
              <input
                type="url"
                value={profileData[field.key]}
                onChange={(e) =>
                  handleProfileChange(field.key, e.target.value)
                }
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SocialLinksTab;