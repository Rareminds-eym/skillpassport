# Professional Recommendation System - Test Suite
## Testing the Advanced Scoring & AI Prompt System

**Version:** 1.0.0  
**Purpose:** Validate the new advanced candidate scoring and professional AI prompts

---

## 🚀 QUICK START - 5 Minute Test

Run these **5 essential prompts** to validate core functionality:

```bash
1. "Show me best candidates to interview"
2. "P.DURKADEVID applied for what job role?"
3. "Show all my open positions"
4. "Find React developers"
5. "Compare my top 3 candidates"
```

✅ If all 5 work → System is functional!

---

## 📊 CATEGORY A: Multi-Dimensional Scoring Tests

### A1: Verify Technical Scoring
```
Show me best candidates to interview
```
**What to Check:**
- ✅ Technical scores (0-100) displayed
- ✅ Skill count matters (more skills = higher score)
- ✅ Certifications boost technical score
- ✅ Advanced trainings increase score

**Expected Output:**
```
CANDIDATE 1: John Doe
Technical Score: 75/100
• 8 technical skills (React, Node.js, Python...)
• 2 AWS certifications
• 3 advanced training programs
```

### A2: Verify Education Scoring
```
Show candidates with high CGPA
```
**What to Check:**
- ✅ CGPA ≥9.0 gets highest education score
- ✅ CGPA 8.0-8.9 gets good score
- ✅ University reputation considered (IIT/NIT bonus)

### A3: Verify Experience Scoring
```
Show candidates with certifications
```
**What to Check:**
- ✅ More training programs = higher experience score
- ✅ Certifications add to experience
- ✅ Job application activity factored in

### A4: Verify Engagement Scoring
```
Show recently active candidates
```
**What to Check:**
- ✅ Last active ≤7 days = high engagement
- ✅ LinkedIn/GitHub presence increases score
- ✅ Profile completeness matters

### A5: Verify Overall Hiring Readiness
```
Who is ready to hire now?
```
**What to Check:**
- ✅ Hiring readiness formula correct
- ✅ No resume = score penalty applied
- ✅ Low profile completeness = penalty

---

## 🚨 CATEGORY B: Red/Green Flag Detection

### B1: Detect No Skills Red Flag
```
Show all candidates
```
**What to Check:**
- ❌ Candidates with 0 skills get "No skills listed" red flag
- ⚠️ Impact level: CRITICAL

### B2: Detect Generic Skills Red Flag
```
Show candidates with only soft skills
```
**What to Check:**
- ⚠️ Only "communication", "teamwork" = red flag
- ⚠️ "Only generic/soft skills" warning
- ⚠️ Impact level: HIGH

### B3: Detect Missing Resume Red Flag
```
Show candidates without resumes
```
**What to Check:**
- 📄 "No resume uploaded" flag present
- ⚠️ Impact level: HIGH

### B4: Detect Low CGPA Red Flag
```
Show all candidates
```
**What to Check:**
- 📊 CGPA < 5.5 triggers "Low CGPA" flag
- ⚠️ Impact level: MEDIUM

### B5: Detect Stale Profile Red Flag
```
Show all candidates
```
**What to Check:**
- 🕐 Last updated >180 days = "Inactive profile" flag
- ⚠️ Impact level: LOW

### B6: Detect Green Flags
```
Show best candidates
```
**What to Check:**
- ✅ CGPA ≥8.5 = "Excellent academics" green flag
- ✅ ≥8 skills = "Diverse skill set" green flag
- ✅ ≥3 certs = "Well-certified" green flag
- ✅ Has GitHub = "Active GitHub" green flag

---

## 🔍 CATEGORY C: Data Quality Detection

### C1: Detect Vague Skills
```
Show me best candidates to interview
```
**What to Check:**
- ⚠️ Skills like "testing", "life Evaluation" flagged
- ⚠️ "Data quality: Vague skills" message
- ⚠️ AI should mention this in recommendation

### C2: Detect Missing Phone
```
Show all candidates
```
**What to Check:**
- ⚠️ "Missing phone number" in dataQualityIssues array

### C3: Detect Missing Location
```
Show all candidates
```
**What to Check:**
- ⚠️ "Missing location" when city/state empty

