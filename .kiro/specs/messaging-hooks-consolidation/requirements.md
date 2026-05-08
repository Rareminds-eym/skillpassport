# Requirements Document

## Introduction

This document specifies requirements for consolidating 42 messaging-related hooks across the codebase into a unified, maintainable messaging system. The current implementation suffers from massive code duplication (~4500+ lines), an exact duplicate store file (src/stores/useMessageStore.ts), FSD architecture violations, and inconsistent patterns for optimistic updates, real-time subscriptions, and cache management.

The hooks are distributed across multiple layers:

- Features/Messaging Layer: 21 hooks (useMessageStore, useMessages selector, useConversations selector, useCurrentConversationId selector, useUnreadCount selector, useMessageLoadingStates selector, useCurrentConversation selector, useUnreadMessagesCount selector, useMessages main hook, useConversation, useCollegeAdminMessages, useCollegeAdminConversations, useCollegeLecturerMessages, useCollegeLecturerConversations, useCollegeLecturerStudents, useCollegeLecturerConversationActions, useCreateCollegeLecturerConversation, useCollegeLecturerSendMessage, useUnreadMessagesCount recruiter-specific, useTypingIndicator, useMessageNotifications)
- Educator Feature: 8 hooks (useEducatorMessages, useEducatorAdminMessages, useCollegeEducatorAdminMessages, useCollegeEducatorAdminConversations, useCollegeEducatorAdminConversationsForEducator, useCollegeEducatorAdminConversationsForAdmin, useCollegeEducatorAdminMessagesForEducator, useCollegeEducatorAdminMessagesForAdmin)
- learner Profile Feature: 1 hook (useStudentMessages)
- Entities/learner Layer: 17 hooks (useStudentMessages, useStudentUnreadCount, useStudentConversations, useStudentAdminMessages, useStudentAdminConversations, useCreateStudentAdminConversation, useStudentCollegeAdminMessages, useStudentCollegeAdminConversations, useCreateStudentCollegeAdminConversation, useStudentCollegeLecturerMessages, useStudentCollegeLecturerConversations, useCreateStudentCollegeLecturerConversation, useStudentEducatorMessages, useStudentEducatorConversations, useCreateStudentEducatorConversation, useStudentMessageNotifications, useConversationStudents)
- Notifications Feature: 1 hook (useMessageNotifications - duplicate)
- Shared: 1 hook (useTypingIndicator in shared/lib/hooks - duplicate)
- Stores: 1 duplicate (useMessageStore exact duplicate)

Critical issues identified:

- Three-layer caching with no coordination (MessageService Map cache, React Query cache, Zustand store)
- 15+ duplications of optimistic update pattern
- 20+ duplications of real-time subscription pattern
- 15+ duplications of sendMessage mutation
- 6 conversation creation hooks (useCreate*Conversation pattern)
- Multiple conversation action hooks (archive/unarchive/delete)
- Inconsistent query key patterns (some use queryKeys factory, some use hardcoded strings)
- Duplicate detection logic repeated in every hook
- clearUnreadCount API inconsistency (some use useRef, some return directly)
- Admin role complexity with special unread count fields

## Glossary

- **Messaging_System**: The consolidated messaging infrastructure that handles conversations, messages, and notifications
- **Message_Hook**: A React hook that provides messaging functionality to components
- **Conversation**: A messaging thread between two users (learner-recruiter, learner-educator, learner-admin, etc.)
- **Message_Store**: A Zustand store managing global messaging state
- **Optimistic_Update**: UI update that occurs immediately before server confirmation
- **Real_Time_Subscription**: Supabase subscription that pushes live updates to clients
- **User_Role**: One of: learner, recruiter, educator, college_educator, school_admin, college_admin, university_admin
- **Conversation_Type**: One of: learner_recruiter, learner_educator, educator_recruiter, learner_admin, learner_college_admin, learner_college_educator, educator_admin, college_educator_admin
- **Unread_Count**: Number of unread messages for a user
- **Query_Key_Factory**: Centralized factory for generating React Query cache keys
- **Cache_Layer**: One of three caching systems: MessageService Map cache, React Query cache, or Zustand store
- **Duplicate_Detection**: Logic to prevent the same message from appearing multiple times in the UI
- **Admin_Role**: One of: school_admin, college_admin, university_admin (special handling required for unread counts)
- **FSD_Layer**: Feature-Sliced Design architectural layer (app, pages, widgets, features, entities, shared)
- **Career_Assistant**: Separate AI-powered career conversation system (out of scope)
- **College_Educator**: Canonical term for college-level educators (synonymous with college_lecturer in legacy code)

