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
/* Screen styles - hide print view visually but keep in DOM for JS access */
@media screen {
    .print-view { 
        position: absolute !important;
        left: -9999px !important;
        top: -9999px !important;
        width: 210mm !important;
        height: auto !important;
        overflow: visible !important;
        visibility: visible !important;
        display: block !important;
    }
    
    /* Hide watermarks on screen */
    .print-only-watermark {
        display: none !important;
        visibility: hidden !important;
    }
}

/* Print styles */
@media print {
    /* Page setup - A4: 210mm x 297mm with footer space */
    @page {
        size: A4 portrait;
        margin: 12mm 15mm 25mm 15mm;
        @bottom-center {
            content: element(footer);
        }
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
    
    /* Hide web view completely */
    .web-view { 
        display: none !important; 
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
        position: absolute !important;
        left: -9999px !important;
    }
    
    /* Show print view */
    .print-view { 
        display: block !important;
        visibility: visible !important;
        position: static !important;
        background: white !important;
        overflow: visible !important;
        width: 100% !important;
        height: auto !important;
        opacity: 1 !important;
        transform: none !important;
        left: 0 !important;
        top: 0 !important;
    }
    
    /* Ensure print-view content is visible */
    .print-view * {
        visibility: visible !important;
        opacity: 1 !important;
    }
    
    /* Ensure print-view divs are visible */
    .print-view > div {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
    }
    
    /* Ensure root containers are visible */
    #root, #__next, body > div {
        display: block !important;
        visibility: visible !important;
        overflow: visible !important;
        height: auto !important;
    }
    
    /* Hide ALL non-print elements - comprehensive list */
    header, footer, nav, aside,
    .sticky, [class*="sticky"],
    .Toaster, [class*="toast"],
    [class*="floating"], [class*="Floating"], [class*="float"],
    button:not(.print-button), .btn,
    [role="dialog"], [role="menu"], [role="tooltip"],
    .fab, .floating-button, .action-button,
    [class*="chat"], [class*="Chat"],
    [class*="widget"], [class*="Widget"],
    [class*="popup"], [class*="Popup"],
    [class*="modal"], [class*="Modal"],
    [class*="overlay"], [class*="Overlay"],
    iframe, video, audio,
    .no-print, .print-hidden, .hide-print {
        display: none !important;
        visibility: hidden !important;
    }
    
    /* Specifically target fixed position elements */
    div[style*="position: fixed"],
    div[style*="position:fixed"],
    div[class*="fixed"] {
        display: none !important;
        position: static !important;
    }
    
    /* Page breaks - let content flow naturally */
    .print-view > div {
        page-break-inside: auto;
        page-break-after: auto;
    }
    
    /* Print Footer - appears on every page */
    .print-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 10px 15mm;
        background: white;
        border-top: 2px solid #4f46e5;
        font-size: 8px;
        z-index: 9999;
    }
    
    /* Add padding to content to avoid footer overlap */
    .print-content {
        padding-bottom: 60px;
    }
    
    /* Show watermarks only in print */
    .print-only-watermark {
        display: block !important;
        visibility: visible !important;
    }
    
    /* Watermark styling - Logo based */
    .print-view img[alt*="Watermark"] {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
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
        page-break-inside: avoid !important;
    }
    
    th, td {
        border: 1px solid #e2e8f0 !important;
    }
    
    tr {
        page-break-inside: avoid !important;
    }
    
    /* Prevent page breaks inside important elements */
    div[style*="background"], 
    div[style*="border"],
    .card, .box, .summary {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
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
`;
