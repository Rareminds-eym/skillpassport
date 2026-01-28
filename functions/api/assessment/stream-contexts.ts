/**
 * Stream-specific contexts for aptitude questions
 * Each stream has 100% stream-related question requirements
 */

export const STREAM_CONTEXTS: Record<string, { name: string; context: string; clericalExample: string }> = {
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
