import React from "react";
import { User, MapPin } from "lucide-react";

const PersonalInfoTab = ({ profileData, handleProfileChange }) => {
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
              handleProfileChange("phone", e.target.value)
            }
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            placeholder="Enter phone number"
          />
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
              handleProfileChange("alternatePhone", e.target.value)
            }
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            placeholder="Enter alternate phone number"
          />
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
              handleProfileChange("dateOfBirth", e.target.value)
            }
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
          />
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
                handleProfileChange("pincode", e.target.value)
              }
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              placeholder="Enter pincode"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoTab;