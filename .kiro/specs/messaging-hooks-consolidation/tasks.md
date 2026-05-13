# Implementation Plan: Messaging Hooks Consolidation

## Overview

This plan consolidates 42 messaging-related hooks into a unified system with 1 base hook + 4 role-specific wrappers. The implementation eliminates ~4500+ lines of duplicate code, removes the duplicate store file, and establishes three-layer cache coordination (MessageService, React Query, Zustand) with 10 correctness properties for validation.

## Tasks

- [x] 1. Phase 1: Core Infrastructure Setup
  - [x] 1.1 Create type definitions in features/messaging/api/types.ts
    - Define UserRole, ConversationType, AdminRole types
    - Define Message and Conversation interfaces
    - Add backward compatibility type aliases (CollegeLecturer = 'college_educator')
    - Export all types through features/messaging/api/index.ts
    - _Requirements: 10.1, 10.2, 10.5, 10.7, 23.1, 23.2_
  
  - [x] 1.2 Update Query Key Factory in shared/lib/queryKeys.ts
    - Add queryKeys.messages.conversation(conversationId) factory
    - Add queryKeys.messages.conversations(userId, userRole, conversationType) factory
    - Add queryKeys.messages.unreadCount(userId, userRole) factory
    - Replace hardcoded query key strings throughout codebase
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.8_
  
  - [x] 1.3 Enhance MessageStore in features/messaging/model/useMessageStore.ts
    - Add isDuplicateMessage(messageId) method for centralized duplicate detection
    - Add addOptimisticMessage(message) method returning temp ID
    - Add removeOptimisticMessage(tempId) method
    - Add proper TypeScript types for all state and methods
    - Add selectors for efficient component subscriptions
    - Ensure unreadCount never goes negative (decrementUnreadCount validation)
    - _Requirements: 1.5, 1.6, 1.8, 20.1, 20.2, 20.6, 8.7_
  
  - [x] 1.4 Remove duplicate store and update imports
    - Delete src/stores/useMessageStore.ts (exact duplicate)
    - Find all imports from @/stores/useMessageStore using grepSearch
    - Update all imports to @/features/messaging/model/useMessageStore
    - Verify no compilation errors after import updates
    - _Requirements: 1.2, 1.3, 16.1, 16.2, 16.3_