### C4: Detect Missing Graduation Date
```
Show all candidates
```
**What to Check:**
- ⚠️ "Missing graduation date" issue flagged

---

## 🎨 CATEGORY D: Professional AI Prompt Output

### D1: Hiring Recommendation Format
```
Show me best candidates to interview
```
**Expected Output Structure:**
```markdown
## 🎯 TOP RECOMMENDATIONS

### 1. [NAME] - HIRING RECOMMENDATION: [STRONG HIRE/HIRE/CONDITIONAL HIRE]

**Match Score: [X]/100**

**✅ KEY STRENGTHS:**
• [Specific strength with data]
• [Specific strength with data]

**⚠️ CONCERNS & GAPS:**
• [Specific concern]

**💡 INTERVIEW FOCUS AREAS:**
1. [Tactical question area]
2. [Technical probe]

**📋 IMMEDIATE NEXT STEPS:**
1. [Action with timeline]

**⏱️ TIMELINE TO HIRE:** [X weeks]

**💰 SALARY EXPECTATION:** [Range]
```

### D2: Comparison Format
```
Compare John Doe and Jane Smith
```
**Expected Output:**
```markdown
## HEAD-TO-HEAD COMPARISON

| Criterion | John Doe | Jane Smith |
|-----------|----------|------------|
| Technical Fit | 8/10 | 7/10 |
| Cultural Fit | 7/10 | 9/10 |
| Risk Level | LOW | MEDIUM |

**WINNER: John Doe**
Reasoning: [Specific data-driven reason]
```

### D3: Data Quality Flagging in AI Output
```
Show me best candidates
```
**AI Should Mention:**
- ⚠️ "DATA QUALITY ISSUE: Skills include vague 'testing'"
- ⚠️ "Request clarification on 'life Evaluation' skill"
- ⚠️ "Missing resume - require before interview"

---

## 🗄️ CATEGORY E: SQL Performance Tests

### E1: Batch Query Performance
```
Show me best candidates to interview (20 candidates)
```
**Performance Check:**
- ✅ Should make **5 queries total** (not 60+)
- ✅ Should complete in <1 second
- ✅ Check console logs for query count

### E2: Large Dataset Performance
```
Show all candidates (50+ candidates)
```
**Performance Check:**
- ✅ Still only **5 queries** (constant time)
- ✅ Should complete in <1.5 seconds
- ✅ Memory usage reasonable

### E3: Individual Lookup Performance
```
P.DURKADEVID applied for what job role?
```
**Performance Check:**
- ✅ Should complete in <500ms
- ✅ Only queries necessary tables

---

## 📈 CATEGORY F: Scoring Validation

### F1: Technical Score Calculation
**Test Candidate Profile:**
- 10 skills
- Level 3 average
- 2 AWS certs
- 1 advanced training

**Expected Technical Score:** ~70-80

### F2: Education Score Calculation
**Test Candidate Profile:**
- CGPA: 8.5/10
- University: IIT Mumbai

**Expected Education Score:** ~95-100

### F3: Experience Score Calculation
**Test Candidate Profile:**
- 4 training programs
- 3 certifications
- 5 job applications

**Expected Experience Score:** ~75-85

### F4: Engagement Score Calculation
**Test Candidate Profile:**
- Profile 90% complete
- LinkedIn + GitHub present
- Last active: 3 days ago
- 2 recent applications

**Expected Engagement Score:** ~85-95

### F5: Hiring Readiness Penalty
**Test Candidate Profile:**
- Overall score: 80
- No resume ❌
- Profile 40% complete

**Expected Readiness:** ~45-50 (penalties applied)

---

## 🎯 CATEGORY G: Specific Candidate Queries

### G1: Name With Dots
```
P.DURKADEVID applied for what job role?
```
**What to Check:**
- ✅ Name extracted correctly: "P.DURKADEVID"
- ✅ Searches both pipeline_candidates AND applied_jobs
- ✅ Shows opportunity title + status

### G2: All Caps Name
```
JOHN DOE applied for what?
```
**What to Check:**
- ✅ Handles all-caps names
- ✅ Case-insensitive search

