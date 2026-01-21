import React, { useState } from 'react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface GeographicLocation {
  city: string;
  count: number;
  percentage: number;
}

interface TopCollege {
  name: string;
  count: number;
  percentage: number;
}

interface DiversityExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  geographicData: GeographicLocation[] | null;
  collegesData: TopCollege[] | null;
}

const DiversityExportModal: React.FC<DiversityExportModalProps> = ({
  isOpen,
  onClose,
  geographicData,
  collegesData,
}) => {
  const [selectedSections, setSelectedSections] = useState({
    geographic: true,
    colleges: true,
  });

  if (!isOpen) return null;

  const handleCheckboxChange = (section: 'geographic' | 'colleges') => {
    setSelectedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleExportPDF = () => {
    // Validate at least one section is selected
    if (!selectedSections.geographic && !selectedSections.colleges) {
      alert('Please select at least one section to export');
      return;
    }

    try {
      // Create PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 20;

      // Add title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Diversity & Geography Report', pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, {
        align: 'center',
      });

      yPosition += 15;

      // Export Geographic Distribution if selected
      if (selectedSections.geographic && geographicData && geographicData.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text('Geographic Distribution', 14, yPosition);
        yPosition += 5;

        // Calculate total candidates
        const totalCandidates = geographicData.reduce((sum, loc) => sum + loc.count, 0);

        // Create table data
        const tableData = geographicData.map((location) => [
          location.city,
          location.count.toString(),
          `${location.percentage}%`,
        ]);

        // Add table
        autoTable(doc, {
          startY: yPosition,
          head: [['Location', 'Candidates', 'Percentage']],
          body: tableData,
          theme: 'striped',
          headStyles: {
            fillColor: [59, 130, 246], // Blue color
            textColor: 255,
            fontStyle: 'bold',
          },
          styles: {
            fontSize: 10,
            cellPadding: 5,
          },
          margin: { left: 14, right: 14 },
        });

        // Update yPosition after table
        yPosition = (doc as any).lastAutoTable.finalY + 10;

        // Add total
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Candidates: ${totalCandidates}`, 14, yPosition);
        yPosition += 15;
      }

      // Export Top Hiring Colleges if selected
      if (selectedSections.colleges && collegesData && collegesData.length > 0) {
        // Check if we need a new page
        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text('Top Hiring Colleges', 14, yPosition);
        yPosition += 5;

        // Create table data
        const tableData = collegesData.map((college, index) => [
          (index + 1).toString(),
          college.name,
          college.count.toString(),
          `${college.percentage}%`,
        ]);

        // Add table
        autoTable(doc, {
          startY: yPosition,
          head: [['Rank', 'College/University', 'Candidates', 'Percentage']],
          body: tableData,
          theme: 'striped',
          headStyles: {
            fillColor: [34, 197, 94], // Green color
            textColor: 255,
            fontStyle: 'bold',
          },
          styles: {
            fontSize: 10,
            cellPadding: 5,
          },
          columnStyles: {
            0: { cellWidth: 15 },
          },
          margin: { left: 14, right: 14 },
        });

        // Update yPosition after table
        yPosition = (doc as any).lastAutoTable.finalY + 10;

        // Add diversity index note
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(37, 99, 235); // Blue text
        doc.text(
          `Diversity Index: Good distribution across ${collegesData.length} institutions`,
          14,
          yPosition
        );
      }

      // Add footer
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save the PDF
      const fileName = `Diversity_Geography_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      // Close modal after export
      onClose();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please check the console for details.');
    }
  };

  const isExportDisabled = !selectedSections.geographic && !selectedSections.colleges;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Export Diversity & Geography</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6">
            <p className="text-sm text-gray-600 mb-6">
              Select the sections you want to include in the PDF export:
            </p>

            <div className="space-y-4">
              {/* Geographic Distribution Checkbox */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="geographic-checkbox"
                    type="checkbox"
                    checked={selectedSections.geographic}
                    onChange={() => handleCheckboxChange('geographic')}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3">
                  <label
                    htmlFor="geographic-checkbox"
                    className="font-medium text-gray-900 cursor-pointer"
                  >
                    Geographic Distribution
                  </label>
                  <p className="text-sm text-gray-500">
                    {geographicData && geographicData.length > 0
                      ? `${geographicData.length} locations with ${geographicData.reduce((sum, loc) => sum + loc.count, 0)} total candidates`
                      : 'No data available'}
                  </p>
                </div>
              </div>

              {/* Top Hiring Colleges Checkbox */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="colleges-checkbox"
                    type="checkbox"
                    checked={selectedSections.colleges}
                    onChange={() => handleCheckboxChange('colleges')}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3">
                  <label
                    htmlFor="colleges-checkbox"
                    className="font-medium text-gray-900 cursor-pointer"
                  >
                    Top Hiring Colleges
                  </label>
                  <p className="text-sm text-gray-500">
                    {collegesData && collegesData.length > 0
                      ? `${collegesData.length} colleges/universities`
                      : 'No data available'}
                  </p>
                </div>
              </div>
            </div>

            {/* Warning message */}
            {isExportDisabled && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Please select at least one section to export.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExportDisabled}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isExportDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiversityExportModal;