- [x] 2. Phase 2: Base Hook Implementation
  - [x] 2.1 Implement useMessages base hook core structure
    - Create features/messaging/model/useMessages.ts
    - Define UseMessagesOptions interface (userId, userRole, conversationId, conversationType, enableRealtime, enabled)
    - Define UseMessagesReturn interface with all data, loading states, mutations, and errors
    - Accept userId and userRole parameters for role-agnostic operation
    - Support all UserRole types (learner, recruiter, educator, college_educator, school_admin, college_admin, university_admin)
    - _Requirements: 2.1, 2.2, 2.3, 2.8_
  
  - [x] 2.2 Implement React Query queries in useMessages
    - Implement messages query using queryKeys.messages.conversation()
    - Implement conversations query using queryKeys.messages.conversations()
    - Implement unread count query using queryKeys.messages.unreadCount()
    - Configure staleTime: 60000 (1 minute) and gcTime: 600000 (10 minutes)
    - Handle Admin_Role unread count fields (admin_unread_count, college_admin_unread_count)
    - Support conversationType filter ('all' or specific ConversationType)
    - _Requirements: 2.3, 2.6, 3.2, 3.3, 3.5, 12.1_
  
  - [x] 2.3 Implement sendMessage mutation with optimistic updates
    - Create sendMessage mutation accepting SendMessageParams
    - Generate temporary ID format: temp_${Date.now()}
    - Check for duplicate sends (same sender, text, within 1 second window)
    - Add optimistic message to Zustand store via addOptimisticMessage()
    - Update React Query cache with optimistic message
    - Send to MessageService.sendMessage()
    - Replace optimistic with real message on success
    - Rollback optimistic message on error (remove from all caches)
    - Invalidate conversations list query after successful send
    - _Requirements: 2.4, 2.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ]* 2.4 Write property test for optimistic update consistency
    - **Property 2: Optimistic Update Consistency**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - Generate random message sends with optimistic updates
    - Verify message content remains identical except ID and timestamps
    - Test rollback on server errors removes optimistic message completely
  
  - [ ]* 2.5 Write property test for optimistic update rollback
    - **Property 8: Optimistic Update Rollback Completeness**
    - **Validates: Requirements 5.3, 5.4**
    - Simulate message send failures (network, 400, 500 errors)
    - Verify optimistic message removed from MessageStore
    - Verify optimistic message removed from React Query cache
  
  - [x] 2.6 Implement markAsRead and clearUnreadCount mutations
    - Create markAsRead mutation accepting conversationId
    - Optimistically update unread count in React Query cache
    - Call MessageService.markConversationAsRead()
    - Handle Admin_Role unread count fields correctly
    - Implement clearUnreadCount method (not useRef pattern)
    - Invalidate unread count query after successful mark
    - _Requirements: 2.7, 8.3, 8.4, 21.1, 21.2, 21.3, 21.4, 21.6_
  
  - [x] 2.7 Implement createConversation mutation
    - Create createConversation mutation accepting CreateConversationParams
    - Support all conversation types (learner_recruiter, learner_educator, etc.)
    - Call MessageService.getOrCreateConversation()
    - Return existing conversation if already exists between users
    - Invalidate conversations list query after successful creation
    - _Requirements: 2.7, 25.1, 25.2, 25.3, 25.6, 25.7_
  
  - [x] 2.8 Implement real-time subscription setup
    - Setup subscription when conversationId provided and enableRealtime=true
    - Call MessageService.subscribeToConversation()
    - Check for duplicates using messageStore.isDuplicateMessage()
    - Update React Query cache with new messages
    - Update Zustand store if current conversation matches
    - Increment unread count for messages to current user
    - Cleanup subscription on unmount or conversationId change
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 20.3_
  
  - [ ]* 2.9 Write property test for real-time subscription idempotency
    - **Property 5: Real-Time Subscription Idempotency**
    - **Validates: Requirements 4.1, 20.3**
    - Simulate duplicate real-time message deliveries (2-10 duplicates)
    - Verify only one message with each ID exists in store
    - Test with optimistic updates in progress
  
  - [x] 2.10 Implement cache coordination logic
    - Coordinate MessageService Map cache with React Query cache
    - Coordinate React Query cache with Zustand store
    - Define invalidation rules: sendMessage invalidates conversation messages
    - Define invalidation rules: markAsRead updates unread count in all layers
    - Define invalidation rules: deleteConversation invalidates conversations list
    - Clear MessageService cache on mutations
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.6_
  
  - [ ]* 2.11 Write property test for cache coordination consistency
    - **Property 4: Cache Coordination Consistency**
    - **Validates: Requirements 19.1, 19.2, 19.3, 19.4**
    - Execute random mutations (send, read, delete)
    - Verify all three cache layers contain consistent data
    - Test with different cache states (empty, stale, fresh)
  
  - [x] 2.12 Add comprehensive error handling
    - Handle network errors with user-friendly messages
    - Handle validation errors with specific messages
    - Handle subscription failures with reconnection attempts
    - Expose errors through messagesError, conversationsError, unreadCountError
    - Log errors to console for debugging
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 3. Checkpoint - Verify base hook functionality
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Phase 3: Role-Specific Wrapper Hooks
  - [x] 4.1 Implement useStudentMessages wrapper
    - Create features/messaging/model/useStudentMessages.ts
    - Accept learnerId and optional UseMessagesOptions (omit userId, userRole)
    - Delegate to useMessages with userRole='learner'
    - Export through features/messaging/model/index.ts
    - _Requirements: 7.1, 7.5, 7.6_
  
  - [x] 4.2 Implement useEducatorMessages wrapper
    - Create features/messaging/model/useEducatorMessages.ts
    - Accept educatorId and optional UseMessagesOptions (omit userId, userRole)
    - Delegate to useMessages with userRole='educator'
    - Export through features/messaging/model/index.ts
    - _Requirements: 7.2, 7.5, 7.6_
  
  - [x] 4.3 Implement useRecruiterMessages wrapper
    - Create features/messaging/model/useRecruiterMessages.ts
    - Accept recruiterId and optional UseMessagesOptions (omit userId, userRole)
    - Delegate to useMessages with userRole='recruiter'
    - Export through features/messaging/model/index.ts
    - _Requirements: 7.3, 7.5, 7.6_
  
  - [x] 4.4 Implement useAdminMessages wrapper
    - Create features/messaging/model/useAdminMessages.ts
    - Accept adminId, adminRole (AdminRole), and optional UseMessagesOptions
    - Delegate to useMessages with provided adminRole
    - Support school_admin, college_admin, university_admin
    - Export through features/messaging/model/index.ts
    - _Requirements: 7.4, 7.5, 7.6_
  
  - [x] 4.5 Implement useConversationActions hook
    - Create features/messaging/model/useConversationActions.ts
    - Accept userId and userRole parameters
    - Implement archiveConversation mutation (set archived_by_{role}=true)
    - Implement unarchiveConversation mutation (set archived_by_{role}=false)
    - Implement deleteConversation mutation (set deleted_by_{role}=true)
    - Implement restoreConversation mutation (set deleted_by_{role}=false)
    - Invalidate conversations list query after each action
    - Export through features/messaging/model/index.ts
    - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5, 26.7, 22.1, 22.2, 22.3, 22.5_
  
  - [x] 4.6 Update useTypingIndicator to use new types
    - Update features/messaging/model/useTypingIndicator.ts
    - Use UserRole and ConversationType from features/messaging/api/types
    - Debounce typing broadcasts to once per 2 seconds
    - Auto-clear typing indicator after 3 seconds
    - _Requirements: 17.2, 17.3, 17.4, 17.5_
  
  - [x] 4.7 Update useMessageNotifications to use new types
    - Update features/messaging/model/useMessageNotifications.ts
    - Use Message and Conversation types from features/messaging/api/types
    - Emit notification events for new messages
    - Do not emit notifications for messages sent by current user
    - Support enable/disable via hook parameter
    - _Requirements: 18.2, 18.3, 18.4, 18.5_