## Requirements

### Requirement 1: Unified Message Store

**User Story:** As a developer, I want a single source of truth for messaging state, so that I can avoid duplicate stores and inconsistent state management.

#### Acceptance Criteria

1. THE Messaging_System SHALL provide exactly one Message_Store implementation
2. WHEN duplicate Message_Store files exist, THE Messaging_System SHALL keep src/features/messaging/model/useMessageStore.ts and remove src/stores/useMessageStore.ts
3. THE Message_Store SHALL be located in the features/messaging/model layer following FSD architecture
4. THE Message_Store SHALL manage messages, conversations, unread counts, and loading states
5. THE Message_Store SHALL provide optimistic update methods (addOptimisticMessage, removeOptimisticMessage)
6. THE Message_Store SHALL provide selectors for efficient component subscriptions
7. FOR ALL Message_Store operations, state updates SHALL maintain referential stability for unchanged data
8. THE Message_Store SHALL provide centralized Duplicate_Detection logic to prevent duplicate messages

### Requirement 2: Role-Agnostic Base Hook

**User Story:** As a developer, I want a base messaging hook that works for any user role, so that I can eliminate role-specific hook duplication.

#### Acceptance Criteria

1. THE Messaging_System SHALL provide a base hook useMessages that accepts userId and userRole parameters
2. THE base hook SHALL support all User_Role types (learner, recruiter, educator, college_educator, school_admin, college_admin, university_admin)
3. WHEN a component needs messaging functionality, THE base hook SHALL provide messages, conversations, and unread counts
4. THE base hook SHALL implement consistent optimistic updates for all user roles
5. THE base hook SHALL implement consistent real-time subscriptions for all user roles
6. THE base hook SHALL accept optional conversationId and conversationType filters
7. THE base hook SHALL provide sendMessage, markAsRead, and deleteConversation mutations
8. WHEN userRole is an Admin_Role, THE base hook SHALL handle role-specific unread count fields (admin_unread_count, college_admin_unread_count)

### Requirement 3: Type-Safe Conversation Filtering

**User Story:** As a developer, I want type-safe conversation filtering, so that I can avoid TypeScript errors when filtering by conversation type.

#### Acceptance Criteria

1. THE Messaging_System SHALL define a ConversationType union type matching all valid conversation types
2. WHEN "all" is passed as conversationType, THE Messaging_System SHALL return conversations of all types
3. WHEN a specific Conversation_Type is passed, THE Messaging_System SHALL return only conversations of that type
4. THE Messaging_System SHALL reject invalid conversation type values at compile time
5. THE base hook SHALL accept conversationType parameter with type ConversationType | "all" | undefined

### Requirement 4: Consistent Real-Time Subscriptions

**User Story:** As a user, I want real-time message updates, so that I can see new messages immediately without refreshing.

#### Acceptance Criteria

1. WHEN a new message arrives in the current conversation, THE Messaging_System SHALL add it to the messages list immediately
2. WHEN a message is updated in the current conversation, THE Messaging_System SHALL update it in the messages list immediately
3. WHEN a new message arrives for the user, THE Messaging_System SHALL increment the unread count immediately
4. WHEN a message is marked as read, THE Messaging_System SHALL decrement the unread count immediately
5. WHEN a conversation is updated, THE Messaging_System SHALL refresh the conversations list
6. THE Messaging_System SHALL use a single Real_Time_Subscription pattern across all user roles
7. WHEN enableRealtime is false, THE Messaging_System SHALL not establish Real_Time_Subscription connections

### Requirement 5: Consistent Optimistic Updates

**User Story:** As a user, I want immediate feedback when sending messages, so that the UI feels responsive.

#### Acceptance Criteria

1. WHEN a user sends a message, THE Messaging_System SHALL display the message immediately with a temporary ID format `temp_${Date.now()}`
2. WHEN the server confirms the message, THE Messaging_System SHALL replace the optimistic message with the real message
3. WHEN the server rejects the message, THE Messaging_System SHALL remove the optimistic message and display an error
4. THE Messaging_System SHALL use a single optimistic update pattern across all user roles
5. THE Messaging_System SHALL use Duplicate_Detection to prevent duplicate messages when real-time updates arrive during optimistic updates
6. FOR ALL optimistic messages, the temporary ID SHALL be unique and not conflict with real message IDs
7. THE Messaging_System SHALL check for duplicate sends within 1 second window (same messageText, senderId, and timestamp < 1000ms)

