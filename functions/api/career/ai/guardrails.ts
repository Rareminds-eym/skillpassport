// Career AI Guardrails - Safety Module

export interface GuardrailResult {
  passed: boolean;
  reason?: string;
  sanitizedInput?: string;
  flags: string[];
}

// Prompt injection patterns to detect
const INJECTION_PATTERNS = [
  /ignore\s*(all\s*)?(previous|above|prior)\s*(instruction|prompt|rule)/i,
  /disregard\s*(all\s*)?(previous|above|prior)/i,
  /forget\s*(everything|all|your)\s*(instruction|rule|prompt)/i,
  /you\s*are\s*now\s*(a|an)\s*\w+/i,
  /pretend\s*(you\s*are|to\s*be)/i,
  /act\s*as\s*(if|a|an)/i,
  /new\s*instruction/i,
  /system\s*prompt/i,
  /\[system\]/i,
  /<\/?system>/i,
  /jailbreak/i,
  /bypass\s*(filter|safety|restriction)/i,
  /reveal\s*(your|the)\s*(prompt|instruction|system)/i
];

// Harmful content patterns
const HARMFUL_PATTERNS = [
  /\b(hack|exploit|attack|ddos|malware|virus|trojan)\b/i,
  /\b(illegal|fraud|scam|phishing)\b/i,
  /\b(weapon|bomb|explosive|drug)\b/i,
  /\b(suicide|self.?harm|kill\s*yourself)\b/i,
  /\b(hate|racist|sexist|discriminat)\b/i
];

// PII patterns to redact
const PII_PATTERNS = [
  { pattern: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, replacement: '[NAME]', name: 'name' },
  { pattern: /\b\d{10,12}\b/g, replacement: '[PHONE]', name: 'phone' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]', name: 'email' },
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[CARD]', name: 'card' },
  { pattern: /\b[A-Z]{5}\d{4}[A-Z]\b/g, replacement: '[PAN]', name: 'pan' },
  { pattern: /\b\d{12}\b/g, replacement: '[AADHAAR]', name: 'aadhaar' }
];

// Off-topic patterns
const OFF_TOPIC_PATTERNS = [
  /\b(weather|recipe|cook|movie|music|game|sport|politics|religion)\b/i,
  /\b(joke|funny|laugh|entertainment)\b/i,
  /\b(relationship|dating|love|romance)\b/i,
  /\b(medical|health|doctor|symptom|disease)\b/i,
  /\b(legal|lawyer|court|lawsuit)\b/i
];

// Career-related keywords
const CAREER_KEYWORDS = [
  'job', 'career', 'skill', 'resume', 'cv', 'interview', 'salary', 'company',
  'work', 'employment', 'internship', 'course', 'learn', 'certification',
  'profile', 'experience', 'project', 'portfolio', 'linkedin', 'network',
  'assessment', 'riasec', 'personality', 'aptitude', 'guidance', 'advice',
  'opportunity', 'application', 'hire', 'recruit', 'fresher', 'graduate'
];

export function detectPromptInjection(input: string): GuardrailResult {
  const flags: string[] = [];
  
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      flags.push('prompt_injection');
      return {
        passed: false,
        reason: 'Your message contains patterns that look like an attempt to manipulate the AI. Please rephrase your question.',
        flags
      };
    }
  }
  
  return { passed: true, flags };
}

export function detectHarmfulContent(input: string): GuardrailResult {
  const flags: string[] = [];
  
  for (const pattern of HARMFUL_PATTERNS) {
    if (pattern.test(input)) {
      flags.push('harmful_content');
      return {
        passed: false,
        reason: 'I can only help with career-related questions. Please ask about jobs, skills, interviews, or career guidance.',
        flags
      };
    }
  }
  
  return { passed: true, flags };
}


export function redactPII(input: string): { sanitized: string; redacted: string[] } {
  let sanitized = input;
  const redacted: string[] = [];
  
  for (const { pattern, replacement, name } of PII_PATTERNS) {
    const matches = sanitized.match(pattern);
    if (matches) {
      redacted.push(name);
      sanitized = sanitized.replace(pattern, replacement);
    }
  }
  
  return { sanitized, redacted };
}

export function isCareerRelated(input: string): boolean {
  const lowerInput = input.toLowerCase();
  const hasCareerKeyword = CAREER_KEYWORDS.some(kw => lowerInput.includes(kw));
  if (hasCareerKeyword) return true;
  const isOffTopic = OFF_TOPIC_PATTERNS.some(pattern => pattern.test(input));
  if (input.length < 20) return true;
  return !isOffTopic;
}

export function validateResponse(response: string): GuardrailResult {
  const flags: string[] = [];
  
  const systemLeakPatterns = [
    /<system>/i,
    /\[system\]/i,
    /my instructions are/i,
    /i was programmed to/i,
    /my system prompt/i
  ];
  
  for (const pattern of systemLeakPatterns) {
    if (pattern.test(response)) {
      flags.push('system_leak');
      return { passed: false, reason: 'Response validation failed', flags };
    }
  }
  
  for (const pattern of HARMFUL_PATTERNS) {
    if (pattern.test(response)) {
      flags.push('harmful_response');
      return { passed: false, reason: 'Response contains inappropriate content', flags };
    }
  }
  
  if (response.length < 10) flags.push('too_short');
  
  const words = response.split(/\s+/);
  const uniqueWords = new Set(words);
  if (words.length > 50 && uniqueWords.size / words.length < 0.3) {
    flags.push('repetitive');
  }
  
  return { passed: true, flags };
}

export function runGuardrails(input: string): GuardrailResult {
  const allFlags: string[] = [];
  
  const injectionCheck = detectPromptInjection(input);
  if (!injectionCheck.passed) return injectionCheck;
  allFlags.push(...injectionCheck.flags);
  
  const harmfulCheck = detectHarmfulContent(input);
  if (!harmfulCheck.passed) return harmfulCheck;
  allFlags.push(...harmfulCheck.flags);
  
  const { sanitized, redacted } = redactPII(input);
  if (redacted.length > 0) {
    allFlags.push(...redacted.map(r => `pii_${r}`));
  }
  
  if (!isCareerRelated(input)) {
    allFlags.push('off_topic');
  }
  
  return { passed: true, sanitizedInput: sanitized, flags: allFlags };
}

export function getBlockedResponse(reason: string): string {
  const responses: Record<string, string> = {
    prompt_injection: "I'm here to help with your career questions! Please ask about jobs, skills, interviews, or career guidance. 🎯",
    harmful_content: "I can only assist with career-related topics. How can I help with your job search, skill development, or career planning? 💼",
    off_topic: "That's outside my expertise! I'm your Career AI assistant - I can help with job matching, skill analysis, interview prep, and career guidance. What would you like to explore? 🚀",
    default: "I'm here to help with your career journey! Ask me about jobs, skills, courses, or career advice. 😊"
  };
  return responses[reason] || responses.default;
}
