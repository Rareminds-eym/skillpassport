import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import type { UICandidate } from '../hooks/useStudents';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

/**
 * Flatten nested student data for CSV export
 */
function flattenStudentForCSV(student: UICandidate): Record<string, any> {
  return {
    // Basic Info
    'Student ID': student.id,
    'Name': student.name,
    'Email': student.email || '',
    'Phone': student.phone || '',
    'Age': student.age || '',
    'Date of Birth': student.date_of_birth || '',
    
    // Academic Info
    'College': student.college || '',
    'Department': student.dept || '',
    'University': student.university || '',
    'Registration Number': student.registration_number || '',
    'Location': student.location || '',
    'District': student.district_name || '',
    
    // Profile Info
    'Bio': student.bio || '',
    'NM ID': student.nm_id || '',
    'Trainer Name': student.trainer_name || '',
    
    // Social Links
    'GitHub': student.github_link || '',
    'LinkedIn': student.linkedin_link || '',
    'Twitter': student.twitter_link || '',
    'Facebook': student.facebook_link || '',
    'Instagram': student.instagram_link || '',
    'Portfolio': student.portfolio_link || '',
    
    // Skills (comma-separated)
    'Skills': student.skills.map(s => typeof s === 'string' ? s : s.name).join(', '),
    'Skills Count': student.skills.length,
    
    // Projects (comma-separated titles)
    'Projects': student.projects.map(p => p.title).join(', '),
    'Projects Count': student.projects.length,
    
    // Certificates (comma-separated titles)
    'Certificates': student.certificates.map(c => c.title).join(', '),
    'Certificates Count': student.certificates.length,
    
    // Experience (comma-separated roles)
    'Experience': student.experience.map(e => `${e.role || 'Role'} at ${e.organization || 'Organization'}`).join(', '),
    'Experience Count': student.experience.length,
    
    // Trainings (comma-separated titles)
    'Trainings': student.trainings.map(t => t.title).join(', '),
    'Trainings Count': student.trainings.length,
    
    // Metadata
    'Badges': student.badges.join(', '),
    'AI Score': student.ai_score_overall,
    'Last Updated': student.last_updated || '',
    'Created At': student.imported_at || '',
  };
}

/**
 * Export students data as CSV
 */
export function exportStudentsAsCSV(students: UICandidate[], filename: string = 'students_export'): void {
  try {
    if (students.length === 0) {
      alert('No students to export');
      return;
    }

    // Flatten all students
    const flattenedData = students.map(flattenStudentForCSV);

    // Convert to CSV using Papa Parse
    const csv = Papa.unparse(flattenedData, {
      quotes: true,
      delimiter: ',',
      header: true,
      newline: '\r\n',
    });

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    alert('Failed to export CSV. Please check the console for details.');
  }
}

/**
 * Export students data as JSON
 */