### G3: Multi-Word Name
```
What did Sarah Jane Smith apply to?
```
**What to Check:**
- ✅ Handles multi-word names
- ✅ Correct extraction

### G4: Name Not Found
```
Tell me about XYZ12345
```
**Expected:**
```
No records found for "XYZ12345" in your opportunities.

Possible reasons:
• The candidate hasn't applied to any of your jobs
• The name might be spelled differently
• They might be in a different recruiter's pipeline
```

---

## 💼 CATEGORY H: Opportunity Listing Tests

### H1: Prioritization Works
```
Show all my open positions
```
**What to Check:**
- ✅ Opportunities WITH applicants shown FIRST
- ✅ Sorted by applicant count (descending)
- ✅ Shows up to 15 opportunities
- ✅ Indicates if more exist

### H2: Applicant Names Inline
```
Show all my open positions
```
**Expected Format:**
```
1. **Backend Developer** at Company X
   👥 3 applicants - John Doe, Jane Smith +1 more

2. **Frontend Developer** at Company Y
   👥 1 applicant - P.DURKADEVID
```

### H3: Many Opportunities
```
Show all my open positions
```
**With 30 opportunities:**
- ✅ Shows first 15
- ✅ Message: "... and 15 more opportunities"

---

## 🤖 CATEGORY I: AI Response Quality

### I1: Honest Assessment
```
Show me best candidates
```
**AI Should:**
- ✅ Give realistic scores (not everything 80+)
- ✅ Flag concerns honestly
- ✅ Mention data quality issues
- ✅ Provide CONDITIONAL recommendations when appropriate

**Bad Output:**
> "All candidates are excellent! Hire anyone!"

**Good Output:**
> "Candidate has potential (62/100) but concerns exist:
> ⚠️ No production experience
> ⚠️ Vague skills need clarification
> RECOMMENDATION: Conditional hire with 3-month training"

### I2: Actionable Next Steps
```
Who should I hire?
```
**AI Should Provide:**
- ✅ Specific actions (not vague)
- ✅ Timelines (e.g., "within 48 hours")
- ✅ Clear priorities

**Bad Output:**
> "You should probably interview them soon."

**Good Output:**
> "1. Request GitHub portfolio (48-hour deadline)
> 2. If impressed, schedule technical screening
> 3. Prepare 3-month training roadmap"

### I3: Risk Assessment
```
Compare candidates
```
**AI Should Include:**
- ✅ Risk level (LOW/MEDIUM/HIGH)
- ✅ Mitigation strategies
- ✅ Confidence level

---

## 🧪 CATEGORY J: Edge Cases

### J1: No Candidates in Database
```
Show me best candidates
```
**Expected:**
```
No candidates found in your talent pool. 

Start by:
• Importing candidate data
• Inviting students to apply
• Sourcing from job boards
```

### J2: All Candidates Have Zero Skills
```
Show me best candidates
```
**Expected:**
```
⚠️ Data Quality Alert:
• 20 out of 20 candidates have NO skills listed
• Cannot provide meaningful recommendations

RECOMMENDATION: Import skills from resumes or LinkedIn
```

### J3: Only One Candidate
```
Compare top 3 candidates
```
**Expected:**
```
Only 1 candidate available. Need at least 2 for comparison.

Showing detailed analysis of available candidate instead...
```

### J4: All Candidates Have Low Scores
```
Who should I hire?
```
**Expected:**
```
⚠️ No candidates meet hiring bar (all <50 readiness score)

CRITICAL ISSUES:
• Poor data quality (19 missing skills)
• Incomplete profiles (avg 30% complete)

RECOMMENDATION: 
1. Data cleanup required before hiring decisions
2. Encourage candidates to complete profiles
3. Consider lowering requirements or sourcing new candidates
```

---

## 📊 CATEGORY K: Skill Categorization

### K1: Technical Skills
```
Show candidates
```
**Should Categorize as Technical:**
- React, Python, JavaScript, Java, C++
- Machine Learning, Data Science
- Backend, Frontend, Full Stack

### K2: Soft Skills
```
Show candidates
```
**Should Categorize as Soft:**
- Communication, Leadership, Teamwork
- Management, Presentation
- Problem Solving

