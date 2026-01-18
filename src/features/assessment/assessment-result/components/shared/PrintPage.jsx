/**
 * PrintPage Component
 * Wrapper component for paginated print content with header/footer
 * Requirements: 4.1 (A4 dimensions), 4.4 (page breaks)
 */

import { printStyles } from './styles';

/**
 * PrintPage Component
 * Renders a single page with consistent header, footer, and page number
 * Uses CSS table structure for repeating headers/footers in print
 * 
 * @param {Object} props - Component props
 * @param {number} props.pageNumber - The page number to display
 * @param {React.ReactNode} props.children - Page content
 * @param {boolean} props.isLastPage - Whether this is the last page (no page break after)
 * @returns {JSX.Element} - Print page component
 */
const PrintPage = ({ pageNumber, children, isLastPage = false }) => {
  return (
    <div 
      className="print-page"
      style={{
        ...printStyles.page,
        pageBreakAfter: isLastPage ? 'auto' : 'always',
        breakAfter: isLastPage ? 'auto' : 'page',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        position: 'relative',
      }}
    >
      {/* Table wrapper for repeating header/footer in print */}
      <div className="print-table-wrapper">
        {/* Repeating Header */}
        <div className="print-repeating-header">
          <div className="print-header-row">
            <div className="print-header-cell" style={{ padding: '12mm 12mm 0 12mm' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '4px',
                marginBottom: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img 
                    src="/logo.png" 
                    alt="Logo" 
                    style={{ height: '24px', width: 'auto' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 'bold', 
                    color: '#1e3a5f' 
                  }}>
                    Career Assessment Report
                  </span>
                </div>
                <span style={{ 
                  fontSize: '9px', 
                  color: '#6b7280' 
                }}>
                  Confidential
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="print-table-body">
          <div className="print-content-row">
            <div className="print-content-cell" style={{ padding: '0 12mm' }}>
              {children}
            </div>
          </div>
        </div>

        {/* Repeating Footer */}
        <div className="print-repeating-footer">
          <div className="print-footer-row">
            <div className="print-footer-cell" style={{ padding: '0 12mm 12mm 12mm' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #e2e8f0',
                paddingTop: '4px',
                marginTop: '8px',
                fontSize: '8px',
                color: '#9ca3af',
              }}>
                <span>© {new Date().getFullYear()} Skill Passport. All rights reserved.</span>
                <span>Page {pageNumber}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintPage;
