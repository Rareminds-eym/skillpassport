import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  ShareIcon,
  DocumentArrowDownIcon,
  LinkIcon,
  ClockIcon,
  TagIcon,
  UserGroupIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  CalendarDaysIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabaseClient';
import { 
  getShortlists, 
  getShortlistCandidates, 
  createShortlist,
  updateShortlist,
  deleteShortlist,
  removeCandidateFromShortlist,
  logExportActivity
} from '../../services/shortlistService';

// Define TypeScript interfaces for our data
interface ShortlistCandidate {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  university?: string;
  department?: string;
  cgpa?: string;
  year_of_passing?: string;
  employability_score?: number;
  photo?: string;
  verified?: boolean;
  added_at?: string;
  notes?: string;
  skills?: string[];
  badges?: string[];
}

interface Shortlist {
  id: string;
  name: string;
  description: string | null;
  created_date: string;
  created_by: string | null;
  status: string;
  candidates?: ShortlistCandidate[];
  candidate_count?: number;
  shared: boolean;
  share_link: string | null;
  share_expiry: string | null;
  watermark: boolean;
  tags: string[] | null;
  include_pii: boolean;
  notify_on_access: boolean;
}

const StatusBadge = ({ status, shared, expiry }) => {
  const getStatusInfo = () => {
    if (shared && expiry) {
      const isExpired = new Date(expiry) < new Date();
      if (isExpired) {
        return { color: 'bg-red-100 text-red-800', label: 'Link Expired' };
      }
      return { color: 'bg-green-100 text-green-800', label: 'Shared' };
    }
    if (shared) {
      return { color: 'bg-blue-100 text-blue-800', label: 'Shared' };
    }
    return { color: 'bg-gray-100 text-gray-800', label: 'Private' };
  };

  const statusInfo = getStatusInfo();
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
      {statusInfo.label}
    </span>
  );
};

const ShareModal = ({ shortlist, isOpen, onClose, onShare }) => {
  const [shareSettings, setShareSettings] = useState({
    expiry_days: 30,
    watermark: true,
    include_pii: false,
    notify_on_access: true
  });

  const handleShare = async () => {
    try {
      const shareToken = Math.random().toString(36).substr(2, 9);
      const shareLink = `https://recruiterhub.com/shared/${shortlist.id}?token=${shareToken}`;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + shareSettings.expiry_days);
      
      // Update the shortlist in Supabase using the service function
      const { error } = await updateShortlist(shortlist.id, {
        shared: true,
        share_link: shareLink,
        share_expiry: expiryDate.toISOString(),
        watermark: shareSettings.watermark,
        include_pii: shareSettings.include_pii,
        notify_on_access: shareSettings.notify_on_access
      });

      if (error) throw error;

      // Call the onShare callback with updated data
      onShare({
        ...shortlist,
        shared: true,
        share_link: shareLink,
        share_expiry: expiryDate.toISOString(),
        watermark: shareSettings.watermark,
        include_pii: shareSettings.include_pii,
        notify_on_access: shareSettings.notify_on_access
      });
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareLink);
      alert('Share link generated and copied to clipboard!');
      
      onClose();
    } catch (error) {
      console.error('Error sharing shortlist:', error);
      alert('Failed to share shortlist. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Share Shortlist</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium text-gray-900">{shortlist.name}</h4>
            <p className="text-sm text-gray-500">{shortlist.candidates.length} candidates</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link Expiry
              </label>
              <select
                value={shareSettings.expiry_days}
                onChange={(e) => setShareSettings({...shareSettings, expiry_days: parseInt(e.target.value)})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={365}>1 year</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={shareSettings.watermark}
                  onChange={(e) => setShareSettings({...shareSettings, watermark: e.target.checked})}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Add watermark to exports</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={shareSettings.include_pii}
                  onChange={(e) => setShareSettings({...shareSettings, include_pii: e.target.checked})}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Include personal information (email, phone)</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={shareSettings.notify_on_access}
                  onChange={(e) => setShareSettings({...shareSettings, notify_on_access: e.target.checked})}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Notify when someone accesses the link</span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
            >
              Generate Share Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExportModal = ({ shortlist, isOpen, onClose, onExport }) => {
  const [exportSettings, setExportSettings] = useState({
    format: 'csv',
    type: 'mini_profile',
    include_skills: true,
    include_badges: true,
    include_scores: true,
    include_evidence: true,
    watermark: true
  });

  // Helper function to generate CSV content
  const generateCSV = (shortlist: Shortlist, settings: any) => {
    const headers = ['Name', 'Department', 'University', 'CGPA', 'Year of Passing'];
    
    if (settings.include_pii) {
      headers.push('Email', 'Phone');
    }
    
    if (settings.include_scores) headers.push('Employability Score');
    if (settings.include_skills) headers.push('Skills');
    if (settings.include_badges) headers.push('Verified');
    
    let csvContent = headers.join(',') + '\n';
    
    (shortlist.candidates || []).forEach(candidate => {
      const row = [
        `"${candidate.name}"`,
        `"${candidate.department || ''}"`,
        `"${candidate.university || ''}"`,
        `"${candidate.cgpa || ''}"`,
        `"${candidate.year_of_passing || ''}"`
      ];
      
      if (settings.include_pii) {
        row.push(`"${candidate.email || ''}"`);
        row.push(`"${candidate.phone || ''}"`);
      }
      
      if (settings.include_scores) {
        row.push(`"${candidate.employability_score || ''}"`);
      }
      
      if (settings.include_skills) {
        row.push(`"${(candidate.skills || []).join(', ')}"`);
      }
      
      if (settings.include_badges) {
        row.push(`"${candidate.verified ? 'Yes' : 'No'}"`);
      }
      
      csvContent += row.join(',') + '\n';
    });
    
    return csvContent;
  };

  // Helper function for PDF data (placeholder)
  const generatePDFData = (shortlist: Shortlist, settings: any) => {
    // This would be replaced with actual PDF generation logic
    // For now, return a structured text representation
    let content = `SHORTLIST EXPORT - ${shortlist.name}\n`;
    content += `Generated on: ${new Date().toLocaleDateString()}\n`;
    content += `Total Candidates: ${shortlist.candidates?.length || 0}\n\n`;
    
    (shortlist.candidates || []).forEach((candidate, index) => {
      content += `Candidate ${index + 1}:\n`;
      content += `Name: ${candidate.name}\n`;
      content += `Department: ${candidate.department || 'N/A'}\n`;
      content += `University: ${candidate.university || 'N/A'}\n`;
      content += `CGPA: ${candidate.cgpa || 'N/A'}\n`;
      
      if (settings.include_pii) {
        content += `Email: ${candidate.email || 'N/A'}\n`;
        content += `Phone: ${candidate.phone || 'N/A'}\n`;
      }
      
      if (settings.include_scores) {
        content += `Employability Score: ${candidate.employability_score || 'N/A'}\n`;
      }
      
      if (settings.include_skills && candidate.skills) {
        content += `Skills: ${candidate.skills.join(', ')}\n`;
      }
      
      if (settings.include_badges) {
        content += `Verified: ${candidate.verified ? 'Yes' : 'No'}\n`;
      }
      
      content += '\n';
    });
    
    if (settings.watermark) {
      content += '\n--- Exported from RecruiterHub ---\n';
    }
    
    return content;
  };

  // Helper function to trigger file download
  const downloadFile = (content: string, filename: string, format: string) => {
    const blob = new Blob([content], { 
      type: format === 'csv' ? 'text/csv' : 'application/pdf' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    try {
      // Fetch candidates for this shortlist
      const { data: candidates, error: candidatesError } = await getShortlistCandidates(shortlist.id);
      if (candidatesError) throw candidatesError;

      // Create a shortlist object with candidates for export
      const shortlistWithCandidates = {
        ...shortlist,
        candidates: candidates || []
      };

      // Prepare export data
      const exportData = {
        shortlist_id: shortlist.id,
        shortlist_name: shortlist.name,
        export_settings: exportSettings,
        exported_at: new Date().toISOString(),
        candidates_count: candidates?.length || 0
      };

      let exportContent = '';
      let filename = `${shortlist.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;

      if (exportSettings.format === 'csv') {
        exportContent = generateCSV(shortlistWithCandidates, exportSettings);
        filename += '.csv';
      } else if (exportSettings.format === 'pdf') {
        // For PDF, we'll generate a downloadable link with the data
        exportContent = generatePDFData(shortlistWithCandidates, exportSettings);
        filename += '.pdf';
        // In a real app, you would use a PDF generation library
        // For now, we'll create a text file as a placeholder
      }

      // Create and trigger download
      downloadFile(exportContent, filename, exportSettings.format);
      
      // Log export activity
      await logExportActivity({
        shortlist_id: shortlist.id,
        export_format: exportSettings.format,
        export_type: exportSettings.type,
        include_pii: exportSettings.type === 'full_profile'
      });

      onExport(shortlist, exportSettings);
      onClose();
    } catch (error) {
      console.error('Error exporting shortlist:', error);
      alert('Failed to export shortlist. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Export Shortlist</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
              <div className="space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={exportSettings.format === 'csv'}
                    onChange={(e) => setExportSettings({...exportSettings, format: e.target.value})}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">CSV</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value="pdf"
                    checked={exportSettings.format === 'pdf'}
                    onChange={(e) => setExportSettings({...exportSettings, format: e.target.value})}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">PDF</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Export Type</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="mini_profile"
                    checked={exportSettings.type === 'mini_profile'}
                    onChange={(e) => setExportSettings({...exportSettings, type: e.target.value})}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <div className="ml-2">
                    <div className="text-sm font-medium text-gray-700">Mini-Profile</div>
                    <div className="text-xs text-gray-500">Skills, badges, evidence links—no PII unless consented</div>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="full_profile"
                    checked={exportSettings.type === 'full_profile'}
                    onChange={(e) => setExportSettings({...exportSettings, type: e.target.value})}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <div className="ml-2">
                    <div className="text-sm font-medium text-gray-700">Full Profile</div>
                    <div className="text-xs text-gray-500">Complete candidate information including contact details</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Include in Export</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportSettings.include_skills}
                    onChange={(e) => setExportSettings({...exportSettings, include_skills: e.target.checked})}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Skills & Competencies</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportSettings.include_badges}
                    onChange={(e) => setExportSettings({...exportSettings, include_badges: e.target.checked})}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Verification Badges</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportSettings.include_scores}
                    onChange={(e) => setExportSettings({...exportSettings, include_scores: e.target.checked})}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">AI Scores</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportSettings.include_evidence}
                    onChange={(e) => setExportSettings({...exportSettings, include_evidence: e.target.checked})}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Evidence Links (Projects, Hackathons)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportSettings.watermark}
                    onChange={(e) => setExportSettings({...exportSettings, watermark: e.target.checked})}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Add watermark</span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
            >
              Export {exportSettings.format.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateShortlistModal = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: ''
  });

  const handleCreate = async () => {
    try {
      const newShortlistData = {
        id: `sl_${Date.now()}`,
        name: formData.name,
        description: formData.description,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      // Insert into Supabase using service function
      const { data: newShortlist, error } = await createShortlist(newShortlistData);

      if (error) throw error;

      onCreate(newShortlist);
      setFormData({ name: '', description: '', tags: '' });
      onClose();
    } catch (error) {
      console.error('Error creating shortlist:', error);
      alert('Failed to create shortlist. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create New Shortlist</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shortlist Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="e.g., FSQM Q4 Plant Quality Interns"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Brief description of this shortlist..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="FSQM, Q4, Plant Quality"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!formData.name}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Create Shortlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ShortlistCard = ({ shortlist, onShare, onExport, onView, onEdit, onDelete }) => {
  const candidateCount = shortlist.candidate_count || 0;
  const isExpired = shortlist.share_expiry && new Date(shortlist.share_expiry) < new Date();
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{shortlist.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{shortlist.description}</p>
          <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <UserGroupIcon className="h-4 w-4 mr-1" />
              {candidateCount} candidates
            </span>
            <span className="flex items-center">
              <CalendarDaysIcon className="h-4 w-4 mr-1" />
              {new Date(shortlist.created_date).toLocaleDateString()}
            </span>
            <span>by {shortlist.created_by}</span>
          </div>
        </div>
        <StatusBadge 
          status={shortlist.status} 
          shared={shortlist.shared} 
          expiry={shortlist.share_expiry} 
        />
      </div>

      {shortlist.tags && shortlist.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {shortlist.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                <TagIcon className="h-3 w-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {shortlist.shared && shortlist.share_link && (
        <div className={`mb-4 p-3 rounded-lg ${isExpired ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <LinkIcon className={`h-4 w-4 mr-2 ${isExpired ? 'text-red-600' : 'text-green-600'}`} />
              <span className={`text-sm font-medium ${isExpired ? 'text-red-800' : 'text-green-800'}`}>
                {isExpired ? 'Share link expired' : 'Shared link active'}
              </span>
            </div>
            {!isExpired && (
              <button 
                onClick={() => navigator.clipboard.writeText(shortlist.share_link)}
                className="text-sm text-green-700 hover:text-green-800 font-medium"
              >
                Copy Link
              </button>
            )}
          </div>
          {shortlist.share_expiry && (
            <div className="flex items-center mt-1">
              <ClockIcon className="h-3 w-3 mr-1 text-gray-500" />
              <span className="text-xs text-gray-600">
                Expires: {new Date(shortlist.share_expiry).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      )}

      {candidateCount > 0 && (
        <div className="mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-800">
              {candidateCount} candidate{candidateCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => onView(shortlist)}
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View
          </button>
          <button
            onClick={() => onShare(shortlist)}
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
          >
            <ShareIcon className="h-4 w-4 mr-1" />
            Share
          </button>
          <button
            onClick={() => onExport(shortlist)}
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
            Export
          </button>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => onEdit(shortlist)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(shortlist.id)}
            className="p-1 text-gray-400 hover:text-red-600"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Shortlists = () => {
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShortlist, setSelectedShortlist] = useState<Shortlist | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Fetch shortlists from Supabase
  const fetchShortlists = async () => {
    try {
      setLoading(true);
      const { data, error } = await getShortlists();

      if (error) throw error;

      setShortlists(data || []);
    } catch (error) {
      console.error('Error fetching shortlists:', error);
      alert('Failed to load shortlists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShortlists();
  }, []);

  const handleShare = async (updatedShortlist: Shortlist) => {
    try {
      // Refresh the shortlists to get the latest data
      await fetchShortlists();
      
      // Find the updated shortlist to get the share link
      const freshShortlist = shortlists.find(sl => sl.id === updatedShortlist.id);
      
      if (freshShortlist?.share_link) {
        await navigator.clipboard.writeText(freshShortlist.share_link);
        alert('Share link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error handling share:', error);
      alert('Share link generated but failed to copy to clipboard.');
    }
  };

  const handleExport = async (shortlist: Shortlist, settings: any) => {
    try {
      // Show loading or processing state
      const processingMessage = `Preparing ${settings.format.toUpperCase()} export for "${shortlist.name}"...`;
      console.log(processingMessage);
      
      // The actual export logic is handled in the ExportModal
      // This function just logs the activity
      
      // Log the export activity using service function
      await logExportActivity({
        shortlist_id: shortlist.id,
        export_format: settings.format,
        export_type: settings.type,
        include_pii: settings.include_pii
      });
      
    } catch (error) {
      console.error('Error logging export activity:', error);
    }
  };

  const handleCreateShortlist = (newShortlist: Shortlist) => {
    setShortlists(prev => [newShortlist, ...prev]);
  };

  const handleDelete = async (shortlistId: string) => {
    if (confirm('Are you sure you want to delete this shortlist?')) {
      try {
        const { error } = await deleteShortlist(shortlistId);

        if (error) throw error;

        setShortlists(prev => prev.filter(sl => sl.id !== shortlistId));
      } catch (error) {
        console.error('Error deleting shortlist:', error);
        alert('Failed to delete shortlist. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading shortlists...</div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shortlists</h1>
          <p className="text-gray-600 mt-1">Manage and share candidate collections</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Shortlist
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Shortlists</p>
              <p className="text-2xl font-semibold text-gray-900">{shortlists.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShareIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Shared</p>
              <p className="text-2xl font-semibold text-gray-900">
                {shortlists.filter(sl => sl.shared).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-semibold text-gray-900">
                {shortlists.filter(sl => {
                  if (!sl.share_expiry) return false;
                  const daysUntilExpiry = Math.ceil((new Date(sl.share_expiry) - new Date()) / (1000 * 60 * 60 * 24));
                  return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
                }).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <DocumentDuplicateIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Candidates</p>
              <p className="text-2xl font-semibold text-gray-900">
                {shortlists.reduce((sum, sl) => sum + (sl.candidates?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Shortlists Grid */}
      {shortlists.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No shortlists yet</h3>
          <p className="text-gray-600 mb-4">Create your first shortlist to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Shortlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {shortlists.map(shortlist => (
            <ShortlistCard
              key={shortlist.id}
              shortlist={shortlist}
              onShare={(sl) => {
                setSelectedShortlist(sl);
                setShowShareModal(true);
              }}
              onExport={(sl) => {
                setSelectedShortlist(sl);
                setShowExportModal(true);
              }}
              onView={async (sl) => {
                // Fetch candidates for this shortlist
                try {
                  const { data: candidates, error } = await getShortlistCandidates(sl.id);
                  if (error) throw error;
                  alert(`Viewing shortlist: ${sl.name}\nCandidates: ${candidates?.length || 0}`);
                  // TODO: Navigate to detailed view with candidates
                } catch (error) {
                  console.error('Error fetching candidates:', error);
                  alert('Failed to load candidates');
                }
              }}
              onEdit={(sl) => {
                alert(`Edit functionality for: ${sl.name}`);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateShortlistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateShortlist}
      />

      <ShareModal
        shortlist={selectedShortlist}
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setSelectedShortlist(null);
        }}
        onShare={handleShare}
      />

      <ExportModal
        shortlist={selectedShortlist}
        isOpen={showExportModal}
        onClose={() => {
          setShowExportModal(false);
          setSelectedShortlist(null);
        }}
        onExport={handleExport}
      />
    </div>
  );
};

export default Shortlists;