import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Professional Resume Generator with Modern Sidebar Layout
 * Updated to handle database structure with:
 * - Certificates section
 * - Only completed training
 * - Skills with 1-5 level rating (technical + soft skills combined)
 */

export const RESUME_TEMPLATES = {
  SIDEBAR_PROFESSIONAL: 'sidebar_professional',
  SIDEBAR_MODERN: 'sidebar_modern',
  SIDEBAR_ELEGANT: 'sidebar_elegant',
  SIDEBAR_CREATIVE: 'sidebar_creative'
};

/**
 * Helper to safely parse profile data
 */
function safeParse(jsonLike) {
  if (!jsonLike) return {};
  if (typeof jsonLike === "object") return jsonLike;
  try {
    return JSON.parse(jsonLike);
  } catch (e) {
    try {
      return JSON.parse(
        String(jsonLike)
          .replace(/(\r\n|\n|\r)/g, " ")
          .replace(/'/g, '"')
      );
    } catch (e2) {
      return {};
    }
  }
}

/**
 * generateResumePDF
 * Creates a polished, professional PDF resume with modern design
 */
export const generateResumePDF = async (studentData) => {
  // Helper: safe defaults and parse profile
  studentData = studentData || {};
  const parsedProfile = safeParse(studentData.profile);
  const profile = { ...studentData, ...parsedProfile };

  const doc = new jsPDF("p", "mm", "a4");
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Professional color scheme
  const themeColor = hexToRgbArray("#2C3E50");
  const accentColor = hexToRgbArray("#3498DB");
  const textDark = [44, 62, 80];
  const textMedium = [52, 73, 94];
  const textLight = [127, 140, 141];
  
  const sidebarW = 70;
  const margin = 14;
  let ySide = 70; // Will be adjusted based on image presence
  let yMain = 50;

  // Utility: convert hex to rgb array
  function hexToRgbArray(hex) {
    try {
      const h = hex.replace("#", "");
      const bigint = parseInt(h.length === 3 ? h.split("").map(c => c+c).join("") : h, 16);
      return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    } catch (e) {
      return [44, 62, 80];
    }
  }

  // Utility: load image url -> base64
  async function loadImageAsDataURL(url) {
    if (!url) return null;
    if (typeof url === "string" && url.startsWith("data:")) return url;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Image fetch failed");
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      return null;
    }
  }

  // Check if we need a second page
  function checkPageBreak(requiredSpace = 30) {
    if (yMain > pageH - requiredSpace) {
      doc.addPage();
      doc.setFillColor(...themeColor);
      doc.rect(0, 0, sidebarW, pageH, "F");
      yMain = 20;
    }
  }

  const resolveArray = (...candidates) => {
    for (const candidate of candidates) {
      if (Array.isArray(candidate) && candidate.length > 0) {
        return candidate;
      }
    }
    return [];
  };

  // Clear page background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, "F");

  // Sidebar background
  doc.setFillColor(...themeColor);
  doc.rect(0, 0, sidebarW, pageH, "F");

  // Simple circular profile photo with ring
  const photoCenterX = sidebarW / 2;
  const photoCenterY = 35;
  const photoRadius = 22;
  
  let hasImage = false;
  
if (profile.image) {
  const imgData = await loadImageAsDataURL(profile.image).catch(() => null);
  if (imgData) {
    hasImage = true;

    const imgSize = photoRadius * 2;
    const imgX = photoCenterX - photoRadius;
    const imgY = photoCenterY - photoRadius;

    try {
      // Load the original image
      const image = new Image();
      image.crossOrigin = "Anonymous";
      image.src = imgData;

      await new Promise((resolve) => {
        image.onload = () => resolve();
      });

      // Determine true image resolution
      const naturalSize = Math.max(image.width, image.height);

      // Create circular transparent crop
      const canvas = document.createElement("canvas");
      canvas.width = naturalSize;
      canvas.height = naturalSize;
      const ctx = canvas.getContext("2d");

      // Transparent background
      ctx.clearRect(0, 0, naturalSize, naturalSize);

      // Circular clipping region
      ctx.beginPath();
      ctx.arc(naturalSize / 2, naturalSize / 2, naturalSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw image inside circle
      ctx.drawImage(image, 0, 0, naturalSize, naturalSize);

      // Optional: soft shadow for depth
      // ctx.shadowColor = "rgba(0,0,0,0.15)";
      // ctx.shadowBlur = naturalSize * 0.03;

      // Export circular PNG (transparent background)
      const circularImgData = canvas.toDataURL("image/png");

      // Add circular image to PDF
      doc.addImage(circularImgData, "PNG", imgX, imgY, imgSize, imgSize, undefined, "FAST");

      // ✨ Draw a clean circular ring (accent color)
      doc.setDrawColor(...accentColor); // e.g., [0, 102, 204] or theme color
      doc.setLineWidth(1.5 );              // Adjust thickness as needed
      doc.circle(photoCenterX, photoCenterY, photoRadius + 1.5, "S"); // Slightly outside image

    } catch (e) {
    }

  } else {
    // Fallback: initials
    hasImage = true;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...themeColor);
    const firstName = (profile.name || "").split(" ")[0] || "";
    const lastName = profile.lastname || profile.lastName || "";
    const initials = (firstName[0] || "") + (lastName[0] || "");
    doc.text(initials.toUpperCase(), photoCenterX, photoCenterY + 7, { align: "center" });
  }
}

  
  // Adjust sidebar starting position
  if (!hasImage) {
    ySide = 18;
  } else {
    ySide = 70;
  }

  // Sidebar helper functions
  const addSidebarTitle = (title) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), 8, ySide);
    ySide += 2;
    
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.8);
    doc.line(8, ySide, sidebarW - 8, ySide);
    ySide += 8;
  };

  // Contact Section
  addSidebarTitle("Contact");
  
  if (profile.email) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text("EMAIL", 8, ySide);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const emailLines = doc.splitTextToSize(profile.email, sidebarW - 16);
    const emailY = ySide - 0.5;
    doc.text(emailLines, sidebarW - 8, emailY, { align: "right" });
    ySide += Math.max(5, emailLines.length * 3.5);
  }
  
  if (profile.phone || profile.mob || profile.contact_number) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text("PHONE", 8, ySide);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const phoneText = profile.phone || profile.mob || profile.contact_number;
    doc.text(phoneText, sidebarW - 8, ySide - 0.5, { align: "right" });
    ySide += 5;
  }
  
  if (profile.city || profile.location || profile.district_name) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text("LOCATION", 8, ySide);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const location = profile.city || profile.location || profile.district_name || "";
    const locLines = doc.splitTextToSize(location, sidebarW - 16);
    const locY = ySide - 0.5;
    doc.text(locLines, sidebarW - 8, locY, { align: "right" });
    ySide += Math.max(5, locLines.length * 3.5);
  }
  
  ySide += 3;

  // Links Section
  const hasLinks = profile.linkedin || profile.github || profile.portfolio || 
                   (studentData.link && (studentData.link.linkedin || studentData.link.github || studentData.link.portfolio));
  
  if (hasLinks) {
    addSidebarTitle("Links");
    
    const linkedin = profile.linkedin || studentData.link?.linkedin;
    if (linkedin) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text("LINKEDIN", 8, ySide);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      const linkedinText = linkedin.replace(/https?:\/\/(www\.)?linkedin\.com\/(in\/)?/, '');
      const liLines = doc.splitTextToSize(linkedinText, sidebarW - 16);
      const liY = ySide - 0.5;
      doc.text(liLines, sidebarW - 8, liY, { align: "right" });
      ySide += Math.max(5, liLines.length * 3.5);
    }
    
    const github = profile.github || studentData.link?.github;
    if (github) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text("GITHUB", 8, ySide);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      const githubText = github.replace(/https?:\/\/(www\.)?github\.com\//, '');
      const ghLines = doc.splitTextToSize(githubText, sidebarW - 16);
      const ghY = ySide - 0.5;
      doc.text(ghLines, sidebarW - 8, ghY, { align: "right" });
      ySide += Math.max(5, ghLines.length * 3.5);
    }
    
    const portfolio = profile.portfolio || studentData.link?.portfolio;
    if (portfolio) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text("WEBSITE", 8, ySide);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      const portfolioText = portfolio.replace(/https?:\/\/(www\.)?/, '');
      const portLines = doc.splitTextToSize(portfolioText, sidebarW - 16);
      const portY = ySide - 0.5;
      doc.text(portLines, sidebarW - 8, portY, { align: "right" });
      ySide += Math.max(5, portLines.length * 3.5);
    }
    
    ySide += 3;
  }

  // Skills Section - Combined Technical and Soft Skills with 1-5 level
  const allSkills = [];
  
  if (profile.technicalSkills && Array.isArray(profile.technicalSkills)) {
    allSkills.push(...profile.technicalSkills.filter(s => s && s.name && s.enabled !== false));
  }
  if (profile.softSkills && Array.isArray(profile.softSkills)) {
    allSkills.push(...profile.softSkills.filter(s => s && s.name && s.enabled !== false));
  }
  
  if (allSkills.length > 0) {
    addSidebarTitle("Skills");
    
    allSkills.slice(0, 12).forEach(s => {
      const name = s.name || s.skill || "";
      let level = s.level != null ? Number(s.level) : 3;
      
      // Ensure level is between 1-5
      level = Math.max(1, Math.min(5, level));
      
      // Skill name on left
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      
      // Truncate text if too long to leave space for stars
      const maxTextWidth = sidebarW - 32; // Leave space for stars on right
      const lines = doc.splitTextToSize(name, maxTextWidth);
      const displayText = lines[0]; // Take only first line if truncated
      doc.text(displayText, 8, ySide);
      
      // Draw stars on right side (5-star rating)
      const starSize = 2.5;
      const starSpacing = 4;
      const starEndX = sidebarW - 8; // Right edge
      const starStartX = starEndX - (5 * starSpacing); // Calculate start position from right
      const starY = ySide - 1.5;
      
      for (let i = 0; i < 5; i++) {
        const starX = starStartX + (i * starSpacing);
        
        if (i < level) {
          // Filled star (circle)
          doc.setFillColor(...accentColor);
          doc.circle(starX + starSize/2, starY, starSize/2, "F");
        } else {
          // Empty star (circle outline)
          doc.setDrawColor(255, 255, 255);
          doc.setLineWidth(0.3);
          doc.circle(starX + starSize/2, starY, starSize/2, "S");
        }
      }
      
      ySide += 7;
    });
    ySide += 3;
  }

  // Languages Section
  if (profile.languages && Array.isArray(profile.languages) && profile.languages.length > 0) {
    addSidebarTitle("Languages");
    profile.languages.slice(0, 5).forEach(lang => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      const langName = typeof lang === 'string' ? lang : (lang.language || lang.name || "");
      const lines = doc.splitTextToSize("• " + langName, sidebarW - 16);
      doc.text(lines, 8, ySide);
      ySide += lines.length * 4 + 2;
    });
    ySide += 3;
  }

  // Interests Section
  if (profile.interest && Array.isArray(profile.interest) && profile.interest.length > 0) {
    addSidebarTitle("Interests");
    profile.interest.slice(0, 8).forEach(item => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      const label = item.hobbie || item.name || item;
      const lines = doc.splitTextToSize("• " + label, sidebarW - 16);
      doc.text(lines, 8, ySide);
      ySide += lines.length * 4 + 2;
    });
  }

  // Main column header
  const mainX = sidebarW + margin;
  const mainWidth = pageW - sidebarW - margin * 2;

  // Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...textDark);
  const fullName = profile.name || "STUDENT NAME";
  doc.text(fullName.toUpperCase(), mainX, 28);

  // Title
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(...accentColor);
  if (profile.title || profile.course || profile.branch_field) {
    const title = profile.title || profile.course || profile.branch_field;
    doc.text(title, mainX, 36);
  }

  // Summary
  if (profile.summary || profile.bio) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...textMedium);
    const summary = profile.summary || profile.bio;
    const lines = doc.splitTextToSize(summary, mainWidth);
    doc.text(lines, mainX, 44);
    yMain = 44 + lines.length * 4.5 + 6;
  } else {
    yMain = 50;
  }

  // Decorative line
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.5);
  doc.line(mainX, yMain, pageW - margin, yMain);
  yMain += 10;

  // Main section helper
  const addMainSection = (title) => {
    checkPageBreak(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...themeColor);
    doc.text(title.toUpperCase(), mainX, yMain);
    
    yMain += 2;
    doc.setFillColor(...accentColor);
    doc.rect(mainX, yMain, 20, 1.5, "F");
    yMain += 8;
  };

  const addBulletPoints = (text) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...textMedium);
    const bulletX = mainX + 5;
    const lines = doc.splitTextToSize(text, mainWidth - 8);
    
    lines.forEach((line, idx) => {
      if (idx === 0) {
        doc.text("•", mainX, yMain);
      }
      doc.text(line, bulletX, yMain);
      yMain += 4;
    });
    yMain += 2;
  };

  // Work Experience
  if (profile.experience && Array.isArray(profile.experience)) {
    const experiences = profile.experience.filter(e => e && e.enabled !== false);
    if (experiences.length > 0) {
      addMainSection("Work Experience");
      
      experiences.forEach((exp, idx) => {
        if (idx > 0) checkPageBreak(35);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...textDark);
        const jobTitle = exp.worktitle || exp.role || exp.title || "Position";
        doc.text(jobTitle, mainX, yMain);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...textLight);
        
        if (exp.duration) {
          doc.text(exp.duration, pageW - margin, yMain, { align: "right" });
        }
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...accentColor);
        doc.text(exp.company || exp.organization || "", mainX, yMain + 5);
        
        yMain += 11;
        
        if (exp.description) {
          addBulletPoints(exp.description);
        }
        yMain += 4;
      });
    }
  }

  const projectData = resolveArray(
    profile.projects,
    studentData.projects,
    profile.profile?.projects,
    studentData.profile?.projects,
    studentData.profile?.profile?.projects
  ).filter(project => project && project.enabled !== false);

  if (projectData.length > 0) {
    addMainSection("Projects");

    projectData.forEach((project, idx) => {
      if (idx > 0) checkPageBreak(35);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...textDark);
      const projectTitle =
        project.title ||
        project.name ||
        project.projectTitle ||
        "Project";
      doc.text(projectTitle, mainX, yMain);

      const projectDuration =
        project.duration ||
        project.timeline ||
        project.period ||
        project.date ||
        project.year;
      if (projectDuration) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...textLight);
        doc.text(projectDuration, pageW - margin, yMain, { align: "right" });
      }

      const projectOrganization =
        project.organization ||
        project.company ||
        project.client ||
        project.role;
      if (projectOrganization) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...accentColor);
        doc.text(projectOrganization, mainX, yMain + 5);
        yMain += 11;
      } else {
        yMain += 8;
      }

      const projectDescription =
        project.description ||
        project.summary ||
        project.details ||
        project.responsibility;
      if (projectDescription) {
        addBulletPoints(projectDescription);
      }

      const techList = Array.isArray(project.tech)
        ? project.tech
        : Array.isArray(project.technologies)
        ? project.technologies
        : Array.isArray(project.techStack)
        ? project.techStack
        : Array.isArray(project.skills)
        ? project.skills
        : [];

      if (techList.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...textLight);
        const techText = `Technologies: ${techList.join(", ")}`;
        const techLines = doc.splitTextToSize(techText, mainWidth);
        doc.text(techLines, mainX, yMain);
        yMain += techLines.length * 4 + 2;
      }

      const projectLink = [
        project.link,
        project.github,
      ]
        .map(value => (typeof value === "string" ? value.trim() : value))
        .find(value => typeof value === "string" && value.length > 0);

      if (projectLink) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...textMedium);
        
        // Add "Link:" prefix
        doc.text("Link: ", mainX, yMain);
        const prefixWidth = doc.getTextWidth("Link: ");
        
        // Display clean link text in accent color
        doc.setTextColor(...accentColor);
        const linkText = projectLink.replace(/^https?:\/\/(www\.)?/, "");
        const linkLines = doc.splitTextToSize(linkText, mainWidth - prefixWidth);
        
        // Make it clickable with proper URL
        const fullUrl = projectLink.startsWith('http') ? projectLink : `https://${projectLink}`;
        doc.textWithLink(linkLines[0], mainX + prefixWidth, yMain, { url: fullUrl });
        
        // Add underline to indicate it's a link
        doc.setDrawColor(...accentColor);
        doc.setLineWidth(0.2);
        const textWidth = doc.getTextWidth(linkLines[0]);
        doc.line(mainX + prefixWidth, yMain + 0.5, mainX + prefixWidth + textWidth, yMain + 0.5);
        
        // If text wraps to multiple lines, add remaining lines without link
        if (linkLines.length > 1) {
          for (let i = 1; i < linkLines.length; i++) {
            doc.text(linkLines[i], mainX + prefixWidth, yMain + (i * 4));
          }
        }
        
        yMain += linkLines.length * 4 + 2;
      }

      yMain += 4;
    });
  }

  // Education
  if (profile.education && Array.isArray(profile.education)) {
    const edus = profile.education.filter(e => e && e.enabled !== false);
    if (edus.length > 0) {
      addMainSection("Education");
      
      edus.forEach((e, idx) => {
        if (idx > 0) checkPageBreak(25);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...textDark);
        const degree = e.degree || e.title || "";
        doc.text(degree, mainX, yMain);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...textLight);
        
        let yearText = "";
        if (e.yearOfPassing) {
          yearText = e.yearOfPassing;
        } else if (e.yearfrom || e.startDate) {
          yearText = (e.yearfrom || e.startDate || "") + 
                    (e.yearto ? " - " + e.yearto : (e.endDate ? " - " + e.endDate : ""));
        }
        
        if (yearText.trim()) {
          doc.text(yearText, pageW - margin, yMain, { align: "right" });
        }
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...accentColor);
        doc.text(e.university || e.institution || "", mainX, yMain + 5);
        
        yMain += 11;
        
        if (e.cgpa && e.cgpa !== "N/A") {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(...textMedium);
          doc.text(`CGPA: ${e.cgpa}`, mainX, yMain);
          yMain += 7;
        }
        yMain += 2;
      });
    }
  }

  const certificateData = resolveArray(
    profile.certificates,
    studentData.certificates,
    profile.profile?.certificates,
    studentData.profile?.certificates,
    studentData.profile?.profile?.certificates
  ).filter(cert => cert && cert.enabled !== false);

  if (certificateData.length > 0) {
    addMainSection("Certificates");

    certificateData.forEach((cert, idx) => {
      if (idx > 0) checkPageBreak(20);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...textDark);
      doc.text(cert.name || cert.title || cert.course || "Certificate", mainX, yMain);

      const issuer = cert.issuer || cert.provider || cert.organization;
      if (issuer) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(...textLight);
        doc.text(issuer, mainX, yMain + 4.5);
      }

      const issuedDate =
        cert.date ||
        cert.year ||
        cert.issued_on ||
        cert.issuedOn ||
        cert.completionDate;
      if (issuedDate) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...textLight);
        doc.text(issuedDate, pageW - margin, yMain + 4.5, { align: "right" });
      }

      yMain += 12;

      if (cert.description) {
        addBulletPoints(cert.description);
      }

      const credentialId = cert.credentialId || cert.certificateId || cert.credential_id;
      if (credentialId) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...textLight);
        doc.text(`Credential ID: ${credentialId}`, mainX, yMain);
        yMain += 6;
      }

      yMain += 4;
    });
  }

  // Training Section - ONLY COMPLETED
  if (profile.training && Array.isArray(profile.training)) {
    const completedTraining = profile.training.filter(t => 
      t && t.enabled !== false && t.status === "completed"
    );
    
    if (completedTraining.length > 0) {
      addMainSection("Training & Certifications");
      
      completedTraining.forEach((t, idx) => {
        if (idx > 0) checkPageBreak(20);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...textDark);
        doc.text(t.name || t.course || t.title, mainX, yMain);
        
        if (t.trainer || t.instructor || t.provider) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          doc.setTextColor(...textLight);
          doc.text(t.trainer || t.instructor || t.provider, mainX, yMain + 4.5);
        }
        
        yMain += 10;
      });
    }
  }

  // Professional Footer
  const footerY = pageH - 10;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(mainX, footerY - 6, pageW - margin, footerY - 6);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...textLight);
  const dateStr = new Date().toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  });
  doc.text(`Generated on ${dateStr}`, pageW - margin, footerY, { align: "right" });

  // Save PDF
  const fileName = `${(profile.name || "Resume").replace(/\s+/g, "_")}_Resume.pdf`;
  doc.save(fileName);
  return fileName;
};

/**
 * Helper function to prepare student data for resume
 */
export const prepareStudentDataForResume = (studentData) => {
  const parsedProfile = safeParse(studentData.profile);
  const profile = { ...studentData, ...parsedProfile };
  
  return profile;
};