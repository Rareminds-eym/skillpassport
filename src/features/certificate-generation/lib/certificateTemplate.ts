/**
 * Certificate HTML Template Generator
 * Generates certificate HTML with dynamic data
 */

interface CertificateData {
  studentName: string;
  studentId: string;
  courseName: string;
  completionDate: string;
  instructorName?: string;
  credentialId: string;
  courseType?: 'course' | 'webinar';
}

export function generateCertificateHTML(data: CertificateData, baseUrl: string = ''): string {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isWebinar = data.courseType === 'webinar';
  const certificateType = isWebinar ? 'of PARTICIPATION' : 'of COMPLETION';
  const achievementText = isWebinar 
    ? 'has actively participated in the webinar session on' 
    : 'has successfully completed the course on';
  const dateLabel = isWebinar ? 'conducted on' : 'completed on';

  return `<!doctype html>
<html>
  <head>
    <title>Certificate ${certificateType} - ${data.studentName}</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=Edge">
    
    <!-- Google Fonts -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Open+Sans:300,regular,500,600,700,800&subset=latin">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Montserrat:100,200,300,regular,500,600,700,800,900&subset=latin">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Poppins:100,200,300,regular,500,600,700,800,900&subset=latin">
    
    <style>
      /* Reset and base styles */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      html, body {
        width: 3579px;
        height: 2551px;
        min-height: 2551px;
        overflow: visible;
        font-family: 'Open Sans', sans-serif;
      }
      
      .background {
        width: 3579px;
        height: 2551px;
        min-height: 2551px;
        overflow: hidden;
        position: relative;
      }
      
      /* Layout structure - Removed complex flex layout */
      
      /* Certificate Title - Absolutely Positioned */
      .title {
        position: absolute;
        top: 250px;
        left: 350px;
        text-align: center;
        z-index: 2;
      }
      
      .certificate {
        font-family: 'Montserrat', sans-serif;
        font-size: 9.5rem;
        font-weight: 700;
        color: #ffffff;
        text-transform: uppercase;
        letter-spacing: 15px;
        margin-bottom: 40px;
        line-height: 1;
        display: block;
        white-space: nowrap;
      }
      
      .text {
        font-family: 'Montserrat', sans-serif;
        font-size: 4.5rem;
        font-weight: 400;
        color: #ffffff;
        text-transform: uppercase;
        letter-spacing: 12px;
        line-height: 1;
        display: block;
        white-space: nowrap;
      }
      
      /* Skill Ecosystem Logo - Absolutely Positioned */
      .skill-ecosystem-logo {
        position: absolute;
        top: 1350px;
        left: 350px;
        width: 520px;
        height: 520px;
        z-index: 2;
      }
      
      /* Right column - Certificate content - Absolutely Positioned */
      .col-2 {
        position: absolute;
        top: 50%;
        left: 1400px;
        width: 2129px;
        transform: translateY(-50%);
        max-width: none;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        z-index: 2;
        padding: 0 50px;
      }
      
      /* "THIS IS TO CERTIFY THAT" */
      .text-2 {
        font-family: 'Open Sans', sans-serif;
        font-size: 2.6rem;
        font-weight: 500;
        color: #333333;
        text-transform: uppercase;
        letter-spacing: 8px;
        margin-bottom: 50px;
      }
      
      /* Student name */
      .student-name {
        font-family: 'Poppins', sans-serif;
        font-size: 5rem;
        font-weight: 700;
        color: #031e51;
        text-align: center;
        margin: 0 0 40px 0;
        line-height: 1.1;
      }
      
      /* Student ID line */
      .text-3 {
        font-family: 'Open Sans', sans-serif;
        font-size: 3.5rem;
        font-weight: 400;
        color: #333333;
        line-height: 1.6;
        margin: 0 0 60px 0;
        text-align: center;
      }
      
      .text-3 strong {
        font-weight: 600;
        color: #031e51;
      }
      
      /* Course name */
      .course-name {
        font-family: 'Poppins', sans-serif;
        font-size: 3.2rem;
        font-weight: 700;
        color: #031e51;
        text-align: center;
        margin: 0 0 60px 0;
        line-height: 1.3;
        max-width: 90%;
      }
      
      /* Date line */
      .text-4 {
        font-family: 'Open Sans', sans-serif;
        font-size: 3.5rem;
        font-weight: 400;
        color: #333333;
        margin: 0;
        text-align: center;
      }
      
      .completion-date {
        font-weight: 700;
        color: #031e51;
      }
      
      /* Signature Section - Left */
      .signature-left {
        position: absolute;
        bottom: 420px;
        left: 1900px;
        transform: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        z-index: 2;
        background: rgba(255, 255, 255, 0.95);
        padding: 30px 40px;
        border-radius: 8px;
        min-width: 400px;
      }
      
      /* Signature Section - Right */
      .signature-right {
        position: absolute;
        bottom: 420px;
        left: 2500px;
        transform: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        z-index: 2;
        background: rgba(255, 255, 255, 0.95);
        padding: 30px 40px;
        border-radius: 8px;
        min-width: 400px;
      }
      
      /* Signature Line */
      .signature-line {
        width: 320px;
        height: 2px;
        background-color: #333333;
        margin: 20px 0 15px 0;
      }
      
      /* Signature Name */
      .signature-name {
        font-family: 'Open Sans', sans-serif;
        font-size: 2rem;
        font-weight: 600;
        color: #000000;
        margin: 0 0 8px 0;
        line-height: 1.3;
      }
      
      /* Signature Title */
      .signature-title {
        font-family: 'Open Sans', sans-serif;
        font-size: 1.5rem;
        font-weight: 400;
        color: #666666;
        margin: 0;
        line-height: 1.3;
      }
      
      /* Platform Name */
      .platform-name {
        position: absolute;
        bottom: 250px;
        left: 1900px;
        width: 1100px;
        font-family: 'Open Sans', sans-serif;
        font-size: 2.8rem;
        font-weight: 800;
        color: #333333;
        text-align: center;
        transform: none;
        z-index: 2;
      }
      
      /* Rareminds logo */
      .rareminds-logo-01-copy-1 {
        position: absolute;
        top: 80px;
        right: 50px;
        width: 841px;
        height: 219px;
        z-index: 2;
      }
      
      /* Credential ID */
      .credential-id {
        position: absolute;
        bottom: 80px;
        right: 50px;
        font-family: 'Open Sans', sans-serif;
        font-size: 2.4rem;
        font-weight: 500;
        color: #333333;
        text-align: right;
        line-height: 1.5;
        z-index: 2;
      }
      
      /* Graphic elements */
      .graphic-copy {
        position: absolute;
        top: 0;
        left: 0;
        width: 3094px;
        height: 2551px;
        z-index: 1;
        max-width: none;
      }
      
      /* Ensure container shows all content */
      .background::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #ffffff;
        z-index: 0;
      }
    </style>
  </head>
  <body style="width: 3579px; height: 2551px; min-height: 2551px; margin: 0; padding: 0; overflow: visible;">
    <div class="background" style="width: 3579px; height: 2551px; min-height: 2551px; position: relative; overflow: hidden;">
      <img class="graphic-copy" src="${baseUrl}/certificate/images/graphic_copy.png" alt="" width="3094" height="2551">
      
      <!-- Certificate Title - Absolutely Positioned -->
      <div class="title">
        <p class="certificate">Certificate</p>
        <p class="text">${certificateType}</p>
      </div>
      
      <!-- Skill Ecosystem Logo - Absolutely Positioned -->
      <img class="skill-ecosystem-logo" src="${baseUrl}/certificate/images/skill_ecosystem_logo.png" alt="" width="520" height="520">
      
      <!-- Right Side Content -->
      <div class="col-2">
        <p class="text-2">This is to certify that</p>
        <p class="student-name">${data.studentName}</p>
        <p class="text-3">with Learner Id <strong style="font-weight:500;font-size:2rem">${data.studentId}</strong><br>${achievementText}</p>
        <p class="course-name">${data.courseName}</p>
        <p class="text-4">${dateLabel} <span class="completion-date">${formatDate(data.completionDate)}</span></p>
      </div>
      
      <!-- Footer Signatures - Simplified Structure -->
      <div class="signature-left">
        <img src="${baseUrl}/assets/certificates/instructor.png" alt="Instructor Signature" width="150" height="60">
        <div class="signature-line"></div>
        <p class="signature-name">${data.instructorName || 'Prof. Michael Chen'}</p>
        <p class="signature-title">Course Instructor</p>
      </div>
      
      <div class="signature-right">
        <img src="${baseUrl}/assets/certificates/admin.png" alt="Administrator Signature" width="150" height="60">
        <div class="signature-line"></div>
        <p class="signature-name">Platform Administrator</p>
        <p class="signature-title">Skill Ecosystem</p>
      </div>
      
      <!-- Platform Name -->
      <div class="platform-name">Rareminds Skill Ecosystem Platform</div>
      
      <img class="rareminds-logo-01-copy-1" src="${baseUrl}/certificate/images/rareminds_logo-01_copy_1.png" alt="">
      <div class="credential-id">Credential ID: ${data.credentialId}</div>
    </div>
  </body>
</html>`;
}
