import React, { useState } from "react";
import { User, MapPin, AlertCircle } from "lucide-react";

const PersonalInfoTab = ({ profileData, handleProfileChange }) => {
  const [errors, setErrors] = useState({});

  // Validation functions
  const validatePhone = (phone) => {
    if (!phone) return null; // Optional field
    
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's a valid Indian mobile number (10 digits starting with 6-9)
    if (cleanPhone.length !== 10) {
      return "Phone number must be exactly 10 digits";
    }
    
    if (!/^[6-9]/.test(cleanPhone)) {
      return "Phone number must start with 6, 7, 8, or 9";
    }
    
    return null;
  };

  const validateDateOfBirth = (dateOfBirth) => {
    if (!dateOfBirth) return null; // Optional field
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (birthDate > today) {
      return "Date of birth cannot be in the future";
    }
    
    if (age < 11) {
      return "Age must be at least 11 years";
    }
    
    if (age > 100) {
      return "Please enter a valid date of birth";
    }
    
    return null;
  };

  const validatePincode = (pincode) => {
    if (!pincode) return null; // Optional field
    
    // Remove all non-digit characters
    const cleanPincode = pincode.replace(/\D/g, '');
    
    // Check if it's exactly 6 digits
    if (cleanPincode.length !== 6) {
      return "Pincode must be exactly 6 digits";
    }
    
    return null;
  };

  // Enhanced change handler with validation
  const handleValidatedChange = (field, value) => {
    let error = null;
    
    // Format phone numbers to remove non-digits
    if (field === 'phone' || field === 'alternatePhone') {
      // Allow only digits and common phone formatting characters during input
      const formattedValue = value.replace(/[^\d]/g, '');
      
      if (field === 'phone') {
        error = validatePhone(formattedValue);
      } else if (field === 'alternatePhone') {
        error = validatePhone(formattedValue);
      }
      
      // Update with formatted value
      handleProfileChange(field, formattedValue);
    } else if (field === 'dateOfBirth') {
      error = validateDateOfBirth(value);
      handleProfileChange(field, value);
    } else if (field === 'pincode') {
      // Format pincode to remove non-digits
      const formattedValue = value.replace(/[^\d]/g, '');
      error = validatePincode(formattedValue);
      handleProfileChange(field, formattedValue);
    } else {
      handleProfileChange(field, value);
    }
    
    // Update errors state
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <User className="w-5 h-5 text-blue-600" />
        Personal Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={profileData.name}
            onChange={(e) =>
              handleProfileChange("name", e.target.value)
            }
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            placeholder="Enter your full name"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={profileData.email}
            disabled
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={profileData.phone}
            onChange={(e) =>
              handleValidatedChange("phone", e.target.value)
            }
            className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm ${
              errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200'
            }`}
            placeholder="Enter 10-digit phone number"
            maxLength="10"
          />
          {errors.phone && (
            <div className="flex items-center gap-1 text-red-600 text-xs">
              <AlertCircle className="w-3 h-3" />
              <span>{errors.phone}</span>
            </div>
          )}
        </div>

        {/* Alternate Phone */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Alternate Phone
          </label>
          <input
            type="tel"
            value={profileData.alternatePhone}
            onChange={(e) =>
              handleValidatedChange("alternatePhone", e.target.value)
            }
            className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm ${
              errors.alternatePhone ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200'
            }`}
            placeholder="Enter 10-digit alternate phone number"
            maxLength="10"
          />
          {errors.alternatePhone && (
            <div className="flex items-center gap-1 text-red-600 text-xs">
              <AlertCircle className="w-3 h-3" />
              <span>{errors.alternatePhone}</span>
            </div>
          )}
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Date of Birth
          </label>
          <input
            type="date"
            value={profileData.dateOfBirth}
            onChange={(e) =>
              handleValidatedChange("dateOfBirth", e.target.value)
            }
            className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm ${
              errors.dateOfBirth ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200'
            }`}
            max={new Date().toISOString().split('T')[0]} // Prevent future dates
          />
          {errors.dateOfBirth && (
            <div className="flex items-center gap-1 text-red-600 text-xs">
              <AlertCircle className="w-3 h-3" />
              <span>{errors.dateOfBirth}</span>
            </div>
          )}
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Gender
          </label>
          <select
            value={profileData.gender}
            onChange={(e) =>
              handleProfileChange("gender", e.target.value)
            }
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Blood Group */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Blood Group
          </label>
          <select
            value={profileData.bloodGroup}
            onChange={(e) =>
              handleProfileChange("bloodGroup", e.target.value)
            }
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
          >
            <option value="">Select Blood Group</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
      </div>

      {/* Address Information */}
      <div className="pt-6 border-t border-slate-100 mt-8">
        <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-500" />
          Address Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Address */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">
              Address
            </label>
            <textarea
              value={profileData.address}
              onChange={(e) =>
                handleProfileChange("address", e.target.value)
              }
              rows={3}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
              placeholder="Enter your full address"
            />
          </div>

          {/* City */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={profileData.location}
              onChange={(e) =>
                handleProfileChange("location", e.target.value)
              }
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              placeholder="Enter city"
            />
          </div>

          {/* State */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              State <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={profileData.state}
              onChange={(e) =>
                handleProfileChange("state", e.target.value)
              }
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              placeholder="Enter state"
            />
          </div>

          {/* Country */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Country
            </label>
            <input
              type="text"
              value={profileData.country}
              onChange={(e) =>
                handleProfileChange("country", e.target.value)
              }
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              placeholder="Enter country"
            />
          </div>

          {/* Pincode */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Pincode
            </label>
            <input
              type="text"
              value={profileData.pincode}
              onChange={(e) =>
                handleValidatedChange("pincode", e.target.value)
              }
              className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm ${
                errors.pincode ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200'
              }`}
              placeholder="Enter 6-digit pincode"
              maxLength="6"
            />
            {errors.pincode && (
              <div className="flex items-center gap-1 text-red-600 text-xs">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.pincode}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoTab;