import { useState } from 'react';
import { X, Award } from 'lucide-react';

interface AddBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (badgeData: BadgeFormData) => void;
  userType: 'school' | 'college'; // Simulated user type
}

interface BadgeFormData {
  name: string;
  icon: string;
  description: string;
  category: string;
  criteria: string;
}

// Mock student data - Replace with actual API call later
const mockStudents = [
  { id: '1', name: 'Rahul Kumar' },
  { id: '2', name: 'Priya Sharma' },
  { id: '3', name: 'Amit Patel' },
  { id: '4', name: 'Sneha Reddy' },
  { id: '5', name: 'Arjun Singh' },
  { id: '6', name: 'Divya Iyer' },
  { id: '7', name: 'Karthik Menon' },
  { id: '8', name: 'Anjali Gupta' },
];

// Mock student data - Replace with actual API call later
const mockStudents = [
  { id: '1', name: 'Rahul Kumar' },
  { id: '2', name: 'Priya Sharma' },
  { id: '3', name: 'Amit Patel' },
  { id: '4', name: 'Sneha Reddy' },
  { id: '5', name: 'Arjun Singh' },
  { id: '6', name: 'Divya Iyer' },
  { id: '7', name: 'Karthik Menon' },
  { id: '8', name: 'Anjali Gupta' },
];

const iconOptions = [
  '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '💎', '👑', 
  '🎖️', '🏅', '🎯', '🔥', '📚', '🎓', '✨', '💪',
  '🚀', '🎨', '🎵', '⚽', '🏀', '🎭', '🔬', '💻',
  '📅', '🤝', '🌍', '💡', '🎪', '🎬', '📖', '✏️'
];

const categoryOptions = [
  'Achievement',
  'Academic',
  'Skills',
  'Participation',
  'Leadership',
  'Attendance',
  'Career'
];

const AddBadgeModal = ({ isOpen, onClose, onSubmit, userType }: AddBadgeModalProps) => {
  const [formData, setFormData] = useState<BadgeFormData>({
    name: '',
    icon: '🏆',
    description: '',
    category: 'Achievement',
    criteria: ''
  });

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const applicableToText = userType === 'school' ? 'School Students' : 'College Students';

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Badge name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.criteria.trim()) {
      newErrors.criteria = 'Criteria is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      icon: '🏆',
      description: '',
      category: 'Achievement',
      criteria: ''
    });
    setErrors({});
    setShowIconPicker(false);
    onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Create New Badge</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Badge Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Badge Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter badge name"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Badge Icon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Badge Icon
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors flex items-center justify-between bg-white"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{formData.icon}</span>
                  <span className="text-gray-700">Select icon</span>
                </div>
                <span className="text-sm text-gray-500">Click to change</span>
              </button>
              
              {showIconPicker && (
                <div className="absolute z-10 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-8 gap-2">
                    {iconOptions.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, icon }));
                          setShowIconPicker(false);
                        }}
                        className={`text-2xl hover:bg-gray-100 rounded-lg p-2 transition-colors ${
                          formData.icon === icon ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Describe what this badge represents..."
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
                {categoryOptions.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Applicable To (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Applicable To
              </label>
              <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                {applicableToText}
              </div>
            </div>
          </div>

          {/* Criteria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Criteria <span className="text-red-500">*</span>
            </label>
            <textarea
              name="criteria"
              value={formData.criteria}
              onChange={handleChange}
              rows={2}
              placeholder="Define the criteria for earning this badge..."
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                errors.criteria ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.criteria && (
              <p className="mt-1 text-sm text-red-500">{errors.criteria}</p>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
            >
              Create Badge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBadgeModal;