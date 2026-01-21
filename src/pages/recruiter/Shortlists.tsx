import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  DocumentDuplicateIcon,
  ArrowsUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabaseClient';
import {
  getShortlists,
  getShortlistCandidates,
  createShortlist,
  updateShortlist,
  deleteShortlist,
  removeCandidateFromShortlist,
  logExportActivity,
} from '../../services/shortlistService';
import jsPDF from 'jspdf';
import SearchBar from '../../components/common/SearchBar';
import AdvancedShortlistFilters, {
  ShortlistFilters,
} from '../../components/Recruiter/components/AdvancedShortlistFilters';

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
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
    >
      {statusInfo.label}
    </span>
  );
};

const ViewCandidatesModal = ({ shortlist, candidates, isOpen, onClose }) => {
  if (!isOpen || !shortlist) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">{shortlist.name}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-500">
                  Created {new Date(shortlist.created_date).toLocaleDateString()}
                </span>
                {shortlist.created_by && (
                  <span className="text-xs text-gray-500">by {shortlist.created_by}</span>
                )}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    shortlist.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {shortlist.status || 'active'}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {shortlist.description && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{shortlist.description}</p>
            </div>
          )}

          {/* Tags */}
          {shortlist.tags && shortlist.tags.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {shortlist.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    <TagIcon className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sharing Status */}
          {shortlist.shared && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <ShareIcon className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">This shortlist is shared</span>
              </div>
              {shortlist.share_expiry && (
                <p className="text-xs text-green-600 mt-1">
                  Expires: {new Date(shortlist.share_expiry).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          <div className="mb-4 border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Candidates ({candidates?.length || 0})
            </h4>
          </div>

          {/* Candidates List */}
          {candidates && candidates.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      University
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CGPA
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {candidates.map((candidate, index) => (
                    <tr key={candidate.id || index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            {candidate.photo ? (
                              <img className="h-8 w-8 rounded-full" src={candidate.photo} alt="" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">
                                  {candidate.name?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {candidate.name}
                            </div>
                            {candidate.email && (
                              <div className="text-xs text-gray-500">{candidate.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {candidate.department || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {candidate.university || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {candidate.cgpa || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {candidate.employability_score ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {candidate.employability_score}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {candidate.verified ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <span className="text-xs text-gray-400">Unverified</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <UserGroupIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No candidates in this shortlist yet</p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ShareModal = ({ shortlist, isOpen, onClose, onShare }) => {
  const [shareSettings, setShareSettings] = useState({
    expiry_days: 30,
    watermark: true,
    include_pii: false,
    notify_on_access: true,
  });
  const [shareLink, setShareLink] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateLinkIfNeeded = async () => {
    if (shareLink) return shareLink;

    try {
      setIsGenerating(true);
      const shareToken = Math.random().toString(36).substr(2, 9);
      const generatedLink = `https://recruiterhub.com/shared/${shortlist.id}?token=${shareToken}`;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + shareSettings.expiry_days);

      // Update the shortlist in Supabase using the service function
      const { error } = await updateShortlist(shortlist.id, {
        shared: true,
        share_link: generatedLink,
        share_expiry: expiryDate.toISOString(),
        watermark: shareSettings.watermark,
        include_pii: shareSettings.include_pii,
        notify_on_access: shareSettings.notify_on_access,
      });

      if (error) throw error;

      // Call the onShare callback with updated data
      onShare({
        ...shortlist,
        shared: true,
        share_link: generatedLink,
        share_expiry: expiryDate.toISOString(),
        watermark: shareSettings.watermark,
        include_pii: shareSettings.include_pii,
        notify_on_access: shareSettings.notify_on_access,
      });

      setShareLink(generatedLink);
      return generatedLink;
    } catch (error) {
      console.error('Error sharing shortlist:', error);
      alert('Failed to generate share link. Please try again.');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    const link = await generateLinkIfNeeded();
    if (!link) return;

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
        alert('Link copied to clipboard!');
      } else {
        // Fallback method for non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
          textArea.remove();
          alert('Link copied to clipboard!');
        } catch (err) {
          console.error('Fallback copy failed:', err);
          textArea.remove();
          // Show the link for manual copying
          prompt('Copy this link manually:', link);
        }
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Last resort - show prompt for manual copy
      prompt('Copy this link manually:', link);
    }
  };

  const handleShareTelegram = async () => {
    const link = await generateLinkIfNeeded();
    if (!link) return;

    const text = `Check out this shortlist: ${shortlist.name}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareWhatsApp = async () => {
    const link = await generateLinkIfNeeded();
    if (!link) return;

    const text = `Check out this shortlist: ${shortlist.name}\n${link}`;
    // Check if on mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const url = isMobile
      ? `whatsapp://send?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = async () => {
    const link = await generateLinkIfNeeded();
    if (!link) return;

    const subject = `Shortlist: ${shortlist.name}`;
    const body = `Hi,\n\nI'd like to share this shortlist with you: ${shortlist.name}\n\nAccess it here: ${link}\n\nBest regards`;
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Share Shortlist</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4">
            <h4 className="font-medium text-gray-900">{shortlist.name}</h4>
            <p className="text-sm text-gray-500">{shortlist.candidate_count || 0} candidates</p>
          </div>

          {/* Share Options */}
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Share via:</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Copy Link Button */}
              <button
                onClick={handleCopyLink}
                disabled={isGenerating}
                className="flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <svg
                    className="animate-spin h-4 w-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <LinkIcon className="h-4 w-4 mr-2" />
                )}
                Copy Link
              </button>

              {/* Email Button */}
              <button
                onClick={handleShareEmail}
                disabled={isGenerating}
                className="flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <svg
                    className="animate-spin h-4 w-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                )}
                Email
              </button>

              {/* WhatsApp Button */}
              <button
                onClick={handleShareWhatsApp}
                disabled={isGenerating}
                className="flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <svg
                    className="animate-spin h-4 w-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                )}
                WhatsApp
              </button>

              {/* Telegram Button */}
              <button
                onClick={handleShareTelegram}
                disabled={isGenerating}
                className="flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <svg
                    className="animate-spin h-4 w-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.154.232.17.326.016.093.036.305.02.47z" />
                  </svg>
                )}
                Telegram
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {isGenerating ? 'Processing...' : 'Cancel'}
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
    watermark: true,
  });

  // Helper function to generate CSV content
  const generateCSV = (shortlist: Shortlist, settings: any) => {
    // Determine what to include based on export type
    const isFullProfile = settings.type === 'full_profile';

    // Build headers based on export type
    const headers = ['Name', 'Department', 'University', 'CGPA', 'Year of Passing'];

    if (isFullProfile) {
      headers.push('Email', 'Phone');
    }

    headers.push('Employability Score', 'Verified');

    let csvContent = headers.join(',') + '\n';

    (shortlist.candidates || []).forEach((candidate) => {
      const row = [
        `"${candidate.name || 'N/A'}"`,
        `"${candidate.department || 'N/A'}"`,
        `"${candidate.university || 'N/A'}"`,
        `"${candidate.cgpa || 'N/A'}"`,
        `"${candidate.year_of_passing || 'N/A'}"`,
      ];

      if (isFullProfile) {
        row.push(`"${candidate.email || 'N/A'}"`);
        row.push(`"${candidate.phone || 'N/A'}"`);
      }

      row.push(`"${candidate.employability_score || 'N/A'}"`);
      row.push(`"${candidate.verified ? 'Yes' : 'No'}"`);

      csvContent += row.join(',') + '\n';
    });

    return csvContent;
  };

  // Helper function for PDF generation using jsPDF
  const generatePDF = async (shortlist: Shortlist, settings: any) => {
    const isFullProfile = settings.type === 'full_profile';
    const doc = new jsPDF();

    // Set font
    doc.setFont('helvetica');

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Add watermark logos if enabled
    if (settings.watermark) {
      try {
        // Load and add RareMinds logo at top-left
        const rareMindsLogo = new Image();
        rareMindsLogo.crossOrigin = 'anonymous';
        rareMindsLogo.src = '/RareMinds.webp';
        await new Promise((resolve, reject) => {
          rareMindsLogo.onload = resolve;
          rareMindsLogo.onerror = reject;
        });

        // Convert to canvas with transparency
        const canvas1 = document.createElement('canvas');
        const ctx1 = canvas1.getContext('2d');
        canvas1.width = rareMindsLogo.width;
        canvas1.height = rareMindsLogo.height;
        ctx1.drawImage(rareMindsLogo, 0, 0);
        const rareMindsData = canvas1.toDataURL('image/png');

        const topLeftWidth = 50;
        const topLeftHeight = (rareMindsLogo.height / rareMindsLogo.width) * topLeftWidth;
        doc.addImage(rareMindsData, 'PNG', 14, 10, topLeftWidth, topLeftHeight, undefined, 'FAST');

        // Load and add RMLogo at center
        const rmLogo = new Image();
        rmLogo.crossOrigin = 'anonymous';
        rmLogo.src = '/RMLogo.webp';
        await new Promise((resolve, reject) => {
          rmLogo.onload = resolve;
          rmLogo.onerror = reject;
        });

        // Convert to canvas with transparency
        const canvas2 = document.createElement('canvas');
        const ctx2 = canvas2.getContext('2d');
        canvas2.width = rmLogo.width;
        canvas2.height = rmLogo.height;
        ctx2.drawImage(rmLogo, 0, 0);
        const rmLogoData = canvas2.toDataURL('image/png');

        const centerWidth = 80;
        const centerHeight = (rmLogo.height / rmLogo.width) * centerWidth;
        const centerX = (pageWidth - centerWidth) / 2;
        const centerY = (pageHeight - centerHeight) / 2;

        doc.addImage(
          rmLogoData,
          'PNG',
          centerX,
          centerY,
          centerWidth,
          centerHeight,
          undefined,
          'FAST'
        );
      } catch (error) {
        console.error('Failed to load watermark images:', error);
        // Fallback to text watermark if images fail
        doc.setFontSize(40);
        doc.setTextColor(200, 200, 200);
        doc.text('RecruiterHub', 105, 150, { angle: 45, align: 'center' });
        doc.setTextColor(0, 0, 0);
      }
    }

    // Title (on next line after logo)
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(`EXPORT - ${shortlist.name}`, 14, 30);

    // Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 40);
    doc.text(`Total Candidates: ${shortlist.candidates?.length || 0}`, 14, 46);
    doc.text(`Export Type: ${isFullProfile ? 'Full Profile' : 'Mini-Profile'}`, 14, 52);

    let yPos = 62;
    const lineHeight = 6;

    // Candidates
    doc.setFontSize(10);
    (shortlist.candidates || []).forEach((candidate, index) => {
      // Check if we need a new page
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }

      // Candidate header
      doc.setFont('helvetica', 'bold');
      doc.text(`Candidate ${index + 1}:`, 14, yPos);
      yPos += lineHeight;

      // Candidate details
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${candidate.name || 'N/A'}`, 20, yPos);
      yPos += lineHeight;
      doc.text(`Department: ${candidate.department || 'N/A'}`, 20, yPos);
      yPos += lineHeight;
      doc.text(`University: ${candidate.university || 'N/A'}`, 20, yPos);
      yPos += lineHeight;
      doc.text(`CGPA: ${candidate.cgpa || 'N/A'}`, 20, yPos);
      yPos += lineHeight;
      doc.text(`Year of Passing: ${candidate.year_of_passing || 'N/A'}`, 20, yPos);
      yPos += lineHeight;

      if (isFullProfile) {
        doc.text(`Email: ${candidate.email || 'N/A'}`, 20, yPos);
        yPos += lineHeight;
        doc.text(`Phone: ${candidate.phone || 'N/A'}`, 20, yPos);
        yPos += lineHeight;
      }

      doc.text(`Employability Score: ${candidate.employability_score || 'N/A'}`, 20, yPos);
      yPos += lineHeight;
      doc.text(`Verified: ${candidate.verified ? 'Yes' : 'No'}`, 20, yPos);
      yPos += lineHeight + 3;
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('--- Exported from RecruiterHub ---', 105, pageHeight - 10, { align: 'center' });
      doc.text(`Page ${i} of ${pageCount}`, 105, pageHeight - 5, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    }

    return doc;
  };

  // Helper function to trigger file download
  const downloadFile = (content: string, filename: string, format: string) => {
    const blob = new Blob([content], {
      type: format === 'csv' ? 'text/csv' : 'application/pdf',
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

      const { data: candidates, error: candidatesError } = await getShortlistCandidates(
        shortlist.id
      );
      if (candidatesError) {
        console.error('Error fetching candidates:', candidatesError);
        throw candidatesError;
      }

      // Check if there are no candidates
      if (!candidates || candidates.length === 0) {
        alert('No candidates found in this shortlist. Please add candidates before exporting.');
        return;
      }

      // Create a shortlist object with candidates for export
      const shortlistWithCandidates = {
        ...shortlist,
        candidates: candidates || [],
      };

      // Prepare export data
      const exportData = {
        shortlist_id: shortlist.id,
        shortlist_name: shortlist.name,
        export_settings: exportSettings,
        exported_at: new Date().toISOString(),
        candidates_count: candidates?.length || 0,
      };

      let exportContent = '';
      let filename = `${shortlist.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;

      if (exportSettings.format === 'csv') {
        exportContent = generateCSV(shortlistWithCandidates, exportSettings);
        filename += '.csv';
        // Create and trigger download
        downloadFile(exportContent, filename, exportSettings.format);
      } else if (exportSettings.format === 'pdf') {
        // Generate PDF using jsPDF
        const pdfDoc = await generatePDF(shortlistWithCandidates, exportSettings);
        filename += '.pdf';
        // Save the PDF
        pdfDoc.save(filename);
      }

      // Log export activity
      await logExportActivity({
        shortlist_id: shortlist.id,
        export_format: exportSettings.format,
        export_type: exportSettings.type,
        include_pii: exportSettings.type === 'full_profile',
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
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

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
                    onChange={(e) =>
                      setExportSettings({ ...exportSettings, format: e.target.value })
                    }
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
                    onChange={(e) =>
                      setExportSettings({ ...exportSettings, format: e.target.value })
                    }
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
                    onChange={(e) => setExportSettings({ ...exportSettings, type: e.target.value })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <div className="ml-2">
                    <div className="text-sm font-medium text-gray-700">Mini-Profile</div>
                    <div className="text-xs text-gray-500">
                      Skills, badges, evidence links—no PII unless consented
                    </div>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="full_profile"
                    checked={exportSettings.type === 'full_profile'}
                    onChange={(e) => setExportSettings({ ...exportSettings, type: e.target.value })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <div className="ml-2">
                    <div className="text-sm font-medium text-gray-700">Full Profile</div>
                    <div className="text-xs text-gray-500">
                      Complete candidate information including contact details
                    </div>
                  </div>
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

const EditShortlistModal = ({ shortlist, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: '',
  });

  // Initialize form data when modal opens or shortlist changes
  useEffect(() => {
    if (shortlist && isOpen) {
      setFormData({
        name: shortlist.name || '',
        description: shortlist.description || '',
        tags: Array.isArray(shortlist.tags) ? shortlist.tags.join(', ') : '',
      });
    }
  }, [shortlist, isOpen]);

  const handleUpdate = async () => {
    try {
      const updatedData = {
        name: formData.name,
        description: formData.description,
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      };

      // Update in Supabase using service function
      const { data: updatedShortlist, error } = await updateShortlist(shortlist.id, updatedData);

      if (error) throw error;

      onUpdate(updatedShortlist);
      onClose();
    } catch (error) {
      console.error('Error updating shortlist:', error);
      alert('Failed to update shortlist. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Edit Shortlist</h3>
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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="e.g., FSQM Q4 Plant Quality Interns"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Brief description of this shortlist..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
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
              onClick={handleUpdate}
              disabled={!formData.name}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Update Shortlist
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
    tags: '',
  });

  const handleCreate = async () => {
    try {
      const newShortlistData = {
        id: `sl_${Date.now()}`,
        name: formData.name,
        description: formData.description,
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag),
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
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="e.g., FSQM Q4 Plant Quality Interns"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Brief description of this shortlist..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
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
        <div
          className={`mb-4 p-3 rounded-lg ${isExpired ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <LinkIcon
                className={`h-4 w-4 mr-2 ${isExpired ? 'text-red-600' : 'text-green-600'}`}
              />
              <span
                className={`text-sm font-medium ${isExpired ? 'text-red-800' : 'text-green-800'}`}
              >
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
  const navigate = useNavigate();
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShortlist, setSelectedShortlist] = useState<Shortlist | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<ShortlistCandidate[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Advanced Filters
  const [advancedFilters, setAdvancedFilters] = useState<ShortlistFilters>({
    dateRange: {},
    status: [],
    shared: 'all',
    tags: [],
    createdBy: [],
    candidateCountRange: 'all',
  });

  type ShortlistSortField = 'created_date' | 'name' | 'candidate_count' | 'shared' | 'share_expiry';
  const [sortField, setSortField] = useState<ShortlistSortField>('created_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Fetch shortlists from Supabase with SQL-optimized filters
  const fetchShortlists = async () => {
    try {
      setLoading(true);

      const buildQuery = (from: 'shortlists_with_counts' | 'shortlists') => {
        const baseSelect = from === 'shortlists' ? '*, shortlist_candidates(count)' : '*';
        let query = supabase.from(from).select(baseSelect as any);

        // Search (server-side for name/description/creator)
        if (searchQuery) {
          const q = searchQuery.trim();
          query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,created_by.ilike.%${q}%`);
        }

        // Status filter
        if (advancedFilters.status.length > 0) {
          query = query.in('status', advancedFilters.status);
        }

        // Sharing filter
        if (advancedFilters.shared === 'shared') {
          query = query.eq('shared', true);
        } else if (advancedFilters.shared === 'private') {
          query = query.eq('shared', false);
        }

        // Tags (match any)
        if (advancedFilters.tags.length > 0) {
          // overlaps (ov) operator
          // @ts-ignore - overlaps is supported by postgrest-js
          query = (query as any).overlaps('tags', advancedFilters.tags);
        }

        // Created By
        if (advancedFilters.createdBy.length > 0) {
          query = query.in('created_by', advancedFilters.createdBy);
        }

        // Date range
        if (advancedFilters.dateRange.startDate) {
          query = query.gte('created_date', advancedFilters.dateRange.startDate);
        }
        if (advancedFilters.dateRange.endDate) {
          query = query.lte('created_date', advancedFilters.dateRange.endDate);
        }

        // Candidate count range (only available on view)
        if (from === 'shortlists_with_counts' && advancedFilters.candidateCountRange !== 'all') {
          const map: Record<string, { min: number; max: number | null }> = {
            '0': { min: 0, max: 0 },
            '1-5': { min: 1, max: 5 },
            '6-20': { min: 6, max: 20 },
            '21-50': { min: 21, max: 50 },
            '50+': { min: 51, max: null },
            all: { min: 0, max: null },
          };
          const r = map[advancedFilters.candidateCountRange];
          if (r) {
            // @ts-ignore candidate_count exists on the view
            query = query.gte('candidate_count', r.min);
            if (r.max !== null) {
              // @ts-ignore
              query = query.lte('candidate_count', r.max);
            }
          }
        }

        // Ordering
        const asc = sortDirection === 'asc';
        if (sortField === 'candidate_count') {
          // Only order in SQL if view is used (field exists)
          if (from === 'shortlists_with_counts') {
            // @ts-ignore
            query = query.order('candidate_count', { ascending: asc });
          }
        } else if (sortField === 'share_expiry') {
          // Handle nulls last when sorting by expiry
          // @ts-ignore
          query = query.order('share_expiry', { ascending: asc, nullsFirst: !asc });
        } else {
          query = query.order(sortField, { ascending: asc });
        }
        return query;
      };

      // Try the optimized view first, fall back to base table if not available
      let usingView = true;
      let { data, error } = await buildQuery('shortlists_with_counts');
      if (error) {
        usingView = false;
        ({ data, error } = await buildQuery('shortlists'));
      }
      if (error) throw error;

      const rows = (data as any[]) || [];
      const formatted = rows.map((item) => ({
        ...item,
        candidate_count: item.candidate_count ?? item.shortlist_candidates?.[0]?.count ?? 0,
      }));

      // If ordering by candidate_count and we couldn't use view, sort on client
      if (!usingView && sortField === 'candidate_count') {
        formatted.sort((a: any, b: any) => {
          const diff = (a.candidate_count || 0) - (b.candidate_count || 0);
          return sortDirection === 'asc' ? diff : -diff;
        });
      }

      setShortlists(formatted);
    } catch (error) {
      console.error('Error fetching shortlists:', error);
      alert('Failed to load shortlists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShortlists();
  }, [searchQuery, advancedFilters, sortField, sortDirection]);

  const handleShare = async (updatedShortlist: Shortlist) => {
    try {
      // Refresh the shortlists to get the latest data
      await fetchShortlists();

      // Find the updated shortlist to get the share link
      const freshShortlist = shortlists.find((sl) => sl.id === updatedShortlist.id);

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

      // The actual export logic is handled in the ExportModal
      // This function just logs the activity

      // Log the export activity using service function
      await logExportActivity({
        shortlist_id: shortlist.id,
        export_format: settings.format,
        export_type: settings.type,
        include_pii: settings.include_pii,
      });
    } catch (error) {
      console.error('Error logging export activity:', error);
    }
  };

  const handleCreateShortlist = (newShortlist: Shortlist) => {
    setShortlists((prev) => [newShortlist, ...prev]);
  };

  const handleUpdateShortlist = (updatedShortlist: Shortlist) => {
    setShortlists((prev) =>
      prev.map((sl) => (sl.id === updatedShortlist.id ? { ...sl, ...updatedShortlist } : sl))
    );
  };

  const handleDelete = async (shortlistId: string) => {
    if (confirm('Are you sure you want to delete this shortlist?')) {
      try {
        const { error } = await deleteShortlist(shortlistId);

        if (error) throw error;

        setShortlists((prev) => prev.filter((sl) => sl.id !== shortlistId));
      } catch (error) {
        console.error('Error deleting shortlist:', error);
        alert('Failed to delete shortlist. Please try again.');
      }
    }
  };

  // Filter shortlists based on search query
  const filteredShortlists = shortlists.filter((shortlist) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      shortlist.name?.toLowerCase().includes(query) ||
      shortlist.description?.toLowerCase().includes(query) ||
      shortlist.created_by?.toLowerCase().includes(query) ||
      shortlist.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading shortlists...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      {/* Header - responsive layout */}
      <div className="mb-6">
        {/* Desktop: single row with left text, centered search, right buttons */}
        <div className="hidden lg:flex items-center bg-white border border-gray-200 rounded-lg p-4">
          {/* Left: title and subtitle (fixed width) */}
          <div className="w-80 flex-shrink-0 pr-4 text-left">
            <h1 className="text-xl font-semibold text-gray-900">Shortlists</h1>
            <p className="text-sm text-gray-600 mt-0.5">Manage and share candidate collections</p>
          </div>

          {/* Middle: centered search */}
          <div className="flex-1 px-4 flex items-center gap-3">
            <div className="max-w-xl flex-1">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search shortlists by name, description, or creator..."
                size="md"
              />
            </div>
            <AdvancedShortlistFilters
              filters={advancedFilters}
              onFiltersChange={setAdvancedFilters}
              onReset={() =>
                setAdvancedFilters({
                  dateRange: {},
                  status: [],
                  shared: 'all',
                  tags: [],
                  createdBy: [],
                  candidateCountRange: 'all',
                })
              }
              onApply={fetchShortlists}
            />
            {/* Sorting Dropdown */}
            <div className="relative">
              <select
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-');
                  setSortField(field as any);
                  setSortDirection(direction as 'asc' | 'desc');
                }}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white text-sm"
              >
                <optgroup label="Date">
                  <option value="created_date-desc">Newest First</option>
                  <option value="created_date-asc">Oldest First</option>
                </optgroup>
                <optgroup label="Alphabetical">
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                </optgroup>
                <optgroup label="Candidates">
                  <option value="candidate_count-desc">Most Candidates</option>
                  <option value="candidate_count-asc">Fewest Candidates</option>
                </optgroup>
                <optgroup label="Sharing">
                  <option value="shared-desc">Shared First</option>
                  <option value="shared-asc">Private First</option>
                </optgroup>
                <optgroup label="Expiry">
                  <option value="share_expiry-asc">Expiring Soon</option>
                  <option value="share_expiry-desc">Expiring Last</option>
                </optgroup>
              </select>
              <ArrowsUpDownIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex-shrink-0 pl-4 flex items-center justify-end space-x-3">
            <button
              onClick={() => navigate('/recruitment/talent-pool')}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Candidates
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Shortlist
            </button>
          </div>
        </div>

        {/* Mobile/Tablet: stacked layout */}
        <div className="lg:hidden space-y-4">
          {/* Title and subtitle */}
          <div className="text-left">
            <h1 className="text-xl font-semibold text-gray-900">Shortlists</h1>
            <p className="text-sm text-gray-600 mt-0.5">Manage and share candidate collections</p>
          </div>

          {/* Search + Advanced Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search shortlists..."
              size="md"
            />
            <AdvancedShortlistFilters
              filters={advancedFilters}
              onFiltersChange={setAdvancedFilters}
              onReset={() =>
                setAdvancedFilters({
                  dateRange: {},
                  status: [],
                  shared: 'all',
                  tags: [],
                  createdBy: [],
                  candidateCountRange: 'all',
                })
              }
              onApply={fetchShortlists}
            />
            <div className="relative">
              <select
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-');
                  setSortField(field as any);
                  setSortDirection(direction as 'asc' | 'desc');
                }}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white text-sm"
              >
                <optgroup label="Date">
                  <option value="created_date-desc">Newest First</option>
                  <option value="created_date-asc">Oldest First</option>
                </optgroup>
                <optgroup label="Alphabetical">
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                </optgroup>
                <optgroup label="Candidates">
                  <option value="candidate_count-desc">Most Candidates</option>
                  <option value="candidate_count-asc">Fewest Candidates</option>
                </optgroup>
                <optgroup label="Sharing">
                  <option value="shared-desc">Shared First</option>
                  <option value="shared-asc">Private First</option>
                </optgroup>
                <optgroup label="Expiry">
                  <option value="share_expiry-asc">Expiring Soon</option>
                  <option value="share_expiry-desc">Expiring Last</option>
                </optgroup>
              </select>
              <ArrowsUpDownIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/recruitment/talent-pool')}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Candidates
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Shortlist
            </button>
          </div>
        </div>
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
              <p className="text-2xl font-semibold text-gray-900">
                {filteredShortlists.length}
                {searchQuery && (
                  <span className="text-sm text-gray-500"> of {shortlists.length}</span>
                )}
              </p>
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
                {shortlists.filter((sl) => sl.shared).length}
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
                {
                  shortlists.filter((sl) => {
                    if (!sl.share_expiry) return false;
                    const daysUntilExpiry = Math.ceil(
                      // @ts-expect-error - Auto-suppressed for migration
                      (new Date(sl.share_expiry) - new Date()) / (1000 * 60 * 60 * 24)
                    );
                    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
                  }).length
                }
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
                {shortlists.reduce((sum, sl) => sum + (sl.candidate_count || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Shortlists Grid */}
      {filteredShortlists.length === 0 ? (
        searchQuery ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No shortlists found</h3>
            <p className="text-gray-600 mb-4">No shortlists match your search "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
            >
              Clear search
            </button>
          </div>
        ) : shortlists.length === 0 ? (
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
        ) : null
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredShortlists.map((shortlist) => (
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

                  if (error) {
                    console.error('Database error:', error);
                    const errorMsg =
                      typeof error === 'object' && error !== null && 'message' in error
                        ? (error as { message: string }).message
                        : String(error);

                    alert(
                      `Failed to load candidates: ${errorMsg}\n\nPlease check:\n1. Database tables exist\n2. RLS policies are configured\n3. Foreign keys are set up correctly`
                    );
                    return;
                  }

                  // Open modal even if there are no candidates (empty state handled in modal)
                  setSelectedShortlist(sl);
                  setSelectedCandidates(candidates || []);
                  setShowViewModal(true);
                } catch (error) {
                  console.error('Error fetching candidates:', error);
                  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                  alert(`Failed to load candidates: ${errorMessage}`);
                }
              }}
              onEdit={(sl) => {
                setSelectedShortlist(sl);
                setShowEditModal(true);
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

      <ViewCandidatesModal
        shortlist={selectedShortlist}
        candidates={selectedCandidates}
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedShortlist(null);
          setSelectedCandidates([]);
        }}
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

      <EditShortlistModal
        shortlist={selectedShortlist}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedShortlist(null);
        }}
        onUpdate={handleUpdateShortlist}
      />
    </div>
  );
};

export default Shortlists;
