import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import type { UICandidate } from '@/entities/learner';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learner-export');

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

/**
 * Flatten nested learner data for CSV export
 */
function flattenlearnerForCSV(learner: UICandidate): Record<string, any> {
  return {
    // Basic Info
    'Learner ID': learner.id,
    'Name': learner.name,
    'Email': learner.email || '',
    'Phone': learner.phone || '',
    'Age': learner.age || '',
    'Date of Birth': learner.date_of_birth || '',
    
    // Academic Info
    'College': learner.college || '',
    'Department': learner.dept || '',
    'University': learner.university || '',
    'Registration Number': learner.registration_number || '',
    'Location': learner.location || '',
    'District': learner.district_name || '',
    
    // Profile Info
    'Bio': learner.bio || '',
    'NM ID': learner.nm_id || '',
    'Trainer Name': learner.trainer_name || '',
    
    // Social Links
    'GitHub': learner.github_link || '',
    'LinkedIn': learner.linkedin_link || '',
    'Twitter': learner.twitter_link || '',
    'Facebook': learner.facebook_link || '',
    'Instagram': learner.instagram_link || '',
    'Portfolio': learner.portfolio_link || '',
    
    // Skills (comma-separated)
    'Skills': learner.skills.map(s => typeof s === 'string' ? s : s.name).join(', '),
    'Skills Count': learner.skills.length,
    
    // Projects (comma-separated titles)
    'Projects': learner.projects.map(p => p.title).join(', '),
    'Projects Count': learner.projects.length,
    
    // Certificates (comma-separated titles)
    'Certificates': learner.certificates.map(c => c.title).join(', '),
    'Certificates Count': learner.certificates.length,
    
    // Experience (comma-separated roles)
    'Experience': learner.experience.map(e => `${e.role || 'Role'} at ${e.organization || 'Organization'}`).join(', '),
    'Experience Count': learner.experience.length,
    
    // Trainings (comma-separated titles)
    'Trainings': learner.trainings.map(t => t.title).join(', '),
    'Trainings Count': learner.trainings.length,
    
    // Metadata
    'Badges': learner.badges.join(', '),
    'AI Score': learner.ai_score_overall,
    'Last Updated': learner.last_updated || '',
    'Created At': learner.imported_at || '',
  };
}

/**
 * Export learners data as CSV
 */
export function exportlearnersAsCSV(learners: UICandidate[], filename: string = 'learners_export'): void {
  try {
    if (learners.length === 0) {
      alert('No learners to export');
      return;
    }

    // Flatten all learners
    const flattenedData = learners.map(flattenlearnerForCSV);

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
    logger.error('Error exporting CSV', error as Error);
    alert('Failed to export CSV. Please check the console for details.');
  }
}

/**
 * Export learners data as JSON
 */
export function exportlearnersAsJSON(learners: UICandidate[], filename: string = 'learners_export'): void {
  try {
    if (learners.length === 0) {
      alert('No learners to export');
      return;
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      totallearners: learners.length,
      learners: learners,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.json`);
  } catch (error) {
    logger.error('Error exporting JSON', error as Error);
    alert('Failed to export JSON. Please check the console for details.');
  }
}

/**
 * Export learners data as PDF
 */
export function exportlearnersAsPDF(learners: UICandidate[], filename: string = 'learners_export'): void {
  try {
    if (learners.length === 0) {
      alert('No learners to export');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Learners Export Report', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
    doc.text(`Total Learners: ${learners.length}`, pageWidth / 2, yPosition + 5, { align: 'center' });

    yPosition += 15;

    // Summary Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Learner Summary', 14, yPosition);
    yPosition += 5;

    // Create basic info table
    const basicInfoData = learners.map((learner, index) => [
      (index + 1).toString(),
      learner.name || 'N/A',
      learner.email || 'N/A',
      learner.dept || 'N/A',
      learner.college || 'N/A',
      learner.ai_score_overall.toString(),
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

    // Detailed Information for each learner
    learners.forEach((learner, learnerIndex) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(79, 70, 229);
      doc.text(`${learnerIndex + 1}. ${learner.name}`, 14, yPosition);
      yPosition += 7;

      // Basic details
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);
      const details = [
        `Email: ${learner.email || 'N/A'}`,
        `Phone: ${learner.phone || 'N/A'}`,
        `College: ${learner.college || 'N/A'}`,
        `Department: ${learner.dept || 'N/A'}`,
        `Location: ${learner.location || 'N/A'}`,
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
      if (learner.skills.length > 0) {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.text('Skills:', 14, yPosition);
        yPosition += 5;

        const skillsData = learner.skills.slice(0, 10).map((skill, index) => [
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
        
        if (learner.skills.length > 10) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7);
          doc.text(`... and ${learner.skills.length - 10} more skills`, 14, yPosition);
          yPosition += 5;
        }
      }

      // Projects section
      if (learner.projects.length > 0) {
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Projects:', 14, yPosition);
        yPosition += 5;

        const projectsData = learner.projects.slice(0, 5).map((project, index) => [
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
        
        if (learner.projects.length > 5) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7);
          doc.text(`... and ${learner.projects.length - 5} more projects`, 14, yPosition);
          yPosition += 5;
        }
      }

      // Certificates section
      if (learner.certificates.length > 0) {
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Certificates:', 14, yPosition);
        yPosition += 5;

        const certificatesData = learner.certificates.slice(0, 5).map((cert, index) => [
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
        
        if (learner.certificates.length > 5) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7);
          doc.text(`... and ${learner.certificates.length - 5} more certificates`, 14, yPosition);
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
    logger.error('Error exporting PDF', error as Error);
    alert('Failed to export PDF. Please check the console for details.');
  }
}

/**
 * Export detailed learner data as separate CSV files (one for each category)
 */
export function exportlearnersAsDetailedCSV(learners: UICandidate[], filename: string = 'learners_detailed_export'): void {
  try {
    if (learners.length === 0) {
      alert('No learners to export');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];

    // 1. Basic Info CSV
    const basicInfo = learners.map(s => ({
      'Learner ID': s.id,
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
    learners.forEach(learner => {
      learner.skills.forEach(skill => {
        skills.push({
          'Learner ID': learner.id,
          'Learner Name': learner.name,
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
    learners.forEach(learner => {
      learner.projects.forEach(project => {
        projects.push({
          'Learner ID': learner.id,
          'Learner Name': learner.name,
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
    learners.forEach(learner => {
      learner.certificates.forEach(cert => {
        certificates.push({
          'Learner ID': learner.id,
          'Learner Name': learner.name,
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
    learners.forEach(learner => {
      learner.experience.forEach(exp => {
        experience.push({
          'Learner ID': learner.id,
          'Learner Name': learner.name,
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
    learners.forEach(learner => {
      learner.trainings.forEach(training => {
        trainings.push({
          'Learner ID': learner.id,
          'Learner Name': learner.name,
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
    logger.error('Error exporting detailed CSV', error as Error);
    alert('Failed to export detailed CSV. Please check the console for details.');
  }
}
