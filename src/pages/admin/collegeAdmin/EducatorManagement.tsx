import React, { useState } from 'react';
import {
  AcademicCapIcon,
  PlusCircleIcon,
  XMarkIcon,
  UserGroupIcon,
  TrashIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import FacultyDocumentViewerModal from '../../../components/admin/modals/FacultyDocumentViewerModal';

interface Educator {
  id: string;
  name: string;
  email: string;
  department: string;
  phone: string;
  status: 'Active' | 'Inactive';
  assignedStudents: number;
  createdAt: string;
  employeeId?: string;
  metadata?: {
    degree_certificate_url?: string;
    id_proof_url?: string;
    experience_letters_url?: string[];
  };
}

interface FormData {
  name: string;
  email: string;
  department: string;
  phone: string;
}

const departments = [
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Other',
];

const EducatorCard = ({
  educator,
  onEdit,
  onDelete,
  onViewDocuments,
}: {
  educator: Educator;
  onEdit: (educator: Educator) => void;
  onDelete: (id: string) => void;
  onViewDocuments: (educator: Educator) => void;
}) => {
  const initials = educator.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white font-semibold text-lg flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-lg mb-1">{educator.name}</h3>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
              <EnvelopeIcon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{educator.email}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <PhoneIcon className="h-4 w-4 flex-shrink-0" />
              <span>{educator.phone}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between py-3 px-3 bg-gray-50 rounded-lg mb-4">
        <div className="flex items-center gap-2">
          <BriefcaseIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">{educator.department}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Status</p>
          <div className="flex items-center gap-1.5">
            {educator.status === 'Active' && (
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
            )}
            <span
              className={`text-sm font-medium ${
                educator.status === 'Active' ? 'text-green-700' : 'text-gray-500'
              }`}
            >
              {educator.status}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-0.5">Assigned Students</p>
          <p className="text-2xl font-bold text-gray-900">{educator.assignedStudents}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onViewDocuments(educator)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 border border-blue-200 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-all"
        >
          <DocumentTextIcon className="h-4 w-4" />
          Documents
        </button>
        <button
          onClick={() => onEdit(educator)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all"
        >
          <PencilSquareIcon className="h-4 w-4" />
          Edit
        </button>
        <button
          onClick={() => onDelete(educator.id)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 border border-red-200 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 hover:border-red-300 transition-all"
        >
          <TrashIcon className="h-4 w-4" />
          Delete
        </button>
      </div>
    </div>
  );
};

const StatsCard = ({
  label,
  value,
  icon: Icon,
  color = 'blue',
  subtext,
}: {
  label: string;
  value: number | string;
  icon: any;
  color?: 'blue' | 'green' | 'purple';
  subtext?: string;
}) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
      </div>
    </div>
  );
};

