import { useToast } from "@/hooks/use-toast";
import {
    Award, Calendar,
    Clock,
    Eye, EyeOff,
    Loader2,
    PenSquare,
    Plus,
    Save,
    Trash2
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import { Textarea } from "../ui/textarea";
import { FIELD_CONFIGS } from "./fieldConfigs";
import { calculateDuration, calculateProgress, generateUuid, isValidUrl, parsePositiveNumber, parseSkills } from "./utils";

const UnifiedProfileEditModal = ({ 
  isOpen, 
  onClose, 
  type, 
  data, 
  onSave,
  singleEditMode = false 
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
      console.log('📥 Modal useEffect - received data:', normalizedData);
      console.log('📥 Modal useEffect - item id:', normalizedData[0]?.id);
      
      setItems(normalizedData);
      
      if (singleEditMode && normalizedData.length > 0) {
        // In singleEditMode, populate form with existing data
        const item = normalizedData[0];
        const editData = { ...config.getDefaultValues() };
        
        // Copy all fields from the item, including id
        Object.keys(item).forEach(key => {
          if (item[key] !== undefined) {
            editData[key] = Array.isArray(item[key]) 
              ? item[key].join(", ") 
              : item[key];
          }
        });
        
        console.log('📥 Modal useEffect - editData with id:', editData.id);
        
        setFormData(editData);
        setEditingIndex(0);
        setIsFormOpen(true);
      }
    } else {
      setItems([]);
    }
  }, [data, isOpen, singleEditMode, config]);

  if (!config) {
    console.error(`Unknown profile type: ${type}`);
    return null;
  }

  const Icon = config.icon;

  const handleInputChange = (field) => (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(config.getDefaultValues());
    setEditingIndex(null);
    setIsFormOpen(false);
  };

  const startAdding = () => {
    setFormData(config.getDefaultValues());
    setEditingIndex(null);
    setIsFormOpen(true);
  };

  const startEditing = (index) => {
    const item = items[index];
    if (!item) return;
    
    const editData = { ...config.getDefaultValues() };
    
    // Copy all fields from the item, including id and other metadata
    Object.keys(item).forEach(key => {
      if (item[key] !== undefined) {
        editData[key] = Array.isArray(item[key]) 
          ? item[key].join(", ") 
          : item[key];
      }
    });
    
    setFormData(editData);
    setEditingIndex(index);
    setIsFormOpen(true);
  };

  const validateForm = () => {
    // Check required fields
    const requiredFields = config.fields.filter(f => f.required);
    for (const field of requiredFields) {
      if (!formData[field.name]?.toString().trim()) {
        toast({
          title: "Validation Error",
          description: `${field.label.replace(" *", "")} is required.`,
          variant: "destructive",
        });
        return false;
      }
    }
    
    // Validate URL fields
    const urlFields = config.fields.filter(f => f.type === "url");
    for (const field of urlFields) {
      const value = formData[field.name];
      if (value && !isValidUrl(value)) {
        toast({
          title: "Validation Error",
          description: `${field.label} must be a valid URL (e.g., https://example.com)`,
          variant: "destructive",
        });
        return false;
      }
    }
    
    return true;
  };

  // Process form data and return the processed item
  const processFormData = useCallback(() => {
    const processedData = { ...formData };
    
    console.log('🔄 processFormData - formData:', formData);
    console.log('🔄 processFormData - formData.id:', formData.id);
    console.log('🔄 processFormData - processedData.id:', processedData.id);
    
    // Process special field types
    config.fields.forEach(field => {
      if (field.type === "tags" && typeof processedData[field.name] === "string") {
        processedData[field.name] = parseSkills(processedData[field.name]);
      }
      if (field.type === "number") {
        processedData[field.name] = parsePositiveNumber(processedData[field.name]);
      }
    });

    // Calculate duration for experience type
    if (config.calculateDuration && processedData.start_date) {
      processedData.duration = calculateDuration(processedData.start_date, processedData.end_date);
    }

    // Calculate progress for training type
    if (config.hasProgress) {
      const completed = parsePositiveNumber(processedData.completedModules);
      const total = parsePositiveNumber(processedData.totalModules);
      processedData.progress = total > 0 ? calculateProgress(completed, total) : 0;
      
      // Auto-determine status based on modules
      if (total > 0 && completed >= total) {
        processedData.status = "completed";
        processedData.progress = 100;
      }
    }

    return processedData;
  }, [formData, config]);

  const saveItem = () => {
    if (!validateForm()) return;

    const processedData = processFormData();

    if (editingIndex !== null) {
      // Update existing item
      const existingItem = items[editingIndex];
      setItems(prev => prev.map((item, idx) => 
        idx === editingIndex 
          ? { ...existingItem, ...processedData, processing: true, updated_at: new Date().toISOString() }
          : item
      ));
      toast({ title: "Updated", description: "Changes applied. Click 'Save All Changes' to save to database." });
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
      setItems(prev => [...prev, newItem]);
      toast({ title: "Added", description: "Item added. Click 'Save All Changes' to save to database." });
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
      
      console.log('🔍 saveAndClose - existingItem:', existingItem);
      console.log('🔍 saveAndClose - processedData:', processedData);
      console.log('🔍 saveAndClose - existingItem.id:', existingItem.id);
      console.log('🔍 saveAndClose - formData.id:', formData.id);
      
      // Ensure id is preserved - use existingItem.id or formData.id as fallback
      const itemId = existingItem.id || formData.id || processedData.id;
      
      const updatedItem = { 
        ...existingItem, 
        ...processedData,
        id: itemId, // Explicitly ensure id is set
        updated_at: new Date().toISOString() 
      };

      console.log('💾 saveAndClose - updatedItem to save:', updatedItem);
      console.log('💾 saveAndClose - updatedItem.id:', updatedItem.id);
      
      if (!updatedItem.id) {
        console.error('❌ CRITICAL: No ID found for item!');
        console.error('❌ existingItem:', existingItem);
        console.error('❌ formData:', formData);
        console.error('❌ processedData:', processedData);
      }

      // Save directly to database
      await onSave([updatedItem]);
      toast({ title: "Saved!", description: `${config.title} saved successfully.` });
      onClose();
    } catch (error) {
      console.error("Error saving:", error);
      toast({ title: "Error", description: "Failed to save. Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = (index) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
    if (editingIndex === index) resetForm();
    toast({ title: "Removed", description: "Item has been removed." });
  };

  const toggleEnabled = (index) => {
    setItems(prev => prev.map((item, idx) => 
      idx === index ? { ...item, enabled: !item.enabled } : item
    ));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await onSave(items);
      toast({ title: "Saved!", description: `${config.title} saved successfully.` });
      onClose();
    } catch (error) {
      console.error("Error saving:", error);
      toast({ title: "Error", description: "Failed to save. Please try again.", variant: "destructive" });
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
      value: formData[field.name] || "",
      onChange: handleInputChange(field.name),
      placeholder: field.placeholder,
      disabled: field.disabled,
      className: "bg-white",
    };

    switch (field.type) {
      case "textarea":
        return <Textarea {...commonProps} rows={3} />;
      case "select":
        return (
          <select {...commonProps} className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm">
            {field.options.map(opt => (
              <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
            ))}
          </select>
        );
      case "date":
        return <Input {...commonProps} type="date" />;
      case "number":
        return <Input {...commonProps} type="number" min="0" />;
      case "url":
        return <Input {...commonProps} type="url" />;
      case "tags":
        return <Textarea {...commonProps} rows={2} />;
      default:
        return <Input {...commonProps} type="text" />;
    }
  };

  // Render form for multi-item mode (add/edit within list)
  const renderForm = () => {
    if (!isFormOpen) {
      return (
        <Button onClick={startAdding} variant="outline" className="w-full border-dashed bg-blue-50 text-blue-600 hover:bg-blue-100">
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
          {config.fields.map(field => {
            const renderedField = renderField(field);
            if (!renderedField) return null;
            
            return (
              <div key={field.name} className={field.type === "textarea" || field.type === "tags" ? "md:col-span-2" : ""}>
                <Label htmlFor={field.name}>{field.label}</Label>
                {renderedField}
              </div>
            );
          })}
        </div>

        {config.hasProgress && (
          <div className="space-y-1">
            <Progress value={calculateProgress(
              parsePositiveNumber(formData.completedModules),
              parsePositiveNumber(formData.totalModules)
            )} className="h-2" />
            <p className="text-xs text-gray-500">Progress calculated from modules</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={saveItem} className="bg-blue-600 hover:bg-blue-700 text-white">
            {editingIndex !== null ? "Apply Changes" : "Add Item"}
          </Button>
          <Button variant="outline" onClick={resetForm}>Cancel</Button>
        </div>
      </div>
    );
  };

  const renderItemCard = (item, index) => (
    <div
      key={item.id || index}
      className={`p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
        item.enabled === false ? "opacity-50 bg-gray-50" : "bg-white"
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900">{config.getDisplayTitle(item)}</h4>
            {item.status && (
              <Badge className={item.status === "completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}>
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
          {item.duration && <p className="text-xs text-gray-500 mt-1"><Calendar className="w-3 h-3 inline mr-1" />{item.duration}</p>}

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
                        : typeof item.technologies === 'string'
                          ? item.technologies.split(',').map(t => t.trim())
                          : [];

                return techArray.map((tech, i) => (
                  <Badge key={i} className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200 text-xs font-medium shadow-sm">
                    {tech}
                  </Badge>
                ));
              })()}
            </div>
          )}
        </div>

        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => startEditing(index)} className="text-blue-600 hover:bg-blue-50">
            <PenSquare className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => deleteItem(index)} className="text-red-500 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => toggleEnabled(index)} className={item.enabled === false ? "text-gray-500" : "text-green-600"}>
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
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${item.progress}%` }} />
          </div>
        </div>
      )}

      {item.certificateUrl && (
        <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => window.open(getCertificateProxyUrl(item.certificateUrl), "_blank")}>
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
                {config.fields.map(field => {
                  const renderedField = renderField(field);
                  if (!renderedField) return null;
                  
                  return (
                    <div key={field.name} className={field.type === "textarea" || field.type === "tags" ? "md:col-span-2" : ""}>
                      <Label htmlFor={field.name} className="text-sm font-medium text-gray-700 mb-1.5 block">
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
                      )}%
                    </span>
                  </div>
                  <Progress value={calculateProgress(
                    parsePositiveNumber(formData.completedModules),
                    parsePositiveNumber(formData.totalModules)
                  )} className="h-2" />
                  <p className="text-xs text-gray-500">Progress is calculated from completed/total modules</p>
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
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={isSaving}
              className="px-6 h-11"
            >
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
