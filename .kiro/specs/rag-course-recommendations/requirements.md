# Requirements Document

## Introduction

This feature implements RAG (Retrieval-Augmented Generation) based course recommendations for the student career assessment system. Instead of generic AI-generated course suggestions, the system will retrieve and recommend courses from the platform's own database that best match the student's assessment results, skill gaps, and career aspirations.

## Glossary

- **RAG (Retrieval-Augmented Generation)**: A technique that enhances AI responses by first retrieving relevant data from a knowledge base, then using that data to augment the generation prompt
- **Embedding**: A numerical vector representation of text that captures semantic meaning, enabling similarity comparisons
- **Vector Search**: Database query that finds records with embeddings most similar to a query embedding
- **Assessment Results**: The analyzed output from Gemini AI containing RIASEC scores, skill gaps, career clusters, and employability metrics
- **Course**: A learning program available on the platform with title, description, skills, and target outcomes
- **Skill Gap**: A skill identified as needing improvement based on assessment analysis
- **Career Cluster**: A grouping of related career paths matched to the student's profile

## Requirements

### Requirement 1: Course Embedding Generation

**User Story:** As a platform administrator, I want all active courses to have vector embeddings generated from their content, so that semantic similarity searches can be performed.

#### Acceptance Criteria

1. WHEN a course is created or updated THEN the system SHALL generate an embedding vector from the course title, description, skills, and target outcomes
2. WHEN generating embeddings THEN the system SHALL use a consistent embedding model (Gemini text-embedding-004 or equivalent)
3. WHEN storing embeddings THEN the system SHALL persist them in the courses table embedding column
4. WHEN a course has no embedding THEN the system SHALL provide a batch process to generate missing embeddings
5. WHEN embedding generation fails THEN the system SHALL log the error and continue processing other courses

### Requirement 2: Student Profile Embedding

**User Story:** As a student completing an assessment, I want my profile to be converted into a searchable format, so that relevant courses can be found for me.

#### Acceptance Criteria

1. WHEN assessment results are generated THEN the system SHALL create a composite text representation of the student's profile including skill gaps, career clusters, and improvement areas
2. WHEN creating the profile text THEN the system SHALL weight skill gaps and career clusters as primary factors
3. WHEN the profile text is created THEN the system SHALL generate an embedding vector for similarity search
4. WHEN generating the student profile embedding THEN the system SHALL use the same embedding model as course embeddings

### Requirement 3: Semantic Course Retrieval

**User Story:** As a student viewing my assessment results, I want to see courses from the platform that match my profile, so that I can enroll in relevant learning paths.

#### Acceptance Criteria

1. WHEN retrieving courses for a student THEN the system SHALL perform a vector similarity search using the student profile embedding against course embeddings
2. WHEN performing similarity search THEN the system SHALL return the top 10 most semantically similar courses
3. WHEN courses are retrieved THEN the system SHALL filter to only include courses with status 'Active'
4. WHEN displaying results THEN the system SHALL include a relevance score (0-100%) for each course
5. WHEN no courses match above a minimum threshold THEN the system SHALL return an empty result with appropriate messaging

### Requirement 4: Course Recommendation Integration

**User Story:** As a student, I want to see recommended platform courses in my assessment report roadmap section, so that I can take immediate action on my development.

#### Acceptance Criteria

1. WHEN assessment results are displayed THEN the system SHALL show a "Recommended Courses" section in the roadmap
2. WHEN displaying recommended courses THEN the system SHALL show course title, duration, skills covered, and match percentage
3. WHEN a student clicks on a recommended course THEN the system SHALL navigate to the course enrollment page
4. WHEN courses are recommended THEN the system SHALL group them by relevance to specific skill gaps
5. WHEN the roadmap section loads THEN the system SHALL display courses within 2 seconds of page load

### Requirement 5: Skill Gap to Course Mapping

**User Story:** As a student viewing my skill gaps, I want to see specific courses that address each gap, so that I can prioritize my learning.

#### Acceptance Criteria

1. WHEN displaying skill gap analysis THEN the system SHALL show 1-3 relevant courses under each priority skill gap
2. WHEN mapping courses to skill gaps THEN the system SHALL use both the course_skills table and semantic similarity
3. WHEN a skill gap has no matching courses THEN the system SHALL display a message indicating no platform courses currently address this skill
4. WHEN courses are shown per skill gap THEN the system SHALL include a "Why this course" explanation based on skill overlap

### Requirement 6: Embedding Infrastructure

**User Story:** As a developer, I want a reliable embedding service, so that embeddings can be generated consistently across the application.

#### Acceptance Criteria

1. WHEN the embedding service is called THEN the system SHALL handle rate limiting gracefully with exponential backoff
2. WHEN embedding generation is requested THEN the system SHALL support batch processing for multiple texts
3. WHEN the embedding API is unavailable THEN the system SHALL fall back to keyword-based matching
4. WHEN embeddings are generated THEN the system SHALL cache results to avoid redundant API calls
5. IF the embedding dimension changes THEN the system SHALL provide a migration path for existing embeddings
