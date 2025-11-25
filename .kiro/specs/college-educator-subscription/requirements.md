# Requirements Document

## Introduction

This feature enhances the subscription purchase flow for college educators by enabling them to select from a list of colleges instead of schools during the signup process. Currently, the educator signup modal only displays schools from the `schools` table, but college educators need to be able to select from the `colleges` table.

## Glossary

- **Educator**: A teaching professional who can be associated with either a school or a college
- **College Educator**: An educator who works at a college institution
- **School Educator**: An educator who works at a school institution
- **Subscription Flow**: The process of selecting a plan, signing up, and purchasing a subscription
- **Entity Type**: The type of institution (school or college) that an educator is associated with
- **EducatorSignupModal**: The React component that handles educator registration
- **educatorAuthService**: The service layer that handles educator authentication and data operations

## Requirements

### Requirement 1

**User Story:** As a college educator, I want to select my college from a dropdown during signup, so that I can be properly associated with my institution.

#### Acceptance Criteria

1. WHEN a college educator accesses the signup modal from the `/subscription/plans/college-educator` route THEN the system SHALL display a dropdown populated with colleges from the `colleges` table
2. WHEN the colleges dropdown is displayed THEN the system SHALL show college name, city, state, and country for each option
3. WHEN a college educator selects a college THEN the system SHALL store the selected college ID in the educator profile
4. WHEN the signup form is submitted THEN the system SHALL create an educator record with entity_type set to 'college'
5. WHEN the colleges are loaded THEN the system SHALL order them alphabetically by name

### Requirement 2

**User Story:** As a school educator, I want to continue selecting my school from a dropdown during signup, so that the existing functionality remains unchanged.

#### Acceptance Criteria

1. WHEN a school educator accesses the signup modal from the `/subscription/plans/school-educator` or `/subscription/plans/educator` route THEN the system SHALL display a dropdown populated with schools from the `schools` table
2. WHEN the schools dropdown is displayed THEN the system SHALL show school name, city, state, and country for each option
3. WHEN a school educator selects a school THEN the system SHALL store the selected school ID in the educator profile
4. WHEN the signup form is submitted THEN the system SHALL create an educator record with entity_type set to 'school'

### Requirement 3

**User Story:** As a developer, I want the educator signup modal to dynamically determine which entity type to use based on the route, so that the component can handle both school and college educators.

#### Acceptance Criteria

1. WHEN the EducatorSignupModal component receives a studentType prop THEN the system SHALL parse it to determine the entity type
2. WHEN the entity type is 'college' THEN the system SHALL fetch colleges from the `colleges` table
3. WHEN the entity type is 'school' THEN the system SHALL fetch schools from the `schools` table
4. WHEN the entity type cannot be determined THEN the system SHALL default to 'school'

### Requirement 4

**User Story:** As a developer, I want to add a getColleges function to the educatorAuthService, so that I can fetch colleges in the same way I fetch schools.

#### Acceptance Criteria

1. WHEN the getColleges function is called THEN the system SHALL query the `colleges` table
2. WHEN colleges are fetched THEN the system SHALL select id, name, city, state, and country fields
3. WHEN colleges are fetched THEN the system SHALL order them alphabetically by name
4. WHEN the query succeeds THEN the system SHALL return a success response with the colleges data
5. WHEN the query fails THEN the system SHALL return an error response with the error message

### Requirement 5

**User Story:** As a college educator, I want clear visual indication that I'm signing up as a college educator, so that I can confirm I'm in the right signup flow.

#### Acceptance Criteria

1. WHEN a college educator views the signup modal THEN the system SHALL display "College Educator" in the modal title or header
2. WHEN a school educator views the signup modal THEN the system SHALL display "School Educator" in the modal title or header
3. WHEN the dropdown label is displayed for college educators THEN the system SHALL show "Select Your College"
4. WHEN the dropdown label is displayed for school educators THEN the system SHALL show "Select Your School"
