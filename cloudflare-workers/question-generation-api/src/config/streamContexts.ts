/**
 * Stream-Specific Contexts for Career Assessment
 * Used to generate stream-relevant aptitude questions
 */

import type { StreamContext } from '../types';

export const STREAM_CONTEXTS: Record<string, StreamContext> = {
  'science': {
    name: 'Science',
    context: `ALL questions must use Science context:
- Verbal (100% science): Scientific terminology, research papers, lab reports, scientific method descriptions
- Numerical (100% science): Physics calculations, chemistry equations, biology statistics, scientific data analysis
- Abstract/Logical (100% science): Scientific method reasoning, hypothesis testing, experimental design patterns
- Spatial/Mechanical (100% science): Molecular structures, anatomical diagrams, physics diagrams, lab equipment
- Clerical (100% science): Lab sample IDs, chemical formulas, specimen codes comparison`,
    clericalExample: 'H2SO4-LAB-2024 — H2SO4-LAB-2024'
  },
  'commerce': {
    name: 'Commerce',
    context: `ALL questions must use Commerce/Business context:
- Verbal (100% commerce): Business terminology, financial reports, market analysis, corporate communication
- Numerical (100% commerce): Profit/loss calculations, interest rates, accounting problems, GST calculations
- Abstract/Logical (100% commerce): Business decision scenarios, market trend analysis, supply chain patterns
- Spatial/Mechanical (100% commerce): Financial charts, organizational structures, process flow diagrams
- Clerical (100% commerce): Invoice numbers, account codes, transaction IDs, GST numbers comparison`,
    clericalExample: 'INV-2024-0847-GST — INV-2024-0847-GST'
  },
  'arts': {
    name: 'Arts/Humanities',
    context: `ALL questions must use Arts/Humanities context:
- Verbal (100% arts): Literary terminology, historical texts, philosophical concepts, cultural analysis
- Numerical (100% arts): Social science statistics, historical data analysis, survey interpretation
- Abstract/Logical (100% arts): Ethical dilemmas, historical cause-effect, philosophical reasoning patterns
- Spatial/Mechanical (100% arts): Art compositions, architectural layouts, map reading, design elements
- Clerical (100% arts): Reference codes, catalog numbers, citation IDs, archive codes comparison`,
    clericalExample: 'ISBN-978-3-16-148410 — ISBN-978-3-16-148410'
  },
  'science_pcmb': {
    name: 'Science (PCMB)',
    context: `ALL questions must use 11th/12th Science PCMB context:
- Verbal (100% PCMB): Scientific terminology, biology concepts, physics principles, chemistry reactions
- Numerical (100% PCMB): Physics calculations, chemistry stoichiometry, biology statistics, math problems
- Abstract/Logical (100% PCMB): Scientific reasoning, hypothesis testing, biological patterns, chemical reactions
- Spatial/Mechanical (100% PCMB): Molecular structures, anatomical diagrams, physics diagrams, cell structures
- Clerical (100% PCMB): Chemical formulas, biological names, physics units, lab codes comparison`,
    clericalExample: 'CHEM-H2SO4-2024 — CHEM-H2SO4-2024'
  },
  'science_pcm': {
    name: 'Science (PCM)',
    context: `ALL questions must use 11th/12th Science PCM context:
- Verbal (100% PCM): Physics terminology, chemistry concepts, mathematical descriptions, engineering basics
- Numerical (100% PCM): Physics calculations, chemistry equations, calculus, algebra problems
- Abstract/Logical (100% PCM): Mathematical proofs, physics reasoning, chemical patterns, engineering logic
- Spatial/Mechanical (100% PCM): Physics diagrams, geometric figures, molecular structures, mechanical drawings
- Clerical (100% PCM): Physics units, chemical formulas, mathematical notations comparison`,
    clericalExample: 'PHY-9.8m/s²-2024 — PHY-9.8m/s²-2024'
  },
  'btech_cse': {
    name: 'B.Tech Computer Science',
    context: `ALL questions must use Computer Science/Programming context:
- Verbal (100% CS): Programming terminology, algorithm descriptions, software documentation, code comments
- Numerical (100% CS): Time complexity calculations, binary/hex conversions, data structure operations, memory calculations
- Abstract/Logical (100% CS): Algorithm flowcharts, code logic patterns, debugging scenarios, recursion patterns
- Spatial/Mechanical (100% CS): Data structure diagrams, network topologies, UML diagrams, system architecture
- Clerical (100% CS): Variable names, function signatures, IP addresses, MAC addresses comparison`,
    clericalExample: 'git-a1b2c3d4e5f6 — git-a1b2c3d4e5f6'
  },
  'btech_ece': {
    name: 'B.Tech Electronics & Communication',
    context: `ALL questions must use Electronics & Communication context:
- Verbal (100% ECE): Electronics terminology, circuit descriptions, signal processing concepts, communication protocols
- Numerical (100% ECE): Ohm's law calculations, frequency/wavelength, decibel calculations, filter design values
- Abstract/Logical (100% ECE): Circuit logic patterns, signal flow analysis, modulation schemes, protocol sequences
- Spatial/Mechanical (100% ECE): Circuit diagrams, PCB layouts, antenna patterns, waveform analysis
- Clerical (100% ECE): Component codes, resistor color codes, IC part numbers, frequency bands comparison`,
    clericalExample: 'IC-ATmega328P-PU — IC-ATmega328P-PU'
  },
  'bba': {
    name: 'BBA Business Administration',
    context: `ALL questions must use Business/Management context:
- Verbal (100% business): Management terminology, business communication, organizational concepts
- Numerical (100% business): Business math, profit analysis, market statistics
- Abstract/Logical (100% business): Business strategy patterns, organizational hierarchies, decision trees
- Spatial/Mechanical (100% business): Org charts, process flows, business model diagrams
- Clerical (100% business): Employee IDs, department codes, project numbers comparison`,
    clericalExample: 'PO-MKT-2024-156 — PO-MKT-2024-156'
  },
  'bca': {
    name: 'BCA Computer Applications',
    context: `ALL questions must use Computer Applications context:
- Verbal (100% BCA): Programming terminology, software concepts, IT documentation
- Numerical (100% BCA): Programming calculations, database queries, network math
- Abstract/Logical (100% BCA): Code logic patterns, database relationships, system flows
- Spatial/Mechanical (100% BCA): Flowcharts, ER diagrams, UI wireframes
- Clerical (100% BCA): Code snippets, database entries, file names comparison`,
    clericalExample: 'SELECT_usr_2024 — SELECT_usr_2024'
  },
  'bcom': {
    name: 'B.Com Commerce',
    context: `ALL questions must use Commerce/Accounting context:
- Verbal (100% commerce): Accounting terminology, financial concepts, business law terms
- Numerical (100% commerce): Accounting calculations, tax computations, financial ratios
- Abstract/Logical (100% commerce): Accounting cycles, audit trails, financial patterns
- Spatial/Mechanical (100% commerce): Balance sheets, financial charts, ledger formats
- Clerical (100% commerce): Account numbers, voucher codes, GST numbers comparison`,
    clericalExample: 'GSTIN-29ABCDE1234 — GSTIN-29ABCDE1234'
  },
  'college': {
    name: 'College/University',
    context: `ALL questions must use Academic/Higher Education context:
- Verbal (100% academic): Academic terminology, research concepts, scholarly writing
- Numerical (100% academic): Statistical analysis, research data, academic metrics
- Abstract/Logical (100% academic): Research methodology, critical thinking, analytical patterns
- Spatial/Mechanical (100% academic): Research diagrams, data visualizations, academic charts
- Clerical (100% academic): Reference codes, student IDs, course codes comparison`,
    clericalExample: 'STU-2024-UG-1234 — STU-2024-UG-1234'
  }
};

export function getStreamContext(streamId: string): StreamContext {
  return STREAM_CONTEXTS[streamId] || STREAM_CONTEXTS['science'];
}
