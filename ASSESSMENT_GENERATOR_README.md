# Skill Assessment Generator

A structured tool for creating course/skill assessments with AI assistance.

## Quick Start

### Using the CLI Tool

```bash
node assessment-cli.js --course "JavaScript" --level "Beginner" --count 10
```

This generates a prompt that you can send to any AI model (GPT-4, Claude, Gemini, etc.) to create a structured assessment.

### Command Options

- `--course, -c`: Course/Skill name (required)
- `--level, -l`: Beginner | Intermediate | Advanced (default: Beginner)
- `--count, -n`: Number of questions (default: 10)
- `--output, -o`: Save prompt to file instead of printing

### Examples

```bash
# Generate prompt for React assessment
node assessment-cli.js -c "React Hooks" -l "Intermediate" -n 15

# Save prompt to file
node assessment-cli.js -c "Python" -l "Advanced" -n 20 -o python-prompt.txt

# Beginner SQL assessment
node assessment-cli.js --course "SQL Basics" --level "Beginner" --count 12
```

## Assessment Structure

Each generated assessment follows this JSON format:

```json
{
  "course": "Course Name",
  "level": "Beginner|Intermediate|Advanced",
  "total_questions": 10,
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "difficulty": "Beginner",
      "question": "What is a variable?",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "skill_tag": "fundamentals"
    }
  ]
}
```

## Question Types

- **mcq**: Multiple choice questions with 2-4 options
- **scenario**: Real-world scenario-based questions
- **short_answer**: Brief text response questions

## Difficulty Levels

### Beginner
- Fundamental concepts
- Terminology
- Simple examples

### Intermediate
- Applied usage
- Real-world scenarios
- Debugging and logic

### Advanced
- Complex problem-solving
- Edge cases
- Architectural thinking
- Optimization strategies

## Integration with Your System

To integrate with your existing course/assessment system:

1. Generate the prompt using the CLI
2. Send to your AI service
3. Parse the JSON response
4. Store in your database (likely in the `assessments` or `skill_assessments` table)
5. Link to courses via `course_id` or `skill_id`

## Validation

Use the validator to check generated assessments:

```javascript
const { validateAssessment } = require('./assessment-generator.js');

const assessment = { /* your JSON */ };
const result = validateAssessment(assessment);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

## Best Practices

1. Review AI-generated questions for accuracy
2. Test questions with real users before deployment
3. Mix question types for comprehensive evaluation
4. Align difficulty with actual course content
5. Update assessments regularly based on feedback