- [x] 5. Phase 4: Component Migration
  - [x] 5.1 Migrate learner components to new hooks
    - Find all learner components using old messaging hooks
    - Update imports to use useStudentMessages from @/features/messaging
    - Replace old hook calls with new hook API
    - Test messaging functionality (send, receive, read)
    - Verify real-time updates work correctly
    - _Requirements: 11.1, 11.2, 27.4_
  
  - [x] 5.2 Migrate educator components to new hooks
    - Find all educator components using old messaging hooks
    - Update imports to use useEducatorMessages from @/features/messaging
    - Replace old hook calls with new hook API
    - Test messaging functionality (send, receive, read)
    - Verify real-time updates work correctly
    - _Requirements: 11.1, 11.2, 27.4_
  
  - [x] 5.3 Migrate recruiter components to new hooks
    - Find all recruiter components using old messaging hooks
    - Update imports to use useRecruiterMessages from @/features/messaging
    - Replace old hook calls with new hook API
    - Test messaging functionality (send, receive, read)
    - Verify real-time updates work correctly
    - _Requirements: 11.1, 11.2, 27.4_
  
  - [x] 5.4 Migrate admin components to new hooks
    - Find all admin components using old messaging hooks
    - Update imports to use useAdminMessages from @/features/messaging
    - Replace old hook calls with new hook API
    - Test messaging functionality (send, receive, read)
    - Verify real-time updates work correctly
    - _Requirements: 11.1, 11.2, 27.4_
  
  - [x] 5.5 Migrate conversation action usages
    - Find all components using old conversation action hooks
    - Update to use useConversationActions from @/features/messaging
    - Replace archive/unarchive/delete/restore calls
    - Test all conversation actions work correctly
    - _Requirements: 26.6, 27.4_

- [x] 6. Checkpoint - Verify component migrations
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Phase 5: Cleanup and Deprecation
  - [x] 7.1 Add deprecation notices to old hooks
    - Add @deprecated JSDoc comments to all 42 old hooks
    - Include migration guide in deprecation notice
    - Show before/after code examples
    - Reference new hook location
    - _Requirements: 11.2, 11.4_
  
  - [x] 7.2 Remove deprecated hooks from features/messaging layer
    - Remove 21 deprecated hooks from features/messaging
    - Remove useMessageStore selectors (useMessages, useConversations, etc.)
    - Remove useCollegeAdminMessages, useCollegeAdminConversations
    - Remove useCollegeLecturerMessages, useCollegeLecturerConversations
    - Remove useCollegeLecturerStudents, useCollegeLecturerConversationActions
    - Remove useCreateCollegeLecturerConversation, useCollegeLecturerSendMessage
    - _Requirements: 11.5, 16.4, 16.6, 28.1, 28.2_
  
  - [x] 7.3 Remove deprecated hooks from educator feature
    - Remove 8 deprecated hooks from educator feature
    - Remove useEducatorMessages (old version)
    - Remove useEducatorAdminMessages
    - Remove useCollegeEducatorAdminMessages, useCollegeEducatorAdminConversations
    - Remove useCollegeEducatorAdminConversationsForEducator, useCollegeEducatorAdminConversationsForAdmin
    - Remove useCollegeEducatorAdminMessagesForEducator, useCollegeEducatorAdminMessagesForAdmin
    - _Requirements: 11.5, 16.4, 16.6_
  
  - [x] 7.4 Remove deprecated hooks from learner-profile and entities layers
    - Remove 1 hook from learner-profile feature (useStudentMessages old version)
    - Remove 17 hooks from entities/learner layer
    - Remove useStudentMessages, useStudentUnreadCount, useStudentConversations
    - Remove useStudentAdminMessages, useStudentAdminConversations, useCreateStudentAdminConversation
    - Remove useStudentCollegeAdminMessages, useStudentCollegeAdminConversations, useCreateStudentCollegeAdminConversation
    - Remove useStudentCollegeLecturerMessages, useStudentCollegeLecturerConversations, useCreateStudentCollegeLecturerConversation
    - Remove useStudentEducatorMessages, useStudentEducatorConversations, useCreateStudentEducatorConversation
    - Remove useStudentMessageNotifications, useConversationStudents
    - _Requirements: 11.5, 16.4, 16.6, 25.5, 27.4_
  
  - [x] 7.5 Remove duplicate hooks from notifications and shared
    - Remove duplicate useMessageNotifications from notifications feature
    - Remove duplicate useTypingIndicator from shared/lib/hooks
    - Keep canonical versions in features/messaging/model
    - _Requirements: 16.4, 16.6_
  
  - [x] 7.6 Update all index.ts exports
    - Update features/messaging/index.ts to export new hooks
    - Remove exports for deprecated hooks
    - Ensure all public APIs exported correctly
    - Verify no broken imports remain
    - _Requirements: 6.6, 10.5_
  
  - [x] 7.7 Run final build verification
    - Run npm run build:dev to verify no compilation errors
    - Check for any remaining import errors
    - Verify all TypeScript types resolve correctly
    - Confirm no runtime errors in development mode
    - _Requirements: 10.6_

- [ ] 8. Phase 6: Property-Based Testing
  - [ ]* 8.1 Write property test for message store uniqueness
    - **Property 1: Message Store Uniqueness**
    - **Validates: Requirements 1.8, 20.1**
    - Generate random sequences of message additions (real and optimistic)
    - Verify no duplicate IDs exist in store after each operation
    - Test with concurrent operations (1-10 simultaneous)
  
  - [ ]* 8.2 Write property test for unread count non-negativity
    - **Property 3: Unread Count Non-Negativity**
    - **Validates: Requirements 8.7**
    - Generate random increment/decrement operations
    - Include edge case: decrement when count is 0
    - Verify count never goes below 0
  
  - [ ]* 8.3 Write property test for conversation type filtering
    - **Property 6: Conversation Type Filtering Correctness**
    - **Validates: Requirements 3.2, 3.3**
    - Generate random conversation lists with mixed types
    - Filter by each conversation type
    - Verify all returned conversations match filter
    - Verify no matching conversations excluded
  
  - [ ]* 8.4 Write property test for role-specific unread count accuracy
    - **Property 7: Role-Specific Unread Count Accuracy**
    - **Validates: Requirements 8.1, 8.2**
    - Generate random message sequences
    - Mark random messages as read
    - Verify unread count equals actual unread messages for user
  
  - [ ]* 8.5 Write property test for conversation sorting consistency
    - **Property 9: Conversation Sorting Consistency**
    - **Validates: Requirements 12.4**
    - Generate random conversation lists with various timestamps
    - Verify sorting by last_message_at descending
    - Test with null/undefined last_message_at values
  
  - [ ]* 8.6 Write property test for duplicate send prevention
    - **Property 10: Duplicate Send Prevention**
    - **Validates: Requirements 5.5**
    - Attempt to send duplicate messages rapidly
    - Verify second send rejected within 1 second window
    - Verify legitimate duplicates allowed after 1 second
  
  - [ ]* 8.7 Write unit tests for useMessages base hook
    - Mock MessageService and React Query
    - Test all query executions
    - Test all mutation executions
    - Test error handling for each operation
  
  - [ ]* 8.8 Write unit tests for MessageStore
    - Test all state mutations
    - Test selectors
    - Test optimistic update methods
    - Test duplicate detection method
  
  - [ ]* 8.9 Write integration tests for cache coordination
    - Test MessageService → React Query synchronization
    - Test React Query → Zustand synchronization
    - Test invalidation cascades across all layers
  
  - [ ]* 8.10 Write integration tests for real-time subscriptions
    - Test message arrival updates all caches
    - Test duplicate prevention during real-time updates
    - Test unread count updates on new messages
  
  - [ ]* 8.11 Write integration tests for optimistic updates
    - Test optimistic message added to all caches
    - Test replacement with real message on success
    - Test rollback on error removes from all caches

- [ ] 9. Final checkpoint - Verify all functionality
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based and unit tests (can be skipped for faster MVP)
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from design
- Component migration should be done incrementally with testing after each role
- The consolidation reduces 42 hooks to 5 hooks and eliminates ~4500+ lines of duplicate code
- All new code uses TypeScript with strict mode compliance
- Cache coordination across three layers (MessageService, React Query, Zustand) is critical
