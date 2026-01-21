/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Chapter {
  id: string;
  name: string;
  code?: string;
  description: string;
  order: number;
  estimatedDuration?: number;
  durationUnit?: 'hours' | 'weeks';
}

interface AssessmentMapping {
  assessmentType: string;
  weightage?: number;
}

interface LearningOutcome {
  id: string;
  chapterId: string;
  outcome: string;
  assessmentMappings: AssessmentMapping[];
  bloomLevel?: string;
}

interface CurriculumExportData {
  subject: string;
  class: string;
  academicYear: string;
  chapters: Chapter[];
  learningOutcomes: LearningOutcome[];
  status: string;
  schoolName?: string;
  collegeName?: string; // Added support for college context
}

/**
 * Export curriculum to PDF format
 */
export const exportCurriculumToPDF = (data: CurriculumExportData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Curriculum Document', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Metadata
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Subject: ${data.subject}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Class: ${data.class}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Academic Year: ${data.academicYear}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Status: ${data.status.toUpperCase()}`, 20, yPosition);
  yPosition += 7;
  if (data.collegeName) {
    doc.text(`Department: ${data.collegeName}`, 20, yPosition);
    yPosition += 7;
  } else if (data.schoolName) {
    doc.text(`School: ${data.schoolName}`, 20, yPosition);
    yPosition += 7;
  }
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition);
  yPosition += 15;

  // Summary Statistics
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const unitLabel = data.collegeName ? 'Units' : 'Chapters';
  doc.text(`Total ${unitLabel}: ${data.chapters.length}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Total Learning Outcomes: ${data.learningOutcomes.length}`, 20, yPosition);
  yPosition += 6;

  const totalDuration = data.chapters.reduce((sum, ch) => {
    if (ch.estimatedDuration && ch.durationUnit === 'hours') {
      return sum + ch.estimatedDuration;
    }
    return sum;
  }, 0);

  if (totalDuration > 0) {
    doc.text(`Estimated Duration: ${totalDuration} hours`, 20, yPosition);
    yPosition += 10;
  }

  // Chapters and Learning Outcomes
  data.chapters.forEach((chapter, index) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Chapter Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229); // Indigo color
    const unitLabel = data.collegeName ? 'Unit' : 'Chapter';
    const chapterTitle = `${unitLabel} ${index + 1}: ${chapter.name}`;
    doc.text(chapterTitle, 20, yPosition);
    yPosition += 8;

    // Chapter Code
    if (chapter.code) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Code: ${chapter.code}`, 20, yPosition);
      yPosition += 6;
    }

    // Chapter Description
    if (chapter.description) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const descLines = doc.splitTextToSize(chapter.description, pageWidth - 40);
      doc.text(descLines, 20, yPosition);
      yPosition += descLines.length * 5 + 3;
    }

    // Duration
    if (chapter.estimatedDuration) {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Duration: ${chapter.estimatedDuration} ${chapter.durationUnit || 'hours'}`,
        20,
        yPosition
      );
      yPosition += 8;
    }

    // Learning Outcomes for this chapter
    const chapterOutcomes = data.learningOutcomes.filter((lo) => lo.chapterId === chapter.id);

    if (chapterOutcomes.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Learning Outcomes:', 25, yPosition);
      yPosition += 7;

      chapterOutcomes.forEach((outcome, loIndex) => {
        // Check if we need a new page
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);

        // Outcome text
        const outcomeText = `${loIndex + 1}. ${outcome.outcome}`;
        const outcomeLines = doc.splitTextToSize(outcomeText, pageWidth - 50);
        doc.text(outcomeLines, 30, yPosition);
        yPosition += outcomeLines.length * 4.5 + 2;

        // Bloom's Level
        if (outcome.bloomLevel) {
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(`   Bloom's Level: ${outcome.bloomLevel}`, 30, yPosition);
          yPosition += 4;
        }

        // Assessment Mappings
        if (outcome.assessmentMappings.length > 0) {
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          const assessments = outcome.assessmentMappings
            .map((m) => `${m.assessmentType}${m.weightage ? ` (${m.weightage}%)` : ''}`)
            .join(', ');
          const assessmentLines = doc.splitTextToSize(
            `   Assessments: ${assessments}`,
            pageWidth - 50
          );
          doc.text(assessmentLines, 30, yPosition);
          yPosition += assessmentLines.length * 4 + 3;
        }

        yPosition += 2;
      });
    } else {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text('No learning outcomes defined', 25, yPosition);
      yPosition += 7;
    }

    yPosition += 5;
  });

  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, {
      align: 'center',
    });
  }

  // Save the PDF
  const fileName = `Curriculum_${data.subject}_Class${data.class}_${data.academicYear.replace(/\s+/g, '')}.pdf`;
  doc.save(fileName);
};

/**
 * Export curriculum to Excel format
 */
