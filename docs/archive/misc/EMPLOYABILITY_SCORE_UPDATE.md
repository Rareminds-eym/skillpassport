# Employability Score Calculator Update

## Problem
The employability score calculator was using JSONB profile data instead of your separate tables for certificates, education, training, experience, skills, and projects.

## Solution
Updated `src/utils/employabilityCalculator.js` to fetch data from your separate tables for more accurate scoring.

## Data Sources Updated

### 1. **Education Table** → Foundational Skills (30% weight)
```javascript
// Before: profile.education array
// After: studentData.education from separate table
skillsData.foundational = studentData.education.map(edu => ({
  name: edu.degree || edu.course,
  rating: edu.cgpa ? Math.min(5, parseFloat(edu.cgpa) / 2) : 3,
  verified: edu.approval_status === 'approved'
}));
```

### 2. **Skills Table (type='technical')** → Digital Skills (15% weight)
```javascript
// Before: profile.technicalSkills array  
// After: studentData.technicalSkills from separate table
skillsData.digital = studentData.technicalSkills.map(skill => ({
  name: skill.name || skill.skill_name,
  rating: skill.level || skill.proficiency_level || 3,
  verified: skill.approval_status === 'approved'
}));
```

### 3. **Skills Table (type='soft')** → Behavioral Skills (15% weight)
```javascript
// Before: profile.softSkills array
// After: studentData.softSkills from separate table  
skillsData.behavior = studentData.softSkills.map(skill => ({
  name: skill.name || skill.skill_name,
  rating: skill.level || skill.proficiency_level || 3,
  verified: skill.approval_status === 'approved'
}));
```

### 4. **Training Table** → Career Skills (15% weight)
```javascript
// Before: profile.training array
// After: studentData.training from separate table
skillsData.career = studentData.training.map(training => ({
  name: training.course || training.title,
  rating: training.progress ? Math.min(5, training.progress / 20) : 3,
  verified: training.status === 'completed'
}));
```

### 5. **Projects Table** → 21st Century Skills (25% weight)
```javascript
// Before: profile.projects array
// After: studentData.projects from separate table
skillsData.century21 = studentData.projects.map(project => ({
  name: `Project: ${project.title}`,
  rating: project.status === 'completed' ? 4 : 3,
  verified: project.approval_status === 'approved'
}));
```

## Bonus Calculations Updated

### Experience Bonus
- **Experience Table**: +1 point for any work experience
- **Verified Experience**: +1 additional point for approved experience

### Training Bonus  
- **Training Table**: +1 point for any training courses
- **Completed Training**: Included in career skills calculation

### Projects Bonus
- **Projects Table**: +1 point for any projects
- **Approved Projects**: +1 additional point for approved projects

### Certificates Bonus
- **Certificates Table**: +2 points for any certificates
- **Verified Certificates**: +7 additional points in minimum score

### Skills Bonus
- **Technical Skills**: +0.5 points for 5+ technical skills
- **Soft Skills**: +0.5 points for 5+ soft skills
- **Total Skills**: +0.5 points for 10+ skills, +1 point for 20+ skills

## Fallback Strategy

If separate tables are empty, the calculator falls back to:
1. **Individual columns** (name, university, branch_field, course_name, etc.)
2. **Profile JSONB** (as last resort)

```javascript
// Fallback example
if (totalCategorizedSkills === 0) {
  // Use individual columns
  if (studentData.branch_field) {
    skillsData.foundational = [{
      name: studentData.branch_field,
      rating: 3,
      verified: true
    }];
  }
}
```

## Score Calculation Formula

```
Final Score = (Foundational × 30%) + (Century21 × 25%) + (Digital × 15%) + 
              (Behavior × 15%) + (Career × 15%) + Bonus Points

Where:
- Foundational = Education table data
- Century21 = Projects table data  
- Digital = Skills table (type='technical')
- Behavior = Skills table (type='soft')
- Career = Training table data
- Bonus = Experience + Certificates + Verification bonuses
```

## Benefits

1. **Accurate Scoring**: Uses actual student data from separate tables
2. **Real-time Updates**: Score updates when students add new records
3. **Verification Aware**: Higher scores for approved/verified records
4. **Comprehensive**: Considers all aspects of student profile
5. **Fallback Safe**: Still works if separate tables are empty

## Testing

To test the updated calculator:

1. **Add records** to separate tables (education, training, skills, etc.)
2. **Check score changes** in the profile component
3. **Verify bonuses** are applied for approved records
4. **Test fallback** with empty separate tables

The employability score should now accurately reflect the student's actual achievements from your separate tables! 🎯