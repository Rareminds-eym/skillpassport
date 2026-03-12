# Implementation Plan: Digital Passport Profile Completion Prompt

## Overview

This implementation plan breaks down the Digital Passport Profile Completion Prompt feature into discrete, incremental coding tasks. The implementation will use TypeScript/React and integrate with existing hooks (usePortfolio, useTheme) and libraries (react-hot-toast, framer-motion). Each task builds on previous work to create a fully functional profile completion prompt system.

## Tasks

- [x] 1. Create profile completeness checker utility
  - Create `src/utils/profileCompletenessChecker.ts` file
  - Implement `checkProfileCompleteness` function that accepts student data
  - Check all 8 profile sections: Personal Info, Education, Skills, Languages, Projects, Achievements, Hobbies, Interests
  - Return object with `incompleteSections` array and `isComplete` boolean
  - Add development mode logging for check results
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1_

- [ ]* 1.1 Write property test for completeness checker
  - **Property 1: Profile completeness check identifies all incomplete sections**
  - **Validates: Requirements 1.2, 1.5**
  - Generate random student profiles with various incomplete sections
  - Verify all empty sections are correctly identified
  - Run 100+ iterations with fast-check

- [ ]* 1.2 Write property test for complete sections
  - **Property 2: Profile completeness check identifies all complete sections**
  - **Validates: Requirements 1.3**
  - Generate random student profiles with complete sections
  - Verify complete sections are NOT flagged as incomplete
  - Run 100+ iterations

- [ ]* 1.3 Write unit tests for completeness checker edge cases
  - Test with null/undefined student data
  - Test with empty profile object
  - Test with fully complete profile
  - Test with partially complete profile
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Create localStorage preference manager
  - Create `src/utils/profilePromptPreference.ts` file
  - Implement `getPromptDismissed(userId: string): boolean` function
  - Implement `setPromptDismissed(userId: string, dismissed: boolean): void` function
  - Use key format: `digitalPassport_completionPrompt_dismissed_${userId}`
  - Add try-catch for localStorage errors
  - Add development mode logging for storage operations
  - _Requirements: 5.1, 5.2, 5.3, 5.5, 7.4_

- [ ]* 2.1 Write property test for user-specific keys
  - **Property 10: Dismissal preference is user-specific**
  - **Validates: Requirements 5.5**
  - Generate random pairs of user IDs
  - Verify localStorage keys are unique for each user
  - Run 100+ iterations

- [ ]* 2.2 Write unit tests for localStorage operations
  - Test getPromptDismissed with existing preference
  - Test getPromptDismissed with no preference
  - Test setPromptDismissed writes correct value
  - Test error handling when localStorage unavailable
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 3. Create ProfileCompletionModal component
  - Create `src/components/digital-pp/ProfileCompletionModal.tsx` file
  - Define `ProfileCompletionModalProps` interface
  - Implement modal with backdrop using framer-motion AnimatePresence
  - Add modal header with title
  - Add incomplete sections list display
  - Add three action buttons: "Complete Now", "Skip for now", "Never show this again"
  - Implement click outside to close
  - Implement Escape key to close
  - Add ARIA attributes for accessibility (role="dialog", aria-modal="true")
  - _Requirements: 3.1, 3.2, 3.6, 4.1, 4.2, 4.3, 4.7_

- [ ]* 3.1 Write unit tests for modal component
  - Test modal renders when isOpen is true
  - Test modal does not render when isOpen is false
  - Test all three buttons are present
  - Test incomplete sections are displayed
  - Test onComplete handler is called on button click
  - Test onSkip handler is called on button click
  - Test onNeverShow handler is called on button click
  - Test onClose handler is called on backdrop click
  - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.3, 4.7_

- [x] 4. Add theme-aware styling to modal
  - Import useTheme hook from ThemeContext
  - Apply light mode styles: white background, gray text, blue accents
  - Apply dark mode styles using Tailwind `dark:` classes
  - Ensure proper contrast in both modes
  - Test color transitions when theme changes
  - _Requirements: 3.3, 3.4, 3.5_

- [ ]* 4.1 Write property test for theme styling
  - **Property 6: Modal styling adapts to theme mode**
  - **Validates: Requirements 3.3**
  - Generate random theme states (light/dark)
  - Verify appropriate CSS classes are applied
  - Run 100+ iterations

- [ ]* 4.2 Write integration test for theme switching
  - Render modal in light mode
  - Switch to dark mode
  - Verify styles update correctly
  - Switch back to light mode
  - Verify styles revert correctly
  - _Requirements: 3.3, 3.4, 3.5_

- [x] 5. Create useProfileCompletionPrompt custom hook
  - Create `src/hooks/useProfileCompletionPrompt.ts` file
  - Import usePortfolio to get student data
  - Import useTheme for theme awareness
  - Import checkProfileCompleteness utility
  - Import localStorage preference functions
  - Implement logic to determine if modal should show
  - Return showModal state, incompleteSections, and action handlers
  - Add development mode logging for modal display decisions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.2_

- [ ]* 5.1 Write property test for modal display logic
  - **Property 3: Modal displays when user has not dismissed and profile is incomplete**
  - **Validates: Requirements 2.2, 2.4**
  - Generate random user states without dismissal preference
  - Generate incomplete profiles
  - Verify modal shows
  - Run 100+ iterations

- [ ]* 5.2 Write property test for dismissed preference
  - **Property 4: Modal does not display when user has dismissed permanently**
  - **Validates: Requirements 2.3**
  - Generate random user states with dismissal preference
  - Verify modal does NOT show regardless of profile state
  - Run 100+ iterations

- [ ]* 5.3 Write unit tests for hook logic
  - Test hook with incomplete profile and no dismissal
  - Test hook with incomplete profile and dismissal set
  - Test hook with complete profile
  - Test hook with null student data
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 6. Implement action handlers in hook
  - Implement handleComplete: closes modal, no localStorage write
  - Implement handleSkip: closes modal, no localStorage write
  - Implement handleNeverShow: closes modal, writes dismissal to localStorage
  - Implement handleClose: closes modal (for backdrop/Escape)
  - Add development mode logging for user actions
  - _Requirements: 4.4, 4.5, 4.6, 7.3_

- [ ]* 6.1 Write property test for Complete Now button
  - **Property 7: Complete Now button closes modal without preference change**
  - **Validates: Requirements 4.4**
  - Generate random modal states
  - Call handleComplete
  - Verify modal closes and localStorage unchanged
  - Run 100+ iterations

- [ ]* 6.2 Write property test for Skip button
  - **Property 8: Skip button closes modal without preference change**
  - **Validates: Requirements 4.5**
  - Generate random modal states
  - Call handleSkip
  - Verify modal closes and localStorage unchanged
  - Run 100+ iterations

- [ ]* 6.3 Write property test for Never Show button
  - **Property 9: Never show again button stores dismissal preference**
  - **Validates: Requirements 4.6, 5.1**
  - Generate random user IDs
  - Call handleNeverShow
  - Verify localStorage contains dismissal preference
  - Run 100+ iterations

- [x] 7. Integrate modal into PassportPage component
  - Open `src/pages/digital-pp/PassportPage.tsx`
  - Import ProfileCompletionModal component
  - Import useProfileCompletionPrompt hook
  - Call hook to get modal state and handlers
  - Render ProfileCompletionModal with appropriate props
  - Ensure modal renders after page content (z-index layering)
  - _Requirements: 2.1, 8.1, 8.2, 8.5_

- [ ]* 7.1 Write property test for page load check
  - **Property 14: Completeness check runs on page load**
  - **Validates: Requirements 8.2**
  - Mount PassportPage component
  - Verify checkProfileCompleteness is called
  - Run 100+ iterations with different data states

- [ ]* 7.2 Write property test for check timing
  - **Property 15: Check completes before modal display**
  - **Validates: Requirements 8.3**
  - Mount PassportPage component
  - Verify completeness check finishes before modal state is set
  - Run 100+ iterations

- [ ]* 7.3 Write integration test for modal display on page load
  - Mount PassportPage with incomplete profile
  - Verify modal appears
  - Mount PassportPage with dismissal preference
  - Verify modal does NOT appear
  - Mount PassportPage with complete profile
  - Verify modal does NOT appear
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 8.2_

- [x] 8. Add toast notifications for profile updates
  - Identify profile update functions in existing code
  - Import toast from react-hot-toast
  - Add toast.success() calls after successful updates
  - Configure toast styling based on theme
  - Use theme-aware background and text colors
  - _Requirements: 6.1, 6.2, 6.4_

- [ ]* 8.1 Write property test for toast triggering
  - **Property 12: Profile updates trigger toast notifications**
  - **Validates: Requirements 6.1**
  - Generate random profile updates
  - Verify toast is called after each update
  - Run 100+ iterations

- [ ]* 8.2 Write property test for toast theme styling
  - **Property 13: Toast notifications adapt to theme**
  - **Validates: Requirements 6.4**
  - Generate random theme states
  - Trigger toast
  - Verify toast uses theme-appropriate styling
  - Run 100+ iterations

- [x] 9. Add error boundaries and error handling
  - Wrap ProfileCompletionModal in error boundary
  - Add try-catch blocks around localStorage operations
  - Handle null/undefined student data gracefully
  - Add fallback UI for modal render errors
  - Log errors in development mode
  - _Requirements: Error Handling section_

- [ ]* 9.1 Write unit tests for error scenarios
  - Test with localStorage unavailable
  - Test with malformed student data
  - Test with null student data
  - Test with missing ThemeContext
  - Verify graceful degradation in all cases

- [ ] 10. Checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property tests and verify they pass
  - Run all integration tests and verify they pass
  - Fix any failing tests
  - Ensure no console errors in development mode
  - Ask the user if questions arise

- [ ] 11. Add accessibility features
  - Implement focus trap within modal
  - Set initial focus to first button when modal opens
  - Return focus to trigger element when modal closes
  - Add aria-label to modal
  - Add aria-describedby for incomplete sections list
  - Test keyboard navigation (Tab, Shift+Tab, Escape)
  - _Requirements: Accessibility section_

- [ ]* 11.1 Write integration tests for accessibility
  - Test Tab key moves focus through buttons
  - Test Escape key closes modal
  - Test focus returns after modal closes
  - Test screen reader announcements
  - Verify ARIA attributes are present

- [ ] 12. Performance optimization
  - Add useMemo for profile completeness check results
  - Add React.memo to ProfileCompletionModal if needed
  - Ensure modal doesn't cause unnecessary re-renders
  - Test performance with React DevTools Profiler
  - _Requirements: Performance Considerations section_

- [ ]* 12.1 Write performance tests
  - Measure completeness check execution time
  - Verify memoization prevents recalculation
  - Test render count during theme switches
  - Ensure modal doesn't block page rendering

- [ ] 13. Manual testing and polish
  - Test complete user flow in browser
  - Test in light mode and dark mode
  - Test on mobile viewport
  - Test with various profile completion states
  - Test localStorage persistence across sessions
  - Verify animations are smooth
  - Check console for any warnings or errors
  - Test with screen reader (if available)
  - _Requirements: Manual Testing Checklist_

- [ ] 14. Final checkpoint - Production readiness
  - Build application for production
  - Verify no console logs appear in production build
  - Test production build in browser
  - Verify all features work correctly
  - Ensure no TypeScript errors
  - Ensure no linting errors
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate component interactions
- The implementation uses TypeScript/React with existing patterns from the codebase
- All code should follow existing code style and conventions
- Development mode logging uses `import.meta.env.DEV` or `process.env.NODE_ENV`