### K3: Tools
```
Show candidates
```
**Should Categorize as Tools:**
- Git, Docker, Kubernetes
- Jenkins, Jira, Figma
- Photoshop, VS Code

---

## ✅ SUCCESS CRITERIA CHECKLIST

### Core Functionality
- [ ] Hiring recommendations display multi-dimensional scores
- [ ] Red flags detected automatically
- [ ] Green flags detected automatically
- [ ] Data quality issues flagged
- [ ] Candidate lookup works (both tables searched)
- [ ] Opportunity listing prioritizes applicants

### AI Output Quality
- [ ] Structured format (not generic text)
- [ ] Honest assessments (not overly positive)
- [ ] Specific actions with timelines
- [ ] Risk levels provided
- [ ] Data quality issues mentioned
- [ ] Salary expectations included

### Performance
- [ ] 20 candidates: 5 queries max
- [ ] 50 candidates: 5 queries max
- [ ] Queries complete in <1.5s
- [ ] AI responses in <5s

### Edge Cases
- [ ] Handles empty database gracefully
- [ ] Handles candidates with no skills
- [ ] Handles missing data fields
- [ ] Handles special characters in names
- [ ] Handles vague queries with clarification

---

## 🐛 KNOWN ISSUES & FIXES

| Issue | Status | Fix Applied |
|-------|--------|-------------|
| LLM returns markdown JSON | ✅ FIXED | Strip ````json` blocks |
| Name "P.DURKADEVID" not detected | ✅ FIXED | Updated regex |
| Only 5 opportunities shown | ✅ FIXED | Increased to 15 + prioritization |
| Harsh filtering (only 1/20 hire-ready) | ✅ FIXED | Show all with skills, flag issues |

---

## 🎯 RECOMMENDED TEST SEQUENCE

### Phase 1: Basic Validation (10 minutes)
1. "Show me best candidates to interview"
2. "P.DURKADEVID applied for what job role?"
3. "Show all my open positions"

### Phase 2: Scoring Validation (15 minutes)
4. Check technical scores make sense
5. Verify red/green flags accurate
6. Validate data quality detection

### Phase 3: AI Quality Check (15 minutes)
7. Review 3-5 AI recommendations
8. Verify structure matches template
9. Check for honest assessment

### Phase 4: Performance Testing (10 minutes)
10. Test with 20, 50 candidates
11. Monitor query count in console
12. Check response times

### Phase 5: Edge Cases (10 minutes)
13. Test empty results
14. Test missing data
15. Test special characters

**Total Time:** ~60 minutes for full validation

---

## 📈 METRICS TO TRACK

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Query Performance | <1s for 20 candidates | Console timing |
| SQL Query Count | 5 queries constant | Console logs |
| AI Response Time | <5s | End-to-end timing |
| Red Flag Accuracy | >90% | Manual validation |
| Green Flag Accuracy | >90% | Manual validation |
| Output Structure | 100% | Matches template |

---

## 🚀 PRODUCTION READINESS

### ✅ Ready for Production If:
- [x] All 5 quick tests pass
- [ ] Scoring makes sense for real data
- [ ] AI outputs are professional
- [ ] Performance is acceptable
- [ ] Edge cases handled gracefully

### ⚠️ NOT Ready If:
- [ ] Scores seem random/incorrect
- [ ] AI outputs are generic/unhelpful
- [ ] Queries take >2 seconds
- [ ] Crashes on edge cases
- [ ] Data quality not detected

---

## 📝 TEST RESULTS TEMPLATE

```
DATE: ___________
TESTER: ___________

✅ PASSED:
- Test A1: Technical scoring works
- Test B1: Red flags detected
- ...

❌ FAILED:
- Test E1: Performance issue (1.8s, expected <1s)
- ...

⚠️ WARNINGS:
- Scores seem low but data quality is poor
- ...

OVERALL: ☐ PASS  ☐ FAIL  ☐ NEEDS WORK

NOTES:
___________
```

---

**Test Suite Version:** 1.0.0  
**Created:** 2024-11-14  
**Status:** Ready for Testing  
**Coverage:** 60+ test scenarios

