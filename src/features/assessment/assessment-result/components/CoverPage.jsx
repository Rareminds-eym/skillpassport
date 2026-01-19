/**
 * CoverPage Component
 * School notebook label style cover page for Assessment Report PrintView
 * Features Rareminds branding, themed illustrations, and student info
 * Optimized for A4 print (210mm x 297mm) with 15mm margins
 */

/**
 * @typedef {Object} StudentInfo
 * @property {string} name - Student's full name
 * @property {string} regNo - Registration number
 * @property {string} college - School or college name
 * @property {string} stream - Programme/stream
 */

/**
 * @typedef {Object} CoverPageProps
 * @property {StudentInfo} studentInfo - Student information to display
 */

// Branding constants
const BRANDING = {
  logo: '/RareMinds ISO Logo-01.png',
  taglinePrefix: 'Shape Your Future — ',
  taglineHighlight: 'AI Career Assessment Report',
  subTagline: 'Discover Strengths. Explore Careers. Build Your Future.',
  statistics: '2,50,000+ Career Profiles. 300+ Partner Schools. 45+ Industry Domains.',
  engineText: 'The Career Discovery Engine.',
  email: 'ieducators@rareminds.in'
};

// Illustration theme labels with positions
const ILLUSTRATION_THEMES = [
  { label: 'Career Counselling', position: 'bottom-left' },
  { label: 'University Network', position: 'bottom-center' },
  { label: 'Government Collaborations', position: 'right' },
  { label: 'Industries and Firms', position: 'top-right' }
];

/**
 * BrandingHeader Component
 * Displays Rareminds logo, taglines, statistics, and contact information
 * @returns {JSX.Element} Branding header component
 */
const BrandingHeader = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        marginBottom: '20px'
      }}
    >
      {/* Rareminds Logo - centered at top */}
      <img
        src={BRANDING.logo}
        alt="Rareminds Logo"
        style={{
          width: '240px',
          height: 'auto',
          marginBottom: '15px'
        }}
      />
      
      {/* Main Tagline with highlighted "AI Career Assessment Report" */}
      <h1
        style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#1e3a5f',
          margin: '0 0 8px 0',
          lineHeight: '1.3'
        }}
      >
        {BRANDING.taglinePrefix}
        <span
          style={{
            color: '#4f46e5',
            backgroundColor: '#eef2ff',
            padding: '2px 8px',
            borderRadius: '4px'
          }}
        >
          {BRANDING.taglineHighlight}
        </span>
      </h1>
      
      {/* Sub-tagline */}
      <p
        style={{
          fontSize: '12px',
          color: '#4a5568',
          margin: '0 0 8px 0',
          fontStyle: 'italic'
        }}
      >
        {BRANDING.subTagline}
      </p>
      
      {/* Statistics */}
      <p
        style={{
          fontSize: '11px',
          color: '#2d3748',
          margin: '0 0 8px 0',
          fontWeight: '600'
        }}
      >
        {BRANDING.statistics}
      </p>
      
      {/* The Early Learning Engine text */}
      <p
        style={{
          fontSize: '13px',
          color: '#1e3a5f',
          margin: '0 0 10px 0',
          fontWeight: 'bold'
        }}
      >
        {BRANDING.engineText}
      </p>
      
      {/* Contact email with envelope icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '11px',
          color: '#4a5568'
        }}
      >
        {/* Envelope icon (SVG) */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4a5568"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 6L12 13L2 6" />
        </svg>
        <span>{BRANDING.email}</span>
      </div>
    </div>
  );
};

/**
 * IllustrationContainer Component
 * Renders a rectangular container with Hero background image
 * @returns {JSX.Element} Illustration container component
 */
const IllustrationContainer = () => {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '360px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '30px',
        marginBottom: '20px'
      }}
    >
      {/* Rectangular illustration container with Hero background */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '640px',
          height: '100%'
        }}
      >
        {/* Rectangle container with Hero-bg.jpg image */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '3px solid #1e3a5f',
            boxShadow: '0 4px 15px rgba(30, 58, 95, 0.2)'
          }}
        >
          <img
            src="/assets/HomePage/Hero-bg.jpg"
            alt="Education Illustration"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center'
            }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * NotebookLabel Component
 * Displays all student profile details in a notebook label style with dashed border
 * Uses 3x2 grid layout for details (3 columns, 2 rows)
 * @param {Object} props - Component props
 * @param {Object} props.studentInfo - Student information object
 * @param {string} props.studentInfo.name - Student's full name
 * @param {string} props.studentInfo.regNo - Registration number
 * @param {string} props.studentInfo.college - School or college name
 * @param {string} props.studentInfo.stream - Programme/stream
 * @param {string} props.studentInfo.grade - Grade level
 * @param {string} props.studentInfo.school - School name
 * @param {string} [props.description] - Optional description text
 * @returns {JSX.Element} Notebook label component
 */