const EducatorManagement: React.FC = () => {
  const [educators, setEducators] = useState<Educator[]>([
    {
      id: 'EDU001',
      name: 'Dr. Anil Sharma',
      email: 'anil.sharma@college.edu',
      department: 'Computer Science & Engineering',
      phone: '9123456789',
      status: 'Active',
      assignedStudents: 12,
      createdAt: '2024-01-15T10:00:00Z',
      employeeId: 'FAC001',
      metadata: {
        degree_certificate_url:
          'https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/teachers/degrees/sample-degree.pdf',
        id_proof_url:
          'https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/teachers/id-proofs/sample-id.pdf',
        experience_letters_url: [
          'https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/teachers/experience-letters/exp1.pdf',
          'https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/teachers/experience-letters/exp2.pdf',
        ],
      },
    },
    {
      id: 'EDU002',
      name: 'Prof. Meera Gupta',
      email: 'meera.gupta@college.edu',
      department: 'Electronics & Communication Engineering',
      phone: '9123456790',
      status: 'Active',
      assignedStudents: 8,
      createdAt: '2024-01-20T10:00:00Z',
      employeeId: 'FAC002',
      metadata: {
        degree_certificate_url:
          'https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/teachers/degrees/sample-degree2.pdf',
        id_proof_url:
          'https://pub-ad91abcd16cd9e9c569d83d9ef46e398.r2.dev/teachers/id-proofs/sample-id2.pdf',
      },
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    department: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Document viewer modal state
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedEducatorForDocs, setSelectedEducatorForDocs] = useState<Educator | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    else if (!/^[0-9]{10}$/.test(formData.phone)) newErrors.phone = 'Phone must be 10 digits';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      if (editingId) {
        setEducators(
          educators.map((edu) => (edu.id === editingId ? { ...edu, ...formData } : edu))
        );
      } else {
        setEducators([
          ...educators,
          {
            id: `EDU${Date.now()}`,
            ...formData,
            status: 'Active',
            assignedStudents: 0,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
      resetForm();
    }
  };

  const handleEdit = (educator: Educator) => {
    setFormData({
      name: educator.name,
      email: educator.email,
      department: educator.department,
      phone: educator.phone,
    });
    setEditingId(educator.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this educator?')) {
      setEducators(educators.filter((edu) => edu.id !== id));
    }
  };

  const handleViewDocuments = (educator: Educator) => {
    setSelectedEducatorForDocs(educator);
    setShowDocumentModal(true);
  };

  const handleCloseDocumentModal = () => {
    setShowDocumentModal(false);
    setSelectedEducatorForDocs(null);
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', department: '', phone: '' });
    setErrors({});
    setShowForm(false);
    setEditingId(null);
  };

  const filteredEducators = educators.filter(
    (edu) =>
      edu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      edu.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      edu.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeEducators = educators.filter((edu) => edu.status === 'Active').length;
  const totalAssignedStudents = educators.reduce((sum, edu) => sum + edu.assignedStudents, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <AcademicCapIcon className="h-8 w-8 text-blue-600" />
                Educator Management
              </h1>
              <p className="mt-2 text-gray-600">Manage educators and their student assignments</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                showForm
                  ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {showForm ? (
                <>
                  <XMarkIcon className="h-5 w-5" />
                  Cancel
                </>
              ) : (
                <>
                  <PlusCircleIcon className="h-5 w-5" />
                  Add Educator
                </>
              )}
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              label="Total Educators"
              value={educators.length}
              icon={UserGroupIcon}
              color="blue"
              subtext={`${activeEducators} active educators`}
            />
            <StatsCard
              label="Active Educators"
              value={activeEducators}
              icon={CheckCircleIcon}
              color="green"
              subtext={`${Math.round((activeEducators / educators.length) * 100)}% of total`}
            />
            <StatsCard
              label="Students Assigned"
              value={totalAssignedStudents}
              icon={UserGroupIcon}
              color="purple"
              subtext="Across all educators"
            />
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingId ? 'Edit Educator' : 'Add New Educator'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Dr. John Smith"
                    />
                    {errors.name && (
                      <p className="mt-1.5 text-sm text-red-600">
                        <span className="font-medium">{errors.name}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="john.smith@college.edu"
                    />
                    {errors.email && (
                      <p className="mt-1.5 text-sm text-red-600">
                        <span className="font-medium">{errors.email}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Department *
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        errors.department ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                    {errors.department && (
                      <p className="mt-1.5 text-sm text-red-600">
                        <span className="font-medium">{errors.department}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="9876543210"
                    />
                    {errors.phone && (
                      <p className="mt-1.5 text-sm text-red-600">
                        <span className="font-medium">{errors.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={resetForm}
                    className="flex-1 px-5 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all shadow-sm"
                  >
                    {editingId ? 'Update Educator' : 'Add Educator'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Search */}
          <div className="border-b border-gray-200 p-6 bg-gray-50">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or department..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Results Info */}
          <div className="px-6 py-3 border-b border-gray-100 bg-white">
            <p className="text-sm text-gray-600">
              Showing{' '}
              <span className="font-semibold text-gray-900">{filteredEducators.length}</span> of{' '}
              <span className="font-semibold text-gray-900">{educators.length}</span> educator
              {educators.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Educators Grid */}
          <div className="p-6">
            {filteredEducators.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <UserGroupIcon className="h-12 w-12 text-gray-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-1">No educators found</p>
                <p className="text-sm text-gray-500">
                  {educators.length === 0
                    ? 'Create your first educator to get started'
                    : 'Try adjusting your search criteria'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEducators.map((educator) => (
                  <EducatorCard
                    key={educator.id}
                    educator={educator}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewDocuments={handleViewDocuments}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Faculty Document Viewer Modal */}
      <FacultyDocumentViewerModal
        isOpen={showDocumentModal}
        onClose={handleCloseDocumentModal}
        facultyData={
          selectedEducatorForDocs
            ? {
                name: selectedEducatorForDocs.name,
                email: selectedEducatorForDocs.email,
                employeeId: selectedEducatorForDocs.employeeId || selectedEducatorForDocs.id,
                metadata: selectedEducatorForDocs.metadata,
              }
            : null
        }
      />
    </div>
  );
};

export default EducatorManagement;
