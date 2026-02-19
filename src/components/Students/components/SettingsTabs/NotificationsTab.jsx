import React from "react";
import { Bell, Save } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { usePermissions } from "../../../../context/PermissionsContext";

const NotificationsTab = ({
  notificationSettings,
  handleNotificationToggle,
  handleSaveNotifications,
  isSaving,
}) => {
  const { canSaveNotificationPreferences } = usePermissions();
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-slate-200/50">
      <CardHeader className="border-b border-slate-100 pb-5">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-xl font-bold text-gray-900">
            Notification Preferences
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 p-6 space-y-6">
        <div className="space-y-3">
          {[
            {
              key: "emailNotifications",
              label: "Email Notifications",
              description: "Receive notifications via email",
            },
            {
              key: "applicationUpdates",
              label: "Application Updates",
              description: "Get notified about application status",
            },
            {
              key: "newOpportunities",
              label: "New Opportunities",
              description: "Alerts for new job opportunities",
            },
            {
              key: "recruitingMessages",
              label: "Recruiting Messages",
              description: "Notifications from recruiters",
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
                onClick={() => handleNotificationToggle(setting.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                  notificationSettings[setting.key]
                    ? "bg-blue-600"
                    : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
                    notificationSettings[setting.key]
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
            onClick={() => canSaveNotificationPreferences && handleSaveNotifications()}
            disabled={!canSaveNotificationPreferences || isSaving}
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
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationsTab;