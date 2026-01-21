import React, { useState } from 'react';
import { X, Download, FileText, User, Users, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Faculty, CollegeClass, ScheduleSlot, TimePeriod, Break } from '../../types';
import { DAYS } from '../../constants';
import { formatDate, isHoliday, getHolidayName } from '../../utils';

interface ExportModalProps {
  isOpen: boolean;
  weekDates: Date[];
  periods: TimePeriod[];
  slots: ScheduleSlot[];
  breaks: Break[];
  faculty: Faculty[];
  classes: CollegeClass[];
  onClose: () => void;
}

type ExportType = 'current' | 'faculty' | 'class';

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  weekDates,
  periods,
  slots,
  breaks,
  faculty,
  classes,
  onClose,
}) => {
  const [exportType, setExportType] = useState<ExportType>('current');
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [exporting, setExporting] = useState(false);

  if (!isOpen) return null;

  const getFacultyName = (id: string) => {
    const f = faculty.find((f) => f.id === id);
    return f ? `${f.first_name} ${f.last_name}` : '';
  };

  const getClassName = (id: string) => {
    const c = classes.find((c) => c.id === id);
    return c ? `${c.grade}-${c.section}` : '';
  };

  const getClassFullName = (id: string) => {
    const c = classes.find((c) => c.id === id);
    return c ? `${c.name} (${c.grade}-${c.section})` : '';
  };

  const generatePDF = async () => {
    setExporting(true);

    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      let title = 'Timetable';
      let subtitle = '';

      if (exportType === 'faculty' && selectedFacultyId) {
        title = `Faculty Timetable - ${getFacultyName(selectedFacultyId)}`;
        subtitle = 'Weekly Schedule';
      } else if (exportType === 'class' && selectedClassId) {
        title = `Class Timetable - ${getClassFullName(selectedClassId)}`;
        subtitle = 'Weekly Schedule';
      } else {
        title = 'College Timetable';
        subtitle = `Week: ${formatDate(weekDates[0])} - ${formatDate(weekDates[5])}, ${weekDates[0].getFullYear()}`;
      }

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(title, pageWidth / 2, 15, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, pageWidth / 2, 22, { align: 'center' });

      // Filter slots based on export type
      let filteredSlots = slots;
      if (exportType === 'faculty' && selectedFacultyId) {
        filteredSlots = slots.filter((s) => s.educator_id === selectedFacultyId);
      } else if (exportType === 'class' && selectedClassId) {
        filteredSlots = slots.filter((s) => s.class_id === selectedClassId);
      }

      // Build table data
      const tableHead = [
        [
          'Time',
          ...DAYS.map((day, i) => {
            const date = weekDates[i];
            const holiday = isHoliday(date, breaks);
            return holiday
              ? `${day}\n${formatDate(date)}\n(${getHolidayName(date, breaks)})`
              : `${day}\n${formatDate(date)}`;
          }),
        ],
      ];

      const tableBody = periods
        .filter((p) => !p.is_break)
        .map((period) => {
          const row = [`${period.period_name}\n${period.start_time}-${period.end_time}`];

          DAYS.forEach((_, dayIndex) => {
            const date = weekDates[dayIndex];
            const holiday = isHoliday(date, breaks);

            if (holiday) {
              row.push('Holiday');
              return;
            }

            // Find slot for this cell
            const slot = filteredSlots.find((s) => {
              const matchesDay = s.day_of_week === dayIndex + 1;
              const matchesPeriod = s.period_number === period.period_number;
              const matchesDate =
                s.is_recurring || s.schedule_date === date.toISOString().split('T')[0];
              return matchesDay && matchesPeriod && matchesDate;
            });

            if (slot) {
              let cellContent = slot.subject_name;
              if (exportType === 'faculty') {
                cellContent += `\n${getClassName(slot.class_id)}`;
              } else if (exportType === 'class') {
                cellContent += `\n${getFacultyName(slot.educator_id)}`;
              } else {
                cellContent += `\n${getFacultyName(slot.educator_id)}\n${getClassName(slot.class_id)}`;
              }
              if (slot.room_number) {
                cellContent += `\n${slot.room_number}`;
              }
              row.push(cellContent);
            } else {
              row.push('-');
            }
          });

          return row;
        });

      // Add break rows
      periods
        .filter((p) => p.is_break)
        .forEach((period) => {
          const breakRow = [
            `${period.period_name}\n${period.start_time}-${period.end_time}`,
            ...DAYS.map(() => (period.break_type === 'lunch' ? 'Lunch Break' : 'Break')),
          ];
          // Insert at correct position
          const insertIndex = periods.findIndex((p) => p.period_number === period.period_number);
          const nonBreaksBefore = periods.slice(0, insertIndex).filter((p) => !p.is_break).length;
          tableBody.splice(nonBreaksBefore, 0, breakRow);
        });

      // Generate table
      autoTable(doc, {
        head: tableHead,
        body: tableBody,
        startY: 28,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          valign: 'middle',
          halign: 'center',
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [79, 70, 229], // Indigo
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        columnStyles: {
          0: { cellWidth: 25, halign: 'left', fontStyle: 'bold' },
        },
        didParseCell: (data) => {
          // Style break rows
          if (data.row.raw && Array.isArray(data.row.raw)) {
            const firstCell = data.row.raw[0] as string;
            if (firstCell?.includes('Break')) {
              data.cell.styles.fillColor = [254, 243, 199]; // Amber-100
              data.cell.styles.textColor = [146, 64, 14]; // Amber-800
            }
          }
          // Style holiday cells
          if (data.cell.raw === 'Holiday') {
            data.cell.styles.fillColor = [254, 226, 226]; // Red-100
            data.cell.styles.textColor = [153, 27, 27]; // Red-800
          }
        },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(
          `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save
      let filename = 'timetable';
      if (exportType === 'faculty' && selectedFacultyId) {
        filename = `timetable-${getFacultyName(selectedFacultyId).replace(/\s+/g, '-').toLowerCase()}`;
      } else if (exportType === 'class' && selectedClassId) {
        filename = `timetable-${getClassName(selectedClassId).toLowerCase()}`;
      }
      doc.save(`${filename}.pdf`);

      onClose();
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const canExport =
    exportType === 'current' ||
    (exportType === 'faculty' && selectedFacultyId) ||
    (exportType === 'class' && selectedClassId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Export Timetable</h3>
            <p className="text-sm text-gray-500 mt-1">Download timetable as PDF</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Export Type Selection */}
        <div className="space-y-3 mb-6">
          <label className="block text-sm font-medium text-gray-700">Export Type</label>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setExportType('current')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${
                exportType === 'current'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileText
                className={`h-6 w-6 ${exportType === 'current' ? 'text-indigo-600' : 'text-gray-400'}`}
              />
              <span
                className={`text-sm font-medium ${
                  exportType === 'current' ? 'text-indigo-900' : 'text-gray-700'
                }`}
              >
                Current View
              </span>
            </button>

            <button
              onClick={() => setExportType('faculty')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${
                exportType === 'faculty'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <User
                className={`h-6 w-6 ${exportType === 'faculty' ? 'text-indigo-600' : 'text-gray-400'}`}
              />
              <span
                className={`text-sm font-medium ${
                  exportType === 'faculty' ? 'text-indigo-900' : 'text-gray-700'
                }`}
              >
                By Faculty
              </span>
            </button>

            <button
              onClick={() => setExportType('class')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${
                exportType === 'class'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Users
                className={`h-6 w-6 ${exportType === 'class' ? 'text-indigo-600' : 'text-gray-400'}`}
              />
              <span
                className={`text-sm font-medium ${
                  exportType === 'class' ? 'text-indigo-900' : 'text-gray-700'
                }`}
              >
                By Class
              </span>
            </button>
          </div>
        </div>

        {/* Faculty Selection */}
        {exportType === 'faculty' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Faculty</label>
            <select
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose a faculty member</option>
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.first_name} {f.last_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Class Selection */}
        {exportType === 'class' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose a class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.grade}-{c.section})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Preview Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-600">
            <div className="font-medium text-gray-900 mb-1">Export Preview</div>
            <ul className="space-y-1 text-xs">
              <li>
                • Week: {formatDate(weekDates[0])} - {formatDate(weekDates[5])}
              </li>
              <li>• {periods.filter((p) => !p.is_break).length} periods per day</li>
              <li>
                •{' '}
                {exportType === 'faculty' && selectedFacultyId
                  ? slots.filter((s) => s.educator_id === selectedFacultyId).length
                  : exportType === 'class' && selectedClassId
                    ? slots.filter((s) => s.class_id === selectedClassId).length
                    : slots.length}{' '}
                scheduled slots
              </li>
              {exportType === 'faculty' && selectedFacultyId && (
                <li>• Faculty: {getFacultyName(selectedFacultyId)}</li>
              )}
              {exportType === 'class' && selectedClassId && (
                <li>• Class: {getClassFullName(selectedClassId)}</li>
              )}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={generatePDF}
            disabled={!canExport || exporting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
