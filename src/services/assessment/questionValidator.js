/**
 * Question Validation Module
 * Validates question structure and quality for career assessments
 */

/**
 * Validate a generated question meets quality standards
 * @param {Object} question - Question object to validate
 * @param {string} questionType - 'aptitude' or 'knowledge'
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validateQuestion(question, questionType) {
  const errors = [];
  const autoFixes = [];
  
  // Auto-fix: Normalize question text field
  if (!question.text && question.question) {
    question.text = question.question;
    autoFixes.push('Normalized question text field');
  } else if (question.text && !question.question) {
    question.question = question.text;
  }
  
  // Check required fields
  if (!question.text && !question.question) {
    errors.push('Missing question text');
  }
  
  const questionText = question.text || question.question || '';
  
  // More lenient text length validation - only reject if critically short or absurdly long
  if (questionText.length < 5) {
    errors.push(`Question text too short: ${questionText.length} characters`);
  } else if (questionText.length > 1000) {
    errors.push(`Question text too long: ${questionText.length} characters`);
  } else if (questionText.length < 10) {
    // Warn but don't reject
    autoFixes.push(`Question text is short (${questionText.length} chars) but acceptable`);
  }
  
  // Check options
  if (!question.options || !Array.isArray(question.options)) {
    errors.push('Missing or invalid options array');
  } else {
    // Clerical questions have 2 options (Same/Different), all others have 4
    // Check by category/subtype OR by detecting Same/Different options
    const hasSameDifferentOptions = question.options.length === 2 &&
      question.options.some(opt => String(opt).trim().toLowerCase() === 'same') &&
      question.options.some(opt => String(opt).trim().toLowerCase() === 'different');
    
    const isClericalQuestion = question.subtype === 'clerical' || 
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
  let correctAnswer = question.correct || question.correct_answer;
  if (!correctAnswer) {
    errors.push('Missing correct answer');
  } else {
    // Check if this is a clerical question (2 options: Same/Different)
    // Check by category/subtype OR by detecting Same/Different options
    const hasSameDifferentOptions = question.options && question.options.length === 2 &&
      question.options.some(opt => String(opt).trim().toLowerCase() === 'same') &&
      question.options.some(opt => String(opt).trim().toLowerCase() === 'different');
    
    const isClericalQuestion = question.subtype === 'clerical' || 
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
            console.warn(`⚠️ Clerical question has unclear second option, defaulting to "Different"`);
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
        const optionIndex = question.options.findIndex(opt => {
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
    // Auto-fix: Try to infer category from other fields
    if (question.skill_tag) {
      const inferredCategory = question.skill_tag.split('_')[0];
      question.category = inferredCategory;
      autoFixes.push(`Inferred category "${inferredCategory}" from skill_tag`);
    } else if (question.moduleTitle) {
      // Try to extract from moduleTitle like "A) Verbal Reasoning"
      const match = question.moduleTitle.match(/\b(verbal|numerical|abstract|spatial|clerical)\b/i);
      if (match) {
        question.category = match[1].toLowerCase();
        autoFixes.push(`Inferred category "${question.category}" from moduleTitle`);
      } else {
        // Default to 'verbal' as fallback
        question.category = 'verbal';
        autoFixes.push('Assigned default category "verbal" (no category info found)');
      }
    } else {
      // Default to 'verbal' as fallback
      question.category = 'verbal';
      autoFixes.push('Assigned default category "verbal" (no category info found)');
    }
  }
  
  // Log auto-fixes if any
  if (autoFixes.length > 0) {
    console.log(`🔧 Auto-fixed question ${question.id || 'unknown'}:`, autoFixes);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    autoFixed: autoFixes.length > 0
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
  let autoFixedCount = 0;
  
  questions.forEach((q, idx) => {
    const validation = validateQuestion(q, questionType);
    if (validation.isValid) {
      valid.push(q);
      if (validation.autoFixed) {
        autoFixedCount++;
      }
    } else {
      console.warn(`❌ Question ${idx + 1} failed validation:`, validation.errors);
      console.warn(`   Question text: ${q.text || q.question || 'N/A'}`);
      console.warn(`   Category: ${q.category || q.subtype || 'N/A'}`);
      console.warn(`   Options count: ${q.options?.length || 0}`);
      console.warn(`   Correct answer: ${q.correct || q.correct_answer || 'N/A'}`);
      invalid.push({ question: q, errors: validation.errors });
    }
  });
  
  const needsMore = valid.length < expectedCount;
  
  console.log(`📊 Validation results: ${valid.length}/${expectedCount} valid, ${invalid.length} invalid${autoFixedCount > 0 ? `, ${autoFixedCount} auto-fixed` : ''}`);
  
  if (invalid.length > 0) {
    console.warn(`⚠️ ${invalid.length} questions failed validation. Common issues:`);
    const errorCounts = {};
    invalid.forEach(({ errors }) => {
      errors.forEach(err => {
        errorCounts[err] = (errorCounts[err] || 0) + 1;
      });
    });
    Object.entries(errorCounts).forEach(([error, count]) => {
      console.warn(`   - ${error}: ${count} questions`);
    });
  }
  
  return { valid, invalid, needsMore, autoFixedCount };
}
