# API Reference - Skill Ecosystem

## Base URL
```
Production: https://api.skillpassport.rareminds.in/v1
Staging: https://staging-api.skillpassport.rareminds.in/v1
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### Get Authentication Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "role": "student"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "student",
    "name": "John Doe"
  },
  "expires_at": "2026-01-24T12:00:00Z"
}
```

## Core Endpoints

### Students

#### Get Student Profile
```http
GET /api/students/{student_id}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "grade": "12",
  "program": "Science",
  "school_id": "uuid",
  "skills": ["Python", "Data Analysis", "Communication"],
  "interests": ["Technology", "Research"],
  "created_at": "2025-01-01T00:00:00Z"
}
```

#### Update Student Profile
```http
PUT /api/students/{student_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+91-9876543210",
  "skills": ["Python", "Machine Learning"],
  "bio": "Aspiring data scientist"
}
```

### Assessments

#### List Available Assessments
```http
GET /api/assessments?grade=12&type=career
Authorization: Bearer <token>
```

**Query Parameters:**
- `grade` (optional): Filter by grade level
- `type` (optional): career, skill, academic
- `status` (optional): available, completed

**Response:**
```json
{
  "assessments": [
    {
      "id": "uuid",
      "title": "Career Interest Assessment",
      "type": "career",
      "description": "RIASEC-based career guidance",
      "duration": 15,
      "questions_count": 60,
      "grade_levels": ["10", "11", "12"]
    }
  ],
  "total": 1
}
```

#### Start Assessment
```http
POST /api/assessments/{assessment_id}/start
Authorization: Bearer <token>
```

**Response:**
```json
{
  "attempt_id": "uuid",
  "assessment": {
    "id": "uuid",
    "title": "Career Interest Assessment",
    "questions": [
      {
        "id": "q1",
        "text": "I enjoy working with tools and machines",
        "type": "likert",
        "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
      }
    ]
  },
  "started_at": "2026-01-23T10:00:00Z",
  "expires_at": "2026-01-23T10:15:00Z"
}
```

#### Submit Assessment
```http
POST /api/assessments/{assessment_id}/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "attempt_id": "uuid",
  "responses": [
    {
      "question_id": "q1",
      "answer": "Agree"
    }
  ]
}
```

**Response:**
```json
{
  "result_id": "uuid",
  "score": 85,
  "riasec_scores": {
    "realistic": 75,
    "investigative": 85,
    "artistic": 60,
    "social": 70,
    "enterprising": 65,
    "conventional": 55
  },
  "recommendations": [
    {
      "career": "Data Scientist",
      "match_score": 92,
      "reasoning": "Strong investigative and realistic traits"
    },
    {
      "career": "Software Engineer",
      "match_score": 88,
      "reasoning": "High investigative and conventional scores"
    }
  ],
  "suggested_streams": ["Science", "Technology"],
  "skill_gaps": ["Advanced Mathematics", "Statistical Analysis"]
}
```

### Opportunities

#### Search Opportunities
```http
GET /api/opportunities?type=job&grade=college&skills=Python,Data Analysis
Authorization: Bearer <token>
```

**Query Parameters:**
- `type`: job, internship, training
- `grade`: 8, 9, 10, 11, 12, college, postgrad
- `skills`: Comma-separated skill list
- `location`: City or region
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)

**Response:**
```json
{
  "opportunities": [
    {
      "id": "uuid",
      "title": "Data Analyst Intern",
      "type": "internship",
      "company": "Tech Corp",
      "description": "Work with data analysis team",
      "required_skills": ["Python", "SQL", "Data Analysis"],
      "preferred_skills": ["Machine Learning", "Tableau"],
      "grade_level": "college",
      "location": "Bangalore",
      "duration": "3 months",
      "stipend": "₹15,000/month",
      "match_score": 87,
      "posted_at": "2026-01-20T00:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "pages": 3
}
```

#### Get AI Recommendations
```http
GET /api/opportunities/recommendations
Authorization: Bearer <token>
```

**Response:**
```json
{
  "recommendations": [
    {
      "opportunity": {
        "id": "uuid",
        "title": "Junior Data Scientist",
        "company": "AI Startup"
      },
      "match_score": 92,
      "match_reasons": [
        "Skills match: Python, Machine Learning",
        "Career interest alignment: 95%",
        "Education requirement met"
      ],
      "skill_gaps": ["Deep Learning", "Cloud Computing"],
      "preparation_tips": [
        "Complete Deep Learning course",
        "Build portfolio projects"
      ]
    }
  ]
}
```

#### Apply to Opportunity
```http
POST /api/opportunities/{opportunity_id}/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "cover_letter": "I am excited to apply...",
  "resume_url": "https://storage.com/resume.pdf",
  "additional_info": {
    "availability": "Immediate",
    "expected_salary": "₹20,000"
  }
}
```

