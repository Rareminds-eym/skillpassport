import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  StarIcon,
  MapPinIcon,
  AcademicCapIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentArrowDownIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  BeakerIcon,
  DevicePhoneMobileIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  CalendarIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import { supabase } from '../../../lib/supabaseClient';
import { ExternalLinkIcon, File } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Badge = ({ type }) => {
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

  const config = badgeConfig[type] || badgeConfig.pending;

  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${config.color}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const statusConfig = {
    verified: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Verified', icon: '✓' },
    approved: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Approved', icon: '✓' },
    pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Pending', icon: '⏳' },
    rejected: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Rejected', icon: '✕' },
  };

  const config = statusConfig[status] || statusConfig.pending;

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

const AdmissionNoteModal = ({ isOpen, onClose, student, onSuccess }) => {
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
      console.error('Error saving note:', error);
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
                Student: {student.name}
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

const MessageModal = ({ isOpen, onClose, student }) => {
  if (!isOpen) return null;

  const handleWhatsApp = () => {
    const phone = student.contact_number?.replace(/[^0-9]/g, '') || '';
    const message = encodeURIComponent(`Hi ${student.name}, I wanted to reach out regarding your admission application...`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    onClose();
  };

  const handleSMS = () => {
    const phone = student.contact_number?.replace(/[^0-9]/g, '') || '';
    window.location.href = `sms:${phone}`;
    onClose();
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('Your Admission Application Update');
    const body = encodeURIComponent(`Dear ${student.name},\n\nI wanted to reach out regarding your admission application.\n\nBest regards`);
    window.location.href = `mailto:${student.email}?subject=${subject}&body=${body}`;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Contact {student.name}</h3>
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
                <span>{student.contact_number || 'Not available'}</span>
              </div>
              <div className="flex items-center">
                <EnvelopeIcon className="h-3 w-3 mr-1" />
                <span>{student.email || 'Not available'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExportModal = ({ isOpen, onClose, student }) => {
  const [exportSettings, setExportSettings] = useState({
    format: 'pdf',
    type: 'application_summary'
  });

  const generatePDF = (student, settings) => {
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
    doc.text(`ADMISSION APPLICATION - ${student.name}`, margin, yPos);
    yPos += 10;

    // Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Application ID: ${student.id}`, margin, yPos);
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
      { label: 'Full Name', value: student.name },
      { label: 'Email', value: student.email },
      { label: 'Contact Number', value: student.contact_number },
      { label: 'Date of Birth', value: student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A' },
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
      { label: 'Applied Class', value: student.class },
      { label: 'Subjects', value: student.subjects ? student.subjects.join(', ') : 'N/A' },
      { label: 'Entrance Score', value: student.score },
      { label: 'Application Status', value: student.admission_status?.toUpperCase() },
      { label: 'Applied Date', value: student.applied_date ? new Date(student.applied_date).toLocaleDateString() : 'N/A' },
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

  const generateCSV = (student) => {
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
      escapeCSV(student.name),
      escapeCSV(student.email),
      escapeCSV(student.contact_number),
      escapeCSV(student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : ''),
      escapeCSV(student.class),
      escapeCSV(student.subjects ? student.subjects.join('; ') : ''),
      escapeCSV(student.score),
      escapeCSV(student.admission_status),
      escapeCSV(student.applied_date ? new Date(student.applied_date).toLocaleDateString() : '')
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
    const filename = `${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;

    if (exportSettings.format === 'csv') {
      const content = generateCSV(student);
      downloadFile(content, filename + '.csv', 'csv');
    } else {
      const pdfDoc = generatePDF(student, exportSettings);
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

const StudentProfileDrawer = ({ student, isOpen, onClose }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showAdmissionNoteModal, setShowAdmissionNoteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [admissionNotes, setAdmissionNotes] = useState<Array<{ id: string; admin: string; date: string; note: string }>>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  useEffect(() => {
    if (isOpen && student?.id) {
      fetchAdmissionNotes();
    }
  }, [student?.id, isOpen]);

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
      console.error('Error fetching notes:', error);
      setAdmissionNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  };



  if (!isOpen || !student) return null;

  const qrCodeValue = `${window.location.origin}/student/profile/${student.email}`;

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
                    <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
                    <p className="text-sm text-gray-600 mt-1">{student.email}</p>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">College</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{student.college || student.profile?.university || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Degree</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{student.profile?.education?.[0]?.degree || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">CGPA</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{student.profile?.education?.[0]?.cgpa || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Admission Status:</p>
                      <Badge type={student.admission_status || 'pending'} />
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
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <PhoneIcon className="h-4 w-4 mr-1" />
                    <span>{student.profile?.contact_number || student.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <EnvelopeIcon className="h-4 w-4 mr-1" />
                    <span>{student.email || student.profile?.email || 'Not provided'}</span>
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
                          <span className="font-medium text-gray-900">{student.name || student.profile?.name || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs mb-1">Email</span>
                          <span className="font-medium text-gray-900 break-all">{student.email || student.profile?.email || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs mb-1">Contact</span>
                          <span className="font-medium text-gray-900">{student.contact_number || student.phone || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs mb-1">Institution</span>
                          <span className="font-medium text-gray-900">{student.college || student.profile?.university || 'N/A'}</span>
                        </div>
                        {student.profile?.age && (
                          <div className="flex flex-col">
                            <span className="text-gray-500 text-xs mb-1">Age</span>
                            <span className="font-medium text-gray-900">{student.profile.age}</span>
                          </div>
                        )}
                        {student.profile?.linkedin_link && (
                          <div className="flex flex-col">
                            <span className="text-gray-500 text-xs mb-1">LinkedIn</span>
                            <a
                              href={student.profile.linkedin_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:text-blue-700 truncate"
                            >
                              View Profile →
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {student.profile?.bio && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Bio</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">{student.profile.bio}</p>
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
                              {student.applied_date ? new Date(student.applied_date).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="flex flex-col items-center mr-4">
                            <div className={`w-3 h-3 ${student.admission_status === 'approved' ? 'bg-green-600' : student.admission_status === 'rejected' ? 'bg-red-600' : 'bg-gray-300'} rounded-full`}></div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Application Decision</p>
                            <p className="text-xs text-gray-500">Status: {student.admission_status?.toUpperCase() || 'PENDING'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'academic' && (
                  <div className="p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Education</h3>
                      {student.profile?.education && student.profile.education.length > 0 ? (
                        <div className="space-y-4">
                          {student.profile.education.map((edu: any, index: number) => (
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
                      ) : (
                        <p className="text-sm text-gray-500">No education information available</p>
                      )}
                    </div>

                    {student.profile?.technicalSkills && student.profile.technicalSkills.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Technical Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {student.profile.technicalSkills
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

                    {student.profile?.softSkills && student.profile.softSkills.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Soft Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {student.profile.softSkills
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
                      <span className="text-sm text-gray-600">{student.projects?.length || 0} total</span>
                    </div>

                    {student.projects && student.projects.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {student.projects.map((project) => (
                          <ProjectCard key={project.id} project={project} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="text-gray-500 mt-2">No projects yet</p>
                        <p className="text-gray-400 text-sm mt-1">Student hasn't added any projects to their portfolio</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'certificates' && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Certificates</h3>
                      <span className="text-sm text-gray-600">{student.certificates?.length || 0} total</span>
                    </div>

                    {student.certificates && student.certificates.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {student.certificates.map((certificate) => (
                          <CertificateCard key={certificate.id} certificate={certificate} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="text-gray-500 mt-2">No certificates yet</p>
                        <p className="text-gray-400 text-sm mt-1">Student hasn't added any certificates</p>
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
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowAdmissionNoteModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100">
                      <PencilSquareIcon className="h-4 w-4 mr-2" />
                      Add Note
                    </button>
                    <button
                      onClick={() => navigate('/digital-pp/homepage', { state: { candidate: student } })}
                      className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100">
                      <File className="h-4 w-4 mr-2" />
                      View Portfolio
                    </button>
                  </div>
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

          {/* Modals */}
          <AdmissionNoteModal
            isOpen={showAdmissionNoteModal}
            onClose={() => setShowAdmissionNoteModal(false)}
            student={student}
            onSuccess={() => {
              fetchAdmissionNotes();
            }}
          />
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        student={student}
      />

      {/* Message Modal */}
      <MessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        student={student}
      />
    </div>
  );
};

export default StudentProfileDrawer;