export function exportStudentsAsJSON(students: UICandidate[], filename: string = 'students_export'): void {
  try {
    if (students.length === 0) {
      alert('No students to export');
      return;
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      totalStudents: students.length,
      students: students,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.json`);
  } catch (error) {
    console.error('Error exporting JSON:', error);
    alert('Failed to export JSON. Please check the console for details.');
  }
}

/**
 * Export students data as PDF
 */
export function exportStudentsAsPDF(students: UICandidate[], filename: string = 'students_export'): void {
  try {
    if (students.length === 0) {
      alert('No students to export');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Students Export Report', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
    doc.text(`Total Students: ${students.length}`, pageWidth / 2, yPosition + 5, { align: 'center' });

    yPosition += 15;

    // Summary Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Student Summary', 14, yPosition);
    yPosition += 5;

    // Create basic info table
    const basicInfoData = students.map((student, index) => [
      (index + 1).toString(),
      student.name || 'N/A',
      student.email || 'N/A',
      student.dept || 'N/A',
      student.college || 'N/A',
      student.ai_score_overall.toString(),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Name', 'Email', 'Department', 'College', 'AI Score']],
      body: basicInfoData,
      theme: 'striped',
      headStyles: {
        fillColor: [79, 70, 229], // Indigo color
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      margin: { left: 14, right: 14 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Detailed Information for each student
    students.forEach((student, studentIndex) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(79, 70, 229);
      doc.text(`${studentIndex + 1}. ${student.name}`, 14, yPosition);
      yPosition += 7;

      // Basic details
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);
      const details = [
        `Email: ${student.email || 'N/A'}`,
        `Phone: ${student.phone || 'N/A'}`,
        `College: ${student.college || 'N/A'}`,
        `Department: ${student.dept || 'N/A'}`,
        `Location: ${student.location || 'N/A'}`,
      ];

      details.forEach(detail => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(detail, 14, yPosition);
        yPosition += 5;
      });

      yPosition += 3;

      // Skills section
      if (student.skills.length > 0) {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.text('Skills:', 14, yPosition);
        yPosition += 5;

        const skillsData = student.skills.slice(0, 10).map((skill, index) => [
          (index + 1).toString(),
          typeof skill === 'string' ? skill : skill.name || 'N/A',
          typeof skill === 'object' && skill.level ? skill.level.toString() : 'N/A',
          typeof skill === 'object' && skill.verified ? 'Yes' : 'No',
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['#', 'Skill', 'Level', 'Verified']],
          body: skillsData,
          theme: 'plain',
          headStyles: {
            fillColor: [229, 231, 235],
            textColor: 0,
            fontStyle: 'bold',
            fontSize: 8,
          },
          styles: {
            fontSize: 7,
            cellPadding: 2,
          },
          margin: { left: 14, right: 14 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 5;
        
        if (student.skills.length > 10) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7);
          doc.text(`... and ${student.skills.length - 10} more skills`, 14, yPosition);
          yPosition += 5;
        }
      }

      // Projects section
      if (student.projects.length > 0) {
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Projects:', 14, yPosition);
        yPosition += 5;

        const projectsData = student.projects.slice(0, 5).map((project, index) => [
          (index + 1).toString(),
          project.title || 'N/A',
          project.status || 'N/A',
          project.organization || 'N/A',
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['#', 'Title', 'Status', 'Organization']],
          body: projectsData,
          theme: 'plain',
          headStyles: {
            fillColor: [229, 231, 235],
            textColor: 0,
            fontStyle: 'bold',
            fontSize: 8,
          },
          styles: {
            fontSize: 7,
            cellPadding: 2,
          },
          margin: { left: 14, right: 14 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 5;
        
        if (student.projects.length > 5) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7);
          doc.text(`... and ${student.projects.length - 5} more projects`, 14, yPosition);
          yPosition += 5;
        }
      }

      // Certificates section
      if (student.certificates.length > 0) {
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Certificates:', 14, yPosition);
        yPosition += 5;

        const certificatesData = student.certificates.slice(0, 5).map((cert, index) => [
          (index + 1).toString(),
          cert.title || 'N/A',
          cert.issuer || 'N/A',
          cert.issued_on || 'N/A',
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['#', 'Title', 'Issuer', 'Issued On']],
          body: certificatesData,
          theme: 'plain',
          headStyles: {
            fillColor: [229, 231, 235],
            textColor: 0,
            fontStyle: 'bold',
            fontSize: 8,
          },
          styles: {
            fontSize: 7,
            cellPadding: 2,
          },
          margin: { left: 14, right: 14 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 5;
        
        if (student.certificates.length > 5) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7);
          doc.text(`... and ${student.certificates.length - 5} more certificates`, 14, yPosition);
          yPosition += 5;
        }
      }

      yPosition += 8;
    });

    // Add footer with page numbers
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
    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Failed to export PDF. Please check the console for details.');
  }
}

/**
 * Export detailed student data as separate CSV files (one for each category)
 */
export function exportStudentsAsDetailedCSV(students: UICandidate[], filename: string = 'students_detailed_export'): void {
  try {
    if (students.length === 0) {
      alert('No students to export');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];

    // 1. Basic Info CSV
    const basicInfo = students.map(s => ({
      'Student ID': s.id,
      'Name': s.name,
      'Email': s.email || '',
      'Phone': s.phone || '',
      'College': s.college || '',
      'Department': s.dept || '',
      'Location': s.location || '',
      'AI Score': s.ai_score_overall,
    }));
    const basicCSV = Papa.unparse(basicInfo, { quotes: true, header: true });
    saveAs(new Blob([basicCSV], { type: 'text/csv' }), `${filename}_basic_${timestamp}.csv`);

    // 2. Skills CSV
    const skills: any[] = [];
    students.forEach(student => {
      student.skills.forEach(skill => {
        skills.push({
          'Student ID': student.id,
          'Student Name': student.name,
          'Skill Name': typeof skill === 'string' ? skill : skill.name,
          'Skill Type': typeof skill === 'object' ? skill.type || '' : '',
          'Level': typeof skill === 'object' ? skill.level || '' : '',
          'Verified': typeof skill === 'object' ? (skill.verified ? 'Yes' : 'No') : '',
        });
      });
    });
    if (skills.length > 0) {
      const skillsCSV = Papa.unparse(skills, { quotes: true, header: true });
      saveAs(new Blob([skillsCSV], { type: 'text/csv' }), `${filename}_skills_${timestamp}.csv`);
    }

    // 3. Projects CSV
    const projects: any[] = [];
    students.forEach(student => {
      student.projects.forEach(project => {
        projects.push({
          'Student ID': student.id,
          'Student Name': student.name,
          'Project Title': project.title,
          'Description': project.description || '',
          'Status': project.status || '',
          'Organization': project.organization || '',
          'Start Date': project.start_date || '',
          'End Date': project.end_date || '',
          'Duration': project.duration || '',
          'Tech Stack': Array.isArray(project.tech_stack) ? project.tech_stack.join(', ') : '',
          'Demo Link': project.demo_link || '',
          'GitHub Link': project.github_link || '',
        });
      });
    });
    if (projects.length > 0) {
      const projectsCSV = Papa.unparse(projects, { quotes: true, header: true });
      saveAs(new Blob([projectsCSV], { type: 'text/csv' }), `${filename}_projects_${timestamp}.csv`);
    }

    // 4. Certificates CSV
    const certificates: any[] = [];
    students.forEach(student => {
      student.certificates.forEach(cert => {
        certificates.push({
          'Student ID': student.id,
          'Student Name': student.name,
          'Certificate Title': cert.title,
          'Issuer': cert.issuer || '',
          'Level': cert.level || '',
          'Credential ID': cert.credential_id || '',
          'Issued On': cert.issued_on || '',
          'Link': cert.link || '',
          'Status': cert.status || '',
        });
      });
    });
    if (certificates.length > 0) {
      const certificatesCSV = Papa.unparse(certificates, { quotes: true, header: true });
      saveAs(new Blob([certificatesCSV], { type: 'text/csv' }), `${filename}_certificates_${timestamp}.csv`);
    }

    // 5. Experience CSV
    const experience: any[] = [];
    students.forEach(student => {
      student.experience.forEach(exp => {
        experience.push({
          'Student ID': student.id,
          'Student Name': student.name,
          'Organization': exp.organization || '',
          'Role': exp.role || '',
          'Start Date': exp.start_date || '',
          'End Date': exp.end_date || '',
          'Duration': exp.duration || '',
          'Verified': exp.verified ? 'Yes' : 'No',
        });
      });
    });
    if (experience.length > 0) {
      const experienceCSV = Papa.unparse(experience, { quotes: true, header: true });
      saveAs(new Blob([experienceCSV], { type: 'text/csv' }), `${filename}_experience_${timestamp}.csv`);
    }

    // 6. Trainings CSV
    const trainings: any[] = [];
    students.forEach(student => {
      student.trainings.forEach(training => {
        trainings.push({
          'Student ID': student.id,
          'Student Name': student.name,
          'Training Title': training.title,
          'Organization': training.organization || '',
          'Start Date': training.start_date || '',
          'End Date': training.end_date || '',
          'Duration': training.duration || '',
          'Description': training.description || '',
        });
      });
    });
    if (trainings.length > 0) {
      const trainingsCSV = Papa.unparse(trainings, { quotes: true, header: true });
      saveAs(new Blob([trainingsCSV], { type: 'text/csv' }), `${filename}_trainings_${timestamp}.csv`);
    }

    alert(`Export complete! ${[
      'basic info',
      skills.length > 0 ? 'skills' : null,
      projects.length > 0 ? 'projects' : null,
      certificates.length > 0 ? 'certificates' : null,
      experience.length > 0 ? 'experience' : null,
      trainings.length > 0 ? 'trainings' : null,
    ].filter(Boolean).join(', ')} files downloaded.`);
  } catch (error) {
    console.error('Error exporting detailed CSV:', error);
    alert('Failed to export detailed CSV. Please check the console for details.');
  }
}
