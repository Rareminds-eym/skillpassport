#!/usr/bin/env node
/**
 * CLI tool for generating skill assessments
 * Usage: node assessment-cli.js --course "React" --level "Intermediate" --count 15
 */

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    course: null,
    level: 'Beginner',
    count: 10,
    output: null
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--course':
      case '-c':
        config.course = args[++i];
        break;
      case '--level':
      case '-l':
        config.level = args[++i];
        break;
      case '--count':
      case '-n':
        config.count = parseInt(args[++i]);
        break;
      case '--output':
      case '-o':
        config.output = args[++i];
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
    }
  }

  return config;
}

function showHelp() {
  console.log(`
Skill Assessment Generator CLI

Usage:
  node assessment-cli.js [options]

Options:
  -c, --course <name>     Course/Skill name (required)
  -l, --level <level>     Assessment level: Beginner | Intermediate | Advanced (default: Beginner)
  -n, --count <number>    Number of questions (default: 10)
  -o, --output <file>     Output file path (optional, prints to console if not specified)
  -h, --help              Show this help message

Examples:
  node assessment-cli.js --course "JavaScript" --level "Beginner" --count 10
  node assessment-cli.js -c "React Hooks" -l "Advanced" -n 20 -o react-assessment.json
  `);
}

function generatePrompt(course, level, count) {
  return `Create a structured skill assessment using the following inputs:

Course / Skill Name: ${course}
Assessment Level: ${level}
Assessment Purpose: Learning Evaluation + Skill Benchmarking
Number of Questions: ${count}

Difficulty Guidelines:
- Beginner: fundamental concepts, terminology, simple examples
- Intermediate: applied usage, real-world scenarios, debugging or logic
- Advanced: complex problem-solving, edge cases, architectural or optimization thinking

Question Design Rules:
1. Questions must be strictly relevant to the given course.
2. Avoid theoretical definitions where practical understanding is expected.
3. Mix question formats: MCQ, Scenario-based, Short answer
4. Each question must have exactly ONE correct answer.
5. No duplicate or overly similar questions.
6. Questions should reflect real-world industry expectations.
7. Do NOT include explanations or hints.
8. Do NOT reveal answers in the question text.
9. Content must be original and not copied from public test banks.

Output ONLY valid JSON in this format:
{
  "course": "${course}",
  "level": "${level}",
  "total_questions": ${count},
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "difficulty": "${level}",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "skill_tag": "specific skill being tested"
    }
  ]
}`;
}

function main() {
  const config = parseArgs();

  if (!config.course) {
    console.error('Error: Course name is required');
    console.log('Use --help for usage information');
    process.exit(1);
  }

  if (!['Beginner', 'Intermediate', 'Advanced'].includes(config.level)) {
    console.error('Error: Level must be Beginner, Intermediate, or Advanced');
    process.exit(1);
  }

  const prompt = generatePrompt(config.course, config.level, config.count);

  if (config.output) {
    fs.writeFileSync(config.output, prompt, 'utf8');
    console.log(`Prompt saved to: ${config.output}`);
    console.log('\nNext steps:');
    console.log('1. Copy the prompt from the output file');
    console.log('2. Send it to your AI model (GPT-4, Claude, etc.)');
    console.log('3. Save the JSON response as your assessment');
  } else {
    console.log(prompt);
    console.log('\n---\nCopy the above prompt and send it to your AI model to generate the assessment.');
  }
}

main();
