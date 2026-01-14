# Requirements Document

## Introduction

This feature enhances the Role Overview API to include AI-generated suggested projects that are personalized and relevant to the user's target career role. The suggested projects will complement the existing 6-month learning roadmap by providing hands-on project ideas that help students build practical skills and portfolio pieces specific to their chosen career path (e.g., Robotics Engineer, Data Scientist, Web Developer).

## Glossary

- **Role Overview API**: A Cloudflare Worker API that generates comprehensive career guidance data for a given role name and career cluster
- **Suggested Project**: A hands-on project recommendation with title, description, difficulty level, and learning outcomes relevant to a specific career role
- **Learning Roadmap**: An existing 6-month phased learning plan with monthly milestones and tasks
- **Career Cluster**: A grouping of related career roles (e.g., STEM, Business, Healthcare)
- **OpenRouter**: Primary AI service provider for generating role overview content
- **Gemini**: Fallback AI service provider when OpenRouter is unavailable

## Requirements

### Requirement 1

**User Story:** As a student exploring career paths, I want to see AI-generated project suggestions relevant to my target role, so that I can build practical skills and portfolio pieces.

#### Acceptance Criteria

1. WHEN the Role Overview API receives a valid role name and cluster title, THEN the system SHALL return an array of 3 suggested projects in the response
2. WHEN generating suggested projects, THEN the system SHALL ensure each project includes a title, description, difficulty level, and list of skills learned
3. WHEN the AI service generates project suggestions, THEN the system SHALL ensure project descriptions are age-appropriate and achievable within 2-4 weeks
4. WHEN displaying project difficulty, THEN the system SHALL use one of these levels: "Beginner", "Intermediate", or "Advanced"

### Requirement 2

**User Story:** As a student, I want project suggestions that match my experience level, so that I can progressively build skills from beginner to advanced.

#### Acceptance Criteria

1. WHEN generating 3 suggested projects, THEN the system SHALL include at least one project at each difficulty level (Beginner, Intermediate, Advanced)
2. WHEN a project is marked as Beginner level, THEN the system SHALL ensure the project requires no prior experience in the role domain
3. WHEN a project is marked as Advanced level, THEN the system SHALL ensure the project builds upon skills from simpler projects

### Requirement 3

**User Story:** As a student, I want each project to clearly list what skills I will learn, so that I can understand the value of completing the project.

#### Acceptance Criteria

1. WHEN generating a suggested project, THEN the system SHALL include 2-4 specific skills that the student will learn or practice
2. WHEN listing skills for a project, THEN the system SHALL ensure skills are directly relevant to the target career role
3. WHEN listing skills for a project, THEN the system SHALL use concise skill names (1-4 words each)

### Requirement 4

**User Story:** As a system administrator, I want the suggested projects feature to gracefully handle AI service failures, so that users always receive useful project recommendations.

#### Acceptance Criteria

1. WHEN OpenRouter fails to generate suggested projects, THEN the system SHALL attempt to use Gemini as a fallback
2. WHEN both OpenRouter and Gemini fail, THEN the system SHALL return role-appropriate static fallback projects
3. WHEN using fallback projects, THEN the system SHALL customize project titles and descriptions to include the role name

### Requirement 5

**User Story:** As a frontend developer, I want the suggested projects data to follow a consistent structure, so that I can reliably render the projects in the UI.

#### Acceptance Criteria

1. WHEN the API returns suggested projects, THEN the system SHALL include the projects in a "suggestedProjects" array within the response data object
2. WHEN returning project data, THEN the system SHALL ensure each project object contains exactly these fields: title (string), description (string), difficulty (string), skills (string array)
3. WHEN serializing the response, THEN the system SHALL return valid JSON that can be parsed by standard JSON parsers
