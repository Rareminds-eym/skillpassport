import { useState, useEffect } from 'react';
import {
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentArrowDownIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  DevicePhoneMobileIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  LinkIcon,
  ArrowUpIcon,
  XCircleIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import { apiPost } from '@/shared/api/apiClient';
import { ExternalLinkIcon, File } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { isCollegeLearner, isSchoolLearner } from '@/entities/learner/lib/learnerType';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learner-profile-drawer');

const Badge = ({ type }: { type: string }) => {
  const badgeConfig = {
    pending: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      label: 'Pending',
      icon: '⏳'
    },
    approved: {
      color: 'bg-green-100 text-green-800 border-green-300',
      label: 'Approved',
      icon: '✓'
    },
    rejected: {
      color: 'bg-red-100 text-red-800 border-red-300',
      label: 'Rejected',
      icon: '✕'
    },
    waitlisted: {
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      label: 'Waitlisted',
      icon: '⏸'
    }
  };

  const config = badgeConfig[type as keyof typeof badgeConfig] || badgeConfig.pending;

  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${config.color}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    verified: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Verified', icon: '✓' },
    approved: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Approved', icon: '✓' },
    pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Pending', icon: '⏳' },
    rejected: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Rejected', icon: '✕' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
};

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-4 text-sm font-medium border-b-2 ${active
      ? 'border-primary-500 text-primary-600'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
  >
    {children}
  </button>
);

