/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ArrowPathIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
// @ts-ignore
import { SubscriptionSettingsSection } from "../../../components/Subscription/SubscriptionSettingsSection";

/* ==============================
   TYPES & INTERFACES
   ============================== */

interface College {
  id: string;
  name: string;
  code: string;
  status: "active" | "inactive";
  location: string;
  establishedYear: number;
  totalStudents: number;
  totalFaculty: number;
}

interface UniversityPolicy {
  id: string;
  name: string;
  category: "academic" | "administrative" | "financial";
  status: "active" | "draft" | "archived";
  effectiveDate: string;
  description: string;
}

interface Role {
  id: string;
  roleName: string;
  level: "university" | "college" | "department";
  permissions: string[];
  userCount: number;
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
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
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
   MAIN SETTINGS COMPONENT
   ============================== */
const Settings = () => {
  const [activeTab, setActiveTab] = useState<
    "colleges" | "policies" | "roles" | "analytics" | "subscription"
  >("colleges");
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Data states
  const [colleges] = useState<College[]>([
    {
      id: "1",
      name: "College of Engineering",
      code: "COE",
      status: "active",
      location: "Main Campus",
      establishedYear: 1985,
      totalStudents: 2500,
      totalFaculty: 150,
    },
    {
      id: "2",
      name: "College of Science",
      code: "COS",
      status: "active",
      location: "North Campus",
      establishedYear: 1990,
      totalStudents: 1800,
      totalFaculty: 120,
    },
  ]);

  const [policies] = useState<UniversityPolicy[]>([
    {
      id: "1",
      name: "Academic Integrity Policy",
      category: "academic",
      status: "active",
      effectiveDate: "2024-01-01",
      description: "Guidelines for maintaining academic integrity across all colleges",
    },
    {
      id: "2",
      name: "Attendance Policy",
      category: "academic",
      status: "active",
      effectiveDate: "2024-01-01",
      description: "Minimum attendance requirements for all programs",
    },
  ]);

  const [roles] = useState<Role[]>([
    {
      id: "1",
      roleName: "Vice Chancellor",
      level: "university",
      permissions: ["all"],
      userCount: 1,
    },
    {
      id: "2",
      roleName: "Registrar",
      level: "university",
      permissions: ["students", "academics", "reports"],
      userCount: 1,
    },
    {
      id: "3",
      roleName: "College Principal",
      level: "college",
      permissions: ["college_management", "faculty", "students"],
      userCount: 5,
    },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const tabs = [
    { id: "colleges", label: "Colleges", icon: BuildingOffice2Icon },
    { id: "policies", label: "Policies", icon: ShieldCheckIcon },
    { id: "roles", label: "Roles & Permissions", icon: UserGroupIcon },
    { id: "analytics", label: "Analytics Settings", icon: ChartBarIcon },
    { id: "subscription", label: "Subscription", icon: CreditCardIcon },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-2xl p-6 sm:p-8 border border-indigo-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                University Settings
              </h1>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg max-w-2xl">
                Configure university-wide settings, manage colleges, policies, and system administration
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/60 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-700">System Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-gray-100/80 backdrop-blur-sm rounded-xl p-1.5 shadow-sm border border-gray-200/50">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Colleges Tab */}
          {activeTab === "colleges" && (
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Affiliated Colleges</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage colleges under this university</p>
                </div>
                <button
                  onClick={() => setShowCollegeModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                >
                  <BuildingOffice2Icon className="h-4 w-4" />
                  Add College
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">College</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Code</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Location</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Students</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Faculty</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {colleges.map((college) => (
                      <tr key={college.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{college.name}</td>
                        <td className="py-3 px-4 text-gray-600">{college.code}</td>
                        <td className="py-3 px-4 text-gray-600">{college.location}</td>
                        <td className="py-3 px-4 text-gray-600">{college.totalStudents.toLocaleString()}</td>
                        <td className="py-3 px-4 text-gray-600">{college.totalFaculty}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            college.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {college.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Policies Tab */}
          {activeTab === "policies" && (
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">University Policies</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage academic and administrative policies</p>
                </div>
                <button
                  onClick={() => setShowPolicyModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                >
                  <ShieldCheckIcon className="h-4 w-4" />
                  Add Policy
                </button>
              </div>

              <div className="space-y-4">
                {policies.map((policy) => (
                  <div key={policy.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{policy.name}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            policy.status === "active" ? "bg-green-100 text-green-800" :
                            policy.status === "draft" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {policy.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{policy.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="capitalize">{policy.category}</span>
                          <span>Effective: {new Date(policy.effectiveDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Roles Tab */}
          {activeTab === "roles" && (
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Roles & Permissions</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage system roles and access permissions</p>
                </div>
                <button
                  onClick={() => setShowRoleModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                >
                  <UserGroupIcon className="h-4 w-4" />
                  Add Role
                </button>
              </div>

              <div className="grid gap-4">
                {roles.map((role) => (
                  <div key={role.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{role.roleName}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        role.level === "university" ? "bg-purple-100 text-purple-800" :
                        role.level === "college" ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {role.level}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{role.userCount} user(s)</span>
                      <span className="text-gray-400">{role.permissions.length} permissions</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Settings Tab */}
          {activeTab === "analytics" && (
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Analytics Settings</h2>
                <p className="text-sm text-gray-500 mt-1">Configure analytics and reporting preferences</p>
              </div>

              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Report Generation</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-700">Enable automated weekly reports</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-700">Include college-wise breakdown</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-700">Send reports to all principals</span>
                    </label>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Dashboard Preferences</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-700">Show real-time enrollment data</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-700">Display placement statistics</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-700">Show comparative analytics</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === "subscription" && (
            <div className="p-4 sm:p-6 lg:p-8">
              <SubscriptionSettingsSection />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ModalWrapper
        isOpen={showCollegeModal}
        onClose={() => setShowCollegeModal(false)}
        title="Add New College"
        subtitle="Register a new college under this university"
      >
        <div className="space-y-4">
          <p className="text-gray-500 text-sm">College registration form will be implemented here.</p>
          <button
            onClick={() => setShowCollegeModal(false)}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </ModalWrapper>

      <ModalWrapper
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        title="Add New Policy"
        subtitle="Create a new university policy"
      >
        <div className="space-y-4">
          <p className="text-gray-500 text-sm">Policy creation form will be implemented here.</p>
          <button
            onClick={() => setShowPolicyModal(false)}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </ModalWrapper>

      <ModalWrapper
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="Add New Role"
        subtitle="Create a new system role with permissions"
      >
        <div className="space-y-4">
          <p className="text-gray-500 text-sm">Role creation form will be implemented here.</p>
          <button
            onClick={() => setShowRoleModal(false)}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </ModalWrapper>
    </div>
  );
};

export default Settings;