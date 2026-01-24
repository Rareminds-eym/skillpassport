/**
 * Test Suite: All Grade Levels Validation
 * Tests after10, after12, and college grade levels
 */

import { describe, it, expect } from 'vitest';

// Mock responses for different grade levels
const mockResponses = {
  after10: {
    valid: `**Career Assessment Analysis**

**RIASEC Profile:**
- Realistic: 75
- Investigative: 82
- Artistic: 45
- Social: 68
- Enterprising: 55
- Conventional: 60

**Stream Recommendation:** Science
**Reasoning:** Strong investigative and realistic scores indicate aptitude for scientific inquiry.

**Career Clusters:**
1. Engineering & Technology - High match due to investigative nature
2. Healthcare & Medicine - Strong analytical skills
3. Research & Development - Excellent problem-solving abilities`,
    
    invalid: `Career interests show science preference.
RIASEC: R-75, I-82, A-45, S-68, E-55, C-60
Recommended: Science stream`
  },

  after12: {
    valid: `**Career Assessment Analysis**

**RIASEC Profile:**
- Realistic: 70
- Investigative: 88
- Artistic: 40
- Social: 65
- Enterprising: 58
- Conventional: 62

**Field Recommendation:** Computer Science & Engineering
**Reasoning:** Exceptional investigative scores combined with realistic traits suggest strong fit for technical fields.

**Career Clusters:**
1. Software Development - Perfect match for analytical mindset
2. Data Science & AI - Strong problem-solving capabilities
3. Cybersecurity - Technical aptitude and attention to detail`,

    invalid: `Student should pursue Compu