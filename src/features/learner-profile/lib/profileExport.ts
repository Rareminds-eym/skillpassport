/**
 * Profile Export Utilities
 * 
 * Provides functionality to export learner profiles to PDF format
 */

import type { Learner, Project, Certificate, Course } from '../ui/types';

export interface ExportOptions {
  includeBasicInfo?: boolean;
  includeAcademicInfo?: boolean;
  includeEducation?: boolean;
  includeSkills?: boolean;
  includeProjects?: boolean;
  includeCertificates?: boolean;
  includeCourses?: boolean;
  includeSocialLinks?: boolean;
  format?: 'pdf' | 'json';
}

export interface ExportData {
  learner: Learner;
  sections: {
    basicInfo?: any;
    academicInfo?: any;
    education?: any[];
    skills?: any;
    projects?: Project[];
    certificates?: Certificate[];
    courses?: Course[];
    socialLinks?: any;
  };
  metadata: {
    exportedAt: string;
    exportedBy?: string;
    version: string;
  };
}

/**
 * Default export options
 */
const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  includeBasicInfo: true,
  includeAcademicInfo: true,
  includeEducation: true,
  includeSkills: true,
  includeProjects: true,
  includeCertificates: true,
  includeCourses: true,
  includeSocialLinks: true,
  format: 'pdf'
};

/**
 * Extracts basic information from learner profile
 */
const extractBasicInfo = (learner: Learner) => {
  return {
    name: learner.name,
    email: learner.email,
    phone: learner.contact_number || learner.contactNumber || learner.phone,
    dateOfBirth: learner.date_of_birth,
    age: learner.age,
    gender: learner.gender,
    bloodGroup: learner.bloodGroup,
    address: {
      street: learner.address,
      city: learner.city,
      state: learner.state,
      country: learner.country,
      pincode: learner.pincode
    },
    bio: learner.bio,
    interests: learner.interests,
    hobbies: learner.hobbies,
    languages: learner.languages
  };
};

/**
 * Extracts academic information from learner profile
 */
const extractAcademicInfo = (learner: Learner) => {
  const academic: any = {};
  
  // School information
  if (learner.school_id) {
    academic.type = 'school';
    academic.school = {
      id: learner.school_id,
      name: learner.school_name || learner.college_school_name,
      grade: learner.grade,
      section: learner.section,
      rollNumber: learner.roll_number,
      admissionNumber: learner.admission_number,
      subjects: learner.subjects
    };
    
    // Guardian information
    if (learner.guardianName) {
      academic.guardian = {
        name: learner.guardianName,
        phone: learner.guardianPhone,
        email: learner.guardianEmail,
        relation: learner.guardianRelation
      };
    }
  }
  
  // College information
  if (learner.college_id) {
    academic.type = 'college';
    academic.college = {
      id: learner.college_id,
      name: learner.college,
      university: learner.university,
      branch: learner.branch_field || learner.dept,
      enrollmentNumber: learner.enrollment_number,
      registrationNumber: learner.registration_number,
      semester: learner.current_semester || learner.semester,
      cgpa: learner.currentCgpa,
      enrollmentDate: learner.enrollmentDate,
      expectedGraduation: learner.expectedGraduationDate,
      academicYear: learner.admission_academic_year
    };
  }
  
  // Approval status
  academic.approvalStatus = learner.approval_status || learner.admission_status;
  academic.appliedDate = learner.applied_date;
  
  return academic;
};

/**
 * Extracts education records from learner profile
 */
const extractEducation = (learner: Learner) => {
  const education = learner.profile?.education || [];
  
  return education.map(edu => ({
    degree: edu.degree,
    level: edu.level,
    university: edu.university,
    department: edu.department,
    cgpa: edu.cgpa,
    yearOfPassing: edu.yearOfPassing,
    status: edu.status
  }));
};

/**
 * Extracts skills from learner profile
 */
