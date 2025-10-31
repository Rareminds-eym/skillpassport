// src/components/educator/StudentProfileDrawer.tsx
import React, { useState } from 'react';
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
  TrophyIcon,
  BriefcaseIcon,
  BeakerIcon,
  DevicePhoneMobileIcon,
  PencilSquareIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';

const Badge = ({ type }) => {
  const badgeConfig = {
    self_verified: {
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      label: 'Self Verified',
      icon: ShieldCheckIcon
    },
    institution_verified: {
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      label: 'Institution Verified',
      icon: AcademicCapIcon
    },
    external_audited: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-400',
      label: 'External Audited',
      icon: ShieldCheckIcon
    }
  };

  const config = badgeConfig[type] || badgeConfig.self_verified;
  const IconComponent = config.icon;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <IconComponent className="h-3 w-3 mr-1" />
      {config.label}
    </span>
  );
};

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium border-b-2 ${active
      ? 'border-primary-500 text-primary-600'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
  >
    {children}
  </button>
);

const ExportModal = ({ isOpen, onClose, student }) => {
  const [exportSettings, setExportSettings] = useState({
    format: 'pdf',
    type: 'mini_profile'
  });

  const generatePDF = (student, settings) => {
    const isFullProfile = settings.type === 'full_profile';
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
    doc.text(`STUDENT PROFILE - ${student.name}`, margin, yPos);
    yPos += 10;

    // Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Export Type: ${isFullProfile ? 'Full Profile with PII' : 'Academic Profile'}`, margin, yPos);
    yPos += lineHeight + 3;

    // Basic Information
    checkNewPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('BASIC INFORMATION', margin, yPos);
    yPos += lineHeight + 2;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const basicFields = [
      { label: 'Name', value: student.name },
      { label: 'Registration Number', value: student.registration_number },
      { label: 'Date of Birth', value: student.date_of_birth },
      { label: 'Age', value: student.age },
      { label: 'University', value: student.university || student.college },
      { label: 'College/School', value: student.college_school_name || student.college },
      { label: 'Department', value: student.dept || student.branch_field },
      { label: 'Course', value: student.course },
      { label: 'District', value: student.district_name || student.location },
      { label: 'Year', value: student.year },
    ];

    if (isFullProfile) {
      basicFields.push(
        { label: 'Email', value: student.email },
        { label: 'Phone', value: student.phone },
        { label: 'Alternate Number', value: student.alternate_number }
      );
    }

    basicFields.forEach(field => {
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
      { label: 'Branch/Field', value: student.branch_field },
      { label: 'Trainer Name', value: student.trainer_name },
      { label: 'NM ID', value: student.nm_id },
      { label: 'Academic Score', value: student.ai_score_overall || student.academic_score },
      { label: 'CGPA', value: student.cgpa },
      { label: 'Year of Passing', value: student.year_of_passing },
      { label: 'Employability Score', value: student.employability_score },
    ];

    academicFields.forEach(field => {
      if (field.value !== undefined && field.value !== null && field.value !== '') {
        checkNewPage();
        doc.text(`${field.label}: ${field.value}`, margin + 5, yPos);
        yPos += lineHeight;
      }
    });
    yPos += 3;

    // Skills
    if (student.skills && student.skills.length > 0) {
      checkNewPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('SKILLS', margin, yPos);
      yPos += lineHeight + 2;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const skillsText = student.skills.join(', ');
      const splitSkills = doc.splitTextToSize(skillsText, pageWidth - (margin * 2) - 5);
      splitSkills.forEach(line => {
        checkNewPage();
        doc.text(line, margin + 5, yPos);
        yPos += lineHeight;
      });
      yPos += 3;
    }

    // Projects Summary
    if (student.projects && student.projects.length > 0) {
      checkNewPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('PROJECTS', margin, yPos);
      yPos += lineHeight + 2;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Projects: ${student.projects.length}`, margin + 5, yPos);
      yPos += lineHeight + 3;
    }

    // Certificates Summary
    if (student.certificates && student.certificates.length > 0) {
      checkNewPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('CERTIFICATES', margin, yPos);
      yPos += lineHeight + 2;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Certificates: ${student.certificates.length}`, margin + 5, yPos);
      yPos += lineHeight + 3;
    }

    // Verification Badges
    if (student.badges && student.badges.length > 0) {
      checkNewPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('VERIFICATION', margin, yPos);
      yPos += lineHeight + 2;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(student.badges.join(', '), margin + 5, yPos);
      yPos += lineHeight + 3;
    }

    // Footer on all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('--- Exported from Skill Eco System ---', pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    }

    return doc;
  };

  const generateCSV = (student, settings) => {
    const isFullProfile = settings.type === 'full_profile';

    const headers = [
      'Name',
      'Registration Number',
      'Date of Birth',
      'Age',
      'University',
      'College/School',
      'Department',
      'Course',
      'Branch/Field',
      'District',
      'Year',
    ];

    if (isFullProfile) {
      headers.push(
        'Email',
        'Phone',
        'Alternate Number',
        'Trainer Name',
        'NM ID'
      );
    }

    headers.push(
      'Academic Score',
      'CGPA',
      'Year of Passing',
      'Employability Score',
      'Skills',
      'Verification Badges',
      'Verified'
    );

    let csvContent = headers.join(',') + '\n';

    const escapeCSV = (value) => {
      if (value === null || value === undefined || value === '') return '""';
      const str = String(value);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const row = [
      escapeCSV(student.name),
      escapeCSV(student.registration_number),
      escapeCSV(student.date_of_birth),
      escapeCSV(student.age),
      escapeCSV(student.university || student.college),
      escapeCSV(student.college_school_name || student.college),
      escapeCSV(student.dept || student.branch_field),
      escapeCSV(student.course),
      escapeCSV(student.branch_field),
      escapeCSV(student.district_name || student.location),
      escapeCSV(student.year),
    ];

    if (isFullProfile) {
      row.push(
        escapeCSV(student.email),
        escapeCSV(student.phone),
        escapeCSV(student.alternate_number),
        escapeCSV(student.trainer_name),
        escapeCSV(student.nm_id)
      );
    }

    row.push(
      escapeCSV(student.ai_score_overall || student.academic_score),
      escapeCSV(student.cgpa),
      escapeCSV(student.year_of_passing),
      escapeCSV(student.employability_score),
      escapeCSV(student.skills?.join('; ')),
      escapeCSV(student.badges?.join('; ')),
      escapeCSV(student.verified ? 'Yes' : 'No')
    );

    csvContent += row.join(',') + '\n';

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
      const content = generateCSV(student, exportSettings);
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
            <h3 className="text-lg font-medium text-gray-900">Export Student Report</h3>
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
                    onChange={(e) => setExportSettings({ ...exportSettings, format: e.target.value })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">PDF</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Type</label>
              <div className="space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="mini_profile"
                    checked={exportSettings.type === 'mini_profile'}
                    onChange={(e) => setExportSettings({ ...exportSettings, type: e.target.value })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Academic Profile</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="full_profile"
                    checked={exportSettings.type === 'full_profile'}
                    onChange={(e) => setExportSettings({ ...exportSettings, type: e.target.value })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Full Profile</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">Full Profile includes contact information (PII)</p>
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

const MessageModal = ({ isOpen, onClose, student }) => {
  if (!isOpen) return null;

  const handleWhatsApp = () => {
    const phone = student.phone?.replace(/[^0-9]/g, '') || '';
    const message = encodeURIComponent(`Hi ${student.name}, I wanted to reach out regarding your academic progress...`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    onClose();
  };

  const handleSMS = () => {
    const phone = student.phone?.replace(/[^0-9]/g, '') || '';
    window.location.href = `sms:${phone}`;
    onClose();
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('Academic Update from Skill Eco System');
    const body = encodeURIComponent(`Dear ${student.name},\n\nI wanted to reach out regarding your academic progress and achievements...\n\nBest regards`);
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
                <span>{student.phone || 'Not available'}</span>
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

const AddMentorNoteModal = ({ isOpen, onClose, student, onSuccess }) => {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!note.trim()) return;

    setIsSubmitting(true);
    try {
      // TODO: API call to save mentor note
      // await saveMentorNote(student.id, note);
      
      // Simulate API call
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
            <h3 className="text-lg font-medium text-gray-900">Add Mentor Note</h3>
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
                placeholder="Enter your mentor feedback or observations..."
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

const VerifyAssignmentModal = ({ isOpen, onClose, student, onSuccess }) => {
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock pending assignments - replace with actual data
  const pendingAssignments = [
    { id: '1', title: 'React Project Submission', submittedAt: '2025-10-25' },
    { id: '2', title: 'Database Design Assignment', submittedAt: '2025-10-26' },
    { id: '3', title: 'API Development Task', submittedAt: '2025-10-28' },
  ];

  const toggleAssignment = (id: string) => {
    setSelectedAssignments(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleVerify = async () => {
    if (selectedAssignments.length === 0) return;

    setIsSubmitting(true);
    try {
      // TODO: API call to verify assignments
      // await verifyAssignments(student.id, selectedAssignments);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onSuccess?.();
      setSelectedAssignments([]);
      onClose();
    } catch (error) {
      console.error('Error verifying assignments:', error);
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
            <h3 className="text-lg font-medium text-gray-900">Verify Assignments</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">Student: <span className="font-medium">{student.name}</span></p>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pendingAssignments.length > 0 ? (
              pendingAssignments.map(assignment => (
                <label
                  key={assignment.id}
                  className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedAssignments.includes(assignment.id)}
                    onChange={() => toggleAssignment(assignment.id)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                  />
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{assignment.title}</p>
                    <p className="text-xs text-gray-500 mt-1">Submitted: {assignment.submittedAt}</p>
                  </div>
                </label>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="text-gray-500 mt-2">No pending assignments</p>
              </div>
            )}
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
              onClick={handleVerify}
              disabled={isSubmitting || selectedAssignments.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Verifying...' : `Verify ${selectedAssignments.length} Assignment${selectedAssignments.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentProfileDrawer = ({ student, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showMentorNoteModal, setShowMentorNoteModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !student) return null;

  const studentName = (student as any).name || (student as any).student_name || '';
  const studentEmail = (student as any).email || (student as any).student_email || '';

  const qrCodeValue = `${window.location.origin}/student/profile/${studentEmail}`;

  // Parse profile data
  let profileData: any = student;
  let rawProfile: any = {};

  if (student.profile && typeof student.profile === 'string') {
    try {
      rawProfile = JSON.parse(student.profile);
      profileData = { ...student, ...rawProfile };
    } catch (e) {
      console.warn('Profile parsing failed:', e);
      rawProfile = {};
      profileData = student;
    }
  } else if (student.profile && typeof student.profile === 'object') {
    rawProfile = student.profile;
    profileData = { ...student, ...rawProfile };
  }

  const projectsData = Array.isArray((student as any).projects) ? (student as any).projects : [];
  const certificatesData = Array.isArray((student as any).certificates) ? (student as any).certificates : [];
  const assessmentsData = Array.isArray((student as any).assessments) ? (student as any).assessments : [];

  const verifiedProjects = projectsData.filter((project: any) => project?.verified === true || project?.status === 'verified');
  const verifiedCertificates = certificatesData.filter((certificate: any) => certificate?.verified === true || certificate?.status === 'verified');

  profileData = {
    ...profileData,
    projects: verifiedProjects,
    certificates: verifiedCertificates,
    assessments: assessmentsData
  };

  const modalStudent = {
    ...student,
    name: studentName,
    email: studentEmail,
    projects: verifiedProjects,
    certificates: verifiedCertificates,
    assessments: assessmentsData
  };

  const formatLabel = (key: string) => key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, (c) => c.toUpperCase());

  const formatDateValue = (value: any) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
  };

  const isPrimitive = (val: any) => val === null || ['string', 'number', 'boolean'].includes(typeof val);
  const isEmpty = (v: any) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '');

  const knownComposite = new Set(['training', 'education', 'technicalSkills', 'softSkills', 'experience', 'projects', 'certificates', 'assessments', 'mentorNotes']);
  const excludedFields = new Set([
    '_', 'imported_at', 'contact_number_dial_code', 'id', 'student_id',
    'created_at', 'updated_at', 'last_updated'
  ]);

  const primitiveEntries = Object.entries(rawProfile || {})
    .filter(([k, v]) => !knownComposite.has(k) && !excludedFields.has(k) && isPrimitive(v) && !isEmpty(v))
    .sort(([a], [b]) => a.localeCompare(b));

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'projects', label: 'Projects' },
    { key: 'assessments', label: 'Assessments' },
    { key: 'certificates', label: 'Certificates' },
    { key: 'verification', label: 'Verification' },
    { key: 'notes', label: 'Mentor Notes' }
  ];

  // Mock mentor notes - replace with actual data
  const mentorNotes = profileData.mentorNotes || [
    {
      id: '1',
      educator: 'Dr. Sarah Johnson',
      date: '2025-10-28',
      note: 'Excellent progress in React development. Shows strong problem-solving skills.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex sm:pl-16">
          <div className="w-screen max-w-2xl">
            <div className="h-full flex flex-col bg-white shadow-xl">
              {/* Header */}
              <div className="px-6 py-4 bg-primary-50 border-b border-primary-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h2 className="text-xl font-semibold text-gray-900">{profileData.name || student.name}</h2>
                      <div className="ml-3 flex items-center">
                        <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
                        <span className="text-lg font-bold text-gray-900 ml-1">{student.ai_score_overall || student.academic_score || 0}</span>
                        <span className="text-sm text-gray-600 ml-1">Academic Score</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-600">
                      <AcademicCapIcon className="h-4 w-4 mr-1" />
                      <span>{profileData.college_school_name || student.college} • {profileData.branch_field || student.dept}</span>
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      <span>{profileData.district_name || student.location} • Age {profileData.age || 'N/A'}</span>
                    </div>
                    {student.badges && student.badges.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {student.badges.map((badge, index) => (
                          <Badge key={index} type={badge} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* QR Code */}
                  <div className="relative flex flex-col items-center justify-center group">
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

                    <p className="text-xs text-gray-500 mt-1">Scan to view profile</p>
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
                    <span>{profileData.contact_number || student.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <EnvelopeIcon className="h-4 w-4 mr-1" />
                    <span>{profileData.email || student.email}</span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
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
                    {/* Profile Info */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
                      {primitiveEntries.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          {primitiveEntries.map(([key, value]) => (
                            <div key={key} className="flex flex-col">
                              <span className="text-gray-500 text-xs mb-1">{formatLabel(key)}</span>
                              <span className="font-medium text-gray-900 break-all">{String(value)}</span>
                            </div>
                          ))}
                          {Array.isArray(profileData.education) && profileData.education.length > 0 && (
                            <div className="flex flex-col col-span-1">
                              <span className="text-gray-500 text-xs mb-1">Education</span>
                              <span className="font-medium text-gray-900 break-all">
                                {profileData.education.map((e: any) => e.degree || e.level || 'Education').join(', ')}
                              </span>
                            </div>
                          )}
                          {Array.isArray(profileData.training) && profileData.training.length > 0 && (
                            <div className="flex flex-col col-span-1">
                              <span className="text-gray-500 text-xs mb-1">Training</span>
                              <span className="font-medium text-gray-900 break-all">
                                {profileData.training.map((t: any) => t.course || t.skill || 'Training').join(', ')}
                              </span>
                            </div>
                          )}
                          {Array.isArray(profileData.technicalSkills) && profileData.technicalSkills.length > 0 && (
                            <div className="flex flex-col col-span-1">
                              <span className="text-gray-500 text-xs mb-1">Technical Skills</span>
                              <span className="font-medium text-gray-900 break-all">
                                {profileData.technicalSkills.map((s: any) => s.name).join(', ')}
                              </span>
                            </div>
                          )}
                          {Array.isArray(profileData.softSkills) && profileData.softSkills.length > 0 && (
                            <div className="flex flex-col col-span-1">
                              <span className="text-gray-500 text-xs mb-1">Soft Skills</span>
                              <span className="font-medium text-gray-900 break-all">
                                {profileData.softSkills.map((s: any) => s.name).join(', ')}
                              </span>
                            </div>
                          )}
                          {Array.isArray(profileData.experience) && profileData.experience.length > 0 && (
                            <div className="flex flex-col col-span-1">
                              <span className="text-gray-500 text-xs mb-1">Experience</span>
                              <span className="font-medium text-gray-900 break-all">
                                {profileData.experience.map((x: any) => [x.role, x.organization].filter(Boolean).join(' @ ')).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No profile fields available</p>
                      )}
                    </div>

                    {/* Education */}
                    {profileData.education && profileData.education.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Education</h3>
                        <div className="space-y-3">
                          {profileData.education.map((edu, index) => (
                            <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{edu.degree}</p>
                                  <p className="text-sm text-gray-600 mt-1">{edu.university}</p>
                                  <div className="flex items-center mt-2 text-sm text-gray-500">
                                    <span className="mr-3">{edu.level}</span>
                                    {edu.yearOfPassing && <span className="mr-3">• {edu.yearOfPassing}</span>}
                                    {edu.cgpa && edu.cgpa !== 'N/A' && <span>• CGPA: {edu.cgpa}</span>}
                                  </div>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${edu.status === 'ongoing' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                  }`}>
                                  {edu.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Training */}
                    {profileData.training && profileData.training.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Training & Courses</h3>
                        <div className="space-y-3">
                          {profileData.training.map((train, index) => (
                            <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{train.course}</p>
                                  {train.skill && <p className="text-sm text-gray-600 mt-1">{train.skill}</p>}
                                  {train.trainer && <p className="text-xs text-gray-500 mt-1">Trainer: {train.trainer}</p>}
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${train.status === 'ongoing' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                  }`}>
                                  {train.status}
                                </span>
                              </div>
                              {train.progress !== undefined && (
                                <div className="mt-2">
                                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Progress</span>
                                    <span>{train.progress}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${train.progress}%` }}></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Technical Skills */}
                    {profileData.technicalSkills && profileData.technicalSkills.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Technical Skills</h3>
                        <div className="space-y-2">
                          {profileData.technicalSkills.map((skill, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center">
                                {skill.icon && <span className="mr-2">{skill.icon}</span>}
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{skill.name}</p>
                                  {skill.category && <p className="text-xs text-gray-500">{skill.category}</p>}
                                </div>
                              </div>
                              <div className="flex items-center">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <div key={i} className={`w-2 h-2 rounded-full mx-0.5 ${i < skill.level ? 'bg-primary-600' : 'bg-gray-300'
                                      }`}></div>
                                  ))}
                                </div>
                                {skill.verified && (
                                  <ShieldCheckIcon className="h-4 w-4 text-green-600 ml-2" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Soft Skills */}
                    {profileData.softSkills && profileData.softSkills.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Soft Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {profileData.softSkills.map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                            >
                              {skill.name}
                              <span className="ml-1 text-xs">({skill.level}/5)</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {profileData.experience && profileData.experience.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Experience</h3>
                        <div className="space-y-3">
                          {profileData.experience.map((exp, index) => (
                            <div key={index} className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <BriefcaseIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{exp.role}</p>
                                <p className="text-sm text-gray-600 mt-1">{exp.organization}</p>
                                {exp.duration && <p className="text-xs text-gray-500 mt-1">Duration: {exp.duration}</p>}
                                {exp.verified && (
                                  <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    <ShieldCheckIcon className="h-3 w-3 mr-1" />
                                    Verified
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Projects Tab */}
                {activeTab === 'projects' && (
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Projects & Portfolio</h3>
                    <div className="space-y-4">
                      {profileData.projects && profileData.projects.length > 0 ? (
                        profileData.projects.map((project: any, index: number) => {
                          const techStack = project.technologies || project.tech || project.techStack || project.skills || [];
                          const statusText = project.status ? project.status.charAt(0).toUpperCase() + project.status.slice(1) : 'Status Unknown';

                          return (
                            <div key={project.id || index} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center">
                                    <h4 className="font-medium text-gray-900">{project.title || project.name || `Project ${index + 1}`}</h4>
                                    {project.status && (
                                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${project.status.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' :
                                        project.status.toLowerCase() === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                        {statusText}
                                      </span>
                                    )}
                                  </div>
                                  {project.organization && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      <span className="font-medium">Organization:</span> {project.organization}
                                    </p>
                                  )}
                                  {project.description && (
                                    <p className="text-sm text-gray-600 mt-2">{project.description}</p>
                                  )}
                                  {project.role && (
                                    <p className="text-sm text-gray-500 mt-1"><span className="font-medium">Role:</span> {project.role}</p>
                                  )}
                                  {project.duration && (
                                    <p className="text-sm text-gray-500 mt-1"><span className="font-medium">Duration:</span> {project.duration}</p>
                                  )}
                                  {project.verifiedAt && (
                                    <p className="text-xs text-green-600 mt-1">Verified on: {formatDateValue(project.verifiedAt || project.updatedAt || project.createdAt)}</p>
                                  )}
                                  {techStack.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-3">
                                      {techStack.map((tech: string, techIndex: number) => (
                                        <span
                                          key={techIndex}
                                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200"
                                        >
                                          {tech}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {project.link && (
                                    <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-flex items-center">
                                      View Project →
                                    </a>
                                  )}
                                </div>
                                <BeakerIcon className="h-6 w-6 text-gray-400 ml-4 flex-shrink-0" />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-12">
                          <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="text-gray-500 mt-2">No projects available</p>
                          <p className="text-gray-400 text-sm mt-1">Student hasn't added any projects yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Assessments Tab */}
                {activeTab === 'assessments' && (
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Assessments & Test Scores</h3>
                    <div className="space-y-4">
                      {profileData.assessments && profileData.assessments.length > 0 ? (
                        profileData.assessments.map((assessment: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-gray-900">{assessment.name || assessment.title || `Assessment ${index + 1}`}</h4>
                                  {assessment.score && (
                                    <span className="text-lg font-bold text-primary-600">{assessment.score}</span>
                                  )}
                                </div>
                                {assessment.type && (
                                  <p className="text-sm text-gray-500 mt-1">{assessment.type}</p>
                                )}
                                {assessment.date && (
                                  <p className="text-xs text-gray-400 mt-1">Completed on: {assessment.date}</p>
                                )}
                                {assessment.percentile && (
                                  <div className="mt-3">
                                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                                      <span>Percentile</span>
                                      <span>{assessment.percentile}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${assessment.percentile}%` }}></div>
                                    </div>
                                  </div>
                                )}
                                {assessment.badge && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-2">
                                    <TrophyIcon className="h-3 w-3 mr-1" />
                                    {assessment.badge}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-gray-500 mt-2">No assessments available</p>
                          <p className="text-gray-400 text-sm mt-1">Assessment results will appear here once completed</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Certificates Tab */}
                {activeTab === 'certificates' && (
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Certificates & Credentials</h3>
                    <div className="space-y-4">
                      {profileData.certificates && profileData.certificates.length > 0 ? (
                        profileData.certificates.map((cert: any, index: number) => (
                          <div key={cert.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                  <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="ml-4 flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-medium text-gray-900">
                                      {cert.title || cert.name || `Certificate ${index + 1}`}
                                    </h4>

                                    <div className="flex justify-between">
                                      {cert.issuer && (
                                        <p className="text-sm text-gray-600 mt-1">Issued by: {cert.issuer}</p>
                                      )}
                                      {cert.issuedOn && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          Issue Date: {cert.issuedOn}
                                        </p>
                                      )}
                                    </div>

                                    {cert.expiry_date && (
                                      <p className="text-xs text-gray-500">Expires: {cert.expiry_date}</p>
                                    )}
                                    {cert.credentialId && (
                                      <p className="text-xs text-gray-400 mt-2">ID: {cert.credentialId}</p>
                                    )}

                                    {cert.level && (
                                      <p className="text-xs text-gray-700 mt-2 flex items-center gap-1">
                                        <span className="font-medium">Level:</span>
                                        <span className="inline-block w-auto px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                          {cert.level}
                                        </span>
                                      </p>
                                    )}
                                  </div>

                                  {(cert.verified || cert.status === "verified") && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <ShieldCheckIcon className="h-3 w-3 mr-1" />
                                      Verified
                                    </span>
                                  )}
                                  {cert.status === "pending" && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      Pending
                                    </span>
                                  )}
                                </div>

                                {cert.verifiedAt && (
                                  <p className="text-xs text-green-600 mt-2">Verified on: {formatDateValue(cert.verifiedAt)}</p>
                                )}
                                {cert.description && (
                                  <p className="text-sm text-gray-600 mt-2">{cert.description}</p>
                                )}
                                {cert.skills && cert.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-3">
                                    {cert.skills.map((skill: string, skillIndex: number) => (
                                      <span key={skillIndex} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {cert.link && (
                                  <a href={cert.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-flex items-center">
                                    View Certificate →
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          <p className="text-gray-500 mt-2">No certificates available</p>
                          <p className="text-gray-400 text-sm mt-1">Certificates and credentials will appear here</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Verification Tab */}
                {activeTab === 'verification' && (
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Verification & Provenance</h3>

                    {/* Verification Badges */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Verification Status</h4>
                      <div className="space-y-3">
                        {student.badges && student.badges.length > 0 ? (
                          student.badges.map((badge: string, index: number) => {
                            const verificationInfo: any = {
                              self_verified: {
                                title: 'Self Verified',
                                description: 'Student has self-declared this information',
                                date: profileData.imported_at || 'N/A',
                                verifier: 'Student',
                                status: 'pending',
                                icon: '👤'
                              },
                              institution_verified: {
                                title: 'Institution Verified',
                                description: 'Verified by college/university',
                                date: profileData.imported_at || 'N/A',
                                verifier: profileData.college_school_name || 'Institution',
                                status: 'verified',
                                icon: '🎓'
                              },
                              external_audited: {
                                title: 'External Audited',
                                description: 'Third-party verification completed',
                                date: profileData.imported_at || 'N/A',
                                verifier: 'External Auditor',
                                status: 'audited',
                                icon: '✓'
                              }
                            };

                            const info = verificationInfo[badge] || {
                              title: badge,
                              description: 'Verification status',
                              date: 'N/A',
                              verifier: 'System',
                              status: 'pending',
                              icon: '•'
                            };

                            const statusColors: any = {
                              pending: 'bg-yellow-50 border-yellow-200',
                              verified: 'bg-blue-50 border-blue-200',
                              audited: 'bg-green-50 border-green-200'
                            };

                            return (
                              <div key={index} className={`border rounded-lg p-4 ${statusColors[info.status]}`}>
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start">
                                    <div className="text-2xl mr-3">{info.icon}</div>
                                    <div>
                                      <h4 className="font-medium text-gray-900">{info.title}</h4>
                                      <p className="text-sm text-gray-600 mt-1">{info.description}</p>
                                      <div className="mt-2 text-xs text-gray-500">
                                        <p>Verified by: {info.verifier}</p>
                                        {info.date && info.date !== 'N/A' && (
                                          <p>Date: {new Date(info.date).toLocaleDateString()}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <ShieldCheckIcon className={`h-6 w-6 flex-shrink-0 ${info.status === 'verified' ? 'text-blue-600' :
                                    info.status === 'audited' ? 'text-green-600' :
                                      'text-yellow-600'
                                    }`} />
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-gray-500">No verification badges available</p>
                        )}
                      </div>
                    </div>

                    {/* Verification Trail */}
                    <div className="mt-8">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Verification Trail</h4>
                      <div className="space-y-3">
                        {profileData.education && profileData.education.length > 0 && (
                          <div className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start">
                              <AcademicCapIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Education Records</p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {profileData.education.length} education record(s) on file
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Source: {profileData.university || profileData.college_school_name || 'Institution'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {profileData.training && profileData.training.length > 0 && (
                          <div className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start">
                              <BeakerIcon className="h-5 w-5 text-purple-600 mr-2 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Training Records</p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {profileData.training.length} training program(s) documented
                                </p>
                                {profileData.trainer_name && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Trainer: {profileData.trainer_name}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {((profileData.technicalSkills && profileData.technicalSkills.length > 0) ||
                          (profileData.softSkills && profileData.softSkills.length > 0)) && (
                            <div className="border border-gray-200 rounded-lg p-3">
                              <div className="flex items-start">
                                <ShieldCheckIcon className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">Skills Assessment</p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {(profileData.technicalSkills?.length || 0) + (profileData.softSkills?.length || 0)} skill(s) verified
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Technical: {profileData.technicalSkills?.length || 0}, Soft: {profileData.softSkills?.length || 0}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                        {profileData.imported_at && (
                          <div className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start">
                              <svg className="h-5 w-5 text-gray-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Profile Import</p>
                                <p className="text-xs text-gray-600 mt-1">
                                  Last imported: {new Date(profileData.imported_at).toLocaleString()}
                                </p>
                                {profileData.nm_id && (
                                  <p className="text-xs text-gray-500 mt-1">NM ID: {profileData.nm_id}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Mentor Notes Tab */}
                {activeTab === 'notes' && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Mentor Notes</h3>
                      <button
                        onClick={() => setShowMentorNoteModal(true)}
                        className="inline-flex items-center px-3 py-1.5 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100"
                      >
                        <PencilSquareIcon className="h-4 w-4 mr-1" />
                        Add Note
                      </button>
                    </div>

                    <div className="space-y-3">
                      {mentorNotes.length > 0 ? (
                        mentorNotes.map((note: any) => (
                          <div key={note.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">{note.educator}</span>
                              <span className="text-xs text-gray-500">{note.date}</span>
                            </div>
                            <p className="text-sm text-gray-700">{note.note}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <PencilSquareIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="text-gray-500 mt-2">No mentor notes yet</p>
                          <p className="text-gray-400 text-sm mt-1">Add feedback or observations about this student</p>
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
                      onClick={() => setShowMentorNoteModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100">
                      <PencilSquareIcon className="h-4 w-4 mr-2" />
                      Add Mentor Note
                    </button>
                    {/* <button
                      onClick={() => setShowVerifyModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100">
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Verify Assignment
                    </button> */}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowMessageModal(true)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                      Message
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
          <AddMentorNoteModal
            isOpen={showMentorNoteModal}
            onClose={() => setShowMentorNoteModal(false)}
            student={modalStudent}
            onSuccess={() => {}}
          />
          <VerifyAssignmentModal
            isOpen={showVerifyModal}
            onClose={() => setShowVerifyModal(false)}
            student={modalStudent}
            onSuccess={() => {}}
          />
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        student={modalStudent}
      />

      {/* Message Modal */}
      <MessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        student={modalStudent}
      />
    </div>
  );
};

export default StudentProfileDrawer;