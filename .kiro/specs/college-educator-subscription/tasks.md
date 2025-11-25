# Implementation Plan

- [x] 1. Add getColleges function to educatorAuthService
  - Create getColleges function that queries the `colleges` table
  - Select id, name, city, state, and country fields
  - Order results alphabetically by name
  - Return standardized response format matching getSchools
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 1.1 Write unit tests for getColleges function
  - Test successful fetch returns formatted data
  - Test error handling returns error response
  - Test empty result returns empty array
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 2. Update EducatorSignupModal to support entity type detection
  - Add parseEntityType helper function to extract entity from studentType prop
  - Add entityType state variable derived from studentType
  - Update component to accept and use studentType prop
  - Default to 'school' when entity type cannot be determined
  - _Requirements: 3.1, 3.4_

- [ ]* 2.1 Write unit tests for parseEntityType function
  - Test "college-educator" returns "college"
  - Test "school-educator" returns "school"
  - Test "educator" returns "school" (default)
  - Test invalid input returns "school" (default)
  - _Requirements: 3.1, 3.4_

- [ ] 3. Update EducatorSignupModal to fetch appropriate institutions
  - Modify fetchInstitutions to call getColleges when entityType is 'college'
  - Modify fetchInstitutions to call getSchools when entityType is 'school'
  - Update state to store fetched institutions
  - Handle loading and error states for both entity types
  - _Requirements: 3.2, 3.3_

- [ ]* 3.1 Write property test for entity type determines data source
  - **Property 1: Entity type determines data source**
  - **Validates: Requirements 3.2, 3.3**

- [ ] 4. Update EducatorSignupModal UI labels dynamically
  - Update modal title to show "College Educator" or "School Educator" based on entityType
  - Update dropdown label to show "Select Your College" or "Select Your School"
  - Update placeholder text to match entity type
  - Ensure all UI text references correct entity type
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 4.1 Write property test for UI label consistency
  - **Property 5: UI label consistency**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [x] 5. Update EducatorSignupModal form submission
  - Set entity_type to 'college' when college is selected
  - Set entity_type to 'school' when school is selected
  - Store college_id when entity type is 'college'
  - Store school_id when entity type is 'school'
  - Ensure only one institution ID is set (not both)
  - _Requirements: 1.3, 1.4, 2.3, 2.4_

- [ ]* 5.1 Write property test for entity type consistency
  - **Property 2: Entity type consistency**
  - **Validates: Requirements 1.4, 2.4**

- [ ] 6. Update form validation
  - Validate that an institution is selected before submission
  - Display appropriate error message if no institution selected
  - Ensure validation works for both schools and colleges
  - _Requirements: 1.3, 2.3_

- [ ]* 6.1 Write unit tests for form validation
  - Test that institution selection is required
  - Test that form cannot be submitted without institution
  - Test validation error message displays correctly
  - _Requirements: 1.3, 2.3_

- [ ]* 7. Write property test for institution data completeness
  - **Property 3: Institution data completeness**
  - **Validates: Requirements 1.2, 2.2, 4.2**

- [ ]* 8. Write property test for alphabetical ordering
  - **Property 4: Alphabetical ordering**
  - **Validates: Requirements 1.5, 4.3**

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Test the complete flow manually
  - Test college educator signup from /subscription/plans/college-educator
  - Test school educator signup from /subscription/plans/school-educator
  - Verify correct institutions are displayed in each flow
  - Verify correct entity_type is saved in database
  - Verify UI labels are correct for each entity type
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 5.1, 5.2, 5.3, 5.4_