const AdmissionNoteModal = ({ isOpen, onClose, learner, onSuccess }) => {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!note.trim()) return;

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      onSuccess?.();
      setNote('');
      onClose();
    } catch (error) {
      logger.error('Save note failed', error instanceof Error ? error : new Error(String(error)), { learnerId: learner?.id });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add Admission Note</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Learner: {learner.name}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={6}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter admission feedback, assessment notes, or recommendations..."
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !note.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MessageModal = ({ isOpen, onClose, learner }) => {
  if (!isOpen) return null;

  const handleWhatsApp = () => {
    const phone = learner.contact_number?.replace(/[^0-9]/g, '') || '';
    const message = encodeURIComponent(`Hi ${learner.name}, I wanted to reach out regarding your admission application...`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    onClose();
  };

  const handleSMS = () => {
    const phone = learner.contact_number?.replace(/[^0-9]/g, '') || '';
    window.location.href = `sms:${phone}`;
    onClose();
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('Your Admission Application Update');
    const body = encodeURIComponent(`Dear ${learner.name},\n\nI wanted to reach out regarding your admission application.\n\nBest regards`);
    window.location.href = `mailto:${learner.email}?subject=${subject}&body=${body}`;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Contact {learner.name}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-green-50 hover:border-green-300 transition-colors"
            >
              <svg className="h-5 w-5 mr-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              WhatsApp
            </button>

            <button
              onClick={handleSMS}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <DevicePhoneMobileIcon className="h-5 w-5 mr-3 text-blue-600" />
              SMS / Message
            </button>

            <button
              onClick={handleEmail}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-red-50 hover:border-red-300 transition-colors"
            >
              <EnvelopeIcon className="h-5 w-5 mr-3 text-red-600" />
              Email
            </button>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center">
                <PhoneIcon className="h-3 w-3 mr-1" />
                <span>{learner.contact_number || 'Not available'}</span>
              </div>
              <div className="flex items-center">
                <EnvelopeIcon className="h-3 w-3 mr-1" />
                <span>{learner.email || 'Not available'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExportModal = ({ isOpen, onClose, learner }) => {
  const [exportSettings, setExportSettings] = useState({
    format: 'pdf',
    type: 'application_summary'
  });

  const generatePDF = (learner, settings) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    const lineHeight = 6;
    let yPos = 20;

    const checkNewPage = () => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
    };

    doc.setFont('helvetica');

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`ADMISSION APPLICATION - ${learner.name}`, margin, yPos);
    yPos += 10;

    // Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Application ID: ${learner.id}`, margin, yPos);
    yPos += lineHeight + 3;

    // Personal Information
    checkNewPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('PERSONAL INFORMATION', margin, yPos);
    yPos += lineHeight + 2;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const personalFields = [
      { label: 'Full Name', value: learner.name },
      { label: 'Email', value: learner.email },
      { label: 'Contact Number', value: learner.contact_number },
      { label: 'Date of Birth', value: learner.date_of_birth ? new Date(learner.date_of_birth).toLocaleDateString() : 'N/A' },
    ];

    personalFields.forEach(field => {
      if (field.value) {
        checkNewPage();
        doc.text(`${field.label}: ${field.value}`, margin + 5, yPos);
        yPos += lineHeight;
      }
    });
    yPos += 3;

    // Academic Information
    checkNewPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ACADEMIC INFORMATION', margin, yPos);
    yPos += lineHeight + 2;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const academicFields = [
      { label: 'Applied Class', value: learner.class },
      { label: 'Subjects', value: learner.subjects ? learner.subjects.join(', ') : 'N/A' },
      { label: 'Entrance Score', value: learner.score },
      { label: 'Application Status', value: learner.admission_status?.toUpperCase() },
      { label: 'Applied Date', value: learner.applied_date ? new Date(learner.applied_date).toLocaleDateString() : 'N/A' },
    ];

    academicFields.forEach(field => {
      if (field.value) {
        checkNewPage();
        doc.text(`${field.label}: ${field.value}`, margin + 5, yPos);
        yPos += lineHeight;
      }
    });
    yPos += 3;

    // Footer on all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('--- Exported from School Admission System ---', pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    }

    return doc;
  };

  const generateCSV = (learner) => {
    const headers = [
      'Name',
      'Email',
      'Contact Number',
      'Date of Birth',
      'Applied Class',
      'Subjects',
      'Entrance Score',
      'Admission Status',
      'Applied Date'
    ];

    const escapeCSV = (value) => {
      if (value === null || value === undefined || value === '') return '""';
      const str = String(value);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const row = [
      escapeCSV(learner.name),
      escapeCSV(learner.email),
      escapeCSV(learner.contact_number),
      escapeCSV(learner.date_of_birth ? new Date(learner.date_of_birth).toLocaleDateString() : ''),
      escapeCSV(learner.class),
      escapeCSV(learner.subjects ? learner.subjects.join('; ') : ''),
      escapeCSV(learner.score),
      escapeCSV(learner.admission_status),
      escapeCSV(learner.applied_date ? new Date(learner.applied_date).toLocaleDateString() : '')
    ];

    const csvContent = headers.join(',') + '\n' + row.join(',') + '\n';
    return csvContent;
  };

  const downloadFile = (content, filename, format) => {
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

  const handleExport = () => {
    const filename = `${learner.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;

    if (exportSettings.format === 'csv') {
      const content = generateCSV(learner);
      downloadFile(content, filename + '.csv', 'csv');
    } else {
      const pdfDoc = generatePDF(learner, exportSettings);
      pdfDoc.save(filename + '.pdf');
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Export Application</h3>
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
                    onChange={(e) => setExportSettings({ ...exportSettings, format: e.target.value })}
                    className="h-4 w-4 text-primary-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">CSV</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value="pdf"
                    checked={exportSettings.format === 'pdf'}
                    onChange={(e) => setExportSettings({ ...exportSettings, format: e.target.value })}
                    className="h-4 w-4 text-primary-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">PDF</span>
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
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectCard = ({ project }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900">{project.title || 'Untitled Project'}</h4>
          {project.organization && (
            <p className="text-xs text-gray-600 mt-1">Organization: {project.organization}</p>
          )}
        </div>
        {project.status && <StatusBadge status={project.approval_status || project.status} />}
      </div>

      {project.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{project.description}</p>
      )}

      {project.tech_stack && project.tech_stack.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {project.tech_stack.slice(0, 3).map((tech, idx) => (
            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
              {tech}
            </span>
          ))}
          {project.tech_stack.length > 3 && (
            <span className="text-xs text-gray-500">+{project.tech_stack.length - 3} more</span>
          )}
        </div>
      )}

      <div className="flex gap-2 text-xs">
        {project.demo_link && (
          <a
            href={project.demo_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 hover:text-blue-700"
          >
            <ExternalLinkIcon className="h-3 w-3 mr-1" />
            Demo
          </a>
        )}
        {project.github_link && (
          <a
            href={project.github_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-gray-600 hover:text-gray-700"
          >
            <LinkIcon className="h-3 w-3 mr-1" />
            GitHub
          </a>
        )}
      </div>

      {project.start_date && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
          {new Date(project.start_date).toLocaleDateString()}
          {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString()}`}
        </div>
      )}
    </div>
  );
};

const CertificateCard = ({ certificate }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheckIcon className="h-4 w-4 text-yellow-600" />
            <h4 className="text-sm font-semibold text-gray-900">{certificate.title || 'Untitled Certificate'}</h4>
          </div>
          {certificate.issuer && (
            <p className="text-xs text-gray-600">Issued by: {certificate.issuer}</p>
          )}
        </div>
        {certificate.approval_status && <StatusBadge status={certificate.approval_status} />}
      </div>

      <div className="flex items-center justify-between mt-3 text-xs">
        <div className="flex gap-4">
          {certificate.level && (
            <span className="text-gray-600">Level: <span className="font-medium">{certificate.level}</span></span>
          )}
          {certificate.issued_on && (
            <span className="text-gray-600">Issued: <span className="font-medium">{new Date(certificate.issued_on).toLocaleDateString()}</span></span>
          )}
        </div>
        {certificate.credential_id && (
          <span className="text-blue-600 font-mono text-xs truncate max-w-[150px]" title={certificate.credential_id}>
            ID: {certificate.credential_id}
          </span>
        )}
      </div>

      {certificate.link && (
        <a
          href={certificate.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center text-blue-600 hover:text-blue-700 text-xs"
        >
          <ExternalLinkIcon className="h-3 w-3 mr-1" />
          View Certificate
        </a>
      )}

      {certificate.description && (
        <p className="text-xs text-gray-600 mt-2 line-clamp-1">{certificate.description}</p>
      )}
    </div>
  );
};

// Approval/Rejection Modal
const ApprovalModal = ({ isOpen, onClose, learner, onApprove, onReject, loading }) => {
  const [reason, setReason] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  const handleSubmit = () => {
    if (action === 'approve') {
      onApprove('approve', reason);
    } else if (action === 'reject') {
      onReject('reject', reason);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Learner Verification</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Review and verify the enrollment status for <strong>{learner.name}</strong>
              </p>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="approve"
                    checked={action === 'approve'}
                    onChange={(e) => setAction(e.target.value as 'approve')}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700 flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 mr-1" />
                    Approve Enrollment
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="reject"
                    checked={action === 'reject'}
                    onChange={(e) => setAction(e.target.value as 'reject')}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700 flex items-center">
                    <XCircleIcon className="h-4 w-4 text-red-600 mr-1" />
                    Reject Enrollment
                  </span>
                </label>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason/Comments (Optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter reason for approval/rejection..."
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !action}
              className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md disabled:opacity-50 ${action === 'approve'
                ? 'bg-green-600 hover:bg-green-700'
                : action === 'reject'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gray-400'
                }`}
            >
              {loading ? 'Processing...' : action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Select Action'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Promotion Modal
const PromotionModal = ({ isOpen, onClose, learner, onPromote, loading, currentSemester, nextSemester }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Promote to Next Semester</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
              <ArrowUpIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Promote <strong>{learner.name}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  From Semester {currentSemester} → Semester {nextSemester}
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Confirm Promotion
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>This action will promote the learner to the next semester. Make sure all current semester requirements are completed.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onPromote}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Promoting...' : 'Promote Learner'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Graduation Modal
const GraduationModal = ({ isOpen, onClose, learner, onGraduate, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Mark as Graduate</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg">
              <TrophyIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Mark <strong>{learner.name}</strong> as Graduate
                </p>
                <p className="text-sm text-gray-600">
                  {learner.dept || 'Course'} - Final Semester Completed
                </p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Graduation Confirmation
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>This action will mark the learner as graduated and update their enrollment status. This action cannot be easily undone.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onGraduate}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Mark as Graduate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LearnerProfileDrawer = ({ learner, isOpen, onClose }: {
  learner: any;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showAdmissionNoteModal, setShowAdmissionNoteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [admissionNotes, setAdmissionNotes] = useState<Array<{ id: string; admin: string; date: string; note: string }>>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // New state for learner actions
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showGraduationModal, setShowGraduationModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isOpen && learner?.id) {
      fetchAdmissionNotes();
    }
  }, [learner?.id, isOpen]);

  const fetchAdmissionNotes = async () => {
    setLoadingNotes(true);
    try {
      setAdmissionNotes([
        {
          id: '1',
          admin: 'Admin User',
          date: new Date().toLocaleDateString(),
          note: 'Strong application. Excellent entrance score. Recommended for approval.'
        }
      ]);
    } catch (error) {
      logger.error('Fetch learner notes failed', error instanceof Error ? error : new Error(String(error)));
      setAdmissionNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  };

  // Helper function to get current semester number
  const getCurrentSemester = () => {
    // For college learners, calculate based on enrollment date and current date
    if ((learner as any).college_id && (learner as any).enrollmentDate) {
      const enrollmentDate = new Date((learner as any).enrollmentDate);
      const currentDate = new Date();
      const monthsDiff = (currentDate.getFullYear() - enrollmentDate.getFullYear()) * 12 +
        (currentDate.getMonth() - enrollmentDate.getMonth());

      // Assuming 6 months per semester
      const calculatedSemester = Math.floor(monthsDiff / 6) + 1;
      return Math.max(1, calculatedSemester);
    }

    // For school learners, use grade directly
    if (learner.school_id && learner.grade) {
      const gradeNum = parseInt(learner.grade);
      if (!isNaN(gradeNum)) {
        return gradeNum;
      }
    }

    // Fallback to manual current_semester field or default
    return parseInt(learner.current_semester) || 1;
  };

  // Helper function to get total semesters for the course
  const getTotalSemesters = () => {
    // For school learners, typically goes up to grade 12
    if (learner.school_id) {
      return 12;
    }

    // For college learners, determine based on degree type
    const degreeType = learner.branch_field?.toLowerCase() ||
      learner.dept?.toLowerCase() ||
      learner.profile?.education?.[0]?.degree?.toLowerCase() || '';

    if (degreeType.includes('phd') || degreeType.includes('doctorate')) return 8;
    if (degreeType.includes('master') || degreeType.includes('mtech') || degreeType.includes('mba')) return 4;
    if (degreeType.includes('bachelor') || degreeType.includes('btech') || degreeType.includes('be') || degreeType.includes('bsc') || degreeType.includes('ba')) return 8;
    if (degreeType.includes('diploma')) return 6;

    return 8; // Default to 8 semesters for bachelor's degree
  };

  // UI only - always show promote button for approved learners
  const canPromote = () => {
    return learner.approval_status === 'approved' || learner.approval_status === 'verified';
  };

  // Check if learner can graduate
  const canGraduate = () => {
    const currentSem = getCurrentSemester();
    const totalSems = getTotalSemesters();

    // Check if learner is in good standing (only use approval_status)
    const isEligible = learner.approval_status === 'approved' ||
      learner.approval_status === 'verified';

    // Check if not already graduated (use metadata to track graduation)
    const notGraduated = !learner.metadata?.graduation_date;

    // Check if reached final semester OR expected graduation date has arrived
    const readyToGraduate = currentSem >= totalSems ||
      ((learner as any).expectedGraduationDate &&
        new Date() >= new Date((learner as any).expectedGraduationDate));

    return readyToGraduate && isEligible && notGraduated;
  };

  // Handle learner approval/rejection
  const handleApprovalAction = async (action: 'approve' | 'reject', reason?: string) => {
    setActionLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In a real implementation, you would update the database here
      const updateData: any = {
        approval_status: action === 'approve' ? 'approved' : 'rejected',
        updated_at: new Date().toISOString()
      };

      // If approving, also set enrollment status
      if (action === 'approve') {
        // Set enrollment date if not already set (using correct column name)
        if (!(learner as any).enrollmentDate) {
          updateData.enrollmentDate = new Date().toISOString().split('T')[0];
        }
      }

      // Add reason to metadata if provided
      if (reason) {
        updateData.metadata = {
          ...learner.metadata,
          approval_reason: reason,
          approval_date: new Date().toISOString()
        };
      }

      const response: any = await apiPost('/learners', { id: learner.id, ...updateData });
      if (!response?.data?.learner) {
        throw new Error('Failed to update learner');
      }

      setShowApprovalModal(false);

      // Show success message
      toast.success(`Learner ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);

      // Refresh the page or update local state
      window.location.reload();
    } catch (error) {
      logger.error('Update learner status failed', error instanceof Error ? error : new Error(String(error)), { learnerId: learner?.id, action });
      toast.error(`Failed to ${action} learner: ${(error as any)?.message || 'Please try again.'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle semester promotion - UI only
  const handlePromotion = async () => {
    setActionLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setShowPromotionModal(false);

      // Show success message
      toast.success('Learner promoted successfully!');

    } catch (error) {
      logger.error('Promote learner failed', error instanceof Error ? error : new Error(String(error)), { learnerId: learner?.id });
      toast.error('Failed to promote learner. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle graduation
  const handleGraduation = async () => {
    setActionLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In a real implementation, you would update the database here
      const graduationDate = new Date().toISOString();
      const updateData: any = {
        updated_at: graduationDate,
        metadata: {
          ...learner.metadata,
          graduation_date: graduationDate,
          graduated_by: 'current_admin', // Replace with actual admin ID
          final_semester: getCurrentSemester(),
          final_cgpa: learner.current_cgpa || learner.profile?.education?.[0]?.cgpa
        }
      };

      // Set expected graduation date if not already set
      if (!(learner as any).expectedGraduationDate) {
        updateData.expectedGraduationDate = graduationDate.split('T')[0];
      }

      // For school learners, mark as completed grade 12
      if (learner.school_id) {
        updateData.grade = getTotalSemesters().toString();
      }

      const response: any = await apiPost('/learners', { id: learner.id, ...updateData });
      if (!response?.data?.learner) {
        throw new Error('Failed to update learner');
      }

      setShowGraduationModal(false);

      // Show success message
      toast.success('Learner marked as graduated successfully!');

      // Refresh the page or update local state
      window.location.reload();
    } catch (error) {
      logger.error('Mark learner as graduated failed', error instanceof Error ? error : new Error(String(error)));
      toast.error(`Failed to mark learner as graduated: ${(error as any)?.message || 'Please try again.'}`);
    } finally {
      setActionLoading(false);
    }
  };



  if (!isOpen || !learner) return null;

  const qrCodeValue = `${window.location.origin}/learner/profile/${learner.id}`;

  const formatLabel = (key: string) => key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, (c) => c.toUpperCase());

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'academic', label: 'Academic' },
    { key: 'projects', label: `Projects` },
    { key: 'certificates', label: `Certificates` },
    { key: 'notes', label: 'Admission Notes' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex sm:pl-16">
          <div className="w-screen max-w-3xl">
            <div className="h-full flex flex-col bg-white shadow-xl">
              {/* Header */}
              <div className="px-6 py-4 bg-primary-50 border-b border-primary-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{learner.name}</h2>
                    <p className="text-sm text-gray-600 mt-1">{learner.email}</p>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {/* Show different fields based on learner type */}
                      {isSchoolLearner(learner) ? (
                        // School Learner Fields
                        <>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">School</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{learner.college_school_name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Grade</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{learner.grade || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Section</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{learner.section || 'N/A'}</p>
                          </div>
                        </>
                      ) : (
                        // University/College Learner Fields
                        <>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">College</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{learner.college || learner.profile?.university || learner.college_school_name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Degree</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{learner.profile?.education?.[0]?.degree || learner.branch_field || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Section</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{learner.section || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">CGPA</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{learner.profile?.education?.[0]?.cgpa || learner.currentCgpa || 'N/A'}</p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          {isSchoolLearner(learner) ? 'Admission Status:' : 'Enrollment Status:'}
                        </p>
                        <Badge type={learner.admission_status || learner.approval_status || 'pending'} />
                      </div>

                      {/* Academic Progress Indicator */}
                      {isCollegeLearner(learner) && (
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-500">
                            Academic Progress:
                          </div>
                          <div className="flex items-center bg-gray-100 rounded-full px-2 py-1">
                            <div className="text-xs font-medium text-gray-700">
                              Semester {getCurrentSemester()} of {getTotalSemesters()}
                            </div>
                            <div className="ml-2 w-12 bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${(getCurrentSemester() / getTotalSemesters()) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="relative flex flex-col items-center justify-center group mr-4">
                    <div
                      onClick={() => {
                        navigator.clipboard.writeText(qrCodeValue);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="cursor-pointer bg-white border border-gray-200 p-2 rounded-lg shadow-sm transition-transform transform hover:scale-105 hover:shadow-md"
                      title="Click to copy profile link"
                    >
                      <QRCodeSVG value={qrCodeValue} size={72} level="H" />
                    </div>

                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[11px] bg-gray-800 text-white rounded-md px-2 py-1 bottom-[-30px] whitespace-nowrap shadow-md">
                      {copied ? '✅ Link copied!' : '📱 Scan or click to copy'}
                    </div>

                    <p className="text-xs text-gray-500 mt-1">Scan to view</p>
                  </div>

                  <button
                    onClick={onClose}
                    className="bg-white rounded-md p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-50"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <PhoneIcon className="h-4 w-4 mr-1" />
                      <span>{learner.contact_number || learner.contactNumber || learner.profile?.contact_number || learner.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 mr-1" />
                      <span>{learner.email || learner.profile?.email || 'Not provided'}</span>
                    </div>
                  </div>

                  {/* Action Indicators */}
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const needsVerification =
                        learner.approval_status === 'pending' ||
                        learner.approval_status === null ||
                        learner.approval_status === undefined ||
                        !learner.approval_status;

                      return needsVerification && isCollegeLearner(learner);
                    })() && (
                        <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-1 animate-pulse"></div>
                          Verification Required
                        </div>
                      )}

                    {canPromote() && isCollegeLearner(learner) && (
                      <div className="flex items-center text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                        <ArrowUpIcon className="h-3 w-3 mr-1" />
                        Ready for Promotion
                      </div>
                    )}

                    {canGraduate() && isCollegeLearner(learner) && (
                      <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <TrophyIcon className="h-3 w-3 mr-1" />
                        Ready to Graduate
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 overflow-x-auto">
                <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                  {tabs.map((tab) => (
                    <TabButton
                      key={tab.key}
                      active={activeTab === tab.key}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tab.label}
                    </TabButton>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'overview' && (
                  <div className="p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Summary</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs mb-1">Full Name</span>
                          <span className="font-medium text-gray-900">{learner.name || learner.profile?.name || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs mb-1">Email</span>
                          <span className="font-medium text-gray-900 break-all">{learner.email || learner.profile?.email || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs mb-1">Contact</span>
                          <span className="font-medium text-gray-900">{learner.contact_number || learner.contactNumber || learner.phone || 'N/A'}</span>
                        </div>

                        {/* School-specific fields */}
                        {isSchoolLearner(learner) ? (
                          <>
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">School</span>
                              <span className="font-medium text-gray-900">{learner.college_school_name || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">Grade</span>
                              <span className="font-medium text-gray-900">{learner.grade || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">Section</span>
                              <span className="font-medium text-gray-900">{learner.section || 'N/A'}</span>
                            </div>
                            {learner.roll_number && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Roll Number</span>
                                <span className="font-medium text-gray-900">{learner.roll_number}</span>
                              </div>
                            )}
                            {learner.admission_number && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Admission Number</span>
                                <span className="font-medium text-gray-900">{learner.admission_number}</span>
                              </div>
                            )}
                            {learner.category && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Category</span>
                                <span className="font-medium text-gray-900">{learner.category}</span>
                              </div>
                            )}
                            {learner.quota && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Quota</span>
                                <span className="font-medium text-gray-900">{learner.quota}</span>
                              </div>
                            )}
                            {learner.date_of_birth && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Date of Birth</span>
                                <span className="font-medium text-gray-900">{new Date(learner.date_of_birth).toLocaleDateString()}</span>
                              </div>
                            )}
                            {learner.age && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Age</span>
                                <span className="font-medium text-gray-900">{learner.age}</span>
                              </div>
                            )}
                            {learner.gender && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Gender</span>
                                <span className="font-medium text-gray-900">{learner.gender}</span>
                              </div>
                            )}
                            {learner.bloodGroup && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Blood Group</span>
                                <span className="font-medium text-gray-900">{learner.bloodGroup}</span>
                              </div>
                            )}
                            {learner.district_name && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">District</span>
                                <span className="font-medium text-gray-900">{learner.district_name}</span>
                              </div>
                            )}
                            {learner.university && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">University</span>
                                <span className="font-medium text-gray-900">{learner.university}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          // University/College fields
                          <>
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">College</span>
                              <span className="font-medium text-gray-900">{learner.college || learner.profile?.university || learner.college_school_name || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">Degree</span>
                              <span className="font-medium text-gray-900">{learner.profile?.education?.[0]?.degree || learner.branch_field || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">Section</span>
                              <span className="font-medium text-gray-900">{learner.section || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">CGPA</span>
                              <span className="font-medium text-gray-900">{learner.profile?.education?.[0]?.cgpa || learner.currentCgpa || 'N/A'}</span>
                            </div>
                            {learner.enrollment_number && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Enrollment Number</span>
                                <span className="font-medium text-gray-900">{learner.enrollment_number}</span>
                              </div>
                            )}
                            {learner.registration_number && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Registration Number</span>
                                <span className="font-medium text-gray-900">{learner.registration_number}</span>
                              </div>
                            )}
                            {learner.roll_number && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Roll Number</span>
                                <span className="font-medium text-gray-900">{learner.roll_number}</span>
                              </div>
                            )}
                            {learner.category && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Category</span>
                                <span className="font-medium text-gray-900">{learner.category}</span>
                              </div>
                            )}
                            {learner.quota && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Quota</span>
                                <span className="font-medium text-gray-900">{learner.quota}</span>
                              </div>
                            )}
                            {learner.date_of_birth && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Date of Birth</span>
                                <span className="font-medium text-gray-900">{new Date(learner.date_of_birth).toLocaleDateString()}</span>
                              </div>
                            )}
                            {(learner.age || learner.profile?.age) && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Age</span>
                                <span className="font-medium text-gray-900">{learner.age || learner.profile.age}</span>
                              </div>
                            )}
                            {learner.gender && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Gender</span>
                                <span className="font-medium text-gray-900">{learner.gender}</span>
                              </div>
                            )}
                            {learner.district_name && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">District</span>
                                <span className="font-medium text-gray-900">{learner.district_name}</span>
                              </div>
                            )}
                            {learner.university && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">University</span>
                                <span className="font-medium text-gray-900">{learner.university}</span>
                              </div>
                            )}
                            {learner.profile?.linkedin_link && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">LinkedIn</span>
                                <a
                                  href={learner.profile.linkedin_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-blue-600 hover:text-blue-700 truncate"
                                >
                                  View Profile →
                                </a>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Guardian Information for School Learners */}
                    {learner.school_id && (learner.guardianName || learner.guardianPhone || learner.guardianEmail) && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Guardian Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          {learner.guardianName && (
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">Guardian Name</span>
                              <span className="font-medium text-gray-900">{learner.guardianName}</span>
                            </div>
                          )}
                          {learner.guardianPhone && (
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">Guardian Phone</span>
                              <span className="font-medium text-gray-900">{learner.guardianPhone}</span>
                            </div>
                          )}
                          {learner.guardianEmail && (
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">Guardian Email</span>
                              <span className="font-medium text-gray-900">{learner.guardianEmail}</span>
                            </div>
                          )}
                          {learner.guardianRelation && (
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">Relation</span>
                              <span className="font-medium text-gray-900">{learner.guardianRelation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Address Information for School Learners */}
                    {learner.school_id && (learner.address || learner.city || learner.state) && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          {learner.address && (
                            <div className="flex flex-col sm:col-span-2">
                              <span className="text-gray-500 text-xs mb-1">Address</span>
                              <span className="font-medium text-gray-900">{learner.address}</span>
                            </div>
                          )}
                          {learner.city && (
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">City</span>
                              <span className="font-medium text-gray-900">{learner.city}</span>
                            </div>
                          )}
                          {learner.state && (
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">State</span>
                              <span className="font-medium text-gray-900">{learner.state}</span>
                            </div>
                          )}
                          {learner.country && (
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">Country</span>
                              <span className="font-medium text-gray-900">{learner.country}</span>
                            </div>
                          )}
                          {learner.pincode && (
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">Pincode</span>
                              <span className="font-medium text-gray-900">{learner.pincode}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {learner.profile?.bio && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Bio</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">{learner.profile.bio}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Application Timeline</h3>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <div className="flex flex-col items-center mr-4">
                            <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                            <div className="w-0.5 h-8 bg-gray-200 my-1"></div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Application Submitted</p>
                            <p className="text-xs text-gray-500">
                              {learner.applied_date ? new Date(learner.applied_date).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="flex flex-col items-center mr-4">
                            <div className={`w-3 h-3 ${learner.admission_status === 'approved' ? 'bg-green-600' : learner.admission_status === 'rejected' ? 'bg-red-600' : 'bg-gray-300'} rounded-full`}></div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Application Decision</p>
                            <p className="text-xs text-gray-500">Status: {learner.admission_status?.toUpperCase() || 'PENDING'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'academic' && (
                  <div className="p-6 space-y-6">
                    {isSchoolLearner(learner) ? (
                      // School Learner Academic Info
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Academic Information</h3>
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">School</span>
                              <span className="font-medium text-gray-900">{learner.college_school_name || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">Grade</span>
                              <span className="font-medium text-gray-900">{learner.grade || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">Section</span>
                              <span className="font-medium text-gray-900">{learner.section || 'N/A'}</span>
                            </div>
                            {learner.roll_number && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Roll Number</span>
                                <span className="font-medium text-gray-900">{learner.roll_number}</span>
                              </div>
                            )}
                            {learner.admission_number && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Admission Number</span>
                                <span className="font-medium text-gray-900">{learner.admission_number}</span>
                              </div>
                            )}
                            {learner.enrollmentNumber && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Enrollment Number</span>
                                <span className="font-medium text-gray-900">{learner.enrollmentNumber}</span>
                              </div>
                            )}
                            {learner.learner_id && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Learner ID</span>
                                <span className="font-medium text-gray-900">{learner.learner_id}</span>
                              </div>
                            )}
                            {learner.learner_type && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Learner Type</span>
                                <span className="font-medium text-gray-900">{learner.learner_type}</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${learner.approval_status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {learner.approval_status?.charAt(0).toUpperCase() + learner.approval_status?.slice(1) || 'Pending'}
                            </span>
                          </div>
                        </div>

                        {/* Show subjects if available */}
                        {learner.subjects && learner.subjects.length > 0 && (
                          <div className="mt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Subjects</h3>
                            <div className="flex flex-wrap gap-2">
                              {learner.subjects.map((subject: string, index: number) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                >
                                  {subject}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      // University/College Learner Education Info
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Academic Information</h3>
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">College</span>
                              <span className="font-medium text-gray-900">{learner.college || learner.profile?.university || learner.college_school_name || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">Degree</span>
                              <span className="font-medium text-gray-900">{learner.profile?.education?.[0]?.degree || learner.branch_field || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">Section</span>
                              <span className="font-medium text-gray-900">{learner.section || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">CGPA</span>
                              <span className="font-medium text-gray-900">{learner.profile?.education?.[0]?.cgpa || learner.currentCgpa || 'N/A'}</span>
                            </div>
                            {learner.enrollment_number && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Enrollment Number</span>
                                <span className="font-medium text-gray-900">{learner.enrollment_number}</span>
                              </div>
                            )}
                            {learner.registration_number && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Registration Number</span>
                                <span className="font-medium text-gray-900">{learner.registration_number}</span>
                              </div>
                            )}
                            {learner.learner_id && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Learner ID</span>
                                <span className="font-medium text-gray-900">{learner.learner_id}</span>
                              </div>
                            )}
                            {learner.learner_type && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">Learner Type</span>
                                <span className="font-medium text-gray-900">{learner.learner_type}</span>
                              </div>
                            )}
                            {learner.university && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs mb-1">University</span>
                                <span className="font-medium text-gray-900">{learner.university}</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${learner.approval_status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {learner.approval_status?.charAt(0).toUpperCase() + learner.approval_status?.slice(1) || 'Pending'}
                            </span>
                          </div>
                        </div>

                        {/* Show detailed education if available */}
                        {learner.profile?.education && learner.profile.education.length > 0 && (
                          <div className="mt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Education History</h3>
                            <div className="space-y-4">
                              {learner.profile.education.map((edu: any, index: number) => (
                                <div key={edu.id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    <div className="flex flex-col">
                                      <span className="text-gray-500 text-xs mb-1">Degree</span>
                                      <span className="font-medium text-gray-900">{edu.degree || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-gray-500 text-xs mb-1">Level</span>
                                      <span className="font-medium text-gray-900">{edu.level || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-gray-500 text-xs mb-1">University</span>
                                      <span className="font-medium text-gray-900">{edu.university || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-gray-500 text-xs mb-1">CGPA</span>
                                      <span className="font-medium text-gray-900">{edu.cgpa || 'N/A'}</span>
                                    </div>
                                    {edu.department && (
                                      <div className="flex flex-col">
                                        <span className="text-gray-500 text-xs mb-1">Department</span>
                                        <span className="font-medium text-gray-900">{edu.department}</span>
                                      </div>
                                    )}
                                    {edu.yearOfPassing && (
                                      <div className="flex flex-col">
                                        <span className="text-gray-500 text-xs mb-1">Year of Passing</span>
                                        <span className="font-medium text-gray-900">{edu.yearOfPassing}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${edu.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                      }`}>
                                      {edu.status?.charAt(0).toUpperCase() + edu.status?.slice(1) || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {learner.profile?.technicalSkills && learner.profile.technicalSkills.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Technical Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {learner.profile.technicalSkills
                            .filter((skill: any) => skill.enabled !== false)
                            .map((skill: any, index: number) => (
                              <span
                                key={skill.id || index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                              >
                                {skill.name}
                                {skill.level && (
                                  <span className="ml-2 text-xs opacity-75">
                                    Level {skill.level}/5
                                  </span>
                                )}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {learner.profile?.softSkills && learner.profile.softSkills.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Soft Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {learner.profile.softSkills
                            .filter((skill: any) => skill.enabled !== false)
                            .map((skill: any, index: number) => (
                              <span
                                key={skill.id || index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200"
                              >
                                {skill.name}
                                {skill.level && (
                                  <span className="ml-2 text-xs opacity-75">
                                    Level {skill.level}/5
                                  </span>
                                )}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'projects' && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Projects</h3>
                      <span className="text-sm text-gray-600">{learner.projects?.length || 0} total</span>
                    </div>

                    {learner.projects && learner.projects.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {learner.projects.map((project) => (
                          <ProjectCard key={project.id} project={project} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="text-gray-500 mt-2">No projects yet</p>
                        <p className="text-gray-400 text-sm mt-1">Learner hasn't added any projects to their portfolio</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'certificates' && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Certificates</h3>
                      <span className="text-sm text-gray-600">{learner.certificates?.length || 0} total</span>
                    </div>

                    {learner.certificates && learner.certificates.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {learner.certificates.map((certificate) => (
                          <CertificateCard key={certificate.id} certificate={certificate} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="text-gray-500 mt-2">No certificates yet</p>
                        <p className="text-gray-400 text-sm mt-1">Learner hasn't added any certificates</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Admission Notes</h3>
                      <button
                        onClick={() => setShowAdmissionNoteModal(true)}
                        className="inline-flex items-center px-3 py-1.5 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100"
                      >
                        <PencilSquareIcon className="h-4 w-4 mr-1" />
                        Add Note
                      </button>
                    </div>

                    <div className="space-y-3">
                      {loadingNotes ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                          <p className="text-gray-500 mt-2">Loading notes...</p>
                        </div>
                      ) : admissionNotes.length > 0 ? (
                        admissionNotes.map((note: any) => (
                          <div key={note.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">{note.admin}</span>
                              <span className="text-xs text-gray-500">{note.date}</span>
                            </div>
                            <p className="text-sm text-gray-700">{note.note}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <PencilSquareIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="text-gray-500 mt-2">No admission notes yet</p>
                          <p className="text-gray-400 text-sm mt-1">Add feedback or assessment notes for this application</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowAdmissionNoteModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100">
                      <PencilSquareIcon className="h-4 w-4 mr-2" />
                      Add Note
                    </button>
                    <button
                      onClick={() => navigate('/digital-pp/homepage', { state: { candidate: learner } })}
                      className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100">
                      <File className="h-4 w-4 mr-2" />
                      View Portfolio
                    </button>

                    {/* Learner Management Actions - Integrated */}
                    {(() => {
                      // Show verify button if learner needs verification and is not a school learner
                      const needsVerification =
                        learner.approval_status === 'pending' ||
                        learner.approval_status === null ||
                        learner.approval_status === undefined ||
                        !learner.approval_status;

                      return needsVerification && isCollegeLearner(learner);
                    })() && (
                        <button
                          onClick={() => setShowApprovalModal(true)}
                          disabled={actionLoading}
                          className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Verify
                        </button>
                      )}



                    {canPromote() && isCollegeLearner(learner) && (
                      <button
                        onClick={() => setShowPromotionModal(true)}
                        disabled={actionLoading}
                        className="inline-flex items-center px-3 py-2 border border-indigo-300 rounded-md text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50"
                      >
                        <ArrowUpIcon className="h-4 w-4 mr-2" />
                        Promote
                      </button>
                    )}

                    {canGraduate() && isCollegeLearner(learner) && (
                      <button
                        onClick={() => setShowGraduationModal(true)}
                        disabled={actionLoading}
                        className="inline-flex items-center px-3 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
                      >
                        <TrophyIcon className="h-4 w-4 mr-2" />
                        Graduate
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Semester Status - Subtle Display - Only for College Learners */}
                    {isCollegeLearner(learner) && (
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Sem {getCurrentSemester()}/{getTotalSemesters()}
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowMessageModal(true)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                        Contact
                      </button>
                      <button
                        onClick={() => setShowExportModal(true)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                        Export
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modals */}
          <AdmissionNoteModal
            isOpen={showAdmissionNoteModal}
            onClose={() => setShowAdmissionNoteModal(false)}
            learner={learner}
            onSuccess={() => {
              fetchAdmissionNotes();
            }}
          />

          {/* New Action Modals */}
          <ApprovalModal
            isOpen={showApprovalModal}
            onClose={() => setShowApprovalModal(false)}
            learner={learner}
            onApprove={handleApprovalAction}
            onReject={handleApprovalAction}
            loading={actionLoading}
          />

          <PromotionModal
            isOpen={showPromotionModal}
            onClose={() => setShowPromotionModal(false)}
            learner={learner}
            onPromote={handlePromotion}
            loading={actionLoading}
            currentSemester={getCurrentSemester()}
            nextSemester={getCurrentSemester() + 1}
          />

          <GraduationModal
            isOpen={showGraduationModal}
            onClose={() => setShowGraduationModal(false)}
            learner={learner}
            onGraduate={handleGraduation}
            loading={actionLoading}
          />
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        learner={learner}
      />

      {/* Message Modal */}
      <MessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        learner={learner}
      />
    </div>
  );
};

export default LearnerProfileDrawer;