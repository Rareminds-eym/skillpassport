import { useState, useEffect } from 'react';
import { Badge, BadgeCategory, ApplicableTo } from '../../types/badge';
import { Sparkles, X } from 'lucide-react';

interface CreateBadgeFormProps {
  onSubmit: (badge: Omit<Badge, 'id' | 'createdAt'>) => void;
  editingBadge?: Badge | null;
  onCancelEdit?: () => void;
}

const emojiOptions = [
  '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '💎', '👑', 
  '🎖️', '🏅', '🎯', '🔥', '📚', '🎓', '✨', '💪',
  '🚀', '🎨', '🎵', '⚽', '🏀', '🎭', '🔬', '💻',
  '📅', '🤝', '🌍', '💡', '🎪', '🎬', '📖', '✏️',
  '🎤', '🎸', '🏃', '🏊', '🎾', '🏐', '🎳', '♟️'
];

const categories: BadgeCategory[] = [
  'Achievement',
  'Participation',
  'Skill',
  'Leadership',
  'Community',
  'Attendance'
];

const applicableToOptions: ApplicableTo[] = ['School', 'College', 'Both'];

const CreateBadgeForm = ({ onSubmit, editingBadge, onCancelEdit }: CreateBadgeFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🏆',
    category: 'Achievement' as BadgeCategory,
    applicableTo: 'Both' as ApplicableTo,
    criteria: ''
  });

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when editing
  useEffect(() => {
    if (editingBadge) {
      setFormData({
        name: editingBadge.name,
        description: editingBadge.description,
        icon: editingBadge.icon,
        category: editingBadge.category,
        applicableTo: editingBadge.applicableTo,
        criteria: editingBadge.criteria
      });
    }
  }, [editingBadge]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Badge name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Badge name must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
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
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      icon: '🏆',
      category: 'Achievement',
      applicableTo: 'Both',
      criteria: ''
    });
    setErrors({});
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

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      icon: '🏆',
      category: 'Achievement',
      applicableTo: 'Both',
      criteria: ''
    });
    setErrors({});
    onCancelEdit?.();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="text-blue-600" size={24} />
          <h2 className="text-xl font-bold text-gray-900">
            {editingBadge ? 'Edit Badge' : 'Create New Badge'}
          </h2>
        </div>
        {editingBadge && (
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              placeholder="e.g., Perfect Attendance"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Badge Icon <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors flex items-center justify-between bg-white"
              >
                <span className="text-3xl">{formData.icon}</span>
                <span className="text-sm text-gray-500">Click to change</span>
              </button>
              
              {showEmojiPicker && (
                <div className="absolute z-10 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-8 gap-2">
                    {emojiOptions.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, icon: emoji }));
                          setShowEmojiPicker(false);
                        }}
                        className={`text-2xl hover:bg-gray-100 rounded p-2 transition-colors ${
                          formData.icon === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Applicable To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Applicable To <span className="text-red-500">*</span>
            </label>
            <select
              name="applicableTo"
              value={formData.applicableTo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
            >
              {applicableToOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Criteria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Criteria <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="criteria"
            value={formData.criteria}
            onChange={handleChange}
            placeholder="e.g., Attend all classes for one semester"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.criteria ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.criteria && (
            <p className="mt-1 text-sm text-red-500">{errors.criteria}</p>
          )}
        </div>

        {/* Preview */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-3">Preview:</div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center text-3xl flex-shrink-0 shadow-sm">
                {formData.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 mb-1">
                  {formData.name || 'Badge Name'}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {formData.description || 'Badge description will appear here...'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                    {formData.category}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                    {formData.applicableTo}
                  </span>
                </div>
                {formData.criteria && (
                  <p className="text-xs text-gray-500 mt-2">
                    <span className="font-medium">Criteria:</span> {formData.criteria}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          {editingBadge && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
          >
            {editingBadge ? 'Update Badge' : 'Create Badge'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateBadgeForm;