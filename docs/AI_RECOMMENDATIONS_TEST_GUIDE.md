# AI Candidate Recommendations - Test & Validation Guide

## Quick Start Testing

### **Setup Test Data**

To properly test the AI recommendations, you need candidates with varying skill levels and certifications.

---

## Test Scenarios

### **Scenario 1: High-Quality Match (≥75%)**

**Goal**: Verify system recommends strong candidates with HIGH confidence.

#### **Test Case 1.1: Perfect Match**
```
Create a candidate with:
- Skills: JavaScript, React, TypeScript, Node.js, MongoDB, Git (matches 6/6)
- Training: 3+ programs
- Certifications: "Meta React Developer", "Node.js Certified Developer"
- CGPA: 8.5+

Job Position: Full-Stack Developer
Required Skills: JavaScript, React, TypeScript, Node.js, MongoDB, Git

Expected Result:
✅ Match Score: 85-100%
✅ Confidence: HIGH 🎯
✅ Badge: "Top Pick" (if #1)
✅ Action: "🚀 Move to Interview"
✅ Reasons: "6/6 required skills matched", "Relevant certifications: Meta React Developer, Node.js Certified Developer"
✅ Background: Green (bg-green-50)
```

**How to Verify:**
1. Create candidate in system
2. Have them apply to Full-Stack Developer position
3. Refresh `/recruitment/requisition/applicants`
4. Check AI Recommendations panel appears
5. Verify match score ≥75%
6. Verify "High" confidence badge

---

### **Scenario 2: Medium-Quality Match (55-74%)**

**Goal**: Verify system identifies trainable candidates with gaps.

#### **Test Case 2.1: Good Potential**
```
Create a candidate with:
- Skills: Python, Django, PostgreSQL (matches 3/6)
- Training: 4 programs
- Certifications: "Python for Data Science", "Django Web Framework"
- CGPA: 7.8

Job Position: Full-Stack Python Developer
Required Skills: Python, Django, PostgreSQL, Docker, AWS, Redis

Expected Result:
✅ Match Score: 60-74%
✅ Confidence: MEDIUM ⭐
✅ Action: "📞 Screen Candidate"
✅ Reasons: "3/6 required skills matched", "4 training programs completed", "Relevant certifications: Python for Data Science, Django Web Framework"
✅ Background: Amber (bg-amber-50)
```

---

### **Scenario 3: Low-Quality Match (21-54%)**

**Goal**: Verify system flags weak candidates appropriately.

#### **Test Case 3.1: Significant Gaps**
```
Create a candidate with:
- Skills: HTML, CSS, Testing (matches 1/6)
- Training: 0 programs
- Certifications: "Basic HTML/CSS Certificate"
- CGPA: 6.5

Job Position: Senior Software Engineer
Required Skills: Java, Spring Boot, Microservices, Kubernetes, Docker, AWS

Expected Result:
✅ Match Score: 25-40%
✅ Confidence: LOW 📋
✅ Badge: "Weak Match"
✅ Action: "👀 Review Profile" or "⚠️ Not Recommended"
✅ Reasons: "1/6 required skills matched", "1 certifications (not role-specific)"
✅ Background: Gray (bg-gray-50)
✅ Warning Banner: "⚠️ Limited Match Quality"
```

---

### **Scenario 4: Very Poor Match (≤20%)**

**Goal**: Verify filtering works - candidate should NOT appear.

#### **Test Case 4.1: Wrong Role Entirely**
```
Create a candidate with:
- Skills: Accounting, Excel, QuickBooks
- Training: 0 programs
- Certifications: "CPA Preparation Course"
- CGPA: 7.0

Job Position: Software Engineer
Required Skills: JavaScript, React, Node.js, AWS, Docker, Git

Expected Result:
✅ Match Score: <20%
✅ Shown in Recommendations: NO
✅ Empty State: "No Strong Matches Found" (if only candidate)
✅ Message: "Analyzed 1 applicant, but none scored above 20%"
```

---

## Certificate Relevance Testing

### **Test Case 5.1: Relevant Certificates**

```
Job: UX/UI Designer
Candidate Certificates:
1. "Google UX Design Professional Certificate"
2. "Interaction Design Foundation - User Research"

Expected:
✅ Both certificates matched
✅ Display: "Relevant certifications: Google UX Design Professional Certificate, Interaction Design Foundation - User Research"
✅ Cert Bonus: +10 points
```

---

### **Test Case 5.2: Irrelevant Certificates**

```
Job: Product Manager
Candidate Certificates:
1. "AWS Certified Cloud Practitioner"
2. "Google Data Analytics Professional Certificate"

Expected:
✅ 0 certificates matched
✅ Display: "2 certifications (not role-specific)"
✅ Cert Bonus: +0 points
```

---

### **Test Case 5.3: Partial Relevance**

```
Job: Data Analyst
Candidate Certificates:
1. "Google Data Analytics Professional Certificate" ✅
2. "Photography Masterclass" ❌

Expected:
✅ 1 certificate matched
✅ Display: "Relevant certifications: Google Data Analytics Professional Certificate"
✅ Cert Bonus: +5 points
```

---

### **Test Case 5.4: Universal Certificates**

```
Job: Any Role
Candidate Certificates:
1. "Certified Scrum Master (CSM)"
2. "Leadership Excellence Program"

Expected:
✅ Both certificates matched (universal methodologies)
✅ Display: "Relevant certifications: Certified Scrum Master (CSM), Leadership Excellence Program"
✅ Cert Bonus: +10 points
```

---

## Skills Matching Testing

### **Test Case 6.1: Exact Match**
```
Required: ["JavaScript", "React", "Node.js"]
Candidate: ["JavaScript", "React", "Node.js"]
Expected: 3/3 matched (100% skill match)
```

### **Test Case 6.2: Fuzzy Match**
```
Required: ["JavaScript", "React"]
Candidate: ["JS", "ReactJS"]
Expected: 2/2 matched (fuzzy matching works)
```

### **Test Case 6.3: Suffix Normalization**
```
Required: ["Test"]
Candidate: ["Testing"]
Expected: 1/1 matched (normalized to "test")
```

### **Test Case 6.4: No Match**
```
Required: ["JavaScript", "React"]
Candidate: ["Python", "Django"]
Expected: 0/2 matched (0% skill match)
```

---

## Edge Cases

### **Test Case 7.1: No Skills Required**
```
Job has empty skills_required: []
Expected: 
- Skill score defaults to 50%
- Candidate still gets profile/training/cert bonuses
- Match score based on profile quality only
```

### **Test Case 7.2: Candidate Has No Skills**
```
Candidate has 0 skills in profile
Expected:
- Skill score = 0 points
- May still have profile/training/cert bonuses
- Likely scores <20% (filtered out)
```

### **Test Case 7.3: No Applicants**
```
No one has applied to the job
Expected:
- No AI recommendation panel shown
- Standard applicants list view
```

### **Test Case 7.4: Multiple Applications (Same Candidate)**
```
Candidate applies to 3 different positions
Expected:
- 3 separate match scores calculated
- Each position analyzed independently
- Recommendations show best-fit position first
```

---

## UI/UX Validation

### **Visual Checks**

