/**
 * PrintPage Component
 * Wrapper component for paginated print content with header/footer and watermarks
 * Matches cover page dimensions and watermark positioning exactly
 * Requirements: 4.1 (A4 dimensions), 4.4 (page breaks), 4.5 (watermarks)
 */

/**
 * PageWatermarks Component
 * Renders watermark images positioned exactly like the cover page
 * Uses absolute positioning within the page container
 * 
 * @returns {JSX.Element} - Watermark elements for a single page
 */
const PageWatermarks = () => (
  <>
    {/* Rareminds Bulb Logo Watermark - Center */}
    <div
      className="print-only-watermark"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.08,
      }}
    >
      <img
        src="/RMLogo.webp"
        alt=""
        style={{
          width: '400px',
          height: '400px',
          objectFit: 'contain',
        }}
      />
    </div>

    {/* Top-left watermark - matches cover page position */}
    <div
      className="print-only-watermark"
      style={{
        position: 'absolute',
        top: '20%',
        left: '16%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.05,
      }}
    >
      <img
        src="/RMLogo.webp"
        alt=""
        style={{
          width: '200px',
          height: '200px',
          objectFit: 'contain',
        }}
      />
    </div>

    {/* Top-right watermark - matches cover page position */}
    <div
      className="print-only-watermark"
      style={{
        position: 'absolute',
        top: '20%',
        right: '16%',
        transform: 'translate(50%, -50%)',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.05,
      }}
    >
      <img
        src="/RMLogo.webp"
        alt=""
        style={{
          width: '200px',
          height: '200px',
          objectFit: 'contain',
        }}
      />
    </div>

    {/* Bottom-left watermark - matches cover page position */}
    <div
      className="print-only-watermark"
      style={{
        position: 'absolute',
        bottom: '20%',
        left: '16%',
        transform: 'translate(-50%, 50%)',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.05,
      }}
    >
      <img
        src="/RMLogo.webp"
        alt=""
        style={{
          width: '200px',
          height: '200px',
          objectFit: 'contain',
        }}
      />
    </div>

    {/* Bottom-right watermark - matches cover page position */}
    <div
      className="print-only-watermark"
      style={{
        position: 'absolute',
        bottom: '20%',
        right: '16%',
        transform: 'translate(50%, 50%)',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.05,
      }}
    >
      <img
        src="/RMLogo.webp"
        alt=""
        style={{
          width: '200px',
          height: '200px',
          objectFit: 'contain',
        }}
      />
    </div>
  </>
);

/**
 * PrintPage Component
 * Wraps content in a print-friendly page structure matching cover page dimensions
 * 
 * @param {Object} props - Component props
 * @param {number} props.pageNumber - Page number for display
 * @param {React.ReactNode} props.children - Page content
 * @returns {JSX.Element} - Print page wrapper
 */
const PrintPage = ({ pageNumber, children }) => {
  return (
    <div 
      className="print-page"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '15mm 20mm',
        boxSizing: 'border-box',
        fontFamily: 'Arial, Helvetica, sans-serif',
        position: 'relative',
        pageBreakAfter: 'always',
        pageBreakInside: 'avoid',
        breakAfter: 'page',
        breakInside: 'avoid',
        background: 'white',
        overflow: 'hidden',
      }}
    >
      {/* Page-specific watermarks - positioned exactly like cover page */}
      <PageWatermarks />

      {/* Page Header - Orange gradient bar with slanted edge and logo */}
      <div 
        className="print-page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px',
          position: 'relative',
          zIndex: 1,
          height: '32px',
        }}
      >
        {/* Left side - Orange gradient bar with slanted edge */}
        <div style={{ position: 'relative', width: '80%', height: '100%' }}>
          <svg
            width="100%"
            height="32"
            viewBox="0 0 400 32"
            preserveAspectRatio="none"
            style={{ display: 'block' }}
          >
            <defs>
              <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#b6c6feff" />
                <stop offset="100%" stopColor="#eef2ffff" />
              </linearGradient>
            </defs>
            <polygon
              points="0,0 384,0 400,32 0,32"
              fill="url(#headerGradient)"
            />
          </svg>
          {/* Title text overlay */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '15px',
              transform: 'translateY(-50%)',
              color: '#1e293b',
              fontSize: '12px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
            }}
          >
            RAREMINDS SkillPassport • AI-Powered Career Assessment
          </div>
        </div>

        {/* Right side - Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginLeft: '10px',
            height: '100%',
          }}
        >
          <img
            src="/RareMinds.webp"
            alt="RareMinds"
            style={{
              height: '36px',
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        </div>
      </div>

      {/* Page Content */}
      <div 
        className="print-page-content" 
        style={{ 
          position: 'relative', 
          zIndex: 1,
          minHeight: 'calc(297mm - 15mm - 15mm - 60px - 50px)', // Full height minus padding and header/footer
        }}
      >
        {children}
      </div>

      {/* Page Footer */}
      <div 
        className="print-page-footer"
        style={{
          position: 'absolute',
          bottom: '15mm',
          left: '20mm',
          right: '20mm',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '8px',
          fontSize: '10px',
          color: '#1e3a5f',
          zIndex: 1,
          background: 'white',
        }}
      >
        {/* Left side - Branding text */}
        <div style={{ lineHeight: '1.5', textAlign: 'left' }}>
          <div style={{ fontWeight: '700', marginBottom: '2px' }}>
            RAREMINDS SkillPassport • AI-Powered Career Assessment
          </div>
          <div style={{ color: '#6b7280', fontSize: '9px' }}>
            This is a digitally generated report, does not need signature
          </div>
        </div>

        {/* Right side - Report info and page number */}
        <div style={{ lineHeight: '1.5', textAlign: 'right' }}>
          <div style={{ fontWeight: '600' }}>
            Report Generated: {new Date().toLocaleDateString()}
          </div>
          <div style={{ color: '#6b7280', fontSize: '9px' }}>
            Confidential • For Student Use Only
          </div>
        </div>
      </div>

      {/* Red Bookmark - Page Number */}
      <div
        style={{
          position: 'absolute',
          top: '0',
          right: '2mm',
          zIndex: 2,
        }}
      >
        <svg width="40" height="30" viewBox="0 0 40 50">
          <polygon
            points="0,0 40,0 40,50 20,40 0,50"
            fill="#dc2626"
          />
          <text
            x="20"
            y="22"
            textAnchor="middle"
            fill="white"
            fontSize="18"
            fontWeight="bold"
            fontFamily="Arial, sans-serif"
          >
            {pageNumber}
          </text>
        </svg>
      </div>
    </div>
  );
};

export default PrintPage;
