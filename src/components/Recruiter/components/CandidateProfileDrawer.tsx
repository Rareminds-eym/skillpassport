/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/Recruiter/components/CandidateProfileDrawer.tsx
import React, { useEffect, useState } from 'react';
import {
  XMarkIcon,
  StarIcon,
  MapPinIcon,
  AcademicCapIcon,
  PhoneIcon,
  EnvelopeIcon,
  BookmarkIcon,
  CalendarDaysIcon,
  DocumentArrowDownIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  TrophyIcon,
  BriefcaseIcon,
  BeakerIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import AddToShortlistModal from '../modals/AddToShortlistModal';
import ScheduleInterviewModal from '../modals/ScheduleInterviewModal';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../../lib/supabaseClient';
import { File } from 'lucide-react';
// import { useAuth } from '../../../context/AuthContext';

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

const ProgressBar = ({ label, value, maxValue = 100 }) => (
  <div className="mb-3">
    <div className="flex justify-between items-center mb-1">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}/{maxValue}</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-primary-600 h-2 rounded-full"
        style={{ width: `${(value / maxValue) * 100}%` }}
      ></div>
    </div>
  </div>
);

const ExportModal = ({ isOpen, onClose, candidate }) => {
  const [exportSettings, setExportSettings] = useState({
    format: 'pdf',
    type: 'mini_profile'
  });

  const generatePDF = (candidate, settings) => {
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
    doc.text(`CANDIDATE PROFILE - ${candidate.name}`, margin, yPos);
    yPos += 10;

    // Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Export Type: ${isFullProfile ? 'Full Profile with PII' : 'Mini-Profile'}`, margin, yPos);
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
      { label: 'Name', value: candidate.name },
      { label: 'Registration Number', value: candidate.registration_number },
      { label: 'Date of Birth', value: candidate.date_of_birth },
      { label: 'Age', value: candidate.age },
      { label: 'University', value: candidate.university || candidate.college },
      { label: 'College/School', value: candidate.college_school_name || candidate.college },
      { label: 'Department', value: candidate.dept || candidate.branch_field },
      { label: 'Course', value: candidate.course },
      { label: 'District', value: candidate.district_name || candidate.location },
      { label: 'Year', value: candidate.year },
    ];

    if (isFullProfile) {
      basicFields.push(
        { label: 'Email', value: candidate.email },
        { label: 'Phone', value: candidate.phone },
        { label: 'Alternate Number', value: candidate.alternate_number }
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
      { label: 'Branch/Field', value: candidate.branch_field },
      { label: 'Trainer Name', value: candidate.trainer_name },
      { label: 'NM ID', value: candidate.nm_id },
      { label: 'AI Score', value: candidate.ai_score_overall },
      { label: 'CGPA', value: candidate.cgpa },
      { label: 'Year of Passing', value: candidate.year_of_passing },
      { label: 'Employability Score', value: candidate.employability_score },
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
    if (candidate.skills && candidate.skills.length > 0) {
      checkNewPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('SKILLS', margin, yPos);
      yPos += lineHeight + 2;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const skillsText = candidate.skills.join(', ');
      const splitSkills = doc.splitTextToSize(skillsText, pageWidth - (margin * 2) - 5);
      splitSkills.forEach(line => {
        checkNewPage();
        doc.text(line, margin + 5, yPos);
        yPos += lineHeight;
      });
      yPos += 3;
    }

    // Additional Information (if in full profile mode)
    if (isFullProfile) {
      checkNewPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('ADDITIONAL INFORMATION', margin, yPos);
      yPos += lineHeight + 2;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const additionalFields = [
        { label: 'Imported At', value: candidate.imported_at },
        { label: 'Last Updated', value: candidate.last_updated },
        { label: 'Created At', value: candidate.created_at },
        { label: 'Verified', value: candidate.verified ? 'Yes' : 'No' },
      ];

      additionalFields.forEach(field => {
        if (field.value) {
          checkNewPage();
          doc.text(`${field.label}: ${field.value}`, margin + 5, yPos);
          yPos += lineHeight;
        }
      });
      yPos += 3;
    }

    // Verification Badges
    if (candidate.badges && candidate.badges.length > 0) {
      checkNewPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('VERIFICATION', margin, yPos);
      yPos += lineHeight + 2;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(candidate.badges.join(', '), margin + 5, yPos);
      yPos += lineHeight + 3;
    }

    // Footer on all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('--- Exported from RecruiterHub ---', pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    }

    return doc;
  };

  const generateCSV = (candidate, settings) => {
    const isFullProfile = settings.type === 'full_profile';

    // Build comprehensive headers
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
      'AI Score',
      'CGPA',
      'Year of Passing',
      'Employability Score',
      'Skills',
      'Verification Badges',
      'Verified'
    );

    if (isFullProfile) {
      headers.push(
        'Imported At',
        'Last Updated',
        'Created At'
      );
    }

    let csvContent = headers.join(',') + '\n';

    // Escape function for CSV
    const escapeCSV = (value) => {
      if (value === null || value === undefined || value === '') return '""';
      const str = String(value);
      // Escape quotes and wrap in quotes
      return `"${str.replace(/"/g, '""')}"`;
    };

    // Build row data
    const row = [
      escapeCSV(candidate.name),
      escapeCSV(candidate.registration_number),
      escapeCSV(candidate.date_of_birth),
      escapeCSV(candidate.age),
      escapeCSV(candidate.university || candidate.college),
      escapeCSV(candidate.college_school_name || candidate.college),
      escapeCSV(candidate.dept || candidate.branch_field),
      escapeCSV(candidate.course),
      escapeCSV(candidate.branch_field),
      escapeCSV(candidate.district_name || candidate.location),
      escapeCSV(candidate.year),
    ];

    if (isFullProfile) {
      row.push(
        escapeCSV(candidate.email),
        escapeCSV(candidate.phone),
        escapeCSV(candidate.alternate_number),
        escapeCSV(candidate.trainer_name),
        escapeCSV(candidate.nm_id)
      );
    }

    row.push(
      escapeCSV(candidate.ai_score_overall),
      escapeCSV(candidate.cgpa),
      escapeCSV(candidate.year_of_passing),
      escapeCSV(candidate.employability_score),
      escapeCSV(candidate.skills?.join('; ')),
      escapeCSV(candidate.badges?.join('; ')),
      escapeCSV(candidate.verified ? 'Yes' : 'No')
    );

    if (isFullProfile) {
      row.push(
        escapeCSV(candidate.imported_at),
        escapeCSV(candidate.last_updated),
        escapeCSV(candidate.created_at)
      );
    }

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
    const filename = `${candidate.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;

    if (exportSettings.format === 'csv') {
      const content = generateCSV(candidate, exportSettings);
      downloadFile(content, filename + '.csv', 'csv');
    } else {
      const pdfDoc = generatePDF(candidate, exportSettings);
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
            <h3 className="text-lg font-medium text-gray-900">Export Candidate Profile</h3>
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
                  <span className="ml-2 text-sm text-gray-700">Mini-Profile</span>
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

const MessageModal = ({ isOpen, onClose, candidate }) => {
  if (!isOpen) return null;

  const handleWhatsApp = () => {
    const phone = candidate.phone?.replace(/[^0-9]/g, '') || '';
    const message = encodeURIComponent(`Hi ${candidate.name}, I came across your profile on RecruiterHub...`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    onClose();
  };

  const handleSMS = () => {
    const phone = candidate.phone?.replace(/[^0-9]/g, '') || '';
    window.location.href = `sms:${phone}`;
    onClose();
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('Opportunity from RecruiterHub');
    const body = encodeURIComponent(`Dear ${candidate.name},\n\nI came across your profile on RecruiterHub and would like to discuss a potential opportunity...\n\nBest regards`);
    window.location.href = `mailto:${candidate.email}?subject=${subject}&body=${body}`;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Contact {candidate.name}</h3>
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
                <span>{candidate.phone || 'Not available'}</span>
              </div>
              <div className="flex items-center">
                <EnvelopeIcon className="h-3 w-3 mr-1" />
                <span>{candidate.email || 'Not available'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CandidateProfileDrawer = ({ candidate, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const [showShortlistModal, setShowShortlistModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [projects, setProjects] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  // Fetch projects and certificates when student changes

  useEffect(() => {
    if (!candidate?.id) return;

    // Reset states
    setProjects([]);
    setCertificates([]);
    setAssessments([]);

    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('student_id', candidate.id)
          .eq('approval_status', 'verified')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProjects(data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    const fetchCertificates = async () => {
      setLoadingCertificates(true);
      try {
        const { data, error } = await supabase
          .from('certificates')
          .select('*')
          .eq('student_id', candidate.id)
          .eq('approval_status', 'verified')
          .order('issued_on', { ascending: false });

        if (error) throw error;
        setCertificates(data || []);
      } catch (error) {
        console.error('Error fetching certificates:', error);
        setCertificates([]);
      } finally {
        setLoadingCertificates(false);
      }
    };

    const fetchAssignemts = async () => {
      setLoadingAssessments(true);
      try {
        const { data, error } = await supabase
          .from('student_assignments')
          .select(`
              *,
              assignments (
                title,
                description,
                course_name,
                course_code,
                assignment_type,
                due_date,
                total_points,
                skill_outcomes,
                educator_name
              )
            `)
          .eq('student_id', candidate.id)
          .eq('is_deleted', false)
          .order('updated_date', { ascending: false });

        if (error) throw error;
        setAssessments(data || []);
      } catch (error) {
        console.error('Error fetching assignments:', error);
        setAssessments([]);
      } finally {
        setLoadingAssessments(false);
      }
    };

    fetchProjects();
    fetchCertificates();
    fetchAssignemts();
  }, [candidate?.id]);



  if (!isOpen || !candidate) return null;

  const candidateName = (candidate as any).name || (candidate as any).candidate_name || '';
  const candidateEmail = (candidate as any).email || (candidate as any).candidate_email || '';

  const qrCodeValue = `${window.location.origin}/student/profile/${candidateEmail}`;

  // Parse profile data if it's a string/object and prepare helpers
  let profileData: any = candidate;
  let rawProfile: any = {};

  if (candidate.profile && typeof candidate.profile === 'string') {
    try {
      rawProfile = JSON.parse(candidate.profile);
      profileData = { ...candidate, ...rawProfile };
    } catch (e) {
      rawProfile = {};
      profileData = candidate;
    }
  } else if (candidate.profile && typeof candidate.profile === 'object') {
    rawProfile = candidate.profile;
    profileData = { ...candidate, ...rawProfile };
  }

  const projectsData = projects;
  const certificatesData = certificates;
  const assessmentsData = assessments;

  const verifiedProjects = projectsData.filter((project: any) => project?.verified === true || project?.status === 'verified');
  const verifiedCertificates = certificatesData.filter((certificate: any) => certificate?.verified === true || certificate?.status === 'verified');

  profileData = {
    ...profileData,
    projects: verifiedProjects,
    certificates: verifiedCertificates,
    assessments: assessmentsData
  };

  const modalCandidate = {
    ...candidate,
    name: candidateName,
    email: candidateEmail,
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

  // Build lists of fields from the JSONB profile
  const knownComposite = new Set(['training', 'education', 'technicalSkills', 'softSkills', 'experience', 'projects', 'certificates', 'assessments']);
  // Fields to exclude from Profile Information display (metadata/internal fields)
  const excludedFields = new Set([
    '_', 'imported_at', 'contact_number_dial_code', 'id', 'student_id',
    'created_at', 'updated_at', 'last_updated'
  ]);

  const primitiveEntries = Object.entries(rawProfile || {})
    .filter(([k, v]) => !knownComposite.has(k) && !excludedFields.has(k) && isPrimitive(v) && !isEmpty(v))
    .sort(([a], [b]) => a.localeCompare(b));

  const otherArrays = Object.entries(rawProfile || {})
    .filter(([k, v]) => Array.isArray(v) && !knownComposite.has(k));

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'projects', label: 'Projects' },
    { key: 'assessments', label: 'Assessments' },
    { key: 'certificates', label: 'Certificates' },
    { key: 'verification', label: 'Verification' },
    { key: 'notes', label: 'Notes & Ratings' }
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
                      <h2 className="text-xl font-semibold text-gray-900">{profileData.name || candidate.name}</h2>
                      <div className="ml-3 flex items-center">
                        <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
                        <span className="text-lg font-bold text-gray-900 ml-1">{candidate.ai_score_overall || 0}</span>
                        <span className="text-sm text-gray-600 ml-1">AI Score</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-600">
                      <AcademicCapIcon className="h-4 w-4 mr-1" />
                      <span>{profileData.college_school_name || candidate.college} • {profileData.branch_field || candidate.dept}</span>
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      <span>{profileData.district_name || candidate.location} • Age {profileData.age || 'N/A'}</span>
                    </div>
                    {candidate.badges && candidate.badges.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {candidate.badges.map((badge, index) => (
                          <Badge key={index} type={badge} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right side — QR code */}
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

                    {/* Hover text / scan hint */}
                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[11px] bg-gray-800 text-white rounded-md px-2 py-1 bottom-[-30px] whitespace-nowrap shadow-md">
                      {copied ? '✅ Link copied!' : '📱 Scan or click to copy'}
                    </div>

                    {/* Static caption */}
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
                    <span>{profileData.contact_number || candidate.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <EnvelopeIcon className="h-4 w-4 mr-1" />
                    <span>{profileData.email || candidate.email}</span>
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
                          {/* Composite summaries inside Profile Information */}
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
                      {loadingProjects ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                          <p className="text-gray-500 mt-2">Loading projects...</p>
                        </div>
                      ) : projects && projects.length > 0 ? (
                        projects.map((project: any, index: number) => {
                          const techStack = project.tech_stack
                            ? Array.isArray(project.tech_stack)
                              ? project.tech_stack
                              : project.tech_stack.split(',').map((t: string) => t.trim())
                            : [];

                          const statusText = project.status
                            ? project.status.charAt(0).toUpperCase() + project.status.slice(1).toLowerCase()
                            : 'Unknown';

                          const approvalBadgeColor =
                            project.approval_status === 'verified'
                              ? 'bg-green-100 text-green-800'
                              : project.approval_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800';

                          return (
                            <div
                              key={project.id || index}
                              className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  {/* Title + Status */}
                                  <div className="flex items-center flex-wrap gap-2">
                                    <h4 className="font-medium text-gray-900">
                                      {project.title || `Project ${index + 1}`}
                                    </h4>

                                    {project.status && (
                                      <span
                                        className={`px-2 py-0.5 text-xs rounded-full ${project.status.toLowerCase() === 'completed'
                                          ? 'bg-green-100 text-green-800'
                                          : project.status.toLowerCase() === 'ongoing'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-gray-100 text-gray-800'
                                          }`}
                                      >
                                        {statusText}
                                      </span>
                                    )}

                                    {project.approval_status && (
                                      <span
                                        className={`px-2 py-0.5 text-xs rounded-full ${approvalBadgeColor}`}
                                      >
                                        {project.approval_status.charAt(0).toUpperCase() +
                                          project.approval_status.slice(1)}
                                      </span>
                                    )}
                                  </div>

                                  {/* Duration */}
                                  {project.duration && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      <span className="font-medium">Duration:</span> {project.duration}
                                    </p>
                                  )}

                                  {/* Description */}
                                  {project.description ? (
                                    <p className="text-sm text-gray-600 mt-2">{project.description}</p>
                                  ) : (
                                    <p className="text-sm text-gray-400 mt-2 italic">
                                      No description provided.
                                    </p>
                                  )}

                                  {/* Tech Stack */}
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

                                  {/* Links */}
                                  <div className="flex flex-wrap gap-4 mt-3">
                                    {project.demo_link && (
                                      <a
                                        href={project.demo_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center"
                                      >
                                        Demo →
                                      </a>
                                    )}
                                    {project.github_link && (
                                      <a
                                        href={project.github_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center"
                                      >
                                        GitHub →
                                      </a>
                                    )}
                                  </div>

                                  {/* Verified / Updated */}
                                  {project.updated_at && (
                                    <p className="text-xs text-gray-400 mt-2">
                                      Last updated on:{' '}
                                      {formatDateValue(project.updated_at || project.created_at)}
                                    </p>
                                  )}
                                </div>

                                {/* Icon */}
                                <BeakerIcon className="h-6 w-6 text-gray-400 ml-4 flex-shrink-0" />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-12">
                          <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="text-gray-500 mt-2">No projects available</p>
                          <p className="text-gray-400 text-sm mt-1">
                            Student hasn't added any projects yet
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}


                {/* Assessments Tab */}
                {activeTab === 'assessments' && (
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Assignments & Assessments
                    </h3>

                    <div className="space-y-4">
                      {loadingAssessments ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                          <p className="text-gray-500 mt-2">Loading assignments...</p>
                        </div>
                      ) : assessments && assessments.length > 0 ? (
                        assessments.map((assessment: any, index: number) => {
                          const assignment = assessment.assignments || {};
                          const statusColors: Record<string, string> = {
                            todo: 'bg-gray-100 text-gray-800',
                            'in-progress': 'bg-blue-100 text-blue-800',
                            submitted: 'bg-yellow-100 text-yellow-800',
                            graded: 'bg-green-100 text-green-800',
                          };
                          const priorityColors: Record<string, string> = {
                            low: 'bg-gray-100 text-gray-800',
                            medium: 'bg-yellow-100 text-yellow-800',
                            high: 'bg-red-100 text-red-800',
                          };

                          return (
                            <div
                              key={assessment.student_assignment_id || index}
                              className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  {/* Title + Course */}
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <h4 className="font-medium text-gray-900">
                                        {assignment?.title || `Assignment ${index + 1}`}
                                      </h4>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {assignment?.course_name}{' '}
                                        {assignment?.course_code && `(${assignment.course_code})`}
                                      </p>
                                    </div>

                                    {/* Grades */}
                                    <div className="flex flex-col items-end space-y-1">
                                      {assessment.grade_percentage && (
                                        <span className="text-lg font-bold text-primary-600">
                                          {assessment.grade_percentage}%
                                        </span>
                                      )}
                                      {assessment.grade_received && (
                                        <span className="text-sm text-gray-600">
                                          {assessment.grade_received}/
                                          {assignment?.total_points || 100} pts
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Status / Priority / Type */}
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span
                                      className={`px-2 py-1 text-xs rounded-full ${statusColors[assessment.status] ||
                                        'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                      {assessment.status
                                        ? assessment.status.replace('-', ' ').toUpperCase()
                                        : 'UNKNOWN'}
                                    </span>
                                    {assessment.priority && (
                                      <span
                                        className={`px-2 py-1 text-xs rounded-full ${priorityColors[assessment.priority] ||
                                          'bg-gray-100 text-gray-800'
                                          }`}
                                      >
                                        {assessment.priority.toUpperCase()}
                                      </span>
                                    )}
                                    {assignment.assignment_type && (
                                      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                                        {assignment.assignment_type.toUpperCase()}
                                      </span>
                                    )}
                                  </div>

                                  {/* Dates */}
                                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-gray-500">
                                    <div>
                                      <span className="font-medium">Assigned:</span>{' '}
                                      {assessment.assigned_date
                                        ? new Date(
                                          assessment.assigned_date
                                        ).toLocaleDateString()
                                        : 'N/A'}
                                    </div>
                                    <div>
                                      <span className="font-medium">Due:</span>{' '}
                                      {assignment?.due_date
                                        ? new Date(assignment.due_date).toLocaleDateString()
                                        : 'N/A'}
                                    </div>
                                    {assessment.submission_date && (
                                      <div>
                                        <span className="font-medium">Submitted:</span>{' '}
                                        {new Date(
                                          assessment.submission_date
                                        ).toLocaleDateString()}
                                      </div>
                                    )}
                                    {assessment.graded_date && (
                                      <div>
                                        <span className="font-medium">Graded:</span>{' '}
                                        {new Date(
                                          assessment.graded_date
                                        ).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>

                                  {/* Feedback */}
                                  {assessment.instructor_feedback && (
                                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                                      <p className="text-xs font-medium text-blue-800">
                                        Instructor Feedback:
                                      </p>
                                      <p className="text-xs text-blue-700 mt-1">
                                        {assessment.instructor_feedback}
                                      </p>
                                    </div>
                                  )}

                                  {/* Late submission */}
                                  {assessment.is_late && (
                                    <div className="mt-2">
                                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                                        Late Submission{' '}
                                        {assessment.late_penalty
                                          ? `(-${assessment.late_penalty}%)`
                                          : ''}
                                      </span>
                                    </div>
                                  )}

                                  {/* Skill Outcomes */}
                                  {assignment.skill_outcomes &&
                                    Array.isArray(assignment.skill_outcomes) &&
                                    assignment.skill_outcomes.length > 0 && (
                                      <div className="mt-3">
                                        <p className="text-xs font-medium text-gray-700 mb-1">
                                          Skill Outcomes:
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                          {assignment.skill_outcomes.map(
                                            (skill: string, skillIndex: number) => (
                                              <span
                                                key={skillIndex}
                                                className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded"
                                              >
                                                {skill}
                                              </span>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-12">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <p className="text-gray-500 mt-2">No assignments available</p>
                          <p className="text-gray-400 text-sm mt-1">
                            Assignments will appear here once assigned.
                          </p>
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
                      {loadingCertificates ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                          <p className="text-gray-500 mt-2">Loading certificates...</p>
                        </div>
                      ) : certificates && certificates.length > 0 ? (
                        certificates.map((cert: any, index: number) => (
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
                                      {cert.issued_on && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          Issue Date: {new Date(cert.issued_on).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>

                                    {cert.credential_id && (
                                      <p className="text-xs text-gray-400 mt-2">ID: {cert.credential_id}</p>
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
                        {candidate.badges && candidate.badges.length > 0 ? (
                          candidate.badges.map((badge: string, index: number) => {
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
                        {/* Education Verification */}
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

                        {/* Training Verification */}
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

                        {/* Skills Verification */}
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

                        {/* Profile Import Info */}
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

                {activeTab === 'notes' && (
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Notes & Ratings</h3>
                    {/* Rating */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Rating
                      </label>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`h-8 w-8 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                          >
                            <StarIcon className={star <= rating ? 'fill-current' : ''} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Add your notes about this candidate..."
                      />
                    </div>

                    {/* Team Notes */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Team Notes</h4>
                      <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">Sarah Johnson</span>
                            <span className="text-xs text-gray-500">2 days ago</span>
                          </div>
                          <p className="text-sm text-gray-700">
                            Strong technical skills, particularly impressed with the food safety project.
                            Good communication during preliminary screening.
                          </p>
                          <div className="flex items-center mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <StarIcon
                                key={star}
                                className={`h-4 w-4 ${star <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                            <span className="text-sm text-gray-600 ml-2">4/5</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-3">
                    {/* <button
                      onClick={() => setShowShortlistModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100">
                      <BookmarkIcon className="h-4 w-4 mr-2" />
                      Add to Shortlist
                    </button> */}
                    <button
                      onClick={() => setShowInterviewModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100">
                      <CalendarDaysIcon className="h-4 w-4 mr-2" />
                      Schedule Interview
                    </button>
                    <button
                      // onClick={() => setShowVerifyModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100">
                      <File className="h-4 w-4 mr-2" />
                      View Portfolio
                    </button>
                    {/* <button
                      onClick={() => setShowInterviewModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      <CalendarDaysIcon className="h-4 w-4 mr-2" />
                      Schedule Interview
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
          <AddToShortlistModal
            isOpen={showShortlistModal}
            onClose={() => setShowShortlistModal(false)}
            candidate={modalCandidate}
            onSuccess={() => { }}
          />
          <ScheduleInterviewModal
            isOpen={showInterviewModal}
            onClose={() => setShowInterviewModal(false)}
            candidate={modalCandidate}
            onSuccess={() => { }}
          />
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        candidate={modalCandidate}
      />

      {/* Message Modal */}
      <MessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        candidate={modalCandidate}
      />
    </div>
  );
};

export default CandidateProfileDrawer;