#### **High Confidence (Green)**
- [ ] Background: Light green (bg-green-50)
- [ ] Border: Green (border-green-200)
- [ ] Badge: Green with 🎯 icon
- [ ] Action Button: Gradient blue (prominent)
- [ ] "Top Pick" badge shows (if #1 and ≥70%)

#### **Medium Confidence (Amber)**
- [ ] Background: Light amber (bg-amber-50)
- [ ] Border: Amber (border-amber-200)
- [ ] Badge: Amber with ⭐ icon
- [ ] Action Button: White with border

#### **Low Confidence (Gray)**
- [ ] Background: Light gray (bg-gray-50)
- [ ] Border: Gray (border-gray-200)
- [ ] Badge: Gray with 📋 icon
- [ ] "Weak Match" badge shows (if <40%)
- [ ] Action Button: Muted styling

#### **Warning Banner**
- [ ] Shows when all recommendations <50%
- [ ] ⚠️ icon visible
- [ ] Text: "Limited Match Quality"
- [ ] Suggestion to broaden requirements

---

### **Interaction Checks**

#### **Action Buttons**
- [ ] "🚀 Move to Interview" - moves to interview_1 stage
- [ ] "📞 Screen Candidate" - moves to screened stage
- [ ] "👀 Review Profile" - moves to screened stage
- [ ] "⚠️ Not Recommended" - moves to screened (manual review)
- [ ] Eye icon - opens candidate details
- [ ] Success alert after moving stages

#### **Collapse/Expand**
- [ ] X button hides recommendations
- [ ] "View X AI Recommendations" button shows them again
- [ ] State persists during page use

#### **Mobile Responsive**
- [ ] Cards stack properly on mobile
- [ ] Text doesn't overflow
- [ ] Buttons remain tap-friendly (44px minimum)
- [ ] Skills wrap to multiple lines

---

## Performance Testing

### **Load Testing**
```
Test with varying applicant counts:
- 1 applicant: <1 second
- 10 applicants: <2 seconds
- 50 applicants: <5 seconds
- 100 applicants: <10 seconds
```

### **Database Queries**
```
Check network tab:
- Skills query per applicant: 1 query
- Training count per applicant: 1 query
- Certificates per applicant: 1 query
- Opportunities query: 1 query (batch)

Total for 10 applicants: ~31 queries
Should complete in <3 seconds
```

---

## Regression Testing Checklist

After any algorithm changes, verify:

- [ ] Match scores are between 0-100%
- [ ] High/Medium/Low confidence thresholds work
- [ ] Certificate relevance filtering works
- [ ] Skills deduplication works ("Test" vs "Testing")
- [ ] Empty states show correctly
- [ ] No candidates below 20% threshold appear
- [ ] Top 3 recommendations shown
- [ ] Reasons list is accurate (max 4 items)
- [ ] Matched skills display correctly (max 4 + count)
- [ ] Action buttons move to correct stages
- [ ] Debug panel shows correct state (dev mode only)

---

## User Acceptance Testing

### **Recruiter Feedback Questions**

1. **Accuracy**: Do the recommended candidates actually match the job requirements?
2. **Relevance**: Are the "reasons" shown meaningful and helpful?
3. **Action Clarity**: Are the suggested next steps clear?
4. **Time Savings**: Does this save time vs manual review?
5. **False Positives**: Any candidates recommended that shouldn't be?
6. **False Negatives**: Any good candidates missing from recommendations?

### **Success Metrics**

- [ ] 80%+ of recruiters find recommendations accurate
- [ ] 90%+ reduction in time to identify top candidates
- [ ] 70%+ of high-confidence recommendations lead to interviews
- [ ] <10% false positive rate (bad recommendations)

---

## Automated Testing (Future)

### **Unit Tests to Add**
```typescript
// Test scoring algorithm
test('should calculate 60% skills + 20% profile + 15% training + 10% certs', () => {
  const score = calculateMatchScore({ ... });
  expect(score).toBe(expected);
});

// Test certificate matching
test('should match UX cert to UX Designer role', () => {
  const matched = matchCertificatesToRole([...], 'UX Designer', [...]);
  expect(matched.length).toBe(1);
});

// Test skill normalization
test('should treat "Testing" and "Test" as same skill', () => {
  const normalized = normalizeSkills(['Testing', 'Test']);
  expect(normalized.length).toBe(1);
});

// Test filtering
test('should filter out candidates below 20% threshold', () => {
  const filtered = filterRecommendations([...]);
  expect(filtered.every(r => r.matchScore > 20)).toBe(true);
});
```

---

## Known Limitations

1. **Skills matching is keyword-based** - Doesn't understand semantic similarity
   - Example: "React" and "React.js" are different (should match)
   - Workaround: Use fuzzy matching for common variations

2. **Certificate issuer validation** - Doesn't verify issuer authority
   - Example: "Google Certificate" from fake site vs real Google
   - Workaround: Manual verification by recruiters

3. **No historical hiring data** - Can't learn from past successes
   - Example: Which certifications actually predicted success?
   - Future: Add ML model trained on hiring outcomes

4. **Static role-certificate mappings** - Not auto-updated
   - Example: New certification types need manual addition
   - Future: Crowdsource mappings or use ML to discover

5. **Profile quality estimation** - Based on completeness, not content quality
   - Example: Fake skills count same as real skills
   - Workaround: Verification badges on skills/certs

---

## Debugging Tips

### **If no recommendations show:**

1. Check debug panel values (dev mode)
2. Verify job has `skills_required` set
3. Verify students have skills in profiles
4. Check console for errors
5. Verify match scores in network response

### **If wrong candidates recommended:**

1. Check certificate matching logs (add temporarily)
2. Verify skills normalization working
3. Review role-certificate mappings
4. Check scoring weights

### **If scores seem wrong:**

1. Manually calculate: (skills × 0.6) + (profile × 0.2) + (training × 3 up to 15) + (certs × 5 up to 10)
2. Verify profile score calculation
3. Check if skills are being deduplicated
4. Verify certificate relevance matching

---

## Production Checklist

Before deploying to production:

- [ ] All debug logs removed (except errors)
- [ ] Debug panel only shows in dev mode
- [ ] Build succeeds without warnings
- [ ] Tested with real recruiter data
- [ ] Performance tested with 50+ applicants
- [ ] Mobile responsive checked
- [ ] Edge cases handled gracefully
- [ ] Error states display user-friendly messages
- [ ] Documentation up to date
- [ ] Recruiter training completed

---

## Support & Maintenance

### **Monthly Review**
- Check recommendation accuracy reports
- Review false positive/negative rates
- Gather recruiter feedback
- Update role-certificate mappings

### **Quarterly Updates**
- Add new job roles to mappings
- Update certificate keywords
- Adjust scoring weights based on outcomes
- Add new universal certifications

### **Annual Assessment**
- Evaluate ML integration feasibility
- Review hiring success correlation
- Plan feature enhancements
- Update documentation

---

**Version**: 1.0  
**Last Updated**: 2025-01-14  
**Test Status**: Ready for validation  
**Next Review**: 2025-02-14

