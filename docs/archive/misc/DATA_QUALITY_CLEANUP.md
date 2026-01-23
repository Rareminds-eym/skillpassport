# Data Quality Cleanup Guide
## Fix Your Skills Database

**🚨 CRITICAL ISSUE DETECTED:**

Your skills database has severe quality issues:
```
❌ testtest (typo/duplicate)
❌ Test (duplicate)
❌ testing (duplicate, different case)
❌ life Evaluation (vague/unclear - should be "Quality Evaluation"?)
❌ Shelf (unclear skill - typo for "Shell"?)
✅ Teamwork (ok but soft skill)
✅ Communication (ok but soft skill)
```

---

## 🔍 **Step 1: Audit Your Skills Database**

Run this query in your Supabase SQL editor:

```sql
-- See all skills with counts
SELECT 
  LOWER(TRIM(name)) as skill_normalized,
  name as original_name,
  COUNT(*) as student_count,
  array_agg(DISTINCT student_id) as student_ids
FROM skills
WHERE enabled = true
GROUP BY name
ORDER BY COUNT(*) DESC;
```

---

## 🧹 **Step 2: Clean Up Duplicates**

### Fix Case Inconsistencies
```sql
-- Merge "testing", "Testing", "TESTING" → "Testing"
UPDATE skills
SET name = 'Testing'
WHERE LOWER(name) = 'testing' AND enabled = true;

-- Merge "Test" → "Testing"
UPDATE skills
SET name = 'Testing'
WHERE LOWER(name) = 'test' AND enabled = true;
```

### Remove Obvious Typos
```sql
-- Fix "testtest" → "Testing"
UPDATE skills
SET name = 'Testing'
WHERE name = 'testtest' AND enabled = true;

-- Fix "life Evaluation" → "Quality Evaluation" (or disable if unclear)
UPDATE skills
SET name = 'Quality Evaluation'
WHERE name = 'life Evaluation' AND enabled = true;

-- Fix "Shelf" → "Shell" (if it's a typo)
UPDATE skills
SET name = 'Shell'
WHERE name = 'Shelf' AND enabled = true;
-- OR disable if it's not a real skill:
-- UPDATE skills SET enabled = false WHERE name = 'Shelf';
```

---

## 📋 **Step 3: Categorize Skills Properly**

### Soft Skills (should be in separate category)
```sql
-- Add a 'type' column if you don't have it
ALTER TABLE skills ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'technical';

-- Mark soft skills
UPDATE skills
SET type = 'soft'
WHERE LOWER(name) IN (
  'communication', 'teamwork', 'leadership', 
  'problem solving', 'time management', 
  'critical thinking', 'collaboration'
) AND enabled = true;
```

### Technical Skills
```sql
-- Mark technical skills
UPDATE skills
SET type = 'technical'
WHERE LOWER(name) IN (
  'react', 'python', 'javascript', 'java', 'c++', 
  'node.js', 'django', 'sql', 'mongodb', 
  'html', 'css', 'typescript', 'git'
) AND enabled = true;
```

---

## 🚀 **Step 4: Bulk Skill Normalization**

Create a reference table of standard skills:

```sql
-- Create standard skills lookup
CREATE TABLE IF NOT EXISTS skill_standards (
  id SERIAL PRIMARY KEY,
  standard_name TEXT UNIQUE NOT NULL,
  aliases TEXT[] NOT NULL,
  category TEXT NOT NULL, -- 'technical', 'soft', 'tools'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert standard skills
INSERT INTO skill_standards (standard_name, aliases, category) VALUES
('React', ARRAY['react', 'reactjs', 'react.js', 'react js'], 'technical'),
('Python', ARRAY['python', 'python3', 'py'], 'technical'),
('JavaScript', ARRAY['javascript', 'js', 'ecmascript', 'es6'], 'technical'),
('Node.js', ARRAY['node', 'nodejs', 'node.js'], 'technical'),
('Communication', ARRAY['communication', 'communications', 'verbal communication'], 'soft'),
('Teamwork', ARRAY['teamwork', 'team work', 'collaboration', 'team player'], 'soft'),
('Git', ARRAY['git', 'github', 'version control'], 'tools'),
('Docker', ARRAY['docker', 'containerization'], 'tools');

-- Normalize skills based on standards
UPDATE skills s
SET 
  name = ss.standard_name,
  type = ss.category
FROM skill_standards ss
WHERE 
  LOWER(TRIM(s.name)) = ANY(ss.aliases) 
  AND s.enabled = true;
```

---

## 🔍 **Step 5: Find Vague/Unclear Skills**

```sql
-- Find skills that need review
SELECT 
  name,
  COUNT(*) as count,
  type,
  LENGTH(name) as name_length,
  CASE
    WHEN LENGTH(name) < 3 THEN 'Too short'
    WHEN name LIKE '% %' AND LENGTH(name) < 10 THEN 'Possibly vague'
    WHEN LOWER(name) IN ('testing', 'development', 'coding', 'programming') THEN 'Too generic'
    ELSE 'OK'
  END as quality_flag
FROM skills
WHERE enabled = true
GROUP BY name, type
HAVING 
  LENGTH(name) < 3 
  OR (name LIKE '% %' AND LENGTH(name) < 10)
  OR LOWER(name) IN ('testing', 'development', 'coding', 'programming')
ORDER BY count DESC;
```

---

## ⚠️ **Step 6: Disable Invalid Skills**

```sql
-- Disable skills that are too generic or unclear
UPDATE skills
SET enabled = false
WHERE 
  enabled = true
  AND (
    LENGTH(TRIM(name)) < 2                     -- Too short
    OR name ~ '^[0-9]+$'                       -- Just numbers
    OR name ~ '^test'                          -- Test data
    OR LOWER(name) IN (                        -- Too generic
      'testing', 'development', 'coding', 
      'programming', 'work', 'project'
    )
  );

-- Optionally add a reason
ALTER TABLE skills ADD COLUMN IF NOT EXISTS disabled_reason TEXT;

UPDATE skills
SET disabled_reason = 'Too generic - needs specificity'
WHERE enabled = false AND disabled_reason IS NULL;
```

---

## 📊 **Step 7: Verify Cleanup**

```sql
-- Check results
SELECT 
  type,
  COUNT(DISTINCT name) as unique_skills,
  COUNT(*) as total_entries,
  COUNT(DISTINCT student_id) as students_with_skills
FROM skills
WHERE enabled = true
GROUP BY type
ORDER BY type;

-- Should show something like:
-- technical  |  50  |  200  |  80
-- soft       |  10  |  60   |  50
-- tools      |  15  |  45   |  35
```

---

## 🎯 **Step 8: Prevent Future Issues**

### Add Validation Function
```sql
-- Create a function to validate skill names
CREATE OR REPLACE FUNCTION validate_skill_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Trim whitespace
  NEW.name := TRIM(NEW.name);
  
  -- Require minimum length
  IF LENGTH(NEW.name) < 2 THEN
    RAISE EXCEPTION 'Skill name too short: %', NEW.name;
  END IF;
  
  -- Capitalize properly
  IF NEW.name !~ '[A-Z]' THEN
    NEW.name := INITCAP(NEW.name);
  END IF;
  
  -- Warn on generic skills
  IF LOWER(NEW.name) IN ('test', 'testing', 'work', 'project', 'development') THEN
    RAISE WARNING 'Generic skill name: %. Consider being more specific.', NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS validate_skill ON skills;
CREATE TRIGGER validate_skill
  BEFORE INSERT OR UPDATE ON skills
  FOR EACH ROW
  EXECUTE FUNCTION validate_skill_name();
```

### Add Constraints
```sql
-- Add check constraints
ALTER TABLE skills
ADD CONSTRAINT skill_name_length CHECK (LENGTH(TRIM(name)) >= 2);

ALTER TABLE skills
ADD CONSTRAINT skill_name_not_number CHECK (name !~ '^[0-9]+$');
```

---

## 🚨 **IMMEDIATE ACTION REQUIRED**

Run these queries NOW to fix your current data:

```sql
-- Quick fix for immediate issues
BEGIN;

-- 1. Fix duplicates
UPDATE skills SET name = 'Testing' WHERE LOWER(name) IN ('test', 'testing', 'testtest');

-- 2. Fix obvious errors
UPDATE skills SET name = 'Quality Evaluation' WHERE name = 'life Evaluation';
UPDATE skills SET enabled = false WHERE name IN ('Shelf', 'testtest');

-- 3. Add type categorization
UPDATE skills SET type = 'soft' WHERE LOWER(name) IN ('communication', 'teamwork', 'leadership');
UPDATE skills SET type = 'technical' WHERE type IS NULL OR type = '';

-- 4. Remove duplicates (keep one per student per skill)
DELETE FROM skills a USING skills b
WHERE 
  a.id < b.id 
  AND a.student_id = b.student_id 
  AND LOWER(TRIM(a.name)) = LOWER(TRIM(b.name))
  AND a.enabled = true
  AND b.enabled = true;

COMMIT;
```

---

## 📈 **Expected Results**

### Before Cleanup:
```
Skills: testtest, Test, testing, life Evaluation, Shelf
Quality: 🔴 CRITICAL
Recruiter AI: Can't make good recommendations
```

### After Cleanup:
```
Skills: React, Python, JavaScript, Quality Evaluation, Communication
Quality: ✅ GOOD
Recruiter AI: Accurate recommendations
```

---

## 🛡️ **Best Practices Going Forward**

1. **Use Standard Skill Names**
   - React (not reactjs, react.js, REACT)
   - Python (not python3, py, PYTHON)
   - Node.js (not nodejs, node, NodeJS)

2. **Be Specific**
   - ❌ "Testing" → ✅ "Unit Testing" or "Manual QA Testing"
   - ❌ "Development" → ✅ "Web Development" or "Mobile Development"
   - ❌ "Programming" → ✅ "Python Programming" or "Java Programming"

3. **Import from Reliable Sources**
   - Resume parsers
   - LinkedIn API
   - Standard skill taxonomies (O*NET, ESCO)

4. **Regular Audits**
   - Run quality checks monthly
   - Review top 50 skills quarterly
   - Normalize variations annually

---

## 🔧 **Tools to Help**

### SQL Query to Generate Cleanup Report
```sql
-- Generate a cleanup report
WITH skill_analysis AS (
  SELECT 
    name,
    COUNT(*) as usage_count,
    COUNT(DISTINCT student_id) as unique_students,
    type,
    CASE
      WHEN LENGTH(name) < 3 THEN 'SHORT'
      WHEN name ~ '^test' THEN 'TEST_DATA'
      WHEN LOWER(name) IN ('testing', 'development', 'work') THEN 'TOO_GENERIC'
      WHEN name LIKE '%  %' THEN 'EXTRA_SPACES'
      WHEN name != INITCAP(name) THEN 'BAD_CASE'
      ELSE 'OK'
    END as issue_type
  FROM skills
  WHERE enabled = true
  GROUP BY name, type
)
SELECT 
  issue_type,
  COUNT(*) as skill_count,
  SUM(usage_count) as total_entries,
  array_agg(name ORDER BY usage_count DESC) as example_skills
FROM skill_analysis
WHERE issue_type != 'OK'
GROUP BY issue_type
ORDER BY skill_count DESC;
```

---

## ✅ **Cleanup Checklist**

- [ ] Run audit query to see current state
- [ ] Backup skills table before changes
- [ ] Fix obvious typos (testtest → Testing)
- [ ] Merge case variations (test, Test, TEST → Testing)
- [ ] Fix vague skills (life Evaluation → Quality Evaluation)
- [ ] Remove invalid skills (Shelf, test data)
- [ ] Add type categorization (technical/soft/tools)
- [ ] Add validation constraints
- [ ] Run verification queries
- [ ] Test recruiter AI with clean data

---

## 📞 **Need Help?**

If you're unsure about specific skills:
1. Check the skill against job boards (LinkedIn, Indeed)
2. Look at industry standard taxonomies
3. Ask candidates what they meant
4. When in doubt, make it specific or remove it

---

**Impact of Clean Data:**
- 🎯 Better candidate matching
- 📊 Accurate skill analytics
- 🤖 Smarter AI recommendations
- ⚡ Faster searches
- ✅ Professional reports

**Clean your data TODAY!** 🚀

