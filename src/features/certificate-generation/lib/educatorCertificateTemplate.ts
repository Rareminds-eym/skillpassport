/**
 * Educator Certificate HTML Template Generator
 * Special certificate template for educators (learner_type = 'educator')
 * Based on Rareminds_Transparent_Gold_Design
 */

interface EducatorCertificateData {
  studentName: string;
  studentId: string;
  courseName: string;
  completionDate: string;
  instructorName?: string;
  credentialId: string;
  courseType?: 'course' | 'webinar';
  collegeName?: string;
}

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param text - The text to escape
 * @returns Escaped text safe for HTML insertion
 */
function escapeHtml(text: string): string {
  const htmlEscapeMap: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'\/]/g, (char) => htmlEscapeMap[char]);
}

export function generateEducatorCertificateHTML(data: EducatorCertificateData, baseUrl: string = ''): string {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isWebinar = data.courseType === 'webinar';
  const certificateType = isWebinar ? 'OF PARTICIPATION' : 'OF COMPLETION';
  const achievementText = isWebinar 
    ? 'participated in' 
    : 'successfully completed the course on';
  const dateLabel = isWebinar ? 'conducted by Rareminds on' : 'completed on';
  const college = data.collegeName || 'Rareminds Skill Ecosystem';

  return `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Rareminds | Certificate ${escapeHtml(certificateType)}</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Cormorant+Garamond:wght@600;700&display=swap">
    <style>
        :root {
            --gold: #f4c64d;
            --bright: #ffdb60;
            --ink: #050505
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        html, body {
            width: 3579px;
            height: 2551px;
            min-height: 2551px;
            overflow: visible;
            font-family: Montserrat, Arial, sans-serif;
            background: radial-gradient(ellipse at 50% 45%, #0b0b0b 0%, #030303 75%);
            color: white;
        }

        .background {
            position: relative;
            isolation: isolate;
            overflow: hidden;
            width: 3579px;
            height: 2551px;
            background: radial-gradient(ellipse at 50% 45%, #0b0b0b 0%, #030303 75%);
            border: 8px solid #e9af0b;
            border-radius: 26px;
        }

        .pattern {
            position: absolute;
            left: -3.55%;
            top: -3.45%;
            width: 107.1%;
            height: 106.9%;
            max-width: none;
            z-index: -1;
            object-fit: fill;
            object-position: center;
            pointer-events: none;
            opacity: .3
        }

        .top {
            position: absolute;
            top: 80px;
            left: 115px;
            right: 145px;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
        }

        .brand {
            display: flex;
            gap: 35px;
            align-items: flex-start;
            color: var(--gold);
        }

        .brand-logo {
            width: 895px;
            height: 226px;
            object-fit: contain;
            display: block;
        }

        .motto {
            font-size: 40px;
            line-height: 1.45;
            letter-spacing: .16em;
            border-left: 8px solid var(--gold);
            padding-left: 70px;
            color: var(--gold);
            margin-top: 10px;
        }

        .main {
            position: absolute;
            top: 340px;
            left: 360px;
            right: 360px;
            text-align: center;
        }

        .heading {
            font-size: 150px;
            font-weight: 700;
            letter-spacing: .28em;
            color: #f2c659;
            margin: 0 0 5px .28em;
            line-height: 1.3;
        }

        .subhead {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 65px;
            letter-spacing: .5em;
            font-size: 53px;
            margin: 0 0 95px .5em;
        }

        .subhead:before,
        .subhead:after {
            content: "";
            display: block;
            width: 10%;
            height: 8px;
            background: var(--gold);
        }

        .certify {
            font-size: 37px;
            letter-spacing: .05em;
            margin-bottom: 10px;
        }

        .recipient {
            height: 120px;
            width: 45%;
            margin: 10px auto 45px;
            border-bottom: 8px solid var(--gold);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 57px;
            font-weight: 600;
            color: var(--gold);
        }

        .college {
            font-size: 39px;
            letter-spacing: .03em;
            margin-bottom: 25px;
        }

        .gold {
            color: var(--gold);
            font-weight: 700;
        }

        .event {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 79px;
            font-weight: 700;
            color: var(--gold);
            margin: 25px 0 0;
            line-height: 1;
        }

        .event-sub {
            font-size: 39px;
            margin: 10px 0 35px;
            letter-spacing: .03em;
        }

        .conducted {
            font-size: 37px;
            margin-bottom: 45px;
        }

        .description {
            font-size: 37px;
            line-height: 1.5;
            letter-spacing: .015em;
            margin: 30px auto;
            max-width: 82%;
        }

        .pillars {
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 95px auto 0;
            width: 72%;
            gap: 70px;
        }

        .pillar {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 25px;
            flex: 1;
            text-align: left;
            font-size: 30px;
            line-height: 1.55;
        }

        .pillar img {
            width: 145px;
            height: 145px;
            object-fit: contain;
            flex-shrink: 0;
        }

        .pillar+.pillar {
            border-left: 4px solid var(--gold);
            padding-left: 70px;
        }

        .footer {
            position: absolute;
            bottom: 115px;
            left: 115px;
            right: 180px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 35px;
            line-height: 1.5;
        }

        .date strong {
            display: block;
            color: var(--gold);
            font-size: 1.1em;
        }

        .signature {
            text-align: center;
            min-width: 20%;
        }

        .signature img {
            width: 228px;
            height: 180px;
            object-fit: contain;
            display: block;
            margin: 0 auto;
        }

        .sigline {
            height: 4px;
            background: var(--gold);
            margin: 0 auto 20px;
            width: 100%;
        }

        .signature .role {
            color: var(--gold);
        }

        .credential-id {
            position: absolute;
            bottom: 50px;
            right: 180px;
            font-size: 32px;
            color: var(--gold);
        }
    </style>
</head>
<body style="width: 3579px; height: 2551px; min-height: 2551px; margin: 0; padding: 0; overflow: visible;">
    <section class="background">
        <img class="pattern" src="${baseUrl}/certificate/educator/Rareminds_Transparent_Gold_Design.svg" alt="" aria-hidden="true">
        <header class="top">
            <div class="brand">
                <img class="brand-logo" src="${baseUrl}/certificate/educator/RM_Logo.svg" alt="Rareminds - Applied Learning. Transforming Work." width="895" height="226">
            </div>
            <div class="motto">LET'S BUILD<br>THE FUTURE.<br>TOGETHER.</div>
        </header>
        <main class="main">
            <h1 class="heading">CERTIFICATE</h1>
            <div class="subhead">${escapeHtml(certificateType)}</div>
            <div class="certify">This is to certify that</div>
            <div class="recipient">${escapeHtml(data.studentName.toUpperCase())}</div>
            <div class="college">of <span class="gold">${escapeHtml(college)}</span> ${escapeHtml(achievementText)}</div>
            <h2 class="event">"${escapeHtml(data.courseName)}"</h2>
            <div class="event-sub">A Future Educator Discovery Session</div>
            <div class="conducted">${escapeHtml(dateLabel)} <span class="gold">${formatDate(data.completionDate)}</span></div>
            <p class="description">Through guided reflection and a practical classroom experience, the session provided opportunities to explore personal educator tendencies, recognise different learner needs and discover how teaching approaches can be adapted to support understanding.</p>
            <p class="description" style="margin-top: 20px;">Participants were encouraged to identify a teaching strength and a capability to develop next, taking a meaningful step towards reflective, adaptable and future-ready teaching practice.</p>
            <div class="pillars">
                <div class="pillar">
                    <img src="${baseUrl}/certificate/educator/01_Discover_Your_Strengths.svg" alt="">
                    <span>Discover<br>Your Strengths</span>
                </div>
                <div class="pillar">
                    <img src="${baseUrl}/certificate/educator/02_Understand_Your_Learners.svg" alt="">
                    <span>Understand<br>Your Learners</span>
                </div>
                <div class="pillar">
                    <img src="${baseUrl}/certificate/educator/03_Build_Your_Next_Capability.svg" alt="">
                    <span>Build Your<br>Next Capability</span>
                </div>
            </div>
        </main>
        <footer class="footer">
            <div class="date">Date of Issue:<strong>${formatDate(data.completionDate)}</strong></div>
            <div class="signature">
                <img src="${baseUrl}/certificate/educator/sign.svg" alt="Subashini Ramaswamy signature" width="228" height="180">
                <div class="sigline"></div>
                <div>Subashini Ramaswamy</div>
                <div class="role">Founder | Rareminds</div>
            </div>
        </footer>
        <div class="credential-id">Credential ID: ${escapeHtml(data.credentialId)}</div>
    </section>
</body>
</html>`;
}
