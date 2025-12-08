/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Cog6ToothIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  BellIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  ClockIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  XMarkIcon,
  CheckIcon,
  PlusCircleIcon,
  TrashIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  LockClosedIcon,
  UserPlusIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import SearchBar from "../../../components/common/SearchBar";
import { supabase } from "@/lib/supabaseClient";
// import { supabase } from "../../../supabaseClient";

/* ==============================
   TYPES & INTERFACES
   ============================== */
type UserRole =
  | "school_admin"
  | "principal"
  | "vice_principal"
  | "class_teacher"
  | "subject_teacher"
  | "accountant"
  | "librarian"
  | "it_admin"
  | "career_counselor";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive" | "suspended";
  lastLogin: string;
  permissions: string[];
  createdAt: string;
}

interface AcademicYear {
  id: string;
  year: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  totalDays: number;
  daysElapsed: number;
}

interface SystemConfig {
  schoolName: string;
  schoolCode: string;
  address: string;
  phone: string;
  email: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordExpiryDays: number;
  enableMFA: boolean;
  enableBiometric: boolean;
}

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  ip: string;
  status: "success" | "failed";
}

interface ClassConfig {
  id: string;
  name: string;
  sections: string[];
  capacity: number;
}

interface SubjectConfig {
  id: string;
  name: string;
  code: string;
  type: "core" | "elective" | "skill";
  classes: string[];
}

/* ==============================
   MODAL WRAPPER
   ============================== */
