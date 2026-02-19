import React from "react";
import { Shield, Globe, Briefcase, Lock, Mail, Phone, MapPin, Save } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { usePermissions } from "../../../../context/PermissionsContext";

const PrivacyTab = ({
  privacySettings,
  handlePrivacyChange,
  handleSavePrivacy,
  isSaving,
}) => {
  const { canSavePrivacySettings } = usePermissions();
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-slate-200/50">
      <CardHeader className="border-b border-slate-100 pb-5">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-xl font-bold text-gray-900">
            Privacy Settings
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 p-6 space-y-6">
        {/* Profile Visibility */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-900">
            Profile Visibility
          </h3>
          <div className="space-y-2 relative">
            <label className="text-sm font-medium text-gray-700">
              Who can see your profile?
            </label>

            {/* Custom Dropdown */}
            <div className="relative">
              <button
                onClick={() =>
                  handlePrivacyChange("dropdownOpen", !privacySettings.dropdownOpen)
                }
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              >
                <div className="flex items-center gap-2">
                  {privacySettings.profileVisibility === "public" && (
                    <Globe className="w-4 h-4 text-blue-600" />
                  )}
                  {privacySettings.profileVisibility === "recruiters" && (
                    <Briefcase className="w-4 h-4 text-blue-600" />
                  )}
                  {privacySettings.profileVisibility === "private" && (
                    <Lock className="w-4 h-4 text-blue-600" />
                  )}
                  <span className="capitalize">
                    {privacySettings.profileVisibility === "public"
                      ? "Public - Anyone can view"
                      : privacySettings.profileVisibility === "recruiters"
                      ? "Recruiters Only"
                      : "Private - Only you"}
                  </span>
                </div>
                <svg
                  className="w-4 h-4 text-gray-500 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown menu */}
              {privacySettings.dropdownOpen && (
                <div className="absolute z-10 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                  {[
                    {
                      value: "public",
                      label: "Public - Anyone can view",
                      icon: Globe,
                    },
                    {
                      value: "recruiters",
                      label: "Recruiters Only",
                      icon: Briefcase,
                    },
                    {
                      value: "private",
                      label: "Private - Only you",
                      icon: Lock,
                    },
                  ].map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          handlePrivacyChange("profileVisibility", option.value);
                          handlePrivacyChange("dropdownOpen", false);
                        }}
                        className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-blue-50 transition-all ${
                          privacySettings.profileVisibility === option.value
                            ? "bg-blue-50 text-blue-700 font-semibold"
                            : "text-gray-700"
                        }`}
                      >
                        <Icon className="w-4 h-4 text-blue-600" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information Visibility */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-900">
            Contact Information
          </h3>
          {[
            {
              key: "showEmail",
              label: "Show Email Address",
              icon: Mail,
            },
            {
              key: "showPhone",
              label: "Show Phone Number",
              icon: Phone,
            },
            {
              key: "showLocation",
              label: "Show Location",
              icon: MapPin,
            },
          ].map((setting) => {
            const Icon = setting.icon;
            return (
              <div
                key={setting.key}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {setting.label}
                  </p>
                </div>
                <button
                  onClick={() =>
                    handlePrivacyChange(setting.key, !privacySettings[setting.key])
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                    privacySettings[setting.key]
                      ? "bg-blue-600"
                      : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
                      privacySettings[setting.key]
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Recruiter Interaction */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-900">
            Recruiter Interaction
          </h3>
          {[
            {
              key: "allowRecruiterContact",
              label: "Allow Recruiter Contact",
              description: "Recruiters can send you messages",
            },
            {
              key: "showInTalentPool",
              label: "Show in Talent Pool",
              description: "Appear in recruiter searches",
            },
          ].map((setting) => (
            <div
              key={setting.key}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-50"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {setting.label}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {setting.description}
                </p>
              </div>
              <button
                onClick={() =>
                  handlePrivacyChange(setting.key, !privacySettings[setting.key])
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                  privacySettings[setting.key]
                    ? "bg-blue-600"
                    : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
                    privacySettings[setting.key]
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-6 border-t border-slate-100">
          <Button
            onClick={() => canSavePrivacySettings && handleSavePrivacy()}
            disabled={!canSavePrivacySettings || isSaving}
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
            <Save
              className={`w-4 h-4 ${isSaving ? "animate-spin" : ""}`}
            />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrivacyTab;