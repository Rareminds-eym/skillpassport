/**
 * RIASEC Interest Inventory - 48 items (8 per type)
 * Based on Holland's RIASEC model (Realistic, Investigative, Artistic, Social, Enterprising, Conventional)
 * 
 * @module features/assessment/data/questions/riasecQuestions
 */

export type RIASECType = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export interface RIASECQuestion {
  id: string;
  type: RIASECType;
  text: string;
}

export const riasecQuestions: RIASECQuestion[] = [
  // R – Realistic (hands-on, tools, outdoors, practical) - 8 questions
  { id: 'riasec_r1', type: 'R', text: 'Repair a broken appliance or device.' },
  { id: 'riasec_r2', type: 'R', text: 'Build something using basic tools (wood/metal/electronics).' },
  { id: 'riasec_r3', type: 'R', text: 'Operate machines or technical equipment.' },
  { id: 'riasec_r4', type: 'R', text: 'Work on a project that involves physical activity.' },
  { id: 'riasec_r5', type: 'R', text: 'Assemble or install parts to make something work.' },
  { id: 'riasec_r6', type: 'R', text: 'Do fieldwork outside a classroom/office.' },
  { id: 'riasec_r7', type: 'R', text: 'Troubleshoot hardware problems.' },
  { id: 'riasec_r8', type: 'R', text: 'Learn by doing rather than reading.' },

  // I – Investigative (analysis, science, logic, curiosity) - 8 questions
  { id: 'riasec_i1', type: 'I', text: 'Solve a tough math or logic problem for fun.' },
  { id: 'riasec_i2', type: 'I', text: 'Explore why something works the way it does.' },
  { id: 'riasec_i3', type: 'I', text: 'Read or watch science/tech content beyond class.' },
  { id: 'riasec_i4', type: 'I', text: 'Design an experiment or test an idea.' },
  { id: 'riasec_i5', type: 'I', text: 'Work with data to find patterns.' },
  { id: 'riasec_i6', type: 'I', text: 'Enjoy tasks that need deep concentration.' },
  { id: 'riasec_i7', type: 'I', text: 'Investigate a real-world problem step by step.' },
  { id: 'riasec_i8', type: 'I', text: 'Prefer evidence before believing a claim.' },

  // A – Artistic (creative, ideas, expression, design) - 8 questions
  { id: 'riasec_a1', type: 'A', text: 'Create artwork, music, content, or performances.' },
  { id: 'riasec_a2', type: 'A', text: 'Think of unique ways to present ideas.' },
  { id: 'riasec_a3', type: 'A', text: 'Enjoy writing stories, poems, scripts, or posts.' },
  { id: 'riasec_a4', type: 'A', text: 'Prefer open-ended tasks over fixed rules.' },
  { id: 'riasec_a5', type: 'A', text: 'Like experimenting with colors, visuals, or style.' },
  { id: 'riasec_a6', type: 'A', text: 'Enjoy brainstorming fresh concepts.' },
  { id: 'riasec_a7', type: 'A', text: 'Notice design/beauty in everyday things.' },
  { id: 'riasec_a8', type: 'A', text: 'Like expressing feelings through creative work.' },

  // S – Social (helping, teaching, teamwork, empathy) - 8 questions
  { id: 'riasec_s1', type: 'S', text: 'Help someone learn a new skill.' },
  { id: 'riasec_s2', type: 'S', text: 'Enjoy mentoring juniors or peers.' },
  { id: 'riasec_s3', type: 'S', text: 'Feel good supporting people in difficulty.' },
  { id: 'riasec_s4', type: 'S', text: 'Prefer work that benefits others.' },
  { id: 'riasec_s5', type: 'S', text: 'Like group activities and collaboration.' },
  { id: 'riasec_s6', type: 'S', text: 'Try to understand people\'s feelings.' },
  { id: 'riasec_s7', type: 'S', text: 'Enjoy guiding teams to work better together.' },
  { id: 'riasec_s8', type: 'S', text: 'Like roles involving care, service, or community.' },

  // E – Enterprising (leading, persuading, selling, risk-taking) - 8 questions
  { id: 'riasec_e1', type: 'E', text: 'Convince others about an idea you believe in.' },
  { id: 'riasec_e2', type: 'E', text: 'Take leadership in college projects.' },
  { id: 'riasec_e3', type: 'E', text: 'Enjoy negotiating or closing deals.' },
  { id: 'riasec_e4', type: 'E', text: 'Like planning events or ventures.' },
  { id: 'riasec_e5', type: 'E', text: 'Feel energised by competition.' },
  { id: 'riasec_e6', type: 'E', text: 'Spot opportunities and act quickly.' },
  { id: 'riasec_e7', type: 'E', text: 'Enjoy giving presentations to influence people.' },
  { id: 'riasec_e8', type: 'E', text: 'Prefer roles with responsibility and authority.' },

  // C – Conventional (order, systems, detail, accuracy) - 8 questions
  { id: 'riasec_c1', type: 'C', text: 'Organize information in an orderly way.' },
  { id: 'riasec_c2', type: 'C', text: 'Enjoy working with spreadsheets or records.' },
  { id: 'riasec_c3', type: 'C', text: 'Prefer clear instructions and structure.' },
  { id: 'riasec_c4', type: 'C', text: 'Like checking work for errors.' },
  { id: 'riasec_c5', type: 'C', text: 'Keep things neat and systematically arranged.' },
  { id: 'riasec_c6', type: 'C', text: 'Enjoy routine tasks that need precision.' },
  { id: 'riasec_c7', type: 'C', text: 'Follow step-by-step processes comfortably.' },
  { id: 'riasec_c8', type: 'C', text: 'Like jobs that involve planning and scheduling.' }
];

export default riasecQuestions;
