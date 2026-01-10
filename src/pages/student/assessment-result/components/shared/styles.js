/**
 * Shared Print Styles
 * Common inline styles used across all grade-level PrintView components
 * Requirements: 3.1 - Shared styles utility module
 */

export const printStyles = {
  page: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '10px',
    lineHeight: '1.4',
    color: '#1f2937',
    padding: '0',
    marginBottom: '20px',
  },
  lastPage: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '10px',
    lineHeight: '1.4',
    color: '#1f2937',
    padding: '0',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#1e293b',
    borderBottom: '2px solid #4f46e5',
    paddingBottom: '6px',
    marginTop: '20px',
    marginBottom: '12px',
  },
  subTitle: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#374151',
    marginTop: '14px',
    marginBottom: '8px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '12px',
    fontSize: '10px',
  },
  th: {
    background: '#f1f5f9',
    padding: '8px 10px',
    border: '1px solid #e2e8f0',
    textAlign: 'left',
    fontWeight: '600',
    color: '#475569',
  },
  td: {
    padding: '8px 10px',
    border: '1px solid #e2e8f0',
    verticalAlign: 'top',
  },
  card: {
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '10px',
    background: '#fafafa',
    pageBreakInside: 'avoid',
    breakInside: 'avoid',
  },
  badge: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '9px',
    fontWeight: '600',
  },
  summaryBox: {
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '6px',
    padding: '12px 15px',
    marginTop: '15px',
    pageBreakInside: 'avoid',
    breakInside: 'avoid',
  },
  finalBox: {
    background: '#1e293b',
    color: 'white',
    borderRadius: '6px',
    padding: '15px 20px',
    marginTop: '20px',
    pageBreakInside: 'avoid',
    breakInside: 'avoid',
  },
  progressBar: {
    height: '6px',
    background: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '4px',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  },
};

export default printStyles;