const extractSkills = (learner: Learner) => {
  const technicalSkills = learner.profile?.technicalSkills || [];
  const softSkills = learner.profile?.softSkills || [];
  
  return {
    technical: technicalSkills
      .filter(skill => skill.enabled !== false)
      .map(skill => ({
        name: skill.name,
        level: skill.level
      })),
    soft: softSkills
      .filter(skill => skill.enabled !== false)
      .map(skill => ({
        name: skill.name,
        level: skill.level
      })),
    summary: learner.skill_summary
  };
};

/**
 * Extracts projects from learner profile
 */
const extractProjects = (learner: Learner): Project[] => {
  const projects = learner.projects || [];
  
  return projects.map(project => ({
    id: project.id,
    title: project.title,
    description: project.description,
    role: project.role,
    organization: project.organization,
    status: project.status,
    approval_status: project.approval_status,
    tech_stack: project.tech_stack,
    demo_link: project.demo_link,
    github_link: project.github_link,
    start_date: project.start_date,
    end_date: project.end_date
  }));
};

/**
 * Extracts certificates from learner profile
 */
const extractCertificates = (learner: Learner): Certificate[] => {
  const certificates = learner.certificates || [];
  
  return certificates.map(cert => ({
    id: cert.id,
    title: cert.title,
    issuer: cert.issuer,
    level: cert.level,
    issued_on: cert.issued_on,
    credential_id: cert.credential_id,
    link: cert.link,
    description: cert.description,
    approval_status: cert.approval_status
  }));
};

/**
 * Extracts social links from learner profile
 */
const extractSocialLinks = (learner: Learner) => {
  return {
    linkedin: learner.linkedin_link,
    github: learner.github_link,
    twitter: learner.twitter_link,
    facebook: learner.facebook_link,
    instagram: learner.instagram_link,
    youtube: learner.youtube_link,
    portfolio: learner.portfolio_link,
    other: learner.other_social_links
  };
};

/**
 * Prepares export data based on options
 */
export const prepareExportData = (
  learner: Learner,
  options: ExportOptions = DEFAULT_EXPORT_OPTIONS
): ExportData => {
  const mergedOptions = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  const sections: ExportData['sections'] = {};
  
  if (mergedOptions.includeBasicInfo) {
    sections.basicInfo = extractBasicInfo(learner);
  }
  
  if (mergedOptions.includeAcademicInfo) {
    sections.academicInfo = extractAcademicInfo(learner);
  }
  
  if (mergedOptions.includeEducation) {
    sections.education = extractEducation(learner);
  }
  
  if (mergedOptions.includeSkills) {
    sections.skills = extractSkills(learner);
  }
  
  if (mergedOptions.includeProjects) {
    sections.projects = extractProjects(learner);
  }
  
  if (mergedOptions.includeCertificates) {
    sections.certificates = extractCertificates(learner);
  }
  
  if (mergedOptions.includeSocialLinks) {
    sections.socialLinks = extractSocialLinks(learner);
  }
  
  return {
    learner,
    sections,
    metadata: {
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }
  };
};

/**
 * Exports profile data as JSON
 */
export const exportAsJSON = (learner: Learner, options?: ExportOptions): string => {
  const data = prepareExportData(learner, options);
  return JSON.stringify(data, null, 2);
};

/**
 * Downloads profile data as JSON file
 */
