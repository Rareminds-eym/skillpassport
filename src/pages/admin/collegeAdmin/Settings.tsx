/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    AcademicCapIcon,
    ArrowPathIcon,
    ChartBarIcon,
    CheckIcon,
    CreditCardIcon,
    PencilSquareIcon,
    PlusCircleIcon,
    ShieldCheckIcon,
    TrashIcon,
    UserGroupIcon,
    XMarkIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { SubscriptionSettingsSection } from "../../../components/Subscription/SubscriptionSettingsSection";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/solid";
import { 
  getRolesWithPermissions, 
  getAvailableModules, 
  getAvailablePermissions,
  saveRolePermissions,
  getModulesForRole,
  getDepartments,
  getPrograms,
  type Role,
  type Module,
  type Permission,
  type ModuleAccess,
  type ScopeRule
} from "../../../services/settingsService";
import { useAuth } from "../../../context/AuthContext";

/* ==============================
   TYPES & INTERFACES
   ============================== */

// Re-export types from service for backward compatibility
export type { Role, ModuleAccess, ScopeRule } from "../../../services/settingsService";

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
   ROLE & PERMISSION MODAL
   ============================== */



/* ==============================
   ROLE & PERMISSION MODAL
   ============================== */
const RolePermissionModal = ({
  isOpen,
  onClose,
  role,
  onSaved,
  availableModules,
  departments,
  programs,
}: {
  isOpen: boolean;
  onClose: () => void;
  role?: Role | null;
  onSaved: (role: Role) => void;
  availableModules: Module[];
  departments: { id: string; name: string; code: string }[];
  programs: { id: string; name: string; code: string }[];
}) => {
  // Authentication check
  const { user, isAuthenticated, role: userRole } = useAuth();
  
  const [activeRoleTab, setActiveRoleTab] = useState("basic");
  const [formData, setFormData] = useState({
    roleName: "",
    description: "",
    isActive: true,
    priority: 1,
  });
  const [modulePermissions, setModulePermissions] = useState<ModuleAccess[]>([]);
  const [scopeRules, setScopeRules] = useState<ScopeRule[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Check authentication when modal opens
  useEffect(() => {
    if (isOpen && (!isAuthenticated || userRole !== 'college_admin')) {
      console.error('❌ UNAUTHORIZED MODAL ACCESS ATTEMPT');
      console.error('User:', user?.email);
      console.error('Role:', userRole);
      console.error('Required: college_admin');
      alert('❌ Unauthorized: Only College Administrators can modify permissions.');
      onClose();
      return;
    }
  }, [isOpen, isAuthenticated, userRole, user, onClose]);

  // Available modules for college administration - Now loaded from database
  const getAvailableModulesForRole = () => {
    if (!availableModules.length) return [];
    
    // Filter modules based on current role being edited
    const isCollegeAdmin = formData.roleName.includes('Dean') || formData.roleName.includes('College Admin');
    
    if (isCollegeAdmin) {
      return availableModules.filter(m => 
        ['Dashboard', 'Students', 'Departments & Faculty', 'Academics', 
         'Examinations', 'Placements & Skills', 'Operations', 'Administration', 'Settings']
        .includes(m.module_name)
      ).map(m => ({ name: m.module_name, description: m.description || '' }));
    } else {
      return availableModules.filter(m => 
        ['Dashboard', 'Teaching Intelligence', 'Courses', 'Classroom Management', 
         'Learning & Evaluation', 'Skill & Co-Curriculm', 'Digital Portfolio', 
         'Analytics', 'Reports', 'Media Manager', 'Communication', 'Settings']
        .includes(m.module_name)
      ).map(m => ({ name: m.module_name, description: m.description || '' }));
    }
  };

  const permissions = ["view", "create", "edit", "approve", "publish"] as const;

  // Get dynamic modules for current role
  const currentAvailableModules = getAvailableModulesForRole();

  // Available departments and programs - Now loaded from database
  const availableDepartments = departments;
  const availablePrograms = programs;

  useEffect(() => {
    if (role && isOpen) {
      console.log('📝 EDIT ROLE MODAL OPENED');
      console.log('Role being edited:', role.roleName);
      console.log('Current module access:', role.moduleAccess);
      console.log('Current scope rules:', role.scopeRules);
      console.log('Related database tables:');
      console.log('  - college_role_module_permissions');
      console.log('  - college_role_scope_rules');
      
      setFormData({
        roleName: role.roleName,
        description: "",
        isActive: true,
        priority: 1,
      });
      setModulePermissions(role.moduleAccess || []);
      setScopeRules(role.scopeRules || []);
    } else if (!role && isOpen) {
      console.log('➕ CREATE NEW ROLE MODAL OPENED');
      console.log('Creating new role with empty permissions');
      
      setFormData({
        roleName: "",
        description: "",
        isActive: true,
        priority: 1,
      });
      setModulePermissions([]);
      setScopeRules([]);
    }
  }, [role, isOpen]);

  const handleSubmit = () => {
    console.log('📤 SUBMITTING ROLE CHANGES');
    console.log('Form data:', formData);
    console.log('Module permissions to save:', modulePermissions);
    console.log('Scope rules to save:', scopeRules);
    console.log('Target database tables:');
    console.log('  - college_role_module_permissions (will be updated/inserted)');
    console.log('  - college_role_scope_rules (will be updated/inserted)');
    
    setSubmitting(true);
    setTimeout(() => {
      const roleData = {
        id: role?.id || Date.now().toString(),
        roleName: formData.roleName,
        moduleAccess: modulePermissions,
        scopeRules,
      };
      
      console.log('Final role data being saved:', roleData);
      onSaved(roleData);
      setSubmitting(false);
      onClose();
    }, 400);
  };

  const updateModulePermissions = (moduleName: string, permission: string, checked: boolean) => {
    console.log('🔄 Permission Change:', {
      module: moduleName,
      permission: permission,
      action: checked ? 'GRANTED' : 'REVOKED',
      timestamp: new Date().toISOString(),
      relatedTable: 'college_role_module_permissions'
    });
    
    setModulePermissions(prev => {
      const existing = prev.find(m => m.module === moduleName);
      if (existing) {
        const updatedPermissions = checked 
          ? [...existing.permissions, permission as any]
          : existing.permissions.filter(p => p !== permission);
        
        if (updatedPermissions.length === 0) {
          console.log(`📝 Module ${moduleName} removed (no permissions left)`);
          return prev.filter(m => m.module !== moduleName);
        }
        
        console.log(`📝 Module ${moduleName} updated:`, updatedPermissions);
        return prev.map(m => 
          m.module === moduleName 
            ? { ...m, permissions: updatedPermissions }
            : m
        );
      } else if (checked) {
        console.log(`📝 Module ${moduleName} added with permission:`, permission);
        return [...prev, { module: moduleName, permissions: [permission as any] }];
      }
      return prev;
    });
  };

  const addScopeRule = (type: "department" | "program") => {
    console.log('➕ Adding scope rule:', {
      type: type,
      relatedTable: 'college_role_scope_rules',
      timestamp: new Date().toISOString()
    });
    setScopeRules(prev => [...prev, { type, values: [] }]);
  };

  const updateScopeRule = (index: number, values: string[]) => {
    console.log('🔄 Updating scope rule:', {
      index: index,
      values: values,
      relatedTable: 'college_role_scope_rules',
      timestamp: new Date().toISOString()
    });
    setScopeRules(prev => prev.map((rule, i) => 
      i === index ? { ...rule, values } : rule
    ));
  };

  const removeScopeRule = (index: number) => {
    console.log('🗑️ Removing scope rule:', {
      index: index,
      relatedTable: 'college_role_scope_rules',
      timestamp: new Date().toISOString()
    });
    setScopeRules(prev => prev.filter((_, i) => i !== index));
  };

  const roleTabs = [
    { id: "basic", label: "Basic Info", icon: UserGroupIcon },
    { id: "permissions", label: "Module Permissions", icon: ShieldCheckIcon },
    { id: "scope", label: "Scope Rules", icon: AcademicCapIcon },
  ];

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={role ? "Edit Role" : "Create Role"}
      subtitle="Configure role permissions and access scope"
      size="large"
    >
      {/* Modal Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1">
          {roleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveRoleTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeRoleTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
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
      <div className="space-y-6">
        {/* Basic Info Tab */}
        {activeRoleTab === "basic" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Name <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.roleName}
                onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Select a role...</option>
                <option value="Dean (College Admin)">Dean (College Admin)</option>
                <option value="Faculty (College Educator)">Faculty (College Educator)</option>
                {/* TODO: Future roles to be implemented */}
                {/* <option value="HOD (Head of Department)">HOD (Head of Department)</option> */}
                {/* <option value="Program Coordinator">Program Coordinator</option> */}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Describe the role responsibilities and purpose..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value={1}>1 - Highest (Dean)</option>
                  <option value={4}>4 - Low (Faculty)</option>
                  {/* TODO: Future priority levels */}
                  {/* <option value={2}>2 - High (HOD)</option> */}
                  {/* <option value={3}>3 - Medium (Program Coordinator)</option> */}
                </select>
              </div>

              <div className="flex items-end">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Active Role
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Module Permissions Tab */}
        {activeRoleTab === "permissions" && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Module Access Matrix</h4>
              <p className="text-sm text-blue-800">Configure which modules this role can access and what actions they can perform.</p>
            </div>

            <div className="space-y-4">
              {currentAvailableModules.map((module) => {
                const currentModuleAccess = modulePermissions.find(m => m.module === module.name);
                return (
                  <div key={module.name} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900">{module.name}</h5>
                        <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-3">
                      {permissions.map((permission) => (
                        <label key={permission} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentModuleAccess?.permissions.includes(permission) || false}
                            onChange={(e) => updateModulePermissions(module.name, permission, e.target.checked)}
                            className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm font-medium text-gray-700 capitalize">{permission}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scope Rules Tab */}
        {activeRoleTab === "scope" && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-900 mb-2">Access Scope Configuration</h4>
              <p className="text-sm text-green-800">Define which departments or programs this role has access to.</p>
              <p className="text-xs text-green-700 mt-1">
                Debug: {availableDepartments.length} departments, {availablePrograms.length} programs loaded
              </p>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => addScopeRule("department")}
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <PlusCircleIcon className="h-4 w-4" />
                Add Department Scope
              </button>
              <button
                onClick={() => addScopeRule("program")}
                className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <PlusCircleIcon className="h-4 w-4" />
                Add Program Scope
              </button>
            </div>

            <div className="space-y-4">
              {scopeRules.map((rule, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-gray-900 capitalize">{rule.type} Access</h5>
                    <button
                      onClick={() => removeScopeRule(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {console.log('Rendering scope rule:', rule.type, 'Available items:', rule.type === "department" ? availableDepartments : availablePrograms)}
                    {(rule.type === "department" ? availableDepartments : availablePrograms).map((item) => (
                      <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rule.values.includes(item.id)}
                          onChange={(e) => {
                            const newValues = e.target.checked
                              ? [...rule.values, item.id]
                              : rule.values.filter(v => v !== item.id);
                            updateScopeRule(index, newValues);
                          }}
                          className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">{item.name} ({item.code})</span>
                      </label>
                    ))}
                  </div>
                  
                  {rule.values.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">No {rule.type}s selected. This rule will have no effect.</p>
                  )}
                </div>
              ))}
              
              {scopeRules.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <UserGroupIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No scope rules defined. Add department or program scope to restrict access.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Role Preview */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Role Summary</h4>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h5 className="font-semibold text-gray-900">{formData.roleName || "Role Name"}</h5>
              <p className="text-sm text-gray-600 mt-1">{formData.description || "No description provided"}</p>
            </div>
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              formData.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}>
              {formData.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
              <span className="text-blue-900 font-medium">Modules</span>
              <p className="text-blue-800 font-bold">{modulePermissions.length}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-2">
              <span className="text-green-900 font-medium">Scope Rules</span>
              <p className="text-green-800 font-bold">{scopeRules.length}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
              <span className="text-purple-900 font-medium">Priority</span>
              <p className="text-purple-800 font-bold">Level {formData.priority}</p>
            </div>
          </div>
          
          {/* Scope Rules Preview */}
          {scopeRules.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <h6 className="text-xs font-medium text-gray-700 mb-2">Scope Access:</h6>
              <div className="flex flex-wrap gap-1">
                {scopeRules.map((rule, idx) => {
                  const scopeNames = rule.values.map(value => {
                    if (rule.type === 'department') {
                      const dept = availableDepartments.find(d => d.id === value);
                      return dept ? dept.name : value;
                    } else {
                      const prog = availablePrograms.find(p => p.id === value);
                      return prog ? prog.name : value;
                    }
                  });
                  
                  return (
                    <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      {rule.type}: {scopeNames.join(", ")}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-200">
        <button
          onClick={onClose}
          disabled={submitting}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || !formData.roleName}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {submitting ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              {role ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              {role ? "Update Role" : "Create Role"}
            </>
          )}
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ==============================
   MAIN SETTINGS COMPONENT
   ============================== */
const Settings = () => {
  // Authentication
  const { user, isAuthenticated, loading: authLoading, role } = useAuth();
  
  const [activeTab, setActiveTab] = useState<
    "roles" | "subscription"
  >("roles");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);

  // Data states - Now loaded from database
  const [roles, setRoles] = useState<Role[]>([]);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string; code: string }[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string; code: string }[]>([]);

  // Authentication checks
  useEffect(() => {
    if (!authLoading) {
      console.log('🔐 AUTHENTICATION CHECK');
      console.log('User:', user);
      console.log('Is Authenticated:', isAuthenticated);
      console.log('User Role:', role);
      console.log('Required Role: college_admin');
      
      if (!isAuthenticated) {
        console.log('❌ User not authenticated - redirecting to login');
        // In a real app, you might redirect to login page
        return;
      }
      
      if (role !== 'college_admin') {
        console.log('❌ User not authorized - insufficient permissions');
        console.log('User role:', role, 'Required: college_admin');
        return;
      }
      
      console.log('✅ User authorized to access settings');
      loadSettingsData();
    }
  }, [authLoading, isAuthenticated, role, user]);

  const loadSettingsData = async () => {
    if (!isAuthenticated || role !== 'college_admin') {
      console.log('❌ Skipping data load - user not authorized');
      return;
    }
    
    setLoading(true);
    try {
      console.log('📊 Loading settings data for authorized user:', user?.email);
      
      const [rolesData, modulesData, permissionsData, departmentsData, programsData] = await Promise.all([
        getRolesWithPermissions(),
        getAvailableModules(),
        getAvailablePermissions(),
        getDepartments(),
        getPrograms()
      ]);
      
      console.log('Loaded departments:', departmentsData);
      console.log('Loaded programs:', programsData);
      
      setRoles(rolesData);
      setAvailableModules(modulesData);
      setAvailablePermissions(permissionsData);
      setDepartments(departmentsData);
      setPrograms(programsData);
    } catch (error) {
      console.error('❌ Error loading settings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRole = async (role: Role) => {
    // Double-check authentication before saving
    if (!isAuthenticated || user?.role !== 'college_admin') {
      console.error('❌ UNAUTHORIZED PERMISSION UPDATE ATTEMPT');
      console.error('User:', user?.email);
      console.error('Role:', user?.role);
      console.error('Required: college_admin');
      alert('❌ Unauthorized: Only College Administrators can modify permissions.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Convert role type back to enum format
      const roleType = role.roleName.includes('Dean') ? 'college_admin' : 'college_educator';
      
      // Console log the permission update details
      console.log('=== PERMISSION UPDATE STARTED ===');
      console.log('Authorized User:', user?.email);
      console.log('User Role:', user?.role);
      console.log('Role Name:', role.roleName);
      console.log('Role Type (Database):', roleType);
      console.log('Module Permissions:', role.moduleAccess);
      console.log('Scope Rules:', role.scopeRules);
      console.log('Target Tables:');
      console.log('  - college_role_module_permissions (for module access)');
      console.log('  - college_role_scope_rules (for scope restrictions)');
      
      // Log each module permission being updated
      role.moduleAccess.forEach((moduleAccess, index) => {
        console.log(`Module ${index + 1}: ${moduleAccess.module}`);
        console.log(`  Permissions: ${moduleAccess.permissions.join(', ')}`);
        console.log(`  Related to: College Administration System`);
      });
      
      // Log scope rules being updated
      role.scopeRules.forEach((scopeRule, index) => {
        console.log(`Scope Rule ${index + 1}: ${scopeRule.type}`);
        console.log(`  Values: ${scopeRule.values.join(', ')}`);
        console.log(`  Related to: Access Control & Data Filtering`);
      });
      
      // Save to database with scope rules
      const success = await saveRolePermissions(roleType, role.moduleAccess, role.scopeRules);
      
      if (success) {
        console.log('✅ PERMISSION UPDATE SUCCESSFUL');
        console.log('Updated by:', user?.email);
        console.log('Database tables updated:');
        console.log('  - college_role_module_permissions: Module access permissions');
        console.log('  - college_role_scope_rules: Department/Program scope restrictions');
        
        // Show success alert
        alert(`✅ Successfully updated permissions for ${role.roleName}!\n\nUpdated by: ${user?.email}\nUpdated:\n• ${role.moduleAccess.length} module permissions\n• ${role.scopeRules.length} scope rules\n\nTables modified:\n• college_role_module_permissions\n• college_role_scope_rules`);
        
        // Reload data to reflect changes
        await loadSettingsData();
        
        console.log('=== PERMISSION UPDATE COMPLETED ===');
      } else {
        console.error('❌ PERMISSION UPDATE FAILED');
        console.error('Database operation returned false');
        alert('❌ Failed to save role permissions. Please try again.');
      }
    } catch (error) {
      console.error('❌ PERMISSION UPDATE ERROR');
      console.error('Error details:', error);
      console.error('Failed to update tables:');
      console.error('  - college_role_module_permissions');
      console.error('  - college_role_scope_rules');
      alert(`❌ Error saving role permissions: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setLoading(false);
    }
    
    setEditRole(null);
  };

  const tabs = [
    { id: "roles", label: "Roles & Permissions", icon: UserGroupIcon },
    { id: "subscription", label: "Subscription", icon: CreditCardIcon },
  ];

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">
            You must be logged in to access the settings page.
          </p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show unauthorized message if user doesn't have the right role
  if (role !== 'college_admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <ShieldCheckIcon className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-4">
            Only College Administrators can access the settings page.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-amber-800">
              <strong>Your Role:</strong> {role || 'Unknown'}<br />
              <strong>Required Role:</strong> college_admin
            </p>
          </div>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

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
                Settings & Masters
              </h1>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg max-w-2xl">
                Configure roles, permissions, and subscription settings for comprehensive college management
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6">
          <StatsCard
            label="Active Roles"
            value={roles.length}
            icon={UserGroupIcon}
            color="amber"
            onClick={() => setActiveTab("roles")}
          />
          <StatsCard
            label="System Status"
            value="Active"
            icon={ShieldCheckIcon}
            color="green"
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Mobile Tab Navigation (< 640px) */}
          <div className="block sm:hidden">
            <div className="flex overflow-x-auto bg-gray-50 p-2 gap-1 no-scrollbar">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg font-medium text-xs whitespace-nowrap transition-all duration-200 min-w-[80px] flex-shrink-0 touch-manipulation ${
                      activeTab === tab.id
                        ? "bg-indigo-600 text-white shadow-md"
                        : "text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm"
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-semibold leading-tight text-center">
                      {tab.label.includes(' ') ? tab.label.split(' ')[0] : tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tablet Tab Navigation (640px - 1024px) */}
          <div className="hidden sm:block lg:hidden">
            <div className="flex overflow-x-auto bg-gray-50 p-2 gap-1 no-scrollbar">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg font-medium text-xs whitespace-nowrap transition-all duration-200 min-w-fit flex-shrink-0 ${
                      activeTab === tab.id
                        ? "bg-indigo-600 text-white shadow-md"
                        : "text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="font-semibold">
                      {tab.label.length > 12 ? tab.label.split(' ')[0] : tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop Tab Navigation (>= 1024px) */}
          <div className="hidden lg:block p-2">
            <div className="flex gap-1">
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
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Roles & Permission Settings */}
          {activeTab === "roles" && (
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Roles & Permission Settings</h2>
                <p className="text-sm sm:text-base text-gray-600 max-w-2xl">Module access matrix with scope rules for department/program</p>
              </div>
              <button 
                onClick={() => {
                  // Authentication check before creating role
                  if (!isAuthenticated || role !== 'college_admin') {
                    console.error('❌ UNAUTHORIZED CREATE ROLE ATTEMPT');
                    console.error('User:', user?.email);
                    console.error('Role:', role);
                    console.error('Required: college_admin');
                    alert('❌ Unauthorized: Only College Administrators can create roles.');
                    return;
                  }
                  
                  console.log('✅ Authorized user creating new role:', user?.email);
                  setShowRoleModal(true);
                }}
                disabled={!isAuthenticated || role !== 'college_admin'}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md ${
                  isAuthenticated && role === 'college_admin'
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
                title={!isAuthenticated || role !== 'college_admin' ? 'Only College Administrators can create roles' : 'Create new role'}
              >
                <PlusCircleIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Create Role</span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>

            {/* Role Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 sm:mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-900">Total Roles</span>
                </div>
                <p className="text-lg font-bold text-blue-800 mt-1">{roles.length}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-900">Avg Modules</span>
                </div>
                <p className="text-lg font-bold text-green-800 mt-1">
                  {Math.round(roles.reduce((sum, r) => sum + r.moduleAccess.length, 0) / roles.length)}
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AcademicCapIcon className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-900">Dept Scoped</span>
                </div>
                <p className="text-lg font-bold text-purple-800 mt-1">
                  {roles.filter(r => r.scopeRules.some(s => s.type === "department")).length}
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <ClipboardDocumentListIcon className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-900">Program Scoped</span>
                </div>
                <p className="text-lg font-bold text-amber-800 mt-1">
                  {roles.filter(r => r.scopeRules.some(s => s.type === "program")).length}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:gap-6">
              {roles.map((roleItem) => (
                <div key={roleItem.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:border-indigo-200">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <UserGroupIcon className="h-6 w-6 text-indigo-600" />
                        <h3 className="font-bold text-gray-900 text-lg sm:text-xl">{roleItem.roleName}</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">{roleItem.moduleAccess.length}</span> modules • <span className="font-medium">{roleItem.scopeRules.length}</span> scope rules
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Module Access
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {roleItem.moduleAccess.map((module, idx) => (
                        <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3 hover:bg-blue-100 transition-colors">
                          <p className="text-sm font-semibold text-blue-900 mb-1">{module.module}</p>
                          <div className="flex flex-wrap gap-1">
                            {module.permissions.map((perm, permIdx) => (
                              <span key={permIdx} className="text-xs font-medium px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full">
                                {perm}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Scope Rules
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {roleItem.scopeRules.map((scope, idx) => {
                        // Convert IDs to names for display
                        const scopeNames = scope.values.map(value => {
                          if (scope.type === 'department') {
                            const dept = departments.find(d => d.id === value);
                            return dept ? `${dept.name} (${dept.code})` : value;
                          } else {
                            const prog = programs.find(p => p.id === value);
                            return prog ? `${prog.name} (${prog.code})` : value;
                          }
                        });
                        
                        return (
                          <span key={idx} className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 bg-green-50 text-green-800 border border-green-200 rounded-lg">
                            <span className="font-semibold">{scope.type}:</span>
                            <span>{scopeNames.join(", ")}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      onClick={() => {
                        // Authentication check before opening modal
                        if (!isAuthenticated || role !== 'college_admin') {
                          console.error('❌ UNAUTHORIZED EDIT ATTEMPT');
                          console.error('User:', user?.email);
                          console.error('Role:', role);
                          console.error('Required: college_admin');
                          alert('❌ Unauthorized: Only College Administrators can edit permissions.');
                          return;
                        }
                        
                        console.log('✅ Authorized user opening edit modal:', user?.email);
                        setEditRole(roleItem);
                        setShowRoleModal(true);
                      }}
                      disabled={!isAuthenticated || role !== 'college_admin'}
                      className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isAuthenticated && role === 'college_admin'
                          ? 'text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100'
                          : 'text-gray-400 bg-gray-50 border border-gray-200 cursor-not-allowed'
                      }`}
                      title={!isAuthenticated || role !== 'college_admin' ? 'Only College Administrators can edit permissions' : 'Edit role permissions'}
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Edit Permissions
                    </button>
                    <button 
                      onClick={() => {
                        // Authentication check before deleting
                        if (!isAuthenticated || role !== 'college_admin') {
                          console.error('❌ UNAUTHORIZED DELETE ATTEMPT');
                          console.error('User:', user?.email);
                          console.error('Role:', role);
                          console.error('Required: college_admin');
                          alert('❌ Unauthorized: Only College Administrators can delete roles.');
                          return;
                        }
                        
                        if (confirm(`Are you sure you want to delete the role "${roleItem.roleName}"? This action cannot be undone.`)) {
                          console.log('🗑️ Authorized user deleting role:', roleItem.roleName, 'by:', user?.email);
                          setRoles(prev => prev.filter(r => r.id !== roleItem.id));
                        }
                      }}
                      disabled={!isAuthenticated || role !== 'college_admin'}
                      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isAuthenticated && role === 'college_admin'
                          ? 'text-red-700 bg-red-50 border border-red-200 hover:bg-red-100'
                          : 'text-gray-400 bg-gray-50 border border-gray-200 cursor-not-allowed'
                      }`}
                      title={!isAuthenticated || role !== 'college_admin' ? 'Only College Administrators can delete roles' : 'Delete role'}
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* E7. Subscription Settings */}
        {activeTab === "subscription" && (
          <div className="p-4 sm:p-6 lg:p-8">
            <SubscriptionSettingsSection />
          </div>
        )}
        </div>

        {/* Modals */}
        <RolePermissionModal
          isOpen={showRoleModal}
          onClose={() => {
            setShowRoleModal(false);
            setEditRole(null);
          }}
          role={editRole}
          onSaved={handleSaveRole}
          availableModules={availableModules}
          departments={departments}
          programs={programs}
        />
      </div>
    </div>
  );
};

export default Settings;
