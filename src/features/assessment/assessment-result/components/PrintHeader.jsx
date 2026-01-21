/**
 * PrintHeader Component
 * Decorative header for print view pages (excluding cover page)
 * Features horizontal gradient bar with slanted edge and logo
 * Colors aligned with cover page theme
 */

const PrintHeader = () => {
  return (
    <div
      className="print-header"
      style={{
        width: '100%',
        height: '50px',
        position: 'relative',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'white',
      }}
    >
      {/* Left side - Orange/Gold gradient bar with slanted edge */}
      <div
        style={{
          position: 'relative',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          flex: '0 0 auto',
          maxWidth: '75%',
        }}
      >
        {/* SVG for slanted bar */}
        <svg
          width="520"
          height="36"
          viewBox="0 0 520 36"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
          }}
        >
          <defs>
            <linearGradient id="barGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d0e3f1ff" />
              <stop offset="100%" stopColor="#f7ffffff" />
            </linearGradient>
          </defs>
          {/* Polygon with slanted right edge */}
          <polygon points="0,0 500,0 520,36 0,36" fill="url(#barGradient)" />
        </svg>
        {/* Text overlay */}
        <span
          style={{
            position: 'relative',
            zIndex: 1,
            color: '#1e293b',
            fontSize: '14px',
            fontWeight: '600',
            fontFamily: 'Arial, Helvetica, sans-serif',
            whiteSpace: 'nowrap',
            paddingLeft: '20px',
            paddingRight: '50px',
          }}
        >
          RAREMINDS SkillPassport • AI-Powered Career Assessment
        </span>
      </div>

      {/* Right side - Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          paddingRight: '20px',
        }}
      >
        <img
          src="/RareMinds ISO Logo-01.png"
          alt="Rareminds"
          style={{
            height: '40px',
            width: 'auto',
            objectFit: 'contain',
          }}
        />
      </div>
    </div>
  );
};

export default PrintHeader;
