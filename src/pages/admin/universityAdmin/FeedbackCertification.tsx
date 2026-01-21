import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChevronDownIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface FeedbackRecord {
  id: string;
  facultyName: string;
  facultyId: string;
  collegeName: string;
  department: string;
  subject: string;
  semester: string;
  academicYear: string;
  feedbackType: 'student' | 'peer' | 'admin';
  rating: number;
  comments: string;
  submittedBy: string;
  submissionDate: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  certificationEligible: boolean;
}

interface CertificationRecord {
  id: string;
  facultyName: string;
  facultyId: string;
  collegeName: string;
  certificationType: string;
  issueDate: string;
  validUntil: string;
  status: 'active' | 'expired' | 'revoked';
  downloadUrl: string;
}

interface FeedbackFormData {
  facultyId: string;
  facultyName: string;
  collegeName: string;
  department: string;
  subject: string;
  semester: string;
  academicYear: string;
  feedbackType: 'student' | 'peer' | 'admin';
  rating: number;
  comments: string;
  submittedBy: string;
}

interface CertificateFormData {
  facultyId: string;
  facultyName: string;
  collegeName: string;
  certificationType: string;
  validityPeriod: string; // in months
  remarks: string;
}

const FeedbackCertification: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'feedback' | 'certification'>('feedback');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedFeedbackType, setSelectedFeedbackType] = useState('');
  const [selectedCertificationType, setSelectedCertificationType] = useState('');
  const [selectedCertificationStatus, setSelectedCertificationStatus] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('');
  const [selectedValidityStatus, setSelectedValidityStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showCertificationModal, setShowCertificationModal] = useState(false);
  const [showAddFeedbackModal, setShowAddFeedbackModal] = useState(false);
  const [showIssueCertificateModal, setShowIssueCertificateModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FeedbackRecord | CertificationRecord | null>(
    null
  );

  // Form data states
  const [feedbackFormData, setFeedbackFormData] = useState<FeedbackFormData>({
    facultyId: '',
    facultyName: '',
    collegeName: '',
    department: '',
    subject: '',
    semester: '',
    academicYear: '2024-25',
    feedbackType: 'student',
    rating: 5,
    comments: '',
    submittedBy: '',
  });

  const [certificateFormData, setCertificateFormData] = useState<CertificateFormData>({
    facultyId: '',
    facultyName: '',
    collegeName: '',
    certificationType: '',
    validityPeriod: '12',
    remarks: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data for feedback records
  const [feedbackRecords] = useState<FeedbackRecord[]>([
    {
      id: '1',
      facultyName: 'Dr. Rajesh Kumar',
      facultyId: 'FAC001',
      collegeName: 'Government College of Engineering',
      department: 'Computer Science',
      subject: 'Data Structures',
      semester: 'III',
      academicYear: '2024-25',
      feedbackType: 'student',
      rating: 4.5,
      comments: 'Excellent teaching methodology and clear explanations.',
      submittedBy: 'Student Batch CS-III',
      submissionDate: '2024-12-15',
      status: 'approved',
      certificationEligible: true,
    },
    {
      id: '2',
      facultyName: 'Prof. Priya Sharma',
      facultyId: 'FAC002',
      collegeName: 'Anna University Regional Campus',
      department: 'Electronics',
      subject: 'Digital Electronics',
      semester: 'IV',
      academicYear: '2024-25',
      feedbackType: 'peer',
      rating: 4.2,
      comments: 'Good collaboration and innovative teaching methods.',
      submittedBy: 'Dr. Suresh Babu',
      submissionDate: '2024-12-10',
      status: 'reviewed',
      certificationEligible: true,
    },
    {
      id: '3',
      facultyName: 'Dr. Arun Krishnan',
      facultyId: 'FAC003',
      collegeName: 'PSG College of Technology',
      department: 'Mechanical',
      subject: 'Thermodynamics',
      semester: 'V',
      academicYear: '2024-25',
      feedbackType: 'admin',
      rating: 3.8,
      comments: 'Needs improvement in student engagement techniques.',
      submittedBy: 'HOD Mechanical',
      submissionDate: '2024-12-08',
      status: 'pending',
      certificationEligible: false,
    },
  ]);

  // Mock data for certification records
  const [certificationRecords] = useState<CertificationRecord[]>([
    {
      id: '1',
      facultyName: 'Dr. Rajesh Kumar',
      facultyId: 'FAC001',
      collegeName: 'Government College of Engineering',
      certificationType: 'Excellence in Teaching Award',
      issueDate: '2024-11-15',
      validUntil: '2025-11-15',
      status: 'active',
      downloadUrl: '/certificates/cert_001.pdf',
    },
    {
      id: '2',
      facultyName: 'Prof. Priya Sharma',
      facultyId: 'FAC002',
      collegeName: 'Anna University Regional Campus',
      certificationType: 'Innovation in Pedagogy Certificate',
      issueDate: '2024-10-20',
      validUntil: '2025-10-20',
      status: 'active',
      downloadUrl: '/certificates/cert_002.pdf',
    },
    {
      id: '3',
      facultyName: 'Dr. Meera Nair',
      facultyId: 'FAC004',
      collegeName: 'Coimbatore Institute of Technology',
      certificationType: 'Research Excellence Award',
      issueDate: '2023-12-01',
      validUntil: '2024-12-01',
      status: 'expired',
      downloadUrl: '/certificates/cert_003.pdf',
    },
    {
      id: '4',
      facultyName: 'Dr. Suresh Babu',
      facultyId: 'FAC005',
      collegeName: 'PSG College of Technology',
      certificationType: 'Professional Development Certificate',
      issueDate: '2024-12-01',
      validUntil: '2025-01-15',
      status: 'active',
      downloadUrl: '/certificates/cert_004.pdf',
    },
    {
      id: '5',
      facultyName: 'Prof. Lakshmi Devi',
      facultyId: 'FAC006',
      collegeName: 'Thiagarajar College of Engineering',
      certificationType: 'Industry Collaboration Award',
      issueDate: '2024-09-10',
      validUntil: '2025-09-10',
      status: 'active',
      downloadUrl: '/certificates/cert_005.pdf',
    },
    {
      id: '6',
      facultyName: 'Dr. Karthik Raman',
      facultyId: 'FAC007',
      collegeName: 'Government College of Engineering',
      certificationType: 'Student Mentorship Award',
      issueDate: '2024-08-15',
      validUntil: '2024-12-31',
      status: 'active',
      downloadUrl: '/certificates/cert_006.pdf',
    },
    {
      id: '7',
      facultyName: 'Prof. Anitha Kumari',
      facultyId: 'FAC008',
      collegeName: 'Anna University Regional Campus',
      certificationType: 'Excellence in Teaching Award',
      issueDate: '2023-06-20',
      validUntil: '2024-06-20',
      status: 'expired',
      downloadUrl: '/certificates/cert_007.pdf',
    },
    {
      id: '8',
      facultyName: 'Dr. Venkatesh Kumar',
      facultyId: 'FAC009',
      collegeName: 'Coimbatore Institute of Technology',
      certificationType: 'Research Excellence Award',
      issueDate: '2024-11-01',
      validUntil: '2025-11-01',
      status: 'revoked',
      downloadUrl: '/certificates/cert_008.pdf',
    },
  ]);

  // Mock data for colleges
  const colleges = [
    'Government College of Engineering',
    'Anna University Regional Campus',
    'PSG College of Technology',
    'Coimbatore Institute of Technology',
    'Thiagarajar College of Engineering',
  ];

  const departments = [
    'Computer Science',
    'Electronics',
    'Mechanical',
    'Civil',
    'Electrical',
    'Information Technology',
  ];

  const feedbackTypes = ['student', 'peer', 'admin'];
  const statuses = ['pending', 'reviewed', 'approved', 'rejected'];
  const certificationTypes = [
    'Excellence in Teaching Award',
    'Innovation in Pedagogy Certificate',
    'Research Excellence Award',
    'Professional Development Certificate',
    'Industry Collaboration Award',
    'Student Mentorship Award',
  ];
  const certificationStatuses = ['active', 'expired', 'revoked'];
  const dateRanges = [
    { value: 'last_month', label: 'Last Month' },
    { value: 'last_3_months', label: 'Last 3 Months' },
    { value: 'last_6_months', label: 'Last 6 Months' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'all_time', label: 'All Time' },
  ];
  const validityStatuses = [
    { value: 'valid', label: 'Currently Valid' },
    { value: 'expiring_soon', label: 'Expiring Soon (30 days)' },
    { value: 'expired', label: 'Expired' },
  ];

  // Filter functions
  const filteredFeedbackRecords = feedbackRecords.filter((record) => {
    const matchesSearch =
      record.facultyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.collegeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCollege = !selectedCollege || record.collegeName === selectedCollege;
    const matchesDepartment = !selectedDepartment || record.department === selectedDepartment;
    const matchesStatus = !selectedStatus || record.status === selectedStatus;
    const matchesFeedbackType =
      !selectedFeedbackType || record.feedbackType === selectedFeedbackType;

    return (
      matchesSearch && matchesCollege && matchesDepartment && matchesStatus && matchesFeedbackType
    );
  });

  const filteredCertificationRecords = certificationRecords.filter((record) => {
    const matchesSearch =
      record.facultyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.collegeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.certificationType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCollege = !selectedCollege || record.collegeName === selectedCollege;
    const matchesCertificationType =
      !selectedCertificationType || record.certificationType === selectedCertificationType;
    const matchesCertificationStatus =
      !selectedCertificationStatus || record.status === selectedCertificationStatus;

    // Date range filtering
    let matchesDateRange = true;
    if (selectedDateRange) {
      const issueDate = new Date(record.issueDate);
      const now = new Date();
      const diffTime = now.getTime() - issueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch (selectedDateRange) {
        case 'last_month':
          matchesDateRange = diffDays <= 30;
          break;
        case 'last_3_months':
          matchesDateRange = diffDays <= 90;
          break;
        case 'last_6_months':
          matchesDateRange = diffDays <= 180;
          break;
        case 'last_year':
          matchesDateRange = diffDays <= 365;
          break;
        case 'all_time':
        default:
          matchesDateRange = true;
          break;
      }
    }

    // Validity status filtering
    let matchesValidityStatus = true;
    if (selectedValidityStatus) {
      const validUntil = new Date(record.validUntil);
      const now = new Date();
      const diffTime = validUntil.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch (selectedValidityStatus) {
        case 'valid':
          matchesValidityStatus = diffDays > 30 && record.status === 'active';
          break;
        case 'expiring_soon':
          matchesValidityStatus = diffDays <= 30 && diffDays > 0 && record.status === 'active';
          break;
        case 'expired':
          matchesValidityStatus = diffDays <= 0 || record.status === 'expired';
          break;
        default:
          matchesValidityStatus = true;
          break;
      }
    }

    return (
      matchesSearch &&
      matchesCollege &&
      matchesCertificationType &&
      matchesCertificationStatus &&
      matchesDateRange &&
      matchesValidityStatus
    );
  });

  const handleSelectRecord = (recordId: string) => {
    setSelectedRecords((prev) =>
      prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]
    );
  };

  const handleViewRecord = (record: FeedbackRecord | CertificationRecord) => {
    setSelectedRecord(record);
    if ('rating' in record) {
      setShowFeedbackModal(true);
    } else {
      setShowCertificationModal(true);
    }
  };

  const handleEditRecord = (recordId: string) => {
    // Simulate edit functionality
    alert(`Edit functionality for record ${recordId} - This would open an edit modal`);
  };

  const handleDeleteRecord = (recordId: string) => {
    // Simulate delete functionality
    if (confirm('Are you sure you want to delete this record?')) {
      alert(`Delete functionality for record ${recordId} - This would remove the record`);
    }
  };

  const handleDownloadCertificate = (record: CertificationRecord) => {
    // Create a downloadable certificate document
    const certificateContent = generateCertificateContent(record);
    const blob = new Blob([certificateContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${record.certificationType.replace(/\s+/g, '_')}_${record.facultyName.replace(/\s+/g, '_')}_${record.issueDate}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // Show success message
    alert(
      `Certificate downloaded successfully: ${record.certificationType} for ${record.facultyName}`
    );
  };

  const handlePrintCertificate = (record: CertificationRecord) => {
    // Create a printable certificate
    const certificateContent = generateCertificateContent(record);
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      printWindow.document.write(certificateContent);
      printWindow.document.close();

      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    } else {
      alert('Please allow popups to print certificates');
    }
  };

  const generateCertificateContent = (record: CertificationRecord): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate - ${record.certificationType}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .certificate {
            background: white;
            padding: 60px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 800px;
            width: 100%;
            border: 8px solid #f8f9fa;
            position: relative;
        }
        .certificate::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            border: 3px solid #667eea;
            border-radius: 10px;
        }
        .header {
            margin-bottom: 40px;
        }
        .university-name {
            font-size: 28px;
            font-weight: bold;
            color: #2d3748;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .certificate-title {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            margin: 30px 0;
            text-transform: uppercase;
            letter-spacing: 3px;
        }
        .certificate-type {
            font-size: 24px;
            color: #4a5568;
            margin: 20px 0;
            font-style: italic;
        }
        .recipient-section {
            margin: 40px 0;
        }
        .presented-to {
            font-size: 18px;
            color: #718096;
            margin-bottom: 10px;
        }
        .recipient-name {
            font-size: 32px;
            font-weight: bold;
            color: #2d3748;
            margin: 20px 0;
            border-bottom: 2px solid #667eea;
            display: inline-block;
            padding-bottom: 10px;
        }
        .faculty-details {
            font-size: 16px;
            color: #4a5568;
            margin: 20px 0;
            line-height: 1.6;
        }
        .dates-section {
            margin: 40px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .date-item {
            text-align: center;
        }
        .date-label {
            font-size: 14px;
            color: #718096;
            margin-bottom: 5px;
        }
        .date-value {
            font-size: 16px;
            font-weight: bold;
            color: #2d3748;
        }
        .signature-section {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .signature {
            text-align: center;
            border-top: 2px solid #2d3748;
            padding-top: 10px;
            min-width: 200px;
        }
        .signature-title {
            font-size: 14px;
            color: #718096;
            margin-top: 5px;
        }
        .seal {
            width: 80px;
            height: 80px;
            border: 3px solid #667eea;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: #667eea;
            font-weight: bold;
            text-align: center;
            line-height: 1.2;
        }
        .certificate-id {
            position: absolute;
            bottom: 20px;
            right: 30px;
            font-size: 12px;
            color: #a0aec0;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .certificate {
                box-shadow: none;
                border: 2px solid #000;
            }
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">
            <div class="university-name">University Administration</div>
            <div class="certificate-title">Certificate</div>
            <div class="certificate-type">${record.certificationType}</div>
        </div>
        
        <div class="recipient-section">
            <div class="presented-to">This is to certify that</div>
            <div class="recipient-name">${record.facultyName}</div>
            <div class="faculty-details">
                Faculty ID: ${record.facultyId}<br>
                ${record.collegeName}
            </div>
        </div>
        
        <div class="faculty-details">
            has been awarded this certificate in recognition of outstanding performance 
            and dedication in their professional capacity.
        </div>
        
        <div class="dates-section">
            <div class="date-item">
                <div class="date-label">Issue Date</div>
                <div class="date-value">${new Date(record.issueDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}</div>
            </div>
            <div class="date-item">
                <div class="date-label">Valid Until</div>
                <div class="date-value">${new Date(record.validUntil).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}</div>
            </div>
        </div>
        
        <div class="signature-section">
            <div class="signature">
                <div class="signature-title">University Registrar</div>
            </div>
            <div class="seal">
                OFFICIAL<br>SEAL
            </div>
            <div class="signature">
                <div class="signature-title">Vice Chancellor</div>
            </div>
        </div>
        
        <div class="certificate-id">
            Certificate ID: CERT-${record.id}-${new Date().getFullYear()}
        </div>
    </div>
</body>
</html>`;
  };

  const handleUpdateStatus = (recordId: string, newStatus: string) => {
    // Simulate status update
    alert(`Status updated to "${newStatus}" for record ${recordId}`);
    setShowFeedbackModal(false);
    setShowCertificationModal(false);
  };

  const handleBulkAction = () => {
    if (selectedRecords.length === 0) {
      alert('Please select records to perform bulk action');
      return;
    }
    alert(
      `Bulk action for ${selectedRecords.length} records - This would open bulk action options`
    );
  };

  const handleExportRecords = () => {
    if (selectedRecords.length === 0) {
      alert('Please select records to export');
      return;
    }

    if (activeTab === 'feedback') {
      exportFeedbackRecords();
    } else {
      exportCertificationRecords();
    }
  };

  const exportFeedbackRecords = () => {
    const selectedFeedback = feedbackRecords.filter((record) =>
      selectedRecords.includes(record.id)
    );

    // Create CSV content
    const headers = [
      'Faculty Name',
      'Faculty ID',
      'College',
      'Department',
      'Subject',
      'Semester',
      'Academic Year',
      'Feedback Type',
      'Rating',
      'Comments',
      'Submitted By',
      'Submission Date',
      'Status',
    ];

    const csvContent = [
      headers.join(','),
      ...selectedFeedback.map((record) =>
        [
          `"${record.facultyName}"`,
          `"${record.facultyId}"`,
          `"${record.collegeName}"`,
          `"${record.department}"`,
          `"${record.subject}"`,
          `"${record.semester}"`,
          `"${record.academicYear}"`,
          `"${record.feedbackType}"`,
          record.rating,
          `"${record.comments.replace(/"/g, '""')}"`,
          `"${record.submittedBy}"`,
          `"${record.submissionDate}"`,
          `"${record.status}"`,
        ].join(',')
      ),
    ].join('\n');

    downloadCSV(csvContent, `feedback_records_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportCertificationRecords = () => {
    const selectedCertifications = certificationRecords.filter((record) =>
      selectedRecords.includes(record.id)
    );

    // Create CSV content
    const headers = [
      'Faculty Name',
      'Faculty ID',
      'College',
      'Certificate Type',
      'Issue Date',
      'Valid Until',
      'Status',
      'Download URL',
    ];

    const csvContent = [
      headers.join(','),
      ...selectedCertifications.map((record) =>
        [
          `"${record.facultyName}"`,
          `"${record.facultyId}"`,
          `"${record.collegeName}"`,
          `"${record.certificationType}"`,
          `"${record.issueDate}"`,
          `"${record.validUntil}"`,
          `"${record.status}"`,
          `"${record.downloadUrl}"`,
        ].join(',')
      ),
    ].join('\n');

    downloadCSV(csvContent, `certification_records_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`Exported ${selectedRecords.length} records to ${filename}`);
  };

  const handlePrintFeedbackReport = (record: FeedbackRecord) => {
    const reportContent = generateFeedbackReportContent(record);
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      printWindow.document.write(reportContent);
      printWindow.document.close();

      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    } else {
      alert('Please allow popups to print feedback reports');
    }
  };

  const handleDownloadFeedbackReport = (record: FeedbackRecord) => {
    const reportContent = generateFeedbackReportContent(record);
    const blob = new Blob([reportContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `Feedback_Report_${record.facultyName.replace(/\s+/g, '_')}_${record.submissionDate}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    alert(`Feedback report downloaded for ${record.facultyName}`);
  };

  const generateFeedbackReportContent = (record: FeedbackRecord): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Feedback Report - ${record.facultyName}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 40px;
            background-color: #f8f9fa;
            color: #333;
            line-height: 1.6;
        }
        .report {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 20px;
        }
        .report-title {
            font-size: 28px;
            font-weight: bold;
            color: #4f46e5;
            margin-bottom: 10px;
        }
        .report-subtitle {
            font-size: 16px;
            color: #6b7280;
        }
        .section {
            margin: 30px 0;
        }
        .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 15px;
            border-left: 4px solid #4f46e5;
            padding-left: 15px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .info-item {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            border-left: 3px solid #4f46e5;
        }
        .info-label {
            font-weight: bold;
            color: #374151;
            margin-bottom: 5px;
        }
        .info-value {
            color: #6b7280;
        }
        .rating-section {
            background: #fef3c7;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin: 20px 0;
        }
        .rating-stars {
            font-size: 24px;
            color: #f59e0b;
            margin: 10px 0;
        }
        .rating-value {
            font-size: 32px;
            font-weight: bold;
            color: #92400e;
        }
        .comments-section {
            background: #f0f9ff;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #0ea5e9;
        }
        .comments-text {
            font-style: italic;
            color: #374151;
            font-size: 16px;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-approved { background: #d1fae5; color: #065f46; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-reviewed { background: #dbeafe; color: #1e40af; }
        .status-rejected { background: #fee2e2; color: #991b1b; }
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        @media print {
            body { background: white; padding: 20px; }
            .report { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="report">
        <div class="header">
            <div class="report-title">Faculty Feedback Report</div>
            <div class="report-subtitle">Generated on ${new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</div>
        </div>

        <div class="section">
            <div class="section-title">Faculty Information</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Faculty Name</div>
                    <div class="info-value">${record.facultyName}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Faculty ID</div>
                    <div class="info-value">${record.facultyId}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">College</div>
                    <div class="info-value">${record.collegeName}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Department</div>
                    <div class="info-value">${record.department}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Course Information</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Subject</div>
                    <div class="info-value">${record.subject}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Semester</div>
                    <div class="info-value">${record.semester}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Academic Year</div>
                    <div class="info-value">${record.academicYear}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Feedback Type</div>
                    <div class="info-value">${record.feedbackType.charAt(0).toUpperCase() + record.feedbackType.slice(1)}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Rating & Feedback</div>
            <div class="rating-section">
                <div class="rating-stars">${'★'.repeat(Math.floor(record.rating))}${'☆'.repeat(5 - Math.floor(record.rating))}</div>
                <div class="rating-value">${record.rating.toFixed(1)}/5.0</div>
            </div>
            <div class="comments-section">
                <div class="info-label">Comments</div>
                <div class="comments-text">"${record.comments}"</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Submission Details</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Submitted By</div>
                    <div class="info-value">${record.submittedBy}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Submission Date</div>
                    <div class="info-value">${new Date(record.submissionDate).toLocaleDateString()}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Status</div>
                    <div class="info-value">
                        <span class="status-badge status-${record.status}">${record.status}</span>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">Certification Eligible</div>
                    <div class="info-value">${record.certificationEligible ? 'Yes' : 'No'}</div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>This is an automatically generated report from the University Faculty Feedback System.</p>
            <p>Report ID: FB-${record.id}-${new Date().getFullYear()}</p>
        </div>
    </div>
</body>
</html>`;
  };

  const handleAddFeedback = () => {
    setShowAddFeedbackModal(true);
  };

  const handleIssueCertificate = () => {
    setShowIssueCertificateModal(true);
  };

  const handleSubmitFeedback = async () => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Here you would make the actual API call to save the feedback
      console.log('Submitting feedback:', feedbackFormData);

      // Reset form and close modal
      setFeedbackFormData({
        facultyId: '',
        facultyName: '',
        collegeName: '',
        department: '',
        subject: '',
        semester: '',
        academicYear: '2024-25',
        feedbackType: 'student',
        rating: 5,
        comments: '',
        submittedBy: '',
      });
      setShowAddFeedbackModal(false);
      alert('Feedback submitted successfully!');
    } catch (error) {
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitCertificate = async () => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Here you would make the actual API call to issue the certificate
      console.log('Issuing certificate:', certificateFormData);

      // Reset form and close modal
      setCertificateFormData({
        facultyId: '',
        facultyName: '',
        collegeName: '',
        certificationType: '',
        validityPeriod: '12',
        remarks: '',
      });
      setShowIssueCertificateModal(false);
      alert('Certificate issued successfully!');
    } catch (error) {
      alert('Failed to issue certificate. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCollege('');
    setSelectedDepartment('');
    setSelectedStatus('');
    setSelectedFeedbackType('');
    setSelectedCertificationType('');
    setSelectedCertificationStatus('');
    setSelectedDateRange('');
    setSelectedValidityStatus('');
  };

  const hasActiveFilters =
    searchTerm ||
    selectedCollege ||
    selectedDepartment ||
    selectedStatus ||
    selectedFeedbackType ||
    selectedCertificationType ||
    selectedCertificationStatus ||
    selectedDateRange ||
    selectedValidityStatus;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Calculate pagination
  const currentRecords =
    activeTab === 'feedback' ? filteredFeedbackRecords : filteredCertificationRecords;
  const totalPages = Math.ceil(currentRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRecords = currentRecords.slice(startIndex, endIndex);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedCollege,
    selectedDepartment,
    selectedStatus,
    selectedFeedbackType,
    selectedCertificationType,
    selectedCertificationStatus,
    selectedDateRange,
    selectedValidityStatus,
    activeTab,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIconSolid
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
      reviewed: { color: 'bg-blue-100 text-blue-800', icon: EyeIcon },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircleIcon },
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      expired: { color: 'bg-red-100 text-red-800', icon: XCircleIcon },
      revoked: { color: 'bg-gray-100 text-gray-800', icon: XCircleIcon },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <IconComponent className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const FeedbackModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Feedback Details</h3>
          <button
            onClick={() => setShowFeedbackModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        {selectedRecord && 'rating' in selectedRecord && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Faculty Information
                </label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p>
                    <strong>Name:</strong> {selectedRecord.facultyName}
                  </p>
                  <p>
                    <strong>ID:</strong> {selectedRecord.facultyId}
                  </p>
                  <p>
                    <strong>College:</strong> {selectedRecord.collegeName}
                  </p>
                  <p>
                    <strong>Department:</strong> {selectedRecord.department}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Information
                </label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p>
                    <strong>Subject:</strong> {selectedRecord.subject}
                  </p>
                  <p>
                    <strong>Semester:</strong> {selectedRecord.semester}
                  </p>
                  <p>
                    <strong>Academic Year:</strong> {selectedRecord.academicYear}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback Details
              </label>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span>
                    <strong>Type:</strong> {selectedRecord.feedbackType}
                  </span>
                  <span>
                    <strong>Rating:</strong> {renderStars(selectedRecord.rating)}
                  </span>
                </div>
                <p>
                  <strong>Submitted by:</strong> {selectedRecord.submittedBy}
                </p>
                <p>
                  <strong>Date:</strong>{' '}
                  {new Date(selectedRecord.submissionDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>Status:</strong> {getStatusBadge(selectedRecord.status)}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p>{selectedRecord.comments}</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handlePrintFeedbackReport(selectedRecord)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 flex items-center transition-colors"
              >
                <PrinterIcon className="h-4 w-4 mr-2" />
                Print Report
              </button>
              <button
                onClick={() => handleDownloadFeedbackReport(selectedRecord)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Download Report
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedRecord.id, 'approved')}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedRecord.id, 'rejected')}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedRecord.id, 'reviewed')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Mark as Reviewed
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const CertificationModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Certification Details</h3>
          <button
            onClick={() => setShowCertificationModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        {selectedRecord && 'certificationType' in selectedRecord && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">{selectedRecord.certificationType}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p>
                  <strong>Faculty:</strong> {selectedRecord.facultyName}
                </p>
                <p>
                  <strong>Faculty ID:</strong> {selectedRecord.facultyId}
                </p>
                <p>
                  <strong>College:</strong> {selectedRecord.collegeName}
                </p>
                <p>
                  <strong>Issue Date:</strong>{' '}
                  {new Date(selectedRecord.issueDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>Valid Until:</strong>{' '}
                  {new Date(selectedRecord.validUntil).toLocaleDateString()}
                </p>
                <p>
                  <strong>Status:</strong> {getStatusBadge(selectedRecord.status)}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCertificationModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handlePrintCertificate(selectedRecord)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 flex items-center transition-colors"
              >
                <PrinterIcon className="h-4 w-4 mr-2" />
                Print
              </button>
              <button
                onClick={() => handleDownloadCertificate(selectedRecord)}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 flex items-center transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Download Certificate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const AddFeedbackModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Add New Feedback</h3>
          <button
            onClick={() => setShowAddFeedbackModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Faculty ID</label>
              <input
                type="text"
                value={feedbackFormData.facultyId}
                onChange={(e) =>
                  setFeedbackFormData((prev) => ({ ...prev, facultyId: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter faculty ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Faculty Name</label>
              <input
                type="text"
                value={feedbackFormData.facultyName}
                onChange={(e) =>
                  setFeedbackFormData((prev) => ({ ...prev, facultyName: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter faculty name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
              <select
                value={feedbackFormData.collegeName}
                onChange={(e) =>
                  setFeedbackFormData((prev) => ({ ...prev, collegeName: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select College</option>
                {colleges.map((college) => (
                  <option key={college} value={college}>
                    {college}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                value={feedbackFormData.department}
                onChange={(e) =>
                  setFeedbackFormData((prev) => ({ ...prev, department: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                value={feedbackFormData.subject}
                onChange={(e) =>
                  setFeedbackFormData((prev) => ({ ...prev, subject: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter subject name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
              <select
                value={feedbackFormData.semester}
                onChange={(e) =>
                  setFeedbackFormData((prev) => ({ ...prev, semester: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select Semester</option>
                {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
              <input
                type="text"
                value={feedbackFormData.academicYear}
                onChange={(e) =>
                  setFeedbackFormData((prev) => ({ ...prev, academicYear: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., 2024-25"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Feedback Type</label>
              <select
                value={feedbackFormData.feedbackType}
                onChange={(e) =>
                  setFeedbackFormData((prev) => ({
                    ...prev,
                    feedbackType: e.target.value as 'student' | 'peer' | 'admin',
                  }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="student">Student Feedback</option>
                <option value="peer">Peer Review</option>
                <option value="admin">Administrative Review</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="1"
                max="5"
                step="0.1"
                value={feedbackFormData.rating}
                onChange={(e) =>
                  setFeedbackFormData((prev) => ({ ...prev, rating: parseFloat(e.target.value) }))
                }
                className="flex-1"
              />
              <span className="text-sm font-medium text-gray-700 w-12">
                {feedbackFormData.rating.toFixed(1)}
              </span>
            </div>
            <div className="mt-2">{renderStars(feedbackFormData.rating)}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
            <textarea
              value={feedbackFormData.comments}
              onChange={(e) =>
                setFeedbackFormData((prev) => ({ ...prev, comments: e.target.value }))
              }
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter detailed feedback comments..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Submitted By</label>
            <input
              type="text"
              value={feedbackFormData.submittedBy}
              onChange={(e) =>
                setFeedbackFormData((prev) => ({ ...prev, submittedBy: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter submitter name/designation"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => setShowAddFeedbackModal(false)}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitFeedback}
              disabled={
                isSubmitting ||
                !feedbackFormData.facultyId ||
                !feedbackFormData.facultyName ||
                !feedbackFormData.collegeName
              }
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              Submit Feedback
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const IssueCertificateModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Issue New Certificate</h3>
          <button
            onClick={() => setShowIssueCertificateModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Faculty ID</label>
              <input
                type="text"
                value={certificateFormData.facultyId}
                onChange={(e) =>
                  setCertificateFormData((prev) => ({ ...prev, facultyId: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter faculty ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Faculty Name</label>
              <input
                type="text"
                value={certificateFormData.facultyName}
                onChange={(e) =>
                  setCertificateFormData((prev) => ({ ...prev, facultyName: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter faculty name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
            <select
              value={certificateFormData.collegeName}
              onChange={(e) =>
                setCertificateFormData((prev) => ({ ...prev, collegeName: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select College</option>
              {colleges.map((college) => (
                <option key={college} value={college}>
                  {college}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Type</label>
            <select
              value={certificateFormData.certificationType}
              onChange={(e) =>
                setCertificateFormData((prev) => ({ ...prev, certificationType: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select Certificate Type</option>
              {certificationTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Validity Period</label>
            <select
              value={certificateFormData.validityPeriod}
              onChange={(e) =>
                setCertificateFormData((prev) => ({ ...prev, validityPeriod: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="6">6 Months</option>
              <option value="12">1 Year</option>
              <option value="24">2 Years</option>
              <option value="36">3 Years</option>
              <option value="60">5 Years</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks (Optional)
            </label>
            <textarea
              value={certificateFormData.remarks}
              onChange={(e) =>
                setCertificateFormData((prev) => ({ ...prev, remarks: e.target.value }))
              }
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter any additional remarks or notes..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => setShowIssueCertificateModal(false)}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitCertificate}
              disabled={
                isSubmitting ||
                !certificateFormData.facultyId ||
                !certificateFormData.facultyName ||
                !certificateFormData.collegeName ||
                !certificateFormData.certificationType
              }
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              <AcademicCapIcon className="h-4 w-4 mr-2" />
              Issue Certificate
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Faculty Feedback & Certification</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage faculty feedback collection and certification processes across affiliated colleges
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('feedback')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'feedback'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DocumentTextIcon className="h-5 w-5 inline mr-2" />
            Feedback Management
          </button>
          <button
            onClick={() => setActiveTab('certification')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'certification'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <AcademicCapIcon className="h-5 w-5 inline mr-2" />
            Certification Records
          </button>
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab === 'feedback' ? 'feedback records' : 'certifications'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center transition-colors"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
            <ChevronDownIcon
              className={`h-4 w-4 ml-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`}
            />
          </button>
          <button
            onClick={activeTab === 'feedback' ? handleAddFeedback : handleIssueCertificate}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            {activeTab === 'feedback' ? 'Add Feedback' : 'Issue Certificate'}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-700">Filter Options</h3>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>

            {activeTab === 'feedback' ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                  <select
                    value={selectedCollege}
                    onChange={(e) => setSelectedCollege(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  >
                    <option value="">All Colleges</option>
                    {colleges.map((college) => (
                      <option key={college} value={college}>
                        {college}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback Type
                  </label>
                  <select
                    value={selectedFeedbackType}
                    onChange={(e) => setSelectedFeedbackType(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  >
                    <option value="">All Types</option>
                    {feedbackTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  >
                    <option value="">All Statuses</option>
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                  <select
                    value={selectedCollege}
                    onChange={(e) => setSelectedCollege(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  >
                    <option value="">All Colleges</option>
                    {colleges.map((college) => (
                      <option key={college} value={college}>
                        {college}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Certificate Type
                  </label>
                  <select
                    value={selectedCertificationType}
                    onChange={(e) => setSelectedCertificationType(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  >
                    <option value="">All Certificate Types</option>
                    {certificationTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={selectedCertificationStatus}
                    onChange={(e) => setSelectedCertificationStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  >
                    <option value="">All Statuses</option>
                    {certificationStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                  <select
                    value={selectedDateRange}
                    onChange={(e) => setSelectedDateRange(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  >
                    <option value="">All Dates</option>
                    {dateRanges.map((range) => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Validity Status
                  </label>
                  <select
                    value={selectedValidityStatus}
                    onChange={(e) => setSelectedValidityStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  >
                    <option value="">All Validity</option>
                    {validityStatuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                add
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-800">Active Filters:</span>
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Search: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedCollege && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    College: {selectedCollege}
                    <button
                      onClick={() => setSelectedCollege('')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {activeTab === 'feedback' && selectedDepartment && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Department: {selectedDepartment}
                    <button
                      onClick={() => setSelectedDepartment('')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {activeTab === 'feedback' && selectedFeedbackType && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Type: {selectedFeedbackType}
                    <button
                      onClick={() => setSelectedFeedbackType('')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {activeTab === 'feedback' && selectedStatus && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Status: {selectedStatus}
                    <button
                      onClick={() => setSelectedStatus('')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {activeTab === 'certification' && selectedCertificationType && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Certificate: {selectedCertificationType}
                    <button
                      onClick={() => setSelectedCertificationType('')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {activeTab === 'certification' && selectedCertificationStatus && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Status: {selectedCertificationStatus}
                    <button
                      onClick={() => setSelectedCertificationStatus('')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {activeTab === 'certification' && selectedDateRange && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Date: {dateRanges.find((r) => r.value === selectedDateRange)?.label}
                    <button
                      onClick={() => setSelectedDateRange('')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {activeTab === 'certification' && selectedValidityStatus && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Validity:{' '}
                    {validityStatuses.find((s) => s.value === selectedValidityStatus)?.label}
                    <button
                      onClick={() => setSelectedValidityStatus('')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Action Bar */}
      {selectedRecords.length > 0 && (
        <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-indigo-700">
              {selectedRecords.length}{' '}
              {activeTab === 'feedback' ? 'feedback record(s)' : 'certification(s)'} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleBulkAction}
                className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition-colors"
              >
                Bulk Action
              </button>
              <button
                onClick={handleExportRecords}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Filter Buttons */}
      {activeTab === 'certification' && (
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 self-center">Quick Filters:</span>
          <button
            onClick={() => setSelectedValidityStatus('valid')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedValidityStatus === 'valid'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            Currently Valid
          </button>
          <button
            onClick={() => setSelectedValidityStatus('expiring_soon')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedValidityStatus === 'expiring_soon'
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            Expiring Soon
          </button>
          <button
            onClick={() => setSelectedValidityStatus('expired')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedValidityStatus === 'expired'
                ? 'bg-red-100 text-red-800 border border-red-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            Expired
          </button>
          <button
            onClick={() => setSelectedDateRange('last_month')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedDateRange === 'last_month'
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            Last Month
          </button>
          <button
            onClick={() => setSelectedCertificationType('Excellence in Teaching Award')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedCertificationType === 'Excellence in Teaching Award'
                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            Teaching Awards
          </button>
          {(selectedValidityStatus || selectedDateRange || selectedCertificationType) && (
            <button
              onClick={() => {
                setSelectedValidityStatus('');
                setSelectedDateRange('');
                setSelectedCertificationType('');
              }}
              className="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
            >
              Clear Quick Filters
            </button>
          )}
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 self-center">Quick Filters:</span>
          <button
            onClick={() => setSelectedStatus('pending')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedStatus === 'pending'
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setSelectedStatus('approved')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedStatus === 'approved'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setSelectedFeedbackType('student')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedFeedbackType === 'student'
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            Student Feedback
          </button>
          <button
            onClick={() => {
              // Filter for high ratings (4.0 and above)
              alert('High ratings filter - This would filter feedback with rating >= 4.0');
            }}
            className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 transition-colors"
          >
            High Ratings (4.0+)
          </button>
          {(selectedStatus || selectedFeedbackType) && (
            <button
              onClick={() => {
                setSelectedStatus('');
                setSelectedFeedbackType('');
              }}
              className="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
            >
              Clear Quick Filters
            </button>
          )}
        </div>
      )}

      {/* Results Summary */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {currentRecords.length}{' '}
          {activeTab === 'feedback' ? 'feedback record(s)' : 'certification(s)'}
          {hasActiveFilters && <span className="text-indigo-600 font-medium"> (filtered)</span>}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            onChange={(e) => {
              // Sort functionality would be implemented here
              alert(`Sort by: ${e.target.value}`);
            }}
          >
            <option value="name">Faculty Name</option>
            <option value="college">College</option>
            <option value="date">Date</option>
            {activeTab === 'feedback' && <option value="rating">Rating</option>}
            {activeTab === 'certification' && <option value="type">Certificate Type</option>}
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Faculty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  College
                </th>
                {activeTab === 'feedback' ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Certificate Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeTab === 'feedback'
                ? paginatedRecords.map((record) => {
                    const feedbackRecord = record as FeedbackRecord;
                    return (
                      <tr key={feedbackRecord.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedRecords.includes(feedbackRecord.id)}
                            onChange={() => handleSelectRecord(feedbackRecord.id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <UserIcon className="h-8 w-8 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {feedbackRecord.facultyName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {feedbackRecord.facultyId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{feedbackRecord.collegeName}</div>
                          <div className="text-sm text-gray-500">{feedbackRecord.department}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{feedbackRecord.subject}</div>
                          <div className="text-sm text-gray-500">
                            Sem {feedbackRecord.semester} • {feedbackRecord.academicYear}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {feedbackRecord.feedbackType}
                          </span>
                        </td>
                        <td className="px-6 py-4">{renderStars(feedbackRecord.rating)}</td>
                        <td className="px-6 py-4">{getStatusBadge(feedbackRecord.status)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewRecord(feedbackRecord)}
                              className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handlePrintFeedbackReport(feedbackRecord)}
                              className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-colors"
                              title="Print Report"
                            >
                              <PrinterIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadFeedbackReport(feedbackRecord)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="Download Report"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditRecord(feedbackRecord.id)}
                              className="text-amber-600 hover:text-amber-900 p-1 rounded hover:bg-amber-50 transition-colors"
                              title="Edit Record"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(feedbackRecord.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Delete Record"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                : paginatedRecords.map((record) => {
                    const certRecord = record as CertificationRecord;
                    return (
                      <tr key={certRecord.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedRecords.includes(certRecord.id)}
                            onChange={() => handleSelectRecord(certRecord.id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <UserIcon className="h-8 w-8 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {certRecord.facultyName}
                              </div>
                              <div className="text-sm text-gray-500">{certRecord.facultyId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{certRecord.collegeName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {certRecord.certificationType}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {new Date(certRecord.issueDate).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            Valid until {new Date(certRecord.validUntil).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(certRecord.status)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewRecord(certRecord)}
                              className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handlePrintCertificate(certRecord)}
                              className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-colors"
                              title="Print Certificate"
                            >
                              <PrinterIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadCertificate(certRecord)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                              title="Download Certificate"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {currentRecords.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No {activeTab === 'feedback' ? 'feedback records' : 'certifications'} found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'feedback'
                ? 'Get started by adding a new feedback record.'
                : 'Get started by issuing a new certificate.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {currentRecords.length > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-b-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(endIndex, currentRecords.length)}</span> of{' '}
                <span className="font-medium">{currentRecords.length}</span> results
              </p>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showFeedbackModal && <FeedbackModal />}
      {showCertificationModal && <CertificationModal />}
      {showAddFeedbackModal && <AddFeedbackModal />}
      {showIssueCertificateModal && <IssueCertificateModal />}
    </div>
  );
};

export default FeedbackCertification;