export const exportCurriculumToExcel = (data: CurriculumExportData): void => {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Overview
  const overviewData = [
    ['Curriculum Overview'],
    [],
    ['Subject', data.subject],
    ['Class', data.class],
    ['Academic Year', data.academicYear],
    ['Status', data.status.toUpperCase()],
    ...(data.collegeName ? [['Department', data.collegeName]] : []),
    ...(data.schoolName ? [['School', data.schoolName]] : []),
    ['Generated', new Date().toLocaleDateString()],
    [],
    ['Summary Statistics'],
    [`Total ${data.collegeName ? 'Units' : 'Chapters'}`, data.chapters.length],
    ['Total Learning Outcomes', data.learningOutcomes.length],
  ];

  const totalDuration = data.chapters.reduce((sum, ch) => {
    if (ch.estimatedDuration && ch.durationUnit === 'hours') {
      return sum + ch.estimatedDuration;
    }
    return sum;
  }, 0);

  if (totalDuration > 0) {
    overviewData.push(['Estimated Duration (hours)', totalDuration]);
  }

  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);

  // Set column widths
  overviewSheet['!cols'] = [{ wch: 25 }, { wch: 40 }];

  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');

  // Sheet 2: Units/Chapters
  const unitLabel = data.collegeName ? 'Unit' : 'Chapter';
  const chaptersData: any[][] = [
    [`${unitLabel} #`, 'Code', 'Name', 'Description', 'Duration', 'Unit', 'Outcomes Count'],
  ];

  data.chapters.forEach((chapter, index) => {
    const outcomesCount = data.learningOutcomes.filter((lo) => lo.chapterId === chapter.id).length;

    chaptersData.push([
      index + 1,
      chapter.code || '',
      chapter.name,
      chapter.description,
      chapter.estimatedDuration || '',
      chapter.durationUnit || '',
      outcomesCount,
    ]);
  });

  const chaptersSheet = XLSX.utils.aoa_to_sheet(chaptersData);

  // Set column widths
  chaptersSheet['!cols'] = [
    { wch: 10 },
    { wch: 12 },
    { wch: 30 },
    { wch: 50 },
    { wch: 10 },
    { wch: 8 },
    { wch: 15 },
  ];

  const unitSheetName = data.collegeName ? 'Units' : 'Chapters';
  XLSX.utils.book_append_sheet(workbook, chaptersSheet, unitSheetName);

  // Sheet 3: Learning Outcomes
  const outcomesData: any[][] = [
    [
      `${unitLabel} #`,
      `${unitLabel} Name`,
      'Outcome #',
      'Learning Outcome',
      "Bloom's Level",
      'Assessment Types',
      'Weightages',
    ],
  ];

  data.chapters.forEach((chapter, chapterIndex) => {
    const chapterOutcomes = data.learningOutcomes.filter((lo) => lo.chapterId === chapter.id);

    chapterOutcomes.forEach((outcome, outcomeIndex) => {
      const assessmentTypes = outcome.assessmentMappings.map((m) => m.assessmentType).join(', ');

      const weightages = outcome.assessmentMappings
        .map((m) => (m.weightage ? `${m.weightage}%` : 'N/A'))
        .join(', ');

      outcomesData.push([
        chapterIndex + 1,
        chapter.name,
        outcomeIndex + 1,
        outcome.outcome,
        outcome.bloomLevel || '',
        assessmentTypes,
        weightages,
      ]);
    });
  });

  const outcomesSheet = XLSX.utils.aoa_to_sheet(outcomesData);

  // Set column widths
  outcomesSheet['!cols'] = [
    { wch: 10 },
    { wch: 25 },
    { wch: 10 },
    { wch: 60 },
    { wch: 15 },
    { wch: 40 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(workbook, outcomesSheet, 'Learning Outcomes');

  // Sheet 4: Assessment Mappings (Detailed)
  const assessmentData: any[][] = [
    [unitLabel, 'Learning Outcome', 'Assessment Type', 'Weightage (%)'],
  ];

  data.chapters.forEach((chapter) => {
    const chapterOutcomes = data.learningOutcomes.filter((lo) => lo.chapterId === chapter.id);

    chapterOutcomes.forEach((outcome) => {
      outcome.assessmentMappings.forEach((mapping) => {
        assessmentData.push([
          chapter.name,
          outcome.outcome.substring(0, 100) + (outcome.outcome.length > 100 ? '...' : ''),
          mapping.assessmentType,
          mapping.weightage || 'N/A',
        ]);
      });
    });
  });

  const assessmentSheet = XLSX.utils.aoa_to_sheet(assessmentData);

  // Set column widths
  assessmentSheet['!cols'] = [{ wch: 25 }, { wch: 60 }, { wch: 25 }, { wch: 15 }];

  XLSX.utils.book_append_sheet(workbook, assessmentSheet, 'Assessment Mappings');

  // Save the Excel file
  const fileName = `Curriculum_${data.subject}_Class${data.class}_${data.academicYear.replace(/\s+/g, '')}.xlsx`;
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, fileName);
};

/**
 * Export curriculum in the specified format
 */
export const exportCurriculum = (format: 'pdf' | 'excel', data: CurriculumExportData): void => {
  if (format === 'pdf') {
    exportCurriculumToPDF(data);
  } else if (format === 'excel') {
    exportCurriculumToExcel(data);
  } else {
    throw new Error(`Unsupported export format: ${format}`);
  }
};
