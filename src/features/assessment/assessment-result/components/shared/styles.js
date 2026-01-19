/**
 * Shared Print Styles
 * Common inline styles used across all grade-level PrintView components
 * Requirements: 3.1 - Shared styles utility module
 */

export const printStyles = {
  page: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '10px',
    lineHeight: '1.3',
    color: '#1f2937',
    padding: '0',
    marginBottom: '12px',
  },
  lastPage: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '10px',
    lineHeight: '1.3',
    color: '#1f2937',
    padding: '0',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#1e293b',
    borderBottom: '2px solid #4f46e5',
    paddingBottom: '2px',
    marginTop: '0',
    marginBottom: '3px',
  },
  subTitle: {
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#374151',
    marginTop: '3px',
    marginBottom: '3px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '5px',
    fontSize: '9px',
  },
  th: {
    background: '#f1f5f9',
    padding: '6px 8px',
    border: '1px solid #e2e8f0',
    textAlign: 'left',
    fontWeight: '600',
    color: '#475569',
  },
  td: {
    padding: '6px 8px',
    border: '1px solid #e2e8f0',
    verticalAlign: 'top',
  },
  card: {
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '4px',
    marginBottom: '3px',
    background: '#ffffff',
    pageBreakInside: 'avoid',
    breakInside: 'avoid',
  },
  badge: {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '8px',
    fontWeight: '600',
  },
  summaryBox: {
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '6px',
    padding: '6px 8px',
    marginTop: '5px',
    pageBreakInside: 'avoid',
    breakInside: 'avoid',
  },
  finalBox: {
    background: '#1e293b',
    color: 'white',
    borderRadius: '6px',
    padding: '8px 10px',
    marginTop: '8px',
    pageBreakInside: 'avoid',
    breakInside: 'avoid',
  },
  progressBar: {
    height: '5px',
    background: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '3px',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
  },
};

export default printStyles;