### Requirement 6: FSD Architecture Compliance

**User Story:** As a developer, I want messaging hooks to follow FSD architecture, so that the codebase maintains proper layer separation.

#### Acceptance Criteria

1. THE Messaging_System SHALL place the base hook in the features/messaging layer
2. THE Messaging_System SHALL place the Message_Store in the shared/model layer
3. THE Messaging_System SHALL place message types and interfaces in the shared/api layer
4. WHEN entities layer needs messaging, THE entities layer SHALL import from features layer (allowed FSD pattern)
5. THE Messaging_System SHALL NOT import from features layer into shared layer
6. THE Messaging_System SHALL export all public APIs through index.ts barrel files
7. THE Messaging_System SHALL remove all TODO comments about FSD violations after consolidation

### Requirement 7: Role-Specific Convenience Hooks

**User Story:** As a developer, I want role-specific hooks for common use cases, so that I can use simple APIs without passing role parameters repeatedly.

#### Acceptance Criteria

1. THE Messaging_System SHALL provide useStudentMessages hook that wraps the base hook with userRole="learner"
2. THE Messaging_System SHALL provide useEducatorMessages hook that wraps the base hook with userRole="educator"
3. THE Messaging_System SHALL provide useRecruiterMessages hook that wraps the base hook with userRole="recruiter"
4. THE Messaging_System SHALL provide useAdminMessages hook that wraps the base hook with appropriate admin role
5. WHERE a role-specific hook is used, THE hook SHALL delegate all logic to the base hook
6. THE role-specific hooks SHALL have minimal implementation (wrapper only, no duplicated logic)

### Requirement 8: Unread Count Management

**User Story:** As a user, I want accurate unread message counts, so that I know when I have new messages.

#### Acceptance Criteria

1. THE Messaging_System SHALL provide a single source of truth for Unread_Count
2. WHEN a new unread message arrives, THE Messaging_System SHALL increment the Unread_Count
3. WHEN a message is marked as read, THE Messaging_System SHALL decrement the Unread_Count
4. WHEN a conversation is opened, THE Messaging_System SHALL provide a method to clear unread count for that conversation
5. THE Messaging_System SHALL fetch initial Unread_Count from the server on mount
6. THE Messaging_System SHALL update Unread_Count via real-time subscriptions
7. THE Unread_Count SHALL never be negative

### Requirement 9: Centralized Query Key Factory

**User Story:** As a developer, I want a centralized Query_Key_Factory, so that cache invalidation works correctly and query keys are consistent across all hooks.

#### Acceptance Criteria

1. THE Messaging_System SHALL provide a Query_Key_Factory that generates all messaging-related query keys
2. THE Query_Key_Factory SHALL replace hardcoded query key strings like ['college-admin-messages', conversationId]
3. THE Query_Key_Factory SHALL use queryKeys.messages.conversation(conversationId) for conversation messages
4. THE Query_Key_Factory SHALL use queryKeys.messages.conversations(userId, userRole, conversationType) for conversations list
5. THE Query_Key_Factory SHALL use queryKeys.messages.unreadCount(userId, userRole) for unread counts
6. WHEN a message is sent, THE Messaging_System SHALL invalidate the appropriate conversation query using the Query_Key_Factory
7. WHEN a conversation is updated, THE Messaging_System SHALL invalidate the conversations list query using the Query_Key_Factory
8. THE Query_Key_Factory SHALL be defined in shared/lib/queryKeys and exported through the messaging feature index

### Requirement 10: TypeScript Type Safety

**User Story:** As a developer, I want full TypeScript type safety, so that I catch errors at compile time.

#### Acceptance Criteria

1. THE Messaging_System SHALL define User_Role as: 'learner' | 'recruiter' | 'educator' | 'college_educator' | 'school_admin' | 'college_admin' | 'university_admin'
2. THE Messaging_System SHALL define Conversation_Type as: 'learner_recruiter' | 'learner_educator' | 'educator_recruiter' | 'learner_admin' | 'learner_college_admin' | 'learner_college_educator' | 'educator_admin' | 'college_educator_admin'
3. THE Messaging_System SHALL NOT use "any" type except where absolutely necessary with justification comments
4. WHEN User_Role types mismatch between hook and service, THE Messaging_System SHALL provide type adapters or guards
5. THE Messaging_System SHALL export all public types through index.ts barrel files
6. THE Messaging_System SHALL pass TypeScript strict mode compilation without errors
7. THE Messaging_System SHALL provide type aliases for backward compatibility (e.g., college_lecturer → college_educator)

