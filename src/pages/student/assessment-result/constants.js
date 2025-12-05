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
    /* Page setup */
    @page {
        size: A4;
        margin: 15mm;
    }
    
    /* Reset body */
    body, html {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        overflow: visible !important;
    }
    
    /* Hide web view, show print view */
    .web-view { display: none !important; }
    .print-view { 
        display: block !important;
        position: static !important;
        background: white !important;
        overflow: visible !important;
    }
    
    /* Hide ALL header and footer elements */
    header, footer, nav, aside {
        display: none !important;
        height: 0 !important;
        max-height: 0 !important;
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
    }
    
    /* Remove sticky positioning */
    .sticky, [class*="sticky"] {
        position: static !important;
        display: none !important;
    }
    
    /* Hide floating buttons and toasters */
    .Toaster, [class*="floating"], [class*="Floating"] {
        display: none !important;
    }
    
    /* Ensure content flows across pages */
    .print-view > div {
        page-break-inside: auto;
    }
}
@media screen {
    .print-view { display: none !important; }
}
`;
