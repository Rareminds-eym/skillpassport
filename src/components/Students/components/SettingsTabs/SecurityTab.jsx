import React, { useState } from "react";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { usePermissions } from "../../../../context/PermissionsContext";

const SecurityTab = ({
  passwordData,
  handlePasswordChange,
  handleSavePassword,
  isSaving,
  userEmail,
}) => {
  const { canUpdatePassword } = usePermissions();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-slate-200/50">
      <CardHeader className="border-b border-slate-100 pb-5">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl">
            <Lock className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-xl font-bold text-gray-900">
            Security Settings
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 p-6 space-y-6">
        {/* Email Info Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-1 text-sm">Account Email</h4>
              <p className="text-sm text-blue-700 mb-2">
                Password changes will be applied to: <strong>{userEmail || 'Not available'}</strong>
              </p>
              <p className="text-xs text-blue-600">
                If this email is incorrect, please log out and log in again.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900">
            Change Password
          </h3>

          {[
            {
              key: "currentPassword",
              label: "Current Password",
              show: showCurrentPassword,
              setShow: setShowCurrentPassword,
            },
            {
              key: "newPassword",
              label: "New Password",
              show: showNewPassword,
              setShow: setShowNewPassword,
            },
            {
              key: "confirmPassword",
              label: "Confirm New Password",
              show: showConfirmPassword,
              setShow: setShowConfirmPassword,
            },
          ].map((field) => (
            <div key={field.key} className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {field.label}
              </label>
              <div className="relative">
                <input
                  type={field.show ? "text" : "password"}
                  value={passwordData[field.key]}
                  onChange={(e) =>
                    handlePasswordChange(field.key, e.target.value)
                  }
                  className="w-full px-4 py-2.5 pr-12 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => field.setShow(!field.show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  {field.show ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          ))}

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Password Requirements:
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li className="flex items-center gap-2">
                <span className={passwordData.newPassword.length >= 8 ? "text-green-600 font-bold" : "text-gray-400"}>
                  {passwordData.newPassword.length >= 8 ? "✓" : "○"}
                </span>
                At least 8 characters long
              </li>
              <li className="flex items-center gap-2">
                <span className={passwordData.newPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.confirmPassword ? "text-green-600 font-bold" : "text-gray-400"}>
                  {passwordData.newPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.confirmPassword ? "✓" : "○"}
                </span>
                Passwords match
              </li>
              <li className="flex items-center gap-2">
                <span className={passwordData.newPassword && passwordData.currentPassword && passwordData.newPassword !== passwordData.currentPassword ? "text-green-600 font-bold" : "text-gray-400"}>
                  {passwordData.newPassword && passwordData.currentPassword && passwordData.newPassword !== passwordData.currentPassword ? "✓" : "○"}
                </span>
                Different from current password
              </li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-slate-100">
          <Button
            onClick={() => canUpdatePassword && handleSavePassword()}
            disabled={
              !canUpdatePassword ||
              isSaving ||
              !passwordData.currentPassword ||
              !passwordData.newPassword
            }
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
            <Lock className="w-4 h-4 mr-2" />
            {isSaving ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityTab;