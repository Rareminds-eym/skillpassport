# Design Document

## Overview

This design extends the educator subscription flow to support both school and college educators by making the EducatorSignupModal component entity-aware. The component will dynamically fetch and display either schools or colleges based on the route context, ensuring proper association between educators and their institutions.

## Architecture

The solution follows a layered architecture:

1. **Presentation Layer**: EducatorSignupModal component with conditional rendering
2. **Service Layer**: educatorAuthService with new getColleges function
3. **Data Layer**: Supabase queries to `schools` and `colleges` tables

The component will receive entity type information through props and use it to determine which data to fetch and how to label UI elements.

## Components and Interfaces

### EducatorSignupModal Component

**Props:**
- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Callback when modal closes
- `selectedPlan: object` - The subscription plan selected
- `onSignupSuccess: () => void` - Callback on successful signup
- `onSwitchToLogin: () => void` - Callback to switch to login modal
- `studentType: string` - The type from URL (e.g., "college-educator", "school-educator")

**State:**
- `entityType: 'school' | 'college'` - Derived from studentType prop
- `institutions: Array` - Either schools or colleges based on entityType
- `loadingInstitutions: boolean` - Loading state for institution fetch

**Key Methods:**
- `parseEntityType(studentType)` - Extracts entity type from studentType string
- `fetchInstitutions(entityType)` - Fetches appropriate institutions based on type
- `handleSubmit()` - Creates educator with correct entity_type

### educatorAuthService

**New Function:**
```javascript
/**
 * Get all colleges for dropdown selection
 * @returns {Promise<{ success: boolean, data: Array | null, error: string | null }>}
 */
export const getColleges = async () => {
    // Query colleges table
    // Return formatted response
}
```

**Existing Function (for reference):**
```javascript
export const getSchools = async () => {
    // Already implemented
}
```

## Data Models

### Institution Selection Data
```javascript
{
    id: string,           // UUID of school or college
    name: string,         // Institution name
    city: string,         // City location
    state: string,        // State location
    country: string       // Country location
}
```

### Educator Profile Data
```javascript
{
    user_id: string,      // FK to auth.users
    first_name: string,
    last_name: string,
    email: string,
    phone: string,
    school_id: string | null,    // FK to schools (if school educator)
    college_id: string | null,   // FK to colleges (if college educator)
    entity_type: 'school' | 'college',
    // ... other fields
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Entity type determines data source

*For any* educator signup flow, when the entity type is 'college', the system should fetch data from the `colleges` table, and when the entity type is 'school', the system should fetch data from the `schools` table.

**Validates: Requirements 3.2, 3.3**

### Property 2: Entity type consistency

*For any* educator signup, the entity_type stored in the educator profile should match the type of institution selected (school ID implies entity_type='school', college ID implies entity_type='college').

**Validates: Requirements 1.4, 2.4**

### Property 3: Institution data completeness

*For any* institution fetched (school or college), the returned data should include all required fields: id, name, city, state, and country.

**Validates: Requirements 1.2, 2.2, 4.2**

### Property 4: Alphabetical ordering

*For any* list of institutions fetched, the results should be ordered alphabetically by name in ascending order.

**Validates: Requirements 1.5, 4.3**

### Property 5: UI label consistency

*For any* educator signup modal, when entity type is 'college', all UI labels should reference "college", and when entity type is 'school', all UI labels should reference "school".

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

## Error Handling

### Institution Fetch Failures
- Display user-friendly error message in the modal
- Provide retry mechanism
- Log errors to console for debugging
- Gracefully degrade to empty dropdown with explanation

### Invalid Entity Type
- Default to 'school' entity type
- Log warning to console
- Continue with school flow

### Missing Institution Selection
- Validate that an institution is selected before form submission
- Display validation error message
- Prevent form submission until resolved

### Database Constraint Violations
- Handle unique constraint violations on email
- Display appropriate error messages
- Suggest login if account already exists

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **parseEntityType function**
   - Test with "college-educator" returns "college"
   - Test with "school-educator" returns "school"
   - Test with "educator" returns "school" (default)
   - Test with invalid input returns "school" (default)

2. **getColleges service function**
   - Test successful fetch returns formatted data
   - Test error handling returns error response
   - Test empty result returns empty array

3. **Form validation**
   - Test that institution selection is required
   - Test that form cannot be submitted without institution

### Property-Based Tests

Property-based tests will verify universal properties across all inputs using a PBT library (fast-check for JavaScript):

1. **Property 1: Entity type determines data source**
   - Generate random entity types ('school' or 'college')
   - Verify correct fetch function is called
   - Verify correct table is queried

2. **Property 2: Entity type consistency**
   - Generate random educator profiles with institution IDs
   - Verify entity_type matches institution type
   - Verify school_id is set only when entity_type='school'
   - Verify college_id is set only when entity_type='college'

3. **Property 3: Institution data completeness**
   - Generate random institution queries
   - Verify all returned objects have required fields
   - Verify no null values in required fields

4. **Property 4: Alphabetical ordering**
   - Generate random lists of institutions
   - Verify returned list is sorted alphabetically by name
   - Verify sort is case-insensitive

5. **Property 5: UI label consistency**
   - Generate random entity types
   - Verify all UI labels contain correct entity name
   - Verify no mixed terminology (e.g., "school" when entity is "college")

### Integration Tests

Integration tests will verify the complete flow:

1. Test college educator signup flow end-to-end
2. Test school educator signup flow end-to-end
3. Test switching between entity types
4. Test error recovery scenarios

### Testing Configuration

- Property-based tests should run a minimum of 100 iterations
- Each property-based test must be tagged with: `**Feature: college-educator-subscription, Property {number}: {property_text}**`
- Each correctness property must be implemented by a single property-based test
