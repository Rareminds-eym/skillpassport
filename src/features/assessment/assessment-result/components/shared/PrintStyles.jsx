/**
 * Print Styles Component
 * CSS-in-JS print media styles for A4 formatting
 * Requirements: 4.1 (A4 dimensions), 4.2 (margins), 4.4 (page breaks)
 */

/**
 * PrintStyles Component
 * Renders a style tag with print-specific CSS rules
 * 
 * @returns {JSX.Element} - Style element with print CSS
 */
const PrintStyles = () => (
  <style>
    {`
      /* @page rules for A4 dimensions (210mm x 297mm) */
      /* Validates: Requirements 4.1, 4.2 */
      @page {
        size: A4;
        margin: 15mm 12mm;
      }
      
      /* First page (cover page) specific rules */
      @page :first {
        margin: 0;
      }
      
      @media print {
        /* A4 page dimensions - Validates: Requirement 4.1 */
        .print-view {
          width: 210mm;
          min-height: 297mm;
          margin: 0;
          padding: 0;
        }
        
        /* Cover page print styles - Validates: Requirement 4.4 */
        .cover-page {
          width: 210mm;
          height: 297mm;
          padding: 15mm;
          box-sizing: border-box;
          page-break-after: always;
          page-break-inside: avoid;
          break-after: page;
          break-inside: avoid;
          position: relative;
          overflow: hidden;
        }
        
        /* Table-based repeating header/footer structure */
        .print-table-wrapper {
          display: table;
          width: 100%;
          table-layout: fixed;
        }
        
        /* Repeating header on every page */
        .print-repeating-header {
          display: table-header-group;
        }
        
        /* Repeating footer on every page */
        .print-repeating-footer {
          display: table-footer-group;
        }
        
        /* Main content body */
        .print-table-body {
          display: table-row-group;
        }
        
        /* Header row styling */
        .print-header-row {
          display: table-row;
          height: 60px;
        }
        
        /* Footer row styling */
        .print-footer-row {
          display: table-row;
          height: 50px;
        }
        
        /* Cell styling for header/footer */
        .print-header-cell,
        .print-footer-cell {
          display: table-cell;
          vertical-align: middle;
        }
        
        /* Content row */
        .print-content-row {
          display: table-row;
        }
        
        .print-content-cell {
          display: table-cell;
          padding: 15mm 12mm;
        }
        
        /* Notebook label print styles */
        .notebook-label {
          border: 2px dashed #1e3a5f !important;
          border-radius: 8px !important;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        
        /* Connector line print styles */
        .connector-line {
          border-left: 2px dashed #1e3a5f !important;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        
        .print-content {
          page-break-before: auto;
        }
        
        .print-only-watermark {
          display: block !important;
        }
        
        /* Hide old fixed footer in print */
        .print-footer-old {
          display: none !important;
        }
        
        /* Ensure images are print-ready with appropriate resolution */
        /* Validates: Requirement 4.3 */
        img {
          max-width: 100%;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }
        
        /* Maintain color accuracy for branding elements */
        /* Validates: Requirement 4.5 */
        * {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
        
        /* SVG print optimization for illustrations */
        svg {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        
        /* Prevent orphaned content */
        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid;
          break-after: avoid;
        }
        
        /* Keep cards and sections together */
        .card, .info-box, .summary-box {
          page-break-inside: avoid;
          break-inside: avoid;
        }
      }
      
      @media screen {
        .print-only-watermark {
          display: none;
        }
        
        /* Screen preview styling for cover page */
        .cover-page {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }
        
        /* Screen preview for table structure */
        .print-table-wrapper {
          display: block;
        }
        
        .print-repeating-header,
        .print-repeating-footer {
          display: block;
        }
        
        .print-table-body {
          display: block;
        }
        
        .print-header-row,
        .print-footer-row,
        .print-content-row {
          display: block;
        }
        
        .print-header-cell,
        .print-footer-cell,
        .print-content-cell {
          display: block;
        }
      }
    `}
  </style>
);

export default PrintStyles;
