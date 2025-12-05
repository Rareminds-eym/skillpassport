/**
 * Assessment Result Constants
 * Shared constants for the assessment result page
 */

export const RIASEC_NAMES = {
    R: 'Realistic',
    I: 'Investigative',
    A: 'Artistic',
    S: 'Social',
    E: 'Enterprising',
    C: 'Conventional'
};

export const RIASEC_COLORS = {
    R: '#ef4444',
    I: '#8b5cf6',
    A: '#f59e0b',
    S: '#10b981',
    E: '#3b82f6',
    C: '#6366f1'
};

export const TRAIT_NAMES = {
    O: 'Openness',
    C: 'Conscientiousness',
    E: 'Extraversion',
    A: 'Agreeableness',
    N: 'Neuroticism'
};

export const TRAIT_COLORS = {
    O: '#8b5cf6',
    C: '#10b981',
    E: '#f59e0b',
    A: '#ec4899',
    N: '#6366f1'
};

export const PRINT_STYLES = `
@media print {
    /* Page setup - A4: 210mm x 297mm */
    @page {
        size: A4 portrait;
        margin: 12mm 15mm;
    }
    
    /* Reset everything */
    *, *::before, *::after {
        box-sizing: border-box;
    }
    
    body, html {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
    }
    
    /* Hide web view, show print view */
    .web-view { display: none !important; }
    .print-view { 
        display: block !important;
        position: static !important;
        background: white !important;
        overflow: visible !important;
        width: 100% !important;
    }
    
    /* Hide ALL non-print elements */
    header, footer, nav, aside, .sticky, [class*="sticky"],
    .Toaster, [class*="floating"], [class*="Floating"],
    button, .btn, [role="dialog"], [role="menu"] {
        display: none !important;
    }
    
    /* Page breaks */
    .print-view > div {
        page-break-inside: avoid;
        page-break-after: always;
    }
    .print-view > div:last-child {
        page-break-after: auto;
    }
    
    /* Ensure backgrounds print */
    * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }
    
    /* Table styling for print */
    table {
        border-collapse: collapse !important;
        width: 100% !important;
    }
    
    th, td {
        border: 1px solid #e2e8f0 !important;
    }
    
    /* Prevent orphans and widows */
    p, h1, h2, h3, h4, h5, h6 {
        orphans: 3;
        widows: 3;
    }
    
    h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid;
    }
}

@media screen {
    .print-view { display: none !important; }
}
`;