const ModalWrapper = ({
  title,
  subtitle,
  children,
  isOpen,
  onClose,
  size = "default",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  size?: "default" | "large";
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        <div
          className={`relative w-full ${
            size === "large" ? "max-w-4xl" : "max-w-2xl"
          } transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all`}
        >
          <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==============================
   STATS CARD
   ============================== */
const StatsCard = ({
  label,
  value,
  icon: Icon,
  color = "blue",
  onClick,
}: {
  label: string;
  value: number | string;
  icon: any;
  color?: "blue" | "green" | "purple" | "amber" | "red" | "indigo";
  onClick?: () => void;
}) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    red: "bg-red-50 text-red-600 border-red-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div
          className={`p-3 rounded-xl border ${colorClasses[color]} transition-colors`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

/* ==============================
   USER MANAGEMENT MODAL (FULLY FUNCTIONAL)
   ============================== */
const UserManagementModal = ({
  isOpen,
  onClose,
  onSaved,
  editUser,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (user: User) => void;
  editUser?: User | null;
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "class_teacher" as UserRole,
    status: "active" as "active" | "inactive" | "suspended",
    permissions: [] as string[],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Load edit user data
  useEffect(() => {
    if (editUser && isOpen) {
      setFormData({
        name: editUser.name,
        email: editUser.email,
        role: editUser.role,
        status: editUser.status,
        permissions: editUser.permissions,
      });
    } else if (!editUser && isOpen) {
      setFormData({
        name: "",
        email: "",
        role: "class_teacher",
        status: "active",
        permissions: [],
      });
      setPassword("");
      setErrors({});
    }
  }, [editUser, isOpen]);

  const roleOptions: { value: UserRole; label: string }[] = [
    { value: "principal", label: "Principal" },
    { value: "vice_principal", label: "Vice Principal" },
    { value: "class_teacher", label: "Class Teacher" },
    { value: "subject_teacher", label: "Subject Teacher" },
    { value: "accountant", label: "Accountant" },
    { value: "librarian", label: "Librarian" },
    { value: "it_admin", label: "IT Admin" },
    { value: "career_counselor", label: "Career Counselor" },
  ];

  const availablePermissions = [
    { id: "student_view", label: "View Students", module: "Student Management" },
    { id: "student_create", label: "Create Students", module: "Student Management" },
    { id: "student_edit", label: "Edit Students", module: "Student Management" },
    { id: "student_delete", label: "Delete Students", module: "Student Management" },
    { id: "attendance_mark", label: "Mark Attendance", module: "Attendance" },
    { id: "attendance_edit", label: "Edit Attendance", module: "Attendance" },
    { id: "exam_create", label: "Create Exams", module: "Exams" },
    { id: "exam_marks", label: "Enter Marks", module: "Exams" },
    { id: "exam_publish", label: "Publish Results", module: "Exams" },
    { id: "fee_view", label: "View Fees", module: "Finance" },
    { id: "fee_collect", label: "Collect Fees", module: "Finance" },
    { id: "library_issue", label: "Issue Books", module: "Library" },
    { id: "career_view", label: "View Career Data", module: "Career Module" },
    { id: "career_counsel", label: "Career Counseling", module: "Career Module" },
    { id: "settings_manage", label: "Manage Settings", module: "System" },
  ];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!editUser && !password) {
      newErrors.password = "Password is required";
    }
    if (password && password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    setSubmitting(true);
    setTimeout(() => {
      onSaved({
        id: editUser?.id || Date.now().toString(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        status: formData.status,
        permissions: formData.permissions,
        lastLogin: editUser?.lastLogin || "Never",
        createdAt: editUser?.createdAt || new Date().toISOString(),
      });
      setSubmitting(false);
      onClose();
    }, 400);
  };

  const togglePermission = (permId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  const selectAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: availablePermissions.map((p) => p.id),
    }));
  };

  const clearAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: [],
    }));
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={editUser ? "Edit User" : "Add New User"}
      subtitle={editUser ? "Update user details and permissions" : "Create a new user account"}
      size="large"
    >
      {Object.keys(errors).length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 mb-1">
              Please fix the following errors:
            </p>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-0.5">
              {Object.values(errors).map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full rounded-lg border ${
              errors.name ? "border-red-300" : "border-gray-300"
            } px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`}
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`w-full rounded-lg border ${
              errors.email ? "border-red-300" : "border-gray-300"
            } px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`}
            placeholder="john@school.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value as UserRole })
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as "active" | "inactive" | "suspended",
              })
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {!editUser && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded-lg border ${
                  errors.password ? "border-red-300" : "border-gray-300"
                } px-4 py-2.5 pr-10 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`}
                placeholder="Min 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        )}

        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Permissions ({formData.permissions.length} selected)
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAllPermissions}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Select All
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={clearAllPermissions}
                className="text-xs text-gray-600 hover:text-gray-700 font-medium"
              >
                Clear All
              </button>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
            {Object.entries(
              availablePermissions.reduce((acc, perm) => {
                if (!acc[perm.module]) acc[perm.module] = [];
                acc[perm.module].push(perm);
                return acc;
              }, {} as Record<string, typeof availablePermissions>)
            ).map(([module, perms]) => (
              <div key={module} className="mb-4 last:mb-0">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  {module}
                </h4>
                <div className="space-y-2">
                  {perms.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={submitting}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {submitting ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              {editUser ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              {editUser ? "Update User" : "Create User"}
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ==============================
   SYSTEM CONFIG MODAL (FULLY FUNCTIONAL)
   ============================== */
const SystemConfigModal = ({
  isOpen,
  onClose,
  config,
  onSaved,
  schoolId,
}: {
  isOpen: boolean;
  onClose: () => void;
  config: SystemConfig;
  onSaved: (config: SystemConfig) => void;
  schoolId: string | null;
}) => {
  const [formData, setFormData] = useState<SystemConfig>(config);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(config);
    }
  }, [config, isOpen]);

  const handleSubmit = async () => {
    if (!schoolId) {
      alert("School ID not found");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("schools")
        .update({
          name: formData.schoolName,
          code: formData.schoolCode,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          updated_at: new Date().toISOString(),
        })
        .eq("id", schoolId);

      if (error) {
        console.error("Error updating school:", error);
        alert("Failed to update school information");
        return;
      }

      onSaved(formData);
      onClose();
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      alert("Failed to update school information");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="System Configuration"
      subtitle="Configure system-wide settings and security policies"
      size="large"
    >
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">School Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Name
              </label>
              <input
                value={formData.schoolName}
                onChange={(e) =>
                  setFormData({ ...formData, schoolName: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Code
              </label>
              <input
                value={formData.schoolCode}
                onChange={(e) =>
                  setFormData({ ...formData, schoolCode: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Security Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                value={formData.sessionTimeout}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sessionTimeout: parseInt(e.target.value) || 30,
                  })
                }
                min="5"
                max="120"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Login Attempts
              </label>
              <input
                type="number"
                value={formData.maxLoginAttempts}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxLoginAttempts: parseInt(e.target.value) || 3,
                  })
                }
                min="3"
                max="10"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Expiry (days)
              </label>
              <input
                type="number"
                value={formData.passwordExpiryDays}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    passwordExpiryDays: parseInt(e.target.value) || 90,
                  })
                }
                min="30"
                max="365"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Advanced Features</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Multi-Factor Authentication
                  </p>
                  <p className="text-xs text-gray-500">
                    Require MFA for admin users
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.enableMFA}
                onChange={(e) =>
                  setFormData({ ...formData, enableMFA: e.target.checked })
                }
                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <LockClosedIcon className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Biometric Attendance
                  </p>
                  <p className="text-xs text-gray-500">
                    Enable RFID/fingerprint integration
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.enableBiometric}
                onChange={(e) =>
                  setFormData({ ...formData, enableBiometric: e.target.checked })
                }
                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={submitting}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {submitting ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              Save Configuration
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ==============================
   ACADEMIC YEAR MODAL (NEW - FULLY FUNCTIONAL)
   ============================== */
const AcademicYearModal = ({
  isOpen,
  onClose,
  onSaved,
  editYear,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (year: AcademicYear) => void;
  editYear?: AcademicYear | null;
}) => {
  const [formData, setFormData] = useState({
    year: "",
    startDate: "",
    endDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editYear && isOpen) {
      setFormData({
        year: editYear.year,
        startDate: editYear.startDate,
        endDate: editYear.endDate,
      });
    } else if (!editYear && isOpen) {
      setFormData({
        year: "",
        startDate: "",
        endDate: "",
      });
      setErrors({});
    }
  }, [editYear, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.year.trim()) {
      newErrors.year = "Academic year is required";
    }
    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }
    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }
    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      newErrors.endDate = "End date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    setSubmitting(true);
    setTimeout(() => {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const today = new Date();
      const daysElapsed = today > start ? Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) : 0;

      onSaved({
        id: editYear?.id || Date.now().toString(),
        year: formData.year.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        isActive: editYear?.isActive || false,
        totalDays,
        daysElapsed: Math.min(daysElapsed, totalDays),
      });
      setSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={editYear ? "Edit Academic Year" : "Add Academic Year"}
      subtitle={editYear ? "Update academic year details" : "Create a new academic year"}
    >
      {Object.keys(errors).length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 mb-1">
              Please fix the following errors:
            </p>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-0.5">
              {Object.values(errors).map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Academic Year <span className="text-red-500">*</span>
          </label>
          <input
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            className={`w-full rounded-lg border ${
              errors.year ? "border-red-300" : "border-gray-300"
            } px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`}
            placeholder="e.g., 2025-2026"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className={`w-full rounded-lg border ${
              errors.startDate ? "border-red-300" : "border-gray-300"
            } px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className={`w-full rounded-lg border ${
              errors.endDate ? "border-red-300" : "border-gray-300"
            } px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`}
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={submitting}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {submitting ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              {editYear ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              {editYear ? "Update Year" : "Create Year"}
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ==============================
   ROLE PERMISSIONS MODAL (NEW - FULLY FUNCTIONAL)
   ============================== */
const RolePermissionsModal = ({
  isOpen,
  onClose,
  role,
  currentPermissions,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  role: string;
  currentPermissions: string[];
  onSaved: (permissions: string[]) => void;
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedPermissions(currentPermissions);
    }
  }, [isOpen, currentPermissions]);

  const availablePermissions = [
    { id: "student_view", label: "View Students", module: "Student Management" },
    { id: "student_create", label: "Create Students", module: "Student Management" },
    { id: "student_edit", label: "Edit Students", module: "Student Management" },
    { id: "student_delete", label: "Delete Students", module: "Student Management" },
    { id: "attendance_mark", label: "Mark Attendance", module: "Attendance" },
    { id: "attendance_edit", label: "Edit Attendance", module: "Attendance" },
    { id: "exam_create", label: "Create Exams", module: "Exams" },
    { id: "exam_marks", label: "Enter Marks", module: "Exams" },
    { id: "exam_publish", label: "Publish Results", module: "Exams" },
    { id: "fee_view", label: "View Fees", module: "Finance" },
    { id: "fee_collect", label: "Collect Fees", module: "Finance" },
    { id: "library_issue", label: "Issue Books", module: "Library" },
    { id: "career_view", label: "View Career Data", module: "Career Module" },
    { id: "career_counsel", label: "Career Counseling", module: "Career Module" },
    { id: "settings_manage", label: "Manage Settings", module: "System" },
  ];

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId)
        ? prev.filter((p) => p !== permId)
        : [...prev, permId]
    );
  };

  const selectAllPermissions = () => {
    setSelectedPermissions(availablePermissions.map((p) => p.id));
  };

  const clearAllPermissions = () => {
    setSelectedPermissions([]);
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      onSaved(selectedPermissions);
      setSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={`Configure ${role} Permissions`}
      subtitle="Select permissions for this role"
      size="large"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {selectedPermissions.length} of {availablePermissions.length} permissions selected
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAllPermissions}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Select All
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={clearAllPermissions}
            className="text-xs text-gray-600 hover:text-gray-700 font-medium"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
        {Object.entries(
          availablePermissions.reduce((acc, perm) => {
            if (!acc[perm.module]) acc[perm.module] = [];
            acc[perm.module].push(perm);
            return acc;
          }, {} as Record<string, typeof availablePermissions>)
        ).map(([module, perms]) => (
          <div key={module} className="mb-4 last:mb-0">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              {module}
            </h4>
            <div className="space-y-2">
              {perms.map((perm) => (
                <label
                  key={perm.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(perm.id)}
                    onChange={() => togglePermission(perm.id)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={submitting}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {submitting ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              Save Permissions
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ==============================
   CLASS CONFIGURATION MODAL (NEW - FULLY FUNCTIONAL)
   ============================== */
const ClassConfigModal = ({
  isOpen,
  onClose,
  onSaved,
  editClass,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (classConfig: ClassConfig) => void;
  editClass?: ClassConfig | null;
}) => {
  const [formData, setFormData] = useState({
    name: "",
    sections: [] as string[],
    capacity: 40,
  });
  const [sectionInput, setSectionInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editClass && isOpen) {
      setFormData({
        name: editClass.name,
        sections: editClass.sections,
        capacity: editClass.capacity,
      });
    } else if (!editClass && isOpen) {
      setFormData({
        name: "",
        sections: [],
        capacity: 40,
      });
      setErrors({});
    }
  }, [editClass, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Class name is required";
    }
    if (formData.sections.length === 0) {
      newErrors.sections = "At least one section is required";
    }
    if (formData.capacity < 1) {
      newErrors.capacity = "Capacity must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    setSubmitting(true);
    setTimeout(() => {
      onSaved({
        id: editClass?.id || Date.now().toString(),
        name: formData.name.trim(),
        sections: formData.sections,
        capacity: formData.capacity,
      });
      setSubmitting(false);
      onClose();
    }, 400);
  };

  const addSection = () => {
    if (sectionInput.trim() && !formData.sections.includes(sectionInput.trim().toUpperCase())) {
      setFormData({
        ...formData,
        sections: [...formData.sections, sectionInput.trim().toUpperCase()],
      });
      setSectionInput("");
    }
  };

  const removeSection = (section: string) => {
    setFormData({
      ...formData,
      sections: formData.sections.filter((s) => s !== section),
    });
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={editClass ? "Edit Class" : "Add Class"}
      subtitle={editClass ? "Update class configuration" : "Create a new class"}
    >
      {Object.keys(errors).length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 mb-1">
              Please fix the following errors:
            </p>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-0.5">
              {Object.values(errors).map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Class Name <span className="text-red-500">*</span>
          </label>
          <input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full rounded-lg border ${
              errors.name ? "border-red-300" : "border-gray-300"
            } px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`}
            placeholder="e.g., Class 10, Grade 9"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sections <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 mb-3">
            <input
              value={sectionInput}
              onChange={(e) => setSectionInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addSection()}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Enter section (e.g., A, B, C)"
              maxLength={2}
            />
            <button
              type="button"
              onClick={addSection}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Add
            </button>
          </div>
          {formData.sections.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.sections.map((section) => (
                <span
                  key={section}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium"
                >
                  Section {section}
                  <button
                    type="button"
                    onClick={() => removeSection(section)}
                    className="hover:text-indigo-900"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {errors.sections && (
            <p className="mt-2 text-sm text-red-600">{errors.sections}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Capacity per Section <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.capacity}
            onChange={(e) =>
              setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })
            }
            min="1"
            max="100"
            className={`w-full rounded-lg border ${
              errors.capacity ? "border-red-300" : "border-gray-300"
            } px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={submitting}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {submitting ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              {editClass ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              {editClass ? "Update Class" : "Create Class"}
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ==============================
   SUBJECT CONFIGURATION MODAL (NEW - FULLY FUNCTIONAL)
   ============================== */
const SubjectConfigModal = ({
  isOpen,
  onClose,
  onSaved,
  editSubject,
  availableClasses,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (subject: SubjectConfig) => void;
  editSubject?: SubjectConfig | null;
  availableClasses: ClassConfig[];
}) => {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "core" as "core" | "elective" | "skill",
    classes: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editSubject && isOpen) {
      setFormData({
        name: editSubject.name,
        code: editSubject.code,
        type: editSubject.type,
        classes: editSubject.classes,
      });
    } else if (!editSubject && isOpen) {
      setFormData({
        name: "",
        code: "",
        type: "core",
        classes: [],
      });
      setErrors({});
    }
  }, [editSubject, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Subject name is required";
    }
    if (!formData.code.trim()) {
      newErrors.code = "Subject code is required";
    }
    if (formData.classes.length === 0) {
      newErrors.classes = "At least one class must be selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    setSubmitting(true);
    setTimeout(() => {
      onSaved({
        id: editSubject?.id || Date.now().toString(),
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        classes: formData.classes,
      });
      setSubmitting(false);
      onClose();
    }, 400);
  };

  const toggleClass = (classId: string) => {
    setFormData((prev) => ({
      ...prev,
      classes: prev.classes.includes(classId)
        ? prev.classes.filter((c) => c !== classId)
        : [...prev.classes, classId],
    }));
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={editSubject ? "Edit Subject" : "Add Subject"}
      subtitle={editSubject ? "Update subject configuration" : "Create a new subject"}
    >
      {Object.keys(errors).length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 mb-1">
              Please fix the following errors:
            </p>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-0.5">
              {Object.values(errors).map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject Name <span className="text-red-500">*</span>
          </label>
          <input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full rounded-lg border ${
              errors.name ? "border-red-300" : "border-gray-300"
            } px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`}
            placeholder="e.g., Mathematics, Physics"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject Code <span className="text-red-500">*</span>
          </label>
          <input
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className={`w-full rounded-lg border ${
              errors.code ? "border-red-300" : "border-gray-300"
            } px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`}
            placeholder="e.g., MATH101, PHY201"
            maxLength={10}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value as "core" | "elective" | "skill" })
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="core">Core Subject</option>
            <option value="elective">Elective Subject</option>
            <option value="skill">Skill Subject</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Applicable Classes <span className="text-red-500">*</span>
          </label>
          <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
            {availableClasses.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No classes available. Please add classes first.
              </p>
            ) : (
              <div className="space-y-2">
                {availableClasses.map((cls) => (
                  <label
                    key={cls.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.classes.includes(cls.id)}
                      onChange={() => toggleClass(cls.id)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{cls.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {errors.classes && (
            <p className="mt-2 text-sm text-red-600">{errors.classes}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={submitting}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {submitting ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              {editSubject ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              {editSubject ? "Update Subject" : "Create Subject"}
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ==============================
   MAIN SETTINGS COMPONENT (FULLY FUNCTIONAL)
   ============================== */
const Settings = () => {
  const [activeTab, setActiveTab] = useState<
    "users" | "roles" | "classes" | "academic" | "system" | "audit"
  >("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "suspended">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [showUserModal, setShowUserModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAcademicModal, setShowAcademicModal] = useState(false);
  const [showRolePermissionsModal, setShowRolePermissionsModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editAcademicYear, setEditAcademicYear] = useState<AcademicYear | null>(null);
  const [editClass, setEditClass] = useState<ClassConfig | null>(null);
  const [editSubject, setEditSubject] = useState<SubjectConfig | null>(null);
  const [selectedRole, setSelectedRole] = useState<{ name: string; permissions: string[] } | null>(null);
  const [auditTimeFilter, setAuditTimeFilter] = useState("24h");

  // Filter audit logs based on time filter
  const getFilteredAuditLogs = () => {
    if (!auditTimeFilter || auditTimeFilter === "all") return auditLogs;

    const now = new Date();
    let cutoffDate = new Date();

    switch (auditTimeFilter) {
      case "24h":
        cutoffDate.setHours(now.getHours() - 24);
        break;
      case "7d":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        cutoffDate.setDate(now.getDate() - 30);
        break;
      default:
        return auditLogs;
    }

    return auditLogs.filter((log) => {
      const logDate = new Date(log.timestamp);
      return logDate >= cutoffDate;
    });
  };

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Academic Years State
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

  // System Config State
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    schoolName: "",
    schoolCode: "",
    address: "",
    phone: "",
    email: "",
    sessionTimeout: 30,
    maxLoginAttempts: 3,
    passwordExpiryDays: 90,
    enableMFA: false,
    enableBiometric: false,
  });
  const [currentSchoolId, setCurrentSchoolId] = useState<string | null>(null);

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([]);
  const [originalNotificationSettings, setOriginalNotificationSettings] = useState<NotificationSetting[]>([]);
  const [notificationSettingsChanged, setNotificationSettingsChanged] = useState(false);

  // Classes State
  const [classes, setClasses] = useState<ClassConfig[]>([]);

  // Subjects State
  const [subjects, setSubjects] = useState<SubjectConfig[]>([]);

  // Role Permissions State
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({
    Principal: [],
    "Vice Principal": [],
    "Class Teacher": [],
    "Subject Teacher": [],
    Accountant: [],
    Librarian: [],
    "IT Admin": [],
    "Career Counselor": [],
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Fetch current school ID and data
  useEffect(() => {
    fetchCurrentSchool();
  }, []);

  useEffect(() => {
    if (currentSchoolId) {
      fetchSchoolEducators();
      fetchSchoolClasses();
      fetchAcademicYears();
      fetchSubjects();
      fetchAuditLogs();
      fetchRolePermissions();
      fetchNotificationSettings();
    }
  }, [currentSchoolId]);

  const fetchCurrentSchool = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("No authenticated user");
        return;
      }

      // Get school_id from school_educators table
      const { data: educator, error: educatorError } = await supabase
        .from("school_educators")
        .select("school_id, role")
        .eq("user_id", user.id)
        .single();

      if (educatorError || !educator) {
        console.error("Error fetching educator:", educatorError);
        return;
      }

      setCurrentSchoolId(educator.school_id);

      // Fetch school details
      const { data: school, error: schoolError } = await supabase
        .from("schools")
        .select("*")
        .eq("id", educator.school_id)
        .single();

      if (schoolError || !school) {
        console.error("Error fetching school:", schoolError);
        return;
      }

      setSystemConfig({
        schoolName: school.name || "",
        schoolCode: school.code || "",
        address: school.address || "",
        phone: school.phone || "",
        email: school.email || "",
        sessionTimeout: 30,
        maxLoginAttempts: 3,
        passwordExpiryDays: 90,
        enableMFA: false,
        enableBiometric: false,
      });
    } catch (error) {
      console.error("Error in fetchCurrentSchool:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchoolEducators = async () => {
    if (!currentSchoolId) return;

    try {
      const { data, error } = await supabase
        .from("school_educators")
        .select(`
          id,
          user_id,
          first_name,
          last_name,
          email,
          role,
          account_status,
          created_at,
          metadata
        `)
        .eq("school_id", currentSchoolId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching educators:", error);
        return;
      }

      const mappedUsers: User[] = (data || []).map((educator: any) => ({
        id: educator.id,
        name: `${educator.first_name || ""} ${educator.last_name || ""}`.trim() || "Unknown",
        email: educator.email || "",
        role: mapEducatorRoleToUserRole(educator.role),
        status: mapAccountStatusToUserStatus(educator.account_status),
        lastLogin: "N/A",
        permissions: educator.metadata?.permissions || getRolePermissions(educator.role),
        createdAt: educator.created_at ? new Date(educator.created_at).toLocaleDateString() : "",
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error("Error in fetchSchoolEducators:", error);
    }
  };

  const fetchSchoolClasses = async () => {
    if (!currentSchoolId) return;

    try {
      const { data, error } = await supabase
        .from("school_classes")
        .select("*")
        .eq("school_id", currentSchoolId)
        .eq("account_status", "active")
        .order("grade", { ascending: true });

      if (error) {
        console.error("Error fetching classes:", error);
        return;
      }

      const mappedClasses: ClassConfig[] = (data || []).map((cls: any) => ({
        id: cls.id,
        name: `${cls.name || cls.grade}${cls.section ? ` - ${cls.section}` : ""}`,
        sections: cls.section ? [cls.section] : [],
        capacity: cls.max_students || 40,
      }));

      setClasses(mappedClasses);
    } catch (error) {
      console.error("Error in fetchSchoolClasses:", error);
    }
  };

  const fetchAcademicYears = async () => {
    if (!currentSchoolId) return;

    try {
      const { data, error } = await supabase
        .from("curriculum_academic_years")
        .select("*")
        .eq("school_id", currentSchoolId)
        .eq("is_active", true)
        .order("year", { ascending: false });

      if (error) {
        console.error("Error fetching academic years:", error);
        return;
      }

      const mappedYears: AcademicYear[] = (data || []).map((year: any) => {
        const start = new Date(year.start_date);
        const end = new Date(year.end_date);
        const today = new Date();
        const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const daysElapsed = today > start ? Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        return {
          id: year.id,
          year: year.year,
          startDate: year.start_date,
          endDate: year.end_date,
          isActive: year.is_current || false,
          totalDays,
          daysElapsed: Math.min(daysElapsed, totalDays),
        };
      });

      setAcademicYears(mappedYears);
    } catch (error) {
      console.error("Error in fetchAcademicYears:", error);
    }
  };

  const fetchSubjects = async () => {
    if (!currentSchoolId) return;

    try {
      // Fetch subjects for this school (school-specific and global)
      const { data, error } = await supabase
        .from("curriculum_subjects")
        .select("*")
        .or(`school_id.eq.${currentSchoolId},school_id.is.null`)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching subjects:", error);
        return;
      }

      // For each subject, we need to find which classes use it
      // This requires checking the curriculums table
      const subjectsWithClasses = await Promise.all(
        (data || []).map(async (subject: any) => {
          const { data: curriculums } = await supabase
            .from("curriculums")
            .select("id, class")
            .eq("school_id", currentSchoolId)
            .eq("subject", subject.name);

          const classIds = curriculums?.map((c: any) => c.id) || [];

          return {
            id: subject.id,
            name: subject.name,
            code: subject.name.substring(0, 3).toUpperCase() + "101",
            type: "core" as "core" | "elective" | "skill",
            classes: classIds,
          };
        })
      );

      setSubjects(subjectsWithClasses);
    } catch (error) {
      console.error("Error in fetchSubjects:", error);
    }
  };

  const fetchAuditLogs = async () => {
    if (!currentSchoolId) return;

    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select(`
          id,
          action,
          target,
          payload,
          ip,
          createdAt,
          actorId,
          users!audit_logs_actorid_fkey (
            firstName,
            lastName,
            email,
            role
          )
        `)
        .order("createdAt", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching audit logs:", error);
        return;
      }

      // Filter logs to only include school_admin and school_educator roles
      const filteredData = (data || []).filter((log: any) => {
        if (!log.users || !log.users.role) return false;
        return log.users.role === "school_admin" || log.users.role === "school_educator";
      });

      const mappedLogs: AuditLog[] = filteredData.map((log: any) => {
        // Format user name
        let userName = "System";
        if (log.users) {
          const fullName = `${log.users.firstName || ""} ${log.users.lastName || ""}`.trim();
          userName = fullName || log.users.email || "Unknown User";
        }

        // Format action - convert snake_case to Title Case
        const formattedAction = log.action
          ? log.action
              .split("_")
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(" ")
          : "Unknown Action";

        // Format module/target - convert to readable format
        let module = "System";
        if (log.target) {
          // If target is a UUID, try to get more info from payload
          if (log.target.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            // Check payload for more context
            if (log.payload && typeof log.payload === "object") {
              if (log.payload.table) {
                module = formatTableName(log.payload.table);
              } else if (log.payload.type) {
                module = formatTableName(log.payload.type);
              } else {
                module = "Record Management";
              }
            } else {
              module = "Record Management";
            }
          } else {
            module = formatTableName(log.target);
          }
        }

        // Determine status from action or payload
        let status: "success" | "failed" = "success";
        if (log.action?.includes("fail") || log.action?.includes("error")) {
          status = "failed";
        }

        return {
          id: log.id,
          timestamp: new Date(log.createdAt).toLocaleString(),
          user: userName,
          action: formattedAction,
          module: module,
          ip: log.ip || "N/A",
          status: status,
        };
      });

      setAuditLogs(mappedLogs);
    } catch (error) {
      console.error("Error in fetchAuditLogs:", error);
    }
  };

  // Fetch role permissions from user_settings
  const fetchRolePermissions = async () => {
    if (!currentSchoolId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch from user_settings table using privacy_settings JSONB column
      const { data, error } = await supabase
        .from("user_settings")
        .select("privacy_settings")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching role permissions:", error);
        return;
      }

      // If data exists and has rolePermissions, use it
      if (data?.privacy_settings?.rolePermissions) {
        setRolePermissions(data.privacy_settings.rolePermissions);
      } else {
        // Set default permissions if none exist
        const defaultPermissions = {
          Principal: ["student_view", "student_create", "student_edit", "student_delete", "attendance_mark", "attendance_edit", "exam_create", "exam_marks", "exam_publish", "fee_view", "fee_collect", "library_issue", "career_view", "career_counsel", "settings_manage"],
          "Vice Principal": ["student_view", "student_create", "student_edit", "attendance_mark", "attendance_edit", "exam_create", "exam_marks", "exam_publish", "career_view", "career_counsel", "settings_manage"],
          "Class Teacher": ["student_view", "attendance_mark", "exam_marks", "career_view", "career_counsel"],
          "Subject Teacher": ["student_view", "exam_marks", "career_view"],
          Accountant: ["fee_view", "fee_collect"],
          Librarian: ["library_issue"],
          "IT Admin": ["student_view", "settings_manage"],
          "Career Counselor": ["student_view", "career_view", "career_counsel"],
        };
        setRolePermissions(defaultPermissions);
        // Save defaults to database
        await saveRolePermissionsToDb(defaultPermissions);
      }
    } catch (error) {
      console.error("Error in fetchRolePermissions:", error);
    }
  };

  // Save role permissions to database
  const saveRolePermissionsToDb = async (permissions: Record<string, string[]>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user_settings record exists
      const { data: existing } = await supabase
        .from("user_settings")
        .select("id, privacy_settings")
        .eq("user_id", user.id)
        .single();

      const updatedPrivacySettings = {
        ...(existing?.privacy_settings || {}),
        rolePermissions: permissions,
      };

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from("user_settings")
          .update({
            privacy_settings: updatedPrivacySettings,
            updated_at: new Date().toISOString(),
            updated_by: user.id,
          })
          .eq("user_id", user.id);

        if (error) {
          console.error("Error updating role permissions:", error);
        }
      } else {
        // Insert new record
        const { error } = await supabase
          .from("user_settings")
          .insert({
            user_id: user.id,
            privacy_settings: updatedPrivacySettings,
            notification_preferences: {},
            ui_preferences: {},
            communication_preferences: {},
            updated_by: user.id,
          });

        if (error) {
          console.error("Error inserting role permissions:", error);
        }
      }
    } catch (error) {
      console.error("Error in saveRolePermissionsToDb:", error);
    }
  };

  // Fetch notification settings from user_settings
  const fetchNotificationSettings = async () => {
    if (!currentSchoolId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch from user_settings table using notification_preferences JSONB column
      const { data, error } = await supabase
        .from("user_settings")
        .select("notification_preferences")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching notification settings:", error);
        return;
      }

      // If data exists and has notificationSettings, use it
      if (data?.notification_preferences?.notificationSettings) {
        const settings = data.notification_preferences.notificationSettings;
        setNotificationSettings(settings);
        setOriginalNotificationSettings(JSON.parse(JSON.stringify(settings))); // Deep copy
        setNotificationSettingsChanged(false);
      } else {
        // Set default notification settings if none exist
        const defaultSettings: NotificationSetting[] = [
          {
            id: "1",
            label: "Attendance Alerts",
            description: "Notify parents when student is absent",
            enabled: true,
          },
          {
            id: "2",
            label: "Fee Reminders",
            description: "Send fee payment reminders before due date",
            enabled: true,
          },
          {
            id: "3",
            label: "Exam Notifications",
            description: "Alert students and parents about upcoming exams",
            enabled: true,
          },
          {
            id: "4",
            label: "Result Publishing",
            description: "Notify when exam results are published",
            enabled: true,
          },
          {
            id: "5",
            label: "Career Updates",
            description: "Send career assessment and recommendation updates",
            enabled: false,
          },
        ];
        setNotificationSettings(defaultSettings);
        setOriginalNotificationSettings(JSON.parse(JSON.stringify(defaultSettings))); // Deep copy
        setNotificationSettingsChanged(false);
        // Save defaults to database
        await saveNotificationSettingsToDb(defaultSettings);
      }
    } catch (error) {
      console.error("Error in fetchNotificationSettings:", error);
    }
  };

  // Save notification settings to database
  const saveNotificationSettingsToDb = async (settings: NotificationSetting[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user_settings record exists
      const { data: existing } = await supabase
        .from("user_settings")
        .select("id, notification_preferences")
        .eq("user_id", user.id)
        .single();

      const updatedNotificationPreferences = {
        ...(existing?.notification_preferences || {}),
        notificationSettings: settings,
      };

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from("user_settings")
          .update({
            notification_preferences: updatedNotificationPreferences,
            updated_at: new Date().toISOString(),
            updated_by: user.id,
          })
          .eq("user_id", user.id);

        if (error) {
          console.error("Error updating notification settings:", error);
        }
      } else {
        // Insert new record
        const { error } = await supabase
          .from("user_settings")
          .insert({
            user_id: user.id,
            notification_preferences: updatedNotificationPreferences,
            privacy_settings: {},
            ui_preferences: {},
            communication_preferences: {},
            updated_by: user.id,
          });

        if (error) {
          console.error("Error inserting notification settings:", error);
        }
      }
    } catch (error) {
      console.error("Error in saveNotificationSettingsToDb:", error);
    }
  };

  // Helper function to format table names
  const formatTableName = (name: string): string => {
    if (!name) return "System";
    
    // Common table name mappings
    const tableNameMap: Record<string, string> = {
      courses: "Course Management",
      students: "Student Management",
      school_educators: "Educator Management",
      school_classes: "Class Management",
      curriculum_subjects: "Subject Management",
      curriculums: "Curriculum Management",
      lesson_plans: "Lesson Plans",
      attendance_records: "Attendance",
      assignments: "Assignments",
      timetables: "Timetable",
      users: "User Management",
      schools: "School Settings",
    };

    // Check if we have a mapping
    if (tableNameMap[name.toLowerCase()]) {
      return tableNameMap[name.toLowerCase()];
    }

    // Otherwise, format the name
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Helper functions
  const mapEducatorRoleToUserRole = (role: string): UserRole => {
    const roleMap: Record<string, UserRole> = {
      school_admin: "school_admin",
      principal: "principal",
      vice_principal: "vice_principal",
      class_teacher: "class_teacher",
      subject_teacher: "subject_teacher",
      it_admin: "it_admin",
    };
    return roleMap[role] || "subject_teacher";
  };

  const mapAccountStatusToUserStatus = (status: string): "active" | "inactive" | "suspended" => {
    if (status === "active") return "active";
    if (status === "suspended") return "suspended";
    return "inactive";
  };

  const getRolePermissions = (role: string): string[] => {
    const permissionsMap: Record<string, string[]> = {
      principal: ["student_view", "student_create", "student_edit", "student_delete", "attendance_mark", "exam_publish", "settings_manage"],
      vice_principal: ["student_view", "student_create", "attendance_mark", "exam_marks"],
      class_teacher: ["student_view", "attendance_mark", "exam_marks"],
      subject_teacher: ["student_view", "exam_marks"],
      school_admin: ["student_view", "student_create", "settings_manage"],
      it_admin: ["settings_manage"],
    };
    return permissionsMap[role] || [];
  };

  // Filtered Users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  // User Handlers
  const handleAddUser = () => {
    setEditUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      setUsers(users.filter((u) => u.id !== userId));
    }
  };

  const handleSaveUser = async (user: User) => {
    try {
      if (editUser) {
        // Update existing educator
        const { error } = await supabase
          .from("school_educators")
          .update({
            first_name: user.name.split(" ")[0],
            last_name: user.name.split(" ").slice(1).join(" "),
            email: user.email,
            role: user.role,
            account_status: user.status,
            metadata: {
              permissions: user.permissions,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (error) {
          console.error("Error updating educator:", error);
          alert("Failed to update user");
          return;
        }

        setUsers(users.map((u) => (u.id === user.id ? user : u)));
      } else {
        // Create new educator - Note: This requires creating a user in auth first
        alert("Creating new users requires additional setup. Please use the user management system.");
      }
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Failed to save user");
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const newStatus = user.status === "active" ? "inactive" : "active";

    try {
      const { error } = await supabase
        .from("school_educators")
        .update({
          account_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        console.error("Error updating user status:", error);
        alert("Failed to update user status");
        return;
      }

      setUsers(users.map((u) => {
        if (u.id === userId) {
          return { ...u, status: newStatus };
        }
        return u;
      }));
    } catch (error) {
      console.error("Error in handleToggleUserStatus:", error);
      alert("Failed to update user status");
    }
  };

  // Academic Year Handlers
  const handleAddAcademicYear = () => {
    setEditAcademicYear(null);
    setShowAcademicModal(true);
  };

  const handleEditAcademicYear = (year: AcademicYear) => {
    setEditAcademicYear(year);
    setShowAcademicModal(true);
  };

  const handleSaveAcademicYear = async (year: AcademicYear) => {
    if (!currentSchoolId) return;

    try {
      if (editAcademicYear) {
        // Update existing academic year
        const { error } = await supabase
          .from("curriculum_academic_years")
          .update({
            year: year.year,
            start_date: year.startDate,
            end_date: year.endDate,
            updated_at: new Date().toISOString(),
          })
          .eq("id", year.id);

        if (error) {
          console.error("Error updating academic year:", error);
          alert("Failed to update academic year");
          return;
        }

        setAcademicYears(academicYears.map((y) => (y.id === year.id ? year : y)));
      } else {
        // Create new academic year
        const { data, error } = await supabase
          .from("curriculum_academic_years")
          .insert({
            school_id: currentSchoolId,
            year: year.year,
            start_date: year.startDate,
            end_date: year.endDate,
            is_active: true,
            is_current: false,
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating academic year:", error);
          alert("Failed to create academic year");
          return;
        }

        setAcademicYears([...academicYears, { ...year, id: data.id }]);
      }
    } catch (error) {
      console.error("Error saving academic year:", error);
      alert("Failed to save academic year");
    }
  };

  const handleActivateAcademicYear = async (yearId: string) => {
    if (!currentSchoolId) return;

    try {
      // First, deactivate all academic years for this school
      await supabase
        .from("curriculum_academic_years")
        .update({ is_current: false })
        .eq("school_id", currentSchoolId);

      // Then activate the selected year
      const { error } = await supabase
        .from("curriculum_academic_years")
        .update({ is_current: true })
        .eq("id", yearId);

      if (error) {
        console.error("Error activating academic year:", error);
        alert("Failed to activate academic year");
        return;
      }

      setAcademicYears(academicYears.map((y) => ({
        ...y,
        isActive: y.id === yearId,
      })));
    } catch (error) {
      console.error("Error in handleActivateAcademicYear:", error);
      alert("Failed to activate academic year");
    }
  };

  const handleDeleteAcademicYear = async (yearId: string) => {
    if (!confirm("Are you sure you want to delete this academic year?")) return;

    try {
      const { error } = await supabase
        .from("curriculum_academic_years")
        .delete()
        .eq("id", yearId);

      if (error) {
        console.error("Error deleting academic year:", error);
        alert("Failed to delete academic year");
        return;
      }

      setAcademicYears(academicYears.filter((y) => y.id !== yearId));
    } catch (error) {
      console.error("Error in handleDeleteAcademicYear:", error);
      alert("Failed to delete academic year");
    }
  };

  // Notification Handler
  const handleToggleNotification = (notifId: string) => {
    const updatedSettings = notificationSettings.map((n) => {
      if (n.id === notifId) {
        return { ...n, enabled: !n.enabled };
      }
      return n;
    });
    
    setNotificationSettings(updatedSettings);
    setNotificationSettingsChanged(true);
  };

  const handleSaveNotificationSettings = async () => {
    await saveNotificationSettingsToDb(notificationSettings);
    setOriginalNotificationSettings(JSON.parse(JSON.stringify(notificationSettings)));
    setNotificationSettingsChanged(false);
  };

  const handleCancelNotificationSettings = () => {
    setNotificationSettings(JSON.parse(JSON.stringify(originalNotificationSettings)));
    setNotificationSettingsChanged(false);
  };

  // Role Permissions Handlers
  const handleConfigureRole = (roleName: string) => {
    setSelectedRole({
      name: roleName,
      permissions: rolePermissions[roleName] || [],
    });
    setShowRolePermissionsModal(true);
  };

  const handleSaveRolePermissions = async (permissions: string[]) => {
    if (selectedRole) {
      const updatedPermissions = {
        ...rolePermissions,
        [selectedRole.name]: permissions,
      };
      setRolePermissions(updatedPermissions);
      
      // Save to database
      await saveRolePermissionsToDb(updatedPermissions);
    }
  };

  // Class Handlers
  const handleAddClass = () => {
    setEditClass(null);
    setShowClassModal(true);
  };

  const handleEditClass = (cls: ClassConfig) => {
    setEditClass(cls);
    setShowClassModal(true);
  };

  const handleSaveClass = async (cls: ClassConfig) => {
    if (!currentSchoolId) return;

    try {
      if (editClass) {
        // Update existing class
        const { error } = await supabase
          .from("school_classes")
          .update({
            name: cls.name,
            max_students: cls.capacity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", cls.id);

        if (error) {
          console.error("Error updating class:", error);
          alert("Failed to update class");
          return;
        }

        setClasses(classes.map((c) => (c.id === cls.id ? cls : c)));
      } else {
        // Create new class(es) - one for each section
        const classInserts = cls.sections.map((section) => ({
          school_id: currentSchoolId,
          name: cls.name,
          grade: cls.name,
          section: section,
          max_students: cls.capacity,
          account_status: "active",
        }));

        const { data, error } = await supabase
          .from("school_classes")
          .insert(classInserts)
          .select();

        if (error) {
          console.error("Error creating class:", error);
          alert("Failed to create class");
          return;
        }

        // Refresh classes
        fetchSchoolClasses();
      }
    } catch (error) {
      console.error("Error saving class:", error);
      alert("Failed to save class");
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm("Are you sure you want to delete this class? This will affect associated subjects.")) return;

    try {
      const { error } = await supabase
        .from("school_classes")
        .delete()
        .eq("id", classId);

      if (error) {
        console.error("Error deleting class:", error);
        alert("Failed to delete class");
        return;
      }

      setClasses(classes.filter((c) => c.id !== classId));
      setSubjects(subjects.map((s) => ({
        ...s,
        classes: s.classes.filter((c) => c !== classId),
      })));
    } catch (error) {
      console.error("Error in handleDeleteClass:", error);
      alert("Failed to delete class");
    }
  };

  // Subject Handlers
  const handleAddSubject = () => {
    setEditSubject(null);
    setShowSubjectModal(true);
  };

  const handleEditSubject = (subject: SubjectConfig) => {
    setEditSubject(subject);
    setShowSubjectModal(true);
  };

  const handleSaveSubject = async (subject: SubjectConfig) => {
    if (!currentSchoolId) return;

    try {
      if (editSubject) {
        // Update existing subject
        const { error } = await supabase
          .from("curriculum_subjects")
          .update({
            name: subject.name,
            description: `${subject.type} subject`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", subject.id);

        if (error) {
          console.error("Error updating subject:", error);
          alert("Failed to update subject");
          return;
        }

        setSubjects(subjects.map((s) => (s.id === subject.id ? subject : s)));
      } else {
        // Create new subject
        const { data, error } = await supabase
          .from("curriculum_subjects")
          .insert({
            school_id: currentSchoolId,
            name: subject.name,
            description: `${subject.type} subject`,
            is_active: true,
            display_order: subjects.length,
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating subject:", error);
          alert("Failed to create subject");
          return;
        }

        setSubjects([...subjects, { ...subject, id: data.id }]);
      }
    } catch (error) {
      console.error("Error saving subject:", error);
      alert("Failed to save subject");
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm("Are you sure you want to delete this subject? This may affect existing curriculums.")) return;

    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from("curriculum_subjects")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subjectId);

      if (error) {
        console.error("Error deleting subject:", error);
        alert("Failed to delete subject");
        return;
      }

      setSubjects(subjects.filter((s) => s.id !== subjectId));
    } catch (error) {
      console.error("Error in handleDeleteSubject:", error);
      alert("Failed to delete subject");
    }
  };

  // Export Handlers
  const handleExportUsers = () => {
    const csv = [
      ["Name", "Email", "Role", "Status", "Permissions", "Last Login", "Created At"],
      ...filteredUsers.map((u) => [
        u.name,
        u.email,
        u.role,
        u.status,
        u.permissions.length.toString(),
        u.lastLogin,
        u.createdAt,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const handleExportAuditLogs = () => {
    const csv = [
      ["Timestamp", "User", "Action", "Module", "IP Address", "Status"],
      ...auditLogs.map((log) => [
        log.timestamp,
        log.user,
        log.action,
        log.module,
        log.ip,
        log.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Helper Functions
  const getRoleBadgeColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      school_admin: "bg-violet-100 text-violet-700 border-violet-300",
      principal: "bg-purple-100 text-purple-700 border-purple-300",
      vice_principal: "bg-indigo-100 text-indigo-700 border-indigo-300",
      class_teacher: "bg-blue-100 text-blue-700 border-blue-300",
      subject_teacher: "bg-cyan-100 text-cyan-700 border-cyan-300",
      accountant: "bg-green-100 text-green-700 border-green-300",
      librarian: "bg-amber-100 text-amber-700 border-amber-300",
      it_admin: "bg-red-100 text-red-700 border-red-300",
      career_counselor: "bg-pink-100 text-pink-700 border-pink-300",
    };
    return colors[role];
  };

  const getRoleDisplayName = (role: UserRole): string => {
    const displayNames: Record<UserRole, string> = {
      school_admin: "School Admin",
      principal: "Principal",
      vice_principal: "Vice Principal",
      class_teacher: "Class Teacher",
      subject_teacher: "Subject Teacher",
      accountant: "Accountant",
      librarian: "Librarian",
      it_admin: "IT Admin",
      career_counselor: "Career Counselor",
    };
    return displayNames[role] || role.replace("_", " ").toUpperCase();
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-700 border-green-300",
      inactive: "bg-gray-100 text-gray-700 border-gray-300",
      suspended: "bg-red-100 text-red-700 border-red-300",
    };
    return colors[status];
  };

  const tabs = [
    { id: "users" as const, label: "User Management", icon: UserGroupIcon },
    { id: "roles" as const, label: "Roles & Permissions", icon: ShieldCheckIcon },
    { id: "classes" as const, label: "Classes & Subjects", icon: AcademicCapIcon },
    { id: "academic" as const, label: "Academic Year", icon: CalendarDaysIcon },
    { id: "system" as const, label: "System Config", icon: Cog6ToothIcon },
    { id: "audit" as const, label: "Audit Logs", icon: DocumentTextIcon },
  ];

  const stats = [
    { label: "Total Users", value: users.length, icon: UserGroupIcon, color: "blue" as const },
    {
      label: "Active Users",
      value: users.filter((u) => u.status === "active").length,
      icon: CheckIcon,
      color: "green" as const,
    },
    {
      label: "Inactive Users",
      value: users.filter((u) => u.status === "inactive").length,
      icon: XMarkIcon,
      color: "amber" as const,
    },
    {
      label: "Suspended",
      value: users.filter((u) => u.status === "suspended").length,
      icon: ExclamationTriangleIcon,
      color: "red" as const,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 bg-indigo-100 rounded-lg">
              <Cog6ToothIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Settings</h1>
              <p className="text-xs text-gray-600">
                Manage users, permissions, and system configuration
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowConfigModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            <BuildingOfficeIcon className="h-4 w-4" />
            School Info
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatsCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 flex-shrink-0">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 w-full max-w-md">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search users by name, email, or role..."
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="all">All Roles</option>
                  <option value="principal">Principal</option>
                  <option value="vice_principal">Vice Principal</option>
                  <option value="class_teacher">Class Teacher</option>
                  <option value="subject_teacher">Subject Teacher</option>
                  <option value="accountant">Accountant</option>
                  <option value="librarian">Librarian</option>
                  <option value="it_admin">IT Admin</option>
                  <option value="career_counselor">Career Counselor</option>
                </select>
                <button
                  onClick={handleExportUsers}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Export
                </button>
                {/* Add User button hidden - users are managed through educator creation flow */}
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Permissions
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            No users found
                          </h3>
                          <p className="text-xs text-gray-500">
                            Try adjusting your search or filters
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {user.name}
                                </p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(
                                user.role
                              )}`}
                            >
                              {getRoleDisplayName(user.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(
                                user.status
                              )}`}
                            >
                              {user.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <ClockIcon className="h-3.5 w-3.5" />
                              {user.lastLogin}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-gray-600">
                              {user.permissions.length} permission
                              {user.permissions.length !== 1 ? "s" : ""}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Edit User"
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                              </button>
                              {/* Delete button hidden - users should be managed through educator management */}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "roles" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Role-Based Access Control (RBAC)
              </h2>
              <p className="text-sm text-gray-600">
                Define permissions for each role in the system
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  role: "Principal",
                  description: "Full system access and administrative control",
                  permissions: 15,
                  color: "purple",
                },
                {
                  role: "Vice Principal",
                  description: "Academic authority with limited admin access",
                  permissions: 12,
                  color: "indigo",
                },
                {
                  role: "Class Teacher",
                  description: "Attendance and academic management for assigned classes",
                  permissions: 8,
                  color: "blue",
                },
                {
                  role: "Subject Teacher",
                  description: "Subject teaching and assessment management",
                  permissions: 6,
                  color: "cyan",
                },
                {
                  role: "Accountant",
                  description: "Finance and fee workflow management",
                  permissions: 4,
                  color: "green",
                },
                {
                  role: "Librarian",
                  description: "Library operations and inventory management",
                  permissions: 3,
                  color: "amber",
                },
                {
                  role: "IT Admin",
                  description: "System access and configuration management",
                  permissions: 10,
                  color: "red",
                },
                {
                  role: "Career Counselor",
                  description: "Career module and student guidance access",
                  permissions: 5,
                  color: "pink",
                },
              ].map((roleInfo) => (
                <div
                  key={roleInfo.role}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                      <ShieldCheckIcon className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {roleInfo.role}
                      </h3>
                      <p className="text-xs text-gray-600">{roleInfo.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {rolePermissions[roleInfo.role]?.length || 0} permissions assigned
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConfigureRole(roleInfo.role)}
                    className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    Configure
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "classes" && (
          <div className="space-y-6">
            {/* Classes Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Class Configuration
                  </h2>
                  <p className="text-sm text-gray-600">
                    Manage classes, sections, and capacity
                  </p>
                </div>
                <button
                  onClick={handleAddClass}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <PlusCircleIcon className="h-4 w-4" />
                  Add Class
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          {cls.name}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">
                          {cls.sections.length} section{cls.sections.length !== 1 ? "s" : ""} • Capacity: {cls.capacity}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditClass(cls)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Class"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(cls.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Class"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cls.sections.map((section) => (
                        <span
                          key={section}
                          className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                        >
                          {section}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subjects Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Subject Configuration
                  </h2>
                  <p className="text-sm text-gray-600">
                    Manage subjects, codes, and class assignments
                  </p>
                </div>
                <button
                  onClick={handleAddSubject}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <PlusCircleIcon className="h-4 w-4" />
                  Add Subject
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Classes
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {subjects.map((subject) => (
                      <tr key={subject.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {subject.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                          {subject.code}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              subject.type === "core"
                                ? "bg-blue-100 text-blue-700 border-blue-300"
                                : subject.type === "elective"
                                ? "bg-purple-100 text-purple-700 border-purple-300"
                                : "bg-green-100 text-green-700 border-green-300"
                            }`}
                          >
                            {subject.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {subject.classes.length} class{subject.classes.length !== 1 ? "es" : ""}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditSubject(subject)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Subject"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubject(subject.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Subject"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "academic" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Academic Year Management
                </h2>
                <p className="text-sm text-gray-600">
                  Configure academic year settings and session dates
                </p>
              </div>
              <button
                onClick={handleAddAcademicYear}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                <PlusCircleIcon className="h-4 w-4" />
                Add Academic Year
              </button>
            </div>

            <div className="space-y-4">
              {academicYears.map((year) => (
                <div
                  key={year.id}
                  className={`p-4 border rounded-lg ${
                    year.isActive
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          year.isActive ? "bg-green-100" : "bg-gray-100"
                        }`}
                      >
                        {year.isActive ? (
                          <CheckIcon className="h-5 w-5 text-green-600" />
                        ) : (
                          <CalendarDaysIcon className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          {year.year} {year.isActive && "(Current)"}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {new Date(year.startDate).toLocaleDateString()} -{" "}
                          {new Date(year.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!year.isActive && (
                        <button
                          onClick={() => handleActivateAcademicYear(year.id)}
                          className="px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => handleEditAcademicYear(year)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      {!year.isActive && (
                        <button
                          onClick={() => handleDeleteAcademicYear(year.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {year.isActive && (
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-white rounded-lg border border-green-200">
                        <p className="text-xs text-gray-600 mb-1">Total Days</p>
                        <p className="text-lg font-bold text-gray-900">{year.totalDays}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-green-200">
                        <p className="text-xs text-gray-600 mb-1">Days Elapsed</p>
                        <p className="text-lg font-bold text-gray-900">{year.daysElapsed}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-green-200">
                        <p className="text-xs text-gray-600 mb-1">Days Remaining</p>
                        <p className="text-lg font-bold text-gray-900">
                          {year.totalDays - year.daysElapsed <= 0 
                            ? "Completed" 
                            : year.totalDays - year.daysElapsed}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "system" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    System Configuration
                  </h2>
                  <p className="text-sm text-gray-600">
                    Manage system-wide settings and security policies
                  </p>
                </div>
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium inline-flex items-center gap-2"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  Edit Configuration
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                      School Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">School Name</span>
                        <span className="text-sm font-medium text-gray-900">
                          {systemConfig.schoolName}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">School Code</span>
                        <span className="text-sm font-medium text-gray-900">
                          {systemConfig.schoolCode}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Phone</span>
                        <span className="text-sm font-medium text-gray-900">
                          {systemConfig.phone}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Email</span>
                        <span className="text-sm font-medium text-gray-900">
                          {systemConfig.email}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                      Security Settings
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Session Timeout</span>
                        <span className="text-sm font-medium text-gray-900">
                          {systemConfig.sessionTimeout} minutes
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Max Login Attempts</span>
                        <span className="text-sm font-medium text-gray-900">
                          {systemConfig.maxLoginAttempts}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Password Expiry</span>
                        <span className="text-sm font-medium text-gray-900">
                          {systemConfig.passwordExpiryDays} days
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Multi-Factor Auth</span>
                        <span
                          className={`text-sm font-medium ${
                            systemConfig.enableMFA ? "text-green-600" : "text-gray-400"
                          }`}
                        >
                          {systemConfig.enableMFA ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Biometric Attendance</span>
                        <span
                          className={`text-sm font-medium ${
                            systemConfig.enableBiometric
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          {systemConfig.enableBiometric ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Notification Settings
                </h3>
                {notificationSettingsChanged && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCancelNotificationSettings}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNotificationSettings}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
                    >
                      <CheckIcon className="h-4 w-4" />
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {notificationSettings.map((setting) => (
                  <label
                    key={setting.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <BellIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {setting.label}
                        </p>
                        <p className="text-xs text-gray-500">{setting.description}</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={setting.enabled}
                      onChange={() => handleToggleNotification(setting.id)}
                      className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "audit" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Audit Logs
                  </h2>
                  <p className="text-sm text-gray-600">
                    Track all system activities and user actions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={auditTimeFilter}
                    onChange={(e) => setAuditTimeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="24h">Last 24 hours</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="all">All time</option>
                  </select>
                  <button
                    onClick={handleExportAuditLogs}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium inline-flex items-center gap-2"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Export
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Module
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {getFilteredAuditLogs().length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <DocumentTextIcon className="h-12 w-12 text-gray-300 mb-3" />
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            No audit logs found
                          </p>
                          <p className="text-xs text-gray-500">
                            {auditTimeFilter === "all" 
                              ? "There are no activity logs to display yet."
                              : "No activity logs found for the selected time period."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    getFilteredAuditLogs().map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-xs text-gray-600 whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {log.user}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{log.action}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-300">
                            {log.module}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600 font-mono">
                          {log.ip}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              log.status === "success"
                                ? "bg-green-100 text-green-700 border-green-300"
                                : "bg-red-100 text-red-700 border-red-300"
                            }`}
                          >
                            {log.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Showing {getFilteredAuditLogs().length} {getFilteredAuditLogs().length === 1 ? 'entry' : 'entries'}</span>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Previous
                  </button>
                  <button className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-white transition-colors">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserManagementModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setEditUser(null);
        }}
        onSaved={handleSaveUser}
        editUser={editUser}
      />

      <SystemConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        config={systemConfig}
        onSaved={setSystemConfig}
        schoolId={currentSchoolId}
      />

      <AcademicYearModal
        isOpen={showAcademicModal}
        onClose={() => {
          setShowAcademicModal(false);
          setEditAcademicYear(null);
        }}
        onSaved={handleSaveAcademicYear}
        editYear={editAcademicYear}
      />

      <RolePermissionsModal
        isOpen={showRolePermissionsModal}
        onClose={() => {
          setShowRolePermissionsModal(false);
          setSelectedRole(null);
        }}
        role={selectedRole?.name || ""}
        currentPermissions={selectedRole?.permissions || []}
        onSaved={handleSaveRolePermissions}
      />

      <ClassConfigModal
        isOpen={showClassModal}
        onClose={() => {
          setShowClassModal(false);
          setEditClass(null);
        }}
        onSaved={handleSaveClass}
        editClass={editClass}
      />

      <SubjectConfigModal
        isOpen={showSubjectModal}
        onClose={() => {
          setShowSubjectModal(false);
          setEditSubject(null);
        }}
        onSaved={handleSaveSubject}
        editSubject={editSubject}
        availableClasses={classes}
      />
    </div>
  );
};

export default Settings;
