/**
 * Career Assessment AI Service
 * Generates AI-based questions for Aptitude and Stream Knowledge sections
 *
 * Key Features:
 * - AI generation ONLY for Aptitude & Technical (Stream Knowledge)
 * - Questions saved per student for resume functionality
 * - If student quits and continues, loads their saved questions
 * - Fallback to hardcoded questions if AI fails
 */

import { supabase } from '../lib/supabaseClient';

// Stream-specific prompts for knowledge questions
export const STREAM_KNOWLEDGE_PROMPTS = {
  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY-LEVEL STREAMS (After 12th - Science/Commerce/Arts selection)
  // ═══════════════════════════════════════════════════════════════════════════
  science: {
    name: 'Science',
    topics: [
      'Scientific method',
      'Physics fundamentals',
      'Chemistry basics',
      'Biology concepts',
      'Mathematics',
      'Laboratory techniques',
    ],
  },
  commerce: {
    name: 'Commerce',
    topics: [
      'Accounting principles',
      'Business law',
      'Economics',
      'Financial management',
      'Marketing basics',
      'Business statistics',
    ],
  },
  arts: {
    name: 'Arts & Humanities',
    topics: [
      'Critical thinking',
      'Communication skills',
      'Social sciences',
      'Cultural studies',
      'Research methods',
      'Analytical writing',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AFTER 10TH STREAMS (11th/12th Class - PCMB, PCMS, PCM, PCB, Commerce, Arts)
  // ═══════════════════════════════════════════════════════════════════════════
  science_pcmb: {
    name: 'Science (PCMB)',
    topics: [
      'Physics fundamentals',
      'Chemistry basics',
      'Mathematics',
      'Biology concepts',
      'Scientific method',
      'Laboratory techniques',
    ],
  },
  science_pcms: {
    name: 'Science (PCMS)',
    topics: [
      'Physics fundamentals',
      'Chemistry basics',
      'Mathematics',
      'Computer Science basics',
      'Programming logic',
      'Scientific method',
    ],
  },
  science_pcm: {
    name: 'Science (PCM)',
    topics: [
      'Physics fundamentals',
      'Chemistry basics',
      'Mathematics',
      'Engineering concepts',
      'Problem solving',
      'Scientific method',
    ],
  },
  science_pcb: {
    name: 'Science (PCB)',
    topics: [
      'Physics fundamentals',
      'Chemistry basics',
      'Biology concepts',
      'Medical sciences basics',
      'Laboratory techniques',
      'Scientific method',
    ],
  },
  commerce_maths: {
    name: 'Commerce with Maths',
    topics: [
      'Accountancy basics',
      'Business Studies',
      'Economics fundamentals',
      'Mathematics for Commerce',
      'Statistics',
      'Financial literacy',
    ],
  },
  commerce_general: {
    name: 'Commerce without Maths',
    topics: [
      'Accountancy basics',
      'Business Studies',
      'Economics fundamentals',
      'Business Communication',
      'Entrepreneurship',
      'Financial literacy',
    ],
  },
  arts_humanities: {
    name: 'Arts & Humanities',
    topics: [
      'English Literature',
      'History concepts',
      'Political Science basics',
      'Psychology fundamentals',
      'Sociology',
      'Critical thinking',
    ],
  },
  arts_psychology: {
    name: 'Arts with Psychology',
    topics: [
      'Psychology fundamentals',
      'Sociology basics',
      'English Literature',
      'Human behavior',
      'Social sciences',
      'Counseling basics',
    ],
  },
  arts_economics: {
    name: 'Arts with Economics',
    topics: [
      'Economics fundamentals',
      'Political Science basics',
      'English Literature',
      'Public policy',
      'International relations',
      'Governance',
    ],
  },
  arts: {
    name: 'Arts/Humanities General',
    topics: [
      'English Literature',
      'History concepts',
      'Geography basics',
      'Critical thinking',
      'Communication skills',
      'Cultural studies',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // B.TECH / ENGINEERING SPECIALIZATIONS (College/University)
  // ═══════════════════════════════════════════════════════════════════════════

  // B.Tech Computer Science & IT
  'b.tech_computer_science': {
    name: 'B.Tech Computer Science',
    topics: [
      'Data Structures & Algorithms',
      'Operating Systems',
      'Database Management',
      'Computer Networks',
      'Software Engineering',
      'Object-Oriented Programming',
    ],
  },
  'b.tech_information_technology': {
    name: 'B.Tech Information Technology',
    topics: [
      'Web Technologies',
      'Database Systems',
      'Network Security',
      'Cloud Computing',
      'Software Development',
      'IT Infrastructure',
    ],
  },
  'b.tech_cse': {
    name: 'B.Tech CSE',
    topics: [
      'Data Structures & Algorithms',
      'Operating Systems',
      'Database Management',
      'Computer Networks',
      'Software Engineering',
      'Object-Oriented Programming',
    ],
  },
  btech_cse: {
    name: 'B.Tech CSE',
    topics: [
      'Data Structures & Algorithms',
      'Operating Systems',
      'Database Management',
      'Computer Networks',
      'Software Engineering',
      'Object-Oriented Programming',
    ],
  },

  // B.Tech Electronics & Communication
  'b.tech_electronics': {
    name: 'B.Tech Electronics',
    topics: [
      'Electronic Circuits',
      'Digital Electronics',
      'Microprocessors',
      'Signal Processing',
      'Communication Systems',
      'Embedded Systems',
    ],
  },
  'b.tech_ece': {
    name: 'B.Tech Electronics & Communication',
    topics: [
      'Electronic Circuits',
      'Digital Electronics',
      'Microprocessors',
      'Signal Processing',
      'Communication Systems',
      'Embedded Systems',
    ],
  },
  btech_ece: {
    name: 'B.Tech Electronics & Communication',
    topics: [
      'Electronic Circuits',
      'Digital Electronics',
      'Microprocessors',
      'Signal Processing',
      'Communication Systems',
      'Embedded Systems',
    ],
  },
  bachelor_of_technology_in_electronics: {
    name: 'B.Tech Electronics',
    topics: [
      'Electronic Circuits',
      'Digital Electronics',
      'Microprocessors',
      'Signal Processing',
      'Communication Systems',
      'Embedded Systems',
    ],
  },
  btech_electronics: {
    name: 'B.Tech Electronics',
    topics: [
      'Electronic Circuits',
      'Digital Electronics',
      'Microprocessors',
      'Signal Processing',
      'Communication Systems',
      'Embedded Systems',
    ],
  },

  // B.Tech Electrical
  'b.tech_electrical': {
    name: 'B.Tech Electrical Engineering',
    topics: [
      'Circuit Theory',
      'Power Systems',
      'Electrical Machines',
      'Control Systems',
      'Power Electronics',
      'Electrical Measurements',
    ],
  },
  'b.tech_eee': {
    name: 'B.Tech Electrical & Electronics',
    topics: [
      'Circuit Theory',
      'Power Systems',
      'Electrical Machines',
      'Control Systems',
      'Power Electronics',
      'Digital Electronics',
    ],
  },
  btech_eee: {
    name: 'B.Tech Electrical & Electronics',
    topics: [
      'Circuit Theory',
      'Power Systems',
      'Electrical Machines',
      'Control Systems',
      'Power Electronics',
      'Digital Electronics',
    ],
  },

  // B.Tech Mechanical
  'b.tech_mechanical': {
    name: 'B.Tech Mechanical Engineering',
    topics: [
      'Thermodynamics',
      'Fluid Mechanics',
      'Machine Design',
      'Manufacturing Processes',
      'Heat Transfer',
      'Engineering Mechanics',
    ],
  },
  btech_mechanical: {
    name: 'B.Tech Mechanical Engineering',
    topics: [
      'Thermodynamics',
      'Fluid Mechanics',
      'Machine Design',
      'Manufacturing Processes',
      'Heat Transfer',
      'Engineering Mechanics',
    ],
  },
  btech_mech: {
    name: 'B.Tech Mechanical Engineering',
    topics: [
      'Thermodynamics',
      'Fluid Mechanics',
      'Machine Design',
      'Manufacturing Processes',
      'Heat Transfer',
      'Engineering Mechanics',
    ],
  },

  // B.Tech Civil
  'b.tech_civil': {
    name: 'B.Tech Civil Engineering',
    topics: [
      'Structural Analysis',
      'Geotechnical Engineering',
      'Transportation Engineering',
      'Environmental Engineering',
      'Construction Management',
      'Surveying',
    ],
  },
  btech_civil: {
    name: 'B.Tech Civil Engineering',
    topics: [
      'Structural Analysis',
      'Geotechnical Engineering',
      'Transportation Engineering',
      'Environmental Engineering',
      'Construction Management',
      'Surveying',
    ],
  },

  // B.Tech IT
  btech_it: {
    name: 'B.Tech Information Technology',
    topics: [
      'Web Technologies',
      'Database Systems',
      'Network Security',
      'Cloud Computing',
      'Software Development',
      'IT Infrastructure',
    ],
  },

  // B.Tech Other Specializations
  'b.tech_ai_ml': {
    name: 'B.Tech AI & Machine Learning',
    topics: [
      'Machine Learning Algorithms',
      'Deep Learning',
      'Natural Language Processing',
      'Computer Vision',
      'Data Science',
      'Neural Networks',
    ],
  },
  btech_aiml: {
    name: 'B.Tech AI & Machine Learning',
    topics: [
      'Machine Learning Algorithms',
      'Deep Learning',
      'Natural Language Processing',
      'Computer Vision',
      'Data Science',
      'Neural Networks',
    ],
  },
  'b.tech_data_science': {
    name: 'B.Tech Data Science',
    topics: [
      'Statistical Analysis',
      'Machine Learning',
      'Big Data Analytics',
      'Data Visualization',
      'Python Programming',
      'Database Management',
    ],
  },
  btech_ds: {
    name: 'B.Tech Data Science',
    topics: [
      'Statistical Analysis',
      'Machine Learning',
      'Big Data Analytics',
      'Data Visualization',
      'Python Programming',
      'Database Management',
    ],
  },
  'b.tech_biotechnology': {
    name: 'B.Tech Biotechnology',
    topics: [
      'Molecular Biology',
      'Genetic Engineering',
      'Biochemistry',
      'Microbiology',
      'Bioprocess Engineering',
      'Bioinformatics',
    ],
  },
  btech_biotech: {
    name: 'B.Tech Biotechnology',
    topics: [
      'Molecular Biology',
      'Genetic Engineering',
      'Biochemistry',
      'Microbiology',
      'Bioprocess Engineering',
      'Bioinformatics',
    ],
  },
  'b.tech_chemical': {
    name: 'B.Tech Chemical Engineering',
    topics: [
      'Chemical Reaction Engineering',
      'Mass Transfer',
      'Heat Transfer',
      'Process Control',
      'Thermodynamics',
      'Fluid Mechanics',
    ],
  },
  btech_chem: {
    name: 'B.Tech Chemical Engineering',
    topics: [
      'Chemical Reaction Engineering',
      'Mass Transfer',
      'Heat Transfer',
      'Process Control',
      'Thermodynamics',
      'Fluid Mechanics',
    ],
  },

  // Generic B.Tech/Engineering
  engineering: {
    name: 'Engineering',
    topics: [
      'Physics applications',
      'Mathematics',
      'Engineering mechanics',
      'Technical drawing',
      'Problem solving',
      'Design thinking',
    ],
  },
  btech: {
    name: 'B.Tech Engineering',
    topics: [
      'Engineering Mathematics',
      'Physics Applications',
      'Problem Solving',
      'Technical Analysis',
      'Design Thinking',
      'Project Management',
    ],
  },
  'b.tech': {
    name: 'B.Tech Engineering',
    topics: [
      'Engineering Mathematics',
      'Physics Applications',
      'Problem Solving',
      'Technical Analysis',
      'Design Thinking',
      'Project Management',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // M.TECH / POSTGRADUATE ENGINEERING (Masters)
  // ═══════════════════════════════════════════════════════════════════════════
  mtech_cse: {
    name: 'M.Tech Computer Science',
    topics: [
      'Advanced Algorithms',
      'Machine Learning',
      'Distributed Systems',
      'Cloud Computing',
      'Research Methodology',
      'Advanced Database Systems',
    ],
  },
  mtech_cs: {
    name: 'M.Tech Computer Science',
    topics: [
      'Advanced Algorithms',
      'Machine Learning',
      'Distributed Systems',
      'Cloud Computing',
      'Research Methodology',
      'Advanced Database Systems',
    ],
  },
  mtech_ece: {
    name: 'M.Tech Electronics',
    topics: [
      'VLSI Design',
      'Advanced Signal Processing',
      'Wireless Communication',
      'Embedded Systems Design',
      'Microwave Engineering',
      'Research Methods',
    ],
  },
  mtech_electronics: {
    name: 'M.Tech Electronics',
    topics: [
      'VLSI Design',
      'Advanced Signal Processing',
      'Wireless Communication',
      'Embedded Systems Design',
      'Microwave Engineering',
      'Research Methods',
    ],
  },
  mtech_mechanical: {
    name: 'M.Tech Mechanical',
    topics: [
      'Advanced Thermodynamics',
      'Computational Fluid Dynamics',
      'Finite Element Analysis',
      'Advanced Manufacturing',
      'Robotics',
      'Research Methodology',
    ],
  },
  mtech_mech: {
    name: 'M.Tech Mechanical',
    topics: [
      'Advanced Thermodynamics',
      'Computational Fluid Dynamics',
      'Finite Element Analysis',
      'Advanced Manufacturing',
      'Robotics',
      'Research Methodology',
    ],
  },
  mtech_civil: {
    name: 'M.Tech Civil',
    topics: [
      'Advanced Structural Analysis',
      'Geotechnical Engineering',
      'Transportation Planning',
      'Environmental Engineering',
      'Construction Technology',
      'Research Methods',
    ],
  },
  mtech_aiml: {
    name: 'M.Tech AI & ML',
    topics: [
      'Deep Learning',
      'Natural Language Processing',
      'Computer Vision',
      'Reinforcement Learning',
      'Neural Networks',
      'AI Research',
    ],
  },
  mtech_ds: {
    name: 'M.Tech Data Science',
    topics: [
      'Big Data Analytics',
      'Advanced Machine Learning',
      'Data Mining',
      'Statistical Modeling',
      'Data Visualization',
      'Research Methodology',
    ],
  },
  mtech: {
    name: 'M.Tech Engineering',
    topics: [
      'Advanced Engineering Concepts',
      'Research Methodology',
      'Technical Analysis',
      'Innovation',
      'Project Management',
      'Specialized Engineering',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // B.SC SPECIALIZATIONS (College/University)
  // ═══════════════════════════════════════════════════════════════════════════
  bsc: {
    name: 'B.Sc Pure Sciences',
    topics: [
      'Scientific method',
      'Laboratory techniques',
      'Data analysis',
      'Research methodology',
      'Core science concepts',
      'Mathematical applications',
    ],
  },
  'b.sc_physics': {
    name: 'B.Sc Physics',
    topics: [
      'Classical Mechanics',
      'Electromagnetism',
      'Quantum Mechanics',
      'Thermodynamics',
      'Optics',
      'Mathematical Physics',
    ],
  },
  bsc_physics: {
    name: 'B.Sc Physics',
    topics: [
      'Classical Mechanics',
      'Electromagnetism',
      'Quantum Mechanics',
      'Thermodynamics',
      'Optics',
      'Mathematical Physics',
    ],
  },
  'b.sc_chemistry': {
    name: 'B.Sc Chemistry',
    topics: [
      'Organic Chemistry',
      'Inorganic Chemistry',
      'Physical Chemistry',
      'Analytical Chemistry',
      'Biochemistry',
      'Spectroscopy',
    ],
  },
  bsc_chemistry: {
    name: 'B.Sc Chemistry',
    topics: [
      'Organic Chemistry',
      'Inorganic Chemistry',
      'Physical Chemistry',
      'Analytical Chemistry',
      'Biochemistry',
      'Spectroscopy',
    ],
  },
  'b.sc_mathematics': {
    name: 'B.Sc Mathematics',
    topics: [
      'Calculus',
      'Linear Algebra',
      'Differential Equations',
      'Real Analysis',
      'Abstract Algebra',
      'Probability & Statistics',
    ],
  },
  bsc_maths: {
    name: 'B.Sc Mathematics',
    topics: [
      'Calculus',
      'Linear Algebra',
      'Differential Equations',
      'Real Analysis',
      'Abstract Algebra',
      'Probability & Statistics',
    ],
  },
  'b.sc_computer_science': {
    name: 'B.Sc Computer Science',
    topics: [
      'Programming Fundamentals',
      'Data Structures',
      'Algorithms',
      'Database Systems',
      'Operating Systems',
      'Web Development',
    ],
  },
  bsc_cs: {
    name: 'B.Sc Computer Science',
    topics: [
      'Programming Fundamentals',
      'Data Structures',
      'Algorithms',
      'Database Systems',
      'Operating Systems',
      'Web Development',
    ],
  },
  'b.sc_biology': {
    name: 'B.Sc Biology',
    topics: ['Cell Biology', 'Genetics', 'Ecology', 'Microbiology', 'Biochemistry', 'Evolution'],
  },
  bsc_biology: {
    name: 'B.Sc Biology',
    topics: ['Cell Biology', 'Genetics', 'Ecology', 'Microbiology', 'Biochemistry', 'Evolution'],
  },
  'b.sc_biotechnology': {
    name: 'B.Sc Biotechnology',
    topics: [
      'Molecular Biology',
      'Genetic Engineering',
      'Microbiology',
      'Biochemistry',
      'Bioinformatics',
      'Immunology',
    ],
  },
  bsc_biotech: {
    name: 'B.Sc Biotechnology',
    topics: [
      'Molecular Biology',
      'Genetic Engineering',
      'Microbiology',
      'Biochemistry',
      'Bioinformatics',
      'Immunology',
    ],
  },
  bsc_agri: {
    name: 'B.Sc Agriculture',
    topics: [
      'Agronomy',
      'Soil Science',
      'Plant Pathology',
      'Horticulture',
      'Agricultural Economics',
      'Farm Management',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BBA SPECIALIZATIONS (College/University)
  // ═══════════════════════════════════════════════════════════════════════════
  bba: {
    name: 'BBA Business Administration',
    topics: [
      'Management principles',
      'Marketing basics',
      'Organizational behavior',
      'Business communication',
      'Entrepreneurship',
      'Strategic thinking',
    ],
  },
  bba_marketing: {
    name: 'BBA Marketing',
    topics: [
      'Marketing Management',
      'Consumer Behavior',
      'Brand Management',
      'Digital Marketing',
      'Sales Management',
      'Market Research',
    ],
  },
  bba_finance: {
    name: 'BBA Finance',
    topics: [
      'Financial Management',
      'Investment Analysis',
      'Corporate Finance',
      'Financial Markets',
      'Risk Management',
      'Banking Operations',
    ],
  },
  bba_hr: {
    name: 'BBA Human Resources',
    topics: [
      'Human Resource Management',
      'Organizational Behavior',
      'Recruitment & Selection',
      'Training & Development',
      'Performance Management',
      'Labor Laws',
    ],
  },
  bba_international_business: {
    name: 'BBA International Business',
    topics: [
      'International Trade',
      'Global Marketing',
      'Cross-Cultural Management',
      'Export-Import Management',
      'Foreign Exchange',
      'International Finance',
    ],
  },
  bba_intl: {
    name: 'BBA International Business',
    topics: [
      'International Trade',
      'Global Marketing',
      'Cross-Cultural Management',
      'Export-Import Management',
      'Foreign Exchange',
      'International Finance',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BCA & IT PROGRAMS (College/University)
  // ═══════════════════════════════════════════════════════════════════════════
  bca: {
    name: 'BCA Computer Applications',
    topics: [
      'Programming basics',
      'Database management',
      'Web development',
      'Software applications',
      'IT fundamentals',
      'System analysis',
    ],
  },
  bca_data_science: {
    name: 'BCA Data Science',
    topics: [
      'Python Programming',
      'Statistical Analysis',
      'Machine Learning Basics',
      'Data Visualization',
      'Database Management',
      'Big Data Concepts',
    ],
  },
  bca_ds: {
    name: 'BCA Data Science',
    topics: [
      'Python Programming',
      'Statistical Analysis',
      'Machine Learning Basics',
      'Data Visualization',
      'Database Management',
      'Big Data Concepts',
    ],
  },
  bca_cloud: {
    name: 'BCA Cloud Computing',
    topics: [
      'Cloud Architecture',
      'AWS/Azure Basics',
      'Virtualization',
      'DevOps Fundamentals',
      'Network Security',
      'Containerization',
    ],
  },
  bca_cloud_computing: {
    name: 'BCA Cloud Computing',
    topics: [
      'Cloud Architecture',
      'AWS/Azure Basics',
      'Virtualization',
      'DevOps Fundamentals',
      'Network Security',
      'Containerization',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // B.COM SPECIALIZATIONS (College/University)
  // ═══════════════════════════════════════════════════════════════════════════
  bcom: {
    name: 'B.Com Commerce',
    topics: [
      'Accounting principles',
      'Business law',
      'Economics',
      'Financial management',
      'Taxation basics',
      'Business statistics',
    ],
  },
  'b.com_accounting': {
    name: 'B.Com Accounting',
    topics: [
      'Financial Accounting',
      'Cost Accounting',
      'Management Accounting',
      'Auditing',
      'Taxation',
      'Corporate Accounting',
    ],
  },
  bcom_accounts: {
    name: 'B.Com Accounting',
    topics: [
      'Financial Accounting',
      'Cost Accounting',
      'Management Accounting',
      'Auditing',
      'Taxation',
      'Corporate Accounting',
    ],
  },
  'b.com_banking': {
    name: 'B.Com Banking & Finance',
    topics: [
      'Banking Operations',
      'Financial Markets',
      'Investment Management',
      'Risk Management',
      'Insurance',
      'Corporate Finance',
    ],
  },
  bcom_banking: {
    name: 'B.Com Banking & Finance',
    topics: [
      'Banking Operations',
      'Financial Markets',
      'Investment Management',
      'Risk Management',
      'Insurance',
      'Corporate Finance',
    ],
  },
  'b.com_taxation': {
    name: 'B.Com Taxation',
    topics: [
      'Income Tax',
      'GST',
      'Corporate Tax',
      'Tax Planning',
      'Tax Compliance',
      'International Taxation',
    ],
  },
  bcom_tax: {
    name: 'B.Com Taxation',
    topics: [
      'Income Tax',
      'GST',
      'Corporate Tax',
      'Tax Planning',
      'Tax Compliance',
      'International Taxation',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDICAL & HEALTH SCIENCES (College/University)
  // ═══════════════════════════════════════════════════════════════════════════
  medical: {
    name: 'Medical Sciences',
    topics: [
      'Human anatomy',
      'Biology fundamentals',
      'Chemistry basics',
      'Health sciences',
      'Medical terminology',
      'Patient care concepts',
    ],
  },
  mbbs: {
    name: 'MBBS Medicine',
    topics: [
      'Human Anatomy',
      'Physiology',
      'Biochemistry',
      'Pathology',
      'Pharmacology',
      'Clinical Medicine',
    ],
  },
  bds: {
    name: 'BDS Dental Surgery',
    topics: [
      'Dental Anatomy',
      'Oral Pathology',
      'Dental Materials',
      'Prosthodontics',
      'Orthodontics',
      'Oral Surgery',
    ],
  },
  bams: {
    name: 'BAMS Ayurveda',
    topics: [
      'Ayurvedic Principles',
      'Dravyaguna',
      'Roga Nidan',
      'Panchakarma',
      'Kayachikitsa',
      'Shalya Tantra',
    ],
  },
  bhms: {
    name: 'BHMS Homeopathy',
    topics: [
      'Homeopathic Philosophy',
      'Materia Medica',
      'Organon',
      'Repertory',
      'Case Taking',
      'Therapeutics',
    ],
  },
  'b.pharma': {
    name: 'B.Pharma Pharmacy',
    topics: [
      'Pharmaceutical Chemistry',
      'Pharmacology',
      'Pharmaceutics',
      'Pharmacognosy',
      'Hospital Pharmacy',
      'Drug Regulatory Affairs',
    ],
  },
  bpharma: {
    name: 'B.Pharma Pharmacy',
    topics: [
      'Pharmaceutical Chemistry',
      'Pharmacology',
      'Pharmaceutics',
      'Pharmacognosy',
      'Hospital Pharmacy',
      'Drug Regulatory Affairs',
    ],
  },
  pharmacy: {
    name: 'Pharmacy',
    topics: [
      'Pharmaceutical chemistry',
      'Pharmacology basics',
      'Drug interactions',
      'Dosage forms',
      'Healthcare systems',
      'Patient counseling',
    ],
  },
  nursing: {
    name: 'B.Sc Nursing',
    topics: [
      'Anatomy & Physiology',
      'Medical-Surgical Nursing',
      'Community Health',
      'Pediatric Nursing',
      'Mental Health Nursing',
      'Nursing Management',
    ],
  },
  physiotherapy: {
    name: 'BPT Physiotherapy',
    topics: [
      'Anatomy',
      'Exercise Therapy',
      'Electrotherapy',
      'Biomechanics',
      'Rehabilitation',
      'Sports Physiotherapy',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ARTS & HUMANITIES (College/University)
  // ═══════════════════════════════════════════════════════════════════════════
  ba: {
    name: 'BA Arts & Humanities',
    topics: [
      'Critical thinking',
      'Communication skills',
      'Social sciences',
      'Cultural studies',
      'Research methods',
      'Analytical writing',
    ],
  },
  ba_english: {
    name: 'BA English Literature',
    topics: [
      'Literary Criticism',
      'British Literature',
      'American Literature',
      'Indian Writing in English',
      'Linguistics',
      'Creative Writing',
    ],
  },
  ba_history: {
    name: 'BA History',
    topics: [
      'Ancient History',
      'Medieval History',
      'Modern History',
      'World History',
      'Historiography',
      'Archaeological Methods',
    ],
  },
  ba_political_science: {
    name: 'BA Political Science',
    topics: [
      'Political Theory',
      'Indian Politics',
      'International Relations',
      'Comparative Politics',
      'Public Administration',
      'Constitutional Law',
    ],
  },
  ba_polsci: {
    name: 'BA Political Science',
    topics: [
      'Political Theory',
      'Indian Politics',
      'International Relations',
      'Comparative Politics',
      'Public Administration',
      'Constitutional Law',
    ],
  },
  ba_economics: {
    name: 'BA Economics',
    topics: [
      'Microeconomics',
      'Macroeconomics',
      'Indian Economy',
      'International Economics',
      'Development Economics',
      'Econometrics',
    ],
  },
  ba_sociology: {
    name: 'BA Sociology',
    topics: [
      'Social Theory',
      'Indian Society',
      'Research Methods',
      'Social Stratification',
      'Urban Sociology',
      'Gender Studies',
    ],
  },
  psychology: {
    name: 'BA/B.Sc Psychology',
    topics: [
      'Human behavior',
      'Cognitive processes',
      'Research methods',
      'Developmental psychology',
      'Social psychology',
      'Mental health awareness',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LAW PROGRAMS (College/University)
  // ═══════════════════════════════════════════════════════════════════════════
  law: {
    name: 'Law',
    topics: [
      'Legal reasoning',
      'Constitutional basics',
      'Contract law',
      'Legal research',
      'Ethics',
      'Argumentation',
    ],
  },
  llb: {
    name: 'LLB Law',
    topics: [
      'Constitutional Law',
      'Contract Law',
      'Criminal Law',
      'Property Law',
      'Family Law',
      'Legal Procedures',
    ],
  },
  ba_llb: {
    name: 'BA LLB Integrated Law',
    topics: [
      'Constitutional Law',
      'Contract Law',
      'Criminal Law',
      'Administrative Law',
      'International Law',
      'Legal Research',
    ],
  },
  bba_llb: {
    name: 'BBA LLB Business Law',
    topics: [
      'Corporate Law',
      'Business Law',
      'Intellectual Property',
      'Tax Law',
      'Banking Law',
      'Competition Law',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DESIGN & CREATIVE ARTS (College/University)
  // ═══════════════════════════════════════════════════════════════════════════
  design: {
    name: 'Design',
    topics: [
      'Design principles',
      'Color theory',
      'Typography',
      'User experience',
      'Visual communication',
      'Creative thinking',
    ],
  },
  'b.des': {
    name: 'B.Des Design',
    topics: [
      'Design Fundamentals',
      'Visual Communication',
      'Product Design',
      'User Experience',
      'Design Thinking',
      'Portfolio Development',
    ],
  },
  bdes: {
    name: 'B.Des Design',
    topics: [
      'Design Fundamentals',
      'Visual Communication',
      'Product Design',
      'User Experience',
      'Design Thinking',
      'Portfolio Development',
    ],
  },
  'b.des_fashion': {
    name: 'B.Des Fashion Design',
    topics: [
      'Fashion Illustration',
      'Textile Science',
      'Pattern Making',
      'Garment Construction',
      'Fashion Marketing',
      'Trend Forecasting',
    ],
  },
  bdes_fashion: {
    name: 'B.Des Fashion Design',
    topics: [
      'Fashion Illustration',
      'Textile Science',
      'Pattern Making',
      'Garment Construction',
      'Fashion Marketing',
      'Trend Forecasting',
    ],
  },
  'b.des_interior': {
    name: 'B.Des Interior Design',
    topics: [
      'Space Planning',
      'Materials & Finishes',
      'Furniture Design',
      'Lighting Design',
      'AutoCAD',
      'Sustainable Design',
    ],
  },
  bdes_interior: {
    name: 'B.Des Interior Design',
    topics: [
      'Space Planning',
      'Materials & Finishes',
      'Furniture Design',
      'Lighting Design',
      'AutoCAD',
      'Sustainable Design',
    ],
  },
  'b.des_graphic': {
    name: 'B.Des Graphic Design',
    topics: [
      'Typography',
      'Brand Identity',
      'Digital Illustration',
      'UI/UX Design',
      'Motion Graphics',
      'Print Design',
    ],
  },
  bdes_graphic: {
    name: 'B.Des Graphic Design',
    topics: [
      'Typography',
      'Brand Identity',
      'Digital Illustration',
      'UI/UX Design',
      'Motion Graphics',
      'Print Design',
    ],
  },
  animation: {
    name: 'Animation & Game Design',
    topics: [
      'Visual design principles',
      'Animation basics',
      'Storytelling',
      'Digital tools',
      'Character design',
      'Game mechanics',
    ],
  },
  bfa: {
    name: 'BFA Fine Arts',
    topics: [
      'Art History',
      'Drawing & Painting',
      'Sculpture',
      'Printmaking',
      'Art Criticism',
      'Contemporary Art',
    ],
  },
  finearts: {
    name: 'Fine Arts',
    topics: [
      'Art history',
      'Visual composition',
      'Creative expression',
      'Art criticism',
      'Studio techniques',
      'Contemporary art',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDIA & COMMUNICATION (College/University)
  // ═══════════════════════════════════════════════════════════════════════════
  journalism: {
    name: 'Journalism & Mass Communication',
    topics: [
      'News writing',
      'Media ethics',
      'Digital journalism',
      'Public relations',
      'Broadcasting',
      'Content creation',
    ],
  },
  bjmc: {
    name: 'BJMC Journalism',
    topics: [
      'News Writing',
      'Broadcast Journalism',
      'Digital Media',
      'Public Relations',
      'Advertising',
      'Media Laws',
    ],
  },
  bmc: {
    name: 'BMC Mass Communication',
    topics: [
      'Media Studies',
      'Communication Theory',
      'Film Studies',
      'Advertising',
      'Corporate Communication',
      'New Media',
    ],
  },
  dm: {
    name: 'Digital Marketing',
    topics: [
      'Social media marketing',
      'SEO basics',
      'Content marketing',
      'Analytics',
      'Brand management',
      'Digital advertising',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HOSPITALITY & TOURISM (College/University)
  // ═══════════════════════════════════════════════════════════════════════════
  bhm: {
    name: 'BHM Hotel Management',
    topics: [
      'Front Office Operations',
      'Food & Beverage Service',
      'Housekeeping',
      'Food Production',
      'Hotel Accounting',
      'Hospitality Marketing',
    ],
  },
  bttm: {
    name: 'BTTM Tourism Management',
    topics: [
      'Tourism Management',
      'Travel Agency Operations',
      'Destination Management',
      'Hospitality Services',
      'Tourism Marketing',
      'Event Management',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AGRICULTURE & ALLIED (College/University)
  // ═══════════════════════════════════════════════════════════════════════════
  'b.sc_agriculture': {
    name: 'B.Sc Agriculture',
    topics: [
      'Agronomy',
      'Soil Science',
      'Plant Pathology',
      'Horticulture',
      'Agricultural Economics',
      'Farm Management',
    ],
  },
  bvsc: {
    name: 'BVSc Veterinary Science',
    topics: [
      'Animal Anatomy',
      'Veterinary Physiology',
      'Animal Nutrition',
      'Veterinary Medicine',
      'Surgery',
      'Animal Husbandry',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFESSIONAL COURSES (College/University)
  // ═══════════════════════════════════════════════════════════════════════════
  ca: {
    name: 'Chartered Accountancy',
    topics: [
      'Advanced accounting',
      'Auditing',
      'Taxation',
      'Corporate law',
      'Financial reporting',
      'Cost accounting',
    ],
  },
  cs: {
    name: 'Company Secretary',
    topics: [
      'Company Law',
      'Securities Law',
      'Corporate Governance',
      'Secretarial Practice',
      'Compliance Management',
      'Capital Markets',
    ],
  },
  cma: {
    name: 'Cost & Management Accountant',
    topics: [
      'Cost Accounting',
      'Management Accounting',
      'Financial Management',
      'Strategic Management',
      'Tax Management',
      'Audit',
    ],
  },
  finance: {
    name: 'Finance & Banking',
    topics: [
      'Financial markets',
      'Banking operations',
      'Investment basics',
      'Risk management',
      'Financial analysis',
      'Monetary policy',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERIC/FALLBACK STREAMS
  // ═══════════════════════════════════════════════════════════════════════════
  general: {
    name: 'General Assessment',
    topics: [
      'Logical Reasoning',
      'Verbal Ability',
      'Numerical Aptitude',
      'General Knowledge',
      'Critical Thinking',
      'Problem Solving',
    ],
  },
  college: {
    name: 'College/University',
    topics: [
      'Critical Thinking',
      'Communication Skills',
      'Problem Solving',
      'Research Methods',
      'Professional Ethics',
      'Career Planning',
    ],
  },
  ug: {
    name: 'Undergraduate',
    topics: [
      'Critical Thinking',
      'Communication Skills',
      'Problem Solving',
      'Research Methods',
      'Professional Ethics',
      'Career Planning',
    ],
  },
  pg: {
    name: 'Postgraduate',
    topics: [
      'Advanced Research Methods',
      'Critical Analysis',
      'Specialized Knowledge',
      'Professional Development',
      'Leadership Skills',
      'Innovation',
    ],
  },
};

// Aptitude categories
const APTITUDE_CATEGORIES = [
  {
    id: 'verbal',
    name: 'Verbal Reasoning',
    description: 'Language comprehension, vocabulary, analogies',
  },
  {
    id: 'numerical',
    name: 'Numerical Ability',
    description: 'Mathematical reasoning, data interpretation',
  },
  {
    id: 'logical',
    name: 'Logical Reasoning',
    description: 'Pattern recognition, deductive reasoning',
  },
  {
    id: 'spatial',
    name: 'Spatial Reasoning',
    description: 'Visual-spatial relationships, mental rotation',
  },
  {
    id: 'abstract',
    name: 'Abstract Reasoning',
    description: 'Pattern completion, sequence identification',
  },
];

/**
 * Normalize stream ID from student's program name to match STREAM_KNOWLEDGE_PROMPTS keys
 * Handles various formats like "Bachelor of Technology in Electronics", "B.Tech CSE", "BBA", etc.
 *
 * IMPORTANT: Stream IDs must be <= 20 characters to fit in database column
 *
 * @param {string} programName - The program name from student profile
 * @returns {string} - Normalized stream ID (max 20 chars) that matches STREAM_KNOWLEDGE_PROMPTS keys
 */
export function normalizeStreamId(programName) {
  if (!programName) return 'college';

  const normalized = programName.toLowerCase().trim();

  // Direct match first (if already a valid short key)
  if (STREAM_KNOWLEDGE_PROMPTS[normalized] && normalized.length <= 20) {
    return normalized;
  }

  // Common program name mappings - ALL VALUES MUST BE <= 20 CHARS
  const programMappings = {
    // B.Tech variations -> short keys
    'bachelor of technology in electronics': 'btech_ece',
    'bachelor of technology in electronics and communication': 'btech_ece',
    'b.tech electronics': 'btech_ece',
    'btech electronics': 'btech_ece',
    'b.tech ece': 'btech_ece',
    'btech ece': 'btech_ece',
    'electronics and communication': 'btech_ece',
    'electronics & communication': 'btech_ece',
    ece: 'btech_ece',

    'bachelor of technology in computer science': 'btech_cse',
    'b.tech computer science': 'btech_cse',
    'b.tech cse': 'btech_cse',
    'btech cse': 'btech_cse',
    'computer science engineering': 'btech_cse',
    'computer science and engineering': 'btech_cse',
    cse: 'btech_cse',

    'bachelor of technology in information technology': 'btech_it',
    'b.tech information technology': 'btech_it',
    'b.tech it': 'btech_it',
    'btech it': 'btech_it',
    'information technology': 'btech_it',

    'b.tech mechanical': 'btech_mech',
    'btech mechanical': 'btech_mech',
    'mechanical engineering': 'btech_mech',
    'bachelor of technology in mechanical': 'btech_mech',

    'b.tech civil': 'btech_civil',
    'civil engineering': 'btech_civil',
    'bachelor of technology in civil': 'btech_civil',

    'b.tech electrical': 'btech_eee',
    'electrical engineering': 'btech_eee',
    'b.tech eee': 'btech_eee',
    'bachelor of technology in electrical': 'btech_eee',

    'b.tech ai': 'btech_aiml',
    'b.tech ml': 'btech_aiml',
    'b.tech artificial intelligence': 'btech_aiml',
    'b.tech machine learning': 'btech_aiml',
    'artificial intelligence': 'btech_aiml',

    'b.tech data science': 'btech_ds',
    'data science': 'btech_ds',

    'b.tech biotechnology': 'btech_biotech',
    biotechnology: 'btech_biotech',

    'b.tech chemical': 'btech_chem',
    'chemical engineering': 'btech_chem',

    // M.Tech variations -> short keys
    'master of technology in computer science': 'mtech_cse',
    'master of technology in computer science and engineering': 'mtech_cse',
    'm.tech computer science': 'mtech_cse',
    'm.tech cse': 'mtech_cse',
    'mtech cse': 'mtech_cse',
    'mtech computer science': 'mtech_cse',
    'm.tech cs': 'mtech_cs',
    'mtech cs': 'mtech_cs',

    'master of technology in electronics': 'mtech_ece',
    'master of technology in electronics and communication': 'mtech_ece',
    'm.tech electronics': 'mtech_ece',
    'm.tech ece': 'mtech_ece',
    'mtech ece': 'mtech_ece',
    'mtech electronics': 'mtech_electronics',

    'master of technology in mechanical': 'mtech_mech',
    'm.tech mechanical': 'mtech_mech',
    'mtech mechanical': 'mtech_mechanical',

    'master of technology in civil': 'mtech_civil',
    'm.tech civil': 'mtech_civil',
    'mtech civil': 'mtech_civil',

    'master of technology in ai': 'mtech_aiml',
    'master of technology in artificial intelligence': 'mtech_aiml',
    'm.tech ai': 'mtech_aiml',
    'm.tech ml': 'mtech_aiml',
    'mtech aiml': 'mtech_aiml',

    'master of technology in data science': 'mtech_ds',
    'm.tech data science': 'mtech_ds',
    'mtech data science': 'mtech_ds',

    // B.Sc variations
    'b.sc physics': 'bsc_physics',
    'bsc physics': 'bsc_physics',
    'b.sc chemistry': 'bsc_chemistry',
    'bsc chemistry': 'bsc_chemistry',
    'b.sc mathematics': 'bsc_maths',
    'bsc mathematics': 'bsc_maths',
    'b.sc computer science': 'bsc_cs',
    'bsc computer science': 'bsc_cs',
    'b.sc biology': 'bsc_biology',
    'bsc biology': 'bsc_biology',
    'b.sc biotechnology': 'bsc_biotech',
    'bsc biotechnology': 'bsc_biotech',
    'b.sc agriculture': 'bsc_agri',
    'bsc agriculture': 'bsc_agri',

    // BBA variations
    'bba marketing': 'bba_marketing',
    'bba finance': 'bba_finance',
    'bba hr': 'bba_hr',
    'bba human resources': 'bba_hr',
    'bba international business': 'bba_intl',
    'business administration': 'bba',

    // BCA variations
    'bca data science': 'bca_ds',
    'bca cloud computing': 'bca_cloud',
    'computer applications': 'bca',

    // B.Com variations
    'b.com accounting': 'bcom_accounts',
    'bcom accounting': 'bcom_accounts',
    'b.com banking': 'bcom_banking',
    'bcom banking': 'bcom_banking',
    'b.com taxation': 'bcom_tax',
    'bcom taxation': 'bcom_tax',

    // Medical
    medicine: 'mbbs',
    'dental surgery': 'bds',
    ayurveda: 'bams',
    homeopathy: 'bhms',
    'b.pharma': 'bpharma',
    pharmacy: 'pharmacy',
    'b.sc nursing': 'nursing',
    bpt: 'physiotherapy',

    // Arts
    'ba english': 'ba_english',
    'english literature': 'ba_english',
    'ba history': 'ba_history',
    'ba political science': 'ba_polsci',
    'ba economics': 'ba_economics',
    'ba sociology': 'ba_sociology',

    // Law
    'ba llb': 'ba_llb',
    'bba llb': 'bba_llb',
    llb: 'law',

    // Design
    'b.des': 'bdes',
    'b.des fashion': 'bdes_fashion',
    'fashion design': 'bdes_fashion',
    'b.des interior': 'bdes_interior',
    'interior design': 'bdes_interior',
    'b.des graphic': 'bdes_graphic',
    'graphic design': 'bdes_graphic',

    // Media
    bjmc: 'bjmc',
    journalism: 'journalism',
    'mass communication': 'bmc',

    // Hospitality
    'hotel management': 'bhm',
    'tourism management': 'bttm',

    // Professional
    'chartered accountancy': 'ca',
    'company secretary': 'cs',
    'cost accountant': 'cma',
  };

  // Check direct mapping
  if (programMappings[normalized]) {
    return programMappings[normalized];
  }

  // Try partial matching
  for (const [key, value] of Object.entries(programMappings)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  // Fallback based on keywords - use short IDs
  if (normalized.includes('electronics')) {
    return 'btech_ece';
  }
  if (normalized.includes('computer') && normalized.includes('science')) {
    return 'btech_cse';
  }
  if (normalized.includes('mechanical')) {
    return 'btech_mech';
  }
  if (normalized.includes('civil')) {
    return 'btech_civil';
  }
  if (normalized.includes('electrical')) {
    return 'btech_eee';
  }
  if (
    normalized.includes('engineering') ||
    normalized.includes('b.tech') ||
    normalized.includes('btech')
  ) {
    return 'engineering';
  }
  if (normalized.includes('b.sc') || normalized.includes('bsc')) {
    return 'bsc';
  }
  if (normalized.includes('bba') || normalized.includes('business')) {
    return 'bba';
  }
  if (normalized.includes('bca') || normalized.includes('computer application')) {
    return 'bca';
  }
  if (
    normalized.includes('b.com') ||
    normalized.includes('bcom') ||
    normalized.includes('commerce')
  ) {
    return 'bcom';
  }
  if (normalized.includes('ba') || normalized.includes('arts')) {
    return 'ba';
  }
  if (normalized.includes('law') || normalized.includes('llb')) {
    return 'law';
  }
  if (normalized.includes('medical') || normalized.includes('mbbs')) {
    return 'medical';
  }
  if (normalized.includes('design')) {
    return 'design';
  }

  // Default fallback
  console.log(`⚠️ Unknown program "${programName}", using generic college stream`);
  return 'college';
}

/**
 * Validate a generated question meets quality standards
 * @param {Object} question - Question object to validate
 * @param {string} questionType - 'aptitude' or 'knowledge'
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validateQuestion(question, questionType) {
  const errors = [];

  // Check required fields
  if (!question.text && !question.question) {
    errors.push('Missing question text');
  }

  const questionText = question.text || question.question || '';
  if (questionText.length < 10 || questionText.length > 500) {
    errors.push(`Question text length ${questionText.length} is outside valid range (10-500)`);
  }

  // Check options
  if (!question.options || !Array.isArray(question.options)) {
    errors.push('Missing or invalid options array');
  } else {
    // Clerical questions have 2 options (Same/Different), all others have 4
    // Check by category/subtype OR by detecting Same/Different options
    const hasSameDifferentOptions =
      question.options.length === 2 &&
      question.options.some((opt) => String(opt).trim().toLowerCase() === 'same') &&
      question.options.some((opt) => String(opt).trim().toLowerCase() === 'different');

    const isClericalQuestion =
      question.subtype === 'clerical' ||
      question.category === 'clerical' ||
      question.skill_tag === 'clerical_speed' ||
      hasSameDifferentOptions;

    // Auto-fix: If we detect Same/Different options, mark as clerical
    if (hasSameDifferentOptions && !question.category) {
      question.category = 'clerical';
    }

    const expectedOptions = isClericalQuestion ? 2 : 4;

    if (question.options.length !== expectedOptions) {
      errors.push(`Expected ${expectedOptions} options, got ${question.options.length}`);
    }
  }

  // Check correct answer
  const correctAnswer = question.correct || question.correct_answer;
  if (!correctAnswer) {
    errors.push('Missing correct answer');
  } else {
    // Check if this is a clerical question (2 options: Same/Different)
    // Check by category/subtype OR by detecting Same/Different options
    const hasSameDifferentOptions =
      question.options &&
      question.options.length === 2 &&
      question.options.some((opt) => String(opt).trim().toLowerCase() === 'same') &&
      question.options.some((opt) => String(opt).trim().toLowerCase() === 'different');

    const isClericalQuestion =
      question.subtype === 'clerical' ||
      question.category === 'clerical' ||
      question.skill_tag === 'clerical_speed' ||
      hasSameDifferentOptions;

    if (isClericalQuestion) {
      // Clerical questions use "Same" or "Different"
      const normalized = String(correctAnswer).trim().toLowerCase();

      // Handle various formats: "Same", "Different", "Option A", "Option B", "A", "B"
      if (normalized === 'same' || normalized === 'different') {
        // Already in correct format
        question.correct = normalized.charAt(0).toUpperCase() + normalized.slice(1);
      } else if (normalized.includes('option a') || normalized === 'a') {
        // AI returned "Option A" or "A" - assume first option is the answer
        // Check what the first option actually is
        if (question.options && question.options[0]) {
          const firstOption = String(question.options[0]).trim().toLowerCase();
          if (firstOption === 'same' || firstOption === 'different') {
            question.correct = firstOption.charAt(0).toUpperCase() + firstOption.slice(1);
          } else {
            // Default to "Same" if we can't determine
            question.correct = 'Same';
            console.warn(`⚠️ Clerical question has unclear first option, defaulting to "Same"`);
          }
        } else {
          question.correct = 'Same';
        }
      } else if (normalized.includes('option b') || normalized === 'b') {
        // AI returned "Option B" or "B" - assume second option is the answer
        if (question.options && question.options[1]) {
          const secondOption = String(question.options[1]).trim().toLowerCase();
          if (secondOption === 'same' || secondOption === 'different') {
            question.correct = secondOption.charAt(0).toUpperCase() + secondOption.slice(1);
          } else {
            // Default to "Different" if we can't determine
            question.correct = 'Different';
            console.warn(
              `⚠️ Clerical question has unclear second option, defaulting to "Different"`
            );
          }
        } else {
          question.correct = 'Different';
        }
      } else {
        errors.push(`Invalid clerical answer: ${correctAnswer} (expected "Same" or "Different")`);
      }
    } else {
      // Regular MCQ questions use A/B/C/D
      // First try to extract letter from formats like "Option B", "B)", "b", etc.
      const normalized = String(correctAnswer).trim().toUpperCase();
      const letterMatch = normalized.match(/[ABCD]/);

      if (letterMatch) {
        // Found a letter, use it
        question.correct = letterMatch[0];
      } else if (question.options && Array.isArray(question.options)) {
        // AI returned the actual answer text, match it against options
        const answerText = String(correctAnswer).trim();
        const optionIndex = question.options.findIndex((opt) => {
          const optText = String(opt).trim();
          return optText === answerText || optText.toLowerCase() === answerText.toLowerCase();
        });

        if (optionIndex !== -1 && optionIndex < 4) {
          // Convert index to letter (0->A, 1->B, 2->C, 3->D)
          question.correct = String.fromCharCode(65 + optionIndex);
        } else {
          errors.push(`Invalid correct answer: ${correctAnswer}`);
        }
      } else {
        errors.push(`Invalid correct answer: ${correctAnswer}`);
      }
    }
  }

  // Check type/subtype for categorization
  if (questionType === 'aptitude' && !question.subtype && !question.category) {
    errors.push('Missing subtype/category for aptitude question');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate and filter a batch of questions
 * @param {Array} questions - Array of questions to validate
 * @param {string} questionType - 'aptitude' or 'knowledge'
 * @param {number} expectedCount - Expected number of questions
 * @returns {Object} { valid: Array, invalid: Array, needsMore: boolean }
 */
export function validateQuestionBatch(questions, questionType, expectedCount) {
  const valid = [];
  const invalid = [];

  questions.forEach((q, idx) => {
    const validation = validateQuestion(q, questionType);
    if (validation.isValid) {
      valid.push(q);
    } else {
      console.warn(`❌ Question ${idx + 1} failed validation:`, validation.errors);
      invalid.push({ question: q, errors: validation.errors });
    }
  });

  const needsMore = valid.length < expectedCount;

  console.log(
    `📊 Validation results: ${valid.length}/${expectedCount} valid, ${invalid.length} invalid`
  );

  return { valid, invalid, needsMore };
}

/**
 * Error types for question generation
 */
export const QuestionGenerationError = {
  API_UNAVAILABLE: 'API_UNAVAILABLE',
  RATE_LIMIT: 'RATE_LIMIT',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  INSUFFICIENT_QUESTIONS: 'INSUFFICIENT_QUESTIONS',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  UNKNOWN: 'UNKNOWN',
};

/**
 * User-friendly error messages for each error type
 */
export const ERROR_MESSAGES = {
  [QuestionGenerationError.API_UNAVAILABLE]:
    'Question generation service is temporarily unavailable. Retrying...',
  [QuestionGenerationError.RATE_LIMIT]: 'Please wait, processing your request...',
  [QuestionGenerationError.INVALID_RESPONSE]: 'Received invalid response. Retrying...',
  [QuestionGenerationError.INSUFFICIENT_QUESTIONS]: 'Generating additional questions...',
  [QuestionGenerationError.DATABASE_ERROR]:
    'Unable to save questions, but you can continue with the assessment.',
  [QuestionGenerationError.NETWORK_TIMEOUT]: 'Network connection timeout. Retrying...',
  [QuestionGenerationError.UNKNOWN]: 'An unexpected error occurred. Retrying...',
};

/**
 * Classify error type based on error details
 * @param {Error|Response} error - Error object or response
 * @param {number} status - HTTP status code (if available)
 * @returns {string} - Error type from QuestionGenerationError
 */
export function classifyError(error, status = null) {
  // Check HTTP status codes
  if (status === 503) return QuestionGenerationError.API_UNAVAILABLE;
  if (status === 429) return QuestionGenerationError.RATE_LIMIT;
  if (status >= 500) return QuestionGenerationError.API_UNAVAILABLE;
  if (status >= 400 && status < 500) return QuestionGenerationError.INVALID_RESPONSE;

  // Check error message patterns
  if (error?.message) {
    const msg = error.message.toLowerCase();
    if (msg.includes('timeout') || msg.includes('timed out')) {
      return QuestionGenerationError.NETWORK_TIMEOUT;
    }
    if (msg.includes('network') || msg.includes('fetch')) {
      return QuestionGenerationError.API_UNAVAILABLE;
    }
    if (msg.includes('json') || msg.includes('parse')) {
      return QuestionGenerationError.INVALID_RESPONSE;
    }
    if (msg.includes('database') || msg.includes('supabase')) {
      return QuestionGenerationError.DATABASE_ERROR;
    }
  }

  return QuestionGenerationError.UNKNOWN;
}

/**
 * Get user-friendly error message
 * @param {string} errorType - Error type from QuestionGenerationError
 * @returns {string} - User-friendly error message
 */
export function getUserErrorMessage(errorType) {
  return ERROR_MESSAGES[errorType] || ERROR_MESSAGES[QuestionGenerationError.UNKNOWN];
}

/**
 * Handle API response errors with appropriate retry logic
 * @param {Response} response - Fetch response object
 * @param {number} attempt - Current attempt number
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Object>} - { shouldRetry: boolean, delay: number, errorType: string }
 */
export async function handleAPIError(response, attempt, maxRetries) {
  const status = response.status;
  const errorType = classifyError(null, status);

  // Rate limit - wait for retry-after header or use exponential backoff
  if (status === 429) {
    const retryAfter = response.headers.get('retry-after');
    const delay = retryAfter ? parseInt(retryAfter) * 1000 : 2000 * attempt;
    console.log(`⏳ Rate limit hit, waiting ${delay}ms before retry`);
    return {
      shouldRetry: attempt < maxRetries,
      delay,
      errorType,
      message: getUserErrorMessage(errorType),
    };
  }

  // API unavailable - exponential backoff
  if (status === 503 || status >= 500) {
    const delay = 2000 * attempt;
    console.log(`⚠️ API unavailable (${status}), waiting ${delay}ms before retry`);
    return {
      shouldRetry: attempt < maxRetries,
      delay,
      errorType,
      message: getUserErrorMessage(errorType),
    };
  }

  // Client errors - don't retry
  if (status >= 400 && status < 500 && status !== 429) {
    console.error(`❌ Client error (${status}), not retrying`);
    return {
      shouldRetry: false,
      delay: 0,
      errorType,
      message: getUserErrorMessage(errorType),
    };
  }

  // Other errors - retry with exponential backoff
  const delay = 2000 * attempt;
  return {
    shouldRetry: attempt < maxRetries,
    delay,
    errorType,
    message: getUserErrorMessage(errorType),
  };
}

/**
 * Handle network/fetch errors with appropriate retry logic
 * @param {Error} error - Error object
 * @param {number} attempt - Current attempt number
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Object} - { shouldRetry: boolean, delay: number, errorType: string }
 */
export function handleNetworkError(error, attempt, maxRetries) {
  const errorType = classifyError(error);
  const delay = 2000 * attempt; // Exponential backoff

  console.error(`❌ Network error (attempt ${attempt}/${maxRetries}):`, error.message);

  return {
    shouldRetry: attempt < maxRetries,
    delay,
    errorType,
    message: getUserErrorMessage(errorType),
  };
}

/**
 * Handle database save errors gracefully
 * @param {Error} error - Database error
 * @param {string} context - Context description (e.g., 'saving aptitude questions')
 * @returns {Object} - { canContinue: boolean, errorType: string, message: string }
 */
export function handleDatabaseError(error, context) {
  const errorType = QuestionGenerationError.DATABASE_ERROR;
  const message = getUserErrorMessage(errorType);

  console.error(`❌ Database error while ${context}:`, error.message);
  console.log('ℹ️ Continuing with in-memory questions (resume functionality may not work)');

  return {
    canContinue: true, // Can continue with in-memory questions
    errorType,
    message,
  };
}

/**
 * Handle insufficient questions scenario
 * @param {number} actualCount - Actual number of valid questions
 * @param {number} expectedCount - Expected number of questions
 * @param {number} attempt - Current attempt number
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Object} - { shouldRetry: boolean, canProceed: boolean, message: string }
 */
export function handleInsufficientQuestions(actualCount, expectedCount, attempt, maxRetries) {
  const errorType = QuestionGenerationError.INSUFFICIENT_QUESTIONS;
  const percentage = (actualCount / expectedCount) * 100;

  // If we have at least 80% of expected questions, we can proceed
  const canProceed = percentage >= 80;
  const shouldRetry = !canProceed && attempt < maxRetries;

  if (canProceed) {
    console.log(
      `✅ Proceeding with ${actualCount}/${expectedCount} questions (${percentage.toFixed(0)}%)`
    );
  } else if (shouldRetry) {
    console.log(
      `⏳ Only ${actualCount}/${expectedCount} questions (${percentage.toFixed(0)}%), retrying...`
    );
  } else {
    console.warn(
      `⚠️ Only ${actualCount}/${expectedCount} questions (${percentage.toFixed(0)}%) after ${attempt} attempts`
    );
  }

  return {
    shouldRetry,
    canProceed,
    errorType,
    message: getUserErrorMessage(errorType),
  };
}

/**
 * Generate questions with validation and retry logic
 * @param {Function} generatorFn - Function that generates questions
 * @param {string} questionType - 'aptitude' or 'knowledge'
 * @param {number} expectedCount - Expected number of questions
 * @param {number} maxRetries - Maximum retry attempts (default 3)
 * @returns {Promise<Array>} - Valid questions
 */
export async function generateWithValidation(
  generatorFn,
  questionType,
  expectedCount,
  maxRetries = 3
) {
  let allValidQuestions = [];
  let attempt = 0;

  while (attempt < maxRetries && allValidQuestions.length < expectedCount) {
    attempt++;
    console.log(`📦 Generation attempt ${attempt}/${maxRetries} for ${questionType}`);

    try {
      const questions = await generatorFn();

      if (!questions || questions.length === 0) {
        console.warn(`⚠️ No questions returned on attempt ${attempt}`);
        if (attempt < maxRetries) {
          // Exponential backoff: 2s, 4s, 6s
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
          continue;
        }
        break;
      }

      const validation = validateQuestionBatch(
        questions,
        questionType,
        expectedCount - allValidQuestions.length
      );
      allValidQuestions = [...allValidQuestions, ...validation.valid];

      console.log(
        `✅ Attempt ${attempt}: ${validation.valid.length} valid questions (total: ${allValidQuestions.length}/${expectedCount})`
      );

      if (!validation.needsMore) {
        break;
      }

      // If we need more questions and have retries left, wait and try again
      if (attempt < maxRetries) {
        const needed = expectedCount - allValidQuestions.length;
        console.log(`⏳ Need ${needed} more questions, retrying...`);
        // Exponential backoff: 2s, 4s, 6s
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }
    } catch (error) {
      console.error(`❌ Error on attempt ${attempt}:`, error);
      if (attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 6s
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  if (allValidQuestions.length < expectedCount) {
    console.warn(
      `⚠️ Only generated ${allValidQuestions.length}/${expectedCount} valid questions after ${attempt} attempts`
    );
  }

  return allValidQuestions.slice(0, expectedCount);
}

/**
 * Get saved questions for a student (for resume functionality)
 * @param {string} studentId - Student ID
 * @param {string} streamId - Stream ID
 * @param {string} questionType - Question type ('aptitude' or 'knowledge')
 * @returns {Promise<Array|null>} - Array of questions or null if not found
 */
export async function getSavedQuestionsForStudent(studentId, streamId, questionType) {
  if (!studentId) {
    console.log('⚠️ getSavedQuestionsForStudent: No studentId provided');
    return null;
  }

  console.log(`🔍 Checking for cached ${questionType} questions:`, {
    student_id: studentId,
    stream_id: streamId,
    question_type: questionType,
  });

  try {
    const { data, error } = await supabase
      .from('career_assessment_ai_questions')
      .select('questions, generated_at')
      .eq('student_id', studentId)
      .eq('stream_id', streamId)
      .eq('question_type', questionType)
      .eq('is_active', true)
      .maybeSingle(); // Use maybeSingle instead of single to avoid 406 error

    if (error) {
      console.warn(`⚠️ Database query error for ${questionType} questions:`, {
        error: error.message,
        code: error.code,
        details: error.details,
      });
      return null;
    }

    // Handle missing data
    if (!data) {
      console.log(`ℹ️ No cached ${questionType} questions found for student ${studentId}`);
      return null;
    }

    // Validate data structure
    if (!data.questions) {
      console.warn(`⚠️ Cached data exists but questions field is missing for ${questionType}`);
      return null;
    }

    // Handle corrupted data (not an array)
    if (!Array.isArray(data.questions)) {
      console.warn(
        `⚠️ Cached ${questionType} questions data is corrupted (not an array):`,
        typeof data.questions
      );
      return null;
    }

    // Handle empty array
    if (data.questions.length === 0) {
      console.warn(`⚠️ Cached ${questionType} questions array is empty`);
      return null;
    }

    // Success - log cache hit with metadata
    console.log(`✅ Cache HIT: Found ${data.questions.length} saved ${questionType} questions`, {
      student_id: studentId,
      stream_id: streamId,
      question_count: data.questions.length,
      generated_at: data.generated_at,
      grade_level: data.grade_level,
      cache_age_hours: data.generated_at
        ? Math.round((Date.now() - new Date(data.generated_at).getTime()) / (1000 * 60 * 60))
        : 'unknown',
    });

    return data.questions;
  } catch (err) {
    console.error(`❌ Exception while fetching saved ${questionType} questions:`, {
      error: err.message,
      stack: err.stack,
      student_id: studentId,
      stream_id: streamId,
    });
    return null;
  }
}

/**
 * Generate Stream Knowledge questions using AI
 * If studentId provided, saves questions for resume functionality
 */
export async function generateStreamKnowledgeQuestions(
  streamId,
  questionCount = 20,
  studentId = null,
  attemptId = null,
  gradeLevel = null
) {
  // Normalize the stream ID to match our STREAM_KNOWLEDGE_PROMPTS keys
  const normalizedStreamId = normalizeStreamId(streamId);
  const streamInfo = STREAM_KNOWLEDGE_PROMPTS[normalizedStreamId];

  if (!streamInfo) {
    console.error(
      'Unknown stream:',
      streamId,
      '(normalized:',
      normalizedStreamId,
      ') - using generic college stream'
    );
    // Use generic college stream as fallback
    const fallbackInfo = STREAM_KNOWLEDGE_PROMPTS['college'];
    if (!fallbackInfo) return null;
  }

  const effectiveStreamInfo = streamInfo || STREAM_KNOWLEDGE_PROMPTS['college'];
  const effectiveStreamId = streamInfo ? normalizedStreamId : 'college';

  // Check for saved questions first if studentId provided
  if (studentId) {
    // Try with normalized stream ID first
    let saved = await getSavedQuestionsForStudent(studentId, effectiveStreamId, 'knowledge');
    // Also try with original stream ID in case it was saved that way
    if (!saved && streamId !== effectiveStreamId) {
      saved = await getSavedQuestionsForStudent(studentId, streamId, 'knowledge');
    }
    if (saved) {
      console.log('✅ Using saved knowledge questions for student');
      return saved;
    }
  }

  console.log(
    '🎯 Generating fresh knowledge questions for:',
    effectiveStreamInfo.name,
    '(stream:',
    effectiveStreamId,
    ')'
  );
  console.log('📚 Stream topics:', effectiveStreamInfo.topics);

  // Use unified question generation API
  const apiUrl =
    import.meta.env.VITE_QUESTION_GENERATION_API_URL ||
    'https://question-generation-api.dark-mode-d021.workers.dev';
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 Calling Knowledge API (attempt ${attempt}/${maxRetries})`);

      const response = await fetch(`${apiUrl}/career-assessment/generate-knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId: effectiveStreamId,
          streamName: effectiveStreamInfo.name,
          topics: effectiveStreamInfo.topics,
          questionCount,
          studentId,
          attemptId,
          gradeLevel, // Add grade level to API request
        }),
      });

      if (!response.ok) {
        // Handle API errors with appropriate retry logic
        const errorInfo = await handleAPIError(response, attempt, maxRetries);
        const errorText = await response.text();
        console.error(`❌ API Error Response (attempt ${attempt}):`, errorText);
        console.log(`ℹ️ ${errorInfo.message}`);

        if (errorInfo.shouldRetry) {
          await new Promise((resolve) => setTimeout(resolve, errorInfo.delay));
          continue;
        } else {
          return null;
        }
      }

      const data = await response.json();

      // Validate response structure
      if (!data || !data.questions) {
        const errorType = classifyError(new Error('Invalid API response'));
        console.error(`❌ Invalid API response (attempt ${attempt}): missing questions array`);
        console.log(`ℹ️ ${getUserErrorMessage(errorType)}`);

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
          continue;
        }
        return null;
      }

      console.log('✅ Knowledge questions generated:', data.questions?.length || 0);

      // Validate question quality using validateQuestionBatch
      const validation = validateQuestionBatch(data.questions, 'knowledge', questionCount);

      // Filter out invalid questions - only use valid ones
      const validQuestions = validation.valid;

      if (validation.invalid.length > 0) {
        console.warn(`⚠️ Filtered out ${validation.invalid.length} invalid knowledge questions`);
      }

      // Check if we have sufficient valid questions
      if (validQuestions.length < questionCount) {
        console.warn(
          `⚠️ Only ${validQuestions.length}/${questionCount} valid knowledge questions after validation`
        );

        if (attempt < maxRetries) {
          const needed = questionCount - validQuestions.length;
          console.log(
            `⏳ Need ${needed} more valid questions, retrying (attempt ${attempt + 1}/${maxRetries})...`
          );
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
          continue;
        } else {
          console.warn(
            `⚠️ Proceeding with ${validQuestions.length} valid questions after ${maxRetries} attempts`
          );
        }
      }

      // Ensure final count is exactly 20 (or questionCount)
      const finalQuestions = validQuestions.slice(0, questionCount);

      console.log(`✅ Final knowledge question count: ${finalQuestions.length}/${questionCount}`);

      // If API returned questions but didn't save them, save from frontend as fallback
      if (finalQuestions.length > 0 && studentId && !data.cached) {
        console.log('💾 Saving knowledge questions from frontend as fallback...');
        await saveKnowledgeQuestions(
          studentId,
          effectiveStreamId,
          attemptId,
          finalQuestions,
          gradeLevel
        );
      }

      return finalQuestions;
    } catch (error) {
      // Handle network/fetch errors
      const errorInfo = handleNetworkError(error, attempt, maxRetries);
      console.log(`ℹ️ ${errorInfo.message}`);

      if (errorInfo.shouldRetry) {
        await new Promise((resolve) => setTimeout(resolve, errorInfo.delay));
      } else {
        return null;
      }
    }
  }

  return null; // Return null instead of fallback
}

/**
 * Generate Aptitude questions using AI
 * If studentId provided, saves questions for resume functionality
 * @param {string} streamId - The stream ID (science, commerce, arts, etc.)
 * @param {number} questionCount - Number of questions to generate (default 50)
 * @param {string} studentId - Student ID for saving questions
 * @param {string} attemptId - Assessment attempt ID
 * @param {string} gradeLevel - Grade level: 'after10', 'after12', 'college'
 */
export async function generateAptitudeQuestions(
  streamId,
  questionCount = 50,
  studentId = null,
  attemptId = null,
  gradeLevel = null
) {
  // Check for saved questions first if studentId provided
  if (studentId) {
    const saved = await getSavedQuestionsForStudent(studentId, streamId, 'aptitude');
    if (saved && saved.length > 0) {
      console.log('✅ Using saved aptitude questions for student:', saved.length);
      return saved;
    }
  }

  console.log('🎯 Generating aptitude questions for stream:', streamId, 'gradeLevel:', gradeLevel);

  // Use unified question generation API
  const apiUrl =
    import.meta.env.VITE_QUESTION_GENERATION_API_URL ||
    'https://question-generation-api.dark-mode-d021.workers.dev';
  const maxRetries = 3;
  const questionsPerCategory = Math.ceil(questionCount / APTITUDE_CATEGORIES.length); // 10 per category for 50 total

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 Calling API (attempt ${attempt}/${maxRetries})`);

      const response = await fetch(`${apiUrl}/career-assessment/generate-aptitude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId,
          questionsPerCategory,
          studentId,
          attemptId,
          gradeLevel, // Pass gradeLevel to API
        }),
      });

      if (!response.ok) {
        // Handle API errors with appropriate retry logic
        const errorInfo = await handleAPIError(response, attempt, maxRetries);
        const errorText = await response.text();
        console.error(`❌ API Error (attempt ${attempt}):`, errorText.substring(0, 200));
        console.log(`ℹ️ ${errorInfo.message}`);

        if (errorInfo.shouldRetry) {
          await new Promise((resolve) => setTimeout(resolve, errorInfo.delay));
          continue;
        } else {
          return null;
        }
      }

      const data = await response.json();

      // Validate response structure
      if (!data || !data.questions) {
        const errorType = classifyError(new Error('Invalid API response'));
        console.error(`❌ Invalid API response (attempt ${attempt}): missing questions array`);
        console.log(`ℹ️ ${getUserErrorMessage(errorType)}`);

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
          continue;
        }
        return null;
      }

      console.log('✅ Aptitude questions generated:', data.questions?.length || 0);

      // Validate question quality using validateQuestionBatch
      const validation = validateQuestionBatch(data.questions, 'aptitude', questionCount);

      // Filter out invalid questions - only use valid ones
      const validQuestions = validation.valid;
      console.log(
        `📊 Validation: ${validQuestions.length} valid, ${validation.invalid.length} invalid`
      );

      // Check if we have sufficient valid questions (80% threshold)
      if (validQuestions.length < questionCount) {
        console.warn(`⚠️ Insufficient valid questions: ${validQuestions.length}/${questionCount}`);

        const threshold = Math.floor(questionCount * 0.8);

        if (validQuestions.length >= threshold) {
          console.log(
            `✅ Proceeding with ${validQuestions.length} questions (>= ${Math.floor((threshold / questionCount) * 100)}% threshold)`
          );

          // Save valid questions if we have studentId
          if (validQuestions.length > 0 && studentId && !data.cached) {
            console.log('💾 Saving valid questions from frontend as fallback...');
            await saveAptitudeQuestions(studentId, streamId, attemptId, validQuestions, gradeLevel);
          }

          return validQuestions;
        }

        // If below threshold and we have retries left, request additional questions
        if (attempt < maxRetries) {
          const needed = questionCount - validQuestions.length;
          console.log(
            `⏳ Need ${needed} more valid questions, retrying (attempt ${attempt}/${maxRetries})...`
          );
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
          continue;
        }

        // Last attempt - return what we have if it's at least 50%
        const minThreshold = Math.floor(questionCount * 0.5);
        if (validQuestions.length >= minThreshold) {
          console.log(
            `⚠️ Final attempt: Proceeding with ${validQuestions.length} questions (>= 50% threshold)`
          );

          if (validQuestions.length > 0 && studentId && !data.cached) {
            console.log('💾 Saving valid questions from frontend as fallback...');
            await saveAptitudeQuestions(studentId, streamId, attemptId, validQuestions, gradeLevel);
          }

          return validQuestions;
        }

        console.error(
          `❌ Insufficient valid questions after all retries: ${validQuestions.length}/${questionCount}`
        );
        return null;
      }

      // We have enough valid questions - ensure final count matches expected count
      const finalQuestions = validQuestions.slice(0, questionCount);
      console.log(`✅ Final question count: ${finalQuestions.length}/${questionCount}`);

      // If API returned questions but didn't save them (cached: false, generated: true),
      // save them from frontend as a fallback
      if (finalQuestions.length > 0 && studentId && !data.cached) {
        console.log('💾 Saving questions from frontend as fallback...');
        await saveAptitudeQuestions(studentId, streamId, attemptId, finalQuestions, gradeLevel);
      }

      return finalQuestions;
    } catch (error) {
      // Handle network/fetch errors
      const errorInfo = handleNetworkError(error, attempt, maxRetries);
      console.log(`ℹ️ ${errorInfo.message}`);

      if (errorInfo.shouldRetry) {
        await new Promise((resolve) => setTimeout(resolve, errorInfo.delay));
      } else {
        return null;
      }
    }
  }

  return null;
}

/**
 * Save aptitude questions to database (fallback if API doesn't save)
 * @param {string} studentId - Student ID
 * @param {string} streamId - Stream ID
 * @param {string} attemptId - Assessment attempt ID
 * @param {Array} questions - Array of question objects
 * @param {string} gradeLevel - Grade level (e.g., 'higher_secondary', 'after10', 'college')
 */
async function saveAptitudeQuestions(studentId, streamId, attemptId, questions, gradeLevel = null) {
  if (!studentId) {
    console.log('⚠️ No studentId provided, skipping save');
    return;
  }

  console.log(
    `💾 [Frontend] Saving ${questions.length} aptitude questions for student:`,
    studentId,
    'stream:',
    streamId,
    'grade:',
    gradeLevel
  );

  try {
    const saveData = {
      student_id: studentId,
      stream_id: streamId,
      question_type: 'aptitude',
      attempt_id: attemptId || null,
      questions: questions,
      generated_at: new Date().toISOString(),
      grade_level: gradeLevel,
      is_active: true,
    };

    console.log('💾 Attempting database save with metadata:', {
      student_id: studentId,
      stream_id: streamId,
      question_type: 'aptitude',
      attempt_id: attemptId,
      grade_level: gradeLevel,
      question_count: questions.length,
    });

    const { data, error } = await supabase
      .from('career_assessment_ai_questions')
      .upsert(saveData, { onConflict: 'student_id,stream_id,question_type' })
      .select('id');

    if (error) {
      const errorInfo = handleDatabaseError(error, 'saving aptitude questions');
      console.error('❌ [Frontend] Database save failed:', {
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      console.log('ℹ️', errorInfo.message);
      console.log(
        '⚠️ Continuing with in-memory questions - assessment can proceed without caching'
      );
      // Continue with in-memory questions - don't throw
      return false;
    } else {
      console.log('✅ [Frontend] Aptitude questions saved successfully:', {
        question_count: questions.length,
        record_id: data?.[0]?.id,
        grade_level: gradeLevel,
        timestamp: new Date().toISOString(),
      });
      return true;
    }
  } catch (e) {
    const errorInfo = handleDatabaseError(e, 'saving aptitude questions');
    console.error('❌ [Frontend] Exception during save:', {
      error: e.message,
      stack: e.stack,
    });
    console.log('ℹ️', errorInfo.message);
    console.log('⚠️ Continuing with in-memory questions - assessment can proceed without caching');
    // Continue with in-memory questions - don't throw
    return false;
  }
}

/**
 * Save knowledge questions to database (fallback if API doesn't save)
 * @param {string} studentId - Student ID
 * @param {string} streamId - Stream ID
 * @param {string} attemptId - Assessment attempt ID
 * @param {Array} questions - Array of question objects
 * @param {string} gradeLevel - Grade level (e.g., 'higher_secondary', 'after10', 'college')
 */
async function saveKnowledgeQuestions(
  studentId,
  streamId,
  attemptId,
  questions,
  gradeLevel = null
) {
  if (!studentId) {
    console.log('⚠️ No studentId provided, skipping knowledge save');
    return;
  }

  console.log(
    `💾 [Frontend] Saving ${questions.length} knowledge questions for student:`,
    studentId,
    'stream:',
    streamId,
    'grade:',
    gradeLevel
  );

  try {
    const { data, error } = await supabase
      .from('career_assessment_ai_questions')
      .upsert(
        {
          student_id: studentId,
          stream_id: streamId,
          question_type: 'knowledge',
          attempt_id: attemptId || null,
          questions: questions,
          generated_at: new Date().toISOString(),
          grade_level: gradeLevel,
          is_active: true,
        },
        { onConflict: 'student_id,stream_id,question_type' }
      )
      .select('id');

    if (error) {
      const errorInfo = handleDatabaseError(error, 'saving knowledge questions');
      console.error('❌ [Frontend] Database error:', error.message, error.details, error.hint);
      console.log('ℹ️', errorInfo.message);
      // Continue with in-memory questions - don't throw
    } else {
      console.log('✅ [Frontend] Knowledge questions saved successfully:', {
        question_count: questions.length,
        record_id: data?.[0]?.id,
        grade_level: gradeLevel,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (e) {
    const errorInfo = handleDatabaseError(e, 'saving knowledge questions');
    console.error('❌ [Frontend] Exception:', e.message);
    console.log('ℹ️', errorInfo.message);
    // Continue with in-memory questions - don't throw
  }
}

/**
 * Get fallback knowledge questions if AI generation fails
 */
function getFallbackKnowledgeQuestions(streamId) {
  const streamInfo = STREAM_KNOWLEDGE_PROMPTS[streamId];
  if (!streamInfo) return [];

  return streamInfo.topics.map((topic, idx) => ({
    id: `knowledge_${streamId}_${idx + 1}`,
    type: 'mcq',
    question: `Which of the following best describes a key concept in ${topic}?`,
    options: [
      `A fundamental principle of ${topic}`,
      `An advanced technique in ${topic}`,
      `A common misconception about ${topic}`,
      `An unrelated concept`,
    ],
    correct_answer: `A fundamental principle of ${topic}`,
    skill_tag: topic,
    difficulty: idx < 2 ? 'easy' : idx < 4 ? 'medium' : 'hard',
  }));
}

/**
 * Clear saved questions for a student (when starting fresh assessment)
 */
export async function clearSavedQuestionsForStudent(studentId, streamId) {
  try {
    await supabase
      .from('career_assessment_ai_questions')
      .update({ is_active: false })
      .eq('student_id', studentId)
      .eq('stream_id', streamId);
    console.log('✅ Cleared saved questions for student:', studentId);
  } catch (err) {
    console.warn('Error clearing saved questions:', err);
  }
}

/**
 * Load questions for career assessment
 * - If student has saved questions (from previous attempt), loads those
 * - Otherwise generates fresh AI questions and saves them
 * - Falls back to hardcoded questions if AI fails or returns too few
 */
export async function loadCareerAssessmentQuestions(
  streamId,
  gradeLevel,
  studentId = null,
  attemptId = null
) {
  const questions = {
    aptitude: null,
    knowledge: null,
  };

  // Generate AI questions for after10, after12, higher_secondary AND college grade levels
  if (
    (gradeLevel === 'after10' ||
      gradeLevel === 'after12' ||
      gradeLevel === 'higher_secondary' ||
      gradeLevel === 'college') &&
    streamId
  ) {
    console.log(
      `🤖 Loading AI questions for ${gradeLevel} student, stream:`,
      streamId,
      'studentId:',
      studentId
    );

    // Normalize stream ID for college students
    const normalizedStreamId = normalizeStreamId(streamId);
    console.log(`📋 Normalized stream ID: ${normalizedStreamId}`);

    // Generate/load aptitude questions first (will use saved if available)
    // Pass gradeLevel so API knows to use appropriate difficulty
    const aiAptitude = await generateAptitudeQuestions(
      normalizedStreamId,
      50,
      studentId,
      attemptId,
      gradeLevel
    );

    if (aiAptitude && aiAptitude.length > 0) {
      questions.aptitude = aiAptitude;
      console.log(`✅ Using ${aiAptitude.length} AI aptitude questions`);
    }

    // Add delay between API calls to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate/load knowledge questions (will use saved if available)
    const aiKnowledge = await generateStreamKnowledgeQuestions(
      normalizedStreamId,
      20,
      studentId,
      attemptId,
      gradeLevel
    );

    if (aiKnowledge && aiKnowledge.length > 0) {
      questions.knowledge = aiKnowledge;
      console.log(`✅ Using ${aiKnowledge.length} AI knowledge questions`);
    }
  }

  return questions;
}

export default {
  generateStreamKnowledgeQuestions,
  generateAptitudeQuestions,
  loadCareerAssessmentQuestions,
  getSavedQuestionsForStudent,
  clearSavedQuestionsForStudent,
  normalizeStreamId,
  STREAM_KNOWLEDGE_PROMPTS,
  APTITUDE_CATEGORIES,
};
