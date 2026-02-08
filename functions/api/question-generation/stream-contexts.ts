/**
 * Stream Contexts for Aptitude Tests
 * Defines the context for each stream (Science, Commerce, Arts, etc.)
 */

export const STREAM_CONTEXTS: Record<string, {
    name: string;
    context: string;
    clericalExample: string;
}> = {
    // --- After 10th Streams (Specific) ---
    'science_pcm': {
        name: 'Science (PCM - Physics, Chemistry, Maths)',
        context: 'Focus on ADVANCED mathematical reasoning (algebra, trigonometry, calculus concepts), physics problem-solving (mechanics, electricity, optics), chemical equations and reactions, engineering concepts, spatial reasoning, and quantitative analysis. Questions should be at 11th-12th grade JEE preparation level. NO biology questions - this is for engineering/technical streams. Difficulty: 30% medium, 50% hard, 20% very hard.',
        clericalExample: 'PCM-892-ENG'
    },
    'science_pcb': {
        name: 'Science (PCB - Physics, Chemistry, Biology)',
        context: 'Focus on biological systems (cell biology, genetics, human anatomy, physiology), medical terminology, organic chemistry in life sciences, physics applications in medicine, diagnostic reasoning, and healthcare scenarios. Questions should be at 11th-12th grade NEET preparation level. NO advanced mathematics beyond basic calculations - this is for medical/life sciences streams. Difficulty: 30% medium, 50% hard, 20% very hard.',
        clericalExample: 'PCB-345-MED'
    },
    'science_pcmb': {
        name: 'Science (PCMB - All Sciences)',
        context: 'Focus on comprehensive scientific reasoning covering physics, chemistry, mathematics, and biology. Balance questions across all four subjects for students keeping both engineering and medical options open.',
        clericalExample: 'PCMB-678-SCI'
    },
    'science_pcms': {
        name: 'Science (PCMS - Physics, Chemistry, Maths, Computer Science)',
        context: 'Focus on mathematical reasoning, physics, chemistry, computational thinking, algorithmic logic, and programming concepts. NO biology questions - this is for engineering/IT streams.',
        clericalExample: 'PCMS-567-IT'
    },
    'science': {
        name: 'Science (General)',
        context: 'Focus on analytical thinking, problem-solving, scientific method, and logical deduction relevant to engineering, medicine, and research.',
        clericalExample: 'SCI-892-LAB'
    },
    'commerce': {
        name: 'Commerce',
        context: 'Focus on financial literacy, data analysis, business logic, and economic reasoning relevant to accounting, finance, and business management.',
        clericalExample: 'FIN-456-ACC'
    },
    'arts': {
        name: 'Arts & Humanities',
        context: 'Focus on critical thinking, verbal reasoning, social awareness, and creative interpretation relevant to literature, sociology, and liberal arts.',
        clericalExample: 'ART-123-LIT'
    },

    // --- College / After 12th Streams ---
    'engineering': {
        name: 'Engineering',
        context: 'Focus on technical problem-solving, algorithmic thinking, spatial reasoning, and systems analysis suitable for engineering students.',
        clericalExample: 'ENG-789-SYS'
    },
    'medical': {
        name: 'Medical & Healthcare',
        context: 'Focus on diagnostic reasoning, attention to detail, biological systems understanding, and patient care scenarios.',
        clericalExample: 'MED-345-RX'
    },
    'management': {
        name: 'Management & Business',
        context: 'Focus on decision making, leadership scenarios, organizational logic, and strategic thinking.',
        clericalExample: 'MGT-678-HR'
    },
    'law': {
        name: 'Law & Legal Studies',
        context: 'Focus on logical deduction, legal reasoning, critical reading, and argumentative analysis.',
        clericalExample: 'LEG-901-CASE'
    },
    'design': {
        name: 'Design & Creative Arts',
        context: 'Focus on visual perception, spatial reasoning, aesthetic judgment, and creative problem solving.',
        clericalExample: 'DES-234-RGB'
    },
    'it_software': {
        name: 'IT & Software Development',
        context: 'Focus on algorithmic logic, debugging scenarios, system architecture, and computational thinking.',
        clericalExample: 'DEV-567-API'
    },
    'finance': {
        name: 'Finance & Accounts',
        context: 'Focus on numerical analysis, financial reporting, investment logic, and economic trends.',
        clericalExample: 'TAX-890-GST'
    },
    'marketing': {
        name: 'Marketing & Sales',
        context: 'Focus on consumer psychology, market analysis, communication strategies, and persuasion logic.',
        clericalExample: 'MKT-123-AD'
    },
    'hospitality': {
        name: 'Hospitality & Tourism',
        context: 'Focus on service orientation, situational judgment, cultural awareness, and operational logistics.',
        clericalExample: 'HOS-456-RES'
    },
    'media': {
        name: 'Media & Journalism',
        context: 'Focus on verbal ability, fact-checking logic, storytelling structure, and communication ethics.',
        clericalExample: 'MED-789-NEWS'
    },
    'education': {
        name: 'Education & Teaching',
        context: 'Focus on pedagogical reasoning, classroom management scenarios, and developmental psychology.',
        clericalExample: 'EDU-321-CLS'
    },
    'agriculture': {
        name: 'Agriculture & Farming',
        context: 'Focus on biological systems, environmental logic, resource management, and agricultural economics.',
        clericalExample: 'AGR-654-CROP'
    },
    'aviation': {
        name: 'Aviation',
        context: 'Focus on spatial reasoning, quick decision making under pressure, and technical systems understanding.',
        clericalExample: 'FLT-987-NAV'
    },
    'architecture': {
        name: 'Architecture',
        context: 'Focus on 3D visualization, structural logic, spatial planning, and aesthetic composition.',
        clericalExample: 'ARC-147-PLAN'
    },
    'psychology': {
        name: 'Psychology',
        context: 'Focus on behavioral analysis, research methods, empathetic reasoning, and pattern recognition in human behavior.',
        clericalExample: 'PSY-258-BEH'
    },
    'fashion': {
        name: 'Fashion Design',
        context: 'Focus on visual trends, color theory, material logic, and spatial garment construction.',
        clericalExample: 'FAS-369-TEX'
    },
    'sports': {
        name: 'Sports & Physical Education',
        context: 'Focus on strategic thinking, team dynamics, physiological understanding, and quick reaction logic.',
        clericalExample: 'SPT-741-GM'
    },
    'college': {
        name: 'General College',
        context: 'Focus on general aptitude, reasoning, and critical thinking suitable for college-level students across various disciplines.',
        clericalExample: 'COL-123-GEN'
    }
};
