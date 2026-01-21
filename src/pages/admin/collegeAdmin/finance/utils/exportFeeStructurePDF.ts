import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FeeStructure } from '../types';

const getYearLabel = (semester: number) => {
  if (semester === 1) return '1st Year';
  if (semester === 2) return '2nd Year';
  if (semester === 3) return '3rd Year';
  return `${semester}th Year`;
};

export const exportFeeStructurePDF = (structure: FeeStructure, collegeName?: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFillColor(37, 99, 235); // Blue
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(collegeName || 'Fee Structure', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Academic Year: ${structure.academic_year}`, pageWidth / 2, 30, { align: 'center' });

  yPos = 55;

  // Program Details Section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Fee Structure Details', 14, yPos);
  yPos += 10;

  // Info table
  const infoData = [
    ['Program/Stream', structure.program_name],
    ['Year', getYearLabel(structure.semester)],
    ['Category', structure.category],
    ['Quota', structure.quota],
    ['Status', structure.is_active ? 'Active' : 'Inactive'],
    [
      'Effective From',
      structure.effective_from ? new Date(structure.effective_from).toLocaleDateString() : '-',
    ],
    [
      'Effective To',
      structure.effective_to ? new Date(structure.effective_to).toLocaleDateString() : 'Ongoing',
    ],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: infoData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, textColor: [100, 100, 100] },
      1: { cellWidth: 100 },
    },
    margin: { left: 14 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Fee Heads Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Fee Heads Breakdown', 14, yPos);
  yPos += 8;

  const feeHeadsData = (structure.fee_heads || []).map((head) => [
    head.name,
    head.is_mandatory ? 'Mandatory' : 'Optional',
    `₹${(head.amount || 0).toLocaleString()}`,
  ]);

  const totalAmount = (structure.fee_heads || []).reduce((sum, h) => sum + (h.amount || 0), 0);

  autoTable(doc, {
    startY: yPos,
    head: [['Fee Head', 'Type', 'Amount']],
    body: feeHeadsData,
    foot: [['Total Amount', '', `₹${totalAmount.toLocaleString()}`]],
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [219, 234, 254], textColor: [30, 64, 175], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 40, halign: 'center' },
      2: { cellWidth: 50, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Due Schedule Table (if exists)
  if ((structure.due_schedule || []).length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Schedule', 14, yPos);
    yPos += 8;

    const scheduleData = (structure.due_schedule || []).map((s) => [
      `Installment ${s.installment}`,
      s.due_date ? new Date(s.due_date).toLocaleDateString() : '-',
      `₹${(s.amount || 0).toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Installment', 'Due Date', 'Amount']],
      body: scheduleData,
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 60, halign: 'center' },
        2: { cellWidth: 50, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Scholarship & Discount Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Scholarship & Discount', 14, yPos);
  yPos += 8;

  const discountData = [
    ['Scholarship Applicable', structure.scholarship_applicable ? 'Yes' : 'No'],
    [
      'Scholarship Amount',
      structure.scholarship_applicable
        ? `₹${(structure.scholarship_amount || 0).toLocaleString()}`
        : 'N/A',
    ],
    ['Discount Percentage', `${structure.discount_percentage || 0}%`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: discountData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60, textColor: [100, 100, 100] },
      1: { cellWidth: 60 },
    },
    margin: { left: 14 },
  });

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 10, {
    align: 'center',
  });

  // Save PDF
  const fileName = `Fee_Structure_${structure.program_name.replace(/\s+/g, '_')}_${structure.academic_year.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};
