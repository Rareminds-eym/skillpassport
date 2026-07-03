import React from "react";
import { Shield, Globe, Briefcase, Lock, Mail, Phone, MapPin, Save } from "lucide-react";
import { Button } from '@/shared/ui/ButtonNew';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';

const PrivacyTab = ({
  privacySettings,
  handlePrivacyChange,
  handleSavePrivacy,
  isSaving,
}) => {
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
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-2">
              Profile Visibility
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              Choose who can see your complete profile and which information is visible to different viewers.
            </p>
          </div>

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

            {/* Dropdown menu with descriptions */}
            {privacySettings.dropdownOpen && (
              <div className="absolute z-10 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                {[
                  {
                    value: "public",
                    label: "Public - Anyone can view",
                    icon: Globe,
                    description: "Your full profile is visible to everyone including search engines",
                  },
                  {
                    value: "recruiters",
                    label: "Recruiters Only",
                    icon: Briefcase,
                    description: "Only verified recruiters can see your profile",
                  },
                  {
                    value: "private",
                    label: "Private - Only you",
                    icon: Lock,
                    description: "Your profile is completely hidden from others",
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
                      className={`w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-blue-50 transition-all ${
                        privacySettings.profileVisibility === option.value
                          ? "bg-blue-50"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            privacySettings.profileVisibility === option.value
                              ? "text-blue-700 font-semibold"
                              : "text-gray-900"
                          }`}>
                            {option.label}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Visibility Info Box */}
          <div className="p-3 bg-blue-50/50 border border-blue-200/50 rounded-lg">
            <p className="text-xs text-blue-900">
              <strong>Note:</strong> Below you can selectively hide specific contact information regardless of your profile visibility setting.
            </p>
          </div>
        </div>

        {/* Contact Information Visibility */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-2">
              Contact Information Visibility
            </h3>
            <p className="text-xs text-gray-600">
              {privacySettings.profileVisibility === "private"
                ? "Your profile is private, so contact information cannot be displayed."
                : `Choose which contact details are visible to ${privacySettings.profileVisibility === "public" ? "everyone" : "recruiters"}.`
              }
            </p>
          </div>
          {[
            {
              key: "showEmail",
              label: "Show Email Address",
              icon: Mail,
              description: "Allow viewers to see your email address",
            },
            {
              key: "showPhone",
              label: "Show Phone Number",
              icon: Phone,
              description: "Allow viewers to see your phone number",
            },
            {
              key: "showLocation",
              label: "Show Location",
              icon: MapPin,
              description: "Allow viewers to see your city/state",
            },
          ].map((setting) => {
            const Icon = setting.icon;
            const isDisabled = privacySettings.profileVisibility === "private";
            return (
              <div
                key={setting.key}
                className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                  isDisabled
                    ? "bg-gray-50 border border-gray-200/50 opacity-60"
                    : "bg-slate-50 border border-slate-200/50 hover:bg-slate-100/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isDisabled ? "bg-gray-100" : "bg-white shadow-sm"}`}>
                    <Icon className={`w-4 h-4 ${isDisabled ? "text-gray-400" : "text-gray-600"}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isDisabled ? "text-gray-600" : "text-gray-900"}`}>
                      {setting.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {setting.description}
                    </p>
                  </div>
                </div>
                <button
                  disabled={isDisabled}
                  onClick={() =>
                    handlePrivacyChange(setting.key, !privacySettings[setting.key])
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                    isDisabled
                      ? "bg-gray-300 cursor-not-allowed"
                      : privacySettings[setting.key]
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
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-2">
              Recruiter Interaction
            </h3>
            <p className="text-xs text-gray-600">
              Control how recruiters can interact with you and discover your profile.
            </p>
          </div>
          {[
            {
              key: "allowRecruiterContact",
              label: "Allow Recruiter Messages",
              description: "Recruiters can send you direct messages and job opportunities",
            },
            {
              key: "showInTalentPool",
              label: "Show in Talent Pool",
              description: "Your profile appears in recruiter searches and discovery",
            },
          ].map((setting) => (
            <div
              key={setting.key}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/50 hover:bg-slate-100/50 transition-all"
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
            onClick={handleSavePrivacy}
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