### Requirement 11: Backward Compatibility During Migration

**User Story:** As a developer, I want to migrate hooks incrementally, so that I can avoid breaking the entire application.

#### Acceptance Criteria

1. THE Messaging_System SHALL maintain existing hook APIs during migration
2. WHEN a legacy hook is replaced, THE Messaging_System SHALL provide a deprecation notice in comments
3. THE Messaging_System SHALL allow both old and new hooks to coexist temporarily
4. THE Messaging_System SHALL provide a migration guide for each deprecated hook
5. WHEN all consumers migrate to new hooks, THE Messaging_System SHALL remove deprecated hooks

### Requirement 12: Performance Optimization

**User Story:** As a user, I want fast messaging performance, so that the UI remains responsive.

#### Acceptance Criteria

1. THE Messaging_System SHALL use React Query staleTime to prevent unnecessary refetches
2. THE Messaging_System SHALL use Zustand selectors to prevent unnecessary re-renders
3. WHEN messages are sorted, THE Messaging_System SHALL sort by created_at timestamp
4. WHEN conversations are sorted, THE Messaging_System SHALL sort by last_message_at timestamp
5. THE Messaging_System SHALL debounce typing indicator updates to reduce network traffic
6. THE Messaging_System SHALL batch multiple state updates into single renders where possible

### Requirement 13: Error Handling

**User Story:** As a user, I want clear error messages when messaging fails, so that I understand what went wrong.

#### Acceptance Criteria

1. WHEN a message send fails, THE Messaging_System SHALL display a user-friendly error message
2. WHEN a real-time subscription fails, THE Messaging_System SHALL attempt to reconnect
3. WHEN a query fails, THE Messaging_System SHALL expose the error through the hook return value
4. THE Messaging_System SHALL log errors to the console for debugging
5. WHEN network is unavailable, THE Messaging_System SHALL queue messages for retry (optional enhancement)

### Requirement 14: Testing Support

**User Story:** As a developer, I want testable messaging hooks, so that I can write reliable tests.

#### Acceptance Criteria

1. THE Messaging_System SHALL allow mocking of MessageService for unit tests
2. THE Messaging_System SHALL allow mocking of Message_Store for component tests
3. THE Messaging_System SHALL provide test utilities for common messaging scenarios
4. THE Messaging_System SHALL not depend on global state that cannot be reset between tests

### Requirement 15: Career Assistant Separation

**User Story:** As a developer, I want career assistant messaging separate from user messaging, so that the two systems don't interfere.

#### Acceptance Criteria

1. THE Messaging_System SHALL NOT consolidate career assistant hooks (useCareerConversations, useOptimizedMessages, useConversationSwitcher)
2. THE Career_Assistant hooks SHALL remain in their current location
3. THE Messaging_System documentation SHALL clarify that Career_Assistant is a separate system
4. WHERE Career_Assistant and Messaging_System share types, THE types SHALL be defined in shared layer

### Requirement 16: Duplicate File Removal

**User Story:** As a developer, I want duplicate files removed, so that the codebase is maintainable.

#### Acceptance Criteria

1. WHEN consolidation is complete, THE Messaging_System SHALL remove src/stores/useMessageStore.ts (exact duplicate)
2. THE Messaging_System SHALL keep src/features/messaging/model/useMessageStore.ts as the canonical Message_Store
3. THE Messaging_System SHALL update all imports from @/stores/useMessageStore to @/features/messaging
4. THE Messaging_System SHALL remove all deprecated hooks after migration is complete
5. THE Messaging_System SHALL reduce total messaging-related code by at least 3500 lines
6. THE Messaging_System SHALL consolidate 42 hooks into the base hook plus role-specific wrappers

### Requirement 17: Typing Indicator Support

**User Story:** As a user, I want to see when someone is typing, so that I know they are composing a response.

#### Acceptance Criteria

1. THE Messaging_System SHALL provide useTypingIndicator hook
2. WHEN a user types in a conversation, THE Messaging_System SHALL broadcast typing status
3. WHEN typing status is received, THE Messaging_System SHALL display typing indicator for 3 seconds
4. THE Messaging_System SHALL debounce typing broadcasts to once per 2 seconds
5. THE typing indicator SHALL automatically clear after 3 seconds of no typing updates

### Requirement 18: Message Notifications Support

**User Story:** As a user, I want notification support for new messages, so that I can integrate with notification systems.

#### Acceptance Criteria

1. THE Messaging_System SHALL provide useMessageNotifications hook
2. WHEN a new message arrives, THE Messaging_System SHALL emit a notification event
3. THE notification event SHALL include message text, sender info, and conversation ID
4. THE Messaging_System SHALL allow enabling/disabling notifications via hook parameter
5. THE Messaging_System SHALL NOT display notifications for messages sent by the current user

### Requirement 19: Cache Coordination

**User Story:** As a developer, I want coordinated caching across all Cache_Layer instances, so that state remains consistent and performance is optimized.

#### Acceptance Criteria

1. THE Messaging_System SHALL coordinate between MessageService Map cache, React Query cache, and Zustand store
2. WHEN MessageService cache is updated, THE Messaging_System SHALL invalidate corresponding React Query cache entries
3. WHEN React Query cache is updated, THE Messaging_System SHALL update Zustand store if the data is currently displayed
4. THE Messaging_System SHALL define cache invalidation rules for each mutation (sendMessage, markAsRead, deleteConversation)
5. THE Messaging_System SHALL use React Query's staleTime and gcTime to prevent unnecessary cache refreshes
6. WHEN a cache miss occurs in MessageService, THE Messaging_System SHALL fetch from Supabase and populate all Cache_Layer instances
7. THE Messaging_System SHALL document the caching strategy and invalidation rules

### Requirement 20: Centralized Duplicate Detection

**User Story:** As a developer, I want centralized Duplicate_Detection logic, so that duplicate prevention is consistent across all hooks.

#### Acceptance Criteria

1. THE Message_Store SHALL provide a centralized method for Duplicate_Detection
2. THE Duplicate_Detection logic SHALL check if a message with the same ID already exists before adding
3. WHEN a real-time message arrives during an optimistic update, THE Messaging_System SHALL use Duplicate_Detection to prevent duplicates
4. THE Duplicate_Detection pattern `messages.some(m => m.id === message.id)` SHALL be replaced with the centralized method
5. THE Messaging_System SHALL remove all per-hook duplicate detection implementations
6. THE Duplicate_Detection method SHALL handle both numeric IDs and temporary string IDs (temp_${timestamp})

### Requirement 21: Consistent clearUnreadCount API

**User Story:** As a developer, I want a consistent clearUnreadCount API, so that marking conversations as read works the same way across all hooks.

#### Acceptance Criteria

1. THE Messaging_System SHALL provide a single clearUnreadCount method signature across all hooks
2. THE clearUnreadCount method SHALL accept conversationId as a parameter
3. THE clearUnreadCount method SHALL return a function (not use useRef pattern)
4. WHEN clearUnreadCount is called, THE Messaging_System SHALL optimistically set the unread count to 0 in the cache
5. WHEN clearUnreadCount is called, THE Messaging_System SHALL call MessageService.markConversationAsRead
6. THE clearUnreadCount method SHALL handle Admin_Role unread count fields (admin_unread_count, college_admin_unread_count)
7. THE Messaging_System SHALL remove all useRef-based clearUnreadCount implementations

### Requirement 22: Conversation Restoration

**User Story:** As a user, I want to restore deleted conversations, so that I can recover accidentally deleted message threads.

#### Acceptance Criteria

1. THE Messaging_System SHALL provide a restoreConversation mutation
2. WHEN a conversation is soft-deleted, THE Messaging_System SHALL set deleted_by_{role} to true
3. WHEN restoreConversation is called, THE Messaging_System SHALL set deleted_by_{role} to false
4. THE Messaging_System SHALL support restoration for all User_Role types
5. WHEN a conversation is restored, THE Messaging_System SHALL invalidate the conversations list query
6. THE restored conversation SHALL appear in the conversations list with its original messages intact
7. THE Messaging_System SHALL provide UI affordance for conversation restoration (WhatsApp-style undelete)

### Requirement 23: Naming Consistency

**User Story:** As a developer, I want consistent naming across the codebase, so that I can avoid confusion between synonymous terms.

#### Acceptance Criteria