**Response:**
```json
{
  "application_id": "uuid",
  "status": "applied",
  "applied_at": "2026-01-23T10:30:00Z",
  "pipeline_stage": "screening",
  "message": "Application submitted successfully"
}
```

### Courses

#### Browse Courses
```http
GET /api/courses?category=Technology&type=external
Authorization: Bearer <token>
```

**Query Parameters:**
- `category`: Technology, Business, Arts, Science, etc.
- `type`: internal, external
- `level`: beginner, intermediate, advanced
- `free`: true, false

**Response:**
```json
{
  "courses": [
    {
      "id": "uuid",
      "title": "Introduction to Machine Learning",
      "type": "external",
      "category": "Technology",
      "level": "intermediate",
      "duration": "8 weeks",
      "price": 2999,
      "currency": "INR",
      "instructor": "Dr. Jane Smith",
      "rating": 4.7,
      "enrolled_count": 1250,
      "skills": ["Machine Learning", "Python", "Data Science"],
      "thumbnail": "https://cdn.com/course.jpg"
    }
  ],
  "total": 120
}
```

#### Enroll in Course
```http
POST /api/courses/{course_id}/enroll
Authorization: Bearer <token>
```

**Response:**
```json
{
  "enrollment_id": "uuid",
  "course_id": "uuid",
  "student_id": "uuid",
  "enrolled_at": "2026-01-23T10:45:00Z",
  "status": "active",
  "progress": 0,
  "payment_required": true,
  "payment_url": "https://payment.com/checkout/xyz"
}
```

### Recruitment Pipeline

#### Get Pipeline Candidates
```http
GET /api/pipeline/candidates?stage=interview&opportunity_id=uuid
Authorization: Bearer <token>
```

**Query Parameters:**
- `stage`: applied, screening, interview, offer, hired, rejected
- `opportunity_id`: Filter by specific opportunity
- `sort`: match_score, applied_date, name

**Response:**
```json
{
  "candidates": [
    {
      "id": "uuid",
      "student": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "grade": "College - Final Year",
        "program": "Computer Science"
      },
      "opportunity": {
        "id": "uuid",
        "title": "Software Engineer"
      },
      "stage": "interview",
      "match_score": 88,
      "applied_at": "2026-01-20T00:00:00Z",
      "last_updated": "2026-01-22T00:00:00Z",
      "notes": "Strong technical skills",
      "resume_url": "https://storage.com/resume.pdf"
    }
  ],
  "total": 15
}
```

#### Move Candidate to Stage
```http
PUT /api/pipeline/{application_id}/stage
Authorization: Bearer <token>
Content-Type: application/json

{
  "stage": "offer",
  "notes": "Excellent interview performance",
  "feedback": {
    "technical_score": 9,
    "communication_score": 8,
    "cultural_fit": 9
  }
}
```

**Response:**
```json
{
  "application_id": "uuid",
  "previous_stage": "interview",
  "current_stage": "offer",
  "updated_at": "2026-01-23T11:00:00Z",
  "notification_sent": true
}
```

## Webhooks

Subscribe to events by configuring webhook URLs in your dashboard.

### Available Events

- `student.enrolled` - Student enrolls in course
- `assessment.completed` - Student completes assessment
- `application.submitted` - Student applies to opportunity
- `application.stage.changed` - Application moves to new stage
- `payment.completed` - Payment processed successfully
- `course.completed` - Student completes course

### Webhook Payload Example

```json
{
  "event": "application.submitted",
  "timestamp": "2026-01-23T11:00:00Z",
  "data": {
    "application_id": "uuid",
    "student_id": "uuid",
    "opportunity_id": "uuid",
    "status": "applied"
  }
}
```

## Rate Limits

- **Free Tier:** 100 requests/hour
- **Basic Plan:** 1,000 requests/hour
- **Professional Plan:** 10,000 requests/hour
- **Enterprise:** Custom limits

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1706011200
```

## Error Responses

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "constraint": "format"
    }
  }
}
```

### Common Error Codes

- `AUTHENTICATION_REQUIRED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `VALIDATION_ERROR` (400)
- `RATE_LIMIT_EXCEEDED` (429)
- `INTERNAL_ERROR` (500)

## SDKs & Libraries

- **JavaScript/TypeScript:** `npm install @skillpassport/sdk`
- **Python:** `pip install skillpassport`
- **Java:** Maven/Gradle available

## Support

- API Documentation: https://docs.skillpassport.rareminds.in
- API Status: https://status.skillpassport.rareminds.in
- Support Email: api@skillpassport.rareminds.in
