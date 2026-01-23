# Example: Adding a New Certificate Assessment

## Scenario
You want to add a "Docker Fundamentals" certificate with **7 questions** and a **7-minute time limit**.

## Step-by-Step Guide

### Step 1: Add Configuration
Open `src/data/assessment/certificateConfig.ts` and add:

```typescript
export const certificateConfigs: Record<string, CertificateConfig> = {
  // ... existing configs ...
  
  'docker': {
    name: 'Docker Fundamentals',
    questionCount: 7,           // Only 7 questions
    timeLimit: 420,             // 7 minutes (7 * 60 seconds)
    passingScore: 70,           // 70% to pass (5 out of 7)
    difficulty: 'medium'
  },
  
  // ... rest of configs ...
};
```

### Step 2: Create Question File (Optional)
Create `src/data/assessment/questions/docker.ts`:

```typescript
import { Question } from '../../../types';

export const dockerQuestions: Question[] = [
  {
    id: 1,
    text: 'What is Docker?',
    options: [
      'A containerization platform',
      'A programming language',
      'A database system',
      'A web server'
    ],
    correctAnswer: 'A containerization platform',
    type: 'mcq'
  },
  {
    id: 2,
    text: 'What command is used to build a Docker image?',
    options: [
      'docker build',
      'docker create',
      'docker make',
      'docker compile'
    ],
    correctAnswer: 'docker build',
    type: 'mcq'
  },
  {
    id: 3,
    text: 'What is a Dockerfile?',
    options: [
      'A text file with instructions to build an image',
      'A configuration file for Docker daemon',
      'A log file',
      'A database schema'
    ],
    correctAnswer: 'A text file with instructions to build an image',
    type: 'mcq'
  },
  {
    id: 4,
    text: 'Which command runs a Docker container?',
    options: [
      'docker run',
      'docker start',
      'docker execute',
      'docker launch'
    ],
    correctAnswer: 'docker run',
    type: 'mcq'
  },
  {
    id: 5,
    text: 'What is Docker Hub?',
    options: [
      'A registry for Docker images',
      'A code editor',
      'A monitoring tool',
      'A deployment platform'
    ],
    correctAnswer: 'A registry for Docker images',
    type: 'mcq'
  },
  {
    id: 6,
    text: 'What does the -d flag do in docker run?',
    options: [
      'Runs container in detached mode',
      'Deletes the container',
      'Downloads the image',
      'Displays logs'
    ],
    correctAnswer: 'Runs container in detached mode',
    type: 'mcq'
  },
  {
    id: 7,
    text: 'What is Docker Compose used for?',
    options: [
      'Managing multi-container applications',
      'Writing Dockerfiles',
      'Building images faster',
      'Monitoring containers'
    ],
    correctAnswer: 'Managing multi-container applications',
    type: 'mcq'
  },
  {
    id: 8,
    text: 'How do you list running containers?',
    options: [
      'docker ps',
      'docker list',
      'docker show',
      'docker containers'
    ],
    correctAnswer: 'docker ps',
    type: 'mcq'
  },
  {
    id: 9,
    text: 'What is a Docker volume?',
    options: [
      'Persistent storage for containers',
      'A network configuration',
      'A container image',
      'A build cache'
    ],
    correctAnswer: 'Persistent storage for containers',
    type: 'mcq'
  },
  {
    id: 10,
    text: 'Which port flag maps container ports to host?',
    options: [
      '-p',
      '-port',
      '-map',
      '-expose'
    ],
    correctAnswer: '-p',
    type: 'mcq'
  }
];
```

### Step 3: Register Questions
Open `src/data/assessment/questions/index.ts` and add:

```typescript
import { dockerQuestions } from './docker';

const questionsMap: Record<string, Question[]> = {
  // ... existing mappings ...
  'docker': dockerQuestions,
  // ... rest of mappings ...
};
```

### Step 4: Test It
In your component:

```javascript
// Navigate to assessment
navigate('/student/assessment/platform', {
  state: {
    certificateName: 'Docker Fundamentals'
  }
});
```

### Expected Console Output
```
✅ Certificate: "Docker Fundamentals"
   Matched: docker
   Total available: 10 questions
   Configured count: 7 questions
   Returning: 7 questions
   Time limit: 7 minutes
   Passing score: 70%

📝 Assessment Configuration:
   Certificate: Docker Fundamentals
   Questions: 7
   Time Limit: 7 minutes
   Passing Score: 70%
   Difficulty: medium
```

## Result
- Student sees **7 random questions** from the 10 available
- Has **7 minutes** to complete
- Needs **5 correct answers** (70%) to pass
- Different questions on each attempt (randomized)

## More Examples

### Quick 3-Question Check
```typescript
'html-basics': {
  name: 'HTML Basics',
  questionCount: 3,
  timeLimit: 180,  // 3 minutes
  passingScore: 60,
  difficulty: 'easy'
}
```

### Comprehensive 15-Question Test
```typescript
'aws-architect': {
  name: 'AWS Solutions Architect',
  questionCount: 15,
  timeLimit: 1200,  // 20 minutes
  passingScore: 80,
  difficulty: 'hard'
}
```

### Medium 10-Question Assessment
```typescript
'sql-fundamentals': {
  name: 'SQL Fundamentals',
  questionCount: 10,
  timeLimit: 600,  // 10 minutes
  passingScore: 70,
  difficulty: 'medium'
}
```

## Tips

1. **Question Pool**: Create more questions than needed (e.g., 10-15 questions for a 7-question test) for variety
2. **Time Allocation**: ~1 minute per question is a good rule
3. **Passing Score**: 
   - Easy: 60-65%
   - Medium: 70-75%
   - Hard: 75-80%
4. **Randomization**: System automatically randomizes when pool > configured count
5. **Testing**: Always test with console logs to verify configuration
