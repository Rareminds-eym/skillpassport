import { useToast } from "@/hooks/use-toast";
import {
    Award, Calendar,
    CheckCircle,
    Clock,
    Eye, EyeOff,
    Loader2,
    PenSquare,
    Plus,
    Save,
    Trash2,
    Briefcase
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import { supabase } from "@/lib/supabaseClient";
import { Textarea } from "../ui/textarea";
import DemoModal from "../../../common/DemoModal";
import { FIELD_CONFIGS } from "./fieldConfigs";
import { calculateDuration, calculateProgress, generateUuid, isValidUrl, parsePositiveNumber, parseSkills } from "./utils";
import ProfileItemModal from "./ProfileItemModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

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
  const [showDemoModal, setShowDemoModal] = useState(false);
  
  // State for separate item modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // State for confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: null, // 'delete', 'hide', 'show'
    itemIndex: null,
    itemTitle: ''
  });

  // Track if modal was just opened to prevent reloading data while user is editing
  const [modalJustOpened, setModalJustOpened] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setModalJustOpened(true);
    }
  }, [isOpen]);

  useEffect(() => {
    console.log(`🔍 UnifiedProfileEditModal [${type}] - useEffect triggered:`, {
      modalJustOpened,
      hasData: !!data,
      dataLength: Array.isArray(data) ? data.length : 'not array'
    });
    
    // Only load data when modal first opens, not when data changes while editing
    if (!modalJustOpened) return;
    
    if (data) {
      const normalizedData = Array.isArray(data) ? data : [data];
      
      console.log(`🔍 UnifiedProfileEditModal [${type}] - Processing data:`, {
        dataCount: normalizedData.length,
        data: normalizedData,
        configFields: config.fields.map(f => f.name)
      });
      
      // VERSIONING FIX: Process items to show pending edits in the list
      const processedItems = normalizedData.map(item => {
        console.log(`🔍 UnifiedProfileEditModal [${type}] - Checking item:`, {
          id: item.id,
          title: config.getDisplayTitle(item),
          has_pending_edit: item.has_pending_edit,
          pending_edit_data: item.pending_edit_data,
          verified_data: item.verified_data,
          approval_status: item.approval_status
        });
        
        // If there's a pending edit, merge it with the item for display in edit modal
        if (item.has_pending_edit && item.pending_edit_data) {
          console.log(`🔄 UnifiedProfileEditModal [${type}] - Item with pending edit:`, {
            id: item.id,
            has_pending_edit: item.has_pending_edit,
            pending_edit_data: item.pending_edit_data,
            verified_data: item.verified_data
          });
          
          // CRITICAL: Only merge valid fields from pending_edit_data to avoid old fields like org_name
          const validFieldNames = config.fields.map(f => f.name);
          const cleanPendingData = {};
          
          Object.keys(item.pending_edit_data).forEach(key => {
            if (validFieldNames.includes(key)) {
              cleanPendingData[key] = item.pending_edit_data[key];
            }
          });
          
          console.log(`✅ UnifiedProfileEditModal [${type}] - Setting _hasPendingEdit=true for item:`, item.id);
          
          return {
            ...item,
            // Show pending edit data in the edit list (not on dashboard)
            _hasPendingEdit: true,
            _verifiedData: item.verified_data,
            // Merge ONLY valid fields from pending edit data
            ...cleanPendingData,
            // Keep original id and metadata
            id: item.id,
            student_id: item.student_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
          };
        }
        return item;
      });
      
      setItems(processedItems);
      
      if (singleEditMode && processedItems.length > 0) {
        // In singleEditMode, populate form with existing data
        const item = processedItems[0];
        const editData = { ...config.getDefaultValues() };
        
        // IMPORTANT: Only copy fields that are defined in the config to avoid old/invalid fields
        const validFieldNames = config.fields.map(f => f.name);
        const metadataFields = ['id', 'student_id', 'created_at', 'updated_at', 'approval_status', 'enabled', 'verified', 'has_pending_edit', 'verified_data', 'pending_edit_data'];
        const allowedFields = [...validFieldNames, ...metadataFields];
        
        // Copy only valid fields from the item
        Object.keys(item).forEach(key => {
          if (item[key] !== undefined && allowedFields.includes(key)) {
            if (key === 'skills') {
              // Handle skills - support both array and string formats
              let skillsArray = [];
              if (Array.isArray(item[key])) {
                skillsArray = item[key];
              } else if (typeof item[key] === 'string' && item[key].trim()) {
                skillsArray = item[key].split(',').map(s => s.trim()).filter(s => s);
              }
              
              // Remove duplicates and convert to skillsList for the form
              const uniqueSkills = [...new Set(skillsArray)]; // Remove duplicates
              editData.skillsList = uniqueSkills.map(skillName => ({
                name: skillName,
                type: 'soft', // Default type
                level: 3, // Default level
                description: '',
                verified: true,
                enabled: true,
                approval_status: 'approved'
              }));
            } else {
              editData[key] = Array.isArray(item[key]) 
                ? item[key].join(", ") 
                : item[key];
            }
          }
        });
        
        console.log('🔧 UnifiedProfileEditModal: Loading initial data for editing:', editData);
        setFormData(editData);
        setEditingIndex(0);
        setIsFormOpen(true);
      }
      
      // Reset the flag after loading data
      setModalJustOpened(false);
    } else {
      setItems([]);
      setModalJustOpened(false);
    }
  }, [modalJustOpened, data, singleEditMode, config]);

  if (!config) {
    console.error(`Unknown profile type: ${type}`);
    return null;
  }

  const Icon = config.icon;

  const handleInputChange = (field) => (e) => {
    const value = e.target.value;
    
    console.log(`🔧 UnifiedProfileEditModal: Input changed - field: ${field}, value: ${value}`);
    
    // Additional validation for date fields
    if (e.target.type === 'date' && value) {
      const today = new Date().toISOString().split('T')[0];
      
      // Validate start dates and issue dates cannot be in future
      if ((field === 'startDate' || field === 'start_date' || field === 'issuedOn') && value > today) {
        toast({
          title: "Invalid Date",
          description: "Date cannot be in the future.",
          variant: "destructive",
        });
        return; // Don't update the state
      }
      
      // Validate end date is not before start date
      if (field === 'endDate' || field === 'end_date') {
        const startDateValue = formData.startDate || formData.start_date;
        if (startDateValue && value < startDateValue) {
          toast({
            title: "Invalid Date",
            description: "End date cannot be before start date.",
            variant: "destructive",
          });
          return; // Don't update the state
        }
        if (value > today) {
          toast({
            title: "Invalid Date",
            description: "End date cannot be in the future.",
            variant: "destructive",
          });
          return; // Don't update the state
        }
      }
      
      // Validate expiry date is not before issue date
      if (field === 'expiryDate') {
        const issuedOnValue = formData.issuedOn;
        if (issuedOnValue && value < issuedOnValue) {
          toast({
            title: "Invalid Date",
            description: "Expiry date cannot be before issue date.",
            variant: "destructive",
          });
          return; // Don't update the state
        }
      }
    }
    
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      console.log(`🔧 UnifiedProfileEditModal: Updated formData:`, updated);
      return updated;
    });
  };

  const resetForm = () => {
    setFormData(config.getDefaultValues());
    setEditingIndex(null);
    setIsFormOpen(false);
  };

  // Skills management functions
  const addSkill = () => {
    const skillName = formData.newSkillName?.trim();
    if (!skillName) {
      toast({
        title: "Validation Error",
        description: "Please enter a skill name.",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate skills
    const existingSkills = formData.skillsList || [];
    if (existingSkills.some(skill => skill.name.toLowerCase() === skillName.toLowerCase())) {
      toast({
        title: "Duplicate Skill",
        description: "This skill has already been added.",
        variant: "destructive",
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
      approval_status: 'approved'
    };

    setFormData(prev => {
      const newSkillsList = [...(prev.skillsList || []), newSkill];
      
      return {
        ...prev,
        skillsList: newSkillsList,
        newSkillName: '',
        newSkillType: 'soft',
        newSkillLevel: '3',
        newSkillDescription: ''
      };
    });

    toast({
      title: "Skill Added",
      description: `${skillName} has been added to your skills.`,
    });
  };

  const removeSkill = (index) => {
    const skillToRemove = formData.skillsList?.[index];
    
    setFormData(prev => {
      const newSkillsList = prev.skillsList?.filter((_, i) => i !== index) || [];
      return {
        ...prev,
        skillsList: newSkillsList
      };
    });

    // Show toast notification
    if (skillToRemove) {
      toast({
        title: "Skill Removed",
        description: `${skillToRemove.name} has been removed from your skills.`,
      });
    }
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
    
    // IMPORTANT: Only copy fields that are defined in the config to avoid old/invalid fields
    const validFieldNames = config.fields.map(f => f.name);
    const metadataFields = ['id', 'student_id', 'created_at', 'updated_at', 'approval_status', 'enabled', 'verified', 'has_pending_edit', 'verified_data', 'pending_edit_data'];
    const allowedFields = [...validFieldNames, ...metadataFields];
    
    // Copy only valid fields from the item
    Object.keys(item).forEach(key => {
      if (item[key] !== undefined && allowedFields.includes(key)) {
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
    
    // Process special field types
    config.fields.forEach(field => {
      if (field.type === "tags" && typeof processedData[field.name] === "string") {
        processedData[field.name] = parseSkills(processedData[field.name]);
      }
      if (field.type === "skills_manager") {
        // Convert skillsList to skills array for compatibility
        const skillsArray = processedData.skillsList?.map(skill => skill.name) || [];
        processedData.skills = skillsArray;
        
        // Keep skillsList for detailed skill data
        processedData.skillsData = processedData.skillsList || [];
        
        // IMPORTANT: Set the field name to the skills array for database storage
        // The field name is 'skills' in the config, so we need to set that
        processedData[field.name] = skillsArray;
        
        // Also ensure backward compatibility
        processedData.skills = skillsArray;
      }
      if (field.type === "number") {
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

    // DEBUG: Log processed data for projects
    if (config.title === "Projects") {
      console.log('🔍 Processing project data:', processedData);
      console.log('🔍 Role field value:', processedData.role);
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

    // Special processing for skills: map fields correctly to database
    if (config.title === 'Skills' || config.title === 'Technical Skills' || config.title === 'Soft Skills' || 
        config.listKey === 'skillsList' || config.listKey === 'technicalSkillsList' || config.listKey === 'softSkillsList') {
      console.log('🔧 UnifiedProfileEditModal: Processing skills data');
      console.log('🔧 Config title:', config.title);
      console.log('🔧 Before processing:', processedData);
      
      // Map rating (1-5) to level field in database
      if (processedData.rating) {
        processedData.level = parseInt(processedData.rating) || 3;
      }
      
      // Map level text ("Intermediate", "Advanced") to proficiency_level field in database
      if (processedData.level && typeof processedData.level === 'string') {
        processedData.proficiency_level = processedData.level;
        // Set level to the rating value instead
        processedData.level = parseInt(processedData.rating) || 3;
      }
      
      console.log('🔧 After processing:', processedData);
    }

    return processedData;
  }, [formData, config]);

  const saveItem = async () => {
    if (!validateForm()) return;

    const processedData = processFormData();

    if (editingIndex !== null) {
      // Update existing item
      const existingItem = items[editingIndex];
      
      // Preserve important metadata from existing item
      const updatedItem = { 
        ...existingItem, 
        ...processedData,
        // Keep these fields from existing item
        id: existingItem.id,
        student_id: existingItem.student_id,
        created_at: existingItem.created_at,
        updated_at: new Date().toISOString() 
      };
      
      const updatedItems = items.map((item, idx) => 
        idx === editingIndex ? updatedItem : item
      );
      
      setItems(updatedItems);
      
      // AUTO-SAVE: Save to database immediately to prevent data loss on Cancel
      try {
        await onSave(updatedItems);
        // Trigger parent refresh if available
        if (typeof onSave === 'function' && onSave.refresh) {
          await onSave.refresh();
        }
        toast({ 
          title: "Saved!", 
          description: `${config.title} updated successfully.`,
          duration: 3000
        });
      } catch (error) {
        console.error('Error auto-saving:', error);
        toast({ 
          title: "Updated Locally", 
          description: `${config.title} updated. Click 'Save All Changes' to save to database.`,
          duration: 4000,
          variant: "destructive"
        });
      }
    } else {
      // Add new item
      const newItem = {
        ...processedData,
        id: generateUuid(),
        enabled: true,
        verified: false,
        approval_status: 'pending', // New items need approval
        created_at: new Date().toISOString(),
      };
      
      const updatedItems = [...items, newItem];
      setItems(updatedItems);
      
      // AUTO-SAVE: Save new items immediately too
      try {
        await onSave(updatedItems);
        // Trigger parent refresh if available
        if (typeof onSave === 'function' && onSave.refresh) {
          await onSave.refresh();
        }
        toast({ 
          title: "Saved!", 
          description: `${config.title} added successfully.`,
          duration: 3000
        });
      } catch (error) {
        console.error('Error auto-saving:', error);
        toast({ 
          title: "Added Locally", 
          description: `${config.title} added. Click 'Save All Changes' to save to database.`,
          duration: 4000,
          variant: "destructive"
        });
      }
    }

    resetForm();
  };

  const saveAndClose = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    const processedData = processFormData();
    
    console.log('🔧 UnifiedProfileEditModal saveAndClose: formData before processing:', formData);
    console.log('🔧 UnifiedProfileEditModal saveAndClose: processedData after processing:', processedData);

    try {
      // Get the existing item to preserve its id and other fields
      const existingItem = items[editingIndex] || {};
      
      // Ensure id is preserved - use existingItem.id or formData.id as fallback
      const itemId = existingItem.id || formData.id || processedData.id;
      
      const updatedItem = { 
        ...existingItem, 
        ...processedData,
        id: itemId, // Explicitly ensure id is set
        updated_at: new Date().toISOString() 
      };
      
      console.log('🔧 UnifiedProfileEditModal saveAndClose: existingItem:', existingItem);
      console.log('🔧 UnifiedProfileEditModal saveAndClose: updatedItem being saved:', updatedItem);
      console.log('🔧 UnifiedProfileEditModal saveAndClose: ID check:', {
        existingItemId: existingItem.id,
        formDataId: formData.id,
        processedDataId: processedData.id,
        finalId: itemId
      });

      if (!updatedItem.id) {
        console.error('❌ CRITICAL: No ID found for item!');
        console.error('❌ existingItem:', existingItem);
        console.error('❌ formData:', formData);
        console.error('❌ processedData:', processedData);
        toast({
          title: "Error",
          description: "Cannot save: Missing item ID. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Save directly to database
      await onSave([updatedItem]);
      
      toast({ title: "Saved!", description: `${config.title} saved successfully.` });
      
      // Close modal after a brief delay to allow refresh to complete
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (error) {
      console.error("Error saving:", error);
      toast({ title: "Error", description: "Failed to save. Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (index) => {
    setShowDemoModal(true);
  };
  
  const handleConfirmDelete = async () => {
    const index = confirmDialog.itemIndex;
    
    // Close dialog
    setConfirmDialog({ isOpen: false, type: null, itemIndex: null, itemTitle: '' });
    
    // Remove item from list
    const updatedItems = items.filter((_, idx) => idx !== index);
    setItems(updatedItems);
    
    if (editingIndex === index) resetForm();
    
    // Auto-save to database
    try {
      await onSave(updatedItems);
      // Trigger parent refresh if available
      if (typeof onSave === 'function' && onSave.refresh) {
        await onSave.refresh();
      }
      toast({ 
        title: "Deleted!", 
        description: `${config.title} has been deleted successfully.`,
        duration: 3000
      });
    } catch (error) {
      console.error('Error deleting:', error);
      toast({ 
        title: "Error", 
        description: "Failed to delete. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  const toggleEnabled = async (index) => {
    const item = items[index];
    const newState = !item.enabled;
    const itemTitle = config.getDisplayTitle(item);
    
    // Don't allow hiding/showing items that are pending verification or approval
    if (item.approval_status === 'pending' || item._hasPendingEdit) {
      toast({ 
        title: "Cannot Hide/Show", 
        description: `You cannot hide or show ${config.title.toLowerCase()} that are pending verification or approval.`,
        variant: "destructive",
        duration: 4000,
      });
      return;
    }
    
    // Show confirmation dialog
    const action = newState ? "show" : "hide";
    setConfirmDialog({
      isOpen: true,
      type: action,
      itemIndex: index,
      itemTitle: itemTitle
    });
  };
  
  const handleConfirmToggle = async () => {
    const index = confirmDialog.itemIndex;
    const item = items[index];
    const newState = confirmDialog.type === 'show';
    
    // Close dialog
    setConfirmDialog({ isOpen: false, type: null, itemIndex: null, itemTitle: '' });
    
    // Update item state locally
    const updatedItems = items.map((item, idx) => 
      idx === index ? { ...item, enabled: newState } : item
    );
    setItems(updatedItems);
    
    // For hide/show, we need to update the database directly without triggering versioning
    // We'll update just the enabled field for this specific item
    try {
      // Get table name from config (defaults to 'certificates' for backward compatibility)
      const tableName = config.tableName || 'certificates';
      
      // Update only the enabled field directly in database
      const { error } = await supabase
        .from(tableName)
        .update({ enabled: newState })
        .eq('id', item.id);
      
      if (error) throw error;
      
      // Trigger parent refresh if available
      if (typeof onSave === 'function' && onSave.refresh) {
        await onSave.refresh();
      }
      
      toast({ 
        title: newState ? "Visibility Enabled" : "Visibility Disabled", 
        description: `${config.title} ${newState ? 'is now visible' : 'is now hidden'} on your profile.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast({ 
        title: "Error", 
        description: "Failed to update visibility. Please try again.", 
        variant: "destructive" 
      });
      // Restore original state on error
      setItems(items);
    }
  };

  // Handlers for separate item modal
  const handleAddItem = () => {
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleEditItem = (index) => {
    setEditingItem({ ...items[index], index });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (savedItem) => {
    console.log('🔧 UnifiedProfileEditModal: handleSaveItem called with:', savedItem);
    
    if (editingItem && editingItem.index !== undefined) {
      // Update existing item
      const updatedItems = items.map((item, idx) => 
        idx === editingItem.index 
          ? { ...savedItem }
          : item
      );
      setItems(updatedItems);
      
      // IMPORTANT: Auto-save to database immediately to prevent data loss
      // This ensures changes persist even if user clicks Cancel
      try {
        await onSave(updatedItems);
        toast({ 
          title: "Saved!", 
          description: `${config.title} updated successfully.`,
          duration: 3000
        });
      } catch (error) {
        console.error('Error auto-saving:', error);
        toast({ 
          title: "Updated Locally", 
          description: `${config.title} updated. Click 'Save All Changes' to save to database.`,
          duration: 4000
        });
      }
    } else {
      // Add new item
      const newItem = {
        ...savedItem,
      };
      console.log('🔧 UnifiedProfileEditModal: Adding new item:', newItem);
      const updatedItems = [...items, newItem];
      setItems(updatedItems);
      
      // Auto-save new items too
      try {
        await onSave(updatedItems);
        toast({ 
          title: "Saved!", 
          description: `${config.title} added successfully.`,
          duration: 3000
        });
      } catch (error) {
        console.error('Error auto-saving:', error);
        toast({ 
          title: "Added Locally", 
          description: `${config.title} added. Click 'Save All Changes' to save to database.`,
          duration: 4000
        });
      }
    }
    setIsItemModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    
    console.log('🔧 UnifiedProfileEditModal: handleSubmit called');
    console.log('🔧 Current formData:', formData);
    console.log('🔧 Current items before processing:', items);
    
    try {
      // Process all items with field mapping for skills
      let processedItems = items.map(item => {
        // Remove temporary flags before saving
        const { _hasLocalChanges, _hasPendingEdit, _verifiedData, processing, ...cleanItem } = item;
        return cleanItem;
      });
      
      if (config.title === 'Skills' || config.title === 'Technical Skills' || config.title === 'Soft Skills' || 
          config.listKey === 'skillsList' || config.listKey === 'technicalSkillsList' || config.listKey === 'softSkillsList') {
        console.log('🔧 UnifiedProfileEditModal: Processing skills array for save');
        console.log('🔧 Original items:', items);
        console.log('🔧 Config:', config);
        
        processedItems = processedItems.map((item, index) => {
          console.log(`🔧 Processing item ${index}:`, item);
          const processedItem = { ...item };
          
          // Check what fields exist on the original item
          console.log('🔧 Item keys:', Object.keys(item));
          console.log('🔧 Item.level:', item.level, 'type:', typeof item.level);
          console.log('🔧 Item.rating:', item.rating, 'type:', typeof item.rating);
          console.log('🔧 Item.proficiency_level:', item.proficiency_level);
          
          // Store original level text as proficiency_level
          if (processedItem.level && typeof processedItem.level === 'string') {
            processedItem.proficiency_level = processedItem.level;
            console.log('🔧 Set proficiency_level to:', processedItem.proficiency_level);
          }
          
          // Map rating (1-5) to level field in database
          if (processedItem.rating) {
            processedItem.level = parseInt(processedItem.rating) || 3;
            console.log('🔧 Set level to rating:', processedItem.level);
          } else if (processedItem.level && typeof processedItem.level === 'string') {
            // If no rating but has text level, default to 3
            processedItem.level = 3;
            console.log('🔧 Set level to default 3');
          }
          
          console.log('🔧 Final processed item:', processedItem);
          return processedItem;
        });
        
        console.log('🔧 All processed items:', processedItems);
      }
      
      await onSave(processedItems);
      
      toast({ title: "Saved!", description: `${config.title} saved successfully.` });
      
      // Close modal after a brief delay to allow refresh to complete
      setTimeout(() => {
        onClose();
      }, 300);
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
        // Add date validation for start and end dates
        const dateProps = { ...commonProps, type: "date" };
        
        const today = new Date().toISOString().split('T')[0];
        
        // For start date: max is today (cannot select future dates)
        if (field.name === "startDate" || field.name === "start_date") {
          dateProps.max = today;
        }
        
        // For end date: min is start date, max is today
        if (field.name === "endDate" || field.name === "end_date") {
          const startDateValue = formData.startDate || formData.start_date;
          if (startDateValue) {
            dateProps.min = startDateValue;
          }
          dateProps.max = today;
        }
        
        // For certificates: issuedOn cannot be in the future
        if (field.name === "issuedOn") {
          dateProps.max = today;
        }
        
        // For certificates: expiryDate must be after issuedOn
        if (field.name === "expiryDate") {
          const issuedOnValue = formData.issuedOn;
          if (issuedOnValue) {
            dateProps.min = issuedOnValue;
          }
          // Expiry date can be in the future (no max constraint)
        }
        
        return <Input {...dateProps} />;
      case "number":
        return <Input {...commonProps} type="number" min="0" />;
      case "url":
        return <Input {...commonProps} type="url" />;
      case "tags":
        return <Textarea {...commonProps} rows={2} />;
      case "skills_manager":
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
                    <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:shadow-sm transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-blue-900">{skill.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            skill.type === 'technical' 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {skill.type === 'technical' ? 'Technical' : 'Soft Skill'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <span>Level:</span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(level => (
                                <div
                                  key={level}
                                  className={`w-2 h-2 rounded-full ${
                                    level <= (skill.level || 3) 
                                      ? 'bg-blue-500' 
                                      : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="ml-1 font-medium">({skill.level || 3}/5)</span>
                          </div>
                        </div>
                        {skill.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-1">{skill.description}</p>
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">Skill Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., JavaScript, Communication, Project Management"
                    value={formData.newSkillName || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, newSkillName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                
                {/* Type and Level Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.newSkillType || "soft"}
                      onChange={(e) => setFormData(prev => ({ ...prev, newSkillType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="soft">Soft Skill</option>
                      <option value="technical">Technical</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Proficiency Level</label>
                    <select
                      value={formData.newSkillLevel || "3"}
                      onChange={(e) => setFormData(prev => ({ ...prev, newSkillLevel: e.target.value }))}
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="Brief description of your experience with this skill"
                    value={formData.newSkillDescription || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, newSkillDescription: e.target.value }))}
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
    // For types that should use separate modals, don't show inline form
    const usesSeparateModal = ['education', 'experience', 'training', 'projects', 'certificates', 'skills', 'technicalSkills', 'softSkills'];
    if (usesSeparateModal.includes(type)) {
      return null; // The Add button is now in the header
    }

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
              <div key={field.name} className={field.type === "textarea" || field.type === "tags" || field.type === "skills_manager" ? "md:col-span-2" : ""}>
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
            {/* Show only ONE badge in priority order */}
            {item._hasLocalChanges ? (
              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                <Clock className="w-3 h-3 mr-1" /> Unsaved Changes
              </Badge>
            ) : item._hasPendingEdit ? (
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                <Clock className="w-3 h-3 mr-1" /> Pending Approval
              </Badge>
            ) : item.approval_status === 'pending' ? (
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                <Clock className="w-3 h-3 mr-1" /> Pending Verification
              </Badge>
            ) : (item.approval_status === 'approved' || item.approval_status === 'verified') ? (
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle className="w-3 h-3 mr-1" /> Verified
              </Badge>
            ) : item.status && item.status !== 'active' ? (
              <Badge className={item.status === "completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}>
                {item.status}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-gray-600">{config.getDisplaySubtitle(item)}</p>
          {item._hasLocalChanges && (
            <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
              <strong>Unsaved:</strong> Changes are pending. Click the edit button to save.
            </div>
          )}
          {item._hasPendingEdit && !item._hasLocalChanges && (
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
              <strong>Note:</strong> Your changes are saved but pending approval. The dashboard shows the verified version until approved.
            </div>
          )}
          {/* Debug logging for note visibility */}
          {console.log(`🔍 Note visibility check for ${config.getDisplayTitle(item)}:`, {
            _hasPendingEdit: item._hasPendingEdit,
            _hasLocalChanges: item._hasLocalChanges,
            shouldShowNote: item._hasPendingEdit && !item._hasLocalChanges
          })}
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
                        : typeof item.skills === 'string' && item.skills.trim()
                          ? item.skills.split(',').map(t => t.trim())
                          : typeof item.technologies === 'string' && item.technologies.trim()
                            ? item.technologies.split(',').map(t => t.trim())
                            : typeof item.tech === 'string' && item.tech.trim()
                              ? item.tech.split(',').map(t => t.trim())
                              : typeof item.tech_stack === 'string' && item.tech_stack.trim()
                                ? item.tech_stack.split(',').map(t => t.trim())
                                : [];

                return techArray.map((tech, i) => (
                  <Badge key={i} variant="outline" className="bg-blue-50 text-blue-800 border-blue-300 text-xs font-semibold shadow-sm hover:bg-blue-100">
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
            onClick={() => {
              const usesSeparateModal = ['education', 'experience', 'training', 'projects', 'certificates', 'skills', 'technicalSkills', 'softSkills'];
              if (usesSeparateModal.includes(type)) {
                handleEditItem(index);
              } else {
                startEditing(index);
              }
            }} 
            className="text-blue-600 hover:bg-blue-50"
          >
            <PenSquare className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => deleteItem(index)} className="text-red-500 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
          </Button>
          {/* Only show hide/show button for verified certificates (not pending approval) */}
          {!(item.approval_status === 'pending' || item._hasPendingEdit) && (
            <Button variant="ghost" size="sm" onClick={() => toggleEnabled(index)} className={item.enabled === false ? "text-gray-500" : "text-green-600"}>
              {item.enabled === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          )}
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
                    <div key={field.name} className={field.type === "textarea" || field.type === "tags" || field.type === "skills_manager" ? "md:col-span-2" : ""}>
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
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                {Icon && <Icon className="w-5 h-5" />}
                Edit {config.title}
              </DialogTitle>
              {(() => {
                const usesSeparateModal = ['education', 'experience', 'training', 'projects', 'certificates', 'skills', 'technicalSkills', 'softSkills'];
                if (usesSeparateModal.includes(type)) {
                  return (
                    <Button 
                      onClick={handleAddItem}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {config.addButtonText}
                    </Button>
                  );
                }
                return null;
              })()}
            </div>
          </DialogHeader>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            <div className="space-y-4">
              {/* Item List */}
              {items.length > 0 ? (
                <div className="space-y-3">
                  {items
                    .sort((a, b) => {
                      // Sort by the most relevant date field in descending order (most recent first)
                      const getDate = (item) => {
                        // For education
                        if (item.yearOfPassing) return new Date(item.yearOfPassing, 11, 31);
                        if (item.year) return new Date(item.year, 11, 31);
                        
                        // For experience, training, projects
                        if (item.endDate) return new Date(item.endDate);
                        if (item.end_date) return new Date(item.end_date);
                        if (item.completedDate) return new Date(item.completedDate);
                        if (item.completed_date) return new Date(item.completed_date);
                        
                        // For certificates
                        if (item.issueDate) return new Date(item.issueDate);
                        if (item.issue_date) return new Date(item.issue_date);
                        if (item.issuedOn) return new Date(item.issuedOn);
                        if (item.date) return new Date(item.date);
                        
                        // Fallback to start dates
                        if (item.startDate) return new Date(item.startDate);
                        if (item.start_date) return new Date(item.start_date);
                        
                        // Fallback to creation date
                        if (item.created_at) return new Date(item.created_at);
                        
                        return new Date(0); // Default to epoch if no date found
                      };
                      
                      const dateA = getDate(a);
                      const dateB = getDate(b);
                      return dateB - dateA; // Descending order (most recent first)
                    })
                    .map((item, index) => renderItemCard(item, index))
                  }
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
            {/* COMMENTED OUT: Save All Changes button - redundant with auto-save in "Update Certificates" button
            <Button 
              onClick={handleSubmit} 
              disabled={isSaving}
              className={`${
                items.some(item => item.processing) 
                  ? 'bg-orange-600 hover:bg-orange-700 animate-pulse' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
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
                  {items.some(item => item.processing) && (
                    <span className="ml-2 bg-white text-orange-600 px-2 py-0.5 rounded-full text-xs font-bold">
                      {items.filter(item => item.processing).length}
                    </span>
                  )}
                </>
              )}
            </Button>
            */}
          </div>

          {/* COMMENTED OUT: Save All Changes button - redundant since we have auto-save in "Update Certificates" button */}
          {/* 
          <div className="flex-shrink-0 flex justify-end gap-3 pt-4 border-t bg-white">
            <Button 
              onClick={handleSubmit} 
              disabled={isSaving}
              className={`${
                items.some(item => item.processing) 
                  ? 'bg-orange-600 hover:bg-orange-700 animate-pulse' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
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
                  {items.some(item => item.processing) && (
                    <span className="ml-2 bg-white text-orange-600 px-2 py-0.5 rounded-full text-xs font-bold">
                      {items.filter(item => item.processing).length}
                    </span>
                  )}
                </>
              )}
            </Button>
          </div>
          */}
        </DialogContent>
      </Dialog>

      {/* Separate Item Modal */}
      {(() => {
        const usesSeparateModal = ['education', 'experience', 'training', 'projects', 'certificates', 'skills', 'technicalSkills', 'softSkills'];
        if (usesSeparateModal.includes(type)) {
          return (
            <ProfileItemModal
              isOpen={isItemModalOpen}
              onClose={() => {
                setIsItemModalOpen(false);
                setEditingItem(null);
              }}
              type={type}
              item={editingItem}
              onSave={handleSaveItem}
            />
          );
        }
        return null;
      })()}
      
      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && setConfirmDialog({ isOpen: false, type: null, itemIndex: null, itemTitle: '' })}>
        <AlertDialogContent className="bg-white rounded-xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-gray-900">
              {confirmDialog.type === 'delete' && 'Delete Confirmation'}
              {confirmDialog.type === 'hide' && 'Hide Confirmation'}
              {confirmDialog.type === 'show' && 'Show Confirmation'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              {confirmDialog.type === 'delete' && (
                <>Are you sure you want to delete <strong>"{confirmDialog.itemTitle}"</strong>? This action cannot be undone.</>
              )}
              {confirmDialog.type === 'hide' && (
                <>Are you sure you want to hide <strong>"{confirmDialog.itemTitle}"</strong> on your profile?</>
              )}
              {confirmDialog.type === 'show' && (
                <>Are you sure you want to show <strong>"{confirmDialog.itemTitle}"</strong> on your profile?</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDialog.type === 'delete' ? handleConfirmDelete : handleConfirmToggle}
              className={`px-4 py-2 text-white rounded-lg ${
                confirmDialog.type === 'delete' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {confirmDialog.type === 'delete' && 'Delete'}
              {confirmDialog.type === 'hide' && 'Hide'}
              {confirmDialog.type === 'show' && 'Show'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Demo Modal */}
      <DemoModal 
        isOpen={showDemoModal} 
        onClose={() => setShowDemoModal(false)}
        message="This feature is available in the full version. You are currently viewing the demo. Please contact us to get complete access."
      />
    </>
  );
};

export default UnifiedProfileEditModal;
