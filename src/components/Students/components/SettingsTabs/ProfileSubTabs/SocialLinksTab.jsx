import React, { useState } from "react";
import { Globe, Save } from "lucide-react";
import { Button } from "../../ui/button";
import { useFormValidation } from "../../../../../hooks/useFormValidation";
import FormField from "../FormField";
import DemoModal from "../../../../common/DemoModal";

const SocialLinksTab = ({ profileData, handleProfileChange, handleSaveProfile, isSaving }) => {
  const [showDemoModal, setShowDemoModal] = useState(false);
  const { validateSingleField, touchField, getFieldError } = useFormValidation();

  const handleFieldChange = (field, value) => {
    handleProfileChange(field, value);
    // Validate URL fields
    if (['linkedIn', 'github', 'portfolio', 'twitter', 'facebook', 'instagram'].includes(field)) {
      validateSingleField('url', value);
    }
  };

  const handleFieldBlur = (field, value) => {
    touchField(field);
    if (['linkedIn', 'github', 'portfolio', 'twitter', 'facebook', 'instagram'].includes(field)) {
      validateSingleField('url', value);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
        <Globe className="w-5 h-5 text-blue-600" />
        Social Links
      </h3>

      {/* Bio Section */}
      <div className="mb-8">
        <h4 className="text-md font-semibold text-black mb-4">
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
        <h4 className="text-md font-semibold text-black mb-4">
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
            <FormField
              key={field.key}
              label={field.label}
              name={field.key}
              type="url"
              value={profileData[field.key]}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              error={getFieldError(field.key)}
              placeholder={field.placeholder}
            />
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-slate-100 mt-6">
        <Button
          onClick={() => setShowDemoModal(true)}
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
      <DemoModal 
        isOpen={showDemoModal} 
        onClose={() => setShowDemoModal(false)}
        message="This feature is available in the full version. You are currently viewing the demo. Please contact us to get complete access."
      />
    </div>
  );
};

export default SocialLinksTab;