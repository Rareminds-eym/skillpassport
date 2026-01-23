# Employability Score Calculation

## Overview
The employability score is a comprehensive metric that evaluates a student's readiness for the job market based on their skills, experience, and qualifications. The score is calculated on a scale of 0-100%.

## Algorithm Components

### 1. Skill Categories & Weights
The calculation considers five main skill categories with different weights:

- **Foundational Skills (30%)**: Core academic and basic professional skills
- **21st Century Skills (25%)**: Modern workplace competencies
- **Digital Skills (15%)**: Technical and digital literacy
- **Behavioral Skills (15%)**: Soft skills and interpersonal abilities  
- **Career Skills (15%)**: Job-specific and career development skills

### 2. Skill Rating System
Each skill is rated on a 1-5 scale:
- **1**: Beginner
- **2**: Basic
- **3**: Intermediate
- **4**: Advanced
- **5**: Expert

### 3. Evidence Verification
Skills with verified evidence receive full weight (1.0), while unverified skills receive reduced weight (0.8).

### 4. Bonus System (Up to 5 points)
Additional points are awarded for:
- **All Evidence Verified**: +2 points
- **Hackathon/Internship Participation**: +1 point
- **Skill Passport Certificate**: +2 points
- **Extensive Skills Portfolio**: +1-2 points (20+ or 30+ skills)
- **Educational Background**: +0.5 points

## Score Levels

| Score Range | Level | Label |
|-------------|-------|-------|
| 85-100% | Excellent | 🌟 Industry Ready |
| 70-84% | Good | 🚀 Emerging Talent |
| 50-69% | Moderate | 🌱 Developing |
| 0-49% | Needs Support | 🔧 Guided Path |

## Data Structure Requirements

The calculation function expects student data with the following structure:

```javascript
{
  // Skill categories (arrays of skill objects)
  foundationalSkills: [
    {
      name: "Communication",
      rating: 4,           // 1-5 scale
      evidenceVerified: true,
      verified: true,      // Alternative field name
      evidence: "document" // Alternative verification indicator
    }
  ],
  
  // Alternative field names supported
  technicalSkills: [], // maps to digital category
  softSkills: [],      // maps to behavior category
  
  // Experience and qualifications
  experience: [...],   // Work experience array
  training: [...],     // Training courses array
  education: [...],    // Educational background
  
  // Certification flags
  hasSkillPassportCertificate: boolean,
  certified: boolean,
  participatedHackathonOrInternship: boolean
}
```

## Implementation

### Usage in Components
```javascript
import { calculateEmployabilityScore } from '../utils/employabilityCalculator';

// Calculate score from student profile data
const scoreData = calculateEmployabilityScore(studentProfile);

// Use the result
const { employabilityScore, level, label, breakdown } = scoreData;
```

### Integration with ProfileHeroEdit
The ProfileHeroEdit component automatically:
1. Fetches student data from Supabase
2. Calculates the employability score
3. Displays the score with visual progress bar
4. Shows the achievement level and label
5. Includes debug breakdown in development mode

## Development & Testing

### Debug Mode
In development mode, the component shows a breakdown of scores by category:
- F: Foundational percentage
- C21: 21st Century Skills percentage  
- D: Digital Skills percentage
- B: Behavioral Skills percentage
- Car: Career Skills percentage
- Bonus: Additional points awarded

### Test Data
Use the test file `employabilityCalculator.test.js` to verify calculations with sample data.

## Future Enhancements

### Planned Features
1. **Industry-Specific Weights**: Different weight distributions for different career paths
2. **Skill Trend Analysis**: Historical score tracking over time
3. **Peer Comparison**: Benchmarking against similar students
4. **Recommendation Engine**: Personalized skill development suggestions
5. **External Validation**: Integration with third-party skill assessment platforms

### Customization Options
- Adjustable category weights based on industry requirements
- Custom skill taxonomies for different programs
- Configurable bonus criteria
- Institution-specific scoring models