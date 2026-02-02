// Enhanced Intent Detection

import type { CareerIntent, IntentScore, StoredMessage } from '../types';

interface IntentPattern {
  intent: CareerIntent;
  strongPatterns: RegExp[];
  weakPatterns: RegExp[];
  contextBoost: string[];
  chipKeywords: string[];
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    intent: 'find-jobs',
    strongPatterns: [
      /\b(find|search|show|list|get|recommend|suggest)\s*(me\s*)?(a\s*)?(job|jobs|opportunity|opportunities|opening|openings|position|positions|vacancy|vacancies)\b/i,
      /\b(job|jobs|opportunity|opportunities)\s*(for me|matching|suited|suitable|available)\b/i,
      /\bwhat\s*(job|jobs|opportunity|opportunities)\s*(are|is|can|should)\b/i,
      /\b(looking for|searching for|need)\s*(a\s*)?(job|work|employment|internship)\b/i,
      /\b(intern|internship|fresher|entry.?level)\s*(job|position|role|opportunity)\b/i,
      /\b(apply|application)\s*(for|to)\s*(job|position|role)\b/i,
      /\bhiring|placement|recruit/i
    ],
    weakPatterns: [/\bjob\b/i, /\bopportunity\b/i, /\bwork\b/i, /\bcompany\b/i, /\brole\b/i, /\bposition\b/i],
    contextBoost: ['job', 'opportunity', 'apply', 'company', 'hiring'],
    chipKeywords: ['job', 'opportunity', 'opening', 'find jobs']
  },
  {
    intent: 'skill-gap',
    strongPatterns: [
      /\b(skill|skills)\s*(gap|gaps|missing|lacking|need|needed|required|improve)\b/i,
      /\bwhat\s*(skill|skills)\s*(do i|should i|am i|are)\s*(need|missing|lack|learn)\b/i,
      /\b(improve|develop|upgrade|upskill|reskill)\s*(my\s*)?(skill|skills)\b/i,
      /\b(missing|lacking|weak)\s*(in\s*)?(skill|skills|area|areas)\b/i,
      /\bskill\s*(analysis|assessment|evaluation|audit)\b/i,
      /\bwhat\s*(am i|do i)\s*(missing|lacking|need to learn)\b/i
    ],
    weakPatterns: [/\bskill\b/i, /\bimprove\b/i, /\blearn\b/i, /\bgap\b/i, /\bweak\b/i],
    contextBoost: ['skill', 'gap', 'improve', 'learn', 'missing'],
    chipKeywords: ['skill gap', 'missing skill', 'improve skill']
  },
  {
    intent: 'interview-prep',
    strongPatterns: [
      /\b(interview|interviews)\s*(prep|prepare|preparation|practice|tips|questions|help)\b/i,
      /\b(prepare|preparing|ready)\s*(for|me for)\s*(interview|interviews)\b/i,
      /\b(mock|practice)\s*interview\b/i,
      /\b(hr|technical|behavioral|coding)\s*(round|interview|questions)\b/i,
      /\bcrack\s*(the\s*)?(interview|interviews)\b/i,
      /\binterview\s*(question|questions|tips|advice)\b/i
    ],
    weakPatterns: [/\binterview\b/i, /\bquestion\b/i, /\bprepare\b/i],
    contextBoost: ['interview', 'prepare', 'question', 'round'],
    chipKeywords: ['interview', 'prep', 'preparation']
  },
  {
    intent: 'resume-review',
    strongPatterns: [
      /\b(resume|cv|profile)\s*(review|feedback|improve|check|analyze|tips|help)\b/i,
      /\b(review|improve|check|analyze)\s*(my\s*)?(resume|cv|profile)\b/i,
      /\bats\s*(friendly|optimize|score)\b/i,
      /\b(portfolio|linkedin)\s*(review|tips|improve)\b/i,
      /\bprofile\s*(completeness|score|improvement)\b/i
    ],
    weakPatterns: [/\bresume\b/i, /\bcv\b/i, /\bprofile\b/i, /\bportfolio\b/i],
    contextBoost: ['resume', 'cv', 'profile', 'review'],
    chipKeywords: ['resume', 'cv', 'profile', 'review']
  },
  {
    intent: 'learning-path',
    strongPatterns: [
      /\b(learning|study)\s*(path|roadmap|plan|journey)\b/i,
      /\b(roadmap|path)\s*(for|to)\s*(learn|become|career)\b/i,
      /\bwhat\s*(should i|to)\s*learn\b/i,
      /\b(how to|steps to)\s*become\s*(a\s*)?\w+/i,
      /\b(course|courses|tutorial|tutorials)\s*(recommend|suggestion|for me)\b/i,
      /\b(certification|certifications)\s*(path|roadmap|recommend)\b/i,
      /\b(6|3|12)\s*month\s*(plan|roadmap|learning)\b/i
    ],
    weakPatterns: [/\blearn\b/i, /\bcourse\b/i, /\broadmap\b/i, /\bpath\b/i, /\btutorial\b/i],
    contextBoost: ['learn', 'course', 'roadmap', 'study', 'certification'],
    chipKeywords: ['learning', 'roadmap', 'course', 'path']
  },
  {
    intent: 'career-guidance',
    strongPatterns: [
      /\b(career|careers)\s*(guidance|advice|path|direction|options|choice)\b/i,
      /\bwhat\s*(career|field|domain)\s*(should i|is best|suits)\b/i,
      /\b(career|job)\s*(switch|change|transition)\b/i,
      /\b(future|long.?term)\s*(career|growth|plan)\b/i,
      /\bwhich\s*(field|domain|industry|career)\b/i,
      /\b(best|right)\s*(career|path|field)\s*(for me|choice)\b/i
    ],
    weakPatterns: [/\bcareer\b/i, /\bfield\b/i, /\bdomain\b/i, /\bindustry\b/i, /\bguidance\b/i],
    contextBoost: ['career', 'guidance', 'path', 'future', 'growth'],
    chipKeywords: ['career', 'guidance', 'path', 'advice']
  },
  {
    intent: 'assessment-insights',
    strongPatterns: [
      /\b(assessment|test)\s*(result|results|insight|insights|score|scores)\b/i,
      /\b(my|explain)\s*(riasec|personality|aptitude)\b/i,
      /\b(riasec|big.?five|mbti)\s*(code|profile|result)\b/i,
      /\bwhat\s*(does|do)\s*(my\s*)?(assessment|test|riasec)\s*(mean|say|show)\b/i,
      /\b(psychometric|career)\s*test\b/i
    ],
    weakPatterns: [/\bassessment\b/i, /\btest\b/i, /\briasec\b/i, /\bpersonality\b/i],
    contextBoost: ['assessment', 'riasec', 'personality', 'test', 'result'],
    chipKeywords: ['assessment', 'riasec', 'personality', 'test']
  },
  {
    intent: 'application-status',
    strongPatterns: [
      /\b(application|applications)\s*(status|update|progress|tracking)\b/i,
      /\b(my|check)\s*(application|applications)\b/i,
      /\b(applied|application)\s*(job|jobs|status)\b/i,
      /\b(shortlist|reject|offer|interview)\s*(status|update)\b/i,
      /\bwhere\s*(are|is)\s*(my\s*)?(application|applications)\b/i
    ],
    weakPatterns: [/\bapplication\b/i, /\bapplied\b/i, /\bstatus\b/i],
    contextBoost: ['application', 'applied', 'status', 'shortlist'],
    chipKeywords: ['application', 'status', 'applied']
  },
  {
    intent: 'networking',
    strongPatterns: [
      /\b(network|networking)\s*(tips|advice|strategy|help)\b/i,
      /\b(linkedin|professional)\s*(tips|profile|network|connect)\b/i,
      /\b(cold|warm)\s*(email|outreach|message)\b/i,
      /\b(connect|reach out)\s*(with|to)\s*(professional|recruiter|mentor)\b/i,
      /\bmentorship\b/i, /\breferral\b/i
    ],
    weakPatterns: [/\bnetwork\b/i, /\blinkedin\b/i, /\bconnect\b/i],
    contextBoost: ['network', 'linkedin', 'connect', 'mentor'],
    chipKeywords: ['network', 'linkedin', 'connect']
  },
  {
    intent: 'course-progress',
    strongPatterns: [
      /\b(my|enrolled)\s*(course|courses|enrollment|enrollments)\b/i,
      /\b(course|courses)\s*(progress|status|enrolled)\b/i,
      /\bwhat\s*(course|courses)\s*(am i|have i)\s*(taking|enrolled|doing)\b/i,
      /\b(my|current)\s*(learning|training)\s*(progress|status)\b/i,
      /\bhow\s*(am i|is my)\s*(doing|progress)\s*(in|on)\s*(course|courses)\b/i
    ],
    weakPatterns: [/\benrolled\b/i, /\bprogress\b/i, /\btaking\b/i],
    contextBoost: ['enrolled', 'progress', 'course', 'learning'],
    chipKeywords: ['my course', 'enrolled', 'progress']
  },
  {
    intent: 'course-recommendation',
    strongPatterns: [
      /\b(recommend|suggest)\s*(me\s*)?(a\s*)?(course|courses|training)\b/i,
      /\bwhich\s*(course|courses)\s*(should i|to)\s*(take|enroll|do)\b/i,
      /\b(best|good)\s*(course|courses)\s*(for me|to learn)\b/i,
      /\b(course|courses)\s*(based on|for)\s*(assessment|skill gap|my)\b/i,
      /\b(new|next)\s*(course|courses)\s*(to|should)\b/i
    ],
    weakPatterns: [/\bcourse\b/i, /\brecommend\b/i, /\bsuggest\b/i, /\benroll\b/i],
    contextBoost: ['course', 'recommend', 'suggest', 'enroll'],
    chipKeywords: ['recommend course', 'suggest course']
  }
];