const NotebookLabel = ({ studentInfo, description }) => {
  // Safe student info with fallback values
  const safeInfo = {
    name: studentInfo?.name && studentInfo.name.trim() ? studentInfo.name : '—',
    regNo: studentInfo?.regNo && studentInfo.regNo.trim() ? studentInfo.regNo : '—',
    college: studentInfo?.college && studentInfo.college.trim() ? studentInfo.college : '—',
    stream: studentInfo?.stream && studentInfo.stream.trim() ? studentInfo.stream : '—',
    grade: studentInfo?.grade && studentInfo.grade.toString().trim() ? studentInfo.grade : '—',
    school: studentInfo?.school && studentInfo.school.trim() ? studentInfo.school : '—'
  };
  
  // Default description about transforming education
  const displayDescription = description || 
    'Transforming education through innovative learning solutions that inspire creativity and build future-ready skills.';

  // Style for detail labels
  const labelStyle = {
    fontSize: '11px',
    color: '#1e3a5f',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'block',
    marginBottom: '2px'
  };

  // Style for detail values
  const valueStyle = {
    fontSize: '12px',
    fontWeight: '600',
    color: '#1e293b'
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '160px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '160mm' // Double width - spans most of the page
      }}
    >
      {/* Intro text above notebook label */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '24px'
        }}
      >
        <p
          style={{
            fontSize: '14px',
            color: '#1e3a5f',
            margin: '2px 0 6px 0',
            fontWeight: '600'
          }}
        >
          Congratulations, <span style={{ color: '#000000ff' }}>{safeInfo.name}</span>! Your career journey starts here.
        </p>
        <p
          style={{
            fontSize: '11px',
            color: '#4a5568',
            margin: '0 0 24px 0'
          }}
        >
          Inside: <span style={{ color: '#258ed2', fontWeight: '500' }}>Interest Profile</span> • <span style={{ color: '#258ed2', fontWeight: '500' }}>Skill Analysis</span> • <span style={{ color: '#258ed2', fontWeight: '500' }}>Career Matches</span> • <span style={{ color: '#258ed2', fontWeight: '500' }}>Development Roadmap</span>
        </p>
      </div>

      {/* Notebook label container with dashed border */}
      <div
        className="notebook-label"
        style={{
          border: '2px dashed #1e3a5f',
          borderRadius: '8px',
          padding: '16px 24px',
          backgroundColor: 'white',
          position: 'relative',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}
      >
        {/* Student Details - 3x2 Grid Layout (3 columns, 2 rows) */}
        <div 
          style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px 20px',
            marginBottom: '14px'
          }}
        >
          {/* Row 1, Col 1: Student Name */}
          <div>
            <span style={labelStyle}>Student Name</span>
            <span style={valueStyle}>{safeInfo.name}</span>
          </div>
          
          {/* Row 1, Col 2: Registration Number */}
          <div>
            <span style={labelStyle}>Registration No.</span>
            <span style={valueStyle}>{safeInfo.regNo}</span>
          </div>
          
          {/* Row 1, Col 3: Programme/Stream */}
          <div>
            <span style={labelStyle}>Programme/Stream</span>
            <span style={valueStyle}>{safeInfo.stream}</span>
          </div>
          
          {/* Row 2, Col 1: Grade */}
          <div>
            <span style={labelStyle}>Grade</span>
            <span style={valueStyle}>{safeInfo.grade}</span>
          </div>
          
          {/* Row 2, Col 2: School */}
          <div>
            <span style={labelStyle}>School</span>
            <span style={valueStyle}>{safeInfo.school}</span>
          </div>
          
          {/* Row 2, Col 3: Assessment Date */}
          <div>
            <span style={labelStyle}>Assessment Date</span>
            <span style={valueStyle}>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
        
        {/* Description text */}
        <p
          style={{
            fontSize: '9px',
            color: '#6b7280',
            margin: '0',
            lineHeight: '1.4',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '10px',
            fontStyle: 'italic',
            textAlign: 'center'
          }}
        >
          {displayDescription}
        </p>
      </div>
    </div>
  );
};

/**
 * CoverPage component for Assessment Report PrintView
 * @param {CoverPageProps} props - Component props
 * @returns {JSX.Element} Cover page component
 */
const CoverPage = ({ studentInfo }) => {
  // Debug: Log what studentInfo is received
  console.log('CoverPage - studentInfo received:', studentInfo);
  console.log('CoverPage - studentInfo keys:', studentInfo ? Object.keys(studentInfo) : 'null');
  console.log('CoverPage - grade value:', studentInfo?.grade);
  console.log('CoverPage - school value:', studentInfo?.school);
  console.log('CoverPage - college value:', studentInfo?.college);
  
  // Safe student info with fallback values and better handling
  const safeStudentInfo = {
    name: studentInfo?.name || '—',
    regNo: studentInfo?.regNo || '—',
    college: studentInfo?.college || studentInfo?.school || '—',
    stream: studentInfo?.stream || '—',
    // Try multiple possible field names for grade
    grade: studentInfo?.grade?.toString() || studentInfo?.class || studentInfo?.gradeLevel || '—',
    // Try multiple possible field names for school
    school: studentInfo?.school || studentInfo?.college || studentInfo?.schoolName || studentInfo?.institution || '—'
  };
  
  // Debug: Log safeStudentInfo
  console.log('CoverPage - safeStudentInfo created:', safeStudentInfo);

  return (
    <div 
      className="cover-page"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '15mm',
        boxSizing: 'border-box',
        fontFamily: 'Arial, Helvetica, sans-serif',
        position: 'relative',
        pageBreakAfter: 'always',
        pageBreakInside: 'avoid',
        background: 'white'
      }}
    >
      {/* Page content */}
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* BrandingHeader - Task 2 */}
        <BrandingHeader />
        
        {/* IllustrationContainer - Task 3 */}
        <IllustrationContainer />
        
        {/* NotebookLabel - Task 4 - Now displays all student profile details */}
        <NotebookLabel studentInfo={safeStudentInfo} />
      </div>
    </div>
  );
};

// Export branding constants and components for use in sub-components and testing
export { BRANDING, ILLUSTRATION_THEMES, NotebookLabel };

export default CoverPage;
