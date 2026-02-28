import React from "react";
import { Shield, Save } from "lucide-react";
import { Button } from "../../ui/button";
import { useFormValidation } from "../../../../../hooks/useFormValidation";
import FormField from "../FormField";

const GuardianInfoTab = ({ profileData, handleProfileChange, handleSaveProfile, isSaving }) => {
  const { validateSingleField, touchField, getFieldError } = useFormValidation();
  const [phoneError, setPhoneError] = React.useState('');
  const [emailError, setEmailError] = React.useState('');

  const validatePhone = (phone) => {
    if (!phone) {
      return '';
    }
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length < 10) {
      return 'Phone number must be exactly 10 digits';
    }
    if (digitsOnly.length > 10) {
      return 'Phone number must not exceed 10 digits';
    }
    return '';
  };

  const validateEmail = (email) => {
    if (!email) {
      return '';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const handleFieldChange = (field, value) => {
    // For phone field, only allow digits, spaces, hyphens, parentheses, and plus sign
    if (field === 'guardianPhone') {
      const sanitizedValue = value.replace(/[^\d\s\-\(\)\+]/g, '');
      // Count only digits
      const digitsOnly = sanitizedValue.replace(/\D/g, '');
      
      // Prevent typing more than 10 digits
      if (digitsOnly.length > 10) {
        return; // Don't update if exceeds 10 digits
      }
      
      handleProfileChange(field, sanitizedValue);
      const error = validatePhone(sanitizedValue);
      setPhoneError(error);
    } else {
      handleProfileChange(field, value);
      
      if (field === 'guardianEmail') {
        const error = validateEmail(value);
        setEmailError(error);
      }
    }
  };

  const handleFieldBlur = (field, value) => {
    touchField(field);
    
    if (field === 'guardianEmail') {
      const error = validateEmail(value);
      setEmailError(error);
    } else if (field === 'guardianPhone') {
      const error = validatePhone(value);
      setPhoneError(error);
    }
  };

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
            maxLength={10}
            value={profileData.guardianPhone}
            onChange={(e) => handleFieldChange("guardianPhone", e.target.value)}
            onBlur={(e) => handleFieldBlur("guardianPhone", e.target.value)}
            className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm ${
              phoneError ? 'border-red-500' : 'border-slate-200'
            }`}
            placeholder="Enter 10 digit phone number"
          />
          {phoneError && (
            <p className="text-sm text-red-600 mt-1">{phoneError}</p>
          )}
        </div>

        {/* Guardian Email */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Guardian Email
          </label>
          <input
            type="email"
            value={profileData.guardianEmail}
            onChange={(e) => handleFieldChange("guardianEmail", e.target.value)}
            onBlur={(e) => handleFieldBlur("guardianEmail", e.target.value)}
            className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm ${
              emailError ? 'border-red-500' : 'border-slate-200'
            }`}
            placeholder="Enter guardian email"
          />
          {emailError && (
            <p className="text-sm text-red-600 mt-1">{emailError}</p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-slate-100 mt-6">
        <Button
          onClick={handleSaveProfile}
          disabled={isSaving || phoneError || emailError}
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