const GREETING_PATTERNS = [
  /^(hi|hello|hey|hii+|yo|sup|hola|namaste|good\s*(morning|afternoon|evening))[\s!.,]*$/i,
  /^(what'?s up|how are you|how's it going)[\s!?.,]*$/i
];


export function detectIntent(
  message: string, 
  chips: string[] = [], 
  conversationHistory: StoredMessage[] = []
): IntentScore {
  const lowerMessage = message.toLowerCase().trim();
  const scores: Record<CareerIntent, number> = {
    'find-jobs': 0,
    'skill-gap': 0,
    'interview-prep': 0,
    'resume-review': 0,
    'learning-path': 0,
    'career-guidance': 0,
    'assessment-insights': 0,
    'application-status': 0,
    'networking': 0,
    'course-progress': 0,
    'course-recommendation': 0,
    'general': 5
  };

  // Check for casual greetings first
  if (GREETING_PATTERNS.some(p => p.test(lowerMessage)) || lowerMessage.length < 5) {
    scores['general'] = 100;
    return { intent: 'general', score: 100, confidence: 'high' };
  }

  // Process each intent pattern
  for (const pattern of INTENT_PATTERNS) {
    // Strong pattern matches (+25 each)
    for (const regex of pattern.strongPatterns) {
      if (regex.test(message)) {
        scores[pattern.intent] += 25;
      }
    }

    // Weak pattern matches (+8 each)
    for (const regex of pattern.weakPatterns) {
      if (regex.test(message)) {
        scores[pattern.intent] += 8;
      }
    }

    // Chip matches (+40 each - highest priority)
    for (const chip of chips) {
      const lowerChip = chip.toLowerCase();
      if (pattern.chipKeywords.some(kw => lowerChip.includes(kw))) {
        scores[pattern.intent] += 40;
      }
    }

    // Context boost from conversation history (+12 each)
    if (conversationHistory.length > 0) {
      const lastMessages = conversationHistory.slice(-3);
      for (const msg of lastMessages) {
        const content = msg.content.toLowerCase();
        for (const keyword of pattern.contextBoost) {
          if (content.includes(keyword)) {
            scores[pattern.intent] += 12;
            break;
          }
        }
      }
    }
  }

  // Find top two intents
  const sortedIntents = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topIntent, topScore] = sortedIntents[0];
  const [secondIntent, secondScore] = sortedIntents[1];

  // Determine confidence
  let confidence: 'high' | 'medium' | 'low';
  if (topScore >= 50) {
    confidence = 'high';
  } else if (topScore >= 25) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  // If confidence is low and no clear winner, default to general
  if (confidence === 'low' && topScore < 15) {
    return { intent: 'general', score: 5, confidence: 'low' };
  }

  return {
    intent: topIntent as CareerIntent,
    score: topScore,
    confidence,
    secondaryIntent: secondScore > 15 ? secondIntent as CareerIntent : undefined
  };
}

// Alias for backward compatibility
export { detectIntent as detectIntentV2 };