export const downloadAsJSON = (learner: Learner, options?: ExportOptions): void => {
  const json = exportAsJSON(learner, options);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${learner.name.replace(/\s+/g, '_')}_profile_${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generates HTML content for PDF export
 */
export const generateHTMLForPDF = (learner: Learner, options?: ExportOptions): string => {
  const data = prepareExportData(learner, options);
  
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${learner.name} - Profile</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
    }
    h2 {
      color: #34495e;
      border-bottom: 2px solid #95a5a6;
      padding-bottom: 5px;
      margin-top: 30px;
    }
    h3 {
      color: #7f8c8d;
      margin-top: 20px;
    }
    .section {
      margin-bottom: 30px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 150px 1fr;
      gap: 10px;
      margin: 15px 0;
    }
    .label {
      font-weight: bold;
      color: #555;
    }
    .value {
      color: #333;
    }
    .item {
      margin: 15px 0;
      padding: 10px;
      background: #f8f9fa;
      border-left: 3px solid #3498db;
    }
    .skill-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 10px 0;
    }
    .skill-tag {
      background: #3498db;
      color: white;
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 14px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #7f8c8d;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>${learner.name}</h1>
`;

  // Basic Information
  if (data.sections.basicInfo) {
    const basic = data.sections.basicInfo;
    html += `
  <div class="section">
    <h2>Basic Information</h2>
    <div class="info-grid">
      ${basic.email ? `<div class="label">Email:</div><div class="value">${basic.email}</div>` : ''}
      ${basic.phone ? `<div class="label">Phone:</div><div class="value">${basic.phone}</div>` : ''}
      ${basic.dateOfBirth ? `<div class="label">Date of Birth:</div><div class="value">${basic.dateOfBirth}</div>` : ''}
      ${basic.gender ? `<div class="label">Gender:</div><div class="value">${basic.gender}</div>` : ''}
      ${basic.bloodGroup ? `<div class="label">Blood Group:</div><div class="value">${basic.bloodGroup}</div>` : ''}
    </div>
    ${basic.bio ? `<p><strong>Bio:</strong> ${basic.bio}</p>` : ''}
    ${basic.address?.street ? `
    <p><strong>Address:</strong> ${basic.address.street}, ${basic.address.city || ''}, ${basic.address.state || ''} ${basic.address.pincode || ''}</p>
    ` : ''}
  </div>
`;
  }

  // Academic Information
  if (data.sections.academicInfo) {
    const academic = data.sections.academicInfo;
    html += `
  <div class="section">
    <h2>Academic Information</h2>
`;
    
    if (academic.school) {
      html += `
    <div class="info-grid">
      ${academic.school.name ? `<div class="label">School:</div><div class="value">${academic.school.name}</div>` : ''}
      ${academic.school.grade ? `<div class="label">Grade:</div><div class="value">${academic.school.grade}</div>` : ''}
      ${academic.school.section ? `<div class="label">Section:</div><div class="value">${academic.school.section}</div>` : ''}
      ${academic.school.rollNumber ? `<div class="label">Roll Number:</div><div class="value">${academic.school.rollNumber}</div>` : ''}
    </div>
`;
    }
    
    if (academic.college) {
      html += `
    <div class="info-grid">
      ${academic.college.name ? `<div class="label">College:</div><div class="value">${academic.college.name}</div>` : ''}
      ${academic.college.university ? `<div class="label">University:</div><div class="value">${academic.college.university}</div>` : ''}
      ${academic.college.branch ? `<div class="label">Branch:</div><div class="value">${academic.college.branch}</div>` : ''}
      ${academic.college.semester ? `<div class="label">Semester:</div><div class="value">${academic.college.semester}</div>` : ''}
      ${academic.college.cgpa ? `<div class="label">CGPA:</div><div class="value">${academic.college.cgpa}</div>` : ''}
    </div>
`;
    }
    
    html += `  </div>`;
  }

  // Education
  if (data.sections.education && data.sections.education.length > 0) {
    html += `
  <div class="section">
    <h2>Education</h2>
`;
    data.sections.education.forEach(edu => {
      html += `
    <div class="item">
      <h3>${edu.degree}${edu.department ? ` - ${edu.department}` : ''}</h3>
      <p><strong>${edu.university}</strong></p>
      ${edu.cgpa ? `<p>CGPA: ${edu.cgpa}</p>` : ''}
      ${edu.yearOfPassing ? `<p>Year: ${edu.yearOfPassing}</p>` : ''}
    </div>
`;
    });
    html += `  </div>`;
  }

  // Skills
  if (data.sections.skills) {
    const skills = data.sections.skills;
    html += `
  <div class="section">
    <h2>Skills</h2>
`;
    
    if (skills.technical && skills.technical.length > 0) {
      html += `
    <h3>Technical Skills</h3>
    <div class="skill-list">
      ${skills.technical.map((skill: any) => `<span class="skill-tag">${skill.name}</span>`).join('')}
    </div>
`;
    }
    
    if (skills.soft && skills.soft.length > 0) {
      html += `
    <h3>Soft Skills</h3>
    <div class="skill-list">
      ${skills.soft.map((skill: any) => `<span class="skill-tag">${skill.name}</span>`).join('')}
    </div>
`;
    }
    
    html += `  </div>`;
  }

  // Projects
  if (data.sections.projects && data.sections.projects.length > 0) {
    html += `
  <div class="section">
    <h2>Projects</h2>
`;
    data.sections.projects.forEach(project => {
      html += `
    <div class="item">
      <h3>${project.title}</h3>
      ${project.role ? `<p><strong>Role:</strong> ${project.role}</p>` : ''}
      ${project.description ? `<p>${project.description}</p>` : ''}
      ${project.tech_stack && project.tech_stack.length > 0 ? `<p><strong>Tech Stack:</strong> ${project.tech_stack.join(', ')}</p>` : ''}
      ${project.github_link ? `<p><strong>GitHub:</strong> ${project.github_link}</p>` : ''}
      ${project.demo_link ? `<p><strong>Demo:</strong> ${project.demo_link}</p>` : ''}
    </div>
`;
    });
    html += `  </div>`;
  }

  // Certificates
  if (data.sections.certificates && data.sections.certificates.length > 0) {
    html += `
  <div class="section">
    <h2>Certificates</h2>
`;
    data.sections.certificates.forEach(cert => {
      html += `
    <div class="item">
      <h3>${cert.title}</h3>
      ${cert.issuer ? `<p><strong>Issuer:</strong> ${cert.issuer}</p>` : ''}
      ${cert.issued_on ? `<p><strong>Issued:</strong> ${cert.issued_on}</p>` : ''}
      ${cert.credential_id ? `<p><strong>Credential ID:</strong> ${cert.credential_id}</p>` : ''}
      ${cert.link ? `<p><strong>Link:</strong> ${cert.link}</p>` : ''}
    </div>
`;
    });
    html += `  </div>`;
  }

  // Social Links
  if (data.sections.socialLinks) {
    const social = data.sections.socialLinks;
    const hasLinks = Object.values(social).some(link => link && link !== '');
    
    if (hasLinks) {
      html += `
  <div class="section">
    <h2>Social Links</h2>
    <div class="info-grid">
`;
      if (social.linkedin) html += `      <div class="label">LinkedIn:</div><div class="value">${social.linkedin}</div>`;
      if (social.github) html += `      <div class="label">GitHub:</div><div class="value">${social.github}</div>`;
      if (social.portfolio) html += `      <div class="label">Portfolio:</div><div class="value">${social.portfolio}</div>`;
      if (social.twitter) html += `      <div class="label">Twitter:</div><div class="value">${social.twitter}</div>`;
      
      html += `
    </div>
  </div>
`;
    }
  }

  // Footer
  html += `
  <div class="footer">
    <p>Generated on ${new Date(data.metadata.exportedAt).toLocaleString()}</p>
  </div>
</body>
</html>
`;

  return html;
};

/**
 * Opens profile in new window for printing/PDF export
 * Note: Actual PDF generation requires browser print functionality or a PDF library
 */
export const exportAsPDF = (learner: Learner, options?: ExportOptions): void => {
  const html = generateHTMLForPDF(learner, options);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print dialog
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};
