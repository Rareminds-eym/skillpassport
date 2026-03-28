import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import { Student } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, student }) => {
  const [exportSettings, setExportSettings] = useState({
    format: 'pdf',
    type: 'application_summary'
  });

  const generatePDF = (student: Student, _settings: any) => {
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
      { label: 'Contact Number', value: student.contact_number || student.contactNumber || student.phone },
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
      { label: 'Applied Class', value: student.grade },
      { label: 'Subjects', value: student.subjects ? student.subjects.join(', ') : 'N/A' },
      { label: 'Application Status', value: student.admission_status?.toUpperCase() || student.approval_status?.toUpperCase() },
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

  const generateCSV = (student: Student) => {
    const headers = [
      'Name',
      'Email',
      'Contact Number',
      'Date of Birth',
      'Applied Class',
      'Subjects',
      'Admission Status',
      'Applied Date'
    ];

    const escapeCSV = (value: any) => {
      if (value === null || value === undefined || value === '') return '""';
      const str = String(value);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const row = [
      escapeCSV(student.name),
      escapeCSV(student.email),
      escapeCSV(student.contact_number || student.contactNumber || student.phone),
      escapeCSV(student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : ''),
      escapeCSV(student.grade),
      escapeCSV(student.subjects ? student.subjects.join('; ') : ''),
      escapeCSV(student.admission_status || student.approval_status),
      escapeCSV(student.applied_date ? new Date(student.applied_date).toLocaleDateString() : '')
    ];

    const csvContent = headers.join(',') + '\n' + row.join(',') + '\n';
    return csvContent;
  };

  const downloadFile = (content: any, filename: string, format: string) => {
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

export default ExportModal;