1. THE Messaging_System SHALL use "college_educator" consistently (not "college_lecturer")
2. WHEN existing code uses "college_lecturer", THE Messaging_System SHALL provide type aliases for backward compatibility
3. THE Messaging_System SHALL document the canonical term "college_educator" in the Glossary
4. THE Messaging_System SHALL update all new code to use "college_educator"
5. THE Messaging_System SHALL provide a migration path for renaming college_lecturer to college_educator

### Requirement 24: Conversation Type Coverage

**User Story:** As a developer, I want support for all Conversation_Type values, so that the system handles all messaging scenarios.

#### Acceptance Criteria

1. THE Messaging_System SHALL support learner_recruiter conversation type
2. THE Messaging_System SHALL support learner_educator conversation type
3. THE Messaging_System SHALL support educator_recruiter conversation type
4. THE Messaging_System SHALL support learner_admin conversation type (school_admin)
5. THE Messaging_System SHALL support learner_college_admin conversation type
6. THE Messaging_System SHALL support learner_college_educator conversation type
7. THE Messaging_System SHALL support educator_admin conversation type
8. THE Messaging_System SHALL support college_educator_admin conversation type
9. THE Messaging_System SHALL reject invalid Conversation_Type values at compile time

### Requirement 25: Unified Conversation Creation

**User Story:** As a developer, I want a single conversation creation hook, so that I can eliminate 6 separate useCreate*Conversation hooks.

#### Acceptance Criteria

1. THE Messaging_System SHALL provide a single createConversation mutation that handles all conversation types
2. THE createConversation mutation SHALL accept userId, userRole, otherUserId, and conversationType parameters
3. WHEN createConversation is called, THE Messaging_System SHALL create a conversation with the appropriate type
4. THE createConversation mutation SHALL be type-safe based on User_Role and Conversation_Type
5. THE Messaging_System SHALL remove useCreateStudentAdminConversation, useCreateStudentCollegeAdminConversation, useCreateStudentCollegeLecturerConversation, useCreateStudentEducatorConversation, and useCreateCollegeLecturerConversation hooks
6. WHEN a conversation already exists between two users, THE createConversation mutation SHALL return the existing conversation
7. THE createConversation mutation SHALL invalidate the conversations list query after successful creation

### Requirement 26: Unified Conversation Actions

**User Story:** As a developer, I want a single hook for conversation actions, so that I can eliminate multiple action hooks.

#### Acceptance Criteria

1. THE Messaging_System SHALL provide useConversationActions hook that handles archive, unarchive, and delete operations
2. THE useConversationActions hook SHALL support all User_Role types
3. WHEN archiveConversation is called, THE Messaging_System SHALL set archived_by_{role} to true
4. WHEN unarchiveConversation is called, THE Messaging_System SHALL set archived_by_{role} to false
5. WHEN deleteConversation is called, THE Messaging_System SHALL set deleted_by_{role} to true
6. THE Messaging_System SHALL remove useCollegeLecturerConversationActions and similar role-specific action hooks
7. THE useConversationActions hook SHALL invalidate the conversations list query after each action

### Requirement 27: Unified Conversation Fetching

**User Story:** As a developer, I want the base hook to provide both messages and conversations, so that I can eliminate separate conversation hooks.

#### Acceptance Criteria

1. THE base useMessages hook SHALL return both messages and conversations in its return value
2. WHEN conversationId is provided, THE hook SHALL return messages for that conversation
3. WHEN conversationId is not provided, THE hook SHALL return the conversations list
4. THE Messaging_System SHALL remove useStudentConversations, useCollegeAdminConversations, useCollegeLecturerConversations, and similar separate conversation hooks
5. THE conversations list SHALL include last message, unread count, and participant information
6. THE conversations list SHALL be sorted by last_message_at timestamp in descending order
7. THE hook SHALL provide both messages and conversations simultaneously when needed for UI components

### Requirement 28: Eliminate Convenience Method Duplication

**User Story:** As a developer, I want to eliminate convenience method duplication, so that all sending goes through the base hook.

#### Acceptance Criteria

1. THE Messaging_System SHALL remove useCollegeLecturerSendMessage and similar convenience method hooks
2. THE base useMessages hook SHALL provide the sendMessage mutation directly
3. ALL message sending SHALL go through the base hook's sendMessage mutation
4. THE Messaging_System SHALL NOT create role-specific send methods
5. WHEN a component needs to send a message, THE component SHALL use the sendMessage mutation from useMessages or role-specific wrapper hooks
6. THE sendMessage mutation SHALL handle all User_Role types without requiring separate implementations


