import { useToast } from '@/hooks/use-toast';
import {
  Award,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  PenSquare,
  Plus,
  Save,
  Trash2,
  Briefcase,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { Textarea } from '../ui/textarea';
import { FIELD_CONFIGS } from './fieldConfigs';
import {
  calculateDuration,
  calculateProgress,
  generateUuid,
  isValidUrl,
  parsePositiveNumber,
  parseSkills,
} from './utils';

const UnifiedProfileEditModal = ({
  isOpen,
  onClose,
  type,
  data,
  onSave,
  singleEditMode = false,
}) => {
  const config = FIELD_CONFIGS[type];
  const { toast } = useToast();

  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState(config?.getDefaultValues?.() || {});
  const [editingIndex, setEditingIndex] = useState(singleEditMode ? 0 : null);
  const [isFormOpen, setIsFormOpen] = useState(singleEditMode);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data) {
      const normalizedData = Array.isArray(data) ? data : [data];

      setItems(normalizedData);

      if (singleEditMode && normalizedData.length > 0) {
        // In singleEditMode, populate form with existing data
        const item = normalizedData[0];
        const editData = { ...config.getDefaultValues() };

        // Copy all fields from the item, including id
        Object.keys(item).forEach((key) => {
          if (item[key] !== undefined) {
            if (key === 'skills') {
              // Handle skills - support both array and string formats
              let skillsArray = [];
              if (Array.isArray(item[key])) {
                skillsArray = item[key];
              } else if (typeof item[key] === 'string' && item[key].trim()) {
                skillsArray = item[key]
                  .split(',')
                  .map((s) => s.trim())
                  .filter((s) => s);
              }

              // Remove duplicates and convert to skillsList for the form
              const uniqueSkills = [...new Set(skillsArray)]; // Remove duplicates
              editData.skillsList = uniqueSkills.map((skillName) => ({
                name: skillName,
                type: 'soft', // Default type
                level: 3, // Default level
                description: '',
                verified: true,
                enabled: true,
                approval_status: 'approved',
              }));
            } else {
              editData[key] = Array.isArray(item[key]) ? item[key].join(', ') : item[key];
            }
          }
        });

        setFormData(editData);
        setEditingIndex(0);
        setIsFormOpen(true);
      }
    } else {
      setItems([]);
    }
  }, [data, isOpen, singleEditMode, config]);

  const Icon = config?.icon;

  const handleInputChange = (field) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    if (!config) return;
    setFormData(config.getDefaultValues());
    setEditingIndex(null);
    setIsFormOpen(false);
  };

  // Skills management functions
  const addSkill = () => {
    const skillName = formData.newSkillName?.trim();
    if (!skillName) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a skill name.',
        variant: 'destructive',
      });
      return;
    }

    // Check for duplicate skills
    const existingSkills = formData.skillsList || [];
    if (existingSkills.some((skill) => skill.name.toLowerCase() === skillName.toLowerCase())) {
      toast({
        title: 'Duplicate Skill',
        description: 'This skill has already been added.',
        variant: 'destructive',
      });
      return;
    }

    const newSkill = {
      name: skillName,
      type: formData.newSkillType || 'soft',
      level: parseInt(formData.newSkillLevel || '3'),
      description: formData.newSkillDescription?.trim() || '',
      verified: true,
      enabled: true,
      approval_status: 'approved',
    };

    setFormData((prev) => {
      const newSkillsList = [...(prev.skillsList || []), newSkill];

      return {
        ...prev,
        skillsList: newSkillsList,
        newSkillName: '',
        newSkillType: 'soft',
        newSkillLevel: '3',
        newSkillDescription: '',
      };
    });

    toast({
      title: 'Skill Added',
      description: `${skillName} has been added to your skills.`,
    });
  };

  const removeSkill = (index) => {
    const skillToRemove = formData.skillsList?.[index];

    setFormData((prev) => {
      const newSkillsList = prev.skillsList?.filter((_, i) => i !== index) || [];
      return {
        ...prev,
        skillsList: newSkillsList,
      };
    });

    // Show toast notification
    if (skillToRemove) {
      toast({
        title: 'Skill Removed',
        description: `${skillToRemove.name} has been removed from your skills.`,
      });
    }
  };

  const startAdding = () => {
    if (!config) return;
    setFormData(config.getDefaultValues());
    setEditingIndex(null);
    setIsFormOpen(true);
  };

  const startEditing = (index) => {
    if (!config) return;
    const item = items[index];
    if (!item) return;

    const editData = { ...config.getDefaultValues() };

    // Copy all fields from the item, including id and other metadata
    Object.keys(item).forEach((key) => {
      if (item[key] !== undefined) {
        editData[key] = Array.isArray(item[key]) ? item[key].join(', ') : item[key];
      }
    });

    setFormData(editData);
    setEditingIndex(index);
    setIsFormOpen(true);
  };

  const validateForm = () => {
    if (!config) return false;
    // Check required fields
    const requiredFields = config.fields.filter((f) => f.required);
    for (const field of requiredFields) {
      if (!formData[field.name]?.toString().trim()) {
        toast({
          title: 'Validation Error',
          description: `${field.label.replace(' *', '')} is required.`,
          variant: 'destructive',
        });
        return false;
      }
    }

    // Validate URL fields
    const urlFields = config.fields.filter((f) => f.type === 'url');
    for (const field of urlFields) {
      const value = formData[field.name];
      if (value && !isValidUrl(value)) {
        toast({
          title: 'Validation Error',
          description: `${field.label} must be a valid URL (e.g., https://example.com)`,
          variant: 'destructive',
        });
        return false;
      }
    }

    return true;
  };

  // Process form data and return the processed item
  const processFormData = useCallback(() => {
    if (!config) return {};
    const processedData = { ...formData };

    // Process special field types
    config.fields.forEach((field) => {
      if (field.type === 'tags' && typeof processedData[field.name] === 'string') {
        processedData[field.name] = parseSkills(processedData[field.name]);
      }
      if (field.type === 'skills_manager') {
        // Convert skillsList to skills array for compatibility
        const skillsArray = processedData.skillsList?.map((skill) => skill.name) || [];
        processedData.skills = skillsArray;

        // Keep skillsList for detailed skill data
        processedData.skillsData = processedData.skillsList || [];

        // IMPORTANT: Set the field name to the skills array for database storage
        // The field name is 'skills' in the config, so we need to set that
        processedData[field.name] = skillsArray;

        // Also ensure backward compatibility
        processedData.skills = skillsArray;
      }
      if (field.type === 'number') {
        processedData[field.name] = parsePositiveNumber(processedData[field.name]);
      }
    });

    // Calculate duration for experience type or training type
    if (config.calculateDuration) {
      const startDate = processedData.start_date || processedData.startDate;
      const endDate = processedData.end_date || processedData.endDate;
      if (startDate) {
        processedData.duration = calculateDuration(startDate, endDate);
      }
    }

    // Calculate progress for training type
    if (config.hasProgress) {
      const completed = parsePositiveNumber(processedData.completedModules);
      const total = parsePositiveNumber(processedData.totalModules);
      processedData.progress = total > 0 ? calculateProgress(completed, total) : 0;

      // Auto-determine status based on modules
      if (total > 0 && completed >= total) {
        processedData.status = 'completed';
        processedData.progress = 100;
      }
    }

    return processedData;
  }, [formData, config]);

  if (!config) {
    console.error(`Unknown profile type: ${type}`);
    return null;
  }

  const saveItem = () => {
    if (!validateForm()) return;

    const processedData = processFormData();

    if (editingIndex !== null) {
      // Update existing item
      const existingItem = items[editingIndex];
      setItems((prev) =>
        prev.map((item, idx) =>
          idx === editingIndex
            ? {
                ...existingItem,
                ...processedData,
                processing: true,
                updated_at: new Date().toISOString(),
              }
            : item
        )
      );
      toast({
        title: 'Updated',
        description: "Changes applied. Click 'Save All Changes' to save to database.",
      });
    } else {
      // Add new item
      const newItem = {
        ...processedData,
        id: generateUuid(),
        enabled: true,
        verified: false,
        processing: true,
        created_at: new Date().toISOString(),
      };
      setItems((prev) => [...prev, newItem]);
      toast({
        title: 'Added',
        description: "Item added. Click 'Save All Changes' to save to database.",
      });
    }

    resetForm();
  };

  // Direct save for singleEditMode - saves immediately to database
  const saveAndClose = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    const processedData = processFormData();

    try {
      // Get the existing item to preserve its id and other fields
      const existingItem = items[editingIndex] || {};

      // Ensure id is preserved - use existingItem.id or formData.id as fallback
      const itemId = existingItem.id || formData.id || processedData.id;

      const updatedItem = {
        ...existingItem,
        ...processedData,
        id: itemId, // Explicitly ensure id is set
        updated_at: new Date().toISOString(),
      };

      if (!updatedItem.id) {
        console.error('❌ CRITICAL: No ID found for item!');
        console.error('❌ existingItem:', existingItem);
        console.error('❌ formData:', formData);
        console.error('❌ processedData:', processedData);
        return;
      }

      // Save directly to database
      await onSave([updatedItem]);
      toast({ title: 'Saved!', description: `${config.title} saved successfully.` });
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: 'Error',
        description: 'Failed to save. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
    if (editingIndex === index) resetForm();
    toast({ title: 'Removed', description: 'Item has been removed.' });
  };

  const toggleEnabled = (index) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await onSave(items);
      toast({ title: 'Saved!', description: `${config.title} saved successfully.` });
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: 'Error',
        description: 'Failed to save. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (field) => {
    // Check if field should be disabled based on dependency
    if (field.dependsOn) {
      const dependentValue = formData[field.dependsOn.field];
      if (dependentValue !== field.dependsOn.value) {
        return null;
      }
    }

    const commonProps = {
      id: field.name,
      value: formData[field.name] || '',
      onChange: handleInputChange(field.name),
      placeholder: field.placeholder,
      disabled: field.disabled,
      className: 'bg-white',
    };

    switch (field.type) {
      case 'textarea':
        return <Textarea {...commonProps} rows={3} />;
      case 'select':
        return (
          <select
            {...commonProps}
            className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm"
          >
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
        );
      case 'date':
        return <Input {...commonProps} type="date" />;
      case 'number':
        return <Input {...commonProps} type="number" min="0" />;
      case 'url':
        return <Input {...commonProps} type="url" />;
      case 'tags':
        return <Textarea {...commonProps} rows={2} />;
      case 'skills_manager':
        return (
          <div className="space-y-4">
            {/* Current Skills Display */}
            {formData.skillsList && formData.skillsList.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-800">Current Skills</div>
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {formData.skillsList.length} skill{formData.skillsList.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {formData.skillsList.map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:shadow-sm transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-blue-900">{skill.name}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              skill.type === 'technical'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {skill.type === 'technical' ? 'Technical' : 'Soft Skill'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <span>Level:</span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <div
                                  key={level}
                                  className={`w-2 h-2 rounded-full ${
                                    level <= (skill.level || 3) ? 'bg-blue-500' : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="ml-1 font-medium">({skill.level || 3}/5)</span>
                          </div>
                        </div>
                        {skill.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                            {skill.description}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="ml-3 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                        title="Remove skill"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Skill Form */}
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <Plus className="w-4 h-4 text-gray-600" />
                <div className="text-sm font-semibold text-gray-800">Add New Skill</div>
              </div>

              <div className="space-y-3">
                {/* Skill Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Skill Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., JavaScript, Communication, Project Management"
                    value={formData.newSkillName || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, newSkillName: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Type and Level Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.newSkillType || 'soft'}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, newSkillType: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="soft">Soft Skill</option>
                      <option value="technical">Technical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Proficiency Level
                    </label>
                    <select
                      value={formData.newSkillLevel || '3'}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, newSkillLevel: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="1">Level 1 - Beginner</option>
                      <option value="2">Level 2 - Basic</option>
                      <option value="3">Level 3 - Intermediate</option>
                      <option value="4">Level 4 - Advanced</option>
                      <option value="5">Level 5 - Expert</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Brief description of your experience with this skill"
                    value={formData.newSkillDescription || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, newSkillDescription: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Add Button */}
                <button
                  type="button"
                  onClick={addSkill}
                  disabled={!formData.newSkillName?.trim()}
                  className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                    formData.newSkillName?.trim()
                      ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add Skill
                </button>
              </div>
            </div>

            {/* Empty State */}
            {(!formData.skillsList || formData.skillsList.length === 0) && (
              <div className="text-center py-6 text-gray-500">
                <Briefcase className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No skills added yet</p>
                <p className="text-xs text-gray-400">Add skills to showcase your expertise</p>
              </div>
            )}
          </div>
        );
      default:
        return <Input {...commonProps} type="text" />;
    }
  };

  // Render form for multi-item mode (add/edit within list)
  const renderForm = () => {
    if (!isFormOpen) {
      return (
        <Button
          onClick={startAdding}
          variant="outline"
          className="w-full border-dashed bg-blue-50 text-blue-600 hover:bg-blue-100"
        >
          <Plus className="w-4 h-4 mr-2" />
          {config.addButtonText}
        </Button>
      );
    }

    return (
      <div className="p-4 border-2 border-dashed border-blue-200 bg-blue-50 rounded-lg space-y-4">
        <h4 className="font-semibold text-blue-700">
          {editingIndex !== null ? `Edit ${config.title}` : `Add ${config.title}`}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {config.fields.map((field) => {
            const renderedField = renderField(field);
            if (!renderedField) return null;

            return (
              <div
                key={field.name}
                className={
                  field.type === 'textarea' ||
                  field.type === 'tags' ||
                  field.type === 'skills_manager'
                    ? 'md:col-span-2'
                    : ''
                }
              >
                <Label htmlFor={field.name}>{field.label}</Label>
                {renderedField}
              </div>
            );
          })}
        </div>

        {config.hasProgress && (
          <div className="space-y-1">
            <Progress
              value={calculateProgress(
                parsePositiveNumber(formData.completedModules),
                parsePositiveNumber(formData.totalModules)
              )}
              className="h-2"
            />
            <p className="text-xs text-gray-500">Progress calculated from modules</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={saveItem} className="bg-blue-600 hover:bg-blue-700 text-white">
            {editingIndex !== null ? 'Apply Changes' : 'Add Item'}
          </Button>
          <Button variant="outline" onClick={resetForm}>
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  const renderItemCard = (item, index) => (
    <div
      key={item.id || index}
      className={`p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
        item.enabled === false ? 'opacity-50 bg-gray-50' : 'bg-white'
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900">{config.getDisplayTitle(item)}</h4>
            {item.status && (
              <Badge
                className={
                  item.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }
              >
                {item.status}
              </Badge>
            )}
            {item.processing && (
              <Badge className="bg-orange-100 text-orange-700">
                <Clock className="w-3 h-3 mr-1" /> Processing
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600">{config.getDisplaySubtitle(item)}</p>
          {item.duration && (
            <p className="text-xs text-gray-500 mt-1">
              <Calendar className="w-3 h-3 inline mr-1" />
              {item.duration}
            </p>
          )}

          {/* Description */}
          {item.description && (
            <p className="text-sm text-gray-700 mt-2 line-clamp-3">{item.description}</p>
          )}

          {/* Technologies/Tags */}
          {(item.technologies || item.tech || item.tech_stack || item.skills) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {(() => {
                const techArray = Array.isArray(item.technologies)
                  ? item.technologies
                  : Array.isArray(item.tech)
                    ? item.tech
                    : Array.isArray(item.tech_stack)
                      ? item.tech_stack
                      : Array.isArray(item.skills)
                        ? item.skills
                        : typeof item.skills === 'string' && item.skills.trim()
                          ? item.skills.split(',').map((t) => t.trim())
                          : typeof item.technologies === 'string' && item.technologies.trim()
                            ? item.technologies.split(',').map((t) => t.trim())
                            : typeof item.tech === 'string' && item.tech.trim()
                              ? item.tech.split(',').map((t) => t.trim())
                              : typeof item.tech_stack === 'string' && item.tech_stack.trim()
                                ? item.tech_stack.split(',').map((t) => t.trim())
                                : [];

                return techArray.map((tech, i) => (
                  <Badge
                    key={i}
                    className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200 text-xs font-medium shadow-sm"
                  >
                    {tech}
                  </Badge>
                ));
              })()}
            </div>
          )}
        </div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => startEditing(index)}
            className="text-blue-600 hover:bg-blue-50"
          >
            <PenSquare className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteItem(index)}
            className="text-red-500 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleEnabled(index)}
            className={item.enabled === false ? 'text-gray-500' : 'text-green-600'}
          >
            {item.enabled === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {config.hasProgress && item.progress !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span className="text-blue-600 font-medium">{item.progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        </div>
      )}

      {item.certificateUrl && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={() => window.open(getCertificateProxyUrl(item.certificateUrl), '_blank')}
        >
          <Award className="w-4 h-4 mr-2" /> View Certificate
        </Button>
      )}
    </div>
  );

  // Render single edit mode - clean form-only UI
  if (singleEditMode) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              {Icon && <Icon className="w-5 h-5 text-blue-600" />}
              Edit {config.title}
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            <div className="space-y-5 pt-2">
              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.fields.map((field) => {
                  const renderedField = renderField(field);
                  if (!renderedField) return null;

                  return (
                    <div
                      key={field.name}
                      className={
                        field.type === 'textarea' ||
                        field.type === 'tags' ||
                        field.type === 'skills_manager'
                          ? 'md:col-span-2'
                          : ''
                      }
                    >
                      <Label
                        htmlFor={field.name}
                        className="text-sm font-medium text-gray-700 mb-1.5 block"
                      >
                        {field.label}
                      </Label>
                      {renderedField}
                    </div>
                  );
                })}
              </div>

              {/* Progress Preview for Training */}
              {config.hasProgress && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress Preview</span>
                    <span className="text-blue-600 font-semibold">
                      {calculateProgress(
                        parsePositiveNumber(formData.completedModules),
                        parsePositiveNumber(formData.totalModules)
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={calculateProgress(
                      parsePositiveNumber(formData.completedModules),
                      parsePositiveNumber(formData.totalModules)
                    )}
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500">
                    Progress is calculated from completed/total modules
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Fixed Action Buttons at Bottom */}
          <div className="flex-shrink-0 flex gap-3 pt-4 border-t border-gray-200 bg-white">
            <Button
              onClick={saveAndClose}
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isSaving} className="px-6 h-11">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Render multi-item mode - list with add/edit capabilities
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5" />}
            Edit {config.title}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          <div className="space-y-4">
            {/* Item List */}
            {items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item, index) => renderItemCard(item, index))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">{config.emptyMessage}</p>
            )}

            {/* Add/Edit Form */}
            {renderForm()}
          </div>
        </div>

        {/* Fixed Footer with Save All */}
        <div className="flex-shrink-0 flex justify-end gap-3 pt-4 border-t bg-white">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save All Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedProfileEditModal;
